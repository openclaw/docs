---
read_when:
    - 你需要一种不同于“入门指南”快速开始的安装方式
    - 你想部署到云平台
    - 你需要更新、迁移或卸载
summary: 安装 OpenClaw —— 安装脚本、npm/pnpm/bun、从源码安装、Docker 等
title: 安装
x-i18n:
    generated_at: "2026-04-05T08:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# 安装

## 推荐：安装脚本

这是最快的安装方式。它会检测你的操作系统，在需要时安装 Node，安装 OpenClaw，并启动新手引导。

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

如果你希望安装时不运行新手引导：

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

有关所有标志以及 CI/自动化选项，请参见 [安装器内部机制](/install/installer)。

## 系统要求

- **Node 24**（推荐）或 Node 22.14+ —— 安装脚本会自动处理
- **macOS、Linux 或 Windows** —— 同时支持原生 Windows 和 WSL2；WSL2 更稳定。参见 [Windows](/platforms/windows)。
- 只有在你从源码构建时才需要 `pnpm`

## 其他安装方式

### 本地前缀安装器（`install-cli.sh`）

当你希望将 OpenClaw 和 Node 保持在本地前缀下（例如
`~/.openclaw`），而不依赖系统范围的 Node 安装时，请使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它默认支持 npm 安装，也支持在同一
前缀流程下使用 git 检出安装。完整参考： [安装器内部机制](/install/installer#install-clish)。

### npm、pnpm 或 bun

如果你已经自行管理 Node：

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
    pnpm 对带有构建脚本的软件包要求显式批准。首次安装后请运行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun 支持用于全局 CLI 安装路径。对于 Gateway 网关运行时，Node 仍然是推荐的守护进程运行时。
    </Note>

  </Tab>
</Tabs>

<Accordion title="故障排除：sharp 构建错误（npm）">
  如果 `sharp` 因全局安装的 libvips 而失败：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### 从源码安装

适用于贡献者，或任何希望从本地检出运行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

或者跳过 link，直接在仓库内使用 `pnpm openclaw ...`。完整开发工作流请参见 [设置](/start/setup)。

### 从 GitHub main 安装

```bash
npm install -g github:openclaw/openclaw#main
```

### 容器和包管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    容器化或无头部署。
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Docker 的无 root 容器替代方案。
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    通过 Nix flake 进行声明式安装。
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    自动化 fleet 配置。
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    通过 Bun 运行时进行仅 CLI 用法。
  </Card>
</CardGroup>

## 验证安装

```bash
openclaw --version      # 确认 CLI 可用
openclaw doctor         # 检查配置问题
openclaw gateway status # 验证 Gateway 网关正在运行
```

如果你希望安装后由系统托管启动：

- macOS：通过 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 安装 LaunchAgent
- Linux/WSL2：通过相同命令安装 systemd 用户服务
- 原生 Windows：优先使用 Scheduled Task；如果任务创建被拒绝，则回退到按用户的 Startup 文件夹登录项

## 托管和部署

将 OpenClaw 部署到云服务器或 VPS：

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">任意 Linux VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">共享 Docker 步骤</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## 更新、迁移或卸载

<CardGroup cols={3}>
  <Card title="更新" href="/install/updating" icon="refresh-cw">
    让 OpenClaw 保持最新。
  </Card>
  <Card title="迁移" href="/install/migrating" icon="arrow-right">
    迁移到新机器。
  </Card>
  <Card title="卸载" href="/install/uninstall" icon="trash-2">
    完全移除 OpenClaw。
  </Card>
</CardGroup>

## 故障排除：找不到 `openclaw`

如果安装成功，但终端中找不到 `openclaw`：

```bash
node -v           # Node 是否已安装？
npm prefix -g     # 全局软件包安装在哪里？
echo "$PATH"      # 全局 bin 目录是否在 PATH 中？
```

如果 `$(npm prefix -g)/bin` 不在你的 `$PATH` 中，请将它添加到你的 shell 启动文件（`~/.zshrc` 或 `~/.bashrc`）中：

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

然后打开一个新的终端。更多细节请参见 [Node 设置](/install/node)。
