---
read_when:
    - 実行中のGatewayのヘルスをすばやく確認したい場合
summary: RPC経由の`openclaw health`のCLIリファレンス（Gatewayヘルススナップショット）
title: ヘルス
x-i18n:
    generated_at: "2026-04-24T04:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

実行中のGatewayからヘルス情報を取得します。

オプション:

- `--json`: 機械可読な出力
- `--timeout <ms>`: 接続タイムアウト（ミリ秒、デフォルト`10000`）
- `--verbose`: 詳細ログ
- `--debug`: `--verbose`のエイリアス

例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

注意:

- デフォルトの`openclaw health`は、実行中のgatewayにヘルススナップショットを問い合わせます。gatewayにすでに新しいキャッシュ済みスナップショットがある場合、そのキャッシュ済みペイロードを返しつつ、バックグラウンドで更新することがあります。
- `--verbose`はライブプローブを強制し、gateway接続の詳細を表示し、人間向け出力を設定済みのすべてのアカウントとエージェントにわたって展開します。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。

## 関連

- [CLI reference](/ja-JP/cli)
- [Gateway health](/ja-JP/gateway/health)
