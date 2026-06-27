---
read_when:
    - Вам потрібне вебвитягування на базі Firecrawl
    - Вам потрібен keyless Firecrawl web_fetch
    - Вам потрібен API-ключ Firecrawl для пошуку або вищих лімітів
    - Вам потрібен Firecrawl як провайдер web_search
    - Вам потрібне витягування з антибот-захистом для web_fetch
summary: Пошук, збирання даних і резервний варіант web_fetch у Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:25:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдера `web_search`
- як явні інструменти Plugin: `firecrawl_search` і `firecrawl_scrape`
- як резервний екстрактор для `web_fetch`

Це розміщений сервіс витягування даних і пошуку, який підтримує обхід бот-захисту та кешування,
що допомагає із сайтами з великою кількістю JS або сторінками, які блокують звичайні HTTP-запити.

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch без ключа й API-ключі

Явно вибраний резервний розміщений Firecrawl для `web_fetch` підтримує стартовий
доступ без API-ключа. Додайте `FIRECRAWL_API_KEY` у середовище gateway
або налаштуйте його, коли потрібні вищі ліміти. Firecrawl `web_search` і
`firecrawl_scrape` потребують API-ключа.

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

- Вибір Firecrawl під час onboarding або `openclaw configure --section web` автоматично вмикає встановлений Plugin Firecrawl.
- `web_search` із Firecrawl підтримує `query` і `count`.
- Для специфічних елементів керування Firecrawl, як-от `sources`, `categories` або scraping результатів, використовуйте `firecrawl_search`.
- `baseUrl` за замовчуванням вказує на розміщений Firecrawl за адресою `https://api.firecrawl.dev`. Самостійно розміщені перевизначення дозволені лише для приватних/внутрішніх кінцевих точок; HTTP приймається лише для таких приватних цілей.
- `FIRECRAWL_BASE_URL` є спільним резервним значенням env для базових URL пошуку й scrape у Firecrawl.

## Налаштування резервного Firecrawl для web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Явно вибраний резервний Firecrawl для `web_fetch` працює без API-ключа. Коли його налаштовано, OpenClaw надсилає `plugins.entries.firecrawl.config.webFetch.apiKey` або `FIRECRAWL_API_KEY` для вищих лімітів.
- Вибір Firecrawl під час onboarding або `openclaw configure --section web` вмикає Plugin і вибирає Firecrawl для `web_fetch`, якщо інший провайдер fetch ще не налаштований.
- `firecrawl_scrape` потребує API-ключа.
- `maxAgeMs` керує тим, наскільки старими можуть бути кешовані результати (мс). За замовчуванням — 2 дні.
- Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.
- Перевизначення URL для scrape/base у Firecrawl дотримуються того самого правила для розміщених/приватних цілей, що й пошук: публічний розміщений трафік використовує `https://api.firecrawl.dev`; самостійно розміщені перевизначення мають резолвитися у приватні/внутрішні кінцеві точки.
- `firecrawl_scrape` відхиляє очевидні приватні, loopback, metadata та не-HTTP(S) цільові URL перед пересиланням їх до Firecrawl, відповідно до контракту безпеки цілей `web_fetch` для явних викликів scrape Firecrawl.

`firecrawl_scrape` повторно використовує ті самі налаштування `plugins.entries.firecrawl.config.webFetch.*` і змінні env, зокрема потрібний API-ключ.

### Самостійно розміщений Firecrawl

Установіть `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` або `FIRECRAWL_BASE_URL`,
коли запускаєте Firecrawl самостійно. OpenClaw приймає `http://` лише для цілей
loopback, приватної мережі, `.local`, `.internal` або `.localhost`. Публічні користувацькі
хости відхиляються, щоб API-ключі Firecrawl випадково не надсилалися на довільні кінцеві точки.

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

Використовуйте це для сторінок із великою кількістю JS або захистом від ботів, де звичайний `web_fetch` слабкий.

Основні параметри:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Непомітність / обхід бот-захисту

Firecrawl надає параметр **proxy mode** для обходу бот-захисту (`basic`, `stealth` або `auto`).
OpenClaw завжди використовує `proxy: "auto"` разом із `storeInCache: true` для запитів Firecrawl.
Якщо proxy опущено, Firecrawl за замовчуванням використовує `auto`. `auto` повторює спробу зі stealth-проксі, якщо базова спроба не вдалася, що може використовувати більше кредитів,
ніж scraping лише в basic-режимі.

## Як `web_fetch` використовує Firecrawl

Порядок витягування в `web_fetch`:

1. Readability (локально)
2. Firecrawl (коли вибрано або автоматично виявлено з налаштованих облікових даних)
3. Базове очищення HTML (останній резервний варіант)

Перемикач вибору — `tools.web.fetch.provider`. Якщо його опустити, OpenClaw
автоматично виявляє першого готового провайдера web-fetch з доступних облікових даних.
Офіційний Plugin Firecrawl надає цей резервний варіант.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автоматичне виявлення
- [Web Fetch](/uk/tools/web-fetch) -- інструмент web_fetch із резервним Firecrawl
- [Tavily](/uk/tools/tavily) -- інструменти пошуку й витягування даних
