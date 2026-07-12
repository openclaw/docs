---
read_when:
    - 在 DigitalOcean 上设置 OpenClaw
    - 正在为 OpenClaw 寻找简单易用的付费 VPS
summary: 在 DigitalOcean Droplet 上托管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-11T20:37:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

在 DigitalOcean Droplet 上运行持久化的 OpenClaw Gateway 网关（1 GB Basic 套餐约为每月 6 美元）。

DigitalOcean 是一种简单直接的付费 VPS 方案。如需更便宜或免费的选项：

- [Hetzner](/zh-CN/install/hetzner) —— 每美元可获得更多 CPU 核心和内存。
- [Oracle Cloud](/zh-CN/install/oracle) —— 提供永久免费 ARM 层级（最高 4 个 OCPU、24 GB 内存），但注册过程有时比较麻烦，并且仅支持 ARM。

## 前置条件

- DigitalOcean 账户（[注册](https://cloud.digitalocean.com/registrations/new)）
- SSH 密钥对（或愿意使用密码身份验证）
- 大约 20 分钟

## 设置

<Steps>
  <Step title="Create a Droplet">
    <Warning>
    使用干净的基础镜像（Ubuntu 24.04 LTS）。除非你已经审查过第三方 Marketplace 一键镜像的启动脚本和默认防火墙设置，否则应避免使用它们。
    </Warning>

    1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 点击 **Create > Droplets**。
    3. 选择：
       - **Region:** 离你最近的区域
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic、Regular、1 个 vCPU / 1 GB 内存 / 25 GB SSD
       - **Authentication:** SSH key（推荐）或 password
    4. 点击 **Create Droplet**，并记下 IP 地址。

  </Step>

  <Step title="Connect and install">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    仅使用 root shell 进行系统引导设置。以非 root 的 `openclaw` 用户运行 OpenClaw 命令，使状态存储在 `/home/openclaw/.openclaw/` 下，并将 Gateway 网关安装为该用户的 systemd `--user` 服务。

  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导将引导你完成模型身份验证、渠道设置、Gateway 网关令牌生成和守护进程安装（systemd 用户服务）。

  </Step>

  <Step title="Add swap (recommended for 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verify the gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Gateway 网关默认绑定到环回地址。请选择以下选项之一。

    **选项 A：SSH 隧道（最简单）**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    然后打开 `http://localhost:18789`。

    **选项 B：Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    然后从 tailnet 中的任意设备打开 `https://<magicdns>/`。

    Tailscale Serve 通过 tailnet 身份标头对 Control UI 和 WebSocket 流量进行身份验证，这要求 Gateway 网关主机本身可信。无论如何，HTTP API 端点仍遵循 Gateway 网关的常规身份验证模式（令牌/密码）。如需通过 Serve 强制使用显式的共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

    **选项 C：绑定到 Tailnet（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然后打开 `http://<tailscale-ip>:18789`（需要令牌）。

  </Step>
</Steps>

## 持久化与备份

OpenClaw 状态存储在以下位置：

- `~/.openclaw/` —— `openclaw.json`、渠道/提供商凭据、每个智能体的 `auth-profiles.json` 和会话数据。
- `~/.openclaw/workspace/` —— Agent 工作区（SOUL.md、记忆和产物）。

这些数据会在 Droplet 重启后保留。要创建可移植的快照，请运行：

```bash
openclaw backup create
```

DigitalOcean 快照会备份整个 Droplet；`openclaw backup create` 创建的备份可跨主机移植。

## 1 GB 内存使用技巧

这款 6 美元的 Droplet 只有 1 GB 内存。为了保持流畅运行：

- 确保上述交换空间配置已写入 `/etc/fstab`，使其在重启后仍然生效。
- 优先使用基于 API 的模型（Claude、GPT），不要使用本地模型——1 GB 内存无法容纳本地大语言模型推理。
- 如果大型提示词导致内存不足，请将 `agents.defaults.model.primary` 设置为更小的模型。
- 使用 `free -h` 和 `htop` 进行监控。

## 故障排查

**Gateway 网关无法启动** —— 运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**端口已被占用** —— 运行 `lsof -i :18789` 查找相关进程，然后将其停止。

**内存不足** —— 使用 `free -h` 验证交换空间是否已启用。如果仍然出现内存不足，请改用基于 API 的模型（Claude、GPT），而不是本地模型，或者升级到 2 GB Droplet。

## 后续步骤

- [渠道](/zh-CN/channels) —— 连接 Telegram、WhatsApp、Discord 等渠道
- [Gateway 配置](/zh-CN/gateway/configuration) —— 所有配置选项
- [更新](/zh-CN/install/updating) —— 使 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [Fly.io](/zh-CN/install/fly)
- [Hetzner](/zh-CN/install/hetzner)
- [VPS 托管](/zh-CN/vps)
