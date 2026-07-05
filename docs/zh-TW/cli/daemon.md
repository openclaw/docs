---
read_when:
    - 你仍然在指令碼中使用 `openclaw daemon ...`
    - 你需要服務生命週期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的命令列介面參考（閘道服務管理的舊版別名）'
title: 常駐程式
x-i18n:
    generated_at: "2026-07-05T11:10:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

用於閘道服務管理的舊版別名。`openclaw daemon ...` 會對應到與 `openclaw gateway ...` 相同的服務控制命令。目前的文件與範例請優先參閱 [`openclaw gateway`](/zh-TW/cli/gateway)。

## 使用方式

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令與選項

| 子命令      | 選項                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable`（僅限 launchd：持續抑制 KeepAlive/RunAtLoad，直到下次啟動）                |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`：顯示服務安裝狀態（launchd/systemd/schtasks），並探測閘道健康狀態。
- `install`：安裝服務；`--force` 會重新安裝/覆寫既有安裝。
- `restart --safe`：要求執行中的閘道預檢作用中的工作，並在工作排空後排程一次合併的重新啟動，受 `gateway.reload.deferralTimeoutMs` 限制（預設 300000ms/5 分鐘；設為 `0` 可無限期等待）。當該預算到期時，仍會強制重新啟動。一般 `restart` 會直接使用服務管理器；`--force` 是立即覆寫。
- `restart --safe --skip-deferral`：略過作用中工作延後閘門，因此即使回報阻擋項，閘道也會立即重新啟動。需要 `--safe`。

## 備註

- `status` 會在可行時解析已設定的驗證 SecretRefs 以供探測驗證使用。如果必要的 SecretRef 未解析，`status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析祕密來源。一旦探測在其他方面成功，就會抑制未解析驗證警告。
- `status --deep` 會加入盡力而為的系統層級掃描，尋找其他類閘道服務（列印清理提示；仍建議每台機器一個閘道），並以外掛感知模式執行設定驗證，浮現快速預設路徑會略過的外掛資訊清單警告。
- 在 Linux systemd 安裝中，權杖漂移檢查會檢查 `Environment=` 和 `EnvironmentFile=` 這兩種 unit 來源。
- 權杖漂移檢查會使用合併後的執行階段 env（先是服務命令 env，接著是程序 env）解析 `gateway.auth.token` SecretRefs。如果權杖驗證實際上未啟用（`gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或未設定且密碼可勝出），則會略過設定權杖解析。
- `install` 會驗證由 SecretRef 管理的 `gateway.auth.token` 可解析，但絕不會將解析後的值持久化到服務環境中繼資料；如果無法解析，安裝會安全失敗。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，`install` 會封鎖直到你明確設定模式。
- 在 macOS 上，`install` 會讓 LaunchAgent plists 和產生的 env 檔案/wrapper 僅限擁有者存取（模式 `0600`/`0700`），而不是在 `EnvironmentVariables` 中嵌入祕密。
- 在同一台主機上執行多個閘道：隔離連接埠、設定/狀態和工作區。請參閱[多個閘道](/zh-TW/gateway#multiple-gateways-same-host)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
