---
read_when:
    - 在 DigitalOcean 上设置 OpenClaw
    - 正在寻找适合 OpenClaw 的低价 VPS 托管方案
summary: 在 DigitalOcean 上运行 OpenClaw（简单的付费 VPS 方案）
title: DigitalOcean（平台）
x-i18n:
    generated_at: "2026-04-24T03:41:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# 在 DigitalOcean 上运行 OpenClaw

## 目标

在 DigitalOcean 上以 **6 美元 / 月**（或使用预留定价时 4 美元 / 月）的成本运行一个持久化的 OpenClaw Gateway 网关。

如果你想要一个 0 美元 / 月的方案，并且不介意 ARM + 提供商特定的设置，请参见 [Oracle Cloud 指南](/zh-CN/install/oracle)。

## 成本对比（2026）

| 提供商       | 套餐            | 规格                   | 月费         | 说明                                 |
| ------------ | --------------- | ---------------------- | ------------ | ------------------------------------ |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU，24 GB RAM | $0           | ARM，容量有限 / 注册有些坑           |
| Hetzner      | CX22            | 2 vCPU，4 GB RAM       | €3.79（约 $4） | 最便宜的付费选项                     |
| DigitalOcean | Basic           | 1 vCPU，1 GB RAM       | $6           | UI 简单，文档完善                    |
| Vultr        | Cloud Compute   | 1 vCPU，1 GB RAM       | $6           | 机房位置多                           |
| Linode       | Nanode          | 1 vCPU，1 GB RAM       | $5           | 现已成为 Akamai 的一部分             |

**如何选择提供商：**

- DigitalOcean：最简单的 UX + 可预测的设置流程（本指南）
- Hetzner：价格 / 性能比优秀（参见 [Hetzner 指南](/zh-CN/install/hetzner)）
- Oracle Cloud：可做到 0 美元 / 月，但更容易出问题且仅支持 ARM（参见 [Oracle 指南](/zh-CN/install/oracle)）

---

## 前提条件

- DigitalOcean 账户（[注册可获 200 美元免费额度](https://m.do.co/c/signup)）
- SSH 密钥对（或愿意使用密码认证）
- 约 20 分钟

## 1）创建 Droplet

<Warning>
请使用干净的基础镜像（Ubuntu 24.04 LTS）。除非你已经审查过其启动脚本和防火墙默认值，否则请避免使用第三方 Marketplace 一键镜像。
</Warning>

1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)
2. 点击 **Create → Droplets**
3. 选择：
   - **Region：** 离你（或你的用户）最近
   - **Image：** Ubuntu 24.04 LTS
   - **Size：** Basic → Regular → **6 美元 / 月**（1 vCPU，1 GB RAM，25 GB SSD）
   - **Authentication：** SSH key（推荐）或 password
4. 点击 **Create Droplet**
5. 记下 IP 地址

## 2）通过 SSH 连接

```bash
ssh root@YOUR_DROPLET_IP
```

## 3）安装 OpenClaw

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# 安装 OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# 验证
openclaw --version
```

## 4）运行新手引导

```bash
openclaw onboard --install-daemon
```

向导会引导你完成以下内容：

- 模型认证（API key 或 OAuth）
- 渠道设置（Telegram、WhatsApp、Discord 等）
- Gateway 网关 token（自动生成）
- 守护进程安装（systemd）

## 5）验证 Gateway 网关

```bash
# 检查状态
openclaw status

# 检查服务
systemctl --user status openclaw-gateway.service

# 查看日志
journalctl --user -u openclaw-gateway.service -f
```

## 6）访问 Dashboard

Gateway 网关默认绑定到 loopback。要访问 Control UI：

**选项 A：SSH 隧道（推荐）**

```bash
# 在你的本地机器上
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# 然后打开：http://localhost:18789
```

**选项 B：Tailscale Serve（HTTPS，仅 loopback）**

```bash
# 在 droplet 上
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# 配置 Gateway 网关使用 Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

打开：`https://<magicdns>/`

说明：

- Serve 会让 Gateway 网关保持仅 loopback，并通过 Tailscale 身份头为 Control UI / WebSocket 流量提供认证（无 token 认证假设 Gateway 网关主机可信；HTTP API 不会使用这些 Tailscale 头，而是遵循 Gateway 网关的常规 HTTP 认证模式）。
- 如果你希望改为要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

**选项 C：Tailnet 绑定（不使用 Serve）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

打开：`http://<tailscale-ip>:18789`（需要 token）。

## 7）连接你的渠道

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# 扫描二维码
```

其他提供商请参见 [Channels](/zh-CN/channels)。

---

## 针对 1 GB RAM 的优化

6 美元的 droplet 只有 1 GB RAM。为了保持运行流畅：

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

所有状态都位于：

- `~/.openclaw/` — `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道 / 提供商状态，以及会话数据
- `~/.openclaw/workspace/` — 工作区（`SOUL.md`、记忆等）

这些内容在重启后仍会保留。请定期备份：

```bash
openclaw backup create
```

---

## Oracle Cloud 免费替代方案

Oracle Cloud 提供 **Always Free** ARM 实例，其性能明显强于这里列出的任何付费选项——而且费用是 0 美元 / 月。

| 你将获得       | 规格                   |
| -------------- | ---------------------- |
| **4 OCPU**     | ARM Ampere A1          |
| **24 GB RAM**  | 远远够用               |
| **200 GB 存储** | 块存储                 |
| **永久免费**   | 不会产生信用卡扣费     |

**注意事项：**

- 注册流程可能比较折腾（如果失败就重试）
- ARM 架构——大多数东西都能运行，但有些二进制程序需要 ARM 构建版本

完整设置指南请参见 [Oracle Cloud](/zh-CN/install/oracle)。有关注册技巧和注册流程故障排除，请参见这篇[社区指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

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
# 检查内存
free -h

# 添加更多 swap
# 或升级到 12 美元 / 月的 droplet（2 GB RAM）
```

---

## 相关内容

- [Hetzner 指南](/zh-CN/install/hetzner) — 更便宜、性能更强
- [Docker 安装](/zh-CN/install/docker) — 容器化设置
- [Tailscale](/zh-CN/gateway/tailscale) — 安全的远程访问
- [配置](/zh-CN/gateway/configuration) — 完整配置参考
