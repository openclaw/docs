---
read_when:
    - 设置一台新机器
    - 你想使用“最新 + 最强”版本，同时又不破坏你的个人设置
summary: OpenClaw 的高级设置与开发工作流
title: 设置
x-i18n:
    generated_at: "2026-04-05T10:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# 设置

<Note>
如果你是第一次设置，请先阅读 [入门指南](/zh-CN/start/getting-started)。
有关新手引导的详细信息，请参阅 [设置向导（CLI）](/zh-CN/start/wizard)。
</Note>

## TL;DR

- **个性化配置位于仓库之外：** `~/.openclaw/workspace`（工作区）+ `~/.openclaw/openclaw.json`（配置）。
- **稳定工作流：** 安装 macOS 应用；让它运行内置的 Gateway 网关。
- **前沿工作流：** 通过 `pnpm gateway:watch` 自行运行 Gateway 网关，然后让 macOS 应用在本地模式下连接。

## 前置条件（从源码运行）

- 推荐使用 Node 24（仍支持 Node 22 LTS，目前为 `22.14+`）
- 推荐使用 `pnpm`（或者，如果你有意使用 [Bun 工作流](/zh-CN/install/bun)，也可以使用 Bun）
- Docker（可选；仅用于容器化设置/e2e —— 参见 [Docker](/zh-CN/install/docker)）

## 个性化策略（这样更新时不会受影响）

如果你既想要“100% 按自己需求定制”，又想轻松更新，请将你的自定义内容保存在：

- **配置：** `~/.openclaw/openclaw.json`（JSON/类似 JSON5）
- **工作区：** `~/.openclaw/workspace`（skills、提示词、记忆；建议将其设为私有 git 仓库）

初始化一次：

```bash
openclaw setup
```

在这个仓库中，请使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，请通过 `pnpm openclaw setup` 运行（如果你使用的是 Bun 工作流，则使用 `bun run openclaw setup`）。

## 从这个仓库运行 Gateway 网关

执行 `pnpm build` 后，你可以直接运行打包后的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定工作流（优先使用 macOS 应用）

1. 安装并启动 **OpenClaw.app**（菜单栏）。
2. 完成新手引导/权限检查清单（TCC 提示）。
3. 确保 Gateway 网关处于**本地**模式并正在运行（由应用管理）。
4. 连接各个界面（例如：WhatsApp）：

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

目标：开发 TypeScript Gateway 网关、获得热重载，并保持 macOS 应用 UI 处于连接状态。

### 0）（可选）也从源码运行 macOS 应用

如果你也想让 macOS 应用使用前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1）启动开发版 Gateway 网关

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` 会以 watch 模式运行 gateway，并在相关源码、
配置和内置插件元数据发生变化时重新加载。

如果你有意使用 Bun 工作流，对应命令为：

```bash
bun install
bun run gateway:watch
```

### 2）让 macOS 应用连接到你正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- 连接模式：**本地**
  应用将连接到配置端口上正在运行的 gateway。

### 3）验证

- 应用内的 Gateway 网关状态应显示为 **“Using existing gateway …”**
- 或通过 CLI：

```bash
openclaw health
```

### 常见坑点

- **端口错误：** Gateway 网关 WS 默认为 `ws://127.0.0.1:18789`；确保应用和 CLI 使用相同端口。
- **状态存储位置：**
  - 渠道/provider 状态：`~/.openclaw/credentials/`
  - 模型认证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

在调试认证问题或决定要备份哪些内容时，请参考这一节：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人令牌**：配置/环境变量或 `channels.telegram.tokenFile`（仅允许常规文件；拒绝符号链接）
- **Discord 机器人令牌**：配置/环境变量或 SecretRef（env/file/exec providers）
- **Slack 令牌**：配置/环境变量（`channels.slack.*`）
- **配对 allowlist**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型认证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的 secrets 负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多详情： [安全](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏你的设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你自己的内容”；不要把个人提示词/配置放进 `openclaw` 仓库。
- 更新源码：`git pull` + 你选择的包管理器安装步骤（默认是 `pnpm install`；如果使用 Bun 工作流则为 `bun install`）+ 持续使用对应的 `gateway:watch` 命令。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在用户注销/空闲时停止用户服务，这会终止 Gateway 网关。新手引导会尝试为你启用 lingering（可能会提示输入 sudo）。如果它仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于常开或多用户服务器，请考虑使用 **系统**服务而不是用户服务（无需 lingering）。有关 systemd 说明，请参阅 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、监管、端口）
- [Gateway 网关配置](/zh-CN/gateway/configuration)（配置模式 + 示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签 + replyToMode 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（gateway 生命周期）
