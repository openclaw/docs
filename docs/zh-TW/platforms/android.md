---
read_when:
    - 配對或重新連線 Android 節點
    - 偵錯 Android 閘道探索或驗證
    - 跨用戶端驗證聊天記錄一致性
summary: Android 應用程式（節點）：連線操作手冊 + 連線/聊天/語音/畫布命令介面
title: Android 應用程式
x-i18n:
    generated_at: "2026-06-27T19:30:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 應用程式可在 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 取得。它是一個配套節點，並且需要正在執行的 OpenClaw 閘道。原始碼也可在 [OpenClaw 儲存庫](https://github.com/openclaw/openclaw) 的 `apps/android` 底下取得；建置說明請參閱 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。
</Note>

## 支援快照

- 角色：配套節點應用程式（Android 不託管閘道）。
- 需要閘道：是（透過 WSL2 在 macOS、Linux 或 Windows 上執行）。
- 安裝：應用程式請用 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，閘道請參閱[開始使用](/zh-TW/start/getting-started)，然後參閱[配對](/zh-TW/channels/pairing)。
- 閘道：[執行手冊](/zh-TW/gateway) + [設定](/zh-TW/gateway/configuration)。
  - 協定：[閘道協定](/zh-TW/gateway/protocol)（節點 + 控制平面）。

## 系統控制

系統控制（launchd/systemd）位於閘道主機上。請參閱[閘道](/zh-TW/gateway)。

## 連線執行手冊

Android 節點應用程式 ⇄ (mDNS/NSD + WebSocket) ⇄ **閘道**

Android 會直接連線到閘道 WebSocket，並使用裝置配對（`role: node`）。

對於 Tailscale 或公開主機，Android 需要安全端點：

- 建議：Tailscale Serve / Funnel 搭配 `https://<magicdns>` / `wss://<magicdns>`
- 也支援：任何其他具備真實 TLS 端點的 `wss://` 閘道 URL
- Cleartext `ws://` 仍支援私人 LAN 位址 / `.local` 主機，以及 `localhost`、`127.0.0.1` 和 Android 模擬器橋接（`10.0.2.2`）

### 先決條件

- 你可以在「master」機器上執行閘道。
- Android 裝置/模擬器可以連到閘道 WebSocket：
  - 使用 mDNS/NSD 的同一個 LAN，**或**
  - 使用 Wide-Area Bonjour / unicast DNS-SD 的同一個 Tailscale tailnet（見下方），**或**
  - 手動閘道主機/連接埠（備援）
- Tailnet/公開行動配對**不**使用原始 tailnet IP `ws://` 端點。請改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在閘道機器上（或透過 SSH）執行命令列介面（`openclaw`）。

### 1) 啟動閘道

```bash
openclaw gateway --port 18789 --verbose
```

確認在記錄中看到類似以下內容：

- `listening on ws://0.0.0.0:18789`

若要透過 Tailscale 進行遠端 Android 存取，建議使用 Serve/Funnel，而不是原始 tailnet 綁定：

```bash
openclaw gateway --tailscale serve
```

這會為 Android 提供安全的 `wss://` / `https://` 端點。單純的 `gateway.bind: "tailnet"` 設定不足以進行首次遠端 Android 配對，除非你也另外終止 TLS。

### 2) 驗證探索（選用）

從閘道機器：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多除錯說明：[Bonjour](/zh-TW/gateway/bonjour)。

如果你也設定了廣域探索網域，請與以下指令比較：

```bash
openclaw gateway discover --json
```

這會在一次執行中顯示 `local.` 加上已設定的廣域網域，並使用已解析的
服務端點，而不是僅使用 TXT 提示。

#### 透過 unicast DNS-SD 進行 Tailnet（維也納 ⇄ 倫敦）探索

Android NSD/mDNS 探索不會跨網路。如果你的 Android 節點和閘道位於不同網路，但透過 Tailscale 連線，請改用 Wide-Area Bonjour / unicast DNS-SD。

僅有探索不足以進行 tailnet/公開 Android 配對。探索到的路由仍需要安全端點（`wss://` 或 Tailscale Serve）：

1. 在閘道主機上設定 DNS-SD 區域（例如 `openclaw.internal.`），並發布 `_openclaw-gw._tcp` 記錄。
2. 為你選擇的網域設定 Tailscale split DNS，指向該 DNS 伺服器。

詳細資訊與 CoreDNS 設定範例：[Bonjour](/zh-TW/gateway/bonjour)。

### 3) 從 Android 連線

在 Android 應用程式中：

- 應用程式會透過**前景服務**（持續通知）保持閘道連線存活。
- 開啟 **Connect** 分頁。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果探索遭到封鎖，請在 **Advanced controls** 中使用手動主機/連接埠。對於私人 LAN 主機，`ws://` 仍可運作。對於 Tailscale/公開主機，請開啟 TLS 並使用 `wss://` / Tailscale Serve 端點。

首次成功配對後，Android 會在啟動時自動重新連線：

- 手動端點（如果已啟用），否則
- 最後探索到的閘道（盡力而為）。

### Presence alive 信標

已驗證的節點工作階段連線後，以及當應用程式移至背景而
前景服務仍保持連線時，Android 會呼叫 `node.event`，並帶有
`event: "node.presence.alive"`。閘道只會在已知已驗證節點裝置身分後，才將此記錄為
已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，應用程式才會將信標計為成功記錄。
較舊的閘道可能會以 `{ "ok": true }` 確認 `node.event`；該回應
相容，但不計為持久的最後可見更新。

### 4) 核准配對（命令列介面）

在閘道機器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配對詳細資訊：[配對](/zh-TW/channels/pairing)。

選用：如果 Android 節點總是從嚴格控管的子網路連線，
你可以透過明確 CIDR 或精確 IP 選擇加入首次節點自動核准：

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

預設為停用。這只適用於沒有要求 scope 的全新 `role: node` 配對。Operator/browser 配對，以及任何角色、scope、中繼資料或
公開金鑰變更仍需要手動核准。

### 5) 驗證節點已連線

- 透過節點狀態：

  ```bash
  openclaw nodes status
  ```

- 透過閘道：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 聊天 + 歷史記錄

Android Chat 分頁支援工作階段選取（預設 `main`，以及其他現有工作階段）：

- 歷史記錄：`chat.history`（顯示已正規化；內嵌指令標籤會從可見文字中
  移除，純文字工具呼叫 XML 酬載（包含
  `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及
  截斷的工具呼叫區塊）和洩漏的 ASCII/全形模型控制權杖
  會被移除，純靜默權杖 assistant 列，例如精確的 `NO_REPLY` /
  `no_reply` 會被省略，過大的列可替換為預留位置）
- 傳送：`chat.send`
- 推送更新（盡力而為）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 相機

#### 閘道 Canvas 主機（建議用於網頁內容）

如果你希望節點顯示代理可以在磁碟上編輯的真實 HTML/CSS/JS，請將節點指向閘道 canvas 主機。

<Note>
節點會從閘道 HTTP 伺服器載入 canvas（與 `gateway.port` 相同連接埠，預設 `18789`）。
</Note>

1. 在閘道主機上建立 `~/.openclaw/workspace/canvas/index.html`。

2. 將節點導覽到該位置（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（選用）：如果兩台裝置都在 Tailscale 上，請使用 MagicDNS 名稱或 tailnet IP，而不是 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此伺服器會將即時重新載入用戶端注入 HTML，並在檔案變更時重新載入。
閘道也會提供 `/__openclaw__/a2ui/`，但 Android 應用程式會將遠端 A2UI 頁面視為僅供算繪。具動作能力的 A2UI 命令會先使用隨附、應用程式擁有的 A2UI 頁面，再套用訊息。

Canvas 命令（僅前景）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回預設 scaffold）。`canvas.snapshot` 會回傳 `{ format, base64 }`（預設 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 舊版別名）。這些命令會使用隨附、應用程式擁有的 A2UI 頁面進行具動作能力的算繪。

相機命令（僅前景；受權限控管）：

- `camera.snap` (jpg)
- `camera.clip` (mp4)

參數和命令列介面輔助工具請參閱[相機節點](/zh-TW/nodes/camera)。

### 8) 語音 + 擴充的 Android 命令表面

- Voice 分頁：Android 有兩種明確的擷取模式。**Mic** 是手動 Voice 分頁工作階段，會將每次暫停作為聊天回合傳送，並在應用程式離開前景或使用者離開 Voice 分頁時停止。**Talk** 是連續 Talk Mode，會持續聆聽，直到切換關閉或節點中斷連線。
- Talk Mode 會在擷取開始前，將現有前景服務從 `connectedDevice` 提升為 `connectedDevice|microphone`，然後在 Talk Mode 停止時降回。節點服務會以 `CHANGE_NETWORK_STATE` 宣告 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 也需要 `FOREGROUND_SERVICE_MICROPHONE` 宣告、`RECORD_AUDIO` 執行階段授權，以及執行階段的麥克風服務類型。
- 預設情況下，Android Talk 會透過已設定的閘道 Talk provider 使用原生語音辨識、閘道聊天和 `talk.speak`。只有在 `talk.speak` 不可用時，才會使用本機系統 TTS。
- 只有當 `talk.realtime.mode` 為 `realtime` 且 `talk.realtime.transport` 為 `gateway-relay` 時，Android Talk 才會使用即時閘道轉送。
- Voice wake 在 Android UX/執行階段中仍保持停用。
- 其他 Android 命令系列（可用性取決於裝置、權限和使用者設定）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` 只有在啟用 **Settings > Phone Capabilities > Installed Apps** 時可用；預設會列出 launcher 可見的應用程式。
  - `notifications.list`、`notifications.actions`（請參閱下方的[通知轉發](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant 進入點

Android 支援從系統 assistant 觸發器（Google
Assistant）啟動 OpenClaw。設定完成後，按住首頁按鈕或說「Hey Google, ask
OpenClaw...」會開啟應用程式，並將提示交給聊天編輯器。

這會使用應用程式 manifest 中宣告的 Android **App Actions** 中繼資料。閘道端不需要
額外設定；assistant intent 完全由 Android 應用程式處理，並作為一般聊天訊息轉發。

<Note>
App Actions 可用性取決於裝置、Google Play Services 版本，
以及使用者是否已將 OpenClaw 設為預設 assistant 應用程式。
</Note>

## 通知轉發

Android 可以將裝置通知作為事件轉發到閘道。多個控制項可讓你限定要轉發哪些通知以及何時轉發。

| 鍵                               | 類型           | 說明                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 只轉發來自這些套件名稱的通知。如果已設定，所有其他套件都會被忽略。      |
| `notifications.denyPackages`     | string[]       | 絕不轉發來自這些套件名稱的通知。在 `allowPackages` 之後套用。              |
| `notifications.quietHours.start` | string (HH:mm) | 安靜時段視窗開始時間（本機裝置時間）。此視窗期間會抑制通知。 |
| `notifications.quietHours.end`   | string (HH:mm) | 安靜時段視窗結束時間。                                                                        |
| `notifications.rateLimit`        | number         | 每個套件每分鐘轉發通知的最大數量。超出的通知會被丟棄。         |

通知選擇器也會對已轉發的通知事件使用更安全的行為，防止意外轉發敏感系統通知。

範例設定：

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
通知轉送需要 Android 通知監聽器權限。應用程式會在設定期間提示授予此權限。
</Note>

## 相關

- [iOS 應用程式](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [Android 節點疑難排解](/zh-TW/nodes/troubleshooting)
