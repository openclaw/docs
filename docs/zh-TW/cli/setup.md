---
read_when:
    - 你正在進行首次執行設定，但未使用完整的 CLI 入門導覽
    - 您想要設定預設工作區路徑
summary: CLI 參考：`openclaw setup`（初始化設定 + 工作區）
title: 設定
x-i18n:
    generated_at: "2026-05-02T20:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 和代理工作區。

相關：

- 開始使用：[開始使用](/zh-TW/start/getting-started)
- CLI 導覽設定：[導覽設定 (CLI)](/zh-TW/start/wizard)

## 範例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 選項

- `--workspace <dir>`：代理工作區目錄（儲存為 `agents.defaults.workspace`）
- `--wizard`：執行導覽設定
- `--non-interactive`：不顯示提示並執行導覽設定
- `--mode <local|remote>`：導覽設定模式
- `--import-from <provider>`：在導覽設定期間執行的遷移提供者
- `--import-source <path>`：用於 `--import-from` 的來源代理主目錄
- `--import-secrets`：在導覽設定遷移期間匯入支援的密鑰
- `--remote-url <url>`：遠端 Gateway WebSocket 網址
- `--remote-token <token>`：遠端 Gateway 權杖

若要透過 setup 執行導覽設定：

```bash
openclaw setup --wizard
```

注意：

- 單純的 `openclaw setup` 會初始化設定 + 工作區，而不執行完整的導覽設定流程。
- 單純設定後，執行 `openclaw configure` 以選擇模型、頻道、Gateway、Plugin、Skills 或健康檢查。
- 當存在任何導覽設定旗標時，會自動執行導覽設定（`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`）。
- 如果偵測到 Hermes 狀態，互動式導覽設定可以自動提供遷移。匯入導覽設定需要全新的設定；若要在導覽設定之外進行試跑計畫、備份和覆寫模式，請使用 [遷移](/zh-TW/cli/migrate)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [安裝總覽](/zh-TW/install)
