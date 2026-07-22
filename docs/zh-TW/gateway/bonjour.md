---
read_when:
    - 在 macOS/iOS 上偵錯 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索使用者體驗
summary: Bonjour/mDNS 探索與偵錯（閘道信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-07-22T10:32:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f43ef71b323b59362655c390a4df621c2571abbe3b2c1cd2728918c6f76d6f99
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour (mDNS/DNS-SD) 探索作用中的閘道 (WebSocket 端點)。多播 `local.` 瀏覽是**僅限區域網路的便利功能**：隨附的 `bonjour` 外掛負責區域網路廣告，會在 macOS 主機上自動啟動，而在 Linux、Windows 和容器化閘道部署上則須選擇啟用。同一個信標也能透過已設定的廣域 DNS-SD 網域發布，以供跨網路探索。探索功能採盡力而為，**不能**取代以 SSH 或 Tailnet 為基礎的連線方式。

## 透過 Tailscale 使用廣域 Bonjour (單播 DNS-SD)

如果節點和閘道位於不同網路，多播 mDNS 無法跨越網路邊界。可透過 Tailscale 改用**單播 DNS-SD** (“廣域 Bonjour”)，以維持相同的探索使用體驗：

1. 在閘道主機上執行可透過 Tailnet 存取的 DNS 伺服器。
2. 在專用區域下發布 `_openclaw-gw._tcp` 的 DNS-SD 記錄（例如：`openclaw.internal.`）。
3. 設定 Tailscale **分割 DNS**，讓用戶端（包括 iOS）透過該 DNS 伺服器解析你選擇的網域。

上述 `openclaw.internal.` 只是範例 — OpenClaw 支援任何探索網域。iOS/Android 節點會同時瀏覽 `local.` 和你設定的廣域網域。

### 閘道設定

```json5
{
  gateway: { bind: "tailnet" }, // 僅限 tailnet（建議）
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

未設定時，`discovery.wideArea.domain` 也接受 `OPENCLAW_WIDE_AREA_DOMAIN` 環境變數作為後備設定。

### 一次性 DNS 伺服器設定（閘道主機，僅限 macOS）

```bash
openclaw dns setup --apply
```

此命令僅適用於 macOS，且需要 Homebrew 和作用中的 Tailscale 連線。它會安裝 CoreDNS (`brew install coredns`)，並將其設定為：

- 僅在閘道的 Tailscale 介面上監聽連接埠 53
- 從 `~/.openclaw/dns/<domain>.db` 提供你選擇的網域（例如：`openclaw.internal.`）

請先在不使用 `--apply` 的情況下執行，以預覽方案（網域、區域檔案路徑、偵測到的 Tailnet IP、建議設定），而不安裝任何項目。

從已連線至 Tailnet 的機器驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理控制台中：

- 新增指向閘道 Tailnet IP 的名稱伺服器（UDP/TCP 53）。
- 新增分割 DNS，讓你的探索網域使用該名稱伺服器。

用戶端接受 Tailnet DNS 後，iOS 節點和命令列介面探索功能即可在你的探索網域中瀏覽 `_openclaw-gw._tcp`，無須使用多播。

### 閘道監聽器安全性

閘道 WS 連接埠（預設為 `18789`）預設繫結至回送介面。若要透過區域網路/Tailnet 存取，請明確繫結並保持啟用驗證。若設定為僅限 Tailnet，請在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`，然後重新啟動閘道（或 macOS 選單列應用程式）。

## 廣告內容

只有閘道會廣告 `_openclaw-gw._tcp`。啟用後，區域網路多播廣告由隨附的 `bonjour` 外掛提供；廣域 DNS-SD 發布仍由閘道負責。

## 服務類型

- `_openclaw-gw._tcp` - 閘道傳輸信標，供 macOS/iOS/Android 節點使用。

## TXT 鍵（非機密提示）

| 鍵                           | 出現時機                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 一律出現。                                                                        |
| `displayName=<friendly name>` | 一律出現。                                                                        |
| `lanHost=<hostname>.local`    | 一律出現。                                                                        |
| `gatewayPort=<port>`          | 一律出現（閘道 WS + HTTP）。                                                    |
| `transport=gateway`           | 一律出現。                                                                        |
| `gatewayTls=1`                | 僅在啟用 TLS 時出現。                                                      |
| `gatewayTlsSha256=<sha256>`   | 僅在啟用 TLS 且有可用指紋時出現。                       |
| `gatewayDirectReachable=1`    | 僅在可直接連線至閘道時出現（而非只能透過中繼/Proxy 路徑連線）。 |
| `canvasPort=<port>`           | 僅在啟用畫布主機時出現；目前與 `gatewayPort` 相同。     |
| `tailnetDns=<magicdns>`       | 僅限 mDNS 完整模式；Tailnet 可用時的選用提示。                  |
| `sshPort=<port>`              | 僅限完整模式；在最小模式和關閉模式中省略。                              |
| `cliPath=<path>`              | 僅限完整模式；在最小模式和關閉模式中省略。                              |

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端不得將 TXT 視為具權威性的路由資訊。
- 用戶端應使用解析後的服務端點 (SRV + A/AAAA) 進行路由。請僅將 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 視為提示。
- SSH 自動選定目標也應使用解析後的服務主機，而非僅使用 TXT 提示。
- TLS 固定不得讓廣告的 `gatewayTlsSha256` 覆寫先前儲存的固定值。
- iOS/Android 節點應將基於探索的直接連線視為**僅限 TLS**，並在信任首次出現的指紋前要求使用者明確確認。

## 在 macOS 上進行偵錯

內建工具：

```bash
# 瀏覽執行個體
dns-sd -B _openclaw-gw._tcp local.

# 解析一個執行個體（取代 <instance>）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

如果瀏覽正常但解析失敗，通常是區域網路原則或 mDNS 解析程式發生問題。

## 在閘道日誌中進行偵錯

閘道會寫入輪替日誌檔案（啟動時會顯示為 `gateway log file: ...`）。請尋找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw 只會啟動每個 Bonjour 服務一次，並將探測、重試、名稱衝突解決及介面變更後重新發布交由 mDNS 回應程式處理。這可避免正常網路變動期間出現重疊的發布嘗試。重複的內部自我探測訊息會受到抑制，避免大量湧入閘道日誌。

當同一主機有多個 OpenClaw 閘道進行廣告時，Bonjour 可能會附加 `(2)` 或 `(3)` 等後綴，以確保服務執行個體名稱唯一。這些後綴是正常的衝突解決機制，並不表示有重複的 OCM 監管。

當系統主機名稱是有效的 DNS 標籤時，Bonjour 會使用該名稱作為廣告的 `.local` 主機。如果系統主機名稱包含空格、底線或其他無效的 DNS 標籤字元，OpenClaw 會改用 `openclaw.local`。若需要明確的主機標籤，請在啟動閘道前設定 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 節點上進行偵錯

iOS 節點使用 `NWBrowser` 探索 `_openclaw-gw._tcp`。

若要擷取日誌：Settings -> Gateway -> Advanced -> **Discovery Debug Logs**，接著前往 Settings -> Gateway -> Advanced -> **Discovery Logs** -> 重現問題 -> **Copy**。日誌包含瀏覽器狀態轉換和結果集變更。

## 何時啟用 Bonjour

在 macOS 主機上以空白設定啟動閘道時，Bonjour 會自動啟動，因為本機應用程式和附近的 iOS/Android 節點通常依賴同一區域網路探索。

在 Linux、Windows 或其他非 macOS 主機上，若同一區域網路自動探索實用，請明確啟用：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 決定要發布多少 TXT 中繼資料；相同模式也會控制廣域 DNS-SD 記錄中的選用 TXT 提示。模式：

| 模式                | 行為                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（預設） | 僅限核心 TXT 鍵；省略 `sshPort`、`cliPath`、`tailnetDns`。                                                                            |
| `full`              | 新增 `sshPort`、`cliPath`、`tailnetDns` — 在用戶端需要這些提示時使用。                                                             |
| `off`               | 抑制區域網路多播，但不變更外掛啟用狀態；設定 `discovery.wideArea.domain` 時，廣域 DNS-SD 仍可發布。 |

## 何時停用 Bonjour

當區域網路多播廣告不必要、無法使用或會造成不良影響時，請讓 Bonjour 保持停用 — 常見情況包括非 macOS 伺服器、Docker 橋接網路、WSL，或會捨棄 mDNS 多播的網路原則。仍可透過發布的 URL、SSH、Tailnet 或廣域 DNS-SD 存取閘道；只有區域網路自動探索不可靠。

針對部署範圍的問題，請使用環境變數覆寫（適用於 Docker 映像檔、服務檔案、啟動指令碼及一次性偵錯 — 當環境消失時，設定也會隨之消失）：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

若你刻意要針對該 OpenClaw 設定關閉隨附的區域網路探索外掛，請使用外掛設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

偵測到容器且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，隨附的 Bonjour 外掛會自動停用區域網路多播廣告。Docker 橋接網路通常不會在容器與區域網路之間轉送 mDNS 多播 (`224.0.0.251:5353`)；因此，從容器進行廣告很少能讓探索功能正常運作。

注意事項：

- Bonjour 會在 macOS 主機上自動啟動，在其他平台則須選擇啟用。保持停用不會停止閘道 — 只會略過區域網路多播廣告。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設使用 `OPENCLAW_GATEWAY_BIND=lan`，因此發布的主機連接埠可以運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當閘道和節點不在同一區域網路時，請使用廣域探索或 Tailnet。
- 在 Docker 外部重複使用相同的 `OPENCLAW_CONFIG_DIR`，不會保留容器的自動停用原則。
- 只有在主機網路、macvlan 或其他已知可傳遞 mDNS 多播的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`；將其設為 `1` 可強制停用。

## 對已停用的 Bonjour 進行疑難排解

如果 Docker 設定完成後，節點不再自動探索到閘道：

1. 確認閘道目前以自動、強制啟用或強制停用模式執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認可透過發布的連接埠存取閘道本身：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 停用 Bonjour 時，請使用直接目標：
   - 控制介面或本機工具：`http://127.0.0.1:18789`
   - 區域網路用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH 通道或廣域 DNS-SD

4. 如果你刻意在 Docker 中啟用 Bonjour 外掛，並使用 `OPENCLAW_DISABLE_BONJOUR=0` 強制進行廣告，請從主機測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或閘道日誌顯示重複的 ciao 探測失敗，請還原 `OPENCLAW_DISABLE_BONJOUR=1`，並改用直接路由或 Tailnet 路由。

## 常見失敗模式

- **Bonjour 無法跨越網路**：請使用 Tailnet 或 SSH。
- **多點傳播遭封鎖**：部分 Wi-Fi 網路會停用 mDNS。
- **廣告器卡在探測／宣告狀態**：多點傳播遭封鎖的主機、容器橋接網路、WSL 或網路介面頻繁變動，可能使回應器停留在未宣告狀態。仍可透過直接連線、SSH、Tailnet 或廣域 DNS-SD 路由使用閘道；無法使用多點傳播時，請使用 `discovery.mdns.mode: "off"` 或 `OPENCLAW_DISABLE_BONJOUR=1` 停用區域網路 Bonjour。
- **Docker 橋接網路**：在偵測到的容器中，Bonjour 會自動停用。僅針對主機、macvlan 或其他支援 mDNS 的網路設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠／網路介面頻繁變動**：macOS 可能會暫時無法取得 mDNS 結果；請重試。
- **瀏覽正常但解析失敗**：請使用簡單的機器名稱（避免表情符號或標點符號），然後重新啟動閘道。服務執行個體名稱衍生自主機名稱，因此過於複雜的名稱可能會使部分解析器無法正確處理。

## 跳脫的執行個體名稱（`\032`）

Bonjour/DNS-SD 通常會將服務執行個體名稱中的位元組跳脫為十進位 `\DDD` 序列（空格會變成 `\032`）。這在通訊協定層級屬於正常現象；使用者介面應先解碼再顯示（iOS 使用 `BonjourEscapes.decode`）。

## 啟用／停用／設定

| 設定                                              | 效果                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 在預設未啟用的主機上啟用隨附的區域網路探索外掛。 |
| `openclaw plugins disable bonjour`                   | 透過停用隨附的外掛，停用區域網路多點傳播廣告。               |
| `OPENCLAW_DISABLE_BONJOUR=1`（或 `true`/`yes`/`on`）  | 在不變更外掛設定的情況下，停用區域網路多點傳播廣告。                |
| `OPENCLAW_DISABLE_BONJOUR=0`（或 `false`/`no`/`off`） | 強制啟用區域網路多點傳播廣告，包括在偵測到的容器內。        |
| `discovery.mdns.mode`                                | `off` \| `minimal`（預設）\| `full` — 請參閱上述模式。                         |
| `gateway.bind`                                       | 控制 `~/.openclaw/openclaw.json` 中的閘道繫結模式。                    |
| `OPENCLAW_SSH_PORT`                                  | 在廣告 `sshPort` 時覆寫 SSH 連接埠（完整模式）。                  |
| `OPENCLAW_TAILNET_DNS`                               | 啟用 mDNS 完整模式時，在 TXT 中發布 MagicDNS 提示。                  |
| `OPENCLAW_CLI_PATH`                                  | 覆寫廣告的命令列介面路徑（完整模式）。                                    |

macOS 主機預設會自動啟動隨附的區域網路探索外掛。啟用 Bonjour 外掛且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，Bonjour 會在一般主機上發布廣告，並在偵測到的容器（Docker、Fly.io 機器及常見容器執行環境）內自動停用。

## 相關文件

- 探索原則與傳輸方式選擇：[探索](/zh-TW/gateway/discovery)
- 節點配對與核准：[閘道配對](/zh-TW/gateway/pairing)
