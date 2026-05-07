---
read_when:
    - 设置新机器
    - 你想要“最新 + 最好”，同时不破坏你的个人设置
summary: OpenClaw 的高级设置和开发工作流
title: 设置
x-i18n:
    generated_at: "2026-05-07T13:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是首次设置，请从[入门指南](/zh-CN/start/getting-started)开始。
有关新手引导详情，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。
</Note>

## 简要说明

根据你希望更新的频率，以及是否想自己运行 Gateway 网关，选择一种设置工作流：

- **定制内容位于仓库外：** 将你的配置和工作区保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/` 中，这样仓库更新不会影响它们。
- **稳定工作流（推荐大多数人使用）：** 安装 macOS 应用，并让它运行内置的 Gateway 网关。
- **前沿工作流（开发）：** 通过 `pnpm gateway:watch` 自己运行 Gateway 网关，然后让 macOS 应用以 Local 模式连接。

## 前提条件（从源码安装）

- 推荐使用 Node 24（仍支持 Node 22 LTS，目前为 `22.16+`）
- 源码检出需要 `pnpm`。OpenClaw 在开发模式下会从
  `extensions/*` pnpm 工作区包加载内置插件，因此根目录 `npm install` 不会
  准备完整的源码树。
- Docker（可选；仅用于容器化设置/e2e - 参见 [Docker](/zh-CN/install/docker)）

## 定制策略（避免更新造成影响）

如果你想要“100% 为我定制”_并且_轻松更新，请将你的自定义内容保存在：

- **配置：** `~/.openclaw/openclaw.json`（JSON/近似 JSON5）
- **工作区：** `~/.openclaw/workspace`（技能、提示、记忆；将其设为私有 git 仓库）

初始化一次：

```bash
openclaw setup
```

在此仓库内部，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，请通过 `pnpm openclaw setup` 运行它。

## 从此仓库运行 Gateway 网关

在 `pnpm build` 之后，你可以直接运行打包后的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定工作流（macOS 应用优先）

1. 安装并启动 **OpenClaw.app**（菜单栏）。
2. 完成新手引导/权限检查清单（TCC 提示）。
3. 确保 Gateway 网关为 **Local** 且正在运行（由应用管理）。
4. 关联表面（示例：WhatsApp）：

```bash
openclaw channels login
```

5. 完整性检查：

```bash
openclaw health
```

如果你的构建中没有新手引导：

- 运行 `openclaw setup`，然后运行 `openclaw channels login`，再手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿工作流（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关、获得热重载，并保持 macOS 应用 UI 已连接。

### 0)（可选）也从源码运行 macOS 应用

如果你还想让 macOS 应用保持在前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发版 Gateway 网关

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会在命名 tmux
会话中启动或重启 Gateway 网关 watch 进程，并从交互式终端自动附加。非交互式 shell 会保持
分离并打印 `tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可让交互式运行保持
分离，或使用 `pnpm gateway:watch:raw` 进入前台 watch 模式。watcher
会在相关源码、配置和内置插件元数据变更时重新加载。如果被
watch 的 Gateway 网关在启动期间退出，`gateway:watch` 会运行一次
`openclaw doctor --fix --non-interactive` 并重试；设置
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可禁用这个仅用于开发的修复步骤。
`pnpm openclaw setup` 是新检出仓库的一次性本地配置/工作区初始化步骤。
`pnpm gateway:watch` 不会重新构建 `dist/control-ui`，因此在 `ui/` 变更后请重新运行 `pnpm ui:build`，或在开发 Control UI 时使用 `pnpm ui:dev`。

### 2) 将 macOS 应用指向正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- 连接模式：**Local**
  应用会连接到配置端口上正在运行的 gateway。

### 3) 验证

- 应用内 Gateway 网关状态应显示 **“正在使用现有 gateway …”**
- 或通过 CLI：

```bash
openclaw health
```

### 常见陷阱

- **端口错误：** Gateway 网关 WS 默认使用 `ws://127.0.0.1:18789`；保持应用和 CLI 使用同一端口。
- **状态存放位置：**
  - 渠道/提供商状态：`~/.openclaw/credentials/`
  - 模型认证配置档案：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭据存储映射

调试认证或决定备份内容时使用此映射：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：配置/环境变量或 `channels.telegram.tokenFile`（仅限普通文件；拒绝符号链接）
- **Discord bot token**：配置/环境变量或 SecretRef（env/file/exec 提供商）
- **Slack token**：配置/环境变量（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账号）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账号）
- **模型认证配置档案**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **文件支持的机密载荷（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多详情：[安全](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏你的设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你的东西”；不要把个人提示/配置放进 `openclaw` 仓库。
- 更新源码：`git pull` + `pnpm install` + 继续使用 `pnpm gateway:watch`。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在登出/空闲时停止用户
服务，这会杀掉 Gateway 网关。新手引导会尝试为你启用
linger（可能会提示输入 sudo）。如果仍然关闭，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于始终在线或多用户服务器，请考虑使用**系统**服务而不是
用户服务（无需 linger）。systemd 说明见 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、监管、端口）
- [Gateway 网关配置](/zh-CN/gateway/configuration)（配置架构 + 示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签 + replyToMode 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（gateway 生命周期）
