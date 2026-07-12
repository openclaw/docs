---
read_when:
    - Control UI で1日の流れを Dayflow 風のタイムラインとして表示したい場合
    - バンドルされている Logbook Plugin を有効化または設定しています
    - 画面上の操作に基づくスタンドアップミーティングの要約や、その日の振り返りが必要な場合
summary: 定期的な画面スナップショットから作成される、オプションの自動作業ジャーナル
title: ログブックPlugin
x-i18n:
    generated_at: "2026-07-11T22:27:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook plugin は、画面上のアクティビティを自動作業日誌に変換します。ペアリング済み Node から定期的に画面スナップショットを取得し、タイムスタンプ付きの観察結果に要約して、[Control UI](/ja-JP/web/control-ui) にタイムラインカードを作成します。また、日次スタンドアップノートを生成し、追跡した日についての質問に回答することもできます。

OpenClaw が所有する状態は Gateway 上の `<state-dir>/logbook/` に保持されますが、モデルによる処理が必ずしもローカルで行われるとは限りません。サンプリングされたスクリーンショットは設定済みのビジョンルートに送信され、観察結果とタイムラインテキストはデフォルトのエージェントモデルに送信されます。画面内容とそこから生成されたアクティビティテキストをマシン上に保持する必要がある場合は、両方の段階でローカルモデルルートを使用してください。

Logbook は同梱されていますが、デフォルトでは無効です。`captureEnabled` のデフォルトが `true` であるため、plugin を有効にすると Gateway で画面キャプチャが有効になります。

## 始める前に

次のものが必要です。

- `screen.snapshot` または `logbook.snapshot` を公開する接続済み Node。macOS アプリの Node には画面収録権限が必要です。ヘッドレス macOS Node ホスト（`openclaw node host run`）では、システムの `screencapture` ツールを利用する、plugin 提供の `logbook.snapshot` コマンドを使用できます。
- 同梱の Codex plugin が有効化および認証されていること。現在、Codex は Logbook が必要とする構造化画像抽出コントラクトを提供します。`openclaw models auth login --provider openai` でサインインしてください。その他の認証方法については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。
- 正常に動作するデフォルトのエージェントモデル。Logbook はビジョン処理後に、カード、スタンドアップノート、日ごとの Q&A を生成するためにこれを使用します。

## クイックスタート

Codex と Logbook の plugin を有効にします。

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

起動時の動作を確定させるため、ビジョンモデルを明示的に設定します。

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

`plugins.allow` を使用する場合は、`codex` と `logbook` の両方を含めてください。plugin の設定を変更した後に Gateway を再起動し、登録内容を確認してダッシュボードを開きます。

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Node の説明には `screen.snapshot` または `logbook.snapshot` が含まれている必要があります。ヘッドレス Node が `logbook.snapshot` を通知するのは、plugin が有効になった後だけです。コマンドがない場合は、[Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)を参照してください。

Logbook タブは、plugin が有効で、Control UI セッションに `operator.write` がある場合にのみ表示されます。ステータス行にはエラーなしで **キャプチャ中** と表示される必要があります。分析ウィンドウが閉じるとタイムラインカードが表示されます。また、アクティビティがキャプチャされた後で **今すぐ分析** を選択することもできます。

## 仕組み

1. **キャプチャ**：`captureIntervalSeconds`（デフォルトは30秒）ごとに、Logbook は選択された Node のキャプチャコマンドを呼び出し、縮小された JPEG フレームを保存します。連続する同一フレームはアイドルとしてマークされ、分析から除外されます。
2. **観察**：分析ウィンドウ（デフォルトは15分）が経過すると、plugin は最大16枚のアクティブなフレームをサンプリングしてビジョンモデルに送信します。モデルはタイムスタンプ付きのアクティビティ観察結果（「VS Code：store.ts を編集し、型エラーを修正」）を返します。2分を超えるキャプチャの空白期間が発生した場合や、ローカル時刻で午前0時になった場合も、現在のウィンドウが閉じます。
3. **統合**：観察結果と既存カードの直近45分間の内容を、タイトル、概要、カテゴリ、メインアプリ、短時間の気晴らしを含むタイムラインカード（各10～60分）に再構成します。
4. **削除**：`retentionDays`（デフォルトは14）より古いフレームを削除します。カード、観察結果、キャッシュ済みスタンドアップは保持されます。

日の境界とタイムラインの時刻には、ブラウザのタイムゾーンではなく Gateway のローカルタイムゾーンが使用されます。フレームと SQLite タイムラインデータベースは `<state-dir>/logbook/` 配下に保存されます。

## モデルとデータの流れ

Logbook は2つの異なるモデルルートを使用します。

| 段階               | 送信されるデータ                                           | モデルルート                                                            |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| 観察               | 最大16枚のサンプリング済み JPEG フレームとそのキャプチャ時刻 | `visionModel`、または互換性のある借用済み `tools.media` Codex エントリ |
| カードの統合       | タイムスタンプ付きの観察結果と最近のタイムラインカード       | plugin の LLM ランタイム経由のデフォルトエージェントモデル             |
| スタンドアップ生成 | 選択した日と前日のカード                                   | plugin の LLM ランタイム経由のデフォルトエージェントモデル             |
| 1日について質問    | 質問、選択した日のカード、最近の観察結果                     | plugin の LLM ランタイム経由のデフォルトエージェントモデル             |

完全な SQLite データベースがいずれかのモデルに送信されることはありません。生のスクリーンショットは観察段階にのみ送信されます。カードの統合、スタンドアップ、Q&A には派生テキストが渡されます。

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

| キー                      | デフォルト | 範囲または値              | 動作                                                                                                  |
| ------------------------- | ---------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`     | 真偽値                    | 新しいスナップショットの永続的なマスタースイッチ。`false` の場合もタイムラインは引き続き利用可能      |
| `captureIntervalSeconds`  | `30`       | `5`～`600`                | キャプチャ試行間の待機時間                                                                            |
| `analysisIntervalMinutes` | `15`       | `3`～`120`                | 観察ウィンドウの目標時間。空白期間または午前0時によって早く閉じることがある                            |
| `nodeId`                  | 未設定     | Node ID または表示名      | キャプチャ対象を1つの接続済み Node に固定。照合では大文字と小文字を区別しない                          |
| `screenIndex`             | `0`        | `0`～`16`                 | 0から始まるディスプレイインデックス                                                                   |
| `maxWidth`                | `1440`     | `480`～`3840`             | 要求するキャプチャサイズの上限。ヘッドレス macOS では最大寸法に適用される                              |
| `visionModel`             | 未設定     | `provider/model`          | 明示的な構造化ルート。不正な参照では分析を一時停止し、未対応のプロバイダーではバッチが失敗する         |
| `retentionDays`           | `14`       | `1`～`365`                | 古いフレームを削除。カード、観察結果、スタンドアップは保持される                                      |

`nodeId` がない場合、Logbook はまず `screen.snapshot` を公開する接続済みアプリ Node を優先し、次に `logbook.snapshot` を公開するヘッドレス Node を使用します。固定されていない構成では、失敗した Node は他の適格な Node より後に回されます。ダッシュボードの一時停止切り替えはセッション内でのみ有効であり、Gateway の再起動時にリセットされます。永続的に停止するには `captureEnabled: false` を使用してください。

### ビジョンモデルの選択

Logbook は次の順序で観察モデルを解決します。

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` 配下で最初の画像対応 Codex エントリ
3. `tools.media.models` 配下で最初の画像対応 Codex エントリ

他のメディアプロバイダーは、現在 Logbook が必要とする構造化抽出コントラクトを公開していないため、スキップされます。`tools.media.image.enabled: false` を設定すると、借用されるメディアのデフォルトが無効になりますが、明示的な Logbook の `visionModel` は引き続き適用されます。

## ダッシュボードタブ

- **タイムライン**：アクティビティごとの展開可能なカード。カテゴリ色、メインアプリ、気晴らしチップ、スナップショットのキーフレームを表示します。
- **1日の概要**：集中率、カテゴリ別内訳、使用上位アプリ。
- **日次スタンドアップ**：昨日と今日の内容を、すぐに貼り付けられる更新文に変換します。
- **1日について質問**：追跡されたタイムラインに基づいて自然言語の質問に回答します（「Gateway の PR をレビューしたのはいつ？」）。
- **今すぐ分析**：分析間隔を待たずに、現在のキャプチャウィンドウを直ちに閉じます。

## Gateway メソッド

Logbook は次の Gateway RPC メソッドを登録します。

| メソッド              | パラメーター             | スコープ         | 結果                                                                             |
| --------------------- | ------------------------ | ---------------- | -------------------------------------------------------------------------------- |
| `logbook.status`      | なし                     | `operator.read`  | キャプチャ、分析、モデル、Node、Gateway の日付、Gateway のタイムゾーンの状態     |
| `logbook.days`        | なし                     | `operator.read`  | タイムラインカード数とカードの時間範囲を含む日                                   |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | 派生カードと日ごとの統計。デフォルトは Gateway の現在の日付                      |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | 要求されたエポックミリ秒範囲内のフレームメタデータ                               |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | base64 形式の生の JPEG フレーム1枚                                                |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | 1日分のキャッシュ済みまたは再生成されたスタンドアップテキスト                    |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | 1日分のタイムラインに基づく回答                                                   |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | セッション内限定の一時停止状態と更新後のステータス                               |
| `logbook.analyze.now` | なし                     | `operator.write` | 保留中の分析を開始するか、開始できなかった理由を返す                              |

読み取りメソッドは、動作状態または派生テキストを返します。生のスクリーンショットのピクセル、モデルの利用料金が発生する操作、ランタイムの変更には `operator.write` が必要です。Control UI タブも、これらの操作と生フレームのプレビューを公開するため、`operator.write` が必要です。読み取り専用クライアントでも、派生テキストのメソッドを直接呼び出すことはできます。

## プライバシーに関する注意事項

- スナップショットには、シークレットを含め、画面上のあらゆるものが含まれる可能性があります。フレームがマシン外に送信されるのは、設定済みの観察モデルへのサンプリング済み入力としてのみです。
- 観察結果、最近のカード、質問は、カード統合、スタンドアップ生成、Q&A の際に、デフォルトのエージェントモデルを通じてマシン外に送信される可能性があります。両方のモデルルートにプロバイダーのデータ処理ポリシーを適用してください。
- 完全にローカルなパイプラインが必要な場合は、構造化観察モデルとデフォルトのエージェントモデルの両方でローカルルートを使用してください。
- フレーム、タイムラインデータベース、一時キャプチャは、所有者のみがアクセスできるファイル権限で書き込まれます。
- `gateway.nodes.denyCommands` に `screen.snapshot` を追加すると、画面キャプチャの緊急停止スイッチとして機能します。アプリ Node のキャプチャと Logbook 自身の `logbook.snapshot` コマンドの両方をブロックします。
- `tools.media.image.enabled: false` を設定すると、Logbook が分析用にメディア画像モデルを借用することも停止します。その場合は、plugin 設定内の明示的な `visionModel` のみが使用されます。

## トラブルシューティング

### Logbook タブが表示されない

次の3つの条件をすべて確認してください。

1. `openclaw plugins list --enabled` に `logbook` が含まれている。
2. plugin または許可リストの変更後に Gateway を再起動した。
3. Control UI 接続に `operator.write` がある。読み取り専用セッションには、操作可能なタブ記述子は送信されません。

`plugins.allow` が設定されている場合、推奨構成では `logbook` と `codex` の両方を含める必要があります。

### キャプチャでエラーが報告される

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Node が `screen.snapshot` または `logbook.snapshot` を公開していることを確認します。
- キャプチャを行う Mac で画面収録の権限を付与します。
- `nodeId` が設定されている場合は、Node ID または表示名と一致することを確認します。
- `gateway.nodes.denyCommands` に `screen.snapshot` が含まれていないことを確認します。

3 回連続で失敗すると、Logbook はキャプチャの 10 ティック分バックオフしてから再試行します。固定されていない構成では、別の適格な Node に切り替わることがあります。

### キャプチャは成功するがカードが表示されない

- **モデルがありません**というステータスは、互換性のある構造化ビジョンルートが見つからなかったことを意味します。Codex Plugin を有効化して認証するか、有効な `visionModel` を明示的に設定します。モデルがない間、キャプチャされたフレームは保留状態となり、構成を修正した後に分析できます。
- `analysisIntervalMinutes` の時間が経過するまで待つか、アクティビティがキャプチャされた後に **今すぐ分析** を選択します。
- 連続する同一フレームはアイドル状態の証拠であり、分析バッチには入りません。テストする前に、表示されている画面を変更してください。
- 最新のバッチにエラーが表示される場合は、モデルまたは認証の問題を修正して **今すぐ分析** を選択します。モデルの利用料金が繰り返し発生するのを避けるため、失敗したバッチはこの明示的な操作を行った場合にのみ再試行されます。

## 関連項目

- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [Node](/ja-JP/nodes)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [コントロール UI](/ja-JP/web/control-ui)
