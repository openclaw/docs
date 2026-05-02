---
read_when:
    - Ви хочете використовувати Gemini для web_search
    - Потрібен GEMINI_API_KEY
    - Вам потрібне обґрунтування через Google Search
summary: Вебпошук Gemini із прив’язкою до Google Search
title: Пошук Gemini
x-i18n:
    generated_at: "2026-05-02T02:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e36382dc6a4f9a30f12025cc81bb7ed4999e56a236fc85ee7a37444674bf798
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw підтримує моделі Gemini з вбудованим
[обґрунтуванням Google Search](https://ai.google.dev/gemini-api/docs/grounding),
яке повертає AI-синтезовані відповіді на основі живих результатів Google Search
із цитуваннями.

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

**Альтернатива через середовище:** задайте `GEMINI_API_KEY` у середовищі Gateway.
Для встановлення gateway помістіть його в `~/.openclaw/.env`.

## Як це працює

На відміну від традиційних пошукових провайдерів, які повертають список посилань і фрагментів,
Gemini використовує обґрунтування Google Search, щоб створювати AI-синтезовані відповіді з
вбудованими цитуваннями. Результати містять як синтезовану відповідь, так і вихідні
URL.

- URL цитувань із обґрунтування Gemini автоматично перетворюються з URL
  переспрямування Google на прямі URL.
- Перетворення переспрямувань використовує шлях захисту від SSRF (HEAD + перевірки переспрямувань +
  перевірка http/https) перед поверненням фінального URL цитування.
- Перетворення переспрямувань використовує строгі типові налаштування SSRF, тому переспрямування на
  приватні/внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але обґрунтування Gemini
все одно повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для провайдера, як-от `country`, `language`, `freshness` і
`domain_filter`, не підтримуються.

## Вибір моделі

Типова модель — `gemini-2.5-flash` (швидка й економічна). Будь-яку модель Gemini,
що підтримує обґрунтування, можна використовувати через
`plugins.entries.google.config.webSearch.model`.

## Перевизначення базового URL

Задайте `plugins.entries.google.config.webSearch.baseUrl`, коли вебпошук Gemini
має проходити через проксі оператора або власну Gemini-сумісну кінцеву точку. Просте
значення `https://generativelanguage.googleapis.com` нормалізується до
`https://generativelanguage.googleapis.com/v1beta`; власні шляхи проксі зберігаються
як надано після обрізання кінцевих скісних рисок.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автоматичне виявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фрагментами
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати + витягування вмісту
