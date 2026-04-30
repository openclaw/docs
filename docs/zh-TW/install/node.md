---
read_when:
    - 安裝 OpenClaw 之前，需要先安裝 Node.js
    - 你已安裝 OpenClaw，但找不到 `openclaw` 命令
    - npm install -g 因權限或 PATH 問題而失敗
summary: 為 OpenClaw 安裝並設定 Node.js — 版本需求、安裝選項與 PATH 疑難排解
title: Node.js
x-i18n:
    generated_at: "2026-04-30T03:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 16
---

OpenClaw 需要 **Node 22.14 或更新版本**。**Node 24 是安裝、CI 與發布工作流程的預設且建議執行環境**。Node 22 仍透過目前的 LTS 分支受到支援。[安裝程式指令碼](/zh-TW/install#alternative-install-methods)會自動偵測並安裝 Node，本頁適用於你想自行設定 Node，並確認所有項目都已正確串接時使用（版本、PATH、全域安裝）。

## 檢查你的版本

```bash
node -v
```

如果輸出 `v24.x.x` 或更高版本，表示你正在使用建議的預設版本。如果輸出 `v22.14.x` 或更高版本，表示你正在使用受支援的 Node 22 LTS 路徑，但我們仍建議在方便時升級到 Node 24。如果尚未安裝 Node，或版本太舊，請從下方選擇一種安裝方式。

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

    或使用版本管理工具（見下方）。

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  版本管理工具可讓你輕鬆在不同 Node 版本之間切換。常見選項：

- [**fnm**](https://github.com/Schniz/fnm) — 快速、跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) — 在 macOS/Linux 上廣泛使用
- [**mise**](https://mise.jdx.dev/) — 多語言（Node、Python、Ruby 等）

fnm 範例：

```bash
fnm install 24
fnm use 24
```

  <Warning>
  請確認你的版本管理工具已在 shell 啟動檔（`~/.zshrc` 或 `~/.bashrc`）中初始化。如果沒有，新的終端機工作階段可能找不到 `openclaw`，因為 PATH 不會包含 Node 的 bin 目錄。
  </Warning>
</Accordion>

## 疑難排解

### `openclaw: command not found`

這幾乎總是表示 npm 的全域 bin 目錄不在你的 PATH 中。

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    在輸出中尋找 `<npm-prefix>/bin`（macOS/Linux）或 `<npm-prefix>`（Windows）。

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        加入到 `~/.zshrc` 或 `~/.bashrc`：

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然後開啟新的終端機（或在 zsh 中執行 `rehash` / 在 bash 中執行 `hash -r`）。
      </Tab>
      <Tab title="Windows">
        透過「設定」→「系統」→「環境變數」，將 `npm prefix -g` 的輸出加入系統 PATH。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` 的權限錯誤（Linux）

如果你看到 `EACCES` 錯誤，請將 npm 的全域 prefix 切換到使用者可寫入的目錄：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

將 `export PATH=...` 這一行加入你的 `~/.bashrc` 或 `~/.zshrc`，讓設定永久生效。

## 相關

- [安裝概覽](/zh-TW/install) — 所有安裝方式
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新狀態
- [開始使用](/zh-TW/start/getting-started) — 安裝後的第一步
