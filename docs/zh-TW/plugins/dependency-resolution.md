---
read_when:
    - 你正在偵錯 Plugin 套件安裝
    - 你正在變更 Plugin 啟動、doctor 或套件管理器安裝行為
    - 你正在維護打包版 OpenClaw 安裝或隨附的 Plugin 資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝 Plugin 套件並解析 Plugin 依賴項
title: Plugin 相依性解析
x-i18n:
    generated_at: "2026-05-06T17:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 會在安裝/更新時處理 Plugin 相依性工作。執行階段載入
不會執行套件管理器、修復相依性樹，或變更 OpenClaw
套件目錄。

## 職責分工

Plugin 套件擁有自己的相依性圖：

- 執行階段相依性位於 Plugin 套件的 `dependencies` 或
  `optionalDependencies`
- SDK/核心匯入是 peer 或由 OpenClaw 提供的匯入
- 本機開發 Plugin 自行提供已安裝的相依性
- npm 和 git Plugin 會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只擁有 Plugin 生命週期：

- 探索 Plugin 來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入 Plugin 進入點
- 在相依性缺失時，以可執行的錯誤失敗

## 安裝根目錄

OpenClaw 會使用穩定的各來源根目錄：

- npm 套件安裝於 `~/.openclaw/npm`
- git 套件複製於 `~/.openclaw/git`
- 本機/路徑/封存安裝會被複製或參照，不會修復相依性

npm 安裝會在 npm 根目錄中執行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會使用相同的受管理 npm 根目錄
處理本機 npm-pack tarball。OpenClaw 會讀取該 tarball 的 npm 中繼資料，將其
作為複製的 `file:` 相依性加入受管理根目錄，執行一般 npm 安裝，
然後在信任該 Plugin 前驗證已安裝的 lockfile 中繼資料。
這是為了套件驗收與候選版本證明而設計，讓本機 pack 產物的行為
像它所模擬的 registry 產物。

npm 可能會將遞移相依性提升到 Plugin 套件旁邊的
`~/.openclaw/npm/node_modules`。OpenClaw 會在信任安裝前掃描受管理的 npm 根目錄，
並在解除安裝期間使用 npm 移除 npm 管理的套件，因此被提升的
執行階段相依性會留在受管理的清理邊界內。

匯入 `openclaw/plugin-sdk/*` 的 Plugin 會將 `openclaw` 宣告為 peer
相依性。OpenClaw 不會讓 npm 將主機套件的獨立 registry 複本安裝到
受管理根目錄，因為過時的主機套件可能會在之後的 Plugin 安裝期間影響 npm
peer 解析。相反地，在 npm 於安裝、更新或解除安裝期間完成變更共享根目錄後，
OpenClaw 會為宣告主機 peer 的已安裝套件重新確立 Plugin 本機的
`node_modules/openclaw` 連結。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

接著已安裝的 Plugin 會從該套件目錄載入，因此套件本機與上層
`node_modules` 解析的運作方式，會與一般 Node 套件相同。

## 本機 Plugin

本機 Plugin 會被視為開發者控制的目錄。OpenClaw 不會為它們執行
`npm install`、`pnpm install` 或相依性修復。如果本機
Plugin 有相依性，請先在該 Plugin 中安裝，再載入它。

第三方 TypeScript 本機 Plugin 可以使用緊急 Jiti 路徑。已封裝的
JavaScript Plugin 和內建內部 Plugin 會透過原生
import/require 載入，而不是透過 Jiti。

## 啟動和重新載入

Gateway 啟動和設定重新載入永遠不會安裝 Plugin 相依性。它們會讀取
Plugin 安裝記錄、計算進入點，並載入它。

如果執行階段缺少相依性，Plugin 會載入失敗，而錯誤應指示操作者使用明確的修正方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的相依性狀態，並在設定
參照可下載 Plugin、但本機安裝記錄中缺少它們時復原。Doctor 不會修復
已安裝本機 Plugin 的相依性。

## 內建 Plugin

輕量且對核心關鍵的內建 Plugin 會作為 OpenClaw 的一部分出貨。
它們應該沒有龐大的執行階段相依性樹，或應被移出成為
ClawHub/npm 上的可下載套件。

如需目前在核心套件中出貨、從外部安裝，或僅保留原始碼的 Plugin 產生清單，
請參閱 [Plugin 清單](/zh-TW/plugins/plugin-inventory)。

內建 Plugin manifest 不得要求相依性 staging。大型或可選的
Plugin 功能應該封裝成一般 Plugin，並透過與第三方 Plugin 相同的
npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。在
`pnpm install` 之後，內建 Plugin 會從 `extensions/<id>` 載入，因此套件本機
workspace 相依性可用，且編輯會直接被採用。原始碼 checkout 開發僅支援 pnpm；
在儲存庫根目錄執行一般 `npm install` 並不是準備內建 Plugin 相依性的受支援方式。

| 安裝形態                         | 內建 Plugin 位置                       | 相依性擁有者                                                         |
| -------------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內的已建置執行階段樹               | OpenClaw 套件與明確的 Plugin 安裝/更新/doctor 流程                  |
| Git checkout 加上 `pnpm install` | `extensions/<id>` workspace 套件       | pnpm workspace，包含各 Plugin 套件自己的相依性                      |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub Plugin 根目錄 | Plugin 安裝/更新流程                                                 |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生內建 Plugin
相依性根目錄。目前的 doctor 清理會在使用 `--fix` 時移除那些過時的目錄和
symlink，包括舊的 `plugin-runtime-deps` 根目錄、指向已修剪
`plugin-runtime-deps` 目標的全域 Node-prefix 套件 symlink、
`.openclaw-runtime-deps*` manifest、產生的 Plugin `node_modules`、安裝
stage 目錄，以及套件本機 pnpm store。已封裝的 postinstall 也會在修剪
舊版目標根目錄之前移除那些全域 symlink，因此升級不會留下失效的
ESM 套件匯入。

這些路徑只是舊版殘留。新的安裝不應建立它們。
