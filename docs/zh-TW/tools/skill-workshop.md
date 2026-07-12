---
read_when:
    - 你想要代理程式透過聊天建立或更新 Skill
    - 您需要審查、套用、拒絕或隔離產生的 Skill 草稿
    - 你正在設定 Skill Workshop 的核准、自主性、儲存空間或限制
sidebarTitle: Skill Workshop
summary: 透過 Skill Workshop 審查建立及更新工作區 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-11T21:52:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用於建立及更新工作區 Skills 的受治理途徑。代理程式與操作者絕不會透過此途徑直接寫入 `SKILL.md`——他們會建立一份**提案**（包含內容、目標綁定、掃描器狀態、雜湊及回復中繼資料的待處理草稿），只有套用後才會成為正式 Skill。

Skill Workshop 只會寫入工作區 Skills。它絕不會觸及內建、外掛、ClawHub、額外根目錄、受管理、個人代理程式或系統 Skills。

## 運作方式

- **提案優先：**產生的內容會儲存為 `PROPOSAL.md`，而非 `SKILL.md`。
- **套用是唯一的正式寫入方式：**建立、更新及修訂絕不會變更作用中的 Skills。
- **限於工作區範圍：**建立操作以工作區的 `skills/` 根目錄為目標；只有可寫入的工作區 Skills 才允許更新。
- **不覆寫：**如果目標 Skill 已存在，建立操作會失敗。
- **雜湊綁定：**更新提案會綁定目前的目標雜湊；如果正式 Skill 在套用前發生變更，提案會變成 `stale`。
- **掃描器把關：**套用會在寫入前重新執行安全掃描器。
- **可復原：**套用會在觸及正式檔案前寫入回復中繼資料。
- **介面一致：**聊天、命令列介面與閘道都會呼叫相同的服務。

## 生命週期

```text
建立/更新 -> 待處理
修訂      -> 待處理
套用      -> 已套用
拒絕      -> 已拒絕
隔離      -> 已隔離
目標變更  -> 已過時
```

只有 `pending` 提案可以被修訂、套用、拒絕或隔離。

## 生命週期策展

閘道會在共用狀態資料庫中追蹤 Skills 的彙總使用情況。它每天會檢視由 Skill Workshop 建立並套用的 Skills。超過 30 天未使用的 Skills 會變成 `stale`；90 天後則會變成 `archived`，且不會納入新代理程式的 Skill 快照。已封存的 Skill 檔案在磁碟上維持不變。手動編寫的 Skills 絕不會受到策展；只有透過 Skill Workshop 提案建立的 Skills 才會進入生命週期策展。

已釘選的 Skills 會略過生命週期轉換。已過時的 Skill 在使用後，會於下一次掃描執行時恢復為 `active`。已封存的 Skills 只能透過明確的還原操作恢復：

生命週期轉換與還原會套用至新工作階段；執行中的工作階段會保留目前的 Skill 快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有策展器命令都接受 `--json`。狀態也會將可確定重疊的候選項目僅作為建議回報；它絕不會合併 Skills 或呼叫模型。

## 聊天

向代理程式描述你想要的 Skill；它會呼叫 `skill_workshop` 並傳回提案 ID。

### 從近期工作中學習

使用 `/learn`，將目前對話或指定來源轉換成一份遵循標準的 Skill 提案：

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

未提供要求時，`/learn` 會要求代理程式從目前對話中提煉可重複使用的工作流程。提供要求時，代理程式會將路徑、URL、貼上的筆記及對話參照視為來源，同時遵循重點、範圍及命名要求。它會使用現有工具收集來源，然後以 `action: "create"` 呼叫 `skill_workshop`。

產生的提案會保持 `pending`；`/learn` 絕不會套用提案。請透過一般核准流程或使用 `openclaw skills workshop` 檢閱並套用提案。

建立：

```text
建立一個名為 morning-catchup 的 Skill，用來執行我的星期一收件匣例行工作。
```

更新現有的工作區 Skill：

```text
更新 trip-planning，使其在預訂前也檢查座位圖。
```

反覆調整待處理提案：

```text
顯示 morning-catchup 提案。
修訂提案，使其也標示任何被標記為緊急的項目。
套用 morning-catchup 提案。
```

代理程式發起的 `apply`、`reject` 及 `quarantine` 預設會顯示核准提示。在受信任的環境中，將 `skills.workshop.approvalPolicy` 設為 `"auto"` 即可略過提示。

提示會標明提案 ID 與目標 Skill，並顯示提案描述、支援檔案數量及本文大小。核准要求會受限於代理程式工具監控程式逾時前完成。如果提示到期前未收到決定，生命週期動作不會執行：提案會保持待處理且不變。稍後可在 Skill Workshop 使用者介面中決定，或執行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。代理程式不應以迴圈方式重試已到期的生命週期動作。

## 命令列介面

```bash
# 建立
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "每日收件匣整理：分類、封存、列出重點、起草、規劃" \
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
openclaw skills workshop quarantine <proposal-id> --reason "需要安全性檢閱"
```

每個子命令都接受 `--agent <id>`（目標工作區；預設先從目前工作目錄推斷，之後才使用預設代理程式）及 `--json`（結構化輸出）。`propose-create`、`propose-update` 及 `revise` 也接受 `--goal <text>` 與 `--evidence <text>`，以便在 `--proposal` 旁記錄提案情境。

## 提案內容

提案處於待處理狀態時，會以 `PROPOSAL.md` 儲存，並包含僅供提案使用的前置資料：

```markdown
---
name: "morning-catchup"
description: "每日收件匣整理：分類、封存、列出重點、起草、規劃"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

套用時，Skill Workshop 會寫入作用中的 `SKILL.md`，並移除僅供提案使用的欄位：`status`、提案的 `version` 及提案的 `date`。

## 支援檔案

當提議的 Skill 需要在 `PROPOSAL.md` 旁放置檔案時，請使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "星期五總結：統計資料、重點、下週最重要的三件事" \
  --proposal-dir ./weekly-update-proposal
```

該目錄必須包含 `PROPOSAL.md`。支援檔案必須位於 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。Skill Workshop 會掃描、計算雜湊並將這些檔案與提案一起儲存，且只會在套用時將它們寫入正式 `SKILL.md` 旁。

遭拒絕的支援檔案路徑包括：絕對路徑、隱藏路徑區段、路徑穿越、重疊路徑、可執行檔案、非 UTF-8 文字、空位元組，以及標準支援資料夾之外的路徑。

## 代理程式工具

模型會使用 `skill_workshop`，並提供一個必要的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他參數會依動作而定：

| 參數                       | 使用動作                                             | 備註                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；否則用於依名稱解析待處理提案                           |
| `description`              | `create`、`update`、`revise`                         | 上限為 160 位元組                                                    |
| `skill_name`               | `update`                                             | 現有 Skill 名稱或索引鍵                                              |
| `proposal_content`         | `create`、`update`、`revise`                         | 儲存為 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制        |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 陣列                                             |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文字情境                                                         |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目標提案                                                             |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 選填                                                                 |
| `query`、`status`、`limit` | `list`                                               | 篩選／分頁；`limit` 上限為 50，預設為 20                             |

代理程式必須使用 `skill_workshop` 處理產生的 Skill 工作。它們不得透過 `write`、`edit`、`exec`、shell 命令或直接檔案系統操作來建立或變更提案檔案。

<Note>
`skill_workshop` 是內建的代理程式工具，並包含在
`tools.profile: "coding"` 中。如果更嚴格的政策將其隱藏，請將
`skill_workshop` 加入作用中的 `tools.allow` 清單；若該範圍使用的設定檔沒有明確的 `tools.allow`，則可使用
`tools.alsoAllow: ["skill_workshop"]`。沙箱執行不會建構主機端的
Skill Workshop 工具，因此請從一般主機端代理程式工作階段或命令列介面執行提案檢閱動作。
</Note>

## 建議的 Skills

當互動回合結束時，包括失敗的回合，OpenClaw 會偵測「下次」、「記得要」等持久性指示，以及回應式修正。在下一回合中，代理程式會提議透過 `skill_workshop` 儲存最近偵測到的工作流程；由使用者決定是否建立提案。此內建建議本身不會建立或變更 Skill。啟用 `skills.workshop.autonomous.enabled` 可改為直接建立待處理提案。

## 核准與自主執行

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

| 設定                       | 預設值      | 效果                                                                                                                                                                   |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 直接建立待處理提案，而不是在下一回合提議最近偵測到的工作流程。                                                                                                         |
| `allowSymlinkTargetWrites` | `false`     | 允許套用操作透過工作區 Skill 符號連結寫入，但其實際目標必須列於 `skills.load.allowSymlinkTargets`。                                                                     |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求代理程式發起 `apply`、`reject` 或 `quarantine` 前顯示核准提示。`"auto"` 會略過提示（代理程式仍須呼叫該動作）。                                           |
| `maxPending`               | `50`        | 限制每個工作區待處理及已隔離提案的數量（1-200）。                                                                                                                      |
| `maxSkillBytes`            | `40000`     | 限制提案本文的位元組大小（1024-200000）。                                                                                                                              |

自主擷取可辨識前瞻性規則（例如「從現在開始」）與回應式修正（例如「那不是我要求的內容」）。它會依主題將新指示分組，每回合最多建立三份提案；將詞彙相符項目導向現有可寫入的工作區 Skills；若另一項修正指向相同 Skill，則修訂由它自行建立的待處理提案。

無論 `maxSkillBytes` 為何，提案描述的上限一律為 160 位元組。

## 閘道方法

| 方法                               | 範圍             |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
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

`requestRevision` 僅限閘道使用（命令列介面或代理工具沒有對應功能）：它會將自由文字形式的修訂指示轉送至所屬代理的聊天工作階段，而不是直接取代 `PROPOSAL.md`，適用於要求代理進行修訂、而非提交全新逐字內容的使用者介面。

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
- `proposals.json`：快速列出用的索引，可從提案資料夾重建。
- `PROPOSAL.md`：待處理的 Skills 提案。
- `rollback.json`：套用變更至實際檔案前寫入的復原中繼資料。

## 限制

| 限制                       | 值                                                                   |
| -------------------------- | -------------------------------------------------------------------- |
| 說明                       | 160 位元組                                                           |
| 提案內文                   | `skills.workshop.maxSkillBytes`（預設 40,000；硬性上限 1 MiB）       |
| 支援檔案                   | 每份提案 64 個                                                       |
| 支援檔案大小               | 每個 256 KiB，總計 2 MiB                                             |
| 待處理與隔離的提案         | 每個工作區為 `skills.workshop.maxPending`（預設 50）                 |

## 疑難排解

| 問題                                           | 解決方式                                                                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 將 `description` 縮短至 160 位元組以內。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 縮短提案內文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                   |
| `Target skill changed after proposal creation` | 依據目前的目標修訂提案，或建立新提案。                                                                                                                                                                   |
| `Proposal scan failed`                         | 檢查掃描器的發現結果，然後修訂或隔離提案。                                                                                                                                                               |
| `untrusted symlink target`                     | 僅針對有意共用的 Skills 根目錄設定 `skills.load.allowSymlinkTargets`，並啟用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                  |
| `Support file paths must be under one of...`   | 將支援檔案移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                     |
| 提案未顯示於清單中                             | 檢查所選的 `--agent` 工作區和 `OPENCLAW_STATE_DIR`。                                                                                                                                                     |
| 代理無法呼叫 `skill_workshop`                  | 檢查目前的工具政策和執行模式。`coding` 包含此工具；限制性的 `tools.allow` 政策必須明確列出它，而沙箱化執行必須使用一般的主機端代理工作階段或命令列介面。                                                    |

### 工具政策診斷

啟用自主擷取時，`openclaw doctor` 會針對預設代理執行 `core/doctor/skill-workshop-tool-policy` 檢查。若政策隱藏了 `skill_workshop`，警告會指出第一個排除它的設定層，以及應進行的確切 `allow` 或 `alsoAllow` 變更。較舊的操作手冊可能仍使用 `openclaw plugins inspect skill-workshop`；該命令現在會說明 Skill Workshop 是內建功能，並在適用時顯示相同的政策提示。

## 相關內容

- [Skills](/zh-TW/tools/skills)：載入順序、優先順序與可見性
- [建立 Skills](/zh-TW/tools/creating-skills)：手動撰寫 `SKILL.md` 的基礎知識
- [Skills 設定](/zh-TW/tools/skills-config)：完整的 `skills.workshop` 結構描述
- [Skills 命令列介面](/zh-TW/cli/skills)：`openclaw skills` 命令
