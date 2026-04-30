---
read_when:
    - 正在開發 Google Chat 通道功能
summary: Google Chat 應用程式支援狀態、功能與設定
title: Google Chat
x-i18n:
    generated_at: "2026-04-30T02:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 16
---

Status：已可透過 Google Chat API Webhook（僅 HTTP）用於 DM + space。

## 快速設定（初學者）

1. 建立 Google Cloud 專案並啟用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未啟用 API，請啟用它。
2. 建立 **Service Account**：
   - 按 **Create Credentials** > **Service Account**。
   - 依喜好命名（例如 `openclaw-chat`）。
   - 權限留空（按 **Continue**）。
   - 可存取的主體留空（按 **Done**）。
3. 建立並下載 **JSON Key**：
   - 在 Service Account 清單中，點選你剛建立的那一個。
   - 前往 **Keys** 分頁。
   - 點選 **Add Key** > **Create new key**。
   - 選取 **JSON** 並按 **Create**。
4. 將下載的 JSON 檔案儲存在你的 Gateway 主機上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中建立 Google Chat 應用程式：
   - 填寫 **Application info**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 啟用 **Interactive features**。
   - 在 **Functionality** 下，勾選 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，選取 **HTTP endpoint URL**。
   - 在 **Triggers** 下，選取 **Use a common HTTP endpoint URL for all triggers**，並將其設為你的 Gateway 公開 URL，後面接 `/googlechat`。
     - _提示：執行 `openclaw status` 以尋找你的 Gateway 公開 URL。_
   - 在 **Visibility** 下，勾選 **Make this Chat app available to specific people and groups in `<Your Domain>`**。
   - 在文字方塊中輸入你的電子郵件地址（例如 `user@example.com`）。
   - 點選底部的 **Save**。
6. **啟用應用程式狀態**：
   - 儲存後，**重新整理頁面**。
   - 尋找 **App status** 區段（儲存後通常在頁面上方或下方附近）。
   - 將狀態變更為 **Live - available to users**。
   - 再次點選 **Save**。
7. 使用 Service Account 路徑 + Webhook audience 設定 OpenClaw：
   - Env：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或 config：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 設定 Webhook audience 類型 + 值（需符合你的 Chat 應用程式設定）。
9. 啟動 Gateway。Google Chat 會將 POST 傳送到你的 Webhook 路徑。

## 新增到 Google Chat

Gateway 執行中且你的電子郵件已新增至可見性清單後：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 點選 **Direct Messages** 旁的 **+**（加號）圖示。
3. 在搜尋列（你通常新增使用者的位置）中，輸入你在 Google Cloud Console 中設定的 **App name**。
   - **注意**：機器人不會出現在「Marketplace」瀏覽清單中，因為它是私人應用程式。你必須依名稱搜尋它。
4. 從結果中選取你的機器人。
5. 點選 **Add** 或 **Chat** 以開始 1:1 對話。
6. 傳送「Hello」以觸發助理！

## 公開 URL（僅 Webhook）

Google Chat Webhook 需要公開 HTTPS 端點。為了安全性，**只將 `/googlechat` 路徑暴露到網際網路**。請將 OpenClaw 儀表板與其他敏感端點保留在你的私人網路上。

### 選項 A：Tailscale Funnel（建議）

使用 Tailscale Serve 提供私人儀表板，並使用 Funnel 提供公開 Webhook 路徑。這會讓 `/` 保持私有，同時只暴露 `/googlechat`。

1. **檢查你的 Gateway 綁定到哪個位址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   注意 IP 位址（例如 `127.0.0.1`、`0.0.0.0`，或你的 Tailscale IP，例如 `100.x.x.x`）。

2. **只將儀表板暴露給 tailnet（連接埠 8443）：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **只公開暴露 Webhook 路徑：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授權 Node 以取得 Funnel 存取權：**
   如果出現提示，請造訪輸出中顯示的授權 URL，以在你的 tailnet policy 中為此 Node 啟用 Funnel。

5. **驗證設定：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公開 Webhook URL 會是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私人儀表板會維持僅限 tailnet：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 應用程式設定中使用公開 URL（不含 `:8443`）。

> 注意：此設定會在重新開機後保留。若要稍後移除它，請執行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 選項 B：反向 Proxy（Caddy）

如果你使用像 Caddy 這樣的反向 Proxy，只 Proxy 特定路徑：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此 config 時，任何對 `your-domain.com/` 的請求都會被忽略或傳回 404，而 `your-domain.com/googlechat` 會安全地路由到 OpenClaw。

### 選項 C：Cloudflare Tunnel

設定你的 tunnel ingress 規則，只路由 Webhook 路徑：

- **Path**：`/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**：HTTP 404（Not Found）

## 運作方式

1. Google Chat 會將 Webhook POST 傳送到 Gateway。每個請求都包含 `Authorization: Bearer <token>` 標頭。
   - OpenClaw 會在讀取/剖析完整 Webhook body 之前，先在標頭存在時驗證 bearer auth。
   - 支援在 body 中攜帶 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 請求，並使用更嚴格的 pre-auth body budget。
2. OpenClaw 會依設定的 `audienceType` + `audience` 驗證 token：
   - `audienceType: "app-url"` → audience 是你的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 專案編號。
3. 訊息會依 space 路由：
   - DM 使用 session key `agent:<agentId>:googlechat:direct:<spaceId>`。
   - Space 使用 session key `agent:<agentId>:googlechat:group:<spaceId>`。
4. DM 存取預設使用 pairing。未知傳送者會收到 pairing code；使用下列指令核准：
   - `openclaw pairing approve googlechat <code>`
5. 群組 space 預設需要 @-mention。如果提及偵測需要應用程式的使用者名稱，請使用 `botUser`。

## 目標

使用這些識別碼進行傳送與 allowlist：

- 直接訊息：`users/<userId>`（建議）。
- 原始電子郵件 `name@example.com` 是可變的，且只有在 `channels.googlechat.dangerouslyAllowNameMatching: true` 時才用於直接 allowlist 比對。
- 已棄用：`users/<email>` 會被視為使用者 ID，而不是電子郵件 allowlist。
- Space：`spaces/<spaceId>`。

## Config 重點

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注意：

- Service Account 認證也可以用 `serviceAccount`（JSON 字串）內嵌傳入。
- 也支援 `serviceAccountRef`（env/file SecretRef），包含 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的個別 account ref。
- 如果未設定 `webhookPath`，預設 Webhook 路徑是 `/googlechat`。
- `dangerouslyAllowNameMatching` 會重新啟用 allowlist 的可變電子郵件主體比對（緊急相容模式）。
- 啟用 `actions.reactions` 時，可透過 `reactions` 工具與 `channels action` 使用 reaction。
- 訊息 action 會公開 `send` 以傳送文字，以及 `upload-file` 以明確傳送附件。`upload-file` 接受 `media` / `filePath` / `path`，以及可選的 `message`、`filename` 和 thread target。
- `typingIndicator` 支援 `none`、`message`（預設）和 `reaction`（reaction 需要使用者 OAuth）。
- 附件會透過 Chat API 下載，並儲存在 media pipeline 中（大小受 `mediaMaxMb` 限制）。

Secrets 參照詳細資訊：[Secrets Management](/zh-TW/gateway/secrets)。

## 疑難排解

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 顯示如下錯誤：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

這表示尚未註冊 Webhook handler。常見原因：

1. **尚未設定 channel**：你的 config 中缺少 `channels.googlechat` 區段。使用下列指令驗證：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果傳回「Config path not found」，請新增設定（見 [Config 重點](#config-highlights)）。

2. **Plugin 未啟用**：檢查 Plugin 狀態：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果顯示「disabled」，請將 `plugins.entries.googlechat.enabled: true` 新增到你的 config。

3. **Gateway 未重新啟動**：新增 config 後，重新啟動 Gateway：

   ```bash
   openclaw gateway restart
   ```

確認 channel 正在執行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他問題

- 檢查 `openclaw channels status --probe` 是否有 auth 錯誤或缺少 audience config。
- 如果沒有收到訊息，請確認 Chat 應用程式的 Webhook URL + 事件訂閱。
- 如果 mention gating 阻擋回覆，請將 `botUser` 設為應用程式的使用者資源名稱，並驗證 `requireMention`。
- 傳送測試訊息時使用 `openclaw logs --follow`，查看請求是否抵達 Gateway。

相關文件：

- [Gateway configuration](/zh-TW/gateway/configuration)
- [Security](/zh-TW/gateway/security)
- [Reactions](/zh-TW/tools/reactions)

## 相關

- [Channels Overview](/zh-TW/channels) — 所有支援的 channel
- [Pairing](/zh-TW/channels/pairing) — DM 驗證與 pairing 流程
- [Groups](/zh-TW/channels/groups) — 群組聊天行為與 mention gating
- [Channel Routing](/zh-TW/channels/channel-routing) — 訊息的 session 路由
- [Security](/zh-TW/gateway/security) — 存取模型與強化
