---
read_when:
    - OpenClaw を ClickClack ワークスペースに接続する
    - ClickClack ボット ID のテスト
summary: ClickClack ボットトークンチャネルのセットアップとターゲット構文
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T10:32:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack は、ファーストクラスの ClickClack ボットトークンを通じて、OpenClaw をセルフホストの ClickClack ワークスペースに接続します。

OpenClaw エージェントを ClickClack ボットユーザーとして表示したい場合に使用します。ClickClack は独立したサービスボットとユーザー所有ボットをサポートします。ユーザー所有ボットは `owner_user_id` を保持し、付与したトークンスコープのみを受け取ります。

## クイックセットアップ

ClickClack でボットトークンを作成します。

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

ユーザー所有ボットの場合は、`--owner <user_id>` を追加します。

OpenClaw を設定します。

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

次に実行します。

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

`plugins.allow` が空ではない制限的なリストの場合、チャネルセットアップで ClickClack を明示的に選択するか、`openclaw plugins enable clickclack` を実行すると、そのリストに `clickclack` が追加されます。オンボーディングインストールも同じ明示的選択の動作を使用します。これらの経路は `plugins.deny` やグローバルな `plugins.enabled: false` 設定を上書きしません。直接 `openclaw plugins install @openclaw/clickclack` を実行すると、通常の Plugin インストールポリシーに従い、既存の許可リストにも ClickClack が記録されます。

## 複数のボット

各アカウントはそれぞれ独自の ClickClack リアルタイム接続を開き、独自のボットトークンを使用します。

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` は、短いボット返信に `api.runtime.llm.complete` を直接使用します。
アカウントが `agentId` を設定する場合、OpenClaw は明示的な `plugins.entries.clickclack.llm.allowAgentIdOverride` 信頼ビットを要求します。これにより、Plugin がそのボットエージェントの補完を実行できます。デフォルトのエージェント経路だけを使用する場合は、オフのままにしてください。

## ターゲット

- `channel:<name-or-id>` はワークスペースチャネルに送信します。裸のターゲットはデフォルトで `channel:` になります。
- `dm:<user_id>` は、そのユーザーとのダイレクト会話を作成または再利用します。
- `thread:<message_id>` は既存のスレッドに返信します。

例:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 権限

ClickClack トークンスコープは ClickClack API によって強制されます。

- `bot:read`: ワークスペース、チャネル、メッセージ、スレッド、DM、リアルタイム、プロフィールデータを読み取ります。
- `bot:write`: `bot:read` に加えて、チャネルメッセージ、スレッド返信、DM、アップロードを扱えます。
- `bot:admin`: `bot:write` に加えて、チャネル作成を扱えます。

通常のエージェントチャットでは、OpenClaw に必要なのは `bot:write` のみです。

## トラブルシューティング

- `ClickClack is not configured`: `channels.clickclack.token` または `CLICKCLACK_BOT_TOKEN` を設定します。
- `workspace not found`: `workspace` を ClickClack から返されたワークスペース ID またはスラッグに設定します。
- 受信返信がない場合: トークンにリアルタイム読み取りアクセスがあり、ボットが自身のメッセージに返信していないことを確認します。
- チャネル送信が失敗する場合: ボットがワークスペースのメンバーであり、`bot:write` を持っていることを確認します。
