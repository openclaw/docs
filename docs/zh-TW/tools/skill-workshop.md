---
read_when:
    - 你想要代理從聊天建立或更新技能
    - 你需要審閱、套用、拒絕或隔離產生的 skill 草稿
    - 您正在設定 Skill Workshop 的核准、自主性、儲存空間或限制
sidebarTitle: Skill Workshop
summary: 透過 Skill Workshop 審閱建立及更新工作區 Skills
title: Skill 工作坊
x-i18n:
    generated_at: "2026-07-06T10:54:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6effd3b4fdaff4d8c087343cf67012d52663a0a8b0536677ac1de8aefc1dcc39
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用於建立與更新工作區技能的受管路徑。代理與操作員絕不會透過此路徑直接寫入 `SKILL.md`，而是建立一個**提案**（包含內容、目標繫結、掃描器狀態、雜湊與回復中繼資料的待審草稿），只有在套用後才會成為即時技能。

Skill Workshop 只會寫入工作區技能。它絕不會觸碰內建、外掛、ClawHub、額外根目錄、受管理、個人代理或系統技能。

## 運作方式

- **先提案：**產生的內容會儲存為 `PROPOSAL.md`，而不是 `SKILL.md`。
- **套用是唯一的即時寫入：**建立、更新與修訂絕不會變更作用中的技能。
- **限定工作區範圍：**建立目標為工作區 `skills/` 根目錄；只有可寫入的工作區技能允許更新。
- **不覆寫：**如果目標技能已存在，建立會失敗。
- **雜湊繫結：**更新提案會繫結到目前目標雜湊；如果即時技能在套用前變更，提案會變成 `stale`。
- **掃描器把關：**套用會在寫入前重新執行安全掃描器。
- **可復原：**套用會在觸碰即時檔案前寫入回復中繼資料。
- **一致的介面：**聊天、命令列介面與閘道都呼叫同一個服務。

## 生命週期

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

只有 `pending` 提案可以被修訂、套用、拒絕或隔離。

## 聊天

向代理要求你想要的技能；它會呼叫 `skill_workshop` 並回傳提案 ID。

### 從近期工作學習

使用 `/learn` 將目前對話或指定來源轉換成一個依循標準的技能提案：

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

沒有請求時，`/learn` 會要求代理從目前對話中萃取可重用的工作流程。有請求時，代理會將路徑、URL、貼上的筆記與對話參照視為來源，同時遵守焦點、範圍與命名要求。它會使用既有工具收集來源，然後以 `action: "create"` 呼叫 `skill_workshop`。

產生的提案會保持 `pending`；`/learn` 絕不會套用它。請透過一般核准流程或使用 `openclaw skills workshop` 檢閱並套用它。

建立：

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

更新既有工作區技能：

```text
Update trip-planning to also check seat maps before booking.
```

反覆修改待審提案：

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

代理發起的 `apply`、`reject` 與 `quarantine` 預設會顯示核准提示。在受信任環境中，將 `skills.workshop.approvalPolicy` 設為 `"auto"` 可略過提示。

提示會識別提案 ID 與目標技能，並顯示提案描述、支援檔案數量與本文大小。核准請求會受限於必須在代理工具看門狗逾時前完成。如果提示到期前沒有收到決策，生命週期動作不會執行：提案會維持待審且不變。稍後可在 Skill Workshop UI 中決定，或執行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。代理不應以迴圈重試已到期的生命週期動作。

## 命令列介面

```bash
# Create
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Update an existing workspace skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# List and inspect
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revise before approval
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Close out
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

每個子命令都接受 `--agent <id>`（目標工作區；預設由 cwd 推斷，接著使用預設代理）與 `--json`（結構化輸出）。`propose-create`、`propose-update` 與 `revise` 也接受 `--goal <text>` 和 `--evidence <text>`，用來與 `--proposal` 一起記錄提案脈絡。

## 提案內容

待審時，提案會以 `PROPOSAL.md` 儲存，並包含僅供提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

套用時，Skill Workshop 會寫入作用中的 `SKILL.md`，並移除僅供提案使用的欄位：`status`、提案 `version` 與提案 `date`。

## 支援檔案

當提案技能需要 `PROPOSAL.md` 旁邊的檔案時，使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

該目錄必須包含 `PROPOSAL.md`。支援檔案必須位於 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 底下。Skill Workshop 會掃描、雜湊並將它們與提案一起儲存，只有在套用時才會把它們寫到即時 `SKILL.md` 旁邊。

會被拒絕的支援檔案路徑：絕對路徑、隱藏路徑區段、路徑穿越、重疊路徑、可執行檔、非 UTF-8 文字、null 位元組，以及標準支援資料夾之外的路徑。

## 代理工具

模型使用 `skill_workshop`，並帶有一個必要的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他參數依動作而定：

| 參數                       | 使用於                                               | 備註                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；其他情況會依名稱解析待審提案                         |
| `description`              | `create`、`update`、`revise`                         | 最多 160 位元組                                                      |
| `skill_name`               | `update`                                             | 既有技能名稱或鍵                                                     |
| `proposal_content`         | `create`、`update`、`revise`                         | 儲存為 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制        |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 陣列                                             |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文字脈絡                                                         |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目標提案                                                             |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 選用                                                                 |
| `query`、`status`、`limit` | `list`                                               | 篩選/分頁；`limit` 最大 50，預設 20                                  |

代理必須使用 `skill_workshop` 進行產生的技能工作。它們不得透過 `write`、`edit`、`exec`、shell 命令或直接檔案系統操作建立或變更提案檔案。

<Note>
`skill_workshop` 是內建代理工具，並包含於 `tools.profile: "coding"`。如果更嚴格的政策隱藏了它，請將 `skill_workshop` 加入作用中的 `tools.allow` 清單，或在範圍使用沒有明確 `tools.allow` 的設定檔時，使用 `tools.alsoAllow: ["skill_workshop"]`。沙盒執行不會建構主機端 Skill Workshop 工具，因此請從一般主機端代理工作階段或命令列介面執行提案檢閱動作。
</Note>

## 建議技能

OpenClaw 會在互動回合結束時偵測持久指示，例如「下次」、「記得要」以及反應式修正，包括失敗的回合。在下一回合，代理會提議透過 `skill_workshop` 儲存最近偵測到的工作流程；由使用者決定是否建立提案。這個內建建議本身不會建立或變更技能。啟用 `skills.workshop.autonomous.enabled` 可改為直接建立待審提案。

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

| 設定                       | 預設        | 效果                                                                                                                                                                 |
| -------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 直接建立待審提案，而不是在下一回合提議最近偵測到的工作流程。                                                                                                       |
| `allowSymlinkTargetWrites` | `false`     | 允許套用時寫入工作區技能符號連結，其真實目標必須列於 `skills.load.allowSymlinkTargets`。                                                                            |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在代理發起的 `apply`、`reject` 或 `quarantine` 前顯示核准提示。`"auto"` 會略過提示（代理仍必須呼叫該動作）。                                      |
| `maxPending`               | `50`        | 限制每個工作區的待審與隔離提案數量（1-200）。                                                                                                                       |
| `maxSkillBytes`            | `40000`     | 限制提案本文大小，以位元組為單位（1024-200000）。                                                                                                                   |

自主擷取會辨識前瞻性規則（例如「從現在開始」）與反應式修正（例如「那不是我要的」）。它會依主題將新指示分組，每回合最多形成三個提案，將詞彙相符項目導向既有可寫入的工作區技能，並在另一個修正鎖定同一技能時修訂自己的待審提案。

提案描述一律限制為 160 位元組，不受 `maxSkillBytes` 影響。

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

`requestRevision` 僅限閘道使用（沒有命令列介面或代理工具等效項）：它會將自由文字修訂指示轉送到擁有者代理的聊天工作階段，而不是直接取代 `PROPOSAL.md`，適用於要求代理修訂而非提交實際新內容的 UI。

## 儲存

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
- `proposals.json`：快速列表索引，可從提案資料夾重建。
- `PROPOSAL.md`：待處理的 skill 提案。
- `rollback.json`：在套用變更到即時檔案前寫入的復原中繼資料。

## 限制

| 限制                            | 值                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 說明                            | 160 位元組                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes`（預設 40,000；硬性上限 1 MiB）       |
| 支援檔案                        | 每個提案 64 個                                                       |
| 支援檔案大小                    | 每個 256 KiB，總計 2 MiB                                             |
| 待處理 + 已隔離提案             | 每個工作區 `skills.workshop.maxPending`（預設 50）                   |

## 疑難排解

| 問題                                           | 解決方式                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 將 `description` 縮短至 160 位元組或更少。                                                                                                                                                                  |
| `Skill proposal content is too large`          | 縮短提案本文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 依目前目標修訂提案，或建立新提案。                                                                                                                                                                          |
| `Proposal scan failed`                         | 檢查掃描器發現項目，然後修訂或隔離提案。                                                                                                                                                                    |
| `untrusted symlink target`                     | 只有在刻意使用共享 skill 根目錄時，才設定 `skills.load.allowSymlinkTargets` 並啟用 `skills.workshop.allowSymlinkTargetWrites`。                                                                             |
| `Support file paths must be under one of...`   | 將支援檔案移到 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 底下。                                                                                                                     |
| 提案未顯示在列表中                             | 檢查選取的 `--agent` 工作區和 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| Agent 無法呼叫 `skill_workshop`                | 檢查作用中的工具政策和執行模式。`coding` 包含此工具；限制性的 `tools.allow` 政策必須明確列出它，而沙盒化執行必須使用一般的主機端 agent 工作階段或命令列介面。 |

### 工具政策診斷

啟用自主擷取時，`openclaw doctor` 會為預設 agent 執行
`core/doctor/skill-workshop-tool-policy` 檢查。如果政策
隱藏 `skill_workshop`，警告會指出第一個排除它的設定層，以及
要進行的確切 `allow` 或 `alsoAllow` 變更。較舊的執行手冊可能仍使用
`openclaw plugins inspect skill-workshop`；該命令現在會說明 Skill
Workshop 已內建，並在適用時列印相同的政策提示。

## 相關

- [Skills](/zh-TW/tools/skills)：載入順序、優先順序和可見性
- [建立 skills](/zh-TW/tools/creating-skills)：手寫 `SKILL.md`
  基礎
- [Skills 設定](/zh-TW/tools/skills-config)：完整的 `skills.workshop` 結構描述
- [Skills 命令列介面](/zh-TW/cli/skills)：`openclaw skills` 命令
