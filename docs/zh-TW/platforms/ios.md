---
read_when:
    - 配對或重新連線 iOS Node
    - 從原始碼執行 iOS 應用程式
    - 偵錯 Gateway 探索或畫布命令
summary: iOS 節點應用程式：連線至 Gateway、配對、畫布和疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-05-06T02:52:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

可用性：內部預覽。iOS app 尚未公開發行。

## 功能

- 透過 WebSocket 連線到 Gateway（LAN 或 tailnet）。
- 公開 Node 功能：Canvas、螢幕快照、相機擷取、位置、通話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報 Node 狀態事件。

## 需求

- Gateway 在另一部裝置上執行（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用同一個 LAN，**或**
  - 透過單點傳播 DNS-SD 使用 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備用）。

## 快速開始（配對 + 連線）

1. 啟動 Gateway：

```bash
openclaw gateway --port 18789
```

2. 在 iOS app 中，開啟設定並選取偵測到的 gateway（或啟用手動主機並輸入主機/連接埠）。

3. 在 gateway 主機上核准配對要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，
先前待處理的要求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

選用：如果 iOS Node 永遠從嚴格控管的子網路連線，你可以
使用明確的 CIDR 或精確 IP 選擇啟用首次 Node 自動核准：

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

預設為停用。這只適用於全新的 `role: node` 配對，且
未要求任何範圍。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或
公開金鑰變更，仍需要手動核准。

4. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方建置的中繼支援推播

官方發行的 iOS 建置會使用外部推播中繼服務，而不是將原始 APNs
權杖發布到 gateway。

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

- iOS app 使用 App Attest 和 StoreKit app transaction JWS 向中繼服務註冊。
- 中繼服務會回傳不透明的中繼控制代碼，以及以註冊為範圍的傳送授權。
- iOS app 會擷取已配對的 gateway 身分，並將其包含在中繼註冊中，因此中繼支援的註冊會委派給該特定 gateway。
- app 會透過 `push.apns.register` 將該中繼支援的註冊轉送給已配對的 gateway。
- gateway 會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- Gateway 中繼基底 URL 必須符合官方/TestFlight iOS 建置中內建的中繼 URL。
- 如果 app 之後連線到不同 gateway，或連線到具有不同中繼基底 URL 的建置，它會重新整理中繼註冊，而不是重複使用舊的繫結。

這個路徑中 gateway **不**需要的項目：

- 不需要部署範圍的中繼權杖。
- 官方/TestFlight 中繼支援傳送不需要直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方/TestFlight iOS 建置。
2. 在 gateway 上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 app 與 gateway 配對，並讓它完成連線。
4. app 取得 APNs 權杖、操作者工作階段已連線，且中繼註冊成功後，會自動發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示都可以使用已儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件喚醒 app 時，app
會嘗試短暫重新連線 Node，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。
只有在已知已驗證的 Node 裝置身分後，gateway 才會將此記錄為已配對 Node/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當 gateway 回應包含 `handled: true` 時，app 才會將背景喚醒視為已成功記錄。
較舊的 gateway 可能會以 `{ "ok": true }` 確認 `node.event`；該回應
相容，但不會計為持久的最後可見更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為 gateway 的臨時環境覆寫使用。

## 驗證與信任流程

中繼服務的存在，是為了強制執行直接在 gateway 上使用 APNs 對
官方 iOS 建置無法提供的兩項限制：

- 只有透過 Apple 發行的正版 OpenClaw iOS 建置可以使用託管中繼服務。
- gateway 只能對與該特定 gateway 配對的 iOS 裝置傳送中繼支援推播。

逐段流程：

1. `iOS app -> gateway`
   - app 會先透過一般 Gateway 驗證流程與 gateway 配對。
   - 這會為 app 提供已驗證的 Node 工作階段，以及已驗證的操作者工作階段。
   - 操作者工作階段用於呼叫 `gateway.identity.get`。

2. `iOS app -> relay`
   - app 透過 HTTPS 呼叫中繼註冊端點。
   - 註冊包含 App Attest 證明，以及 StoreKit app transaction JWS。
   - 中繼服務會驗證 bundle ID、App Attest 證明和 Apple 發行證明，並要求
     官方/正式發行路徑。
   - 這就是阻止本機 Xcode/開發建置使用託管中繼服務的機制。本機建置可以被
     簽署，但它不符合中繼服務預期的官方 Apple 發行證明。

3. `gateway identity delegation`
   - 在中繼註冊之前，app 會從 `gateway.identity.get`
     擷取已配對的 gateway 身分。
   - app 會在中繼註冊承載中包含該 gateway 身分。
   - 中繼服務會回傳中繼控制代碼，以及委派給
     該 gateway 身分、以註冊為範圍的傳送授權。

4. `gateway -> relay`
   - gateway 會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。
   - 在 `push.test`、重新連線喚醒和喚醒提示時，gateway 會使用自己的
     裝置身分簽署傳送要求。
   - 中繼服務會根據註冊中委派的
     gateway 身分，同時驗證已儲存的傳送授權和 gateway 簽章。
   - 即使另一個 gateway 以某種方式取得控制代碼，也無法重複使用該儲存的註冊。

5. `relay -> APNs`
   - 中繼服務擁有正式 APNs 認證，以及官方建置的原始 APNs 權杖。
   - gateway 永遠不會為中繼支援的官方建置儲存原始 APNs 權杖。
   - 中繼服務會代表已配對的 gateway 將最終推播傳送到 APNs。

此設計的建立原因：

- 讓正式 APNs 認證不進入使用者 gateway。
- 避免在 gateway 上儲存官方建置的原始 APNs 權杖。
- 僅允許官方/TestFlight OpenClaw 建置使用託管中繼服務。
- 防止某個 gateway 對屬於不同 gateway 的 iOS 裝置傳送喚醒推播。

本機/手動建置仍使用直接 APNs。如果你在沒有中繼服務的情況下測試那些建置，
gateway 仍需要直接 APNs 認證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是 gateway 主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存
App Store Connect / TestFlight 驗證，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不會設定
本機 iOS 建置的直接 APNs 傳遞。

建議的 gateway 主機儲存方式：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 檔案，也不要將它放在 repo checkout 底下。

## 探索路徑

### Bonjour（LAN）

iOS app 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定時瀏覽相同的
廣域 DNS-SD 探索網域。同一 LAN 的 gateway 會自動從 `local.` 出現；
跨網路探索可以使用設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；範例：
`openclaw.internal.`）和 Tailscale 分割 DNS。
請參閱 [Bonjour](/zh-TW/gateway/bonjour) 的 CoreDNS 範例。

### 手動主機/連接埠

在設定中，啟用**手動主機**並輸入 gateway 主機 + 連接埠（預設 `18789`）。

## Canvas + A2UI

iOS Node 會呈現 WKWebView canvas。使用 `node.invoke` 來驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- Gateway canvas 主機會提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway HTTP 伺服器提供（與 `gateway.port` 相同的連接埠，預設 `18789`）。
- 當有宣告 canvas 主機 URL 時，iOS Node 會在連線時自動導覽到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建骨架。

## Computer Use 關係

iOS app 是行動 Node 介面，不是 Codex Computer Use 後端。Codex
Computer Use 和 `cua-driver mcp` 會透過 MCP
工具控制本機 macOS 桌面；iOS app 則透過 OpenClaw Node 命令公開 iPhone 功能，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍然可以透過 OpenClaw 呼叫 Node
命令來操作 iOS app，但那些呼叫會經過 gateway Node 協定，並遵循 iOS
前景/背景限制。請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
進行本機桌面控制，並使用本頁了解 iOS Node 功能。

### Canvas eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 通話模式

- 語音喚醒和通話模式可在設定中使用。
- 支援通話的 iOS Node 會宣告 `talk` 功能，並可宣告
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  Gateway 預設允許受信任、
  支援通話的 Node 使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當 app 未處於作用中狀態時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS app 帶到前景（canvas/相機/螢幕命令需要它）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 未宣告 canvas 主機 URL；請檢查 [Gateway 設定](/zh-TW/gateway/configuration) 中的 `canvasHost`。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已清除；請重新配對 Node。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
