---
read_when:
    - 配對或重新連線 iOS 節点
    - 從原始碼執行 iOS 應用程式
    - 偵錯閘道探索或畫布命令
summary: iOS 節點應用程式：連接到閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-05T11:32:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627b48b8ae742423c21eabf65a55bbb4477c96447565ad6f5469e9cfb51b0ca1
    source_path: platforms/ios.md
    workflow: 16
---

可用性：啟用於某個發行版本時，iPhone 應用程式建置會透過 Apple 通路發布。本機開發建置也可以從原始碼執行。

## 功能

- 透過 WebSocket 連線到閘道（LAN 或 tailnet）。
- 暴露節點功能：畫布、螢幕快照、相機擷取、位置、通話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。

## 需求

- 在另一台裝置上執行的閘道（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 使用相同 LAN，**或**
  - 透過單播 DNS-SD 使用 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動一個已驗證、且手機可連線路由的閘道。Tailscale
   Serve 是建議的遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是可信任的相同 LAN 設定，請改用已驗證的 `gateway.bind: "lan"`。
預設 loopback 綁定無法從手機連線。如果尚未設定
閘道，請先執行 `openclaw onboard`，讓設定碼
建立流程有權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選取**節點**，並在**裝置**卡片中點選
   **配對行動裝置**。

3. 在 iOS 應用程式中，開啟**設定** -> **閘道**，掃描 QR code（或貼上
   設定碼），然後連線。

4. 官方應用程式會自動連線。如果**裝置**顯示待處理
   請求，請先檢閱其角色與範圍再核准。

控制介面按鈕需要已配對且具備 `operator.admin` 的工作階段。
作為終端備援，請在 iOS 應用程式中選擇探索到的閘道（或啟用
手動主機並輸入主機/連接埠），然後在閘道主機上核准請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果應用程式以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，先前待處理的請求會被取代，並建立新的 `requestId`。核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格管控的子網路連線，你可以選擇使用明確 CIDR 或精確 IP 來啟用首次節點自動核准：

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

此功能預設停用。它只適用於未要求任何範圍的全新 `role: node` 配對。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方建置的中繼支援推送

官方發布的 iOS 建置會使用外部推送中繼，而不是將原始 APNs 權杖發布到閘道。來自公開發行通道的官方 App Store 建置會使用託管中繼 `https://ios-push-relay.openclaw.ai`；此基底 URL 會為 App Store 發布硬編碼，且不會讀取任何覆寫。

自訂中繼部署需要刻意分離的 iOS 建置/部署路徑，其 中繼 URL 必須與閘道中繼 URL 相符。App Store 發行通道永遠不接受自訂中繼 URL。如果你使用自訂中繼建置，請設定相符的閘道中繼 URL：

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

- iOS 應用程式使用 App Attest 和 StoreKit 應用程式交易 JWS 向中繼註冊。
- 中繼會回傳不透明的中繼控制代碼，以及註冊範圍的傳送授權。
- iOS 應用程式取得已配對的閘道身分（`gateway.identity.get`），並將其包含在中繼註冊中，因此中繼支援的註冊會委派給該特定閘道。
- 應用程式使用 `push.apns.register` 將該中繼支援的註冊轉送給已配對的閘道。
- 閘道會使用儲存的中繼控制代碼執行 `push.test`、背景喚醒和喚醒提示。
- 如果應用程式之後連線到不同閘道，或連線到具有不同中繼基底 URL 的建置，它會重新整理中繼註冊，而不是重複使用舊綁定。

此路徑中閘道**不**需要的項目：不需要部署範圍的中繼權杖，也不需要官方 App Store 中繼支援傳送的直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS 應用程式。
2. 選用：只有在使用刻意分離的自訂中繼建置時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將應用程式與閘道配對，並讓它完成連線。
4. 應用程式會在取得 APNs 權杖、操作者工作階段已連線，且中繼註冊成功後，發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示可以使用儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推送、背景重新整理或重要位置事件喚醒應用程式時，應用程式會嘗試短暫重新連線節點，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。只有在已知已驗證的節點裝置身分之後，閘道才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，應用程式才會將背景喚醒視為已成功記錄。較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不會算作持久的上次看見更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境覆寫（`gateway.push.apns.relay.baseUrl` 是優先使用設定的路徑）。
- App Store 發行建置的推送模式會硬編碼託管中繼主機，且永遠不會讀取中繼 URL 覆寫 — `OPENCLAW_PUSH_RELAY_BASE_URL` 建置階段環境變數只影響本機/沙盒 iOS 建置模式。

## 驗證與信任流程

中繼存在的目的，是強制執行兩項官方 iOS 建置中直接在閘道上使用 APNs 無法提供的限制：

- 只有透過 Apple 發布的真正 OpenClaw iOS 建置可以使用託管中繼。
- 閘道只能為與該特定閘道配對的 iOS 裝置傳送中繼支援的推送。

逐跳說明：

1. `iOS app -> gateway`：應用程式透過一般閘道驗證流程與閘道配對，取得已驗證的節點工作階段以及已驗證的操作者工作階段。操作者工作階段會呼叫 `gateway.identity.get`。
2. `iOS app -> relay`：應用程式透過 HTTPS 呼叫中繼註冊端點，並附上 App Attest 證明以及 StoreKit 應用程式交易 JWS。中繼會驗證 bundle ID、App Attest 證明和 Apple 發布證明，並要求官方/正式發布路徑 — 這會阻擋本機 Xcode/開發建置使用託管中繼，因為本機建置無法滿足官方 Apple 發布證明。
3. `gateway identity delegation`：在中繼註冊之前，應用程式會從 `gateway.identity.get` 取得已配對的閘道身分，並將其包含在中繼註冊承載中。中繼會回傳中繼控制代碼，以及委派給該閘道身分的註冊範圍傳送授權。
4. `gateway -> relay`：閘道會儲存來自 `push.apns.register` 的中繼控制代碼與傳送授權。在 `push.test`、重新連線喚醒和喚醒提示時，閘道會使用自己的裝置身分簽署傳送請求；中繼會依據註冊中委派的閘道身分，驗證儲存的傳送授權以及閘道簽章。即使另一個閘道以某種方式取得該控制代碼，也無法重複使用該儲存的註冊。
5. `relay -> APNs`：中繼擁有正式 APNs 憑證，以及官方建置的原始 APNs 權杖。對於中繼支援的官方建置，閘道永遠不會儲存原始 APNs 權杖；中繼會代表已配對的閘道將最終推送傳送到 APNs。

建立此設計的原因：將正式 APNs 憑證排除在使用者閘道之外、避免在閘道上儲存官方建置的原始 APNs 權杖、只允許官方 OpenClaw iOS 建置使用託管中繼，並防止某個閘道向由不同閘道擁有的 iOS 裝置傳送喚醒推送。

本機/手動建置仍使用直接 APNs。如果你在沒有中繼的情況下測試這些建置，閘道仍需要直接 APNs 憑證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機的執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存 App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不會設定本機 iOS 建置的直接 APNs 傳遞。

建議的閘道主機儲存方式，與 `~/.openclaw/credentials/` 下的其他提供者憑證一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，也不要將它放在 repo checkout 下。

## 探索路徑

### Bonjour（LAN）

iOS 應用程式會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定時瀏覽相同的廣域 DNS-SD 探索網域。相同 LAN 的閘道會自動從 `local.` 顯示；跨網路探索可以使用已設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD 區域（選擇一個網域；範例：`openclaw.internal.`）和 Tailscale split DNS。CoreDNS 範例請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

### 手動主機/連接埠

在設定中，啟用**手動主機**並輸入閘道主機 + 連接埠（預設 `18789`）。

## 畫布 + A2UI

iOS 節點會呈現 WKWebView 畫布。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會從閘道 HTTP 伺服器（與 `gateway.port` 相同連接埠，預設 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 節點會保留內建 scaffold 作為已連線的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 會使用隨附的應用程式擁有 A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供呈現；原生 A2UI 按鈕動作只接受來自隨附應用程式擁有頁面的動作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## Computer Use 關係

iOS 應用程式是行動節點介面，不是 Codex Computer Use 後端。Codex Computer Use 和 `cua-driver mcp` 會透過 MCP 工具控制本機 macOS 桌面；iOS 應用程式則透過 OpenClaw 節點命令暴露 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過叫用節點命令，經由 OpenClaw 操作 iOS 應用程式，但這些呼叫會經過閘道節點協定，並遵循 iOS 前景/背景限制。若要控制本機桌面，請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)；若要了解 iOS 節點功能，請使用本頁。

### 畫布 eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 通話模式

- 語音喚醒和對話模式可在設定中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話的 iOS 節點會宣告 `talk` 能力，並可宣告 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；閘道預設允許受信任且支援對話的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當應用程式未處於啟用狀態時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式帶到前景（畫布/相機/螢幕命令需要如此）。
- `A2UI_HOST_UNAVAILABLE`：應用程式 WebView 中無法連線到內建的 A2UI 頁面；請讓應用程式在「螢幕」分頁保持前景，然後重試。
- 配對提示一直未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已被清除；請重新配對節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
