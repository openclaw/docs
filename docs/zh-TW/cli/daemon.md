---
read_when:
    - 你仍然在腳本中使用 `openclaw daemon ...`
    - 您需要服務生命週期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 參考（Gateway 服務管理的舊版別名）'
title: 守護程式
x-i18n:
    generated_at: "2026-05-11T20:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 服務管理命令的舊版別名。

`openclaw daemon ...` 對應到與 `openclaw gateway ...` 服務命令相同的服務控制介面。

## 用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令

- `status`：顯示服務安裝狀態並探測 Gateway 健康狀態
- `install`：安裝服務（`launchd`/`systemd`/`schtasks`）
- `uninstall`：移除服務
- `start`：啟動服務
- `stop`：停止服務
- `restart`：重新啟動服務

## 常用選項

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- `restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
- 生命週期（`uninstall|start|stop`）：`--json`

注意事項：

- `status` 會在可能時解析已設定的驗證 SecretRefs，以供探測驗證使用。
- 如果必要的驗證 SecretRef 在此命令路徑中未解析，當探測連線能力/驗證失敗時，`daemon status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析密鑰來源。
- 如果探測成功，未解析 auth-ref 警告會被抑制，以避免誤判。
- `status --deep` 會加入盡力而為的系統層級服務掃描。當它找到其他類似 gateway 的服務時，人類可讀輸出會列印清理提示，並警告每台機器一個 gateway 仍是一般建議。
- `status --deep` 也會以 Plugin 感知模式執行設定驗證，並顯示已設定 Plugin 清單的警告（例如缺少通道設定中繼資料），讓安裝與更新冒煙檢查能捕捉到這些問題。預設 `status` 會保留快速唯讀路徑，略過 Plugin 驗證。
- 在 Linux systemd 安裝中，`status` 權杖漂移檢查會同時包含 `Environment=` 與 `EnvironmentFile=` 單元來源。
- 漂移檢查會使用合併後的執行階段 env 解析 `gateway.auth.token` SecretRefs（先使用服務命令 env，再後援至程序 env）。
- 如果權杖驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或 mode 未設定且密碼可勝出而沒有權杖候選可勝出），權杖漂移檢查會略過設定權杖解析。
- 當權杖驗證需要權杖且 `gateway.auth.token` 由 SecretRef 管理時，`install` 會驗證該 SecretRef 可解析，但不會將解析後的權杖持久化到服務環境中繼資料中。
- 如果權杖驗證需要權杖且已設定的權杖 SecretRef 未解析，安裝會以失敗關閉。
- 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被封鎖，直到明確設定 mode。
- 在 macOS 上，`install` 會讓 LaunchAgent plists 僅限擁有者存取，並透過僅限擁有者存取的檔案與包裝器載入受管理的服務環境值，而不是將 API 金鑰或 auth-profile env refs 序列化到 `EnvironmentVariables`。
- 如果你有意在同一台主機上執行多個 gateways，請隔離連接埠、設定/狀態與工作區；請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
- `restart --safe` 會要求正在執行的 Gateway 預檢作用中的工作，並在作用中工作耗盡後排程一次合併的重新啟動。一般 `restart` 會保留既有的服務管理器行為；`--force` 仍是立即覆寫路徑。
- `restart --safe --skip-deferral` 會執行 OpenClaw 感知的安全重新啟動，但繞過作用中工作延後閘門，因此即使回報封鎖項目，Gateway 也會立即發出重新啟動。這是操作員在卡住的任務執行釘住安全重新啟動時的逃生口；需要 `--safe`。

## 建議使用

使用 [`openclaw gateway`](/zh-TW/cli/gateway) 查看目前文件與範例。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 執行手冊](/zh-TW/gateway)
