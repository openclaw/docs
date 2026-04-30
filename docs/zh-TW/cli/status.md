---
read_when:
    - 你想要快速診斷通道健康狀態 + 近期工作階段收件者
    - 你想要用於偵錯且可貼上的「全部」狀態
summary: '`openclaw status` 的 CLI 參考（診斷、探測、使用情況快照）'
title: 狀態
x-i18n:
    generated_at: "2026-04-30T02:56:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

通道 + 工作階段的診斷。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事項：

- `--deep` 會執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 一般的 `openclaw status` 會停留在快速唯讀路徑，並在略過記憶檢查時將記憶標記為 `not checked`，而不是不可用。繁重的安全稽核、Plugin 相容性與記憶向量探測會留給 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 與 `openclaw memory status --deep`。
- `status --json --all` 會回報由 `plugins.slots.memory` 選取的作用中記憶 Plugin 執行階段的記憶詳細資料。自訂記憶 Plugin 可以讓內建的 `agents.defaults.memorySearch.enabled` 維持停用，仍能回報自己的檔案、區塊、向量與 FTS 狀態。
- `--usage` 會將正規化的提供者使用量視窗列印為 `X% left`。
- 工作階段狀態輸出會將 `Execution:` 與 `Runtime:` 分開。`Execution` 是沙箱路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你工作階段是否使用 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 後端，或 ACP 後端，例如 `codex (acp/acpx)`。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)，了解提供者/模型/執行階段的區別。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，因此 OpenClaw 會在顯示前將其反轉；若存在以計數為基礎的欄位，則優先使用。`model_remains` 回應會優先使用聊天模型項目，在需要時從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- 當目前的工作階段快照稀疏時，`/status` 可以從最近的轉錄使用量日誌回填 token 與快取計數器。既有非零即時值仍會優先於轉錄後援值。
- 當即時工作階段項目缺少作用中執行階段模型標籤時，轉錄後援也可以復原該標籤。如果該轉錄模型與所選模型不同，狀態會依據復原的執行階段模型解析上下文視窗，而不是使用所選模型。
- 對於提示大小計算，當工作階段中繼資料缺失或較小時，轉錄後援會優先採用較大的提示導向總量，因此自訂提供者工作階段不會折疊成 `0` token 顯示。
- 當設定多個代理時，輸出會包含每個代理的工作階段儲存區。
- 可用時，概覽會包含 Gateway + node 主機服務安裝/執行階段狀態。
- 概覽會包含更新通道 + git SHA（適用於原始碼 checkout）。
- 更新資訊會顯示在概覽中；如果有可用更新，狀態會列印提示以執行 `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。
- 唯讀狀態介面（`status`、`status --json`、`status --all`）會在可能時解析其目標設定路徑支援的 SecretRefs。
- 如果已設定受支援的通道 SecretRef，但在目前命令路徑中不可用，狀態會保持唯讀並回報降級輸出，而不是當機。人類可讀輸出會顯示警告，例如「configured token unavailable in this command path」，JSON 輸出則包含 `secretDiagnostics`。
- 當命令本機 SecretRef 解析成功時，狀態會優先使用已解析的快照，並從最終輸出清除暫時性的「secret unavailable」通道標記。
- `status --all` 包含 Secrets 概覽列，以及摘要 secret 診斷的診斷區段（為了可讀性會截斷），且不會停止報告產生。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
