---
read_when:
    - 您想要在 Linux 伺服器或雲端 VPS 上執行閘道
    - 你需要一份託管指南的快速導覽圖
    - 你想要針對 OpenClaw 進行通用的 Linux 伺服器調校
sidebarTitle: Linux Server
summary: 在 Linux 伺服器或雲端 VPS 上執行 OpenClaw——供應商選擇器、架構與調校
title: Linux 伺服器
x-i18n:
    generated_at: "2026-07-11T21:56:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

在任何 Linux 伺服器或雲端 VPS 上執行 OpenClaw 閘道。本頁可協助你
選擇供應商、說明雲端部署的運作方式，並介紹適用於各種環境的通用 Linux
效能調校。

## 選擇供應商

<CardGroup cols={2}>
  <Card title="Azure" href="/zh-TW/install/azure">Linux 虛擬機器</Card>
  <Card title="DigitalOcean" href="/zh-TW/install/digitalocean">簡易付費 VPS</Card>
  <Card title="exe.dev" href="/zh-TW/install/exe-dev">附 HTTPS Proxy 的虛擬機器</Card>
  <Card title="Fly.io" href="/zh-TW/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/zh-TW/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/zh-TW/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/zh-TW/install/hostinger">支援一鍵設定的 VPS</Card>
  <Card title="Northflank" href="/zh-TW/install/northflank">一鍵式瀏覽器設定</Card>
  <Card title="Oracle Cloud" href="/zh-TW/install/oracle">永久免費 ARM 方案</Card>
  <Card title="Railway" href="/zh-TW/install/railway">一鍵式瀏覽器設定</Card>
  <Card title="Raspberry Pi" href="/zh-TW/install/raspberry-pi">自行託管的 ARM</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免費方案）**也能良好運作。
社群影片逐步教學可見
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
（社群資源——日後可能無法使用）。

## 雲端設定的運作方式

- **閘道在 VPS 上執行**，並管理狀態與工作區。
- 你可以從筆記型電腦或手機透過**控制介面**或 **Tailscale/SSH** 連線。
- 將 VPS 視為唯一可信來源，並定期**備份**狀態與工作區。
- 安全的預設方式：讓閘道僅監聽 local loopback，並透過 SSH 通道或 Tailscale Serve 存取。
  如果繫結至 `lan` 或 `tailnet`，閘道會要求共用密鑰
  （`gateway.auth.token` 或 `gateway.auth.password`），除非將驗證委派給
  受信任的 Proxy。

相關頁面：[閘道遠端存取](/zh-TW/gateway/remote)、[平台中心](/zh-TW/platforms)。

## 先強化管理員存取安全性

在公用 VPS 上安裝 OpenClaw 前，請先決定要如何管理
該主機本身。

- 若僅允許透過 Tailnet 進行管理員存取：先安裝 Tailscale，將 VPS 加入你的
  tailnet，透過 Tailscale IP 或 MagicDNS 名稱驗證第二個 SSH 工作階段，
  然後限制公用 SSH 存取。
- 不使用 Tailscale 時：在公開更多服務前，先對 SSH 存取路徑採取同等的安全強化措施。
- 這與閘道存取是分開的。你仍可讓 OpenClaw 僅繫結至
  local loopback，並使用 SSH 通道或 Tailscale Serve 存取儀表板。

Tailscale 專用的閘道選項請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

## VPS 上的公司共用代理程式

當所有使用者都處於相同信任邊界內，且代理程式僅用於業務時，
由團隊共用單一代理程式是可行的設定。

- 將其置於專用執行環境（VPS/虛擬機器/容器，以及專用的作業系統使用者/帳號）。
- 請勿在該執行環境中登入個人 Apple/Google 帳號，或使用個人瀏覽器/密碼管理器設定檔。
- 如果使用者之間互不信任，請依閘道/主機/作業系統使用者分隔環境。

安全性模型詳情：[安全性](/zh-TW/gateway/security)。

## 搭配 VPS 使用節點

你可以將閘道保留在雲端，並配對本機裝置上的**節點**
（Mac/iOS/Android/無頭裝置）。節點可提供本機螢幕、相機、畫布與 `system.run`
功能，同時讓閘道留在雲端。

文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

## 小型虛擬機器與 ARM 主機的啟動效能調校

如果命令列介面指令在低效能虛擬機器（或 ARM 主機）上執行緩慢，請啟用 Node 的模組編譯快取：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 可改善重複執行指令時的啟動速度；首次執行會預熱快取。
- `OPENCLAW_NO_RESPAWN=1` 會讓例行閘道重新啟動保持在同一行程中，避免額外的行程交接，並讓小型主機上的 PID 追蹤保持簡單。
- 如需 Raspberry Pi 的特定資訊，請參閱 [Raspberry Pi](/zh-TW/install/raspberry-pi)。

### systemd 效能調校檢查清單（選用）

對於使用 `systemd` 的虛擬機器主機，可考慮：

- 為穩定啟動路徑設定服務環境變數：`OPENCLAW_NO_RESPAWN=1` 和
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 明確設定重新啟動行為：`Restart=always`、`RestartSec=2`、`TimeoutStartSec=90`
- 對狀態與快取路徑使用 SSD 儲存裝置，以減少隨機 I/O 導致的冷啟動延遲。

標準的 `openclaw onboard --install-daemon` 流程會安裝 systemd 使用者
單元；請使用以下指令編輯：

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
`sudo systemctl edit openclaw-gateway.service` 編輯。

`Restart=` 原則如何協助自動復原：
[systemd 可將服務復原自動化](https://www.redhat.com/en/blog/systemd-automate-recovery)。

如需瞭解 Linux OOM 行為、子行程終止目標選擇，以及 `exit 137`
診斷，請參閱 [Linux 記憶體壓力與 OOM 終止](/zh-TW/platforms/linux#memory-pressure-and-oom-kills)。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [DigitalOcean](/zh-TW/install/digitalocean)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
