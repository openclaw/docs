---
read_when:
    - Ви хочете швидко перевірити стан здоров’я запущеного Gateway
summary: Довідка CLI для `openclaw health` (знімок стану Gateway через RPC)
title: Стан здоров’я
x-i18n:
    generated_at: "2026-04-23T20:47:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76059848f92161308256952e617001c5be97fa1fc591b5f4f0c51959815049f1
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Отримати стан здоров’я від запущеного Gateway.

Параметри:

- `--json`: машиночитаний вивід
- `--timeout <ms>`: тайм-аут з’єднання в мілісекундах (типово `10000`)
- `--verbose`: докладне логування
- `--debug`: псевдонім для `--verbose`

Приклади:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Примітки:

- Типова команда `openclaw health` запитує в запущеного gateway його знімок стану здоров’я. Коли
  gateway уже має свіжий кешований знімок, він може повернути цей кешований payload і
  оновити його у фоновому режимі.
- `--verbose` примусово запускає живу перевірку, показує подробиці з’єднання з gateway і розгортає
  зрозумілий для людини вивід для всіх налаштованих облікових записів і агентів.
- Вивід містить сховища сесій для кожного агента, якщо налаштовано кількох агентів.
