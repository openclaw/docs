---
read_when:
    - 安装 OpenClaw 前需要先安装 Node.js
    - 你已安装 OpenClaw，但系统提示 `openclaw`：command not found
    - npm install -g 因权限或 PATH 问题而失败
summary: 为 OpenClaw 安装和配置 Node.js——版本要求、安装选项和 PATH 故障排查
title: Node.js
x-i18n:
    generated_at: "2026-07-14T13:50:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw 要求使用 **Node 22.22.3+、Node 24.15+ 或 Node 25.9+**。对于安装、CI 和发布工作流，**Node 24 是默认且推荐的运行时**；Node 22 仍通过活跃的 LTS 版本线获得支持。不支持 Node 23。[安装程序脚本](/zh-CN/install#alternative-install-methods)会自动检测并安装 Node——如果你想自行设置 Node（版本、PATH、全局安装），请参考本页面。

## 检查版本

```bash
node -v
```

`v24.15.0` 或更新的 24.x 版本是推荐的默认选择。`v22.22.3` 或更新的 22.x 版本是受支持的 Node 22 LTS 路径；Node `v25.9.0+` 也受支持。不支持 Node 23。如果未安装 Node 或版本不在支持范围内，请选择下方的安装方式。

## 安装 Node

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推荐）：

    ```bash
    brew install node
    ```

    或从 [nodejs.org](https://nodejs.org/) 下载安装 macOS 安装程序。

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

    或从 [nodejs.org](https://nodejs.org/) 下载安装 Windows 安装程序。

  </Tab>
</Tabs>

<Accordion title="使用版本管理器（nvm、fnm、mise、asdf）">
  版本管理器可让你轻松切换 Node 版本。常用选项包括：

- [**fnm**](https://github.com/Schniz/fnm) - 快速、跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) - 在 macOS/Linux 上广泛使用
- [**mise**](https://mise.jdx.dev/) - 多语言版本管理器（Node、Python、Ruby 等）

使用 fnm 的示例：

```bash
fnm install 24
fnm use 24
```

  <Warning>
  请在 shell 启动文件（`~/.zshrc` 或 `~/.bashrc`）中初始化版本管理器。如果跳过此步骤，新终端会话中可能找不到 `openclaw`，因为 PATH 不会包含 Node 的 bin 目录。
  </Warning>
</Accordion>

## 故障排查

### `openclaw: command not found`

这几乎总是意味着 npm 的全局 bin 目录不在 PATH 中。

<Steps>
  <Step title="查找 npm 的全局前缀">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="检查它是否在 PATH 中">
    ```bash
    echo "$PATH"
    ```

    在输出中查找 `<npm-prefix>/bin`（macOS/Linux）或 `<npm-prefix>`（Windows）。

  </Step>
  <Step title="将其添加到 shell 启动文件">
    <Tabs>
      <Tab title="macOS / Linux">
        添加到 `~/.zshrc` 或 `~/.bashrc`：

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然后打开新终端（或在 zsh 中运行 `rehash` / 在 bash 中运行 `hash -r`）。
      </Tab>
      <Tab title="Windows">
        通过 Settings → System → Environment Variables 将 `npm prefix -g` 的输出添加到系统 PATH。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` 上的权限错误（Linux）

如果看到 `EACCES` 错误，请将 npm 的全局前缀切换到用户可写目录：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

将 `export PATH=...` 行添加到 `~/.bashrc` 或 `~/.zshrc`，使其永久生效。

## 相关内容

- [安装概览](/zh-CN/install) - 所有安装方式
- [更新](/zh-CN/install/updating) - 让 OpenClaw 保持最新
- [入门指南](/zh-CN/start/getting-started) - 安装后的初始步骤
