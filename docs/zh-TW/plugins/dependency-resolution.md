---
read_when:
    - 你正在偵錯 Plugin 套件安裝
    - 您正在變更 Plugin 啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝版 OpenClaw 安裝或隨附的 Plugin 清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝 Plugin 套件並解析 Plugin 依賴關係
title: Plugin 依賴解析
x-i18n:
    generated_at: "2026-05-05T01:48:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 依賴項解析

OpenClaw 將 Plugin 依賴項處理保留在安裝/更新時進行。執行階段載入不會執行套件管理器、修復依賴項樹，或變更 OpenClaw 套件目錄。

## 責任分工

Plugin 套件擁有自己的依賴項圖：

- 執行階段依賴項位於 Plugin 套件的 `dependencies` 或 `optionalDependencies`
- SDK/核心匯入是對等依賴，或由 OpenClaw 提供的匯入
- 本機開發 Plugin 會自備已安裝的依賴項
- npm 和 git Plugin 會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只負責 Plugin 生命週期：

- 探索 Plugin 來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入 Plugin 進入點
- 當依賴項缺失時，以可操作的錯誤失敗

## 安裝根目錄

OpenClaw 使用穩定的每來源根目錄：

- npm 套件安裝在 `~/.openclaw/npm` 下
- git 套件複製到 `~/.openclaw/git` 下
- 本機/路徑/封存檔安裝會被複製或參照，不會修復依賴項

npm 安裝會在 npm 根目錄中執行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能會將遞移依賴項提升到 Plugin 套件旁的 `~/.openclaw/npm/node_modules`。OpenClaw 會先掃描受管理的 npm 根目錄，再信任該安裝，並在解除安裝期間使用 npm 移除 npm 管理的套件，因此被提升的執行階段依賴項會留在受管理的清理邊界內。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的 Plugin 接著會從該套件目錄載入，因此套件本機和父層 `node_modules` 解析的運作方式，會與一般 Node 套件相同。

## 本機 Plugin

本機 Plugin 會被視為開發者控制的目錄。OpenClaw 不會為它們執行 `npm install`、`pnpm install` 或依賴項修復。如果本機 Plugin 有依賴項，請先在該 Plugin 中安裝，再載入它。

第三方 TypeScript 本機 Plugin 可以使用緊急 Jiti 路徑。已封裝的 JavaScript Plugin 和內建內部 Plugin 會透過原生 import/require 載入，而不是透過 Jiti。

## 啟動和重新載入

Gateway 啟動和設定重新載入絕不會安裝 Plugin 依賴項。它們會讀取 Plugin 安裝記錄、計算進入點，並載入它。

如果執行階段缺少依賴項，Plugin 會載入失敗，而且錯誤應指引操作員採取明確修復：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的依賴項狀態，並在設定參照可下載 Plugin、但本機安裝記錄缺少它們時復原這些 Plugin。Doctor 不會為已安裝的本機 Plugin 修復依賴項。

## 內建 Plugin

輕量且對核心關鍵的內建 Plugin 會作為 OpenClaw 的一部分交付。它們應該沒有沉重的執行階段依賴項樹，或移出成為 ClawHub/npm 上的可下載套件。

如需目前隨核心套件交付、外部安裝或僅保留原始碼的 Plugin 產生清單，請參閱 [Plugin 清單](/zh-TW/plugins/plugin-inventory)。

內建 Plugin manifest 不得要求依賴項暫存。大型或選用的 Plugin 功能應封裝為一般 Plugin，並透過與第三方 Plugin 相同的 npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。執行 `pnpm install` 後，內建 Plugin 會從 `extensions/<id>` 載入，因此套件本機 workspace 依賴項可用，且編輯會直接生效。原始碼 checkout 開發僅支援 pnpm；在儲存庫根目錄執行一般 `npm install` 不是準備內建 Plugin 依賴項的支援方式。

| 安裝形態                         | 內建 Plugin 位置                      | 依賴項擁有者                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內建置的執行階段樹                | OpenClaw 套件，以及明確的 Plugin 安裝/更新/doctor 流程              |
| Git checkout 加上 `pnpm install` | `extensions/<id>` workspace 套件      | pnpm workspace，包括每個 Plugin 套件自己的依賴項                    |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub Plugin 根目錄 | Plugin 安裝/更新流程                                                 |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生內建 Plugin 依賴項根目錄。現在的 doctor 清理會在使用 `--fix` 時移除這些過時目錄和符號連結，包括舊的 `plugin-runtime-deps` 根目錄、指向已修剪 `plugin-runtime-deps` 目標的全域 Node 前綴套件符號連結、`.openclaw-runtime-deps*` manifest、產生的 Plugin `node_modules`、安裝暫存目錄，以及套件本機 pnpm 儲存區。封裝的 postinstall 也會在修剪舊版目標根目錄之前移除這些全域符號連結，讓升級不會留下懸空的 ESM 套件匯入。

這些路徑只是舊版殘留。新安裝不應建立它們。
