---
read_when:
    - Вам потрібне вилучення даних із вебу на базі Firecrawl
    - Вам потрібен API-ключ Firecrawl
    - Вам потрібен Firecrawl як провайдер web_search
    - Вам потрібне витягування з обходом антибот-захисту для web_fetch
summary: Пошук і скрейпінг Firecrawl та резервний варіант web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T06:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдер `web_search`
- як явні інструменти Plugin: `firecrawl_search` і `firecrawl_scrape`
- як резервний екстрактор для `web_fetch`

Це розміщений сервіс екстракції/пошуку, який підтримує обхід бот-захисту та кешування,
що допомагає із сайтами, які активно використовують JS, або сторінками, що блокують звичайні HTTP-запити.

## Отримайте API-ключ

1. Створіть обліковий запис Firecrawl і згенеруйте API-ключ.
2. Збережіть його в конфігурації або встановіть `FIRECRAWL_API_KEY` у середовищі gateway.

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

- Вибір Firecrawl під час onboarding або `openclaw configure --section web` автоматично вмикає вбудований Plugin Firecrawl.
- `web_search` із Firecrawl підтримує `query` і `count`.
- Для специфічних елементів керування Firecrawl, як-от `sources`, `categories` або scraping результатів, використовуйте `firecrawl_search`.
- `baseUrl` за замовчуванням вказує на розміщений Firecrawl за адресою `https://api.firecrawl.dev`. Перевизначення для self-hosted дозволені лише для приватних/внутрішніх endpoint; HTTP приймається лише для таких приватних цілей.
- `FIRECRAWL_BASE_URL` є спільним резервним значенням env для базових URL пошуку та scrape Firecrawl.

## Налаштуйте Firecrawl scrape + резервний варіант web_fetch

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
- `maxAgeMs` керує тим, наскільки старими можуть бути кешовані результати (мс). За замовчуванням — 2 дні.
- Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.
- Перевизначення scrape/base URL Firecrawl дотримуються того самого правила розміщеного/приватного доступу, що й пошук: публічний розміщений трафік використовує `https://api.firecrawl.dev`; self-hosted перевизначення мають резолвитися у приватні/внутрішні endpoint.
- `firecrawl_scrape` відхиляє очевидні приватні, loopback, metadata та не-HTTP(S) цільові URL перед пересиланням їх до Firecrawl, відповідно до контракту безпеки цілей `web_fetch` для явних викликів Firecrawl scrape.

`firecrawl_scrape` повторно використовує ті самі налаштування `plugins.entries.firecrawl.config.webFetch.*` і змінні env.

### Self-hosted Firecrawl

Встановіть `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` або `FIRECRAWL_BASE_URL`,
коли запускаєте Firecrawl самостійно. OpenClaw приймає `http://` лише для loopback,
private-network, `.local`, `.internal` або `.localhost` цілей. Публічні користувацькі
хости відхиляються, щоб API-ключі Firecrawl випадково не надсилалися на довільні endpoint.

## Інструменти Plugin Firecrawl

### `firecrawl_search`

Використовуйте це, коли потрібні специфічні елементи керування пошуком Firecrawl замість загального `web_search`.

Основні параметри:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Використовуйте це для сторінок із активним JS або бот-захистом, де звичайний `web_fetch` працює слабко.

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
OpenClaw завжди використовує `proxy: "auto"` разом із `storeInCache: true` для запитів Firecrawl.
Якщо proxy не вказано, Firecrawl за замовчуванням використовує `auto`. `auto` повторює спробу зі stealth-проксі, якщо базова спроба не вдалася, що може використовувати більше кредитів,
ніж scraping лише в basic-режимі.

## Як `web_fetch` використовує Firecrawl

Порядок екстракції `web_fetch`:

1. Readability (локально)
2. Firecrawl (якщо вибрано або автоматично визначено як активний резервний провайдер web-fetch)
3. Базове очищення HTML (останній резервний варіант)

Перемикач вибору — `tools.web.fetch.provider`. Якщо його пропущено, OpenClaw
автоматично визначає першого готового провайдера web-fetch із доступних облікових даних.
Наразі вбудованим провайдером є Firecrawl.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автоматичне визначення
- [Web Fetch](/uk/tools/web-fetch) -- інструмент web_fetch із резервним варіантом Firecrawl
- [Tavily](/uk/tools/tavily) -- інструменти пошуку й екстракції
