---
read_when:
    - 你希望通过自动化部署服务器并进行安全加固
    - 你需要通过防火墙隔离并使用 VPN 访问的部署方式
    - 你正在部署到远程 Debian/Ubuntu 服务器
summary: 使用 Ansible、Tailscale VPN 和防火墙隔离进行自动化加固的 OpenClaw 安装
title: Ansible
x-i18n:
    generated_at: "2026-04-05T08:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Ansible 安装

使用 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** 将 OpenClaw 部署到生产服务器——这是一个以安全为先架构的自动化安装器。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 仓库是 Ansible 部署的事实来源。本页仅为快速概览。
</Info>

## 前置条件

| Requirement | Details |
| ----------- | ------- |
| **OS** | Debian 11+ 或 Ubuntu 20.04+ |
| **Access** | root 或 sudo 权限 |
| **Network** | 用于安装软件包的互联网连接 |
| **Ansible** | 2.14+（由快速开始脚本自动安装） |

## 你将获得什么

- **防火墙优先的安全性** —— UFW + Docker 隔离（仅 SSH + Tailscale 可访问）
- **Tailscale VPN** —— 无需公开暴露服务的安全远程访问
- **Docker** —— 隔离的沙箱容器，仅绑定 localhost
- **纵深防御** —— 4 层安全架构
- **Systemd 集成** —— 启动时自动运行并带有加固措施
- **一条命令完成设置** —— 几分钟内完成部署

## 快速开始

一条命令安装：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 将会安装哪些内容

Ansible playbook 会安装并配置：

1. **Tailscale** —— 用于安全远程访问的 mesh VPN
2. **UFW 防火墙** —— 仅开放 SSH + Tailscale 端口
3. **Docker CE + Compose V2** —— 用于智能体沙箱
4. **Node.js 24 + pnpm** —— 运行时依赖（Node 22 LTS，当前为 `22.14+`，仍受支持）
5. **OpenClaw** —— 基于主机运行，不容器化
6. **Systemd 服务** —— 自动启动并带有安全加固

<Note>
Gateway 网关直接运行在主机上（不是在 Docker 中），但智能体沙箱使用 Docker 进行隔离。详情参见 [沙箱隔离](/gateway/sandboxing)。
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
    加入你的 VPN mesh，以进行安全远程访问。
  </Step>
</Steps>

### 常用命令

```bash
# 检查服务状态
sudo systemctl status openclaw

# 查看实时日志
sudo journalctl -u openclaw -f

# 重启 gateway
sudo systemctl restart openclaw

# 提供商登录（以 openclaw 用户运行）
sudo -i -u openclaw
openclaw channels login
```

## 安全架构

该部署采用 4 层防御模型：

1. **防火墙（UFW）** —— 仅公开暴露 SSH（22）+ Tailscale（41641/udp）
2. **VPN（Tailscale）** —— gateway 仅可通过 VPN mesh 访问
3. **Docker 隔离** —— `DOCKER-USER` iptables 链防止外部端口暴露
4. **Systemd 加固** —— NoNewPrivileges、PrivateTmp、非特权用户

要验证你的外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

应当只开放端口 22（SSH）。其他所有服务（gateway、Docker）都已被锁定。

安装 Docker 是为了智能体沙箱（隔离的工具执行），而不是为了运行 gateway 本身。有关沙箱配置，请参见 [多智能体沙箱和工具](/tools/multi-agent-sandbox-tools)。

## 手动安装

如果你更希望手动控制自动化过程：

<Steps>
  <Step title="安装前置依赖">
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

    或者直接运行，然后手动执行后续设置脚本：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安装器会将 OpenClaw 设置为手动更新。标准更新流程请参见 [更新](/install/updating)。

如需重新运行 Ansible playbook（例如为了应用配置更改）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

这是幂等的，多次运行也是安全的。

## 故障排除

<AccordionGroup>
  <Accordion title="防火墙阻止了我的连接">
    - 先确认你可以通过 Tailscale VPN 访问
    - SSH 访问（端口 22）始终被允许
    - gateway 按设计仅可通过 Tailscale 访问
  </Accordion>
  <Accordion title="服务无法启动">
    ```bash
    # 检查日志
    sudo journalctl -u openclaw -n 100

    # 验证权限
    sudo ls -la /opt/openclaw

    # 测试手动启动
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker 沙箱问题">
    ```bash
    # 验证 Docker 正在运行
    sudo systemctl status docker

    # 检查沙箱镜像
    sudo docker images | grep openclaw-sandbox

    # 如果缺失则构建沙箱镜像
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="提供商登录失败">
    确保你是以 `openclaw` 用户运行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 高级配置

有关详细的安全架构和故障排除，请参见 openclaw-ansible 仓库：

- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排除指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关内容

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) —— 完整部署指南
- [Docker](/install/docker) —— 容器化 gateway 设置
- [沙箱隔离](/gateway/sandboxing) —— 智能体沙箱配置
- [多智能体沙箱和工具](/tools/multi-agent-sandbox-tools) —— 按智能体隔离
