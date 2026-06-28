---
read_when:
    - リモートMac制御のセットアップまたはデバッグ
summary: リモート OpenClaw Gateway を制御するための macOS アプリフロー
title: リモート操作
x-i18n:
    generated_at: "2026-06-28T00:12:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

このフローにより、macOS アプリは別ホスト（デスクトップ/サーバー）で実行されている OpenClaw Gateway の完全なリモートコントロールとして動作できます。アプリは信頼済みの LAN/Tailnet Gateway URL に直接接続するか、リモート Gateway がループバック専用の場合は SSH トンネルを管理できます。ヘルスチェック、Voice Wake 転送、Web Chat は _Settings → General_ の同じリモート設定を再利用します。

## モード

- **ローカル（この Mac）**: すべてがノートパソコン上で実行されます。SSH は関係しません。
- **SSH 経由のリモート（デフォルト）**: OpenClaw コマンドはリモートホスト上で実行されます。Mac アプリは `-o BatchMode` に加えて、選択した identity/key とローカルポート転送を使って SSH 接続を開きます。
- **直接リモート（ws/wss）**: SSH トンネルは使いません。Mac アプリは Gateway URL に直接接続します（例: LAN、Tailscale、Tailscale Serve、または公開 HTTPS リバースプロキシ経由）。

## リモートトランスポート

リモートモードは 2 つのトランスポートをサポートします。

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って Gateway ポートを localhost に転送します。トンネルはループバックなので、Gateway にはノードの IP が `127.0.0.1` として見えます。
- **直接（ws/wss）**: Gateway URL に直接接続します。Gateway には実際のクライアント IP が見えます。

SSH トンネルモードでは、検出された LAN/tailnet ホスト名は
`gateway.remote.sshTarget` として保存されます。アプリは `gateway.remote.url` をローカル
トンネルエンドポイント、たとえば `ws://127.0.0.1:18789` のままにするため、CLI、Web Chat、
ローカルのノードホストサービスはすべて同じ安全なループバックトランスポートを使用します。
検出で生の Tailnet IP と安定したホスト名の両方が返された場合、アプリは
Tailscale MagicDNS または LAN 名を優先し、アドレス変更後もリモート接続がより維持されやすくします。
ローカルトンネルポートがリモート Gateway ポートと異なる場合は、
`gateway.remote.remotePort` をリモートホスト上のポートに設定します。

リモートモードのブラウザー自動化は、ネイティブ macOS アプリのノードではなく CLI ノードホストが所有します。アプリは可能な場合、インストール済みのノードホストサービスを起動します。その Mac からブラウザー制御が必要な場合は、`openclaw node install ...` と `openclaw node start` でインストール/起動するか（またはフォアグラウンドで `openclaw node run ...` を実行し）、そのブラウザー対応ノードをターゲットにします。

## リモートホスト上の前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルで `openclaw` が PATH 上にあることを確認します（必要に応じて `/usr/local/bin` または `/opt/homebrew/bin` に symlink します）。
3. SSH トランスポートのみ: 鍵認証で SSH を開きます。LAN 外から安定して到達できるように **Tailscale** IP を推奨します。

## macOS アプリのセットアップ

ウェルカムフローなしでアプリを事前設定するには:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

信頼済み LAN または Tailnet 上ですでに到達可能な Gateway では、SSH を完全に省略します。

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

これによりリモート設定が書き込まれ、オンボーディングが完了済みとしてマークされ、アプリ起動時に選択済みトランスポートをアプリが所有できるようになります。

1. _Settings → General_ を開きます。
2. **OpenClaw runs** で **Remote** を選び、次を設定します。
   - **Transport**: **SSH tunnel** または **Direct (ws/wss)**。
   - **SSH target**: `user@host`（任意で `:port`）。
     - Gateway が同じ LAN 上にあり Bonjour を広告している場合は、検出済みリストから選ぶとこのフィールドが自動入力されます。
   - **Gateway URL**（直接のみ）: `wss://gateway.example.ts.net`（またはローカル/LAN 用の `ws://...`）。
   - **Identity file**（詳細）: 鍵へのパス。
   - **Project root**（詳細）: コマンドに使うリモート checkout パス。
   - **CLI path**（詳細）: 実行可能な `openclaw` entrypoint/binary への任意のパス（広告されている場合は自動入力）。
3. **Test remote** を押します。成功は、リモートの `openclaw status --json` が正しく実行されていることを示します。失敗は通常 PATH/CLI の問題です。終了コード 127 は CLI がリモートで見つからないことを意味します。
4. ヘルスチェックと Web Chat は、選択したトランスポート経由で自動的に実行されるようになります。

## Web Chat

- **SSH トンネル**: Web Chat は転送された WebSocket 制御ポート（デフォルト 18789）経由で Gateway に接続します。
- **直接（ws/wss）**: Web Chat は設定済み Gateway URL に直接接続します。
- 独立した WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストにはローカルと同じ TCC 承認（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）が必要です。そのマシンでオンボーディングを実行し、一度許可してください。
- ノードは `node.list` / `node.describe` を通じて権限状態を広告するため、エージェントは利用可能なものを把握できます。

## セキュリティメモ

- リモートホストではループバックバインドを優先し、SSH、Tailscale Serve、または信頼済みの Tailnet/LAN 直接 URL 経由で接続してください。
- SSH トンネリングは厳格なホスト鍵チェックを使用します。まずホスト鍵を信頼し、`~/.ssh/known_hosts` に存在するようにしてください。
- Gateway を非ループバックインターフェイスにバインドする場合は、有効な Gateway 認証を必須にしてください: token、password、または `gateway.auth.mode: "trusted-proxy"` を使う identity-aware リバースプロキシ。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。スマートフォンの WhatsApp で QR をスキャンします。
- 認証の有効期限が切れた場合は、そのホストでログインを再実行します。ヘルスチェックでリンクの問題が表示されます。

## トラブルシューティング

- **終了コード 127 / 見つからない**: `openclaw` が非ログインシェルの PATH 上にありません。`/etc/paths`、シェル rc に追加するか、`/usr/local/bin`/`/opt/homebrew/bin` に symlink してください。
- **ヘルスプローブ失敗**: SSH 到達性、PATH、Baileys にログイン済みかどうかを確認します（`openclaw status --json`）。
- **Web Chat が止まる**: Gateway がリモートホストで実行されていることと、転送ポートが Gateway WS ポートと一致していることを確認します。UI には正常な WS 接続が必要です。
- **ノード IP が 127.0.0.1 と表示される**: SSH トンネルでは想定どおりです。Gateway に実際のクライアント IP を見せたい場合は、**Transport** を **Direct (ws/wss)** に切り替えてください。
- **Dashboard は動くが Mac 機能がオフライン**: これはアプリの operator/control 接続は正常だが、companion ノード接続が接続されていない、またはコマンド surface がないことを意味します。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっているか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、証明書ローテーション後の古い legacy TLS leaf pin をアプリが検出し、macOS が新しい証明書を信頼している場合は古い pin を消去して自動的に再試行します。証明書がシステムで信頼されていない場合、またはホストが Tailscale Serve 名ではない場合は、`gateway.remote.tlsFingerprint` を期待される証明書フィンガープリントに設定するか、証明書を確認するか、**SSH 経由のリモート** に切り替えてください。
- **Voice Wake**: リモートモードではトリガーフレーズが自動的に転送されます。別個の forwarder は不要です。

## 通知音

`openclaw` と `node.invoke` を使うスクリプトから、通知ごとにサウンドを選びます。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはグローバルな「default sound」トグルはもうありません。呼び出し元がリクエストごとにサウンド（またはなし）を選びます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
