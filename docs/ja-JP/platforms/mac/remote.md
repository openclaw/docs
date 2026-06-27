---
read_when:
    - リモート Mac 制御のセットアップまたはデバッグ
summary: リモート OpenClaw gateway を制御するための macOS アプリフロー
title: リモート制御
x-i18n:
    generated_at: "2026-06-27T12:04:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

このフローにより、macOS アプリは別のホスト（デスクトップ/サーバー）で動作している OpenClaw Gateway の完全なリモートコントロールとして機能できます。アプリは信頼済みの LAN/Tailnet Gateway URL に直接接続することも、リモート Gateway がループバック専用の場合に SSH トンネルを管理することもできます。ヘルスチェック、Voice Wake 転送、Web Chat は、_設定 → 一般_ の同じリモート構成を再利用します。

## モード

- **ローカル（この Mac）**: すべてがラップトップ上で動作します。SSH は関与しません。
- **SSH 経由のリモート（デフォルト）**: OpenClaw コマンドはリモートホストで実行されます。Mac アプリは `-o BatchMode` と選択した ID/キー、ローカルポート転送を使って SSH 接続を開きます。
- **リモート直接（ws/wss）**: SSH トンネルは使いません。Mac アプリは Gateway URL に直接接続します（たとえば、LAN、Tailscale、Tailscale Serve、または公開 HTTPS リバースプロキシ経由）。

## リモートトランスポート

リモートモードは 2 つのトランスポートをサポートします。

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って Gateway ポートを localhost に転送します。トンネルはループバックのため、Gateway からはノードの IP が `127.0.0.1` として見えます。
- **直接（ws/wss）**: Gateway URL に直接接続します。Gateway からは実際のクライアント IP が見えます。

SSH トンネルモードでは、検出された LAN/tailnet ホスト名は
`gateway.remote.sshTarget` として保存されます。アプリは `gateway.remote.url` をローカル
トンネルエンドポイント（例: `ws://127.0.0.1:18789`）に保持するため、CLI、Web Chat、
ローカルのノードホストサービスはすべて同じ安全なループバックトランスポートを使用します。
ローカルトンネルポートがリモート Gateway ポートと異なる場合は、
`gateway.remote.remotePort` をリモートホスト上のポートに設定してください。

リモートモードのブラウザ自動化は、ネイティブ macOS アプリのノードではなく、
CLI ノードホストが所有します。アプリは可能な場合、インストール済みのノードホストサービスを起動します。
その Mac からブラウザ制御が必要な場合は、`openclaw node install ...` と
`openclaw node start` でインストール/起動する（または
`openclaw node run ...` をフォアグラウンドで実行する）ことで、ブラウザ対応の
ノードを対象にしてください。

## リモートホストの前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルで `openclaw` が PATH 上にあることを確認します（必要に応じて `/usr/local/bin` または `/opt/homebrew/bin` にシンボリックリンクします）。
3. SSH トランスポートのみ: キー認証で SSH を開きます。LAN 外からの安定した到達性のため、**Tailscale** IP を推奨します。

## macOS アプリのセットアップ

ウェルカムフローを使わずにアプリを事前構成するには:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

信頼済みの LAN または Tailnet ですでに到達可能な Gateway の場合は、SSH を完全にスキップします。

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

これによりリモート構成が書き込まれ、オンボーディングが完了済みとしてマークされ、
起動時にアプリが選択されたトランスポートを所有できるようになります。

1. _設定 → 一般_ を開きます。
2. **OpenClaw の実行場所** で **リモート** を選び、次を設定します。
   - **トランスポート**: **SSH トンネル** または **直接（ws/wss）**。
   - **SSH ターゲット**: `user@host`（任意で `:port`）。
     - Gateway が同じ LAN 上にあり Bonjour で通知している場合は、検出リストから選ぶとこのフィールドが自動入力されます。
   - **Gateway URL**（直接のみ）: `wss://gateway.example.ts.net`（ローカル/LAN の場合は `ws://...`）。
   - **ID ファイル**（詳細）: キーへのパス。
   - **プロジェクトルート**（詳細）: コマンドに使用するリモートチェックアウトパス。
   - **CLI パス**（詳細）: 実行可能な `openclaw` エントリポイント/バイナリへの任意のパス（通知されている場合は自動入力）。
3. **リモートをテスト** を押します。成功は、リモートの `openclaw status --json` が正しく実行されることを示します。失敗は通常 PATH/CLI の問題です。終了コード 127 は、CLI がリモートで見つからないことを意味します。
4. ヘルスチェックと Web Chat は、選択されたトランスポートを通じて自動的に実行されます。

## Web Chat

- **SSH トンネル**: Web Chat は、転送された WebSocket 制御ポート（デフォルト 18789）経由で Gateway に接続します。
- **直接（ws/wss）**: Web Chat は構成済みの Gateway URL に直接接続します。
- 個別の WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストにはローカルと同じ TCC 承認（オートメーション、アクセシビリティ、画面収録、マイク、音声認識、通知）が必要です。そのマシンでオンボーディングを実行し、一度だけ付与してください。
- ノードは `node.list` / `node.describe` を通じて権限状態を通知するため、エージェントは利用可能なものを把握できます。

## セキュリティの注意

- リモートホストではループバックバインドを優先し、SSH、Tailscale Serve、または信頼済みの Tailnet/LAN 直接 URL 経由で接続してください。
- SSH トンネリングは厳格なホストキー確認を使用します。ホストキーが `~/.ssh/known_hosts` に存在するよう、最初に信頼してください。
- Gateway を非ループバックインターフェイスにバインドする場合は、有効な Gateway 認証（トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を持つ ID 認識リバースプロキシ）を必須にしてください。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。スマートフォンの WhatsApp で QR をスキャンします。
- 認証が期限切れになった場合は、そのホストでログインを再実行します。ヘルスチェックがリンクの問題を表示します。

## トラブルシューティング

- **終了コード 127 / 見つからない**: `openclaw` が非ログインシェルの PATH 上にありません。`/etc/paths`、シェル rc に追加するか、`/usr/local/bin`/`/opt/homebrew/bin` にシンボリックリンクしてください。
- **ヘルスプローブ失敗**: SSH 到達性、PATH、Baileys がログイン済みであること（`openclaw status --json`）を確認してください。
- **Web Chat が止まる**: Gateway がリモートホストで実行中であり、転送ポートが Gateway WS ポートと一致していることを確認してください。UI には正常な WS 接続が必要です。
- **Node IP が 127.0.0.1 と表示される**: SSH トンネルでは想定どおりです。Gateway から実際のクライアント IP が見えるようにしたい場合は、**トランスポート** を **直接（ws/wss）** に切り替えてください。
- **ダッシュボードは動作するが Mac 機能がオフライン**: これは、アプリのオペレーター/制御接続は正常だが、コンパニオンノード接続が接続されていない、またはコマンドサーフェスが欠けていることを意味します。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっているか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、証明書ローテーション後の古いレガシー TLS リーフピンをアプリが検出し、macOS が新しい証明書を信頼している場合は古いピンをクリアして自動的に再試行します。証明書がシステムで信頼されていない、またはホストが Tailscale Serve 名ではない場合は、`gateway.remote.tlsFingerprint` を想定される証明書フィンガープリントに設定し、証明書を確認するか、**SSH 経由のリモート** に切り替えてください。
- **Voice Wake**: リモートモードではトリガーフレーズが自動的に転送されます。個別の転送機能は不要です。

## 通知音

`openclaw` と `node.invoke` を使ったスクリプトから、通知ごとに音を選択します。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはグローバルな「デフォルト音」トグルはもうありません。呼び出し元がリクエストごとに音（またはなし）を選びます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
