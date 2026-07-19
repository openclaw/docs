---
read_when:
    - 你想快速診斷頻道健康狀態與近期工作階段的收件者
    - 你想要一份可直接貼上的「全部」狀態資訊，以便進行偵錯
summary: '`openclaw status` 的命令列介面參考（診斷、探測、用量快照）'
title: openclaw 狀態
x-i18n:
    generated_at: "2026-07-19T13:40:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abf35fe5e60e7fce94aacf86c009d77ac1cc993e0099d294d248e7b884a3f9dc
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
| `--all`                 | 完整診斷（唯讀、可貼上）。包括安全性稽核、外掛相容性與記憶向量探查。 |
| `--deep`                | 執行即時探查（WhatsApp Web + Telegram + Discord + Slack + Signal）。同時啟用安全性稽核。         |
| `--usage`               | 將正規化的供應商用量時段列印為 `X% left`。                                                          |
| `--json`                | 機器可讀的輸出。                                                                                        |
| `--verbose` / `--debug` | 也會在報告前列印原始閘道目標解析結果。                                                 |

一般的 `openclaw status` 會維持快速唯讀路徑，並在略過記憶檢查時將記憶標示為
`not checked`，而不是無法使用。繁重的
安全性稽核、外掛相容性與記憶向量探查則留給
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`
及 `openclaw memory status --deep`。

## 工作階段與模型解析

- 工作階段狀態輸出會區分 `Execution:` 與 `Runtime:`。`Execution`
  是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你
  工作階段使用的是 `OpenClaw Default`、`OpenAI Codex`、命令列介面
  後端，還是如 `codex (acp/acpx)` 的 ACP 後端。關於供應商／模型／執行階段的
  區別，請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。
- 當目前的工作階段快照資訊不足時，`/status` 可從最近的逐字稿用量記錄回填權杖
  與快取計數器。現有的非零即時值仍優先於逐字稿的備援值。
- 當即時工作階段項目缺少使用中的執行階段模型標籤時，
  逐字稿備援也能將其復原。如果該逐字稿模型與選定模型不同，
  狀態會依照復原的執行階段模型解析內容窗口，
  而非選定模型。
- 進行提示大小計算時，若工作階段中繼資料缺失或較小，
  逐字稿備援會優先採用較大的提示導向總量，以免
  自訂供應商工作階段縮減成 `0` 權杖顯示。
- 當工作階段釘選到與設定的主要模型不同的模型時，
  狀態會列印這兩個值、原因（`session override`）以及
  提示 `/model default`。設定的主要模型適用於新的或
  未釘選的工作階段；現有的釘選工作階段會保留其工作階段選擇，
  直到清除為止。
- 設定多個代理程式時，輸出會包括各代理程式的工作階段儲存區。

## 用量與配額

- `--usage` 會將正規化的供應商用量時段列印為 `X% left`。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示剩餘配額，
  因此 OpenClaw 會在顯示前將其反轉；若有以計數為基礎的欄位，
  則以該欄位為準。`model_remains` 回應會優先採用聊天模型項目、在需要時根據
  時間戳記推導時段標籤，並在方案標籤中包含模型名稱。
- 模型定價重新整理失敗會顯示為選用的定價警告。
  這不表示閘道或頻道狀況不良。

## 概覽與更新狀態

- 若有相關資訊，概覽會包括閘道與節點主機服務的安裝／執行階段狀態，
  以及精簡的閘道程序運作時間與主機系統運作時間。
- 概覽會包括更新頻道與 git SHA（適用於原始碼簽出）。
- 更新資訊會顯示在概覽中；若有可用更新，狀態會
  列印執行 `openclaw update` 的提示（請參閱[更新](/zh-TW/install/updating)）。

## 密鑰

- 當執行中的閘道具有任何因啟動、重新載入或設定寫入而隔離的 SecretRef 擁有者時，狀態會在 JSON 中包括 `degradedSecretOwners`，並在人類可讀輸出的概覽中顯示「**降級的密鑰**」列。每個項目都會列出擁有者、降級狀態（`cold` 或 `stale`）、設定路徑，以及經遮蔽的原因。冷態擁有者無法使用；過時擁有者則會繼續使用最近一次已知正常的值。
- 唯讀狀態介面（`status`、`status --json`、`status --all`）
  會在可能的情況下，為其目標設定路徑解析支援的 SecretRef。
- 如果已設定支援的頻道 SecretRef，但在目前的命令路徑中無法使用，
  狀態仍會維持唯讀並回報降級輸出，
  而不會當機。人類可讀輸出會顯示「此命令路徑無法使用已設定的權杖」等警告，
  JSON 輸出則會包括
  `secretDiagnostics`。
- 當命令本機的 SecretRef 解析成功時，狀態會優先採用
  解析後的快照，並從最終輸出中清除暫時性的「密鑰無法使用」頻道
  標記。
- `status --all` 包括「密鑰」概覽列與診斷區段，
  其中會彙整密鑰診斷資訊（為方便閱讀而截斷），且不會
  停止產生報告。

## 記憶

`status --json --all` 會回報由 `plugins.slots.memory` 選定的主動記憶外掛
執行階段所提供的記憶詳細資料。自訂記憶外掛可停用
內建的 `agents.defaults.memorySearch.enabled`，同時仍回報
自己的檔案、區塊、向量與 FTS 狀態。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [診斷工具](/zh-TW/gateway/doctor)
