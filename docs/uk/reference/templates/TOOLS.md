---
read_when:
    - Ручне bootstrapping робочого простору
summary: Шаблон робочого простору для TOOLS.md
title: Шаблон TOOLS.md
x-i18n:
    generated_at: "2026-04-23T21:10:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55ea69da82ed3c32671d7faf8b75d7000399eb10a8697243810d2aebc7a99129
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Локальні нотатки

Skills визначають, _як_ працюють інструменти. Цей файл — для _ваших_ конкретних деталей, тобто того, що є унікальним для вашого налаштування.

## Що тут має бути

Речі на кшталт:

- Назв і розташування камер
- SSH-хостів та alias-ів
- Бажаних голосів для TTS
- Назв динаміків/кімнат
- Псевдонімів пристроїв
- Усього, що специфічне для середовища

## Приклади

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Навіщо окремо?

Skills є спільними. Ваше налаштування — ваше. Розділення цих речей означає, що ви можете оновлювати Skills, не втрачаючи свої нотатки, і ділитися Skills, не розкриваючи свою інфраструктуру.

---

Додавайте все, що допомагає вам виконувати свою роботу. Це ваша шпаргалка.
