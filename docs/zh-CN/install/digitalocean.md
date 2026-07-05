---
read_when:
    - 在 DigitalOcean 上设置 OpenClaw
    - 寻找适用于 OpenClaw 的简单付费 VPS
summary: 在 DigitalOcean Droplet 上托管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-05T11:24:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

在 DigitalOcean Droplet 上运行持久化的 OpenClaw Gateway 网关（1 GB Basic 方案约 6 美元/月）。

DigitalOcean 是一条简单直接的付费 VPS 路径。更便宜或免费的选项包括：

- [Hetzner](/zh-CN/install/hetzner) -- 每美元可获得更多核心/RAM。
- [Oracle Cloud](/zh-CN/install/oracle) -- Always Free ARM 层级（最高 4 OCPU、24 GB RAM），但注册可能不太稳定，而且仅支持 ARM。

## 前提条件

- DigitalOcean 账号（[注册](https://cloud.digitalocean.com/registrations/new)）
- SSH 密钥对（或愿意使用密码认证）
- 大约 20 分钟

## 设置

<Steps>
  <Step title="创建 Droplet">
    <Warning>
    使用干净的基础镜像（Ubuntu 24.04 LTS）。除非你已经审查过第三方 Marketplace 一键镜像的启动脚本和防火墙默认设置，否则请避免使用它们。
    </Warning>

    1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 点击 **Create > Droplets**。
    3. 选择：
       - **Region:** 离你最近
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH 密钥（推荐）或密码
    4. 点击 **Create Droplet**，并记下 IP 地址。

  </Step>

  <Step title="连接并安装">
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

    仅将 root shell 用于系统引导。以非 root 的 `openclaw` 用户运行 OpenClaw 命令，这样状态会位于 `/home/openclaw/.openclaw/` 下，并且 Gateway 网关会安装为该用户的 systemd `--user` 服务。

  </Step>

  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你完成模型认证、渠道设置、Gateway 网关令牌生成以及守护进程安装（systemd 用户服务）。

  </Step>

  <Step title="添加 swap（推荐用于 1 GB Droplet）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="验证 Gateway 网关">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问 Control UI">
    Gateway 网关默认绑定到 loopback。选择以下选项之一。

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

    然后从 tailnet 上的任意设备打开 `https://<magicdns>/`。

    Tailscale Serve 通过 tailnet 身份标头认证 Control UI 和 WebSocket 流量，这假设 Gateway 网关主机本身是可信的。无论如何，HTTP API 端点仍遵循 Gateway 网关的常规认证模式（令牌/密码）。如需在 Serve 上要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

    **选项 C：Tailnet 绑定（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然后打开 `http://<tailscale-ip>:18789`（需要令牌）。

  </Step>
</Steps>

## 持久化和备份

OpenClaw 状态位于：

- `~/.openclaw/` -- `openclaw.json`、渠道/提供商凭证、每 Agent 的 `auth-profiles.json` 以及会话数据。
- `~/.openclaw/workspace/` -- Agent 工作区（SOUL.md、记忆、产物）。

这些内容会在 Droplet 重启后保留。要创建可移植快照：

```bash
openclaw backup create
```

DigitalOcean 快照会备份整个 Droplet；`openclaw backup create` 可跨主机移植。

## 1 GB RAM 提示

6 美元的 Droplet 只有 1 GB RAM。为了保持运行顺畅：

- 确保上面的 swap 步骤已写入 `/etc/fstab`，这样重启后仍会生效。
- 优先使用基于 API 的模型（Claude、GPT），而不是本地模型 -- 本地 LLM 推理无法装进 1 GB。
- 如果在大型提示词上遇到 OOM，请将 `agents.defaults.model.primary` 设置为更小的模型。
- 使用 `free -h` 和 `htop` 监控。

## 故障排查

**Gateway 网关无法启动** -- 运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**端口已被占用** -- 运行 `lsof -i :18789` 找到进程，然后停止它。

**内存不足** -- 使用 `free -h` 验证 swap 是否已启用。如果仍然遇到 OOM，请切换到基于 API 的模型（Claude、GPT）而不是本地模型，或升级到 2 GB Droplet。

## 后续步骤

- [渠道](/zh-CN/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/zh-CN/gateway/configuration) -- 所有配置选项
- [更新](/zh-CN/install/updating) -- 让 OpenClaw 保持最新

## 相关

- [安装概览](/zh-CN/install)
- [Fly.io](/zh-CN/install/fly)
- [Hetzner](/zh-CN/install/hetzner)
- [VPS 托管](/zh-CN/vps)
