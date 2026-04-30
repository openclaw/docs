---
read_when:
    - チャンネルのルーティングまたは受信トレイの動作の変更
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-04-30T04:58:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# チャネルとルーティング

OpenClaw は返信を**メッセージの送信元チャネルへ戻します**。
モデルがチャネルを選ぶことはありません。ルーティングは決定的で、ホスト設定によって制御されます。

## 主要用語

- **チャネル**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`、および Plugin チャネル。`webchat` は内部 WebChat UI チャネルであり、設定可能な送信チャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス（サポートされる場合）。
- 任意のチャネル既定アカウント: `channels.<channel>.defaultAccount` は、
  送信パスで `accountId` が指定されていない場合に使用されるアカウントを選びます。
  - 複数アカウント構成では、2つ以上のアカウントが設定されている場合、明示的な既定値（`defaultAccount` または `accounts.default`）を設定してください。設定しないと、フォールバックルーティングが最初に正規化されたアカウント ID を選ぶ場合があります。
- **AgentId**: 分離されたワークスペース + セッションストア（「brain」）。
- **SessionKey**: コンテキストの保存と並行実行の制御に使われるバケットキー。

## セッションキーの形式（例）

ダイレクトメッセージは既定でエージェントの **main** セッションに集約されます。

- `agent:<agentId>:<mainKey>`（既定: `agent:main:main`）

ダイレクトメッセージの会話履歴が main と共有される場合でも、サンドボックスと
ツールポリシーは、外部 DM に対してアカウントごとの派生ダイレクトチャットランタイムキーを使用します。
これにより、チャネル由来のメッセージがローカルの main セッション実行のように扱われないようにします。

グループとチャネルはチャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord スレッドはベースキーに `:thread:<threadId>` を追加します。
- Telegram フォーラムトピックはグループキーに `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main DM ルートの固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは1つの main セッションを共有する場合があります。
セッションの `lastRoute` が所有者ではない DM によって上書きされるのを防ぐため、
OpenClaw は次の条件がすべて true の場合に、`allowFrom` から固定所有者を推定します。

- `allowFrom` にワイルドカードではないエントリがちょうど1つある。
- そのエントリをそのチャネルの具体的な送信者 ID に正規化できる。
- 受信 DM の送信者が、その固定所有者と一致しない。

この不一致の場合でも、OpenClaw は受信セッションメタデータを記録しますが、
main セッションの `lastRoute` の更新はスキップします。

## ガードされた受信記録

チャネル Plugin は、ガードされたパスが新しい OpenClaw セッションを作成してはならない場合、
受信セッションレコードを `createIfMissing: false` としてマークできます。このモードでは、
OpenClaw は既存セッションのメタデータと `lastRoute` を更新する場合がありますが、
メッセージが観測されたという理由だけでルート専用のセッションエントリを作成することはありません。

## ルーティングルール（エージェントの選択方法）

ルーティングは受信メッセージごとに**1つのエージェント**を選びます。

1. **完全なピア一致**（`peer.kind` + `peer.id` を含む `bindings`）。
2. **親ピア一致**（スレッド継承）。
3. **ギルド + ロール一致**（Discord）: `guildId` + `roles`。
4. **ギルド一致**（Discord）: `guildId`。
5. **チーム一致**（Slack）: `teamId`。
6. **アカウント一致**（チャネル上の `accountId`）。
7. **チャネル一致**（そのチャネル上の任意のアカウント、`accountId: "*"`）。
8. **既定エージェント**（`agents.list[].default`、なければリストの最初のエントリ、フォールバックは `main`）。

バインディングに複数の一致フィールド（`peer`, `guildId`, `teamId`, `roles`）が含まれる場合、そのバインディングが適用されるには**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、使用されるワークスペースとセッションストアが決まります。

## ブロードキャストグループ（複数エージェントの実行）

ブロードキャストグループを使うと、OpenClaw が通常返信する場合（例: WhatsApp グループで、メンション/アクティベーションゲートを通過した後）に、同じピアに対して**複数のエージェント**を実行できます。

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
- `bindings`: 受信チャネル/アカウント/ピアをエージェントにマップします。

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

セッションストアは状態ディレクトリ（既定は `~/.openclaw`）配下にあります。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアと同じ場所にあります

`session.store` と `{agentId}` テンプレートによってストアパスを上書きできます。

Gateway と ACP のセッション検出も、既定の `agents/` ルート配下と、
テンプレート化された `session.store` ルート配下にあるディスクベースのエージェントストアをスキャンします。検出されるストアは、
解決されたそのエージェントルート内にとどまり、通常の `sessions.json` ファイルを使用する必要があります。
シンボリックリンクとルート外パスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**に接続し、既定でそのエージェントの main
セッションを使用します。このため、WebChat ではそのエージェントのチャネル横断コンテキストを1か所で確認できます。

## 返信コンテキスト

受信返信には次が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

これはチャネル間で一貫しています。

## 関連

- [グループ](/ja-JP/channels/groups)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [ペアリング](/ja-JP/channels/pairing)
