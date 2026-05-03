---
read_when:
    - 偵錯 macOS/iOS 上的 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索使用者體驗
summary: Bonjour/mDNS 探索與除錯（Gateway 信標、用戶端和常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-05-03T21:31:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS 探索

OpenClaw 可以使用 Bonjour (mDNS / DNS-SD) 來探索作用中的 Gateway (WebSocket 端點)。
多播 `local.` 瀏覽是**僅限 LAN 的便利功能**。內建的 `bonjour`
Plugin 負責 LAN 廣告。它會在 macOS 主機上自動啟動，而在
Linux、Windows 與容器化 Gateway 部署上則需選擇啟用。對於跨網路探索，同一個
信標也可以透過已設定的廣域 DNS-SD 網域發布。探索
仍然是盡力而為，且**不會**取代 SSH 或基於 Tailnet 的連線能力。

## 透過 Tailscale 使用廣域 Bonjour (單播 DNS-SD)

如果節點和 gateway 位於不同網路，多播 mDNS 不會跨越
邊界。你可以改用透過 Tailscale 的**單播 DNS‑SD**
("廣域 Bonjour")，來保留相同的探索 UX。

高階步驟：

1. 在 gateway 主機上執行 DNS 伺服器 (可透過 Tailnet 連線)。
2. 在專用區域下發布 `_openclaw-gw._tcp` 的 DNS‑SD 記錄
   (範例：`openclaw.internal.`)。
3. 設定 Tailscale **split DNS**，讓你選擇的網域透過該
   DNS 伺服器為用戶端 (包含 iOS) 解析。

OpenClaw 支援任何探索網域；`openclaw.internal.` 只是範例。
iOS/Android 節點會同時瀏覽 `local.` 與你設定的廣域網域。

### Gateway 設定 (建議)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### 一次性 DNS 伺服器設定 (gateway 主機)

```bash
openclaw dns setup --apply
```

這會安裝 CoreDNS 並將其設定為：

- 僅在 gateway 的 Tailscale 介面上監聽連接埠 53
- 從 `~/.openclaw/dns/<domain>.db` 提供你選擇的網域 (範例：`openclaw.internal.`)

從已連線至 tailnet 的機器驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理主控台中：

- 新增指向 gateway 的 tailnet IP 的 nameserver (UDP/TCP 53)。
- 新增 split DNS，讓你的探索網域使用該 nameserver。

一旦用戶端接受 tailnet DNS，iOS 節點與 CLI 探索就可以在你的探索網域中瀏覽
`_openclaw-gw._tcp`，不需要多播。

### Gateway 監聽器安全性 (建議)

Gateway WS 連接埠 (預設 `18789`) 預設繫結至 loopback。若要 LAN/tailnet
存取，請明確繫結並保持啟用驗證。

對於僅限 tailnet 的設定：

- 在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`。
- 重新啟動 Gateway (或重新啟動 macOS 選單列 app)。

## 廣告內容

只有 Gateway 會廣告 `_openclaw-gw._tcp`。LAN 多播廣告由已啟用的內建
`bonjour` Plugin 提供；廣域 DNS-SD 發布仍由 Gateway 負責。

## 服務類型

- `_openclaw-gw._tcp` — gateway 傳輸信標 (供 macOS/iOS/Android 節點使用)。

## TXT 鍵 (非秘密提示)

Gateway 會廣告小型非秘密提示，讓 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (僅在啟用 TLS 時)
- `gatewayTlsSha256=<sha256>` (僅在啟用 TLS 且指紋可用時)
- `canvasPort=<port>` (僅在啟用 canvas host 時；目前與 `gatewayPort` 相同)
- `transport=gateway`
- `tailnetDns=<magicdns>` (僅 mDNS full 模式，Tailnet 可用時的選用提示)
- `sshPort=<port>` (僅 mDNS full 模式；廣域 DNS-SD 可能省略)
- `cliPath=<path>` (僅 mDNS full 模式；廣域 DNS-SD 仍會將其寫入作為遠端安裝提示)

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端不得將 TXT 視為權威路由資訊。
- 用戶端應使用已解析的服務端點 (SRV + A/AAAA) 進行路由。僅將 `lanHost`、`tailnetDns`、`gatewayPort` 與 `gatewayTlsSha256` 視為提示。
- SSH 自動目標設定同樣應使用已解析的服務主機，而不是僅依賴 TXT 提示。
- TLS 釘選絕不允許廣告的 `gatewayTlsSha256` 覆寫先前儲存的釘選。
- iOS/Android 節點應將基於探索的直接連線視為**僅限 TLS**，並在信任首次指紋前要求使用者明確確認。

## 在 macOS 上除錯

有用的內建工具：

- 瀏覽執行個體：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析單一執行個體 (取代 `<instance>`)：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果瀏覽可用但解析失敗，通常是遇到 LAN 政策或
mDNS 解析器問題。

## 在 Gateway 日誌中除錯

Gateway 會寫入輪替日誌檔 (啟動時印出為
`gateway log file: ...`)。尋找 `bonjour:` 行，特別是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

當系統主機名稱是有效 DNS 標籤時，Bonjour 會使用該系統主機名稱作為廣告的
`.local` 主機。如果系統主機名稱包含空格、底線或其他
無效 DNS 標籤字元，OpenClaw 會退回使用 `openclaw.local`。當你需要明確的
主機標籤時，請在啟動 Gateway 前設定
`OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 節點上除錯

iOS 節點使用 `NWBrowser` 探索 `_openclaw-gw._tcp`。

擷取日誌：

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 重現 → **Copy**

日誌包含瀏覽器狀態轉換與結果集變更。

## 何時啟用 Bonjour

Bonjour 會在 macOS 主機上的空設定 Gateway 啟動時自動啟動，因為
本機 app 和附近的 iOS/Android 節點通常依賴同 LAN 探索。

當同 LAN 自動探索在 Linux、Windows 或其他非 macOS 主機上有用時，請明確啟用 Bonjour：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 決定要發布多少 TXT 中繼資料。
預設模式是 `minimal`；只有在本機用戶端需要
`cliPath` 或 `sshPort` 提示時才使用 `full`，並使用 `off` 來抑制 LAN 多播且不
變更 Plugin 啟用狀態。

## 何時停用 Bonjour

當 LAN 多播廣告不必要、不可用或有害時，請讓 Bonjour 保持停用。常見情況是非 macOS 伺服器、Docker bridge networking、
WSL，或會丟棄 mDNS 多播的網路政策。在這些環境中，
Gateway 仍可透過其發布的 URL、SSH、Tailnet 或廣域
DNS-SD 連線，但 LAN 自動探索並不可靠。

當問題屬於部署範圍時，優先使用既有環境覆寫：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

這會停用 LAN 多播廣告，而不變更 Plugin 設定。
它適用於 Docker 映像、服務檔、啟動指令稿與一次性
除錯，因為設定會隨環境消失。

當你刻意要為該 OpenClaw 設定關閉內建 LAN 探索
Plugin 時，請使用 Plugin 設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

在偵測到的容器中，若未設定 `OPENCLAW_DISABLE_BONJOUR`，內建 Bonjour Plugin 會自動停用 LAN 多播廣告。Docker bridge networks
通常不會在容器與 LAN 之間轉送 mDNS 多播 (`224.0.0.251:5353`)，
因此從容器廣告很少能讓探索正常運作。

重要注意事項：

- Bonjour 會在 macOS 主機上自動啟動，在其他地方則需選擇啟用。保持
  停用不會停止 Gateway；它只會略過 LAN 多播廣告。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設使用
  `OPENCLAW_GATEWAY_BIND=lan`，讓發布的主機連接埠可運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當 Gateway 與節點不在同一個 LAN 上時，請使用廣域探索
  或 Tailnet。
- 在 Docker 外重複使用相同的 `OPENCLAW_CONFIG_DIR` 不會保留
  容器自動停用政策。
- 只有在 host networking、macvlan 或其他已知可通過
  mDNS 多播的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`；設定為 `1` 則強制停用。

## 疑難排解已停用的 Bonjour

如果 Docker 設定後節點不再自動探索 Gateway：

1. 確認 Gateway 是以自動、強制開啟或強制關閉模式執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認 Gateway 本身可透過發布的連接埠連線：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 當 Bonjour 停用時，使用直接目標：
   - Control UI 或本機工具：`http://127.0.0.1:18789`
   - LAN 用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH tunnel，或
     廣域 DNS-SD

4. 如果你刻意在 Docker 中啟用 Bonjour Plugin，並使用
   `OPENCLAW_DISABLE_BONJOUR=0` 強制廣告，請從主機測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或 Gateway 日誌顯示重複的 ciao watchdog
   取消，請還原 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接或
   Tailnet 路由。

## 常見失敗模式

- **Bonjour 不會跨越網路**：使用 Tailnet 或 SSH。
- **多播被封鎖**：某些 Wi‑Fi 網路會停用 mDNS。
- **廣告程式卡在 probing/announcing**：多播被封鎖的主機、
  容器橋接、WSL 或介面變動，可能會讓 ciao 廣告程式停留在
  non-announced 狀態。OpenClaw 會重試數次，然後為目前的 Gateway 程序停用 Bonjour，
  而不是永遠重新啟動廣告程式。
- **Docker bridge networking**：Bonjour 會在偵測到的容器中自動停用。
  只有在 host、macvlan 或其他具備
  mDNS 能力的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠 / 介面變動**：macOS 可能暫時丟失 mDNS 結果；請重試。
- **瀏覽可用但解析失敗**：保持機器名稱簡單 (避免表情符號或
  標點符號)，然後重新啟動 Gateway。服務執行個體名稱衍生自
  主機名稱，因此過於複雜的名稱可能會混淆某些解析器。

## 跳脫的執行個體名稱 (`\032`)

Bonjour/DNS‑SD 經常將服務執行個體名稱中的位元組跳脫為十進位 `\DDD`
序列 (例如空格會變成 `\032`)。

- 這在協定層級是正常的。
- UI 應解碼以供顯示 (iOS 使用 `BonjourEscapes.decode`)。

## 啟用 / 停用 / 設定

- macOS 主機預設會自動啟動內建 LAN 探索 Plugin。
- `openclaw plugins enable bonjour` 會在預設未啟用的主機上啟用內建 LAN 探索 Plugin。
- `openclaw plugins disable bonjour` 會透過停用內建 Plugin 來停用 LAN 多播廣告。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用 LAN 多播廣告，而不變更 Plugin 設定；接受的 truthy 值為 `1`、`true`、`yes` 與 `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`)。
- `OPENCLAW_DISABLE_BONJOUR=0` 會強制開啟 LAN 多播廣告，包含在偵測到的容器內；接受的 falsy 值為 `0`、`false`、`no` 與 `off`。
- 當 Bonjour Plugin 已啟用且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，Bonjour 會在一般主機上廣告，並在偵測到的容器內自動停用。
- `gateway.bind` in `~/.openclaw/openclaw.json` 控制 Gateway 繫結模式。
- `OPENCLAW_SSH_PORT` 會在廣告 `sshPort` 時覆寫 SSH 連接埠 (legacy: `OPENCLAW_SSH_PORT`)。
- `OPENCLAW_TAILNET_DNS` 會在啟用 mDNS full 模式時於 TXT 中發布 MagicDNS 提示 (legacy: `OPENCLAW_TAILNET_DNS`)。
- `OPENCLAW_CLI_PATH` 會覆寫廣告的 CLI 路徑 (legacy: `OPENCLAW_CLI_PATH`)。

## 相關文件

- 探索政策與傳輸選擇：[Discovery](/zh-TW/gateway/discovery)
- 節點配對 + 核准：[Gateway pairing](/zh-TW/gateway/pairing)
