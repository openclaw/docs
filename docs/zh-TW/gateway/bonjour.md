---
read_when:
    - 偵錯 macOS/iOS 上的 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索 UX
summary: Bonjour/mDNS 發現 + 偵錯（Gateway 信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-04-30T03:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS 探索

OpenClaw 使用 Bonjour（mDNS / DNS‑SD）來探索作用中的 Gateway（WebSocket 端點）。
多播 `local.` 瀏覽是**僅限 LAN 的便利功能**。內建的 `bonjour`
plugin 負責 LAN 廣播，且預設啟用。對於跨網路探索，
同一個信標也可以透過已設定的廣域 DNS-SD 網域發布。
探索仍是盡力而為，且**不會**取代 SSH 或 Tailnet 型連線能力。

## 透過 Tailscale 使用廣域 Bonjour（單播 DNS-SD）

如果 node 和 gateway 位於不同網路，多播 mDNS 不會跨越該
邊界。你可以透過在 Tailscale 上切換到**單播 DNS‑SD**
（「廣域 Bonjour」）來保留相同的探索體驗。

高階步驟：

1. 在 gateway 主機上執行 DNS 伺服器（可透過 Tailnet 連線）。
2. 在專用 zone 下發布 `_openclaw-gw._tcp` 的 DNS‑SD 記錄
   （範例：`openclaw.internal.`）。
3. 設定 Tailscale **分割 DNS**，讓你選擇的網域透過該
   DNS 伺服器為用戶端（包含 iOS）解析。

OpenClaw 支援任何探索網域；`openclaw.internal.` 只是範例。
iOS/Android node 會同時瀏覽 `local.` 和你設定的廣域網域。

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

- 僅在 gateway 的 Tailscale 介面上監聽連接埠 53
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

一旦用戶端接受 tailnet DNS，iOS node 和 CLI 探索便可在你的探索網域中瀏覽
`_openclaw-gw._tcp`，不需要多播。

### Gateway 監聽器安全性（建議）

Gateway WS 連接埠（預設 `18789`）預設綁定到 loopback。若要 LAN/tailnet
存取，請明確綁定並保持驗證啟用。

對於僅限 tailnet 的設定：

- 在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`。
- 重新啟動 Gateway（或重新啟動 macOS menubar app）。

## 廣播內容

只有 Gateway 會廣播 `_openclaw-gw._tcp`。LAN 多播廣播由內建的 `bonjour` plugin
提供；廣域 DNS-SD 發布仍由 Gateway 擁有。

## 服務類型

- `_openclaw-gw._tcp` — gateway 傳輸信標（供 macOS/iOS/Android node 使用）。

## TXT key（非機密提示）

Gateway 會廣播小型非機密提示，讓 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（僅在 TLS 啟用時）
- `gatewayTlsSha256=<sha256>`（僅在 TLS 啟用且 fingerprint 可用時）
- `canvasPort=<port>`（僅在 canvas host 啟用時；目前與 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（僅限 mDNS full mode，Tailnet 可用時的選用提示）
- `sshPort=<port>`（僅限 mDNS full mode；廣域 DNS-SD 可能會省略）
- `cliPath=<path>`（僅限 mDNS full mode；廣域 DNS-SD 仍會將它寫入作為遠端安裝提示）

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端不得將 TXT 視為權威路由資訊。
- 用戶端應使用已解析的服務端點（SRV + A/AAAA）進行路由。僅將 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 視為提示。
- SSH 自動目標選擇同樣應使用已解析的服務主機，而不是僅依賴 TXT 提示。
- TLS pinning 絕不能允許廣播的 `gatewayTlsSha256` 覆寫先前儲存的 pin。
- iOS/Android node 應將基於探索的直接連線視為**僅限 TLS**，並在信任首次出現的 fingerprint 前要求使用者明確確認。

## 在 macOS 上除錯

實用的內建工具：

- 瀏覽執行個體：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析一個執行個體（取代 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果瀏覽可行但解析失敗，你通常遇到的是 LAN 政策或
mDNS 解析器問題。

## 在 Gateway 記錄中除錯

Gateway 會寫入循環記錄檔（啟動時列印為
`gateway log file: ...`）。尋找 `bonjour:` 行，特別是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

當系統主機名稱是有效的 DNS label 時，Bonjour 會使用它作為廣播的 `.local` 主機。
如果系統主機名稱包含空格、底線或其他無效的 DNS-label 字元，OpenClaw 會退回使用 `openclaw.local`。
當你需要明確的主機 label 時，請在啟動 Gateway 前設定
`OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS node 上除錯

iOS node 使用 `NWBrowser` 來探索 `_openclaw-gw._tcp`。

擷取記錄：

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 重現 → **Copy**

記錄包含 browser 狀態轉換與結果集變更。

## 何時停用 Bonjour

只有在 LAN 多播廣播不可用或有害時才停用 Bonjour。
常見情況是 Gateway 在 Docker bridge networking、WSL 或會丟棄 mDNS 多播的
網路政策後方執行。在這些環境中，Gateway
仍可透過其發布的 URL、SSH、Tailnet 或廣域 DNS-SD 連線，
但 LAN 自動探索不可靠。

當問題屬於部署範圍時，偏好使用既有的環境覆寫：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

這會停用 LAN 多播廣播，而不變更 plugin 設定。
它適用於 Docker 映像、服務檔、啟動腳本和一次性
除錯，因為該設定會在環境消失時一併消失。

只有當你刻意想為該 OpenClaw 設定關閉
內建 LAN 探索 plugin 時，才使用 plugin 設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

當 `OPENCLAW_DISABLE_BONJOUR` 未設定時，內建 Bonjour plugin 會在偵測到
container 時自動停用 LAN 多播廣播。Docker bridge network
通常不會在 container 和 LAN 之間轉送 mDNS 多播（`224.0.0.251:5353`），
因此從 container 廣播很少能讓探索正常運作。

重要注意事項：

- 停用 Bonjour 不會停止 Gateway。它只會停止 LAN 多播
  廣播。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設為
  `OPENCLAW_GATEWAY_BIND=lan`，因此發布的主機連接埠可以運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當 Gateway 和 node 不在同一個 LAN 上時，請使用廣域探索
  或 Tailnet。
- 在 Docker 外部重複使用相同的 `OPENCLAW_CONFIG_DIR` 不會保留
  container 自動停用政策。
- 只有在 host networking、macvlan 或其他已知 mDNS 多播可通過的
  網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`；將它設定為 `1` 可強制停用。

## 疑難排解已停用的 Bonjour

如果 Docker 設定後 node 不再自動探索 Gateway：

1. 確認 Gateway 是以 auto、forced-on 或 forced-off 模式執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認 Gateway 本身可透過發布的連接埠連線：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour 停用時使用直接目標：
   - Control UI 或本機工具：`http://127.0.0.1:18789`
   - LAN 用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH tunnel，或
     廣域 DNS-SD

4. 如果你刻意使用
   `OPENCLAW_DISABLE_BONJOUR=0` 在 Docker 中啟用 Bonjour，請從主機測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或 Gateway 記錄顯示重複的 ciao watchdog
   取消，請還原 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接或
   Tailnet 路由。

## 常見失敗模式

- **Bonjour 不會跨網路**：使用 Tailnet 或 SSH。
- **多播遭封鎖**：某些 Wi‑Fi 網路會停用 mDNS。
- **廣播器卡在 probing/announcing**：多播遭封鎖的主機、
  container bridge、WSL 或介面變動，可能會讓 ciao 廣播器停留在
  non-announced 狀態。OpenClaw 會重試數次，然後針對目前的 Gateway process 停用 Bonjour，
  而不是永遠重新啟動廣播器。
- **Docker bridge networking**：Bonjour 會在偵測到的 container 中自動停用。
  只有在 host、macvlan 或其他具備
  mDNS 能力的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠 / 介面變動**：macOS 可能會暫時遺失 mDNS 結果；請重試。
- **瀏覽可行但解析失敗**：保持機器名稱簡單（避免 emoji 或
  標點符號），然後重新啟動 Gateway。服務執行個體名稱衍生自
  主機名稱，因此過於複雜的名稱可能會使某些解析器混淆。

## 逸出執行個體名稱（`\032`）

Bonjour/DNS‑SD 常會將服務執行個體名稱中的 byte 逸出為十進位 `\DDD`
序列（例如空格會變成 `\032`）。

- 這在協定層級是正常的。
- UI 應解碼後顯示（iOS 使用 `BonjourEscapes.decode`）。

## 停用 / 設定

- `openclaw plugins disable bonjour` 會透過停用內建 plugin 來停用 LAN 多播廣播。
- `openclaw plugins enable bonjour` 會還原預設的 LAN 探索 plugin。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用 LAN 多播廣播，而不變更 plugin config；接受的 truthy 值為 `1`、`true`、`yes` 和 `on`（舊版：`OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 會強制開啟 LAN 多播廣播，包含在偵測到的 container 內；接受的 falsy 值為 `0`、`false`、`no` 和 `off`。
- 當 `OPENCLAW_DISABLE_BONJOUR` 未設定時，Bonjour 會在一般主機上廣播，並在偵測到的 container 內自動停用。
- `gateway.bind` 在 `~/.openclaw/openclaw.json` 中控制 Gateway bind mode。
- `OPENCLAW_SSH_PORT` 會在 `sshPort` 被廣播時覆寫 SSH 連接埠（舊版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 會在 mDNS full mode 啟用時，在 TXT 中發布 MagicDNS 提示（舊版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 會覆寫廣播的 CLI path（舊版：`OPENCLAW_CLI_PATH`）。

## 相關文件

- 探索政策與傳輸選擇：[探索](/zh-TW/gateway/discovery)
- Node pairing + 核准：[Gateway pairing](/zh-TW/gateway/pairing)
