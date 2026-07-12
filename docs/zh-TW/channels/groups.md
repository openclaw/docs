---
read_when:
    - 變更群組聊天行為或提及閘控
    - 將 mentionPatterns 的範圍限定於特定群組對話
sidebarTitle: Groups
summary: 跨介面的群組聊天行為（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群組
x-i18n:
    generated_at: "2026-07-12T14:18:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在所有支援群組的頻道套用相同的群組規則，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

若要讓常駐聊天室在代理程式未明確傳送可見訊息時，只提供安靜的情境資訊，請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

## 新手簡介（2 分鐘）

OpenClaw「存在於」你自己的訊息帳號中。它不會建立另一個 WhatsApp 機器人使用者：如果**你**在某個群組中，OpenClaw 就能看到該群組並在其中回覆。

預設行為：

- 群組受到限制（`groupPolicy: "allowlist"`）；群組傳送者必須加入允許清單後才能使用。
- 除非你停用某個群組的提及限制，否則必須提及 OpenClaw 才會回覆。
- 最終回覆文字會自動發布到聊天室（`visibleReplies: "automatic"`）。

換句話說：允許清單中的傳送者可以提及 OpenClaw 來觸發它。

<Note>
**簡而言之**

- **私訊存取權**由 `*.allowFrom` 控制。
- **群組存取權**由 `*.groupPolicy` 與允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發條件**由提及限制（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息會如何處理）：

```text
groupPolicy？disabled -> 捨棄
groupPolicy？allowlist -> 群組是否獲准？否 -> 捨棄
requireMention？是 -> 是否已提及？否 -> 僅儲存為情境資訊
提及／回覆／命令／私訊 -> 使用者要求
常駐群組對話 -> 使用者要求；若已設定，則為聊天室事件
```

## 可見回覆

對於一般的群組／頻道要求，OpenClaw 預設使用 `messages.groupChat.visibleReplies: "automatic"`：最終的助理文字會作為可見回覆發布到聊天室。

如果共享聊天室應讓代理程式透過呼叫 `message(action=send)` 自行決定何時發言，請使用 `messages.groupChat.visibleReplies: "message_tool"`。此設定最適合能可靠使用工具的模型（例如 GPT-5.6 Sol）。如果模型未使用該工具而直接傳回具實質內容的最終文字，OpenClaw 會將該文字保留為私密內容，而不發布到聊天室。

對於無法可靠遵循僅限工具傳送規則的模型或執行階段，請使用 `"automatic"`：一般的最終文字會直接發布到聊天室，而代理程式仍可針對無法隨最終文字一併傳送的檔案、圖片或其他附件，呼叫 `message(action=send)`。

如果目前的工具政策不允許使用訊息工具，OpenClaw 會改用自動可見回覆，而不會無聲地隱藏回應。`openclaw doctor` 會針對這項不一致提出警告。

對於直接聊天及任何其他來源事件，`messages.visibleReplies: "message_tool"` 會在全域套用相同的僅限工具行為；`messages.groupChat.visibleReplies` 仍是針對群組／頻道聊天室更具體的覆寫設定。內部 WebChat 的直接對話預設會自動傳送最終回覆，讓 Pi 與 Codex 採用相同的可見回覆合約。

僅限工具模式取代了舊有做法，不再強迫模型在大多數旁觀模式的對話中回答 `NO_REPLY`。在僅限工具模式下，提示不會定義 `NO_REPLY` 合約；不執行任何可見動作，只代表未呼叫訊息工具。

由外掛擁有的對話繫結是例外。外掛繫結討論串並接管傳入對話後，外掛傳回的回覆就是可見的繫結回應；不需要呼叫 `message(action=send)`。該回覆是外掛執行階段的輸出，而不是模型的私密最終文字。

對於直接的群組要求，仍會傳送輸入狀態指示。啟用環境常駐聊天室事件後，除非代理程式呼叫訊息工具，否則這類事件仍會嚴格保持安靜。

工作階段預設會隱藏詳細的工具／進度摘要。偵錯時可使用 `/verbose on`（或 `/verbose full`）在目前工作階段顯示這些摘要，並使用 `/verbose off` 恢復為僅顯示最終回覆的行為。詳細模式狀態以工作階段為單位，且在直接聊天、群組、頻道和論壇主題中的運作方式相同。

若要將未提及 OpenClaw 的常駐群組對話作為安靜的聊天室情境資訊提交，而非使用者要求，請使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

預設值為 `unmentionedInbound: "user_request"`。已提及的訊息、命令、中止要求和私訊仍會視為使用者要求。

若要強制群組／頻道要求的可見輸出必須透過訊息工具傳送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

若要對所有來源聊天強制套用：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

儲存檔案後，閘道會直接套用 `messages` 設定變更，無須重新啟動。只有停用設定重新載入時（`gateway.reload.mode: "off"`）才需要重新啟動。

命令對話會略過 `visibleReplies: "message_tool"`，並一律以可見方式回覆：原生斜線命令（Discord、Telegram，以及其他支援原生命令的介面）和已授權的文字 `/...` 命令，都會將回應發布到來源聊天。在群組中，未授權的文字 `/...` 對話仍僅限透過訊息工具回覆；一般聊天對話則遵循已設定的預設值。

## 情境資訊可見性與允許清單

群組安全性涉及兩項不同的控制：

- **觸發授權**：誰能觸發代理程式（`groupPolicy`、`groups`、`groupAllowFrom`、頻道專用的允許清單）。
- **情境資訊可見性**：哪些補充情境資訊會注入模型（回覆／引用文字、討論串記錄、轉傳中繼資料）。

OpenClaw 預設會依收到的內容保留情境資訊：允許清單決定誰能觸發動作，而不是決定模型能看到哪些引用或歷史片段。若也要篩選補充情境資訊，請設定 `contextVisibility`：

| 模式                | 行為                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（預設）   | 依收到的內容保留補充情境資訊。                                           |
| `"allowlist"`       | 僅注入來自允許清單中傳送者的歷史記錄／討論串／引用／轉傳情境資訊。     |
| `"allowlist_quote"` | 套用 `allowlist`，並保留來自任何傳送者且明確引用／回覆的訊息。 |

你可以針對各頻道（`channels.<channel>.contextVisibility`）、各帳號（`channels.<channel>.accounts.<accountId>.contextVisibility`），或在全域（`channels.defaults.contextVisibility`）設定。會擷取補充情境資訊的頻道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）會在建立傳入情境資訊時套用此政策；未知的政策組合會採取拒絕優先原則，並省略情境資訊。

![群組訊息流程](/images/groups-flow.svg)

如果你想要……

| 目標                                         | 設定內容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但只回覆 @提及 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 僅允許特定群組                         | `groups: { "<group-id>": { ... } }`（不含 `"*"` 鍵）         |
| 群組中只有你能觸發               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 在多個頻道重複使用同一組受信任的傳送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

如需可重複使用的傳送者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段鍵（聊天室／頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會在群組 ID 後加上 `:topic:<threadId>`，讓每個主題擁有自己的工作階段。
- 直接聊天使用主要工作階段（若已設定 `session.dmScope`，則使用個別傳送者的工作階段）。
- 心跳偵測會在已設定的心跳偵測工作階段中執行（預設為代理程式的主要工作階段）；群組工作階段不會執行自己的心跳偵測。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：私人私訊＋公開群組（單一代理程式）

可以——如果你的「私人」流量是**私訊**，而「公開」流量是**群組**，這種方式會運作得很好。

原因是：在單一代理程式模式下，私訊通常會進入**主要**工作階段鍵（`agent:main:main`），而群組一律使用**非主要**工作階段鍵（`agent:main:<channel>:group:<id>`）。如果你以 `mode: "non-main"` 啟用沙箱，這些群組工作階段會在已設定的沙箱後端中執行，而你的主要私訊工作階段仍在主機上執行。如果你未選擇後端，預設會使用 Docker。

這樣會提供一個代理程式「大腦」（共用工作區＋記憶），但具備兩種執行模式：

- **私訊**：完整工具（主機）
- **群組**：沙箱＋受限工具

<Note>
如果你需要完全分離的工作區／角色設定（「私人」與「公開」絕不能混合），請使用第二個代理程式與繫結。請參閱[多代理程式路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私訊在主機上執行，群組在沙箱中執行">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // 群組／頻道為非主要工作階段 -> 在沙箱中執行
            scope: "session", // 最強隔離（每個群組／頻道各使用一個容器）
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
    想讓「群組只能看到資料夾 X」，而不是「完全無法存取主機」嗎？保留 `workspaceAccess: "none"`，並只將允許清單中的路徑掛載至沙箱：

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
- 偵錯工具遭封鎖的原因：[沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 繫結掛載詳細資訊：[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- UI 標籤會使用可用的 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留供聊天室／頻道使用；群組聊天使用 `g-<slug>`（小寫、空格 -> `-`、保留 `#@+._-`）。非常長且不透明的 ID 會縮短為穩定的權杖，避免在 UI 中洩漏完整的路由 ID。

## 群組政策

控制各頻道如何處理群組／聊天室訊息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 數字 Telegram 使用者 ID（設定流程會解析 @username）
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

| 政策          | 行為                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群組可略過允許清單；提及閘門仍然適用。                       |
| `"disabled"`  | 完全封鎖所有群組訊息。                                       |
| `"allowlist"` | 僅允許符合已設定允許清單的群組／聊天室。                     |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘門（要求 @提及）分開運作。
    - WhatsApp／Telegram／Signal／iMessage／Microsoft Teams／Zalo：使用 `groupAllowFrom`（備援：明確設定的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可比對傳入的 Signal 群組 ID 或傳送者的電話號碼／UUID。
    - 私訊配對核准（`*-allowFrom` 儲存項目）僅適用於私訊存取；群組傳送者授權仍須明確使用群組允許清單。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。請使用聊天室 ID（`!room:server`）或別名（`#alias:server`）；聊天室名稱鍵僅在 `channels.matrix.dangerouslyAllowNameMatching: true` 時才會比對，且執行階段會忽略無法解析的項目。使用 `channels.matrix.groupAllowFrom` 限制傳送者；也支援各聊天室的 `users` 允許清單。
    - 群組私訊會分開控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：傳送者允許清單僅接受數字使用者 ID（`"123456789"`；會以不區分大小寫的方式移除 `telegram:`／`tg:` 前綴）。`@username` 項目在執行階段不會比對，並會記錄警告；設定流程會將 `@username` 解析為 ID。負數聊天 ID 應放在 `channels.telegram.groups` 下，而不是傳送者允許清單中。
    - 預設值為 `groupPolicy: "allowlist"`；如果你的群組允許清單為空，群組訊息會遭到封鎖。
    - 執行階段安全性：當供應商區塊完全不存在時（缺少 `channels.<provider>`），群組政策會以封閉式失敗方式設為 `allowlist`，而不會繼承 `channels.defaults.groupPolicy`，且閘道會針對每個帳號記錄一次此備援行為。

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
  <Step title="提及閘門">
    提及閘門（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘門（預設）

群組訊息必須包含提及，除非針對個別群組覆寫此設定。預設值位於各子系統的 `*.groups."*"` 下。

當頻道提供回覆中繼資料時，回覆機器人的訊息會視為隱含提及；在提供引用中繼資料的頻道中，引用機器人的訊息也可視為提及。目前內建支援的情況包括：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp，以及 Zalo Personal。

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

## 限定已設定提及模式的範圍

已設定的 `mentionPatterns` 是正規表示式備援觸發條件。當平台未提供原生機器人提及，或 `openclaw:` 等純文字應視為提及時，請使用這些模式。原生平台提及會分開處理：當 Discord、Slack、Telegram、Matrix 或其他頻道能證明訊息明確提及機器人時，即使已設定的正規表示式模式遭拒絕，該原生提及仍會觸發。

依預設，已設定的提及模式會套用至頻道將供應商和對話資訊傳入提及偵測的所有位置。若要避免廣泛模式喚醒每個群組中的代理程式，請使用 `channels.<channel>.mentionPatterns` 依頻道限定範圍。

若頻道預設應停用正規表示式提及模式，請使用 `mode: "deny"`，再透過 `allowIn` 針對特定聊天室選擇啟用：

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

若正規表示式提及模式應廣泛套用，請使用預設的 `mode: "allow"`（或省略 `mode`），再透過 `denyIn` 於訊息繁雜的聊天室中停用：

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

| 欄位            | 效果                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非對話 ID 位於 `denyIn` 中，否則會啟用正規表示式提及模式。這是預設值。                                               |
| `mode: "deny"`  | 除非對話 ID 位於 `allowIn` 中，否則會停用正規表示式提及模式。                                                          |
| `allowIn`       | 在拒絕模式下啟用正規表示式提及模式的對話 ID。                                                                         |
| `denyIn`        | 停用正規表示式提及模式的對話 ID。如果相同 ID 同時包含在兩者中，`denyIn` 的優先順序高於 `allowIn`。                     |

目前支援的範圍正規表示式政策：

| 頻道     | `allowIn` / `denyIn` 中使用的 ID                              |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 頻道 ID。                                            |
| Matrix   | Matrix 聊天室 ID。                                           |
| Slack    | Slack 頻道 ID。                                              |
| Telegram | 群組聊天 ID，或論壇主題使用的 `chatId:topic:threadId`。      |
| WhatsApp | WhatsApp 對話 ID，例如 `123@g.us`。                          |

帳號層級的頻道設定可在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下設定相同的原則（若該頻道支援多個帳號）。對該帳號而言，帳號原則的優先順序高於頂層頻道原則。

<AccordionGroup>
  <Accordion title="提及閘控注意事項">
    - `mentionPatterns` 是不區分大小寫的安全正規表示式模式；無效模式與不安全的巢狀重複形式會被忽略（並顯示警告）。
    - 模式優先順序：`agents.list[].groupChat.mentionPatterns`（當多個代理共用群組時很有用）會覆寫 `messages.groupChat.mentionPatterns`；若兩者皆未設定，則會從代理身分的名稱／表情符號衍生模式。
    - 僅在能夠偵測提及時（原生提及或已設定 `mentionPatterns`），才會強制執行提及閘控。
    - 將群組或傳送者加入允許清單不會停用提及閘控；若所有訊息都應觸發，請將該群組的 `requireMention` 設為 `false`。
    - 自動群組聊天提示詞內容會在每一輪帶入解析後的靜默回覆指示；工作區檔案不應重複 `NO_REPLY` 機制。
    - 允許自動靜默回覆的群組，會將完全空白或僅含推理的模型輪次視為靜默，等同於 `NO_REPLY`。直接聊天絕不會收到 `NO_REPLY` 指引，而僅使用訊息工具的群組回覆會藉由不呼叫 `message(action=send)` 來保持安靜。
    - 預設情況下，環境中持續進行的群組對話會使用使用者請求語意。若要改以安靜內容提交，請設定 `messages.groupChat.unmentionedInbound: "room_event"`。設定範例請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。
    - 房間事件不會儲存為虛假的使用者請求，而未使用訊息工具之房間事件中的私人助理文字，也不會重播為聊天記錄。
    - Discord 的預設值位於 `channels.discord.guilds."*"`（可針對各伺服器／頻道覆寫）。
    - 所有頻道的群組記錄內容都會以一致方式包裝。採用提及閘控的群組會保留待處理且已略過的訊息；當頻道支援時，持續啟用的群組也可能保留最近處理過的房間訊息。全域預設值請使用 `messages.groupChat.historyLimit`，覆寫值則使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）。設為 `0` 即可停用。

  </Accordion>
</AccordionGroup>

## 群組／頻道工具限制（選用）

某些頻道設定支援限制**特定群組／聊天室／頻道內**可使用的工具。

- `tools`：允許／拒絕整個群組使用工具（`allow`、`alsoAllow`、`deny`；拒絕優先）。
- `toolsBySender`：群組內依傳送者設定的覆寫規則。請使用明確的鍵前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及萬用字元 `"*"`。頻道 ID 使用 OpenClaw 的標準頻道 ID；例如 `teams` 等別名會正規化為 `msteams`。舊版無前綴鍵仍可使用，但只會以 `id:` 進行比對，並記錄棄用警告。

解析順序（最具體者優先）：

<Steps>
  <Step title="群組 toolsBySender">
    比對群組／頻道的 `toolsBySender`。
  </Step>
  <Step title="群組 tools">
    群組／頻道的 `tools`。
  </Step>
  <Step title="預設 toolsBySender">
    比對預設（`"*"`）`toolsBySender`。
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
群組／頻道工具限制會與全域／代理程式工具政策一併套用（拒絕仍然優先）。部分頻道的聊天室／頻道使用不同的巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，其鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍可設定預設提及行為。

<Warning>
常見混淆：私訊配對核准與群組授權並不相同。對於支援私訊配對的頻道，配對儲存區只會解鎖私訊。群組命令仍需透過設定允許清單（例如 `groupAllowFrom`）或該頻道文件記載的設定備援機制，明確授權群組傳送者。
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
  <Tab title="允許所有群組，但必須提及">
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

## 啟用模式（僅限擁有者）

群組擁有者可以透過單獨傳送下列訊息，切換各群組的啟用模式：

- `/activation mention`
- `/activation always`

`/activation` 是核心的擁有者限制命令，且僅適用於群組聊天。擁有者是指傳送者符合該頻道的 `allowFrom` / `commands.ownerAllowFrom`（若未設定允許清單，該帳號本身的 ID 也視為擁有者）。在會查詢此設定的頻道（Google Chat、QQ Bot、Telegram、WhatsApp）上，儲存的模式會覆寫該群組的 `requireMention`；所有頻道中的群組系統提示詞開場內容也會反映目前啟用的模式。

## 情境欄位

群組傳入酬載會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及閘控結果）
- Telegram 論壇主題還會包含 `MessageThreadId` 和 `IsForum`。

在新群組工作階段的第一輪（以及 `/activation` 變更後），代理程式系統提示詞會包含群組開場內容。它會提醒模型以真人般的方式回覆、盡量減少空白行並遵循一般聊天的空格與換行方式，且避免輸入字面上的 `\n` 序列。非 Telegram 群組也不建議使用 Markdown 表格；Telegram 的富文字指南則來自 Telegram 頻道提示詞。來自頻道的群組名稱與參與者標籤會呈現為以程式碼圍欄包住的不受信任中繼資料，而不是行內系統指示。

## iMessage 特定事項

- 路由或加入允許清單時，優先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律傳回相同的 `chat_id`。

## WhatsApp 系統提示詞

關於標準的 WhatsApp 系統提示詞規則，包括群組與直接提示詞解析、萬用字元行為及帳號覆寫語意，請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)。

## WhatsApp 特定事項

關於僅適用於 WhatsApp 的行為（歷史記錄注入、提及處理細節），請參閱[群組訊息](/zh-TW/channels/group-messages)。

## 相關內容

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
