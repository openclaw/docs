---
read_when:
    - ClickClack ワークスペースに OpenClaw を接続する
    - ClickClack ボット ID のテスト
summary: ClickClack ボットトークンチャンネルのセットアップとターゲット構文
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T11:01:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f268ab4ec96226a890aa1be7ccd1f05c9c92656aa5347864b1c74026dea9098
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack は、ファーストクラスの ClickClack ボットトークンを通じて、OpenClaw を自己ホスト型 ClickClack ワークスペースに接続します。

OpenClaw エージェントを ClickClack ボットユーザーとして表示したい場合に使用します。ClickClack は独立したサービスボットとユーザー所有ボットをサポートします。ユーザー所有ボットは `owner_user_id` を保持し、付与したトークンスコープだけを受け取ります。

## クイックセットアップ

ClickClack サーバーでボットトークンを作成します。

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

ユーザー所有ボットの場合は、`--owner <user_id>` を追加します。

OpenClaw を設定します。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

その後、次を実行します。

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

アカウントは、`baseUrl`、`token`、`workspace` がすべて設定されている場合にのみ設定済みと見なされます。`workspace` はワークスペース ID（`wsp_...`）、スラッグ、または名前を受け付けます。Gateway は起動時にそれを ID に解決します。

### アカウント設定キー

| キー                    | デフォルト          | 注記                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | なし（必須）        | ClickClack サーバー URL。                                                              |
| `token`                 | なし（必須）        | プレーン文字列またはシークレット参照（`source: "env" \| "file" \| "exec"`）。          |
| `workspace`             | なし（必須）        | ワークスペース ID、スラッグ、または名前。                                              |
| `replyMode`             | `"agent"`           | `"agent"` は完全なエージェントパイプラインを実行します。`"model"` は短い直接モデル補完を送信します。 |
| `defaultTo`             | `"channel:general"` | アウトバウンドパスでターゲットが指定されていない場合に使用されるターゲット。            |
| `allowFrom`             | `["*"]`             | インバウンド DM とチャンネルメッセージ用のユーザー ID 許可リスト。                     |
| `botUserId`             | 自動検出            | 起動時にボットトークン ID から解決されます。                                           |
| `agentId`               | ルートのデフォルト  | このアカウントのインバウンドメッセージを 1 つのエージェントに固定します。              |
| `toolsAllow`            | なし                | このアカウントからのエージェント返信に対するツール許可リスト。                         |
| `model`, `systemPrompt` | なし                | `replyMode: "model"` の補完で使用されます。                                             |
| `reconnectMs`           | `1500`              | リアルタイム再接続遅延（100 から 60000）。                                             |

`plugins.allow` が空でない制限リストの場合、チャンネル設定で ClickClack を明示的に選択するか、`openclaw plugins enable clickclack` を実行すると、そのリストに `clickclack` が追加されます。オンボーディングインストールでも同じ明示的選択の挙動が使用されます。これらのパスは、`plugins.deny` やグローバルな `plugins.enabled: false` 設定を上書きしません。直接 `openclaw plugins install @openclaw/clickclack` を実行した場合は、通常の Plugin インストールポリシーに従い、既存の許可リストにも ClickClack が記録されます。

## 複数のボット

各アカウントは独自の ClickClack リアルタイム接続を開き、独自のボットトークンを使用します。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 返信モード

- `replyMode: "agent"`（デフォルト）は、セッション記録とツールポリシーを含む通常のエージェントパイプラインを通じてインバウンドメッセージをディスパッチします。
- `replyMode: "model"` はエージェントパイプラインをスキップし、Plugin ランタイムの `llm.complete` を使用して短い直接ボット返信を行います（任意で `model` と `systemPrompt` によって調整されます）。

モデルモードは、解決されたボットエージェント ID に対して補完を実行します。そのため、明示的な `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信頼ビットが必要です。

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
}
```

デフォルトの `agent` 返信モードだけを使用する場合は、信頼ビットをオフのままにしてください。この場合は不要です。

## ターゲット

- `channel:<name-or-id>` はワークスペースチャンネルに送信します。裸のターゲットはデフォルトで `channel:` になります。
- `dm:<user_id>` は、そのユーザーとの直接会話を作成または再利用します。
- `thread:<message_id>` は、そのメッセージをルートとするスレッド内で返信します。

明示的なアウトバウンドターゲットには、`clickclack:` または `cc:` プロバイダープレフィックスを付けることもできます。

例:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 権限

ClickClack トークンスコープは ClickClack API によって適用されます。

- `bot:read`: ワークスペース、チャンネル、メッセージ、スレッド、DM、リアルタイム、プロフィールのデータを読み取ります。
- `bot:write`: `bot:read` に加えて、チャンネルメッセージ、スレッド返信、DM、アップロードを許可します。
- `bot:admin`: `bot:write` に加えて、チャンネル作成を許可します。

OpenClaw は通常のエージェントチャットに `bot:write` だけを必要とします。

## トラブルシューティング

- `ClickClack is not configured for account "<id>"`: そのアカウントに `baseUrl`、`token`（たとえば `CLICKCLACK_BOT_TOKEN` 経由）、`workspace` を設定します。
- `ClickClack workspace not found: <value>`: `workspace` を、ClickClack が返すワークスペース ID、スラッグ、または名前に設定します。
- インバウンド返信がない: トークンにリアルタイム読み取りアクセスがあることを確認し、ボットは自身のメッセージと他のボットからのメッセージを無視する点に注意してください。
- チャンネル送信が失敗する: ボットがワークスペースのメンバーであり、`bot:write` を持っていることを確認します。
