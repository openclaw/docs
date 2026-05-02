---
read_when:
    - 您想了解工作階段路由與隔離
    - 您想要為多使用者環境設定私訊範圍
    - 你正在偵錯每日或閒置工作階段重設
summary: OpenClaw 如何管理對話工作階段
title: 工作階段管理
x-i18n:
    generated_at: "2026-05-02T20:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 會將對話組織成 **工作階段**。每則訊息都會根據來源路由到某個工作階段，例如 DM、群組聊天、Cron 作業等。

## 訊息如何路由

| 來源          | 行為                  |
| --------------- | ------------------------- |
| 直接訊息 | 預設共用工作階段 |
| 群組聊天     | 每個群組隔離        |
| 房間/頻道  | 每個房間隔離         |
| Cron 作業       | 每次執行使用新的工作階段     |
| Webhook        | 每個 Hook 隔離         |

## DM 隔離

預設情況下，所有 DM 都會共用一個工作階段以保持連續性。這適合
單使用者設定。

<Warning>
如果多個人都能傳訊息給你的代理，請啟用 DM 隔離。否則，所有
使用者都會共用同一個對話脈絡，也就是 Alice 的私人訊息會被
Bob 看到。
</Warning>

**修正方式：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

其他選項：

- `main`（預設）-- 所有 DM 共用一個工作階段。
- `per-peer` -- 依寄件者隔離（跨頻道）。
- `per-channel-peer` -- 依頻道 + 寄件者隔離（建議）。
- `per-account-channel-peer` -- 依帳號 + 頻道 + 寄件者隔離。

<Tip>
如果同一個人從多個頻道聯絡你，請使用
`session.identityLinks` 連結他們的身分，讓他們共用同一個工作階段。
</Tip>

### 停靠已連結的頻道

停靠命令可讓使用者將目前直接聊天工作階段的回覆路由移到
另一個已連結的頻道，而不必開始新的工作階段。請參閱
[頻道停靠](/zh-TW/concepts/channel-docking) 取得範例、設定與
疑難排解。

使用 `openclaw security audit` 驗證你的設定。

## 工作階段生命週期

工作階段會重複使用，直到過期：

- **每日重設**（預設）-- 在 Gateway 主機本地時間凌晨 4:00 建立新的工作階段。每日新鮮度以目前 `sessionId` 開始的時間為準，而不是後續的中繼資料寫入時間。
- **閒置重設**（選用）-- 經過一段非活動時間後建立新的工作階段。設定 `session.reset.idleMinutes`。閒置新鮮度以最後一次真實使用者/頻道互動為準，因此 Heartbeat、Cron 與 exec 系統事件不會讓工作階段保持存活。
- **手動重設** -- 在聊天中輸入 `/new` 或 `/reset`。`/new <model>` 也會切換模型。

當同時設定每日與閒置重設時，先過期者生效。Heartbeat、Cron、exec 與其他系統事件回合可能會寫入工作階段中繼資料，但這些寫入不會延長每日或閒置重設的新鮮度。當重設推進工作階段時，舊工作階段佇列中的系統事件通知會被丟棄，避免過時的背景更新被前置到新工作階段的第一個提示中。

具有有效供應商擁有 CLI 工作階段的工作階段，不會被隱含的每日預設值切斷。當這些工作階段應依計時器過期時，請使用 `/reset` 或明確設定 `session.reset`。

## 狀態儲存位置

所有工作階段狀態都由 **Gateway** 擁有。UI 用戶端會向 Gateway 查詢
工作階段資料。

- **儲存：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **逐字稿：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 會保留獨立的生命週期時間戳記：

- `sessionStartedAt`：目前 `sessionId` 開始的時間；每日重設會使用此值。
- `lastInteractionAt`：最後一次延長閒置生命週期的使用者/頻道互動。
- `updatedAt`：最後一次儲存列變更；有助於列出與修剪，但不是每日/閒置重設新鮮度的權威依據。

缺少 `sessionStartedAt` 的舊列，會在可用時從逐字稿 JSONL 的
工作階段標頭解析。如果舊列也缺少 `lastInteractionAt`，
閒置新鮮度會退回使用該工作階段開始時間，而不是後續的簿記寫入。

## 工作階段維護

OpenClaw 會隨時間自動限制工作階段儲存。預設會以 `warn` 模式執行（回報哪些內容將被清理）。將 `session.maintenance.mode`
設為 `"enforce"` 以啟用自動清理：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

對於正式環境規模的 `maxEntries` 限制，Gateway 執行階段寫入會使用小型高水位緩衝區，並以批次清回設定上限。工作階段儲存讀取在 Gateway 啟動期間不會修剪或限制項目數。這可避免每次啟動或隔離的 Cron 工作階段都執行完整儲存清理。`openclaw sessions cleanup --enforce` 會立即套用上限。

維護會保留持久的外部對話指標，包括群組工作階段與執行緒範圍聊天工作階段，同時仍允許合成的 Cron、Hook、Heartbeat、ACP 與子代理項目逐漸過期。

使用 `openclaw sessions cleanup --dry-run` 預覽。

## 檢查工作階段

- `openclaw status` -- 工作階段儲存路徑與最近活動。
- `openclaw sessions --json` -- 所有工作階段（使用 `--active <minutes>` 篩選）。
- 聊天中的 `/status` -- 脈絡使用量、模型與切換設定。
- `/context list` -- 系統提示中的內容。

## 延伸閱讀

- [工作階段修剪](/zh-TW/concepts/session-pruning) -- 修剪工具結果
- [Compaction](/zh-TW/concepts/compaction) -- 摘要長對話
- [工作階段工具](/zh-TW/concepts/session-tool) -- 供跨工作階段工作的代理工具
- [工作階段管理深入探討](/zh-TW/reference/session-management-compaction) --
  儲存結構描述、逐字稿、傳送政策、來源中繼資料與進階設定
- [多代理](/zh-TW/concepts/multi-agent) — 跨代理的路由與工作階段隔離
- [背景任務](/zh-TW/automation/tasks) — 分離工作如何建立含有工作階段參照的任務記錄
- [頻道路由](/zh-TW/channels/channel-routing) — 傳入訊息如何路由到工作階段

## 相關

- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [命令佇列](/zh-TW/concepts/queue)
