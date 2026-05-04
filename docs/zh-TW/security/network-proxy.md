---
read_when:
    - 你希望針對 SSRF 與 DNS 重綁定攻擊採取縱深防禦
    - 為 OpenClaw 執行階段流量設定外部正向代理
summary: 如何透過由操作人員管理的篩選代理伺服器路由 OpenClaw 執行階段的 HTTP 與 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-05-04T18:24:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedbf3bac14800c34c7ca2e3b6879dac360a88d51b5b7449ddf41a4dd471648b
    source_path: security/network-proxy.md
    workflow: 16
---

# 網路代理

OpenClaw 可以透過操作者管理的正向代理，路由執行階段的 HTTP 與 WebSocket 流量。對於想要集中出口控制、更強 SSRF 防護，以及更佳網路可稽核性的部署，這是選用的縱深防禦措施。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。你可以執行適合自己環境的代理技術，而 OpenClaw 會透過它路由一般的程序本機 HTTP 與 WebSocket 用戶端。

## 為什麼使用代理？

代理讓操作者能有一個針對輸出 HTTP 與 WebSocket 流量的網路控制點。即使不是為了強化 SSRF，這也可能很有用：

- 集中政策：維護單一出口政策，而不是仰賴每個應用程式 HTTP 呼叫位置都正確套用網路規則。
- 連線時檢查：在 DNS 解析後、代理即將開啟上游連線前，評估目的地。
- DNS 重新綁定防禦：縮小應用程式層級 DNS 檢查與實際輸出連線之間的落差。
- 更廣泛的 JavaScript 覆蓋：將一般的 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端路由到同一路徑。
- 可稽核性：在出口邊界記錄允許與拒絕的目的地。
- 營運控制：不必重建 OpenClaw，即可強制套用目的地規則、網路分段、速率限制或輸出允許清單。

代理路由是一般 HTTP 與 WebSocket 輸出的程序層級防護欄。它讓操作者能以失敗即關閉的路徑，將受支援的 JavaScript HTTP 用戶端透過自己的過濾代理路由，但它不是作業系統層級的網路沙盒，也不代表 OpenClaw 會認證代理的目的地政策。

## OpenClaw 如何路由流量

當 `proxy.enabled=true` 且已設定代理 URL 時，受保護的執行階段程序，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過已設定的代理路由一般 HTTP 與 WebSocket 輸出：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開契約是路由行為，而不是用來實作它的內部 Node hook。OpenClaw Gateway 控制平面 WebSocket 用戶端在 Gateway URL 使用 `localhost`，或使用像 `127.0.0.1` 或 `[::1]` 這類字面 loopback IP 時，會為 local loopback Gateway RPC 流量使用狹窄的直接路徑。即使操作者代理封鎖 loopback 目的地，該控制平面路徑也必須能連到 loopback Gateway。一般執行階段 HTTP 與 WebSocket 請求仍會使用已設定的代理。

在內部，OpenClaw 會針對此功能使用兩個程序層級的路由 hook：

- Undici dispatcher 路由涵蓋 `fetch`、undici 後援的用戶端，以及提供自身 undici dispatcher 的傳輸。
- `global-agent` 路由涵蓋 Node 核心 `node:http` 與 `node:https` 呼叫端，包括許多建構在 `http.request`、`https.request`、`http.get` 與 `https.get` 之上的函式庫。受管理代理模式會強制使用該全域代理，避免明確的 Node HTTP agent 意外繞過操作者代理。

部分 Plugin 擁有自訂傳輸，即使已有程序層級路由，也需要明確接上代理。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會在該擁有者專屬傳輸路徑中遵循程序代理環境，以及受管理的 `OPENCLAW_PROXY_URL` 備援。

代理 URL 本身必須使用 `http://`。HTTPS 目的地仍可透過具備 HTTP `CONNECT` 的代理受到支援；這只表示 OpenClaw 預期的是純 HTTP 正向代理監聽器，例如 `http://127.0.0.1:3128`。

代理啟用時，OpenClaw 會清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。這些繞過清單是以目的地為基礎，因此若將 `localhost` 或 `127.0.0.1` 留在其中，會讓高風險 SSRF 目標略過過濾代理。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的程序路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段輸出的輸出正向代理路由。本頁記錄此功能。
- `gateway.auth.mode: "trusted-proxy"`：用於 Gateway 存取的輸入身分感知反向代理驗證。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發與支援的本機除錯代理與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- 頻道或供應商專屬代理設定：特定傳輸的擁有者專屬覆寫。若目標是在整個執行階段集中出口控制，請優先使用受管理的網路代理。

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

如果 `enabled=true` 但未設定有效的代理 URL，受保護的命令會在啟動時失敗，而不是退回到直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理 Gateway 服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境備援最適合前景執行。如果你將它用於已安裝的服務，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或 Scheduled Tasks 以該值啟動 gateway。

對於 `openclaw --container ...` 命令，當 `OPENCLAW_PROXY_URL` 已設定時，OpenClaw 會將它轉送到以容器為目標的子 CLI。該 URL 必須能從容器內部連線；`127.0.0.1` 指的是容器本身，而不是主機。除非你明確覆寫該安全檢查，否則 OpenClaw 會拒絕容器目標命令使用 loopback 代理 URL。

## 代理需求

代理政策是安全邊界。OpenClaw 無法驗證代理是否封鎖了正確目標。

請將代理設定為：

- 僅繫結到 loopback 或私有受信任介面。
- 限制存取，讓只有 OpenClaw 程序、主機、容器或服務帳號可以使用。
- 自行解析目的地，並在 DNS 解析後封鎖目的地 IP。
- 對純 HTTP 請求與 HTTPS `CONNECT` 通道，都在連線時套用政策。
- 拒絕針對 loopback、私人、鏈路本機、中繼資料、多點傳送、保留或文件範圍的目的地式繞過。
- 除非你完全信任 DNS 解析路徑，否則請避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態與原因，但不要記錄請求本文、授權標頭、Cookie 或其他秘密。
- 將代理政策置於版本控制下，並像安全敏感設定一樣審查變更。

## 建議封鎖目的地

請將此拒絕清單作為任何正向代理、防火牆或出口政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相關的對等 hook 是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及針對 NAT64、6to4、Teredo、ISATAP 和 IPv4 對應形式的嵌入式 IPv4 sentinel 處理。維護外部代理政策時，這些檔案是有用的參考，但 OpenClaw 不會自動匯出或在你的代理中強制套用這些規則。

| 範圍或主機                                                                         | 封鎖原因                                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                | IPv4 loopback                                        |
| `::1/128`                                                                          | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                              | 未指定與本網路位址                                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                    | RFC1918 私有網路                                     |
| `169.254.0.0/16`, `fe80::/10`                                                      | 鏈路本機位址與常見雲端中繼資料路徑                 |
| `169.254.169.254`, `metadata.google.internal`                                      | 雲端中繼資料服務                                     |
| `100.64.0.0/10`                                                                    | 電信級 NAT 共用位址空間                              |
| `198.18.0.0/15`, `2001:2::/48`                                                     | 基準測試範圍                                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                                   |
| `224.0.0.0/4`, `ff00::/8`                                                          | 多點傳送                                             |
| `240.0.0.0/4`                                                                      | 保留 IPv4                                            |
| `fc00::/7`, `fec0::/10`                                                            | IPv6 本機／私有範圍                                  |
| `100::/64`, `2001:20::/28`                                                         | IPv6 discard 與 ORCHIDv2 範圍                        |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                   | 含嵌入式 IPv4 的 NAT64 前綴                          |
| `2002::/16`, `2001::/32`                                                           | 含嵌入式 IPv4 的 6to4 與 Teredo                      |
| `::/96`, `::ffff:0:0/96`                                                           | IPv4 相容與 IPv4 對應的 IPv6                         |

如果你的雲端供應商或網路平台記錄了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

請從執行 OpenClaw 的同一個主機、容器或服務帳號驗證代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

預設情況下，若未提供自訂目的地，該命令會檢查 `https://example.com/` 是否成功，並啟動一個代理不得連到的暫時 loopback canary。當代理回傳非 2xx 拒絕回應，或以傳輸失敗封鎖 canary 時，預設拒絕檢查會通過；如果成功回應抵達 canary，則會失敗。如果未啟用並設定代理，驗證會回報設定問題；在變更設定前的一次性預檢，請使用 `--proxy-url`。使用 `--allowed-url` 與 `--denied-url` 測試部署專屬預期。加入 `--apns-reachable` 也會驗證直接 APNs HTTP/2 傳遞能透過代理開啟 CONNECT 通道，並收到沙盒 APNs 回應；該探測會使用刻意無效的供應商權杖，因此預期會得到 `403 InvalidProviderToken`，且會計為可連線。自訂拒絕目的地是失敗即關閉：任何 HTTP 回應都表示目的地可透過代理連到，而任何傳輸錯誤都會回報為無法判定，因為 OpenClaw 無法證明代理封鎖了一個可連線來源。驗證失敗時，命令會以代碼 1 結束。

使用 `--json` 進行自動化。JSON 輸出包含整體結果、有效代理設定來源、任何設定錯誤，以及各目的地檢查。代理 URL 認證資訊會在文字與 JSON 輸出中被遮蔽：

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

公開請求應該會成功。回送與中繼資料請求應該會被代理伺服器封鎖。對於 `openclaw proxy validate`，內建的回送金絲雀檢查可以區分代理伺服器拒絕與可連線的來源。自訂 `--denied-url` 檢查沒有該金絲雀檢查，因此除非你的代理伺服器公開了可另行驗證的部署特定拒絕訊號，否則請將 HTTP 回應與模稜兩可的傳輸失敗都視為驗證失敗。

接著啟用 OpenClaw 代理路由：

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

- 代理伺服器可改善行程本機 JavaScript HTTP 與 WebSocket 用戶端的涵蓋範圍，但它不是作業系統層級的網路沙箱。
- 原始 `net`、`tls` 與 `http2` 通訊端、原生附加元件和子行程，除非繼承並遵守代理伺服器環境變數，否則可能會略過 Node 層級的代理路由。
- IRC 是運算子管理正向代理路由之外的原始 TCP/TLS 通道。在要求所有輸出流量都通過該正向代理伺服器的部署中，除非直接 IRC 輸出流量已明確核准，否則請設定 `channels.irc.enabled=false`。
- 本機偵錯代理伺服器是診斷工具，且其對代理請求與 CONNECT 通道的直接上游轉送，在受管理代理模式啟用時預設為停用；只有針對已核准的本機診斷才啟用直接轉送。
- 需要時，使用者本機 WebUI 與本機模型伺服器應加入運算子代理政策的允許清單；OpenClaw 不會為它們公開一般性的本機網路繞過機制。
- Gateway 控制平面代理繞過刻意限制為 `localhost` 與字面回送 IP URL。請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789` 進行本機直接 Gateway 控制平面連線；其他主機名稱會像一般以主機名稱為基礎的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理政策。
- 請將代理政策變更視為安全性敏感的營運變更。
