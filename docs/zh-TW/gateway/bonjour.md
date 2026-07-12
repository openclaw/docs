---
read_when:
    - 在 macOS/iOS 上偵錯 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索使用者體驗
summary: Bonjour/mDNS 探索與偵錯（閘道信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-07-11T21:17:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour（mDNS/DNS-SD）來探索作用中的閘道（WebSocket 端點）。多播 `local.` 瀏覽是**僅限區域網路的便利功能**：隨附的 `bonjour` 外掛負責區域網路廣播，在 macOS 主機上自動啟動，而在 Linux、Windows 與容器化閘道部署中則需選擇啟用。同一個信標也可以透過已設定的廣域 DNS-SD 網域發布，以進行跨網路探索。探索功能採盡力而為，且**無法**取代 SSH 或基於 Tailnet 的連線方式。

## 透過 Tailscale 使用廣域 Bonjour（單播 DNS-SD）

如果節點與閘道位於不同網路，多播 mDNS 無法跨越網路邊界。可透過 Tailscale 切換至**單播 DNS-SD**（「廣域 Bonjour」），以維持相同的探索使用體驗：

1. 在閘道主機上執行可透過 Tailnet 存取的 DNS 伺服器。
2. 在專用區域（例如：`openclaw.internal.`）下發布 `_openclaw-gw._tcp` 的 DNS-SD 記錄。
3. 設定 Tailscale **分割 DNS**，讓用戶端（包括 iOS）透過該 DNS 伺服器解析所選網域。

上述 `openclaw.internal.` 只是範例——OpenClaw 支援任何探索網域。iOS/Android 節點會同時瀏覽 `local.` 與您設定的廣域網域。

### 閘道設定

```json5
{
  gateway: { bind: "tailnet" }, // 僅限 tailnet（建議）
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

當未設定 `discovery.wideArea.domain` 時，也接受以 `OPENCLAW_WIDE_AREA_DOMAIN` 環境變數作為備援值。

### 一次性 DNS 伺服器設定（閘道主機，僅限 macOS）

```bash
openclaw dns setup --apply
```

此命令僅適用於 macOS，且需要 Homebrew 與運作中的 Tailscale 連線。它會安裝 CoreDNS（`brew install coredns`）並將其設定為：

- 僅在閘道的 Tailscale 介面上監聽連接埠 53
- 從 `~/.openclaw/dns/<domain>.db` 提供所選網域（例如：`openclaw.internal.`）的服務

請先不加 `--apply` 執行，以預覽計畫（網域、區域檔案路徑、偵測到的 Tailnet IP、建議設定），而不安裝任何項目。

從已連線至 Tailnet 的機器進行驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理主控台中：

- 新增指向閘道 Tailnet IP 的名稱伺服器（UDP/TCP 53）。
- 新增分割 DNS，讓您的探索網域使用該名稱伺服器。

用戶端接受 Tailnet DNS 後，iOS 節點與命令列介面探索功能便能在您的探索網域中瀏覽 `_openclaw-gw._tcp`，無須使用多播。

### 閘道監聽器安全性

閘道 WS 連接埠（預設為 `18789`）預設繫結至 local loopback。若要供區域網路/Tailnet 存取，請明確設定繫結並保持驗證啟用。若為僅限 Tailnet 的設定，請在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`，然後重新啟動閘道（或 macOS 選單列應用程式）。

## 廣播內容

只有閘道會廣播 `_openclaw-gw._tcp`。啟用時，區域網路多播廣播由隨附的 `bonjour` 外掛提供；廣域 DNS-SD 發布仍由閘道負責。

## 服務類型

- `_openclaw-gw._tcp` - 閘道傳輸信標，供 macOS/iOS/Android 節點使用。

## TXT 鍵（非機密提示）

| 鍵                            | 出現時機                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 一律出現。                                                                     |
| `displayName=<friendly name>` | 一律出現。                                                                     |
| `lanHost=<hostname>.local`    | 一律出現。                                                                     |
| `gatewayPort=<port>`          | 一律出現（閘道 WS + HTTP）。                                                    |
| `transport=gateway`           | 一律出現。                                                                     |
| `gatewayTls=1`                | 僅在啟用 TLS 時出現。                                                          |
| `gatewayTlsSha256=<sha256>`   | 僅在啟用 TLS 且可取得指紋時出現。                                               |
| `gatewayDirectReachable=1`    | 僅在可直接連線至閘道時出現（而非只能透過轉送器/Proxy 路徑）。                   |
| `canvasPort=<port>`           | 僅在啟用畫布主機時出現；目前與 `gatewayPort` 相同。                             |
| `tailnetDns=<magicdns>`       | 僅限 mDNS 完整模式；Tailnet 可用時的選用提示。                                 |
| `sshPort=<port>`              | 僅限完整模式；在最小模式與關閉模式中省略。                                     |
| `cliPath=<path>`              | 僅限完整模式；在最小模式與關閉模式中省略。                                     |

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端不得將 TXT 視為具權威性的路由資訊。
- 用戶端應使用解析後的服務端點（SRV + A/AAAA）進行路由。僅將 `lanHost`、`tailnetDns`、`gatewayPort` 與 `gatewayTlsSha256` 視為提示。
- SSH 自動選取目標同樣應使用解析後的服務主機，而非僅使用 TXT 提示。
- TLS 固定不得讓廣播的 `gatewayTlsSha256` 覆寫先前儲存的固定值。
- iOS/Android 節點應將基於探索的直接連線視為**僅限 TLS**，且首次信任指紋前必須要求使用者明確確認。

## 在 macOS 上偵錯

內建工具：

```bash
# 瀏覽執行個體
dns-sd -B _openclaw-gw._tcp local.

# 解析一個執行個體（替換 <instance>）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

如果瀏覽正常但解析失敗，通常是區域網路政策或 mDNS 解析器發生問題。

## 在閘道日誌中偵錯

閘道會寫入循環日誌檔案（啟動時顯示為 `gateway log file: ...`）。請尋找 `bonjour:` 開頭的行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

看門狗會將作用中的 `probing`、`announcing` 與近期因衝突而重新命名視為進行中狀態。如果服務始終未到達 `announced` 狀態，OpenClaw 會重新建立廣播器；重複失敗後，會為該閘道程序停用 Bonjour，而不是無限期重新廣播。

當系統主機名稱是有效的 DNS 標籤時，Bonjour 會使用該名稱作為廣播的 `.local` 主機。如果系統主機名稱含有空格、底線或其他無效的 DNS 標籤字元，OpenClaw 會改用 `openclaw.local`。需要明確指定主機標籤時，請在啟動閘道前設定 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 節點上偵錯

iOS 節點使用 `NWBrowser` 探索 `_openclaw-gw._tcp`。

若要擷取日誌：Settings -> Gateway -> Advanced -> **Discovery Debug Logs**，接著前往 Settings -> Gateway -> Advanced -> **Discovery Logs** -> 重現問題 -> **Copy**。日誌包含瀏覽器狀態轉換與結果集變更。

## 何時啟用 Bonjour

在 macOS 主機上以空設定啟動閘道時，Bonjour 會自動啟動，因為本機應用程式與附近的 iOS/Android 節點通常依賴同一區域網路上的探索功能。

當 Linux、Windows 或其他非 macOS 主機適合使用同一區域網路自動探索時，請明確啟用：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 決定要發布多少 TXT 中繼資料；相同模式也會控制廣域 DNS-SD 記錄中的選用 TXT 提示。模式如下：

| 模式                | 行為                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（預設）   | 僅包含核心 TXT 鍵；省略 `sshPort`、`cliPath`、`tailnetDns`。                                                                                                  |
| `full`              | 新增 `sshPort`、`cliPath`、`tailnetDns`——當用戶端需要這些提示時使用。                                                                                         |
| `off`               | 抑制區域網路多播，但不變更外掛的啟用狀態；當 `discovery.wideArea.enabled` 為 true 時，廣域 DNS-SD 仍可發布最小信標。                                           |

## 何時停用 Bonjour

當區域網路多播廣播沒有必要、無法使用或會造成不良影響時，請保持停用 Bonjour——常見情況包括非 macOS 伺服器、Docker 橋接網路、WSL，或會丟棄 mDNS 多播的網路政策。閘道仍可透過其發布的 URL、SSH、Tailnet 或廣域 DNS-SD 存取；只有區域網路自動探索會不可靠。

針對部署範圍的問題，請使用環境變數覆寫（適合 Docker 映像、服務檔案、啟動指令碼與單次偵錯——環境消失後此設定也會消失）：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

若您刻意要為該 OpenClaw 設定關閉隨附的區域網路探索外掛，請使用外掛設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

當未設定 `OPENCLAW_DISABLE_BONJOUR` 時，隨附的 Bonjour 外掛會在偵測到容器環境時自動停用區域網路多播廣播。Docker 橋接網路通常不會在容器與區域網路之間轉送 mDNS 多播（`224.0.0.251:5353`），因此從容器廣播通常無法讓探索功能正常運作。

注意事項：

- Bonjour 在 macOS 主機上會自動啟動，在其他環境則需選擇啟用。保持停用不會停止閘道——只會略過區域網路多播廣播。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設使用 `OPENCLAW_GATEWAY_BIND=lan`，讓發布的主機連接埠可正常運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當閘道與節點不在同一區域網路時，請使用廣域探索或 Tailnet。
- 在 Docker 外重複使用相同的 `OPENCLAW_CONFIG_DIR`，不會保留容器的自動停用政策。
- 僅針對已知可傳遞 mDNS 多播的主機網路、macvlan 或其他網路設定 `OPENCLAW_DISABLE_BONJOUR=0`；設定為 `1` 可強制停用。

## 對已停用的 Bonjour 進行疑難排解

如果設定 Docker 後，節點不再自動探索到閘道：

1. 確認閘道目前是自動、強制開啟或強制關閉模式：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認閘道本身可透過發布的連接埠存取：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 停用 Bonjour 時使用直接目標：
   - 控制介面或本機工具：`http://127.0.0.1:18789`
   - 區域網路用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH 通道或廣域 DNS-SD

4. 如果您刻意在 Docker 中啟用 Bonjour 外掛，並使用 `OPENCLAW_DISABLE_BONJOUR=0` 強制廣播，請從主機測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或閘道日誌顯示 ciao 看門狗重複取消，請恢復設定 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接路由或 Tailnet 路由。

## 常見失敗模式

- **Bonjour 無法跨越網路**：請使用 Tailnet 或 SSH。
- **多播遭封鎖**：部分 Wi-Fi 網路會停用 mDNS。
- **廣告程式卡在探測／宣告階段**：多播遭封鎖的主機、容器橋接網路、WSL 或介面頻繁變動，都可能使 ciao 廣告程式停留在未宣告狀態。OpenClaw 會重試數次，之後便針對目前的閘道程序停用 Bonjour，而不會無限重啟廣告程式。
- **Docker 橋接網路**：在偵測到的容器中，Bonjour 會自動停用。僅限主機網路、macvlan 或其他支援 mDNS 的網路，才應設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠／介面頻繁變動**：macOS 可能暫時遺失 mDNS 結果；請重試。
- **瀏覽有效但解析失敗**：請使用簡單的機器名稱（避免表情符號或標點符號），然後重新啟動閘道。服務執行個體名稱衍生自主機名稱，因此過於複雜的名稱可能會使部分解析器無法正確處理。

## 跳脫的執行個體名稱（`\032`）

Bonjour/DNS-SD 經常將服務執行個體名稱中的位元組跳脫為十進位 `\DDD` 序列（空格會變成 `\032`）。這在通訊協定層級屬於正常現象；使用者介面應解碼後再顯示（iOS 使用 `BonjourEscapes.decode`）。

## 啟用／停用／設定

| 設定                                                 | 效果                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 在預設未啟用的主機上，啟用內建的區域網路探索外掛。                                           |
| `openclaw plugins disable bonjour`                   | 透過停用內建外掛，停用區域網路多播廣告。                                                     |
| `OPENCLAW_DISABLE_BONJOUR=1`（或 `true`/`yes`/`on`） | 不變更外掛設定，直接停用區域網路多播廣告。                                                   |
| `OPENCLAW_DISABLE_BONJOUR=0`（或 `false`/`no`/`off`）| 強制啟用區域網路多播廣告，包括在偵測到的容器內。                                             |
| `discovery.mdns.mode`                                | `off` \| `minimal`（預設）\| `full` — 請參閱上方的模式說明。                                 |
| `gateway.bind`                                       | 控制 `~/.openclaw/openclaw.json` 中的閘道繫結模式。                                          |
| `OPENCLAW_SSH_PORT`                                  | 在廣告 `sshPort` 時覆寫 SSH 連接埠（完整模式）。                                             |
| `OPENCLAW_TAILNET_DNS`                               | 啟用 mDNS 完整模式時，在 TXT 中發布 MagicDNS 提示。                                          |
| `OPENCLAW_CLI_PATH`                                  | 覆寫廣告中的命令列介面路徑（完整模式）。                                                     |

macOS 主機預設會自動啟動內建的區域網路探索外掛。啟用 Bonjour 外掛且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，Bonjour 會在一般主機上進行廣告，並在偵測到的容器（Docker、Fly.io 機器和常見容器執行階段）內自動停用。

## 相關文件

- 探索原則與傳輸方式選擇：[探索](/zh-TW/gateway/discovery)
- 節點配對與核准：[閘道配對](/zh-TW/gateway/pairing)
