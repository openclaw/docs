---
read_when:
    - 你想使用云端托管的沙箱，而不是本地 Docker
    - 你正在设置 OpenShell 插件
    - 你需要在镜像和远程工作区模式之间选择
summary: 将 OpenShell 用作 OpenClaw 智能体的托管式沙箱后端
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T02:04:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell 是 OpenClaw 的托管沙箱后端。OpenClaw 不在本地运行 Docker
容器，而是把沙箱生命周期委托给 `openshell` CLI，
由它预置支持基于 SSH 命令执行的远程环境。

OpenShell 插件复用与通用 [SSH 后端](/zh-CN/gateway/sandboxing#ssh-backend)相同的核心 SSH 传输和远程文件系统
桥接。它增加了 OpenShell 专用生命周期（`sandbox create/get/delete`、`sandbox ssh-config`）
以及可选的 `mirror` 工作区模式。

## 前置条件

- 已安装 OpenShell 插件（`openclaw plugins install @openclaw/openshell-sandbox`）
- 已安装 `openshell` CLI 且位于 `PATH` 中（或通过
  `plugins.entries.openshell.config.command` 设置自定义路径）
- 具备沙箱访问权限的 OpenShell 账号
- OpenClaw Gateway 网关正在主机上运行

## 快速开始

1. 安装并启用插件，然后设置沙箱后端：

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

2. 重启 Gateway 网关。在下一次智能体轮次中，OpenClaw 会创建一个 OpenShell
   沙箱，并通过它路由工具执行。

3. 验证：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作区模式

这是使用 OpenShell 时最重要的决策。

### `mirror`

当你希望**本地工作区保持规范来源**时，使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
- 文件工具仍通过沙箱桥接运行，但本地工作区在轮次之间仍是事实来源。

最适合：

- 你在 OpenClaw 外部本地编辑文件，并希望这些更改自动出现在
  沙箱中。
- 你希望 OpenShell 沙箱尽可能像 Docker 后端一样运行。
- 你希望主机工作区在每个 exec 轮次后反映沙箱写入。

权衡：每次 exec 前后都有额外同步成本。

### `remote`

当你希望 **OpenShell 工作区成为规范来源**时，使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 首次创建沙箱时，OpenClaw 会从本地工作区一次性播种远程工作区。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 会
  直接针对远程 OpenShell 工作区运行。
- OpenClaw **不会**将远程更改同步回本地工作区。
- 提示词阶段的媒体读取仍可工作，因为文件和媒体工具会通过
  沙箱桥接读取。

最适合：

- 沙箱应主要存在于远端。
- 你希望降低每轮同步开销。
- 你不希望主机本地编辑静默覆盖远程沙箱状态。

<Warning>
如果你在初始播种后，在 OpenClaw 外部的主机上编辑文件，远程沙箱**不会**看到这些更改。使用 `openclaw sandbox recreate` 重新播种。
</Warning>

### 选择模式

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **规范工作区**           | 本地主机                   | 远程 OpenShell            |
| **同步方向**             | 双向（每次 exec）          | 一次性播种                |
| **每轮开销**             | 较高（上传 + 下载）        | 较低（直接远程操作）      |
| **本地编辑可见？**       | 是，下一次 exec 时可见     | 否，直到重新创建          |
| **最适合**               | 开发工作流                 | 长时间运行的智能体、CI    |

## 配置参考

所有 OpenShell 配置都位于 `plugins.entries.openshell.config` 下：

| 键                        | 类型                     | 默认值        | 描述                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作区同步模式                                        |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI 的路径或名称                          |
| `from`                    | `string`                 | `"openclaw"`  | 首次创建时的沙箱来源                                  |
| `gateway`                 | `string`                 | —             | OpenShell Gateway 网关名称（`--gateway`）             |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway 网关端点 URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | 用于创建沙箱的 OpenShell 策略 ID                      |
| `providers`               | `string[]`               | `[]`          | 创建沙箱时要附加的提供商名称                          |
| `gpu`                     | `boolean`                | `false`       | 请求 GPU 资源                                         |
| `autoProviders`           | `boolean`                | `true`        | 创建沙箱时传递 `--auto-providers`                     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙箱内的主要可写工作区                                |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Agent 工作区挂载路径（用于只读访问）                  |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作的超时时间                        |

沙箱级设置（`mode`、`scope`、`workspaceAccess`）与任何后端一样，配置在
`agents.defaults.sandbox` 下。完整矩阵见
[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 示例

### 最小远程设置

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

### 带 GPU 的 Mirror 模式

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

### 使用自定义 Gateway 网关的按智能体 OpenShell

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

OpenShell 沙箱通过常规沙箱 CLI 管理：

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

对于 `remote` 模式，**重新创建尤其重要**：它会删除该作用域的规范
远程工作区。下一次使用会从本地工作区播种新的远程工作区。

对于 `mirror` 模式，重新创建主要会重置远程执行环境，因为
本地工作区仍是规范来源。

### 何时重新创建

更改以下任何配置后，请重新创建：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 安全加固

OpenShell 会固定工作区根 fd，并在每次读取前重新检查沙箱身份，
因此符号链接替换或重新挂载的工作区无法将读取重定向到
预期远程工作区之外。

## 当前限制

- OpenShell 后端不支持沙箱浏览器。
- `sandbox.docker.binds` 不适用于 OpenShell。
- `sandbox.docker.*` 下的 Docker 专用运行时旋钮仅适用于 Docker
  后端。

## 工作原理

1. OpenClaw 调用 `openshell sandbox create`（按配置使用 `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` 标志）。
2. OpenClaw 调用 `openshell sandbox ssh-config <name>` 获取沙箱的 SSH 连接
   详情。
3. 核心将 SSH 配置写入临时文件，并使用与通用 SSH 后端相同的
   远程文件系统桥接打开 SSH 会话。
4. 在 `mirror` 模式下：exec 前从本地同步到远程，运行，然后在 exec 后同步回来。
5. 在 `remote` 模式下：创建时播种一次，然后直接在远程
   工作区上操作。

## 相关

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 模式、作用域和后端比较
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试被阻止的工具
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖
- [沙箱 CLI](/zh-CN/cli/sandbox) -- `openclaw sandbox` 命令
