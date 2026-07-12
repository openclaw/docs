---
read_when:
    - 実行中の Gateway の正常性をすばやく確認したい場合
summary: '`openclaw health` の CLI リファレンス（RPC 経由の Gateway ヘルススナップショット）'
title: ヘルス
x-i18n:
    generated_at: "2026-07-11T22:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

実行中の Gateway から WebSocket RPC 経由でヘルススナップショットを取得します（CLI からチャネルソケットへ直接接続しません）。

## オプション

| フラグ           | デフォルト | 説明                                                                                 |
| ---------------- | ---------- | ------------------------------------------------------------------------------------ |
| `--json`         | `false`    | テキストの代わりに機械可読な JSON を出力します。                                     |
| `--timeout <ms>` | `10000`    | 接続タイムアウト（ミリ秒）。                                                         |
| `--verbose`      | `false`    | ライブプローブを強制し、設定済みのすべてのアカウントとエージェントに出力を展開します。 |
| `--debug`        | `false`    | `--verbose` のエイリアスです。                                                       |

例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## 動作

- `--verbose` を指定しない場合、Gateway はキャッシュされたスナップショット（最大 60 秒間有効で、ライブチャネルのランタイム状態と同一）を返し、次の呼び出し元のためにバックグラウンドで更新できます。
- `--verbose` はライブプローブ（チャネルごとのアカウントプローブ）を強制し、Gateway の接続詳細を出力します。また、人間が読みやすい形式の出力を、デフォルトのエージェントだけでなく、設定済みのすべてのアカウントとエージェントに展開します。
- `--json` は常に完全なスナップショットを返します。これには、チャネル、アカウントごとのプローブ、Plugin の読み込み状態、コンテキストエンジンの隔離状態、モデル料金キャッシュの状態、イベントループの健全性、エージェントごとのセッションストアが含まれます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [`openclaw status`](/ja-JP/cli/status) — 完全なヘルススナップショットを使用しないローカル診断とチャネルプローブ
- [Gateway のヘルス](/ja-JP/gateway/health)
