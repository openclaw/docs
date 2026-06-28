---
read_when:
    - IPC コントラクトまたはメニューバーアプリ IPC の編集
summary: OpenClaw アプリ、Gateway ノードトランスポート、PeekabooBridge 向けの macOS IPC アーキテクチャ
title: macOS の IPC
x-i18n:
    generated_at: "2026-06-28T00:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPCアーキテクチャ

**現在のモデル:** ローカルUnixソケットが、exec承認 + `system.run` のために **nodeホストサービス** を **macOSアプリ** に接続します。検出/接続チェック用に `openclaw-mac` デバッグCLIがあります。エージェントアクションは引き続き Gateway WebSocket と `node.invoke` を通じて流れます。UI自動化には PeekabooBridge を使用します。

## 目標

- TCCに関わるすべての作業（通知、画面収録、マイク、音声、AppleScript）を所有する単一のGUIアプリインスタンス。
- 自動化のための小さなサーフェス: Gateway + nodeコマンド、およびUI自動化用の PeekabooBridge。
- 予測可能な権限: 常に同じ署名済みバンドルIDを使い、launchdによって起動されるため、TCC許可が維持されます。

## 仕組み

### Gateway + nodeトランスポート

- アプリは Gateway（ローカルモード）を実行し、nodeとして接続します。
- エージェントアクションは `node.invoke`（例: `system.run`, `system.notify`, `canvas.*`）経由で実行されます。
- 一般的なMac nodeコマンドには、`canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run`, `system.notify` があります。
- nodeは `permissions` マップを報告するため、エージェントは画面、
  カメラ、マイク、音声、自動化、またはアクセシビリティアクセスが利用可能かどうかを確認できます。

### Nodeサービス + アプリIPC

- ヘッドレスnodeホストサービスが Gateway WebSocket に接続します。
- `system.run` リクエストは、ローカルUnixソケット経由でmacOSアプリに転送されます。
- アプリはUIコンテキストでexecを実行し、必要に応じてプロンプトを表示し、出力を返します。

図 (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI自動化）

- UI自動化は、`bridge.sock` という名前の別のUNIXソケットと PeekabooBridge JSONプロトコルを使用します。
- ホスト優先順（クライアント側）: Peekaboo.app → Claude.app → OpenClaw.app → ローカル実行。
- セキュリティ: bridgeホストには許可されたTeamIDが必要です。DEBUG専用の同一UIDエスケープハッチは `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（Peekabooの慣例）で保護されています。
- 詳細は [PeekabooBridge の使用方法](/ja-JP/platforms/mac/peekaboo) を参照してください。

## 運用フロー

- 再起動/再ビルド: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 既存インスタンスを終了します
  - Swiftビルド + パッケージ
  - LaunchAgentを書き込み/ブートストラップ/kickstartします
- 単一インスタンス: 同じバンドルIDを持つ別のインスタンスが実行中の場合、アプリは早期に終了します。

## ハードニングメモ

- すべての特権サーフェスでTeamIDの一致を必須にすることを推奨します。
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（DEBUG専用）は、ローカル開発で同一UIDの呼び出し元を許可する場合があります。
- すべての通信はローカル専用のままです。ネットワークソケットは公開されません。
- TCCプロンプトはGUIアプリバンドルからのみ発生します。再ビルド間で署名済みバンドルIDを安定させてください。
- IPCハードニング: ソケットモード `0600`、トークン、peer-UIDチェック、HMACチャレンジ/レスポンス、短いTTL。

## 関連

- [macOSアプリ](/ja-JP/platforms/macos)
- [macOS IPCフロー（Exec承認）](/ja-JP/tools/exec-approvals-advanced#macos-ipc-flow)
