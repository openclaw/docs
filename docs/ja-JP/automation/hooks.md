---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベント向けのイベント駆動型自動化が必要な場合
    - フックをビルド、インストール、またはデバッグしたい場合
summary: 'フック: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-04-30T04:57:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooks は、Gateway 内で何かが発生したときに実行される小さなスクリプトです。これらはディレクトリから検出でき、`openclaw hooks` で調査できます。Gateway は、hooks を有効にするか、少なくとも 1 つの hook エントリ、hook pack、レガシーハンドラー、または追加 hook ディレクトリを設定した後でのみ、内部 hooks を読み込みます。

OpenClaw には 2 種類の hooks があります。

- **内部 hooks**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントのようなエージェントイベントが発生したときに、Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw で作業をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

Hooks は plugins 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロン hooks と plugin 管理の hooks の両方を表示します。

## クイックスタート

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## イベントタイプ

| イベント                 | 発生するタイミング                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` コマンドが発行されたとき                                      |
| `command:reset`          | `/reset` コマンドが発行されたとき                                    |
| `command:stop`           | `/stop` コマンドが発行されたとき                                     |
| `command`                | 任意のコマンドイベント（汎用リスナー）                       |
| `session:compact:before` | Compaction が履歴を要約する前                       |
| `session:compact:after`  | Compaction が完了した後                                 |
| `session:patch`          | セッションプロパティが変更されたとき                       |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが注入される前              |
| `gateway:startup`        | チャンネルが開始し、hooks が読み込まれた後                  |
| `gateway:shutdown`       | gateway のシャットダウンが始まるとき                               |
| `gateway:pre-restart`    | 予期された gateway 再起動の前                         |
| `message:received`       | 任意のチャンネルからの受信メッセージ                           |
| `message:transcribed`    | 音声文字起こしが完了した後                        |
| `message:preprocessed`   | メディアとリンクの前処理が完了するか、スキップされた後 |
| `message:sent`           | 送信メッセージが配信されたとき                                 |

## Hooks を書く

### Hook 構造

各 hook は 2 つのファイルを含むディレクトリです。

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md 形式

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**メタデータフィールド**（`metadata.openclaw`）:

| フィールド | 説明                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 用の表示絵文字                                |
| `events`   | 待ち受けるイベントの配列                        |
| `export`   | 使用する名前付きエクスポート（既定は `"default"`）        |
| `os`       | 必須プラットフォーム（例: `["darwin", "linux"]`）     |
| `requires` | 必須の `bins`、`anyBins`、`env`、または `config` パス |
| `always`   | 適格性チェックをバイパス（ブール値）                  |
| `install`  | インストール方法                                 |

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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するには push）、`context`（イベント固有データ）が含まれます。エージェントおよびツール plugin の hook コンテキストには、`trace` も含めることができます。これは読み取り専用の W3C 互換診断 trace コンテキストで、plugins は OTEL 相関のために構造化ログへ渡せます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡充された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。特権クライアントのみがパッチイベントをトリガーできます。

**Compactionイベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` は `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` を追加します。

`command:stop` は、ユーザーが `/stop` を発行したことを監視します。これはキャンセル/コマンドのライフサイクルであり、エージェント最終化ゲートではありません。自然な最終回答を調査し、エージェントにもう 1 回のパスを求める必要がある plugins は、代わりに型付き plugin hook `before_agent_finalize` を使用してください。[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` は `reason` と `restartExpectedMs` を含み、gateway のシャットダウンが始まると発生します。`gateway:pre-restart` は同じコンテキストを含みますが、シャットダウンが予期された再起動の一部であり、有限の `restartExpectedMs` 値が指定された場合にのみ発生します。シャットダウン中、各ライフサイクル hook の待機はベストエフォートで、ハンドラーが停止してもシャットダウンが続行されるよう上限が設けられます。

## Hook の検出

Hooks は次のディレクトリから、上書き優先度が低い順に検出されます。

1. **バンドル hooks**: OpenClaw に同梱
2. **Plugin hooks**: インストール済み plugins 内にバンドルされた hooks
3. **管理対象 hooks**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs` からの追加ディレクトリはこの優先度を共有します。
4. **ワークスペース hooks**: `<workspace>/hooks/`（エージェント単位、明示的に有効化されるまで既定で無効）

ワークスペース hooks は新しい hook 名を追加できますが、同じ名前のバンドル、管理対象、または plugin 提供 hooks を上書きすることはできません。

Gateway は、内部 hooks が設定されるまで、起動時の内部 hook 検出をスキップします。バンドルまたは管理対象の hook を有効にするには `openclaw hooks enable <name>` を使用するか、hook pack をインストールするか、`hooks.internal.enabled=true` を設定してオプトインします。1 つの名前付き hook を有効にすると、Gateway はその hook のハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加 hook ディレクトリ、レガシーハンドラーは広範な検出にオプトインします。

### Hook packs

Hook packs は、`package.json` の `openclaw.hooks` を介して hooks をエクスポートする npm パッケージです。次でインストールします。

```bash
openclaw plugins install <path-or-spec>
```

Npm specs はレジストリ専用です（パッケージ名 + 任意の正確なバージョンまたは dist-tag）。Git/URL/file specs と semver 範囲は拒否されます。

## バンドル hooks

| Hook                  | イベント                       | 機能                                          |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを `<workspace>/memory/` に保存        |
| bootstrap-extra-files | `agent:bootstrap`              | glob パターンから追加のブートストラップファイルを注入 |
| command-logger        | `command`                      | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録  |
| boot-md               | `gateway:startup`              | gateway 起動時に `BOOT.md` を実行                |

任意のバンドル hook を有効にします。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後の 15 件のユーザー/アシスタントメッセージを抽出し、LLM 経由で説明的なファイル名 slug を生成し、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-slug.md` に保存します。`workspace.dir` が設定されている必要があります。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files 設定

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

パスはワークスペースを基準に解決されます。認識されるブートストラップのベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="boot-md"></a>

### boot-md の詳細

gateway 起動時に、アクティブなワークスペースから `BOOT.md` を実行します。

## Plugin hooks

Plugins は、より深い統合のために Plugin SDK を通じて型付き hooks を登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが可能です。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のプロセス内ライフサイクル hooks が必要な場合は plugin hooks を使用してください。

完全な plugin hook リファレンスについては、[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

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

Hook ごとの環境変数:

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

追加 hook ディレクトリ:

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
レガシーの `hooks.internal.handlers` 配列設定形式は後方互換性のために引き続きサポートされていますが、新しい hooks では検出ベースのシステムを使用するべきです。
</Note>

## CLI リファレンス

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーを高速に保つ。** Hooks はコマンド処理中に実行されます。重い作業は `void processInBackground(event)` で fire-and-forget にします。
- **エラーを適切に処理する。** リスクのある操作は try/catch でラップします。他のハンドラーが実行できるように throw しないでください。
- **イベントを早期にフィルタリングする。** イベントの type/action が関連しない場合は、すぐに return します。
- **具体的なイベントキーを使用する。** オーバーヘッドを減らすために、`"events": ["command"]` より `"events": ["command:new"]` を優先します。

## トラブルシューティング

### Hook が検出されない

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook が適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS 互換性を確認してください。

### Hook が実行されない

1. hook が有効になっていることを確認します: `openclaw hooks list`
2. hooks が再読み込みされるように gateway プロセスを再起動します。
3. gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI リファレンス: フック](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — インプロセスの Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
