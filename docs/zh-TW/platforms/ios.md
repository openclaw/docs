---
read_when:
    - 配對或重新連線 iOS 節點
    - 從原始碼執行 iOS App
    - 偵錯閘道探索或畫布命令
summary: iOS 節點 App：連線到閘道、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-07-04T17:48:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

可用性：iPhone app 建置版在為某個版本啟用時，會透過 Apple 通路發佈。本機開發建置版也可以從原始碼執行。

## 它的作用

- 透過 WebSocket（LAN 或 tailnet）連線到閘道。
- 暴露節點能力：畫布、螢幕快照、相機擷取、位置、通話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報節點狀態事件。

## 需求

- 在另一台裝置上執行的閘道（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 位於同一個 LAN，**或**
  - 透過單播 DNS-SD 的 tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動一個已驗證的閘道，並使用手機可連上的路由。Tailscale
   Serve 是建議的遠端路徑：

```bash
openclaw gateway --port 18789 --tailscale serve
```

若是受信任的同 LAN 設定，請改用已驗證的 `gateway.bind: "lan"`。
預設的 loopback 綁定無法從手機連上。如果閘道尚未設定，請先執行
`openclaw onboard`，讓設定碼建立流程具備權杖或密碼驗證路徑。

2. 開啟[控制介面](/zh-TW/web/control-ui)，選取**節點**，並在**裝置**卡片中點選
   **配對行動裝置**。

3. 在 iOS app 中，開啟**設定** → **閘道**，掃描 QR code（或貼上
   設定碼），然後連線。

4. 官方 app 會自動連線。如果**裝置**顯示待處理的
   要求，請先檢閱其角色與範圍再核准。

控制介面按鈕需要已配對且具有 `operator.admin` 的工作階段。
作為終端備援，請在 iOS app 中選擇已探索到的閘道（或啟用
手動主機並輸入主機/連接埠），然後在閘道主機上核准要求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，
先前待處理的要求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

選用：如果 iOS 節點一律從嚴格控管的子網路連線，你可以選擇使用明確的 CIDR 或精確 IP
啟用首次節點自動核准：

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

此功能預設停用。它只適用於沒有要求範圍的新 `role: node` 配對。
操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

5. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方建置版的中繼支援推播

官方發佈的 iOS 建置版會使用外部推播中繼，而不是將原始 APNs
權杖發佈到閘道。

來自公開發行通道的官方 App Store 建置版會使用託管中繼 `https://ios-push-relay.openclaw.ai`。

自訂中繼部署需要刻意分離的 iOS 建置/部署路徑，其中繼 URL 必須與閘道中繼 URL 相符。公開 App Store 發行通道不接受自訂中繼 URL 覆寫。如果你使用自訂中繼建置版，請設定相符的閘道中繼 URL：

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
- iOS app 會擷取已配對閘道身分並將其納入中繼註冊，因此中繼支援的註冊會委派給該特定閘道。
- app 會使用 `push.apns.register` 將該中繼支援的註冊轉送到已配對的閘道。
- 閘道會使用儲存的中繼控制代碼執行 `push.test`、背景喚醒和喚醒輕推。
- 自訂閘道中繼 URL 必須與烘焙進 iOS 建置版的中繼 URL 相符。
- 如果 app 之後連線到不同閘道，或連線到具有不同中繼 base URL 的建置版，它會重新整理中繼註冊，而不是重用舊綁定。

此路徑中閘道**不**需要的項目：

- 不需要部署範圍的中繼權杖。
- 官方 App Store 中繼支援傳送不需要直接 APNs 金鑰。

預期的操作者流程：

1. 安裝官方 iOS app。
2. 選用：只有在使用刻意分離的自訂中繼建置版時，才在閘道上設定 `gateway.push.apns.relay.baseUrl`。
3. 將 app 配對到閘道，並讓它完成連線。
4. app 會在取得 APNs 權杖、操作者工作階段已連線且中繼註冊成功後，自動發佈 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒輕推就可以使用儲存的中繼支援註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件喚醒 app 時，app
會嘗試短暫重新連線節點，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。
閘道只有在已知已驗證的節點裝置身分後，才會將此記錄為已配對節點/裝置中繼資料上的
`lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，app 才會將背景喚醒視為已成功記錄。
較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，
但不算作持久的最後看見更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為閘道的暫時環境覆寫使用。
- 公開 App Store 發行通道會拒絕 iOS 建置版的 `OPENCLAW_PUSH_RELAY_BASE_URL`。

## 驗證與信任流程

中繼的存在是為了強制執行兩項官方 iOS 建置版無法由閘道直接使用 APNs 提供的約束：

- 只有透過 Apple 發佈的真正 OpenClaw iOS 建置版可以使用託管中繼。
- 閘道只能對已與該特定閘道配對的 iOS 裝置傳送中繼支援推播。

逐段說明：

1. `iOS app -> gateway`
   - app 會先透過一般閘道驗證流程與閘道配對。
   - 這會讓 app 取得已驗證的節點工作階段，以及已驗證的操作者工作階段。
   - 操作者工作階段用於呼叫 `gateway.identity.get`。

2. `iOS app -> relay`
   - app 會透過 HTTPS 呼叫中繼註冊端點。
   - 註冊包含 App Attest 證明以及 StoreKit app transaction JWS。
   - 中繼會驗證 bundle ID、App Attest 證明與 Apple 發佈證明，並要求
     官方/正式發佈路徑。
   - 這就是阻止本機 Xcode/dev 建置版使用託管中繼的機制。本機建置版可能已簽署，
     但它不符合中繼預期的官方 Apple 發佈證明。

3. `gateway identity delegation`
   - 在中繼註冊前，app 會從 `gateway.identity.get`
     擷取已配對的閘道身分。
   - app 會在中繼註冊 payload 中包含該閘道身分。
   - 中繼會回傳中繼控制代碼，以及委派給該閘道身分的註冊範圍傳送授權。

4. `gateway -> relay`
   - 閘道會儲存來自 `push.apns.register` 的中繼控制代碼與傳送授權。
   - 在 `push.test`、重新連線喚醒和喚醒輕推時，閘道會使用自己的裝置身分簽署傳送要求。
   - 中繼會根據註冊時委派的閘道身分，驗證儲存的傳送授權和閘道簽章。
   - 另一個閘道無法重用該儲存的註冊，即使它以某種方式取得了控制代碼。

5. `relay -> APNs`
   - 中繼擁有正式 APNs 憑證，以及官方建置版的原始 APNs 權杖。
   - 對於中繼支援的官方建置版，閘道絕不儲存原始 APNs 權杖。
   - 中繼會代表已配對的閘道將最終推播傳送到 APNs。

建立此設計的原因：

- 將正式 APNs 憑證排除在使用者閘道之外。
- 避免在閘道上儲存官方建置版的原始 APNs 權杖。
- 只允許官方 OpenClaw iOS 建置版使用託管中繼。
- 防止某個閘道向屬於不同閘道的 iOS 裝置傳送喚醒推播。

本機/手動建置版仍使用直接 APNs。如果你在沒有中繼的情況下測試這些建置版，
閘道仍需要直接 APNs 憑證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是閘道主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存
App Store Connect 驗證資訊，例如 `APP_STORE_CONNECT_KEY_ID` 和
`APP_STORE_CONNECT_ISSUER_ID`；它不會為本機 iOS 建置版設定直接 APNs 傳遞。

建議的閘道主機儲存方式：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 檔案，也不要將它放在 repo checkout 底下。

## 探索路徑

### Bonjour（LAN）

iOS app 會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在設定時瀏覽相同的
廣域 DNS-SD 探索網域。同 LAN 閘道會自動從 `local.` 出現；
跨網路探索可以使用已設定的廣域網域，而不需要變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD zone（選擇一個網域；範例：
`openclaw.internal.`）和 Tailscale split DNS。
請參閱 [Bonjour](/zh-TW/gateway/bonjour) 的 CoreDNS 範例。

### 手動主機/連接埠

在設定中，啟用**手動主機**並輸入閘道主機 + 連接埠（預設 `18789`）。

## 畫布 + A2UI

iOS 節點會算繪 WKWebView 畫布。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- 閘道畫布主機會提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由閘道 HTTP 伺服器提供（與 `gateway.port` 相同的連接埠，預設 `18789`）。
- iOS 節點會將內建 scaffold 保持為已連線的預設檢視。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用 bundled app-owned A2UI 頁面。
- 遠端閘道 A2UI 頁面在 iOS 上僅供算繪；原生 A2UI 按鈕動作只接受來自 bundled app-owned 頁面。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## Computer Use 關係

iOS app 是行動節點介面，不是 Codex Computer Use 後端。Codex
Computer Use 和 `cua-driver mcp` 會透過 MCP
工具控制本機 macOS 桌面；iOS app 會透過 OpenClaw 節點命令暴露 iPhone 能力，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 呼叫節點命令來操作 iOS app，
但這些呼叫會經過閘道節點通訊協定，並遵循 iOS 前景/背景限制。請使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
進行本機桌面控制，並使用本頁了解 iOS 節點能力。

### 畫布 eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 通話模式

- 語音喚醒與對話模式可在設定中使用。
- 當 `talk.realtime.transport` 為 `webrtc` 時，OpenAI 即時對話會使用由用戶端擁有的 WebRTC；明確的 `gateway-relay` 設定仍由閘道擁有。請參閱[對話模式](/zh-TW/nodes/talk)。
- 支援對話的 iOS 節點會公告 `talk` 功能，並可宣告
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  閘道預設允許受信任且支援對話的節點使用這些按住說話命令。
- iOS 可能會暫停背景音訊；當應用程式未啟用時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式帶到前景（畫布/相機/螢幕命令需要如此）。
- `A2UI_HOST_UNAVAILABLE`：應用程式 WebView 無法連線到內建的 A2UI 頁面；請讓應用程式保持在前景的「螢幕」分頁並重試。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已被清除；請重新配對該節點。

## 相關文件

- [配對](/zh-TW/channels/pairing)
- [探索](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
