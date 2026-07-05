---
read_when:
    - 你想在 Linux 服务器或云 VPS 上运行 Gateway 网关
    - 你需要一份托管指南的快速地图
    - 你想要针对 OpenClaw 的通用 Linux 服务器调优
sidebarTitle: Linux Server
summary: 在 Linux 服务器或云 VPS 上运行 OpenClaw —— 提供商选择器、架构和调优
title: Linux 服务器
x-i18n:
    generated_at: "2026-07-05T11:47:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

在任何 Linux 服务器或云 VPS 上运行 OpenClaw Gateway 网关。本页帮助你选择提供商，说明云部署的工作方式，并介绍适用于各处的通用 Linux 调优。

## 选择提供商

<CardGroup cols={2}>
  <Card title="Azure" href="/zh-CN/install/azure">Linux VM</Card>
  <Card title="DigitalOcean" href="/zh-CN/install/digitalocean">简单的付费 VPS</Card>
  <Card title="exe.dev" href="/zh-CN/install/exe-dev">带 HTTPS 代理的 VM</Card>
  <Card title="Fly.io" href="/zh-CN/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/zh-CN/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/zh-CN/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/zh-CN/install/hostinger">带一键设置的 VPS</Card>
  <Card title="Northflank" href="/zh-CN/install/northflank">一键浏览器设置</Card>
  <Card title="Oracle Cloud" href="/zh-CN/install/oracle">Always Free ARM 层</Card>
  <Card title="Railway" href="/zh-CN/install/railway">一键浏览器设置</Card>
  <Card title="Raspberry Pi" href="/zh-CN/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免费层）**也能很好地工作。
社区视频演示可在
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
查看（社区资源，可能会不可用）。

## 云设置的工作方式

- **Gateway 网关在 VPS 上运行**，并拥有状态 + 工作区。
- 你可以通过 **Control UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 将 VPS 视为事实来源，并定期**备份**状态 + 工作区。
- 安全默认值：将 Gateway 网关保持在 loopback 上，并通过 SSH 隧道或 Tailscale Serve 访问。
  如果绑定到 `lan` 或 `tailnet`，除非将身份验证委托给受信任代理，否则 Gateway 网关需要共享密钥
  （`gateway.auth.token` 或 `gateway.auth.password`）。

相关页面：[Gateway 网关远程访问](/zh-CN/gateway/remote)、[平台中心](/zh-CN/platforms)。

## 先加固管理员访问

在公共 VPS 上安装 OpenClaw 之前，先决定要如何管理主机本身。

- 对于仅 Tailnet 的管理员访问：先安装 Tailscale，将 VPS 加入你的 tailnet，通过 Tailscale IP 或 MagicDNS 名称验证第二个 SSH 会话，然后限制公共 SSH。
- 不使用 Tailscale：在暴露更多服务之前，为你的 SSH 路径应用等效的加固措施。
- 这与 Gateway 网关访问是分开的。你仍然可以将 OpenClaw 绑定到 loopback，并使用 SSH 隧道或 Tailscale Serve 访问仪表板。

Tailscale 专用的 Gateway 网关选项位于 [Tailscale](/zh-CN/gateway/tailscale)。

## VPS 上的共享公司智能体

当每个用户都处于同一信任边界内，并且该智能体仅用于业务时，为团队运行单个智能体是一种有效设置。

- 将它保持在专用运行时上（VPS/VM/容器 + 专用 OS 用户/账号）。
- 不要让该运行时登录个人 Apple/Google 账号或个人浏览器/密码管理器配置文件。
- 如果用户彼此之间存在对抗关系，请按 Gateway 网关/主机/OS 用户进行拆分。

安全模型详情：[安全](/zh-CN/gateway/security)。

## 将节点与 VPS 一起使用

你可以将 Gateway 网关保留在云端，并在本地设备（Mac/iOS/Android/无头设备）上配对**节点**。节点提供本地屏幕/摄像头/canvas 和 `system.run` 能力，而 Gateway 网关保留在云端。

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

- `NODE_COMPILE_CACHE` 可改善重复命令的启动时间；首次运行会预热缓存。
- `OPENCLAW_NO_RESPAWN=1` 让常规 Gateway 网关重启保持在进程内进行，从而避免额外的进程交接，并让小型主机上的 PID 跟踪保持简单。
- 关于 Raspberry Pi 细节，请参阅 [Raspberry Pi](/zh-CN/install/raspberry-pi)。

### systemd 调优检查清单（可选）

对于使用 `systemd` 的 VM 主机，请考虑：

- 用于稳定启动路径的服务环境变量：`OPENCLAW_NO_RESPAWN=1` 和
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 显式重启行为：`Restart=always`、`RestartSec=2`、`TimeoutStartSec=90`
- 为状态/缓存路径使用 SSD 支持的磁盘，以减少随机 I/O 冷启动损耗。

标准 `openclaw onboard --install-daemon` 路径会安装 systemd 用户单元；使用以下命令编辑：

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

如果你有意安装的是系统单元，请通过
`sudo systemctl edit openclaw-gateway.service` 编辑。

`Restart=` 策略如何帮助自动恢复：
[systemd 可以自动化服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

关于 Linux OOM 行为、子进程受害者选择和 `exit 137` 诊断，请参阅 [Linux 内存压力和 OOM 终止](/zh-CN/platforms/linux#memory-pressure-and-oom-kills)。

## 相关

- [安装概览](/zh-CN/install)
- [DigitalOcean](/zh-CN/install/digitalocean)
- [Fly.io](/zh-CN/install/fly)
- [Hetzner](/zh-CN/install/hetzner)
