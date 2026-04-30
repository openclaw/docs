---
read_when:
    - バグ報告またはサポート依頼の準備
    - Gateway のクラッシュ、再起動、メモリ逼迫、または過大なペイロードのデバッグ
    - どの診断データが記録または秘匿されるかを確認する
summary: バグレポート用に共有可能な Gateway 診断バンドルを作成する
title: 診断情報のエクスポート
x-i18n:
    generated_at: "2026-04-30T05:12:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用のローカル診断 zip を作成できます。サニタイズ済みの Gateway ステータス、ヘルス、ログ、設定の形状、最近のペイロードを含まない安定性イベントをまとめます。

診断バンドルは、確認が終わるまでシークレットと同様に扱ってください。ペイロードや認証情報を省略または墨消しするよう設計されていますが、それでもローカル Gateway ログとホストレベルのランタイム状態を要約します。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは書き込まれた zip パスを出力します。パスを選ぶには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化向け:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

所有者は、チャットで `/diagnostics [note]` を使用してローカル Gateway エクスポートを要求できます。実際の会話でバグが発生し、サポート用にコピー&ペーストできるレポートを 1 つ作りたい場合に使用します。

1. 問題に気づいた会話で `/diagnostics` を送信します。役立つ場合は、たとえば `/diagnostics bad tool choice` のように短いメモを追加します。
2. OpenClaw は診断の前置き文を送信し、明示的な exec 承認を 1 回求めます。この承認は `openclaw gateway diagnostics export --json` を実行します。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルのパス、マニフェスト要約、プライバシーメモ、関連するセッション ID を含む貼り付け可能なレポートで返信します。

グループチャットでは、所有者は引き続き `/diagnostics` を実行できますが、OpenClaw は診断の詳細を共有チャットに投稿しません。前置き文、承認プロンプト、Gateway エクスポート結果、Codex セッション/スレッドの内訳を、非公開の承認経路を通じて所有者に送信します。グループには、診断フローが非公開で送信されたという短い通知だけが届きます。OpenClaw が所有者への非公開経路を見つけられない場合、コマンドは fail closed し、所有者に DM から実行するよう求めます。

アクティブな OpenClaw セッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ exec 承認は、OpenClaw が把握している Codex ランタイムスレッドの OpenAI フィードバックアップロードも対象にします。このアップロードはローカル Gateway zip とは別で、Codex ハーネスのセッションでのみ表示されます。承認前のプロンプトでは、診断を承認すると Codex フィードバックも送信されることを説明しますが、Codex セッション ID やスレッド ID は列挙しません。承認後、チャット返信には、OpenAI サーバーへ送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが列挙されます。承認を拒否または無視した場合、OpenClaw はエクスポートを実行せず、Codex フィードバックも送信せず、Codex ID も出力しません。

これにより、一般的な Codex デバッグループは短くなります。Telegram、Discord、または別のチャンネルで不適切な動作に気づいたら、`/diagnostics` を実行し、一度承認し、レポートをサポートと共有し、その後ネイティブ Codex スレッドを自分で調べたい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。その調査ワークフローについては [Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) を参照してください。

## エクスポートに含まれる内容

zip には次が含まれます。

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス、安定性データの機械可読な要約。
- `manifest.json`: エクスポートのメタデータとファイル一覧。
- サニタイズ済みの設定の形状と、シークレットではない設定の詳細。
- サニタイズ済みのログ要約と、最近の墨消し済みログ行。
- ベストエフォートの Gateway ステータスとヘルスのスナップショット。
- `stability/latest.json`: 利用可能な場合、永続化された最新の安定性バンドル。

Gateway が正常でない場合でも、エクスポートは有用です。Gateway がステータスやヘルスのリクエストに応答できない場合でも、利用可能であればローカルログ、設定の形状、最新の安定性バンドルは収集されます。

## プライバシーモデル

診断は共有可能であることを意図して設計されています。エクスポートには、次のようなデバッグに役立つ運用データが保持されます。

- サブシステム名、Plugin ID、プロバイダー ID、チャンネル ID、設定されたモード
- ステータスコード、所要時間、バイト数、キュー状態、メモリ読み取り値
- サニタイズ済みのログメタデータと、墨消し済みの運用メッセージ
- 設定の形状と、シークレットではない機能設定

エクスポートでは、次を省略または墨消しします。

- チャット本文、プロンプト、指示、Webhook ボディ、ツール出力
- 認証情報、API キー、トークン、Cookie、シークレット値
- 生のリクエストまたはレスポンスボディ
- アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストのように見える場合、エクスポートはメッセージが省略されたこととバイト数のみを保持します。

## 安定性レコーダー

Gateway は、診断が有効な場合、ペイロードを含まない有界の安定性ストリームをデフォルトで記録します。これは運用上の事実のためのものであり、コンテンツのためのものではありません。

同じ診断 Heartbeat は、Gateway は実行され続けているものの Node.js イベントループまたは CPU が飽和しているように見える場合に、liveness 警告を記録します。これらの `diagnostic.liveness.warning` イベントには、イベントループ遅延、イベントループ使用率、CPU コア比、active/waiting/queued セッション数が含まれます。これらが単独で Gateway を再起動することはありません。

ライブレコーダーを検査します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的終了、シャットダウンタイムアウト、または再起動時の起動失敗後に、永続化された最新の安定性バンドルを検査します。

```bash
openclaw gateway stability --bundle latest
```

永続化された最新バンドルから診断 zip を作成します。

```bash
openclaw gateway stability --bundle latest --export
```

イベントが存在する場合、永続化バンドルは `~/.openclaw/logs/stability/` 配下に保存されます。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 指定した zip パスに書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 検査するログバイト数の最大値。
- `--url <url>`: ステータスとヘルスのスナップショット用 Gateway WebSocket URL。
- `--token <token>`: ステータスとヘルスのスナップショット用 Gateway トークン。
- `--password <password>`: ステータスとヘルスのスナップショット用 Gateway パスワード。
- `--timeout <ms>`: ステータスとヘルスのスナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化された安定性バンドルの検索をスキップします。
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
- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — 診断をコレクターへストリーミングするための別フロー
