---
read_when:
    - 你正在使用命令列介面新手引導精靈進行首次執行設定
    - 你想要設定預設工作區路徑
    - 你需要供指令碼使用的僅限基準設定旗標
summary: '`openclaw setup` 的命令列介面參考（onboarding 的別名，可透過旗標進行基準設定）'
title: 設定
x-i18n:
    generated_at: "2026-07-12T14:25:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 會執行與 `openclaw onboard` 相同的引導式初始設定流程：
它會先驗證並保存推論設定，接著啟動 Crestodian，以設定工作區、閘道、頻道、Skills 與健康狀態。若只需初始化設定與工作區資料夾，而不需要精靈，請使用 `--baseline`。

在引導模式中，`--workspace <dir>` 是向 Crestodian 提議的工作區；只有在你核准該提議後才會保存。基準、傳統及非互動式設定會透過各自的正常流程保存所提供的工作區。

`setup` 接受與 `openclaw onboard` 相同的初始設定旗標，包括
驗證（`--auth-choice`、`--token`、供應商金鑰旗標）、閘道
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、重設（`--reset`、`--reset-scope`）、流程
（`--flow quickstart|advanced|manual|import`），以及略過旗標
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）。如需完整旗標參考與
非互動式範例，請參閱[初始設定](/zh-TW/cli/onboard)與[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。`openclaw onboard --modern` 是受推論閘門控管的 Crestodian 助理之相容性別名，`setup` 沒有對應項目。

<Note>
`openclaw setup` 適用於可變更設定的安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，由於設定檔由 Nix 管理，OpenClaw 會拒絕設定寫入。請使用第一方的 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或其他 Nix 套件的對等原始碼設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 引導模式中的工作區提議；基準、傳統及非互動式設定會直接保存。 |
| `--baseline`               | 建立基準設定、工作區與工作階段資料夾，而不執行初始設定。                                  |
| `--wizard`                 | 為維持相容性而接受；設定預設會執行初始設定。                                         |
| `--non-interactive`        | 執行初始設定而不顯示提示。                                                                       |
| `--accept-risk`            | 確認代理程式具備完整系統存取權的風險；搭配 `--non-interactive` 時為必要項目。                         |
| `--mode <mode>`            | 初始設定模式：`local` 或 `remote`。                                                                 |
| `--flow <flow>`            | 初始設定流程：`quickstart`、`advanced`、`manual` 或 `import`。                                        |
| `--reset`                  | 在初始設定前重設設定、認證資訊及工作階段（工作區僅會在使用 `--reset-scope full` 時重設）。   |
| `--reset-scope <scope>`    | 重設範圍：`config`、`config+creds+sessions` 或 `full`。                                            |
| `--import-from <provider>` | 在初始設定期間執行移轉的供應商。                                                          |
| `--import-source <path>`   | `--import-from` 的來源代理程式主目錄。                                                                |
| `--import-secrets`         | 在初始設定移轉期間匯入支援的密鑰。                                                 |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                         |
| `--remote-token <token>`   | 遠端閘道權杖（選用）。                                                                      |
| `--json`                   | 輸出 JSON 摘要。                                                                                |

`--classic` 與 `--non-interactive` 互斥：傳統模式會開啟提供提示的精靈，而非互動式設定會使用自動化路徑。

### 基準模式

`openclaw setup --baseline` 會保留較舊的僅基準行為：它會建立設定、工作區及工作階段目錄，然後結束而不執行初始設定。

## 範例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事項

- 完成基準設定後，請執行 `openclaw setup` 或 `openclaw onboard` 以進行完整的引導流程、執行 `openclaw configure` 以進行特定變更，或執行 `openclaw channels add` 以新增頻道帳號。
- 若偵測到 Hermes 狀態，互動式初始設定可以自動提供移轉選項。匯入初始設定需要全新的設定；若要在初始設定之外使用試執行計畫、備份及覆寫模式，請使用[移轉](/zh-TW/cli/migrate)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [初始設定](/zh-TW/cli/onboard)
- [初始設定（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
