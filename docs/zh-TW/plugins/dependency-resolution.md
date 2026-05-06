---
read_when:
    - 您正在偵錯 Plugin 套件安裝
    - 你正在變更 Plugin 啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝版 OpenClaw 安裝或隨附的 Plugin 資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝 Plugin 套件並解析 Plugin 相依性
title: Plugin 依賴關係解析
x-i18n:
    generated_at: "2026-05-06T19:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 會將 Plugin 依賴項工作保留在安裝/更新時執行。執行階段載入
不會執行套件管理器、修復依賴項樹，或變更 OpenClaw
套件目錄。

## 責任分工

Plugin 套件擁有自己的依賴項圖：

- 執行階段依賴項位於 Plugin 套件的 `dependencies` 或
  `optionalDependencies`
- SDK/核心匯入是 peer 或由 OpenClaw 提供的匯入
- 本機開發 Plugin 會帶入自己已安裝的依賴項
- npm 和 git Plugin 會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只擁有 Plugin 生命週期：

- 探索 Plugin 來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入 Plugin 進入點
- 依賴項缺失時，以可執行的錯誤訊息失敗

## 安裝根目錄

OpenClaw 會使用穩定的每來源根目錄：

- npm 套件安裝在 `~/.openclaw/npm` 下
- git 套件 clone 在 `~/.openclaw/git` 下
- 本機/路徑/封存安裝會被複製或引用，而不修復依賴項

npm 安裝會在 npm 根目錄中執行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會針對本機 npm-pack tarball
使用相同的受管理 npm 根目錄。OpenClaw 會讀取 tarball 的 npm 中繼資料，將它
作為複製的 `file:` 依賴項加入受管理根目錄，執行一般 npm 安裝，
然後在信任該 Plugin 前驗證已安裝的 lockfile 中繼資料。
這是為套件驗收與候選發行版本證明而設計，讓本機 pack 成品
能像它所模擬的 registry 成品一樣運作。

npm 可能會將傳遞依賴項提升到 Plugin 套件旁邊的
`~/.openclaw/npm/node_modules`。OpenClaw 會在信任安裝前掃描受管理的 npm 根目錄，
並在解除安裝期間使用 npm 移除 npm 管理的套件，因此提升後的
執行階段依賴項會留在受管理的清理邊界內。

匯入 `openclaw/plugin-sdk/*` 的 Plugin 會將 `openclaw` 宣告為 peer
dependency。OpenClaw 不會讓 npm 將主機套件的另一份 registry 複本
安裝到受管理根目錄中，因為過期的主機套件可能會影響後續 Plugin
安裝期間的 npm peer 解析。受管理的 npm 安裝會略過共享根目錄的 npm peer
解析/實體化，且 OpenClaw 會在安裝、更新或解除安裝後，針對宣告
主機 peer 的已安裝套件，重新確認 Plugin 本機的 `node_modules/openclaw` 連結。

git 安裝會 clone 或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的 Plugin 接著會從該套件目錄載入，因此套件本機與父層
`node_modules` 解析的運作方式，會與一般 Node 套件相同。

## 本機 Plugin

本機 Plugin 會被視為開發者控制的目錄。OpenClaw 不會為它們
執行 `npm install`、`pnpm install` 或依賴項修復。如果本機
Plugin 有依賴項，請在載入它之前先在該 Plugin 中安裝。

第三方 TypeScript 本機 Plugin 可使用緊急 Jiti 路徑。已封裝的
JavaScript Plugin 與 bundled 內部 Plugin 會透過原生
import/require 載入，而不是透過 Jiti。

## 啟動與重新載入

Gateway 啟動與設定重新載入永遠不會安裝 Plugin 依賴項。它們會讀取
Plugin 安裝記錄、計算進入點，然後載入它。

如果執行階段缺少依賴項，Plugin 載入會失敗，且錯誤應該指引操作員
採取明確修復方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的依賴項狀態，並在設定
引用可下載 Plugin 但本機安裝記錄缺少它們時復原。Doctor 不會修復
已安裝本機 Plugin 的依賴項。

## Bundled Plugin

輕量且對核心至關重要的 bundled Plugin 會作為 OpenClaw 的一部分出貨。
它們應該沒有龐大的執行階段依賴項樹，或被移出成 ClawHub/npm 上的
可下載套件。

如需目前在核心套件中出貨、從外部安裝，或僅保留原始碼的 Plugin
產生清單，請參閱 [Plugin 清單](/zh-TW/plugins/plugin-inventory)。

Bundled Plugin manifest 不得要求依賴項暫存。大型或可選的
Plugin 功能應該封裝成一般 Plugin，並透過與第三方 Plugin 相同的
npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。在
`pnpm install` 之後，bundled Plugin 會從 `extensions/<id>` 載入，
因此套件本機 workspace 依賴項可用，且編輯會直接被套用。原始碼
checkout 開發僅支援 pnpm；在儲存庫根目錄執行純 `npm install`
不是準備 bundled Plugin 依賴項的支援方式。

| 安裝形態                         | Bundled Plugin 位置                  | 依賴項擁有者                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內建置好的執行階段樹             | OpenClaw 套件與明確的 Plugin 安裝/更新/doctor 流程                  |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 套件      | pnpm workspace，包含每個 Plugin 套件自己的依賴項                    |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub Plugin 根目錄 | Plugin 安裝/更新流程                                                |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生 bundled-plugin
依賴項根目錄。目前的 doctor 清理會在使用 `--fix` 時移除那些過期目錄與
symlink，包括舊的 `plugin-runtime-deps` 根目錄、指向已修剪
`plugin-runtime-deps` 目標的全域 Node-prefix 套件 symlink、
`.openclaw-runtime-deps*` manifest、產生的 Plugin `node_modules`、安裝
stage 目錄，以及套件本機 pnpm store。封裝後的 postinstall 也會在修剪舊版
目標根目錄前移除那些全域 symlink，因此升級不會留下懸空的 ESM 套件匯入。

這些路徑只是舊版殘留物。新的安裝不應建立它們。
