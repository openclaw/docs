---
read_when:
    - Control UI で 1 日を Dayflow 風のタイムラインとして表示したい
    - バンドルされている Logbook plugin を有効化または設定しています
    - 画面上のアクティビティに基づいたスタンドアップ要約や一日の振り返りが必要な場合
summary: 任意の定期的な画面スナップショットから構築される自動作業ジャーナル
title: ログブック Plugin
x-i18n:
    generated_at: "2026-07-05T20:18:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d15a6e0835d6916c1ad5d203d6d85d6a7946b2bcb9c2985ce53a803d471c389
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook plugin は、画面上のアクティビティを自動の作業ジャーナルに変換します。ペアリングされた node から定期的に画面スナップショットを取得し、それらをタイムスタンプ付きの観察内容に要約し、[Control UI](/ja-JP/web/control-ui) にタイムラインカードを構築します。日次スタンドアップノートを生成したり、追跡対象の日についての質問に回答したりすることもできます。

OpenClaw 所有の state は Gateway 上の `<state-dir>/logbook/` に保持されますが、モデル処理は必ずしもローカルとは限りません。サンプリングされたスクリーンショットは設定済みの vision route に送られ、観察内容とタイムラインテキストはデフォルトの agent model に送られます。画面内容とそこから派生したアクティビティテキストをマシン上に留める必要がある場合は、両方の段階でローカルモデル route を使用してください。

Logbook はバンドルされていますが、デフォルトでは無効です。この plugin を有効にすると、`captureEnabled` のデフォルトが `true` であるため、Gateway は画面キャプチャを行うようになります。

## 始める前に

必要なもの:

- `screen.snapshot` または `logbook.snapshot` を公開する接続済み node。macOS app node には画面収録権限が必要です。ヘッドレス macOS node host (`openclaw node host run`) は、システムの `screencapture` ツールを背後で使用する、plugin 提供の `logbook.snapshot` コマンドを取得します。
- バンドルされた Codex plugin が有効で認証済みであること。Codex は現在、Logbook が必要とする構造化された画像抽出 contract を提供します。`openclaw models auth login --provider openai` でサインインしてください。他の認証パスについては [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。
- 動作するデフォルトの agent model。Logbook は vision pass の後に、カード、スタンドアップノート、日ごとの Q&A を合成するためにそれを使用します。

## クイックスタート

Codex と Logbook plugin を有効にします:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

決定的な起動のために、明示的な vision model を設定します:

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
          visionModel: "codex/gpt-5.5",
        },
      },
    },
  },
}
```

`plugins.allow` を使用する場合は、`codex` と `logbook` の両方を含めてください。plugin 設定を変更した後に Gateway を再起動し、登録内容を確認して dashboard を開きます:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

node の説明には `screen.snapshot` または `logbook.snapshot` が含まれている必要があります。ヘッドレス node は、plugin がアクティブになった後にのみ `logbook.snapshot` を広告します。コマンドが見つからない場合は、[Node troubleshooting](/ja-JP/nodes/troubleshooting) を参照してください。

Logbook タブは、有効な plugin と `operator.write` Control UI セッションがある場合にのみ表示されます。ステータス行にはエラーなしで **Capturing** と表示されるはずです。分析ウィンドウが閉じるとタイムラインカードが表示されます。または、アクティビティがキャプチャされた後に **Analyze now** を選択できます。

## 仕組み

1. **Capture**: `captureIntervalSeconds` ごとに (デフォルト 30 秒)、Logbook は選択された node のキャプチャコマンドを呼び出し、スケーリング済みの JPEG フレームを保存します。連続して同一のフレームは idle としてマークされ、分析から除外されます。
2. **Observe**: 分析ウィンドウ (デフォルト 15 分) が経過すると、plugin は最大 16 個のアクティブフレームをサンプリングして vision model に送信し、vision model はタイムスタンプ付きのアクティビティ観察内容 (「VS Code: editing store.ts, fixing a type error」) を返します。2 分を超えるキャプチャ gap またはローカルの深夜も、現在のウィンドウを閉じます。
3. **Synthesize**: 観察内容と既存カードの直近 45 分分が、タイトル、要約、カテゴリ、メイン app、短い distractions を含むタイムラインカード (各 10-60 分) に修正されます。
4. **Prune**: `retentionDays` より古いフレーム (デフォルト 14) は削除されます。カード、観察内容、キャッシュされた standup は保持されます。

日付の境界とタイムラインの時刻は、ブラウザのタイムゾーンではなく Gateway のローカルタイムゾーンを使用します。フレームと SQLite タイムラインデータベースは `<state-dir>/logbook/` の下に保存されます。

## モデルとデータフロー

Logbook は 2 つの別々のモデル route を使用します:

| 段階             | 送信されるデータ                                               | モデル route                                                      |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| Observe          | 最大 16 個のサンプリングされた JPEG フレームとそのキャプチャ時刻 | `visionModel`、または互換性のある借用済み `tools.media` Codex entry |
| カードの合成     | タイムスタンプ付きの観察内容と最近のタイムラインカード           | plugin LLM runtime 経由のデフォルト agent model                   |
| standup の生成   | 選択した日と前日のカード                                       | plugin LLM runtime 経由のデフォルト agent model                   |
| その日について質問 | 質問、選択日のカード、最近の観察内容                           | plugin LLM runtime 経由のデフォルト agent model                   |

完全な SQLite データベースはいずれのモデルにも送信されません。生のスクリーンショットは観察段階にのみ送られます。カード合成、standup、Q&A は派生テキストを受け取ります。

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
          visionModel: "codex/gpt-5.5",
          retentionDays: 14,
        },
      },
    },
  },
}
```

すべての Logbook config keys は任意です。数値は整数に丸められ、サポートされる範囲に clamp されます。

| Key                       | デフォルト | 範囲または値            | 動作                                                                                         |
| ------------------------- | ---------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`     | boolean                 | 新しいスナップショットの永続的なマスタースイッチ。`false` の場合もタイムラインは利用可能     |
| `captureIntervalSeconds`  | `30`       | `5`-`600`               | キャプチャ試行間の遅延                                                                       |
| `analysisIntervalMinutes` | `15`       | `3`-`120`               | 目標の観察ウィンドウ。gap や深夜により早く閉じることがあります                              |
| `nodeId`                  | 未設定     | node id または表示名    | キャプチャを 1 つの接続済み node に固定します。照合では大文字小文字を区別しません           |
| `screenIndex`             | `0`        | `0`-`16`                | 0 始まりのディスプレイ index                                                                 |
| `maxWidth`                | `1440`     | `480`-`3840`            | 要求するキャプチャサイズの上限。ヘッドレス macOS は最大 dimension に適用します              |
| `visionModel`             | 未設定     | `provider/model`        | 明示的な構造化 route。不正な refs は分析を一時停止し、サポート外の provider は batches を失敗させます |
| `retentionDays`           | `14`       | `1`-`365`               | 古いフレームを削除します。カード、観察内容、standup は残ります                              |

`nodeId` がない場合、Logbook は `screen.snapshot` を公開する接続済み app node を優先し、その後 `logbook.snapshot` を公開するヘッドレス node にフォールバックします。固定されていないセットアップでは、失敗した node は他の適格な node の後ろに回されます。dashboard の一時停止トグルはセッション限定で、Gateway が再起動するとリセットされます。永続的に停止するには `captureEnabled: false` を使用してください。

### Vision model の選択

Logbook は観察モデルを次の順序で解決します:

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` 下の最初の画像対応 Codex entry
3. `tools.media.models` 下の最初の画像対応 Codex entry

他の media providers は、Logbook が必要とする構造化抽出 contract を現在公開していないためスキップされます。`tools.media.image.enabled: false` を設定すると、借用済み media defaults は無効になりますが、明示的な Logbook `visionModel` は引き続き適用されます。

## Dashboard タブ

- **Timeline**: カテゴリ色、メイン app、distraction chips、スナップショット keyframe を含む、アクティビティごとの展開可能なカード。
- **Day at a glance**: focus ratio、カテゴリ breakdown、上位 apps。
- **Daily standup**: 昨日と今日を、貼り付け可能な update に変換します。
- **Ask your day**: 追跡されたタイムラインから自然言語の質問に回答します (「when did I review the gateway PR?」)。
- **Analyze now**: 分析間隔を待たずに、現在のキャプチャウィンドウを即座に閉じます。

## Gateway methods

Logbook は次の Gateway RPC methods を登録します:

| Method                | Parameters               | Scope            | Result                                                                   |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | なし                     | `operator.read`  | キャプチャ、分析、モデル、node、Gateway day、Gateway timezone の状態     |
| `logbook.days`        | なし                     | `operator.read`  | タイムラインカード数とカード時刻範囲を含む日                             |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | 派生カードと日次統計。デフォルトは Gateway の現在日                      |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | 要求された epoch-millisecond 範囲内のフレーム metadata                   |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | base64 の 1 つの生 JPEG フレーム                                         |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | ある日のキャッシュ済みまたは再生成された standup text                    |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | ある日についての、タイムラインに基づく回答                               |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | セッション限定の一時停止状態と更新済み status                            |
| `logbook.analyze.now` | なし                     | `operator.write` | 保留中の分析を開始するか、開始できなかった理由を返します                 |

読み取り methods は運用状態または派生テキストを返します。生のスクリーンショット pixels、モデル支出を伴う actions、runtime mutations には `operator.write` が必要です。Control UI タブも、これらの actions と生フレーム previews を公開するため `operator.write` が必要です。読み取り専用 client でも、派生テキスト methods を直接呼び出すことはできます。

## プライバシーに関する注意

- スナップショットには秘密情報を含め、画面上のあらゆるものが含まれる可能性があります。フレームは、設定済みの観察モデルへのサンプリング入力として以外、マシンの外に出ません。
- 観察内容、最近のカード、質問は、カード合成、standup 生成、Q&A の間にデフォルト agent model を通じてマシンの外に出る可能性があります。provider のデータ取り扱いポリシーを両方のモデル route に適用してください。
- 完全にローカルなパイプラインが必要な場合は、構造化観察モデルとデフォルト agent model の両方にローカル route を使用してください。
- フレーム、タイムラインデータベース、一時キャプチャは、owner-only のファイル権限で書き込まれます。
- `gateway.nodes.denyCommands` に `screen.snapshot` を追加すると、画面キャプチャの kill switch になります。app-node capture と Logbook 自身の `logbook.snapshot` コマンドの両方をブロックします。
- `tools.media.image.enabled: false` を設定すると、Logbook が分析用に media image models を借用することも停止します。その場合は、plugin config 内の明示的な `visionModel` のみが使用されます。

## トラブルシューティング

### Logbook タブが表示されない

3 つの gate をすべて確認してください:

1. `openclaw plugins list --enabled` に `logbook` が含まれている。
2. plugin または allowlist の変更後に Gateway が再起動されている。
3. Control UI connection に `operator.write` がある。読み取り専用 sessions は interactive tab descriptor を受け取りません。

`plugins.allow` が設定されている場合、推奨構成では `logbook` と `codex` の両方を含める必要があります。

### キャプチャでエラーが報告される

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- ノードが `screen.snapshot` または `logbook.snapshot` を公開していることを確認します。
- キャプチャ用の Mac で画面収録権限を付与します。
- `nodeId` が設定されている場合は、ノードIDまたは表示名と一致することを確認します。
- `gateway.nodes.denyCommands` に `screen.snapshot` が含まれていないことを確認します。

3回連続で失敗すると、Logbook は10回のキャプチャtickの間バックオフし、その後再試行します。固定されていない設定では、別の対象ノードへ切り替わることがあります。

### キャプチャは成功するがカードが表示されない

- **モデルがありません** ステータスは、互換性のある構造化ビジョンルートが見つからなかったことを意味します。Codex Plugin を有効化して認証するか、有効な明示的 `visionModel` を設定します。キャプチャされたフレームはモデルがない間は保留のままになり、構成が修正された後に分析できます。
- `analysisIntervalMinutes` を待つか、アクティビティがキャプチャされた後で **今すぐ分析** を選択します。
- 連続する同一フレームはアイドル状態の証拠であり、分析バッチには入りません。テストする前に表示中の画面を変更します。
- 最新のバッチにエラーが表示される場合は、モデルまたは認証の問題を修正して **今すぐ分析** を選択します。失敗したバッチは、モデル費用の繰り返し発生を避けるため、その明示的な操作でのみ再試行されます。

## 関連

- [Pluginを管理](/ja-JP/plugins/manage-plugins)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [ノード](/ja-JP/nodes)
- [ノードのトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Control UI](/ja-JP/web/control-ui)
