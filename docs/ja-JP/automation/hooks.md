---
read_when:
    - /new、/reset、/stop、エージェントのライフサイクルイベント向けにイベント駆動型の自動化を行いたい場合
    - フックをビルド、インストール、またはデバッグしたい
summary: 'フック: コマンドとライフサイクルイベント向けのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-05-11T20:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

フックは、Gateway 内で何かが起きたときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks` で検査できます。Gateway は、フックを有効化するか、少なくとも 1 つのフックエントリ、フックパック、レガシーハンドラー、または追加フックディレクトリを設定した後にのみ内部フックを読み込みます。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: `/new`、`/reset`、`/stop`、ライフサイクルイベントなど、エージェントイベントが発火したときに Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw で作業をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

フックは plugins 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロンフックと plugin 管理フックの両方を表示します。

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

| イベント                 | 発火するタイミング                                         |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` コマンドが発行されたとき                            |
| `command:reset`          | `/reset` コマンドが発行されたとき                          |
| `command:stop`           | `/stop` コマンドが発行されたとき                           |
| `command`                | 任意のコマンドイベント（汎用リスナー）                     |
| `session:compact:before` | Compaction が履歴を要約する前                              |
| `session:compact:after`  | Compaction が完了した後                                    |
| `session:patch`          | セッションプロパティが変更されたとき                       |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが注入される前     |
| `gateway:startup`        | チャンネルが開始し、フックが読み込まれた後                 |
| `gateway:shutdown`       | Gateway のシャットダウンが開始したとき                     |
| `gateway:pre-restart`    | 予定された Gateway 再起動の前                              |
| `message:received`       | 任意のチャンネルからの受信メッセージ                       |
| `message:transcribed`    | 音声の文字起こしが完了した後                               |
| `message:preprocessed`   | メディアとリンクの前処理が完了、またはスキップされた後     |
| `message:sent`           | 送信メッセージが配信されたとき                             |

## フックを書く

### フック構造

各フックは、2 つのファイルを含むディレクトリです。

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

| フィールド | 説明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI で表示する絵文字                                 |
| `events`   | 待ち受けるイベントの配列                             |
| `export`   | 使用する名前付きエクスポート（既定は `"default"`）   |
| `os`       | 必須プラットフォーム（例: `["darwin", "linux"]`）    |
| `requires` | 必須の `bins`、`anyBins`、`env`、または `config` パス |
| `always`   | 適格性チェックをバイパスする（真偽値）               |
| `install`  | インストール方法                                     |

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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するには push）、`context`（イベント固有データ）が含まれます。エージェントおよびツール plugin のフックコンテキストには、`trace` も含めることができます。これは読み取り専用の W3C 互換診断トレースコンテキストで、plugins は OTEL 相関のために構造化ログへ渡せます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` などを含むプロバイダー固有データ）。`context.content` は、コマンドのようなメッセージでは空でないコマンド本文を優先し、その後に生の受信本文と汎用本文へフォールバックします。スレッド履歴やリンク要約など、エージェント専用の拡張情報は含まれません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡張された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。権限を持つクライアントのみがパッチイベントをトリガーできます。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` には `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行するのを監視します。これはキャンセル/コマンドのライフサイクルであり、エージェントの最終化ゲートではありません。自然な最終回答を検査し、エージェントにもう一度処理させる必要がある plugins は、代わりに型付き plugin フック `before_agent_finalize` を使用してください。[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウンが開始したときに発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予定された再起動の一部であり、有限の `restartExpectedMs` 値が指定されている場合にのみ発火します。シャットダウン中、各ライフサイクルフックの待機はベストエフォートかつ上限付きであるため、ハンドラーが停止してもシャットダウンは続行されます。

`gateway:shutdown`（または `gateway:pre-restart`）イベントと残りのシャットダウンシーケンスの間に、Gateway はプロセス停止時にまだアクティブだったすべてのセッションについて、型付き `session_end` plugin フックも発火します。イベントの `reason` は、通常の SIGTERM/SIGINT 停止では `shutdown`、予定された再起動の一部としてクローズがスケジュールされた場合は `restart` です。このドレインは上限付きであるため、遅い `session_end` ハンドラーがプロセス終了をブロックすることはありません。また、replace / reset / delete / compaction によってすでに最終化されたセッションは、二重発火を避けるためにスキップされます。

## フック検出

フックは、上書き優先度が低い順に、次のディレクトリから検出されます。

1. **バンドルフック**: OpenClaw に同梱
2. **Plugin フック**: インストール済み plugins 内にバンドルされたフック
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs` からの追加ディレクトリもこの優先度を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと。明示的に有効化されるまで既定では無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前のバンドル、管理、または plugin 提供フックを上書きすることはできません。

Gateway は、内部フックが設定されるまで、起動時の内部フック検出をスキップします。`openclaw hooks enable <name>` でバンドルまたは管理フックを有効化するか、フックパックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインしてください。名前付きフックを 1 つ有効化すると、Gateway はそのフックのハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、レガシーハンドラーは広範な検出にオプトインします。

### フックパック

フックパックは、`package.json` の `openclaw.hooks` 経由でフックをエクスポートする npm パッケージです。次でインストールします。

```bash
openclaw plugins install <path-or-spec>
```

npm spec はレジストリのみです（パッケージ名 + 任意の完全一致バージョンまたは dist-tag）。Git/URL/file spec と semver 範囲は拒否されます。

## バンドルフック

| フック                | イベント                                          | 動作                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存します    |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを注入します    |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録します |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッション Compaction の開始/終了時に表示されるチャット通知を送信します |
| boot-md               | `gateway:startup`                                 | Gateway 起動時に `BOOT.md` を実行します                        |

任意のバンドルフックを有効化します。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後の 15 件のユーザー/アシスタントメッセージを抽出し、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-HHMM.md` に保存します。メモリキャプチャはバックグラウンドで実行されるため、`/new` と `/reset` の確認応答は、トランスクリプト読み取りや任意の slug 生成によって遅延しません。設定済みモデルで説明的なファイル名 slug を生成するには、`hooks.internal.entries.session-memory.llmSlug: true` を設定します。`workspace.dir` が設定されている必要があります。

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

パスはワークスペース相対で解決されます。認識されるブートストラップのベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトの圧縮を開始および完了したときに、現在の会話へ短いステータスメッセージを送信します。これにより、チャット画面で長いターンが分かりやすくなります。ユーザーは、アシスタントがコンテキストを要約しており、Compaction 後に続行することを確認できます。

<a id="boot-md"></a>

### boot-md の詳細

Gateway 起動時に、アクティブなワークスペースから `BOOT.md` を実行します。

## Plugin フック

Plugins は、より深い統合のために Plugin SDK を通じて型付きフックを登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などができます。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のプロセス内ライフサイクルフックが必要な場合は、plugin フックを使用してください。

完全な plugin フックリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

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

追加フックディレクトリ:

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
従来の `hooks.internal.handlers` 配列設定形式は後方互換性のため引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用する必要があります。
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

- **ハンドラーを高速に保つ。** フックはコマンド処理中に実行されます。重い作業は `void processInBackground(event)` で投げっぱなしにします。
- **エラーを適切に処理する。** リスクのある操作は try/catch でラップします。他のハンドラーが実行できるように、throw しないでください。
- **イベントを早めに絞り込む。** イベントの type/action が関連しない場合はすぐに return します。
- **具体的なイベントキーを使う。** オーバーヘッドを減らすため、`"events": ["command"]` よりも `"events": ["command:new"]` を優先します。

## トラブルシューティング

### フックが検出されない

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### フックが対象にならない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS 互換性を確認してください。

### フックが実行されない

1. フックが有効になっていることを確認します: `openclaw hooks list`
2. フックが再読み込みされるように Gateway プロセスを再起動します。
3. Gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI リファレンス: フック](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — プロセス内 Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
