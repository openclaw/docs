---
read_when:
    - 你希望 OpenClaw 從已完成的對話中學習可重複使用的程序
    - 你正在決定是否啟用自主 Skills 提案
    - 你需要瞭解自我學習的安全性、成本、資格或疑難排解方式
sidebarTitle: Self-learning
summary: 讓 OpenClaw 根據修正與已完成的重大工作提出可重複使用的 Skills
title: 自我學習
x-i18n:
    generated_at: "2026-07-16T12:00:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

自我學習讓 OpenClaw 能將對話中的有用證據轉化為待處理的
[Skill Workshop](/zh-TW/tools/skill-workshop) 提案。它不會訓練模型
權重、編輯使用中的 Skills，或在未告知的情況下變更代理程式行為。每個學到的
程序都會保持待處理狀態，直到操作員審查並套用為止。

自我學習**預設為停用**。只有在額外的
背景模型執行與對話記錄審查適合你的工作區時，才啟用此功能。

## 啟用自我學習

在控制介面中，開啟 **外掛 → Workshop** 並開啟**自我學習**。此
變更會立即生效；當另一個設定寫入程式已更新
檔案時，控制介面會重新整理設定快照並重試切換，而不需要
重新載入頁面或閘道。

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

使用以下指令再次停用：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

停用自我學習時，使用者要求建立 Skill、`/learn` 和手動 Skill Workshop 操作
仍可繼續運作。

## 手動審查過去的工作階段

手動歷史記錄審查是自主擷取的保守替代方案。
在控制介面中開啟 **外掛 → Workshop**，然後選取 **尋找 Skill 構想**。
這不會變更 `skills.workshop.autonomous.enabled`。

每次掃描：

- 從最新且尚未審查的工作階段開始，並向較舊的記錄回溯；
- 最多審查 20 個至少包含六個模型輪次的實質工作階段；
- 略過排程、心跳偵測、鉤子、子代理程式、ACP、外掛擁有及內部審查
  工作階段；
- 在將對話記錄套件傳送至所選代理程式設定的模型之前，遮蔽已辨識的機密並限制其大小；
- 採用與自主經驗審查相同的高標準；以及
- 最多可建立或修訂三個待處理提案，絕不會變更使用中的 Skills。

Workshop 會報告累計工作階段數、日期涵蓋範圍及找到的構想。
選取 **掃描更早的工作** 以處理下一個較舊的範圍。當游標到達
符合資格之歷史記錄的開頭時，動作會變更為 **掃描新工作**。
OpenClaw 只會在共用狀態資料庫中保存游標與涵蓋範圍中繼資料；
不會建立第二份對話記錄封存。

只有在 OpenClaw 能證明工作階段的擁有權並排除
外部鉤子內容時，才會掃描該工作階段。升級後，目前升級前的對話記錄可以
在本機分類，但缺少逐次執行來源資訊的已輪替升級前對話記錄
會被略過。新的對話記錄在輪替後仍會保留此來源資訊。

手動掃描仍會產生模型供應商費用，並將符合資格的對話
內容傳送至已設定的供應商。只有在該審查符合
工作區的隱私與資料處理要求時才使用此功能。

## OpenClaw 可以學習什麼

自我學習有兩種保守路徑：

1. **直接指示與修正。** OpenClaw 會偵測持久性的語句，
   例如「從現在開始」、「下次」，以及對失敗方法的修正。
   啟用自我學習後，它可以將這些訊號轉化為待處理提案，
   而不必等待另一個提示。此確定性路徑可將相關
   指示分組為最多三個提案、以可寫入的工作區 Skill 為目標，
   或修訂其自身相關的待處理提案。它也會在失敗的輪次後執行，
   因為它擷取的是使用者的指示，而不是判斷工作是否完成。
2. **經驗審查。** 在成功且實質的前景輪次之後，
   OpenClaw 可以審查已完成的工作，尋找可重複使用的復原技巧或
   穩定程序，而該程序能減少未來至少兩次模型或工具的
   往返操作。

良好的候選項目包括：

- 在工具或模型反覆失敗後的可靠復原方式；
- 避免反覆發生錯誤的非顯而易見順序限制；
- 需要反覆探索的穩定多步驟工作流程；或
- 可避免未來多次呼叫的可重複使用預先檢查。

對於例行的成功工作、一次性要求、
個人事實、簡單偏好、暫時性環境故障、一般性
建議、未受支持的負面主張及機密，審查器應放棄提出提案。

## 經驗審查何時執行

經驗審查會刻意延遲並受限：

- 前景輪次必須成功完成。
- 目前輪次必須包含至少十次模型迭代。
- 排程、心跳偵測、記憶體、溢位、鉤子、子代理程式及審查工作階段
  均會被排除。
- 前景執行必須已解析供應商與模型，且實際上
  能夠存取 `skill_workshop`。
- OpenClaw 會在完成後等待 30 秒。同一工作階段中較晚完成的前景工作
  會重新開始該靜默期。
- 如果任何代理程式或回覆執行仍在進行，審查會再等待 30 秒。
- 一次只會執行一個經驗審查。
- 延遲審查是程序內的閘道工作。閘道必須在
  閒置時段內持續執行；一次性的本機與命令列介面後端執行環境不會保留
  足夠的軌跡與工具可用性脈絡來排程審查。

前景回答絕不會因學習而延遲。失敗或不符合資格的
輪次不會啟動經驗審查，但在停用自主功能時，仍可
將使用者的直接修正作為建議提出。

## 審查器會收到什麼

背景審查器只會收到目前輪次，從其最近的
使用者訊息開始。算繪後的軌跡上限為 60,000 個字元；
必要時，OpenClaw 會保留第一則訊息與最新的證據，並
標示中間被省略的部分。

審查器會重複使用已解析的供應商與模型。當前景
認證身分可用時，它會重複使用該認證設定檔，並停用模型後援。
因此，審查會在已設定的供應商上啟動額外的模型執行。
當該執行檢查或起草提案時，可能會提出多次供應商要求。
供應商的定價與資料處理條款和前景輪次相同，皆會適用。

開始前，OpenClaw 會重新載入目前的執行階段設定，並重新檢查
原始對話的有效沙箱與工具原則。如果執行處於
沙箱中、原則不再允許 `skill_workshop`，或缺少必要的執行階段事實，
審查會以封閉方式失敗且不建立任何內容。

<Warning>
  啟用自我學習會允許將符合資格的對話內容（包括目前輪次的工具
  輸入與結果）傳送至所選的模型
  供應商進行一次額外審查。若該審查會違反
  資料處理要求，請勿在該工作區中啟用此功能。
</Warning>

## 提案安全性

審查器會在隔離的工作階段中執行，且工具
介面受到刻意限制：

- 它只能列出或檢查 Workshop 提案，並建立或修訂一個
  待處理提案。
- 它無法更新使用中的 Skill、套用提案、拒絕提案、隔離
  提案、傳送訊息或使用一般代理程式工具。
- 模型重試共用一個變更預算，因此一次審查最多只能建立或
  修訂一個提案。
- 經審查的軌跡會被視為不受信任的證據，而不是給
  背景代理程式的指示。
- Skill Workshop 會掃描提案內容，並在寫入提案狀態前拒絕已辨識的明文
  認證資訊。

一般 Workshop 限制仍然適用，包括 `maxPending`、`maxSkillBytes`、
支援檔案限制、掃描器檢查及僅限工作區寫入。 
`approvalPolicy: "auto"` 設定不會授予背景審查器
生命週期動作的存取權。

## 審查學到的提案

自我學習會產生與手動使用 Workshop 相同的待處理提案。
套用前請先檢查：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

修訂、拒絕或隔離實用但尚未準備完成的提案：

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

套用是唯一會寫入使用中 `SKILL.md` 的操作。完整生命週期與儲存
模型請參閱 [Skill Workshop](/zh-TW/tools/skill-workshop)。

## 設定

| 設定                                       | 預設值   | 自我學習效果                                                                                                                      |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | 啟用直接修正擷取與延遲經驗審查。                                                                                                  |
| `skills.workshop.approvalPolicy`           | `"auto"` | 控制一般代理程式啟動之生命週期動作的核准提示；它不會擴大背景審查器的權限。                                                        |
| `skills.workshop.maxPending`               | `50`     | 限制每個工作區的待處理及已隔離提案數量。                                                                                          |
| `skills.workshop.maxSkillBytes`            | `40000`  | 限制提案本文的位元組大小。                                                                                                        |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | 只影響套用行為；自我學習本身寫入的是提案狀態，而非使用中的 Skill 目標。                                                           |

如需完整的結構描述、範圍及相關 Skill 設定，請參閱
[Skills 設定](/zh-TW/tools/skills-config#workshop-skills-workshop)。

## 疑難排解

### 長時間輪次後未出現提案

請檢查下列所有項目：

1. `skills.workshop.autonomous.enabled` 在使用中的閘道設定中為 `true`。
2. 該輪次已成功，且在最近的使用者訊息後至少包含十次模型
   迭代。
3. 該對話是一般前景執行，而非排程、記憶體、
   鉤子或子代理程式執行。
4. 原始執行能夠存取 `skill_workshop`，且未處於沙箱中。
5. 系統保持閒置的時間足以執行延遲審查。
6. 長時間執行的閘道程序在整個閒置時段內保持運作；
   一次性的本機命令不會等待延遲審查。

符合條件的審查仍可能不產生提案。當證據未達到
可重複使用程序的標準時，放棄提出提案是預期結果。

### Doctor 回報 Workshop 工具已隱藏

啟用自我學習後，`openclaw doctor` 會檢查預設
代理程式的有效工具原則是否允許 `skill_workshop`。依照回報的
`tools.allow` 或 `tools.alsoAllow` 進行變更，或停用自我學習。

### 出現過多低價值提案

停用自我學習，並繼續使用 `/learn` 或明確的 Workshop 要求：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

停用此功能後，待處理提案仍可供審查。停用
自我學習不會套用、拒絕或刪除這些提案。

## 相關內容

- [Skill 工作坊](/zh-TW/tools/skill-workshop)，用於提案審查、核准與
  儲存
- [建立 Skills](/zh-TW/tools/creating-skills)，用於手動編寫的 Skills 與
  `SKILL.md` 結構
- [Skills 設定](/zh-TW/tools/skills-config)，涵蓋所有 `skills.*` 設定
- [Skills 命令列介面](/zh-TW/cli/skills)，用於工作坊與策展人命令
