---
read_when:
    - チャンネルルーティングまたは受信トレイの動作の変更
summary: チャネルごとのルーティングルール（WhatsApp、Telegram、Discord、Slack）と共有コンテキスト
title: チャネルルーティング
x-i18n:
    generated_at: "2026-07-12T14:17:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# チャンネルとルーティング

OpenClaw は、返信を**メッセージの送信元チャンネルへ返します**。モデルがチャンネルを選択することはありません。ルーティングは決定論的であり、ホスト設定によって制御されます。

## 主要な用語

- **チャンネル**: `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram`、`whatsapp` などの同梱チャンネル Plugin、およびインストール済み Plugin のチャンネル。`webchat` は内部の WebChat UI チャンネルであり、設定可能な送信チャンネルではありません。
- **AccountId**: チャンネルごとのアカウントインスタンス（サポートされている場合）。
- オプションのチャンネル既定アカウント: `channels.<channel>.defaultAccount` は、送信パスで `accountId` が指定されていない場合に使用するアカウントを選択します。
  - 複数アカウント構成で 2 つ以上のアカウントを設定する場合は、明示的な既定値（`defaultAccount` または `default` という名前のアカウント）を設定してください。設定しない場合、フォールバックルーティングによって、正規化された最初のアカウント ID が選択される可能性があります。
- **AgentId**: 分離されたワークスペースとセッションストア（「頭脳」）。
- **SessionKey**: コンテキストの保存と同時実行制御に使用するバケットキー。

## 送信先プレフィックス

明示的な送信先には、`telegram:123` や `tg:123` などのプロバイダープレフィックスを含めることができます。コアは、選択されたチャンネルが `last` または未解決の場合に限り、かつ読み込まれた Plugin がそのプレフィックスを公開している場合に限り、そのプレフィックスをチャンネル選択のヒントとして扱います。呼び出し元がすでに明示的なチャンネルを選択している場合、プロバイダープレフィックスはそのチャンネルと一致する必要があります。WhatsApp から `telegram:123` へ配信するようなチャンネル間の組み合わせは、Plugin 固有の送信先正規化が行われる前に失敗します。

`channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>`、`sms:<number>` などの送信先種別およびサービスのプレフィックスは、選択されたチャンネルの文法内に留まります。これら単独でプロバイダーを選択することはありません。

## セッションキーの形式（例）

ダイレクトメッセージは、既定でエージェントの**メイン**セッションにまとめられます。

- `agent:<agentId>:<mainKey>`（既定: `agent:main:main`）

`session.dmScope` は DM の集約方法を制御します。`main`（既定）は 1 つのメインセッションを共有しますが、`per-peer`、`per-channel-peer`、`per-account-channel-peer` は DM を個別のセッションに保持します。ルートバインディングでは、`bindings[].session.dmScope` を使用して、一致した相手のスコープを上書きできます。

ダイレクトメッセージの会話履歴がメインセッションと共有されている場合でも、外部 DM に対するサンドボックスとツールのポリシーでは、アカウントごとに派生したダイレクトチャットのランタイムキーを使用します。これにより、チャンネルから送信されたメッセージがローカルのメインセッション実行と同様に扱われることを防ぎます。

グループとチャンネルは、チャンネルごとに分離されたままです。

- グループ: `agent:<agentId>:<channel>:group:<id>`
- チャンネル/ルーム: `agent:<agentId>:<channel>:channel:<id>`

スレッド:

- Slack/Discord のスレッドでは、ベースキーに `:thread:<threadId>` が追加されます。
- Telegram のフォーラムトピックでは、グループキーに `:topic:<topicId>` が埋め込まれます。

例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## メイン DM ルートの固定

`session.dmScope` が `main` の場合、ダイレクトメッセージは 1 つのメインセッションを共有することがあります。所有者以外からの DM によってセッションの `lastRoute` が上書きされるのを防ぐため、次の条件をすべて満たす場合、OpenClaw は `allowFrom` から固定所有者を推測します。

- `allowFrom` にワイルドカードではないエントリがちょうど 1 つ含まれている。
- そのエントリを、対象チャンネルの具体的な送信者 ID に正規化できる。
- 受信 DM の送信者が、その固定所有者と一致しない。

この不一致が発生した場合でも、OpenClaw は受信セッションのメタデータを記録しますが、メインセッションの `lastRoute` の更新はスキップします。

## 保護された受信記録

保護されたパスで新しい OpenClaw セッションを作成してはならない場合、チャンネル Plugin は受信セッションレコードを `createIfMissing: false` としてマークできます。このモードでは、OpenClaw は既存セッションのメタデータと `lastRoute` を更新することがありますが、単にメッセージを検出しただけでルート専用のセッションエントリを作成することはありません。

## ルーティングルール（エージェントの選択方法）

ルーティングでは、受信メッセージごとに**1 つのエージェント**を選択します。

1. **相手の完全一致**（`peer.kind` と `peer.id` を含む `bindings`）。
2. **親の相手との一致**（スレッドの継承）。
3. **相手のワイルドカード一致**（相手の種別に対する `peer.id: "*"`）。
4. **Guild とロールの一致**（Discord）: `guildId` と `roles` を使用。
5. **Guild の一致**（Discord）: `guildId` を使用。
6. **チームの一致**（Slack）: `teamId` を使用。
7. **アカウントの一致**（チャンネルの `accountId`）。
8. **チャンネルの一致**（そのチャンネル上の任意のアカウント、`accountId: "*"`）。
9. **既定のエージェント**（`agents.list[].default`。なければリストの最初のエントリ、さらにフォールバックとして `main`）。

バインディングに複数の一致フィールド（`peer`、`guildId`、`teamId`、`roles`）が含まれる場合、そのバインディングを適用するには、**指定されたすべてのフィールドが一致する必要があります**。

一致したエージェントによって、使用するワークスペースとセッションストアが決まります。

## ブロードキャストグループ（複数エージェントの実行）

ブロードキャストグループを使用すると、OpenClaw が通常返信する状況（例: WhatsApp グループでメンション/アクティベーションのゲートを通過した後）に、同じ相手に対して**複数のエージェント**を実行できます。

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
- `bindings`: 受信チャンネル/アカウント/相手をエージェントにマッピングします。

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

ランタイムのセッション行は、状態ディレクトリ（既定では `~/.openclaw`）以下にある各エージェントの SQLite データベースに保存されます。

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

古いインストールでは、`~/.openclaw/agents/<agentId>/sessions/` 以下に、従来のトランスクリプト JSONL ファイルと `sessions.json` 行ストアが存在する場合があります。Gateway の起動時と `openclaw doctor --fix` の実行時に、使用頻度の高い従来の行と履歴が SQLite に自動的にインポートされます。明示的な移行証跡が必要な場合は、`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` と [Doctor](/ja-JP/cli/doctor#session-sqlite-migration) の検証手順を使用してください。
移行およびオフラインメンテナンスのワークフローでは、引き続き `session.store` と `{agentId}` テンプレートを使用して従来のストアパスを選択できます。

Gateway と ACP のセッション検出では、既定の `agents/` ルートおよびテンプレート化された `session.store` ルートの下にある、ディスク上のエージェントストアもスキャンします。検出されるストアは、解決されたエージェントルートの内部に留まり、通常ファイルである従来の `sessions.json` を使用する必要があります。シンボリックリンクとルート外のパスは無視されます。

## WebChat の動作

WebChat は**選択されたエージェント**に接続し、既定ではそのエージェントのメインセッションを使用します。このため、WebChat では、そのエージェントのチャンネル横断コンテキストを 1 か所で確認できます。

## 返信コンテキスト

受信した返信には、次の情報が含まれます。

- 使用可能な場合は、`ReplyToId`、`ReplyToBody`、`ReplyToSender`。
- 引用されたコンテキストは、`[Replying to ...]` ブロックとして `Body` に追加されます。

これはすべてのチャンネルで一貫しています。

## 関連項目

- [グループ](/ja-JP/channels/groups)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [ペアリング](/ja-JP/channels/pairing)
