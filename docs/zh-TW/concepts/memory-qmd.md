---
read_when:
    - 你想要將 QMD 設定為記憶後端
    - 你想要重新排序或額外索引路徑等進階記憶功能
summary: 本機優先的搜尋輔助服務，具備 BM25、向量、重新排序與查詢擴展功能
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-07-19T13:41:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e41e8c0e3b0a0b365fdfc5f00d5f8dd81e90d4cf45c98ea203a64fc9b7d921f0
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本機優先的搜尋附屬服務，與
OpenClaw 並行執行。它在單一二進位檔中結合 BM25、向量搜尋與重新排序，
並且可以為工作區記憶檔案以外的內容建立索引。

## 相較於內建引擎新增的功能

- **重新排序與查詢擴展**，提供更高的召回率。
- **為額外目錄建立索引**——專案文件、團隊筆記，以及磁碟上的任何內容。
- **為工作階段逐字稿建立索引**——回想先前的對話。
- **完全在本機執行**——使用官方 llama.cpp 供應商外掛執行，並
  自動下載 GGUF 模型。
- **自動後援**——若 QMD 無法使用，OpenClaw 會無縫切換回
  內建引擎。

## 開始使用

### 必要條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允許擴充功能的 SQLite 組建（macOS 上為 `brew install sqlite`）。
- QMD 必須位於閘道的 `PATH` 中。
- macOS 與 Linux 可直接使用。Windows 最適合透過 WSL2 使用。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在
`~/.openclaw/agents/<agentId>/qmd/` 下建立自包含的 QMD 主目錄，並自動管理附屬服務的生命週期
——集合、更新與嵌入執行都會自動處理。
它優先使用目前的 QMD 集合與 MCP 查詢格式，但在必要時會切換回
替代的集合模式旗標與較舊的 MCP 工具名稱。
啟動協調程序也會在仍存在同名的舊版 QMD 集合時，
將過時的受管理集合重新建立為其標準模式。

## 附屬服務的運作方式

- OpenClaw 會從工作區記憶檔案及任何已設定的
  `memory.qmd.paths` 建立集合，接著在 QMD 管理器開啟時執行 `qmd update`，
  並在之後定期執行（`memory.qmd.update.interval`，預設值為
  `5m`）。重新整理會透過 QMD 子程序執行，而非在程序內
  掃描檔案系統。語意搜尋模式也會執行 `qmd embed`
  （`memory.qmd.update.embedInterval`，預設值為 `60m`）。
- QMD 會繼續管理每個代理程式 QMD 主目錄下的 `index.sqlite`、YAML 集合設定與模型
  下載；這些是外部工具成品，而非 OpenClaw 狀態資料表。OpenClaw 擁有的協調資料只存在於 SQLite：
  一個共用租約限制跨代理程式的嵌入工作，而每個
  代理程式資料庫中的一個租約會序列化該代理程式的集合、更新與嵌入寫入。
  執行階段不再建立 QMD 檔案鎖定附屬檔案。`openclaw doctor --fix`
  只會在確認舊程序擁有者已失效後，移除已淘汰的附屬檔案。
  升級採用完全切換方式：使用新版本前，停止並重新啟動共用該狀態目錄的所有
  OpenClaw 程序。不支援新舊 QMD
  寫入程式混用；執行階段刻意不會同時鎖定已淘汰的
  附屬檔案。
- 預設工作區集合會追蹤 `MEMORY.md` 與 `memory/`
  目錄樹。小寫的 `memory.md` 不會作為根記憶檔案建立索引。
- QMD 自身的掃描器會忽略隱藏路徑，以及常見的相依套件／組建
  目錄，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 與
  `build`。閘道啟動時預設不會初始化 QMD
  （`memory.qmd.update.startup` 預設為 `off`），因此冷啟動時會避免
  在首次使用記憶功能前匯入記憶執行階段或建立長期執行的監看器。
- 若仍要在閘道啟動時初始化 QMD，請將 `memory.qmd.update.startup` 設為 `idle` 或 `immediate`。
  `memory.qmd.update.onBoot` 預設為 `true`，並會在啟動時
  執行初始重新整理；將其設為 `false` 可略過該次
  立即重新整理（設定更新或嵌入間隔時，長期執行的管理器仍會開啟，
  因此 QMD 會繼續管理其一般監看器／計時器）。
- 搜尋會使用已設定的 `searchMode`（預設值：`search`；也支援
  `vsearch` 與 `query`）。`search` 僅使用 BM25，因此在該模式下，OpenClaw 會略過語意
  向量就緒探測與嵌入維護。若某個模式失敗，OpenClaw 會改用 `qmd query` 重試。
- 當 `searchMode` 為 `query` 時，請將 `memory.qmd.rerank` 設為 `false`，以使用
  QMD 不含重新排序器的混合查詢路徑（需要 QMD 2.1 或更新版本）。
  OpenClaw 會將 `--no-rerank` 傳遞至直接 QMD 命令列介面路徑，並將
  `rerank: false` 傳遞至 QMD 的 MCP 查詢工具。
- 對於宣告支援多集合篩選器的 QMD 版本，OpenClaw 會將
  來源相同的集合分組至一次 QMD 搜尋呼叫中。較舊的 QMD 版本
  會保留相容的逐集合後援機制。
- 若 QMD 完全失敗，OpenClaw 會切換回內建 SQLite 引擎。
  開啟失敗後，重複的聊天回合嘗試會短暫退避，以避免
  二進位檔缺失或附屬服務相依套件損壞造成重試風暴；
  `openclaw memory status` 與單次命令列介面探測仍會直接重新檢查 QMD。

<Info>
第一次搜尋可能較慢——QMD 會在首次執行 `qmd query` 時自動下載用於
重新排序與查詢擴展的 GGUF 模型（約 2 GB）。
</Info>

## 搜尋效能與相容性

OpenClaw 會讓 QMD 搜尋路徑同時相容於目前及較舊的 QMD
安裝版本。

啟動時，OpenClaw 會為每個管理器檢查一次已安裝 QMD 的說明文字。若
二進位檔宣告支援多個集合篩選器，OpenClaw
會以單一命令搜尋所有來源相同的集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這可避免每個持久記憶集合都啟動一個 QMD 子程序。
工作階段逐字稿集合會保留在自己的來源群組中，因此混合
`memory` + `sessions` 搜尋時，仍會將兩種來源的結果提供給
結果多樣化處理器。

較舊的 QMD 組建只接受一個集合篩選器。OpenClaw 偵測到
這類組建時，會保留相容性路徑，分別搜尋每個集合，
再合併結果並移除重複項目。

若要手動檢查已安裝版本的合約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明會提及指定一或多個集合。較舊的說明
通常只描述單一集合。

## 模型覆寫

QMD 模型環境變數會從閘道程序原封不動地傳遞，因此你可以
全域調整 QMD，而不必新增 OpenClaw 設定：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，使索引符合新的
向量空間。

## 為額外路徑建立索引

將 QMD 指向其他目錄，使其內容可供搜尋：

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

額外路徑的文字片段會在搜尋結果中顯示為 `qmd/<collection>/<relative-path>`。
`memory_get` 能辨識此前置字串，並從正確的集合根目錄讀取內容。

## 為工作階段逐字稿建立索引

啟用工作階段索引以回想先前的對話。QMD 同時需要一般
`memorySearch` 工作階段來源與 QMD 逐字稿匯出程式：

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

逐字稿會以經過清理的使用者／助理對話回合，匯出至
`~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD 集合。僅設定
`memorySearch.experimental.sessionMemory` 不會將逐字稿匯出至
QMD。

工作階段命中結果仍會依
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions) 進行篩選。預設的
`tree` 可見性包含目前工作階段、由其衍生的工作階段，
以及透過環境群組感知所監看的同代理程式群組工作階段。使用
`session.dmScope: "main"` 時，多使用者私訊設定中的使用者會共用主要
工作階段，並可回想其監看群組中的內容。若要隔離私訊，請為每個對象使用
`dmScope`，或將可見性設為 `"self"`，以停用環境監看的
工作階段讀取。其他不相關的同代理程式工作階段仍需要
`"agent"` 可見性。

## 搜尋範圍

預設情況下，QMD 搜尋結果只會顯示在直接工作階段中（不包含
群組或頻道聊天）。設定 `memory.qmd.scope` 可變更此行為：

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

上述文字片段就是實際的預設規則。當範圍拒絕搜尋時，
OpenClaw 會記錄警告，其中包含推導出的頻道與聊天類型，讓空白
結果更容易偵錯。

## 引用

當 `memory.citations` 為 `auto` 或 `on` 時，搜尋文字片段會附加
`Source: <path>#L<line>`（或 `#L<start>-L<end>`）頁尾。在 `auto`
模式下，僅直接聊天工作階段會加入頁尾。將
`memory.citations = "off"` 設為略過頁尾，同時仍在內部將路徑傳遞給
代理程式。

## 適用時機

在有以下需求時選擇 QMD：

- 使用重新排序以獲得更高品質的結果。
- 搜尋工作區外的專案文件或筆記。
- 回想過去的工作階段對話。
- 不需要 API 金鑰的完全本機搜尋。

若設定較簡單，[內建引擎](/zh-TW/concepts/memory-builtin) 不需要額外的相依套件
即可良好運作。

## 疑難排解

**找不到 QMD？** 請確認二進位檔位於閘道的 `PATH` 中。若 OpenClaw
以服務形式執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

若 `qmd --version` 可在你的殼層中運作，但 OpenClaw 仍回報
`spawn qmd ENOENT`，閘道程序所使用的 `PATH` 可能與
互動式殼層不同。請明確固定二進位檔：

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

請在已安裝 QMD 的環境中使用 `command -v qmd`，再透過
`openclaw memory status --deep` 重新檢查。

**第一次搜尋非常慢？** QMD 會在首次使用時下載 GGUF 模型。請使用
與 OpenClaw 相同的 XDG 目錄執行 `qmd query "test"` 以預先暖機。

**搜尋期間出現許多 QMD 子程序？** 如有可能，請更新 QMD。只有在
已安裝的 QMD 宣告支援多個 `-c` 篩選器時，OpenClaw
才會為來源相同的多集合搜尋使用單一程序；否則為確保正確性，
會保留較舊的逐集合後援機制。

**僅使用 BM25 的 QMD 仍嘗試組建 llama.cpp？** 請設定
`memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為
純詞彙搜尋，略過 QMD 向量狀態探測與嵌入維護，並將
語意就緒檢查留給 `vsearch` 或 `query` 設定。

**搜尋逾時？** 請增加 `memory.qmd.limits.timeoutMs`（預設值：4000ms）。
若硬體較慢，請將其設為更高的值，例如 `120000`。此限制適用於
代理程式 `memory_search` 呼叫期間 QMD 自身的搜尋命令；設定、同步、
內建後援與補充語料庫工作各自保有較短的期限。

**群組或頻道聊天中出現空白結果？** 這是預設
`memory.qmd.scope` 的預期行為，它只允許直接工作階段。若要在這些聊天中取得 QMD 結果，
請為 `group` 或 `channel` 聊天類型新增
`allow` 規則。

**根記憶搜尋突然變得過於廣泛？** 請重新啟動閘道，或等待
下次啟動協調程序。OpenClaw 偵測到同名衝突時，會將過時的受管理
集合重新建立為標準的 `MEMORY.md` 與 `memory/` 模式。

**工作區可見的暫存儲存庫導致 `ENAMETOOLONG` 或索引損壞？**
QMD 遍歷遵循底層 QMD 掃描器，而非 OpenClaw 的
內建符號連結規則。請將暫存的 monorepo 簽出內容放在
`.tmp/` 等隱藏目錄下，或置於已建立索引的 QMD 根目錄之外，直到 QMD 提供
可安全處理循環的遍歷功能或明確的排除控制。

## 設定

如需完整的設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、
範圍規則及所有其他選項，請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)
