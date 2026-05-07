---
read_when:
    - 您想了解 `openclaw.ai/install.sh`
    - 你想要自動化安裝（持續整合 / 無介面）
    - 您想從 GitHub 簽出的程式碼安裝
summary: 安裝程式腳本（install.sh、install-cli.sh、install.ps1）的運作方式、旗標與自動化
title: 安裝程式內部機制
x-i18n:
    generated_at: "2026-05-07T13:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 提供三個安裝程式腳本，從 `openclaw.ai` 提供服務。

| 腳本                               | 平台                 | 功能                                                                                                           |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行上線導引。                                      |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 將 Node + OpenClaw 以 npm 或 git checkout 模式安裝到本機前置目錄 (`~/.openclaw`)。不需要 root 權限。           |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行上線導引。                                      |

## 快速命令

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
如果安裝成功但在新的終端機中找不到 `openclaw`，請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
建議用於大多數 macOS/Linux/WSL 的互動式安裝。
</Tip>

### 流程 (install.sh)

<Steps>
  <Step title="Detect OS">
    支援 macOS 和 Linux（包括 WSL）。如果偵測到 macOS，且缺少 Homebrew，則會安裝 Homebrew。
  </Step>
  <Step title="Ensure Node.js 24 by default">
    檢查 Node 版本，並在需要時安裝 Node 24（macOS 使用 Homebrew，Linux apt/dnf/yum 使用 NodeSource 設定腳本）。為了相容性，OpenClaw 仍支援 Node 22 LTS，目前為 `22.16+`。
  </Step>
  <Step title="Ensure Git">
    如果缺少 Git，則會安裝 Git。
  </Step>
  <Step title="Install OpenClaw">
    - `npm` 方法（預設）：全域 npm 安裝
    - `git` 方法：複製/更新 repo，使用 pnpm 安裝相依套件、建置，然後在 `~/.local/bin/openclaw` 安裝包裝器

  </Step>
  <Step title="Post-install tasks">
    - 盡力重新整理已載入的 gateway 服務（`openclaw gateway install --force`，接著重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（盡力而為）
    - 在適當時嘗試上線導引（TTY 可用、未停用上線導引，且 bootstrap/config 檢查通過）
    - 預設 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### 原始碼 checkout 偵測

如果在 OpenClaw checkout（`package.json` + `pnpm-workspace.yaml`）內執行，腳本會提供：

- 使用 checkout (`git`)，或
- 使用全域安裝 (`npm`)

如果沒有可用的 TTY，且未設定安裝方法，則預設為 `npm` 並顯示警告。

此腳本會針對無效的方法選擇或無效的 `--install-method` 值，以代碼 `2` 結束。

### 範例 (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 旗標                                  | 說明                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | 選擇安裝方法（預設：`npm`）。別名：`--method`              |
| `--npm`                               | npm 方法的捷徑                                            |
| `--git`                               | git 方法的捷徑。別名：`--github`                          |
| `--version <version\|dist-tag\|spec>` | npm 版本、dist-tag 或套件規格（預設：`latest`）           |
| `--beta`                              | 如果可用則使用 beta dist-tag，否則退回 `latest`           |
| `--git-dir <path>`                    | Checkout 目錄（預設：`~/openclaw`）。別名：`--dir`        |
| `--no-git-update`                     | 對既有 checkout 略過 `git pull`                           |
| `--no-prompt`                         | 停用提示                                                   |
| `--no-onboard`                        | 略過上線導引                                               |
| `--onboard`                           | 啟用上線導引                                               |
| `--dry-run`                           | 列印動作但不套用變更                                       |
| `--verbose`                           | 啟用偵錯輸出（`set -x`、npm notice-level 日誌）            |
| `--help`                              | 顯示用法（`-h`）                                           |

  </Accordion>

  <Accordion title="Environment variables reference">

| 變數                                                    | 說明                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | 安裝方法                                      |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm 版本、dist-tag 或套件規格                 |
| `OPENCLAW_BETA=0\|1`                                    | 如果可用則使用 beta                          |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout 目錄                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | 切換 git 更新                                 |
| `OPENCLAW_NO_PROMPT=1`                                  | 停用提示                                      |
| `OPENCLAW_NO_ONBOARD=1`                                 | 略過上線導引                                  |
| `OPENCLAW_DRY_RUN=1`                                    | Dry run 模式                                  |
| `OPENCLAW_VERBOSE=1`                                    | 偵錯模式                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm 日誌層級                                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | 控制 sharp/libvips 行為（預設：`1`）          |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
專為希望所有內容都位於本機前置目錄（預設 `~/.openclaw`）且不依賴系統 Node 的環境設計。預設支援 npm 安裝，也支援在同一前置目錄流程下進行 git-checkout 安裝。
</Info>

### 流程 (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    將固定的受支援 Node LTS tarball（版本內嵌於腳本中並獨立更新）下載到 `<prefix>/tools/node-v<version>`，並驗證 SHA-256。
  </Step>
  <Step title="Ensure Git">
    如果缺少 Git，會嘗試在 Linux 上透過 apt/dnf/yum 安裝，或在 macOS 上透過 Homebrew 安裝。
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` 方法（預設）：使用 npm 安裝到該前置目錄下，然後將包裝器寫入 `<prefix>/bin/openclaw`
    - `git` 方法：複製/更新 checkout（預設 `~/openclaw`），並仍將包裝器寫入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    如果 gateway 服務已從相同前置目錄載入，腳本會執行
    `openclaw gateway install --force`，接著執行 `openclaw gateway restart`，並
    盡力探測 gateway 健康狀態。
  </Step>
</Steps>

### 範例 (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 旗標                        | 說明                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | 安裝前置目錄（預設：`~/.openclaw`）                                             |
| `--install-method npm\|git` | 選擇安裝方法（預設：`npm`）。別名：`--method`                                   |
| `--npm`                     | npm 方法的捷徑                                                                  |
| `--git`, `--github`         | git 方法的捷徑                                                                  |
| `--git-dir <path>`          | Git checkout 目錄（預設：`~/openclaw`）。別名：`--dir`                          |
| `--version <ver>`           | OpenClaw 版本或 dist-tag（預設：`latest`）                                      |
| `--node-version <ver>`      | Node 版本（預設：`22.22.0`）                                                    |
| `--json`                    | 發出 NDJSON 事件                                                                |
| `--onboard`                 | 安裝後執行 `openclaw onboard`                                                   |
| `--no-onboard`              | 略過上線導引（預設）                                                            |
| `--set-npm-prefix`          | 在 Linux 上，如果目前前置目錄不可寫入，則強制 npm 前置目錄為 `~/.npm-global`   |
| `--help`                    | 顯示用法（`-h`）                                                                |

  </Accordion>

  <Accordion title="Environment variables reference">

| 變數                                    | 說明                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 安裝前置路徑                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安裝方式                                |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | Git 安裝的 Git 簽出目錄       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切換現有簽出的 git 更新     |
| `OPENCLAW_NO_ONBOARD=1`                     | 略過入門設定                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 記錄層級                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | 控制 sharp/libvips 行為（預設：`1`） |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    需要 PowerShell 5+。
  </Step>
  <Step title="Ensure Node.js 24 by default">
    如果缺少，會嘗試透過 winget 安裝，接著是 Chocolatey，然後是 Scoop。Node 22 LTS，目前為 `22.16+`，仍支援相容性用途。
  </Step>
  <Step title="Install OpenClaw">
    - `npm` 方式（預設）：使用選定的 `-Tag` 進行全域 npm 安裝，並從可寫入的安裝程式暫存目錄啟動，因此在 `C:\` 等受保護資料夾中開啟的 shell 仍可運作
    - `git` 方式：複製/更新 repo，使用 pnpm 安裝/建置，並將包裝程式安裝到 `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Post-install tasks">
    - 盡可能將所需的 bin 目錄加入使用者 PATH
    - 盡力重新整理已載入的 Gateway 服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（盡力而為）

  </Step>
  <Step title="Handle failures">
    `iwr ... | iex` 和 scriptblock 安裝會回報終止錯誤，但不會關閉目前的 PowerShell 工作階段。直接使用 `powershell -File` / `pwsh -File` 安裝時，仍會為自動化流程以非零狀態結束。
  </Step>
</Steps>

### 範例（install.ps1）

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 目前還沒有專用的 -Verbose 旗標。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 旗標                        | 說明                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安裝方式（預設：`npm`）                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或套件規格（預設：`latest`） |
| `-GitDir <path>`            | 簽出目錄（預設：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | 略過入門設定                                            |
| `-NoGitUpdate`              | 略過 `git pull`                                            |
| `-DryRun`                   | 僅列印動作                                         |

  </Accordion>

  <Accordion title="Environment variables reference">

| 變數                           | 說明        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安裝方式     |
| `OPENCLAW_GIT_DIR=<path>`          | 簽出目錄 |
| `OPENCLAW_NO_ONBOARD=1`            | 略過入門設定    |
| `OPENCLAW_GIT_UPDATE=0`            | 停用 git pull   |
| `OPENCLAW_DRY_RUN=1`               | Dry run 模式       |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，指令碼會結束並列印 Git for Windows 連結。
</Note>

---

## CI 與自動化

使用非互動式旗標/環境變數，以取得可預測的執行結果。

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="Why is Git required?">
    `git` 安裝方式需要 Git。對於 `npm` 安裝，仍會檢查/安裝 Git，以避免依賴項目使用 git URL 時發生 `spawn git ENOENT` 失敗。
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    某些 Linux 設定會將 npm 全域前置路徑指向 root 擁有的路徑。`install.sh` 可以將前置路徑切換到 `~/.npm-global`，並將 PATH 匯出附加到 shell rc 檔案（當這些檔案存在時）。
  </Accordion>

  <Accordion title="sharp/libvips issues">
    指令碼預設使用 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`，以避免 sharp 針對系統 libvips 建置。若要覆寫：

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    安裝 Git for Windows，重新開啟 PowerShell，然後重新執行安裝程式。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    執行 `npm config get prefix`，並將該目錄加入使用者 PATH（Windows 上不需要 `\bin` 後綴），然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` 目前未公開 `-Verbose` 開關。
    使用 PowerShell 追蹤進行指令碼層級診斷：

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    通常是 PATH 問題。請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
  </Accordion>
</AccordionGroup>

## 相關

- [安裝總覽](/zh-TW/install)
- [更新](/zh-TW/install/updating)
- [解除安裝](/zh-TW/install/uninstall)
