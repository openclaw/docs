---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱隔离的工作方式：模式、作用域、工作区访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-07-06T10:48:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在沙箱后端中运行工具执行，以降低影响范围。沙箱隔离默认关闭，由 `agents.defaults.sandbox`（全局）或 `agents.list[].sandbox`（按 Agent）控制。Gateway 网关进程始终留在主机上；启用后，只有工具执行会移入沙箱。

<Note>
这不是完美的安全边界，但当模型做出不当操作时，它可以显著限制文件系统和进程访问。
</Note>

## 会被沙箱隔离的内容

- 工具执行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 可选的沙箱隔离浏览器（`agents.defaults.sandbox.browser`）。

不会被沙箱隔离的内容：

- Gateway 网关进程本身。
- 任何通过 `tools.elevated` 显式允许在沙箱外运行的工具。提升权限的 Exec 会绕过沙箱隔离，并在配置的逃逸路径上运行（默认为 `gateway`，或者当 Exec 目标为 `node` 时为 `node`）。如果沙箱隔离关闭，`tools.elevated` 不会改变任何行为，因为 Exec 已经在主机上运行。参见[提升权限模式](/zh-CN/tools/elevated)。

## 模式、范围和后端

三个独立设置控制沙箱行为：

| 设置 | 键                                | 值                           | 默认值   |
| ------- | --------------------------------- | ---------------------------- | -------- |
| 模式    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| 范围    | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| 后端 | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**模式**控制何时应用沙箱隔离：

- `off`：不使用沙箱隔离。
- `non-main`：除 Agent 主会话外的每个会话都使用沙箱。主会话键始终是 `agent:<agentId>:main`（当 `session.scope` 为 `"global"` 时为 `global`）；它不可配置。群组/渠道会话使用自己的键，因此它们始终计为非主会话并会被沙箱隔离。
- `all`：每个会话都在沙箱中运行。

**范围**控制创建多少容器/环境：

- `agent`：每个 Agent 一个容器。
- `session`：每个会话一个容器。
- `shared`：所有沙箱隔离会话共享一个容器（在此范围下会忽略按 Agent 的 `docker`/`ssh`/`browser` 覆盖项）。

**后端**控制哪个运行时执行沙箱隔离工具。SSH 专属配置位于 `agents.defaults.sandbox.ssh` 下；OpenShell 专属配置位于 `plugins.entries.openshell.config` 下。

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **运行位置**   | 本地容器                  | 任何可通过 SSH 访问的主机        | OpenShell 托管沙箱                           |
| **设置**           | `scripts/sandbox-setup.sh`       | SSH 密钥 + 目标主机          | 已启用 OpenShell 插件                            |
| **工作区模型** | 绑定挂载或复制               | 远程为准（种子一次）   | `mirror` 或 `remote`                                |
| **网络控制** | `docker.network`（默认：无） | 取决于远程主机         | 取决于 OpenShell                                |
| **浏览器沙箱** | 支持                        | 不支持                  | 尚不支持                                   |
| **绑定挂载**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最适合**        | 本地开发，完全隔离        | 卸载到远程机器 | 带可选双向同步的托管远程沙箱 |

## Docker 后端

启用沙箱隔离后，Docker 是默认后端。它通过 Docker 守护进程套接字（`/var/run/docker.sock`）在本地运行工具和沙箱浏览器；隔离来自 Docker 命名空间。

默认值：`network: "none"`（无出站网络）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、镜像 `openclaw-sandbox:bookworm-slim`。

要暴露主机 GPU，请将 `agents.defaults.sandbox.docker.gpus`（或按 Agent 的覆盖项）设置为类似 `"all"` 或 `"device=GPU-uuid"` 的值。该值会传给 Docker 的 `--gpus` 标志，并要求兼容的主机运行时，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker（DooD）约束**

如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会使用主机的 Docker 套接字编排同级沙箱容器（DooD）。这会引入路径映射约束：

- **配置需要主机路径**：`openclaw.json` 的 `workspace` 必须包含**主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是内部 Gateway 网关容器路径。Docker 守护进程会相对于主机操作系统命名空间解析路径，而不是相对于 Gateway 网关自身命名空间。
- **需要匹配的卷映射**：Gateway 网关进程还会将心跳和桥接文件写入该 `workspace` 路径。请给 Gateway 网关容器提供相同的卷映射（`-v /home/user/.openclaw:/home/user/.openclaw`），这样同一个主机路径也能从 Gateway 网关容器内部正确解析。映射不匹配会在 Gateway 网关尝试写入心跳时表现为 `EACCES`。
- **Codex 代码模式**：当 OpenClaw 沙箱处于活动状态时，OpenClaw 会在该轮次禁用 Codex app-server 原生代码模式、用户 MCP 服务器以及由应用托管的插件执行（这些都从 Gateway 网关主机上的 app-server 进程运行，而不是 OpenClaw 沙箱后端），除非沙箱工具策略暴露所需工具，并且你选择启用实验性沙箱 Exec 服务器路径。此时 Shell 访问会通过 OpenClaw 沙箱支持的工具路由，例如 `sandbox_exec` 和 `sandbox_process`。不要将主机 Docker 套接字挂载进 Agent 沙箱容器或自定义 Codex 沙箱。完整行为请参见 [Codex Harness](/zh-CN/plugins/codex-harness)。

在启用了 Docker 沙箱模式的 Ubuntu/AppArmor 主机上，Codex app-server 的 `workspace-write` Shell 执行需要沙箱容器内的非特权用户命名空间；当服务用户无法创建这些命名空间时，Shell 启动前可能会失败。当 Docker 沙箱出站网络被禁用（`network: "none"`，默认值）时，还需要一个非特权网络命名空间。常见症状包括：`bwrap: setting up uid map: Permission denied` 和 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。运行 `openclaw doctor`；如果它报告 Codex bwrap 命名空间探测失败，优先使用一个 AppArmor 配置文件，为 OpenClaw 服务进程授予所需命名空间。`kernel.apparmor_restrict_unprivileged_userns=0` 是主机范围的回退方案，但有安全取舍；仅当该主机安全态势可接受时才使用。
</Warning>

### 沙箱隔离浏览器

- 当浏览器工具需要时，沙箱浏览器会自动启动（确保 CDP 可达）。通过 `agents.defaults.sandbox.browser.autoStart`（默认 `true`）和 `autoStartTimeoutMs`（默认 12 秒）配置。
- 沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。通过 `agents.defaults.sandbox.browser.network` 配置。
- `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允许列表限制容器边缘的 CDP 入站访问（例如 `172.21.0.1/32`）。
- noVNC 观察者访问默认受密码保护；OpenClaw 会发出一个短期有效的令牌 URL，用于提供本地引导页面，并通过 URL 片段（不是查询字符串或标头日志）中的密码打开 noVNC。
- `agents.defaults.sandbox.browser.allowHostControl`（默认 `false`）允许沙箱隔离会话显式目标到主机浏览器。
- 可选允许列表会限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH 后端

使用 `backend: "ssh"` 在任意可通过 SSH 访问的机器上沙箱隔离 `exec`、文件工具和媒体读取。

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
          // Or use SecretRefs / inline contents instead of local files:
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

- **生命周期**：OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下创建一个按范围划分的远程根目录。在创建或重新创建后的首次使用时，它会从本地工作区向该远程工作区播种一次。之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取和入站媒体暂存都会通过 SSH 直接作用于远程工作区。OpenClaw 不会自动将远程更改同步回本地工作区。
- **身份验证材料**：`identityFile`/`certificateFile`/`knownHostsFile` 引用现有本地文件。`identityData`/`certificateData`/`knownHostsData` 接受内联字符串或 SecretRefs，通过正常的密钥运行时快照解析，写入权限模式为 `0600` 的临时文件，并在 SSH 会话结束时删除。如果同一项同时设置了 `*File` 和 `*Data` 变体，则该会话中 `*Data` 优先。
- **远程为准的后果**：初始播种后，远程 SSH 工作区会成为真实的沙箱状态。播种步骤之后在 OpenClaw 外部进行的主机本地编辑，直到你重新创建沙箱前都不会在远程可见。`openclaw sandbox recreate` 会删除按范围划分的远程根目录，并在下次使用时再次从本地播种。此后端不支持浏览器沙箱隔离，且 `sandbox.docker.*` 设置不适用于它。

## OpenShell 后端

使用 `backend: "openshell"` 在 OpenShell 托管的远程环境中沙箱隔离工具。OpenShell 复用与通用 SSH 后端相同的 SSH 传输和远程文件系统桥接，并添加 OpenShell 生命周期（`sandbox create/get/delete/ssh-config`）以及可选的 `mirror` 工作区同步模式。

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

`mode: "mirror"`（默认）保持本地工作区为准：OpenClaw 会在 `exec` 前将本地同步到沙箱，并在之后同步回来。`mode: "remote"` 会从本地向远程工作区播种一次，然后直接针对远程工作区运行 `exec`/`read`/`write`/`edit`/`apply_patch`，且不会同步回来；播种之后的本地编辑不可见，直到你执行 `openclaw sandbox recreate`。在 `scope: "agent"` 或 `scope: "shared"` 下，该远程工作区会在相同范围内共享。当前限制：尚不支持沙箱浏览器，且 `sandbox.docker.binds` 不适用于此后端。

`openclaw sandbox list`/`recreate`/prune all 会像处理 Docker 运行时一样处理 OpenShell 运行时；清理逻辑可感知后端。

完整前置要求、配置参考、工作区模式对比和生命周期细节，请参见 [OpenShell](/zh-CN/gateway/openshell)。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可以看到什么：

| 值               | 行为                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（默认）   | 工具会看到位于 `~/.openclaw/sandboxes` 下的隔离沙箱工作区。                               |
| `ro`             | 以只读方式将 Agent 工作区挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）。           |
| `rw`             | 以读写方式将 Agent 工作区挂载到 `/workspace`。                                            |

使用 OpenShell 后端时，`mirror` 模式仍会在 exec 轮次之间使用本地工作区作为规范来源，`remote` 模式会在初始种子之后使用远程 OpenShell 工作区作为规范来源，并且 `workspaceAccess: "ro"`/`"none"` 仍会以相同方式限制写入行为。

入站媒体会被复制到活动沙箱工作区（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙箱根目录为根。使用 `workspaceAccess: "none"` 时，OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`），以便读取。使用 `"rw"` 时，可以从 `/workspace/skills` 读取工作区 Skills，符合条件的托管、内置或插件 Skills 会被物化到生成的只读路径 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 会将额外的主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局绑定和每个 Agent 的绑定会合并（不会替换）。在 `scope: "shared"` 下，每个 Agent 的绑定会被忽略。

`agents.defaults.sandbox.browser.binds` 仅将额外的主机目录挂载到**沙箱浏览器**容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`；省略时，浏览器容器会回退到 `docker.binds`。

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
**绑定安全性**

- 绑定会绕过沙箱文件系统：它们会按你设置的模式（`:ro` 或 `:rw`）暴露主机路径。
- OpenClaw 默认阻止危险的绑定来源：系统路径（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker 套接字目录（`/run`、`/var/run` 及其 `docker.sock` 变体），以及常见的主目录凭据根目录（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 验证会规范化来源路径，然后通过最深的现有祖先再次解析它，再重新检查被阻止的路径和允许的根目录，因此即使最终叶子节点尚不存在，符号链接父目录逃逸也会失败关闭（例如，如果 `run-link` 指向那里，`/workspace/run-link/new-file` 仍会解析为 `/var/run/...`）。
- 绑定目标如果遮蔽保留的容器挂载点（`/workspace`、`/agent`），默认也会被阻止；可通过 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆盖。
- 工作区/Agent 工作区允许列表根目录之外的绑定来源默认会被阻止；可通过 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆盖。允许的根目录会以相同方式规范化，因此在符号链接解析前看起来位于允许列表内的路径，如果解析后位于允许根目录之外，仍会被拒绝。
- 敏感挂载（密钥、SSH 密钥、服务凭据）应使用 `:ro`，除非绝对需要。
- 如果你只需要读取工作区，请与 `workspaceAccess: "ro"` 结合使用；绑定模式仍保持独立。
- 请参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解绑定如何与工具策略和提升权限的 exec 交互。

</Warning>

## 镜像和设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

<Note>
**源码检出与 npm 安装**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 辅助脚本仅在从[源码检出](https://github.com/openclaw/openclaw)运行时可用。它们不包含在 npm 包中。

如果你通过 `npm install -g openclaw` 安装了 OpenClaw，请改用下面显示的内联 `docker build` 命令。
</Note>

<Steps>
  <Step title="构建默认镜像">
    从源码检出：

    ```bash
    scripts/sandbox-setup.sh
    ```

    从 npm 安装（无需源码检出）：

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

    默认镜像**不**包含 Node。如果某个 Skill 需要 Node（或其他运行时），请烘焙自定义镜像，或通过 `sandbox.docker.setupCommand` 安装（需要网络出口 + 可写根目录 + root 用户）。

    当缺少 `openclaw-sandbox:bookworm-slim` 时，OpenClaw 不会静默替换为普通的 `debian:bookworm-slim`。以默认镜像为目标的沙箱运行会快速失败并给出构建说明，直到你构建该镜像，因为内置镜像携带了供沙箱写入/编辑辅助工具使用的 `python3`。

  </Step>
  <Step title="可选：构建通用镜像">
    如需包含常用工具的更完整沙箱镜像（例如 `curl`、`jq`、Node 24、pnpm、`python3` 和 `git`）：

    从源码检出：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    从 npm 安装时，先构建默认镜像（见上文），然后使用仓库中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) 在其基础上构建通用镜像。

    然后将 `agents.defaults.sandbox.docker.image` 设置为 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="可选：构建沙箱浏览器镜像">
    从源码检出：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    从 npm 安装时，使用仓库中的 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) 构建。

  </Step>
</Steps>

默认情况下，Docker 沙箱容器运行时**没有网络**。可通过 `agents.defaults.sandbox.docker.network` 覆盖。

<AccordionGroup>
  <Accordion title="沙箱浏览器 Chromium 默认值">
    内置沙箱浏览器镜像会为容器化工作负载应用保守的 Chromium 启动标志：

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
    - 默认使用 `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`；这些图形加固标志有助于没有 GPU 支持的容器。如果你的工作负载需要 WebGL 或其他 3D 功能，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - 默认使用 `--disable-extensions`；对于依赖扩展的流程，请设置 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 默认使用 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 保留 Chromium 的默认值。

    如果你需要不同的运行时配置，请使用自定义浏览器镜像并提供自己的入口点。对于本地（非容器）Chromium 配置，请使用 `browser.extraArgs` 追加额外启动标志。

  </Accordion>
  <Accordion title="网络安全默认值">
    - `network: "host"` 会被阻止。
    - `network: "container:<id>"` 默认会被阻止（存在命名空间加入绕过风险）。
    - 紧急覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安装和容器化 Gateway 网关位于此处：[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导沙箱配置。设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以启用该路径。使用 `OPENCLAW_DOCKER_SOCKET` 覆盖套接字位置。完整设置和环境变量参考：[Docker](/zh-CN/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**运行一次**（不是每次运行都执行）。它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每个 Agent：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常见陷阱">
    - 默认 `docker.network` 是 `"none"`（无出口），因此包安装会失败。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且仅用于紧急情况。
    - `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false` 或烘焙自定义镜像。
    - `user` 必须是 root 才能安装包（省略 `user` 或设置 `user: "0:0"`）。
    - 沙箱 exec **不会**继承主机 `process.env`。请使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）提供 Skill API 密钥。
    - `agents.defaults.sandbox.docker.env` 中的值会作为显式 Docker 容器环境变量传递。任何拥有 Docker 守护进程访问权限的人都可以用 `docker inspect` 等 Docker 元数据命令查看它们。如果这种元数据暴露不可接受，请使用自定义镜像、挂载的密钥文件或其他密钥传递路径。

  </Accordion>
</AccordionGroup>

## 工具策略和逃逸通道

工具允许/拒绝策略仍会先于沙箱规则应用。如果某个工具在全局或每个 Agent 层面被拒绝，沙箱隔离不会把它恢复回来。

`tools.elevated` 是一个显式逃逸通道，会在沙箱外运行 `exec`（默认为 `gateway`，或当 exec 目标是 `node` 时为 `node`）。`/exec` 指令仅适用于已授权的发送者，并按会话持久化；要硬禁用 `exec`，请使用工具策略拒绝（参见[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- `openclaw sandbox list` 显示沙箱容器、状态、镜像匹配、年龄、空闲时间，以及关联的会话/Agent。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 会检查生效的沙箱模式、主机工作区、运行时工作目录、Docker 挂载、工具策略和修复配置键。它的 `workspaceRoot` 字段仍是已配置的沙箱根目录；`effectiveHostWorkspaceRoot` 显示活动工作区实际所在位置。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 会移除容器/环境，使其在下次使用时按当前配置重新创建。
- 请参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解“为什么这被阻止？”的心智模型。

## 多 Agent 覆盖

每个 Agent 都可以覆盖沙箱 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（以及用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。有关优先级，请参阅[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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

## 相关

- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按 Agent 覆盖和优先级
- [OpenShell](/zh-CN/gateway/openshell) -- 托管式沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试“为什么会被阻止？”
- [安全](/zh-CN/gateway/security)
