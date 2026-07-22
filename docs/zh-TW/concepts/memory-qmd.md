---
read_when:
    - 你想要將 QMD 設定為記憶體後端
    - 你想要重新排序或額外索引路徑等進階記憶功能
summary: 本機優先的搜尋輔助服務，支援 BM25、向量、重新排序與查詢擴展
title: QMD 記憶引擎
x-i18n:
    generated_at: "2026-07-22T10:31:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c0e54dc9a18d834036e4c79d6b7bdecb268a29976d9f30ea6e82a56ca5d71fda
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一個本機優先的搜尋輔助程序，與
OpenClaw 並行運作。它將 BM25、向量搜尋與重新排序整合在單一
二進位檔中，並且可以索引工作區記憶檔案以外的內容。

## 相較於內建引擎新增的功能

- **重新排序與查詢擴展**，提升召回率。
- **索引額外目錄** - 專案文件、團隊筆記，以及磁碟上的任何內容。
- **索引工作階段逐字稿** - 回想先前的對話。
- **完全本機執行** - 使用官方 llama.cpp 提供者外掛運作，並
  自動下載 GGUF 模型。
- **自動備援** - 如果 QMD 無法使用，OpenClaw 會無縫切換回
  內建引擎。

## 開始使用

### 先決條件

- 安裝 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允許載入擴充功能的 SQLite 建置版本（macOS 上為 `brew install sqlite`）。
- QMD 必須位於閘道的 `PATH` 中。
- macOS 和 Linux 可直接使用。Windows 最適合透過 WSL2 支援。

### 啟用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 會在
`~/.openclaw/agents/<agentId>/qmd/` 下建立獨立完備的 QMD 主目錄，並自動管理輔助程序的生命週期
— 集合、更新與嵌入執行都會自動處理。
它會優先使用目前的 QMD 集合與 MCP 查詢格式，但會在需要時切換回
替代的集合模式旗標和較舊的 MCP 工具名稱。
啟動時的協調程序也會在仍存在同名的舊版 QMD 集合時，將過時的受管理集合
重新建立為其標準模式。

## 輔助程序的運作方式

- OpenClaw 會從工作區記憶檔案和已設定的
  `memory.qmd.paths` 建立集合。QMD 轉接器負責更新、嵌入、防彈跳與
  逾時啟發法；這些不是使用者可設定的項目。
- QMD 會繼續管理其 `index.sqlite`、YAML 集合設定，以及每個代理程式
  QMD 主目錄下的模型下載；這些是外部工具成品，
  而非 OpenClaw 狀態資料表。OpenClaw 擁有的協調資訊只存放於 SQLite：
  一個共用租約會限制跨代理程式的嵌入工作，而每個
  代理程式資料庫中的一個租約會序列化該代理程式的集合、更新與嵌入寫入。
  執行階段不再建立 QMD 檔案鎖定輔助檔。`openclaw doctor --fix`
  只有在確認其舊程序擁有者已過期後，才會移除已淘汰的輔助檔。
  升級採用完全切換：使用新版本前，請停止並重新啟動共用該狀態目錄的
  每個 OpenClaw 程序。不支援新舊 QMD 寫入器混用；執行階段刻意不會對
  已淘汰的輔助檔進行雙重鎖定。
- 預設工作區集合會追蹤 `MEMORY.md` 以及 `memory/`
  目錄樹。小寫的 `memory.md` 不會被索引為根記憶檔案。
- QMD 自身的掃描器會忽略隱藏路徑和常見的相依套件／建置
  目錄，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和
  `build`。閘道啟動時會讓 QMD 保持延遲載入；管理器會在首次使用記憶功能時
  初始化。
- 搜尋會使用已設定的 `searchMode`（預設：`search`；也支援
  `vsearch` 和 `query`）。`search` 僅使用 BM25，因此 OpenClaw 會在該模式中略過語意
  向量就緒探測與嵌入維護。如果某個模式失敗，
  OpenClaw 會使用 `qmd query` 重試。
- 當 `searchMode` 為 `query` 時，請將 `memory.qmd.rerank` 設為 `false`，以使用
  QMD 不含重新排序器的混合查詢路徑（需要 QMD 2.1 或更新版本）。
  OpenClaw 會將 `--no-rerank` 傳遞至直接 QMD 命令列介面路徑，並將
  `rerank: false` 傳遞至 QMD 的 MCP 查詢工具。
- 對於宣告支援多集合篩選器的 QMD 版本，OpenClaw 會將
  同來源集合群組到一次 QMD 搜尋呼叫中。較舊的 QMD 版本則
  保留相容的逐集合備援。
- 如果 QMD 完全失敗，OpenClaw 會切換回內建 SQLite 引擎。
  開啟失敗後，重複的聊天輪次嘗試會短暫退避，以免
  遺失的二進位檔或故障的輔助程序相依套件造成重試風暴；
  `openclaw memory status` 和單次命令列介面探測仍會直接重新檢查 QMD。

<Info>
第一次搜尋可能較慢 — QMD 會在首次執行 `qmd query` 時，自動下載
用於重新排序與查詢擴展的 GGUF 模型（約 2 GB）。
</Info>

## 搜尋效能與相容性

OpenClaw 會讓 QMD 搜尋路徑同時相容於目前和較舊的 QMD
安裝版本。

啟動時，OpenClaw 會針對每個管理器檢查一次已安裝 QMD 的說明文字。如果
二進位檔宣告支援多個集合篩選器，OpenClaw
會使用一個命令搜尋所有同來源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

這可避免為每個持久記憶集合啟動一個 QMD 子程序。
工作階段逐字稿集合會留在自己的來源群組中，因此混合
`memory` + `sessions` 搜尋仍會從兩個來源取得結果多樣化器的輸入。

較舊的 QMD 建置版本只接受一個集合篩選器。當 OpenClaw 偵測到
這類建置版本時，會保留相容路徑，分別搜尋每個集合，
再合併結果並移除重複項目。

若要手動檢查已安裝版本的契約，請執行：

```bash
qmd --help | grep -i collection
```

目前的 QMD 說明會提及以一個或多個集合為目標。較舊的說明
通常只描述單一集合。

## 模型覆寫

QMD 模型環境變數會從閘道
程序原樣傳遞，因此無須新增 OpenClaw 設定即可全域調整 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

變更嵌入模型後，請重新執行嵌入，讓索引符合新的
向量空間。

## 索引額外路徑

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

額外路徑中的片段會在搜尋結果中顯示為
`qmd/<collection>/<relative-path>`。`memory_get` 能識別此前綴，並從
正確的集合根目錄讀取內容。

## 索引工作階段逐字稿

啟用工作階段索引，以回想先前的對話。QMD 同時需要
一般的 `memory.search` 工作階段來源和 QMD 逐字稿匯出器：

```json5
{
  memory: {
    backend: "qmd",
    search: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"],
    },
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

逐字稿會以清理過的使用者／助理對話輪次匯出至
`~/.openclaw/agents/<id>/qmd/sessions/` 下的專用 QMD 集合。只設定
`sources: ["sessions"]` 不會將逐字稿匯出至 QMD；還必須啟用
`rememberAcrossConversations` 或明確的 QMD 工作階段匯出功能。

工作階段搜尋結果仍會依
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions) 篩選。預設
`tree` 可見範圍包含目前的工作階段、由其衍生的工作階段，
以及透過環境群組感知監看的同代理程式群組工作階段。在
`session.dmScope: "main"` 下，多使用者私訊設定中的使用者會共用主要
工作階段，並可回想其監看群組中的內容。請針對每個對等端使用
`dmScope` 以隔離私訊，或將可見範圍設為 `"self"`，選擇不讀取環境中監看的
工作階段。其他不相關的同代理程式工作階段仍需要
`"agent"` 可見範圍。

## 搜尋範圍

預設情況下，QMD 搜尋結果只會在直接工作階段中顯示（不包括
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

上述片段就是實際的預設規則。當範圍設定拒絕搜尋時，
OpenClaw 會記錄警告，其中包含推導出的頻道和聊天類型，以便
更輕鬆地偵錯空白結果。

## 引用

當 `memory.citations` 為 `auto` 或 `on` 時，搜尋片段會附加
`Source: <path>#L<line>`（或 `#L<start>-L<end>`）頁尾。在 `auto`
模式中，只有直接聊天工作階段會加入該頁尾。設定
`memory.citations = "off"` 可省略頁尾，同時仍在內部將路徑傳遞給
代理程式。

## 適用時機

在需要以下功能時選擇 QMD：

- 透過重新排序取得更高品質的結果。
- 搜尋工作區以外的專案文件或筆記。
- 回想過往工作階段的對話。
- 不需要 API 金鑰的完全本機搜尋。

若設定較簡單，[內建引擎](/zh-TW/concepts/memory-builtin) 無須額外相依套件
即可良好運作。

## 疑難排解

**找不到 QMD？** 請確認二進位檔位於閘道的 `PATH` 中。如果 OpenClaw
以服務形式執行，請建立符號連結：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 可在你的殼層中運作，但 OpenClaw 仍回報
`spawn qmd ENOENT`，閘道程序使用的 `PATH` 可能與
互動式殼層不同。請明確指定二進位檔：

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

請在已安裝 QMD 的環境中使用 `command -v qmd`，然後以
`openclaw memory status --deep` 重新檢查。

**第一次搜尋非常慢？** QMD 會在首次使用時下載 GGUF 模型。請使用
`qmd query "test"`，並採用與 OpenClaw 相同的 XDG 目錄進行預熱。

**搜尋期間出現許多 QMD 子程序？** 如有可能，請更新 QMD。只有在
已安裝的 QMD 宣告支援多個 `-c` 篩選器時，OpenClaw
才會使用單一程序進行同來源多集合搜尋；否則會
保留較舊的逐集合備援，以確保正確性。

**僅使用 BM25 的 QMD 仍嘗試建置 llama.cpp？** 請設定
`memory.qmd.searchMode = "search"`。OpenClaw 會將該模式視為
僅限詞彙搜尋，略過 QMD 向量狀態探測和嵌入維護，並
將語意就緒檢查交由 `vsearch` 或 `query` 設定處理。

**搜尋逾時？** 增加 `memory.qmd.limits.timeoutMs`（預設：4000ms）。
對於速度較慢的硬體，請設定較高的值，例如 `120000`。此限制適用於
代理程式 `memory_search` 呼叫期間 QMD 自身的搜尋命令；設定、同步、
內建備援和補充語料庫工作則各自保有較短的期限。

**群組或頻道聊天中的結果為空？** 使用預設的
`memory.qmd.scope` 時，這是預期行為，因為它只允許直接工作階段。如果希望在這些位置顯示 QMD 結果，
請為 `group` 或 `channel` 聊天類型新增
`allow` 規則。

**根記憶搜尋突然變得太廣泛？** 請重新啟動閘道，或等待
下一次啟動協調。OpenClaw 偵測到同名衝突時，會將過時的受管理
集合重新建立為標準的 `MEMORY.md` 和 `memory/` 模式。

**工作區可見的暫存儲存庫造成 `ENAMETOOLONG` 或索引損壞？**
QMD 走訪遵循底層 QMD 掃描器，而非 OpenClaw 的
內建符號連結規則。在 QMD 提供
循環安全走訪或明確排除控制前，請將暫存 monorepo 簽出放在 `.tmp/` 等隱藏
目錄下，或放在已索引的 QMD 根目錄之外。

## 設定

如需完整的設定介面（`memory.qmd.*`）、搜尋模式、更新間隔、
範圍規則及所有其他選項，請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關內容

- [記憶概觀](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [Honcho 記憶](/zh-TW/concepts/memory-honcho)
