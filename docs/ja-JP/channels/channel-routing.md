---
read_when:
    - チャネルルーティングまたは受信トレイの動作の変更
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-04-23T13:57:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1101d9d3411d9e9f48efd14c0dab09d76e83a6bd93c713d38efc01a14c8391
    source_path: channels/channel-routing.md
    workflow: 15
---

# チャネルとルーティング

OpenClawは返信を**メッセージが来たチャネルに戻して**ルーティングします。モデルがチャネルを選ぶことはありません。ルーティングは決定的で、ホスト設定によって制御されます。

## 主要な用語

- **チャネル**: `telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`、およびプラグインチャネル。`webchat` は内部WebChat UIチャネルであり、設定可能な送信先チャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス（サポートされている場合）。
- オプションのチャネル既定アカウント: `channels.<channel>.defaultAccount` は、送信経路で `accountId` が指定されていない場合にどのアカウントを使うかを選択します。
  - マルチアカウント構成では、2つ以上のアカウントが設定されているときは明示的な既定値（`defaultAccount` または `accounts.default`）を設定してください。これがないと、フォールバックルーティングが正規化後の最初のアカウントIDを選ぶことがあります。
- **AgentId**: 分離されたワークスペース + セッションストア（「brain」）。
- **SessionKey**: コンテキストの保存と並行実行の制御に使われるバケットキー。

## SessionKey の形状（例）

ダイレクトメッセージは、既定でエージェントの**main**セッションに集約されます。

- `agent:<agentId>:<mainKey>`（既定: `agent:main:main`）

ダイレクトメッセージの会話履歴がmainと共有される場合でも、外部DM向けにはsandboxとツールポリシーでアカウントごとに派生したダイレクトチャット実行時キーが使われるため、チャネル由来のメッセージはローカルのmainセッション実行として扱われません。

グループとチャネルは、チャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord のスレッドは、ベースキーの末尾に `:thread:<threadId>` を追加します。
- Telegram のフォーラムトピックは、グループキーに `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main DM ルート固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは1つのmainセッションを共有することがあります。
このセッションの `lastRoute` がオーナー以外のDMで上書きされないように、OpenClawは次のすべてが真の場合に `allowFrom` から固定オーナーを推論します。

- `allowFrom` にワイルドカードではないエントリがちょうど1つある。
- そのエントリをそのチャネルの具体的な送信者IDに正規化できる。
- 受信したDMの送信者が、その固定オーナーと一致しない。

この不一致ケースでは、OpenClawは受信セッションのメタデータを引き続き記録しますが、mainセッションの `lastRoute` は更新しません。

## ルーティングルール（エージェントの選び方）

ルーティングは、受信メッセージごとに**1つのエージェント**を選択します。

1. **完全一致のpeer**（`peer.kind` + `peer.id` を持つ `bindings`）。
2. **親peer一致**（スレッド継承）。
3. **guild + roles 一致**（Discord）`guildId` + `roles` による。
4. **guild 一致**（Discord）`guildId` による。
5. **team 一致**（Slack）`teamId` による。
6. **アカウント一致**（そのチャネル上の `accountId`）。
7. **チャネル一致**（そのチャネル上の任意のアカウント、`accountId: "*"`）。
8. **既定エージェント**（`agents.list[].default`、なければリストの最初のエントリ、フォールバックは `main`）。

バインディングに複数の一致フィールド（`peer`、`guildId`、`teamId`、`roles`）が含まれる場合、そのバインディングが適用されるには**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、どのワークスペースとセッションストアを使うかが決まります。

## Broadcast groups（複数エージェントの実行）

Broadcast groups を使うと、**OpenClawが通常なら返信する場合**（たとえば WhatsApp グループで、メンション/アクティベーションのゲート処理後）に、同じpeerに対して**複数のエージェント**を実行できます。

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

参照: [Broadcast Groups](/ja-JP/channels/broadcast-groups)。

## 設定の概要

- `agents.list`: 名前付きエージェント定義（ワークスペース、モデルなど）。
- `bindings`: 受信チャネル/アカウント/peer をエージェントに対応付けるマップ。

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

セッションストアは state ディレクトリ配下にあります（既定は `~/.openclaw`）。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアと同じ場所に保存されます

`session.store` と `{agentId}` テンプレートを使って、ストアパスを上書きできます。

Gateway と ACP のセッション検出では、既定の `agents/` ルート配下、およびテンプレート化された `session.store` ルート配下にあるディスクベースのエージェントストアも走査します。検出されるストアは、解決後のそのエージェントルート内にとどまり、通常の `sessions.json` ファイルを使っている必要があります。シンボリックリンクとルート外のパスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**にアタッチされ、既定ではそのエージェントのmainセッションを使います。このため、WebChatではそのエージェントのチャネル横断コンテキストを1か所で確認できます。

## 返信コンテキスト

受信した返信には以下が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追記されます。

これはチャネル間で一貫しています。
