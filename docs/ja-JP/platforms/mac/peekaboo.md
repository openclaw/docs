---
read_when:
    - OpenClaw.appでPeekabooBridgeをホストする
    - Swift Package Manager 経由で Peekaboo を統合する
    - PeekabooBridge のプロトコル/パスの変更
    - PeekabooBridge、Codex Computer Use、cua-driver MCP のどれを選ぶか
summary: macOS UI自動化向けのPeekabooBridge統合
title: Peekaboo ブリッジ
x-i18n:
    generated_at: "2026-05-06T09:07:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw は、ローカルで権限を考慮する UI 自動化ブローカーとして **PeekabooBridge** をホストできます。これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用しながら UI 自動化を駆動できます。

## これは何か（そして何ではないか）

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして動作できます。
- **クライアント**: `peekaboo` CLI を使用します（別個の `openclaw ui ...` サーフェスはありません）。
- **UI**: 視覚オーバーレイは Peekaboo.app に残ります。OpenClaw は薄いブローカーホストです。

## Computer Use との関係

OpenClaw には 3 つのデスクトップ制御パスがあり、これらは意図的に分離されています。

- **PeekabooBridge ホスト**: OpenClaw.app はローカル PeekabooBridge ソケットをホストできます。`peekaboo` CLI はクライアントのままで、スクリーンショット、クリック、メニュー、ダイアログ、Dock 操作、ウィンドウ管理などの Peekaboo 自動化プリミティブに OpenClaw.app の macOS 権限を使用します。
- **Codex Computer Use**: 同梱の `codex` Plugin は Codex app-server を準備し、Codex の `computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に Codex がネイティブのデスクトップ制御ツール呼び出しを所有できるようにします。OpenClaw はそれらの操作を PeekabooBridge 経由でプロキシしません。
- **直接 `cua-driver` MCP**: OpenClaw は TryCua のアップストリーム `cua-driver mcp` サーバーを通常の MCP サーバーとして登録できます。これにより、Codex マーケットプレイスや PeekabooBridge ソケットを経由せずに、CUA ドライバー固有のスキーマと pid/window/element-index ワークフローをエージェントに提供できます。

幅広い macOS 自動化サーフェスと、OpenClaw.app の権限を考慮したブリッジホストが必要な場合は Peekaboo を使用します。Codex モードのエージェントが Codex のネイティブ computer-use Plugin に依存すべき場合は Codex Computer Use を使用します。通常の MCP サーバーとして任意の OpenClaw 管理ランタイムに CUA ドライバーを公開したい場合は、直接 `cua-driver mcp` を使用します。

## ブリッジを有効化する

macOS アプリで:

- Settings → **Enable Peekaboo Bridge**

有効にすると、OpenClaw はローカル UNIX ソケットサーバーを開始します。無効にするとホストは停止され、`peekaboo` は他の利用可能なホストへフォールバックします。

## クライアント検出順序

Peekaboo クライアントは通常、次の順序でホストを試します。

1. Peekaboo.app（完全な UX）
2. Claude.app（インストール済みの場合）
3. OpenClaw.app（薄いブローカー）

どのホストがアクティブで、どのソケットパスが使用されているかを確認するには、`peekaboo bridge status --verbose` を使用します。次のように上書きできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **呼び出し元のコード署名** を検証します。TeamID の許可リストが適用されます（Peekaboo ホスト TeamID + OpenClaw アプリ TeamID）。
- リクエストは約 10 秒後にタイムアウトします。
- 必要な権限が不足している場合、ブリッジは System Settings を起動するのではなく、明確なエラーメッセージを返します。

## スナップショットの動作（自動化）

スナップショットはメモリに保存され、短い時間枠の後に自動的に期限切れになります。より長い保持が必要な場合は、クライアントから再キャプチャしてください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合は、クライアントが適切に署名されていることを確認するか、**デバッグ** モードでのみ `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を指定してホストを実行してください。
- ホストが見つからない場合は、いずれかのホストアプリ（Peekaboo.app または OpenClaw.app）を開き、権限が付与されていることを確認してください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
