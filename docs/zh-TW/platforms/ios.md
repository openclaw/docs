---
read_when:
    - 配對或重新連線 iOS 節點
    - 啟用或疑難排解直接連線的 Apple Watch 節點
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-19T13:53:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: edd6a59edb656355e8b524cbd796452c0877264e28ca75f02a564929bcfa89b1
    source_path: platforms/ios.md
    workflow: 16
---

可用性：當發行版本啟用時，iPhone App 組建會透過 Apple 管道散布。本機開發組建也可以直接從原始碼執行。

## 功能

- 透過 WebSocket 連線至閘道（區域網路或 tailnet）。
- 公開節點功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒，以及選擇啟用的健康摘要。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 從 Agents 介面（Files）以唯讀方式瀏覽所選代理程式的工作區：逐層瀏覽目錄、檢視含語法醒目提示的文字預覽、圖片預覽，以及透過分享表單匯出。不支援寫入操作；閘道會限制預覽大小。
- 針對每個已配對的閘道，保留近期聊天工作階段與逐字稿的小型唯讀離線快取：冷啟動時立即顯示最後已知的逐字稿，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設／忘記則會清除受保護的本機快取。
- 將中斷連線期間傳送的文字訊息，排入每個閘道各自的持久寄件匣（最多 50 則）：排入佇列的訊息泡泡會顯示在逐字稿中，重新連線時依序送出並進行冪等重試，在標準歷史記錄確認送達前會持續保留；在顯示重試／刪除動作前會先依退避機制重試；若離線超過 48 小時，訊息將過期而不再傳送；重設／忘記會連同快取一起清除佇列。
- 聊天是統一的文字與語音介面。聊天動作可在不離開聊天的情況下開啟完整的 Sessions 畫面，並可顯示或隱藏助理的推理與工具活動。點一下麥克風可進行草稿聽寫，開啟其選單可錄製語音訊息，或使用內嵌的對話控制項進行即時語音通話；在聆聽或說話時，對話控制項會依麥克風即時音量或播放音量顯示動畫。
- 依需求朗讀助理訊息：在聊天中長按訊息，然後選擇 **Listen**。App 會使用已設定的 TTS 供應商播放閘道支援的 `tts.speak` 音訊片段；如果閘道音訊無法使用或播放，則改用裝置端語音。切換工作階段或 App 進入背景時，播放會停止。

## 需求

- 閘道須在另一部裝置上執行（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用相同區域網路，**或**
  - 透過單點傳播 DNS-SD 使用 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動指定主機／連接埠（備援方式）。

## 快速開始（配對並連線）

首次啟動時，App 會顯示簡短的配對說明與
權限頁面（通知、相機、麥克風、照片、聯絡人、
行事曆、提醒事項、位置）。每項授權皆為選用，之後可在
**Settings** -> **Permissions** 或 iOS「設定」App 中變更。

1. 啟動已驗證的閘道，並設定手機可連線的路由。建議使用 Tailscale
   Serve 作為遠端連線路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是可信任的相同區域網路設定，請改用已驗證的 `gateway.bind: "lan"`。
預設的迴路介面繫結無法從手機存取。如果
尚未設定閘道，請先執行 `openclaw onboard`，讓設定碼
建立程序能使用權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選取 **Nodes**，然後在
   **Devices** 頁面按一下 **Pair mobile device**。建議使用完整存取權，
   且預設已選取；只有在你想省略
   閘道管理控制項時，才選擇 Limited access，然後按一下 **Create setup code**。

3. 在 iOS App 中開啟 **Settings** -> **Gateway**，掃描 QR Code（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路與 Tailscale Serve 路由，App
   會依序探測它們，並儲存第一個可連線的端點。

4. 官方 App 會自動連線。如果 **Pending approval** 顯示
   一項要求，請先檢查其角色與範圍，再予以核准。

   **Settings → Gateway** 會顯示已儲存的操作員連線具有
   **Full** 或 **Limited** 存取權。為確保持有人權杖的安全性，明文區域網路 `ws://` 設定會自動
   限制存取權。如果存取權受限，請設定 `wss://` 或
   Tailscale Serve，從控制介面或 `openclaw qr` 掃描新的完整存取設定碼，
   然後重新連線以啟用設定與升級。

控制介面按鈕需要已使用 `operator.admin` 配對的工作階段。
作為終端機備援方式，請在 iOS App 中選擇已探索到的閘道（或啟用
Manual Host 並輸入主機／連接埠），然後在閘道主機上核准要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用變更後的驗證詳細資料（角色／範圍／公開金鑰）重試配對，先前待處理的要求將被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從受到嚴格控管的子網路連線，你可以透過明確的 CIDR 或確切 IP，選擇啟用首次節點自動核准：

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

此功能預設停用。它僅適用於未要求任何範圍的全新 `role: node` 配對。操作員／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 健康摘要

iOS 節點可回傳選擇啟用且唯讀的當前
日曆日 HealthKit 彙總資料。iOS 裝置同意與明確的閘道命令授權是
彼此獨立的管控條件。設定、叫用、承載資料欄位、隱私行為與疑難排解，請參閱
[HealthKit 摘要](/zh-TW/platforms/ios-healthkit)。

Apple Watch 配套 App 預設會繼續使用現有的 iPhone 中繼，
不需要另行與閘道配對。請在 Apple 的 Watch App 中將 Watch 與 iPhone 配對，
從 **Watch app -> My Watch -> Available
Apps** 安裝 OpenClaw，然後在兩部裝置上各開啟一次 OpenClaw。

## 審查命令核准

具備 `operator.admin` 的操作員連線，或由閘道明確指定的已配對
`operator.approvals` 連線，可以在 iPhone 上審查
待處理的執行要求。核准卡片會顯示閘道提供的
經過清理的命令預覽、警告、主機情境、到期時間，以及該要求允許的
決策選項。已配對的 Apple Watch 會透過現有的 iPhone 中繼收到相同的
審查者安全提示，並提供精簡的
僅允許一次／拒絕決策選項。Apple Watch 直接連線閘道模式不會傳送
核准提示。

核准狀態會與控制介面及支援的聊天介面共用。
第一個已提交的答案生效。當其他介面解決要求、收到遠端
已解決通知，以及解決確認可能遺失時，iPhone 與 Watch 都會擷取閘道的標準
終止記錄。在該讀回確認要求是否
仍待處理之前，動作會維持無法使用。

核准的歸屬會綁定至所選的閘道。切換閘道時，無法將
舊提示套用至替代連線。早於統一核准方法的
閘道會改用已發布的執行專用方法；
若要保留終止狀態與取得更豐富的跨介面結果，則需要更新
閘道。

## 回答代理程式問題

對於具有 `operator.questions`（或 `operator.admin`）的操作員連線，
聊天會將待處理的閘道問題顯示為原生卡片。卡片支援單選與
多選選項、選項說明、自由文字 **Other** 答案，以及
到期倒數計時。重新連線時會從閘道重新載入待處理的問題。當
此裝置回答問題、其他介面先回答，或
問題到期或遭取消時，卡片會鎖定。

## 選用的 Apple Watch 直接節點

直接模式會為 Watch 提供自己的已簽署節點身分與閘道連線。
當 OpenClaw 處於使用中時，即使已配對的 iPhone 無法使用，
支援的節點命令仍可透過 Watch 的 Wi-Fi 或行動網路運作。

需求：

- iPhone 已使用 `operator.admin` 範圍連線至閘道。
- 設定碼會提供一個使用 watchOS 信任憑證的 `wss://` 閘道端點；
  Watch 會輪詢對應的 `https://` 來源。不支援純 HTTP，
  以及僅使用自我簽署或指紋信任的方式。端點設定請參閱[閘道擁有的
  配對](/zh-TW/gateway/pairing)。迴路、僅限 iPhone 及僅限 tailnet 的路由，
  Watch 都無法獨立連線。
- 使用行動網路需要具備行動網路功能且已啟用服務的 Apple Watch。
- OpenClaw 在 Watch 上處於使用中。Apple 不允許一般 watchOS App
  持續維持通用 WebSocket/TCP 連線，因此直接節點會使用短週期 HTTPS
  輪詢，並在 App 回到前景時重新連線。請參閱 Apple 的
  [watchOS 低階網路指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

設定：

1. 在 iPhone 上開啟 **Settings -> Apple Watch**。
2. 點一下 **Enable Direct Gateway Connection**。
3. 在短效設定碼到期前，於 Watch 上開啟 OpenClaw。
4. 使用 `openclaw nodes status` 驗證獨立的 Apple Watch 資料列。

設定碼包含短效且僅限節點使用的啟動認證資訊；在它
到期前，請將其視同密碼。它絕不包含 iPhone 已儲存的閘道
密碼或權杖。配對後，Watch 會儲存自己的裝置權杖，並
刪除啟動認證資訊。直接模式僅涵蓋下列命令。
聊天、對話、核准及現有的 `watch.*` 通知流程仍是
iPhone 中繼功能，且仍需要已配對的 iPhone。

watchOS 直接節點命令：

| 介面          | 命令                           | 備註                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 裝置          | `device.info`、`device.status` | Watch 身分、電池、溫度、儲存空間及網路。               |
| 通知          | `system.notify`                | App 處於使用中時；需要 Watch 權限。                     |

watchOS 不向第三方 App 公開 WebKit，因此 Watch 直接節點
不會公告 Canvas 命令。

## 官方組建的中繼式推播

官方散布的 iOS 組建會使用外部推播中繼，而不是將原始 APNs 權杖發布至閘道。來自公開發行管道的官方 App Store 組建會使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基底 URL 已硬式編碼供 App Store 散布使用，不會讀取任何覆寫設定。

自訂中繼部署需要刻意採用獨立的 iOS 組建／部署路徑，且其中繼 URL 必須與閘道中繼 URL 相符。App Store 發行管道絕不接受自訂中繼 URL。如果你使用自訂中繼組建，請設定相符的閘道中繼 URL：

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
- 中繼服務會傳回不透明的中繼控制代碼，以及限定於該次註冊的傳送授權。
- iOS App 會擷取已配對的閘道身分識別資訊（`gateway.identity.get`），並將其納入中繼註冊，讓由中繼服務支援的註冊委派給該特定閘道。
- App 會使用 `push.apns.register`，將該中繼服務支援的註冊轉送至已配對的閘道。
- 閘道會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 如果 App 之後連線至其他閘道，或連線至使用不同中繼服務基底 URL 的組建版本，便會重新整理中繼註冊，而不會重複使用舊的繫結。

此路徑中閘道**不**需要：不需要整個部署共用的中繼權杖，官方 App Store 組建透過中繼服務傳送時，也不需要直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS App。
2. 選用：只有在刻意使用獨立的自訂中繼服務組建時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 與閘道配對，並讓它完成連線。
4. App 取得 APNs 權杖、操作者工作階段已連線且中繼註冊成功後，會發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示便可使用儲存的中繼服務支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件而喚醒 App 時，App 會嘗試短暫重新連線至節點，接著使用 `event: "node.presence.alive"` 呼叫 `node.event`。只有在得知已驗證的節點裝置身分後，閘道才會將此資訊記錄為已配對節點／裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，App 才會將背景喚醒視為已成功記錄。較舊的閘道可能會使用 `{ "ok": true }` 確認 `node.event`；此回應相容，但不會被視為持久的最後活動時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境變數覆寫（`gateway.push.apns.relay.baseUrl` 是設定優先路徑）。
- App Store 發行組建的推播模式會硬編碼託管中繼服務主機，絕不讀取中繼服務 URL 覆寫——`OPENCLAW_PUSH_RELAY_BASE_URL` 組建階段環境變數僅影響本機／沙箱 iOS 組建模式。

## 驗證與信任流程

中繼服務的存在是為了強制執行兩項限制，而官方 iOS 組建若由閘道直接使用 APNs，便無法提供這些限制：

- 只有透過 Apple 發布的正版 OpenClaw iOS 組建，才能使用託管中繼服務。
- 閘道只能針對與該特定閘道配對的 iOS 裝置，傳送由中繼服務支援的推播。

逐個階段說明：

1. `iOS app -> gateway`：App 透過一般的閘道驗證流程與閘道配對，取得已驗證的節點工作階段及已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：App 透過 HTTPS 呼叫中繼註冊端點，並附上 App Attest 證明與 StoreKit App 交易 JWS。中繼服務會驗證套件組合 ID、App Attest 證明及 Apple 發布證明，並要求使用正式／生產環境發布路徑——這會阻止本機 Xcode／開發組建使用託管中繼服務，因為本機組建無法提供正式的 Apple 發布證明。
3. `gateway identity delegation`：在中繼註冊前，App 會從 `gateway.identity.get` 擷取已配對的閘道身分識別資訊，並將其納入中繼註冊承載資料。中繼服務會傳回中繼控制代碼，以及委派給該閘道身分且限定於該次註冊的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的裝置身分為傳送要求簽署；中繼服務會根據註冊時委派的閘道身分，驗證儲存的傳送授權和閘道簽章。即使其他閘道以某種方式取得該控制代碼，也無法重複使用該筆儲存的註冊。
5. `relay -> APNs`：中繼服務持有生產環境 APNs 認證資訊及官方組建的原始 APNs 權杖。對於由中繼服務支援的官方組建，閘道絕不儲存原始 APNs 權杖；中繼服務會代表已配對的閘道，將最終推播傳送至 APNs。

此設計的建立原因：避免將生產環境 APNs 認證資訊放入使用者閘道、避免在閘道上儲存官方組建的原始 APNs 權杖、只允許官方 OpenClaw iOS 組建使用託管中繼服務，並防止某個閘道向屬於其他閘道的 iOS 裝置傳送喚醒推播。

本機／手動組建仍會直接使用 APNs。如果你在不使用中繼服務的情況下測試這些組建，閘道仍需直接 APNs 認證資訊：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機的執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 組建設定直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他供應商認證資訊一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，或將其放在存放庫簽出目錄下。

## 探索路徑

### Bonjour（區域網路）

iOS App 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定後瀏覽相同的廣域 DNS-SD 探索網域。同一區域網路中的閘道會自動從 `local.` 顯示；跨網路探索可使用設定的廣域網域，而不必變更信標類型。

### Tailnet（跨網路）

如果 mDNS 遭封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；範例：`openclaw.internal.`）和 Tailscale 分割 DNS。CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機／連接埠

在 Settings 中啟用 **Manual Host**，並輸入閘道主機與連接埠（預設為 `18789`）。

## 多個閘道

App 會保留所有已配對閘道的登錄資料，因此你無須重新配對即可在它們之間切換：

- **Settings -> Gateway** 會顯示 **Paired Gateways** 清單，並標示作用中的閘道。點選項目即可切換；App 會中斷目前的工作階段，並重新連線至選取的閘道。配對多個閘道時，連線列旁會顯示快速切換選單。
- 認證資訊、TLS 信任決策、各閘道偏好設定及快取的聊天記錄，都會依閘道分別儲存。切換時絕不會混合不同閘道的狀態，而推播註冊會跟隨作用中的閘道。
- 滑動已配對的閘道（或使用其內容選單）並選取 **Forget**，即可移除其認證資訊、裝置權杖、TLS 釘選及快取的聊天記錄。
- 若要切換至探索到的閘道，該閘道必須可在網路上被找到；手動閘道則會使用已儲存的主機和連接埠重新連線。

## Canvas + A2UI

iOS 節點會算繪 WKWebView 畫布。請使用 `node.invoke` 操作：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會透過閘道 HTTP 伺服器（與 `gateway.port` 使用相同連接埠，預設為 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會將內建基架保留為連線後的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 會使用隨 App 提供且由 App 擁有的 A2UI 頁面。
- 在 iOS 上，遠端閘道 A2UI 頁面僅供算繪；原生 A2UI 按鈕動作只接受來自隨 App 提供且由 App 擁有的頁面。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建基架。

## 與 Computer Use 的關係

iOS App 是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS App 則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理程式仍可透過 OpenClaw 呼叫節點命令來操作 iOS App，但這些呼叫會經由閘道節點通訊協定，並受 iOS 前景／背景限制約束。本機桌面控制請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)，iOS 節點功能則請參閱本頁。

### Canvas 執行／快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒與對話模式

- Settings 中提供語音喚醒與對話模式。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時 Talk 會使用由用戶端持有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道持有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援 Talk 的 iOS 節點會公布 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；對於受信任且支援 Talk 的節點，閘道預設允許這些按住說話命令。
- iOS 可能暫停背景音訊；當 App 未處於作用中狀態時，語音功能應視為盡力提供。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS App 切換至前景（畫布／相機／螢幕命令需要 App 位於前景）。
- `A2UI_HOST_UNAVAILABLE`：App WebView 無法存取隨附的 A2UI 頁面；請讓 App 保持在前景並顯示 Screen 分頁，然後重試。
- 配對提示始終未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對為 false，請在 Apple 的 Watch App 中配對
  Watch。如果安裝為 false，請從 **My Watch -> Available Apps** 安裝配套
  App。完成任一變更後，請在 Watch 上開啟 OpenClaw 一次；即時連線仍需要兩個 App 都在執行，
  而佇列中的更新則可稍後在背景送達。
- 重新安裝後無法重新連線：鑰匙圈中的配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
