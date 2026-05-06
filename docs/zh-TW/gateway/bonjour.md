---
read_when:
    - 偵錯 macOS/iOS 上的 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索體驗
summary: Bonjour/mDNS 探索 + 除錯（Gateway 信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-05-06T09:09:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour（mDNS / DNS-SD）來探索作用中的 Gateway（WebSocket 端點）。
多播 `local.` 瀏覽是**僅限 LAN 的便利功能**。內建的 `bonjour`
plugin 擁有 LAN 廣播功能。它會在 macOS 主機上自動啟動，而在
Linux、Windows 和容器化 Gateway 部署中則需選擇啟用。若要跨網路探索，同一個
beacon 也可以透過已設定的廣域 DNS-SD 網域發布。探索
仍是盡力而為，且**不會**取代 SSH 或以 Tailnet 為基礎的連線能力。

## 透過 Tailscale 使用廣域 Bonjour（單播 DNS-SD）

如果 node 和 gateway 位於不同網路，多播 mDNS 不會跨越
邊界。你可以改用透過 Tailscale 的**單播 DNS-SD**
（「廣域 Bonjour」）來維持相同的探索 UX。

高階步驟：

1. 在 gateway 主機上執行 DNS 伺服器（可透過 Tailnet 存取）。
2. 在專用區域下發布 `_openclaw-gw._tcp` 的 DNS-SD 記錄
   （範例：`openclaw.internal.`）。
3. 設定 Tailscale **分割 DNS**，讓你選擇的網域對用戶端
   （包括 iOS）透過該 DNS 伺服器解析。

OpenClaw 支援任何探索網域；`openclaw.internal.` 只是範例。
iOS/Android nodes 會同時瀏覽 `local.` 和你設定的廣域網域。

### Gateway 設定（建議）

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### 一次性 DNS 伺服器設定（gateway 主機）

```bash
openclaw dns setup --apply
```

這會安裝 CoreDNS 並設定它：

- 只在 gateway 的 Tailscale 介面上監聽連接埠 53
- 從 `~/.openclaw/dns/<domain>.db` 提供你選擇的網域（範例：`openclaw.internal.`）

從已連線到 tailnet 的機器驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理主控台中：

- 新增指向 gateway tailnet IP 的 nameserver（UDP/TCP 53）。
- 新增分割 DNS，讓你的探索網域使用該 nameserver。

一旦用戶端接受 tailnet DNS，iOS nodes 和 CLI 探索就能在你的探索網域中瀏覽
`_openclaw-gw._tcp`，不需要多播。

### Gateway 監聽器安全性（建議）

Gateway WS 連接埠（預設 `18789`）預設繫結到 loopback。若要 LAN/tailnet
存取，請明確繫結並保持啟用驗證。

對於僅 tailnet 的設定：

- 在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`。
- 重新啟動 Gateway（或重新啟動 macOS 選單列 app）。

## 什麼會廣播

只有 Gateway 會廣播 `_openclaw-gw._tcp`。LAN 多播廣播由啟用 plugin 時的內建
`bonjour` plugin 提供；廣域 DNS-SD 發布仍由 Gateway 擁有。

## 服務類型

- `_openclaw-gw._tcp` - gateway 傳輸 beacon（由 macOS/iOS/Android nodes 使用）。

## TXT keys（非祕密提示）

Gateway 會廣播少量非祕密提示，讓 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（僅在啟用 TLS 時）
- `gatewayTlsSha256=<sha256>`（僅在啟用 TLS 且 fingerprint 可用時）
- `canvasPort=<port>`（僅在 canvas host 啟用時；目前與 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（僅 mDNS full 模式；當 Tailnet 可用時的選用提示）
- `sshPort=<port>`（僅 mDNS full 模式；廣域 DNS-SD 可能省略它）
- `cliPath=<path>`（僅 mDNS full 模式；廣域 DNS-SD 仍會把它寫為遠端安裝提示）

安全性注意事項：

- Bonjour/mDNS TXT 記錄是**未驗證**的。用戶端不可將 TXT 視為權威路由資訊。
- 用戶端應使用已解析的服務端點（SRV + A/AAAA）進行路由。僅將 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 視為提示。
- SSH 自動目標選擇也應使用已解析的服務主機，而不是只使用 TXT 提示。
- TLS pinning 絕不能允許已廣播的 `gatewayTlsSha256` 覆寫先前儲存的 pin。
- iOS/Android nodes 應將以探索為基礎的直接連線視為**僅限 TLS**，並在信任首次 fingerprint 前要求明確的使用者確認。

## 在 macOS 上除錯

有用的內建工具：

- 瀏覽 instance：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析單一 instance（取代 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果可以瀏覽但解析失敗，通常是遇到 LAN 政策或
mDNS resolver 問題。

## 在 Gateway logs 中除錯

Gateway 會寫入滾動 log 檔案（啟動時會列印為
`gateway log file: ...`）。尋找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour 會在系統 hostname 是有效 DNS label 時，將它用於廣播的 `.local` host。
如果系統 hostname 包含空格、底線或其他無效 DNS-label 字元，OpenClaw 會回退到
`openclaw.local`。當你需要明確 host label 時，請在啟動 Gateway 前設定
`OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS node 上除錯

iOS node 使用 `NWBrowser` 來探索 `_openclaw-gw._tcp`。

若要擷取 logs：

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 重現 → **Copy**

log 包含 browser 狀態轉換和結果集變更。

## 何時啟用 Bonjour

Bonjour 會在 macOS 主機上的空設定 Gateway 啟動時自動啟動，因為本機 app 和附近的 iOS/Android nodes 通常依賴同一 LAN 探索。

當同一 LAN 自動探索在 Linux、Windows 或其他非 macOS 主機上有用時，請明確啟用 Bonjour：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 來決定發布多少 TXT metadata。
預設模式是 `minimal`；只有當本機用戶端需要 `cliPath` 或 `sshPort` 提示時才使用
`full`，並使用 `off` 來抑制 LAN 多播而不變更 plugin 啟用狀態。

## 何時停用 Bonjour

當 LAN 多播廣播不必要、不可用或有害時，請讓 Bonjour 保持停用。
常見情況包括非 macOS 伺服器、Docker bridge networking、
WSL，或會丟棄 mDNS 多播的網路政策。在這些環境中，
Gateway 仍可透過其發布的 URL、SSH、Tailnet 或廣域
DNS-SD 存取，但 LAN 自動探索不可靠。

當問題屬於部署範圍時，優先使用既有的環境覆寫：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

這會停用 LAN 多播廣播，而不變更 plugin 設定。
它對 Docker images、service files、launch scripts 和一次性
除錯都是安全的，因為設定會在環境消失時消失。

當你有意為該 OpenClaw 設定關閉內建 LAN 探索 plugin 時，請使用 plugin 設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

內建的 Bonjour plugin 會在偵測到容器且 `OPENCLAW_DISABLE_BONJOUR` 未設定時，自動停用 LAN 多播廣播。Docker bridge networks
通常不會在 container 和 LAN 之間轉送 mDNS 多播（`224.0.0.251:5353`），
因此從 container 廣播很少能讓探索正常運作。

重要注意事項：

- Bonjour 會在 macOS 主機上自動啟動，在其他地方則需選擇啟用。讓它
  保持停用不會停止 Gateway；它只會略過 LAN 多播廣播。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設為
  `OPENCLAW_GATEWAY_BIND=lan`，讓發布的 host port 可以運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當 Gateway 和 node 不在同一 LAN 上時，請使用廣域探索
  或 Tailnet。
- 在 Docker 外重複使用相同的 `OPENCLAW_CONFIG_DIR` 不會持久化
  container 自動停用政策。
- 僅在 host networking、macvlan 或其他已知會通過 mDNS 多播的
  網路中設定 `OPENCLAW_DISABLE_BONJOUR=0`；設定為 `1` 則強制停用。

## 疑難排解已停用的 Bonjour

如果 Docker 設定後 node 不再自動探索 Gateway：

1. 確認 Gateway 是以 auto、forced-on 還是 forced-off 模式執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認 Gateway 本身可透過發布的連接埠存取：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 當 Bonjour 停用時使用直接目標：
   - Control UI 或本機工具：`http://127.0.0.1:18789`
   - LAN 用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH tunnel，或
     廣域 DNS-SD

4. 如果你在 Docker 中刻意啟用 Bonjour plugin，並用
   `OPENCLAW_DISABLE_BONJOUR=0` 強制廣播，請從 host 測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或 Gateway logs 顯示重複的 ciao watchdog
   cancellations，請還原 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接或
   Tailnet 路由。

## 常見失敗模式

- **Bonjour 不會跨網路**：使用 Tailnet 或 SSH。
- **多播被封鎖**：某些 Wi-Fi 網路會停用 mDNS。
- **廣播器卡在 probing/announcing**：多播被封鎖的主機、
  container bridges、WSL 或介面變動，可能讓 ciao 廣播器停留在
  non-announced 狀態。OpenClaw 會重試幾次，然後針對目前 Gateway process 停用 Bonjour，
  而不是永遠重新啟動廣播器。
- **Docker bridge networking**：Bonjour 會在偵測到 container 時自動停用。
  僅在 host、macvlan 或其他
  支援 mDNS 的網路中設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠 / 介面變動**：macOS 可能暫時丟失 mDNS 結果；請重試。
- **可以瀏覽但解析失敗**：保持機器名稱簡單（避免 emoji 或
  標點符號），然後重新啟動 Gateway。服務 instance 名稱衍生自
  host name，因此過度複雜的名稱可能會讓某些 resolver 混淆。

## 逸出 instance names（`\032`）

Bonjour/DNS-SD 常會將服務 instance names 中的位元組逸出為十進位 `\DDD`
序列（例如空格會變成 `\032`）。

- 這在協定層級是正常的。
- UI 應解碼後顯示（iOS 使用 `BonjourEscapes.decode`）。

## 啟用 / 停用 / 設定

- macOS 主機預設會自動啟動內建 LAN 探索 plugin。
- `openclaw plugins enable bonjour` 會在未預設啟用的主機上啟用內建 LAN 探索 plugin。
- `openclaw plugins disable bonjour` 會透過停用內建 plugin 來停用 LAN 多播廣播。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用 LAN 多播廣播，而不變更 plugin config；接受的 truthy values 是 `1`、`true`、`yes` 和 `on`（legacy: `OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 會強制啟用 LAN 多播廣播，包括在偵測到的 container 內；接受的 falsy values 是 `0`、`false`、`no` 和 `off`。
- 當 Bonjour plugin 已啟用且 `OPENCLAW_DISABLE_BONJOUR` 未設定時，Bonjour 會在一般主機上廣播，並在偵測到的 container 內自動停用。
- `gateway.bind` 在 `~/.openclaw/openclaw.json` 中控制 Gateway bind mode。
- `OPENCLAW_SSH_PORT` 會在廣播 `sshPort` 時覆寫 SSH port（legacy: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 會在 mDNS full mode 啟用時，在 TXT 中發布 MagicDNS 提示（legacy: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 會覆寫已廣播的 CLI path（legacy: `OPENCLAW_CLI_PATH`）。

## 相關文件

- 探索政策與傳輸選擇：[探索](/zh-TW/gateway/discovery)
- Node 配對 + 核准：[Gateway 配對](/zh-TW/gateway/pairing)
