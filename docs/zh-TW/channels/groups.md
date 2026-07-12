---
read_when:
    - 變更群組聊天行為或提及閘控
    - 將 mentionPatterns 的範圍限定於特定群組對話
sidebarTitle: Groups
summary: 跨平台的群組聊天行為（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群組
x-i18n:
    generated_at: "2026-07-11T21:07:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在所有支援群組的頻道套用相同的群組規則，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

對於應持續啟用、除非代理程式明確傳送可見訊息，否則只提供安靜上下文的房間，請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。

## 初學者簡介（2 分鐘）

OpenClaw「存在於」你自己的訊息帳號中。它沒有獨立的 WhatsApp 機器人使用者：如果**你**在某個群組中，OpenClaw 就能看到該群組並在其中回覆。

預設行為：

- 群組受到限制（`groupPolicy: "allowlist"`）；群組傳送者在加入允許清單前會遭到封鎖。
- 除非你停用該群組的提及門檻，否則回覆需要提及。
- 最終回覆文字會自動發佈至房間（`visibleReplies: "automatic"`）。

換句話說：允許清單中的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**簡而言之**

- **私訊存取權**由 `*.allowFrom` 控制。
- **群組存取權**由 `*.groupPolicy` 與允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發條件**由提及門檻（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息的處理方式）：

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可見回覆

對於一般群組／頻道請求，OpenClaw 預設使用 `messages.groupChat.visibleReplies: "automatic"`：助理的最終文字會作為可見回覆發佈至房間。

如果共享房間應讓代理程式透過呼叫 `message(action=send)` 自行決定何時發言，請使用 `messages.groupChat.visibleReplies: "message_tool"`。此設定最適合能可靠使用工具的模型（例如 GPT-5.6 Sol）。如果模型未呼叫工具，卻傳回有實質內容的最終文字，OpenClaw 會將該文字保留為私密內容，而不會發佈至房間。

對於無法可靠遵循僅透過工具傳送要求的模型或執行環境，請使用 `"automatic"`：一般最終文字會直接發佈至房間，而代理程式仍可針對無法隨最終文字一同傳送的檔案、圖片或其他附件呼叫 `message(action=send)`。

如果目前的工具政策不允許使用訊息工具，OpenClaw 會改用自動可見回覆，而不會無聲地抑制回應。`openclaw doctor` 會針對此不相符情況發出警告。

對於直接聊天及任何其他來源事件，`messages.visibleReplies: "message_tool"` 會在全域套用相同的僅工具行為；`messages.groupChat.visibleReplies` 仍是群組／頻道房間更具體的覆寫設定。內部 WebChat 的直接對話預設會自動傳送最終回覆，讓 Pi 與 Codex 採用相同的可見回覆契約。

僅工具模式取代了過去在大多數潛水模式對話中強制模型回答 `NO_REPLY` 的做法。在僅工具模式中，提示不會定義 `NO_REPLY` 契約；不產生任何可見內容，僅表示不呼叫訊息工具。

由外掛擁有的對話綁定是例外。外掛綁定討論串並接管傳入對話後，外掛傳回的回覆就是可見的綁定回應；不需要呼叫 `message(action=send)`。該回覆是外掛執行環境的輸出，而不是私密的模型最終文字。

直接群組請求仍會傳送輸入中指示。啟用環境常駐房間事件時，除非代理程式呼叫訊息工具，否則這些事件會維持嚴格且安靜的行為。

工作階段預設會抑制詳細的工具／進度摘要。偵錯時，可使用 `/verbose on`（或 `/verbose full`）在目前工作階段顯示這些摘要，並使用 `/verbose off` 恢復為僅顯示最終回覆的行為。詳細資訊狀態是每個工作階段各自獨立的，且在直接聊天、群組、頻道及論壇主題中運作方式相同。

若要將未提及代理程式的常駐群組聊天作為安靜的房間上下文提交，而不是作為使用者請求，請使用[環境房間事件](/zh-TW/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

預設值為 `unmentionedInbound: "user_request"`。提及訊息、命令、中止請求及私訊仍會作為使用者請求。

若要要求群組／頻道請求的可見輸出必須透過訊息工具傳送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

若要對每個來源聊天套用此要求：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

儲存檔案後，閘道無須重新啟動即可套用 `messages` 設定變更。只有在停用設定重新載入（`gateway.reload.mode: "off"`）時才需要重新啟動。

命令對話會略過 `visibleReplies: "message_tool"`，並一律提供可見回覆：原生斜線命令（Discord、Telegram 及其他支援原生命令的介面）與已授權的文字 `/...` 命令，都會將回應發佈至來源聊天。群組中未授權的文字 `/...` 對話仍維持僅訊息工具模式；一般聊天對話則遵循設定的預設值。

## 上下文可見性與允許清單

群組安全性涉及兩種不同的控制方式：

- **觸發授權**：誰可以觸發代理程式（`groupPolicy`、`groups`、`groupAllowFrom`、各頻道專用的允許清單）。
- **上下文可見性**：哪些補充上下文會注入模型（回覆／引用文字、討論串歷史記錄、轉寄中繼資料）。

OpenClaw 預設會依接收時的原貌保留上下文：允許清單決定誰可以觸發動作，而不決定模型能看到哪些引用或歷史記錄片段。若也要篩選補充上下文，請設定 `contextVisibility`：

| 模式                  | 行為                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（預設）       | 依接收時的原貌保留補充上下文。                                                     |
| `"allowlist"`       | 只注入來自允許清單中傳送者的歷史記錄／討論串／引用／轉寄上下文。                       |
| `"allowlist_quote"` | 套用 `allowlist`，並保留明確引用或回覆的訊息，不論其傳送者是誰。                       |

你可以針對每個頻道（`channels.<channel>.contextVisibility`）、每個帳號（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全域（`channels.defaults.contextVisibility`）設定此值。會擷取補充上下文的頻道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）會在建立傳入上下文時套用此政策；未知的政策組合會採取封閉式失敗，並省略該上下文。

![群組訊息流程](/images/groups-flow.svg)

如果你想要……

| 目標                                         | 設定方式                                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但僅在 @提及時回覆              | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                              | `groupPolicy: "disabled"`                                  |
| 僅允許特定群組                                | `groups: { "<group-id>": { ... } }`（不含 `"*"` 鍵）        |
| 群組中只有你能觸發                            | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 在多個頻道重複使用同一組受信任的傳送者         | `groupAllowFrom: ["accessGroup:operators"]`                |

如需可重複使用的傳送者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段鍵（房間／頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會在群組 ID 後加入 `:topic:<threadId>`，因此每個主題都有自己的工作階段。
- 直接聊天使用主要工作階段（若已設定 `session.dmScope`，則使用每位傳送者各自的工作階段）。
- 心跳偵測會在設定的心跳偵測工作階段中執行（預設為代理程式的主要工作階段）；群組工作階段不會執行自己的心跳偵測。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人私訊 + 公開群組（單一代理程式）

可以——如果你的「個人」流量是**私訊**，而「公開」流量是**群組**，這種方式很適合。

原因是：在單一代理程式模式下，私訊通常會進入**主要**工作階段鍵（`agent:main:main`），而群組一律使用**非主要**工作階段鍵（`agent:main:<channel>:group:<id>`）。如果你啟用沙箱並設定 `mode: "non-main"`，這些群組工作階段會在設定的沙箱後端中執行，而你的主要私訊工作階段則繼續在主機上執行。如果你未選擇後端，預設會使用 Docker。

這讓你可以擁有一個代理程式「大腦」（共享工作區與記憶），但採用兩種執行模式：

- **私訊**：完整工具（主機）
- **群組**：沙箱 + 受限工具

<Note>
如果你需要真正分離的工作區／角色設定（「個人」與「公開」內容絕不能混合），請使用第二個代理程式與綁定。請參閱[多代理程式路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私訊在主機上執行，群組在沙箱中執行">
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
  <Tab title="群組只能看到允許清單中的資料夾">
    想讓「群組只能看到資料夾 X」，而不是「完全無法存取主機」嗎？請保留 `workspaceAccess: "none"`，並只將允許清單中的路徑掛載至沙箱：

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

相關內容：

- 設定鍵與預設值：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- 偵錯工具遭封鎖的原因：[沙箱、工具政策與提高權限的差異](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 繫結掛載的詳細資訊：[沙箱機制](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- 使用者介面標籤會在 `displayName` 可用時採用該值，並格式化為 `<channel>:<token>`。
- `#room` 保留供房間／頻道使用；群組聊天使用 `g-<slug>`（小寫、空格轉為 `-`，並保留 `#@+._-`）。對於非常長且不透明的 ID，系統會將其縮短為穩定的權杖，以免在使用者介面中洩漏完整的路由 ID。

## 群組政策

控制各頻道如何處理群組／房間訊息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // Telegram 數字使用者 ID（設定程序會解析 @username）
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

| 政策          | 行為                                               |
| ------------- | -------------------------------------------------- |
| `"open"`      | 群組略過允許清單；提及閘控仍然適用。               |
| `"disabled"`  | 完全封鎖所有群組訊息。                             |
| `"allowlist"` | 僅允許符合已設定允許清單的群組／房間。             |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘控（要求 @提及）彼此獨立。
    - WhatsApp／Telegram／Signal／iMessage／Microsoft Teams／Zalo：使用 `groupAllowFrom`（備援：明確設定的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以比對傳入的 Signal 群組 ID，或傳送者的電話號碼／UUID。
    - 私訊配對核准（`*-allowFrom` 儲存項目）僅適用於私訊存取；群組傳送者的授權仍須在群組允許清單中明確設定。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。請使用房間 ID（`!room:server`）或別名（`#alias:server`）；房間名稱鍵僅在 `channels.matrix.dangerouslyAllowNameMatching: true` 時才會比對，且執行階段會忽略無法解析的項目。使用 `channels.matrix.groupAllowFrom` 限制傳送者；亦支援各房間的 `users` 允許清單。
    - 群組私訊由其他設定獨立控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：傳送者允許清單僅接受數字使用者 ID（`"123456789"`；`telegram:`／`tg:` 前綴會以不區分大小寫的方式移除）。`@username` 項目在執行階段不會比對，並會記錄警告；設定程序會將 `@username` 解析為 ID。負數聊天 ID 應放在 `channels.telegram.groups` 下，而非傳送者允許清單。
    - 預設為 `groupPolicy: "allowlist"`；如果群組允許清單為空，群組訊息會遭封鎖。
    - 執行階段安全性：當某個提供者區塊完全不存在（缺少 `channels.<provider>`）時，群組政策會採取封閉式失敗，回復為 `allowlist`，而不會繼承 `channels.defaults.groupPolicy`；閘道會針對每個帳號記錄一次此備援情況。

  </Accordion>
</AccordionGroup>

快速心智模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open／disabled／allowlist）。
  </Step>
  <Step title="群組允許清單">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、頻道專用允許清單）。
  </Step>
  <Step title="提及閘控">
    提及閘控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘控（預設）

除非針對個別群組覆寫，否則群組訊息需要提及。各子系統的預設值位於 `*.groups."*"` 下。

當頻道提供回覆中繼資料時，回覆機器人的訊息視為隱含提及；在提供引用中繼資料的頻道上，引用機器人的訊息也可視為提及。目前內建支援的情況包括：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp，以及 Zalo Personal。

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

## 設定提及模式的適用範圍

已設定的 `mentionPatterns` 是正規表示式備援觸發條件。當平台未提供原生機器人提及，或 `openclaw:` 等純文字應視為提及時，請使用這些模式。原生平台提及是獨立機制：當 Discord、Slack、Telegram、Matrix 或其他頻道能證明訊息明確提及機器人時，即使已設定的正規表示式模式遭拒絕，該原生提及仍會觸發。

預設情況下，只要頻道會將提供者與對話資訊傳入提及偵測，已設定的提及模式就會全面套用。為避免廣泛的模式喚醒每個群組中的代理程式，請使用 `channels.<channel>.mentionPatterns` 依頻道限制其適用範圍。

如果某個頻道預設應停用正規表示式提及模式，請使用 `mode: "deny"`，再透過 `allowIn` 為特定房間啟用：

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

如果正規表示式提及模式應廣泛套用，請使用預設的 `mode: "allow"`（或省略 `mode`），再透過 `denyIn` 在吵雜的房間中停用：

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

政策解析：

| 欄位            | 效果                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非對話 ID 位於 `denyIn`，否則啟用正規表示式提及模式。這是預設值。                                      |
| `mode: "deny"`  | 除非對話 ID 位於 `allowIn`，否則停用正規表示式提及模式。                                                  |
| `allowIn`       | 在拒絕模式下啟用正規表示式提及模式的對話 ID。                                                            |
| `denyIn`        | 停用正規表示式提及模式的對話 ID。如果 `denyIn` 與 `allowIn` 都包含相同 ID，則以 `denyIn` 為準。           |

目前支援的限定範圍正規表示式政策：

| 頻道     | `allowIn`／`denyIn` 使用的 ID                                |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 頻道 ID。                                            |
| Matrix   | Matrix 房間 ID。                                             |
| Slack    | Slack 頻道 ID。                                              |
| Telegram | 群組聊天 ID；論壇主題則使用 `chatId:topic:threadId`。        |
| WhatsApp | WhatsApp 對話 ID，例如 `123@g.us`。                          |

如果頻道支援多個帳號，帳號層級的頻道設定可在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下設定相同政策。對於該帳號，帳號政策的優先順序高於頂層頻道政策。

<AccordionGroup>
  <Accordion title="提及閘控注意事項">
    - `mentionPatterns` 是不區分大小寫的安全正規表示式模式；無效模式與不安全的巢狀重複形式會遭忽略（並發出警告）。
    - 模式優先順序：`agents.list[].groupChat.mentionPatterns`（多個代理程式共用群組時很實用）會覆寫 `messages.groupChat.mentionPatterns`；若兩者皆未設定，則會根據代理程式身分的名稱／表情符號衍生模式。
    - 僅在能夠進行提及偵測時（有原生提及或已設定 `mentionPatterns`），才會強制執行提及閘控。
    - 將群組或傳送者加入允許清單不會停用提及閘控；若所有訊息都應觸發，請將該群組的 `requireMention` 設為 `false`。
    - 自動群組聊天提示詞內容會在每輪攜帶解析後的靜默回覆指示；工作區檔案不應重複 `NO_REPLY` 機制。
    - 在允許自動靜默回覆的群組中，乾淨的空白模型輪次或僅含推理的模型輪次會被視為靜默，等同於 `NO_REPLY`。直接聊天絕不會收到 `NO_REPLY` 指引，而僅使用訊息工具的群組回覆則透過不呼叫 `message(action=send)` 來保持靜默。
    - 持續開啟的環境群組對話預設採用使用者要求語意。若要改為以安靜的內容提交，請設定 `messages.groupChat.unmentionedInbound: "room_event"`。設定範例請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。
    - 房間事件不會儲存為虛假的使用者要求，且無訊息工具房間事件中的私人助理文字不會作為聊天記錄重新播放。
    - Discord 的預設值位於 `channels.discord.guilds."*"`（可依伺服器／頻道覆寫）。
    - 各頻道的群組歷史內容會以一致方式封裝。採用提及閘控的群組會保留待處理的已略過訊息；如果頻道支援，持續開啟的群組也可以保留最近已處理的房間訊息。使用 `messages.groupChat.historyLimit` 設定全域預設值，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 即可停用。

  </Accordion>
</AccordionGroup>

## 群組／頻道工具限制（選用）

部分頻道設定支援限制**特定群組／房間／頻道內**可用的工具。

- `tools`：允許／拒絕整個群組的工具（`allow`、`alsoAllow`、`deny`；拒絕優先）。
- `toolsBySender`：群組內依傳送者覆寫。請使用明確的鍵前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 萬用字元。頻道 ID 使用 OpenClaw 的標準頻道 ID；`teams` 等別名會正規化為 `msteams`。仍接受未加前綴的舊式鍵，但只會以 `id:` 方式比對，並記錄棄用警告。

解析順序（最明確者優先）：

<Steps>
  <Step title="群組 toolsBySender">
    群組／頻道的 `toolsBySender` 比對。
  </Step>
  <Step title="群組 tools">
    群組／頻道的 `tools`。
  </Step>
  <Step title="預設 toolsBySender">
    預設（`"*"`）的 `toolsBySender` 比對。
  </Step>
  <Step title="預設 tools">
    預設（`"*"`）的 `tools`。
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
群組／頻道工具限制會在全域／代理程式工具政策之外一併套用（拒絕仍然優先）。部分頻道對房間／頻道採用不同的巢狀結構（例如 Discord 的 `guilds.*.channels.*`、Slack 的 `channels.*`、Microsoft Teams 的 `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，其中的鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍能設定預設的提及行為。

<Warning>
常見混淆：私訊配對核准與群組授權並不相同。對於支援私訊配對的頻道，配對儲存區只會解鎖私訊。群組命令仍需透過設定允許清單明確授權群組傳送者，例如 `groupAllowFrom`，或該頻道文件所述的設定回退機制。
</Warning>

常見需求（複製／貼上）：

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
  <Tab title="僅限擁有者觸發（WhatsApp）">
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

## 啟用模式（僅限擁有者）

群組擁有者可以傳送獨立訊息，切換各群組的啟用模式：

- `/activation mention`
- `/activation always`

`/activation` 是核心中受擁有者權限限制的命令，僅適用於群組聊天。擁有者是指傳送者符合該頻道的 `allowFrom` / `commands.ownerAllowFrom`（未設定允許清單時，帳號本身的 ID 視為擁有者）。在會查詢此設定的頻道（Google Chat、QQ Bot、Telegram、WhatsApp）中，儲存的模式會覆寫該群組的 `requireMention`；所有頻道的群組系統提示詞開場也會反映目前啟用的模式。

## 上下文字段

群組傳入的承載資料會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及限制的判定結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 和 `IsForum`。

在新群組工作階段的第一輪（以及 `/activation` 變更後），代理程式系統提示詞會包含群組開場說明。它會提醒模型以真人般的方式回覆、盡量減少空白行並遵循一般聊天的間距格式，以及避免輸入字面上的 `\n` 序列。非 Telegram 群組也不建議使用 Markdown 表格；Telegram 的富文字指引則來自 Telegram 頻道提示詞。源自頻道的群組名稱與參與者標籤會呈現為以圍欄區隔的不受信任中繼資料，而非行內系統指示。

## iMessage 特定事項

- 路由或加入允許清單時，優先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律傳回相同的 `chat_id`。

## WhatsApp 系統提示詞

請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)，瞭解標準的 WhatsApp 系統提示詞規則，包括群組與直接提示詞解析、萬用字元行為，以及帳號覆寫語意。

## WhatsApp 特定事項

請參閱[群組訊息](/zh-TW/channels/group-messages)，瞭解僅適用於 WhatsApp 的行為（歷史記錄注入、提及處理細節）。

## 相關內容

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
