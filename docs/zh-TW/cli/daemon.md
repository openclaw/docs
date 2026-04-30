---
read_when:
    - 你仍在 scripts 中使用 `openclaw daemon ...`
    - 你需要服務生命週期指令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 參考（Gateway 服務管理的舊版別名）'
title: 常駐程式
x-i18n:
    generated_at: "2026-04-30T02:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
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
- 生命週期（`uninstall|start|stop|restart`）：`--json`

注意事項：

- `status` 會在可能時解析已設定的 auth SecretRefs，以用於探測驗證。
- 如果此命令路徑中所需的 auth SecretRef 未解析，當探測連線能力/驗證失敗時，`daemon status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析祕密來源。
- 如果探測成功，未解析的 auth-ref 警告會被抑制，以避免誤判。
- `status --deep` 會加入盡力而為的系統層級服務掃描。當它找到其他類似 gateway 的服務時，人類可讀輸出會列印清理提示，並警告每台機器一個 gateway 仍是一般建議。
- 在 Linux systemd 安裝中，`status` 權杖漂移檢查會同時包含 `Environment=` 和 `EnvironmentFile=` 單元來源。
- 漂移檢查會使用合併後的執行階段環境解析 `gateway.auth.token` SecretRefs（先用服務命令環境，再退回程序環境）。
- 如果權杖驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或模式未設定且密碼可勝出、沒有權杖候選可勝出），權杖漂移檢查會略過設定權杖解析。
- 當權杖驗證需要權杖且 `gateway.auth.token` 由 SecretRef 管理時，`install` 會驗證 SecretRef 可解析，但不會將解析後的權杖持久化到服務環境中繼資料。
- 如果權杖驗證需要權杖，而已設定的權杖 SecretRef 未解析，安裝會以關閉方式失敗。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被封鎖，直到明確設定模式。
- 在 macOS 上，`install` 會讓 LaunchAgent plists 僅限擁有者存取，並透過僅限擁有者存取的檔案和 wrapper 載入受管理的服務環境值，而不是將 API 金鑰或 auth-profile 環境參照序列化到 `EnvironmentVariables`。
- 如果你刻意在同一台主機上執行多個 gateways，請隔離連接埠、設定/狀態和工作區；請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。

## 建議

請使用 [`openclaw gateway`](/zh-TW/cli/gateway) 查看目前的文件與範例。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway runbook](/zh-TW/gateway)
