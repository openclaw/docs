---
read_when:
    - Ви хочете завантажити URL-адресу та витягти читабельний вміст
    - Потрібно налаштувати web_fetch або його резервний механізм Firecrawl
    - Ви хочете зрозуміти обмеження web_fetch і кешування
sidebarTitle: Web Fetch
summary: інструмент web_fetch -- HTTP-завантаження з витягуванням читабельного вмісту
title: Отримання з вебу
x-i18n:
    generated_at: "2026-04-29T19:35:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Інструмент `web_fetch` виконує звичайний HTTP GET і витягує читабельний вміст
(HTML у markdown або текст). Він **не** виконує JavaScript.

Для сайтів із великою кількістю JS або сторінок, захищених входом, натомість використовуйте
[Веббраузер](/uk/tools/browser).

## Швидкий старт

`web_fetch` **увімкнено за замовчуванням** -- налаштування не потрібне. Агент може
викликати його одразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметри інструмента

<ParamField path="url" type="string" required>
URL для отримання. Лише `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Формат виводу після витягування основного вмісту.
</ParamField>

<ParamField path="maxChars" type="number">
Обрізати вивід до цієї кількості символів.
</ParamField>

## Як це працює

<Steps>
  <Step title="Fetch">
    Надсилає HTTP GET із User-Agent, подібним до Chrome, і заголовком
    `Accept-Language`. Блокує приватні/внутрішні імена хостів і повторно перевіряє перенаправлення.
  </Step>
  <Step title="Extract">
    Запускає Readability (витягування основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Fallback (optional)">
    Якщо Readability завершується невдало і Firecrawl налаштовано, повторює спробу через
    Firecrawl API у режимі обходу бот-захисту.
  </Step>
  <Step title="Cache">
    Результати кешуються на 15 хвилин (налаштовується), щоб зменшити кількість повторних
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
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Резервний варіант Firecrawl

Якщо витягування Readability завершується невдало, `web_fetch` може перейти на
[Firecrawl](/uk/tools/firecrawl) для обходу бот-захисту та кращого витягування:

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
Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.

<Note>
  Якщо Firecrawl увімкнено, а його SecretRef не розв’язано і немає резервного варіанта через змінну середовища
  `FIRECRAWL_API_KEY`, запуск gateway швидко завершується помилкою.
</Note>

<Note>
  Перевизначення `baseUrl` для Firecrawl жорстко обмежені: вони мають використовувати `https://` і
  офіційний хост Firecrawl (`api.firecrawl.dev`).
</Note>

Поточна поведінка під час виконання:

- `tools.web.fetch.provider` явно вибирає резервного провайдера отримання.
- Якщо `provider` не вказано, OpenClaw автоматично визначає першого готового провайдера web-fetch
  з доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного провайдера. Якщо провайдер недоступний, він завершується закритою помилкою.

## Обмеження та безпека

- `maxChars` обмежується значенням `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` перед розбором; надто великі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` — вузькі явні дозволи
  для довірених проксі-стеків із підставними IP; залишайте їх невстановленими, якщо ваш проксі не володіє
  цими синтетичними діапазонами та не застосовує власну політику призначень
- Перенаправлення перевіряються й обмежуються `maxRedirects`
- `web_fetch` працює за принципом найкращої спроби -- деяким сайтам потрібен [Веббраузер](/uk/tools/browser)

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або списки дозволів, додайте `web_fetch` або `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Пов’язане

- [Вебпошук](/uk/tools/web) -- пошук в інтернеті з кількома провайдерами
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великою кількістю JS
- [Firecrawl](/uk/tools/firecrawl) -- інструменти пошуку та скрейпінгу Firecrawl
