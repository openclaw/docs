---
read_when:
    - Ви хочете використовувати Gemini для web_search
    - Потрібен GEMINI_API_KEY або models.providers.google.apiKey
    - Вам потрібне обґрунтування за допомогою Google Search
summary: Вебпошук Gemini з обґрунтуванням через Google Search
title: Пошук Gemini
x-i18n:
    generated_at: "2026-06-27T18:25:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw підтримує моделі Gemini із вбудованим
[заземленням Google Search](https://ai.google.dev/gemini-api/docs/grounding),
яке повертає синтезовані ШІ відповіді на основі живих результатів Google Search із
цитуваннями.

## Отримайте ключ API

<Steps>
  <Step title="Створіть ключ">
    Перейдіть до [Google AI Studio](https://aistudio.google.com/apikey) і створіть
    ключ API.
  </Step>
  <Step title="Збережіть ключ">
    Установіть `GEMINI_API_KEY` в оточенні Gateway, повторно використайте
    `models.providers.google.apiKey` або налаштуйте окремий ключ для вебпошуку через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Конфігурація

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Пріоритет облікових даних:** вебпошук Gemini спершу використовує
`plugins.entries.google.config.webSearch.apiKey`, потім `GEMINI_API_KEY`,
потім `models.providers.google.apiKey`. Для базових URL-адрес окремий
`plugins.entries.google.config.webSearch.baseUrl` має пріоритет над
`models.providers.google.baseUrl`.

Для встановлення gateway розмістіть ключі оточення в `~/.openclaw/.env`.

## Як це працює

На відміну від традиційних постачальників пошуку, які повертають список посилань і фрагментів,
Gemini використовує заземлення Google Search, щоб створювати синтезовані ШІ відповіді з
вбудованими цитуваннями. Результати містять як синтезовану відповідь, так і вихідні
URL-адреси.

- URL-адреси цитувань із заземлення Gemini автоматично перетворюються з URL-адрес
  переспрямування Google на прямі URL-адреси.
- Розв’язання переспрямувань використовує шлях захисту SSRF (HEAD + перевірки переспрямувань +
  перевірка http/https) перед поверненням остаточної URL-адреси цитування.
- Розв’язання переспрямувань використовує суворі стандартні налаштування SSRF, тому переспрямування на
  приватні/внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`, `freshness`, `date_after` і `date_before`.

`count` приймається для сумісності зі спільним `web_search`, але заземлення Gemini
все одно повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

`freshness` приймає `day`, `week`, `month`, `year` і спільні скорочення
`pd`, `pw`, `pm` і `py`. `day`/`pd` додає інструкцію щодо актуальності до запиту Gemini
замість жорсткого 24-годинного діапазону. `week`, `month`, `year` і явні діапазони
`date_after`/`date_before` задають `timeRangeFilter` для заземлення Gemini Google Search.
`country`, `language` і `domain_filter` не підтримуються.

## Вибір моделі

Модель за замовчуванням — `gemini-2.5-flash` (швидка та економічна). Будь-яку модель Gemini,
що підтримує заземлення, можна використовувати через
`plugins.entries.google.config.webSearch.model`.

## Перевизначення базової URL-адреси

Установіть `plugins.entries.google.config.webSearch.baseUrl`, коли вебпошук Gemini
має маршрутизуватися через операторський проксі або спеціальну сумісну з Gemini кінцеву точку. Якщо
це не задано, вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Просте
значення `https://generativelanguage.googleapis.com` нормалізується до
`https://generativelanguage.googleapis.com/v1beta`; шляхи спеціальних проксі зберігаються
як надано після обрізання кінцевих скісних рисок.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі постачальники та автоматичне виявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фрагментами
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати + витягування вмісту
