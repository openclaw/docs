---
read_when:
    - 你需要一個適用於閘道的終端介面（方便遠端使用）
    - 你想從腳本傳遞 URL、權杖與工作階段資訊
    - 您想在不使用閘道的情況下，以本機嵌入模式執行終端介面
    - 你想使用 `openclaw chat` 或 `openclaw tui --local`
summary: '`openclaw tui` 的命令列介面參考（由閘道支援或本機嵌入式終端使用者介面）'
title: 終端介面
x-i18n:
    generated_at: "2026-07-11T21:13:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

開啟連線至閘道的終端介面，或以本機嵌入模式執行。

相關指南：[終端介面](/zh-TW/web/tui)

## 選項

| 旗標                         | 預設值                                    | 說明                                                                               |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | 使用本機嵌入式代理執行階段，而非閘道。                                             |
| `--url <url>`                | 設定中的 `gateway.remote.url`             | 閘道 WebSocket URL。                                                               |
| `--token <token>`            | （無）                                    | 閘道權杖（如有需要）。                                                             |
| `--password <pass>`          | （無）                                    | 閘道密碼（如有需要）。                                                             |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | 已釘選 `wss://` 閘道的預期 TLS 憑證指紋。                                          |
| `--session <key>`            | `main`（範圍為全域時則為 `global`）       | 工作階段金鑰。在代理工作區內，除非加上前綴，否則會自動選取該代理。                   |
| `--deliver`                  | `false`                                   | 透過已設定的頻道傳送助理回覆。                                                     |
| `--thinking <level>`         | （模型預設值）                            | 覆寫思考層級。                                                                     |
| `--message <text>`           | （無）                                    | 連線後傳送初始訊息。                                                               |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | 代理逾時時間。無效值會記錄警告並予以忽略。                                         |
| `--history-limit <n>`        | `200`                                     | 連接時要載入的歷史記錄項目數。                                                     |

別名：`openclaw chat` 和 `openclaw terminal` 會呼叫此命令，並隱含使用 `--local`。

## 注意事項

- `--local` 無法與 `--url`、`--token`、`--password` 或 `--tls-fingerprint` 合併使用。
- 在可行的情況下，`tui` 會解析已設定的閘道驗證 SecretRef，以供權杖／密碼驗證使用（`env`／`file`／`exec` 提供者）。
- 若未明確指定 URL 或連接埠，`tui` 會使用執行中閘道所記錄的目前本機閘道連接埠。明確指定的 `--url`、`OPENCLAW_GATEWAY_URL`、`OPENCLAW_GATEWAY_PORT` 和遠端閘道設定仍具有較高優先順序。
- 從已設定的代理工作區目錄內啟動時，終端介面會自動選取該代理作為工作階段金鑰的預設值（除非明確將 `--session` 設為 `agent:<id>:...`）。
- 若要在頁尾顯示非本機 URL 連線所使用的閘道主機名稱，請執行 `openclaw config set tui.footer.showRemoteHost true`。預設為關閉；local loopback 或嵌入式本機連線一律不會顯示。
- 本機模式會直接使用嵌入式代理執行階段。大多數本機工具皆可運作，但僅限閘道的功能無法使用。
- 本機模式會在終端介面的命令介面中加入 `/auth [provider]`。
- 外掛核准閘門在本機模式下仍然適用：需要核准的工具會在終端機中提示您做出決定，不會在未提示的情況下自動核准任何項目。
- 工作階段[目標](/zh-TW/tools/goal)會顯示於頁尾，並可使用 `/goal` 管理。

## 範例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# 在代理工作區內執行時，會自動推斷該代理
openclaw tui --session bugfix
```

## 設定修復迴圈

使用本機模式，讓嵌入式代理檢查目前設定、與文件進行比較，並在同一個終端機中協助修復。

如果 `openclaw config validate` 已經失敗，請先執行 `openclaw configure` 或 `openclaw doctor --fix`；`openclaw chat` 不會略過無效設定防護機制。

```bash
openclaw chat
```

接著在終端介面內執行：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 套用針對性修正，然後重新執行 `openclaw config validate`。請參閱[終端介面](/zh-TW/web/tui)和[設定](/zh-TW/cli/config)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [終端介面](/zh-TW/web/tui)
- [目標](/zh-TW/tools/goal)
