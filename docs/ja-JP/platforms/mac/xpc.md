---
read_when:
    - IPC 契約またはメニューバーアプリ IPC を編集している場合
summary: OpenClaw アプリ、gateway node トランスポート、および PeekabooBridge 向け macOS IPC アーキテクチャ
title: macOS IPC
x-i18n:
    generated_at: "2026-04-24T05:09:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS IPC アーキテクチャ

**現在のモデル:** ローカル Unix ソケットで **node host service** と **macOS app** を接続し、exec 承認と `system.run` を処理します。検出 / 接続確認用に `openclaw-mac` デバッグ CLI が存在します。エージェントのアクション自体は、引き続き Gateway WebSocket と `node.invoke` を通って流れます。UI 自動化には PeekabooBridge を使います。

## 目標

- すべての TCC 対応作業（通知、画面収録、マイク、音声、AppleScript）を所有する単一 GUI アプリインスタンス。
- 自動化向けの小さな surface: Gateway + node コマンド、および UI 自動化用 PeekabooBridge。
- 予測可能な権限: 常に同じ署名済み bundle ID を使い、launchd から起動することで、TCC 付与が維持される。

## 仕組み

### Gateway + node トランスポート

- アプリは Gateway（ローカルモード）を実行し、node としてそれに接続します。
- エージェントアクションは `node.invoke`（例: `system.run`, `system.notify`, `canvas.*`）経由で実行されます。

### Node service + app IPC

- headless node host service が Gateway WebSocket に接続します。
- `system.run` リクエストは、ローカル Unix ソケット経由で macOS app に転送されます。
- アプリは UI コンテキストで exec を実行し、必要ならプロンプトを出し、出力を返します。

図（SCI）:

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自動化）

- UI 自動化は、`bridge.sock` という別の UNIX ソケットと PeekabooBridge JSON プロトコルを使います。
- Host 優先順序（client 側）: Peekaboo.app → Claude.app → OpenClaw.app → ローカル実行。
- セキュリティ: bridge host には許可された TeamID が必要です。DEBUG 専用の same-UID エスケープハッチは `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` でガードされます（Peekaboo の慣例）。
- 詳細は [PeekabooBridge usage](/ja-JP/platforms/mac/peekaboo) を参照してください。

## 運用フロー

- 再起動 / 再ビルド: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 既存インスタンスを kill
  - Swift build + package
  - LaunchAgent を書き込み / bootstrap / kickstart
- 単一インスタンス: 同じ bundle ID を持つ別インスタンスがすでに実行中なら、アプリは早期終了します。

## ハードニングに関する注記

- すべての特権 surface で TeamID 一致を要求することを推奨します。
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（DEBUG 専用）は、ローカル開発用に same-UID 呼び出し元を許可する場合があります。
- すべての通信はローカル専用のままです。ネットワークソケットは公開されません。
- TCC プロンプトは GUI app bundle からのみ発生します。再ビルド間で署名済み bundle ID を安定させてください。
- IPC ハードニング: ソケットモード `0600`、token、peer-UID チェック、HMAC challenge/response、短い TTL。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [macOS IPC flow (Exec approvals)](/ja-JP/tools/exec-approvals-advanced#macos-ipc-flow)
