---
read_when:
    - OpenClaw.app で PeekabooBridge をホストする
    - Swift Package Manager 経由で Peekaboo を統合する
    - PeekabooBridge のプロトコル/パスの変更
    - PeekabooBridge、Codex Computer Use、cua-driver MCP のどれを選ぶか
summary: macOS UI 自動化向け PeekabooBridge 統合
title: Peekaboo ブリッジ
x-i18n:
    generated_at: "2026-06-27T12:04:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw は、ローカルで権限を考慮する UI オートメーションブローカーとして **PeekabooBridge** をホストできます。これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用しながら UI オートメーションを駆動できます。

## これは何か（そして何ではないか）

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして動作できます。
- **クライアント**: `peekaboo` CLI を使用します（別個の `openclaw ui ...` サーフェスはありません）。
- **UI**: 視覚的なオーバーレイは Peekaboo.app 側に残ります。OpenClaw は薄いブローカーホストです。

## Computer Use との関係

OpenClaw には 3 つのデスクトップ制御パスがあり、それらは意図的に分離されています。

- **PeekabooBridge ホスト**: OpenClaw.app はローカルの PeekabooBridge ソケットをホストできます。
  `peekaboo` CLI は引き続きクライアントであり、スクリーンショット、クリック、メニュー、ダイアログ、Dock アクション、ウィンドウ管理などの Peekaboo オートメーションプリミティブに OpenClaw.app の macOS 権限を使用します。
- **Codex Computer Use**: バンドルされた `codex` Plugin は Codex アプリサーバーを準備し、Codex の `computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に Codex がネイティブのデスクトップ制御ツール呼び出しを所有できるようにします。OpenClaw はこれらのアクションを PeekabooBridge 経由でプロキシしません。
- **直接の `cua-driver` MCP**: OpenClaw は TryCua のアップストリーム `cua-driver mcp` サーバーを通常の MCP サーバーとして登録できます。これにより、Codex マーケットプレイスや PeekabooBridge ソケットを経由せずに、エージェントは CUA ドライバー独自のスキーマと pid/window/element-index ワークフローを利用できます。

広範な macOS オートメーションサーフェスと、OpenClaw.app の権限を考慮したブリッジホストが必要な場合は Peekaboo を使用します。Codex モードのエージェントが Codex のネイティブ computer-use Plugin に依存するべき場合は Codex Computer Use を使用します。CUA ドライバーを通常の MCP サーバーとして任意の OpenClaw 管理ランタイムに公開したい場合は、直接の `cua-driver mcp` を使用します。

## ブリッジを有効化する

macOS アプリで:

- 設定 → **Peekaboo Bridge を有効化**

有効にすると、OpenClaw はローカル UNIX ソケットサーバーを起動します。無効にすると、ホストは停止され、`peekaboo` は利用可能な他のホストへフォールバックします。

## クライアントの検出順序

Peekaboo クライアントは通常、次の順序でホストを試します。

1. Peekaboo.app（完全な UX）
2. Claude.app（インストール済みの場合）
3. OpenClaw.app（薄いブローカー）

どのホストがアクティブで、どのソケットパスが使用中かを確認するには、`peekaboo bridge status --verbose` を使用します。次のように上書きできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **呼び出し元のコード署名** を検証します。TeamID の許可リストが適用されます（Peekaboo ホスト TeamID + OpenClaw アプリ TeamID）。
- Accessibility には、汎用的な `node` ランタイムよりも署名済みのブリッジ/アプリ ID を優先してください。`node` に Accessibility を付与すると、その Node 実行ファイルによって起動された任意のパッケージが GUI オートメーションアクセスを継承できます。詳しくは [macOS 権限](/ja-JP/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes) を参照してください。
- リクエストは約 10 秒後にタイムアウトします。
- 必要な権限が不足している場合、ブリッジは System Settings を起動するのではなく、明確なエラーメッセージを返します。

## スナップショットの動作（オートメーション）

スナップショットはメモリに保存され、短い時間が経過すると自動的に期限切れになります。より長く保持する必要がある場合は、クライアントから再キャプチャしてください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合は、クライアントが適切に署名されていることを確認するか、**デバッグ** モードでのみ `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を指定してホストを実行してください。
- ホストが見つからない場合は、ホストアプリのいずれか（Peekaboo.app または OpenClaw.app）を開き、権限が付与されていることを確認してください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
