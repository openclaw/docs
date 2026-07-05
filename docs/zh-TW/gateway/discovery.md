---
read_when:
    - 實作或變更 Bonjour 探索/廣告
    - 調整遠端連線模式（直接連線與 SSH）
    - 設計遠端節點的節點探索與配對
summary: 節點探索與傳輸方式（Bonjour、Tailscale、SSH），用於尋找閘道
title: 探索與傳輸方式
x-i18n:
    generated_at: "2026-07-05T11:18:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw 有兩個相關但不同的探索問題：

1. **操作者遠端控制**：macOS 選單列應用程式控制在其他地方執行的閘道。
2. **節點配對**：iOS/Android（以及未來的節點）尋找閘道並安全配對。

所有網路探索/廣播都位於 **節點閘道**
(`openclaw gateway`)；用戶端（mac app、iOS）只作為消費者。

## 術語

- **閘道**：單一長時間執行的程序，擁有狀態（工作階段、
  配對、節點登錄檔）並執行通道。大多數設定每台主機使用一個；
  也可以使用隔離的多閘道設定。
- **閘道 WS（控制平面）**：預設位於 `127.0.0.1:18789` 的 WebSocket 端點；
  透過 `gateway.bind` 將它繫結到 LAN/tailnet。
- **Direct WS 傳輸**：面向 LAN/tailnet 的閘道 WS 端點（無 SSH）。
- **SSH 傳輸（後援）**：透過 SSH 轉發
  `127.0.0.1:18789` 進行遠端控制。
- **舊版 TCP bridge（已移除）**：較舊的節點傳輸（請參閱
  [Bridge protocol](/zh-TW/gateway/bridge-protocol)）；不再為探索而廣播，
  也不再是目前建置的一部分。

協定詳細資訊：[閘道協定](/zh-TW/gateway/protocol)、
[Bridge protocol（舊版）](/zh-TW/gateway/bridge-protocol)。

## 為什麼 direct 和 SSH 兩者都存在

- **Direct WS** 是同一網路和 tailnet 內的最佳使用者體驗：透過 Bonjour 進行 LAN
  自動探索、由閘道擁有的配對權杖和 ACL，而且不需要 shell 存取權。
- **SSH** 是通用後援：只要有 SSH 存取權即可在任何地方運作，即使跨越不相關的網路也可以；
  能避開 multicast/mDNS 問題，而且除了 SSH 之外不需要新的入站連接埠。

## 探索輸入

### 1) Bonjour / DNS-SD

Multicast Bonjour 是盡力而為，且不會跨越網路。OpenClaw 也支援透過設定的 wide-area DNS-SD
網域瀏覽相同的閘道 beacon，因此探索可以同時涵蓋同一 LAN 上的 `local.`，
以及為跨網路探索設定的 unicast DNS-SD 網域。

當內建的 `bonjour` 外掛啟用時，**閘道**會透過 Bonjour 廣播其 WS 端點；
用戶端會瀏覽並顯示「選擇閘道」清單，然後儲存選定的端點。

疑難排解與 beacon 詳細資訊：[Bonjour](/zh-TW/gateway/bonjour)。

#### 服務 beacon 詳細資訊

- 服務類型：`_openclaw-gw._tcp`（閘道傳輸 beacon）。
- TXT key（非機密）：

  | Key                         | 備註                                                                                                                                                            |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 一律存在。                                                                                                                                                  |
  | `transport=gateway`         | 一律存在。                                                                                                                                                  |
  | `displayName=<name>`        | 操作者設定的顯示名稱。                                                                                                                                |
  | `lanHost=<hostname>.local`  | 僅限 LAN mDNS 廣播者；不會由 wide-area DNS-SD 寫入。                                                                                                       |
  | `gatewayPort=18789`         | 閘道 WS + HTTP 連接埠。                                                                                                                                          |
  | `gatewayTls=1`              | 僅在啟用 TLS 時。                                                                                                                                        |
  | `gatewayTlsSha256=<sha256>` | 僅在啟用 TLS 且有可用指紋時。                                                                                                         |
  | `tailnetDns=<magicdns>`     | 選用提示；Tailscale 可用時會自動偵測。                                                                                                        |
  | `sshPort=<port>`            | 僅在 `discovery.mdns.mode="full"` 時存在；預設 `"minimal"` 模式下會省略（SSH 預設為 `22`），LAN 廣播者和 wide-area DNS-SD 皆相同。 |
  | `cliPath=<path>`            | 與 `sshPort` 相同受 `discovery.mdns.mode="full"` 控制；作為命令列介面路徑的遠端安裝提示。                                                                     |

  外掛探索合約中定義了 `canvasPort` TXT key，用於未來的 canvas 主機連接埠，
  但目前沒有任何程式碼路徑設定值，因此現在不會發出。

安全性注意事項：

- Bonjour/mDNS TXT 記錄是**未驗證**的。用戶端必須只把 TXT
  值視為使用者體驗提示。
- 路由（主機/連接埠）應優先使用**解析出的服務端點**
  （SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS pinning 絕不能讓廣播的 `gatewayTlsSha256` 覆寫先前儲存的 pin。
- iOS/Android 節點在儲存首次 pin（頻外驗證）之前，應要求明確的「信任此指紋」
  確認，只要所選路由是安全/TLS 型路由。

啟用、停用與覆寫：

- `openclaw plugins enable bonjour` 啟用 LAN multicast 廣播。
- `openclaw.json` 中的 `discovery.mdns.mode` 控制 mDNS broadcast：
  `"minimal"`（預設）、`"full"`（將 `cliPath`/`sshPort` 加到 LAN
  beacon 和任何 wide-area DNS-SD zone），或 `"off"`（停用 mDNS）。
- `OPENCLAW_DISABLE_BONJOUR=1` 強制停用廣播；`discovery.mdns.mode="off"`
  會獨立停用它。`OPENCLAW_DISABLE_BONJOUR=0` 是明確選擇加入，
  會覆寫外掛在偵測到容器內（Docker、containerd、Kubernetes、LXC）時的自動停用；
  它不會覆寫 `discovery.mdns.mode="off"`。內建的 `bonjour` 外掛會在
  macOS 主機上自動啟動（`enabledByDefaultOnPlatforms: ["darwin"]`），
  並在偵測到容器內時自動停用；Linux、Windows 和其他容器化部署
  需要明確執行 `plugins enable bonjour`。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制閘道繫結模式。
- `OPENCLAW_SSH_PORT` 覆寫廣播的 SSH 連接埠（僅在
  `discovery.mdns.mode="full"` 時生效）。
- `OPENCLAW_TAILNET_DNS` 發布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆寫廣播的命令列介面路徑。

### 2) Tailnet（跨網路）

對於位於不同實體網路的閘道，Bonjour 無法提供幫助。
建議的 direct 目標是 Tailscale MagicDNS 名稱（首選）或
穩定的 tailnet IP。

如果閘道偵測到它在 Tailscale 下執行，會發布
`tailnetDns` 作為用戶端（包括 wide-area beacon）的選用提示。
macOS app 在閘道探索時會優先使用 MagicDNS 名稱，而不是原始 Tailscale IP；
由於 MagicDNS 會自動解析到目前 IP，即使 tailnet IP 變更（節點重新啟動、
CGNAT 重新指派）也能保持可靠。

對於行動節點配對，探索提示永遠不會放寬 tailnet/公用路由上的傳輸安全性：

- iOS/Android 仍需要安全的首次 tailnet/公用連線路徑
  （`wss://` 或 Tailscale Serve/Funnel）。
- 探索到的原始 tailnet IP 是路由提示，不是使用
  plaintext 遠端 `ws://` 的許可。
- 仍支援私有 LAN direct-connect `ws://`。
- 在行動節點上最簡單的 Tailscale 路徑，是使用 Tailscale Serve，
  讓探索和設定都解析到相同的安全 MagicDNS 端點。

### 3) 手動 / SSH 目標

沒有 direct 路由（或 direct 已停用）時，用戶端一律可以
透過 SSH 轉發 loopback 閘道連接埠來連線。請參閱
[遠端存取](/zh-TW/gateway/remote)。

## 傳輸選擇（用戶端政策）

1. 如果已設定且可連線的已配對 direct 端點，請使用它。
2. 否則，如果探索在 `local.` 或設定的 wide-area
   網域找到閘道，提供一鍵「使用此閘道」選擇，並將它儲存為
   direct 端點。
3. 否則，如果設定了 tailnet DNS/IP，請嘗試 direct。對於 tailnet/公用路由上的行動節點，
   direct 表示安全端點，而不是 plaintext
   遠端 `ws://`。
4. 否則，後援到 SSH。

## 配對與驗證（direct 傳輸）

閘道是節點/用戶端准入的真實來源：

- 配對要求會在閘道中建立/核准/拒絕（請參閱
  [閘道配對](/zh-TW/gateway/pairing)）。
- 閘道會強制執行驗證（權杖/金鑰組）、scope/ACL（它不是對每個方法的原始
  proxy），以及速率限制。

## 各元件職責

- **閘道**：廣播探索 beacon、擁有配對決策、託管
  WS 端點。
- **macOS app**：協助你選擇閘道、顯示配對提示，僅將 SSH
  作為後援使用。
- **iOS/Android 節點**：將 Bonjour 瀏覽作為便利功能，連線到
  已配對的閘道 WS。

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)
- [Bonjour 探索](/zh-TW/gateway/bonjour)
