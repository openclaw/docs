---
read_when:
    - 你经常使用 Docker 运行 OpenClaw，并且希望日常命令更短
    - 你需要一个用于仪表板、日志、令牌设置和配对流程的辅助层
summary: 用于基于 Docker 的 OpenClaw 安装的 ClawDock 命令行辅助脚本
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T02:04:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock 是一个用于基于 Docker 的 OpenClaw 安装的小型 shell 辅助层。

它让你可以使用 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 这样的短命令，而不是更长的 `docker compose ...` 调用。

如果你还没有设置 Docker，请从 [Docker](/zh-CN/install/docker) 开始。

## 安装

使用规范的辅助脚本路径：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前从 `scripts/shell-helpers/clawdock-helpers.sh` 安装了 ClawDock，请从新的 `scripts/clawdock/clawdock-helpers.sh` 路径重新安装。旧的 raw GitHub 路径已被移除。

## 你会获得什么

### 基本操作

| 命令               | 说明                    |
| ------------------ | ----------------------- |
| `clawdock-start`   | 启动 Gateway 网关       |
| `clawdock-stop`    | 停止 Gateway 网关       |
| `clawdock-restart` | 重启 Gateway 网关       |
| `clawdock-status`  | 检查容器状态            |
| `clawdock-logs`    | 跟随 Gateway 网关日志   |

### 容器访问

| 命令                      | 说明                                  |
| ------------------------- | ------------------------------------- |
| `clawdock-shell`          | 在 Gateway 网关容器内打开 shell       |
| `clawdock-cli <command>`  | 在 Docker 中运行 OpenClaw CLI 命令    |
| `clawdock-exec <command>` | 在容器中执行任意命令                  |

### Web UI 和配对

| 命令                    | 说明                  |
| ----------------------- | --------------------- |
| `clawdock-dashboard`    | 打开 Control UI URL   |
| `clawdock-devices`      | 列出待处理的设备配对  |
| `clawdock-approve <id>` | 批准配对请求          |

### 设置和维护

| 命令                 | 说明                                      |
| -------------------- | ----------------------------------------- |
| `clawdock-fix-token` | 在容器内配置 Gateway 网关令牌             |
| `clawdock-update`    | 拉取、重新构建并重启                      |
| `clawdock-rebuild`   | 仅重新构建 Docker 镜像                    |
| `clawdock-clean`     | 移除容器和卷                              |

### 实用工具

| 命令                   | 说明                                  |
| ---------------------- | ------------------------------------- |
| `clawdock-health`      | 运行 Gateway 网关健康检查             |
| `clawdock-token`       | 打印 Gateway 网关令牌                 |
| `clawdock-cd`          | 跳转到 OpenClaw 项目目录              |
| `clawdock-config`      | 打开 `~/.openclaw`                    |
| `clawdock-show-config` | 打印配置文件并隐藏敏感值              |
| `clawdock-workspace`   | 打开工作区目录                        |

## 首次流程

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

如果浏览器提示需要配对：

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 配置和密钥

ClawDock 使用与 [Docker](/zh-CN/install/docker) 中描述的相同 Docker 配置拆分：

- `<project>/.env` 用于 Docker 专用值，例如镜像名称、端口和 Gateway 网关令牌
- `~/.openclaw/.env` 用于由环境变量支持的提供商密钥和机器人令牌
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 用于存储的提供商 OAuth/API key 凭证
- `~/.openclaw/openclaw.json` 用于行为配置

当你想快速检查 `.env` 文件和 `openclaw.json` 时，请使用 `clawdock-show-config`。它会在打印输出中隐藏 `.env` 值。

## 相关

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-CN/install/docker" icon="docker">
    OpenClaw 的规范 Docker 安装。
  </Card>
  <Card title="Docker VM 运行时" href="/zh-CN/install/docker-vm-runtime" icon="cube">
    由 Docker 管理的 VM 运行时，用于强化隔离。
  </Card>
  <Card title="更新" href="/zh-CN/install/updating" icon="arrow-up-right-from-square">
    更新 OpenClaw 软件包和托管服务。
  </Card>
</CardGroup>
