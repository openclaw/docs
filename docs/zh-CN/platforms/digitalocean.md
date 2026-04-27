---
read_when:
    - 在 DigitalOcean 上设置 OpenClaw
    - 为 OpenClaw 寻找低成本 VPS 托管
summary: DigitalOcean 上的 OpenClaw（简单的付费 VPS 选项）
title: DigitalOcean（平台）
x-i18n:
    generated_at: "2026-04-27T07:12:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 15
---

# DigitalOcean 上的 OpenClaw

## 目标

在 DigitalOcean 上运行一个持久化的 OpenClaw Gateway 网关，费用为 **6 美元 / 月**（或使用预留定价时为 4 美元 / 月）。

如果你想要一个 0 美元 / 月的选项，并且不介意 ARM + 特定 provider 的设置，请参阅 [Oracle Cloud 指南](/zh-CN/install/oracle)。

## 成本对比（2026）

| 提供商 | 套餐 | 规格 | 月费 | 说明 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU，24 GB RAM | $0 | ARM，容量有限 / 注册有些麻烦 |
| Hetzner | CX22 | 2 vCPU，4 GB RAM | €3.79（约 $4） | 最便宜的付费选项 |
| DigitalOcean | Basic | 1 vCPU，1 GB RAM | $6 | UI 简单，文档完善 |
| Vultr | Cloud Compute | 1 vCPU，1 GB RAM | $6 | 机房位置多 |
| Linode | Nanode | 1 vCPU，1 GB RAM | $5 | 现已并入 Akamai |

**如何选择提供商：**

- DigitalOcean：最简单的用户体验 + 可预测的配置方式（本指南）
- Hetzner：价格 / 性能比优秀（参见 [Hetzner 指南](/zh-CN/install/hetzner)）
- Oracle Cloud：可以做到 0 美元 / 月，但更挑环境且仅支持 ARM（参见 [Oracle 指南](/zh-CN/install/oracle)）

---

## 前置条件

- DigitalOcean 账户（[注册可获 200 美元免费额度](https://m.do.co/c/signup)）
- SSH 密钥对（或者愿意使用密码认证）
- 大约 20 分钟

## 1）创建 Droplet

<Warning>
请使用干净的基础镜像（Ubuntu 24.04 LTS）。除非你已经审查过其启动脚本和防火墙默认设置，否则请避免使用第三方 Marketplace 一键镜像。
</Warning>

1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)
2. 点击 **Create → Droplets**
3. 选择：
   - **Region：** 离你最近的区域（或离你的用户最近）
   - **Image：** Ubuntu 24.04 LTS
   - **Size：** Basic → Regular → **6 美元 / 月**（1 vCPU，1 GB RAM，25 GB SSD）
   - **Authentication：** SSH 密钥（推荐）或密码
4. 点击 **Create Droplet**
5. 记下 IP 地址

## 2）通过 SSH 连接

```bash
ssh root@YOUR_DROPLET_IP
```

## 3）安装 OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4）运行新手引导

```bash
openclaw onboard --install-daemon
```

向导会引导你完成以下内容：

- 模型认证（API 密钥或 OAuth）
- 渠道设置（Telegram、WhatsApp、Discord 等）
- Gateway 网关令牌（自动生成）
- 守护进程安装（systemd）

## 5）验证 Gateway 网关

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6）访问仪表板

Gateway 网关默认绑定到 loopback。要访问 Control UI：

**选项 A：SSH 隧道（推荐）**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**选项 B：Tailscale Serve（HTTPS，仅 loopback）**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

打开：`https://<magicdns>/`

说明：

- Serve 会让 Gateway 网关仅绑定 loopback，并通过 Tailscale 身份标头对 Control UI / WebSocket 流量进行认证（无令牌认证假定 Gateway 网关主机可信；HTTP API 不使用这些 Tailscale 标头，而是遵循 Gateway 网关的常规 HTTP 认证模式）。
- 如果你想要求显式的共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

**选项 C：tailnet 绑定（不使用 Serve）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

打开：`http://<tailscale-ip>:18789`（需要令牌）。

## 7）连接你的渠道

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

其他提供商请参阅 [Channels](/zh-CN/channels)。

---

## 针对 1 GB RAM 的优化

这个 6 美元的 droplet 只有 1 GB RAM。为了保持运行顺畅：

### 添加 swap（推荐）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 使用更轻量的模型

如果你遇到 OOM，可以考虑：

- 使用基于 API 的模型（Claude、GPT），而不是本地模型
- 将 `agents.defaults.model.primary` 设置为更小的模型

### 监控内存

```bash
free -h
htop
```

---

## 持久化

所有状态都保存在：

- `~/.openclaw/` — `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道 / provider 状态以及会话数据
- `~/.openclaw/workspace/` — 工作区（`SOUL.md`、记忆等）

这些内容在重启后会保留。请定期备份：

```bash
openclaw backup create
```

---

## Oracle Cloud 免费替代方案

Oracle Cloud 提供 **Always Free** ARM 实例，性能显著强于这里列出的任何付费选项——而且费用是 0 美元 / 月。

| 你将获得 | 规格 |
| ----------------- | ---------------------- |
| **4 OCPU** | ARM Ampere A1 |
| **24 GB RAM** | 远远足够 |
| **200 GB 存储** | 块存储卷 |
| **永久免费** | 不会产生信用卡扣费 |

**注意事项：**

- 注册过程可能有些麻烦（如果失败请重试）
- ARM 架构——大多数内容都能正常工作，但某些二进制文件需要 ARM 构建版本

完整设置指南请参阅 [Oracle Cloud](/zh-CN/install/oracle)。关于注册技巧和注册流程故障排除，请参阅这份[社区指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

---

## 故障排除

### Gateway 网关无法启动

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### 端口已被占用

```bash
lsof -i :18789
kill <PID>
```

### 内存不足

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 相关内容

- [Hetzner 指南](/zh-CN/install/hetzner) — 更便宜、性能更强
- [Docker 安装](/zh-CN/install/docker) — 容器化设置
- [Tailscale](/zh-CN/gateway/tailscale) — 安全的远程访问
- [配置](/zh-CN/gateway/configuration) — 完整配置参考
