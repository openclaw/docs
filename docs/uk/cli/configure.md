---
read_when:
    - Ви хочете інтерактивно налаштувати облікові дані, пристрої або типові параметри агента
summary: Довідник CLI для `openclaw configure` (інтерактивні запити налаштування)
title: Налаштувати
x-i18n:
    generated_at: "2026-04-24T18:58:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Інтерактивний запит для налаштування облікових даних, пристроїв і типових параметрів агента.

Примітка: Розділ **Model** тепер містить багатовибірний список для allowlist `agents.defaults.models` (що відображається в `/model` і у виборі моделі).
Параметри налаштування в межах провайдера об’єднують вибрані моделі з наявним
allowlist замість заміни не пов’язаних провайдерів, які вже є в конфігурації.
Повторний запуск автентифікації провайдера з configure зберігає наявне значення
`agents.defaults.model.primary`; використовуйте `openclaw models auth login --provider <id> --set-default`
або `openclaw models set <model>`, якщо ви свідомо хочете змінити типову модель.

Коли configure запускається з вибору автентифікації провайдера, засоби вибору типової моделі та
allowlist автоматично надають перевагу цьому провайдеру. Для парних провайдерів, таких
як Volcengine/BytePlus, така сама перевага також застосовується до їхніх варіантів
плану кодування (`volcengine-plan/*`, `byteplus-plan/*`). Якщо фільтр preferred-provider
призводить до порожнього списку, configure повертається до нефільтрованого
каталогу замість показу порожнього списку вибору.

Порада: `openclaw config` без підкоманди відкриває той самий майстер. Використовуйте
`openclaw config get|set|unset` для неінтерактивного редагування.

Для вебпошуку `openclaw configure --section web` дає змогу вибрати провайдера
і налаштувати його облікові дані. Деякі провайдери також показують
подальші запити, специфічні для провайдера:

- **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і
  дати змогу вибрати модель `x_search`.
- **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи
  `api.moonshot.cn`) і типову модель вебпошуку Kimi.

Пов’язано:

- Довідник із конфігурації Gateway: [Configuration](/uk/gateway/configuration)
- CLI конфігурації: [Config](/uk/cli/config)

## Опції

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

- Вибір місця, де працює Gateway, завжди оновлює `gateway.mode`. Ви можете вибрати «Продовжити» без інших розділів, якщо вам потрібно лише це.
- Сервіси, орієнтовані на канали (Slack/Discord/Matrix/Microsoft Teams), під час налаштування запитують allowlist каналів/кімнат. Ви можете вводити назви або ID; майстер, коли це можливо, перетворює назви на ID.
- Якщо ви запускаєте крок встановлення daemon, автентифікація за токеном потребує токена, а `gateway.auth.token` керується через SecretRef, configure перевіряє SecretRef, але не зберігає розкриті відкриті значення токенів у метаданих середовища сервісу supervisor.
- Якщо для автентифікації за токеном потрібен токен, а налаштований SecretRef токена виявляється нерозв’язаним, configure блокує встановлення daemon і надає дієві вказівки щодо виправлення.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, configure блокує встановлення daemon, доки режим не буде явно встановлено.

## Приклади

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Configuration](/uk/gateway/configuration)
