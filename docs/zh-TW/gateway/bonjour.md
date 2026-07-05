---
read_when:
    - 在 macOS/iOS 上偵錯 Bonjour 探索問題
    - 變更 mDNS 服務類型、TXT 記錄或探索使用者體驗
summary: Bonjour/mDNS 探索與偵錯（閘道信標、用戶端與常見失敗模式）
title: Bonjour 探索
x-i18n:
    generated_at: "2026-07-05T11:17:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour（mDNS/DNS-SD）來探索作用中的閘道（WebSocket 端點）。多播 `local.` 瀏覽是**僅限 LAN 的便利功能**：內建的 `bonjour` 外掛負責 LAN 廣告，會在 macOS 主機上自動啟動，並在 Linux、Windows 和容器化閘道部署中採選擇啟用。同一個信標也可以透過已設定的廣域 DNS-SD 網域發布，用於跨網路探索。探索屬於盡力而為，且**不會**取代 SSH 或以 Tailnet 為基礎的連線能力。

## 透過 Tailscale 使用廣域 Bonjour（單播 DNS-SD）

如果節點和閘道位於不同網路，多播 mDNS 無法跨越邊界。請透過 Tailscale 切換到**單播 DNS-SD**（「廣域 Bonjour」），以保留相同的探索使用體驗：

1. 在閘道主機上執行 DNS 伺服器，並讓它可透過 Tailnet 存取。
2. 在專用區域下發布 `_openclaw-gw._tcp` 的 DNS-SD 記錄（範例：`openclaw.internal.`）。
3. 設定 Tailscale **分割 DNS**，讓包含 iOS 在內的用戶端透過該 DNS 伺服器解析你選擇的網域。

上方的 `openclaw.internal.` 只是範例 — OpenClaw 支援任何探索網域。iOS/Android 節點會同時瀏覽 `local.` 和你設定的廣域網域。

### 閘道設定

```json5
{
  gateway: { bind: "tailnet" }, // 僅限 tailnet（建議）
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

未設定時，`discovery.wideArea.domain` 也接受 `OPENCLAW_WIDE_AREA_DOMAIN` 環境變數作為備援。

### 一次性 DNS 伺服器設定（閘道主機，僅限 macOS）

```bash
openclaw dns setup --apply
```

此命令僅限 macOS，且需要 Homebrew 和正在執行的 Tailscale 連線。它會安裝 CoreDNS（`brew install coredns`）並設定為：

- 只在閘道的 Tailscale 介面上監聽連接埠 53
- 從 `~/.openclaw/dns/<domain>.db` 提供你選擇的網域（範例：`openclaw.internal.`）

請先在不加 `--apply` 的情況下執行，以在不安裝任何項目的情況下預覽計畫（網域、區域檔案路徑、偵測到的 Tailnet IP、建議設定）。

從已連上 Tailnet 的機器驗證：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

在 Tailscale 管理主控台中：

- 新增一個指向閘道 Tailnet IP（UDP/TCP 53）的名稱伺服器。
- 新增分割 DNS，讓你的探索網域使用該名稱伺服器。

用戶端接受 Tailnet DNS 後，iOS 節點和命令列介面探索即可在你的探索網域中瀏覽 `_openclaw-gw._tcp`，無需多播。

### 閘道監聽器安全性

閘道 WS 連接埠（預設 `18789`）預設綁定到 loopback。若要供 LAN/Tailnet 存取，請明確綁定並保持驗證啟用。對於僅限 Tailnet 的設定，請在 `~/.openclaw/openclaw.json` 中設定 `gateway.bind: "tailnet"`，然後重新啟動閘道（或 macOS 選單列應用程式）。

## 會廣告的項目

只有閘道會廣告 `_openclaw-gw._tcp`。LAN 多播廣告由啟用時的內建 `bonjour` 外掛提供；廣域 DNS-SD 發布仍由閘道負責。

## 服務類型

- `_openclaw-gw._tcp` - 閘道傳輸信標，供 macOS/iOS/Android 節點使用。

## TXT 鍵（非機密提示）

| 鍵                            | 出現時機                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 一律出現。                                                                     |
| `displayName=<friendly name>` | 一律出現。                                                                     |
| `lanHost=<hostname>.local`    | 一律出現。                                                                     |
| `gatewayPort=<port>`          | 一律出現（閘道 WS + HTTP）。                                                   |
| `transport=gateway`           | 一律出現。                                                                     |
| `gatewayTls=1`                | 只在 TLS 啟用時出現。                                                          |
| `gatewayTlsSha256=<sha256>`   | 只在 TLS 啟用且有可用指紋時出現。                                              |
| `gatewayDirectReachable=1`    | 只在閘道可直接存取時出現（而非只能透過轉送/代理路徑）。                       |
| `canvasPort=<port>`           | 只在畫布主機啟用時出現；目前與 `gatewayPort` 相同。                            |
| `tailnetDns=<magicdns>`       | 僅限 mDNS 完整模式；Tailnet 可用時的選用提示。                                 |
| `sshPort=<port>`              | 僅限完整模式；在最小和關閉模式中省略。                                         |
| `cliPath=<path>`              | 僅限完整模式；在最小和關閉模式中省略。                                         |

安全性注意事項：

- Bonjour/mDNS TXT 記錄**未經驗證**。用戶端不得將 TXT 視為具權威性的路由資訊。
- 用戶端應使用解析出的服務端點（SRV + A/AAAA）進行路由。請只將 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 視為提示。
- SSH 自動目標選擇同樣應使用解析出的服務主機，而非僅使用 TXT 提示。
- TLS 釘選絕不能讓廣告的 `gatewayTlsSha256` 覆寫先前儲存的釘選。
- iOS/Android 節點應將以探索為基礎的直接連線視為**僅限 TLS**，並在信任首次出現的指紋前要求使用者明確確認。

## 在 macOS 上偵錯

內建工具：

```bash
# 瀏覽執行個體
dns-sd -B _openclaw-gw._tcp local.

# 解析一個執行個體（取代 <instance>）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

如果可以瀏覽但解析失敗，通常是遇到 LAN 政策或 mDNS 解析器問題。

## 在閘道日誌中偵錯

閘道會寫入輪替日誌檔（啟動時會印出為 `gateway log file: ...`）。尋找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

看門狗會將作用中的 `probing`、`announcing` 和新的衝突重新命名視為進行中狀態。如果服務一直未達到 `announced`，OpenClaw 會重新建立廣告器，並在重複失敗後停用該閘道程序的 Bonjour，而不是永遠重新廣告。

Bonjour 會在系統主機名稱是有效 DNS 標籤時，將其用於廣告的 `.local` 主機。如果系統主機名稱包含空格、底線或其他無效的 DNS 標籤字元，OpenClaw 會退回使用 `openclaw.local`。若需要明確的主機標籤，請在啟動閘道前設定 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 節點上偵錯

iOS 節點使用 `NWBrowser` 來探索 `_openclaw-gw._tcp`。

若要擷取日誌：設定 -> 閘道 -> 進階 -> **探索偵錯日誌**，然後設定 -> 閘道 -> 進階 -> **探索日誌** -> 重現 -> **複製**。日誌包含瀏覽器狀態轉換和結果集變更。

## 何時啟用 Bonjour

在 macOS 主機上以空設定啟動閘道時，Bonjour 會自動啟動，因為本機應用程式和附近的 iOS/Android 節點通常依賴同一 LAN 探索。

當同一 LAN 自動探索在 Linux、Windows 或其他非 macOS 主機上有用時，請明確啟用它：

```bash
openclaw plugins enable bonjour
```

啟用後，Bonjour 會使用 `discovery.mdns.mode` 來決定要發布多少 TXT 中繼資料；同一模式也會控制廣域 DNS-SD 記錄中的選用 TXT 提示。模式：

| 模式                | 行為                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（預設）   | 只有核心 TXT 鍵；省略 `sshPort`、`cliPath`、`tailnetDns`。                                                                                                    |
| `full`              | 新增 `sshPort`、`cliPath`、`tailnetDns` — 在用戶端需要這些提示時使用。                                                                                        |
| `off`               | 在不變更外掛啟用狀態的情況下抑制 LAN 多播；當 `discovery.wideArea.enabled` 為 true 時，廣域 DNS-SD 仍可發布最小信標。                                         |

## 何時停用 Bonjour

當 LAN 多播廣告不必要、不可用或有害時，請保持 Bonjour 停用 — 常見情況包括非 macOS 伺服器、Docker 橋接網路、WSL，或會丟棄 mDNS 多播的網路政策。閘道仍可透過其發布的 URL、SSH、Tailnet 或廣域 DNS-SD 存取；只有 LAN 自動探索不可靠。

對於部署範圍的問題，請使用環境變數覆寫（適用於 Docker 映像、服務檔案、啟動指令碼、一次性偵錯 — 環境消失時它也會消失）：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

當你刻意想為該 OpenClaw 設定關閉內建 LAN 探索外掛時，請使用外掛設定：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事項

在偵測到容器且 `OPENCLAW_DISABLE_BONJOUR` 未設定時，內建 Bonjour 外掛會自動停用 LAN 多播廣告。Docker 橋接網路通常不會在容器和 LAN 之間轉送 mDNS 多播（`224.0.0.251:5353`），因此從容器廣告很少能讓探索正常運作。

注意事項：

- Bonjour 會在 macOS 主機上自動啟動，其他平台則採選擇啟用。保持停用不會停止閘道 — 只會略過 LAN 多播廣告。
- 停用 Bonjour 不會變更 `gateway.bind`；Docker 仍預設為 `OPENCLAW_GATEWAY_BIND=lan`，讓發布的主機連接埠可正常運作。
- 停用 Bonjour 不會停用廣域 DNS-SD。當閘道和節點不在同一 LAN 時，請使用廣域探索或 Tailnet。
- 在 Docker 外重複使用相同的 `OPENCLAW_CONFIG_DIR` 不會保留容器自動停用政策。
- 只有在主機網路、macvlan，或其他已知 mDNS 多播可通過的網路中，才設定 `OPENCLAW_DISABLE_BONJOUR=0`；設定為 `1` 可強制停用。

## 疑難排解已停用的 Bonjour

如果節點在 Docker 設定後不再自動探索閘道：

1. 確認閘道目前是在自動、強制開啟或強制關閉模式中執行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 確認閘道本身可透過發布的連接埠存取：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 當 Bonjour 停用時，請使用直接目標：
   - 控制 UI 或本機工具：`http://127.0.0.1:18789`
   - LAN 用戶端：`http://<gateway-host>:18789`
   - 跨網路用戶端：Tailnet MagicDNS、Tailnet IP、SSH 通道或廣域 DNS-SD

4. 如果你刻意在 Docker 中啟用 Bonjour 外掛，並使用 `OPENCLAW_DISABLE_BONJOUR=0` 強制廣告，請從主機測試多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果瀏覽結果為空，或閘道日誌顯示重複的 ciao 看門狗取消，請還原為 `OPENCLAW_DISABLE_BONJOUR=1`，並使用直接路由或 Tailnet 路由。

## 常見失敗模式

- **Bonjour 不會跨越網路**：使用 Tailnet 或 SSH。
- **多播被封鎖**：某些 Wi-Fi 網路會停用 mDNS。
- **廣告器卡在探測/宣告中**：多播被封鎖的主機、容器橋接、WSL 或介面變動，可能讓 ciao 廣告器停留在未宣告狀態。OpenClaw 會重試幾次，然後針對目前的閘道程序停用 Bonjour，而不是永遠重新啟動廣告器。
- **Docker 橋接網路**：在偵測到的容器中，Bonjour 會自動停用。只有在主機、macvlan 或其他支援 mDNS 的網路上，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠/介面變動**：macOS 可能會暫時遺失 mDNS 結果；請重試。
- **瀏覽可用但解析失敗**：保持機器名稱簡單（避免表情符號或標點符號），然後重新啟動閘道。服務執行個體名稱衍生自主機名稱，因此過於複雜的名稱可能會讓某些解析器混淆。

## 跳脫的執行個體名稱（`\032`）

Bonjour/DNS-SD 經常會將服務執行個體名稱中的位元組跳脫為十進位 `\DDD` 序列（空格會變成 `\032`）。這在協定層級是正常現象；使用者介面應解碼後再顯示（iOS 使用 `BonjourEscapes.decode`）。

## 啟用 / 停用 / 設定

| 設定                                                 | 效果                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 在未預設啟用的主機上啟用內建區域網路探索外掛。                                  |
| `openclaw plugins disable bonjour`                   | 透過停用內建外掛來停用區域網路多播廣告。                                         |
| `OPENCLAW_DISABLE_BONJOUR=1`（或 `true`/`yes`/`on`） | 停用區域網路多播廣告，且不變更外掛設定。                                         |
| `OPENCLAW_DISABLE_BONJOUR=0`（或 `false`/`no`/`off`） | 強制開啟區域網路多播廣告，包括在偵測到的容器內。                                |
| `discovery.mdns.mode`                                | `off` \| `minimal`（預設）\| `full` — 請參閱上方模式。                           |
| `gateway.bind`                                       | 控制 `~/.openclaw/openclaw.json` 中的閘道綁定模式。                               |
| `OPENCLAW_SSH_PORT`                                  | 在廣告 `sshPort` 時覆寫 SSH 連接埠（完整模式）。                                 |
| `OPENCLAW_TAILNET_DNS`                               | 啟用 mDNS 完整模式時，在 TXT 中發布 MagicDNS 提示。                              |
| `OPENCLAW_CLI_PATH`                                  | 覆寫廣告的命令列介面路徑（完整模式）。                                           |

macOS 主機預設會自動啟動內建區域網路探索外掛。啟用 Bonjour 外掛且未設定 `OPENCLAW_DISABLE_BONJOUR` 時，Bonjour 會在一般主機上廣告，並在偵測到的容器內自動停用（Docker、Fly.io machines，以及常見容器執行環境）。

## 相關文件

- 探索政策與傳輸選擇：[探索](/zh-TW/gateway/discovery)
- 節點配對 + 核准：[閘道配對](/zh-TW/gateway/pairing)
