---
read_when:
    - 正在查詢 Linux companion app 狀態
    - 規劃平台涵蓋範圍或貢獻
    - 在 VPS 或容器上偵錯 Linux OOM 終止或結束碼 137
summary: Linux 支援 + 配套應用程式狀態
title: Linux 應用程式
x-i18n:
    generated_at: "2026-06-27T19:31:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

閘道在 Linux 上受到完整支援。**節點 是建議的執行階段**。
不建議將 Bun 用於閘道（WhatsApp/Telegram 錯誤）。

原生 Linux 輔助應用程式已在規劃中。如果你想協助建置，歡迎貢獻。

## 初學者快速路徑（VPS）

1. 安裝 節點 24（建議；節點 22 LTS，目前為 `22.19+`，仍可相容運作）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 從你的筆電執行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 開啟 `http://127.0.0.1:18789/`，並使用設定的共享密鑰驗證（預設為 token；如果你設定了 `gateway.auth.mode: "password"`，則使用密碼）

完整 Linux 伺服器指南：[Linux 伺服器](/zh-TW/vps)。逐步 VPS 範例：[exe.dev](/zh-TW/install/exe-dev)

## 安裝

- [開始使用](/zh-TW/start/getting-started)
- [安裝與更新](/zh-TW/install/updating)
- 選用流程：[Bun（實驗性）](/zh-TW/install/bun)、[Nix](/zh-TW/install/nix)、[Docker](/zh-TW/install/docker)

## 閘道

- [閘道運行手冊](/zh-TW/gateway)
- [設定](/zh-TW/gateway/configuration)

## 閘道服務安裝（命令列介面）

使用以下其中一種：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

在提示時選取 **閘道服務**。

修復/遷移：

```
openclaw doctor
```

## 系統控制（systemd 使用者單元）

OpenClaw 預設會安裝 systemd **使用者**服務。對於共享或永遠開啟的伺服器，請使用 **系統**
服務。`openclaw gateway install` 和
`openclaw onboard --install-daemon` 已經會為你產生目前的標準單元；
只有在你需要自訂系統/服務管理器
設定時，才手動撰寫。完整服務指南位於[閘道運行手冊](/zh-TW/gateway)。

最小設定：

建立 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

啟用它：

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 記憶體壓力與 OOM 終止

在 Linux 上，當主機、VM 或容器 cgroup
記憶體耗盡時，核心會選擇一個 OOM 犧牲者。閘道可能是不好的犧牲者，因為它擁有長生命週期的
工作階段與通道連線。因此 OpenClaw 會在可行時傾向讓暫時性的子
程序先於閘道被終止。

對於符合條件的 Linux 子程序產生，OpenClaw 會透過一個簡短的
`/bin/sh` 包裝器啟動子程序，將子程序自己的 `oom_score_adj` 提高到 `1000`，然後
`exec` 真正的命令。這是不需特權的操作，因為子程序
只是提高自己被 OOM 終止的可能性。

涵蓋的子程序表面包括：

- 由監督器管理的命令子程序，
- PTY shell 子程序，
- MCP stdio 伺服器子程序，
- OpenClaw 啟動的瀏覽器/Chrome 程序。

此包裝器僅限 Linux，且在 `/bin/sh` 不可用時會跳過。如果子程序環境設定
`OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、
`no` 或 `off`，也會跳過。

若要驗證子程序：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵蓋子程序的預期值為 `1000`。閘道程序應維持其一般分數，通常為 `0`。

建議的 systemd 單元也會設定 `OOMPolicy=continue`。這會在暫時性子程序被 OOM killer 選中時，保持
閘道單元存活；
子命令/工作階段可以失敗並回報其錯誤，而不會讓 systemd 將
整個閘道服務標記為失敗並重新啟動所有通道。

這不會取代一般的記憶體調校。如果 VPS 或容器反覆
終止子程序，請增加記憶體限制、降低並行度，或加入更強的
資源控制，例如 systemd `MemoryMax=` 或容器層級的記憶體限制。

## 相關

- [安裝總覽](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [Raspberry Pi](/zh-TW/install/raspberry-pi)
