---
read_when:
    - 你想要经过安全加固的自动化服务器部署
    - 你需要防火墙隔离且支持 VPN 访问的设置
    - 你正在部署到远程 Debian/Ubuntu 服务器
summary: 通过 Ansible、Tailscale VPN 和防火墙隔离实现自动化、加固的 OpenClaw 安装
title: Ansible
x-i18n:
    generated_at: "2026-04-28T11:56:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Ansible 安装

使用 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** 将 OpenClaw 部署到生产服务器，这是一个采用安全优先架构的自动化安装程序。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 仓库是 Ansible 部署的事实来源。本页是快速概览。
</Info>

## 前提条件

| 要求        | 详细信息                                                   |
| ----------- | --------------------------------------------------------- |
| **操作系统** | Debian 11+ 或 Ubuntu 20.04+                               |
| **访问权限** | Root 或 sudo 权限                                         |
| **网络**    | 用于安装软件包的互联网连接                                |
| **Ansible** | 2.14+（由快速开始脚本自动安装）                            |

## 你将获得

- **防火墙优先的安全性** -- UFW + Docker 隔离（仅 SSH + Tailscale 可访问）
- **Tailscale VPN** -- 安全远程访问，无需公开暴露服务
- **Docker** -- 隔离的沙箱容器，仅绑定 localhost
- **纵深防御** -- 四层安全架构
- **Systemd 集成** -- 开机自动启动并启用加固
- **一条命令完成设置** -- 数分钟内部署完成

## 快速开始

一条命令安装：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 安装内容

Ansible playbook 会安装并配置：

1. **Tailscale** -- 用于安全远程访问的网状 VPN
2. **UFW 防火墙** -- 仅开放 SSH + Tailscale 端口
3. **Docker CE + Compose V2** -- 用于默认智能体沙箱后端
4. **Node.js 24 + pnpm** -- 运行时依赖（Node 22 LTS，目前为 `22.14+`，仍受支持）
5. **OpenClaw** -- 基于宿主机运行，非容器化
6. **Systemd 服务** -- 自动启动并启用安全加固

<Note>
Gateway 网关直接在宿主机上运行（不在 Docker 中）。智能体沙箱隔离是可选的；此 playbook 会安装 Docker，因为它是默认沙箱后端。详情和其他后端请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 安装后设置

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    安装后脚本会引导你配置 OpenClaw 设置。
  </Step>
  <Step title="Connect messaging providers">
    登录 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    加入你的 VPN mesh，以便安全远程访问。
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

该部署使用四层防御模型：

1. **防火墙（UFW）** -- 仅公开暴露 SSH（22）+ Tailscale（41641/udp）
2. **VPN（Tailscale）** -- Gateway 网关只能通过 VPN mesh 访问
3. **Docker 隔离** -- DOCKER-USER iptables 链会阻止外部端口暴露
4. **Systemd 加固** -- NoNewPrivileges、PrivateTmp、非特权用户

要验证你的外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

只有端口 22（SSH）应处于开放状态。所有其他服务（Gateway 网关、Docker）都会被锁定。

Docker 用于智能体沙箱（隔离的工具执行），而不是用于运行 Gateway 网关本身。有关沙箱配置，请参阅 [多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 手动安装

如果你希望手动控制自动化流程：

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

    或者，也可以直接运行，然后手动执行设置脚本：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安装程序会将 OpenClaw 设置为手动更新。标准更新流程请参阅 [更新](/zh-CN/install/updating)。

要重新运行 Ansible playbook（例如用于配置更改）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

该操作是幂等的，可以安全地运行多次。

## 故障排除

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - 确保你可以先通过 Tailscale VPN 访问
    - SSH 访问（端口 22）始终允许
    - Gateway 网关按设计只能通过 Tailscale 访问

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

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Provider login fails">
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
