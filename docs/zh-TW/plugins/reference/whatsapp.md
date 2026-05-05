---
read_when:
    - 您正在安裝、設定或稽核 WhatsApp Plugin
summary: 新增 WhatsApp 通道介面，用於傳送與接收 OpenClaw 訊息。
title: WhatsApp Plugin
x-i18n:
    generated_at: "2026-05-05T06:18:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin

新增 WhatsApp 通道介面，用於傳送和接收 OpenClaw 訊息。

## 發行

- 套件：`@openclaw/whatsapp`
- 安裝路徑：npm；ClawHub

## 介面

channels: whatsapp

## Windows 安裝注意事項

在 Windows 上，WhatsApp Plugin 在 npm 安裝期間需要 `PATH` 中有 Git，因為它的一個 Baileys/libsignal 相依項是從 git URL 擷取。請安裝 Git for Windows，然後重新啟動 shell 並重新執行安裝：

```powershell
winget install --id Git.Git -e
```

如果 Portable Git 的 `bin` 目錄位於 `PATH` 中，也可以使用。

## 相關文件

- [whatsapp](/zh-TW/channels/whatsapp)
