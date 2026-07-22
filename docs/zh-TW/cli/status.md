---
read_when:
    - 你想快速診斷頻道健康狀態與最近的工作階段收件者
    - 你想要可直接貼上的「全部」狀態以供偵錯使用
summary: '`openclaw status` 的命令列介面參考（診斷、探測、用量快照）'
title: openclaw 狀態
x-i18n:
    generated_at: "2026-07-22T10:29:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52e8076339216f11ddadf35e0ae8e5604322a47a5a9e2ee305468b2624d7cfde
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

| 旗標                    | 說明                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--all`                 | 完整診斷（唯讀、可直接貼上）。包含安全性稽核、外掛相容性與記憶向量探測。 |
| `--deep`                | 執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。也會啟用安全性稽核。         |
| `--usage`               | 將正規化的提供者用量時段印出為 `X% left`。                                                          |
| `--json`                | 機器可讀的輸出。                                                                                        |
| `--verbose` / `--debug` | 也會在報告前印出原始的閘道目標解析結果。                                                 |

一般的 `openclaw status` 會維持快速唯讀路徑，並在略過記憶檢查時將記憶標示為
`not checked`，而非不可用。繁重的安全性稽核、外掛相容性與記憶向量探測則交由
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`
和 `openclaw memory status --deep` 執行。

## 工作階段與模型解析

- 工作階段狀態輸出會區分 `Execution:` 與 `Runtime:`。`Execution`
  是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會指出
  工作階段使用的是 `OpenClaw Default`、`OpenAI Codex`、命令列介面
  後端，還是如 `codex (acp/acpx)` 的 ACP 後端。關於提供者／模型／執行階段
  的區別，請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。
- 當目前的工作階段快照資訊稀疏時，`/status` 可從最近的逐字稿用量記錄
  補齊權杖與快取計數器。現有的非零即時值仍優先於逐字稿的備援值。
- 當即時工作階段項目缺少目前使用中的執行階段模型標籤時，
  逐字稿備援也可將其復原。若該逐字稿模型與所選模型不同，
  狀態會依復原的執行階段模型而非所選模型來解析內容視窗。
- 計算提示大小時，如果工作階段中繼資料缺失或較小，逐字稿備援會優先採用較大的
  提示導向總量，避免自訂提供者工作階段縮減為 `0` 權杖顯示。
- 當工作階段固定使用與已設定主要模型不同的模型時，
  狀態會印出這兩個值、原因（`session override`），以及提示
  `/model default`。已設定的主要模型適用於新的或未固定的工作階段；
  現有的固定工作階段會保留其工作階段選擇，直到被清除為止。
- 設定多個代理程式時，輸出會包含各代理程式的工作階段儲存區。

## 用量與配額

- `--usage` 會將正規化的提供者用量時段印出為 `X% left`。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，
  因此 OpenClaw 會先將其反轉再顯示；若有基於計數的欄位，則以其為準。
  `model_remains` 回應會優先採用聊天模型項目，並在需要時根據時間戳記推導時段標籤，
  且在方案標籤中包含模型名稱。
- 模型價格重新整理失敗會顯示為選用的價格警告。
  這不代表閘道或頻道狀態異常。

## 概覽與更新狀態

- 如有相關資訊，概覽會包含閘道與節點主機服務的安裝／執行階段狀態，
  以及精簡的閘道程序運作時間和主機系統運作時間。
- 概覽會包含更新頻道與 git SHA（針對原始碼簽出）。
- 更新資訊會顯示在概覽中；若有可用更新，狀態會印出提示，要求執行
  `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。

## 密鑰

- 當執行中的閘道具有任何因啟動、重新載入或寫入設定而隔離的 SecretRef 擁有者時，狀態的 JSON 中會包含 `degradedSecretOwners`，而人類可讀輸出的概覽中會包含 **已降級的密鑰** 列。每個項目都會列出擁有者、降級狀態（`cold` 或 `stale`）、設定路徑，以及經遮蔽的原因。冷狀態擁有者無法使用；過時狀態擁有者則會繼續使用最近一次已知良好的值。
- 唯讀狀態介面（`status`、`status --json`、`status --all`）
  會在可能時，為其目標設定路徑解析支援的 SecretRef。
- 若已設定支援的頻道 SecretRef，但在目前的命令路徑中無法使用，
  狀態仍會保持唯讀並回報降級輸出，而不會當機。人類可讀輸出會顯示如
  “此命令路徑中無法使用已設定的權杖”等警告，而 JSON 輸出會包含
  `secretDiagnostics`。
- 當命令本機的 SecretRef 解析成功時，狀態會優先採用已解析的快照，
  並從最終輸出清除暫時性的“密鑰無法使用”頻道標記。
- `status --all` 包含密鑰概覽列與診斷區段，
  用於摘要密鑰診斷資訊（為提高可讀性而截斷），且不會停止產生報告。

## 記憶

`status --json --all` 會回報由 `plugins.slots.memory` 選取的主動記憶外掛
執行階段所提供的記憶詳細資料。自訂記憶外掛可讓內建
`memory.search.enabled` 維持停用，仍可回報其本身的檔案、區塊、
向量與 FTS 狀態。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
