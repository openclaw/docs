---
read_when:
    - 你正在偵錯外掛套件安裝
    - 你正在變更外掛啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝的 OpenClaw 安裝或隨附外掛資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝外掛套件並解析外掛依賴項
title: 外掛相依性解析
x-i18n:
    generated_at: "2026-06-27T19:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 會將外掛依賴作業保留在安裝/更新時執行。執行階段載入
不會執行套件管理器、修復依賴樹，或變更 OpenClaw
套件目錄。

## 責任劃分

外掛套件擁有自己的依賴圖：

- 執行階段依賴位於外掛套件的 `dependencies` 或
  `optionalDependencies`
- SDK/核心匯入是對等依賴，或由 OpenClaw 提供的匯入
- 本機開發外掛會帶入自己已安裝的依賴
- npm 和 git 外掛會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只擁有外掛生命週期：

- 探索外掛來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入外掛進入點
- 依賴缺失時，以可操作的錯誤失敗

## 安裝根目錄

OpenClaw 使用穩定的各來源根目錄：

- npm 套件會安裝到
  `~/.openclaw/npm/projects/<encoded-package>` 下各外掛專案
- git 套件會複製到 `~/.openclaw/git` 下
- 本機/路徑/封存檔安裝會被複製或參照，而不修復依賴

npm 安裝會在該各外掛專案根目錄中執行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會對本機 npm-pack tarball 使用相同的各外掛 npm
專案根目錄。OpenClaw 會讀取 tarball 的 npm
中繼資料，將它作為已複製的 `file:` 依賴加入受管理專案，執行
一般 npm install，然後驗證已安裝的 lockfile 中繼資料，再信任該外掛。
這是為了套件驗收與發行候選證明而設計，其中本機 pack 成品應該表現得像它所模擬的 registry 成品。

npm 可能會將遞移依賴提升到外掛套件旁邊的各外掛專案
`node_modules`。OpenClaw 會先掃描受管理專案
根目錄，再信任該安裝，並在解除安裝期間移除該專案，因此
被提升的執行階段依賴會留在該外掛的清理邊界內。

已發布的 npm 外掛套件可以隨附 `npm-shrinkwrap.json`。npm 會在安裝期間使用該
可發布的 lockfile，而 OpenClaw 的受管理 npm 專案根目錄
會透過一般 npm install 路徑支援它。OpenClaw 擁有的可發布
外掛套件必須包含從該外掛套件已發布依賴圖產生的套件本機 shrinkwrap：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

產生器會移除外掛 `devDependencies`，套用工作區覆寫
政策，並為每個 `publishToNpm` 外掛寫入 `extensions/<id>/npm-shrinkwrap.json`。第三方外掛套件也可以隨附 shrinkwrap；
OpenClaw 不要求社群套件提供它，但存在時 npm 會遵循它。

OpenClaw 擁有的 npm 外掛套件也可以使用明確的
`bundledDependencies` 發布。npm 發布路徑會覆疊執行階段依賴
名稱清單，從已發布的套件 manifest 移除僅限開發的工作區中繼資料，
為套件本機執行階段依賴執行不含腳本的 npm install，
然後將外掛 tarball 打包或發布，並包含那些依賴
檔案。包含 Codex 與 ACP 執行階段在內的原生依賴較重套件，會透過
`openclaw.release.bundleRuntimeDependencies: false` 選擇退出；那些套件仍會
隨附 shrinkwrap，但 npm 會在安裝期間解析執行階段依賴，
而不是把每個平台二進位檔嵌入外掛 tarball。根
`openclaw` 套件不會封裝其完整依賴樹。

匯入 `openclaw/plugin-sdk/*` 的外掛會將 `openclaw` 宣告為對等
依賴。OpenClaw 不允許 npm 將主機套件的另一份 registry 副本
安裝到受管理專案，因為過時的主機套件可能會影響該外掛內的 npm
對等依賴解析。受管理的 npm 安裝會跳過 npm 對等依賴
解析/實體化，並且 OpenClaw 會在安裝或更新後，為宣告主機對等依賴的已安裝套件
重新確立外掛本機
`node_modules/openclaw` 連結。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的外掛接著會從該套件目錄載入，因此套件本機
與父層 `node_modules` 解析的運作方式，會和一般節點套件相同。

## 本機外掛

本機外掛會被視為開發者控制的目錄。OpenClaw 不會
為它們執行 `npm install`、`pnpm install` 或依賴修復。如果本機
外掛有依賴，請先在該外掛中安裝它們，再載入外掛。

第三方 TypeScript 本機外掛可以使用緊急 Jiti 路徑。已封裝的
JavaScript 外掛與內建內部外掛會透過原生
import/require 載入，而不是 Jiti。

## 啟動與重新載入

閘道啟動與設定重新載入永遠不會安裝外掛依賴。它們會讀取
外掛安裝記錄、計算進入點，並載入它。

如果執行階段缺少依賴，外掛會載入失敗，而錯誤
應該將操作員指向明確修復方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的依賴狀態，並在設定
參照可下載外掛但本機安裝記錄缺少它們時復原這些外掛。Doctor 不會
修復已安裝本機外掛的依賴。

## 內建外掛

輕量且核心關鍵的內建外掛會作為 OpenClaw 的一部分出貨。
它們應該沒有沉重的執行階段依賴樹，或被移出為
ClawHub/npm 上的可下載套件。

如需目前在核心套件中出貨、外部安裝或僅保留原始碼的外掛產生清單，請參閱[外掛清冊](/zh-TW/plugins/plugin-inventory)。

內建外掛 manifest 不得要求依賴暫存。大型或選用
外掛功能應該封裝為一般外掛，並透過
與第三方外掛相同的 npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。在
`pnpm install` 之後，內建外掛會從 `extensions/<id>` 載入，因此套件本機
工作區依賴可用，且編輯會被直接採用。原始碼
checkout 開發僅支援 pnpm；在儲存庫根目錄執行純
`npm install` 不是準備內建外掛依賴的受支援方式。

| 安裝形態                         | 內建外掛位置                          | 依賴擁有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內的已建置執行階段樹              | OpenClaw 套件與明確的外掛安裝/更新/doctor 流程                      |
| Git checkout 加上 `pnpm install` | `extensions/<id>` 工作區套件          | pnpm 工作區，包含每個外掛套件自己的依賴                              |
| `openclaw plugins install ...`   | 受管理的 npm 專案/git/ClawHub 根目錄  | 外掛安裝/更新流程                                                    |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生內建外掛依賴根目錄。當使用 `--fix` 時，目前的 doctor cleanup 會移除那些過時目錄與
符號連結，包括舊的 `plugin-runtime-deps` 根目錄、指向已修剪 `plugin-runtime-deps` 目標的全域
節點 prefix 套件符號連結、
`.openclaw-runtime-deps*` manifest、產生的外掛 `node_modules`、安裝
階段目錄，以及套件本機 pnpm stores。封裝的 postinstall 也會
在修剪舊版目標根目錄前移除那些全域符號連結，讓升級
不會留下懸空的 ESM 套件匯入。

較舊的 npm 安裝也使用共用的 `~/.openclaw/npm/node_modules` 根目錄。
目前的安裝、更新、解除安裝與 doctor 流程仍會辨識該舊版
扁平根目錄，但僅用於復原與清理。新的 npm 安裝應改為建立
各外掛專案根目錄。
