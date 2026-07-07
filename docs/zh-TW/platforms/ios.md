---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS 應用程式
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線到閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-06T21:49:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae9061342b4f8a04afd1a7d2829b71ce9cd2bdd3b5124a54b9b6196b7ed755c3
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個發行版本時，iPhone app 組建會透過 Apple 管道發布。本機開發組建也可以從原始碼執行。

## 功能

- 透過 WebSocket 連線至閘道（LAN 或 tailnet）。
- 暴露節點能力：畫布、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 從代理介面（檔案）以唯讀方式瀏覽所選代理的工作區：目錄逐層深入、具語法突顯的文字預覽、圖片預覽，以及分享表單匯出。沒有寫入操作；預覽大小由閘道限制。
- 依每個已配對閘道保留近期聊天工作階段和逐字稿的小型唯讀離線快取：冷啟動會立即繪製最後已知逐字稿，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設/忘記會清除受保護的本機快取。
- 將中斷連線時傳送的文字訊息排入每個閘道的持久寄件匣（最多 50 則）：已排入佇列的氣泡會顯示在逐字稿中，重新連線時依序送出並以冪等方式重試，直到標準歷史確認傳送前都會保持持久，在顯示重試/刪除動作前會以退避方式重試，離線超過 48 小時後會過期而不是傳送；重設/忘記會連同快取清除佇列。
- 可依需求朗讀助理訊息：在聊天中長按訊息並選擇 **聆聽**。app 會使用已設定的 TTS 提供者播放支援的閘道 `tts.speak` 音訊片段，並在閘道音訊不可用或無法播放時退回到裝置端語音。切換工作階段或進入背景時會停止播放。

## 需求

- 在另一台裝置上執行的閘道（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 的相同 LAN，**或**
  - 透過單播 DNS-SD 的 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動一個已驗證的閘道，並設定你的手機可連到的路由。Tailscale
   Serve 是建議的遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的相同 LAN 設定，請改用已驗證的 `gateway.bind: "lan"`。
預設的 local loopback 繫結無法從手機連線。如果尚未設定
閘道，請先執行 `openclaw onboard`，讓設定碼
建立流程有權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選取 **節點**，然後在 **裝置** 卡片中點擊
   **配對行動裝置**。

3. 在 iOS app 中，開啟 **設定** -> **閘道**，掃描 QR code（或貼上
   設定碼），然後連線。

   如果設定碼同時包含 LAN 和 Tailscale Serve 路由，app
   會依序探測它們，並儲存第一個可連線的端點。

4. 官方 app 會自動連線。如果 **裝置** 顯示待處理
   請求，請在核准前檢閱其角色和範圍。

Apple Watch 伴隨 app 沒有獨立的 OpenClaw 配對核准。
請在 Apple 的 Watch app 中將 Watch 與 iPhone 配對，從
**Watch app -> 我的手錶 -> 可用的 App** 安裝 OpenClaw，然後在兩台
裝置上各開啟一次 OpenClaw。OpenClaw 會立即跟隨 Apple Watch 的配對與安裝變更；
閘道的裝置核准涵蓋 iPhone 節點。

控制介面按鈕需要已配對且具有 `operator.admin` 的工作階段。
作為終端備援，請在 iOS app 中選擇已探索到的閘道（或啟用
手動主機並輸入主機/連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前的待處理請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格控管的子網路連線，你可以選擇使用明確的 CIDR 或精確 IP 進行首次節點自動核准：

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

預設停用此功能。它只適用於未要求任何範圍的新 `role: node` 配對。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方組建的中繼支援推播

官方發布的 iOS 組建會使用外部推播中繼，而不是將原始 APNs 權杖發布到閘道。來自公開發行通道的官方 App Store 組建會使用託管中繼 `https://ios-push-relay.openclaw.ai`；此基底 URL 針對 App Store 發布硬編碼，且不讀取任何覆寫。

自訂中繼部署需要刻意分離的 iOS 組建/部署路徑，其中特定中繼 URL 必須符合閘道中繼 URL。App Store 發行通道永遠不接受自訂中繼 URL。如果你使用自訂中繼組建，請設定相符的閘道中繼 URL：

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
- iOS app 擷取已配對的閘道身分（`gateway.identity.get`），並在中繼註冊中包含它，因此中繼支援的註冊會委派給該特定閘道。
- app 會使用 `push.apns.register` 將該中繼支援的註冊轉送給已配對的閘道。
- 閘道會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 如果 app 之後連線至不同閘道，或連線至使用不同中繼基底 URL 的組建，它會重新整理中繼註冊，而不是重複使用舊繫結。

此路徑下閘道**不**需要的項目：不需要部署範圍的中繼權杖，也不需要官方 App Store 中繼支援傳送的直接 APNs 金鑰。

預期操作者流程：

1. 安裝官方 iOS app。
2. 選用：只有在使用刻意分離的自訂中繼組建時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 app 與閘道配對，並讓它完成連線。
4. app 會在取得 APNs 權杖、操作者工作階段已連線，且中繼註冊成功後，發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示就可以使用已儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件喚醒 app 時，app 會嘗試短暫重新連線節點，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。閘道只有在知道已驗證的節點裝置身分後，才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，app 才會將背景喚醒視為已成功記錄。較舊的閘道可能以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不算作持久的最後上線更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境覆寫使用（`gateway.push.apns.relay.baseUrl` 是以設定優先的路徑）。
- App Store 發行組建的推播模式會硬編碼託管中繼主機，且永遠不讀取中繼 URL 覆寫 — `OPENCLAW_PUSH_RELAY_BASE_URL` 建置時環境變數只影響本機/沙盒 iOS 組建模式。

## 驗證與信任流程

中繼的存在是為了強制執行官方 iOS 組建中，直接在閘道使用 APNs 無法提供的兩項限制：

- 只有透過 Apple 發布的真正 OpenClaw iOS 組建可以使用託管中繼。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼支援推播。

逐跳流程：

1. `iOS app -> gateway`：app 透過一般閘道驗證流程與閘道配對，取得已驗證的節點工作階段以及已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：app 透過 HTTPS 呼叫中繼註冊端點，並附上 App Attest 證明及 StoreKit app transaction JWS。中繼會驗證 bundle ID、App Attest 證明和 Apple 發布證明，並要求官方/正式發布路徑 — 這就是阻止本機 Xcode/開發組建使用託管中繼的機制，因為本機組建無法滿足官方 Apple 發布證明。
3. `gateway identity delegation`：在中繼註冊前，app 會從 `gateway.identity.get` 擷取已配對的閘道身分，並將它包含在中繼註冊酬載中。中繼會回傳中繼控制代碼，以及委派給該閘道身分的註冊範圍傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的裝置身分簽署傳送請求；中繼會依據註冊時委派的閘道身分，驗證已儲存的傳送授權和閘道簽章。即使另一個閘道以某種方式取得控制代碼，也無法重複使用該已儲存的註冊。
5. `relay -> APNs`：中繼擁有官方組建的正式 APNs 認證和原始 APNs 權杖。對於中繼支援的官方組建，閘道永遠不會儲存原始 APNs 權杖；中繼會代表已配對的閘道將最終推播傳送至 APNs。

此設計的建立原因：讓正式 APNs 認證不進入使用者閘道、避免在閘道上儲存官方組建的原始 APNs 權杖、只允許官方 OpenClaw iOS 組建使用託管中繼，並防止某個閘道向屬於不同閘道的 iOS 裝置傳送喚醒推播。

本機/手動組建仍使用直接 APNs。如果你在沒有中繼的情況下測試這些組建，閘道仍需要直接 APNs 認證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存 App Store Connect 驗證，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 組建設定直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他提供者認證一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 檔案，也不要將它放在 repo checkout 下。

## 探索路徑

### Bonjour（LAN）

iOS app 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定後瀏覽相同的廣域 DNS-SD 探索網域。相同 LAN 的閘道會自動從 `local.` 出現；跨網路探索可以使用已設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD 區域（選擇一個網域；範例：`openclaw.internal.`）和 Tailscale split DNS。請參閱 [Bonjour](/zh-TW/gateway/bonjour) 取得 CoreDNS 範例。

### 手動主機/連接埠

在設定中，啟用 **手動主機** 並輸入閘道主機 + 連接埠（預設 `18789`）。

## 多個閘道

app 會保留它已配對過的每個閘道的登錄，因此你可以在它們之間切換，而不需要重新配對：

- **設定 -> 閘道** 會顯示 **已配對的閘道** 清單，並標示作用中的閘道。點一下項目即可切換；App 會拆除目前的工作階段，並重新連線到選取的閘道。配對超過一個閘道時，連線列旁會出現快速切換選單。
- 憑證、TLS 信任決策、個別閘道偏好設定，以及快取的聊天記錄都會按閘道分開儲存。切換永遠不會混用不同閘道之間的狀態，推播註冊也會跟隨作用中的閘道。
- 滑動已配對的閘道（或使用其內容選單）即可 **忘記** 它，這會移除其憑證、裝置權杖、TLS 釘選，以及快取的聊天。
- 必須能在網路上看見已探索到的閘道，才能切換到它們；手動閘道會依已儲存的主機和連接埠重新連線。

## Canvas + A2UI

iOS 節點會呈現 WKWebView 畫布。使用 `node.invoke` 來驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會從閘道 HTTP 伺服器提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（與 `gateway.port` 相同連接埠，預設為 `18789`）。
- iOS 節點會保留內建支架作為已連線的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用隨附、由 App 擁有的 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供呈現；原生 A2UI 按鈕動作只接受來自隨附、由 App 擁有的頁面。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建支架。

## 與 Computer Use 的關係

iOS App 是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 會透過 MCP 工具控制本機 macOS 桌面；iOS App 則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫節點命令來操作 iOS App，但這些呼叫會經過閘道節點協定，並遵循 iOS 前景/背景限制。使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use) 進行本機桌面控制，並使用本頁了解 iOS 節點功能。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒和對話模式可在設定中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時 Talk 會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援 Talk 的 iOS 節點會宣告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；閘道預設允許受信任、支援 Talk 的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當 App 未處於作用中狀態時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS App 帶到前景（畫布/相機/螢幕命令需要如此）。
- `A2UI_HOST_UNAVAILABLE`：隨附的 A2UI 頁面無法在 App WebView 中連線；請讓 App 保持在前景並停留於螢幕分頁，然後重試。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對為 false，請在 Apple 的 Watch App 中配對
  Watch。如果安裝為 false，請從 **我的手錶 -> 可用 App** 安裝配套
  App。完成任一變更後，在 Watch 上開啟一次 OpenClaw；即時可達性仍需要兩個 App 都在執行，
  而排入佇列的更新可以稍後在背景抵達。
- 重新安裝後重新連線失敗：鑰匙圈配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
