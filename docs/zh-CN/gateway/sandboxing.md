---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱隔离的工作方式：模式、作用域、工作区访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-05-01T11:40:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在**沙箱后端中运行工具**，以缩小影响范围。这是**可选的**，并由配置控制（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）。如果关闭沙箱隔离，工具会在主机上运行。Gateway 网关 保留在主机上；启用后，工具执行会在隔离的沙箱中运行。

<Note>
这不是完美的安全边界，但当模型做出愚蠢操作时，它能实质性限制文件系统和进程访问。
</Note>

## 哪些内容会被沙箱隔离

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱隔离浏览器（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="沙箱隔离浏览器详情">
    - 默认情况下，当浏览器工具需要时，沙箱浏览器会自动启动（确保 CDP 可访问）。通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
    - 默认情况下，沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。使用 `agents.defaults.sandbox.browser.network` 配置。
    - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允许列表限制容器边缘的 CDP 入站访问（例如 `172.21.0.1/32`）。
    - noVNC 观察者访问默认受密码保护；OpenClaw 会发出一个短期有效的令牌 URL，用于提供本地引导页面，并在 URL 片段（不是查询参数或标头日志）中携带密码打开 noVNC。
    - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱隔离会话显式指向主机浏览器。
    - 可选允许列表会限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

不会被沙箱隔离：

- Gateway 网关进程本身。
- 任何显式允许在沙箱外运行的工具（例如 `tools.elevated`）。
  - **提权 exec 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`，或当 exec 目标是 `node` 时使用 `node`）。**
  - 如果沙箱隔离关闭，`tools.elevated` 不会改变执行方式（已经在主机上）。参见 [提权模式](/zh-CN/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱隔离：

<Tabs>
  <Tab title="off">
    不使用沙箱隔离。
  </Tab>
  <Tab title="non-main">
    仅对**非 main** 会话使用沙箱隔离（如果你希望普通聊天在主机上运行，这是默认选择）。

    `"non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是 agent id。群组/渠道会话使用自己的键，因此会被视为非 main，并将被沙箱隔离。

  </Tab>
  <Tab title="all">
    每个会话都在沙箱中运行。
  </Tab>
</Tabs>

## 范围

`agents.defaults.sandbox.scope` 控制**创建多少个容器**：

- `"agent"`（默认）：每个智能体一个容器。
- `"session"`：每个会话一个容器。
- `"shared"`：所有沙箱隔离会话共享一个容器。

## 后端

`agents.defaults.sandbox.backend` 控制**由哪个运行时**提供沙箱：

- `"docker"`（启用沙箱隔离时的默认值）：本地 Docker 支持的沙箱运行时。
- `"ssh"`：通用 SSH 支持的远程沙箱运行时。
- `"openshell"`：OpenShell 支持的沙箱运行时。

SSH 专用配置位于 `agents.defaults.sandbox.ssh` 下。OpenShell 专用配置位于 `plugins.entries.openshell.config` 下。

### 选择后端

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **运行位置**   | 本地容器                  | 任何可通过 SSH 访问的主机        | OpenShell 托管沙箱                           |
| **设置**           | `scripts/sandbox-setup.sh`       | SSH 密钥 + 目标主机          | 已启用 OpenShell 插件                            |
| **工作区模型** | 绑定挂载或复制               | 远程规范源（初始化一次）   | `mirror` 或 `remote`                                |
| **网络控制** | `docker.network`（默认：无） | 取决于远程主机         | 取决于 OpenShell                                |
| **浏览器沙箱** | 支持                        | 不支持                  | 尚不支持                                   |
| **绑定挂载**     | `docker.binds`                   | 不适用                            | 不适用                                                 |
| **最适合**        | 本地开发、完全隔离        | 卸载到远程机器 | 使用可选双向同步的托管远程沙箱 |

### Docker 后端

沙箱隔离默认关闭。如果你启用沙箱隔离但未选择后端，OpenClaw 会使用 Docker 后端。它通过 Docker daemon socket（`/var/run/docker.sock`）在本地执行工具和沙箱浏览器。沙箱容器隔离由 Docker 命名空间决定。

要将主机 GPU 暴露给 Docker 沙箱，请设置 `agents.defaults.sandbox.docker.gpus` 或按智能体覆盖的 `agents.list[].sandbox.docker.gpus`。该值会作为单独参数传递给 Docker 的 `--gpus` 标志，例如 `"all"` 或 `"device=GPU-uuid"`，并且需要兼容的主机运行时，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker (DooD) 约束**

如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会使用主机的 Docker socket（DooD）编排同级沙箱容器。这会引入一个特定的路径映射约束：

- **配置需要主机路径**：`openclaw.json` 的 `workspace` 配置必须包含**主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是内部 Gateway 网关容器路径。当 OpenClaw 要求 Docker daemon 生成沙箱时，daemon 会相对于主机 OS 命名空间评估路径，而不是 Gateway 网关命名空间。
- **FS 桥接一致性（相同的卷映射）**：OpenClaw Gateway 网关原生进程也会将 heartbeat 和桥接文件写入 `workspace` 目录。因为 Gateway 网关会在其自身容器化环境中评估完全相同的字符串（主机路径），所以 Gateway 网关部署必须包含相同的卷映射，以原生方式链接主机命名空间（`-v /home/user/.openclaw:/home/user/.openclaw`）。

如果你在内部映射路径而没有绝对主机一致性，OpenClaw 会在尝试于容器环境内写入 heartbeat 时原生抛出 `EACCES` 权限错误，因为完全限定的路径字符串并不存在于原生环境中。
</Warning>

### SSH 后端

当你希望 OpenClaw 在任意可通过 SSH 访问的机器上对 `exec`、文件工具和媒体读取进行沙箱隔离时，使用 `backend: "ssh"`。

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

<AccordionGroup>
  <Accordion title="工作原理">
    - OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下创建按范围划分的远程根目录。
    - 创建或重新创建后的首次使用时，OpenClaw 会将本地工作区一次性初始化到该远程工作区。
    - 之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取和入站媒体暂存都会通过 SSH 直接针对远程工作区运行。
    - OpenClaw 不会自动将远程更改同步回本地工作区。

  </Accordion>
  <Accordion title="身份验证材料">
    - `identityFile`、`certificateFile`、`knownHostsFile`：使用现有本地文件，并通过 OpenSSH 配置传递它们。
    - `identityData`、`certificateData`、`knownHostsData`：使用内联字符串或 SecretRefs。OpenClaw 会通过正常的 secrets 运行时快照解析它们，将它们写入权限为 `0600` 的临时文件，并在 SSH 会话结束时删除它们。
    - 如果同一项同时设置了 `*File` 和 `*Data`，则该 SSH 会话会优先使用 `*Data`。

  </Accordion>
  <Accordion title="远程规范源的影响">
    这是一个**远程规范源**模型。初始初始化后，远程 SSH 工作区会成为真实的沙箱状态。

    - 初始化步骤之后，在 OpenClaw 外部进行的主机本地编辑在远程不可见，直到你重新创建沙箱。
    - `openclaw sandbox recreate` 会删除按范围划分的远程根目录，并在下次使用时再次从本地初始化。
    - SSH 后端不支持浏览器沙箱隔离。
    - `sandbox.docker.*` 设置不适用于 SSH 后端。

  </Accordion>
</AccordionGroup>

### OpenShell 后端

当你希望 OpenClaw 在 OpenShell 托管的远程环境中对工具进行沙箱隔离时，使用 `backend: "openshell"`。完整设置指南、配置参考和工作区模式对比，请参见专用的 [OpenShell 页面](/zh-CN/gateway/openshell)。

OpenShell 复用与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥接，并添加 OpenShell 专用生命周期（`sandbox create/get/delete`、`sandbox ssh-config`）以及可选的 `mirror` 工作区模式。

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

- `mirror`（默认）：本地工作区保持规范源。OpenClaw 会在 exec 前将本地文件同步到 OpenShell，并在 exec 后将远程工作区同步回来。
- `remote`：创建沙箱后，OpenShell 工作区是规范源。OpenClaw 会从本地工作区一次性初始化远程工作区，然后文件工具和 exec 会直接针对远程沙箱运行，不会同步更改回来。

<AccordionGroup>
  <Accordion title="远程传输详情">
    - OpenClaw 会通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求沙箱专用 SSH 配置。
    - 核心会将该 SSH 配置写入临时文件，打开 SSH 会话，并复用 `backend: "ssh"` 使用的同一远程文件系统桥接。
    - 仅在 `mirror` 模式下生命周期不同：exec 前从本地同步到远程，然后在 exec 后同步回来。

  </Accordion>
  <Accordion title="当前 OpenShell 限制">
    - 尚不支持沙箱浏览器
    - OpenShell 后端不支持 `sandbox.docker.binds`
    - `sandbox.docker.*` 下的 Docker 专用运行时旋钮仍仅适用于 Docker 后端

  </Accordion>
</AccordionGroup>

#### 工作区模式

OpenShell 有两种工作区模型。这是在实践中最重要的部分。

<Tabs>
  <Tab title="mirror（本地规范源）">
    当你希望**本地工作区保持规范源**时，使用 `plugins.entries.openshell.config.mode: "mirror"`。

    行为：

    - 在 `exec` 前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱。
    - 在 `exec` 后，OpenClaw 会将远程工作区同步回本地工作区。
    - 文件工具仍通过沙箱桥接运行，但本地工作区在各轮之间仍是真实来源。

    适用场景：

    - 你在 OpenClaw 外部本地编辑文件，并希望这些更改自动出现在沙箱中
    - 你希望 OpenShell 沙箱的行为尽可能接近 Docker 后端
    - 你希望主机工作区在每次 exec 回合后反映沙箱写入

    权衡：exec 前后会产生额外同步成本。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    当你希望 **OpenShell 工作区成为规范来源**时，使用 `plugins.entries.openshell.config.mode: "remote"`。

    行为：

    - 首次创建沙箱时，OpenClaw 会从本地工作区向远程工作区初始化一次。
    - 此后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 会直接针对远程 OpenShell 工作区操作。
    - OpenClaw 不会在 exec 后将远程更改同步回本地工作区。
    - 提示时的媒体读取仍然可用，因为文件和媒体工具会通过沙箱桥接读取，而不是假设存在本地主机路径。
    - 传输方式是通过 SSH 进入 `openshell sandbox ssh-config` 返回的 OpenShell 沙箱。

    重要影响：

    - 如果你在初始化步骤之后，在 OpenClaw 外部的主机上编辑文件，远程沙箱**不会**自动看到这些更改。
    - 如果重新创建沙箱，远程工作区会再次从本地工作区初始化。
    - 使用 `scope: "agent"` 或 `scope: "shared"` 时，该远程工作区会在相同作用域下共享。

    适用场景：

    - 沙箱应主要位于远程 OpenShell 侧
    - 你想降低每回合的同步开销
    - 你不希望主机本地编辑静默覆盖远程沙箱状态

  </Tab>
</Tabs>

如果你把沙箱视为临时执行环境，请选择 `mirror`。如果你把沙箱视为真实工作区，请选择 `remote`。

#### OpenShell 生命周期

OpenShell 沙箱仍通过正常的沙箱生命周期管理：

- `openclaw sandbox list` 会显示 OpenShell 运行时以及 Docker 运行时
- `openclaw sandbox recreate` 会删除当前运行时，并让 OpenClaw 在下次使用时重新创建它
- 清理逻辑也会识别后端

对于 `remote` 模式，重新创建尤其重要：

- 重新创建会删除该作用域的规范远程工作区
- 下次使用会从本地工作区初始化一个新的远程工作区

对于 `mirror` 模式，重新创建主要会重置远程执行环境，因为本地工作区无论如何仍是规范来源。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱可以看到什么**：

<Tabs>
  <Tab title="none (default)">
    工具会看到 `~/.openclaw/sandboxes` 下的沙箱工作区。
  </Tab>
  <Tab title="ro">
    以只读方式将 agent 工作区挂载到 `/agent`（禁用 `write`/`edit`/`apply_patch`）。
  </Tab>
  <Tab title="rw">
    以读写方式将 agent 工作区挂载到 `/workspace`。
  </Tab>
</Tabs>

使用 OpenShell 后端时：

- `mirror` 模式仍使用本地工作区作为 exec 回合之间的规范来源
- `remote` 模式在初始初始化后使用远程 OpenShell 工作区作为规范来源
- `workspaceAccess: "ro"` 和 `"none"` 仍会以相同方式限制写入行为

入站媒体会复制到活动沙箱工作区（`media/inbound/*`）。

<Note>
**Skills 注意事项：**`read` 工具以沙箱根目录为基准。使用 `workspaceAccess: "none"` 时，OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`），以便读取。使用 `"rw"` 时，可从 `/workspace/skills` 读取工作区 Skills。
</Note>

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 会将额外的主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局和单 agent 绑定会被**合并**（而不是替换）。在 `scope: "shared"` 下，单 agent 绑定会被忽略。

`agents.defaults.sandbox.browser.binds` 只会将额外的主机目录挂载到**沙箱浏览器**容器中。

- 设置时（包括 `[]`），它会替换浏览器容器的 `agents.defaults.sandbox.docker.binds`。
- 省略时，浏览器容器会回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

示例（只读源目录 + 一个额外数据目录）：

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

- 绑定会绕过沙箱文件系统：它们会以你设置的模式（`:ro` 或 `:rw`）暴露主机路径。
- OpenClaw 会阻止危险的绑定源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`，以及会暴露它们的父挂载）。
- OpenClaw 还会阻止常见的主目录凭据根目录，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- 绑定校验不只是字符串匹配。OpenClaw 会规范化源路径，然后通过最深的现有祖先再次解析它，再重新检查被阻止路径和允许根目录。
- 这意味着即使最终叶子节点尚不存在，符号链接父级逃逸也会默认失败。示例：如果 `run-link` 指向那里，`/workspace/run-link/new-file` 仍会解析为 `/var/run/...`。
- 允许的源根目录也会以相同方式规范化，因此，如果某个路径只是在符号链接解析前看起来位于允许列表内，仍会以 `outside allowed roots` 被拒绝。
- 敏感挂载（密钥、SSH 密钥、服务凭据）除非绝对必要，否则应使用 `:ro`。
- 如果你只需要对工作区的读取访问，请与 `workspaceAccess: "ro"` 结合使用；绑定模式保持独立。
- 请参阅 [沙箱与工具策略与提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解绑定如何与工具策略和提权 exec 交互。

</Warning>

## 镜像和设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

<Note>
**源代码检出与 npm 安装**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 辅助脚本仅在从[源代码检出](https://github.com/openclaw/openclaw)运行时可用。它们不包含在 npm 包中。

如果你通过 `npm install -g openclaw` 安装了 OpenClaw，请改用下面显示的内联 `docker build` 命令。
</Note>

<Steps>
  <Step title="Build the default image">
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

    默认镜像**不**包含 Node。如果某个 Skill 需要 Node（或其他运行时），请烘焙自定义镜像，或通过 `sandbox.docker.setupCommand` 安装（需要网络出站 + 可写根目录 + root 用户）。

    当缺少 `openclaw-sandbox:bookworm-slim` 时，OpenClaw 不会静默替换为普通的 `debian:bookworm-slim`。以默认镜像为目标的沙箱运行会快速失败，并显示构建说明，直到你构建它，因为内置镜像携带用于沙箱写入/编辑辅助工具的 `python3`。

  </Step>
  <Step title="Optional: build the common image">
    如需包含常用工具（例如 `curl`、`jq`、`nodejs`、`python3`、`git`）且功能更完整的沙箱镜像：

    从源代码检出：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    从 npm 安装时，先构建默认镜像（见上文），然后使用仓库中的 [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) 在其上构建 common 镜像。

    然后将 `agents.defaults.sandbox.docker.image` 设置为 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    从源代码检出：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    从 npm 安装时，使用仓库中的 [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) 构建。

  </Step>
</Steps>

默认情况下，Docker 沙箱容器在**无网络**状态下运行。可使用 `agents.defaults.sandbox.docker.network` 覆盖。

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    内置沙箱浏览器镜像还会为容器化工作负载应用保守的 Chromium 启动默认值。当前容器默认值包括：

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
    - 三个图形加固标志（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）是可选的，在容器缺少 GPU 支持时很有用。如果你的工作负载需要 WebGL 或其他 3D/浏览器功能，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - 默认启用 `--disable-extensions`，对于依赖扩展的流程，可使用 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 禁用。
    - `--renderer-process-limit=2` 由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 会保留 Chromium 的默认值。

    如果你需要不同的运行时配置，请使用自定义浏览器镜像并提供你自己的入口点。对于本地（非容器）Chromium 配置，请使用 `browser.extraArgs` 追加额外启动标志。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` 被阻止。
    - 默认阻止 `network: "container:<id>"`（存在命名空间加入绕过风险）。
    - 破窗覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安装和容器化 Gateway 网关位于这里：[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导沙箱配置。设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以启用该路径。你可以使用 `OPENCLAW_DOCKER_SOCKET` 覆盖套接字位置。完整设置和环境变量参考：[Docker](/zh-CN/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**运行一次**（不是每次运行都运行）。它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 单 agent：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - 默认 `docker.network` 是 `"none"`（无出站），因此包安装会失败。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且仅限破窗使用。
    - `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false` 或烘焙自定义镜像。
    - 安装包时，`user` 必须是 root（省略 `user` 或设置 `user: "0:0"`）。
    - 沙箱 exec **不会**继承主机 `process.env`。请为 Skill API key 使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）。

  </Accordion>
</AccordionGroup>

## 工具策略和逃生通道

工具允许/拒绝策略仍会先于沙箱规则生效。如果某个工具被全局或按智能体拒绝，沙箱隔离不会将其恢复。

`tools.elevated` 是一个显式逃生通道，会在沙箱之外运行 `exec`（默认在 `gateway` 中，或者当 exec 目标是 `node` 时在 `node` 中）。`/exec` 指令只适用于已授权的发送者，并按会话持续生效；若要硬性禁用 `exec`，请使用工具策略拒绝（参见[沙箱与工具策略与 Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查实际沙箱模式、工具策略和修复配置键。
- 参见[沙箱与工具策略与 Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)，了解“为什么这被阻止？”的思维模型。

保持严格锁定。

## 多智能体覆盖

每个智能体都可以覆盖沙箱 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（以及用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。参见[多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools)了解优先级。

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

- [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools) — 按智能体覆盖和优先级
- [OpenShell](/zh-CN/gateway/openshell) — 托管沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/zh-CN/gateway/config-agents#agentsdefaultssandbox)
- [沙箱与工具策略与 Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试“为什么这被阻止？”
- [安全](/zh-CN/gateway/security)
