---
read_when:
    - 你想使用目前的權杖開啟控制介面
    - 你想要列印 URL，而不啟動瀏覽器
summary: '`openclaw dashboard` 的命令列介面參考（開啟控制介面）'
title: 儀表板
x-i18n:
    generated_at: "2026-07-14T13:34:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用目前的驗證開啟控制介面。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`：印出 URL，但不啟動瀏覽器。
- `--json`：印出一個機器可讀的連線物件，不開啟瀏覽器、不使用剪貼簿、不顯示提示，也不啟動閘道。
- `--yes`：需要時直接啟動／安裝閘道，不顯示提示。

## 機器可讀的輸出

對於需要已解析控制介面 URL 的桌面整合與指令碼，請使用 `--json`：

```bash
openclaw dashboard --json
```

回應包含 `url`、`httpUrl`、`wsUrl`、`port` 和 `tokenIncluded`。如果閘道尚未就緒，命令會傳回 `{"ok":false,"reason":"..."}`，並以非零狀態結束。由 SecretRef 管理的權杖絕不會包含在 `url` 中。

注意事項：

- 可能時會解析已設定的 `gateway.auth.token` SecretRef。
- 遵循 `gateway.tls.enabled`：啟用 TLS 的閘道會印出／開啟 `https://` 控制介面 URL，並透過 `wss://` 連線。
- 對於 `lan` 或萬用字元 `custom` 繫結，同一主機上的啟動一律使用迴送位址，因為萬用字元不是瀏覽器目的地。明文 `tailnet` 和 `custom` 繫結也會使用 `127.0.0.1`，讓瀏覽器具有安全內容；啟用 TLS 的特定主機則保留已設定的位址，以符合憑證名稱。
- 在為特定介面繫結提供經過驗證的迴送 URL 前，命令會探測已設定的介面，並確認該介面與 `127.0.0.1` 由同一個閘道程序擁有。如果接聽器擁有權不明確，系統會採取封閉式失敗，並提供狀態指引。
- 對於由 SecretRef 管理的權杖（無論已解析或未解析），印出、複製或開啟的 URL 都不會包含權杖，因此外部密鑰不會洩漏至終端輸出、剪貼簿歷程記錄或瀏覽器啟動引數。
- 如果 `gateway.auth.token` 由 SecretRef 管理但尚未解析，命令會印出不含權杖的 URL 和修復指引，而非無效的權杖預留位置。
- 如果權杖驗證 URL 的剪貼簿／瀏覽器傳遞失敗，命令會記錄安全的手動驗證提示，其中會指出 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段鍵 `token`，但不會印出權杖值。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [儀表板](/zh-TW/web/dashboard)
