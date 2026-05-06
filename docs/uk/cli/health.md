---
read_when:
    - Ви хочете швидко перевірити стан запущеного Gateway
summary: Довідка CLI для `openclaw health` (знімок стану справності Gateway через RPC)
title: Стан
x-i18n:
    generated_at: "2026-05-06T07:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Отримати стан справності від запущеного Gateway.

Параметри:

- `--json`: машинозчитуваний вивід
- `--timeout <ms>`: час очікування з’єднання в мілісекундах (типово `10000`)
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

- Типовий `openclaw health` запитує в запущеного Gateway знімок його стану справності. Коли
  Gateway уже має свіжий кешований знімок, він може повернути цей кешований вміст і
  оновитися у фоновому режимі.
- `--verbose` примусово виконує live-перевірку, виводить деталі підключення до Gateway і розгортає
  зручний для читання вивід для всіх налаштованих облікових записів і агентів.
- Вивід містить сховища сеансів для кожного агента, коли налаштовано кілька агентів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Стан справності Gateway](/uk/gateway/health)
