---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS 應用程式
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連線至閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-05T17:41:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44e1f065bedeca67fcbb11d9666865cebfb2a7636f8eeeb2216d90a72c29e0b6
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個版本時，iPhone app 組建會透過 Apple 通路發佈。本機開發組建也可以從原始碼執行。

## 功能

- 透過 WebSocket（區域網路或 tailnet）連線到閘道。
- 公開節點功能：Canvas、螢幕快照、相機擷取、位置、通話模式、語音喚醒。
- 接收 `node.invoke` 指令並回報節點狀態事件。

## 需求

- 閘道在另一台裝置上執行（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 位於同一個區域網路，**或**
  - 透過單播 DNS-SD 位於 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動已驗證且具備手機可到達路由的閘道。Tailscale
   Serve 是建議的遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的同區域網路設定，請改用已驗證的 `gateway.bind: "lan"`。
預設的 local loopback 綁定無法從手機連到。如果尚未設定
閘道，請先執行 `openclaw onboard`，讓設定碼
建立流程具備權杖或密碼驗證路徑。

2. 開啟 [控制介面](/zh-TW/web/control-ui)，選取 **節點**，然後在 **裝置** 卡片中點擊
   **配對行動裝置**。

3. 在 iOS app 中，開啟 **設定** -> **閘道**，掃描 QR code（或貼上
   設定碼），然後連線。

   如果設定碼同時包含區域網路與 Tailscale Serve 路由，app
   會依序探測它們，並儲存第一個可到達的端點。

4. 官方 app 會自動連線。如果 **裝置** 顯示待處理
   請求，請先檢閱其角色與範圍再核准。

控制介面按鈕需要已配對且具備 `operator.admin` 的工作階段。
作為終端備援，可在 iOS app 中選擇已探索到的閘道（或啟用
手動主機並輸入主機/連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格控管的子網路連線，你可以使用明確 CIDR 或精確 IP 選擇啟用首次節點自動核准：

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

此功能預設停用。它只適用於未請求任何範圍的全新 `role: node` 配對。Operator/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方組建的中繼支援推播

官方發佈的 iOS 組建會使用外部推播中繼，而不是將原始 APNs 權杖發佈到閘道。來自公開發佈通道的官方 App Store 組建會使用位於 `https://ios-push-relay.openclaw.ai` 的託管中繼；此基礎 URL 已硬編碼於 App Store 發佈版本，且不會讀取任何覆寫。

自訂中繼部署需要刻意獨立的 iOS 組建/部署路徑，且其中繼 URL 必須符合閘道中繼 URL。App Store 發佈通道永不接受自訂中繼 URL。如果你使用自訂中繼組建，請設定相符的閘道中繼 URL：

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
- iOS app 會擷取已配對的閘道身分（`gateway.identity.get`）並在中繼註冊中包含它，因此由中繼支援的註冊會委派給該特定閘道。
- app 會使用 `push.apns.register` 將該中繼支援的註冊轉送給已配對的閘道。
- 閘道會將已儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- 如果 app 之後連線到不同閘道，或連線到使用不同中繼基礎 URL 的組建，它會重新整理中繼註冊，而不是重用舊綁定。

此路徑下閘道**不**需要的項目：不需要部署範圍的中繼權杖，也不需要用於官方 App Store 中繼支援傳送的直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS app。
2. 選用：只有在使用刻意獨立的自訂中繼組建時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 app 配對到閘道，並讓它完成連線。
4. app 取得 APNs 權杖、操作者工作階段已連線且中繼註冊成功後，會發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示即可使用已儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件喚醒 app 時，app 會嘗試短暫重新連線節點，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。只有在已知已驗證的節點裝置身分後，閘道才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，app 才會將背景喚醒視為已成功記錄。較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不會算作持久的最後可見更新。

相容性備註：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境覆寫使用（`gateway.push.apns.relay.baseUrl` 是設定優先路徑）。
- App Store 發佈組建的推播模式會硬編碼託管中繼主機，且永不讀取中繼 URL 覆寫；`OPENCLAW_PUSH_RELAY_BASE_URL` 建置時環境變數只會影響本機/沙盒 iOS 組建模式。

## 驗證與信任流程

中繼的存在是為了強制執行兩項官方 iOS 組建無法由閘道直接使用 APNs 提供的限制：

- 只有透過 Apple 發佈的真正 OpenClaw iOS 組建可以使用託管中繼。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼支援推播。

逐跳流程：

1. `iOS app -> gateway`：app 透過一般閘道驗證流程與閘道配對，取得已驗證的節點工作階段以及已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：app 透過 HTTPS 呼叫中繼註冊端點，並附上 App Attest 證明與 StoreKit app transaction JWS。中繼會驗證 bundle ID、App Attest 證明與 Apple 發佈證明，並要求官方/正式發佈路徑；這會阻止本機 Xcode/開發組建使用託管中繼，因為本機組建無法滿足官方 Apple 發佈證明。
3. `gateway identity delegation`：在中繼註冊前，app 會從 `gateway.identity.get` 擷取已配對的閘道身分，並將其包含在中繼註冊酬載中。中繼會回傳中繼控制代碼，以及委派給該閘道身分、註冊範圍的傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼與傳送授權。在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自身裝置身分簽署傳送請求；中繼會根據註冊中委派的閘道身分，同時驗證已儲存的傳送授權與閘道簽章。另一個閘道即使以某種方式取得控制代碼，也無法重用該已儲存註冊。
5. `relay -> APNs`：中繼擁有正式 APNs 憑證，以及官方組建的原始 APNs 權杖。對於中繼支援的官方組建，閘道永不儲存原始 APNs 權杖；中繼會代表已配對的閘道將最終推播傳送到 APNs。

建立此設計的原因：讓正式 APNs 憑證不進入使用者閘道、避免在閘道上儲存官方組建的原始 APNs 權杖、僅允許官方 OpenClaw iOS 組建使用託管中繼，並防止一個閘道向屬於不同閘道的 iOS 裝置傳送喚醒推播。

本機/手動組建仍使用直接 APNs。如果你在沒有中繼的情況下測試這些組建，閘道仍需要直接 APNs 憑證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只會儲存 App Store Connect 驗證，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 組建設定直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下其他提供者憑證一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，或將它放在 repo checkout 下。

## 探索路徑

### Bonjour（區域網路）

iOS app 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在已設定時瀏覽相同的廣域 DNS-SD 探索網域。同區域網路的閘道會自動從 `local.` 出現；跨網路探索可以使用已設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD 區域（選擇一個網域；範例：`openclaw.internal.`）和 Tailscale split DNS。請參閱 [Bonjour](/zh-TW/gateway/bonjour) 取得 CoreDNS 範例。

### 手動主機/連接埠

在設定中，啟用 **手動主機** 並輸入閘道主機 + 連接埠（預設 `18789`）。

## Canvas + A2UI

iOS 節點會轉譯 WKWebView Canvas。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

備註：

- 閘道 Canvas 主機會從閘道 HTTP 伺服器（與 `gateway.port` 相同連接埠，預設 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會保留內建 scaffold 作為已連線的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用隨附且由 app 擁有的 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供轉譯；原生 A2UI 按鈕動作只接受來自隨附且由 app 擁有的頁面。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## Computer Use 關係

iOS app 是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 會透過 MCP 工具控制本機 macOS 桌面；iOS app 則透過 OpenClaw 節點指令公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫節點指令來操作 iOS app，但這些呼叫會通過閘道節點協定，並遵守 iOS 前景/背景限制。使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use) 進行本機桌面控制，並使用本頁了解 iOS 節點功能。

### Canvas eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 通話模式

- 語音喚醒與通話模式可在「設定」中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時通話會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[通話模式](/zh-TW/nodes/talk)。
- 支援通話的 iOS 節點會宣告 `talk` 功能，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；閘道預設允許受信任且支援通話的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當 App 未啟用時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：請將 iOS App 帶到前景（畫布/相機/螢幕命令需要在前景）。
- `A2UI_HOST_UNAVAILABLE`：App WebView 無法連上內建的 A2UI 頁面；請讓 App 保持在前景並停留在「螢幕」分頁，然後重試。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：鑰匙圈配對權杖已被清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
