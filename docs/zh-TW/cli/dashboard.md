---
read_when:
    - 您想使用目前的權杖開啟 Control UI
    - 你想在不啟動瀏覽器的情況下列印 URL
summary: '`openclaw dashboard` 的命令列介面參考（開啟控制介面）'
title: 儀表板
x-i18n:
    generated_at: "2026-07-05T11:09:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79c5e0884fca90c582499b73d49a72dccb09dd60cd1777c95040f540a3e539f3
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用你目前的驗證開啟控制介面。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`：列印 URL，但不啟動瀏覽器。
- `--yes`：需要時不提示即啟動/安裝閘道。

注意事項：

- 可能時會解析已設定的 `gateway.auth.token` SecretRefs。
- 遵循 `gateway.tls.enabled`：啟用 TLS 的閘道會列印/開啟 `https://` 控制介面 URL，並透過 `wss://` 連線。
- 對於由 SecretRef 管理的權杖（已解析或未解析），列印/複製/開啟的 URL 絕不包含權杖，因此外部祕密不會洩漏到終端機輸出、剪貼簿歷史記錄或瀏覽器啟動參數。
- 如果 `gateway.auth.token` 由 SecretRef 管理但未解析，此命令會列印不含權杖的 URL 和修復指引，而不是無效的權杖預留位置。
- 如果已驗證權杖的 URL 無法傳送到剪貼簿/瀏覽器，此命令會記錄安全的手動驗證提示，指明 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段鍵 `token`，但不會列印權杖值。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [儀表板](/zh-TW/web/dashboard)
