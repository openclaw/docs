---
read_when:
    - 你想要一个容器化的 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 设置和新手引导
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker 是**可选的**。仅当你想使用容器化的 Gateway 网关，或验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离的、可丢弃的 Gateway 网关环境，或想在没有本地安装的主机上运行 OpenClaw。
- **否**：你正在自己的机器上运行，只想要最快的开发循环。请改用常规安装流程。
- **沙箱注意事项**：启用沙箱隔离时，默认沙箱后端会使用 Docker，但沙箱隔离默认关闭，并且**不**要求整个 Gateway 网关在 Docker 中运行。SSH 和 OpenShell 沙箱后端也可用。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

## 前提条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用于镜像构建（在 1 GB 主机上，`pnpm install` 可能因 OOM 被终止并返回退出码 137）
- 足够的磁盘空间用于镜像和日志
- 如果在 VPS/公网主机上运行，请查看
  [网络暴露的安全加固](/zh-CN/gateway/security)，
  特别是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    在仓库根目录运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 Gateway 网关镜像。若要改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像会首先发布到
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    GHCR 是发布自动化、固定版本部署和来源检查的主要镜像仓库。
    同一个发布工作流也会在 `openclaw/openclaw` 发布官方
    Docker Hub 镜像，供偏好 Docker Hub 的主机使用：

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`。避免使用社区
    Docker Hub 镜像，因为 OpenClaw 无法控制它们的发布时间、重建或保留策略。
    常见官方标签包括：`main`、`latest`、`<version>`（例如 `2026.2.26`），
    以及 `2026.2.26-beta.1` 等 beta 版本。Beta 标签不会移动 `latest` 或 `main`。

  </Step>

  <Step title="离线重新运行">
    在离线主机上，先传输并加载镜像：

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 会验证 `OPENCLAW_IMAGE` 已在本地存在，禁用隐式 Compose 拉取和构建，
    然后运行常规设置流程，例如 `.env` 同步、权限修复、新手引导、Gateway 网关配置同步
    和 Compose 启动。

    如果 `OPENCLAW_SANDBOX=1`，离线设置还会检查
    `OPENCLAW_DOCKER_SOCKET` 背后的守护进程上配置的默认沙箱镜像和每个 Agent 的活跃沙箱镜像。
    Docker 支持的浏览器镜像还必须带有当前 OpenClaw 浏览器契约标签。当所需镜像缺失或不兼容时，
    设置会退出且不更改沙箱配置，而不是在沙箱不可用的情况下报告成功。

  </Step>

  <Step title="完成新手引导">
    设置脚本会自动运行新手引导。它将：

    - 提示输入提供商 API key
    - 生成 Gateway 网关 token 并写入 `.env`
    - 创建 auth-profile secret key 目录
    - 通过 Docker Compose 启动 Gateway 网关

    设置期间，启动前的新手引导和配置写入会直接通过
    `openclaw-gateway` 运行。`openclaw-cli` 用于在
    Gateway 网关容器已存在后运行的命令。

  </Step>

  <Step title="打开 Control UI">
    在浏览器中打开 `http://127.0.0.1:18789/`，并将配置的共享密钥粘贴到 Settings。
    设置脚本默认会将 token 写入 `.env`；如果你将容器配置切换为密码认证，请改用该密码。

    还需要再次查看 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
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

如果你更希望自己运行每个步骤，而不是使用设置脚本：

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
请在任何标准 override 文件之后包含它，例如当两个 override 文件都存在时使用
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

<Note>
由于 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，它是一个启动后工具。
在运行 `docker compose up -d openclaw-gateway` 之前，请通过带有
`--no-deps --entrypoint node` 的 `openclaw-gateway` 运行新手引导和设置时配置写入。
</Note>

### 环境变量

设置脚本接受以下可选环境变量：

| 变量                                       | 用途                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用远程镜像，而不是在本地构建                                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | 构建期间安装额外 apt 包（以空格分隔）                                 |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | 构建期间安装额外 Python 包（以空格分隔）                              |
| `OPENCLAW_EXTENSIONS`                      | 构建时预安装插件依赖（以空格分隔的名称）                              |
| `OPENCLAW_EXTRA_MOUNTS`                    | 额外主机绑定挂载（以逗号分隔的 `source:target[:opts]`）               |
| `OPENCLAW_HOME_VOLUME`                     | 在命名 Docker volume 中持久化 `/home/node`                            |
| `OPENCLAW_SANDBOX`                         | 选择启用沙箱引导（`1`、`true`、`yes`、`on`）                          |
| `OPENCLAW_SKIP_ONBOARDING`                 | 跳过交互式新手引导步骤（`1`、`true`、`yes`、`on`）                    |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆盖 Docker socket 路径                                               |
| `OPENCLAW_DISABLE_BONJOUR`                 | 禁用 Bonjour/mDNS 广播（Docker 中默认为 `1`）                         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 禁用内置插件源绑定挂载覆盖层                                          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | 用于 OpenTelemetry 导出的共享 OTLP/HTTP collector endpoint             |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 用于 traces、metrics 或 logs 的特定信号 OTLP endpoints                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 协议覆盖。当前仅支持 `http/protobuf`                             |
| `OTEL_SERVICE_NAME`                        | 用于 OpenTelemetry resources 的服务名称                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 选择启用最新实验性 GenAI 语义属性                                     |
| `OPENCLAW_OTEL_PRELOADED`                  | 当已有一个 OpenTelemetry SDK 预加载时，跳过启动第二个                 |

官方 Docker 镜像不包含 Homebrew。新手引导期间，当 OpenClaw 在没有 `brew` 的 Linux
容器中运行时，会隐藏仅依赖 brew 的 skill 依赖安装器；这些依赖必须由自定义镜像提供或手动安装。
对于 Debian 包中可用的依赖，请在镜像构建期间使用 `OPENCLAW_IMAGE_APT_PACKAGES`。
旧版 `OPENCLAW_DOCKER_APT_PACKAGES` 名称仍然被接受。
对于 Python 依赖，请使用 `OPENCLAW_IMAGE_PIP_PACKAGES`。这会在镜像构建期间运行
`python3 -m pip install --break-system-packages`，因此请固定包版本，并且只使用你信任的包索引。

维护者可以通过将一个插件源目录挂载到其打包源路径上，针对打包镜像测试内置插件源，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
该挂载的源目录会为同一个插件 id 覆盖匹配的已编译
`/app/dist/extensions/synology-chat` bundle。

### 可观测性

OpenTelemetry 导出是从 Gateway 网关容器到你的 OTLP collector 的出站连接。
它不需要发布 Docker 端口。如果你在本地构建镜像，并希望镜像内可用内置
OpenTelemetry exporter，请包含它的运行时依赖：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在打包的 Docker 安装中，请先从 ClawHub 安装官方 `@openclaw/diagnostics-otel` 插件，
再启用导出。自定义源构建镜像仍可通过
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本地插件源。若要启用导出，请在配置中允许并启用
`diagnostics-otel` 插件，然后设置
`diagnostics.otel.enabled=true`，或使用 [OpenTelemetry
导出](/zh-CN/gateway/opentelemetry) 中的配置示例。Collector 认证头通过
`diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量配置。

Prometheus metrics 使用已发布的 Gateway 网关端口。安装
`clawhub:@openclaw/diagnostics-prometheus`，启用
`diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关认证保护。不要暴露单独的公开
`/metrics` 端口，也不要暴露未认证的反向代理路径。参见
[Prometheus metrics](/zh-CN/gateway/prometheus)。

### 健康检查

容器探针 endpoint（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 镜像包含内置 `HEALTHCHECK`，会 ping `/healthz`。
如果检查持续失败，Docker 会将容器标记为 `unhealthy`，编排系统可以重启或替换它。

认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，因此通过 Docker 端口发布访问
`http://127.0.0.1:18789` 可以正常工作。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问
  Gateway 网关。

<Note>
在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用 `0.0.0.0` 或 `127.0.0.1` 等主机别名。
</Note>

### 主机本地提供商

当 OpenClaw 在 Docker 中运行时，容器内的 `127.0.0.1` 指的是容器本身，
而不是你的主机。对于在主机上运行的 AI 提供商，请使用 `host.docker.internal`：

| 提供商  | 主机默认 URL         | Docker 设置 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

内置 Docker 设置会使用这些主机 URL 作为 LM Studio 和 Ollama
新手引导默认值，并且 `docker-compose.yml` 会将 `host.docker.internal` 映射到
Linux Docker Engine 的 Docker 主机网关。Docker Desktop 已经在
macOS 和 Windows 上提供相同的主机名。

主机服务也必须监听 Docker 可访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 文件或 `docker run` 命令，请自行添加相同的主机
映射，例如
`--add-host=host.docker.internal:host-gateway`。

### Docker 中的 Claude CLI 后端

官方 OpenClaw Docker 镜像不会预安装 Claude Code。请在运行 OpenClaw 的容器用户内安装并
登录 Claude Code，然后持久化该容器的 home，这样镜像升级就不会清除二进制文件或 Claude 凭证
状态。

对于新的 Docker 安装，请在运行设置之前启用持久化 `/home/node` 卷：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

对于现有 Docker 安装，请先停止 stack，并在重新运行设置前重新加载当前
Docker `.env` 值。设置脚本不会自行读取
`.env`；它会根据当前 shell 和默认值重写 `.env`。对于
生成的 `.env`，运行：

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

如果你的 `.env` 包含 shell 无法 source 的值，请先手动重新 export 你依赖的
现有值，例如 `OPENCLAW_IMAGE`、端口、绑定模式、
自定义路径、`OPENCLAW_EXTRA_MOUNTS`、沙箱和跳过新手引导设置。
生成的 overlay 会同时为 `openclaw-gateway` 和
`openclaw-cli` 挂载 home 卷。

使用生成的 Compose overlay 运行其余命令，这样两个服务都会
挂载持久化 home。如果你的设置还使用 `docker-compose.override.yml`，
请在 `docker-compose.extra.yml` 之前包含它。

在该持久化 home 中安装 Claude Code：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

原生安装器会将 `claude` 二进制文件写入
`/home/node/.local/bin/claude`。告诉 OpenClaw 使用该容器路径：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

在同一个持久化容器 home 内登录并验证：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

之后，你可以使用内置的 `claude-cli` 后端：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` 会持久化
`/home/node/.local/bin` 和 `/home/node/.local/share/claude` 下的原生 Claude Code 安装，以及
`/home/node/.claude` 和 `/home/node/.claude.json` 下的 Claude Code
设置和凭证状态。仅持久化 `/home/node/.openclaw` 不足以复用 Claude CLI。如果
你使用 `OPENCLAW_EXTRA_MOUNTS` 而不是 home 卷，请将所有这些
Claude 路径挂载到两个 Docker 服务中。

<Note>
对于共享生产自动化或可预测的 Anthropic 计费，请优先使用
Anthropic API key 路径。Claude CLI 复用会遵循 Claude Code 已安装的
版本、账户登录、计费和更新行为。
</Note>

### Bonjour / mDNS

Docker bridge 网络通常无法可靠转发 Bonjour/mDNS 多播
(`224.0.0.251:5353`)。因此内置 Compose 设置默认使用
`OPENCLAW_DISABLE_BONJOUR=1`，这样 Gateway 网关不会在 bridge 丢弃多播流量时崩溃循环或反复
重启广播。

对 Docker 主机使用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。
仅在使用 host networking、macvlan，或另一个已知 mDNS 多播可用的网络时，才设置 `OPENCLAW_DISABLE_BONJOUR=0`。

有关注意事项和故障排除，请参阅 [Bonjour 设备发现](/zh-CN/gateway/bonjour)。

### 存储和持久化

Docker Compose 会将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，
将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，并将
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` 绑定挂载到 `/home/node/.config/openclaw`，因此这些
路径会在容器替换后保留。当任何变量未设置时，内置
`docker-compose.yml` 会回退到 `${HOME}` 下，或者在 `HOME` 本身也
缺失时回退到 `/tmp`。这样可以避免 `docker compose up` 在裸环境中输出空 source
卷规格。

该挂载的配置目录是 OpenClaw 保存以下内容的位置：

- `openclaw.json`，用于行为配置
- `agents/<agentId>/agent/auth-profiles.json`，用于存储的提供商 OAuth/API key 凭证
- `.env`，用于环境变量支持的运行时密钥，例如 `OPENCLAW_GATEWAY_TOKEN`

凭证配置文件密钥目录会存储用于
OAuth 支持的凭证配置文件令牌材料的本地加密密钥。请将它与 Docker 主机状态一起保留，
但与 `OPENCLAW_CONFIG_DIR` 分开。

已安装的可下载插件会将其包状态存储在已挂载的
OpenClaw home 下，因此插件安装记录和包根目录会在容器
替换后保留。Gateway 网关启动不会生成内置插件依赖树。

有关 VM 部署的完整持久化详情，请参阅
[Docker VM Runtime - 哪些内容持久化在哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：**关注 `media/`、会话 JSONL 文件、共享
SQLite 状态数据库、已安装插件包根目录，以及
`/tmp/openclaw/` 下的滚动文件日志。

### 命令行辅助工具（可选）

为了更轻松地进行日常 Docker 管理，请安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是从较旧的 `scripts/shell-helpers/clawdock-helpers.sh` raw 路径安装 ClawDock，请重新运行上面的安装命令，让你的本地辅助文件跟随新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。运行
`clawdock-help` 查看所有命令。
有关完整辅助工具指南，请参阅 [ClawDock](/zh-CN/install/clawdock)。

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

    脚本只会在沙箱先决条件通过后挂载 `docker.sock`。如果
    沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode`
    重置为 `off`。当 OpenClaw 沙箱处于活动状态时，Codex 代码模式轮次仍然会受 Codex
    `workspace-write` 约束；不要将
    主机 Docker socket 挂载到 Agent 沙箱容器中。

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI
    命令可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为共享
    信任边界。compose 配置会在 `openclaw-gateway` 和 `openclaw-cli` 上都删除
    `NET_RAW`/`NET_ADMIN`，并启用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    某些 Docker Desktop 设置在删除 `NET_RAW` 后，会导致共享网络
    `openclaw-cli` sidecar 中的 DNS 查询失败，这会在
    npm 支持的命令（例如 `openclaw plugins install`）期间表现为
    `EAI_AGAIN`。对于正常 Gateway 网关运行，请保留默认加固 compose 文件。下面的
    本地 override 会通过恢复 Docker 默认 capabilities 来放宽 CLI 容器的安全姿态，因此请仅将它用于需要包注册表访问的一次性 CLI
    命令，而不要作为默认 Compose
    调用：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已经创建了长时间运行的 `openclaw-cli` 容器，请使用相同 override 重新创建它。`docker compose exec` 和 `docker exec` 无法
    更改已创建容器上的 Linux capabilities。

  </Accordion>

  <Accordion title="Permissions and EACCES">
    镜像以 `node`（uid 1000）身份运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，请确保你的主机绑定挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同样的不匹配也可能显示为插件警告，例如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    后跟 `plugin present but blocked`。这意味着进程 uid 与
    已挂载插件目录所有者不一致。优先以默认 uid 1000 运行容器，并修复绑定挂载所有权。只有在你有意长期以 root 身份运行
    OpenClaw 时，才将
    `/path/to/openclaw-config/npm` chown 为 `root:root`。

  </Accordion>

  <Accordion title="Faster rebuilds">
    排列你的 Dockerfile，使依赖层可以被缓存。这样可以避免在 lockfile 未更改时重新运行
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

  <Accordion title="Power-user container options">
    默认镜像以安全优先，并以非 root `node` 身份运行。对于一个功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **内置系统依赖**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **内置 Python 依赖**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **内置 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`
    5. **或将 Playwright 浏览器安装到持久化卷中**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **持久化浏览器下载内容**：使用 `OPENCLAW_HOME_VOLUME` 或
       `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 会在 Linux 上自动检测 Docker 镜像中由
       Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在
    Docker 或无头设置中，复制你最终到达的完整重定向 URL，并将其粘贴回
    向导以完成凭证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 运行时镜像使用 `node:24-bookworm-slim`，并包含 `tini` 作为入口点 init 进程（PID 1），以确保长时间运行的容器中僵尸进程会被回收，信号也会被正确处理。它发布 OCI 基础镜像注解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 和其他注解。Node 基础摘要会
    通过 Dependabot Docker 基础镜像 PR 刷新；发布构建不会运行
    发行版升级层。参见
    [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

参见 [Hetzner（Docker VPS）](/zh-CN/install/hetzner) 和
[Docker VM 运行时](/zh-CN/install/docker-vm-runtime)，了解共享 VM 部署步骤，
包括二进制内置、持久化和更新。

## 智能体沙箱

当 `agents.defaults.sandbox` 启用并使用 Docker 后端时，Gateway 网关
会在隔离的 Docker 容器内运行智能体工具执行（shell、文件读写等），而 Gateway 网关
本身仍留在主机上。这样你可以在不容器化整个
Gateway 网关的情况下，为不受信任或多租户智能体会话建立硬隔离。

沙箱作用域可以是按智能体（默认）、按会话或共享。每个作用域
都有自己的工作区，并挂载到 `/workspace`。你还可以配置
允许/拒绝工具策略、网络隔离、资源限制和浏览器
容器。

完整配置、镜像、安全说明和多智能体配置文件请参见：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/zh-CN/gateway/openshell) -- 对沙箱容器的交互式 shell 访问
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖

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

构建默认沙箱镜像（来自源码检出）：

```bash
scripts/sandbox-setup.sh
```

对于没有源码检出的 npm 安装，请参见 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，了解内联 `docker build` 命令。

## 故障排除

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器未启动">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （源码检出）构建沙箱镜像，或使用 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup) 中的内联 `docker build` 命令（npm 安装），
    或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器会按会话按需自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载的工作区所有权匹配的 UID:GID，
    或 chown 工作区文件夹。
  </Accordion>

  <Accordion title="在沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，它会读取
    `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 来前置你的
    自定义工具路径，或在 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间因 OOM 被终止（退出 137）">
    VM 至少需要 2 GB RAM。使用更大的机器规格后重试。
  </Accordion>

  <Accordion title="Control UI 中未授权或需要配对">
    获取新的仪表板链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[Dashboard](/zh-CN/web/dashboard)、[Devices](/zh-CN/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 网关目标显示 ws://172.x.x.x，或 Docker CLI 出现配对错误">
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
- [Updating](/zh-CN/install/updating) — 让 OpenClaw 保持最新
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
