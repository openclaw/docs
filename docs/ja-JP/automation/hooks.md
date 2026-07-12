---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対するイベント駆動型自動化が必要な場合
    - フックをビルド、インストール、またはデバッグしたい場合
summary: フック：コマンドとライフサイクルイベントのためのイベント駆動型自動化
title: フック
x-i18n:
    generated_at: "2026-07-12T14:17:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks は、エージェントイベントの発生時に Gateway 内で実行される小さなスクリプトです。対象には、`/new`、`/reset`、`/stop` などのコマンド、セッションの Compaction、Gateway のライフサイクル、メッセージフローがあります。Hooks はディレクトリから検出され、`openclaw hooks` で管理されます。Gateway が内部 Hooks を読み込むのは、Hooks を有効にするか、Hook エントリ、Hook パック、レガシーハンドラー、追加の Hook ディレクトリのいずれかを少なくとも 1 つ設定した後だけです。

OpenClaw には 2 種類の Hooks があります。

- **内部 Hooks**（このページ）：エージェントイベントの発生時に Gateway 内で実行されます。
- **Webhooks**：他のシステムから OpenClaw の処理をトリガーできる外部 HTTP エンドポイントです。[Webhooks](/ja-JP/automation/cron-jobs#webhooks)を参照してください。

Hooks はプラグイン内にバンドルすることもできます。`openclaw hooks list` には、単独の Hooks とプラグイン管理の Hooks（`plugin:<id>` と表示）の両方が表示されます。

## 適切なサーフェスを選ぶ

OpenClaw には、見た目は似ていますが異なる問題を解決する拡張サーフェスが複数あります。

| 目的                                                                                                                  | 使用するもの                          | 理由                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/new` でスナップショットを保存する、`/reset` を記録する、`message:sent` 後に外部 API を呼び出す、または大まかな運用自動化を追加する | 内部 Hooks（`HOOK.md`、このページ）   | ファイルベースの Hooks は、運用者が管理する副作用やコマンド／ライフサイクルの自動化を目的としています |
| プロンプトを書き換える、ツールをブロックする、送信メッセージをキャンセルする、または順序付きのミドルウェア／ポリシーを追加する | `api.on(...)` による型付きプラグイン Hooks | 型付き Hooks には、明示的な契約、優先順位、マージ規則、ブロック／キャンセルのセマンティクスがあります |
| テレメトリのみのエクスポートまたは可観測性を追加する                                                                   | 診断イベント                          | 可観測性は独立したイベントバスであり、ポリシー Hook のサーフェスではありません                       |

小さなインストール済み統合のように動作する自動化が必要な場合は、内部 Hooks を使用します。ランタイムのライフサイクル制御が必要な場合は、型付きプラグイン Hooks を使用します。

## クイックスタート

```bash
# 利用可能な Hooks を一覧表示
openclaw hooks list

# Hook を有効化
openclaw hooks enable session-memory

# Hook の状態を確認
openclaw hooks check

# 詳細情報を取得
openclaw hooks info session-memory
```

## イベントタイプ

Hooks は、この表にある特定のキー、または単独のファミリー名
（`command`、`session`、`agent`、`gateway`、`message`）を購読して、
そのファミリー内のすべてのアクションを受信します。OpenClaw コアは
これ以外を発行しないため、ほかの名前はほぼ常に入力ミスであり、Hook は
何も通知せず動作しないままになります（カスタムイベントを発行するプラグインだけが
そのイベントを発火できます）。Hook ローダーは、このような名前
（例：`command:nwe`）に対して警告を記録し、`openclaw hooks info <name>` でも
フラグが付くため、まったく実行されない Hook を診断できます。

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
| `gateway:startup`        | チャネルが起動し、Hooks が読み込まれた後                   |
| `gateway:shutdown`       | Gateway のシャットダウンが開始したとき                     |
| `gateway:pre-restart`    | 予定された Gateway の再起動前                              |
| `message:received`       | 任意のチャネルから受信メッセージが届いたとき               |
| `message:transcribed`    | 音声の文字起こしが完了した後                               |
| `message:preprocessed`   | メディアとリンクの前処理が完了したか、スキップされた後     |
| `message:sent`           | 送信が試行されたとき（結果は `context.success` に格納）     |

## Hooks の作成

### Hook の構造

各 Hook は、2 つのファイルを含むディレクトリです。

```text
my-hook/
├── HOOK.md          # メタデータ + ドキュメント
└── handler.ts       # ハンドラー実装
```

ハンドラーファイルには、`handler.ts`、`handler.js`、`index.ts`、または `index.js` を使用できます。

### HOOK.md の形式

```markdown
---
name: my-hook
description: "この Hook が行う処理の短い説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

詳細なドキュメントをここに記述します。
```

**メタデータフィールド**（`metadata.openclaw`）：

| フィールド | 説明                                                      |
| ---------- | --------------------------------------------------------- |
| `emoji`    | CLI に表示する絵文字                                      |
| `events`   | リッスンするイベントの配列                                |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`）  |
| `os`       | 必須プラットフォーム（例：`["darwin", "linux"]`）         |
| `requires` | 必須の `bins`、`anyBins`、`env`、または `config` パス     |
| `always`   | 適格性チェックを回避するかどうか（ブール値）              |
| `hookKey`  | 設定キーの上書き（デフォルトは Hook 名）                  |
| `homepage` | `openclaw hooks info` に表示されるドキュメント URL         |
| `install`  | インストール方法                                          |

### ハンドラーの実装

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] 新しいコマンドがトリガーされました`);
  // ここにロジックを記述

  // 必要に応じて、返信可能なサーフェスで返信を送信
  event.messages.push("Hook が実行されました！");
};

export default handler;
```

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`、および `context`（イベント固有のデータ）が含まれます。エージェントおよびツール Hooks の型付きプラグイン Hook コンテキストには、読み取り専用で W3C 互換の診断トレースコンテキストである `trace` も含めることができ、プラグインは OTEL 相関のために構造化ログへ渡せます。

`event.messages` に追加された文字列がチャットへ返されるのは、
`command:new` と `command:reset`（元の会話への返信としてルーティング）、
および `session:compact:before` / `session:compact:after`
（Compaction のステータス通知として送信）の場合だけです。
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch`、
`gateway:*` を含む、その他すべてのイベントでは、追加されたメッセージは無視されます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**コマンドイベント**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**メッセージイベント**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有のデータ）。`context.content` は、コマンド形式のメッセージでは空白でないコマンド本文を優先し、その後、生の受信本文、汎用本文の順にフォールバックします。スレッド履歴やリンク要約など、エージェント専用の拡充情報は含まれません。

**メッセージイベント**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`、さらに送信に失敗した場合は `context.error`。

**メッセージイベント**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）：`context.bodyForAgent`（最終的に拡充された本文）、`context.from`、`context.channelId`。

**ブートストラップイベント**（`agent:bootstrap`）：`context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッションパッチイベント**（`session:patch`）：`context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。パッチイベントをトリガーできるのは特権クライアントだけです。コンテキストは複製であるため、ハンドラーは稼働中のセッションエントリを変更できません。

**Compaction イベント**：`session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` にはさらに `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行したことを監視します。これはキャンセル／コマンドの
ライフサイクルであり、エージェントの最終化ゲートではありません。自然な最終回答を検査し、
エージェントにもう一度処理させる必要があるプラグインは、代わりに型付きプラグイン Hook
`before_agent_finalize` を使用してください。[プラグイン Hooks](/ja-JP/plugins/hooks)を参照してください。

**Gateway ライフサイクルイベント**：`gateway:shutdown` には `reason` と `restartExpectedMs` が含まれ、Gateway のシャットダウン開始時に発火します。`gateway:pre-restart` には同じコンテキストが含まれますが、シャットダウンが予定された再起動の一部であり、有限の `restartExpectedMs` 値が指定されている場合にのみ発火します。シャットダウン中、各ライフサイクル Hook の待機はベストエフォートかつ時間制限付きで行われるため、ハンドラーが停止してもシャットダウンは続行されます。デフォルトの待機時間枠は、`gateway:shutdown` が 5 秒、`gateway:pre-restart` が 10 秒です。

チャネルがまだ利用可能な間に短い再起動通知を行うには、`gateway:pre-restart` を使用します。

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
    `Gateway は約${restartInSeconds}秒後に再起動します（${event.context.reason}）。今すぐチェックポイントを作成してください。`,
  ]);
}
```

`gateway:shutdown`（または `gateway:pre-restart`）イベントから残りのシャットダウンシーケンスまでの間に、Gateway は、プロセス停止時にまだアクティブだった各セッションに対して、型付きの `session_end` プラグイン Hook も発火します。単純な SIGTERM/SIGINT による停止の場合、イベントの `reason` は `shutdown` となり、予定された再起動の一部として終了がスケジュールされた場合は `restart` となります。このドレイン処理には時間制限があるため、低速な `session_end` ハンドラーがプロセス終了を妨げることはありません。また、置換／リセット／削除／Compaction によってすでに最終化されたセッションは、二重発火を避けるためスキップされます。

## Hook の検出

Hooks は 4 つのソースから検出されます。

1. **バンドル済み Hooks**：OpenClaw に同梱
2. **プラグイン Hooks**：インストール済みプラグイン内にバンドル。同名のバンドル済み Hooks を上書き可能
3. **管理対象 Hooks**：`~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。バンドル済み Hooks とプラグイン Hooks を上書き可能。`hooks.internal.load.extraDirs` の追加ディレクトリも同じ優先順位です。
4. **ワークスペース Hooks**：`<workspace>/hooks/`（エージェントごと。明示的に有効化するまでデフォルトでは無効）

ワークスペース Hooks は新しい Hook 名を追加できますが、同名のバンドル済み、管理対象、またはプラグイン提供の Hooks を上書きすることはできません。

内部 Hooks が設定されるまで、Gateway は起動時の内部 Hook 検出をスキップします。`openclaw hooks enable <name>` でバンドル済みまたは管理対象の Hook を有効化するか、Hook パックをインストールするか、`hooks.internal.enabled=true` を設定してオプトインします。名前を指定して 1 つの Hook を有効化した場合、Gateway はその Hook のハンドラーだけを読み込みます。`hooks.internal.enabled=true`、追加の Hook ディレクトリ、およびレガシーハンドラーは、広範な検出にオプトインします。

### Hook パック

Hook パックは、`package.json` の `openclaw.hooks` を介して Hooks をエクスポートする npm パッケージです。次のコマンドでインストールします。

```bash
openclaw plugins install <path-or-spec>
```

Npm 仕様はレジストリのみです（パッケージ名 + オプションの完全一致バージョンまたは dist-tag）。Git/URL/ファイル仕様および semver 範囲は拒否されます。従来の `openclaw hooks install` および `openclaw hooks update` コマンドは、`openclaw plugins install` / `openclaw plugins update` の非推奨エイリアスです。

## 同梱フック

| フック                | イベント                                          | 動作                                                             |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | セッションコンテキストを `<workspace>/memory/` に保存する        |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob パターンから追加のブートストラップファイルを注入する        |
| command-logger        | `command`                                         | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録する     |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションの Compaction 開始時と終了時にチャット通知を表示する   |
| boot-md               | `gateway:startup`                                 | Gateway の起動時に `BOOT.md` を実行する                           |

任意の同梱フックを有効にします。

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

最後のユーザー/アシスタントメッセージ（デフォルトは 15 件、`hooks.internal.entries.session-memory.messages` で設定可能）を抽出し、ホストのローカル日付を使用して `<workspace>/memory/YYYY-MM-DD-HHMM.md` に保存します。メモリのキャプチャはバックグラウンドで実行されるため、トランスクリプトの読み取りやオプションのスラッグ生成によって `/new` と `/reset` の確認応答が遅延することはありません。説明的なファイル名スラッグを生成するには `hooks.internal.entries.session-memory.llmSlug: true` を設定し、必要に応じて `hooks.internal.entries.session-memory.model` に、`sonnet` のような設定済みエイリアス、エージェントのデフォルトプロバイダー上の修飾なしモデル ID、または `provider/model` 参照を設定します。`model` を省略した場合、スラッグ生成にはエージェントのデフォルトモデルが使用され、利用できない場合はタイムスタンプスラッグにフォールバックします。`workspace.dir` の設定が必要です。

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

`patterns` と `files` は `paths` のエイリアスとして使用できます。パスはワークスペースを基準に解決され、その内部に収まっている必要があります。認識されるブートストラップのベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを JSON 行（タイムスタンプ、アクション、セッションキー、送信者 ID、ソース）として `~/.openclaw/logs/commands.log` に記録します。

<a id="compaction-notifier"></a>

### compaction-notifier の詳細

OpenClaw がセッショントランスクリプトの Compaction を開始および終了したとき、現在の会話に短いステータスメッセージを送信します。これにより、アシスタントがコンテキストを要約しており、Compaction 後に処理を続行することをユーザーが確認できるため、チャット画面で長いターンが分かりにくくなるのを防げます。

<a id="boot-md"></a>

### boot-md の詳細

設定された各エージェントスコープについて、そのエージェントで解決されたワークスペースにファイルが存在する場合、Gateway の起動時に `BOOT.md` を実行します。

## Plugin フック

Plugin は、より深い統合のために Plugin SDK を介して型付きフックを登録できます。
ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが可能です。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のプロセス内ライフサイクルフックが必要な場合は、Plugin フックを使用します。

Plugin が管理する内部フックは異なります。このページで説明する大まかなコマンド/ライフサイクルイベントシステムに参加し、`openclaw hooks list` には `plugin:<id>` として表示されます。順序付きミドルウェアやポリシーゲートではなく、副作用とフックパックとの互換性のために使用してください。

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

フックごとの環境値は、プロセス環境と併せてフックの `requires.env` 適格性チェックを満たし、ハンドラーはフックの設定エントリからそれらを読み取ることができます。

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
従来の `hooks.internal.handlers` 配列設定形式は後方互換性のため引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
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

- **ハンドラーを高速に保ちます。** フックはコマンド処理中に実行されます。負荷の高い処理は `void processInBackground(event)` で非同期実行します。
- **エラーを適切に処理します。** リスクのある操作を try/catch で囲み、他のハンドラーが実行できるよう例外をスローしないでください。
- **イベントを早期にフィルタリングします。** イベントの種類/アクションが関係ない場合は、直ちに return してください。
- **具体的なイベントキーを使用します。** オーバーヘッドを削減するため、`"events": ["command"]` よりも `"events": ["command:new"]` を優先してください。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構造を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示される内容：HOOK.md、handler.ts

# 検出されたすべてのフックを一覧表示
openclaw hooks list
```

### フックが適格でない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS の互換性を確認してください。

### フックが実行されない

1. フックが有効であることを確認します：`openclaw hooks list`
2. フックを再読み込みするため、Gateway プロセスを再起動します。
3. Gateway ログを確認します：`openclaw logs --follow | grep -i hook`

## 関連項目

- [CLI リファレンス：フック](/ja-JP/cli/hooks)
- [Webhook](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin フック](/ja-JP/plugins/hooks) — プロセス内 Plugin ライフサイクルフック
- [設定](/ja-JP/gateway/configuration-reference#hooks)
