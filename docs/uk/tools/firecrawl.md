---
read_when:
    - Ви хочете використовувати вебвитягування на базі Firecrawl
    - Вам потрібен API key Firecrawl
    - Ви хочете використовувати Firecrawl як провайдера `web_search`
    - Ви хочете витягування для `web_fetch` з обходом антибот-захисту
summary: Пошук Firecrawl, scrape і fallback для web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-04-23T21:14:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдера `web_search`
- як явні інструменти Plugin: `firecrawl_search` і `firecrawl_scrape`
- як fallback-екстрактор для `web_fetch`

Це hosted-сервіс для витягування/пошуку, який підтримує обхід ботозахисту й кешування,
що допомагає з сайтами, насиченими JS, або сторінками, які блокують звичайні HTTP-запити.

## Отримайте API key

1. Створіть обліковий запис Firecrawl і згенеруйте API key.
2. Збережіть його в config або задайте `FIRECRAWL_API_KEY` у середовищі gateway.

## Налаштування пошуку Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Примітки:

- Вибір Firecrawl під час onboarding або в `openclaw configure --section web` автоматично вмикає bundled Plugin Firecrawl.
- `web_search` з Firecrawl підтримує `query` і `count`.
- Для специфічних для Firecrawl параметрів, як-от `sources`, `categories` або scrape результатів, використовуйте `firecrawl_search`.
- Перевизначення `baseUrl` мають залишатися на `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` — це спільний env fallback для базових URL пошуку й scrape Firecrawl.

## Налаштування Firecrawl scrape + fallback для web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Примітки:

- Спроби fallback Firecrawl виконуються лише тоді, коли доступний API key (`plugins.entries.firecrawl.config.webFetch.apiKey` або `FIRECRAWL_API_KEY`).
- `maxAgeMs` визначає, наскільки старими можуть бути кешовані результати (мс). Типове значення — 2 дні.
- Застаріла config `tools.web.fetch.firecrawl.*` автоматично мігрується через `openclaw doctor --fix`.
- Перевизначення URL scrape/base для Firecrawl обмежені `https://api.firecrawl.dev`.

`firecrawl_scrape` повторно використовує ті самі параметри `plugins.entries.firecrawl.config.webFetch.*` і env vars.

## Інструменти Plugin Firecrawl

### `firecrawl_search`

Використовуйте цей інструмент, коли вам потрібні специфічні для Firecrawl параметри пошуку замість загального `web_search`.

Основні параметри:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Використовуйте його для сторінок з важким JS або ботозахистом, де звичайний `web_fetch` слабкий.

Основні параметри:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / обхід ботозахисту

Firecrawl надає параметр **режиму proxy** для обходу ботозахисту (`basic`, `stealth` або `auto`).
OpenClaw завжди використовує `proxy: "auto"` плюс `storeInCache: true` для запитів Firecrawl.
Якщо proxy не вказано, Firecrawl типово використовує `auto`. `auto` повторює спробу зі stealth-proxy, якщо базова спроба не вдалася, що може витрачати більше кредитів,
ніж scrape лише в режимі basic.

## Як `web_fetch` використовує Firecrawl

Порядок витягування для `web_fetch`:

1. Readability (локально)
2. Firecrawl (якщо вибрано або автоматично визначено як активний fallback для web-fetch)
3. Базове очищення HTML (останній fallback)

Перемикач вибору — це `tools.web.fetch.provider`. Якщо ви його не задаєте, OpenClaw
автоматично визначає першого готового провайдера web-fetch на основі доступних облікових даних.
Наразі bundled-провайдером є Firecrawl.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автовизначення
- [Web Fetch](/uk/tools/web-fetch) -- інструмент web_fetch з fallback через Firecrawl
- [Tavily](/uk/tools/tavily) -- інструменти пошуку й витягування
