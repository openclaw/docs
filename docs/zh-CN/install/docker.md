---
read_when:
    - 你想要容器化的 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: 可选的基于 Docker 的 OpenClaw 设置和新手引导
title: Docker
x-i18n:
    generated_at: "2026-07-05T11:26:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7666fabb7e4815cd541d23487a16f973183c5239a7be9a9b7b2ed2d82e640a47
    source_path: install/docker.md
    workflow: 16
---

Docker 是**可选的**。可将它用于隔离的一次性 Gateway 网关环境，或没有本地安装的主机。如果你已经在自己的机器上开发，请改用常规安装流程。

当启用 `agents.defaults.sandbox` 时，默认沙箱后端会使用 Docker，但沙箱隔离默认关闭，并且不要求 Gateway 网关本身在 Docker 中运行。SSH 和 OpenShell 沙箱后端也可用；请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。

## 前提条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用于镜像构建（在 1 GB 主机上，`pnpm install` 可能因 OOM 被终止并以 137 退出）
- 足够的磁盘空间用于镜像和日志
- 在 VPS/公网主机上，请查看[网络暴露的安全加固](/zh-CN/gateway/security)，尤其是 Docker `DOCKER-USER` 防火墙链

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    从仓库根目录运行：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地将 Gateway 网关镜像构建为 `openclaw:local`。如果要改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像会先发布到 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。GHCR 是发布自动化、固定版本部署和来源检查的主要镜像仓库。同一版本也会在 Docker Hub 发布镜像副本 `openclaw/openclaw`：

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`，并避免使用非官方镜像源，因为它们不共享 OpenClaw 的发布时间或保留策略。官方标签：`main`、`latest`、`<version>`（例如 `2026.2.26`），以及 beta 标签，例如 `2026.2.26-beta.1`（beta 永远不会移动 `latest`/`main`）。默认的 `main`/`latest`/`<version>` 镜像内置 `codex` 和 `diagnostics-otel` 插件。`-browser` 变体（例如 `latest-browser`）还预装 Chromium，适用于[沙箱隔离浏览器](/zh-CN/gateway/sandboxing#sandboxed-browser)工具，无需首次运行时安装 Playwright。

  </Step>

  <Step title="离线重新运行">
    在离线主机上，先传输并加载镜像：

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 会验证 `OPENCLAW_IMAGE` 已经存在于本地，禁用隐式 Compose 拉取/构建，然后运行常规流程：`.env` 同步、权限修复、新手引导、Gateway 网关配置同步、Compose 启动。

    如果 `OPENCLAW_SANDBOX=1`，离线设置还会在 `OPENCLAW_DOCKER_SOCKET` 背后的 daemon 上检查已配置的默认沙箱镜像和按 Agent 配置的沙箱镜像，包括 Docker 支持的浏览器镜像上的浏览器契约标签。如果缺少必需镜像或镜像已过期，设置会退出且不更改沙箱配置，而不是报告一个已损坏的成功状态。

  </Step>

  <Step title="完成新手引导">
    设置脚本会自动运行新手引导：

    - 提示输入 provider API key
    - 生成 Gateway 网关令牌并写入 `.env`
    - 创建 auth-profile secret key 目录
    - 通过 Docker Compose 启动 Gateway 网关

    启动前的新手引导和配置写入会直接通过 `openclaw-gateway` 运行（使用 `--no-deps --entrypoint node`），因为 `openclaw-cli` 共享 Gateway 网关的网络命名空间，并且只有在 Gateway 网关容器存在后才能工作。

  </Step>

  <Step title="打开 Control UI">
    打开 `http://127.0.0.1:18789/`，并将写入 `.env` 的令牌粘贴到 Settings 中。如果你已将容器切换为密码认证，请改用该密码。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
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

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；请在你自己维护的任何 `docker-compose.override.yml` 之后包含它，例如 `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### 环境变量

`scripts/docker/setup.sh` 接受的可选变量（对于 Gateway 网关容器，也可由 `docker-compose.yml` 直接接受）：

| 变量                                            | 用途                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 使用远程镜像而不是本地构建                                                                              |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 在构建期间安装额外 apt 软件包（以空格分隔）。旧别名：`OPENCLAW_DOCKER_APT_PACKAGES`                     |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 在构建期间安装额外 Python 软件包（以空格分隔）                                                          |
| `OPENCLAW_EXTENSIONS`                           | 在构建时预安装插件依赖（以逗号或空格分隔的 id）                                                         |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 覆盖本地源码构建的 Node 选项（默认 `--max-old-space-size=8192`）                                         |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 覆盖本地源码构建的 tsdown 堆大小，单位为 MB                                                             |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 在仅运行时本地镜像构建期间跳过声明输出（默认 `1`）                                                       |
| `OPENCLAW_INSTALL_BROWSER`                      | 在构建时将 Chromium + Xvfb 烘焙进镜像                                                                   |
| `OPENCLAW_EXTRA_MOUNTS`                         | 额外的主机绑定挂载（以逗号分隔的 `source:target[:opts]`）                                                |
| `OPENCLAW_HOME_VOLUME`                          | 在命名 Docker 卷中持久化 `/home/node`                                                                   |
| `OPENCLAW_SANDBOX`                              | 选择启用沙箱引导（`1`、`true`、`yes`、`on`）                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | 跳过交互式新手引导步骤（`1`、`true`、`yes`、`on`）                                                       |
| `OPENCLAW_DOCKER_SOCKET`                        | 覆盖 Docker socket 路径                                                                                 |
| `OPENCLAW_DISABLE_BONJOUR`                      | 强制开启（`0`）或关闭（`1`）Bonjour/mDNS 广播；请参阅 [Bonjour / mDNS](#bonjour--mdns)                  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 禁用内置插件源码绑定挂载覆盖                                                                            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | 用于 OpenTelemetry 导出的共享 OTLP/HTTP collector 端点                                                   |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | 用于 traces、metrics 或 logs 的特定信号 OTLP 端点                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP 协议覆盖。目前仅支持 `http/protobuf`                                                               |
| `OTEL_SERVICE_NAME`                             | 用于 OpenTelemetry resources 的服务名称                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 选择启用最新实验性 GenAI 语义属性                                                                       |
| `OPENCLAW_OTEL_PRELOADED`                       | 当已预加载一个 OpenTelemetry SDK 时，跳过启动第二个 OpenTelemetry SDK                                   |

官方镜像不包含 Homebrew。在新手引导期间，如果 Linux 容器中没有 `brew`，OpenClaw 会隐藏仅适用于 brew 的 skill 依赖安装器；请通过自定义镜像提供这些依赖，或手动安装。对 Debian 打包的依赖使用 `OPENCLAW_IMAGE_APT_PACKAGES`，对 Python 依赖使用 `OPENCLAW_IMAGE_PIP_PACKAGES`（会在构建时运行 `python3 -m pip install --break-system-packages`，因此请固定版本，并且只使用你信任的索引）。

如果 Docker 报告 `ResourceExhausted`、`cannot allocate memory`，或在 `tsdown` 期间中止，请提高 Docker builder 内存限制，或用更小的显式堆大小重试：

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

若要使用打包镜像测试内置插件源码，请将一个插件源码目录挂载到其打包源码路径上，例如 `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。这会覆盖相同插件 id 对应的已编译 `/app/dist/extensions/synology-chat` bundle。

### 可观测性

OpenTelemetry 导出从 Gateway 网关容器出站到你的 OTLP collector；它不需要发布 Docker 端口。若要在本地构建镜像中包含内置导出器：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方预构建镜像已经内置 `diagnostics-otel`；只有在你移除了它时，才需要自行安装 `clawhub:@openclaw/diagnostics-otel`。若要启用导出，请在配置中允许并启用 `diagnostics-otel` 插件，然后设置 `diagnostics.otel.enabled=true`（完整示例见 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)）。Collector 认证 header 通过 `diagnostics.otel.headers` 传递，而不是通过 Docker 环境变量传递。

Prometheus metrics 复用已经发布的 Gateway 网关端口。安装 `clawhub:@openclaw/diagnostics-prometheus`，启用 `diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关认证保护；不要暴露单独的公开 `/metrics` 端口或未经认证的反向代理路径。请参阅 [Prometheus metrics](/zh-CN/gateway/prometheus)。

### 健康检查

容器探测端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

镜像内置的 `HEALTHCHECK` 会 ping `/healthz`；反复失败会将容器标记为 `unhealthy`，以便编排器可以重启或替换它。

已认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与回环

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，因此主机上的 `http://127.0.0.1:18789` 可通过 Docker 端口发布工作。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问 Gateway 网关。

<Note>
在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），不要使用 `0.0.0.0` 或 `127.0.0.1` 这样的主机别名。
</Note>

### 主机本地提供商

在容器内，`127.0.0.1` 是容器本身，不是主机。对于运行在主机上的提供商，请使用 `host.docker.internal`：

| 提供商 | 主机默认 URL | Docker 设置 URL |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

内置设置会将这些 URL 用作 LM Studio/Ollama 新手引导默认值，并且 `docker-compose.yml` 会在 Linux Docker Engine 上把 `host.docker.internal` 映射到主机 Gateway 网关（Docker Desktop 在 macOS/Windows 上提供相同别名）。主机服务必须监听 Docker 可访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

使用你自己的 Compose 文件或 `docker run`？请自行添加相同映射，例如 `--add-host=host.docker.internal:host-gateway`。

### Docker 中的 Claude CLI 后端

官方镜像不会预安装 Claude Code。请在容器的 `node` 用户内安装并登录，然后持久化该容器主目录，避免镜像升级抹掉二进制文件或认证状态。

对于全新安装，请先启用持久化 `/home/node` 卷再运行设置：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

对于现有安装，请先停止堆栈并重新加载当前 `.env` 值 — 设置脚本始终会根据当前 shell 和默认值重写 `.env`，它不会自行读取该文件：

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

如果 `.env` 包含你的 shell 无法 source 的值，请先手动重新导出你依赖的内容（`OPENCLAW_IMAGE`、端口、绑定模式、自定义路径、`OPENCLAW_EXTRA_MOUNTS`、沙箱、跳过新手引导）。生成的覆盖配置会为 `openclaw-gateway` 和 `openclaw-cli` 挂载主目录卷；请使用该覆盖配置运行剩余命令（如果你使用 `docker-compose.override.yml`，也请先包含它）：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

原生安装器会把 `claude` 写入 `/home/node/.local/bin/claude`。将 OpenClaw 指向该路径：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

从同一个持久化主目录登录并验证：

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

然后使用内置 `claude-cli` 后端：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` 会持久化 `/home/node/.local/bin` 和 `/home/node/.local/share/claude` 下的原生安装，以及 `/home/node/.claude` 和 `/home/node/.claude.json` 下的 Claude Code 设置/认证。仅持久化 `/home/node/.openclaw` 不够；如果你使用 `OPENCLAW_EXTRA_MOUNTS` 而不是主目录卷，请把所有这些 Claude 路径挂载到两个服务中。

<Note>
对于共享生产自动化或可预测的 Anthropic 计费，优先使用 Anthropic API key 路径。Claude CLI 复用会遵循 Claude Code 的已安装版本、账号登录、计费和更新行为。
</Note>

### Bonjour / mDNS

Docker 桥接网络通常不能可靠转发 Bonjour/mDNS 多播（`224.0.0.251:5353`）。当 `OPENCLAW_DISABLE_BONJOUR` 未设置时，内置 Bonjour 插件一旦检测到自己在容器中运行，就会自动禁用 LAN 广播，因此不会因为重试被桥接网络丢弃的多播而崩溃循环。设置 `OPENCLAW_DISABLE_BONJOUR=1` 可强制关闭，无论检测结果如何；设置为 `0` 可强制开启（仅适用于主机网络、macvlan，或其他已知 mDNS 多播可工作的网络）。

否则，请对 Docker 主机使用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。有关注意事项和故障排查，请参阅 [Bonjour 设备发现](/zh-CN/gateway/bonjour)。

### 存储和持久化

Docker Compose 会将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，并将 `OPENCLAW_AUTH_PROFILE_SECRET_DIR` 绑定挂载到 `/home/node/.config/openclaw`，因此这些路径会在容器替换后保留。当变量未设置时，`docker-compose.yml` 会回退到 `${HOME}` 下；如果 `HOME` 本身也缺失，则回退到 `/tmp`，因此 `docker compose up` 在裸环境中绝不会发出空源卷规范。

该已挂载配置目录包含：

- `openclaw.json`，用于行为配置
- `agents/<agentId>/agent/auth-profiles.json`，用于存储提供商 OAuth/API key 认证
- `.env`，用于基于环境的运行时密钥，例如 `OPENCLAW_GATEWAY_TOKEN`

认证配置文件密钥目录会存储 OAuth 支持的认证配置文件令牌材料所用的本地加密密钥。请将它与 Docker 主机状态一起保留，但与 `OPENCLAW_CONFIG_DIR` 分开。

已安装的可下载插件会把包状态存储在已挂载的 OpenClaw 主目录下，因此安装记录和包根目录会在容器替换后保留；Gateway 网关启动不会重新生成内置插件依赖树。

有关完整 VM 持久化详情，请参阅 [Docker VM 运行时 - 哪些内容持久化在哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：**`media/`、会话 JSONL 文件、共享 SQLite 状态数据库、已安装插件包根目录，以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

如需更短的日常命令，请安装 [ClawDock](/zh-CN/install/clawdock)：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是从较旧的 `scripts/shell-helpers/clawdock-helpers.sh` 路径安装的，请重新运行上面的命令，让你的本地辅助工具跟随当前位置。然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令（运行 `clawdock-help` 查看完整列表）。

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义套接字路径（例如 rootless Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    脚本只会在沙箱先决条件通过后挂载 `docker.sock`。如果沙箱设置无法完成，它会将 `agents.defaults.sandbox.mode` 重置为 `off`。当 OpenClaw 沙箱处于活动状态时，Codex 代码模式会对这些轮次禁用（参阅 [沙箱隔离 § Docker 后端](/zh-CN/gateway/sandboxing#docker-backend)）；切勿将主机 Docker 套接字挂载到 Agent 沙箱容器中。

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI 命令可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为共享信任边界。Compose 配置会在 `openclaw-gateway` 和 `openclaw-cli` 上都丢弃 `NET_RAW`/`NET_ADMIN`，并启用 `no-new-privileges`。
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    某些 Docker Desktop 设置在丢弃 `NET_RAW` 后，会导致共享网络 `openclaw-cli` 辅助容器中的 DNS 查询失败，表现为运行 `openclaw plugins install` 等 npm 支持的命令时出现 `EAI_AGAIN`。正常运行时请保留默认的加固 Compose 文件。下面的覆盖配置只会为 `openclaw-cli` 容器恢复默认 capabilities — 请仅将它用于需要注册表访问的一次性命令，不要作为默认调用方式：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已经创建了长期运行的 `openclaw-cli` 容器，请使用相同覆盖配置重新创建它 — `docker compose exec`/`docker exec` 无法更改已创建容器的 Linux capabilities。

  </Accordion>

  <Accordion title="Permissions and EACCES">
    镜像以 `node`（uid 1000）身份运行。如果你在 `/home/node/.openclaw` 上看到权限错误，请确保主机绑定挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同样的不匹配也可能表现为 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`，随后出现 `plugin present but blocked` — 进程 uid 与已挂载插件目录所有者不一致。优先以默认 uid 1000 运行，并修复绑定挂载所有权。只有在你有意长期以 root 身份运行 OpenClaw 时，才将 `/path/to/openclaw-config/npm` chown 为 `root:root`。

  </Accordion>

  <Accordion title="Faster rebuilds">
    调整你的 Dockerfile 顺序，让依赖层可以缓存，避免在 lockfile 未变化时重新运行 `pnpm install`：

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
    默认镜像以安全优先，并以非 root 的 `node` 身份运行。如需功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **预置系统依赖**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **预置 Python 依赖**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **预置 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`，或使用官方 `-browser` 镜像标签
    5. **或将 Playwright 浏览器安装到持久化卷中**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **持久化浏览器下载内容**：使用 `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 会在 Linux 上自动检测镜像的 Playwright 托管 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在 Docker 或无头设置中，复制你最终到达的完整重定向 URL，并将其粘贴回向导以完成凭证配置。
  </Accordion>

  <Accordion title="基础镜像元数据">
    运行时镜像使用 `node:24-bookworm-slim`，并将 `tini` 作为 PID 1 运行，以便在长时间运行的容器中正确回收僵尸进程并处理信号。它发布 OCI 基础镜像注解，包括 `org.opencontainers.image.base.name` 和 `org.opencontainers.image.source`。Dependabot 会刷新固定的 Node 基础摘要；发布构建不会运行单独的发行版升级层。参见 [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

参见 [Hetzner（Docker VPS）](/zh-CN/install/hetzner) 和 [Docker VM Runtime](/zh-CN/install/docker-vm-runtime)，了解共享 VM 部署步骤，包括二进制烘焙、持久化和更新。

## Agent 沙箱

当 `agents.defaults.sandbox` 启用 Docker 后端时，Gateway 网关会在隔离的 Docker 容器中运行智能体工具执行（shell、文件读写等），而 Gateway 网关本身仍保留在主机上——这为不可信或多租户智能体会话提供了一道硬隔离墙，同时无需将整个 Gateway 网关容器化。

沙箱范围可以按智能体（默认）、按会话或共享；每个范围都会获得挂载在 `/workspace` 的独立工作区。你还可以配置允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

完整配置、镜像、安全说明和多智能体配置文件请参见：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整的沙箱参考
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

构建默认沙箱镜像（从源码检出）：

```bash
scripts/sandbox-setup.sh
```

对于没有源码检出的 npm 安装，请参见 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，了解内联 `docker build` 命令。

## 故障排查

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器未启动">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（源码检出）或 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup) 中的内联 `docker build` 命令（npm 安装）构建沙箱镜像，或者将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。容器会按会话在需要时自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载的工作区所有权匹配的 UID:GID，或对工作区文件夹执行 chown。
  </Accordion>

  <Accordion title="沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，它会读取 `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 以前置你的自定义工具路径，或在 Dockerfile 的 `/etc/profile.d/` 下添加脚本。
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

    更多详情：[Dashboard](/zh-CN/web/dashboard)、[设备](/zh-CN/cli/devices)。

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
- [更新](/zh-CN/install/updating) — 保持 OpenClaw 为最新状态
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
