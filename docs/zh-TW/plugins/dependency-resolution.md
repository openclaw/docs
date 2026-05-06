---
read_when:
    - 您正在偵錯 Plugin 套件安裝
    - 你正在變更 Plugin 啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝的 OpenClaw 安裝或隨附的 Plugin 資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝 Plugin 套件並解析 Plugin 相依性
title: Plugin 依賴解析
x-i18n:
    generated_at: "2026-05-06T09:15:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 相依性解析

OpenClaw 將 Plugin 相依性工作保留在安裝/更新階段。執行階段載入不會執行套件管理器、修復相依性樹，或變更 OpenClaw 套件目錄。

## 職責分工

Plugin 套件擁有自己的相依性圖：

- 執行階段相依性位於 Plugin 套件的 `dependencies` 或 `optionalDependencies`
- SDK/核心匯入是對等相依性，或由 OpenClaw 提供的匯入
- 本機開發 Plugin 會帶入自己已安裝的相依性
- npm 和 git Plugin 會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只負責 Plugin 生命週期：

- 探索 Plugin 來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入 Plugin 進入點
- 相依性缺失時，以可操作的錯誤失敗

## 安裝根目錄

OpenClaw 使用穩定的各來源根目錄：

- npm 套件安裝在 `~/.openclaw/npm` 下
- git 套件複製在 `~/.openclaw/git` 下
- 本機/路徑/封存安裝會複製或引用，且不進行相依性修復

npm 安裝會在 npm 根目錄中執行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會針對本機 npm-pack tarball 使用相同的受管理 npm 根目錄。OpenClaw 會讀取 tarball 的 npm 中繼資料，將其作為複製的 `file:` 相依性加入受管理根目錄，執行一般 npm 安裝，然後在信任 Plugin 前驗證已安裝的 lockfile 中繼資料。這是為了套件驗收和候選發行版本證明而設計，讓本機 pack 成品能像它模擬的 registry 成品一樣運作。

npm 可能會將傳遞相依性提升到 Plugin 套件旁邊的 `~/.openclaw/npm/node_modules`。OpenClaw 會在信任安裝前掃描受管理的 npm 根目錄，並在解除安裝期間使用 npm 移除 npm 管理的套件，因此提升後的執行階段相依性仍留在受管理的清理邊界內。

匯入 `openclaw/plugin-sdk/*` 的 Plugin 會將 `openclaw` 宣告為對等相依性。OpenClaw 不允許 npm 將主機套件的獨立 registry 副本安裝到受管理根目錄，因為過時的主機套件可能會影響後續 Plugin 安裝期間的 npm 對等相依性解析。相反地，在 npm 於安裝、更新或解除安裝期間完成變更共享根目錄後，OpenClaw 會針對宣告主機對等相依性的已安裝套件，重新建立 Plugin 本機的 `node_modules/openclaw` 連結。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的 Plugin 接著會從該套件目錄載入，因此套件本機和父層 `node_modules` 解析會以一般 Node 套件相同的方式運作。

## 本機 Plugin

本機 Plugin 會被視為由開發者控制的目錄。OpenClaw 不會為它們執行 `npm install`、`pnpm install` 或相依性修復。如果本機 Plugin 有相依性，請在載入前先於該 Plugin 中安裝。

第三方 TypeScript 本機 Plugin 可以使用緊急 Jiti 路徑。封裝的 JavaScript Plugin 和內建內部 Plugin 會透過原生 import/require 載入，而不是透過 Jiti。

## 啟動與重新載入

Gateway 啟動和設定重新載入絕不會安裝 Plugin 相依性。它們會讀取 Plugin 安裝記錄、計算進入點，然後載入它。

如果執行階段缺少相依性，Plugin 會載入失敗，且錯誤應指引操作員採取明確修復：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的相依性狀態，並在設定引用可下載 Plugin 但本機安裝記錄缺少它們時復原。Doctor 不會為已安裝的本機 Plugin 修復相依性。

## 內建 Plugin

輕量且對核心關鍵的內建 Plugin 會作為 OpenClaw 的一部分出貨。它們應該沒有繁重的執行階段相依性樹，或移出成為 ClawHub/npm 上的可下載套件。

如需目前隨核心套件出貨、外部安裝或僅保留原始碼的 Plugin 產生清單，請參閱 [Plugin 清冊](/zh-TW/plugins/plugin-inventory)。

內建 Plugin manifest 不得要求相依性暫存。大型或選用的 Plugin 功能應封裝為一般 Plugin，並透過與第三方 Plugin 相同的 npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。執行 `pnpm install` 後，內建 Plugin 會從 `extensions/<id>` 載入，因此套件本機的 workspace 相依性可用，且編輯會直接生效。原始碼 checkout 開發僅支援 pnpm；在儲存庫根目錄執行一般 `npm install` 不是準備內建 Plugin 相依性的受支援方式。

| 安裝形式                         | 內建 Plugin 位置                    | 相依性擁有者                                                         |
| -------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內建置好的執行階段樹           | OpenClaw 套件，以及明確的 Plugin 安裝/更新/doctor 流程              |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 套件    | pnpm workspace，包括每個 Plugin 套件自己的相依性                    |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub Plugin 根目錄 | Plugin 安裝/更新流程                                               |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生內建 Plugin 相依性根目錄。目前的 doctor 清理會在使用 `--fix` 時移除這些過時目錄和符號連結，包括舊的 `plugin-runtime-deps` 根目錄、指向已裁剪 `plugin-runtime-deps` 目標的全域 Node-prefix 套件符號連結、`.openclaw-runtime-deps*` manifest、產生的 Plugin `node_modules`、安裝暫存目錄，以及套件本機 pnpm stores。封裝的 postinstall 也會在裁剪舊版目標根目錄前移除這些全域符號連結，讓升級不會留下懸空的 ESM 套件匯入。

這些路徑只是舊版殘留物。新的安裝不應建立它們。
