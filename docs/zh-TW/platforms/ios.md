---
read_when:
    - 配對或重新連線 iOS Node
    - 從原始碼執行 iOS 應用程式
    - 偵錯 Gateway 探索或畫布命令
summary: iOS Node 應用程式：連線至 Gateway、配對、畫布與疑難排解
title: iOS 應用程式
x-i18n:
    generated_at: "2026-04-30T03:19:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

可用性：內部預覽。iOS 應用程式尚未公開發行。

## 功能

- 透過 WebSocket（LAN 或 tailnet）連線到 Gateway。
- 公開 Node 功能：Canvas、螢幕快照、相機擷取、位置、對話模式、語音喚醒。
- 接收 `node.invoke` 命令並回報 Node 狀態事件。

## 需求

- Gateway 在另一部裝置上執行（macOS、Linux，或透過 WSL2 的 Windows）。
- 網路路徑：
  - 透過 Bonjour 的相同 LAN，**或**
  - 透過單播 DNS-SD 的 Tailnet（範例網域：`openclaw.internal.`），**或**
  - 手動主機/連接埠（備援）。

## 快速開始（配對 + 連線）

1. 啟動 Gateway：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 應用程式中，開啟「設定」並選取探索到的 gateway（或啟用「手動主機」並輸入主機/連接埠）。

3. 在 gateway 主機上核准配對請求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果應用程式以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試配對，
先前待處理的請求會被取代，並建立新的 `requestId`。
核准前請再次執行 `openclaw devices list`。

選用：如果 iOS Node 一律從嚴格控管的子網路連線，你可以選擇使用明確 CIDR 或精確 IP 進行首次 Node 自動核准：

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

此功能預設停用。它只適用於沒有請求範圍的全新 `role: node` 配對。操作者/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

4. 驗證連線：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方建置的 relay-backed push

官方發行的 iOS 建置使用外部推播中繼，而不是將原始 APNs
權杖發布到 gateway。

Gateway 端需求：

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
- iOS 應用程式會擷取已配對 gateway 身分，並在中繼註冊中包含它，因此 relay-backed 註冊會委派給該特定 gateway。
- 應用程式會使用 `push.apns.register` 將該 relay-backed 註冊轉送給已配對的 gateway。
- Gateway 會將儲存的中繼控制代碼用於 `push.test`、背景喚醒和喚醒提示。
- Gateway 中繼基底 URL 必須符合官方/TestFlight iOS 建置中內嵌的中繼 URL。
- 如果應用程式之後連線到不同 gateway，或連線到具有不同中繼基底 URL 的建置，它會重新整理中繼註冊，而不是重複使用舊繫結。

此路徑中 gateway **不**需要的項目：

- 不需要部署範圍的中繼權杖。
- 官方/TestFlight relay-backed 傳送不需要直接 APNs 金鑰。

預期操作者流程：

1. 安裝官方/TestFlight iOS 建置。
2. 在 gateway 上設定 `gateway.push.apns.relay.baseUrl`。
3. 將應用程式與 gateway 配對，並讓它完成連線。
4. 應用程式在取得 APNs 權杖、操作者工作階段已連線且中繼註冊成功後，會自動發布 `push.apns.register`。
5. 之後，`push.test`、重新連線喚醒和喚醒提示即可使用儲存的 relay-backed 註冊。

## 背景存活信標

當 iOS 因靜默推播、背景重新整理或重大位置事件而喚醒應用程式時，應用程式
會嘗試進行短暫的 Node 重新連線，然後以 `event: "node.presence.alive"` 呼叫 `node.event`。
Gateway 只有在已知已驗證的 Node 裝置身分後，才會將此記錄為已配對 Node/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當 gateway 回應包含 `handled: true` 時，應用程式才會將背景喚醒視為已成功記錄。較舊的 gateway 可能會以 `{ "ok": true }` 確認 `node.event`；該回應
相容，但不會計為持久的上次可見更新。

相容性注意事項：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作為 gateway 的暫時環境覆寫使用。

## 驗證與信任流程

中繼的存在是為了強制執行兩項直接在 gateway 上使用 APNs 無法為
官方 iOS 建置提供的限制：

- 只有透過 Apple 發行的正版 OpenClaw iOS 建置可以使用託管中繼。
- Gateway 只能為與該特定 gateway 配對的 iOS 裝置傳送 relay-backed 推播。

逐段流程：

1. `iOS app -> gateway`
   - 應用程式會先透過一般 Gateway 驗證流程與 gateway 配對。
   - 這會提供應用程式已驗證的 Node 工作階段，以及已驗證的操作者工作階段。
   - 操作者工作階段用於呼叫 `gateway.identity.get`。

2. `iOS app -> relay`
   - 應用程式透過 HTTPS 呼叫中繼註冊端點。
   - 註冊包含 App Attest 證明以及 StoreKit 應用程式交易 JWS。
   - 中繼會驗證套件 ID、App Attest 證明和 Apple 發行證明，並要求
     官方/生產發行路徑。
   - 這就是阻止本機 Xcode/開發建置使用託管中繼的機制。本機建置可以
     已簽署，但它不符合中繼預期的官方 Apple 發行證明。

3. `gateway identity delegation`
   - 在中繼註冊前，應用程式會從 `gateway.identity.get`
     擷取已配對 gateway 身分。
   - 應用程式會在中繼註冊承載中包含該 gateway 身分。
   - 中繼會回傳中繼控制代碼和註冊範圍的傳送授權，並委派給
     該 gateway 身分。

4. `gateway -> relay`
   - Gateway 會儲存來自 `push.apns.register` 的中繼控制代碼和傳送授權。
   - 在 `push.test`、重新連線喚醒和喚醒提示時，gateway 會使用
     自己的裝置身分簽署傳送請求。
   - 中繼會根據註冊時委派的
     gateway 身分，驗證儲存的傳送授權和 gateway 簽章。
   - 即使另一個 gateway 以某種方式取得控制代碼，也無法重複使用該儲存的註冊。

5. `relay -> APNs`
   - 中繼擁有官方建置的生產 APNs 認證和原始 APNs 權杖。
   - 對於 relay-backed 官方建置，gateway 永遠不會儲存原始 APNs 權杖。
   - 中繼會代表已配對的 gateway，將最終推播傳送到 APNs。

建立此設計的原因：

- 將生產 APNs 認證留在使用者 gateway 之外。
- 避免在 gateway 上儲存官方建置的原始 APNs 權杖。
- 僅允許官方/TestFlight OpenClaw 建置使用託管中繼。
- 防止某個 gateway 對屬於不同 gateway 的 iOS 裝置傳送喚醒推播。

本機/手動建置仍使用直接 APNs。如果你在沒有中繼的情況下測試這些建置，
gateway 仍需要直接 APNs 認證：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

這些是 gateway 主機執行階段環境變數，不是 Fastlane 設定。`apps/ios/fastlane/.env` 只儲存
App Store Connect / TestFlight 驗證，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不會設定
本機 iOS 建置的直接 APNs 傳遞。

建議的 gateway 主機儲存位置：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

請勿提交 `.p8` 檔案，或將它放在 repo checkout 之下。

## 探索路徑

### Bonjour（LAN）

iOS 應用程式會在 `local.` 上瀏覽 `_openclaw-gw._tcp`，並在已設定時瀏覽相同的
廣域 DNS-SD 探索網域。相同 LAN 的 gateway 會自動從 `local.` 顯示；
跨網路探索可以使用已設定的廣域網域，而不需變更信標類型。

### Tailnet（跨網路）

如果 mDNS 被封鎖，請使用單播 DNS-SD 區域（選擇一個網域；範例：
`openclaw.internal.`）和 Tailscale split DNS。
請參閱 [Bonjour](/zh-TW/gateway/bonjour) 取得 CoreDNS 範例。

### 手動主機/連接埠

在「設定」中，啟用**手動主機**並輸入 gateway 主機 + 連接埠（預設 `18789`）。

## Canvas + A2UI

iOS Node 會轉譯 WKWebView Canvas。使用 `node.invoke` 驅動它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意事項：

- Gateway Canvas 主機提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway HTTP 伺服器提供（與 `gateway.port` 相同連接埠，預設 `18789`）。
- 當有公告 Canvas 主機 URL 時，iOS Node 會在連線時自動導覽到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回內建 scaffold。

## Computer Use 關係

iOS 應用程式是一個行動 Node 介面，不是 Codex Computer Use 後端。Codex
Computer Use 和 `cua-driver mcp` 透過 MCP 工具控制本機 macOS 桌面；iOS 應用程式則透過 OpenClaw Node 命令
公開 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

代理仍可透過 OpenClaw 叫用 Node
命令來操作 iOS 應用程式，但這些呼叫會經由 gateway Node 通訊協定，並遵循 iOS
前景/背景限制。使用 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
控制本機桌面，並使用本頁了解 iOS Node 功能。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 語音喚醒 + 對話模式

- 語音喚醒和對話模式可在「設定」中使用。
- iOS 可能會暫停背景音訊；當應用程式未作用中時，請將語音功能視為盡力而為。

## 常見錯誤

- `NODE_BACKGROUND_UNAVAILABLE`：將 iOS 應用程式帶到前景（Canvas/相機/螢幕命令需要前景）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 未公告 Canvas 主機 URL；請檢查 [Gateway configuration](/zh-TW/gateway/configuration) 中的 `canvasHost`。
- 配對提示從未出現：執行 `openclaw devices list` 並手動核准。
- 重新安裝後重新連線失敗：Keychain 配對權杖已清除；請重新配對 Node。

## 相關文件

- [Pairing](/zh-TW/channels/pairing)
- [Discovery](/zh-TW/gateway/discovery)
- [Bonjour](/zh-TW/gateway/bonjour)
