---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベント向けにイベント駆動型の自動化を行いたい場合
    - フックをビルド、インストール、またはデバッグしたい
summary: 'フック: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-05-05T08:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hooks は、Gateway 内で何かが発生したときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks` で検査できます。Gateway は、hooks を有効化するか、少なくとも 1 つの hook エントリ、hook pack、レガシーハンドラ、または追加の hook ディレクトリを設定した後でのみ、内部 hooks を読み込みます。

OpenClaw には 2 種類の hooks があります。

- **内部 hooks**（このページ）: `/new`、`/reset`、`/stop`、ライフサイクルイベントなどのエージェントイベントが発火したときに、Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw で作業をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

Hooks は Plugin 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロン hooks と Plugin 管理の hooks の両方を表示します。

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
| `gateway:startup`        | チャンネルが開始され、hooks が読み込まれた後               |
| `gateway:shutdown`       | Gateway のシャットダウンが始まったとき                     |
| `gateway:pre-restart`    | 予定された Gateway 再起動の前                              |
| `message:received`       | 任意のチャンネルからの受信メッセージ                       |
| `message:transcribed`    | 音声文字起こしが完了した後                                 |
| `message:preprocessed`   | メディアとリンクの前処理が完了した、またはスキップされた後 |
| `message:sent`           | 送信メッセージが配信されたとき                             |

## Hooks の作成

### Hook 構造

各 hook は、2 つのファイルを含むディレクトリです。

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

| フィールド | 説明                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | CLI 用の表示絵文字                                     |
| `events`   | 待ち受けるイベントの配列                               |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`） |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）    |
| `requires` | 必要な `bins`、`anyBins`、`env`、または `config` パス   |
| `always`   | 適格性チェックをバイパスする（真偽値）                 |
| `install`  | インストール方法                                       |

### ハンドラ実装

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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するには push）、`context`（イベント固有のデータ）が含まれます。エージェントとツール Plugin の hook コンテキストには、`trace` も含められます。これは、Plugin が OTEL 相関のために構造化ログへ渡すことができる、読み取り専用の W3C 互換診断トレースコンテキストです。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。`context.content` は、コマンド風メッセージでは空でないコマンド本文を優先し、その後、生の受信本文と汎用本文にフォールバックします。スレッド履歴やリンク要約など、エージェント専用の拡充情報は含まれません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡充された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントのみです。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` には `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行することを監視します。これはキャンセル/コマンドのライフサイクルであり、エージェントの最終化ゲートではありません。自然な最終回答を検査し、もう一度パスするようエージェントに依頼する必要がある Plugin は、代わりに型付き Plugin hook の `before_agent_finalize` を使用してください。[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウンが始まると発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予定された再起動の一部であり、有限の `restartExpectedMs` 値が提供された場合にのみ発火します。シャットダウン中、各ライフサイクル hook の待機はベストエフォートで制限されるため、ハンドラが停止してもシャットダウンは続行されます。

## Hook の検出

Hooks は、上書き優先度が低い順に、次のディレクトリから検出されます。

1. **バンドル hooks**: OpenClaw に同梱
2. **Plugin hooks**: インストール済み Plugin 内にバンドルされた hooks
3. **管理 hooks**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs` からの追加ディレクトリもこの優先度を共有します。
4. **ワークスペース hooks**: `<workspace>/hooks/`（エージェントごと、明示的に有効化されるまでデフォルトでは無効）

ワークスペース hooks は新しい hook 名を追加できますが、同じ名前のバンドル、管理、または Plugin 提供の hooks を上書きすることはできません。

Gateway は、内部 hooks が設定されるまで、起動時に内部 hook 検出をスキップします。バンドルまたは管理対象の hook を `openclaw hooks enable <name>` で有効化するか、hook pack をインストールするか、`hooks.internal.enabled=true` を設定してオプトインしてください。名前付き hook を 1 つ有効化すると、Gateway はその hook のハンドラだけを読み込みます。`hooks.internal.enabled=true`、追加 hook ディレクトリ、レガシーハンドラは、広範な検出にオプトインします。

### Hook packs

フックパックは、`package.json` の `openclaw.hooks` 経由でフックをエクスポートする npm パッケージです。次のコマンドでインストールします。

```bash
openclaw plugins install <path-or-spec>
```

npm spec はレジストリのみです（パッケージ名 + 任意の厳密なバージョンまたは dist-tag）。Git/URL/file spec と semver 範囲は拒否されます。

## 同梱フック

| フック                | イベント                                          | 動作                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存します    |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを注入します   |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録します |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションの Compaction 開始/終了時に、見えるチャット通知を送信します |
| boot-md               | `gateway:startup`                                 | Gateway の起動時に `BOOT.md` を実行します                      |

同梱フックを有効化するには、次を実行します。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後の 15 件のユーザー/アシスタントメッセージを抽出し、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-HHMM.md` に保存します。メモリ取得はバックグラウンドで実行されるため、`/new` と `/reset` の確認応答がトランスクリプトの読み取りや任意の slug 生成で遅延することはありません。設定済みモデルで説明的なファイル名 slug を生成するには、`hooks.internal.entries.session-memory.llmSlug: true` を設定します。`workspace.dir` の設定が必要です。

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

パスはワークスペースからの相対パスとして解決されます。認識済みのブートストラップベース名のみが読み込まれます（`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトの Compaction を開始および終了したときに、現在の会話へ短いステータスメッセージを送信します。これにより、ユーザーはアシスタントがコンテキストを要約しており、Compaction 後に続行することを確認できるため、チャット画面で長いターンが分かりやすくなります。

<a id="boot-md"></a>

### boot-md の詳細

Gateway の起動時に、アクティブなワークスペースの `BOOT.md` を実行します。

## Plugin フック

Plugin は、より深い統合のために Plugin SDK 経由で型付きフックを登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などに利用できます。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のインプロセスライフサイクルフックが必要な場合は、Plugin フックを使用します。

Plugin フックの完全なリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

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
レガシーの `hooks.internal.handlers` 配列設定形式は後方互換性のために引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
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

- **ハンドラーを高速に保つ。** フックはコマンド処理中に実行されます。重い処理は `void processInBackground(event)` で起動して完了を待たないようにします。
- **エラーを適切に処理する。** リスクのある操作は try/catch で囲み、他のハンドラーが実行できるように例外を送出しないでください。
- **イベントを早期にフィルタリングする。** イベントタイプまたはアクションが関連しない場合は、すぐに return してください。
- **具体的なイベントキーを使用する。** オーバーヘッドを減らすため、`"events": ["command"]` よりも `"events": ["command:new"]` を優先してください。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべきもの: HOOK.md, handler.ts

# 検出されたすべてのフックを一覧表示
openclaw hooks list
```

### フックが対象外になる

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS 互換性を確認してください。

### フックが実行されない

1. フックが有効になっていることを確認します: `openclaw hooks list`
2. フックを再読み込みするため、gateway プロセスを再起動します。
3. gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連項目

- [CLI リファレンス: hooks](/ja-JP/cli/hooks)
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — インプロセスの Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
