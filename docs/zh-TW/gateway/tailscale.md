---
read_when:
    - 將閘道控制介面公開到 localhost 之外
    - 自動化 tailnet 或公開儀表板存取
summary: 用於閘道儀表板的整合式 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T19:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以為閘道儀表板與 WebSocket 連接埠自動設定 Tailscale **Serve**（tailnet）或 **Funnel**（公開）。這會讓閘道繫結在 loopback，同時由 Tailscale 提供 HTTPS、路由，以及（對 Serve 而言）身分標頭。

## 模式

- `serve`：透過 `tailscale serve` 使用僅限 Tailnet 的 Serve。閘道會維持在 `127.0.0.1`。
- `funnel`：透過 `tailscale funnel` 使用公開 HTTPS。OpenClaw 需要共用密碼。
- `off`：預設值（不使用 Tailscale 自動化）。

狀態與稽核輸出會使用 **Tailscale 暴露** 來表示這個 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 未管理 Serve 或 Funnel；不代表本機 Tailscale 常駐程式已停止或已登出。

## 驗證

設定 `gateway.auth.mode` 以控制交握：

- `none`（僅限私人入口）
- `token`（設定 `OPENCLAW_GATEWAY_TOKEN` 時的預設值）
- `password`（透過 `OPENCLAW_GATEWAY_PASSWORD` 或設定檔提供共用密鑰）
- `trusted-proxy`（具身分感知的反向代理；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）

當 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 為 `true` 時，控制 UI/WebSocket 驗證可使用 Tailscale 身分標頭（`tailscale-user-login`），不需提供 token/密碼。OpenClaw 會透過本機 Tailscale 常駐程式（`tailscale whois`）解析 `x-forwarded-for` 位址，並在接受前比對該位址與標頭，以驗證身分。OpenClaw 只會在請求來自 loopback，且帶有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 與 `x-forwarded-host` 標頭時，才將請求視為 Serve。
對於包含瀏覽器裝置身分的控制 UI 操作者工作階段，此已驗證的 Serve 路徑也會略過裝置配對往返。這不會繞過瀏覽器裝置身分：沒有裝置的用戶端仍會被拒絕，而 node-role 或非控制 UI 的 WebSocket 連線仍會遵循一般配對與驗證檢查。
HTTP API 端點（例如 `/v1/*`、`/tools/invoke` 與 `/api/channels/*`）**不會**使用 Tailscale 身分標頭驗證。它們仍會遵循閘道的一般 HTTP 驗證模式：預設使用共用密鑰驗證，或使用刻意設定的 trusted-proxy / private-ingress `none` 設定。
這個無 token 流程假設閘道主機可信任。如果不受信任的本機程式碼可能在同一台主機上執行，請停用 `gateway.auth.allowTailscale`，改為要求 token/密碼驗證。
若要要求明確的共用密鑰憑證，請設定 `gateway.auth.allowTailscale: false`，並使用 `gateway.auth.mode: "token"` 或 `"password"`。

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

若要透過具名 Tailscale Service 暴露控制 UI，而不是使用裝置主機名稱，請將 `gateway.tailscale.serviceName` 設為 Service 名稱：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

使用上述範例時，啟動時會將 Service URL 回報為 `https://openclaw.<tailnet-name>.ts.net/`，而不是裝置主機名稱。Tailscale Services 要求主機是你 tailnet 中已核准的標記節點。啟用此選項前，請先在 Tailscale 中設定標籤並核准 Service，否則 `tailscale serve --service=...` 會在閘道啟動期間失敗。

### 僅限 Tailnet（繫結至 Tailnet IP）

當你希望閘道直接在 Tailnet IP 上監聽時使用此模式（不使用 Serve/Funnel）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

從另一台 Tailnet 裝置連線：

- 控制 UI：`http://<tailscale-ip>:18789/`
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

## 命令列介面範例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事項

- Tailscale Serve/Funnel 需要已安裝並已登入的 `tailscale` 命令列介面。
- `tailscale.mode: "funnel"` 會拒絕啟動，除非驗證模式是 `password`，以避免公開暴露。
- `gateway.tailscale.serviceName` 僅適用於 Serve 模式，並會傳給 `tailscale serve --service=<name>`。該值必須使用 Tailscale 的 `svc:<dns-label>` Service 名稱格式，例如 `svc:openclaw`。Tailscale 要求 Service 主機必須是已標記節點，而且 Service 可能需要先在管理控制台核准，Serve 才能發布它。
- 如果你希望 OpenClaw 在關閉時復原 `tailscale serve` 或 `tailscale funnel` 設定，請設定 `gateway.tailscale.resetOnExit`。
- 設定 `gateway.tailscale.preserveFunnel: true`，可讓外部設定的 `tailscale funnel` 路由在閘道重新啟動後保持作用中。啟用後，若閘道以 `mode: "serve"` 執行，OpenClaw 會在重新套用 Serve 前檢查 `tailscale funnel status`，並在已有 Funnel 路由涵蓋閘道連接埠時略過。OpenClaw 管理的 Funnel 僅限密碼政策不變。
- `gateway.bind: "tailnet"` 是直接 Tailnet 繫結（沒有 HTTPS、沒有 Serve/Funnel）。
- `gateway.bind: "auto"` 會優先使用 loopback；如果你想要僅限 Tailnet，請使用 `tailnet`。
- Serve/Funnel 只會暴露**閘道控制 UI + WS**。節點會透過相同的閘道 WS 端點連線，因此 Serve 可用於節點存取。

## 瀏覽器控制（遠端閘道 + 本機瀏覽器）

如果你在一台機器上執行閘道，但想在另一台機器上驅動瀏覽器，請在瀏覽器所在機器上執行**節點主機**，並讓兩者位於同一個 tailnet。閘道會將瀏覽器動作代理到該節點；不需要另外的控制伺服器或 Serve URL。

避免將 Funnel 用於瀏覽器控制；請將節點配對視同操作者存取。

## Tailscale 先決條件 + 限制

- Serve 要求你的 tailnet 已啟用 HTTPS；如果缺少，命令列介面會提示。
- Serve 會注入 Tailscale 身分標頭；Funnel 不會。
- Funnel 需要 Tailscale v1.38.3+、MagicDNS、已啟用 HTTPS，以及 funnel 節點屬性。
- Funnel 透過 TLS 僅支援連接埠 `443`、`8443` 與 `10000`。
- macOS 上的 Funnel 需要開放原始碼的 Tailscale app 版本。

## 深入了解

- Tailscale Serve 概觀：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概觀：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [探索](/zh-TW/gateway/discovery)
- [驗證](/zh-TW/gateway/authentication)
