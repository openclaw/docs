---
read_when:
    - 正在開發 Google Chat 頻道功能
summary: Google Chat 應用程式支援狀態、功能與設定
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T18:54:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

狀態：可下載外掛，透過 Google Chat API 網路鉤子支援私訊 + 空間（僅限 HTTP）。

## 安裝

設定頻道前先安裝 Google Chat：

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
   - 按下 **建立憑證** > **服務帳戶**。
   - 任意命名（例如 `openclaw-chat`）。
   - 權限留空（按 **繼續**）。
   - 具存取權的主體留空（按 **完成**）。
3. 建立並下載 **JSON 金鑰**：
   - 在服務帳戶清單中，點選你剛建立的帳戶。
   - 前往 **金鑰** 分頁。
   - 點選 **新增金鑰** > **建立新金鑰**。
   - 選取 **JSON** 並按 **建立**。
4. 將下載的 JSON 檔案儲存在你的閘道主機上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat 設定](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)中建立 Google Chat 應用程式：
   - 填寫 **應用程式資訊**：
     - **應用程式名稱**：（例如 `OpenClaw`）
     - **頭像 URL**：（例如 `https://openclaw.ai/logo.png`）
     - **說明**：（例如 `Personal AI Assistant`）
   - 啟用 **互動功能**。
   - 在 **功能** 下，勾選 **加入空間和群組對話**。
   - 在 **連線設定** 下，選取 **HTTP 端點 URL**。
   - 在 **觸發條件** 下，選取 **對所有觸發條件使用通用 HTTP 端點 URL**，並將它設為你的閘道公開 URL 加上 `/googlechat`。
     - _提示：執行 `openclaw status` 以找出你的閘道公開 URL。_
   - 在 **可見性** 下，勾選 **讓這個 Chat 應用程式可供 `<Your Domain>` 中的特定使用者和群組使用**。
   - 在文字方塊中輸入你的電子郵件地址（例如 `user@example.com`）。
   - 點選底部的 **儲存**。
6. **啟用應用程式狀態**：
   - 儲存後，**重新整理頁面**。
   - 尋找 **應用程式狀態** 區段（儲存後通常在頂部或底部附近）。
   - 將狀態變更為 **上線 - 可供使用者使用**。
   - 再次點選 **儲存**。
7. 使用服務帳戶路徑 + 網路鉤子受眾設定 OpenClaw：
   - 環境變數：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或設定：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 設定網路鉤子受眾類型 + 值（與你的 Chat 應用程式設定相符）。
9. 啟動閘道。Google Chat 會 POST 到你的網路鉤子路徑。

## 新增至 Google Chat

閘道執行中且你的電子郵件已新增至可見性清單後：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 點選 **私訊** 旁邊的 **+**（加號）圖示。
3. 在搜尋列（通常用來新增人員的位置）中，輸入你在 Google Cloud Console 中設定的 **應用程式名稱**。
   - **注意**：這個機器人不會出現在「市集」瀏覽清單中，因為它是私人應用程式。你必須依名稱搜尋它。
4. 從結果中選取你的機器人。
5. 點選 **新增** 或 **聊天** 以開始 1:1 對話。
6. 傳送「你好」以觸發助理！

## 公開 URL（僅限網路鉤子）

Google Chat 網路鉤子需要公開 HTTPS 端點。為了安全，**只將 `/googlechat` 路徑**暴露到網際網路。請將 OpenClaw 儀表板和其他敏感端點保留在你的私人網路中。

### 選項 A：Tailscale Funnel（建議）

使用 Tailscale Serve 提供私人儀表板，並使用 Funnel 提供公開網路鉤子路徑。這會讓 `/` 保持私有，同時只暴露 `/googlechat`。

1. **檢查你的閘道綁定到哪個位址：**

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

3. **只公開暴露網路鉤子路徑：**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授權節點使用 Funnel 存取：**
   如果系統提示，請造訪輸出中顯示的授權 URL，在你的 tailnet 政策中為此節點啟用 Funnel。

5. **驗證設定：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公開網路鉤子 URL 會是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私人儀表板會保持僅限 tailnet：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 應用程式設定中使用公開 URL（不含 `:8443`）。

> 注意：此設定會在重新開機後保留。若要稍後移除，請執行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 選項 B：反向代理（Caddy）

如果你使用 Caddy 這類反向代理，只代理特定路徑：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此設定時，任何對 `your-domain.com/` 的請求都會被忽略或回傳 404，而 `your-domain.com/googlechat` 會安全地路由到 OpenClaw。

### 選項 C：Cloudflare Tunnel

設定你的通道 ingress 規則，只路由網路鉤子路徑：

- **路徑**：`/googlechat` -> `http://localhost:18789/googlechat`
- **預設規則**：HTTP 404（找不到）

## 運作方式

1. Google Chat 會將網路鉤子 POST 傳送到閘道。每個請求都包含 `Authorization: Bearer <token>` 標頭。
   - 當標頭存在時，OpenClaw 會在讀取/解析完整網路鉤子本文之前驗證 bearer 驗證。
   - 帶有本文中 `authorizationEventObject.systemIdToken` 的 Google Workspace 外掛程式請求，會透過更嚴格的預先驗證本文預算支援。
2. OpenClaw 會根據設定的 `audienceType` + `audience` 驗證權杖：
   - `audienceType: "app-url"` → 受眾是你的 HTTPS 網路鉤子 URL。
   - `audienceType: "project-number"` → 受眾是 Cloud 專案編號。
3. 訊息依空間路由：
   - 私訊使用工作階段金鑰 `agent:<agentId>:googlechat:direct:<spaceId>`。
   - 空間使用工作階段金鑰 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私訊存取預設使用配對。未知傳送者會收到配對碼；使用以下方式核准：
   - `openclaw pairing approve googlechat <code>`
5. 群組空間預設需要 @提及。如果提及偵測需要應用程式的使用者名稱，請使用 `botUser`。
6. 當 exec 或外掛核准請求從 Google Chat 開始，且已設定穩定的 `users/<id>` 核准者時，OpenClaw 會在來源空間或討論串中張貼原生 Google Chat 核准卡片。卡片按鈕使用不透明回呼權杖，只有在原生核准傳遞無法使用時，才會顯示手動 `/approve <id> <decision>` 提示。

## 目標

使用這些識別碼進行傳遞與允許清單：

- 私訊：`users/<userId>`（建議）。
- 原始電子郵件 `name@example.com` 是可變的，且只有在 `channels.googlechat.dangerouslyAllowNameMatching: true` 時才用於直接允許清單比對。
- 已棄用：`users/<email>` 會被視為使用者 ID，而不是電子郵件允許清單。
- 空間：`spaces/<spaceId>`。

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
      allowBots: false,
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

- 服務帳戶憑證也可以使用 `serviceAccount`（JSON 字串）以內嵌方式傳入。
- 也支援 `serviceAccountRef`（環境變數/檔案 SecretRef），包括 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的每帳戶參照。
- 如果未設定 `webhookPath`，預設網路鉤子路徑是 `/googlechat`。
- `dangerouslyAllowNameMatching` 會重新啟用可變電子郵件主體比對以供允許清單使用（緊急相容模式）。
- 啟用 `actions.reactions` 時，可透過 `reactions` 工具和 `channels action` 使用反應。
- 原生核准卡片使用 Google Chat `cardsV2` 按鈕點擊，而不是反應事件。核准者來自 `dm.allowFrom` 或 `defaultTo`，且必須是穩定的數字 `users/<id>` 值。
- 訊息動作會公開 `send` 以傳送文字，並公開 `upload-file` 以明確傳送附件。`upload-file` 接受 `media` / `filePath` / `path`，以及選用的 `message`、`filename` 和討論串目標。
- `typingIndicator` 支援 `message`（預設）、`none` 和 `reaction`（反應需要使用者 OAuth）。
- 附件會透過 Chat API 下載，並儲存在媒體管線中（大小受 `mediaMaxMb` 限制）。
- 預設會忽略由機器人撰寫的 Google Chat 訊息。如果你有意設定 `allowBots: true`，接受的機器人撰寫訊息會使用共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。設定 `channels.defaults.botLoopProtection`，然後在某個空間需要不同預算時，以 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆寫。

密鑰參照詳細資訊：[密鑰管理](/zh-TW/gateway/secrets)。

## 疑難排解

### 405 方法不允許

如果 Google Cloud Logs Explorer 顯示如下錯誤：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

這表示網路鉤子處理常式尚未註冊。常見原因：

1. **頻道未設定**：你的設定中缺少 `channels.googlechat` 區段。使用以下方式驗證：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果它回傳「找不到設定路徑」，請新增設定（請參閱[設定重點](#config-highlights)）。

2. **外掛未啟用**：檢查外掛狀態：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果顯示「已停用」，請將 `plugins.entries.googlechat.enabled: true` 新增至你的設定。

3. **閘道未重新啟動**：新增設定後，重新啟動閘道：

   ```bash
   openclaw gateway restart
   ```

驗證頻道是否正在執行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他問題

- 檢查 `openclaw channels status --probe` 以查看驗證錯誤或缺少受眾設定。
- 如果沒有訊息抵達，請確認 Chat 應用程式的網路鉤子 URL + 事件訂閱。
- 如果提及門檻封鎖回覆，請將 `botUser` 設為應用程式的使用者資源名稱，並驗證 `requireMention`。
- 傳送測試訊息時使用 `openclaw logs --follow`，以查看請求是否抵達閘道。

相關文件：

- [閘道設定](/zh-TW/gateway/configuration)
- [安全性](/zh-TW/gateway/security)
- [反應](/zh-TW/tools/reactions)

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
