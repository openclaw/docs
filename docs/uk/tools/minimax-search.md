---
read_when:
    - Ви хочете використовувати MiniMax для web_search
    - Вам потрібен ключ MiniMax Token Plan або токен OAuth
    - Вам потрібні вказівки щодо хоста пошуку MiniMax CN/глобального
summary: Пошук MiniMax через API пошуку Token Plan
title: Пошук MiniMax
x-i18n:
    generated_at: "2026-05-02T05:03:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw підтримує MiniMax як провайдера `web_search` через пошуковий API MiniMax
Token Plan. Він повертає структуровані результати пошуку із заголовками, URL,
фрагментами та пов’язаними запитами.

## Отримайте облікові дані Token Plan

<Steps>
  <Step title="Create a key">
    Створіть або скопіюйте ключ MiniMax Token Plan з
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Налаштування OAuth натомість можуть повторно використовувати `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Store the key">
    Задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw також приймає `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` і
`MINIMAX_API_KEY` як псевдоніми змінних середовища. `MINIMAX_API_KEY` має вказувати на
облікові дані Token Plan з увімкненим пошуком; звичайні API-ключі моделей MiniMax можуть
не прийматися пошуковим endpoint Token Plan.

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

**Альтернатива через середовище:** задайте `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` у середовищі Gateway.
Для інсталяції Gateway помістіть його в `~/.openclaw/.env`.

## Вибір регіону

MiniMax Search використовує такі endpoint:

- Глобальний: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Якщо `plugins.entries.minimax.config.webSearch.region` не задано, OpenClaw визначає
регіон у такому порядку:

1. `tools.web.search.minimax.region` / належний Plugin `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Це означає, що онбординг CN або `MINIMAX_API_HOST=https://api.minimaxi.com/...`
автоматично також утримує MiniMax Search на хості CN.

Навіть якщо ви автентифікували MiniMax через шлях OAuth `minimax-portal`,
вебпошук усе одно реєструється з ідентифікатором провайдера `minimax`; базовий URL
OAuth-провайдера використовується як підказка регіону для вибору хоста CN/global, а `MINIMAX_OAUTH_TOKEN`
може задовольнити bearer-облікові дані MiniMax Search.

## Підтримувані параметри

MiniMax Search підтримує:

- `query`
- `count` (OpenClaw обрізає повернений список результатів до запитаної кількості)

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [MiniMax](/uk/providers/minimax) -- налаштування моделі, зображень, мовлення та автентифікації
