---
read_when:
    - Ви хочете використовувати MiniMax для web_search
    - Потрібен ключ MiniMax Token Plan або токен OAuth
    - Вам потрібні настанови щодо хоста пошуку MiniMax CN/global
summary: MiniMax Search через API пошуку Token Plan
title: Пошук MiniMax
x-i18n:
    generated_at: "2026-05-02T04:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf721a293d6b244e69d952f433bde83417eb907ef8c0b46d04a567f1b668a32e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw підтримує MiniMax як провайдера `web_search` через пошуковий API MiniMax
Token Plan. Він повертає структуровані результати пошуку з назвами, URL,
фрагментами та пов’язаними запитами.

## Отримайте облікові дані Token Plan

<Steps>
  <Step title="Створіть ключ">
    Створіть або скопіюйте ключ MiniMax Token Plan із
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Налаштування OAuth натомість можуть повторно використовувати `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw також приймає `MINIMAX_CODING_API_KEY` і `MINIMAX_OAUTH_TOKEN` як
псевдоніми змінних середовища. `MINIMAX_API_KEY` досі зчитується як резервний варіант сумісності, коли він
уже вказує на облікові дані token-plan.

## Конфігурація

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Альтернатива через середовище:** задайте `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_OAUTH_TOKEN`
у середовищі Gateway.
Для встановлення Gateway помістіть його в `~/.openclaw/.env`.

## Вибір регіону

MiniMax Search використовує такі кінцеві точки:

- Глобальний: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Якщо `plugins.entries.minimax.config.webSearch.region` не задано, OpenClaw визначає
регіон у такому порядку:

1. `tools.web.search.minimax.region` / належний Plugin `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Це означає, що налаштування CN або `MINIMAX_API_HOST=https://api.minimaxi.com/...`
автоматично також залишає MiniMax Search на хості CN.

Навіть якщо ви автентифікували MiniMax через шлях OAuth `minimax-portal`,
вебпошук усе одно реєструється з ідентифікатором провайдера `minimax`; базовий URL провайдера OAuth
використовується як підказка регіону для вибору хоста CN/global, а `MINIMAX_OAUTH_TOKEN`
може задовольнити облікові дані bearer для MiniMax Search.

## Підтримувані параметри

MiniMax Search підтримує:

- `query`
- `count` (OpenClaw обрізає повернений список результатів до запитаної кількості)

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери й автоматичне виявлення
- [MiniMax](/uk/providers/minimax) -- налаштування моделі, зображень, мовлення й автентифікації
