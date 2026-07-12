---
read_when:
    - 配對或重新連線 iOS 節點
    - 啟用或疑難排解直接連線的 Apple Watch 節點
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-12T21:26:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf3c90d9b9be2fdfd1e4b85eebe9b79fe17a8f4aeaf05b60d4911c781e87c075
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個版本時，iPhone App 建置版本會透過 Apple 通路發佈。本機開發建置版本也可從原始碼執行。

## 功能

- 透過 WebSocket（區域網路或 tailnet）連線至閘道。
- 提供節點功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒，以及選擇啟用的健康摘要。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 可從 Agents 介面（Files）以唯讀方式瀏覽所選代理程式的工作區：逐層瀏覽目錄、語法醒目提示文字預覽、圖片預覽，以及透過分享面板匯出。不支援寫入操作；預覽大小受閘道限制。
- 為每個已配對閘道保留近期聊天工作階段與逐字記錄的小型唯讀離線快取：冷啟動時會立即顯示最後已知的逐字記錄，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設／忘記會清除受保護的本機快取。
- 將中斷連線時傳送的文字訊息排入每個閘道專屬的持久寄件匣（最多 50 則）：排入佇列的訊息泡泡會顯示在逐字記錄中，重新連線時依序送出並進行具冪等性的重試，在標準歷程確認傳送前會持續保留；先以退避方式重試，之後才顯示重試／刪除動作；離線超過 48 小時後會過期而不再傳送；重設／忘記會連同快取清除佇列。
- 可依需求朗讀助理訊息：在聊天中長按訊息並選擇 **聆聽**。App 會使用已設定的 TTS 提供者播放閘道支援的 `tts.speak` 音訊片段；當閘道音訊不可用或無法播放時，則改用裝置端語音。切換工作階段或 App 進入背景時，播放會停止。

## 需求

- 閘道需在另一台裝置上執行（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用相同區域網路，**或**
  - 透過單播 DNS-SD 使用 Tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動輸入主機／連接埠（備援）。

## 快速開始（配對並連線）

1. 啟動已驗證的閘道，並提供手機可連線的路由。建議使用 Tailscale
   Serve 作為遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是可信任的相同區域網路設定，請改用已驗證的 `gateway.bind: "lan"`。
預設的回送位址繫結無法從手機連線。如果尚未設定閘道，請先執行
`openclaw onboard`，讓設定碼的建立具有權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選擇 **節點**，然後在 **裝置** 頁面上按一下
   **配對行動裝置**。

3. 在 iOS App 中，開啟 **設定** -> **閘道**，掃描 QR 碼（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路與 Tailscale Serve 路由，App
   會依序探測這些路由，並儲存第一個可連線的端點。

4. 官方 App 會自動連線。如果 **等待核准** 顯示一項
   要求，請先檢視其角色與範圍，再予以核准。

控制介面按鈕需要已有一個具備 `operator.admin` 的配對工作階段。
如需使用終端機備援方式，請在 iOS App 中挑選已探索到的閘道（或啟用
Manual Host 並輸入主機／連接埠），然後在閘道主機上核准要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用已變更的驗證詳細資料（角色／範圍／公開金鑰）重試配對，先前等待中的要求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從受到嚴格控管的子網路連線，你可以使用明確的 CIDR 或確切 IP，選擇啟用首次節點自動核准：

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

此功能預設為停用。它僅適用於未要求任何範圍的新 `role: node` 配對。操作員／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 健康摘要

iOS 節點可傳回 `today` 的唯讀裝置端彙總資料。固定
摘要包含步數、睡眠時長、平均靜止心率，以及運動
次數／時長。它絕不會傳回個別 HealthKit
樣本、來源、中繼資料、臨床記錄或寫入權限。

此介面有兩項彼此獨立的選擇啟用設定：

1. 在 iOS App 中，開啟 **Settings -> Permissions -> Privacy & Access -> Health Summaries**，然後
   點選 **Enable & Share Summaries**。揭露內容會說明所要求的
   彙總資料會透過你的閘道離開手機、傳送至你設定的 AI
   提供者，且可能保留在聊天記錄中。
2. 將 `health.summary` 新增至 `gateway.nodes.allowCommands`，然後拒絕並
   重新核准已變更的 iPhone 節點命令介面。讓你的閘道保持僅限本機
   或 tailnet；啟用此敏感命令時，安全稽核會回報它。

模型使用現有的 `nodes` 工具，並將 `action: "invoke"`、
`invokeCommand: "health.summary"`，以及 `invokeParamsJson` 設為
`{"period":"today"}`。

HealthKit 刻意不揭露讀取權限是否遭拒。因此，缺少
指標僅表示未傳回可讀取的值；無法證明權限遭拒或不存在
健康資料。OpenClaw 將摘要限制為目前日曆日，以免受限的
歷史存取期間使多日總計看似完整。OpenClaw 不會在
背景擷取健康資料，也不會將摘要用於診斷或醫療建議。

依預設，Apple Watch 配套 App 會繼續使用現有的 iPhone 中繼，
不需要另外與閘道配對。請在 Apple 的 Watch App 中將 Watch 與 iPhone 配對，
從 **Watch app -> My Watch -> Available
Apps** 安裝 OpenClaw，然後在兩台裝置上各開啟 OpenClaw 一次。

## 檢視命令核准要求

具有 `operator.admin` 的操作員連線，或由閘道明確指定的已配對
`operator.approvals` 連線，可以在 iPhone 上檢視
等待中的執行要求。核准卡片會顯示閘道經過清理的
命令預覽、警告、主機情境、到期時間，以及該要求所提供的
決策選項。已配對的 Apple Watch 會透過現有的 iPhone 中繼收到相同的
審核者安全提示，並提供精簡的允許一次／拒絕決策選項。直接 Watch 閘道模式
不會傳送核准提示。

核准狀態會與控制介面及支援的聊天介面共用。第一個正式提交的答案生效。
當另一個介面解決要求、收到遠端已解決通知，以及任何可能遺失
解決確認的情況發生後，iPhone 和 Watch 都會擷取閘道的標準
終止記錄。在該回讀確認要求是否仍在等待中之前，動作會保持不可用。

核准的歸屬與所選閘道綁定。切換閘道無法
將舊提示套用至替代連線。早於統一核准方法的閘道會
退回使用已發佈的執行專用方法；如需保留終止狀態和更完整的跨介面結果，
則必須更新閘道。

## 選用的直接 Apple Watch 節點

直接模式會讓手錶擁有自己的已簽署節點身分與閘道連線。
只要 OpenClaw 處於啟用狀態，即使已配對的 iPhone 無法使用，
支援的節點命令仍可透過手錶的 Wi-Fi 或行動網路運作。

需求：

- iPhone 已使用 `operator.admin` 範圍連線至閘道。
- 設定碼會公布一個具有 watchOS 信任憑證的 `wss://` 閘道端點；
  手錶會輪詢對應的 `https://` 來源。不支援純 HTTP，也不支援
  自簽或僅使用指紋的信任方式。端點設定請參閱[閘道擁有的
  配對](/zh-TW/gateway/pairing)。回送位址、僅限 iPhone 和僅限 tailnet 的路由，
  手錶無法獨立連線。
- 使用行動網路需要支援行動網路且已啟用服務的 Apple Watch。
- OpenClaw 在手錶上處於啟用狀態。Apple 不允許一般 watchOS App
  維持通用 WebSocket/TCP 連線，因此直接節點會使用短輪詢 HTTPS，
  並在 App 回到前景時重新連線。請參閱 Apple 的
  [watchOS 低階網路指引](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

設定：

1. 在 iPhone 上，開啟 **設定 -> Apple Watch**。
2. 點選 **啟用直接閘道連線**。
3. 在短效設定碼到期前，於手錶上開啟 OpenClaw。
4. 使用 `openclaw nodes status` 驗證獨立的 Apple Watch 列。

設定碼包含短效、僅限節點的啟動認證資訊；在其到期前，
請像密碼一樣保護它。它絕不包含 iPhone 已儲存的閘道
密碼或權杖。配對後，手錶會儲存自己的裝置權杖，並
刪除啟動認證資訊。直接模式僅涵蓋下列命令。
聊天、對話、核准以及現有的 `watch.*` 通知流程仍為
iPhone 中繼功能，且仍需要已配對的 iPhone。

直接 watchOS 節點命令：

| 介面          | 命令                           | 備註                                                     |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 裝置          | `device.info`, `device.status` | 手錶身分、電池、溫度、儲存空間與網路。                   |
| 通知          | `system.notify`                | App 處於啟用狀態時；需要手錶權限。                       |

watchOS 不向第三方 App 提供 WebKit，因此直接 Watch 節點
不會公布 Canvas 命令。

## 官方建置版本的中繼支援推播

官方發佈的 iOS 建置版本使用外部推播中繼，而不會將原始 APNs 權杖發佈至閘道。公開發佈通路的官方 App Store 建置版本使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基底 URL 已針對 App Store 發佈硬式編碼，不會讀取任何覆寫值。

自訂中繼部署需要刻意採用獨立的 iOS 建置／部署路徑，其中繼 URL 必須與閘道中繼 URL 相符。App Store 發佈通路絕不接受自訂中繼 URL。如果你使用自訂中繼建置版本，請設定相符的閘道中繼 URL：

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
- 中繼會傳回不透明的中繼控制代碼，以及限該註冊使用的傳送授權。
- iOS App 會擷取已配對的閘道身分（`gateway.identity.get`），並將其納入中繼註冊，讓中繼支援的註冊委派給該特定閘道。
- App 透過 `push.apns.register` 將該中繼支援的註冊轉送至已配對的閘道。
- 閘道使用已儲存的中繼控制代碼進行 `push.test`、背景喚醒及喚醒提示。
- 如果 App 之後連線至不同的閘道，或使用具有不同中繼基底 URL 的建置版本，它會重新整理中繼註冊，而不會重複使用舊的綁定。

此路徑中閘道**不**需要：部署範圍的中繼權杖，也不需要供官方 App Store 中繼支援傳送使用的直接 APNs 金鑰。

預期的操作員流程：

1. 安裝官方 iOS App。
2. 選用：僅在使用刻意獨立的自訂中繼建置版本時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 與閘道配對，並讓它完成連線。
4. 當 App 取得 APNs 權杖、操作員工作階段已連線，且中繼註冊成功後，就會發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒及喚醒提示即可使用已儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置變更事件喚醒應用程式時，應用程式會嘗試短暫重新連線節點，接著呼叫 `node.event` 並傳入 `event: "node.presence.alive"`。只有在已知通過驗證的節點裝置身分後，閘道才會將此資訊記錄為已配對節點／裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有在閘道回應包含 `handled: true` 時，應用程式才會將背景喚醒視為已成功記錄。較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不算持久的最後上線時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的臨時環境變數覆寫值（優先使用設定的路徑為 `gateway.push.apns.relay.baseUrl`）。
- App Store 發行版本的推播模式會硬編碼託管中繼站主機，絕不讀取中繼站 URL 覆寫值——建置階段環境變數 `OPENCLAW_PUSH_RELAY_BASE_URL` 僅影響本機／沙箱 iOS 建置模式。

## 驗證與信任流程

中繼站的存在是為了強制執行官方 iOS 建置版本無法透過閘道直接連線 APNs 所提供的兩項限制：

- 只有由 Apple 散布的正版 OpenClaw iOS 建置版本才能使用託管中繼站。
- 閘道只能為已與該特定閘道配對的 iOS 裝置傳送由中繼站支援的推播。

逐段流程：

1. `iOS app -> gateway`：應用程式透過一般閘道驗證流程與閘道配對，取得通過驗證的節點工作階段及通過驗證的操作員工作階段。操作員工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：應用程式透過 HTTPS 呼叫中繼站註冊端點，並提供 App Attest 證明及 StoreKit 應用程式交易 JWS。中繼站會驗證套件組合 ID、App Attest 證明及 Apple 散布證明，並要求使用官方／正式環境散布路徑——這正是阻止本機 Xcode／開發建置版本使用託管中繼站的機制，因為本機建置無法滿足官方 Apple 散布證明。
3. `gateway identity delegation`：在中繼站註冊之前，應用程式會從 `gateway.identity.get` 取得已配對閘道的身分，並將其納入中繼站註冊承載資料。中繼站會傳回中繼站控制代碼，以及委派給該閘道身分且限定於該註冊範圍的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼站控制代碼與傳送授權。在 `push.test`、重新連線喚醒及喚醒提示時，閘道會使用自己的裝置身分簽署傳送要求；中繼站會依據註冊時委派的閘道身分，驗證已儲存的傳送授權及閘道簽章。即使另一個閘道以某種方式取得該控制代碼，也無法重複使用已儲存的註冊。
5. `relay -> APNs`：中繼站持有正式環境 APNs 認證資訊，以及官方建置版本的原始 APNs 權杖。對於由中繼站支援的官方建置版本，閘道絕不儲存原始 APNs 權杖；中繼站會代表已配對閘道將最終推播傳送至 APNs。

建立此設計的原因：避免將正式環境 APNs 認證資訊放入使用者閘道、避免在閘道上儲存官方建置版本的原始 APNs 權杖、僅允許官方 OpenClaw iOS 建置版本使用託管中繼站，以及防止某個閘道向屬於另一個閘道的 iOS 裝置傳送喚醒推播。

本機／手動建置版本仍會直接使用 APNs。如果你在不使用中繼站的情況下測試這些建置版本，閘道仍需要直接 APNs 認證資訊：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機的執行階段環境變數，而非 Fastlane 設定。`apps/ios/fastlane/.env` 僅儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 建置設定直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他供應商認證資訊一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，也不要將其放在存放庫簽出目錄下。

## 探索路徑

### Bonjour（區域網路）

iOS 應用程式會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在完成設定時，瀏覽相同的廣域 DNS-SD 探索網域。同一區域網路中的閘道會自動從 `local.` 顯示；跨網路探索可使用已設定的廣域網域，而不需變更信標類型。

### Tailnet（跨網路）

如果 mDNS 遭封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；例如：`openclaw.internal.`）及 Tailscale 分割 DNS。CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機／連接埠

在 Settings 中啟用 **Manual Host**，並輸入閘道主機與連接埠（預設為 `18789`）。

## 多個閘道

應用程式會保留已配對之所有閘道的登錄資料，因此你可以在它們之間切換，而不必重新配對：

- **Settings -> Gateway** 會顯示 **Paired Gateways** 清單，並標示使用中的閘道。點一下項目即可切換；應用程式會中斷目前的工作階段，並重新連線至所選閘道。配對超過一個閘道時，連線列旁會顯示快速切換選單。
- 認證資訊、TLS 信任決策、各閘道偏好設定及快取的聊天記錄會依閘道分別儲存。切換時絕不會混用不同閘道的狀態，且推播註冊會跟隨使用中的閘道。
- 滑動已配對的閘道（或使用其內容選單）以 **Forget** 該閘道，這會移除其認證資訊、裝置權杖、TLS 釘選及快取的聊天內容。
- 探索到的閘道必須在網路上可見，才能切換至該閘道；手動設定的閘道則會透過已儲存的主機和連接埠重新連線。

## Canvas + A2UI

iOS 節點會呈現 WKWebView Canvas。使用 `node.invoke` 控制它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道 Canvas 主機會從閘道 HTTP 伺服器（與 `gateway.port` 使用相同連接埠，預設為 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會將內建基礎介面保留為連線後的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用隨附、由應用程式擁有的 A2UI 頁面。
- 在 iOS 上，遠端閘道 A2UI 頁面僅供呈現；只有來自隨附、由應用程式擁有之頁面的原生 A2UI 按鈕動作才會被接受。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建基礎介面。

## 與 Computer Use 的關係

iOS 應用程式是行動節點介面，而不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS 應用程式則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理程式仍可透過 OpenClaw 呼叫節點命令來操作 iOS 應用程式，但這些呼叫會經過閘道節點通訊協定，並受 iOS 前景／背景限制。若要控制本機桌面，請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)；若要瞭解 iOS 節點功能，請參閱本頁。

### Canvas 求值／快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒與對話模式

- 語音喚醒與對話模式可在 Settings 中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話功能的 iOS 節點會宣告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；對於受信任且支援對話功能的節點，閘道預設允許這些即按即說命令。
- iOS 可能會暫停背景音訊；應用程式未啟用時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式帶至前景（Canvas／相機／螢幕命令需要它位於前景）。
- `A2UI_HOST_UNAVAILABLE`：應用程式 WebView 無法連線至隨附的 A2UI 頁面；請讓應用程式維持在前景並停留於 Screen 分頁，然後重試。
- 配對提示始終未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示任何 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對為 false，請在 Apple 的 Watch app 中配對
  Watch。如果安裝為 false，請從 **My Watch -> Available Apps** 安裝配套應用程式。
  完成任一變更後，在 Watch 上開啟 OpenClaw 一次；立即連線仍需要兩個應用程式都在執行，
  而排入佇列的更新之後仍可在背景送達。
- 重新安裝後無法重新連線：鑰匙圈中的配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
