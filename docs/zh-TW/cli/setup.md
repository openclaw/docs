---
read_when:
    - 你正在使用命令列介面初始設定精靈進行首次執行設定
    - 您想要設定預設工作區路徑
    - 你需要供指令碼使用的僅限基準設定旗標
summary: '`openclaw setup` 的命令列介面參考（onboarding 的別名，可透過旗標執行基準設定）'
title: 設定
x-i18n:
    generated_at: "2026-07-11T21:13:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 會執行與 `openclaw onboard` 相同的引導式上手流程：
它會先驗證並保存推論設定，接著啟動 Crestodian，以設定工作區、閘道、頻道、Skills 與健康狀態。若只需初始化設定與工作區資料夾，而不需要精靈，請使用 `--baseline`。

在引導模式中，`--workspace <dir>` 是向 Crestodian 提議的工作區；只有在您核准該提議後才會保存。基準、傳統及非互動式設定會透過各自的正常流程保存所提供的工作區。

`setup` 接受與 `openclaw onboard` 相同的上手旗標，包括驗證（`--auth-choice`、`--token`、供應商金鑰旗標）、閘道（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、Tailscale（`--tailscale`）、重設（`--reset`、`--reset-scope`）、流程（`--flow quickstart|advanced|manual|import`），以及略過旗標（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、`--skip-health`、`--skip-ui`、`--skip-hooks`）。如需完整的旗標參考與非互動式範例，請參閱[上手設定](/zh-TW/cli/onboard)與[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。`openclaw onboard --modern` 是受推論閘控的 Crestodian 助理之相容性別名，沒有對應的 `setup` 選項。

<Note>
`openclaw setup` 適用於可變更的設定安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，由於設定檔由 Nix 管理，OpenClaw 會拒絕寫入設定。請使用第一方的 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或為其他 Nix 套件使用等效的原始碼設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 引導模式中的工作區提議；基準、傳統及非互動式設定會直接保存。 |
| `--baseline`               | 不執行上手流程，建立基準設定、工作區與工作階段資料夾。                                  |
| `--wizard`                 | 為相容性而接受；設定預設會執行上手流程。                                         |
| `--non-interactive`        | 不顯示提示地執行上手流程。                                                                       |
| `--accept-risk`            | 確認代理程式具有完整系統存取權的風險；搭配 `--non-interactive` 時為必要選項。                         |
| `--mode <mode>`            | 上手模式：`local` 或 `remote`。                                                                 |
| `--flow <flow>`            | 上手流程：`quickstart`、`advanced`、`manual` 或 `import`。                                        |
| `--reset`                  | 在上手前重設設定、憑證與工作階段（僅在使用 `--reset-scope full` 時重設工作區）。   |
| `--reset-scope <scope>`    | 重設範圍：`config`、`config+creds+sessions` 或 `full`。                                            |
| `--import-from <provider>` | 要在上手期間執行的遷移供應商。                                                          |
| `--import-source <path>`   | `--import-from` 的來源代理程式主目錄。                                                                |
| `--import-secrets`         | 在上手遷移期間匯入支援的密鑰。                                                 |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                         |
| `--remote-token <token>`   | 遠端閘道權杖（選用）。                                                                      |
| `--json`                   | 輸出 JSON 摘要。                                                                                |

`--classic` 與 `--non-interactive` 互斥：傳統模式會開啟含提示的精靈，而非互動式設定則使用自動化路徑。

### 基準模式

`openclaw setup --baseline` 會保留較舊的純基準行為：建立設定、工作區與工作階段目錄，然後結束而不執行上手流程。

## 範例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事項

- 完成基準設定後，執行 `openclaw setup` 或 `openclaw onboard` 以進行完整的引導流程；執行 `openclaw configure` 以進行特定變更；或執行 `openclaw channels add` 以新增頻道帳戶。
- 若偵測到 Hermes 狀態，互動式上手流程可以自動提供遷移選項。匯入上手流程需要全新的設定；若要在上手流程之外使用試執行計畫、備份及覆寫模式，請參閱[遷移](/zh-TW/cli/migrate)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [上手設定](/zh-TW/cli/onboard)
- [上手設定（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
