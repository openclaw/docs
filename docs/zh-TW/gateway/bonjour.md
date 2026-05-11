---
read_when:
    - 偵錯 macOS/iOS 上的 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索 UX
summary: Bonjour/mDNS 探索 + 除錯（Gateway 信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-05-11T20:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour (mDNS / DNS-SD) 來探索作用中的 Gateway (WebSocket endpoint)。
Multicast `local.` 瀏覽是一項**僅限 LAN 的便利功能**。內建的 `bonjour`
plugin 擁有 LAN 廣播。它會在 macOS 主機上自動啟動，並在
Linux、Windows 和容器化 Gateway 部署上採用選擇加入。若要跨網路探索，同一個
beacon 也可以透過已設定的廣域 DNS-SD 網域發布。探索
仍是 best-effort，且**不會**取代 SSH 或基於 Tailnet 的連線能力。

## 透過 Tailscale 使用廣域 Bonjour (Unicast DNS-SD)

如果 node 和 gateway 位於不同網路，multicast mDNS 不會跨越
邊界。你可以切換到透過 Tailscale 的 **unicast DNS-SD**
("Wide-Area Bonjour")，保留相同的探索 UX。

高階步驟：

1. 在 gateway 主機上執行 DNS 伺服器（可透過 Tailnet 連線）。
2. 在專用 zone 下發布 `_openclaw-gw._tcp` 的 DNS-SD records
   （範例：`openclaw.internal.`）。
3. 設定 Tailscale **split DNS**，讓你選擇的網域透過該
   DNS 伺服器為 clients（包括 iOS）解析。

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

這會安裝 CoreDNS，並將其設定為：

- 只在 gateway 的 Tailscale 介面上監聽 port 53
- 從 `~/.openclaw/dns/<domain>.db` 服務你選擇的網域（範例：`openclaw.internal.`）

從已連線到 tailnet 的機器驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理主控台中：

- 新增一個指向 gateway tailnet IP 的 nameserver（UDP/TCP 53）。
- 新增 split DNS，讓你的探索網域使用該 nameserver。

一旦 clients 接受 tailnet DNS，iOS nodes 和 CLI 探索就能在你的探索網域中瀏覽
`_openclaw-gw._tcp`，無需 multicast。

### Gateway listener 安全性（建議）

Gateway WS port（預設 `18789`）預設會 bind 到 loopback。若要 LAN/tailnet
存取，請明確 bind 並保持 auth 啟用。

對於僅限 tailnet 的設定：

- 在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`。
- 重新啟動 Gateway（或重新啟動 macOS menubar app）。

## 會廣播的項目

只有 Gateway 會廣播 `_openclaw-gw._tcp`。啟用 bundled `bonjour` plugin 時，
它會提供 LAN multicast 廣播；wide-area
DNS-SD 發布仍由 Gateway 擁有。

## Service types

- `_openclaw-gw._tcp` - gateway transport beacon（供 macOS/iOS/Android nodes 使用）。

## TXT keys（非祕密提示）

Gateway 會廣播小型非祕密提示，讓 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（僅在 TLS 啟用時）
- `gatewayTlsSha256=<sha256>`（僅在 TLS 啟用且 fingerprint 可用時）
- `canvasPort=<port>`（僅在 canvas host 啟用時；目前與 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（僅 mDNS full mode，Tailnet 可用時的選用提示）
- `sshPort=<port>`（僅 mDNS full mode；wide-area DNS-SD 可能省略）
- `cliPath=<path>`（僅 mDNS full mode；wide-area DNS-SD 仍會將它寫入為 remote-install 提示）

安全性注意事項：

- Bonjour/mDNS TXT records **未經驗證**。Clients 不得將 TXT 視為權威路由。
- Clients 應使用解析出的 service endpoint（SRV + A/AAAA）進行路由。僅將 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 視為提示。
- SSH auto-targeting 同樣應使用解析出的 service host，而不是僅使用 TXT 提示。
- TLS pinning 絕不可允許廣播的 `gatewayTlsSha256` 覆寫先前儲存的 pin。
- iOS/Android nodes 應將基於探索的直接連線視為**僅限 TLS**，並要求使用者在信任首次 fingerprint 前明確確認。

## 在 macOS 上除錯

實用的內建工具：

- 瀏覽 instances：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析一個 instance（替換 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果瀏覽可行但解析失敗，通常是遇到 LAN policy 或
mDNS resolver 問題。

## 在 Gateway logs 中除錯

Gateway 會寫入 rolling log 檔案（啟動時列印為
`gateway log file: ...`）。尋找 `bonjour:` 行，特別是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog 會將作用中的 `probing`、`announcing` 和新的 conflict-renames 視為
進行中狀態。如果 service 永遠沒有到達 `announced`，OpenClaw 最終會
重新建立 advertiser，並在重複失敗後，針對該
Gateway process 停用 Bonjour，而不是永遠重新廣播。

當系統 hostname 是有效的 DNS label 時，Bonjour 會將其用於廣播的 `.local` host。
如果系統 hostname 包含空格、底線或其他
無效 DNS-label 字元，OpenClaw 會 fallback 到 `openclaw.local`。當你需要
明確的 host label 時，請在啟動 Gateway 前設定
`OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS node 上除錯

iOS node 使用 `NWBrowser` 來探索 `_openclaw-gw._tcp`。

若要擷取 logs：

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 重現 → **Copy**

log 包含 browser state transitions 和 result-set changes。

## 何時啟用 Bonjour

Bonjour 會在 macOS 主機上的空設定 Gateway 啟動時自動啟動，因為
本機 app 和附近的 iOS/Android nodes 通常依賴同一 LAN 探索。

當同一 LAN 自動探索在 Linux、Windows 或其他非 macOS 主機上有用時，
請明確啟用 Bonjour：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 來決定要發布多少 TXT metadata。
預設 mode 是 `minimal`；只有在本機 clients 需要
`cliPath` 或 `sshPort` 提示時才使用 `full`，並使用 `off` 來抑制 LAN multicast，
而不變更 plugin 啟用狀態。

## 何時停用 Bonjour

當 LAN multicast 廣播不必要、不可用或有害時，請讓 Bonjour 保持停用。
常見情況是非 macOS servers、Docker bridge networking、
WSL，或會丟棄 mDNS multicast 的 network policy。在這些環境中，
Gateway 仍可透過其發布的 URL、SSH、Tailnet 或 wide-area
DNS-SD 連線，但 LAN auto-discovery 並不可靠。

當問題屬於 deployment 範圍時，優先使用既有的 environment override：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

這會停用 LAN multicast 廣播，而不變更 plugin 設定。
它對 Docker images、service files、launch scripts 和一次性
除錯都是安全的，因為環境消失時該設定也會消失。

當你有意針對該 OpenClaw config 關閉 bundled LAN
discovery plugin 時，請使用 plugin 設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

當 `OPENCLAW_DISABLE_BONJOUR` 未設定時，bundled Bonjour plugin 會在偵測到的
containers 中自動停用 LAN multicast 廣播。Docker bridge networks
通常不會在 container 與 LAN 之間轉送 mDNS multicast（`224.0.0.251:5353`），
因此從 container 廣播很少能讓探索正常運作。

重要注意事項：

- Bonjour 會在 macOS 主機上自動啟動，其他地方則採選擇加入。保持停用
  不會停止 Gateway；它只會略過 LAN multicast 廣播。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設為
  `OPENCLAW_GATEWAY_BIND=lan`，讓發布的 host port 可以運作。
- 停用 Bonjour 不會停用 wide-area DNS-SD。當 Gateway 與 node 不在同一個 LAN 時，
  請使用 wide-area discovery 或 Tailnet。
- 在 Docker 外重複使用相同的 `OPENCLAW_CONFIG_DIR` 不會持久化
  container auto-disable policy。
- 只有在 host networking、macvlan 或其他
  已知 mDNS multicast 會通過的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`；設定為 `1` 可強制停用。

## 疑難排解已停用的 Bonjour

如果 node 在 Docker 設定後不再自動探索 Gateway：

1. 確認 Gateway 是以 auto、forced-on 還是 forced-off mode 執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認 Gateway 本身可透過發布的 port 連線：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour 停用時使用直接 target：
   - Control UI 或本機工具：`http://127.0.0.1:18789`
   - LAN clients：`http://<gateway-host>:18789`
   - 跨網路 clients：Tailnet MagicDNS、Tailnet IP、SSH tunnel 或
     wide-area DNS-SD

4. 如果你刻意在 Docker 中啟用 Bonjour plugin，並用
   `OPENCLAW_DISABLE_BONJOUR=0` 強制廣播，請從 host 測試 multicast：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或 Gateway logs 顯示重複的 ciao watchdog
   cancellations，請還原為 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接或
   Tailnet route。

## 常見失敗模式

- **Bonjour 不會跨越網路**：使用 Tailnet 或 SSH。
- **Multicast 被封鎖**：某些 Wi-Fi networks 會停用 mDNS。
- **Advertiser 卡在 probing/announcing**：multicast 被封鎖的 hosts、
  container bridges、WSL 或 interface churn 可能使 ciao advertiser 留在
  non-announced state。OpenClaw 會重試幾次，然後針對目前的 Gateway process 停用 Bonjour，
  而不是永遠重新啟動 advertiser。
- **Docker bridge networking**：Bonjour 會在偵測到的 containers 中自動停用。
  只有在 host、macvlan 或其他
  支援 mDNS 的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **Sleep / interface churn**：macOS 可能會暫時丟失 mDNS results；請重試。
- **瀏覽可行但解析失敗**：保持 machine names 簡單（避免 emojis 或
  punctuation），然後重新啟動 Gateway。service instance name 來自
  host name，因此過於複雜的名稱可能會讓某些 resolvers 混淆。

## Escaped instance names (`\032`)

Bonjour/DNS-SD 經常將 service instance names 中的 bytes escape 為十進位 `\DDD`
sequences（例如 spaces 會變成 `\032`）。

- 這在 protocol level 是正常的。
- UIs 應解碼後顯示（iOS 使用 `BonjourEscapes.decode`）。

## 啟用 / 停用 / 設定

- macOS 主機預設會自動啟動內建的 LAN 探索 Plugin。
- `openclaw plugins enable bonjour` 會在未預設啟用的主機上啟用內建的 LAN 探索 Plugin。
- `openclaw plugins disable bonjour` 會透過停用內建 Plugin 來停用 LAN 多播廣告。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用 LAN 多播廣告，而不變更 Plugin 設定；可接受的真值為 `1`、`true`、`yes` 和 `on`（舊版：`OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 會強制開啟 LAN 多播廣告，包括在偵測到的容器內；可接受的假值為 `0`、`false`、`no` 和 `off`。
- 當 Bonjour Plugin 已啟用且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，Bonjour 會在一般主機上進行廣告，並在偵測到的容器內自動停用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 會控制 Gateway 繫結模式。
- `OPENCLAW_SSH_PORT` 會在廣告 `sshPort` 時覆寫 SSH 連接埠（舊版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 會在啟用 mDNS 完整模式時，於 TXT 中發布 MagicDNS 提示（舊版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 會覆寫廣告的 CLI 路徑（舊版：`OPENCLAW_CLI_PATH`）。

## 相關文件

- 探索政策與傳輸選擇：[探索](/zh-TW/gateway/discovery)
- Node 配對與核准：[Gateway 配對](/zh-TW/gateway/pairing)
