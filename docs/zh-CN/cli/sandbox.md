---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱运行时并检查生效的沙箱策略
title: 沙箱 CLI
x-i18n:
    generated_at: "2026-04-27T04:33:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 15
---

为隔离的智能体执行管理沙箱运行时。

## 概述

OpenClaw 可以让智能体在隔离的沙箱运行时中运行，以提升安全性。`sandbox` 命令可帮助你在更新或配置变更后检查并重新创建这些运行时。

目前，这通常指的是：

- Docker 沙箱容器
- 当 `agents.defaults.sandbox.backend = "ssh"` 时的 SSH 沙箱运行时
- 当 `agents.defaults.sandbox.backend = "openshell"` 时的 OpenShell 沙箱运行时

对于 `ssh` 和 OpenShell `remote`，重新创建比 Docker 更重要：

- 远程工作区在初次种子复制后就是权威副本
- `openclaw sandbox recreate` 会删除所选作用域的这个权威远程工作区
- 下次使用时会从当前本地工作区重新进行种子复制

## 命令

### `openclaw sandbox explain`

检查**生效的**沙箱模式/作用域/工作区访问、沙箱工具策略以及提权门控（附带修复配置键路径）。

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
- 存续时间（自创建以来的时间）
- 空闲时间（自上次使用以来的时间）
- 关联的会话/智能体

### `openclaw sandbox recreate`

移除沙箱运行时，以强制按更新后的配置重新创建。

```bash
openclaw sandbox recreate --all                # 重新创建所有容器
openclaw sandbox recreate --session main       # 指定会话
openclaw sandbox recreate --agent mybot        # 指定智能体
openclaw sandbox recreate --browser            # 仅重新创建浏览器容器
openclaw sandbox recreate --all --force        # 跳过确认
```

**选项：**

- `--all`：重新创建所有沙箱容器
- `--session <key>`：为指定会话重新创建容器
- `--agent <id>`：为指定智能体重新创建容器
- `--browser`：仅重新创建浏览器容器
- `--force`：跳过确认提示

<Note>
当智能体下次被使用时，运行时会自动重新创建。
</Note>

## 使用场景

### 更新 Docker 镜像后

```bash
# 拉取新镜像
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 更新配置以使用新镜像
# 编辑配置：agents.defaults.sandbox.docker.image（或 agents.list[].sandbox.docker.image）

# 重新创建容器
openclaw sandbox recreate --all
```

### 更改沙箱配置后

```bash
# 编辑配置：agents.defaults.sandbox.*（或 agents.list[].sandbox.*）

# 重新创建以应用新配置
openclaw sandbox recreate --all
```

### 更改 SSH 目标或 SSH 认证材料后

```bash
# 编辑配置：
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

对于核心 `ssh` 后端，重新创建会删除 SSH 目标上按作用域划分的远程工作区根目录。
下次运行时会从本地工作区重新进行种子复制。

### 更改 OpenShell 来源、策略或模式后

```bash
# 编辑配置：
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

对于 OpenShell `remote` 模式，重新创建会删除该作用域的权威远程工作区。
下次运行时会从本地工作区重新进行种子复制。

### 更改 setupCommand 后

```bash
openclaw sandbox recreate --all
# 或仅针对一个智能体：
openclaw sandbox recreate --agent family
```

### 仅针对特定智能体

```bash
# 仅更新一个智能体的容器
openclaw sandbox recreate --agent alfred
```

## 为什么需要这样做

当你更新沙箱配置时：

- 现有运行时会继续使用旧设置运行。
- 运行时仅会在空闲 24 小时后被清理。
- 经常使用的智能体会无限期保留旧运行时。

使用 `openclaw sandbox recreate` 可强制移除旧运行时。它们会在下次需要时按当前设置自动重新创建。

<Tip>
优先使用 `openclaw sandbox recreate`，而不是手动执行特定后端的清理。它使用 Gateway 网关的运行时注册表，并可避免在作用域或会话键发生变化时出现不匹配。
</Tip>

## 配置

沙箱设置位于 `~/.openclaw/openclaw.json` 中的 `agents.defaults.sandbox` 下（按智能体覆盖放在 `agents.list[].sandbox` 中）：

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

- [CLI reference](/zh-CN/cli)
- [沙箱隔离](/zh-CN/gateway/sandboxing)
- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [Doctor](/zh-CN/gateway/doctor)：检查沙箱设置。
