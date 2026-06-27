---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS 應用程式
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連接至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-06-27T19:31:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個發行版本時，iPhone app 組建會透過 Apple 管道發佈。本機開發組建也可以從原始碼執行。

## 功能

- 透過 WebSocket（LAN 或 tailnet）連線到閘道。
- 公開節點能力：畫布、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。

## 需求

- 在另一台裝置上執行的閘道（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 位於同一 LAN，**或**
  - 透過單播 DNS-SD 位於 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動閘道：

```bash
openclaw gateway --port 18789
```

2. 在 iOS app 中，開啟設定並選擇探索到的閘道（或啟用手動主機並輸入主機/連接埠）。

3. 在閘道主機上核准配對請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，
先前待處理的請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格控管的子網路連線，你可以
使用明確的 CIDR 或精確 IP，選擇啟用首次節點自動核准：

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

此功能預設為停用。它只適用於全新的 `role: node` 配對，且
未請求任何範圍。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或
公開金鑰變更，仍需要手動核准。

4. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方組建的中繼支援推播

官方發佈的 iOS 組建會使用外部推播中繼，而不是將原始 APNs
權杖發佈到閘道。

來自公開 App Store 發行通道的官方/TestFlight 組建會使用託管中繼 `https://ios-push-relay.openclaw.ai`。

自訂中繼部署需要刻意分離的 iOS 組建/部署路徑，其 中繼 URL 必須與閘道中繼 URL 相符。公開 App Store 發行通道不接受自訂中繼 URL 覆寫。如果你使用自訂中繼組建，請設定相符的閘道中繼 URL：

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

- iOS app 使用 App Attest 和 StoreKit app transaction JWS 向中繼註冊。
- 中繼會回傳不透明的中繼控制代碼，以及以註冊為範圍的傳送授權。
- iOS app 會擷取已配對的閘道身分，並將其納入中繼註冊，因此中繼支援的註冊會委派給該特定閘道。
- app 會使用 `push.apns.register` 將該中繼支援的註冊轉送給已配對的閘道。
- 閘道會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 自訂閘道中繼 URL 必須符合烘焙進 iOS 組建的中繼 URL。
- 如果 app 稍後連線到不同閘道，或連線到具有不同中繼基底 URL 的組建，它會重新整理中繼註冊，而不是重複使用舊繫結。

此路徑中，閘道**不**需要：

- 不需要部署範圍的中繼權杖。
- 官方/TestFlight 中繼支援傳送不需要直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方/TestFlight iOS 組建。
2. 選用：只有在使用刻意分離的自訂中繼組建時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 app 與閘道配對，並讓它完成連線。
4. 當 app 取得 APNs 權杖、操作者工作階段已連線，且中繼註冊成功後，app 會自動發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示即可使用儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件喚醒 app 時，app
會嘗試短暫重新連線節點，然後呼叫 `node.event`，並帶上 `event: "node.presence.alive"`。
只有在已知經驗證的節點裝置身分後，閘道才會將此記錄為已配對節點/裝置中繼資料上的
`lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，app 才會將背景喚醒視為已成功記錄。
較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應
相容，但不會算作持久的最後看見時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的臨時環境覆寫使用。
- 公開 App Store 發行通道會拒絕 iOS 組建的 `OPENCLAW_PUSH_RELAY_BASE_URL`。

## 驗證與信任流程

中繼的存在，是為了執行官方 iOS 組建中由閘道直接連 APNs 無法提供的
兩項限制：

- 只有透過 Apple 發佈的正版 OpenClaw iOS 組建可以使用託管中繼。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼支援推播。

逐段說明：

1. `iOS app -> gateway`
   - app 先透過一般閘道驗證流程與閘道配對。
   - 這會給 app 一個經驗證的節點工作階段，以及一個經驗證的操作者工作階段。
   - 操作者工作階段用於呼叫 `gateway.identity.get`。

2. `iOS app -> relay`
   - app 透過 HTTPS 呼叫中繼註冊端點。
   - 註冊包含 App Attest 證明，以及 StoreKit app transaction JWS。
   - 中繼會驗證 bundle ID、App Attest 證明和 Apple 發佈證明，並要求
     官方/正式發佈路徑。
   - 這就是阻擋本機 Xcode/開發組建使用託管中繼的機制。本機組建可能已簽署，
     但它不符合中繼預期的官方 Apple 發佈證明。

3. `gateway identity delegation`
   - 在中繼註冊前，app 會從
     `gateway.identity.get` 擷取已配對的閘道身分。
   - app 會將該閘道身分納入中繼註冊承載。
   - 中繼會回傳中繼控制代碼，以及委派給
     該閘道身分、以註冊為範圍的傳送授權。

4. `gateway -> relay`
   - 閘道會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。
   - 在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的
     裝置身分簽署傳送請求。
   - 中繼會對照註冊時委派的閘道身分，驗證儲存的傳送授權和閘道簽章。
   - 即使另一個閘道以某種方式取得該控制代碼，也無法重複使用該儲存的註冊。

5. `relay -> APNs`
   - 中繼持有正式 APNs 憑證，以及官方組建的原始 APNs 權杖。
   - 對於中繼支援的官方組建，閘道永遠不會儲存原始 APNs 權杖。
   - 中繼會代表已配對的閘道，將最終推播傳送到 APNs。

建立此設計的原因：

- 讓正式 APNs 憑證不進入使用者閘道。
- 避免在閘道上儲存官方組建的原始 APNs 權杖。
- 只允許官方/TestFlight OpenClaw 組建使用託管中繼。
- 防止某個閘道向屬於不同閘道的 iOS 裝置傳送喚醒推播。

本機/手動組建仍使用直接 APNs。如果你在沒有中繼的情況下測試這些組建，
閘道仍需要直接 APNs 憑證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存
App Store Connect / TestFlight 驗證，例如 `APP_STORE_CONNECT_KEY_ID` 和
`APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 組建設定直接 APNs 傳遞。

建議的閘道主機儲存方式：

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

iOS app 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定時瀏覽相同的
廣域 DNS-SD 探索網域。同 LAN 閘道會自動從 `local.` 顯示；
跨網路探索可以使用已設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被阻擋，請使用單播 DNS-SD 區域（選擇一個網域；範例：
`openclaw.internal.`）和 Tailscale split DNS。
CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機/連接埠

在設定中，啟用**手動主機**並輸入閘道主機 + 連接埠（預設 `18789`）。

## 畫布 + A2UI

iOS 節點會轉譯 WKWebView 畫布。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由閘道 HTTP 伺服器提供（與 `gateway.port` 相同連接埠，預設 `18789`）。
- iOS 節點會將內建 scaffold 保持為已連線的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用隨附的 app 擁有 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供轉譯；原生 A2UI 按鈕動作只接受來自隨附 app 擁有頁面的動作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## 與 Computer Use 的關係

iOS app 是行動節點介面，不是 Codex Computer Use 後端。Codex
Computer Use 和 `cua-driver mcp` 會透過 MCP
工具控制本機 macOS 桌面；iOS app 則透過 OpenClaw 節點命令公開 iPhone 能力，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫節點命令來操作 iOS app，
但這些呼叫會經過閘道節點協定，並遵循 iOS
前景/背景限制。本機桌面控制請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)，
iOS 節點能力請使用本頁。

### 畫布 eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒和對話模式可在設定中使用。
- 支援對話的 iOS 節點會公告 `talk` 能力，並可宣告
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  閘道預設允許受信任、支援對話的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當 app 不在作用中時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS app 帶到前景（畫布/相機/螢幕命令需要前景）。
- `A2UI_HOST_UNAVAILABLE`：app WebView 中無法連到隨附的 A2UI 頁面；請讓 app 在螢幕分頁中保持前景，然後重試。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
