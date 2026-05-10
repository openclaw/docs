---
read_when:
    - 變更群組聊天行為或提及控管
sidebarTitle: Groups
summary: 跨各介面的群組聊天行為 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 群組
x-i18n:
    generated_at: "2026-05-10T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在各個介面一致處理群組聊天：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 初學者簡介（2 分鐘）

OpenClaw「存在於」你自己的訊息帳號中。沒有獨立的 WhatsApp 機器人使用者。如果**你**在某個群組中，OpenClaw 就能看到該群組並在那裡回應。

預設行為：

- 群組是受限制的（`groupPolicy: "allowlist"`）。
- 除非你明確停用提及閘門，否則回覆需要被提及。
- 群組/頻道中的一般最終回覆預設為私密。可見的聊天室輸出會使用 `message` 工具。

換句話說：允許清單中的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**重點摘要**

- **私訊存取**由 `*.allowFrom` 控制。
- **群組存取**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及閘門（`requireMention`、`/activation`）控制。

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
`openclaw doctor --fix` 會把這個預設值寫入省略該值的已設定頻道設定。
這表示代理仍會處理該回合，並可更新記憶/工作階段狀態，但它的一般最終答案不會自動發回聊天室。若要可見地發言，代理會使用 `message(action=send)`。

這個預設值仰賴能可靠呼叫工具的模型/執行階段。如果日誌顯示
assistant 文字但 `didSendViaMessagingTool: false`，代表模型是私下回答，
而不是呼叫 message 工具。這不是 Discord/Slack/Telegram 傳送失敗。
請針對群組/頻道工作階段使用能可靠呼叫工具的模型，或設定
`messages.groupChat.visibleReplies: "automatic"` 來還原舊版可見最終回覆。

如果在作用中的工具政策下無法使用 message 工具，OpenClaw 會退回自動可見回覆，而不是默默抑制回應。
`openclaw doctor` 會針對此不一致發出警告。

對於直接聊天和任何其他來源回合，請使用 `messages.visibleReplies: "message_tool"`，將相同的僅工具可見回覆行為套用到全域。執行工具也可以選擇把這個作為未設定時的預設值；Codex 執行工具會對 Codex 模式的直接聊天這麼做。`messages.groupChat.visibleReplies` 仍是群組/頻道聊天室更具體的覆寫設定。

這取代了舊模式：強制模型在多數旁觀模式回合回答 `NO_REPLY`。在僅工具模式中，不產生任何可見內容，單純表示不呼叫 message 工具。

在代理以僅工具模式工作時，仍會傳送輸入狀態指示器。這些回合的預設群組輸入模式會從 "message" 升級為 "instant"，因為在代理決定是否呼叫 message 工具之前，可能永遠不會有一般 assistant 訊息文字。明確的輸入模式設定仍會優先。

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

Gateway 會在檔案儲存後熱重載 `messages` 設定。只有在部署中停用檔案監看或設定重載時才需要重新啟動。

若要要求每個來源聊天的可見輸出都必須經由 message 工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生命令斜線指令（Discord、Telegram，以及其他支援原生命令的介面）會略過 `visibleReplies: "message_tool"`，並一律可見地回覆，讓頻道原生的命令 UI 取得預期的回應。這只適用於已驗證的原生命令回合；以文字輸入的 `/...` 命令和一般聊天回合仍會遵循已設定的群組預設值。

## 上下文可見性和允許清單

群組安全涉及兩種不同控制：

- **觸發授權**：誰可以觸發代理（`groupPolicy`、`groups`、`groupAllowFrom`、頻道特定允許清單）。
- **上下文可見性**：哪些補充上下文會注入模型（回覆文字、引用、討論串歷史、轉寄中繼資料）。

預設情況下，OpenClaw 優先考量一般聊天行為，並大致保留接收到的上下文。這表示允許清單主要決定誰能觸發動作，而不是每個引用或歷史片段的通用遮蔽邊界。

<AccordionGroup>
  <Accordion title="目前行為依頻道而異">
    - 某些頻道已在特定路徑中針對補充上下文套用基於傳送者的篩選（例如 Slack 討論串種子、Matrix 回覆/討論串查詢）。
    - 其他頻道仍會依接收狀態傳遞引用/回覆/轉寄上下文。

  </Accordion>
  <Accordion title="強化方向（規劃中）">
    - `contextVisibility: "all"`（預設）保留目前依接收狀態的行為。
    - `contextVisibility: "allowlist"` 會將補充上下文篩選為允許清單中的傳送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一個明確的引用/回覆例外。

    在這個強化模型於各頻道一致實作前，請預期不同介面之間會有差異。

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
| 跨頻道重用一組受信任的傳送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

關於可重用的傳送者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段鍵（聊天室/頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會將 `:topic:<threadId>` 加到群組 ID，因此每個主題都有自己的工作階段。
- 直接聊天使用主要工作階段（或在設定時依傳送者分開）。
- 群組工作階段會略過 Heartbeat。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人私訊 + 公開群組（單一代理）

可以，若你的「個人」流量是**私訊**，而「公開」流量是**群組**，這會運作得很好。

原因：在單一代理模式中，私訊通常落在**主要**工作階段鍵（`agent:main:main`），而群組一律使用**非主要**工作階段鍵（`agent:main:<channel>:group:<id>`）。如果你啟用沙盒並使用 `mode: "non-main"`，這些群組工作階段會在已設定的沙盒後端中執行，而你的主要私訊工作階段仍留在主機上。如果你未選擇後端，Docker 會是預設後端。

這會提供一個代理「大腦」（共用工作區 + 記憶），但有兩種執行姿態：

- **私訊**：完整工具（主機）
- **群組**：沙盒 + 受限工具

<Note>
如果你需要真正分離的工作區/人格（「個人」與「公開」絕不能混合），請使用第二個代理 + 繫結。請參閱[多代理路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私訊在主機上，群組進沙盒">
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
  <Tab title="群組只看到允許清單中的資料夾">
    想要「群組只能看到資料夾 X」，而不是「不能存取主機」？保留 `workspaceAccess: "none"`，並且只把允許清單中的路徑掛載到沙盒：

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

- 設定鍵和預設值：[Gateway 設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- 偵錯工具被封鎖的原因：[沙盒 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 繫結掛載詳細資訊：[沙盒化](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- UI 標籤會在可用時使用 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留給聊天室/頻道；群組聊天使用 `g-<slug>`（小寫，空格 -> `-`，保留 `#@+._-`）。

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
| `"open"`      | 群組會略過允許清單；提及閘門仍會套用。      |
| `"disabled"`  | 完全封鎖所有群組訊息。                           |
| `"allowlist"` | 只允許符合已設定允許清單的群組/聊天室。 |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘控是分開的（提及閘控需要 @mentions）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（後援：明確的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以比對傳入的 Signal 群組 ID，或寄件者電話/UUID。
    - DM 配對核准（`*-allowFrom` 儲存項目）只適用於 DM 存取；群組寄件者授權仍明確以群組允許清單為準。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。建議使用聊天室 ID 或別名；已加入聊天室的名稱查找是盡力而為，未解析的名稱會在執行階段被忽略。使用 `channels.matrix.groupAllowFrom` 來限制寄件者；也支援各聊天室的 `users` 允許清單。
    - 群組 DM 會分開控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允許清單可以比對使用者 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或使用者名稱（`"@alice"` 或 `"alice"`）；前綴不區分大小寫。
    - 預設為 `groupPolicy: "allowlist"`；如果你的群組允許清單為空，群組訊息會被封鎖。
    - 執行階段安全性：當某個 provider 區塊完全缺失（沒有 `channels.<provider>`）時，群組政策會退回到失敗關閉模式（通常是 `allowlist`），而不是繼承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速心智模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群組允許清單">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、頻道特定允許清單）。
  </Step>
  <Step title="提及閘控">
    提及閘控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘控（預設）

除非針對各群組覆寫，否則群組訊息需要提及。預設值位於每個子系統的 `*.groups."*"` 下。

當頻道支援回覆中繼資料時，回覆 bot 訊息會算作隱含提及。在暴露引用中繼資料的頻道上，引用 bot 訊息也可以算作隱含提及。目前內建案例包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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
  <Accordion title="提及閘控注意事項">
    - `mentionPatterns` 是不區分大小寫的安全 regex 模式；無效模式和不安全的巢狀重複形式會被忽略。
    - 提供明確提及的介面仍會通過；模式是後援。
    - 各 agent 覆寫：`agents.list[].groupChat.mentionPatterns`（當多個 agent 共用一個群組時很有用）。
    - 只有在可以偵測提及時（已設定原生提及或 `mentionPatterns`），才會強制執行提及閘控。
    - 將群組或寄件者加入允許清單不會停用提及閘控；若所有訊息都應觸發，請將該群組的 `requireMention` 設為 `false`。
    - 群組聊天 prompt 脈絡會在每一輪攜帶已解析的靜默回覆指令；工作區檔案不應重複 `NO_REPLY` 機制。
    - 允許靜默回覆的群組會將乾淨的空白或僅推理的模型輪次視為靜默，等同於 `NO_REPLY`。直接聊天只有在明確允許直接靜默回覆時才會相同處理；否則空白回覆仍會被視為失敗的 agent 輪次。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可依 guild/channel 覆寫）。
    - 群組歷史脈絡會跨頻道一致包裝。提及閘控群組會保留待處理的已略過訊息；在頻道支援時，永遠開啟的群組也可能保留最近已處理的聊天室訊息。使用 `messages.groupChat.historyLimit` 作為全域預設，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 可停用。

  </Accordion>
</AccordionGroup>

## 群組/頻道工具限制（選用）

某些頻道設定支援限制**特定群組/聊天室/頻道內**可用的工具。

- `tools`：允許/拒絕整個群組的工具。
- `toolsBySender`：群組內依寄件者覆寫。使用明確的鍵前綴：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 萬用字元。舊版無前綴鍵仍會被接受，且只會以 `id:` 比對。

解析順序（最具體者優先）：

<Steps>
  <Step title="群組 toolsBySender">
    群組/頻道 `toolsBySender` 比對。
  </Step>
  <Step title="群組 tools">
    群組/頻道 `tools`。
  </Step>
  <Step title="預設 toolsBySender">
    預設（`"*"`）`toolsBySender` 比對。
  </Step>
  <Step title="預設 tools">
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
群組/頻道工具限制會在全域/agent 工具政策之外套用（拒絕仍然優先）。某些頻道對聊天室/頻道使用不同的巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍設定預設提及行為。

<Warning>
常見混淆：DM 配對核准不等同於群組授權。對於支援 DM 配對的頻道，配對儲存只會解鎖 DM。群組命令仍需要來自設定允許清單的明確群組寄件者授權，例如 `groupAllowFrom` 或該頻道記錄的設定後援。
</Warning>

常見意圖（複製/貼上）：

<Tabs>
  <Tab title="停用所有群組回覆">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="只允許特定群組（WhatsApp）">
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
  <Tab title="允許所有群組但需要提及">
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
  <Tab title="僅擁有者觸發（WhatsApp）">
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

## 啟用（僅擁有者）

群組擁有者可以切換各群組啟用狀態：

- `/activation mention`
- `/activation always`

擁有者由 `channels.whatsapp.allowFrom` 決定（未設定時則使用 bot 自身的 E.164）。請將命令作為獨立訊息傳送。其他介面目前會忽略 `/activation`。

## 脈絡欄位

群組傳入 payload 會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及閘控結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 和 `IsForum`。

agent 系統 prompt 會在新群組工作階段的第一輪包含群組介紹。它會提醒模型像人類一樣回應、避免 Markdown 表格、盡量減少空白行並遵循一般聊天間距，以及避免輸入字面上的 `\n` 序列。來自頻道的群組名稱和參與者標籤會呈現為 fenced 的不受信任中繼資料，而不是 inline 系統指令。

## iMessage 細節

- 路由或加入允許清單時，建議使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律回到相同的 `chat_id`。

## WhatsApp 系統 prompt

請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)，了解權威的 WhatsApp 系統 prompt 規則，包括群組和直接 prompt 解析、萬用字元行為，以及帳號覆寫語意。

## WhatsApp 細節

請參閱[群組訊息](/zh-TW/channels/group-messages)，了解 WhatsApp 專屬行為（歷史注入、提及處理細節）。

## 相關

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
