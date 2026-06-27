---
read_when:
    - 你正在進行首次執行設定，但未使用完整的命令列介面 onboarding
    - 您想要設定預設工作區路徑
    - 你需要每個旗標，以及設定如何在基準模式與精靈模式之間做決定
summary: 命令列介面參考：`openclaw setup`（初始化設定與工作區，並可選擇執行入門設定）
title: 設定
x-i18n:
    generated_at: "2026-06-27T19:08:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

初始化基準設定與代理工作區。若出現任何導覽旗標，也會執行精靈。

<Note>
`openclaw setup` 適用於可變設定安裝。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，OpenClaw 會拒絕設定寫入，因為設定檔由 Nix 管理。請使用第一方 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，或為其他 Nix 套件使用等效的來源設定。
</Note>

## 選項

| 旗標                       | 說明                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 代理工作區目錄（預設 `~/.openclaw/workspace`；儲存為 `agents.defaults.workspace`）。 |
| `--wizard`                 | 執行互動式導覽。                                                                         |
| `--non-interactive`        | 不提示地執行導覽。                                                                     |
| `--accept-risk`            | 確認全系統代理存取風險；搭配 `--non-interactive` 時為必要。                       |
| `--mode <mode>`            | 導覽模式：`local` 或 `remote`。                                                               |
| `--import-from <provider>` | 導覽期間要執行的遷移提供者。                                                        |
| `--import-source <path>`   | `--import-from` 的來源代理主目錄。                                                              |
| `--import-secrets`         | 在導覽遷移期間匯入支援的密鑰。                                               |
| `--remote-url <url>`       | 遠端閘道 WebSocket URL。                                                                       |
| `--remote-token <token>`   | 遠端閘道權杖（選用）。                                                                    |

### 精靈自動觸發

即使沒有 `--wizard`，只要明確出現以下任一旗標，`openclaw setup` 就會執行精靈：

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## 範例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 備註

- 單純執行 `openclaw setup` 會初始化設定與工作區，不會執行完整導覽流程。
- 單純設定後，執行 `openclaw onboard` 進入完整引導流程、執行 `openclaw configure` 進行目標式變更，或執行 `openclaw channels add` 新增通道帳號。
- 若偵測到 Hermes 狀態，互動式導覽可自動提供遷移。匯入導覽需要全新設定；如需導覽外的試跑計畫、備份和覆寫模式，請使用 [遷移](/zh-TW/cli/migrate)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [導覽（命令列介面）](/zh-TW/start/wizard)
- [開始使用](/zh-TW/start/getting-started)
- [安裝概覽](/zh-TW/install)
