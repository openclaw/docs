---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベント向けのイベント駆動型自動化が必要な場合
    - フックをビルド、インストール、またはデバッグしたい場合
summary: 'フック: コマンドとライフサイクルイベント向けのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-05-02T20:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

フックは、Gateway 内で何かが発生したときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks` で確認できます。Gateway は、フックを有効化するか、少なくとも 1 つのフックエントリ、フックパック、レガシーハンドラー、または追加のフックディレクトリを設定した後でのみ、内部フックを読み込みます。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: `/new`、`/reset`、`/stop`、ライフサイクルイベントなど、エージェントイベントが発火したときに Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw で作業をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

フックは Plugin 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロンのフックと Plugin 管理のフックの両方を表示します。

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

| イベント                 | 発火するタイミング                                             |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` コマンドが発行されたとき                                      |
| `command:reset`          | `/reset` コマンドが発行されたとき                                    |
| `command:stop`           | `/stop` コマンドが発行されたとき                                     |
| `command`                | 任意のコマンドイベント（汎用リスナー）                       |
| `session:compact:before` | Compaction が履歴を要約する前                       |
| `session:compact:after`  | Compaction が完了した後                                 |
| `session:patch`          | セッションプロパティが変更されたとき                       |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが注入される前              |
| `gateway:startup`        | チャンネルが開始され、フックが読み込まれた後                  |
| `gateway:shutdown`       | Gateway のシャットダウンが開始されたとき                               |
| `gateway:pre-restart`    | 予定された Gateway 再起動の前                         |
| `message:received`       | 任意のチャンネルからの受信メッセージ                           |
| `message:transcribed`    | 音声文字起こしが完了した後                        |
| `message:preprocessed`   | メディアとリンクの前処理が完了またはスキップされた後 |
| `message:sent`           | 送信メッセージが配信されたとき                                 |

## フックを書く

### フック構造

各フックは、2 つのファイルを含むディレクトリです。

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md の形式

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
| `emoji`    | CLI に表示する絵文字                                |
| `events`   | リッスンするイベントの配列                        |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`）        |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）     |
| `requires` | 必要な `bins`、`anyBins`、`env`、または `config` パス |
| `always`   | 適格性チェックをバイパスする（真偽値）                  |
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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーへ送信するには push）、および `context`（イベント固有データ）が含まれます。エージェントおよびツール Plugin のフックコンテキストには、`trace` も含められます。これは読み取り専用の W3C 互換診断トレースコンテキストで、Plugin は OTEL 相関用の構造化ログへ渡すことができます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` などのプロバイダー固有データ）。`context.content` は、コマンドらしいメッセージでは空でないコマンド本文を優先し、その後で生の受信本文と汎用本文へフォールバックします。スレッド履歴やリンク要約など、エージェント専用の拡張情報は含まれません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡張された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（可変配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは、権限のあるクライアントだけです。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` には `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行することを監視します。これはキャンセル/コマンドのライフサイクルであり、エージェント終了のゲートではありません。自然な最終回答を検査し、エージェントにもう一度処理させる必要がある Plugin は、代わりに型付き Plugin フック `before_agent_finalize` を使用してください。[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウンが開始されたときに発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予定された再起動の一部であり、有限の `restartExpectedMs` 値が指定されている場合にのみ発火します。シャットダウン中、各ライフサイクルフックの待機はベストエフォートで制限されているため、ハンドラーが停止してもシャットダウンは続行されます。

## フック検出

フックは、上書き優先度が低いものから高いものの順に、次のディレクトリから検出されます。

1. **バンドルフック**: OpenClaw に同梱
2. **Plugin フック**: インストール済み Plugin 内にバンドルされたフック
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs` からの追加ディレクトリは、この優先度を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと、明示的に有効化されるまでデフォルトでは無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前のバンドルフック、管理フック、または Plugin 提供フックを上書きすることはできません。

Gateway は、内部フックが設定されるまで、起動時の内部フック検出をスキップします。バンドルフックまたは管理フックを `openclaw hooks enable <name>` で有効化するか、フックパックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインします。名前付きフックを 1 つ有効化すると、Gateway はそのフックのハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加のフックディレクトリ、およびレガシーハンドラーは、広範な検出へオプトインします。

### フックパック

フックパックは、`package.json` の `openclaw.hooks` 経由でフックをエクスポートする npm パッケージです。次でインストールします。

```bash
openclaw plugins install <path-or-spec>
```

Npm 仕様はレジストリのみです（パッケージ名 + 任意の正確なバージョンまたは dist-tag）。Git/URL/file 仕様と semver 範囲は拒否されます。

## 同梱フック

| フック                | イベント                       | 処理内容                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを `<workspace>/memory/` に保存します |
| bootstrap-extra-files | `agent:bootstrap`              | glob パターンから追加の bootstrap ファイルを注入します |
| command-logger        | `command`                      | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録します |
| boot-md               | `gateway:startup`              | Gateway の起動時に `BOOT.md` を実行します             |

任意の同梱フックを有効にします。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後の 15 件のユーザー/アシスタントメッセージを抽出し、LLM で説明的なファイル名スラッグを生成して、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-slug.md` に保存します。`workspace.dir` が設定されている必要があります。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files の設定

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

パスはワークスペースからの相対パスとして解決されます。認識される bootstrap ベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="boot-md"></a>

### boot-md の詳細

Gateway の起動時に、アクティブなワークスペースの `BOOT.md` を実行します。

## Plugin フック

Plugin は、より深い統合のために Plugin SDK を通じて型付きフックを登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などができます。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のインプロセスのライフサイクルフックが必要な場合は、Plugin フックを使用してください。

完全な Plugin フックのリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

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

フックごとの環境変数:

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

追加のフックディレクトリ:

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
従来の `hooks.internal.handlers` 配列設定形式は後方互換性のために引き続きサポートされていますが、新しいフックでは discovery ベースのシステムを使用してください。
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

- **ハンドラーは高速に保つ。** フックはコマンド処理中に実行されます。重い処理は `void processInBackground(event)` で fire-and-forget にします。
- **エラーを適切に処理する。** リスクのある操作は try/catch で囲み、他のハンドラーが実行できるように throw しないでください。
- **イベントを早期にフィルターする。** イベントのタイプ/アクションが関連しない場合は、ただちに返します。
- **具体的なイベントキーを使用する。** オーバーヘッドを減らすため、`"events": ["command"]` よりも `"events": ["command:new"]` を優先してください。

## トラブルシューティング

### フックが検出されない

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### フックが eligible ではない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS 互換性を確認してください。

### フックが実行されない

1. フックが有効になっていることを確認します: `openclaw hooks list`
2. フックを再読み込みするために Gateway プロセスを再起動します。
3. Gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI リファレンス: hooks](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — インプロセスの Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
