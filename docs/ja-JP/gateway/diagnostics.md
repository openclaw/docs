---
read_when:
    - バグレポートまたはサポートリクエストを準備する
    - Gateway のクラッシュ、再起動、メモリ負荷、または過大なペイロードのデバッグ
    - 記録または編集される診断データの確認
summary: 共有可能な Gateway 診断バンドルを作成してバグ報告に添付する
title: 診断エクスポート
x-i18n:
    generated_at: "2026-06-27T11:25:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用のローカル診断 zip を作成できます。これは、サニタイズ済みの Gateway ステータス、ヘルス、ログ、設定形状、最近のペイロードなしの安定性イベントをまとめます。

診断バンドルは、レビューするまでシークレットのように扱ってください。ペイロードや認証情報を省略または秘匿するように設計されていますが、それでもローカル Gateway ログとホストレベルのランタイム状態を要約します。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは、書き込まれた zip パスを出力します。パスを選ぶには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化用:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

オーナーはチャットで `/diagnostics [note]` を使い、ローカル Gateway エクスポートを要求できます。実際の会話でバグが発生し、サポート用にコピーして貼り付けられるレポートが 1 つ欲しい場合に使います:

1. 問題に気づいた会話で `/diagnostics` を送信します。役立つ場合は、たとえば `/diagnostics bad tool choice` のように短いメモを追加します。
2. OpenClaw は診断の前文を送信し、明示的な exec 承認を 1 つ求めます。この承認は `openclaw gateway diagnostics export --json` を実行します。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルパス、マニフェスト要約、プライバシーメモ、関連するセッション ID を含む貼り付け可能なレポートで返信します。

グループチャットでは、オーナーは引き続き `/diagnostics` を実行できますが、OpenClaw は診断の詳細を共有チャットには投稿しません。前文、承認プロンプト、Gateway エクスポート結果、Codex セッション/スレッドの内訳を、非公開の承認経路を通じてオーナーに送信します。グループには、診断フローが非公開で送信されたという短い通知だけが届きます。OpenClaw が非公開のオーナー経路を見つけられない場合、コマンドはフェイルクローズし、オーナーに DM から実行するよう求めます。

アクティブな OpenClaw セッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ exec 承認は、OpenClaw が把握している Codex ランタイムスレッドの OpenAI フィードバックアップロードも対象にします。そのアップロードはローカル Gateway zip とは別で、Codex ハーネスセッションでのみ表示されます。承認前に、プロンプトは診断を承認すると Codex フィードバックも送信されることを説明しますが、Codex セッション ID やスレッド ID は列挙しません。承認後、チャット返信には、OpenAI サーバーへ送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが列挙されます。承認を拒否または無視した場合、OpenClaw はエクスポートを実行せず、Codex フィードバックを送信せず、Codex ID も出力しません。

これにより、一般的な Codex デバッグループが短くなります。Telegram、Discord、または別のチャンネルで不正な挙動に気づき、`/diagnostics` を実行し、一度承認し、レポートをサポートと共有し、ネイティブ Codex スレッドを自分で調べたい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。その調査ワークフローについては、[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-codex-threads-locally)を参照してください。

## エクスポートに含まれるもの

zip には次が含まれます:

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス、安定性データの機械可読な要約。
- `manifest.json`: エクスポートメタデータとファイル一覧。
- サニタイズ済みの設定形状と非シークレットの設定詳細。
- サニタイズ済みのログ要約と、最近の秘匿済みログ行。
- ベストエフォートの Gateway ステータスとヘルスのスナップショット。
- `stability/latest.json`: 利用可能な場合、最新の永続化済み安定性バンドル。

Gateway が正常でない場合でも、エクスポートは役立ちます。Gateway がステータスまたはヘルス要求に応答できない場合でも、ローカルログ、設定形状、最新の安定性バンドルは、利用可能な場合に収集されます。

## プライバシーモデル

診断は共有可能なように設計されています。エクスポートは、デバッグに役立つ次のような運用データを保持します:

- サブシステム名、plugin ID、プロバイダー ID、チャンネル ID、設定済みモード
- ステータスコード、所要時間、バイト数、キュー状態、メモリ読み取り値
- サニタイズ済みログメタデータと秘匿済み運用メッセージ
- 設定形状と非シークレットの機能設定

エクスポートは次を省略または秘匿します:

- チャットテキスト、プロンプト、指示、webhook ボディ、ツール出力
- 認証情報、API キー、トークン、Cookie、シークレット値
- 生のリクエスト本文またはレスポンス本文
- アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストに見える場合、エクスポートはメッセージが省略されたこととバイト数だけを保持します。

## 安定性レコーダー

Gateway は、診断が有効な場合、デフォルトで有界のペイロードなし安定性ストリームを記録します。これは運用上の事実のためのものであり、コンテンツのためのものではありません。

同じ診断 Heartbeat は、Gateway が実行を継続しているものの、Node.js イベントループまたは CPU が飽和しているように見える場合に、liveness サンプルを記録します。これらの `diagnostic.liveness.warning` イベントには、イベントループ遅延、イベントループ使用率、CPU コア比、アクティブ/待機中/キュー中のセッション数、判明している場合は現在の起動/ランタイムフェーズ、最近のフェーズスパン、有界のアクティブ/キュー中ワークラベルが含まれます。アイドルサンプルは `info` レベルでテレメトリに残ります。liveness サンプルが Gateway 警告になるのは、ワークが待機中またはキュー中の場合、またはアクティブなワークが継続的なイベントループ遅延と重なった場合だけです。それ以外は健全なバックグラウンドワーク中の一時的な最大遅延スパイクは、デバッグログに残ります。それ自体で Gateway を再起動することはありません。

起動フェーズも、実時間と CPU タイミングを含む `diagnostic.phase.completed` イベントを出力します。停止した embedded-run 診断は、最後のブリッジ進行状況が生のレスポンス項目やレスポンス完了イベントなど terminal に見えたものの、Gateway がまだ embedded run をアクティブと見なしている場合に、`terminalProgressStale=true` を設定します。

ライブレコーダーを調べます:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的な終了、シャットダウンタイムアウト、または再起動時の起動失敗の後に、最新の永続化済み安定性バンドルを調べます:

```bash
openclaw gateway stability --bundle latest
```

最新の永続化済みバンドルから診断 zip を作成します:

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

- `--output <path>`: 特定の zip パスへ書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 検査するログバイト数の最大値。
- `--url <url>`: ステータスとヘルスのスナップショット用の Gateway WebSocket URL。
- `--token <token>`: ステータスとヘルスのスナップショット用の Gateway トークン。
- `--password <password>`: ステータスとヘルスのスナップショット用の Gateway パスワード。
- `--timeout <ms>`: ステータスとヘルスのスナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化済み安定性バンドルの検索をスキップします。
- `--json`: 機械可読なエクスポートメタデータを出力します。

## 診断を無効にする

診断はデフォルトで有効です。安定性レコーダーと診断イベント収集を無効にするには:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効にすると、バグ報告の詳細が減ります。通常の Gateway ログには影響しません。

重大なメモリプレッシャースナップショットはデフォルトでオフです。診断イベントを保持しつつ、OOM 前の安定性スナップショットもキャプチャするには:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

これは、重大なメモリプレッシャー中の追加ファイルシステムスキャンとスナップショット書き込みを許容できるホストでのみ使用してください。通常のメモリプレッシャーイベントは、スナップショットがオフの場合でも RSS、ヒープ、しきい値、増加の事実を記録します。

## 関連

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#system-and-identity)
- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — 診断をコレクターへストリーミングするための別フロー
