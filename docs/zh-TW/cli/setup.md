---
read_when:
    - 你想要與 OpenClaw 對話，以進行設定或修復
    - 你正在使用新手引導精靈進行首次設定
    - 你想要設定預設工作區路徑
    - 你需要供指令碼使用的僅限基準設定旗標
summary: '`openclaw setup` 的命令列介面參考（具備新手引導備援的系統代理程式聊天）'
title: 設定
x-i18n:
    generated_at: "2026-07-21T08:58:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3b4f70f2631683fcb03007a80fe43a06387be3d7e4d533381e5e536333af051
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` 是系統代理程式的進入點。在已設定的系統上，直接執行
`openclaw setup` 會開啟互動式 OpenClaw 聊天。在全新系統上，它會
轉入引導式初始設定。使用 `-m`/`--message` 執行單一請求，或使用
`--baseline` 在不使用精靈的情況下初始化設定／工作區資料夾。

路由順序：

1. 任何初始設定選項（`--wizard`、`--baseline`、工作區、重設、
   非互動式、流程、模式、閘道、常駐程式、略過、匯入、遠端或驗證
   選項）都會完全依照 `openclaw onboard` 的方式執行初始設定。
2. `-m`/`--message` 或 `--yes` 會執行系統代理程式。
3. 沒有路由選項時，已設定的互動式系統會開啟 OpenClaw。全新
   系統則會執行初始設定。在已設定的系統上，即使沒有 TTY，`--json` 也會輸出
   系統概覽；若使用初始設定選項，則會保留初始設定的
   JSON 摘要。

在引導式模式中，`--workspace <dir>` 是向 OpenClaw 提議的工作區；
只有在你核准該提議後才會持久儲存。基準、傳統和
非互動式設定會在全新安裝時，透過各自的正常流程持久儲存所提供的工作區。
當現有代理程式名冊將被重新對應時，
傳統精靈會要求明確確認；非互動式設定則會保留
目前的代理程式群工作區並輸出警告。

引導式推論偵測會在 macOS 或 Linux 的閘道主機上執行。命令列介面
和 macOS 應用程式會呼叫同一個由閘道負責的偵測器，該偵測器會檢查已設定的
模型、支援的命令列介面登入、API 金鑰環境變數，以及已
安裝的 Ollama 或 LM Studio 模型。這個自動程序絕不會下載本機模型。
在命令列介面與 API 金鑰候選項目之後，系統會自動測試偵測到的本機執行環境；
如果有多個本機模型可用，OpenClaw 會優先選擇
工具呼叫能力最強的指令微調模型系列。選定的候選項目必須能回應一次
實際的補全請求，系統才會儲存其提供者與模型設定。
系統也會回報已安裝的 Gemini、Antigravity、Pi 和 OpenCode 命令列介面，即使
它們無法作為引導式設定中可重複使用的推論路由。

`setup` 接受與 `openclaw onboard` 相同的初始設定旗標，包括
驗證（`--auth-choice`、`--token`、提供者金鑰旗標）、閘道
（`--gateway-port`、`--gateway-bind`、`--gateway-auth`、`--install-daemon`）、
Tailscale（`--tailscale`）、重設（`--reset`、`--reset-scope`）、流程
（`--flow quickstart|advanced|manual|import`）及略過旗標
（`--skip-channels`、`--skip-skills`、`--skip-bootstrap`、`--skip-search`、
`--skip-health`、`--skip-ui`、`--skip-hooks`）。傳入 `--tui` 可使用與
`openclaw onboard --tui` 相同的終端替代流程。請參閱[初始設定](/zh-TW/cli/onboard)和
[命令列介面自動化](/zh-TW/start/wizard-cli-automation)，以取得完整旗標參考和
非互動式範例。`openclaw onboard --modern` 仍作為相同推論閘控
OpenClaw 助理的相容性進入點。

<Note>
`openclaw setup` 適用於設定可變更的安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 會拒絕寫入設定，因為設定檔由 Nix 管理。請使用第一方的 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或其他 Nix 套件的等效來源設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | 執行一個 OpenClaw 請求。                                                                            |
| `--yes`                    | 核准針對一個 `--message` 請求持久寫入設定。                                        |
| `--workspace <dir>`        | 工作區提議；現有代理程式群需要傳統模式確認，非互動式執行時則會保留。 |
| `--baseline`               | 在不執行初始設定的情況下建立基準設定／工作區／工作階段資料夾。                                 |
| `--wizard`                 | 強制執行互動式初始設定。                                                                        |
| `--tui`                    | 使用終端替代流程，而非瀏覽器交接。                                               |
| `--non-interactive`        | 執行初始設定而不顯示提示。                                                                      |
| `--accept-risk`            | 確認全系統代理程式存取風險；搭配 `--non-interactive` 時為必要選項。                        |
| `--mode <mode>`            | 初始設定模式：`local` 或 `remote`。                                                                |
| `--flow <flow>`            | 初始設定流程：`quickstart`、`advanced`、`manual` 或 `import`。                                       |
| `--reset`                  | 在初始設定前重設設定＋認證資訊＋工作階段（只有搭配 `--reset-scope full` 時才重設工作區）。  |
| `--reset-scope <scope>`    | 重設範圍：`config`、`config+creds+sessions` 或 `full`。                                           |
| `--import-from <provider>` | 在初始設定期間執行的遷移提供者。                                                         |
| `--import-source <path>`   | `--import-from` 的來源代理程式主目錄。                                                               |
| `--import-secrets`         | 在初始設定遷移期間匯入支援的密鑰。                                                |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                        |
| `--remote-token <token>`   | 遠端閘道權杖（選填）。                                                                     |
| `--json`                   | 已設定的系統：OpenClaw 概覽。初始設定路由：初始設定摘要。                          |

`--classic` 和 `--non-interactive` 互斥：傳統模式會開啟
提示式精靈，而非互動式設定則會使用自動化路徑。
在互動式初始設定中，`--remote-url` 和 `--remote-token` 會預先填入
遠端閘道步驟，且在該次執行中優先於已儲存的遠端值。
除非你也傳入權杖，否則變更 URL 不會重複使用已儲存的認證資訊。
權杖會保持遮罩顯示，並使用精靈所選的純文字或 SecretRef
儲存模式。

### 基準模式

`openclaw setup --baseline` 會保留舊版僅基準的行為：它會
建立設定、工作區和工作階段目錄，然後結束而不
執行初始設定。它接受 `--workspace` 和不影響行為的輸出控制項，但
會拒絕明確的初始設定、閘道、驗證、重設或常駐程式選項，而不是
默默忽略它們。如果現有設定無效，基準設定會保留
該設定，並要求你先執行 `openclaw doctor` 再重試。

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

- 完成基準設定後，執行 `openclaw onboard` 以進行完整的引導式流程、執行 `openclaw configure` 以進行特定變更，或執行 `openclaw channels add` 以新增頻道帳號。
- 如果偵測到 Hermes 狀態，互動式初始設定可自動提供遷移選項。匯入初始設定需要全新設定；若要在初始設定之外使用試執行計畫、備份和覆寫模式，請使用[遷移](/zh-TW/cli/migrate)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [初始設定](/zh-TW/cli/onboard)
- [初始設定（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
