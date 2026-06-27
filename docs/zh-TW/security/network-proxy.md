---
read_when:
    - 你想要針對 SSRF 與 DNS 重新綁定攻擊提供縱深防禦
    - 為 OpenClaw 執行階段流量設定外部轉送代理
summary: 如何透過操作員管理的篩選代理路由 OpenClaw 執行階段 HTTP 與 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-06-27T20:02:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可以透過由運維人員管理的正向代理，路由執行階段的 HTTP 與 WebSocket 流量。這是選用的縱深防禦，適合需要集中控管出口流量、更強 SSRF 防護，以及更佳網路稽核能力的部署。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。你可以執行符合環境需求的代理技術，而 OpenClaw 會透過它路由一般行程本機的 HTTP 與 WebSocket 用戶端。

## 為什麼使用代理

代理讓運維人員能以單一網路控制點管理對外 HTTP 與 WebSocket 流量。即使不是為了強化 SSRF 防護，這也很有用：

- 集中政策：維護一套出口政策，而不是仰賴每個應用程式 HTTP 呼叫位置都正確套用網路規則。
- 連線時檢查：在 DNS 解析後、代理即將開啟上游連線前，評估目的地。
- DNS 重新綁定防禦：縮小應用程式層級 DNS 檢查與實際對外連線之間的落差。
- 更廣泛的 JavaScript 覆蓋範圍：透過同一路徑路由一般 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端。
- 可稽核性：在出口邊界記錄允許與拒絕的目的地。
- 營運控制：不需重建 OpenClaw，即可強制執行目的地規則、網路分段、速率限制或對外允許清單。

代理路由是一般 HTTP 與 WebSocket 出口流量的行程層級防護欄。它為運維人員提供失敗即關閉的路徑，將受支援的 JavaScript HTTP 用戶端透過自己的過濾代理路由，但它不是作業系統層級的網路沙盒，也不代表 OpenClaw 會認證代理的目的地政策。

## OpenClaw 如何路由流量

當 `proxy.enabled=true` 且已設定代理 URL 時，受保護的執行階段行程，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過已設定的代理路由一般 HTTP 與 WebSocket 出口流量：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開合約是路由行為，而不是用來實作它的內部節點掛鉤。OpenClaw 閘道控制平面 WebSocket 用戶端在閘道 URL 使用 `localhost` 或實字回送 IP，例如 `127.0.0.1` 或 `[::1]` 時，會為 local loopback 閘道 RPC 流量使用狹窄的直接路徑。即使運維代理封鎖回送目的地，該控制平面路徑仍必須能連到回送閘道。一般執行階段 HTTP 與 WebSocket 請求仍會使用已設定的代理。

在內部，OpenClaw 會安裝 Proxyline 作為此功能的行程層級路由執行階段。Proxyline 涵蓋 `fetch`、以 undici 為基礎的用戶端、節點核心 `node:http` / `node:https` 呼叫者、常見 WebSocket 用戶端，以及由輔助程式建立的 CONNECT 通道。受管理代理模式會取代呼叫者提供的節點 HTTP agent，避免明確指定的 agent 意外繞過運維代理。

有些外掛擁有自訂傳輸，即使行程層級路由存在，也需要明確接線代理。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會遵循行程代理 env，加上該擁有者特定傳輸路徑中的受管理 `OPENCLAW_PROXY_URL` 後援。

代理 URL 本身可以使用 `http://` 或 `https://`。這些 scheme 描述 OpenClaw 到代理端點的連線：

- `http://proxy.example:3128`：OpenClaw 會開啟到正向代理的一般 TCP 連線，並傳送 HTTP 代理請求，包括送往 HTTPS 目的地的 `CONNECT`。
- `https://proxy.example:8443`：OpenClaw 會對代理端點開啟 TLS、驗證代理憑證，然後在該 TLS 工作階段內傳送 HTTP 代理請求。

目的地 HTTPS 與代理端點 TLS 是分開的。對於 HTTPS 目的地，OpenClaw 仍會向代理請求 HTTP `CONNECT` 通道，然後透過該通道啟動目的地 TLS。

代理啟用期間，OpenClaw 會清除 `no_proxy` 和 `NO_PROXY`。這些繞過清單是以目的地為基礎，因此若將 `localhost` 或 `127.0.0.1` 留在其中，會讓高風險 SSRF 目標跳過過濾代理。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的行程路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段出口流量的對外正向代理路由。本頁記錄此功能。
- `gateway.auth.mode: "trusted-proxy"`：用於閘道存取的輸入身分感知反向代理驗證。請參閱[信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發與支援的本機偵錯代理與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy`：讓 `web_fetch` 選擇性使用由運維人員控制的 HTTP(S) env 代理解析 DNS，同時保留預設嚴格 DNS 釘選與主機名稱政策。請參閱 [Web fetch](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- 頻道或供應者特定代理設定：特定傳輸的擁有者專用覆寫。若目標是在整個執行階段集中控管出口流量，請優先使用受管理網路代理。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

若 HTTPS 代理端點使用私人代理 CA：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

你也可以透過環境提供 URL，同時在設定中保留 `proxy.enabled=true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 的優先順序高於 `OPENCLAW_PROXY_URL`。

### 閘道 Loopback 模式

本機閘道控制平面用戶端通常會連線到回送 WebSocket，例如 `ws://127.0.0.1:18789`。使用 `proxy.loopbackMode` 選擇受管理代理啟用時，回送受管理代理例外的行為：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`（預設）：OpenClaw 會在 Proxyline 的受管理繞過政策中註冊閘道回送 authority，讓本機閘道 WebSocket 流量可以直接連線。自訂回送閘道連接埠可運作，因為作用中閘道 URL 的主機與連接埠會被註冊。隨附的瀏覽器外掛也可以為 OpenClaw 啟動的受管理瀏覽器，註冊確切的本機 CDP readiness 與 DevTools WebSocket 端點；隨附的 Ollama 記憶嵌入供應者也可以針對確切設定的主機本機回送嵌入來源，使用自身更狹窄且受防護的直接路徑。
- `proxy`：OpenClaw 不會註冊閘道或 Ollama 回送繞過，因此該回送流量會送經受管理代理。如果代理位於遠端，則必須為 OpenClaw 主機的回送服務提供特殊路由，例如將其對應到代理可到達的主機名稱、IP 或通道。標準遠端代理會從代理主機解析 `127.0.0.1` 和 `localhost`，而不是從 OpenClaw 主機解析。
- `block`：OpenClaw 會在開啟 socket 前，拒絕閘道回送控制平面連線，以及受防護的 Ollama 主機本機嵌入回送連線。

如果 `enabled=true` 但未設定有效的代理 URL，受保護命令會啟動失敗，而不是後援為直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理閘道服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境後援最適合前景執行。如果你將它用於已安裝服務，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或 Scheduled Tasks 以該值啟動閘道。

對於 `openclaw --container ...` 命令，設定 `OPENCLAW_PROXY_URL` 時，OpenClaw 會將它轉送至以容器為目標的子命令列介面。該 URL 必須能從容器內部到達；`127.0.0.1` 指的是容器本身，而不是主機。除非你明確覆寫該安全檢查，否則 OpenClaw 會拒絕以容器為目標命令中的回送代理 URL。

## 代理需求

代理政策是安全邊界。OpenClaw 無法驗證代理是否封鎖正確的目標。

設定代理以：

- 僅繫結到回送或私人信任介面。
- 限制存取，讓只有 OpenClaw 行程、主機、容器或服務帳號可以使用它。
- 自行解析目的地，並在 DNS 解析後封鎖目的地 IP。
- 對一般 HTTP 請求與 HTTPS `CONNECT` 通道，都在連線時套用政策。
- 拒絕針對回送、私人、鏈路本機、metadata、多播、保留或文件範圍的目的地型繞過。
- 除非你完全信任 DNS 解析路徑，否則避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態與原因，但不要記錄請求本文、授權標頭、cookie 或其他秘密。
- 將代理政策納入版本控制，並像審查安全敏感設定一樣審查變更。

## 建議封鎖目的地

使用此拒絕清單作為任何正向代理、防火牆或出口政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `packages/net-policy/src/ip.ts`。相關的同等性掛鉤是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及針對 NAT64、6to4、Teredo、ISATAP 和 IPv4-mapped 形式的內嵌 IPv4 sentinel 處理。維護外部代理政策時，這些檔案是有用參考，但 OpenClaw 不會自動匯出或在你的代理中強制執行這些規則。

| 範圍或主機                                                                         | 封鎖原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 回送                                            |
| `::1/128`                                                                            | IPv6 回送                                            |
| `0.0.0.0/8`, `::/128`                                                                | 未指定與此網路位址                                  |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私有網路                                    |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local 位址與常見雲端中繼資料路徑              |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                                    |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共享位址空間                             |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                                  |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                                 |
| `240.0.0.0/4`                                                                        | 保留的 IPv4                                         |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機／私有範圍                                 |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丟棄與 ORCHIDv2 範圍                           |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 內嵌 IPv4 的 NAT64 前置碼                           |
| `2002::/16`, `2001::/32`                                                             | 內嵌 IPv4 的 6to4 與 Teredo                         |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 相容與 IPv4 對應的 IPv6                        |

如果你的雲端供應商或網路平台記載了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

請從執行 OpenClaw 的同一部主機、容器或服務帳戶驗證代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

若 HTTPS 代理端點由私有 CA 簽署：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

預設情況下，未提供自訂目的地時，命令會檢查 `https://example.com/` 是否成功，並啟動一個代理不得連到的暫時性回送金絲雀。當代理回傳非 2xx 拒絕回應，或以傳輸失敗封鎖金絲雀時，預設的拒絕檢查會通過；如果成功回應到達金絲雀，則會失敗。若未啟用並設定代理，驗證會回報設定問題；在變更設定前，請使用 `--proxy-url` 進行一次性預檢。使用 `--allowed-url` 和 `--denied-url` 測試部署特定的預期。加入 `--apns-reachable` 也可驗證直接 APNs HTTP/2 傳遞能透過代理開啟 CONNECT 通道，並收到沙箱 APNs 回應；此探測使用刻意無效的供應商權杖，因此預期會收到 `403 InvalidProviderToken`，且會計為可連線。自訂拒絕目的地採取失敗關閉：任何 HTTP 回應都表示目的地可透過代理連線，任何傳輸錯誤都會回報為不確定，因為 OpenClaw 無法證明代理封鎖了一個可連線的來源。驗證失敗時，命令會以代碼 1 結束。

自動化請使用 `--json`。JSON 輸出包含整體結果、有效的代理設定來源、任何設定錯誤，以及每個目的地檢查。代理 URL 憑證會在文字與 JSON 輸出中遮蔽：

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
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

你也可以使用 `curl` 手動驗證：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公開請求應該成功。回送與中繼資料請求應該由代理封鎖。對於 `openclaw proxy validate`，內建回送金絲雀可以區分代理拒絕與可連線來源。自訂 `--denied-url` 檢查沒有該金絲雀，因此除非你的代理公開了可另行驗證的部署特定拒絕訊號，否則請將 HTTP 回應與模糊的傳輸失敗都視為驗證失敗。

## 代理 CA 信任

當代理端點本身使用由私有 CA 簽署的憑證時，請使用受管理的 `proxy.tls.caFile`：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

該 CA 會用於代理端點的 TLS 驗證。它不是目的地 MITM 信任設定、用戶端憑證，也不是代理目的地政策的替代品。

只有在整個 節點 程序必須自程序啟動起信任額外 CA 時，才使用 `NODE_EXTRA_CA_CERTS`，例如企業 TLS 檢查系統會為程序中的每個 HTTPS 用戶端重新簽署目的地憑證。`NODE_EXTRA_CA_CERTS` 是程序全域的，且必須在 節點 啟動前存在。對於 HTTPS 代理端點信任，請優先使用 `proxy.tls.caFile`，因為它的範圍限於受管理的代理路由。

接著啟用 OpenClaw 代理路由：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

或設定：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## 限制

- 代理會改善程序內 JavaScript HTTP 與 WebSocket 用戶端的涵蓋範圍，但它不是作業系統層級的網路沙箱。
- 閘道 回送控制平面流量預設會透過 `proxy.loopbackMode: "gateway-only"` 直接本機繞過。OpenClaw 會將作用中的 閘道 回送權威註冊到 Proxyline 的受管理繞過政策，以實作該繞過。操作員可以設定 `proxy.loopbackMode: "proxy"`，將 閘道 回送流量送經受管理代理；或設定 `proxy.loopbackMode: "block"`，拒絕回送 閘道 連線。遠端代理注意事項請參閱[閘道回送模式](#gateway-loopback-mode)。
- 原始 `net`、`tls` 與 `http2` socket、原生附加元件，以及非 OpenClaw 子程序，可能會繞過 節點 層級代理路由，除非它們繼承並遵守代理環境變數。分叉的 OpenClaw 子 命令列介面 會繼承受管理代理 URL 與 `proxy.loopbackMode` 狀態。
- IRC 是位於操作員管理的轉送代理路由之外的原始 TCP/TLS 頻道。在要求所有輸出流量都必須通過該轉送代理的部署中，除非已明確核准直接 IRC 輸出，否則請設定 `channels.irc.enabled=false`。
- 本機偵錯代理是診斷工具；在受管理代理模式啟用時，其對代理請求與 CONNECT 通道的直接上游轉送預設為停用；只有在核准的本機診斷情境中才啟用直接轉送。
- 需要時，使用者本機 WebUI 與本機模型伺服器應列入操作員代理政策的允許清單；OpenClaw 不會為它們公開一般本機網路繞過。內建的 Ollama 記憶體嵌入提供者範圍較窄：只有針對從已設定 `baseUrl` 推導出的精確主機本機回送嵌入來源，才能使用受保護的直接路徑，讓受管理代理無法連到主機回送時，主機本機嵌入仍可運作。LAN、tailnet、私有網路與公開 Ollama 嵌入主機仍使用受管理代理路徑。`proxy.loopbackMode: "proxy"` 會將此 Ollama 回送流量送經受管理代理，而 `proxy.loopbackMode: "block"` 會在開啟連線前拒絕它。
- 閘道 控制平面代理繞過刻意限制於 `localhost` 與字面回送 IP URL。請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789` 進行本機直接 閘道 控制平面連線；其他主機名稱會像一般以主機名稱為基礎的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理政策。
- 請將代理政策變更視為安全敏感的營運變更。

| 表面                                                         | 受管理代理狀態                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, common WebSocket clients | 設定後會透過受管理代理 hook 路由。                                                                 |
| APNs direct HTTP/2                                           | 透過 APNs 受管理 CONNECT helper 路由。                                                            |
| Gateway control-plane loopback                               | 僅針對已設定的本機回送 閘道 URL 直接連線。                                                         |
| Debug proxy upstream forwarding                              | 受管理代理模式啟用時停用，除非為本機診斷明確啟用。                                                 |
| IRC                                                          | 原始 TCP/TLS；不會由受管理 HTTP 代理模式代理。除非已核准直接 IRC 輸出，否則請停用。               |
| Other raw `net`, `tls`, or `http2` client calls              | 落地前必須由原始 socket guard 分類。                                                              |
