---
read_when:
    - 你想要一個用於閘道的終端介面（適合遠端使用）
    - 你想從指令碼傳遞 url/token/session
    - 你想在不使用閘道的情況下，以本機嵌入模式執行終端介面
    - 你想要使用 `openclaw chat` 或 `openclaw tui --local`
summary: '`openclaw tui` 的命令列介面參考（由閘道支援或本機嵌入式終端機介面）'
title: 終端介面
x-i18n:
    generated_at: "2026-06-27T19:08:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

開啟連接到閘道的終端 UI，或以本機嵌入模式執行。

相關：

- 終端介面指南：[終端介面](/zh-TW/web/tui)

## 選項

| 旗標                  | 預設值                                    | 說明                                                                               |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | 針對本機嵌入式代理執行階段執行，而不是針對閘道。                                 |
| `--url <url>`         | 設定中的 `gateway.remote.url`             | 閘道 WebSocket URL。                                                               |
| `--token <token>`     | （無）                                    | 需要時使用的閘道權杖。                                                             |
| `--password <pass>`   | （無）                                    | 需要時使用的閘道密碼。                                                             |
| `--session <key>`     | `main`（或範圍為全域時的 `global`）       | 工作階段鍵。在代理工作區內，除非加上前綴，否則會自動選取該代理。                 |
| `--deliver`           | `false`                                   | 透過已設定的頻道傳遞助理回覆。                                                     |
| `--thinking <level>`  | （模型預設值）                            | 覆寫思考層級。                                                                     |
| `--message <text>`    | （無）                                    | 連線後傳送初始訊息。                                                               |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | 代理逾時。無效值會記錄警告並被忽略。                                               |
| `--history-limit <n>` | `200`                                     | 連接時要載入的歷史項目數。                                                         |

別名：`openclaw chat` 和 `openclaw terminal` 會呼叫相同命令，並隱含使用 `--local`。

注意事項：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的別名。
- `--local` 不能與 `--url`、`--token` 或 `--password` 搭配使用。
- 可行時，`tui` 會為權杖/密碼驗證解析已設定的閘道驗證 SecretRefs（`env`/`file`/`exec` 提供者）。
- 從已設定的代理工作區目錄內啟動時，終端介面會自動為工作階段鍵預設值選取該代理（除非 `--session` 明確為 `agent:<id>:...`）。
- 若要在非本機、URL 支援的連線頁尾中顯示閘道主機名稱，請執行 `openclaw config set tui.footer.showRemoteHost true`。主機標籤預設關閉，且絕不會出現在回送或嵌入式本機連線中。
- 本機模式會直接使用嵌入式代理執行階段。大多數本機工具都可運作，但僅限閘道的功能無法使用。
- 本機模式會在終端介面命令介面中加入 `/auth [provider]`。
- 外掛核准閘門在本機模式中仍然適用。需要核准的工具會在終端機中提示做出決定；不會因為未涉及閘道就默默自動核准任何內容。
- 工作階段[目標](/zh-TW/tools/goal)會顯示在頁尾，並可使用 `/goal` 管理。

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

當目前設定已通過驗證，而你想要讓嵌入式代理從同一個終端機檢查設定、與文件比較，並協助修復時，請使用本機模式：

如果 `openclaw config validate` 已經失敗，請先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不會繞過無效設定防護。

```bash
openclaw chat
```

接著在終端介面中：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 套用目標修復，然後重新執行 `openclaw config validate`。請參閱[終端介面](/zh-TW/web/tui)和[設定](/zh-TW/cli/config)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [終端介面](/zh-TW/web/tui)
- [目標](/zh-TW/tools/goal)
