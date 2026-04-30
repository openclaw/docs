---
read_when:
    - 正在查詢 Linux 配套應用程式狀態
    - 規劃平台涵蓋範圍或貢獻
    - 偵錯 VPS 或容器上的 Linux OOM 終止或結束碼 137
summary: Linux 支援 + 配套應用程式狀態
title: Linux 應用程式
x-i18n:
    generated_at: "2026-04-30T03:19:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 16
---

Gateway 在 Linux 上受到完整支援。**Node 是建議的執行階段**。
不建議將 Bun 用於 Gateway（WhatsApp/Telegram 錯誤）。

原生 Linux 輔助應用程式正在規劃中。如果你想協助建置，歡迎貢獻。

## 初學者快速路徑 (VPS)

1. 安裝 Node 24（建議；Node 22 LTS，目前為 `22.14+`，仍可相容運作）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 從你的筆電執行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 開啟 `http://127.0.0.1:18789/`，並使用已設定的共用密鑰進行驗證（預設為權杖；如果你設定 `gateway.auth.mode: "password"`，則為密碼）

完整 Linux 伺服器指南：[Linux 伺服器](/zh-TW/vps)。逐步 VPS 範例：[exe.dev](/zh-TW/install/exe-dev)

## 安裝

- [開始使用](/zh-TW/start/getting-started)
- [安裝與更新](/zh-TW/install/updating)
- 選用流程：[Bun（實驗性）](/zh-TW/install/bun)、[Nix](/zh-TW/install/nix)、[Docker](/zh-TW/install/docker)

## Gateway

- [Gateway Runbook](/zh-TW/gateway)
- [組態](/zh-TW/gateway/configuration)

## Gateway 服務安裝 (CLI)

使用其中一種：

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

出現提示時選取 **Gateway 服務**。

修復/遷移：

```
openclaw doctor
```

## 系統控制（systemd 使用者單元）

OpenClaw 預設會安裝 systemd **使用者**服務。對於共用或始終開啟的伺服器，請使用 **系統**
服務。`openclaw gateway install` 和
`openclaw onboard --install-daemon` 已經會為你產生目前的標準單元；
只有在需要自訂系統/服務管理器
設定時，才手動撰寫。完整服務指南位於 [Gateway Runbook](/zh-TW/gateway)。

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
用盡記憶體時，核心會選擇一個 OOM 犧牲對象。Gateway 可能是不理想的犧牲對象，因為它擁有長期存在的
工作階段與通道連線。因此，在可行時，OpenClaw 會偏向先終止暫時性的子
程序，而不是 Gateway。

對於符合條件的 Linux 子程序產生，OpenClaw 會透過簡短的
`/bin/sh` 包裝器啟動子程序，將子程序自身的 `oom_score_adj` 提高到 `1000`，然後
`exec` 真正的命令。這是非特權操作，因為子程序只是
提高自己被 OOM 終止的可能性。

涵蓋的子程序表面包括：

- 由監督器管理的命令子程序，
- PTY shell 子程序，
- MCP stdio 伺服器子程序，
- 由 OpenClaw 啟動的瀏覽器/Chrome 程序。

此包裝器僅限 Linux，且在 `/bin/sh` 無法使用時會略過。如果子程序 env 設定 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、
`no` 或 `off`，也會略過。

若要驗證子程序：

```bash
cat /proc/<child-pid>/oom_score_adj
```

受涵蓋子程序的預期值為 `1000`。Gateway 程序應保持
其正常分數，通常為 `0`。

這不會取代一般的記憶體調校。如果 VPS 或容器反覆
終止子程序，請提高記憶體限制、降低並行度，或加入更強的
資源控制，例如 systemd `MemoryMax=` 或容器層級的記憶體限制。

## 相關

- [安裝概觀](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [Raspberry Pi](/zh-TW/install/raspberry-pi)
