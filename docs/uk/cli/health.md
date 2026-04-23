---
read_when:
    - Ви хочете швидко перевірити стан здоров’я запущеного Gateway
summary: Довідка CLI для `openclaw health` (знімок стану здоров’я Gateway через RPC)
title: стан здоров’я
x-i18n:
    generated_at: "2026-04-23T06:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Отримати стан здоров’я від запущеного Gateway.

Параметри:

- `--json`: машинозчитуваний вивід
- `--timeout <ms>`: тайм-аут з’єднання в мілісекундах (типово `10000`)
- `--verbose`: докладне журналювання
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

- Типова команда `openclaw health` запитує у запущеного gateway його знімок стану здоров’я. Якщо gateway уже має свіжий кешований знімок, він може повернути цей кешований вміст і оновити його у фоновому режимі.
- `--verbose` примусово виконує живу перевірку, показує деталі з’єднання з gateway і розгортає людиночитний вивід для всіх налаштованих облікових записів і агентів.
- Вивід містить сховища сесій для кожного агента, якщо налаштовано кілька агентів.
