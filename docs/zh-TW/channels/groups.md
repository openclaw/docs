---
read_when:
    - 變更群組聊天行為或提及控管
    - 將 mentionPatterns 範圍限定到特定群組對話
sidebarTitle: Groups
summary: 跨介面群組聊天行為（Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo）
title: 群組
x-i18n:
    generated_at: "2026-07-05T11:02:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28df65cd1b9b682ae72ea8697597a6481b85ee2689479237a2d1896483386907
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在支援群組的頻道中套用相同的群組規則，包括 Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 和 Zalo。

對於應保持常駐、除非代理明確傳送可見訊息否則只提供安靜脈絡的聊天室，請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

## 初學者簡介（2 分鐘）

OpenClaw「存在於」你自己的訊息帳號上。沒有獨立的 WhatsApp Bot 使用者：如果**你**在某個群組中，OpenClaw 就可以看見該群組並在其中回應。

預設行為：

- 群組受限制（`groupPolicy: "allowlist"`）；群組傳送者在加入允許清單前會被封鎖。
- 除非你停用某個群組的提及門檻，否則回覆需要提及。
- 最終回覆文字會自動發布到聊天室（`visibleReplies: "automatic"`）。

換句話說：已加入允許清單的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**太長；沒讀**

- **私訊存取權**由 `*.allowFrom` 控制。
- **群組存取權**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及門檻（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息會發生什麼）：

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可見回覆

對於一般群組/頻道請求，OpenClaw 預設使用 `messages.groupChat.visibleReplies: "automatic"`：最終助理文字會作為可見回覆發布到聊天室。

當共享聊天室應讓代理透過呼叫 `message(action=send)` 來決定何時發言時，請使用 `messages.groupChat.visibleReplies: "message_tool"`。這最適合能可靠使用工具的模型（例如 GPT 5.5）。如果模型漏掉工具並回傳實質的最終文字，OpenClaw 會將該文字保持私密，而不是發布到聊天室。

對於無法可靠遵循僅工具傳遞的模型或執行階段，請使用 `"automatic"`：一般文字最終回覆會直接發布到聊天室，而代理仍可針對無法隨最終文字一併傳送的檔案、圖片或其他附件呼叫 `message(action=send)`。

如果訊息工具在作用中的工具政策下無法使用，OpenClaw 會退回自動可見回覆，而不是靜默抑制回應。`openclaw doctor` 會警告這種不相符情況。

對於直接聊天和任何其他來源事件，`messages.visibleReplies: "message_tool"` 會在全域套用相同的僅工具行為；`messages.groupChat.visibleReplies` 仍是群組/頻道聊天室更具體的覆寫。內部 WebChat 直接回合預設使用自動最終回覆傳遞，因此 Pi 和 Codex 會收到相同的可見回覆合約。

僅工具模式取代了舊模式，也就是強制模型在多數潛伏模式回合中回答 `NO_REPLY`。在僅工具模式中，提示不會定義 `NO_REPLY` 合約；不做任何可見動作只代表不呼叫訊息工具。

外掛擁有的對話綁定是例外。一旦外掛綁定討論串並聲明處理傳入回合，外掛回傳的回覆就是可見的綁定回應；它不需要 `message(action=send)`。該回覆是外掛執行階段輸出，不是私密的模型最終文字。

對直接群組請求仍會傳送輸入指示器。啟用後的環境常駐聊天室事件會保持嚴格且安靜，除非代理呼叫訊息工具。

工作階段預設會抑制冗長的工具/進度摘要。除錯時可使用 `/verbose on`（或 `/verbose full`）在目前工作階段顯示它們，並使用 `/verbose off` 回到僅最終回覆行為。詳細狀態按工作階段保存，且在直接聊天、群組、頻道和論壇主題中運作方式相同。

若要將未提及的常駐群組閒聊作為安靜聊天室脈絡提交，而不是作為使用者請求，請使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

預設值是 `unmentionedInbound: "user_request"`。已提及的訊息、命令、中止請求和私訊仍會是使用者請求。

若要要求群組/頻道請求的可見輸出透過訊息工具送出：

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

閘道會在檔案儲存後，不需重新啟動就接收 `messages` 設定變更。只有在設定重新載入已停用時才需要重新啟動（`gateway.reload.mode: "off"`）。

命令回合會繞過 `visibleReplies: "message_tool"` 並一律可見地回覆：原生命令斜線指令（Discord、Telegram，以及其他支援原生命令的介面）和已授權的文字 `/...` 命令都會將回應張貼到來源聊天室。群組中未授權的文字 `/...` 回合會維持只限 message-tool；一般聊天回合則遵循設定的預設值。

## 情境可見性與允許清單

群組安全涉及兩種不同控制：

- **觸發授權**：誰可以觸發代理（`groupPolicy`、`groups`、`groupAllowFrom`、通道專屬允許清單）。
- **情境可見性**：哪些補充情境會注入模型（回覆/引用文字、討論串歷史、轉寄中繼資料）。

OpenClaw 預設會保留收到的情境：允許清單決定誰可以觸發動作，而不是模型會看到哪些引用或歷史片段。若也要篩選補充情境，請設定 `contextVisibility`：

| 模式                | 行為                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（預設）   | 保留收到的補充情境。                                           |
| `"allowlist"`       | 只注入來自允許清單寄件者的歷史/討論串/引用/轉寄情境。     |
| `"allowlist_quote"` | `allowlist`，並額外保留任何寄件者明確引用/回覆的訊息。 |

可依通道（`channels.<channel>.contextVisibility`）、依帳號（`channels.<channel>.accounts.<accountId>.contextVisibility`）或全域（`channels.defaults.contextVisibility`）設定。會擷取補充情境的通道（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）會在建立傳入情境時套用此政策；未知的政策組合會以失敗關閉方式處理並省略情境。

![群組訊息流程](/images/groups-flow.svg)

如果你想要...

| 目標                                         | 要設定的內容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但只在 @提及時回覆 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 只允許特定群組                         | `groups: { "<group-id>": { ... } }`（沒有 `"*"` 鍵）         |
| 只有你可以在群組中觸發               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 在多個通道重用同一組信任寄件者 | `groupAllowFrom: ["accessGroup:operators"]`                |

如需可重用的寄件者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段鍵（房間/通道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會將 `:topic:<threadId>` 加到群組 id，讓每個主題都有自己的工作階段。
- 直接聊天使用主要工作階段（或在已設定 `session.dmScope` 時使用依寄件者區分的工作階段）。
- 心跳偵測會在設定的心跳偵測工作階段中執行（預設：代理主要工作階段）；群組工作階段不會執行自己的心跳偵測。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人 DM + 公開群組（單一代理）

可以，若你的「個人」流量是 **DM**，而「公開」流量是**群組**，這種方式運作良好。

原因：在單一代理模式中，DM 通常會進入**主要**工作階段鍵（`agent:main:main`），而群組一律使用**非主要**工作階段鍵（`agent:main:<channel>:group:<id>`）。如果你使用 `mode: "non-main"` 啟用沙箱，這些群組工作階段會在設定的沙箱後端執行，而主要 DM 工作階段會留在主機上。如果你沒有選擇後端，Docker 是預設後端。

這會提供一個代理「大腦」（共用工作區 + 記憶），但有兩種執行姿態：

- **DM**：完整工具（主機）
- **群組**：沙箱 + 受限工具

<Note>
如果你需要真正分離的工作區/人格（「個人」與「公開」絕不能混用），請使用第二個代理 + 綁定。請參閱[多代理路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="DM 在主機上，群組進入沙箱">
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
    想要「群組只能看到資料夾 X」，而不是「沒有主機存取權」？保留 `workspaceAccess: "none"`，並只將允許清單中的路徑掛載到沙箱中：

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

- 設定鍵與預設值：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- 偵錯工具為何被封鎖：[沙箱與工具政策與提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 綁定掛載詳細資訊：[沙箱化](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- UI 標籤會在可用時使用 `displayName`，格式為 `<channel>:<token>`。
- `#room` 保留給房間/通道；群組聊天使用 `g-<slug>`（小寫、空格 -> `-`、保留 `#@+._-`）。非常長且不透明的 id 會縮短為穩定的 token，而不是將完整路由 id 洩漏到 UI。

## 群組政策

控制每個通道如何處理群組/房間訊息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 數字 Telegram 使用者 ID（設定會解析 @username）
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
| `"open"`      | 群組會略過允許清單；提及閘門仍會套用。                       |
| `"disabled"`  | 完全封鎖所有群組訊息。                                       |
| `"allowlist"` | 只允許符合已設定允許清單的群組/聊天室。                      |

<AccordionGroup>
  <Accordion title="各通道注意事項">
    - `groupPolicy` 與提及閘門分開（後者需要 @提及）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（備援：明確的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可比對傳入的 Signal 群組 ID 或傳送者電話/UUID。
    - DM 配對核准（`*-allowFrom` 儲存項目）只套用於 DM 存取；群組傳送者授權仍明確維持在群組允許清單中。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。使用聊天室 ID（`!room:server`）或別名（`#alias:server`）；聊天室名稱鍵只會在 `channels.matrix.dangerouslyAllowNameMatching: true` 時比對，未解析的項目會在執行階段被忽略。使用 `channels.matrix.groupAllowFrom` 限制傳送者；也支援每個聊天室的 `users` 允許清單。
    - 群組 DM 會另外控制（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：傳送者允許清單只接受數字使用者 ID（`"123456789"`；`telegram:`/`tg:` 前綴會以不分大小寫方式移除）。`@username` 項目不會在執行階段比對，並會記錄警告；設定會將 `@username` 解析為 ID。負數聊天 ID 屬於 `channels.telegram.groups`，而不是傳送者允許清單。
    - 預設為 `groupPolicy: "allowlist"`；如果你的群組允許清單是空的，群組訊息會被封鎖。
    - 執行階段安全性：當提供者區塊完全缺失（沒有 `channels.<provider>`）時，群組政策會以失敗關閉方式落到 `allowlist`，而不是繼承 `channels.defaults.groupPolicy`，且閘道會針對每個帳號記錄一次該備援。

  </Accordion>
</AccordionGroup>

快速心智模型（群組訊息的評估順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群組允許清單">
    群組允許清單（`*.groups`、`*.groupAllowFrom`、通道專屬允許清單）。
  </Step>
  <Step title="提及閘門">
    提及閘門（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及閘門（預設）

群組訊息需要提及，除非逐群組覆寫。預設值位於每個子系統的 `*.groups."*"` 下。

當通道公開回覆中繼資料時，回覆機器人訊息會算作隱含提及；在公開引用中繼資料的通道上，引用機器人訊息也可算作提及。目前內建案例：Discord、Microsoft Teams、QQ Bot、Slack、Telegram、WhatsApp 和 Zalo Personal。

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

已設定的 `mentionPatterns` 是正規表示式備援觸發器。當平台未公開原生機器人提及，或當像 `openclaw:` 這樣的純文字應算作提及時使用。原生平台提及是分開的：當 Discord、Slack、Telegram、Matrix 或其他通道能證明訊息明確提及機器人時，即使已設定的正規表示式模式被拒絕，該原生提及仍會觸發。

預設情況下，已設定的提及模式會套用於通道將提供者與對話事實傳入提及偵測的所有地方。若要避免廣泛模式在每個群組喚醒代理，請使用 `channels.<channel>.mentionPatterns` 依通道限定範圍。

當正規表示式提及模式在某個通道預設應關閉時，使用 `mode: "deny"`，然後用 `allowIn` 選擇特定聊天室啟用：

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

當正規表示式提及模式應廣泛套用時，使用預設的 `mode: "allow"`（或省略 `mode`），然後用 `denyIn` 在吵雜聊天室關閉：

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
| `mode: "allow"` | 除非對話 ID 位於 `denyIn`，否則啟用正規表示式提及模式。這是預設值。                                                   |
| `mode: "deny"`  | 除非對話 ID 位於 `allowIn`，否則停用正規表示式提及模式。                                                              |
| `allowIn`       | 在拒絕模式中啟用正規表示式提及模式的對話 ID。                                                                         |
| `denyIn`        | 停用正規表示式提及模式的對話 ID。如果 `denyIn` 和 `allowIn` 都包含相同 ID，`denyIn` 優先。                             |

目前支援的限定範圍正規表示式政策：

| 通道     | `allowIn` / `denyIn` 中使用的 ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 通道 ID。                                             |
| Matrix   | Matrix 聊天室 ID。                                            |
| Slack    | Slack 通道 ID。                                               |
| Telegram | 群組聊天 ID，或論壇主題的 `chatId:topic:threadId`。           |
| WhatsApp | WhatsApp 對話 ID，例如 `123@g.us`。                           |

當該通道支援多個帳號時，帳號層級通道設定可在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下設定相同政策。帳號政策優先於該帳號的頂層通道政策。

<AccordionGroup>
  <Accordion title="提及閘門注意事項">
    - `mentionPatterns` 是不分大小寫的安全正規表示式模式；無效模式和不安全的巢狀重複形式會被忽略（並發出警告）。
    - 模式優先順序：`agents.list[].groupChat.mentionPatterns`（多個代理共用群組時很有用）會覆寫 `messages.groupChat.mentionPatterns`；兩者都未設定時，模式會從代理身分名稱/表情符號衍生。
    - 只有在可以進行提及偵測時（原生提及或已設定 `mentionPatterns`），才會強制執行提及閘門。
    - 將群組或傳送者列入允許清單不會停用提及閘門；當所有訊息都應觸發時，請將該群組的 `requireMention` 設為 `false`。
    - 自動群組聊天提示上下文會在每一輪攜帶已解析的靜默回覆指示；工作區檔案不應重複 `NO_REPLY` 機制。
    - 允許自動靜默回覆的群組，會將乾淨的空白或僅推理的模型輪次視為靜默，等同於 `NO_REPLY`。直接聊天永遠不會收到 `NO_REPLY` 指引，而僅使用訊息工具的群組回覆會透過不呼叫 `message(action=send)` 保持安靜。
    - 周遭常駐群組閒聊預設使用使用者請求語意。設定 `messages.groupChat.unmentionedInbound: "room_event"` 可改為將其作為安靜上下文提交。請參閱[周遭聊天室事件](/zh-TW/channels/ambient-room-events)取得設定範例。
    - 聊天室事件不會儲存為假的使用者請求，來自無訊息工具聊天室事件的私有助理文字也不會作為聊天記錄重播。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可依伺服器/通道覆寫）。
    - 群組歷史上下文會在各通道中一致包裝。受提及閘門限制的群組會保留待處理的已跳過訊息；當通道支援時，常駐群組也可以保留最近已處理的聊天室訊息。使用 `messages.groupChat.historyLimit` 作為全域預設，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 可停用。

  </Accordion>
</AccordionGroup>

## 群組/通道工具限制（選用）

某些通道設定支援限制**特定群組/聊天室/通道內**可用的工具。

- `tools`：允許/拒絕整個群組的工具（`allow`、`alsoAllow`、`deny`；拒絕優先）。
- `toolsBySender`：群組內依傳送者覆寫。使用明確的鍵前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，以及 `"*"` 萬用字元。通道 ID 使用標準 OpenClaw 通道 ID；像 `teams` 這類別名會正規化為 `msteams`。舊版無前綴鍵仍被接受，只會以 `id:` 比對，並記錄棄用警告。

解析順序（最特定者優先）：

<Steps>
  <Step title="群組 toolsBySender">
    群組/通道 `toolsBySender` 比對。
  </Step>
  <Step title="群組 tools">
    群組/通道 `tools`。
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
群組/通道工具限制會在全域/代理工具政策之外額外套用（拒絕仍優先）。某些通道會針對聊天室/通道使用不同巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

當設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍設定預設提及行為。

<Warning>
常見混淆：DM 配對核准不等同於群組授權。對於支援 DM 配對的頻道，配對儲存區只會解鎖 DM。群組命令仍需要來自設定允許清單的明確群組傳送者授權，例如 `groupAllowFrom`，或該頻道文件記載的設定後援。
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
  <Tab title="允許所有群組但要求提及">
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

## 啟用（僅限擁有者）

群組擁有者可以用獨立訊息切換每個群組的啟用狀態：

- `/activation mention`
- `/activation always`

`/activation` 是核心的擁有者門控命令，且只適用於群組聊天。擁有者表示傳送者符合該頻道的 `allowFrom` / `commands.ownerAllowFrom`（未設定允許清單時，帳號自己的 id 會視為擁有者）。儲存的模式會覆寫會查詢它的頻道（Google Chat、QQ Bot、Telegram、WhatsApp）上該群組的 `requireMention`，且群組系統提示詞前言會在各處反映作用中的模式。

## 情境欄位

群組傳入承載會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及門控結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 和 `IsForum`。

代理系統提示詞會在新群組工作階段的第一輪（以及 `/activation` 變更後）包含群組前言。它會提醒模型像真人一樣回應、盡量減少空白行並遵循一般聊天間距，且避免輸入字面上的 `\n` 序列。非 Telegram 群組也不建議使用 Markdown 表格；Telegram 富文字指引來自 Telegram 頻道提示詞。來自頻道的群組名稱和參與者標籤會呈現為圍欄式不受信任中繼資料，而不是行內系統指令。

## iMessage 特定事項

- 路由或允許清單設定時，偏好使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律回到相同的 `chat_id`。

## WhatsApp 系統提示詞

請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts)，了解標準 WhatsApp 系統提示詞規則，包括群組與直接提示詞解析、萬用字元行為，以及帳號覆寫語意。

## WhatsApp 特定事項

請參閱[群組訊息](/zh-TW/channels/group-messages)，了解 WhatsApp 專屬行為（歷史注入、提及處理細節）。

## 相關

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
