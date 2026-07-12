---
read_when:
    - 你想要代理程式從聊天中建立或更新 Skill
    - 你需要審查、套用、拒絕或隔離產生的 Skill 草稿
    - 你正在設定 Skill Workshop 的核准、自主性、儲存空間或限制
sidebarTitle: Skill Workshop
summary: 透過 Skill Workshop 審查建立及更新工作區 Skills
title: Skill 工作坊
x-i18n:
    generated_at: "2026-07-12T14:54:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用於建立及更新工作區 Skills 的受管控途徑。代理程式與操作者絕不會透過此途徑直接寫入 `SKILL.md`——他們會建立一份**提案**（包含內容、目標繫結、掃描器狀態、雜湊與復原中繼資料的待處理草稿），而該提案僅在套用後才會成為實際生效的 Skill。

Skill Workshop 僅寫入工作區 Skills。它絕不會修改內建、外掛、ClawHub、額外根目錄、受管理、個人代理程式或系統 Skills。

## 運作方式

- **先建立提案：**產生的內容會儲存為 `PROPOSAL.md`，而非
  `SKILL.md`。
- **只有套用會寫入實際生效內容：**建立、更新及修訂絕不會變更
  作用中的 Skills。
- **限定於工作區：**建立操作以工作區的 `skills/` 根目錄為目標；更新
  僅允許用於可寫入的工作區 Skills。
- **不覆寫：**若目標 Skill 已存在，建立操作就會失敗。
- **雜湊繫結：**更新提案會繫結至目前的目標雜湊；若實際生效的 Skill 在套用前發生變更，
  提案就會變成 `stale`。
- **掃描器把關：**套用會在寫入前重新執行安全性掃描器。
- **可復原：**套用會在修改實際生效檔案前寫入復原中繼資料。
- **介面一致：**聊天、命令列介面與閘道都會呼叫相同的服務。

## 生命週期

```text
建立/更新 -> 待處理
修訂      -> 待處理
套用      -> 已套用
拒絕      -> 已拒絕
隔離      -> 已隔離
目標變更  -> 已過期
```

只有 `pending` 提案可以進行修訂、套用、拒絕或隔離。

## 生命週期整理

閘道會在共用狀態資料庫中追蹤 Skills 的彙總使用情況。它每天會檢視由 Skill Workshop 建立並套用的 Skills。超過 30 天未使用的 Skills 會變成 `stale`；90 天後則會變成 `archived`，且不再納入新代理程式的 Skill 快照。封存的 Skill 檔案在磁碟上會保持不變。手動撰寫的 Skills 絕不會受到整理；只有透過 Skill Workshop 提案建立的 Skills 才會進入生命週期整理。

釘選的 Skills 會略過生命週期轉換。過期的 Skill 在使用後，會於下一次清理執行時恢復為 `active`。封存的 Skills 只能透過明確的還原操作恢復：

生命週期轉換與還原會套用至新工作階段；執行中的工作階段會保留其目前的 Skill 快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有整理器命令都接受 `--json`。狀態也會將確定性的重疊候選項目僅以建議方式回報；它絕不會合併 Skills 或呼叫模型。

## 聊天

向代理程式說明你想要的 Skill；它會呼叫 `skill_workshop` 並傳回提案 ID。

### 從近期工作中學習

使用 `/learn` 將目前對話或指定來源轉換成一份依循標準的 Skill 提案：

```text
/learn
/learn docs/runbook.md 和 https://example.com/guide；著重於復原
```

若未提供要求，`/learn` 會請代理程式從目前對話中萃取可重複使用的工作流程。若提供要求，代理程式會將路徑、URL、貼上的筆記及對話參照視為來源，同時遵循重點、範圍與命名要求。它會使用既有工具收集來源，然後以 `action: "create"` 呼叫 `skill_workshop`。

產生的提案會保持為 `pending`；`/learn` 絕不會套用提案。請透過一般核准流程或使用 `openclaw skills workshop` 檢閱並套用。

建立：

```text
建立一個名為 morning-catchup 的 Skill，用來執行我的星期一收件匣例行工作。
```

更新現有的工作區 Skill：

```text
更新 trip-planning，讓它在預訂前也檢查座位圖。
```

反覆調整待處理提案：

```text
顯示 morning-catchup 提案。
修訂它，讓它也標記所有註明為緊急的項目。
套用 morning-catchup 提案。
```

代理程式發起的 `apply`、`reject` 與 `quarantine` 預設會顯示核准提示。在受信任環境中，將 `skills.workshop.approvalPolicy` 設為 `"auto"` 即可略過提示。

提示會指出提案 ID 與目標 Skill，並顯示提案說明、支援檔案數量及本文大小。核准要求會受到時間限制，以確保在代理程式工具監控逾時前完成。若提示到期前未收到決定，生命週期操作就不會執行：提案會保持待處理且不變。之後可在 Skill Workshop UI 中決定，或執行
`openclaw skills workshop apply|reject|quarantine <proposal-id>`。代理程式不應循環重試已到期的生命週期操作。

## 命令列介面

```bash
# 建立
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "每日收件匣整理：分類、封存、呈現、起草、規劃" \
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

每個子命令都接受 `--agent <id>`（目標工作區；預設先從目前工作目錄推斷，再使用預設代理程式）及 `--json`（結構化輸出）。
`propose-create`、`propose-update` 與 `revise` 也接受 `--goal <text>` 和
`--evidence <text>`，以便在 `--proposal` 之外記錄提案情境。

## 提案內容

提案在待處理期間會儲存為 `PROPOSAL.md`，並包含僅供提案使用的
frontmatter：

```markdown
---
name: "morning-catchup"
description: "每日收件匣整理：分類、封存、呈現、起草、規劃"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

套用時，Skill Workshop 會寫入作用中的 `SKILL.md`，並移除僅供提案使用的欄位：`status`、提案 `version` 及提案 `date`。

## 支援檔案

若提議的 Skill 需要在 `PROPOSAL.md` 旁放置檔案，請使用
`--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "星期五總結：統計資料、重點、下週最重要的三件事" \
  --proposal-dir ./weekly-update-proposal
```

該目錄必須包含 `PROPOSAL.md`。支援檔案必須位於
`assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 之下。Skill Workshop 會掃描、計算雜湊並將它們與提案一起儲存，且僅在套用時才會將它們寫入實際生效的 `SKILL.md` 旁。

遭拒絕的支援檔案路徑包括：絕對路徑、隱藏路徑區段、路徑穿越、重疊路徑、可執行檔、非 UTF-8 文字、空字元，以及標準支援資料夾以外的路徑。

## 代理程式工具

模型使用 `skill_workshop`，並必須指定一個 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他參數會依操作而適用：

| 參數                       | 使用操作                                             | 備註                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；其他情況會依名稱解析待處理提案                         |
| `description`              | `create`、`update`、`revise`                         | 最多 160 位元                                                         |
| `skill_name`               | `update`                                             | 現有 Skill 名稱或鍵值                                                 |
| `proposal_content`         | `create`、`update`、`revise`                         | 儲存為 `PROPOSAL.md`；上限由 `skills.workshop.maxSkillBytes` 決定    |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 陣列                                              |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文字情境                                                          |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目標提案                                                              |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 選填                                                                  |
| `query`、`status`、`limit` | `list`                                               | 篩選／分頁；`limit` 最大值為 50，預設為 20                            |

代理程式必須使用 `skill_workshop` 處理產生的 Skill 工作。它們不得透過 `write`、`edit`、`exec`、shell 命令或直接檔案系統操作建立或變更提案檔案。

<Note>
`skill_workshop` 是內建代理程式工具，並包含在
`tools.profile: "coding"` 中。若更嚴格的政策將其隱藏，請將
`skill_workshop` 加入作用中的 `tools.allow` 清單；若範圍使用的設定檔沒有明確的 `tools.allow`，則使用
`tools.alsoAllow: ["skill_workshop"]`。沙箱執行不會建構主機端的
Skill Workshop 工具，因此請從一般主機端代理程式工作階段或命令列介面執行提案檢閱操作。
</Note>

## 建議的 Skills

OpenClaw 會在互動回合結束時（包括失敗的回合）偵測「下次」、「記得要」等持久性指示，以及回應式修正。在下一個回合中，代理程式會提議透過 `skill_workshop` 儲存最近偵測到的工作流程；由使用者決定是否建立提案。這項內建建議本身不會建立或變更 Skill。若要改為直接建立待處理提案，請啟用
`skills.workshop.autonomous.enabled`。

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

| 設定                       | 預設值      | 效果                                                                                                                                                                   |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 直接建立待處理提案，而不是在下一個回合提議最近偵測到的工作流程。                                                                                                       |
| `allowSymlinkTargetWrites` | `false`     | 允許套用操作透過工作區 Skill 符號連結寫入，前提是其實際目標列於 `skills.load.allowSymlinkTargets`。                                                                     |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在代理程式發起 `apply`、`reject` 或 `quarantine` 前顯示核准提示。`"auto"` 會略過提示（代理程式仍須呼叫該操作）。 |
| `maxPending`               | `50`        | 限制每個工作區的待處理及已隔離提案數量（1-200）。                                                                                                                      |
| `maxSkillBytes`            | `40000`     | 限制提案本文大小（位元組）（1024-200000）。                                                                                                                            |

自主擷取會辨識前瞻性規則（例如「從現在開始」）及回應式修正（例如「那不是我要的」）。它會依主題將新指示分組，每回合最多產生三份提案；將詞彙相符的內容路由至現有可寫入的工作區 Skills；若另一項修正以同一個 Skill 為目標，則修訂它自己待處理的提案。

無論 `maxSkillBytes` 為何，提案說明的上限一律為 160 位元。

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

`requestRevision` 僅適用於閘道（命令列介面或代理程式工具沒有對應功能）：它會將自由文字格式的修訂指示轉送至擁有者代理程式的聊天工作階段，而不是直接取代 `PROPOSAL.md`，適用於要求代理程式進行修訂、而非提交實際新內容的 UI。

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
- `proposals.json`：快速列出項目的索引，可從提案資料夾重建。
- `PROPOSAL.md`：待處理的 skill 提案。
- `rollback.json`：套用變更至實際檔案前寫入的復原中繼資料。

## 限制

| 限制                            | 值                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                            | 160 位元組                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes`（預設 40,000；硬性上限 1 MiB）       |
| 支援檔案                        | 每個提案 64 個                                                       |
| 支援檔案大小                    | 每個 256 KiB，合計 2 MiB                                             |
| 待處理與隔離的提案              | 每個工作區 `skills.workshop.maxPending`（預設 50）                   |

## 疑難排解

| 問題                                           | 解決方式                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 將 `description` 縮短至 160 位元組以下。                                                                                                                                                                    |
| `Skill proposal content is too large`          | 縮短提案本文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 依照目前的目標修訂提案，或建立新提案。                                                                                                                                                                      |
| `Proposal scan failed`                         | 檢查掃描器發現的問題，然後修訂或隔離提案。                                                                                                                                                                  |
| `untrusted symlink target`                     | 設定 `skills.load.allowSymlinkTargets`，並且僅針對刻意共用的 skill 根目錄啟用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                   |
| `Support file paths must be under one of...`   | 將支援檔案移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 之下。                                                                                                                      |
| 提案未顯示於清單中                             | 檢查所選的 `--agent` 工作區與 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| 代理程式無法呼叫 `skill_workshop`              | 檢查目前啟用的工具政策與執行模式。`coding` 包含此工具；限制性的 `tools.allow` 政策必須明確列出此工具，而在沙箱中執行時，必須使用一般的主機端代理程式工作階段或命令列介面。                                     |

### 工具政策診斷

啟用自主擷取時，`openclaw doctor` 會針對預設代理程式執行 `core/doctor/skill-workshop-tool-policy` 檢查。如果政策隱藏了 `skill_workshop`，警告會指出第一個排除它的設定層，以及需要進行的確切 `allow` 或 `alsoAllow` 變更。較舊的操作手冊可能仍會使用 `openclaw plugins inspect skill-workshop`；該命令現在會說明 Skill Workshop 是內建功能，並在適用時輸出相同的政策提示。

## 相關資源

- [Skills](/zh-TW/tools/skills)：了解載入順序、優先順序與可見性
- [建立 skill](/zh-TW/tools/creating-skills)：了解手動編寫 `SKILL.md` 的基本知識
- [Skills 設定](/zh-TW/tools/skills-config)：了解完整的 `skills.workshop` 結構描述
- [Skills 命令列介面](/zh-TW/cli/skills)：了解 `openclaw skills` 命令
