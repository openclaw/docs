---
read_when:
    - 你正在偵錯 Plugin 套件安裝
    - 你正在變更 Plugin 啟動、doctor 或套件管理器安裝行為
    - 你正在維護套件化的 OpenClaw 安裝或隨附的 Plugin 資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝 Plugin 套件並解析 Plugin 相依性
title: Plugin 依賴項解析
x-i18n:
    generated_at: "2026-05-02T20:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 依賴解析

OpenClaw 會在安裝/更新時處理 Plugin 依賴工作。執行階段載入
不會執行套件管理器、修復依賴樹，或變更 OpenClaw
套件目錄。

## 職責分工

Plugin 套件擁有自己的依賴圖：

- 執行階段依賴位於 Plugin 套件的 `dependencies` 或
  `optionalDependencies`
- SDK/核心匯入是對等依賴，或由 OpenClaw 提供的匯入
- 本機開發 Plugin 會帶入自己已安裝的依賴
- npm 和 git Plugin 會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只擁有 Plugin 生命週期：

- 探索 Plugin 來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入 Plugin 進入點
- 當依賴缺失時，以可操作的錯誤失敗

## 安裝根目錄

OpenClaw 使用每個來源穩定的根目錄：

- npm 套件安裝在 `~/.openclaw/npm` 下
- git 套件複製到 `~/.openclaw/git` 下
- 本機/路徑/封存安裝會被複製或引用，不會修復依賴

npm 安裝會在 npm 根目錄中執行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能會將傳遞依賴提升到 `~/.openclaw/npm/node_modules`，與
Plugin 套件並列。OpenClaw 會先掃描受管理的 npm 根目錄再信任該
安裝，並在解除安裝時使用 npm 移除 npm 管理的套件，因此被提升的
執行階段依賴會留在受管理的清理邊界內。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的 Plugin 接著會從該套件目錄載入，因此套件本機和父層
`node_modules` 解析的運作方式，會與一般 Node 套件相同。

## 本機 Plugin

本機 Plugin 會被視為開發者控制的目錄。OpenClaw 不會為它們
執行 `npm install`、`pnpm install`，或依賴修復。如果本機
Plugin 有依賴，請先在該 Plugin 中安裝它們再載入。

第三方 TypeScript 本機 Plugin 可以使用緊急 Jiti 路徑。已封裝的
JavaScript Plugin 和隨附的內部 Plugin 會透過原生
import/require 載入，而不是透過 Jiti。

## 啟動與重新載入

Gateway 啟動和設定重新載入絕不會安裝 Plugin 依賴。它們會讀取
Plugin 安裝記錄、計算進入點，並載入它。

如果執行階段缺少依賴，Plugin 將無法載入，且錯誤應指向操作員可明確採取的修復方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的依賴狀態，並安裝
設定中可下載但本機安裝記錄缺失的 Plugin。它不會修復已安裝本機
Plugin 的依賴。

## 隨附 Plugin

輕量且核心關鍵的隨附 Plugin 會作為 OpenClaw 的一部分發佈。
它們應該沒有繁重的執行階段依賴樹，或被移出為 ClawHub/npm 上的
可下載套件。

如需目前核心套件中隨附、外部安裝，或僅保留原始碼的 Plugin 產生清單，請參閱 [Plugin 清冊](/zh-TW/plugins/plugin-inventory)。

隨附 Plugin 資訊清單不得要求依賴暫存。大型或選用的 Plugin 功能
應封裝為一般 Plugin，並透過與第三方 Plugin 相同的
npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。
執行 `pnpm install` 後，隨附 Plugin 會從 `extensions/<id>` 載入，
因此套件本機 workspace 依賴可供使用，且編輯會直接被採用。原始碼
checkout 開發僅支援 pnpm；在儲存庫根目錄執行單純的 `npm install`
不是準備隨附 Plugin 依賴的受支援方式。

| 安裝形態                         | 隨附 Plugin 位置                     | 依賴擁有者                                                           |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內建的執行階段樹                 | OpenClaw 套件與明確的 Plugin 安裝/更新/doctor 流程                  |
| Git checkout 加上 `pnpm install` | `extensions/<id>` workspace 套件     | pnpm workspace，包含每個 Plugin 套件自己的依賴                      |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub Plugin 根目錄 | Plugin 安裝/更新流程                                                |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生隨附 Plugin
依賴根目錄。目前的 doctor 清理會在使用 `--fix` 時移除那些過時的目錄和
符號連結，包括舊的 `plugin-runtime-deps` 根目錄、
`.openclaw-runtime-deps*` 資訊清單、產生的 Plugin `node_modules`、
安裝暫存目錄，以及套件本機 pnpm store。

這些路徑只是舊版殘留物。新的安裝不應建立它們。
