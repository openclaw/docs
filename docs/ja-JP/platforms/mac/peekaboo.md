---
read_when:
    - OpenClaw.app で PeekabooBridge をホスティングする
    - Swift Package Manager を介した Peekaboo の統合
    - PeekabooBridge のプロトコル/パスの変更
    - PeekabooBridge、Codex Computer Use、cua-driver MCP の使い分け
summary: macOS UI 自動化向け PeekabooBridge 統合
title: Peekaboo ブリッジ
x-i18n:
    generated_at: "2026-07-05T11:35:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54749a292f92d6b9fe88a0efb1f263b3a5576a600588324d7da53a4cd24f12cd
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw は、ローカルで権限を考慮した UI オートメーションブローカーとして **PeekabooBridge** をホストできます（`PeekabooBridgeHostCoordinator`、`steipete/Peekaboo` Swift パッケージにより提供）。これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用しながら UI オートメーションを実行できます。

## これは何か（そして何ではないか）

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして動作できます。
- **クライアント**: `peekaboo` CLI（独立した `openclaw ui ...` サーフェスはありません）。
- **UI**: ビジュアルオーバーレイは Peekaboo.app 側に残ります。OpenClaw は薄いブローカーホストです。

## 他のデスクトップ制御経路との関係

OpenClaw には、意図的に分離された 3 つのデスクトップ制御経路があります。

- **PeekabooBridge ホスト**: OpenClaw.app がローカル PeekabooBridge ソケットをホストします。`peekaboo` CLI がクライアントとなり、スクリーンショット、クリック、メニュー、ダイアログ、Dock アクション、ウィンドウ管理に OpenClaw.app の macOS 権限を使用します。
- **Codex Computer Use**: バンドルされた `codex` Plugin は、Codex の `computer-use` MCP Plugin（`extensions/codex/src/app-server/computer-use.ts`）を確認し、インストールできます。その後、Codex モードのターン中にネイティブなデスクトップ制御ツール呼び出しを Codex に所有させます。OpenClaw はこれらのアクションを PeekabooBridge 経由でプロキシしません。
- **直接の `cua-driver` MCP**: OpenClaw は TryCua の上流 `cua-driver mcp` サーバーを通常の MCP サーバーとして登録でき、Codex マーケットプレイスや PeekabooBridge ソケットを経由せずに、CUA ドライバー独自のスキーマと pid/window/element-index ワークフローをエージェントに提供します。

OpenClaw.app の権限を考慮したブリッジホスト経由で、広範な macOS オートメーションサーフェスを使う場合は Peekaboo を使用します。Codex モードのエージェントが Codex のネイティブ Plugin に依存する必要がある場合は Codex Computer Use を使用します。任意の OpenClaw 管理ランタイムに通常の MCP サーバーとして CUA ドライバーを公開するには、直接の `cua-driver mcp` を使用します。

## ブリッジを有効化する

macOS アプリで: **Settings -> Enable Peekaboo Bridge**。

有効にすると、OpenClaw は `~/Library/Application Support/OpenClaw/<socket-name>` にローカル UNIX ソケットサーバーを起動します。無効にすると、ホストは停止し、`peekaboo` は他の利用可能なホストにフォールバックします。コーディネーターは、古い `peekaboo` インストール向けに、現在のソケットを指すレガシーソケットシンボリックリンク（Application Support 配下の `clawdbot`、`clawdis`、`moltbot`）も維持します。

## クライアント検出順序

Peekaboo クライアントは通常、次の順序でホストを試します。

1. Peekaboo.app（完全な UX）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（薄いブローカー）

どのホストがアクティブで、どのソケットパスが使用されているかを確認するには、`peekaboo bridge status --verbose` を使用します。次で上書きできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **呼び出し元のコード署名** を検証します。TeamID の許可リストが適用されます（Peekaboo ホストの TeamID と、実行中アプリ自身の TeamID）。
- Accessibility には、汎用の `node` ランタイムよりも署名済みのブリッジ/アプリ ID を優先してください。`node` に Accessibility を付与すると、その Node 実行ファイルから起動された任意のパッケージが GUI オートメーションアクセスを継承できます。詳しくは [macOS 権限](/ja-JP/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes) を参照してください。
- リクエストは 10 秒後にタイムアウトします（`requestTimeoutSec: 10`）。
- 必要な権限が不足している場合、ブリッジは System Settings を起動するのではなく、明確なエラーメッセージを返します。

## スナップショットの動作（オートメーション）

スナップショットはメモリ内に保存され、有効期間は 10 分、上限は 50 スナップショットです（`InMemorySnapshotManager`）。アーティファクトはクリーンアップ時に削除されません。より長い保持が必要な場合は、クライアントから再キャプチャしてください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合は、クライアントが適切に署名されていることを確認するか、**debug** モードでのみ `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を指定してホストを実行してください。
- ホストが見つからない場合は、ホストアプリのいずれか（Peekaboo.app または OpenClaw.app）を開き、権限が付与されていることを確認してください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
