---
read_when:
    - 查找 Linux 配套应用状态
    - 规划平台覆盖范围或贡献
    - 调试 Linux VPS 或容器中的 OOM 终止或退出码 137
summary: Linux 支持 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-07-11T20:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway 网关在 Linux 上获得完整支持。推荐使用 Node 运行时；不建议使用 Bun（存在已知的 WhatsApp/Telegram 问题）。

目前还没有原生 Linux 配套应用。欢迎贡献。

## 快速路径（VPS）

1. 安装 Node 24（推荐）或 Node 22.19+（LTS，仍受支持）。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 在你的笔记本电脑上运行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，使用已配置的共享密钥进行身份验证（默认使用令牌；如果 `gateway.auth.mode` 为 `"password"`，则使用密码）。

完整服务器指南：[Linux 服务器](/zh-CN/vps)。VPS 分步示例：
[exe.dev](/zh-CN/install/exe-dev)。

## 安装

- [入门指南](/zh-CN/start/getting-started)
- [安装和更新](/zh-CN/install/updating)
- 可选：[Bun（实验性）](/zh-CN/install/bun)、[Nix](/zh-CN/install/nix)、[Docker](/zh-CN/install/docker)

## Gateway 网关服务（systemd）

使用以下任一方式安装：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # 出现提示时选择 "Gateway service"
```

修复或迁移现有安装：

```bash
openclaw doctor
```

`openclaw gateway install` 默认生成 systemd **用户**单元。完整的服务指南（包括适用于共享或持续运行主机的**系统**级单元变体）请参阅 [Gateway 网关运行手册](/zh-CN/gateway#supervision-and-service-lifecycle)。

仅在自定义设置时才手动编写单元。最小用户单元示例
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

启用该单元：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力和 OOM 终止

在 Linux 上，当主机、虚拟机或容器 cgroup 耗尽内存时，内核会选择一个 OOM 牺牲进程。Gateway 网关不适合作为牺牲进程，因为它负责维护长期会话和渠道连接，因此 OpenClaw 会尽可能提高临时子进程被优先终止的概率。

对于符合条件的 Linux 子进程启动，OpenClaw 会使用一个简短的 `/bin/sh` 垫片封装命令，将子进程自身的 `oom_score_adj` 提高到 `1000`，然后通过 `exec` 执行实际命令。此操作不需要特权：进程始终可以提高自身的 OOM 分数。

涵盖的子进程入口：

- 由监督器管理的命令子进程
- PTY shell 子进程
- MCP stdio 服务器子进程
- 由 OpenClaw 启动的浏览器/Chrome 进程（通过插件 SDK 进程运行时）

该封装仅适用于 Linux；当 `/bin/sh` 不可用，或子进程环境变量将 `OPENCLAW_CHILD_OOM_SCORE_ADJ` 设置为 `0`、`false`、`no` 或 `off` 时，会跳过该封装。

验证子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵盖范围内的子进程预期值为 `1000`；Gateway 网关进程自身保持其正常分数（通常为 `0`）。

当 OOM 终止器选择了临时子进程时，systemd 单元中的 `OOMPolicy=continue` 会让 Gateway 网关服务继续运行，而不会将整个单元标记为失败并重启所有渠道；失败的子进程/会话会报告自身错误。

这不能替代常规的内存调优。如果 VPS 或容器反复终止子进程，请提高内存限制、降低并发量，或添加更严格的资源控制（systemd `MemoryMax=`、容器内存限制）。

## 相关内容

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [Raspberry Pi](/zh-CN/install/raspberry-pi)
- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 配置](/zh-CN/gateway/configuration)
