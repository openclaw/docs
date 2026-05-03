---
read_when:
    - バグ報告またはサポート依頼の準備
    - Gateway のクラッシュ、再起動、メモリ圧迫、または過大なペイロードのデバッグ
    - 記録またはマスクされる診断データを確認する
summary: バグレポート用の共有可能な Gateway 診断バンドルを作成する
title: 診断情報のエクスポート
x-i18n:
    generated_at: "2026-05-03T21:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用のローカル診断 zip を作成できます。これには、サニタイズ済みの Gateway ステータス、ヘルス、ログ、設定の形状、最近のペイロードなしの安定性イベントがまとめられます。

診断バンドルは、確認するまでシークレットと同じように扱ってください。ペイロードや認証情報を省略または秘匿するように設計されていますが、それでもローカル Gateway ログとホストレベルのランタイム状態を要約します。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは、書き込まれた zip パスを出力します。パスを選ぶには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化する場合:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

オーナーはチャットで `/diagnostics [note]` を使い、ローカル Gateway エクスポートを要求できます。実際の会話でバグが発生し、サポート向けにコピー＆ペースト可能なレポートを 1 つ用意したい場合に使います。

1. 問題に気づいた会話で `/diagnostics` を送信します。役立つ場合は、たとえば `/diagnostics bad tool choice` のように短いメモを追加します。
2. OpenClaw は診断の前文を送信し、明示的な exec 承認を 1 回求めます。この承認により `openclaw gateway diagnostics export --json` が実行されます。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルのパス、マニフェスト概要、プライバシーメモ、関連するセッション ID を含む、貼り付け可能なレポートを返します。

グループチャットでもオーナーは `/diagnostics` を実行できますが、OpenClaw は診断の詳細を共有チャットには投稿しません。前文、承認プロンプト、Gateway エクスポート結果、Codex セッション/スレッドの内訳は、プライベート承認経路を通じてオーナーに送信されます。グループには、診断フローが非公開で送信されたという短い通知だけが届きます。OpenClaw がオーナーへのプライベート経路を見つけられない場合、コマンドは安全側に失敗し、DM から実行するようオーナーに求めます。

アクティブな OpenClaw セッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ exec 承認により、OpenClaw が把握している Codex ランタイムスレッドの OpenAI フィードバックアップロードも対象になります。そのアップロードはローカル Gateway zip とは別で、Codex ハーネスセッションの場合にのみ表示されます。承認前に、プロンプトは診断を承認すると Codex フィードバックも送信されることを説明しますが、Codex セッション ID やスレッド ID は列挙しません。承認後、チャット返信には、OpenAI サーバーに送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はエクスポートを実行せず、Codex フィードバックを送信せず、Codex ID も出力しません。

これにより、一般的な Codex デバッグループは短くなります。Telegram、Discord、または別のチャンネルで不適切な動作に気づいたら、`/diagnostics` を実行し、1 回承認し、レポートをサポートと共有してから、ネイティブ Codex スレッドを自分で調べたい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。その調査ワークフローについては、[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)を参照してください。

## エクスポートに含まれる内容

zip には以下が含まれます。

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス、安定性データの機械可読な概要。
- `manifest.json`: エクスポートのメタデータとファイル一覧。
- サニタイズ済みの設定の形状と、シークレットではない設定の詳細。
- サニタイズ済みのログ概要と、最近の秘匿済みログ行。
- ベストエフォートの Gateway ステータスとヘルスのスナップショット。
- `stability/latest.json`: 利用可能な場合、最新の永続化済み安定性バンドル。

Gateway が異常な状態でも、エクスポートは役立ちます。Gateway がステータスやヘルスリクエストに応答できない場合でも、利用可能であればローカルログ、設定の形状、最新の安定性バンドルが収集されます。

## プライバシーモデル

診断は共有できるように設計されています。エクスポートには、次のようなデバッグに役立つ運用データが保持されます。

- サブシステム名、plugin ID、プロバイダー ID、チャンネル ID、設定済みモード
- ステータスコード、所要時間、バイト数、キュー状態、メモリ読み取り値
- サニタイズ済みのログメタデータと、秘匿済みの運用メッセージ
- 設定の形状と、シークレットではない機能設定

エクスポートでは、以下が省略または秘匿されます。

- チャット本文、プロンプト、指示、webhook 本文、ツール出力
- 認証情報、API キー、トークン、Cookie、シークレット値
- 生のリクエスト本文またはレスポンス本文
- アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストのように見える場合、エクスポートにはメッセージが省略されたこととバイト数だけが保持されます。

## 安定性レコーダー

Gateway は、診断が有効な場合、デフォルトで境界付きのペイロードなし安定性ストリームを記録します。これはコンテンツではなく、運用上の事実のためのものです。

同じ診断 Heartbeat は、Gateway は稼働し続けているが Node.js イベントループまたは CPU が飽和しているように見える場合に、稼働状態サンプルを記録します。これらの `diagnostic.liveness.warning` イベントには、イベントループ遅延、イベントループ使用率、CPU コア比率、アクティブ/待機中/キュー内のセッション数が含まれます。アイドルサンプルは `info` レベルのテレメトリに残ります。稼働状態サンプルは、作業が待機中またはキュー内の場合、またはアクティブな作業が継続的なイベントループ遅延と重なる場合にのみ Gateway 警告になります。それ以外は正常なバックグラウンド作業中の一時的な最大遅延スパイクは、デバッグログに残ります。それ自体で Gateway を再起動することはありません。

ライブレコーダーを調べるには:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的終了、シャットダウンタイムアウト、または再起動時の起動失敗後に、最新の永続化済み安定性バンドルを調べるには:

```bash
openclaw gateway stability --bundle latest
```

最新の永続化済みバンドルから診断 zip を作成するには:

```bash
openclaw gateway stability --bundle latest --export
```

永続化済みバンドルは、イベントが存在する場合 `~/.openclaw/logs/stability/` の下に保存されます。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 特定の zip パスに書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 調べるログバイトの最大数。
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

診断を無効にすると、バグ報告の詳細度が下がります。通常の Gateway ログには影響しません。

## 関連

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#system-and-identity)
- [ログ記録](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — 診断をコレクターへストリーミングするための別フロー
