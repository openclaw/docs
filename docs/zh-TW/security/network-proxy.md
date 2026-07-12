---
read_when:
    - 您需要針對 SSRF 與 DNS 重新綁定攻擊提供縱深防禦
    - 為 OpenClaw 執行階段流量設定外部正向代理伺服器
summary: 如何透過由管理者維運的篩選代理伺服器，路由 OpenClaw 執行階段的 HTTP 與 WebSocket 流量
title: 網路代理伺服器
x-i18n:
    generated_at: "2026-07-11T21:50:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可透過由操作人員管理的正向代理，路由執行階段的 HTTP 與 WebSocket 流量。這是選用的縱深防禦措施：集中控管對外流量、提供更強的 SSRF 防護，並在網路邊界稽核目的地。由於代理會在連線時，也就是 DNS 解析後、開啟上游連線前立即評估目的地，因此也能縮小 DNS 重新綁定攻擊所依賴的時間差，該時間差存在於較早的應用程式層級 DNS 檢查與實際對外連線之間。單一代理原則也能讓操作人員集中實施目的地規則、網路分段、速率限制或對外允許清單，而不必重新建置 OpenClaw。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。請自行執行適合您環境的代理技術；OpenClaw 會透過該代理路由自身的 HTTP 與 WebSocket 用戶端。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

您也可以透過環境設定 URL，同時在設定檔中保留 `proxy.enabled: true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 的優先順序高於 `OPENCLAW_PROXY_URL`。如果 `proxy.enabled` 為 `true`，但無法解析出有效的 URL，受保護的命令會在啟動時失敗，而不會退回直接存取網路。

| 鍵                   | 類型                                 | 預設值         | 備註                                                                                                                                       |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `proxy.enabled`      | 布林值                               | 未設定         | 必須為 `true` 才會啟用路由。                                                                                                              |
| `proxy.proxyUrl`     | 字串                                 | 未設定         | `http://` 或 `https://` 正向代理 URL。嵌入 URL 的認證資訊會視為敏感資料，並從快照／日誌中遮蔽。                                             |
| `proxy.tls.caFile`   | 字串                                 | 未設定         | 用於驗證由私有 CA 簽署之 `https://` 代理端點的 CA 憑證套件。                                                                               |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | 控制迴路位址略過行為；請參閱下文。                                                                                                        |

對於受管理的閘道服務，請將 URL 儲存在設定檔中，使其在重新安裝後仍可保留，而非依賴前景程序的環境變數：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` 環境變數備援最適合前景執行。若要搭配已安裝的服務使用，請將它放入服務的持久環境檔（`$OPENCLAW_STATE_DIR/.env`，預設為 `~/.openclaw/.env`），然後重新安裝，使 launchd/systemd/Scheduled Tasks 能讀取該設定。

### 使用私有 CA 的 HTTPS 代理端點

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` 用於驗證代理端點本身的 TLS 憑證。它不是目的地 MITM 信任設定、用戶端憑證，也不能取代代理的目的地原則。只有在整個 Node 程序從啟動起就必須信任額外 CA 時，才應改用 `NODE_EXTRA_CA_CERTS`（例如，企業 TLS 檢查系統會重新簽署每個 HTTPS 目的地憑證）——該變數會套用至整個程序，且必須在 Node 啟動前設定，因此 OpenClaw 無法像套用 `proxy.tls.caFile` 一樣，在執行途中套用它。若要信任 HTTPS 代理端點，請優先使用 `proxy.tls.caFile`：其範圍僅限於受管理的代理路由，而非整個程序。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## 路由運作方式

當 `proxy.enabled: true` 且 URL 有效時，受保護的執行階段程序（`openclaw gateway run`、`openclaw node run`、`openclaw agent --local`）會透過代理路由一般 HTTP 與 WebSocket 對外流量：

```text
OpenClaw 程序
  fetch、node:http、node:https、WebSocket 用戶端  -> 操作人員的代理 -> 目的地
```

在內部，OpenClaw 會安裝 [Proxyline](https://github.com/openclaw/proxyline) 作為程序層級的路由執行環境。它涵蓋 `fetch`、以 undici 為基礎的用戶端、`node:http`／`node:https`、常見 WebSocket 用戶端，以及由輔助函式建立的 `CONNECT` 通道；它也會取代呼叫端提供的 Node HTTP 代理程式，因此明確指定的代理程式（包括 `axios`、`got`、`node-fetch`，以及類似以 Node 代理程式為基礎的用戶端）無法在未察覺的情況下略過代理。

代理 URL 配置描述的是 OpenClaw 到代理之間的躍點，而不是到最終目的地的躍點：

- `http://proxy.example:3128` — 以純 TCP 連線至代理；OpenClaw 會傳送 HTTP 代理要求，包括針對 HTTPS 目的地的 `CONNECT`。
- `https://proxy.example:8443` — OpenClaw 會先與代理本身建立 TLS 連線（並驗證代理的憑證），再於該工作階段中傳送 HTTP 代理要求。

目的地 TLS 與代理端點 TLS 彼此獨立：對於 HTTPS 目的地，OpenClaw 一律會要求代理建立 `CONNECT` 通道，並透過該通道啟動目的地 TLS。

代理啟用期間，OpenClaw 會清除 `no_proxy`／`NO_PROXY`。這些略過清單以目的地為依據；若其中保留 `localhost` 或 `127.0.0.1`，SSRF 目標就能完全略過代理。關閉時，OpenClaw 會還原先前的代理環境，並重設快取的路由狀態。

某些外掛擁有自訂傳輸，即使程序層級路由已啟用，仍需自行連接代理。Telegram 的 Bot API 用戶端使用自己的 HTTP/1 undici 分派器，並另外遵循程序代理環境變數及 `OPENCLAW_PROXY_URL` 備援。

### 閘道迴路位址模式

本機閘道控制平面用戶端通常會連線至迴路位址 WebSocket，例如 `ws://127.0.0.1:18789`。`proxy.loopbackMode` 控制這類流量是否略過受管理的代理：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only、proxy 或 block
```

| 模式                     | 行為                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only`（預設）   | OpenClaw 會將作用中的閘道迴路位址授權端註冊為直接連線例外，因此本機閘道 WebSocket 流量無須透過代理即可連線。由於例外會鎖定所設定的確切主機／連接埠，因此自訂迴路位址連接埠也能運作。隨附的瀏覽器外掛會針對由 OpenClaw 啟動之受管理瀏覽器的確切本機 CDP 就緒 URL 與 DevTools WebSocket URL，註冊同類型的例外；隨附的 Ollama 記憶嵌入提供者則針對其確切設定的主機本機迴路位址嵌入來源，設有範圍更窄且受防護的直接路徑。 |
| `proxy`                  | 不會註冊任何迴路位址例外；閘道與 Ollama 迴路位址流量會通過代理。遠端代理必須能將流量路由回 OpenClaw 主機的迴路位址服務（例如透過可連線的主機名稱、IP 或通道）——標準遠端代理會相對於代理本身解析 `127.0.0.1`／`localhost`，而不是相對於 OpenClaw 主機。                                                                                                                                                                                                                                                    |
| `block`                  | OpenClaw 會在開啟通訊端前，拒絕閘道迴路位址控制平面連線，以及受防護的 Ollama 迴路位址嵌入連線。                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

閘道控制平面的略過範圍僅限於 `localhost` 和字面指定的迴路 IP URL——請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`。其他主機名稱會像一般流量一樣進行路由。

### 容器

對於 `openclaw --container ...` 命令，若已設定 `OPENCLAW_PROXY_URL`，OpenClaw 會將其轉送至以容器為目標的子命令列介面。該 URL 必須能從容器內部連線——其中的 `127.0.0.1` 指的是容器本身，而非主機。除非您設定 `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` 明確覆寫此檢查，否則 OpenClaw 會拒絕以容器為目標之命令使用迴路位址代理 URL。

## 相關代理術語

- `proxy.enabled`／`proxy.proxyUrl` — 用於執行階段對外流量的對外正向代理路由。即本頁所述功能。
- `gateway.auth.mode: "trusted-proxy"` — 用於存取閘道的輸入端身分感知反向代理驗證。請參閱[受信任的代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy` — 用於開發與支援的本機除錯代理和擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy` — `web_fetch` 的選用設定，允許由操作人員控制的 HTTP(S) 環境代理解析 DNS，同時預設維持嚴格的 DNS 鎖定與主機名稱原則。請參閱 [Web 擷取](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- 頻道或提供者專用的代理設定 — 針對單一傳輸的擁有者專用覆寫。若要集中控管整個執行階段的對外流量，請優先使用受管理的網路代理。

## 驗證代理

代理的目的地原則才是真正的安全邊界；OpenClaw 無法驗證您的代理是否封鎖了正確的目標。請將其設定為：

- 僅繫結至迴路位址或受信任的私人介面，且只能由 OpenClaw 程序／主機／容器／服務帳戶連線。
- 自行解析目的地，並在 DNS 解析後、建立連線時依 IP 封鎖，且同時涵蓋純 HTTP 與 HTTPS `CONNECT` 通道。
- 拒絕針對迴路位址、私人、鏈路本機、中繼資料、多播、保留及文件用途位址範圍的目的地略過規則。
- 除非您完全信任 DNS 解析路徑，否則避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態和原因——絕不可記錄要求主體、授權標頭、Cookie 或其他機密資料。
- 將原則納入版本控制，並將變更視為安全性敏感項目進行審查。

請從執行 OpenClaw 的相同主機／容器／服務帳戶進行驗證：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

若 HTTPS 代理端點使用私有 CA：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| 旗標                     | 用途                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| `--proxy-url <url>`      | 驗證此 URL，而非解析設定／環境變數。                               |
| `--proxy-ca-file <path>` | HTTPS Proxy 端點的 CA 憑證套件。                                   |
| `--allowed-url <url>`    | 預期可成功連線的目的地（可重複指定）。                             |
| `--denied-url <url>`     | 預期會遭封鎖的目的地（可重複指定）。                               |
| `--apns-reachable`       | 另行驗證 Proxy 能否透過通道直接執行沙盒 APNs HTTP/2 探測。         |
| `--apns-authority <url>` | 覆寫搭配 `--apns-reachable` 探測的 APNs 授權端點。                  |
| `--timeout-ms <ms>`      | 每個請求的逾時時間。                                               |
| `--json`                 | 機器可讀的輸出。                                                   |

若 `proxy.enabled` 並非 `true`，且未提供 `--proxy-url`，此命令會回報設定問題，而不會執行驗證；在變更設定前，可傳入 `--proxy-url` 進行一次性預檢。

若未指定 `--allowed-url`／`--denied-url`，預設檢查為：`https://example.com/` 必須成功，而 Proxy 不得連線至臨時 local loopback 金絲雀伺服器，該連線必須遭到封鎖。若傳輸失敗，或收到不含該次執行之金絲雀權杖的非 2xx 回應，local loopback 檢查即為通過；若收到缺少權杖的 2xx 回應（表示金絲雀以外的來源意外成功回應），檢查即告失敗；尤其是任何帶有相符權杖的回應都會導致失敗，因為這證明 Proxy 確實轉送了本應拒絕的 local loopback 目的地。自訂的 `--denied-url` 目標沒有此類金絲雀權杖，因此採取失敗即關閉策略：任何 HTTP 回應都視為可連線（失敗）；傳輸錯誤則回報為無法判定，而不視為已證實封鎖，因為 OpenClaw 無法確認究竟是 Proxy 拒絕了可連線的來源，還是發生了其他問題。`--apns-reachable` 會傳送刻意設為無效的提供者權杖，因此收到 `403 InvalidProviderToken` 回應，即可證明通道已連線至 Apple。任何驗證失敗時，此命令都會以 `1` 結束；文字與 JSON 輸出中的 Proxy URL 憑證都會經過遮蔽處理。

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

手動 `curl` 檢查（公開請求應成功；local loopback 與中繼資料請求應由 Proxy 本身封鎖——僅使用 `curl` 無法像 `openclaw proxy validate` 的內建金絲雀機制一樣，區分 Proxy 拒絕與來源無法連線）：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## 建議封鎖的目的地

以下是任何正向 Proxy、防火牆或輸出流量政策的初始拒絕清單。OpenClaw 自身的 SSRF 分類器位於 `src/infra/net/ssrf.ts` 與 `packages/net-policy/src/ip.ts`（`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、RFC 2544 基準測試前綴，以及對 NAT64／6to4／Teredo／ISATAP／IPv4 對應形式中內嵌 IPv4 的處理）——這些都是實用的參考資料，但 OpenClaw 不會將這些規則匯出至您的外部 Proxy，也不會在其中強制執行。

| 範圍或主機                                                                           | 封鎖原因                                           |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 local loopback                                |
| `::1/128`                                                                            | IPv6 local loopback                                |
| `0.0.0.0/8`, `::/128`                                                                | 未指定／本網路位址                                 |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC 1918 私有網路                                  |
| `169.254.0.0/16`, `fe80::/10`                                                        | 鏈路本機位址，包括常見的雲端中繼資料路徑           |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                                   |
| `100.64.0.0/10`                                                                      | 電信業者級 NAT 共用位址空間                        |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                                       |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範例範圍                             |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                               |
| `240.0.0.0/4`                                                                        | 保留的 IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機／私有範圍                                |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丟棄與 ORCHIDv2 範圍                          |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含內嵌 IPv4 的 NAT64 前綴                          |
| `2002::/16`, `2001::/32`                                                             | 含內嵌 IPv4 的 6to4 與 Teredo                      |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 相容與 IPv4 對應 IPv6                         |

請加入雲端供應商或網路平台文件中列出的任何其他中繼資料主機或保留範圍。

## 限制

| 涵蓋範圍                                                     | 受管理 Proxy 狀態                                                                                                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`、`node:http`、`node:https`、常見 WebSocket 用戶端    | 設定後會透過受管理的 Proxy 掛鉤路由。                                                                                                                |
| APNs 直接 HTTP/2                                             | 透過 APNs 受管理的 `CONNECT` 輔助程式路由。                                                                                                         |
| 閘道控制平面 local loopback                                  | 僅針對設定中完全相符的本機 local loopback 閘道 URL 直接連線。                                                                                       |
| 偵錯 Proxy 上游轉送                                          | 受管理 Proxy 模式啟用時停用，除非明確啟用以進行本機診斷。                                                                                           |
| IRC                                                          | 使用原始 TCP/TLS；不會經由受管理 HTTP Proxy 模式代理。若您的部署要求所有輸出流量都經由正向 Proxy，請設定 `channels.irc.enabled: false`。              |
| 其他原始 `net`、`tls` 或 `http2` 用戶端呼叫                  | 必須在合併前由原始通訊端防護機制進行分類。                                                                                                           |

- 這是在程序層級涵蓋 JavaScript HTTP／WebSocket 用戶端，並非作業系統層級的網路沙盒。
- 原始 `net`、`tls`、`http2` 通訊端、原生附加元件，以及非 OpenClaw 子程序，可能繞過節點層級的路由，除非它們繼承並遵循 Proxy 環境變數。分叉產生的 OpenClaw 子命令列介面會繼承受管理的 Proxy URL 與 `proxy.loopbackMode` 狀態。
- 使用者的本機 WebUI 與本機模型伺服器不包含在一般本機網路略過規則內——如有需要，請在營運者的 Proxy 政策中將其加入允許清單。唯一例外是內建 Ollama 記憶嵌入提供者的受防護直接路徑，其範圍僅限於所設定 `baseUrl` 中完全相符、位於主機本機的 local loopback 來源；區域網路、Tailnet、私有網路及公開 Ollama 主機仍會使用受管理的 Proxy。
- 受管理 Proxy 模式啟用時，本機偵錯 Proxy 的直接上游轉送（用於 Proxy 請求和 `CONNECT` 通道）預設為停用；僅可針對已核准的本機診斷啟用。
- OpenClaw 不會檢查、測試或認證您的 Proxy 政策。請將 Proxy 政策變更視為涉及安全性的營運變更。
