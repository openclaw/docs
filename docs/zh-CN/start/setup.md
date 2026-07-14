---
read_when:
    - 设置新机器
    - 你希望在不破坏个人设置的前提下使用“最新、最强”的版本
summary: OpenClaw 的高级设置和开发工作流
title: 设置
x-i18n:
    generated_at: "2026-07-14T13:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果是首次设置，请从[入门指南](/zh-CN/start/getting-started)开始。
有关新手引导的详细信息，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。
</Note>

## 简要说明

根据你希望更新的频率以及是否希望自行运行 Gateway 网关，选择设置工作流：

- **定制内容应放在仓库外：**将配置和工作区保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/` 中，以免仓库更新影响它们。
- **稳定版工作流（建议大多数用户使用）：**安装 macOS 应用，并让它运行内置的 Gateway 网关。
- **前沿版工作流（开发）：**通过 `pnpm gateway:watch` 自行运行 Gateway 网关，然后让 macOS 应用以 Local 模式连接。

## 前置要求（从源码运行）

- 建议使用 Node 24.15+（仍支持 Node 22 LTS，当前版本为 `22.22.3+`）
- 从源码检出时需要 `pnpm`。在开发模式下，OpenClaw 会从
  `extensions/*` pnpm 工作区软件包加载内置插件，因此根目录的 `npm install`
  不会准备完整的源码树。
- Docker（可选；仅用于容器化设置/E2E——参阅 [Docker](/zh-CN/install/docker)）

## 定制策略（避免更新造成破坏）

如果希望“完全按我的需求定制”_同时_又便于更新，请将自定义内容保存在：

- **配置：**`~/.openclaw/openclaw.json`（类似 JSON/JSON5）
- **工作区：**`~/.openclaw/workspace`（Skills、提示词、记忆；建议将其设为私有 Git 仓库）

仅初始化一次配置和工作区文件夹，而不运行完整的新手引导向导：

```bash
openclaw setup --baseline
```

尚未全局安装？请改为从此仓库运行：

```bash
pnpm openclaw setup --baseline
```

（不带 `--baseline` 的纯 `openclaw setup` 是 `openclaw onboard` 的别名，会运行完整的交互式向导。）

## 从此仓库运行 Gateway 网关

完成 `pnpm build` 后，可以直接运行打包的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定版工作流（优先使用 macOS 应用）

1. 安装并启动 **OpenClaw.app**（菜单栏）。
2. 完成新手引导/权限检查清单（TCC 提示）。
3. 确保 Gateway 网关为 **Local** 且正在运行（由应用管理）。
4. 关联渠道（例如 WhatsApp）：

```bash
openclaw channels login
```

5. 执行完整性检查：

```bash
openclaw health
```

如果你的构建版本不提供新手引导：

- 依次运行 `openclaw setup` 和 `openclaw channels login`，然后手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿版工作流（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关、获得热重载，并保持 macOS 应用 UI 与之连接。

### 0)（可选）也从源码运行 macOS 应用

如果还希望使用前沿版 macOS 应用：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发版 Gateway 网关

```bash
pnpm install
# 仅首次运行时需要（或重置本地 OpenClaw 配置/工作区后）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会在命名的 tmux 会话（`openclaw-gateway-watch-main`）中启动或重启 Gateway 网关监视进程，并从交互式终端自动连接。非交互式 shell 会保持分离并输出 `tmux attach -t openclaw-gateway-watch-main`；使用 `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可让交互式运行保持分离，使用 `pnpm gateway:watch:raw` 则可启用前台监视模式。监视器接管当前配置或默认端口之前，会停止活动配置文件中已安装的 Gateway 网关服务，防止服务管理器替换源码进程。该服务仍保持安装状态；监视结束后请运行 `pnpm openclaw gateway start`。启动失败后，tmux 窗格仍然可用，以便其他终端或智能体连接或捕获其日志。相关源码、配置和内置插件元数据发生变化时，监视器会重新加载。如果受监视的 Gateway 网关在启动期间退出，`gateway:watch` 会运行一次 `openclaw doctor --fix --non-interactive` 并重试；设置 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可禁用这一仅限开发环境的修复步骤。`pnpm gateway:watch` 不会重新构建 `dist/control-ui`，因此在 `ui/` 发生变化后请重新运行 `pnpm ui:build`，或者在开发 Control UI 时使用 `pnpm ui:dev`。

### 2) 将 macOS 应用连接到正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- Connection Mode：**Local**
  应用将连接到配置端口上正在运行的 Gateway 网关。

### 3) 验证

- 应用内的 Gateway 网关状态应显示 **"Using existing gateway …"**
- 也可以通过 CLI 验证：

```bash
openclaw health
```

### 常见陷阱

- **端口错误：**Gateway 网关 WS 默认使用 `ws://127.0.0.1:18789`；确保应用和 CLI 使用同一端口。
- **状态存储位置：**
  - 渠道/提供商状态：`~/.openclaw/credentials/`
  - 模型身份验证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话和转录记录：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - 旧版/归档会话工件：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭据存储映射

调试身份验证或决定备份内容时，请参考以下信息：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram Bot 令牌**：配置/环境变量或 `channels.telegram.tokenFile`（只能是普通文件；拒绝符号链接）
- **Discord Bot 令牌**：配置/环境变量或 SecretRef（环境变量/文件/exec 提供商）
- **Slack 令牌**：配置/环境变量（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型身份验证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的密钥载荷（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  了解详情：[安全性](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏现有设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 作为“你的内容”保留；不要将个人提示词或配置放入 `openclaw` 仓库。
- 更新源码：`git pull` + `pnpm install`，并继续使用 `pnpm gateway:watch`。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在用户注销或空闲时停止用户服务，从而终止 Gateway 网关。新手引导会尝试为你启用 lingering（可能提示使用 sudo）。如果仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于需要持续运行或支持多用户的服务器，请考虑使用**系统**服务而非用户服务（无需 lingering）。有关 systemd 的说明，请参阅 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、进程监管、端口）
- [Gateway 配置](/zh-CN/gateway/configuration)（配置架构和示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签和 replyToMode 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（Gateway 网关生命周期）
