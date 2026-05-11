---
read_when:
    - 您想快速診斷通道健康狀態 + 最近的工作階段收件者
    - 您想要可貼上的「全部」狀態以供除錯
summary: '`openclaw status` 的 CLI 參考（診斷、探測、使用情況快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

通道 + 工作階段的診斷。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事項：

- `--deep` 會執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 一般的 `openclaw status` 會停留在快速唯讀路徑，並在略過記憶體檢查時將記憶體標記為 `not checked`，而不是不可用。繁重的安全稽核、Plugin 相容性和記憶體向量探測則留給 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 會回報由 `plugins.slots.memory` 所選 active memory Plugin 執行階段的記憶體詳細資訊。自訂記憶體 Plugin 可以讓內建的 `agents.defaults.memorySearch.enabled` 保持停用，同時仍回報自己的檔案、區塊、向量和 FTS 狀態。
- `--usage` 會以 `X% left` 的格式列印標準化的提供者使用量視窗。
- 工作階段狀態輸出會將 `Execution:` 與 `Runtime:` 分開。`Execution` 是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你工作階段是使用 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 後端，或是 ACP 後端，例如 `codex (acp/acpx)`。請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)，了解提供者、模型與執行階段的差異。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，因此 OpenClaw 會在顯示前將其反轉；若存在以計數為基礎的欄位，則優先使用。`model_remains` 回應會優先採用聊天模型項目，必要時從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- 當目前工作階段快照資訊稀疏時，`/status` 可以從最近的逐字稿使用量記錄回填權杖與快取計數器。現有的非零即時值仍會優先於逐字稿備援值。
- `/status` 包含精簡的 Gateway 程序運行時間與主機系統運行時間。
- 當即時工作階段項目缺少作用中執行階段模型標籤時，逐字稿備援也可以復原該標籤。如果該逐字稿模型與所選模型不同，status 會根據復原的執行階段模型，而不是所選模型，解析內容視窗。
- 對於提示大小計算，當工作階段中繼資料缺失或較小時，逐字稿備援會優先使用較大的提示導向總量，因此自訂提供者工作階段不會折疊成 `0` 權杖顯示。
- 當設定多個代理程式時，輸出會包含每個代理程式的工作階段儲存區。
- 可用時，總覽會包含 Gateway + node 主機服務的安裝與執行階段狀態。
- 總覽會包含更新通道 + git SHA（適用於原始碼 checkout）。
- 更新資訊會顯示在總覽中；如果有可用更新，status 會列印提示，建議執行 `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。
- 模型定價重新整理失敗會顯示為選用的定價警告。這並不表示 Gateway 或通道不健康。
- 唯讀狀態介面（`status`、`status --json`、`status --all`）會在可能時解析其目標設定路徑支援的 SecretRefs。
- 如果已設定支援的通道 SecretRef，但在目前命令路徑中無法使用，status 會保持唯讀並回報降級輸出，而不是崩潰。人類可讀輸出會顯示警告，例如 "configured token unavailable in this command path"，JSON 輸出則包含 `secretDiagnostics`。
- 當命令本機 SecretRef 解析成功時，status 會優先使用解析後的快照，並從最終輸出中清除暫時性的「secret unavailable」通道標記。
- `status --all` 包含 Secrets 總覽列，以及彙整 secret diagnostics 的診斷區段（為了可讀性會截斷），且不會停止產生報告。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
