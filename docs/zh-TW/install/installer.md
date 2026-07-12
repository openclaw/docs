---
read_when:
    - 你想要瞭解 `openclaw.ai/install.sh`
    - 你想要自動化安裝（CI／無頭環境）
    - 你想要從 GitHub 簽出的版本安裝
summary: 安裝程式指令碼（install.sh、install-cli.sh、install.ps1）的運作方式、旗標與自動化
title: 安裝程式內部機制
x-i18n:
    generated_at: "2026-07-11T21:27:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 隨附三個安裝程式指令碼，由 `openclaw.ai` 提供。

| 指令碼                             | 平台                 | 功能                                                                                                  |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行初始設定。                             |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 透過 npm 或 git 將 Node 與 OpenClaw 安裝至本機前置路徑（`~/.openclaw`）。不需要 root 權限。            |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行初始設定。                             |

這三者皆支援 Node **22.19+、23.11+ 或 24+**；全新安裝預設以 Node 24 為目標版本。

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
若安裝成功，但在新的終端機中找不到 `openclaw`，請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
建議大多數 macOS/Linux/WSL 的互動式安裝使用此指令碼。
</Tip>

### 流程（install.sh）

<Steps>
  <Step title="偵測作業系統">
    支援 macOS 與 Linux（包括 WSL）。
  </Step>
  <Step title="預設確保使用 Node.js 24">
    檢查 Node 版本，並視需要安裝 Node 24（macOS 使用 Homebrew，Linux 使用 NodeSource 的 apt/dnf/yum 設定指令碼）。在 macOS 上，只有當安裝程式需要 Homebrew 來安裝 Node 或 Git 時，才會安裝 Homebrew。為維持相容性，仍支援 Node 22.19+ 與 23.11+。
    在 Alpine/musl Linux 上，安裝程式使用 apk 套件而非 NodeSource；設定的 Alpine 軟體庫必須提供受支援的 Node 版本（撰寫本文時為 Alpine 3.21 或更新版本）。
  </Step>
  <Step title="確保已安裝 Git">
    若缺少 Git，便使用偵測到的套件管理器安裝，包括 macOS 上的 Homebrew 與 Alpine 上的 apk。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方法（預設）：以 npm 全域安裝
    - `git` 方法：複製或更新儲存庫、使用 pnpm 安裝相依套件、建置，然後將包裝程式安裝至 `~/.local/bin/openclaw`

  </Step>
  <Step title="安裝後工作">
    - 解析剛安裝的 `openclaw` 執行檔，以供後續命令使用
    - 對於尚未設定的安裝，會在 doctor 或閘道探測之前啟動初始設定。使用 `--no-onboard` 或沒有 TTY 時，則會列印稍後完成設定所需的命令。
    - 對於已設定的安裝，會盡力重新整理並重新啟動已載入的閘道服務，然後執行 doctor。升級時會盡可能更新外掛；在無介面但已啟用提示的執行環境中，則列印手動命令。
    - 執行 `--verify` 時，會檢查已安裝版本，且僅在設定已存在後檢查閘道健康狀態。

  </Step>
</Steps>

### 原始碼簽出目錄偵測

若在 OpenClaw 簽出目錄（`package.json` + `pnpm-workspace.yaml`）內執行，指令碼會提供以下選項：

- 使用簽出目錄（`git`），或
- 使用全域安裝（`npm`）

若沒有可用的 TTY，且未指定安裝方法，則預設使用 `npm` 並顯示警告。

若選擇無效的方法或 `--install-method` 值無效，指令碼會以代碼 `2` 結束。

### 範例（install.sh）

<Tabs>
  <Tab title="預設">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="略過初始設定">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main 簽出目錄">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="試執行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="安裝後驗證">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                                    | 說明                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 選擇安裝方法（預設：`npm`）                                             |
| `--npm`                                 | npm 方法的快捷旗標                                                      |
| `--git \| --github`                     | git 方法的快捷旗標                                                      |
| `--version <version\|dist-tag\|spec>`   | npm 版本、dist-tag 或套件規格（預設：`latest`）                          |
| `--beta`                                | 若可用則使用 beta dist-tag，否則回退至 `latest`                          |
| `--git-dir \| --dir <path>`             | 簽出目錄（預設：`~/openclaw`）                                          |
| `--no-git-update`                       | 略過現有簽出目錄的 `git pull`                                           |
| `--no-prompt`                           | 停用提示                                                                |
| `--no-onboard`                          | 略過初始設定                                                            |
| `--onboard`                             | 啟用初始設定                                                            |
| `--verify`                              | 執行安裝後的冒煙驗證（`--version`；若已載入則檢查閘道健康狀態）         |
| `--dry-run`                             | 列印操作但不套用變更                                                    |
| `--verbose`                             | 啟用偵錯輸出（`set -x`、npm notice 等級記錄）                            |
| `--help \| -h`                          | 顯示用法                                                                |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                              | 說明                                                            |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安裝方法                                                        |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag 或套件規格                                   |
| `OPENCLAW_BETA=0\|1`                              | 若可用則使用 beta                                               |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 狀態及預設 git/初始設定路徑的基礎目錄                  |
| `OPENCLAW_GIT_DIR=<path>`                         | 簽出目錄                                                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 切換 git 更新                                                   |
| `OPENCLAW_NO_PROMPT=1`                            | 停用提示                                                        |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 執行安裝後的冒煙驗證                                            |
| `OPENCLAW_NO_ONBOARD=1`                           | 略過初始設定                                                    |
| `OPENCLAW_DRY_RUN=1`                              | 試執行模式                                                      |
| `OPENCLAW_VERBOSE=1`                              | 偵錯模式                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 記錄等級（預設：`error`，隱藏 npm 棄用雜訊）                |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
專為希望將所有項目置於本機前置路徑（預設為 `~/.openclaw`），且不依賴系統 Node 的環境所設計。預設支援 npm 安裝，也支援在相同前置路徑流程下使用 git 簽出目錄安裝。
</Info>

### 流程（install-cli.sh）

<Steps>
  <Step title="安裝本機 Node 執行環境">
    將固定版本且受支援的 Node LTS tarball（版本嵌入指令碼中並獨立更新，預設為 `22.22.2`）下載至 `<prefix>/tools/node-v<version>`，並驗證 SHA-256。
    在 Node 未針對固定執行環境發布相容 tarball 的 Alpine/musl Linux 上，會使用 `apk` 安裝 `nodejs` 與 `npm`，並將該執行環境連結至前置路徑的包裝程式路徑。Alpine 軟體庫必須提供受支援的 Node 版本（22.19+、23.11+ 或 24+）；若舊版軟體庫僅提供 Node 20 或 21，請使用 Alpine 3.21 或更新版本。
  </Step>
  <Step title="確保已安裝 Git">
    若缺少 Git，會嘗試在 Linux 上透過 apt/dnf/yum/apk 安裝，或在 macOS 上透過 Homebrew 安裝。
  </Step>
  <Step title="在前置路徑下安裝 OpenClaw">
    - `npm` 方法（預設）：使用 npm 安裝至前置路徑，然後將包裝程式寫入 `<prefix>/bin/openclaw`
    - `git` 方法：複製或更新簽出目錄（預設為 `~/openclaw`），並仍將包裝程式寫入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="重新整理已載入的閘道服務">
    若已從相同前置路徑載入閘道服務，指令碼會執行
    `openclaw gateway install --force`，接著執行 `openclaw gateway restart`，並
    盡力探測閘道健康狀態。
  </Step>
</Steps>

### 範例（install-cli.sh）

<Tabs>
  <Tab title="預設">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="自訂前置路徑與版本">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="自動化 JSON 輸出">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="執行初始設定">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                                    | 說明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | 安裝前綴（預設：`~/.openclaw`）                                         |
| `--install-method \| --method npm\|git` | 選擇安裝方式（預設：`npm`）                                          |
| `--npm`                                 | npm 安裝方式的快速選項                                                         |
| `--git \| --github`                     | git 安裝方式的快速選項                                                         |
| `--git-dir \| --dir <path>`             | Git 簽出目錄（預設：`~/openclaw`）                                  |
| `--version <ver>`                       | OpenClaw 版本或發行標籤（預設：`latest`）                                |
| `--node-version <ver>`                  | 節點版本（預設：`22.22.2`）                                               |
| `--json`                                | 輸出 NDJSON 事件                                                              |
| `--onboard`                             | 安裝後執行 `openclaw onboard`                                            |
| `--no-onboard`                          | 略過引導設定（預設）                                                       |
| `--set-npm-prefix`                      | 在 Linux 上，若目前的 npm 前綴不可寫入，則強制將其設為 `~/.npm-global` |
| `--help \| -h`                          | 顯示用法                                                                      |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                    | 說明                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 安裝前綴                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安裝方式                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或發行標籤                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | 節點版本                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 狀態及預設 git／引導設定路徑的基礎目錄 |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安裝的 Git 簽出目錄                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切換現有簽出目錄的 git 更新                          |
| `OPENCLAW_NO_ONBOARD=1`                     | 略過引導設定                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 記錄層級（預設：`error`）                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 和其他 GitHub 原始碼規格不是 npm 安裝的有效 `--version` 目標。請改用 `--install-method git --version main`。
</Note>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="確保 PowerShell 與 Windows 環境">
    需要 PowerShell 5 或更新版本。
  </Step>
  <Step title="預設確保使用 Node.js 24">
    若缺少，會依序嘗試透過 winget、Chocolatey、Scoop 安裝。若沒有可用的套件管理器，指令碼會將官方 Node.js 24 Windows zip 下載至 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`，並將其加入目前處理程序與使用者的 PATH。為了相容性，仍支援 Node 22.19+ 和 23.11+。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方式（預設）：使用選定的 `-Tag` 進行全域 npm 安裝，並從可寫入的安裝程式暫存目錄啟動，因此在 `C:\` 等受保護資料夾中開啟的殼層仍可正常運作
    - `git` 方式：複製／更新儲存庫、使用 pnpm 安裝／建置，並在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安裝包裝程式。若缺少 Git，指令碼會在 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 下啟動使用者本機的 MinGit，並將其加入目前處理程序與使用者的 PATH。

  </Step>
  <Step title="安裝後工作">
    - 可能時將所需的二進位目錄加入使用者 PATH
    - 以盡力而為的方式重新整理已載入的閘道服務（`openclaw gateway install --force`，接著重新啟動）
    - 升級與 git 安裝時執行 `openclaw doctor --non-interactive`（盡力而為）

  </Step>
  <Step title="處理失敗">
    `iwr ... | iex` 和指令碼區塊安裝會回報終止錯誤，但不會關閉目前的 PowerShell 工作階段。直接使用 `powershell -File`／`pwsh -File` 安裝時，仍會以非零狀態碼結束，以便自動化處理。
  </Step>
</Steps>

### 範例（install.ps1）

<Tabs>
  <Tab title="預設">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main 簽出">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="自訂 git 目錄">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="試執行">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                        | 說明                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安裝方式（預設：`npm`）                            |
| `-Tag <tag\|version\|spec>` | npm 發行標籤、版本或套件規格（預設：`latest`） |
| `-GitDir <path>`            | 簽出目錄（預設：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | 略過引導設定                                            |
| `-NoGitUpdate`              | 略過 `git pull`                                            |
| `-DryRun`                   | 僅列印動作                                         |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                           | 說明        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安裝方式     |
| `OPENCLAW_GIT_DIR=<path>`          | 簽出目錄 |
| `OPENCLAW_NO_ONBOARD=1`            | 略過引導設定    |
| `OPENCLAW_GIT_UPDATE=0`            | 停用 git pull   |
| `OPENCLAW_DRY_RUN=1`               | 試執行模式       |

  </Accordion>
</AccordionGroup>

<Note>
若使用 `-InstallMethod git` 且缺少 Git，指令碼會先嘗試啟動使用者本機的 MinGit，之後才列印 Git for Windows 連結。
</Note>

---

## CI 與自動化

使用非互動式旗標／環境變數，以確保執行結果可預期。

<Tabs>
  <Tab title="install.sh（非互動式 npm）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh（非互動式 git）">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh（JSON）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1（略過引導設定）">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="為什麼需要 Git？">
    `git` 安裝方式需要 Git。對於 `npm` 安裝，仍會檢查／安裝 Git，以避免相依套件使用 git URL 時發生 `spawn git ENOENT` 錯誤。
  </Accordion>

  <Accordion title="為什麼 npm 在 Linux 上遇到 EACCES？">
    某些 Linux 設定會將 npm 的全域前綴指向由 root 擁有的路徑。`install.sh` 可將前綴切換至 `~/.npm-global`，並將 PATH 匯出設定附加至殼層 rc 檔案（若這些檔案存在）。
  </Accordion>

  <Accordion title='Windows：「npm error spawn git / ENOENT」'>
    重新執行安裝程式，讓它啟動使用者本機的 MinGit，或安裝 Git for Windows 並重新開啟 PowerShell。
  </Accordion>

  <Accordion title='Windows：「無法辨識 openclaw」'>
    執行 `npm config get prefix`，並將該目錄加入使用者 PATH（Windows 上不需要 `\bin` 後綴），然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何取得詳細的安裝程式輸出">
    `install.ps1` 不提供 `-Verbose` 開關。
    請使用 PowerShell 追蹤進行指令碼層級的診斷：

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="安裝後找不到 openclaw">
    通常是 PATH 問題。請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
  </Accordion>
</AccordionGroup>

## 相關內容

- [安裝概覽](/zh-TW/install)
- [更新](/zh-TW/install/updating)
- [解除安裝](/zh-TW/install/uninstall)
