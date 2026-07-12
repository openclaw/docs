---
read_when:
    - 你想要使用目前的權杖開啟控制介面
    - 你想要顯示 URL，而不啟動瀏覽器
summary: '`openclaw dashboard` 的命令列介面參考（開啟控制介面）'
title: 儀表板
x-i18n:
    generated_at: "2026-07-12T14:22:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用你目前的驗證資訊開啟控制介面。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`：列印 URL，但不啟動瀏覽器。
- `--yes`：需要時直接啟動／安裝閘道，不顯示提示。

注意事項：

- 會盡可能解析已設定的 `gateway.auth.token` SecretRefs。
- 遵循 `gateway.tls.enabled`：啟用 TLS 的閘道會列印／開啟 `https://` 控制介面 URL，並透過 `wss://` 連線。
- 對於 `lan` 或使用萬用字元的 `custom` 繫結，同一主機上的啟動一律使用回送位址，因為萬用字元不是瀏覽器可用的目的地。未加密的 `tailnet` 和 `custom` 繫結也會使用 `127.0.0.1`，讓瀏覽器具備安全內容環境；啟用 TLS 且指定特定主機的情況則會保留設定的位址，讓憑證名稱能夠相符。
- 在針對特定介面的繫結提供已驗證的回送 URL 前，命令會探測設定的介面，並確認該介面與 `127.0.0.1` 由同一個閘道程序持有。若監聽器的擁有權不明確，系統會採取失敗關閉，並提供狀態檢查指引。
- 對於由 SecretRef 管理的權杖（無論已解析或未解析），列印、複製或開啟的 URL 絕不會包含權杖，因此外部密鑰不會洩漏到終端輸出、剪貼簿記錄或瀏覽器啟動引數中。
- 如果 `gateway.auth.token` 由 SecretRef 管理但尚未解析，命令會列印不含權杖的 URL 與修復指引，而不是無效的權杖預留位置。
- 如果使用權杖驗證的 URL 無法傳送至剪貼簿／瀏覽器，命令會記錄安全的手動驗證提示，其中會指出 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段鍵 `token`，但不會列印權杖值。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [控制台](/zh-TW/web/dashboard)
