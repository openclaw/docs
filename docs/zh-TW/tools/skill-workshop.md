---
read_when:
    - 你想要代理程式從聊天中建立或更新一項 skill
    - 你需要審查、套用、拒絕或隔離產生的 Skills 草稿
    - 你正在設定 Skill Workshop 核准、自主性、儲存空間或限制
sidebarTitle: Skill Workshop
summary: 透過 Skill Workshop 審查建立並更新工作區 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-05T11:48:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f5c2c11d4a170c98cc91cfb522a4de26e1fe76eba57da3df8072708584ce179
    source_path: tools/skill-workshop.md
    workflow: 16
---

技能工作坊是 OpenClaw 用於建立和更新工作區技能的受管控路徑。代理與操作員絕不會透過此路徑直接寫入 `SKILL.md`，而是建立一個**提案**（包含內容、目標繫結、掃描器狀態、雜湊與復原中繼資料的待處理草稿），只有在套用後才會成為實際啟用的技能。

技能工作坊只會寫入工作區技能。它絕不會觸碰內建、外掛、ClawHub、額外根目錄、受管理、個人代理或系統技能。

## 運作方式

- **先建立提案：** 產生的內容會儲存為 `PROPOSAL.md`，而不是 `SKILL.md`。
- **套用是唯一的實際寫入：** 建立、更新和修訂絕不會變更作用中的技能。
- **限定工作區範圍：** 建立會以工作區 `skills/` 根目錄為目標；更新只允許用於可寫入的工作區技能。
- **不覆寫：** 如果目標技能已存在，建立會失敗。
- **雜湊繫結：** 更新提案會繫結至目前的目標雜湊；如果實際技能在套用前變更，提案會變成 `stale`。
- **掃描器閘控：** 套用前會重新執行安全掃描器。
- **可復原：** 套用會在觸碰實際檔案前寫入復原中繼資料。
- **一致的介面：** 聊天、命令列介面與閘道都會呼叫同一個服務。

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

建立：

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

更新現有工作區技能：

```text
Update trip-planning to also check seat maps before booking.
```

反覆調整待處理提案：

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

由代理啟動的 `apply`、`reject` 和 `quarantine` 預設會顯示核准提示。在受信任環境中，將 `skills.workshop.approvalPolicy` 設為 `"auto"` 即可跳過提示。

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

每個子命令都接受 `--agent <id>`（目標工作區；預設會先從 cwd 推斷，再使用預設代理）和 `--json`（結構化輸出）。`propose-create`、`propose-update` 和 `revise` 也接受 `--goal <text>` 與 `--evidence <text>`，用於在 `--proposal` 旁記錄提案脈絡。

## 提案內容

待處理期間，提案會以 `PROPOSAL.md` 儲存，並包含僅限提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

套用時，技能工作坊會寫入作用中的 `SKILL.md`，並移除僅限提案使用的欄位：`status`、提案 `version` 與提案 `date`。

## 支援檔案

當提議的技能需要 `PROPOSAL.md` 旁的檔案時，請使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

該目錄必須包含 `PROPOSAL.md`。支援檔案必須位於 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 底下。技能工作坊會掃描、雜湊並將它們與提案一起儲存，然後只在套用時將它們寫入實際 `SKILL.md` 旁。

被拒絕的支援檔案路徑：絕對路徑、隱藏路徑片段、路徑穿越、重疊路徑、可執行檔、非 UTF-8 文字、null 位元組，以及標準支援資料夾之外的路徑。

## 代理工具

模型使用 `skill_workshop`，並帶有一個必要的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他參數會依動作而定：

| 參數                       | 使用者                                               | 備註                                                               |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；其他情況會依名稱解析待處理提案                     |
| `description`              | `create`、`update`、`revise`                         | 最多 160 位元組                                                    |
| `skill_name`               | `update`                                             | 現有技能名稱或鍵                                                   |
| `proposal_content`         | `create`、`update`、`revise`                         | 儲存為 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制      |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 陣列                                           |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文字脈絡                                                       |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目標提案                                                           |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 選用                                                               |
| `query`、`status`、`limit` | `list`                                               | 篩選/分頁；`limit` 最大 50，預設 20                                |

代理必須使用 `skill_workshop` 進行產生的技能工作。它們不得透過 `write`、`edit`、`exec`、shell 命令或直接檔案系統操作來建立或變更提案檔案。

<Note>
`skill_workshop` 是內建代理工具，並包含在
`tools.profile: "coding"` 中。如果更嚴格的政策隱藏了它，請將
`skill_workshop` 加入作用中的 `tools.allow` 清單，或在範圍使用沒有明確
`tools.allow` 的 profile 時使用 `tools.alsoAllow: ["skill_workshop"]`。沙盒執行不會建構主機端技能工作坊工具，因此請從一般主機端代理工作階段或命令列介面執行提案審查動作。
</Note>

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
| `autonomous.enabled`       | `false`     | 允許 OpenClaw 在成功的一輪對話後，根據持久對話訊號建立待處理提案。                                                                                                  |
| `allowSymlinkTargetWrites` | `false`     | 允許套用寫入工作區技能 symlink，其實際目標列於 `skills.load.allowSymlinkTargets`。                                                                                   |
| `approvalPolicy`           | `"pending"` | `"pending"` 會要求在代理啟動的 `apply`、`reject` 或 `quarantine` 前顯示核准提示。`"auto"` 會跳過提示（代理仍然必須呼叫該動作）。 |
| `maxPending`               | `50`        | 限制每個工作區的待處理與隔離提案數量（1-200）。                                                                                                                      |
| `maxSkillBytes`            | `40000`     | 限制提案本文大小，以位元組為單位（1024-200000）。                                                                                                                    |

提案描述一律限制為 160 位元組，與 `maxSkillBytes` 無關。

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

`requestRevision` 僅限閘道使用（沒有命令列介面或代理工具等效項）：它會將自由文字修訂指示轉送到擁有代理的聊天工作階段，而不是直接取代 `PROPOSAL.md`，適用於要求代理修訂而非提交字面新內容的 UI。

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
- `PROPOSAL.md`：待處理技能提案。
- `rollback.json`：套用變更實際檔案前寫入的復原中繼資料。

## 限制

| 限制                            | 值                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                            | 160 位元組                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes`（預設 40,000；硬性上限 1 MiB）       |
| 支援檔案                        | 每個提案 64 個                                                       |
| 支援檔案大小                    | 每個 256 KiB，總計 2 MiB                                             |
| 待處理 + 隔離提案               | 每個工作區 `skills.workshop.maxPending`（預設 50）                   |

## 疑難排解

| 問題                                           | 解決方式                                                                                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 將 `description` 縮短至 160 位元組以下。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 縮短提案內文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                         |
| `Target skill changed after proposal creation` | 依據目前的目標修訂提案，或建立新的提案。                                                                                                                                   |
| `Proposal scan failed`                         | 檢查掃描器發現的問題，然後修訂或隔離該提案。                                                                                                                                           |
| `untrusted symlink target`                     | 只有在有意使用共用 Skills 根目錄時，才設定 `skills.load.allowSymlinkTargets` 並啟用 `skills.workshop.allowSymlinkTargetWrites`。                                                                  |
| `Support file paths must be under one of...`   | 將支援檔案移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                |
| 提案未顯示在清單中                 | 檢查所選的 `--agent` 工作區與 `OPENCLAW_STATE_DIR`。                                                                                                                                            |
| Agent 無法呼叫 `skill_workshop`             | 檢查目前的工具政策與執行模式。`coding` 會包含此工具；限制性的 `tools.allow` 政策必須明確列出它，而沙盒化執行必須使用一般主機端 Agent 工作階段或命令列介面。 |

## 相關內容

- [Skills](/zh-TW/tools/skills)：載入順序、優先順序與可見性
- [建立 Skills](/zh-TW/tools/creating-skills)：手寫 `SKILL.md`
  基礎
- [Skills 設定](/zh-TW/tools/skills-config)：完整的 `skills.workshop` 結構描述
- [Skills 命令列介面](/zh-TW/cli/skills)：`openclaw skills` 命令
