---
read_when:
    - ダッシュボードの認証または公開モードの変更
summary: Gatewayダッシュボード（Control UI）のアクセスと認証
title: ダッシュボード
x-i18n:
    generated_at: "2026-04-23T14:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# ダッシュボード（Control UI）

Gatewayダッシュボードは、デフォルトでは `/` で提供されるブラウザーControl UIです
（`gateway.controlUi.basePath` で上書き可能）。

クイックオープン（ローカルGateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

主要な参照先:

- 使い方とUI機能については [Control UI](/ja-JP/web/control-ui)。
- Serve/Funnel自動化については [Tailscale](/ja-JP/gateway/tailscale)。
- bindモードとセキュリティ注意事項については [Web surfaces](/ja-JP/web)。

認証は、設定済みGateway認証経路を通じてWebSocketハンドシェイク時に強制されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときのTailscale Serve IDヘッダー
- `gateway.auth.mode: "trusted-proxy"` のときのtrusted-proxy IDヘッダー

`gateway.auth` については [Gateway configuration](/ja-JP/gateway/configuration) を参照してください。

セキュリティに関する注意: Control UIは**管理者向け画面**です（チャット、config、exec approvals）。
公開しないでください。UIは、ダッシュボードURLトークンを現在のブラウザータブセッションと選択されたGateway URLに対してsessionStorageに保持し、読み込み後にURLから削除します。
localhost、Tailscale Serve、またはSSHトンネルを推奨します。

## 最短手順（推奨）

- オンボーディング後、CLIは自動的にダッシュボードを開き、クリーンな（トークンなし）リンクを表示します。
- いつでも再度開くには: `openclaw dashboard`（リンクをコピーし、可能ならブラウザーを開き、ヘッドレス環境ならSSHヒントを表示）。
- UIが共有シークレット認証を求める場合は、設定済みのトークンまたは
  パスワードをControl UI設定に貼り付けてください。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **共有シークレットトークンの取得元**: `gateway.auth.token`（または
  `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は一時的なブートストラップ用にURLフラグメント経由でこれを渡せます。Control UIはこれをlocalStorageではなく、現在のブラウザータブセッションと選択されたGateway URLに対してsessionStorageへ保持します。
- `gateway.auth.token` がSecretRef管理されている場合、`openclaw dashboard` は仕様どおり、トークンなしURLを表示/コピー/オープンします。これにより、外部管理トークンがシェルログ、クリップボード履歴、ブラウザー起動引数へ露出するのを防ぎます。
- `gateway.auth.token` がSecretRefとして設定されていて、現在のシェルで未解決でも、`openclaw dashboard` はトークンなしURLに加え、実行可能な認証セットアップガイダンスを表示します。
- **共有シークレットパスワード**: 設定済みの `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_PASSWORD`）を使用します。ダッシュボードはパスワードをリロードをまたいで保持しません。
- **ID付きモード**: `gateway.auth.allowTailscale: true` のとき、Tailscale ServeはIDヘッダー経由でControl UI/WebSocket認証を満たせます。また、
  non-loopbackのID対応リバースプロキシは
  `gateway.auth.mode: "trusted-proxy"` を満たせます。これらのモードでは、ダッシュボードはWebSocket向けに共有シークレットを貼り付ける必要がありません。
- **localhost以外**: Tailscale Serve、non-loopback共有シークレットbind、
  `gateway.auth.mode: "trusted-proxy"` を持つnon-loopback ID対応リバースプロキシ、
  またはSSHトンネルを使用してください。HTTP APIは、意図的にプライベート受信の
  `gateway.auth.mode: "none"` または trusted-proxy HTTP認証を使っていない限り、
  引き続き共有シークレット認証を使います。[Web surfaces](/ja-JP/web) を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」/ 1008 が表示された場合

- Gatewayへ到達できることを確認してください（ローカル: `openclaw status`、リモート: SSHトンネル `ssh -N -L 18789:127.0.0.1:18789 user@host` を張ってから `http://127.0.0.1:18789/` を開く）。
- `AUTH_TOKEN_MISMATCH` の場合、Gatewayがリトライヒントを返すと、クライアントはキャッシュ済みデバイストークンで1回だけ信頼済みリトライを行うことがあります。そのキャッシュトークンのリトライでは、トークンにキャッシュされた承認済みスコープを再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は要求したスコープ集合を維持します。そのリトライ後も認証に失敗する場合は、トークンずれを手動で解決してください。
- そのリトライ経路以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
- 非同期のTailscale Serve Control UI経路では、同じ
  `{scope, ip}` に対する失敗試行は、失敗認証リミッターに記録される前に直列化されるため、2つ目の同時不正リトライで既に `retry later` が表示されることがあります。
- トークンずれの修復手順については、[Token drift recovery checklist](/ja-JP/cli/devices#token-drift-recovery-checklist) に従ってください。
- Gatewayホストから共有シークレットを取得または設定してください:
  - トークン: `openclaw config get gateway.auth.token`
  - パスワード: 設定済みの `gateway.auth.password` または
    `OPENCLAW_GATEWAY_PASSWORD` を解決する
  - SecretRef管理トークン: 外部シークレットプロバイダーを解決するか、このシェルで
    `OPENCLAW_GATEWAY_TOKEN` をexportしてから、`openclaw dashboard`
    を再実行する
  - 共有シークレットが未設定: `openclaw doctor --generate-gateway-token`
- ダッシュボード設定で、authフィールドにトークンまたはパスワードを貼り付けてから接続してください。
- UI言語ピッカーは **Overview -> Gateway Access -> Language** にあります。
  Appearanceセクションではなく、accessカードの一部です。
