---
read_when:
    - 你想快速診斷頻道健康狀態 + 最近的工作階段接收者
    - 你想要可貼上的「all」狀態以便偵錯
summary: '`openclaw status` 的 CLI 參考（診斷、探測、使用情況快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:05:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
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

注意事項：

- `--deep` 會執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 一般的 `openclaw status` 會停留在快速唯讀路徑，並在略過記憶體檢查時將記憶體標示為 `not checked`，而不是不可用。繁重的安全稽核、Plugin 相容性與記憶體向量探測會留給 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 與 `openclaw memory status --deep`。
- `status --json --all` 會從 `plugins.slots.memory` 選取的作用中記憶體 Plugin 執行階段回報記憶體詳細資料。自訂記憶體 Plugin 可以停用內建的 `agents.defaults.memorySearch.enabled`，仍然回報自己的檔案、區塊、向量與 FTS 狀態。
- `--usage` 會以 `X% left` 輸出標準化的供應商用量視窗。
- 工作階段狀態輸出會將 `Execution:` 與 `Runtime:` 分開。`Execution` 是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你工作階段使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 後端，或 ACP 後端，例如 `codex (acp/acpx)`。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)，了解供應商、模型與執行階段的差異。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，因此 OpenClaw 會在顯示前將其反轉；存在以計數為基礎的欄位時會優先使用。`model_remains` 回應會優先使用聊天模型項目，在需要時從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- 當目前工作階段快照稀疏時，`/status` 可以從最近的逐字稿用量記錄回填權杖與快取計數器。既有的非零即時值仍會優先於逐字稿備援值。
- `/status` 包含精簡的 Gateway 程序運行時間與主機系統運行時間。
- 當即時工作階段項目缺少作用中執行階段模型標籤時，逐字稿備援也可以還原該標籤。如果該逐字稿模型與所選模型不同，狀態會改為根據還原出的執行階段模型解析脈絡視窗，而不是根據所選模型。
- 對於提示大小計算，當工作階段中繼資料缺失或較小時，逐字稿備援會優先使用較大的提示導向總量，因此自訂供應商工作階段不會縮減成 `0` 權杖顯示。
- 設定多個代理時，輸出會包含每個代理的工作階段儲存區。
- 可用時，總覽會包含 Gateway + Node 主機服務的安裝與執行階段狀態。
- 總覽會包含更新通道 + git SHA（適用於原始碼簽出）。
- 更新資訊會顯示在總覽中；如果有可用更新，狀態會輸出提示，建議執行 `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。
- 唯讀狀態介面（`status`、`status --json`、`status --all`）會在可能時解析目標設定路徑支援的 SecretRefs。
- 如果已設定支援的頻道 SecretRef，但在目前命令路徑中不可用，狀態會維持唯讀並回報降級輸出，而不是當機。人工輸出會顯示警告，例如「此命令路徑無法使用已設定的權杖」，JSON 輸出則包含 `secretDiagnostics`。
- 當命令本機 SecretRef 解析成功時，狀態會優先使用已解析的快照，並從最終輸出中清除暫時性的「secret unavailable」頻道標記。
- `status --all` 包含 Secrets 總覽列與診斷區段，會彙總密鑰診斷（為了可讀性會截斷），且不會停止報告產生。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
