---
read_when:
    - 設定或疑難排解 Discord Activity 小工具
summary: 在 Discord Activities 中啟動獨立運作的 OpenClaw HTML 小工具
title: Discord 活動
x-i18n:
    generated_at: "2026-07-19T13:34:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b1bc04443aef89fd514290c3bebdbdd3e9972298b45cae3806bec99344f6d8cd
    source_path: channels/discord-activities.md
    workflow: 16
---

Discord Activities 可讓代理程式將互動式、獨立的 HTML 小工具發佈至目前的 Discord 頻道。訊息中包含 **Open widget** 按鈕；按一下後會在 Discord 內啟動小工具。

此功能預設為關閉。只有在 `channels.discord.activities` 存在且可解析出用戶端密鑰時，OpenClaw 才會註冊 Activity HTTP 路由、`show_widget` 代理程式工具及啟動按鈕處理常式。已淘汰的 `discord_widget` 別名仍會保留一個版本。

## 先決條件

- 現有的 [OpenClaw Discord 機器人](/zh-TW/channels/discord)
- 可連至 OpenClaw 閘道的公用 HTTPS 主機名稱
- 設定機器人 Discord 應用程式之 Activities 與 OAuth2 的權限

任何 HTTPS 反向 Proxy 或通道皆可使用。具名 Cloudflare Tunnel 可提供穩定的主機名稱，且不會直接公開閘道連接埠。

```yaml
# ~/.cloudflared/config.yml
tunnel: openclaw-discord
credentials-file: /home/you/.cloudflared/TUNNEL-ID.json
ingress:
  - hostname: openclaw.example.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

```bash
cloudflared tunnel login
cloudflared tunnel create openclaw-discord
cloudflared tunnel route dns openclaw-discord openclaw.example.com
cloudflared tunnel run openclaw-discord
```

請維持啟用一般閘道驗證。只有 Activity 前綴是公開的，而此外掛會自行驗證 OAuth、Activity 執行個體成員資格、頻道繫結、工作階段及一次性文件權能。

## 設定

<Steps>
  <Step title="透過 HTTPS 公開閘道">
    啟動通道或反向 Proxy，並在新增 Activities 設定後，確認 `https://openclaw.example.com/discord/activity/` 可連至閘道。請將範例主機名稱替換為你自己的主機名稱。
  </Step>

  <Step title="在 Discord 中啟用 Activities">
    在 [Discord Developer Portal](https://discord.com/developers/applications) 中開啟現有的機器人應用程式。開啟 **Activities**、啟用 Activities，然後建立 URL 對應：

    - 前綴：`ROOT`（`/`）
    - 目標：`openclaw.example.com/discord/activity`

    目標為公用主機名稱加上 `/discord/activity`，結尾不含斜線。

  </Step>

  <Step title="複製 OAuth2 用戶端密鑰">
    在 Developer Portal 中開啟 **OAuth2**。Discord 要求至少設定一個重新導向 URI，因此若應用程式尚未設定，請新增本機預留位置，例如回送位址；Embedded App SDK 會處理 Activity 的返回流程。複製或重設應用程式用戶端密鑰。請將其視為認證資訊：不要貼到聊天、日誌或已提交的設定檔中。
  </Step>

  <Step title="設定 OpenClaw">
    在應提供小工具的 Discord 帳號中新增一個區塊：

    ```json5
    {
      channels: {
        discord: {
          token: "${DISCORD_BOT_TOKEN}",
          activities: {
            clientSecret: "${DISCORD_CLIENT_SECRET}",
            // 選用。預設為啟動時取得的機器人應用程式 ID。
            applicationId: "YOUR_DISCORD_APPLICATION_ID",
          },
        },
      },
    }
    ```

    設定 `DISCORD_CLIENT_SECRET` 時，可從區塊中省略 `clientSecret`。區塊本身必須保留，才能選擇啟用此功能。

    一般 Discord 存取設定仍是分開管理。例如，`allowFrom` 仍控制誰可以向代理程式傳送私訊；它不會控制誰可以開啟已發佈至頻道的小工具。

  </Step>

  <Step title="重新啟動並測試">
    重新啟動閘道。在 Discord 對話中，要求代理程式顯示互動式小工具。代理程式會呼叫 `show_widget`；按一下已發佈訊息中的 **Open widget**。
  </Step>
</Steps>

## 安全模型

- 傳回小工具中繼資料前，OAuth 會識別 Discord 使用者。
- Discord 的 Get Activity Instance API 必須確認 OAuth 使用者存在於目前的 Activity 執行個體中。該執行個體的頻道必須與小工具發佈所在的頻道相符。
- Discord 允許進入該頻道的所有人都能開啟其中的小工具。若要縮小對象範圍，請使用 Discord 頻道權限。OpenClaw 命令與私訊允許清單不會授予或移除對已發佈頻道內容的存取權。
- OAuth 工作階段會在 15 分鐘後到期。小工具文件權能會在 60 秒後到期，且僅能使用一次。
- 小工具會在七天後到期，每個 Discord 外掛執行個體最多保留 64 個。
- 小工具 HTML 由你的代理程式撰寫，應視為受信任的內容。請勿嵌入你不希望因小工具程式錯誤而外洩的機密資訊。
- 小工具可在自身的巢狀框架內瀏覽。`sandbox="allow-scripts"` iframe 會封鎖頂層導覽、彈出式視窗及同源存取，而其內容安全政策會封鎖網路連線與外部資源。這些控制措施屬於縱深防禦，並非用來防範撰寫該小工具之代理程式的安全邊界。
- 停用 Activities 時，完全不會註冊 `/discord/activity`。

啟用後，可透過你的通道存取公開的 Activity Shell 與 Token 交換路由。若沒有有效的 OAuth 工作階段及一次性文件權能，這些路由不會公開小工具 HTML。

## 疑難排解

### Activity 顯示「Gateway offline」

- 確認通道正在執行，且路由至閘道實際繫結的連接埠
- 確認 Developer Portal 目標包含 `/discord/activity`
- 變更 Discord 或 OpenClaw 設定後，重新啟動閘道
- 查看閘道日誌中關於缺少 Activities 用戶端密鑰的單行警告

### Discord 開啟空白頁面或回報 `blocked:csp`

- 確認 URL 對應使用 `ROOT`，且沒有新增第二個 `/discord/activity` 區段
- 確認 Shell、`shell.js` 及 SDK 模組全都透過 Discord Proxy 傳回
- 檢查閘道日誌中位於 `/discord/activity/` 下的要求

系統會刻意封鎖小工具的網路要求。請將小工具所需的所有 CSS、JavaScript、圖片及資料全部內嵌。

### 「Widget unavailable」

請從代理程式發佈小工具的頻道啟動按鈕。按一下時，OpenClaw 會在伺服器端追蹤啟動，因此即使 Discord 省略或破壞按鈕的自訂 ID，新的啟動記錄仍可解析出確切的小工具。當自訂 ID 與啟動記錄皆無法解析時，OpenClaw 會開啟該頻道中最近發佈且仍有效的小工具。較舊的小工具仍可透過保留其自訂 ID 的按鈕存取。

### 「You cannot launch Activities in this channel」

Discord 不會從論壇貼文討論串啟動 Activities。OpenClaw 可以在該處發佈小工具訊息與按鈕，但請改從一般文字頻道啟動 Activity。此限制來自 Discord，而非 OpenClaw。
