---
read_when:
    - 実行中のGatewayの正常性をすばやく確認したい
summary: '`openclaw health` の CLI リファレンス（RPC 経由の Gateway ヘルススナップショット）'
title: ヘルス
x-i18n:
    generated_at: "2026-07-05T11:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

実行中の Gateway から WebSocket RPC 経由でヘルススナップショットを取得します（CLI から直接チャネルソケットには接続しません）。

## オプション

| フラグ           | デフォルト | 説明                                                                 |
| ---------------- | ---------- | -------------------------------------------------------------------- |
| `--json`         | `false`    | テキストではなく、機械可読な JSON を出力します。                     |
| `--timeout <ms>` | `10000`    | 接続タイムアウト（ミリ秒）。                                         |
| `--verbose`      | `false`    | ライブプローブを強制し、設定済みのすべてのアカウントとエージェントにわたって出力を展開します。 |
| `--debug`        | `false`    | `--verbose` のエイリアス。                                           |

例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## 動作

- `--verbose` なしの場合、Gateway はキャッシュ済みスナップショット（最大 60 秒間新鮮で、ライブチャネルランタイム状態から変更されていないもの）を返し、次の呼び出し元のためにバックグラウンドで更新できます。
- `--verbose` はライブプローブ（チャネルごとのアカウントプローブ）を強制し、Gateway 接続の詳細を出力し、既定のエージェントだけでなく設定済みのすべてのアカウントとエージェントにわたって人間が読める出力を展開します。
- `--json` は常に完全なスナップショットを返します: チャネル、アカウントごとのプローブ、Plugin 読み込み状態、コンテキストエンジンの隔離状態、モデル価格キャッシュ状態、イベントループのヘルス、エージェントごとのセッションストア。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [`openclaw status`](/ja-JP/cli/status) — 完全なヘルススナップショットなしのローカル診断とチャネルプローブ
- [Gateway ヘルス](/ja-JP/gateway/health)
