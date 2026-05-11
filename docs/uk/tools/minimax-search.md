---
read_when:
    - Ви хочете використовувати MiniMax для web_search
    - Потрібен ключ MiniMax Token Plan або токен OAuth
    - Вам потрібні настанови щодо пошукового хоста MiniMax для CN/глобального середовища
summary: Пошук MiniMax через API пошуку Token Plan
title: Пошук MiniMax
x-i18n:
    generated_at: "2026-05-11T21:01:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw підтримує MiniMax як провайдера `web_search` через пошуковий API MiniMax Token Plan. Він повертає структуровані результати пошуку з заголовками, URL, фрагментами та пов’язаними запитами.

## Отримання облікових даних Token Plan

<Steps>
  <Step title="Створіть ключ">
    Створіть або скопіюйте ключ MiniMax Token Plan у
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Налаштування OAuth можуть натомість повторно використовувати `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw також приймає `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` і
`MINIMAX_API_KEY` як псевдоніми змінних середовища. `MINIMAX_API_KEY` має вказувати на
облікові дані Token Plan із підтримкою пошуку; звичайні API-ключі моделей MiniMax можуть не
прийматися пошуковою кінцевою точкою Token Plan.

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
Для встановлення gateway розмістіть це в `~/.openclaw/.env`.

## Вибір регіону

MiniMax Search використовує такі кінцеві точки:

- Глобальна: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Якщо `plugins.entries.minimax.config.webSearch.region` не задано, OpenClaw визначає
регіон у такому порядку:

1. `tools.web.search.minimax.region` / належний Plugin `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Це означає, що онбординг CN або `MINIMAX_API_HOST=https://api.minimaxi.com/...`
автоматично також утримує MiniMax Search на хості CN.

Навіть коли ви автентифікували MiniMax через OAuth-шлях `minimax-portal`,
вебпошук все одно реєструється з ідентифікатором провайдера `minimax`; базовий URL
провайдера OAuth використовується як підказка регіону для вибору хоста CN/global, а `MINIMAX_OAUTH_TOKEN`
може задовольнити облікові дані bearer для MiniMax Search.

## Підтримувані параметри

| Параметр | Тип     | Обмеження  | Опис                                                                        |
| -------- | ------- | ---------- | --------------------------------------------------------------------------- |
| `query`  | string  | required   | Рядок пошукового запиту.                                                    |
| `count`  | integer | 1-10       | Кількість результатів для повернення. OpenClaw обрізає повернений список до цього розміру. |

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовизначення
- [MiniMax](/uk/providers/minimax) -- налаштування моделі, зображень, мовлення та автентифікації
