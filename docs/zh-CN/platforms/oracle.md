---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 寻找适合 OpenClaw 的低成本 VPS 托管
    - 希望在小型服务器上 24/7 运行 OpenClaw
summary: Oracle Cloud 上的 OpenClaw（Always Free ARM）
title: Oracle Cloud（平台）
x-i18n:
    generated_at: "2026-04-05T08:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud（OCI）上的 OpenClaw

## 目标

在 Oracle Cloud 的 **Always Free** ARM 层级上运行一个持久化的 OpenClaw Gateway 网关。

Oracle 的免费层级可能非常适合 OpenClaw（尤其是如果你已经有 OCI 账号），但它也有一些权衡：

- ARM 架构（大多数东西都能运行，但某些二进制文件可能仅支持 x86）
- 容量和注册流程可能不太稳定

## 费用对比（2026）

| Provider     | 套餐            | 规格                   | 价格/月 | 说明             |
| ------------ | --------------- | ---------------------- | ------- | ---------------- |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU，24 GB RAM | $0      | ARM，容量有限    |
| Hetzner      | CX22            | 2 vCPU，4 GB RAM       | ~ $4    | 最便宜的付费选项 |
| DigitalOcean | Basic           | 1 vCPU，1 GB RAM       | $6      | UI 简单，文档完善 |
| Vultr        | Cloud Compute   | 1 vCPU，1 GB RAM       | $6      | 机房位置多       |
| Linode       | Nanode          | 1 vCPU，1 GB RAM       | $5      | 现已属于 Akamai  |

---

## 前提条件

- Oracle Cloud 账号（[注册](https://www.oracle.com/cloud/free/)）——如果遇到问题，请参见[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账号（可在 [tailscale.com](https://tailscale.com) 免费注册）
- 大约 30 分钟

## 1）创建 OCI 实例

1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)
2. 前往 **Compute → Instances → Create Instance**
3. 配置：
   - **Name：** `openclaw`
   - **Image：** Ubuntu 24.04（aarch64）
   - **Shape：** `VM.Standard.A1.Flex`（Ampere ARM）
   - **OCPUs：** 2（或最多 4）
   - **Memory：** 12 GB（或最多 24 GB）
   - **Boot volume：** 50 GB（最多 200 GB 免费）
   - **SSH key：** 添加你的公钥
4. 点击 **Create**
5. 记下公网 IP 地址

**提示：** 如果实例创建因 “Out of capacity” 失败，请尝试其他可用性域，或稍后重试。免费层级容量有限。

## 2）连接并更新

```bash
# 通过公网 IP 连接
ssh ubuntu@YOUR_PUBLIC_IP

# 更新系统
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意：** `build-essential` 是某些依赖在 ARM 上编译所必需的。

## 3）配置用户和主机名

```bash
# 设置主机名
sudo hostnamectl set-hostname openclaw

# 为 ubuntu 用户设置密码
sudo passwd ubuntu

# 启用 lingering（在登出后保持用户服务继续运行）
sudo loginctl enable-linger ubuntu
```

## 4）安装 Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

这会启用 Tailscale SSH，因此你可以从 tailnet 中的任意设备通过 `ssh openclaw` 连接——不再需要公网 IP。

验证：

```bash
tailscale status
```

**从现在开始，请通过 Tailscale 连接：** `ssh ubuntu@openclaw`（或使用 Tailscale IP）。

## 5）安装 OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

当提示 “How do you want to hatch your bot?” 时，选择 **“Do this later”**。

> 注意：如果你遇到 ARM 原生构建问题，请先安装系统包（例如 `sudo apt install -y build-essential`），再考虑使用 Homebrew。

## 6）配置 Gateway 网关（loopback + token auth）并启用 Tailscale Serve

默认使用 token 认证。这样更可预测，也无需任何 “insecure auth” Control UI 标志。

```bash
# 将 Gateway 网关保留为 VM 内私有
openclaw config set gateway.bind loopback

# 为 Gateway 网关 + Control UI 启用认证
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# 通过 Tailscale Serve 暴露（HTTPS + tailnet 访问）
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

此处的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的 forwarded-IP/local-client 处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在这种设置下，Diffs 查看器路由会保持故障关闭行为：如果原始 `127.0.0.1` 查看器请求没有转发代理头，则可能返回 `Diff not found`。对于附件，请使用 `mode=file` / `mode=both`；如果你需要可分享的查看器链接，请有意启用远程查看器，并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传入代理 `baseUrl`）。

## 7）验证

```bash
# 检查版本
openclaw --version

# 检查守护进程状态
systemctl --user status openclaw-gateway.service

# 检查 Tailscale Serve
tailscale serve status

# 测试本地响应
curl http://localhost:18789
```

## 8）收紧 VCN 安全策略

现在一切已正常运行，请收紧 VCN，仅允许 Tailscale 流量。OCI 的 Virtual Cloud Network 会在网络边界充当防火墙——流量会在到达你的实例之前被阻止。

1. 在 OCI Console 中前往 **Networking → Virtual Cloud Networks**
2. 点击你的 VCN → **Security Lists** → Default Security List
3. **删除**除以下规则外的所有入站规则：
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. 保留默认出站规则（允许所有出站流量）

这会在网络边界阻止 22 端口 SSH、HTTP、HTTPS 以及其他所有流量。从现在开始，你只能通过 Tailscale 连接。

---

## 访问 Control UI

从你的 Tailscale 网络中的任意设备访问：

```
https://openclaw.<tailnet-name>.ts.net/
```

将 `<tailnet-name>` 替换为你的 tailnet 名称（可在 `tailscale status` 中看到）。

无需 SSH 隧道。Tailscale 提供：

- HTTPS 加密（自动证书）
- 基于 Tailscale 身份的认证
- 从 tailnet 中任意设备访问（笔记本、手机等）

---

## 安全：VCN + Tailscale（推荐基线）

当 VCN 已收紧（仅开放 UDP 41641）且 Gateway 网关绑定到 loopback 时，你将获得强大的纵深防御：公网流量会在网络边界被阻止，而管理访问则通过你的 tailnet 完成。

这种设置通常让你**无需**再额外配置基于主机的防火墙规则来阻止来自互联网的大范围 SSH 暴力破解——但你仍应保持操作系统更新、运行 `openclaw security audit`，并确认你没有意外监听在公网接口上。

### 已经受到保护

| 传统步骤         | 是否需要     | 原因                                                                      |
| ---------------- | ------------ | ------------------------------------------------------------------------- |
| UFW firewall     | 否           | VCN 会在流量到达实例前进行阻止                                            |
| fail2ban         | 否           | 如果 VCN 已阻止 22 端口，就不存在暴力破解                                |
| sshd hardening   | 否           | Tailscale SSH 不使用 sshd                                                 |
| Disable root login | 否         | Tailscale 使用的是 Tailscale 身份，而不是系统用户                         |
| SSH key-only auth | 否          | Tailscale 会通过你的 tailnet 完成认证                                     |
| IPv6 hardening   | 通常不需要   | 取决于你的 VCN/子网设置；请验证实际分配和暴露了哪些内容                  |

### 仍然推荐

- **凭证权限：** `chmod 700 ~/.openclaw`
- **安全审计：** `openclaw security audit`
- **系统更新：** 定期运行 `sudo apt update && sudo apt upgrade`
- **监控 Tailscale：** 在 [Tailscale 管理控制台](https://login.tailscale.com/admin) 中检查设备

### 验证安全态势

```bash
# 确认没有公网端口在监听
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# 验证 Tailscale SSH 已激活
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 可选：完全禁用 sshd
sudo systemctl disable --now ssh
```

---

## 备用方案：SSH 隧道

如果 Tailscale Serve 无法正常工作，请使用 SSH 隧道：

```bash
# 在你的本地机器上（通过 Tailscale）
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

---

## 故障排除

### 实例创建失败（“Out of capacity”）

免费层级 ARM 实例很抢手。请尝试：

- 更换可用性域
- 在低峰时段重试（清晨）
- 选择实例规格时使用 “Always Free” 过滤器

### Tailscale 无法连接

```bash
# 检查状态
sudo tailscale status

# 重新认证
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway 网关无法启动

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### 无法访问 Control UI

```bash
# 验证 Tailscale Serve 正在运行
tailscale serve status

# 检查 gateway 是否在监听
curl http://localhost:18789

# 如有需要则重启
systemctl --user restart openclaw-gateway.service
```

### ARM 二进制问题

某些工具可能没有 ARM 构建版本。请检查：

```bash
uname -m  # 应显示 aarch64
```

大多数 npm 包都能正常运行。对于二进制文件，请查找 `linux-arm64` 或 `aarch64` 版本。

---

## 持久化

所有状态都保存在：

- `~/.openclaw/` — `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态以及会话数据
- `~/.openclaw/workspace/` — 工作区（SOUL.md、memory、artifacts）

请定期备份：

```bash
openclaw backup create
```

---

## 另请参见

- [Gateway 远程访问](/gateway/remote) — 其他远程访问模式
- [Tailscale 集成](/gateway/tailscale) — 完整 Tailscale 文档
- [Gateway 网关配置](/gateway/configuration) — 所有配置选项
- [DigitalOcean 指南](/platforms/digitalocean) — 如果你希望使用付费方案 + 更简单的注册流程
- [Hetzner 指南](/install/hetzner) — 基于 Docker 的替代方案
