---
read_when:
    - 正在開發 Microsoft Teams 頻道功能
summary: Microsoft Teams 機器人支援狀態、功能與設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

狀態：支援文字與 DM 附件；頻道/群組檔案傳送需要 `sharePointSiteId` + Graph 權限（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。投票會透過 Adaptive Cards 傳送。訊息動作會公開明確的 `upload-file`，用於以檔案為優先的傳送。

## 隨附 Plugin

Microsoft Teams 在目前的 OpenClaw 版本中會作為隨附 Plugin 提供，因此在一般封裝建置中不需要
另外安裝。

如果你使用較舊的建置，或自訂安裝排除了隨附的 Teams，
請直接安裝 npm 套件：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸套件以跟隨目前的官方發行標籤。只有在需要可重現安裝時，
才釘選確切版本。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳情：[Plugin](/zh-TW/tools/plugin)

## 快速設定

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 會在單一命令中處理 bot 註冊、manifest 建立與憑證產生。

**1. 安裝並登入**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI 目前處於預覽版。命令與旗標可能會隨版本變更。
</Note>

**2. 啟動通道**（Teams 無法連到 localhost）

如果你尚未安裝並驗證 devtunnel CLI，請先進行安裝與驗證（[入門指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必要的，因為 Teams 無法透過 devtunnels 進行驗證。每個傳入的 bot 請求仍會由 Teams SDK 自動驗證。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但這些方案可能每次工作階段都變更 URL）。

**3. 建立應用程式**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

這個單一命令會：

- 建立 Entra ID (Azure AD) 應用程式
- 產生 client secret
- 建置並上傳 Teams app manifest（含圖示）
- 註冊 bot（預設由 Teams 管理 - 不需要 Azure 訂閱）

輸出會顯示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 與一個 **Teams App ID** - 請記下這些資訊以供後續步驟使用。它也會提供直接在 Teams 中安裝應用程式的選項。

**4. 設定 OpenClaw**，使用輸出中的憑證：

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

或直接使用環境變數：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安裝應用程式**

`teams app create` 會提示你安裝應用程式 - 選取「Install in Teams」。如果你略過了，可以稍後取得連結：

```bash
teams app get <teamsAppId> --install-link
```

**6. 驗證一切正常運作**

```bash
teams app doctor <teamsAppId>
```

這會針對 bot 註冊、AAD 應用程式設定、manifest 有效性與 SSO 設定執行診斷。

對於正式環境部署，請考慮使用[同盟驗證](/zh-TW/channels/msteams#federated-authentication-certificate-plus-managed-identity)（憑證或受控身分），而不是 client secrets。

<Note>
群組聊天預設會被封鎖（`channels.msteams.groupPolicy: "allowlist"`）。若要允許群組回覆，請設定 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 以允許任何成員（由提及作為門檻）。
</Note>

## 目標

- 透過 Teams DM、群組聊天或頻道與 OpenClaw 對話。
- 維持路由具決定性：回覆一律傳回訊息抵達的頻道。
- 預設使用安全的頻道行為（除非另有設定，否則需要提及）。

## 設定寫入

預設情況下，Microsoft Teams 允許寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

停用方式：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 存取控制（DM + 群組）

**DM 存取**

- 預設：`channels.msteams.dmPolicy = "pairing"`。未知的傳送者會被忽略，直到獲得核准。
- `channels.msteams.allowFrom` 應使用穩定的 AAD 物件 ID。
- 不要依賴 UPN/顯示名稱比對來建立允許清單 - 它們可能會變更。OpenClaw 預設停用直接名稱比對；若要使用，請透過 `channels.msteams.dangerouslyAllowNameMatching: true` 明確啟用。
- 當憑證允許時，精靈可以透過 Microsoft Graph 將名稱解析為 ID。

**群組存取**

- 預設：`channels.msteams.groupPolicy = "allowlist"`（除非新增 `groupAllowFrom`，否則封鎖）。未設定時，可使用 `channels.defaults.groupPolicy` 覆寫預設值。
- `channels.msteams.groupAllowFrom` 控制哪些傳送者可以在群組聊天/頻道中觸發（會 fallback 到 `channels.msteams.allowFrom`）。
- 設定 `groupPolicy: "open"` 以允許任何成員（預設仍由提及作為門檻）。
- 若要允許 **沒有任何頻道**，請設定 `channels.msteams.groupPolicy: "disabled"`。

範例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + 頻道允許清單**

- 在 `channels.msteams.teams` 下列出 teams 與 channels，以限定群組/頻道回覆的範圍。
- 鍵應使用來自 Teams 連結的穩定 Teams 對話 ID，而不是可變的顯示名稱。
- 當 `groupPolicy="allowlist"` 且存在 teams 允許清單時，只接受列出的 teams/channels（由提及作為門檻）。
- 設定精靈接受 `Team/Channel` 項目，並會替你儲存。
- 啟動時，OpenClaw 會將 team/channel 與使用者允許清單名稱解析為 ID（當 Graph 權限允許時）
  並記錄對應關係；未解析的 team/channel 名稱會保留輸入時的形式，但預設會在路由時被忽略，除非啟用 `channels.msteams.dangerouslyAllowNameMatching: true`。

範例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>手動設定（不使用 Teams CLI）</strong></summary>

如果你無法使用 Teams CLI，可以透過 Azure Portal 手動設定 bot。

### 運作方式

1. 確認 Microsoft Teams Plugin 可用（目前版本已隨附）。
2. 建立 **Azure Bot**（App ID + secret + tenant ID）。
3. 建置參照該 bot 並包含下列 RSC 權限的 **Teams app package**。
4. 將 Teams app 上傳/安裝到 team（或用於 DM 的個人範圍）。
5. 在 `~/.openclaw/openclaw.json`（或環境變數）中設定 `msteams`，並啟動 Gateway。
6. Gateway 預設會在 `/api/messages` 監聽 Bot Framework Webhook 流量。

### 步驟 1：建立 Azure Bot

1. 前往[建立 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填寫 **Basics** 分頁：

   | 欄位              | 值                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot 控制代碼**     | 你的 bot 名稱，例如 `openclaw-msteams`（必須唯一） |
   | **訂閱**   | 選取你的 Azure 訂閱                           |
   | **資源群組** | 建立新的或使用現有的                               |
   | **定價層級**   | 開發/測試使用 **Free**                                 |
   | **App 類型**    | **Single Tenant**（建議 - 請參閱下方注意事項）         |
   | **建立類型**  | **Create new Microsoft App ID**                          |

<Warning>
建立新的多租用戶 bot 已於 2025-07-31 之後棄用。新的 bot 請使用 **Single Tenant**。
</Warning>

3. 按一下 **Review + create** → **Create**（等待約 1-2 分鐘）

### 步驟 2：取得憑證

1. 前往你的 Azure Bot 資源 → **Configuration**
2. 複製 **Microsoft App ID** → 這就是你的 `appId`
3. 按一下 **Manage Password** → 前往 App Registration
4. 在 **Certificates & secrets** 下 → **New client secret** → 複製 **Value** → 這就是你的 `appPassword`
5. 前往 **Overview** → 複製 **Directory (tenant) ID** → 這就是你的 `tenantId`

### 步驟 3：設定 Messaging Endpoint

1. 在 Azure Bot → **Configuration**
2. 將 **Messaging endpoint** 設為你的 Webhook URL：
   - 正式環境：`https://your-domain.com/api/messages`
   - 本機開發：使用通道（請參閱下方[本機開發](#local-development-tunneling)）

### 步驟 4：啟用 Teams 頻道

1. 在 Azure Bot → **Channels**
2. 按一下 **Microsoft Teams** → 設定 → 儲存
3. 接受服務條款

### 步驟 5：建置 Teams App Manifest

- 包含一個 `bot` 項目，且 `botId = <App ID>`。
- 範圍：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人範圍檔案處理所需）。
- 新增 RSC 權限（請參閱[目前的 Teams RSC 權限 manifest](#current-teams-rsc-permissions-manifest)）。
- 建立圖示：`outline.png` (32x32) 與 `color.png` (192x192)。
- 將三個檔案一起壓縮：`manifest.json`、`outline.png`、`color.png`。

### 步驟 6：設定 OpenClaw

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

環境變數：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

### 步驟 7：執行 Gateway

當 Plugin 可用且 `msteams` 設定存在並含有憑證時，Teams 頻道會自動啟動。

</details>

## 同盟驗證（憑證加上受控身分）

> 已於 2026.4.11 加入

對於正式環境部署，OpenClaw 支援 **同盟驗證**，可作為比 client secrets 更安全的替代方案。可使用兩種方法：

### 選項 A：憑證式驗證

使用已在你的 Entra ID app registration 註冊的 PEM 憑證。

**設定：**

1. 產生或取得憑證（含私鑰的 PEM 格式）。
2. 在 Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上傳公開憑證。

**設定：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**環境變數：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 選項 B：Azure Managed Identity

使用 Azure Managed Identity 進行無密碼驗證。這很適合部署在可用受控身分的 Azure 基礎架構（AKS、App Service、Azure VM）上。

**運作方式：**

1. bot pod/VM 具有受控身分（系統指派或使用者指派）。
2. **federated identity credential** 會將受控身分連結到 Entra ID app registration。
3. 執行時，OpenClaw 使用 `@azure/identity` 從 Azure IMDS 端點（`169.254.169.254`）取得 token。
4. token 會傳遞給 Teams SDK 以進行 bot 驗證。

**先決條件：**

- 已啟用受控身分的 Azure 基礎架構（AKS workload identity、App Service、VM）
- 已在 Entra ID app registration 上建立 federated identity credential
- pod/VM 可透過網路存取 IMDS（`169.254.169.254:80`）

**設定（系統指派受控身分）：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**設定（使用者指派的受控識別）：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**環境變數：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（僅適用於使用者指派）

### AKS 工作負載身分識別設定

對於使用工作負載身分識別的 AKS 部署：

1. 在你的 AKS 叢集上**啟用工作負載身分識別**。
2. 在 Entra ID 應用程式註冊上**建立同盟身分識別認證**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 使用應用程式用戶端 ID **標註 Kubernetes 服務帳戶**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 為工作負載身分識別注入**標記 Pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **確保對 IMDS（`169.254.169.254`）的網路存取** - 如果使用 NetworkPolicy，請新增一條輸出規則，允許連到連接埠 80 上的 `169.254.169.254/32`。

### 驗證類型比較

| 方法                 | 設定                                           | 優點                             | 缺點                               |
| -------------------- | ---------------------------------------------- | -------------------------------- | ---------------------------------- |
| **用戶端密碼**       | `appPassword`                                  | 設定簡單                         | 需要輪替密碼，安全性較低           |
| **憑證**             | `authType: "federated"` + `certificatePath`    | 網路上沒有共用密碼               | 憑證管理負擔                       |
| **受控識別**         | `authType: "federated"` + `useManagedIdentity` | 無密碼，無需管理密碼             | 需要 Azure 基礎架構                |

**預設行為：** 未設定 `authType` 時，OpenClaw 預設使用用戶端密碼驗證。既有設定無需變更即可繼續運作。

## 本機開發（通道）

Teams 無法連到 `localhost`。請使用持續性的開發通道，讓你的 URL 在不同工作階段中保持相同：

```bash
# 一次性設定：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每個開發工作階段：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每個工作階段變更）。

如果你的通道 URL 變更，請更新端點：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 測試機器人

**執行診斷：**

```bash
teams app doctor <teamsAppId>
```

一次檢查機器人註冊、AAD 應用程式、資訊清單和 SSO 設定。

**傳送測試訊息：**

1. 安裝 Teams 應用程式（使用 `teams app get <id> --install-link` 取得的安裝連結）
2. 在 Teams 中找到機器人並傳送 DM
3. 檢查 Gateway 記錄中是否有傳入活動

## 環境變數

所有設定鍵也可以透過環境變數設定：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（選用：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（同盟 + 憑證）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（選用，驗證不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（同盟 + 受控識別）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（僅限使用者指派的 MI）

## 成員資訊動作

OpenClaw 為 Microsoft Teams 提供由 Graph 支援的 `member-info` 動作，讓代理程式和自動化可直接從 Microsoft Graph 解析頻道成員詳細資料（顯示名稱、電子郵件、角色）。

需求：

- `Member.Read.Group` RSC 權限（已包含在建議資訊清單中）
- 跨團隊查詢：具有管理員同意的 `User.Read.All` Graph 應用程式權限

此動作由 `channels.msteams.actions.memberInfo` 控制（預設：當 Graph 認證可用時啟用）。

## 歷史內容脈絡

- `channels.msteams.historyLimit` 控制要將多少最近的頻道/群組訊息包入提示。
- 會退回使用 `messages.groupChat.historyLimit`。設為 `0` 可停用（預設 50）。
- 擷取的對話串歷史會依傳送者允許清單（`allowFrom` / `groupAllowFrom`）篩選，因此對話串脈絡植入只包含允許傳送者的訊息。
- 引用附件脈絡（從 Teams 回覆 HTML 衍生的 `ReplyTo*`）目前會依收到內容傳遞。
- 換句話說，允許清單會控管誰可以觸發代理程式；目前只有特定的補充脈絡路徑會被篩選。
- DM 歷史可用 `channels.msteams.dmHistoryLimit`（使用者回合）限制。每位使用者覆寫：`channels.msteams.dms["<user_id>"].historyLimit`。

## 目前的 Teams RSC 權限（資訊清單）

這些是我們 Teams 應用程式資訊清單中**既有的 resourceSpecific 權限**。它們只適用於安裝該應用程式的團隊/聊天內。

**頻道（團隊範圍）：**

- `ChannelMessage.Read.Group`（Application）- 無需 @提及即可接收所有頻道訊息
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**群組聊天：**

- `ChatMessage.Read.Chat`（Application）- 無需 @提及即可接收所有群組聊天訊息

若要透過 Teams CLI 新增 RSC 權限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 資訊清單範例（已修訂）

包含必要欄位的最小有效範例。請替換 ID 和 URL。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### 資訊清單注意事項（必要欄位）

- `bots[].botId` **必須**符合 Azure Bot App ID。
- `webApplicationInfo.id` **必須**符合 Azure Bot App ID。
- `bots[].scopes` 必須包含你打算使用的介面（`personal`、`team`、`groupChat`）。
- 個人範圍中的檔案處理需要 `bots[].supportsFiles: true`。
- 如果你想要頻道流量，`authorization.permissions.resourceSpecific` 必須包含頻道讀取/傳送。

### 更新既有應用程式

若要更新已安裝的 Teams 應用程式（例如新增 RSC 權限）：

```bash
# 下載、編輯並重新上傳資訊清單
teams app manifest download <teamsAppId> manifest.json
# 在本機編輯 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果內容變更，版本會自動遞增
```

更新後，請在每個團隊中重新安裝應用程式，讓新權限生效，並且**完全結束並重新啟動 Teams**（不是只關閉視窗）以清除快取的應用程式中繼資料。

<details>
<summary>手動更新資訊清單（不使用 CLI）</summary>

1. 使用新設定更新你的 `manifest.json`
2. **遞增 `version` 欄位**（例如 `1.0.0` → `1.1.0`）
3. 使用圖示**重新壓縮**資訊清單（`manifest.json`、`outline.png`、`color.png`）
4. 上傳新的 zip：
   - **Teams 管理中心：** Teams 應用程式 → 管理應用程式 → 找到你的應用程式 → 上傳新版本
   - **側載：** 在 Teams → 應用程式 → 管理你的應用程式 → 上傳自訂應用程式

</details>

## 功能：僅 RSC 與 Graph 比較

### 僅使用 **Teams RSC**（已安裝應用程式，沒有 Graph API 權限）

可運作：

- 讀取頻道訊息**文字**內容。
- 傳送頻道訊息**文字**內容。
- 接收**個人（DM）**檔案附件。

不可運作：

- 頻道/群組**圖片或檔案內容**（承載內容只包含 HTML stub）。
- 下載儲存在 SharePoint/OneDrive 的附件。
- 讀取訊息歷史（即時 Webhook 事件之外）。

### 使用 **Teams RSC + Microsoft Graph 應用程式權限**

新增：

- 下載託管內容（貼到訊息中的圖片）。
- 下載儲存在 SharePoint/OneDrive 的檔案附件。
- 透過 Graph 讀取頻道/聊天訊息歷史。

### RSC 與 Graph API

| 功能                   | RSC 權限             | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **即時訊息**           | 是（透過 Webhook）   | 否（僅輪詢）                        |
| **歷史訊息**           | 否                   | 是（可查詢歷史）                    |
| **設定複雜度**         | 僅應用程式資訊清單   | 需要管理員同意 + 權杖流程           |
| **離線運作**           | 否（必須正在執行）   | 是（可隨時查詢）                    |

**重點：** RSC 用於即時監聽；Graph API 用於歷史存取。若要在離線期間補抓錯過的訊息，你需要具備 `ChannelMessage.Read.All` 的 Graph API（需要管理員同意）。

## 啟用 Graph 的媒體 + 歷史（頻道需要）

如果你需要**頻道**中的圖片/檔案，或想要擷取**訊息歷史**，你必須啟用 Microsoft Graph 權限並授與管理員同意。

1. 在 Entra ID（Azure AD）**應用程式註冊**中，新增 Microsoft Graph **應用程式權限**：
   - `ChannelMessage.Read.All`（頻道附件 + 歷史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群組聊天）
2. **授與管理員同意**給租用戶。
3. 遞增 Teams 應用程式**資訊清單版本**、重新上傳，並**在 Teams 中重新安裝應用程式**。
4. **完全結束並重新啟動 Teams**以清除快取的應用程式中繼資料。

**使用者提及的額外權限：** 對話中的使用者 @提及可直接運作。不過，如果你想要動態搜尋並提及**不在目前對話中**的使用者，請新增 `User.Read.All`（Application）權限並授與管理員同意。

## 已知限制

### Webhook 逾時

Teams 透過 HTTP Webhook 傳遞訊息。如果處理時間太長（例如 LLM 回應緩慢），你可能會看到：

- Gateway 逾時
- Teams 重試訊息（造成重複）
- 回覆被丟棄

OpenClaw 會快速返回並主動傳送回覆來處理此情況，但非常慢的回應仍可能造成問題。

### 格式設定

Teams Markdown 比 Slack 或 Discord 更受限制：

- 基本格式可運作：**粗體**、_斜體_、`code`、連結
- 複雜 Markdown（表格、巢狀清單）可能無法正確呈現
- 支援用於投票與語意化簡報傳送的 Adaptive Cards（見下方）

## 設定

主要設定（共用頻道模式請參閱 `/gateway/configuration`）：

- `channels.msteams.enabled`：啟用/停用此頻道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：Bot 認證資訊。
- `channels.msteams.webhook.port`（預設 `3978`）
- `channels.msteams.webhook.path`（預設 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）
- `channels.msteams.allowFrom`：DM 允許清單（建議使用 AAD 物件 ID）。當 Graph 存取可用時，精靈會在設定期間將名稱解析為 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：緊急切換開關，用於重新啟用可變的 UPN/顯示名稱比對，以及直接團隊/頻道名稱路由。
- `channels.msteams.textChunkLimit`：傳出文字區塊大小。
- `channels.msteams.chunkMode`：`length`（預設）或 `newline`，用於在依長度分塊前先依空白行（段落邊界）切分。
- `channels.msteams.mediaAllowHosts`：傳入附件主機允許清單（預設為 Microsoft/Teams 網域）。
- `channels.msteams.mediaAuthAllowHosts`：在媒體重試時附加 Authorization 標頭的主機允許清單（預設為 Graph + Bot Framework 主機）。
- `channels.msteams.requireMention`：頻道/群組中需要 @提及（預設 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（請參閱[回覆樣式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每個團隊覆寫。
- `channels.msteams.teams.<teamId>.requireMention`：每個團隊覆寫。
- `channels.msteams.teams.<teamId>.tools`：每個團隊預設工具政策覆寫（`allow`/`deny`/`alsoAllow`），在缺少頻道覆寫時使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：每個團隊、每個傳送者的預設工具政策覆寫（支援 `"*"` 萬用字元）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每個頻道覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每個頻道覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每個頻道工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每個頻道、每個傳送者的工具政策覆寫（支援 `"*"` 萬用字元）。
- `toolsBySender` 鍵應使用明確前置詞：
  `id:`、`e164:`、`username:`、`name:`（舊版無前置詞鍵仍只會對應到 `id:`）。
- `channels.msteams.actions.memberInfo`：啟用或停用由 Graph 支援的成員資訊動作（預設：Graph 認證資訊可用時啟用）。
- `channels.msteams.authType`：驗證類型 - `"secret"`（預設）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 憑證檔案路徑（聯合 + 憑證驗證）。
- `channels.msteams.certificateThumbprint`：憑證指紋（選用，驗證不需要）。
- `channels.msteams.useManagedIdentity`：啟用受控識別驗證（聯合模式）。
- `channels.msteams.managedIdentityClientId`：使用者指派受控識別的用戶端 ID。
- `channels.msteams.sharePointSiteId`：群組聊天/頻道中檔案上傳使用的 SharePoint 網站 ID（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。

## 路由與工作階段

- 工作階段鍵遵循標準代理格式（請參閱 [/concepts/session](/zh-TW/concepts/session)）：
  - 直接訊息共用主要工作階段（`agent:<agentId>:<mainKey>`）。
  - 頻道/群組訊息使用對話 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回覆樣式：討論串與貼文

Teams 最近在相同底層資料模型上推出了兩種頻道 UI 樣式：

| 樣式                     | 說明                                                      | 建議的 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------- |
| **Posts**（傳統）        | 訊息顯示為卡片，下方有討論串回覆                          | `thread`（預設）    |
| **Threads**（類 Slack）  | 訊息以線性方式流動，更像 Slack                            | `top-level`         |

**問題：** Teams API 不會公開頻道使用哪種 UI 樣式。如果使用錯誤的 `replyStyle`：

- Threads 樣式頻道中的 `thread` → 回覆會彆扭地巢狀顯示
- Posts 樣式頻道中的 `top-level` → 回覆會顯示為獨立的頂層貼文，而不是在討論串內

**解法：** 根據頻道的設定方式，為每個頻道設定 `replyStyle`：

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

### 解析優先順序

當 Bot 將回覆傳送到頻道時，`replyStyle` 會從最具體的覆寫往預設值解析。第一個非 `undefined` 值會生效：

1. **每個頻道** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每個團隊** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全域** — `channels.msteams.replyStyle`
4. **隱含預設** — 從 `requireMention` 衍生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你在全域設定 `requireMention: false`，但沒有明確的 `replyStyle`，Posts 樣式頻道中的提及即使傳入訊息是討論串回覆，也會顯示為頂層貼文。請在全域、團隊或頻道層級固定設定 `replyStyle: "thread"`，以避免意外情況。

### 討論串內容保留

當 `replyStyle: "thread"` 生效，且 Bot 是在頻道討論串內被 @提及時，OpenClaw 會將原始討論串根重新附加到傳出對話參照（`19:…@thread.tacv2;messageid=<root>`），讓回覆落在同一個討論串內。這同時適用於即時（同一輪）傳送，以及 Bot Framework 回合內容到期後所做的主動傳送（例如長時間執行的代理、透過 `mcp__openclaw__message` 排入佇列的工具呼叫回覆）。

討論串根取自對話參照上儲存的 `threadId`。早於 `threadId` 的舊版儲存參照會退回使用 `activityId`（最後植入該對話的任何傳入活動），因此現有部署不需要重新植入也能繼續運作。

當 `replyStyle: "top-level"` 生效時，頻道討論串傳入訊息會刻意以新的頂層貼文回覆，不會附加討論串尾碼。這是 Threads 樣式頻道的正確行為；如果你看到頂層貼文，但預期是討論串回覆，表示該頻道的 `replyStyle` 設定不正確。

## 附件與圖片

**目前限制：**

- **DM：** 圖片與檔案附件可透過 Teams Bot 檔案 API 運作。
- **頻道/群組：** 附件位於 M365 儲存空間（SharePoint/OneDrive）。Webhook 承載只包含 HTML stub，不包含實際檔案位元組。**需要 Graph API 權限**才能下載頻道附件。
- 對於明確以檔案優先的傳送，請使用 `action=upload-file` 搭配 `media` / `filePath` / `path`；選用的 `message` 會成為隨附文字/註解，而 `filename` 會覆寫上傳名稱。

沒有 Graph 權限時，含圖片的頻道訊息會以純文字接收（Bot 無法存取圖片內容）。
預設情況下，OpenClaw 只會從 Microsoft/Teams 主機名稱下載媒體。可使用 `channels.msteams.mediaAllowHosts` 覆寫（使用 `["*"]` 允許任何主機）。
Authorization 標頭只會附加到 `channels.msteams.mediaAuthAllowHosts` 中的主機（預設為 Graph + Bot Framework 主機）。請保持此清單嚴格（避免多租用戶尾碼）。

## 在群組聊天中傳送檔案

Bot 可以使用 FileConsentCard 流程（內建）在 DM 中傳送檔案。不過，**在群組聊天/頻道中傳送檔案**需要額外設定：

| 內容情境                 | 檔案傳送方式                                 | 需要的設定                                      |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → 使用者接受 → Bot 上傳      | 開箱即可運作                                    |
| **群組聊天/頻道**        | 上傳到 SharePoint → 分享連結                 | 需要 `sharePointSiteId` + Graph 權限            |
| **圖片（任何內容情境）** | Base64 編碼內嵌                              | 開箱即可運作                                    |

### 為什麼群組聊天需要 SharePoint

Bot 沒有個人 OneDrive 磁碟機（`/me/drive` Graph API 端點不適用於應用程式身分）。若要在群組聊天/頻道中傳送檔案，Bot 會上傳到 **SharePoint 網站**並建立分享連結。

### 設定

1. 在 Entra ID（Azure AD）→ App Registration 中**新增 Graph API 權限**：
   - `Sites.ReadWrite.All`（Application）- 將檔案上傳到 SharePoint
   - `Chat.Read.All`（Application）- 選用，啟用每位使用者的分享連結

2. 為租用戶**授與管理員同意**。

3. **取得你的 SharePoint 網站 ID：**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **設定 OpenClaw：**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 分享行為

| 權限                                    | 分享行為                                                  |
| --------------------------------------- | --------------------------------------------------------- |
| 僅 `Sites.ReadWrite.All`                | 組織範圍分享連結（組織中的任何人都可存取）                |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 每位使用者分享連結（只有聊天成員可存取）                  |

每位使用者分享更安全，因為只有聊天參與者可以存取檔案。如果缺少 `Chat.Read.All` 權限，Bot 會退回使用組織範圍分享。

### 備援行為

| 情境                                             | 結果                                               |
| ------------------------------------------------ | -------------------------------------------------- |
| 群組聊天 + 檔案 + 已設定 `sharePointSiteId`      | 上傳到 SharePoint，傳送分享連結                    |
| 群組聊天 + 檔案 + 沒有 `sharePointSiteId`        | 嘗試 OneDrive 上傳（可能失敗），只傳送文字         |
| 個人聊天 + 檔案                                 | FileConsentCard 流程（不需要 SharePoint 即可運作） |
| 任何內容情境 + 圖片                             | Base64 編碼內嵌（不需要 SharePoint 即可運作）      |

### 檔案儲存位置

上傳的檔案會儲存在已設定 SharePoint 網站預設文件庫中的 `/OpenClawShared/` 資料夾。

## 投票（Adaptive Cards）

OpenClaw 會將 Teams 投票以 Adaptive Cards 傳送（沒有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 記錄在 `~/.openclaw/msteams-polls.json`。
- Gateway 必須保持上線才能記錄投票。
- 投票尚不會自動張貼結果摘要（如有需要，請檢查儲存檔案）。

## 簡報卡片

使用 `message` 工具或 CLI，將語意化簡報承載資料傳送給 Teams 使用者或交談。OpenClaw 會依據通用簡報合約，將它們轉譯為 Teams Adaptive Cards。

`presentation` 參數接受語意化區塊。提供 `presentation` 時，訊息文字為選用。

**代理工具：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

如需目標格式詳細資訊，請參閱下方的[目標格式](#target-formats)。

## 目標格式

MSTeams 目標使用前綴來區分使用者與交談：

| 目標類型            | 格式                             | 範例                                                |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 使用者（依 ID）     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 使用者（依名稱）    | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群組/頻道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群組/頻道（原始值） | `<conversation-id>`              | `19:abc123...@thread.tacv2`（若包含 `@thread`）     |

**CLI 範例：**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**代理工具範例：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
沒有 `user:` 前綴時，名稱預設會解析為群組或團隊。依顯示名稱指定人員時，請一律使用 `user:`。
</Note>

## 主動傳訊

- 主動訊息只有在使用者互動**之後**才可行，因為我們會在該時間點儲存交談參照。
- 如需 `dmPolicy` 和允許清單閘控，請參閱 `/gateway/configuration`。

## 團隊與頻道 ID（常見陷阱）

Teams URL 中的 `groupId` 查詢參數**不是**設定所使用的團隊 ID。請改從 URL 路徑擷取 ID：

**團隊 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**頻道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**設定用途：**

- 團隊鍵 = `/team/` 後方的路徑區段（URL 解碼後，例如 `19:Bk4j...@thread.tacv2`；較舊的租用戶可能會顯示 `@thread.skype`，這也有效）
- 頻道鍵 = `/channel/` 後方的路徑區段（URL 解碼後）
- 對 OpenClaw 路由來說，請**忽略** `groupId` 查詢參數。它是 Microsoft Entra 群組 ID，不是傳入 Teams 活動中使用的 Bot Framework 交談 ID。

## 私人頻道

機器人在私人頻道中的支援有限：

| 功能                         | 標準頻道 | 私人頻道             |
| ---------------------------- | -------- | -------------------- |
| 機器人安裝                   | 是       | 有限                 |
| 即時訊息（Webhook）          | 是       | 可能無法運作         |
| RSC 權限                     | 是       | 行為可能不同         |
| @提及                        | 是       | 若機器人可存取       |
| Graph API 歷程               | 是       | 是（具備權限時）     |

**如果私人頻道無法運作的替代方式：**

1. 使用標準頻道進行機器人互動
2. 使用 DM - 使用者永遠可以直接傳訊息給機器人
3. 使用 Graph API 存取歷史內容（需要 `ChannelMessage.Read.All`）

## 疑難排解

### 常見問題

- **圖片未顯示在頻道中：** 缺少 Graph 權限或管理員同意。重新安裝 Teams 應用程式，並完全結束/重新開啟 Teams。
- **頻道中沒有回應：** 預設需要提及；設定 `channels.msteams.requireMention=false`，或依團隊/頻道設定。
- **版本不符（Teams 仍顯示舊的資訊清單）：** 移除並重新加入應用程式，然後完全結束 Teams 以重新整理。
- **Webhook 回傳 401 Unauthorized：** 手動測試時未提供 Azure JWT 的預期結果，表示端點可連線但驗證失敗。請使用 Azure Web Chat 正確測試。

### 資訊清單上傳錯誤

- **"Icon file cannot be empty"：** 資訊清單參照了 0 位元組的圖示檔案。建立有效的 PNG 圖示（`outline.png` 為 32x32，`color.png` 為 192x192）。
- **"webApplicationInfo.Id already in use"：** 應用程式仍安裝在另一個團隊/聊天中。請先找到並解除安裝，或等待 5-10 分鐘讓變更傳播。
- **上傳時出現 "Something went wrong"：** 改透過 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上傳，開啟瀏覽器 DevTools（F12）→ Network 分頁，並檢查回應本文中的實際錯誤。
- **側載失敗：** 嘗試改用「Upload an app to your org's app catalog」，而不是「Upload a custom app」；這通常可以繞過側載限制。

### RSC 權限無法運作

1. 驗證 `webApplicationInfo.id` 與機器人的 App ID 完全相符
2. 重新上傳應用程式，並在團隊/聊天中重新安裝
3. 檢查組織管理員是否封鎖了 RSC 權限
4. 確認你使用正確範圍：團隊使用 `ChannelMessage.Read.Group`，群組聊天使用 `ChatMessage.Read.Chat`

## 參考資料

- [建立 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 設定指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 建立/管理 Teams 應用程式
- [Teams 應用程式資訊清單結構描述](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收頻道訊息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 權限參考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 機器人檔案處理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（頻道/群組需要 Graph）
- [主動傳訊](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用於機器人管理的 Teams CLI

## 相關

- [頻道概觀](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
