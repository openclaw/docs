---
read_when:
    - 將 Gateway 控制 UI 暴露在 localhost 之外
    - 自動化尾端網路或公開儀表板存取
summary: 為 Gateway 儀表板整合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T03:09:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以自動設定 Tailscale **Serve**（tailnet）或 **Funnel**（公開）供
Gateway 儀表板與 WebSocket 連接埠使用。這會讓 Gateway 繫結在回送位址，同時由
Tailscale 提供 HTTPS、路由，以及（針對 Serve）身分標頭。

## 模式

- `serve`：透過 `tailscale serve` 使用僅限 tailnet 的 Serve。Gateway 會維持在 `127.0.0.1`。
- `funnel`：透過 `tailscale funnel` 使用公開 HTTPS。OpenClaw 需要共用密碼。
- `off`：預設值（無 Tailscale 自動化）。

狀態與稽核輸出會使用 **Tailscale 暴露** 來表示這個 OpenClaw Serve/Funnel
模式。`off` 表示 OpenClaw 未管理 Serve 或 Funnel；這不表示本機
Tailscale daemon 已停止或登出。

## 身份驗證

設定 `gateway.auth.mode` 以控制交握：

- `none`（僅限私人入口）
- `token`（設定 `OPENCLAW_GATEWAY_TOKEN` 時的預設值）
- `password`（透過 `OPENCLAW_GATEWAY_PASSWORD` 或設定檔使用共用密鑰）
- `trusted-proxy`（具身分感知能力的反向代理；請參閱[受信任代理身份驗證](/zh-TW/gateway/trusted-proxy-auth)）

當 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 為 `true` 時，
Control UI/WebSocket 身份驗證可以使用 Tailscale 身分標頭
（`tailscale-user-login`），而不需要提供權杖/密碼。OpenClaw 會透過本機 Tailscale
daemon（`tailscale whois`）解析 `x-forwarded-for` 位址，並在接受之前將其與標頭比對，以驗證
該身分。
OpenClaw 只有在請求來自回送位址，且帶有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 與 `x-forwarded-host`
標頭時，才會將請求視為 Serve。
對於包含瀏覽器裝置身分的 Control UI 操作者工作階段，這個已驗證的 Serve 路徑也會略過裝置配對往返。它不會繞過
瀏覽器裝置身分：沒有裝置身分的用戶端仍會被拒絕，而節點角色
或非 Control UI 的 WebSocket 連線仍會遵循一般配對與
身份驗證檢查。
HTTP API 端點（例如 `/v1/*`、`/tools/invoke` 與 `/api/channels/*`）
**不會**使用 Tailscale 身分標頭身份驗證。它們仍會遵循 Gateway 的
一般 HTTP 身份驗證模式：預設為共用密鑰身份驗證，或是刻意設定的
受信任代理 / 私人入口 `none` 設定。
這個無權杖流程假設 Gateway 主機是受信任的。如果不受信任的本機程式碼
可能在同一台主機上執行，請停用 `gateway.auth.allowTailscale`，並改為要求
權杖/密碼身份驗證。
若要要求明確的共用密鑰憑證，請設定 `gateway.auth.allowTailscale: false`
並使用 `gateway.auth.mode: "token"` 或 `"password"`。

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

### 僅限 Tailnet（繫結至 Tailnet IP）

當你希望 Gateway 直接在 Tailnet IP 上監聽時使用此設定（無 Serve/Funnel）。

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
在此模式中，回送位址（`http://127.0.0.1:18789`）將**無法**運作。
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

建議使用 `OPENCLAW_GATEWAY_PASSWORD`，而不是將密碼提交到磁碟。

## CLI 範例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事項

- Tailscale Serve/Funnel 需要已安裝且已登入的 `tailscale` CLI。
- `tailscale.mode: "funnel"` 會拒絕啟動，除非身份驗證模式為 `password`，以避免公開暴露。
- 如果你希望 OpenClaw 在關閉時復原 `tailscale serve`
  或 `tailscale funnel` 設定，請設定 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接 Tailnet 繫結（無 HTTPS、無 Serve/Funnel）。
- `gateway.bind: "auto"` 偏好回送位址；如果你想要僅限 Tailnet，請使用 `tailnet`。
- Serve/Funnel 只會暴露 **Gateway 控制 UI + WS**。節點會透過
  相同的 Gateway WS 端點連線，因此 Serve 可用於節點存取。

## 瀏覽器控制（遠端 Gateway + 本機瀏覽器）

如果你在一台機器上執行 Gateway，但想驅動另一台機器上的瀏覽器，
請在瀏覽器所在機器上執行**節點主機**，並讓兩者保持在同一個 tailnet。
Gateway 會將瀏覽器動作代理至該節點；不需要另外的控制伺服器或 Serve URL。

避免將 Funnel 用於瀏覽器控制；請將節點配對視為操作者存取。

## Tailscale 先決條件 + 限制

- Serve 需要為你的 tailnet 啟用 HTTPS；若缺少此設定，CLI 會提示。
- Serve 會注入 Tailscale 身分標頭；Funnel 不會。
- Funnel 需要 Tailscale v1.38.3+、MagicDNS、已啟用 HTTPS，以及 funnel 節點屬性。
- Funnel 只支援透過 TLS 使用連接埠 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要開放原始碼的 Tailscale app 變體。

## 了解更多

- Tailscale Serve 概覽：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 指令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概覽：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 指令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [探索](/zh-TW/gateway/discovery)
- [身份驗證](/zh-TW/gateway/authentication)
