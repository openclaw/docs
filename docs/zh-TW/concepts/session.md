---
read_when:
    - 你想了解工作階段的路由與隔離
    - 你想要為多使用者設定設定私訊範圍
    - 你正在偵錯每日或閒置工作階段重設
summary: OpenClaw 如何管理對話工作階段
title: 工作階段管理
x-i18n:
    generated_at: "2026-07-05T11:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ad901508e6c39e34fba7cb944b2d8db72524a0327f2bbc1738b3ed449e34b7d
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 會依據每則傳入訊息的來源，將其路由到一個**工作階段**：
私訊、群組聊天、排程工作等。所有工作階段狀態都由
**閘道**擁有；UI 用戶端會向閘道查詢工作階段資料。

## 訊息如何路由

| 來源            | 行為                 |
| --------------- | -------------------- |
| 直接訊息        | 預設共用工作階段     |
| 群組聊天        | 依群組隔離           |
| 房間/頻道       | 依房間隔離           |
| 排程工作        | 每次執行使用新工作階段 |
| 網路鉤子        | 依鉤子隔離           |

## 私訊隔離

預設情況下，所有私訊會共用一個工作階段以保持連續性，這對
單一使用者設定來說沒有問題。

<Warning>
如果多人可以傳訊息給你的代理程式，請啟用私訊隔離。若未啟用，所有
使用者會共用相同的對話情境，因此 Alice 的私人訊息會
對 Bob 可見。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

`session.dmScope` 選項：

| 值                         | 行為                                      |
| -------------------------- | ----------------------------------------- |
| `main`（預設）             | 所有私訊共用一個工作階段                  |
| `per-peer`                 | 依傳送者隔離，跨頻道適用                  |
| `per-channel-peer`         | 依頻道 + 傳送者隔離（建議）               |
| `per-account-channel-peer` | 依帳號 + 頻道 + 傳送者隔離                |

<Tip>
如果同一個人從多個頻道聯絡你，請使用
`session.identityLinks` 將他們的身分對應到同一個標準對等方 ID，讓
他們共用一個工作階段。
</Tip>

### 停駐已連結頻道

停駐命令會將目前直接聊天工作階段的回覆路由移到另一個
已連結頻道，而不會啟動新的工作階段。請參閱
[頻道停駐](/zh-TW/concepts/channel-docking)以取得範例、設定與
疑難排解。

使用 `openclaw security audit` 驗證你的設定。

## 工作階段生命週期

工作階段會重複使用，直到它們依 `session.reset` 到期：

- **每日重設**（預設 `mode: "daily"`）- 在閘道主機上設定的本地
  小時（`session.reset.atHour`，預設 `4`，0-23）建立新工作階段。每日
  新鮮度是根據目前 `sessionId` 的開始時間，而不是後續
  中繼資料寫入時間。
- **閒置重設**（`mode: "idle"`）- 在 `session.reset.idleMinutes`
  分鐘沒有活動後建立新工作階段。閒置新鮮度是根據最後一次真實的使用者/頻道
  互動，因此心跳偵測、排程與 exec 系統事件不會讓
  工作階段保持存活。
- **手動重設** - 在聊天中輸入 `/new` 或 `/reset`。`/new <model>` 也會
  切換模型。

同時設定每日與閒置重設時，先到期者優先。
心跳偵測、排程、exec 與其他系統事件回合可能會寫入工作階段中繼資料，
但這些寫入不會延長每日或閒置重設的新鮮度。重設
輪換工作階段時，舊工作階段的已排隊系統事件通知會被
丟棄，避免過期的背景更新被前置到新工作階段的第一個提示中。

具有作用中、由提供者擁有的命令列介面工作階段的工作階段，不會被隱含的
每日預設切斷。當這些工作階段應依計時器到期時，請使用 `/reset` 或明確設定
`session.reset`。

依聊天類型或頻道覆寫預設值：

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` 支援 `direct`（舊版別名 `dm`）、`group` 和 `thread`。
舊版頂層 `session.idleMinutes` 仍可作為相容性別名使用，當未設定
`session.reset`/`resetByType` 區塊時，代表閒置模式預設值。

## 狀態存放位置

- **存放區：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **逐字稿：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 會保留分開的生命週期時間戳記：

- `sessionStartedAt`：目前 `sessionId` 開始的時間；每日重設使用此值。
- `lastInteractionAt`：最後一次延長閒置生命週期的使用者/頻道互動。
- `updatedAt`：最後一次存放區資料列變更；對列出與修剪很有用，但不是
  每日/閒置重設新鮮度的權威依據。

沒有 `sessionStartedAt` 的舊資料列，會在可用時從逐字稿 JSONL
工作階段標頭解析。如果舊資料列也缺少 `lastInteractionAt`，
閒置新鮮度會退回到該工作階段開始時間，而不是後續簿記
寫入時間。

## 工作階段維護

OpenClaw 會透過 `session.maintenance` 隨時間限制工作階段儲存量，以下顯示
預設值：

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applies cleanup; "warn" only reports
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

對於生產規模的 `maxEntries` 限制，閘道執行階段寫入會使用一個小型
高水位緩衝區，並分批清理回設定的上限。
工作階段存放區讀取不會在閘道啟動期間修剪或限制項目，因此
啟動與隔離的排程工作階段不需要支付完整存放區清理的成本。
`openclaw sessions cleanup --enforce` 會立即套用上限。

閘道模型執行探測工作階段預設為短生命週期。符合
`agent:*:explicit:model-run-<uuid>` 的資料列會使用固定 `24h` 保留期，但清理是
壓力閘控的：只有在達到工作階段項目維護/上限壓力時，才會移除過期的探測資料列，
且會在較廣泛的過期項目
年齡截止與項目上限之前執行。一般直接、群組、執行緒、排程、鉤子、心跳偵測、
ACP 與子代理程式工作階段不會繼承這個 24h 保留期。

維護會保留持久的外部對話指標，包括群組
工作階段與執行緒範圍聊天工作階段，同時仍允許合成的排程、
鉤子、心跳偵測、ACP 與子代理程式項目隨時間淘汰。

如果你先前使用私訊隔離，後來又將 `session.dmScope` 改回
`main`，請使用
`openclaw sessions cleanup --dry-run --fix-dm-scope` 預覽過期的對等方鍵控私訊資料列。套用相同旗標
會停用這些舊的直接私訊資料列，並將其逐字稿保留為已刪除
封存。

使用 `openclaw sessions cleanup --dry-run` 預覽任何維護執行。

## 檢查工作階段

| 命令                       | 顯示內容                                        |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | 工作階段存放區路徑與近期活動                    |
| `openclaw sessions --json` | 所有工作階段（使用 `--active <minutes>` 篩選） |
| 聊天中的 `/status`         | 情境使用量、模型與切換項                        |
| `/context list`            | 系統提示中的內容                                |

## 延伸閱讀

- [工作階段修剪](/zh-TW/concepts/session-pruning) - 修剪工具結果
- [壓縮](/zh-TW/concepts/compaction) - 摘要長對話
- [工作階段工具](/zh-TW/concepts/session-tool) - 用於跨工作階段工作的代理程式工具
- [工作階段管理深度解析](/zh-TW/reference/session-management-compaction) -
  存放區結構描述、逐字稿、傳送政策、來源中繼資料與進階設定
- [多代理程式](/zh-TW/concepts/multi-agent) - 跨代理程式的路由與工作階段隔離
- [背景任務](/zh-TW/automation/tasks) - 分離式工作如何建立含工作階段參照的任務記錄
- [頻道路由](/zh-TW/channels/channel-routing) - 傳入訊息如何路由到工作階段

## 相關

- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [命令佇列](/zh-TW/concepts/queue)
