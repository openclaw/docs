---
read_when:
    - チャネルルーティングまたは受信トレイの動作を変更する
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-04-24T04:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# チャネルとルーティング

OpenClawは、返信を**メッセージが来たチャネルに返します**。モデルがチャネルを選ぶことはありません。ルーティングは決定的であり、ホスト設定によって制御されます。

## 主要な用語

- **チャネル**: `telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`、およびプラグインチャネル。`webchat` は内部のWebChat UIチャネルであり、設定可能な送信先チャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス（サポートされている場合）。
- オプションのチャネル既定アカウント: `channels.<channel>.defaultAccount` は、送信パスで `accountId` が指定されていない場合に使用するアカウントを選択します。
  - 複数アカウント構成では、2つ以上のアカウントが設定されている場合、明示的な既定値（`defaultAccount` または `accounts.default`）を設定してください。これがないと、フォールバックルーティングが最初に正規化されたアカウントIDを選ぶことがあります。
- **AgentId**: 分離されたワークスペース + セッションストア（「brain」）。
- **SessionKey**: コンテキストの保存と並行性の制御に使われるバケットキー。

## SessionKeyの形状（例）

ダイレクトメッセージは、デフォルトでエージェントの**main**セッションに集約されます。

- `agent:<agentId>:<mainKey>`（デフォルト: `agent:main:main`）

ダイレクトメッセージの会話履歴がmainと共有される場合でも、外部DMではサンドボックスとツールポリシーにアカウントごとの派生direct-chatランタイムキーが使われるため、チャネル由来のメッセージはローカルのmainセッション実行のようには扱われません。

グループとチャネルは、チャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discordのスレッドは、ベースキーに `:thread:<threadId>` を追加します。
- Telegramのフォーラムトピックは、グループキーに `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main DMルートのピン留め

`session.dmScope` が `main` の場合、ダイレクトメッセージは1つのmainセッションを共有することがあります。
所有者以外のDMによってセッションの `lastRoute` が上書きされないようにするため、OpenClawは次のすべてが真であるとき、`allowFrom` からピン留めされた所有者を推論します。

- `allowFrom` に、ワイルドカードではないエントリがちょうど1つある。
- そのエントリを、そのチャネルの具体的な送信者IDに正規化できる。
- 受信DMの送信者が、そのピン留めされた所有者と一致しない。

この不一致の場合でも、OpenClawは受信セッションメタデータを記録しますが、mainセッションの `lastRoute` の更新はスキップします。

## ルーティングルール（エージェントの選び方）

ルーティングは、受信メッセージごとに**1つのエージェント**を選びます。

1. **完全なピア一致**（`peer.kind` + `peer.id` を持つ `bindings`）。
2. **親ピア一致**（スレッド継承）。
3. **guild + roles一致**（Discord）`guildId` + `roles` 経由。
4. **guild一致**（Discord）`guildId` 経由。
5. **team一致**（Slack）`teamId` 経由。
6. **アカウント一致**（チャネル上の `accountId`）。
7. **チャネル一致**（そのチャネル上の任意のアカウント、`accountId: "*"`）。
8. **既定エージェント**（`agents.list[].default`、なければ最初のリストエントリ、フォールバックは `main`）。

バインディングに複数の一致フィールド（`peer`、`guildId`、`teamId`、`roles`）が含まれる場合、そのバインディングが適用されるには**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、どのワークスペースとセッションストアを使うかが決まります。

## ブロードキャストグループ（複数エージェントを実行）

ブロードキャストグループを使うと、**OpenClawが通常返信する場面で**、同じピアに対して**複数のエージェント**を実行できます（たとえば、WhatsAppグループでのメンション/アクティベーションゲーティング後）。

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
- `bindings`: 受信チャネル/アカウント/ピアをエージェントに対応付けるマップ。

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
- JSONLトランスクリプトはストアと同じ場所に保存されます

`session.store` と `{agentId}` テンプレートを使って、ストアパスを上書きできます。

GatewayとACPのセッション検出では、デフォルトの `agents/` ルートの下と、テンプレート化された `session.store` ルートの下にあるディスクベースのエージェントストアも走査します。検出されるストアは、その解決済みエージェントルート内にとどまり、通常の `sessions.json` ファイルを使用している必要があります。シンボリックリンクとルート外のパスは無視されます。

## WebChatの動作

WebChatは**選択されたエージェント**に接続し、デフォルトではそのエージェントのmainセッションを使います。このため、WebChatではそのエージェントのチャネル横断コンテキストを1か所で確認できます。

## 返信コンテキスト

受信返信には次が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

これはチャネル間で一貫しています。

## 関連

- [グループ](/ja-JP/channels/groups)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [ペアリング](/ja-JP/channels/pairing)
