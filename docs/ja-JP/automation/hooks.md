---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対応したイベント駆動型自動化が必要な場合
    - フックの構築、インストール、またはデバッグを行いたい場合
summary: フック：コマンドとライフサイクルイベントのためのイベント駆動型自動化
title: フック
x-i18n:
    generated_at: "2026-07-11T21:59:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

フックは、エージェントイベントの発生時に Gateway 内で実行される小さなスクリプトです。対象には、`/new`、`/reset`、`/stop` などのコマンド、セッションの Compaction、Gateway のライフサイクル、メッセージフローがあります。フックはディレクトリから検出され、`openclaw hooks` で管理されます。Gateway が内部フックを読み込むのは、フックを有効にするか、少なくとも 1 つのフックエントリ、フックパック、レガシーハンドラー、追加フックディレクトリのいずれかを設定した後だけです。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: エージェントイベントの発生時に Gateway 内で実行されます。
- **Webhook**: 他のシステムから OpenClaw の処理をトリガーできる外部 HTTP エンドポイントです。[Webhook](/ja-JP/automation/cron-jobs#webhooks)を参照してください。

フックはプラグイン内に同梱することもできます。`openclaw hooks list` には、単独のフックとプラグイン管理のフック（`plugin:<id>` と表示）の両方が表示されます。

## 適切な拡張面の選択

OpenClaw には、似ているように見えて異なる問題を解決する複数の拡張面があります。

| 実現したいこと                                                                                                                | 使用するもの                           | 理由                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/new` でスナップショットを保存する、`/reset` をログに記録する、`message:sent` 後に外部 API を呼び出す、または大まかな運用自動化を追加する | 内部フック（`HOOK.md`、このページ）    | ファイルベースのフックは、運用者が管理する副作用とコマンド／ライフサイクル自動化を目的としています       |
| プロンプトの書き換え、ツールのブロック、送信メッセージのキャンセル、または順序付きミドルウェア／ポリシーの追加                  | `api.on(...)` による型付きプラグインフック | 型付きフックには、明示的な契約、優先順位、マージ規則、ブロック／キャンセルのセマンティクスがあります      |
| テレメトリ専用のエクスポートまたは可観測性を追加する                                                                          | 診断イベント                           | 可観測性は独立したイベントバスであり、ポリシーフックの拡張面ではありません                               |

小さなインストール済み統合のように動作する自動化が必要な場合は、内部フックを使用します。実行時のライフサイクル制御が必要な場合は、型付きプラグインフックを使用します。

## クイックスタート

```bash
# 利用可能なフックを一覧表示
openclaw hooks list

# フックを有効化
openclaw hooks enable session-memory

# フックの状態を確認
openclaw hooks check

# 詳細情報を取得
openclaw hooks info session-memory
```

## イベントの種類

フックは、この表の特定のキー、または単独のファミリー名
（`command`、`session`、`agent`、`gateway`、`message`）を購読して、そのファミリーのすべてのアクションを
受信します。OpenClaw コアはこれ以外を発行しないため、その他の名前はほぼ
常に入力ミスであり、フックが何も通知せず動作しない原因になります（カスタムイベントを発行する
プラグインだけは、それを発火できます）。フックローダーは、そのような名前
（例: `command:nwe`）に対して警告をログに記録し、`openclaw hooks info <name>` でも指摘するため、
実行されないフックは診断できます。

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
| `gateway:startup`        | チャネルが起動し、フックが読み込まれた後                   |
| `gateway:shutdown`       | Gateway のシャットダウンが開始されたとき                   |
| `gateway:pre-restart`    | 予定された Gateway の再起動前                              |
| `message:received`       | 任意のチャネルから受信メッセージが届いたとき               |
| `message:transcribed`    | 音声の文字起こしが完了した後                               |
| `message:preprocessed`   | メディアとリンクの前処理が完了またはスキップされた後       |
| `message:sent`           | 送信を試行したとき（結果は `context.success` に格納）       |

## フックの作成

### フックの構造

各フックは、2 つのファイルを含むディレクトリです。

```text
my-hook/
├── HOOK.md          # メタデータ + ドキュメント
└── handler.ts       # ハンドラーの実装
```

ハンドラーファイルには、`handler.ts`、`handler.js`、`index.ts`、または `index.js` を使用できます。

### HOOK.md の形式

```markdown
---
name: my-hook
description: "このフックの動作についての短い説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# マイフック

詳細なドキュメントをここに記述します。
```

**メタデータフィールド**（`metadata.openclaw`）:

| フィールド | 説明                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | CLI に表示する絵文字                                   |
| `events`   | 購読するイベントの配列                                 |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`） |
| `os`       | 必須プラットフォーム（例: `["darwin", "linux"]`）      |
| `requires` | 必須の `bins`、`anyBins`、`env`、または `config` パス  |
| `always`   | 適格性チェックを回避するかどうか（真偽値）             |
| `hookKey`  | 設定キーの上書き（デフォルトはフック名）               |
| `homepage` | `openclaw hooks info` で表示するドキュメント URL        |
| `install`  | インストール方法                                       |

### ハンドラーの実装

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

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`、および `context`（イベント固有のデータ）が含まれます。エージェントフックとツールフックの型付きプラグインフックコンテキストには、読み取り専用で W3C 互換の診断トレースコンテキストである `trace` が含まれる場合もあり、プラグインは OTEL の相関処理のために構造化ログへ渡せます。

`event.messages` に追加された文字列がチャットへ返されるのは、
`command:new` と `command:reset`（発生元の会話への返信としてルーティング）、
および `session:compact:before` / `session:compact:after`
（Compaction の状態通知として送信）の場合だけです。
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch`、
`gateway:*` を含むその他すべてのイベントでは、追加されたメッセージは無視されます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**コマンドイベント**（`command:stop`）: `context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有のデータ）。`context.content` は、コマンド形式のメッセージでは空白でないコマンド本文を優先し、その後に生の受信本文、汎用本文の順でフォールバックします。スレッド履歴やリンク要約など、エージェント専用の拡充情報は含まれません。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。送信に失敗した場合は `context.error` も含まれます。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に拡充された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントだけです。コンテキストは複製されているため、ハンドラーは実際のセッションエントリを変更できません。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` には `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行したことを監視します。これはキャンセル／コマンドの
ライフサイクルであり、エージェントの最終化ゲートではありません。自然な最終回答を調べて、
エージェントにもう一度処理させる必要があるプラグインは、代わりに型付きプラグインフック
`before_agent_finalize` を使用してください。[プラグインフック](/ja-JP/plugins/hooks)を参照してください。

**Gateway ライフサイクルイベント**: `gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウン開始時に発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予定された再起動の一部であり、有限の `restartExpectedMs` 値が指定された場合にのみ発火します。シャットダウン中の各ライフサイクルフックの待機はベストエフォートかつ時間制限付きであり、ハンドラーが停止してもシャットダウンは継続します。デフォルトの待機時間は、`gateway:shutdown` が 5 秒、`gateway:pre-restart` が 10 秒です。

チャネルがまだ利用可能な間に短い再起動通知を送るには、`gateway:pre-restart` を使用します。

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

`gateway:shutdown`（または `gateway:pre-restart`）イベントから残りのシャットダウン処理までの間に、Gateway はプロセス停止時にまだアクティブだった各セッションに対して、型付きの `session_end` プラグインフックも発火します。イベントの `reason` は、通常の SIGTERM/SIGINT による停止では `shutdown`、予定された再起動の一部として終了がスケジュールされていた場合は `restart` です。このドレイン処理には時間制限があるため、遅い `session_end` ハンドラーがプロセス終了を妨げることはありません。また、置換／リセット／削除／Compaction によってすでに最終化されたセッションは、重複発火を避けるためスキップされます。

## フックの検出

フックは 4 つのソースから検出されます。

1. **同梱フック**: OpenClaw に同梱
2. **プラグインフック**: インストール済みプラグイン内に同梱。同名の同梱フックを上書き可能
3. **管理対象フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。同梱フックとプラグインフックを上書き可能。`hooks.internal.load.extraDirs` の追加ディレクトリも同じ優先順位になります。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと。明示的に有効化するまでデフォルトで無効）

ワークスペースフックは新しいフック名を追加できますが、同名の同梱フック、管理対象フック、またはプラグイン提供フックを上書きすることはできません。

内部フックが設定されるまで、Gateway は起動時の内部フック検出をスキップします。`openclaw hooks enable <name>` で同梱フックまたは管理対象フックを有効にするか、フックパックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインします。名前付きフックを 1 つ有効にすると、Gateway はそのフックのハンドラーだけを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、レガシーハンドラーを使用すると、広範な検出にオプトインします。

### フックパック

フックパックは、`package.json` の `openclaw.hooks` を介してフックをエクスポートする npm パッケージです。次のコマンドでインストールします。

```bash
openclaw plugins install <path-or-spec>
```

Npm 指定はレジストリのみを対象とします（パッケージ名 + オプションの完全一致バージョンまたは dist-tag）。Git/URL/ファイル指定および semver 範囲は拒否されます。以前の `openclaw hooks install` および `openclaw hooks update` コマンドは、`openclaw plugins install` / `openclaw plugins update` の非推奨エイリアスです。

## 同梱フック

| フック                | イベント                                          | 動作                                                             |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存します      |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを挿入します      |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録します   |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションの圧縮開始時と終了時に、チャット上で通知を送信します   |
| boot-md               | `gateway:startup`                                 | Gateway の起動時に `BOOT.md` を実行します                         |

任意の同梱フックを有効にするには、次を実行します。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

直近のユーザー/アシスタントメッセージ（デフォルトは 15 件、`hooks.internal.entries.session-memory.messages` で設定可能）を抽出し、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-HHMM.md` に保存します。メモリの取得はバックグラウンドで実行されるため、トランスクリプトの読み取りやオプションのスラッグ生成によって `/new` および `/reset` の確認応答が遅延することはありません。説明的なファイル名スラッグを生成するには `hooks.internal.entries.session-memory.llmSlug: true` を設定し、必要に応じて `hooks.internal.entries.session-memory.model` に、`sonnet` のような設定済みエイリアス、エージェントのデフォルトプロバイダー上の単独モデル ID、または `provider/model` 参照を設定します。`model` を省略した場合、スラッグ生成ではエージェントのデフォルトモデルを使用し、利用できない場合はタイムスタンプのスラッグにフォールバックします。`workspace.dir` が設定されている必要があります。

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

`patterns` および `files` は `paths` のエイリアスとして使用できます。パスはワークスペースからの相対パスとして解決され、ワークスペース内に収まる必要があります。認識されるブートストラップのベース名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）のみが読み込まれます。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを JSON 行（タイムスタンプ、アクション、セッションキー、送信者 ID、ソース）として `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトの圧縮を開始および完了したときに、現在の会話へ短いステータスメッセージを送信します。これにより、アシスタントがコンテキストを要約しており、圧縮後に処理を続行することをユーザーが確認できるため、チャット画面で長いターンを処理する際の混乱が軽減されます。

<a id="boot-md"></a>

### boot-md の詳細

各設定済みエージェントスコープについて、そのエージェント用に解決されたワークスペースにファイルが存在する場合、Gateway の起動時に `BOOT.md` を実行します。

## Plugin フック

Plugin は、より深い統合のために Plugin SDK を介して型付きフックを登録できます。
これにより、ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが可能です。
`before_tool_call`、`before_agent_reply`、`before_install`、
またはその他のプロセス内ライフサイクルフックが必要な場合は、Plugin フックを使用します。

Plugin が管理する内部フックは別のものです。これらは、このページで説明する
粗粒度のコマンド/ライフサイクルイベントシステムに参加し、`openclaw hooks list` に
`plugin:<id>` として表示されます。順序付きミドルウェアやポリシーゲートではなく、
副作用の実行やフックパックとの互換性のために使用してください。

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

フックごとの環境値は、プロセス環境と併せてフックの `requires.env` 適格性チェックを満たすために使用され、ハンドラーはフック設定エントリからそれらを読み取ることができます。

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

追加のフックディレクトリ：

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
旧形式の `hooks.internal.handlers` 配列設定は後方互換性のため引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
</Note>

## CLI リファレンス

```bash
# すべてのフックを一覧表示（--eligible、--verbose、または --json を追加可能）
openclaw hooks list

# フックの詳細情報を表示
openclaw hooks info <hook-name>

# 適格性の概要を表示
openclaw hooks check

# 有効化/無効化
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーを高速に保ちます。** フックはコマンド処理中に実行されます。負荷の高い処理は `void processInBackground(event)` を使用して実行結果を待たずに処理します。
- **エラーを適切に処理します。** リスクのある操作は try/catch で囲み、他のハンドラーが実行できるように例外をスローしないでください。
- **イベントを早期に絞り込みます。** イベントの種類やアクションが関係ない場合は、直ちに return します。
- **具体的なイベントキーを使用します。** オーバーヘッドを削減するため、`"events": ["command"]` よりも `"events": ["command:new"]` を優先します。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべき内容：HOOK.md、handler.ts

# 検出されたすべてのフックを一覧表示
openclaw hooks list
```

### フックが適格ではない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS の互換性を確認してください。

### フックが実行されない

1. フックが有効になっていることを確認します：`openclaw hooks list`
2. フックを再読み込みするため、Gateway プロセスを再起動します。
3. Gateway のログを確認します：`openclaw logs --follow | grep -i hook`

## 関連項目

- [CLI リファレンス：フック](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — プロセス内の Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
