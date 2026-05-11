---
read_when:
    - 正在處理 Microsoft Teams 通道功能
summary: Microsoft Teams 機器人支援狀態、功能與設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

狀態：支援文字 + DM 附件；頻道/群組檔案傳送需要 `sharePointSiteId` + Graph 權限（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。投票會透過 Adaptive Cards 傳送。訊息動作會公開明確的 `upload-file`，用於檔案優先傳送。

## 內建 Plugin

Microsoft Teams 在目前的 OpenClaw 版本中隨附為內建 Plugin，因此一般封裝建置不需要
另外安裝。

如果你使用較舊的建置，或是不包含內建 Teams 的自訂安裝，
請直接安裝 npm 套件：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸套件即可跟隨目前官方發行標籤。只有在需要可重現安裝時，
才釘選確切版本。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細資訊：[Plugin](/zh-TW/tools/plugin)

## 快速設定

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 會用單一命令處理 bot 註冊、manifest 建立和憑證產生。

**1. 安裝並登入**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI 目前處於 preview。命令和旗標可能會在不同版本間變更。
</Note>

**2. 啟動通道**（Teams 無法連到 localhost）

如果你還沒有安裝並驗證 devtunnel CLI，請先完成設定（[入門指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
需要 `--allow-anonymous`，因為 Teams 無法透過 devtunnels 進行驗證。每個傳入的 bot 請求仍會由 Teams SDK 自動驗證。
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
- 產生 client secret
- 建置並上傳 Teams app manifest（含圖示）
- 註冊 bot（預設由 Teams 管理 - 不需要 Azure 訂閱）

輸出會顯示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和 **Teams App ID** - 請記下這些，供後續步驟使用。它也會提供直接在 Teams 中安裝應用程式的選項。

**4. 使用輸出的憑證設定 OpenClaw**：

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

`teams app create` 會提示你安裝應用程式 - 選取「Install in Teams」。如果你略過了，之後可以取得連結：

```bash
teams app get <teamsAppId> --install-link
```

**6. 驗證一切正常運作**

```bash
teams app doctor <teamsAppId>
```

這會針對 bot 註冊、AAD app 設定、manifest 有效性和 SSO 設定執行診斷。

對於生產部署，請考慮使用[聯邦驗證](/zh-TW/channels/msteams#federated-authentication-certificate-plus-managed-identity)（憑證或受控身分）取代 client secret。

<Note>
群組聊天預設會被封鎖（`channels.msteams.groupPolicy: "allowlist"`）。若要允許群組回覆，請設定 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允許任何成員（需要提及才會觸發）。
</Note>

## 目標

- 透過 Teams DM、群組聊天或頻道與 OpenClaw 對話。
- 保持路由具決定性：回覆一律回到訊息來源頻道。
- 預設採用安全的頻道行為（除非另行設定，否則需要提及）。

## 設定寫入

預設情況下，Microsoft Teams 允許寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

使用以下方式停用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 存取控制（DM + 群組）

**DM 存取**

- 預設：`channels.msteams.dmPolicy = "pairing"`。未知寄件者會被忽略，直到獲得核准。
- `channels.msteams.allowFrom` 應使用穩定的 AAD 物件 ID，或靜態寄件者存取群組，例如 `accessGroup:core-team`。
- 不要依賴 UPN/顯示名稱比對來建立允許清單 - 它們可能會變更。OpenClaw 預設會停用直接名稱比對；請使用 `channels.msteams.dangerouslyAllowNameMatching: true` 明確選用。
- 當憑證允許時，精靈可透過 Microsoft Graph 將名稱解析為 ID。

**群組存取**

- 預設：`channels.msteams.groupPolicy = "allowlist"`（除非你加入 `groupAllowFrom`，否則會封鎖）。未設定時，可使用 `channels.defaults.groupPolicy` 覆寫預設值。
- `channels.msteams.groupAllowFrom` 控制哪些寄件者或靜態寄件者存取群組可以在群組聊天/頻道中觸發（會 fallback 至 `channels.msteams.allowFrom`）。
- 設定 `groupPolicy: "open"` 可允許任何成員（預設仍需要提及才會觸發）。
- 若要不允許**任何頻道**，請設定 `channels.msteams.groupPolicy: "disabled"`。

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

- 透過在 `channels.msteams.teams` 下列出 teams 和 channels，限制群組/頻道回覆範圍。
- Key 應使用 Teams 連結中的穩定 Teams conversation ID，而不是可變的顯示名稱。
- 當 `groupPolicy="allowlist"` 且存在 teams 允許清單時，只接受列出的 teams/channels（需要提及才會觸發）。
- 設定精靈接受 `Team/Channel` 項目，並為你儲存。
- 啟動時，OpenClaw 會將 team/channel 和使用者允許清單名稱解析為 ID（當 Graph 權限允許時）
  並記錄對應關係；未解析的 team/channel 名稱會以輸入形式保留，但預設會在路由中忽略，除非啟用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

1. 確認 Microsoft Teams Plugin 可用（目前版本已內建）。
2. 建立 **Azure Bot**（App ID + secret + tenant ID）。
3. 建置參照該 bot 並包含下方 RSC 權限的 **Teams app package**。
4. 將 Teams app 上傳/安裝到 team（或用於 DM 的個人範圍）。
5. 在 `~/.openclaw/openclaw.json`（或 env vars）中設定 `msteams`，並啟動 Gateway。
6. Gateway 預設會在 `/api/messages` 監聽 Bot Framework Webhook 流量。

### 步驟 1：建立 Azure Bot

1. 前往[建立 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填寫 **Basics** 分頁：

   | 欄位               | 值                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的 bot 名稱，例如 `openclaw-msteams`（必須唯一）       |
   | **Subscription**   | 選取你的 Azure 訂閱                                     |
   | **Resource group** | 建立新的或使用現有的                                   |
   | **Pricing tier**   | 開發/測試使用 **Free**                                  |
   | **Type of App**    | **Single Tenant**（建議 - 請參閱下方注意事項）          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
建立新的多租戶 bot 已在 2025-07-31 之後被棄用。新 bot 請使用 **Single Tenant**。
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
2. 將 **Messaging endpoint** 設定為你的 webhook URL：
   - 生產環境：`https://your-domain.com/api/messages`
   - 本機開發：使用通道（請參閱下方[本機開發](#local-development-tunneling)）

### 步驟 4：啟用 Teams Channel

1. 在 Azure Bot → **Channels**
2. 按一下 **Microsoft Teams** → Configure → Save
3. 接受 Terms of Service

### 步驟 5：建置 Teams App Manifest

- 包含一個 `bot` 項目，且 `botId = <App ID>`。
- 範圍：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人範圍檔案處理所需）。
- 加入 RSC 權限（請參閱[目前的 Teams RSC 權限 manifest](#current-teams-rsc-permissions-manifest)）。
- 建立圖示：`outline.png` (32x32) 和 `color.png` (192x192)。
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

當 Plugin 可用且 `msteams` 設定存在並包含憑證時，Teams channel 會自動啟動。

</details>

## 聯邦驗證（憑證加受控身分）

> 於 2026.4.11 新增

對於生產部署，OpenClaw 支援**聯邦驗證**，作為 client secret 的更安全替代方案。有兩種方法可用：

### 選項 A：憑證式驗證

使用已註冊到你的 Entra ID app registration 的 PEM 憑證。

**設定：**

1. 產生或取得憑證（含私密金鑰的 PEM 格式）。
2. 在 Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上傳公開憑證。

**設定檔：**

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

**Env vars：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 選項 B：Azure Managed Identity

使用 Azure Managed Identity 進行無密碼驗證。這很適合部署在 Azure 基礎架構（AKS、App Service、Azure VM）且可用受控身分的環境。

**運作方式：**

1. bot pod/VM 具有受控身分（系統指派或使用者指派）。
2. **federated identity credential** 會將受控身分連結到 Entra ID app registration。
3. 執行階段，OpenClaw 會使用 `@azure/identity` 從 Azure IMDS endpoint (`169.254.169.254`) 取得 token。
4. token 會傳遞給 Teams SDK 進行 bot 驗證。

**先決條件：**

- 已啟用受控身分的 Azure 基礎架構（AKS workload identity、App Service、VM）
- 已在 Entra ID app registration 上建立 federated identity credential
- pod/VM 可透過網路存取 IMDS (`169.254.169.254:80`)

**設定檔（系統指派受控身分）：**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（僅限使用者指派）

### AKS 工作負載識別設定

適用於使用工作負載識別的 AKS 部署：

1. 在你的 AKS 叢集上**啟用工作負載識別**。
2. 在 Entra ID 應用程式註冊上**建立同盟識別認證**：

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

4. 為工作負載識別注入**標記 Pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **確保網路可存取** IMDS（`169.254.169.254`）- 如果使用 NetworkPolicy，請新增一條輸出規則，允許連線到連接埠 80 上的 `169.254.169.254/32`。

### 驗證類型比較

| 方法 | 設定 | 優點 | 缺點 |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **用戶端密鑰** | `appPassword` | 設定簡單 | 需要輪替密鑰，安全性較低 |
| **憑證** | `authType: "federated"` + `certificatePath` | 不透過網路共用密鑰 | 憑證管理負擔 |
| **受控識別** | `authType: "federated"` + `useManagedIdentity` | 無密碼，無需管理密鑰 | 需要 Azure 基礎架構 |

**預設行為：** 未設定 `authType` 時，OpenClaw 預設使用用戶端密鑰驗證。現有設定可繼續運作，無需變更。

## 本機開發（通道轉送）

Teams 無法連線到 `localhost`。請使用持續性的開發通道，讓你的 URL 在不同工作階段中保持不變：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能每個工作階段都會變更）。

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

1. 安裝 Teams 應用程式（使用 `teams app get <id> --install-link` 的安裝連結）
2. 在 Teams 中找到 Bot 並傳送私訊
3. 檢查 Gateway 記錄以查看傳入活動

## 環境變數

所有設定鍵也可以改用環境變數設定：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（選用：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（同盟 + 憑證）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（選用，驗證不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（同盟 + 受控識別）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（僅限使用者指派的 MI）

## 成員資訊動作

OpenClaw 提供由 Graph 支援的 `member-info` 動作給 Microsoft Teams，讓代理和自動化流程可直接從 Microsoft Graph 解析頻道成員詳細資料（顯示名稱、電子郵件、角色）。

需求：

- `Member.Read.Group` RSC 權限（已包含在建議的資訊清單中）
- 跨團隊查詢：具有管理員同意的 `User.Read.All` Graph Application 權限

此動作由 `channels.msteams.actions.memberInfo` 控制（預設：有可用的 Graph 認證時啟用）。

## 歷史內容脈絡

- `channels.msteams.historyLimit` 控制會將多少最近的頻道/群組訊息包入提示。
- 會退回使用 `messages.groupChat.historyLimit`。設為 `0` 可停用（預設 50）。
- 擷取的執行緒歷史會依寄件者允許清單（`allowFrom` / `groupAllowFrom`）篩選，因此執行緒脈絡植入只包含允許寄件者的訊息。
- 引用附件脈絡（衍生自 Teams 回覆 HTML 的 `ReplyTo*`）目前會依收到的內容傳遞。
- 換句話說，允許清單會限制誰能觸發代理；目前只有特定補充脈絡路徑會被篩選。
- DM 歷史可透過 `channels.msteams.dmHistoryLimit`（使用者輪次）限制。每位使用者覆寫：`channels.msteams.dms["<user_id>"].historyLimit`。

## 目前 Teams RSC 權限（資訊清單）

這些是我們 Teams 應用程式資訊清單中的**現有 resourceSpecific 權限**。它們只會套用在已安裝應用程式的團隊/聊天內。

**適用於頻道（團隊範圍）：**

- `ChannelMessage.Read.Group`（Application）- 接收所有頻道訊息，不需要 @提及
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**適用於群組聊天：**

- `ChatMessage.Read.Chat`（Application）- 接收所有群組聊天訊息，不需要 @提及

透過 Teams CLI 新增 RSC 權限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 資訊清單範例（已遮蔽）

具備必要欄位的最小有效範例。請替換 ID 和 URL。

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

### 資訊清單注意事項（必備欄位）

- `bots[].botId` **必須**符合 Azure Bot 應用程式 ID。
- `webApplicationInfo.id` **必須**符合 Azure Bot 應用程式 ID。
- `bots[].scopes` 必須包含你計畫使用的介面（`personal`、`team`、`groupChat`）。
- 個人範圍中的檔案處理需要 `bots[].supportsFiles: true`。
- 如果你想要頻道流量，`authorization.permissions.resourceSpecific` 必須包含頻道讀取/傳送。

### 更新現有應用程式

若要更新已安裝的 Teams 應用程式（例如新增 RSC 權限）：

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新後，請在每個團隊中重新安裝應用程式，讓新權限生效，並**完全結束並重新啟動 Teams**（不只是關閉視窗），以清除快取的應用程式中繼資料。

<details>
<summary>手動更新資訊清單（不使用 CLI）</summary>

1. 使用新設定更新你的 `manifest.json`
2. **遞增 `version` 欄位**（例如 `1.0.0` → `1.1.0`）
3. 將資訊清單與圖示**重新壓縮**（`manifest.json`、`outline.png`、`color.png`）
4. 上傳新的 zip：
   - **Teams 管理中心：** Teams 應用程式 → 管理應用程式 → 找到你的應用程式 → 上傳新版本
   - **側載：** 在 Teams → 應用程式 → 管理你的應用程式 → 上傳自訂應用程式

</details>

## 功能：僅 RSC 與 Graph

### 使用**僅 Teams RSC**（已安裝應用程式，無 Graph API 權限）

可運作：

- 讀取頻道訊息**文字**內容。
- 傳送頻道訊息**文字**內容。
- 接收**個人（DM）**檔案附件。

無法運作：

- 頻道/群組**圖片或檔案內容**（承載資料只包含 HTML stub）。
- 下載儲存在 SharePoint/OneDrive 的附件。
- 讀取訊息歷史（即時 Webhook 事件之外）。

### 使用 **Teams RSC + Microsoft Graph Application 權限**

新增：

- 下載託管內容（貼到訊息中的圖片）。
- 下載儲存在 SharePoint/OneDrive 的檔案附件。
- 透過 Graph 讀取頻道/聊天訊息歷史。

### RSC 與 Graph API

| 功能 | RSC 權限 | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **即時訊息** | 是（透過 Webhook） | 否（僅輪詢） |
| **歷史訊息** | 否 | 是（可查詢歷史） |
| **設定複雜度** | 僅應用程式資訊清單 | 需要管理員同意 + 權杖流程 |
| **離線可用** | 否（必須正在執行） | 是（隨時可查詢） |

**重點：** RSC 用於即時監聽；Graph API 用於歷史存取。若要在離線期間補抓漏掉的訊息，你需要使用具備 `ChannelMessage.Read.All` 的 Graph API（需要管理員同意）。

## 啟用 Graph 的媒體 + 歷史（頻道必要）

如果你需要**頻道**中的圖片/檔案，或想擷取**訊息歷史**，就必須啟用 Microsoft Graph 權限並授予管理員同意。

1. 在 Entra ID (Azure AD) **應用程式註冊**中，新增 Microsoft Graph **Application 權限**：
   - `ChannelMessage.Read.All`（頻道附件 + 歷史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群組聊天）
2. **授予管理員同意**給租用戶。
3. 提高 Teams 應用程式**資訊清單版本**、重新上傳，並在 Teams 中**重新安裝應用程式**。
4. **完全結束並重新啟動 Teams**，以清除快取的應用程式中繼資料。

**使用者提及的額外權限：** 對話中的使用者 @提及可直接運作。不過，如果你想動態搜尋並提及**不在目前對話中**的使用者，請新增 `User.Read.All`（Application）權限並授予管理員同意。

## 已知限制

### Webhook 逾時

Teams 透過 HTTP Webhook 傳遞訊息。如果處理時間過長（例如 LLM 回應緩慢），你可能會看到：

- Gateway 逾時
- Teams 重試訊息（造成重複）
- 回覆被丟棄

OpenClaw 會透過快速回傳並主動傳送回覆來處理這點，但非常慢的回應仍可能造成問題。

### 格式設定

Teams markdown 比 Slack 或 Discord 更受限：

- 基本格式可用：**粗體**、_斜體_、`code`、連結
- 複雜 markdown（表格、巢狀清單）可能無法正確轉譯
- Adaptive Cards 支援投票與語意化展示傳送（見下方）

## 組態

主要設定（共用通道模式請見 `/gateway/configuration`）：

- `channels.msteams.enabled`：啟用/停用通道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：bot 認證資料。
- `channels.msteams.webhook.port`（預設 `3978`）
- `channels.msteams.webhook.path`（預設 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（預設：pairing）
- `channels.msteams.allowFrom`：DM 允許清單（建議使用 AAD 物件 ID）。當 Graph 存取可用時，精靈會在設定期間將名稱解析為 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：緊急切換，用來重新啟用可變的 UPN/顯示名稱比對，以及直接的團隊/通道名稱路由。
- `channels.msteams.textChunkLimit`：傳出文字區塊大小。
- `channels.msteams.chunkMode`：`length`（預設）或 `newline`，在依長度切分前先依空白行（段落邊界）切分。
- `channels.msteams.mediaAllowHosts`：傳入附件主機的允許清單（預設為 Microsoft/Teams 網域）。
- `channels.msteams.mediaAuthAllowHosts`：媒體重試時可附加 Authorization 標頭的允許清單（預設為 Graph + Bot Framework 主機）。
- `channels.msteams.requireMention`：在通道/群組中要求 @提及（預設為 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（請見[回覆樣式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每個團隊的覆寫。
- `channels.msteams.teams.<teamId>.requireMention`：每個團隊的覆寫。
- `channels.msteams.teams.<teamId>.tools`：當缺少通道覆寫時使用的預設每團隊工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：預設每團隊、每傳送者的工具政策覆寫（支援 `"*"` 萬用字元）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每個通道的覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每個通道的覆寫。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每個通道的工具政策覆寫（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每個通道、每傳送者的工具政策覆寫（支援 `"*"` 萬用字元）。
- `toolsBySender` 鍵應使用明確前綴：
  `channel:`、`id:`、`e164:`、`username:`、`name:`（舊版無前綴鍵仍只會對應到 `id:`）。
- `channels.msteams.actions.memberInfo`：啟用或停用 Graph 支援的成員資訊動作（預設：當 Graph 認證資料可用時啟用）。
- `channels.msteams.authType`：驗證類型 - `"secret"`（預設）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 憑證檔案路徑（聯合 + 憑證驗證）。
- `channels.msteams.certificateThumbprint`：憑證指紋（選用，驗證不需要）。
- `channels.msteams.useManagedIdentity`：啟用受控身分驗證（聯合模式）。
- `channels.msteams.managedIdentityClientId`：使用者指派受控身分的用戶端 ID。
- `channels.msteams.sharePointSiteId`：用於群組聊天/通道檔案上傳的 SharePoint 網站 ID（請見[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。

## 路由與工作階段

- 工作階段鍵遵循標準 agent 格式（請見 [/concepts/session](/zh-TW/concepts/session)）：
  - 直接訊息共用主要工作階段（`agent:<agentId>:<mainKey>`）。
  - 通道/群組訊息使用對話 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回覆樣式：threads 與 posts

Teams 最近在相同的底層資料模型上引入了兩種通道 UI 樣式：

| 樣式                     | 說明                                               | 建議的 `replyStyle` |
| ------------------------ | -------------------------------------------------- | ------------------- |
| **Posts**（傳統）        | 訊息會以卡片顯示，下方附有串接回覆               | `thread`（預設）   |
| **Threads**（類似 Slack） | 訊息線性流動，更像 Slack                           | `top-level`         |

**問題：**Teams API 不會公開通道使用哪一種 UI 樣式。如果使用錯誤的 `replyStyle`：

- 在 Threads 樣式通道中使用 `thread` → 回覆會以彆扭的巢狀方式顯示
- 在 Posts 樣式通道中使用 `top-level` → 回覆會顯示成獨立的頂層貼文，而不是串內回覆

**解法：**根據通道的設定方式，為每個通道設定 `replyStyle`：

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

當 bot 將回覆傳送到通道時，`replyStyle` 會從最具體的覆寫一路解析到預設值。第一個非 `undefined` 值勝出：

1. **每個通道** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每個團隊** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全域** — `channels.msteams.replyStyle`
4. **隱含預設值** — 從 `requireMention` 衍生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你全域設定 `requireMention: false`，但未明確設定 `replyStyle`，Posts 樣式通道中的提及即使傳入訊息是串接回覆，也會顯示為頂層貼文。請在全域、團隊或通道層級釘選 `replyStyle: "thread"`，以避免意外。

### 串接內容脈絡保留

當 `replyStyle: "thread"` 生效，且 bot 是從通道串內被 @提及時，OpenClaw 會把原始串根重新附加到傳出對話參照（`19:…@thread.tacv2;messageid=<root>`），讓回覆落在同一個串內。這同時適用於即時（turn 內）傳送，以及在 Bot Framework turn context 過期後進行的主動傳送（例如長時間執行的 agent、透過 `mcp__openclaw__message` 佇列的工具呼叫回覆）。

串根會取自對話參照上儲存的 `threadId`。早於 `threadId` 的舊版儲存參照會退回使用 `activityId`（也就是最近一次植入該對話的傳入活動），因此既有部署不需重新植入也能繼續運作。

當 `replyStyle: "top-level"` 生效時，通道串的傳入訊息會刻意以新的頂層貼文回覆，不會附加串後綴。這是 Threads 樣式通道的正確行為；如果你看到頂層貼文，但預期是串接回覆，代表該通道的 `replyStyle` 設定不正確。

## 附件與圖片

**目前限制：**

- **DM：**圖片與檔案附件可透過 Teams bot 檔案 API 運作。
- **通道/群組：**附件位於 M365 儲存空間（SharePoint/OneDrive）。Webhook payload 只包含 HTML stub，不包含實際檔案位元組。**需要 Graph API 權限**才能下載通道附件。
- 對於明確以檔案優先的傳送，請使用 `action=upload-file` 搭配 `media` / `filePath` / `path`；選用的 `message` 會成為隨附文字/註解，而 `filename` 會覆寫上傳名稱。

若沒有 Graph 權限，包含圖片的通道訊息會以純文字接收（bot 無法存取圖片內容）。
預設情況下，OpenClaw 只會從 Microsoft/Teams 主機名稱下載媒體。可用 `channels.msteams.mediaAllowHosts` 覆寫（使用 `["*"]` 允許任何主機）。
Authorization 標頭只會附加到 `channels.msteams.mediaAuthAllowHosts` 中的主機（預設為 Graph + Bot Framework 主機）。請讓這份清單保持嚴格（避免多租戶後綴）。

## 在群組聊天中傳送檔案

Bot 可使用 FileConsentCard 流程在 DM 中傳送檔案（內建）。不過，**在群組聊天/通道中傳送檔案**需要額外設定：

| 情境                     | 檔案傳送方式                                  | 需要設定                                        |
| ------------------------ | --------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → 使用者接受 → bot 上傳       | 開箱即用                                        |
| **群組聊天/通道**        | 上傳到 SharePoint → 分享連結                  | 需要 `sharePointSiteId` + Graph 權限            |
| **圖片（任何情境）**     | Base64 編碼內嵌                               | 開箱即用                                        |

### 為什麼群組聊天需要 SharePoint

Bot 沒有個人 OneDrive drive（`/me/drive` Graph API 端點不適用於應用程式身分）。若要在群組聊天/通道中傳送檔案，bot 會上傳到 **SharePoint 網站**並建立分享連結。

### 設定

1. **在 Entra ID (Azure AD) → App Registration 中新增 Graph API 權限：**
   - `Sites.ReadWrite.All`（Application）- 將檔案上傳到 SharePoint
   - `Chat.Read.All`（Application）- 選用，啟用每使用者分享連結

2. **授予租戶的管理員同意。**

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | 每使用者分享連結（只有聊天成員可存取）                    |

每使用者分享更安全，因為只有聊天參與者可以存取檔案。如果缺少 `Chat.Read.All` 權限，bot 會退回使用組織範圍分享。

### 後援行為

| 情境                                             | 結果                                             |
| ------------------------------------------------ | ------------------------------------------------ |
| 已設定 `sharePointSiteId` 的群組聊天 + 檔案      | 上傳到 SharePoint，傳送分享連結                  |
| 未設定 `sharePointSiteId` 的群組聊天 + 檔案      | 嘗試 OneDrive 上傳（可能失敗），僅傳送文字       |
| 個人聊天 + 檔案                                  | FileConsentCard 流程（不需 SharePoint 即可運作） |
| 任何情境 + 圖片                                  | Base64 編碼內嵌（不需 SharePoint 即可運作）      |

### 檔案儲存位置

上傳的檔案會儲存在已設定 SharePoint 網站預設文件庫中的 `/OpenClawShared/` 資料夾。

## 投票（Adaptive Cards）

OpenClaw 會將 Teams 投票傳送為 Adaptive Cards（沒有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 記錄在 `~/.openclaw/msteams-polls.json`。
- Gateway 必須保持上線才能記錄投票。
- 投票尚不會自動發布結果摘要（如有需要，請檢查儲存檔案）。

## 簡報卡片

使用 `message` 工具或 CLI 將語意化簡報承載內容傳送給 Teams 使用者或對話。OpenClaw 會依通用簡報合約將它們轉譯為 Teams Adaptive Cards。

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

目標格式詳細資訊，請參閱下方的[目標格式](#target-formats)。

## 目標格式

MSTeams 目標使用前綴來區分使用者與對話：

| 目標類型            | 格式                             | 範例                                                |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 使用者（依 ID）     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 使用者（依名稱）    | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群組/頻道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群組/頻道（原始）   | `<conversation-id>`              | `19:abc123...@thread.tacv2`（若包含 `@thread`）     |

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
若沒有 `user:` 前綴，名稱預設會解析為群組或團隊。以顯示名稱指定人員時，請一律使用 `user:`。
</Note>

## 主動傳訊

- 主動訊息只有在使用者互動**之後**才可行，因為我們會在該時間點儲存對話參照。
- 如需 `dmPolicy` 與允許清單閘控，請參閱 `/gateway/configuration`。

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

**用於設定：**

- 團隊鍵 = `/team/` 之後的路徑片段（URL 解碼後，例如 `19:Bk4j...@thread.tacv2`；較舊的租用戶可能會顯示 `@thread.skype`，這也有效）
- 頻道鍵 = `/channel/` 之後的路徑片段（URL 解碼後）
- **忽略** OpenClaw 路由中的 `groupId` 查詢參數。它是 Microsoft Entra 群組 ID，而不是傳入 Teams 活動使用的 Bot Framework 對話 ID。

## 私人頻道

機器人在私人頻道中的支援有限：

| 功能                         | 標準頻道 | 私人頻道             |
| ---------------------------- | -------- | -------------------- |
| 機器人安裝                   | 是       | 有限                 |
| 即時訊息（webhook）          | 是       | 可能無法運作         |
| RSC 權限                     | 是       | 行為可能有所不同     |
| @提及                        | 是       | 如果機器人可存取     |
| Graph API 歷程               | 是       | 是（需具備權限）     |

**如果私人頻道無法運作的替代方案：**

1. 使用標準頻道進行機器人互動
2. 使用 DM - 使用者永遠可以直接傳訊給機器人
3. 使用 Graph API 進行歷史存取（需要 `ChannelMessage.Read.All`）

## 疑難排解

### 常見問題

- **圖片未顯示在頻道中：** 缺少 Graph 權限或管理員同意。重新安裝 Teams 應用程式，並完全結束/重新開啟 Teams。
- **頻道中沒有回應：** 預設需要提及；設定 `channels.msteams.requireMention=false` 或依團隊/頻道設定。
- **版本不一致（Teams 仍顯示舊資訊清單）：** 移除並重新新增應用程式，然後完全結束 Teams 以重新整理。
- **webhook 回傳 401 Unauthorized：** 未使用 Azure JWT 手動測試時屬預期行為，表示端點可連線但驗證失敗。請使用 Azure Web Chat 正確測試。

### 資訊清單上傳錯誤

- **"Icon file cannot be empty"：** 資訊清單參照的圖示檔案為 0 位元組。建立有效的 PNG 圖示（`outline.png` 為 32x32，`color.png` 為 192x192）。
- **"webApplicationInfo.Id already in use"：** 應用程式仍安裝在另一個團隊/聊天中。請先找到並解除安裝，或等待 5-10 分鐘讓變更傳播。
- **上傳時出現 "Something went wrong"：** 請改透過 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上傳，開啟瀏覽器 DevTools（F12）→ Network 分頁，並檢查回應主體中的實際錯誤。
- **側載失敗：** 請嘗試「Upload an app to your org's app catalog」，而不是「Upload a custom app」，這通常可繞過側載限制。

### RSC 權限無法運作

1. 驗證 `webApplicationInfo.id` 與機器人的 App ID 完全相符
2. 重新上傳應用程式，並重新安裝到團隊/聊天中
3. 檢查組織管理員是否封鎖了 RSC 權限
4. 確認使用正確的範圍：團隊使用 `ChannelMessage.Read.Group`，群組聊天使用 `ChatMessage.Read.Chat`

## 參考資料

- [建立 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 設定指南
- [Teams 開發人員入口網站](https://dev.teams.microsoft.com/apps) - 建立/管理 Teams 應用程式
- [Teams 應用程式資訊清單結構描述](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收頻道訊息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 權限參考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 機器人檔案處理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（頻道/群組需要 Graph）
- [主動傳訊](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用於機器人管理的 Teams CLI

## 相關

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
