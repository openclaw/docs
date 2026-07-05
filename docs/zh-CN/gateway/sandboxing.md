---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱隔离的工作原理：模式、权限范围、工作区访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-07-05T11:20:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c12441ddcecc6bbd2ed6dfa28af843c1492ab39621cc7ead25d51e0a7bacba6a
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在沙箱后端内运行工具执行，以降低影响范围。沙箱隔离默认关闭，由 `agents.defaults.sandbox`（全局）或 `agents.list[].sandbox`（按 Agent）控制。Gateway 网关进程始终留在主机上；启用后，只有工具执行会移入沙箱。

<Note>
这不是完美的安全边界，但当模型做出不当操作时，它能显著限制文件系统和进程访问。
</Note>

## 会被沙箱隔离的内容

- 工具执行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 可选的沙箱隔离浏览器（`agents.defaults.sandbox.browser`）。

不会被沙箱隔离：

- Gateway 网关进程本身。
- 任何通过 `tools.elevated` 显式允许在沙箱外运行的工具。提升权限的 Exec 会绕过沙箱隔离，并在配置的逃逸路径上运行（默认为 `gateway`，当 Exec 目标是 `node` 时为 `node`）。如果沙箱隔离已关闭，`tools.elevated` 不会改变任何行为，因为 Exec 本来就已经在主机上运行。参见 [提升权限模式](/zh-CN/tools/elevated)。

## 模式、范围和后端

三个独立设置控制沙箱行为：

| 设置 | 键                                | 值                           | 默认值   |
| ---- | --------------------------------- | ---------------------------- | -------- |
| 模式 | `agents.defaults.sandbox.mode`    | `off`、`non-main`、`all`     | `off`    |
| 范围 | `agents.defaults.sandbox.scope`   | `agent`、`session`、`shared` | `agent`  |
| 后端 | `agents.defaults.sandbox.backend` | `docker`、`ssh`、`openshell` | `docker` |

**模式**控制何时应用沙箱隔离：

- `off`：不启用沙箱隔离。
- `non-main`：除 Agent 主会话之外的每个会话都进入沙箱。主会话键始终是 `agent:<agentId>:main`（当 `session.scope` 为 `"global"` 时为 `global`）；它不可配置。群组/渠道会话使用自己的键，因此始终算作非主会话并会被沙箱隔离。
- `all`：每个会话都在沙箱中运行。

**范围**控制创建多少个容器/环境：

- `agent`：每个 Agent 一个容器。
- `session`：每个会话一个容器。
- `shared`：所有被沙箱隔离的会话共享一个容器（在此范围下会忽略按 Agent 设置的 `docker`/`ssh`/`browser` 覆盖项）。

**后端**控制由哪个运行时执行沙箱隔离工具。SSH 专用配置位于 `agents.defaults.sandbox.ssh` 下；OpenShell 专用配置位于 `plugins.entries.openshell.config` 下。

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **运行位置**        | 本地容器                         | 任何可通过 SSH 访问的主机      | OpenShell 托管沙箱                                  |
| **设置**            | `scripts/sandbox-setup.sh`       | SSH 密钥 + 目标主机            | 已启用 OpenShell 插件                               |
| **工作区模型**      | 绑定挂载或复制                   | 远程规范（只种子初始化一次）   | `mirror` 或 `remote`                                |
| **网络控制**        | `docker.network`（默认：无）     | 取决于远程主机                 | 取决于 OpenShell                                    |
| **浏览器沙箱**      | 支持                             | 不支持                         | 尚不支持                                            |
| **绑定挂载**        | `docker.binds`                   | N/A                            | N/A                                                 |
| **最适合**          | 本地开发、完整隔离               | 卸载到远程机器                 | 带可选双向同步的托管远程沙箱                        |

## Docker 后端

启用沙箱隔离后，Docker 是默认后端。它通过 Docker daemon socket（`/var/run/docker.sock`）在本地运行工具和沙箱浏览器；隔离来自 Docker 命名空间。

默认值：`network: "none"`（无出站）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、镜像 `openclaw-sandbox:bookworm-slim`。

要暴露主机 GPU，请将 `agents.defaults.sandbox.docker.gpus`（或按 Agent 覆盖项）设为类似 `"all"` 或 `"device=GPU-uuid"` 的值。该值会传给 Docker 的 `--gpus` 标志，并要求主机具备兼容的运行时，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker (DooD) 约束**

如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会使用主机的 Docker socket（DooD）编排同级沙箱容器。这会引入路径映射约束：

- **配置需要主机路径**：`openclaw.json` 的 `workspace` 必须包含**主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 网关容器内部路径。Docker daemon 会相对于主机 OS 命名空间评估路径，而不是相对于 Gateway 网关自身的命名空间。
- **需要匹配的卷映射**：Gateway 网关进程还会将 Heartbeat 和桥接文件写入该 `workspace` 路径。请为 Gateway 网关容器提供相同的卷映射（`-v /home/user/.openclaw:/home/user/.openclaw`），这样同一主机路径也能在 Gateway 网关容器内部正确解析。映射不匹配时，Gateway 网关尝试写入 Heartbeat 会表现为 `EACCES`。
- **Codex 代码模式**：当 OpenClaw 沙箱处于活动状态时，OpenClaw 会在该轮次中禁用 Codex app-server 原生代码模式、用户 MCP 服务器以及由 app 支持的插件执行（这些从 Gateway 网关主机 app-server 进程运行，而不是从 OpenClaw 沙箱后端运行），除非沙箱工具策略暴露了所需工具，并且你选择启用实验性的沙箱 exec-server 路径。Shell 访问随后会通过 OpenClaw 沙箱支持的工具路由，例如 `sandbox_exec` 和 `sandbox_process`。不要把主机 Docker socket 挂载进 Agent 沙箱容器或自定义 Codex 沙箱。完整行为见 [Codex Harness](/zh-CN/plugins/codex-harness)。

在启用 Docker 沙箱模式的 Ubuntu/AppArmor 主机上，Codex app-server `workspace-write` shell 执行需要沙箱容器内的非特权用户命名空间；当服务用户无法创建它们时，可能会在 shell 启动前失败。当 Docker 沙箱出站被禁用（`network: "none"`，默认值）时，还需要一个非特权网络命名空间。常见症状：`bwrap: setting up uid map: Permission denied` 和 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。运行 `openclaw doctor`；如果它报告 Codex bwrap 命名空间探测失败，优先使用为 OpenClaw 服务进程授予所需命名空间的 AppArmor 配置文件。`kernel.apparmor_restrict_unprivileged_userns=0` 是带有安全权衡的主机级回退；仅在该主机安全态势可接受时使用。
</Warning>

### 沙箱隔离浏览器

- 当浏览器工具需要它时，沙箱浏览器会自动启动（确保 CDP 可访问）。通过 `agents.defaults.sandbox.browser.autoStart`（默认 `true`）和 `autoStartTimeoutMs`（默认 12 秒）配置。
- 沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。通过 `agents.defaults.sandbox.browser.network` 配置。
- `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允许列表限制容器边缘的 CDP 入口（例如 `172.21.0.1/32`）。
- noVNC 观察者访问默认受密码保护；OpenClaw 会发出一个短期有效的令牌 URL，该 URL 提供本地引导页面，并在 URL 片段（不是查询字符串或请求头日志）中带上密码打开 noVNC。
- `agents.defaults.sandbox.browser.allowHostControl`（默认 `false`）允许沙箱隔离会话显式指定主机浏览器为目标。
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

- **生命周期**：OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下创建一个按范围划分的远程根目录。创建或重新创建后首次使用时，它会从本地工作区种子初始化一次该远程工作区。之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示词媒体读取和入站媒体暂存都会直接通过 SSH 面向远程工作区运行。OpenClaw 不会自动将远程更改同步回本地工作区。
- **身份验证材料**：`identityFile`/`certificateFile`/`knownHostsFile` 引用现有本地文件。`identityData`/`certificateData`/`knownHostsData` 接受内联字符串或 SecretRefs，通过常规密钥运行时快照解析，写入权限为 `0600` 的临时文件，并在 SSH 会话结束时删除。如果同一项同时设置了 `*File` 和 `*Data` 变体，则该会话中 `*Data` 优先。
- **远程规范的后果**：初始种子步骤之后，远程 SSH 工作区会成为真正的沙箱状态。种子步骤后在 OpenClaw 外部进行的主机本地编辑不会在远程可见，直到你重新创建沙箱。`openclaw sandbox recreate` 会删除按范围划分的远程根目录，并在下次使用时再次从本地种子初始化。此后端不支持浏览器沙箱隔离，且 `sandbox.docker.*` 设置不适用于它。

## OpenShell 后端

使用 `backend: "openshell"` 在 OpenShell 管理的远程环境中沙箱隔离工具。OpenShell 复用与通用 SSH 后端相同的 SSH 传输和远程文件系统桥接，并添加 OpenShell 生命周期（`sandbox create/get/delete/ssh-config`）以及可选的 `mirror` 工作区同步模式。

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

`mode: "mirror"`（默认）会保持本地工作区为规范来源：OpenClaw 会在 `exec` 前将本地同步到沙箱，并在之后同步回来。`mode: "remote"` 会从本地种子初始化远程工作区一次，然后直接面向远程工作区运行 `exec`/`read`/`write`/`edit`/`apply_patch`，不会同步回来；种子初始化后的本地编辑不可见，直到你执行 `openclaw sandbox recreate`。在 `scope: "agent"` 或 `scope: "shared"` 下，该远程工作区会在相同范围内共享。当前限制：尚不支持沙箱浏览器，且 `sandbox.docker.binds` 不适用于此后端。

`openclaw sandbox list`/`recreate`/prune all 会像处理 Docker 运行时一样处理 OpenShell 运行时；清理逻辑会感知后端。

完整前置条件、配置参考、工作区模式对比和生命周期详情见 [OpenShell](/zh-CN/gateway/openshell)。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可以看到什么：

| 值               | 行为                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（默认）   | 工具会看到 `~/.openclaw/sandboxes` 下隔离的沙箱工作区。                                   |
| `ro`             | 以只读方式将 Agent 工作区挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）。          |
| `rw`             | 以读写方式将 Agent 工作区挂载到 `/workspace`。                                            |

使用 OpenShell 后端时，`mirror` 模式仍在 exec 轮次之间使用本地工作区作为权威来源，`remote` 模式在初始种子之后使用远程 OpenShell 工作区作为权威来源，而 `workspaceAccess: "ro"`/`"none"` 仍以相同方式限制写入行为。

入站媒体会复制到活动的沙箱工作区（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙箱根目录为根。使用 `workspaceAccess: "none"` 时，OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`），以便读取。使用 `"rw"` 时，可从 `/workspace/skills` 读取工作区 Skills，符合条件的托管、内置或插件 Skills 会物化到生成的只读路径 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 会将额外的主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局绑定和按 Agent 配置的绑定会合并（而不是替换）。在 `scope: "shared"` 下，会忽略按 Agent 配置的绑定。

`agents.defaults.sandbox.browser.binds` 只会将额外的主机目录挂载到**沙箱浏览器**容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`；省略时，浏览器容器会回退到 `docker.binds`。

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

- 绑定会绕过沙箱文件系统：它们会按你设置的模式（`:ro` 或 `:rw`）暴露主机路径。
- OpenClaw 默认会阻止危险的绑定来源：系统路径（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker socket 目录（`/run`、`/var/run` 及其 `docker.sock` 变体），以及常见的主目录凭证根目录（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 验证会规范化源路径，然后通过最深的已存在祖先再次解析它，再重新检查被阻止路径和允许的根目录，因此即使最终叶子节点还不存在，符号链接父目录逃逸也会失败关闭（例如，如果 `run-link` 指向那里，`/workspace/run-link/new-file` 仍会解析为 `/var/run/...`）。
- 默认也会阻止遮蔽保留容器挂载点（`/workspace`、`/agent`）的绑定目标；可用 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆盖。
- 默认会阻止工作区/Agent 工作区允许列表根目录之外的绑定来源；可用 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆盖。允许的根目录也会以相同方式规范化，因此在符号链接解析前看起来位于允许列表内的路径，如果解析后位于允许根目录之外，仍会被拒绝。
- 敏感挂载（密钥、SSH 密钥、服务凭证）除非绝对必要，否则应使用 `:ro`。
- 如果你只需要对工作区的读取访问，请与 `workspaceAccess: "ro"` 结合使用；绑定模式保持独立。
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

    默认镜像**不**包含 Node。如果某个技能需要 Node（或其他运行时），请构建自定义镜像，或通过 `sandbox.docker.setupCommand` 安装（需要网络出口 + 可写 root + root 用户）。

    当缺少 `openclaw-sandbox:bookworm-slim` 时，OpenClaw 不会静默替换为普通的 `debian:bookworm-slim`。以默认镜像为目标的沙箱运行会快速失败并给出构建说明，直到你构建它，因为内置镜像包含供沙箱写入/编辑辅助工具使用的 `python3`。

  </Step>
  <Step title="可选：构建通用镜像">
    如需包含常见工具的功能更完整的沙箱镜像（例如 `curl`、`jq`、Node 24、pnpm、`python3` 和 `git`）：

    从源码检出：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    从 npm 安装时，先构建默认镜像（见上文），然后基于它使用仓库中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) 构建通用镜像。

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

默认情况下，Docker 沙箱容器在**无网络**状态下运行。可用 `agents.defaults.sandbox.docker.network` 覆盖。

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
    - 默认使用 `--disable-extensions`；依赖扩展的流程请设置 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 默认使用 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 保留 Chromium 的默认值。

    如果你需要不同的运行时配置，请使用自定义浏览器镜像并提供自己的入口点。对于本地（非容器）Chromium 配置，请使用 `browser.extraArgs` 追加额外的启动标志。

  </Accordion>
  <Accordion title="网络安全默认值">
    - `network: "host"` 会被阻止。
    - 默认会阻止 `network: "container:<id>"`（存在命名空间加入绕过风险）。
    - 紧急覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安装和容器化 Gateway 网关位于此处：[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导沙箱配置。设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）可启用该路径。使用 `OPENCLAW_DOCKER_SOCKET` 覆盖 socket 位置。完整设置和环境变量参考：[Docker](/zh-CN/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**运行一次**（不是每次运行都执行）。它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 按 Agent 配置：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常见陷阱">
    - 默认 `docker.network` 是 `"none"`（无出口），因此包安装会失败。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且仅用于紧急情况。
    - `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false` 或构建自定义镜像。
    - 安装包时 `user` 必须是 root（省略 `user` 或设置 `user: "0:0"`）。
    - 沙箱 exec **不会**继承主机 `process.env`。请使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）提供技能 API 密钥。
    - `agents.defaults.sandbox.docker.env` 中的值会作为显式 Docker 容器环境变量传入。任何拥有 Docker daemon 访问权限的人都可以通过 `docker inspect` 等 Docker 元数据命令检查它们。如果这种元数据暴露不可接受，请使用自定义镜像、挂载的密钥文件或其他密钥交付路径。

  </Accordion>
</AccordionGroup>

## 工具策略和逃逸通道

工具允许/拒绝策略仍会在沙箱规则之前应用。如果某个工具在全局或按 Agent 配置中被拒绝，沙箱隔离不会把它恢复回来。

`tools.elevated` 是一个显式逃逸通道，会在沙箱外运行 `exec`（默认是 `gateway`，当 exec 目标是 `node` 时则为 `node`）。`/exec` 指令仅适用于已授权发送者，并按会话持久保存；若要硬禁用 `exec`，请使用工具策略拒绝（参见[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- `openclaw sandbox list` 显示沙箱容器、状态、镜像匹配、年龄、空闲时间，以及关联的会话/Agent。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 检查有效沙箱模式、工具策略和修复配置键。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 移除容器/环境，使它们在下次使用时按当前配置重新创建。
- 请参阅[沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解“为什么这被阻止？”的思维模型。

## 多 Agent 覆盖

每个 Agent 都可以覆盖沙箱 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（加上用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。有关优先级，请参阅[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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

- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按 Agent 配置的覆盖项和优先级
- [OpenShell](/zh-CN/gateway/openshell) -- 托管沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱、工具策略和提升权限](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试“为什么这被阻止了？”
- [安全](/zh-CN/gateway/security)
