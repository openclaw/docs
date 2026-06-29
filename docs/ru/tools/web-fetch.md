---
read_when:
    - Вы хотите получить URL и извлечь читаемое содержимое
    - Необходимо настроить web_fetch или его резервный вариант Firecrawl
    - Вы хотите понять ограничения и кэширование web_fetch
sidebarTitle: Web Fetch
summary: инструмент web_fetch -- HTTP-запрос с извлечением читаемого содержимого
title: Получение данных из интернета
x-i18n:
    generated_at: "2026-06-28T23:56:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Инструмент `web_fetch` выполняет обычный HTTP GET и извлекает читаемое содержимое
(HTML в markdown или текст). Он **не** выполняет JavaScript.

Для сайтов, сильно зависящих от JS, или страниц, защищенных входом в систему, используйте
[веб-браузер](/ru/tools/browser).

## Быстрый старт

`web_fetch` **включен по умолчанию** -- настройка не требуется. Агент может
вызвать его сразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметры инструмента

<ParamField path="url" type="string" required>
URL для получения. Только `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Формат вывода после извлечения основного содержимого.
</ParamField>

<ParamField path="maxChars" type="number">
Обрезать вывод до указанного количества символов.
</ParamField>

## Как это работает

<Steps>
  <Step title="Fetch">
    Отправляет HTTP GET с User-Agent, похожим на Chrome, и заголовком
    `Accept-Language`. Блокирует частные/внутренние имена хостов и повторно проверяет перенаправления.
  </Step>
  <Step title="Extract">
    Запускает Readability (извлечение основного содержимого) для HTML-ответа.
  </Step>
  <Step title="Fallback (optional)">
    Если Readability не срабатывает и выбран Firecrawl, повторяет попытку через
    API Firecrawl в режиме обхода ботов.
  </Step>
  <Step title="Cache">
    Результаты кэшируются на 15 минут (настраивается), чтобы сократить повторные
    запросы к одному и тому же URL.
  </Step>
</Steps>

## Обновления хода выполнения

`web_fetch` выводит публичную строку хода выполнения только если получение все еще ожидает
завершения через пять секунд:

```text
Fetching page content...
```

Быстрые попадания в кэш и быстрые сетевые ответы завершаются до срабатывания таймера, поэтому
строка хода выполнения для них не показывается. Если вызов отменен, таймер очищается.
Когда получение в итоге завершается, агент получает обычный результат инструмента;
строка хода выполнения является только состоянием UI канала и никогда не содержит
полученное содержимое страницы.

## Конфигурация

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

## Резервный вариант Firecrawl

Если извлечение Readability не срабатывает, `web_fetch` может перейти на
[Firecrawl](/ru/tools/firecrawl) для обхода ботов и более качественного извлечения:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` необязателен и поддерживает объекты SecretRef.
Устаревшая конфигурация `tools.web.fetch.firecrawl.*` автоматически мигрируется командой `openclaw doctor --fix`.

<Note>
  Если вы настраиваете SecretRef для API-ключа Firecrawl и он не разрешается при отсутствии
  резервного env `FIRECRAWL_API_KEY`, запуск gateway быстро завершается ошибкой.
</Note>

<Note>
  Переопределения Firecrawl `baseUrl` жестко ограничены: размещенный трафик использует
  `https://api.firecrawl.dev`; самостоятельные переопределения должны указывать на частные или
  внутренние конечные точки, а `http://` принимается только для таких частных целей.
</Note>

Текущее поведение runtime:

- `tools.web.fetch.provider` явно выбирает резервного поставщика получения.
- Если `provider` опущен, OpenClaw автоматически определяет первого готового поставщика web-fetch
  по настроенным учетным данным. Неизолированный `web_fetch` может использовать
  установленные плагины, которые объявляют `contracts.webFetchProviders` и регистрируют
  соответствующего поставщика во время выполнения. Официальный плагин Firecrawl предоставляет этот
  резервный вариант.
- Изолированные вызовы `web_fetch` допускают встроенных поставщиков, а также установленных поставщиков,
  чье официальное происхождение из npm или ClawHub подтверждено. На сегодня это разрешает
  официальный плагин Firecrawl; сторонние внешние плагины получения остаются исключенными.
- Если Readability отключен, `web_fetch` сразу переходит к выбранному
  резервному поставщику. Если поставщик недоступен, он завершается закрытым отказом.

## Доверенный env-прокси

Если вашему развертыванию требуется, чтобы `web_fetch` проходил через доверенный исходящий
HTTP(S)-прокси, установите `tools.web.fetch.useTrustedEnvProxy: true`.

В этом режиме OpenClaw по-прежнему применяет проверки SSRF на основе имени хоста перед отправкой
запроса, но позволяет прокси разрешать DNS вместо локального DNS
pinning. Включайте это только когда прокси контролируется оператором и обеспечивает
исходящую политику после разрешения DNS.

<Note>
  Если env-переменная HTTP(S)-прокси не настроена или целевой хост исключен через
  `NO_PROXY`, `web_fetch` возвращается к обычному строгому пути с локальным DNS
  pinning.
</Note>

## Ограничения и безопасность

- `maxChars` ограничивается значением `tools.web.fetch.maxCharsCap`
- Тело ответа ограничивается `maxResponseBytes` перед разбором; слишком большие
  ответы обрезаются с предупреждением
- Частные/внутренние имена хостов блокируются
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` и
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` являются узкими opt-in
  для доверенных стеков прокси с поддельными IP; оставьте их неустановленными, если ваш прокси не владеет
  этими синтетическими диапазонами и не обеспечивает собственную политику назначения
- Перенаправления проверяются и ограничиваются `maxRedirects`
- `useTrustedEnvProxy` является явным opt-in и должен включаться только для
  контролируемых оператором прокси, которые все равно обеспечивают исходящую политику после
  разрешения DNS
- `web_fetch` работает по принципу best-effort -- некоторым сайтам нужен [веб-браузер](/ru/tools/browser)

## Профили инструментов

Если вы используете профили инструментов или списки разрешений, добавьте `web_fetch` или `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Связанные материалы

- [Веб-поиск](/ru/tools/web) -- поиск в интернете через нескольких поставщиков
- [Веб-браузер](/ru/tools/browser) -- полноценная автоматизация браузера для сайтов, сильно зависящих от JS
- [Firecrawl](/ru/tools/firecrawl) -- инструменты поиска и скрейпинга Firecrawl
