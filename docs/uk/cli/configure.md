---
read_when:
    - Ви хочете інтерактивно налаштувати облікові дані, пристрої або типові параметри агента
summary: Довідка CLI для `openclaw configure` (інтерактивні запити конфігурації)
title: Налаштування
x-i18n:
    generated_at: "2026-04-27T06:23:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Інтерактивний запит для налаштування облікових даних, пристроїв і типових параметрів агента.

<Note>
Розділ **Model** містить мультивибір для allowlist `agents.defaults.models` (те, що відображається в `/model` і в засобі вибору моделі). Варіанти налаштування в межах провайдера об’єднують вибрані моделі з наявним allowlist замість заміни не пов’язаних провайдерів, які вже є в конфігурації. Повторний запуск автентифікації провайдера через configure зберігає наявний `agents.defaults.model.primary`. Використовуйте `openclaw models auth login --provider <id> --set-default` або `openclaw models set <model>`, якщо ви свідомо хочете змінити типову модель.
</Note>

Коли configure запускається з варіанта автентифікації провайдера, засоби вибору типової моделі та allowlist автоматично надають перевагу цьому провайдеру. Для парних провайдерів, таких як Volcengine і BytePlus, така сама перевага також застосовується до їхніх варіантів coding-plan (`volcengine-plan/*`, `byteplus-plan/*`). Якщо фільтр preferred-provider призведе до порожнього списку, configure повернеться до каталогу без фільтрації замість показу порожнього засобу вибору.

<Tip>
`openclaw config` без підкоманди відкриває той самий майстер. Використовуйте `openclaw config get|set|unset` для неінтерактивних змін.
</Tip>

Для вебпошуку `openclaw configure --section web` дає змогу вибрати провайдера та налаштувати його облікові дані. Для деяких провайдерів також відображаються додаткові запити, специфічні для провайдера:

- **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і дати змогу вибрати модель `x_search`.
- **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` або `api.moonshot.cn`) і типову модель вебпошуку Kimi.

Пов’язане:

- Довідка з конфігурації Gateway: [Конфігурація](/uk/gateway/configuration)
- Config CLI: [Config](/uk/cli/config)

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

- Вибір місця, де працює Gateway, завжди оновлює `gateway.mode`. Ви можете вибрати «Продовжити» без інших розділів, якщо вам потрібно лише це.
- Під час налаштування служб, орієнтованих на канали (Slack/Discord/Matrix/Microsoft Teams), з’являються запити щодо allowlist каналів/кімнат. Ви можете ввести назви або ID; майстер, коли це можливо, перетворює назви на ID.
- Якщо ви запускаєте крок встановлення демона, автентифікація за токеном потребує токен, а `gateway.auth.token` керується через SecretRef, configure перевіряє SecretRef, але не зберігає розкриті значення токена у відкритому вигляді в метаданих середовища сервісу supervisor.
- Якщо автентифікація за токеном потребує токен, а налаштований SecretRef токена не розв’язується, configure блокує встановлення демона й показує практичні рекомендації щодо виправлення.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, configure блокує встановлення демона, доки режим не буде явно встановлено.

## Приклади

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
