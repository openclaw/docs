---
read_when:
    - 配對或重新連線 iOS 節點
    - 啟用或疑難排解直接連線的 Apple Watch 節點
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或 Canvas 命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-21T09:02:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb768b5fd67d44c2e576a06fe6a39c406cf7b64227bbd9a91f930c0d0bbead61
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個版本時，iPhone App 組建會透過 Apple 管道發佈。本機開發組建也可以從原始碼執行。

## 功能

- 透過 WebSocket 連線至閘道（區域網路或 tailnet）。
- 提供節點功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒，以及選擇啟用的健康摘要。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 從代理程式介面（檔案）以唯讀方式瀏覽所選代理程式的工作區：逐層瀏覽目錄、顯示語法突顯的文字預覽、圖片預覽，以及透過分享表單匯出。不提供寫入操作；閘道會限制預覽大小。
- 為每個已配對的閘道保留近期聊天工作階段與逐字稿的小型唯讀離線快取：冷啟動時會立即顯示最後已知的逐字稿，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設／忘記則會清除受保護的本機快取。
- 將中斷連線期間傳送的文字訊息排入每個閘道各自的持久寄件匣（最多 50 則）：排隊中的訊息泡泡會顯示在逐字稿中，重新連線時依序送出並進行具冪等性的重試，在標準歷程記錄確認傳送前都會持久保留；先以退避機制重試，再顯示重試／刪除操作；離線超過 48 小時後會過期而不再傳送；重設／忘記會連同快取一起清除佇列。
- 聊天是統一的文字與語音介面。聊天操作可在不離開聊天的情況下開啟完整的工作階段畫面，也可顯示或隱藏助理推理和工具活動。點一下麥克風可進行草稿聽寫，開啟其選單可錄製語音訊息，或使用內嵌的對話控制項進行即時語音；聆聽或說話時，對話控制項會依即時麥克風或播放音量顯示動畫。
- 可依需求朗讀助理訊息：在聊天中長按訊息並選擇 **聆聽**。App 會使用已設定的 TTS 提供者播放閘道支援的 `tts.speak` 音訊片段；若閘道音訊無法使用或播放，則改用裝置端語音。切換工作階段或 App 進入背景時會停止播放。

## 需求

- 在另一部裝置上執行的閘道（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用相同區域網路，**或**
  - 透過單點傳播 DNS-SD 使用 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動指定主機／連接埠（備援）。

## 快速開始（配對並連線）

首次啟動時，App 會顯示簡短的配對說明與
權限頁面（通知、相機、麥克風、照片、聯絡人、
行事曆、提醒事項、位置）。所有權限皆為選用，之後可在
**設定** -> **權限** 或 iOS「設定」App 中變更。

1. 啟動具備認證且路由可供手機連線的閘道。建議使用 Tailscale
   Serve 作為遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的同區域網路設定，請改用具備認證的 `gateway.bind: "lan"`。
預設的迴路介面繫結無法供手機連線。如果
尚未設定閘道，請先執行 `openclaw onboard`，讓設定碼
建立流程具有權杖或密碼認證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選取 **節點**，然後在
   **裝置** 頁面上按一下 **配對行動裝置**。建議使用完整存取權，
   且預設會選取此選項；只有在要省略
   閘道管理控制項時才選擇有限存取權，然後按一下 **建立設定碼**。

3. 在 iOS App 中開啟 **設定** -> **閘道**，掃描 QR 圖碼（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路和 Tailscale Serve 路由，App
   會依序探測，並儲存第一個可連線的端點。

   已配對的閘道會保留在 **閘道** 清單中。勾號表示
   目前聚焦的閘道；使用其他資料列上的閃電控制項，可同時讓其
   操作員工作階段保持連線。切換焦點不會
   中斷其他已啟用閘道的連線。只有聚焦的閘道會接收
   iPhone 具備功能的節點工作階段，因此相機、螢幕、位置和
   其他裝置命令始終只有一個明確的擁有者。App 進入背景後，iOS 可能會暫停
   這些前景連線。

4. 官方 App 會自動連線。如果 **待核准** 顯示
   要求，請先檢閱其角色與範圍再核准。

   **設定 → 閘道** 會顯示已儲存的操作員連線具有
   **完整** 或 **有限** 存取權。為確保持有者權杖安全，明文區域網路 `ws://` 設定會自動
   限制存取權。若為有限存取權，請設定 `wss://` 或
   Tailscale Serve，從控制介面或 `openclaw qr` 掃描新的完整存取權代碼，
   然後重新連線，以啟用設定和升級。

控制介面按鈕需要已有具備 `operator.admin` 的配對工作階段。
若要使用終端機備援方式，請在 iOS App 中選擇已探索到的閘道（或啟用
「手動主機」並輸入主機／連接埠），然後在閘道主機上核准要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用已變更的認證詳細資料（角色／範圍／公開金鑰）重試配對，先前待處理的要求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從受到嚴格控管的子網路連線，你可以使用明確的 CIDR 或確切 IP 位址，選擇啟用首次節點自動核准：

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

iOS 節點可以傳回選擇啟用、唯讀的當前
日曆日 HealthKit 彙總資料。iOS 裝置同意與明確的閘道命令授權
是彼此獨立的關卡。請參閱 [HealthKit 摘要](/zh-TW/platforms/ios-healthkit)，瞭解
設定、叫用、承載資料欄位、隱私權行為及疑難排解。

Apple Watch 隨附 App 預設會繼續使用現有的 iPhone 中繼，
不需要另外與閘道配對。請在 Apple 的 Watch App 中將 Watch 與 iPhone 配對，
從 **Watch app -> My Watch -> Available
Apps** 安裝 OpenClaw，然後在兩部裝置上各開啟一次 OpenClaw。

## 檢閱命令核准

具有 `operator.admin` 的操作員連線，或由閘道明確指定的
已配對 `operator.approvals` 連線，可以在 iPhone 上檢閱
待處理的執行要求。核准卡片會顯示閘道
經過清理的命令預覽、警告、主機內容、到期時間，以及該要求提供的
決策選項。已配對的 Apple Watch 會透過現有的 iPhone 中繼接收相同的
審查者安全提示，並提供精簡的
僅允許一次／拒絕決策子集。Watch 直接閘道模式不會傳送
核准提示。

核准狀態會與控制介面及支援的聊天介面共用。
第一個提交的答案生效。在其他介面解決要求後、收到遠端
已解決通知後，以及解決確認可能
遺失時，iPhone 和 Watch 都會擷取閘道的標準
終止記錄。在讀回確認
要求是否仍待處理前，操作皆維持停用。

核准擁有權會繫結至所選閘道。切換閘道無法
將舊提示套用至替換後的連線。早於統一核准方法的
閘道會改用已發佈的執行專用方法；
若要保留終止狀態及取得更豐富的跨介面結果，則需更新
閘道。

## 回答代理程式問題

對於具有 `operator.questions`（或 `operator.admin`）的操作員連線，
聊天會將待處理的閘道問題顯示為原生卡片。卡片支援單選與
多選選項、選項說明、自由文字 **其他** 答案，以及
到期倒數計時。重新連線會從閘道重新載入待處理問題。當此裝置回答問題、
其他介面先回答、問題到期或遭取消時，卡片
便會鎖定。

## 選用的 Apple Watch 直接節點

直接模式會為 Watch 提供專屬的已簽署節點身分和閘道連線。
當 OpenClaw 處於使用中狀態時，即使已配對的 iPhone 無法使用，
支援的節點命令仍可透過 Watch 的 Wi-Fi 或行動網路運作。

需求：

- iPhone 已使用 `operator.admin` 範圍連線至閘道。
- 設定碼會公告具備 watchOS 信任憑證的 `wss://` 閘道端點；
  Watch 會輪詢相應的 `https://` 來源。不支援純 HTTP，
  也不支援自我簽署或僅使用指紋的信任方式。請參閱[閘道擁有的
  配對](/zh-TW/gateway/pairing)，瞭解端點設定。迴路介面、僅供 iPhone 使用及
  僅限 tailnet 的路由無法由 Watch 獨立連線。
- 使用行動網路需要具備行動網路功能且已啟用服務的 Apple Watch。
- OpenClaw 在 Watch 上處於使用中狀態。Apple 不允許一般 watchOS App
  維持通用 WebSocket/TCP 連線，因此直接節點會使用短暫的 HTTPS
  輪詢，並在 App 返回前景時重新連線。請參閱 Apple 的
  [watchOS 低階網路指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

設定：

1. 在 iPhone 上開啟 **設定 -> Apple Watch**。
2. 點一下 **啟用直接閘道連線**。
3. 在短效設定碼到期前，於 Watch 上開啟 OpenClaw。
4. 使用 `openclaw nodes status` 驗證獨立的 Apple Watch 資料列。

設定碼包含短效、僅限節點使用的啟動認證資訊；在其
到期前，請將其視同密碼。它絕不會包含 iPhone 已儲存的閘道
密碼或權杖。配對後，Watch 會儲存自己的裝置權杖並
刪除啟動認證資訊。直接模式僅涵蓋下列命令。
聊天、對話、核准及現有的 `watch.*` 通知流程仍屬於
iPhone 中繼功能，且仍需要已配對的 iPhone。

直接 watchOS 節點命令：

| 介面          | 命令                           | 備註                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 裝置          | `device.info`、`device.status` | Watch 身分、電池、溫度、儲存空間及網路。               |
| 通知          | `system.notify`                | App 處於使用中狀態時；需要 Watch 權限。                 |

watchOS 不向第三方 App 提供 WebKit，因此直接 Watch 節點
不會公告 Canvas 命令。

## 官方組建的中繼支援推播

官方發佈的 iOS 組建會使用外部推播中繼，而非將原始 APNs 權杖發佈至閘道。公開發佈管道中的官方 App Store 組建使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基礎 URL 會硬式編碼供 App Store 發佈使用，且不會讀取任何覆寫值。

自訂中繼部署需要刻意採用獨立的 iOS 組建／部署路徑，其​​中繼 URL 必須與閘道中繼 URL 相符。App Store 發佈管道絕不接受自訂中繼 URL。如果你使用自訂中繼組建，請設定相符的閘道中繼 URL：

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
- 中繼服務會傳回不透明的中繼控制代碼，以及限定於該次註冊範圍的傳送授權。
- iOS App 會取得已配對的閘道身分（`gateway.identity.get`），並在向中繼服務註冊時包含該身分，讓中繼支援的註冊委派給該特定閘道。
- App 使用 `push.apns.register`，將該中繼支援的註冊轉送至已配對的閘道。
- 閘道會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 如果 App 之後連線至其他閘道，或連線至使用不同中繼服務基底 URL 的組建版本，它會重新整理中繼服務註冊，而不會重複使用舊的繫結。

此路徑中，閘道**不**需要：全部署共用的中繼服務權杖，以及用於官方 App Store 中繼支援傳送的直接 APNs 金鑰。

預期的操作流程：

1. 安裝官方 iOS App。
2. 選用：只有在刻意使用獨立的自訂中繼服務組建版本時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 與閘道配對，並讓它完成連線。
4. 取得 APNs 權杖、操作者工作階段完成連線，且中繼服務註冊成功後，App 會發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示便可使用已儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置變更事件而喚醒 App 時，App 會嘗試短暫重新連線至節點，接著使用 `event: "node.presence.alive"` 呼叫 `node.event`。只有在得知已驗證的節點裝置身分後，閘道才會將此資訊記錄為已配對節點／裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，App 才會將背景喚醒視為已成功記錄。舊版閘道可能會使用 `{ "ok": true }` 確認 `node.event`；此回應相容，但不會算作持久的上次出現時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境變數覆寫（優先使用設定的路徑是 `gateway.push.apns.relay.baseUrl`）。
- App Store 發行組建版本的推播模式會硬式編碼代管中繼服務主機，絕不會讀取中繼服務 URL 覆寫；建置階段的環境變數 `OPENCLAW_PUSH_RELAY_BASE_URL` 只會影響本機／沙箱 iOS 組建模式。

## 驗證與信任流程

中繼服務的存在，是為了強制執行官方 iOS 組建版本中，直接由閘道使用 APNs 無法提供的兩項限制：

- 只有透過 Apple 發布的正版 OpenClaw iOS 組建版本可以使用代管中繼服務。
- 閘道只能針對與該特定閘道配對的 iOS 裝置，傳送中繼支援的推播。

逐段流程：

1. `iOS app -> gateway`：App 透過一般閘道驗證流程與閘道配對，取得已驗證的節點工作階段及已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：App 透過 HTTPS 呼叫中繼服務註冊端點，並提供 App Attest 證明和 StoreKit App 交易 JWS。中繼服務會驗證套件組合 ID、App Attest 證明和 Apple 發布證明，且要求使用官方／正式環境發布路徑；這會阻止本機 Xcode／開發組建版本使用代管中繼服務，因為本機組建版本無法提供符合要求的官方 Apple 發布證明。
3. `gateway identity delegation`：向中繼服務註冊前，App 會從 `gateway.identity.get` 取得已配對的閘道身分，並將其包含在中繼服務註冊承載資料中。中繼服務會傳回中繼控制代碼，以及委派給該閘道身分、限定於該次註冊範圍的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。進行 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的裝置身分簽署傳送要求；中繼服務會根據註冊時委派的閘道身分，同時驗證已儲存的傳送授權和閘道簽章。即使其他閘道以某種方式取得該控制代碼，也無法重複使用已儲存的註冊。
5. `relay -> APNs`：中繼服務持有正式環境 APNs 認證資訊，以及官方組建版本的原始 APNs 權杖。對於由中繼支援的官方組建版本，閘道絕不會儲存原始 APNs 權杖；中繼服務會代表已配對的閘道，將最終推播傳送至 APNs。

此設計的目的：避免在使用者閘道中存放正式環境 APNs 認證資訊、避免在閘道中儲存官方組建版本的原始 APNs 權杖、只允許官方 OpenClaw iOS 組建版本使用代管中繼服務，並防止某個閘道將喚醒推播傳送至屬於其他閘道的 iOS 裝置。

本機／手動組建版本仍會直接使用 APNs。如果你不透過中繼服務測試這些組建版本，閘道仍需要直接 APNs 認證資訊：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 組建版本設定直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他供應商認證資訊一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，或將它放在儲存庫簽出目錄下。

## 探索路徑

### Bonjour（區域網路）

iOS App 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在完成設定時瀏覽相同的廣域 DNS-SD 探索網域。同一區域網路中的閘道會透過 `local.` 自動出現；跨網路探索可使用已設定的廣域網域，而不必變更信標類型。

### Tailnet（跨網路）

如果 mDNS 遭封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；例如：`openclaw.internal.`）和 Tailscale 分割 DNS。CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機／連接埠

在 Settings 中啟用 **Manual Host**，然後輸入閘道主機與連接埠（預設為 `18789`）。

## 多個閘道

App 會保留所有已配對閘道的登錄資料，因此你可以在它們之間切換，而不必重新配對：

- **Settings -> Gateway** 會顯示 **Paired Gateways** 清單，並標示目前使用中的閘道。點一下項目即可切換；App 會中斷目前的工作階段，並重新連線至所選閘道。配對多個閘道時，連線列旁會出現快速切換選單。
- 認證資訊、TLS 信任決策、各閘道偏好設定，以及快取的聊天記錄，都會按閘道分別儲存。切換時絕不會混用不同閘道的狀態，推播註冊也會跟隨目前使用中的閘道。
- 滑動已配對的閘道（或使用其內容選單）並選擇 **Forget**，即可移除其認證資訊、裝置權杖、TLS 釘選和快取的聊天記錄。
- 若要切換至探索到的閘道，該閘道必須在網路上可見；手動閘道則會使用已儲存的主機和連接埠重新連線。

## Canvas + A2UI

iOS 節點會呈現 WKWebView 畫布。使用 `node.invoke` 控制它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會透過閘道 HTTP 伺服器（與 `gateway.port` 使用相同連接埠，預設為 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會保留內建基架作為連線後的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 會使用隨附且由 App 持有的 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供呈現；只有隨附且由 App 持有的頁面才能使用原生 A2UI 按鈕動作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建基架。

## 與 Computer Use 的關係

iOS App 是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS App 則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫節點命令來操作 iOS App，但這些呼叫會經由閘道節點通訊協定，並受 iOS 前景／背景限制約束。本機桌面控制請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)，iOS 節點功能則請參閱此頁面。

### 畫布求值／快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒與對話模式

- 語音喚醒與對話模式可在 Settings 中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用由用戶端持有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道持有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話的 iOS 節點會公告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；對於受信任且支援對話的節點，閘道預設允許這些按住說話命令。
- iOS 可能會暫停背景音訊；App 未處於使用中狀態時，語音功能僅能盡力提供。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS App 切換至前景（畫布／相機／螢幕命令需要 App 位於前景）。
- `A2UI_HOST_UNAVAILABLE`：App WebView 無法連線至隨附的 A2UI 頁面；讓 App 保持在前景並停留於 Screen 分頁，然後重試。
- 配對提示始終未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對狀態為 false，請在 Apple 的 Watch App 中配對
  Watch。如果安裝狀態為 false，請從 **My Watch -> Available Apps** 安裝配套
  App。完成任一變更後，請在 Watch 上開啟 OpenClaw 一次；即時連線能力仍要求兩個 App 都在執行，
  而佇列中的更新則可稍後在背景抵達。
- 重新安裝後無法重新連線：鑰匙圈中的配對權杖已被清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
