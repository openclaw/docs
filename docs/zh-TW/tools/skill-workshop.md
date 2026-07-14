---
read_when:
    - 你想要代理程式透過聊天建立或更新 Skill
    - 你需要審查、套用、拒絕或隔離產生的 Skill 草稿
    - 你正在設定 Skill Workshop 的核准、自主性、儲存空間或限制
    - 你想了解自我學習提案會在哪裡進行審查
sidebarTitle: Skill Workshop
summary: 透過 Skill Workshop 審查建立及更新工作區 Skills
title: Skills 工作坊
x-i18n:
    generated_at: "2026-07-14T14:04:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7f9a223104b6335a15c853bffda4a159668db24c397656d2aadbd403eceeaa72
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 建立與更新工作區 Skills 的受控途徑。代理程式與操作人員絕不會透過此途徑直接寫入 `SKILL.md`，而是建立一份**提案**（包含內容、目標繫結、掃描器狀態、雜湊及回復中繼資料的待處理草稿）；只有在套用後，提案才會成為正式啟用的 Skill。

Skill Workshop 僅寫入工作區 Skills。它絕不會觸及內建、外掛、ClawHub、額外根目錄、受管理、個人代理程式或系統 Skills。

## 運作方式

- **提案優先：**產生的內容會儲存為 `PROPOSAL.md`，而不是
  `SKILL.md`。
- **套用是唯一的正式寫入操作：**建立、更新與修訂絕不會變更
  使用中的 Skills。
- **限定於工作區：**建立操作以工作區的 `skills/` 根目錄為目標；只有可寫入的工作區 Skills
  才允許更新。
- **不覆寫：**如果目標 Skill 已存在，建立操作會失敗。
- **雜湊繫結：**更新提案會繫結至目前的目標雜湊；如果正式 Skill 在套用前發生變更，
  提案會變成 `stale`。
- **掃描器把關：**套用會在寫入前重新執行安全性掃描器。
- **可復原：**套用會在變更正式檔案前寫入回復中繼資料。
- **介面一致：**聊天、命令列介面與閘道皆呼叫相同的服務。

## 生命週期

```text
建立／更新 -> 待處理
修訂       -> 待處理
套用       -> 已套用
拒絕       -> 已拒絕
隔離       -> 已隔離
目標變更   -> 已過期
```

只有 `pending` 提案可以修訂、套用、拒絕或隔離。

## 生命週期管理

閘道會在共用狀態資料庫中追蹤 Skills 的彙總使用情況。它每天會檢查一次由 Skill Workshop 建立並套用的 Skills。超過 30 天未使用的 Skills 會變成 `stale`；90 天後則會變成 `archived`，並且不再納入新代理程式的 Skill 快照。已封存 Skill 的檔案在磁碟上維持不變。手動編寫的 Skills 永遠不會受到管理；只有由 Skill Workshop 提案建立的 Skills 才會進入生命週期管理。

釘選的 Skills 會略過生命週期轉換。已過期的 Skill 在再次使用且下一次清理執行後，會回到 `active`。已封存的 Skills 只能透過明確的還原操作恢復：

生命週期轉換與還原會套用至新工作階段；執行中的工作階段會保留目前的 Skill 快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有管理器命令都接受 `--json`。狀態也會回報可重現判定的重疊候選項，但僅作為建議；它絕不會合併 Skills 或呼叫模型。

## 聊天

向代理程式描述你想要的 Skill；它會呼叫 `skill_workshop` 並傳回提案 ID。

### 從近期工作中學習

使用 `/learn`，將目前對話或指定來源轉換成一份遵循標準指引的 Skill 提案：

```text
/learn
/learn docs/runbook.md 和 https://example.com/guide；著重於復原
```

未提供要求時，`/learn` 會要求代理程式從目前對話中提煉可重複使用的工作流程。提供要求時，代理程式會將路徑、URL、貼上的筆記及對話參照視為來源，同時遵守重點、範圍與命名要求。它會使用現有工具收集來源，然後以 `action: "create"` 呼叫 `skill_workshop`。

產生的提案會維持 `pending`；`/learn` 絕不會套用它。請透過一般核准流程或使用 `openclaw skills workshop` 來檢閱並套用提案。

建立：

```text
建立一個名為 morning-catchup 的 Skill，用來執行我每週一的收件匣例行工作。
```

更新現有的工作區 Skill：

```text
更新 trip-planning，讓它在預訂前也檢查座位圖。
```

反覆調整待處理提案：

```text
顯示 morning-catchup 提案。
修訂它，讓它也標示任何標記為緊急的項目。
套用 morning-catchup 提案。
```

由代理程式發起的 `apply`、`reject` 與 `quarantine` 預設會顯示核准提示。在受信任的環境中，將 `skills.workshop.approvalPolicy` 設為 `"auto"` 即可略過提示。

提示會識別提案 ID 與目標 Skill，並顯示提案說明、支援檔案數量及本文大小。核准要求會限制在代理程式工具監看程式逾時前完成。如果提示到期前未收到決定，生命週期操作就不會執行：提案會維持待處理且不變。你可以稍後在 Skill Workshop 使用者介面中決定，或執行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。代理程式不應以迴圈方式重試已到期的生命週期操作。

## 命令列介面

```bash
# 建立
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "每日收件匣追蹤：分類、封存、突顯、起草、規劃" \
  --proposal ./PROPOSAL.md

# 更新現有的工作區 Skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 列出並檢查
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 核准前修訂
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 結案
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "重複"
openclaw skills workshop quarantine <proposal-id> --reason "需要安全性審查"
```

每個子命令都接受 `--agent <id>`（目標工作區；預設先從目前工作目錄推斷，接著使用預設代理程式）與 `--json`（結構化輸出）。`propose-create`、`propose-update` 與 `revise` 也接受 `--goal <text>` 和 `--evidence <text>`，以便將提案脈絡與 `--proposal` 一併記錄。

## 提案內容

提案待處理期間會儲存為 `PROPOSAL.md`，並包含僅限提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "每日收件匣追蹤：分類、封存、突顯、起草、規劃"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

套用時，Skill Workshop 會寫入正式的 `SKILL.md`，並移除僅限提案使用的欄位：`status`、提案 `version` 與提案 `date`。

## 支援檔案

當提議的 Skill 需要在 `PROPOSAL.md` 旁放置檔案時，請使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "週五總結：統計、重點、下週最重要的三件事" \
  --proposal-dir ./weekly-update-proposal
```

該目錄必須包含 `PROPOSAL.md`。支援檔案必須位於 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 之下。Skill Workshop 會掃描檔案、計算雜湊並與提案一同儲存，只有在套用時才會將它們寫入正式 `SKILL.md` 旁。

會遭拒絕的支援檔案路徑包括：絕對路徑、隱藏路徑區段、路徑周遊、重疊路徑、可執行檔、非 UTF-8 文字、空位元組，以及標準支援資料夾以外的路徑。

## 代理程式工具

模型使用 `skill_workshop`，並需要一個必要的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他參數依操作而定：

| 參數                       | 使用操作                                             | 備註                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create` 必填；否則依名稱解析待處理提案 |
| `description`              | `create`, `update`, `revise`                         | 上限 160 位元組                                                       |
| `skill_name`               | `update`                                             | 現有 Skill 名稱或索引鍵                                               |
| `proposal_content`         | `create`, `update`, `revise`                         | 儲存為 `PROPOSAL.md`；上限由 `skills.workshop.maxSkillBytes` 決定   |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` 陣列                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | 自由文字脈絡                                                         |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | 目標提案                                                             |
| `reason`                   | `apply`, `reject`, `quarantine`                      | 選填                                                                 |
| `query`, `status`, `limit` | `list`                                               | 篩選／分頁；`limit` 上限 50，預設 20                          |

代理程式必須使用 `skill_workshop` 處理產生的 Skill 工作。它們不得透過 `write`、`edit`、`exec`、殼層命令或直接檔案系統操作建立或變更提案檔案。

<Note>
`skill_workshop` 是內建代理程式工具，且包含在
`tools.profile: "coding"` 中。如果更嚴格的原則將它隱藏，請將
`skill_workshop` 加入使用中的 `tools.allow` 清單；若範圍使用沒有明確 `tools.allow` 的設定檔，則使用
`tools.alsoAllow: ["skill_workshop"]`。沙箱執行不會建構主機端的
Skill Workshop 工具，因此請從一般的主機端代理程式工作階段或命令列介面執行提案檢閱操作。
</Note>

## 建議的 Skills

OpenClaw 會在互動回合結束時偵測「下次」、「記得要」等持久性指示以及回應式修正，包括失敗的回合。在下一回合，代理程式會提議透過 `skill_workshop` 儲存最近偵測到的工作流程；是否建立提案由使用者決定。這項內建建議本身不會建立或變更 Skill。若要改為直接建立待處理提案，請啟用 `skills.workshop.autonomous.enabled`。在 Control UI 中，Workshop 分頁會在頁首提供相同的 **Self-learning** 切換開關，並在空白提案看板上提供啟用按鈕。

### 掃描過去的工作階段

Control UI 可以檢閱較早的工作，而不必啟用自主自我學習。
開啟 **Plugins → Workshop**，然後選取 **Find skill ideas**。掃描會從最新的合格工作階段開始，檢閱範圍有限且內容充實的工作。它會略過排程、心跳偵測、掛鉤、子代理程式、ACP、外掛擁有及內部審查工作階段，也會略過模型回合少於六次的對話。

檢閱器會使用所選代理程式設定的模型，並接收已遮蔽機密且限制大小的對話記錄組合。它採用與經驗檢閱相同的保守標準：具體的復原模式，或能減少未來至少兩次模型或工具呼叫的穩定程序。例行工作與一次性事實不應產生任何提案。

一次掃描最多可以建立或修訂三份待處理提案。它無法套用、拒絕、隔離提案或編輯正式 Skill。Workshop 會顯示累計涵蓋範圍，例如 **已檢閱 20 個工作階段 · 6 月 18 日至今天 · 找到 2 個構想**。選取 **Scan earlier work**，即可從已保存的最早工作階段游標繼續。用盡可用歷史記錄後，該操作會變成 **Scan new work**。

歷史審查一律手動進行，即使
`skills.workshop.autonomous.enabled` 為 `false`。每次點擊都會啟動一次模型執行，
因此適用供應商的定價與資料處理條款。游標與涵蓋範圍計數
會儲存在共用的 OpenClaw 狀態資料庫中；逐字稿內容不會複製
到掃描狀態中。

啟用自主擷取後，OpenClaw 也可以在成功完成大量工作，且整個代理程式系統
進入閒置狀態後，執行保守審查。該隔離審查最多可以建立或
修訂一項待處理提案。即使 `approvalPolicy` 為 `"auto"`，它也無法更新使用中的 Skill，或套用、拒絕、隔離
提案。

請參閱[自我學習](/tools/self-learning)，瞭解啟用方式、資格條件、隱私權與費用詳情、
提案門檻及疑難排解。

## 核准與自主性

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 設定                    | 預設值     | 效果                                                                                                                                                                 |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 根據明確更正建立待處理提案；在閒置延遲後，也會根據已完成的大量工作建立提案，前提是其中包含可重複使用的復原方式或能顯著節省往返操作。      |
| `allowSymlinkTargetWrites` | `false`     | 允許套用操作透過工作區 Skill 符號連結寫入，前提是其實際目標列於 `skills.load.allowSymlinkTargets`。                                                    |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求代理程式發起 `apply`、`reject` 或 `quarantine` 前顯示核准提示。`"auto"` 會略過提示（代理程式仍須呼叫該動作）。 |
| `maxPending`               | `50`        | 限制每個工作區的待處理與已隔離提案數量（1-200）。                                                                                                          |
| `maxSkillBytes`            | `40000`     | 限制提案本文的位元組大小（1024-200000）。                                                                                                                        |

自主擷取會辨識前瞻性規則（例如「從現在開始」）與回應式
更正（例如「這不是我要求的內容」）。它會依主題將新指示分組，每回合最多建立
三項提案，將詞彙相符項目路由至現有且可寫入的工作區 Skills，並在另一項更正指向相同 Skill 時
修訂自己的待處理提案。

對於未包含明確更正、但已成功完成的大量工作，所選
模型會在隔離執行中判斷已完成的軌跡是否達到保守的提案門檻。
前景模型不會在回覆前收到學習提示。背景審查程式會保留
前景執行作為提案來源依據，且無法存取一般代理程式工具，也無法做出生命週期
決策。只有當前景執行階段回報其確切解析後的模型，並確認 `skill_workshop` 確實可用時，審查才會開始。因此，限制性或未知的工具政策
會採取封閉失敗，不建立任何提案。

請參閱[自我學習](/tools/self-learning)，瞭解完整的自主審查行為與安全
模型。

無論 `maxSkillBytes` 為何，提案描述一律限制為 160 位元組。

## 閘道方法

| 方法                             | 範圍            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` 僅限閘道使用（命令列介面或代理程式工具沒有對應功能）：它會
將自由文字修訂指示轉送至擁有者代理程式的聊天工作階段，
而非直接取代 `PROPOSAL.md`，適用於要求代理程式
進行修訂，而不是提交字面新內容的 UI。

`historyStatus` 與 `historyScan` 是控制 UI 的支援方法。`historyScan`
接受 `direction: "older" | "newer"`；它一律將結果保留為待處理
提案。

## 儲存空間

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

預設狀態目錄：`~/.openclaw`。

- `proposal.json`：標準提案記錄。
- `proposals.json`：快速清單索引，可從提案資料夾重建。
- `PROPOSAL.md`：待處理的 Skill 提案。
- `rollback.json`：套用變更至使用中的檔案前寫入的復原中繼資料。

## 限制

| 限制                           | 值                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                     | 160 位元組                                                            |
| 提案本文                   | `skills.workshop.maxSkillBytes`（預設 40,000；硬性上限 1 MiB） |
| 支援檔案                   | 每項提案 64 個                                                      |
| 支援檔案大小               | 每個 256 KiB，總計 2 MiB                                            |
| 待處理 + 已隔離提案 | 每個工作區 `skills.workshop.maxPending`（預設 50）              |

## 疑難排解

| 問題                                        | 解決方式                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 將 `description` 縮短至 160 位元組以下。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 縮短提案本文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                         |
| `Target skill changed after proposal creation` | 依據目前目標修訂提案，或建立新提案。                                                                                                                                   |
| `Proposal scan failed`                         | 檢查掃描器發現的問題，然後修訂或隔離提案。                                                                                                                                           |
| `untrusted symlink target`                     | 設定 `skills.load.allowSymlinkTargets`，且僅針對刻意共用的 Skill 根目錄啟用 `skills.workshop.allowSymlinkTargetWrites`。                                                                  |
| `Support file paths must be under one of...`   | 將支援檔案移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                |
| 提案未顯示於清單中                 | 檢查所選的 `--agent` 工作區與 `OPENCLAW_STATE_DIR`。                                                                                                                                            |
| 代理程式無法呼叫 `skill_workshop`             | 檢查使用中的工具政策與執行模式。`coding` 包含該工具；限制性的 `tools.allow` 政策必須明確列出它，而沙箱化執行必須使用一般主機端代理程式工作階段或命令列介面。 |

### 工具政策診斷

啟用自主擷取後，`openclaw doctor` 會針對預設代理程式執行
`core/doctor/skill-workshop-tool-policy` 檢查。如果政策
隱藏 `skill_workshop`，警告會指出第一個排除它的設定層，
以及應進行的確切 `allow` 或 `alsoAllow` 變更。較舊的操作手冊可能仍使用
`openclaw plugins inspect skill-workshop`；該命令現在會說明 Skill
Workshop 已內建，並在適用時顯示相同的政策提示。

## 相關內容

- [Skills](/zh-TW/tools/skills)：載入順序、優先順序與可見性
- [自我學習](/tools/self-learning)：保守的執行後 Skill 提案
- [建立 Skills](/zh-TW/tools/creating-skills)：手動編寫 `SKILL.md` 的
  基礎知識
- [Skills 設定](/zh-TW/tools/skills-config)：完整的 `skills.workshop` 結構描述
- [Skills 命令列介面](/zh-TW/cli/skills)：`openclaw skills` 命令
