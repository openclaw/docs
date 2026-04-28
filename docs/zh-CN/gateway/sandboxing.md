---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱隔离的工作方式：模式、作用范围、工作区访问和图像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-04-26T07:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw 可以在**沙箱后端内运行工具**，以减少影响范围。这是**可选的**，并通过配置（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）控制。如果关闭沙箱隔离，工具会在主机上运行。Gateway 网关保持在主机上；启用后，工具执行会在隔离的沙箱中运行。

<Note>
这不是一个完美的安全边界，但当模型做出愚蠢操作时，它能显著限制文件系统和进程访问。
</Note>

## 哪些内容会被沙箱隔离

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱隔离浏览器（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="沙箱隔离浏览器详情">
    - 默认情况下，当浏览器工具需要时，沙箱浏览器会自动启动（确保 CDP 可访问）。可通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 进行配置。
    - 默认情况下，沙箱浏览器容器使用专用的 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。可通过 `agents.defaults.sandbox.browser.network` 配置。
    - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 会使用 CIDR 允许列表限制容器边缘的 CDP 入站连接（例如 `172.21.0.1/32`）。
    - noVNC 观察者访问默认受密码保护；OpenClaw 会输出一个短期有效的令牌 URL，它会提供一个本地引导页面，并在 URL 片段中（而不是查询参数/请求头日志中）携带密码来打开 noVNC。
    - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱隔离会话显式以主机浏览器为目标。
    - 可选的允许列表可限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。
  </Accordion>
</AccordionGroup>

不会被沙箱隔离的内容：

- Gateway 网关进程本身。
- 任何被明确允许在沙箱外运行的工具（例如 `tools.elevated`）。
  - **提升权限的 `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`，或者当 `exec` 目标为 `node` 时使用 `node`）。**
  - 如果关闭了沙箱隔离，`tools.elevated` 不会改变执行方式（本来就在主机上）。参见 [Elevated Mode](/zh-CN/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱隔离：

<Tabs>
  <Tab title="off">
    不使用沙箱隔离。
  </Tab>
  <Tab title="non-main">
    仅对**非主**会话使用沙箱（如果你希望普通聊天在主机上运行，这是默认推荐值）。

    `"non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是智能体 id。群组/渠道会话使用它们自己的键，因此它们会被视为非主会话并进入沙箱。

  </Tab>
  <Tab title="all">
    每个会话都在沙箱中运行。
  </Tab>
</Tabs>

## 作用范围

`agents.defaults.sandbox.scope` 控制**会创建多少个容器**：

- `"agent"`（默认）：每个智能体一个容器。
- `"session"`：每个会话一个容器。
- `"shared"`：所有沙箱隔离会话共享一个容器。

## 后端

`agents.defaults.sandbox.backend` 控制**由哪个运行时**提供沙箱：

- `"docker"`（启用沙箱隔离时的默认值）：本地 Docker 支持的沙箱运行时。
- `"ssh"`：通用 SSH 支持的远程沙箱运行时。
- `"openshell"`：OpenShell 支持的沙箱运行时。

SSH 专用配置位于 `agents.defaults.sandbox.ssh`。OpenShell 专用配置位于 `plugins.entries.openshell.config`。

### 选择后端

|                     | Docker                    | SSH                  | OpenShell                         |
| ------------------- | ------------------------- | -------------------- | --------------------------------- |
| **运行位置**        | 本地容器                  | 任何可通过 SSH 访问的主机 | OpenShell 管理的沙箱              |
| **设置**            | `scripts/sandbox-setup.sh` | SSH 密钥 + 目标主机  | 启用 OpenShell 插件               |
| **工作区模型**      | 绑定挂载或复制            | 远程规范（一次初始化） | `mirror` 或 `remote`              |
| **网络控制**        | `docker.network`（默认：无） | 取决于远程主机       | 取决于 OpenShell                  |
| **浏览器沙箱**      | 支持                      | 不支持               | 尚不支持                          |
| **绑定挂载**        | `docker.binds`            | 不适用               | 不适用                            |
| **最适合**          | 本地开发、完整隔离        | 卸载到远程机器运行   | 带可选双向同步的托管远程沙箱      |

### Docker 后端

沙箱隔离默认关闭。如果你启用了沙箱隔离但没有选择后端，OpenClaw 会使用 Docker 后端。它通过 Docker 守护进程套接字（`/var/run/docker.sock`）在本地执行工具和沙箱浏览器。沙箱容器的隔离性由 Docker 命名空间决定。

<Warning>
**Docker-out-of-Docker（DooD）约束**

如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会使用主机的 Docker 套接字（DooD）来编排同级沙箱容器。这会引入一个特定的路径映射约束：

- **配置必须使用主机路径**：`openclaw.json` 中的 `workspace` 配置必须包含**主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 网关容器内部路径。当 OpenClaw 请求 Docker 守护进程启动一个沙箱时，守护进程会相对于主机操作系统命名空间解析路径，而不是 Gateway 网关命名空间。
- **文件系统桥接一致性（相同的卷映射）**：OpenClaw Gateway 网关原生进程也会将心跳和桥接文件写入 `workspace` 目录。由于 Gateway 网关在它自己的容器化环境内会解析完全相同的字符串（主机路径），因此 Gateway 网关部署必须包含一个相同的卷映射，以便原生链接到主机命名空间（`-v /home/user/.openclaw:/home/user/.openclaw`）。

如果你在内部映射路径时没有保持绝对主机路径一致性，OpenClaw 会原生抛出一个 `EACCES` 权限错误，因为该完全限定路径字符串在容器环境中原生不存在，导致它在容器内尝试写入心跳时失败。
</Warning>

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
          // 或者使用 SecretRef / 内联内容而不是本地文件：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="工作原理">
    - OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下按作用范围创建远程根目录。
    - 在创建或重建之后的首次使用时，OpenClaw 会将本地工作区一次性初始化到该远程工作区。
    - 之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取以及入站媒体暂存都会通过 SSH 直接针对远程工作区运行。
    - OpenClaw 不会自动将远程更改同步回本地工作区。
  </Accordion>
  <Accordion title="认证材料">
    - `identityFile`、`certificateFile`、`knownHostsFile`：使用现有本地文件，并通过 OpenSSH 配置传递。
    - `identityData`、`certificateData`、`knownHostsData`：使用内联字符串或 SecretRef。OpenClaw 会通过正常的 secrets 运行时快照解析它们，将其写入权限为 `0600` 的临时文件，并在 SSH 会话结束时删除它们。
    - 如果为同一项同时设置了 `*File` 和 `*Data`，则该 SSH 会话中 `*Data` 优先。
  </Accordion>
  <Accordion title="远程规范模型的影响">
    这是一个**远程规范**模型。初始初始化之后，远程 SSH 工作区就成为真实的沙箱状态。

    - 在初始化步骤之后，如果在 OpenClaw 外部对主机本地进行了编辑，这些更改在你重建沙箱之前不会在远程端可见。
    - `openclaw sandbox recreate` 会删除按作用范围划分的远程根目录，并在下次使用时再次从本地初始化。
    - SSH 后端不支持浏览器沙箱隔离。
    - `sandbox.docker.*` 设置不适用于 SSH 后端。

  </Accordion>
</AccordionGroup>

### OpenShell 后端

当你希望 OpenClaw 在由 OpenShell 管理的远程环境中对工具进行沙箱隔离时，请使用 `backend: "openshell"`。有关完整设置指南、配置参考以及工作区模式对比，请参见专门的 [OpenShell 页面](/zh-CN/gateway/openshell)。

OpenShell 复用了与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥接，并增加了 OpenShell 专用生命周期（`sandbox create/get/delete`、`sandbox ssh-config`）以及可选的 `mirror` 工作区模式。

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

- `mirror`（默认）：本地工作区保持为规范源。OpenClaw 会在 `exec` 之前将本地文件同步到 OpenShell，并在 `exec` 之后将远程工作区同步回来。
- `remote`：创建沙箱后，OpenShell 工作区成为规范源。OpenClaw 会先将本地工作区一次性初始化到远程工作区，然后文件工具和 `exec` 会直接针对远程沙箱运行，不会把更改同步回本地。

<AccordionGroup>
  <Accordion title="远程传输细节">
    - OpenClaw 会通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求沙箱专用 SSH 配置。
    - 核心会将该 SSH 配置写入临时文件，打开 SSH 会话，并复用 `backend: "ssh"` 使用的同一远程文件系统桥接。
    - 只有在 `mirror` 模式下，生命周期才不同：在 `exec` 前将本地同步到远程，然后在 `exec` 后同步回来。
  </Accordion>
  <Accordion title="当前 OpenShell 限制">
    - 尚不支持 sandbox browser
    - OpenShell 后端不支持 `sandbox.docker.binds`
    - `sandbox.docker.*` 下的 Docker 专用运行时调节项仍然只适用于 Docker 后端
  </Accordion>
</AccordionGroup>

#### 工作区模式

OpenShell 有两种工作区模型。这是实际使用中最重要的部分。

<Tabs>
  <Tab title="mirror (local canonical)">
    当你希望**本地工作区保持为规范源**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

    行为：

    - 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
    - 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
    - 文件工具仍然通过沙箱桥接运行，但在轮次之间，本地工作区仍然是事实来源。

    适用场景：

    - 你会在 OpenClaw 外部本地编辑文件，并希望这些更改自动出现在沙箱中
    - 你希望 OpenShell 沙箱的行为尽可能接近 Docker 后端
    - 你希望主机工作区在每次 `exec` 轮次后反映沙箱写入

    代价：在 `exec` 前后会产生额外的同步开销。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    当你希望 **OpenShell 工作区成为规范源** 时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

    行为：

    - 首次创建沙箱时，OpenClaw 会将本地工作区一次性初始化到远程工作区。
    - 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 会直接针对远程 OpenShell 工作区运行。
    - OpenClaw **不会** 在 `exec` 之后将远程更改同步回本地工作区。
    - 提示阶段的媒体读取仍然可用，因为文件和媒体工具会通过沙箱桥接读取，而不是假定存在本地主机路径。
    - 传输方式是通过 SSH 连接到 `openshell sandbox ssh-config` 返回的 OpenShell 沙箱。

    重要影响：

    - 如果你在初始化步骤之后于 OpenClaw 外部在主机上编辑文件，远程沙箱**不会**自动看到这些更改。
    - 如果沙箱被重建，远程工作区会再次从本地工作区初始化。
    - 当使用 `scope: "agent"` 或 `scope: "shared"` 时，该远程工作区会在同一作用范围内共享。

    适用场景：

    - 沙箱应主要驻留在远程 OpenShell 侧
    - 你希望每轮的同步开销更低
    - 你不希望主机本地编辑静默覆盖远程沙箱状态

  </Tab>
</Tabs>

如果你把沙箱视为临时执行环境，请选择 `mirror`。如果你把沙箱视为真实工作区，请选择 `remote`。

#### OpenShell 生命周期

OpenShell 沙箱仍然通过常规沙箱生命周期进行管理：

- `openclaw sandbox list` 会显示 OpenShell 运行时以及 Docker 运行时
- `openclaw sandbox recreate` 会删除当前运行时，并让 OpenClaw 在下次使用时重新创建它
- 清理逻辑也能识别不同后端

对于 `remote` 模式，重建尤其重要：

- 重建会删除该作用范围的规范远程工作区
- 下一次使用时会从本地工作区初始化一个全新的远程工作区

对于 `mirror` 模式，重建主要是重置远程执行环境，因为本地工作区无论如何仍然是规范源。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱可以看到什么**：

<Tabs>
  <Tab title="none (default)">
    工具会看到位于 `~/.openclaw/sandboxes` 下的沙箱工作区。
  </Tab>
  <Tab title="ro">
    以只读方式将智能体工作区挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）。
  </Tab>
  <Tab title="rw">
    以读写方式将智能体工作区挂载到 `/workspace`。
  </Tab>
</Tabs>

使用 OpenShell 后端时：

- `mirror` 模式仍然在每次 `exec` 轮次之间将本地工作区作为规范源
- `remote` 模式在初始初始化后将远程 OpenShell 工作区作为规范源
- `workspaceAccess: "ro"` 和 `"none"` 仍然会以相同方式限制写入行为

入站媒体会被复制到当前活动的沙箱工作区中（`media/inbound/*`）。

<Note>
**Skills 注意事项：** `read` 工具以沙箱根目录为基础。使用 `workspaceAccess: "none"` 时，OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`），以便读取。使用 `"rw"` 时，工作区 Skills 可从 `/workspace/skills` 读取。
</Note>

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 会将额外的主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局绑定和每个智能体的绑定会**合并**（而不是替换）。在 `scope: "shared"` 下，每个智能体的绑定会被忽略。

`agents.defaults.sandbox.browser.binds` 仅将额外的主机目录挂载到**沙箱浏览器**容器中。

- 设置后（包括 `[]`），它会在浏览器容器中替换 `agents.defaults.sandbox.docker.binds`。
- 如果省略，浏览器容器会回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

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

<Warning>
**绑定安全性**

- 绑定会绕过沙箱文件系统：它们会以你设置的模式（`:ro` 或 `:rw`）暴露主机路径。
- OpenClaw 会阻止危险的绑定源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`，以及会暴露它们的父级挂载）。
- OpenClaw 还会阻止常见的主目录凭证根目录，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- 绑定校验不只是字符串匹配。OpenClaw 会先标准化源路径，然后通过最深的现有祖先路径再次解析它，再重新检查被阻止的路径和允许的根目录。
- 这意味着即使最终叶子节点尚不存在，父级符号链接逃逸仍然会被安全地拒绝。例如，如果 `run-link` 指向那里，那么 `/workspace/run-link/new-file` 仍会被解析为 `/var/run/...`。
- 允许的源根目录也会以相同方式标准化，因此某个路径即使在符号链接解析之前看起来位于允许列表内，仍然会因 `outside allowed roots` 而被拒绝。
- 敏感挂载（密钥、SSH 密钥、服务凭证）除非绝对必要，否则应使用 `:ro`。
- 如果你只需要对工作区进行只读访问，请结合 `workspaceAccess: "ro"` 使用；绑定模式仍然彼此独立。
- 关于绑定如何与工具策略和提升权限 `exec` 交互，请参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。
</Warning>

## 镜像和设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="构建默认镜像">
    ```bash
    scripts/sandbox-setup.sh
    ```

    默认镜像**不**包含 Node。如果某个 Skill 需要 Node（或其他运行时），请自行构建自定义镜像，或通过 `sandbox.docker.setupCommand` 安装（需要网络出口 + 可写根文件系统 + root 用户）。

  </Step>
  <Step title="可选：构建通用镜像">
    如需更实用的沙箱镜像并包含常用工具（例如 `curl`、`jq`、`nodejs`、`python3`、`git`）：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    然后将 `agents.defaults.sandbox.docker.image` 设置为 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="可选：构建沙箱浏览器镜像">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

默认情况下，Docker 沙箱容器**没有网络**。可通过 `agents.defaults.sandbox.docker.network` 覆盖。

<AccordionGroup>
  <Accordion title="沙箱浏览器 Chromium 默认值">
    随附的沙箱浏览器镜像还会对容器化工作负载应用较为保守的 Chromium 启动默认值。当前容器默认值包括：

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
    - 启用 `noSandbox` 时使用 `--no-sandbox`。
    - 三个图形加固标志（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）是可选的，当容器缺少 GPU 支持时很有用。如果你的工作负载需要 WebGL 或其他 3D/浏览器特性，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - `--disable-extensions` 默认启用；对于依赖扩展的流程，可通过 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 禁用。
    - `--renderer-process-limit=2` 由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 会保留 Chromium 的默认值。

    如果你需要不同的运行时配置文件，请使用自定义浏览器镜像并提供你自己的入口点。对于本地（非容器）Chromium 配置文件，请使用 `browser.extraArgs` 追加额外的启动标志。

  </Accordion>
  <Accordion title="网络安全默认值">
    - `network: "host"` 会被阻止。
    - `network: "container:<id>"` 默认会被阻止（存在绕过命名空间加入的风险）。
    - 应急覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。
  </Accordion>
</AccordionGroup>

Docker 安装和容器化 Gateway 网关部署请参见这里：[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导沙箱配置。设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以启用该路径。你可以通过 `OPENCLAW_DOCKER_SOCKET` 覆盖套接字位置。完整设置和环境变量参考： [Docker](/zh-CN/install/docker#agent-sandbox)。

## `setupCommand`（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**运行一次**（不是每次运行都执行）。它会通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每个智能体：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常见陷阱">
    - 默认 `docker.network` 为 `"none"`（无出口网络），因此安装软件包会失败。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，仅应用于应急情况。
    - `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false` 或构建自定义镜像。
    - 安装软件包时，`user` 必须为 root（省略 `user` 或设置 `user: "0:0"`）。
    - 沙箱 `exec` **不会**继承主机 `process.env`。对于 Skill API 密钥，请使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）。
  </Accordion>
</AccordionGroup>

## 工具策略和逃逸通道

工具允许/拒绝策略仍会在沙箱规则之前生效。如果某个工具在全局或某个智能体上被拒绝，沙箱隔离不会把它重新启用。

`tools.elevated` 是一个显式逃逸通道，它会在沙箱外运行 `exec`（默认使用 `gateway`，或者当 `exec` 目标为 `node` 时使用 `node`）。`/exec` 指令仅对已授权发送者生效，并按会话持久化；如果要彻底禁用 `exec`，请使用工具策略拒绝（参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查生效中的沙箱模式、工具策略和修复建议配置键。
- 关于“为什么这被阻止了？”的理解模型，请参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。

请保持严格锁定。

## 多智能体覆盖

每个智能体都可以覆盖沙箱和工具：`agents.list[].sandbox` 和 `agents.list[].tools`（以及用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。优先级请参见 [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools)。

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

- [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools) — 每个智能体的覆盖和优先级
- [OpenShell](/zh-CN/gateway/openshell) — 托管沙箱后端设置、工作区模式和配置参考
- [Sandbox configuration](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么这被阻止了？”
- [Security](/zh-CN/gateway/security)
