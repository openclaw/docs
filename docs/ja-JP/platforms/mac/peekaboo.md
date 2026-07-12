---
read_when:
    - OpenClaw.app で PeekabooBridge をホストする
    - Swift Package Manager を介した Peekaboo の統合
    - PeekabooBridge のプロトコル/パスの変更
    - PeekabooBridge、Codex Computer Use、cua-driver MCP の選択
summary: macOS UI 自動化向け PeekabooBridge 統合
title: Peekaboo ブリッジ
x-i18n:
    generated_at: "2026-07-11T22:23:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw は、ローカルで権限を認識する UI 自動化ブローカーとして **PeekabooBridge** をホストできます（`PeekabooBridgeHostCoordinator`。内部では `steipete/Peekaboo` Swift パッケージを使用）。これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用して UI 自動化を実行できます。

## これは何か（そして何ではないか）

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして動作できます。
- **クライアント**: `peekaboo` CLI（独立した `openclaw ui ...` インターフェースはありません）。
- **UI**: 視覚的なオーバーレイは Peekaboo.app 側に留まり、OpenClaw は軽量なブローカーホストとして機能します。

## 他のデスクトップ制御経路との関係

OpenClaw には、意図的に分離された 4 つのデスクトップ制御経路があります。

- **PeekabooBridge ホスト**: OpenClaw.app がローカルの PeekabooBridge ソケットをホストします。`peekaboo` CLI がクライアントとなり、スクリーンショット、クリック、メニュー、ダイアログ、Dock 操作、ウィンドウ管理に OpenClaw.app の macOS 権限を使用します。
- **エージェント駆動のコンピューター操作（`computer.act`）**: Gateway エージェントの組み込み `computer` ツールは、`screen.snapshot` でスクリーンショットを取得し、危険な `computer.act` Node コマンドを介してポインターとキーボードを操作します。macOS Node は、PeekabooBridge ソケットや `peekaboo` CLI を経由せず、このブリッジが公開する組み込みの Peekaboo 自動化サービスと限定的な CoreGraphics プリミティブを使用して、プロセス内で `computer.act` を実行します。[コンピューター操作](/nodes/computer-use)を参照してください。
- **Codex コンピューター操作**: 同梱の `codex` Plugin は、Codex の `computer-use` MCP Plugin（`extensions/codex/src/app-server/computer-use.ts`）を確認し、インストールできます。その後、Codex モードのターン中は、Codex がネイティブのデスクトップ制御ツール呼び出しを担当します。OpenClaw はこれらの操作を PeekabooBridge 経由でプロキシしません。
- **直接接続の `cua-driver` MCP**: OpenClaw は、TryCua のアップストリーム `cua-driver mcp` サーバーを通常の MCP サーバーとして登録できます。これにより、Codex マーケットプレイスや PeekabooBridge ソケットを経由せずに、CUA ドライバー独自のスキーマと pid／ウィンドウ／要素インデックスのワークフローをエージェントに提供します。

OpenClaw.app の権限認識型ブリッジホストを介して、幅広い macOS 自動化機能を利用する場合は Peekaboo を使用します。任意のビジョンモデルから操作できる統一された `computer.act` Node コマンドを通じて、Gateway エージェントにデスクトップを認識・操作させる場合は、エージェント駆動のコンピューター操作を使用します。Codex モードのエージェントに Codex のネイティブ Plugin を利用させる場合は、Codex コンピューター操作を使用します。CUA ドライバーを通常の MCP サーバーとして OpenClaw 管理下の任意のランタイムに公開する場合は、直接接続の `cua-driver mcp` を使用します。

## ブリッジを有効にする

macOS アプリで **Settings -> Enable Peekaboo Bridge** を選択します。

有効にすると、OpenClaw は `~/Library/Application Support/OpenClaw/<socket-name>` でローカル UNIX ソケットサーバーを起動します。無効にするとホストは停止し、`peekaboo` は利用可能な他のホストにフォールバックします。コーディネーターは、古い `peekaboo` インストール向けに、現在のソケットを指す従来のソケットシンボリックリンク（Application Support 配下の `clawdbot`、`clawdis`、`moltbot`）も維持します。

## クライアントの検出順序

Peekaboo クライアントは通常、次の順序でホストを試します。

1. Peekaboo.app（完全な UX）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（軽量ブローカー）

アクティブなホストと使用中のソケットパスを確認するには、`peekaboo bridge status --verbose` を使用します。上書きするには、次を設定します。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは**呼び出し元のコード署名**を検証します。TeamID の許可リスト（Peekaboo ホストの TeamID と実行中アプリ自身の TeamID）が適用されます。
- アクセシビリティでは、汎用的な `node` ランタイムよりも、署名済みのブリッジ／アプリ ID を優先してください。`node` にアクセシビリティ権限を付与すると、その Node 実行ファイルから起動されたすべてのパッケージが GUI 自動化アクセスを継承できます。[macOS の権限](/ja-JP/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)を参照してください。
- リクエストは 10 秒後にタイムアウトします（`requestTimeoutSec: 10`）。
- 必要な権限がない場合、ブリッジは System Settings を起動する代わりに、明確なエラーメッセージを返します。

## スナップショットの動作（自動化）

スナップショットは、有効期間 10 分、上限 50 件でメモリ内に保存されます（`InMemorySnapshotManager`）。クリーンアップ時に成果物は削除されません。より長く保持する必要がある場合は、クライアントから再取得してください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合は、クライアントが適切に署名されていることを確認するか、**デバッグ**モードに限り `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を設定してホストを実行してください。
- ホストが見つからない場合は、いずれかのホストアプリ（Peekaboo.app または OpenClaw.app）を開き、権限が付与されていることを確認してください。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS の権限](/ja-JP/platforms/mac/permissions)
