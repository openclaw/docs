---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対してイベント駆動型の自動化を行いたい
    - フックをビルド、インストール、またはデバッグしたい
summary: 'Hooks: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-06-27T10:30:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

フックは、Gateway 内で何かが発生したときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks` で確認できます。Gateway は、フックを有効にするか、少なくとも 1 つのフックエントリ、フックパック、レガシーハンドラー、または追加フックディレクトリを設定した後にのみ内部フックを読み込みます。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: `/new`、`/reset`、`/stop`、ライフサイクルイベントなど、エージェントイベントが発火したときに Gateway 内で実行されます。
- **Webhook**: 他のシステムが OpenClaw で作業をトリガーできる外部 HTTP エンドポイントです。[Webhook](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

フックは Plugin 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロンのフックと Plugin 管理のフックの両方を表示します。

## 適切なサーフェスを選ぶ

OpenClaw には似て見えるものの、異なる問題を解決する拡張サーフェスがいくつかあります。

| やりたいこと                                                                                                      | 使うもの                              | 理由                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/new` でスナップショットを保存する、`/reset` をログに記録する、`message:sent` 後に外部 API を呼び出す、または粗い運用自動化を追加する | 内部フック（`HOOK.md`、このページ） | ファイルベースのフックは、運用者が管理する副作用とコマンド/ライフサイクル自動化を目的としています |
| プロンプトを書き換える、ツールをブロックする、送信メッセージをキャンセルする、または順序付きミドルウェア/ポリシーを追加する                              | `api.on(...)` 経由の型付き Plugin フック  | 型付きフックには、明示的な契約、優先度、マージルール、ブロック/キャンセルのセマンティクスがあります      |
| テレメトリ専用のエクスポートまたはオブザーバビリティを追加する                                                                            | 診断イベント                     | オブザーバビリティは別のイベントバスであり、ポリシーフックサーフェスではありません                              |

小さなインストール済み連携のように動作する自動化が必要な場合は、内部フックを使います。実行時ライフサイクル制御が必要な場合は、型付き Plugin フックを使います。

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

## イベント種別

| イベント                    | 発火タイミング                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` コマンドが発行されたとき                                      |
| `command:reset`          | `/reset` コマンドが発行されたとき                                    |
| `command:stop`           | `/stop` コマンドが発行されたとき                                     |
| `command`                | 任意のコマンドイベント（汎用リスナー）                       |
| `session:compact:before` | Compaction が履歴を要約する前                       |
| `session:compact:after`  | Compaction が完了した後                                 |
| `session:patch`          | セッションプロパティが変更されたとき                       |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが注入される前              |
| `gateway:startup`        | チャンネルが開始し、フックが読み込まれた後                  |
| `gateway:shutdown`       | Gateway のシャットダウンが開始したとき                               |
| `gateway:pre-restart`    | 予定された Gateway 再起動の前                         |
| `message:received`       | 任意のチャンネルからの受信メッセージ                           |
| `message:transcribed`    | 音声文字起こしが完了した後                        |
| `message:preprocessed`   | メディアとリンクの前処理が完了した、またはスキップされた後 |
| `message:sent`           | 送信メッセージが配信されたとき                                 |

## フックを書く

### フック構造

各フックは 2 つのファイルを含むディレクトリです。

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

| フィールド      | 説明                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI に表示する絵文字                                |
| `events`   | 待ち受けるイベントの配列                        |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`）        |
| `os`       | 必須プラットフォーム（例: `["darwin", "linux"]`）     |
| `requires` | 必須の `bins`、`anyBins`、`env`、または `config` パス |
| `always`   | 適格性チェックをバイパスする（ブール値）                  |
| `install`  | インストール方法                                 |

### ハンドラー実装

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（返信可能なサーフェスでのみ、返信をここに push します）、`context`（イベント固有のデータ）が含まれます。エージェントとツールの Plugin フックコンテキストには、読み取り専用で W3C 互換の診断トレースコンテキストである `trace` も含めることができ、Plugin は OTEL 相関のために構造化ログへ渡せます。

`event.messages` は、`command:*` や `message:received` などの返信可能なサーフェスでのみ自動配信されます。`agent:bootstrap`、`session:*`、`gateway:*`、`message:sent` などのライフサイクル専用イベントには返信チャンネルがなく、push されたメッセージは無視されます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。`context.content` は、コマンド風メッセージでは空でないコマンド本文を優先し、その後に生の受信本文と汎用本文へフォールバックします。スレッド履歴やリンク要約など、エージェント専用の拡張情報は含まれません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的な拡張済み本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（可変配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントのみです。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` は `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` を追加します。

`command:stop` は、ユーザーが `/stop` を発行することを監視します。これはキャンセル/コマンドライフサイクルであり、エージェント最終化のゲートではありません。自然な最終回答を確認し、エージェントにもう 1 回のパスを求める必要がある Plugin は、代わりに型付き Plugin フック `before_agent_finalize` を使うべきです。[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウンが開始すると発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予定された再起動の一部であり、有限の `restartExpectedMs` 値が指定されている場合にのみ発火します。シャットダウン中、各ライフサイクルフックの待機はベストエフォートで境界付けられているため、ハンドラーが停止してもシャットダウンは続行されます。デフォルトの待機予算は、`gateway:shutdown` で 5 秒、`gateway:pre-restart` で 10 秒です。

チャンネルがまだ利用可能な間に短い再起動通知を送るには、`gateway:pre-restart` を使います。

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

`gateway:shutdown`（または `gateway:pre-restart`）イベントと残りのシャットダウンシーケンスの間に、Gateway はプロセス停止時にまだアクティブだった各セッションに対して、型付き `session_end` Plugin フックも発火します。イベントの `reason` は、通常の SIGTERM/SIGINT 停止では `shutdown`、予定された再起動の一部としてクローズがスケジュールされた場合は `restart` です。このドレインは境界付けられているため、遅い `session_end` ハンドラーがプロセス終了をブロックすることはありません。また、置換 / リセット / 削除 / Compaction によってすでに最終化されたセッションは、二重発火を避けるためにスキップされます。

## フック検出

フックは、オーバーライド優先度が低いものから高いものの順に、次のディレクトリから検出されます。

1. **バンドルされたフック**: OpenClaw に同梱
2. **Plugin フック**: インストール済み Plugin 内にバンドルされたフック
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs` からの追加ディレクトリはこの優先度を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと、明示的に有効化されるまでデフォルトでは無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前のバンドル済み、管理対象、または Plugin 提供のフックをオーバーライドすることはできません。

Gateway は、内部フックが設定されるまで、起動時に内部フック検出をスキップします。バンドル済みまたは管理対象のフックを `openclaw hooks enable <name>` で有効にするか、フックパックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインします。1 つの名前付きフックを有効にすると、Gateway はそのフックのハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、レガシーハンドラーは広範な検出にオプトインします。

### フックパック

フックパックは、`package.json` の `openclaw.hooks` 経由でフックをエクスポートする npm パッケージです。次でインストールします。

```bash
openclaw plugins install <path-or-spec>
```

npm 仕様はレジストリのみです（パッケージ名 + 任意の正確なバージョンまたは dist-tag）。Git/URL/file 仕様と semver 範囲は拒否されます。

## バンドルされたフック

| フック                | イベント                                          | 動作内容                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存する      |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを注入する     |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録する  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションのCompaction開始/終了時に表示可能なチャット通知を送信する |
| boot-md               | `gateway:startup`                                 | gateway の起動時に `BOOT.md` を実行する                        |

バンドル済みフックを有効化するには:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

直近 15 件のユーザー/アシスタントメッセージを抽出し、ホストのローカル日付を使って `<workspace>/memory/YYYY-MM-DD-HHMM.md` に保存します。メモリキャプチャはバックグラウンドで実行されるため、`/new` と `/reset` の確認応答がトランスクリプト読み取りや任意の slug 生成で遅延することはありません。設定済みモデルで説明的なファイル名 slug を生成するには、`hooks.internal.entries.session-memory.llmSlug: true` を設定します。`workspace.dir` の設定が必要です。

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

パスはワークスペースを基準に解決されます。認識されるブートストラップのベース名のみが読み込まれます (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトのCompactionを開始および終了したとき、現在の会話に短いステータスメッセージを送信します。これにより、チャット画面では、アシスタントがコンテキストを要約しており、Compaction後に続行することがユーザーに見えるため、長いターンがわかりやすくなります。

<a id="boot-md"></a>

### boot-md の詳細

gateway の起動時に、アクティブなワークスペースの `BOOT.md` を実行します。

## Plugin フック

Plugin は、Plugin SDK を通じて型付きフックを登録し、より深く統合できます:
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などです。
`before_tool_call`、`before_agent_reply`、
`before_install`、またはその他のインプロセスなライフサイクルフックが必要な場合は、Plugin フックを使用します。

Plugin 管理の内部フックは別物です。このページの粗いコマンド/ライフサイクルイベントシステムに参加し、`openclaw hooks list` では
`plugin:<id>` として表示されます。順序付きミドルウェアやポリシーゲートではなく、フックパックとの互換性や副作用のために使用します。

完全な Plugin フックリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

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
従来の `hooks.internal.handlers` 配列設定形式は後方互換性のためにまだサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
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

- **ハンドラーを高速に保つ。** フックはコマンド処理中に実行されます。重い処理は `void processInBackground(event)` でバックグラウンドに渡します。
- **エラーを適切に処理する。** リスクのある操作は try/catch でラップし、他のハンドラーが実行できるように throw しないでください。
- **イベントを早めにフィルタリングする。** イベントの type/action が関係ない場合は、ただちに return します。
- **具体的なイベントキーを使用する。** オーバーヘッドを減らすため、`"events": ["command"]` よりも `"events": ["command:new"]` を優先します。

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

不足しているバイナリ (PATH)、環境変数、設定値、または OS 互換性を確認してください。

### フックが実行されない

1. フックが有効化されていることを確認します: `openclaw hooks list`
2. フックを再読み込みするため、gateway プロセスを再起動します。
3. gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI リファレンス: hooks](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — インプロセスの Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
