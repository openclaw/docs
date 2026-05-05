---
read_when:
    - Ви встановлюєте, налаштовуєте або виконуєте аудит Plugin для WhatsApp
summary: Додає інтерфейс каналу WhatsApp для надсилання й отримання повідомлень OpenClaw.
title: WhatsApp Plugin
x-i18n:
    generated_at: "2026-05-05T04:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin

Додає поверхню каналу WhatsApp для надсилання й отримання повідомлень OpenClaw.

## Розповсюдження

- Package: `@openclaw/whatsapp`
- Маршрут встановлення: npm; ClawHub

## Поверхня

channels: whatsapp

## Примітка щодо встановлення у Windows

У Windows Plugin WhatsApp потребує Git у `PATH` під час встановлення через npm, оскільки одну з його залежностей Baileys/libsignal отримують із git URL. Встановіть Git for Windows, потім перезапустіть оболонку й повторно запустіть встановлення:

```powershell
winget install --id Git.Git -e
```

Portable Git також працює, якщо його каталог `bin` є в `PATH`.

## Пов’язані документи

- [whatsapp](/uk/channels/whatsapp)
