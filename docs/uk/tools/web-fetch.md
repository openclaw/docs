---
read_when:
    - Ви хочете отримати URL і видобути читабельний вміст
    - Вам потрібно налаштувати `web_fetch` або його fallback Firecrawl
    - Ви хочете зрозуміти обмеження й кешування `web_fetch`
sidebarTitle: Web Fetch
summary: tool `web_fetch` -- HTTP-fetch із видобуванням читабельного вмісту
title: Web fetch
x-i18n:
    generated_at: "2026-04-23T21:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7acdaf47c46400c2e08a17a0bfd18182499250b085dc97fab9161bfebf9451ec
    source_path: tools/web-fetch.md
    workflow: 15
---

Tool `web_fetch` виконує звичайний HTTP GET і видобуває читабельний вміст
(HTML у markdown або text). Він **не** виконує JavaScript.

Для сайтів із важким JS або сторінок, захищених входом, використовуйте
[Web Browser](/uk/tools/browser).

## Швидкий старт

`web_fetch` **увімкнений типово** — жодної конфігурації не потрібно. Агент може
викликати його одразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметри tool

| Параметр      | Тип      | Опис                                      |
| ------------- | -------- | ----------------------------------------- |
| `url`         | `string` | URL для отримання (обов’язково, лише http/https) |
| `extractMode` | `string` | `"markdown"` (типово) або `"text"`        |
| `maxChars`    | `number` | Обрізати вивід до цієї кількості символів |

## Як це працює

<Steps>
  <Step title="Отримання">
    Надсилає HTTP GET із Chrome-подібним User-Agent і заголовком `Accept-Language`.
    Блокує приватні/внутрішні hostnames і повторно перевіряє redirects.
  </Step>
  <Step title="Видобування">
    Запускає Readability (видобування основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Fallback (необов’язково)">
    Якщо Readability завершується помилкою і налаштовано Firecrawl, виконує повторну спробу через
    API Firecrawl у режимі обходу bot-захисту.
  </Step>
  <Step title="Кеш">
    Результати кешуються на 15 хвилин (налаштовується), щоб зменшити повторні
    отримання того самого URL.
  </Step>
</Steps>

## Конфігурація

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Якщо видобування через Readability завершується помилкою, `web_fetch` може повернутися до
[Firecrawl](/uk/tools/firecrawl) для обходу bot-захисту та кращого видобування:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` підтримує об’єкти SecretRef.
Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується через `openclaw doctor --fix`.

<Note>
  Якщо Firecrawl увімкнений і його SecretRef не розв’язується без
  резервного env `FIRECRAWL_API_KEY`, запуск gateway завершується швидкою помилкою.
</Note>

<Note>
  Перевизначення `baseUrl` Firecrawl жорстко обмежені: вони мають використовувати `https://` і
  офіційний хост Firecrawl (`api.firecrawl.dev`).
</Note>

Поточна поведінка runtime:

- `tools.web.fetch.provider` явно вибирає provider fallback для отримання.
- Якщо `provider` пропущено, OpenClaw автоматично визначає перший готовий provider web-fetch
  з доступних облікових даних. Наразі вбудований provider — Firecrawl.
- Якщо Readability вимкнено, `web_fetch` відразу переходить до вибраного
  provider fallback. Якщо жоден provider недоступний, він завершується безпечною відмовою.

## Обмеження та безпека

- `maxChars` обмежується значенням `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` до розбору; надто великі
  відповіді обрізаються з попередженням
- Приватні/внутрішні hostnames блокуються
- Redirects перевіряються й обмежуються `maxRedirects`
- `web_fetch` працює в режимі best-effort — для деяких сайтів потрібен [Web Browser](/uk/tools/browser)

## Профілі tools

Якщо ви використовуєте профілі tools або allowlist, додайте `web_fetch` або `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Пов’язане

- [Web Search](/uk/tools/web) -- пошук у вебі з кількома provider
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із важким JS
- [Firecrawl](/uk/tools/firecrawl) -- tools пошуку й scraping Firecrawl
