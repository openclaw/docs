---
read_when:
    - 你想使用容器化的 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 设置和新手引导
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:37:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker 是**可选的**。仅当你需要容器化 Gateway 网关，或需要验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离的、可丢弃的 Gateway 网关环境，或者想在没有本地安装的主机上运行 OpenClaw。
- **否**：你正在自己的机器上运行，并且只想要最快的开发循环。请改用普通安装流程。
- **沙箱注意事项**：启用沙箱隔离时，默认沙箱后端会使用 Docker，但沙箱隔离默认关闭，并且**不**要求完整 Gateway 网关在 Docker 中运行。SSH 和 OpenShell 沙箱后端也可用。请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 前置要求

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用于镜像构建（在 1 GB 主机上，`pnpm install` 可能因 OOM 被终止并以 137 退出）
- 足够的磁盘空间用于镜像和日志
- 如果在 VPS/公网主机上运行，请查看
  [网络暴露的安全加固](/zh-CN/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    从仓库根目录运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 Gateway 网关镜像。若要改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常见标签：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成新手引导">
    设置脚本会自动运行新手引导。它会：

    - 提示输入提供商 API key
    - 生成 Gateway 网关令牌并写入 `.env`
    - 通过 Docker Compose 启动 Gateway 网关

    设置期间，启动前的新手引导和配置写入会直接通过
    `openclaw-gateway` 运行。`openclaw-cli` 用于在
    Gateway 网关容器已存在之后运行的命令。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/`，并将已配置的
    共享密钥粘贴到 Settings 中。默认情况下，设置脚本会将令牌写入 `.env`；
    如果你将容器配置切换为密码认证，请改用该密码。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
    使用 CLI 容器添加消息渠道：

    ```bash
    # WhatsApp（二维码）
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)

  </Step>
</Steps>

### 手动流程

如果你希望自己运行每个步骤，而不是使用设置脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；
请使用 `-f docker-compose.yml -f docker-compose.extra.yml` 将其包含进来。
</Note>

<Note>
由于 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，它是一个
启动后工具。在 `docker compose up -d openclaw-gateway` 之前，请通过
带有 `--no-deps --entrypoint node` 的 `openclaw-gateway` 运行新手引导
和设置时配置写入。
</Note>

### 环境变量

设置脚本接受以下可选环境变量：

| 变量                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用远程镜像而不是本地构建                                      |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 构建期间安装额外 apt 软件包（以空格分隔）                       |
| `OPENCLAW_EXTENSIONS`                      | 构建时包含选定的内置插件辅助组件                                |
| `OPENCLAW_EXTRA_MOUNTS`                    | 额外主机绑定挂载（逗号分隔的 `source:target[:opts]`）           |
| `OPENCLAW_HOME_VOLUME`                     | 将 `/home/node` 持久化到命名 Docker 卷                          |
| `OPENCLAW_SANDBOX`                         | 选择启用沙箱引导（`1`、`true`、`yes`、`on`）                    |
| `OPENCLAW_SKIP_ONBOARDING`                 | 跳过交互式新手引导步骤（`1`、`true`、`yes`、`on`）              |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆盖 Docker socket 路径                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 禁用 Bonjour/mDNS 广播（Docker 默认值为 `1`）                   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 禁用内置插件源代码绑定挂载覆盖                                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | 用于 OpenTelemetry 导出的共享 OTLP/HTTP 收集器端点              |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 用于 trace、metric 或 log 的信号专用 OTLP 端点                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 协议覆盖。目前仅支持 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                        | 用于 OpenTelemetry 资源的服务名称                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 选择启用最新实验性 GenAI 语义属性                               |
| `OPENCLAW_OTEL_PRELOADED`                  | 已预加载一个 OpenTelemetry SDK 时，跳过启动第二个               |

维护者可以通过将一个插件源目录挂载到其打包源路径之上，针对打包镜像测试
内置插件源代码，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
该挂载的源目录会覆盖同一插件 id 对应的已编译
`/app/dist/extensions/synology-chat` 包。

### 可观测性

OpenTelemetry 导出是从 Gateway 网关容器到你的 OTLP 收集器的出站流量。
它不需要发布 Docker 端口。如果你在本地构建镜像，并希望镜像内可用
内置 OpenTelemetry exporter，请包含其运行时依赖：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在打包的 Docker 安装中，请先从 ClawHub 安装官方
`@openclaw/diagnostics-otel` 插件，然后再启用导出。自定义源码构建镜像仍可通过
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本地插件源代码。若要启用导出，
请在配置中允许并启用 `diagnostics-otel` 插件，然后设置
`diagnostics.otel.enabled=true`，或使用 [OpenTelemetry
导出](/zh-CN/gateway/opentelemetry)中的配置示例。收集器认证 header 通过
`diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量配置。

Prometheus 指标使用已发布的 Gateway 网关端口。安装
`clawhub:@openclaw/diagnostics-prometheus`，启用
`diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关认证保护。不要暴露单独的公共 `/metrics` 端口或
未经认证的反向代理路径。请参阅 [Prometheus 指标](/zh-CN/gateway/prometheus)。

### 健康检查

容器探测端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活性
curl -fsS http://127.0.0.1:18789/readyz     # 就绪性
```

Docker 镜像包含内置 `HEALTHCHECK`，会 ping `/healthz`。
如果检查持续失败，Docker 会将容器标记为 `unhealthy`，编排系统可以重启或替换它。

已认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，因此主机可通过
Docker 端口发布访问 `http://127.0.0.1:18789`。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问
  Gateway 网关。

<Note>
请使用 `gateway.bind` 中的绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用 `0.0.0.0` 或 `127.0.0.1` 这样的主机别名。
</Note>

### 主机本地提供商

当 OpenClaw 在 Docker 中运行时，容器内的 `127.0.0.1` 是容器
本身，而不是你的主机机器。对于在主机上运行的 AI 提供商，请使用
`host.docker.internal`：

| 提供商    | 主机默认 URL            | Docker 设置 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

内置 Docker 设置会将这些主机 URL 用作 LM Studio 和 Ollama 的
新手引导默认值，并且 `docker-compose.yml` 会将 `host.docker.internal` 映射到
Linux Docker Engine 的 Docker 主机网关。Docker Desktop 已经在 macOS 和 Windows 上
提供相同的主机名。

主机服务还必须监听 Docker 可访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 文件或 `docker run` 命令，请自行添加相同的主机
映射，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge 网络通常无法可靠转发 Bonjour/mDNS 多播
（`224.0.0.251:5353`）。因此，内置 Compose 设置默认使用
`OPENCLAW_DISABLE_BONJOUR=1`，这样当 bridge 丢弃多播流量时，Gateway 网关不会崩溃循环或反复
重启广播。

对于 Docker 主机，请使用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。
仅当使用 host networking、macvlan 或其他已知支持 mDNS 多播的网络时，才设置
`OPENCLAW_DISABLE_BONJOUR=0`。

有关注意事项和故障排除，请参阅 [Bonjour 设备发现](/zh-CN/gateway/bonjour)。

### 存储和持久化

Docker Compose 将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，
并将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，
因此这些路径会在容器替换后保留下来。当任一变量未设置时，内置
`docker-compose.yml` 会回退到 `${HOME}/.openclaw`（工作区挂载则使用
`${HOME}/.openclaw/workspace`），如果 `HOME` 本身也缺失，则回退到 `/tmp/.openclaw`。
这可避免 `docker compose up` 在裸环境中输出空 source 卷规范。

该挂载的配置目录是 OpenClaw 保存以下内容的位置：

- `openclaw.json`，用于行为配置
- `agents/<agentId>/agent/auth-profiles.json`，用于已存储的提供商 OAuth/API-key 凭证
- `.env`，用于基于环境变量的运行时密钥，例如 `OPENCLAW_GATEWAY_TOKEN`

已安装的可下载插件会将其软件包状态存储在挂载的 OpenClaw home 下，因此插件安装记录和软件包根目录会在容器
替换后保留下来。Gateway 网关启动不会生成内置插件依赖树。

有关 VM 部署的完整持久化详情，请参阅
[Docker VM Runtime - 哪些内容持久化在哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 留意 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl`、已安装插件包根目录，以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

为了更轻松地进行日常 Docker 管理，安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是从旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装 ClawDock 的，请重新运行上面的安装命令，让你的本地辅助文件跟踪新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。运行 `clawdock-help` 查看所有命令。
完整辅助工具指南见 [ClawDock](/zh-CN/install/clawdock)。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 网关启用 agent 沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义 socket 路径（例如 rootless Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    该脚本只会在沙箱先决条件通过后挂载 `docker.sock`。如果沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode` 重置为 `off`。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI 命令可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为共享信任边界。compose 配置会丢弃 `NET_RAW`/`NET_ADMIN`，并在 `openclaw-gateway` 和 `openclaw-cli` 上启用 `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 故障">
    某些 Docker Desktop 设置在丢弃 `NET_RAW` 后，会让共享网络 `openclaw-cli` sidecar 的 DNS 查询失败，在 `openclaw plugins install` 等由 npm 支持的命令中表现为 `EAI_AGAIN`。正常 Gateway 网关运行时，请保留默认的加固 compose 文件。下面的本地 override 会通过恢复 Docker 的默认 capabilities 来放宽 CLI 容器的安全姿态，因此只应将其用于需要访问包注册表的一次性 CLI 命令，不要作为你的默认 Compose 调用：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已经创建了长期运行的 `openclaw-cli` 容器，请使用同一个 override 重新创建它。`docker compose exec` 和 `docker exec` 无法更改已创建容器的 Linux capabilities。

  </Accordion>

  <Accordion title="权限和 EACCES">
    镜像以 `node`（uid 1000）身份运行。如果你在 `/home/node/.openclaw` 上看到权限错误，请确保你的宿主机 bind mount 归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同样的不匹配也可能显示为插件警告，例如 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`，随后出现 `plugin present but blocked`。这意味着进程 uid 和已挂载插件目录的所有者不一致。建议以默认 uid 1000 运行容器，并修复 bind mount 的所有权。只有在你有意长期以 root 身份运行 OpenClaw 时，才将 `/path/to/openclaw-config/npm` chown 为 `root:root`。

  </Accordion>

  <Accordion title="更快重建">
    调整 Dockerfile 顺序，让依赖层被缓存。这样除非 lockfile 变更，否则可以避免重新运行 `pnpm install`：

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="高级用户容器选项">
    默认镜像以安全优先，并以非 root 的 `node` 身份运行。如需功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **内置系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载内容**：使用 `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 会在 Linux 上自动检测 Docker 镜像中由 Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在 Docker 或无头设置中，复制你最终到达的完整重定向 URL，并将其粘贴回向导以完成身份验证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 运行时镜像使用 `node:24-bookworm-slim`，并包含 `tini` 作为入口点 init 进程（PID 1），以确保在长期运行的容器中正确回收僵尸进程并处理信号。它发布 OCI 基础镜像注解，包括 `org.opencontainers.image.base.name`、`org.opencontainers.image.source` 等。Node 基础摘要会通过 Dependabot Docker 基础镜像 PR 刷新；发布构建不会运行发行版升级层。见 [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

共享 VM 部署步骤见 [Hetzner（Docker VPS）](/zh-CN/install/hetzner) 和 [Docker VM Runtime](/zh-CN/install/docker-vm-runtime)，包括二进制内置、持久化和更新。

## Agent 沙箱

当使用 Docker 后端启用 `agents.defaults.sandbox` 时，Gateway 网关会在隔离的 Docker 容器内运行 agent 工具执行（shell、文件读写等），而 Gateway 网关本身仍留在宿主机上。这样无需将整个 Gateway 网关容器化，就能围绕不受信任或多租户 agent 会话建立硬隔离。

沙箱范围可以是每个 agent（默认）、每个会话或共享。每个范围都会获得自己的工作区，并挂载到 `/workspace`。你还可以配置允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

完整配置、镜像、安全说明和多 Agent profile 见：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/zh-CN/gateway/openshell) -- 对沙箱容器的交互式 shell 访问
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 每个 agent 的 override

### 快速启用

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

构建默认沙箱镜像（从源码 checkout）：

```bash
scripts/sandbox-setup.sh
```

对于没有源码 checkout 的 npm 安装，请参阅 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，其中包含内联 `docker build` 命令。

## 故障排除

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器未启动">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（源码 checkout）或 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup) 中的内联 `docker build` 命令（npm 安装）构建沙箱镜像，或者将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器会按会话在需要时自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载的工作区所有权匹配的 UID:GID，或 chown 工作区文件夹。
  </Accordion>

  <Accordion title="沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，它会 source `/etc/profile`，并且可能重置 PATH。设置 `docker.env.PATH` 来前置你的自定义工具路径，或在 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间因 OOM 被终止（exit 137）">
    VM 至少需要 2 GB RAM。使用更大的机器规格并重试。
  </Accordion>

  <Accordion title="Control UI 中未授权或需要配对">
    获取新的 dashboard 链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[Dashboard](/zh-CN/web/dashboard)、[Devices](/zh-CN/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 网关目标显示 ws://172.x.x.x 或 Docker CLI 出现配对错误">
    重置 Gateway 网关模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相关

- [安装概览](/zh-CN/install) — 所有安装方法
- [Podman](/zh-CN/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-CN/install/clawdock) — Docker Compose 社区设置
- [更新](/zh-CN/install/updating) — 让 OpenClaw 保持最新
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
