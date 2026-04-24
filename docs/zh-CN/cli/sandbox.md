---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱运行时并检查生效的沙箱策略
title: 沙箱 CLI
x-i18n:
    generated_at: "2026-04-24T03:38:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

管理用于隔离智能体执行的沙箱运行时。

## 概览

OpenClaw 可以在隔离的沙箱运行时中运行智能体，以提升安全性。`sandbox` 命令可帮助你在更新或配置变更后检查并重建这些运行时。

目前通常包括：

- Docker 沙箱容器
- 当 `agents.defaults.sandbox.backend = "ssh"` 时的 SSH 沙箱运行时
- 当 `agents.defaults.sandbox.backend = "openshell"` 时的 OpenShell 沙箱运行时

对于 `ssh` 和 OpenShell `remote`，重建比 Docker 更重要：

- 初次初始化后，远程工作区是规范副本
- `openclaw sandbox recreate` 会删除所选范围的该规范远程工作区
- 下次使用时，会根据当前本地工作区重新初始化

## 命令

### `openclaw sandbox explain`

检查**生效的**沙箱 mode/scope/workspace access、沙箱工具策略和提权门控（包含修复用的配置键路径）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

列出所有沙箱运行时及其状态和配置。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 仅列出浏览器容器
openclaw sandbox list --json     # JSON 输出
```

**输出包括：**

- 运行时名称和状态
- 后端（`docker`、`openshell` 等）
- 配置标签，以及它是否与当前配置匹配
- 存在时长（自创建以来的时间）
- 空闲时长（自上次使用以来的时间）
- 关联的会话/智能体

### `openclaw sandbox recreate`

移除沙箱运行时，以便使用更新后的配置强制重新创建。

```bash
openclaw sandbox recreate --all                # 重建所有容器
openclaw sandbox recreate --session main       # 指定会话
openclaw sandbox recreate --agent mybot        # 指定智能体
openclaw sandbox recreate --browser            # 仅重建浏览器容器
openclaw sandbox recreate --all --force        # 跳过确认
```

**选项：**

- `--all`：重建所有沙箱容器
- `--session <key>`：重建指定会话对应的容器
- `--agent <id>`：重建指定智能体的容器
- `--browser`：仅重建浏览器容器
- `--force`：跳过确认提示

**重要：** 当智能体下次被使用时，运行时会自动重新创建。

## 使用场景

### 更新 Docker 镜像后

```bash
# 拉取新镜像
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 更新配置以使用新镜像
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# 重建容器
openclaw sandbox recreate --all
```

### 更改沙箱配置后

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# 重建以应用新配置
openclaw sandbox recreate --all
```

### 更改 SSH 目标或 SSH 认证材料后

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

对于核心 `ssh` 后端，重建会删除 SSH 目标上按范围划分的远程工作区根目录。
下一次运行时，会根据本地工作区重新初始化。

### 更改 OpenShell 来源、策略或模式后

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

对于 OpenShell `remote` 模式，重建会删除该范围的规范远程工作区。
下一次运行时，会根据本地工作区重新初始化。

### 更改 setupCommand 后

```bash
openclaw sandbox recreate --all
# 或仅重建一个智能体：
openclaw sandbox recreate --agent family
```

### 仅针对某个特定智能体

```bash
# 仅更新某个智能体的容器
openclaw sandbox recreate --agent alfred
```

## 为什么需要这样做？

**问题：** 当你更新沙箱配置时：

- 现有运行时会继续以旧设置运行
- 运行时只有在空闲 24 小时后才会被清理
- 经常使用的智能体会无限期保留旧运行时

**解决方案：** 使用 `openclaw sandbox recreate` 强制移除旧运行时。它们会在下次需要时根据当前设置自动重新创建。

提示：优先使用 `openclaw sandbox recreate`，而不是手动执行特定后端的清理。
它使用 Gateway 网关的运行时注册表，可避免在范围/会话键变化时出现不匹配。

## 配置

沙箱设置位于 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（按智能体覆盖项位于 `agents.list[].sandbox`）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [沙箱隔离](/zh-CN/gateway/sandboxing)
- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [Doctor](/zh-CN/gateway/doctor) — 检查沙箱设置
