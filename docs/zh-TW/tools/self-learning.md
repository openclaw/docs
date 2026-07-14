---
read_when:
    - 你希望 OpenClaw 從已完成的對話中學習可重複使用的流程
    - 你正在決定是否啟用自主 Skills 提案
    - 你需要瞭解自我學習的安全性、成本、適用資格或疑難排解方法
sidebarTitle: Self-learning
summary: 讓 OpenClaw 根據修正和已完成的重要工作提出可重複使用的 Skills
title: 自我學習
x-i18n:
    generated_at: "2026-07-14T14:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b5e6de2452a6f7dfb0042d6185b09fc1fa82dcfd0bc73d4f4cf0632b7900056c
    source_path: tools/self-learning.md
    workflow: 16
---

自我學習可讓 OpenClaw 將對話中的有用證據轉化為待處理的
[Skill Workshop](/zh-TW/tools/skill-workshop) 提案。它不會訓練模型
權重、編輯啟用中的 Skills，或在未告知的情況下改變代理程式行為。每個學習到的
程序都會維持待處理狀態，直到操作人員審查並套用為止。

自我學習**預設為停用**。只有在額外執行背景模型及審查逐字稿
適合你的工作區時，才啟用此功能。

## 啟用自我學習

在 Control UI 中開啟**外掛 → 工作坊**，然後開啟**自我學習**。
變更會立即生效；若另一個設定寫入程式已更新檔案，
Control UI 會重新整理設定快照並重試切換，而不需要重新載入
頁面或閘道。

使用命令列介面：

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

或編輯 `~/.openclaw/openclaw.json`：

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

再次停用：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

停用自我學習時，使用者要求建立 Skills、`/learn` 及手動 Skill Workshop 操作
仍可繼續使用。

## 手動審查過往工作階段

手動歷程審查是自主擷取功能較保守的替代方案。
在 Control UI 中開啟**外掛 → 工作坊**，然後選取**尋找 Skill 構想**。
這不會變更 `skills.workshop.autonomous.enabled`。

每次掃描：

- 從最新且尚未審查的工作階段開始，並逐步往前回溯；
- 最多審查 20 個至少包含六次模型輪次的實質工作階段；
- 略過排程、心跳偵測、鉤子、子代理程式、ACP、外掛擁有及內部審查
  工作階段；
- 在將逐字稿套件傳送至所選代理程式設定的模型前，遮蔽可辨識的祕密資訊並限制其大小；
- 採用與自主經驗審查相同的高標準；以及
- 最多可建立或修訂三個待處理提案，絕不會建立啟用中的 Skills。

工作坊會回報累計工作階段數量、日期涵蓋範圍及找到的構想。
選取**掃描較早的工作**以處理下一個更早的範圍。當游標到達
符合資格的歷程開頭時，動作會變更為**掃描新工作**。
OpenClaw 只會將游標及涵蓋範圍中繼資料持久儲存在共用狀態資料庫中；
不會建立第二份逐字稿封存。

只有在 OpenClaw 能證明工作階段的擁有權並排除
外部鉤子內容時，才會進行掃描。升級後，目前的升級前逐字稿可在本機
進行分類，但缺少個別執行來源資訊的已輪替升級前逐字稿
會被略過。新的逐字稿會在輪替後繼續保留此來源資訊。

手動掃描仍會產生模型供應商費用，並將符合資格的對話
內容傳送給設定的供應商。只有在此類審查符合
工作區的隱私權及資料處理要求時，才使用此功能。

## OpenClaw 可以學習什麼

自我學習有兩種保守途徑：

1. **直接指示與更正。** OpenClaw 會偵測具持續效力的措辭，
   例如「從現在開始」、「下次」以及對失敗方法的更正。
   啟用自我學習後，它可以將這些訊號轉化為待處理提案，
   不必等待另一個提示。此確定性途徑可將相關
   指示分組為最多三個提案、以可寫入的工作區 Skill 為目標，
   或修訂自身相關的待處理提案。它也會在失敗的輪次後執行，
   因為它擷取的是使用者指示，而不是判斷是否完成。
2. **經驗審查。** 在成功完成實質性的前景輪次後，
   OpenClaw 可審查已完成的工作，尋找可重複使用的復原技巧，或
   能在未來省去至少兩次模型或工具來回操作的
   穩定程序。

合適的候選項目包括：

- 在工具或模型多次失敗後可可靠復原的方法；
- 避免重複發生錯誤且不易察覺的順序限制；
- 需要反覆探索的穩定多步驟工作流程；或
- 可避免未來多次呼叫的可重複使用預先檢查。

對於例行成功工作、一次性要求、個人事實、簡單偏好、
暫時性環境故障、一般性建議、缺乏依據的否定主張及祕密資訊，
審查程式應不提出提案。

## 經驗審查何時執行

經驗審查會刻意延後執行並受到限制：

- 前景輪次必須成功完成。
- 目前輪次必須至少包含十次模型迭代。
- 排程、心跳偵測、記憶、溢位、鉤子、子代理程式及審查工作階段
  會被排除。
- 前景執行必須已解析出供應商及模型，而且實際上
  能存取 `skill_workshop`。
- OpenClaw 會在完成後等待 30 秒。同一工作階段中若稍後又有前景執行完成，
  便會重新開始這段靜默期。
- 如果任何代理程式或回覆執行仍在進行中，審查會再等待 30 秒。
- 同一時間只會執行一項經驗審查。
- 延後審查是處理程序本機的閘道工作。閘道必須在
  整段閒置期間持續執行；一次性本機及由命令列介面支援的執行階段不會保留
  足夠的軌跡與工具可用性內容來安排審查。

學習絕不會延遲前景回覆。失敗或不符合資格的
輪次不會啟動經驗審查，不過在停用自主功能時，仍可將使用者的直接更正
作為建議提供。

## 審查程式會收到什麼

背景審查程式只會收到目前輪次，從最近一則
使用者訊息開始。轉譯後的軌跡上限為 60,000 個字元；
必要時，OpenClaw 會保留第一則訊息及最新證據，
並標示省略的中間部分。

審查程式會重複使用已解析的供應商及模型。當前景
驗證設定檔的身分可用時，它會重複使用該設定檔，並停用模型後援。
因此，此審查會在設定的供應商上啟動另一次模型執行。
當該執行檢查或起草提案時，可能會發出多次供應商要求。
供應商的定價及資料處理條款與前景輪次相同，均適用於此執行。

開始前，OpenClaw 會重新載入目前的執行階段設定，並重新檢查
原始對話的有效沙箱及工具原則。如果該執行位於
沙箱中、原則不再允許 `skill_workshop`，或缺少必要的執行階段事實，
審查會採取失敗關閉方式，且不建立任何內容。

<Warning>
  啟用自我學習後，符合資格的對話內容（包括目前輪次中的工具
  輸入及結果）可傳送至所選模型
  供應商，以進行一次額外審查。若此審查會違反資料處理要求，
  請勿在該工作區中啟用此功能。
</Warning>

## 提案安全性

審查程式會在隔離的工作階段中執行，且工具
範圍會受到刻意限制：

- 它只能列出或檢查工作坊提案，並建立或修訂一個
  待處理提案。
- 它無法更新啟用中的 Skill、套用提案、拒絕提案、隔離
  提案、傳送訊息，或使用一般代理程式工具。
- 模型重試會共用一份變更預算，因此一次審查最多只能建立或
  修訂一個提案。
- 受審查的軌跡會被視為不受信任的證據，而不是提供給
  背景代理程式的指示。
- Skill Workshop 會掃描提案內容，並在寫入提案狀態前拒絕
  可辨識的明文認證資訊。

一般工作坊限制仍然適用，包括 `maxPending`、`maxSkillBytes`、
支援檔案限制、掃描程式檢查，以及僅限工作區寫入。設定
`approvalPolicy: "auto"` 不會授予背景審查程式存取
生命週期動作的權限。

## 審查學習產生的提案

自我學習會產生與手動使用工作坊相同的待處理提案。
套用前請先檢查：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

修訂、拒絕或隔離有用但尚未準備妥當的提案：

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

套用是唯一會寫入啟用中 `SKILL.md` 的操作。完整的生命週期及儲存
模型請參閱 [Skill Workshop](/zh-TW/tools/skill-workshop)。

## 設定

| 設定                                       | 預設值      | 自我學習效果                                                                                                                      |
| ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`     | 啟用直接更正擷取及延後經驗審查。                                                                                                  |
| `skills.workshop.approvalPolicy`           | `"pending"` | 控制一般由代理程式發起之生命週期動作的核准提示；不會擴大背景審查程式的權限。                                                       |
| `skills.workshop.maxPending`               | `50`        | 限制每個工作區待處理及已隔離提案的數量。                                                                                           |
| `skills.workshop.maxSkillBytes`            | `40000`     | 限制提案本文的位元組大小。                                                                                                        |
| `skills.workshop.allowSymlinkTargetWrites` | `false`     | 僅影響套用行為；自我學習本身寫入的是提案狀態，而非啟用中的 Skill 目標。                                                            |

完整的結構描述、範圍及相關 Skill 設定請參閱
[Skills 設定](/zh-TW/tools/skills-config#workshop-skills-workshop)。

## 疑難排解

### 長時間輪次後未出現提案

檢查以下所有項目：

1. 啟用中的閘道設定內，`skills.workshop.autonomous.enabled` 為 `true`。
2. 該輪次已成功，且在最近一則使用者訊息後至少包含
   十次模型迭代。
3. 該對話是一般前景執行，而非排程、記憶、
   鉤子或子代理程式執行。
4. 原始執行可存取 `skill_workshop`，且未在沙箱中執行。
5. 系統維持閒置的時間足以執行延後審查。
6. 長時間執行的閘道處理程序在整段閒置期間保持啟用；
   一次性本機命令不會等待延後審查。

符合資格的審查仍可能不產生提案。當證據未達到
可重複使用程序的標準時，不提出提案是預期結果。

### Doctor 回報工作坊工具已隱藏

啟用自我學習時，`openclaw doctor` 會檢查預設
代理程式的有效工具原則是否允許 `skill_workshop`。依照回報的
`tools.allow` 或 `tools.alsoAllow` 變更操作，或停用自我學習。

### 出現太多低價值提案

停用自我學習，並繼續使用 `/learn` 或明確的工作坊要求：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

停用此功能後，待處理提案仍可供審查。停用
自我學習不會套用、拒絕或刪除這些提案。

## 相關內容

- [Skill Workshop](/zh-TW/tools/skill-workshop)，用於提案審查、核准及
  儲存
- [建立 Skills](/zh-TW/tools/creating-skills)，用於手動編寫的 Skills 和
  `SKILL.md` 結構
- [Skills 設定](/zh-TW/tools/skills-config)，涵蓋所有 `skills.*` 設定
- [Skills 命令列介面](/zh-TW/cli/skills)，用於 Workshop 和策展人命令
