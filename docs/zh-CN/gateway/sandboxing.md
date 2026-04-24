---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: OpenClaw 沙箱隔离的工作方式：模式、作用域、工作区访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-04-24T03:39:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw 可以在**沙箱后端内运行工具**，以降低影响范围。
这是**可选的**，并由配置控制（`agents.defaults.sandbox` 或
`agents.list[].sandbox`）。如果关闭沙箱隔离，工具会在宿主机上运行。
Gateway 网关本身保持在宿主机上；启用后，工具执行会在隔离的沙箱中运行。

这并不是一个完美的安全边界，但当模型做出错误操作时，它能显著限制文件系统
和进程访问。

## 哪些内容会进入沙箱

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱隔离浏览器（`agents.defaults.sandbox.browser`）。
  - 默认情况下，当浏览器工具需要它时，沙箱浏览器会自动启动（确保 CDP 可达）。
    通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
  - 默认情况下，沙箱浏览器容器会使用专用的 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。
    通过 `agents.defaults.sandbox.browser.network` 配置。
  - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 可使用 CIDR 允许列表限制容器边缘的 CDP 入站访问（例如 `172.21.0.1/32`）。
  - noVNC 观察者访问默认受密码保护；OpenClaw 会生成一个短时有效的 token URL，用于提供本地 bootstrap 页面，并通过 URL fragment（而不是 query/header 日志）在 noVNC 中携带密码打开。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱会话显式将宿主机浏览器作为目标。
  - 可选允许列表可对 `target: "custom"` 进行限制：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

不会进入沙箱的内容：

- Gateway 网关进程本身。
- 任何被显式允许在沙箱外运行的工具（例如 `tools.elevated`）。
  - **提升权限的 `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`；当 exec 目标为 `node` 时则为 `node`）。**
  - 如果关闭了沙箱隔离，`tools.elevated` 不会改变执行行为（本来就在宿主机上运行）。参见 [Elevated Mode](/zh-CN/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱隔离：

- `"off"`：不使用沙箱隔离。
- `"non-main"`：仅对**非主**会话使用沙箱隔离（如果你希望普通聊天仍在宿主机上运行，这是默认推荐值）。
- `"all"`：每个会话都在沙箱中运行。
  注意：`"non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是基于智能体 id。
  群组/渠道会话使用各自的 key，因此它们会被视为非主会话，并进入沙箱。

## 作用域

`agents.defaults.sandbox.scope` 控制**会创建多少个容器**：

- `"agent"`（默认）：每个智能体一个容器。
- `"session"`：每个会话一个容器。
- `"shared"`：所有启用沙箱的会话共享一个容器。

## 后端

`agents.defaults.sandbox.backend` 控制**由哪种运行时**提供沙箱：

- `"docker"`（启用沙箱隔离时的默认值）：本地 Docker 支持的沙箱运行时。
- `"ssh"`：通用的 SSH 支持远程沙箱运行时。
- `"openshell"`：OpenShell 支持的沙箱运行时。

SSH 专用配置位于 `agents.defaults.sandbox.ssh` 下。
OpenShell 专用配置位于 `plugins.entries.openshell.config` 下。

### 选择后端

|                     | Docker                     | SSH                    | OpenShell                             |
| ------------------- | -------------------------- | ---------------------- | ------------------------------------- |
| **运行位置**        | 本地容器                   | 任意可通过 SSH 访问的主机 | OpenShell 管理的沙箱                  |
| **设置**            | `scripts/sandbox-setup.sh` | SSH 密钥 + 目标主机    | 启用 OpenShell 插件                   |
| **工作区模型**      | Bind-mount 或复制          | 远程为准（初始化一次） | `mirror` 或 `remote`                  |
| **网络控制**        | `docker.network`（默认：none） | 取决于远程主机         | 取决于 OpenShell                      |
| **浏览器沙箱**      | 支持                       | 不支持                 | 尚不支持                              |
| **Bind mounts**     | `docker.binds`             | 不适用                 | 不适用                                |
| **最适合**          | 本地开发、完全隔离         | 卸载到远程机器运行     | 由托管远程沙箱提供，并可选双向同步    |

### Docker 后端

默认情况下，沙箱隔离是关闭的。如果你启用了沙箱隔离但未选择
后端，OpenClaw 会使用 Docker 后端。它通过 Docker daemon socket（`/var/run/docker.sock`）
在本地执行工具和沙箱浏览器。沙箱容器的隔离性由 Docker namespaces 决定。

**Docker-out-of-Docker（DooD）约束**：
如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会通过宿主机的 Docker socket（DooD）来编排同级沙箱容器。这会带来一个特定的路径映射约束：

- **配置必须使用宿主机路径**：`openclaw.json` 中的 `workspace` 配置**必须**包含**宿主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 网关容器内部路径。当 OpenClaw 请求 Docker daemon 启动一个沙箱时，daemon 会相对于宿主机操作系统命名空间来解析路径，而不是 Gateway 网关命名空间。
- **FS Bridge 一致性（完全相同的卷映射）**：OpenClaw Gateway 网关原生进程也会将 heartbeat 和 bridge 文件写入 `workspace` 目录。由于 Gateway 网关在其自身容器化环境中也会使用同一个精确的字符串（即宿主机路径）进行解析，因此 Gateway 网关部署**必须**包含一个完全相同的卷映射，以便原生链接宿主机命名空间（`-v /home/user/.openclaw:/home/user/.openclaw`）。

如果你只在容器内部映射路径，而没有与宿主机绝对路径保持一致，OpenClaw 在容器环境中尝试写入 heartbeat 时会原生抛出 `EACCES` 权限错误，因为这个完全限定路径字符串在原生环境中并不存在。

### SSH 后端

当你希望 OpenClaw 在任意可通过 SSH 访问的机器上，对 `exec`、文件工具和媒体读取进行沙箱隔离时，请使用 `backend: "ssh"`。

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
          // 或者使用 SecretRefs / 内联内容，而不是本地文件：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

工作方式如下：

- OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下，为每个作用域创建一个远程根目录。
- 在创建或重建后的首次使用时，OpenClaw 会先将本地工作区一次性播种到远程工作区。
- 此后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取以及入站媒体暂存，都会通过 SSH 直接作用于远程工作区。
- OpenClaw 不会自动将远程变更同步回本地工作区。

认证材料：

- `identityFile`、`certificateFile`、`knownHostsFile`：使用现有本地文件，并通过 OpenSSH 配置传入。
- `identityData`、`certificateData`、`knownHostsData`：使用内联字符串或 SecretRefs。OpenClaw 会通过常规 secrets 运行时快照解析它们，将其写入权限为 `0600` 的临时文件，并在 SSH 会话结束时删除。
- 如果同一项同时设置了 `*File` 和 `*Data`，则该 SSH 会话中 `*Data` 优先。

这是一个**以远程为准**的模型。初始播种后，远程 SSH 工作区会成为真正的沙箱状态。

重要影响：

- 在播种步骤之后，如果你在 OpenClaw 之外对宿主机本地做了编辑，这些更改在远程端不可见，直到你重建沙箱。
- `openclaw sandbox recreate` 会删除每个作用域对应的远程根目录，并在下次使用时重新从本地播种。
- SSH 后端不支持浏览器沙箱隔离。
- `sandbox.docker.*` 设置不适用于 SSH 后端。

### OpenShell 后端

当你希望 OpenClaw 在 OpenShell 管理的远程环境中对工具进行沙箱隔离时，请使用 `backend: "openshell"`。完整的设置指南、配置参考和工作区模式对比，请参见专门的 [OpenShell 页面](/zh-CN/gateway/openshell)。

OpenShell 复用了与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥接，并增加了 OpenShell 特有的生命周期管理
（`sandbox create/get/delete`、`sandbox ssh-config`），以及可选的 `mirror`
工作区模式。

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

- `mirror`（默认）：本地工作区保持为准。OpenClaw 会在执行 `exec` 前将本地文件同步到 OpenShell，并在 `exec` 后将远程工作区同步回本地。
- `remote`：沙箱创建后，OpenShell 工作区成为准来源。OpenClaw 会先从本地工作区向远程工作区进行一次播种，此后文件工具和 `exec` 都会直接作用于远程沙箱，而不会把变更同步回来。

远程传输细节：

- OpenClaw 会通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求特定沙箱的 SSH 配置。
- 核心层会将该 SSH 配置写入临时文件，打开 SSH 会话，并复用 `backend: "ssh"` 所使用的同一远程文件系统桥接。
- 只有在 `mirror` 模式下，生命周期才有所不同：执行 `exec` 前从本地同步到远程，执行后再同步回来。

当前 OpenShell 的限制：

- 尚不支持沙箱浏览器
- OpenShell 后端不支持 `sandbox.docker.binds`
- `sandbox.docker.*` 下的 Docker 专用运行时控制项仍然只适用于 Docker 后端

#### 工作区模式

OpenShell 有两种工作区模型。这是实践中最关键的部分。

##### `mirror`

当你希望**本地工作区保持为准**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
- 文件工具仍然通过沙箱桥接运行，但在每轮之间，本地工作区仍是事实来源。

适用场景：

- 你会在 OpenClaw 之外本地编辑文件，并希望这些更改自动出现在沙箱中
- 你希望 OpenShell 沙箱的行为尽可能接近 Docker 后端
- 你希望宿主机工作区在每次 `exec` 轮次后都能反映沙箱写入结果

代价：

- 在每次 `exec` 前后都会产生额外的同步成本

##### `remote`

当你希望**OpenShell 工作区成为准来源**时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 当沙箱首次创建时，OpenClaw 会先将本地工作区一次性播种到远程工作区。
- 此后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 都会直接作用于远程 OpenShell 工作区。
- OpenClaw 在执行 `exec` 之后**不会**将远程更改同步回本地工作区。
- 提示阶段的媒体读取仍然可用，因为文件和媒体工具会通过沙箱桥接读取，而不是假定使用本地主机路径。
- 传输层通过 SSH 连接到由 `openshell sandbox ssh-config` 返回的 OpenShell 沙箱。

重要影响：

- 如果你在播种步骤之后，在 OpenClaw 之外于宿主机上编辑文件，远程沙箱将**不会**自动看到这些更改。
- 如果沙箱被重建，远程工作区会再次从本地工作区重新播种。
- 如果使用 `scope: "agent"` 或 `scope: "shared"`，该远程工作区也会在相同作用域内共享。

适用场景：

- 沙箱应主要驻留在远程 OpenShell 一侧
- 你希望降低每轮同步开销
- 你不希望宿主机本地编辑在无提示的情况下覆盖远程沙箱状态

如果你将沙箱视为一个临时执行环境，请选择 `mirror`。
如果你将沙箱视为真实工作区，请选择 `remote`。

#### OpenShell 生命周期

OpenShell 沙箱仍然通过常规沙箱生命周期进行管理：

- `openclaw sandbox list` 会显示 OpenShell 运行时以及 Docker 运行时
- `openclaw sandbox recreate` 会删除当前运行时，并让 OpenClaw 在下次使用时重新创建它
- 清理逻辑同样具备后端感知能力

对于 `remote` 模式，recreate 尤其重要：

- recreate 会删除该作用域下作为准来源的远程工作区
- 下次使用时会从本地工作区重新播种一个新的远程工作区

对于 `mirror` 模式，recreate 主要是重置远程执行环境，
因为本地工作区本来就保持为准来源。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱能看到什么**：

- `"none"`（默认）：工具只能看到位于 `~/.openclaw/sandboxes` 下的沙箱工作区。
- `"ro"`：将智能体工作区以只读方式挂载到 `/agent`（会禁用 `write`/`edit`/`apply_patch`）。
- `"rw"`：将智能体工作区以读写方式挂载到 `/workspace`。

在 OpenShell 后端中：

- `mirror` 模式仍然在每次 `exec` 轮次之间使用本地工作区作为准来源
- `remote` 模式在初始播种后使用远程 OpenShell 工作区作为准来源
- `workspaceAccess: "ro"` 和 `"none"` 仍会以相同方式限制写入行为

入站媒体会被复制到活动沙箱工作区中（`media/inbound/*`）。
Skills 说明：`read` 工具以沙箱根目录为基准。在 `workspaceAccess: "none"` 时，
OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`）中，
使其可被读取。在 `"rw"` 下，工作区中的 Skills 可从
`/workspace/skills` 读取。

## 自定义 bind mounts

`agents.defaults.sandbox.docker.binds` 会将额外的宿主机目录挂载到容器中。
格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局和每智能体的 binds 会**合并**，而不是相互替换。在 `scope: "shared"` 下，每智能体 binds 会被忽略。

`agents.defaults.sandbox.browser.binds` 会仅将额外宿主机目录挂载到**沙箱浏览器**容器中。

- 设置后（包括设为 `[]`），它会在浏览器容器中替代 `agents.defaults.sandbox.docker.binds`。
- 如果省略，浏览器容器会回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

示例（只读源码 + 一个额外的数据目录）：

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
- OpenClaw 会阻止危险的 bind 源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`，以及会暴露这些路径的父级挂载点）。
- OpenClaw 也会阻止常见的主目录凭据根路径，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- Bind 校验不只是字符串匹配。OpenClaw 会先规范化源路径，然后通过最深的现有祖先路径再次解析，再重新检查受阻路径和允许根路径。
- 这意味着即使最终叶子路径还不存在，利用父级符号链接逃逸的方式也会被安全拒绝。例如：如果 `run-link` 指向该位置，那么 `/workspace/run-link/new-file` 仍会解析为 `/var/run/...`。
- 允许的源根路径也会以同样方式进行规范化，因此一个在符号链接解析前看起来位于允许列表内的路径，仍可能因 `outside allowed roots` 而被拒绝。
- 敏感挂载（secrets、SSH 密钥、服务凭据）除非绝对必要，否则应使用 `:ro`。
- 如果你只需要对工作区进行只读访问，可结合 `workspaceAccess: "ro"` 一起使用；bind 模式仍然独立生效。
- 参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解 binds 如何与工具策略和提升权限 exec 交互。

## 镜像 + 设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

构建一次：

```bash
scripts/sandbox-setup.sh
```

注意：默认镜像**不**包含 Node。如果某个 Skill 需要 Node（或其他运行时），可以选择构建自定义镜像，或通过
`sandbox.docker.setupCommand` 安装（需要网络出口 + 可写根文件系统 +
root 用户）。

如果你想使用一个功能更完整、带有常见工具（例如
`curl`、`jq`、`nodejs`、`python3`、`git`）的沙箱镜像，请构建：

```bash
scripts/sandbox-common-setup.sh
```

然后将 `agents.defaults.sandbox.docker.image` 设置为
`openclaw-sandbox-common:bookworm-slim`。

沙箱浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，Docker 沙箱容器运行时**没有网络**。
可通过 `agents.defaults.sandbox.docker.network` 覆盖。

内置的沙箱浏览器镜像还会为容器化工作负载应用较为保守的 Chromium 启动默认值。
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
- 在启用 `noSandbox` 时，使用 `--no-sandbox` 和 `--disable-setuid-sandbox`。
- 三个图形强化标志（`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`）是可选的，在容器缺乏 GPU 支持时很有用。如果你的工作负载需要 WebGL 或其他 3D/浏览器特性，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
- `--disable-extensions` 默认启用；对于依赖扩展的流程，可通过
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 禁用它。
- `--renderer-process-limit=2` 由
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 表示保留 Chromium 默认值。

如果你需要不同的运行时配置，请使用自定义浏览器镜像并提供
你自己的 entrypoint。对于本地（非容器）Chromium 配置，请使用
`browser.extraArgs` 来追加额外的启动标志。

安全默认值：

- `network: "host"` 会被阻止。
- `network: "container:<id>"` 默认会被阻止（存在命名空间加入绕过风险）。
- 破玻璃覆盖项：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker 安装和容器化 Gateway 网关部署说明见：
[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导生成沙箱配置。
设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）即可启用该路径。你也可以
通过 `OPENCLAW_DOCKER_SOCKET` 覆盖 socket 位置。完整设置与环境变量
参考： [Docker](/zh-CN/install/docker#agent-sandbox)。

## `setupCommand`（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**只运行一次**（而不是每次运行都执行）。
它会通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每智能体：`agents.list[].sandbox.docker.setupCommand`

常见陷阱：

- 默认 `docker.network` 为 `"none"`（无网络出口），因此安装包会失败。
- `docker.network: "container:<id>"` 需要设置 `dangerouslyAllowContainerNamespaceJoin: true`，并且仅应用于破玻璃场景。
- `readOnlyRoot: true` 会阻止写入；请将 `readOnlyRoot: false`，或构建自定义镜像。
- 安装包时 `user` 必须为 root（省略 `user` 或设置 `user: "0:0"`）。
- 沙箱 exec **不会**继承宿主机 `process.env`。请使用
  `agents.defaults.sandbox.docker.env`（或自定义镜像）来提供 Skill API 密钥。

## 工具策略 + 逃逸通道

工具的允许/拒绝策略仍会先于沙箱规则生效。如果某个工具在全局
或某个智能体级别被拒绝，启用沙箱隔离也不会把它重新启用。

`tools.elevated` 是一个显式逃逸通道，它会让 `exec` 在沙箱外运行（默认使用 `gateway`，当 exec 目标为 `node` 时使用 `node`）。
`/exec` 指令仅对已授权发送方生效，并按会话持久化；如果你想彻底禁用
`exec`，请使用工具策略 deny（参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查实际生效的沙箱模式、工具策略和 fix-it 配置键。
- 参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解“为什么这里被阻止了？”的思维模型。
  请保持严格锁定。

## 多智能体覆盖

每个智能体都可以覆盖沙箱和工具配置：
`agents.list[].sandbox` 和 `agents.list[].tools`（以及用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。
优先级请参见 [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools)。

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

- [OpenShell](/zh-CN/gateway/openshell) -- 托管沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试“为什么这里被阻止了？”
- [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools) -- 每智能体覆盖与优先级
- [Security](/zh-CN/gateway/security)
