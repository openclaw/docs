---
read_when:
    - 配對或重新連線 iOS 節點
    - 啟用或疑難排解直接連線的 Apple Watch 節點
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-12T14:37:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30d70f6df7fa1226bbcc79da4e7ece29f8531d5ea1fcf23b742e78d36fb9fc02
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個版本時，iPhone App 組建會透過 Apple 管道發布。本機開發組建也可以從原始碼執行。

## 功能

- 透過 WebSocket（區域網路或 tailnet）連線至閘道。
- 提供節點功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 從代理程式介面（Files）以唯讀方式瀏覽所選代理程式的工作區：逐層瀏覽目錄、顯示語法醒目的文字預覽、圖片預覽，以及透過分享選單匯出。不提供寫入操作；閘道會限制預覽大小。
- 為每個已配對閘道保留近期聊天工作階段和轉錄內容的小型唯讀離線快取：冷啟動時會立即顯示最後已知的轉錄內容，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設／忘記則會清除受保護的本機快取。
- 將中斷連線時傳送的文字訊息排入每個閘道各自的持久寄件匣（最多 50 則）：已排入佇列的訊息泡泡會顯示於轉錄內容中；重新連線後依序傳送，並採用具冪等性的重試；在標準歷史記錄確認已傳送前會持續保留；先以退避機制重試，之後才顯示重試／刪除動作；離線超過 48 小時後會過期而不再傳送；重設／忘記會連同快取一起清除佇列。
- 依需求朗讀助理訊息：在聊天中長按訊息並選擇 **聆聽**。App 會使用已設定的 TTS 提供者播放閘道支援的 `tts.speak` 音訊片段；當閘道音訊無法取得或無法播放時，則改用裝置端語音。切換工作階段或 App 進入背景時會停止播放。

## 需求

- 閘道需在另一台裝置上執行（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用相同區域網路，**或**
  - 透過單點傳播 DNS-SD 使用 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動指定主機／連接埠（備援方式）。

## 快速開始（配對並連線）

1. 啟動已驗證身分的閘道，並設定手機可連線的路由。建議使用 Tailscale
   Serve 作為遠端連線路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的相同區域網路設定，請改用已驗證身分的 `gateway.bind: "lan"`。
預設的迴路介面繫結無法從手機存取。如果尚未設定
閘道，請先執行 `openclaw onboard`，讓設定碼的
建立流程具備權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選取 **節點**，然後在 **裝置** 頁面按一下
   **配對行動裝置**。

3. 在 iOS App 中開啟 **設定** -> **閘道**，掃描 QR Code（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路和 Tailscale Serve 路由，App
   會依序探測並儲存第一個可連線的端點。

4. 官方 App 會自動連線。如果 **等待核准** 顯示
   請求，請先檢查其角色和範圍，再予以核准。

控制介面按鈕需要已配對且具備 `operator.admin` 的工作階段。
作為終端機備援方式，請在 iOS App 中選擇探索到的閘道（或啟用
Manual Host 並輸入主機／連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用已變更的驗證詳細資料（角色／範圍／公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格管控的子網路連線，你可以選擇使用明確的 CIDR 或確切 IP，啟用首次節點自動核准：

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

此功能預設為停用。它僅適用於未要求任何範圍的全新 `role: node` 配對。操作員／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

根據預設，Apple Watch 伴隨 App 會繼續使用現有的 iPhone 中繼，
不需要另行與閘道配對。請在 Apple 的 Watch App 中將 Watch 與 iPhone
配對，從 **Watch app -> My Watch -> Available
Apps** 安裝 OpenClaw，然後在兩台裝置上各開啟一次 OpenClaw。

## 審查命令核准

具備 `operator.admin` 的操作員連線，或由閘道明確指定且已配對的
`operator.approvals` 連線，可以在 iPhone 上審查
待處理的執行請求。核准卡片會顯示閘道的
淨化命令預覽、警告、主機內容、到期時間，以及該請求所提供的
決策選項。已配對的 Apple Watch 會透過現有的 iPhone 中繼收到相同的
審查者安全提示，並提供精簡的
僅允許一次／拒絕決策子集。Watch 直接連線閘道模式不會
傳送核准提示。

核准狀態會與控制介面和支援的聊天介面共用。
第一個提交的答案生效。當另一個介面解決請求後、收到遠端
已解決通知後，以及每當解決確認可能
遺失時，iPhone 和 Watch 都會擷取閘道的標準
終止記錄。在讀回確認
請求是否仍待處理前，動作會維持不可用。

核准擁有權會繫結至所選閘道。切換閘道時，無法
將舊提示套用至替代連線。早於
統一核准方法的閘道會退回使用已發布的執行專用方法；
若要保留終止狀態並取得更豐富的跨介面結果，則需要更新的
閘道。

## 選用的 Apple Watch 直接節點

直接模式會讓 Watch 擁有自己的已簽署節點身分和閘道連線。
當 OpenClaw 處於啟用狀態時，即使已配對的 iPhone 無法使用，
支援的節點命令仍可透過 Watch 的 Wi-Fi 或行動網路運作。

需求：

- iPhone 已使用 `operator.admin` 範圍連線至閘道。
- 設定碼提供具有 watchOS 信任憑證的 `wss://` 閘道端點；
  Watch 會輪詢對應的 `https://` 來源。不支援純 HTTP，
  也不支援僅使用自我簽署或指紋的信任方式。端點設定請參閱[閘道擁有的
  配對](/zh-TW/gateway/pairing)。迴路介面、僅限 iPhone 和僅限 tailnet
  的路由，Watch 均無法獨立存取。
- 使用行動網路需要支援行動網路且已啟用服務的 Apple Watch。
- OpenClaw 在 Watch 上處於啟用狀態。Apple 不允許一般 watchOS App
  持續維持通用 WebSocket/TCP 連線，因此直接節點會使用短時間的 HTTPS
  輪詢，並在 App 返回前景時重新連線。請參閱 Apple 的
  [watchOS 低階網路指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

設定：

1. 在 iPhone 上開啟 **Settings -> Apple Watch**。
2. 點選 **Enable Direct Gateway Connection**。
3. 在短效設定碼到期前，於 Watch 上開啟 OpenClaw。
4. 使用 `openclaw nodes status` 驗證獨立的 Apple Watch 資料列。

設定碼包含短效、僅限節點使用的啟動認證資訊；在到期前請像密碼一樣妥善保管。
其中絕不會包含 iPhone 儲存的閘道
密碼或權杖。配對完成後，Watch 會儲存自己的裝置權杖，並
刪除啟動認證資訊。直接模式僅涵蓋下列命令。
聊天、對話、核准和現有的 `watch.*` 通知流程仍為
iPhone 中繼功能，且仍需要已配對的 iPhone。

WatchOS 直接節點命令：

| 介面          | 命令                           | 備註                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 裝置          | `device.info`, `device.status` | Watch 身分、電池、溫度、儲存空間和網路。                |
| 通知          | `system.notify`                | App 處於啟用狀態時可用；需要 Watch 權限。               |

watchOS 不向第三方 App 提供 WebKit，因此 Watch 直接節點
不會宣告 Canvas 命令。

## 官方組建的中繼式推播

官方發布的 iOS 組建使用外部推播中繼，而不會將原始 APNs 權杖發布至閘道。來自公開發布管道的官方 App Store 組建使用託管於 `https://ios-push-relay.openclaw.ai` 的中繼；此基底 URL 已硬編碼用於 App Store 發布，且不會讀取任何覆寫設定。

自訂中繼部署需要刻意使用獨立的 iOS 組建／部署路徑，其中繼 URL 必須與閘道中繼 URL 相符。App Store 發布管道絕不接受自訂中繼 URL。如果你使用自訂中繼組建，請設定相符的閘道中繼 URL：

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

- iOS App 使用 App Attest 和 StoreKit App 交易 JWS 向中繼註冊。
- 中繼會傳回不透明的中繼控制代碼，以及以註冊為範圍的傳送授權。
- iOS App 會擷取已配對的閘道身分（`gateway.identity.get`），並將其包含在中繼註冊中，因此該中繼式註冊會委派給該特定閘道。
- App 會使用 `push.apns.register`，將該中繼式註冊轉送至已配對的閘道。
- 閘道會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 如果 App 之後連線至不同的閘道，或連線自具有不同中繼基底 URL 的組建，它會重新整理中繼註冊，而不會重複使用舊的繫結。

此路徑中，閘道**不**需要：全部署共用的中繼權杖，也不需要官方 App Store 中繼式傳送所使用的直接 APNs 金鑰。

預期的操作員流程：

1. 安裝官方 iOS App。
2. 選用：只有在使用刻意分離的自訂中繼組建時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 與閘道配對，並讓其完成連線。
4. App 取得 APNs 權杖、操作員工作階段已連線且中繼註冊成功後，便會發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示即可使用儲存的中繼式註冊。

## 背景存活訊號

當 iOS 因靜默推播、背景重新整理或重大位置事件而喚醒 App 時，App 會嘗試短暫重新連線節點，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。只有在得知已驗證身分的節點裝置身分後，閘道才會將此事件記錄為已配對節點／裝置中繼資料上的 `lastSeenAtMs`／`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，App 才會將背景喚醒視為已成功記錄。較舊的閘道可能會使用 `{ "ok": true }` 確認 `node.event`；此回應相容，但不算持久的上次出現時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境變數覆寫設定（`gateway.push.apns.relay.baseUrl` 是設定優先的路徑）。
- App Store 發布組建的推播模式會硬編碼託管中繼主機，且絕不讀取中繼 URL 覆寫設定——`OPENCLAW_PUSH_RELAY_BASE_URL` 建置階段環境變數僅影響本機／沙箱 iOS 組建模式。

## 驗證與信任流程

中繼的存在是為了強制執行兩項限制，而官方 iOS 組建若直接在閘道上使用 APNs，則無法提供這些限制：

- 只有透過 Apple 發布的正版 OpenClaw iOS 組建才能使用託管中繼。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼式推播。

逐跳流程：

1. `iOS app -> gateway`：應用程式透過一般的閘道驗證流程與閘道配對，取得已驗證的節點工作階段以及已驗證的操作員工作階段。操作員工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：應用程式透過 HTTPS 呼叫中繼服務註冊端點，並提供 App Attest 證明及 StoreKit 應用程式交易 JWS。中繼服務會驗證 bundle ID、App Attest 證明與 Apple 發行證明，且要求使用官方／正式環境發行路徑——這會阻止本機 Xcode／開發組建使用託管中繼服務，因為本機組建無法滿足官方 Apple 發行證明。
3. `gateway identity delegation`：在中繼服務註冊之前，應用程式會從 `gateway.identity.get` 取得已配對的閘道身分，並將其納入中繼服務註冊承載資料。中繼服務會傳回中繼服務控制代碼，以及委派給該閘道身分、僅限此次註冊範圍的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼服務控制代碼與傳送授權。在 `push.test`、重新連線喚醒及喚醒提示時，閘道會使用自己的裝置身分簽署傳送要求；中繼服務會依據註冊時委派的閘道身分，同時驗證已儲存的傳送授權與閘道簽章。即使其他閘道以某種方式取得該控制代碼，也無法重複使用已儲存的註冊。
5. `relay -> APNs`：中繼服務持有正式環境 APNs 認證資訊，以及官方組建的原始 APNs 權杖。對於由中繼服務支援的官方組建，閘道絕不會儲存原始 APNs 權杖；中繼服務會代表已配對的閘道，將最終推播傳送至 APNs。

建立此設計的原因：避免將正式環境 APNs 認證資訊放在使用者的閘道中、避免在閘道上儲存官方組建的原始 APNs 權杖、僅允許官方 OpenClaw iOS 組建使用託管中繼服務，並防止某個閘道向屬於其他閘道的 iOS 裝置傳送喚醒推播。

本機／手動組建仍使用直接 APNs。如果你要在不使用中繼服務的情況下測試這些組建，閘道仍需要直接 APNs 認證資訊：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 僅儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會設定本機 iOS 組建的直接 APNs 傳送。

建議依照 `~/.openclaw/credentials/` 下其他提供者認證資訊的方式，在閘道主機上儲存：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，也不要將其放在存放區簽出目錄下。

## 探索路徑

### Bonjour（區域網路）

iOS 應用程式會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，若已設定，也會瀏覽相同的廣域 DNS-SD 探索網域。同一區域網路上的閘道會自動從 `local.` 顯示；跨網路探索可以使用已設定的廣域網域，而不必變更信標類型。

### Tailnet（跨網路）

如果 mDNS 遭到封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；例如：`openclaw.internal.`）以及 Tailscale 分割 DNS。CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機／連接埠

在設定中啟用 **Manual Host**，並輸入閘道主機與連接埠（預設為 `18789`）。

## 多個閘道

應用程式會保留所有已配對閘道的登錄，因此你不必重新配對即可在它們之間切換：

- **Settings -> Gateway** 會顯示 **Paired Gateways** 清單，並標示目前使用中的閘道。點選項目即可切換；應用程式會中止目前的工作階段，並重新連線至所選閘道。配對多個閘道時，連線列旁會顯示快速切換選單。
- 認證資訊、TLS 信任決策、各閘道偏好設定及快取的聊天記錄會依閘道分開儲存。切換時絕不會混用不同閘道的狀態，推播註冊也會跟隨目前使用中的閘道。
- 滑動已配對的閘道（或使用其內容選單）並選擇 **Forget**，即可移除其認證資訊、裝置權杖、TLS 釘選及快取聊天。
- 探索到的閘道必須在網路上可見才能切換；手動閘道則會使用已儲存的主機與連接埠重新連線。

## 畫布 + A2UI

iOS 節點會呈現 WKWebView 畫布。使用 `node.invoke` 操作它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機透過閘道 HTTP 伺服器（與 `gateway.port` 使用相同連接埠，預設為 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會保留內建基礎介面作為連線後的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用由應用程式擁有的隨附 A2UI 頁面。
- 在 iOS 上，遠端閘道 A2UI 頁面僅能呈現；只有由應用程式擁有的隨附頁面所發出的原生 A2UI 按鈕動作才會被接受。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建基礎介面。

## 與 Computer Use 的關係

iOS 應用程式是行動節點介面，而不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS 應用程式則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理程式仍可透過 OpenClaw 呼叫節點命令來操作 iOS 應用程式，但這些呼叫會經由閘道節點通訊協定，並受到 iOS 前景／背景限制。若要控制本機桌面，請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)；若要瞭解 iOS 節點功能，請參閱本頁。

### 畫布 eval／快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒與對話模式可在設定中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用用戶端持有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道持有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話功能的 iOS 節點會通告 `talk` 功能，且可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；閘道預設允許受信任且支援對話功能的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；應用程式非使用中時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式切換至前景（畫布／相機／螢幕命令需要應用程式位於前景）。
- `A2UI_HOST_UNAVAILABLE`：應用程式 WebView 無法連線至隨附的 A2UI 頁面；請讓應用程式在 Screen 分頁保持前景，然後重試。
- 配對提示一直未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示任何 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對狀態為 false，請在 Apple 的 Watch 應用程式中配對
  Watch。如果安裝狀態為 false，請從 **My Watch -> Available Apps** 安裝配套
  應用程式。任一項變更後，請在 Watch 上開啟 OpenClaw 一次；即時連線能力仍要求兩個應用程式都在執行，
  而佇列中的更新則可稍後在背景送達。
- 重新安裝後無法重新連線：鑰匙圈中的配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
