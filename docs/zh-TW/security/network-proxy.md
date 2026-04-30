---
read_when:
    - 你想針對 SSRF 和 DNS 重新綁定攻擊採取縱深防禦
    - 為 OpenClaw 執行階段流量設定外部正向代理
summary: 如何透過由操作員管理的過濾代理路由 OpenClaw 執行階段的 HTTP 與 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-04-30T03:39:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# 網路代理

OpenClaw 可以透過操作員管理的正向代理路由執行階段 HTTP 和 WebSocket 流量。這是選用的縱深防禦，適用於需要集中出口控制、更強 SSRF 防護，以及更好網路稽核能力的部署。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。你可以執行符合自身環境的代理技術，而 OpenClaw 會透過它路由一般的處理程序本機 HTTP 和 WebSocket 用戶端。

## 為什麼使用代理？

代理可為操作員提供一個用於輸出 HTTP 和 WebSocket 流量的網路控制點。即使不只是為了強化 SSRF，這也很有用：

- 集中政策：維護單一出口政策，而不是仰賴每個應用程式 HTTP 呼叫位置都正確套用網路規則。
- 連線時檢查：在 DNS 解析後、代理開啟上游連線前立即評估目的地。
- DNS 重新綁定防禦：降低應用程式層級 DNS 檢查與實際輸出連線之間的落差。
- 更廣泛的 JavaScript 覆蓋範圍：將一般 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端透過同一路徑路由。
- 稽核能力：在出口邊界記錄允許和拒絕的目的地。
- 營運控制：在不重新建置 OpenClaw 的情況下強制執行目的地規則、網路分段、速率限制，或輸出允許清單。

代理路由是一般 HTTP 和 WebSocket 輸出的處理程序層級防護欄。它為操作員提供一條故障關閉路徑，可將支援的 JavaScript HTTP 用戶端透過自己的過濾代理進行路由，但它不是作業系統層級的網路沙箱，也不表示 OpenClaw 會認證代理的目的地政策。

## OpenClaw 如何路由流量

當 `proxy.enabled=true` 且已設定代理 URL 時，受保護的執行階段處理程序，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過設定的代理路由一般 HTTP 和 WebSocket 輸出：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開合約是路由行為，而不是用來實作它的內部 Node hook。當 Gateway URL 使用 `localhost` 或字面 loopback IP，例如 `127.0.0.1` 或 `[::1]` 時，OpenClaw Gateway 控制平面 WebSocket 用戶端會針對 local loopback Gateway RPC 流量使用狹窄的直接路徑。即使操作員代理封鎖 loopback 目的地，該控制平面路徑仍必須能夠連到 loopback Gateway。一般執行階段 HTTP 和 WebSocket 請求仍會使用設定的代理。

在內部，OpenClaw 對此功能使用兩個處理程序層級路由 hook：

- Undici dispatcher 路由涵蓋 `fetch`、undici 支援的用戶端，以及提供自身 undici dispatcher 的傳輸。
- `global-agent` 路由涵蓋 Node 核心 `node:http` 和 `node:https` 呼叫端，包括許多建立在 `http.request`、`https.request`、`http.get` 和 `https.get` 之上的函式庫。受管理代理模式會強制使用該全域 agent，避免明確的 Node HTTP agent 意外繞過操作員代理。

某些 Plugin 擁有自訂傳輸，即使存在處理程序層級路由，也需要明確的代理接線。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會遵守處理程序代理環境，加上該擁有者特定傳輸路徑中的受管理 `OPENCLAW_PROXY_URL` 備援。

代理 URL 本身必須使用 `http://`。HTTPS 目的地仍支援透過代理搭配 HTTP `CONNECT` 使用；這只表示 OpenClaw 預期的是純 HTTP 正向代理監聽器，例如 `http://127.0.0.1:3128`。

代理啟用時，OpenClaw 會清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。這些繞過清單是以目的地為基礎，因此若保留 `localhost` 或 `127.0.0.1`，會讓高風險 SSRF 目標跳過過濾代理。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的處理程序路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段輸出的輸出正向代理路由。本頁記錄此功能。
- `gateway.auth.mode: "trusted-proxy"`：用於 Gateway 存取的輸入身份感知反向代理驗證。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發和支援的本機偵錯代理與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- 頻道或提供者特定的代理設定：特定傳輸的擁有者特定覆寫。若目標是在整個執行階段集中控制輸出，請優先使用受管理的網路代理。

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

如果 `enabled=true` 但未設定有效的代理 URL，受保護的命令會啟動失敗，而不是退回直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理 Gateway 服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境備援最適合前景執行。如果你將它用於已安裝的服務，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境中，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或 Scheduled Tasks 以該值啟動 Gateway。

對於 `openclaw --container ...` 命令，當 `OPENCLAW_PROXY_URL` 已設定時，OpenClaw 會將它轉送到面向容器的子 CLI。該 URL 必須能從容器內部連到；`127.0.0.1` 指的是容器本身，而不是主機。除非你明確覆寫該安全檢查，否則 OpenClaw 會拒絕面向容器命令使用 loopback 代理 URL。

## 代理需求

代理政策是安全邊界。OpenClaw 無法驗證代理是否封鎖了正確的目標。

設定代理以：

- 僅繫結到 loopback 或私有受信任介面。
- 限制存取，讓只有 OpenClaw 處理程序、主機、容器或服務帳號能夠使用它。
- 自行解析目的地，並在 DNS 解析後封鎖目的地 IP。
- 對純 HTTP 請求和 HTTPS `CONNECT` 通道，在連線時套用政策。
- 拒絕針對 loopback、私有、連結本機、中繼資料、多播、保留或文件範圍的目的地型繞過。
- 除非你完全信任 DNS 解析路徑，否則避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態和原因，但不要記錄請求主體、授權標頭、cookie 或其他秘密。
- 將代理政策置於版本控制之下，並像安全敏感設定一樣審查變更。

## 建議封鎖的目的地

使用此拒絕清單作為任何正向代理、防火牆或出口政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相關的同等性 hook 包括 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及針對 NAT64、6to4、Teredo、ISATAP 和 IPv4-mapped 形式的內嵌 IPv4 sentinel 處理。維護外部代理政策時，這些檔案是有用的參考，但 OpenClaw 不會自動在你的代理中匯出或強制執行這些規則。

| 範圍或主機                                                                           | 封鎖原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | 未指定與此網路位址                                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私有網路                                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | 連結本機位址與常見雲端中繼資料路徑                   |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                                     |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共享位址空間                              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                                   |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                                 |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                            |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機/私有範圍                                   |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丟棄與 ORCHIDv2 範圍                            |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含內嵌 IPv4 的 NAT64 前綴                            |
| `2002::/16`, `2001::/32`                                                             | 含內嵌 IPv4 的 6to4 與 Teredo                        |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible 與 IPv4-mapped IPv6                  |

如果你的雲端提供者或網路平台記錄了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

從執行 OpenClaw 的相同主機、容器或服務帳號驗證代理：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公開請求應該成功。loopback 和中繼資料請求應該在代理處失敗。

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

- 代理改善了對處理程序本機 JavaScript HTTP 和 WebSocket 用戶端的覆蓋範圍，但它不是作業系統層級的網路沙箱。
- 原始 `net`、`tls` 和 `http2` socket、原生附加元件，以及子處理程序可能會繞過 Node 層級代理路由，除非它們繼承並遵守代理環境變數。
- 需要時，使用者本機 WebUI 和本機模型伺服器應在操作員代理政策中加入允許清單；OpenClaw 不會為它們公開一般的本機網路繞過。
- Gateway 控制平面代理繞過有意限制於 `localhost` 和字面 loopback IP URL。對本機直接 Gateway 控制平面連線，請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`；其他主機名稱會像一般基於主機名稱的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理政策。
- 將代理政策變更視為安全敏感的營運變更。
