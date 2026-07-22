---
read_when:
    - 你希望具備針對 SSRF 與 DNS 重新綁定攻擊的縱深防禦能力
    - 為 OpenClaw 執行階段流量設定外部正向代理伺服器
summary: 如何透過由營運者管理的篩選 Proxy 路由 OpenClaw 執行階段的 HTTP 與 WebSocket 流量
title: 網路代理伺服器
x-i18n:
    generated_at: "2026-07-22T10:46:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e948189d691e2cfe32e911e24071fd77157397b510d606423ef738c2565071b5
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可透過由操作者管理的正向 Proxy，路由執行階段的 HTTP 與 WebSocket 流量。這是選用的縱深防禦措施：在網路邊界集中控管對外連線、強化 SSRF 防護，並讓目的地可供稽核。由於 Proxy 會在 DNS 解析後、開啟上游連線前一刻，於連線時評估目的地，因此也能縮小 DNS 重新綁定攻擊所依賴的時間差，也就是先前應用程式層級的 DNS 檢查與實際對外連線之間的落差。單一 Proxy 政策也讓操作者能在同一處強制執行目的地規則、網路分段、速率限制或對外連線允許清單，而無須重新建置 OpenClaw。

OpenClaw 不會隨附、下載、啟動、設定或認證 Proxy。請執行適合你環境的 Proxy 技術；OpenClaw 會透過該 Proxy 路由自身的 HTTP 與 WebSocket 用戶端。

## 設定

```yaml
proxy:
  proxyUrl: http://127.0.0.1:3128
```

也可以透過環境變數設定 URL：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 的優先順序高於 `OPENCLAW_PROXY_URL`。設定 URL 會啟用受管理的 Proxy 路由；移除這兩個 URL 則會停用。

| 鍵                   | 類型                                 | 預設值         | 備註                                                                                                                                 |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.proxyUrl`     | 字串                                 | 未設定          | `http://` 或 `https://` 正向 Proxy URL。嵌入 URL 的認證資訊會視為敏感資訊，並從快照／日誌中遮蔽。 |
| `proxy.tls.caFile`   | 字串                               | 未設定          | 用於驗證由私人 CA 簽署之 `https://` Proxy 端點的 CA 套件。                                                          |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | 控制迴路位址略過行為；請見下文。                                                                                         |

對於受管理的閘道服務，請將 URL 儲存在設定中，以便重新安裝後仍予以保留，而不要依賴前景環境變數：

```bash
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` 環境變數備援最適合前景執行。若要搭配已安裝的服務使用，請將其放入服務的持久環境（`$OPENCLAW_STATE_DIR/.env`，預設為 `~/.openclaw/.env`），然後重新安裝，讓 launchd/systemd/Scheduled Tasks 取得該值。

### 使用私人 CA 的 HTTPS Proxy 端點

```yaml
proxy:
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` 會驗證 Proxy 端點本身的 TLS 憑證。它不是目的地 MITM 信任設定、用戶端憑證，也不能取代 Proxy 的目的地政策。只有當整個節點程序必須從啟動時便信任額外的 CA（例如企業 TLS 檢查系統會重新簽署每個 HTTPS 目的地憑證）時，才應改用 `NODE_EXTRA_CA_CERTS`——該變數適用於整個程序，而且必須在節點啟動前設定，因此 OpenClaw 無法像套用 `proxy.tls.caFile` 一樣，在執行期間套用它。HTTPS Proxy 端點信任應優先使用 `proxy.tls.caFile`：它的作用範圍僅限於受管理的 Proxy 路由，而非整個程序。

```bash
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## 路由運作方式

設定有效的 Proxy URL 後，受保護的執行階段程序（`openclaw gateway run`、`openclaw node run`、`openclaw agent --local`）會透過 Proxy 路由一般 HTTP 與 WebSocket 對外流量：

```text
OpenClaw 程序
  fetch、node:http、node:https、WebSocket 用戶端  -> 操作者 Proxy -> 目的地
```

在內部，OpenClaw 會安裝 [Proxyline](https://github.com/openclaw/proxyline) 作為程序層級的路由執行階段。它涵蓋 `fetch`、以 undici 為基礎的用戶端、`node:http`/`node:https`、常見的 WebSocket 用戶端，以及由輔助程式建立的 `CONNECT` 通道；它也會取代呼叫端提供的節點 HTTP 代理程式，因此明確指定的代理程式（包括 `axios`、`got`、`node-fetch`，以及類似的節點代理程式型用戶端）無法在未察覺的情況下略過 Proxy。

Proxy URL 配置描述的是 OpenClaw 到 Proxy 的連線階段，而非到最終目的地：

- `http://proxy.example:3128` — 以純 TCP 連線至 Proxy；OpenClaw 會傳送 HTTP Proxy 要求，包括用於 HTTPS 目的地的 `CONNECT`。
- `https://proxy.example:8443` — OpenClaw 會對 Proxy 本身建立 TLS 連線（並驗證 Proxy 的憑證），接著在該工作階段內傳送 HTTP Proxy 要求。

目的地 TLS 與 Proxy 端點 TLS 各自獨立：對於 HTTPS 目的地，OpenClaw 一律要求 Proxy 建立 `CONNECT` 通道，並透過該通道啟動目的地 TLS。

Proxy 啟用時，OpenClaw 會清除 `no_proxy`/`NO_PROXY`。這些略過清單以目的地為依據；若將 `localhost` 或 `127.0.0.1` 保留其中，SSRF 目標就能完全略過 Proxy。關閉時，OpenClaw 會還原先前的 Proxy 環境，並重設已快取的路由狀態。

部分外掛擁有自訂傳輸，即使程序層級路由已啟用，仍需要自行連接 Proxy。Telegram 的 Bot API 用戶端使用自己的 HTTP/1 undici 分派器，並另外遵循程序的 Proxy 環境變數及 `OPENCLAW_PROXY_URL` 備援。

### 閘道迴路位址模式

本機閘道控制平面用戶端通常會連線至迴路位址 WebSocket，例如 `ws://127.0.0.1:18789`。`proxy.loopbackMode` 控制該流量是否略過受管理的 Proxy：

```yaml
proxy:
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only、proxy 或 block
```

設定 `proxyUrl` 或 `OPENCLAW_PROXY_URL` 即會啟用受管理的路由。僅在進階選擇退出情境下設定
`proxy.enabled: false`，以保留已儲存的 URL，
但不啟用它。

| 模式                     | 行為                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only`（預設） | OpenClaw 會將作用中的閘道迴路位址授權單位註冊為直接連線例外，因此本機閘道 WebSocket 流量無須經過 Proxy 即可連線。自訂迴路位址連接埠也能運作，因為例外會針對確切設定的主機／連接埠。隨附的瀏覽器外掛會針對由 OpenClaw 啟動之受管理瀏覽器的確切本機 CDP 就緒 URL 與 DevTools WebSocket URL，註冊相同類型的例外；隨附的 Ollama 記憶嵌入提供者則針對其確切設定的主機本機迴路位址嵌入來源，提供範圍更窄且受防護的直接路徑。 |
| `proxy`                  | 不會註冊任何迴路位址例外；閘道與 Ollama 迴路位址流量會經過 Proxy。遠端 Proxy 必須能夠路由回 OpenClaw 主機的迴路位址服務（例如透過可連線的主機名稱、IP 或通道）——標準遠端 Proxy 會相對於自身解析 `127.0.0.1`/`localhost`，而非相對於 OpenClaw 主機。                                                                                                                                                                                                                |
| `block`                  | OpenClaw 會在開啟通訊端前，拒絕閘道迴路位址控制平面連線，以及受防護的 Ollama 迴路位址嵌入連線。                                                                                                                                                                                                                                                                                                                                                                                                                               |

閘道控制平面的略過僅限於 `localhost` 與常值迴路位址 IP URL——請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`。其他主機名稱會像一般流量一樣路由。

### 容器

對於 `openclaw --container ...` 命令，若已設定 `OPENCLAW_PROXY_URL`，OpenClaw 會將其轉送至以容器為目標的子命令列介面。該 URL 必須能從容器內連線——其中的 `127.0.0.1` 指的是容器本身，而非主機。對於以容器為目標的命令，OpenClaw 會拒絕迴路位址 Proxy URL，除非設定 `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` 以明確覆寫該檢查。

## 相關 Proxy 術語

- `proxy.enabled` / `proxy.proxyUrl` — 用於執行階段對外流量的輸出正向 Proxy 路由。本頁所述內容。
- `gateway.auth.mode: "trusted-proxy"` — 用於存取閘道的輸入身分感知反向 Proxy 驗證。請參閱[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy` — 用於開發與支援的本機偵錯 Proxy 和擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy` — `web_fetch` 的選用功能，讓操作者控制的 HTTP(S) 環境 Proxy 解析 DNS，同時預設維持嚴格的 DNS 固定與主機名稱政策。請參閱[網頁擷取](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- 頻道或提供者專用 Proxy 設定 — 單一傳輸的擁有者專用覆寫。若要集中控管整個執行階段的對外連線，請優先使用受管理的網路 Proxy。

## 驗證 Proxy

Proxy 的目的地政策才是實際的安全邊界；OpenClaw 無法驗證你的 Proxy 是否封鎖了正確的目標。請將其設定為：

- 僅繫結至迴路位址或私有受信任介面，且只能由 OpenClaw 程序／主機／容器／服務帳戶連線。
- 自行解析目的地，並在 DNS 解析後的連線時依 IP 封鎖，同時涵蓋純 HTTP 與 HTTPS `CONNECT` 通道。
- 拒絕針對迴路位址、私有、鏈路本機、中繼資料、多點傳送、保留與文件用途位址範圍的目的地型略過。
- 除非完全信任 DNS 解析路徑，否則避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態與原因——絕不記錄要求本文、授權標頭、Cookie 或其他密鑰。
- 將政策納入版本控制，並將變更視為安全性敏感項目進行審查。

請從執行 OpenClaw 的同一個主機／容器／服務帳戶進行驗證：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

搭配使用私人 CA 的 HTTPS Proxy 端點：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| 旗標                     | 用途                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | 驗證此 URL，而非解析設定／環境變數。                   |
| `--proxy-ca-file <path>` | HTTPS Proxy 端點的 CA 套件組。                               |
| `--allowed-url <url>`    | 預期可成功連線的目的地（可重複指定）。                        |
| `--denied-url <url>`     | 預期遭封鎖的目的地（可重複指定）。                     |
| `--apns-reachable`       | 同時驗證 Proxy 能否透過通道直接執行沙箱 APNs HTTP/2 探測。 |
| `--apns-authority <url>` | 覆寫以 `--apns-reachable` 探測的 APNs authority。          |
| `--timeout-ms <ms>`      | 每個要求的逾時時間。                                                 |
| `--json`                 | 機器可讀輸出。                                             |

如果沒有可用的設定、環境變數或 `--proxy-url` 值，命令會回報設定問題；在變更設定前，可傳入 `--proxy-url` 執行一次性的前置檢查。

若未指定 `--allowed-url`/`--denied-url`，預設檢查為：`https://example.com/` 必須成功，而且 Proxy 必須封鎖其不應能存取的臨時迴路 Canary 伺服器。若發生傳輸失敗，或收到不含該 Canary 每次執行權杖的非 2xx 回應，迴路檢查即視為通過；若收到缺少權杖的 2xx 回應（來自 Canary 以外來源的非預期成功），則視為失敗；尤其是任何帶有相符權杖的回應都會視為失敗，因為這證明 Proxy 確實轉送了其本應拒絕的迴路目的地。自訂 `--denied-url` 目標沒有此類 Canary 權杖，因此採取失敗關閉原則：任何 HTTP 回應都表示可連線（失敗），而傳輸錯誤會回報為無法判定，而非已證實遭封鎖，因為 OpenClaw 無法確認是 Proxy 拒絕了可連線的來源，還是其他環節發生錯誤。`--apns-reachable` 會傳送刻意無效的供應商權杖，因此 `403 InvalidProviderToken` 回應可視為通道已連上 Apple 的證明。任何驗證失敗時，命令都會以 `1` 結束；文字與 JSON 輸出中的 Proxy URL 認證資訊都會經過遮蔽。

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

手動 `curl` 檢查（公開要求應成功；迴路和中繼資料要求應由 Proxy 本身封鎖——僅靠 `curl` 無法像 `openclaw proxy validate` 的內建 Canary 一樣，區分 Proxy 拒絕與來源無法連線）：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## 建議封鎖的目的地

適用於任何正向 Proxy、防火牆或輸出流量政策的初始拒絕清單。OpenClaw 自有的 SSRF 分類器位於 `src/infra/net/ssrf.ts` 和 `packages/net-policy/src/ip.ts`（`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、RFC 2544 基準測試前綴，以及 NAT64/6to4/Teredo/ISATAP/IPv4 對應形式的內嵌 IPv4 處理）——這些是實用的參考資料，但 OpenClaw 不會將這些規則匯出至你的外部 Proxy，也不會在其中強制執行。

| 範圍或主機                                                                        | 封鎖原因                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 迴路                                     |
| `::1/128`                                                                            | IPv6 迴路                                     |
| `0.0.0.0/8`, `::/128`                                                                | 未指定／本網路位址              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC 1918 私有網路                         |
| `169.254.0.0/16`, `fe80::/10`                                                        | 連結本機，包括常見的雲端中繼資料路徑 |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                           |
| `100.64.0.0/10`                                                                      | 電信業者級 NAT 共用位址空間            |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途及文件範圍              |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多點傳播                                         |
| `240.0.0.0/4`                                                                        | 保留的 IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機／私有範圍                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6 捨棄和 ORCHIDv2 範圍                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含內嵌 IPv4 的 NAT64 前綴                 |
| `2002::/16`, `2001::/32`                                                             | 含內嵌 IPv4 的 6to4 和 Teredo                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 相容及 IPv4 對應 IPv6              |

請加入雲端供應商或網路平台文件中記載的任何其他中繼資料主機或保留範圍。

## 限制

| 涵蓋面                                                      | 受管理 Proxy 狀態                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`、常見 WebSocket 用戶端 | 設定後會透過受管理 Proxy 鉤子路由。                                                                                                      |
| APNs 直接 HTTP/2                                           | 透過 APNs 受管理的 `CONNECT` 輔助程式路由。                                                                                                        |
| 閘道控制平面迴路                               | 僅對完全符合設定的本機迴路閘道 URL 採用直接連線。                                                                                         |
| 除錯 Proxy 上游轉送                              | 受管理 Proxy 模式啟用時停用，除非為本機診斷明確啟用。                                                             |
| IRC                                                          | 原始 TCP/TLS；不由受管理 HTTP Proxy 模式代理。如果部署要求所有輸出流量都透過正向 Proxy，請設定 `channels.irc.enabled: false`。 |
| 其他原始 `net`、`tls` 或 `http2` 用戶端呼叫              | 必須先由原始 Socket 防護機制分類才能合併。                                                                                               |

- 這提供的是 JavaScript HTTP/WebSocket 用戶端的行程層級涵蓋，而非作業系統層級的網路沙箱。
- 原始 `net`、`tls`、`http2` Socket、原生附加元件，以及非 OpenClaw 子行程，除非繼承並遵循 Proxy 環境變數，否則可能繞過 Node 層級路由。分叉的 OpenClaw 子命令列介面會繼承受管理 Proxy URL 和 `proxy.loopbackMode` 狀態。
- 使用者本機 WebUI 和本機模型伺服器不在一般本機網路略過範圍內——如有需要，請在操作者的 Proxy 政策中將它們加入允許清單。唯一例外是內附 Ollama 記憶體嵌入供應商的受防護直接路徑，其範圍僅限於設定的 `baseUrl` 中完全符合主機本機迴路的來源；區域網路、tailnet、私有網路和公開 Ollama 主機仍使用受管理 Proxy。
- 受管理 Proxy 模式啟用時，本機除錯 Proxy 的直接上游轉送（用於 Proxy 要求和 `CONNECT` 通道）預設停用；僅應為核准的本機診斷啟用。
- OpenClaw 不會檢查、測試或認證你的 Proxy 政策。請將 Proxy 政策變更視為安全性敏感的操作變更。
