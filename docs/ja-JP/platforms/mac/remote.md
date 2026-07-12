---
read_when:
    - リモート Mac 制御のセットアップまたはデバッグ
summary: リモートの OpenClaw Gateway を制御するための macOS アプリのフロー
title: リモート制御
x-i18n:
    generated_at: "2026-07-11T22:24:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

このフローでは、macOS アプリを、別のホスト（デスクトップ／サーバー）で実行されている OpenClaw Gateway の完全なリモートコントロールとして使用できます。アプリは、信頼済みの LAN／Tailnet Gateway URL に直接接続するか、リモート Gateway が local loopback のみの場合は SSH トンネルを管理します。ヘルスチェック、Voice Wake の転送、Web Chat は、_Settings -> General_ の同じリモート設定を再利用します。

## モード

- **ローカル（この Mac）**：すべてがラップトップ上で実行されます。SSH は使用しません。
- **SSH 経由のリモート（デフォルト）**：OpenClaw コマンドはリモートホスト上で実行されます。アプリは、`-o BatchMode`、選択した ID／鍵、ローカルポートフォワーディングを使用して SSH 接続を開きます。
- **直接リモート（ws/wss）**：SSH トンネルを使用せず、アプリが Gateway URL に直接接続します（LAN、Tailscale、Tailscale Serve、または公開 HTTPS リバースプロキシ）。

## リモート転送方式

- **SSH トンネル**（デフォルト）：`ssh -N -L ...` を使用して、Gateway ポートを localhost に転送します。トンネルが local loopback を使用するため、Gateway からは Node の IP が `127.0.0.1` として見えます。
- **直接接続（ws/wss）**：Gateway URL に直接接続します。Gateway からは実際のクライアント IP が見えます。

アプリは、選択したエイリアスで `ControlMaster` または `ForkAfterAuthentication` が有効になっている場合でも、対象のプロセスを正確に監視して再起動できるよう、独自の SSH プロセスでは SSH 接続の多重化と認証後のバックグラウンド化を無効にします。

Gateway の認証情報がこのトンネルを通過するため、SSH ホスト鍵検証はデフォルトで厳格です。管理対象 SSH エイリアス独自の信頼動作を使用するには、`openclaw-mac configure-remote` で `--ssh-host-key-policy openssh` を設定するか、`gateway.remote.sshHostKeyPolicy` を直接 `"openssh"` に設定します。この設定を有効にする前に、エイリアスと、一致する `Host *` またはシステム設定を確認してください。SSH 接続先を変更すると（アプリ内または `configure-remote` 経由）、新しい接続先に対して明示的に再度有効にしない限り、ポリシーは `strict` に戻ります。

SSH トンネルモードでは、検出された LAN／Tailnet ホスト名が `gateway.remote.sshTarget` として保存されます。CLI、Web Chat、ローカルの Node ホストサービスがすべて同じ local loopback 転送方式を使用するように、アプリは `gateway.remote.url` をローカルトンネルのエンドポイント（例：`ws://127.0.0.1:18789`）に維持します。検出時に未加工の Tailnet IP と安定したホスト名の両方が返された場合、アドレス変更後も接続を維持しやすいよう、アプリは Tailscale MagicDNS または LAN 名を優先します。ローカルトンネルのポートがリモート Gateway のポートと異なる場合は、`gateway.remote.remotePort` をリモートホスト上のポートに設定します。

リモートモードでのブラウザー自動化は、ネイティブ macOS アプリの Node ではなく、CLI Node ホストが担当します。可能な場合、アプリはインストール済みの Node ホストサービスを起動します。その Mac からブラウザー制御を有効にするには、`openclaw node install ...` と `openclaw node start` を使用してインストール／起動するか、`openclaw node run ...` をフォアグラウンドで実行し、ブラウザー機能を持つその Node を接続先として指定します。

## リモートホスト側の前提条件

1. Node と pnpm をインストールし、OpenClaw CLI をビルド／インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話型シェルの PATH に `openclaw` が含まれていることを確認します（必要に応じて `/usr/local/bin` または `/opt/homebrew/bin` にシンボリックリンクを作成します）。
3. SSH 転送の場合：鍵ベースの SSH 認証を設定します。LAN 外から安定して接続するには、Tailscale IP を推奨します。

## macOS アプリのセットアップ

ウェルカムフローを使用せず、SSH 経由でアプリを事前設定するには、次を実行します。

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

または、信頼済みの LAN または Tailnet からすでに到達可能な Gateway の場合は、SSH を完全に省略します。

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

どちらの形式でも `~/.openclaw/openclaw.json` が書き込まれ、オンボーディングが完了済みとして記録され、次回起動時にアプリが選択した転送方式を管理できるようになります。`--local-port`／`--remote-port` のデフォルトは `18789` です。その他のフラグ：`--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。完全なリファレンスを確認するには、`openclaw-mac configure-remote --help` を実行してください。

代わりに UI から設定するには、次の手順に従います。

1. _Settings -> General_ を開きます。
2. **OpenClaw runs** で **Remote** を選択し、次を設定します。
   - **Transport**：**SSH tunnel** または **Direct (ws/wss)**。
   - **SSH target**：`user@host`（任意で `:port`）。Gateway が同じ LAN 上にあり Bonjour を通知している場合は、検出済みリストから選択すると、このフィールドが自動入力されます。
   - **Gateway URL**（Direct のみ）：`wss://gateway.example.ts.net`（ローカル／LAN の場合は `ws://...`）。
   - **Identity file**（詳細設定）：鍵へのパス。
   - **Project root**（詳細設定）：コマンドに使用するリモートチェックアウトのパス。
   - **CLI path**（詳細設定）：実行可能な `openclaw` エントリポイント／バイナリへの任意のパス（通知されている場合は自動入力されます）。
3. **Test remote** を押します。成功した場合、リモートの `openclaw status --json` が正しく実行されたことを意味します。失敗は通常、PATH／CLI の問題を示します。終了コード 127 は、リモートで CLI が見つからなかったことを意味します。
4. これで、ヘルスチェックと Web Chat は選択した転送方式を通じて自動的に実行されます。

## Web Chat

- **SSH トンネル**：転送された WebSocket 制御ポート（デフォルトは 18789）を介して Gateway に接続します。
- **直接接続（ws/wss）**：設定された Gateway URL に直接接続します。
- Web Chat 専用の HTTP サーバーはありません。

## 権限

- リモートホストには、ローカルと同じ TCC 承認（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）が必要です。これらを付与するため、そのマシンでオンボーディングを一度実行します。
- エージェントが利用可能な機能を把握できるよう、Node は `node.list`／`node.describe` を介して権限の状態を通知します。

## セキュリティ上の注意

- リモートホストでは local loopback へのバインドを優先し、SSH、Tailscale Serve、または信頼済みの Tailnet／LAN 直接 URL を介して接続してください。
- SSH トンネリングでは、デフォルトで事前に信頼されたホスト鍵が必要です。最初にホスト鍵を信頼して（設定された known-hosts ファイルに追加して）ください。または、OpenSSH の信頼ポリシーを受け入れられる管理対象エイリアスに対して、`gateway.remote.sshHostKeyPolicy: "openssh"` を明示的に設定します。
- Gateway を local loopback 以外のインターフェースにバインドする場合は、トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を使用する ID 対応リバースプロキシによる、有効な Gateway 認証を必須にしてください。
- [セキュリティ](/ja-JP/gateway/security)および[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --channel whatsapp --verbose` を実行します。スマートフォンの WhatsApp で QR コードをスキャンします。
- 認証の有効期限が切れた場合は、そのホストでログインを再実行します。ヘルスチェックにリンクの問題が表示されます。

## トラブルシューティング

| 症状                                             | 原因 / 修正方法                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / 見つからない                        | 非ログインシェルの PATH に `openclaw` が含まれていません。`/etc/paths` またはシェルの rc ファイルに追加するか、`/usr/local/bin`/`/opt/homebrew/bin` 内にシンボリックリンクを作成してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ヘルスプローブの失敗                             | SSH で接続可能か、PATH が正しいか、Baileys（WhatsApp）がログイン済みかを確認してください（`openclaw status --json`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Web チャットが停止したまま                       | リモートホストで Gateway が実行されており、転送ポートが Gateway の WS ポートと一致していることを確認してください。UI には正常な WS 接続が必要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Node の IP が `127.0.0.1` と表示される           | SSH トンネルでは想定どおりの表示です。Gateway で実際のクライアント IP を認識させる場合は、**Transport** を **Direct (ws/wss)** に切り替えてください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ダッシュボードは動作するが Mac の機能がオフライン | オペレーター/制御接続は正常ですが、コンパニオン Node の接続が確立されていないか、コマンドサーフェスがありません。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっていないか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、証明書のローテーション後に古くなった従来の TLS リーフピンをアプリが検出し、macOS が新しい証明書を信頼すると古いピンを一度消去して、自動的に再試行します。証明書がシステムで信頼されていない場合、またはホストが Tailscale Serve の名前でない場合は、`gateway.remote.tlsFingerprint` に想定される証明書フィンガープリントを設定し、証明書を確認するか、**Remote over SSH** に切り替えてください。 |
| 音声ウェイクアップ                               | リモートモードではトリガーフレーズが自動的に転送されるため、別途フォワーダーは必要ありません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## 通知音

通知ごとに、スクリプトから `openclaw nodes notify` を使用してサウンドを選択します。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはグローバルなデフォルトサウンドの切り替えはありません。呼び出し元がリクエストごとにサウンドを指定します（サウンドなしも指定可能です）。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
