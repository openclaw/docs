---
read_when:
    - ダッシュボード認証または公開モードの変更
summary: Gateway ダッシュボード（Control UI）へのアクセスと認証
title: ダッシュボード
x-i18n:
    generated_at: "2026-07-05T11:58:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e60ae8273560295fa2670af8ba3a26eea5b07fe2f8b07813460850785305f0b
    source_path: web/dashboard.md
    workflow: 16
---

Gateway ダッシュボードは、既定で `/` から配信されるブラウザーの Control UI です（`gateway.controlUi.basePath` で上書きできます）。

クイックオープン（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）
- `gateway.tls.enabled: true` の場合は、WebSocket エンドポイントに `https://127.0.0.1:18789/` と `wss://127.0.0.1:18789` を使用します。

主なリファレンス:

- 使い方と UI 機能については [Control UI](/ja-JP/web/control-ui)。
- Serve/Funnel 自動化については [Tailscale](/ja-JP/gateway/tailscale)。
- バインドモードとセキュリティ注記については [Web サーフェス](/ja-JP/web)。

認証は、設定済みの Gateway 認証パスを通じて WebSocket ハンドシェイクで適用されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

[Gateway 設定](/ja-JP/gateway/configuration) の `gateway.auth` を参照してください。

<Warning>
Control UI は**管理者サーフェス**（チャット、設定、実行承認）です。公開しないでください。UI は、現在のブラウザータブと選択された Gateway URL の dashboard URL トークンを sessionStorage に保持し、読み込み後に URL から削除します。localhost、Tailscale Serve、または SSH トンネルを推奨します。
</Warning>

## 高速パス（推奨）

- オンボーディング後、CLI は dashboard を自動で開き、クリーンな（トークン化されていない）リンクを出力します。
- いつでも再度開けます: `openclaw dashboard`（リンクをコピーし、可能ならブラウザーを開き、ヘッドレスの場合は SSH のヒントを出力します）。
- クリップボードとブラウザー配信の両方に失敗しても、`openclaw dashboard` はクリーンな URL を出力し、URL フラグメントキー `token` としてトークン（`OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.token` から）を追加するよう案内します。ログにトークン値を出力することはありません。
- UI が共有シークレット認証を求める場合は、設定済みのトークンまたはパスワードを Control UI 設定に貼り付けます。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **Gateway TLS**: `gateway.tls.enabled: true` の場合、dashboard/ステータスリンクは `https://` を使用し、Control UI WebSocket リンクは `wss://` を使用します。
- **共有シークレットトークンのソース**: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は、一度限りのブートストラップ用に URL フラグメント経由で渡せます。Control UI は、現在のタブと選択された Gateway URL について sessionStorage に保持し、localStorage には保持しません。
- `gateway.auth.token` が SecretRef 管理の場合、`openclaw dashboard` は設計上、トークン化されていない URL を出力、コピー、または開きます。これは、外部管理トークンがシェルログ、クリップボード履歴、ブラウザー起動引数に露出するのを避けるためです。現在のシェルで参照を解決できない場合でも、トークン化されていない URL と実行可能な認証設定ガイダンスを出力します。
- **共有シークレットパスワード**: 設定済みの `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。dashboard はリロードをまたいでパスワードを保持しません。
- **ID 付きモード**: `gateway.auth.allowTailscale: true` の場合、Tailscale Serve は ID ヘッダーを通じて Control UI/WebSocket 認証を満たします。local loopback ではない ID 対応リバースプロキシは `gateway.auth.mode: "trusted-proxy"` を満たします。どちらも WebSocket に貼り付ける共有シークレットは不要です。
- **localhost 以外**: Tailscale Serve、local loopback ではない共有シークレットバインド、`gateway.auth.mode: "trusted-proxy"` を持つ local loopback ではない ID 対応リバースプロキシ、または SSH トンネルを使用します。HTTP API は、private-ingress の `gateway.auth.mode: "none"` または trusted-proxy HTTP 認証を意図的に実行しない限り、引き続き共有シークレット認証を使用します。[Web サーフェス](/ja-JP/web) を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」/ 1008 が表示される場合

- Gateway に到達できることを確認します。ローカルでは `openclaw status`、リモートでは SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` を使用してから `http://127.0.0.1:18789/` を開きます。
- `AUTH_TOKEN_MISMATCH` の場合、Gateway が再試行ヒントを返すと、クライアントはキャッシュ済みデバイストークンで信頼済みの再試行を 1 回実行できます。その再試行では、トークンのキャッシュ済み承認スコープを再利用します（明示的な `deviceToken`/`scopes` 呼び出し元は、要求したスコープセットを維持します）。その再試行後も認証に失敗する場合は、トークンドリフトを手動で解決します。
- `AUTH_SCOPE_MISMATCH` の場合、デバイストークンは認識されていますが、要求されたスコープを持っていません。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか新しいスコープセットを承認します。
- その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 非同期 Tailscale Serve パスでは、同じ `{scope, ip}` の失敗試行は failed-auth リミッターに記録される前に直列化されるため、2 回目の同時不正再試行ですでに `retry later` が表示されることがあります。
- トークンドリフト修復手順については、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist) を参照してください。
- Gateway ホストから共有シークレットを取得または指定します。
  - トークン: `openclaw config get gateway.auth.token`
  - パスワード: 設定済みの `gateway.auth.password` または `OPENCLAW_GATEWAY_PASSWORD` を解決します
  - SecretRef 管理トークン: 外部シークレットプロバイダーを解決するか、このシェルで `OPENCLAW_GATEWAY_TOKEN` をエクスポートして `openclaw dashboard` を再実行します
  - 共有シークレットが未設定: `openclaw doctor --generate-gateway-token`
- dashboard 設定で、認証フィールドにトークンまたはパスワードを貼り付けてから接続します。
- UI 言語ピッカーは Appearance ではなく **Overview -> Gateway Access -> Language** にあります。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [WebChat](/ja-JP/web/webchat)
