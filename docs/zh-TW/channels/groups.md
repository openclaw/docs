---
read_when:
    - 變更群組聊天行為或提及閘控
sidebarTitle: Groups
summary: 跨各介面的群組聊天行為 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 群組
x-i18n:
    generated_at: "2026-04-30T02:46:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 在各個介面上一致地處理群組聊天：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 初學者簡介（2 分鐘）

OpenClaw「存在」於你自己的訊息帳號中。沒有獨立的 WhatsApp bot 使用者。如果**你**在某個群組中，OpenClaw 就能看見該群組並在其中回應。

預設行為：

- 群組受到限制（`groupPolicy: "allowlist"`）。
- 除非你明確停用提及閘控，否則回覆需要提及。
- 群組/頻道中的一般最終回覆預設為私人。可見的聊天室輸出會使用 `message` 工具。

換句話說：允許清單中的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**TL;DR**

- **私訊存取**由 `*.allowFrom` 控制。
- **群組存取**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及閘控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息會發生什麼）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 可見回覆

對於群組/頻道聊天室，OpenClaw 預設為 `messages.groupChat.visibleReplies: "message_tool"`。
這表示 agent 仍會處理該回合，並可更新記憶/session 狀態，但它的一般最終答案不會自動貼回聊天室。若要可見地發言，agent 會使用 `message(action=send)`。

對於直接聊天和任何其他來源回合，使用 `messages.visibleReplies: "message_tool"` 可在全域套用相同的僅工具可見回覆行為。`messages.groupChat.visibleReplies` 仍是群組/頻道聊天室更具體的覆寫設定。

這取代了舊模式，也就是強迫模型在多數潛伏模式回合中回答 `NO_REPLY`。在僅工具模式中，沒有任何可見動作只代表沒有呼叫 message 工具。

agent 在僅工具模式下工作時仍會傳送輸入指示器。這些回合的預設群組輸入模式會從「message」升級為「instant」，因為在 agent 決定是否呼叫 message 工具之前，可能永遠不會有一般 assistant 訊息文字。明確的輸入模式設定仍會優先。

若要恢復群組/頻道聊天室的舊版自動最終回覆：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

若要要求每個來源聊天的可見輸出都透過 message 工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生 slash commands（Discord、Telegram，以及其他支援原生命令的介面）會繞過 `visibleReplies: "message_tool"`，並一律可見回覆，讓頻道原生命令 UI 取得預期回應。這只適用於已驗證的原生命令回合；文字輸入的 `/...` 命令和一般聊天回合仍會遵循已設定的群組預設值。

## 脈絡可見性與允許清單

群組安全涉及兩種不同控制：

- **觸發授權**：誰可以觸發 agent（`groupPolicy`、`groups`、`groupAllowFrom`、頻道專屬允許清單）。
- **脈絡可見性**：哪些補充脈絡會注入模型（回覆文字、引文、討論串歷史、轉寄中繼資料）。

預設情況下，OpenClaw 會優先維持一般聊天行為，並大多保留接收到的脈絡。這表示允許清單主要決定誰可以觸發動作，而不是每個引用或歷史片段的通用遮蔽邊界。

<AccordionGroup>
  <Accordion title="目前行為依頻道而異">
    - 某些頻道已在特定路徑中對補充脈絡套用以傳送者為基礎的篩選（例如 Slack 討論串種子、Matrix 回覆/討論串查詢）。
    - 其他頻道仍會照接收內容傳遞引用/回覆/轉寄脈絡。

  </Accordion>
  <Accordion title="強化方向（已規劃）">
    - `contextVisibility: "all"`（預設）保留目前照接收內容處理的行為。
    - `contextVisibility: "allowlist"` 會將補充脈絡篩選為允許清單中的傳送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一個明確的引用/回覆例外。

    在此強化模型於各頻道一致實作之前，預期不同介面會有差異。

  </Accordion>
</AccordionGroup>

![群組訊息流程](/images/groups-flow.svg)

如果你想要...

| 目標                                         | 要設定的內容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但只在 @提及時回覆 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 只允許特定群組                         | `groups: { "<group-id>": { ... } }`（沒有 `"*"` 鍵）         |
| 只有你可以在群組中觸發               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## Session 鍵

- 群組 session 使用 `agent:<agentId>:<channel>:group:<id>` session 鍵（聊天室/頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會在群組 ID 加上 `:topic:<threadId>`，因此每個主題都有自己的 session。
- 直接聊天使用主要 session（或在設定時使用每位傳送者各自的 session）。
- 群組 session 會略過 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人私訊 + 公開群組（單一 agent）

可以，若你的「個人」流量是**私訊**，而你的「公開」流量是**群組**，這個做法很適合。

原因：在單一 agent 模式中，私訊通常落在**主要** session 鍵（`agent:main:main`），而群組一律使用**非主要** session 鍵（`agent:main:<channel>:group:<id>`）。如果你使用 `mode: "non-main"` 啟用 sandboxing，這些群組 session 會在設定的 sandbox 後端中執行，而你的主要私訊 session 會留在主機上。如果你沒有選擇後端，Docker 是預設後端。

這會給你一個 agent「大腦」（共享工作區 + 記憶），但有兩種執行姿態：

- **私訊**：完整工具（主機）
- **群組**：sandbox + 受限工具

<Note>
如果你需要真正分離的工作區/persona（「個人」和「公開」絕不能混在一起），請使用第二個 agent + 繫結。請參閱[多 Agent 路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私訊在主機上，群組在 sandbox 中">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="群組只看得到允許清單中的資料夾">
    想要「群組只能看到資料夾 X」，而不是「沒有主機存取權」？保留 `workspaceAccess: "none"`，並只將允許清單中的路徑掛載到 sandbox：

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

相關：

- 設定鍵與預設值：[Gateway 設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- 偵錯工具為何被封鎖：[Sandbox 與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount 詳細資訊：[Sandboxing](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- UI 標籤在可用時使用 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留給聊天室/頻道；群組聊天使用 `g-<slug>`（小寫、空格 -> `-`、保留 `#@+._-`）。

## 群組政策

控制每個頻道如何處理群組/聊天室訊息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| 政策        | 行為                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群組會繞過允許清單；提及閘控仍會套用。      |
| `"disabled"`  | 完全封鎖所有群組訊息。                           |
| `"allowlist"` | 只允許符合已設定允許清單的群組/聊天室。 |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘控是分開的（後者需要 @提及）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（備援：明確的 `allowFrom`）。
    - 私訊配對核准（`*-allowFrom` 儲存項目）只適用於私訊存取；群組傳送者授權仍明確使用群組允許清單。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。偏好使用聊天室 ID 或別名；已加入聊天室的名稱查詢是盡力而為，未解析的名稱會在執行階段被忽略。使用 `channels.matrix.groupAllowFrom` 來限制傳送者；也支援每個聊天室的 `users` 允許清單。
    - 群組私訊會分開控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允許清單可比對使用者 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或使用者名稱（`"@alice"` 或 `"alice"`）；前綴不區分大小寫。
    - 預設為 `groupPolicy: "allowlist"`；如果你的群組允許清單是空的，群組訊息會被封鎖。
    - 執行階段安全性：當 provider 區塊完全缺失（沒有 `channels.<provider>`）時，群組政策會退回失敗關閉模式（通常是 `allowlist`），而不是繼承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速心智模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群組允許清單">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、頻道專屬允許清單）。
  </Step>
  <Step title="提及閘控">
    提及閘控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘控（預設）

群組訊息需要提及，除非依群組覆寫。預設值位於每個子系統的 `*.groups."*"` 下。

回覆機器人訊息在頻道支援回覆中繼資料時，會算作隱含提及。引用機器人訊息在公開引用中繼資料的頻道上，也可以算作隱含提及。目前內建案例包含 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 與 ZaloUser。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` 是不區分大小寫的安全 regex 模式；無效模式與不安全的巢狀重複形式會被忽略。
    - 提供明確提及的介面仍會通過；模式是備援。
    - 每代理覆寫：`agents.list[].groupChat.mentionPatterns`（在多個代理共用群組時很有用）。
    - 提及門檻只會在可偵測提及時強制執行（已設定原生提及或 `mentionPatterns`）。
    - 群組聊天提示詞上下文會在每一輪攜帶已解析的靜默回覆指令；工作區檔案不應重複 `NO_REPLY` 機制。
    - 允許靜默回覆的群組，會將乾淨的空白或僅推理模型輪次視為靜默，等同於 `NO_REPLY`。直接聊天只有在明確允許直接靜默回覆時才會相同；否則空白回覆仍會保留為失敗的代理輪次。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可依 guild/channel 覆寫）。
    - 群組歷史上下文會跨頻道一致包裝，且為 **pending-only**（因提及門檻而略過的訊息）；使用 `messages.groupChat.historyLimit` 作為全域預設值，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 可停用。

  </Accordion>
</AccordionGroup>

## 群組/頻道工具限制（選用）

某些頻道設定支援限制 **特定群組/聊天室/頻道內** 可用的工具。

- `tools`：允許/拒絕整個群組的工具。
- `toolsBySender`：群組內依傳送者覆寫。使用明確的鍵前綴：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 與 `"*"` 萬用字元。舊版未加前綴的鍵仍會接受，且只會以 `id:` 比對。

解析順序（最具體者優先）：

<Steps>
  <Step title="Group toolsBySender">
    群組/頻道 `toolsBySender` 比對。
  </Step>
  <Step title="Group tools">
    群組/頻道 `tools`。
  </Step>
  <Step title="Default toolsBySender">
    預設 (`"*"`) `toolsBySender` 比對。
  </Step>
  <Step title="Default tools">
    預設 (`"*"`) `tools`。
  </Step>
</Steps>

範例（Telegram）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
群組/頻道工具限制會在全域/代理工具政策之外另行套用（拒絕仍然優先）。某些頻道會針對聊天室/頻道使用不同的巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍設定預設提及行為。

<Warning>
常見混淆：DM 配對核准不等同於群組授權。對於支援 DM 配對的頻道，配對儲存區只會解鎖 DM。群組命令仍需要來自設定允許清單（例如 `groupAllowFrom`）或該頻道已記載設定備援的明確群組傳送者授權。
</Warning>

常見意圖（複製/貼上）：

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Allow all groups but require mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Owner-only triggers (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 啟用（僅限擁有者）

群組擁有者可以切換每個群組的啟用狀態：

- `/activation mention`
- `/activation always`

擁有者由 `channels.whatsapp.allowFrom` 判定（未設定時則使用機器人自己的 E.164）。請將命令作為獨立訊息傳送。其他介面目前會忽略 `/activation`。

## 上下文字段

群組傳入 payload 會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及門檻結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 與 `IsForum`。

頻道特定注意事項：

- BlueBubbles 可以選擇在填入 `GroupMembers` 前，先從本機「聯絡人」資料庫補充未命名的 macOS 群組參與者。這預設關閉，且只會在正常群組門檻通過後執行。

代理系統提示詞會在新群組工作階段的第一輪包含群組介紹。它會提醒模型像人類一樣回應、避免 Markdown 表格、盡量減少空白行並遵循一般聊天間距，以及避免輸入字面 `\n` 序列。頻道來源的群組名稱與參與者標籤會呈現為 fenced 不受信任中繼資料，而不是內嵌系統指令。

## iMessage 細節

- 路由或加入允許清單時，優先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律傳回相同的 `chat_id`。

## WhatsApp 系統提示詞

請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)，了解權威的 WhatsApp 系統提示詞規則，包括群組與直接提示詞解析、萬用字元行為，以及帳號覆寫語意。

## WhatsApp 細節

請參閱 [群組訊息](/zh-TW/channels/group-messages)，了解 WhatsApp 專屬行為（歷史注入、提及處理細節）。

## 相關

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
