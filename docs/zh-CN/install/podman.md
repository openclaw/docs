---
read_when:
    - 你希望使用 Podman 而不是 Docker 来运行容器化的 Gateway 网关
summary: 在无 root 权限的 Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-07-11T20:36:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

在由当前非 root 用户管理的无 root 权限 Podman 容器中运行 OpenClaw Gateway 网关。

该模式如下：

- Podman 运行 Gateway 网关容器。
- 主机上的 `openclaw` CLI 充当控制平面。
- 默认情况下，持久状态存储在主机的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 前提条件

- 以无 root 权限模式运行的 **Podman**
- 主机上已安装 **OpenClaw CLI**
- **可选：**如果需要由 Quadlet 管理的自动启动，请使用 `systemd --user`
- **可选：**仅当你希望在无头主机上使用 `loginctl enable-linger "$(whoami)"` 实现开机持久运行时，才需要 `sudo`

## 快速开始

<Steps>
  <Step title="一次性设置">
    在仓库根目录运行 `./scripts/podman/setup.sh`。

    此命令会在你的无 root 权限 Podman 存储中构建 `openclaw:local`（如果设置了 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，则拉取对应镜像）；如果缺少 `~/.openclaw/openclaw.json`，则创建该文件并设置 `gateway.mode: "local"`；如果缺少 `~/.openclaw/.env`，则创建该文件并生成 `OPENCLAW_GATEWAY_TOKEN`。

    可选的构建时环境变量：

    | 变量 | 作用 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | 使用现有或拉取的镜像，而不是构建 `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | 在构建镜像期间安装额外的 apt 软件包（也接受旧版 `OPENCLAW_DOCKER_APT_PACKAGES`） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | 在构建镜像期间安装额外的 Python 软件包；请固定版本，并且只使用你信任的软件包索引 |
    | `OPENCLAW_EXTENSIONS` | 编译并打包所选的受支持插件，并安装其运行时依赖项 |
    | `OPENCLAW_INSTALL_BROWSER` | 预安装 Chromium 和 Xvfb 以进行浏览器自动化（设置为 `1`） |

    如果要改用 Quadlet 管理的设置（仅限 Linux + systemd 用户服务）：

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    或设置 `OPENCLAW_PODMAN_QUADLET=1`。

  </Step>

  <Step title="启动 Gateway 网关容器">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    此命令使用 `--userns=keep-id`，以当前用户的 uid/gid 启动容器，并将 OpenClaw 状态以绑定挂载方式装入容器。

  </Step>

  <Step title="在容器内运行新手引导">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    然后打开 `http://127.0.0.1:18789/`，并使用 `~/.openclaw/.env` 中的令牌。

    模型身份验证：设置期间请使用由 OpenClaw 管理的身份验证（Anthropic API 密钥，或者对于由 Codex 支持的 OpenAI，使用 OpenAI Codex 浏览器 OAuth/设备代码身份验证）。Podman 启动器不会将 `~/.claude` 或 `~/.codex` 等主机 CLI 凭据主目录挂载到设置容器或 Gateway 网关容器中。主机上现有的 CLI 登录仅用于同一主机上的便捷访问路径——对于容器安装，请将提供商身份验证信息保存在设置流程所管理并挂载的 `~/.openclaw` 状态中。

  </Step>

  <Step title="通过主机 CLI 管理运行中的容器">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    此后，普通的 `openclaw` 命令会自动在该容器内运行：

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    在 macOS 上，Podman machine 可能导致浏览器在 Gateway 网关看来并非本地访问。如果启动后 Control UI 报告设备身份验证错误，请按照 [Podman 和 Tailscale](#podman-and-tailscale) 中的 Tailscale 指引操作。

  </Step>
</Steps>

手动启动器只从 `~/.openclaw/.env` 读取一个较小的 Podman 相关键白名单，并将明确指定的运行时环境变量传递给容器；它不会将整个环境变量文件交给 Podman。

<a id="podman-and-tailscale"></a>

## Podman 和 Tailscale

如需 HTTPS 或远程浏览器访问，请遵循主要的 Tailscale 文档。

Podman 专用说明：

- 将 Podman 发布主机保持为 `127.0.0.1`。
- 优先使用主机管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器的设备身份验证上下文不可靠，请使用 Tailscale 访问，而不是临时搭建本地隧道作为变通方案。

请参阅 [Tailscale](/zh-CN/gateway/tailscale) 和 [Control UI](/zh-CN/web/control-ui)。

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，设置流程会在 `~/.config/containers/systemd/openclaw.container` 安装一个 Quadlet 文件。

| 操作 | 命令                                       |
| ---- | ------------------------------------------ |
| 启动 | `systemctl --user start openclaw.service`  |
| 停止 | `systemctl --user stop openclaw.service`   |
| 状态 | `systemctl --user status openclaw.service` |
| 日志 | `journalctl --user -u openclaw.service -f` |

编辑 Quadlet 文件后：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

要在 SSH/无头主机上实现开机持久运行，请为当前用户启用延迟退出：

```bash
sudo loginctl enable-linger "$(whoami)"
```

生成的 Quadlet 服务采用固定且经过加固的默认结构：发布到 `127.0.0.1` 的端口（`18789` 用于 Gateway 网关，`18790` 用于桥接）、容器内使用 `--bind lan`、采用 `keep-id` 用户命名空间、设置 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。它将 `~/.openclaw/.env` 作为运行时 `EnvironmentFile` 读取，以获取 `OPENCLAW_GATEWAY_TOKEN` 等值，但不会使用手动启动器中 Podman 专用的覆盖项白名单。如需自定义发布端口、发布主机或其他容器运行标志，请改用手动启动器；也可以直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 配置、环境变量和存储

- **配置目录：**`~/.openclaw`
- **工作区目录：**`~/.openclaw/workspace`
- **令牌文件：**`~/.openclaw/.env`
- **启动辅助脚本：**`./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 将主机状态以绑定挂载方式装入容器：`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`，`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`。默认情况下，这些是主机目录，而不是匿名容器状态，因此 `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态、会话和工作区都能在替换容器后保留。设置流程还会针对已发布的 Gateway 网关端口，在 `gateway.controlUi.allowedOrigins` 中预置 `127.0.0.1` 和 `localhost`，以便本地仪表板能够配合容器中的非环回绑定正常工作。

手动启动器的实用环境变量（将这些变量持久保存在 `~/.openclaw/.env` 中；启动器会在确定最终容器和镜像默认值之前读取该文件）：

| 变量                                       | 默认值           | 作用                                   |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | 容器名称                               |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 要运行的镜像                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | 映射到容器 `18789` 的主机端口          |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | 映射到容器 `18790` 的主机端口          |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 发布端口使用的主机网络接口             |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | 容器内的 Gateway 网关绑定模式          |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto` 或 `host`            |

如果使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请为 `./scripts/podman/setup.sh` 和后续的 `./scripts/run-openclaw-podman.sh launch` 命令设置相同的变量——仓库内的启动器不会跨 shell 会话持久保存自定义路径覆盖项。

## 升级镜像

重新构建或拉取新镜像后，请重启容器或 Quadlet 服务。
首次使用新版 OpenClaw 启动时，Gateway 网关会在报告就绪之前执行安全的状态修复和
插件修复。

如果 Gateway 网关退出而未进入就绪状态，请使用同一个镜像，针对相同的已挂载状态/配置运行一次
`openclaw doctor --fix`，然后正常重启
Gateway 网关：

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

在 SELinux 主机上，如果 Podman 阻止访问已挂载的
状态，请为两个绑定挂载都添加 `,Z`。

## 实用命令

- **容器日志：**`podman logs -f openclaw`
- **停止容器：**`podman stop openclaw`
- **删除容器：**`podman rm -f openclaw`
- **通过主机 CLI 打开仪表板 URL：**`openclaw dashboard --no-open`
- **通过主机 CLI 检查健康状况/状态：**`openclaw gateway status --deep`（RPC 探测 + 额外服务扫描）

## 故障排查

- **配置或工作区出现权限被拒绝（EACCES）：**默认情况下，容器使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 运行。请确保主机上的配置/工作区路径归当前用户所有。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：**请确保 `~/.openclaw/openclaw.json` 存在并设置了 `gateway.mode="local"`。如果缺少该文件，`scripts/podman/setup.sh` 会创建它。
- **镜像更新后容器不断重启：**运行[升级镜像](#upgrading-images)中的一次性 `openclaw doctor --fix` 命令，然后再次启动 Gateway 网关。
- **容器 CLI 命令连接到错误的目标：**显式使用 `openclaw --container <name> ...`，或在 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **使用 `--container` 时 `openclaw update` 失败：**这是预期行为。请重新构建或拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务无法启动：**运行 `systemctl --user daemon-reload`，然后运行 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要运行 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止绑定挂载：**保持默认挂载行为不变；当 Linux 上的 SELinux 处于强制或宽容模式时，启动器会自动添加 `:Z`。

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Gateway 后台进程](/zh-CN/gateway/background-process)
- [Gateway 故障排查](/zh-CN/gateway/troubleshooting)
