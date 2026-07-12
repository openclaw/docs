---
read_when:
    - Вам потрібне вилучення вебданих за допомогою Firecrawl
    - Вам потрібен Firecrawl `web_fetch` без ключа
    - Вам потрібен API-ключ Firecrawl для пошуку або вищих лімітів
    - Ви хочете використовувати Firecrawl як провайдера web_search
    - Вам потрібне вилучення даних із захистом від ботів для web_fetch
summary: Пошук і скрапінг за допомогою Firecrawl та резервний варіант web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T13:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдер `web_search`
- як явні інструменти Plugin: `firecrawl_search` і `firecrawl_scrape`
- як резервний засіб вилучення для `web_fetch`

Це розміщена в хмарі служба вилучення та пошуку, яка підтримує обхід захисту від ботів і кешування, що допомагає працювати із сайтами, які активно використовують JS, або сторінками, що блокують звичайні HTTP-запити.

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` без ключа та ключі API

Явно вибраний розміщений у хмарі резервний провайдер Firecrawl для `web_fetch` підтримує початковий доступ без ключа API. Додайте `FIRECRAWL_API_KEY` до середовища Gateway або налаштуйте його, коли знадобляться вищі ліміти. Для Firecrawl `web_search` і `firecrawl_scrape` потрібен ключ API.

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

- Вибір Firecrawl під час початкового налаштування або в `openclaw configure --section web` автоматично вмикає встановлений Plugin Firecrawl.
- `web_search` із Firecrawl підтримує `query` і `count`.
- Для спеціальних параметрів Firecrawl, як-от `sources`, `categories` або вилучення вмісту з результатів, використовуйте `firecrawl_search`.
- За замовчуванням `baseUrl` указує на розміщений у хмарі Firecrawl за адресою `https://api.firecrawl.dev`. Перевизначення для самостійно розміщених екземплярів дозволено лише для приватних або внутрішніх кінцевих точок; HTTP приймається лише для таких приватних цілей.
- `FIRECRAWL_BASE_URL` — спільне резервне значення зі змінної середовища для базових URL пошуку та вилучення Firecrawl.
- Стандартний час очікування пошукових запитів Firecrawl становить 30 секунд; параметр `timeoutSeconds` інструмента `firecrawl_search` перевизначає його для окремого виклику.

## Налаштування резервного провайдера Firecrawl для `web_fetch`

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // явний вибір вмикає резервний доступ без ключа
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

- Явно вибраний резервний провайдер Firecrawl для `web_fetch` працює без ключа API. Якщо ключ налаштовано, OpenClaw надсилає `plugins.entries.firecrawl.config.webFetch.apiKey` або `FIRECRAWL_API_KEY`, щоб отримати вищі ліміти.
- Вибір Firecrawl під час початкового налаштування або в `openclaw configure --section web` вмикає Plugin і вибирає Firecrawl для `web_fetch`, якщо інший провайдер отримання вмісту ще не налаштований.
- Для `firecrawl_scrape` потрібен ключ API.
- `maxAgeMs` визначає допустимий вік кешованих результатів у мілісекундах. Значення за замовчуванням — 172 800 000 мс (2 дні).
- Значення `onlyMainContent` за замовчуванням — `true`, а `timeoutSeconds` — 60.
- Застаріла конфігурація `tools.web.fetch.firecrawl.*` і `tools.web.search.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.
- Перевизначення URL для вилучення та базового URL Firecrawl підпорядковуються тому самому правилу щодо розміщених у хмарі та приватних адрес, що й пошук: публічний хмарний трафік використовує `https://api.firecrawl.dev`, а перевизначення для самостійно розміщених екземплярів мають указувати на приватні або внутрішні кінцеві точки.
- Перш ніж пересилати цільові URL до Firecrawl, `firecrawl_scrape` відхиляє очевидні приватні адреси, адреси local loopback, адреси служб метаданих і URL із протоколами, відмінними від HTTP(S), відповідно до контракту безпеки цілей `web_fetch` для явних викликів вилучення Firecrawl.

`firecrawl_scrape` повторно використовує ті самі налаштування `plugins.entries.firecrawl.config.webFetch.*` і змінні середовища, зокрема обов’язковий ключ API.

### Самостійно розміщений Firecrawl

Установіть `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` або `FIRECRAWL_BASE_URL`, якщо запускаєте Firecrawl самостійно. OpenClaw приймає `http://` лише для цілей local loopback, приватної мережі, `.local`, `.internal` або `.localhost`. Публічні користувацькі хости відхиляються, щоб ключі API Firecrawl випадково не надсилалися довільним кінцевим точкам.

## Інструменти Plugin Firecrawl

### `firecrawl_search`

Використовуйте цей інструмент, коли замість універсального `web_search` потрібні спеціальні параметри пошуку Firecrawl.

Параметри:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Використовуйте цей інструмент для сторінок, які активно використовують JS або захищені від ботів і з якими звичайний `web_fetch` працює ненадійно.

Параметри:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Прихований режим і обхід захисту від ботів

Для `firecrawl_scrape` і резервного провайдера Firecrawl для `web_fetch` за замовчуванням використовуються `proxy: "auto"` та `storeInCache: true`, якщо викликач не перевизначає ці параметри. `firecrawl_search` і провайдер Firecrawl для `web_search` не мають параметрів `proxy`/`storeInCache`; прихований режим проксі застосовується лише до запитів вилучення або отримання вмісту.

Режим `proxy` у Firecrawl керує обходом захисту від ботів (`basic`, `stealth` або `auto`). У режимі `auto`, якщо базова спроба завершується невдало, запит повторюється з прихованими проксі, що може витрачати більше кредитів, ніж вилучення лише в режимі `basic`.

## Як `web_fetch` використовує Firecrawl

Порядок вилучення в `web_fetch`:

1. Readability (локально)
2. Налаштований провайдер отримання вмісту, наприклад Firecrawl (якщо його вибрано або автоматично виявлено за налаштованими обліковими даними)
3. Базове очищення HTML (останній резервний варіант)

Параметр вибору — `tools.web.fetch.provider`. Якщо його не вказати, OpenClaw автоматично визначає перший готовий провайдер отримання вебвмісту за доступними обліковими даними. Офіційний Plugin Firecrawl надає цей резервний варіант.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери та автоматичне визначення
- [Отримання вебвмісту](/uk/tools/web-fetch) -- інструмент `web_fetch` із резервним провайдером Firecrawl
- [Tavily](/uk/tools/tavily) -- інструменти пошуку та вилучення
