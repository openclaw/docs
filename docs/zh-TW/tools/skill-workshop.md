---
read_when:
    - 你想要代理從聊天中建立或更新技能
    - 你需要審查、套用、拒絕或隔離產生的 skill 草稿
    - 你正在設定 Skill Workshop 的核准、自主權、儲存空間或限制
sidebarTitle: Skill Workshop
summary: 透過 Skill Workshop 審查建立和更新工作區 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-06-27T20:09:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

技能工作坊是 OpenClaw 用於建立和更新工作區技能的受治理路徑。

代理和操作者不會透過此路徑直接寫入作用中的 `SKILL.md` 檔案。他們會先建立一個**提案**。提案是一份待處理草稿，包含擬議的技能內容、目標繫結、掃描器狀態、雜湊、支援檔案中繼資料，以及復原中繼資料。只有在套用後，它才會成為即時技能。

技能工作坊只會寫入工作區技能。它不會變更 bundled、外掛、ClawHub、extra-root、managed、personal-agent 或 system 技能。

## 運作方式

- **先提案：** 產生的技能內容會儲存為 `PROPOSAL.md`，而不是
  `SKILL.md`。
- **套用是唯一的即時寫入：** create、update 和 revise 不會變更
  作用中技能。
- **工作區範圍：** 建立目標是工作區 `skills/` 根目錄。更新僅允許用於可寫入的工作區技能。
- **不覆寫：** 如果目標技能已存在，create 會失敗。
- **雜湊繫結：** update 提案會繫結到目前的目標雜湊；如果即時技能在套用前變更，提案會變成過期。
- **掃描器把關：** apply 會在寫入前重新執行掃描。
- **可復原：** apply 會在變更即時檔案前寫入復原中繼資料。
- **一致的介面：** chat、命令列介面 和 閘道 都會呼叫同一個技能工作坊服務。

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

## Chat

向代理描述你想要的技能。代理會呼叫 `skill_workshop` 並回傳提案 ID。

建立：

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

更新現有的工作區技能：

```text
Update trip-planning to also check seat maps before booking.
```

迭代待處理提案：

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

預設情況下，由代理發起的 `apply`、`reject` 和 `quarantine` 會在執行前顯示核准提示。將 `skills.workshop.approvalPolicy` 設為 `"auto"`，可在受信任環境中略過提示。

## 命令列介面

建立新的技能提案：

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

為現有工作區技能建立更新提案：

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

列出並檢查：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

在核准前修訂：

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

結束提案流程：

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## 提案內容

待處理時，提案會以 `PROPOSAL.md` 儲存，並帶有僅供提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

套用時，技能工作坊會寫入作用中的 `SKILL.md`，並移除僅供提案使用的欄位：`status`、提案 `version` 和提案 `date`。

## 支援檔案

當擬議技能需要 `PROPOSAL.md` 旁的檔案時，請使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

該目錄必須包含 `PROPOSAL.md`。支援檔案必須位於：

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

技能工作坊會掃描、雜湊並將支援檔案與提案一起儲存。只有在套用時，這些檔案才會寫入即時 `SKILL.md` 旁邊。

被拒絕的支援檔案路徑包括絕對路徑、隱藏路徑片段、路徑遍歷、重疊路徑、來自提案目錄的可執行檔、非 UTF-8 文字、null 位元組，以及標準支援資料夾以外的檔案。

## 代理工具

模型使用 `skill_workshop`：

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

代理必須使用 `skill_workshop` 進行產生的技能工作。它們不得透過 `write`、`edit`、`exec`、shell 命令或直接檔案系統操作來建立或變更提案檔案。

<Note>
`skill_workshop` 是內建代理工具，並包含在
`tools.profile: "coding"` 中。如果較嚴格的政策隱藏了它，請將
`skill_workshop` 加入作用中的 `tools.allow` 清單，或在範圍使用沒有明確
`tools.allow` 的設定檔時使用
`tools.alsoAllow: ["skill_workshop"]`。沙盒執行不會建構主機端的技能工作坊工具，因此請從一般主機端代理工作階段或命令列介面執行提案審查動作。
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

- `autonomous.enabled`：允許 OpenClaw 在成功的回合後，根據持久對話訊號建立待處理提案。預設值：`false`。
- `allowSymlinkTargetWrites`：允許 apply 透過工作區技能符號連結寫入，而該符號連結的真實目標列於 `skills.load.allowSymlinkTargets`。預設值：`false`。
- `approvalPolicy: "pending"`：要求在代理發起的 `apply`、`reject` 或 `quarantine` 前顯示核准提示。
- `approvalPolicy: "auto"`：略過該核准提示。代理仍必須呼叫該動作。
- `maxPending`：限制每個工作區中的待處理和已隔離提案數量。
- `maxSkillBytes`：限制提案本文大小。預設值：`40000`。

提案描述一律限制為 160 位元組。

## 閘道方法

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

唯讀方法需要 `operator.read`。變更方法需要
`operator.admin`。

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
- `proposals.json`：快速列出索引，可從提案資料夾重建。
- `PROPOSAL.md`：待處理技能提案。
- `rollback.json`：在 apply 變更即時檔案前寫入的復原中繼資料。

## 限制

- 描述：160 位元組。
- 提案本文：`skills.workshop.maxSkillBytes`（預設 40,000）。
- 支援檔案：每個提案 64 個。
- 支援檔案大小：每個 256 KB，總計 2 MB。
- 待處理和已隔離提案：每個工作區 `skills.workshop.maxPending`（預設 50）。

## 疑難排解

| 問題                                           | 解決方式                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 將 `description` 縮短至 160 位元組或更少。                                                                                                                                                                  |
| `Skill proposal content is too large`          | 縮短提案本文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 針對目前目標修訂提案，或建立新提案。                                                                                                                                                                        |
| `Proposal scan failed`                         | 檢查掃描器發現項目，然後修訂或隔離提案。                                                                                                                                                                    |
| `untrusted symlink target`                     | 僅針對刻意共用的技能根目錄設定 `skills.load.allowSymlinkTargets` 並啟用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                       |
| `Support file paths must be under one of...`   | 將支援檔案移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                       |
| 提案未顯示在清單中                             | 檢查選取的 `--agent` 工作區和 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| 代理無法呼叫 `skill_workshop`                  | 檢查作用中的工具政策與執行模式。`coding` 包含此工具；限制性的 `tools.allow` 政策必須明確列出它，而沙盒執行必須使用一般主機端代理工作階段或命令列介面。                                                       |

## 相關

- [Skills](/zh-TW/tools/skills)：載入順序、優先順序與可見性
- [建立技能](/zh-TW/tools/creating-skills)：手寫 `SKILL.md` 基礎
- [Skills 設定](/zh-TW/tools/skills-config)：完整 `skills.workshop` 結構描述
- [Skills 命令列介面](/zh-TW/cli/skills)：`openclaw skills` 命令
