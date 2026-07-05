---
read_when:
    - リモート Mac 制御のセットアップまたはデバッグ
summary: リモートの OpenClaw gateway を制御するための macOS アプリフロー
title: リモート制御
x-i18n:
    generated_at: "2026-07-05T11:35:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

このフローにより、macOS アプリは別ホスト（デスクトップ/サーバー）で実行されている OpenClaw Gateway の完全なリモートコントロールとして動作できます。アプリは信頼済みの LAN/Tailnet Gateway URL に直接接続するか、リモート Gateway が loopback 専用の場合は SSH トンネルを管理します。ヘルスチェック、音声ウェイク転送、ウェブチャットは、_設定 -> 一般_ の同じリモート設定を再利用します。

## モード

- **ローカル（この Mac）**: すべてがノート PC 上で実行されます。SSH は関与しません。
- **SSH 経由のリモート（デフォルト）**: OpenClaw コマンドはリモートホスト上で実行されます。アプリは `-o BatchMode`、選択した ID/キー、local port-forward を使って SSH 接続を開きます。
- **リモート直接（ws/wss）**: SSH トンネルは使いません。アプリは Gateway URL に直接接続します（LAN、Tailscale、Tailscale Serve、または公開 HTTPS リバースプロキシ）。

## リモートトランスポート

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って Gateway ポートを localhost に転送します。トンネルが loopback のため、Gateway にはノードの IP が `127.0.0.1` として見えます。
- **直接（ws/wss）**: Gateway URL に直接接続します。Gateway には実際のクライアント IP が見えます。

アプリは自身の SSH プロセスについて SSH 接続の多重化と認証後のバックグラウンド化を無効にします。これにより、選択したエイリアスで `ControlMaster` や `ForkAfterAuthentication` が有効になっていても、正確なプロセスを監視して再起動できます。

Gateway の認証情報がこのトンネルを通過するため、SSH ホストキー検証はデフォルトで厳格です。管理対象 SSH エイリアス自身の信頼動作を使うには、`openclaw-mac configure-remote` で `--ssh-host-key-policy openssh` を設定するか、`gateway.remote.sshHostKeyPolicy` を直接 `"openssh"` に設定します。オプトインする前に、エイリアスと一致する `Host *` またはシステム設定を確認してください。SSH ターゲットを変更すると（アプリ内または `configure-remote` 経由）、新しいターゲットに対して明示的に再度オプトインしない限り、ポリシーは `strict` に戻ります。

SSH トンネルモードでは、検出された LAN/tailnet ホスト名は `gateway.remote.sshTarget` として保存されます。アプリは `gateway.remote.url` をローカルトンネルエンドポイント（例: `ws://127.0.0.1:18789`）に保つため、CLI、ウェブチャット、ローカルのノードホストサービスはすべて同じ loopback トランスポートを使用します。検出で raw Tailnet IP と安定したホスト名の両方が返る場合、アプリはアドレス変更により強くなるよう Tailscale MagicDNS または LAN 名を優先します。ローカルトンネルポートがリモート Gateway ポートと異なる場合は、`gateway.remote.remotePort` をリモートホスト上のポートに設定します。

リモートモードのブラウザー自動化は、ネイティブ macOS アプリノードではなく CLI ノードホストが所有します。アプリは可能な場合、インストール済みのノードホストサービスを開始します。その Mac からブラウザー制御を有効にするには、`openclaw node install ...` と `openclaw node start` でインストール/開始する（または `openclaw node run ...` をフォアグラウンドで実行する）うえで、ブラウザー対応ノードをターゲットにします。

## リモートホストの前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルで `openclaw` が PATH 上にあることを確認します（必要に応じて `/usr/local/bin` または `/opt/homebrew/bin` に symlink します）。
3. SSH トランスポートの場合: キーベースの SSH 認証を設定します。LAN 外でも安定して到達できるよう、Tailscale IP が推奨されます。

## macOS アプリのセットアップ

ウェルカムフローなしで、SSH 経由でアプリを事前設定するには:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

または、信頼済み LAN または Tailnet 上ですでに到達可能な Gateway の場合は、SSH を完全にスキップします:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

どちらの形式も `~/.openclaw/openclaw.json` に書き込み、オンボーディングを完了済みにし、次回起動時にアプリが選択したトランスポートを所有できるようにします。`--local-port`/`--remote-port` のデフォルトは `18789` です。その他のフラグ: `--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。完全なリファレンスは `openclaw-mac configure-remote --help` を実行してください。

代わりに UI から設定するには:

1. _設定 -> 一般_ を開きます。
2. **OpenClaw の実行場所** で **リモート** を選び、次を設定します:
   - **トランスポート**: **SSH トンネル** または **直接（ws/wss）**。
   - **SSH ターゲット**: `user@host`（任意で `:port`）。Gateway が同じ LAN 上にあり Bonjour を通知している場合は、検出リストから選ぶとこのフィールドが自動入力されます。
   - **Gateway URL**（直接のみ）: `wss://gateway.example.ts.net`（またはローカル/LAN では `ws://...`）。
   - **ID ファイル**（詳細）: キーへのパス。
   - **プロジェクトルート**（詳細）: コマンドに使うリモート checkout パス。
   - **CLI パス**（詳細）: 実行可能な `openclaw` エントリポイント/バイナリへの任意のパス（通知されている場合は自動入力）。
3. **リモートをテスト** を押します。成功は、リモートの `openclaw status --json` が正しく実行されたことを意味します。失敗は通常 PATH/CLI の問題です。終了コード 127 は、リモートで CLI が見つからなかったことを意味します。
4. ヘルスチェックとウェブチャットは、選択したトランスポート経由で自動的に実行されます。

## ウェブチャット

- **SSH トンネル**: 転送された WebSocket 制御ポート（デフォルト 18789）経由で Gateway に接続します。
- **直接（ws/wss）**: 設定済みの Gateway URL に直接接続します。
- 別個のウェブチャット HTTP サーバーはありません。

## 権限

- リモートホストには、ローカルと同じ TCC 承認（オートメーション、アクセシビリティ、画面収録、マイク、音声認識、通知）が必要です。付与するには、そのマシンでオンボーディングを一度実行します。
- ノードは `node.list` / `node.describe` 経由で権限状態を通知するため、エージェントは利用可能なものを把握できます。

## セキュリティメモ

- リモートホストでは loopback bind を優先し、SSH、Tailscale Serve、または信頼済み Tailnet/LAN の直接 URL 経由で接続します。
- SSH トンネリングでは、デフォルトでホストキーがすでに信頼済みである必要があります。まずホストキーを信頼する（設定済みの known-hosts ファイルに追加する）か、OpenSSH の信頼ポリシーを受け入れる管理対象エイリアスについて `gateway.remote.sshHostKeyPolicy: "openssh"` を明示的に設定します。
- Gateway を非 loopback インターフェイスに bind する場合は、有効な Gateway 認証を必須にします: トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を使う ID 対応リバースプロキシ。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --channel whatsapp --verbose` を実行します。電話の WhatsApp で QR をスキャンします。
- 認証の有効期限が切れた場合は、そのホストでログインを再実行します。ヘルスチェックにリンクの問題が表示されます。

## トラブルシューティング

| 症状                                          | 原因 / 修正                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / not found                           | 非ログインシェルの PATH に `openclaw` がありません。`/etc/paths`、シェルの rc に追加するか、`/usr/local/bin`/`/opt/homebrew/bin` に symlink してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Health probe failed                              | SSH 到達性、PATH、Baileys (WhatsApp) がログイン済みであることを確認してください (`openclaw status --json`)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat stuck                                   | Gateway がリモートホストで実行中であり、転送ポートが Gateway の WS ポートと一致していることを確認してください。UI には正常な WS 接続が必要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Node IP shows `127.0.0.1`                        | SSH トンネルでは想定どおりです。Gateway に実際のクライアント IP を見せたい場合は、**Transport** を **Direct (ws/wss)** に切り替えてください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Dashboard works but Mac capabilities are offline | オペレーター/コントロール接続は正常ですが、コンパニオンノード接続が接続されていないか、コマンドサーフェスがありません。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっていないか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、アプリは証明書ローテーション後の古いレガシー TLS リーフピンを検出し、macOS が新しい証明書を信頼すると古いピンをクリアして自動的に再試行します。証明書がシステムに信頼されていない場合、またはホストが Tailscale Serve 名でない場合は、`gateway.remote.tlsFingerprint` を想定される証明書フィンガープリントに設定し、証明書を確認するか、**Remote over SSH** に切り替えてください。 |
| Voice Wake                                       | リモートモードではトリガーフレーズが自動的に転送されます。別個のフォワーダーは不要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## 通知音

`openclaw nodes notify` を使い、スクリプトから通知ごとに音を選択します。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはグローバルな既定音のトグルはありません。呼び出し元がリクエストごとに音を選択します (または音なし)。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
