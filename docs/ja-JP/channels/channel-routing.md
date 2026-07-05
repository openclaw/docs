---
read_when:
    - チャネルルーティングまたは受信トレイの動作を変更する
summary: チャンネル別（WhatsApp、Telegram、Discord、Slack）のルーティングルールと共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-07-05T11:02:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ffd204de57a3ff991953a7907d86b1a93f8af14a71ee410e9dcc36336f49d3f
    source_path: channels/channel-routing.md
    workflow: 16
---

# チャンネルとルーティング

OpenClaw は返信を**メッセージの送信元チャンネルへ戻す**ようにルーティングします。
モデルはチャンネルを選択しません。ルーティングは決定的で、ホスト設定によって制御されます。

## 主要用語

- **チャンネル**: `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram`、`whatsapp` などの同梱チャンネル Plugin と、インストール済み Plugin のチャンネル。`webchat` は内部 WebChat UI チャンネルであり、設定可能なアウトバウンドチャンネルではありません。
- **AccountId**: チャンネルごとのアカウントインスタンス（対応している場合）。
- 任意のチャンネル既定アカウント: `channels.<channel>.defaultAccount` は、
  アウトバウンドパスが `accountId` を指定しない場合に使用されるアカウントを選択します。
  - 複数アカウント構成では、2 つ以上のアカウントが設定されている場合、明示的な既定値（`defaultAccount` または `default` という名前のアカウント）を設定してください。設定しない場合、フォールバックルーティングが最初に正規化されたアカウント ID を選ぶことがあります。
- **AgentId**: 分離されたワークスペース + セッションストア（「brain」）。
- **SessionKey**: コンテキストの保存と同時実行制御に使用されるバケットキー。

## アウトバウンドターゲットのプレフィックス

明示的なアウトバウンドターゲットには、`telegram:123` や `tg:123` のようなプロバイダープレフィックスを含めることができます。Core は、選択されたチャンネルが `last` であるか未解決の場合にのみ、かつ読み込まれた Plugin がそのプレフィックスを公開している場合にのみ、そのプレフィックスをチャンネル選択のヒントとして扱います。呼び出し元がすでに明示的なチャンネルを選択している場合、プロバイダープレフィックスはそのチャンネルと一致している必要があります。WhatsApp 配信を `telegram:123` に送るようなチャンネル横断の組み合わせは、Plugin 固有のターゲット正規化の前に失敗します。

`channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>`、`sms:<number>` などのターゲット種別とサービスのプレフィックスは、選択されたチャンネルの文法内にとどまります。それ自体ではプロバイダーを選択しません。

## セッションキーの形（例）

ダイレクトメッセージは既定でエージェントの**main**セッションに集約されます。

- `agent:<agentId>:<mainKey>`（既定: `agent:main:main`）

`session.dmScope` は DM の集約を制御します。`main`（既定）は 1 つの main
セッションを共有し、`per-peer`、`per-channel-peer`、`per-account-channel-peer`
は DM を別々のセッションに保持します。ルートバインディングは、一致したピアに対して
`bindings[].session.dmScope` によりスコープを上書きできます。

ダイレクトメッセージの会話履歴が main と共有されている場合でも、外部 DM ではサンドボックスと
ツールポリシーがアカウントごとに派生したダイレクトチャット実行時キーを使用するため、
チャンネル由来のメッセージがローカルの main セッション実行のように扱われることはありません。

グループとチャンネルはチャンネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャンネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord のスレッドは、ベースキーに `:thread:<threadId>` を追加します。
- Telegram のフォーラムトピックは、グループキーに `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main DM ルートの固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つの main セッションを共有することがあります。
セッションの `lastRoute` が所有者ではない DM によって上書きされるのを防ぐため、OpenClaw は以下がすべて真の場合に `allowFrom` から固定所有者を推論します。

- `allowFrom` にワイルドカードではないエントリがちょうど 1 つある。
- そのエントリをそのチャンネルの具体的な送信者 ID に正規化できる。
- 受信 DM の送信者がその固定所有者と一致しない。

この不一致の場合でも、OpenClaw は受信セッションメタデータを記録しますが、
main セッションの `lastRoute` の更新はスキップします。

## ガード付き受信記録

チャンネル Plugin は、ガード付きパスで新しい OpenClaw セッションを作成してはならない場合、受信セッションレコードを `createIfMissing: false` としてマークできます。このモードでは、
OpenClaw は既存セッションのメタデータと `lastRoute` を更新することがありますが、
メッセージが観測されたという理由だけでルート専用のセッションエントリを作成することはありません。

## ルーティングルール（エージェントの選択方法）

ルーティングは受信メッセージごとに**1 つのエージェント**を選択します。

1. **完全なピア一致**（`peer.kind` + `peer.id` を持つ `bindings`）。
2. **親ピア一致**（スレッド継承）。
3. **ピアワイルドカード一致**（ピア種別に対する `peer.id: "*"`）。
4. **ギルド + ロール一致**（Discord）: `guildId` + `roles` による。
5. **ギルド一致**（Discord）: `guildId` による。
6. **チーム一致**（Slack）: `teamId` による。
7. **アカウント一致**（チャンネル上の `accountId`）。
8. **チャンネル一致**（そのチャンネル上の任意のアカウント、`accountId: "*"`）。
9. **既定エージェント**（`agents.list[].default`、なければリストの最初のエントリ、フォールバックは `main`）。

バインディングに複数の一致フィールド（`peer`、`guildId`、`teamId`、`roles`）が含まれる場合、そのバインディングが適用されるには**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントにより、使用されるワークスペースとセッションストアが決まります。

## ブロードキャストグループ（複数エージェントを実行）

ブロードキャストグループを使うと、**OpenClaw が通常返信する場合**（例: WhatsApp グループでのメンション/アクティベーションゲート後）に、同じピアに対して**複数のエージェント**を実行できます。

設定:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

参照: [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)。

## 設定概要

- `agents.list`: 名前付きエージェント定義（ワークスペース、モデルなど）。
- `bindings`: 受信チャンネル/アカウント/ピアをエージェントにマッピングします。

例:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## セッションストレージ

セッションストアは状態ディレクトリ（既定は `~/.openclaw`）の下にあります。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアの横に置かれます

`session.store` と `{agentId}` テンプレートを使ってストアパスを上書きできます。

Gateway と ACP のセッション検出は、既定の `agents/` ルート配下とテンプレート化された `session.store` ルート配下にあるディスク backed のエージェントストアもスキャンします。検出された
ストアは、解決されたそのエージェントルート内にとどまり、通常の
`sessions.json` ファイルを使用する必要があります。シンボリックリンクとルート外パスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**に接続し、既定ではそのエージェントの main
セッションを使用します。このため、WebChat ではそのエージェントのチャンネル横断コンテキストを
1 か所で確認できます。

## 返信コンテキスト

受信返信には以下が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

これはチャンネル間で一貫しています。

## 関連

- [グループ](/ja-JP/channels/groups)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [ペアリング](/ja-JP/channels/pairing)
