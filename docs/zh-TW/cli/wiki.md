---
read_when:
    - 您想使用 memory-wiki CLI
    - 你正在記錄或變更 `openclaw wiki`
summary: CLI 參考：`openclaw wiki`（memory-wiki 保存庫狀態、搜尋、編譯、lint、套用、橋接與 Obsidian 輔助工具）
title: 維基
x-i18n:
    generated_at: "2026-04-30T02:57:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

檢查並維護 `memory-wiki` 知識庫。

由內建的 `memory-wiki` Plugin 提供。

相關：

- [Memory Wiki Plugin](/zh-TW/plugins/memory-wiki)
- [記憶體概覽](/zh-TW/concepts/memory)
- [CLI：記憶體](/zh-TW/cli/memory)

## 用途

當你需要一個編譯後的知識庫，且包含下列功能時，請使用 `openclaw wiki`：

- wiki 原生搜尋和頁面讀取
- 具豐富來源脈絡的綜合摘要
- 矛盾與新鮮度報告
- 從 Active Memory Plugin 橋接匯入
- 選用的 Obsidian CLI 輔助工具

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 命令

### `wiki status`

檢查目前的知識庫模式、健康狀態，以及 Obsidian CLI 可用性。

當你不確定知識庫是否已初始化、橋接模式是否健康，或 Obsidian 整合是否可用時，請先使用此命令。

當橋接模式已啟用，且設定為讀取記憶體成品時，此命令會查詢執行中的 Gateway，因此它會看到與代理程式/執行階段記憶體相同的 Active Memory Plugin 脈絡。

### `wiki doctor`

執行 wiki 健康檢查，並揭露設定或知識庫問題。

當橋接模式已啟用，且設定為讀取記憶體成品時，此命令會在建立報告前查詢執行中的 Gateway。已停用的橋接匯入，以及不讀取記憶體成品的橋接設定，會維持本機/離線模式。

常見問題包括：

- 已啟用橋接模式，但沒有公開記憶體成品
- 無效或缺少知識庫版面配置
- 預期使用 Obsidian 模式時，缺少外部 Obsidian CLI

### `wiki init`

建立 wiki 知識庫版面配置與起始頁面。

這會初始化根結構，包括頂層索引和快取目錄。

### `wiki ingest <path-or-url>`

將內容匯入 wiki 來源層。

注意：

- URL 擷取由 `ingest.allowUrlIngest` 控制
- 匯入的來源頁面會在 frontmatter 中保留來源脈絡
- 啟用時，擷取後可執行自動編譯

### `wiki compile`

重建索引、相關區塊、儀表板，以及編譯後的摘要。

這會在下列位置寫入穩定的機器導向成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果已啟用 `render.createDashboards`，編譯也會重新整理報告頁面。

### `wiki lint`

檢查知識庫並回報：

- 結構問題
- 來源脈絡缺口
- 矛盾
- 未解問題
- 低信心頁面/主張
- 過時頁面/主張

請在有意義的 wiki 更新後執行此命令。

### `wiki search <query>`

搜尋 wiki 內容。

行為取決於設定：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或
  `raw-claim`

當你需要 wiki 專用排序或來源脈絡細節時，請使用 `wiki search`。若要進行一次廣泛的共享召回，且 Active Memory Plugin 有公開共享搜尋，請優先使用 `openclaw memory search`。

搜尋模式可協助代理程式選擇正確的介面：

- `find-person`：別名、帳號、社交資料、規範 ID，以及人物頁面
- `route-question`：詢問對象/最適用途提示，以及關係脈絡
- `source-evidence`：來源頁面和結構化證據欄位
- `raw-claim`：含主張/證據中繼資料的結構化主張文字

範例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

當結果符合結構化主張時，文字輸出會包含 `Claim:` 和 `Evidence:` 行。JSON 輸出另外公開 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供代理程式端深入查看。

### `wiki get <lookup>`

依 ID 或相對路徑讀取 wiki 頁面。

範例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

套用狹窄範圍的變更，而不進行自由形式的頁面手術式編輯。

支援的流程包括：

- 建立/更新綜合摘要頁面
- 更新頁面中繼資料
- 附加來源 ID
- 新增問題
- 新增矛盾
- 更新信心/狀態
- 寫入結構化主張

此命令的存在，是為了讓 wiki 可以安全演進，而不需要手動編輯受管理的區塊。

### `wiki bridge import`

從 Active Memory Plugin 將公開記憶體成品匯入橋接支援的來源頁面。

當你處於 `bridge` 模式，且需要將最新匯出的記憶體成品拉入 wiki 知識庫時，請使用此命令。

對於主動橋接成品讀取，CLI 會透過 Gateway RPC 路由匯入，因此匯入會使用執行階段記憶體 Plugin 脈絡。如果橋接匯入已停用，或成品讀取已關閉，此命令會保留本機/離線的零匯入行為。

### `wiki unsafe-local import`

在 `unsafe-local` 模式中，從明確設定的本機路徑匯入。

這是刻意設計為實驗性功能，且僅限同一台機器使用。

### `wiki obsidian ...`

用於以 Obsidian 友善模式執行之知識庫的 Obsidian 輔助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

當已啟用 `obsidian.useOfficialCli` 時，這些命令需要官方 `obsidian` CLI 位於 `PATH`。

## 實務使用指引

- 當來源脈絡和頁面識別很重要時，請使用 `wiki search` + `wiki get`。
- 請使用 `wiki apply`，而不是手動編輯受管理的生成區段。
- 信任矛盾或低信心內容之前，請使用 `wiki lint`。
- 大量匯入或來源變更後，如果你想立即取得新鮮的儀表板和編譯後摘要，請使用 `wiki compile`。
- 當橋接模式依賴新匯出的記憶體成品時，請使用 `wiki bridge import`。

## 設定關聯

`openclaw wiki` 的行為受下列項目影響：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整設定模型請參閱 [Memory Wiki Plugin](/zh-TW/plugins/memory-wiki)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Memory wiki](/zh-TW/plugins/memory-wiki)
