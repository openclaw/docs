---
read_when:
    - 你想使用容器化的 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 安装与新手引导
title: Docker
x-i18n:
    generated_at: "2026-04-27T07:11:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56766c90b2751d186b0e9a7b55241fb45f05a37c2e8d7c0d0155b41eefc2177a
    source_path: install/docker.md
    workflow: 15
---

Docker **是可选的**。仅当你想使用容器化的 Gateway 网关，或验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离的、可随时丢弃的 Gateway 网关环境，或者想在没有本地安装的主机上运行 OpenClaw。
- **否**：你是在自己的机器上运行，只想获得最快的开发循环。请改用常规安装流程。
- **沙箱注意事项**：启用沙箱隔离时，默认的沙箱后端会使用 Docker，但沙箱隔离默认是关闭的，并且**不**要求整个 Gateway 网关都运行在 Docker 中。也可以使用 SSH 和 OpenShell 沙箱后端。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

## 前置条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB 内存用于构建镜像（在 1 GB 主机上，`pnpm install` 可能因 OOM 被杀死并以 137 退出）
- 足够的磁盘空间用于镜像和日志
- 如果在 VPS/公网主机上运行，请查看
  [网络暴露的安全加固](/zh-CN/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    在仓库根目录运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 Gateway 网关镜像。若要改用预构建镜像，请使用：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常见标签：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成新手引导">
    设置脚本会自动运行新手引导。它将会：

    - 提示你输入提供商 API 密钥
    - 生成一个 Gateway 网关令牌并写入 `.env`
    - 通过 Docker Compose 启动 Gateway 网关

    在设置过程中，启动前的新手引导和配置写入会直接通过
    `openclaw-gateway` 完成。`openclaw-cli` 用于在
    Gateway 网关容器已经存在之后再运行的命令。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/`，然后将已配置的共享密钥粘贴到设置中。设置脚本默认会将令牌写入 `.env`；如果你把容器配置切换为密码认证，请改用该密码。

    需要再次获取 URL 吗？

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

    文档： [WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)

  </Step>
</Steps>

### 手动流程

如果你更喜欢自己逐步执行每一步，而不是使用设置脚本：

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
请通过 `-f docker-compose.yml -f docker-compose.extra.yml` 一并包含它。
</Note>

<Note>
由于 `openclaw-cli` 与 `openclaw-gateway` 共享网络命名空间，它是一个启动后的工具。在 `docker compose up -d openclaw-gateway` 之前，请通过带有
`--no-deps --entrypoint node` 的 `openclaw-gateway` 运行新手引导和设置期间的配置写入。
</Note>

### 环境变量

设置脚本支持以下可选环境变量：

| Variable | Purpose |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用远程镜像而不是在本地构建 |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 在构建期间安装额外的 apt 软件包（以空格分隔） |
| `OPENCLAW_EXTENSIONS`                      | 在构建时预安装插件依赖（以空格分隔名称） |
| `OPENCLAW_EXTRA_MOUNTS`                    | 额外的主机绑定挂载（以逗号分隔的 `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME`                     | 在具名 Docker 卷中持久化 `/home/node` |
| `OPENCLAW_SANDBOX`                         | 选择启用沙箱引导（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆盖 Docker socket 路径 |
| `OPENCLAW_DISABLE_BONJOUR`                 | 禁用 Bonjour/mDNS 广播（Docker 默认值为 `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 禁用内置插件源码绑定挂载覆盖 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | 用于 OpenTelemetry 导出的共享 OTLP/HTTP 收集器端点 |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 用于 traces、metrics 或 logs 的各信号专用 OTLP 端点 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 协议覆盖。当前仅支持 `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | 用于 OpenTelemetry 资源的服务名称 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 选择启用最新的实验性 GenAI 语义属性 |
| `OPENCLAW_OTEL_PRELOADED`                  | 当已预加载一个 OpenTelemetry SDK 时，跳过启动第二个 |

维护者可以通过把某个插件源码目录挂载到其打包后的源码路径之上，来针对打包镜像测试内置插件源码，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
该已挂载的源码目录会覆盖相同插件 id 对应的已编译
`/app/dist/extensions/synology-chat` 包。

### 可观测性

OpenTelemetry 导出是从 Gateway 网关容器向你的 OTLP
collector 发起的出站连接。它不需要发布 Docker 端口。如果你在本地构建镜像，并希望镜像中包含可用的内置 OpenTelemetry exporter，请加入其运行时依赖：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方 OpenClaw Docker 发布镜像包含内置的
`diagnostics-otel` 插件源码。根据镜像和缓存状态，Gateway 网关在首次启用该插件时，可能仍需暂存插件本地的 OpenTelemetry 运行时依赖，因此请确保首次启动时可以访问软件包注册表，或在你的发布流程中预热镜像。要启用导出，请在配置中允许并启用 `diagnostics-otel` 插件，然后设置
`diagnostics.otel.enabled=true`，或使用
[OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) 中的配置示例。collector 认证头通过
`diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量配置。

Prometheus 指标使用已经发布的 Gateway 网关端口。启用
`diagnostics-prometheus` 插件后，抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关认证保护。不要暴露单独的公共 `/metrics` 端口，也不要暴露未认证的反向代理路径。参见
[Prometheus 指标](/zh-CN/gateway/prometheus)。

### 健康检查

容器探针端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活检查
curl -fsS http://127.0.0.1:18789/readyz     # 就绪检查
```

Docker 镜像内置了一个 `HEALTHCHECK`，会探测 `/healthz`。
如果检查持续失败，Docker 会将容器标记为 `unhealthy`，
编排系统即可重启或替换它。

需要认证的深度健康状态快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，因此通过 Docker 端口发布时，主机可以访问
`http://127.0.0.1:18789`。

- `lan`（默认）：主机浏览器和主机 CLI 都可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问
  Gateway 网关。

<Note>
请在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用主机别名，例如 `0.0.0.0` 或 `127.0.0.1`。
</Note>

### Bonjour / mDNS

Docker bridge 网络通常无法可靠地转发 Bonjour/mDNS 多播
（`224.0.0.251:5353`）。因此，内置的 Compose 设置默认使用
`OPENCLAW_DISABLE_BONJOUR=1`，以避免 Gateway 网关因桥接网络丢弃多播流量而崩溃循环或反复重启广播。

对于 Docker 主机，请使用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。仅当你运行在 host networking、macvlan 或其他已知支持 mDNS 多播的网络中时，才将 `OPENCLAW_DISABLE_BONJOUR=0`。

有关注意事项和故障排除，请参见 [Bonjour 设备发现](/zh-CN/gateway/bonjour)。

### 存储与持久化

Docker Compose 会将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，并将
`OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，因此这些路径在容器被替换后仍会保留。

这个已挂载的配置目录是 OpenClaw 存储以下内容的位置：

- 用于行为配置的 `openclaw.json`
- 用于已存储提供商 OAuth/API 密钥认证的 `agents/<agentId>/agent/auth-profiles.json`
- 用于基于环境变量的运行时密钥（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

关于 VM 部署中持久化细节的完整说明，请参见
[Docker VM Runtime - What persists where](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 请关注 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl`，
以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 助手（可选）

为了更轻松地进行日常 Docker 管理，请安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是通过旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装 ClawDock 的，请重新运行上面的安装命令，以便你的本地 helper 文件跟踪新位置。

然后你就可以使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。
运行 `clawdock-help` 查看全部命令。
完整 helper 指南请参见 [ClawDock](/zh-CN/install/clawdock)。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 网关启用智能体沙箱">
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

    只有在沙箱前置条件检查通过后，脚本才会挂载 `docker.sock`。如果沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode`
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
    命令就可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为一个共享信任边界。Compose 配置在 `openclaw-cli` 上移除了 `NET_RAW`/`NET_ADMIN`，并启用了
    `no-new-privileges`。
  </Accordion>

  <Accordion title="权限和 EACCES">
    该镜像以 `node`（uid 1000）身份运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，请确保你的主机绑定挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    请按依赖层可缓存的方式组织你的 Dockerfile。这样可以避免在 lockfile 未变化时重复运行
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
    默认镜像以安全优先为目标，并以非 root 的 `node` 用户运行。若要获得功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **预装系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载内容**：设置
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` 并使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在
    Docker 或无头环境中，请复制你最终跳转到的完整重定向 URL，并将其粘贴回向导中以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 运行时镜像使用 `node:24-bookworm-slim`，并发布 OCI
    基础镜像注解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。Node 基础镜像摘要会通过 Dependabot 的 Docker 基础镜像 PR 刷新；发布构建不会运行发行版升级层。参见
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

共享 VM 部署步骤（包括二进制预置、持久化和更新）请参见
[Hetzner（Docker VPS）](/zh-CN/install/hetzner) 和
[Docker VM Runtime](/zh-CN/install/docker-vm-runtime)。

## 智能体沙箱

当使用 Docker 后端启用 `agents.defaults.sandbox` 时，Gateway 网关会在隔离的 Docker
容器中运行智能体工具执行（shell、文件读写等），而 Gateway 网关本身仍保留在主机上运行。这能在不将整个 Gateway 网关容器化的情况下，为不受信任或多租户智能体会话提供一道强隔离边界。

沙箱作用域可以是每个智能体（默认）、每个会话，或共享。每种作用域都会获得其自己的工作区，并挂载到 `/workspace`。你还可以配置工具允许/拒绝策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全说明和多智能体配置文件，请参见：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整的沙箱参考
- [OpenShell](/zh-CN/gateway/openshell) -- 对沙箱容器的交互式 shell 访问
- [Multi-Agent Sandbox and Tools](/zh-CN/tools/multi-agent-sandbox-tools) -- 每个智能体的覆盖配置

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
  <Accordion title="缺少镜像或沙箱容器无法启动">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    构建沙箱镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器会按需为每个会话自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载工作区所有权匹配的 UID:GID，
    或对工作区文件夹执行 chown。
  </Accordion>

  <Accordion title="在沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会加载
    `/etc/profile` 并且可能重置 PATH。请设置 `docker.env.PATH` 以预先添加你的自定义工具路径，或在你的 Dockerfile 中向 `/etc/profile.d/` 添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间因 OOM 被杀死（退出码 137）">
    VM 至少需要 2 GB 内存。请使用更大的机器规格后重试。
  </Accordion>

  <Accordion title="控制 UI 中显示 Unauthorized 或需要配对">
    获取新的 dashboard 链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情： [Dashboard](/zh-CN/web/dashboard)、[Devices](/zh-CN/cli/devices)。

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

- [安装概览](/zh-CN/install) — 所有安装方式
- [Podman](/zh-CN/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-CN/install/clawdock) — Docker Compose 社区方案
- [更新](/zh-CN/install/updating) — 让 OpenClaw 保持最新
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
