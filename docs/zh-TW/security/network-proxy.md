---
read_when:
    - 你想要針對 SSRF 與 DNS 重新綁定攻擊採取縱深防禦
    - 設定 OpenClaw 執行階段流量的外部正向代理
summary: 如何透過操作員管理的篩選代理路由 OpenClaw 執行階段 HTTP 與 WebSocket 流量
title: 網路代理
x-i18n:
    generated_at: "2026-05-04T02:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd5594324e8c6b7da51d903e98fda0feacb8970e0b15d980f7a249d6641461c9
    source_path: security/network-proxy.md
    workflow: 16
---

# 網路代理

OpenClaw 可以透過操作員管理的正向代理，路由執行階段的 HTTP 和 WebSocket 流量。這是選用的縱深防禦措施，適用於需要集中輸出控制、更強 SSRF 防護，以及更好網路可稽核性的部署。

OpenClaw 不會隨附、下載、啟動、設定或認證代理。你可以執行符合環境需求的代理技術，而 OpenClaw 會透過它路由一般程序本機的 HTTP 和 WebSocket 用戶端。

## 為什麼要使用代理？

代理可讓操作員以單一網路控制點管理輸出的 HTTP 和 WebSocket 流量。即使不是為了強化 SSRF，這也很有用：

- 集中政策：維護單一輸出政策，而不是仰賴每個應用程式 HTTP 呼叫點都正確套用網路規則。
- 連線時檢查：在 DNS 解析後、代理開啟上游連線前立即評估目的地。
- DNS 重綁防禦：縮小應用程式層級 DNS 檢查與實際輸出連線之間的落差。
- 更廣泛的 JavaScript 覆蓋範圍：透過同一路徑路由一般 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch，以及類似用戶端。
- 可稽核性：在輸出邊界記錄允許和拒絕的目的地。
- 營運控制：不需重建 OpenClaw，就能強制執行目的地規則、網路分段、速率限制或輸出允許清單。

代理路由是一般 HTTP 和 WebSocket 輸出的程序層級護欄。它可讓操作員透過自己的過濾代理，為受支援的 JavaScript HTTP 用戶端提供失敗即封閉的路由路徑，但它不是作業系統層級的網路沙箱，也不表示 OpenClaw 會認證代理的目的地政策。

## OpenClaw 如何路由流量

當 `proxy.enabled=true` 且已設定代理 URL 時，受保護的執行階段程序，例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`，會透過設定的代理路由一般 HTTP 和 WebSocket 輸出：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公開合約是路由行為，而不是用來實作它的內部 Node 掛鉤。當 Gateway URL 使用 `localhost`，或使用像 `127.0.0.1` 或 `[::1]` 這類明確 loopback IP 時，OpenClaw Gateway 控制平面 WebSocket 用戶端會針對 local loopback Gateway RPC 流量使用狹窄的直接路徑。即使操作員代理阻擋 loopback 目的地，該控制平面路徑也必須能連到 loopback Gateway。一般執行階段 HTTP 和 WebSocket 請求仍會使用設定的代理。

在內部，OpenClaw 針對此功能使用兩個程序層級的路由掛鉤：

- Undici dispatcher 路由涵蓋 `fetch`、以 undici 為基礎的用戶端，以及提供自身 undici dispatcher 的傳輸。
- `global-agent` 路由涵蓋 Node 核心 `node:http` 和 `node:https` 呼叫者，包括許多建立在 `http.request`、`https.request`、`http.get` 和 `https.get` 之上的函式庫。受管理代理模式會強制使用該全域代理，避免明確的 Node HTTP agent 意外繞過操作員代理。

有些 Plugin 擁有自訂傳輸，即使已有程序層級路由，也需要明確的代理接線。例如，Telegram 的 Bot API 傳輸使用自己的 HTTP/1 undici dispatcher，因此會在該擁有者專屬的傳輸路徑中遵循程序代理環境，以及受管理的 `OPENCLAW_PROXY_URL` 備援。

代理 URL 本身必須使用 `http://`。透過代理使用 HTTP `CONNECT` 時，仍支援 HTTPS 目的地；這只表示 OpenClaw 預期的是純 HTTP 正向代理監聽器，例如 `http://127.0.0.1:3128`。

代理啟用時，OpenClaw 會清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。這些繞過清單是以目的地為基礎，因此若保留 `localhost` 或 `127.0.0.1`，高風險 SSRF 目標就能跳過過濾代理。

關閉時，OpenClaw 會還原先前的代理環境，並重設快取的程序路由狀態。

## 相關代理術語

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 執行階段輸出的輸出正向代理路由。本頁說明此功能。
- `gateway.auth.mode: "trusted-proxy"`：用於 Gateway 存取的輸入身分識別感知反向代理驗證。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用於開發和支援的本機除錯代理與擷取檢查器。請參閱 [openclaw proxy](/zh-TW/cli/proxy)。
- 通道或供應商專屬代理設定：特定傳輸的擁有者專屬覆寫。若目標是在整個執行階段集中控制輸出，請優先使用受管理的網路代理。

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

如果 `enabled=true` 但未設定有效的代理 URL，受保護的命令會在啟動時失敗，而不是退回直接網路存取。

對於使用 `openclaw gateway start` 啟動的受管理 Gateway 服務，建議將 URL 儲存在設定中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

環境備援最適合前景執行。如果你將它用於已安裝的服務，請將 `OPENCLAW_PROXY_URL` 放入服務的持久環境，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然後重新安裝服務，讓 launchd、systemd 或排程工作以該值啟動 Gateway。

對於 `openclaw --container ...` 命令，若已設定 `OPENCLAW_PROXY_URL`，OpenClaw 會將其轉發到以容器為目標的子 CLI。URL 必須能從容器內部連線；`127.0.0.1` 指的是容器本身，而不是主機。OpenClaw 會拒絕以容器為目標命令中的 loopback 代理 URL，除非你明確覆寫該安全檢查。

## 代理需求

代理政策是安全邊界。OpenClaw 無法驗證代理是否阻擋正確的目標。

請將代理設定為：

- 僅繫結至 loopback 或私有受信任介面。
- 限制存取權，讓只有 OpenClaw 程序、主機、容器或服務帳戶可以使用它。
- 自行解析目的地，並在 DNS 解析後阻擋目的地 IP。
- 對純 HTTP 請求與 HTTPS `CONNECT` 通道，在連線時套用政策。
- 拒絕對 loopback、私有、link-local、中繼資料、多播、保留或文件範圍的目的地型繞過。
- 除非你完全信任 DNS 解析路徑，否則避免使用主機名稱允許清單。
- 記錄目的地、決策、狀態和原因，但不要記錄請求本文、授權標頭、Cookie 或其他秘密。
- 將代理政策納入版本控制，並像審查安全敏感設定一樣審查變更。

## 建議阻擋的目的地

將此拒絕清單作為任何正向代理、防火牆或輸出政策的起點。

OpenClaw 應用程式層級分類器邏輯位於 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相關的對等掛鉤是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及 NAT64、6to4、Teredo、ISATAP 和 IPv4-mapped 形式的內嵌 IPv4 哨兵處理。維護外部代理政策時，這些檔案是實用參考，但 OpenClaw 不會自動匯出或在你的代理中強制執行這些規則。

| 範圍或主機                                                                         | 阻擋原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | 未指定與此網路位址                                  |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私有網路                                    |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local 位址與常見雲端中繼資料路徑              |
| `169.254.169.254`, `metadata.google.internal`                                        | 雲端中繼資料服務                                    |
| `100.64.0.0/10`                                                                      | 電信級 NAT 共享位址空間                             |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基準測試範圍                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途與文件範圍                                  |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                                 |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                           |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本機/私有範圍                                  |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard 與 ORCHIDv2 範圍                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 含內嵌 IPv4 的 NAT64 前綴                           |
| `2002::/16`, `2001::/32`                                                             | 含內嵌 IPv4 的 6to4 與 Teredo                       |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible 與 IPv4-mapped IPv6                 |

如果你的雲端供應商或網路平台記載了其他中繼資料主機或保留範圍，也請一併加入。

## 驗證

從執行 OpenClaw 的同一主機、容器或服務帳戶驗證代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

預設情況下，若未提供自訂目的地，命令會檢查 `https://example.com/` 是否成功，並啟動一個代理不得連到的暫時 loopback canary。預設拒絕檢查會在代理傳回非 2xx 拒絕回應，或以傳輸失敗阻擋 canary 時通過；若成功回應抵達 canary，則會失敗。如果未啟用並設定代理，驗證會回報設定問題；在變更設定前，可使用 `--proxy-url` 進行一次性預檢。使用 `--allowed-url` 和 `--denied-url` 測試部署專屬預期。自訂拒絕目的地採用失敗即封閉：任何 HTTP 回應都表示可透過代理連到該目的地，而任何傳輸錯誤都會回報為無法判定，因為 OpenClaw 無法證明代理阻擋了可連線的來源。驗證失敗時，命令會以代碼 1 結束。

使用 `--json` 進行自動化。JSON 輸出包含整體結果、有效代理設定來源、任何設定錯誤，以及各目的地檢查。代理 URL 認證會在文字與 JSON 輸出中遮蔽：

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

對公網的請求應該成功。回環與中繼資料請求應該會被代理伺服器封鎖。對於 `openclaw proxy validate`，內建的回環金絲雀可以區分代理伺服器拒絕與可連線的來源。自訂 `--denied-url` 檢查沒有該金絲雀，因此除非你的代理伺服器公開了可另行驗證的部署專屬拒絕訊號，否則請將 HTTP 回應與含糊的傳輸失敗都視為驗證失敗。

然後啟用 OpenClaw 代理伺服器路由：

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

- 代理伺服器可提升對程序本機 JavaScript HTTP 與 WebSocket 用戶端的涵蓋範圍，但它不是作業系統層級的網路沙箱。
- 原始 `net`、`tls` 和 `http2` 通訊端、原生附加元件與子程序，除非繼承並遵守代理伺服器環境變數，否則可能會繞過 Node 層級的代理伺服器路由。
- IRC 是位於操作員管理的正向代理伺服器路由之外的原始 TCP/TLS 通道。在要求所有輸出流量都必須經過該正向代理伺服器的部署中，除非已明確核准直接 IRC 輸出流量，否則請設定 `channels.irc.enabled=false`。
- 需要時，使用者本機 WebUI 與本機模型伺服器應在操作員代理伺服器政策中列入允許清單；OpenClaw 不會為它們公開一般性的本機網路繞過機制。
- Gateway 控制平面代理伺服器繞過刻意限制於 `localhost` 與字面回環 IP URL。針對本機直接 Gateway 控制平面連線，請使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`；其他主機名稱會像一般以主機名稱為基礎的流量一樣路由。
- OpenClaw 不會檢查、測試或認證你的代理伺服器政策。
- 請將代理伺服器政策變更視為安全性敏感的營運變更。
