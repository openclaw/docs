---
read_when:
    - 執行本機個人代理可靠性檢查
    - 擴充由儲存庫支援的 QA 情境目錄
    - 驗證提醒、回覆、記憶、遮蔽、安全工具後續執行、任務狀態、可安全分享的診斷資訊、有證據支持的完成聲明，以及失敗復原
summary: 用於隱私保護型個人助理工作流程檢查的本機 qa-channel 情境。
title: 個人代理基準測試套件
x-i18n:
    generated_at: "2026-07-11T21:15:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

個人代理基準套件是一個由小型儲存庫支援的 QA 情境套件，用於
本機個人助理工作流程。它不是通用模型基準測試，
也不需要新的執行器：它會重複使用私有 QA 技術棧（[QA 概覽](/zh-TW/concepts/qa-e2e-automation)）、
合成的 [QA 頻道](/zh-TW/channels/qa-channel)，以及現有的
`qa/scenarios` YAML 目錄。

## 情境

共有十個情境，定義於 `qa/scenarios/personal/*.yaml`：

| 情境 ID                                    | 檢查項目                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `personal-reminder-roundtrip`              | 透過本機排程傳遞模擬的個人提醒                                                           |
| `personal-channel-thread-reply`            | 透過 `qa-channel` 路由模擬的私訊與討論串回覆                                            |
| `personal-memory-preference-recall`        | 從臨時 QA 工作區的記憶檔案中喚回模擬的偏好設定                                         |
| `personal-redaction-no-secret-leak`        | 模擬機密不回顯檢查                                                                       |
| `personal-tool-safety-followthrough`       | 在簡短的核准式對話後，安全地完成由讀取操作支援的工具後續作業                           |
| `personal-approval-denial-stop`            | 對敏感本機讀取要求拒絕核准後停止的行為                                                 |
| `personal-task-followthrough-status`       | 以證據為依據回報任務狀態，並將待處理、受阻和完成狀態分開                               |
| `personal-share-safe-diagnostics-artifact` | 可安全分享的診斷成品，在省略原始個人內容的同時保留實用狀態資訊                         |
| `personal-no-fake-progress`                | 以證據為依據宣稱完成，避免在本機證據存在前虛報進度                                     |
| `personal-failure-recovery`                | 回報部分狀態並清楚界定重試範圍的失敗復原                                               |

機器可讀的套件中繼資料（ID 清單、標題、說明）位於
`extensions/qa-lab/src/scenario-packs.ts`，名稱為 `QA_PERSONAL_AGENT_SCENARIO_IDS`。
使用 `--pack personal-agent` 執行此套件：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` 可與重複使用的 `--scenario` 旗標疊加。明確指定的情境會先執行，
接著套件情境會依 `QA_PERSONAL_AGENT_SCENARIO_IDS` 的順序執行，
並移除重複項目。

此套件以搭配 `mock-openai` 或其他本機 QA 提供者
執行路徑的 `qa-channel` 為目標。請勿將它指向即時聊天服務或真實個人帳號。

## 隱私模型

情境僅使用模擬使用者、模擬偏好設定、模擬機密，以及
套件建立的臨時 QA 閘道工作區。它們不得讀取或
寫入真實的 OpenClaw 使用者記憶、工作階段、憑證、啟動代理程式、全域
設定或即時閘道狀態。

成品會保留在現有的 QA 套件成品目錄下，並視為
測試輸出。遮蔽檢查使用模擬標記，因此可以安全地
檢查失敗情況並將其提交至議題。

## 擴充套件

在 `qa/scenarios/personal/` 下新增 `.yaml` 案例，然後將情境 ID
加入 `QA_PERSONAL_AGENT_SCENARIO_IDS`。每個案例應保持精簡、僅限本機、在
`mock-openai` 中具決定性，並專注於一項個人助理行為。

適合的後續候選項目：經遮蔽的軌跡匯出檢查、僅限本機的
外掛工作流程檢查。

在情境目錄擁有足夠的穩定案例、足以證明新增介面的合理性之前，
請避免新增執行器、外掛、相依套件、即時傳輸或模型評審器。
