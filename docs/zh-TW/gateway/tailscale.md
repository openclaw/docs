---
read_when:
    - 在 localhost 之外公開閘道控制介面
    - 自動化 tailnet 或公開儀表板存取
summary: 為閘道儀表板整合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-11T21:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可為閘道儀表板和 WebSocket 連接埠自動設定 Tailscale **Serve**（tailnet）或 **Funnel**（公開）。如此可讓閘道維持繫結至 local loopback，同時由 Tailscale 提供 HTTPS、路由，以及（對 Serve 而言）身分標頭。

## 模式

`gateway.tailscale.mode`：

| 模式            | 行為                                                                            |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | 透過 `tailscale serve` 提供僅限 Tailnet 的 Serve。閘道維持在 `127.0.0.1`。 |
| `funnel`        | 透過 `tailscale funnel` 提供公開 HTTPS。需要共用密碼。            |
| `off`（預設） | 不啟用 Tailscale 自動化。                                                    |

狀態與稽核輸出會使用 **Tailscale 公開範圍** 表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 不會管理 Serve 或 Funnel；並不表示本機 Tailscale 常駐程式已停止或登出。

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

開啟：`https://<magicdns>/`（或您設定的 `gateway.controlUi.basePath`）

若要透過具名 Tailscale Service 而非裝置主機名稱公開控制介面，請將 `gateway.tailscale.serviceName` 設為 Service 名稱：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

啟動時接著會回報 Service URL `https://openclaw.<tailnet-name>.ts.net/`，而非裝置主機名稱。Tailscale Services 要求主機必須是 tailnet 中已核准且加上標籤的節點——啟用此功能前，請先在 Tailscale 中設定標籤並核准 Service，否則閘道啟動期間 `tailscale serve --service=...` 會失敗。

### 僅限 Tailnet（繫結至 Tailnet IP）

使用此設定可讓閘道直接監聽 Tailnet IP，而不使用 Serve/Funnel：

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

從另一部 Tailnet 裝置連線：

- 控制介面：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

<Note>
當存在可繫結的 Tailnet IPv4 時，閘道也會要求已驗證的同主機用戶端使用 `http://127.0.0.1:18789`。如果啟動時沒有可用的 Tailnet 位址，便只會退回 local loopback；請在 Tailscale 可用後重新啟動，以加入直接 Tailnet 存取。這兩種路徑都不會增加區域網路或公開暴露範圍。
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

建議使用 `OPENCLAW_GATEWAY_PASSWORD`，而不要將密碼提交至磁碟。

## 命令列介面範例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 驗證

`gateway.auth.mode` 控制交握：

| 模式                                                   | 使用情境                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | 僅限私人入口                                                                |
| `token`（設定 `OPENCLAW_GATEWAY_TOKEN` 時的預設值） | 共用權杖                                                                        |
| `password`                                             | 透過 `OPENCLAW_GATEWAY_PASSWORD` 或設定提供共用密碼                             |
| `trusted-proxy`                                        | 可感知身分的反向代理；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth) |

### Tailscale 身分標頭（僅限 Serve）

當 `tailscale.mode: "serve"` 且 `gateway.auth.allowTailscale` 為 `true` 時，控制介面/WebSocket 驗證可以使用 Tailscale 身分標頭（`tailscale-user-login`），而不使用權杖/密碼。OpenClaw 會透過本機 Tailscale 常駐程式（`tailscale whois`）解析要求的 `x-forwarded-for` 位址，並在接受要求之前確認其與標頭中的登入身分相符，以驗證該標頭。只有當要求來自 local loopback，且攜帶 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 標頭時，才符合使用此路徑的資格。

此無權杖流程假設閘道主機值得信任。如果不受信任的本機程式碼可能在同一主機上執行，請設定 `gateway.auth.allowTailscale: false`，並改為要求權杖/密碼驗證。

略過驗證的範圍：

- 僅適用於控制介面的 WebSocket 驗證介面。HTTP API 端點（`/v1/*`、`/tools/invoke`、`/api/channels/*` 等）絕不使用 Tailscale 身分標頭驗證；它們一律遵循閘道的一般 HTTP 驗證模式。
- 對於已帶有瀏覽器裝置身分的控制介面操作員工作階段，已驗證的 Tailscale 身分會略過啟動權杖/QR 配對往返流程。
- 這不會略過裝置身分本身：缺少裝置身分的用戶端仍會遭到拒絕，而節點角色連線仍需通過一般配對與驗證檢查。

## 注意事項

- Tailscale Serve/Funnel 要求已安裝並登入 `tailscale` 命令列介面。
- 除非驗證模式為 `password`，否則 `tailscale.mode: "funnel"` 會拒絕啟動，以避免公開暴露。
- `gateway.tailscale.serviceName` 僅適用於 Serve 模式，並會傳遞至 `tailscale serve --service=<name>`。此值必須使用 Tailscale 的 `svc:<dns-label>` 格式，例如 `svc:openclaw`。Tailscale 要求 Service 主機必須是已加上標籤的節點，而且在 Serve 可以發佈該 Service 前，可能需要先在管理控制台中核准。
- `gateway.tailscale.resetOnExit` 會在關閉時復原 `tailscale serve`/`tailscale funnel` 設定。
- `gateway.tailscale.preserveFunnel: true` 會讓外部設定的 `tailscale funnel` 路由在閘道重新啟動後繼續運作。使用 `mode: "serve"` 時，OpenClaw 會在重新套用 Serve 前檢查 `tailscale funnel status`，若已有 Funnel 路由涵蓋閘道連接埠，便會略過套用。由 OpenClaw 管理的 Funnel 僅限密碼原則維持不變。
- 當 Tailnet IPv4 可用時，`gateway.bind: "tailnet"` 會使用直接 Tailnet 繫結（無 HTTPS、無 Serve/Funnel），並加上必要的本機 `127.0.0.1`；否則只會退回 local loopback。
- `gateway.bind: "auto"` 優先使用 local loopback；若要將網路暴露範圍限制在 Tailnet，同時保留同主機 local loopback 存取，請使用 `tailnet`。
- Serve/Funnel 僅公開 **閘道控制介面 + WS**。節點透過相同的閘道 WS 端點連線，因此 Serve 也適用於節點存取。

### Tailscale 先決條件與限制

- Serve 要求您的 tailnet 已啟用 HTTPS；若未啟用，命令列介面會提示您。
- Serve 會注入 Tailscale 身分標頭；Funnel 不會。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已啟用 HTTPS，以及 funnel 節點屬性。
- Funnel 透過 TLS 僅支援連接埠 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 要求使用開放原始碼版本的 Tailscale 應用程式。

## 瀏覽器控制（遠端閘道 + 本機瀏覽器）

若要在一台機器上執行閘道，但控制另一台機器上的瀏覽器，請在瀏覽器所在的機器上執行**節點主機**，並讓兩者位於同一個 tailnet。閘道會將瀏覽器操作代理至該節點；不需要另外的控制伺服器或 Serve URL。

避免將 Funnel 用於瀏覽器控制；請將節點配對視同操作員存取。

## 深入瞭解

- Tailscale Serve 概觀：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概觀：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相關內容

- [遠端存取](/zh-TW/gateway/remote)
- [探索](/zh-TW/gateway/discovery)
- [驗證](/zh-TW/gateway/authentication)
