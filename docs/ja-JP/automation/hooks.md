---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対するイベント駆動型自動化が必要です
    - Hooksをビルド、インストール、またはデバッグしたい場合
summary: 'Hooks: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: Hooks
x-i18n:
    generated_at: "2026-04-21T04:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooksは、Gateway内部で何かが起きたときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks`で確認できます。Gatewayは、hooksを有効にするか、少なくとも1つのhook entry、hook pack、legacy handler、または追加のhook directoryを設定した後にのみ、内部Hooksを読み込みます。

OpenClawには2種類のHooksがあります。

- **内部Hooks**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントのようなエージェントイベントが発火したときに、Gateway内で実行されます。
- **Webhooks**: 他のシステムがOpenClaw内で処理をトリガーできる外部HTTPエンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks)を参照してください。

Hooksはplugin内にバンドルすることもできます。`openclaw hooks list`には、スタンドアロンのHooksとplugin管理のHooksの両方が表示されます。

## クイックスタート

```bash
# 利用可能なHooksを一覧表示
openclaw hooks list

# Hookを有効化
openclaw hooks enable session-memory

# Hookの状態を確認
openclaw hooks check

# 詳細情報を取得
openclaw hooks info session-memory
```

## イベントタイプ

| Event                    | 発火するタイミング                             |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | `/new`コマンドが発行されたとき                 |
| `command:reset`          | `/reset`コマンドが発行されたとき               |
| `command:stop`           | `/stop`コマンドが発行されたとき                |
| `command`                | 任意のコマンドイベント（汎用リスナー）         |
| `session:compact:before` | Compactionが履歴を要約する前                   |
| `session:compact:after`  | Compactionの完了後                             |
| `session:patch`          | セッションプロパティが変更されたとき           |
| `agent:bootstrap`        | ワークスペースのbootstrapファイルが注入される前 |
| `gateway:startup`        | チャネルが起動し、Hooksが読み込まれた後        |
| `message:received`       | 任意のチャネルからの受信メッセージ             |
| `message:transcribed`    | 音声文字起こしの完了後                         |
| `message:preprocessed`   | すべてのメディア処理とリンク理解の完了後       |
| `message:sent`           | 送信メッセージが配信されたとき                 |

## Hooksの作成

### Hookの構造

各Hookは、2つのファイルを含むディレクトリです。

```
my-hook/
├── HOOK.md          # メタデータ + ドキュメント
└── handler.ts       # ハンドラー実装
```

### HOOK.md形式

```markdown
---
name: my-hook
description: "このHookが何をするかの短い説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

ここに詳細なドキュメントを記述します。
```

**メタデータフィールド**（`metadata.openclaw`）:

| Field      | 説明                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | CLIに表示する絵文字                                    |
| `events`   | 監視するイベントの配列                                 |
| `export`   | 使用する名前付きexport（デフォルトは`"default"`）      |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）    |
| `requires` | 必要な`bins`、`anyBins`、`env`、または`config`パス     |
| `always`   | 適格性チェックをバイパスする（boolean）                |
| `install`  | インストール方法                                       |

### ハンドラー実装

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するにはpush）、および`context`（イベント固有のデータ）が含まれます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId`を含むprovider固有データ）。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡張された本文）、`context.from`、`context.channelId`。

**Bootstrapイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションpatchイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。patchイベントをトリガーできるのは特権クライアントのみです。

**Compactionイベント**: `session:compact:before`には`messageCount`、`tokenCount`が含まれます。`session:compact:after`にはさらに`compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`が追加されます。

## Hookの検出

Hooksは、上書き優先順位が低い順から高い順に、次のディレクトリから検出されます。

1. **バンドルされたHooks**: OpenClawに同梱
2. **Plugin Hooks**: インストール済みplugin内にバンドルされたHooks
3. **管理対象Hooks**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs`の追加ディレクトリもこの優先順位を共有します。
4. **ワークスペースHooks**: `<workspace>/hooks/`（エージェントごと、明示的に有効化されるまでデフォルトでは無効）

ワークスペースHooksは新しいhook名を追加できますが、同じ名前のバンドル済み、管理対象、またはplugin提供のHooksを上書きすることはできません。

Gatewayは、内部Hooksが設定されるまで、起動時の内部Hook検出をスキップします。`openclaw hooks enable <name>`でバンドル済みまたは管理対象のHookを有効にするか、hook packをインストールするか、`hooks.internal.enabled=true`を設定してオプトインします。1つの名前付きHookを有効にすると、GatewayはそのHookのハンドラーだけを読み込みます。`hooks.internal.enabled=true`、追加のhook directory、legacy handlerは、広範な検出にオプトインします。

### Hook packs

Hook packsは、`package.json`の`openclaw.hooks`を通じてHooksをexportするnpm packageです。インストール方法:

```bash
openclaw plugins install <path-or-spec>
```

npm specはレジストリ専用です（package名 + 任意の正確なバージョンまたはdist-tag）。Git/URL/file specとsemver rangeは拒否されます。

## バンドルされたHooks

| Hook                  | Events                         | 動作内容                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを`<workspace>/memory/`に保存   |
| bootstrap-extra-files | `agent:bootstrap`              | glob patternから追加のbootstrapファイルを注入         |
| command-logger        | `command`                      | すべてのコマンドを`~/.openclaw/logs/commands.log`に記録 |
| boot-md               | `gateway:startup`              | gateway起動時に`BOOT.md`を実行                        |

任意のバンドル済みHookを有効にするには:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memoryの詳細

直近15件のuser/assistantメッセージを抽出し、LLMで説明的なファイル名slugを生成して、`<workspace>/memory/YYYY-MM-DD-slug.md`に保存します。`workspace.dir`の設定が必要です。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files設定

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

パスはワークスペース相対で解決されます。認識されるbootstrap basename（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）のみが読み込まれます。

<a id="command-logger"></a>

### command-loggerの詳細

すべてのスラッシュコマンドを`~/.openclaw/logs/commands.log`に記録します。

<a id="boot-md"></a>

### boot-mdの詳細

gatewayの起動時に、アクティブなワークスペースの`BOOT.md`を実行します。

## Plugin Hooks

Pluginsは、より深い統合のためにPlugin SDKを通じてHooksを登録できます。たとえば、ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などです。Plugin SDKは、モデル解決、エージェントライフサイクル、メッセージフロー、ツール実行、subagent調整、gateway lifecycleをカバーする28個のHooksを公開しています。

`before_tool_call`、`before_agent_reply`、`before_install`、およびその他すべてのplugin hooksを含む完全なplugin hookリファレンスについては、[Plugin Architecture](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。

## 設定

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Hookごとの環境変数:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

追加のhook directory:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
従来の`hooks.internal.handlers`配列設定形式も後方互換性のため引き続きサポートされていますが、新しいHooksでは検出ベースのシステムを使用してください。
</Note>

## CLIリファレンス

```bash
# すべてのHooksを一覧表示（--eligible、--verbose、または--jsonを追加可能）
openclaw hooks list

# Hookの詳細情報を表示
openclaw hooks info <hook-name>

# 適格性の概要を表示
openclaw hooks check

# 有効化/無効化
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーは高速に保つ。** Hooksはコマンド処理中に実行されます。重い処理は`void processInBackground(event)`でfire-and-forgetにしてください。
- **エラーは適切に処理する。** 危険な操作はtry/catchで囲み、他のハンドラーが実行できるようthrowしないでください。
- **イベントは早めにフィルタする。** イベントのtype/actionが関係ない場合は即座にreturnしてください。
- **具体的なイベントキーを使う。** オーバーヘッドを減らすため、`"events": ["command"]`より`"events": ["command:new"]`を優先してください。

## トラブルシューティング

### Hookが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべきもの: HOOK.md, handler.ts

# 検出されたすべてのHooksを一覧表示
openclaw hooks list
```

### Hookが適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、またはOS互換性を確認してください。

### Hookが実行されない

1. Hookが有効か確認します: `openclaw hooks list`
2. Hooksが再読み込みされるよう、gateway processを再起動します。
3. gateway logsを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin Architecture](/ja-JP/plugins/architecture#provider-runtime-hooks) — 完全なplugin hookリファレンス
- [Configuration](/ja-JP/gateway/configuration-reference#hooks)
