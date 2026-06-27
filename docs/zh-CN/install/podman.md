---
read_when:
    - 你想使用 Podman 而不是 Docker 来运行容器化的 Gateway 网关
summary: 在 rootless Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-06-27T02:19:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

使用 rootless Podman 容器运行 OpenClaw Gateway 网关，并由你当前的非 root 用户管理。

预期模型是：

- Podman 运行 Gateway 网关容器。
- 你的主机 `openclaw` CLI 是控制平面。
- 默认情况下，持久状态位于主机的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 前提条件

- rootless 模式下的 **Podman**
- 主机上已安装 **OpenClaw CLI**
- **可选：** 如果你想要由 Quadlet 管理的自动启动，则需要 `systemd --user`
- **可选：** 仅当你想在无头主机上通过 `loginctl enable-linger "$(whoami)"` 实现开机持久化时，才需要 `sudo`

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
    设置 `OPENCLAW_CONTAINER=openclaw`，然后从主机使用正常的 `openclaw` 命令。
  </Step>
</Steps>

设置详情：

- `./scripts/podman/setup.sh` 默认在你的 rootless Podman 存储中构建 `openclaw:local`，如果你设置了 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，则使用该镜像。
- 如果缺失，它会创建带有 `gateway.mode: "local"` 的 `~/.openclaw/openclaw.json`。
- 如果缺失，它会创建带有 `OPENCLAW_GATEWAY_TOKEN` 的 `~/.openclaw/.env`。
- 对于手动启动，该辅助脚本只从 `~/.openclaw/.env` 读取一小组 Podman 相关键的允许列表，并向容器传递显式的运行时环境变量；它不会把完整 env 文件交给 Podman。

Quadlet 管理的设置：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是仅限 Linux 的选项，因为它依赖 systemd 用户服务。

你也可以设置 `OPENCLAW_PODMAN_QUADLET=1`。

可选的构建/设置环境变量：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` -- 使用现有/已拉取的镜像，而不是构建 `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- 在镜像构建期间安装额外的 apt 包（也接受旧版 `OPENCLAW_DOCKER_APT_PACKAGES`）
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- 在镜像构建期间安装额外的 Python 包；固定版本，并且只使用你信任的包索引
- `OPENCLAW_EXTENSIONS` -- 在构建时预安装插件依赖
- `OPENCLAW_INSTALL_BROWSER` -- 为浏览器自动化预安装 Chromium 和 Xvfb（设置为 `1` 以启用）

容器启动：

```bash
./scripts/run-openclaw-podman.sh launch
```

该脚本使用 `--userns=keep-id` 以你当前的 uid/gid 启动容器，并将你的 OpenClaw 状态绑定挂载到容器中。

新手引导：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/`，并使用 `~/.openclaw/.env` 中的令牌。

Podman 中的模型凭证：

- 在设置期间使用 OpenClaw 管理的凭证：Anthropic 的 Anthropic API 密钥，或 Codex 支持的 OpenAI 的 OpenAI Codex 浏览器 OAuth/device-code 凭证。
- Podman 启动器不会将 `~/.claude` 或 `~/.codex` 等主机 CLI 凭证目录挂载到设置容器或 Gateway 网关容器中。
- 现有主机 CLI 登录是同主机便利路径。对于容器安装，请将提供商凭证保留在设置所管理的已挂载 `~/.openclaw` 状态中。

主机 CLI 默认值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

然后如下命令会自动在该容器内运行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能会让浏览器对 Gateway 网关来说显得不是本地来源。
如果 Control UI 在启动后报告 device-auth 错误，请使用
[Podman 和 Tailscale](#podman--tailscale) 中的 Tailscale 指南。

<a id="podman--tailscale"></a>

## Podman 和 Tailscale

对于 HTTPS 或远程浏览器访问，请遵循主要 Tailscale 文档。

Podman 特定说明：

- 将 Podman 发布主机保持为 `127.0.0.1`。
- 优先使用主机管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器 device-auth 上下文不可靠，请使用 Tailscale 访问，而不是临时的本地隧道变通方案。

参见：

- [Tailscale](/zh-CN/gateway/tailscale)
- [Control UI](/zh-CN/web/control-ui)

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，设置会在以下位置安装 Quadlet 文件：

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

要在 SSH/无头主机上实现开机持久化，请为你当前的用户启用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 配置、环境变量和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **令牌文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 会将主机状态绑定挂载到容器中：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

默认情况下，这些是主机目录，而不是匿名容器状态，因此
`openclaw.json`、每 Agent 的 `auth-profiles.json`、渠道/提供商状态、
会话和工作区会在替换容器后保留下来。
Podman 设置还会为已发布的 Gateway 网关端口上的 `127.0.0.1` 和 `localhost` 播种 `gateway.controlUi.allowedOrigins`，以便本地仪表板能配合容器的非 loopback 绑定工作。

手动启动器的常用环境变量：

- `OPENCLAW_PODMAN_CONTAINER` -- 容器名称（默认为 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 要运行的镜像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- 映射到容器 `18789` 的主机端口
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- 映射到容器 `18790` 的主机端口
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 已发布端口的主机接口；默认为 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- 容器内的 Gateway 网关绑定模式；默认为 `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（默认）、`auto` 或 `host`

手动启动器会在最终确定容器/镜像默认值之前读取 `~/.openclaw/.env`，因此你可以在那里持久化这些值。

如果你使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请为 `./scripts/podman/setup.sh` 和后续的 `./scripts/run-openclaw-podman.sh launch` 命令设置相同变量。仓库本地启动器不会跨 shell 持久化自定义路径覆盖。

Quadlet 说明：

- 生成的 Quadlet 服务会有意保持固定且强化的默认形态：`127.0.0.1` 发布端口、容器内 `--bind lan`，以及 `keep-id` 用户命名空间。
- 它固定设置 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它发布 `127.0.0.1:18789:18789`（Gateway 网关）和 `127.0.0.1:18790:18790`（bridge）。
- 它将 `~/.openclaw/.env` 作为运行时 `EnvironmentFile` 读取，用于 `OPENCLAW_GATEWAY_TOKEN` 等值，但不会使用手动启动器的 Podman 特定覆盖允许列表。
- 如果你需要自定义发布端口、发布主机或其他容器运行标志，请使用手动启动器，或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 常用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开仪表板 URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 查看健康/状态：** `openclaw gateway status --deep`（RPC 探测 + 额外
  服务扫描）

## 故障排除

- **配置或工作区权限被拒绝（EACCES）：** 容器默认使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 运行。确保主机配置/工作区路径归你当前用户所有。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：** 确保 `~/.openclaw/openclaw.json` 存在并设置 `gateway.mode="local"`。如果缺失，`scripts/podman/setup.sh` 会创建它。
- **容器 CLI 命令命中错误目标：** 显式使用 `openclaw --container <name> ...`，或在你的 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 使用 `--container` 失败：** 这是预期行为。重新构建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务没有启动：** 运行 `systemctl --user daemon-reload`，然后运行 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止绑定挂载：** 保持默认挂载行为不变；当 Linux 上 SELinux 处于 enforcing 或 permissive 模式时，启动器会自动添加 `:Z`。

## 相关

- [Docker](/zh-CN/install/docker)
- [Gateway 后台进程](/zh-CN/gateway/background-process)
- [Gateway 故障排除](/zh-CN/gateway/troubleshooting)
