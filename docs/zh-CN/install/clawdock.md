---
read_when:
    - 你经常使用 Docker 运行 OpenClaw，并希望缩短日常使用的命令
    - 你需要一个用于仪表板、日志、令牌设置和配对流程的辅助层
summary: 用于基于 Docker 的 OpenClaw 安装的 ClawDock shell 辅助工具
title: ClawDock
x-i18n:
    generated_at: "2026-07-11T20:35:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock 是用于基于 Docker 的 OpenClaw 安装的一层轻量级 shell 辅助工具。

它提供 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 等简短命令，免去调用更长的 `docker compose ...` 命令。

如果你尚未设置 Docker，请先参阅 [Docker](/zh-CN/install/docker)。

## 安装

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前从 `scripts/shell-helpers/clawdock-helpers.sh` 安装过 ClawDock，请改用当前的 `scripts/clawdock/clawdock-helpers.sh` 路径重新安装；旧的 GitHub 原始内容路径已被移除。

这些辅助工具会在首次使用时自动检测你的 OpenClaw 检出目录（检查 `~/openclaw`、`~/projects/openclaw` 等常用路径），并将结果缓存到 `~/.clawdock/config`。如果检出目录位于其他位置，请自行设置 `CLAWDOCK_DIR`。

## 提供的功能

### 基本操作

| 命令               | 说明                     |
| ------------------ | ------------------------ |
| `clawdock-start`   | 启动 Gateway 网关        |
| `clawdock-stop`    | 停止 Gateway 网关        |
| `clawdock-restart` | 重启 Gateway 网关        |
| `clawdock-status`  | 检查容器状态             |
| `clawdock-logs`    | 持续查看 Gateway 网关日志 |

### 容器访问

| 命令                      | 说明                                      |
| ------------------------- | ----------------------------------------- |
| `clawdock-shell`          | 在 Gateway 网关容器内打开 shell           |
| `clawdock-cli <command>`  | 在 Docker 中运行 OpenClaw CLI 命令        |
| `clawdock-exec <command>` | 在容器中执行任意命令                      |

### Web UI 和配对

| 命令                    | 说明                     |
| ----------------------- | ------------------------ |
| `clawdock-dashboard`    | 打开 Control UI URL      |
| `clawdock-devices`      | 列出待处理的设备配对请求 |
| `clawdock-approve <id>` | 批准配对请求             |

### 设置和维护

| 命令                 | 说明                                          |
| -------------------- | --------------------------------------------- |
| `clawdock-fix-token` | 将 Gateway 网关令牌写入容器配置               |
| `clawdock-update`    | 拉取、重新构建并重启                          |
| `clawdock-rebuild`   | 仅重新构建 Docker 镜像                        |
| `clawdock-clean`     | 移除容器和卷                                  |

### 实用工具

| 命令                   | 说明                               |
| ---------------------- | ---------------------------------- |
| `clawdock-health`      | 运行 Gateway 健康检查             |
| `clawdock-token`       | 输出 Gateway 网关令牌              |
| `clawdock-cd`          | 跳转到 OpenClaw 项目目录           |
| `clawdock-config`      | 打开 `~/.openclaw`                 |
| `clawdock-show-config` | 输出配置文件并遮盖其中的值         |
| `clawdock-workspace`   | 打开工作区目录                     |
| `clawdock-help`        | 列出所有 ClawDock 命令             |

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

ClawDock 会读取两个独立的 `.env` 文件，与 [Docker](/zh-CN/install/docker) 中所述的拆分方式一致：

- `docker-compose.yml` 旁的项目 `.env`：包含镜像名称、端口和 `OPENCLAW_GATEWAY_TOKEN` 等 Docker 专用值。`clawdock-token` 从此处读取令牌。
- `~/.openclaw/.env`（挂载到容器中）：包含由 OpenClaw 自身管理、通过环境变量提供的密钥，与 `openclaw.json` 和 `agents/<agentId>/agent/auth-profiles.json` 位于同一处。

`clawdock-fix-token` 会将令牌从项目 `.env` 复制到容器的 `gateway.remote.token` 和 `gateway.auth.token` 配置值中，然后重启 Gateway 网关。

使用 `clawdock-show-config` 可快速检查 `openclaw.json` 和两个 `.env` 文件；它会在输出内容中遮盖 `.env` 的值。

## 相关内容

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-CN/install/docker" icon="docker">
    OpenClaw 的规范 Docker 安装方式。
  </Card>
  <Card title="Docker 虚拟机运行时" href="/zh-CN/install/docker-vm-runtime" icon="cube">
    由 Docker 管理、用于强化隔离的虚拟机运行时。
  </Card>
  <Card title="更新" href="/zh-CN/install/updating" icon="arrow-up-right-from-square">
    更新 OpenClaw 软件包和托管服务。
  </Card>
</CardGroup>
