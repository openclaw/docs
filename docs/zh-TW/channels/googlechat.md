---
read_when:
    - 開發 Google Chat 頻道功能
summary: Google Chat 應用程式支援狀態、功能與設定
title: Google Chat
x-i18n:
    generated_at: "2026-07-19T13:34:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5300ce6da3bf69136b7286dc87f14a5809c5f28a206c881a95f520376304b97d
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat 以官方 `@openclaw/googlechat` 外掛的形式運作：透過 Google Chat API 網路鉤子支援私訊與聊天室（僅限 HTTP 端點，不使用 Pub/Sub）。

## 安裝

```bash
openclaw plugins install @openclaw/googlechat
```

本機簽出（從 git 儲存庫執行時）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速設定（初學者）

1. 建立 Google Cloud 專案並啟用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未啟用 API，請將其啟用。
2. 建立 **Service Account**：
   - 按下 **Create Credentials** > **Service Account**。
   - 任意命名（例如 `openclaw-chat`）。
   - 將權限和主體留空（按 **Continue**，接著按 **Done**）。
3. 建立並下載 **JSON 金鑰**：
   - 按一下新的服務帳戶 > **Keys** 分頁 > **Add Key** > **Create new key** > **JSON** > **Create**。
4. 將下載的 JSON 檔案儲存在你的閘道主機上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中建立 Google Chat 應用程式：
   - 填寫 **Application info**（應用程式名稱、顯示圖片 URL、說明）。
   - 啟用 **Interactive features**。
   - 在 **Functionality** 下，勾選 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，選取 **HTTP endpoint URL**。
   - 在 **Triggers** 下，選取 **Use a common HTTP endpoint URL for all triggers**，並將其設為你的公開閘道 URL，後接 `/googlechat`（請參閱[公開 URL](#public-url-webhook-only)）。
   - 在 **Visibility** 下，勾選 **Make this Chat app available to specific people and groups in `<Your Domain>`**，然後輸入你的電子郵件地址。
   - 按一下 **Save**。
6. 啟用應用程式狀態：重新整理頁面，找到 **App status**，將其設為 **Live - available to users**，然後再次按 **Save**。
7. 使用服務帳戶和網路鉤子對象設定 OpenClaw（必須符合 Chat 應用程式設定）：
   - 環境變數：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`（僅限預設帳戶），或
   - 設定：請參閱[設定重點](#config-highlights)。`openclaw channels add --channel googlechat` 也接受 `--audience-type`、`--audience`、`--webhook-path` 和 `--webhook-url`。
8. 啟動閘道。Google Chat 會將 POST 請求傳送至你的網路鉤子路徑（預設為 `/googlechat`）。

## 新增至 Google Chat

閘道開始執行，且你的電子郵件地址已在可見性清單中之後：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 按一下 **Direct Messages** 旁的 **+**（加號）圖示。
3. 搜尋你在 Google Cloud Console 中設定的 **App name**。
   - 由於這是私人應用程式，機器人_不會_出現在 Marketplace 瀏覽清單中；請依名稱搜尋。
4. 選取機器人，按一下 **Add** 或 **Chat**，然後傳送訊息。

## 公開 URL（僅限網路鉤子）

Google Chat 網路鉤子需要公開的 HTTPS 端點。為確保安全，請**僅將 `/googlechat` 路徑**公開至網際網路，並將 OpenClaw 儀表板及其他端點保持為私人狀態。

### 選項 A：Tailscale Funnel（建議）

使用 Tailscale Serve 提供私人儀表板，並使用 Funnel 提供公開網路鉤子路徑。

1. 檢查閘道繫結的位址：

   ```bash
   ss -tlnp | grep 18789
   ```

   記下 IP（例如 `127.0.0.1`、`0.0.0.0` 或 Tailscale `100.x.x.x` 位址）。

2. 僅將儀表板公開至 tailnet（連接埠 8443）：

   ```bash
   # 如果繫結至 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # 如果僅繫結至 Tailscale IP：
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. 僅公開網路鉤子路徑：

   ```bash
   # 如果繫結至 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # 如果僅繫結至 Tailscale IP：
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. 如出現提示，請造訪輸出中顯示的授權 URL，以為此節點啟用 Funnel。

5. 驗證：

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公開網路鉤子 URL 是 `https://<node-name>.<tailnet>.ts.net/googlechat`；儀表板則在 `https://<node-name>.<tailnet>.ts.net:8443/` 維持僅限 tailnet 存取。在 Google Chat 應用程式設定中使用公開 URL（不含 `:8443`）。

> 注意：此設定會在重新開機後保留。之後可使用 `tailscale funnel reset` 和 `tailscale serve reset` 將其移除。

### 選項 B：反向 Proxy（Caddy）

僅 Proxy 網路鉤子路徑：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

對 `your-domain.com/` 的請求會遭忽略或傳回 404，而 `your-domain.com/googlechat` 會路由至 OpenClaw。

### 選項 C：Cloudflare Tunnel

設定通道輸入規則，使其僅路由網路鉤子路徑：

- **路徑**：`/googlechat` -> `http://localhost:18789/googlechat`
- **預設規則**：HTTP 404（找不到）

## 運作方式

1. Google Chat 會將 JSON POST 至閘道的網路鉤子路徑（僅限 POST、必須使用 JSON 內容類型，並依 IP 限制速率）。
2. OpenClaw 會在分派前驗證每個請求：
   - Chat 應用程式事件會攜帶 `Authorization: Bearer <token>`；系統會先驗證權杖，再剖析完整內文。
   - Google Workspace 外掛程式事件會在內文中攜帶權杖（`authorizationEventObject.systemIdToken`），並在驗證前於更嚴格的預先驗證預算（16 KB、3 秒）內讀取。
3. 權杖會依據 `audienceType` + `audience` 進行檢查：
   - `audienceType: "app-url"` → 對象為你的 HTTPS 網路鉤子 URL。
   - `audienceType: "project-number"` → 對象為 Cloud 專案編號。
   - `app-url` 下的外掛程式權杖還要求將 `appPrincipal` 設為應用程式的數字 OAuth 2.0 用戶端 ID（21 位數，不是電子郵件）；否則驗證會失敗並記錄警告。
4. 訊息依聊天室路由：
   - 聊天室會取得每個聊天室各自的工作階段 `agent:<agentId>:googlechat:group:<spaceId>`；回覆會傳送至訊息討論串。
   - 私訊預設會合併至代理程式的主要工作階段；設定 `session.dmScope` 可為每個對象建立獨立的私訊工作階段（請參閱[工作階段](/zh-TW/concepts/session)）。
5. 私訊存取預設採用配對。未知傳送者會收到配對碼；使用下列方式核准：
   - `openclaw pairing approve googlechat <code>`
6. 群組聊天室預設要求 @提及。系統會從以應用程式為目標的 Chat `USER_MENTION` 註解偵測提及；如果偵測需要應用程式的使用者資源名稱，請設定 `botUser`（例如 `users/1234567890`）。
7. 當執行或外掛核准從 Google Chat 發起，且已設定穩定的 `users/<id>` 核准者時，OpenClaw 會在原始聊天室或討論串中發布原生核准卡片（`cardsV2`）。卡片按鈕會攜帶不透明的回呼權杖；只有在無法使用原生傳送時，才會顯示手動 `/approve <id> <decision>` 提示。

### 輸入持久性

請求通過驗證後，OpenClaw 會從儲存空間移除外掛程式授權物件，並在傳回 `200` 前，將 Google Chat `MESSAGE` 事件以持久方式排入佇列。持久化失敗時會傳回 `503`，讓 Google Chat 能夠重試，而不是確認接收可能遺失的事件。

待處理或可重試的訊息能在閘道重新啟動後保留，並維持每個聊天室依序處理；只要使用中或保留的完成記錄仍存在，系統便會使用 Google Chat 訊息資源名稱避免重複的佇列項目。非訊息動作會沿用現有的分離式網路鉤子路徑，且不享有此持久佇列保證。從佇列到代理程式的邊界仍採至少一次傳送，因此在交接期間當機可能會重播一次互動。

## 目標

請使用下列識別碼進行傳送與允許清單設定：

- 私訊：`users/<userId>`（建議）。
- 聊天室：`spaces/<spaceId>`。
- 原始電子郵件 `name@example.com` 可變動，且僅在 `channels.googlechat.dangerouslyAllowNameMatching: true` 時用於允許清單比對。
- 已棄用：`users/<email>` 會視為使用者 ID，而非電子郵件允許清單項目。
- 接受 `googlechat:`、`google-chat:` 和 `gchat:` 前綴，並會將其移除。

## 設定重點

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // 或 serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // 僅用於外掛程式驗證；數字 OAuth 用戶端 ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 選用；有助於提及偵測
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
          systemPrompt: "僅提供簡短回答。",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注意事項：

- 服務帳戶認證資訊：`serviceAccountFile`（路徑）、`serviceAccount`（內嵌 JSON 字串或物件），或 `serviceAccountRef`（環境變數／檔案 SecretRef）。環境變數 `GOOGLE_CHAT_SERVICE_ACCOUNT`（內嵌 JSON）和 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（路徑）僅套用至預設帳戶。多帳戶設定使用 `channels.googlechat.accounts.<id>` 和相同的鍵，包括每個帳戶的 `serviceAccountRef`。
- 未設定 `webhookPath` 時，預設網路鉤子路徑為 `/googlechat`；也可以由 `webhookUrl` 提供路徑。
- 群組鍵必須是穩定的聊天室 ID（`spaces/<spaceId>`）。顯示名稱鍵已棄用，並會記錄相關訊息。
- `dangerouslyAllowNameMatching` 會重新啟用允許清單的可變電子郵件主體比對（緊急相容模式）；doctor 會針對電子郵件項目發出警告。
- 不會公開 Google Chat 回應動作。此外掛使用服務帳戶驗證，而 Google Chat 回應端點需要使用者驗證。為維持相容性，仍接受現有的 `actions.reactions` 設定，但不會產生任何效果。
- 原生核准卡片使用 Google Chat `cardsV2` 按鈕點擊，而非回應事件。核准者來自 `allowFrom` 或 `defaultTo`，且必須是穩定的數字 `users/<id>` 值。
- 訊息動作僅公開文字 `send`。Google Chat 附件上傳需要使用者驗證，但此外掛使用服務帳戶驗證，因此不提供傳出檔案上傳功能。
- `typingIndicator`：`message`（預設值）會發布 `_<Bot> is typing..._` 預留訊息，並將其編輯為第一則回覆；`none` 會停用此功能；`reaction` 需要使用者 OAuth，且目前在服務帳戶驗證下會改用 `message`，並記錄錯誤。
- 輸入附件（每則訊息的第一個附件）會透過 Chat API 下載至媒體處理流程，大小上限由 `mediaMaxMb` 設定（預設為 20）。
- 機器人撰寫的訊息預設會被忽略。使用 `allowBots: true` 時，接受的機器人訊息會使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)：先設定 `channels.defaults.botLoopProtection`，再使用 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆寫。

認證機密的參考詳細資訊：[認證機密管理](/zh-TW/gateway/secrets)。

## 疑難排解

### 405 不允許的方法

如果 Google Cloud Logs Explorer 顯示如下錯誤：

```text
狀態碼：405，原因片語：HTTP 錯誤回應：HTTP/1.1 405 Method Not Allowed
```

網路鉤子處理常式尚未註冊。常見原因：

1. **頻道未設定**：缺少 `channels.googlechat` 區段。請使用以下命令確認：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果傳回「Config path not found」，請新增設定（請參閱[設定重點](#config-highlights)）。

2. **外掛未啟用**：檢查外掛狀態：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果顯示「disabled」，請將 `plugins.entries.googlechat.enabled: true` 新增至你的設定。

3. 設定變更後**未重新啟動閘道**：

   ```bash
   openclaw gateway restart
   ```

確認頻道正在執行：

```bash
openclaw channels status
# 應顯示：Google Chat default: enabled, configured, ...
```

### 其他問題

- `openclaw channels status --probe` 會顯示驗證錯誤和缺少的目標對象設定（`audience` 和 `audienceType` 皆為必要項目）。
- 如果未收到任何訊息，請確認 Chat 應用程式的網路鉤子 URL 和觸發條件設定。
- 如果提及閘門阻擋回覆，請將 `botUser` 設為應用程式的使用者資源名稱，並檢查 `requireMention`。
- 傳送測試訊息時使用 `openclaw logs --follow`，可確認要求是否送達閘道。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [閘道設定](/zh-TW/gateway/configuration)
- [群組](/zh-TW/channels/groups) — 群組聊天行為和提及閘門
- [配對](/zh-TW/channels/pairing) — 私訊驗證和配對流程
- [安全性](/zh-TW/gateway/security) — 存取模型和強化措施
