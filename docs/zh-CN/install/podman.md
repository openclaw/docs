---
read_when:
    - 你想要一个使用 Podman 而不是 Docker 的容器化 Gateway 网关
summary: 在无 root 权限的 Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-07-05T11:24:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70b35745eb2ecee734fe686d2f4eb19f462214fbf40fca19fc906ea73d5d28c0
    source_path: install/podman.md
    workflow: 16
---

在由当前非 root 用户管理的无 root Podman 容器中运行 OpenClaw Gateway 网关。

模型：

- Podman 运行 Gateway 网关容器。
- 你的主机 `openclaw` CLI 是控制平面。
- 持久状态默认位于主机的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 先决条件

- **Podman** 无 root 模式
- 主机上已安装 **OpenClaw CLI**
- **可选：** 如果你想要由 Quadlet 管理的自动启动，则需要 `systemd --user`
- **可选：** 仅当你想在无头主机上使用 `loginctl enable-linger "$(whoami)"` 实现开机持久化时，才需要 `sudo`

## 快速开始

<Steps>
  <Step title="一次性设置">
    从仓库根目录运行 `./scripts/podman/setup.sh`。

    这会在你的无 root Podman 存储中构建 `openclaw:local`（如果已设置，则拉取 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`），在缺失时创建带有 `gateway.mode: "local"` 的 `~/.openclaw/openclaw.json`，并在缺失时创建带有生成的 `OPENCLAW_GATEWAY_TOKEN` 的 `~/.openclaw/.env`。

    可选的构建时环境变量：

    | 变量 | 作用 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | 使用现有/已拉取的镜像，而不是构建 `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | 在镜像构建期间安装额外的 apt 包（也接受旧版 `OPENCLAW_DOCKER_APT_PACKAGES`） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | 在镜像构建期间安装额外的 Python 包；固定版本，并且只使用你信任的包索引 |
    | `OPENCLAW_EXTENSIONS` | 在构建时预安装插件依赖 |
    | `OPENCLAW_INSTALL_BROWSER` | 为浏览器自动化预安装 Chromium 和 Xvfb（设为 `1`） |

    如需改用 Quadlet 管理的设置（仅限 Linux + systemd 用户服务）：

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    或设置 `OPENCLAW_PODMAN_QUADLET=1`。

  </Step>

  <Step title="启动 Gateway 网关容器">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    使用 `--userns=keep-id` 以你当前的 uid/gid 启动容器，并将你的 OpenClaw 状态绑定挂载到容器中。

  </Step>

  <Step title="在容器内运行新手引导">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    然后打开 `http://127.0.0.1:18789/`，并使用 `~/.openclaw/.env` 中的令牌。

    模型凭证：在设置期间使用 OpenClaw 管理的凭证（Anthropic API 密钥，或用于 Codex 支持的 OpenAI 的 OpenAI Codex 浏览器 OAuth/设备码凭证）。Podman 启动器不会将主机 CLI 凭据主目录（例如 `~/.claude` 或 `~/.codex`）挂载到设置或 Gateway 网关容器中。现有主机 CLI 登录只是同主机便利路径 -- 对于容器安装，请将提供商凭证保存在设置流程管理的已挂载 `~/.openclaw` 状态中。

  </Step>

  <Step title="从主机 CLI 管理正在运行的容器">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    随后普通 `openclaw` 命令会自动在该容器内运行：

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    在 macOS 上，Podman machine 可能会让浏览器在 Gateway 网关看来不像本地浏览器。如果 Control UI 在启动后报告设备凭证错误，请使用 [Podman 和 Tailscale](#podman-and-tailscale) 中的 Tailscale 指引。

  </Step>
</Steps>

手动启动器只从 `~/.openclaw/.env` 读取一小组 Podman 相关键名的允许列表，并向容器传递显式运行时环境变量；它不会将完整环境文件交给 Podman。

<a id="podman-and-tailscale"></a>

## Podman 和 Tailscale

对于 HTTPS 或远程浏览器访问，请遵循主要 Tailscale 文档。

Podman 专用说明：

- 将 Podman 发布主机保持为 `127.0.0.1`。
- 优先使用主机管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器设备凭证上下文不可靠，请使用 Tailscale 访问，而不是临时的本地隧道变通方案。

参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [Control UI](/zh-CN/web/control-ui)。

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，设置流程会在 `~/.config/containers/systemd/openclaw.container` 安装 Quadlet 文件。

| 操作 | 命令                                    |
| ------ | ------------------------------------------ |
| 启动  | `systemctl --user start openclaw.service`  |
| 停止   | `systemctl --user stop openclaw.service`   |
| 状态 | `systemctl --user status openclaw.service` |
| 日志   | `journalctl --user -u openclaw.service -f` |

编辑 Quadlet 文件后：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

如需在 SSH/无头主机上实现开机持久化，请为当前用户启用 linger：

```bash
sudo loginctl enable-linger "$(whoami)"
```

生成的 Quadlet 服务保持固定且加固的默认形态：`127.0.0.1` 发布端口（`18789` Gateway 网关，`18790` bridge）、容器内 `--bind lan`、`keep-id` 用户命名空间、`OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。它会将 `~/.openclaw/.env` 作为运行时 `EnvironmentFile` 读取，用于 `OPENCLAW_GATEWAY_TOKEN` 等值，但不会使用手动启动器的 Podman 专用覆盖允许列表。对于自定义发布端口、发布主机或其他容器运行标志，请改用手动启动器，或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 配置、环境变量和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **令牌文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 将主机状态绑定挂载到容器中：`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`，`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`。默认情况下，这些是主机目录，而不是匿名容器状态，因此 `openclaw.json`、每个 Agent 的 `auth-profiles.json`、渠道/提供商状态、会话和工作区会在容器替换后保留。设置流程还会为已发布的 Gateway 网关端口上的 `127.0.0.1` 和 `localhost` 播种 `gateway.controlUi.allowedOrigins`，以便本地仪表板能配合容器的非 loopback 绑定工作。

手动启动器可用的环境变量（将这些持久化在 `~/.openclaw/.env` 中；启动器会在最终确定容器/镜像默认值前读取该文件）：

| 变量                                        | 默认值          | 作用                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | 容器名称                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 要运行的镜像                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | 映射到容器 `18789` 的主机端口  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | 映射到容器 `18790` 的主机端口  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 已发布端口的主机接口     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | 容器内的 Gateway 网关绑定模式 |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto` 或 `host`           |

如果你使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请为 `./scripts/podman/setup.sh` 和之后的 `./scripts/run-openclaw-podman.sh launch` 命令设置相同变量 -- 仓库本地启动器不会跨 shell 持久化自定义路径覆盖。

## 有用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开仪表板 URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 查看健康/状态：** `openclaw gateway status --deep`（RPC 探测 + 额外服务扫描）

## 故障排查

- **配置或工作区出现 Permission denied (EACCES)：** 容器默认使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 运行。确保主机配置/工作区路径归当前用户所有。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：** 确保 `~/.openclaw/openclaw.json` 存在并设置 `gateway.mode="local"`。`scripts/podman/setup.sh` 会在缺失时创建它。
- **容器 CLI 命令命中了错误目标：** 显式使用 `openclaw --container <name> ...`，或在你的 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 使用 `--container` 时失败：** 符合预期。重新构建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务无法启动：** 运行 `systemctl --user daemon-reload`，然后运行 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止绑定挂载：** 保持默认挂载行为不变；当 Linux 上 SELinux 处于 enforcing 或 permissive 模式时，启动器会自动添加 `:Z`。

## 相关

- [Docker](/zh-CN/install/docker)
- [Gateway 后台进程](/zh-CN/gateway/background-process)
- [Gateway 故障排查](/zh-CN/gateway/troubleshooting)
