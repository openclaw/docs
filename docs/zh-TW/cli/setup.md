---
read_when:
    - 你正在進行首次執行設定，但未使用完整的 CLI 入門導引
    - 你想要設定預設工作區路徑
summary: '`openclaw setup` 的 CLI 參考（初始化設定 + 工作區）'
title: 設定
x-i18n:
    generated_at: "2026-04-30T02:56:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 與代理工作區。

相關：

- 開始使用：[開始使用](/zh-TW/start/getting-started)
- CLI 入門導覽：[入門導覽（CLI）](/zh-TW/start/wizard)

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
- `--wizard`：執行入門導覽
- `--non-interactive`：不顯示提示並執行入門導覽
- `--mode <local|remote>`：入門導覽模式
- `--import-from <provider>`：入門導覽期間要執行的遷移提供者
- `--import-source <path>`：`--import-from` 的來源代理主目錄
- `--import-secrets`：在入門導覽遷移期間匯入支援的秘密
- `--remote-url <url>`：遠端 Gateway WebSocket URL
- `--remote-token <token>`：遠端 Gateway 權杖

若要透過 setup 執行入門導覽：

```bash
openclaw setup --wizard
```

注意事項：

- 單純執行 `openclaw setup` 會初始化設定與工作區，而不會執行完整的入門導覽流程。
- 當任何入門導覽旗標存在時，會自動執行入門導覽（`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`）。
- 如果偵測到 Hermes 狀態，互動式入門導覽可以自動提供遷移。匯入入門導覽需要全新設定；若要在入門導覽之外進行試跑計畫、備份與覆寫模式，請使用[遷移](/zh-TW/cli/migrate)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [安裝概觀](/zh-TW/install)
