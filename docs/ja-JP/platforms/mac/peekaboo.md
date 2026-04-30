---
read_when:
    - OpenClaw.app で PeekabooBridge をホストする
    - Swift Package Manager による Peekaboo の統合
    - PeekabooBridge のプロトコル/パスの変更
    - PeekabooBridge、Codex Computer Use、cua-driver MCP のどれを選ぶか
summary: macOS UI自動化向けPeekabooBridge統合
title: ピーカブーブリッジ
x-i18n:
    generated_at: "2026-04-30T05:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw は **PeekabooBridge** をローカルの権限対応 UI 自動化ブローカーとしてホストできます。これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用しながら UI 自動化を実行できます。

## これは何か（そして何ではないか）

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして動作できます。
- **クライアント**: `peekaboo` CLI を使用します（別個の `openclaw ui ...` サーフェスはありません）。
- **UI**: ビジュアルオーバーレイは Peekaboo.app に残ります。OpenClaw は薄いブローカーホストです。

## Computer Use との関係

OpenClaw には 3 つのデスクトップ制御パスがあり、それらは意図的に分離されています。

- **PeekabooBridge ホスト**: OpenClaw.app はローカルの PeekabooBridge ソケットをホストできます。
  `peekaboo` CLI はクライアントのままで、スクリーンショット、クリック、メニュー、ダイアログ、Dock 操作、ウィンドウ管理などの Peekaboo 自動化プリミティブに OpenClaw.app の macOS 権限を使用します。
- **Codex Computer Use**: バンドルされた `codex` Plugin は Codex アプリサーバーを準備し、Codex の `computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に Codex がネイティブのデスクトップ制御ツール呼び出しを所有できるようにします。OpenClaw はそれらのアクションを PeekabooBridge 経由でプロキシしません。
- **直接 `cua-driver` MCP**: OpenClaw は TryCua の upstream `cua-driver mcp` サーバーを通常の MCP サーバーとして登録できます。これにより、Codex マーケットプレイスや PeekabooBridge ソケットを経由せずに、CUA ドライバー自身のスキーマと pid/window/element-index ワークフローをエージェントに提供できます。

幅広い macOS 自動化サーフェスと OpenClaw.app の権限対応ブリッジホストが必要な場合は Peekaboo を使用します。Codex モードのエージェントが Codex のネイティブ computer-use Plugin に依存するべき場合は Codex Computer Use を使用します。通常の MCP サーバーとして任意の OpenClaw 管理ランタイムに CUA ドライバーを公開したい場合は、直接 `cua-driver mcp` を使用します。

## ブリッジを有効にする

macOS アプリで:

- Settings → **Enable Peekaboo Bridge**

有効にすると、OpenClaw はローカル UNIX ソケットサーバーを起動します。無効にすると、ホストは停止され、`peekaboo` は他の利用可能なホストへフォールバックします。

## クライアントの検出順序

Peekaboo クライアントは通常、次の順序でホストを試します。

1. Peekaboo.app（完全な UX）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（薄いブローカー）

どのホストがアクティブで、どのソケットパスが使用されているかを確認するには、`peekaboo bridge status --verbose` を使用します。次で上書きできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **呼び出し元のコード署名** を検証します。TeamID の許可リストが適用されます（Peekaboo ホスト TeamID + OpenClaw アプリ TeamID）。
- リクエストは約 10 秒後にタイムアウトします。
- 必要な権限がない場合、ブリッジはシステム設定を起動するのではなく、明確なエラーメッセージを返します。

## スナップショットの動作（自動化）

スナップショットはメモリに保存され、短い期間が過ぎると自動的に期限切れになります。より長い保持が必要な場合は、クライアントから再キャプチャしてください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合は、クライアントが適切に署名されていることを確認するか、**debug** モードの場合のみ `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` でホストを実行してください。
- ホストが見つからない場合は、ホストアプリのいずれか（Peekaboo.app または OpenClaw.app）を開き、権限が付与されていることを確認してください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
