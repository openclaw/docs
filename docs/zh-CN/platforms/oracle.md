---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 为 OpenClaw 寻找低成本 VPS 托管方案
    - 想在一台小型服务器上让 OpenClaw 24/7 运行
summary: Oracle Cloud（Always Free ARM）上的 OpenClaw
title: Oracle Cloud（平台）
x-i18n:
    generated_at: "2026-04-24T03:41:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud（OCI）上的 OpenClaw

## 目标

在 Oracle Cloud 的 **Always Free** ARM 套餐上运行一个持久化的 OpenClaw Gateway 网关。

Oracle 的免费套餐可能非常适合 OpenClaw（尤其是如果你已经有 OCI 账户），但它也有一些权衡：

- ARM 架构（大多数内容都能运行，但某些二进制文件可能仅支持 x86）
- 容量和注册流程可能比较挑剔

## 费用对比（2026）

| 提供商     | 套餐            | 配置                  | 月费 | 说明                 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU，24 GB RAM | $0       | ARM，容量有限 |
| Hetzner      | CX22            | 2 vCPU，4 GB RAM        | ~ $4     | 最便宜的付费选项  |
| DigitalOcean | Basic           | 1 vCPU，1 GB RAM        | $6       | UI 简单，文档完善    |
| Vultr        | Cloud Compute   | 1 vCPU，1 GB RAM        | $6       | 机房位置多        |
| Linode       | Nanode          | 1 vCPU，1 GB RAM        | $5       | 现已并入 Akamai    |

---

## 前提条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)）—— 如果遇到问题，可参考[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（可在 [tailscale.com](https://tailscale.com) 免费注册）
- 约 30 分钟

## 1）创建 OCI 实例

1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)
2. 导航到 **Compute → Instances → Create Instance**
3. 配置：
   - **Name：** `openclaw`
   - **Image：** Ubuntu 24.04（aarch64）
   - **Shape：** `VM.Standard.A1.Flex`（Ampere ARM）
   - **OCPUs：** 2（或最多 4）
   - **Memory：** 12 GB（或最多 24 GB）
   - **Boot volume：** 50 GB（最多可免费使用 200 GB）
   - **SSH key：** 添加你的公钥
4. 点击 **Create**
5. 记下公网 IP 地址

**提示：** 如果实例创建因 “Out of capacity” 失败，请尝试其他可用性域，或稍后重试。免费套餐容量有限。

## 2）连接并更新系统

```bash
# 通过公网 IP 连接
ssh ubuntu@YOUR_PUBLIC_IP

# 更新系统
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意：** 某些依赖在 ARM 上编译时需要 `build-essential`。

## 3）配置用户和主机名

```bash
# 设置主机名
sudo hostnamectl set-hostname openclaw

# 为 ubuntu 用户设置密码
sudo passwd ubuntu

# 启用 lingering（让用户服务在注销后继续运行）
sudo loginctl enable-linger ubuntu
```

## 4）安装 Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

这会启用 Tailscale SSH，因此你可以从 tailnet 上的任意设备通过 `ssh openclaw` 连接 —— 不需要公网 IP。

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

> 注意：如果遇到 ARM 原生构建问题，请先安装系统包（例如 `sudo apt install -y build-essential`），再考虑使用 Homebrew。

## 6）配置 Gateway 网关（loopback + token 认证）并启用 Tailscale Serve

默认使用 token 认证。这样更可预测，也避免了需要在 Control UI 中启用任何 “insecure auth” 标志。

```bash
# 让 Gateway 网关仅在虚拟机内保持私有
openclaw config set gateway.bind loopback

# 为 Gateway 网关 + Control UI 要求认证
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# 通过 Tailscale Serve 暴露（HTTPS + tailnet 访问）
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

这里的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的转发 IP/本地客户端处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置下，Diff 查看器路由仍保持默认拒绝行为：没有转发代理头的原始 `127.0.0.1` 查看器请求可能返回 `Diff not found`。如果你需要附件，请使用 `mode=file` / `mode=both`；如果你需要可分享的查看器链接，请有意启用远程查看器并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传入代理 `baseUrl`）。

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

## 8）锁定 VCN 安全规则

现在一切都已正常运行，可以锁定 VCN，仅允许 Tailscale 流量。OCI 的 Virtual Cloud Network 会在网络边缘充当防火墙 —— 流量会在到达实例之前被拦截。

1. 在 OCI Console 中进入 **Networking → Virtual Cloud Networks**
2. 点击你的 VCN → **Security Lists** → Default Security List
3. **删除**除以下规则外的所有入站规则：
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. 保留默认出站规则（允许所有出站流量）

这样会在网络边缘阻止 22 端口 SSH、HTTP、HTTPS 以及其他所有流量。从现在起，你只能通过 Tailscale 连接。

---

## 访问 Control UI

在你 Tailscale 网络中的任意设备上访问：

```
https://openclaw.<tailnet-name>.ts.net/
```

将 `<tailnet-name>` 替换为你的 tailnet 名称（可在 `tailscale status` 中看到）。

不需要 SSH 隧道。Tailscale 提供：

- HTTPS 加密（自动证书）
- 基于 Tailscale 身份的认证
- 从你的 tailnet 中任意设备访问（笔记本、手机等）

---

## 安全性：VCN + Tailscale（推荐基线）

在 VCN 已锁定（仅开放 UDP 41641）且 Gateway 网关绑定到 loopback 的情况下，你会获得很强的纵深防御：公网流量会在网络边缘被阻止，而管理访问则通过你的 tailnet 进行。

这种设置通常可以消除单纯为了阻止互联网范围 SSH 暴力破解而额外配置主机防火墙规则的_必要性_ —— 但你仍应保持系统更新、运行 `openclaw security audit`，并确认自己没有意外监听公网接口。

### 已经受到保护的项目

| 传统步骤   | 需要吗？     | 原因                                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW 防火墙       | 否          | VCN 会在流量到达实例前先行阻止                                   |
| fail2ban           | 否          | 如果 VCN 已屏蔽 22 端口，就不存在暴力破解                                     |
| sshd 加固     | 否          | Tailscale SSH 不使用 sshd                                               |
| 禁用 root 登录 | 否          | Tailscale 使用的是 Tailscale 身份，而不是系统用户                          |
| 仅 SSH 密钥认证  | 否          | Tailscale 通过你的 tailnet 进行认证                                     |
| IPv6 加固     | 通常不需要 | 取决于你的 VCN/子网设置；请核实实际分配/暴露了什么 |

### 仍然推荐

- **凭证权限：** `chmod 700 ~/.openclaw`
- **安全审计：** `openclaw security audit`
- **系统更新：** 定期运行 `sudo apt update && sudo apt upgrade`
- **监控 Tailscale：** 在 [Tailscale 管理控制台](https://login.tailscale.com/admin)中检查设备

### 验证安全态势

```bash
# 确认没有监听公网端口
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# 验证 Tailscale SSH 已启用
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 可选：完全禁用 sshd
sudo systemctl disable --now ssh
```

---

## 回退方案：SSH 隧道

如果 Tailscale Serve 无法工作，请使用 SSH 隧道：

```bash
# 在你的本地机器上（通过 Tailscale）
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

---

## 故障排除

### 实例创建失败（“Out of capacity”）

免费套餐 ARM 实例很抢手。可以尝试：

- 更换可用性域
- 在非高峰时段重试（清晨）
- 选择实例规格时使用 “Always Free” 筛选器

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

# 如有需要，重启
systemctl --user restart openclaw-gateway.service
```

### ARM 二进制问题

某些工具可能没有 ARM 构建版本。请检查：

```bash
uname -m  # 应显示 aarch64
```

大多数 npm 包都能正常工作。对于二进制文件，请寻找 `linux-arm64` 或 `aarch64` 版本。

---

## 持久化

所有状态都保存在：

- `~/.openclaw/` — `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态以及会话数据
- `~/.openclaw/workspace/` — 工作区（`SOUL.md`、memory、artifacts）

请定期备份：

```bash
openclaw backup create
```

---

## 相关内容

- [Gateway 远程访问](/zh-CN/gateway/remote) — 其他远程访问模式
- [Tailscale 集成](/zh-CN/gateway/tailscale) — 完整的 Tailscale 文档
- [Gateway 网关配置](/zh-CN/gateway/configuration) — 所有配置选项
- [DigitalOcean 指南](/zh-CN/install/digitalocean) — 如果你想要付费但更容易注册的方案
- [Hetzner 指南](/zh-CN/install/hetzner) — 基于 Docker 的替代方案
