---
read_when:
    - 開發 Microsoft Teams 頻道功能
summary: Microsoft Teams 機器人支援狀態、功能與設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-12T14:19:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c01ef9ac8892c19b42e0f03e427f9e87be9868b8901879d93d1762d1533aab70
    source_path: channels/msteams.md
    workflow: 16
---

狀態：支援文字與私訊附件；在頻道／群組中傳送檔案需要 `sharePointSiteId` 與 Graph 權限（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。投票透過 Adaptive Cards 傳送。訊息動作提供明確的 `upload-file`，用於以檔案為優先的傳送方式。

## 隨附外掛

目前的 OpenClaw 版本已隨附 Microsoft Teams 外掛；一般封裝版本不需要另外安裝。

若使用較舊的版本，或自訂安裝排除了隨附的 Teams，請直接安裝 npm 套件：

```bash
openclaw plugins install @openclaw/msteams
```

使用不含版本的套件名稱，以跟隨目前的官方發行標籤。只有在需要可重現的安裝時，才固定使用確切版本。

本機簽出（從 git 儲存庫執行）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可透過單一命令完成機器人註冊、資訊清單建立及認證資訊產生。

**1. 安裝並登入**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 驗證你已登入並查看租用戶資訊
```

<Note>
Teams 命令列介面目前仍處於預覽階段。不同版本之間的命令與旗標可能會變更。
</Note>

**2. 啟動通道**（Teams 無法連線至 localhost）

如有需要，請安裝 devtunnel 命令列介面並完成驗證（[入門指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 一次性設定（跨工作階段使用固定 URL）：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每個開發工作階段：
devtunnel host my-openclaw-bot
# 你的端點：https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
必須使用 `--allow-anonymous`，因為 Teams 無法向 devtunnels 進行驗證。每個傳入的機器人要求仍會由 Teams SDK 驗證。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（每個工作階段的 URL 可能會變更）。

**3. 建立應用程式**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

此命令會建立 Entra ID（Azure AD）應用程式、產生用戶端祕密、建置並上傳 Teams 應用程式資訊清單（包含圖示），以及註冊由 Teams 管理的機器人（不需要 Azure 訂閱）。輸出包含 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和 **Teams App ID**；還會提供直接在 Teams 中安裝應用程式的選項。

**4. 設定 OpenClaw**，使用輸出中的認證資訊：

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

或者直接使用環境變數：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安裝應用程式**

`teams app create` 會提示你安裝應用程式；選取 "Install in Teams"。若要稍後取得安裝連結：

```bash
teams app get <teamsAppId> --install-link
```

**6. 驗證所有功能是否正常運作**

```bash
teams app doctor <teamsAppId>
```

針對機器人註冊、AAD 應用程式設定、資訊清單有效性和 SSO 設定執行診斷。

在正式環境中，請考慮使用[同盟驗證](#federated-authentication-certificate-plus-managed-identity)（憑證或受控識別）取代用戶端祕密。

<Note>
群組聊天預設會遭封鎖（`channels.msteams.groupPolicy: "allowlist"`）。若要允許群組回覆，請設定 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允許任何成員（仍需提及才會觸發）。
</Note>

## 目標

- 透過 Teams 私訊、群組聊天或頻道與 OpenClaw 對話。
- 維持確定性的路由：回覆一律傳回訊息來源的頻道。
- 預設採用安全的頻道行為（除非另有設定，否則必須提及）。

## 設定寫入

根據預設，Microsoft Teams 可以寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

停用方式：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 存取控制（私訊與群組）

**私訊存取**

- 預設值：`channels.msteams.dmPolicy = "pairing"`。未知的傳送者在獲得核准前會被忽略。
- `channels.msteams.allowFrom` 應使用穩定的 AAD 物件 ID，或 `accessGroup:core-team` 之類的靜態傳送者存取群組。
- 請勿依賴 UPN／顯示名稱比對來建立允許清單；這些名稱可能會變更。OpenClaw 預設停用直接名稱比對；若要選擇啟用，請設定 `channels.msteams.dangerouslyAllowNameMatching: true`。
- 當認證資訊允許時，精靈可以透過 Microsoft Graph 將名稱解析為 ID。

**群組存取**

- 預設值：`channels.msteams.groupPolicy = "allowlist"`（除非加入 `groupAllowFrom`，否則會遭封鎖）。當未設定 `channels.msteams.groupPolicy` 時，`channels.defaults.groupPolicy` 可以覆寫共用預設值。
- `channels.msteams.groupAllowFrom` 控制哪些傳送者或靜態傳送者存取群組可以在群組聊天／頻道中觸發（若未設定，則回退使用 `channels.msteams.allowFrom`）。
- 設定 `groupPolicy: "open"` 可允許任何成員（預設仍需提及才會觸發）。
- 若要封鎖**所有**頻道，請設定 `channels.msteams.groupPolicy: "disabled"`。

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

**團隊與頻道允許清單**

- 在 `channels.msteams.teams` 下列出團隊與頻道，以限定群組／頻道回覆的範圍。
- 使用 Teams 連結中的穩定 Teams 對話 ID 作為索引鍵，而不是可變動的顯示名稱（請參閱[團隊與頻道 ID](#team-and-channel-ids-common-gotcha)）。
- 當 `groupPolicy="allowlist"` 且存在團隊允許清單時，只有列出的團隊／頻道會被接受（需提及才會觸發）。
- 設定精靈接受 `Team/Channel` 項目，並為你儲存這些項目。
- 啟動時，OpenClaw 會將團隊／頻道和使用者允許清單中的名稱解析為 ID（當 Graph 權限允許時），並記錄對應關係。無法解析的名稱會依輸入內容保留，但不會用於路由，除非設定了 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

### 運作方式

1. 確認 Microsoft Teams 外掛可用（目前版本已隨附）。
2. 建立 **Azure Bot**（App ID、祕密與租用戶 ID）。
3. 建置參照該機器人的 **Teams 應用程式套件**，包括下列 RSC 權限。
4. 將 Teams 應用程式上傳／安裝至團隊中（或安裝至個人範圍以供私訊使用）。
5. 在 `~/.openclaw/openclaw.json` 中設定 `msteams`（或使用環境變數），並啟動閘道。
6. 閘道預設會在 `/api/messages` 接聽 Bot Framework 網路鉤子流量。

### 步驟 1：建立 Azure Bot

1. 前往 [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填寫 **Basics** 分頁：

   | 欄位               | 值                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的機器人名稱，例如 `openclaw-msteams`（必須是唯一的） |
   | **Subscription**   | 選取你的 Azure 訂閱                                     |
   | **Resource group** | 建立新的資源群組或使用現有資源群組                     |
   | **Pricing tier**   | 開發／測試使用 **Free**                                 |
   | **Type of App**    | **Single Tenant**（建議；請參閱下方注意事項）           |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
2025-07-31 之後已淘汰建立新的多租用戶機器人。新機器人請使用 **Single Tenant**。
</Warning>

3. 按一下 **Review + create**，然後按一下 **Create**（約 1-2 分鐘）。

### 步驟 2：取得認證資訊

1. Azure Bot 資源 → **Configuration** → 複製 **Microsoft App ID**（你的 `appId`）。
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → 複製 **Value**（你的 `appPassword`）。
3. **Overview** → 複製 **Directory (tenant) ID**（你的 `tenantId`）。

### 步驟 3：設定訊息端點

1. Azure Bot → **Configuration**。
2. 設定 **Messaging endpoint**：
   - 正式環境：`https://your-domain.com/api/messages`
   - 本機開發：使用通道（請參閱[本機開發](#local-development-tunneling)）

### 步驟 4：啟用 Teams 頻道

1. Azure Bot → **Channels**。
2. 按一下 **Microsoft Teams** → Configure → Save。
3. 接受服務條款。

### 步驟 5：建置 Teams 應用程式資訊清單

- 加入 `botId = <App ID>` 的 `bot` 項目。
- 範圍：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人範圍檔案處理所必需）。
- 加入 RSC 權限（請參閱 [RSC 權限](#current-teams-rsc-permissions-manifest)）。
- 建立圖示：`outline.png`（32x32）和 `color.png`（192x192）。
- 將 `manifest.json`、`outline.png` 和 `color.png` 一起壓縮成 Zip 檔案。

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

當外掛可用，且 `msteams` 設定包含認證資訊時，Teams 頻道會自動啟動。

</details>

## 同盟驗證（憑證加受控識別）

在正式環境中，OpenClaw 支援透過 `channels.msteams.authType: "federated"` 使用**同盟驗證**，以取代用戶端祕密。有兩種方法：

### 選項 A：憑證式驗證

使用已向你的 Entra ID 應用程式註冊項目登錄的 PEM 憑證。

**設定：**

1. 產生或取得憑證（包含私密金鑰的 PEM 格式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上傳公開憑證。

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

### 選項 B：Azure 受控識別

在 Azure 基礎架構（AKS、App Service、Azure VM）上使用 Azure 受控識別進行無密碼驗證。

**運作方式：**

1. 機器人 Pod／VM 具有受控識別（系統指派或使用者指派）。
2. 同盟識別認證資訊會將受控識別連結至 Entra ID 應用程式註冊項目。
3. 在執行階段，OpenClaw 使用 `@azure/identity` 從 Azure IMDS 端點取得權杖。
4. 權杖會傳遞至 Teams SDK，以進行機器人驗證。

**必要條件：**

- 已啟用受控識別的 Azure 基礎架構（AKS 工作負載識別、App Service、VM）。
- 已在 Entra ID 應用程式註冊項目上建立同盟識別認證資訊。
- Pod／VM 可透過網路存取 IMDS（`169.254.169.254:80`）。

**設定（系統指派的受控識別）：**

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

**設定（使用者指派的受控識別）：**在上述區塊中加入 `managedIdentityClientId: "<MI_CLIENT_ID>"`。

**環境變數：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（僅限使用者指派）

### AKS 工作負載識別設定

對於使用工作負載身分識別的 AKS 部署：

1. 在你的 AKS 叢集上**啟用工作負載身分識別**。
2. 在 Entra ID 應用程式註冊中**建立同盟身分識別認證資訊**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 使用應用程式用戶端 ID 為 **Kubernetes 服務帳戶加上註解**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 為 Pod **加上標籤**，以注入工作負載身分識別：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **允許網路存取** IMDS（`169.254.169.254`）：若使用 NetworkPolicy，請為連接埠 80 上的 `169.254.169.254/32` 新增輸出規則。

### 驗證類型比較

| 方法                 | 設定                                           | 優點                           | 缺點                               |
| -------------------- | ---------------------------------------------- | ------------------------------ | ---------------------------------- |
| **用戶端密碼**       | `appPassword`                                  | 設定簡單                       | 必須輪替密碼，安全性較低           |
| **憑證**             | `authType: "federated"` + `certificatePath`    | 不會透過網路傳輸共用密碼       | 憑證管理負擔                       |
| **受控識別**         | `authType: "federated"` + `useManagedIdentity` | 無須密碼，沒有需要管理的密碼   | 需要 Azure 基礎架構                |

`certificateThumbprint` 可與 `certificatePath` 一併設定，但目前驗證路徑不會讀取它；接受此設定僅是為了向前相容。

**預設值：**未設定 `authType` 時，OpenClaw 使用用戶端密碼驗證（`appPassword`）。現有設定可維持不變並繼續運作。

## 本機開發（通道轉送）

Teams 無法連線至 `localhost`。請使用持續性的開發通道，讓 URL 在不同工作階段之間保持穩定：

```bash
# 一次性設定：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次開發工作階段：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每個工作階段變更）。

如果通道 URL 變更，請更新端點：

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

1. 安裝 Teams 應用程式（安裝連結來自 `teams app get <id> --install-link`）。
2. 在 Teams 中找到 Bot 並傳送私人訊息。
3. 檢查閘道日誌中是否有傳入活動。

## 環境變數

這些驗證相關的設定鍵可以透過環境變數設定，而不必使用 `openclaw.json`（其他設定鍵，例如 `groupPolicy` 或 `historyLimit`，只能透過設定檔設定）：

| 環境變數                             | 設定鍵                    | 備註                              |
| ------------------------------------ | ------------------------- | --------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                   |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                   |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                   |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` 或 `"federated"`       |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | 同盟驗證 + 憑證                   |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 接受此值，但驗證不需要            |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | 同盟驗證 + 受控識別               |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | 僅限使用者指派的受控識別          |

## 成員資訊動作

OpenClaw 為 Microsoft Teams 提供由 Graph 支援的 `member-info` 動作，讓代理程式和自動化流程能解析已設定交談中經驗證的名冊詳細資料。

需求：

- `ChannelSettings.Read.Group` 和 `TeamMember.Read.Group` RSC 權限（建議的資訊清單中已包含）。

只要設定了 Graph 認證資訊，此動作便可使用；沒有獨立的 `channels.msteams.actions.memberInfo` 開關。
標準頻道查詢會傳回相符的團隊名冊身分、顯示名稱、電子郵件和角色。
在目前的私人訊息或群組聊天中，此動作可以傳回可信任傳送者的穩定使用者 ID。
私人／共用頻道和非目前聊天的成員查詢需要額外的名冊權限，
且預設權限基準會拒絕這些查詢。

## 歷史記錄內容

- `channels.msteams.historyLimit` 控制要在提示中納入多少則最近的頻道／群組訊息。若未設定，會回退至 `messages.groupChat.historyLimit`，再以 50 為預設值。設為 `0` 可停用。
- 擷取的討論串歷史記錄會依傳送者允許清單（`allowFrom`／`groupAllowFrom`）篩選，因此植入討論串內容時只會包含允許傳送者的訊息。
- 引用的附件內容（從回覆本身附件中的 Skype Reply 結構描述 HTML 解析）會不經篩選直接傳遞；目前只有植入討論串歷史記錄時會套用傳送者允許清單篩選器。
- 私人訊息歷史記錄可透過 `channels.msteams.dmHistoryLimit`（使用者回合數）限制。每位使用者的覆寫設定：`channels.msteams.dms["<user_id>"].historyLimit`。

## 目前的 Teams RSC 權限（資訊清單）

以下是我們 Teams 應用程式資訊清單中的**現有 resourceSpecific 權限**。它們僅適用於安裝應用程式的團隊／聊天內。

**頻道（團隊範圍）：**

- `ChannelMessage.Read.Group` (Application) - 無須 @提及即可接收所有頻道訊息
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**群組聊天：**

- `ChatMessage.Read.Chat` (Application) - 無須 @提及即可接收所有群組聊天訊息

透過 Teams 命令列介面新增 RSC 權限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 資訊清單範例（已遮蔽敏感資訊）

包含必要欄位的最小有效範例。請替換 ID 和 URL。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "你的組織",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "Teams 中的 OpenClaw", full: "Teams 中的 OpenClaw" },
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

- `bots[].botId` **必須**與 Azure Bot 應用程式 ID 相符。
- `webApplicationInfo.id` **必須**與 Azure Bot 應用程式 ID 相符。
- `bots[].scopes` 必須包含你計畫使用的介面（`personal`、`team`、`groupChat`）。
- 若要在個人範圍內處理檔案，必須設定 `bots[].supportsFiles: true`。
- `authorization.permissions.resourceSpecific` 必須包含頻道讀取／傳送權限，才能處理頻道流量。

### 更新現有應用程式

```bash
# 下載、編輯並重新上傳資訊清單
teams app manifest download <teamsAppId> manifest.json
# 在本機編輯 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果內容有所變更，版本會自動遞增
```

更新後，請在每個團隊中重新安裝應用程式，並**完全結束再重新啟動 Teams**（不能只關閉視窗），以清除快取的應用程式中繼資料。

<details>
<summary>手動更新資訊清單（不使用命令列介面）</summary>

1. 使用新設定更新 `manifest.json`。
2. **遞增 `version` 欄位**（例如 `1.0.0` → `1.1.0`）。
3. 將資訊清單與圖示**重新壓縮為 zip**（`manifest.json`、`outline.png`、`color.png`）。
4. 上傳新的 zip：
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## 功能：僅使用 RSC 與使用 Graph 的比較

### **僅使用 Teams RSC**（已安裝應用程式，無 Graph API 權限）

可運作：

- 讀取頻道訊息的**文字**內容。
- 傳送頻道訊息的**文字**內容。
- 接收**個人（私人訊息）**檔案附件。

無法運作：

- 頻道／群組的**圖片或檔案內容**（承載資料只包含 HTML 替代內容）。
- 下載儲存在 SharePoint／OneDrive 中的附件。
- 讀取即時網路鉤子事件以外的訊息歷史記錄。

### 使用 **Teams RSC + Microsoft Graph 應用程式權限**

新增以下功能：

- 下載託管內容（貼入訊息中的圖片）。
- 下載儲存在 SharePoint／OneDrive 中的檔案附件。
- 透過 Graph 讀取頻道／聊天訊息歷史記錄。

### RSC 與 Graph API 的比較

| 功能                   | RSC 權限             | Graph API                          |
| ---------------------- | -------------------- | ---------------------------------- |
| **即時訊息**           | 是（透過網路鉤子）   | 否（僅能輪詢）                     |
| **歷史訊息**           | 否                   | 是（可查詢歷史記錄）               |
| **設定複雜度**         | 僅需應用程式資訊清單 | 需要管理員同意 + 權杖流程          |
| **可離線運作**         | 否（必須持續執行）   | 是（可隨時查詢）                   |

**結論：**RSC 用於即時監聽；Graph API 用於存取歷史記錄。若要在離線後補抓遺漏的訊息，你需要具備 `ChannelMessage.Read.All` 的 Graph API（需要管理員同意）。

## 啟用 Graph 的媒體與歷史記錄

只啟用你所使用的 Teams 範圍和資料所需的 Microsoft Graph 應用程式權限：

1. Entra ID (Azure AD) **App Registration** → 新增 Graph **Application permissions**：
   - `ChannelMessage.Read.All`，用於頻道附件和頻道歷史記錄。
   - `Chat.Read.All`，用於群組聊天附件和群組聊天歷史記錄。
   - 當必須從 SharePoint／OneDrive 儲存空間下載附件位元組時，使用 `Files.Read.All`；僅使用歷史記錄的設定不需要此權限。
2. 為租用戶**授與管理員同意**。
3. 遞增 Teams 應用程式的**資訊清單版本**、重新上傳，並**在 Teams 中重新安裝應用程式**。
4. **完全結束並重新啟動 Teams**，以清除快取的應用程式中繼資料。

### 頻道／群組檔案復原（`graphMediaFallback`）

Teams 可能會從傳送至機器人的 HTML 活動中移除檔案標記。在這種情況下，Bot Framework 活動與一般 HTML 訊息無法區分；完整的附件參照僅存在於該訊息的 Graph 副本中。

授予上述權限後，啟用後援機制：

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

這僅適用於頻道和群組聊天。每當 HTML 活動未產生可直接下載的媒體時，它會額外執行一次 Graph 訊息查詢，包括一般訊息或僅含提及的訊息。預設值為 `false`，因此現有安裝不會自動增加額外的 Graph 流量或權限錯誤。

**使用者提及：** 對於已在對話中的使用者，@提及可直接使用。若要動態搜尋並提及**不在目前對話中的**使用者，請新增 `User.Read.All`（應用程式）權限並授予管理員同意。

## 已知限制

### 網路鉤子逾時

Teams 透過 HTTP 網路鉤子傳遞訊息。OpenClaw 對該網路鉤子接聽器套用固定的 HTTP 伺服器逾時：閒置 30 秒、要求總時間 30 秒、接收標頭 15 秒。選用的傳入媒體和情境補充共用 10 秒的時間預算，但 Teams SDK 仍會等待代理程式回合完成後才傳回網路鉤子回應。如果完整回合超過 Teams 的重試時間範圍，你可能會看到：

- Teams 重試訊息（造成重複）。
- 回覆遭捨棄。

代理程式回應後，系統會主動傳送回覆，但緩慢的代理程式執行仍可能導致 Teams 端出現重試或重複訊息。

### Teams 雲端與服務 URL 支援

這條由 SDK 支援的 Teams 路徑已在 Microsoft Teams 公用雲端完成即時驗證。

傳入回覆會使用傳入的 Teams SDK 回合情境。脫離情境的主動操作（傳送、編輯、刪除、卡片、投票、檔案同意訊息，以及排入佇列的長時間執行回覆）會使用已儲存對話參照中的 `serviceUrl`。公用雲端預設使用 Teams SDK 公用雲端環境，並允許使用儲存在公用 Teams Connector 主機上的參照：`https://smba.trafficmanager.net/`。

預設使用公用雲端。一般公用雲端機器人不需要設定 `channels.msteams.cloud` 或 `channels.msteams.serviceUrl`。

對於非公用 Teams 雲端，請在 Microsoft 發布對應界限後，設定 `cloud` 和相符的主動操作界限：

- `channels.msteams.cloud` 會選取用於驗證、JWT 驗證、權杖服務和 Graph 範圍的 Teams SDK 雲端預設組態。
- `channels.msteams.serviceUrl` 會選取 Bot Connector 端點界限，用於在主動傳送、編輯、刪除、卡片、投票、檔案同意訊息，以及排入佇列的長時間執行回覆之前，驗證已儲存的對話參照。USGov 和 DoD SDK 雲端需要此設定。對於中國／世紀互聯，OpenClaw 會使用 SDK `China` 預設組態，且僅接受 Azure 中國 Bot Framework 頻道主機上的已儲存／已設定服務 URL。

Microsoft 在 Teams 主動訊息文件的[建立對話](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)一節中，發布全域主動 Bot Connector 端點。若有傳入活動的 `serviceUrl`，請使用該值；否則請使用下方的 Microsoft 表格。

| Teams 環境 | OpenClaw 設定                                             | 主動傳送的 `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| 公用雲端            | 不需要 cloud/serviceUrl 設定                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | 設定 `serviceUrl`；Teams SDK 沒有獨立的 GCC 雲端預設 | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| 中國/21Vianet    | `cloud: "China"`                                            | 使用傳入活動的 `serviceUrl`           |

GCC 範例：Microsoft 記載了獨立的主動傳送服務 URL，但 Teams SDK 並未提供獨立的 GCC 雲端預設：

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

`channels.msteams.serviceUrl` 僅限使用支援的 Microsoft Teams Bot Connector 主機。設定服務 URL 後，在執行主動傳送、編輯、刪除、卡片、投票或排入佇列的長時間執行回覆之前，OpenClaw 會檢查已儲存對話的 `serviceUrl` 是否使用相同的主機。使用預設的公用雲端設定時，如果已儲存的對話指向公用 Teams Connector 主機以外的位置，OpenClaw 會採取故障時關閉的處理。變更雲端/服務 URL 設定後，請從該對話接收一則新訊息，以確保已儲存的對話參照為最新狀態。

Microsoft 的 Teams 主動端點表中，並未為中國/21Vianet 提供獨立的全域主動傳送 `smba` URL。設定 `cloud: "China"`，讓 Teams SDK 使用 Azure 中國的驗證、權杖與 JWT 端點。之後，主動傳送需要使用來自中國 Teams 傳入活動的已儲存對話參照，或在 Azure 中國 Bot Framework 頻道邊界（`*.botframework.azure.cn`）上明確設定服務 URL。在 OpenClaw 將 Graph 要求路由至 Azure 中國 Graph 端點之前，`cloud: "China"` 會停用由 Graph 支援的 Teams 輔助功能。

### 格式設定

Teams 的 Markdown 支援比 Slack 或 Discord 更有限：

- 支援基本格式：**粗體**、_斜體_、`code`、連結。
- 複雜 Markdown（表格、巢狀清單）可能無法正確呈現。
- 支援使用 Adaptive Card 傳送投票與語意化內容（見下文）。

## 設定

主要設定（共用頻道模式請參閱 [/gateway/configuration](/zh-TW/gateway/configuration)）：

- `channels.msteams.enabled`：啟用／停用此頻道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：機器人認證資訊。
- `channels.msteams.cloud`：Teams SDK 雲端環境（`Public`、`USGov`、`USGovDoD` 或 `China`；預設為 `Public`）。使用 USGov/DoD SDK 雲端時，請與 `serviceUrl` 一併設定；中國環境使用 SDK 預設組態，以及儲存的 Azure China Bot Framework 對話參照；在 Azure China Graph 路由推出前，會停用以 Graph 為後端的輔助功能。
- `channels.msteams.serviceUrl`：供 SDK 主動操作使用的 Bot Connector 服務 URL 邊界。公有雲使用 SDK 預設值；GCC 請設為（`https://smba.infra.gcc.teams.microsoft.com/teams`），GCC High 或 DoD 也需設定。若儲存的對話參照來自由 21Vianet 營運的 Teams，中國環境可接受 Azure China Bot Framework 頻道主機。
- `channels.msteams.webhook.port`（預設為 `3978`）。
- `channels.msteams.webhook.path`（預設為 `/api/messages`）。
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（預設為 `pairing`）。
- `channels.msteams.allowFrom`：私訊允許清單（建議使用 AAD 物件 ID）。若可存取 Graph，設定精靈會在設定期間將名稱解析為 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：緊急切換開關，用於重新啟用可變更的 UPN／顯示名稱比對，以及直接依團隊／頻道名稱進行路由。
- `channels.msteams.textChunkLimit`：外送文字分段的字元數（預設為 `4000`；即使設定更高的值，硬性上限仍為 `4000`）。
- `channels.msteams.streaming.chunkMode`：`length`（預設）或 `newline`；後者會先依空白行（段落邊界）分割，再依長度分段。
- `channels.msteams.mediaAllowHosts`：輸入附件主機的允許清單（預設為 Microsoft／Teams 網域：Graph、SharePoint／OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`：重試媒體要求時，可附加 Authorization 標頭的主機允許清單（預設為 Graph 與 Bot Framework 主機）。
- `channels.msteams.graphMediaFallback`：當頻道／群組 HTML 省略檔案標記時，選擇啟用 Graph 訊息查詢（預設為 `false`；請參閱[頻道／群組檔案復原](#channelgroup-file-recovery-graphmediafallback)）。
- `channels.msteams.mediaMaxMb`：每個頻道的媒體大小限制覆寫值，單位為 MB。未設定時，回退使用 `agents.defaults.mediaMaxMb`。
- `channels.msteams.requireMention`：要求頻道／群組訊息必須包含 @提及（預設為 `true`）。
- `channels.msteams.replyStyle`：`thread | top-level`（請參閱[回覆樣式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每個團隊的覆寫值。
- `channels.msteams.teams.<teamId>.requireMention`：每個團隊的覆寫值。
- `channels.msteams.teams.<teamId>.tools`：當缺少頻道覆寫值時使用的預設每團隊工具原則覆寫（`allow`／`deny`／`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：預設的每團隊、每傳送者工具原則覆寫（支援 `"*"` 萬用字元）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每個頻道的覆寫值。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每個頻道的覆寫值。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每個頻道的工具原則覆寫（`allow`／`deny`／`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每個頻道、每個傳送者的工具原則覆寫（支援 `"*"` 萬用字元）。
- `toolsBySender` 鍵應使用明確前綴：`channel:`、`id:`、`e164:`、`username:`、`name:`（舊版無前綴鍵仍只會對應至 `id:`）。
- `channels.msteams.authType`：驗證類型——`"secret"`（預設）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 憑證檔案的路徑（同盟式驗證 + 憑證驗證）。
- `channels.msteams.certificateThumbprint`：憑證指紋；可接受，但驗證不要求提供。
- `channels.msteams.useManagedIdentity`：啟用受控識別驗證（同盟模式）。
- `channels.msteams.managedIdentityClientId`：使用者指派受控識別的用戶端 ID。
- `channels.msteams.sharePointSiteId`：用於在群組聊天／頻道中上傳檔案的 SharePoint 網站 ID（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`：首次私訊／群組聯絡時顯示的歡迎 Adaptive Card，以及其中的建議提示按鈕。
- `channels.msteams.responsePrefix`：加在外送回覆前的文字。
- `channels.msteams.feedbackEnabled`（預設為 `true`）、`channels.msteams.feedbackReflection`（預設為 `true`）、`channels.msteams.feedbackReflectionCooldownMs`：回覆上的讚／倒讚意見回饋，以及負面意見回饋後的反思追問。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`：用於 SSO 支援流程的 Bot Framework OAuth 連線與委派 Graph 範圍；`sso.enabled: true` 要求設定 `sso.connectionName`。

## 路由與工作階段

- 工作階段鍵遵循標準代理程式格式（請參閱 [/concepts/session](/zh-TW/concepts/session)）：
  - 私訊共用主要工作階段（`agent:<agentId>:<mainKey>`）。
  - 頻道／群組訊息使用對話 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回覆樣式：討論串與貼文

Teams 在相同的底層資料模型上提供兩種頻道 UI 樣式：

| 樣式                     | 說明                                              | 建議的 `replyStyle` |
| ------------------------ | ------------------------------------------------- | ------------------- |
| **貼文**（傳統）         | 訊息會顯示為卡片，下方附有討論串回覆              | `thread`（預設）    |
| **討論串**（類似 Slack） | 訊息以線性方式排列，更接近 Slack                  | `top-level`         |

**問題：**Teams API 不會揭露頻道使用哪一種 UI 樣式。如果使用錯誤的 `replyStyle`：

- 在討論串樣式的頻道中使用 `thread` → 回覆會以不自然的巢狀方式顯示。
- 在貼文樣式的頻道中使用 `top-level` → 回覆會顯示為個別的最上層貼文，而不是顯示在討論串內。

**解決方案：**根據頻道的設定方式，為每個頻道設定 `replyStyle`：

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

當機器人將回覆傳送至頻道時，會從最具體的覆寫設定一路向下解析 `replyStyle`，直到預設值。第一個不是 `undefined` 的值優先：

1. **每個頻道** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每個團隊** - `channels.msteams.teams.<teamId>.replyStyle`
3. **全域** - `channels.msteams.replyStyle`
4. **隱含預設值** - 根據 `requireMention` 衍生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你在全域設定 `requireMention: false`，但未明確設定 `replyStyle`，即使傳入訊息是討論串回覆，貼文樣式頻道中的提及仍會顯示為最上層貼文。請在全域、團隊或頻道層級固定設定 `replyStyle: "thread"`，以避免意外行為。

對於主動傳送至已儲存頻道對話的訊息（排入佇列的工具呼叫回覆、長時間執行的代理程式），會套用相同的團隊／頻道解析方式；無論 `replyStyle` 為何，群組聊天和個人（私訊）對話的主動傳送一律解析為 `top-level`。

### 保留討論串情境

當 `replyStyle: "thread"` 生效，且機器人是在頻道討論串內被 @提及時，OpenClaw 會將原始討論串根節點重新附加至傳出對話參照（`19:...@thread.tacv2;messageid=<root>`），讓回覆落在同一個討論串內。這同時適用於即時（同一回合內）傳送，以及 Bot Framework 回合情境到期後進行的主動傳送（例如長時間執行的代理程式、透過 `mcp__openclaw__message` 排入佇列的工具呼叫回覆）。

討論串根節點取自對話參照中儲存的 `threadId`。在加入 `threadId` 之前儲存的舊版參照會退回使用 `activityId`（最近一次建立該對話的任何傳入活動），因此現有部署不需要重新建立資料即可繼續運作。

當 `replyStyle: "top-level"` 生效時，頻道討論串中的傳入訊息會刻意以新的最上層貼文回覆，不會附加討論串尾碼。這對討論串樣式的頻道而言是正確行為；如果你預期收到討論串回覆，卻看到最上層貼文，表示該頻道的 `replyStyle` 設定不正確。

## 附件和圖片

**目前的限制：**

- **私訊：**圖片和檔案附件可透過 Teams 機器人檔案 API 運作。
- **頻道／群組：**附件儲存在 M365 儲存空間（SharePoint/OneDrive）中。網路鉤子承載資料僅包含 HTML 樣板，不包含實際檔案位元組。若要下載頻道附件，**必須具備 Graph API 權限**。
- 若要明確優先傳送檔案，請搭配 `media` / `filePath` / `path` 使用 `action=upload-file`；選用的 `message` 會成為隨附文字／註解，而 `filename`（或 `title`）會覆寫上傳名稱。

若沒有 Graph 權限，含有圖片的頻道訊息只會以純文字形式送達（機器人無法存取圖片內容）。
根據預設，OpenClaw 僅會從 Microsoft/Teams 主機名稱下載媒體。可使用 `channels.msteams.mediaAllowHosts` 覆寫（使用 `["*"]` 允許任何主機）。
只有 `channels.msteams.mediaAuthAllowHosts` 中的主機會附加授權標頭（預設為 Graph + Bot Framework 主機）。請嚴格限制此清單（避免使用多租用戶尾碼）。

## 在群組聊天中傳送檔案

機器人可以使用內建的 FileConsentCard 流程在私訊中傳送檔案。**在群組聊天／頻道中傳送檔案**需要額外設定：

| 情境                     | 檔案傳送方式                                 | 所需設定                                         |
| ------------------------ | -------------------------------------------- | ------------------------------------------------ |
| **私訊**                 | FileConsentCard → 使用者接受 → 機器人上傳    | 可直接使用                                       |
| **群組聊天／頻道**       | 上傳至 SharePoint → 原生檔案卡片             | 需要 `sharePointSiteId` + Graph 權限             |
| **圖片（任何情境）**     | Base64 編碼的行內內容                        | 可直接使用                                       |

### 群組聊天為何需要 SharePoint

機器人使用應用程式身分，而 Microsoft Graph 的 `/me` 資源[需要已登入的使用者](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0)。若要在群組聊天／頻道中傳送檔案，機器人會將檔案上傳至 **SharePoint 網站**並建立共用連結。

### 設定

1. 在 Entra ID (Azure AD) → App Registration 中**新增 Graph API 權限**：
   - `Sites.ReadWrite.All` (Application) - 將檔案上傳至 SharePoint。
   - `Chat.Read.All` (Application) - 選用，可啟用每位使用者專屬的共用連結。
2. 為租用戶**授予系統管理員同意**。
3. **取得你的 SharePoint 網站 ID：**

   ```bash
   # 透過 Graph Explorer，或使用有效權杖執行 curl：
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 範例：針對位於 "contoso.sharepoint.com/sites/BotFiles" 的網站
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 回應包含："id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **設定 OpenClaw：**

   ```json5
   {
     channels: {
       msteams: {
         // ... 其他設定 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共用行為

| 權限                                    | 共用行為                                                  |
| --------------------------------------- | --------------------------------------------------------- |
| 僅 `Sites.ReadWrite.All`                | 全組織共用連結（組織內任何人皆可存取）                    |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 每位使用者專屬的共用連結（僅聊天成員可存取）              |

每位使用者專屬的共用方式更安全，因為只有聊天參與者可以存取檔案。如果缺少 `Chat.Read.All`，機器人會退回使用全組織共用。

### 退回行為

| 情境                                             | 結果                                             |
| ------------------------------------------------ | ------------------------------------------------ |
| 群組聊天 + 檔案 + 已設定 `sharePointSiteId`      | 上傳至 SharePoint，傳送原生檔案卡片              |
| 群組聊天 + 檔案 + 未設定 `sharePointSiteId`      | 失敗並顯示可據以處理的設定錯誤                   |
| 個人聊天 + 檔案                                  | FileConsentCard 流程（不需 SharePoint 即可運作） |
| 任何情境 + 圖片                                  | Base64 編碼的行內內容（不需 SharePoint 即可運作）|

### 檔案儲存位置

上傳的檔案會儲存在已設定 SharePoint 網站的預設文件庫內之 `/OpenClawShared/` 資料夾中。

## 投票（Adaptive Cards）

OpenClaw 會以 Adaptive Cards 傳送 Teams 投票（Teams 沒有原生投票 API）。

- 命令列介面：`openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 投票由閘道記錄於 `state/openclaw.sqlite` 中的 OpenClaw 外掛狀態 SQLite。
- 現有的 `msteams-polls.json` 檔案由 `openclaw doctor --fix` 匯入，而不是由執行中的外掛匯入。
- 閘道必須保持上線才能記錄投票。
- 投票不會自動發布結果摘要，而且目前尚無投票結果命令列介面。

## 呈現卡片

使用 `message` 工具、命令列介面或一般回覆傳遞，將語意呈現承載資料傳送給 Teams 使用者或對話。OpenClaw 會依據通用呈現合約，將其轉譯為 Teams Adaptive Cards。

`presentation` 參數接受語意區塊。提供 `presentation` 時，訊息文字為選用。按鈕會轉譯為 Adaptive Card 提交或 URL 動作。Teams 轉譯器不原生支援選取選單，因此 OpenClaw 會在傳遞前將其降級為可讀文字。

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

**命令列介面：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

如需目標格式的詳細資訊，請參閱下方的[目標格式](#target-formats)。

## 目標格式

MSTeams 目標使用前綴來區分使用者與對話：

| 目標類型            | 格式                             | 範例                                                                                                   |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 使用者（依 ID）     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| 使用者（依名稱）    | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                                                                    |
| 群組／頻道          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| 群組／頻道（原始）  | `<conversation-id>`              | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces`，或不含前綴的 `a:`/`8:orgid:`/`29:` Bot Framework ID |

**命令列介面範例：**

```bash
# 依 ID 傳送給使用者
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 依顯示名稱傳送給使用者（會觸發 Graph API 查詢）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 傳送至群組聊天或頻道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 傳送呈現卡片至對話
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**代理程式工具範例：**

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
如果沒有 `user:` 前綴，名稱預設會解析為群組或團隊。依顯示名稱指定人員時，請一律使用 `user:`。
</Note>

## 主動傳訊

- 只有在使用者互動**之後**才能傳送主動訊息，因為 OpenClaw 會在那時儲存對話參照。
- 如需 `dmPolicy` 和允許清單管控的相關資訊，請參閱 [/gateway/configuration](/zh-TW/gateway/configuration)。

## 團隊和頻道 ID（常見陷阱）

Teams URL 中的 `groupId` 查詢參數**不是**設定所使用的團隊 ID。請改從 URL 路徑擷取 ID：

**團隊 URL：**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    團隊交談 ID（請對此進行 URL 解碼）
```

**頻道 URL：**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      頻道 ID（請對此進行 URL 解碼）
```

**用於設定：**

- 團隊索引鍵 = `/team/` 後方的路徑區段（經 URL 解碼，例如 `19:Bk4j...@thread.tacv2`；較舊的租用戶可能會顯示 `@thread.skype`，這也有效）。
- 頻道索引鍵 = `/channel/` 後方的路徑區段（經 URL 解碼）。
- OpenClaw 路由應**忽略** `groupId` 查詢參數。它是 Microsoft Entra 群組 ID，而不是 Teams 傳入活動所使用的 Bot Framework 交談 ID。

## 私人頻道

Bot 對私人頻道的支援有限：

| 功能                         | 標準頻道 | 私人頻道             |
| ---------------------------- | -------- | -------------------- |
| Bot 安裝                     | 是       | 有限                 |
| 即時訊息（網路鉤子）         | 是       | 可能無法運作         |
| RSC 權限                     | 是       | 行為可能有所不同     |
| @提及                        | 是       | Bot 可存取時         |
| Graph API 歷史記錄           | 是       | 是（需具備權限）     |

**如果私人頻道無法運作，可採取以下替代方案：**

1. 使用標準頻道與 Bot 互動。
2. 使用私訊；使用者隨時可以直接傳訊息給 Bot。
3. 使用 Graph API 存取歷史記錄（需要 `ChannelMessage.Read.All`）。

## 疑難排解

### 常見問題

- **頻道中未顯示圖片：**缺少 Graph 權限或管理員同意。重新安裝 Teams 應用程式，並完全結束後重新開啟 Teams。
- **頻道中沒有回應：**預設需要提及；請設定 `channels.msteams.requireMention=false`，或針對各團隊／頻道進行設定。
- **版本不符（Teams 仍顯示舊資訊清單）：**移除後重新新增應用程式，並完全結束 Teams 後重新開啟以重新整理。
- **網路鉤子傳回 401 Unauthorized：**在未使用 Azure JWT 的情況下手動測試時，這是預期結果；表示端點可連線，但驗證失敗。請使用 Azure Web Chat 正確測試。

### 資訊清單上傳錯誤

- **"Icon file cannot be empty"：**資訊清單參照的圖示檔案大小為 0 位元組。請建立有效的 PNG 圖示（`outline.png` 為 32x32，`color.png` 為 192x192）。
- **"webApplicationInfo.Id already in use"：**應用程式仍安裝在其他團隊／聊天中。請先找出並解除安裝，或等待 5-10 分鐘讓變更傳播。
- **上傳時出現 "Something went wrong"：**改透過 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上傳，開啟瀏覽器開發人員工具（F12）→ Network 分頁，並檢查回應本文以查看實際錯誤。
- **側載失敗：**請嘗試使用 "Upload an app to your org's app catalog"，而非 "Upload a custom app"；這通常能避開側載限制。

### RSC 權限無法運作

1. 確認 `webApplicationInfo.id` 與 Bot 的 App ID 完全相符。
2. 重新上傳應用程式，並在團隊／聊天中重新安裝。
3. 檢查組織管理員是否已封鎖 RSC 權限。
4. 確認使用正確的範圍：團隊使用 `ChannelMessage.Read.Group`，群組聊天使用 `ChatMessage.Read.Chat`。

## 參考資料

- [建立 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 設定指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 建立／管理 Teams 應用程式
- [Teams 應用程式資訊清單結構描述](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收頻道訊息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 權限參考資料](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams Bot 檔案處理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（頻道／群組需要 Graph）
- [主動式訊息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用於管理 Bot 的 Teams 命令列介面

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
