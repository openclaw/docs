---
read_when:
    - チャネルルーティングまたは受信トレイの挙動を変更する
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-05-06T09:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
---

# チャネルとルーティング

OpenClaw は返信を**メッセージの送信元チャネルへ戻す**ようにルーティングします。
モデルはチャネルを選びません。ルーティングは決定的で、ホスト設定によって制御されます。

## 主要な用語

- **チャネル**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`、および Plugin チャネル。`webchat` は内部 WebChat UI チャネルであり、設定可能な送信チャネルではありません。
- **AccountId**: チャネルごとのアカウントインスタンス (サポートされている場合)。
- オプションのチャネルデフォルトアカウント: `channels.<channel>.defaultAccount` は、
  送信パスで `accountId` が指定されていない場合に使用されるアカウントを選択します。
  - 複数アカウント構成では、2 つ以上のアカウントが設定されている場合、明示的なデフォルト (`defaultAccount` または `accounts.default`) を設定してください。設定しないと、フォールバックルーティングが最初の正規化済みアカウント ID を選ぶことがあります。
- **AgentId**: 分離されたワークスペース + セッションストア (「brain」)。
- **SessionKey**: コンテキストの保存と並行実行の制御に使用されるバケットキー。

## 送信先プレフィックス

明示的な送信先には、`telegram:123` や `tg:123` のようなプロバイダープレフィックスを含めることができます。Core は、選択されたチャネルが `last` であるか未解決の場合にのみ、かつ読み込まれた Plugin がそのプレフィックスを公開している場合にのみ、そのプレフィックスをチャネル選択のヒントとして扱います。呼び出し元がすでに明示的なチャネルを選択している場合、プロバイダープレフィックスはそのチャネルと一致する必要があります。WhatsApp 配信を `telegram:123` に送るようなチャネル横断の組み合わせは、Plugin 固有のターゲット正規化より前に失敗します。

`channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>`、`sms:<number>` のようなターゲット種別およびサービスプレフィックスは、選択されたチャネルの文法の中に留まります。それら自体がプロバイダーを選択することはありません。

## セッションキーの形状 (例)

ダイレクトメッセージは、デフォルトでエージェントの**メイン**セッションに集約されます。

- `agent:<agentId>:<mainKey>` (デフォルト: `agent:main:main`)

ダイレクトメッセージの会話履歴がメインと共有される場合でも、外部 DM ではサンドボックスと
ツールポリシーがアカウントごとに派生したダイレクトチャットのランタイムキーを使用するため、
チャネル由来のメッセージがローカルのメインセッション実行のようには扱われません。

グループとチャネルはチャネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord スレッドは、ベースキーに `:thread:<threadId>` を追加します。
- Telegram フォーラムトピックは、グループキー内に `:topic:<topicId>` を埋め込みます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## メイン DM ルートのピン留め

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つのメインセッションを共有できます。
セッションの `lastRoute` が所有者ではない DM によって上書きされるのを防ぐため、
OpenClaw は次のすべてが真である場合に、`allowFrom` からピン留めされた所有者を推定します。

- `allowFrom` に非ワイルドカードのエントリがちょうど 1 つある。
- そのエントリをそのチャネルの具体的な送信者 ID に正規化できる。
- 受信 DM の送信者が、そのピン留めされた所有者と一致しない。

この不一致の場合でも、OpenClaw は受信セッションメタデータを記録しますが、
メインセッションの `lastRoute` の更新はスキップします。

## ガードされた受信記録

チャネル Plugin は、ガードされたパスが新しい OpenClaw セッションを作成してはならない場合に、受信セッションレコードを `createIfMissing: false` としてマークできます。このモードでは、
OpenClaw は既存セッションのメタデータと `lastRoute` を更新できますが、
メッセージが観測されたという理由だけでルート専用のセッションエントリを作成することはありません。

## ルーティングルール (エージェントの選択方法)

ルーティングは各受信メッセージに対して**1 つのエージェント**を選びます。

1. **正確なピア一致** (`peer.kind` + `peer.id` を持つ `bindings`)。
2. **親ピア一致** (スレッド継承)。
3. **ギルド + ロール一致** (Discord) は `guildId` + `roles` 経由。
4. **ギルド一致** (Discord) は `guildId` 経由。
5. **チーム一致** (Slack) は `teamId` 経由。
6. **アカウント一致** (チャネル上の `accountId`)。
7. **チャネル一致** (そのチャネル上の任意のアカウント、`accountId: "*"`)。
8. **デフォルトエージェント** (`agents.list[].default`、なければ最初のリストエントリ、フォールバックは `main`)。

バインディングに複数の一致フィールド (`peer`, `guildId`, `teamId`, `roles`) が含まれる場合、そのバインディングが適用されるには**提供されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、使用されるワークスペースとセッションストアが決まります。

## ブロードキャストグループ (複数エージェントを実行)

ブロードキャストグループを使うと、**OpenClaw が通常なら返信する場合**に、同じピアに対して**複数のエージェント**を実行できます (例: WhatsApp グループで、メンション/アクティベーションのゲート後)。

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

- `agents.list`: 名前付きエージェント定義 (ワークスペース、モデルなど)。
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

セッションストアは状態ディレクトリ (デフォルトは `~/.openclaw`) の下にあります。

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL トランスクリプトはストアの隣に置かれます

`session.store` と `{agentId}` テンプレートを使って、ストアパスを上書きできます。

Gateway と ACP のセッション検出は、デフォルトの `agents/` ルートの下、およびテンプレート化された `session.store` ルートの下にある、ディスクに裏付けられたエージェントストアもスキャンします。検出されたストアは、解決済みのエージェントルート内に留まり、通常の
`sessions.json` ファイルを使用する必要があります。シンボリックリンクとルート外のパスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**に接続し、デフォルトではそのエージェントのメイン
セッションを使用します。このため、WebChat ではそのエージェントのチャネル横断コンテキストを
1 か所で確認できます。

## 返信コンテキスト

受信返信には次が含まれます。

- 利用可能な場合は `ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用コンテキストは `[Replying to ...]` ブロックとして `Body` に追加されます。

これはチャネル間で一貫しています。

## 関連

- [グループ](/ja-JP/channels/groups)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [ペアリング](/ja-JP/channels/pairing)
