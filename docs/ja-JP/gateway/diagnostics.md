---
read_when:
    - バグ報告またはサポート依頼の準備
    - Gateway のクラッシュ、再起動、メモリ圧迫、または過大なペイロードのデバッグ
    - 記録または秘匿される診断データを確認する
summary: バグ報告用の共有可能な Gateway 診断バンドルを作成する
title: 診断情報のエクスポート
x-i18n:
    generated_at: "2026-05-02T04:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw はバグレポート用にローカル診断 zip を作成できます。これは、サニタイズ済みの Gateway ステータス、ヘルス、ログ、設定の形状、直近のペイロードを含まない安定性イベントをまとめます。

診断バンドルは、確認するまではシークレットと同じように扱ってください。ペイロードや認証情報を省略またはマスクするよう設計されていますが、それでもローカル Gateway ログとホストレベルのランタイム状態の概要を含みます。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは書き込まれた zip パスを出力します。パスを選ぶには、次を実行します。

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化には、次を使用します。

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

オーナーはチャットで `/diagnostics [note]` を使用して、ローカル Gateway エクスポートを要求できます。実際の会話中にバグが発生し、サポート向けにコピー＆ペーストできるレポートを 1 つ用意したい場合に使用します。

1. 問題に気付いた会話で `/diagnostics` を送信します。役立つ場合は、たとえば `/diagnostics bad tool choice` のように短いメモを追加します。
2. OpenClaw は診断の前文を送信し、明示的な exec 承認を 1 回求めます。この承認は `openclaw gateway diagnostics export --json` を実行します。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルのパス、マニフェスト概要、プライバシーノート、関連するセッション ID を含む貼り付け可能なレポートを返信します。

グループチャットでも、オーナーは `/diagnostics` を実行できますが、OpenClaw は診断の詳細を共有チャットに投稿しません。前文、承認プロンプト、Gateway エクスポート結果、Codex セッション/スレッドの内訳を、プライベート承認経路を通じてオーナーに送信します。グループには、診断フローが非公開で送信されたという短い通知だけが表示されます。OpenClaw がプライベートなオーナー経路を見つけられない場合、コマンドは安全側で失敗し、オーナーに DM から実行するよう求めます。

アクティブな OpenClaw セッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ exec 承認は、OpenClaw が把握している Codex ランタイムスレッドの OpenAI フィードバックアップロードも対象にします。このアップロードはローカル Gateway zip とは別で、Codex ハーネスセッションでのみ表示されます。承認前に、プロンプトは診断を承認すると Codex フィードバックも送信されることを説明しますが、Codex セッション ID やスレッド ID は列挙しません。承認後、チャット返信には、OpenAI サーバーに送信されたスレッドのチャネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はエクスポートを実行せず、Codex フィードバックを送信せず、Codex ID も出力しません。

これにより、一般的な Codex デバッグループは短くなります。Telegram、Discord、または別のチャネルで不適切な動作に気付き、`/diagnostics` を実行し、1 回承認し、レポートをサポートと共有し、その後、ネイティブ Codex スレッドを自分で調べたい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。その調査ワークフローについては、[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)を参照してください。

## エクスポートに含まれる内容

zip には次が含まれます。

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス、安定性データの機械可読な概要。
- `manifest.json`: エクスポートのメタデータとファイル一覧。
- サニタイズ済みの設定形状と非シークレット設定の詳細。
- サニタイズ済みのログ概要と直近のマスク済みログ行。
- ベストエフォートの Gateway ステータスとヘルスのスナップショット。
- `stability/latest.json`: 利用可能な場合、最新の永続化された安定性バンドル。

このエクスポートは、Gateway が異常な場合でも有用です。Gateway がステータスまたはヘルスリクエストに応答できない場合でも、利用可能であれば、ローカルログ、設定形状、最新の安定性バンドルが収集されます。

## プライバシーモデル

診断は共有可能であるように設計されています。エクスポートには、デバッグに役立つ次のような運用データが保持されます。

- サブシステム名、Plugin ID、プロバイダー ID、チャネル ID、設定済みモード
- ステータスコード、所要時間、バイト数、キュー状態、メモリ測定値
- サニタイズ済みのログメタデータとマスク済みの運用メッセージ
- 設定形状と非シークレットの機能設定

エクスポートでは、次を省略またはマスクします。

- チャットテキスト、プロンプト、指示、webhook 本文、ツール出力
- 認証情報、API キー、トークン、Cookie、シークレット値
- 生のリクエスト本文またはレスポンス本文
- アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストのように見える場合、エクスポートにはメッセージが省略されたこととバイト数だけが保持されます。

## 安定性レコーダー

Gateway は、診断が有効な場合、既定で境界付きのペイロードを含まない安定性ストリームを記録します。これはコンテンツではなく運用上の事実のためのものです。

同じ診断 Heartbeat は、Gateway は動作し続けているものの Node.js イベントループまたは CPU が飽和しているように見える場合に、ライブネスサンプルを記録します。これらの `diagnostic.liveness.warning` イベントには、イベントループ遅延、イベントループ使用率、CPU コア比率、アクティブ/待機中/キュー内のセッション数が含まれます。アイドルサンプルは `info` レベルでテレメトリに残ります。診断作業がアクティブ、待機中、またはキュー内の場合にのみ Gateway 警告としてログに記録されます。それ自体で Gateway を再起動することはありません。

ライブレコーダーを調べます。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的終了、シャットダウンタイムアウト、または再起動時の起動失敗の後に、最新の永続化された安定性バンドルを調べます。

```bash
openclaw gateway stability --bundle latest
```

最新の永続化されたバンドルから診断 zip を作成します。

```bash
openclaw gateway stability --bundle latest --export
```

イベントが存在する場合、永続化されたバンドルは `~/.openclaw/logs/stability/` 配下にあります。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 指定した zip パスに書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 調査するログバイト数の最大値。
- `--url <url>`: ステータスとヘルスのスナップショット用の Gateway WebSocket URL。
- `--token <token>`: ステータスとヘルスのスナップショット用の Gateway トークン。
- `--password <password>`: ステータスとヘルスのスナップショット用の Gateway パスワード。
- `--timeout <ms>`: ステータスとヘルスのスナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化された安定性バンドルの検索をスキップします。
- `--json`: 機械可読なエクスポートメタデータを出力します。

## 診断を無効化する

診断は既定で有効です。安定性レコーダーと診断イベント収集を無効化するには、次のようにします。

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効化すると、バグレポートの詳細は少なくなります。通常の Gateway ログには影響しません。

## 関連

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#system-and-identity)
- [ログ記録](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — 診断をコレクターにストリーミングするための別フロー
