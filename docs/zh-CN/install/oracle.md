---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 为 OpenClaw 寻找免费的 VPS 托管
    - 想在一台小型服务器上全天候运行 OpenClaw
summary: 在 Oracle Cloud 的 Always Free ARM 层级上托管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-05T16:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

在 Oracle Cloud 的 **Always Free** ARM 层（最高 4 OCPU、24 GB RAM、200 GB 存储）上免费运行一个持久化的 OpenClaw Gateway 网关。

## 前提条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)）——如果遇到问题，请参阅[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（可在 [tailscale.com](https://tailscale.com) 免费注册）
- 一对 SSH 密钥
- 大约 30 分钟

## 设置

<Steps>
  <Step title="Create an OCI instance">
    1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 导航到 **Compute > Instances > Create Instance**。
    3. 配置：
       - **名称：** `openclaw`
       - **镜像：** Ubuntu 24.04 (aarch64)
       - **形状：** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU：** 2（或最高 4）
       - **内存：** 12 GB（或最高 24 GB）
       - **启动卷：** 50 GB（最高 200 GB 免费）
       - **SSH 密钥：** 添加你的公钥
    4. 点击 **Create** 并记下公网 IP 地址。

    <Tip>
    如果创建实例失败并显示 “Out of capacity”，请尝试不同的可用性域，或稍后重试。免费层容量有限。
    </Tip>

  </Step>

  <Step title="Connect and update the system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    ARM 编译某些依赖项需要 `build-essential`。

  </Step>

  <Step title="Configure user and hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    启用 linger 可在退出登录后继续运行用户服务。

  </Step>

  <Step title="Install Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    从现在开始，通过 Tailscale 连接：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    当提示 “How do you want to hatch your bot?” 时，选择 **Do this later**。

  </Step>

  <Step title="Configure the gateway">
    将令牌认证与 Tailscale Serve 配合使用，以获得安全的远程访问。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    这里的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的转发 IP/本地客户端处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置中，Diff 查看器路由会保持失败关闭行为：没有转发代理标头的原始 `127.0.0.1` 查看器请求可能返回 `Diff not found`。附件请使用 `mode=file` / `mode=both`，如果你需要可共享的查看器链接，请有意启用远程查看器并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传入代理 `baseUrl`）。

  </Step>

  <Step title="Lock down VCN security">
    在网络边界阻止除 Tailscale 之外的所有流量：

    1. 在 OCI Console 中进入 **Networking > Virtual Cloud Networks**。
    2. 点击你的 VCN，然后点击 **Security Lists > Default Security List**。
    3. **移除**除 `0.0.0.0/0 UDP 41641`（Tailscale）之外的所有入站规则。
    4. 保留默认出站规则（允许所有出站流量）。

    这会在网络边界阻止 22 端口上的 SSH、HTTP、HTTPS 以及其他所有流量。从此以后，你只能通过 Tailscale 连接。

  </Step>

  <Step title="Verify">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    从 tailnet 上的任意设备访问控制 UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    将 `<tailnet-name>` 替换为你的 tailnet 名称（可在 `tailscale status` 中看到）。

  </Step>
</Steps>

## 验证安全姿态

在 VCN 已锁定（仅开放 UDP 41641）且 Gateway 网关绑定到 loopback 的情况下，公网流量会在网络边界被阻止，管理员访问仅限 tailnet。这消除了若干传统 VPS 加固步骤的必要性：

| 传统步骤           | 是否需要？   | 原因                                                                       |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW 防火墙         | 否          | VCN 会在流量到达实例之前阻止它。                    |
| fail2ban           | 否          | 22 端口在 VCN 处被阻止；没有暴力破解暴露面。                    |
| sshd 加固          | 否          | Tailscale SSH 不使用 sshd。                                          |
| 禁用 root 登录     | 否          | Tailscale 按 tailnet 身份进行认证，而不是系统用户。            |
| 仅 SSH 密钥认证    | 否          | 同理——tailnet 身份取代系统 SSH 密钥。                         |
| IPv6 加固          | 通常不需要 | 取决于 VCN/子网设置；请验证实际分配/暴露的内容。 |

仍然建议：

- 使用 `chmod 700 ~/.openclaw` 限制凭证文件权限。
- 使用 `openclaw security audit` 执行 OpenClaw 专用的安全姿态检查。
- 定期运行 `sudo apt update && sudo apt upgrade` 以应用操作系统补丁。
- 定期查看 [Tailscale 管理控制台](https://login.tailscale.com/admin)中的设备。

快速验证命令：

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM 注意事项

Always Free 层是 ARM（`aarch64`）。大多数 OpenClaw 功能都能正常工作；少量原生二进制文件需要 ARM 构建：

- Node.js、Telegram、WhatsApp（Baileys）：纯 JavaScript，没有问题。
- 大多数包含原生代码的 npm 包：有可用的预构建 `linux-arm64` 构件。
- 可选 CLI 辅助工具（例如 Skills 随附的 Go/Rust 二进制文件）：安装前检查是否有 `aarch64` / `linux-arm64` 发布版本。

使用 `uname -m` 验证架构（应输出 `aarch64`）。对于没有 ARM 构建的二进制文件，请从源码安装或跳过。

## 持久化和备份

OpenClaw 状态位于：

- `~/.openclaw/` —— `openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态以及会话数据。
- `~/.openclaw/workspace/` —— Agent 工作区（SOUL.md、记忆、构件）。

这些内容会在重启后保留。要创建可移植快照：

```bash
openclaw backup create
```

## 回退方案：SSH 隧道

如果 Tailscale Serve 无法工作，请从你的本地机器使用 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

## 故障排除

**实例创建失败（“Out of capacity”）**——免费层 ARM 实例很受欢迎。请尝试不同的可用性域，或在非高峰时段重试。

**Tailscale 无法连接**——运行 `sudo tailscale up --ssh --hostname=openclaw --reset` 重新认证。

**Gateway 网关无法启动**——运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 查看日志。

**ARM 二进制文件问题**——大多数 npm 包可在 ARM64 上工作。对于原生二进制文件，请查找 `linux-arm64` 或 `aarch64` 发布版本。使用 `uname -m` 验证架构。

## 后续步骤

- [渠道](/zh-CN/channels)——连接 Telegram、WhatsApp、Discord 等
- [Gateway 网关配置](/zh-CN/gateway/configuration)——所有配置选项
- [更新](/zh-CN/install/updating)——让 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [GCP](/zh-CN/install/gcp)
- [VPS 托管](/zh-CN/vps)
