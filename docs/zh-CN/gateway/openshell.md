---
read_when:
    - 你想使用云端托管的沙箱，而不是本地 Docker
    - 你正在设置 OpenShell 插件
    - 你需要在镜像和远程工作区模式之间进行选择
summary: 使用 OpenShell 作为 OpenClaw 智能体的托管式沙箱后端
title: OpenShell
x-i18n:
    generated_at: "2026-07-05T11:19:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell 是托管式沙箱后端：OpenClaw 不在本地运行 Docker 容器，而是将沙箱生命周期委托给 `openshell` CLI，后者会预配远程环境并通过 SSH 执行命令。

该插件复用与通用 [SSH 后端](/zh-CN/gateway/sandboxing#ssh-backend) 相同的 SSH 传输和远程文件系统桥接，并增加 OpenShell 生命周期（`sandbox create/get/delete/ssh-config`）以及可选的 `mirror` 工作区同步模式。

## 前提条件

- 已安装 OpenShell 插件（`openclaw plugins install @openclaw/openshell-sandbox`）
- `openshell` CLI 位于 `PATH`（或通过 `plugins.entries.openshell.config.command` 使用自定义路径）
- 拥有可访问沙箱的 OpenShell 账户
- OpenClaw Gateway 网关正在主机上运行

## 快速开始

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

重启 Gateway 网关。在下一次智能体轮次中，OpenClaw 会创建一个 OpenShell 沙箱，并通过它路由工具执行。使用以下命令验证：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作区模式

这是最重要的 OpenShell 决策。

### mirror（默认）

`plugins.entries.openshell.config.mode: "mirror"` 会保持**本地工作区为权威来源**：

- 在 `exec` 前，OpenClaw 会将本地工作区同步到沙箱。
- 在 `exec` 后，OpenClaw 会将远程工作区同步回本地。
- 文件工具会通过沙箱桥接访问，但在轮次之间，本地仍是事实来源。

最适合开发工作流：OpenClaw 外部的本地编辑会在下一次 exec 中出现，沙箱行为接近 Docker 后端。

权衡：每个 exec 轮次都有上传 + 下载成本。

### remote

`mode: "remote"` 会使 **OpenShell 工作区成为权威来源**：

- 首次创建沙箱时，OpenClaw 会从本地一次性初始化远程工作区。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 会直接在远程工作区上操作。OpenClaw **不会**将远程变更同步回本地。
- 提示词阶段的媒体读取仍然可用（文件/媒体工具通过沙箱桥接读取）。

最适合长时间运行的智能体和 CI：每轮开销更低，并且主机本地编辑不会静默覆盖远程状态。

<Warning>
初始初始化后，在 OpenClaw 外部编辑主机上的文件不会被远程沙箱看到。运行 `openclaw sandbox recreate` 以重新初始化。
</Warning>

### 选择模式

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **权威工作区**           | 本地主机                   | 远程 OpenShell            |
| **同步方向**             | 双向（每次 exec）          | 一次性初始化              |
| **每轮开销**             | 更高（上传 + 下载）        | 更低（直接远程操作）      |
| **本地编辑可见？**       | 是，在下一次 exec          | 否，直到 recreate         |
| **最适合**               | 开发工作流                 | 长时间运行的智能体、CI    |

## 配置参考

所有 OpenShell 配置都位于 `plugins.entries.openshell.config` 下：

| 键                        | 类型                     | 默认值        | 描述                                                                                   |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作区同步模式                                                                         |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI 的路径或名称                                                           |
| `from`                    | `string`                 | `"openclaw"`  | 首次创建时的沙箱来源                                                                   |
| `gateway`                 | `string`                 | 未设置        | OpenShell gateway 名称（顶层 `--gateway`）                                             |
| `gatewayEndpoint`         | `string`                 | 未设置        | OpenShell gateway 端点（顶层 `--gateway-endpoint`）                                    |
| `policy`                  | `string`                 | 未设置        | 用于创建沙箱的 OpenShell 策略 ID                                                       |
| `providers`               | `string[]`               | `[]`          | 创建沙箱时附加的提供商名称（去重，每个条目对应一个 `--provider` 标志）                 |
| `gpu`                     | `boolean`                | `false`       | 请求 GPU 资源（`--gpu`）                                                               |
| `autoProviders`           | `boolean`                | `true`        | 创建期间传递 `--auto-providers`（为 false 时传递 `--no-auto-providers`）               |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙箱内的主要可写工作区                                                                 |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 智能体工作区挂载路径（当工作区访问权限不是 `rw` 时为只读）                             |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作的超时时间                                                         |

`remoteWorkspaceDir` 和 `remoteAgentWorkspaceDir` 必须是绝对路径，并且位于托管根 `/sandbox` 或 `/agent` 下；其他绝对路径会被拒绝。

沙箱级设置（`mode`、`scope`、`workspaceAccess`）与任何后端一样，位于 `agents.defaults.sandbox` 下。完整矩阵请参见[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 示例

### 最小 remote 设置

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### 启用 GPU 的 Mirror 模式

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### 使用自定义 gateway 的按智能体 OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## 生命周期管理

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

对于 `remote` 模式，recreate 尤其重要：它会删除该作用域的权威远程工作区，并在下一次使用时从本地初始化一个新的工作区。对于 `mirror` 模式，recreate 主要用于重置远程执行环境，因为本地仍是权威来源。

在更改以下任一项后执行 recreate：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## 安全加固

mirror 模式文件系统桥接会固定本地工作区根，并在每次读取、写入、mkdir、remove 和 rename 前重新检查规范路径（通过 realpath），拒绝路径中间的符号链接。符号链接替换或重新挂载的工作区无法将文件访问重定向到镜像树之外。

## 当前限制

- OpenShell 后端不支持沙箱浏览器。
- `sandbox.docker.binds` 不适用于 OpenShell；如果配置了 binds，沙箱创建会失败。
- `sandbox.docker.*` 下的 Docker 专用运行时开关（`env` 除外）仅适用于 Docker 后端。

## 工作原理

1. OpenClaw 会针对沙箱名称运行 `sandbox get`（带上任何已配置的 `--gateway`/`--gateway-endpoint`）；如果失败，则使用 `sandbox create` 创建一个沙箱，并传递 `--name`、`--from`、已设置时的 `--policy`、启用时的 `--gpu`、`--auto-providers`/`--no-auto-providers`，以及每个已配置提供商对应的一个 `--provider` 标志。
2. OpenClaw 会针对沙箱名称运行 `sandbox ssh-config` 以获取 SSH 连接详情。
3. 核心会将 SSH 配置写入临时文件，并通过与通用 SSH 后端相同的远程文件系统桥接打开 SSH 会话。
4. 在 `mirror` 模式中：exec 前将本地同步到远程，运行，然后同步回来。
5. 在 `remote` 模式中：创建时初始化一次，然后直接在远程工作区上操作。

## 相关内容

- [沙箱隔离](/zh-CN/gateway/sandboxing) - 模式、作用域和后端比较
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) - 调试被阻止的工具
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) - 按智能体覆盖
- [沙箱 CLI](/zh-CN/cli/sandbox) - `openclaw sandbox` 命令
