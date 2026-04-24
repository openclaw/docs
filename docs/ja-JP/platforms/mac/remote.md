---
read_when:
    - リモート mac 制御のセットアップまたはデバッグを行う դեպքում
summary: SSH 経由でリモート OpenClaw Gateway を制御するための macOS アプリフロー
title: リモート制御
x-i18n:
    generated_at: "2026-04-24T05:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Remote OpenClaw（macOS ⇄ リモートホスト）

このフローにより、macOS アプリは別のホスト（デスクトップ/サーバー）で動作する OpenClaw Gateway の完全なリモートコントロールとして機能します。これはアプリの **Remote over SSH**（remote run）機能です。ヘルスチェック、Voice Wake 転送、Web Chat を含むすべての機能は、_Settings → General_ にある同じリモート SSH 設定を再利用します。

## モード

- **Local（この Mac）**: すべてがノート PC 上で動作します。SSH は関与しません。
- **Remote over SSH（デフォルト）**: OpenClaw コマンドはリモートホスト上で実行されます。mac アプリは、`-o BatchMode`、選択した identity/key、ローカルポートフォワード付きで SSH 接続を開きます。
- **Remote direct（ws/wss）**: SSH トンネルなし。mac アプリは Gateway URL に直接接続します（たとえば Tailscale Serve や公開 HTTPS リバースプロキシ経由）。

## リモートトランスポート

リモートモードは 2 つのトランスポートをサポートします。

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って Gateway port を localhost にフォワードします。トンネルが loopback であるため、Gateway からは Node の IP が `127.0.0.1` に見えます。
- **Direct（ws/wss）**: Gateway URL に直接接続します。Gateway からは実際のクライアント IP が見えます。

## リモートホスト側の前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルでも `openclaw` が PATH 上にあることを確認します（必要なら `/usr/local/bin` または `/opt/homebrew/bin` に symlink してください）。
3. SSH を鍵認証で開きます。LAN 外からの安定した到達性のため、**Tailscale** IP の使用を推奨します。

## macOS アプリ設定

1. _Settings → General_ を開きます。
2. **OpenClaw runs** で **Remote over SSH** を選び、次を設定します。
   - **Transport**: **SSH tunnel** または **Direct（ws/wss）**。
   - **SSH target**: `user@host`（任意で `:port`）。
     - Gateway が同じ LAN 上にあり Bonjour を通知している場合は、検出済み一覧から選んでこのフィールドを自動入力できます。
   - **Gateway URL**（Direct のみ）: `wss://gateway.example.ts.net`（ローカル/LAN では `ws://...` でも可）。
   - **Identity file**（詳細設定）: 鍵ファイルへのパス。
   - **Project root**（詳細設定）: コマンドに使うリモート checkout パス。
   - **CLI path**（詳細設定）: 実行可能な `openclaw` エントリーポイント/バイナリへの任意パス（通知されていれば自動入力されます）。
3. **Test remote** を押します。成功すれば、リモートの `openclaw status --json` が正しく実行されていることを示します。失敗の多くは PATH/CLI の問題です。exit 127 は、リモートで CLI が見つからないことを意味します。
4. これ以降、ヘルスチェックと Web Chat はこの SSH トンネルを通じて自動で動作します。

## Web Chat

- **SSH トンネル**: Web Chat はフォワードされた WebSocket control port（デフォルト 18789）経由で Gateway に接続します。
- **Direct（ws/wss）**: Web Chat は設定済み Gateway URL に直接接続します。
- 独立した WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストには、ローカルと同じ TCC 承認（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）が必要です。それらを 1 回付与するために、そのマシンでオンボーディングを実行してください。
- Node は `node.list` / `node.describe` を通じて自分の権限状態を通知するため、エージェントは何が利用可能かを把握できます。

## セキュリティに関する注意

- リモートホストでは loopback bind を優先し、SSH または Tailscale 経由で接続してください。
- SSH トンネリングは厳格な host-key チェックを使います。まずホストキーを信頼し、`~/.ssh/known_hosts` に存在する状態にしてください。
- Gateway を non-loopback インターフェイスに bind する場合は、有効な Gateway 認証を必須にしてください: token、password、または `gateway.auth.mode: "trusted-proxy"` を使う identity-aware なリバースプロキシ。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。スマートフォンの WhatsApp で QR をスキャンしてください。
- 認証が期限切れになった場合は、そのホストで login を再実行してください。ヘルスチェックにリンク問題が表示されます。

## トラブルシューティング

- **exit 127 / not found**: 非ログインシェルで `openclaw` が PATH 上にありません。`/etc/paths`、シェル rc、または `/usr/local/bin`/`/opt/homebrew/bin` への symlink に追加してください。
- **Health probe failed**: SSH 到達性、PATH、および Baileys がログイン済みであること（`openclaw status --json`）を確認してください。
- **Web Chat が固まる**: リモートホスト上で Gateway が実行中であり、フォワードされた port が Gateway WS port と一致していることを確認してください。UI には健全な WS 接続が必要です。
- **Node IP が 127.0.0.1 と表示される**: SSH トンネルでは想定された動作です。Gateway から実際のクライアント IP を見せたい場合は、**Transport** を **Direct（ws/wss）** に切り替えてください。
- **Voice Wake**: リモートモードではトリガーフレーズが自動で転送されます。別個のフォワーダーは不要です。

## 通知音

通知ごとに、`openclaw` と `node.invoke` を使うスクリプトから音を選べます。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリには、もはやグローバルな「デフォルト音」トグルはありません。呼び出し側がリクエストごとに音（または無音）を選びます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [Remote access](/ja-JP/gateway/remote)
