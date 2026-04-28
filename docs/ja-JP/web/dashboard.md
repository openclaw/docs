---
read_when:
    - ダッシュボードの認証または公開モードを変更する場合
summary: Gateway ダッシュボード（Control UI）へのアクセスと認証
title: ダッシュボード
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T14:02:39Z"
  model: gpt-5.4
  provider: openai
  source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
  source_path: web/dashboard.md
  workflow: 15
---

Gateway ダッシュボードは、デフォルトで `/` で提供されるブラウザー Control UI です
（`gateway.controlUi.basePath` で上書き可能）。

クイックオープン（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）
- `gateway.tls.enabled: true` の場合は、`https://127.0.0.1:18789/` と
  WebSocket エンドポイント `wss://127.0.0.1:18789` を使います。

主な参照先:

- 使用方法と UI 機能については [Control UI](/ja-JP/web/control-ui)。
- Serve/Funnel 自動化については [Tailscale](/ja-JP/gateway/tailscale)。
- bind モードとセキュリティ注記については [Web surfaces](/ja-JP/web)。

認証は、設定された Gateway の auth 経路を通じて、WebSocket ハンドシェイク時に強制されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときの Tailscale Serve identity ヘッダー
- `gateway.auth.mode: "trusted-proxy"` のときの trusted-proxy identity ヘッダー

`gateway.auth` については [Gateway configuration](/ja-JP/gateway/configuration) を参照してください。

セキュリティ注記: Control UI は **管理用サーフェス** です（chat、config、exec approvals）。
公開インターネットへ露出させないでください。UI は、現在のブラウザータブセッションと選択された Gateway URL に対するダッシュボード URL トークンを sessionStorage に保持し、ロード後に URL から取り除きます。
localhost、Tailscale Serve、または SSH トンネルを優先してください。

## ファストパス（推奨）

- オンボーディング後、CLI は自動的にダッシュボードを開き、クリーンな（トークンなし）リンクを表示します。
- いつでも再度開くには: `openclaw dashboard`（リンクをコピーし、可能ならブラウザーを開き、headless なら SSH ヒントを表示）。
- UI が shared-secret 認証を求める場合は、設定された token または
  password を Control UI 設定に貼り付けてください。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **Gateway TLS**: `gateway.tls.enabled: true` の場合、ダッシュボード/ステータスのリンクは
  `https://` を使い、Control UI の WebSocket リンクは `wss://` を使います。
- **Shared-secret token の取得元**: `gateway.auth.token`（または
  `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は 1 回限りの bootstrap 用に
  URL fragment 経由でこれを渡せます。Control UI はこれを localStorage ではなく、
  現在のブラウザータブセッションと選択された Gateway URL 用の sessionStorage に保持します。
- `gateway.auth.token` が SecretRef 管理されている場合、`openclaw dashboard` は
  設計上、トークンなし URL を表示/コピー/オープンします。これにより、外部管理トークンがシェルログ、クリップボード履歴、ブラウザー起動引数に露出するのを防ぎます。
- `gateway.auth.token` が SecretRef として設定されていて、現在のシェルで未解決の場合でも、
  `openclaw dashboard` はトークンなし URL と、実行可能な認証セットアップ案内を表示します。
- **Shared-secret password**: 設定済みの `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_PASSWORD`）を使います。ダッシュボードは reload をまたいで password を保持しません。
- **Identity を持つモード**: `gateway.auth.allowTailscale: true` の場合、Tailscale Serve は identity ヘッダーを通じて Control UI/WebSocket 認証を満たせます。また、
  loopback 以外の identity-aware reverse proxy は
  `gateway.auth.mode: "trusted-proxy"` を満たせます。これらのモードでは、ダッシュボードは WebSocket 用に shared secret を貼り付ける必要がありません。
- **localhost 以外**: Tailscale Serve、loopback 以外の shared-secret bind、
  `gateway.auth.mode: "trusted-proxy"` を使う loopback 以外の identity-aware reverse proxy、
  または SSH トンネルを使ってください。HTTP API は、意図的に private-ingress の
  `gateway.auth.mode: "none"` または trusted-proxy HTTP auth を使わない限り、引き続き shared-secret 認証を使います。詳しくは
  [Web surfaces](/ja-JP/web) を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」/ 1008 が表示される場合

- Gateway に到達できることを確認してください（ローカル: `openclaw status`、リモート: SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@host` の後に `http://127.0.0.1:18789/` を開く）。
- `AUTH_TOKEN_MISMATCH` の場合、Gateway が retry ヒントを返すと、クライアントはキャッシュ済み device token で 1 回だけ信頼済み再試行を行うことがあります。そのキャッシュトークン再試行では、そのトークンのキャッシュ済み承認 scope を再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、要求した scope 集合を保持します。その再試行後も認証が失敗する場合は、token drift を手動で解消してください。
- その再試行経路以外では、connect 認証の優先順位は、明示的 shared token/password、次に明示的 `deviceToken`、次に保存済み device token、最後に bootstrap token です。
- 非同期 Tailscale Serve Control UI 経路では、同じ
  `{scope, ip}` に対する失敗試行は、failed-auth limiter が記録する前に直列化されるため、2 回目の同時不正再試行で、すでに `retry later` が表示される場合があります。
- token drift の修復手順については、[Token drift recovery checklist](/ja-JP/cli/devices#token-drift-recovery-checklist) を参照してください。
- shared secret を Gateway ホストから取得または指定します:
  - Token: `openclaw config get gateway.auth.token`
  - Password: 設定済みの `gateway.auth.password` または
    `OPENCLAW_GATEWAY_PASSWORD` を解決する
  - SecretRef 管理トークン: 外部 secret provider を解決するか、このシェルで
    `OPENCLAW_GATEWAY_TOKEN` を export してから `openclaw dashboard` を再実行する
  - shared secret が未設定: `openclaw doctor --generate-gateway-token`
- ダッシュボード設定で、auth フィールドに token または password を貼り付けてから接続してください。
- UI の言語ピッカーは **Overview -> Gateway Access -> Language** にあります。
  Appearance セクションではなく、access カードの一部です。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [WebChat](/ja-JP/web/webchat)
