---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想嘗試預覽版執行階段功能，而不將它們與一般預設值混淆
    - 你想要有一個地方可以找到目前已記錄的實驗性旗標
summary: OpenClaw 中實驗性旗標的意義，以及目前有哪些已記錄的旗標
title: 實驗性功能
x-i18n:
    generated_at: "2026-06-27T19:10:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw 中的實驗性功能是**選擇加入的預覽介面**。它們位於明確旗標之後，因為在值得成為穩定預設值或長期公開合約之前，仍需要真實世界的使用驗證。

請將它們與一般設定區別對待：

- 除非相關文件指示你嘗試，否則保持**預設關閉**。
- 預期**形狀與行為會比穩定設定更快變更**。
- 當穩定路徑已存在時，優先使用穩定路徑。
- 如果你要大規模推出 OpenClaw，請先在較小的環境中測試實驗性旗標，再將它們納入共享基準。

## 目前已記錄的旗標

| 介面                     | Key                                                                                        | 使用時機                                                                                                                          | 更多                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行階段         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 較小或較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                                        | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 索引先前的工作階段逐字稿，並接受額外的儲存與索引成本                                                       | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更新版本以 OpenClaw 沙箱支援的 exec-server 為目標，而不是停用 Code Mode                    | [Codex harness 參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你希望在相容的執行階段與使用者介面中公開結構化的 `update_plan` 工具，用於追蹤多步驟工作                                           | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                      |

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 是較弱本機模型設定的減壓閥。啟用後，OpenClaw 會在每一輪中從代理的工具介面移除三個預設工具：`browser`、`cron` 和 `message`。當 `tools.toolSearch` 未明確設定時，它也會讓該執行預設使用結構化 Tool Search 控制項，因此較大的外掛、MCP 或用戶端工具目錄會留在 `tool_search`、`tool_describe` 和 `tool_call` 之後，而不是直接傾倒進提示中。需要直接 `message` 傳遞的執行會保持該工具為直接工具，而不會啟用精簡模式的 Tool Search 預設值。使用 `agents.list[].experimental.localModelLean` 可針對單一已設定代理啟用或停用相同行為。

### 為什麼是這三個工具

這三個工具在預設 OpenClaw 執行階段中有最大的描述與最多的參數形狀。對於小上下文或較嚴格的 OpenAI 相容後端而言，這代表以下差異：

- 工具結構描述能乾淨地放入提示中，而不是擠掉對話歷史。
- 模型能選對工具，而不是因為有太多外觀相似的結構描述而輸出格式錯誤的工具呼叫。
- Chat Completions 轉接器能維持在伺服器的結構化輸出限制內，而不是因工具呼叫承載大小觸發 400。

移除它們不會悄悄重新接線 OpenClaw，它只會讓直接工具清單變短。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、網頁搜尋/擷取（設定時）、記憶，以及工作階段/代理工具。除非你明確設定 `tools.toolSearch: false`，否則額外目錄仍可透過 Tool Search 呼叫。

### 何時啟用

當你已經證明模型可以與閘道通訊，但完整代理輪次行為異常時，請啟用精簡模式。典型的訊號鏈如下：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理輪次因格式錯誤的工具呼叫、過大的提示，或模型忽略工具而失敗。
3. 切換 `localModelLean: true` 後故障消失。

### 何時保持關閉

如果你的後端能乾淨處理完整的預設執行階段，請保持關閉。精簡模式是一種變通方式，不是預設值。它存在的原因是某些本機堆疊需要較小的工具介面才能正常運作；託管模型與資源充足的本機設備則不需要。

精簡模式也不會取代 `tools.profile`、`tools.allow`/`tools.deny`，或模型的 `compat.supportsTools: false` 逃生出口。如果你需要為特定代理提供永久較窄的工具介面，請優先使用那些穩定旋鈕，而不是實驗性旗標。

如果你已經全域調整 Tool Search，OpenClaw 會保留該操作員設定。設定 `tools.toolSearch: false` 可選擇退出精簡模式的 Tool Search 預設值。

### 啟用

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

僅針對單一代理：

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

變更旗標後重新啟動閘道，然後用以下指令確認修剪後的工具清單：

```bash
openclaw status --deep
```

深度狀態輸出會列出作用中的代理工具；啟用精簡模式時，除非目前的傳遞模式強制直接 `message` 回覆，否則 `browser`、`cron` 和 `message` 應不存在。

## 實驗性不代表隱藏

如果某項功能是實驗性的，OpenClaw 應該在文件與設定路徑本身中明確說明。它**不應該**把預覽行為偷塞進看起來穩定的預設旋鈕，然後假裝這很正常。設定介面就是這樣變得混亂的。

## 相關

- [功能](/zh-TW/concepts/features)
- [發行通道](/zh-TW/install/development-channels)
