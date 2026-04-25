---
read_when:
    - Ви використовуєте Plugin voice-call і хочете точки входу CLI
    - Ви хочете швидкі приклади для `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Довідка CLI для `openclaw voicecall` (поверхня команд Plugin voice-call)
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T05:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` — це команда, надана Plugin. Вона з’являється, лише якщо Plugin voice-call встановлено та ввімкнено.

Основний документ:

- Plugin voice-call: [Голосовий виклик](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` за замовчуванням виводить перевірки готовності в зручному для читання форматі. Використовуйте `--json` для
скриптів:

```bash
openclaw voicecall setup --json
```

Для зовнішніх провайдерів (`twilio`, `telnyx`, `plivo`) setup має визначити публічний URL Webhook із `publicUrl`, тунелю або Tailscale. Резервний варіант loopback/private serve відхиляється, оскільки оператори не можуть до нього звернутися.

`smoke` запускає ті самі перевірки готовності. Він не здійснить реальний телефонний дзвінок,
якщо не вказано одночасно `--to` і `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # пробний запуск
openclaw voicecall smoke --to "+15555550123" --yes  # реальний сповіщувальний дзвінок
```

## Відкриття Webhook назовні (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте endpoint Webhook лише для мереж, яким ви довіряєте. За можливості віддавайте перевагу Tailscale Serve замість Funnel.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Plugin голосових викликів](/uk/plugins/voice-call)
