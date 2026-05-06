---
read_when:
    - OpenClaw.app で PeekabooBridge をホストする
    - Swift Package Manager 経由で Peekaboo を統合する
    - PeekabooBridge のプロトコル/パスを変更する
    - PeekabooBridge、Codex Computer Use、cua-driver MCP の選び方
summary: macOS UI自動化のためのPeekabooBridge連携
title: Peekaboo ブリッジ
x-i18n:
    generated_at: "2026-05-06T05:12:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2b0076c0fabdc5e732c6a1b6ce9b571e8b65c1a646866f85ec4138c914d5c7d
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw は、ローカルで権限を考慮する UI 自動化ブローカーとして **PeekabooBridge** をホストできます。これにより、`peekaboo` CLI は macOS アプリの TCC 権限を再利用しながら UI 自動化を実行できます。

## これは何か（そして何ではないか）

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして動作できます。
- **クライアント**: `peekaboo` CLI を使用します（別個の `openclaw ui ...` サーフェスはありません）。
- **UI**: 視覚的なオーバーレイは Peekaboo.app に残ります。OpenClaw は薄いブローカーホストです。

## Computer Use との関係

OpenClaw には 3 つのデスクトップ制御パスがあり、意図的に分離されています。

- **PeekabooBridge ホスト**: OpenClaw.app はローカルの PeekabooBridge ソケットをホストできます。
  `peekaboo` CLI はクライアントのままで、スクリーンショット、クリック、
  メニュー、ダイアログ、Dock アクション、ウィンドウ管理などの Peekaboo 自動化プリミティブに OpenClaw.app の macOS
  権限を使用します。
- **Codex Computer Use**: バンドルされた `codex` Plugin は Codex app-server を準備し、
  Codex の `computer-use` MCP サーバーが利用可能であることを検証してから、
  Codex モードのターン中に Codex がネイティブのデスクトップ制御ツール呼び出しを所有できるようにします。OpenClaw
  はこれらのアクションを PeekabooBridge 経由でプロキシしません。
- **直接の `cua-driver` MCP**: OpenClaw は TryCua のアップストリーム
  `cua-driver mcp` サーバーを通常の MCP サーバーとして登録できます。これにより、Codex マーケットプレイスや PeekabooBridge ソケットを経由せずに、
  CUA ドライバー独自のスキーマと pid/ウィンドウ/要素インデックスのワークフローをエージェントに提供できます。

広範な macOS 自動化サーフェスと、OpenClaw.app の権限を考慮するブリッジホストが必要な場合は Peekaboo を使用します。Codex モードのエージェントが Codex のネイティブ computer-use Plugin に依存すべき場合は Codex Computer Use を使用します。通常の MCP サーバーとして任意の OpenClaw 管理ランタイムに CUA ドライバーを公開したい場合は、直接 `cua-driver mcp` を使用します。

## ブリッジを有効化する

macOS アプリで:

- Settings → **Peekaboo Bridge を有効化**

有効にすると、OpenClaw はローカル UNIX ソケットサーバーを起動します。無効にすると、ホストは停止され、`peekaboo` は他の利用可能なホストにフォールバックします。

## クライアントの検出順序

Peekaboo クライアントは通常、次の順序でホストを試します。

1. Peekaboo.app（完全な UX）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（薄いブローカー）

`peekaboo bridge status --verbose` を使用して、どのホストがアクティブで、どのソケットパスが使用されているかを確認します。次で上書きできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **呼び出し元のコード署名** を検証します。TeamID の許可リストが適用されます（Peekaboo ホスト TeamID + OpenClaw アプリ TeamID）。
- リクエストは約 10 秒後にタイムアウトします。
- 必要な権限がない場合、ブリッジは System Settings を起動するのではなく、明確なエラーメッセージを返します。

## スナップショットの動作（自動化）

スナップショットはメモリに保存され、短い時間枠の後に自動的に期限切れになります。
より長い保持が必要な場合は、クライアントから再キャプチャしてください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合は、クライアントが
  適切に署名されていることを確認するか、**debug** モードでのみ `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  を指定してホストを実行してください。
- ホストが見つからない場合は、ホストアプリのいずれか（Peekaboo.app または OpenClaw.app）を開き、
  権限が付与されていることを確認してください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
