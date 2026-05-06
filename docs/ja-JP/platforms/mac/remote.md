---
read_when:
    - リモート Mac 制御のセットアップまたはデバッグ
summary: SSH 経由でリモートの OpenClaw Gateway を制御する macOS アプリのフロー
title: リモート操作
x-i18n:
    generated_at: "2026-05-06T05:12:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

このフローにより、macOS アプリは別のホスト（デスクトップ/サーバー）で実行されている OpenClaw Gateway の完全なリモートコントロールとして動作できます。これはアプリの **SSH 経由のリモート**（リモート実行）機能です。すべての機能のヘルスチェック、Voice Wake 転送、Web Chat は、_設定 → 一般_ の同じリモート SSH 設定を再利用します。

## モード

- **ローカル（この Mac）**: すべてがノートパソコン上で実行されます。SSH は関与しません。
- **SSH 経由のリモート（デフォルト）**: OpenClaw コマンドはリモートホストで実行されます。Mac アプリは、`-o BatchMode` に加えて選択した ID/キーとローカルポート転送を使って SSH 接続を開きます。
- **リモート直接接続（ws/wss）**: SSH トンネルは使いません。Mac アプリは Gateway URL に直接接続します（たとえば、Tailscale Serve や公開 HTTPS リバースプロキシ経由）。

## リモート転送方式

リモートモードは 2 つの転送方式をサポートします。

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って Gateway ポートを localhost に転送します。トンネルはループバックのため、Gateway からは Node の IP が `127.0.0.1` として見えます。
- **直接接続（ws/wss）**: Gateway URL に直接接続します。Gateway からは実際のクライアント IP が見えます。

SSH トンネルモードでは、検出された LAN/tailnet ホスト名は
`gateway.remote.sshTarget` として保存されます。アプリは `gateway.remote.url` をローカルの
トンネルエンドポイント（例: `ws://127.0.0.1:18789`）のままにするため、CLI、Web Chat、
ローカルの Node ホストサービスはすべて同じ安全なループバック転送を使用します。

リモートモードでのブラウザー自動化は、ネイティブ macOS アプリの Node ではなく CLI Node ホストが所有します。アプリは可能な場合、インストール済みの Node ホストサービスを起動します。その Mac からブラウザー制御が必要な場合は、`openclaw node install ...` と `openclaw node start` でインストール/起動する（または
`openclaw node run ...` をフォアグラウンドで実行する）ことで、そのブラウザー対応
Node を対象にしてください。

## リモートホスト側の前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルでも `openclaw` が PATH 上にあることを確認します（必要に応じて `/usr/local/bin` または `/opt/homebrew/bin` にシンボリックリンクを作成します）。
3. キー認証で SSH を開きます。LAN 外から安定して到達できるよう、**Tailscale** IP を推奨します。

## macOS アプリの設定

1. _設定 → 一般_ を開きます。
2. **OpenClaw の実行場所** で **SSH 経由のリモート** を選び、次を設定します。
   - **転送方式**: **SSH トンネル** または **直接接続（ws/wss）**。
   - **SSH ターゲット**: `user@host`（任意で `:port`）。
     - Gateway が同じ LAN 上にあり Bonjour を通知している場合は、検出リストから選ぶとこのフィールドが自動入力されます。
   - **Gateway URL**（直接接続のみ）: `wss://gateway.example.ts.net`（またはローカル/LAN では `ws://...`）。
   - **ID ファイル**（詳細）: キーへのパス。
   - **プロジェクトルート**（詳細）: コマンドに使用するリモートのチェックアウトパス。
   - **CLI パス**（詳細）: 実行可能な `openclaw` エントリーポイント/バイナリへの任意のパス（通知されている場合は自動入力）。
3. **リモートをテスト** を押します。成功した場合、リモートの `openclaw status --json` が正しく実行されています。失敗は通常 PATH/CLI の問題です。終了コード 127 は、リモートで CLI が見つからないことを意味します。
4. ヘルスチェックと Web Chat は、この SSH トンネル経由で自動的に実行されるようになります。

## Web Chat

- **SSH トンネル**: Web Chat は、転送された WebSocket 制御ポート（デフォルト 18789）経由で Gateway に接続します。
- **直接接続（ws/wss）**: Web Chat は、設定された Gateway URL に直接接続します。
- 独立した WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストにはローカルと同じ TCC 承認（オートメーション、アクセシビリティ、画面収録、マイク、音声認識、通知）が必要です。そのマシンでオンボーディングを実行し、一度付与してください。
- Node は `node.list` / `node.describe` 経由で自身の権限状態を通知するため、エージェントは利用可能なものを把握できます。

## セキュリティメモ

- リモートホストではループバックバインドを優先し、SSH または Tailscale 経由で接続してください。
- SSH トンネリングは厳格なホストキー検証を使用します。まずホストキーを信頼し、`~/.ssh/known_hosts` に存在するようにしてください。
- Gateway を非ループバックインターフェイスにバインドする場合は、有効な Gateway 認証（トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を使う ID 認識リバースプロキシ）を必須にしてください。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。スマートフォンの WhatsApp で QR をスキャンします。
- 認証の有効期限が切れた場合は、そのホストでログインを再実行してください。ヘルスチェックでリンクの問題が表示されます。

## トラブルシューティング

- **終了コード 127 / 見つからない**: `openclaw` が非ログインシェルの PATH 上にありません。`/etc/paths`、シェル rc に追加するか、`/usr/local/bin`/`/opt/homebrew/bin` にシンボリックリンクを作成してください。
- **ヘルスプローブ失敗**: SSH 到達性、PATH、Baileys がログイン済みであることを確認してください（`openclaw status --json`）。
- **Web Chat が止まる**: Gateway がリモートホストで実行されており、転送ポートが Gateway WS ポートと一致していることを確認してください。UI には正常な WS 接続が必要です。
- **Node IP が 127.0.0.1 と表示される**: SSH トンネルでは想定どおりです。Gateway から実際のクライアント IP を見えるようにしたい場合は、**転送方式** を **直接接続（ws/wss）** に切り替えてください。
- **ダッシュボードは動作するが Mac 機能がオフライン**: これは、アプリのオペレーター/制御接続は正常ですが、コンパニオン Node 接続が接続されていないか、コマンド面が不足していることを意味します。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっていないか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、証明書ローテーション後に残った古い TLS リーフピンをアプリが検出し、macOS が新しい証明書を信頼している場合は古いピンを消去して自動的に再試行します。証明書がシステムで信頼されていない場合、またはホストが Tailscale Serve 名ではない場合は、証明書を確認するか **SSH 経由のリモート** に切り替えてください。
- **Voice Wake**: リモートモードではトリガーフレーズが自動的に転送されます。別の転送機能は不要です。

## 通知音

`openclaw` と `node.invoke` を使うスクリプトから、通知ごとに音を選択します。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはグローバルな「デフォルト音」トグルはもうありません。呼び出し元がリクエストごとに音（または音なし）を選択します。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
