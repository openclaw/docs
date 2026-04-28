---
read_when:
    - 你想使用容器化的 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: 可选的基于 Docker 的 OpenClaw 设置和新手引导
title: Docker
x-i18n:
    generated_at: "2026-04-28T11:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2fe308bdcc243b59923d2b05ba543d63fa146747b9df9bdd59eef76bac187c8
    source_path: install/docker.md
    workflow: 16
---

Docker 是**可选**的。仅当你想要容器化 Gateway 网关，或想验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离、用完即丢的 Gateway 网关环境，或想在没有本地安装的主机上运行 OpenClaw。
- **否**：你正在自己的机器上运行，并且只想要最快的开发循环。请改用常规安装流程。
- **沙箱注意事项**：启用沙箱隔离时，默认沙箱后端使用 Docker，但沙箱隔离默认关闭，并且**不**要求完整 Gateway 网关在 Docker 中运行。SSH 和 OpenShell 沙箱后端也可用。参见[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 前提条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 镜像构建至少需要 2 GB RAM（在 1 GB 主机上，`pnpm install` 可能因 OOM 被终止并以退出码 137 退出）
- 有足够磁盘空间存放镜像和日志
- 如果在 VPS/公网主机上运行，请查看
  [网络暴露的安全加固](/zh-CN/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="Build the image">
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

  <Step title="Complete onboarding">
    设置脚本会自动运行新手引导。它会：

    - 提示输入提供商 API 密钥
    - 生成 Gateway 网关令牌并写入 `.env`
    - 通过 Docker Compose 启动 Gateway 网关

    在设置过程中，启动前的新手引导和配置写入会直接通过
    `openclaw-gateway` 运行。`openclaw-cli` 用于在
    Gateway 网关容器已经存在之后运行的命令。

  </Step>

  <Step title="Open the Control UI">
    在浏览器中打开 `http://127.0.0.1:18789/`，并将已配置的
    共享密钥粘贴到设置中。设置脚本默认会将令牌写入 `.env`；
    如果你把容器配置切换为密码认证，请改用该密码。

    还需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    使用 CLI 容器添加消息渠道：

    ```bash
    # WhatsApp (QR)
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

如果你更想自己运行每个步骤，而不是使用设置脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
请从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；
请用 `-f docker-compose.yml -f docker-compose.extra.yml` 将其包含进来。
</Note>

<Note>
因为 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，所以它是一个
启动后工具。在运行 `docker compose up -d openclaw-gateway` 之前，请通过
`openclaw-gateway` 并带上 `--no-deps --entrypoint node` 来运行新手引导
和设置时的配置写入。
</Note>

### 环境变量

设置脚本接受这些可选环境变量：

| 变量                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用远程镜像，而不是在本地构建                                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 在构建期间安装额外 apt 包（以空格分隔）                         |
| `OPENCLAW_EXTENSIONS`                      | 在构建时预安装插件依赖（以空格分隔的名称）                      |
| `OPENCLAW_EXTRA_MOUNTS`                    | 额外主机绑定挂载（以逗号分隔的 `source:target[:opts]`）         |
| `OPENCLAW_HOME_VOLUME`                     | 将 `/home/node` 持久化到一个命名 Docker 卷                      |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | 生成的内置插件依赖和镜像的容器路径                              |
| `OPENCLAW_SANDBOX`                         | 选择启用沙箱启动流程（`1`、`true`、`yes`、`on`）                |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆盖 Docker socket 路径                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 禁用 Bonjour/mDNS 广播（Docker 默认值为 `1`）                   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 禁用内置插件源码绑定挂载覆盖层                                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | 用于 OpenTelemetry 导出的共享 OTLP/HTTP 收集器端点              |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 用于 traces、metrics 或 logs 的信号专用 OTLP 端点               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 协议覆盖。当前仅支持 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                        | 用于 OpenTelemetry 资源的服务名称                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 选择启用最新的实验性 GenAI 语义属性                             |
| `OPENCLAW_OTEL_PRELOADED`                  | 当已有一个 OpenTelemetry SDK 预加载时，跳过启动第二个 SDK       |

维护者可以通过将某个插件源码目录挂载到其打包源码路径上，针对打包镜像测试
内置插件源码，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
该挂载的源码目录会针对相同插件 id 覆盖匹配的已编译
`/app/dist/extensions/synology-chat` 包。

### 可观测性

OpenTelemetry 导出是从 Gateway 网关容器向你的 OTLP 收集器发出的出站流量。
它不需要发布 Docker 端口。如果你在本地构建镜像，并且希望镜像内可使用
内置 OpenTelemetry exporter，请包含它的运行时依赖：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方 OpenClaw Docker 发布镜像包含内置
`diagnostics-otel` 插件源码。根据镜像和缓存状态，Gateway 网关在首次启用
该插件时仍可能会暂存插件本地的 OpenTelemetry 运行时依赖，因此请允许首次启动
访问包 registry，或在你的发布通道中预热镜像。若要启用导出，请在配置中允许并启用
`diagnostics-otel` 插件，然后设置 `diagnostics.otel.enabled=true`，或使用
[OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)中的配置示例。收集器认证头通过
`diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量配置。

Prometheus 指标使用已经发布的 Gateway 网关端口。启用
`diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关认证保护。不要暴露单独的公开 `/metrics` 端口或未认证的反向代理路径。参见
[Prometheus 指标](/zh-CN/gateway/prometheus)。

### 健康检查

容器探针端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 镜像包含一个内置 `HEALTHCHECK`，用于 ping `/healthz`。
如果检查持续失败，Docker 会将容器标记为 `unhealthy`，编排系统可以重启或替换它。

已认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，因此主机可通过
`http://127.0.0.1:18789` 使用 Docker 端口发布来访问。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问 Gateway 网关。

<Note>
请使用 `gateway.bind` 中的绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用 `0.0.0.0` 或 `127.0.0.1` 这类主机别名。
</Note>

### 主机本地提供商

当 OpenClaw 在 Docker 中运行时，容器内的 `127.0.0.1` 指的是容器本身，
而不是你的主机机器。对于在主机上运行的 AI 提供商，请使用 `host.docker.internal`：

| 提供商    | 主机默认 URL              | Docker 设置 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

内置 Docker 设置会将这些主机 URL 用作 LM Studio 和 Ollama 的新手引导默认值，
并且 `docker-compose.yml` 会将 `host.docker.internal` 映射到 Linux Docker Engine
的 Docker 主机网关。Docker Desktop 已经在 macOS 和 Windows 上提供相同主机名。

主机服务也必须监听 Docker 可访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 文件或 `docker run` 命令，请自行添加相同的主机映射，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge 网络通常无法可靠转发 Bonjour/mDNS 组播
（`224.0.0.251:5353`）。因此，内置 Compose 设置默认使用
`OPENCLAW_DISABLE_BONJOUR=1`，使 Gateway 网关在 bridge 丢弃组播流量时不会崩溃循环或反复重启广播。

对于 Docker 主机，请使用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS 组播可以工作的网络时，
才设置 `OPENCLAW_DISABLE_BONJOUR=0`。

有关注意事项和故障排除，请参见 [Bonjour 发现](/zh-CN/gateway/bonjour)。

### 存储和持久化

Docker Compose 会将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，
并将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，
因此这些路径会在容器替换后保留下来。

该挂载的配置目录是 OpenClaw 存放以下内容的位置：

- 用于行为配置的 `openclaw.json`
- 用于已存储提供商 OAuth/API-key 认证的 `agents/<agentId>/agent/auth-profiles.json`
- 用于环境变量支持的运行时密钥的 `.env`，例如 `OPENCLAW_GATEWAY_TOKEN`

内置插件运行时依赖和镜像的运行时文件属于生成状态，不是用户配置。Compose 会将它们存储在名为
`openclaw-plugin-runtime-deps` 的 Docker 命名卷中，并挂载到
`/var/lib/openclaw/plugin-runtime-deps`。将这个高频变更的目录树排除在主机配置绑定挂载之外，
可以避免缓慢的 Docker Desktop/WSL 文件操作，以及冷启动 Gateway 网关时陈旧的 Windows 句柄问题。

默认 Compose 文件会为 `openclaw-gateway` 和 `openclaw-cli` 都将
`OPENCLAW_PLUGIN_STAGE_DIR` 设置为该路径，因此 `openclaw doctor --fix`、渠道
登录/设置命令以及 Gateway 网关启动都会使用同一个生成运行时卷。

有关 VM 部署上的完整持久化详情，请参阅
[Docker VM 运行时 - 哪些内容持久化在哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：**关注 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl`、
`openclaw-plugin-runtime-deps` Docker 卷，以及
`/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

为了让日常 Docker 管理更方便，请安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你此前从较旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装了 ClawDock，请重新运行上面的安装命令，让你的本地辅助工具文件跟踪新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。运行
`clawdock-help` 查看全部命令。
完整辅助工具指南请参阅 [ClawDock](/zh-CN/install/clawdock)。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 网关启用智能体沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义套接字路径（例如无 root Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    该脚本只会在沙箱前置条件通过后挂载 `docker.sock`。如果
    沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode`
    重置为 `off`。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，这样 CLI
    命令可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为共享的
    信任边界。compose 配置会移除 `NET_RAW`/`NET_ADMIN`，并在
    `openclaw-cli` 上启用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="权限和 EACCES">
    该镜像以 `node`（uid 1000）身份运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，请确保你的主机绑定挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快重建">
    调整你的 Dockerfile 顺序，让依赖层可以被缓存。这样除非锁文件发生变化，
    否则可以避免重新运行
    `pnpm install`：

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
    默认镜像以安全优先，并以非 root 的 `node` 身份运行。对于功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **烘焙系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载内容**：设置
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，并使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在
    Docker 或无头设置中，请复制你最终到达的完整重定向 URL，并将其粘贴回
    向导以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 运行时镜像使用 `node:24-bookworm-slim`，并发布 OCI
    基础镜像注解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 和其他注解。Node 基础摘要会
    通过 Dependabot Docker 基础镜像 PR 刷新；发布构建不会运行
    发行版升级层。请参阅
    [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

有关共享 VM 部署步骤，包括二进制烘焙、持久化和更新，请参阅 [Hetzner（Docker VPS）](/zh-CN/install/hetzner) 和
[Docker VM 运行时](/zh-CN/install/docker-vm-runtime)。

## 智能体沙箱

当 `agents.defaults.sandbox` 通过 Docker 后端启用时，Gateway 网关会在隔离的 Docker
容器中运行智能体工具执行（shell、文件读写等），而 Gateway 网关本身仍留在主机上。这为不受信任或多租户的智能体会话提供了一道硬边界，而不需要将整个
Gateway 网关容器化。

沙箱作用域可以是按智能体（默认）、按会话或共享。每个作用域都有自己的工作区，挂载在 `/workspace`。你还可以配置
允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全说明和多智能体配置文件，请参阅：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/zh-CN/gateway/openshell) -- 对沙箱容器的交互式 shell 访问
- [多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖

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

构建默认沙箱镜像：

```bash
scripts/sandbox-setup.sh
```

## 故障排除

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器未启动">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    构建沙箱镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器会按会话在需要时自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载工作区所有权匹配的 UID:GID，
    或对工作区文件夹运行 chown。
  </Accordion>

  <Accordion title="沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，它会加载
    `/etc/profile`，并且可能重置 PATH。设置 `docker.env.PATH` 来前置你的
    自定义工具路径，或在你的 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间被 OOM 终止（退出 137）">
    VM 至少需要 2 GB RAM。请使用更大的机器规格后重试。
  </Accordion>

  <Accordion title="Control UI 中未授权或需要配对">
    获取新的仪表盘链接，并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[仪表盘](/zh-CN/web/dashboard)、[设备](/zh-CN/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 网关目标显示 ws://172.x.x.x 或 Docker CLI 出现配对错误">
    重置 Gateway 网关模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相关内容

- [安装概览](/zh-CN/install) — 所有安装方法
- [Podman](/zh-CN/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-CN/install/clawdock) — Docker Compose 社区设置
- [更新](/zh-CN/install/updating) — 让 OpenClaw 保持最新
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
