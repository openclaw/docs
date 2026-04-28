---
read_when:
    - Tailscale経由でGatewayにアクセスしたい場合
    - ブラウザーControl UIとconfig編集が必要な場合
summary: 'Gateway Webサーフェス: Control UI、bind mode、およびセキュリティ'
title: Web
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T14:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gatewayは、Gateway WebSocketと同じポートから、小さな **ブラウザーControl UI**（Vite + Lit）を提供します:

- デフォルト: `http://<host>:18789/`
- `gateway.tls.enabled: true` の場合: `https://<host>:18789/`
- 任意のprefix: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

capabilityは [Control UI](/ja-JP/web/control-ui) にあります。
このページでは、bind mode、セキュリティ、およびWeb向けサーフェスに焦点を当てます。

## Webhook

`hooks.enabled=true` の場合、Gatewayは同じHTTPサーバー上で小さなWebhook endpointも公開します。
authとpayloadについては [Gateway configuration](/ja-JP/gateway/configuration) → `hooks` を参照してください。

## Config（デフォルト有効）

Control UIは、asset（`dist/control-ui`）が存在する場合、**デフォルトで有効** です。
configで制御できます:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath は任意
  },
}
```

## Tailscaleアクセス

### 統合Serve（推奨）

Gatewayはloopbackのままにし、Tailscale Serveにproxyさせます:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

その後、gatewayを起動します:

```bash
openclaw gateway
```

開くURL:

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

### tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

その後、gatewayを起動します（この非loopbackの例では共有secret token
authを使います）:

```bash
openclaw gateway
```

開くURL:

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

### パブリックインターネット（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // または OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## セキュリティに関する注意

- Gateway authはデフォルトで必須です（token、password、trusted-proxy、または有効時のTailscale Serve identity header）。
- 非loopback bindでも、引き続き **Gateway authが必須** です。実際には、token/password auth、または `gateway.auth.mode: "trusted-proxy"` を使うidentity-aware reverse proxyが必要です。
- ウィザードはデフォルトでshared-secret authを作成し、通常は
  gateway tokenも生成します（loopbackでも同様）。
- shared-secret modeでは、UIは `connect.params.auth.token` または
  `connect.params.auth.password` を送信します。
- `gateway.tls.enabled: true` の場合、ローカルdashboardとstatus helperは
  `https://` のdashboard URLと `wss://` のWebSocket URLを表示します。
- Tailscale Serveや `trusted-proxy` のようなアイデンティティを伴うモードでは、
  WebSocket authチェックは代わりにリクエストヘッダーから満たされます。
- 非loopbackのControl UIデプロイでは、`gateway.controlUi.allowedOrigins` を
  明示的に設定してください（完全なorigin）。これがない場合、gateway起動はデフォルトで拒否されます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host-header origin fallback modeを有効にしますが、危険なセキュリティ低下です。
- Serve使用時、`gateway.auth.allowTailscale` が `true` なら、Tailscale identity headerでControl UI/WebSocket authを満たせます（token/password不要）。
  HTTP API endpointはそれらのTailscale identity headerを使いません。代わりに、
  Gatewayの通常のHTTP auth modeに従います。明示的credentialを必須にするには
  `gateway.auth.allowTailscale: false` を設定してください。詳細は
  [Tailscale](/ja-JP/gateway/tailscale) と [Security](/ja-JP/gateway/security) を参照してください。この
  token不要フローは、gateway hostが信頼されている前提です。
- `gateway.tailscale.mode: "funnel"` には `gateway.auth.mode: "password"`（shared password）が必要です。

## UIのビルド

Gatewayは `dist/control-ui` から静的fileを配信します。次でビルドしてください:

```bash
pnpm ui:build
```
