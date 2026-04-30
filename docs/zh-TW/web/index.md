---
read_when:
    - 您想透過 Tailscale 存取 Gateway
    - 你需要瀏覽器控制介面與設定編輯功能
summary: Gateway 網頁介面：控制介面、綁定模式與安全性
title: 網頁
x-i18n:
    generated_at: "2026-04-30T03:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

Gateway 會從與 Gateway WebSocket 相同的連接埠提供一個小型的**瀏覽器控制 UI**（Vite + Lit）：

- 預設：`http://<host>:18789/`
- 使用 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 選用前置路徑：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

功能位於[控制 UI](/zh-TW/web/control-ui)。本頁其餘內容著重於繫結模式、安全性，以及面向 Web 的介面。

## Webhook

當 `hooks.enabled=true` 時，Gateway 也會在同一個 HTTP 伺服器上公開一個小型 Webhook 端點。
請參閱 [Gateway 設定](/zh-TW/gateway/configuration) → `hooks` 以了解驗證與酬載。

## 設定（預設開啟）

當資源存在（`dist/control-ui`）時，控制 UI 會**預設啟用**。
你可以透過設定控制它：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale 存取

### 整合 Serve（建議）

讓 Gateway 保持在 loopback 上，並讓 Tailscale Serve 代理它：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

接著啟動 gateway：

```bash
openclaw gateway
```

開啟：

- `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

### Tailnet 繫結 + 權杖

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

接著啟動 gateway（這個非 loopback 範例使用共享秘密權杖
驗證）：

```bash
openclaw gateway
```

開啟：

- `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

### 公共網際網路（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 安全性注意事項

- Gateway 驗證預設為必要（啟用時可使用權杖、密碼、受信任代理，或 Tailscale Serve 身分標頭）。
- 非 loopback 繫結仍然**需要** gateway 驗證。實務上，這表示使用權杖/密碼驗證，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- 精靈預設會建立共享秘密驗證，且通常會產生
  gateway 權杖（即使在 loopback 上）。
- 在共享秘密模式中，UI 會傳送 `connect.params.auth.token` 或
  `connect.params.auth.password`。
- 當 `gateway.tls.enabled: true` 時，本機儀表板與狀態輔助工具會呈現
  `https://` 儀表板 URL 和 `wss://` WebSocket URL。
- 在 Tailscale Serve 或 `trusted-proxy` 等帶有身分的模式中，
  WebSocket 驗證檢查會改由請求標頭滿足。
- 對於非 loopback 的控制 UI 部署，請明確設定 `gateway.controlUi.allowedOrigins`
  （完整來源）。若未設定，gateway 啟動預設會被拒絕。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用
  Host 標頭來源後援模式，但這是危險的安全性降級。
- 使用 Serve 時，當 `gateway.auth.allowTailscale` 為 `true`，Tailscale 身分標頭可以滿足控制 UI/WebSocket 驗證
  （不需要權杖/密碼）。
  HTTP API 端點不使用這些 Tailscale 身分標頭；它們會改為遵循
  gateway 的一般 HTTP 驗證模式。設定
  `gateway.auth.allowTailscale: false` 以要求明確憑證。請參閱
  [Tailscale](/zh-TW/gateway/tailscale) 和[安全性](/zh-TW/gateway/security)。此
  無權杖流程假設 gateway 主機是受信任的。
- `gateway.tailscale.mode: "funnel"` 需要 `gateway.auth.mode: "password"`（共享密碼）。

## 建置 UI

Gateway 會從 `dist/control-ui` 提供靜態檔案。使用以下指令建置：

```bash
pnpm ui:build
```
