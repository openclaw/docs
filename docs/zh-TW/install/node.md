---
read_when:
    - 安裝 OpenClaw 之前，您需要先安裝 Node.js
    - 你已安裝 OpenClaw，但系統顯示找不到 `openclaw` 命令
    - npm install -g 因權限或 PATH 問題而失敗
summary: 安裝並設定 OpenClaw 的 Node.js——版本需求、安裝選項與 PATH 疑難排解
title: Node.js
x-i18n:
    generated_at: "2026-07-11T21:26:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw 需要 **Node 22.19+、Node 23.11+ 或 Node 24+**。**Node 24 是安裝、CI 與發布工作流程的預設及建議執行環境**；Node 22 仍透過現行的 LTS 系列獲得支援。[安裝程式指令碼](/zh-TW/install#alternative-install-methods)會自動偵測並安裝 Node——若您想自行設定 Node（版本、PATH、全域安裝），請參閱本頁。

## 檢查您的版本

```bash
node -v
```

建議預設使用 `v24.x.x` 或更高版本。`v22.19.x` 或更高版本是受支援的 Node 22 LTS 路徑（方便時請升級至 Node 24）。不支援 `v23.11.0` 之前的 Node 23 組建版本。如果尚未安裝 Node，或版本不在支援範圍內，請選擇以下其中一種安裝方式。

## 安裝 Node

<Tabs>
  <Tab title="macOS">
    **Homebrew**（建議）：

    ```bash
    brew install node
    ```

    或從 [nodejs.org](https://nodejs.org/) 下載 macOS 安裝程式。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian：**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL：**

    ```bash
    sudo dnf install nodejs
    ```

    或使用版本管理器（見下文）。

  </Tab>
  <Tab title="Windows">
    **winget**（建議）：

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey：**

    ```powershell
    choco install nodejs-lts
    ```

    或從 [nodejs.org](https://nodejs.org/) 下載 Windows 安裝程式。

  </Tab>
</Tabs>

<Accordion title="使用版本管理器（nvm、fnm、mise、asdf）">
  版本管理器可讓您輕鬆切換不同的 Node 版本。常見選項包括：

- [**fnm**](https://github.com/Schniz/fnm) - 快速且支援跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) - 在 macOS/Linux 上廣泛使用
- [**mise**](https://mise.jdx.dev/) - 支援多種語言（Node、Python、Ruby 等）

使用 fnm 的範例：

```bash
fnm install 24
fnm use 24
```

  <Warning>
  請在您的 Shell 啟動檔案（`~/.zshrc` 或 `~/.bashrc`）中初始化版本管理器。若略過此步驟，新的終端工作階段可能會找不到 `openclaw`，因為 PATH 不會包含 Node 的 bin 目錄。
  </Warning>
</Accordion>

## 疑難排解

### `openclaw: command not found`

這幾乎總是表示 npm 的全域 bin 目錄不在您的 PATH 中。

<Steps>
  <Step title="找出 npm 的全域前綴">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="檢查它是否位於您的 PATH 中">
    ```bash
    echo "$PATH"
    ```

    請在輸出中尋找 `<npm-prefix>/bin`（macOS/Linux）或 `<npm-prefix>`（Windows）。

  </Step>
  <Step title="將它加入您的 Shell 啟動檔案">
    <Tabs>
      <Tab title="macOS / Linux">
        加入 `~/.zshrc` 或 `~/.bashrc`：

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然後開啟新的終端機（或在 zsh 中執行 `rehash`／在 bash 中執行 `hash -r`）。
      </Tab>
      <Tab title="Windows">
        透過 Settings → System → Environment Variables，將 `npm prefix -g` 的輸出加入系統 PATH。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### 在 Linux 上執行 `npm install -g` 時發生權限錯誤

如果看到 `EACCES` 錯誤，請將 npm 的全域前綴切換至使用者可寫入的目錄：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

將 `export PATH=...` 這一行加入您的 `~/.bashrc` 或 `~/.zshrc`，使設定永久生效。

## 相關內容

- [安裝概覽](/zh-TW/install) - 所有安裝方式
- [更新](/zh-TW/install/updating) - 讓 OpenClaw 保持最新版本
- [開始使用](/zh-TW/start/getting-started) - 安裝後的初始步驟
