---
read_when:
    - IPC コントラクトまたはメニューバーアプリの IPC の編集
summary: OpenClawアプリ、Gateway Nodeトランスポート、PeekabooBridge向けのmacOS IPCアーキテクチャ
title: macOS IPC
x-i18n:
    generated_at: "2026-07-12T14:39:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC アーキテクチャ

ローカル Unix ソケットは、実行承認と `system.run` のために Node ホストサービスを macOS アプリへ接続します。検出および接続チェック用に `openclaw-mac` デバッグ CLI（`apps/macos/Sources/OpenClawMacCLI`）が存在しますが、エージェントのアクションは引き続き Gateway WebSocket と `node.invoke` を経由します。Node を基盤とする `computer.act` パスは、組み込みの Peekaboo オートメーションをプロセス内で実行します。スタンドアロンの Peekaboo クライアントは PeekabooBridge を使用します。

## 目標

- 通知、画面収録、マイク、音声、AppleScript など、TCC に関わるすべての処理を担う単一の GUI アプリインスタンス。
- オートメーション用の小さなサーフェス：Gateway と Node コマンド、プロセス内の `computer.act`、およびスタンドアロン UI オートメーションクライアント向けの PeekabooBridge。
- 予測可能な権限：常に同じ署名済みバンドル ID を使用し、launchd によって起動することで、TCC の許可を維持します。

## 仕組み

### Gateway と Node のトランスポート

- アプリは Gateway（ローカルモード）を実行し、Node として接続します。
- エージェントのアクションは `node.invoke`（例：`system.run`、`system.notify`、`canvas.*`）を介して実行されます。
- Node コマンドには、`canvas.*`、`camera.snap`、`camera.clip`、`screen.snapshot`、`screen.record`、`computer.act`、`system.run`、`system.notify` が含まれます。
- Node は `permissions` マップを報告するため、エージェントは画面、カメラ、マイク、音声、オートメーション、アクセシビリティへのアクセスが利用可能かどうかを確認できます。

### Node サービスとアプリの IPC

- ヘッドレス Node ホストサービスが Gateway WebSocket に接続します。
- `system.run` リクエストは、ローカル Unix ソケット（`ExecApprovalsSocket.swift`）を介して macOS アプリへ転送されます。
- アプリは UI コンテキストでコマンドを実行し、必要に応じて確認を求め、出力を返します。

図（SCI）：

```text
エージェント -> Gateway -> Node サービス（WS）
                            |  IPC（UDS + トークン + HMAC + TTL）
                            v
                        Mac アプリ（UI + TCC + system.run）
```

### PeekabooBridge（UI オートメーション）

- 組み込みのエージェント `computer` ツールは、このソケットを使用**しません**。ペアリングされた macOS Node が、組み込みの Peekaboo サービスを使用してアプリプロセス内で `computer.act` を実行します。
- UI オートメーションは、別の UNIX ソケット（`~/Library/Application Support/OpenClaw/<socket>`）と PeekabooBridge JSON プロトコルを使用します。
- ホストの優先順位（クライアント側）：Peekaboo.app -> Claude.app -> OpenClaw.app -> ローカル実行。
- セキュリティ：ブリッジホストには許可リストに登録された TeamID が必要です（同梱の `PeekabooBridgeHostCoordinator` は、固定のチームとアプリ自身の署名チームを許可リストに登録します）。DEBUG 限定の同一 UID 向け回避手段は、`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（Peekaboo の規約）によって保護されています。
- 詳細については、[PeekabooBridge の使用方法](/ja-JP/platforms/mac/peekaboo)を参照してください。

## 運用フロー

- 再起動／再ビルド：`scripts/restart-mac.sh` は既存のインスタンスを終了し、Swift で再ビルドして再パッケージ化した後、再起動します。利用可能な署名 ID を自動検出し、見つからない場合は `--no-sign` にフォールバックします。署名を必須にするには `--sign` を渡します（利用可能なキーがない場合は失敗します）。未署名パスを強制するには `--no-sign` を渡します。署名パスでは環境に設定された `SIGN_IDENTITY` が解除されるため、`scripts/codesign-mac-app.sh` 独自の ID 自動検出によって証明書が選択されます。
- 単一インスタンス：アプリは `NSWorkspace.runningApplications` で重複するバンドル ID を確認し、複数のインスタンスが見つかった場合は終了します（`MenuBar.swift` の `isDuplicateInstance()`）。

## セキュリティ強化に関する注意事項

- すべての特権サーフェスで TeamID の一致を必須にすることを推奨します。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（DEBUG 限定）により、ローカル開発では同一 UID の呼び出し元を許可できる場合があります。
- すべての通信はローカル内に限定され、ネットワークソケットは公開されません。
- TCC プロンプトは GUI アプリバンドルからのみ発生します。再ビルド後も署名済みバンドル ID を安定して維持してください。
- 実行承認ソケットのセキュリティ強化：ファイルモード `0600`、共有トークン、ピア UID チェック（`getpeereid`）、HMAC-SHA256 チャレンジレスポンス、およびリクエストの短い TTL。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS IPC フロー（実行承認）](/ja-JP/tools/exec-approvals-advanced#macos-ipc-flow)
