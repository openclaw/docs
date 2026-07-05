---
read_when:
    - 你想要針對 SSRF 與 DNS 重新繫結攻擊的縱深防禦
    - 設定 OpenClaw 執行階段流量的外部轉送代理
summary: 如何透過由操作者管理的篩選代理路由 OpenClaw 執行階段的 HTTP 和 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-07-05T11:46:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可以透過由操作者管理的正向代理，路由執行階段的 HTTP 與 WebSocket 流量。這是選用的縱深防禦：集中式出口控制、更強的 SSRF 防護，以及在網路邊界進行目的地稽核。由於代理會在連線時、DNS 解析之後且即將開啟上游連線之前評估目的地，因此也會縮小 DNS 重新繫結攻擊所仰賴的時間差，也就是較早的應用程式層級 DNS 檢查與實際對外連線之間的差距。單一代理政策也讓操作者能在一處強制執行目的地規則、網路分段、速率限制或對外允許清單，而不需要重新建置 OpenClaw。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。你可以執行適合你環境的代理技術；OpenClaw 會透過它路由自己的 HTTP 與 WebSocket 用戶端。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

你也可以透過環境設定 URL，同時讓 `proxy.enabled: true` 保留在設定中：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 的優先順序高於 `OPENCLAW_PROXY_URL`。如果 `proxy.enabled` 為 `true`，但無法解析出有效 URL，受保護的命令會在啟動時失敗，而不是退回直接網路存取。

| 鍵                   | 類型                                 | 預設值         | 備註                                                                                                                                 |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | 未設定         | 必須為 `true` 才會啟用路由。                                                                                                         |
| `proxy.proxyUrl`     | string                               | 未設定         | `http://` 或 `https://` 正向代理 URL。嵌入 URL 的認證資料會視為敏感資訊，並從快照/日誌中遮蔽。 |
| `proxy.tls.caFile`   | string                               | 未設定         | 用於驗證由私有 CA 簽署的 `https://` 代理端點的 CA bundle。                                                          |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | 控制 loopback 繞過行為；請見下方。                                                                                         |

對於受管理的閘道服務，請將 URL 儲存在設定中，讓它在重新安裝後仍會保留，而不是依賴前景環境變數：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` 環境變數備援最適合前景執行。若要搭配已安裝的服務使用，請將它放進服務的持久環境（`$OPENCLAW_STATE_DIR/.env`，預設為 `~/.openclaw/.env`），然後重新安裝，讓 launchd/systemd/Scheduled Tasks 讀取它。

### 使用私有 CA 的 HTTPS 代理端點

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` 會驗證代理端點自己的 TLS 憑證。它不是目的地 MITM 信任設定、用戶端憑證，也不是代理目的地政策的替代品。只有當整個 節點 程序必須從啟動時就信任額外 CA（例如企業 TLS 檢查系統重新簽署每個 HTTPS 目的地憑證）時，才改用 `NODE_EXTRA_CA_CERTS`；該變數是程序全域的，而且必須在 節點 啟動前設定，因此 OpenClaw 無法像套用 `proxy.tls.caFile` 那樣在執行中套用它。HTTPS 代理端點信任請優先使用 `proxy.tls.caFile`：它的作用範圍限定於受管理的代理路由，而不是整個程序。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## 路由運作方式

在 `proxy.enabled: true` 且 URL 有效時，受保護的執行階段程序（`openclaw gateway run`、`openclaw node run`、`openclaw agent --local`）會透過代理路由一般 HTTP 與 WebSocket 對外流量：

```text
OpenClaw process
  fetch, node:http, node:https, WebSocket clients  -> operator proxy -> destination
```

在內部，OpenClaw 會安裝 [Proxyline](https://github.com/openclaw/proxyline) 作為程序層級的路由執行階段。它涵蓋 `fetch`、undici 支援的用戶端、`node:http`/`node:https`、常見的 WebSocket 用戶端，以及由輔助工具建立的 `CONNECT` 通道，並且會取代呼叫端提供的 節點 HTTP agent，因此明確指定的 agent（包括 `axios`、`got`、`node-fetch`，以及類似以 節點 agent 為基礎的用戶端）無法默默繞過代理。

代理 URL scheme 描述的是從 OpenClaw 到代理的那一跳，而不是到最終目的地：

- `http://proxy.example:3128` — 以純 TCP 連到代理；OpenClaw 會傳送 HTTP 代理請求，包括 HTTPS 目的地使用的 `CONNECT`。
- `https://proxy.example:8443` — OpenClaw 會對代理本身開啟 TLS（驗證代理的憑證），然後在該 session 中傳送 HTTP 代理請求。

目的地 TLS 與代理端點 TLS 彼此獨立：對於 HTTPS 目的地，OpenClaw 一律會要求代理建立 `CONNECT` 通道，並透過該通道啟動目的地 TLS。

代理啟用時，OpenClaw 會清除 `no_proxy`/`NO_PROXY`。這些繞過清單是以目的地為基礎；若將 `localhost` 或 `127.0.0.1` 留在其中，會讓 SSRF 目標完全略過代理。關閉時，OpenClaw 會還原先前的代理環境，並重設已快取的路由狀態。

有些外掛擁有自訂傳輸，即使程序層級路由已啟用，也需要自己的代理接線。Telegram 的 Bot API 用戶端使用自己的 HTTP/1 undici dispatcher，並另外遵循程序代理環境加上 `OPENCLAW_PROXY_URL` 備援。

### 閘道 loopback 模式

local loopback WebSocket 例如 `ws://127.0.0.1:18789`。`proxy.loopbackMode` 會控制該流量是否繞過受管理的代理：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| 模式                     | 行為                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only`（預設） | OpenClaw 會將作用中的閘道 loopback authority 註冊為直接連線例外，因此 local 閘道 WebSocket 流量會不經代理直接連線。自訂 loopback 連接埠可正常運作，因為例外會鎖定精確設定的主機/連接埠。內建瀏覽器外掛會為 OpenClaw 啟動的受管理瀏覽器之精確 local CDP 就緒狀態與 DevTools WebSocket URL，註冊相同類型的例外；內建 Ollama 記憶體 embedding provider 則針對其精確設定的主機 local loopback embedding origin，提供較窄且受防護的直接路徑。 |
| `proxy`                  | 不會註冊任何 loopback 例外；閘道與 Ollama loopback 流量會經由代理。遠端代理必須能路由回 OpenClaw 主機的 loopback 服務（例如透過可到達的主機名稱、IP 或通道），標準遠端代理會針對自身解析 `127.0.0.1`/`localhost`，而不是針對 OpenClaw 主機解析。                                                                                                                                                                                                                |
| `block`                  | OpenClaw 會在開啟 socket 之前，拒絕閘道 loopback 控制平面連線，以及受防護的 Ollama loopback embedding 連線。                                                                                                                                                                                                                                                                                                                                                                                                                               |

閘道控制平面繞過僅限於 `localhost` 與字面 loopback IP URL — 請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`。其他主機名稱會像一般流量一樣路由。

### 容器

對於 `openclaw --container ...` 命令，當 `OPENCLAW_PROXY_URL` 已設定時，OpenClaw 會將它轉送到以容器為目標的子命令列介面。該 URL 必須能從容器內部到達 — 那裡的 `127.0.0.1` 指的是容器本身，而不是主機。OpenClaw 會拒絕以容器為目標的命令使用 loopback 代理 URL，除非你設定 `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` 以明確覆寫該檢查。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl` — 執行階段對外流量的出站正向代理路由。本頁。
- `gateway.auth.mode: "trusted-proxy"` — 用於閘道存取的入站身分感知反向代理驗證。請見[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy` — 用於開發與支援的 local 除錯代理與擷取檢查器。請見 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy` — 讓 `web_fetch` 可選擇使用操作者控制的 HTTP(S) 環境代理來解析 DNS，同時預設保留嚴格 DNS pinning 與主機名稱政策。請見 [Web fetch](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- 通道或 provider 專用代理設定 — 單一傳輸的 owner 專用覆寫。若要在整個執行階段集中控制對外流量，請優先使用受管理的網路代理。

## 驗證代理

代理的目的地政策才是真正的安全邊界；OpenClaw 無法驗證你的代理是否封鎖了正確目標。請將其設定為：

- 僅綁定到 loopback 或私有受信任介面，且只有 OpenClaw 程序/主機/容器/服務帳戶能到達。
- 自行解析目的地，並在 DNS 解析後、連線時，針對純 HTTP 與 HTTPS `CONNECT` 通道都依 IP 封鎖。
- 拒絕以目的地為基礎的繞過，範圍包括 loopback、私有、link-local、metadata、multicast、保留與文件範圍。
- 避免使用主機名稱允許清單，除非你完全信任 DNS 解析路徑。
- 記錄目的地、決策、狀態與原因 — 絕不記錄請求 body、授權標頭、cookie 或其他秘密。
- 將政策納入版本控制，並將變更視為安全敏感項目審查。

從執行 OpenClaw 的相同主機/容器/服務帳戶進行驗證：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

使用私有 CA 的 HTTPS 代理端點：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| 旗標                     | 用途                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | 驗證此 URL，而不是解析 config/env。                                  |
| `--proxy-ca-file <path>` | HTTPS 代理端點的 CA bundle。                                         |
| `--allowed-url <url>`    | 預期會成功的目的地（可重複）。                                       |
| `--denied-url <url>`     | 預期會被封鎖的目的地（可重複）。                                     |
| `--apns-reachable`       | 也驗證代理可以透通直接的沙盒 APNs HTTP/2 探測。                      |
| `--apns-authority <url>` | 覆寫以 `--apns-reachable` 探測的 APNs authority。                    |
| `--timeout-ms <ms>`      | 每個請求的逾時時間。                                                 |
| `--json`                 | 機器可讀輸出。                                                       |

如果 `proxy.enabled` 不是 `true`，且未提供 `--proxy-url`，此命令會回報設定問題而不是執行驗證；在變更設定前，請傳入 `--proxy-url` 進行一次性預檢。

如果沒有 `--allowed-url`/`--denied-url`，預設檢查為：`https://example.com/` 必須成功，而且代理不得連到一個暫時的 loopback canary 伺服器，該連線必須被封鎖。loopback 檢查會在傳輸失敗時通過，或在非 2xx 回應且缺少該 canary 每次執行 token 時通過；如果收到缺少 token 的 2xx 回應（來自 canary 以外來源的非預期成功）則失敗，尤其是任何帶有相符 token 的回應都會失敗，因為這證明代理實際上轉送了一個本應拒絕的 loopback 目的地。自訂 `--denied-url` 目標沒有這種 canary token，因此採 fail-closed：任何 HTTP 回應都算作可連線（失敗），而傳輸錯誤會回報為不確定，而不是已證明被封鎖，因為 OpenClaw 無法確認你的代理是拒絕了可連線來源，還是其他地方出錯。`--apns-reachable` 會傳送刻意無效的 provider token，因此 `403 InvalidProviderToken` 回應可作為通道已連到 Apple 的證明。此命令在任何驗證失敗時以 `1` 結束；代理 URL 認證資訊會同時從文字與 JSON 輸出中遮蔽。

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

手動 `curl` 檢查（公開請求應成功；loopback 與 metadata 請求應由代理本身封鎖，單靠 `curl` 無法像 `openclaw proxy validate` 的內建 canary 那樣區分代理拒絕與來源無法連線）：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## 建議封鎖的目的地

任何正向代理、防火牆或輸出政策的初始 denylist。OpenClaw 自身的 SSRF 分類器位於 `src/infra/net/ssrf.ts` 與 `packages/net-policy/src/ip.ts`（`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、RFC 2544 benchmark 前綴，以及 NAT64/6to4/Teredo/ISATAP/IPv4-mapped 形式的嵌入式 IPv4 處理），是有用的參考，但 OpenClaw 不會在你的外部代理中匯出或強制執行這些規則。

| 範圍或主機                                                                           | 封鎖原因                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                     |
| `::1/128`                                                                            | IPv6 loopback                                     |
| `0.0.0.0/8`, `::/128`                                                                | 未指定／本網路位址                                |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC 1918 私有網路                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | link-local，包含常見雲端 metadata 路徑           |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端 metadata 服務                               |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共用位址空間                           |
| `198.18.0.0/15`, `2001:2::/48`                                                       | benchmark 範圍                                    |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | special-use 與文件範圍                            |
| `224.0.0.0/4`, `ff00::/8`                                                            | multicast                                         |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                         |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機／私有範圍                               |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard 與 ORCHIDv2 範圍                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含嵌入式 IPv4 的 NAT64 前綴                       |
| `2002::/16`, `2001::/32`                                                             | 含嵌入式 IPv4 的 6to4 與 Teredo                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible 與 IPv4-mapped IPv6               |

加入你的雲端供應商或網路平台文件記載的任何額外 metadata 主機或保留範圍。

## 限制

| 表面                                                         | 受管理代理狀態                                                                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, common WebSocket clients | 設定後會透過受管理代理 hook 路由。                                                                                                                       |
| APNs direct HTTP/2                                           | 透過 APNs 受管理的 `CONNECT` 輔助工具路由。                                                                                                              |
| Gateway control-plane loopback                               | 僅針對確切設定的 local loopback 閘道 URL 直接連線。                                                                                                      |
| Debug proxy upstream forwarding                              | 受管理代理模式啟用時會停用，除非為本機診斷明確啟用。                                                                                                     |
| IRC                                                          | 原始 TCP/TLS；不會由受管理 HTTP 代理模式代理。如果你的部署要求所有輸出都經過正向代理，請設定 `channels.irc.enabled: false`。                            |
| Other raw `net`, `tls`, or `http2` client calls              | 登陸前必須由原始 socket guard 分類。                                                                                                                     |

- 這是 JavaScript HTTP/WebSocket 用戶端的程序層級覆蓋，而不是作業系統層級的網路沙盒。
- 原始 `net`、`tls`、`http2` socket、native addons，以及非 OpenClaw 子程序可能會繞過節點層級路由，除非它們繼承並遵守代理環境變數。分叉的 OpenClaw 子命令列介面會繼承受管理代理 URL 與 `proxy.loopbackMode` 狀態。
- 使用者本機 WebUI 與本機模型伺服器不受一般本機網路旁路涵蓋；如有需要，請在 operator proxy policy 中將它們加入 allowlist。例外是 bundled Ollama memory embedding provider 的受保護直接路徑，其範圍限於其設定 `baseUrl` 的確切 host-local loopback origin；LAN、tailnet、private-network 與 public Ollama 主機仍會使用受管理代理。
- 本機 debug proxy 的直接 upstream forwarding（用於代理請求與 `CONNECT` 通道）在受管理代理模式啟用時預設停用；僅針對已核准的本機診斷啟用。
- OpenClaw 不會檢查、測試或認證你的代理政策。請將代理政策變更視為安全敏感的營運變更。
