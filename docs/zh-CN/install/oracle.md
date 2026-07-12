---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 寻找用于 OpenClaw 的免费 VPS 托管服务
    - 想在小型服务器上全天候运行 OpenClaw
summary: 在 Oracle Cloud 的永久免费 ARM 套餐上托管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-11T20:37:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

在 Oracle Cloud 的 **Always Free** ARM 层级（最多 4 个 OCPU、24 GB 内存、200 GB 存储空间）上免费运行持久化的 OpenClaw Gateway 网关。

## 前置条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)）——如果遇到问题，请参阅[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（可在 [tailscale.com](https://tailscale.com) 免费注册）
- 一对 SSH 密钥
- 大约 30 分钟

## 设置

<Steps>
  <Step title="创建 OCI 实例">
    1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 前往 **Compute > Instances > Create Instance**。
    3. 配置：
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPUs:** 2（最多可设为 4）
       - **Memory:** 12 GB（最多可设为 24 GB）
       - **Boot volume:** 50 GB（免费额度最多 200 GB）
       - **SSH key:** 添加你的公钥
    4. 点击 **Create**，并记下公网 IP 地址。

    <Tip>
    如果创建实例时出现“Out of capacity”错误，请尝试其他可用性域或稍后重试。免费层级容量有限。
    </Tip>

  </Step>

  <Step title="连接并更新系统">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    部分依赖项需要使用 `build-essential` 在 ARM 上进行编译。

  </Step>

  <Step title="配置用户和主机名">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    启用 linger 后，用户服务会在注销后继续运行。

  </Step>

  <Step title="安装 Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    此后通过 Tailscale 连接：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    出现“How do you want to hatch your bot?”提示时，选择 **Do this later**。

  </Step>

  <Step title="配置 Gateway 网关">
    结合 Tailscale Serve 使用令牌身份验证，以实现安全的远程访问。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    此处的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理对转发 IP 和本地客户端的处理。它**并非** `gateway.auth.mode: "trusted-proxy"`。在此设置中，差异查看器路由仍保持故障关闭行为：未携带代理转发标头、直接来自 `127.0.0.1` 的查看器请求会返回 `Diff not found`。对于附件，请使用 `mode=file` / `mode=both`；如果需要可共享的查看器链接，请有意启用远程查看器并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或向代理传递 `baseUrl`）。

  </Step>

  <Step title="锁定 VCN 安全设置">
    在网络边缘阻止除 Tailscale 之外的所有流量：

    1. 在 OCI Console 中前往 **Networking > Virtual Cloud Networks**。
    2. 点击你的 VCN，然后前往 **Security Lists > Default Security List**。
    3. **移除**除 `0.0.0.0/0 UDP 41641`（Tailscale）之外的所有入站规则。
    4. 保留默认出站规则（允许所有出站流量）。

    这会在网络边缘阻止 22 端口上的 SSH、HTTP、HTTPS 以及其他所有流量。此后只能通过 Tailscale 连接。

  </Step>

  <Step title="验证">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    从 tailnet 中的任何设备访问 Control UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    将 `<tailnet-name>` 替换为你的 tailnet 名称（可在 `tailscale status` 中查看）。

  </Step>
</Steps>

## 验证安全态势

锁定 VCN（仅开放 UDP 41641）并将 Gateway 网关绑定到环回地址后，公网流量会在网络边缘被阻止，管理访问也仅限 tailnet。这样便无需执行多项传统的 VPS 安全加固步骤：

| 传统步骤           | 是否需要？ | 原因                                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW 防火墙         | 否          | VCN 会在流量到达实例之前将其阻止。                                        |
| fail2ban           | 否          | VCN 已阻止 22 端口，不存在暴力破解攻击面。                                |
| sshd 加固          | 否          | Tailscale SSH 不使用 sshd。                                                |
| 禁用 root 登录     | 否          | Tailscale 按 tailnet 身份进行身份验证，而非系统用户。                      |
| 仅使用 SSH 密钥验证 | 否          | 同理——tailnet 身份取代了系统 SSH 密钥。                                   |
| IPv6 加固          | 通常不需要  | 取决于 VCN/子网设置；请验证实际分配和暴露的内容。                          |

仍建议执行以下操作：

- 运行 `chmod 700 ~/.openclaw`，限制凭据文件的权限。
- 运行 `openclaw security audit`，执行 OpenClaw 专属的安全态势检查。
- 定期运行 `sudo apt update && sudo apt upgrade`，安装操作系统补丁。
- 定期在 [Tailscale admin console](https://login.tailscale.com/admin) 中检查设备。

快速验证命令：

```bash
# 确认没有监听公网端口
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# 验证 Tailscale SSH 已启用
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 可选：确认 Tailscale SSH 正常工作后，完全禁用 sshd
sudo systemctl disable --now ssh
```

## ARM 说明

Always Free 层级使用 ARM（`aarch64`）。大多数 OpenClaw 功能均可正常工作；少量原生二进制文件需要 ARM 构建版本：

- Node.js、Telegram、WhatsApp（Baileys）：纯 JavaScript，没有问题。
- 大多数包含原生代码的 npm 软件包：提供预构建的 `linux-arm64` 构件。
- 可选 CLI 辅助工具（例如由 Skills 分发的 Go/Rust 二进制文件）：安装前请检查是否提供 `aarch64` / `linux-arm64` 版本。

使用 `uname -m` 验证架构（应输出 `aarch64`）。对于没有 ARM 构建版本的二进制文件，请从源代码安装或跳过。

## 持久化和备份

OpenClaw 状态存储在以下位置：

- `~/.openclaw/`——`openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态以及会话数据。
- `~/.openclaw/workspace/`——智能体工作区（SOUL.md、记忆、构件）。

这些内容在重启后仍会保留。要创建可移植快照，请运行：

```bash
openclaw backup create
```

## 后备方案：SSH 隧道

如果 Tailscale Serve 无法正常工作，请从本地计算机建立 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

## 故障排查

**实例创建失败（“Out of capacity”）**——免费层级的 ARM 实例非常受欢迎。请尝试其他可用性域，或在非高峰时段重试。

**Tailscale 无法连接**——运行 `sudo tailscale up --ssh --hostname=openclaw --reset` 重新进行身份验证。

**Gateway 网关无法启动**——运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**ARM 二进制文件问题**——大多数 npm 软件包都能在 ARM64 上运行。对于原生二进制文件，请查找 `linux-arm64` 或 `aarch64` 版本。使用 `uname -m` 验证架构。

## 后续步骤

- [渠道](/zh-CN/channels)——连接 Telegram、WhatsApp、Discord 等服务
- [Gateway 配置](/zh-CN/gateway/configuration)——所有配置选项
- [更新](/zh-CN/install/updating)——让 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [GCP](/zh-CN/install/gcp)
- [VPS 托管](/zh-CN/vps)
