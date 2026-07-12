---
read_when:
    - 你希望使用容器化 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 设置和新手引导
title: Docker
x-i18n:
    generated_at: "2026-07-12T14:32:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker 是**可选的**。你可以用它创建隔离的临时 Gateway 网关环境，或在没有本地安装的主机上运行。如果你已经在自己的机器上进行开发，请改用常规安装流程。

启用 `agents.defaults.sandbox` 后，默认沙箱后端会使用 Docker，但沙箱隔离默认关闭，且不要求 Gateway 网关本身在 Docker 中运行。你也可以使用 SSH 和 OpenShell 沙箱后端；请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。

要托管多个用户？有关每租户一个单元的模型，请参阅[多租户托管](/gateway/multi-tenant-hosting)。

## 前置要求

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 构建镜像至少需要 2 GB RAM（在 1 GB 主机上，`pnpm install` 可能因内存不足而被终止，退出码为 137）
- 有足够空间存储镜像和日志
- 在 VPS/公共主机上，请查看[网络暴露安全加固](/zh-CN/gateway/security)，尤其是 Docker `DOCKER-USER` 防火墙链

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    在仓库根目录中运行：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地将 Gateway 网关镜像构建为 `openclaw:local`。如需改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像会首先发布到 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。GHCR 是发布自动化、固定版本部署和来源验证的主要镜像仓库。同一版本还会在 Docker Hub 发布镜像副本 `openclaw/openclaw`：

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    请使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`，并避免使用非官方镜像，因为它们与 OpenClaw 的发布时间和保留策略不一致。官方标签包括：`main`、`latest`、`<version>`（例如 `2026.2.26`），以及 `2026.2.26-beta.1` 等测试版标签（测试版绝不会移动 `latest`/`main`）。默认的 `main`/`latest`/`<version>` 镜像内置 `codex` 和 `diagnostics-otel` 插件。`-browser` 变体（例如 `latest-browser`）还预装了 Chromium，无需在首次运行时安装 Playwright，即可使用[沙箱浏览器](/zh-CN/gateway/sandboxing#sandboxed-browser)工具。

  </Step>

  <Step title="在隔离网络中重新运行">
    在离线主机上，请先传输并加载镜像：

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 会验证 `OPENCLAW_IMAGE` 已存在于本地，禁用隐式的 Compose 拉取和构建，然后执行常规流程：同步 `.env`、修复权限、运行新手引导、同步 Gateway 网关配置以及启动 Compose。

    如果设置了 `OPENCLAW_SANDBOX=1`，离线设置还会检查 `OPENCLAW_DOCKER_SOCKET` 所对应守护进程上的默认沙箱镜像和各智能体沙箱镜像，包括 Docker 后端浏览器镜像上的浏览器契约标签。如果所需镜像缺失或过期，设置程序会直接退出且不更改沙箱配置，而不会错误地报告成功。

  </Step>

  <Step title="完成新手引导">
    设置脚本会自动运行新手引导：

    - 提示输入提供商 API 密钥
    - 生成 Gateway 网关令牌并将其写入 `.env`
    - 创建身份验证配置文件的密钥目录
    - 通过 Docker Compose 启动 Gateway 网关

    启动前的新手引导和配置写入操作会直接通过 `openclaw-gateway` 运行（使用 `--no-deps --entrypoint node`），因为 `openclaw-cli` 与 Gateway 网关共享网络命名空间，只有 Gateway 网关容器存在后才能正常工作。

  </Step>

  <Step title="打开 Control UI">
    打开 `http://127.0.0.1:18789/`，并将写入 `.env` 的令牌粘贴到设置中。如果你已将容器切换为密码身份验证，请改用该密码。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Docker 构建上下文不包含 `.git`。请像上面所示，将源代码标识作为构建参数传入，使镜像的“关于”界面能够显示当前检出的提交和一个构建时间戳。`scripts/docker/setup.sh` 会自动解析并传递这两个值。

<Note>
请从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；请将它放在你自行维护的任何 `docker-compose.override.yml` 之后，例如 `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### 升级容器镜像

替换 OpenClaw 镜像但保留相同的挂载状态和配置后，新的 Gateway 网关会在就绪前运行可安全启动的升级迁移和插件收敛。常规镜像升级不应需要单独运行一次 `openclaw doctor --fix`。

如果无法在启动时安全完成这些修复，Gateway 网关会退出，而不会报告为健康状态。如果配置了重启策略，Docker、Podman 或 Kubernetes 可能会显示 Gateway 网关容器不断重启。请保留挂载的状态卷，然后使用与 Gateway 网关相同的状态和配置挂载，将 `openclaw doctor --fix` 作为容器命令，使用同一镜像运行一次：

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Doctor 完成后，使用默认命令重新启动 Gateway 网关容器。在 Kubernetes 中，请在挂载同一 PVC 的一次性 Job 或调试 Pod 中运行相同命令，然后重新启动 Deployment 或 StatefulSet。

### 环境变量

`scripts/docker/setup.sh` 接受的可选变量（对于 Gateway 网关容器，`docker-compose.yml` 也直接接受这些变量）：

| 变量                                            | 用途                                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 使用远程镜像，而不是在本地构建                                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 构建期间安装额外的 apt 软件包（以空格分隔）。旧版别名：`OPENCLAW_DOCKER_APT_PACKAGES`                              |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 构建期间安装额外的 Python 软件包（以空格分隔）                                                                    |
| `OPENCLAW_EXTENSIONS`                           | 编译/打包选定的受支持插件并安装其运行时依赖项（ID 以逗号或空格分隔）                                               |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 覆盖本地源代码构建的 Node 选项（默认值为 `--max-old-space-size=8192`）                                             |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 覆盖本地源代码构建的 tsdown 堆大小，单位为 MB                                                                      |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 构建仅运行时的本地镜像时跳过声明输出（默认值为 `1`）                                                               |
| `OPENCLAW_INSTALL_BROWSER`                      | 在构建时将 Chromium + Xvfb 内置到镜像中                                                                            |
| `OPENCLAW_EXTRA_MOUNTS`                         | 额外的主机绑定挂载（以逗号分隔的 `source:target[:opts]`）                                                         |
| `OPENCLAW_HOME_VOLUME`                          | 将 `/home/node` 持久化到命名 Docker 卷中                                                                           |
| `OPENCLAW_SANDBOX`                              | 选择启用沙箱引导（`1`、`true`、`yes`、`on`）                                                                      |
| `OPENCLAW_SKIP_ONBOARDING`                      | 跳过交互式新手引导步骤（`1`、`true`、`yes`、`on`）                                                                |
| `OPENCLAW_DOCKER_SOCKET`                        | 覆盖 Docker 套接字路径                                                                                             |
| `OPENCLAW_DISABLE_BONJOUR`                      | 强制开启（`0`）或关闭（`1`）Bonjour/mDNS 广播；请参阅 [Bonjour / mDNS](#bonjour--mdns)                            |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 禁用内置插件源代码的绑定挂载覆盖层                                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | 用于 OpenTelemetry 导出的共享 OTLP/HTTP 收集器端点                                                                 |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | 用于链路追踪、指标或日志的信号专用 OTLP 端点                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | 覆盖 OTLP 协议。目前仅支持 `http/protobuf`                                                                         |
| `OTEL_SERVICE_NAME`                             | 用于 OpenTelemetry 资源的服务名称                                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 选择启用最新的实验性 GenAI 语义属性                                                                                |
| `OPENCLAW_OTEL_PRELOADED`                       | 已预加载 OpenTelemetry SDK 时，跳过启动第二个 SDK                                                                  |

官方镜像不包含 Homebrew。在新手引导期间，如果 Linux 容器中没有 `brew`，OpenClaw 会隐藏仅支持 brew 的 Skills 依赖安装程序；请通过自定义镜像提供这些依赖项，或手动安装。对于 Debian 软件包依赖项，请使用 `OPENCLAW_IMAGE_APT_PACKAGES`；对于 Python 依赖项，请使用 `OPENCLAW_IMAGE_PIP_PACKAGES`（构建时运行 `python3 -m pip install --break-system-packages`，因此请固定版本，并仅使用你信任的软件包索引）。

如果 Docker 报告 `ResourceExhausted`、`cannot allocate memory`，或在 `tsdown` 期间中止，请提高 Docker 构建器的内存限制，或使用更小的显式堆大小重试：

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### 包含选定插件的源代码构建镜像

`OPENCLAW_EXTENSIONS` 用于从源代码检出中选择插件清单 ID；
当源目录名称与 ID 不同时，也接受现有的源目录名称。Docker
构建会一次性将所选项解析为源目录，安装生产依赖，并且当所选插件以
`openclaw.build.bundledDist: false` 单独发布时，将其运行时编译到根级内置
dist 中。这种仅适用于 Docker 的打包方式不会改变插件的 npm 或 ClawHub
工件契约。未知、无效或有歧义的 ID 会导致镜像构建失败。
已知的仅依赖项/源代码 ID 会保持现有的源代码和依赖项
暂存方式，不会新增编译后的根级 dist 条目。具有
统一构建入口的所选插件必须成功编译；未选择的外部插件
源代码和运行时输出会被移除。

例如，以下命令会分别为 ClickClack、Slack 和 Microsoft Teams 构建独立的多架构
FakeCo Gateway 网关镜像。ClawRouter 已经是
OpenClaw 根运行时的一部分，因此 ClickClack 镜像仅选择
`clickclack`。显式传入空的浏览器参数，可使默认镜像不包含
Chromium：

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

对于单个原生本地构建，请使用 `--platform linux/arm64 --load` 或
`--platform linux/amd64 --load`。多平台输出以及附加的 SBOM/来源证明
需要使用镜像仓库，或其他能够保留证明材料的 Buildx 输出。推送后，
检查清单并部署不可变摘要，而不是可变的源 SHA 标签：

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# 部署：registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

这些镜像适用于独立的基于 OCI 的 Gateway 网关和普通 Docker 用户。
由 Crabhelm 管理的 Gateway 网关不会使用这些镜像：该交付路径会构建一个
单独的 x86_64 设备归档，其中包含 OpenClaw npm tarball，并固定
Node、归档和清单摘要。请基于同一份已合入的 OpenClaw 源代码单独
构建该设备。

要针对打包镜像测试内置插件源代码，请将一个插件源目录挂载到其打包后的源路径上，例如 `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。这会覆盖同一插件 ID 对应的已编译 `/app/dist/extensions/synology-chat` 包。

### 可观测性

OpenTelemetry 导出是从 Gateway 网关容器向你的 OTLP 收集器发出的出站流量；无需发布 Docker 端口。要在本地构建的镜像中包含内置导出器：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方预构建镜像已内置 `diagnostics-otel`；只有在你移除了它的情况下，才需要自行安装 `clawhub:@openclaw/diagnostics-otel`。要启用导出，请在配置中允许并启用 `diagnostics-otel` 插件，然后设置 `diagnostics.otel.enabled=true`（完整示例请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)）。收集器身份验证标头通过 `diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量。

Prometheus 指标复用已发布的 Gateway 网关端口。安装 `clawhub:@openclaw/diagnostics-prometheus`，启用 `diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关身份验证保护；不要暴露单独的公共 `/metrics` 端口或未经身份验证的反向代理路径。请参阅 [Prometheus 指标](/zh-CN/gateway/prometheus)。

### 健康检查

容器探测端点（无需身份验证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活状态
curl -fsS http://127.0.0.1:18789/readyz     # 就绪状态
```

镜像内置的 `HEALTHCHECK` 会探测 `/healthz`；连续失败会将容器标记为 `unhealthy`，以便编排器重启或替换容器。

经过身份验证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，因此通过 Docker 端口发布，可从主机访问 `http://127.0.0.1:18789`。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问 Gateway 网关。

<Note>
请在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），不要使用 `0.0.0.0` 或 `127.0.0.1` 等主机别名。
</Note>

### 主机本地提供商

在容器内部，`127.0.0.1` 指向容器本身，而不是主机。对于在主机上运行的提供商，请使用 `host.docker.internal`：

| 提供商    | 主机默认 URL             | Docker 设置 URL                      |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

内置设置会将这些 URL 用作 LM Studio/Ollama 新手引导默认值，并且 `docker-compose.yml` 会在 Linux Docker Engine 上将 `host.docker.internal` 映射到主机 Gateway 网关（Docker Desktop 在 macOS/Windows 上提供相同的别名）。主机服务必须监听 Docker 能够访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

使用你自己的 Compose 文件或 `docker run`？请自行添加相同的映射，例如 `--add-host=host.docker.internal:host-gateway`。

### Docker 中的 Claude CLI 后端

官方镜像不会预安装 Claude Code。请在容器的 `node` 用户下安装并登录，然后持久化该容器的主目录，以免镜像升级清除二进制文件或身份验证状态。

对于全新安装，请在运行设置之前启用持久化 `/home/node` 卷：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

对于现有安装，请先停止栈并重新加载当前 `.env` 值——设置脚本始终根据当前 shell 和默认值重写 `.env`，不会自行读取该文件：

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

如果 `.env` 包含 shell 无法加载的值，请先手动重新导出你依赖的值（`OPENCLAW_IMAGE`、端口、绑定模式、自定义路径、`OPENCLAW_EXTRA_MOUNTS`、沙箱、跳过新手引导）。生成的叠加配置会为 `openclaw-gateway` 和 `openclaw-cli` 挂载主目录卷；请使用该叠加配置运行其余命令（如果你使用 `docker-compose.override.yml`，请先加入该文件）：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

原生安装程序会将 `claude` 写入 `/home/node/.local/bin/claude`。将 OpenClaw 指向该路径：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

使用同一个持久化主目录登录并验证：

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

然后使用内置的 `claude-cli` 后端：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "从 Docker Claude CLI 问好"
```

`OPENCLAW_HOME_VOLUME` 会持久化 `/home/node/.local/bin` 和 `/home/node/.local/share/claude` 下的原生安装，以及 `/home/node/.claude` 和 `/home/node/.claude.json` 下的 Claude Code 设置/身份验证信息。仅持久化 `/home/node/.openclaw` 并不足够；如果使用 `OPENCLAW_EXTRA_MOUNTS` 而不是主目录卷，请将所有这些 Claude 路径挂载到两个服务中。

<Note>
对于共享的生产自动化或可预测的 Anthropic 计费，请优先使用 Anthropic API 密钥路径。复用 Claude CLI 时，其行为取决于 Claude Code 的已安装版本、账户登录、计费和更新方式。
</Note>

### Bonjour / mDNS

Docker 桥接网络通常无法可靠转发 Bonjour/mDNS 多播（`224.0.0.251:5353`）。当未设置 `OPENCLAW_DISABLE_BONJOUR` 时，内置 Bonjour 插件一旦检测到自身运行在容器中，就会自动禁用 LAN 广播，避免因桥接网络丢弃多播而不断重试并陷入崩溃循环。设置 `OPENCLAW_DISABLE_BONJOUR=1` 可无视检测结果强制关闭，设置为 `0` 可强制开启（仅适用于主机网络、macvlan 或其他已知支持 mDNS 多播的网络）。

对于 Docker 主机，请改用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。有关注意事项和故障排除，请参阅 [Bonjour 设备发现](/zh-CN/gateway/bonjour)。

### 存储和持久化

Docker Compose 将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，并将 `OPENCLAW_AUTH_PROFILE_SECRET_DIR` 绑定挂载到 `/home/node/.config/openclaw`，因此这些路径在容器被替换后仍会保留。变量未设置时，`docker-compose.yml` 会回退到 `${HOME}` 下的路径；如果连 `HOME` 本身也不存在，则回退到 `/tmp`，因此在基础环境中运行 `docker compose up` 绝不会生成源路径为空的卷规范。

该挂载的配置目录包含：

- 用于行为配置的 `openclaw.json`
- 用于存储提供商 OAuth/API 密钥身份验证信息的 `agents/<agentId>/agent/auth-profiles.json`
- 用于保存 `OPENCLAW_GATEWAY_TOKEN` 等基于环境变量的运行时机密信息的 `.env`

身份验证配置文件机密目录存储用于加密 OAuth 身份验证配置文件令牌材料的本地加密密钥。请将其与 Docker 主机状态一起保留，但要与 `OPENCLAW_CONFIG_DIR` 分开存放。

已安装的可下载插件会将包状态存储在已挂载的 OpenClaw 主目录下，因此安装记录和包根目录在容器被替换后仍会保留；Gateway 网关启动时不会重新生成内置插件的依赖树。

有关完整的虚拟机持久化详情，请参阅 [Docker 虚拟机运行时——各项内容的持久化位置](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** `media/`、每个智能体的 SQLite 数据库、旧版会话 JSONL 记录、共享 SQLite 状态数据库、已安装插件的包根目录，以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

要简化日常命令，请安装 [ClawDock](/zh-CN/install/clawdock)：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是从旧的 `scripts/shell-helpers/clawdock-helpers.sh` 路径安装的，请重新运行上面的命令，使本地辅助脚本跟踪当前位置。然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令（运行 `clawdock-help` 查看完整列表）。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 网关启用智能体沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义套接字路径（例如无 root 权限的 Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    该脚本仅在沙箱先决条件检查通过后挂载 `docker.sock`。如果无法完成沙箱设置，它会将 `agents.defaults.sandbox.mode` 重置为 `off`。在 OpenClaw 沙箱处于活动状态的轮次中，Codex 代码模式会被禁用（参见[沙箱隔离 § Docker 后端](/zh-CN/gateway/sandboxing#docker-backend)）；切勿将主机 Docker 套接字挂载到智能体沙箱容器中。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全注意事项">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，使 CLI 命令可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为共享信任边界。Compose 配置会在 `openclaw-gateway` 和 `openclaw-cli` 上移除 `NET_RAW`/`NET_ADMIN`，并启用 `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 故障">
    某些 Docker Desktop 设置在移除 `NET_RAW` 后，会导致共享网络中的 `openclaw-cli` 边车无法完成 DNS 查询；运行 `openclaw plugins install` 等依赖 npm 的命令时会显示为 `EAI_AGAIN`。正常运行时请保留默认的加固版 Compose 文件。下面的覆盖配置仅为 `openclaw-cli` 容器恢复默认 capabilities——仅在需要访问注册表的一次性命令中使用，不要将其作为默认调用方式：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已经创建了长期运行的 `openclaw-cli` 容器，请使用相同的覆盖配置重新创建它——`docker compose exec`/`docker exec` 无法更改已创建容器的 Linux capabilities。

  </Accordion>

  <Accordion title="权限和 EACCES">
    镜像以 `node`（uid 1000）身份运行。如果你在 `/home/node/.openclaw` 上遇到权限错误，请确保主机绑定挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同样的不匹配也可能表现为先出现 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`，随后出现 `plugin present but blocked`——进程 uid 与挂载的插件目录所有者不一致。建议使用默认 uid 1000 运行，并修复绑定挂载的所有权。仅当你打算长期以 root 身份运行 OpenClaw 时，才将 `/path/to/openclaw-config/npm` 的所有权更改为 `root:root`。

  </Accordion>

  <Accordion title="加快重新构建">
    调整 Dockerfile 中的指令顺序，使依赖层可被缓存，从而避免在锁文件未更改时重新运行 `pnpm install`：

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
    默认镜像以安全为优先，并以非 root 用户 `node` 运行。若要获得功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **预装系统依赖**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **预装 Python 依赖**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **预装 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`，或使用官方 `-browser` 镜像标签
    5. **或者将 Playwright 浏览器安装到持久化卷中**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **持久化浏览器下载内容**：使用 `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 会在 Linux 上自动检测镜像中由 Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在 Docker 或无头环境中，复制最终跳转到的完整重定向 URL，并将其粘贴回向导以完成身份验证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    运行时镜像使用 `node:24-bookworm-slim`，并以 `tini` 作为 PID 1 运行，从而在长期运行的容器中回收僵尸进程并正确处理信号。它会发布 OCI 基础镜像注解，包括 `org.opencontainers.image.base.name` 和 `org.opencontainers.image.source`。Dependabot 会更新固定的 Node 基础镜像摘要；发布构建不会运行单独的发行版升级层。参见 [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

有关共享 VM 部署步骤，包括二进制文件预装、持久化和更新，请参阅 [Hetzner（Docker VPS）](/zh-CN/install/hetzner)和 [Docker VM 运行时](/zh-CN/install/docker-vm-runtime)。

## 智能体沙箱

通过 Docker 后端启用 `agents.defaults.sandbox` 后，Gateway 网关会在隔离的 Docker 容器内运行智能体工具（shell、文件读写等），而 Gateway 网关本身仍留在主机上——这为不受信任或多租户的智能体会话建立了一道坚固的隔离墙，同时无需将整个 Gateway 网关容器化。

沙箱范围可以是每个智能体（默认）、每个会话或共享；每个范围都有自己的工作区，并挂载到 `/workspace`。你还可以配置工具允许/拒绝策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全注意事项和多智能体配置文件，请参阅：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/zh-CN/gateway/openshell) -- 以交互方式访问沙箱容器的 shell
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖配置

### 快速启用

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 关闭 | 非主会话 | 全部
        scope: "agent", // 会话 | 智能体 | 共享
      },
    },
  },
}
```

构建默认沙箱镜像（从源代码检出目录）：

```bash
scripts/sandbox-setup.sh
```

对于没有源代码检出目录的 npm 安装，请参阅[沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，了解内联 `docker build` 命令。

## 故障排查

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器无法启动">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（源代码检出目录）或[沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)中的内联 `docker build` 命令（npm 安装）构建沙箱镜像，或者将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。容器会在需要时按会话自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与挂载工作区所有权匹配的 UID:GID，或更改工作区文件夹的所有权。
  </Accordion>

  <Accordion title="在沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，该命令会加载 `/etc/profile`，并可能重置 PATH。设置 `docker.env.PATH` 以在 PATH 前添加自定义工具路径，或者在 Dockerfile 的 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间因 OOM 被终止（退出码 137）">
    VM 至少需要 2 GB RAM。请使用更大的机器规格后重试。
  </Accordion>

  <Accordion title="Control UI 中显示未授权或需要配对">
    获取新的仪表板链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[仪表板](/zh-CN/web/dashboard)、[设备](/zh-CN/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 网关目标显示 ws://172.x.x.x，或 Docker CLI 出现配对错误">
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
- [更新](/zh-CN/install/updating) — 使 OpenClaw 保持最新
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
