---
read_when:
    - 變更群組聊天行為或提及限制
    - 將 mentionPatterns 限定於特定群組對話
sidebarTitle: Groups
summary: 跨介面（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）的群組聊天行為
title: 群組
x-i18n:
    generated_at: "2026-07-16T11:21:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在所有支援群組的頻道中套用相同的群組規則，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

對於除非代理明確傳送可見訊息，否則應安靜提供情境的常駐聊天室，請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

## 新手簡介（2 分鐘）

OpenClaw「存在」於你自己的訊息帳號中。它沒有獨立的 WhatsApp 機器人使用者：只要**你**在群組中，OpenClaw 就能看到該群組並在其中回覆。

預設行為：

- 群組受到限制（`groupPolicy: "allowlist"`）；群組傳送者在加入允許清單前都會被封鎖。
- 除非停用該群組的提及閘控，否則回覆需要提及。
- 最終回覆文字會自動發布到聊天室（`visibleReplies: "automatic"`）。

換句話說：允許清單中的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**簡而言之**

- **私訊存取權**由 `*.allowFrom` 控制。
- **群組存取權**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及閘控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息會如何處理）：

```text
groupPolicy？disabled -> 丟棄
groupPolicy？allowlist -> 群組是否允許？否 -> 丟棄
requireMention？是 -> 是否被提及？否 -> 僅儲存為情境
提及／回覆／命令／私訊 -> 使用者要求
常駐群組閒聊 -> 使用者要求，或在已設定時成為聊天室事件
```

## 可見回覆

對於一般群組／頻道要求，OpenClaw 預設使用 `messages.groupChat.visibleReplies: "automatic"`：最終助理文字會作為可見回覆發布到聊天室。

當共享聊天室應讓代理透過呼叫 `message(action=send)` 自行決定何時發言時，請使用 `messages.groupChat.visibleReplies: "message_tool"`。這最適合能可靠使用工具的模型（例如 GPT-5.6 Sol）。如果模型未使用工具並傳回具實質內容的最終文字，OpenClaw 會將該文字保留為私密內容，而不會發布到聊天室。

對於無法可靠遵循僅透過工具傳送之要求的模型或執行階段，請使用 `"automatic"`：一般最終文字會直接發布到聊天室，而代理仍可針對無法隨最終文字一併傳送的檔案、圖片或其他附件呼叫 `message(action=send)`。

如果目前的工具政策不允許使用訊息工具，OpenClaw 會改用自動可見回覆，而不會無聲地隱藏回應。`openclaw doctor` 會對此不一致發出警告。

對於直接聊天和任何其他來源事件，`messages.visibleReplies: "message_tool"` 會在全域套用相同的僅透過工具行為；`messages.groupChat.visibleReplies` 仍是群組／頻道聊天室更明確的覆寫設定。內部 WebChat 的直接對話預設會自動傳送最終回覆，因此 Pi 和 Codex 會收到相同的可見回覆合約。

僅透過工具模式取代了舊有模式，不再強制模型於大多數潛伏模式對話中回答 `NO_REPLY`。在僅透過工具模式中，提示不會定義 `NO_REPLY` 合約；不顯示任何內容，只代表未呼叫訊息工具。

外掛所擁有的對話繫結是例外。外掛一旦繫結討論串並接管傳入對話，外掛傳回的回覆就是可見的繫結回應；不需要 `message(action=send)`。該回覆是外掛執行階段輸出，而非私密的模型最終文字。

直接群組要求仍會傳送輸入指示器。啟用環境常駐聊天室事件時，除非代理呼叫訊息工具，否則仍會保持嚴格且安靜。

工作階段預設會隱藏詳細的工具／進度摘要。偵錯時，使用 `/verbose on`（或 `/verbose full`）為目前工作階段顯示這些摘要，並使用 `/verbose off` 恢復僅顯示最終回覆的行為。詳細狀態依工作階段而定，且在直接聊天、群組、頻道和論壇主題中的運作方式相同。

若要將未提及代理的常駐群組閒聊提交為安靜的聊天室情境，而非使用者要求，請使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

預設值為 `unmentionedInbound: "user_request"`。提及訊息、命令、中止要求和私訊仍屬於使用者要求。

若要強制群組／頻道要求的可見輸出透過訊息工具傳送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

若要對每個來源聊天強制執行此行為：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

儲存檔案後，閘道無須重新啟動即可套用 `messages` 設定變更。只有在停用設定重新載入（`gateway.reload.mode: "off"`）時才需要重新啟動。

命令對話會略過 `visibleReplies: "message_tool"` 並一律以可見方式回覆：原生斜線命令（Discord、Telegram 及其他支援原生命令的介面）和已授權的文字 `/...` 命令，都會將回應發布到來源聊天。群組中未授權的文字 `/...` 對話仍僅能透過訊息工具回覆；一般聊天對話則遵循設定的預設值。

## 情境可見性與允許清單

群組安全性涉及兩項不同的控制：

- **觸發授權**：誰可以觸發代理（`groupPolicy`、`groups`、`groupAllowFrom`、頻道專用允許清單）。
- **情境可見性**：哪些補充情境會注入模型（回覆／引用文字、討論串歷史記錄、轉傳中繼資料）。

OpenClaw 預設會依收到時的原貌保留情境：允許清單決定誰能觸發動作，而非模型能看到哪些引用或歷史記錄片段。若還要篩選補充情境，請設定 `contextVisibility`：

| 模式                | 行為                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（預設）   | 依收到時的原貌保留補充情境。                                           |
| `"allowlist"`       | 僅注入來自允許清單中傳送者的歷史記錄／討論串／引用／轉傳情境。     |
| `"allowlist_quote"` | `allowlist`，並保留明確引用／回覆的任何傳送者訊息。 |

可依頻道（`channels.<channel>.contextVisibility`）、依帳號（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全域（`channels.defaults.contextVisibility`）設定。會擷取補充情境的頻道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）在建立傳入情境時會套用此政策；未知的政策組合會採取封閉式失敗處理並省略情境。

![群組訊息流程](/images/groups-flow.svg)

如果你想要……

| 目標                                         | 設定值                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但僅在 @提及時回覆 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 僅限特定群組                         | `groups: { "<group-id>": { ... } }`（無 `"*"` 鍵）         |
| 群組中只有你能觸發代理               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 跨頻道重複使用同一組受信任傳送者     | `groupAllowFrom: ["accessGroup:operators"]`                |

關於可重複使用的傳送者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段鍵（聊天室／頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會在群組 ID 後加入 `:topic:<threadId>`，讓每個主題都有自己的工作階段。
- 直接聊天使用主要工作階段（若已設定 `session.dmScope`，則使用每位傳送者各自的工作階段）。
- 心跳偵測會在設定的心跳偵測工作階段中執行（預設為代理的主要工作階段）；群組工作階段不會自行執行心跳偵測。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人私訊 + 公開群組（單一代理）

可以——如果你的「個人」流量是**私訊**，而「公開」流量是**群組**，這種方式運作良好。

原因是：在單一代理模式中，私訊通常會進入**主要**工作階段鍵（`agent:main:main`），而群組一律使用**非主要**工作階段鍵（`agent:main:<channel>:group:<id>`）。如果使用 `mode: "non-main"` 啟用沙箱，這些群組工作階段會在設定的沙箱後端中執行，而主要私訊工作階段仍留在主機上。若未選擇後端，預設使用 Docker。

如此可提供一個代理「大腦」（共享工作區 + 記憶），但有兩種執行方式：

- **私訊**：完整工具（主機）
- **群組**：沙箱 + 受限制的工具

<Note>
如果需要真正分離的工作區／角色（「個人」與「公開」絕不可混用），請使用第二個代理 + 繫結。請參閱[多代理路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私訊在主機上執行，群組使用沙箱">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // 群組／頻道為非主要 -> 使用沙箱
            scope: "session", // 最強隔離（每個群組／頻道使用一個容器）
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // 如果 allow 非空，其他所有項目都會被封鎖（deny 仍優先）。
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="群組只能看到允許清單中的資料夾">
    想要讓「群組只能看到資料夾 X」，而非「無法存取主機」嗎？保留 `workspaceAccess: "none"`，並只將允許清單中的路徑掛載到沙箱：

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
                // 主機路徑:容器路徑:模式
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

相關內容：

- 設定鍵與預設值：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- 偵錯工具遭封鎖的原因：[沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 繫結掛載詳細資訊：[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- 使用者介面標籤會在可用時使用 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留給聊天室／頻道使用；群組聊天使用 `g-<slug>`（小寫、空格 -> `-`、保留 `#@+._-`）。極長且不透明的 ID 會縮短為穩定權杖，避免在使用者介面中洩漏完整路由 ID。

## 群組政策

控制各頻道處理群組／聊天室訊息的方式：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 數字格式的 Telegram 使用者 ID（設定程序會解析 @username）
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| 原則        | 行為                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群組會略過允許清單；提及閘控仍然適用。      |
| `"disabled"`  | 完全封鎖所有群組訊息。                           |
| `"allowlist"` | 僅允許符合所設定允許清單的群組／聊天室。 |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘控（要求 @提及）分開運作。
    - WhatsApp／Telegram／Signal／iMessage／Microsoft Teams／Zalo：使用 `groupAllowFrom`（備援：明確設定 `allowFrom`）。
    - Signal：`groupAllowFrom` 可比對傳入的 Signal 群組 ID 或傳送者的電話號碼／UUID。
    - 私訊配對核准（`*-allowFrom` 儲存區項目）僅適用於私訊存取；群組傳送者的授權仍須在群組允許清單中明確設定。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。請使用聊天室 ID（`!room:server`）或別名（`#alias:server`）；聊天室名稱索引鍵僅在搭配 `channels.matrix.dangerouslyAllowNameMatching: true` 時才會比對，且執行階段會忽略無法解析的項目。使用 `channels.matrix.groupAllowFrom` 限制傳送者；也支援各聊天室的 `users` 允許清單。
    - 群組私訊會另行控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：傳送者允許清單僅接受數字格式的使用者 ID（`"123456789"`；`telegram:`／`tg:` 前綴會以不區分大小寫的方式移除）。`@username` 項目不會在執行階段比對，並會記錄警告；設定程序會將 `@username` 解析為 ID。負數聊天 ID 應放在 `channels.telegram.groups` 下，而不是傳送者允許清單中。
    - 預設值為 `groupPolicy: "allowlist"`；如果群組允許清單為空，群組訊息會遭到封鎖。
    - 執行階段安全性：如果提供者區塊完全缺失（沒有 `channels.<provider>`），群組原則會以失敗時關閉的方式設為 `allowlist`，而不是繼承 `channels.defaults.groupPolicy`，且閘道會為每個帳號記錄一次此備援情況。

  </Accordion>
</AccordionGroup>

快速理解模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open／disabled／allowlist）。
  </Step>
  <Step title="群組允許清單">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、頻道專屬允許清單）。
  </Step>
  <Step title="提及閘控">
    提及閘控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘控（預設）

除非針對個別群組覆寫，否則群組訊息必須包含提及。預設值位於各子系統的 `*.groups."*"` 下。

當頻道公開回覆中繼資料時，回覆機器人的訊息會視為隱含提及；在公開引用中繼資料的頻道中，引用機器人的訊息也可視為提及。目前內建支援的情況包括：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp，以及 Zalo Personal。

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

## 設定提及模式的範圍

所設定的 `mentionPatterns` 是正規表示式備援觸發條件。當平台未公開原生機器人提及，或希望讓 `openclaw:` 之類的純文字也視為提及時，請使用這些模式。原生平台提及則分開處理：當 Discord、Slack、Telegram、Matrix、Signal 或其他頻道能證明訊息明確提及機器人時，即使設定的正規表示式模式遭到拒絕，該原生提及仍會觸發。

依預設，所設定的提及模式會套用至頻道將提供者與對話資訊傳入提及偵測的所有位置。為避免寬鬆模式在每個群組中喚醒代理程式，請使用 `channels.<channel>.mentionPatterns` 依頻道限定其範圍。

當某頻道預設應停用正規表示式提及模式時，請使用 `mode: "deny"`，再透過 `allowIn` 為特定聊天室選擇啟用：

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

當正規表示式提及模式應廣泛套用時，請使用預設的 `mode: "allow"`（或省略 `mode`），再透過 `denyIn` 在訊息過多的聊天室中將其停用：

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

原則解析：

| 欄位           | 效果                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非對話 ID 位於 `denyIn` 中，否則會啟用正規表示式提及模式。這是預設值。                    |
| `mode: "deny"`  | 除非對話 ID 位於 `allowIn` 中，否則會停用正規表示式提及模式。                                       |
| `allowIn`       | 在拒絕模式下啟用正規表示式提及模式的對話 ID。                                               |
| `denyIn`        | 停用正規表示式提及模式的對話 ID。如果兩者包含相同 ID，`denyIn` 優先於 `allowIn`。 |

目前支援限定範圍的正規表示式原則：

| 頻道  | `allowIn`／`denyIn` 中使用的 ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 頻道 ID。                                         |
| Matrix   | Matrix 聊天室 ID。                                             |
| Slack    | Slack 頻道 ID。                                           |
| Telegram | 群組聊天 ID，或論壇主題使用的 `chatId:topic:threadId`。 |
| WhatsApp | WhatsApp 對話 ID，例如 `123@g.us`。                |

當頻道支援多個帳號時，帳號層級的頻道設定可在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下設定相同原則。對於該帳號，帳號原則的優先順序高於頂層頻道原則。

<AccordionGroup>
  <Accordion title="提及閘控注意事項">
    - `mentionPatterns` 是不區分大小寫的安全正規表示式模式；無效模式與不安全的巢狀重複形式會被忽略（並發出警告）。
    - 模式優先順序：`agents.list[].groupChat.mentionPatterns`（多個代理程式共用群組時很有用）會覆寫 `messages.groupChat.mentionPatterns`；兩者皆未設定時，模式會從代理程式的身分名稱／表情符號衍生。
    - 只有在能夠偵測提及時（具有原生提及或已設定 `mentionPatterns`），才會強制執行提及閘控。
    - 將群組或傳送者加入允許清單不會停用提及閘控；如果所有訊息都應觸發，請將該群組的 `requireMention` 設為 `false`。
    - 自動群組聊天提示詞情境會在每一輪帶入已解析的靜默回覆指示；工作區檔案不應重複 `NO_REPLY` 的運作機制。
    - 允許自動靜默回覆的群組，會將完全空白或僅含推理內容的模型回合視為靜默，等同於 `NO_REPLY`。直接聊天永遠不會收到 `NO_REPLY` 指示，而僅使用訊息工具的群組回覆會因不呼叫 `message(action=send)` 而保持靜默。
    - 環境中的常駐群組對話預設使用使用者要求語意。改將 `messages.groupChat.unmentionedInbound: "room_event"` 設為靜默情境送出。設定範例請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。
    - 聊天室事件不會儲存為虛假的使用者要求，而沒有使用訊息工具之聊天室事件中的私人助理文字，也不會作為聊天記錄重新播放。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可針對個別伺服器／頻道覆寫）。
    - 群組歷史情境會以一致方式包裝於所有頻道。啟用提及閘控的群組會保留待處理且略過的訊息；如果頻道支援，常駐群組也可保留近期已處理的聊天室訊息。使用 `messages.groupChat.historyLimit` 設定全域預設值，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 即可停用。

  </Accordion>
</AccordionGroup>

## 群組／頻道工具限制（選用）

部分頻道設定支援限制**特定群組／聊天室／頻道內**可使用的工具。

- `tools`：允許／拒絕整個群組使用工具（`allow`、`alsoAllow`、`deny`；拒絕優先）。
- `toolsBySender`：群組內依傳送者覆寫。請使用明確的索引鍵前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 萬用字元。頻道 ID 使用標準 OpenClaw 頻道 ID；`teams` 等別名會正規化為 `msteams`。仍接受不含前綴的舊版索引鍵，但只會將其視為 `id:` 進行比對，並記錄棄用警告。

解析順序（最具體者優先）：

<Steps>
  <Step title="群組 toolsBySender">
    群組／頻道 `toolsBySender` 比對。
  </Step>
  <Step title="群組 tools">
    群組／頻道 `tools`。
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
群組／頻道工具限制會在全域／代理程式工具政策之外一併套用（拒絕規則仍優先）。部分頻道對聊天室／頻道使用不同的巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，其中的鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍可設定預設提及行為。

<Warning>
常見誤解：私訊配對核准與群組授權並不相同。對於支援私訊配對的頻道，配對儲存區只會解鎖私訊。群組命令仍需要透過設定允許清單明確授權群組傳送者，例如 `groupAllowFrom`，或該頻道文件中說明的設定後備機制。
</Warning>

常見用途（複製／貼上）：

<Tabs>
  <Tab title="停用所有群組回覆">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="僅允許特定群組（WhatsApp）">
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
  <Tab title="允許所有群組，但要求提及">
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
  <Tab title="僅擁有者可觸發（WhatsApp）">
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

群組擁有者可以使用獨立訊息切換各群組的啟用狀態：

- `/activation mention`
- `/activation always`

`/activation` 是核心中僅限擁有者使用的命令，且只適用於群組聊天。擁有者是指傳送者符合 `commands.ownerAllowFrom`；頻道的 `allowFrom` 清單只控制一般頻道與命令存取權。對於會查詢此設定的頻道（Google Chat、QQ Bot、Telegram、WhatsApp），儲存的模式會覆寫該群組的 `requireMention`，而所有頻道中的群組系統提示詞簡介都會反映目前生效的模式。

## 情境欄位

群組傳入承載資料會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及閘控結果）
- Telegram 論壇主題還會包含 `MessageThreadId` 和 `IsForum`。

在新群組工作階段的第一輪（以及 `/activation` 變更後），代理程式系統提示詞會包含群組簡介。它會提醒模型以真人般的方式回覆、盡量減少空白行並遵循一般聊天間距，以及避免輸入字面上的 `\n` 序列。若頻道宣告的表格模式不會保留原生或原始表格，也會不建議使用 Markdown 表格。源自頻道的群組名稱與參與者標籤會呈現為 fenced 不受信任中繼資料，而不是行內系統指示。

## iMessage 特定事項

- 進行路由或加入允許清單時，建議使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律傳回相同的 `chat_id`。

## WhatsApp 系統提示詞

如需標準 WhatsApp 系統提示詞規則，包括群組與直接提示詞解析、萬用字元行為及帳號覆寫語意，請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)。

## WhatsApp 特定事項

如需 WhatsApp 專屬行為（歷史記錄注入、提及處理細節），請參閱[群組訊息](/zh-TW/channels/group-messages)。

## 相關內容

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
