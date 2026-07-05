---
read_when:
    - 正在處理 Google Chat 頻道功能
summary: Google Chat 應用程式支援狀態、功能與設定
title: Google Chat
x-i18n:
    generated_at: "2026-07-05T11:01:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb0a6298652a8bac48f5e7249884f8387bc72f9c849a9b39e73aff008b848780
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat 以官方 `@openclaw/googlechat` 外掛執行：透過 Google Chat API 網路鉤子支援私訊與空間（僅 HTTP 端點，不使用 Pub/Sub）。

## 安裝

```bash
openclaw plugins install @openclaw/googlechat
```

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速設定（初學者）

1. 建立 Google Cloud 專案並啟用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未啟用 API，請啟用它。
2. 建立 **Service Account**：
   - 按下 **Create Credentials** > **Service Account**。
   - 依你想要的方式命名（例如 `openclaw-chat`）。
   - 將權限與主體留空（**Continue**，然後 **Done**）。
3. 建立並下載 **JSON key**：
   - 點擊新的 service account > **Keys** 分頁 > **Add Key** > **Create new key** > **JSON** > **Create**。
4. 將下載的 JSON 檔案儲存在你的閘道主機上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 建立 Google Chat 應用程式：
   - 填寫 **Application info**（應用程式名稱、頭像 URL、描述）。
   - 啟用 **Interactive features**。
   - 在 **Functionality** 下，勾選 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，選取 **HTTP endpoint URL**。
   - 在 **Triggers** 下，選取 **Use a common HTTP endpoint URL for all triggers**，並將它設為你的公開閘道 URL 後接 `/googlechat`（請參閱 [公開 URL](#public-url-webhook-only)）。
   - 在 **Visibility** 下，勾選 **Make this Chat app available to specific people and groups in `<Your Domain>`**，並輸入你的電子郵件地址。
   - 點擊 **Save**。
6. 啟用應用程式狀態：重新整理頁面，找到 **App status**，將它設為 **Live - available to users**，並再次 **Save**。
7. 使用 service account 與網路鉤子 audience 設定 OpenClaw（必須符合 Chat 應用程式設定）：
   - Env：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`（僅預設帳號），或
   - Config：請參閱 [設定重點](#config-highlights)。`openclaw channels add --channel googlechat` 也接受 `--audience-type`、`--audience`、`--webhook-path` 和 `--webhook-url`。
8. 啟動閘道。Google Chat 會 POST 到你的網路鉤子路徑（預設 `/googlechat`）。

## 新增至 Google Chat

閘道執行後，且你的電子郵件在可見性清單中：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 點擊 **Direct Messages** 旁的 **+**（加號）圖示。
3. 搜尋你在 Google Cloud Console 中設定的 **App name**。
   - 此 bot 不會出現在 Marketplace 瀏覽清單中，因為它是私人應用程式；請依名稱搜尋。
4. 選取 bot，點擊 **Add** 或 **Chat**，然後傳送訊息。

## 公開 URL（僅限網路鉤子）

Google Chat 網路鉤子需要公開 HTTPS 端點。基於安全性，請**只將 `/googlechat` 路徑**公開到網際網路，並讓 OpenClaw 儀表板和其他端點保持私有。

### 選項 A：Tailscale Funnel（建議）

使用 Tailscale Serve 提供私有儀表板，並使用 Funnel 提供公開網路鉤子路徑。

1. 檢查你的閘道綁定到哪個位址：

   ```bash
   ss -tlnp | grep 18789
   ```

   記下 IP（例如 `127.0.0.1`、`0.0.0.0`，或 Tailscale `100.x.x.x` 位址）。

2. 只將儀表板公開給 tailnet（連接埠 8443）：

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. 只公開網路鉤子路徑：

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. 如有提示，請前往輸出中顯示的授權 URL，為此節點啟用 Funnel。

5. 驗證：

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公開網路鉤子 URL 是 `https://<node-name>.<tailnet>.ts.net/googlechat`；儀表板則維持 tailnet-only，位於 `https://<node-name>.<tailnet>.ts.net:8443/`。在 Google Chat 應用程式設定中使用公開 URL（不含 `:8443`）。

> 注意：此設定會在重新開機後保留。之後可使用 `tailscale funnel reset` 和 `tailscale serve reset` 移除。

### 選項 B：反向 Proxy（Caddy）

只 proxy 網路鉤子路徑：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

對 `your-domain.com/` 的請求會被忽略或回傳 404，而 `your-domain.com/googlechat` 會路由到 OpenClaw。

### 選項 C：Cloudflare Tunnel

設定 tunnel ingress rules，只路由網路鉤子路徑：

- **Path**：`/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**：HTTP 404（找不到）

## 運作方式

1. Google Chat 會將 JSON POST 到閘道網路鉤子路徑（僅限 POST、必須是 JSON content type、依 IP 速率限制）。
2. OpenClaw 會在分派前驗證每個請求：
   - Chat 應用程式事件會帶有 `Authorization: Bearer <token>`；token 會在完整 body 解析前驗證。
   - Google Workspace Add-on 事件會在 body 中帶有 token（`authorizationEventObject.systemIdToken`），並在更嚴格的預先驗證預算（16 KB、3 s）下讀取後再驗證。
3. token 會依 `audienceType` + `audience` 檢查：
   - `audienceType: "app-url"` → audience 是你的 HTTPS 網路鉤子 URL。
   - `audienceType: "project-number"` → audience 是 Cloud 專案編號。
   - 在 `app-url` 下的 Add-on token 另外需要將 `appPrincipal` 設為應用程式的數字 OAuth 2.0 client ID（21 位數，不是電子郵件）；否則驗證會失敗並記錄警告。
4. 訊息依空間路由：
   - 空間會取得個別空間工作階段 `agent:<agentId>:googlechat:group:<spaceId>`；回覆會傳到訊息 thread。
   - 私訊預設會合併到 agent 的主要工作階段；如需每個對象各自的私訊工作階段，請設定 `session.dmScope`（請參閱 [工作階段](/zh-TW/concepts/session)）。
5. 私訊存取預設使用配對。未知寄件者會收到配對碼；使用以下指令核准：
   - `openclaw pairing approve googlechat <code>`
6. 群組空間預設需要 @-mention。提及會從指向應用程式的 Chat `USER_MENTION` annotations 偵測；如果偵測需要應用程式的使用者資源名稱，請設定 `botUser`（例如 `users/1234567890`）。
7. 當 exec 或外掛核准從 Google Chat 開始，且已設定穩定的 `users/<id>` 核准者時，OpenClaw 會在來源空間或 thread 中發布原生核准卡片（`cardsV2`）。卡片按鈕會攜帶不透明 callback token；只有在原生傳遞不可用時，才會出現手動 `/approve <id> <decision>` 提示。

## 目標

使用這些識別碼進行傳遞與允許清單設定：

- 私訊：`users/<userId>`（建議）。
- 空間：`spaces/<spaceId>`。
- 原始電子郵件 `name@example.com` 可變動，且只有在 `channels.googlechat.dangerouslyAllowNameMatching: true` 時才用於允許清單比對。
- 已棄用：`users/<email>` 會被視為使用者 id，而不是電子郵件允許清單項目。
- 前綴 `googlechat:`、`google-chat:` 和 `gchat:` 會被接受並移除。

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
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
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

- Service account 憑證：`serviceAccountFile`（路徑）、`serviceAccount`（inline JSON 字串或物件），或 `serviceAccountRef`（env/file SecretRef）。Env vars `GOOGLE_CHAT_SERVICE_ACCOUNT`（inline JSON）和 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（路徑）只套用至預設帳號。多帳號設定使用 `channels.googlechat.accounts.<id>`，並使用相同 keys，包括每個帳號各自的 `serviceAccountRef`。
- 未設定 `webhookPath` 時，預設網路鉤子路徑是 `/googlechat`；`webhookUrl` 也可以提供路徑。
- 群組 key 必須是穩定的空間 id（`spaces/<spaceId>`）。Display-name key 已棄用，並會如此記錄。
- `dangerouslyAllowNameMatching` 會重新啟用可變動電子郵件主體比對，以供允許清單使用（break-glass 相容模式）；doctor 會針對電子郵件項目發出警告。
- Reactions 預設啟用，並透過 `reactions` 工具和 `channels action` 暴露；可用 `actions.reactions: false` 停用。
- 原生核准卡片使用 Google Chat `cardsV2` 按鈕點擊，而不是 reaction events。核准者來自 `dm.allowFrom` 或 `defaultTo`，且必須是穩定的數字 `users/<id>` 值。
- 訊息 actions 會暴露 `send` 用於文字，以及 `upload-file` 用於明確傳送附件。`upload-file` 接受 `media` / `filePath` / `path`，外加選用的 `message`、`filename` 和 thread 目標（`threadId` / `replyTo`）。
- `typingIndicator`：`message`（預設）會發布 `_<Bot> is typing..._` placeholder，並將它編輯成第一則回覆；`none` 會停用；`reaction` 需要使用者 OAuth，且目前在 service-account auth 下會 fallback 到 `message`，並記錄錯誤。
- Inbound attachments（每則訊息的第一個附件）會透過 Chat API 下載到媒體 pipeline，並由 `mediaMaxMb` 限制大小（預設 20）。
- Bot-authored messages 預設會被忽略。使用 `allowBots: true` 時，接受的 bot 訊息會使用共用的 [bot loop protection](/zh-TW/channels/bot-loop-protection)：設定 `channels.defaults.botLoopProtection`，然後用 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆寫。

Secrets reference details：[Secrets Management](/zh-TW/gateway/secrets)。

## 疑難排解

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 顯示如下錯誤：

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

表示網路鉤子 handler 尚未註冊。常見原因：

1. **Channel not configured**：缺少 `channels.googlechat` section。使用以下指令驗證：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果回傳 "Config path not found"，請新增設定（請參閱 [設定重點](#config-highlights)）。

2. **Plugin not enabled**：檢查外掛狀態：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果顯示 "disabled"，請將 `plugins.entries.googlechat.enabled: true` 加入你的 config。

3. config 變更後**未重新啟動閘道**：

   ```bash
   openclaw gateway restart
   ```

驗證 channel 是否正在執行：

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 其他問題

- `openclaw channels status --probe` 會顯示 auth 錯誤和缺少的 audience config（`audience` 和 `audienceType` 都是必要的）。
- 如果沒有收到訊息，請確認 Chat 應用程式的網路鉤子 URL 與 trigger 設定。
- 如果 mention gating 擋住回覆，請將 `botUser` 設為應用程式的使用者資源名稱，並檢查 `requireMention`。
- 傳送測試訊息時使用 `openclaw logs --follow`，可查看請求是否抵達閘道。

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [閘道設定](/zh-TW/gateway/configuration)
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [回應](/zh-TW/tools/reactions)
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
