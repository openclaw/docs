---
read_when:
    - 你想要具備安全強化的自動化伺服器部署
    - 你需要具備 VPN 存取的防火牆隔離設定
    - 您要部署到遠端 Debian/Ubuntu 伺服器
summary: 使用 Ansible、Tailscale VPN 與防火牆隔離進行自動化且強化的 OpenClaw 安裝
title: Ansible
x-i18n:
    generated_at: "2026-07-05T11:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

部署 OpenClaw 到生產伺服器，使用採用安全優先架構的自動化安裝程式 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 儲存庫是 Ansible 部署的權威來源。本頁是快速概覽。
</Info>

## 先決條件

| 要求        | 詳細資訊                                                  |
| ----------- | --------------------------------------------------------- |
| 作業系統    | Debian 11+ 或 Ubuntu 20.04+                               |
| 存取權限    | Root 或 sudo 權限                                         |
| 網路        | 用於套件安裝的網際網路連線                               |
| Ansible     | 2.14+（由快速開始指令碼自動安裝）                         |

## 你會得到什麼

- 防火牆優先的安全性：UFW + Docker 隔離（只有 SSH + Tailscale 可連線）
- Tailscale VPN，用於遠端存取且不公開暴露服務
- Docker，用於具備僅限 localhost 綁定的隔離沙箱容器
- Systemd 整合，含強化設定，開機時自動啟動
- 單一命令設定

## 快速開始

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 會安裝什麼

1. Tailscale（用於安全遠端存取的網狀 VPN）
2. UFW 防火牆（僅 SSH + Tailscale 連接埠）
3. Docker CE + Compose V2（預設代理沙箱後端）
4. Node.js 和 pnpm（OpenClaw 需要 Node 22.19+ 或 23.11+；建議使用 Node 24）
5. OpenClaw，以主機為基礎安裝，而非容器化
6. 具備安全強化的 systemd 服務

<Note>
閘道會直接在主機上執行，而不是在 Docker 中執行。代理沙箱是
選用功能；此 playbook 會安裝 Docker，因為它是預設沙箱
後端。其他後端請參閱[沙箱](/zh-TW/gateway/sandboxing)。
</Note>

## 安裝後設定

<Steps>
  <Step title="切換到 openclaw 使用者">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="執行上線精靈">
    安裝後指令碼會引導你設定 OpenClaw。
  </Step>
  <Step title="連接訊息通道">
    登入 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="驗證安裝">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="連接到 Tailscale">
    加入你的 VPN 網狀網路，以進行安全的遠端存取。
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

## 安全架構

四層防禦模型：

1. 防火牆（UFW）：僅公開暴露 SSH（22）和 Tailscale（41641/udp）
2. VPN（Tailscale）：閘道只能透過 VPN 網狀網路連線
3. Docker 隔離：`DOCKER-USER` iptables 鏈可防止外部連接埠暴露
4. Systemd 強化：`NoNewPrivileges`、`PrivateTmp`、非特權使用者

驗證你的外部攻擊面：

```bash
nmap -p- YOUR_SERVER_IP
```

只有連接埠 22（SSH）應該開啟。閘道和 Docker 會保持鎖定。

Docker 是為代理沙箱（隔離的工具執行）而安裝，不是用來執行閘道。沙箱設定請參閱[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

## 手動安裝

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

    或直接執行 playbook，然後手動執行設定指令碼：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安裝程式會將 OpenClaw 設定為手動更新；標準流程請參閱[更新](/zh-TW/install/updating)。

若要重新執行 playbook（例如，在設定變更後）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

這是冪等的，可安全地執行多次。

## 疑難排解

<AccordionGroup>
  <Accordion title="防火牆阻擋我的連線">
    - 請先透過 Tailscale VPN 連線；依設計，閘道只能用這種方式連線。
    - SSH（連接埠 22）一律允許。

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

    # Build the sandbox image if missing (requires a source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="通道登入失敗">
    確認你是以 `openclaw` 使用者身分執行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 進階設定

如需詳細的安全架構與疑難排解，請參閱 openclaw-ansible 儲存庫：

- [安全架構](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術詳細資訊](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [疑難排解指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相關

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible)：完整部署指南
- [Docker](/zh-TW/install/docker)：容器化閘道設定
- [沙箱](/zh-TW/gateway/sandboxing)：代理沙箱設定
- [多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)：每個代理的隔離
