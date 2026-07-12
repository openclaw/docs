---
read_when:
    - Ви хочете використовувати Kimi для web_search
    - Вам потрібен KIMI_API_KEY або MOONSHOT_API_KEY
summary: Вебпошук Kimi через вебпошук Moonshot
title: Пошук Kimi
x-i18n:
    generated_at: "2026-07-12T13:53:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi — це постачальник `web_search`, що використовує вбудований вебпошук Moonshot. Moonshot
синтезує одну відповідь із вбудованими посиланнями на джерела, подібно до постачальників
обґрунтованих відповідей Gemini та Grok, замість повернення ранжованого списку результатів.

## Налаштування

<Steps>
  <Step title="Створіть ключ">
    Отримайте ключ API в [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Збережіть ключ">
    Установіть `KIMI_API_KEY` або `MOONSHOT_API_KEY` у середовищі Gateway (для
    інсталяції Gateway додайте його до `~/.openclaw/.env`) або налаштуйте за допомогою:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Вибір **Kimi** під час виконання `openclaw onboard` або `openclaw configure --section web`
також пропонує вказати:

- регіон API Moonshot: `https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`
- модель вебпошуку (типово `kimi-k2.6`)

## Конфігурація

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // необов’язково, якщо встановлено KIMI_API_KEY або MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Якщо `tools.web.search.provider` не вказано, його автоматично визначають за доступними ключами API;
явно встановіть значення `kimi`, якщо налаштовано облікові дані для кількох постачальників пошуку.

Також працює еквівалентна форма з областю видимості в `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`);
обидві форми об’єднуються в одну підсумкову конфігурацію.

Типові значення: якщо `baseUrl` не вказано, використовується `https://api.moonshot.ai/v1`, а для `model`
типовим значенням є `kimi-k2.6`.

Якщо трафік чату використовує китайський хост (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), Kimi `web_search` автоматично використовує той самий хост,
коли його власний `baseUrl` не задано, тож ключі `.cn` випадково не надсилаються до
міжнародної кінцевої точки (яка повертає HTTP 401 для таких ключів). Щоб перевизначити
це успадкування, явно задайте `baseUrl` для Kimi.

## Вимога щодо обґрунтування

OpenClaw повертає результат Kimi `web_search` лише після того, як відповідь Moonshot
містить вбудовані докази обґрунтування вебпошуком, як-от повтор виклику інструмента
`$web_search`, `search_results` або URL-адреси цитувань. Якщо Kimi відповідає безпосередньо
без обґрунтування (наприклад, «Я не можу переглядати інтернет»), OpenClaw повертає
помилку `kimi_web_search_ungrounded`, а не вважає цей текст результатом пошуку.
Повторіть запит, перейдіть на постачальника структурованих результатів, наприклад Brave,
або скористайтеся `web_fetch` чи інструментом браузера, якщо вже маєте цільову URL-адресу.

## Параметри інструмента

| Параметр                                                        | Підтримка                                                                                                                         |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Так                                                                                                                               |
| `count`                                                         | Приймається для сумісності між постачальниками, але ігнорується: Kimi завжди повертає одну синтезовану відповідь, а не список із N результатів |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Ні                                                                                                                                |

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) — усі постачальники та автоматичне визначення
- [Moonshot AI](/uk/providers/moonshot) — документація постачальника моделей Moonshot і Kimi Coding
- [Пошук Gemini](/uk/tools/gemini-search) — синтезовані ШІ відповіді з обґрунтуванням від Google
- [Пошук Grok](/uk/tools/grok-search) — синтезовані ШІ відповіді з обґрунтуванням від xAI
