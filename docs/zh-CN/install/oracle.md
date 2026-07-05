---
read_when:
    - 在 Oracle Cloud 上设置 OpenClaw
    - 寻找用于 OpenClaw 的免费 VPS 托管
    - 想在小型服务器上 24/7 运行 OpenClaw
summary: 在 Oracle Cloud 的 Always Free ARM 层上托管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-05T11:25:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

在 Oracle Cloud 的 **Always Free** ARM 层（最高 4 OCPU、24 GB RAM、200 GB 存储）上免费运行持久化的 OpenClaw Gateway 网关。

## 前提条件

- Oracle Cloud 账号（[注册](https://www.oracle.com/cloud/free/)）-- 如果遇到问题，请参阅[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账号（可在 [tailscale.com](https://tailscale.com) 免费注册）
- 一对 SSH 密钥
- 大约 30 分钟

## 设置

<Steps>
  <Step title="创建 OCI 实例">
    1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 前往 **Compute > Instances > Create Instance**。
    3. 配置：
       - **名称：** `openclaw`
       - **镜像：** Ubuntu 24.04 (aarch64)
       - **Shape：** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPUs：** 2（或最高 4）
       - **内存：** 12 GB（或最高 24 GB）
       - **启动卷：** 50 GB（免费最高 200 GB）
       - **SSH 密钥：** 添加你的公钥
    4. 点击 **Create**，并记下公网 IP 地址。

    <Tip>
    如果实例创建失败并显示 “Out of capacity”，请尝试不同的可用性域，或稍后重试。免费层容量有限。
    </Tip>

  </Step>

  <Step title="连接并更新系统">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    某些依赖项需要 `build-essential` 才能在 ARM 上编译。

  </Step>

  <Step title="配置用户和主机名">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    启用 linger 可让用户服务在注销后继续运行。

  </Step>

  <Step title="安装 Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    从现在开始，通过 Tailscale 连接：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    当提示 “How do you want to hatch your bot?” 时，选择 **Do this later**。

  </Step>

  <Step title="配置 Gateway 网关">
    使用 token 认证配合 Tailscale Serve，实现安全的远程访问。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    这里的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的转发 IP / 本地客户端处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置中，Diff viewer 路由保持 fail-closed 行为：没有转发代理标头的原始 `127.0.0.1` viewer 请求会返回 `Diff not found`。对于附件，请使用 `mode=file` / `mode=both`；如果你需要可分享的 viewer 链接，请有意启用远程 viewers 并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传入代理 `baseUrl`）。

  </Step>

  <Step title="锁定 VCN 安全">
    在网络边缘阻止除 Tailscale 外的所有流量：

    1. 在 OCI Console 中前往 **Networking > Virtual Cloud Networks**。
    2. 点击你的 VCN，然后点击 **Security Lists > Default Security List**。
    3. **移除**除 `0.0.0.0/0 UDP 41641`（Tailscale）之外的所有入站规则。
    4. 保留默认出站规则（允许所有出站流量）。

    这会在网络边缘阻止端口 22 上的 SSH、HTTP、HTTPS 以及其他所有流量。从此之后，你只能通过 Tailscale 连接。

  </Step>

  <Step title="验证">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    从你的 tailnet 上的任何设备访问 Control UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    将 `<tailnet-name>` 替换为你的 tailnet 名称（可在 `tailscale status` 中看到）。

  </Step>
</Steps>

## 验证安全态势

当 VCN 已锁定（仅开放 UDP 41641）且 Gateway 网关绑定到 loopback 时，公共流量会在网络边缘被阻止，管理员访问仅限 tailnet。这样就不需要若干传统 VPS 加固步骤：

| 传统步骤           | 是否需要？   | 原因                                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW 防火墙         | 否          | VCN 会在流量到达实例前将其阻止。                                          |
| fail2ban           | 否          | 端口 22 在 VCN 处被阻止；没有暴力破解暴露面。                             |
| sshd 加固          | 否          | Tailscale SSH 不使用 sshd。                                               |
| 禁用 root 登录     | 否          | Tailscale 通过 tailnet 身份认证，而不是系统用户。                         |
| 仅 SSH 密钥认证    | 否          | 同理 -- tailnet 身份会取代系统 SSH 密钥。                                 |
| IPv6 加固          | 通常不需要  | 取决于 VCN / 子网设置；请验证实际分配和暴露的内容。                       |

仍然建议：

- `chmod 700 ~/.openclaw`，以限制凭证文件权限。
- `openclaw security audit`，用于 OpenClaw 专用态势检查。
- 定期运行 `sudo apt update && sudo apt upgrade`，以安装 OS 补丁。
- 定期在 [Tailscale 管理控制台](https://login.tailscale.com/admin) 中检查设备。

快速验证命令：

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM 说明

Always Free 层是 ARM（`aarch64`）。大多数 OpenClaw 功能都能正常工作；少数原生二进制文件需要 ARM 构建：

- Node.js、Telegram、WhatsApp（Baileys）：纯 JavaScript，没有问题。
- 大多数包含原生代码的 npm 包：有可用的预构建 `linux-arm64` 构件。
- 可选 CLI 助手（例如 Skills 附带的 Go / Rust 二进制文件）：安装前检查是否有 `aarch64` / `linux-arm64` 版本。

使用 `uname -m` 验证架构（应输出 `aarch64`）。对于没有 ARM 构建的二进制文件，请从源码安装或跳过。

## 持久化和备份

OpenClaw 状态位于：

- `~/.openclaw/` -- `openclaw.json`、每个 agent 的 `auth-profiles.json`、channel / provider 状态以及 session 数据。
- `~/.openclaw/workspace/` -- agent 工作区（SOUL.md、memory、artifacts）。

这些内容会在重启后保留。创建可移植快照：

```bash
openclaw backup create
```

## 回退方案：SSH 隧道

如果 Tailscale Serve 无法工作，请从你的本地机器使用 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

## 故障排查

**实例创建失败（“Out of capacity”）** -- 免费层 ARM 实例很受欢迎。请尝试不同的可用性域，或在非高峰时段重试。

**Tailscale 无法连接** -- 运行 `sudo tailscale up --ssh --hostname=openclaw --reset` 重新认证。

**Gateway 网关无法启动** -- 运行 `openclaw doctor --non-interactive`，并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**ARM 二进制文件问题** -- 大多数 npm 包都能在 ARM64 上工作。对于原生二进制文件，请查找 `linux-arm64` 或 `aarch64` 版本。使用 `uname -m` 验证架构。

## 后续步骤

- [渠道](/zh-CN/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/zh-CN/gateway/configuration) -- 所有配置选项
- [更新](/zh-CN/install/updating) -- 让 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [GCP](/zh-CN/install/gcp)
- [VPS 托管](/zh-CN/vps)
