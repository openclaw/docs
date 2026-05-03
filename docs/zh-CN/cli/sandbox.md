---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱运行时并检查生效的沙箱策略
title: 沙箱 CLI
x-i18n:
    generated_at: "2026-05-03T12:29:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

管理用于隔离智能体执行的沙箱运行时。

## 概览

OpenClaw 可以在隔离的沙箱运行时中运行智能体以提高安全性。`sandbox` 命令可帮助你在更新或配置变更后检查并重新创建这些运行时。

目前这通常意味着：

- Docker 沙箱容器
- 当 `agents.defaults.sandbox.backend = "ssh"` 时的 SSH 沙箱运行时
- 当 `agents.defaults.sandbox.backend = "openshell"` 时的 OpenShell 沙箱运行时

对于 `ssh` 和 OpenShell `remote`，重新创建比 Docker 更重要：

- 初始播种后，远程工作区是规范来源
- `openclaw sandbox recreate` 会删除所选范围的规范远程工作区
- 下次使用时会从当前本地工作区再次播种

## 命令

### `openclaw sandbox explain`

检查**生效的**沙箱模式/范围/工作区访问权限、沙箱工具策略，以及提权门禁（包含修复用配置键路径）。

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
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**输出包括：**

- 运行时名称和状态
- 后端（`docker`、`openshell` 等）
- 配置标签，以及它是否匹配当前配置
- 存续时间（自创建以来的时间）
- 空闲时间（自上次使用以来的时间）
- 关联的会话/智能体

### `openclaw sandbox recreate`

移除沙箱运行时，以强制使用更新后的配置重新创建。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**选项：**

- `--all`：重新创建所有沙箱容器
- `--session <key>`：为特定会话重新创建容器
- `--agent <id>`：为特定智能体重新创建容器
- `--browser`：仅重新创建浏览器容器
- `--force`：跳过确认提示

<Note>
下次使用智能体时，运行时会自动重新创建。
</Note>

## 使用场景

### 更新 Docker 镜像后

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### 更改沙箱配置后

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
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

对于核心 `ssh` 后端，重新创建会删除 SSH 目标上对应范围的远程工作区根目录。下一次运行会从本地工作区再次播种。

### 更改 OpenShell 来源、策略或模式后

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

对于 OpenShell `remote` 模式，重新创建会删除该范围的规范远程工作区。下一次运行会从本地工作区再次播种。

### 更改 setupCommand 后

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### 仅针对特定智能体

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## 为什么需要这样做

当你更新沙箱配置时：

- 现有运行时会继续使用旧设置运行。
- 运行时只有在空闲 24 小时后才会被清理。
- 经常使用的智能体会让旧运行时无限期保持存活。

使用 `openclaw sandbox recreate` 强制移除旧运行时。下次需要时，它们会使用当前设置自动重新创建。

<Tip>
优先使用 `openclaw sandbox recreate`，而不是手动执行后端特定的清理。它会使用 Gateway 网关的运行时注册表，并避免范围或会话键发生变化时出现不匹配。
</Tip>

## 注册表迁移

OpenClaw 会将沙箱运行时元数据存储为沙箱状态目录下每个容器/浏览器条目对应的一个 JSON 分片。较旧的安装可能仍有单体旧版文件：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

常规沙箱运行时读取不会重写这些文件。运行 `openclaw doctor --fix` 可将有效的旧版条目迁移到分片注册表目录中。无效的旧版文件会被隔离，避免一个损坏的旧注册表隐藏当前运行时条目。

## 配置

沙箱设置位于 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（按智能体覆盖项放在 `agents.list[].sandbox` 中）：

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

## 相关

- [CLI 参考](/zh-CN/cli)
- [沙箱隔离](/zh-CN/gateway/sandboxing)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Doctor](/zh-CN/gateway/doctor)：检查沙箱设置。
