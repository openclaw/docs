---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱隔离的工作原理：模式、范围、工作区访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-07-11T20:32:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在沙箱后端中执行工具，以缩小影响范围。沙箱隔离默认关闭，可通过 `agents.defaults.sandbox`（全局）或 `agents.list[].sandbox`（按智能体）控制。Gateway 网关进程始终在主机上运行；启用沙箱隔离后，只有工具执行会移入沙箱。

<Note>
这并非完美的安全边界，但当模型做出不当操作时，它能显著限制对文件系统和进程的访问。
</Note>

## 沙箱隔离的内容

- 工具执行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 可选的沙箱浏览器（`agents.defaults.sandbox.browser`）。

不进行沙箱隔离的内容：

- Gateway 网关进程本身。
- 通过 `tools.elevated` 明确允许在沙箱外运行的任何工具。提升权限的 Exec 会绕过沙箱隔离，并在配置的逃逸路径上运行（默认为 `gateway`；当 Exec 目标为 `node` 时则为 `node`）。如果沙箱隔离已关闭，`tools.elevated` 不会产生任何变化，因为 Exec 已经在主机上运行。请参阅[提升权限模式](/zh-CN/tools/elevated)。

## 模式、作用域和后端

三个相互独立的设置控制沙箱行为：

| 设置 | 键                                | 值                           | 默认值   |
| ---- | --------------------------------- | ---------------------------- | -------- |
| 模式 | `agents.defaults.sandbox.mode`    | `off`、`non-main`、`all`     | `off`    |
| 作用域 | `agents.defaults.sandbox.scope` | `agent`、`session`、`shared` | `agent`  |
| 后端 | `agents.defaults.sandbox.backend` | `docker`、`ssh`、`openshell` | `docker` |

**模式**控制何时应用沙箱隔离：

- `off`：不进行沙箱隔离。
- `non-main`：除智能体主会话外，对其他所有会话进行沙箱隔离。主会话键始终为 `agent:<agentId>:main`（当 `session.scope` 为 `"global"` 时则为 `global`），不可配置。群组/渠道会话使用各自的键，因此始终被视为非主会话并进行沙箱隔离。
- `all`：每个会话都在沙箱中运行。

**作用域**控制创建多少个容器/环境：

- `agent`：每个智能体使用一个容器。
- `session`：每个会话使用一个容器。
- `shared`：所有进行沙箱隔离的会话共享一个容器（在此作用域下，将忽略按智能体设置的 `docker`/`ssh`/`browser` 覆盖项）。

**后端**控制由哪个运行时执行沙箱中的工具。SSH 专用配置位于 `agents.defaults.sandbox.ssh`；OpenShell 专用配置位于 `plugins.entries.openshell.config`。

|                    | Docker                         | SSH                         | OpenShell                                  |
| ------------------ | ------------------------------ | --------------------------- | ------------------------------------------ |
| **运行位置**       | 本地容器                       | 任何可通过 SSH 访问的主机   | OpenShell 托管沙箱                         |
| **设置**           | `scripts/sandbox-setup.sh`     | SSH 密钥 + 目标主机         | 已启用 OpenShell 插件                      |
| **工作区模型**     | 绑定挂载或复制                 | 以远程端为准（一次性填充）  | `mirror` 或 `remote`                       |
| **网络控制**       | `docker.network`（默认：无）   | 取决于远程主机              | 取决于 OpenShell                           |
| **浏览器沙箱**     | 支持                           | 不支持                      | 尚不支持                                   |
| **绑定挂载**       | `docker.binds`                 | 不适用                      | 不适用                                     |
| **最适合**         | 本地开发、完全隔离             | 将工作卸载到远程计算机      | 具有可选双向同步的托管式远程沙箱           |

## Docker 后端

启用沙箱隔离后，Docker 是默认后端。它通过 Docker 守护进程套接字（`/var/run/docker.sock`）在本地运行工具和沙箱浏览器；隔离由 Docker 命名空间提供。

默认值：`network: "none"`（无出站访问）、`readOnlyRoot: true`、`capDrop: ["ALL"]`，镜像为 `openclaw-sandbox:bookworm-slim`。

要向沙箱开放主机 GPU，请将 `agents.defaults.sandbox.docker.gpus`（或按智能体设置的覆盖项）设为类似 `"all"` 或 `"device=GPU-uuid"` 的值。此值会传递给 Docker 的 `--gpus` 标志，并且要求主机具有兼容的运行时，例如 NVIDIA Container Toolkit。

<Warning>
**Docker 外置 Docker（DooD）约束**

如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会使用主机的 Docker 套接字编排同级沙箱容器（DooD）。这会引入路径映射约束：

- **配置必须使用主机路径**：`openclaw.json` 中的 `workspace` 必须包含**主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 网关容器内部的路径。Docker 守护进程会相对于主机操作系统命名空间解析路径，而不是相对于 Gateway 网关自身的命名空间。
- **必须使用一致的卷映射**：Gateway 网关进程还会将 Heartbeat 和桥接文件写入该 `workspace` 路径。请为 Gateway 网关容器提供相同的卷映射（`-v /home/user/.openclaw:/home/user/.openclaw`），以便在 Gateway 网关容器内部也能正确解析同一主机路径。当 Gateway 网关尝试写入 Heartbeat 时，不一致的映射会表现为 `EACCES`。
- **Codex 代码模式**：OpenClaw 沙箱处于活动状态时，OpenClaw 会针对该轮次禁用 Codex app-server 原生代码模式、用户 MCP 服务器和由应用支持的插件执行（这些功能从 Gateway 网关主机上的 app-server 进程运行，而不是从 OpenClaw 沙箱后端运行），除非沙箱工具策略开放所需工具，并且你选择启用实验性的沙箱 Exec 服务器路径。此时，Shell 访问会通过由 OpenClaw 沙箱支持的工具进行路由，例如 `sandbox_exec` 和 `sandbox_process`。请勿将主机 Docker 套接字挂载到智能体沙箱容器或自定义 Codex 沙箱中。有关完整行为，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

在启用了 Docker 沙箱模式的 Ubuntu/AppArmor 主机上，Codex app-server 的 `workspace-write` Shell 执行需要在沙箱容器内使用非特权用户命名空间；如果服务用户无法创建该命名空间，Shell 可能在启动前就失败。当 Docker 沙箱出站访问被禁用（`network: "none"`，默认设置）时，还需要一个非特权网络命名空间。常见症状包括：`bwrap: setting up uid map: Permission denied` 和 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。运行 `openclaw doctor`；如果它报告 Codex bwrap 命名空间探测失败，请优先使用允许 OpenClaw 服务进程创建所需命名空间的 AppArmor 配置文件。`kernel.apparmor_restrict_unprivileged_userns=0` 是影响整个主机的后备方案，存在安全权衡；仅当该主机的安全策略可以接受时才使用。
</Warning>

### 沙箱浏览器

- 当浏览器工具需要沙箱浏览器时，它会自动启动（确保可访问 CDP）。通过 `agents.defaults.sandbox.browser.autoStart`（默认为 `true`）和 `autoStartTimeoutMs`（默认为 12 秒）进行配置。
- 沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。通过 `agents.defaults.sandbox.browser.network` 进行配置。
- `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允许列表限制容器边界处的 CDP 入站访问（例如 `172.21.0.1/32`）。
- 默认情况下，noVNC 观察访问受密码保护；OpenClaw 会生成一个短期有效的令牌 URL，该 URL 提供本地引导页面，并通过 URL 片段（而不是查询字符串或请求头日志）中的密码打开 noVNC。
- `agents.defaults.sandbox.browser.allowHostControl`（默认为 `false`）允许进行沙箱隔离的会话明确以主机浏览器为目标。
- 可选的允许列表会限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH 后端

使用 `backend: "ssh"` 可在任意可通过 SSH 访问的计算机上对 `exec`、文件工具和媒体读取进行沙箱隔离。

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

默认值：`command: "ssh"`、`workspaceRoot: "/tmp/openclaw-sandboxes"`、`strictHostKeyChecking: true`、`updateHostKeys: true`。

- **生命周期**：OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下创建一个按作用域划分的远程根目录。创建或重新创建后的首次使用时，它会从本地工作区一次性填充该远程工作区。此后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示词媒体读取和入站媒体暂存都会通过 SSH 直接针对远程工作区运行。OpenClaw 不会自动将远程更改同步回本地工作区。
- **身份验证材料**：`identityFile`/`certificateFile`/`knownHostsFile` 引用现有本地文件。`identityData`/`certificateData`/`knownHostsData` 接受内联字符串或 SecretRefs；它们通过常规机密运行时快照解析，以 `0600` 模式写入临时文件，并在 SSH 会话结束时删除。如果同一项同时设置了 `*File` 和 `*Data` 变体，则该会话中以 `*Data` 为准。
- **以远程端为准的影响**：完成初始填充后，远程 SSH 工作区会成为实际的沙箱状态。在填充步骤后于 OpenClaw 外部进行的主机本地编辑不会在远程端可见，除非你重新创建沙箱。`openclaw sandbox recreate` 会删除按作用域划分的远程根目录，并在下次使用时再次从本地填充。此后端不支持浏览器沙箱隔离，且 `sandbox.docker.*` 设置不适用于此后端。

## OpenShell 后端

使用 `backend: "openshell"` 可在 OpenShell 管理的远程环境中对工具进行沙箱隔离。OpenShell 会复用与通用 SSH 后端相同的 SSH 传输和远程文件系统桥接，并添加 OpenShell 生命周期（`sandbox create/get/delete/ssh-config`）以及可选的 `mirror` 工作区同步模式。

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
        },
      },
    },
  },
}
```

`mode: "mirror"`（默认）以本地工作区为准：OpenClaw 会在执行 `exec` 前将本地内容同步到沙箱，并在执行后同步回来。`mode: "remote"` 会从本地一次性填充远程工作区，然后直接针对远程工作区运行 `exec`/`read`/`write`/`edit`/`apply_patch`，而不会同步回来；填充后的本地编辑不可见，直到你运行 `openclaw sandbox recreate`。在 `scope: "agent"` 或 `scope: "shared"` 下，该远程工作区会在相同作用域内共享。当前限制：尚不支持沙箱浏览器，且 `sandbox.docker.binds` 不适用于此后端。

`openclaw sandbox list`/`recreate`/prune 对 OpenShell 运行时和 Docker 运行时采用相同处理方式；清理逻辑会感知后端类型。

有关完整的前置条件、配置参考、工作区模式比较和生命周期详情，请参阅 [OpenShell](/zh-CN/gateway/openshell)。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可以看到的内容：

| 值               | 行为                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（默认）   | 工具会看到 `~/.openclaw/sandboxes` 下隔离的沙箱工作区。                                   |
| `ro`             | 将 Agent 工作区以只读方式挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）。            |
| `rw`             | 将 Agent 工作区以读写方式挂载到 `/workspace`。                                            |

使用 OpenShell 后端时，`mirror` 模式仍会在各次 exec 轮次之间将本地工作区作为规范来源；`remote` 模式会在初始填充后将远程 OpenShell 工作区作为规范来源；而 `workspaceAccess: "ro"`/`"none"` 仍会以相同方式限制写入行为。

入站媒体会复制到活跃的沙箱工作区中（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙箱根目录为根。使用 `workspaceAccess: "none"` 时，OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`），以便读取。使用 `"rw"` 时，可以从 `/workspace/skills` 读取工作区 Skills，而符合条件的托管、内置或插件 Skills 会实体化到生成的只读路径 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 将额外的主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局绑定与按 Agent 配置的绑定会合并（而非替换）。在 `scope: "shared"` 下，会忽略按 Agent 配置的绑定。

`agents.defaults.sandbox.browser.binds` 仅将额外的主机目录挂载到**沙箱浏览器**容器中。设置该项时（包括 `[]`），它会替换浏览器容器的 `docker.binds`；省略时，浏览器容器会回退使用 `docker.binds`。

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

<Warning>
**绑定安全**

- 绑定会绕过沙箱文件系统：它们以你设置的模式（`:ro` 或 `:rw`）暴露主机路径。
- OpenClaw 默认阻止危险的绑定源：系统路径（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker 套接字目录（`/run`、`/var/run` 及其 `docker.sock` 变体），以及常见的主目录凭据根目录（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 验证会先规范化源路径，然后通过最深层的现有祖先再次解析该路径，之后重新检查被阻止的路径和允许的根目录。因此，即使最终叶节点尚不存在，通过符号链接父目录逃逸也会以失败关闭方式处理（例如，如果 `run-link` 指向 `/var/run`，则 `/workspace/run-link/new-file` 仍会解析为 `/var/run/...`）。
- 默认还会阻止遮蔽容器保留挂载点（`/workspace`、`/agent`）的绑定目标；可通过 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆盖。
- 默认会阻止工作区或 Agent 工作区允许列表根目录之外的绑定源；可通过 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆盖。允许的根目录会以相同方式规范化，因此，某个路径即使在解析符号链接前看起来位于允许列表中，但解析后位于允许根目录之外，仍会被拒绝。
- 敏感挂载（密钥、SSH 密钥、服务凭据）应使用 `:ro`，除非确实必须写入。
- 如果只需读取工作区，请与 `workspaceAccess: "ro"` 结合使用；绑定模式仍然彼此独立。
- 有关绑定如何与工具策略和提升权限的 Exec 交互，请参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。

</Warning>

## 镜像和设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

<Note>
**源代码检出与 npm 安装的区别**

仅从[源代码检出](https://github.com/openclaw/openclaw)运行时，才能使用 `scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 辅助脚本。npm 软件包中不包含这些脚本。

如果你通过 `npm install -g openclaw` 安装了 OpenClaw，请改用下方所示的内联 `docker build` 命令。
</Note>

<Steps>
  <Step title="构建默认镜像">
    从源代码检出：

    ```bash
    scripts/sandbox-setup.sh
    ```

    从 npm 安装（无需源代码检出）：

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    默认镜像**不**包含 Node。如果某个 Skill 需要 Node（或其他运行时），请构建自定义镜像，或通过 `sandbox.docker.setupCommand` 安装（需要网络出口、可写根目录和 root 用户）。

    当缺少 `openclaw-sandbox:bookworm-slim` 时，OpenClaw 不会静默替换为普通的 `debian:bookworm-slim`。以默认镜像为目标的沙箱运行会快速失败并显示构建说明，直到你构建该镜像为止，因为内置镜像为沙箱的写入/编辑辅助工具提供了 `python3`。

  </Step>
  <Step title="可选：构建通用镜像">
    如需包含常用工具（例如 `curl`、`jq`、Node 24、pnpm、`python3` 和 `git`）且功能更完善的沙箱镜像：

    从源代码检出：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    从 npm 安装时，请先构建默认镜像（见上文），然后使用仓库中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common)，在默认镜像之上构建通用镜像。

    然后将 `agents.defaults.sandbox.docker.image` 设置为 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="可选：构建沙箱浏览器镜像">
    从源代码检出：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    从 npm 安装时，请使用仓库中的 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) 进行构建。

  </Step>
</Steps>

默认情况下，Docker 沙箱容器在**无网络**环境下运行。可通过 `agents.defaults.sandbox.docker.network` 覆盖。

<AccordionGroup>
  <Accordion title="沙箱浏览器的 Chromium 默认值">
    内置的沙箱浏览器镜像会为容器化工作负载应用保守的 Chromium 启动标志：

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - 启用 `browser.headless` 时使用 `--headless=new`。
    - 启用 `browser.noSandbox` 时使用 `--no-sandbox --disable-setuid-sandbox`。
    - 默认使用 `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`；这些图形加固标志有助于保护不支持 GPU 的容器。如果你的工作负载需要 WebGL 或其他 3D 功能，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - 默认使用 `--disable-extensions`；对于依赖扩展的流程，请设置 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 默认使用 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 保留 Chromium 的默认值。

    如果需要不同的运行时配置，请使用自定义浏览器镜像并提供自己的入口点。对于本地（非容器）Chromium 配置文件，请使用 `browser.extraArgs` 追加启动标志。

  </Accordion>
  <Accordion title="网络安全默认值">
    - 禁止使用 `network: "host"`。
    - 默认禁止使用 `network: "container:<id>"`（存在绕过命名空间限制的风险）。
    - 紧急覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安装和容器化 Gateway 网关位于此处：[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导生成沙箱配置。将 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）设置为启用该路径。可通过 `OPENCLAW_DOCKER_SOCKET` 覆盖套接字位置。完整设置和环境变量参考：[Docker](/zh-CN/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 在创建沙箱容器后运行**一次**（不会在每次运行时执行）。它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 按 Agent 配置：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常见问题">
    - 默认 `docker.network` 为 `"none"`（无网络出口），因此软件包安装会失败。
    - `docker.network: "container:<id>"` 需要设置 `dangerouslyAllowContainerNamespaceJoin: true`，并且仅供紧急情况使用。
    - `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false` 或构建自定义镜像。
    - 安装软件包时，`user` 必须为 root（省略 `user` 或设置 `user: "0:0"`）。
    - 沙箱 exec **不会**继承主机的 `process.env`。请使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）提供 Skill API 密钥。
    - `agents.defaults.sandbox.docker.env` 中的值会作为显式 Docker 容器环境变量传递。任何拥有 Docker 守护进程访问权限的人都可以通过 `docker inspect` 等 Docker 元数据命令检查这些值。如果无法接受这种元数据暴露，请使用自定义镜像、挂载的密钥文件或其他密钥交付路径。

  </Accordion>
</AccordionGroup>

## 工具策略和逃生通道

工具允许/拒绝策略仍会先于沙箱规则应用。如果某个工具在全局或按 Agent 配置中被拒绝，沙箱隔离不会重新启用它。

`tools.elevated` 是一个显式逃生通道，用于在沙箱外运行 `exec`（默认在 `gateway` 上运行；当 exec 目标为 `node` 时，则在 `node` 上运行）。`/exec` 指令仅适用于已授权的发送者，并会按会话持久化；若要彻底禁用 `exec`，请使用工具策略拒绝（参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- `openclaw sandbox list` 显示沙箱容器、状态、镜像匹配情况、存在时间、空闲时间以及关联的会话/Agent。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 检查生效的沙箱模式、主机工作区、运行时工作目录、Docker 挂载、工具策略以及修复配置键。其 `workspaceRoot` 字段仍表示配置的沙箱根目录；`effectiveHostWorkspaceRoot` 显示活跃工作区的实际位置。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 删除容器/环境，以便下次使用时按当前配置重新创建。
- 有关“为什么会被阻止？”的思维模型，请参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。

## 多 Agent 覆盖

每个 Agent 都可以覆盖沙箱和工具配置：`agents.list[].sandbox` 和 `agents.list[].tools`（沙箱工具策略还可使用 `agents.list[].tools.sandbox.tools`）。有关优先级，请参阅[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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

## 相关内容

- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按 Agent 配置的覆盖项和优先级
- [OpenShell](/zh-CN/gateway/openshell) -- 托管式沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试“为什么此操作被阻止？”
- [安全性](/zh-CN/gateway/security)
