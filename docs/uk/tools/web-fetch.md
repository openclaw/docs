---
read_when:
    - Ви хочете отримати URL і вилучити читабельний вміст
    - Вам потрібно налаштувати web_fetch або його резервний варіант Firecrawl
    - Ви хочете зрозуміти обмеження та кешування web_fetch
sidebarTitle: Web Fetch
summary: інструмент web_fetch -- HTTP-отримання з вилученням читабельного вмісту
title: Web fetch
x-i18n:
    generated_at: "2026-04-24T02:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

Інструмент `web_fetch` виконує звичайний HTTP GET і вилучає читабельний вміст
(HTML у markdown або текст). Він **не** виконує JavaScript.

Для сайтів із великою залежністю від JS або сторінок, захищених входом, замість нього використовуйте
[Web Browser](/uk/tools/browser).

## Швидкий старт

`web_fetch` **увімкнено за замовчуванням** — додаткове налаштування не потрібне. Агент може
викликати його одразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметри інструмента

<ParamField path="url" type="string" required>
URL для отримання. Лише `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Формат виводу після вилучення основного вмісту.
</ParamField>

<ParamField path="maxChars" type="number">
Обрізати вивід до цієї кількості символів.
</ParamField>

## Як це працює

<Steps>
  <Step title="Fetch">
    Надсилає HTTP GET із User-Agent, схожим на Chrome, і заголовком `Accept-Language`.
    Блокує приватні/внутрішні імена хостів і повторно перевіряє перенаправлення.
  </Step>
  <Step title="Extract">
    Запускає Readability (вилучення основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Fallback (optional)">
    Якщо Readability не спрацьовує і Firecrawl налаштовано, повторює спробу через
    API Firecrawl у режимі обходу бот-захисту.
  </Step>
  <Step title="Cache">
    Результати кешуються на 15 хвилин (можна налаштувати), щоб зменшити кількість повторних
    отримань того самого URL.
  </Step>
</Steps>

## Налаштування

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

## Резервний варіант Firecrawl

Якщо вилучення Readability не спрацьовує, `web_fetch` може перейти до
[Firecrawl](/uk/tools/firecrawl) для обходу бот-захисту та кращого вилучення:

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
Застарілу конфігурацію `tools.web.fetch.firecrawl.*` автоматично мігрує `openclaw doctor --fix`.

<Note>
  Якщо Firecrawl увімкнено, а його SecretRef не розв’язано і немає
  резервного значення змінної середовища `FIRECRAWL_API_KEY`, запуск Gateway завершується помилкою одразу.
</Note>

<Note>
  Перевизначення Firecrawl `baseUrl` суворо обмежені: вони повинні використовувати `https://` і
  офіційний хост Firecrawl (`api.firecrawl.dev`).
</Note>

Поточна поведінка під час виконання:

- `tools.web.fetch.provider` явно вибирає резервного провайдера отримання.
- Якщо `provider` не вказано, OpenClaw автоматично визначає першого готового провайдера web-fetch
  з доступних облікових даних. Наразі вбудованим провайдером є Firecrawl.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного провайдера. Якщо жоден провайдер недоступний, інструмент завершується з безпечним блокуванням.

## Обмеження та безпека

- `maxChars` обмежується значенням `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується значенням `maxResponseBytes` до початку обробки; надто великі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- Перенаправлення перевіряються й обмежуються параметром `maxRedirects`
- `web_fetch` працює за принципом best-effort — для деяких сайтів потрібен [Web Browser](/uk/tools/browser)

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або списки дозволених, додайте `web_fetch` або `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Пов’язане

- [Web Search](/uk/tools/web) — пошук в інтернеті за допомогою кількох провайдерів
- [Web Browser](/uk/tools/browser) — повна автоматизація браузера для сайтів із великою залежністю від JS
- [Firecrawl](/uk/tools/firecrawl) — інструменти пошуку та збирання вмісту Firecrawl
