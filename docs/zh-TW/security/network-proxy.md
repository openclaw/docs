---
read_when:
    - 你需要針對 SSRF 和 DNS 重新綁定攻擊的縱深防禦
    - 設定 OpenClaw 執行階段流量的外部正向代理
summary: 如何透過操作員管理的過濾代理路由 OpenClaw 執行階段 HTTP 和 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-05-06T18:01:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可以透過操作者管理的正向代理伺服器，路由執行階段的 HTTP 和 WebSocket 流量。這是選用的縱深防禦機制，適合想要集中出口控制、更強 SSRF 防護，以及更好網路可稽核性的部署。

OpenClaw 不會隨附、下載、啟動、設定或認證代理伺服器。你可以執行符合自身環境的代理技術，而 OpenClaw 會透過它路由一般程序本機的 HTTP 和 WebSocket 用戶端。

## 為什麼使用代理伺服器

代理伺服器讓操作者可以針對輸出的 HTTP 和 WebSocket 流量，擁有單一網路控制點。即使不只是為了 SSRF 強化，這也可能很有用：

- 集中式政策：維護一套出口政策，而不是仰賴每個應用程式 HTTP 呼叫點都正確套用網路規則。
- 連線時檢查：在 DNS 解析後，且代理伺服器開啟上游連線之前，立即評估目的地。
- DNS 重新綁定防禦：縮小應用程式層級 DNS 檢查與實際輸出連線之間的落差。
- 更廣泛的 JavaScript 覆蓋範圍：將一般 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端路由到相同路徑。
- 可稽核性：在出口邊界記錄允許與拒絕的目的地。
- 營運控制：不需要重新建置 OpenClaw，就能強制執行目的地規則、網路分段、速率限制或輸出允許清單。

代理路由是一般 HTTP 和 WebSocket 出口流量的程序層級防護欄。它讓操作者能以失敗即關閉的路徑，將支援的 JavaScript HTTP 用戶端路由至自己的篩選代理伺服器，但它不是作業系統層級的網路沙箱，也不會讓 OpenClaw 認證該代理伺服器的目的地政策。

## OpenClaw 如何路由流量

當 `proxy.enabled=true` 且已設定代理伺服器 URL 時，受保護的執行階段程序，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過設定的代理伺服器路由一般 HTTP 和 WebSocket 出口流量：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開契約是路由行為，而不是用來實作它的內部 Node 掛鉤。當 Gateway URL 使用 `localhost` 或字面回送 IP，例如 `127.0.0.1` 或 `[::1]` 時，OpenClaw Gateway 控制平面的 WebSocket 用戶端會針對 local loopback Gateway RPC 流量使用狹窄的直接路徑。即使操作者代理伺服器封鎖回送目的地，該控制平面路徑也必須能連到回送 Gateway。一般執行階段 HTTP 和 WebSocket 請求仍會使用設定的代理伺服器。

在內部，OpenClaw 針對此功能使用兩種程序層級路由掛鉤：

- Undici dispatcher 路由涵蓋 `fetch`、以 undici 為基礎的用戶端，以及提供自身 undici dispatcher 的傳輸。
- `global-agent` 路由涵蓋 Node 核心 `node:http` 和 `node:https` 呼叫者，包括許多建構在 `http.request`、`https.request`、`http.get` 和 `https.get` 之上的函式庫。受管理代理模式會強制使用該全域代理，因此明確的 Node HTTP 代理不會意外繞過操作者代理伺服器。

有些 Plugin 擁有自訂傳輸，即使存在程序層級路由，也需要明確的代理接線。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會遵循程序代理環境，以及該擁有者專屬傳輸路徑中的受管理 `OPENCLAW_PROXY_URL` 備援。

代理伺服器 URL 本身必須使用 `http://`。HTTPS 目的地仍可透過代理伺服器使用 HTTP `CONNECT` 支援；這只表示 OpenClaw 預期的是純 HTTP 正向代理監聽器，例如 `http://127.0.0.1:3128`。

代理伺服器啟用時，OpenClaw 會清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。這些繞過清單是以目的地為基礎，因此若保留 `localhost` 或 `127.0.0.1`，高風險 SSRF 目標就能跳過篩選代理伺服器。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的程序路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段出口流量的輸出正向代理路由。本頁記錄此功能。
- `gateway.auth.mode: "trusted-proxy"`：用於 Gateway 存取的輸入身分感知反向代理驗證。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發與支援的本機偵錯代理伺服器與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy`：選擇讓 `web_fetch` 使用操作者控制的 HTTP(S) 環境代理解析 DNS，同時保留預設嚴格的 DNS 釘選與主機名稱政策。請參閱[網頁擷取](/zh-TW/tools/web-fetch#trusted-env-proxy)。
- 頻道或提供者專屬代理設定：特定傳輸的擁有者專屬覆寫。若目標是跨執行階段集中出口控制，請優先使用受管理網路代理。

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

`proxy.proxyUrl` 優先於 `OPENCLAW_PROXY_URL`。

### Gateway 回送模式

本機 Gateway 控制平面用戶端通常會連線到回送 WebSocket，例如 `ws://127.0.0.1:18789`。使用 `proxy.loopbackMode` 來選擇受管理代理伺服器啟用時，該流量的行為方式：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`（預設）：OpenClaw 會在作用中的 `global-agent` `NO_PROXY` 控制器中註冊 Gateway 回送 authority，讓本機 Gateway WebSocket 流量可以直接連線。自訂回送 Gateway 連接埠也能運作，因為作用中 Gateway URL 的主機與連接埠都會被註冊。
- `proxy`：OpenClaw 不會註冊 Gateway 回送 `NO_PROXY` authority，因此本機 Gateway 流量會透過受管理代理伺服器傳送。如果代理伺服器是遠端的，它必須為 OpenClaw 主機的回送服務提供特殊路由，例如將其對應到代理可達的主機名稱、IP 或通道。標準遠端代理會從代理主機解析 `127.0.0.1` 和 `localhost`，而不是從 OpenClaw 主機解析。
- `block`：OpenClaw 會在開啟 socket 之前拒絕回送 Gateway 控制平面連線。

如果 `enabled=true` 但未設定有效的代理伺服器 URL，受保護的命令會啟動失敗，而不是退回直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理 Gateway 服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境備援最適合前景執行。如果你要搭配已安裝的服務使用它，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或排程工作以該值啟動 gateway。

對於 `openclaw --container ...` 命令，當 `OPENCLAW_PROXY_URL` 已設定時，OpenClaw 會將它轉送到以容器為目標的子 CLI。該 URL 必須能從容器內部連到；`127.0.0.1` 指的是容器本身，而不是主機。除非你明確覆寫該安全檢查，否則 OpenClaw 會拒絕以容器為目標命令中的回送代理 URL。

## 代理伺服器需求

代理伺服器政策是安全邊界。OpenClaw 無法驗證代理伺服器是否封鎖正確的目標。

將代理伺服器設定為：

- 只繫結到回送或私人受信任介面。
- 限制存取，讓只有 OpenClaw 程序、主機、容器或服務帳戶能使用它。
- 自行解析目的地，並在 DNS 解析後封鎖目的地 IP。
- 在連線時對純 HTTP 請求與 HTTPS `CONNECT` 通道套用政策。
- 拒絕針對回送、私人、連結本機、中繼資料、多播、保留或文件範圍的目的地式繞過。
- 避免使用主機名稱允許清單，除非你完全信任 DNS 解析路徑。
- 記錄目的地、決策、狀態和原因，但不要記錄請求本文、授權標頭、Cookie 或其他秘密。
- 將代理伺服器政策置於版本控制下，並像安全敏感設定一樣審查變更。

## 建議封鎖的目的地

將此拒絕清單作為任何正向代理伺服器、防火牆或出口政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相關一致性掛鉤是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及針對 NAT64、6to4、Teredo、ISATAP 和 IPv4 對應形式的嵌入式 IPv4 哨兵處理。維護外部代理伺服器政策時，這些檔案是實用參考，但 OpenClaw 不會自動匯出或在你的代理伺服器中強制執行這些規則。

| 範圍或主機                                                                         | 封鎖原因                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 回送                                  |
| `::1/128`                                                                            | IPv6 回送                                  |
| `0.0.0.0/8`, `::/128`                                                                | 未指定與此網路位址                         |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私人網路                           |
| `169.254.0.0/16`, `fe80::/10`                                                        | 連結本機位址與常見雲端中繼資料路徑        |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                           |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共享位址空間                    |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                         |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                       |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機/私人範圍                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丟棄與 ORCHIDv2 範圍                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含嵌入式 IPv4 的 NAT64 前綴                |
| `2002::/16`, `2001::/32`                                                             | 含嵌入式 IPv4 的 6to4 與 Teredo            |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 相容與 IPv4 對應 IPv6                 |

如果你的雲端提供者或網路平台記錄了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

從執行 OpenClaw 的相同主機、容器或服務帳戶驗證代理伺服器：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

依預設，若未提供自訂目的地，此命令會檢查 `https://example.com/` 是否成功，並啟動一個代理不得連到的暫時回送金絲雀。當代理回傳非 2xx 的拒絕回應，或以傳輸失敗阻擋該金絲雀時，預設的拒絕檢查會通過；如果成功回應抵達金絲雀，則檢查失敗。若未啟用並設定代理，驗證會回報設定問題；在變更設定前，可使用 `--proxy-url` 進行一次性預檢。使用 `--allowed-url` 和 `--denied-url` 測試特定部署的預期。加入 `--apns-reachable` 也可驗證直接 APNs HTTP/2 傳送能否透過代理開啟 CONNECT 通道，並接收沙箱 APNs 回應；此探測會使用刻意無效的提供者權杖，因此預期會得到 `403 InvalidProviderToken`，且會計為可連線。自訂拒絕目的地採用失敗即關閉：任何 HTTP 回應都表示該目的地可透過代理抵達，而任何傳輸錯誤都會回報為無法判定，因為 OpenClaw 無法證明代理阻擋了可抵達的來源。驗證失敗時，此命令會以代碼 1 結束。

使用 `--json` 進行自動化。JSON 輸出包含整體結果、有效的代理設定來源、任何設定錯誤，以及每個目的地檢查。代理 URL 認證資訊會在文字與 JSON 輸出中遮蔽：

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

公開請求應該成功。回送與中繼資料請求應該被代理阻擋。對於 `openclaw proxy validate`，內建回送金絲雀可以區分代理拒絕與可抵達的來源。自訂 `--denied-url` 檢查沒有該金絲雀，因此除非你的代理公開了可另外驗證的特定部署拒絕訊號，否則請將 HTTP 回應和模糊的傳輸失敗都視為驗證失敗。

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

- 代理可改善程序本機 JavaScript HTTP 與 WebSocket 用戶端的涵蓋範圍，但它不是 OS 層級的網路沙箱。
- Gateway 回送控制平面流量預設透過 `proxy.loopbackMode: "gateway-only"` 直接在本機略過代理。OpenClaw 會在受管理的 `global-agent` `NO_PROXY` 控制器中註冊作用中的 Gateway 回送權威，以實作該略過。操作人員可以設定 `proxy.loopbackMode: "proxy"`，將 Gateway 回送流量透過受管理代理傳送，或設定 `proxy.loopbackMode: "block"`，拒絕回送 Gateway 連線。關於遠端代理的注意事項，請參閱 [Gateway 回送模式](#gateway-loopback-mode)。
- 原始 `net`、`tls` 和 `http2` socket、原生附加元件，以及非 OpenClaw 子程序，可能會略過 Node 層級代理路由，除非它們繼承並遵守代理環境變數。分叉的 OpenClaw 子 CLI 會繼承受管理代理 URL 與 `proxy.loopbackMode` 狀態。
- IRC 是位於操作人員管理的轉送代理路由之外的原始 TCP/TLS 頻道。在要求所有輸出流量都經由該轉送代理的部署中，除非已明確核准直接 IRC 輸出流量，否則請設定 `channels.irc.enabled=false`。
- 本機偵錯代理是診斷工具；在受管理代理模式啟用時，其對代理請求與 CONNECT 通道的直接上游轉送預設為停用；僅針對已核准的本機診斷啟用直接轉送。
- 需要時，應在操作人員代理政策中允許使用者本機 Web UI 與本機模型伺服器；OpenClaw 不會為它們公開通用的本機網路略過機制。
- Gateway 控制平面代理略過刻意限制於 `localhost` 和明確的回送 IP URL。對於本機直接 Gateway 控制平面連線，請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`；其他主機名稱會像一般以主機名稱為基礎的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理政策。
- 請將代理政策變更視為對安全性敏感的操作變更。
