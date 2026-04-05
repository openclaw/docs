---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: OpenClaw 沙箱隔离的工作方式：模式、作用域、workspace 访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-04-05T08:25:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# 沙箱隔离

OpenClaw 可以在**沙箱后端内运行工具**，以减少影响范围。
这是**可选**功能，由配置控制（`agents.defaults.sandbox` 或
`agents.list[].sandbox`）。如果关闭沙箱隔离，工具将在宿主机上运行。
Gateway 网关始终运行在宿主机上；启用后，工具执行会在隔离的沙箱中进行。

这并不是一个完美的安全边界，但当模型做出愚蠢操作时，它确实能显著限制文件系统
和进程访问。

## 哪些内容会被沙箱隔离

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱隔离浏览器（`agents.defaults.sandbox.browser`）。
  - 默认情况下，当 browser 工具需要时，沙箱浏览器会自动启动（确保 CDP 可达）。
    通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 进行配置。
  - 默认情况下，沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。
    通过 `agents.defaults.sandbox.browser.network` 配置。
  - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 可通过 CIDR 允许列表限制容器边缘的 CDP 入站（例如 `172.21.0.1/32`）。
  - 默认情况下，noVNC 观察者访问受密码保护；OpenClaw 会生成一个短时有效的 token URL，用于提供本地引导页面，并在 URL fragment 中携带密码打开 noVNC（不会出现在 query/header 日志中）。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱隔离会话显式将目标指向宿主机浏览器。
  - 可选的允许列表可限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

不会被沙箱隔离的内容：

- Gateway 网关进程本身。
- 任何被显式允许在沙箱外运行的工具（例如 `tools.elevated`）。
  - **Elevated exec 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`，当 exec 目标为 `node` 时则是 `node`）。**
  - 如果关闭了沙箱隔离，`tools.elevated` 不会改变执行位置（本来就在宿主机上）。参见 [Elevated Mode](/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱隔离：

- `"off"`：不启用沙箱隔离。
- `"non-main"`：仅对**非主**会话启用沙箱隔离（如果你希望普通聊天继续在宿主机上运行，这是默认推荐）。
- `"all"`：每个会话都在沙箱中运行。
  注意：`"non-main"` 是基于 `session.mainKey`（默认 `"main"`），而不是基于智能体 ID。
  群组/渠道会话使用它们自己的键，因此会被视为非主会话并启用沙箱隔离。

## 作用域

`agents.defaults.sandbox.scope` 控制**会创建多少个容器**：

- `"agent"`（默认）：每个智能体一个容器。
- `"session"`：每个会话一个容器。
- `"shared"`：所有沙箱隔离会话共享一个容器。

## 后端

`agents.defaults.sandbox.backend` 控制**由哪种运行时**提供沙箱：

- `"docker"`（默认）：本地基于 Docker 的沙箱运行时。
- `"ssh"`：通用的基于 SSH 的远程沙箱运行时。
- `"openshell"`：基于 OpenShell 的沙箱运行时。

SSH 专属配置位于 `agents.defaults.sandbox.ssh` 下。
OpenShell 专属配置位于 `plugins.entries.openshell.config` 下。

### 如何选择后端

|                     | Docker | SSH | OpenShell |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **运行位置** | 本地容器 | 任意可通过 SSH 访问的主机 | 由 OpenShell 管理的沙箱 |
| **设置** | `scripts/sandbox-setup.sh` | SSH 密钥 + 目标主机 | 启用 OpenShell 插件 |
| **Workspace 模型** | bind mount 或 copy | 远程规范源（初始化一次） | `mirror` 或 `remote` |
| **网络控制** | `docker.network`（默认：none） | 取决于远程主机 | 取决于 OpenShell |
| **浏览器沙箱** | 支持 | 不支持 | 尚不支持 |
| **Bind mounts** | `docker.binds` | 不适用 | 不适用 |
| **最适合** | 本地开发，完全隔离 | 将执行卸载到远程机器 | 具有可选双向同步的受管远程沙箱 |

### SSH 后端

当你希望 OpenClaw 在任意可通过 SSH 访问的机器上对 `exec`、文件工具和媒体读取进行沙箱隔离时，请使用 `backend: "ssh"`。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 或者使用 SecretRef / 内联内容，而不是本地文件：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

工作方式：

- OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下按作用域创建远程根目录。
- 在首次创建或重建后的首次使用时，OpenClaw 会先将本地 workspace 初始化复制到该远程 workspace。
- 之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示词媒体读取以及入站媒体暂存都会通过 SSH 直接在远程 workspace 上运行。
- OpenClaw 不会自动将远程更改同步回本地 workspace。

认证材料：

- `identityFile`、`certificateFile`、`knownHostsFile`：使用现有本地文件，并通过 OpenSSH 配置传递。
- `identityData`、`certificateData`、`knownHostsData`：使用内联字符串或 SecretRef。OpenClaw 会通过常规 secrets 运行时快照解析它们，将其写入权限为 `0600` 的临时文件，并在 SSH 会话结束时删除。
- 如果同一项同时设置了 `*File` 和 `*Data`，则该 SSH 会话中 `*Data` 优先。

这是一个**远程规范源**模型。初始种子完成后，远程 SSH workspace 会成为真实的沙箱状态。

重要影响：

- 在初始化之后，如果你在 OpenClaw 之外于宿主机本地进行编辑，这些更改在远程端不可见，直到你重建沙箱。
- `openclaw sandbox recreate` 会删除按作用域划分的远程根目录，并在下次使用时重新从本地进行初始化。
- SSH 后端不支持浏览器沙箱隔离。
- `sandbox.docker.*` 设置不适用于 SSH 后端。

### OpenShell 后端

当你希望 OpenClaw 在由 OpenShell 管理的远程环境中对工具进行沙箱隔离时，请使用 `backend: "openshell"`。有关完整的设置指南、配置
参考和 workspace 模式对比，请参阅专门的
[OpenShell 页面](/gateway/openshell)。

OpenShell 会复用与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥接，并增加 OpenShell 专属生命周期
（`sandbox create/get/delete`、`sandbox ssh-config`）以及可选的 `mirror`
workspace 模式。

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell 模式：

- `mirror`（默认）：本地 workspace 保持为规范源。OpenClaw 会在 exec 之前将本地文件同步到 OpenShell，并在 exec 之后将远程 workspace 同步回来。
- `remote`：沙箱创建后，OpenShell workspace 成为规范源。OpenClaw 会先将本地 workspace 初始化到远程 workspace 一次，之后文件工具和 exec 都会直接在远程沙箱中运行，而不会再将更改同步回本地。

远程传输细节：

- OpenClaw 会通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求沙箱专用 SSH 配置。
- Core 会将该 SSH 配置写入临时文件，打开 SSH 会话，并复用与 `backend: "ssh"` 相同的远程文件系统桥接。
- 在 `mirror` 模式下，唯一的生命周期差异是：exec 前同步本地到远程，exec 后再同步回来。

当前 OpenShell 限制：

- 尚不支持 sandbox 浏览器
- OpenShell 后端不支持 `sandbox.docker.binds`
- `sandbox.docker.*` 下的 Docker 专属运行时参数仍然仅适用于 Docker 后端

#### Workspace 模式

OpenShell 具有两种 workspace 模型。实际使用中，这部分最重要。

##### `mirror`

当你希望**本地 workspace 保持为规范源**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地 workspace 同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程 workspace 同步回本地 workspace。
- 文件工具仍然通过沙箱桥接运行，但在各轮之间，本地 workspace 仍然是真实来源。

适用场景：

- 你会在 OpenClaw 之外本地编辑文件，并希望这些更改能自动出现在沙箱中
- 你希望 OpenShell 沙箱尽可能表现得像 Docker 后端
- 你希望宿主机 workspace 在每次 exec 回合后反映沙箱写入结果

代价：

- exec 前后会有额外的同步开销

##### `remote`

当你希望**OpenShell workspace 成为规范源**时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 当沙箱首次创建时，OpenClaw 会先将本地 workspace 初始化到远程 workspace 一次。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 都会直接在远程 OpenShell workspace 上运行。
- OpenClaw **不会**在 exec 后将远程更改同步回本地 workspace。
- 提示词阶段的媒体读取仍然可用，因为文件和媒体工具会通过沙箱桥接读取，而不是假定本地宿主机路径。
- 传输方式是通过 `openshell sandbox ssh-config` 返回的配置 SSH 到 OpenShell 沙箱中。

重要影响：

- 如果你在初始化步骤之后于宿主机上、且在 OpenClaw 之外编辑文件，远程沙箱将**不会**自动看到这些更改。
- 如果沙箱被重建，远程 workspace 会再次从本地 workspace 初始化。
- 当使用 `scope: "agent"` 或 `scope: "shared"` 时，该远程 workspace 会在相同作用域内共享。

适用场景：

- 沙箱应主要存在于远程 OpenShell 侧
- 你希望每回合同步开销更低
- 你不希望宿主机本地编辑在无提示的情况下覆盖远程沙箱状态

如果你将沙箱视为临时执行环境，请选择 `mirror`。
如果你将沙箱视为真实 workspace，请选择 `remote`。

#### OpenShell 生命周期

OpenShell 沙箱仍通过常规沙箱生命周期进行管理：

- `openclaw sandbox list` 会显示 OpenShell 运行时以及 Docker 运行时
- `openclaw sandbox recreate` 会删除当前运行时，并让 OpenClaw 在下次使用时重新创建它
- prune 逻辑也具备后端感知能力

对于 `remote` 模式，recreate 尤其重要：

- recreate 会删除该作用域下的规范远程 workspace
- 下次使用时会从本地 workspace 重新初始化一个新的远程 workspace

对于 `mirror` 模式，recreate 主要是重置远程执行环境，
因为无论如何本地 workspace 仍然是规范源。

## Workspace 访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱能看到什么**：

- `"none"`（默认）：工具看到的是位于 `~/.openclaw/sandboxes` 下的沙箱 workspace。
- `"ro"`：将智能体 workspace 以只读方式挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）。
- `"rw"`：将智能体 workspace 以读写方式挂载到 `/workspace`。

使用 OpenShell 后端时：

- `mirror` 模式仍会在各次 exec 之间将本地 workspace 视为规范源
- `remote` 模式会在初始初始化后将远程 OpenShell workspace 视为规范源
- `workspaceAccess: "ro"` 和 `"none"` 仍会以相同方式限制写入行为

入站媒体会被复制到当前沙箱 workspace 中（`media/inbound/*`）。
Skills 说明：`read` 工具以沙箱根目录为基准。使用 `workspaceAccess: "none"` 时，
OpenClaw 会将符合条件的 Skills 镜像到沙箱 workspace（`.../skills`）中，
以便可读取。使用 `"rw"` 时，workspace Skills 可从
`/workspace/skills` 读取。

## 自定义 bind mounts

`agents.defaults.sandbox.docker.binds` 会将额外的宿主机目录挂载到容器中。
格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局和按智能体配置的 binds 会**合并**（而不是替换）。在 `scope: "shared"` 下，按智能体的 binds 会被忽略。

`agents.defaults.sandbox.browser.binds` 仅会将额外的宿主机目录挂载到**沙箱浏览器**容器中。

- 设置后（包括 `[]`），它会替代浏览器容器中的 `agents.defaults.sandbox.docker.binds`。
- 若省略，则浏览器容器会回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

示例（只读源码 + 一个额外数据目录）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

安全说明：

- Binds 会绕过沙箱文件系统：它们会以你设置的模式（`:ro` 或 `:rw`）暴露宿主机路径。
- OpenClaw 会阻止危险的 bind 源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev` 以及会暴露它们的父级挂载）。
- OpenClaw 还会阻止常见的主目录凭证根路径，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- Bind 校验不只是字符串匹配。OpenClaw 会先规范化源路径，然后再通过最深的现有祖先路径重新解析，之后再次检查被阻止路径和允许根路径。
- 这意味着即使最终叶子节点尚不存在，利用父级 symlink 逃逸的方式仍会以失败关闭。示例：如果 `run-link` 指向 `/var/run/...`，那么 `/workspace/run-link/new-file` 仍会解析为 `/var/run/...`。
- 允许的源根路径也会以同样方式进行规范化，因此一个在 symlink 解析前看似位于允许列表内的路径，仍然会因 `outside allowed roots` 被拒绝。
- 敏感挂载（密钥、SSH key、服务凭证）除非绝对必要，否则都应使用 `:ro`。
- 如果你只需要对 workspace 的只读访问，请结合 `workspaceAccess: "ro"` 一起使用；bind 模式仍然彼此独立。
- 有关 binds 如何与工具策略及 elevated exec 交互，请参阅 [沙箱隔离 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)。

## 镜像 + 设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

先构建一次：

```bash
scripts/sandbox-setup.sh
```

注意：默认镜像**不**包含 Node。如果某个 Skill 需要 Node（或
其他运行时），你需要构建自定义镜像，或通过
`sandbox.docker.setupCommand` 安装（要求网络出口 + 可写根文件系统 +
root 用户）。

如果你想要功能更完整、带常用工具的沙箱镜像（例如
`curl`、`jq`、`nodejs`、`python3`、`git`），请构建：

```bash
scripts/sandbox-common-setup.sh
```

然后将 `agents.defaults.sandbox.docker.image` 设置为
`openclaw-sandbox-common:bookworm-slim`。

沙箱隔离浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，Docker 沙箱容器会在**无网络**模式下运行。
可通过 `agents.defaults.sandbox.docker.network` 覆盖。

内置沙箱浏览器镜像也会为容器化工作负载应用保守的 Chromium 启动默认值。
当前容器默认值包括：

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- 当启用 `noSandbox` 时，使用 `--no-sandbox` 和 `--disable-setuid-sandbox`。
- 三个图形加固标志（`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`）是可选的；在容器缺少 GPU 支持时它们很有用。
  如果你的工作负载需要 WebGL 或其他 3D/浏览器功能，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
- 默认启用 `--disable-extensions`，对于依赖扩展的流程，可通过
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 禁用该默认值。
- `--renderer-process-limit=2` 由
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 会保留 Chromium 的默认值。

如果你需要不同的运行时配置，请使用自定义浏览器镜像并提供
你自己的入口点。对于本地（非容器）Chromium 配置，请使用
`browser.extraArgs` 追加额外启动标志。

默认安全设置：

- `network: "host"` 会被阻止。
- 默认情况下，`network: "container:<id>"` 会被阻止（存在 namespace join 绕过风险）。
- 紧急覆盖开关：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker 安装和容器化 Gateway 网关相关内容在这里：
[Docker](/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导生成沙箱配置。
设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）可启用该路径。你还可以
通过 `OPENCLAW_DOCKER_SOCKET` 覆盖 socket 位置。完整设置和环境变量
参考： [Docker](/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**只运行一次**（不会在每次运行时执行）。
它会在容器内通过 `sh -lc` 执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 按智能体：`agents.list[].sandbox.docker.setupCommand`

常见陷阱：

- 默认 `docker.network` 是 `"none"`（无出口网络），因此安装包会失败。
- `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，并且仅适合作为紧急开关。
- `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false`，或构建自定义镜像。
- 安装软件包时 `user` 必须是 root（省略 `user` 或设置 `user: "0:0"`）。
- 沙箱 exec **不会**继承宿主机 `process.env`。对于 Skill API key，请使用
  `agents.defaults.sandbox.docker.env`（或自定义镜像）。

## 工具策略 + 逃逸通道

工具允许/拒绝策略仍会先于沙箱规则生效。如果某个工具被全局
或按智能体拒绝，沙箱隔离也不会将它重新放出来。

`tools.elevated` 是一个显式逃逸通道，它会在沙箱外运行 `exec`（默认是 `gateway`，当 exec 目标为 `node` 时则是 `node`）。
`/exec` 指令仅适用于已授权发送者，并且按会话持久化；如果要彻底禁用
`exec`，请使用工具策略 deny（参见 [沙箱隔离 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查生效的沙箱模式、工具策略和修复配置键。
- 关于“为什么这个被阻止了？”的思维模型，请参阅 [沙箱隔离 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)。
  请始终保持严格限制。

## 多智能体覆盖

每个智能体都可以覆盖自己的沙箱 + 工具配置：
`agents.list[].sandbox` 和 `agents.list[].tools`（以及用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。
优先级请参阅 [多智能体沙箱与工具](/tools/multi-agent-sandbox-tools)。

## 最小启用示例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 相关文档

- [OpenShell](/gateway/openshell) —— 受管沙箱后端设置、workspace 模式和配置参考
- [沙箱配置](/gateway/configuration-reference#agentsdefaultssandbox)
- [沙箱隔离 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) —— 调试“为什么这个被阻止了？”
- [多智能体沙箱与工具](/tools/multi-agent-sandbox-tools) —— 按智能体覆盖和优先级
- [Security](/gateway/security)
