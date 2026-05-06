---
read_when:
    - 實作或變更 Bonjour 探索/宣告
    - 調整遠端連線模式（直接連線與 SSH）
    - 設計遠端 Node 的探索 + 配對
summary: 用於尋找 Gateway 的 Node 探索與傳輸（Bonjour、Tailscale、SSH）
title: 探索與傳輸方式
x-i18n:
    generated_at: "2026-05-06T09:09:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw 有兩個表面上看起來相似、但實際上不同的問題：

1. **操作員遠端控制**：由 macOS 選單列應用程式控制執行在其他地方的 Gateway。
2. **Node 配對**：iOS/Android（以及未來的 nodes）尋找 Gateway 並安全配對。

設計目標是將所有網路探索/廣播保留在 **Node Gateway**（`openclaw gateway`）中，並讓用戶端（Mac 應用程式、iOS）作為消費者。

## 術語

- **Gateway**：單一長時間執行的 Gateway 程序，擁有狀態（工作階段、配對、node 登錄）並執行通道。多數設定每台主機使用一個；也可以採用隔離的多 Gateway 設定。
- **Gateway WS（控制平面）**：預設位於 `127.0.0.1:18789` 的 WebSocket 端點；可透過 `gateway.bind` 綁定到 LAN/tailnet。
- **Direct WS 傳輸**：面向 LAN/tailnet 的 Gateway WS 端點（沒有 SSH）。
- **SSH 傳輸（備援）**：透過 SSH 轉送 `127.0.0.1:18789` 來進行遠端控制。
- **舊版 TCP bridge（已移除）**：較舊的 node 傳輸（請參閱
  [Bridge 協定](/zh-TW/gateway/bridge-protocol)）；不再為了
  探索而廣播，也不再是目前建置的一部分。

協定詳細資訊：

- [Gateway 協定](/zh-TW/gateway/protocol)
- [Bridge 協定（舊版）](/zh-TW/gateway/bridge-protocol)

## 為什麼我們同時保留 direct 和 SSH

- **Direct WS** 在同一個網路與 tailnet 內提供最佳使用者體驗：
  - 透過 Bonjour 在 LAN 上自動探索
  - 配對 token + ACL 由 Gateway 擁有
  - 不需要 shell 存取權；協定表面可以維持緊湊且可稽核
- **SSH** 仍然是通用備援：
  - 只要有 SSH 存取權，任何地方都可運作（即使跨越不相關的網路）
  - 能承受 multicast/mDNS 問題
  - 除了 SSH 之外不需要新的入站連接埠

## 探索輸入（用戶端如何得知 Gateway 位置）

### 1) Bonjour / DNS-SD 探索

Multicast Bonjour 是盡力而為，且不會跨越網路。OpenClaw 也可以透過已設定的廣域 DNS-SD 網域瀏覽同一個 Gateway beacon，因此探索可以涵蓋：

- 同一個 LAN 上的 `local.`
- 用於跨網路探索的已設定 unicast DNS-SD 網域

目標方向：

- 啟用隨附的
  `bonjour` Plugin 時，**Gateway** 會透過 Bonjour 廣播其 WS 端點。該 Plugin 會在 macOS 主機上自動啟動，在其他地方則為選擇性啟用。
- 用戶端會瀏覽並顯示「選擇 Gateway」清單，然後儲存所選端點。

疑難排解與 beacon 詳細資訊：[Bonjour](/zh-TW/gateway/bonjour)。

#### 服務 beacon 詳細資訊

- 服務類型：
  - `_openclaw-gw._tcp`（Gateway 傳輸 beacon）
- TXT keys（非機密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（由操作員設定的顯示名稱）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（僅在啟用 TLS 時）
  - `gatewayTlsSha256=<sha256>`（僅在啟用 TLS 且 fingerprint 可用時）
  - `canvasPort=<port>`（canvas 主機連接埠；目前在啟用 canvas 主機時與 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（選用提示；Tailscale 可用時自動偵測）
  - `sshPort=<port>`（僅限 mDNS full mode；廣域 DNS-SD 可能會省略它，此時 SSH 預設值維持在 `22`）
  - `cliPath=<path>`（僅限 mDNS full mode；廣域 DNS-SD 仍會將其寫入為遠端安裝提示）

安全性注意事項：

- Bonjour/mDNS TXT records **未經驗證**。用戶端必須只將 TXT 值視為使用者體驗提示。
- 路由（host/port）應優先使用**解析後的服務端點**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS pinning 絕不能允許廣播的 `gatewayTlsSha256` 覆寫先前儲存的 pin。
- 每當所選路由是安全/TLS-based 時，iOS/Android nodes 應要求明確「信任此 fingerprint」確認後，才儲存首次 pin（頻外驗證）。

啟用/停用/覆寫：

- `openclaw plugins enable bonjour` 會啟用 LAN multicast 廣播。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用廣播。
- 啟用 Bonjour Plugin 且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，
  Bonjour 會在一般主機上廣播，並在偵測到容器內部時自動停用。
  空設定的 macOS Gateway 啟動會自動啟用該 Plugin；Linux、
  Windows 與容器化部署需要明確啟用。
  只有在主機、macvlan 或其他支援 mDNS 的網路上使用 `0`；使用 `1`
  強制停用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 綁定模式。
- 發出 `sshPort` 時，`OPENCLAW_SSH_PORT` 會覆寫廣播的 SSH 連接埠。
- `OPENCLAW_TAILNET_DNS` 會發布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 會覆寫廣播的 CLI 路徑。

### 2) Tailnet（跨網路）

對於 London/Vienna 類型的設定，Bonjour 幫不上忙。建議的「direct」目標是：

- Tailscale MagicDNS 名稱（偏好）或穩定的 tailnet IP。

如果 Gateway 可以偵測到自己正在 Tailscale 下執行，它會將 `tailnetDns` 發布為用戶端的選用提示（包括廣域 beacon）。

macOS 應用程式現在會在 Gateway 探索時優先使用 MagicDNS 名稱，而不是原始 Tailscale IP。這能提升 tailnet IP 變更時的可靠性（例如 node 重新啟動或 CGNAT 重新指派之後），因為 MagicDNS 名稱會自動解析到目前的 IP。

對於 mobile node 配對，探索提示不會放寬 tailnet/public 路由上的傳輸安全性：

- iOS/Android 仍然需要安全的首次 tailnet/public 連線路徑（`wss://` 或 Tailscale Serve/Funnel）。
- 探索到的原始 tailnet IP 是路由提示，不是允許使用 plaintext remote `ws://` 的權限。
- 仍支援私有 LAN direct-connect `ws://`。
- 如果你想要最簡單的 Tailscale mobile nodes 路徑，請使用 Tailscale Serve，讓探索與設定碼都解析到相同的安全 MagicDNS 端點。

### 3) 手動 / SSH 目標

沒有 direct route（或 direct 已停用）時，用戶端永遠可以透過 SSH 轉送 loopback Gateway 連接埠來連線。

請參閱[遠端存取](/zh-TW/gateway/remote)。

## 傳輸選擇（用戶端原則）

建議的用戶端行為：

1. 如果已設定且可連線至已配對的 direct 端點，請使用它。
2. 否則，如果探索在 `local.` 或已設定的廣域網域上找到 Gateway，提供一鍵式「使用此 Gateway」選擇，並將其儲存為 direct 端點。
3. 否則，如果已設定 tailnet DNS/IP，請嘗試 direct。
   對於 tailnet/public 路由上的 mobile nodes，direct 表示安全端點，而不是 plaintext remote `ws://`。
4. 否則，回退到 SSH。

## 配對 + auth（direct 傳輸）

Gateway 是 node/用戶端准入的事實來源。

- 配對請求會在 Gateway 中建立/核准/拒絕（請參閱 [Gateway 配對](/zh-TW/gateway/pairing)）。
- Gateway 會強制執行：
  - auth（token / keypair）
  - scopes/ACLs（Gateway 不是每個方法的 raw proxy）
  - rate limits

## 各元件職責

- **Gateway**：廣播探索 beacon、擁有配對決策，並託管 WS 端點。
- **macOS 應用程式**：協助你選擇 Gateway、顯示配對提示，並只將 SSH 作為備援。
- **iOS/Android nodes**：為方便起見瀏覽 Bonjour，並連線到已配對的 Gateway WS。

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)
- [Bonjour 探索](/zh-TW/gateway/bonjour)
