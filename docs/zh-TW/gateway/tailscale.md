---
read_when:
    - 將 Gateway 控制 UI 暴露到 localhost 之外
    - 自動化 tailnet 或公開儀表板存取
summary: 為 Gateway 儀表板整合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以為 Gateway 儀表板與 WebSocket 連接埠自動設定 Tailscale **Serve** (tailnet) 或 **Funnel** (公開)。這會讓 Gateway 綁定在 loopback，同時由 Tailscale 提供 HTTPS、路由，以及（對 Serve 而言）身分標頭。

## 模式

- `serve`：透過 `tailscale serve` 使用僅限 tailnet 的 Serve。Gateway 仍位於 `127.0.0.1`。
- `funnel`：透過 `tailscale funnel` 使用公開 HTTPS。OpenClaw 需要共用密碼。
- `off`：預設值（不進行 Tailscale 自動化）。

狀態與稽核輸出會使用 **Tailscale 曝露** 表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 未管理 Serve 或 Funnel；這不表示本機 Tailscale daemon 已停止或登出。

## 驗證

設定 `gateway.auth.mode` 以控制握手：

- `none`（僅私人入口）
- `token`（設定 `OPENCLAW_GATEWAY_TOKEN` 時的預設值）
- `password`（透過 `OPENCLAW_GATEWAY_PASSWORD` 或設定檔提供共用秘密）
- `trusted-proxy`（具備身分感知能力的反向代理；請參閱 [可信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）

當 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket 驗證可以使用 Tailscale 身分標頭（`tailscale-user-login`），而不需要提供 token/密碼。OpenClaw 會透過本機 Tailscale daemon（`tailscale whois`）解析 `x-forwarded-for` 位址，並在接受之前確認它與標頭相符，以驗證身分。OpenClaw 只會在請求來自 loopback，且帶有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 與 `x-forwarded-host` 標頭時，將請求視為 Serve。
對於包含瀏覽器裝置身分的 Control UI 操作者工作階段，此已驗證的 Serve 路徑也會略過裝置配對往返。它不會繞過瀏覽器裝置身分：沒有裝置的用戶端仍會被拒絕，而節點角色或非 Control UI 的 WebSocket 連線仍會遵循正常的配對與驗證檢查。
HTTP API 端點（例如 `/v1/*`、`/tools/invoke` 與 `/api/channels/*`）**不會**使用 Tailscale 身分標頭驗證。它們仍會遵循 Gateway 的一般 HTTP 驗證模式：預設使用共用秘密驗證，或使用刻意設定的可信任代理 / 私人入口 `none` 設定。
此無 token 流程假設 Gateway 主機是受信任的。如果不受信任的本機程式碼可能在同一主機上執行，請停用 `gateway.auth.allowTailscale`，並改為要求 token/密碼驗證。
若要要求明確的共用秘密憑證，請設定 `gateway.auth.allowTailscale: false`，並使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 設定範例

### 僅限 Tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開啟：`https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

### 僅限 Tailnet（綁定至 Tailnet IP）

當你希望 Gateway 直接監聽 Tailnet IP（不使用 Serve/Funnel）時，請使用此設定。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

從另一部 Tailnet 裝置連線：

- Control UI：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

<Note>
Loopback（`http://127.0.0.1:18789`）在此模式下**無法**運作。
</Note>

### 公開網際網路（Funnel + 共用密碼）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

請優先使用 `OPENCLAW_GATEWAY_PASSWORD`，而不是將密碼提交到磁碟。

## CLI 範例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事項

- Tailscale Serve/Funnel 需要已安裝並登入 `tailscale` CLI。
- `tailscale.mode: "funnel"` 會拒絕在驗證模式不是 `password` 時啟動，以避免公開曝露。
- 如果你希望 OpenClaw 在關閉時復原 `tailscale serve` 或 `tailscale funnel` 設定，請設定 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接綁定 Tailnet（無 HTTPS、無 Serve/Funnel）。
- `gateway.bind: "auto"` 會優先使用 loopback；如果你需要僅限 Tailnet，請使用 `tailnet`。
- Serve/Funnel 只會曝露 **Gateway control UI + WS**。節點會透過相同的 Gateway WS 端點連線，因此 Serve 可用於節點存取。

## 瀏覽器控制（遠端 Gateway + 本機瀏覽器）

如果你在一台機器上執行 Gateway，但想驅動另一台機器上的瀏覽器，請在瀏覽器機器上執行**節點主機**，並讓兩者位於同一個 tailnet。
Gateway 會將瀏覽器動作代理到該節點；不需要額外的控制伺服器或 Serve URL。

避免將 Funnel 用於瀏覽器控制；請將節點配對視為與操作者存取相同。

## Tailscale 先決條件與限制

- Serve 需要你的 tailnet 已啟用 HTTPS；若缺少，CLI 會提示。
- Serve 會注入 Tailscale 身分標頭；Funnel 不會。
- Funnel 需要 Tailscale v1.38.3+、MagicDNS、已啟用 HTTPS，以及 funnel 節點屬性。
- Funnel 只支援透過 TLS 使用連接埠 `443`、`8443` 與 `10000`。
- macOS 上的 Funnel 需要開源版本的 Tailscale app。

## 深入了解

- Tailscale Serve 概觀：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 指令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概觀：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 指令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [探索](/zh-TW/gateway/discovery)
- [驗證](/zh-TW/gateway/authentication)
