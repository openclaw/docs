---
read_when:
    - 你正在使用命令列介面初始設定精靈進行首次執行設定
    - 你想要設定預設工作區路徑
    - 你需要給腳本使用的僅限基準設定旗標
summary: '`openclaw setup` 的命令列介面參考（onboarding 的別名，可透過旗標使用基準設定）'
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:13:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d99baef64a6fc6a1227c820866340fe5fd66b3cabd3ef5e9c34268272191021
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 會執行與 `openclaw onboard`
相同的引導式導覽設定流程
（驗證、工作區、閘道、通道、Skills、健康狀態）。當你
只需要初始化設定/工作區資料夾而不需要精靈時，請使用 `--baseline`。

`setup` 接受與 `openclaw onboard` 相同的導覽設定旗標，包括
驗證（`--auth-choice`、`--token`、提供者金鑰旗標）、閘道
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、重設（`--reset`、`--reset-scope`）、流程
（`--flow quickstart|advanced|manual|import`），以及略過旗標
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）。完整旗標參考與
非互動式範例請參閱[導覽設定](/zh-TW/cli/onboard)和
[命令列介面自動化](/zh-TW/start/wizard-cli-automation)；`openclaw onboard --modern`（Crestodian
對話式助理）沒有對應的 `setup` 等效項目。

<Note>
`openclaw setup` 用於可變設定安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，OpenClaw 會拒絕 setup 寫入，因為設定檔由 Nix 管理。請使用第一方 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或為其他 Nix 套件使用等效的來源設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 代理工作區目錄（預設 `~/.openclaw/workspace`；儲存為 `agents.defaults.workspace`）。 |
| `--baseline`               | 不進行導覽設定，建立基準設定/工作區/工作階段資料夾。                                |
| `--wizard`                 | 為相容性而接受；setup 預設會執行導覽設定。                                       |
| `--non-interactive`        | 不顯示提示並執行導覽設定。                                                                     |
| `--accept-risk`            | 確認完整系統代理存取風險；搭配 `--non-interactive` 時為必要。                       |
| `--mode <mode>`            | 導覽設定模式：`local` 或 `remote`。                                                               |
| `--flow <flow>`            | 導覽流程：`quickstart`、`advanced`、`manual` 或 `import`。                                      |
| `--reset`                  | 導覽設定前重設設定 + 認證資料 + 工作階段（只有搭配 `--reset-scope full` 時才包含工作區）。 |
| `--reset-scope <scope>`    | 重設範圍：`config`、`config+creds+sessions` 或 `full`。                                          |
| `--import-from <provider>` | 導覽設定期間要執行的遷移提供者。                                                        |
| `--import-source <path>`   | `--import-from` 的來源代理主目錄。                                                              |
| `--import-secrets`         | 導覽設定遷移期間匯入支援的秘密。                                               |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 遠端閘道權杖（選用）。                                                                    |
| `--json`                   | 輸出 JSON 摘要。                                                                              |

### 基準模式

`openclaw setup --baseline` 會保留較舊的僅基準行為：它會
建立設定、工作區和工作階段目錄，然後在不執行
導覽設定的情況下結束。

## 範例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 備註

- 基準 setup 後，請執行 `openclaw setup` 或 `openclaw onboard` 以完成完整的引導式旅程，執行 `openclaw configure` 進行目標式變更，或執行 `openclaw channels add` 新增通道帳號。
- 如果偵測到 Hermes 狀態，互動式導覽設定可以自動提供遷移。匯入導覽設定需要全新的 setup；若要在導覽設定之外取得試跑計畫、備份和覆寫模式，請使用[遷移](/zh-TW/cli/migrate)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [導覽設定](/zh-TW/cli/onboard)
- [導覽設定（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
