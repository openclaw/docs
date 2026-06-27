---
read_when:
    - Ви хочете отримати URL і видобути читабельний вміст
    - Потрібно налаштувати web_fetch або його резервний варіант Firecrawl
    - Ви хочете зрозуміти обмеження та кешування web_fetch
sidebarTitle: Web Fetch
summary: інструмент web_fetch -- HTTP-запит із витягуванням читабельного вмісту
title: Отримання з вебу
x-i18n:
    generated_at: "2026-06-27T18:30:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Інструмент `web_fetch` виконує звичайний HTTP GET і витягує читабельний вміст
(HTML у markdown або текст). Він **не** виконує JavaScript.

Для сайтів, що активно використовують JS, або сторінок, захищених входом,
натомість використовуйте [веббраузер](/uk/tools/browser).

## Швидкий старт

`web_fetch` **увімкнено за замовчуванням** -- налаштування не потрібне. Агент може
викликати його відразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметри інструмента

<ParamField path="url" type="string" required>
URL для отримання. Лише `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Формат виводу після витягнення основного вмісту.
</ParamField>

<ParamField path="maxChars" type="number">
Обрізати вивід до цієї кількості символів.
</ParamField>

## Як це працює

<Steps>
  <Step title="Fetch">
    Надсилає HTTP GET із подібним до Chrome User-Agent і заголовком
    `Accept-Language`. Блокує приватні/внутрішні імена хостів і повторно перевіряє перенаправлення.
  </Step>
  <Step title="Extract">
    Запускає Readability (витягнення основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Fallback (optional)">
    Якщо Readability завершується невдало й вибрано Firecrawl, повторює спробу через
    API Firecrawl у режимі обходу бот-захисту.
  </Step>
  <Step title="Cache">
    Результати кешуються на 15 хвилин (налаштовується), щоб зменшити кількість повторних
    отримань того самого URL.
  </Step>
</Steps>

## Оновлення перебігу

`web_fetch` виводить публічний рядок перебігу лише тоді, коли отримання все ще очікує
після п'яти секунд:

```text
Fetching page content...
```

Швидкі влучання в кеш і швидкі мережеві відповіді завершуються до спрацювання таймера, тому
вони не показують рядок перебігу. Якщо виклик скасовано, таймер очищається.
Коли отримання зрештою завершується, агент отримує звичайний результат інструмента;
рядок перебігу є лише станом UI каналу й ніколи не містить отриманого вмісту сторінки.

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

Якщо видобування Readability завершується невдало, `web_fetch` може відкотитися до
[Firecrawl](/uk/tools/firecrawl) для обходу бот-захисту та кращого видобування:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` є необов’язковим і підтримує об’єкти SecretRef.
Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.

<Note>
  Якщо ви налаштуєте SecretRef для API-ключа Firecrawl і його не вдасться
  розв’язати без резервної змінної середовища `FIRECRAWL_API_KEY`, запуск Gateway швидко завершиться помилкою.
</Note>

<Note>
  Перевизначення `baseUrl` для Firecrawl обмежені: розміщений трафік використовує
  `https://api.firecrawl.dev`; самостійно розміщені перевизначення мають вказувати на приватні або
  внутрішні кінцеві точки, а `http://` приймається лише для таких приватних цілей.
</Note>

Поточна поведінка середовища виконання:

- `tools.web.fetch.provider` явно вибирає резервного провайдера отримання.
- Якщо `provider` опущено, OpenClaw автоматично визначає першого готового провайдера web-fetch
  з налаштованих облікових даних. `web_fetch` без пісочниці може використовувати
  встановлені plugins, які оголошують `contracts.webFetchProviders` і реєструють
  відповідного провайдера під час виконання. Офіційний Firecrawl plugin надає цей
  резервний варіант.
- Виклики `web_fetch` у пісочниці дозволяють вбудованих провайдерів, а також встановлених провайдерів,
  чию офіційну npm- або ClawHub-походження перевірено. Наразі це дозволяє
  офіційний Firecrawl plugin; сторонні зовнішні plugins отримання залишаються виключеними.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного провайдера. Якщо жоден провайдер недоступний, він завершується відмовою.

## Довірений проксі середовища

Якщо ваше розгортання вимагає, щоб `web_fetch` проходив через довірений вихідний
HTTP(S)-проксі, установіть `tools.web.fetch.useTrustedEnvProxy: true`.

У цьому режимі OpenClaw все одно застосовує перевірки SSRF на основі імен хостів перед надсиланням
запиту, але дозволяє проксі розв’язувати DNS замість локального DNS
pinning. Увімкніть це лише тоді, коли проксі контролюється оператором і застосовує
вихідну політику після розв’язання DNS.

<Note>
  Якщо не налаштовано змінну середовища HTTP(S)-проксі або цільовий хост виключено через
  `NO_PROXY`, `web_fetch` повертається до звичайного суворого шляху з локальним DNS
  pinning.
</Note>

## Обмеження та безпека

- `maxChars` обмежується значенням `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` перед розбором; завеликі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` є вузькими явними дозволами
  для довірених проксі-стеків із фальшивими IP; залишайте їх невстановленими, якщо ваш проксі не володіє
  цими синтетичними діапазонами та не застосовує власну політику призначення
- Перенаправлення перевіряються та обмежуються `maxRedirects`
- `useTrustedEnvProxy` є явним дозволом і має вмикатися лише для
  проксі, контрольованих оператором, які все одно застосовують вихідну політику після
  розв’язання DNS
- `web_fetch` працює за принципом найкращого зусилля -- деяким сайтам потрібен [Веббраузер](/uk/tools/browser)

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
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великим обсягом JS
- [Firecrawl](/uk/tools/firecrawl) -- інструменти пошуку та скрейпінгу Firecrawl
