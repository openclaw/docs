---
read_when:
    - 在 DigitalOcean 上设置 OpenClaw
    - 寻找一个适合 OpenClaw 的简单付费 VPS
summary: 在 DigitalOcean Droplet 上托管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T08:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

在 DigitalOcean Droplet 上运行一个持久化的 OpenClaw Gateway 网关。

## 前置条件

- DigitalOcean 账户（[注册](https://cloud.digitalocean.com/registrations/new)）
- SSH 密钥对（或愿意使用密码鉴权）
- 大约 20 分钟

## 设置

<Steps>
  <Step title="创建 Droplet">
    <Warning>
    使用干净的基础镜像（Ubuntu 24.04 LTS）。避免使用第三方 Marketplace 一键镜像，除非你已经审核过它们的启动脚本和防火墙默认设置。
    </Warning>

    1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 点击 **Create > Droplets**。
    3. 选择：
       - **Region：** 离你最近的区域
       - **Image：** Ubuntu 24.04 LTS
       - **Size：** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication：** SSH 密钥（推荐）或密码
    4. 点击 **Create Droplet** 并记下 IP 地址。

  </Step>

  <Step title="连接并安装">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # 安装 Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # 安装 OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你完成模型鉴权、渠道设置、Gateway 网关 token 生成以及守护进程安装（systemd）。

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
    Gateway 网关默认绑定到 loopback。请选择以下选项之一。

    **选项 A：SSH 隧道（最简单）**

    ```bash
    # 在你的本地机器上
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    然后打开 `http://localhost:18789`。

    **选项 B：Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    然后从你的 tailnet 中任意设备打开 `https://<magicdns>/`。

    **选项 C：Tailnet 绑定（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然后打开 `http://<tailscale-ip>:18789`（需要 token）。

  </Step>
</Steps>

## 故障排除

**Gateway 网关无法启动** —— 运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**端口已被占用** —— 运行 `lsof -i :18789` 查找进程，然后停止它。

**内存不足** —— 使用 `free -h` 验证 swap 是否处于活动状态。如果仍然遇到 OOM，请使用基于 API 的模型（Claude、GPT），而不是本地模型，或者升级到 2 GB Droplet。

## 后续步骤

- [渠道](/channels) —— 连接 Telegram、WhatsApp、Discord 等
- [Gateway 网关配置](/gateway/configuration) —— 所有配置选项
- [更新](/install/updating) —— 让 OpenClaw 保持最新
