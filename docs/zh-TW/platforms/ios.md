---
read_when:
    - 配對或重新連線 iOS 節點
    - 啟用或疑難排解直接連線的 Apple Watch 節點
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、Canvas 與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-22T13:19:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2b01a63fa1e2c445f7fb35843536f7f5918e94bfe885dac19c852d7d52d86342
    source_path: platforms/ios.md
    workflow: 16
---

可用性：為發行版本啟用時，iPhone App 建置版本會透過 Apple 管道發布。本機開發建置版本也可直接從原始碼執行。

## 功能

- 透過 WebSocket 連線至閘道（區域網路或 tailnet）。
- 提供節點功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒，以及選擇啟用的健康摘要。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 從代理程式介面（檔案）以唯讀方式瀏覽所選代理程式的工作區：逐層瀏覽目錄、具語法醒目提示的文字預覽、圖片預覽，以及透過分享表單匯出。不提供寫入操作；閘道會限制預覽大小。
- 為每個已配對的閘道保留少量唯讀的近期聊天工作階段與逐字記錄離線快取：冷啟動時會立即顯示最後已知的逐字記錄，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設／忘記操作會清除受保護的本機快取。
- 將中斷連線期間傳送的文字訊息排入每個閘道各自的持久寄件匣（最多 50 則）：已排入佇列的訊息泡泡會顯示在逐字記錄中，重新連線時依序送出並採用具冪等性的重試，且會持續保留，直到正式歷史記錄確認已傳送；在顯示重試／刪除動作前會採用退避機制重試；離線 48 小時後則會過期而不再傳送；重設／忘記操作會連同快取一起清除佇列。
- 聊天是唯一的文字與語音介面。聊天動作可在不離開聊天的情況下開啟完整的工作階段畫面，並可顯示或隱藏助理的推理過程與工具活動。點一下麥克風可進行草稿聽寫；開啟其選單可錄製語音訊息；也可使用行內對話控制項進行即時語音對話。聆聽或說話時，對話控制項會根據即時麥克風或播放音量呈現動畫。
- 當操作員連線具有 `operator.admin`，且閘道支援 `openclaw.chat` 時，**設定 -> OpenClaw** 會開啟專用的閘道設定助理。其設定對話與一般聊天分開，會在本機遮蔽機密回覆，而且只有在你點選 **開啟聊天** 後才會移至聊天。
- 可依需求朗讀助理訊息：在聊天中長按訊息並選擇 **聆聽**。App 會使用已設定的 TTS 提供者播放閘道支援的 `tts.speak` 音訊片段；若閘道音訊無法取得或播放，則改用裝置端語音。切換工作階段或 App 進入背景時會停止播放。

## 需求

- 在另一部裝置上執行的閘道（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 位於相同區域網路，**或**
  - 透過單播 DNS-SD 位於 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動指定主機／連接埠（備援）。

## 快速開始（配對並連線）

首次啟動時，App 會顯示簡短的配對說明和
權限頁面（通知、相機、麥克風、照片、聯絡人、
行事曆、提醒事項、位置）。所有授權皆為選用，之後可在
**設定** -> **權限** 或 iOS 的 Settings App 中變更。

1. 啟動已驗證身分且手機能夠連線的閘道。建議的遠端路徑是 Tailscale
   Serve：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的相同區域網路設定，請改用已驗證身分的 `gateway.bind: "lan"`。
預設的回送位址繫結無法由手機連線。如果尚未設定
閘道，請先執行 `openclaw onboard`，讓設定碼
建立程序具備權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選擇 **節點**，然後在
   **裝置** 頁面上按一下 **配對行動裝置**。建議使用完整存取權，
   且預設會選取此選項；只有在你想略過閘道管理控制項時，
   才選擇受限存取權，然後按一下 **建立設定碼**。

3. 在 iOS App 中開啟 **設定** -> **閘道**，掃描 QR Code（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路與 Tailscale Serve 路徑，App
   會依序探測，並儲存第一個可連線的端點。

   已配對的閘道會保留在 **閘道** 清單中。勾號表示
   目前聚焦的閘道；使用其他資料列上的閃電控制項，可讓其
   操作員工作階段同時保持連線。切換焦點不會
   中斷其他已啟用閘道的連線。只有目前聚焦的閘道會接收
   帶有 iPhone 功能的節點工作階段，因此相機、螢幕、位置及
   其他裝置命令始終只有一個明確的擁有者。App 進入背景後，
   iOS 可能會暫停這些前景連線。

4. 官方 App 會自動連線。如果 **等待核准** 顯示
   請求，請先檢視其角色與範圍再予以核准。

   **設定 → 閘道** 會顯示已儲存的操作員連線具有
   **完整** 或 **受限** 存取權。為確保持有者權杖安全，明文區域網路 `ws://` 設定會自動
   受到限制。如果存取權受限，請設定 `wss://` 或
   Tailscale Serve，從控制介面或 `openclaw qr` 掃描新的完整存取權設定碼，
   然後重新連線以啟用設定與升級功能。

控制介面按鈕需要已有具備 `operator.admin` 的已配對工作階段。
如需使用終端機備援方式，請在 iOS App 中選擇已探索到的閘道（或啟用
手動主機並輸入主機／連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用已變更的驗證詳細資料（角色／範圍／公開金鑰）重試配對，先前等待中的請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格控管的子網路連線，你可以透過明確的 CIDR 或確切 IP 位址，選擇啟用首次節點自動核准：

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

此功能預設停用。它僅適用於未要求任何範圍的全新 `role: node` 配對。操作員／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 健康摘要

iOS 節點可傳回選擇啟用且唯讀的當前
日曆日 HealthKit 彙總資料。iOS 裝置同意與明確的閘道命令授權是
彼此獨立的關卡。設定、叫用、承載資料欄位、隱私權行為及疑難排解，請參閱
[HealthKit 摘要](/zh-TW/platforms/ios-healthkit)。

Apple Watch 輔助 App 預設會繼續使用現有的 iPhone 中繼，
不需要另行與閘道配對。請在 Apple 的 Watch App 中將 Watch 與 iPhone 配對，
從 **Watch app -> My Watch -> Available
Apps** 安裝 OpenClaw，然後在兩部裝置上各開啟一次 OpenClaw。

## 審查命令核准

具有 `operator.admin` 的操作員連線，或由閘道明確指定的
已配對 `operator.approvals` 連線，可以在 iPhone 上審查
等待中的執行請求。核准卡片會顯示閘道經過清理的
命令預覽、警告、主機情境、到期時間，以及該請求所提供的
決定選項。已配對的 Apple Watch 會透過現有的 iPhone 中繼收到相同的
審查者安全提示，並提供精簡的僅允許一次／拒絕決定選項。Watch 直接連線閘道模式不會
傳遞核准提示。

核准狀態會與控制介面及支援的聊天介面共用。
第一個提交的回答生效。在其他介面解決請求後、收到遠端
已解決通知後，以及解決確認可能遺失時，iPhone 與 Watch 都會擷取閘道的正式
終端記錄。在該回讀確認請求是否
仍處於等待狀態前，動作會保持不可用。

核准擁有權會繫結至所選的閘道。切換閘道時，無法
將舊提示套用至替代連線。早於統一核准方法的
閘道會改用已發布的執行專用方法；
若要保留終端狀態及取得更豐富的跨介面結果，則需更新
閘道。

## 回答代理程式問題

對於具有 `operator.questions`（或 `operator.admin`）的操作員連線，
聊天會將等待中的閘道問題顯示為原生卡片。卡片支援單選與
多選選項、選項說明、自由文字 **其他** 回答，以及
到期倒數計時。重新連線時會從閘道重新載入等待中的問題。當此裝置
回答問題、其他介面先回答問題，或問題到期或遭取消時，卡片
會被鎖定。

## 選用的 Apple Watch 直接節點

直接模式會為 Watch 提供其專屬的已簽署節點身分與閘道連線。
當 OpenClaw 處於作用中時，即使已配對的 iPhone 無法使用，
支援的節點命令仍可透過 Watch Wi-Fi 或行動網路運作。

需求：

- iPhone 已使用 `operator.admin` 範圍連線至閘道。
- 設定碼會公告一個 `wss://` 閘道端點，其憑證須受 watchOS 信任；
  Watch 會輪詢對應的 `https://` 來源。不支援純 HTTP，
  以及僅自我簽署或僅指紋信任。端點設定請參閱[閘道擁有的
  配對](/zh-TW/gateway/pairing)。Watch 無法獨立連線至回送位址、僅限 iPhone
  及僅限 tailnet 的路徑。
- 使用行動網路需要具備行動網路功能且服務已啟用的 Apple Watch。
- OpenClaw 在 Watch 上處於作用中。Apple 不允許一般 watchOS App
  保持通用 WebSocket/TCP 連線，因此直接節點會使用短週期 HTTPS
  輪詢，並在 App 返回前景時重新連線。請參閱 Apple 的
  [watchOS 低階網路指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

設定：

1. 在 iPhone 上開啟 **設定 -> Apple Watch**。
2. 點選 **啟用直接閘道連線**。
3. 在短效設定碼到期前，於 Watch 上開啟 OpenClaw。
4. 使用 `openclaw nodes status` 驗證獨立的 Apple Watch 資料列。

設定碼包含短效且僅限節點使用的啟動認證資訊；在其到期前，
請將它視同密碼。它絕不包含 iPhone 已儲存的閘道
密碼或權杖。配對後，Watch 會儲存自己的裝置權杖，並
刪除啟動認證資訊。直接模式僅涵蓋下列命令。
聊天、對話、核准及現有的 `watch.*` 通知流程仍屬於
iPhone 中繼功能，且仍需要已配對的 iPhone。

直接 watchOS 節點命令：

| 介面          | 命令                           | 備註                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 裝置          | `device.info`、`device.status` | Watch 身分、電池、溫度、儲存空間及網路。                |
| 通知          | `system.notify`                | App 處於作用中時可用；需要 Watch 權限。                 |

watchOS 不向第三方 App 提供 WebKit，因此直接 Watch 節點
不會公告 Canvas 命令。

## 官方建置版本的中繼式推播

官方發布的 iOS 建置版本會使用外部推播中繼，而非將原始 APNs 權杖發布至閘道。來自公開發行管道的官方 App Store 建置版本會使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基礎 URL 針對 App Store 發布寫死，不會讀取任何覆寫值。

自訂中繼部署需要刻意採用獨立的 iOS 建置／部署路徑，其申請的中繼 URL 必須與閘道中繼 URL 相符。App Store 發行管道絕不接受自訂中繼 URL。如果你使用自訂中繼建置版本，請設定相符的閘道中繼 URL：

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

- iOS App 使用 App Attest 和 StoreKit App 交易 JWS 向中繼服務註冊。
- 中繼服務會傳回不透明的中繼控制代碼，以及僅限該次註冊使用的傳送授權。
- iOS App 會擷取已配對的閘道身分（`gateway.identity.get`），並將其納入中繼註冊，讓中繼支援的註冊委派給該特定閘道。
- App 會使用 `push.apns.register`，將該中繼支援的註冊轉送至已配對的閘道。
- 閘道會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 如果 App 之後連線至不同的閘道，或使用不同中繼基底 URL 的組建版本，便會重新整理中繼註冊，而不會重複使用舊的繫結。

此路徑中閘道**不**需要：不需要整個部署共用的中繼權杖，也不需要用於官方 App Store 中繼傳送的直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS App。
2. 選用：只有在刻意使用獨立的自訂中繼組建版本時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 與閘道配對，並等待其完成連線。
4. App 取得 APNs 權杖、操作者工作階段已連線，且中繼註冊成功後，便會發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示便可使用儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置變更事件喚醒 App 時，App 會嘗試短暫重新連線節點，接著以 `event: "node.presence.alive"` 呼叫 `node.event`。只有在得知已驗證的節點裝置身分後，閘道才會將此資訊記錄為已配對節點／裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，App 才會將背景喚醒視為已成功記錄。較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不算是持久的上次出現時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境變數覆寫使用（`gateway.push.apns.relay.baseUrl` 是設定優先的路徑）。
- App Store 發行組建版本的推播模式會將代管中繼主機寫死，且永遠不會讀取中繼 URL 覆寫——`OPENCLAW_PUSH_RELAY_BASE_URL` 組建階段環境變數只會影響本機／沙箱 iOS 組建模式。

## 驗證與信任流程

中繼服務的存在，是為了強制執行兩項官方 iOS 組建版本在閘道上直接使用 APNs 時無法提供的限制：

- 只有透過 Apple 發布的正版 OpenClaw iOS 組建版本才能使用代管中繼服務。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼支援的推播。

逐跳說明：

1. `iOS app -> gateway`：App 會透過一般的閘道驗證流程與閘道配對，取得已驗證的節點工作階段和已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：App 會透過 HTTPS 呼叫中繼註冊端點，並提供 App Attest 證明和 StoreKit App 交易 JWS。中繼服務會驗證套件識別碼、App Attest 證明和 Apple 發布證明，並要求使用官方／正式環境發布路徑——這會阻止本機 Xcode／開發組建版本使用代管中繼服務，因為本機組建無法滿足 Apple 官方發布證明。
3. `gateway identity delegation`：在中繼註冊之前，App 會從 `gateway.identity.get` 擷取已配對的閘道身分，並將其納入中繼註冊承載資料。中繼服務會傳回中繼控制代碼，以及委派給該閘道身分、僅限該次註冊使用的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的裝置身分簽署傳送要求；中繼服務會依據註冊時委派的閘道身分，同時驗證儲存的傳送授權與閘道簽章。即使另一個閘道設法取得該控制代碼，也無法重複使用儲存的註冊。
5. `relay -> APNs`：中繼服務持有正式環境 APNs 認證資訊，以及官方組建版本的原始 APNs 權杖。對於中繼支援的官方組建版本，閘道永遠不會儲存原始 APNs 權杖；中繼服務會代表已配對的閘道，將最終推播傳送至 APNs。

建立此設計的原因：讓正式環境 APNs 認證資訊不進入使用者閘道、避免在閘道上儲存官方組建版本的原始 APNs 權杖、僅允許官方 OpenClaw iOS 組建版本使用代管中繼服務，並防止某個閘道向另一個閘道所屬的 iOS 裝置傳送喚醒推播。

本機／手動組建版本仍會直接使用 APNs。如果你在沒有中繼服務的情況下測試這些組建版本，閘道仍需要直接 APNs 認證資訊：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機的執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 組建版本設定直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他提供者認證資訊一致：

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

iOS App 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在完成設定時，同時瀏覽相同的廣域 DNS-SD 探索網域。同一區域網路上的閘道會透過 `local.` 自動顯示；跨網路探索可使用設定的廣域網域，而不必變更信標類型。

### Tailnet（跨網路）

如果 mDNS 遭到封鎖，請使用單播 DNS-SD 區域（選擇一個網域；例如：`openclaw.internal.`）和 Tailscale 分割 DNS。如需 CoreDNS 範例，請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機／連接埠

在 Settings 中啟用 **Manual Host**，並輸入閘道主機與連接埠（預設為 `18789`）。

## 多個閘道

App 會保留所有已配對閘道的登錄資料，因此你可以在它們之間切換，而不必再次配對：

- **Settings -> Gateway** 會顯示 **Paired Gateways** 清單，並標示使用中的閘道。輕觸項目即可切換；App 會中斷目前的工作階段，並重新連線至選取的閘道。配對超過一個閘道時，連線列旁會顯示快速切換選單。
- 認證資訊、TLS 信任決策、各閘道偏好設定和快取的聊天記錄會分別依閘道儲存。切換時絕不會混用不同閘道的狀態，推播註冊也會跟隨使用中的閘道。
- 滑動已配對的閘道（或使用其內容選單）以 **Forget** 該閘道，這會移除其認證資訊、裝置權杖、TLS 釘選和快取的聊天記錄。
- 若要切換至探索到的閘道，該閘道必須可在網路上看見；手動閘道則會使用儲存的主機與連接埠重新連線。

## Canvas + A2UI

iOS 節點會呈現 WKWebView Canvas。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道 Canvas 主機會從閘道 HTTP 伺服器（與 `gateway.port` 使用相同連接埠，預設為 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會將內建基礎介面保留為連線後的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 會使用隨附、由 App 擁有的 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供呈現；只有隨附、由 App 擁有的頁面才能接受原生 A2UI 按鈕動作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建基礎介面。

## 與 Computer Use 的關係

iOS App 是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS App 則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理程式仍可透過 OpenClaw 呼叫節點命令來操作 iOS App，但這些呼叫會經過閘道節點通訊協定，並受 iOS 前景／背景限制約束。如需本機桌面控制，請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)；如需 iOS 節點功能，請參閱本頁。

### Canvas 求值／快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒與交談模式

- 語音喚醒和交談模式可在 Settings 中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時交談會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[交談模式](/zh-TW/nodes/talk)。
- 支援交談的 iOS 節點會公告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；閘道預設允許受信任且支援交談的節點使用這些按住交談命令。
- iOS 可能會暫停背景音訊；當 App 非使用中時，語音功能應視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS App 切換至前景（Canvas／相機／螢幕命令需要在前景執行）。
- `A2UI_HOST_UNAVAILABLE`：App WebView 無法存取隨附的 A2UI 頁面；請讓 App 保持在前景的 Screen 分頁，然後重試。
- 配對提示一直未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對為 false，請在 Apple 的 Watch App 中配對
  Watch。如果安裝為 false，請從 **My Watch -> Available Apps** 安裝
  配套 App。任一項變更完成後，請在 Watch 上開啟 OpenClaw 一次；
  若要立即連線，兩個 App 仍須同時執行，而排入佇列的更新則可稍後在背景抵達。
- 重新安裝後無法重新連線：鑰匙圈中的配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
