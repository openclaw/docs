---
read_when:
    - Ви хочете використовувати Gemini для web_search
    - Вам потрібен `GEMINI_API_KEY`
    - Ви хочете grounding через Google Search
summary: Web search Gemini з grounding через Google Search
title: Пошук Gemini
x-i18n:
    generated_at: "2026-04-23T21:14:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw підтримує моделі Gemini з вбудованим
[grounding через Google Search](https://ai.google.dev/gemini-api/docs/grounding), який повертає
AI-синтезовані відповіді, підкріплені живими результатами Google Search з
цитуванням.

## Отримайте API-ключ

<Steps>
  <Step title="Створіть ключ">
    Перейдіть до [Google AI Studio](https://aistudio.google.com/apikey) і створіть
    API-ключ.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `GEMINI_API_KEY` у середовищі Gateway або налаштуйте через:

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

**Альтернатива через середовище:** задайте `GEMINI_API_KEY` у середовищі Gateway.
Для встановлення gateway помістіть його в `~/.openclaw/.env`.

## Як це працює

На відміну від традиційних search-провайдерів, які повертають список посилань і snippets,
Gemini використовує grounding через Google Search, щоб створювати AI-синтезовані відповіді з
inline-цитуванням. Результати містять і синтезовану відповідь, і URL
джерел.

- Citation URL з grounding Gemini автоматично розв’язуються з URL-перенаправлень
  Google у прямі URL.
- Розв’язання перенаправлень використовує шлях захисту SSRF (перевірки HEAD + redirect +
  валідація http/https) до повернення фінального citation URL.
- Розв’язання перенаправлень використовує суворі типові налаштування SSRF, тому перенаправлення на
  приватні/внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але grounding Gemini
усе одно повертає одну синтезовану відповідь із цитуванням, а не список з N
результатів.

Специфічні для provider фільтри, такі як `country`, `language`, `freshness` і
`domain_filter`, не підтримуються.

## Вибір моделі

Типова модель — `gemini-2.5-flash` (швидка й економічно ефективна). Будь-яку модель Gemini,
що підтримує grounding, можна використовувати через
`plugins.entries.google.config.webSearch.model`.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі providers і автовизначення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати зі snippets
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати + витягування вмісту
