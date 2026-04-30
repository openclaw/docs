---
read_when:
    - 你想使用目前的 token 開啟 Control UI
    - 您想要在不啟動瀏覽器的情況下印出 URL
summary: '`openclaw dashboard` 的 CLI 參考（開啟控制 UI）'
title: 儀表板
x-i18n:
    generated_at: "2026-04-30T02:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用你目前的身分驗證開啟控制 UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意事項：

- `dashboard` 會在可行時解析已設定的 `gateway.auth.token` SecretRefs。
- `dashboard` 會遵循 `gateway.tls.enabled`：已啟用 TLS 的 Gateway 會列印/開啟
  `https://` 控制 UI URL，並透過 `wss://` 連線。
- 對於由 SecretRef 管理的權杖（已解析或未解析），`dashboard` 會列印/複製/開啟不含權杖的 URL，以避免在終端機輸出、剪貼簿歷史記錄或瀏覽器啟動引數中暴露外部祕密。
- 如果 `gateway.auth.token` 由 SecretRef 管理，但在此命令路徑中未解析，命令會列印不含權杖的 URL，並提供明確的修復指引，而不是嵌入無效的權杖預留位置。

## 相關

- [CLI 參考](/zh-TW/cli)
- [儀表板](/zh-TW/web/dashboard)
