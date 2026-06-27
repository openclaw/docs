---
read_when:
    - 你想快速診斷頻道健康狀態和近期工作階段收件者
    - 你想要可貼上的「全部」狀態以用於偵錯
summary: '`openclaw status` 的命令列介面參考（診斷、探測、使用情形快照）'
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T19:08:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

通道與工作階段的診斷。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事項：

- `--deep` 會執行即時探測（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 一般的 `openclaw status` 會停留在快速唯讀路徑，並在略過記憶檢查時將記憶標記為 `not checked`，而不是不可用。繁重的安全稽核、外掛相容性與記憶向量探測會留給 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 與 `openclaw memory status --deep`。
- `status --json --all` 會回報由 `plugins.slots.memory` 選取的主動記憶外掛執行階段所提供的記憶詳細資料。自訂記憶外掛可以讓內建的 `agents.defaults.memorySearch.enabled` 保持停用，仍然回報自己的檔案、區塊、向量與 FTS 狀態。
- `--usage` 會以 `X% left` 格式列印正規化的供應商用量視窗。
- 工作階段狀態輸出會將 `Execution:` 與 `Runtime:` 分開。`Execution` 是沙盒路徑（`direct`、`docker/*`），而 `Runtime` 會告訴你工作階段使用的是 `OpenClaw Default`、`OpenAI Codex`、命令列介面後端，或 ACP 後端，例如 `codex (acp/acpx)`。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)，了解供應商/模型/執行階段的差異。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位代表剩餘配額，因此 OpenClaw 會在顯示前將它們反轉；若有基於計數的欄位，則優先採用。`model_remains` 回應會優先使用聊天模型項目，必要時從時間戳記推導視窗標籤，並在方案標籤中包含模型名稱。
- 當目前工作階段快照稀疏時，`/status` 可以從最近的逐字稿用量記錄回填 token 與快取計數器。現有的非零即時值仍會優先於逐字稿備援值。
- `/status` 包含精簡的閘道程序運作時間與主機系統運作時間。
- 當即時工作階段項目缺少作用中執行階段模型標籤時，逐字稿備援也可以復原該標籤。如果該逐字稿模型與所選模型不同，status 會根據復原的執行階段模型，而不是所選模型，解析內容視窗。
- 當工作階段固定到與已設定主要模型不同的模型時，status 會列印兩個值、原因（`session override`）以及明確提示（`/model default`）。已設定的主要模型會套用於新的或未固定的工作階段；現有固定工作階段會保留其工作階段選取，直到清除為止。
- 在提示大小計算方面，當工作階段中繼資料缺失或較小時，逐字稿備援會偏好較大的提示導向總量，因此自訂供應商工作階段不會收斂成 `0` token 顯示。
- 當設定多個代理時，輸出會包含每個代理的工作階段存放區。
- 總覽會在可用時包含閘道 + 節點主機服務的安裝/執行階段狀態。
- 總覽會包含更新通道 + git SHA（適用於來源 checkout）。
- 更新資訊會顯示在總覽中；如果有可用更新，status 會列印提示來執行 `openclaw update`（請參閱[更新](/zh-TW/install/updating)）。
- 模型定價重新整理失敗會顯示為選用的定價警告。這並不表示閘道或通道不健康。
- 唯讀狀態介面（`status`、`status --json`、`status --all`）會盡可能為其目標設定路徑解析支援的 SecretRefs。
- 如果已設定支援的通道 SecretRef，但在目前命令路徑中不可用，status 會保持唯讀並回報降級輸出，而不是當機。人類可讀輸出會顯示警告，例如「此命令路徑中無法使用已設定的權杖」，JSON 輸出則包含 `secretDiagnostics`。
- 當命令本機的 SecretRef 解析成功時，status 會偏好已解析的快照，並從最終輸出中清除暫時性的「secret unavailable」通道標記。
- `status --all` 包含 Secrets 總覽列，以及一個診斷區段，用於摘要 secret 診斷（為了可讀性會截斷），且不會停止報告產生。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/gateway/doctor)
