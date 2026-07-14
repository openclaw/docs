---
read_when:
    - 你希望实现具备安全加固的自动化服务器部署
    - 你需要具备 VPN 访问能力的防火墙隔离设置
    - 你正在部署到远程 Debian/Ubuntu 服务器
summary: 使用 Ansible、Tailscale VPN 和防火墙隔离，实现自动化、强化安全的 OpenClaw 安装
title: Ansible
x-i18n:
    generated_at: "2026-07-14T13:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

使用以安全为先的自动化安装程序 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**，将 OpenClaw 部署到生产服务器。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 仓库是 Ansible 部署的权威来源。本页提供快速概览。
</Info>

## 前置要求

| 要求        | 详情                                                      |
| ----------- | --------------------------------------------------------- |
| 操作系统    | Debian 11+ 或 Ubuntu 20.04+                               |
| 访问权限    | root 或 sudo 权限                                         |
| 网络        | 用于安装软件包的互联网连接                                |
| Ansible     | 2.14+（由快速开始脚本自动安装）                           |

## 你将获得

- 防火墙优先的安全防护：UFW + Docker 隔离（仅可访问 SSH + Tailscale）
- 使用 Tailscale VPN 进行远程访问，无需将服务公开暴露
- 使用 Docker 提供隔离的沙箱容器，并仅绑定到 localhost
- 集成经过安全加固的 systemd，开机时自动启动
- 一条命令完成设置

## 快速开始

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 安装内容

1. Tailscale（用于安全远程访问的网状 VPN）
2. UFW 防火墙（仅开放 SSH + Tailscale 端口）
3. Docker CE + Compose V2（默认智能体沙箱后端）
4. Node.js 和 pnpm（OpenClaw 要求 Node 22.22.3+、24.15+ 或 25.9+；推荐使用 Node 24）
5. OpenClaw，基于主机安装，不使用容器
6. 经过安全加固的 systemd 服务

<Note>
Gateway 网关直接在主机上运行，而不是在 Docker 中运行。智能体沙箱隔离是可选的；此 playbook 会安装 Docker，因为它是默认沙箱后端。有关其他后端，请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 安装后设置

<Steps>
  <Step title="切换到 openclaw 用户">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="运行新手引导向导">
    安装后脚本会引导你完成 OpenClaw 配置。
  </Step>
  <Step title="连接消息渠道">
    登录 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="验证安装">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="连接到 Tailscale">
    加入你的 VPN 网状网络，以进行安全的远程访问。
  </Step>
</Steps>

### 常用命令

```bash
# 检查服务状态
sudo systemctl status openclaw

# 查看实时日志
sudo journalctl -u openclaw -f

# 重启 Gateway 网关
sudo systemctl restart openclaw

# 渠道登录（以 openclaw 用户身份运行）
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## 安全架构

四层防御模型：

1. 防火墙（UFW）：仅将 SSH (22) 和 Tailscale (41641/udp) 公开暴露
2. VPN（Tailscale）：Gateway 网关仅可通过 VPN 网状网络访问
3. Docker 隔离：`DOCKER-USER` iptables 链可防止端口暴露到外部
4. Systemd 安全加固：`NoNewPrivileges`、`PrivateTmp`、非特权用户

验证你的外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

应该只有端口 22 (SSH) 处于开放状态。Gateway 网关和 Docker 均保持封闭。

安装 Docker 是为了提供智能体沙箱（隔离执行工具），而不是用于运行 Gateway 网关。有关沙箱配置，请参阅[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 手动安装

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
  <Step title="安装 Ansible 集合">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="运行 playbook">
    ```bash
    ./run-playbook.sh
    ```

    或者直接运行 playbook，然后手动运行设置脚本：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # 然后运行：/tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安装程序会将 OpenClaw 配置为手动更新；有关标准流程，请参阅[更新](/zh-CN/install/updating)。

要重新运行 playbook（例如，在更改配置后）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

此操作具有幂等性，可安全地多次运行。

## 故障排除

<AccordionGroup>
  <Accordion title="防火墙阻止了我的连接">
    - 请先通过 Tailscale VPN 连接；按照设计，Gateway 网关只能通过这种方式访问。
    - 始终允许 SSH（端口 22）。

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
    # 验证 Docker 是否正在运行
    sudo systemctl status docker

    # 检查沙箱镜像
    sudo docker images | grep openclaw-sandbox

    # 如果缺少沙箱镜像，则构建该镜像（需要源代码检出）
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # 对于没有源代码检出的 npm 安装，请参阅
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="渠道登录失败">
    确保你以 `openclaw` 用户身份运行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 高级配置

有关详细的安全架构和故障排除信息，请参阅 openclaw-ansible 仓库：

- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排除指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关内容

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible)：完整部署指南
- [Docker](/zh-CN/install/docker)：容器化 Gateway 网关设置
- [沙箱隔离](/zh-CN/gateway/sandboxing)：智能体沙箱配置
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)：按 Agent 隔离
