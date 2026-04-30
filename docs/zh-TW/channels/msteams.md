---
read_when:
    - 開發 Microsoft Teams 通道功能
summary: Microsoft Teams 機器人支援狀態、功能和設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T02:48:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

狀態：支援文字 + DM 附件；頻道/群組傳送檔案需要 `sharePointSiteId` + Graph 權限（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。投票會透過 Adaptive Cards 傳送。訊息動作會公開明確的 `upload-file`，用於檔案優先的傳送。

## 內建 Plugin

Microsoft Teams 在目前的 OpenClaw 版本中以內建 Plugin 提供，因此一般封裝建置不需要
另外安裝。

如果你使用的是較舊的建置，或是排除內建 Teams 的自訂安裝，
請在有發布時安裝目前的 npm 套件：

```bash
openclaw plugins install @openclaw/msteams
```

如果 npm 回報 OpenClaw 擁有的套件已被棄用，請使用目前封裝的
OpenClaw 建置，或在較新的 npm 套件發布前使用本機 checkout 路徑。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## 快速設定

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可用單一命令處理 Bot 註冊、manifest 建立與憑證產生。

**1. 安裝並登入**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI 目前為預覽版。命令與旗標可能會在不同版本之間變更。
</Note>

**2. 啟動通道**（Teams 無法連到 localhost）

如果尚未安裝並驗證 devtunnel CLI，請先完成安裝與驗證（[入門指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
需要 `--allow-anonymous`，因為 Teams 無法使用 devtunnels 進行驗證。每個傳入的 Bot 請求仍會由 Teams SDK 自動驗證。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但這些可能每次工作階段都會變更 URL）。

**3. 建立應用程式**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

這個單一命令會：

- 建立 Entra ID (Azure AD) 應用程式
- 產生用戶端密碼
- 建置並上傳 Teams app manifest（含圖示）
- 註冊 Bot（預設由 Teams 管理，不需要 Azure 訂閱）

輸出會顯示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和 **Teams App ID**，請記下這些值以供後續步驟使用。它也會提供直接在 Teams 中安裝應用程式的選項。

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

`teams app create` 會提示你安裝應用程式，請選取「Install in Teams」。如果你略過了，稍後可以取得連結：

```bash
teams app get <teamsAppId> --install-link
```

**6. 驗證一切正常運作**

```bash
teams app doctor <teamsAppId>
```

這會針對 Bot 註冊、AAD 應用程式設定、manifest 有效性與 SSO 設定執行診斷。

對於生產部署，請考慮使用[同盟驗證](/zh-TW/channels/msteams#federated-authentication-certificate-plus-managed-identity)（憑證或受控身分）取代用戶端密碼。

<Note>
群組聊天預設會被封鎖（`channels.msteams.groupPolicy: "allowlist"`）。若要允許群組回覆，請設定 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允許任何成員（仍受提及控管）。
</Note>

## 目標

- 透過 Teams DM、群組聊天或頻道與 OpenClaw 對話。
- 保持路由具決定性：回覆一律回到原始抵達的頻道。
- 預設使用安全的頻道行為（除非另有設定，否則需要提及）。

## 設定寫入

預設允許 Microsoft Teams 寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

使用以下設定停用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 存取控制（DM + 群組）

**DM 存取**

- 預設：`channels.msteams.dmPolicy = "pairing"`。未知傳送者會被忽略，直到核准為止。
- `channels.msteams.allowFrom` 應使用穩定的 AAD 物件 ID。
- 不要依賴 UPN/顯示名稱比對來做允許清單，因為它們可能變更。OpenClaw 預設會停用直接名稱比對；若要啟用，請明確選擇使用 `channels.msteams.dangerouslyAllowNameMatching: true`。
- 當憑證允許時，精靈可透過 Microsoft Graph 將名稱解析為 ID。

**群組存取**

- 預設：`channels.msteams.groupPolicy = "allowlist"`（除非新增 `groupAllowFrom`，否則會封鎖）。未設定時，可使用 `channels.defaults.groupPolicy` 覆寫預設值。
- `channels.msteams.groupAllowFrom` 控制哪些傳送者可在群組聊天/頻道中觸發（會退回使用 `channels.msteams.allowFrom`）。
- 設定 `groupPolicy: "open"` 以允許任何成員（預設仍受提及控管）。
- 若要不允許**任何頻道**，請設定 `channels.msteams.groupPolicy: "disabled"`。

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

- 在 `channels.msteams.teams` 下列出團隊和頻道，以限定群組/頻道回覆範圍。
- 金鑰應使用 Teams 連結中的穩定 Teams 對話 ID，而不是可變的顯示名稱。
- 當 `groupPolicy="allowlist"` 且存在 teams 允許清單時，只接受列出的團隊/頻道（受提及控管）。
- 設定精靈接受 `Team/Channel` 項目，並會替你儲存。
- 啟動時，OpenClaw 會將團隊/頻道和使用者允許清單名稱解析為 ID（當 Graph 權限允許時）
  並記錄對應關係；未解析的團隊/頻道名稱會依輸入保留，但預設會在路由時忽略，除非已啟用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

如果你無法使用 Teams CLI，可以透過 Azure Portal 手動設定 Bot。

### 運作方式

1. 確認 Microsoft Teams Plugin 可用（目前版本已內建）。
2. 建立 **Azure Bot**（App ID + 密碼 + tenant ID）。
3. 建置參照該 Bot 且包含下列 RSC 權限的 **Teams app package**。
4. 將 Teams 應用程式上傳/安裝到團隊中（或針對 DM 使用個人範圍）。
5. 在 `~/.openclaw/openclaw.json`（或環境變數）中設定 `msteams` 並啟動 Gateway。
6. Gateway 預設會在 `/api/messages` 監聽 Bot Framework Webhook 流量。

### 步驟 1：建立 Azure Bot

1. 前往[建立 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填寫 **Basics** 分頁：

   | 欄位 | 值 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | 你的 Bot 名稱，例如 `openclaw-msteams`（必須唯一） |
   | **Subscription** | 選取你的 Azure 訂閱 |
   | **Resource group** | 建立新的或使用現有的 |
   | **Pricing tier** | 開發/測試使用 **Free** |
   | **Type of App** | **Single Tenant**（建議，請參閱下方注意事項） |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
2025-07-31 之後已棄用建立新的多租用戶 Bot。新 Bot 請使用 **Single Tenant**。
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
2. 將 **Messaging endpoint** 設定為你的 Webhook URL：
   - 生產：`https://your-domain.com/api/messages`
   - 本機開發：使用通道（請參閱下方[本機開發](#local-development-tunneling)）

### 步驟 4：啟用 Teams Channel

1. 在 Azure Bot → **Channels**
2. 按一下 **Microsoft Teams** → Configure → Save
3. 接受服務條款

### 步驟 5：建置 Teams App Manifest

- 包含 `bot` 項目，且 `botId = <App ID>`。
- 範圍：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人範圍檔案處理所需）。
- 新增 RSC 權限（請參閱 [RSC 權限](#current-teams-rsc-permissions-manifest)）。
- 建立圖示：`outline.png` (32x32) 和 `color.png` (192x192)。
- 將三個檔案壓縮在一起：`manifest.json`、`outline.png`、`color.png`。

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

當 Plugin 可用，且 `msteams` 設定存在並包含憑證時，Teams 頻道會自動啟動。

</details>

## 同盟驗證（憑證加受控身分）

> 已於 2026.4.11 新增

對於生產部署，OpenClaw 支援**同盟驗證**，作為比用戶端密碼更安全的替代方案。可使用兩種方法：

### 選項 A：憑證型驗證

使用在你的 Entra ID 應用程式註冊中註冊的 PEM 憑證。

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

### 選項 B：Azure Managed Identity

使用 Azure Managed Identity 進行無密碼驗證。這非常適合部署在 Azure 基礎架構（AKS、App Service、Azure VM）且可使用受控身分的情境。

**運作方式：**

1. Bot pod/VM 具有受控身分（系統指派或使用者指派）。
2. **同盟身分憑證**會將受控身分連結至 Entra ID 應用程式註冊。
3. 執行階段，OpenClaw 使用 `@azure/identity` 從 Azure IMDS 端點（`169.254.169.254`）取得權杖。
4. 權杖會傳遞給 Teams SDK 以進行 Bot 驗證。

**先決條件：**

- 已啟用受控身分的 Azure 基礎架構（AKS workload identity、App Service、VM）
- 已在 Entra ID 應用程式註冊中建立同盟身分憑證
- pod/VM 可連線至 IMDS（`169.254.169.254:80`）

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

**設定（系統指派的受控身分）：**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（僅限使用者指派）

### AKS 工作負載身分設定

對於使用工作負載身分的 AKS 部署：

1. 在你的 AKS 叢集上**啟用工作負載身分**。
2. 在 Entra ID 應用程式註冊上**建立同盟身分認證**：

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

4. 為工作負載身分注入**標記 Pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **確保可存取** IMDS（`169.254.169.254`）網路；如果使用 NetworkPolicy，請新增一條輸出規則，允許連到 `169.254.169.254/32` 的 80 連接埠。

### 驗證類型比較

| 方法                 | 設定                                           | 優點                     | 缺點                         |
| -------------------- | ---------------------------------------------- | ------------------------ | ---------------------------- |
| **用戶端密碼**       | `appPassword`                                  | 設定簡單                 | 需要輪替密碼，安全性較低     |
| **憑證**             | `authType: "federated"` + `certificatePath`    | 不透過網路共用密碼       | 憑證管理成本                 |
| **受控身分**         | `authType: "federated"` + `useManagedIdentity` | 無密碼，無需管理密碼     | 需要 Azure 基礎架構          |

**預設行為：** 未設定 `authType` 時，OpenClaw 預設使用用戶端密碼驗證。現有設定不需變更即可繼續運作。

## 本機開發（通道）

Teams 無法連到 `localhost`。請使用持久的開發通道，讓你的 URL 在不同工作階段中保持不變：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每個工作階段變更）。

如果你的通道 URL 變更，請更新端點：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 測試 Bot

**執行診斷：**

```bash
teams app doctor <teamsAppId>
```

一次檢查 Bot 註冊、AAD 應用程式、資訊清單和 SSO 設定。

**傳送測試訊息：**

1. 安裝 Teams 應用程式（使用 `teams app get <id> --install-link` 取得的安裝連結）
2. 在 Teams 中找到 Bot 並傳送 DM
3. 檢查 Gateway 記錄中的傳入活動

## 環境變數

所有設定鍵也可以改用環境變數設定：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（選用：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（同盟 + 憑證）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（選用，驗證不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（同盟 + 受控身分）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（僅限使用者指派的 MI）

## 成員資訊動作

OpenClaw 為 Microsoft Teams 提供由 Graph 支援的 `member-info` 動作，讓代理程式和自動化流程能直接從 Microsoft Graph 解析頻道成員詳細資料（顯示名稱、電子郵件、角色）。

需求：

- `Member.Read.Group` RSC 權限（已在建議的資訊清單中）
- 跨團隊查詢：具有系統管理員同意的 `User.Read.All` Graph 應用程式權限

此動作由 `channels.msteams.actions.memberInfo` 控制（預設：Graph 認證可用時啟用）。

## 歷史脈絡

- `channels.msteams.historyLimit` 控制要將多少最近的頻道/群組訊息包進提示詞。
- 回退至 `messages.groupChat.historyLimit`。設定為 `0` 可停用（預設 50）。
- 擷取的執行緒歷史會依傳送者允許清單（`allowFrom` / `groupAllowFrom`）過濾，因此執行緒脈絡種子只包含來自允許傳送者的訊息。
- 引用附件脈絡（從 Teams 回覆 HTML 衍生的 `ReplyTo*`）目前會照收到的內容傳遞。
- 換句話說，允許清單會控管誰能觸發代理程式；目前只有特定補充脈絡路徑會被過濾。
- DM 歷史可透過 `channels.msteams.dmHistoryLimit`（使用者回合）限制。個別使用者覆寫：`channels.msteams.dms["<user_id>"].historyLimit`。

## 目前的 Teams RSC 權限（資訊清單）

以下是我們 Teams 應用程式資訊清單中**現有的 resourceSpecific 權限**。它們只適用於安裝該應用程式的團隊/聊天內。

**適用於頻道（團隊範圍）：**

- `ChannelMessage.Read.Group`（Application）- 接收所有頻道訊息，無需 @提及
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**適用於群組聊天：**

- `ChatMessage.Read.Chat`（Application）- 接收所有群組聊天訊息，無需 @提及

若要透過 Teams CLI 新增 RSC 權限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 資訊清單範例（已遮蔽）

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
- `bots[].scopes` 必須包含你計畫使用的介面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是在個人範圍處理檔案所必需的。
- 如果你想要頻道流量，`authorization.permissions.resourceSpecific` 必須包含頻道讀取/傳送權限。

### 更新現有應用程式

若要更新已安裝的 Teams 應用程式（例如新增 RSC 權限）：

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新後，請在每個團隊中重新安裝應用程式，讓新權限生效，並**完全結束並重新啟動 Teams**（不要只是關閉視窗）以清除快取的應用程式中繼資料。

<details>
<summary>手動更新資訊清單（不使用 CLI）</summary>

1. 使用新設定更新你的 `manifest.json`
2. **遞增 `version` 欄位**（例如 `1.0.0` → `1.1.0`）
3. 將資訊清單與圖示（`manifest.json`、`outline.png`、`color.png`）**重新壓縮**
4. 上傳新的 zip：
   - **Teams 管理中心：** Teams 應用程式 → 管理應用程式 → 找到你的應用程式 → 上傳新版本
   - **側載：** 在 Teams 中 → 應用程式 → 管理你的應用程式 → 上傳自訂應用程式

</details>

## 功能：僅 RSC 與 Graph

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
| **即時訊息**           | 是（透過 Webhook）   | 否（僅能輪詢）                      |
| **歷史訊息**           | 否                   | 是（可以查詢歷史）                  |
| **設定複雜度**         | 僅需應用程式資訊清單 | 需要系統管理員同意 + 權杖流程       |
| **離線時可用**         | 否（必須執行中）     | 是（隨時查詢）                      |

**重點：** RSC 用於即時監聽；Graph API 用於歷史存取。若要在離線期間補抓漏掉的訊息，你需要使用具備 `ChannelMessage.Read.All` 的 Graph API（需要系統管理員同意）。

## 啟用 Graph 的媒體 + 歷史（頻道必要）

如果你需要**頻道**中的圖片/檔案，或想擷取**訊息歷史**，你必須啟用 Microsoft Graph 權限並授與系統管理員同意。

1. 在 Entra ID（Azure AD）**應用程式註冊**中，新增 Microsoft Graph **應用程式權限**：
   - `ChannelMessage.Read.All`（頻道附件 + 歷史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群組聊天）
2. 為租用戶**授與系統管理員同意**。
3. 提升 Teams 應用程式**資訊清單版本**，重新上傳，並**在 Teams 中重新安裝應用程式**。
4. **完全結束並重新啟動 Teams**，以清除快取的應用程式中繼資料。

**使用者提及的額外權限：** 對話中的使用者 @提及可直接運作。不過，如果你想動態搜尋並提及**不在目前對話中**的使用者，請新增 `User.Read.All`（Application）權限並授與系統管理員同意。

## 已知限制

### Webhook 逾時

Teams 透過 HTTP Webhook 傳遞訊息。如果處理時間太長（例如 LLM 回應很慢），你可能會看到：

- Gateway 逾時
- Teams 重試訊息（造成重複）
- 回覆被丟棄

OpenClaw 會透過快速返回並主動傳送回覆來處理此情況，但非常慢的回應仍可能造成問題。

### 格式設定

Teams Markdown 比 Slack 或 Discord 更受限：

- 基本格式可運作：**粗體**、_斜體_、`code`、連結
- 複雜 Markdown（表格、巢狀清單）可能無法正確呈現
- 支援使用 Adaptive Cards 傳送投票與語意呈現（見下方）

## 設定

主要設定（共用通道模式請參閱 `/gateway/configuration`）：

- `channels.msteams.enabled`：啟用/停用此通道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：機器人認證資訊。
- `channels.msteams.webhook.port`（預設 `3978`）
- `channels.msteams.webhook.path`（預設 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）
- `channels.msteams.allowFrom`：DM 允許清單（建議使用 AAD 物件 ID）。設定精靈會在可用 Graph 存取權時，於設定期間將名稱解析為 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：緊急切換開關，用於重新啟用可變的 UPN/顯示名稱比對，以及直接依團隊/通道名稱路由。
- `channels.msteams.textChunkLimit`：外送文字區塊大小。
- `channels.msteams.chunkMode`：`length`（預設）或 `newline`，在依長度切分前先依空白行（段落邊界）切分。
- `channels.msteams.mediaAllowHosts`：入站附件主機允許清單（預設為 Microsoft/Teams 網域）。
- `channels.msteams.mediaAuthAllowHosts`：在媒體重試時允許附加 Authorization 標頭的主機允許清單（預設為 Graph + Bot Framework 主機）。
- `channels.msteams.requireMention`：在通道/群組中要求 @mention（預設為 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（請參閱[回覆樣式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每個團隊的覆寫。
- `channels.msteams.teams.<teamId>.requireMention`：每個團隊的覆寫。
- `channels.msteams.teams.<teamId>.tools`：當缺少通道覆寫時使用的預設每團隊工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：預設每團隊、每寄件者工具政策覆寫（支援 `"*"` 萬用字元）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每個通道的覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每個通道的覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每個通道的工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每個通道、每寄件者工具政策覆寫（支援 `"*"` 萬用字元）。
- `toolsBySender` 鍵應使用明確前綴：
  `id:`、`e164:`、`username:`、`name:`（舊版無前綴鍵仍只會對應到 `id:`）。
- `channels.msteams.actions.memberInfo`：啟用或停用由 Graph 支援的成員資訊動作（預設：Graph 認證資訊可用時啟用）。
- `channels.msteams.authType`：驗證類型 — `"secret"`（預設）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 憑證檔案路徑（federated + certificate auth）。
- `channels.msteams.certificateThumbprint`：憑證指紋（選用，驗證不需要）。
- `channels.msteams.useManagedIdentity`：啟用受控識別驗證（federated 模式）。
- `channels.msteams.managedIdentityClientId`：使用者指派受控識別的用戶端 ID。
- `channels.msteams.sharePointSiteId`：用於群組聊天/通道檔案上傳的 SharePoint 網站 ID（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。

## 路由與工作階段

- 工作階段鍵遵循標準代理程式格式（請參閱 [/concepts/session](/zh-TW/concepts/session)）：
  - 直接訊息共用主工作階段（`agent:<agentId>:<mainKey>`）。
  - 通道/群組訊息使用 conversation id：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回覆樣式：討論串與貼文

Teams 最近在相同的底層資料模型上引入了兩種通道 UI 樣式：

| 樣式                     | 說明                                           | 建議的 `replyStyle` |
| ------------------------ | ---------------------------------------------- | ------------------- |
| **貼文**（傳統）         | 訊息顯示為卡片，下方有討論串回覆               | `thread`（預設）    |
| **討論串**（類 Slack）   | 訊息以線性方式流動，更像 Slack                 | `top-level`         |

**問題：** Teams API 不會公開通道使用哪一種 UI 樣式。如果使用錯誤的 `replyStyle`：

- 在討論串樣式通道中使用 `thread` → 回覆會顯得彆扭地巢狀化
- 在貼文樣式通道中使用 `top-level` → 回覆會顯示為獨立的頂層貼文，而不是在討論串內

**解決方案：** 根據通道的設定方式，逐通道設定 `replyStyle`：

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

## 附件與圖片

**目前限制：**

- **DM：** 圖片與檔案附件可透過 Teams 機器人檔案 API 運作。
- **通道/群組：** 附件位於 M365 儲存空間（SharePoint/OneDrive）。Webhook 承載內容只包含 HTML stub，而非實際檔案位元組。**必須具備 Graph API 權限**才能下載通道附件。
- 若要明確傳送以檔案優先的內容，請使用 `action=upload-file` 搭配 `media` / `filePath` / `path`；選用的 `message` 會成為隨附文字/留言，而 `filename` 會覆寫上傳名稱。

沒有 Graph 權限時，含圖片的通道訊息會以純文字形式接收（機器人無法存取圖片內容）。
預設情況下，OpenClaw 只會從 Microsoft/Teams 主機名稱下載媒體。可使用 `channels.msteams.mediaAllowHosts` 覆寫（使用 `["*"]` 允許任何主機）。
Authorization 標頭只會附加至 `channels.msteams.mediaAuthAllowHosts` 中的主機（預設為 Graph + Bot Framework 主機）。請讓此清單保持嚴格（避免多租戶尾碼）。

## 在群組聊天中傳送檔案

機器人可以使用 FileConsentCard 流程（內建）在 DM 中傳送檔案。不過，**在群組聊天/通道中傳送檔案**需要額外設定：

| 情境                     | 檔案傳送方式                                | 所需設定                                        |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → 使用者接受 → 機器人上傳   | 可直接運作                                      |
| **群組聊天/通道**        | 上傳至 SharePoint → 分享連結                | 需要 `sharePointSiteId` + Graph 權限            |
| **圖片（任何情境）**     | Base64 編碼內嵌                             | 可直接運作                                      |

### 為什麼群組聊天需要 SharePoint

機器人沒有個人 OneDrive 磁碟機（`/me/drive` Graph API 端點不適用於應用程式身分）。若要在群組聊天/通道中傳送檔案，機器人會上傳至 **SharePoint 網站**並建立分享連結。

### 設定

1. 在 Entra ID (Azure AD) → App Registration 中**新增 Graph API 權限**：
   - `Sites.ReadWrite.All`（Application）- 將檔案上傳至 SharePoint
   - `Chat.Read.All`（Application）- 選用，啟用每使用者分享連結

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

| 權限                                    | 分享行為                                                 |
| --------------------------------------- | -------------------------------------------------------- |
| 僅 `Sites.ReadWrite.All`                | 組織範圍分享連結（組織中的任何人都可存取）               |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 每使用者分享連結（只有聊天成員可存取）                   |

每使用者分享更安全，因為只有聊天參與者可以存取檔案。如果缺少 `Chat.Read.All` 權限，機器人會退回使用組織範圍分享。

### 後援行為

| 情境                                             | 結果                                             |
| ------------------------------------------------ | ------------------------------------------------ |
| 群組聊天 + 檔案 + 已設定 `sharePointSiteId`      | 上傳至 SharePoint，傳送分享連結                  |
| 群組聊天 + 檔案 + 未設定 `sharePointSiteId`      | 嘗試 OneDrive 上傳（可能失敗），只傳送文字       |
| 個人聊天 + 檔案                                 | FileConsentCard 流程（不需要 SharePoint 即可運作） |
| 任何情境 + 圖片                                 | Base64 編碼內嵌（不需要 SharePoint 即可運作）    |

### 檔案儲存位置

上傳的檔案會儲存在已設定 SharePoint 網站預設文件庫中的 `/OpenClawShared/` 資料夾。

## 投票（Adaptive Cards）

OpenClaw 會將 Teams 投票傳送為 Adaptive Cards（沒有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 記錄在 `~/.openclaw/msteams-polls.json`。
- Gateway 必須保持線上才能記錄投票。
- 投票尚不會自動發布結果摘要（如有需要，請檢查儲存檔案）。

## 呈現卡片

使用 `message` 工具或 CLI，將語意呈現承載內容傳送給 Teams 使用者或對話。OpenClaw 會從通用呈現合約將其呈現為 Teams Adaptive Cards。

`presentation` 參數接受語意區塊。提供 `presentation` 時，訊息文字為選用。

**代理程式工具：**

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

目標格式詳細資訊請參閱下方的[目標格式](#target-formats)。

## 目標格式

MSTeams 目標使用前綴來區分使用者與對話：

| 目標類型            | 格式                             | 範例                                                |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 使用者（依 ID）     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 使用者（依名稱）   | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群組/通道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群組/通道（原始）  | `<conversation-id>`              | `19:abc123...@thread.tacv2`（若包含 `@thread`）     |

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

**Agent 工具範例：**

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
若沒有 `user:` 前綴，名稱預設會解析為群組或團隊。依顯示名稱指定人員時，請一律使用 `user:`。
</Note>

## 主動訊息

- 只有在使用者互動**之後**，才可能傳送主動訊息，因為我們會在該時間點儲存對話參照。
- 請參閱 `/gateway/configuration` 以了解 `dmPolicy` 和允許清單控管。

## 團隊和頻道 ID（常見陷阱）

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

**設定用：**

- 團隊鍵 = `/team/` 之後的路徑區段（URL 解碼後，例如 `19:Bk4j...@thread.tacv2`；較舊的租用戶可能會顯示 `@thread.skype`，這也有效）
- 頻道鍵 = `/channel/` 之後的路徑區段（URL 解碼後）
- 對 OpenClaw 路由來說，請**忽略** `groupId` 查詢參數。它是 Microsoft Entra 群組 ID，不是傳入 Teams 活動中使用的 Bot Framework 對話 ID。

## 私人頻道

機器人在私人頻道中的支援有限：

| 功能                         | 標準頻道 | 私人頻道             |
| ---------------------------- | -------- | -------------------- |
| 機器人安裝                   | 是       | 有限                 |
| 即時訊息 (Webhook)           | 是       | 可能無法運作         |
| RSC 權限                     | 是       | 行為可能不同         |
| @提及                        | 是       | 如果機器人可存取     |
| Graph API 歷史記錄           | 是       | 是（具備權限時）     |

**如果私人頻道無法運作的替代方案：**

1. 使用標準頻道進行機器人互動
2. 使用私訊 - 使用者一律可以直接傳訊息給機器人
3. 使用 Graph API 存取歷史記錄（需要 `ChannelMessage.Read.All`）

## 疑難排解

### 常見問題

- **圖片未顯示在頻道中：** 缺少 Graph 權限或管理員同意。重新安裝 Teams 應用程式，並完全結束/重新開啟 Teams。
- **頻道中沒有回應：** 預設需要提及；設定 `channels.msteams.requireMention=false`，或依團隊/頻道設定。
- **版本不符（Teams 仍顯示舊資訊清單）：** 移除並重新新增應用程式，然後完全結束 Teams 以重新整理。
- **Webhook 傳回 401 Unauthorized：** 手動測試時若沒有 Azure JWT，這是預期行為，表示端點可連線但驗證失敗。請使用 Azure Web Chat 正確測試。

### 資訊清單上傳錯誤

- **「Icon file cannot be empty」：** 資訊清單參照了 0 位元組的圖示檔。建立有效的 PNG 圖示（`outline.png` 為 32x32，`color.png` 為 192x192）。
- **「webApplicationInfo.Id already in use」：** 應用程式仍安裝在其他團隊/聊天中。先找到並解除安裝，或等待 5-10 分鐘讓變更傳播。
- **上傳時出現「Something went wrong」：** 改用 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上傳，開啟瀏覽器 DevTools (F12) → Network 分頁，並檢查回應本文中的實際錯誤。
- **側載失敗：** 嘗試使用「Upload an app to your org's app catalog」，而不是「Upload a custom app」；這通常可以避開側載限制。

### RSC 權限無法運作

1. 確認 `webApplicationInfo.id` 與機器人的 App ID 完全相符
2. 重新上傳應用程式，並在團隊/聊天中重新安裝
3. 檢查你的組織管理員是否封鎖了 RSC 權限
4. 確認你使用正確的範圍：團隊使用 `ChannelMessage.Read.Group`，群組聊天使用 `ChatMessage.Read.Chat`

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

- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
