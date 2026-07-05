---
read_when:
    - 正在查找 Linux 配套应用状态
    - 规划平台覆盖范围或贡献
    - 调试 VPS 或容器中的 Linux OOM 终止或退出码 137
summary: Linux 支持 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-07-05T11:27:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway 网关在 Linux 上完全受支持。Node 是推荐的运行时；不推荐 Bun（存在已知 WhatsApp/Telegram 问题）。

目前还没有 Linux 原生配套应用。欢迎贡献。

## 快速路径（VPS）

1. 安装 Node 24（推荐）或 Node 22.19+（LTS，仍受支持）。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 从你的笔记本电脑运行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，并使用已配置的共享密钥进行认证
   （默认是 token；如果 `gateway.auth.mode` 是 `"password"`，则使用密码）。

完整服务器指南：[Linux 服务器](/zh-CN/vps)。分步 VPS 示例：
[exe.dev](/zh-CN/install/exe-dev)。

## 安装

- [入门指南](/zh-CN/start/getting-started)
- [安装和更新](/zh-CN/install/updating)
- 可选：[Bun（实验性）](/zh-CN/install/bun)、[Nix](/zh-CN/install/nix)、[Docker](/zh-CN/install/docker)

## Gateway 服务（systemd）

使用以下任一方式安装：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

修复或迁移现有安装：

```bash
openclaw doctor
```

`openclaw gateway install` 默认会渲染一个 systemd **用户**单元。完整的
服务指导，包括用于共享或始终在线主机的**系统**级单元变体，位于
[Gateway 运行手册](/zh-CN/gateway#supervision-and-service-lifecycle)。

只有在自定义设置时才手动编写单元。最小用户单元示例
（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）：

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

启用它：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力和 OOM 终止

在 Linux 上，当主机、VM 或容器 cgroup 内存耗尽时，内核会选择一个 OOM 牺牲进程。Gateway 网关并不适合作为牺牲进程，因为它拥有长期存在的会话和渠道连接，因此 OpenClaw 会在可能时倾向于先终止瞬态子进程。

对于符合条件的 Linux 子进程启动，OpenClaw 会用一个简短的
`/bin/sh` shim 包装命令，将子进程自身的 `oom_score_adj` 提高到 `1000`，然后
`exec` 真正的命令。这不需要特权：进程始终可以提高自身的 OOM 分数。

覆盖的子进程表面：

- 由 Supervisor 管理的命令子进程
- PTY shell 子进程
- MCP stdio 服务器子进程
- OpenClaw 启动的浏览器/Chrome 进程（通过插件 SDK 进程运行时）

该包装器仅适用于 Linux；当 `/bin/sh` 不可用，或子进程环境将
`OPENCLAW_CHILD_OOM_SCORE_ADJ` 设置为 `0`、`false`、`no` 或
`off` 时会跳过。

验证子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

覆盖的子进程的预期值为 `1000`；Gateway 网关进程本身保持其正常分数（通常为 `0`）。

systemd 单元的 `OOMPolicy=continue` 会在 OOM killer 选择瞬态子进程时保持 Gateway 网关服务存活，而不是将整个单元标记为失败并重启所有渠道；失败的子进程/会话会报告自己的错误。

这不能替代正常的内存调优。如果 VPS 或容器反复终止子进程，请提高内存限制、降低并发，或添加更强的资源控制（systemd `MemoryMax=`、容器内存限制）。

## 相关

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [Raspberry Pi](/zh-CN/install/raspberry-pi)
- [Gateway 运行手册](/zh-CN/gateway)
- [Gateway 配置](/zh-CN/gateway/configuration)
