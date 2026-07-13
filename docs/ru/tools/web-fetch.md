---
read_when:
    - Вы хотите получить содержимое по URL и извлечь из него текст в удобочитаемом виде
    - Необходимо настроить web_fetch или резервный вариант на основе Firecrawl
    - Вы хотите понять ограничения и кэширование web_fetch
sidebarTitle: Web Fetch
summary: Инструмент web_fetch — HTTP-запрос с извлечением удобочитаемого содержимого
title: Получение данных из веба
x-i18n:
    generated_at: "2026-07-13T18:52:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` выполняет обычный HTTP GET-запрос и извлекает читаемое содержимое (преобразует HTML в
Markdown или текст). Он **не** выполняет JavaScript. Для сайтов, активно использующих JS, или
страниц, защищённых входом в систему, используйте вместо этого [веб-браузер](/ru/tools/browser).

## Быстрый старт

Включено по умолчанию, настройка не требуется:

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
Обрезать вывод до указанного количества символов. Ограничивается значением `tools.web.fetch.maxCharsCap`.
</ParamField>

## Принцип работы

<Steps>
  <Step title="Получение">
    Отправляет HTTP GET-запрос с похожим на Chrome User-Agent и заголовком `Accept-Language`.
    Блокирует частные и внутренние имена хостов и повторно проверяет перенаправления.
  </Step>
  <Step title="Извлечение">
    Запускает Readability (извлечение основного содержимого) для HTML-ответа.
  </Step>
  <Step title="Резервный вариант (необязательно)">
    Если Readability завершается с ошибкой и доступен провайдер получения данных, повторяет попытку через
    этого провайдера (например, в режиме обхода защиты от ботов Firecrawl).
  </Step>
  <Step title="Кэширование">
    Результаты кэшируются на 15 минут (значение настраивается), чтобы сократить количество повторных
    запросов к одному URL.
  </Step>
</Steps>

## Обновления хода выполнения

`web_fetch` выводит общедоступную строку состояния, только если получение данных всё ещё не завершено
через пять секунд:

```text
Получение содержимого страницы...
```

Быстрые обращения к кэшу и быстрые сетевые ответы завершаются до срабатывания таймера, поэтому
строка состояния для них никогда не отображается. При отмене вызова таймер сбрасывается. Эта
строка относится только к состоянию интерфейса канала и никогда не содержит полученное содержимое страницы.

## Конфигурация

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000, // default output chars; capped by maxCharsCap
        maxCharsCap: 20000, // hard cap for maxChars param
        maxResponseBytes: 750000, // max download size before truncation (32000-10000000)
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

## Резервный вариант с Firecrawl

Если извлечение с помощью Readability завершается с ошибкой, `web_fetch` может использовать
[Firecrawl](/ru/tools/firecrawl) как резервный вариант для обхода защиты от ботов и более качественного извлечения:

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
            maxAgeMs: 172800000, // cache duration (2 days)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` является необязательным и поддерживает объекты SecretRef.
Устаревшая конфигурация `tools.web.fetch.firecrawl.*` автоматически переносится в
`plugins.entries.firecrawl.config.webFetch` с помощью `openclaw doctor --fix`.

<Note>
  Если настроить SecretRef для API-ключа Firecrawl, но ссылка не разрешается и отсутствует
  резервная переменная окружения `FIRECRAWL_API_KEY`, запуск Gateway немедленно завершится с ошибкой.
</Note>

<Note>
  Переопределения Firecrawl `baseUrl` строго ограничены: размещённый трафик использует
  `https://api.firecrawl.dev`; переопределения для самостоятельно размещённых экземпляров должны указывать на частные или
  внутренние конечные точки, а `http://` принимается только для таких частных целей.
</Note>

Текущее поведение среды выполнения:

- `tools.web.fetch.provider` явно выбирает резервного провайдера получения данных.
- Если `provider` не указан, OpenClaw автоматически определяет первого готового провайдера
  получения веб-данных по настроенным учётным данным. Вызовы `web_fetch` вне песочницы могут использовать
  установленные плагины, которые объявляют `contracts.webFetchProviders` и регистрируют
  соответствующего провайдера во время выполнения. Официальный плагин Firecrawl в настоящее время предоставляет
  этот резервный вариант.
- Вызовы `web_fetch` в песочнице разрешают встроенных провайдеров, а также установленных провайдеров,
  официальное происхождение которых из npm или ClawHub подтверждено. В настоящее время это разрешает
  официальный плагин Firecrawl; сторонние внешние плагины получения данных по-прежнему исключены.
- Если Readability отключён, `web_fetch` сразу переходит к выбранному
  резервному провайдеру. Если провайдер недоступен, вызов завершается с ошибкой без небезопасного обходного пути.

## Доверенный прокси из переменных окружения

Если в вашей среде развёртывания требуется направлять `web_fetch` через доверенный исходящий
HTTP(S)-прокси, задайте `tools.web.fetch.useTrustedEnvProxy: true`.

В этом режиме OpenClaw по-прежнему применяет проверки имён хостов для защиты от SSRF перед отправкой
запроса, но позволяет прокси разрешать DNS вместо локальной фиксации
DNS. Включайте этот режим, только если прокси контролируется оператором и применяет
политику исходящих подключений после разрешения DNS.

<Note>
  Если переменная окружения HTTP(S)-прокси не настроена или целевой хост исключён
  параметром `NO_PROXY`, `web_fetch` возвращается к обычному строгому режиму с локальной
  фиксацией DNS.
</Note>

## Ограничения и безопасность

- `maxChars` ограничивается значением `tools.web.fetch.maxCharsCap` (по умолчанию `20000`)
- Тело ответа перед разбором ограничивается значением `maxResponseBytes` (по умолчанию `750000`, диапазон
  32000-10000000); слишком большие ответы обрезаются с предупреждением
- Частные и внутренние имена хостов блокируются
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` и
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` — это узкие явные разрешения
  для доверенных прокси-стеков с фиктивными IP-адресами; не задавайте их, если ваш прокси не управляет
  этими синтетическими диапазонами и не применяет собственную политику назначения
- Перенаправления проверяются и ограничиваются параметром `maxRedirects` (по умолчанию `3`)
- `useTrustedEnvProxy` требует явного включения и должен использоваться только для
  контролируемых оператором прокси, которые продолжают применять политику исходящих подключений после
  разрешения DNS
- `web_fetch` работает по принципу максимальных усилий — некоторым сайтам требуется [веб-браузер](/ru/tools/browser)

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

- [Веб-поиск](/ru/tools/web) — поиск в интернете с помощью нескольких провайдеров
- [Веб-браузер](/ru/tools/browser) — полноценная автоматизация браузера для сайтов, активно использующих JS
- [Firecrawl](/ru/tools/firecrawl) — инструменты Firecrawl для поиска и извлечения данных со страниц
