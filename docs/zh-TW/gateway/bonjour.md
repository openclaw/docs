---
read_when:
    - 在 macOS/iOS 上偵錯 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索使用者體驗
summary: Bonjour/mDNS 探索 + 偵錯（Gateway 信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-05-12T12:50:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour（mDNS / DNS-SD）來探索作用中的 Gateway（WebSocket 端點）。
多播 `local.` 瀏覽是**僅限 LAN 的便利功能**。內建的 `bonjour`
Plugin 擁有 LAN 廣播。它會在 macOS 主機上自動啟動，而在
Linux、Windows 和容器化 Gateway 部署中則需選擇啟用。對於跨網路探索，同一個
信標也可以透過已設定的廣域 DNS-SD 網域發布。探索
仍是盡力而為，且**不會**取代 SSH 或以 Tailnet 為基礎的連線能力。

## 透過 Tailscale 的廣域 Bonjour（單播 DNS-SD）

如果節點和 Gateway 位於不同網路，多播 mDNS 不會跨越
邊界。你可以透過切換到 Tailscale 上的**單播 DNS-SD**
（「廣域 Bonjour」）來保留相同的探索 UX。

高階步驟：

1. 在 Gateway 主機上執行 DNS 伺服器（可透過 Tailnet 連線）。
2. 在專用區域下發布 `_openclaw-gw._tcp` 的 DNS-SD 記錄
   （範例：`openclaw.internal.`）。
3. 設定 Tailscale **分割 DNS**，讓你選擇的網域透過該
   DNS 伺服器為用戶端解析（包含 iOS）。

OpenClaw 支援任何探索網域；`openclaw.internal.` 只是範例。
iOS/Android 節點會同時瀏覽 `local.` 和你設定的廣域網域。

### Gateway 設定（建議）

```json5
{
  gateway: { bind: "tailnet" }, // 僅限 tailnet（建議）
  discovery: { wideArea: { enabled: true } }, // 啟用廣域 DNS-SD 發布
}
```

### 一次性 DNS 伺服器設定（Gateway 主機）

```bash
openclaw dns setup --apply
```

這會安裝 CoreDNS，並將其設定為：

- 只在 Gateway 的 Tailscale 介面上監聽連接埠 53
- 從 `~/.openclaw/dns/<domain>.db` 提供你選擇的網域（範例：`openclaw.internal.`）

從已連線到 tailnet 的機器驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理主控台中：

- 新增一個名稱伺服器，指向 Gateway 的 tailnet IP（UDP/TCP 53）。
- 新增分割 DNS，讓你的探索網域使用該名稱伺服器。

一旦用戶端接受 tailnet DNS，iOS 節點和 CLI 探索就能在你的探索網域中瀏覽
`_openclaw-gw._tcp`，不需要多播。

### Gateway 監聽器安全性（建議）

Gateway WS 連接埠（預設 `18789`）預設會繫結到 loopback。若要 LAN/tailnet
存取，請明確繫結並保持驗證啟用。

對於僅限 tailnet 的設定：

- 在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`。
- 重新啟動 Gateway（或重新啟動 macOS 選單列應用程式）。

## 廣播內容

只有 Gateway 會廣播 `_openclaw-gw._tcp`。當 Plugin 啟用時，LAN 多播廣播由
內建的 `bonjour` Plugin 提供；廣域 DNS-SD 發布仍由 Gateway 擁有。

## 服務類型

- `_openclaw-gw._tcp` - Gateway 傳輸信標（由 macOS/iOS/Android 節點使用）。

## TXT 鍵（非秘密提示）

Gateway 會廣播小型非秘密提示，讓 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（僅在啟用 TLS 時）
- `gatewayTlsSha256=<sha256>`（僅在啟用 TLS 且指紋可用時）
- `canvasPort=<port>`（僅在畫布主機啟用時；目前與 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（僅限 mDNS 完整模式，Tailnet 可用時的選用提示）
- `sshPort=<port>`（僅限完整模式；在 minimal 和 off 模式中省略）
- `cliPath=<path>`（僅限完整模式；在 minimal 和 off 模式中省略）

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端不得將 TXT 視為權威路由。
- 用戶端應使用已解析的服務端點（SRV + A/AAAA）進行路由。僅將 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 視為提示。
- SSH 自動目標選擇同樣應使用已解析的服務主機，而不是僅依賴 TXT 的提示。
- TLS 釘選絕不能允許已廣播的 `gatewayTlsSha256` 覆寫先前儲存的釘選。
- iOS/Android 節點應將以探索為基礎的直接連線視為**僅限 TLS**，並在信任首次出現的指紋前要求明確的使用者確認。

## 在 macOS 上偵錯

有用的內建工具：

- 瀏覽執行個體：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析單一執行個體（取代 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果瀏覽可用但解析失敗，通常是遇到 LAN 原則或
mDNS 解析器問題。

## 在 Gateway 記錄中偵錯

Gateway 會寫入輪替記錄檔（啟動時列印為
`gateway log file: ...`）。尋找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

看門狗會將作用中的 `probing`、`announcing` 和新的衝突重新命名視為
進行中狀態。如果服務從未達到 `announced`，OpenClaw 最終會
重新建立廣播器，並在重複失敗後，對該 Gateway 行程停用 Bonjour，
而不是永遠重新廣播。

當系統主機名稱是有效的 DNS 標籤時，Bonjour 會使用它作為廣播的 `.local` 主機。
如果系統主機名稱包含空格、底線或其他無效的 DNS 標籤字元，
OpenClaw 會退回到 `openclaw.local`。當你需要明確的主機標籤時，請在啟動
Gateway 前設定 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 節點上偵錯

iOS 節點使用 `NWBrowser` 探索 `_openclaw-gw._tcp`。

擷取記錄：

- 設定 → Gateway → 進階 → **探索偵錯記錄**
- 設定 → Gateway → 進階 → **探索記錄** → 重現 → **複製**

記錄包含瀏覽器狀態轉換和結果集變更。

## 何時啟用 Bonjour

Bonjour 會在 macOS 主機上的空設定 Gateway 啟動時自動啟動，因為
本機應用程式和附近的 iOS/Android 節點通常依賴同一 LAN 探索。

當同一 LAN 自動探索在 Linux、Windows 或其他非 macOS 主機上有用時，
請明確啟用 Bonjour：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 決定要發布多少 TXT 中繼資料。
相同模式也會控制廣域 DNS-SD 記錄中的選用 TXT 提示。
預設模式是 `minimal`；只有當用戶端需要 `cliPath` 或
`sshPort` 提示時才使用 `full`。使用 `off` 可抑制 LAN 多播，而不變更 Plugin
啟用狀態；當 `discovery.wideArea.enabled` 為 true 時，廣域 DNS-SD 仍可發布 minimal Gateway 信標。

## 何時停用 Bonjour

當 LAN 多播廣播不必要、不可用或有害時，請保持 Bonjour 停用。
常見情況包括非 macOS 伺服器、Docker 橋接網路、
WSL，或會丟棄 mDNS 多播的網路原則。在這些環境中，
Gateway 仍可透過其發布的 URL、SSH、Tailnet 或廣域
DNS-SD 連線，但 LAN 自動探索並不可靠。

當問題是部署範圍時，優先使用現有的環境覆寫：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

這會停用 LAN 多播廣播，而不變更 Plugin 設定。
它適合 Docker 映像、服務檔、啟動指令碼和一次性
偵錯，因為該設定會隨環境消失而消失。

當你有意要為該 OpenClaw 設定關閉內建的 LAN
探索 Plugin 時，請使用 Plugin 設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

偵測到容器且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，內建 Bonjour Plugin 會自動停用 LAN 多播廣播。
Docker 橋接網路通常不會在容器
和 LAN 之間轉送 mDNS 多播（`224.0.0.251:5353`），因此從容器廣播很少能讓探索正常運作。

重要注意事項：

- Bonjour 會在 macOS 主機上自動啟動，其他地方則需選擇啟用。保持停用
  不會停止 Gateway；它只會略過 LAN 多播廣播。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設為
  `OPENCLAW_GATEWAY_BIND=lan`，因此發布的主機連接埠可以運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當 Gateway 和節點不在同一個 LAN 上時，
  請使用廣域探索或 Tailnet。
- 在 Docker 外重複使用相同的 `OPENCLAW_CONFIG_DIR` 不會保留
  容器自動停用原則。
- 只有在主機網路、macvlan 或其他已知 mDNS 多播可通過的
  網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`；設定為 `1` 可強制停用。

## 疑難排解已停用的 Bonjour

如果 Docker 設定後，節點不再自動探索 Gateway：

1. 確認 Gateway 是以自動、強制開啟或強制關閉模式執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認 Gateway 本身可透過發布的連接埠連線：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 當 Bonjour 停用時，使用直接目標：
   - 控制 UI 或本機工具：`http://127.0.0.1:18789`
   - LAN 用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH 通道，或
     廣域 DNS-SD

4. 如果你刻意在 Docker 中啟用 Bonjour Plugin，並使用
   `OPENCLAW_DISABLE_BONJOUR=0` 強制廣播，請從主機測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或 Gateway 記錄顯示重複的 ciao 看門狗
   取消，請還原 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接或
   Tailnet 路由。

## 常見失敗模式

- **Bonjour 不會跨網路**：使用 Tailnet 或 SSH。
- **多播遭封鎖**：某些 Wi-Fi 網路會停用 mDNS。
- **廣播器卡在 probing/announcing**：多播遭封鎖的主機、
  容器橋接、WSL 或介面變動可能讓 ciao 廣播器停留在
  非 announced 狀態。OpenClaw 會重試幾次，然後對目前的 Gateway 行程停用 Bonjour，
  而不是永遠重新啟動廣播器。
- **Docker 橋接網路**：Bonjour 會在偵測到的容器中自動停用。
  只有在主機、macvlan 或其他具備 mDNS 能力的網路中，才設定
  `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠 / 介面變動**：macOS 可能暫時遺失 mDNS 結果；請重試。
- **瀏覽可用但解析失敗**：保持機器名稱簡單（避免表情符號或
  標點符號），然後重新啟動 Gateway。服務執行個體名稱源自
  主機名稱，因此過於複雜的名稱可能會讓某些解析器混淆。

## 逸出的執行個體名稱（`\032`）

Bonjour/DNS-SD 經常將服務執行個體名稱中的位元組逸出為十進位 `\DDD`
序列（例如空格會變成 `\032`）。

- 這在通訊協定層級是正常的。
- UI 應解碼後顯示（iOS 使用 `BonjourEscapes.decode`）。

## 啟用 / 停用 / 設定

- macOS 主機預設會自動啟動內建的 LAN 探索 Plugin。
- `openclaw plugins enable bonjour` 會在未預設啟用的主機上啟用內建的 LAN 探索 Plugin。
- `openclaw plugins disable bonjour` 會透過停用內建 Plugin 來停用 LAN 多播廣告。
- `OPENCLAW_DISABLE_BONJOUR=1` 會停用 LAN 多播廣告，而不變更 Plugin 設定；接受的 truthy 值為 `1`、`true`、`yes` 和 `on`（舊版：`OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 會強制開啟 LAN 多播廣告，包括在偵測到的容器內；接受的 falsy 值為 `0`、`false`、`no` 和 `off`。
- 當 Bonjour Plugin 已啟用且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，Bonjour 會在一般主機上廣告，並在偵測到的容器內自動停用。
- `gateway.bind`（位於 `~/.openclaw/openclaw.json`）控制 Gateway 繫結模式。
- 當廣告 `sshPort` 時，`OPENCLAW_SSH_PORT` 會覆寫 SSH 連接埠（舊版：`OPENCLAW_SSH_PORT`）。
- 啟用 mDNS 完整模式時，`OPENCLAW_TAILNET_DNS` 會在 TXT 中發布 MagicDNS 提示（舊版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 會覆寫廣告的 CLI 路徑（舊版：`OPENCLAW_CLI_PATH`）。

## 相關文件

- 探索政策和傳輸選擇：[探索](/zh-TW/gateway/discovery)
- Node 配對 + 核准：[Gateway 配對](/zh-TW/gateway/pairing)
