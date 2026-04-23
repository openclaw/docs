---
read_when:
    - Ви хочете інтерактивно налаштувати облікові дані, пристрої або типові параметри агента
summary: Довідник CLI для `openclaw configure` (інтерактивні запити конфігурації)
title: Налаштувати
x-i18n:
    generated_at: "2026-04-23T20:46:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db1c5f412fbd2ec896984e615529f77ab1b6df7788419b1b92b1bf66f99e3a1
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Інтерактивний prompt для налаштування облікових даних, пристроїв і типових параметрів агента.

Примітка: розділ **Model** тепер містить multi-select для
allowlist `agents.defaults.models` (те, що відображається в `/model` і в засобі вибору моделі).
Варіанти налаштування в межах конкретного provider-а додають вибрані моделі до наявного
allowlist, а не замінюють уже наявних у конфігурації provider-ів, яких це не стосується.

Коли configure запускається з варіанта автентифікації provider-а, засоби вибору
типової моделі та allowlist автоматично надають перевагу цьому provider-у. Для парних provider-ів, таких
як Volcengine/BytePlus, ця сама перевага також поширюється на їхні варіанти
coding-plan (`volcengine-plan/*`, `byteplus-plan/*`). Якщо фільтр preferred-provider
призвів би до порожнього списку, configure повертається до нефільтрованого
catalog замість показу порожнього засобу вибору.

Порада: `openclaw config` без підкоманди відкриває той самий wizard. Використовуйте
`openclaw config get|set|unset` для неінтерактивного редагування.

Для вебпошуку `openclaw configure --section web` дає змогу вибрати provider
і налаштувати його облікові дані. Для деяких provider-ів також показуються
додаткові prompt-и, специфічні для provider-а:

- **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і
  дати вибрати модель `x_search`.
- **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` або
  `api.moonshot.cn`) і типову модель вебпошуку Kimi.

Пов’язане:

- Довідник конфігурації Gateway: [Configuration](/uk/gateway/configuration)
- CLI конфігурації: [Config](/uk/cli/config)

## Параметри

- `--section <section>`: фільтр розділів, який можна повторювати

Доступні розділи:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Примітки:

- Вибір місця запуску Gateway завжди оновлює `gateway.mode`. Ви можете вибрати "Continue" без інших розділів, якщо вам потрібно лише це.
- Сервіси, орієнтовані на канали (Slack/Discord/Matrix/Microsoft Teams), під час налаштування запитують allowlist каналів/кімнат. Ви можете вводити назви або ID; wizard за можливості перетворює назви на ID.
- Якщо ви запускаєте крок встановлення daemon, автентифікація token потребує token, а `gateway.auth.token` керується через SecretRef, configure перевіряє SecretRef, але не зберігає розв’язані plaintext-значення token у metadata середовища supervisor service.
- Якщо автентифікація token потребує token, а налаштований token SecretRef не розв’язується, configure блокує встановлення daemon і показує практичні вказівки щодо усунення проблеми.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, configure блокує встановлення daemon, доки режим не буде явно заданий.

## Приклади

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
