---
read_when:
    - 變更群組聊天行為或提及門檻
    - 將 mentionPatterns 限定於特定群組對話
sidebarTitle: Groups
summary: 跨介面的群組聊天行為 (Discord/iMessage/Matrix/Microsoft Teams/QQ Bot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 群組
x-i18n:
    generated_at: "2026-06-27T18:55:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw 會在各個介面一致地處理群組聊天：Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、Zalo。

對於應該提供安靜脈絡、除非代理明確傳送可見訊息的常駐聊天室，請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

## 初學者簡介（2 分鐘）

OpenClaw「存在」於你自己的訊息帳號中。沒有獨立的 WhatsApp bot 使用者。如果**你**在某個群組中，OpenClaw 就能看到該群組並在其中回覆。

預設行為：

- 群組受到限制（`groupPolicy: "allowlist"`）。
- 除非你明確停用提及閘控，否則回覆需要提及。
- 群組/頻道中的可見回覆預設使用 `message` 工具。

換句話說：允許清單中的傳送者可以透過提及 OpenClaw 來觸發它。

<Note>
**TL;DR**

- **DM 存取權**由 `*.allowFrom` 控制。
- **群組存取權**由 `*.groupPolicy` + 允許清單（`*.groups`、`*.groupAllowFrom`）控制。
- **回覆觸發**由提及閘控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群組訊息會發生什麼事）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可見回覆

對於一般群組/頻道請求，OpenClaw 預設為 `messages.groupChat.visibleReplies: "automatic"`。除非你將該聊天室改為僅限訊息工具輸出，否則最終助理文字會透過舊版可見回覆路徑張貼。

當共享聊天室應該讓代理透過呼叫 `message(action=send)` 來決定何時發言時，請使用 `messages.groupChat.visibleReplies: "message_tool"`。這最適合由最新世代、工具可靠模型（例如 GPT 5.5）支援的群組聊天室。如果模型漏掉該工具並回傳實質的最終文字，OpenClaw 會將該最終文字保持私密，而不是張貼到聊天室。

對於較弱的模型或無法可靠理解僅限工具傳遞的執行環境，請使用 `"automatic"`。在自動模式中，代理的最終助理文字是可見來源回覆路徑，因此無法穩定呼叫 `message(action=send)` 的模型仍可正常回答。

在自動模式中，一般文字最終回覆會直接張貼到聊天室。如果可見回覆需要檔案、圖片或其他附件，代理仍可針對該附件使用 `message(action=send)`，而不是嘗試強制透過最終文字回覆傳送。

如果訊息工具在作用中的工具政策下無法使用，OpenClaw 會退回自動可見回覆，而不是默默抑制回應。`openclaw doctor` 會警告這種不相符狀態。

對於直接聊天和任何其他來源事件，請使用 `messages.visibleReplies: "message_tool"` 將相同的僅限工具可見回覆行為套用到全域。內部 WebChat 直接回合預設使用自動最終回覆傳遞，因此 Pi 和 Codex 會收到相同的可見回覆合約。設定 `messages.visibleReplies: "message_tool"` 可刻意要求可見輸出必須使用 `message(action=send)`。`messages.groupChat.visibleReplies` 仍是群組/頻道聊天室更具體的覆寫。

這取代了過去在多數旁聽模式回合中強制模型回答 `NO_REPLY` 的模式。在僅限工具模式中，提示不會定義 `NO_REPLY` 合約。不做任何可見動作，僅表示未呼叫訊息工具。

外掛擁有的對話繫結是例外。一旦外掛繫結某個執行緒並宣告接管傳入回合，外掛回傳的回覆就是可見繫結回應；它不需要 `message(action=send)`。該回覆是外掛執行環境輸出，而不是私密模型最終文字。

直接群組請求仍會傳送輸入中指示器。啟用時，環境常駐聊天室事件會保持嚴格且安靜，除非代理呼叫訊息工具。

工作階段預設會抑制詳細的工具/進度摘要。偵錯時使用 `/verbose on` 顯示目前工作階段的這些摘要，並使用 `/verbose off` 回到僅最終回覆行為。相同的詳細狀態會套用於直接聊天、群組、頻道和論壇主題。

若要將未提及的常駐群組聊天作為安靜聊天室脈絡提交，而不是使用者請求，請使用[環境聊天室事件](/zh-TW/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

預設值是 `unmentionedInbound: "user_request"`。

已提及訊息、命令、中止請求和 DM 仍會是使用者請求。

若要要求群組/頻道請求的可見輸出必須透過訊息工具：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

檔案儲存後，閘道會熱重新載入 `messages` 設定。只有在部署中停用檔案監看或設定重新載入時才需要重新啟動。

若要要求每個來源聊天的可見輸出都必須透過訊息工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生命令列斜線命令（Discord、Telegram，以及其他支援原生命令的介面）會繞過 `visibleReplies: "message_tool"`，並一律以可見方式回覆，讓頻道原生命令 UI 取得預期的回應。這僅適用於已驗證的原生命令回合；以文字輸入的 `/...` 命令和一般聊天回合仍會遵循已設定的群組預設值。

## 脈絡可見性與允許清單

群組安全涉及兩種不同控制：

- **觸發授權**：誰可以觸發代理（`groupPolicy`、`groups`、`groupAllowFrom`、頻道特定允許清單）。
- **脈絡可見性**：哪些補充脈絡會注入模型（回覆文字、引用、執行緒歷史、轉寄中繼資料）。

預設情況下，OpenClaw 優先維持一般聊天行為，並盡量按接收時的樣子保留脈絡。這表示允許清單主要決定誰可以觸發動作，而不是對每個引用或歷史片段都適用的通用遮蔽邊界。

<AccordionGroup>
  <Accordion title="目前行為依頻道而異">
    - 某些頻道已在特定路徑中對補充脈絡套用以傳送者為基礎的篩選（例如 Slack 執行緒植入、Matrix 回覆/執行緒查詢）。
    - 其他頻道仍會依接收時的樣子傳遞引用/回覆/轉寄脈絡。

  </Accordion>
  <Accordion title="強化方向（規劃中）">
    - `contextVisibility: "all"`（預設）保留目前按接收樣貌處理的行為。
    - `contextVisibility: "allowlist"` 將補充脈絡篩選為允許清單傳送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一個明確引用/回覆例外。

    在此強化模型於各頻道間一致實作之前，請預期不同介面會有差異。

  </Accordion>
</AccordionGroup>

![群組訊息流程](/images/groups-flow.svg)

如果你想要...

| 目標                                         | 要設定的內容                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 允許所有群組，但只在 @mentions 時回覆 | `groups: { "*": { requireMention: true } }`                |
| 停用所有群組回覆                    | `groupPolicy: "disabled"`                                  |
| 僅限特定群組                         | `groups: { "<group-id>": { ... } }`（沒有 `"*"` 鍵）         |
| 只有你可以在群組中觸發               | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 在各頻道重用一組受信任傳送者         | `groupAllowFrom: ["accessGroup:operators"]`                |

可重用的傳送者允許清單，請參閱[存取群組](/zh-TW/channels/access-groups)。

## 工作階段鍵

- 群組工作階段使用 `agent:<agentId>:<channel>:group:<id>` 工作階段鍵（聊天室/頻道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 論壇主題會將 `:topic:<threadId>` 加到群組 id，讓每個主題都有自己的工作階段。
- 直接聊天使用主要工作階段（或在已設定時按傳送者區分）。
- 群組工作階段會略過心跳偵測。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：個人 DM + 公開群組（單一代理）

可以，這在你的「個人」流量是 **DM**、而「公開」流量是**群組**時運作良好。

原因：在單一代理模式中，DM 通常落在**主要**工作階段鍵（`agent:main:main`），而群組一律使用**非主要**工作階段鍵（`agent:main:<channel>:group:<id>`）。如果你以 `mode: "non-main"` 啟用沙盒化，這些群組工作階段會在已設定的沙盒後端中執行，而你的主要 DM 工作階段會留在主機上。如果你沒有選擇後端，Docker 是預設後端。

這會給你一個代理「大腦」（共享工作區 + 記憶），但有兩種執行姿態：

- **DM**：完整工具（主機）
- **群組**：沙盒 + 受限制工具

<Note>
如果你需要真正分離的工作區/人格（「個人」與「公開」絕不能混用），請使用第二個代理 + 繫結。請參閱[多代理路由](/zh-TW/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="DM 在主機上，群組沙盒化">
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
  <Tab title="群組只看到允許清單資料夾">
    想要「群組只能看到資料夾 X」，而不是「沒有主機存取權」？保留 `workspaceAccess: "none"`，並只將允許清單路徑掛載到沙盒中：

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
- 偵錯工具為何被封鎖：[沙盒 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)
- 繫結掛載詳細資料：[沙盒化](/zh-TW/gateway/sandboxing#custom-bind-mounts)

## 顯示標籤

- UI 標籤會在可用時使用 `displayName`，格式為 `<channel>:<token>`。
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

| 政策          | 行為                                                   |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 群組會略過允許清單；提及閘控仍然適用。      |
| `"disabled"`  | 完全封鎖所有群組訊息。                           |
| `"allowlist"` | 只允許符合已設定允許清單的群組/聊天室。 |

<AccordionGroup>
  <Accordion title="各頻道注意事項">
    - `groupPolicy` 與提及閘控不同（後者需要 @提及）。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（後備：明確的 `allowFrom`）。
    - Signal：`groupAllowFrom` 可符合傳入的 Signal 群組 ID 或傳送者電話/UUID。
    - 私訊配對核准（`*-allowFrom` 儲存項目）只適用於私訊存取；群組傳送者授權仍須明確加入群組允許清單。
    - Discord：允許清單使用 `channels.discord.guilds.<id>.channels`。
    - Slack：允許清單使用 `channels.slack.channels`。
    - Matrix：允許清單使用 `channels.matrix.groups`。偏好使用聊天室 ID 或別名；已加入聊天室名稱查找是盡力而為，未解析的名稱會在執行階段被忽略。使用 `channels.matrix.groupAllowFrom` 來限制傳送者；也支援個別聊天室的 `users` 允許清單。
    - 群組私訊會分開控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 允許清單可符合使用者 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或使用者名稱（`"@alice"` 或 `"alice"`）；前綴不區分大小寫。
    - 預設為 `groupPolicy: "allowlist"`；如果你的群組允許清單為空，群組訊息會被封鎖。
    - 執行階段安全性：當提供者區塊完全缺少（沒有 `channels.<provider>`）時，群組政策會後退到故障關閉模式（通常是 `allowlist`），而不是繼承 `channels.defaults.groupPolicy`。

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

群組訊息需要提及，除非針對個別群組覆寫。預設值位於各子系統的 `*.groups."*"` 之下。

回覆機器人訊息在頻道支援回覆中繼資料時，會算作隱含提及。在公開引用中繼資料的頻道上，引用機器人訊息也可算作隱含提及。目前內建案例包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

已設定的 `mentionPatterns` 是正規表示式後備觸發器。當平台未公開原生機器人提及，或你想讓 `openclaw:` 這類純文字算作提及時使用它們。原生平台提及是分開的：當 Discord、Slack、Telegram、Matrix 或其他頻道能證明訊息明確提及機器人時，即使已設定的正規表示式模式遭拒，該原生提及仍會觸發。

預設情況下，已設定的提及模式會套用在該頻道將提供者與對話事實傳入提及偵測的所有地方。若要避免寬鬆模式在每個群組喚醒代理，請使用 `channels.<channel>.mentionPatterns` 依頻道限定範圍。

當正規表示式提及模式應預設關閉某個頻道時，使用 `mode: "deny"`，再用 `allowIn` 讓特定聊天室選擇加入：

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

當正規表示式提及模式應廣泛套用時，使用預設的 `mode: "allow"`（或省略 `mode`），再用 `denyIn` 在嘈雜聊天室中關閉：

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

| 欄位            | 效果                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 除非對話 ID 位於 `denyIn`，否則正規表示式提及模式會啟用。這是預設值。                    |
| `mode: "deny"`  | 除非對話 ID 位於 `allowIn`，否則正規表示式提及模式會停用。                                       |
| `allowIn`       | 在拒絕模式中啟用正規表示式提及模式的對話 ID。                                               |
| `denyIn`        | 停用正規表示式提及模式的對話 ID。如果兩者包含相同 ID，`denyIn` 會優先於 `allowIn`。 |

目前支援的範圍化正規表示式政策：

| 頻道     | `allowIn` / `denyIn` 中使用的 ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 頻道 ID。                                         |
| Matrix   | Matrix 聊天室 ID。                                             |
| Slack    | Slack 頻道 ID。                                           |
| Telegram | 群組聊天 ID，或論壇主題的 `chatId:topic:threadId`。 |
| WhatsApp | WhatsApp 對話 ID，例如 `123@g.us`。                |

當該頻道支援多個帳號時，帳號層級的頻道設定可在 `channels.<channel>.accounts.<accountId>.mentionPatterns` 下設定相同政策。帳號政策優先於該帳號的頂層頻道政策。

<AccordionGroup>
  <Accordion title="提及閘控注意事項">
    - `mentionPatterns` 是不區分大小寫的安全正規表示式模式；無效模式和不安全的巢狀重複形式會被忽略。
    - 提供明確提及的介面仍會通過；已設定的正規表示式模式是後備。
    - `channels.<channel>.mentionPatterns.mode: "deny"` 會預設停用該頻道已設定的提及模式；使用 `allowIn` 讓選定對話重新啟用。
    - `channels.<channel>.mentionPatterns.denyIn` 會針對特定對話 ID 停用已設定的提及模式，而原生平台 @提及仍會通過。
    - 個別代理覆寫：`agents.list[].groupChat.mentionPatterns`（多個代理共用一個群組時很有用）。
    - 提及閘控只會在可進行提及偵測時強制執行（已設定原生提及或 `mentionPatterns`）。
    - 將群組或傳送者加入允許清單不會停用提及閘控；當所有訊息都應觸發時，將該群組的 `requireMention` 設為 `false`。
    - 自動群組聊天提示內容會在每一輪攜帶已解析的靜默回覆指示；工作區檔案不應重複 `NO_REPLY` 機制。
    - 允許自動靜默回覆的群組會將乾淨的空白或僅推理模型回合視為靜默，等同於 `NO_REPLY`。直接聊天永遠不會收到 `NO_REPLY` 指引，而僅使用訊息工具的群組回覆會透過不呼叫 `message(action=send)` 來保持安靜。
    - 環境中的永遠開啟群組閒聊預設使用使用者請求語意。設定 `messages.groupChat.unmentionedInbound: "room_event"`，改為將其作為安靜內容提交。請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)取得設定範例。
    - 聊天室事件不會儲存為假的使用者請求，且來自無訊息工具聊天室事件的私有助理文字不會作為聊天歷史重新播放。
    - Discord 預設值位於 `channels.discord.guilds."*"`（可依伺服器/頻道覆寫）。
    - 群組歷史內容會在各頻道間統一包裝。提及閘控群組會保留待處理的已略過訊息；永遠開啟群組在頻道支援時，也可保留最近已處理的聊天室訊息。使用 `messages.groupChat.historyLimit` 作為全域預設，並使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）進行覆寫。設為 `0` 可停用。

  </Accordion>
</AccordionGroup>

## 群組/頻道工具限制（選用）

某些頻道設定支援限制**特定群組/聊天室/頻道內**可用的工具。

- `tools`：允許/拒絕整個群組的工具。
- `toolsBySender`：群組內依傳送者覆寫。使用明確鍵前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 萬用字元。頻道 ID 使用標準 OpenClaw 頻道 ID；`teams` 等別名會正規化為 `msteams`。舊版無前綴鍵仍會接受，且只會以 `id:` 比對。

解析順序（最具體者優先）：

<Steps>
  <Step title="群組 toolsBySender">
    群組/頻道 `toolsBySender` 符合。
  </Step>
  <Step title="群組 tools">
    群組/頻道 `tools`。
  </Step>
  <Step title="預設 toolsBySender">
    預設（`"*"`）`toolsBySender` 符合。
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
群組/頻道工具限制會在全域/代理工具政策之外額外套用（拒絕仍優先）。某些頻道對聊天室/頻道使用不同巢狀結構（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群組允許清單

當設定 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 時，鍵會作為群組允許清單。使用 `"*"` 可允許所有群組，同時仍設定預設提及行為。

<Warning>
常見混淆：DM 配對核准不等同於群組授權。對於支援 DM 配對的通道，配對儲存區只會解鎖 DM。群組命令仍需要來自設定允許清單的明確群組寄件者授權，例如 `groupAllowFrom`，或該通道已文件化的設定備援。
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

擁有者由 `channels.whatsapp.allowFrom` 決定（未設定時則為 Bot 自身的 E.164）。請以獨立訊息傳送命令。其他介面目前會忽略 `/activation`。

## 情境欄位

群組傳入承載會設定：

- `ChatType=group`
- `GroupSubject`（若已知）
- `GroupMembers`（若已知）
- `WasMentioned`（提及門檻結果）
- Telegram 論壇主題也會包含 `MessageThreadId` 和 `IsForum`。

代理系統提示會在新群組工作階段的第一回合包含群組介紹。它會提醒模型像人類一樣回應、盡量減少空白行並遵循一般聊天間距，以及避免輸入字面上的 `\n` 序列。非 Telegram 群組也不鼓勵使用 Markdown 表格；Telegram 的富文字指引來自 Telegram 通道提示。通道來源的群組名稱和參與者標籤會以 fenced 不受信任中繼資料呈現，而不是內嵌系統指令。

## iMessage 細節

- 路由或允許清單設定時，優先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群組回覆一律送回相同的 `chat_id`。

## WhatsApp 系統提示

請參閱 [WhatsApp](/zh-TW/channels/whatsapp#system-prompts) 以了解標準 WhatsApp 系統提示規則，包括群組與直接提示解析、萬用字元行為，以及帳號覆寫語意。

## WhatsApp 細節

請參閱[群組訊息](/zh-TW/channels/group-messages)以了解僅限 WhatsApp 的行為（歷史注入、提及處理細節）。

## 相關

- [廣播群組](/zh-TW/channels/broadcast-groups)
- [通道路由](/zh-TW/channels/channel-routing)
- [群組訊息](/zh-TW/channels/group-messages)
- [配對](/zh-TW/channels/pairing)
