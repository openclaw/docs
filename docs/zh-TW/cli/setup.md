---
read_when:
    - 你正在使用命令列介面入門精靈進行首次執行設定
    - 你想要設定預設工作區路徑
    - 你需要用於指令碼的僅基準線設定旗標
summary: '`openclaw setup` 的命令列介面參考（入門設定的別名，可透過旗標使用基準設定）'
title: 設定
x-i18n:
    generated_at: "2026-06-30T22:06:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

執行完整的命令列介面入門設定流程。`openclaw setup` 是 `openclaw onboard` 的別名；當你只需要初始化設定/工作區資料夾而不使用精靈時，請使用 `--baseline`。

<Note>
`openclaw setup` 用於可變設定安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 會拒絕設定寫入，因為設定檔由 Nix 管理。請使用第一方 [nix-openclaw 快速開始](https://github.com/openclaw/nix-openclaw#quick-start)，或使用其他 Nix 套件的等效來源設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 代理程式工作區目錄（預設為 `~/.openclaw/workspace`；儲存為 `agents.defaults.workspace`）。 |
| `--baseline`               | 不執行入門設定，建立基準設定/工作區/工作階段資料夾。                                |
| `--wizard`                 | 為相容性而接受；設定預設會執行入門設定。                                       |
| `--non-interactive`        | 不顯示提示執行入門設定。                                                                     |
| `--accept-risk`            | 確認完整系統代理程式存取風險；搭配 `--non-interactive` 時為必填。                       |
| `--mode <mode>`            | 入門設定模式：`local` 或 `remote`。                                                               |
| `--import-from <provider>` | 入門設定期間要執行的遷移提供者。                                                        |
| `--import-source <path>`   | `--import-from` 的來源代理程式主目錄。                                                              |
| `--import-secrets`         | 在入門設定遷移期間匯入支援的祕密。                                               |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 遠端閘道權杖（選用）。                                                                    |

### 基準模式

`openclaw setup --baseline` 會保留較舊的僅基準行為：它會建立設定、工作區和工作階段目錄，然後不執行入門設定就結束。

## 範例

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事項

- 單純執行 `openclaw setup` 會執行與 `openclaw onboard` 相同的引導流程。
- 完成基準設定後，請執行 `openclaw setup` 或 `openclaw onboard` 以進行完整引導流程，執行 `openclaw configure` 進行目標式變更，或執行 `openclaw channels add` 新增頻道帳號。
- 如果偵測到 Hermes 狀態，互動式入門設定可以自動提供遷移。匯入入門設定需要全新設定；若要在入門設定之外進行試跑計畫、備份和覆寫模式，請使用[遷移](/zh-TW/cli/migrate)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [入門設定（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
