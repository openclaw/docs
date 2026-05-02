---
read_when:
    - Вам потрібне витягування даних із вебу на базі Firecrawl
    - Вам потрібен ключ API Firecrawl
    - Вам потрібен Firecrawl як провайдер web_search
    - Вам потрібне отримання даних з обходом антибот-захисту для web_fetch
summary: Пошук і скрапінг Firecrawl, а також резервний варіант web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T05:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a04a9585dac65579454c5b9539a5fc1e315392c5956b9273e370406ecdbbd3e
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдера `web_search`
- як явні інструменти Plugin: `firecrawl_search` і `firecrawl_scrape`
- як резервний екстрактор для `web_fetch`

Це хостинговий сервіс витягування/пошуку, який підтримує обхід бот-захисту й кешування,
що допомагає з сайтами, насиченими JS, або сторінками, які блокують звичайні HTTP-запити.

## Отримайте API-ключ

1. Створіть обліковий запис Firecrawl і згенеруйте API-ключ.
2. Збережіть його в конфігурації або задайте `FIRECRAWL_API_KEY` у середовищі gateway.

## Налаштуйте пошук Firecrawl

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

- Вибір Firecrawl під час онбордингу або через `openclaw configure --section web` автоматично вмикає вбудований Plugin Firecrawl.
- `web_search` із Firecrawl підтримує `query` і `count`.
- Для специфічних для Firecrawl елементів керування, як-от `sources`, `categories` або скрапінг результатів, використовуйте `firecrawl_search`.
- `baseUrl` за замовчуванням указує на хостинговий Firecrawl за адресою `https://api.firecrawl.dev`. Самостійно розгорнуті перевизначення дозволені лише для приватних/внутрішніх кінцевих точок; HTTP приймається лише для таких приватних цілей.
- `FIRECRAWL_BASE_URL` є спільним резервним значенням env для базових URL пошуку й скрапінгу Firecrawl.

## Налаштуйте скрапінг Firecrawl + резерв для web_fetch

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

- Резервні спроби Firecrawl виконуються лише тоді, коли доступний API-ключ (`plugins.entries.firecrawl.config.webFetch.apiKey` або `FIRECRAWL_API_KEY`).
- `maxAgeMs` керує тим, наскільки старими можуть бути кешовані результати (мс). Значення за замовчуванням — 2 дні.
- Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.
- Перевизначення URL скрапінгу/базового URL Firecrawl дотримуються того самого правила хостингового/приватного доступу, що й пошук: публічний хостинговий трафік використовує `https://api.firecrawl.dev`; самостійно розгорнуті перевизначення мають вказувати на приватні/внутрішні кінцеві точки.

`firecrawl_scrape` повторно використовує ті самі налаштування `plugins.entries.firecrawl.config.webFetch.*` і змінні env.

### Самостійно розгорнутий Firecrawl

Задайте `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` або `FIRECRAWL_BASE_URL`,
коли запускаєте Firecrawl самостійно. OpenClaw приймає `http://` лише для цілей loopback,
приватної мережі, `.local`, `.internal` або `.localhost`. Публічні власні
хости відхиляються, щоб API-ключі Firecrawl випадково не надсилалися на довільні
кінцеві точки.

## Інструменти Plugin Firecrawl

### `firecrawl_search`

Використовуйте це, коли потрібні специфічні для Firecrawl елементи керування пошуком замість універсального `web_search`.

Основні параметри:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Використовуйте це для сторінок, насичених JS або захищених від ботів, де звичайний `web_fetch` працює слабко.

Основні параметри:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / обхід бот-захисту

Firecrawl надає параметр **proxy mode** для обходу бот-захисту (`basic`, `stealth` або `auto`).
OpenClaw завжди використовує `proxy: "auto"` плюс `storeInCache: true` для запитів Firecrawl.
Якщо proxy пропущено, Firecrawl за замовчуванням використовує `auto`. `auto` повторює спробу зі stealth-проксі, якщо базова спроба не вдалася, що може використати більше кредитів,
ніж скрапінг лише в базовому режимі.

## Як `web_fetch` використовує Firecrawl

Порядок витягування `web_fetch`:

1. Readability (локально)
2. Firecrawl (якщо вибрано або автоматично визначено як активний резервний провайдер web-fetch)
3. Базове очищення HTML (останній резерв)

Перемикач вибору — `tools.web.fetch.provider`. Якщо його пропустити, OpenClaw
автоматично визначає першого готового провайдера web-fetch із доступних облікових даних.
Наразі вбудованим провайдером є Firecrawl.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автоматичне визначення
- [Web Fetch](/uk/tools/web-fetch) -- інструмент web_fetch із резервом Firecrawl
- [Tavily](/uk/tools/tavily) -- інструменти пошуку й витягування
