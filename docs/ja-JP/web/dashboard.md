---
read_when:
    - ダッシュボード認証または公開モードを変更しています
summary: Gateway ダッシュボード（Control UI）へのアクセスと認証
title: ダッシュボード
x-i18n:
    generated_at: "2026-04-24T05:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Gateway ダッシュボードは、デフォルトで `/` に提供されるブラウザー Control UI です
（`gateway.controlUi.basePath` で上書き可能）。

すぐに開く（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

主要な参照先:

- 使用方法と UI 機能については [Control UI](/ja-JP/web/control-ui)
- Serve/Funnel 自動化については [Tailscale](/ja-JP/gateway/tailscale)
- bind モードとセキュリティ注記については [Web surfaces](/ja-JP/web)

認証は、設定された Gateway
認証経路を通じて WebSocket handshake 時に強制されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 時の Tailscale Serve identity header
- `gateway.auth.mode: "trusted-proxy"` 時の trusted-proxy identity header

`gateway.auth` については [Gateway configuration](/ja-JP/gateway/configuration) を参照してください。

セキュリティ注記: Control UI は **admin surface**（chat、config、exec approvals）です。
公開しないでください。UI はダッシュボード URL token を
現在の browser tab セッションと選択された Gateway URL に対して sessionStorage に保持し、読み込み後に URL からそれらを削除します。
localhost、Tailscale Serve、または SSH tunnel を推奨します。

## 手早い方法（推奨）

- オンボーディング後、CLI は自動的にダッシュボードを開き、クリーンな（token 化されていない）リンクを表示します。
- いつでも再度開けます: `openclaw dashboard`（リンクをコピーし、可能なら browser を開き、headless なら SSH ヒントを表示します）。
- UI が shared-secret auth を求める場合は、設定済み token または
  password を Control UI settings に貼り付けてください。

## 認証の基本（ローカル vs リモート）

- **localhost**: `http://127.0.0.1:18789/` を開きます。
- **shared-secret token ソース**: `gateway.auth.token`（または
  `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は、1 回限りの bootstrap 用に URL fragment 経由でこれを渡せます。Control UI は
  それを localStorage ではなく、現在の browser tab セッションと選択された Gateway URL に対して sessionStorage に保持します。
- `gateway.auth.token` が SecretRef 管理の場合、`openclaw dashboard`
  は設計上、token 化されていない URL を表示/コピー/オープンします。これにより、
  外部管理 token が shell log、clipboard history、または browser 起動引数に露出するのを防ぎます。
- `gateway.auth.token` が SecretRef として設定されていて、現在の
  shell で未解決であっても、`openclaw dashboard` は引き続き token 化されていない URL に加え、
  実行可能な auth セットアップガイダンスを表示します。
- **shared-secret password**: 設定済みの `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_PASSWORD`）を使います。ダッシュボードは password を reload をまたいで保持しません。
- **identity-bearing モード**: Tailscale Serve は、`gateway.auth.allowTailscale: true` のとき、
  identity header 経由で Control UI/WebSocket auth を満たせます。また
  non-loopback の identity-aware reverse proxy は
  `gateway.auth.mode: "trusted-proxy"` を満たせます。これらのモードでは、
  WebSocket 用の shared secret をダッシュボードに貼り付ける必要はありません。
- **localhost 以外**: Tailscale Serve、non-loopback shared-secret bind、
  `gateway.auth.mode: "trusted-proxy"` を持つ non-loopback identity-aware reverse proxy、または SSH tunnel を使ってください。HTTP API は、意図的に private-ingress の
  `gateway.auth.mode: "none"` または trusted-proxy HTTP auth を動かしていない限り、
  引き続き shared-secret auth を使います。 [Web surfaces](/ja-JP/web) を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」 / 1008 が出た場合

- Gateway に到達できることを確認してください（ローカル: `openclaw status`; リモート: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` を張ってから `http://127.0.0.1:18789/` を開く）。
- `AUTH_TOKEN_MISMATCH` の場合、Gateway が retry hint を返したときに、クライアントはキャッシュ済み device token で 1 回だけ trusted retry を行うことがあります。その cached-token retry は、その token のキャッシュ済み承認 scope を再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、引き続き要求した scope セットを保持します。その retry の後も auth が失敗する場合は、token drift を手動で解決してください。
- その retry path の外では、connect auth の優先順位は、明示的 shared token/password が最優先で、その次に明示的 `deviceToken`、次に保存済み device token、その次に bootstrap token です。
- 非同期 Tailscale Serve Control UI 経路では、同じ
  `{scope, ip}` に対する失敗試行は、failed-auth limiter がそれを記録する前に直列化されるため、
  2 回目の同時 bad retry で既に `retry later` が表示されることがあります。
- token drift 修復手順については、[Token drift recovery checklist](/ja-JP/cli/devices#token-drift-recovery-checklist) に従ってください。
- Gateway ホストから shared secret を取得または供給します:
  - Token: `openclaw config get gateway.auth.token`
  - Password: 設定済み `gateway.auth.password` または
    `OPENCLAW_GATEWAY_PASSWORD` を解決する
  - SecretRef 管理の token: 外部 secret provider を解決するか、この shell で
    `OPENCLAW_GATEWAY_TOKEN` を export してから、`openclaw dashboard`
    を再実行する
  - shared secret が設定されていない: `openclaw doctor --generate-gateway-token`
- ダッシュボード settings で、token または password を auth field に貼り付けてから接続します。
- UI language picker は **Overview -> Gateway Access -> Language** にあります。
  これは Appearance セクションではなく access card の一部です。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [WebChat](/ja-JP/web/webchat)
