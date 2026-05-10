---
read_when:
    - 你想要 Gateway 的終端機 UI（適合遠端使用）
    - 您想從 scripts 傳遞 url/token/session
    - 你想要在不使用 Gateway 的情況下，以本機嵌入式模式執行 TUI
    - 你想使用 openclaw chat 或 openclaw tui --local
summary: '`openclaw tui` 的 CLI 參考（由 Gateway 支援或本機嵌入式終端機 UI）'
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

開啟連接到 Gateway 的終端機 UI，或以本機嵌入模式執行。

相關：

- TUI 指南：[TUI](/zh-TW/web/tui)

## 選項

| 旗標                  | 預設值                                    | 說明                                                                               |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | 對本機嵌入式代理程式執行階段執行，而不是 Gateway。                                |
| `--url <url>`         | 來自設定的 `gateway.remote.url`           | Gateway WebSocket URL。                                                            |
| `--token <token>`     | （無）                                    | Gateway 權杖（如有需要）。                                                         |
| `--password <pass>`   | （無）                                    | Gateway 密碼（如有需要）。                                                         |
| `--session <key>`     | `main`（或範圍為全域時的 `global`）       | 工作階段鍵。在代理程式工作區內，除非加上前綴，否則會自動選取該代理程式。          |
| `--deliver`           | `false`                                   | 透過已設定的頻道傳遞助理回覆。                                                     |
| `--thinking <level>`  | （模型預設值）                            | Thinking 等級覆寫。                                                                |
| `--message <text>`    | （無）                                    | 連線後傳送初始訊息。                                                               |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | 代理程式逾時。無效值會記錄警告並被忽略。                                           |
| `--history-limit <n>` | `200`                                     | 附加時要載入的歷史記錄項目數。                                                     |

別名：`openclaw chat` 和 `openclaw terminal` 會叫用相同命令，並隱含 `--local`。

注意事項：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的別名。
- `--local` 無法與 `--url`、`--token` 或 `--password` 結合使用。
- 可能時，`tui` 會解析已設定的 Gateway 驗證 SecretRefs，以用於權杖/密碼驗證（`env`/`file`/`exec` 提供者）。
- 從已設定的代理程式工作區目錄內啟動時，TUI 會自動選取該代理程式作為工作階段鍵預設值（除非 `--session` 明確為 `agent:<id>:...`）。
- 本機模式會直接使用嵌入式代理程式執行階段。大多數本機工具可用，但 Gateway 專屬功能無法使用。
- 本機模式會在 TUI 命令介面中加入 `/auth [provider]`。
- Plugin 核准閘門在本機模式中仍然適用。需要核准的工具會在終端機提示決策；不會因為未涉及 Gateway 就靜默自動核准任何項目。

## 範例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## 設定修復迴圈

當目前設定已通過驗證，而你想要嵌入式代理程式檢查它、將它與文件比較，並從同一個終端機協助修復時，請使用本機模式：

如果 `openclaw config validate` 已經失敗，請先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不會繞過無效設定防護。

```bash
openclaw chat
```

接著在 TUI 內：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 套用目標修復，然後重新執行 `openclaw config validate`。請參閱 [TUI](/zh-TW/web/tui) 和 [設定](/zh-TW/cli/config)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [TUI](/zh-TW/web/tui)
