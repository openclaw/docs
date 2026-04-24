---
read_when:
    - 你想在 Linux 服务器或云 VPS 上运行 Gateway 网关
    - 你需要一份托管指南的快速导览
    - 你想了解 OpenClaw 的通用 Linux 服务器调优内容
sidebarTitle: Linux Server
summary: 在 Linux 服务器或云 VPS 上运行 OpenClaw——提供商选择器、架构与调优
title: Linux 服务器
x-i18n:
    generated_at: "2026-04-24T04:08:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

在任意 Linux 服务器或云 VPS 上运行 OpenClaw Gateway 网关。本页可帮助你选择提供商、解释云部署的工作方式，并介绍适用于各类环境的通用 Linux 调优。

## 选择提供商

<CardGroup cols={2}>
  <Card title="Railway" href="/zh-CN/install/railway">一键式浏览器设置</Card>
  <Card title="Northflank" href="/zh-CN/install/northflank">一键式浏览器设置</Card>
  <Card title="DigitalOcean" href="/zh-CN/install/digitalocean">简单的付费 VPS</Card>
  <Card title="Oracle Cloud" href="/zh-CN/install/oracle">永久免费 ARM 层级</Card>
  <Card title="Fly.io" href="/zh-CN/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/zh-CN/install/hetzner">在 Hetzner VPS 上运行 Docker</Card>
  <Card title="Hostinger" href="/zh-CN/install/hostinger">支持一键设置的 VPS</Card>
  <Card title="GCP" href="/zh-CN/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/zh-CN/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/zh-CN/install/exe-dev">带 HTTPS 代理的 VM</Card>
  <Card title="Raspberry Pi" href="/zh-CN/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免费层）** 也同样适用。
可参考社区视频演示：
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
（社区资源——未来可能失效）。

## 云端设置如何工作

- **Gateway 网关运行在 VPS 上**，并负责状态和工作区。
- 你可以通过 **Control UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 请将 VPS 视为事实来源，并定期**备份**状态和工作区。
- 安全默认值：将 Gateway 网关保持在 loopback 上，并通过 SSH 隧道或 Tailscale Serve 访问。
  如果你绑定到 `lan` 或 `tailnet`，请要求设置 `gateway.auth.token` 或 `gateway.auth.password`。

相关页面：[Gateway 网关远程访问](/zh-CN/gateway/remote)、[平台中心](/zh-CN/platforms)。

## 在 VPS 上运行共享公司智能体

当所有用户都处于相同信任边界内，且智能体仅用于业务时，为团队运行单个智能体是有效的设置。

- 将其保留在专用运行时上（VPS/VM/容器 + 专用 OS 用户/账号）。
- 不要让该运行时登录个人 Apple/Google 账号，或个人浏览器/密码管理器配置文件。
- 如果用户彼此具有对抗性，请按 Gateway 网关/主机/OS 用户进行拆分。

安全模型细节请参阅：[安全](/zh-CN/gateway/security)。

## 在 VPS 上使用节点

你可以将 Gateway 网关保留在云端，并在本地设备上配对**节点**
（Mac/iOS/Android/无头环境）。节点提供本地屏幕/摄像头/Canvas 和 `system.run`
能力，而 Gateway 网关保持在云端。

文档：[节点](/zh-CN/nodes)、[Nodes CLI](/zh-CN/cli/nodes)。

## 小型 VM 和 ARM 主机的启动调优

如果在低功耗 VM（或 ARM 主机）上 CLI 命令感觉较慢，请启用 Node 的模块编译缓存：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可提升重复命令的启动速度。
- `OPENCLAW_NO_RESPAWN=1` 可避免自重启路径带来的额外启动开销。
- 第一次运行命令会预热缓存；后续运行会更快。
- 关于 Raspberry Pi 的专门说明，请参阅 [Raspberry Pi](/zh-CN/install/raspberry-pi)。

### systemd 调优清单（可选）

对于使用 `systemd` 的 VM 主机，可考虑：

- 为稳定启动路径添加服务环境变量：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 保持重启行为显式：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 对状态/缓存路径优先使用 SSD 支持的磁盘，以降低随机 I/O 冷启动代价。

对于标准的 `openclaw onboard --install-daemon` 路径，请编辑用户单元：

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

如果你有意安装的是系统单元，请改为使用
`sudo systemctl edit openclaw-gateway.service` 编辑
`openclaw-gateway.service`。

关于 `Restart=` 策略如何帮助自动恢复，请参阅：
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

关于 Linux OOM 行为、子进程受害者选择以及 `exit 137`
诊断，请参阅[Linux 内存压力与 OOM kills](/zh-CN/platforms/linux#memory-pressure-and-oom-kills)。

## 相关内容

- [安装概览](/zh-CN/install)
- [DigitalOcean](/zh-CN/install/digitalocean)
- [Fly.io](/zh-CN/install/fly)
- [Hetzner](/zh-CN/install/hetzner)
