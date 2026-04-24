---
read_when:
    - GatewayへTailscale経由でアクセスしたい場合
    - ブラウザーControl UIと設定編集を使いたい場合
summary: 'GatewayのWebインターフェース: Control UI、bindモード、およびセキュリティ'
title: Web
x-i18n:
    generated_at: "2026-04-24T05:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gatewayは、Gateway WebSocketと同じポートで小さな**ブラウザーControl UI**（Vite + Lit）を提供します。

- デフォルト: `http://<host>:18789/`
- 任意のprefix: `gateway.controlUi.basePath`を設定（例: `/openclaw`）

機能については[Control UI](/ja-JP/web/control-ui)にあります。
このページはbindモード、セキュリティ、およびWeb向けインターフェースに焦点を当てています。

## Webhook

`hooks.enabled=true`の場合、Gatewayは同じHTTPサーバー上に小さなWebhook endpointも公開します。
認証とpayloadについては[Gateway configuration](/ja-JP/gateway/configuration) → `hooks`を参照してください。

## 設定（デフォルトで有効）

Control UIは、アセット（`dist/control-ui`）が存在する場合、**デフォルトで有効**です。
設定で制御できます。

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePathは任意
  },
}
```

## Tailscaleアクセス

### Integrated Serve（推奨）

Gatewayはloopbackのままにし、Tailscale Serveにプロキシさせます。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

その後、gatewayを起動します。

```bash
openclaw gateway
```

開く場所:

- `https://<magicdns>/`（または設定した`gateway.controlUi.basePath`）

### Tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

その後、gatewayを起動します（このnon-loopback例ではshared-secret token
authを使います）。

```bash
openclaw gateway
```

開く場所:

- `http://<tailscale-ip>:18789/`（または設定した`gateway.controlUi.basePath`）

### 公開インターネット（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // またはOPENCLAW_GATEWAY_PASSWORD
  },
}
```

## セキュリティに関する注意

- Gateway認証はデフォルトで必須です（token、password、trusted-proxy、または有効時のTailscale Serve identity header）。
- non-loopback bindでも引き続き**gateway認証が必須**です。実際には、token/password認証、または`gateway.auth.mode: "trusted-proxy"`を使うidentity-aware reverse proxyを意味します。
- ウィザードはデフォルトでshared-secret認証を作成し、通常は
  gateway tokenも生成します（loopbackでも）。
- shared-secretモードでは、UIは`connect.params.auth.token`または
  `connect.params.auth.password`を送信します。
- Tailscale Serveや`trusted-proxy`のようなidentity付きモードでは、
  WebSocket認証チェックは代わりにリクエストheaderから満たされます。
- non-loopback Control UIデプロイでは、`gateway.controlUi.allowedOrigins`
  を明示的に設定してください（完全なorigin）。これがない場合、gateway起動はデフォルトで拒否されます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`は
  Host-header origin fallbackモードを有効にしますが、危険なセキュリティ低下です。
- Serveでは、`gateway.auth.allowTailscale`が`true`なら、Tailscale identity headerがControl UI/WebSocket認証を満たせます（token/password不要）。
  HTTP API endpointはそれらのTailscale identity headerを使いません。代わりに、
  gatewayの通常のHTTP認証モードに従います。明示的な資格情報を必須にするには
  `gateway.auth.allowTailscale: false`を設定してください。参照:
  [Tailscale](/ja-JP/gateway/tailscale)および[Security](/ja-JP/gateway/security)。この
  tokenlessフローは、gatewayホストが信頼されている前提です。
- `gateway.tailscale.mode: "funnel"`には`gateway.auth.mode: "password"`（shared password）が必要です。

## UIのビルド

Gatewayは`dist/control-ui`から静的ファイルを配信します。次でビルドしてください。

```bash
pnpm ui:build
```
