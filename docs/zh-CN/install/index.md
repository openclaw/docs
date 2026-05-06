---
read_when:
    - 你需要一种不同于入门指南快速开始的安装方法
    - 你想部署到云平台
    - 你需要更新、迁移或卸载
summary: 安装 OpenClaw - 安装脚本、npm/pnpm/bun、从源码安装、Docker 等
title: 安装
x-i18n:
    generated_at: "2026-05-06T02:09:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## 系统要求

- **Node 24**（推荐）或 Node 22.14+ - 安装器脚本会自动处理
- **macOS、Linux 或 Windows** - 支持原生 Windows 和 WSL2；WSL2 更稳定。请参阅 [Windows](/zh-CN/platforms/windows)。
- 只有从源码构建时才需要 `pnpm`

## 推荐：安装器脚本

最快的安装方式。它会检测你的操作系统，按需安装 Node，安装 OpenClaw，并启动新手引导。

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

如需安装但不运行新手引导：

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

如需了解所有标志和 CI/自动化选项，请参阅 [安装器内部机制](/zh-CN/install/installer)。

## 其他安装方法

### 本地前缀安装器（`install-cli.sh`）

当你想把 OpenClaw 和 Node 保存在本地前缀（例如
`~/.openclaw`）下，而不依赖系统级 Node 安装时，请使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它默认支持 npm 安装，也支持在同一前缀流程下进行 git-checkout 安装。完整参考：[安装器内部机制](/zh-CN/install/installer#install-clish)。

已经安装了？使用 `openclaw update --channel dev` 和 `openclaw update --channel stable` 在包安装和 git 安装之间切换。请参阅
[更新](/zh-CN/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已经自己管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 要求显式批准带有构建脚本的包。首次安装后运行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    全局 CLI 安装路径支持 Bun。对于 Gateway 网关运行时，Node 仍然是推荐的守护进程运行时。
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  如果 `sharp` 因全局安装的 libvips 而失败：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### 从源码安装

适用于贡献者，或任何想从本地检出运行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

也可以跳过链接，在仓库内使用 `pnpm openclaw ...`。完整开发工作流请参阅 [设置](/zh-CN/start/setup)。

### 从 GitHub main 安装

```bash
npm install -g github:openclaw/openclaw#main
```

### 容器和包管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-CN/install/docker" icon="container">
    容器化或无头部署。
  </Card>
  <Card title="Podman" href="/zh-CN/install/podman" icon="container">
    Docker 的无 root 容器替代方案。
  </Card>
  <Card title="Nix" href="/zh-CN/install/nix" icon="snowflake">
    通过 Nix flake 进行声明式安装。
  </Card>
  <Card title="Ansible" href="/zh-CN/install/ansible" icon="server">
    自动化机群预配。
  </Card>
  <Card title="Bun" href="/zh-CN/install/bun" icon="zap">
    通过 Bun 运行时仅使用 CLI。
  </Card>
</CardGroup>

## 验证安装

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

如果你希望安装后进行托管启动：

- macOS：通过 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 使用 LaunchAgent
- Linux/WSL2：通过相同命令使用 systemd 用户服务
- 原生 Windows：优先使用计划任务；如果任务创建被拒绝，则回退到每用户的启动文件夹登录项

## 托管和部署

在云服务器或 VPS 上部署 OpenClaw：

<CardGroup cols={3}>
  <Card title="VPS" href="/zh-CN/vps">任何 Linux VPS</Card>
  <Card title="Docker VM" href="/zh-CN/install/docker-vm-runtime">共享 Docker 步骤</Card>
  <Card title="Kubernetes" href="/zh-CN/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/zh-CN/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/zh-CN/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/zh-CN/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/zh-CN/install/azure">Azure</Card>
  <Card title="Railway" href="/zh-CN/install/railway">Railway</Card>
  <Card title="Render" href="/zh-CN/install/render">Render</Card>
  <Card title="Northflank" href="/zh-CN/install/northflank">Northflank</Card>
</CardGroup>

## 更新、迁移或卸载

<CardGroup cols={3}>
  <Card title="Updating" href="/zh-CN/install/updating" icon="refresh-cw">
    让 OpenClaw 保持最新。
  </Card>
  <Card title="Migrating" href="/zh-CN/install/migrating" icon="arrow-right">
    迁移到新机器。
  </Card>
  <Card title="Uninstall" href="/zh-CN/install/uninstall" icon="trash-2">
    完全移除 OpenClaw。
  </Card>
</CardGroup>

## 故障排除：找不到 `openclaw`

如果安装成功，但终端中找不到 `openclaw`：

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

如果 `$(npm prefix -g)/bin` 不在你的 `$PATH` 中，请将它添加到你的 shell 启动文件（`~/.zshrc` 或 `~/.bashrc`）：

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

然后打开一个新终端。更多详情请参阅 [Node 设置](/zh-CN/install/node)。
