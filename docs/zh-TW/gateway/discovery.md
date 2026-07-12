---
read_when:
    - 實作或變更 Bonjour 探索／廣播功能
    - 調整遠端連線模式（直接連線與 SSH）
    - 設計遠端節點的探索與配對機制
summary: 用於尋找閘道的節點探索與傳輸方式（Bonjour、Tailscale、SSH）
title: 探索與傳輸方式
x-i18n:
    generated_at: "2026-07-11T21:21:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw 有兩個相關但不同的探索問題：

1. **操作人員遠端控制**：macOS 選單列應用程式控制在其他位置執行的閘道。
2. **節點配對**：iOS/Android（以及未來的節點）尋找閘道並進行安全配對。

所有網路探索與廣告功能都位於**節點閘道**
（`openclaw gateway`）中；用戶端（Mac 應用程式、iOS）只負責使用這些功能。

## 術語

- **閘道**：單一長時間執行的程序，負責管理狀態（工作階段、
  配對、節點登錄檔）並執行頻道。大多數設定會在每台主機上使用一個；
  也可以設定彼此隔離的多個閘道。
- **閘道 WS（控制平面）**：預設位於 `127.0.0.1:18789`
  的 WebSocket 端點；可透過 `gateway.bind` 將其繫結至區域網路或 tailnet。
- **直接 WS 傳輸**：面向區域網路或 tailnet 的閘道 WS 端點（不使用 SSH）。
- **SSH 傳輸（備援）**：透過 SSH 轉送
  `127.0.0.1:18789` 來進行遠端控制。
- **舊版 TCP 橋接器（已移除）**：較舊的節點傳輸方式（請參閱
  [橋接器通訊協定](/zh-TW/gateway/bridge-protocol)）；不再為探索功能發布廣告，
  也不再包含於目前的建置版本中。

通訊協定詳細資訊：[閘道通訊協定](/zh-TW/gateway/protocol)、
[橋接器通訊協定（舊版）](/zh-TW/gateway/bridge-protocol)。

## 為何同時存在直接連線與 SSH

- **直接 WS** 在相同網路及 tailnet 內提供最佳使用者體驗：可透過 Bonjour
  在區域網路中自動探索、由閘道管理配對權杖和 ACL，
  且不需要殼層存取權限。
- **SSH** 是通用的備援方式：只要能透過 SSH 存取即可使用，即使位於
  不相關的網路亦可；不受多點傳播或 mDNS 問題影響，除了 SSH 以外
  不需要開放新的連入連接埠。

## 探索輸入來源

### 1) Bonjour / DNS-SD

多點傳播 Bonjour 採盡力而為的運作方式，且無法跨越網路。OpenClaw 也支援
透過已設定的廣域 DNS-SD 網域瀏覽相同的閘道信標，因此探索範圍可以同時涵蓋
相同區域網路上的 `local.`，以及用於跨網路探索的已設定單點傳播 DNS-SD 網域。

啟用內建的 `bonjour` 外掛後，**閘道**會透過 Bonjour 發布其 WS 端點；
用戶端會瀏覽並顯示「選擇閘道」清單，然後儲存所選端點。

疑難排解與信標詳細資訊：[Bonjour](/zh-TW/gateway/bonjour)。

#### 服務信標詳細資訊

- 服務類型：`_openclaw-gw._tcp`（閘道傳輸信標）。
- TXT 鍵（非機密）：

  | 鍵                          | 備註                                                                                                                                                             |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 一律存在。                                                                                                                                                       |
  | `transport=gateway`         | 一律存在。                                                                                                                                                       |
  | `displayName=<name>`        | 由操作人員設定的顯示名稱。                                                                                                                                       |
  | `lanHost=<hostname>.local`  | 僅限區域網路 mDNS 廣告程式；廣域 DNS-SD 不會寫入此值。                                                                                                          |
  | `gatewayPort=18789`         | 閘道 WS 與 HTTP 連接埠。                                                                                                                                         |
  | `gatewayTls=1`              | 僅在啟用 TLS 時存在。                                                                                                                                            |
  | `gatewayTlsSha256=<sha256>` | 僅在啟用 TLS 且有可用指紋時存在。                                                                                                                                |
  | `tailnetDns=<magicdns>`     | 選用提示；可使用 Tailscale 時會自動偵測。                                                                                                                        |
  | `sshPort=<port>`            | 僅在 `discovery.mdns.mode="full"` 時存在；預設的 `"minimal"` 模式會省略此項（SSH 預設為 `22`），區域網路廣告程式與廣域 DNS-SD 皆是如此。 |
  | `cliPath=<path>`            | 與 `sshPort` 相同，受 `discovery.mdns.mode="full"` 限制；這是遠端安裝命令列介面路徑的提示。                                                                      |

  外掛探索合約定義了 `canvasPort` TXT 鍵，供未來的畫布主機連接埠使用，
  但目前沒有任何程式碼路徑設定其值，因此目前絕不會發布此鍵。

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端必須僅將 TXT
  值視為使用者體驗提示。
- 路由（主機／連接埠）應優先採用**解析後的服務端點**
  （SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 憑證固定絕不可讓廣告中發布的 `gatewayTlsSha256` 覆寫
  先前儲存的固定指紋。
- 每當所選路由採用安全或 TLS 連線時，iOS/Android 節點在儲存首次使用的
  固定指紋前，應要求使用者明確確認「信任此指紋」
  （透過頻外方式驗證）。

啟用、停用與覆寫：

- `openclaw plugins enable bonjour` 會啟用區域網路多點傳播廣告。
- `openclaw.json` 中的 `discovery.mdns.mode` 控制 mDNS 廣播：
  `"minimal"`（預設）、`"full"`（將 `cliPath`/`sshPort` 新增至區域網路
  信標及任何廣域 DNS-SD 區域），或 `"off"`（停用 mDNS）。
- `OPENCLAW_DISABLE_BONJOUR=1` 會強制停用廣告；`discovery.mdns.mode="off"`
  則會獨立停用廣告。`OPENCLAW_DISABLE_BONJOUR=0` 是明確的
  選擇啟用設定，可覆寫外掛在偵測到容器
  （Docker、containerd、Kubernetes、LXC）內時的自動停用行為；但不會覆寫
  `discovery.mdns.mode="off"`。內建的 `bonjour` 外掛會在
  macOS 主機上自動啟動（`enabledByDefaultOnPlatforms: ["darwin"]`），並在
  偵測到容器內執行時自動停用；Linux、Windows 及其他容器化
  部署需要明確執行 `plugins enable bonjour`。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制閘道繫結模式。
- `OPENCLAW_SSH_PORT` 會覆寫廣告中發布的 SSH 連接埠（僅在
  `discovery.mdns.mode="full"` 時生效）。
- `OPENCLAW_TAILNET_DNS` 會發布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 會覆寫廣告中發布的命令列介面路徑。

### 2) Tailnet（跨網路）

對於位於不同實體網路上的閘道，Bonjour 無法提供協助。建議的直接連線目標是
Tailscale MagicDNS 名稱（優先）或穩定的 tailnet IP。

如果閘道偵測到自身在 Tailscale 下執行，便會發布
`tailnetDns` 作為用戶端的選用提示（也包含在廣域信標中）。
macOS 應用程式在探索閘道時，會優先使用 MagicDNS 名稱，而不是原始
Tailscale IP；由於 MagicDNS 會自動解析至目前的 IP，因此即使 tailnet IP
發生變更（節點重新啟動、CGNAT 重新指派），仍可維持可靠連線。

對於行動節點配對，探索提示絕不會降低 tailnet 或公開路由上的傳輸安全性：

- iOS/Android 仍要求首次透過 tailnet 或公開網路連線時使用安全路徑
  （`wss://` 或 Tailscale Serve/Funnel）。
- 探索到的原始 tailnet IP 只是路由提示，不代表允許使用
  明文遠端 `ws://`。
- 私有區域網路的 `ws://` 直接連線仍受支援。
- 若要為行動節點使用最簡單的 Tailscale 路徑，請使用 Tailscale Serve，
  讓探索與設定都解析至相同的安全 MagicDNS 端點。

### 3) 手動／SSH 目標

沒有直接路由（或直接連線已停用）時，用戶端隨時可以透過 SSH
轉送 local loopback 閘道連接埠來連線。請參閱
[遠端存取](/zh-TW/gateway/remote)。

## 傳輸方式選擇（用戶端政策）

1. 如果已設定且可連線至已配對的直接端點，則使用該端點。
2. 否則，如果探索功能在 `local.` 或已設定的廣域網域上找到閘道，
   則提供一鍵「使用此閘道」選項，並將其儲存為
   直接端點。
3. 否則，如果已設定 tailnet DNS/IP，則嘗試直接連線。對於透過
   tailnet 或公開路由連線的行動節點，直接連線代表使用安全端點，而不是明文
   遠端 `ws://`。
4. 否則，改用 SSH。

## 配對與驗證（直接傳輸）

閘道是節點與用戶端准入資格的唯一事實來源：

- 配對要求會在閘道中建立、核准或拒絕（請參閱
  [閘道配對](/zh-TW/gateway/pairing)）。
- 閘道會強制執行驗證（權杖／金鑰組）、範圍／ACL
  （它不是可存取所有方法的原始 Proxy），以及速率限制。

## 各元件的責任

- **閘道**：發布探索信標、管理配對決策，以及託管
  WS 端點。
- **macOS 應用程式**：協助選擇閘道、顯示配對提示，並僅將 SSH
  作為備援。
- **iOS/Android 節點**：為方便使用而瀏覽 Bonjour，並連線至
  已配對的閘道 WS。

## 相關內容

- [遠端存取](/zh-TW/gateway/remote)
- [Tailscale](/zh-TW/gateway/tailscale)
- [Bonjour 探索](/zh-TW/gateway/bonjour)
