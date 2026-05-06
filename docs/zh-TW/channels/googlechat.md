---
read_when:
    - 開發 Google Chat 頻道功能
summary: Google Chat 應用程式支援狀態、功能與設定
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T09:02:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

狀態：可下載的 Plugin，透過 Google Chat API Webhook 支援私訊 + 聊天室（僅限 HTTP）。

## 安裝

在設定頻道前先安裝 Google Chat：

```bash
openclaw plugins install @openclaw/googlechat
```

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速設定（初學者）

1. 建立 Google Cloud 專案並啟用 **Google Chat API**。
   - 前往：[Google Chat API 憑證](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果 API 尚未啟用，請啟用它。
2. 建立 **服務帳戶**：
   - 按 **建立憑證** > **服務帳戶**。
   - 依你的喜好命名（例如 `openclaw-chat`）。
   - 權限留空（按 **繼續**）。
   - 具存取權的主體留空（按 **完成**）。
3. 建立並下載 **JSON 金鑰**：
   - 在服務帳戶清單中，點選你剛建立的服務帳戶。
   - 前往 **金鑰** 分頁。
   - 點選 **新增金鑰** > **建立新金鑰**。
   - 選取 **JSON** 並按 **建立**。
4. 將下載的 JSON 檔案儲存在你的 Gateway 主機上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat 設定](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)中建立 Google Chat 應用程式：
   - 填寫 **應用程式資訊**：
     - **應用程式名稱**：（例如 `OpenClaw`）
     - **頭像 URL**：（例如 `https://openclaw.ai/logo.png`）
     - **說明**：（例如 `Personal AI Assistant`）
   - 啟用 **互動功能**。
   - 在 **功能** 下，勾選 **加入聊天室和群組對話**。
   - 在 **連線設定** 下，選取 **HTTP 端點 URL**。
   - 在 **觸發條件** 下，選取 **所有觸發條件使用通用 HTTP 端點 URL**，並將其設為你的 Gateway 公開 URL 後接 `/googlechat`。
     - _提示：執行 `openclaw status` 以找出你的 Gateway 公開 URL。_
   - 在 **可見性** 下，勾選 **讓 `<Your Domain>` 中的特定人員和群組可使用此 Chat 應用程式**。
   - 在文字方塊中輸入你的電子郵件地址（例如 `user@example.com`）。
   - 點選底部的 **儲存**。
6. **啟用應用程式狀態**：
   - 儲存後，**重新整理頁面**。
   - 尋找 **應用程式狀態** 區段（通常在儲存後靠近頁面頂部或底部）。
   - 將狀態變更為 **上線 - 使用者可用**。
   - 再次點選 **儲存**。
7. 使用服務帳戶路徑 + Webhook audience 設定 OpenClaw：
   - Env：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或 config：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 設定 Webhook audience 類型 + 值（需符合你的 Chat 應用程式設定）。
9. 啟動 Gateway。Google Chat 會將 POST 傳送到你的 Webhook 路徑。

## 新增至 Google Chat

Gateway 執行中且你的電子郵件已加入可見性清單後：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 點選 **私訊** 旁的 **+**（加號）圖示。
3. 在搜尋列（你通常新增人員的位置）中，輸入你在 Google Cloud Console 中設定的 **應用程式名稱**。
   - **注意**：機器人不會出現在「Marketplace」瀏覽清單中，因為它是私有應用程式。你必須依名稱搜尋它。
4. 從結果中選取你的機器人。
5. 點選 **新增** 或 **聊天** 以開始 1:1 對話。
6. 傳送「Hello」以觸發助理！

## 公開 URL（僅限 Webhook）

Google Chat Webhook 需要公開 HTTPS 端點。為了安全，**只將 `/googlechat` 路徑**暴露到網際網路。將 OpenClaw dashboard 和其他敏感端點保留在你的私人網路中。

### 選項 A：Tailscale Funnel（建議）

使用 Tailscale Serve 作為私人 dashboard，並使用 Funnel 作為公開 Webhook 路徑。這會讓 `/` 保持私有，同時只暴露 `/googlechat`。

1. **檢查你的 Gateway 綁定到哪個位址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   記下 IP 位址（例如 `127.0.0.1`、`0.0.0.0`，或像 `100.x.x.x` 這樣的 Tailscale IP）。

2. **只向 tailnet 暴露 dashboard（連接埠 8443）：**

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

4. **授權此 Node 使用 Funnel 存取：**
   如果系統提示，請造訪輸出中顯示的授權 URL，以在你的 tailnet 政策中為此 Node 啟用 Funnel。

5. **驗證設定：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公開 Webhook URL 會是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私人 dashboard 會保持僅限 tailnet：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 應用程式設定中使用公開 URL（不含 `:8443`）。

> 注意：此設定會在重新開機後保留。若之後要移除，請執行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 選項 B：反向 Proxy（Caddy）

如果你使用 Caddy 這類反向 Proxy，只 Proxy 特定路徑：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此設定時，任何傳送到 `your-domain.com/` 的請求都會被忽略或回傳 404，而 `your-domain.com/googlechat` 會安全地路由到 OpenClaw。

### 選項 C：Cloudflare Tunnel

設定你的 tunnel ingress 規則，只路由 Webhook 路徑：

- **路徑**：`/googlechat` -> `http://localhost:18789/googlechat`
- **預設規則**：HTTP 404（找不到）

## 運作方式

1. Google Chat 會將 Webhook POST 傳送到 Gateway。每個請求都包含 `Authorization: Bearer <token>` 標頭。
   - OpenClaw 會在讀取/解析完整 Webhook body 前驗證 bearer auth（當標頭存在時）。
   - 透過較嚴格的預驗證 body 預算，支援在 body 中攜帶 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 請求。
2. OpenClaw 會依設定的 `audienceType` + `audience` 驗證 token：
   - `audienceType: "app-url"` → audience 是你的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 專案編號。
3. 訊息會依聊天室路由：
   - 私訊使用 session key `agent:<agentId>:googlechat:direct:<spaceId>`。
   - 聊天室使用 session key `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私訊存取預設使用配對。未知傳送者會收到配對碼；使用下列指令核准：
   - `openclaw pairing approve googlechat <code>`
5. 群組聊天室預設需要 @ 提及。如果提及偵測需要應用程式的使用者名稱，請使用 `botUser`。

## 目標

使用這些識別碼進行傳送和 allowlist：

- 私訊：`users/<userId>`（建議）。
- 原始電子郵件 `name@example.com` 可變，且只有在 `channels.googlechat.dangerouslyAllowNameMatching: true` 時才用於直接 allowlist 比對。
- 已淘汰：`users/<email>` 會被視為使用者 ID，而不是電子郵件 allowlist。
- 聊天室：`spaces/<spaceId>`。

## 設定重點

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
          enabled: true,
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

- 服務帳戶憑證也可以透過 `serviceAccount`（JSON 字串）內嵌傳入。
- 也支援 `serviceAccountRef`（env/file SecretRef），包括 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的每帳戶 ref。
- 如果未設定 `webhookPath`，預設 Webhook 路徑為 `/googlechat`。
- `dangerouslyAllowNameMatching` 會重新啟用 allowlist 的可變電子郵件 principal 比對（break-glass 相容模式）。
- 啟用 `actions.reactions` 時，可透過 `reactions` 工具和 `channels action` 使用 reactions。
- 訊息 actions 會公開 `send` 用於文字，以及 `upload-file` 用於明確傳送附件。`upload-file` 接受 `media` / `filePath` / `path`，另可選擇性提供 `message`、`filename` 和 thread targeting。
- `typingIndicator` 支援 `none`、`message`（預設）和 `reaction`（reaction 需要使用者 OAuth）。
- 附件會透過 Chat API 下載，並儲存在 media pipeline 中（大小受 `mediaMaxMb` 限制）。

Secrets 參考詳情：[Secrets 管理](/zh-TW/gateway/secrets)。

## 疑難排解

### 405 方法不被允許

如果 Google Cloud Logs Explorer 顯示如下錯誤：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

這表示 Webhook handler 尚未註冊。常見原因：

1. **頻道未設定**：你的 config 缺少 `channels.googlechat` 區段。使用下列指令驗證：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果它回傳「找不到設定路徑」，請新增設定（請參閱[設定重點](#config-highlights)）。

2. **Plugin 未啟用**：檢查 Plugin 狀態：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果它顯示「已停用」，請將 `plugins.entries.googlechat.enabled: true` 新增至你的 config。

3. **Gateway 未重新啟動**：新增 config 後，重新啟動 Gateway：

   ```bash
   openclaw gateway restart
   ```

驗證頻道正在執行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他問題

- 檢查 `openclaw channels status --probe` 是否有 auth 錯誤或缺少 audience config。
- 如果沒有收到訊息，請確認 Chat 應用程式的 Webhook URL + event subscriptions。
- 如果提及 gating 阻擋回覆，請將 `botUser` 設為應用程式的使用者資源名稱，並驗證 `requireMention`。
- 傳送測試訊息時使用 `openclaw logs --follow`，查看請求是否到達 Gateway。

相關文件：

- [Gateway 設定](/zh-TW/gateway/configuration)
- [安全性](/zh-TW/gateway/security)
- [Reactions](/zh-TW/tools/reactions)

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊 authentication 與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及 gating
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的 session routing
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
