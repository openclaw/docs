---
read_when:
    - 執行本機個人代理可靠性檢查
    - 擴充由儲存庫支援的 QA 情境目錄
    - 驗證提醒、回覆、記憶、遮蔽、安全工具後續執行、任務狀態、可安全分享的診斷、具證據支持的完成宣稱，以及失敗復原
summary: 用於隱私保護個人助理工作流程檢查的本機 qa-channel 情境。
title: 個人代理基準測試套件
x-i18n:
    generated_at: "2026-06-27T19:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack 是一個由小型 repo 支援的 QA 情境套件，用於
本機個人助理工作流程。它不是通用模型基準測試，也不需要新的執行器。此套件重用
[QA 概觀](/zh-TW/concepts/qa-e2e-automation)中描述的私有 QA 堆疊、合成
[QA 頻道](/zh-TW/channels/qa-channel)，以及現有的 `qa/scenarios` YAML
目錄。

第一個套件刻意保持範圍狹窄：

- 透過本機排程傳遞的假個人提醒
- 透過 `qa-channel` 路由的假私訊與討論串回覆
- 從暫存 QA 工作區記憶體檔案進行假的偏好回憶
- 假祕密的無回顯檢查
- 在短暫的核准式回合後，進行由安全讀取支援的工具後續操作
- 針對敏感本機讀取請求的核准拒絕停止行為
- 以證據支援的任務狀態回報，將待處理、受阻與完成保持分開
- 可安全分享的診斷成品，在保留有用狀態的同時省略原始個人內容
- 以證據支援的完成宣告，避免在本機證據存在前產生假的進度
- 失敗復原會回報部分狀態，並讓重試邊界保持清楚

## 情境

機器可讀的套件中繼資料位於
`extensions/qa-lab/src/scenario-packs.ts`。使用
`--pack personal-agent` 執行此套件：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` 可與重複的 `--scenario` 旗標疊加使用。明確指定的情境會先執行，
接著套件情境會依 `QA_PERSONAL_AGENT_SCENARIO_IDS` 順序執行，並移除重複項目。

此套件是為搭配 `qa-channel` 與 `mock-openai` 或其他本機 QA
供應者路徑而設計。不應將它指向即時聊天服務或真實個人帳號。

## 隱私模型

這些情境只使用假使用者、假偏好、假祕密，以及測試套件建立的暫存 QA 閘道工作區。
它們不得讀取或寫入真實的 OpenClaw 使用者記憶、工作階段、憑證、啟動代理程式、全域設定，
或即時閘道狀態。

成品會留在現有 QA 測試套件成品目錄下，並應視為測試輸出。遮罩檢查使用假標記，
因此失敗時可以安全地檢查並提交到 issue。

## 擴充此套件

在 `qa/scenarios/personal/` 下新增 `.yaml` 案例，然後將情境 ID
加入 `QA_PERSONAL_AGENT_SCENARIO_IDS`。保持每個案例小型、本機、在 `mock-openai`
中具決定性，並專注於一項個人助理行為。

良好的後續候選項目：

- 已遮罩軌跡匯出檢查
- 僅限本機的外掛工作流程檢查

在情境目錄擁有足夠穩定案例以證明該介面值得存在之前，避免新增新的執行器、外掛、依賴項、
即時傳輸或模型評審。
