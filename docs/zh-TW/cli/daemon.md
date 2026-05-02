---
read_when:
    - 你仍在腳本中使用 `openclaw daemon ...`
    - 你需要服務生命週期命令 (install/start/stop/restart/status)
summary: '`openclaw daemon` 的 CLI 參考資料（Gateway 服務管理的舊版別名）'
title: 常駐程式
x-i18n:
    generated_at: "2026-05-02T22:17:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 服務管理命令的舊版別名。

`openclaw daemon ...` 會對應到與 `openclaw gateway ...` 服務命令相同的服務控制介面。

## 使用方式

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
- `restart`：`--force`、`--wait <duration>`、`--json`
- 生命週期（`uninstall|start|stop`）：`--json`

注意事項：

- `status` 會在可能時解析已設定的驗證 SecretRefs 以供探測驗證使用。
- 如果必要的驗證 SecretRef 在此命令路徑中無法解析，當探測連線能力/驗證失敗時，`daemon status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析秘密來源。
- 如果探測成功，未解析的 auth-ref 警告會被抑制，以避免誤判。
- `status --deep` 會新增一次盡力而為的系統層級服務掃描。當它找到其他類似 gateway 的服務時，人類可讀輸出會列印清理提示，並警告每台機器仍然通常建議只執行一個 gateway。
- 在 Linux systemd 安裝中，`status` 的 token drift 檢查會包含 `Environment=` 和 `EnvironmentFile=` 兩種 unit 來源。
- Drift 檢查會使用合併後的執行時環境來解析 `gateway.auth.token` SecretRefs（先使用服務命令環境，再退回程序環境）。
- 如果 token 驗證並未實際啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或未設定 mode 且 password 可能勝出、沒有 token 候選可勝出），token drift 檢查會略過設定 token 解析。
- 當 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理時，`install` 會驗證該 SecretRef 可解析，但不會將解析後的 token 持久化到服務環境中繼資料。
- 如果 token 驗證需要 token，且已設定的 token SecretRef 無法解析，安裝會以關閉狀態失敗。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會被阻擋，直到明確設定 mode。
- 在 macOS 上，`install` 會讓 LaunchAgent plists 僅限擁有者存取，並透過僅限擁有者存取的檔案與 wrapper 載入受管理的服務環境值，而不是將 API keys 或 auth-profile env refs 序列化到 `EnvironmentVariables`。
- 如果你有意在同一台主機上執行多個 gateways，請隔離連接埠、設定/狀態和工作區；請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。

## 建議使用

目前的文件與範例請使用 [`openclaw gateway`](/zh-TW/cli/gateway)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway runbook](/zh-TW/gateway)
