---
read_when:
    - 變更群組聊天行為或提及門檻設定
sidebarTitle: Groups
summary: 跨介面的群組聊天行為 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 群組
x-i18n:
    generated_at: "2026-04-30T16:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在各種介面上一致地處理群組聊天：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 初學者簡介（2 分鐘）

OpenClaw「存在」於你自己的訊息帳號中。沒有獨立的 WhatsApp bot 使用者。如果**你**在某個群組中，OpenClaw 就能看到該群組並在其中回應。

預設行為：

- 群組受限制（`groupPolicy: "allowlist"`）。
- 回覆需要提及，除非你明確停用提及門控。
- 群組/頻道中的一般最終回覆預設為私密。可見的聊天室輸出會使用 `message` 工具。

換句話說：列入允許清單的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**太長不讀**

- **DM 存取**由 `*.allowFrom` 控制。
- **群組存取**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及門控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息會發生什麼）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 可見回覆

對於群組/頻道聊天室，OpenClaw 預設使用 `messages.groupChat.visibleReplies: "message_tool"`。
這表示代理仍會處理該輪對話，也可以更新記憶/session 狀態，但其一般最終答案不會自動發回聊天室。若要可見地發言，代理會使用 `message(action=send)`。

對於直接聊天與任何其他來源輪次，使用 `messages.visibleReplies: "message_tool"` 可在全域套用相同的僅工具可見回覆行為。`messages.groupChat.visibleReplies` 仍是針對群組/頻道聊天室更具體的覆寫。

這取代了舊模式中強迫模型在大多數潛伏模式輪次回答 `NO_REPLY` 的做法。在僅工具模式中，不做任何可見輸出只代表不呼叫 message 工具。

代理在僅工具模式中工作時仍會送出輸入中指示器。這些輪次的預設群組輸入模式會從「message」升級為「instant」，因為在代理決定是否呼叫 message 工具之前，可能永遠不會有一般 assistant 訊息文字。明確的輸入模式設定仍然優先。

若要還原群組/頻道聊天室的舊版自動最終回覆：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway 會在檔案儲存後熱重新載入 `messages` 設定。只有在部署中停用檔案監看或設定重新載入時才需要重新啟動。

若要要求每個來源聊天的可見輸出都透過 message 工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生斜線命令（Discord、Telegram，以及其他支援原生命令的介面）會繞過 `visibleReplies: "message_tool"`，並一律可見地回覆，讓頻道原生命令 UI 取得預期的回應。這只適用於已驗證的原生命令輪次；以文字輸入的 `/...` 命令與一般聊天輪次仍會遵循設定的群組預設值。

## 上下文可見性與允許清單

群組安全涉及兩種不同控制：

- **觸發授權**：誰可以觸發代理（`groupPolicy`、`groups`、`groupAllowFrom`、頻道專屬允許清單）。
- **上下文可見性**：哪些補充上下文會注入模型（回覆文字、引用、thread 歷史、轉寄中繼資料）。

預設情況下，OpenClaw 會優先採用一般聊天行為，並大致保留接收到的上下文。這表示允許清單主要決定誰可以觸發動作，而不是每段引用或歷史片段的通用遮罩邊界。

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - 部分頻道已在特定路徑中對補充上下文套用以傳送者為基礎的篩選（例如 Slack thread 植入、Matrix 回覆/thread 查詢）。
    - 其他頻道仍會按照接收內容傳遞引用/回覆/轉寄上下文。

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"`（預設）保留目前按照接收內容的行為。
    - `contextVisibility: "allowlist"` 會將補充上下文篩選為列入允許清單的傳送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一個明確的引用/回覆例外。

    在此強化模型於各頻道間一致實作之前，請預期不同介面會有差異。

  </Accordion>
</AccordionGroup>

![群組訊息流程](/images/groups-flow.svg)

如果你想要...

| 目標                                         | 要設定的內容                                               |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但只在 @提及時回覆 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 只允許特定群組                         | `groups: { "<group-id>": { ... } }`（沒有 `"*"` 鍵）         |
| 只有你可以在群組中觸發               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## Session 鍵

- 群組 session 使用 `agent:<agentId>:<channel>:group:<id>` session 鍵（聊天室/頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會在群組 id 後加上 `:topic:<threadId>`，讓每個主題都有自己的 session。
- 直接聊天使用主要 session（或在已設定時依傳送者分開）。
- 群組 session 會跳過 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人 DM + 公開群組（單一代理）

可以，若你的「個人」流量是 **DM**，而「公開」流量是**群組**，這種方式效果很好。

原因：在單一代理模式中，DM 通常會落在**主要** session 鍵（`agent:main:main`），而群組一律使用**非主要** session 鍵（`agent:main:<channel>:group:<id>`）。如果你以 `mode: "non-main"` 啟用沙箱，這些群組 session 會在設定的沙箱後端中執行，而你的主要 DM session 會留在主機上。如果你沒有選擇後端，Docker 是預設後端。

這讓你擁有一個代理「大腦」（共享工作區 + 記憶），但有兩種執行姿態：

- **DM**：完整工具（主機）
- **群組**：沙箱 + 受限工具

<Note>
如果你需要真正分離的工作區/人格（「個人」與「公開」絕不能混用），請使用第二個代理 + 綁定。請參閱[多代理路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    想要「群組只能看到資料夾 X」，而不是「沒有主機存取權」？保留 `workspaceAccess: "none"`，並只將列入允許清單的路徑掛載到沙箱中：

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
- 偵錯工具為何被封鎖：[沙箱 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 綁定掛載詳細資訊：[沙箱化](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- UI 標籤會在可用時使用 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留給聊天室/頻道；群組聊天使用 `g-<slug>`（小寫、空格 -> `-`，保留 `#@+._-`）。

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
| `"open"`      | 群組會繞過允許清單；提及門控仍會套用。      |
| `"disabled"`  | 完全封鎖所有群組訊息。                           |
| `"allowlist"` | 只允許符合設定之允許清單的群組/聊天室。 |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` 與提及門控（需要 @提及）是分開的。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（後援：明確的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以符合傳入的 Signal 群組 id，或傳送者電話/UUID。
    - DM 配對核准（`*-allowFrom` 儲存項目）只套用於 DM 存取；群組傳送者授權仍需明確列入群組允許清單。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。偏好使用聊天室 ID 或別名；已加入聊天室名稱查詢為盡力而為，未解析的名稱會在執行階段被忽略。使用 `channels.matrix.groupAllowFrom` 來限制傳送者；也支援每個聊天室的 `users` 允許清單。
    - 群組 DM 會分開控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允許清單可以符合使用者 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或使用者名稱（`"@alice"` 或 `"alice"`）；前綴不區分大小寫。
    - 預設為 `groupPolicy: "allowlist"`；如果你的群組允許清單是空的，群組訊息會被封鎖。
    - 執行階段安全性：當 provider 區塊完全不存在時（缺少 `channels.<provider>`），群組政策會後援到失敗關閉模式（通常是 `allowlist`），而不是繼承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速心智模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="Group allowlists">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、頻道專屬允許清單）。
  </Step>
  <Step title="Mention gating">
    提及門控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及門控（預設）

群組訊息需要提及，除非針對每個群組覆寫。預設值位於 `*.groups."*"` 下各子系統中。

回覆機器人訊息在頻道支援回覆中繼資料時，會算作隱含提及。引用機器人訊息在會公開引用中繼資料的頻道上，也可能算作隱含提及。目前內建案例包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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
    - `mentionPatterns` 是不區分大小寫的安全 regex 模式；無效模式和不安全的巢狀重複形式會被忽略。
    - 提供明確提及的介面仍會通過；模式只是備援。
    - 個別代理覆寫：`agents.list[].groupChat.mentionPatterns`（多個代理共用同一群組時很有用）。
    - 提及閘控只會在能偵測提及時強制執行（已設定原生提及或 `mentionPatterns`）。
    - 將群組或寄件者加入允許清單不會停用提及閘控；當所有訊息都應觸發時，請將該群組的 `requireMention` 設為 `false`。
    - 群組聊天提示詞內容會在每一輪攜帶已解析的靜默回覆指令；工作區檔案不應重複 `NO_REPLY` 機制。
    - 允許靜默回覆的群組，會將乾淨的空白或僅推理的模型回合視為靜默，等同於 `NO_REPLY`。直接聊天只有在明確允許直接靜默回覆時才會這樣做；否則空白回覆仍會是失敗的代理回合。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可依 guild/channel 覆寫）。
    - 群組歷史內容會在各頻道間以一致方式包裝，且**僅限待處理**（因提及閘控而略過的訊息）；使用 `messages.groupChat.historyLimit` 作為全域預設值，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 可停用。

  </Accordion>
</AccordionGroup>

## 群組/頻道工具限制（選用）

某些頻道設定支援限制**特定群組/聊天室/頻道內**可用的工具。

- `tools`：允許/拒絕整個群組的工具。
- `toolsBySender`：群組內依寄件者覆寫。使用明確的鍵前綴：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 萬用字元。舊版未加前綴的鍵仍會被接受，且只會以 `id:` 比對。

解析順序（最明確者優先）：

<Steps>
  <Step title="Group toolsBySender">
    群組/頻道 `toolsBySender` 比對。
  </Step>
  <Step title="Group tools">
    群組/頻道 `tools`。
  </Step>
  <Step title="Default toolsBySender">
    預設（`"*"`）`toolsBySender` 比對。
  </Step>
  <Step title="Default tools">
    預設（`"*"`）`tools`。
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
群組/頻道工具限制會套用在全域/代理工具政策之外（拒絕仍優先）。某些頻道對聊天室/頻道使用不同的巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍設定預設提及行為。

<Warning>
常見混淆：DM 配對核准不等同於群組授權。對於支援 DM 配對的頻道，配對儲存區只會解鎖 DM。群組指令仍需要來自設定允許清單的明確群組寄件者授權，例如 `groupAllowFrom` 或該頻道記載的設定備援。
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

擁有者由 `channels.whatsapp.allowFrom` 決定（未設定時則使用機器人自己的 E.164）。請將指令作為獨立訊息傳送。其他介面目前會忽略 `/activation`。

## 內容欄位

群組傳入酬載會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及閘控結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 和 `IsForum`。

頻道特定注意事項：

- BlueBubbles 可選擇在填入 `GroupMembers` 前，從本機通訊錄資料庫補充未命名的 macOS 群組參與者。這預設關閉，且只會在一般群組閘控通過後執行。

代理系統提示詞會在新群組工作階段的第一輪包含群組介紹。它會提醒模型像人類一樣回應、避免 Markdown 表格、盡量減少空行並遵循一般聊天間距，以及避免輸入字面上的 `\n` 序列。來自頻道的群組名稱和參與者標籤會呈現為 fenced 不受信任中繼資料，而不是行內系統指令。

## iMessage 特定事項

- 路由或加入允許清單時，偏好使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律會回到相同的 `chat_id`。

## WhatsApp 系統提示詞

請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)，了解正式的 WhatsApp 系統提示詞規則，包括群組與直接提示詞解析、萬用字元行為，以及帳號覆寫語意。

## WhatsApp 特定事項

請參閱[群組訊息](/zh-TW/channels/group-messages)，了解僅限 WhatsApp 的行為（歷史注入、提及處理細節）。

## 相關

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
