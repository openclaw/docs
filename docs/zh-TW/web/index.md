---
read_when:
    - 你想透過 Tailscale 存取閘道
    - 你想要瀏覽器控制 UI 和設定編輯
summary: 閘道網頁介面：Control UI、綁定模式與安全性
title: 網頁
x-i18n:
    generated_at: "2026-07-05T11:48:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

閘道會從與閘道 WebSocket 相同的連接埠提供一個小型**瀏覽器 Control UI**（Vite + Lit）：

- 預設：`http://<host>:18789/`
- 搭配 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

功能位於 [Control UI](/zh-TW/web/control-ui)。本頁涵蓋繫結模式、安全性，以及其他面向 Web 的介面。

## 設定（預設開啟）

當資產存在時（`dist/control-ui`），Control UI 會**預設啟用**：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath 選用
  },
}
```

## 網路鉤子

當 `hooks.enabled=true` 時，閘道也會在同一個 HTTP 伺服器上公開網路鉤子端點。關於驗證和承載資料，請參閱 [閘道設定參考](/zh-TW/gateway/configuration-reference#hooks) 中的 `hooks`。

## 管理 HTTP RPC

`POST /api/v1/admin/rpc` 會透過 HTTP 公開選定的閘道控制平面方法。預設關閉；只有在啟用 `admin-http-rpc` 外掛時才會註冊。關於驗證模型、允許的方法，以及與 WebSocket API 的比較，請參閱 [管理 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。

## Tailscale 存取

<Tabs>
  <Tab title="整合式 Serve（建議）">
    讓閘道維持在 local loopback，並讓 Tailscale Serve 代理它：

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    啟動閘道：

    ```bash
    openclaw gateway
    ```

    開啟 `https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）。

  </Tab>
  <Tab title="Tailnet 繫結 + 權杖">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    啟動閘道（這個非 loopback 範例使用共享祕密權杖驗證）：

    ```bash
    openclaw gateway
    ```

    開啟 `http://<tailscale-ip>:18789/`（或你設定的 `gateway.controlUi.basePath`）。

  </Tab>
  <Tab title="公共網際網路（Funnel）">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // 或 OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` 需要 `gateway.auth.mode: "password"`；Serve 和 Funnel 都需要 `gateway.bind: "loopback"`。

  </Tab>
</Tabs>

## 安全性注意事項

- 預設需要閘道驗證：權杖、密碼、受信任代理，或啟用時的 Tailscale Serve 身分標頭。
- 非 loopback 繫結仍然**需要**閘道驗證：權杖/密碼驗證，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- 入門精靈預設會建立共享祕密驗證，且通常會產生閘道權杖，即使在 loopback 上也是如此。
- 在共享祕密模式中，UI 會在 WebSocket 交握期間傳送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 搭配 `gateway.tls.enabled: true` 時，本機儀表板/狀態輔助程式會呈現 `https://` URL 和 `wss://` WebSocket URL。
- 在帶有身分的模式中（Tailscale Serve、`trusted-proxy`），WebSocket 驗證檢查會由請求標頭滿足，而不是使用共享祕密。
- 對於公開的非 loopback Control UI 部署，請明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。私有同源載入在 loopback、RFC1918/link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主機上即使未設定也會被接受。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` 會啟用 Host 標頭來源備援；這是危險的安全性降級。
- 使用 Serve 時，當 `gateway.auth.allowTailscale: true`，Tailscale 身分標頭會滿足 Control UI/WebSocket 驗證（不需要權杖/密碼）。HTTP API 端點不使用 Tailscale 身分標頭；它們一律遵循閘道的一般 HTTP 驗證模式。設定 `gateway.auth.allowTailscale: false` 可要求即使透過 Serve 也必須提供明確憑證。這個無權杖流程假設閘道主機本身受信任。請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和 [安全性](/zh-TW/gateway/security)。

## 建置 UI

閘道會從 `dist/control-ui` 提供靜態檔案：

```bash
pnpm ui:build
```
