---
read_when:
    - 你想快速診斷通道健康狀態與最近的工作階段收件者
    - 你想要一份可貼上的「all」狀態以便偵錯
summary: '`openclaw status` 的 CLI 參考（診斷、探測、使用情況快照）'
title: 狀態
x-i18n:
    generated_at: "2026-05-05T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

通道與工作階段的診斷。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事項：

- `--deep` 會執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 一般的 `openclaw status` 會停留在快速只讀路徑，並在略過記憶體檢查時將記憶體標示為 `not checked`，而不是 unavailable。繁重的安全稽核、plugin 相容性與記憶體向量探測會留給 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 會回報由 `plugins.slots.memory` 選取的作用中記憶體 plugin 執行階段所提供的記憶體詳細資料。自訂記憶體 plugins 可以讓內建的 `agents.defaults.memorySearch.enabled` 維持停用，同時仍回報自己的檔案、區塊、向量與 FTS 狀態。
- `--usage` 會將標準化的供應商用量視窗列印為 `X% left`。
- 工作階段狀態輸出會將 `Execution:` 與 `Runtime:` 分開。`Execution` 是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你該工作階段使用的是 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 後端，或 ACP 後端，例如 `codex (acp/acpx)`。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)，了解供應商/模型/執行階段的區別。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，因此 OpenClaw 會先反轉再顯示；存在以次數為基礎的欄位時會優先使用。`model_remains` 回應會優先使用聊天模型項目，必要時從時間戳記推導視窗標籤，並在方案標籤中包含模型名稱。
- 當目前工作階段快照很稀疏時，`/status` 可以從最近的逐字稿用量記錄回填 token 與快取計數器。現有的非零即時值仍會優先於逐字稿備援值。
- `/status` 會包含精簡的 Gateway 程序正常執行時間與主機系統正常執行時間。
- 當即時工作階段項目缺少作用中執行階段模型標籤時，逐字稿備援也可以復原它。如果該逐字稿模型不同於選取的模型，status 會依據復原的執行階段模型解析內容視窗，而不是依據選取的模型。
- 對於提示大小計算，當工作階段中繼資料缺失或較小時，逐字稿備援會優先使用較大的提示導向總量，因此自訂供應商工作階段不會收斂成 `0` token 顯示。
- 當設定多個代理時，輸出會包含每個代理的工作階段儲存區。
- 概覽會在可用時包含 Gateway + Node 主機服務安裝/執行階段狀態。
- 概覽會包含更新通道 + git SHA（針對原始碼 checkout）。
- 更新資訊會顯示在概覽中；如果有可用更新，status 會列印提示，請執行 `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。
- 只讀狀態介面（`status`、`status --json`、`status --all`）會在可能時解析其目標設定路徑支援的 SecretRefs。
- 如果已設定支援通道的 SecretRef，但在目前命令路徑中不可用，status 會維持只讀並回報降級輸出，而不是當機。人工可讀輸出會顯示警告，例如「configured token unavailable in this command path」，JSON 輸出則包含 `secretDiagnostics`。
- 當命令本機 SecretRef 解析成功時，status 會優先使用已解析的快照，並從最終輸出中清除暫時性的「secret unavailable」通道標記。
- `status --all` 會包含 Secrets 概覽列與診斷區段，該區段會摘要密鑰診斷（為了可讀性會截斷），且不會停止報告產生。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
