---
read_when:
    - 你想瞭解工作階段路由與隔離機制
    - 你想要設定多使用者環境的私訊範圍
    - 你正在偵錯每日或閒置工作階段重設問題
summary: OpenClaw 如何管理對話工作階段
title: 工作階段管理
x-i18n:
    generated_at: "2026-07-12T14:26:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 會根據每則傳入訊息的來源，將其路由至一個**工作階段**：私訊、群組聊天、排程工作等。所有工作階段狀態都由**閘道**擁有；使用者介面用戶端會向閘道查詢工作階段資料。

## 訊息如何路由

| 來源 | 行為 |
| --------------- | ------------------------- |
| 私訊 | 預設共用工作階段 |
| 群組聊天 | 每個群組各自隔離 |
| 房間／頻道 | 每個房間各自隔離 |
| 排程工作 | 每次執行使用全新工作階段 |
| 網路鉤子 | 每個鉤子各自隔離 |

## 私訊隔離

預設所有私訊會共用一個工作階段以維持對話連續性，這適合單一使用者的設定。

<Warning>
如果有多人能傳訊息給你的代理程式，請啟用私訊隔離。若未啟用，所有使用者都會共用相同的對話情境，因此 Alice 的私人訊息將可被 Bob 看見。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // 依頻道 + 傳送者隔離
  },
}
```

`session.dmScope` 選項：

| 值 | 行為 |
| -------------------------- | ----------------------------------------- |
| `main`（預設） | 所有私訊共用一個工作階段 |
| `per-peer` | 跨頻道依傳送者隔離 |
| `per-channel-peer` | 依頻道 + 傳送者隔離（建議） |
| `per-account-channel-peer` | 依帳號 + 頻道 + 傳送者隔離 |

<Tip>
如果同一個人透過多個頻道與你聯絡，請使用 `session.identityLinks` 將其身分對應至單一標準對等端 ID，讓這些身分共用同一個工作階段。
</Tip>

### 停靠已連結的頻道

停靠命令會將目前私聊工作階段的回覆路由移至另一個已連結的頻道，而不會啟動新的工作階段。如需範例、設定及疑難排解，請參閱[頻道停靠](/zh-TW/concepts/channel-docking)。

使用 `openclaw security audit` 驗證你的設定。

## 工作階段生命週期

工作階段會持續重複使用，直到依 `session.reset` 設定到期：

- **每日重設**（預設為 `mode: "daily"`）- 在閘道主機上，於設定的本機時間
  (`session.reset.atHour`，預設為 `4`，範圍 0-23) 建立新工作階段。每日有效期是根據目前的 `sessionId` 何時啟動，而不是後續中繼資料的寫入時間。
- **閒置重設**（`mode: "idle"`）- 閒置達 `session.reset.idleMinutes`
  後建立新工作階段。閒置有效期以最近一次真實的使用者／頻道互動為準，因此心跳偵測、排程及 exec 系統事件不會讓工作階段保持有效。
- **手動重設** - 在聊天中輸入 `/new` 或 `/reset`。`/new <model>` 也會切換模型。

若同時設定每日重設和閒置重設，則以最先到期者為準。心跳偵測、排程、exec 及其他系統事件回合可能會寫入工作階段中繼資料，但這些寫入不會延長每日或閒置重設的有效期。當重設切換工作階段時，舊工作階段佇列中的系統事件通知會被捨棄，避免過時的背景更新被附加到新工作階段第一個提示的開頭。

具有由供應商擁有之作用中命令列介面工作階段的工作階段，不會因隱含的每日預設值而中斷。若這些工作階段應依計時器到期，請使用 `/reset` 或明確設定 `session.reset`。

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
如果未設定 `session.reset`/`resetByType` 區塊，舊版頂層的 `session.idleMinutes`
仍可作為閒置模式預設值的相容性別名使用。

## 狀態儲存位置

- **執行階段工作階段資料列：** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **封存的轉錄檔案：** `~/.openclaw/agents/<agentId>/sessions/`
- **舊版資料列遷移來源：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

每個代理程式的 SQLite 資料庫中的工作階段資料列會分別保留以下生命週期
時間戳記：

- `sessionStartedAt`：目前的 `sessionId` 開始時間；每日重設會使用此時間。
- `lastInteractionAt`：最後一次延長閒置存續期的使用者／頻道互動時間。
- `updatedAt`：儲存區資料列最後一次異動的時間；適合用於列出和修剪，但不是
  判斷每日／閒置重設時效性的權威依據。

從較舊的安裝版本遷移時，閘道啟動和 `openclaw doctor
--fix` 會自動將舊版 `sessions.json` 資料列與仍在使用中的轉錄 JSONL 歷程記錄匯入
SQLite。缺少 `sessionStartedAt` 的資料列會在可用時，根據舊版轉錄 JSONL 的工作階段
標頭判定。如果較舊的資料列也缺少 `lastInteractionAt`，閒置時效性會改用該工作階段
的開始時間，而不是之後的簿記寫入時間。若要取得明確的檢查或驗證證據，請使用
`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` 和[診斷程式遷移
順序](/zh-TW/cli/doctor#session-sqlite-migration)。

## 工作階段維護

OpenClaw 會透過 `session.maintenance` 限制工作階段儲存空間隨時間增長，其預設值
如下：

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" 會套用清理；"warn" 只會回報
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

對於正式環境規模的 `maxEntries` 限制，閘道執行階段寫入會使用小型高水位緩衝區，
並分批清理回設定的上限。工作階段儲存區讀取不會在閘道啟動期間修剪或限制項目，
因此啟動和獨立的排程工作階段無須負擔完整的儲存區清理成本。
`openclaw sessions cleanup --enforce` 會立即套用此上限。

閘道模型執行探查工作階段預設為短期存在。符合
`agent:*:explicit:model-run-<uuid>` 的資料列採用固定的 `24h` 保留期限，但清理作業
受壓力條件限制：只有在達到工作階段項目維護／容量壓力時，才會移除過期的探查資料列，
而且會在較廣泛的過期項目存留時間截止條件與項目數量上限之前執行。一般的直接、群組、
討論串、排程、鉤子、心跳偵測、ACP 與子代理程式工作階段不會繼承此 24 小時保留期限。

維護作業會保留持久的外部對話指標，包括群組工作階段與限定於討論串範圍的聊天工作階段，同時仍允許合成的排程、鉤子、心跳偵測、ACP 與子代理項目隨時間淘汰。

如果你先前使用過私訊隔離，之後又將 `session.dmScope` 改回
`main`，請使用 `openclaw sessions cleanup --dry-run --fix-dm-scope`
預覽以對等方為鍵且已過時的私訊資料列。套用相同旗標會停用這些舊的直接私訊資料列，並將其逐字記錄保留為已刪除的封存資料。

請使用 `openclaw sessions cleanup --dry-run` 預覽任何維護作業。

## 檢查工作階段

| 命令                       | 顯示內容                                        |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | 工作階段儲存路徑與近期活動                      |
| `openclaw sessions --json` | 所有工作階段（使用 `--active <minutes>` 篩選）  |
| 聊天中的 `/status`         | 上下文用量、模型與切換設定                      |
| `/context list`            | 系統提示詞中的內容                              |

## 延伸閱讀

- [工作階段搜尋](/concepts/session-search) - 跨過往對話記錄進行全文回溯
- [工作階段修剪](/zh-TW/concepts/session-pruning) - 修剪工具結果
- [壓縮](/zh-TW/concepts/compaction) - 摘要長篇對話
- [工作階段工具](/zh-TW/concepts/session-tool) - 用於跨工作階段作業的代理工具
- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction) -
  儲存結構描述、對話記錄、傳送政策、來源中繼資料與進階設定
- [多代理](/zh-TW/concepts/multi-agent) - 跨代理的路由與工作階段隔離
- [背景任務](/zh-TW/automation/tasks) - 分離執行的工作如何建立含工作階段參照的任務記錄
- [頻道路由](/zh-TW/channels/channel-routing) - 傳入訊息如何路由至工作階段

## 相關內容

- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [命令佇列](/zh-TW/concepts/queue)
