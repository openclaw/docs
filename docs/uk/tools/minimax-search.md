---
read_when:
    - Ви хочете використовувати MiniMax для web_search
    - Вам потрібен ключ MiniMax Token Plan або токен OAuth
    - Вам потрібні рекомендації щодо хоста пошуку MiniMax для Китаю/глобального регіону
summary: Пошук MiniMax через API пошуку тарифного плану Token Plan
title: Пошук MiniMax
x-i18n:
    generated_at: "2026-07-12T13:52:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw підтримує MiniMax як постачальника `web_search` через API пошуку MiniMax
Token Plan. Він повертає структуровані результати пошуку із заголовками, URL-адресами,
фрагментами та пов’язаними запитами.

## Отримання облікових даних Token Plan

<Steps>
  <Step title="Створіть ключ">
    Створіть або скопіюйте ключ MiniMax Token Plan на
    [платформі MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Натомість конфігурації OAuth можуть повторно використовувати `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Збережіть ключ">
    Установіть `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway або налаштуйте його за допомогою:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw також приймає `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` і
`MINIMAX_API_KEY` як альтернативні змінні середовища, які перевіряються в такому порядку після
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` має вказувати на облікові дані
Token Plan із підтримкою пошуку; звичайні ключі API моделей MiniMax можуть не прийматися
кінцевою точкою пошуку Token Plan.

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

**Альтернатива через середовище:** установіть `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` у середовищі Gateway.
Для інсталяції Gateway додайте змінну до `~/.openclaw/.env`.

## Вибір регіону

MiniMax Search використовує такі кінцеві точки:

- Глобальна: `https://api.minimax.io/v1/coding_plan/search`
- Китай: `https://api.minimaxi.com/v1/coding_plan/search`

Якщо `plugins.entries.minimax.config.webSearch.region` не задано, OpenClaw визначає
регіон у такому порядку:

1. `tools.web.search.minimax.region` / належний Plugin параметр `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Це означає, що налаштування для Китаю або `MINIMAX_API_HOST=https://api.minimaxi.com/...`
автоматично залишає MiniMax Search на китайському хості.

Навіть якщо ви автентифікували MiniMax через шлях OAuth `minimax-portal`,
вебпошук усе одно реєструється з ідентифікатором постачальника `minimax`; базова URL-адреса
постачальника OAuth використовується як підказка щодо регіону для вибору китайського або глобального хоста,
а `MINIMAX_OAUTH_TOKEN` може слугувати обліковими даними Bearer для MiniMax Search.

## Підтримувані параметри

| Параметр  | Тип     | Обмеження            | Опис                                                                            |
| --------- | ------- | -------------------- | ------------------------------------------------------------------------------- |
| `query`   | рядок   | обов’язковий         | Рядок пошукового запиту.                                                        |
| `count`   | ціле число | 1–10, типово 5    | Кількість результатів для повернення. OpenClaw скорочує повернений список до цього розміру. |

Фільтри, специфічні для постачальника, наразі не підтримуються.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) — усі постачальники й автоматичне виявлення
- [MiniMax](/uk/providers/minimax) — налаштування моделі, зображень, мовлення й автентифікації
