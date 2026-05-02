---
read_when:
    - 您想要具備安全強化的自動化伺服器部署
    - 你需要具備 VPN 存取權的防火牆隔離設定
    - 你正在部署到遠端 Debian/Ubuntu 伺服器
summary: 使用 Ansible、Tailscale VPN 與防火牆隔離的自動化安全強化 OpenClaw 安裝
title: Ansible
x-i18n:
    generated_at: "2026-05-02T02:53:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# Ansible 安裝

使用 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** 將 OpenClaw 部署到正式環境伺服器 -- 這是一個採用安全優先架構的自動化安裝程式。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 儲存庫是 Ansible 部署的真實來源。本頁是快速概覽。
</Info>

## 先決條件

| 需求        | 詳細資訊                                                  |
| ----------- | --------------------------------------------------------- |
| **作業系統** | Debian 11+ 或 Ubuntu 20.04+                               |
| **存取權限** | Root 或 sudo 權限                                         |
| **網路**     | 用於套件安裝的網際網路連線                                |
| **Ansible** | 2.14+（由快速開始指令碼自動安裝）                         |

## 你會取得什麼

- **防火牆優先的安全性** -- UFW + Docker 隔離（僅可存取 SSH + Tailscale）
- **Tailscale VPN** -- 不公開暴露服務的安全遠端存取
- **Docker** -- 隔離的沙箱容器，僅限 localhost 綁定
- **深度防禦** -- 4 層安全架構
- **Systemd 整合** -- 開機自動啟動並強化安全性
- **單一指令設定** -- 幾分鐘內完成部署

## 快速開始

單一指令安裝：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 會安裝什麼

Ansible playbook 會安裝並設定：

1. **Tailscale** -- 用於安全遠端存取的網狀 VPN
2. **UFW 防火牆** -- 僅開放 SSH + Tailscale 連接埠
3. **Docker CE + Compose V2** -- 用於預設代理沙箱後端
4. **Node.js 24 + pnpm** -- 執行階段相依項（Node 22 LTS，目前為 `22.14+`，仍受支援）
5. **OpenClaw** -- 以主機為基礎，不容器化
6. **Systemd 服務** -- 自動啟動並強化安全性

<Note>
Gateway 直接在主機上執行（不在 Docker 中）。代理沙箱化是選用的；此 playbook 會安裝 Docker，因為它是預設沙箱後端。詳情與其他後端請參閱[沙箱化](/zh-TW/gateway/sandboxing)。
</Note>

## 安裝後設定

<Steps>
  <Step title="切換到 openclaw 使用者">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="執行導覽精靈">
    安裝後指令碼會引導你設定 OpenClaw 設定。
  </Step>
  <Step title="連接訊息提供者">
    登入 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="驗證安裝">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="連接到 Tailscale">
    加入你的 VPN 網狀網路以進行安全遠端存取。
  </Step>
</Steps>

### 快速指令

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

## 安全架構

此部署使用 4 層防禦模型：

1. **防火牆 (UFW)** -- 僅公開暴露 SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway 僅可透過 VPN 網狀網路存取
3. **Docker 隔離** -- DOCKER-USER iptables 鏈會防止外部連接埠暴露
4. **Systemd 強化** -- NoNewPrivileges、PrivateTmp、非特權使用者

若要驗證你的外部攻擊面：

```bash
nmap -p- YOUR_SERVER_IP
```

只有連接埠 22 (SSH) 應該開啟。所有其他服務（Gateway、Docker）都會被鎖定。

Docker 是為代理沙箱（隔離工具執行）而安裝，不是為了執行 Gateway 本身。沙箱設定請參閱[多代理沙箱和工具](/zh-TW/tools/multi-agent-sandbox-tools)。

## 手動安裝

如果你偏好手動控制自動化流程：

<Steps>
  <Step title="安裝先決條件">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="複製儲存庫">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="安裝 Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="執行 playbook">
    ```bash
    ./run-playbook.sh
    ```

    或者，直接執行，然後在之後手動執行設定指令碼：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安裝程式會將 OpenClaw 設定為手動更新。標準更新流程請參閱[更新](/zh-TW/install/updating)。

若要重新執行 Ansible playbook（例如因為設定變更）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

這是等冪的，且可安全執行多次。

## 疑難排解

<AccordionGroup>
  <Accordion title="防火牆封鎖我的連線">
    - 確認你可以先透過 Tailscale VPN 存取
    - SSH 存取（連接埠 22）一律允許
    - Gateway 依設計僅可透過 Tailscale 存取

  </Accordion>
  <Accordion title="服務無法啟動">
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
  <Accordion title="Docker 沙箱問題">
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
  <Accordion title="提供者登入失敗">
    請確認你是以 `openclaw` 使用者執行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 進階設定

如需詳細的安全架構與疑難排解，請參閱 openclaw-ansible 儲存庫：

- [安全架構](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術詳細資訊](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [疑難排解指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相關

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完整部署指南
- [Docker](/zh-TW/install/docker) -- 容器化 Gateway 設定
- [沙箱化](/zh-TW/gateway/sandboxing) -- 代理沙箱設定
- [多代理沙箱和工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理的隔離
