---
read_when:
    - 執行本機個人代理可靠性檢查
    - 擴充由儲存庫支援的 QA 情境目錄
    - 驗證提醒、回覆、記憶、遮蔽、安全工具後續執行、任務狀態、可安全分享的診斷、以證據支持的完成聲明，以及失敗復原
summary: 本機 qa-channel 情境，用於隱私保護型個人助理工作流程檢查。
title: 個人代理基準測試套件
x-i18n:
    generated_at: "2026-07-05T11:14:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

個人代理基準測試套件是一個小型、由儲存庫支援的 QA 情境套件，用於
本機個人助理工作流程。它不是通用模型基準測試，也
不需要新的執行器：它重用私有 QA 堆疊（[QA 概觀](/zh-TW/concepts/qa-e2e-automation)）、
合成的 [QA 頻道](/zh-TW/channels/qa-channel)，以及既有的
`qa/scenarios` YAML 目錄。

## 情境

十個情境，定義於 `qa/scenarios/personal/*.yaml`：

| 情境 id                                   | 檢查                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | 透過本機排程投遞模擬個人提醒                                                                  |
| `personal-channel-thread-reply`            | 透過 `qa-channel` 模擬 DM 與討論串回覆路由                                                    |
| `personal-memory-preference-recall`        | 從暫存 QA 工作區記憶檔案模擬偏好回想                                                          |
| `personal-redaction-no-secret-leak`        | 模擬祕密不回顯檢查                                                                            |
| `personal-tool-safety-followthrough`       | 在短暫的核准式回合後，進行由安全讀取支援的工具跟進                                            |
| `personal-approval-denial-stop`            | 針對敏感本機讀取請求的核准拒絕停止行為                                                        |
| `personal-task-followthrough-status`       | 有證據支援的任務狀態回報，將待處理、已封鎖與已完成分開                                        |
| `personal-share-safe-diagnostics-artifact` | 可安全分享的診斷成品，保留有用狀態，同時省略原始個人內容                                      |
| `personal-no-fake-progress`                | 有證據支援的完成宣稱，避免在本機證據存在前假裝有進展                                          |
| `personal-failure-recovery`                | 失敗復原會回報部分狀態，並保持重試邊界清楚                                                    |

機器可讀的套件中繼資料（id 清單、標題、描述）位於
`extensions/qa-lab/src/scenario-packs.ts`，名稱為 `QA_PERSONAL_AGENT_SCENARIO_IDS`。
使用 `--pack personal-agent` 執行此套件：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` 可與重複的 `--scenario` 旗標相加使用。明確指定的情境會
先執行，接著套件情境會依 `QA_PERSONAL_AGENT_SCENARIO_IDS` 順序執行，
並移除重複項目。

此套件目標是搭配 `mock-openai` 或另一個本機 QA 提供者
通道使用 `qa-channel`。不要將它指向即時聊天服務或真實個人帳號。

## 隱私模型

情境只使用假使用者、假偏好、假祕密，以及
套件建立的暫存 QA 閘道工作區。它們不得讀取或
寫入真實 OpenClaw 使用者記憶、工作階段、憑證、啟動代理程式、全域
設定，或即時閘道狀態。

成品會保留在既有 QA 套件成品目錄下，並被視為
測試輸出。修訂檢查使用假標記，因此失敗也能安全地
檢查並提交到議題中。

## 擴充此套件

在 `qa/scenarios/personal/` 下新增 `.yaml` 案例，然後將情境 id
加入 `QA_PERSONAL_AGENT_SCENARIO_IDS`。讓每個案例保持小型、本機、在
`mock-openai` 中具決定性，並聚焦於一個個人助理行為。

合適的後續候選項目：已修訂軌跡匯出檢查、僅限本機的
外掛工作流程檢查。

在情境目錄有足夠穩定案例可證明該介面值得存在之前，
避免新增執行器、外掛、依賴項、即時傳輸或模型評審。
