---
read_when:
    - 你想了解工作階段路由與隔離
    - 你想要為多使用者設定配置私訊範圍
    - 你正在偵錯每日或閒置工作階段重設
summary: OpenClaw 如何管理對話工作階段
title: 工作階段管理
x-i18n:
    generated_at: "2026-06-27T19:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 會將對話組織成**工作階段**。每則訊息都會根據來源路由到某個工作階段 -- 私訊、群組聊天、排程工作等等。

## 訊息如何路由

| 來源 | 行為 |
| --------------- | ------------------------- |
| 私訊 | 預設共用工作階段 |
| 群組聊天 | 每個群組隔離 |
| 房間/頻道 | 每個房間隔離 |
| 排程工作 | 每次執行使用新的工作階段 |
| 網路鉤子 | 每個鉤子隔離 |

## 私訊隔離

預設情況下，所有私訊會共用同一個工作階段，以維持連續性。這對單一使用者設定來說沒有問題。

<Warning>
如果有多人可以傳訊息給你的代理，請啟用私訊隔離。否則，所有使用者都會共用相同的對話內容 -- Alice 的私人訊息會對 Bob 可見。
</Warning>

**修正方式：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 依頻道 + 傳送者隔離
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
`session.identityLinks` 連結他們的身分，讓他們共用同一個工作階段。
</Tip>

### Dock 已連結頻道

Dock 命令讓使用者可以把目前直接聊天工作階段的回覆路由移到另一個已連結頻道，而不必開始新的工作階段。請參閱
[頻道停駐](/zh-TW/concepts/channel-docking) 取得範例、設定與疑難排解。

使用 `openclaw security audit` 驗證你的設定。

## 工作階段生命週期

工作階段會重複使用直到過期：

- **每日重設**（預設）-- 閘道主機本地時間凌晨 4:00 建立新工作階段。每日新鮮度以目前 `sessionId` 開始的時間為準，而不是後續中繼資料寫入時間。
- **閒置重設**（選用）-- 在一段時間沒有活動後建立新工作階段。設定
  `session.reset.idleMinutes`。閒置新鮮度以最後一次真實的
  使用者/頻道互動為準，因此心跳偵測、排程與 exec 系統事件不會
  讓工作階段保持存活。
- **手動重設** -- 在聊天中輸入 `/new` 或 `/reset`。`/new <model>` 也會
  切換模型。

當同時設定每日與閒置重設時，先到期者生效。心跳偵測、排程、exec 與其他系統事件回合可能會寫入工作階段中繼資料，但這些寫入不會延長每日或閒置重設的新鮮度。重設切換工作階段時，舊工作階段中佇列的系統事件通知會被捨棄，避免過期的背景更新被前置到新工作階段的第一個提示中。

具有作用中、由提供者擁有的命令列介面工作階段的工作階段，不會被隱含的每日預設切斷。當這些工作階段應該依計時器過期時，請使用 `/reset` 或明確設定 `session.reset`。

## 狀態存放位置

所有工作階段狀態都由**閘道**擁有。UI 用戶端會向閘道查詢工作階段資料。

- **儲存區：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **逐字稿：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 會保留分開的生命週期時間戳：

- `sessionStartedAt`：目前 `sessionId` 開始的時間；每日重設會使用此值。
- `lastInteractionAt`：最後一次延長閒置生命週期的使用者/頻道互動。
- `updatedAt`：最後一次儲存列變更；對列出與修剪很有用，但不是每日/閒置重設新鮮度的權威來源。

沒有 `sessionStartedAt` 的舊列，會在可用時從逐字稿 JSONL 工作階段標頭解析。如果舊列也缺少 `lastInteractionAt`，閒置新鮮度會回退到該工作階段開始時間，而不是後續的簿記寫入。

## 工作階段維護

OpenClaw 會隨時間自動限制工作階段儲存量。預設會以 `enforce` 模式執行，並在維護期間套用清理。將
`session.maintenance.mode` 設為 `"warn"`，即可回報哪些項目會被清理，而不變更儲存區/檔案：

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

對於生產規模的 `maxEntries` 限制，閘道執行階段寫入會使用小型高水位緩衝區，並分批清理回設定的上限。工作階段儲存區讀取不會在閘道啟動期間修剪或限制項目。這可避免每次啟動或隔離的排程工作階段都執行完整儲存區清理。`openclaw sessions cleanup --enforce` 會立即套用上限。

閘道模型執行探測工作階段預設為短生命週期。符合
`agent:*:explicit:model-run-<uuid>` 這類嚴格明確鍵的列會使用固定 `24h`
保留期，但清理受壓力門檻控制：只有在達到工作階段項目維護/上限壓力時，才會移除過期探測列。模型執行清理執行時，會先於較廣泛的過期項目年齡截止與項目上限執行。一般直接、群組、討論串、排程、鉤子、心跳偵測、ACP 與子代理工作階段不會繼承這個 24h 保留期。

維護會保留持久的外部對話指標，包括群組工作階段與討論串範圍的聊天工作階段，同時仍允許合成的排程、鉤子、心跳偵測、ACP 與子代理項目老化淘汰。

如果你先前使用過直接訊息隔離，後來又將
`session.dmScope` 改回 `main`，請使用
`openclaw sessions cleanup --dry-run --fix-dm-scope` 預覽過期的依 peer 鍵控的私訊列。套用相同旗標會淘汰那些舊的直接私訊列，並將其逐字稿保留為已刪除封存。

使用 `openclaw sessions cleanup --dry-run` 預覽。

## 檢查工作階段

- `openclaw status` -- 工作階段儲存區路徑與近期活動。
- `openclaw sessions --json` -- 所有工作階段（使用 `--active <minutes>` 篩選）。
- 聊天中的 `/status` -- 內容用量、模型與切換項目。
- `/context list` -- 系統提示中包含的內容。

## 延伸閱讀

- [工作階段修剪](/zh-TW/concepts/session-pruning) -- 修剪工具結果
- [壓縮](/zh-TW/concepts/compaction) -- 摘要長對話
- [工作階段工具](/zh-TW/concepts/session-tool) -- 用於跨工作階段工作的代理工具
- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction) --
  儲存區結構描述、逐字稿、傳送政策、來源中繼資料與進階設定
- [多代理](/zh-TW/concepts/multi-agent) — 跨代理的路由與工作階段隔離
- [背景任務](/zh-TW/automation/tasks) — 分離式工作如何建立含有工作階段參照的任務記錄
- [頻道路由](/zh-TW/channels/channel-routing) — 傳入訊息如何路由到工作階段

## 相關

- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [命令佇列](/zh-TW/concepts/queue)
