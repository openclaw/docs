---
read_when:
    - Ви хочете отримати URL-адресу й витягти читабельний вміст
    - Потрібно налаштувати web_fetch або його резервний варіант Firecrawl
    - Ви хочете зрозуміти обмеження та кешування web_fetch
sidebarTitle: Web Fetch
summary: інструмент web_fetch -- отримання через HTTP із витягуванням читабельного вмісту
title: Отримання з вебу
x-i18n:
    generated_at: "2026-05-03T21:40:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

Інструмент `web_fetch` виконує звичайний HTTP GET і витягує читабельний вміст
(HTML у markdown або текст). Він **не** виконує JavaScript.

Для сайтів із великою кількістю JS або сторінок, захищених входом, натомість використовуйте
[веббраузер](/uk/tools/browser).

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
    Якщо Readability не спрацьовує і Firecrawl налаштовано, повторює спробу через
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

Якщо витягання Readability не спрацьовує, `web_fetch` може перейти на
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
Застаріле налаштування `tools.web.fetch.firecrawl.*` автоматично мігрується командою `openclaw doctor --fix`.

<Note>
  Якщо Firecrawl увімкнено, а його SecretRef не вирішено й немає резервного env
  `FIRECRAWL_API_KEY`, запуск Gateway швидко завершується помилкою.
</Note>

<Note>
  Перевизначення Firecrawl `baseUrl` жорстко обмежені: розміщений трафік використовує
  `https://api.firecrawl.dev`; самостійно розгорнуті перевизначення мають вказувати на приватні або
  внутрішні кінцеві точки, а `http://` приймається лише для таких приватних цілей.
</Note>

Поточна поведінка під час виконання:

- `tools.web.fetch.provider` явно вибирає резервного постачальника отримання.
- Якщо `provider` пропущено, OpenClaw автоматично визначає першого готового постачальника web-fetch
  з доступних облікових даних. Неізольований `web_fetch` може використовувати
  встановлені plugins, які оголошують `contracts.webFetchProviders` і реєструють
  відповідного постачальника під час виконання. Наразі вбудований постачальник — Firecrawl.
- Ізольовані виклики `web_fetch` залишаються обмеженими вбудованими постачальниками.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного постачальника. Якщо постачальник недоступний, він завершується закритою помилкою.

## Довірений Env-проксі

Якщо ваше розгортання вимагає, щоб `web_fetch` проходив через довірений вихідний
HTTP(S)-проксі, установіть `tools.web.fetch.useTrustedEnvProxy: true`.

У цьому режимі OpenClaw усе ще застосовує перевірки SSRF на основі імені хоста перед надсиланням
запиту, але дозволяє проксі вирішувати DNS замість локального DNS-прикріплення.
Вмикайте це лише тоді, коли проксі контролюється оператором і застосовує
вихідну політику після DNS-резолюції.

<Note>
  Якщо env-змінну HTTP(S)-проксі не налаштовано або цільовий хост виключено через
  `NO_PROXY`, `web_fetch` повертається до звичайного суворого шляху з локальним DNS-прикріпленням.
</Note>

## Обмеження та безпека

- `maxChars` обмежується до `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` перед парсингом; завеликі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` і
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` — це вузькі opt-in
  для довірених стеків проксі з fake-IP; залишайте їх не встановленими, якщо ваш проксі не володіє
  цими синтетичними діапазонами й не застосовує власну політику призначення
- Перенаправлення перевіряються й обмежуються `maxRedirects`
- `useTrustedEnvProxy` — явний opt-in, який слід вмикати лише для
  контрольованих оператором проксі, що все ще застосовують вихідну політику після DNS-резолюції
- `web_fetch` працює за принципом best-effort -- деяким сайтам потрібен [веббраузер](/uk/tools/browser)

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або allowlists, додайте `web_fetch` або `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Пов’язане

- [Вебпошук](/uk/tools/web) -- пошук у вебі через кількох постачальників
- [Веббраузер](/uk/tools/browser) -- повна автоматизація браузера для сайтів із великою кількістю JS
- [Firecrawl](/uk/tools/firecrawl) -- інструменти пошуку та скрейпінгу Firecrawl
