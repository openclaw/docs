---
read_when:
    - 実行中の Gateway のヘルス状態をすばやく確認したい
summary: '`openclaw health` の CLI リファレンス（RPC 経由の Gateway ヘルススナップショット）'
title: ヘルス
x-i18n:
    generated_at: "2026-05-06T09:03:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

実行中の Gateway からヘルス情報を取得します。

オプション:

- `--json`: 機械可読な出力
- `--timeout <ms>`: 接続タイムアウト（ミリ秒、デフォルトは `10000`）
- `--verbose`: 詳細ログ
- `--debug`: `--verbose` のエイリアス

例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

注記:

- デフォルトの `openclaw health` は、実行中の Gateway にヘルススナップショットを要求します。Gateway に
  すでに新しいキャッシュ済みスナップショットがある場合、そのキャッシュ済みペイロードを返し、
  バックグラウンドで更新できます。
- `--verbose` はライブプローブを強制し、Gateway 接続の詳細を出力し、設定済みのすべてのアカウントとエージェントにわたって
  人間が読める出力を展開します。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ヘルス](/ja-JP/gateway/health)
