---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS 應用程式
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連接到閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-02T22:22:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

可用性：iPhone app 建置版會在針對某個版本啟用時透過 Apple 通路發佈。本機開發建置版也可以從原始碼執行。

## 功能

- 透過 WebSocket（區域網路或 tailnet）連線到閘道。
- 公開節點能力：畫布、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。

## 需求

- 在另一台裝置上執行的閘道（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 的同一區域網路，**或**
  - 透過單點傳播 DNS-SD 的 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動閘道：

```bash
openclaw gateway --port 18789
```

2. 在 iOS app 中開啟 Settings，並選擇已探索到的閘道（或啟用 Manual Host 並輸入主機/連接埠）。

3. 在閘道主機上核准配對請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 以變更過的驗證詳細資料（角色/範圍/公開金鑰）重試配對，
先前待處理的請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格控管的子網路連線，你可以
使用明確的 CIDR 或精確 IP 選擇啟用首次節點自動核准：

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

這預設為停用。它只適用於全新的 `role: node` 配對，且
沒有要求任何範圍。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或
公開金鑰變更，仍然需要手動核准。

4. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方建置版的中繼支援推播

官方發佈的 iOS 建置版會使用外部推播中繼，而不是將原始 APNs
權杖發佈到閘道。

公共發布管道中的官方 App Store 建置版會使用託管中繼 `https://ios-push-relay.openclaw.ai`。

自訂中繼部署需要刻意獨立的 iOS 建置/部署路徑，且其中繼 URL 必須符合閘道中繼 URL。公共 App Store 發布管道不接受自訂中繼 URL 覆寫。如果你使用自訂中繼建置版，請設定相符的閘道中繼 URL：

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
- 中繼會回傳不透明的中繼控制代碼，以及註冊範圍的傳送授權。
- iOS app 會取得已配對的閘道身分並將其納入中繼註冊，因此由中繼支援的註冊會委派給該特定閘道。
- app 會使用 `push.apns.register` 將該中繼支援的註冊轉送到已配對的閘道。
- 閘道會將該儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 自訂閘道中繼 URL 必須符合內建於 iOS 建置版中的中繼 URL。
- 如果 app 之後連線到不同閘道，或連線到具有不同中繼基底 URL 的建置版，它會重新整理中繼註冊，而不是重複使用舊繫結。

此路徑下閘道**不**需要的項目：

- 不需要部署範圍的中繼權杖。
- 官方 App Store 中繼支援傳送不需要直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS app。
2. 選用：只有在使用刻意獨立的自訂中繼建置版時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 app 配對到閘道，並讓它完成連線。
4. app 在取得 APNs 權杖、操作者工作階段已連線，且中繼註冊成功後，會自動發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示就可以使用儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重要位置事件喚醒 app 時，app
會嘗試短暫重新連線節點，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。
閘道只會在已知已驗證的節點裝置身分後，才將此記錄為已配對節點/裝置中繼資料上的
`lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，app 才會將背景喚醒視為成功記錄。
較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，
但不會算作持久的最後看見更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境覆寫。
- 公共 App Store 發布管道會拒絕 iOS 建置版的 `OPENCLAW_PUSH_RELAY_BASE_URL`。

## 驗證與信任流程

中繼存在的目的，是為官方 iOS 建置版強制執行兩項
直接在閘道上使用 APNs 無法提供的限制：

- 只有透過 Apple 發佈的 genuine OpenClaw iOS 建置版可以使用託管中繼。
- 閘道只能針對與該特定閘道配對的 iOS 裝置傳送中繼支援推播。

逐段流程：

1. `iOS app -> gateway`
   - app 會先透過一般閘道驗證流程與閘道配對。
   - 這會提供 app 已驗證的節點工作階段，以及已驗證的操作者工作階段。
   - 操作者工作階段用於呼叫 `gateway.identity.get`。

2. `iOS app -> relay`
   - app 透過 HTTPS 呼叫中繼註冊端點。
   - 註冊包含 App Attest 證明以及 StoreKit app transaction JWS。
   - 中繼會驗證 bundle ID、App Attest 證明和 Apple 發佈證明，並要求
     官方/生產發佈路徑。
   - 這就是阻止本機 Xcode/開發建置版使用託管中繼的機制。本機建置版可以
     已簽署，但它不符合中繼預期的官方 Apple 發佈證明。

3. `gateway identity delegation`
   - 在中繼註冊之前，app 會從 `gateway.identity.get`
     取得已配對的閘道身分。
   - app 會將該閘道身分納入中繼註冊酬載。
   - 中繼會回傳中繼控制代碼，以及委派給該
     閘道身分的註冊範圍傳送授權。

4. `gateway -> relay`
   - 閘道會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。
   - 在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的
     裝置身分簽署傳送請求。
   - 中繼會根據註冊時委派的閘道身分，驗證儲存的傳送授權和閘道簽章。
   - 即使另一個閘道以某種方式取得控制代碼，也無法重複使用該儲存的註冊。

5. `relay -> APNs`
   - 中繼擁有生產 APNs 憑證，以及官方建置版的原始 APNs 權杖。
   - 對於中繼支援的官方建置版，閘道絕不會儲存原始 APNs 權杖。
   - 中繼代表已配對的閘道，將最終推播傳送到 APNs。

建立此設計的原因：

- 讓生產 APNs 憑證不進入使用者閘道。
- 避免在閘道上儲存官方建置版的原始 APNs 權杖。
- 只允許官方 OpenClaw iOS 建置版使用託管中繼。
- 防止某個閘道向屬於不同閘道的 iOS 裝置傳送喚醒推播。

本機/手動建置版仍使用直接 APNs。如果你在不使用中繼的情況下測試這些建置版，
閘道仍需要直接 APNs 憑證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存
App Store Connect 驗證，例如 `APP_STORE_CONNECT_KEY_ID` 和
`APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 建置版設定直接 APNs 傳遞。

建議的閘道主機儲存位置：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，或將它放在 repo checkout 底下。

## 探索路徑

### Bonjour（區域網路）

iOS app 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定後瀏覽相同的
廣域 DNS-SD 探索網域。同一區域網路的閘道會自動從 `local.` 顯示；
跨網路探索可以使用設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；範例：
`openclaw.internal.`）和 Tailscale 分割 DNS。
請參閱 [Bonjour](/zh-TW/gateway/bonjour) 取得 CoreDNS 範例。

### 手動主機/連接埠

在 Settings 中啟用 **Manual Host**，並輸入閘道主機 + 連接埠（預設 `18789`）。

## 畫布 + A2UI

iOS 節點會算繪 WKWebView 畫布。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由閘道 HTTP 伺服器提供（與 `gateway.port` 相同連接埠，預設 `18789`）。
- iOS 節點會保留內建 scaffold 作為已連線的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 會使用隨附的 app 擁有 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅可算繪；原生 A2UI 按鈕動作只接受來自隨附 app 擁有頁面的動作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## 電腦使用關係

iOS app 是行動節點介面，不是 Codex 電腦使用後端。Codex
電腦使用和 `cua-driver mcp` 會透過 MCP 工具控制本機 macOS 桌面；
iOS app 會透過 OpenClaw 節點命令公開 iPhone 能力，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍然可以透過 OpenClaw 呼叫節點命令來操作 iOS app，
但這些呼叫會經過閘道節點協定，並遵循 iOS
前景/背景限制。請使用 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)
進行本機桌面控制，並使用本頁了解 iOS 節點能力。

### 畫布 eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒和對話模式可在 Settings 中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話的 iOS 節點會公告 `talk` 能力，且可以宣告
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  對於受信任且支援對話的節點，閘道預設允許這些按鍵通話命令。
- iOS 可能會暫停背景音訊；當 app 未在作用中時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS app 帶到前景（畫布/相機/螢幕命令需要它）。
- `A2UI_HOST_UNAVAILABLE`：隨附的 A2UI 頁面無法在 app WebView 中連線；讓 app 在 Screen 分頁保持前景，然後重試。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已被清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
