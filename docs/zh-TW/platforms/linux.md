---
read_when:
    - 尋找 Linux 伴隨應用程式的狀態
    - 規劃平台支援範圍或貢獻
    - 偵錯 VPS 或容器上的 Linux OOM 終止或結束代碼 137
summary: Linux 支援與配套應用程式狀態
title: Linux 應用程式
x-i18n:
    generated_at: "2026-07-11T21:29:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Linux 完整支援閘道。建議使用節點作為執行階段；不建議使用 Bun
（已知有 WhatsApp/Telegram 問題）。

目前尚無原生 Linux 伴隨應用程式。歡迎貢獻。

## 快速路徑（VPS）

1. 安裝節點 24（建議）或節點 22.19+（LTS，仍受支援）。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 從筆記型電腦執行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 開啟 `http://127.0.0.1:18789/`，並使用已設定的共用
   密鑰進行驗證（預設為權杖；若 `gateway.auth.mode` 為 `"password"`，則使用密碼）。

完整伺服器指南：[Linux 伺服器](/zh-TW/vps)。VPS 逐步範例：
[exe.dev](/zh-TW/install/exe-dev)。

## 安裝

- [開始使用](/zh-TW/start/getting-started)
- [安裝與更新](/zh-TW/install/updating)
- 選用：[Bun（實驗性）](/zh-TW/install/bun)、[Nix](/zh-TW/install/nix)、[Docker](/zh-TW/install/docker)

## 閘道服務（systemd）

使用以下其中一種方式安裝：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # 出現提示時選取 "Gateway service"
```

修復或遷移現有安裝：

```bash
openclaw doctor
```

`openclaw gateway install` 預設會產生 systemd **使用者**單元。完整的
服務指南，包括適用於共用或持續運作主機的**系統**層級單元版本，請參閱
[閘道操作手冊](/zh-TW/gateway#supervision-and-service-lifecycle)。

僅在自訂設定時才手動編寫單元。最小使用者單元範例
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

啟用此單元：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 記憶體壓力與 OOM 終止

在 Linux 上，當主機、虛擬機器或容器 cgroup
耗盡記憶體時，核心會選擇一個 OOM 犧牲程序。閘道不適合作為犧牲程序，因為它負責長期存在的
工作階段與頻道連線，因此 OpenClaw 會盡可能優先終止暫時性的子
程序。

對於符合條件的 Linux 子程序啟動，OpenClaw 會使用簡短的
`/bin/sh` 包裝程式包裝命令，將子程序自身的 `oom_score_adj` 提高至 `1000`，然後
以 `exec` 執行實際命令。這不需要特殊權限：程序隨時可以提高
自身的 OOM 分數。

涵蓋的子程序介面：

- 由監督程式管理的命令子程序
- PTY shell 子程序
- MCP stdio 伺服器子程序
- 由 OpenClaw 啟動的瀏覽器/Chrome 程序（透過外掛 SDK 程序執行階段）

此包裝程式僅適用於 Linux；當 `/bin/sh` 無法使用，或子程序環境變數
將 `OPENCLAW_CHILD_OOM_SCORE_ADJ` 設為 `0`、`false`、`no` 或
`off` 時，會略過包裝。

驗證子程序：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵蓋範圍內子程序的預期值為 `1000`；閘道程序本身
則維持其正常分數（通常為 `0`）。

systemd 單元的 `OOMPolicy=continue` 可在 OOM 終止器選中
暫時性子程序時讓閘道服務繼續運作，而不會將整個
單元標記為失敗並重新啟動所有頻道；失敗的子程序/工作階段會回報其
自身錯誤。

這不能取代正常的記憶體調校。如果 VPS 或容器反覆
終止子程序，請提高記憶體限制、降低並行數，或新增更嚴格的
資源控制（systemd `MemoryMax=`、容器記憶體限制）。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [Raspberry Pi](/zh-TW/install/raspberry-pi)
- [閘道操作手冊](/zh-TW/gateway)
- [閘道設定](/zh-TW/gateway/configuration)
