---
read_when:
    - 您想要透過 Tailscale 存取閘道
    - 你想使用瀏覽器控制使用者介面和設定編輯
summary: 閘道網頁介面：控制介面、綁定模式與安全性
title: 網頁
x-i18n:
    generated_at: "2026-06-27T20:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

閘道會從與閘道 WebSocket 相同的連接埠提供一個小型**瀏覽器控制介面**（Vite + Lit）：

- 預設：`http://<host>:18789/`
- 使用 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

功能詳見[控制介面](/zh-TW/web/control-ui)。本頁其餘部分聚焦於繫結模式、安全性，以及面向網路的介面。

## 網路鉤子

當 `hooks.enabled=true` 時，閘道也會在同一個 HTTP 伺服器上公開一個小型網路鉤子端點。
請參閱[閘道設定](/zh-TW/gateway/configuration) → `hooks`，了解驗證與承載資料。

## 管理 HTTP RPC

管理 HTTP RPC 會在 `POST /api/v1/admin/rpc` 公開選定的閘道控制平面方法。
它預設關閉，且只有在啟用 `admin-http-rpc` 外掛時才會註冊。
請參閱[管理 HTTP RPC](/zh-TW/plugins/admin-http-rpc)，了解驗證模型、允許的方法，以及與 WebSocket 的比較。

## 設定（預設開啟）

當資產存在時（`dist/control-ui`），控制介面會**預設啟用**。
你可以透過設定控制它：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale 存取

### 整合式 Serve（建議）

將閘道保留在 loopback，並讓 Tailscale Serve 代理它：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

接著啟動閘道：

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

接著啟動閘道（這個非 loopback 範例使用共享祕密權杖驗證）：

```bash
openclaw gateway
```

開啟：

- `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）

### 公開網際網路（Funnel）

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

- 閘道驗證預設為必須（權杖、密碼、受信任代理，或啟用時的 Tailscale Serve 身分標頭）。
- 非 loopback 繫結仍然**需要**閘道驗證。實務上，這表示使用權杖/密碼驗證，或搭配 `gateway.auth.mode: "trusted-proxy"` 的具身分感知反向代理。
- 精靈預設會建立共享祕密驗證，而且通常會產生閘道權杖（即使在 loopback 上也是）。
- 在共享祕密模式中，介面會傳送 `connect.params.auth.token` 或
  `connect.params.auth.password`。
- 當 `gateway.tls.enabled: true` 時，本機儀表板與狀態輔助工具會轉譯
  `https://` 儀表板 URL 和 `wss://` WebSocket URL。
- 在 Tailscale Serve 或 `trusted-proxy` 這類帶有身分的模式中，WebSocket 驗證檢查改由請求標頭滿足。
- 對於公開的非 loopback 控制介面部署，請明確設定 `gateway.controlUi.allowedOrigins`
  （完整來源）。私有同源 LAN/Tailnet 載入會接受 loopback、
  RFC1918/link-local、`.local`、`.ts.net`，以及 Tailscale CGNAT 主機。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 會啟用
  Host 標頭來源後援模式，但這是危險的安全性降級。
- 使用 Serve 時，當 `gateway.auth.allowTailscale` 為 `true`，Tailscale 身分標頭可以滿足控制介面/WebSocket 驗證
  （不需要權杖/密碼）。
  HTTP API 端點不使用那些 Tailscale 身分標頭；它們會改為遵循閘道的一般 HTTP 驗證模式。設定
  `gateway.auth.allowTailscale: false` 以要求明確憑證。請參閱
  [Tailscale](/zh-TW/gateway/tailscale) 和[安全性](/zh-TW/gateway/security)。這個無權杖流程假設閘道主機是受信任的。
- `gateway.tailscale.mode: "funnel"` 需要 `gateway.auth.mode: "password"`（共享密碼）。

## 建置介面

閘道會從 `dist/control-ui` 提供靜態檔案。使用以下命令建置它們：

```bash
pnpm ui:build
```
