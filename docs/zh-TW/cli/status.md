---
read_when:
    - 你想要快速診斷頻道健康狀態與最近的工作階段收件者
    - 你想要可貼上的「全部」狀態以便除錯
summary: '`openclaw status` 的命令列介面參考（診斷、探測、使用量快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-07-05T11:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

頻道 + 工作階段的診斷。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| 旗標                    | 說明                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--all`                 | 完整診斷（唯讀，可貼上）。包含安全稽核、外掛相容性與記憶向量探測。 |
| `--deep`                | 執行即時探測（WhatsApp 網頁版 + Telegram + Discord + Slack + Signal）。也會啟用安全稽核。         |
| `--usage`               | 以 `X% left` 印出標準化的供應商用量視窗。                                                          |
| `--json`                | 機器可讀的輸出。                                                                                        |
| `--verbose` / `--debug` | 也會在報告前印出原始閘道目標解析。                                                 |

一般的 `openclaw status` 會留在快速唯讀路徑，並在略過記憶檢查時將記憶標示為
`not checked`，而不是不可用。繁重的
安全稽核、外掛相容性與記憶向量探測則留給
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`
和 `openclaw memory status --deep`。

## 工作階段與模型解析

- 工作階段狀態輸出會將 `Execution:` 與 `Runtime:` 分開。`Execution`
  是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你
  該工作階段使用的是 `OpenClaw Default`、`OpenAI Codex`、命令列介面
  後端，或 ACP 後端，例如 `codex (acp/acpx)`。請參閱
  [代理程式執行階段](/zh-TW/concepts/agent-runtimes)，了解供應商/模型/執行階段
  的差異。
- 當目前的工作階段快照較稀疏時，`/status` 可以從最近的轉錄用量記錄回填權杖
  與快取計數器。現有的非零即時值仍會優先於轉錄後備值。
- 當即時工作階段項目缺少作用中執行階段模型標籤時，轉錄後備也可以復原它。
  如果該轉錄模型不同於所選模型，狀態會針對復原的執行階段模型解析脈絡視窗，
  而不是針對所選模型。
- 對於提示大小計算，當工作階段中繼資料缺失或較小時，轉錄後備會偏好較大的
  提示導向總量，因此自訂供應商工作階段不會折疊成 `0` 權杖顯示。
- 當工作階段釘選到不同於已設定主要模型的模型時，狀態會印出兩個值、原因
  （`session override`），以及提示 `/model default`。已設定的主要模型適用於新的或
  未釘選的工作階段；現有已釘選的工作階段會保留其工作階段選擇，直到清除為止。
- 當設定多個代理程式時，輸出會包含每個代理程式的工作階段儲存區。

## 用量與配額

- `--usage` 會以 `X% left` 印出標準化的供應商用量視窗。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，
  因此 OpenClaw 會在顯示前將其反轉；以計數為基礎的欄位存在時會優先使用。
  `model_remains` 回應會偏好聊天模型項目，在需要時從時間戳推導視窗標籤，
  並在方案標籤中包含模型名稱。
- 模型定價重新整理失敗會顯示為選用的定價警告。
  這並不代表閘道或頻道不健康。

## 概覽與更新狀態

- 概覽會在可用時包含閘道 + 節點主機服務的安裝/執行階段狀態，
  以及精簡的閘道程序執行時間與主機系統執行時間。
- 概覽會包含更新頻道 + git SHA（適用於原始碼簽出）。
- 更新資訊會顯示在概覽中；如果有可用更新，狀態會
  印出執行 `openclaw update` 的提示（請參閱[更新](/zh-TW/install/updating)）。

## 密鑰

- 唯讀狀態介面（`status`、`status --json`、`status --all`）
  會在可能時解析其目標設定路徑支援的 SecretRef。
- 如果設定了支援的頻道 SecretRef，但在
  目前命令路徑中不可用，狀態會保持唯讀並回報降級輸出，
  而不是當機。人類可讀輸出會顯示警告，例如「configured token
  unavailable in this command path」，JSON 輸出則包含
  `secretDiagnostics`。
- 當命令本機 SecretRef 解析成功時，狀態會偏好
  已解析的快照，並從最終輸出中清除暫時性的「secret unavailable」頻道
  標記。
- `status --all` 包含一列密鑰概覽，以及一個診斷區段，
  會摘要密鑰診斷（為可讀性而截斷），且不會
  停止產生報告。

## 記憶

`status --json --all` 會從由 `plugins.slots.memory` 選取的作用中記憶外掛
執行階段回報記憶詳細資料。自訂記憶外掛可以讓
內建的 `agents.defaults.memorySearch.enabled` 保持停用，並仍回報
自己的檔案、區塊、向量與 FTS 狀態。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
