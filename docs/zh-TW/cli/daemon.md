---
read_when:
    - 你仍在指令碼中使用 `openclaw daemon ...`
    - 你需要服務生命週期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 參考（Gateway 服務管理的舊版別名）'
title: 守護程式
x-i18n:
    generated_at: "2026-05-10T19:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 服務管理命令的舊版別名。

`openclaw daemon ...` 對應到與 `openclaw gateway ...` 服務命令相同的服務控制介面。

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
- `restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
- 生命週期（`uninstall|start|stop`）：`--json`

注意事項：

- `status` 會在可能時解析設定的驗證 SecretRefs，以用於探測驗證。
- 如果此命令路徑中必要的驗證 SecretRef 未解析，當探測連線能力/驗證失敗時，`daemon status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析秘密來源。
- 如果探測成功，未解析 auth-ref 警告會被抑制，以避免誤判。
- `status --deep` 會加入盡力而為的系統層級服務掃描。當它找到其他類 Gateway 服務時，給人閱讀的輸出會列印清理提示，並警告每台機器一個 Gateway 仍然是一般建議。
- 在 Linux systemd 安裝中，`status` token 漂移檢查會同時包含 `Environment=` 和 `EnvironmentFile=` 單元來源。
- 漂移檢查會使用合併後的執行階段 env 解析 `gateway.auth.token` SecretRefs（先使用服務命令 env，接著以程序 env 作為備援）。
- 如果 token 驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或模式未設定且 password 可勝出、同時沒有 token 候選可勝出），token 漂移檢查會跳過設定 token 解析。
- 當 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理時，`install` 會驗證 SecretRef 可解析，但不會將解析後的 token 持久化到服務環境中繼資料。
- 如果 token 驗證需要 token，且設定的 token SecretRef 未解析，安裝會封閉式失敗。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被封鎖，直到明確設定模式為止。
- 在 macOS 上，`install` 會讓 LaunchAgent plists 僅限擁有者存取，並透過僅限擁有者存取的檔案和包裝器載入受管理的服務環境值，而不是將 API keys 或 auth-profile env refs 序列化到 `EnvironmentVariables`。
- 如果你有意在同一台主機上執行多個 Gateway，請隔離連接埠、設定/狀態和工作區；請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
- `restart --safe` 會要求執行中的 Gateway 預先檢查作用中的工作，並在作用中工作排空後排程一次合併的重新啟動。單純的 `restart` 會保留既有的服務管理器行為；`--force` 仍是立即覆寫路徑。
- `restart --safe --skip-deferral` 會執行 OpenClaw 感知的安全重新啟動，但略過作用中工作延遲閘門，因此即使回報阻擋項目，Gateway 也會立即發出重新啟動。這是當卡住的任務執行鎖住安全重新啟動時的操作員逃生口；需要 `--safe`。

## 建議使用

使用 [`openclaw gateway`](/zh-TW/cli/gateway) 取得目前文件與範例。

## 相關內容

- [CLI 參考](/zh-TW/cli)
- [Gateway 執行手冊](/zh-TW/gateway)
