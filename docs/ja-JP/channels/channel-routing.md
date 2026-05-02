---
read_when:
    - チャンネルルーティングまたは受信トレイの動作を変更する
summary: チャネル（WhatsApp、Telegram、Discord、Slack）ごとのルーティングルールと共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-05-02T04:48:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# チャネルとルーティング

OpenClaw は返信を**メッセージの送信元チャネルへ戻します**。
モデルはチャネルを選びません。ルーティングは決定的で、ホスト設定によって制御されます。

## 主要用語

- **チャネル**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`、および Plugin チャネル。`webchat` は内部 WebChat UI チャネルであり、設定可能なアウトバウンドチャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス（サポートされている場合）。
- オプションのチャネルデフォルトアカウント: `channels.<channel>.defaultAccount` は、
  アウトバウンドパスで `accountId` が指定されていない場合に使用されるアカウントを選びます。
  - 複数アカウント構成では、2 つ以上のアカウントが設定されている場合、明示的なデフォルト（`defaultAccount` または `accounts.default`）を設定してください。設定しない場合、フォールバックルーティングが最初に正規化されたアカウント ID を選ぶことがあります。
- **AgentId**: 分離されたワークスペース + セッションストア（「brain」）。
- **SessionKey**: コンテキストの保存と同時実行制御に使われるバケットキー。

## アウトバウンドターゲットのプレフィックス

明示的なアウトバウンドターゲットには、`telegram:123` や `tg:123` のようなプロバイダープレフィックスを含めることができます。Core は、選択されたチャネルが `last` であるか未解決の場合にのみ、かつ読み込まれた Plugin がそのプレフィックスを公開している場合にのみ、そのプレフィックスをチャネル選択のヒントとして扱います。呼び出し元がすでに明示的なチャネルを選択している場合、プロバイダープレフィックスはそのチャネルと一致している必要があります。WhatsApp 配信を `telegram:123` に行うようなチャネルをまたぐ組み合わせは、Plugin 固有のターゲット正規化の前に失敗します。

`channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, `sms:<number>` のようなターゲット種別およびサービスプレフィックスは、選択されたチャネルの文法内に留まります。それ自体でプロバイダーを選択することはありません。

## セッションキーの形状（例）

デフォルトでは、ダイレクトメッセージはエージェントの **main** セッションに集約されます。

- `agent:<agentId>:<mainKey>`（デフォルト: `agent:main:main`）

ダイレクトメッセージの会話履歴が main と共有される場合でも、外部 DM では、サンドボックスと
ツールポリシーはアカウントごとに派生したダイレクトチャット実行時キーを使います。
これにより、チャネル由来のメッセージが local main-session 実行のように扱われることを防ぎます。

グループとチャネルはチャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord スレッドはベースキーに `:thread:<threadId>` を追加します。
- Telegram フォーラムトピックはグループキーに `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Main DM ルートの固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つの main セッションを共有できます。
セッションの `lastRoute` が所有者ではない DM によって上書きされるのを防ぐため、
OpenClaw は以下がすべて true の場合、`allowFrom` から固定所有者を推定します。

- `allowFrom` にワイルドカードではないエントリがちょうど 1 つだけある。
- そのエントリを、そのチャネルの具体的な送信者 ID に正規化できる。
- 受信 DM の送信者がその固定所有者と一致しない。

この不一致の場合でも、OpenClaw は受信セッションメタデータを記録しますが、
main セッションの `lastRoute` の更新はスキップします。

## 保護された受信記録

チャネル Plugin は、保護されたパスで新しい OpenClaw セッションを作成してはならない場合、受信セッションレコードを `createIfMissing: false` としてマークできます。このモードでは、OpenClaw は既存セッションのメタデータと `lastRoute` を更新できますが、メッセージが観測されたという理由だけでルート専用のセッションエントリを作成することはありません。

## ルーティングルール（エージェントの選択方法）

ルーティングは各受信メッセージに対して**1 つのエージェント**を選びます。

1. **完全なピア一致**（`peer.kind` + `peer.id` を持つ `bindings`）。
2. **親ピア一致**（スレッド継承）。
3. **ギルド + ロール一致**（Discord）。`guildId` + `roles` による。
4. **ギルド一致**（Discord）。`guildId` による。
5. **チーム一致**（Slack）。`teamId` による。
6. **アカウント一致**（チャネル上の `accountId`）。
7. **チャネル一致**（そのチャネル上の任意のアカウント、`accountId: "*"`）。
8. **デフォルトエージェント**（`agents.list[].default`、なければリストの最初のエントリ、フォールバックは `main`）。

バインディングに複数の一致フィールド（`peer`, `guildId`, `teamId`, `roles`）が含まれる場合、そのバインディングが適用されるには、**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、使用されるワークスペースとセッションストアが決まります。

## ブロードキャストグループ（複数エージェントを実行）

ブロードキャストグループを使うと、同じピアに対して、**OpenClaw が通常返信する場合に**（例: WhatsApp グループでメンション/アクティベーションゲートを通過した後）、**複数のエージェント**を実行できます。

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

## 設定の概要

- `agents.list`: 名前付きエージェント定義（ワークスペース、モデルなど）。
- `bindings`: 受信チャネル/アカウント/ピアをエージェントにマッピングします。

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

セッションストアは状態ディレクトリ（デフォルトは `~/.openclaw`）の下にあります。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアの横に配置されます

`session.store` と `{agentId}` テンプレートを使って、ストアパスを上書きできます。

Gateway と ACP のセッション検出は、デフォルトの `agents/` ルート配下、およびテンプレート化された `session.store` ルート配下にある、ディスクに backed されたエージェントストアもスキャンします。検出されたストアは、解決されたそのエージェントルート内に留まっており、通常の `sessions.json` ファイルを使う必要があります。シンボリックリンクとルート外パスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**にアタッチし、デフォルトではそのエージェントの main
セッションを使います。このため、WebChat では、そのエージェントのチャネル横断コンテキストを 1 か所で確認できます。

## 返信コンテキスト

受信返信には以下が含まれます。

- 利用可能な場合は `ReplyToId`, `ReplyToBody`, `ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

これはチャネル間で一貫しています。

## 関連

- [グループ](/ja-JP/channels/groups)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [ペアリング](/ja-JP/channels/pairing)
