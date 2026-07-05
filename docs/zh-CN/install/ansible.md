---
read_when:
    - 你想要带安全加固的自动化服务器部署
    - 你需要采用防火墙隔离的设置，并通过 VPN 访问
    - 你正在部署到远程 Debian/Ubuntu 服务器
summary: 使用 Ansible、Tailscale VPN 和防火墙隔离实现自动化、加固的 OpenClaw 安装
title: Ansible
x-i18n:
    generated_at: "2026-07-05T11:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

使用以安全优先架构设计的自动化安装器 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**，将 OpenClaw 部署到生产服务器。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 仓库是 Ansible 部署的权威来源。本页是快速概览。
</Info>

## 前提条件

| 要求        | 详情                                                   |
| ----------- | --------------------------------------------------------- |
| 操作系统    | Debian 11+ 或 Ubuntu 20.04+                               |
| 访问权限    | Root 或 sudo 权限                                   |
| 网络        | 用于安装软件包的互联网连接              |
| Ansible     | 2.14+（由快速开始脚本自动安装） |

## 你将获得什么

- 防火墙优先的安全性：UFW + Docker 隔离（只有 SSH + Tailscale 可访问）
- Tailscale VPN 用于远程访问，无需公开暴露服务
- Docker 用于带有仅 localhost 绑定的隔离沙箱容器
- 带加固的 systemd 集成，启动时自动运行
- 一条命令完成设置

## 快速开始

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 会安装什么

1. Tailscale（用于安全远程访问的网状 VPN）
2. UFW 防火墙（仅 SSH + Tailscale 端口）
3. Docker CE + Compose V2（默认智能体沙箱后端）
4. Node.js 和 pnpm（OpenClaw 需要 Node 22.19+ 或 23.11+；推荐 Node 24）
5. OpenClaw，以主机方式安装，而不是容器化
6. 带安全加固的 systemd 服务

<Note>
Gateway 网关直接在主机上运行，不在 Docker 中运行。智能体沙箱隔离是
可选的；此 playbook 安装 Docker，因为它是默认沙箱
后端。其他后端请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 安装后设置

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    安装后脚本会引导你完成 OpenClaw 配置。
  </Step>
  <Step title="Connect messaging channels">
    登录 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    加入你的 VPN 网状网络，以便安全远程访问。
  </Step>
</Steps>

### 快速命令

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Channel login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## 安全架构

四层防御模型：

1. 防火墙（UFW）：只有 SSH（22）和 Tailscale（41641/udp）公开暴露
2. VPN（Tailscale）：Gateway 网关只能通过 VPN 网状网络访问
3. Docker 隔离：`DOCKER-USER` iptables 链防止外部端口暴露
4. Systemd 加固：`NoNewPrivileges`、`PrivateTmp`、非特权用户

验证你的外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

只有端口 22（SSH）应处于开放状态。Gateway 网关和 Docker 会保持锁定。

Docker 是为智能体沙箱（隔离的工具执行）安装的，不用于运行 Gateway 网关。沙箱配置请参阅 [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 手动安装

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    或直接运行 playbook，然后手动运行设置脚本：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安装器会为 OpenClaw 设置手动更新；标准流程请参阅 [更新](/zh-CN/install/updating)。

重新运行 playbook（例如，在配置更改后）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

这是幂等的，可以安全地多次运行。

## 故障排查

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - 先通过 Tailscale VPN 连接；Gateway 网关按设计只能通过这种方式访问。
    - SSH（端口 22）始终允许。

  </Accordion>
  <Accordion title="Service will not start">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox issues">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build the sandbox image if missing (requires a source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Channel login fails">
    确保你正以 `openclaw` 用户身份运行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 高级配置

有关详细的安全架构和故障排查，请参阅 openclaw-ansible 仓库：

- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排查指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关内容

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible)：完整部署指南
- [Docker](/zh-CN/install/docker)：容器化 Gateway 网关设置
- [沙箱隔离](/zh-CN/gateway/sandboxing)：智能体沙箱配置
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)：按 Agent 隔离
