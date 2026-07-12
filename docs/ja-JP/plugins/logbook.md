---
read_when:
    - Control UI で1日の流れを Dayflow 形式のタイムラインとして表示したい場合
    - バンドル版の Logbook Plugin を有効化または設定しています
    - 画面上のアクティビティに基づくスタンドアップミーティングの要約や一日の振り返りが必要な場合
summary: 定期的な画面スナップショットから作成される、オプションの自動作業ジャーナル
title: ログブック Plugin
x-i18n:
    generated_at: "2026-07-12T14:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook Plugin は、画面上のアクティビティを自動的な作業日誌に変換します。ペアリングされた Node から定期的に画面スナップショットを取得し、タイムスタンプ付きの観察結果として要約して、[Control UI](/ja-JP/web/control-ui) にタイムラインカードを作成します。また、日次スタンドアップノートを生成したり、追跡した日の内容に関する質問に回答したりできます。

OpenClaw が所有する状態は Gateway 上の `<state-dir>/logbook/` に保持されますが、モデル処理が必ずしもローカルで行われるとは限りません。サンプリングされたスクリーンショットは設定済みのビジョンルートに送られ、観察結果とタイムラインテキストはデフォルトのエージェントモデルに送られます。画面内容とそこから生成されたアクティビティテキストをマシン上に留める必要がある場合は、両方のステージでローカルモデルルートを使用してください。

Logbook はバンドルされていますが、デフォルトでは無効です。`captureEnabled` のデフォルトが `true` であるため、Plugin を有効にすると、Gateway で画面キャプチャが有効になります。

## 始める前に

次のものが必要です。

- `screen.snapshot` または `logbook.snapshot` を公開する接続済み Node。macOS アプリの Node には画面収録の権限が必要です。ヘッドレス macOS Node ホスト（`openclaw node host run`）には、システムの `screencapture` ツールを使用する、Plugin 提供の `logbook.snapshot` コマンドが追加されます。
- バンドルされた Codex Plugin が有効化され、認証済みであること。現在、Logbook が必要とする構造化画像抽出コントラクトは Codex によって提供されます。`openclaw models auth login --provider openai` でサインインしてください。その他の認証方法については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。
- 動作するデフォルトのエージェントモデル。Logbook は、ビジョンパスの後にカード、スタンドアップノート、日次 Q&A を生成するためにこのモデルを使用します。

## クイックスタート

Codex と Logbook の Plugin を有効にします。

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

確定的に起動できるよう、ビジョンモデルを明示的に設定します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

`plugins.allow` を使用している場合は、`codex` と `logbook` の両方を含めてください。Plugin の設定を変更した後に Gateway を再起動し、登録内容を確認してダッシュボードを開きます。

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Node の説明には `screen.snapshot` または `logbook.snapshot` が含まれている必要があります。ヘッドレス Node が `logbook.snapshot` を公開するのは、Plugin が有効になった後だけです。コマンドが見つからない場合は、[Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)を参照してください。

Logbook タブは、Plugin が有効で、Control UI セッションに `operator.write` がある場合にのみ表示されます。ステータス行には、エラーなしで **キャプチャ中** と表示されるはずです。分析ウィンドウが閉じるとタイムラインカードが表示されます。また、アクティビティがキャプチャされた後に **今すぐ分析** を選択することもできます。

## 仕組み

1. **キャプチャ**：`captureIntervalSeconds` ごと（デフォルトは 30s）に、Logbook は選択された Node のキャプチャコマンドを呼び出し、縮小された JPEG フレームを保存します。連続する同一フレームはアイドルとしてマークされ、分析から除外されます。
2. **観察**：分析ウィンドウ（デフォルトは 15 分）が経過すると、Plugin は最大 16 枚のアクティブなフレームをサンプリングしてビジョンモデルに送信します。ビジョンモデルは、タイムスタンプ付きのアクティビティ観察結果（「VS Code：store.ts を編集し、型エラーを修正」）を返します。2 分を超えるキャプチャの途切れやローカル時刻の午前 0 時によっても、現在のウィンドウが閉じます。
3. **生成**：観察結果と既存カードの直近 45 分間の内容が、タイトル、要約、カテゴリ、メインアプリ、短時間の注意散漫を含むタイムラインカード（各 10～60 分）に再構成されます。
4. **削除**：`retentionDays`（デフォルトは 14）より古いフレームは削除されます。カード、観察結果、キャッシュされたスタンドアップは保持されます。

日の境界とタイムラインの時刻には、ブラウザのタイムゾーンではなく Gateway のローカルタイムゾーンが使用されます。フレームと SQLite タイムラインデータベースは `<state-dir>/logbook/` に保存されます。

## モデルとデータフロー

Logbook は 2 つの別々のモデルルートを使用します。

| ステージ         | 送信されるデータ                                          | モデルルート                                                      |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 観察             | 最大 16 枚のサンプリングされた JPEG フレームと取得時刻   | `visionModel`、または互換性のある借用済み `tools.media` Codex エントリ |
| カードの生成     | タイムスタンプ付きの観察結果と最近のタイムラインカード    | Plugin LLM ランタイムを通じたデフォルトのエージェントモデル       |
| スタンドアップの生成 | 選択した日と前日のカード                              | Plugin LLM ランタイムを通じたデフォルトのエージェントモデル       |
| その日について質問 | 質問、選択した日のカード、最近の観察結果                 | Plugin LLM ランタイムを通じたデフォルトのエージェントモデル       |

SQLite データベース全体がいずれかのモデルに送信されることはありません。未加工のスクリーンショットは観察ステージにのみ送信されます。カード生成、スタンドアップ、Q&A には、そこから生成されたテキストが渡されます。

## 設定

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Logbook のすべての設定キーは省略可能です。数値は整数に丸められ、サポート範囲内に制限されます。

| キー                      | デフォルト | 範囲または値            | 動作                                                                                         |
| ------------------------- | ---------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`     | 真偽値                  | 新しいスナップショットの永続的なマスタースイッチ。`false` の場合もタイムラインは利用可能     |
| `captureIntervalSeconds`  | `30`       | `5`-`600`               | キャプチャ試行の間隔                                                                         |
| `analysisIntervalMinutes` | `15`       | `3`-`120`               | 観察ウィンドウの目標時間。途切れや午前 0 時によって早く閉じる場合がある                      |
| `nodeId`                  | 未設定     | Node ID または表示名    | キャプチャを 1 つの接続済み Node に固定。大文字と小文字を区別せず照合                        |
| `screenIndex`             | `0`        | `0`-`16`                | 0 始まりのディスプレイインデックス                                                           |
| `maxWidth`                | `1440`     | `480`-`3840`            | 要求するキャプチャサイズの上限。ヘッドレス macOS では最大の辺に適用                          |
| `visionModel`             | 未設定     | `provider/model`        | 明示的な構造化ルート。不正な形式の参照では分析が一時停止し、未対応プロバイダーではバッチが失敗 |
| `retentionDays`           | `14`       | `1`-`365`               | 古いフレームを削除。カード、観察結果、スタンドアップは保持                                   |

`nodeId` がない場合、Logbook は `screen.snapshot` を公開する接続済みアプリ Node を優先し、その後 `logbook.snapshot` を公開するヘッドレス Node にフォールバックします。固定されていない構成では、障害が発生した Node は他の対象 Node より後に回されます。ダッシュボードの一時停止トグルはセッション内でのみ有効で、Gateway の再起動時にリセットされます。永続的に停止するには `captureEnabled: false` を使用してください。

### ビジョンモデルの選択

Logbook は次の順序で観察モデルを解決します。

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` 内の最初の画像対応 Codex エントリ
3. `tools.media.models` 内の最初の画像対応 Codex エントリ

現在、他のメディアプロバイダーは Logbook が必要とする構造化抽出コントラクトを公開していないため、スキップされます。`tools.media.image.enabled: false` を設定すると、借用されるメディアのデフォルトが無効になりますが、Logbook に明示的に設定した `visionModel` は引き続き適用されます。

## ダッシュボードタブ

- **タイムライン**：カテゴリの色、メインアプリ、注意散漫チップ、スナップショットのキーフレームを含む、アクティビティごとの展開可能なカード。
- **一日の概要**：集中度、カテゴリ別内訳、上位のアプリ。
- **日次スタンドアップ**：昨日と今日の内容を、すぐに貼り付けられる更新情報に変換します。
- **その日について質問**：追跡されたタイムラインに基づき、自然言語の質問（「Gateway の PR をレビューしたのはいつ？」）に回答します。
- **今すぐ分析**：分析間隔を待たずに、現在のキャプチャウィンドウをすぐに閉じます。

## Gateway メソッド

Logbook は次の Gateway RPC メソッドを登録します。

| メソッド              | パラメーター             | スコープ         | 結果                                                                     |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | なし                     | `operator.read`  | キャプチャ、分析、モデル、Node、Gateway の日付、Gateway のタイムゾーンの状態 |
| `logbook.days`        | なし                     | `operator.read`  | タイムラインカード数とカードの時間範囲を含む日付                         |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | 生成されたカードと日の統計。デフォルトは Gateway の現在の日付           |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | 指定されたエポックミリ秒範囲内のフレームメタデータ                       |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | 1 枚の未加工 JPEG フレームを base64 形式で返す                            |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | 指定日のキャッシュ済みまたは再生成されたスタンドアップテキスト           |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | 指定日のタイムラインに基づく回答                                         |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | セッション内のみの一時停止状態と更新後のステータス                       |
| `logbook.analyze.now` | なし                     | `operator.write` | 保留中の分析を開始するか、開始できなかった理由を返す                     |

読み取りメソッドは、動作状態または生成されたテキストを返します。未加工のスクリーンショットのピクセル、モデル利用料金が発生するアクション、ランタイムの変更には `operator.write` が必要です。Control UI タブではそれらのアクションと未加工フレームのプレビューを公開するため、このタブにも `operator.write` が必要です。読み取り専用クライアントでも、生成済みテキストのメソッドを直接呼び出すことはできます。

## プライバシーに関する注意事項

- スナップショットには、シークレットを含め、画面上のあらゆるものが含まれる可能性があります。フレームがマシン外に送信されるのは、設定済みの観察モデルへのサンプリング入力としてのみです。
- 観察結果、最近のカード、質問は、カード生成、スタンドアップ生成、Q&A の際に、デフォルトのエージェントモデルを通じてマシン外に送信される可能性があります。両方のモデルルートにプロバイダーのデータ取り扱いポリシーを適用してください。
- 完全にローカルなパイプラインが必要な場合は、構造化観察モデルとデフォルトのエージェントモデルの両方でローカルルートを使用してください。
- フレーム、タイムラインデータベース、一時キャプチャは、所有者のみがアクセスできるファイル権限で書き込まれます。
- `gateway.nodes.denyCommands` に `screen.snapshot` を追加すると、画面キャプチャのキルスイッチとして機能します。これにより、アプリ Node によるキャプチャと Logbook 自身の `logbook.snapshot` コマンドの両方がブロックされます。
- `tools.media.image.enabled: false` を設定すると、Logbook が分析用にメディア画像モデルを借用することも停止します。その場合、Plugin 設定で明示的に指定された `visionModel` のみが使用されます。

## トラブルシューティング

### Logbook タブが表示されない

次の 3 つの条件をすべて確認してください。

1. `openclaw plugins list --enabled` に `logbook` が含まれている。
2. Plugin または許可リストを変更した後に Gateway が再起動されている。
3. Control UI 接続に `operator.write` がある。読み取り専用セッションには、インタラクティブなタブ記述子は送信されません。

`plugins.allow` が設定されている場合、推奨構成では `logbook` と `codex` の両方を含める必要があります。

### キャプチャでエラーが報告される

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Node が `screen.snapshot` または `logbook.snapshot` を公開していることを確認します。
- キャプチャを行う Mac で画面収録の権限を付与します。
- `nodeId` が設定されている場合は、Node ID または表示名と一致していることを確認します。
- `gateway.nodes.denyCommands` に `screen.snapshot` が含まれていないことを確認します。

3 回連続で失敗すると、Logbook はキャプチャ 10 ティック分バックオフしてから再試行します。固定されていないセットアップでは、別の適格な Node に切り替わることがあります。

### キャプチャは成功するがカードが表示されない

- **モデルがありません**ステータスは、互換性のある構造化ビジョンルートが見つからなかったことを示します。Codex Plugin を有効にして認証するか、有効な `visionModel` を明示的に設定します。モデルがない間、キャプチャされたフレームは保留状態のままとなり、設定を修正した後に分析できます。
- `analysisIntervalMinutes` が経過するまで待つか、アクティビティがキャプチャされた後に **今すぐ分析** を選択します。
- 連続する同一フレームはアイドル状態の証拠であり、分析バッチには入りません。テストする前に、表示されている画面を変更してください。
- 最新のバッチにエラーが表示されている場合は、モデルまたは認証の問題を修正して **今すぐ分析** を選択します。モデルの利用コストが繰り返し発生するのを避けるため、失敗したバッチは、この明示的な操作を行った場合にのみ再試行されます。

## 関連項目

- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [Node](/ja-JP/nodes)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [コントロール UI](/ja-JP/web/control-ui)
