---
read_when:
    - 你仍在指令碼中使用 `openclaw daemon ...`
    - 你需要服務生命週期命令（安裝/啟動/停止/重新啟動/狀態）
summary: '`openclaw daemon` 的命令列介面參考（閘道服務管理的舊版別名）'
title: 守護程序
x-i18n:
    generated_at: "2026-07-14T13:31:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

用於管理閘道服務的舊版別名。`openclaw daemon ...` 對應至與 `openclaw gateway ...` 相同的服務控制命令。目前的文件與範例請優先參閱 [`openclaw gateway`](/zh-TW/cli/gateway)。

## 用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令與選項

| 子命令  | 選項                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable`（僅限 launchd：持續抑制 KeepAlive/RunAtLoad，直到下次啟動） |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`：顯示服務安裝狀態（launchd/systemd/schtasks），並探測閘道健康狀態。
- `install`：安裝服務；`--force` 會重新安裝／覆寫現有安裝。
- `restart --safe`：要求執行中的閘道預先檢查進行中的工作，並在工作清空後排定一次合併重新啟動，受 `gateway.reload.deferralTimeoutMs` 限制（預設為 300000ms/5 分鐘；設為 `0` 可無限期等待）。此時間額度到期後，仍會強制重新啟動。一般的 `restart` 會直接使用服務管理員；`--force` 則是立即執行的覆寫選項。
- `restart --safe --skip-deferral`：略過進行中工作延後閘門，因此即使回報有阻擋因素，閘道也會立即重新啟動。需要搭配 `--safe`。

## 注意事項

- `status` 會在可能時解析已設定的驗證 SecretRef，以供探測驗證使用。如果必要的 SecretRef 尚未解析，`status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析祕密來源。一旦探測在其他方面成功，便會抑制未解析驗證的警告。
- `status --deep` 會加入盡力而為的系統層級掃描，以尋找其他類似閘道的服務（會顯示清理提示；仍建議每台機器僅執行一個閘道），並以支援外掛的模式執行設定驗證，呈現快速預設路徑略過的外掛資訊清單警告。
- 在 Linux systemd 安裝中，權杖偏移檢查會檢查 `Environment=` 與 `EnvironmentFile=` 兩種單元來源。
- 權杖偏移檢查會使用合併後的執行階段環境解析 `gateway.auth.token` SecretRef（先採用服務命令環境，再採用程序環境）。如果權杖驗證實際上未啟用（`gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或未設定且密碼能優先採用），便會略過設定權杖解析。
- `install` 會驗證由 SecretRef 管理的 `gateway.auth.token` 是否可解析，但絕不會將解析後的值持久儲存至服務環境中繼資料；若無法解析，安裝會以封閉方式失敗。
- 如果 `gateway.auth.token` 與 `gateway.auth.password` 均已設定，但 `gateway.auth.mode` 未設定，`install` 會阻擋操作，直到你明確設定模式。
- 在 macOS 上，`install` 會將 LaunchAgent plist 與產生的環境檔案／包裝程式限制為僅擁有者可存取（模式 `0600`/`0700`），而不是將祕密嵌入 `EnvironmentVariables`。
- 在同一主機上執行多個閘道：請隔離連接埠、設定／狀態和工作區。請參閱[多個閘道](/zh-TW/gateway#multiple-gateways-same-host)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
