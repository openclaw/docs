---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベント向けにイベント駆動型の自動化が必要な場合
    - hooks をビルド、インストール、またはデバッグしたい
summary: 'フック: コマンドとライフサイクルイベント向けのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-07-05T11:00:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b35a7f4bf42ed45960b6988e6640b64c5c70c0948234f9403872007565bc8e6
    source_path: automation/hooks.md
    workflow: 16
---

フックは、エージェントイベントの発火時に Gateway 内で実行される小さなスクリプトです。対象には `/new`、`/reset`、`/stop` のようなコマンド、セッション Compaction、Gateway ライフサイクル、メッセージフローがあります。フックはディレクトリから検出され、`openclaw hooks` で管理されます。Gateway は、フックを有効化するか、少なくとも 1 つのフックエントリ、フックパック、レガシーハンドラー、または追加フックディレクトリを設定した後にのみ内部フックを読み込みます。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: エージェントイベントの発火時に Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw 内で作業をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

フックは Plugin 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロンフックと Plugin 管理フック（`plugin:<id>` として表示）の両方を表示します。

## 適切なサーフェスを選ぶ

OpenClaw には、似て見えても解決する問題が異なる拡張サーフェスがいくつかあります。

| したいこと...                                                                                                      | 使うもの...                             | 理由                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/new` でスナップショットを保存する、`/reset` をログに記録する、`message:sent` 後に外部 API を呼び出す、または大まかなオペレーター自動化を追加する | 内部フック（`HOOK.md`、このページ） | ファイルベースのフックは、オペレーター管理の副作用とコマンド/ライフサイクル自動化を目的としています |
| プロンプトを書き換える、ツールをブロックする、送信メッセージをキャンセルする、または順序付きミドルウェア/ポリシーを追加する                              | `api.on(...)` による型付きPluginフック  | 型付きフックには、明示的な契約、優先度、マージルール、ブロック/キャンセルセマンティクスがあります      |
| テレメトリ専用のエクスポートやオブザーバビリティを追加する                                                                            | 診断イベント                     | オブザーバビリティは独立したイベントバスであり、ポリシーフックサーフェスではありません                              |

小さなインストール済み連携のように振る舞う自動化が必要な場合は、内部フックを使用してください。ランタイムライフサイクル制御が必要な場合は、型付きPluginフックを使用してください。

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

| イベント                    | 発火するタイミング                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` コマンドが発行されたとき                                      |
| `command:reset`          | `/reset` コマンドが発行されたとき                                    |
| `command:stop`           | `/stop` コマンドが発行されたとき                                     |
| `command`                | 任意のコマンドイベント（汎用リスナー）                       |
| `session:compact:before` | Compaction が履歴を要約する前                       |
| `session:compact:after`  | Compaction の完了後                                 |
| `session:patch`          | セッションプロパティが変更されたとき                       |
| `agent:bootstrap`        | ワークスペースブートストラップファイルが注入される前              |
| `gateway:startup`        | チャネルが開始し、フックが読み込まれた後                  |
| `gateway:shutdown`       | Gateway のシャットダウンが始まるとき                               |
| `gateway:pre-restart`    | 予期された Gateway 再起動の前                         |
| `message:received`       | 任意のチャネルからの受信メッセージ                           |
| `message:transcribed`    | 音声文字起こしの完了後                        |
| `message:preprocessed`   | メディアとリンクの前処理が完了した後、またはスキップされた後 |
| `message:sent`           | 送信が試行されたとき（`context.success` に結果があります） |

## フックを書く

### フック構造

各フックは 2 つのファイルを含むディレクトリです。

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

ハンドラーファイルには `handler.ts`、`handler.js`、`index.ts`、または `index.js` を使用できます。

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

| フィールド      | 説明                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 用の表示絵文字                                |
| `events`   | リッスンするイベントの配列                        |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`）        |
| `os`       | 必須プラットフォーム（例: `["darwin", "linux"]`）     |
| `requires` | 必須の `bins`、`anyBins`、`env`、または `config` パス |
| `always`   | 適格性チェックをバイパスする（ブール値）                  |
| `hookKey`  | 設定キーの上書き（デフォルトはフック名）      |
| `homepage` | `openclaw hooks info` で表示されるドキュメント URL              |
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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`、および `context`（イベント固有データ）が含まれます。エージェントフックとツールフックの型付きPluginフックコンテキストには、`trace` も含められます。これは読み取り専用の W3C 互換診断トレースコンテキストで、Plugin が OTEL 相関用の構造化ログに渡せます。

`event.messages` に追加された文字列は、
`command:new` と `command:reset`（発信元の会話への返信としてルーティング）および
`session:compact:before` / `session:compact:after`
（Compaction ステータス通知として送信）の場合にのみチャットへ戻されます。
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch`、および
`gateway:*` を含むその他すべてのイベントでは、追加されたメッセージは無視されます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**コマンドイベント**（`command:stop`）: `context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。`context.content` は、コマンド風メッセージでは空でないコマンド本文を優先し、その後に未加工の受信本文と汎用本文へフォールバックします。スレッド履歴やリンク要約のようなエージェント専用の拡充情報は含まれません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`、送信に失敗した場合は `context.error`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡充された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントだけです。コンテキストはクローンであるため、ハンドラーはライブのセッションエントリを変更できません。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` は `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` を追加します。

`command:stop` は、ユーザーが `/stop` を発行したことを観測します。これはキャンセル/コマンド
ライフサイクルであり、エージェント最終化ゲートではありません。自然な最終回答を検査し、
エージェントにもう一度処理させる必要がある Plugin は、代わりに型付き
Plugin フック `before_agent_finalize` を使用してください。[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウン開始時に発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予期された再起動の一部であり、有限の `restartExpectedMs` 値が提供された場合にのみ発火します。シャットダウン中、各ライフサイクルフックの待機はベストエフォートかつ有界であり、ハンドラーが停止してもシャットダウンは続行されます。デフォルトの待機予算は `gateway:shutdown` で 5 秒、`gateway:pre-restart` で 10 秒です。

チャネルがまだ利用可能な間に短い再起動通知を送るには、`gateway:pre-restart` を使用してください。

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

`gateway:shutdown`（または `gateway:pre-restart`）イベントと残りのシャットダウンシーケンスの間に、Gateway は、プロセス停止時にまだアクティブだった各セッションに対して型付き `session_end` Plugin フックも発火します。通常の SIGTERM/SIGINT 停止の場合、イベントの `reason` は `shutdown` で、予期された再起動の一部として終了がスケジュールされた場合は `restart` です。このドレインは有界であるため、遅い `session_end` ハンドラーがプロセス終了をブロックすることはありません。また、置換 / リセット / 削除 / Compaction によってすでに最終化されたセッションは、二重発火を避けるためスキップされます。

## フック検出

フックは 4 つのソースから検出されます。

1. **バンドルフック**: OpenClaw に同梱されています
2. **Plugin フック**: インストール済み Plugin 内にバンドルされています。同じ名前のバンドルフックを上書きできます
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーインストール済み、ワークスペース間で共有）。バンドルフックと Plugin フックを上書きできます。`hooks.internal.load.extraDirs` からの追加ディレクトリもこの優先順位を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと、明示的に有効化されるまでデフォルトでは無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前のバンドル、管理、または Plugin 提供フックを上書きすることはできません。

Gateway は、内部フックが設定されるまで、起動時の内部フック検出をスキップします。`openclaw hooks enable <name>` でバンドルまたは管理フックを有効化する、フックパックをインストールする、または `hooks.internal.enabled=true` を設定してオプトインしてください。名前付きフックを 1 つ有効化すると、Gateway はそのフックのハンドラーだけを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、およびレガシーハンドラーは広範な検出にオプトインします。

### フックパック

フックパックは、`package.json` 内の `openclaw.hooks` を介してフックをエクスポートする npm パッケージです。次でインストールします。

```bash
openclaw plugins install <path-or-spec>
```

npm 仕様はレジストリ限定です（パッケージ名 + 任意の正確なバージョンまたは dist-tag）。Git/URL/file 仕様と semver 範囲は拒否されます。古い `openclaw hooks install` と `openclaw hooks update` コマンドは、`openclaw plugins install` / `openclaw plugins update` の非推奨エイリアスです。

## バンドルフック

| フック                  | イベント                                            | 機能                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存します                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを注入します          |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録します           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションのCompaction開始/終了時に、表示可能なチャット通知を送信します |
| boot-md               | `gateway:startup`                                 | Gateway の起動時に `BOOT.md` を実行します                         |

任意のバンドル済みフックを有効化します。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後のユーザー/アシスタントメッセージ（デフォルトは 15 件、`hooks.internal.entries.session-memory.messages` で設定可能）を抽出し、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-HHMM.md` に保存します。メモリ取得はバックグラウンドで実行されるため、`/new` と `/reset` の確認応答がトランスクリプト読み取りや任意のスラッグ生成によって遅延することはありません。設定済みモデルで説明的なファイル名スラッグを生成するには、`hooks.internal.entries.session-memory.llmSlug: true` を設定します（利用できない場合はタイムスタンプスラッグにフォールバックします）。`workspace.dir` が設定されている必要があります。

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

`patterns` と `files` は `paths` のエイリアスとして受け付けられます。パスはワークスペースからの相対パスとして解決され、必ずその内部に留まる必要があります。認識されたブートストラップのベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを JSON 行（タイムスタンプ、アクション、セッションキー、送信者 ID、ソース）として `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトのCompactionを開始および完了したとき、現在の会話に短いステータスメッセージを送信します。これにより、アシスタントがコンテキストを要約しており、Compaction 後に続行することをユーザーが確認できるため、チャットサーフェスでの長いターンがわかりやすくなります。

<a id="boot-md"></a>

### boot-md の詳細

設定済みの各エージェントスコープについて、そのエージェントの解決済みワークスペースにファイルが存在する場合、Gateway 起動時に `BOOT.md` を実行します。

## Plugin フック

Plugin は、より深い統合のために Plugin SDK 経由で型付きフックを登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが可能です。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のプロセス内ライフサイクルフックが必要な場合は、Plugin フックを使用してください。

Plugin 管理の内部フックは異なります。このページの粗いコマンド/ライフサイクルイベントシステムに参加し、`openclaw hooks list` では `plugin:<id>` として表示されます。
これらは、副作用やフックパックとの互換性のために使用し、順序付きミドルウェアやポリシーゲートには使用しないでください。

完全な Plugin フックリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

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

フックごとの環境値は、プロセス環境とあわせてフックの `requires.env` 適格性チェックを満たし、ハンドラーはそれらを自身のフック設定エントリから読み取れます。

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
従来の `hooks.internal.handlers` 配列設定形式は後方互換性のために引き続きサポートされていますが、新しいフックは探索ベースのシステムを使用する必要があります。
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

- **ハンドラーを高速に保つ。** フックはコマンド処理中に実行されます。重い処理は `void processInBackground(event)` で fire-and-forget にします。
- **エラーを適切に処理する。** リスクのある操作は try/catch でラップします。他のハンドラーが実行できるように throw しないでください。
- **イベントを早めにフィルタリングする。** イベントの種類/アクションが関連しない場合は、すぐに return します。
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

### フックが適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS 互換性を確認してください。

### フックが実行されない

1. フックが有効になっていることを確認します: `openclaw hooks list`
2. フックを再読み込みするため、Gateway プロセスを再起動します。
3. Gateway ログを確認します: `openclaw logs --follow | grep -i hook`

## 関連

- [CLI リファレンス: hooks](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — プロセス内 Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
