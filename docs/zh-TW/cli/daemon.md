---
read_when:
    - 你仍然在腳本中使用 `openclaw daemon ...`
    - 您需要服務生命週期指令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 參考（Gateway 服務管理的舊版別名）'
title: 常駐程式
x-i18n:
    generated_at: "2026-05-04T18:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 服務管理命令的舊版別名。

`openclaw daemon ...` 會對應到與 `openclaw gateway ...` 服務命令相同的服務控制介面。

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

- `status`: 顯示服務安裝狀態並探查 Gateway 健全狀態
- `install`: 安裝服務（`launchd`/`systemd`/`schtasks`）
- `uninstall`: 移除服務
- `start`: 啟動服務
- `stop`: 停止服務
- `restart`: 重新啟動服務

## 常用選項

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- 生命週期（`uninstall|start|stop`）：`--json`

注意事項：

- `status` 會在可行時解析已設定的驗證 SecretRefs，以供探查驗證使用。
- 如果此命令路徑中必要的驗證 SecretRef 無法解析，當探查連線能力或驗證失敗時，`daemon status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析祕密來源。
- 如果探查成功，未解析的 auth-ref 警告會被抑制，以避免誤判。
- `status --deep` 會加入盡力而為的系統層級服務掃描。當它找到其他類似 Gateway 的服務時，人類可讀輸出會列印清理提示，並警告每台機器一個 Gateway 仍是一般建議。
- 在 Linux systemd 安裝中，`status` 權杖漂移檢查會同時包含 `Environment=` 與 `EnvironmentFile=` 單元來源。
- 漂移檢查會使用合併後的執行階段環境（先使用服務命令環境，再回退到程序環境）解析 `gateway.auth.token` SecretRefs。
- 如果權杖驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或模式未設定且密碼可能優先、也沒有權杖候選可優先），權杖漂移檢查會略過設定權杖解析。
- 當權杖驗證需要權杖且 `gateway.auth.token` 由 SecretRef 管理時，`install` 會驗證該 SecretRef 可解析，但不會將解析後的權杖持久化到服務環境中繼資料。
- 如果權杖驗證需要權杖，而已設定的權杖 SecretRef 無法解析，安裝會以關閉狀態失敗。
- 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被阻止，直到明確設定模式為止。
- 在 macOS 上，`install` 會讓 LaunchAgent plist 僅限擁有者存取，並透過僅限擁有者存取的檔案與包裝器載入受管理的服務環境值，而不是將 API 金鑰或 auth-profile 環境參照序列化到 `EnvironmentVariables`。
- 如果你有意在同一部主機上執行多個 Gateway，請隔離連接埠、設定/狀態與工作區；請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
- `restart --safe` 會要求執行中的 Gateway 預先檢查作用中的工作，並在作用中工作清空後排程一次合併後的重新啟動。一般的 `restart` 會保留現有的服務管理器行為；`--force` 仍是立即覆寫路徑。

## 建議

請使用 [`openclaw gateway`](/zh-TW/cli/gateway) 取得目前文件與範例。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 執行手冊](/zh-TW/gateway)
