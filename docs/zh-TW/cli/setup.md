---
read_when:
    - 你正在進行首次執行設定，但未使用完整的 CLI 初始引導
    - 您想要設定預設工作區路徑
summary: '`openclaw setup` 的 CLI 參考（初始化設定 + 工作區）'
title: 設定
x-i18n:
    generated_at: "2026-05-06T17:54:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 與代理工作區。

<Note>
`openclaw setup` 用於可變設定安裝。在 Nix 模式 (`OPENCLAW_NIX_MODE=1`) 中，OpenClaw 會拒絕 setup 寫入，因為設定檔由 Nix 管理。代理應使用第一方 [nix-openclaw 快速開始](https://github.com/openclaw/nix-openclaw#quick-start)，或另一個 Nix 套件的等效來源設定。
</Note>

相關：

- 開始使用：[開始使用](/zh-TW/start/getting-started)
- CLI 初始設定：[初始設定 (CLI)](/zh-TW/start/wizard)

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
- `--wizard`：執行初始設定
- `--non-interactive`：不顯示提示並執行初始設定
- `--mode <local|remote>`：初始設定模式
- `--import-from <provider>`：初始設定期間要執行的遷移提供者
- `--import-source <path>`：`--import-from` 的來源代理主目錄
- `--import-secrets`：在初始設定遷移期間匯入支援的密鑰
- `--remote-url <url>`：遠端 Gateway WebSocket URL
- `--remote-token <token>`：遠端 Gateway token

若要透過 setup 執行初始設定：

```bash
openclaw setup --wizard
```

注意事項：

- 純 `openclaw setup` 會初始化設定與工作區，而不執行完整的初始設定流程。
- 完成純 setup 後，執行 `openclaw configure` 以選擇模型、頻道、Gateway、Plugin、Skills 或健康檢查。
- 只要存在任何初始設定旗標，初始設定就會自動執行（`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`）。
- 如果偵測到 Hermes 狀態，互動式初始設定可以自動提供遷移。匯入初始設定需要全新的 setup；若要在初始設定之外進行試執行計畫、備份與覆寫模式，請使用[遷移](/zh-TW/cli/migrate)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [安裝概覽](/zh-TW/install)
