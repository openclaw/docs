---
read_when:
    - Ви хочете відкрити Control UI зі своїм поточним токеном
    - Ви хочете вивести URL без запуску браузера
summary: Довідка CLI для `openclaw dashboard` (відкрити Control UI)
title: панель керування
x-i18n:
    generated_at: "2026-04-23T06:17:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Відкрийте Control UI, використовуючи свою поточну автентифікацію.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Примітки:

- `dashboard` визначає налаштовані SecretRef для `gateway.auth.token`, коли це можливо.
- Для токенів, якими керує SecretRef (визначених або невизначених), `dashboard` виводить/копіює/відкриває URL без токена, щоб уникнути розкриття зовнішніх секретів у виводі термінала, історії буфера обміну або аргументах запуску браузера.
- Якщо `gateway.auth.token` керується через SecretRef, але не визначається в цьому шляху виконання команди, команда виводить URL без токена та явні рекомендації щодо виправлення замість вбудовування недійсного заповнювача токена.
