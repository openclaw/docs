---
read_when:
    - 你想使用目前的權杖開啟控制介面
    - 您想要輸出該 URL，而不啟動瀏覽器
summary: '`openclaw dashboard` 的命令列介面參考（開啟控制介面）'
title: 儀表板
x-i18n:
    generated_at: "2026-07-11T21:12:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用目前的驗證資訊開啟控制介面。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`：印出 URL，但不啟動瀏覽器。
- `--yes`：需要時不經提示即啟動／安裝閘道。

注意事項：

- 盡可能解析已設定的 `gateway.auth.token` SecretRef。
- 遵循 `gateway.tls.enabled`：啟用 TLS 的閘道會印出／開啟 `https://` 控制介面 URL，並透過 `wss://` 連線。
- 對於 `lan` 或使用萬用字元的 `custom` 繫結，同一主機上的啟動一律使用 local loopback，因為萬用字元不是有效的瀏覽器目的地。純文字的 `tailnet` 與 `custom` 繫結也會使用 `127.0.0.1`，讓瀏覽器具備安全內容環境；啟用 TLS 且指定特定主機的情況則保留設定的位址，以便憑證名稱相符。
- 在為特定介面繫結提供已驗證的 local loopback URL 前，此命令會探查已設定的介面，並確認該介面與 `127.0.0.1` 均由同一個閘道程序擁有。若監聽器的擁有權不明確，命令會採取封閉式失敗，並提供狀態指引。
- 對於由 SecretRef 管理的權杖（無論已解析或未解析），印出、複製或開啟的 URL 一律不會包含權杖，因此外部機密不會洩漏至終端機輸出、剪貼簿歷程記錄或瀏覽器啟動引數中。
- 如果 `gateway.auth.token` 由 SecretRef 管理但無法解析，此命令會印出不含權杖的 URL 與修復指引，而非無效的權杖預留位置。
- 如果使用權杖驗證的 URL 無法傳送至剪貼簿／瀏覽器，此命令會記錄安全的手動驗證提示，列出 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 與 URL 片段鍵 `token`，但不會印出權杖值。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [儀表板](/zh-TW/web/dashboard)
