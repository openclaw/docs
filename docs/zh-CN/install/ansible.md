---
read_when:
    - 你想要具备安全加固的自动化服务器部署
    - 你需要防火墙隔离并支持 VPN 访问的设置
    - 你正在部署到远程 Debian/Ubuntu 服务器
summary: 使用 Ansible、Tailscale VPN 和防火墙隔离实现自动化、加固的 OpenClaw 安装
title: Ansible
x-i18n:
    generated_at: "2026-05-06T07:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

使用 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** 将 OpenClaw 部署到生产服务器，这是一款采用安全优先架构的自动化安装器。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 仓库是 Ansible 部署的事实来源。本页是快速概览。
</Info>

## 前提条件

| 要求        | 详情                                                      |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ 或 Ubuntu 20.04+                               |
| **访问权限** | root 或 sudo 权限                                         |
| **网络**    | 用于软件包安装的互联网连接                                |
| **Ansible** | 2.14+（由快速开始脚本自动安装）                           |

## 你将获得什么

- **防火墙优先的安全性** -- UFW + Docker 隔离（仅 SSH + Tailscale 可访问）
- **Tailscale VPN** -- 安全远程访问，无需公开暴露服务
- **Docker** -- 隔离的沙箱容器，仅绑定 localhost
- **纵深防御** -- 4 层安全架构
- **Systemd 集成** -- 开机自动启动并启用加固
- **一条命令完成设置** -- 几分钟内完成部署

## 快速开始

一条命令安装：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 会安装什么

Ansible playbook 会安装并配置：

1. **Tailscale** -- 用于安全远程访问的 mesh VPN
2. **UFW 防火墙** -- 仅开放 SSH + Tailscale 端口
3. **Docker CE + Compose V2** -- 用于默认的智能体沙箱后端
4. **Node.js 24 + pnpm** -- 运行时依赖（Node 22 LTS，目前为 `22.14+`，仍受支持）
5. **OpenClaw** -- 基于主机运行，不进行容器化
6. **Systemd 服务** -- 自动启动并启用安全加固

<Note>
Gateway 网关直接在主机上运行（不在 Docker 中）。智能体沙箱隔离是
可选的；此 playbook 会安装 Docker，因为它是默认沙箱
后端。有关详情和其他后端，请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 安装后设置

<Steps>
  <Step title="切换到 openclaw 用户">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="运行新手引导向导">
    安装后脚本会引导你配置 OpenClaw 设置。
  </Step>
  <Step title="连接消息提供商">
    登录 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="验证安装">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="连接到 Tailscale">
    加入你的 VPN mesh 网络以进行安全远程访问。
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

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## 安全架构

此部署使用 4 层防御模型：

1. **防火墙（UFW）** -- 仅公开暴露 SSH（22）+ Tailscale（41641/udp）
2. **VPN（Tailscale）** -- Gateway 网关只能通过 VPN mesh 网络访问
3. **Docker 隔离** -- DOCKER-USER iptables 链会阻止外部端口暴露
4. **Systemd 加固** -- NoNewPrivileges、PrivateTmp、非特权用户

要验证你的外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

只有端口 22（SSH）应该开放。所有其他服务（Gateway 网关、Docker）都会被锁定。

Docker 用于智能体沙箱（隔离的工具执行），而不是用于运行 Gateway 网关本身。有关沙箱配置，请参阅[多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 手动安装

如果你更希望手动控制自动化流程：

<Steps>
  <Step title="安装前提条件">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="克隆仓库">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="安装 Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="运行 playbook">
    ```bash
    ./run-playbook.sh
    ```

    或者，直接运行，然后再手动执行设置脚本：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安装器会将 OpenClaw 设置为手动更新。标准更新流程请参阅[更新](/zh-CN/install/updating)。

要重新运行 Ansible playbook（例如用于配置变更）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

这是幂等的，可以安全地多次运行。

## 故障排除

<AccordionGroup>
  <Accordion title="防火墙阻止我的连接">
    - 确保你首先可以通过 Tailscale VPN 访问
    - SSH 访问（端口 22）始终允许
    - Gateway 网关按设计只能通过 Tailscale 访问

  </Accordion>
  <Accordion title="服务无法启动">
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
  <Accordion title="Docker 沙箱问题">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="提供商登录失败">
    确保你正以 `openclaw` 用户身份运行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 高级配置

有关详细的安全架构和故障排除，请参阅 openclaw-ansible 仓库：

- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排除指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关内容

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完整部署指南
- [Docker](/zh-CN/install/docker) -- 容器化 Gateway 网关设置
- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 智能体沙箱配置
- [多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体隔离
