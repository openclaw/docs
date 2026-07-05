---
read_when:
    - 正在尋找 Linux 配套應用程式狀態
    - 規劃平台涵蓋範圍或貢獻
    - 偵錯 VPS 或容器上的 Linux OOM 終止或結束碼 137
summary: Linux 支援 + 配套應用程式狀態
title: Linux 應用程式
x-i18n:
    generated_at: "2026-07-05T11:28:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway 在 Linux 上完全受支援。建議使用 節點 作為執行環境；不建議使用 Bun
（已知有 WhatsApp/Telegram 問題）。

目前還沒有原生 Linux companion app。歡迎貢獻。

## 快速路徑（VPS）

1. 安裝 節點 24（建議）或 節點 22.19+（LTS，仍受支援）。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 從你的筆電執行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 開啟 `http://127.0.0.1:18789/`，並使用已設定的共用
   密鑰進行驗證（預設為權杖；若 `gateway.auth.mode` 為 `"password"`，則使用密碼）。

完整伺服器指南：[Linux 伺服器](/zh-TW/vps)。逐步 VPS 範例：
[exe.dev](/zh-TW/install/exe-dev)。

## 安裝

- [開始使用](/zh-TW/start/getting-started)
- [安裝與更新](/zh-TW/install/updating)
- 選用：[Bun（實驗性）](/zh-TW/install/bun)、[Nix](/zh-TW/install/nix)、[Docker](/zh-TW/install/docker)

## Gateway 服務（systemd）

使用下列其中一種方式安裝：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

修復或遷移現有安裝：

```bash
openclaw doctor
```

`openclaw gateway install` 預設會產生 systemd **使用者** unit。完整的
服務指南，包括適用於共用或
常開主機的 **系統** 層級 unit 變體，位於 [Gateway runbook](/zh-TW/gateway#supervision-and-service-lifecycle)。

只有在自訂設定時才手動撰寫 unit。最小使用者 unit 範例
（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）：

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

啟用它：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 記憶體壓力與 OOM kill

在 Linux 上，當主機、VM 或容器 cgroup
用盡記憶體時，核心會選擇一個 OOM 犧牲者。Gateway 不適合作為犧牲者，因為它持有長期存在的
工作階段和通道連線，因此 OpenClaw 會在可能時偏向讓暫時性子
程序先被終止。

對於符合條件的 Linux 子程序啟動，OpenClaw 會用一個短的
`/bin/sh` shim 包裝命令，將子程序自己的 `oom_score_adj` 提高到 `1000`，然後
`exec` 真正的命令。這不需要特權：程序永遠可以提高
自己的 OOM 分數。

涵蓋的子程序介面：

- Supervisor 管理的命令子程序
- PTY shell 子程序
- MCP stdio server 子程序
- OpenClaw 啟動的 browser/Chrome 程序（透過外掛 SDK 程序執行環境）

此包裝器僅限 Linux，且在 `/bin/sh` 不可用時，或
子程序 env 將 `OPENCLAW_CHILD_OOM_SCORE_ADJ` 設為 `0`、`false`、`no` 或
`off` 時會略過。

驗證子程序：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵蓋子程序的預期值為 `1000`；Gateway 程序本身
會保留其正常分數（通常為 `0`）。

systemd unit 的 `OOMPolicy=continue` 會在
暫時性子程序被 OOM killer 選中時讓 Gateway 服務保持運作，而不是將整個
unit 標記為失敗並重新啟動所有通道；失敗的子程序/工作階段會回報其
自身錯誤。

這並不能取代一般的記憶體調校。如果 VPS 或容器反覆
終止子程序，請提高記憶體限制、降低並行度，或新增更強的
資源控制（systemd `MemoryMax=`、容器記憶體限制）。

## 相關

- [安裝總覽](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [Raspberry Pi](/zh-TW/install/raspberry-pi)
- [Gateway runbook](/zh-TW/gateway)
- [Gateway 設定](/zh-TW/gateway/configuration)
