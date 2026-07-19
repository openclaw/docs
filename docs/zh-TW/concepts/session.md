---
read_when:
    - 你想瞭解工作階段路由與隔離機制
    - 你想要為多使用者設定配置私訊範圍
    - 你正在偵錯每日或閒置工作階段重設問題
summary: OpenClaw 如何管理對話工作階段
title: 工作階段管理
x-i18n:
    generated_at: "2026-07-19T13:46:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f088fe128201a53b10a1b103c9a7be4dd45162e8bbbb174c2a3c4b9663f1eeb6
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 會根據每則傳入訊息的來源，將其路由至一個**工作階段**：私訊、群組聊天、排程作業等。所有工作階段狀態都由**閘道**擁有；UI 用戶端會向閘道查詢工作階段資料。

若要瞭解個人代理程式的預設模式——所有私訊頻道共用一個持續進行的對話，群組活動與背景工作也會匯入其中——請參閱[主要工作階段](/concepts/main-session)。

## 訊息如何路由

| 來源          | 行為                  |
| --------------- | ------------------------- |
| 私訊 | 預設共用工作階段 |
| 群組聊天     | 每個群組各自隔離        |
| 聊天室／頻道  | 每個聊天室各自隔離         |
| 排程作業       | 每次執行使用全新工作階段     |
| 網路鉤子        | 每個鉤子各自隔離         |

## 私訊隔離

預設情況下，所有私訊會共用一個工作階段以保持對話連續性，這很適合單一使用者設定。

<Warning>
如果有多個人可以傳訊息給你的代理程式，請啟用私訊隔離。否則，所有使用者會共用相同的對話情境，因此 Alice 的私人訊息將會對 Bob 可見。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

`session.dmScope` 選項：

| 值                      | 行為                                                 |
| -------------------------- | -------------------------------------------------------- |
| `main`（預設）           | 所有私訊共用[主要工作階段](/concepts/main-session) |
| `per-peer`                 | 跨頻道依傳送者隔離                       |
| `per-channel-peer`         | 依頻道與傳送者隔離（建議）                |
| `per-account-channel-peer` | 依帳號、頻道與傳送者隔離                    |

<Tip>
如果同一個人透過多個頻道聯絡你，請使用 `session.identityLinks` 將其身分對應至單一標準對等端 ID，讓他們共用一個工作階段。
</Tip>

### 停靠已連結的頻道

停靠命令會將目前私訊工作階段的回覆路由移至另一個已連結的頻道，而不會啟動新的工作階段。如需範例、設定與疑難排解，請參閱[頻道停靠](/zh-TW/concepts/channel-docking)。

使用 `openclaw security audit` 驗證你的設定。

## 跨對話記憶

個別逐字稿控制各對話的本機歷史記錄。對於個人或完全受信任的代理程式，`memorySearch.rememberAcrossConversations: true` 會新增一個選用的擷取步驟，以搜尋該代理程式的其他私人對話；它不會合併這些對話的逐字稿。

私人直接對話與持續存在的明確 UI 對話可以互相提供相關情境。群組和頻道在兩個方向都保持隔離：它們的逐字稿不會作為私人回憶來源，而且這些對話中的回覆也不會收到私人逐字稿情境。目前對話也會被排除，因為其歷史記錄已經載入。

此設定不會變更工作階段鍵、私訊範圍、路由、傳遞或 `tools.sessions.visibility`。`MEMORY.md` 和 `memory/*.md` 中的共用工作區記憶也會維持既有行為。目前的記憶提供者必須支援受保護的私人逐字稿回憶；Lossless Claw 等情境引擎仍保持獨立，並可與其同時執行。如需設定與執行階段詳細資訊，請參閱[主動記憶](/zh-TW/concepts/active-memory#remember-across-conversations)。

## 工作階段生命週期

工作階段會持續重複使用，直到你手動重設，或選擇啟用自動重設原則：

- **不自動重設**（預設 `mode: "none"`）- 工作階段會維持相同的 `sessionId`；隨著對話增長，壓縮會管理作用中的情境。
- **每日重設**（`mode: "daily"`）- 選擇在閘道主機上設定的當地小時（`session.reset.atHour`，預設 `4`，0-23）啟動新工作階段。每日新鮮度以目前 `sessionId` 的開始時間為準，而非後續的中繼資料寫入時間。
- **閒置重設**（`mode: "idle"`）- 選擇在閒置 `session.reset.idleMinutes` 後啟動新工作階段。閒置新鮮度以最後一次真正的使用者／頻道互動為準，因此心跳偵測、排程和 exec 系統事件不會讓工作階段保持作用中。
- **手動重設** - 在聊天中輸入 `/new` 或 `/reset`。`/new <model>` 也會切換模型。

同時設定每日和閒置重設時，會以先到期者為準。心跳偵測、排程、exec 和其他系統事件回合可能會寫入工作階段中繼資料，但這些寫入不會延長每日或閒置重設的新鮮度。重設使工作階段輪替時，舊工作階段中已排入佇列的系統事件通知會被捨棄，避免過時的背景更新被加到新工作階段第一個提示詞的開頭。

具有作用中且由提供者擁有之命令列介面工作階段的工作階段，也遵循相同的不自動重設預設值。若這些工作階段應依計時器到期，請使用 `/reset` 或明確設定 `session.reset`。

先全域啟用自動重設，再依聊天類型或頻道覆寫：

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
當未設定 `session.reset`/`resetByType` 區塊時，舊版頂層 `session.idleMinutes` 仍可作為閒置模式預設值的相容別名。

## 狀態儲存位置

- **執行階段工作階段資料列：** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **封存的逐字稿檔案：** `~/.openclaw/agents/<agentId>/sessions/`
- **舊版資料列遷移來源：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

每個代理程式的 SQLite 資料庫中的工作階段資料列會分別保存下列生命週期時間戳記：

- `sessionStartedAt`：目前 `sessionId` 的開始時間；每日重設會使用此時間。
- `lastInteractionAt`：最後一次延長閒置存續時間的使用者／頻道互動。
- `updatedAt`：最後一次儲存區資料列異動；適合用於列出和修剪，但不是每日／閒置重設新鮮度的權威依據。

從較舊的安裝版本遷移時，閘道啟動與 `openclaw doctor
--fix` 會自動將舊版 `sessions.json` 資料列和使用中的逐字稿 JSONL 歷史記錄匯入 SQLite。缺少 `sessionStartedAt` 的資料列，會在可用時根據舊版逐字稿 JSONL 工作階段標頭加以解析。如果較舊的資料列也缺少 `lastInteractionAt`，閒置新鮮度會回退至該工作階段的開始時間，而非後續的簿記寫入時間。若需要明確的檢查或驗證證據，請使用 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` 和[Doctor 遷移順序](/zh-TW/cli/doctor#session-sqlite-migration)。

## 工作階段維護

OpenClaw 會透過 `session.maintenance` 限制工作階段儲存空間隨時間增長，以下顯示預設值：

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

對於正式環境規模的 `maxEntries` 限制，閘道執行階段寫入會使用小型高水位緩衝區，並分批清理回設定的上限。閘道啟動期間，工作階段儲存區讀取不會修剪或限制項目，因此啟動和隔離的排程工作階段不必承擔完整儲存區清理的成本。`openclaw sessions cleanup --enforce` 會立即套用上限。

閘道模型執行探測工作階段預設為短期存在。符合 `agent:*:explicit:model-run-<uuid>` 的資料列採用固定的 `24h` 保留期，但清理作業受壓力控制：只有在達到工作階段項目維護／上限壓力時，才會移除過時的探測資料列，而且會在較廣泛的過時項目存留時間截止條件和項目上限之前執行。一般的直接、群組、討論串、排程、鉤子、心跳偵測、ACP 和子代理程式工作階段不會繼承此 24h 保留期。

維護作業會保留永久性的外部對話指標，包括群組工作階段和限定於討論串的聊天工作階段，同時仍允許合成的排程、鉤子、心跳偵測、ACP 和子代理程式項目隨時間淘汰。

如果你先前使用私訊隔離，之後又將 `session.dmScope` 恢復為 `main`，請使用 `openclaw sessions cleanup --dry-run --fix-dm-scope` 預覽過時的對等端鍵控私訊資料列。套用相同旗標會停用這些舊的直接私訊資料列，並將其逐字稿保留為已刪除的封存檔案。

使用 `openclaw sessions cleanup --dry-run` 預覽任何維護作業執行結果。

## 檢查工作階段

| 命令                    | 顯示內容                                           |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | 工作階段儲存區路徑和最近活動          |
| `openclaw sessions --json` | 所有工作階段（使用 `--active <minutes>` 篩選） |
| 聊天中的 `/status`          | 情境用量、模型和切換設定               |
| `/context list`            | 系統提示詞中的內容                    |

## 延伸閱讀

- [工作階段搜尋](/zh-TW/concepts/session-search) - 在過往逐字稿中進行全文回憶
- [工作階段修剪](/zh-TW/concepts/session-pruning) - 修整工具結果
- [壓縮](/zh-TW/concepts/compaction) - 摘要長對話
- [工作階段工具](/zh-TW/concepts/session-tool) - 用於跨工作階段作業的代理程式工具
- [工作階段管理深入解析](/zh-TW/reference/session-management-compaction) -
  儲存區結構描述、逐字稿、傳送原則、來源中繼資料和進階設定
- [多代理程式](/zh-TW/concepts/multi-agent) - 代理程式之間的路由與工作階段隔離
- [背景工作](/zh-TW/automation/tasks) - 分離式工作如何建立含工作階段參照的工作記錄
- [頻道路由](/zh-TW/channels/channel-routing) - 傳入訊息如何路由至工作階段

## 相關內容

- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [命令佇列](/zh-TW/concepts/queue)
