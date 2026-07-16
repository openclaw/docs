---
read_when:
    - 配對或重新連線 iOS 節點
    - 啟用直接連線的 Apple Watch 節點或進行疑難排解
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-16T11:47:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個版本時，iPhone App 建置版本會透過 Apple 通路發佈。本機開發建置版本也可直接從原始碼執行。

## 功能

- 透過 WebSocket（區域網路或 tailnet）連線至閘道。
- 提供節點功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒，以及選擇加入的健康摘要。
- 接收 `node.invoke` 命令並回報節點狀態事件。
- 從 Agents 介面（Files）以唯讀方式瀏覽所選代理程式的工作區：逐層瀏覽目錄、檢視含語法醒目提示的文字預覽與圖片預覽，以及透過分享表單匯出。不支援寫入操作；閘道會限制預覽大小。
- 為每個已配對閘道保留近期聊天工作階段與逐字稿的小型唯讀離線快取：冷啟動時會立即顯示上次已知的逐字稿，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天；重設／忘記操作會清除受保護的本機快取。
- 將中斷連線期間傳送的文字訊息排入每個閘道各自的持久寄件匣（最多 50 則）：已排入佇列的訊息泡泡會顯示在逐字稿中，重新連線時依序送出並進行等冪重試，在正式歷程確認已傳送前持續保留；先以退避機制重試，之後才顯示重試／刪除動作；離線超過 48 小時後則讓訊息過期而不傳送；重設／忘記操作會連同快取一起清除佇列。
- 依需求朗讀助理訊息：在 Chat 中長按訊息並選擇 **Listen**。App 會使用已設定的 TTS 提供者播放閘道支援的 `tts.speak` 音訊片段；若閘道音訊無法取得或播放，則改用裝置端語音。切換工作階段或 App 進入背景時，播放會停止。

## 系統需求

- 在另一部裝置上執行的閘道（macOS、Linux，或透過 WSL2 執行的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用相同的區域網路，**或**
  - 透過單播 DNS-SD 使用 tailnet（網域範例：`openclaw.internal.`），**或**
  - 手動指定主機／連接埠（備援方式）。

## 快速開始（配對並連線）

首次啟動時，App 會依序顯示簡短的配對說明與
權限頁面（通知、相機、麥克風、照片、聯絡人、
行事曆、提醒事項、位置）。所有授權皆為選用，之後可在
**Settings** -> **Permissions** 或 iOS 的 Settings App 中變更。

1. 啟動具備驗證機制，且手機能透過某條路徑連線的閘道。建議使用 Tailscale
   Serve 作為遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若使用受信任的相同區域網路設定，請改用具備驗證機制的 `gateway.bind: "lan"`。
預設的回送位址繫結無法從手機存取。如果
閘道尚未設定，請先執行 `openclaw onboard`，讓設定碼
建立流程具有權杖或密碼驗證路徑。

2. 開啟 [Control UI](/zh-TW/web/control-ui)，選取 **Nodes**，然後在 **Devices** 頁面按一下
   **Pair mobile device**。建議使用完整存取權，且預設已選取；
   只有在想省略閘道管理控制項時，才選擇 Limited access，
   接著按一下 **Create setup code**。

3. 在 iOS App 中開啟 **Settings** -> **Gateway**，掃描 QR 圖碼（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路與 Tailscale Serve 路徑，App 會
   依序探測這些路徑，並儲存第一個可連線的端點。

4. 官方 App 會自動連線。如果 **Pending approval** 顯示
   請求，請先檢查其角色與範圍，再予以核准。

   **Settings → Gateway** 會顯示已儲存的操作者連線具有
   **Full** 或 **Limited** 存取權。為確保持有者權杖安全，純文字區域網路 `ws://` 設定會自動
   限制存取權。如果存取權受限，請設定 `wss://` 或
   Tailscale Serve，從 Control UI 或 `openclaw qr` 掃描新的完整存取權設定碼，
   然後重新連線以啟用設定與升級。

Control UI 按鈕需要已有一個具備 `operator.admin` 的配對工作階段。
若要使用終端機備援方式，請在 iOS App 中選擇探索到的閘道（或啟用
Manual Host 並輸入主機／連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 App 使用已變更的驗證詳細資料（角色／範圍／公開金鑰）重試配對，先前的待處理請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格管控的子網路連線，你可以選擇加入首次節點自動核准，並明確指定 CIDR 或確切 IP：

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

此功能預設為停用。它僅適用於未要求任何範圍的新 `role: node` 配對。操作者／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 健康摘要

iOS 節點可傳回選擇加入、唯讀且涵蓋目前
日曆日的 HealthKit 彙總資料。iPhone 同意與明確的閘道命令授權是
彼此獨立的關卡。關於設定、叫用、承載資料欄位、隱私行為與疑難排解，
請參閱 [HealthKit 摘要](/zh-TW/platforms/ios-healthkit)。

Apple Watch 隨附 App 預設會繼續使用現有的 iPhone 中繼，
不需要另行與閘道配對。請在 Apple 的 Watch App 中將 Watch 與 iPhone 配對，
從 **Watch app -> My Watch -> Available
Apps** 安裝 OpenClaw，然後在兩部裝置上各開啟一次 OpenClaw。

## 審查命令核准

具有 `operator.admin` 的操作者連線，或由閘道明確指定的
已配對 `operator.approvals` 連線，可以在 iPhone 上審查
待處理的 exec 請求。核准卡片會顯示閘道經過清理的
命令預覽、警告、主機情境、到期時間，以及該請求提供的
決策選項。已配對的 Apple Watch 會透過現有的 iPhone 中繼接收相同的
審查者安全提示，並提供精簡的僅允許一次／拒絕決策選項。Watch 直接閘道模式不會傳送
核准提示。

核准狀態會與 Control UI 及支援的聊天介面共用。
最先提交的答案生效。當另一個介面解決請求後、收到遠端
已解決通知後，以及解決確認可能遺失時，iPhone 與 Watch 都會擷取閘道的正式
終止記錄。在回讀確認該
請求是否仍處於待處理狀態前，動作會保持不可用。

核准的擁有權會繫結至所選的閘道。切換閘道無法
將舊提示套用到替代連線。早於
統一核准方法的閘道會退回使用已發佈的 exec 專用方法；
若要保留終止狀態並取得更豐富的跨介面結果，則需要更新版
閘道。

## 選用的 Apple Watch 直接節點

直接模式會為 Watch 提供其自有的簽署節點身分與閘道連線。
即使已配對的 iPhone 無法使用，只要
OpenClaw 處於使用中，支援的節點命令仍可透過 Watch Wi-Fi 或行動網路運作。

系統需求：

- iPhone 已使用 `operator.admin` 範圍連線至閘道。
- 設定碼提供一個使用 watchOS 信任憑證的 `wss://` 閘道端點；
  Watch 會輪詢對應的 `https://` 來源。不支援純 HTTP，
  以及僅使用自我簽署或指紋的信任方式。如需端點設定方式，請參閱[閘道擁有的
  配對](/zh-TW/gateway/pairing)。Watch 無法獨立連線至回送位址、僅限 iPhone
  及僅限 tailnet 的路徑。
- 使用行動網路時，需要具備行動網路功能且已啟用服務的 Apple Watch。
- OpenClaw 在 Watch 上處於使用中。Apple 不允許一般 watchOS App
  持續維持通用 WebSocket/TCP 連線，因此直接節點會使用短週期 HTTPS
  輪詢，並在 App 返回前景時重新連線。請參閱 Apple 的
  [watchOS 低階網路指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

設定：

1. 在 iPhone 上開啟 **Settings -> Apple Watch**。
2. 點一下 **Enable Direct Gateway Connection**。
3. 在短效設定碼到期前，於 Watch 上開啟 OpenClaw。
4. 使用 `openclaw nodes status` 驗證獨立的 Apple Watch 資料列。

設定碼包含短效且僅供節點使用的啟動認證資訊；在其到期前，
請將其視同密碼。它絕不會包含 iPhone 已儲存的閘道
密碼或權杖。配對後，Watch 會儲存其自有的裝置權杖，並
刪除啟動認證資訊。直接模式僅涵蓋下列命令。
Chat、Talk、核准及現有的 `watch.*` 通知流程仍屬於
iPhone 中繼功能，且仍需要已配對的 iPhone。

WatchOS 直接節點命令：

| 介面          | 命令                           | 說明                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 裝置          | `device.info`、`device.status` | Watch 身分、電池、溫度、儲存空間與網路。                |
| 通知          | `system.notify`                | App 處於使用中時可用；需要 Watch 權限。                 |

watchOS 不向第三方 App 提供 WebKit，因此 Watch 直接節點
不會提供 Canvas 命令。

## 官方建置版本的中繼式推播

官方發佈的 iOS 建置版本會使用外部推播中繼，而不是將原始 APNs 權杖發佈至閘道。公開發行管線的官方 App Store 建置版本使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基底 URL 已硬式編碼供 App Store 發佈使用，且不會讀取任何覆寫值。

自訂中繼部署需要刻意使用獨立的 iOS 建置／部署路徑，其中繼 URL 必須與閘道中繼 URL 相符。App Store 發行管線絕不接受自訂中繼 URL。如果你使用自訂中繼建置版本，請設定相符的閘道中繼 URL：

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

- iOS App 使用 App Attest 與 StoreKit App 交易 JWS 向中繼註冊。
- 中繼會傳回不透明的中繼控制代碼，以及限定該次註冊範圍的傳送授權。
- iOS App 會擷取已配對的閘道身分（`gateway.identity.get`），並將其納入中繼註冊，因此中繼式註冊只會委派給該特定閘道。
- App 使用 `push.apns.register` 將該中繼式註冊轉送至已配對的閘道。
- 閘道使用該已儲存的中繼控制代碼來執行 `push.test`、背景喚醒與喚醒提示。
- 如果 App 之後連線至其他閘道，或連線至使用不同中繼基底 URL 的建置版本，App 會重新整理中繼註冊，而不會重複使用舊的繫結。

此路徑中，閘道**不**需要：整個部署共用的中繼權杖，也不需要官方 App Store 中繼式傳送所用的直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS App。
2. 選用：只有在刻意使用獨立的自訂中繼建置版本時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 App 與閘道配對，並讓其完成連線。
4. App 取得 APNs 權杖、操作者工作階段已連線且中繼註冊成功後，會發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒與喚醒提示即可使用已儲存的中繼式註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置變更事件喚醒應用程式時，應用程式會嘗試短暫重新連線至節點，接著以 `event: "node.presence.alive"` 呼叫 `node.event`。只有在得知已驗證的節點裝置身分後，閘道才會在已配對節點／裝置的中繼資料中將此記錄為 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，應用程式才會將背景喚醒視為已成功記錄。較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；此回應相容，但不算是持久的最近上線時間更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境變數覆寫使用（`gateway.push.apns.relay.baseUrl` 是設定優先的路徑）。
- App Store 發行版本的推播模式已將託管中繼主機寫死，且絕不讀取中繼 URL 覆寫值——`OPENCLAW_PUSH_RELAY_BASE_URL` 建置階段環境變數只會影響本機／沙箱 iOS 建置模式。

## 驗證與信任流程

此中繼服務的存在，是為了強制執行官方 iOS 建置版本無法透過「閘道直接連線 APNs」提供的兩項限制：

- 只有透過 Apple 發布的正版 OpenClaw iOS 建置版本可以使用託管中繼服務。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼服務支援的推播。

逐站流程如下：

1. `iOS app -> gateway`：應用程式透過一般閘道驗證流程與閘道配對，取得已驗證的節點工作階段及已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：應用程式透過 HTTPS 呼叫中繼服務註冊端點，並提供 App Attest 證明與 StoreKit 應用程式交易 JWS。中繼服務會驗證套件組合 ID、App Attest 證明及 Apple 發布證明，並要求使用官方／正式環境的發布路徑——這正是防止本機 Xcode／開發版建置使用託管中繼服務的機制，因為本機建置無法滿足官方 Apple 發布證明。
3. `gateway identity delegation`：在中繼服務註冊前，應用程式會從 `gateway.identity.get` 取得已配對閘道的身分，並將其包含在中繼服務註冊承載資料中。中繼服務會傳回中繼控制代碼，以及委派給該閘道身分、限定於此次註冊的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼與傳送授權。發生 `push.test`、重新連線喚醒及喚醒提示時，閘道會使用自己的裝置身分簽署傳送要求；中繼服務會根據註冊時委派的閘道身分，驗證已儲存的傳送授權及閘道簽章。即使其他閘道以某種方式取得控制代碼，也無法重複使用該已儲存的註冊。
5. `relay -> APNs`：中繼服務持有正式環境 APNs 認證資訊，以及官方建置版本的原始 APNs 權杖。對於由中繼服務支援的官方建置版本，閘道絕不儲存原始 APNs 權杖；中繼服務會代表已配對的閘道，將最終推播傳送至 APNs。

此設計的建立目的：避免將正式環境 APNs 認證資訊存放在使用者閘道中、避免在閘道上儲存官方建置版本的原始 APNs 權杖、只允許官方 OpenClaw iOS 建置版本使用託管中繼服務，以及防止某個閘道向另一個閘道所擁有的 iOS 裝置傳送喚醒推播。

本機／手動建置版本仍會直接使用 APNs。如果你未透過中繼服務測試這些建置版本，閘道仍需要直接使用 APNs 的認證資訊：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段的環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 建置版本設定直接 APNs 傳遞。

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

iOS 應用程式會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定後瀏覽同一個廣域 DNS-SD 探索網域。同一區域網路中的閘道會自動透過 `local.` 顯示；跨網路探索則可使用已設定的廣域網域，而不必變更信標類型。

### Tailnet（跨網路）

如果 mDNS 遭到封鎖，請使用單點傳播 DNS-SD 區域（選擇一個網域；例如：`openclaw.internal.`）和 Tailscale 分割 DNS。CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機／連接埠

在 Settings 中啟用 **Manual Host**，並輸入閘道主機與連接埠（預設為 `18789`）。

## 多個閘道

應用程式會保留每個已配對閘道的登錄資料，因此你可以在閘道之間切換，而不必再次配對：

- **Settings -> Gateway** 會顯示 **Paired Gateways** 清單，並標示目前使用中的閘道。點一下項目即可切換；應用程式會中斷目前的工作階段，並重新連線至所選閘道。配對超過一個閘道時，連線列旁會顯示快速切換選單。
- 認證資訊、TLS 信任決策、各閘道偏好設定及快取的聊天記錄會依閘道分別儲存。切換時絕不會混用不同閘道的狀態，而推播註冊會跟隨目前使用中的閘道。
- 滑動已配對的閘道（或使用其快顯功能表）以 **Forget** 該閘道，這會移除其認證資訊、裝置權杖、TLS 固定資訊及快取的聊天內容。
- 已探索到的閘道必須在網路上可見，才能切換至該閘道；手動閘道會使用已儲存的主機與連接埠重新連線。

## Canvas + A2UI

iOS 節點會轉譯 WKWebView 畫布。請使用 `node.invoke` 控制它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會從閘道 HTTP 伺服器（與 `gateway.port` 使用相同連接埠，預設為 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會保留內建基架作為連線後的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 會使用隨附、由應用程式擁有的 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供轉譯；只有隨附、由應用程式擁有的頁面所發出的原生 A2UI 按鈕動作才會被接受。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建基架。

## 與 Computer Use 的關係

iOS 應用程式是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 會透過 MCP 工具控制本機 macOS 桌面；iOS 應用程式則透過 OpenClaw 節點命令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理程式仍可透過 OpenClaw 呼叫節點命令來操作 iOS 應用程式，但這些呼叫會經過閘道節點通訊協定，並受 iOS 前景／背景限制約束。若要控制本機桌面，請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)；若要瞭解 iOS 節點功能，請參閱本頁。

### Canvas eval／快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒與對話模式

- 語音喚醒與對話模式可在 Settings 中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用由用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話的 iOS 節點會公告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；對於受信任且支援對話的節點，閘道預設允許這些按住說話命令。
- iOS 可能會暫停背景音訊；當應用程式未在使用中時，應將語音功能視為僅盡力提供。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式切換至前景（畫布／相機／螢幕命令需要應用程式位於前景）。
- `A2UI_HOST_UNAVAILABLE`：應用程式 WebView 無法存取隨附的 A2UI 頁面；請讓應用程式保持在前景的 Screen 分頁，然後重試。
- 配對提示始終未出現：執行 `openclaw devices list` 並手動核准。
- Watch 未顯示 iPhone 狀態：確認 iPhone 在 `watch.status` 中回報 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配對為 false，請在 Apple 的 Watch 應用程式中配對
  Watch。如果安裝為 false，請從 **My Watch -> Available Apps** 安裝配套
  應用程式。完成任一變更後，請在 Watch 上開啟 OpenClaw
  一次；即時連線仍要求兩個應用程式都在執行，
  而佇列中的更新稍後仍可在背景送達。
- 重新安裝後無法重新連線：鑰匙圈中的配對權杖已清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
