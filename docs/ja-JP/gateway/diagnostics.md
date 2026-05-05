---
read_when:
    - バグレポートまたはサポート依頼の準備
    - Gateway のクラッシュ、再起動、メモリ負荷、または過大なペイロードのデバッグ
    - どの診断データが記録またはマスクされるかを確認する
summary: バグ報告用に共有可能な Gateway 診断バンドルを作成する
title: 診断情報のエクスポート
x-i18n:
    generated_at: "2026-05-05T01:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用のローカル診断 zip を作成できます。これには、サニタイズされた Gateway のステータス、ヘルス、ログ、設定の形状、最近のペイロードを含まない安定性イベントがまとめられます。

診断バンドルは、レビューするまで秘密情報のように扱ってください。ペイロードや認証情報を省略または墨消しするよう設計されていますが、それでもローカル Gateway ログとホストレベルのランタイム状態の概要を含みます。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは、書き込まれた zip パスを出力します。パスを選ぶには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化には:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

所有者はチャットで `/diagnostics [note]` を使い、ローカル Gateway のエクスポートを要求できます。実際の会話でバグが発生し、サポート向けにコピー＆ペースト可能なレポートを 1 つ用意したい場合に使います。

1. 問題に気づいた会話で `/diagnostics` を送信します。役立つ場合は、たとえば `/diagnostics bad tool choice` のように短いメモを追加します。
2. OpenClaw は診断の前置きを送信し、明示的な exec 承認を 1 回求めます。この承認により `openclaw gateway diagnostics export --json` が実行されます。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルパス、マニフェスト概要、プライバシーに関する注記、関連するセッション ID を含む、貼り付け可能なレポートで返信します。

グループチャットでは、所有者は引き続き `/diagnostics` を実行できますが、OpenClaw は診断の詳細を共有チャットに投稿しません。前置き、承認プロンプト、Gateway エクスポート結果、Codex セッション/スレッドの内訳を、プライベート承認経路を通じて所有者に送信します。グループには、診断フローが非公開で送信されたという短い通知だけが届きます。OpenClaw が所有者へのプライベート経路を見つけられない場合、コマンドは安全側に失敗し、DM から実行するよう所有者に求めます。

アクティブな OpenClaw セッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ exec 承認は、OpenClaw が把握している Codex ランタイムスレッドの OpenAI フィードバックアップロードも対象にします。このアップロードはローカル Gateway zip とは別であり、Codex ハーネスセッションでのみ表示されます。承認前に、プロンプトは診断を承認すると Codex フィードバックも送信されることを説明しますが、Codex セッション ID やスレッド ID は一覧表示しません。承認後、チャット返信には、OpenAI サーバーへ送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はエクスポートを実行せず、Codex フィードバックを送信せず、Codex ID も表示しません。

これにより、一般的な Codex デバッグループは短くなります。Telegram、Discord、または別のチャンネルで問題のある動作に気づき、`/diagnostics` を実行し、1 回承認し、レポートをサポートと共有し、ネイティブ Codex スレッドを自分で確認したい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。その確認ワークフローについては、[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)を参照してください。

## エクスポートに含まれるもの

zip には次が含まれます。

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス、安定性データの機械可読な概要。
- `manifest.json`: エクスポートメタデータとファイル一覧。
- サニタイズされた設定の形状と、秘密情報ではない設定詳細。
- サニタイズされたログ概要と、最近の墨消し済みログ行。
- ベストエフォートの Gateway ステータスおよびヘルススナップショット。
- `stability/latest.json`: 利用可能な場合、永続化された最新の安定性バンドル。

Gateway が正常でない場合でも、エクスポートは有用です。Gateway がステータスやヘルスリクエストに応答できない場合でも、ローカルログ、設定の形状、最新の安定性バンドルは、利用可能であれば収集されます。

## プライバシーモデル

診断は共有できるように設計されています。エクスポートには、デバッグに役立つ運用データが保持されます。例:

- サブシステム名、Plugin ID、プロバイダー ID、チャンネル ID、設定済みモード
- ステータスコード、期間、バイト数、キュー状態、メモリ読み取り値
- サニタイズされたログメタデータと、墨消しされた運用メッセージ
- 設定の形状と、秘密情報ではない機能設定

エクスポートでは、次が省略または墨消しされます。

- チャットテキスト、プロンプト、指示、Webhook 本文、ツール出力
- 認証情報、API キー、トークン、Cookie、秘密値
- 生のリクエスト本文またはレスポンス本文
- アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストのように見える場合、エクスポートにはメッセージが省略されたこととバイト数のみが保持されます。

## 安定性レコーダー

Gateway は、診断が有効な場合、デフォルトで境界付きのペイロードを含まない安定性ストリームを記録します。これは運用上の事実のためのものであり、コンテンツのためのものではありません。

同じ診断 Heartbeat は、Gateway が稼働し続けている一方で Node.js イベントループまたは CPU が飽和しているように見える場合に、liveness サンプルを記録します。これらの `diagnostic.liveness.warning` イベントには、イベントループ遅延、イベントループ使用率、CPU コア比率、アクティブ/待機中/キュー内のセッション数、既知の場合は現在の起動/ランタイムフェーズ、最近のフェーズ期間、境界付きのアクティブ/キュー内作業ラベルが含まれます。アイドルサンプルは `info` レベルのテレメトリに残ります。liveness サンプルは、作業が待機中またはキュー内にある場合、またはアクティブな作業が継続的なイベントループ遅延と重なる場合にのみ Gateway 警告になります。それ以外は正常なバックグラウンド作業中の一時的な最大遅延スパイクは、デバッグログに残ります。それ自体で Gateway を再起動することはありません。

起動フェーズも、ウォールクロック時間と CPU タイミングを含む `diagnostic.phase.completed` イベントを発行します。停止した embedded-run 診断は、最後のブリッジ進行状況が生のレスポンス項目やレスポンス完了イベントなどの終端に見えたにもかかわらず、Gateway がまだ埋め込み実行をアクティブと見なしている場合に `terminalProgressStale=true` を設定します。

ライブレコーダーを確認します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的終了、シャットダウンタイムアウト、または再起動時の起動失敗の後、永続化された最新の安定性バンドルを確認します。

```bash
openclaw gateway stability --bundle latest
```

永続化された最新バンドルから診断 zip を作成します。

```bash
openclaw gateway stability --bundle latest --export
```

イベントが存在する場合、永続化バンドルは `~/.openclaw/logs/stability/` 配下にあります。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 特定の zip パスに書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 検査するログバイトの最大数。
- `--url <url>`: ステータスおよびヘルススナップショット用の Gateway WebSocket URL。
- `--token <token>`: ステータスおよびヘルススナップショット用の Gateway トークン。
- `--password <password>`: ステータスおよびヘルススナップショット用の Gateway パスワード。
- `--timeout <ms>`: ステータスおよびヘルススナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化された安定性バンドルの検索をスキップします。
- `--json`: 機械可読なエクスポートメタデータを出力します。

## 診断を無効化する

診断はデフォルトで有効です。安定性レコーダーと診断イベント収集を無効化するには:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効化すると、バグ報告の詳細が少なくなります。通常の Gateway ロギングには影響しません。

## 関連

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#system-and-identity)
- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — 診断をコレクターへストリーミングするための別フロー
