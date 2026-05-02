---
read_when:
    - 你正在偵錯 Plugin 套件安裝
    - 你正在變更 Plugin 啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝版 OpenClaw 安裝或隨附的 Plugin 清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝 Plugin 套件並解析 Plugin 相依性
title: Plugin 相依性解析
x-i18n:
    generated_at: "2026-05-02T02:55:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 相依性解析

OpenClaw 將 Plugin 相依性工作保留在安裝/更新時進行。執行階段載入
不會執行套件管理器、修復相依性樹，或修改 OpenClaw
套件目錄。

## 責任分工

Plugin 套件擁有自己的相依性圖：

- 執行階段相依性位於 Plugin 套件的 `dependencies` 或
  `optionalDependencies`
- SDK/核心匯入是 peer 或由 OpenClaw 提供的匯入
- 本機開發 Plugin 會帶入自己已安裝的相依性
- npm 和 git Plugin 會安裝到 OpenClaw 擁有的套件根目錄中

OpenClaw 只擁有 Plugin 生命週期：

- 探索 Plugin 來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入 Plugin 進入點
- 當相依性遺失時，以可操作的錯誤失敗

## 安裝根目錄

OpenClaw 使用穩定的各來源根目錄：

- npm 套件安裝在 `~/.openclaw/npm` 下
- git 套件複製到 `~/.openclaw/git` 下
- 本機/路徑/封存安裝會被複製或參照，而不進行相依性修復

npm 安裝會在 npm 根目錄中執行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能會將遞移相依性提升到 Plugin 套件旁的
`~/.openclaw/npm/node_modules`。OpenClaw 會先掃描受管理的 npm 根目錄，
再信任該安裝，並在解除安裝期間使用 npm 移除由 npm 管理的套件，因此被提升的
執行階段相依性會留在受管理的清理邊界內。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

接著已安裝的 Plugin 會從該套件目錄載入，因此套件本機
和父層 `node_modules` 解析的運作方式，與一般
Node 套件相同。

## 本機 Plugin

本機 Plugin 會被視為由開發者控制的目錄。OpenClaw 不會
為它們執行 `npm install`、`pnpm install` 或相依性修復。如果本機
Plugin 有相依性，請在載入前於該 Plugin 中安裝它們。

第三方 TypeScript 本機 Plugin 可以使用緊急 Jiti 路徑。已封裝的
JavaScript Plugin 和內建的內部 Plugin 會透過原生
import/require 載入，而不是透過 Jiti。

## 啟動與重新載入

Gateway 啟動和設定重新載入絕不會安裝 Plugin 相依性。它們會讀取
Plugin 安裝記錄、計算進入點，並載入它。

如果執行階段缺少相依性，Plugin 會載入失敗，且錯誤
應指引操作員採取明確修正：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的相依性狀態，並安裝
設定中可下載但本機安裝記錄遺失的 Plugin。
它不會修復已安裝本機 Plugin 的相依性。

## 內建 Plugin

輕量且核心關鍵的內建 Plugin 會作為 OpenClaw 的一部分出貨。
它們應該沒有沉重的執行階段相依性樹，或移出成為
ClawHub/npm 上的可下載套件。

內建 Plugin manifest 不得要求相依性 staging。大型或選用的
Plugin 功能應封裝為一般 Plugin，並透過與第三方 Plugin 相同的
npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將儲存庫視為 pnpm monorepo。在
`pnpm install` 之後，內建 Plugin 會從 `extensions/<id>` 載入，因此套件本機
workspace 相依性可用，且編輯會直接被採用。原始碼
checkout 開發僅支援 pnpm；在儲存庫根目錄執行一般 `npm install`
不是準備內建 Plugin 相依性的支援方式。

| 安裝形態                         | 內建 Plugin 位置                     | 相依性擁有者                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內建的執行階段樹                 | OpenClaw 套件與明確的 Plugin 安裝/更新/doctor 流程                  |
| Git checkout 加上 `pnpm install` | `extensions/<id>` workspace 套件      | pnpm workspace，包含每個 Plugin 套件自己的相依性                    |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub Plugin 根目錄 | Plugin 安裝/更新流程                                                |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生內建 Plugin
相依性根目錄。目前的 doctor 清理會在使用 `--fix` 時移除這些過時目錄和
符號連結，包括舊的 `plugin-runtime-deps` 根目錄、
`.openclaw-runtime-deps*` manifest、產生的 Plugin `node_modules`、安裝
stage 目錄，以及套件本機 pnpm store。

這些路徑只是舊版殘留物。新的安裝不應建立它們。
