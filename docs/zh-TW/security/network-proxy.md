---
read_when:
    - 你希望針對 SSRF 和 DNS 重新綁定攻擊採取縱深防禦
    - 設定 OpenClaw 執行階段流量的外部正向代理
summary: 如何透過由操作員管理的過濾代理路由 OpenClaw 執行階段 HTTP 和 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-05-07T16:23:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可以透過由操作員管理的正向代理，路由執行階段 HTTP 和 WebSocket 流量。對於想要集中出口控制、更強 SSRF 防護，以及更好網路可稽核性的部署，這是選用的縱深防禦措施。

OpenClaw 不會隨附、下載、啟動、設定或認證代理伺服器。你可以執行符合自身環境的代理技術，而 OpenClaw 會透過它路由一般程序本機 HTTP 與 WebSocket 用戶端。

## 為什麼使用代理伺服器

代理伺服器可為操作員提供一個用於輸出 HTTP 與 WebSocket 流量的網路控制點。即使不是為了 SSRF 強化，這也可能很有用：

- 集中政策：維護一套出口政策，而不是依賴每個應用程式 HTTP 呼叫點都正確套用網路規則。
- 連線時檢查：在 DNS 解析後、代理伺服器開啟上游連線前立即評估目的地。
- DNS 重新綁定防護：縮小應用程式層級 DNS 檢查與實際對外連線之間的落差。
- 更廣泛的 JavaScript 覆蓋：透過相同路徑路由一般 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端。
- 可稽核性：在出口邊界記錄允許與拒絕的目的地。
- 操作控制：強制套用目的地規則、網路分段、速率限制或輸出允許清單，而不必重新建置 OpenClaw。

代理路由是一般 HTTP 與 WebSocket 輸出的程序層級護欄。它為操作員提供一條失敗即關閉的路徑，可將支援的 JavaScript HTTP 用戶端透過他們自己的過濾代理路由，但它不是作業系統層級的網路沙箱，也不代表 OpenClaw 會認證該代理的目的地政策。

## OpenClaw 如何路由流量

當設定 `proxy.enabled=true` 且已設定代理 URL 時，受保護的執行階段程序，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過設定的代理路由一般 HTTP 與 WebSocket 輸出：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開合約是路由行為，而不是用於實作它的內部 Node 掛鉤。當 Gateway URL 使用 `localhost` 或字面 loopback IP（例如 `127.0.0.1` 或 `[::1]`）時，OpenClaw Gateway 控制平面 WebSocket 用戶端會針對 local loopback Gateway RPC 流量使用狹窄的直接路徑。即使操作員代理封鎖 loopback 目的地，該控制平面路徑也必須能夠連到 loopback Gateways。一般執行階段 HTTP 與 WebSocket 請求仍會使用設定的代理伺服器。

在內部，OpenClaw 會為此功能使用兩個程序層級路由掛鉤：

- Undici dispatcher 路由涵蓋 `fetch`、以 undici 為基礎的用戶端，以及提供自身 undici dispatcher 的傳輸。
- `global-agent` 路由涵蓋 Node 核心 `node:http` 和 `node:https` 呼叫端，包括許多建構在 `http.request`、`https.request`、`http.get` 和 `https.get` 上的函式庫。受管理代理模式會強制使用該全域代理，因此明確的 Node HTTP agents 不會意外繞過操作員代理。

某些 plugins 擁有自訂傳輸，即使存在程序層級路由，仍需要明確的代理接線。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會在該擁有者特定的傳輸路徑中遵循程序代理 env，以及受管理的 `OPENCLAW_PROXY_URL` 後備。

代理 URL 本身必須使用 `http://`。HTTPS 目的地仍可透過代理使用 HTTP `CONNECT`；這只表示 OpenClaw 預期有一個純 HTTP 正向代理監聽器，例如 `http://127.0.0.1:3128`。

代理作用中時，OpenClaw 會清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。這些繞過清單是以目的地為基礎，因此如果在其中保留 `localhost` 或 `127.0.0.1`，高風險 SSRF 目標就可能跳過過濾代理。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的程序路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段輸出的對外正向代理路由。本頁說明此功能。
- `gateway.auth.mode: "trusted-proxy"`：用於 Gateway 存取的輸入身分感知反向代理驗證。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發與支援的本機除錯代理與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy`：選擇加入 `web_fetch`，讓操作員控制的 HTTP(S) env 代理解析 DNS，同時保留預設嚴格 DNS 釘選與主機名稱政策。請參閱 [Web fetch](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- 頻道或提供者特定的代理設定：針對特定傳輸的擁有者特定覆寫。當目標是在整個執行階段集中出口控制時，請優先使用受管理網路代理。

## 設定

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

你也可以透過環境提供 URL，同時在設定中保留 `proxy.enabled=true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 的優先順序高於 `OPENCLAW_PROXY_URL`。

### Gateway Loopback 模式

本機 Gateway 控制平面用戶端通常會連線到 loopback WebSocket，例如 `ws://127.0.0.1:18789`。使用 `proxy.loopbackMode` 選擇受管理代理作用中時，該流量的行為：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`（預設）：OpenClaw 會在作用中的 `global-agent` `NO_PROXY` 控制器中註冊 Gateway loopback authority，讓本機 Gateway WebSocket 流量可以直接連線。自訂 loopback Gateway 連接埠可以運作，因為作用中 Gateway URL 的主機與連接埠會被註冊。
- `proxy`：OpenClaw 不會註冊 Gateway loopback `NO_PROXY` authority，因此本機 Gateway 流量會透過受管理代理傳送。如果代理是遠端代理，它必須為 OpenClaw 主機的 loopback 服務提供特殊路由，例如將其對應到代理可連線的主機名稱、IP 或通道。標準遠端代理會從代理主機解析 `127.0.0.1` 和 `localhost`，而不是從 OpenClaw 主機解析。
- `block`：OpenClaw 會在開啟 socket 之前拒絕 loopback Gateway 控制平面連線。

如果 `enabled=true` 但未設定有效的代理 URL，受保護的命令會啟動失敗，而不是後備為直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理 Gateway 服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境後備最適合前景執行。如果你將它用於已安裝的服務，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或 Scheduled Tasks 使用該值啟動 gateway。

對於 `openclaw --container ...` 命令，若已設定 `OPENCLAW_PROXY_URL`，OpenClaw 會將其轉送到以容器為目標的子 CLI。該 URL 必須能從容器內連線；`127.0.0.1` 指的是容器本身，而不是主機。除非你明確覆寫該安全檢查，否則 OpenClaw 會拒絕以容器為目標的命令使用 loopback 代理 URL。

## 代理需求

代理政策是安全邊界。OpenClaw 無法驗證代理是否封鎖正確的目標。

設定代理以：

- 僅綁定到 loopback 或受信任的私人介面。
- 限制存取，讓只有 OpenClaw 程序、主機、容器或服務帳戶可以使用它。
- 自行解析目的地，並在 DNS 解析後封鎖目的地 IP。
- 在連線時同時對純 HTTP 請求與 HTTPS `CONNECT` 通道套用政策。
- 拒絕針對 loopback、私人、link-local、中繼資料、多播、保留或文件範圍的目的地繞過。
- 避免使用主機名稱允許清單，除非你完全信任 DNS 解析路徑。
- 記錄目的地、決策、狀態和原因，但不要記錄請求本文、授權標頭、cookie 或其他秘密。
- 將代理政策置於版本控制下，並像審查安全敏感設定一樣審查變更。

## 建議封鎖的目的地

請將此拒絕清單作為任何正向代理、防火牆或出口政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相關的對等掛鉤是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及 NAT64、6to4、Teredo、ISATAP 和 IPv4-mapped 形式的嵌入式 IPv4 sentinel 處理。維護外部代理政策時，這些檔案是有用的參考，但 OpenClaw 不會自動匯出這些規則，也不會在你的代理中強制套用這些規則。

| 範圍或主機                                                                         | 封鎖原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | 未指定與本網路位址                                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私人網路                                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local 位址與常見雲端中繼資料路徑               |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                                     |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共用位址空間                              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                                   |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                                 |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                            |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機/私人範圍                                   |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丟棄與 ORCHIDv2 範圍                            |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含嵌入式 IPv4 的 NAT64 前綴                          |
| `2002::/16`, `2001::/32`                                                             | 含嵌入式 IPv4 的 6to4 與 Teredo                      |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible 與 IPv4-mapped IPv6                  |

如果你的雲端提供者或網路平台記錄了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

請從執行 OpenClaw 的同一主機、容器或服務帳戶驗證代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

預設情況下，若未提供自訂目的地，此命令會檢查 `https://example.com/` 是否成功，並啟動一個代理不得連線到的暫時回環 canary。當代理傳回非 2xx 的拒絕回應，或以傳輸失敗封鎖該 canary 時，預設的拒絕檢查會通過；如果成功回應抵達該 canary，則檢查會失敗。如果未啟用並設定代理，驗證會回報設定問題；在變更設定前，請使用 `--proxy-url` 進行一次性預檢。使用 `--allowed-url` 和 `--denied-url` 測試部署特定的預期。加入 `--apns-reachable` 也可驗證直接 APNs HTTP/2 傳遞是否能透過代理開啟 CONNECT 通道，並接收沙盒 APNs 回應；此探測會使用刻意無效的提供者權杖，因此預期會收到 `403 InvalidProviderToken`，且會計為可連線。自訂拒絕目的地採用失敗封閉原則：任何 HTTP 回應都代表該目的地可透過代理連線，而任何傳輸錯誤都會回報為不確定，因為 OpenClaw 無法證明代理封鎖了可連線的來源。驗證失敗時，此命令會以代碼 1 結束。

使用 `--json` 進行自動化。JSON 輸出包含整體結果、有效代理設定來源、任何設定錯誤，以及每個目的地檢查。代理 URL 認證資訊會在文字與 JSON 輸出中遮蔽：

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

公開請求應該成功。回環與中繼資料請求應該被代理封鎖。對於 `openclaw proxy validate`，內建回環 canary 可以區分代理拒絕與可連線來源。自訂 `--denied-url` 檢查沒有該 canary，因此除非你的代理公開了可另行驗證的部署特定拒絕訊號，否則請將 HTTP 回應和含糊的傳輸失敗都視為驗證失敗。

然後啟用 OpenClaw 代理路由：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

或設定：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## 限制

- 代理會改善程序本機 JavaScript HTTP 與 WebSocket 用戶端的涵蓋範圍，但它不是作業系統層級的網路沙盒。
- Gateway 回環控制平面流量預設會透過 `proxy.loopbackMode: "gateway-only"` 直接本機旁路。OpenClaw 會在受管理的 `global-agent` `NO_PROXY` 控制器中註冊作用中的 Gateway 回環 authority，以實作該旁路。操作員可以設定 `proxy.loopbackMode: "proxy"`，將 Gateway 回環流量透過受管理代理傳送，或設定 `proxy.loopbackMode: "block"`，拒絕回環 Gateway 連線。請參閱 [Gateway 回環模式](#gateway-loopback-mode) 了解遠端代理注意事項。
- 原始 `net`、`tls` 和 `http2` socket、原生附加元件，以及非 OpenClaw 子程序，除非繼承並遵循代理環境變數，否則可能會繞過 Node 層級的代理路由。Fork 出來的 OpenClaw 子 CLI 會繼承受管理代理 URL 與 `proxy.loopbackMode` 狀態。
- IRC 是位於操作員管理的正向代理路由之外的原始 TCP/TLS 通道。在要求所有輸出流量都經由該正向代理的部署中，除非已明確核准直接 IRC 輸出流量，否則請設定 `channels.irc.enabled=false`。
- 本機除錯代理是診斷工具；在受管理代理模式啟用時，其對代理請求與 CONNECT 通道的直接上游轉送預設為停用；只有在已核准的本機診斷情境中才啟用直接轉送。
- 使用者本機 WebUI 與本機模型伺服器在需要時應列入操作員代理政策的允許清單；OpenClaw 不會為它們公開一般性的本機網路旁路。
- Gateway 控制平面代理旁路刻意限制於 `localhost` 與字面回環 IP URL。針對本機直接 Gateway 控制平面連線，請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`；其他主機名稱會像一般基於主機名稱的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理政策。
- 請將代理政策變更視為安全敏感的營運變更。

| 介面                                                         | 受管理代理狀態                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`、`node:http`、`node:https`、常見 WebSocket 用戶端    | 設定後會透過受管理代理掛鉤進行路由。                                                               |
| APNs 直接 HTTP/2                                             | 透過 APNs 受管理 CONNECT 輔助程式路由。                                                            |
| Gateway 控制平面回環                                        | 僅針對已設定的 local loopback Gateway URL 直接連線。                                                |
| 除錯代理上游轉送                                            | 受管理代理模式啟用時停用，除非已明確針對本機診斷啟用。                                             |
| IRC                                                          | 原始 TCP/TLS；不會由受管理 HTTP 代理模式代理。除非已核准直接 IRC 輸出流量，否則請停用。            |
| 其他原始 `net`、`tls` 或 `http2` 用戶端呼叫                 | 在落地前必須先由原始 socket guard 分類。                                                           |
