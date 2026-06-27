---
read_when:
    - 查找 Linux 配套应用状态
    - 规划平台覆盖范围或贡献
    - 调试 VPS 或容器上的 Linux OOM 终止或退出码 137
summary: Linux 支持 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-06-27T02:30:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway 网关在 Linux 上受到完全支持。**Node 是推荐的运行时**。
不推荐将 Bun 用于 Gateway 网关（WhatsApp/Telegram 错误）。

原生 Linux 配套应用已在计划中。如果你想帮助构建，欢迎贡献。

## 初学者快速路径（VPS）

1. 安装 Node 24（推荐；Node 22 LTS，目前为 `22.19+`，仍可用于兼容）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 从你的笔记本电脑执行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，并使用已配置的共享密钥进行身份验证（默认使用 token；如果你设置了 `gateway.auth.mode: "password"`，则使用密码）

完整 Linux 服务器指南：[Linux 服务器](/zh-CN/vps)。分步 VPS 示例：[exe.dev](/zh-CN/install/exe-dev)

## 安装

- [入门指南](/zh-CN/start/getting-started)
- [安装和更新](/zh-CN/install/updating)
- 可选流程：[Bun（实验性）](/zh-CN/install/bun)、[Nix](/zh-CN/install/nix)、[Docker](/zh-CN/install/docker)

## Gateway 网关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [配置](/zh-CN/gateway/configuration)

## Gateway 网关服务安装（CLI）

使用以下任一命令：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

在提示时选择 **Gateway 网关服务**。

修复/迁移：

```
openclaw doctor
```

## 系统控制（systemd 用户单元）

OpenClaw 默认安装 systemd **用户**服务。对于共享服务器或始终在线的服务器，请使用 **系统**
服务。`openclaw gateway install` 和
`openclaw onboard --install-daemon` 已经会为你渲染当前的规范单元；
只有在你需要自定义系统/服务管理器
设置时，才需要手动编写。完整服务指南见 [Gateway 网关运行手册](/zh-CN/gateway)。

最小设置：

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

启用它：

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力和 OOM 终止

在 Linux 上，当主机、VM 或容器 cgroup
耗尽内存时，内核会选择一个 OOM 受害进程。Gateway 网关可能不是理想的受害进程，因为它拥有长生命周期的
会话和渠道连接。因此，OpenClaw 会在可能的情况下让临时子
进程优先于 Gateway 网关被终止。

对于符合条件的 Linux 子进程启动，OpenClaw 会通过一个简短的
`/bin/sh` 包装器启动子进程，该包装器会将子进程自身的 `oom_score_adj` 提高到 `1000`，然后
`exec` 真正的命令。这是非特权操作，因为子进程
只是提高自身被 OOM 终止的可能性。

覆盖的子进程表面包括：

- supervisor 管理的命令子进程，
- PTY shell 子进程，
- MCP stdio 服务器子进程，
- OpenClaw 启动的浏览器/Chrome 进程。

该包装器仅适用于 Linux，并且在 `/bin/sh` 不可用时会跳过。如果子进程环境设置了 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、
`no` 或 `off`，也会跳过。

验证子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

覆盖的子进程的预期值为 `1000`。Gateway 网关进程应保持
其正常分值，通常为 `0`。

推荐的 systemd 单元还会设置 `OOMPolicy=continue`。当临时子进程被 OOM killer 选中时，这会保持
Gateway 网关单元存活；
子命令/会话可以失败并报告错误，而不会让 systemd 将
整个 Gateway 网关服务标记为失败并重启所有渠道。

这不能替代常规内存调优。如果 VPS 或容器反复
终止子进程，请增加内存限制、降低并发量，或添加更强的
资源控制，例如 systemd `MemoryMax=` 或容器级内存限制。

## 相关

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [Raspberry Pi](/zh-CN/install/raspberry-pi)
