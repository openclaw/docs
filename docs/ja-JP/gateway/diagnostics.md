---
read_when:
    - バグレポートまたはサポート依頼を準備しています
    - Gateway クラッシュ、再起動、メモリ圧迫、または過大なペイロードをデバッグしています
    - 記録またはリダクトされる診断データの内容を確認しています
summary: バグレポート用の共有可能な Gateway 診断バンドルを作成する
title: 診断エクスポート
x-i18n:
    generated_at: "2026-04-24T04:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw は、バグレポートに安全に添付できるローカル診断 zip を作成できます。
これは、サニタイズされた Gateway の状態、ヘルス、ログ、設定の形状、および
最近のペイロードなし安定性イベントをまとめたものです。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは、書き込まれた zip パスを表示します。パスを指定するには:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化向け:

```bash
openclaw gateway diagnostics export --json
```

## エクスポートに含まれるもの

zip には次が含まれます。

- `summary.md`: サポート向けの人間が読める概要
- `diagnostics.json`: 設定、ログ、状態、ヘルス、
  安定性データの機械可読サマリー
- `manifest.json`: エクスポートメタデータとファイル一覧
- サニタイズされた設定の形状と非シークレットな設定詳細
- サニタイズされたログサマリーと最近のリダクト済みログ行
- ベストエフォートの Gateway 状態およびヘルスのスナップショット
- `stability/latest.json`: 利用可能な場合、最新の永続化された安定性バンドル

このエクスポートは、Gateway が不健全な場合でも有用です。Gateway が
状態またはヘルス要求に応答できない場合でも、ローカルログ、設定の形状、最新の
安定性バンドルは、利用可能であれば収集されます。

## プライバシーモデル

診断データは共有可能になるよう設計されています。エクスポートには、デバッグに役立つ
運用データが保持されます。たとえば:

- サブシステム名、Plugin ID、プロバイダー ID、チャンネル ID、設定済みモード
- ステータスコード、所要時間、バイト数、キュー状態、メモリ測定値
- サニタイズ済みログメタデータとリダクト済み運用メッセージ
- 設定の形状と非シークレットな機能設定

エクスポートでは次が省略またはリダクトされます。

- チャットテキスト、プロンプト、指示、Webhook 本文、ツール出力
- 認証情報、API キー、トークン、Cookie、シークレット値
- 生のリクエストまたはレスポンス本文
- account ID、message ID、生の session ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストに見える場合、
エクスポートでは、そのメッセージが省略されたこととバイト数のみを保持します。

## Stability recorder

診断が有効な場合、Gateway はデフォルトで、制限付きのペイロードなし安定性ストリームを記録します。
これは内容ではなく、運用上の事実のためのものです。

ライブ recorder を確認する:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的終了、シャットダウンタイムアウト、
または再起動時の起動失敗後に、最新の永続化安定性バンドルを確認する:

```bash
openclaw gateway stability --bundle latest
```

最新の永続化バンドルから診断 zip を作成する:

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

- `--output <path>`: 特定の zip パスに書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 確認するログバイト数の上限。
- `--url <url>`: 状態およびヘルススナップショット用の Gateway WebSocket URL。
- `--token <token>`: 状態およびヘルススナップショット用の Gateway トークン。
- `--password <password>`: 状態およびヘルススナップショット用の Gateway パスワード。
- `--timeout <ms>`: 状態およびヘルススナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化された安定性バンドルの検索をスキップします。
- `--json`: 機械可読なエクスポートメタデータを出力します。

## 診断を無効にする

診断はデフォルトで有効です。stability recorder と
診断イベント収集を無効にするには:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効にすると、バグレポートの詳細は減ります。通常の
Gateway ログには影響しません。

## 関連ドキュメント

- [Health Checks](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway Protocol](/ja-JP/gateway/protocol#system-and-identity)
- [Logging](/ja-JP/logging)
