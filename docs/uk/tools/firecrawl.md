---
read_when:
    - Вам потрібне вилучення даних із вебсторінок за допомогою Firecrawl
    - Вам потрібен пошук Firecrawl без ключа (безкоштовний) або `web_fetch` без ключа
    - Для пошуку або вищих лімітів потрібен ключ API Firecrawl
    - Ви хочете використовувати Firecrawl як провайдера web_search
    - Вам потрібен обхід захисту від ботів для web_fetch
summary: Пошук і збирання даних за допомогою Firecrawl та резервний варіант для web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T18:41:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдер `web_search`
- як явні інструменти плагіна: `firecrawl_search` і `firecrawl_scrape`
- як резервний засіб видобування для `web_fetch`

Це розміщена у хмарі служба видобування даних і пошуку, яка підтримує обхід захисту від ботів і кешування, що допомагає працювати із сайтами, які інтенсивно використовують JS, або сторінками, що блокують звичайні HTTP-запити.

## Встановлення плагіна

Установіть офіційний плагін, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Доступ без ключа та ключі API

Firecrawl реєструє два провайдери `web_search`:

- **Пошук Firecrawl** (`firecrawl`) — використовує розміщений у хмарі API `/v2/search` із вашим
  ключем; автоматично виявляється за наявності ключа.
- **Пошук Firecrawl (безплатний)** (`firecrawl-free`) — використовує розміщений у хмарі початковий
  рівень без ключа; ключ API не потрібен. Він доступний **лише за явним вибором** і ніколи не вибирається автоматично, оскільки
  його вибір надсилає ваші пошукові запити до безплатного рівня Firecrawl.

Явно вибраний резервний засіб `web_fetch` Firecrawl також працює без ключа. Явні
інструменти `firecrawl_search` і `firecrawl_scrape` потребують ключа API. Додайте
`FIRECRAWL_API_KEY` до середовища Gateway або налаштуйте його для вищих лімітів.

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

- Вибір Firecrawl під час початкового налаштування або `openclaw configure --section web` автоматично вмикає встановлений плагін Firecrawl.
- Виберіть **Пошук Firecrawl (безплатний)** під час початкового налаштування (або встановіть `provider: "firecrawl-free"`), щоб працювати без ключа API. Провайдер **Пошук Firecrawl** із ключем надсилає `plugins.entries.firecrawl.config.webSearch.apiKey` або `FIRECRAWL_API_KEY`.
- `web_search` із Firecrawl підтримує `query` і `count`.
- Для специфічних елементів керування Firecrawl, як-от `sources`, `categories` або видобування даних із результатів, використовуйте `firecrawl_search`.
- `baseUrl` за замовчуванням використовує розміщений у хмарі Firecrawl за адресою `https://api.firecrawl.dev`. Перевизначення для самостійно розміщених екземплярів дозволені лише для приватних або внутрішніх кінцевих точок; HTTP приймається лише для таких приватних цілей.
- `FIRECRAWL_BASE_URL` — спільна резервна змінна середовища для базових URL-адрес пошуку й видобування даних Firecrawl.
- Стандартний час очікування пошукових запитів Firecrawl становить 30 секунд; параметр `timeoutSeconds` інструмента `firecrawl_search` перевизначає його для окремого виклику.

## Налаштування резервного засобу Firecrawl для web_fetch

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

- Явно вибраний резервний засіб `web_fetch` Firecrawl працює без ключа API. Якщо його налаштовано, OpenClaw надсилає `plugins.entries.firecrawl.config.webFetch.apiKey` або `FIRECRAWL_API_KEY` для отримання вищих лімітів.
- Вибір Firecrawl під час початкового налаштування або `openclaw configure --section web` вмикає плагін і вибирає Firecrawl для `web_fetch`, якщо інший провайдер отримання даних ще не налаштований.
- `firecrawl_scrape` потребує ключа API.
- `maxAgeMs` визначає допустимий вік кешованих результатів (мс). Значення за замовчуванням — 172,800,000 мс (2 дні).
- `onlyMainContent` за замовчуванням має значення `true`; `timeoutSeconds` за замовчуванням має значення 60.
- Застарілу конфігурацію `tools.web.fetch.firecrawl.*` і `tools.web.search.firecrawl.*` автоматично переносить `openclaw doctor --fix`.
- Перевизначення URL-адрес видобування даних і базових URL-адрес Firecrawl дотримуються того самого правила щодо розміщених у хмарі та приватних ресурсів, що й пошук: публічний хмарний трафік використовує `https://api.firecrawl.dev`; перевизначення для самостійно розміщених екземплярів мають відповідати приватним або внутрішнім кінцевим точкам.
- `firecrawl_scrape` відхиляє очевидно приватні, зворотні, метадані та цільові URL-адреси, що не використовують HTTP(S), перш ніж передавати їх Firecrawl, відповідно до контракту безпеки цілей `web_fetch` для явних викликів видобування даних Firecrawl.

`firecrawl_scrape` повторно використовує ті самі налаштування `plugins.entries.firecrawl.config.webFetch.*` і змінні середовища, зокрема обов’язковий ключ API.

### Самостійно розміщений Firecrawl

Установіть `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` або `FIRECRAWL_BASE_URL`, якщо ви запускаєте Firecrawl самостійно. OpenClaw приймає `http://` лише для цілей у зворотному інтерфейсі, приватній мережі, `.local`, `.internal` або `.localhost`. Загальнодоступні власні хости відхиляються, щоб ключі API Firecrawl випадково не надсилалися довільним кінцевим точкам.

## Інструменти плагіна Firecrawl

### `firecrawl_search`

Використовуйте цей інструмент, коли замість універсального `web_search` потрібні специфічні елементи керування пошуком Firecrawl. Потребує ключа API.

Параметри:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (лише імена хостів; взаємовиключні)
- `tbs` (часовий фільтр, наприклад `qdr:d`, `qdr:w`, `sbd:1`)
- `location` і `country` (географічне націлювання)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Використовуйте цей інструмент для сторінок, які інтенсивно використовують JS або захищені від ботів, коли звичайний `web_fetch` працює ненадійно.

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

`firecrawl_scrape` і резервний засіб Firecrawl для `web_fetch` за замовчуванням використовують `proxy: "auto"` разом із `storeInCache: true`, якщо викликач не перевизначить ці параметри. `firecrawl_search` і провайдер Firecrawl для `web_search` не мають елементів керування `proxy`/`storeInCache`; прихований режим проксі застосовується лише до запитів видобування та отримання даних.

Режим `proxy` Firecrawl керує обходом захисту від ботів (`basic`, `stealth` або `auto`). `auto` повторює спробу з прихованими проксі, якщо базова спроба завершується невдало, що може витрачати більше кредитів, ніж видобування даних лише в базовому режимі.

## Як `web_fetch` використовує Firecrawl

Порядок видобування даних `web_fetch`:

1. Readability (локально)
2. Налаштований провайдер отримання даних, як-от Firecrawl (якщо його вибрано або автоматично виявлено за налаштованими обліковими даними)
3. Базове очищення HTML (останній резервний варіант)

Параметр вибору — `tools.web.fetch.provider`. Якщо його пропустити, OpenClaw автоматично виявляє першого готового провайдера отримання вебданих за доступними обліковими даними. Офіційний плагін Firecrawl надає цей резервний засіб.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери й автоматичне виявлення
- [Отримання вебданих](/uk/tools/web-fetch) -- інструмент web_fetch із резервним засобом Firecrawl
- [Tavily](/uk/tools/tavily) -- інструменти пошуку й видобування даних
