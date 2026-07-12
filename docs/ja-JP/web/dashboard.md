---
read_when:
    - ダッシュボードの認証または公開モードの変更
summary: Gateway ダッシュボード（コントロール UI）へのアクセスと認証
title: ダッシュボード
x-i18n:
    generated_at: "2026-07-12T14:54:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway ダッシュボードは、デフォルトで `/` から配信されるブラウザ版 Control UI です（`gateway.controlUi.basePath` で上書きできます）。

クイックアクセス（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）
- `gateway.tls.enabled: true` の場合は、ダッシュボードに `https://127.0.0.1:18789/`、WebSocket エンドポイントに `wss://127.0.0.1:18789` を使用します。

主要なリファレンス:

- 使用方法と UI 機能については、[Control UI](/ja-JP/web/control-ui)。
- Serve/Funnel の自動化については、[Tailscale](/ja-JP/gateway/tailscale)。
- バインドモードとセキュリティ上の注意事項については、[Web サーフェス](/ja-JP/web)。

認証は、設定された Gateway 認証パスを介して WebSocket ハンドシェイク時に適用されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

[Gateway の設定](/ja-JP/gateway/configuration)の `gateway.auth` を参照してください。

<Warning>
Control UI は**管理サーフェス**です（チャット、設定、実行承認）。公開しないでください。UI は、現在のブラウザタブと選択した Gateway URL のダッシュボード URL トークンを sessionStorage に保持し、読み込み後に URL から削除します。localhost、Tailscale Serve、または SSH トンネルを推奨します。
</Warning>

## 最短手順（推奨）

- オンボーディング後、CLI はダッシュボードを自動的に開き、トークンを含まないクリーンなリンクを表示します。
- いつでも再度開けます: `openclaw dashboard`（リンクをコピーし、可能であればブラウザを開き、ヘッドレス環境では SSH のヒントを表示します）。
- クリップボードへのコピーとブラウザでの表示が両方とも失敗しても、`openclaw dashboard` はクリーンな URL を表示し、URL フラグメントキー `token` としてトークン（`OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.token` から取得）を追加するよう案内します。ログにトークン値が出力されることはありません。
- UI で共有シークレット認証を求められた場合は、設定済みのトークンまたはパスワードを Control UI の設定に貼り付けます。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **Gateway TLS**: `gateway.tls.enabled: true` の場合、ダッシュボードとステータスのリンクは `https://` を使用し、Control UI の WebSocket リンクは `wss://` を使用します。
- **共有シークレットトークンの取得元**: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は、初回ブートストラップ用に URL フラグメント経由で渡すことができます。Control UI は、localStorage ではなく、現在のタブと選択した Gateway URL の sessionStorage に保持します。
- `gateway.auth.token` が SecretRef で管理されている場合、外部管理トークンがシェルログ、クリップボード履歴、またはブラウザ起動引数に公開されるのを避けるため、`openclaw dashboard` は仕様上、トークンを含まない URL を表示、コピー、または開きます。現在のシェルで参照を解決できない場合でも、トークンを含まない URL と、実行可能な認証設定ガイダンスが表示されます。
- **共有シークレットパスワード**: 設定済みの `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。ダッシュボードは、再読み込み後もパスワードを保持しません。
- **ID を使用するモード**: `gateway.auth.allowTailscale: true` の場合、Tailscale Serve は ID ヘッダーを介して Control UI/WebSocket 認証を満たします。local loopback 以外の ID 対応リバースプロキシは、`gateway.auth.mode: "trusted-proxy"` を満たします。どちらの場合も、WebSocket に共有シークレットを貼り付ける必要はありません。
- **localhost 以外**: Tailscale Serve、local loopback 以外の共有シークレットバインド、`gateway.auth.mode: "trusted-proxy"` を使用する local loopback 以外の ID 対応リバースプロキシ、または SSH トンネルを使用します。プライベートイングレスの `gateway.auth.mode: "none"` または信頼済みプロキシ HTTP 認証を意図的に使用しない限り、HTTP API では引き続き共有シークレット認証を使用します。[Web サーフェス](/ja-JP/web)を参照してください。

## Telegram で開く

Telegram ボットは、`/dashboard` を使用してダッシュボードを Telegram Mini App として開くことができます。

要件:

- Telegram が HTTPS Mini App URL を取得できるように、`gateway.tailscale.mode: "serve"` または `"funnel"` を設定します。
- Telegram の送信者はボットの所有者である必要があります。つまり、`commands.ownerAllowFrom` または選択したアカウントの有効な `channels.telegram.allowFrom` に含まれる数値の Telegram ユーザー ID でなければなりません。
- ボットとの DM で `/dashboard` を実行します。グループから呼び出した場合は、DM でコマンドを開くよう案内されるだけで、ボタンは表示されません。
- Docker インストール: Serve/Funnel モードでは、Gateway を `tailscaled` と同じ場所で local loopback にバインドする必要がありますが、ポートを公開するブリッジネットワークではこの要件を満たせません。Gateway コンテナを `network_mode: host` で実行し、ホストの `tailscaled` ソケット（`/var/run/tailscale`）と `tailscale` CLI をコンテナにマウントします。

Mini App は、所有者への 1 回限りの引き渡しを実行し、有効期間の短いブートストラップトークンを使用して Control UI にリダイレクトします。共有 Gateway トークンを URL に公開することはありません。

v1 の対象外:

- Telegram Web iframe はサポートされていません。
- 公開 URL パスとしてサポートされるのは Tailscale Serve/Funnel のみです。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」/ 1008 が表示される場合

- Gateway に到達できることを確認します。ローカルでは `openclaw status`、リモートでは SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` を使用してから、`http://127.0.0.1:18789/` を開きます。
- `AUTH_TOKEN_MISMATCH` の場合、Gateway が再試行のヒントを返すと、クライアントはキャッシュ済みデバイストークンを使用して信頼済みの再試行を 1 回実行することがあります。この再試行では、トークンにキャッシュされた承認済みスコープが再利用されます（明示的な `deviceToken`/`scopes` の呼び出し元は、要求したスコープセットを維持します）。その再試行後も認証に失敗する場合は、トークンの不整合を手動で解決してください。
- `AUTH_SCOPE_MISMATCH` の場合、デバイストークンは認識されていますが、要求されたスコープを保持していません。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか、新しいスコープセットを承認してください。
- この再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 非同期の Tailscale Serve パスでは、同じ `{scope, ip}` に対する失敗した試行は、失敗認証リミッターが記録する前に直列化されます。そのため、同時に行われた 2 回目の不正な再試行で、すでに `retry later` が表示されることがあります。
- トークン不整合の修復手順については、[トークン不整合の復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を参照してください。
- Gateway ホストから共有シークレットを取得または指定します:
  - トークン: `openclaw config get gateway.auth.token`
  - パスワード: 設定済みの `gateway.auth.password` または `OPENCLAW_GATEWAY_PASSWORD` を解決します
  - SecretRef で管理されるトークン: 外部シークレットプロバイダーを解決するか、このシェルで `OPENCLAW_GATEWAY_TOKEN` をエクスポートして `openclaw dashboard` を再実行します
  - 共有シークレットが設定されていない場合: `openclaw doctor --generate-gateway-token`
- ダッシュボードの設定で、認証フィールドにトークンまたはパスワードを貼り付けてから接続します。
- UI の言語選択は **Settings -> General -> Language** にあり、Appearance の下ではありません。

## 関連項目

- [Control UI](/ja-JP/web/control-ui)
- [WebChat](/ja-JP/web/webchat)
