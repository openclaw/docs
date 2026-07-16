---
read_when:
    - 你想與 OpenClaw 對話，以進行設定或修復
    - 你正在使用新手引導精靈進行首次執行設定
    - 你想要設定預設工作區路徑
    - 腳本需要僅限基準的設定旗標
summary: '`openclaw setup` 的命令列介面參考（具備入門設定備援的系統代理程式聊天）'
title: 設定
x-i18n:
    generated_at: "2026-07-16T11:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 是系統代理程式的進入點。在已設定的系統上，直接執行
`openclaw setup` 會開啟互動式 OpenClaw 聊天。在全新的系統上，則會
轉入引導式初始設定。使用 `-m`/`--message` 執行單次請求，或使用
`--baseline` 在不使用精靈的情況下初始化設定／工作區資料夾。

路由順序：

1. 任何初始設定選項（`--wizard`、`--baseline`、工作區、重設、
   非互動式、流程、模式、閘道、常駐程式、略過、匯入、遠端或驗證
   選項）都會完全依照 `openclaw onboard` 的方式執行初始設定。
2. `-m`/`--message` 或 `--yes` 會執行系統代理程式。
3. 若沒有路由選項，已設定的互動式系統會開啟 OpenClaw。
   全新的系統則會執行初始設定。在已設定的系統上，即使沒有 TTY，`--json` 也會輸出
   系統概覽；若使用初始設定選項，則會保留初始設定的
   JSON 摘要。

在引導模式中，`--workspace <dir>` 是向 OpenClaw 提議的工作區；
只有在你核准該提議後才會持久儲存。基準、傳統和
非互動式設定會透過各自的正常流程持久儲存所提供的工作區。

引導式推論偵測會在 macOS 或 Linux 的閘道主機上執行。命令列介面
和 macOS 應用程式會呼叫由同一個閘道擁有的偵測器，該偵測器會檢查已設定的
模型、支援的命令列介面登入、API 金鑰環境變數，以及已
安裝的 Ollama 或 LM Studio 模型。此自動流程絕不會下載本機模型；
必須由選取的候選項實際回應一次補全要求，才會儲存其
供應商和模型設定。

`setup` 接受與 `openclaw onboard` 相同的初始設定旗標，包括
驗證（`--auth-choice`、`--token`、供應商金鑰旗標）、閘道
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、重設（`--reset`、`--reset-scope`）、流程
（`--flow quickstart|advanced|manual|import`）和略過旗標
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）。完整的旗標參考和
非互動式範例請參閱[初始設定](/zh-TW/cli/onboard)和
[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。`openclaw onboard --modern` 仍是相同
受推論閘控之 OpenClaw 助理的相容性進入點。

<Note>
`openclaw setup` 適用於可變更設定的安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 會拒絕寫入設定，因為設定檔由 Nix 管理。請使用第一方的 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或使用其他 Nix 套件的等效原始碼設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | 執行一次 OpenClaw 請求。                                                                             |
| `--yes`                    | 核准單次 `--message` 請求永久寫入設定。                                         |
| `--workspace <dir>`        | 引導模式中的工作區提議；基準、傳統和非互動式設定會直接持久儲存。 |
| `--baseline`               | 在不執行初始設定的情況下建立基準設定／工作區／工作階段資料夾。                                  |
| `--wizard`                 | 強制執行互動式初始設定。                                                                         |
| `--non-interactive`        | 在不提示的情況下執行初始設定。                                                                       |
| `--accept-risk`            | 確認完整系統代理程式存取風險；搭配 `--non-interactive` 時為必要選項。                         |
| `--mode <mode>`            | 初始設定模式：`local` 或 `remote`。                                                                 |
| `--flow <flow>`            | 初始設定流程：`quickstart`、`advanced`、`manual` 或 `import`。                                        |
| `--reset`                  | 在初始設定前重設設定＋認證資訊＋工作階段（僅搭配 `--reset-scope full` 時包含工作區）。   |
| `--reset-scope <scope>`    | 重設範圍：`config`、`config+creds+sessions` 或 `full`。                                            |
| `--import-from <provider>` | 初始設定期間執行的移轉供應商。                                                          |
| `--import-source <path>`   | `--import-from` 的來源代理程式主目錄。                                                                |
| `--import-secrets`         | 在初始設定移轉期間匯入支援的密鑰。                                                 |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                         |
| `--remote-token <token>`   | 遠端閘道權杖（選用）。                                                                      |
| `--json`                   | 已設定的系統：OpenClaw 概覽。初始設定路由：初始設定摘要。                           |

`--classic` 和 `--non-interactive` 互斥：傳統模式會開啟
具有提示的精靈，而非互動式設定則使用自動化路徑。

### 基準模式

`openclaw setup --baseline` 會保留較舊的僅限基準行為：它會
建立設定、工作區和工作階段目錄，然後結束而不
執行初始設定。

## 範例

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事項

- 完成基準設定後，執行 `openclaw onboard` 以進行完整的引導流程、執行 `openclaw configure` 以進行特定變更，或執行 `openclaw channels add` 以新增頻道帳號。
- 若偵測到 Hermes 狀態，互動式初始設定可自動提供移轉選項。匯入初始設定需要全新設定；若要在初始設定之外進行試執行規劃、備份和覆寫模式，請使用[移轉](/zh-TW/cli/migrate)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [初始設定](/zh-TW/cli/onboard)
- [初始設定（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
