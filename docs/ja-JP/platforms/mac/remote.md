---
read_when:
    - リモート Mac 制御のセットアップまたはデバッグ
summary: SSH 経由でリモートの OpenClaw Gateway を制御するための macOS アプリのフロー
title: リモート操作
x-i18n:
    generated_at: "2026-04-30T16:29:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# リモート OpenClaw (macOS ⇄ リモートホスト)

このフローでは、macOS アプリを、別のホスト（デスクトップ/サーバー）で実行されている OpenClaw Gateway の完全なリモートコントロールとして使えます。これはアプリの **SSH 経由リモート**（リモート実行）機能です。ヘルスチェック、Voice Wake の転送、Web Chat を含むすべての機能は、_設定 → 一般_ の同じリモート SSH 設定を再利用します。

## モード

- **ローカル（この Mac）**: すべてがノートパソコン上で実行されます。SSH は関係しません。
- **SSH 経由リモート（デフォルト）**: OpenClaw コマンドはリモートホスト上で実行されます。Mac アプリは、選択した ID/キーとローカルポート転送に加えて `-o BatchMode` を使って SSH 接続を開きます。
- **直接リモート（ws/wss）**: SSH トンネルは使いません。Mac アプリは Gateway URL に直接接続します（たとえば、Tailscale Serve や公開 HTTPS リバースプロキシ経由）。

## リモートトランスポート

リモートモードは 2 つのトランスポートをサポートします。

- **SSH トンネル**（デフォルト）: `ssh -N -L ...` を使って Gateway ポートを localhost に転送します。トンネルがループバックであるため、Gateway からはノードの IP が `127.0.0.1` として見えます。
- **直接（ws/wss）**: Gateway URL に直接接続します。Gateway からは実際のクライアント IP が見えます。

SSH トンネルモードでは、検出された LAN/tailnet ホスト名は
`gateway.remote.sshTarget` として保存されます。アプリは `gateway.remote.url` をローカル
トンネルエンドポイント（たとえば `ws://127.0.0.1:18789`）のままにするため、CLI、Web Chat、
ローカルのノードホストサービスはすべて同じ安全なループバックトランスポートを使用します。

リモートモードのブラウザー自動化は、ネイティブ macOS アプリのノードではなく、
CLI ノードホストが所有します。アプリは可能な場合、インストール済みのノードホストサービスを起動します。その Mac からブラウザー制御が必要な場合は、
`openclaw node install ...` と `openclaw node start` でインストール/起動するか（または
`openclaw node run ...` をフォアグラウンドで実行し）、そのブラウザー対応ノードを対象にしてください。

## リモートホストの前提条件

1. Node + pnpm をインストールし、OpenClaw CLI をビルド/インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルでも `openclaw` が PATH 上にあることを確認します（必要に応じて `/usr/local/bin` または `/opt/homebrew/bin` にシンボリックリンクします）。
3. 鍵認証で SSH を開きます。LAN 外から安定して到達できるように、**Tailscale** IP を推奨します。

## macOS アプリの設定

1. _設定 → 一般_ を開きます。
2. **OpenClaw の実行場所** で **SSH 経由リモート** を選び、次を設定します。
   - **トランスポート**: **SSH トンネル** または **直接（ws/wss）**。
   - **SSH ターゲット**: `user@host`（任意で `:port`）。
     - Gateway が同じ LAN 上にあり Bonjour で通知している場合は、検出済みリストから選ぶとこのフィールドが自動入力されます。
   - **Gateway URL**（直接のみ）: `wss://gateway.example.ts.net`（またはローカル/LAN では `ws://...`）。
   - **ID ファイル**（詳細）: キーへのパス。
   - **プロジェクトルート**（詳細）: コマンドに使うリモートのチェックアウトパス。
   - **CLI パス**（詳細）: 実行可能な `openclaw` エントリーポイント/バイナリへの任意のパス（通知されている場合は自動入力）。
3. **リモートをテスト** を押します。成功は、リモートの `openclaw status --json` が正しく実行されたことを示します。失敗は通常 PATH/CLI の問題です。終了コード 127 は、リモートで CLI が見つからないことを意味します。
4. ヘルスチェックと Web Chat は、この SSH トンネル経由で自動的に実行されるようになります。

## Web Chat

- **SSH トンネル**: Web Chat は、転送された WebSocket 制御ポート（デフォルト 18789）経由で Gateway に接続します。
- **直接（ws/wss）**: Web Chat は、設定済みの Gateway URL に直接接続します。
- 個別の WebChat HTTP サーバーはもうありません。

## 権限

- リモートホストには、ローカルと同じ TCC 承認（オートメーション、アクセシビリティ、画面収録、マイク、音声認識、通知）が必要です。そのマシンでオンボーディングを実行し、一度だけ付与してください。
- ノードは `node.list` / `node.describe` 経由で権限状態を通知するため、エージェントは利用可能なものを把握できます。

## セキュリティメモ

- リモートホストではループバックバインドを優先し、SSH または Tailscale 経由で接続してください。
- SSH トンネリングでは厳密なホストキー確認を使います。まずホストキーを信頼し、`~/.ssh/known_hosts` に存在するようにしてください。
- Gateway を非ループバックインターフェイスにバインドする場合は、有効な Gateway 認証（トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を使う ID 対応リバースプロキシ）を必須にしてください。
- [セキュリティ](/ja-JP/gateway/security) と [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## WhatsApp ログインフロー（リモート）

- **リモートホスト上で** `openclaw channels login --verbose` を実行します。スマートフォンの WhatsApp で QR をスキャンします。
- 認証が期限切れになった場合は、そのホストでログインを再実行します。ヘルスチェックがリンクの問題を表示します。

## トラブルシューティング

- **終了コード 127 / 見つからない**: `openclaw` が非ログインシェルの PATH 上にありません。`/etc/paths`、シェルの rc、または `/usr/local/bin`/`/opt/homebrew/bin` へのシンボリックリンクに追加してください。
- **ヘルスプローブが失敗した**: SSH の到達性、PATH、Baileys がログイン済みであること（`openclaw status --json`）を確認してください。
- **Web Chat が停止している**: Gateway がリモートホストで実行中であり、転送ポートが Gateway の WS ポートと一致していることを確認してください。UI には正常な WS 接続が必要です。
- **ノード IP が 127.0.0.1 と表示される**: SSH トンネルでは想定どおりです。Gateway から実際のクライアント IP を見たい場合は、**トランスポート** を **直接（ws/wss）** に切り替えてください。
- **ダッシュボードは動作するが Mac の機能がオフライン**: これは、アプリのオペレーター/制御接続は正常ですが、コンパニオンノード接続が接続されていないか、コマンドサーフェスが欠落していることを意味します。メニューバーのデバイスセクションを開き、Mac が `paired · disconnected` になっているか確認してください。`wss://*.ts.net` Tailscale Serve エンドポイントでは、証明書ローテーション後にアプリが古いレガシー TLS リーフピンを検出し、macOS が新しい証明書を信頼している場合は古いピンをクリアして自動的に再試行します。証明書がシステムで信頼されていない、またはホストが Tailscale Serve 名でない場合は、証明書を確認するか **SSH 経由リモート** に切り替えてください。
- **Voice Wake**: リモートモードではトリガーフレーズが自動的に転送されます。個別の転送機能は不要です。

## 通知音

`openclaw` と `node.invoke` を使うスクリプトから、通知ごとにサウンドを選びます。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

アプリにはグローバルな「デフォルトサウンド」トグルはもうありません。呼び出し元がリクエストごとにサウンド（またはなし）を選択します。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [リモートアクセス](/ja-JP/gateway/remote)
