---
read_when:
    - 處理 Microsoft Teams 頻道功能
summary: Microsoft Teams Bot 支援狀態、功能與設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-05T11:03:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00ce5e18ce45700233e62fff3d9dc8f013a0eacd103d9ca6f2c6256643121ca7
    source_path: channels/msteams.md
    workflow: 16
---

狀態：支援文字 + DM 附件；頻道/群組檔案傳送需要 `sharePointSiteId` + Graph 權限（請參閱[在群組聊天中傳送檔案](#sending-files-in-group-chats)）。投票會透過 Adaptive Cards 傳送。訊息動作會公開明確的 `upload-file`，用於以檔案優先的傳送。

## 內建外掛

Microsoft Teams 在目前的 OpenClaw 發行版本中作為內建外掛提供；一般封裝建置不需要另行安裝。

在較舊的建置，或排除內建 Teams 的自訂安裝中，請直接安裝 npm 套件：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸套件即可跟隨目前的官方發行標籤。只有在需要可重現安裝時，才固定精確版本。

本機 checkout（從 git repo 執行）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 會以單一命令處理 bot 註冊、manifest 建立與憑證產生。

**1. 安裝並登入**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams 命令列介面目前仍處於預覽版。命令與旗標可能會在不同發行版本間變更。
</Note>

**2. 啟動通道**（Teams 無法連到 localhost）

如有需要，請安裝並驗證 devtunnel 命令列介面（[入門指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必要的，因為 Teams 無法使用 devtunnels 驗證。每個傳入的 bot 要求仍會由 Teams SDK 驗證。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能會在每個工作階段變更）。

**3. 建立應用程式**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

這會建立 Entra ID（Azure AD）應用程式、產生用戶端密碼、建置並上傳 Teams 應用程式 manifest（包含圖示），並註冊由 Teams 管理的 bot（不需要 Azure 訂閱）。輸出包含 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 與 **Teams App ID**；它也會提供直接在 Teams 中安裝應用程式的選項。

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

`teams app create` 會提示你安裝應用程式；選取「Install in Teams」。之後若要取得安裝連結：

```bash
teams app get <teamsAppId> --install-link
```

**6. 驗證一切正常運作**

```bash
teams app doctor <teamsAppId>
```

會針對 bot 註冊、AAD 應用程式設定、manifest 有效性與 SSO 設定執行診斷。

用於正式環境時，請考慮使用[同盟驗證](#federated-authentication-certificate-plus-managed-identity)（憑證或受控識別），而不是用戶端密碼。

<Note>
群組聊天預設會被封鎖（`channels.msteams.groupPolicy: "allowlist"`）。若要允許群組回覆，請設定 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允許任何成員（需提及）。
</Note>

## 目標

- 透過 Teams DM、群組聊天或頻道與 OpenClaw 對話。
- 維持確定性的路由：回覆一律送回來源頻道。
- 預設採用安全的頻道行為（除非另有設定，否則需要提及）。

## 設定寫入

預設情況下，Microsoft Teams 可以寫入由 `/config set|unset` 觸發的設定更新（需要 `commands.config: true`）。

用以下方式停用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 存取控制（DM + 群組）

**DM 存取**

- 預設：`channels.msteams.dmPolicy = "pairing"`。未知寄件者在核准前會被忽略。
- `channels.msteams.allowFrom` 應使用穩定的 AAD 物件 ID，或靜態寄件者存取群組，例如 `accessGroup:core-team`。
- 不要依賴 UPN/顯示名稱比對來建立允許清單；它們可能會變更。OpenClaw 預設停用直接名稱比對；可使用 `channels.msteams.dangerouslyAllowNameMatching: true` 選擇啟用。
- 當憑證允許時，精靈可以透過 Microsoft Graph 將名稱解析為 ID。

**群組存取**

- 預設：`channels.msteams.groupPolicy = "allowlist"`（除非加入 `groupAllowFrom`，否則封鎖）。當 `channels.msteams.groupPolicy` 未設定時，`channels.defaults.groupPolicy` 可以覆寫共用預設值。
- `channels.msteams.groupAllowFrom` 控制哪些寄件者或靜態寄件者存取群組可以在群組聊天/頻道中觸發（會回退到 `channels.msteams.allowFrom`）。
- 設定 `groupPolicy: "open"` 可允許任何成員（預設仍需提及）。
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

**團隊 + 頻道允許清單**

- 在 `channels.msteams.teams` 下列出團隊與頻道，以限定群組/頻道回覆範圍。
- 使用 Teams 連結中的穩定 Teams 對話 ID 作為鍵，而不是可變的顯示名稱（請參閱[團隊與頻道 ID](#team-and-channel-ids-common-gotcha)）。
- 當 `groupPolicy="allowlist"` 且存在 teams 允許清單時，只接受列出的團隊/頻道（需提及）。
- 設定精靈接受 `Team/Channel` 項目，並會替你儲存。
- 啟動時，OpenClaw 會將團隊/頻道與使用者允許清單名稱解析為 ID（當 Graph 權限允許時），並記錄對應關係。未解析的名稱會保留為輸入值，但除非設定 `channels.msteams.dangerouslyAllowNameMatching: true`，否則路由時會忽略。

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

1. 確認 Microsoft Teams 外掛可用（目前發行版本已內建）。
2. 建立 **Azure Bot**（App ID + 密碼 + 租用戶 ID）。
3. 建置參照該 bot 的 **Teams 應用程式套件**，包含下方的 RSC 權限。
4. 將 Teams 應用程式上傳/安裝到團隊（或用於 DM 的個人範圍）。
5. 在 `~/.openclaw/openclaw.json`（或環境變數）中設定 `msteams`，並啟動閘道。
6. 閘道預設會在 `/api/messages` 監聽 Bot Framework 網路鉤子流量。

### 步驟 1：建立 Azure Bot

1. 前往[建立 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填寫 **Basics** 分頁：

   | 欄位               | 值                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的 bot 名稱，例如 `openclaw-msteams`（必須唯一）       |
   | **Subscription**   | 選取你的 Azure 訂閱                                     |
   | **Resource group** | 建立新的或使用現有的                                   |
   | **Pricing tier**   | 用於開發/測試的 **Free**                                |
   | **Type of App**    | **Single Tenant**（建議；請參閱下方注意事項）           |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新多租用戶 bot 的建立已在 2025-07-31 後棄用。新 bot 請使用 **Single Tenant**。
</Warning>

3. 按一下 **Review + create**，然後按 **Create**（約 1-2 分鐘）。

### 步驟 2：取得憑證

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

### 步驟 5：建置 Teams 應用程式 manifest

- 包含 `bot` 項目，且 `botId = <App ID>`。
- 範圍：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人範圍檔案處理所需）。
- 加入 RSC 權限（請參閱 [RSC 權限](#current-teams-rsc-permissions-manifest)）。
- 建立圖示：`outline.png`（32x32）與 `color.png`（192x192）。
- 將 `manifest.json`、`outline.png` 與 `color.png` 一起壓縮。

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

當外掛可用且 `msteams` 設定具有憑證時，Teams 頻道會自動啟動。

</details>

## 同盟驗證（憑證加受控識別）

用於正式環境時，OpenClaw 支援**同盟驗證**作為用戶端密碼的替代方案，透過 `channels.msteams.authType: "federated"`。兩種方法：

### 選項 A：憑證式驗證

使用已註冊至 Entra ID 應用程式註冊的 PEM 憑證。

**設定：**

1. 產生或取得憑證（含私密金鑰的 PEM 格式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上傳公開憑證。

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

**環境變數：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 選項 B：Azure 受控識別

在 Azure 基礎設施（AKS、App Service、Azure VM）上使用 Azure 受控識別進行無密碼驗證。

**運作方式：**

1. bot pod/VM 具有受控識別（系統指派或使用者指派）。
2. 同盟識別憑證會將受控識別連結到 Entra ID 應用程式註冊。
3. 執行時，OpenClaw 使用 `@azure/identity` 從 Azure IMDS 端點取得 token。
4. token 會傳遞給 Teams SDK，用於 bot 驗證。

**先決條件：**

- 已啟用受控識別的 Azure 基礎設施（AKS workload identity、App Service、VM）。
- 已在 Entra ID 應用程式註冊上建立同盟識別憑證。
- pod/VM 可網路存取 IMDS（`169.254.169.254:80`）。

**設定檔（系統指派受控識別）：**

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

**設定檔（使用者指派受控識別）：** 在上述區塊加入 `managedIdentityClientId: "<MI_CLIENT_ID>"`。

**環境變數：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（僅限使用者指派）

### AKS Workload Identity 設定

對於使用工作負載身分識別的 AKS 部署：

1. **在 AKS 叢集上啟用工作負載身分識別**。
2. **在 Entra ID 應用程式註冊上建立同盟身分識別認證**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **使用應用程式用戶端 ID 註解 Kubernetes 服務帳戶**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **標記 Pod** 以注入工作負載身分識別：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **允許網路存取** IMDS (`169.254.169.254`)：如果使用 NetworkPolicy，請為連接埠 80 上的 `169.254.169.254/32` 新增輸出規則。

### 驗證類型比較

| 方法                 | 設定                                           | 優點                           | 缺點                             |
| -------------------- | ---------------------------------------------- | ------------------------------ | -------------------------------- |
| **用戶端密碼**       | `appPassword`                                  | 設定簡單                       | 需要密碼輪替，安全性較低         |
| **憑證**             | `authType: "federated"` + `certificatePath`    | 不透過網路傳送共用密碼         | 憑證管理負擔                     |
| **受控身分識別**     | `authType: "federated"` + `useManagedIdentity` | 無密碼，無需管理密鑰           | 需要 Azure 基礎架構              |

`certificateThumbprint` 可與 `certificatePath` 一起設定，但目前驗證路徑不會讀取它；接受它只是為了向前相容。

**預設值：** 未設定 `authType` 時，OpenClaw 使用用戶端密碼驗證 (`appPassword`)。現有設定會保持不變並繼續運作。

## 本機開發（通道轉發）

Teams 無法連到 `localhost`。請使用持久的開發通道，讓 URL 在不同工作階段之間保持穩定：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能會在每個工作階段變更）。

如果通道 URL 變更，請更新端點：

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

1. 安裝 Teams 應用程式（安裝連結來自 `teams app get <id> --install-link`）。
2. 在 Teams 中找到機器人並傳送 DM。
3. 檢查閘道記錄中是否有傳入活動。

## 環境變數

這些與驗證相關的設定鍵可透過環境變數設定，而不必寫在 `openclaw.json` 中（其他設定鍵，例如 `groupPolicy` 或 `historyLimit`，僅能透過設定檔設定）：

| 環境變數                             | 設定鍵                    | 備註                               |
| ------------------------------------ | ------------------------- | ---------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                    |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                    |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                    |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` 或 `"federated"`        |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | 同盟 + 憑證                        |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 已接受，驗證不需要                |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | 同盟 + 受控身分識別                |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | 僅限使用者指派的受控身分識別      |

## 成員資訊動作

OpenClaw 為 Microsoft Teams 公開由 Graph 支援的 `member-info` 訊息動作，讓代理程式和自動化流程可以直接從 Microsoft Graph 解析頻道成員詳細資料（顯示名稱、電子郵件、職稱、UPN、辦公室位置）。

需求：

- `Member.Read.Group` RSC 權限（已包含在建議的資訊清單中）。
- 跨團隊查詢：需要 `User.Read.All` Graph 應用程式權限並取得管理員同意。

只要設定了 Graph 認證，此動作就會執行；未設定時會因 Graph 驗證錯誤而失敗。沒有獨立的 `channels.msteams.actions.memberInfo` 切換開關。

## 歷史內容脈絡

- `channels.msteams.historyLimit` 控制要將多少最近的頻道/群組訊息包入提示。會回退到 `messages.groupChat.historyLimit`，再預設為 50。設定 `0` 可停用。
- 擷取到的討論串歷史會依寄件者允許清單 (`allowFrom` / `groupAllowFrom`) 篩選，因此討論串脈絡植入只包含來自允許寄件者的訊息。
- 引用附件脈絡（從回覆本身附件中的 Skype Reply-schema HTML 解析）會不經篩選直接傳遞；目前只有討論串歷史植入會套用寄件者允許清單篩選器。
- DM 歷史可用 `channels.msteams.dmHistoryLimit`（使用者回合）限制。每位使用者覆寫：`channels.msteams.dms["<user_id>"].historyLimit`。

## 目前的 Teams RSC 權限（資訊清單）

這些是我們 Teams 應用程式資訊清單中**現有的 resourceSpecific 權限**。它們只會套用在安裝該應用程式的團隊/聊天中。

**對於頻道（團隊範圍）：**

- `ChannelMessage.Read.Group`（應用程式）- 接收所有未 @mention 的頻道訊息
- `ChannelMessage.Send.Group`（應用程式）
- `Member.Read.Group`（應用程式）
- `Owner.Read.Group`（應用程式）
- `ChannelSettings.Read.Group`（應用程式）
- `TeamMember.Read.Group`（應用程式）
- `TeamSettings.Read.Group`（應用程式）

**對於群組聊天：**

- `ChatMessage.Read.Chat`（應用程式）- 接收所有未 @mention 的群組聊天訊息

透過 Teams 命令列介面新增 RSC 權限：

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

### 資訊清單注意事項（必備欄位）

- `bots[].botId` **必須**符合 Azure Bot 應用程式 ID。
- `webApplicationInfo.id` **必須**符合 Azure Bot 應用程式 ID。
- `bots[].scopes` 必須包含你計畫使用的介面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是在個人範圍中處理檔案所必需。
- `authorization.permissions.resourceSpecific` 必須包含頻道流量所需的頻道讀取/傳送權限。

### 更新現有應用程式

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新後，請在每個團隊中重新安裝該應用程式，並**完全結束再重新啟動 Teams**（不只是關閉視窗）以清除快取的應用程式中繼資料。

<details>
<summary>手動更新資訊清單（不使用命令列介面）</summary>

1. 使用新設定更新 `manifest.json`。
2. **遞增 `version` 欄位**（例如 `1.0.0` → `1.1.0`）。
3. **重新壓縮**資訊清單與圖示（`manifest.json`、`outline.png`、`color.png`）。
4. 上傳新的 zip：
   - **Teams 管理中心：** Teams 應用程式 → 管理應用程式 → 找到你的應用程式 → 上傳新版本。
   - **側載：** Teams → 應用程式 → 管理你的應用程式 → 上傳自訂應用程式。

</details>

## 功能：僅 RSC 與 Graph

### 僅使用 **Teams RSC**（已安裝應用程式，無 Graph API 權限）

可用：

- 讀取頻道訊息**文字**內容。
- 傳送頻道訊息**文字**內容。
- 接收**個人（DM）**檔案附件。

不可用：

- 頻道/群組**影像或檔案內容**（承載資料只包含 HTML stub）。
- 下載儲存在 SharePoint/OneDrive 的附件。
- 讀取即時網路鉤子事件以外的訊息歷史。

### 使用 **Teams RSC + Microsoft Graph 應用程式權限**

新增：

- 下載託管內容（貼到訊息中的影像）。
- 下載儲存在 SharePoint/OneDrive 的檔案附件。
- 透過 Graph 讀取頻道/聊天訊息歷史。

### RSC 與 Graph API

| 功能                   | RSC 權限             | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **即時訊息**           | 是（透過網路鉤子）   | 否（僅輪詢）                        |
| **歷史訊息**           | 否                   | 是（可查詢歷史）                    |
| **設定複雜度**         | 僅需應用程式資訊清單 | 需要管理員同意 + 權杖流程           |
| **離線運作**           | 否（必須執行中）     | 是（可隨時查詢）                    |

**重點：** RSC 用於即時監聽；Graph API 用於歷史存取。若要在離線期間補上漏掉的訊息，你需要使用具備 `ChannelMessage.Read.All` 的 Graph API（需要管理員同意）。

## 已啟用 Graph 的媒體 + 歷史（頻道必需）

若要在**頻道**中處理影像/檔案，或擷取**訊息歷史**，請啟用 Microsoft Graph 權限並授予管理員同意：

1. Entra ID (Azure AD) **應用程式註冊** → 新增 Graph **應用程式權限**：
   - `ChannelMessage.Read.All`（頻道附件 + 歷史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群組聊天）
2. **授予租用戶管理員同意**。
3. 提高 Teams 應用程式**資訊清單版本**、重新上傳，並**在 Teams 中重新安裝應用程式**。
4. **完全結束再重新啟動 Teams**以清除快取的應用程式中繼資料。

**使用者提及：** 對於已在對話中的使用者，@mentions 可立即使用。若要動態搜尋並提及**不在目前對話中的**使用者，請新增 `User.Read.All`（應用程式）權限並授予管理員同意。

## 已知限制

### 網路鉤子逾時

Teams 透過 HTTP 網路鉤子傳遞訊息。OpenClaw 對該網路鉤子監聽器套用固定的 HTTP 伺服器逾時：30 秒無活動、30 秒總請求時間、15 秒接收標頭。如果代理程式處理時間超過用戶端自己的重試視窗，你可能會看到：

- Teams 重試訊息（造成重複）。
- 回覆被捨棄。

OpenClaw 會快速確認網路鉤子（在代理處理完成前），並在代理回應後主動傳送回覆，但非常慢的代理執行仍可能在 Teams 端浮現重試/重複問題。

### Teams 雲端與服務 URL 支援

這個由 SDK 支援的 Teams 路徑已針對 Microsoft Teams 公用雲端完成即時驗證。

傳入回覆會使用傳入的 Teams SDK 回合情境。脫離情境的主動操作 - 傳送、編輯、刪除、卡片、投票、檔案同意訊息，以及已排入佇列的長時間執行回覆 - 會使用已儲存對話參照的 `serviceUrl`。公用雲端預設使用 Teams SDK 公用雲端環境，並允許公用 Teams Connector 主機上的已儲存參照：`https://smba.trafficmanager.net/`。

公用雲端是預設值。一般公用雲端 bot 不需要設定 `channels.msteams.cloud` 或 `channels.msteams.serviceUrl`。

對於非公用 Teams 雲端，請在 Microsoft 發布對應邊界時，設定 `cloud` 以及相符的主動操作邊界：

- `channels.msteams.cloud` 會選取 Teams SDK 雲端預設集，用於驗證、JWT 驗證、權杖服務與 Graph 範圍。
- `channels.msteams.serviceUrl` 會選取 Bot Connector 端點邊界，用於在主動傳送、編輯、刪除、卡片、投票、檔案同意訊息，以及已排入佇列的長時間執行回覆之前驗證已儲存的對話參照。USGov 與 DoD SDK 雲端需要它。對於 China/21Vianet，OpenClaw 會使用 SDK `China` 預設集，且只接受 Azure China Bot Framework channel 主機上的已儲存/已設定服務 URL。

Microsoft 在 Teams 主動訊息文件的 [Create the conversation](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) 區段中發布全域主動 Bot Connector 端點。有可用值時，請使用傳入活動的 `serviceUrl`；否則使用下方 Microsoft 表格。

| Teams 環境 | OpenClaw 設定                                             | 主動操作 `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | 不需要 cloud/serviceUrl 設定                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | 設定 `serviceUrl`；沒有獨立的 Teams SDK 雲端預設集 | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 使用傳入活動的 `serviceUrl`           |

GCC 範例，其中 Microsoft 記載了獨立的主動服務 URL，但 Teams SDK 未公開獨立的 GCC 雲端預設集：

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

`channels.msteams.serviceUrl` 僅限於受支援的 Microsoft Teams Bot Connector 主機。設定服務 URL 時，OpenClaw 會在主動傳送、編輯、刪除、卡片、投票或已排入佇列的長時間執行回覆執行前，檢查已儲存對話的 `serviceUrl` 是否使用相同主機。使用預設公用雲端設定時，如果已儲存對話指向公用 Teams Connector 主機以外的位置，OpenClaw 會採取失敗關閉。變更雲端/服務 URL 設定後，請從該對話接收一則新訊息，讓已儲存的對話參照保持最新。

China/21Vianet 在 Microsoft 的 Teams 主動端點表格中沒有獨立的全域主動 `smba` URL。設定 `cloud: "China"`，讓 Teams SDK 使用 Azure China 驗證、權杖與 JWT 端點。接著，主動傳送會需要來自傳入 China Teams 活動的已儲存對話參照，或在 Azure China Bot Framework channel 邊界（`*.botframework.azure.cn`）上明確設定的服務 URL。Graph 支援的 Teams 輔助功能會在 `cloud: "China"` 停用，直到 OpenClaw 將 Graph 要求路由到 Azure China Graph 端點為止。

### 格式設定

Teams markdown 比 Slack 或 Discord 更受限制：

- 基本格式可運作：**粗體**、_斜體_、`code`、連結。
- 複雜 markdown（表格、巢狀清單）可能無法正確呈現。
- Adaptive Cards 支援投票和語意呈現傳送（見下方）。

## 設定

主要設定（共用 channel 模式請見 [/gateway/configuration](/zh-TW/gateway/configuration)）：

- `channels.msteams.enabled`：啟用/停用 channel。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：bot 憑證。
- `channels.msteams.cloud`：Teams SDK 雲端環境（`Public`、`USGov`、`USGovDoD` 或 `China`；預設 `Public`）。USGov/DoD SDK 雲端請搭配 `serviceUrl` 設定；China 使用 SDK 預設集和已儲存的 Azure China Bot Framework 對話參照，且 Graph 支援的輔助功能會停用，直到 Azure China Graph 路由發布為止。
- `channels.msteams.serviceUrl`：SDK 主動操作的 Bot Connector 服務 URL 邊界。公用雲端使用 SDK 預設值；請為 GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High 或 DoD 設定。當已儲存的對話參照來自 21Vianet 營運的 Teams 時，China 會接受 Azure China Bot Framework channel 主機。
- `channels.msteams.webhook.port`（預設 `3978`）。
- `channels.msteams.webhook.path`（預設 `/api/messages`）。
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（預設 `pairing`）。
- `channels.msteams.allowFrom`：DM 允許清單（建議使用 AAD 物件 ID）。Graph 存取可用時，精靈會在設定期間將名稱解析為 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：緊急切換，用於重新啟用可變的 UPN/顯示名稱比對，以及直接團隊/channel 名稱路由。
- `channels.msteams.textChunkLimit`：傳出文字區塊大小（字元數，預設 `4000`，且無論設定值更高與否，硬性上限皆為 `4000`）。
- `channels.msteams.chunkMode`：`length`（預設）或 `newline`，用於在依長度分塊前，先依空白行（段落邊界）分割。
- `channels.msteams.mediaAllowHosts`：傳入附件主機允許清單（預設為 Microsoft/Teams 網域：Graph、SharePoint/OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`：媒體重試時可附加 Authorization 標頭的允許清單（預設為 Graph + Bot Framework 主機）。
- `channels.msteams.mediaMaxMb`：每個 channel 的媒體大小限制覆寫值，單位 MB。未設定時退回 `agents.defaults.mediaMaxMb`。
- `channels.msteams.requireMention`：在 channel/群組中需要 @mention（預設 `true`）。
- `channels.msteams.replyStyle`：`thread | top-level`（請見 [回覆樣式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每個團隊的覆寫值。
- `channels.msteams.teams.<teamId>.requireMention`：每個團隊的覆寫值。
- `channels.msteams.teams.<teamId>.tools`：每個團隊預設的工具政策覆寫值（`allow`/`deny`/`alsoAllow`），在缺少 channel 覆寫值時使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：每個團隊、每位傳送者的預設工具政策覆寫值（支援 `"*"` 萬用字元）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每個 channel 的覆寫值。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每個 channel 的覆寫值。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每個 channel 的工具政策覆寫值（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每個 channel、每位傳送者的工具政策覆寫值（支援 `"*"` 萬用字元）。
- `toolsBySender` 鍵應使用明確前綴：`channel:`、`id:`、`e164:`、`username:`、`name:`（舊版未加前綴的鍵仍只會對應到 `id:`）。
- `channels.msteams.authType`：驗證類型 - `"secret"`（預設）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 憑證檔案路徑（聯合 + 憑證驗證）。
- `channels.msteams.certificateThumbprint`：憑證指紋；會接受，但驗證不需要。
- `channels.msteams.useManagedIdentity`：啟用受控身分驗證（聯合模式）。
- `channels.msteams.managedIdentityClientId`：使用者指派受控身分的用戶端 ID。
- `channels.msteams.sharePointSiteId`：在群組聊天/channel 中上傳檔案的 SharePoint 網站 ID（請見 [在群組聊天中傳送檔案](#sending-files-in-group-chats)）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`：首次 DM/群組聯絡時顯示的歡迎 Adaptive Card，以及其建議提示按鈕。
- `channels.msteams.responsePrefix`：加到傳出回覆前的文字。
- `channels.msteams.feedbackEnabled`（預設 `true`）、`channels.msteams.feedbackReflection`（預設 `true`）、`channels.msteams.feedbackReflectionCooldownMs`：回覆上的讚/倒讚意見回饋，以及負面意見回饋反思追蹤。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`：用於 SSO 支援流程的 Bot Framework OAuth 連線與委派 Graph 範圍；`sso.enabled: true` 需要 `sso.connectionName`。

## 路由與工作階段

- 工作階段鍵遵循標準代理格式（請見 [/concepts/session](/zh-TW/concepts/session)）：
  - 直接訊息共用主要工作階段（`agent:<agentId>:<mainKey>`）。
  - Channel/群組訊息使用對話 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回覆樣式：執行緒與貼文

Teams 在相同的底層資料模型上有兩種 channel UI 樣式：

| 樣式                    | 說明                                               | 建議的 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **貼文**（傳統）      | 訊息會顯示為卡片，下方有執行緒回覆 | `thread`（預設）       |
| **執行緒**（類 Slack） | 訊息會線性流動，更像 Slack                   | `top-level`              |

**問題：**Teams API 不會公開 channel 使用哪一種 UI 樣式。如果使用錯誤的 `replyStyle`：

- 在執行緒樣式 channel 中使用 `thread` → 回覆會尷尬地呈現為巢狀。
- 在貼文樣式 channel 中使用 `top-level` → 回覆會顯示為獨立的頂層貼文，而不是在執行緒中。

**解法：**依據 channel 的設定方式，為每個 channel 設定 `replyStyle`：

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

當 bot 將回覆傳送到 channel 時，`replyStyle` 會從最具體的覆寫值往下解析到預設值。第一個非 `undefined` 值勝出：

1. **每個 channel** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每個團隊** - `channels.msteams.teams.<teamId>.replyStyle`
3. **全域** - `channels.msteams.replyStyle`
4. **隱含預設值** - 從 `requireMention` 推導：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你在全域設定 `requireMention: false`，但未明確設定 `replyStyle`，Posts 樣式頻道中的提及即使傳入訊息是執行緒回覆，也會顯示為最上層貼文。請在全域、團隊或頻道層級固定設定 `replyStyle: "thread"`，以避免意外情況。

對於傳送到已儲存頻道對話的主動傳送（排入佇列的工具呼叫回覆、長時間執行的代理），會套用相同的團隊/頻道解析；群組聊天和個人（DM）對話在主動傳送時一律解析為 `top-level`，不受 `replyStyle` 影響。

### 執行緒脈絡保留

當 `replyStyle: "thread"` 生效，且機器人是在頻道執行緒內被 @提及時，OpenClaw 會將原始執行緒根節點重新附加到傳出對話參照（`19:...@thread.tacv2;messageid=<root>`），讓回覆落在同一個執行緒內。這同時適用於即時（回合內）傳送，以及在 Bot Framework 回合脈絡過期後進行的主動傳送（例如長時間執行的代理、透過 `mcp__openclaw__message` 排入佇列的工具呼叫回覆）。

執行緒根節點取自對話參照上儲存的 `threadId`。早於 `threadId` 的舊儲存參照會退回使用 `activityId`（最後播種該對話的任何傳入活動），因此既有部署無需重新播種也能持續運作。

當 `replyStyle: "top-level"` 生效時，頻道執行緒中的傳入訊息會刻意以新的最上層貼文回覆；不會附加執行緒尾碼。這對 Threads 樣式頻道是正確的；如果你預期收到執行緒回覆卻看到最上層貼文，代表該頻道的 `replyStyle` 設定不正確。

## 附件與圖片

**目前限制：**

- **DM：** 圖片和檔案附件可透過 Teams 機器人檔案 API 運作。
- **頻道/群組：** 附件存放在 M365 儲存空間（SharePoint/OneDrive）。網路鉤子承載內容只包含 HTML stub，不包含實際檔案位元組。**需要 Graph API 權限** 才能下載頻道附件。
- 對於明確以檔案優先的傳送，請使用 `action=upload-file` 搭配 `media` / `filePath` / `path`；選用的 `message` 會成為隨附文字/註解，而 `filename`（或 `title`）會覆寫上傳名稱。

沒有 Graph 權限時，包含圖片的頻道訊息會以純文字形式抵達（機器人無法存取圖片內容）。
預設情況下，OpenClaw 只會從 Microsoft/Teams 主機名稱下載媒體。可用 `channels.msteams.mediaAllowHosts` 覆寫（使用 `["*"]` 允許任何主機）。
Authorization 標頭只會附加到 `channels.msteams.mediaAuthAllowHosts` 中的主機（預設為 Graph + Bot Framework 主機）。請嚴格限制此清單（避免多租用戶尾碼）。

## 在群組聊天中傳送檔案

機器人可以使用內建的 FileConsentCard 流程在 DM 中傳送檔案。**在群組聊天/頻道中傳送檔案** 需要額外設定：

| 脈絡                     | 檔案傳送方式                                 | 需要的設定                                      |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → 使用者接受 → 機器人上傳   | 開箱即用                                        |
| **群組聊天/頻道**        | 上傳到 SharePoint → 分享連結                | 需要 `sharePointSiteId` + Graph 權限            |
| **圖片（任何脈絡）**     | Base64 編碼內嵌                             | 開箱即用                                        |

### 為什麼群組聊天需要 SharePoint

機器人沒有個人的 OneDrive 磁碟機（`/me/drive` 不適用於應用程式身分）。若要在群組聊天/頻道中傳送檔案，機器人會上傳到 **SharePoint 網站**並建立分享連結。

### 設定

1. 在 Entra ID (Azure AD) → App Registration 中**新增 Graph API 權限**：
   - `Sites.ReadWrite.All`（Application）- 將檔案上傳到 SharePoint。
   - `Chat.Read.All`（Application）- 選用，啟用每位使用者的分享連結。
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
| 僅 `Sites.ReadWrite.All`                | 組織範圍分享連結（組織內任何人都可存取）                  |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 每位使用者分享連結（只有聊天成員可存取）                  |

每位使用者分享更安全，因為只有聊天參與者能存取檔案。如果缺少 `Chat.Read.All`，機器人會退回使用組織範圍分享。

### 備援行為

| 情境                                             | 結果                                               |
| ------------------------------------------------ | -------------------------------------------------- |
| 群組聊天 + 檔案 + 已設定 `sharePointSiteId`      | 上傳到 SharePoint，傳送分享連結                   |
| 群組聊天 + 檔案 + 沒有 `sharePointSiteId`        | 嘗試 OneDrive 上傳（可能失敗），只傳送文字        |
| 個人聊天 + 檔案                                 | FileConsentCard 流程（不需 SharePoint 即可運作）  |
| 任何脈絡 + 圖片                                 | Base64 編碼內嵌（不需 SharePoint 即可運作）       |

### 檔案儲存位置

上傳的檔案會儲存在已設定 SharePoint 網站預設文件庫中的 `/OpenClawShared/` 資料夾。

## 投票（Adaptive Cards）

OpenClaw 會將 Teams 投票以 Adaptive Cards 傳送（沒有原生 Teams 投票 API）。

- 命令列介面：`openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 票數由閘道記錄在 `state/openclaw.sqlite` 下的 OpenClaw 外掛狀態 SQLite。
- 既有的 `msteams-polls.json` 檔案會由 `openclaw doctor --fix` 匯入，而不是由執行中的外掛匯入。
- 閘道必須保持在線才能記錄票數。
- 投票不會自動發布結果摘要，目前也還沒有投票結果命令列介面。

## 呈現卡片

使用 `message` 工具、命令列介面或一般回覆傳遞，將語意呈現承載內容傳送給 Teams 使用者或對話。OpenClaw 會依據通用呈現合約，將其轉譯為 Teams Adaptive Cards。

`presentation` 參數接受語意區塊。提供 `presentation` 時，訊息文字是選用的。按鈕會轉譯為 Adaptive Card submit 或 URL 動作。選單在 Teams 轉譯器中不是原生支援，因此 OpenClaw 會在傳遞前將其降級為可讀文字。

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

如需目標格式詳細資訊，請參閱下方的[目標格式](#target-formats)。

## 目標格式

MSTeams 目標使用前綴來區分使用者和對話：

| 目標類型            | 格式                             | 範例                                                                                                   |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 使用者（依 ID）     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| 使用者（依名稱）    | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                                                                    |
| 群組/頻道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| 群組/頻道（原始）   | `<conversation-id>`              | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces`，或裸露的 `a:`/`8:orgid:`/`29:` Bot Framework id |

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
沒有 `user:` 前綴時，名稱預設會走群組或團隊解析。以顯示名稱指定人員時，請一律使用 `user:`。
</Note>

## 主動訊息

- 只有在使用者互動**之後**，才可能傳送主動訊息，因為 OpenClaw 會在該時間點儲存對話參照。
- 如需 `dmPolicy` 和允許清單閘控，請參閱 [/gateway/configuration](/zh-TW/gateway/configuration)。

## 團隊與頻道 ID（常見陷阱）

Teams URL 中的 `groupId` 查詢參數**不是**用於設定的團隊 ID。請改從 URL 路徑擷取 ID：

**團隊 URL：**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**頻道 URL：**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**用於設定：**

- 團隊鍵 = `/team/` 後方的路徑區段（URL 解碼後，例如 `19:Bk4j...@thread.tacv2`；較舊的租用戶可能顯示 `@thread.skype`，這也有效）。
- 頻道鍵 = `/channel/` 後方的路徑區段（URL 解碼後）。
- 對於 OpenClaw 路由，請**忽略** `groupId` 查詢參數。它是 Microsoft Entra 群組 ID，不是傳入 Teams 活動中使用的 Bot Framework 對話 ID。

## 私人頻道

機器人在私人頻道中的支援有限：

| 功能                         | 標準頻道 | 私人頻道             |
| ---------------------------- | -------- | -------------------- |
| 機器人安裝                   | 是       | 有限                 |
| 即時訊息（網路鉤子）         | 是       | 可能無法運作         |
| RSC 權限                     | 是       | 行為可能不同         |
| @提及                        | 是       | 如果機器人可存取     |
| Graph API 歷程               | 是       | 是（具備權限時）     |

**如果私人頻道無法運作，可使用的因應方式：**

1. 使用標準頻道進行機器人互動。
2. 使用私訊；使用者永遠可以直接傳訊息給機器人。
3. 使用 Graph API 進行歷史存取（需要 `ChannelMessage.Read.All`）。

## 疑難排解

### 常見問題

- **圖片未顯示在頻道中：** 缺少 Graph 權限或管理員同意。重新安裝 Teams 應用程式，並完全結束/重新開啟 Teams。
- **頻道中沒有回應：** 預設需要提及；設定 `channels.msteams.requireMention=false`，或依團隊/頻道設定。
- **版本不符（Teams 仍顯示舊資訊清單）：** 移除 + 重新加入應用程式，並完全結束 Teams 以重新整理。
- **網路鉤子傳回 401 Unauthorized：** 手動測試時若沒有 Azure JWT，這是預期情況；表示端點可連線，但驗證失敗。請使用 Azure Web Chat 正確測試。

### 資訊清單上傳錯誤

- **「Icon file cannot be empty」：** 資訊清單參照了 0 位元組的圖示檔案。建立有效的 PNG 圖示（`outline.png` 為 32x32，`color.png` 為 192x192）。
- **「webApplicationInfo.Id already in use」：** 應用程式仍安裝在其他團隊/聊天中。請先找到並解除安裝，或等待 5-10 分鐘讓變更傳播。
- **上傳時出現「Something went wrong」：** 改透過 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上傳，開啟瀏覽器 DevTools (F12) → Network 分頁，並檢查回應本文中的實際錯誤。
- **側載失敗：** 嘗試使用「Upload an app to your org's app catalog」而不是「Upload a custom app」；這通常可以繞過側載限制。

### RSC 權限無法運作

1. 確認 `webApplicationInfo.id` 與你的機器人 App ID 完全相符。
2. 重新上傳應用程式，並在團隊/聊天中重新安裝。
3. 檢查你的組織管理員是否封鎖了 RSC 權限。
4. 確認你使用的是正確範圍：團隊使用 `ChannelMessage.Read.Group`，群組聊天使用 `ChatMessage.Read.Chat`。

## 參考資料

- [建立 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 設定指南
- [Teams 開發者入口網站](https://dev.teams.microsoft.com/apps) - 建立/管理 Teams 應用程式
- [Teams 應用程式資訊清單結構描述](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收頻道訊息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 權限參考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 機器人檔案處理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（頻道/群組需要 Graph）
- [主動傳訊](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用於機器人管理的 Teams 命令列介面

## 相關

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
