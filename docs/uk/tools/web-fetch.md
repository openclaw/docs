---
read_when:
    - Ви хочете отримати дані за URL-адресою та витягти читабельний вміст
    - Потрібно налаштувати web_fetch або його резервний варіант Firecrawl
    - Ви хочете зрозуміти обмеження та кешування web_fetch
sidebarTitle: Web Fetch
summary: інструмент web_fetch -- HTTP-отримання з витягненням придатного для читання вмісту
title: Отримання з вебу
x-i18n:
    generated_at: "2026-05-06T16:28:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

Інструмент `web_fetch` виконує звичайний HTTP GET і витягує читабельний вміст
(HTML у markdown або текст). Він **не** виконує JavaScript.

Для сайтів із великою кількістю JS або сторінок, захищених входом, натомість використовуйте
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
Формат виводу після витягування основного вмісту.
</ParamField>

<ParamField path="maxChars" type="number">
Обрізати вивід до цієї кількості символів.
</ParamField>

## Як це працює

<Steps>
  <Step title="Fetch">
    Надсилає HTTP GET із Chrome-подібним User-Agent і заголовком
    `Accept-Language`. Блокує приватні/внутрішні імена хостів і повторно перевіряє перенаправлення.
  </Step>
  <Step title="Extract">
    Запускає Readability (витягування основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Fallback (optional)">
    Якщо Readability не спрацьовує і Firecrawl налаштовано, повторює спробу через
    Firecrawl API в режимі обходу бот-захисту.
  </Step>
  <Step title="Cache">
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Якщо витягування Readability не спрацьовує, `web_fetch` може перейти на
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
Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується через `openclaw doctor --fix`.

<Note>
  Якщо Firecrawl увімкнено, а його SecretRef не розв’язано і немає резервного env
  `FIRECRAWL_API_KEY`, запуск gateway швидко завершується помилкою.
</Note>

<Note>
  Перевизначення Firecrawl `baseUrl` жорстко обмежені: хостований трафік використовує
  `https://api.firecrawl.dev`; самохостингові перевизначення мають вказувати на приватні або
  внутрішні кінцеві точки, а `http://` приймається лише для таких приватних цілей.
</Note>

Поточна поведінка під час виконання:

- `tools.web.fetch.provider` явно вибирає резервного провайдера отримання.
- Якщо `provider` пропущено, OpenClaw автоматично визначає першого готового провайдера web-fetch
  із доступних облікових даних. `web_fetch` без sandbox може використовувати
  встановлені plugins, які оголошують `contracts.webFetchProviders` і реєструють
  відповідного провайдера під час виконання. Наразі вбудований провайдер -- Firecrawl.
- Виклики `web_fetch` у sandbox лишаються обмеженими вбудованими провайдерами.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного провайдера. Якщо жоден провайдер недоступний, він завершується закритою відмовою.

## Довірений env-проксі

Якщо ваше розгортання вимагає, щоб `web_fetch` проходив через довірений вихідний
HTTP(S)-проксі, задайте `tools.web.fetch.useTrustedEnvProxy: true`.

У цьому режимі OpenClaw все одно застосовує перевірки SSRF на основі імені хоста перед надсиланням
запиту, але дозволяє проксі розв’язувати DNS замість локального DNS-пінінгу.
Вмикайте це лише тоді, коли проксі контролюється оператором і застосовує
вихідну політику після розв’язання DNS.

<Note>
  Якщо env-змінну HTTP(S)-проксі не налаштовано або цільовий хост виключено через
  `NO_PROXY`, `web_fetch` повертається до звичайного суворого шляху з локальним DNS-пінінгом.
</Note>

## Обмеження та безпека

- `maxChars` обмежується до `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` перед розбором; завеликі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` -- це вузькі opt-in
  для довірених стеків проксі з підробленими IP; не встановлюйте їх, якщо ваш проксі не володіє
  цими синтетичними діапазонами й не застосовує власну політику призначення
- Перенаправлення перевіряються й обмежуються `maxRedirects`
- `useTrustedEnvProxy` є явним opt-in і має вмикатися лише для
  контрольованих оператором проксі, які все ще застосовують вихідну політику після
  розв’язання DNS
- `web_fetch` працює за принципом найкращої спроби -- для деяких сайтів потрібен [веббраузер](/uk/tools/browser)

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або allowlist-и, додайте `web_fetch` або `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Пов’язане

- [Вебпошук](/uk/tools/web) -- пошук в інтернеті через кількох провайдерів
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великою кількістю JS
- [Firecrawl](/uk/tools/firecrawl) -- інструменти пошуку та scraping Firecrawl
