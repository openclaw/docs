---
read_when:
    - 正在開發 Microsoft Teams 頻道功能
summary: Microsoft Teams 機器人支援狀態、功能與設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T18:57:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Status: 支援文字 + 私訊附件；頻道/群組檔案傳送需要 `sharePointSiteId` + Graph 權限（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。投票會透過自適應卡片傳送。訊息動作會公開明確的 `upload-file`，用於以檔案優先的傳送。

## 內建外掛

Microsoft Teams 在目前的 OpenClaw 發行版本中作為內建外掛隨附，因此一般封裝建置不需要另外安裝。

如果你使用的是較舊的建置，或是排除內建 Teams 的自訂安裝，請直接安裝 npm 套件：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸套件可跟隨目前的官方發行標籤。只有在需要可重現的安裝時，才釘選精確版本。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 會用單一命令處理機器人註冊、資訊清單建立與憑證產生。

**1. 安裝並登入**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams 命令列介面目前處於預覽版。命令和旗標可能會在發行版本之間變更。
</Note>

**2. 啟動通道**（Teams 無法連到 localhost）

如果你尚未安裝並驗證 devtunnel 命令列介面，請先完成（[入門指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必要的，因為 Teams 無法向 devtunnels 驗證。每個傳入的機器人請求仍會由 Teams SDK 自動驗證。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但這些可能會在每個工作階段變更 URL）。

**3. 建立應用程式**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

這個單一命令會：

- 建立 Entra ID (Azure AD) 應用程式
- 產生用戶端密碼
- 建置並上傳 Teams 應用程式資訊清單（含圖示）
- 註冊機器人（預設由 Teams 管理，不需要 Azure 訂閱）

輸出會顯示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 與 **Teams App ID**，請為後續步驟記下這些值。它也會提供直接在 Teams 中安裝應用程式的選項。

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

`teams app create` 會提示你安裝應用程式，請選取「Install in Teams」。如果你略過了，可以稍後取得連結：

```bash
teams app get <teamsAppId> --install-link
```

**6. 驗證一切正常運作**

```bash
teams app doctor <teamsAppId>
```

這會跨機器人註冊、AAD 應用程式設定、資訊清單有效性與 SSO 設定執行診斷。

對於正式環境部署，請考慮使用[同盟驗證](/zh-TW/channels/msteams#federated-authentication-certificate-plus-managed-identity)（憑證或受控身分），而不是用戶端密碼。

<Note>
群組聊天預設會被封鎖（`channels.msteams.groupPolicy: "allowlist"`）。若要允許群組回覆，請設定 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允許任何成員（受提及門檻限制）。
</Note>

## 目標

- 透過 Teams 私訊、群組聊天或頻道與 OpenClaw 對話。
- 保持路由決定性：回覆一律回到訊息來源的頻道。
- 預設使用安全的頻道行為（除非另有設定，否則需要提及）。

## 設定寫入

預設情況下，Microsoft Teams 可以寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

使用以下設定停用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 存取控制（私訊 + 群組）

**私訊存取**

- 預設值：`channels.msteams.dmPolicy = "pairing"`。未知寄件者會被忽略，直到核准為止。
- `channels.msteams.allowFrom` 應使用穩定的 AAD 物件 ID，或靜態寄件者存取群組，例如 `accessGroup:core-team`。
- 不要依賴 UPN/顯示名稱比對作為允許清單，因為它們可能會變更。OpenClaw 預設停用直接名稱比對；請使用 `channels.msteams.dangerouslyAllowNameMatching: true` 明確選擇啟用。
- 當憑證允許時，精靈可以透過 Microsoft Graph 將名稱解析為 ID。

**群組存取**

- 預設值：`channels.msteams.groupPolicy = "allowlist"`（除非你加入 `groupAllowFrom`，否則封鎖）。未設定時，使用 `channels.defaults.groupPolicy` 覆寫預設值。
- `channels.msteams.groupAllowFrom` 控制哪些寄件者或靜態寄件者存取群組可以在群組聊天/頻道中觸發（會回退到 `channels.msteams.allowFrom`）。
- 設定 `groupPolicy: "open"` 可允許任何成員（預設仍受提及門檻限制）。
- 若要允許**無任何頻道**，請設定 `channels.msteams.groupPolicy: "disabled"`。

範例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + 頻道允許清單**

- 透過在 `channels.msteams.teams` 下列出團隊與頻道，限定群組/頻道回覆範圍。
- 鍵應使用 Teams 連結中的穩定 Teams 對話 ID，而不是可變的顯示名稱。
- 當 `groupPolicy="allowlist"` 且存在 teams 允許清單時，只接受列出的團隊/頻道（受提及門檻限制）。
- 設定精靈接受 `Team/Channel` 項目，並會為你儲存。
- 啟動時，OpenClaw 會將團隊/頻道與使用者允許清單名稱解析為 ID（當 Graph 權限允許時）
  並記錄對應關係；未解析的團隊/頻道名稱會依輸入保留，但預設會在路由時忽略，除非啟用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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
<summary><strong>手動設定（不使用 Teams 命令列介面）</strong></summary>

如果你無法使用 Teams 命令列介面，可以透過 Azure Portal 手動設定機器人。

### 運作方式

1. 確認 Microsoft Teams 外掛可用（目前發行版本已內建）。
2. 建立 **Azure Bot**（App ID + 密碼 + 租用戶 ID）。
3. 建置一個參照機器人並包含下列 RSC 權限的 **Teams 應用程式套件**。
4. 將 Teams 應用程式上傳/安裝到團隊（或用於私訊的個人範圍）。
5. 在 `~/.openclaw/openclaw.json`（或環境變數）中設定 `msteams`，並啟動閘道。
6. 閘道預設會在 `/api/messages` 監聽 Bot Framework 網路鉤子流量。

### 步驟 1：建立 Azure Bot

1. 前往[建立 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填寫 **Basics** 分頁：

   | 欄位 | 值 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | 你的機器人名稱，例如 `openclaw-msteams`（必須唯一） |
   | **Subscription** | 選取你的 Azure 訂閱 |
   | **Resource group** | 建立新的或使用現有的 |
   | **Pricing tier** | 開發/測試使用 **Free** |
   | **Type of App** | **Single Tenant**（建議，請參閱下方注意事項） |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
新的多租用戶機器人建立已於 2025-07-31 後淘汰。新機器人請使用 **Single Tenant**。
</Warning>

3. 按一下 **Review + create** → **Create**（等待約 1-2 分鐘）

### 步驟 2：取得憑證

1. 前往你的 Azure Bot 資源 → **Configuration**
2. 複製 **Microsoft App ID** → 這就是你的 `appId`
3. 按一下 **Manage Password** → 前往 App Registration
4. 在 **Certificates & secrets** 下 → **New client secret** → 複製 **Value** → 這就是你的 `appPassword`
5. 前往 **Overview** → 複製 **Directory (tenant) ID** → 這就是你的 `tenantId`

### 步驟 3：設定訊息端點

1. 在 Azure Bot → **Configuration**
2. 將 **Messaging endpoint** 設為你的網路鉤子 URL：
   - 正式環境：`https://your-domain.com/api/messages`
   - 本機開發：使用通道（請參閱下方[本機開發](#local-development-tunneling)）

### 步驟 4：啟用 Teams 頻道

1. 在 Azure Bot → **Channels**
2. 按一下 **Microsoft Teams** → Configure → Save
3. 接受服務條款

### 步驟 5：建置 Teams 應用程式資訊清單

- 包含一個 `bot` 項目，其中 `botId = <App ID>`。
- 範圍：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人範圍檔案處理所需）。
- 加入 RSC 權限（請參閱[目前的 Teams RSC 權限資訊清單](#current-teams-rsc-permissions-manifest)）。
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

### 步驟 7：執行閘道

當外掛可用且 `msteams` 設定存在憑證時，Teams 頻道會自動啟動。

</details>

## 同盟驗證（憑證加受控身分）

> 新增於 2026.4.11

對於正式環境部署，OpenClaw 支援**同盟驗證**，作為比用戶端密碼更安全的替代方案。有兩種方法可用：

### 選項 A：憑證式驗證

使用已向你的 Entra ID 應用程式註冊項目註冊的 PEM 憑證。

**設定：**

1. 產生或取得憑證（含私密金鑰的 PEM 格式）。
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

### 選項 B：Azure 受控身分

使用 Azure 受控身分進行無密碼驗證。這非常適合部署在 Azure 基礎架構（AKS、App Service、Azure VM）且可用受控身分的環境。

**運作方式：**

1. 機器人 pod/VM 具有受控身分（系統指派或使用者指派）。
2. **同盟身分憑證**會將受控身分連結到 Entra ID 應用程式註冊項目。
3. 執行時，OpenClaw 使用 `@azure/identity` 從 Azure IMDS 端點 (`169.254.169.254`) 取得權杖。
4. 權杖會傳遞給 Teams SDK，用於機器人驗證。

**先決條件：**

- 已啟用受控身分的 Azure 基礎架構（AKS workload identity、App Service、VM）
- 已在 Entra ID 應用程式註冊項目上建立同盟身分憑證
- pod/VM 可透過網路存取 IMDS (`169.254.169.254:80`)

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

**設定（使用者指派的受控身分識別）：**

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

適用於使用工作負載身分識別的 AKS 部署：

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

3. 使用應用程式用戶端 ID **註解 Kubernetes 服務帳戶**：

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

5. **確保網路可存取** IMDS (`169.254.169.254`) - 若使用 NetworkPolicy，請新增一條輸出規則，允許連至連接埠 80 上的 `169.254.169.254/32`。

### 驗證類型比較

| 方法                 | 設定                                           | 優點                         | 缺點                               |
| -------------------- | ---------------------------------------------- | ---------------------------- | ---------------------------------- |
| **用戶端密鑰**       | `appPassword`                                  | 設定簡單                     | 需要輪替密鑰，安全性較低           |
| **憑證**             | `authType: "federated"` + `certificatePath`    | 不透過網路傳送共用密鑰       | 憑證管理負擔                       |
| **受控身分識別**     | `authType: "federated"` + `useManagedIdentity` | 無密碼，無需管理密鑰         | 需要 Azure 基礎架構                |

**預設行為：** 未設定 `authType` 時，OpenClaw 預設使用用戶端密鑰驗證。現有設定可繼續運作，無需變更。

## 本機開發（通道轉送）

Teams 無法連到 `localhost`。請使用持久的開發通道，讓你的 URL 在各工作階段之間保持不變：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能會在每個工作階段變更）。

如果你的通道 URL 變更，請更新端點：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 測試機器人

**執行診斷：**

```bash
teams app doctor <teamsAppId>
```

一次檢查機器人註冊、AAD 應用程式、資訊清單與 SSO 設定。

**傳送測試訊息：**

1. 安裝 Teams 應用程式（使用來自 `teams app get <id> --install-link` 的安裝連結）
2. 在 Teams 中找到機器人並傳送 DM
3. 檢查閘道記錄是否有傳入活動

## 環境變數

所有設定鍵也可改由環境變數設定：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（選用：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（同盟 + 憑證）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（選用，驗證不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（同盟 + 受控身分識別）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（僅限使用者指派的 MI）

## 成員資訊動作

OpenClaw 為 Microsoft Teams 提供以 Graph 為後端的 `member-info` 動作，讓代理程式與自動化可以直接從 Microsoft Graph 解析頻道成員詳細資料（顯示名稱、電子郵件、角色）。

需求：

- `Member.Read.Group` RSC 權限（已包含在建議的資訊清單中）
- 跨團隊查詢：具備管理員同意的 `User.Read.All` Graph 應用程式權限

此動作受 `channels.msteams.actions.memberInfo` 控制（預設：有 Graph 憑證可用時啟用）。

## 歷史脈絡

- `channels.msteams.historyLimit` 控制有多少近期頻道/群組訊息會被包進提示詞。
- 會退回使用 `messages.groupChat.historyLimit`。設為 `0` 可停用（預設 50）。
- 擷取到的執行緒歷史會依寄件者允許清單（`allowFrom` / `groupAllowFrom`）篩選，因此執行緒脈絡播種只包含來自允許寄件者的訊息。
- 引用附件脈絡（從 Teams 回覆 HTML 衍生的 `ReplyTo*`）目前會依收到的內容傳遞。
- 換句話說，允許清單會限制誰可以觸發代理程式；目前只有特定的補充脈絡路徑會被篩選。
- DM 歷史可透過 `channels.msteams.dmHistoryLimit`（使用者回合）限制。每位使用者覆寫：`channels.msteams.dms["<user_id>"].historyLimit`。

## 目前的 Teams RSC 權限（資訊清單）

這些是我們 Teams 應用程式資訊清單中的**現有 resourceSpecific 權限**。它們只適用於安裝應用程式的團隊/聊天內。

**頻道（團隊範圍）：**

- `ChannelMessage.Read.Group`（應用程式）- 不需 @提及即可接收所有頻道訊息
- `ChannelMessage.Send.Group`（應用程式）
- `Member.Read.Group`（應用程式）
- `Owner.Read.Group`（應用程式）
- `ChannelSettings.Read.Group`（應用程式）
- `TeamMember.Read.Group`（應用程式）
- `TeamSettings.Read.Group`（應用程式）

**群組聊天：**

- `ChatMessage.Read.Chat`（應用程式）- 不需 @提及即可接收所有群組聊天訊息

若要透過 Teams 命令列介面新增 RSC 權限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 資訊清單範例（已修訂）

包含必要欄位的最小有效範例。請替換 ID 與 URL。

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
- `bots[].scopes` 必須包含你計畫使用的介面（`personal`、`team`、`groupChat`）。
- 個人範圍中的檔案處理需要 `bots[].supportsFiles: true`。
- 如果你需要頻道流量，`authorization.permissions.resourceSpecific` 必須包含頻道讀取/傳送。

### 更新現有應用程式

若要更新已安裝的 Teams 應用程式（例如新增 RSC 權限）：

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新後，請在每個團隊中重新安裝應用程式，讓新權限生效，並**完整結束並重新啟動 Teams**（不只是關閉視窗），以清除快取的應用程式中繼資料。

<details>
<summary>手動更新資訊清單（不使用命令列介面）</summary>

1. 使用新設定更新你的 `manifest.json`
2. **遞增 `version` 欄位**（例如 `1.0.0` → `1.1.0`）
3. **重新壓縮**包含圖示的資訊清單（`manifest.json`、`outline.png`、`color.png`）
4. 上傳新的 zip：
   - **Teams 管理中心：** Teams 應用程式 → 管理應用程式 → 找到你的應用程式 → 上傳新版本
   - **側載：** 在 Teams → 應用程式 → 管理你的應用程式 → 上傳自訂應用程式

</details>

## 功能：僅 RSC 與 Graph 的比較

### 僅使用 **Teams RSC**（已安裝應用程式，沒有 Graph API 權限）

可運作：

- 讀取頻道訊息**文字**內容。
- 傳送頻道訊息**文字**內容。
- 接收**個人（DM）**檔案附件。

無法運作：

- 頻道/群組**圖片或檔案內容**（承載只包含 HTML stub）。
- 下載儲存在 SharePoint/OneDrive 的附件。
- 讀取訊息歷史（即時網路鉤子事件之外）。

### 使用 **Teams RSC + Microsoft Graph 應用程式權限**

新增：

- 下載託管內容（貼到訊息中的圖片）。
- 下載儲存在 SharePoint/OneDrive 的檔案附件。
- 透過 Graph 讀取頻道/聊天訊息歷史。

### RSC 與 Graph API

| 功能                   | RSC 權限             | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **即時訊息**           | 是（透過網路鉤子）   | 否（僅輪詢）                        |
| **歷史訊息**           | 否                   | 是（可查詢歷史）                    |
| **設定複雜度**         | 僅應用程式資訊清單   | 需要管理員同意 + 權杖流程           |
| **離線運作**           | 否（必須正在執行）   | 是（可隨時查詢）                    |

**重點：** RSC 用於即時監聽；Graph API 用於歷史存取。若要在離線時補上錯過的訊息，你需要具備 `ChannelMessage.Read.All` 的 Graph API（需要管理員同意）。

## 啟用 Graph 的媒體 + 歷史（頻道必要）

如果你在**頻道**中需要圖片/檔案，或想擷取**訊息歷史**，你必須啟用 Microsoft Graph 權限並授予管理員同意。

1. 在 Entra ID (Azure AD) **應用程式註冊**中，新增 Microsoft Graph **應用程式權限**：
   - `ChannelMessage.Read.All`（頻道附件 + 歷史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群組聊天）
2. **授予管理員同意**給租用戶。
3. 提升 Teams 應用程式**資訊清單版本**、重新上傳，並**在 Teams 中重新安裝應用程式**。
4. **完整結束並重新啟動 Teams**，以清除快取的應用程式中繼資料。

**使用者提及的額外權限：** 使用者 @提及對對話中的使用者可直接運作。不過，如果你想動態搜尋並提及**不在目前對話中的**使用者，請新增 `User.Read.All`（應用程式）權限並授予管理員同意。

## 已知限制

### 網路鉤子逾時

Teams 透過 HTTP 網路鉤子傳遞訊息。如果處理時間太長（例如 LLM 回應緩慢），你可能會看到：

- 閘道逾時
- Teams 重試訊息（造成重複）
- 回覆被丟棄

OpenClaw 透過快速返回並主動傳送回覆來處理這點，但非常慢的回應仍可能造成問題。

### Teams 雲端與服務 URL 支援

這條由 SDK 支援的 Teams 路徑已針對 Microsoft Teams 公用雲端進行即時驗證。

入站回覆使用傳入的 Teams SDK 回合內容。脫離內容的主動操作 - 傳送、編輯、刪除、卡片、投票、檔案同意訊息，以及排入佇列的長時間執行回覆 - 會使用已儲存交談參照的 `serviceUrl`。公用雲端預設使用 Teams SDK 公用雲端環境，並允許公用 Teams Connector 主機上的已儲存參照：`https://smba.trafficmanager.net/`。

公用雲端是預設值。一般公用雲端 Bot 不需要設定 `channels.msteams.cloud` 或 `channels.msteams.serviceUrl`。

若使用非公用 Teams 雲端，請在 Microsoft 發布對應主動邊界時設定 `cloud` 和相符的邊界：

- `channels.msteams.cloud` 會選取 Teams SDK 的雲端預設值，用於驗證、JWT 驗證、權杖服務和 Graph 範圍。
- `channels.msteams.serviceUrl` 會選取 Bot Connector 端點邊界，用於在主動傳送、編輯、刪除、卡片、投票、檔案同意訊息，以及排入佇列的長時間執行回覆之前，驗證已儲存的交談參照。USGov 和 DoD SDK 雲端需要此設定。對於 China/21Vianet，OpenClaw 會使用 SDK `China` 預設值，並只接受 Azure China Bot Framework channel 主機上的已儲存/已設定服務 URL。

Microsoft 會在 Teams 主動傳訊文件的 [建立交談](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)章節中發布全域主動 Bot Connector 端點。可用時請使用傳入活動的 `serviceUrl`；如果需要全域主動端點，請使用 Microsoft 的表格。

| Teams 環境 | OpenClaw 設定                                             | 主動 `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| 公用            | 不需要 cloud/serviceUrl 設定                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | 設定 `serviceUrl`；不存在獨立的 Teams SDK 雲端預設值 | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 使用傳入活動的 `serviceUrl`           |

GCC 範例，其中 Microsoft 記錄了獨立的主動服務 URL，但 Teams SDK 未公開獨立的 GCC 雲端預設值：

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High 範例：

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` 限制為支援的 Microsoft Teams Bot Connector 主機。設定服務 URL 後，OpenClaw 會在主動傳送、編輯、刪除、卡片、投票或排入佇列的長時間執行回覆執行前，檢查已儲存交談的 `serviceUrl` 是否使用相同主機。使用預設公用雲端設定時，如果已儲存交談指向公用 Teams Connector 主機之外，OpenClaw 會採取失敗關閉。變更雲端/服務 URL 設定後，請從該交談接收一則新訊息，讓已儲存交談參照保持最新。

China/21Vianet 在 Microsoft 的 Teams 主動端點表格中沒有獨立的全域主動 `smba` URL。設定 `cloud: "China"`，讓 Teams SDK 使用 Azure China 驗證、權杖和 JWT 端點。接著，主動傳送需要來自傳入 China Teams 活動的已儲存交談參照，或在 Azure China Bot Framework channel 邊界 (`*.botframework.azure.cn`) 上明確設定的服務 URL。Graph 支援的 Teams 輔助工具目前對 `cloud: "China"` 停用，直到 OpenClaw 將 Graph 要求路由至 Azure China Graph 端點為止。

### 格式設定

Teams markdown 比 Slack 或 Discord 更受限制：

- 基本格式可正常運作：**粗體**、_斜體_、`code`、連結
- 複雜 markdown（表格、巢狀清單）可能無法正確呈現
- 投票和語意化呈現傳送支援 Adaptive Cards（見下方）

## 設定

關鍵設定（共享頻道模式請參閱 `/gateway/configuration`）：

- `channels.msteams.enabled`：啟用/停用此頻道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：Bot 認證。
- `channels.msteams.cloud`：Teams SDK 雲端環境（`Public`、`USGov`、`USGovDoD` 或 `China`；預設為 `Public`）。對於 USGov/DoD SDK 雲端，請搭配 `serviceUrl` 設定；China 使用 SDK 預設值和已儲存的 Azure China Bot Framework 交談參照，且 Graph 支援的輔助工具會停用，直到實作 Azure China Graph 路由為止。
- `channels.msteams.serviceUrl`：SDK 主動操作的 Bot Connector 服務 URL 邊界。公用雲端使用 SDK 預設值；GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High 或 DoD 請設定此項。當已儲存交談參照來自 21Vianet 營運的 Teams 時，China 接受 Azure China Bot Framework channel 主機。
- `channels.msteams.webhook.port`（預設 `3978`）
- `channels.msteams.webhook.path`（預設 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）
- `channels.msteams.allowFrom`：DM 允許清單（建議使用 AAD 物件 ID）。當 Graph 存取可用時，精靈會在設定期間將名稱解析為 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：破窗切換，用於重新啟用可變的 UPN/顯示名稱比對，以及直接團隊/頻道名稱路由。
- `channels.msteams.textChunkLimit`：出站文字分段大小。
- `channels.msteams.chunkMode`：`length`（預設）或 `newline`，在依長度分段前先按空白行（段落邊界）分割。
- `channels.msteams.mediaAllowHosts`：入站附件主機允許清單（預設為 Microsoft/Teams 網域）。
- `channels.msteams.mediaAuthAllowHosts`：媒體重試時允許附加 Authorization 標頭的主機允許清單（預設為 Graph + Bot Framework 主機）。
- `channels.msteams.requireMention`：在頻道/群組中要求 @提及（預設為 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（請參閱[回覆樣式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每個團隊的覆寫。
- `channels.msteams.teams.<teamId>.requireMention`：每個團隊的覆寫。
- `channels.msteams.teams.<teamId>.tools`：當缺少頻道覆寫時使用的每個團隊預設工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：每個團隊、每個傳送者的預設工具政策覆寫（支援 `"*"` 萬用字元）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每個頻道的覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每個頻道的覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每個頻道的工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每個頻道、每個傳送者的工具政策覆寫（支援 `"*"` 萬用字元）。
- `toolsBySender` 鍵應使用明確前綴：
  `channel:`、`id:`、`e164:`、`username:`、`name:`（舊版無前綴鍵仍只會對應到 `id:`）。
- `channels.msteams.actions.memberInfo`：啟用或停用 Graph 支援的成員資訊動作（預設：當 Graph 認證可用時啟用）。
- `channels.msteams.authType`：驗證類型 - `"secret"`（預設）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 憑證檔案路徑（聯合 + 憑證驗證）。
- `channels.msteams.certificateThumbprint`：憑證指紋（選用，驗證不需要）。
- `channels.msteams.useManagedIdentity`：啟用受控身分驗證（聯合模式）。
- `channels.msteams.managedIdentityClientId`：使用者指派受控身分的用戶端 ID。
- `channels.msteams.sharePointSiteId`：群組聊天/頻道中檔案上傳使用的 SharePoint 網站 ID（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。

## 路由與工作階段

- 工作階段鍵遵循標準 agent 格式（請參閱 [/concepts/session](/zh-TW/concepts/session)）：
  - 私訊共用主要工作階段（`agent:<agentId>:<mainKey>`）。
  - 頻道/群組訊息使用交談 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回覆樣式：對話串與貼文

Teams 最近在相同的底層資料模型上導入了兩種頻道 UI 樣式：

| 樣式                    | 說明                                               | 建議的 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **貼文**（傳統）      | 訊息顯示為卡片，下方有對話串回覆 | `thread`（預設）       |
| **對話串**（類似 Slack） | 訊息以線性方式流動，更像 Slack                   | `top-level`              |

**問題：** Teams API 不會公開頻道使用哪種 UI 樣式。如果使用錯誤的 `replyStyle`：

- 在對話串樣式頻道中使用 `thread` → 回覆會彆扭地巢狀顯示
- 在貼文樣式頻道中使用 `top-level` → 回覆會顯示為獨立的頂層貼文，而不是在線程內

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

當 Bot 向頻道傳送回覆時，`replyStyle` 會從最具體的覆寫往下解析到預設值。第一個非 `undefined` 值勝出：

1. **每個頻道** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每個團隊** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全域** — `channels.msteams.replyStyle`
4. **隱含預設值** — 從 `requireMention` 衍生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果全域設定 `requireMention: false`，但沒有明確的 `replyStyle`，則在貼文樣式頻道中的提及會顯示為頂層貼文，即使入站訊息是對話串回覆也一樣。請在全域、團隊或頻道層級固定 `replyStyle: "thread"`，以避免意外。

### 保留對話串內容

當 `replyStyle: "thread"` 生效，且 Bot 是在頻道對話串內被 @提及時，OpenClaw 會將原始對話串根重新附加到出站交談參照（`19:…@thread.tacv2;messageid=<root>`），讓回覆落在同一個對話串內。這同時適用於即時（回合內）傳送，以及 Bot Framework 回合內容過期後進行的主動傳送（例如長時間執行的 agent、透過 `mcp__openclaw__message` 排入佇列的工具呼叫回覆）。

對話串根取自交談參照上已儲存的 `threadId`。早於 `threadId` 的舊版已儲存參照會退回使用 `activityId`（也就是最後為交談建立種子的任何入站活動），因此既有部署不需要重新建立種子即可繼續運作。

當 `replyStyle: "top-level"` 生效時，頻道討論串的傳入訊息會刻意以新的頂層貼文回覆，不會附加討論串後綴。這是 Threads 風格頻道的正確行為；如果你看到頂層貼文，但原本預期是討論串回覆，表示該頻道的 `replyStyle` 設定不正確。

## 附件與圖片

**目前限制：**

- **DM：** 圖片與檔案附件可透過 Teams 機器人檔案 API 運作。
- **頻道/群組：** 附件位於 M365 儲存空間（SharePoint/OneDrive）。網路鉤子承載資料只包含 HTML stub，不包含實際檔案位元組。**需要 Graph API 權限**才能下載頻道附件。
- 若要明確以檔案優先傳送，請使用 `action=upload-file` 搭配 `media` / `filePath` / `path`；選用的 `message` 會成為隨附文字/留言，而 `filename` 會覆寫上傳名稱。

若沒有 Graph 權限，含圖片的頻道訊息會以純文字形式接收（機器人無法存取圖片內容）。
預設情況下，OpenClaw 只會從 Microsoft/Teams 主機名稱下載媒體。可用 `channels.msteams.mediaAllowHosts` 覆寫（使用 `["*"]` 允許任何主機）。
授權標頭只會附加到 `channels.msteams.mediaAuthAllowHosts` 中的主機（預設為 Graph + Bot Framework 主機）。請保持此清單嚴格（避免多租戶後綴）。

## 在群組聊天中傳送檔案

機器人可以使用 FileConsentCard 流程（內建）在 DM 中傳送檔案。不過，**在群組聊天/頻道中傳送檔案**需要額外設定：

| 情境                     | 檔案傳送方式                                 | 所需設定                                      |
| ------------------------ | -------------------------------------------- | --------------------------------------------- |
| **DM**                   | FileConsentCard → 使用者接受 → 機器人上傳    | 開箱即用                                      |
| **群組聊天/頻道**        | 上傳至 SharePoint → 分享連結                 | 需要 `sharePointSiteId` + Graph 權限          |
| **圖片（任何情境）**     | Base64 編碼的行內內容                        | 開箱即用                                      |

### 為什麼群組聊天需要 SharePoint

機器人沒有個人的 OneDrive 磁碟機（`/me/drive` Graph API 端點不適用於應用程式身分）。若要在群組聊天/頻道中傳送檔案，機器人會上傳到 **SharePoint 網站**並建立分享連結。

### 設定

1. 在 Entra ID (Azure AD) → App Registration 中**新增 Graph API 權限**：
   - `Sites.ReadWrite.All` (Application) - 將檔案上傳到 SharePoint
   - `Chat.Read.All` (Application) - 選用，啟用每位使用者的分享連結

2. 為租戶**授與管理員同意**。

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

每位使用者分享更安全，因為只有聊天參與者能存取檔案。如果缺少 `Chat.Read.All` 權限，機器人會退回使用組織範圍分享。

### 後援行為

| 情境                                               | 結果                                             |
| -------------------------------------------------- | ------------------------------------------------ |
| 群組聊天 + 檔案 + 已設定 `sharePointSiteId`        | 上傳到 SharePoint，傳送分享連結                 |
| 群組聊天 + 檔案 + 沒有 `sharePointSiteId`          | 嘗試 OneDrive 上傳（可能失敗），只傳送文字      |
| 個人聊天 + 檔案                                   | FileConsentCard 流程（不需 SharePoint 即可運作） |
| 任何情境 + 圖片                                   | Base64 編碼的行內內容（不需 SharePoint 即可運作） |

### 檔案儲存位置

上傳的檔案會儲存在已設定 SharePoint 網站預設文件庫中的 `/OpenClawShared/` 資料夾。

## 投票（Adaptive Cards）

OpenClaw 會將 Teams 投票作為 Adaptive Cards 傳送（沒有原生 Teams 投票 API）。

- 命令列介面：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票會由閘道記錄在 `state/openclaw.sqlite` 下的 OpenClaw 外掛狀態 SQLite。
- 既有的 `msteams-polls.json` 檔案會由 `openclaw doctor --fix` 匯入，而不是由執行中的外掛匯入。
- 閘道必須保持在線才能記錄投票。
- 投票目前尚不會自動發布結果摘要，也尚未有支援的投票結果命令列介面。

## 展示卡片

使用 `message` 工具、命令列介面或一般回覆傳遞，將語意展示承載資料傳送給 Teams 使用者或對話。OpenClaw 會依據通用展示合約將其轉譯為 Teams Adaptive Cards。

`presentation` 參數接受語意區塊。提供 `presentation` 時，訊息文字是選用的。按鈕會轉譯為 Adaptive Card 提交或 URL 動作。Teams renderer 尚未原生支援選取選單，因此 OpenClaw 會在傳遞前將其降級為可讀文字。

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

**命令列介面：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

目標格式詳細資訊請參閱下方的[目標格式](#target-formats)。

## 目標格式

MSTeams 目標使用前綴來區分使用者與對話：

| 目標類型            | 格式                             | 範例                                                |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 使用者（依 ID）     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 使用者（依名稱）    | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群組/頻道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群組/頻道（原始）   | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`）   |

**命令列介面範例：**

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
若沒有 `user:` 前綴，名稱預設會解析為群組或團隊。以顯示名稱指定人員為目標時，請一律使用 `user:`。
</Note>

## 主動訊息

- 主動訊息只有在使用者互動**之後**才可能傳送，因為我們會在該時點儲存對話參照。
- 請參閱 `/gateway/configuration` 了解 `dmPolicy` 與允許清單管控。

## 團隊與頻道 ID（常見陷阱）

Teams URL 中的 `groupId` 查詢參數**不是**用於設定的團隊 ID。請改從 URL 路徑擷取 ID：

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

- Team key = `/team/` 之後的路徑區段（URL 解碼，例如 `19:Bk4j...@thread.tacv2`；較舊的租戶可能顯示 `@thread.skype`，這也有效）
- Channel key = `/channel/` 之後的路徑區段（URL 解碼）
- OpenClaw 路由請**忽略** `groupId` 查詢參數。它是 Microsoft Entra 群組 ID，不是傳入 Teams 活動中使用的 Bot Framework 對話 ID。

## 私人頻道

機器人在私人頻道中的支援有限：

| 功能                         | 標準頻道 | 私人頻道             |
| ---------------------------- | -------- | -------------------- |
| 機器人安裝                   | 是       | 有限                 |
| 即時訊息（網路鉤子）         | 是       | 可能無法運作         |
| RSC 權限                     | 是       | 行為可能不同         |
| @提及                        | 是       | 如果機器人可存取     |
| Graph API 歷史記錄           | 是       | 是（需權限）         |

**如果私人頻道無法運作的替代方案：**

1. 使用標準頻道進行機器人互動
2. 使用 DM - 使用者一律可以直接傳訊給機器人
3. 使用 Graph API 存取歷史記錄（需要 `ChannelMessage.Read.All`）

## 疑難排解

### 常見問題

- **圖片未顯示在頻道中：** 缺少 Graph 權限或管理員同意。重新安裝 Teams 應用程式，並完全結束/重新開啟 Teams。
- **頻道中沒有回應：** 預設需要提及；設定 `channels.msteams.requireMention=false` 或依團隊/頻道設定。
- **版本不符（Teams 仍顯示舊 manifest）：** 移除並重新新增應用程式，且完全結束 Teams 以重新整理。
- **網路鉤子傳回 401 Unauthorized：** 手動測試時若沒有 Azure JWT，這是預期結果，表示端點可達但驗證失敗。請使用 Azure Web Chat 正確測試。

### Manifest 上傳錯誤

- **"Icon file cannot be empty"：** manifest 參照了 0 位元組的圖示檔案。請建立有效的 PNG 圖示（`outline.png` 為 32x32，`color.png` 為 192x192）。
- **"webApplicationInfo.Id already in use"：** 應用程式仍安裝在其他團隊/聊天中。請先找到並解除安裝，或等待 5-10 分鐘讓變更傳播。
- **上傳時出現 "Something went wrong"：** 改透過 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上傳，開啟瀏覽器 DevTools (F12) → Network 分頁，並檢查回應本文中的實際錯誤。
- **Sideload 失敗：** 請嘗試使用 "Upload an app to your org's app catalog"，而不是 "Upload a custom app"；這通常可以繞過 sideload 限制。

### RSC 權限無法運作

1. 確認 `webApplicationInfo.id` 與你的 Bot 應用程式 ID 完全相符
2. 重新上傳應用程式，並在團隊/聊天中重新安裝
3. 檢查你的組織管理員是否封鎖了 RSC 權限
4. 確認你使用的是正確的範圍：團隊使用 `ChannelMessage.Read.Group`，群組聊天使用 `ChatMessage.Read.Chat`

## 參考資料

- [建立 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 設定指南
- [Teams 開發人員入口網站](https://dev.teams.microsoft.com/apps) - 建立/管理 Teams 應用程式
- [Teams 應用程式資訊清單結構描述](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收頻道訊息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 權限參考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams Bot 檔案處理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（頻道/群組需要 Graph）
- [主動傳訊](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用於 Bot 管理的 Teams 命令列介面

## 相關

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
