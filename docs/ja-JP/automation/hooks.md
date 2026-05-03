---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベント向けのイベント駆動型自動化が必要な場合
    - フックをビルド、インストール、またはデバッグしたい
summary: 'フック: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-05-03T21:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks は、Gateway 内で何かが発生したときに実行される小さなスクリプトです。ディレクトリから検出でき、`openclaw hooks` で検査できます。Gateway は、hooks を有効にするか、少なくとも 1 つの hook エントリ、hook パック、レガシーハンドラー、または追加の hook ディレクトリを設定した後にのみ、内部 hooks を読み込みます。

OpenClaw には 2 種類の hooks があります。

- **内部 hooks**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントのような agent イベントが発火したときに、Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw で作業をトリガーできるようにする外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

Hooks は plugins の中にバンドルすることもできます。`openclaw hooks list` は、スタンドアロン hooks と plugin 管理の hooks の両方を表示します。

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

| イベント                 | 発火するタイミング                                         |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` コマンドが発行されたとき                            |
| `command:reset`          | `/reset` コマンドが発行されたとき                          |
| `command:stop`           | `/stop` コマンドが発行されたとき                           |
| `command`                | 任意のコマンドイベント（汎用リスナー）                     |
| `session:compact:before` | Compaction が履歴を要約する前                              |
| `session:compact:after`  | Compaction が完了した後                                    |
| `session:patch`          | セッションプロパティが変更されたとき                       |
| `agent:bootstrap`        | ワークスペースのブートストラップファイルが挿入される前     |
| `gateway:startup`        | チャンネルが開始し、hooks が読み込まれた後                 |
| `gateway:shutdown`       | Gateway のシャットダウンが始まったとき                     |
| `gateway:pre-restart`    | 想定された Gateway 再起動の前                              |
| `message:received`       | 任意のチャンネルからの受信メッセージ                       |
| `message:transcribed`    | 音声文字起こしが完了した後                                 |
| `message:preprocessed`   | メディアとリンクの前処理が完了した後、またはスキップされた後 |
| `message:sent`           | 送信メッセージが配信されたとき                             |

## hooks の作成

### hook 構造

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

| フィールド | 説明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI に表示する絵文字                                 |
| `events`   | リッスンするイベントの配列                           |
| `export`   | 使用する名前付き export（デフォルトは `"default"`）  |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）  |
| `requires` | 必要な `bins`、`anyBins`、`env`、または `config` パス |
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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーに送信するには push）、および `context`（イベント固有のデータ）が含まれます。Agent と tool plugin の hook コンテキストには `trace` も含めることができ、これは読み取り専用の W3C 互換診断 trace コンテキストで、plugins は OTEL 相関のために構造化ログへ渡せます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。`context.content` は、コマンドのようなメッセージでは空でないコマンド本文を優先し、その後、生の受信本文と汎用本文へフォールバックします。スレッド履歴やリンク要約のような agent 専用の補強情報は含みません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に補強された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは権限のあるクライアントのみです。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` は `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` を追加します。

`command:stop` は、ユーザーが `/stop` を発行することを監視します。これは cancellation/command
ライフサイクルであり、agent の最終化ゲートではありません。
自然な最終回答を検査し、agent にもう一度処理を依頼する必要がある plugins は、代わりに型付きの
plugin hook `before_agent_finalize` を使用してください。[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウンが始まると発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが想定された再起動の一部であり、有限の `restartExpectedMs` 値が提供された場合にのみ発火します。シャットダウン中、各ライフサイクル hook の待機はベストエフォートかつ上限付きであるため、ハンドラーが停止してもシャットダウンは継続します。

## hook 検出

Hooks は、上書き優先度が低いものから高いものの順に、次のディレクトリから検出されます。

1. **バンドル hooks**: OpenClaw に同梱されています
2. **Plugin hooks**: インストール済み plugins の中にバンドルされた hooks
3. **管理対象 hooks**: `~/.openclaw/hooks/`（ユーザーインストール済み、ワークスペース間で共有）。`hooks.internal.load.extraDirs` の追加ディレクトリもこの優先度を共有します。
4. **ワークスペース hooks**: `<workspace>/hooks/`（agent ごと、明示的に有効化されるまでデフォルトで無効）

ワークスペース hooks は新しい hook 名を追加できますが、同じ名前のバンドル、管理対象、または plugin 提供の hooks を上書きすることはできません。

Gateway は、内部 hooks が設定されるまで、起動時に内部 hook 検出をスキップします。`openclaw hooks enable <name>` でバンドルまたは管理対象 hook を有効化するか、hook パックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインしてください。名前付き hook を 1 つ有効化すると、Gateway はその hook のハンドラーだけを読み込みます。`hooks.internal.enabled=true`、追加 hook ディレクトリ、レガシーハンドラーは広範な検出にオプトインします。

### hook パック

Hook パックは、`package.json` の `openclaw.hooks` を通じて hooks を export する npm パッケージです。次でインストールします。

```bash
openclaw plugins install <path-or-spec>
```

Npm specs はレジストリのみです（パッケージ名 + 任意の厳密なバージョンまたは dist-tag）。Git/URL/file specs と semver 範囲は拒否されます。

## バンドル hooks

| hook                  | イベント                                          | 動作                                                         |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存します  |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを挿入します |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録します |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッション Compaction の開始/終了時に表示可能なチャット通知を送信します |
| boot-md               | `gateway:startup`                                 | Gateway の起動時に `BOOT.md` を実行します                    |

任意のバンドル hook を有効化します。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後の 15 件の user/assistant メッセージを抽出し、LLM で説明的なファイル名 slug を生成して、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-slug.md` に保存します。`workspace.dir` が設定されている必要があります。

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

パスはワークスペースからの相対パスとして解決されます。認識されるブートストラップのベース名だけが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトの Compaction を開始および終了したときに、短いステータスメッセージを現在の会話へ送信します。これにより、チャットサーフェスでの長いターンがわかりやすくなります。ユーザーは、アシスタントがコンテキストを要約しており、Compaction 後に続行することを確認できます。

<a id="boot-md"></a>

### boot-md の詳細

Gateway の起動時に、アクティブなワークスペースの `BOOT.md` を実行します。

## Plugin hooks

Plugins は、より深い統合のために Plugin SDK を通じて型付き hooks を登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが可能です。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のプロセス内ライフサイクル hooks が必要な場合は、plugin hooks を使用してください。

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

hook ごとの環境変数:

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
レガシーの `hooks.internal.handlers` 配列設定形式は後方互換性のために引き続きサポートされていますが、新しい hooks では検出ベースのシステムを使用してください。
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

- **ハンドラーを高速に保つ。** フックはコマンド処理中に実行されます。重い処理は `void processInBackground(event)` で実行して待たずに進めます。
- **エラーを適切に処理する。** リスクのある操作は try/catch で囲み、他のハンドラーが実行できるように throw しないでください。
- **イベントを早期にフィルターする。** イベントのタイプ/アクションが関係ない場合は即座に return します。
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
2. フックを再読み込みするため、Gateway プロセスを再起動します。
3. Gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI リファレンス: フック](/ja-JP/cli/hooks)
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — インプロセスの Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
