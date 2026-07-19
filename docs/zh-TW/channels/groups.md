---
read_when:
    - 變更群組聊天行為或提及閘控
    - 將 mentionPatterns 的範圍限定於特定群組對話
sidebarTitle: Groups
summary: 跨介面的群組聊天行為（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群組
x-i18n:
    generated_at: "2026-07-19T13:34:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f493f5737c147c097c666f1f13fb612232be6dc1ace51e910d437b02e960ec52
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在所有支援群組的頻道中套用相同的群組規則，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

對於應保持隨時啟用、除非代理明確傳送可見訊息，否則只提供安靜脈絡的聊天室，請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

## 新手簡介（2 分鐘）

OpenClaw「存在」於你自己的訊息帳號中。它沒有獨立的 WhatsApp 機器人使用者：如果**你**在某個群組中，OpenClaw 就能看到該群組並在其中回應。

預設行為：

- 群組受到限制（`groupPolicy: "allowlist"`）；群組傳送者在加入允許清單前都會遭到封鎖。
- 除非你停用該群組的提及閘控，否則回覆需要提及。
- 最終回覆文字會自動發佈到聊天室（`visibleReplies: "automatic"`）。

換句話說：允許清單中的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**簡而言之**

- **私訊存取權**由 `*.allowFrom` 控制。
- **群組存取權**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及閘控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息的處理方式）：

```text
groupPolicy？disabled -> 捨棄
groupPolicy？allowlist -> 群組是否允許？否 -> 捨棄
requireMention？是 -> 是否被提及？否 -> 僅儲存為脈絡
提及／回覆／命令／私訊 -> 使用者要求
隨時啟用的群組對話 -> 使用者要求，或設定後成為聊天室事件
```

## 可見回覆

對於一般群組／頻道要求，OpenClaw 預設使用 `messages.groupChat.visibleReplies: "automatic"`：最終助理文字會作為可見回覆發佈到聊天室。

當共用聊天室應讓代理透過呼叫 `message(action=send)` 自行決定何時發言時，請使用 `messages.groupChat.visibleReplies: "message_tool"`。這最適合能可靠使用工具的模型（例如 GPT-5.6 Sol）。如果模型未使用該工具並傳回具實質內容的最終文字，OpenClaw 會將該文字保留為私人內容，而不發佈到聊天室。

對於無法可靠遵循僅限工具傳遞方式的模型或執行階段，請使用 `"automatic"`：一般最終文字會直接發佈到聊天室，而代理仍可針對無法隨最終文字一併傳送的檔案、圖片或其他附件呼叫 `message(action=send)`。

如果目前的工具政策不提供訊息工具，OpenClaw 會改用自動可見回覆，而不會無聲地抑制回應。`openclaw doctor` 會警告此項不相符。

對於直接聊天及任何其他來源事件，`messages.visibleReplies: "message_tool"` 會在全域套用相同的僅限工具行為；`messages.groupChat.visibleReplies` 仍是群組／頻道聊天室更明確的覆寫設定。內部 WebChat 直接回合預設會自動傳遞最終回覆，因此 Pi 和 Codex 會收到相同的可見回覆契約。

僅限工具模式會取代舊有模式，不再強制模型於大多數潛伏模式回合中回答 `NO_REPLY`。在僅限工具模式下，提示不會定義 `NO_REPLY` 契約；不執行任何可見動作，單純代表不呼叫訊息工具。

外掛所擁有的對話繫結是例外。外掛繫結討論串並取得輸入回合後，外掛傳回的回覆就是可見的繫結回應；不需要 `message(action=send)`。該回覆是外掛執行階段的輸出，而不是模型的私人最終文字。

直接群組要求仍會傳送輸入指示器。啟用環境隨時開啟的聊天室事件後，除非代理呼叫訊息工具，否則仍會嚴格保持安靜。

工作階段預設會抑制詳細的工具／進度摘要。偵錯時，請使用 `/verbose on`（或 `/verbose full`）在目前工作階段中顯示這些摘要，並使用 `/verbose off` 恢復為僅顯示最終回覆的行為。詳細狀態以工作階段為單位，且在直接聊天、群組、頻道和論壇主題中的運作方式相同。

若要將未提及代理的隨時啟用群組對話作為安靜的聊天室脈絡，而非使用者要求提交，請使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

預設值為 `unmentionedInbound: "user_request"`。已提及代理的訊息、命令、中止要求和私訊仍屬於使用者要求。

若要要求群組／頻道要求的可見輸出必須透過訊息工具傳送：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

若要對每個來源聊天都套用此要求：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

儲存檔案後，閘道會在不重新啟動的情況下取得 `messages` 設定變更。只有在停用設定重新載入（`gateway.reload.mode: "off"`）時才需重新啟動。

命令回合會略過 `visibleReplies: "message_tool"`，並一律以可見方式回覆：原生斜線命令（Discord、Telegram 及其他支援原生命令的介面）與經授權的文字 `/...` 命令，都會將回應發佈到來源聊天。群組中未經授權的文字 `/...` 回合仍僅能使用訊息工具；一般聊天回合則遵循設定的預設值。

## 脈絡可見性與允許清單

群組安全涉及兩種不同的控制：

- **觸發授權**：誰可以觸發代理（`groupPolicy`、`groups`、`groupAllowFrom`、頻道專用允許清單）。
- **脈絡可見性**：哪些補充脈絡會注入模型（回覆／引用文字、討論串歷史記錄、轉寄中繼資料）。

OpenClaw 預設會依收到的原貌保留脈絡：允許清單決定誰能觸發動作，而非模型可以看到哪些引用或歷史片段。若也要篩選補充脈絡，請設定 `contextVisibility`：

| 模式                | 行為                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（預設）   | 依收到的原貌保留補充脈絡。                                           |
| `"allowlist"`       | 僅注入來自允許清單傳送者的歷史記錄／討論串／引用／轉寄脈絡。     |
| `"allowlist_quote"` | `allowlist`，並保留明確引用或回覆的任何傳送者訊息。 |

可依頻道（`channels.<channel>.contextVisibility`）、依帳號（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全域（`channels.defaults.contextVisibility`）設定。會擷取補充脈絡的頻道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）會在建構輸入脈絡時套用此政策；未知的政策組合會採取封閉式失敗，並省略脈絡。

![群組訊息流程](/images/groups-flow.svg)

如果你想要……

| 目標                                         | 設定內容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但僅在 @提及時回覆 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 僅限特定群組                         | `groups: { "<group-id>": { ... } }`（無 `"*"` 鍵）         |
| 群組中只有你能觸發               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 跨頻道重複使用同一組受信任傳送者 | `groupAllowFrom: ["accessGroup:operators"]`                |

如需可重複使用的傳送者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段索引鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段索引鍵（聊天室／頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會將 `:topic:<threadId>` 加入群組 ID，使每個主題都有自己的工作階段。
- 直接聊天使用主要工作階段（如果已設定 `session.dmScope`，則使用各傳送者的工作階段）。
- 心跳偵測會在設定的心跳偵測工作階段中執行（預設為代理的主要工作階段）；群組工作階段不會執行自己的心跳偵測。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：私人私訊 + 公開群組（單一代理）

可以——如果你的「私人」流量是**私訊**，而「公開」流量是**群組**，這種方式運作良好。

原因：在單一代理模式中，私訊通常會進入**主要**工作階段索引鍵（`agent:main:main`），而群組一律使用**非主要**工作階段索引鍵（`agent:main:<channel>:group:<id>`）。如果你使用 `mode: "non-main"` 啟用沙箱，這些群組工作階段會在設定的沙箱後端中執行，而你的主要私訊工作階段會留在主機上。如果未選擇後端，預設使用 Docker。

如此一來，你會有一個代理「大腦」（共用工作區 + 記憶），但具備兩種執行態勢：

- **私訊**：完整工具（主機）
- **群組**：沙箱 + 受限工具

<Note>
如果你需要真正獨立的工作區／角色（「私人」和「公開」絕不能混合），請使用第二個代理 + 繫結。請參閱[多代理路由](/zh-TW/concepts/multi-agent)。
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
            // 如果 allow 非空，其他所有項目都會遭到封鎖（deny 仍優先）。
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="群組只能看到允許清單中的資料夾">
    想要「群組只能看到資料夾 X」，而不是「無法存取主機」嗎？請保留 `workspaceAccess: "none"`，並僅將允許清單中的路徑掛載到沙箱：

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
- 偵錯工具遭封鎖的原因：[沙箱與工具政策及提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 繫結掛載詳細資訊：[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- 使用者介面標籤會在可用時使用 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留供聊天室／頻道使用；群組聊天使用 `g-<slug>`（小寫、空格 -> `-`、保留 `#@+._-`）。很長的不透明 ID 會縮短為穩定的權杖，以免在使用者介面中洩露完整路由 ID。

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
      groupAllowFrom: ["123456789"], // 數字 Telegram 使用者 ID（設定程序會解析 @username）
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

| 原則          | 行為                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群組會略過允許清單；提及閘控仍然適用。                       |
| `"disabled"`  | 完全封鎖所有群組訊息。                                       |
| `"allowlist"` | 僅允許符合已設定允許清單的群組／聊天室。                     |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘控（要求 @提及）彼此獨立。
    - WhatsApp／Telegram／Signal／iMessage／Microsoft Teams／Zalo：使用 `groupAllowFrom`（後備選項：明確設定 `allowFrom`）。
    - Signal：`groupAllowFrom` 可比對傳入的 Signal 群組 ID，或傳送者的電話號碼／UUID。
    - 私訊配對核准（`*-allowFrom` 儲存項目）僅適用於私訊存取；群組傳送者授權仍須明確設定於群組允許清單中。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。請使用聊天室 ID（`!room:server`）或別名（`#alias:server`）；聊天室名稱鍵僅在設定 `channels.matrix.dangerouslyAllowNameMatching: true` 時才會比對，且無法解析的項目會在執行階段被忽略。使用 `channels.matrix.groupAllowFrom` 限制傳送者；也支援每個聊天室的 `users` 允許清單。
    - 群組私訊會分開控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：傳送者允許清單僅接受數字使用者 ID（`"123456789"`；`telegram:`/`tg:` 前綴會以不區分大小寫的方式移除）。`@username` 項目不會在執行階段比對，並會記錄警告；設定程序會將 `@username` 解析為 ID。負數聊天 ID 應放在 `channels.telegram.groups` 下，而非傳送者允許清單。
    - 預設值為 `groupPolicy: "allowlist"`；若你的群組允許清單是空的，群組訊息將被封鎖。
    - 執行階段安全性：當供應商區塊完全不存在（缺少 `channels.<provider>`）時，群組原則會以故障關閉方式採用 `allowlist`，而非繼承 `channels.defaults.groupPolicy`，且閘道會針對每個帳號記錄一次此後備行為。

  </Accordion>
</AccordionGroup>

快速理解模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群組允許清單">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、頻道專用允許清單）。
  </Step>
  <Step title="提及閘控">
    提及閘控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘控（預設）

除非針對個別群組覆寫，否則群組訊息必須包含提及。預設值位於各子系統的 `*.groups."*"` 下。

支援的隱含提及事實因頻道而異：

| 事實                  | 目前內建的產生來源                               |
| --------------------- | ------------------------------------------------ |
| 回覆機器人            | Discord、Microsoft Teams、QQ Bot、Slack、Telegram |
| 引用機器人            | WhatsApp、Zalo Personal                          |
| 機器人已加入討論串    | Mattermost、Slack、Tlon                          |

當頻道能產生某項事實時，該事實預設為啟用。將對應的 `implicitMentions` 旗標設為 `false`，即可阻止該事實略過提及閘控；原生的明確提及不受影響。對於不會產生該事實的頻道，此旗標不會產生任何作用。

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

已設定的 `mentionPatterns` 是正規表示式後備觸發條件。當平台未公開原生機器人提及，或你想讓 `openclaw:` 等純文字也視為提及時，請使用這些模式。原生平台提及會分開處理：當 Discord、Slack、Telegram、Matrix、Signal 或其他頻道能證明訊息明確提及機器人時，即使已設定的正規表示式模式被拒絕，該原生提及仍會觸發。

根據預設，只要頻道將供應商與對話事實傳入提及偵測，已設定的提及模式就會套用。為避免寬鬆模式在每個群組中喚醒代理程式，請使用 `channels.<channel>.mentionPatterns` 依頻道限定其範圍。

當某個頻道預設應停用正規表示式提及模式，再使用 `allowIn` 針對特定聊天室選擇啟用時，請使用 `mode: "deny"`：

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

當正規表示式提及模式應廣泛套用時，使用預設的 `mode: "allow"`（或省略 `mode`），再使用 `denyIn` 於訊息繁雜的聊天室中停用：

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

| 欄位            | 效果                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非對話 ID 位於 `denyIn` 中，否則啟用正規表示式提及模式。這是預設值。                                     |
| `mode: "deny"`  | 除非對話 ID 位於 `allowIn` 中，否則停用正規表示式提及模式。                                                 |
| `allowIn`       | 在拒絕模式下啟用正規表示式提及模式的對話 ID。                                                                       |
| `denyIn`        | 停用正規表示式提及模式的對話 ID。若兩者包含相同 ID，`denyIn` 的優先順序高於 `allowIn`。          |

目前支援限定範圍的正規表示式原則：

| 頻道     | `allowIn` / `denyIn` 中使用的 ID                    |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 頻道 ID。                                            |
| Matrix   | Matrix 聊天室 ID。                                           |
| Slack    | Slack 頻道 ID。                                              |
| Telegram | 群組聊天 ID，或論壇主題使用的 `chatId:topic:threadId`。          |
| WhatsApp | WhatsApp 對話 ID，例如 `123@g.us`。                  |

若頻道支援多個帳號，帳號層級的頻道設定可在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下設定相同原則。對該帳號而言，帳號原則的優先順序高於頂層頻道原則。

<AccordionGroup>
  <Accordion title="提及閘控注意事項">
    - `mentionPatterns` 是不區分大小寫的安全正規表示式模式；無效模式及不安全的巢狀重複形式會被忽略（並記錄警告）。
    - 模式優先順序：`agents.list[].groupChat.mentionPatterns`（多個代理程式共用群組時很實用）的優先順序高於 `messages.groupChat.mentionPatterns`；兩者皆未設定時，會從代理程式的身分名稱／表情符號衍生模式。
    - 只有在能夠偵測提及（原生提及或已設定 `mentionPatterns`）時，才會強制執行提及閘控。
    - 將群組或傳送者加入允許清單不會停用提及閘控；若所有訊息都應觸發，請將該群組的 `requireMention` 設為 `false`。
    - 自動群組聊天提示詞內容會在每一輪攜帶已解析的靜默回覆指示；工作區檔案不應重複 `NO_REPLY` 的機制。
    - 允許自動靜默回覆的群組，會將乾淨的空白或僅含推理的模型輪次視為靜默，等同於 `NO_REPLY`。直接聊天永遠不會收到 `NO_REPLY` 指引，而僅使用訊息工具的群組回覆會因未呼叫 `message(action=send)` 而保持靜默。
    - 持續啟用的環境群組聊天預設使用使用者請求語意。若要將其作為安靜的內容提交，請設定 `messages.groupChat.unmentionedInbound: "room_event"`。設定範例請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。
    - 聊天室事件不會儲存為虛假的使用者請求，而未使用訊息工具的聊天室事件所產生之私密助理文字，也不會作為聊天記錄重播。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可依伺服器／頻道覆寫）。
    - 群組歷史內容會以一致方式跨頻道包裝。受提及閘控的群組會保留待處理且略過的訊息；若頻道支援，持續啟用的群組也可保留最近已處理的聊天室訊息。使用 `messages.groupChat.historyLimit` 設定全域預設值，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 即可停用。

  </Accordion>
</AccordionGroup>

## 群組／頻道工具限制（選用）

部分頻道設定支援限制**特定群組／聊天室／頻道內**可用的工具。

- `tools`：允許／拒絕整個群組使用工具（`allow`、`alsoAllow`、`deny`；拒絕優先）。
- `toolsBySender`：群組內依傳送者覆寫。使用明確的鍵前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 萬用字元。頻道 ID 使用標準 OpenClaw 頻道 ID；`teams` 等別名會正規化為 `msteams`。仍接受舊版無前綴鍵，但僅以 `id:` 進行比對，並會記錄淘汰警告。

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
群組／頻道工具限制會在全域／代理程式工具政策之外額外套用（拒絕規則仍優先）。部分頻道對聊天室／頻道使用不同的巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，其中的鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍能設定預設的提及行為。

<Warning>
常見混淆：私訊配對核准與群組授權並不相同。對於支援私訊配對的頻道，配對儲存區只會解鎖私訊。群組命令仍須透過設定允許清單（例如 `groupAllowFrom`）或該頻道文件所述的設定後援機制，明確授權群組傳送者。
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

群組擁有者可以使用獨立訊息切換各群組的啟用模式：

- `/activation mention`
- `/activation always`

`/activation` 是受核心擁有者權限管控的命令，且僅適用於群組聊天。擁有者是指傳送者符合 `commands.ownerAllowFrom`；頻道 `allowFrom` 清單只控制一般頻道與命令的存取權。對於會查詢已儲存模式的頻道（Google Chat、QQ Bot、Telegram、WhatsApp），該模式會覆寫該群組的 `requireMention`，而所有位置的群組系統提示詞引言都會反映目前啟用的模式。

## 上下欄位

群組傳入承載資料會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及管控結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 和 `IsForum`。

代理程式系統提示詞會在新群組工作階段的第一輪（以及 `/activation` 變更後）包含群組引言。它會提醒模型像真人一樣回覆、減少空白行並遵循一般聊天間距，以及避免輸入字面上的 `\n` 序列。若頻道宣告的表格模式不保留原生或原始表格，也會不建議使用 Markdown 表格。來自頻道的群組名稱與參與者標籤會以受圍欄保護的不受信任中繼資料呈現，而不是內嵌的系統指示。

## iMessage 特定事項

- 進行路由或加入允許清單時，建議使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律傳回相同的 `chat_id`。

## WhatsApp 系統提示詞

如需 WhatsApp 系統提示詞的標準規則，包括群組與直接提示詞解析、萬用字元行為，以及帳號覆寫語意，請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)。

## WhatsApp 特定事項

如需僅適用於 WhatsApp 的行為（歷史記錄注入、提及處理細節），請參閱[群組訊息](/zh-TW/channels/group-messages)。

## 相關內容

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
