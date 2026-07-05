---
read_when:
    - 配對或重新連線 Android 節點
    - 偵錯 Android 閘道探索或驗證
    - 跨用戶端驗證聊天記錄一致性
summary: Android 應用程式（節點）：連線操作手冊 + Connect/Chat/Voice/Canvas 命令介面
title: Android 應用程式
x-i18n:
    generated_at: "2026-07-05T11:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6eb5e4028c9b53f77f97335773adf6e7f4aec422eaad728566e0b9a98962f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 應用程式可在 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 取得。它是搭配使用的節點，需要正在執行的 OpenClaw 閘道。來源：[apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[建置指示](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## 支援快照

- 角色：搭配使用的節點應用程式（Android 不會託管閘道）。
- 需要閘道：是（透過 WSL2 在 macOS、Linux 或 Windows 上執行）。
- 安裝：應用程式請用 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，閘道請用[開始使用](/zh-TW/start/getting-started)，接著進行[配對](/zh-TW/channels/pairing)。
- 閘道：[執行手冊](/zh-TW/gateway) + [設定](/zh-TW/gateway/configuration)。
  - 通訊協定：[閘道通訊協定](/zh-TW/gateway/protocol)（節點 + 控制平面）。

系統控制（launchd/systemd）位於閘道主機上，請參閱[閘道](/zh-TW/gateway)。

## 連線執行手冊

Android 節點應用程式 ⇄ (mDNS/NSD + WebSocket) ⇄ **閘道**

Android 會直接連線到閘道 WebSocket，並使用裝置配對（`role: node`）。

對於 Tailscale 或公開主機，Android 需要安全端點：

- 建議：Tailscale Serve / Funnel，搭配 `https://<magicdns>` / `wss://<magicdns>`
- 也支援：任何其他具備真正 TLS 端點的 `wss://` 閘道 URL
- 明文 `ws://` 仍支援私人 LAN 位址 / `.local` 主機，以及 `localhost`、`127.0.0.1` 和 Android 模擬器橋接位址（`10.0.2.2`）

### 先決條件

- 閘道正在另一台機器上執行（或可透過 SSH 存取）。
- Android 裝置/模擬器可以連到閘道 WebSocket：
  - 使用 mDNS/NSD 的同一個 LAN，**或**
  - 使用 Wide-Area Bonjour / 單點傳播 DNS-SD 的同一個 Tailscale tailnet（見下方），**或**
  - 手動閘道主機/連接埠（備援）
- Tailnet/公開行動配對**不**使用原始 tailnet IP `ws://` 端點。請改用 Tailscale Serve 或另一個 `wss://` URL。
- 閘道機器上（或透過 SSH）可使用 `openclaw` 命令列介面，以核准配對要求。

### 1. 啟動閘道

```bash
openclaw gateway --port 18789 --verbose
```

確認在記錄中看到類似以下內容：

- `listening on ws://0.0.0.0:18789`

若要透過 Tailscale 進行遠端 Android 存取，建議使用 Serve/Funnel，而不是原始 tailnet 綁定：

```bash
openclaw gateway --tailscale serve
```

這會為 Android 提供安全的 `wss://` / `https://` 端點。單純的 `gateway.bind: "tailnet"` 設定不足以支援首次遠端 Android 配對，除非你也另外終止 TLS。

### 2. 驗證探索（選用）

從閘道機器執行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多偵錯備註：[Bonjour](/zh-TW/gateway/bonjour)。

如果你也設定了廣域探索網域，請與以下結果比較：

```bash
openclaw gateway discover --json
```

這會在一次執行中顯示 `local.` 加上已設定的廣域網域，並使用解析後的服務端點，而不是僅使用 TXT 提示。

#### 透過單點傳播 DNS-SD 進行跨網路探索

Android NSD/mDNS 探索不會跨網路。如果 Android 節點和閘道位於不同網路，但透過 Tailscale 連線，請改用 Wide-Area Bonjour / 單點傳播 DNS-SD。僅有探索不足以支援 tailnet/公開 Android 配對，探索到的路由仍需要安全端點（`wss://` 或 Tailscale Serve）：

1. 在閘道主機上設定 DNS-SD 區域（例如 `openclaw.internal.`），並發布 `_openclaw-gw._tcp` 記錄。
2. 為你選擇的網域設定 Tailscale split DNS，指向該 DNS 伺服器。

詳細資訊與 CoreDNS 設定範例：[Bonjour](/zh-TW/gateway/bonjour)。

### 3. 從 Android 連線

在 Android 應用程式中：

- 應用程式會透過**前景服務**（持續通知）維持閘道連線。
- 開啟**連線**分頁。
- 使用**設定碼**或**手動**模式。
- 如果探索遭封鎖，請在**進階控制項**中使用手動主機/連接埠。對於私人 LAN 主機，`ws://` 仍可使用。對於 Tailscale/公開主機，請開啟 TLS 並使用 `wss://` / Tailscale Serve 端點。

首次成功配對後，Android 會在啟動時自動重新連線：若已啟用，使用手動端點；否則使用上次探索到的閘道（盡力而為）。

### 線上狀態存活信標

已驗證的節點工作階段連線後，且應用程式移到背景但前景服務仍保持連線時，Android 會呼叫 `node.event`，並帶上 `event: "node.presence.alive"`。只有在已知已驗證節點裝置身分後，閘道才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，應用程式才會將信標計為已成功記錄。較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不會計為持久的最後看見更新。

### 4. 核准配對（命令列介面）

在閘道機器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配對詳細資訊：[配對](/zh-TW/channels/pairing)。

選用：如果 Android 節點一律從嚴格控管的子網路連線，你可以用明確的 CIDR 或精確 IP 選擇啟用首次節點自動核准：

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

此功能預設停用。它只套用於沒有要求範圍的新 `role: node` 配對。操作員/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

### 5. 驗證節點已連線

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 聊天 + 歷史

Android 聊天分頁支援工作階段選擇（預設為 `main`，另加其他既有工作階段）：

- 歷史：`chat.history`（顯示已正規化：會移除行內指令標籤、純文字工具呼叫 XML 承載（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>` 及截斷變體），以及外洩的 ASCII/全形模型控制權杖；會省略靜默權杖助理列，例如精確的 `NO_REPLY` / `no_reply`；過大的列可用佔位符替換）
- 傳送：`chat.send`
- 推送更新（盡力而為）：`chat.subscribe` -> `event:"chat"`

### 7. Canvas + 相機

#### 閘道 Canvas 主機（建議用於網頁內容）

若要讓節點顯示代理可以在磁碟上編輯的真實 HTML/CSS/JS，請將節點指向閘道 canvas 主機。

<Note>
節點會從閘道 HTTP 伺服器載入 canvas（與 `gateway.port` 相同連接埠，預設 `18789`）。
</Note>

1. 在閘道主機上建立 `~/.openclaw/workspace/canvas/index.html`。
2. 將節點導覽至該位置（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（選用）：如果兩台裝置都在 Tailscale 上，請使用 MagicDNS 名稱或 tailnet IP 取代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此伺服器會將即時重新載入用戶端注入 HTML，並在檔案變更時重新載入。閘道也會提供 `/__openclaw__/a2ui/`，但 Android 應用程式會將遠端 A2UI 頁面視為僅供呈現。具備動作能力的 A2UI 命令會使用隨附、由應用程式擁有的 A2UI 頁面。

Canvas 命令（僅前景）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回預設腳手架）。`canvas.snapshot` 會傳回 `{ format, base64 }`（預設 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 舊版別名）。這些會使用隨附、由應用程式擁有的 A2UI 頁面進行具備動作能力的呈現。

相機命令（僅前景；受權限控管）：`camera.snap`（jpg）、`camera.clip`（mp4）。參數與命令列介面輔助工具請參閱[相機節點](/zh-TW/nodes/camera)。

### 8. 語音 + 擴充的 Android 命令介面

- 語音分頁：Android 有兩種明確的擷取模式。**麥克風**是手動語音分頁工作階段，會將每次停頓作為聊天回合傳送，並在應用程式離開前景或使用者離開語音分頁時停止。**對話**是連續對話模式，會持續聆聽直到切換關閉或節點中斷連線。
- 對話模式會在擷取開始前，將既有前景服務從 `connectedDevice` 提升為 `connectedDevice|microphone`，然後在對話模式停止時降回。節點服務會宣告含 `CHANGE_NETWORK_STATE` 的 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 也需要 `FOREGROUND_SERVICE_MICROPHONE` 宣告、`RECORD_AUDIO` 執行階段授權，以及執行階段的麥克風服務類型。
- 預設情況下，Android 對話會透過已設定的閘道對話提供者使用原生語音辨識、閘道聊天和 `talk.speak`。只有在 `talk.speak` 無法使用時，才會使用本機系統 TTS。
- Android 對話只會在 `talk.realtime.mode` 為 `realtime` 且 `talk.realtime.transport` 為 `gateway-relay` 時，使用即時閘道轉送。
- 原始碼中已實作語音喚醒（`VoiceWakeMode`），但出貨的應用程式執行階段在連線時一律強制將它設為 `off`，目前沒有面向使用者的切換開關。
- 其他 Android 命令家族（可用性取決於裝置、權限和使用者設定）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` 僅在**設定 > 手機功能 > 已安裝的應用程式**啟用時可用；它預設會列出啟動器可見的應用程式（傳入 `includeNonLaunchable` 可取得完整清單）。
  - `notifications.list`、`notifications.actions`（見下方的[通知轉送](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助理進入點

Android 支援從系統助理觸發器（Google Assistant）啟動 OpenClaw。按住首頁按鈕（或其他 `ACTION_ASSIST` 觸發器）會開啟應用程式；說出「Hey Google, ask OpenClaw `<prompt>`」會符合應用程式宣告的 App Actions 查詢模式，並將提示交給聊天撰寫器，但不會自動傳送。

這會使用 Android **App Actions**（`shortcuts.xml` capability），並在應用程式資訊清單中宣告。不需要任何閘道端設定，助理 intent 完全由 Android 應用程式處理。

<Note>
App Actions 的可用性取決於裝置、Google Play Services 版本，以及使用者是否已將 OpenClaw 設為預設助理應用程式。
</Note>

## 通知轉送

Android 可以將裝置通知作為 `node.event` 項目轉送到閘道。這是在**裝置上**的應用程式設定面板中設定，而不是在閘道/`openclaw.json` 設定中。

| 設定                        | 說明                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 轉發通知事件                | 主開關。預設關閉；必須先授予通知監聽器存取權。                                                                                                                       |
| 套件篩選器                  | **允許清單**（只轉發列出的套件 ID）或 **封鎖清單**（預設：除列出 ID 外的所有套件）。OpenClaw 自身的套件在封鎖清單模式中一律排除，以防止轉發迴圈。 |
| 安靜時段                    | 本機 HH:mm 開始/結束時段，會抑制轉發。預設停用；啟用後預設為 `22:00`-`07:00`。                                                                                       |
| 每分鐘最大事件數            | 每台裝置轉發通知的速率限制。預設 20。                                                                                                                                |
| 路由工作階段金鑰            | 選用。將轉發的通知事件固定到特定工作階段，而不是裝置的預設通知路由。                                                                                                 |

<Note>
通知轉發需要 Android 通知監聽器權限。應用程式會在設定期間提示授予此權限。
</Note>

## 相關

- [iOS 應用程式](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [Android 節點疑難排解](/zh-TW/nodes/troubleshooting)
