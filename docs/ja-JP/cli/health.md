---
read_when:
    - 実行中の Gateway の正常性をすばやく確認したい
summary: '`openclaw health` の CLI リファレンス (RPC 経由の Gateway ヘルススナップショット)'
title: ヘルス
x-i18n:
    generated_at: "2026-05-10T19:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

実行中の Gateway からヘルス情報を取得します。

## オプション

| フラグ             | デフォルト | 説明                                                        |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--json`         | `false` | テキストではなく機械可読な JSON を出力します。                       |
| `--timeout <ms>` | `10000` | ミリ秒単位の接続タイムアウトです。                                |
| `--verbose`      | `false` | 詳細ログを出力します。ライブプローブを強制し、エージェントごとの出力を展開します。 |
| `--debug`        | `false` | `--verbose` のエイリアスです。                                             |

例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

注記:

- デフォルトの `openclaw health` は、実行中の Gateway にヘルススナップショットを要求します。
  Gateway に新しいキャッシュ済みスナップショットがすでにある場合、そのキャッシュ済みペイロードを返し、
  バックグラウンドで更新できます。
- `--verbose` はライブプローブを強制し、Gateway の接続詳細を出力し、設定済みの
  すべてのアカウントとエージェントにわたって人間が読める出力を展開します。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ヘルス](/ja-JP/gateway/health)
