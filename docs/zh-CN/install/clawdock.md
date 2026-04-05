---
read_when:
    - 你经常通过 Docker 运行 OpenClaw，并希望日常命令更简短
    - 你希望有一层辅助工具来处理 dashboard、日志、token 设置和配对流程
summary: 用于基于 Docker 的 OpenClaw 安装的 ClawDock shell 辅助工具
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T08:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock 是一组用于基于 Docker 的 OpenClaw 安装的小型 shell 辅助工具层。

它为你提供像 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 这样的简短命令，而不必使用更长的 `docker compose ...` 调用。

如果你还没有设置 Docker，请先阅读 [Docker](/install/docker)。

## 安装

使用规范的辅助工具路径：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前通过 `scripts/shell-helpers/clawdock-helpers.sh` 安装了 ClawDock，请从新的 `scripts/clawdock/clawdock-helpers.sh` 路径重新安装。旧的 GitHub raw 路径已被移除。

## 你将获得什么

### 基本操作

| Command            | Description |
| ------------------ | ----------- |
| `clawdock-start`   | 启动 gateway |
| `clawdock-stop`    | 停止 gateway |
| `clawdock-restart` | 重启 gateway |
| `clawdock-status`  | 检查容器状态 |
| `clawdock-logs`    | 跟随 gateway 日志 |

### 容器访问

| Command                   | Description |
| ------------------------- | ----------- |
| `clawdock-shell`          | 在 gateway 容器内打开 shell |
| `clawdock-cli <command>`  | 在 Docker 中运行 OpenClaw CLI 命令 |
| `clawdock-exec <command>` | 在容器中执行任意命令 |

### Web UI 和配对

| Command                 | Description |
| ----------------------- | ----------- |
| `clawdock-dashboard`    | 打开 Control UI URL |
| `clawdock-devices`      | 列出待处理的设备配对 |
| `clawdock-approve <id>` | 批准一个配对请求 |

### 设置和维护

| Command              | Description |
| -------------------- | ----------- |
| `clawdock-fix-token` | 在容器内配置 gateway token |
| `clawdock-update`    | 拉取、重建并重启 |
| `clawdock-rebuild`   | 仅重建 Docker 镜像 |
| `clawdock-clean`     | 移除容器和卷 |

### 实用工具

| Command                | Description |
| ---------------------- | ----------- |
| `clawdock-health`      | 运行 gateway 健康检查 |
| `clawdock-token`       | 打印 gateway token |
| `clawdock-cd`          | 跳转到 OpenClaw 项目目录 |
| `clawdock-config`      | 打开 `~/.openclaw` |
| `clawdock-show-config` | 打印已脱敏的配置文件 |
| `clawdock-workspace`   | 打开工作区目录 |

## 首次使用流程

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

ClawDock 使用与 [Docker](/install/docker) 中描述的相同 Docker 配置拆分方式：

- `<project>/.env` 用于 Docker 特定值，例如镜像名称、端口和 gateway token
- `~/.openclaw/.env` 用于基于环境变量的提供商 key 和 bot token
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 用于存储的提供商 OAuth/API-key 认证
- `~/.openclaw/openclaw.json` 用于行为配置

当你想快速检查 `.env` 文件和 `openclaw.json` 时，可使用 `clawdock-show-config`。它会在打印输出中对 `.env` 值进行脱敏。

## 相关页面

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [更新](/install/updating)
