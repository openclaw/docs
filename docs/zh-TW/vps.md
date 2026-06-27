---
read_when:
    - 您想在 Linux 伺服器或雲端 VPS 上執行閘道
    - 你需要一份託管指南的快速導覽
    - 你想要針對 OpenClaw 的通用 Linux 伺服器調校
sidebarTitle: Linux Server
summary: 在 Linux 伺服器或雲端 VPS 上執行 OpenClaw — 提供者選擇器、架構與調校
title: Linux 伺服器
x-i18n:
    generated_at: "2026-06-27T20:12:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

在任何 Linux 伺服器或雲端 VPS 上執行 OpenClaw 閘道。本頁協助你
選擇供應商，說明雲端部署的運作方式，並涵蓋適用於各處的通用 Linux
調校。

## 選擇供應商

<CardGroup cols={2}>
  <Card title="Railway" href="/zh-TW/install/railway">一鍵式瀏覽器設定</Card>
  <Card title="Northflank" href="/zh-TW/install/northflank">一鍵式瀏覽器設定</Card>
  <Card title="DigitalOcean" href="/zh-TW/install/digitalocean">簡單的付費 VPS</Card>
  <Card title="Oracle Cloud" href="/zh-TW/install/oracle">Always Free ARM 層級</Card>
  <Card title="Fly.io" href="/zh-TW/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/zh-TW/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/zh-TW/install/hostinger">具備一鍵式設定的 VPS</Card>
  <Card title="GCP" href="/zh-TW/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/zh-TW/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/zh-TW/install/exe-dev">具備 HTTPS Proxy 的 VM</Card>
  <Card title="Raspberry Pi" href="/zh-TW/install/raspberry-pi">ARM 自行託管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免費層）**也能良好運作。
社群影片逐步教學可在
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
取得（社群資源 -- 可能會無法存取）。

## 雲端設定的運作方式

- **閘道在 VPS 上執行**，並擁有狀態與工作區。
- 你可透過 **Control UI** 或 **Tailscale/SSH**，從筆記型電腦或手機連線。
- 將 VPS 視為真實來源，並定期**備份**狀態與工作區。
- 安全預設值：讓閘道維持在 loopback，並透過 SSH 通道或 Tailscale Serve 存取。
  如果你綁定到 `lan` 或 `tailnet`，請要求 `gateway.auth.token` 或 `gateway.auth.password`。

相關頁面：[閘道遠端存取](/zh-TW/gateway/remote)、[平台中心](/zh-TW/platforms)。

## 先強化管理存取

在公用 VPS 上安裝 OpenClaw 之前，請先決定你要如何管理
主機本身。

- 如果你想要僅限 Tailnet 的管理存取，請先安裝 Tailscale，將 VPS 加入
  你的 tailnet，透過 Tailscale IP 或 MagicDNS 名稱驗證第二個 SSH 工作階段，
  然後限制公開 SSH。
- 如果你不使用 Tailscale，請先為你的 SSH
  路徑套用等效的強化，再公開更多服務。
- 這與閘道存取是分開的。你仍然可以讓 OpenClaw 綁定到
  loopback，並使用 SSH 通道或 Tailscale Serve 存取儀表板。

Tailscale 專屬的閘道選項位於 [Tailscale](/zh-TW/gateway/tailscale)。

## VPS 上的共用公司代理

當每位使用者都位於相同信任邊界內，且代理僅用於商務用途時，為團隊執行單一代理是有效的設定。

- 將其保留在專用執行環境中（VPS/VM/容器 + 專用 OS 使用者/帳號）。
- 不要讓該執行環境登入個人的 Apple/Google 帳號，或個人的瀏覽器/密碼管理器設定檔。
- 如果使用者彼此之間具對抗性，請按閘道/主機/OS 使用者分隔。

安全模型詳細資訊：[安全性](/zh-TW/gateway/security)。

## 搭配 VPS 使用節點

你可以將閘道保留在雲端，並在本機裝置
（Mac/iOS/Android/headless）上配對**節點**。節點提供本機螢幕/相機/canvas 與 `system.run`
能力，同時閘道維持在雲端。

文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

## 小型 VM 與 ARM 主機的啟動調校

如果在低功耗 VM（或 ARM 主機）上執行命令列介面命令感覺很慢，請啟用節點的模組編譯快取：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可改善重複命令啟動時間。
- `OPENCLAW_NO_RESPAWN=1` 讓例行閘道重新啟動維持在程序內，避免額外的程序交接，並在小型主機上讓 PID 追蹤保持簡單。
- 第一次命令執行會暖機快取；後續執行會更快。
- Raspberry Pi 的特定資訊，請參閱 [Raspberry Pi](/zh-TW/install/raspberry-pi)。

### systemd 調校檢查清單（選用）

對於使用 `systemd` 的 VM 主機，請考慮：

- 為穩定的啟動路徑新增服務環境變數：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 讓重新啟動行為明確：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 優先使用 SSD 支援的磁碟作為狀態/快取路徑，以降低隨機 I/O 冷啟動懲罰。

對於標準 `openclaw onboard --install-daemon` 路徑，請編輯使用者單元：

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

如果你刻意安裝的是系統單元，請改用
`sudo systemctl edit openclaw-gateway.service` 編輯
`openclaw-gateway.service`。

`Restart=` 政策如何協助自動復原：
[systemd 可以自動化服務復原](https://www.redhat.com/en/blog/systemd-automate-recovery)。

如需 Linux OOM 行為、子程序受害者選取，以及 `exit 137`
診斷，請參閱 [Linux 記憶體壓力與 OOM 終止](/zh-TW/platforms/linux#memory-pressure-and-oom-kills)。

## 相關

- [安裝總覽](/zh-TW/install)
- [DigitalOcean](/zh-TW/install/digitalocean)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
