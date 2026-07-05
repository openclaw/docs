---
read_when:
    - 將閘道控制介面公開到 localhost 之外
    - 自動化 tailnet 或公開儀表板存取
summary: 整合式 Tailscale Serve/Funnel，用於閘道儀表板
title: Tailscale
x-i18n:
    generated_at: "2026-07-05T11:23:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e9622024cd94f6fc45cf14a9ecc3e4bb2fc8c43b23d8c0210c3a512e0cdf6ef
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以為閘道儀表板與 WebSocket 連接埠自動設定 Tailscale **Serve**（tailnet）或 **Funnel**（公開）。這會讓閘道維持綁定在 loopback，同時由 Tailscale 提供 HTTPS、路由，以及（Serve 模式下的）身分標頭。

## 模式

`gateway.tailscale.mode`：

| 模式            | 行為                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | 透過 `tailscale serve` 提供僅限 tailnet 的 Serve。閘道會留在 `127.0.0.1`。 |
| `funnel`        | 透過 `tailscale funnel` 提供公開 HTTPS。需要共用密碼。            |
| `off`（預設） | 不進行 Tailscale 自動化。                                                    |

狀態與稽核輸出會使用 **Tailscale 暴露** 來表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 不管理 Serve 或 Funnel；這不表示本機 Tailscale 常駐程式已停止或登出。

## 設定範例

### 僅限 tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開啟：`https://<magicdns>/`（或你設定的 `gateway.controlUi.basePath`）

若要透過具名 Tailscale Service 暴露控制 UI，而不是使用裝置主機名稱，請將 `gateway.tailscale.serviceName` 設為該 Service 名稱：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

啟動時接著會回報 Service URL 為 `https://openclaw.<tailnet-name>.ts.net/`，而不是裝置主機名稱。Tailscale Services 要求主機必須是你 tailnet 中已核准的標記節點 — 請先在 Tailscale 中設定標記並核准 Service，再啟用此功能，否則 `tailscale serve --service=...` 會在閘道啟動期間失敗。

### 僅限 tailnet（綁定至 Tailnet IP）

使用此設定可讓閘道直接監聽 Tailnet IP，不使用 Serve/Funnel：

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

## 驗證

`gateway.auth.mode` 控制握手流程：

| 模式                                                   | 使用情境                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | 僅限私人入口                                                                |
| `token`（設定 `OPENCLAW_GATEWAY_TOKEN` 時的預設值） | 共用權杖                                                                        |
| `password`                                             | 透過 `OPENCLAW_GATEWAY_PASSWORD` 或設定檔提供共用密鑰                             |
| `trusted-proxy`                                        | 具身分感知能力的反向代理；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth) |

### Tailscale 身分標頭（僅限 Serve）

當 `tailscale.mode: "serve"` 且 `gateway.auth.allowTailscale` 為 `true` 時，控制 UI/WebSocket 驗證可以使用 Tailscale 身分標頭（`tailscale-user-login`），而不是權杖/密碼。OpenClaw 會透過本機 Tailscale 常駐程式（`tailscale whois`）解析請求的 `x-forwarded-for` 位址，並在接受前比對該位址與標頭登入資訊，以驗證此標頭。請求只有在從 loopback 抵達，並帶有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 標頭時，才符合此路徑資格。

此無權杖流程假設閘道主機可信任。如果不受信任的本機程式碼可能在同一台主機上執行，請設定 `gateway.auth.allowTailscale: false`，並改為要求權杖/密碼驗證。

略過範圍：

- 僅套用於控制 UI WebSocket 驗證介面。HTTP API 端點（`/v1/*`、`/tools/invoke`、`/api/channels/*` 等）絕不使用 Tailscale 身分標頭驗證；它們一律遵循閘道的一般 HTTP 驗證模式。
- 對於已帶有瀏覽器裝置身分的控制 UI 操作者工作階段，已驗證的 Tailscale 身分會略過啟動權杖/QR 配對往返流程。
- 這不會略過裝置身分本身：不含裝置的用戶端仍會被拒絕，且節點角色連線仍會通過一般配對與驗證檢查。

## 備註

- Tailscale Serve/Funnel 需要已安裝並登入的 `tailscale` 命令列介面。
- `tailscale.mode: "funnel"` 會拒絕啟動，除非驗證模式為 `password`，以避免公開暴露。
- `gateway.tailscale.serviceName` 僅套用於 Serve 模式，並會傳遞給 `tailscale serve --service=<name>`。其值必須使用 Tailscale 的 `svc:<dns-label>` 格式，例如 `svc:openclaw`。Tailscale 要求 Service 主機必須是已標記節點，且 Service 可能需要管理主控台核准，Serve 才能發布它。
- `gateway.tailscale.resetOnExit` 會在關閉時復原 `tailscale serve`/`tailscale funnel` 設定。
- `gateway.tailscale.preserveFunnel: true` 會讓外部設定的 `tailscale funnel` 路由在閘道重新啟動期間持續存在。搭配 `mode: "serve"` 時，OpenClaw 會先檢查 `tailscale funnel status`，再重新套用 Serve；如果已有 Funnel 路由涵蓋閘道連接埠，則會略過。OpenClaw 管理的 Funnel 僅限密碼政策不變。
- `gateway.bind: "tailnet"` 是直接 Tailnet 綁定（無 HTTPS，無 Serve/Funnel）。
- `gateway.bind: "auto"` 優先使用 loopback；若要僅限 Tailnet 綁定，請使用 `tailnet`。
- Serve/Funnel 只會暴露**閘道控制 UI + WS**。節點會透過同一個閘道 WS 端點連線，因此 Serve 也適用於節點存取。

### Tailscale 先決條件與限制

- Serve 要求你的 tailnet 已啟用 HTTPS；若缺少，命令列介面會提示。
- Serve 會注入 Tailscale 身分標頭；Funnel 不會。
- Funnel 需要 Tailscale v1.38.3+、MagicDNS、已啟用 HTTPS，以及 funnel 節點屬性。
- Funnel 透過 TLS 僅支援連接埠 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要開放原始碼的 Tailscale 應用程式變體。

## 瀏覽器控制（遠端閘道 + 本機瀏覽器）

若要在一台機器上執行閘道，但驅動另一台機器上的瀏覽器，請在瀏覽器機器上執行**節點主機**，並讓兩者維持在同一個 tailnet。閘道會將瀏覽器動作代理到該節點；不需要個別的控制伺服器或 Serve URL。

請避免將 Funnel 用於瀏覽器控制；請將節點配對視為操作者存取。

## 進一步了解

- Tailscale Serve 概觀：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概觀：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [探索](/zh-TW/gateway/discovery)
- [驗證](/zh-TW/gateway/authentication)
