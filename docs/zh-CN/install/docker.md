---
read_when:
    - 你想使用容器化 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 化设置与新手引导
title: Docker
x-i18n:
    generated_at: "2026-04-05T08:27:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker（可选）

Docker **是可选的**。只有当你想使用容器化 Gateway 网关，或想验证 Docker 流程时，才需要使用它。

## Docker 适合我吗？

- **是**：你希望使用一个隔离的、可随时丢弃的 Gateway 网关环境，或者想在没有本地安装的主机上运行 OpenClaw。
- **否**：你是在自己的机器上运行，并且只想要最快的开发循环。请直接使用普通安装流程。
- **沙箱注意事项**：智能体沙箱隔离也会用到 Docker，但它**不要求**整个 Gateway 网关都运行在 Docker 中。参见[沙箱隔离](/gateway/sandboxing)。

## 前置条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 构建镜像至少需要 2 GB RAM（在仅有 1 GB RAM 的主机上，`pnpm install` 可能因 OOM 被杀掉并以退出码 137 结束）
- 足够的镜像和日志磁盘空间
- 如果运行在 VPS/公网主机上，请查看
  [网络暴露的安全加固](/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    在仓库根目录中运行 setup 脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 gateway 镜像。如果你想改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常见标签有：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成新手引导">
    setup 脚本会自动运行新手引导。它会：

    - 提示你输入 provider API key
    - 生成 gateway 令牌并将其写入 `.env`
    - 通过 Docker Compose 启动 gateway

    在 setup 过程中，启动前的新手引导和配置写入会直接通过
    `openclaw-gateway` 运行。`openclaw-cli` 用于在
    gateway 容器已经存在之后执行命令。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/`，并将已配置的
    共享密钥粘贴到 Settings 中。setup 脚本默认会将令牌写入 `.env`；如果你把容器配置改成 password 认证，请改用该
    密码。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
    使用 CLI 容器添加消息渠道：

    ```bash
    # WhatsApp（QR）
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文档：[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)

  </Step>
</Steps>

### 手动流程

如果你更喜欢自己逐步执行，而不是使用 setup 脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
请在仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，setup 脚本会写入 `docker-compose.extra.yml`；
请使用 `-f docker-compose.yml -f docker-compose.extra.yml` 一并包含它。
</Note>

<Note>
由于 `openclaw-cli` 与 `openclaw-gateway` 共享网络命名空间，因此它是一个
启动后工具。在 `docker compose up -d openclaw-gateway` 之前，请通过
`openclaw-gateway` 并结合
`--no-deps --entrypoint node` 来运行新手引导和 setup 阶段的配置写入。
</Note>

### 环境变量

setup 脚本接受以下可选环境变量：

| 变量                       | 用途                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | 使用远程镜像而不是本地构建                   |
| `OPENCLAW_DOCKER_APT_PACKAGES` | 在构建期间安装额外的 apt 包（空格分隔）        |
| `OPENCLAW_EXTENSIONS`          | 在构建阶段预安装扩展依赖（空格分隔名称） |
| `OPENCLAW_EXTRA_MOUNTS`        | 额外的主机 bind mount（逗号分隔的 `source:target[:opts]`）  |
| `OPENCLAW_HOME_VOLUME`         | 将 `/home/node` 持久化到命名 Docker volume                    |
| `OPENCLAW_SANDBOX`             | 选择启用沙箱 bootstrap（`1`, `true`, `yes`, `on`）           |
| `OPENCLAW_DOCKER_SOCKET`       | 覆盖 Docker socket 路径                                      |

### 健康检查

容器探测端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活性
curl -fsS http://127.0.0.1:18789/readyz     # 就绪性
```

Docker 镜像内置了一个 `HEALTHCHECK`，会 ping `/healthz`。
如果检查持续失败，Docker 会将容器标记为 `unhealthy`，
编排系统就可以重启或替换它。

需要认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，这样宿主机就可以通过 Docker 端口发布访问
`http://127.0.0.1:18789`。

- `lan`（默认）：宿主机浏览器和宿主机 CLI 都可以访问已发布的 gateway 端口。
- `loopback`：只有容器网络命名空间内部的进程可以
  直接访问 gateway。

<Note>
请在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 这样的主机别名。
</Note>

### 存储与持久化

Docker Compose 会将 `OPENCLAW_CONFIG_DIR` bind mount 到 `/home/node/.openclaw`，并将
`OPENCLAW_WORKSPACE_DIR` bind mount 到 `/home/node/.openclaw/workspace`，因此这些路径在容器替换后仍然会保留。

这个已挂载的配置目录就是 OpenClaw 存储以下内容的位置：

- `openclaw.json`：行为配置
- `agents/<agentId>/agent/auth-profiles.json`：存储的 provider OAuth/API-key 认证
- `.env`：由环境支持的运行时秘密，例如 `OPENCLAW_GATEWAY_TOKEN`

有关 VM 部署中持久化细节的完整说明，请参见
[Docker VM 运行时 - 持久化位置说明](/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 请关注 `/tmp/openclaw/` 下的 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl`
以及滚动文件日志。

### Shell 辅助工具（可选）

为了更方便地进行日常 Docker 管理，可以安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是通过旧路径 `scripts/shell-helpers/clawdock-helpers.sh` 安装 ClawDock，请重新运行上面的安装命令，以便让本地 helper 文件跟随新位置。

然后你就可以使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。运行
`clawdock-help` 可查看所有命令。
完整 helper 指南请参见 [ClawDock](/install/clawdock)。

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

    只有在沙箱前置条件通过之后，脚本才会挂载 `docker.sock`。如果
    沙箱 setup 无法完成，脚本会将 `agents.defaults.sandbox.mode`
    重置为 `off`。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 的伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI
    命令可以通过 `127.0.0.1` 访问 gateway。请将此视为一个共享
    信任边界。compose 配置已经移除了 `NET_RAW`/`NET_ADMIN`，并在 `openclaw-cli` 上启用了
    `no-new-privileges`。
  </Accordion>

  <Accordion title="权限和 EACCES">
    镜像以 `node` 用户（uid 1000）运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，请确保宿主机 bind mount 归属于 uid 1000：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    请按层缓存依赖的方式组织 Dockerfile。这样可以避免在 lockfile 未变化时重复运行
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

  <Accordion title="高级容器选项">
    默认镜像以安全优先为目标，并以非 root 的 `node` 用户运行。若要使用功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **预装系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载**：设置
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，并使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在
    Docker 或无头环境中，请复制你最终跳转到的完整重定向 URL，并将其粘贴回向导以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 镜像使用 `node:24-bookworm`，并发布 OCI 基础镜像
    注解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。参见
    [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 运行在 VPS 上？

请参见 [Hetzner（Docker VPS）](/install/hetzner) 和
[Docker VM 运行时](/install/docker-vm-runtime)，了解共享 VM 部署步骤，
包括二进制预置、持久化和更新。

## 智能体沙箱

当启用 `agents.defaults.sandbox` 时，gateway 会在隔离的 Docker 容器中运行智能体工具执行
（shell、文件读写等），而
gateway 本身仍然运行在宿主机上。这样你就可以在不将整个 gateway 容器化的前提下，为不受信任或
多租户的智能体会话提供一道硬隔离边界。

沙箱范围可以是按智能体（默认）、按会话，或共享。每个范围
都会把自己的工作区挂载到 `/workspace`。你还可以配置
allow/deny 工具策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全说明和多智能体 profiles，请参见：

- [沙箱隔离](/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/gateway/openshell) -- 对沙箱容器的交互式 shell 访问
- [多智能体沙箱和工具](/tools/multi-agent-sandbox-tools) -- 按智能体覆盖

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
  <Accordion title="镜像缺失或沙箱容器无法启动">
    请使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    构建沙箱镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器会按需为每个会话自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载工作区所有权匹配的 UID:GID，
    或对工作区文件夹执行 chown。
  </Accordion>

  <Accordion title="在沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc` 运行命令（登录 shell），这会加载
    `/etc/profile` 并可能重置 PATH。请设置 `docker.env.PATH` 以预先加入你的
    自定义工具路径，或者在 Dockerfile 中向 `/etc/profile.d/` 添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间被 OOM 杀掉（退出码 137）">
    VM 至少需要 2 GB RAM。请换用更大的机器规格后重试。
  </Accordion>

  <Accordion title="控制 UI 中显示 Unauthorized 或需要 pairing">
    获取一个新的 dashboard 链接，并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多细节： [Dashboard](/web/dashboard)、[Devices](/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目标显示 ws://172.x.x.x，或从 Docker CLI 出现 pairing 错误">
    重置 gateway 模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相关内容

- [安装概览](/install) — 所有安装方式
- [Podman](/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/install/clawdock) — 基于 Docker Compose 的社区设置
- [更新](/install/updating) — 保持 OpenClaw 为最新版本
- [Configuration](/gateway/configuration) — 安装后的 gateway 配置
