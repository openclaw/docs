---
read_when:
    - 您想將 QMD 設定為記憶體後端
    - 你想要重新排序或額外索引路徑等進階記憶功能
summary: 本機優先的搜尋輔助服務，支援 BM25、向量、重新排序與查詢擴展
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-07-11T21:18:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本機優先的搜尋輔助程序，與 OpenClaw
並行執行。它將 BM25、向量搜尋和重新排序整合在單一執行檔中，並且能為工作區
記憶檔案以外的內容建立索引。

## 相較於內建引擎新增的功能

- **重新排序與查詢擴展**，提高召回率。
- **為額外目錄建立索引**——專案文件、團隊筆記，以及磁碟上的任何內容。
- **為工作階段逐字稿建立索引**——回顧先前的對話。
- **完全在本機執行**——使用官方 llama.cpp 提供者外掛執行，並自動下載
  GGUF 模型。
- **自動備援**——如果 QMD 無法使用，OpenClaw 會無縫切換至內建引擎。

## 開始使用

### 先決條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 可載入擴充功能的 SQLite 組建版本（在 macOS 上執行 `brew install sqlite`）。
- QMD 必須位於閘道的 `PATH` 中。
- macOS 與 Linux 可直接使用。Windows 建議透過 WSL2 使用。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在 `~/.openclaw/agents/<agentId>/qmd/` 下建立獨立完整的 QMD
主目錄，並自動管理輔助程序的生命週期——集合、更新和嵌入執行都會由系統代為
處理。它會優先使用目前的 QMD 集合與 MCP 查詢格式，但會在需要時改用替代的
集合模式旗標和較舊的 MCP 工具名稱。若仍存在同名的舊版 QMD 集合，啟動時的
協調程序也會依照其標準模式重新建立過時的受管理集合。

## 輔助程序的運作方式

- OpenClaw 會根據工作區記憶檔案及任何已設定的 `memory.qmd.paths` 建立集合，
  接著在 QMD 管理器開啟時執行 `qmd update`，之後再定期執行
  （`memory.qmd.update.interval`，預設為 `5m`）。重新整理會透過 QMD
  子程序執行，而不是在程序內掃描檔案系統。語意搜尋模式也會執行 `qmd embed`
  （`memory.qmd.update.embedInterval`，預設為 `60m`）。
- 預設工作區集合會追蹤 `MEMORY.md` 以及 `memory/` 目錄樹。小寫的
  `memory.md` 不會被索引為根記憶檔案。
- QMD 自身的掃描器會忽略隱藏路徑，以及常見的依賴項與組建目錄，例如
  `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和 `build`。閘道啟動時
  預設不會初始化 QMD（`memory.qmd.update.startup` 預設為 `off`），因此冷啟動
  不會在首次使用記憶功能前匯入記憶執行階段或建立長期運作的監看器。
- 若仍要在閘道啟動時初始化 QMD，請將 `memory.qmd.update.startup` 設為
  `idle` 或 `immediate`。`memory.qmd.update.onBoot` 預設為 `true`，會在啟動時
  執行初始重新整理；將其設為 `false` 可略過該次立即重新整理（只要設定了更新
  或嵌入間隔，長期運作的管理器仍會開啟，因此 QMD 仍會管理其固定的監看器與
  計時器）。
- 搜尋會使用已設定的 `searchMode`（預設為 `search`；也支援 `vsearch` 和
  `query`）。`search` 僅使用 BM25，因此 OpenClaw 在此模式下會略過語意向量
  就緒探測及嵌入維護。如果某個模式失敗，OpenClaw 會改用 `qmd query` 重試。
- 當 `searchMode` 為 `query` 時，將 `memory.qmd.rerank` 設為 `false`，即可在
  不使用重新排序器的情況下採用 QMD 的混合查詢路徑（需要 QMD 2.1 或更新版本）。
  OpenClaw 會向直接 QMD 命令列介面路徑傳遞 `--no-rerank`，並向 QMD 的 MCP
  查詢工具傳遞 `rerank: false`。
- 若 QMD 版本宣告支援多集合篩選器，OpenClaw 會將來源相同的集合分組，在單次
  QMD 搜尋呼叫中處理。較舊的 QMD 版本則會保留相容的逐集合備援方式。
- 如果 QMD 完全失敗，OpenClaw 會切換至內建 SQLite 引擎。開啟失敗後，重複的
  聊天回合嘗試會短暫退避，避免缺少執行檔或損壞的輔助程序依賴項造成重試風暴；
  `openclaw memory status` 和單次命令列介面探測仍會直接重新檢查 QMD。

<Info>
第一次搜尋可能會很慢——QMD 會在首次執行 `qmd query` 時自動下載用於重新排序
和查詢擴展的 GGUF 模型（約 2 GB）。
</Info>

## 搜尋效能與相容性

OpenClaw 會維持 QMD 搜尋路徑同時與目前及較舊的 QMD 安裝版本相容。

啟動時，OpenClaw 會針對每個管理器檢查一次已安裝 QMD 的說明文字。如果執行檔
宣告支援多個集合篩選器，OpenClaw 會使用單一命令搜尋所有來源相同的集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這可避免為每個持久記憶集合啟動一個 QMD 子程序。工作階段逐字稿集合會保留在
自己的來源群組中，因此混合 `memory` 與 `sessions` 的搜尋仍會提供來自兩種
來源的結果給多樣化處理程序。

較舊的 QMD 組建版本只接受一個集合篩選器。當 OpenClaw 偵測到這類組建版本時，
會保留相容路徑，分別搜尋各個集合，再合併結果並移除重複項目。

若要手動檢查已安裝版本的契約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明會提及以一個或多個集合為目標。較舊的說明通常只會描述單一
集合。

## 模型覆寫

QMD 模型環境變數會從閘道程序原樣傳遞，因此你可以全域調整 QMD，而不必新增
OpenClaw 設定：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，讓索引與新的向量空間相符。

## 為額外路徑建立索引

將 QMD 指向其他目錄，使其中內容可供搜尋：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

額外路徑中的片段會在搜尋結果中顯示為
`qmd/<collection>/<relative-path>`。`memory_get` 能辨識此前綴，並從正確的
集合根目錄讀取內容。

## 為工作階段逐字稿建立索引

啟用工作階段索引，即可回顧先前的對話。QMD 同時需要通用的 `memorySearch`
工作階段來源和 QMD 逐字稿匯出器：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

逐字稿會以經過清理的使用者／助理對話回合形式，匯出至
`~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD 集合。僅設定
`memorySearch.experimental.sessionMemory` 不會將逐字稿匯出至 QMD。

工作階段命中結果仍會依
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions) 篩選。預設的
`tree` 可見性不會公開同一代理程式中無關的工作階段。如果需要從另一個私訊工作
階段回顧由閘道分派的工作階段，請明確設定 `tools.sessions.visibility: "agent"`。

## 搜尋範圍

預設情況下，QMD 搜尋結果只會在直接工作階段中顯示（不包含群組或頻道聊天）。
設定 `memory.qmd.scope` 可變更此行為：

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

以上片段就是實際的預設規則。當範圍規則拒絕搜尋時，OpenClaw 會記錄警告，
其中包含推導出的頻道和聊天類型，讓空白結果更容易除錯。

## 引用

當 `memory.citations` 為 `auto` 或 `on` 時，搜尋片段會附加
`Source: <path>#L<line>`（或 `#L<start>-L<end>`）頁尾。在 `auto` 模式下，
只有直接聊天工作階段會加入此頁尾。將 `memory.citations = "off"` 設為關閉，
即可省略頁尾，同時仍在內部將路徑傳遞給代理程式。

## 適用情境

在下列情況下選擇 QMD：

- 需要透過重新排序取得更高品質的結果。
- 需要搜尋工作區之外的專案文件或筆記。
- 需要回顧過去工作階段的對話。
- 需要不使用 API 金鑰、完全在本機執行的搜尋。

若需求較簡單，[內建引擎](/zh-TW/concepts/memory-builtin) 無需額外依賴項也能良好運作。

## 疑難排解

**找不到 QMD？** 請確認執行檔位於閘道的 `PATH` 中。如果 OpenClaw 以服務形式
執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 可在你的殼層中正常執行，但 OpenClaw 仍回報
`spawn qmd ENOENT`，閘道程序使用的 `PATH` 很可能與互動式殼層不同。請明確
指定執行檔：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

在安裝 QMD 的環境中執行 `command -v qmd`，然後使用
`openclaw memory status --deep` 重新檢查。

**第一次搜尋非常慢？** QMD 會在首次使用時下載 GGUF 模型。請使用與 OpenClaw
相同的 XDG 目錄執行 `qmd query "test"`，預先暖機。

**搜尋期間出現許多 QMD 子程序？** 如果可能，請更新 QMD。只有在已安裝的 QMD
宣告支援多個 `-c` 篩選器時，OpenClaw 才會以單一程序執行來源相同的多集合
搜尋；否則為確保正確性，會保留較舊的逐集合備援方式。

**僅使用 BM25 的 QMD 仍嘗試組建 llama.cpp？** 將
`memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為僅使用詞彙搜尋，
略過 QMD 向量狀態探測與嵌入維護，並將語意就緒檢查留給 `vsearch` 或 `query`
設定。

**搜尋逾時？** 增加 `memory.qmd.limits.timeoutMs`（預設：4000ms）。對於較慢的
硬體，請設為更高的值，例如 `120000`。

**群組或頻道聊天中沒有結果？** 這是預設 `memory.qmd.scope` 的預期行為，因為
它只允許直接工作階段。如果希望在群組或頻道中顯示 QMD 結果，請為 `group` 或
`channel` 聊天類型新增 `allow` 規則。

**根記憶搜尋突然變得過於寬泛？** 請重新啟動閘道，或等待下一次啟動協調。
當 OpenClaw 偵測到同名衝突時，會依照標準的 `MEMORY.md` 和 `memory/` 模式
重新建立過時的受管理集合。

**工作區可見的暫存儲存庫造成 `ENAMETOOLONG` 或索引損壞？**
QMD 遍歷會遵循其底層 QMD 掃描器的規則，而不是 OpenClaw 的內建符號連結規則。
在 QMD 提供可安全處理循環的遍歷或明確排除控制前，請將暫存的單一儲存庫簽出
放在 `.tmp/` 等隱藏目錄中，或置於已建立索引的 QMD 根目錄之外。

## 設定

如需完整的設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、範圍規則及所有
其他選項，請參閱[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關內容

- [記憶概觀](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)
