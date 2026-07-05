---
read_when:
    - 你想在 Linux 伺服器或雲端 VPS 上執行閘道
    - 你需要一份託管指南的快速概覽
    - 你想要針對 OpenClaw 進行通用 Linux 伺服器調校
sidebarTitle: Linux Server
summary: 在 Linux 伺服器或雲端 VPS 上執行 OpenClaw — 供應商選擇器、架構與調校
title: Linux 伺服器
x-i18n:
    generated_at: "2026-07-05T11:48:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

在任何 Linux 伺服器或雲端 VPS 上執行 OpenClaw 閘道。本頁協助你
選擇供應商、說明雲端部署的運作方式，並涵蓋適用於各處的通用 Linux
調校。

## 選擇供應商

<CardGroup cols={2}>
  <Card title="Azure" href="/zh-TW/install/azure">Linux VM</Card>
  <Card title="DigitalOcean" href="/zh-TW/install/digitalocean">簡易付費 VPS</Card>
  <Card title="exe.dev" href="/zh-TW/install/exe-dev">具備 HTTPS proxy 的 VM</Card>
  <Card title="Fly.io" href="/zh-TW/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/zh-TW/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/zh-TW/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/zh-TW/install/hostinger">具備一鍵設定的 VPS</Card>
  <Card title="Northflank" href="/zh-TW/install/northflank">一鍵、瀏覽器設定</Card>
  <Card title="Oracle Cloud" href="/zh-TW/install/oracle">Always Free ARM tier</Card>
  <Card title="Railway" href="/zh-TW/install/railway">一鍵、瀏覽器設定</Card>
  <Card title="Raspberry Pi" href="/zh-TW/install/raspberry-pi">ARM 自架</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** 也能順利運作。
社群影片逐步教學可在
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
取得（社群資源 -- 可能會無法使用）。

## 雲端設定的運作方式

- **閘道在 VPS 上執行**，並持有狀態與工作區。
- 你可以透過 **Control UI** 或 **Tailscale/SSH** 從筆電或手機連線。
- 將 VPS 視為真實來源，並定期**備份**狀態與工作區。
- 安全預設值：讓閘道維持在 loopback，並透過 SSH tunnel 或 Tailscale Serve 存取。
  如果你綁定到 `lan` 或 `tailnet`，除非驗證委派給
  受信任的 proxy，否則閘道會要求共享密鑰
  （`gateway.auth.token` 或 `gateway.auth.password`）。

相關頁面：[閘道遠端存取](/zh-TW/gateway/remote)、[平台中心](/zh-TW/platforms)。

## 先強化管理員存取

在公開 VPS 上安裝 OpenClaw 之前，先決定你想如何管理
主機本身。

- 若只允許 Tailnet 管理存取：先安裝 Tailscale，將 VPS 加入你的
  tailnet，透過 Tailscale IP 或 MagicDNS 名稱驗證第二個 SSH 工作階段，
  然後限制公開 SSH。
- 不使用 Tailscale：在公開更多服務之前，先為你的 SSH 路徑套用等效的強化。
- 這與閘道存取分開。你仍可讓 OpenClaw 綁定到
  loopback，並使用 SSH tunnel 或 Tailscale Serve 存取儀表板。

Tailscale 專屬的閘道選項位於 [Tailscale](/zh-TW/gateway/tailscale)。

## VPS 上的共享公司代理

當每位使用者都在相同信任邊界內，且代理僅用於業務時，為團隊執行單一代理是有效的設定。

- 將它放在專用 runtime 上（VPS/VM/container + 專用 OS 使用者/帳號）。
- 不要讓該 runtime 登入個人 Apple/Google 帳號，或個人瀏覽器/密碼管理器設定檔。
- 如果使用者彼此之間不可信，請依閘道/主機/OS 使用者分開。

安全模型詳細資訊：[安全性](/zh-TW/gateway/security)。

## 搭配 VPS 使用節點

你可以將閘道保留在雲端，並在本機裝置
（Mac/iOS/Android/headless）配對**節點**。節點提供本機螢幕/相機/canvas 與 `system.run`
能力，同時閘道維持在雲端。

文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

## 小型 VM 與 ARM 主機的啟動調校

如果命令列介面命令在低功耗 VM（或 ARM 主機）上感覺很慢，請啟用 Node 的模組編譯快取：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可改善重複命令的啟動時間；第一次執行會暖機快取。
- `OPENCLAW_NO_RESPAWN=1` 會讓例行閘道重新啟動留在同一程序內，避免額外程序交接，並讓小型主機上的 PID 追蹤保持簡單。
- 關於 Raspberry Pi 的細節，請參閱 [Raspberry Pi](/zh-TW/install/raspberry-pi)。

### systemd 調校檢查清單（選用）

對於使用 `systemd` 的 VM 主機，請考慮：

- 用於穩定啟動路徑的服務環境：`OPENCLAW_NO_RESPAWN=1` 和
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 明確的重新啟動行為：`Restart=always`、`RestartSec=2`、`TimeoutStartSec=90`
- 狀態/快取路徑使用 SSD 支援的磁碟，以降低隨機 I/O 冷啟動懲罰。

標準 `openclaw onboard --install-daemon` 路徑會安裝 systemd 使用者
unit；請用以下方式編輯：

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
`sudo systemctl edit openclaw-gateway.service` 編輯。

`Restart=` policy 如何協助自動復原：
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

關於 Linux OOM 行為、子程序受害者選擇，以及 `exit 137`
診斷，請參閱 [Linux 記憶體壓力與 OOM kill](/zh-TW/platforms/linux#memory-pressure-and-oom-kills)。

## 相關

- [安裝總覽](/zh-TW/install)
- [DigitalOcean](/zh-TW/install/digitalocean)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
