---
read_when:
    - Ви хочете відкрити Control UI за допомогою свого поточного токена
    - Ви хочете вивести URL без запуску браузера
summary: Довідник CLI для `openclaw dashboard` (відкрити Control UI)
title: Панель керування
x-i18n:
    generated_at: "2026-04-25T10:49:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Відкрийте Control UI, використовуючи вашу поточну автентифікацію.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Примітки:

- `dashboard` за можливості розв’язує SecretRef, налаштовані в `gateway.auth.token`.
- `dashboard` дотримується `gateway.tls.enabled`: шлюзи з увімкненим TLS виводять/відкривають URL-адреси Control UI з `https://` і підключаються через `wss://`.
- Для токенів, керованих через SecretRef (розв’язаних або нерозв’язаних), `dashboard` виводить/копіює/відкриває URL без токена, щоб уникнути розкриття зовнішніх секретів у виводі термінала, історії буфера обміну або аргументах запуску браузера.
- Якщо `gateway.auth.token` керується через SecretRef, але не розв’язується в цьому шляху команди, команда виводить URL без токена та явні рекомендації щодо усунення проблеми замість вбудовування недійсного заповнювача токена.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Панель керування](/uk/web/dashboard)
