---
read_when:
    - 你想使用 Podman 而不是 Docker 来运行容器化 Gateway 网关
summary: 在 rootless Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-04-05T08:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

在由你当前非 root 用户管理的 rootless Podman 容器中运行 OpenClaw Gateway 网关。

推荐的模型是：

- Podman 运行 gateway 容器。
- 你主机上的 `openclaw` CLI 是控制平面。
- 持久化状态默认保存在主机的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 前置条件

- 以 rootless 模式运行的 **Podman**
- 已安装在主机上的 **OpenClaw CLI**
- **可选：**如果你想要由 Quadlet 管理自动启动，则需要 `systemd --user`
- **可选：**只有当你想在无头主机上使用 `loginctl enable-linger "$(whoami)"` 以实现开机持久化时，才需要 `sudo`

## 快速开始

<Steps>
  <Step title="一次性设置">
    在仓库根目录运行 `./scripts/podman/setup.sh`。
  </Step>

  <Step title="启动 Gateway 网关容器">
    使用 `./scripts/run-openclaw-podman.sh launch` 启动容器。
  </Step>

  <Step title="在容器内运行新手引导">
    运行 `./scripts/run-openclaw-podman.sh launch setup`，然后打开 `http://127.0.0.1:18789/`。
  </Step>

  <Step title="从主机 CLI 管理正在运行的容器">
    设置 `OPENCLAW_CONTAINER=openclaw`，然后在主机上使用普通的 `openclaw` 命令。
  </Step>
</Steps>

设置细节：

- `./scripts/podman/setup.sh` 默认会在你的 rootless Podman 存储中构建 `openclaw:local`，或者如果你已设置 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，则会使用它们。
- 如果缺失，它会创建 `~/.openclaw/openclaw.json`，并设定 `gateway.mode: "local"`。
- 如果缺失，它会创建带有 `OPENCLAW_GATEWAY_TOKEN` 的 `~/.openclaw/.env`。
- 对于手动启动，辅助脚本只会从 `~/.openclaw/.env` 中读取一小部分与 Podman 相关的允许列表键，并向容器传递显式运行时环境变量；它不会把完整 env 文件交给 Podman。

由 Quadlet 管理的设置：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是仅限 Linux 的选项，因为它依赖 systemd 用户服务。

你也可以设置 `OPENCLAW_PODMAN_QUADLET=1`。

可选的构建/设置环境变量：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` —— 使用现有/已拉取的镜像，而不是构建 `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` —— 在构建镜像时安装额外 apt 软件包
- `OPENCLAW_EXTENSIONS` —— 在构建时预安装扩展依赖

容器启动：

```bash
./scripts/run-openclaw-podman.sh launch
```

该脚本会以你当前的 uid/gid 配合 `--userns=keep-id` 启动容器，并将你的 OpenClaw 状态以 bind mount 的方式挂载进容器。

新手引导：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/`，并使用 `~/.openclaw/.env` 中的 token。

主机 CLI 默认值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

然后像下面这样的命令就会自动在该容器内运行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # 包含额外服务扫描
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能会让浏览器在 gateway 看来不再是本地访问。
如果启动后 Control UI 报告设备认证错误，请参考
[Podman + Tailscale](#podman--tailscale) 中的 Tailscale 指南。

<a id="podman--tailscale"></a>

## Podman + Tailscale

若要通过 HTTPS 或远程浏览器访问，请遵循主 Tailscale 文档。

Podman 专用说明：

- 保持 Podman 发布主机为 `127.0.0.1`。
- 优先使用由主机管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器设备认证上下文不可靠，请使用 Tailscale 访问，而不是临时的本地隧道变通方案。

请参阅：

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，setup 会在以下位置安装一个 Quadlet 文件：

```bash
~/.config/containers/systemd/openclaw.container
```

常用命令：

- **启动：** `systemctl --user start openclaw.service`
- **停止：** `systemctl --user stop openclaw.service`
- **状态：** `systemctl --user status openclaw.service`
- **日志：** `journalctl --user -u openclaw.service -f`

编辑 Quadlet 文件后：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

若要在 SSH/无头主机上实现开机持久化，请为当前用户启用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 配置、环境变量和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **Token 文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 会将主机状态以 bind mount 的方式挂载进容器：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

默认情况下，这些都是主机目录，而不是匿名容器状态，因此
`openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态、
会话和工作区在容器被替换后仍然保留。
Podman 设置还会在已发布的 gateway 端口上为 `127.0.0.1` 和 `localhost` 预设 `gateway.controlUi.allowedOrigins`，以便本地仪表板能在容器的非 loopback bind 配置下正常工作。

手动启动器的有用环境变量：

- `OPENCLAW_PODMAN_CONTAINER` —— 容器名（默认是 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` —— 要运行的镜像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` —— 映射到容器 `18789` 的主机端口
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` —— 映射到容器 `18790` 的主机端口
- `OPENCLAW_PODMAN_PUBLISH_HOST` —— 发布端口使用的主机接口；默认是 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` —— 容器内的 gateway bind 模式；默认是 `lan`
- `OPENCLAW_PODMAN_USERNS` —— `keep-id`（默认）、`auto` 或 `host`

手动启动器会在最终确定容器/镜像默认值之前读取 `~/.openclaw/.env`，因此你可以将这些值持久化在其中。

如果你使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请在 `./scripts/podman/setup.sh` 和后续 `./scripts/run-openclaw-podman.sh launch` 命令中设置相同的变量。仓库内的启动器不会在不同 shell 之间持久化自定义路径覆盖。

Quadlet 说明：

- 生成的 Quadlet 服务有意保持固定、加固后的默认形态：`127.0.0.1` 已发布端口、容器内使用 `--bind lan`，以及 `keep-id` 用户命名空间。
- 它固定设置 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它会发布 `127.0.0.1:18789:18789`（gateway）和 `127.0.0.1:18790:18790`（bridge）。
- 它会将 `~/.openclaw/.env` 作为运行时 `EnvironmentFile` 读取，用于 `OPENCLAW_GATEWAY_TOKEN` 之类的值，但不会使用手动启动器中 Podman 专用的覆盖允许列表。
- 如果你需要自定义发布端口、发布主机或其他容器运行标志，请使用手动启动器，或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 常用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开仪表板 URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 查看健康/状态：** `openclaw gateway status --deep`（RPC 探测 + 额外
  服务扫描）

## 故障排除

- **配置或工作区出现 Permission denied（EACCES）：** 容器默认使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 运行。请确保主机上的配置/工作区路径归当前用户所有。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：** 请确保 `~/.openclaw/openclaw.json` 存在，并设置 `gateway.mode="local"`。如果缺失，`scripts/podman/setup.sh` 会创建它。
- **容器 CLI 命令命中了错误目标：** 请显式使用 `openclaw --container <name> ...`，或在你的 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **使用 `--container` 时 `openclaw update` 失败：** 这是预期行为。请重建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务无法启动：** 运行 `systemctl --user daemon-reload`，然后执行 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止 bind mount：** 保持默认挂载行为不变；当 SELinux 处于 enforcing 或 permissive 模式时，启动器会在 Linux 上自动添加 `:Z`。

## 相关

- [Docker](/install/docker)
- [Gateway 后台进程](/gateway/background-process)
- [Gateway 网关故障排除](/gateway/troubleshooting)
