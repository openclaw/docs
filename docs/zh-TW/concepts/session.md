---
read_when:
    - 你想瞭解工作階段路由與隔離
    - 你想要為多使用者設定配置私訊範圍
    - 您正在偵錯每日或閒置工作階段重設
summary: OpenClaw 如何管理對話工作階段
title: 工作階段管理
x-i18n:
    generated_at: "2026-05-02T02:48:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1bde2ab8f1589ed477df959aecf59c282bb086bfe93159397252021a1d6393b
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 會將對話整理成 **工作階段**。每則訊息都會根據其來源路由到一個工作階段，例如私訊、群組聊天、cron jobs 等。

## 訊息如何路由

| 來源          | 行為                  |
| --------------- | ------------------------- |
| 直接訊息 | 預設共用工作階段 |
| 群組聊天     | 依每個群組隔離        |
| 聊天室/頻道  | 依每個聊天室隔離         |
| Cron jobs       | 每次執行使用新的工作階段     |
| Webhook        | 依每個 hook 隔離         |

## 私訊隔離

預設情況下，所有私訊會共用一個工作階段以維持連續性。這適合
單一使用者設定。

<Warning>
如果有多個人可以傳訊息給你的代理，請啟用私訊隔離。否則所有
使用者都會共用相同的對話上下文，Alice 的私人訊息會對 Bob
可見。
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

- `main`（預設）-- 所有私訊共用一個工作階段。
- `per-peer` -- 依傳送者隔離（跨頻道）。
- `per-channel-peer` -- 依頻道 + 傳送者隔離（建議）。
- `per-account-channel-peer` -- 依帳號 + 頻道 + 傳送者隔離。

<Tip>
如果同一個人從多個頻道聯絡你，請使用
`session.identityLinks` 連結他們的身分，讓他們共用一個工作階段。
</Tip>

### 停駐已連結的頻道

停駐指令可讓使用者將目前直接聊天工作階段的回覆路由移到
另一個已連結的頻道，而不必開始新的工作階段。請參閱
[頻道停駐](/zh-TW/concepts/channel-docking) 以取得範例、設定和
疑難排解。

使用 `openclaw security audit` 驗證你的設定。

## 工作階段生命週期

工作階段會重複使用，直到過期為止：

- **每日重設**（預設）-- 在 Gateway
  主機的本地時間上午 4:00 建立新工作階段。每日新鮮度是根據目前 `sessionId` 開始的時間，而不是
  後續中繼資料寫入的時間。
- **閒置重設**（選用）-- 在一段時間沒有活動後建立新工作階段。設定
  `session.reset.idleMinutes`。閒置新鮮度是根據最後一次真正的
  使用者/頻道互動，因此 heartbeat、cron 和 exec 系統事件不會
  讓工作階段保持存活。
- **手動重設** -- 在聊天中輸入 `/new` 或 `/reset`。`/new <model>` 也會
  切換模型。

當同時設定每日和閒置重設時，先到期者生效。
Heartbeat、cron、exec 和其他系統事件回合可能會寫入工作階段中繼資料，
但這些寫入不會延長每日或閒置重設的新鮮度。當重設
滾動到新工作階段時，舊工作階段佇列中的系統事件通知會被
捨棄，避免過時的背景更新被加到新工作階段第一個提示詞的前面。

具有作用中 provider 擁有的 CLI 工作階段的工作階段，不會被隱含的
每日預設切斷。如果這些工作階段應該依計時器過期，請使用 `/reset` 或明確設定 `session.reset`。

## 狀態儲存位置

所有工作階段狀態都由 **Gateway** 擁有。UI 用戶端會向 Gateway 查詢
工作階段資料。

- **儲存區：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **逐字稿：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 會保留分開的生命週期時間戳記：

- `sessionStartedAt`：目前 `sessionId` 開始的時間；每日重設會使用這個值。
- `lastInteractionAt`：最後一次會延長閒置生命週期的使用者/頻道互動。
- `updatedAt`：最後一次儲存列異動；對列出和修剪很有用，但不是
  每日/閒置重設新鮮度的權威依據。

沒有 `sessionStartedAt` 的舊列會在可用時從逐字稿 JSONL
工作階段標頭解析。如果舊列也缺少 `lastInteractionAt`，
閒置新鮮度會退回到該工作階段開始時間，而不是後續的簿記
寫入。

## 工作階段維護

OpenClaw 會自動隨時間限制工作階段儲存空間。預設情況下，它會以
`warn` 模式執行（報告將會清理的內容）。將 `session.maintenance.mode`
設定為 `"enforce"` 以自動清理：

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

對於生產規模的 `maxEntries` 限制，Gateway runtime 寫入會使用小型高水位緩衝，並分批清理回設定的上限。工作階段儲存區讀取不會在 Gateway 啟動期間修剪或限制項目。這可避免每次啟動或隔離的 cron 工作階段都執行完整儲存區清理。`openclaw sessions cleanup --enforce` 會立即套用上限。

使用 `openclaw sessions cleanup --dry-run` 預覽。

## 檢查工作階段

- `openclaw status` -- 工作階段儲存區路徑和最近活動。
- `openclaw sessions --json` -- 所有工作階段（使用 `--active <minutes>` 篩選）。
- 聊天中的 `/status` -- 上下文用量、模型和切換項。
- `/context list` -- 系統提示詞中的內容。

## 延伸閱讀

- [工作階段修剪](/zh-TW/concepts/session-pruning) -- 修剪工具結果
- [Compaction](/zh-TW/concepts/compaction) -- 摘要長對話
- [工作階段工具](/zh-TW/concepts/session-tool) -- 用於跨工作階段工作的代理工具
- [工作階段管理深入探討](/zh-TW/reference/session-management-compaction) --
  儲存區結構描述、逐字稿、傳送政策、來源中繼資料和進階設定
- [多代理](/zh-TW/concepts/multi-agent) — 跨代理的路由和工作階段隔離
- [背景任務](/zh-TW/automation/tasks) — 分離式工作如何建立帶有工作階段參照的任務記錄
- [頻道路由](/zh-TW/channels/channel-routing) — 傳入訊息如何路由到工作階段

## 相關

- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [指令佇列](/zh-TW/concepts/queue)
