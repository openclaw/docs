---
read_when:
    - 您想在 Linux 伺服器或雲端 VPS 上執行 Gateway
    - 你需要一份託管指南的快速導覽
    - 您想要適用於 OpenClaw 的通用 Linux 伺服器調校
sidebarTitle: Linux Server
summary: 在 Linux 伺服器或雲端 VPS 上執行 OpenClaw — 供應商選擇器、架構與調校
title: Linux 伺服器
x-i18n:
    generated_at: "2026-04-30T03:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

在任何 Linux 伺服器或雲端 VPS 上執行 OpenClaw Gateway。本頁協助你
選擇供應商、說明雲端部署的運作方式，並涵蓋適用於各處的通用 Linux
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
  <Card title="exe.dev" href="/zh-TW/install/exe-dev">具備 HTTPS proxy 的 VM</Card>
  <Card title="Raspberry Pi" href="/zh-TW/install/raspberry-pi">ARM 自行託管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免費層級）**也能順利使用。
社群影片逐步教學可在
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
取得（社群資源 -- 可能會變得無法使用）。

## 雲端設定的運作方式

- **Gateway 在 VPS 上執行**，並擁有狀態與工作區。
- 你可透過 **Control UI** 或 **Tailscale/SSH** 從筆電或手機連線。
- 將 VPS 視為真實來源，並定期**備份**狀態與工作區。
- 安全預設值：將 Gateway 保持在 loopback，並透過 SSH tunnel 或 Tailscale Serve 存取。
  如果綁定至 `lan` 或 `tailnet`，請要求 `gateway.auth.token` 或 `gateway.auth.password`。

相關頁面：[Gateway 遠端存取](/zh-TW/gateway/remote)、[平台總覽](/zh-TW/platforms)。

## 先強化管理存取

在公用 VPS 上安裝 OpenClaw 之前，先決定你要如何管理
該主機本身。

- 如果你想要僅限 tailnet 的管理存取，請先安裝 Tailscale，將 VPS
  加入你的 tailnet，透過 Tailscale IP 或 MagicDNS 名稱驗證第二個 SSH 工作階段，
  然後限制公開 SSH。
- 如果你不使用 Tailscale，請在暴露更多服務之前，對你的 SSH
  路徑套用等效的強化措施。
- 這與 Gateway 存取是分開的。你仍然可以將 OpenClaw 綁定至
  loopback，並使用 SSH tunnel 或 Tailscale Serve 存取儀表板。

Tailscale 專屬 Gateway 選項位於 [Tailscale](/zh-TW/gateway/tailscale)。

## VPS 上的共用公司代理程式

當每位使用者都位於相同信任邊界內，且代理程式僅供業務使用時，為團隊執行單一代理程式是有效的設定。

- 將它保持在專用執行環境中（VPS/VM/container + 專用 OS 使用者/帳號）。
- 不要讓該執行環境登入個人的 Apple/Google 帳號或個人瀏覽器/密碼管理器設定檔。
- 如果使用者彼此之間不可信任，請依 gateway/host/OS 使用者分離。

安全模型詳細資訊：[安全性](/zh-TW/gateway/security)。

## 搭配 VPS 使用節點

你可以將 Gateway 保留在雲端，並在本機裝置
（Mac/iOS/Android/headless）上配對**節點**。節點提供本機螢幕/相機/canvas 和 `system.run`
能力，而 Gateway 則留在雲端。

文件：[節點](/zh-TW/nodes)、[節點 CLI](/zh-TW/cli/nodes)。

## 小型 VM 與 ARM 主機的啟動調校

如果 CLI 命令在低功耗 VM（或 ARM 主機）上感覺很慢，請啟用 Node 的模組編譯快取：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可改善重複執行命令的啟動時間。
- `OPENCLAW_NO_RESPAWN=1` 可避免 self-respawn 路徑造成的額外啟動開銷。
- 第一次執行命令會暖機快取；後續執行會更快。
- Raspberry Pi 專屬細節請參閱 [Raspberry Pi](/zh-TW/install/raspberry-pi)。

### systemd 調校檢查清單（選用）

對於使用 `systemd` 的 VM 主機，請考慮：

- 為穩定的啟動路徑新增服務環境變數：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 讓重新啟動行為保持明確：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 對狀態/快取路徑優先使用 SSD 後端磁碟，以降低 random-I/O 冷啟動成本。

對於標準的 `openclaw onboard --install-daemon` 路徑，請編輯使用者 unit：

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

如果你刻意安裝的是 system unit，請改用
`sudo systemctl edit openclaw-gateway.service` 編輯 `openclaw-gateway.service`。

`Restart=` 策略如何協助自動復原：
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

如需 Linux OOM 行為、子程序受害者選擇，以及 `exit 137`
診斷，請參閱 [Linux 記憶體壓力與 OOM kills](/zh-TW/platforms/linux#memory-pressure-and-oom-kills)。

## 相關

- [安裝總覽](/zh-TW/install)
- [DigitalOcean](/zh-TW/install/digitalocean)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
