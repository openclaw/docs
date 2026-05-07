---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS 應用程式
    - 偵錯 Gateway 探索或畫布命令
summary: iOS 節點應用程式：連線至 Gateway、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-05-07T13:21:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

可用性：內部預覽版。iOS 應用程式尚未公開發行。

## 功能

- 透過 WebSocket 連線到 Gateway（LAN 或 tailnet）。
- 公開 Node 功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報 Node 狀態事件。

## 需求

- Gateway 在另一台裝置上執行（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 位於同一個 LAN，**或**
  - 透過單播 DNS-SD 位於 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動 Gateway：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 應用程式中，開啟設定並選取探索到的 Gateway（或啟用手動主機並輸入主機/連接埠）。

3. 在 Gateway 主機上核准配對請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果應用程式使用變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，
先前的待處理請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

選用：如果 iOS Node 一律從嚴格控管的子網路連線，你可以
選擇使用明確 CIDR 或確切 IP 啟用首次 Node 自動核准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

此功能預設為停用。它只套用於全新的 `role: node` 配對，且
沒有要求任何範圍。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或
公開金鑰變更仍需要手動核准。

4. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方組建的 Relay 支援推播

官方發行的 iOS 組建會使用外部推播 relay，而不是將原始 APNs
權杖發佈到 Gateway。

Gateway 端需求：

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

流程運作方式：

- iOS 應用程式會使用 App Attest 和 StoreKit 應用程式交易 JWS 向 relay 註冊。
- relay 會回傳不透明的 relay 控制代碼，以及註冊範圍的傳送授權。
- iOS 應用程式會擷取已配對的 Gateway 身分，並將其納入 relay 註冊，因此 relay 支援的註冊會委派給該特定 Gateway。
- 應用程式會使用 `push.apns.register` 將該 relay 支援的註冊轉送給已配對的 Gateway。
- Gateway 會將儲存的 relay 控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- Gateway relay 基底 URL 必須符合官方/TestFlight iOS 組建內建的 relay URL。
- 如果應用程式稍後連線到不同的 Gateway，或連線到具有不同 relay 基底 URL 的組建，它會重新整理 relay 註冊，而不是重複使用舊繫結。

此路徑下 Gateway **不**需要的項目：

- 不需要部署範圍的 relay 權杖。
- 不需要官方/TestFlight relay 支援傳送所用的直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方/TestFlight iOS 組建。
2. 在 Gateway 上設定 `gateway.push.apns.relay.baseUrl`。
3. 將應用程式配對到 Gateway，並讓它完成連線。
4. 應用程式在取得 APNs 權杖、操作者工作階段已連線，且 relay 註冊成功後，會自動發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示都可以使用儲存的 relay 支援註冊。

## 背景存活 Beacon

當 iOS 因靜默推播、背景重新整理或重要位置事件而喚醒應用程式時，應用程式
會嘗試短暫重新連線 Node，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。
Gateway 只有在已知已驗證的 Node 裝置身分後，才會將此記錄為已配對 Node/裝置中繼資料上的
`lastSeenAtMs`/`lastSeenReason`。

只有當 Gateway 回應包含 `handled: true` 時，應用程式才會將背景喚醒視為已成功記錄。
較舊的 Gateway 可能會以 `{ "ok": true }` 確認 `node.event`；該回應
相容，但不會算作持久化的最後可見更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為 Gateway 的暫時環境覆寫使用。

## 驗證和信任流程

relay 的存在，是為了強制執行直接在 Gateway 上使用 APNs 無法為
官方 iOS 組建提供的兩項限制：

- 只有透過 Apple 發行的正版 OpenClaw iOS 組建可以使用託管 relay。
- Gateway 只能為已與該特定 Gateway 配對的 iOS 裝置傳送 relay 支援的推播。

逐跳流程：

1. `iOS app -> gateway`
   - 應用程式會先透過一般 Gateway 驗證流程與 Gateway 配對。
   - 這會讓應用程式取得已驗證的 Node 工作階段，以及已驗證的操作者工作階段。
   - 操作者工作階段會用來呼叫 `gateway.identity.get`。

2. `iOS app -> relay`
   - 應用程式會透過 HTTPS 呼叫 relay 註冊端點。
   - 註冊包含 App Attest 證明，以及 StoreKit 應用程式交易 JWS。
   - relay 會驗證 bundle ID、App Attest 證明和 Apple 發行證明，並要求
     官方/正式發行路徑。
   - 這就是阻止本機 Xcode/開發組建使用託管 relay 的機制。本機組建可能已
     簽署，但不符合 relay 預期的官方 Apple 發行證明。

3. `gateway identity delegation`
   - 在 relay 註冊前，應用程式會從 `gateway.identity.get`
     擷取已配對的 Gateway 身分。
   - 應用程式會將該 Gateway 身分納入 relay 註冊承載資料。
   - relay 會回傳 relay 控制代碼，以及委派給
     該 Gateway 身分的註冊範圍傳送授權。

4. `gateway -> relay`
   - Gateway 會儲存來自 `push.apns.register` 的 relay 控制代碼和傳送授權。
   - 在 `push.test`、重新連線喚醒和喚醒提示時，Gateway 會使用
     自己的裝置身分簽署傳送請求。
   - relay 會同時根據註冊時委派的
     Gateway 身分，驗證儲存的傳送授權和 Gateway 簽章。
   - 即使另一個 Gateway 以某種方式取得該控制代碼，也無法重複使用該儲存的註冊。

5. `relay -> APNs`
   - relay 擁有正式 APNs 認證，以及官方組建的原始 APNs 權杖。
   - Gateway 絕不會為 relay 支援的官方組建儲存原始 APNs 權杖。
   - relay 會代表已配對的 Gateway 將最終推播傳送到 APNs。

建立此設計的原因：

- 將正式 APNs 認證排除在使用者 Gateway 之外。
- 避免在 Gateway 上儲存官方組建的原始 APNs 權杖。
- 僅允許官方/TestFlight OpenClaw 組建使用託管 relay。
- 防止某個 Gateway 向屬於不同 Gateway 的 iOS 裝置傳送喚醒推播。

本機/手動組建仍使用直接 APNs。如果你在沒有 relay 的情況下測試這些組建，
Gateway 仍需要直接 APNs 認證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是 Gateway 主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存
App Store Connect / TestFlight 驗證資訊，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不會設定
本機 iOS 組建的直接 APNs 傳遞。

建議的 Gateway 主機儲存方式：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，或將其放在 repo checkout 底下。

## 探索路徑

### Bonjour（LAN）

iOS 應用程式會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定時瀏覽相同的
廣域 DNS-SD 探索網域。同一 LAN 的 Gateway 會自動從 `local.` 顯示；
跨網路探索可以使用設定的廣域網域，而不需變更 Beacon 類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD 區域（選擇一個網域；範例：
`openclaw.internal.`）和 Tailscale split DNS。
請參閱 [Bonjour](/zh-TW/gateway/bonjour) 的 CoreDNS 範例。

### 手動主機/連接埠

在設定中，啟用**手動主機**並輸入 Gateway 主機 + 連接埠（預設 `18789`）。

## Canvas + A2UI

iOS Node 會算繪 WKWebView Canvas。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- Gateway Canvas 主機會提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway HTTP 伺服器提供（與 `gateway.port` 相同的連接埠，預設 `18789`）。
- 當連線時有公告 Canvas 主機 URL，iOS Node 會自動導覽到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## Computer Use 關係

iOS 應用程式是行動 Node 介面，不是 Codex Computer Use 後端。Codex
Computer Use 和 `cua-driver mcp` 會透過 MCP
工具控制本機 macOS 桌面；iOS 應用程式則透過 OpenClaw Node 命令
公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫 Node
命令來操作 iOS 應用程式，但這些呼叫會通過 Gateway Node 通訊協定，並遵循 iOS
前景/背景限制。使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
進行本機桌面控制，並使用本頁了解 iOS Node 功能。

### Canvas eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒和對話模式可在設定中使用。
- 支援對話的 iOS Node 會公告 `talk` 功能，並可宣告
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  Gateway 預設會允許受信任且支援對話的
  Node 使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當應用程式未啟用時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式帶到前景（Canvas/相機/螢幕命令需要前景）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 未公告 Canvas Plugin 介面 URL；請檢查 [Gateway 設定](/zh-TW/gateway/configuration) 中的 `plugins.entries.canvas.config.host`。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已清除；請重新配對 Node。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
