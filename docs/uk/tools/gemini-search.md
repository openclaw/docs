---
read_when:
    - Ви хочете використовувати Gemini для web_search
    - Вам потрібен GEMINI_API_KEY
    - Вам потрібне обґрунтування результатами Google Search
summary: Вебпошук Gemini з обґрунтуванням за допомогою Google Search
title: Пошук Gemini
x-i18n:
    generated_at: "2026-05-02T04:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e48b73a59f1af08cb1e30f149a18534dc76ba8dff26935d83fe8ccdaa8ab74e6
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw підтримує моделі Gemini з вбудованим
[обґрунтуванням Google Search](https://ai.google.dev/gemini-api/docs/grounding),
яке повертає синтезовані ШІ відповіді, підкріплені актуальними результатами Google Search із
цитуваннями.

## Отримання API-ключа

<Steps>
  <Step title="Створіть ключ">
    Перейдіть до [Google AI Studio](https://aistudio.google.com/apikey) і створіть
    API-ключ.
  </Step>
  <Step title="Збережіть ключ">
    Установіть `GEMINI_API_KEY` в оточенні Gateway або налаштуйте через:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional proxy/base URL override
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

**Альтернатива через оточення:** установіть `GEMINI_API_KEY` в оточенні Gateway.
Для встановлення gateway помістіть його в `~/.openclaw/.env`.

## Як це працює

На відміну від традиційних постачальників пошуку, які повертають список посилань і фрагментів,
Gemini використовує обґрунтування Google Search, щоб створювати синтезовані ШІ відповіді з
вбудованими цитуваннями. Результати містять як синтезовану відповідь, так і вихідні
URL-адреси.

- URL-адреси цитувань із обґрунтування Gemini автоматично перетворюються з URL-адрес
  перенаправлення Google на прямі URL-адреси.
- Обробка перенаправлень використовує шлях захисту від SSRF (HEAD + перевірки перенаправлень +
  перевірка http/https) перед поверненням фінальної URL-адреси цитування.
- Обробка перенаправлень використовує строгі стандартні налаштування SSRF, тому перенаправлення на
  приватні/внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`, `freshness`, `date_after` і `date_before`.

`count` приймається для сумісності зі спільним `web_search`, але обґрунтування Gemini
все одно повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

`freshness` приймає `day`, `week`, `month`, `year` і спільні скорочення
`pd`, `pw`, `pm` та `py`. OpenClaw перетворює ці значення або явний
діапазон `date_after`/`date_before` на `timeRangeFilter` обґрунтування
Gemini Google Search. `country`, `language` і `domain_filter` не підтримуються.

## Вибір моделі

Стандартна модель — `gemini-2.5-flash` (швидка й економічно ефективна). Будь-яку модель Gemini,
що підтримує обґрунтування, можна використовувати через
`plugins.entries.google.config.webSearch.model`.

## Перевизначення базової URL-адреси

Установіть `plugins.entries.google.config.webSearch.baseUrl`, коли вебпошук Gemini
має проходити через операторський проксі або власну сумісну з Gemini кінцеву точку. Значення
`https://generativelanguage.googleapis.com` нормалізується до
`https://generativelanguage.googleapis.com/v1beta`; власні шляхи проксі залишаються
такими, як надано, після обрізання кінцевих скісних рисок.

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі постачальники та автовиявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фрагментами
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати + витягування вмісту
