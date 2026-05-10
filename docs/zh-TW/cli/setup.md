---
read_when:
    - 您正在不透過完整 CLI 初始導引流程進行首次執行設定
    - 您想要設定預設工作區路徑
    - 你需要每個旗標，以及 setup 如何在基準模式與精靈模式之間做出決定
summary: '`openclaw setup` 的 CLI 參考（初始化設定與工作區，並可選擇執行入門流程）'
title: 設定
x-i18n:
    generated_at: "2026-05-10T19:29:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化基準設定和代理程式工作區。若存在任何入門設定旗標，也會執行精靈。

<Note>
`openclaw setup` 用於可變更的設定安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，OpenClaw 會拒絕 setup 寫入，因為設定檔由 Nix 管理。請使用第一方 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或其他 Nix 套件的等效原始設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 代理程式工作區目錄（預設為 `~/.openclaw/workspace`；儲存為 `agents.defaults.workspace`）。 |
| `--wizard`                 | 執行互動式入門設定。                                                                         |
| `--non-interactive`        | 不顯示提示並執行入門設定。                                                                     |
| `--mode <mode>`            | 入門設定模式：`local` 或 `remote`。                                                               |
| `--import-from <provider>` | 入門設定期間要執行的遷移提供者。                                                        |
| `--import-source <path>`   | `--import-from` 的來源代理程式主目錄。                                                              |
| `--import-secrets`         | 在入門設定遷移期間匯入支援的機密。                                               |
| `--remote-url <url>`       | 遠端 Gateway WebSocket URL。                                                                       |
| `--remote-token <token>`   | 遠端 Gateway 權杖（選用）。                                                                    |

### 精靈自動觸發

當明確存在以下任一旗標時，即使沒有 `--wizard`，`openclaw setup` 也會執行精靈：

`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`。

## 範例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事項

- 一般的 `openclaw setup` 會初始化設定和工作區，而不會執行完整的入門設定流程。
- 完成一般 setup 後，執行 `openclaw onboard` 進行完整引導流程，執行 `openclaw configure` 進行目標式變更，或執行 `openclaw channels add` 新增頻道帳戶。
- 如果偵測到 Hermes 狀態，互動式入門設定可以自動提供遷移選項。匯入入門設定需要全新的 setup；若要在入門設定之外產生試跑計畫、備份和使用覆寫模式，請使用 [遷移](/zh-TW/cli/migrate)。

## 相關內容

- [CLI 參考](/zh-TW/cli)
- [入門設定 (CLI)](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
