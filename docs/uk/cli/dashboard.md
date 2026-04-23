---
read_when:
    - Ви хочете відкрити Control UI з вашим поточним токеном
    - Ви хочете вивести URL без запуску браузера
summary: Довідник CLI для `openclaw dashboard` (відкрити Control UI)
title: Панель керування
x-i18n:
    generated_at: "2026-04-23T20:46:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e2efad499eca9364668ffce2cce52b63e28dc1773aeee64fe20ccafae9d1628
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Відкрити Control UI з використанням вашої поточної автентифікації.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Примітки:

- `dashboard` за можливості розв’язує налаштовані SecretRef для `gateway.auth.token`.
- Для токенів, керованих через SecretRef (розв’язаних або нерозв’язаних), `dashboard` виводить/копіює/відкриває URL без токена, щоб уникнути розкриття зовнішніх секретів у виводі термінала, історії буфера обміну або аргументах запуску браузера.
- Якщо `gateway.auth.token` керується через SecretRef, але не розв’язується в цьому шляху виконання команди, команда виводить URL без токена та явні вказівки щодо виправлення замість вбудовування недійсного заповнювача токена.
