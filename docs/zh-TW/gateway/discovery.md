---
read_when:
    - 實作或變更 Bonjour 探索/廣播
    - 調整遠端連線模式（直接與 SSH）
    - 設計遠端 Node 的探索與配對
summary: 用於尋找 Gateway 的 Node 探索與傳輸方式（Bonjour、Tailscale、SSH）
title: 探索與傳輸方式
x-i18n:
    generated_at: "2026-05-03T21:33:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# 探索與傳輸

OpenClaw 有兩個表面上相似但本質不同的問題：

1. **操作員遠端控制**：macOS 選單列應用程式控制在其他位置執行的 Gateway。
2. **Node 配對**：iOS/Android（以及未來的 Node）尋找 Gateway 並安全配對。

設計目標是將所有網路探索/廣告保留在 **Node Gateway**（`openclaw gateway`）中，並讓客戶端（Mac 應用程式、iOS）作為消費者。

## 術語

- **Gateway**：單一長時間執行的 Gateway 程序，擁有狀態（工作階段、配對、Node 登錄資料）並執行通道。大多數設定每台主機使用一個；也可以使用隔離的多 Gateway 設定。
- **Gateway WS（控制平面）**：預設位於 `127.0.0.1:18789` 的 WebSocket 端點；可透過 `gateway.bind` 綁定到 LAN/tailnet。
- **直接 WS 傳輸**：面向 LAN/tailnet 的 Gateway WS 端點（不使用 SSH）。
- **SSH 傳輸（備援）**：透過 SSH 轉送 `127.0.0.1:18789` 進行遠端控制。
- **舊版 TCP 橋接（已移除）**：較舊的 Node 傳輸（請參閱
  [橋接通訊協定](/zh-TW/gateway/bridge-protocol)）；不再為探索進行廣告，
  也不再是目前建置的一部分。

通訊協定詳細資訊：

- [Gateway 通訊協定](/zh-TW/gateway/protocol)
- [橋接通訊協定（舊版）](/zh-TW/gateway/bridge-protocol)

## 為什麼我們同時保留「直接」和 SSH

- **直接 WS** 在相同網路和 tailnet 內提供最佳使用者體驗：
  - 透過 Bonjour 在 LAN 上自動探索
  - 由 Gateway 擁有配對權杖 + ACL
  - 不需要 Shell 存取；通訊協定介面可以保持嚴謹且可稽核
- **SSH** 仍然是通用備援：
  - 只要你有 SSH 存取權就能運作（即使跨越不相關的網路）
  - 能避開 multicast/mDNS 問題
  - 除了 SSH 之外不需要新的傳入連接埠

## 探索輸入（客戶端如何得知 Gateway 的位置）

### 1) Bonjour / DNS-SD 探索

Multicast Bonjour 是盡力而為，且不會跨越網路。OpenClaw 也可以透過設定的廣域 DNS-SD 網域瀏覽相同的 Gateway 信標，因此探索可以涵蓋：

- 相同 LAN 上的 `local.`
- 用於跨網路探索的已設定 unicast DNS-SD 網域

目標方向：

- 啟用內建的 `bonjour` Plugin 時，**Gateway** 會透過 Bonjour 廣告其 WS 端點。該 Plugin 會在 macOS 主機上自動啟動，在其他地方則需選擇加入。
- 客戶端瀏覽並顯示「選擇 Gateway」清單，然後儲存所選端點。

疑難排解和信標詳細資訊：[Bonjour](/zh-TW/gateway/bonjour)。

#### 服務信標詳細資訊

- 服務類型：
  - `_openclaw-gw._tcp`（Gateway 傳輸信標）
- TXT 鍵（非機密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（操作員設定的顯示名稱）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（僅在啟用 TLS 時）
  - `gatewayTlsSha256=<sha256>`（僅在啟用 TLS 且指紋可用時）
  - `canvasPort=<port>`（Canvas 主機連接埠；目前在啟用 Canvas 主機時與 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（選用提示；Tailscale 可用時自動偵測）
  - `sshPort=<port>`（僅 mDNS 完整模式；廣域 DNS-SD 可能省略，在此情況下 SSH 預設值仍為 `22`）
  - `cliPath=<path>`（僅 mDNS 完整模式；廣域 DNS-SD 仍會將其寫入作為遠端安裝提示）

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。客戶端必須僅將 TXT 值視為使用者體驗提示。
- 路由（主機/連接埠）應優先使用**已解析的服務端點**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 釘選絕不能允許廣告的 `gatewayTlsSha256` 覆寫先前儲存的釘選。
- 每當選擇的路由是安全/TLS 型路由時，iOS/Android Node 在儲存首次釘選前應要求明確的「信任此指紋」確認（頻外驗證）。

啟用/停用/覆寫：

- `openclaw plugins enable bonjour` 會啟用 LAN multicast 廣告。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用廣告。
- 啟用 Bonjour Plugin 且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，
  Bonjour 會在一般主機上廣告，並在偵測到容器內部時自動停用。
  空設定的 macOS Gateway 啟動會自動啟用該 Plugin；Linux、
  Windows 和容器化部署需要明確啟用。
  僅在主機、macvlan 或其他具備 mDNS 能力的網路上使用 `0`；使用 `1`
  強制停用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 綁定模式。
- 發出 `sshPort` 時，`OPENCLAW_SSH_PORT` 會覆寫廣告的 SSH 連接埠。
- `OPENCLAW_TAILNET_DNS` 會發布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 會覆寫廣告的 CLI 路徑。

### 2) Tailnet（跨網路）

對於 London/Vienna 類型的設定，Bonjour 幫不上忙。建議的「直接」目標是：

- Tailscale MagicDNS 名稱（偏好）或穩定的 tailnet IP。

如果 Gateway 能偵測到它在 Tailscale 下執行，它會發布 `tailnetDns` 作為客戶端的選用提示（包含廣域信標）。

macOS 應用程式現在會在 Gateway 探索時偏好 MagicDNS 名稱，而不是原始 Tailscale IP。這會在 tailnet IP 變更時（例如 Node 重新啟動或 CGNAT 重新指派後）提升可靠性，因為 MagicDNS 名稱會自動解析到目前的 IP。

對於行動 Node 配對，探索提示不會放寬 tailnet/公用路由上的傳輸安全性：

- iOS/Android 仍需要安全的首次 tailnet/公用連線路徑（`wss://` 或 Tailscale Serve/Funnel）。
- 探索到的原始 tailnet IP 是路由提示，不是使用明文遠端 `ws://` 的許可。
- 仍支援私有 LAN 直接連線 `ws://`。
- 如果你想要最簡單的 Tailscale 行動 Node 路徑，請使用 Tailscale Serve，讓探索和設定碼都解析到相同的安全 MagicDNS 端點。

### 3) 手動 / SSH 目標

當沒有直接路由（或直接路由已停用）時，客戶端一律可以透過 SSH 轉送迴路 Gateway 連接埠來連線。

請參閱[遠端存取](/zh-TW/gateway/remote)。

## 傳輸選擇（客戶端政策）

建議的客戶端行為：

1. 如果已設定配對的直接端點且可連線，請使用它。
2. 否則，如果探索在 `local.` 或已設定的廣域網域上找到 Gateway，提供一鍵「使用此 Gateway」選項，並將其儲存為直接端點。
3. 否則，如果已設定 tailnet DNS/IP，請嘗試直接連線。
   對於 tailnet/公用路由上的行動 Node，直接表示安全端點，而不是明文遠端 `ws://`。
4. 否則，退回使用 SSH。

## 配對 + 驗證（直接傳輸）

Gateway 是 Node/客戶端准入的真實來源。

- 配對要求會在 Gateway 中建立/核准/拒絕（請參閱 [Gateway 配對](/zh-TW/gateway/pairing)）。
- Gateway 會強制執行：
  - 驗證（權杖 / 金鑰組）
  - 範圍/ACL（Gateway 不是所有方法的原始代理）
  - 速率限制

## 各元件職責

- **Gateway**：廣告探索信標、擁有配對決策，並託管 WS 端點。
- **macOS 應用程式**：協助你選擇 Gateway、顯示配對提示，並且僅將 SSH 作為備援。
- **iOS/Android Node**：瀏覽 Bonjour 作為便利功能，並連線到已配對的 Gateway WS。

## 相關

- [遠端存取](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)
- [Bonjour 探索](/zh-TW/gateway/bonjour)
