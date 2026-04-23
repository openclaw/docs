---
read_when:
    - Ви хочете інтерактивно змінити облікові дані, пристрої або типові параметри агента
summary: Довідник CLI для `openclaw configure` (інтерактивні підказки налаштування)
title: налаштувати
x-i18n:
    generated_at: "2026-04-23T06:17:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Інтерактивна підказка для налаштування облікових даних, пристроїв і типових параметрів агента.

Примітка: розділ **Model** тепер містить multi-select для allowlist
`agents.defaults.models` (що відображається в `/model` і в засобі вибору моделі).
Варіанти налаштування в межах провайдера додають вибрані ними моделі до наявного
allowlist, а не замінюють не пов’язаних провайдерів, які вже є в конфігурації.

Коли configure запускається з вибору автентифікації провайдера, засоби вибору
моделі за замовчуванням і allowlist автоматично віддають перевагу цьому провайдеру. Для парних провайдерів, таких
як Volcengine/BytePlus, та сама перевага також відповідає їхнім варіантам
coding-plan (`volcengine-plan/*`, `byteplus-plan/*`). Якщо фільтр preferred-provider
призводить до порожнього списку, configure повертається до нефільтрованого
каталогу замість показу порожнього засобу вибору.

Порада: `openclaw config` без підкоманди відкриває той самий майстер. Використовуйте
`openclaw config get|set|unset` для неінтерактивного редагування.

Для вебпошуку `openclaw configure --section web` дає змогу вибрати провайдера
та налаштувати його облікові дані. Деякі провайдери також показують
додаткові підказки, специфічні для провайдера:

- **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і
  дозволити вам вибрати модель `x_search`.
- **Kimi** може запитати регіон API Moonshot (`api.moonshot.ai` чи
  `api.moonshot.cn`) і модель вебпошуку Kimi за замовчуванням.

Пов’язане:

- Довідник із конфігурації Gateway: [Configuration](/uk/gateway/configuration)
- CLI конфігурації: [Config](/uk/cli/config)

## Параметри

- `--section <section>`: повторюваний фільтр розділів

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

- Вибір місця, де запускається Gateway, завжди оновлює `gateway.mode`. Ви можете вибрати "Continue" без інших розділів, якщо вам потрібно лише це.
- Сервіси, орієнтовані на канали (Slack/Discord/Matrix/Microsoft Teams), під час налаштування запитують allowlist каналів/кімнат. Ви можете вводити назви або ID; за можливості майстер перетворює назви на ID.
- Якщо ви запускаєте крок встановлення daemon, автентифікація токеном потребує токена, а `gateway.auth.token` керується через SecretRef, configure перевіряє SecretRef, але не зберігає визначені відкриті значення токена в метаданих середовища сервісу supervisor.
- Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена в `gateway.auth.token` не визначено, configure блокує встановлення daemon і надає дієві рекомендації щодо виправлення.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, configure блокує встановлення daemon, доки режим не буде явно задано.

## Приклади

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
