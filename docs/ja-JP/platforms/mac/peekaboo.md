---
read_when:
    - OpenClaw.app 内で PeekabooBridge をホストしている場合
    - Peekaboo を Swift Package Manager 経由で統合している場合
    - PeekabooBridge のプロトコル / パスを変更している場合
summary: macOS UI 自動化向け PeekabooBridge 統合
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-24T05:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw は、ローカルで権限を意識した UI 自動化ブローカーとして **PeekabooBridge** をホストできます。
これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用しながら
UI 自動化を実行できます。

## これは何で、何ではないか

- **Host**: OpenClaw.app は PeekabooBridge host として動作できます。
- **Client**: `peekaboo` CLI を使います（別の `openclaw ui ...` 面はありません）。
- **UI**: 視覚的オーバーレイは Peekaboo.app 側に残り、OpenClaw は薄いブローカーホストです。

## bridge を有効化する

macOS アプリ内で:

- Settings → **Enable Peekaboo Bridge**

有効にすると、OpenClaw はローカル UNIX ソケットサーバーを開始します。無効にすると host
は停止し、`peekaboo` は他の利用可能な host へフォールバックします。

## Client の検出順序

Peekaboo client は通常、次の順で host を試します:

1. Peekaboo.app（完全な UX）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（薄いブローカー）

どの host が有効で、どのソケットパスが使われているかを見るには `peekaboo bridge status --verbose` を使ってください。次で上書きもできます:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- bridge は **呼び出し元コード署名** を検証します。TeamID の許可リスト
  （Peekaboo host TeamID + OpenClaw app TeamID）が強制されます。
- リクエストは約 10 秒でタイムアウトします。
- 必要な権限が欠けている場合、bridge は System Settings を起動する代わりに
  明確なエラーメッセージを返します。

## スナップショット動作（自動化）

スナップショットはメモリ内に保存され、短時間で自動的に期限切れになります。
より長く保持したい場合は、client 側で再取得してください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合、client が
  正しく署名されていることを確認するか、**debug** モードでのみ
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を付けて host を実行してください。
- host が見つからない場合は、host アプリ（Peekaboo.app または OpenClaw.app）のどちらかを開き、
  権限が付与されていることを確認してください。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [macOS permissions](/ja-JP/platforms/mac/permissions)
