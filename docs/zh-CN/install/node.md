---
read_when:
    - 安装 OpenClaw 之前，你需要先安装 Node.js
    - 你安装了 OpenClaw，但 `openclaw` 提示找不到命令
    - npm install -g 因权限或 PATH 问题失败
summary: 为 OpenClaw 安装和配置 Node.js - 版本要求、安装选项和 PATH 故障排除
title: Node.js
x-i18n:
    generated_at: "2026-06-27T02:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw 需要 **Node 22.19 或更新版本**。**Node 24 是安装、CI 和发布工作流的默认且推荐的运行时**。Node 22 仍通过活跃的 LTS 线受支持。[安装程序脚本](/zh-CN/install#alternative-install-methods)会自动检测并安装 Node - 本页适用于你想自行设置 Node，并确保所有内容都正确连接（版本、PATH、全局安装）的情况。

## 检查你的版本

```bash
node -v
```

如果输出 `v24.x.x` 或更高版本，则你使用的是推荐默认版本。如果输出 `v22.19.x` 或更高版本，则你使用的是受支持的 Node 22 LTS 路径，但我们仍建议在方便时升级到 Node 24。如果未安装 Node 或版本过旧，请从下面选择一种安装方法。

## 安装 Node

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推荐）：

    ```bash
    brew install node
    ```

    或者从 [nodejs.org](https://nodejs.org/) 下载 macOS 安装程序。

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

    或使用版本管理器（见下文）。

  </Tab>
  <Tab title="Windows">
    **winget**（推荐）：

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey：**

    ```powershell
    choco install nodejs-lts
    ```

    或者从 [nodejs.org](https://nodejs.org/) 下载 Windows 安装程序。

  </Tab>
</Tabs>

<Accordion title="使用版本管理器（nvm、fnm、mise、asdf）">
  版本管理器让你可以轻松切换 Node 版本。常用选项：

- [**fnm**](https://github.com/Schniz/fnm) - 快速、跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) - 在 macOS/Linux 上广泛使用
- [**mise**](https://mise.jdx.dev/) - 多语言（Node、Python、Ruby 等）

fnm 示例：

```bash
fnm install 24
fnm use 24
```

  <Warning>
  确保你的版本管理器已在 shell 启动文件（`~/.zshrc` 或 `~/.bashrc`）中初始化。如果没有初始化，新的终端会话中可能找不到 `openclaw`，因为 PATH 不会包含 Node 的 bin 目录。
  </Warning>
</Accordion>

## 故障排除

### `openclaw: command not found`

这几乎总是意味着 npm 的全局 bin 目录不在你的 PATH 中。

<Steps>
  <Step title="查找你的全局 npm 前缀">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="检查它是否在你的 PATH 中">
    ```bash
    echo "$PATH"
    ```

    在输出中查找 `<npm-prefix>/bin`（macOS/Linux）或 `<npm-prefix>`（Windows）。

  </Step>
  <Step title="将其添加到你的 shell 启动文件">
    <Tabs>
      <Tab title="macOS / Linux">
        添加到 `~/.zshrc` 或 `~/.bashrc`：

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然后打开一个新终端（或在 zsh 中运行 `rehash` / 在 bash 中运行 `hash -r`）。
      </Tab>
      <Tab title="Windows">
        通过设置 → 系统 → 环境变量，将 `npm prefix -g` 的输出添加到你的系统 PATH。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` 的权限错误（Linux）

如果你看到 `EACCES` 错误，请将 npm 的全局前缀切换到用户可写目录：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

将 `export PATH=...` 这一行添加到你的 `~/.bashrc` 或 `~/.zshrc`，使其永久生效。

## 相关内容

- [安装概览](/zh-CN/install) - 所有安装方法
- [更新](/zh-CN/install/updating) - 让 OpenClaw 保持最新
- [入门指南](/zh-CN/start/getting-started) - 安装后的第一步
