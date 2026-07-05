---
read_when:
    - バグレポートまたはサポート依頼の準備
    - Gateway のクラッシュ、再起動、メモリ負荷、または過大なペイロードのデバッグ
    - 記録または編集される診断データを確認する
summary: バグ報告用に共有可能な Gateway 診断バンドルを作成する
title: 診断エクスポート
x-i18n:
    generated_at: "2026-07-05T11:19:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用のローカル診断 `.zip` を作成できます。これには、サニタイズ済みの Gateway ステータス、ヘルス、ログ、設定形状、最近のペイロードなしの安定性イベントが含まれます。

診断バンドルは、レビューが終わるまでシークレットと同様に扱ってください。ペイロードと認証情報は設計上リダクトされますが、バンドルにはローカル Gateway ログとホストレベルのランタイム状態の要約が含まれます。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

書き込まれた zip パスを出力します。出力パスを選択するには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化する場合:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

オーナーは任意の会話で `/diagnostics [note]` を実行し、コピー＆ペースト可能な単一のサポートレポートとしてローカル Gateway エクスポートを要求できます。

1. `/diagnostics` を送信します。必要に応じて短いメモを付けます (`/diagnostics bad tool choice`)。
2. OpenClaw は前置きを送信し、`openclaw gateway diagnostics export --json` を実行するための明示的な exec 承認を 1 回求めます。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルパス、マニフェスト要約、プライバシーメモ、関連するセッション ID を返信します。

グループチャットでも、オーナーは `/diagnostics` を実行できますが、OpenClaw はエクスポート結果、承認プロンプト、Codex セッション/スレッドの内訳をオーナーに非公開で送信します。グループには、診断が非公開で送信されたことを知らせる短い通知だけが表示されます。非公開のオーナールートが存在しない場合、このコマンドは fail closed し、オーナーに DM から実行するよう求めます。

アクティブなセッションがネイティブの OpenAI Codex ハーネスを使用している場合、同じ exec 承認は、OpenClaw が把握している Codex スレッドの OpenAI フィードバックアップロードも対象にします。このアップロードはローカル Gateway zip とは別で、Codex ハーネスセッションでのみ発生します。承認プロンプトには、承認すると Codex フィードバックも送信されることが記載されますが、Codex セッション ID やスレッド ID は一覧表示されません。承認後の返信には、OpenAI に送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが一覧表示されます。承認を拒否または無視すると、エクスポート、Codex フィードバックアップロード、Codex ID リストはスキップされます。

これにより、Codex のデバッグループは短くなります。チャンネルで不正な動作に気づいたら、`/diagnostics` を実行し、1 回承認し、レポートを共有します。その後、自分でスレッドを調べたい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-codex-threads-locally)を参照してください。

## エクスポートに含まれる内容

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス、安定性データの機械可読な要約。
- `manifest.json`: エクスポートメタデータとファイル一覧。
- サニタイズ済みの設定形状と、シークレットではない設定の詳細。
- サニタイズ済みのログ要約と、最近のリダクト済みログ行。
- ベストエフォートの Gateway ステータスとヘルスのスナップショット。
- `stability/latest.json`: 利用可能な場合、最新の永続化済み安定性バンドル。

Gateway が正常でない場合でも、エクスポートは有用です。ステータス/ヘルス要求が失敗しても、利用可能な場合はローカルログ、設定形状、最新の安定性バンドルが収集されます。

## プライバシーモデル

保持されるもの: サブシステム名、plugin ID、プロバイダー ID、チャンネル ID、設定済みモード、ステータスコード、所要時間、バイト数、キュー状態、メモリ読み取り値、サニタイズ済みログメタデータ、リダクト済み運用メッセージ、設定形状、シークレットではない機能設定。

省略またはリダクトされるもの: チャットテキスト、プロンプト、指示、Webhook 本文、ツール出力、認証情報、API キー、トークン、Cookie、シークレット値、生の要求/応答本文、アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名。

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストのように見える場合、エクスポートはメッセージが省略されたことと、そのバイト数だけを保持します。

## 安定性レコーダー

Gateway は、診断が有効な場合、デフォルトで境界付きのペイロードなし安定性ストリームを記録します。これは内容ではなく、運用上の事実をキャプチャします。

同じ Heartbeat は、イベントループまたは CPU が飽和しているように見える場合にも liveness をサンプリングし、イベントループ遅延、イベントループ使用率、CPU コア比率、アクティブ/待機中/キュー内のセッション数、現在の起動/ランタイムフェーズ（判明している場合）、最近のフェーズ区間、境界付きの作業ラベルを含む `diagnostic.liveness.warning` イベントを発行します。これらは、作業が待機中またはキュー内の場合、またはアクティブな作業が継続的なイベントループ遅延と重なる場合にのみ、Gateway の `warn` レベルのログ行になります。それ以外の場合は `debug` でログに記録されます。アイドル時の liveness サンプルも診断イベントとして記録されますが、それ自体で警告に昇格することはありません。

起動フェーズは、実時間と CPU タイミングを含む `diagnostic.phase.completed` イベントを発行します。停止した埋め込み実行の診断では、最後のブリッジ進行がターミナルに見えた場合（たとえば、生の応答項目や応答完了イベント）でも Gateway が埋め込み実行をまだアクティブと見なしているときに、`terminalProgressStale=true` がマークされます。

ライブレコーダーを調べるには:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的な終了、シャットダウンタイムアウト、または再起動時の起動失敗後に、最新の永続化済みバンドルを調べるには:

```bash
openclaw gateway stability --bundle latest
```

最新の永続化済みバンドルから診断 zip を作成するには:

```bash
openclaw gateway stability --bundle latest --export
```

イベントが存在する場合、永続化済みバンドルは `~/.openclaw/logs/stability/` 配下にあります。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| フラグ                  | デフォルト                                                                    | 説明                                               |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 特定の zip パス（またはディレクトリ）に書き込みます。 |
| `--log-lines <count>`   | `5000`                                                                        | 含めるサニタイズ済みログ行の最大数。               |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 調査するログバイト数の最大値。                     |
| `--url <url>`           | -                                                                             | ステータス/ヘルススナップショット用の Gateway WebSocket URL。 |
| `--token <token>`       | -                                                                             | ステータス/ヘルススナップショット用の Gateway トークン。 |
| `--password <password>` | -                                                                             | ステータス/ヘルススナップショット用の Gateway パスワード。 |
| `--timeout <ms>`        | `3000`                                                                        | ステータス/ヘルススナップショットのタイムアウト。  |
| `--no-stability-bundle` | オフ                                                                          | 永続化済み安定性バンドルの検索をスキップします。   |
| `--json`                | オフ                                                                          | 機械可読なエクスポートメタデータを出力します。     |

## 診断を無効にする

診断はデフォルトで有効です。安定性レコーダーと診断イベント収集を無効にするには:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効にすると、バグ報告の詳細は少なくなりますが、通常の Gateway ロギングには影響しません。

重大なメモリ圧迫スナップショットはデフォルトでオフです。通常の診断イベントに加えて OOM 前の安定性スナップショットをキャプチャするには:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

これは、重大なメモリ圧迫中に追加のファイルシステムスキャンとスナップショット書き込みを許容できるホストでのみ使用してください。スナップショットがオフの場合でも、通常のメモリ圧迫イベントは RSS、ヒープ、しきい値、増加の事実（`rss_threshold`、`heap_threshold`、`rss_growth`）を記録します。

## 関連

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#rpc-method-families)
- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) - 診断をコレクターへストリーミングするための別フロー
