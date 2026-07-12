---
read_when:
    - 你想要透過 Tailscale 存取閘道
    - 你想要瀏覽器控制介面和設定編輯功能
summary: 閘道 Web 介面：控制介面、繫結模式與安全性
title: 網頁
x-i18n:
    generated_at: "2026-07-11T21:56:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

閘道會從與閘道 WebSocket 相同的連接埠提供一個小型的**瀏覽器控制介面**（Vite + Lit）：

- 預設：`http://<host>:18789/`
- 使用 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 選用前綴：設定 `gateway.controlUi.basePath`（例如 `/openclaw`）

功能詳見[控制介面](/zh-TW/web/control-ui)。本頁說明繫結模式、安全性及其他面向網頁的介面。

## 設定（預設啟用）

資源存在時（`dist/control-ui`），控制介面會**預設啟用**：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath 為選用
  },
}
```

## 網路鉤子

當 `hooks.enabled=true` 時，閘道也會在同一個 HTTP 伺服器上公開網路鉤子端點。驗證方式與承載內容請參閱[閘道設定參考](/zh-TW/gateway/configuration-reference#hooks)中的 `hooks`。

## 管理 HTTP RPC

`POST /api/v1/admin/rpc` 透過 HTTP 公開特定的閘道控制平面方法。預設關閉；僅在啟用 `admin-http-rpc` 外掛時註冊。驗證模型、允許的方法，以及與 WebSocket API 的比較，請參閱[管理 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。

## Tailscale 存取

<Tabs>
  <Tab title="整合式 Serve（建議）">
    讓閘道維持在 local loopback，並由 Tailscale Serve 代理：

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

    開啟 `https://<magicdns>/`（或您設定的 `gateway.controlUi.basePath`）。

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

    啟動閘道（此非 local loopback 範例使用共用密鑰權杖驗證）：

    ```bash
    openclaw gateway
    ```

    開啟 `http://<tailscale-ip>:18789/`（或您設定的 `gateway.controlUi.basePath`）。

  </Tab>
  <Tab title="公用網際網路（Funnel）">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // 或 OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` 要求 `gateway.auth.mode: "password"`；Serve 與 Funnel 都要求 `gateway.bind: "loopback"`。

  </Tab>
</Tabs>

## 安全性注意事項

- 預設要求閘道驗證：權杖、密碼、受信任代理，或啟用時的 Tailscale Serve 身分標頭。
- 非 local loopback 繫結仍**要求**閘道驗證：權杖／密碼驗證，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。
- 上線精靈預設會建立共用密鑰驗證，而且通常會產生閘道權杖，即使使用 local loopback 亦然。
- 在共用密鑰模式下，介面會在 WebSocket 交握期間傳送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 使用 `gateway.tls.enabled: true` 時，本機儀表板／狀態輔助工具會呈現 `https://` URL 與 `wss://` WebSocket URL。
- 在包含身分資訊的模式（Tailscale Serve、`trusted-proxy`）中，WebSocket 驗證檢查會透過請求標頭完成，而非使用共用密鑰。
- 對於公開的非 local loopback 控制介面部署，請明確設定 `gateway.controlUi.allowedOrigins`（完整來源）。對於 local loopback、RFC1918／鏈路本機、`.local`、`.ts.net` 與 Tailscale CGNAT 主機，不需此設定也會接受私有的同源載入。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` 會啟用 Host 標頭來源後援；這是危險的安全性降級。
- 使用 Serve 時，若 `gateway.auth.allowTailscale: true`，Tailscale 身分標頭即可滿足控制介面／WebSocket 驗證（不需要權杖／密碼）。HTTP API 端點不使用 Tailscale 身分標頭；一律遵循閘道的一般 HTTP 驗證模式。設定 `gateway.auth.allowTailscale: false`，即可要求即使透過 Serve 也必須提供明確的認證資訊。此無權杖流程假設閘道主機本身可信任。請參閱 [Tailscale](/zh-TW/gateway/tailscale)與[安全性](/zh-TW/gateway/security)。

## 建置介面

閘道會從 `dist/control-ui` 提供靜態檔案：

```bash
pnpm ui:build
```
