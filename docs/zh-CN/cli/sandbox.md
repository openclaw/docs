---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙箱运行时并检查生效的沙箱策略
title: 沙箱 CLI
x-i18n:
    generated_at: "2026-07-05T11:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e05563570bae3a93a41c85a5f6c0ce6fcdcf20ce9c391b051561c1eb7141d382
    source_path: cli/sandbox.md
    workflow: 16
---

管理用于隔离智能体执行的沙箱运行时：Docker 容器、SSH 目标或 OpenShell 后端。

## 命令

### `openclaw sandbox list`

列出沙箱运行时及其状态、后端、配置匹配情况、存在时间、空闲时间，以及关联的会话/智能体。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser containers only
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

移除沙箱运行时，以强制使用当前配置重新创建。下次使用智能体时，运行时会自动重新创建。

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # includes agent:mybot:* sub-sessions
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # only browser containers
openclaw sandbox recreate --all --force        # skip confirmation
```

选项：

- `--all`：重新创建所有沙箱容器
- `--session <key>`：重新创建具有此精确范围键的运行时（如 `sandbox list` 所示）；不进行短名称展开
- `--agent <id>`：重新创建某个智能体的运行时（匹配 `agent:<id>` 和 `agent:<id>:*`）
- `--browser`：仅影响浏览器容器
- `--force`：跳过确认提示

请只传入 `--all`、`--session` 或 `--agent` 中的一个。

对于 `ssh` 和 OpenShell `remote`，重新创建比 Docker 更重要：远程工作区在初始种子填充后就是权威来源，`recreate` 会删除所选范围的这个权威远程工作区，下一次运行会从当前本地工作区重新种子填充它。

### `openclaw sandbox explain`

检查生效的沙箱模式/范围/工作区访问权限、沙箱工具策略，以及提升权限工具门控（包含修复用配置键路径）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

与 `recreate --session` 不同，此命令接受短会话名称（例如 `main`），并会根据解析出的智能体展开它们。

## 为什么需要重新创建

更新沙箱配置不会影响正在运行的容器：现有运行时会保留旧设置，空闲运行时也只会在 `prune.idleHours`（默认 24 小时）之后被清理。经常使用的智能体可能会让过时运行时无限期保持存活。`openclaw sandbox recreate` 会移除旧运行时，使下一次使用时根据当前配置重建它。

<Tip>
优先使用 `openclaw sandbox recreate`，而不是手动执行特定后端的清理。它会使用 Gateway 网关的运行时注册表，并在范围或会话键变化时避免不匹配。
</Tip>

## 常见触发条件

| 变更                                                                                                                                                           | 命令                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker 镜像更新（`agents.defaults.sandbox.docker.image`）                                                                                                      | `openclaw sandbox recreate --all`                                   |
| 沙箱配置（`agents.defaults.sandbox.*`）                                                                                                                        | `openclaw sandbox recreate --all`                                   |
| SSH 目标/认证（`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`） | `openclaw sandbox recreate --all`                                   |
| OpenShell 来源/策略/模式（`plugins.entries.openshell.config.{from,mode,policy}`）                                                                              | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`（或对单个智能体使用 `--agent <id>`） |

<Note>
下次使用智能体时，运行时会自动重新创建。
</Note>

## 注册表迁移

沙箱运行时元数据位于共享 SQLite 状态数据库中。旧版安装可能有旧注册表文件，而常规读取不再重写这些文件：

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/` 下每个容器/浏览器一个 JSON 分片

运行 `openclaw doctor --fix`，将有效的旧条目迁移到 SQLite。无效的旧文件会被隔离，这样损坏的旧注册表就无法隐藏当前运行时条目。

## 配置

沙箱设置位于 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下（每智能体覆盖项放在 `agents.list[].sandbox` 中）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin-provided)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // auto-prune after 24h idle
          "maxAgeDays": 7, // auto-prune after 7 days
        },
      },
    },
  },
}
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [沙箱隔离](/zh-CN/gateway/sandboxing)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Doctor](/zh-CN/gateway/doctor)：检查沙箱设置。
