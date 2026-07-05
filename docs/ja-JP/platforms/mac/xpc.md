---
read_when:
    - IPC コントラクトまたはメニューバーアプリ IPC の編集
summary: OpenClaw アプリ、Gateway ノードトランスポート、PeekabooBridge の macOS IPC アーキテクチャ
title: macOS IPC
x-i18n:
    generated_at: "2026-07-05T11:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0216deb436632a8bc83ccd9b750b6be4e53e317fbd72af035bc152c6a8be504a
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC アーキテクチャ

ローカル Unix ソケットが、exec 承認と `system.run` のために node ホストサービスを macOS アプリに接続します。検出/接続チェック用に `openclaw-mac` デバッグ CLI (`apps/macos/Sources/OpenClawMacCLI`) が存在しますが、エージェントのアクションは引き続き Gateway WebSocket と `node.invoke` を通じて流れます。UI 自動化は PeekabooBridge を使用します。

## 目標

- TCC に関わるすべての処理（通知、画面収録、マイク、音声、AppleScript）を所有する単一の GUI アプリインスタンス。
- 自動化用の小さなサーフェス: Gateway + node コマンド、および UI 自動化用の PeekabooBridge。
- 予測可能な権限: 常に同じ署名済み bundle ID を使用し、launchd によって起動されるため、TCC 許可が維持されます。

## 仕組み

### Gateway + node トランスポート

- アプリは Gateway（ローカルモード）を実行し、node として接続します。
- エージェントのアクションは `node.invoke`（例: `system.run`, `system.notify`, `canvas.*`）経由で実行されます。
- Node コマンドには `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `system.run`, `system.notify` が含まれます。
- node は `permissions` マップを報告するため、エージェントは画面、カメラ、マイク、音声、オートメーション、アクセシビリティへのアクセスが利用可能かどうかを確認できます。

### Node サービス + アプリ IPC

- ヘッドレス node ホストサービスが Gateway WebSocket に接続します。
- `system.run` リクエストは、ローカル Unix ソケット（`ExecApprovalsSocket.swift`）経由で macOS アプリに転送されます。
- アプリは UI コンテキストで exec を実行し、必要に応じてプロンプトを表示し、出力を返します。

図（SCI）:

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自動化）

- UI 自動化は別の UNIX ソケット（`~/Library/Application Support/OpenClaw/<socket>`）と PeekabooBridge JSON プロトコルを使用します。
- ホスト優先順位（クライアント側）: Peekaboo.app -> Claude.app -> OpenClaw.app -> ローカル実行。
- セキュリティ: ブリッジホストは許可リストに含まれる TeamID を要求します（バンドルされた `PeekabooBridgeHostCoordinator` は固定チームとアプリ自身の署名チームを許可リストに入れます）。DEBUG 限定の同一 UID 逃げ道は `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（Peekaboo の慣例）で保護されています。
- 詳細は [PeekabooBridge の使用方法](/ja-JP/platforms/mac/peekaboo) を参照してください。

## 運用フロー

- 再起動/再ビルド: `scripts/restart-mac.sh` は既存インスタンスを終了し、Swift で再ビルドし、再パッケージ化して再起動します。利用可能な署名 ID を自動検出し、見つからない場合は `--no-sign` にフォールバックします。署名を必須にするには `--sign` を渡します（キーが利用できない場合は失敗します）。未署名パスを強制するには `--no-sign` を渡します。環境で設定された `SIGN_IDENTITY` は署名済みパスでは解除されるため、`scripts/codesign-mac-app.sh` 独自の ID 自動検出が証明書を選択します。
- 単一インスタンス: アプリは `NSWorkspace.runningApplications` で重複する bundle ID を確認し、複数のインスタンスが見つかった場合は終了します（`MenuBar.swift` の `isDuplicateInstance()`）。

## ハードニングメモ

- すべての特権サーフェスで TeamID 一致を要求することを推奨します。
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（DEBUG 限定）は、ローカル開発で同一 UID の呼び出し元を許可する場合があります。
- すべての通信はローカル限定のままです。ネットワークソケットは公開されません。
- TCC プロンプトは GUI アプリバンドルからのみ発生します。再ビルド間で署名済み bundle ID を安定させてください。
- Exec 承認ソケットのハードニング: ファイルモード `0600`、共有トークン、peer-UID チェック（`getpeereid`）、HMAC-SHA256 チャレンジ/レスポンス、リクエストの短い TTL。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS IPC フロー（Exec 承認）](/ja-JP/tools/exec-approvals-advanced#macos-ipc-flow)
