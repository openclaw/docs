---
read_when:
    - 你仍在 scripts 中使用 `openclaw daemon ...`
    - 你需要服務生命週期命令（安裝/啟動/停止/重新啟動/狀態）
summary: '`openclaw daemon` 的命令列介面參考（閘道服務管理的舊版別名）'
title: 常駐程式
x-i18n:
    generated_at: "2026-06-30T13:47:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

閘道服務管理命令的舊版別名。

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

- `status`：顯示服務安裝狀態並探測閘道健康狀態
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

- `status` 會在可行時解析已設定的驗證 SecretRefs，以供探測驗證使用。
- 如果必要的驗證 SecretRef 在這個命令路徑中未解析，`daemon status --json` 會在探測連線能力/驗證失敗時回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析秘密來源。
- 如果探測成功，未解析的 auth-ref 警告會被抑制，以避免誤報。
- `status --deep` 會加入盡力而為的系統層級服務掃描。當它找到其他類似閘道的服務時，人類可讀輸出會列印清理提示，並警告每台機器一個閘道仍是一般建議。
- `status --deep` 也會以外掛感知模式執行設定驗證，並顯示已設定外掛的 manifest 警告（例如缺少通道設定 metadata），讓安裝與更新煙霧檢查能捕捉到這些問題。預設 `status` 保持快速唯讀路徑，會略過外掛驗證。
- 在 Linux systemd 安裝中，`status` token-drift 檢查會同時包含 `Environment=` 和 `EnvironmentFile=` 單元來源。
- 漂移檢查會使用合併後的執行階段 env（先用服務命令 env，然後以程序 env 作為 fallback）解析 `gateway.auth.token` SecretRefs。
- 如果 token 驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或 mode 未設定且 password 可能勝出、沒有 token 候選可以勝出），token-drift 檢查會略過設定 token 解析。
- 當 token 驗證需要 token 且 `gateway.auth.token` 由 SecretRef 管理時，`install` 會驗證該 SecretRef 可解析，但不會將解析出的 token 持久化到服務環境 metadata。
- 如果 token 驗證需要 token，而已設定的 token SecretRef 未解析，安裝會以關閉失敗。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被阻擋，直到明確設定 mode。
- 在 macOS 上，`install` 會讓 LaunchAgent plists 僅限擁有者存取，並透過僅限擁有者存取的檔案和 wrapper 載入受管理的服務環境值，而不是將 API keys 或 auth-profile env refs 序列化到 `EnvironmentVariables`。
- 如果你有意在同一台主機上執行多個閘道，請隔離連接埠、設定/狀態與工作區；請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
- `restart --safe` 會要求執行中的閘道對作用中的工作進行預檢，並在作用中工作排空後排程一次合併後的重新啟動。預設安全重新啟動會等待作用中工作，最長到已設定的 `gateway.reload.deferralTimeoutMs`（預設 5 分鐘）；當該預算到期時，重新啟動會被強制執行。將 `gateway.reload.deferralTimeoutMs` 設為 `0` 可進行無限期安全等待，永不強制。一般 `restart` 會保留既有的 service-manager 行為；`--force` 仍是立即覆寫路徑。
- `restart --safe --skip-deferral` 會執行 OpenClaw 感知的安全重新啟動，但繞過作用中工作延遲閘門，因此即使回報了阻擋項，閘道也會立即發出重新啟動。這是當卡住的任務執行釘住安全重新啟動時，操作員可用的逃生口；需要 `--safe`。

## 建議使用

目前文件與範例請使用 [`openclaw gateway`](/zh-TW/cli/gateway)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道 runbook](/zh-TW/gateway)
