---
read_when:
    - 你想要適合遠端使用的閘道終端介面
    - 你想要從指令碼傳遞 URL、權杖和工作階段
    - 你想在沒有閘道的情況下，以本機嵌入模式執行終端介面
    - 你想要使用 `openclaw chat` 或 `openclaw tui --local`
summary: '`openclaw tui` 的命令列介面參考（由閘道支援或本機嵌入式終端使用者介面）'
title: 終端介面
x-i18n:
    generated_at: "2026-07-19T13:43:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5406f25bbd22c64867296c15112fafcaf8e1580c759e5fdc81fccfb62ae1e318
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

開啟已連線至閘道的終端介面，或以本機嵌入模式執行。

相關指南：[終端介面](/zh-TW/web/tui)

## 選項

| 旗標                         | 預設值                                   | 說明                                                                        |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | 使用本機嵌入式代理程式執行階段，而非閘道。                 |
| `--url <url>`                | 設定中的 `gateway.remote.url`          | 閘道 WebSocket URL。                                                             |
| `--token <token>`            | （無）                                    | 閘道權杖（如有需要）。                                                         |
| `--password <pass>`          | （無）                                    | 閘道密碼（如有需要）。                                                      |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | 釘選 `wss://` 閘道的預期 TLS 憑證指紋。                |
| `--session <key>`            | `main`（範圍為全域時則為 `global`） | 工作階段金鑰。在代理程式工作區內，除非加上前綴，否則會自動選取該代理程式。 |
| `--deliver`                  | `false`                                   | 透過已設定的頻道傳送助理回覆。                             |
| `--thinking <level>`         | （模型預設值）                           | 覆寫思考層級。                                                           |
| `--message <text>`           | （無）                                    | 連線後傳送初始訊息。                                          |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | 代理程式逾時。無效值會記錄警告並遭到忽略。                       |
| `--history-limit <n>`        | `200`                                     | 附加時載入的歷史記錄項目數。                                                 |

別名：`openclaw chat` 和 `openclaw terminal` 會呼叫此命令，並隱含使用
`--local`。

## 注意事項

- `--local` 無法與 `--url`、`--token`、`--password` 或 `--tls-fingerprint` 搭配使用。
- 在可能的情況下，`tui` 會解析設定的閘道驗證 SecretRef，以用於權杖／密碼驗證
  （`env`/`file`/`exec` 提供者）。
- 未明確指定 URL 或連接埠時，`tui` 會依循執行中閘道所記錄的作用中本機閘道連接埠。
  明確指定的 `--url`、`OPENCLAW_GATEWAY_URL`、
  `OPENCLAW_GATEWAY_PORT` 及遠端閘道設定仍具有優先權。
- 從已設定的代理程式工作區目錄內啟動時，終端介面會自動選取該代理程式
  作為工作階段金鑰的預設值（除非明確將 `--session` 設為
  `agent:<id>:...`）。
- 本機模式會直接使用嵌入式代理程式執行階段。大多數本機工具都能運作，
  但無法使用僅限閘道的功能。
- 本機模式會將 `/auth [provider]` 新增至終端介面的命令介面。
- 外掛核准閘門在本機模式中仍然適用：需要核准的工具
  會在終端機中提示你做出決定，不會在未告知的情況下自動核准任何項目。
- 工作階段[目標](/zh-TW/tools/goal)會顯示在頁尾，並可使用
  `/goal` 管理。

## 範例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "將我的設定與文件比較，並告訴我該修正哪些項目"
# 在代理程式工作區內執行時，會自動推斷該代理程式
openclaw tui --session bugfix
```

## 設定修復迴圈

使用本機模式，讓嵌入式代理程式檢查目前設定、與文件比較，
並協助從同一個終端機修復設定。

如果 `openclaw config validate` 已經失敗，請先執行 `openclaw configure` 或
`openclaw doctor --fix`；`openclaw chat` 不會略過
無效設定防護機制。

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

使用 `openclaw config set` 或 `openclaw configure` 套用針對性修正，然後
重新執行 `openclaw config validate`。請參閱[終端介面](/zh-TW/web/tui)和
[設定](/zh-TW/cli/config)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [終端介面](/zh-TW/web/tui)
- [目標](/zh-TW/tools/goal)
