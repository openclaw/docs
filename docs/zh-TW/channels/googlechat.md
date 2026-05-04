---
read_when:
    - 正在處理 Google Chat 頻道功能
summary: Google Chat 應用程式支援狀態、功能與設定
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Status：可下載的 Plugin，透過 Google Chat API Webhook（僅 HTTP）支援私訊 + 空間。

## 安裝

設定頻道前，先安裝 Google Chat：

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
   - 如果尚未啟用 API，請啟用它。
2. 建立 **服務帳戶**：
   - 按 **Create Credentials** > **Service Account**。
   - 隨意命名（例如 `openclaw-chat`）。
   - 權限留空（按 **Continue**）。
   - 可存取的主體留空（按 **Done**）。
3. 建立並下載 **JSON Key**：
   - 在服務帳戶清單中，點選你剛建立的服務帳戶。
   - 前往 **Keys** 分頁。
   - 點選 **Add Key** > **Create new key**。
   - 選取 **JSON** 並按 **Create**。
4. 將下載的 JSON 檔案儲存在你的 Gateway 主機上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat 設定](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)中建立 Google Chat 應用程式：
   - 填寫 **Application info**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 啟用 **Interactive features**。
   - 在 **Functionality** 下，勾選 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，選取 **HTTP endpoint URL**。
   - 在 **Triggers** 下，選取 **Use a common HTTP endpoint URL for all triggers**，並將它設定為你的 Gateway 公開 URL 後接 `/googlechat`。
     - _提示：執行 `openclaw status` 來尋找你的 Gateway 公開 URL。_
   - 在 **Visibility** 下，勾選 **Make this Chat app available to specific people and groups in `<Your Domain>`**。
   - 在文字方塊中輸入你的電子郵件地址（例如 `user@example.com`）。
   - 點選底部的 **Save**。
6. **啟用應用程式狀態**：
   - 儲存後，**重新整理頁面**。
   - 尋找 **App status** 區段（儲存後通常位於頁面頂部或底部附近）。
   - 將狀態變更為 **Live - available to users**。
   - 再次點選 **Save**。
7. 使用服務帳戶路徑 + Webhook audience 設定 OpenClaw：
   - Env：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或 config：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 設定 Webhook audience 類型 + 值（與你的 Chat 應用程式設定相符）。
9. 啟動 Gateway。Google Chat 會 POST 到你的 Webhook 路徑。

## 加入 Google Chat

Gateway 執行中且你的電子郵件已加入可見性清單後：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 點選 **Direct Messages** 旁的 **+**（加號）圖示。
3. 在搜尋列中（通常用來加入人員的地方），輸入你在 Google Cloud Console 中設定的 **App name**。
   - **注意**：因為這是私人應用程式，機器人_不會_出現在「Marketplace」瀏覽清單中。你必須依名稱搜尋它。
4. 從結果中選取你的機器人。
5. 點選 **Add** 或 **Chat** 以開始 1:1 對話。
6. 傳送「Hello」以觸發助理！

## 公開 URL（僅 Webhook）

Google Chat Webhook 需要公開 HTTPS 端點。為了安全，**只將 `/googlechat` 路徑**暴露到網際網路。將 OpenClaw 儀表板和其他敏感端點保留在你的私人網路中。

### 選項 A：Tailscale Funnel（建議）

使用 Tailscale Serve 供私人儀表板使用，並使用 Funnel 供公開 Webhook 路徑使用。這會讓 `/` 保持私有，同時只暴露 `/googlechat`。

1. **檢查你的 Gateway 綁定到哪個位址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   記下 IP 位址（例如 `127.0.0.1`、`0.0.0.0`，或你的 Tailscale IP，例如 `100.x.x.x`）。

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

4. **授權此 Node 使用 Funnel 存取：**
   如果系統提示，請造訪輸出中顯示的授權 URL，以在你的 tailnet 政策中為此 Node 啟用 Funnel。

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

> 注意：此設定會在重新開機後保留。若稍後要移除，請執行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 選項 B：反向代理（Caddy）

如果你使用 Caddy 之類的反向代理，請只代理特定路徑：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此設定時，任何對 `your-domain.com/` 的請求都會被忽略或回傳 404，而 `your-domain.com/googlechat` 會安全地路由到 OpenClaw。

### 選項 C：Cloudflare Tunnel

設定你的 tunnel ingress 規則，只路由 Webhook 路徑：

- **路徑**：`/googlechat` -> `http://localhost:18789/googlechat`
- **預設規則**：HTTP 404（找不到）

## 運作方式

1. Google Chat 會將 Webhook POST 傳送到 Gateway。每個請求都包含 `Authorization: Bearer <token>` 標頭。
   - 當標頭存在時，OpenClaw 會在讀取/解析完整 Webhook body 前驗證 bearer auth。
   - body 中攜帶 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 請求會透過更嚴格的預先驗證 body 預算支援。
2. OpenClaw 會依設定的 `audienceType` + `audience` 驗證 token：
   - `audienceType: "app-url"` → audience 是你的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 專案號碼。
3. 訊息會依空間路由：
   - 私訊使用工作階段 key `agent:<agentId>:googlechat:direct:<spaceId>`。
   - 空間使用工作階段 key `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私訊存取預設使用配對。未知傳送者會收到配對碼；使用以下指令核准：
   - `openclaw pairing approve googlechat <code>`
5. 群組空間預設需要 @提及。如果提及偵測需要應用程式的使用者名稱，請使用 `botUser`。

## 目標

使用這些識別碼進行傳遞和允許清單設定：

- 私訊：`users/<userId>`（建議）。
- 原始電子郵件 `name@example.com` 是可變的，只有在 `channels.googlechat.dangerouslyAllowNameMatching: true` 時，才會用於直接允許清單比對。
- 已淘汰：`users/<email>` 會被視為使用者 id，而不是電子郵件允許清單。
- 空間：`spaces/<spaceId>`。

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

- 服務帳戶憑證也可以使用 `serviceAccount`（JSON 字串）內嵌傳入。
- 也支援 `serviceAccountRef`（env/file SecretRef），包含 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的每帳戶 refs。
- 如果未設定 `webhookPath`，預設 Webhook 路徑為 `/googlechat`。
- `dangerouslyAllowNameMatching` 會重新啟用可變電子郵件主體比對以供允許清單使用（緊急相容模式）。
- 啟用 `actions.reactions` 時，可透過 `reactions` 工具和 `channels action` 使用反應。
- 訊息動作會提供 `send` 供文字使用，以及 `upload-file` 供明確附件傳送使用。`upload-file` 接受 `media` / `filePath` / `path`，以及選用的 `message`、`filename` 和 thread targeting。
- `typingIndicator` 支援 `none`、`message`（預設）和 `reaction`（reaction 需要使用者 OAuth）。
- 附件會透過 Chat API 下載並儲存在媒體管線中（大小受 `mediaMaxMb` 限制）。

Secrets 參考詳細資料：[Secrets 管理](/zh-TW/gateway/secrets)。

## 疑難排解

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 顯示如下錯誤：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

這表示 Webhook handler 尚未註冊。常見原因：

1. **頻道未設定**：你的 config 中缺少 `channels.googlechat` 區段。使用以下指令驗證：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果回傳「Config path not found」，請加入設定（請參閱 [Config 重點](#config-highlights)）。

2. **Plugin 未啟用**：檢查 Plugin 狀態：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果顯示「disabled」，請將 `plugins.entries.googlechat.enabled: true` 加入你的 config。

3. **Gateway 未重新啟動**：加入 config 後，重新啟動 Gateway：

   ```bash
   openclaw gateway restart
   ```

驗證頻道正在執行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他問題

- 檢查 `openclaw channels status --probe` 以查看 auth 錯誤或缺少 audience config。
- 如果沒有訊息送達，請確認 Chat 應用程式的 Webhook URL + event subscriptions。
- 如果提及 gating 阻擋回覆，請將 `botUser` 設為應用程式的使用者資源名稱，並驗證 `requireMention`。
- 傳送測試訊息時使用 `openclaw logs --follow`，查看請求是否抵達 Gateway。

相關文件：

- [Gateway 設定](/zh-TW/gateway/configuration)
- [安全性](/zh-TW/gateway/security)
- [反應](/zh-TW/tools/reactions)

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及 gating
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
