---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベント向けにイベント駆動の自動化が必要な場合
    - ビルド、インストール、またはフックのデバッグを行いたい
summary: 'フック: コマンドとライフサイクルイベントのためのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-07-06T10:46:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59dbead00dcdbd90532643e79f3e66bcc1ecc3a2e474c8d3d2916b47530178a2
    source_path: automation/hooks.md
    workflow: 16
---

フックは、エージェントイベントが発火したときに Gateway 内で実行される小さなスクリプトです。対象には `/new`、`/reset`、`/stop` のようなコマンド、セッションCompaction、Gateway ライフサイクル、メッセージフローがあります。フックはディレクトリから検出され、`openclaw hooks` で管理されます。Gateway は、フックを有効化するか、少なくとも 1 つのフックエントリ、フックパック、レガシーハンドラー、または追加フックディレクトリを設定した後にのみ、内部フックを読み込みます。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: エージェントイベントが発火したときに Gateway 内で実行されます。
- **Webhooks**: 他のシステムが OpenClaw で作業をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

フックは Plugin 内にバンドルすることもできます。`openclaw hooks list` は、スタンドアロンフックと Plugin 管理フック（`plugin:<id>` として表示）の両方を表示します。

## 適切なサーフェスを選ぶ

OpenClaw には、見た目は似ているものの異なる問題を解決する拡張サーフェスがいくつかあります。

| やりたいこと                                                                                                          | 使用するもの                            | 理由                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/new` でスナップショットを保存する、`/reset` をログに記録する、`message:sent` の後に外部 API を呼び出す、または粗いオペレーター自動化を追加する | 内部フック（`HOOK.md`、このページ） | ファイルベースのフックは、オペレーター管理の副作用とコマンド/ライフサイクル自動化向けです |
| プロンプトを書き換える、ツールをブロックする、送信メッセージをキャンセルする、または順序付きのミドルウェア/ポリシーを追加する | `api.on(...)` による型付き Plugin フック | 型付きフックには、明示的なコントラクト、優先度、マージルール、ブロック/キャンセルのセマンティクスがあります |
| テレメトリ専用のエクスポートまたはオブザーバビリティを追加する                                                        | 診断イベント                            | オブザーバビリティは別個のイベントバスであり、ポリシーフックサーフェスではありません       |

小さなインストール済み連携のように振る舞う自動化が必要な場合は、内部フックを使用してください。ランタイムライフサイクル制御が必要な場合は、型付き Plugin フックを使用してください。

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

フックは、この表の特定のキー、またはベアなファミリー名
（`command`、`session`、`agent`、`gateway`、`message`）を購読して、そのファミリー内のすべてのアクションを受信します。OpenClaw コアはそれ以外を発行しないため、他の名前はほぼ常にタイプミスであり、フックは何も起こさず停止したままになります（カスタムイベントを発行する Plugin だけが発火できます）。フックローダーはそのような名前（たとえば `command:nwe`）に警告をログ出力し、`openclaw hooks info <name>` もフラグを立てるため、実行されないフックは診断できます。

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
| `gateway:shutdown`       | Gateway のシャットダウンが始まるとき                       |
| `gateway:pre-restart`    | 予期された Gateway 再起動の前                              |
| `message:received`       | 任意のチャンネルからの受信メッセージ                       |
| `message:transcribed`    | 音声文字起こしが完了した後                                 |
| `message:preprocessed`   | メディアとリンクの前処理が完了した後、またはスキップされた後 |
| `message:sent`           | 送信が試行されたとき（`context.success` に結果があります） |

## フックを書く

### フック構造

各フックは、2 つのファイルを含むディレクトリです。

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

ハンドラーファイルは `handler.ts`、`handler.js`、`index.ts`、または `index.js` にできます。

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
| `events`   | リッスンするイベントの配列                           |
| `export`   | 使用する名前付きエクスポート（既定は `"default"`）   |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）  |
| `requires` | 必要な `bins`、`anyBins`、`env`、または `config` パス |
| `always`   | 適格性チェックをバイパスする（真偽値）               |
| `hookKey`  | 設定キーの上書き（既定はフック名）                   |
| `homepage` | `openclaw hooks info` で表示されるドキュメント URL   |
| `install`  | インストール方法                                     |

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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`、および `context`（イベント固有データ）が含まれます。エージェントフックとツールフックの型付き Plugin フックコンテキストには、`trace` も含まれる場合があります。これは読み取り専用の W3C 互換診断トレースコンテキストで、Plugin は OTEL 相関のために構造化ログへ渡せます。

`event.messages` にプッシュされた文字列がチャットに返されるのは、
`command:new` と `command:reset`（発信元の会話への返信としてルーティング）および `session:compact:before` / `session:compact:after`
（Compaction ステータス通知として送信）の場合だけです。
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch`、`gateway:*` を含むその他すべてのイベントでは、プッシュされたメッセージは無視されます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**コマンドイベント**（`command:stop`）: `context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。`context.content` は、コマンドのようなメッセージでは空でないコマンド本文を優先し、その後で生の受信本文と汎用本文にフォールバックします。スレッド履歴やリンク要約のようなエージェント専用の拡張情報は含みません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`、送信に失敗した場合はさらに `context.error`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的な拡張済み本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（可変配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントだけです。コンテキストはクローンであるため、ハンドラーはライブのセッションエントリを変更できません。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` には `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行することを監視します。これはキャンセル/コマンドライフサイクルであり、エージェントの最終化ゲートではありません。自然な最終回答を検査し、エージェントにもう一度パスを求める必要がある Plugin は、代わりに型付き Plugin フック `before_agent_finalize` を使用してください。[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウンが始まると発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予期された再起動の一部であり、有限の `restartExpectedMs` 値が提供された場合にのみ発火します。シャットダウン中、各ライフサイクルフックの待機はベストエフォートで上限付きのため、ハンドラーが停止してもシャットダウンは継続します。既定の待機予算は、`gateway:shutdown` が 5 秒、`gateway:pre-restart` が 10 秒です。

チャンネルがまだ利用可能な間に短い再起動通知を送るには、`gateway:pre-restart` を使用してください。

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

`gateway:shutdown`（または `gateway:pre-restart`）イベントと残りのシャットダウンシーケンスの間に、Gateway は、プロセス停止時点でまだアクティブだった各セッションに対して、型付きの `session_end` Plugin フックも発火します。イベントの `reason` は、通常の SIGTERM/SIGINT 停止では `shutdown`、予期された再起動の一部としてクローズがスケジュールされた場合は `restart` です。このドレインは上限付きのため、遅い `session_end` ハンドラーがプロセス終了をブロックすることはありません。また、置換 / リセット / 削除 / Compaction を通じてすでに最終化されたセッションは、二重発火を避けるためにスキップされます。

## フック検出

フックは 4 つのソースから検出されます。

1. **バンドルフック**: OpenClaw に同梱されています
2. **Plugin フック**: インストール済み Plugin 内にバンドルされています。同じ名前のバンドルフックを上書きできます
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。バンドルフックと Plugin フックを上書きできます。`hooks.internal.load.extraDirs` からの追加ディレクトリもこの優先順位を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと。明示的に有効化されるまでは既定で無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前のバンドル、管理、または Plugin 提供フックを上書きすることはできません。

Gateway は、内部フックが設定されるまで、起動時の内部フック検出をスキップします。バンドルまたは管理フックを有効化するには `openclaw hooks enable <name>` を使用し、フックパックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインしてください。名前付きフックを 1 つ有効化すると、Gateway はそのフックのハンドラーだけを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、レガシーハンドラーは、広範な検出にオプトインします。

### フックパック

フックパックは、`package.json` の `openclaw.hooks` を介してフックをエクスポートする npm パッケージです。次のようにインストールします。

```bash
openclaw plugins install <path-or-spec>
```

npm仕様はレジストリのみです（パッケージ名 + 任意の厳密なバージョンまたはdist-tag）。Git/URL/file仕様とsemver範囲は拒否されます。古い`openclaw hooks install`コマンドと`openclaw hooks update`コマンドは、`openclaw plugins install` / `openclaw plugins update`の非推奨エイリアスです。

## バンドルされたフック

| フック                | イベント                                          | 動作                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを`<workspace>/memory/`に保存します     |
| bootstrap-extra-files | `agent:bootstrap`                                 | globパターンから追加のブートストラップファイルを注入します    |
| command-logger        | `command`                                         | すべてのコマンドを`~/.openclaw/logs/commands.log`に記録します |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションCompactionの開始/終了時に表示可能なチャット通知を送信します |
| boot-md               | `gateway:startup`                                 | Gatewayの起動時に`BOOT.md`を実行します                        |

任意のバンドルフックを有効化します。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memoryの詳細

最後のユーザー/アシスタントメッセージ（デフォルトは15件、`hooks.internal.entries.session-memory.messages`で設定可能）を抽出し、ホストのローカル日付を使用して`<workspace>/memory/YYYY-MM-DD-HHMM.md`に保存します。メモリキャプチャはバックグラウンドで実行されるため、`/new`と`/reset`の確認応答がトランスクリプトの読み取りや任意のスラッグ生成によって遅延しません。設定済みモデルで説明的なファイル名スラッグを生成するには、`hooks.internal.entries.session-memory.llmSlug: true`を設定します（利用できない場合はタイムスタンプスラッグにフォールバックします）。`workspace.dir`が設定されている必要があります。

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

`patterns`と`files`は`paths`のエイリアスとして受け入れられます。パスはワークスペースを基準に解決され、その内部に留まる必要があります。認識されたブートストラップベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-loggerの詳細

すべてのスラッシュコマンドをJSON行（タイムスタンプ、アクション、セッションキー、送信者ID、ソース）として`~/.openclaw/logs/commands.log`に記録します。

<a id="compaction-notifier"></a>

### compaction-notifierの詳細

OpenClawがセッションのトランスクリプトの圧縮を開始および終了すると、現在の会話に短いステータスメッセージを送信します。これにより、チャットサーフェス上の長いターンで、アシスタントがコンテキストを要約しており、Compaction後に続行することをユーザーが確認できるため、混乱が少なくなります。

<a id="boot-md"></a>

### boot-mdの詳細

設定された各エージェントスコープについて、そのエージェントの解決済みワークスペースにファイルが存在する場合、Gateway起動時に`BOOT.md`を実行します。

## Pluginフック

Pluginは、より深い統合のためにPlugin SDKを通じて型付きフックを登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などを行えます。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のインプロセスライフサイクルフックが必要な場合は、Pluginフックを使用してください。

Plugin管理の内部フックは異なります。このページの粗いコマンド/ライフサイクルイベントシステムに参加し、`openclaw hooks list`では`plugin:<id>`として表示されます。これらは副作用やフックパックとの互換性のために使用し、順序付きミドルウェアやポリシーゲートには使用しないでください。

完全なPluginフックのリファレンスについては、[Pluginフック](/ja-JP/plugins/hooks)を参照してください。

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

フックごとの環境値は、フックの`requires.env`適格性チェックを満たし（プロセス環境と併せて）、ハンドラーはそれらをフック設定エントリから読み取れます。

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
従来の`hooks.internal.handlers`配列設定形式は後方互換性のために引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
</Note>

## CLIリファレンス

```bash
# すべてのフックを一覧表示（--eligible、--verbose、または--jsonを追加）
openclaw hooks list

# フックに関する詳細情報を表示
openclaw hooks info <hook-name>

# 適格性の概要を表示
openclaw hooks check

# 有効化/無効化
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーは高速に保つ。** フックはコマンド処理中に実行されます。重い処理は`void processInBackground(event)`でfire-and-forgetにします。
- **エラーを適切に処理する。** リスクのある操作はtry/catchでラップします。他のハンドラーが実行できるようにthrowしないでください。
- **イベントを早期にフィルタリングする。** イベントタイプ/アクションが関係ない場合は、すぐにreturnします。
- **具体的なイベントキーを使用する。** オーバーヘッドを減らすため、`"events": ["command"]`よりも`"events": ["command:new"]`を優先してください。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべき内容: HOOK.md, handler.ts

# 検出されたすべてのフックを一覧表示
openclaw hooks list
```

### フックが適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、またはOS互換性を確認してください。

### フックが実行されない

1. フックが有効化されていることを確認します: `openclaw hooks list`
2. フックを再読み込みするため、Gatewayプロセスを再起動します。
3. Gatewayログを確認します: `openclaw logs --follow | grep -i hook`

## 関連

- [CLIリファレンス: フック](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Pluginフック](/ja-JP/plugins/hooks) — インプロセスPluginライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
