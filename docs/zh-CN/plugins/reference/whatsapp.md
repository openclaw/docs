---
read_when:
    - 你正在安装、配置或审计 WhatsApp 插件
summary: 新增 WhatsApp 渠道界面，用于发送和接收 OpenClaw 消息。
title: WhatsApp 插件
x-i18n:
    generated_at: "2026-05-05T04:18:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp 插件

添加 WhatsApp 渠道界面，用于发送和接收 OpenClaw 消息。

## 分发

- 包：`@openclaw/whatsapp`
- 安装路径：npm；ClawHub

## 界面

channels: whatsapp

## Windows 安装注意事项

在 Windows 上，WhatsApp 插件在 npm 安装期间需要 `PATH` 中存在 Git，因为它的一个 Baileys/libsignal 依赖是从 git URL 获取的。安装 Git for Windows，然后重启 shell 并重新运行安装：

```powershell
winget install --id Git.Git -e
```

如果 Portable Git 的 `bin` 目录在 `PATH` 中，也可以使用 Portable Git。

## 相关文档

- [whatsapp](/zh-CN/channels/whatsapp)
