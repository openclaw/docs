---
read_when:
    - 將 Gateway 控制介面公開到本機之外
    - 自動化 tailnet 或公開儀表板存取
summary: 為 Gateway 儀表板整合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:36:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以自動設定 Tailscale **Serve**（tailnet）或 **Funnel**（公開）給 Gateway 儀表板和 WebSocket 連接埠使用。這會讓 Gateway 維持繫結到 loopback，同時由 Tailscale 提供 HTTPS、路由，以及（Serve 模式下的）身分標頭。

## 模式

- `serve`：透過 `tailscale serve` 啟用僅限 Tailnet 的 Serve。gateway 會保持在 `127.0.0.1`。
- `funnel`：透過 `tailscale funnel` 啟用公開 HTTPS。OpenClaw 需要共用密碼。
- `off`：預設值（沒有 Tailscale 自動化）。

狀態與稽核輸出會使用 **Tailscale 曝露** 表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 沒有管理 Serve 或 Funnel；這不代表本機 Tailscale daemon 已停止或已登出。

## 驗證

設定 `gateway.auth.mode` 以控制握手：

- `none`（僅限私人入口）
- `token`（設定 `OPENCLAW_GATEWAY_TOKEN` 時的預設值）
- `password`（透過 `OPENCLAW_GATEWAY_PASSWORD` 或設定檔提供的共用祕密）
- `trusted-proxy`（具身分感知的反向 Proxy；請參閱 [可信 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）

當 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 為 `true` 時，Control UI/WebSocket 驗證可以使用 Tailscale 身分標頭（`tailscale-user-login`），而不需要提供 token/密碼。OpenClaw 會透過本機 Tailscale daemon（`tailscale whois`）解析 `x-forwarded-for` 位址，並在接受前將其與標頭比對，以驗證身分。OpenClaw 只有在請求來自 loopback，且帶有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 與 `x-forwarded-host` 標頭時，才會將請求視為 Serve。
對於包含瀏覽器裝置身分的 Control UI 操作者工作階段，此已驗證的 Serve 路徑也會略過裝置配對往返。它不會繞過瀏覽器裝置身分：沒有裝置的用戶端仍會被拒絕，而 node-role 或非 Control UI WebSocket 連線仍會遵循一般配對與驗證檢查。
HTTP API 端點（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）**不會**使用 Tailscale 身分標頭驗證。它們仍會遵循 gateway 的一般 HTTP 驗證模式：預設為共用祕密驗證，或刻意設定的可信 Proxy / 私人入口 `none` 設定。
此無 token 流程假設 gateway 主機受信任。如果不受信任的本機程式碼可能在同一台主機上執行，請停用 `gateway.auth.allowTailscale`，改為要求 token/密碼驗證。
若要要求明確的共用祕密憑證，請設定 `gateway.auth.allowTailscale: false`，並使用 `gateway.auth.mode: "token"` 或 `"password"`。

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

### 僅限 Tailnet（繫結到 Tailnet IP）

當你希望 Gateway 直接監聽 Tailnet IP（不使用 Serve/Funnel）時使用此設定。

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

請優先使用 `OPENCLAW_GATEWAY_PASSWORD`，不要將密碼提交到磁碟。

## CLI 範例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事項

- Tailscale Serve/Funnel 需要安裝 `tailscale` CLI 並已登入。
- `tailscale.mode: "funnel"` 會拒絕啟動，除非驗證模式為 `password`，以避免公開曝露。
- 如果你希望 OpenClaw 在關閉時復原 `tailscale serve` 或 `tailscale funnel` 設定，請設定 `gateway.tailscale.resetOnExit`。
- 設定 `gateway.tailscale.preserveFunnel: true` 可在 gateway 重新啟動之間保留外部設定的 `tailscale funnel` 路由。啟用後，當 gateway 以 `mode: "serve"` 執行時，OpenClaw 會在重新套用 Serve 前檢查 `tailscale funnel status`，並在已有 Funnel 路由涵蓋 gateway 連接埠時略過。OpenClaw 管理的 Funnel 僅限密碼政策不變。
- `gateway.bind: "tailnet"` 是直接 Tailnet 繫結（無 HTTPS、無 Serve/Funnel）。
- `gateway.bind: "auto"` 會優先使用 loopback；如果你想要僅限 Tailnet，請使用 `tailnet`。
- Serve/Funnel 只會曝露 **Gateway 控制 UI + WS**。節點會透過相同的 Gateway WS 端點連線，因此 Serve 可用於節點存取。

## 瀏覽器控制（遠端 Gateway + 本機瀏覽器）

如果你在一台機器上執行 Gateway，但想驅動另一台機器上的瀏覽器，請在瀏覽器所在機器上執行**節點主機**，並讓兩者保持在同一個 tailnet。
Gateway 會將瀏覽器操作代理到節點；不需要額外的控制伺服器或 Serve URL。

請避免將 Funnel 用於瀏覽器控制；將節點配對視同操作者存取處理。

## Tailscale 先決條件與限制

- Serve 需要你的 tailnet 啟用 HTTPS；如果缺少，CLI 會提示。
- Serve 會注入 Tailscale 身分標頭；Funnel 不會。
- Funnel 需要 Tailscale v1.38.3+、MagicDNS、已啟用 HTTPS，以及 funnel 節點屬性。
- Funnel 透過 TLS 僅支援連接埠 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要開源 Tailscale app 變體。

## 了解更多

- Tailscale Serve 概覽：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 指令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概覽：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 指令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [探索](/zh-TW/gateway/discovery)
- [驗證](/zh-TW/gateway/authentication)
