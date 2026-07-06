---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS 應用程式
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-06T10:50:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b118e6983ba0077e9d4752548ef3ea3adfe699a10398f673520610076004da1b
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個版本時，iPhone App 建置會透過 Apple 通路發佈。本機開發建置也可以從原始碼執行。

## 功能

- 透過 WebSocket 連線到閘道（LAN 或 tailnet）。
- 暴露節點能力：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 為每個已配對閘道保留一個小型唯讀離線快取，包含最近的聊天工作階段與逐字稿：冷啟動會立即繪製最後已知逐字稿，並在閘道回應後重新整理；中斷連線時仍可瀏覽最近聊天；重設/忘記會清除受保護的本機快取。
- 將中斷連線時送出的文字訊息排入每個閘道的持久寄件匣（最多 50 則）：排隊中的對話泡泡會顯示在逐字稿中，重新連線時依序送出，並使用冪等鍵確保不會重複傳送；在顯示為「未送出」前會以退避重試，並在訊息內容選單提供重試/刪除；離線 48 小時後會過期而不再傳送；重設/忘記會連同快取一併清除佇列。

## 需求

- 閘道在另一台裝置上執行（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 位於同一 LAN，**或**
  - 透過單播 DNS-SD 位於 Tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動已驗證且有手機可達路由的閘道。Tailscale
   Serve 是建議的遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的同 LAN 設定，請改用已驗證的 `gateway.bind: "lan"`。
預設 local loopback 繫結無法從手機連到。如果
尚未設定閘道，請先執行 `openclaw onboard`，讓設定碼
建立流程具備權杖或密碼驗證路徑。

2. 開啟 [Control UI](/zh-TW/web/control-ui)，選取 **節點**，並在 **裝置** 卡片中點擊
   **配對行動裝置**。

3. 在 iOS App 中，開啟 **設定** -> **閘道**，掃描 QR code（或貼上
   設定碼），然後連線。

   如果設定碼同時包含 LAN 與 Tailscale Serve 路由，App
   會依序探測它們，並儲存第一個可連到的端點。

4. 官方 App 會自動連線。如果 **裝置** 顯示待處理
   請求，請在核准前檢視其角色與範圍。

Apple Watch companion 沒有獨立的 OpenClaw 配對核准。
請在 Apple 的 Watch App 中將 Watch 與 iPhone 配對，從
**Watch App -> 我的 Watch -> 可用 App** 安裝 OpenClaw，然後在兩台
裝置上各開啟一次 OpenClaw。OpenClaw 會立即跟隨 Apple Watch 配對與安裝變更；
閘道的裝置核准涵蓋 iPhone 節點。

Control UI 按鈕需要已配對且具備 `operator.admin` 的工作階段。
作為終端備援，請在 iOS App 中選取一個已發現的閘道（或啟用
手動主機並輸入主機/連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點永遠從嚴格控管的子網路連線，你可以使用明確 CIDR 或精確 IP 選擇啟用首次節點自動核准：

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

此功能預設停用。它只適用於全新的 `role: node` 配對，且未請求任何範圍。操作員/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方建置的中繼後援推播

官方發佈的 iOS 建置使用外部推播中繼，而不是將原始 APNs token 發佈到閘道。來自公開發佈路徑的官方 App Store 建置使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基底 URL 針對 App Store 發佈硬編碼，且不讀取任何覆寫。

自訂中繼部署需要刻意分離的 iOS 建置/部署路徑，其過程中的中繼 URL 必須符合閘道中繼 URL。App Store 發佈路徑永不接受自訂中繼 URL。如果你使用自訂中繼建置，請設定相符的閘道中繼 URL：

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

- iOS App 使用 App Attest 與 StoreKit App transaction JWS 向中繼註冊。
- 中繼回傳不透明的中繼 handle，以及註冊範圍的傳送授權。
- iOS App 擷取已配對的閘道身分（`gateway.identity.get`）並將其包含在中繼註冊中，因此中繼後援註冊會委派給該特定閘道。
- App 使用 `push.apns.register` 將該中繼後援註冊轉送到已配對的閘道。
- 閘道會將儲存的中繼 handle 用於 `push.test`、背景喚醒與喚醒提示。
- 如果 App 之後連線到不同閘道，或連線到使用不同中繼基底 URL 的建置，它會重新整理中繼註冊，而不是重複使用舊繫結。

此路徑中閘道**不**需要的項目：不需要部署範圍的中繼 token，也不需要官方 App Store 中繼後援傳送用的直接 APNs 金鑰。

預期操作員流程：

1. 安裝官方 iOS App。
2. 選用：只有在使用刻意分離的自訂中繼建置時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 配對到閘道，並讓它完成連線。
4. App 會在取得 APNs token、操作員工作階段已連線，且中繼註冊成功後，發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒與喚醒提示都可以使用儲存的中繼後援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件喚醒 App 時，App 會嘗試短暫重新連線節點，接著呼叫 `node.event` 並帶上 `event: "node.presence.alive"`。閘道只有在已知已驗證的節點裝置身分後，才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，App 才會將背景喚醒視為已成功記錄。較舊的閘道可能以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不算作持久的 last-seen 更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境覆寫使用（`gateway.push.apns.relay.baseUrl` 是設定優先的路徑）。
- App Store 發佈建置的推播模式會硬編碼託管中繼主機，且永不讀取中繼 URL 覆寫 — `OPENCLAW_PUSH_RELAY_BASE_URL` 建置時環境變數只影響本機/沙盒 iOS 建置模式。

## 驗證與信任流程

中繼存在是為了強制執行直接在閘道上使用 APNs 無法為官方 iOS 建置提供的兩項約束：

- 只有透過 Apple 發佈的真正 OpenClaw iOS 建置可以使用託管中繼。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼後援推播。

逐跳流程：

1. `iOS app -> gateway`：App 透過一般閘道驗證流程與閘道配對，取得已驗證的節點工作階段，以及已驗證的操作員工作階段。操作員工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：App 透過 HTTPS 呼叫中繼註冊端點，並附上 App Attest 證明與 StoreKit App transaction JWS。中繼會驗證 bundle ID、App Attest 證明與 Apple 發佈證明，並要求官方/生產發佈路徑；這正是阻止本機 Xcode/開發建置使用託管中繼的機制，因為本機建置無法滿足官方 Apple 發佈證明。
3. `gateway identity delegation`：在中繼註冊前，App 會從 `gateway.identity.get` 擷取已配對閘道身分，並將其包含在中繼註冊 payload 中。中繼會回傳中繼 handle，以及委派給該閘道身分的註冊範圍傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼 handle 與傳送授權。在 `push.test`、重新連線喚醒與喚醒提示時，閘道會使用自己的裝置身分簽署傳送請求；中繼會根據註冊中委派的閘道身分，驗證儲存的傳送授權與閘道簽章。即使另一個閘道以某種方式取得 handle，也無法重複使用該儲存的註冊。
5. `relay -> APNs`：中繼擁有官方建置的生產 APNs 認證與原始 APNs token。對於中繼後援的官方建置，閘道永不儲存原始 APNs token；中繼會代表已配對閘道將最終推播送到 APNs。

建立此設計的原因：將生產 APNs 認證保留在使用者閘道之外、避免在閘道上儲存官方建置的原始 APNs token、只允許官方 OpenClaw iOS 建置使用託管中繼，並防止一個閘道向屬於不同閘道的 iOS 裝置傳送喚醒推播。

本機/手動建置仍使用直接 APNs。如果你在沒有中繼的情況下測試這些建置，閘道仍需要直接 APNs 認證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存 App Store Connect 驗證，例如 `APP_STORE_CONNECT_KEY_ID` 與 `APP_STORE_CONNECT_ISSUER_ID`；它不會設定本機 iOS 建置的直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他 provider 認證一致：

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

iOS App 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在已設定時瀏覽相同的廣域 DNS-SD 探索網域。同 LAN 閘道會自動從 `local.` 出現；跨網路探索可以使用已設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD 區域（選擇一個網域；範例：`openclaw.internal.`）與 Tailscale split DNS。請參閱 [Bonjour](/zh-TW/gateway/bonjour) 取得 CoreDNS 範例。

### 手動主機/連接埠

在設定中，啟用 **手動主機** 並輸入閘道主機 + 連接埠（預設 `18789`）。

## Canvas + A2UI

iOS 節點會渲染 WKWebView canvas。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道 canvas 主機會從閘道 HTTP 伺服器（與 `gateway.port` 相同的連接埠，預設 `18789`）提供 `/__openclaw__/canvas/` 與 `/__openclaw__/a2ui/`。
- iOS 節點會將內建 scaffold 保留為已連線的預設檢視。`canvas.a2ui.push` 與 `canvas.a2ui.reset` 使用隨附的 App 擁有 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供渲染；原生 A2UI 按鈕動作只接受來自隨附 App 擁有頁面的動作。
- 使用 `canvas.navigate` 和 `{"url":""}` 回到內建 scaffold。

## Computer Use 關係

iOS App 是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS App 則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫節點命令來操作 iOS App，但這些呼叫會經由閘道節點協定，並遵循 iOS 前景/背景限制。使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use) 進行本機桌面控制，並使用本頁了解 iOS 節點功能。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒和對話模式可在「設定」中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時 Talk 會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援 Talk 的 iOS 節點會宣告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；閘道預設允許受信任且支援 Talk 的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當 App 未啟用時，請將語音功能視為盡力提供。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS App 帶到前景（canvas/camera/screen 命令需要這樣做）。
- `A2UI_HOST_UNAVAILABLE`：內建的 A2UI 頁面無法在 App WebView 中存取；讓 App 保持在前景並停留於「螢幕」分頁，然後重試。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對為 false，請在 Apple 的 Watch App 中配對
  Watch。如果安裝為 false，請從 **我的手錶 -> 可用的 App** 安裝隨附 App。
  任一變更完成後，在 Watch 上開啟一次 OpenClaw；立即可達性仍需要兩個 App 都在執行，
  而佇列中的更新稍後仍可在背景抵達。
- 重新安裝後重新連線失敗：Keychain 配對權杖已被清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
