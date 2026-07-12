---
read_when:
    - 你想快速診斷頻道健康狀況與最近工作階段的收件者
    - 你需要一份可貼上的「全部」狀態資訊，以便進行偵錯
summary: '`openclaw status` 的命令列介面參考（診斷、探測、使用量快照）'
title: openclaw 狀態
x-i18n:
    generated_at: "2026-07-11T21:15:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

頻道與工作階段的診斷。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| 旗標                    | 說明                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `--all`                 | 完整診斷（唯讀、可直接貼上）。包括安全稽核、外掛相容性與記憶向量探測。                       |
| `--deep`                | 執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。也會啟用安全稽核。        |
| `--usage`               | 以 `X% left` 格式輸出標準化的供應商用量週期。                                                |
| `--json`                | 機器可讀的輸出。                                                                             |
| `--verbose` / `--debug` | 在報告之前一併輸出原始的閘道目標解析結果。                                                   |

一般的 `openclaw status` 會維持在快速唯讀路徑；略過記憶檢查時，會將記憶標示為
`not checked`，而非不可用。繁重的安全稽核、外掛相容性與記憶向量探測則交由
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`
及 `openclaw memory status --deep` 執行。

## 工作階段與模型解析

- 工作階段狀態輸出會區分 `Execution:` 與 `Runtime:`。`Execution`
  是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 則會告知工作階段
  使用的是 `OpenClaw Default`、`OpenAI Codex`、命令列介面後端，或
  `codex (acp/acpx)` 等 ACP 後端。若要了解供應商、模型與執行環境的
  差異，請參閱[代理程式執行環境](/zh-TW/concepts/agent-runtimes)。
- 當目前的工作階段快照資訊不足時，`/status` 可從最近的對話記錄用量日誌
  回填權杖與快取計數器。現有的非零即時值仍優先於對話記錄中的備援值。
- 當即時工作階段項目缺少目前使用中的執行環境模型標籤時，對話記錄備援
  也能加以復原。如果該對話記錄模型與所選模型不同，狀態會依復原出的
  執行環境模型解析上下文視窗，而非依所選模型解析。
- 計算提示詞大小時，若工作階段中繼資料缺失或數值較小，對話記錄備援會
  優先採用較大的提示詞導向總量，以免自訂供應商工作階段的權杖顯示降為 `0`。
- 當工作階段固定使用與已設定主要模型不同的模型時，狀態會輸出兩者的值、
  原因（`session override`），以及提示 `/model default`。已設定的主要模型
  適用於新的或未固定模型的工作階段；現有已固定模型的工作階段會保留其
  工作階段選擇，直到清除為止。
- 設定多個代理程式時，輸出會包含各代理程式的工作階段儲存區。

## 用量與配額

- `--usage` 會以 `X% left` 格式輸出標準化的供應商用量週期。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，
  因此 OpenClaw 會先將其反轉再顯示；若有以計數為基礎的欄位，則優先採用。
  `model_remains` 回應會優先使用聊天模型項目、在需要時根據時間戳記推導
  週期標籤，並在方案標籤中包含模型名稱。
- 模型定價重新整理失敗時，會顯示為選用的定價警告。
  這不代表閘道或頻道運作異常。

## 概覽與更新狀態

- 如果可取得，概覽會包含閘道與節點主機服務的安裝及執行狀態，
  並提供精簡的閘道程序執行時間與主機系統運作時間。
- 概覽會包含更新頻道與 git SHA（適用於原始碼簽出）。
- 更新資訊會顯示在概覽中；若有可用更新，狀態會提示執行
  `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。

## 密鑰

- 唯讀狀態介面（`status`、`status --json`、`status --all`）
  會盡可能為其目標設定路徑解析支援的 SecretRef。
- 如果已設定支援的頻道 SecretRef，但目前的命令路徑無法使用，
  狀態仍會保持唯讀並回報降級輸出，而不會崩潰。供人閱讀的輸出會顯示
  「此命令路徑無法使用已設定的權杖」等警告，而 JSON 輸出則包含
  `secretDiagnostics`。
- 當命令本機的 SecretRef 解析成功時，狀態會優先採用已解析的快照，
  並從最終輸出中清除暫時性的「密鑰無法使用」頻道標記。
- `status --all` 會包含密鑰概覽列及診斷章節，以摘要方式呈現密鑰診斷
  （為便於閱讀會截斷內容），且不會中止報告產生。

## 記憶

`status --json --all` 會回報由 `plugins.slots.memory` 選取之主動記憶外掛
執行環境的記憶詳細資訊。自訂記憶外掛可讓內建的
`agents.defaults.memorySearch.enabled` 維持停用，同時仍回報其自身的
檔案、區塊、向量及 FTS 狀態。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [診斷工具](/zh-TW/gateway/doctor)
