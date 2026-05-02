---
read_when:
    - Ви хочете використовувати Gemini для web_search
    - Потрібен GEMINI_API_KEY або models.providers.google.apiKey
    - Вам потрібне обґрунтування за допомогою Google Search
summary: Вебпошук Gemini із прив’язкою до Google Search
title: Пошук Gemini
x-i18n:
    generated_at: "2026-05-02T04:48:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw підтримує моделі Gemini з вбудованою
[прив’язкою до Google Search](https://ai.google.dev/gemini-api/docs/grounding),
яка повертає синтезовані ШІ відповіді на основі актуальних результатів Google Search із
цитуваннями.

## Отримання API-ключа

<Steps>
  <Step title="Створіть ключ">
    Перейдіть до [Google AI Studio](https://aistudio.google.com/apikey) і створіть
    API-ключ.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `GEMINI_API_KEY` у середовищі Gateway, повторно використайте
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

**Пріоритет облікових даних:** вебпошук Gemini спочатку використовує
`plugins.entries.google.config.webSearch.apiKey`, потім `GEMINI_API_KEY`,
а тоді `models.providers.google.apiKey`. Для базових URL окреме значення
`plugins.entries.google.config.webSearch.baseUrl` має пріоритет перед
`models.providers.google.baseUrl`.

Для встановлення Gateway розмістіть ключі середовища в `~/.openclaw/.env`.

## Як це працює

На відміну від традиційних пошукових провайдерів, які повертають список посилань і фрагментів,
Gemini використовує прив’язку до Google Search, щоб створювати синтезовані ШІ відповіді з
вбудованими цитуваннями. Результати містять і синтезовану відповідь, і вихідні
URL.

- URL цитувань із прив’язки Gemini автоматично перетворюються з URL
  перенаправлення Google на прямі URL.
- Розв’язання перенаправлень використовує шлях захисту від SSRF (HEAD + перевірки перенаправлень +
  перевірка http/https), перш ніж повернути фінальний URL цитування.
- Розв’язання перенаправлень використовує суворі стандартні налаштування SSRF, тому перенаправлення на
  приватні/внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`, `freshness`, `date_after` і `date_before`.

`count` приймається для сумісності зі спільним `web_search`, але прив’язка Gemini
усе одно повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

`freshness` приймає `day`, `week`, `month`, `year` і спільні скорочення
`pd`, `pw`, `pm` та `py`. OpenClaw перетворює ці значення або явний
діапазон `date_after`/`date_before` на `timeRangeFilter` для прив’язки Gemini Google Search.
`country`, `language` і `domain_filter` не підтримуються.

## Вибір моделі

Стандартна модель — `gemini-2.5-flash` (швидка та економічна). Будь-яку модель Gemini,
що підтримує прив’язку, можна використовувати через
`plugins.entries.google.config.webSearch.model`.

## Перевизначення базового URL

Задайте `plugins.entries.google.config.webSearch.baseUrl`, коли вебпошук Gemini
має проходити через проксі оператора або користувацький Gemini-сумісний endpoint. Якщо
це значення не задано, вебпошук Gemini повторно використовує `models.providers.google.baseUrl`. Звичайне
значення `https://generativelanguage.googleapis.com` нормалізується до
`https://generativelanguage.googleapis.com/v1beta`; користувацькі шляхи проксі зберігаються
як надано після обрізання кінцевих скісних рисок.

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери й автоматичне виявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фрагментами
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати + витягування вмісту
