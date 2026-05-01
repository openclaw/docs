---
read_when:
    - Ви використовуєте Plugin для голосових викликів і хочете точки входу CLI
    - Вам потрібні короткі приклади для `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Довідник CLI для `openclaw voicecall` (поверхня команд Plugin для голосових викликів)
title: Голосовий дзвінок
x-i18n:
    generated_at: "2026-05-01T04:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4090858a58b7defaff955a370c8cb0ff025ef68061e68a6c69a637de24707c0b
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` — це команда, яку надає Plugin. Вона зʼявляється лише тоді, коли Plugin голосових викликів встановлено й увімкнено.

Основний документ:

- Plugin голосових викликів: [Voice Call](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` за замовчуванням виводить зручні для читання перевірки готовності. Використовуйте `--json` для
скриптів:

```bash
openclaw voicecall setup --json
```

`status` за замовчуванням виводить активні виклики у форматі JSON. Передайте `--call-id <id>`, щоб переглянути
один виклик.

Для зовнішніх провайдерів (`twilio`, `telnyx`, `plivo`) налаштування має визначити публічну
URL-адресу Webhook з `publicUrl`, тунелю або доступу через Tailscale. Резервний варіант обслуговування через loopback/private
відхиляється, оскільки оператори не можуть до нього звернутися.

`smoke` виконує ті самі перевірки готовності. Він не здійснюватиме справжній телефонний виклик,
якщо не вказано одночасно `--to` і `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Відкриття Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте endpoint Webhook лише для мереж, яким довіряєте. За можливості віддавайте перевагу Tailscale Serve замість Funnel.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Plugin голосових викликів](/uk/plugins/voice-call)
