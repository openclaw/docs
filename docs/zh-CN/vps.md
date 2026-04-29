---
read_when:
    - 你想在 Linux 服务器或云 VPS 上运行 Gateway 网关
    - 你需要一份托管指南的快速概览
    - 你想要适用于 OpenClaw 的通用 Linux 服务器调优
sidebarTitle: Linux Server
summary: 在 Linux 服务器或云 VPS 上运行 OpenClaw —— 提供商选择器、架构与调优
title: Linux 服务器
x-i18n:
    generated_at: "2026-04-29T21:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

在任何 Linux 服务器或云 VPS 上运行 OpenClaw Gateway 网关。本页面帮助你选择提供商，解释云部署的工作方式，并介绍适用于各处的通用 Linux 调优。

## 选择提供商

<CardGroup cols={2}>
  <Card title="Railway" href="/zh-CN/install/railway">一键式浏览器设置</Card>
  <Card title="Northflank" href="/zh-CN/install/northflank">一键式浏览器设置</Card>
  <Card title="DigitalOcean" href="/zh-CN/install/digitalocean">简单的付费 VPS</Card>
  <Card title="Oracle Cloud" href="/zh-CN/install/oracle">永久免费 ARM 层级</Card>
  <Card title="Fly.io" href="/zh-CN/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/zh-CN/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/zh-CN/install/hostinger">带一键式设置的 VPS</Card>
  <Card title="GCP" href="/zh-CN/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/zh-CN/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/zh-CN/install/exe-dev">带 HTTPS 代理的 VM</Card>
  <Card title="Raspberry Pi" href="/zh-CN/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免费层级）**也能很好地工作。
社区视频演示可在
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
查看（社区资源 -- 可能会不可用）。

## 云设置的工作方式

- **Gateway 网关在 VPS 上运行**，并拥有状态 + 工作区。
- 你可以通过**控制 UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 将 VPS 视为事实来源，并定期**备份**状态 + 工作区。
- 安全默认值：将 Gateway 网关保持在 loopback 上，并通过 SSH 隧道或 Tailscale Serve 访问。
  如果绑定到 `lan` 或 `tailnet`，请要求使用 `gateway.auth.token` 或 `gateway.auth.password`。

相关页面：[Gateway 网关远程访问](/zh-CN/gateway/remote)、[平台中心](/zh-CN/platforms)。

## 先加固管理员访问

在公共 VPS 上安装 OpenClaw 之前，先决定你想如何管理机器本身。

- 如果你想要仅 Tailnet 的管理员访问，请先安装 Tailscale，将 VPS 加入你的 tailnet，通过 Tailscale IP 或 MagicDNS 名称验证第二个 SSH 会话，然后限制公共 SSH。
- 如果你没有使用 Tailscale，请在暴露更多服务之前，对你的 SSH 路径应用等效加固。
- 这与 Gateway 网关访问是分开的。你仍然可以将 OpenClaw 绑定到 loopback，并使用 SSH 隧道或 Tailscale Serve 访问仪表板。

Tailscale 专用的 Gateway 网关选项位于 [Tailscale](/zh-CN/gateway/tailscale)。

## VPS 上的共享公司智能体

当每个用户都处于同一信任边界内，并且该智能体仅用于业务时，为团队运行单个智能体是有效的设置。

- 将它保持在专用运行时上（VPS/VM/容器 + 专用 OS 用户/账户）。
- 不要让该运行时登录个人 Apple/Google 账户或个人浏览器/密码管理器配置文件。
- 如果用户彼此对抗，请按 Gateway 网关/主机/OS 用户拆分。

安全模型详情：[安全](/zh-CN/gateway/security)。

## 将节点与 VPS 配合使用

你可以将 Gateway 网关保留在云端，并在本地设备（Mac/iOS/Android/无头设备）上配对**节点**。节点提供本地屏幕/摄像头/画布和 `system.run` 能力，而 Gateway 网关保留在云端。

文档：[节点](/zh-CN/nodes)、[节点 CLI](/zh-CN/cli/nodes)。

## 小型 VM 和 ARM 主机的启动调优

如果 CLI 命令在低功耗 VM（或 ARM 主机）上感觉较慢，请启用 Node 的模块编译缓存：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可改善重复命令的启动时间。
- `OPENCLAW_NO_RESPAWN=1` 可避免自重生路径带来的额外启动开销。
- 第一次命令运行会预热缓存；后续运行会更快。
- 有关 Raspberry Pi 的具体信息，请参阅 [Raspberry Pi](/zh-CN/install/raspberry-pi)。

### systemd 调优检查清单（可选）

对于使用 `systemd` 的 VM 主机，请考虑：

- 为稳定的启动路径添加服务 env：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 保持重启行为明确：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 状态/缓存路径优先使用 SSD 支持的磁盘，以减少随机 I/O 冷启动损耗。

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

如果你有意安装了系统单元，请改为通过 `sudo systemctl edit openclaw-gateway.service` 编辑 `openclaw-gateway.service`。

`Restart=` 策略如何帮助自动恢复：
[systemd 可以自动化服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

有关 Linux OOM 行为、子进程受害者选择以及 `exit 137` 诊断，请参阅 [Linux 内存压力和 OOM 终止](/zh-CN/platforms/linux#memory-pressure-and-oom-kills)。

## 相关

- [安装概览](/zh-CN/install)
- [DigitalOcean](/zh-CN/install/digitalocean)
- [Fly.io](/zh-CN/install/fly)
- [Hetzner](/zh-CN/install/hetzner)
