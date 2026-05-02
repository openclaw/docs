---
read_when:
    - Ви хочете отримати вміст за URL-адресою та витягти придатний для читання вміст
    - Потрібно налаштувати web_fetch або його резервний варіант Firecrawl
    - Ви хочете зрозуміти обмеження й кешування web_fetch
sidebarTitle: Web Fetch
summary: інструмент web_fetch -- HTTP-отримання з витягуванням читабельного вмісту
title: Отримання з вебу
x-i18n:
    generated_at: "2026-05-02T05:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

Інструмент `web_fetch` виконує звичайний HTTP GET і витягує читабельний вміст
(HTML у markdown або текст). Він **не** виконує JavaScript.

Для сайтів, що інтенсивно використовують JS, або сторінок, захищених входом, використовуйте натомість
[веббраузер](/uk/tools/browser).

## Швидкий старт

`web_fetch` **увімкнено за замовчуванням** -- конфігурація не потрібна. Агент може
викликати його одразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметри інструмента

<ParamField path="url" type="string" required>
URL для отримання. Лише `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Формат виводу після витягання основного вмісту.
</ParamField>

<ParamField path="maxChars" type="number">
Обрізати вивід до цієї кількості символів.
</ParamField>

## Як це працює

<Steps>
  <Step title="Fetch">
    Надсилає HTTP GET із Chrome-подібним User-Agent і заголовком `Accept-Language`.
    Блокує приватні/внутрішні імена хостів і повторно перевіряє перенаправлення.
  </Step>
  <Step title="Extract">
    Запускає Readability (витягання основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Fallback (optional)">
    Якщо Readability завершується невдало й Firecrawl налаштовано, повторює спробу через
    Firecrawl API у режимі обходу бот-захисту.
  </Step>
  <Step title="Cache">
    Результати кешуються на 15 хвилин (налаштовується), щоб зменшити повторні
    отримання тієї самої URL-адреси.
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

Якщо витягання Readability завершується невдало, `web_fetch` може перейти до
[Firecrawl](/uk/tools/firecrawl) для обходу бот-захисту та кращого витягання:

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
  Якщо Firecrawl увімкнено, а його SecretRef не розв’язано й немає резервного env
  `FIRECRAWL_API_KEY`, запуск gateway швидко завершується помилкою.
</Note>

<Note>
  Перевизначення `baseUrl` для Firecrawl обмежено: розміщений трафік використовує
  `https://api.firecrawl.dev`; самостійно розміщені перевизначення мають вказувати на приватні або
  внутрішні кінцеві точки, а `http://` приймається лише для таких приватних цілей.
</Note>

Поточна поведінка під час виконання:

- `tools.web.fetch.provider` явно вибирає резервного провайдера отримання.
- Якщо `provider` пропущено, OpenClaw автоматично виявляє першого готового провайдера web-fetch
  з доступних облікових даних. `web_fetch` поза sandbox може використовувати
  встановлені plugins, які оголошують `contracts.webFetchProviders` і реєструють
  відповідного провайдера під час виконання. Наразі вбудованим провайдером є Firecrawl.
- Виклики `web_fetch` у sandbox залишаються обмеженими вбудованими провайдерами.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного провайдера. Якщо жоден провайдер недоступний, він завершується закритою помилкою.

## Обмеження та безпека

- `maxChars` обмежується до `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` перед розбором; надмірно великі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` є вузькими opt-in параметрами
  для довірених стеків проксі з fake-IP; залишайте їх невстановленими, якщо ваш проксі не володіє
  цими синтетичними діапазонами й не застосовує власну політику призначень
- Перенаправлення перевіряються й обмежуються `maxRedirects`
- `web_fetch` працює за принципом найкращої спроби -- деяким сайтам потрібен [веббраузер](/uk/tools/browser)

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

- [Вебпошук](/uk/tools/web) -- пошук в інтернеті за допомогою кількох провайдерів
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів, що інтенсивно використовують JS
- [Firecrawl](/uk/tools/firecrawl) -- інструменти пошуку й scraping Firecrawl
