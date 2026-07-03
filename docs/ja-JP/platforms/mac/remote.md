---
read_when:
    - リモート Mac 制御のセットアップまたはデバッグ
summary: リモートのOpenClaw Gatewayを制御するためのmacOSアプリのフロー
title: リモート制御
x-i18n:
    generated_at: "2026-07-03T23:26:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

このフローでは、macOS アプリを、別ホスト（デスクトップ/サーバー）で実行されている OpenClaw gateway の完全なリモートコントロールとして動作させられます。アプリは、信頼済み LAN/Tailnet gateway URL に直接接続することも、リモート gateway が loopback-only の場合に SSH トンネルを管理することもできます。ヘルスチェック、Voice Wake 転送、Web Chat は、_Settings → General_ の同じリモート設定を再利用します。

## モード

- **Local（この Mac）**: すべてがノートパソコン上で実行されます。SSH は関与しません。
- **Remote over SSH（デフォルト）**: OpenClaw コマンドはリモートホスト上で実行されます。Mac アプリは、`-o BatchMode` に加えて選択した ID/キーとローカルポート転送を使って SSH 接続を開きます。
- **Remote direct（ws/wss）**: SSH トンネルは使いません。Mac アプリは gateway URL に直接接続します（例: LAN、Tailscale、Tailscale Serve、または公開 HTTPS リバースプロキシ経由）。

## リモートトランスポート

リモートモードは 2 つのトランスポートをサポートします。

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って gateway ポートを localhost に転送します。トンネルはループバックのため、gateway からはノードの IP が `127.0.0.1` として見えます。
- **Direct（ws/wss）**: gateway URL に直接接続します。gateway からは実際のクライアント IP が見えます。

アプリ所有の SSH プロセスについて、アプリは SSH 接続多重化と認証後のバックグラウンド化を無効にします。これにより、選択したエイリアスが `ControlMaster` または `ForkAfterAuthentication` を有効にしている場合でも、正確なプロセスを監視して再起動できます。

gateway 認証情報はこのトンネルを通過するため、SSH ホストキー検証はデフォルトで厳格です。信頼動作を明示的に使用する意図がある管理済み SSH エイリアスでは、`openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` でオプトインするか、`gateway.remote.sshHostKeyPolicy` を `"openssh"` に設定してください。このオプトインは有効な OpenSSH ホストキーポリシーを使用します。まずエイリアスと、一致する `Host *` またはシステム設定を確認してください。アプリまたは `configure-remote` で SSH ターゲットを変更すると、明示的に再度オプトインしない限り、ポリシーは `strict` にリセットされます。

SSH トンネルモードでは、検出された LAN/tailnet ホスト名は
`gateway.remote.sshTarget` として保存されます。アプリは `gateway.remote.url` をローカル
トンネルエンドポイント、たとえば `ws://127.0.0.1:18789` に保つため、CLI、Web Chat、
ローカル node-host サービスはすべて同じ安全なループバックトランスポートを使用します。
検出で生の Tailnet IP と安定したホスト名の両方が返された場合、アプリは
リモート接続がアドレス変更により強くなるように、Tailscale MagicDNS または LAN 名を優先します。
ローカルトンネルポートがリモート gateway ポートと異なる場合は、
`gateway.remote.remotePort` をリモートホスト上のポートに設定してください。

リモートモードのブラウザ自動化は、ネイティブ macOS アプリノードではなく CLI node host が所有します。アプリは可能な場合、インストール済みの node host サービスを起動します。その Mac からブラウザ制御が必要な場合は、`openclaw node install ...` と `openclaw node start` でインストール/起動するか（または `openclaw node run ...` をフォアグラウンドで実行して）、そのブラウザ対応ノードをターゲットにしてください。

## リモートホスト上の前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルで `openclaw` が PATH 上にあることを確認します（必要なら `/usr/local/bin` または `/opt/homebrew/bin` にシンボリックリンクします）。
3. SSH トランスポートのみ: キー認証で SSH を開きます。LAN 外からの安定した到達性には **Tailscale** IP を推奨します。

## macOS アプリのセットアップ

ウェルカムフローを使わずにアプリを事前設定するには:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

信頼済み LAN または Tailnet ですでに到達可能な gateway では、SSH を完全に省略します。

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

これによりリモート設定が書き込まれ、オンボーディング完了としてマークされ、起動時にアプリが
選択したトランスポートを所有できるようになります。

1. _Settings → General_ を開きます。
2. **OpenClaw runs** で **Remote** を選択し、次を設定します:
   - **Transport**: **SSH tunnel** または **Direct (ws/wss)**。
   - **SSH target**: `user@host`（任意で `:port`）。
     - gateway が同じ LAN 上にあり Bonjour を広告している場合は、検出リストから選択してこのフィールドを自動入力します。
   - **Gateway URL**（Direct のみ）: `wss://gateway.example.ts.net`（またはローカル/LAN では `ws://...`）。
   - **Identity file**（詳細）: キーへのパス。
   - **Project root**（詳細）: コマンドに使うリモートチェックアウトパス。
   - **CLI path**（詳細）: 実行可能な `openclaw` エントリポイント/バイナリへの任意のパス（広告されている場合は自動入力）。
3. **Test remote** を押します。成功は、リモートの `openclaw status --json` が正しく実行されていることを示します。失敗は通常 PATH/CLI の問題です。終了コード 127 は、リモートで CLI が見つからないことを意味します。
4. ヘルスチェックと Web Chat は、選択したトランスポートを通じて自動的に実行されるようになります。

## Web Chat

- **SSH トンネル**: Web Chat は転送された WebSocket 制御ポート（デフォルト 18789）経由で gateway に接続します。
- **Direct（ws/wss）**: Web Chat は設定された gateway URL に直接接続します。
- 独立した WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストにはローカルと同じ TCC 承認（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）が必要です。そのマシンでオンボーディングを実行し、一度だけ許可してください。
- ノードは `node.list` / `node.describe` を通じて自身の権限状態を広告するため、エージェントは利用可能なものを把握できます。

## セキュリティメモ

- リモートホストではループバックバインドを優先し、SSH、Tailscale Serve、または信頼済み Tailnet/LAN の直接 URL 経由で接続してください。
- SSH トンネリングでは、デフォルトで既に信頼済みのホストキーが必要です。まずホストキーを信頼し、設定済みの known-hosts ファイルに存在するようにするか、受け入れる OpenSSH 信頼ポリシーを持つ管理済みエイリアスについて `gateway.remote.sshHostKeyPolicy: "openssh"` を明示的に選択してください。
- Gateway を非ループバックインターフェイスにバインドする場合は、有効な Gateway 認証を必須にしてください: トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を備えた ID 対応リバースプロキシ。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。スマートフォンの WhatsApp で QR をスキャンします。
- 認証が期限切れになった場合は、そのホストでログインを再実行します。ヘルスチェックがリンクの問題を表示します。

## トラブルシューティング

- **exit 127 / not found**: `openclaw` が非ログインシェルの PATH 上にありません。`/etc/paths`、シェル rc に追加するか、`/usr/local/bin`/`/opt/homebrew/bin` にシンボリックリンクします。
- **Health probe failed**: SSH 到達性、PATH、Baileys がログイン済みであること（`openclaw status --json`）を確認してください。
- **Web Chat stuck**: gateway がリモートホスト上で実行されており、転送ポートが gateway WS ポートと一致していることを確認してください。UI には正常な WS 接続が必要です。
- **Node IP shows 127.0.0.1**: SSH トンネルでは想定どおりです。gateway に実際のクライアント IP を見せたい場合は、**Transport** を **Direct (ws/wss)** に切り替えてください。
- **Dashboard works but Mac capabilities are offline**: これはアプリの operator/control 接続は正常だが、コンパニオンノード接続が接続されていないか、コマンドサーフェスが欠けていることを意味します。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっているか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、証明書ローテーション後にアプリが古いレガシー TLS leaf pin を検出し、macOS が新しい証明書を信頼している場合は古い pin をクリアして自動的に再試行します。証明書がシステムで信頼されていない場合、またはホストが Tailscale Serve 名ではない場合は、`gateway.remote.tlsFingerprint` を期待される証明書フィンガープリントに設定するか、証明書を確認するか、**Remote over SSH** に切り替えてください。
- **Voice Wake**: リモートモードではトリガーフレーズが自動的に転送されます。別個のフォワーダーは不要です。

## 通知音

`openclaw` と `node.invoke` を使うスクリプトから、通知ごとに音を選択します。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリには、グローバルな「デフォルト音」トグルはもうありません。呼び出し元がリクエストごとに音（または音なし）を選択します。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
