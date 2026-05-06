---
read_when:
    - 配對或重新連線 Android 節點
    - 偵錯 Android Gateway 探索或身分驗證
    - 驗證各用戶端之間的聊天記錄一致性
summary: Android 應用程式（節點）：連線操作手冊 + 連線/聊天/語音/畫布命令介面
title: Android 應用程式
x-i18n:
    generated_at: "2026-05-06T09:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Android 應用程式尚未公開發布。原始碼可在 [OpenClaw repository](https://github.com/openclaw/openclaw) 的 `apps/android` 下取得。你可以使用 Java 17 和 Android SDK（`./gradlew :app:assemblePlayDebug`）自行建置。建置說明請參閱 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。
</Note>

## 支援快照

- 角色：伴隨節點應用程式（Android 不代管 Gateway）。
- 需要 Gateway：是（透過 WSL2 在 macOS、Linux 或 Windows 上執行）。
- 安裝：[開始使用](/zh-TW/start/getting-started) + [配對](/zh-TW/channels/pairing)。
- Gateway：[Runbook](/zh-TW/gateway) + [設定](/zh-TW/gateway/configuration)。
  - 協定：[Gateway 協定](/zh-TW/gateway/protocol)（節點 + 控制平面）。

## 系統控制

系統控制（launchd/systemd）位於 Gateway 主機上。請參閱 [Gateway](/zh-TW/gateway)。

## 連線 Runbook

Android 節點應用程式 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android 會直接連線到 Gateway WebSocket，並使用裝置配對（`role: node`）。

對於 Tailscale 或公開主機，Android 需要安全端點：

- 建議：Tailscale Serve / Funnel，使用 `https://<magicdns>` / `wss://<magicdns>`
- 也支援：任何其他具有真實 TLS 端點的 `wss://` Gateway URL
- 明文 `ws://` 仍支援私人 LAN 位址 / `.local` 主機，以及 `localhost`、`127.0.0.1` 和 Android 模擬器橋接器（`10.0.2.2`）

### 先決條件

- 你可以在「master」機器上執行 Gateway。
- Android 裝置/模擬器可以連到 Gateway WebSocket：
  - 使用 mDNS/NSD 的同一個 LAN，**或**
  - 使用 Wide-Area Bonjour / unicast DNS-SD 的同一個 Tailscale tailnet（見下方），**或**
  - 手動 Gateway 主機/連接埠（備用）
- Tailnet/公開行動配對**不**使用原始 tailnet IP `ws://` 端點。請改用 Tailscale Serve 或另一個 `wss://` URL。
- 你可以在 Gateway 機器上（或透過 SSH）執行 CLI（`openclaw`）。

### 1) 啟動 Gateway

```bash
openclaw gateway --port 18789 --verbose
```

確認在記錄中看到類似以下內容：

- `listening on ws://0.0.0.0:18789`

若要讓遠端 Android 透過 Tailscale 存取，建議使用 Serve/Funnel，而不是原始 tailnet 綁定：

```bash
openclaw gateway --tailscale serve
```

這會提供 Android 安全的 `wss://` / `https://` 端點。除非你另外終止 TLS，否則單純的 `gateway.bind: "tailnet"` 設定不足以進行首次遠端 Android 配對。

### 2) 驗證探索（選用）

從 Gateway 機器執行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多除錯備註：[Bonjour](/zh-TW/gateway/bonjour)。

如果你也設定了廣域探索網域，請與以下輸出比較：

```bash
openclaw gateway discover --json
```

這會在一次執行中顯示 `local.` 以及已設定的廣域網域，並使用已解析的服務端點，而不只是 TXT 提示。

#### 透過 unicast DNS-SD 進行 Tailnet（維也納 ⇄ 倫敦）探索

Android NSD/mDNS 探索不會跨網路。如果你的 Android 節點和 Gateway 位於不同網路，但透過 Tailscale 連線，請改用 Wide-Area Bonjour / unicast DNS-SD。

僅靠探索不足以進行 tailnet/公開 Android 配對。探索到的路由仍需要安全端點（`wss://` 或 Tailscale Serve）：

1. 在 Gateway 主機上設定 DNS-SD 區域（例如 `openclaw.internal.`），並發布 `_openclaw-gw._tcp` 記錄。
2. 為你選擇的網域設定 Tailscale split DNS，指向該 DNS 伺服器。

詳細資訊與 CoreDNS 設定範例：[Bonjour](/zh-TW/gateway/bonjour)。

### 3) 從 Android 連線

在 Android 應用程式中：

- 應用程式會透過**前景服務**（持續通知）維持 Gateway 連線。
- 開啟 **Connect** 分頁。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果探索被封鎖，請使用 **Advanced controls** 中的手動主機/連接埠。對於私人 LAN 主機，`ws://` 仍可運作。對於 Tailscale/公開主機，請啟用 TLS 並使用 `wss://` / Tailscale Serve 端點。

首次成功配對後，Android 會在啟動時自動重新連線：

- 手動端點（如果已啟用），否則
- 最後探索到的 Gateway（盡力而為）。

### Presence 存活信標

已驗證的節點工作階段連線後，以及當應用程式移至背景且前景服務仍保持連線時，Android 會呼叫 `node.event`，並帶有 `event: "node.presence.alive"`。Gateway 只有在已知已驗證的節點裝置身分後，才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當 Gateway 回應包含 `handled: true` 時，應用程式才會將信標計為已成功記錄。較舊的 Gateway 可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不會計為持久的最後看到更新。

### 4) 核准配對（CLI）

在 Gateway 機器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配對詳細資訊：[配對](/zh-TW/channels/pairing)。

選用：如果 Android 節點一律從嚴格控管的子網路連線，你可以使用明確的 CIDR 或精確 IP，選擇加入首次節點自動核准：

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

此功能預設停用。它只適用於沒有要求 scopes 的全新 `role: node` 配對。操作者/瀏覽器配對，以及任何角色、scope、中繼資料或公開金鑰變更，仍需要手動核准。

### 5) 驗證節點已連線

- 透過節點狀態：

  ```bash
  openclaw nodes status
  ```

- 透過 Gateway：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 聊天 + 歷史紀錄

Android Chat 分頁支援工作階段選擇（預設 `main`，以及其他現有工作階段）：

- 歷史紀錄：`chat.history`（顯示正規化；行內指令標籤會從可見文字中移除，純文字 tool-call XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截斷的 tool-call 區塊）以及外洩的 ASCII/全形模型控制 token 會被移除，純靜默 token assistant 列，例如精確的 `NO_REPLY` / `no_reply` 會被省略，過大的列可替換為 placeholders）
- 傳送：`chat.send`
- 推送更新（盡力而為）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 相機

#### Gateway Canvas Host（建議用於 Web 內容）

如果你希望節點顯示代理可以在磁碟上編輯的真實 HTML/CSS/JS，請將節點指向 Gateway canvas host。

<Note>
節點會從 Gateway HTTP 伺服器載入 canvas（與 `gateway.port` 相同連接埠，預設 `18789`）。
</Note>

1. 在 Gateway 主機上建立 `~/.openclaw/workspace/canvas/index.html`。

2. 將節點導覽到該位置（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（選用）：如果兩台裝置都在 Tailscale 上，請使用 MagicDNS 名稱或 tailnet IP 取代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此伺服器會將即時重新載入用戶端注入 HTML，並在檔案變更時重新載入。
A2UI host 位於 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（僅限前景）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回預設 scaffold）。`canvas.snapshot` 會回傳 `{ format, base64 }`（預設 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 舊版別名）

相機命令（僅限前景；受權限限制）：

- `camera.snap` (jpg)
- `camera.clip` (mp4)

參數與 CLI 輔助工具請參閱 [Camera 節點](/zh-TW/nodes/camera)。

### 8) 語音 + 擴充 Android 命令介面

- Voice 分頁：Android 有兩種明確的擷取模式。**Mic** 是手動 Voice 分頁工作階段，會將每次停頓作為一次聊天回合傳送，並在應用程式離開前景或使用者離開 Voice 分頁時停止。**Talk** 是連續 Talk Mode，會持續聆聽直到關閉或節點中斷連線。
- Talk Mode 會在擷取開始前，將現有前景服務從 `dataSync` 提升為 `dataSync|microphone`，然後在 Talk Mode 停止時降回原狀。Android 14+ 需要 `FOREGROUND_SERVICE_MICROPHONE` 宣告、`RECORD_AUDIO` 執行階段授權，以及執行階段的麥克風服務類型。
- 語音回覆會透過已設定的 Gateway Talk provider 使用 `talk.speak`。只有在 `talk.speak` 不可用時，才會使用本機系統 TTS。
- 語音喚醒在 Android UX/執行階段中仍為停用。
- 其他 Android 命令族（可用性取決於裝置 + 權限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（見下方的[通知轉送](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant 進入點

Android 支援從系統 assistant 觸發器（Google Assistant）啟動 OpenClaw。設定後，長按首頁按鈕或說出「Hey Google, ask OpenClaw...」會開啟應用程式，並將提示交給聊天 composer。

這使用 Android **App Actions** 中繼資料，該資料宣告於應用程式 manifest 中。Gateway 端不需要額外設定，assistant intent 完全由 Android 應用程式處理，並作為一般聊天訊息轉送。

<Note>
App Actions 可用性取決於裝置、Google Play Services 版本，以及使用者是否已將 OpenClaw 設為預設 assistant 應用程式。
</Note>

## 通知轉送

Android 可將裝置通知作為事件轉送到 Gateway。多項控制可讓你限定哪些通知會在何時被轉送。

| Key                              | Type           | Description                                                                 |
| -------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 只轉送來自這些 package 名稱的通知。如果已設定，所有其他 package 都會被忽略。 |
| `notifications.denyPackages`     | string[]       | 絕不轉送來自這些 package 名稱的通知。會在 `allowPackages` 之後套用。         |
| `notifications.quietHours.start` | string (HH:mm) | 安靜時段視窗開始（本機裝置時間）。通知會在此視窗期間被抑制。                |
| `notifications.quietHours.end`   | string (HH:mm) | 安靜時段視窗結束。                                                          |
| `notifications.rateLimit`        | number         | 每個 package 每分鐘可轉送通知的最大數量。超出的通知會被丟棄。              |

通知選擇器也會對轉送的通知事件採用更安全的行為，防止意外轉送敏感的系統通知。

設定範例：

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
通知轉送需要 Android Notification Listener 權限。應用程式會在設定期間提示授予此權限。
</Note>

## 相關

- [iOS 應用程式](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [Android 節點疑難排解](/zh-TW/nodes/troubleshooting)
