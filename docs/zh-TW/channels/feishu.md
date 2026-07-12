---
read_when:
    - 你想要連接 Feishu/Lark 機器人
    - 你正在設定 Feishu 頻道
summary: Feishu 機器人概覽、功能與設定
title: Feishu
x-i18n:
    generated_at: "2026-07-12T14:17:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54f4d8a73fb1e7c2af970fa7dc71f953074aa49c4bc4aed0d24671c74a84ebe9
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw 透過官方 `@openclaw/feishu` 外掛連接 Feishu/Lark（一站式協作平台）：支援機器人私訊、群組聊天、串流卡片回覆，以及 Feishu 文件／知識庫／雲端硬碟／多維表格工具。

**狀態：**機器人私訊與群組聊天已可用於正式環境。WebSocket 是預設的事件傳輸方式（不需要公開 URL）；也可選用網路鉤子模式。

## 快速開始

<Note>
需要 OpenClaw 2026.5.29 或以上版本。執行 `openclaw --version` 檢查版本。使用 `openclaw update` 升級。
</Note>

<Steps>
  <Step title="執行頻道設定精靈">
  ```bash
  openclaw channels login --channel feishu
  ```
  如果缺少 `@openclaw/feishu` 外掛，此命令會先安裝外掛，接著引導你完成設定：

- **手動設定**：貼上來自 Feishu Open Platform（`https://open.feishu.cn`）或 Lark Developer（`https://open.larksuite.com`）的 App ID 與 App Secret。
- **QR 設定**：在 Feishu 應用程式中掃描 QR Code，自動建立機器人。此流程會將私訊限制為僅限你自己的帳號（`dmPolicy: "allowlist"` 搭配你的 `open_id`）。

精靈也會詢問 API 網域（Feishu 或 Lark）與群組政策。如果中國版 Feishu 行動應用程式掃描 QR Code 後沒有反應，請重新執行設定並選擇手動設定。
</Step>

  <Step title="設定完成後，重新啟動閘道以套用變更">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## 存取控制

### 私訊

設定 `channels.feishu.dmPolicy`（預設值：`pairing`），以控制誰可以私訊機器人：

| 值            | 行為                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | 未知使用者會收到配對碼；透過命令列介面核准                                                             |
| `"allowlist"` | 只有列於 `allowFrom` 的使用者可以聊天                                                                   |
| `"open"`      | 公開私訊；設定驗證要求 `allowFrom` 包含 `"*"`。非萬用字元項目仍會縮小存取範圍                           |

**核准配對要求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群組聊天

**群組政策**（`channels.feishu.groupPolicy`，預設值：`allowlist`）：

| 值            | 行為                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | 回應群組中的所有訊息                                                                         |
| `"allowlist"` | 僅回應 `groupAllowFrom` 中的群組，或在 `groups.<chat_id>` 下明確設定的群組                    |
| `"disabled"`  | 停用所有群組訊息；明確的 `groups.<chat_id>` 項目不會覆寫此設定                                |

**提及要求**（`channels.feishu.requireMention`）：

- 預設需要 @提及，但有效群組政策為 `"open"` 時除外；在該模式下預設為 `false`，讓無法包含提及的訊息（例如圖片）仍可送達代理程式。
- 明確設定為 `true` 或 `false` 即可覆寫；每個群組的覆寫設定為：`channels.feishu.groups.<chat_id>.requireMention`。
- 僅用於廣播的 `@all` 和 `@_all` 不會視為提及機器人。同時提及 `@all` 並直接提及機器人的訊息，仍會視為提及機器人。

## 群組設定範例

### 允許所有群組，不需要 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // 在 "open" 下，requireMention 預設為 false
    },
  },
}
```

### 允許所有群組，但仍要求 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 僅允許特定群組

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // 群組 ID 的格式如下：oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

在 `allowlist` 模式下，你也可以新增明確的 `groups.<chat_id>` 項目來允許群組。明確項目不會覆寫 `groupPolicy: "disabled"`。`groups.*` 下的萬用字元預設值會設定相符的群組，但本身不會允許這些群組。

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### 限制群組內的傳送者

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // 使用者 open_id 的格式如下：ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` 會為所有群組設定相同的傳送者允許清單；每個群組的 `allowFrom` 優先適用。

<a id="get-groupuser-ids"></a>

## 取得群組／使用者 ID

### 群組 ID（`chat_id`，格式：`oc_xxx`）

在 Feishu/Lark 中開啟群組，按一下右上角的選單圖示，然後前往 **Settings**。群組 ID（`chat_id`）會列在設定頁面中。

![取得群組 ID](/images/feishu-get-group-id.png)

### 使用者 ID（`open_id`，格式：`ou_xxx`）

啟動閘道、傳送私訊給機器人，然後檢查日誌：

```bash
openclaw logs --follow
```

在日誌輸出中尋找 `open_id`。你也可以檢查待處理的配對要求：

```bash
openclaw pairing list feishu
```

## 常用命令

| 命令      | 說明                     |
| --------- | ------------------------ |
| `/status` | 顯示機器人狀態           |
| `/reset`  | 重設目前的工作階段       |
| `/model`  | 顯示或切換 AI 模型       |

<Note>
Feishu/Lark 不支援原生斜線命令選單，因此請將這些命令當作純文字訊息傳送。
</Note>

## 疑難排解

### 機器人在群組聊天中沒有回應

1. 確認機器人已加入群組
2. 確認你已 @提及機器人（預設為必要）
3. 確認 `groupPolicy` 不是 `"disabled"`
4. 檢查日誌：`openclaw logs --follow`

### 機器人收不到訊息

1. 確認機器人已在 Feishu Open Platform / Lark Developer 中發布並通過核准
2. 確認事件訂閱包含 `im.message.receive_v1`
3. 確認已選取 **persistent connection**（WebSocket）
4. 確認已授予所有必要的權限範圍
5. 確認閘道正在執行：`openclaw gateway status`
6. 檢查日誌：`openclaw logs --follow`

### QR 設定在 Feishu 行動應用程式中沒有反應

1. 重新執行設定：`openclaw channels login --channel feishu`
2. 選擇手動設定
3. 在 Feishu Open Platform 中建立自建應用程式，並複製其 App ID 和 App Secret
4. 將這些認證資訊貼到設定精靈中

### App Secret 外洩

1. 在 Feishu Open Platform / Lark Developer 中重設 App Secret
2. 更新設定中的值
3. 重新啟動閘道：`openclaw gateway restart`

## 進階設定

### 多個帳號

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "主要機器人",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "備用機器人",
          enabled: false,
        },
      },
    },
  },
}
```

當對外 API 未指定 `accountId` 時，`defaultAccount` 控制要使用的帳號。帳號項目會繼承頂層設定；大多數頂層鍵都可以針對每個帳號覆寫。
`accounts.<id>.tts` 使用與 `messages.tts` 相同的結構，並在全域 TTS 設定上進行深層合併，因此多機器人的 Feishu 設定可以將共用的供應商認證資訊保留在全域，同時僅針對每個帳號覆寫語音、模型、角色或自動模式。

### 訊息限制

- `textChunkLimit` - 對外文字區塊大小（預設值：`4000` 個字元）
- `chunkMode` - `"length"`（預設值）會在達到限制時分割；`"newline"` 優先依換行邊界分割
- `mediaMaxMb` - 媒體上傳／下載限制（預設值：`30` MB）

### 串流

Feishu/Lark 支援透過互動式卡片（Card Kit 串流 API）進行串流回覆。啟用後，機器人在產生文字時會即時更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // 啟用串流卡片輸出（預設值：true）
      blockStreaming: true, // 選擇啟用已完成區塊的串流
    },
  },
}
```

設定 `streaming: false` 可在單一訊息中傳送完整回覆；`renderMode: "raw"`（使用純文字而非卡片）也會停用串流卡片。`blockStreaming` 預設為關閉；只有在你希望於最終回覆前先送出已完成的助理區塊時才啟用。

### 配額最佳化

使用兩個選用旗標來減少 Feishu/Lark API 呼叫次數：

- `typingIndicator`（預設值為 `true`）：設定為 `false` 可略過輸入中反應的呼叫
- `resolveSenderNames`（預設值為 `true`）：設定為 `false` 可略過傳送者個人資料查詢

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### 群組工作階段範圍與主題討論串

`channels.feishu.groupSessionScope`（頂層、每個帳號或每個群組）控制群組訊息如何對應至代理程式工作階段：

| 值                       | 工作階段                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| `"group"`（預設值）      | 每個群組聊天一個工作階段                                         |
| `"group_sender"`         | 每個（群組 + 傳送者）一個工作階段                                |
| `"group_topic"`          | 每個主題討論串一個工作階段；否則使用群組工作階段                 |
| `"group_topic_sender"`   | 每個（主題 + 傳送者）一個工作階段；否則使用（群組 + 傳送者）     |

對於主題範圍，Feishu/Lark 原生主題群組會使用事件 `thread_id`（`omt_*`）作為標準主題工作階段鍵。如果原生主題起始事件省略 `thread_id`，OpenClaw 會先從 Feishu 補齊此資訊，再路由該輪互動。OpenClaw 轉換成討論串的一般群組回覆，會繼續使用回覆根訊息 ID（`om_*`），讓第一輪與後續輪次維持在同一個工作階段中。

設定 `replyInThread: "enabled"`（頂層或每個群組）可讓機器人回覆建立或繼續 Feishu 主題討論串，而不是直接在原處回覆。`topicSessionMode` 是 `groupSessionScope` 已棄用的前身；請優先使用 `groupSessionScope`。

### Feishu 工作區工具

此外掛提供用於 Feishu 文件、聊天、知識庫、雲端儲存空間、權限與多維表格的代理程式工具，以及對應的 Skills（`feishu-doc`、`feishu-drive`、`feishu-perm`、`feishu-wiki`）。工具系列由 `channels.feishu.tools` 控制：

| 鍵              | 工具                                          | 預設值             |
| --------------- | --------------------------------------------- | ------------------ |
| `tools.doc`     | `feishu_doc` 文件操作                         | `true`             |
| `tools.chat`    | `feishu_chat` 聊天資訊與成員查詢              | `true`             |
| `tools.wiki`    | `feishu_wiki` 知識庫（需要 `doc`）            | `true`             |
| `tools.drive`   | `feishu_drive` 雲端儲存空間                   | `true`             |
| `tools.perm`    | `feishu_perm` 權限管理                         | `false`（敏感）    |
| `tools.scopes`  | `feishu_app_scopes` 應用程式權限範圍診斷      | `true`             |
| `tools.bitable` | `feishu_bitable_*` 多維表格／Base 操作         | `true`             |

`tools.base` 是 `tools.bitable` 的別名；兩者皆設定時，以明確的 `bitable` 值為準。每個帳號的控制設定位於 `accounts.<id>.tools` 下。

授予 `drive:drive.metadata:readonly`，以便在根目錄之外直接使用 `feishu_drive info` 查詢，除非應用程式已具有完整的 `drive:drive` 範圍。若兩者皆未授予，`info` 仍可透過 `drive:drive:readonly` 使用舊版根目錄查詢。

### ACP 工作階段

Feishu/Lark 的私訊和群組討論串訊息支援 ACP。Feishu/Lark ACP 由文字命令驅動，沒有原生斜線命令選單，因此請直接在對話中傳送 `/acp ...` 訊息。

#### 持久 ACP 綁定

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### 從聊天啟動 ACP

在 Feishu/Lark 私訊或討論串中：

```text
/acp spawn codex --thread here
```

`--thread here` 適用於私訊和 Feishu/Lark 討論串訊息。已綁定對話中的後續訊息會直接路由至該 ACP 工作階段。

### 多代理程式路由

使用 `bindings` 將 Feishu/Lark 私訊或群組路由至不同的代理程式。

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

路由欄位：

- `match.channel`：`"feishu"`
- `match.peer.kind`：`"direct"`（私訊）或 `"group"`（群組聊天）
- `match.peer.id`：使用者 Open ID（`ou_xxx`）或群組 ID（`oc_xxx`）

查詢提示請參閱[取得群組／使用者 ID](#get-groupuser-ids)。

## 每位使用者的代理程式隔離（動態建立代理程式）

啟用 `dynamicAgentCreation`，即可為每位私訊使用者自動建立**隔離的代理程式執行個體**。每位使用者都會擁有自己的：

- 獨立工作區目錄
- 個別的 `USER.md` / `SOUL.md` / `MEMORY.md`
- 私人對話記錄
- 隔離的 Skills 和狀態

對於需要讓每位使用者擁有私人 AI 助理體驗的公開機器人，這項功能至關重要。

<Note>
動態綁定包含正規化的 Feishu `accountId`，因此預設帳號和具名帳號都會將每位傳送者路由至正確的動態代理程式。

如果具名帳號在舊版中建立了未限定範圍的動態代理程式，該舊版代理程式仍會計入 `maxAgents`。移除前，請確認預設帳號未使用它，或暫時提高 `maxAgents`；OpenClaw 無法安全推斷含糊的舊版狀態屬於哪個帳號。
</Note>

### 快速設定

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 關鍵設定：讓每位使用者的私訊成為其「主要工作階段」
    // 自動載入 USER.md / SOUL.md / MEMORY.md
    // 如需更強的隔離，請改用 "per-channel-peer"
    dmScope: "main",
  },
}
```

### 運作方式

新使用者第一次傳送私訊時：

1. 頻道會產生唯一的 `agentId`：預設帳號使用 `feishu-{user_open_id}`，具名帳號則使用有長度限制且帶有帳號前綴的身分摘要
2. 在 `workspaceTemplate` 路徑建立新工作區
3. 註冊代理程式，並為此使用者建立綁定
4. 工作區輔助程式會在首次存取時確保啟動檔案（`AGENTS.md`、`SOUL.md`、`USER.md` 等）存在
5. 將此使用者日後的所有訊息路由至其專屬代理程式

### 設定選項

| 設定                                                     | 說明                                 | 預設值                               |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | 啟用自動為每位使用者建立代理程式     | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動態代理程式工作區的路徑範本         | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 代理程式目錄名稱範本                 | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 可建立的動態代理程式數量上限         | 無限制                               |

範本變數：

- `{agentId}` - 產生的代理程式 ID（例如 `feishu-ou_xxxxxx` 或 `feishu-support-<identity_digest>`）
- `{userId}` - 傳送者的 Feishu open_id（例如 `ou_xxxxxx`）

### 工作階段範圍

`session.dmScope` 控制如何將私訊對應至代理程式工作階段。這是會影響所有頻道的**全域設定**。

| 值                           | 行為                                                               | 最適合的情境                                                         |
| ---------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `"main"`                     | 每位使用者的私訊會對應至其代理程式的主要工作階段                   | 希望自動載入 `USER.md` / `SOUL.md` 的單一使用者機器人                |
| `"per-peer"`                 | 每個對等端都有個別工作階段（不論頻道）                             | 僅依傳送者身分進行隔離                                               |
| `"per-channel-peer"`         | 每個（頻道 + 使用者）組合都有個別工作階段                           | 需要更強隔離的公開多使用者機器人                                     |
| `"per-account-channel-peer"` | 每個（帳號 + 頻道 + 使用者）組合都有個別工作階段                    | 需要帳號層級工作階段隔離的多帳號機器人                               |

**取捨**：使用 `"main"` 可自動載入啟動檔案（`USER.md`、`SOUL.md`、`MEMORY.md`），但這表示所有頻道的全部私訊都會共用相同的工作階段索引鍵模式。對於隔離比自動載入啟動檔案更重要的公開多使用者機器人，請考慮使用 `"per-channel-peer"`，並手動管理啟動檔案。

<Note>
當具名 Feishu 帳號需要為同一位傳送者保留個別工作階段時，請使用 `"per-account-channel-peer"`。動態綁定會保留帳號範圍。
</Note>

### 典型的多使用者部署

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 請依隔離需求選擇 dmScope：
    // 使用 "main" 可自動載入啟動檔案；使用 "per-channel-peer" 可獲得更強的隔離
    dmScope: "main",
  },
  bindings: [], // 留空 - 動態代理程式會自動綁定
}
```

### 驗證

檢查閘道日誌，確認動態建立功能正常運作：

```text
feishu：正在為使用者 ou_xxxxxx 建立動態代理程式 "feishu-ou_xxxxxx"
  工作區：/home/user/.openclaw/workspace-feishu-ou_xxxxxx
  代理程式目錄：/home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

列出所有已建立的工作區：

```bash
ls -la ~/.openclaw/workspace-*
```

### 注意事項

- **工作區隔離**：每位使用者都會擁有自己的工作區目錄和代理程式執行個體。在一般訊息流程中，使用者無法查看彼此的對話記錄或檔案。
- **安全邊界**：這是訊息情境隔離機制，不是用於抵禦惡意共同租戶的安全邊界。代理程式程序和主機環境仍為共用。
- **必須維持啟用設定寫入**：動態建立代理程式會將代理程式和綁定寫入設定；當 `channels.feishu.configWrites` 為 `false` 時會略過此功能（預設：啟用）。
- **`bindings` 應為空白**：動態代理程式會自動註冊自己的綁定
- **升級路徑**：現有的手動綁定可繼續與動態代理程式並存
- **`session.dmScope` 是全域設定**：這會影響所有頻道，而不只是 Feishu

## 設定參考

完整設定：[閘道設定](/zh-TW/gateway/configuration)

| 設定                                                     | 說明                                                                                 | 預設值                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | 啟用／停用此頻道                                                                     | `true`                               |
| `channels.feishu.domain`                                 | API 網域（`feishu`、`lark` 或 `https://` 基底 URL）                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | 事件傳輸方式（`websocket` 或 `webhook`）                                             | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 對外路由的預設帳號                                                                   | `default`                            |
| `channels.feishu.verificationToken`                      | 網路鉤子模式的必要設定                                                               | -                                    |
| `channels.feishu.encryptKey`                             | 網路鉤子模式的必要設定                                                               | -                                    |
| `channels.feishu.webhookPath`                            | 網路鉤子路由路徑                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | 網路鉤子繫結主機                                                                     | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | 網路鉤子繫結連接埠                                                                   | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | 應用程式 ID                                                                          | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | 應用程式密鑰                                                                         | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | 個別帳號的網域覆寫                                                                   | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | 個別帳號的 TTS 覆寫                                                                  | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | 私訊政策（`pairing`、`allowlist`、`open`）                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | 私訊允許清單（open_id 清單）                                                         | -                                    |
| `channels.feishu.groupPolicy`                            | 群組政策（`open`、`allowlist`、`disabled`）                                          | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | 群組允許清單                                                                         | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | 套用至所有群組的傳送者允許清單                                                       | -                                    |
| `channels.feishu.requireMention`                         | 群組中必須使用 @提及                                                                 | `true`（政策為 `open` 時是 `false`） |
| `channels.feishu.groups.<chat_id>.requireMention`        | 個別群組的 @提及覆寫；在允許清單模式下，明確指定的 ID 也會允許該群組                | 繼承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 啟用／停用特定群組                                                                   | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | 個別群組的傳送者允許清單（覆寫 `groupSenderAllowFrom`）                              | -                                    |
| `channels.feishu.groupSessionScope`                      | 群組工作階段對應（`group`、`group_sender`、`group_topic`、`group_topic_sender`）      | `group`                              |
| `channels.feishu.replyInThread`                          | 機器人回覆會建立／延續主題討論串（`disabled`、`enabled`）                            | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | 傳入的表情回應事件（`off`、`own`、`all`）                                            | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | 啟用自動為每位使用者建立代理程式                                                     | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動態代理程式工作區的路徑範本                                                         | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 代理程式目錄名稱範本                                                                 | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 可建立的動態代理程式數量上限                                                         | 無限制                               |
| `channels.feishu.textChunkLimit`                         | 訊息分塊大小                                                                         | `4000`                               |
| `channels.feishu.chunkMode`                              | 分塊方式（`length` 或 `newline`）                                                     | `length`                             |
| `channels.feishu.mediaMaxMb`                             | 媒體大小限制                                                                         | `30`                                 |
| `channels.feishu.renderMode`                             | 回覆呈現方式（`auto`、`raw`、`card`）                                                | `auto`                               |
| `channels.feishu.streaming`                              | 串流卡片輸出                                                                         | `true`                               |
| `channels.feishu.blockStreaming`                         | 已完成區塊的回覆串流                                                                 | `false`                              |
| `channels.feishu.typingIndicator`                        | 傳送輸入中表情回應                                                                   | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 解析傳送者顯示名稱                                                                   | `true`                               |
| `channels.feishu.configWrites`                           | 允許由頻道發起設定寫入（動態代理程式需要此設定）                                     | `true`                               |
| `channels.feishu.tools.doc`                              | 啟用文件工具                                                                         | `true`                               |
| `channels.feishu.tools.chat`                             | 啟用聊天資訊工具                                                                     | `true`                               |
| `channels.feishu.tools.wiki`                             | 啟用知識庫工具（需要 `doc`）                                                         | `true`                               |
| `channels.feishu.tools.drive`                            | 啟用雲端儲存空間工具                                                                 | `true`                               |
| `channels.feishu.tools.perm`                             | 啟用權限管理工具                                                                     | `false`                              |
| `channels.feishu.tools.scopes`                           | 啟用應用程式範圍診斷工具                                                             | `true`                               |
| `channels.feishu.tools.bitable`                          | 啟用 Bitable/Base 工具                                                               | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` 的別名；兩者皆設定時以明確的 `bitable` 為準          | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | 個別帳號的 Bitable/Base 工具開關                                                      | 繼承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | 個別帳號的 `tools.bitable` 別名                                                       | 繼承                                 |

## 支援的訊息類型

### 接收

- ✅ 文字
- ✅ 富文字（貼文）
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片／媒體
- ✅ 貼圖

傳入的 Feishu/Lark 音訊訊息會正規化為媒體預留位置，而不是原始的
`file_key` JSON。設定 `tools.media.audio` 後，OpenClaw 會下載語音留言資源，
並在代理程式執行前進行共用音訊轉錄，讓代理程式收到口述內容的逐字稿。如果
Feishu 直接在音訊承載內容中包含逐字稿文字，便會使用該文字，不再呼叫一次
ASR。若沒有音訊轉錄提供者，代理程式仍會收到 `<media:audio>` 預留位置及
已儲存的附件，而不是原始的 Feishu 資源承載內容。

### 傳送

- ✅ 文字
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片／媒體
- ✅ 互動式卡片（包括串流更新）
- ⚠️ 富文字（貼文樣式格式；不支援完整的 Feishu/Lark 編寫功能）

原生 Feishu/Lark 音訊泡泡使用 Feishu `audio` 訊息類型，且上傳媒體必須為
Ogg/Opus（`file_type: "opus"`）。現有的 `.opus` 和 `.ogg` 媒體會直接以
原生音訊傳送。只有當回覆要求以語音傳送時（`audioAsVoice`／訊息工具的
`asVoice`，包括 TTS 語音留言回覆），才會使用 `ffmpeg` 將 MP3/WAV/M4A
及其他可能的音訊格式轉碼為 48kHz Ogg/Opus。一般 MP3 附件仍會維持為普通
檔案。如果缺少 `ffmpeg` 或轉換失敗，OpenClaw 會改以檔案附件傳送，並記錄
原因。

### 討論串與回覆

- ✅ 行內回覆
- ✅ 討論串回覆
- ✅ 回覆討論串訊息時，媒體回覆仍會保留討論串關聯

主題群組工作階段路由詳見
[群組工作階段範圍與主題討論串](#group-session-scope-and-topic-threads)。

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與安全強化
