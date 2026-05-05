---
read_when:
    - 你希望針對 SSRF 和 DNS 重新綁定攻擊採取縱深防禦
    - 為 OpenClaw 執行階段流量設定外部正向代理
summary: 如何將 OpenClaw 執行階段 HTTP 與 WebSocket 流量透過由操作員管理的篩選代理伺服器路由
title: 網路代理
x-i18n:
    generated_at: "2026-05-05T01:49:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# 網路代理

OpenClaw 可以透過由操作員管理的正向代理，路由執行階段的 HTTP 和 WebSocket 流量。對於想要集中出口控制、更強 SSRF 防護，以及更好的網路稽核性的部署，這是選用的深層防禦措施。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。你可以執行適合你環境的代理技術，而 OpenClaw 會透過它路由一般的程序本機 HTTP 和 WebSocket 用戶端。

## 為什麼使用代理？

代理讓操作員能針對出站 HTTP 和 WebSocket 流量設置單一網路控制點。即使在 SSRF 強化之外，這也很有用：

- 集中政策：維護一套出口政策，而不是仰賴每個應用程式 HTTP 呼叫點都正確套用網路規則。
- 連線時檢查：在 DNS 解析後、代理開啟上游連線前立即評估目的地。
- DNS 重新繫結防禦：縮小應用程式層級 DNS 檢查與實際出站連線之間的落差。
- 更廣泛的 JavaScript 覆蓋：將一般的 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端透過相同路徑路由。
- 稽核性：在出口邊界記錄允許與拒絕的目的地。
- 操作控制：不需重建 OpenClaw，即可強制執行目的地規則、網路分段、速率限制或出站允許清單。

代理路由是針對一般 HTTP 和 WebSocket 出口的程序層級防護欄。它讓操作員可以用預設拒絕的方式，將受支援的 JavaScript HTTP 用戶端透過自己的篩選代理路由，但它不是 OS 層級的網路沙箱，也不代表 OpenClaw 會認證代理的目的地政策。

## OpenClaw 如何路由流量

當 `proxy.enabled=true` 且已設定代理 URL 時，受保護的執行階段程序，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過設定的代理路由一般 HTTP 和 WebSocket 出口：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開合約是路由行為，而不是用來實作它的內部 Node hook。OpenClaw Gateway 控制平面 WebSocket 用戶端，在 Gateway URL 使用 `localhost` 或字面 local loopback IP（例如 `127.0.0.1` 或 `[::1]`）時，會針對 local loopback Gateway RPC 流量使用狹窄的直接路徑。即使操作員代理封鎖 loopback 目的地，該控制平面路徑仍必須能到達 loopback Gateway。一般執行階段 HTTP 和 WebSocket 請求仍會使用設定的代理。

在內部，OpenClaw 針對此功能使用兩個程序層級的路由 hook：

- Undici dispatcher 路由涵蓋 `fetch`、undici 支援的用戶端，以及提供自身 undici dispatcher 的傳輸。
- `global-agent` 路由涵蓋 Node 核心 `node:http` 和 `node:https` 呼叫者，包括許多建構於 `http.request`、`https.request`、`http.get` 和 `https.get` 之上的函式庫。受管理代理模式會強制使用該全域代理，避免明確的 Node HTTP 代理意外繞過操作員代理。

有些 Plugin 擁有自訂傳輸，即使存在程序層級路由，也需要明確的代理接線。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會遵守程序代理 env 加上受管理的 `OPENCLAW_PROXY_URL` 後備，並在該擁有者特定的傳輸路徑中套用。

代理 URL 本身必須使用 `http://`。HTTPS 目的地仍可透過代理搭配 HTTP `CONNECT` 支援；這只表示 OpenClaw 預期的是純 HTTP 正向代理監聽器，例如 `http://127.0.0.1:3128`。

代理啟用期間，OpenClaw 會清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。這些繞過清單是以目的地為基礎，因此若保留 `localhost` 或 `127.0.0.1`，高風險 SSRF 目標就能略過篩選代理。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的程序路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段出口的出站正向代理路由。本頁記錄此功能。
- `gateway.auth.mode: "trusted-proxy"`：Gateway 存取的入站身分感知反向代理驗證。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發和支援的本機除錯代理與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy`：讓 `web_fetch` 選擇加入，以允許操作員控制的 HTTP(S) env 代理解析 DNS，同時保留預設的嚴格 DNS 釘選與主機名稱政策。請參閱 [Web 擷取](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- Channel 或 provider 特定代理設定：針對特定傳輸的擁有者特定覆寫。當目標是跨執行階段的集中出口控制時，請優先使用受管理的網路代理。

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

如果 `enabled=true` 但未設定有效的代理 URL，受保護的命令會在啟動時失敗，而不是回退到直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理 Gateway 服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境後備最適合前景執行。如果你將它用於已安裝的服務，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或 Scheduled Tasks 以該值啟動 Gateway。

對於 `openclaw --container ...` 命令，當已設定 `OPENCLAW_PROXY_URL` 時，OpenClaw 會將它轉送到以容器為目標的子 CLI。該 URL 必須能從容器內部到達；`127.0.0.1` 指的是容器本身，而不是主機。除非你明確覆寫該安全檢查，否則 OpenClaw 會拒絕容器目標命令的 loopback 代理 URL。

## 代理需求

代理政策就是安全邊界。OpenClaw 無法驗證代理是否封鎖正確的目標。

請將代理設定為：

- 只繫結到 loopback 或私人受信任介面。
- 限制存取，讓只有 OpenClaw 程序、主機、容器或服務帳戶可以使用它。
- 自行解析目的地，並在 DNS 解析後封鎖目的地 IP。
- 針對純 HTTP 請求和 HTTPS `CONNECT` 通道，在連線時套用政策。
- 拒絕針對 loopback、私人、link-local、中繼資料、多播、保留或文件範圍的目的地型繞過。
- 除非你完全信任 DNS 解析路徑，否則避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態和原因，但不要記錄請求本文、授權標頭、Cookie 或其他祕密。
- 將代理政策納入版本控制，並像審查安全敏感設定一樣審查變更。

## 建議封鎖的目的地

請將此拒絕清單作為任何正向代理、防火牆或出口政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相關一致性 hook 包括 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及針對 NAT64、6to4、Teredo、ISATAP 和 IPv4-mapped 形式的內嵌 IPv4 sentinel 處理。維護外部代理政策時，這些檔案是有用的參考，但 OpenClaw 不會自動匯出或在你的代理中強制執行這些規則。

| 範圍或主機                                                                           | 封鎖原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | 未指定與此網路位址                                  |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私人網路                                    |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local 位址與常見雲端中繼資料路徑              |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                                    |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共用位址空間                             |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                                  |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                                 |
| `240.0.0.0/4`                                                                        | 保留的 IPv4                                         |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機/私人範圍                                  |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard 與 ORCHIDv2 範圍                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含內嵌 IPv4 的 NAT64 前綴                           |
| `2002::/16`, `2001::/32`                                                             | 含內嵌 IPv4 的 6to4 與 Teredo                       |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible 與 IPv4-mapped IPv6                 |

如果你的雲端供應商或網路平台記錄了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

請從執行 OpenClaw 的相同主機、容器或服務帳戶驗證代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

預設情況下，當未提供自訂目的地時，此命令會檢查 `https://example.com/` 是否成功，並啟動一個臨時 loopback canary，代理不得觸及它。當代理回傳非 2xx 拒絕回應，或因傳輸失敗而封鎖 canary 時，預設拒絕檢查會通過；如果成功回應到達 canary，則會失敗。如果未啟用並設定代理，驗證會回報設定問題；在變更設定前，請使用 `--proxy-url` 進行一次性預檢。使用 `--allowed-url` 和 `--denied-url` 測試部署特定預期。加入 `--apns-reachable` 也可驗證直接 APNs HTTP/2 傳遞是否能透過代理開啟 CONNECT 通道並接收 sandbox APNs 回應；此探測使用刻意無效的 provider token，因此預期會出現 `403 InvalidProviderToken`，且會視為可到達。自訂拒絕目的地採用預設拒絕：任何 HTTP 回應都表示該目的地可透過代理到達，而任何傳輸錯誤都會回報為不確定，因為 OpenClaw 無法證明代理封鎖了可到達的來源。驗證失敗時，命令會以代碼 1 結束。

使用 `--json` 進行自動化。JSON 輸出包含整體結果、實際生效的代理設定來源、任何設定錯誤，以及每個目的地檢查。Proxy URL 認證資訊會在文字和 JSON 輸出中被遮蔽：

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

公開請求應該會成功。loopback 和中繼資料請求應該會被代理封鎖。對於 `openclaw proxy validate`，內建的 loopback canary 可以區分代理拒絕與可連線來源。自訂 `--denied-url` 檢查沒有該 canary，因此請將 HTTP 回應和模稜兩可的傳輸失敗都視為驗證失敗，除非你的代理公開了可另外驗證的部署專屬拒絕訊號。

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

- 代理可改善程序本機 JavaScript HTTP 和 WebSocket 用戶端的涵蓋範圍，但它不是作業系統層級的網路沙箱。
- 原始 `net`、`tls` 和 `http2` socket、原生附加元件，以及子程序可能會繞過 Node 層級的代理路由，除非它們繼承並遵循代理環境變數。
- IRC 是在操作員管理的轉送代理路由之外的原始 TCP/TLS channel。在要求所有輸出流量都經過該轉送代理的部署中，除非已明確核准直接 IRC 輸出，否則請設定 `channels.irc.enabled=false`。
- 本機偵錯代理是診斷工具；在受管代理模式啟用時，其針對代理請求和 CONNECT 通道的直接上游轉送預設為停用；只有在已核准的本機診斷中才啟用直接轉送。
- 需要時，使用者本機 WebUI 和本機模型伺服器應加入操作員代理政策的允許清單；OpenClaw 不會為它們公開一般性的本機網路繞過。
- Gateway 控制平面代理繞過刻意限制為 `localhost` 和字面 loopback IP URL。請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789` 進行本機直接 Gateway 控制平面連線；其他主機名稱會像一般以主機名稱為基礎的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理政策。
- 請將代理政策變更視為安全敏感的營運變更。
