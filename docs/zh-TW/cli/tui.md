---
read_when:
    - 你想要適合遠端使用的 Gateway 終端介面
    - 你想要從指令碼傳遞 url/token/session
    - 你想在本機嵌入模式下執行終端介面，而不使用閘道
    - 你想使用 openclaw chat 或 openclaw tui --local
summary: '`openclaw tui` 的命令列介面參考（由閘道支援或本機嵌入式終端 UI）'
title: 終端介面
x-i18n:
    generated_at: "2026-07-06T10:48:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436184e1ca9edba0b1f47dd231529cf9d182ed43e6397bf041a503b79edb7ae9
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

開啟連接到閘道的終端使用者介面，或以本機嵌入模式執行。

相關指南：[終端介面](/zh-TW/web/tui)

## 選項

| 旗標                  | 預設值                                    | 說明                                                                                 |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `--local`             | `false`                                   | 使用本機嵌入式代理執行階段，而不是閘道。                                             |
| `--url <url>`         | 設定中的 `gateway.remote.url`             | 閘道 WebSocket URL。                                                                 |
| `--token <token>`     | （無）                                    | 需要時使用的閘道權杖。                                                               |
| `--password <pass>`   | （無）                                    | 需要時使用的閘道密碼。                                                               |
| `--session <key>`     | `main`（或範圍為全域時為 `global`）       | 工作階段鍵。在代理工作區內，除非加上前綴，否則會自動選取該代理。                     |
| `--deliver`           | `false`                                   | 透過已設定的通道傳送助理回覆。                                                       |
| `--thinking <level>`  | （模型預設值）                            | 覆寫思考層級。                                                                       |
| `--message <text>`    | （無）                                    | 連線後傳送初始訊息。                                                                 |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | 代理逾時。無效值會記錄警告並被忽略。                                                 |
| `--history-limit <n>` | `200`                                     | 附加時要載入的歷史項目數。                                                           |

別名：`openclaw chat` 和 `openclaw terminal` 會以隱含 `--local` 的方式呼叫此命令。

## 注意事項

- `--local` 不能與 `--url`、`--token` 或 `--password` 搭配使用。
- 可行時，`tui` 會解析已設定的閘道驗證 SecretRefs，用於權杖/密碼驗證（`env`/`file`/`exec` 提供者）。
- 沒有明確 URL 或連接埠時，`tui` 會遵循執行中閘道記錄的作用中本機閘道連接埠。明確的 `--url`、`OPENCLAW_GATEWAY_URL`、`OPENCLAW_GATEWAY_PORT` 和遠端閘道設定會保持優先。
- 從已設定的代理工作區目錄內啟動時，終端介面會為工作階段鍵預設值自動選取該代理（除非 `--session` 明確為 `agent:<id>:...`）。
- 若要在非本機、以 URL 為基礎的連線頁尾顯示閘道主機名稱，請執行 `openclaw config set tui.footer.showRemoteHost true`。預設關閉；loopback 或嵌入式本機連線永不顯示。
- 本機模式會直接使用嵌入式代理執行階段。大多數本機工具都可運作，但僅限閘道的功能無法使用。
- 本機模式會將 `/auth [provider]` 加入終端介面命令介面。
- 外掛核准閘門在本機模式仍然適用：需要核准的工具會在終端機中提示決策，不會靜默自動核准。
- 工作階段[目標](/zh-TW/tools/goal)會顯示在頁尾，並可透過 `/goal` 管理。

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

使用本機模式讓嵌入式代理檢查目前設定、與文件比對，並從同一個終端機協助修復。

如果 `openclaw config validate` 已經失敗，請先執行 `openclaw configure` 或 `openclaw doctor --fix`；`openclaw chat` 不會繞過無效設定防護。

```bash
openclaw chat
```

接著在終端介面內：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 套用目標修正，然後重新執行 `openclaw config validate`。請參閱[終端介面](/zh-TW/web/tui)和[設定](/zh-TW/cli/config)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [終端介面](/zh-TW/web/tui)
- [目標](/zh-TW/tools/goal)
