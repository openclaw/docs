---
read_when:
    - リモート mac 制御の設定またはデバッグ
summary: SSH 経由でリモート OpenClaw Gateway を制御するための macOS app フロー
title: リモート制御
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Remote OpenClaw（macOS ⇄ リモートホスト）

このフローでは、macOS app が別ホスト（デスクトップ/サーバー）上で動作する OpenClaw gateway の完全なリモートコントロールとして機能します。これは app の **Remote over SSH**（リモート実行）機能です。ヘルスチェック、Voice Wake 転送、Web Chat を含むすべての機能は、_Settings → General_ にある同じリモート SSH 設定を再利用します。

## モード

- **Local（この Mac）**: すべてがノート PC 上で実行されます。SSH は関係しません。
- **Remote over SSH（デフォルト）**: OpenClaw コマンドはリモートホスト上で実行されます。mac app は、`-o BatchMode`、選択した ID/key、ローカルポートフォワード付きで SSH 接続を開きます。
- **Remote direct（ws/wss）**: SSH トンネルなし。mac app は gateway URL に直接接続します（たとえば Tailscale Serve や公開 HTTPS reverse proxy 経由）。

## リモートトランスポート

リモートモードは 2 つのトランスポートをサポートします。

- **SSH tunnel**（デフォルト）: `ssh -N -L ...` を使って gateway port を localhost に転送します。トンネルは loopback なので、gateway からは node の IP が `127.0.0.1` に見えます。
- **Direct（ws/wss）**: gateway URL に直接接続します。gateway は実際のクライアント IP を認識します。

SSH tunnel mode では、検出された LAN/tailnet hostname は `gateway.remote.sshTarget` として保存されます。app は `gateway.remote.url` をローカルトンネル endpoint、たとえば `ws://127.0.0.1:18789` のまま維持するため、CLI、Web Chat、ローカル node-host service はすべて同じ安全な loopback トランスポートを使用します。

リモートモードでの browser 自動化は、ネイティブ macOS app node ではなく CLI node host が所有します。app は可能であればインストール済み node host service を起動します。その Mac から browser 制御が必要な場合は、`openclaw node install ...` と `openclaw node start` でインストール/起動するか、`openclaw node run ...` をフォアグラウンドで実行し、その browser 対応 node を対象にしてください。

## リモートホスト側の前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. `openclaw` が非対話シェルの PATH に入っていることを確認します（必要なら `/usr/local/bin` または `/opt/homebrew/bin` に symlink）。
3. key 認証付きの SSH を有効にします。LAN 外でも安定して到達できるよう、**Tailscale** IP の使用を推奨します。

## macOS app のセットアップ

1. _Settings → General_ を開きます。
2. **OpenClaw runs** で **Remote over SSH** を選び、次を設定します:
   - **Transport**: **SSH tunnel** または **Direct (ws/wss)**。
   - **SSH target**: `user@host`（任意で `:port`）。
     - gateway が同じ LAN 上にあり Bonjour を公開している場合は、検出リストから選ぶとこのフィールドが自動入力されます。
   - **Gateway URL**（Direct のみ）: `wss://gateway.example.ts.net`（ローカル/LAN なら `ws://...`）。
   - **Identity file**（詳細設定）: key のパス。
   - **Project root**（詳細設定）: コマンドに使うリモート checkout パス。
   - **CLI path**（詳細設定）: 実行可能な `openclaw` エントリポイント/バイナリへの任意パス（公開されていれば自動入力されます）。
3. **Test remote** を押します。成功すれば、リモートの `openclaw status --json` が正しく実行されていることを示します。失敗は通常 PATH/CLI の問題で、exit 127 はリモートで CLI が見つからないことを意味します。
4. ヘルスチェックと Web Chat は以後、この SSH トンネルを自動的に通ります。

## Web Chat

- **SSH tunnel**: Web Chat は転送された WebSocket 制御ポート（デフォルト 18789）経由で gateway に接続します。
- **Direct（ws/wss）**: Web Chat は設定済み gateway URL に直接接続します。
- 独立した WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストには、ローカルと同じ TCC 承認（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）が必要です。そのマシンで一度オンボーディングを実行して付与してください。
- Nodes は `node.list` / `node.describe` 経由で自身の権限状態を公開するため、agent は何が利用可能かを把握できます。

## セキュリティに関する注意

- リモートホストでは loopback bind を推奨し、SSH または Tailscale 経由で接続してください。
- SSH トンネリングは厳格な host-key チェックを使用します。最初に host key を信頼し、`~/.ssh/known_hosts` に存在するようにしてください。
- Gateway を非 loopback インターフェースに bind する場合は、有効な Gateway auth を必須にしてください。token、password、または `gateway.auth.mode: "trusted-proxy"` を使う ID 対応 reverse proxy です。
- [Security](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。電話の WhatsApp で QR をスキャンしてください。
- auth の期限が切れたら、そのホスト上で再度ログインしてください。ヘルスチェックはリンク問題を表面化します。

## トラブルシューティング

- **exit 127 / not found**: `openclaw` が非ログインシェルの PATH にありません。`/etc/paths`、シェル rc に追加するか、`/usr/local/bin` / `/opt/homebrew/bin` に symlink してください。
- **Health probe failed**: SSH の到達性、PATH、および Baileys がログイン済みか（`openclaw status --json`）を確認してください。
- **Web Chat stuck**: リモートホストで gateway が動作しており、転送ポートが gateway WS port と一致していることを確認してください。UI には正常な WS 接続が必要です。
- **Node IP が 127.0.0.1 と表示される**: SSH tunnel では想定どおりです。gateway に実際のクライアント IP を見せたい場合は、**Transport** を **Direct (ws/wss)** に切り替えてください。
- **Voice Wake**: トリガーフレーズはリモートモードで自動転送されるため、別個の転送機構は不要です。

## 通知音

通知ごとに `openclaw` と `node.invoke` を使うスクリプトから音を選択できます。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

app にはもうグローバルな「デフォルト音」トグルはありません。呼び出し元がリクエストごとに音（または無音）を選択します。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [Remote access](/ja-JP/gateway/remote)
