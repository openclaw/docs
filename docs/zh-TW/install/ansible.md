---
read_when:
    - 你想要具備安全強化措施的自動化伺服器部署
    - 你需要具備 VPN 存取能力且有防火牆隔離的設定
    - 你正在部署到遠端 Debian/Ubuntu 伺服器
summary: 使用 Ansible、Tailscale VPN 與防火牆隔離，自動化且強化安全性的 OpenClaw 安裝方式
title: Ansible
x-i18n:
    generated_at: "2026-07-14T13:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

使用以安全性為優先架構的自動化安裝程式 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**，將 OpenClaw 部署到正式環境伺服器。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 儲存庫是 Ansible 部署的權威來源。本頁提供快速概覽。
</Info>

## 必要條件

| 需求        | 詳細資訊                                                  |
| ----------- | --------------------------------------------------------- |
| 作業系統    | Debian 11+ 或 Ubuntu 20.04+                               |
| 存取權限    | Root 或 sudo 權限                                         |
| 網路        | 用於安裝套件的網際網路連線                                |
| Ansible     | 2.14+（快速入門指令碼會自動安裝）                         |

## 你會獲得什麼

- 防火牆優先的安全性：UFW + Docker 隔離（僅可連線至 SSH + Tailscale）
- 使用 Tailscale VPN 進行遠端存取，無須將服務公開
- 使用 Docker 建立僅繫結至 localhost 的隔離沙箱容器
- 整合具安全強化功能的 Systemd，並在開機時自動啟動
- 單一命令完成設定

## 快速入門

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 安裝內容

1. Tailscale（用於安全遠端存取的網狀 VPN）
2. UFW 防火牆（僅開放 SSH + Tailscale 連接埠）
3. Docker CE + Compose V2（預設的代理程式沙箱後端）
4. Node.js 和 pnpm（OpenClaw 需要 Node 22.22.3+、24.15+ 或 25.9+；建議使用 Node 24）
5. OpenClaw，安裝於主機上，而非容器中
6. 具安全強化功能的 systemd 服務

<Note>
閘道直接在主機上執行，而非在 Docker 中執行。代理程式沙箱功能為
選用；此 playbook 會安裝 Docker，因為它是預設的沙箱
後端。其他後端請參閱[沙箱](/zh-TW/gateway/sandboxing)。
</Note>

## 安裝後設定

<Steps>
  <Step title="切換至 openclaw 使用者">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="執行初始設定精靈">
    安裝後指令碼會引導你完成 OpenClaw 的設定。
  </Step>
  <Step title="連接訊息頻道">
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
  <Step title="連接至 Tailscale">
    加入你的 VPN 網狀網路，以進行安全的遠端存取。
  </Step>
</Steps>

### 快速命令

```bash
# 檢查服務狀態
sudo systemctl status openclaw

# 檢視即時記錄
sudo journalctl -u openclaw -f

# 重新啟動閘道
sudo systemctl restart openclaw

# 登入頻道（以 openclaw 使用者身分執行）
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## 安全架構

四層防禦模型：

1. 防火牆（UFW）：僅將 SSH（22）和 Tailscale（41641/udp）公開
2. VPN（Tailscale）：只能透過 VPN 網狀網路連線至閘道
3. Docker 隔離：`DOCKER-USER` iptables 鏈可防止連接埠對外開放
4. Systemd 安全強化：`NoNewPrivileges`、`PrivateTmp`、非特權使用者

驗證你的外部攻擊面：

```bash
nmap -p- YOUR_SERVER_IP
```

只有連接埠 22（SSH）應為開放狀態。閘道和 Docker 會維持封鎖。

Docker 用於代理程式沙箱（隔離的工具執行環境），並非用於執行閘道。沙箱設定請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

## 手動安裝

<Steps>
  <Step title="安裝必要條件">
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
  <Step title="安裝 Ansible 集合">
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
    # 接著執行：/tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安裝程式會將 OpenClaw 設定為手動更新；標準流程請參閱[更新](/zh-TW/install/updating)。

若要重新執行 playbook（例如在變更設定後）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

此操作具冪等性，可安全地重複執行。

## 疑難排解

<AccordionGroup>
  <Accordion title="防火牆封鎖我的連線">
    - 請先透過 Tailscale VPN 連線；依設計，閘道只能透過此方式存取。
    - 一律允許 SSH（連接埠 22）。

  </Accordion>
  <Accordion title="服務無法啟動">
    ```bash
    # 檢查記錄
    sudo journalctl -u openclaw -n 100

    # 驗證權限
    sudo ls -la /opt/openclaw

    # 測試手動啟動
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker 沙箱問題">
    ```bash
    # 驗證 Docker 是否正在執行
    sudo systemctl status docker

    # 檢查沙箱映像檔
    sudo docker images | grep openclaw-sandbox

    # 若缺少沙箱映像檔，請進行建置（需要原始碼簽出）
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # 若使用 npm 安裝且沒有原始碼簽出，請參閱
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="頻道登入失敗">
    請確認你是以 `openclaw` 使用者身分執行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 進階設定

如需詳細的安全架構和疑難排解資訊，請參閱 openclaw-ansible 儲存庫：

- [安全架構](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術詳細資訊](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [疑難排解指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相關內容

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible)：完整部署指南
- [Docker](/zh-TW/install/docker)：容器化閘道設定
- [沙箱](/zh-TW/gateway/sandboxing)：代理程式沙箱設定
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)：各代理程式的隔離設定
