---
read_when:
    - Ви хочете використовувати Gemini для web_search
    - Вам потрібен `GEMINI_API_KEY` або `models.providers.google.apiKey`
    - Ви хочете використовувати прив’язку до Google Search
summary: Вебпошук Gemini із прив’язкою до Google Search
title: Пошук Gemini
x-i18n:
    generated_at: "2026-07-12T13:46:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw підтримує моделі Gemini із вбудованим
[обґрунтуванням через Google Search](https://ai.google.dev/gemini-api/docs/grounding),
яке повертає синтезовані ШІ відповіді на основі актуальних результатів Google Search
із посиланнями на джерела.

## Отримання ключа API

<Steps>
  <Step title="Створіть ключ">
    Перейдіть до [Google AI Studio](https://aistudio.google.com/apikey) і створіть
    ключ API.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `GEMINI_API_KEY` у середовищі Gateway, повторно використайте
    `models.providers.google.apiKey` або налаштуйте окремий ключ для вебпошуку за допомогою:

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
            apiKey: "AIza...", // необов’язково, якщо задано GEMINI_API_KEY або models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // необов’язково; резервно використовується models.providers.google.baseUrl
            model: "gemini-2.5-flash", // типове значення
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
а далі `models.providers.google.apiKey`. Для базових URL-адрес окремий параметр
`plugins.entries.google.config.webSearch.baseUrl` має пріоритет над
`models.providers.google.baseUrl`.

Для інсталяції Gateway додайте ключі середовища до `~/.openclaw/.env`.

## Принцип роботи

На відміну від традиційних постачальників пошуку, які повертають список посилань і фрагментів,
Gemini використовує обґрунтування через Google Search для створення синтезованих ШІ відповідей
із вбудованими посиланнями на джерела. Результати містять як синтезовану відповідь, так і URL-адреси
джерел.

- URL-адреси посилань на джерела з обґрунтування Gemini автоматично перетворюються з URL-адрес
  переспрямування Google на прямі URL-адреси за допомогою запиту HEAD через захищений від SSRF
  шлях отримання даних OpenClaw (перехід за переспрямуваннями, перевірка http/https).
- Для обробки переспрямувань використовуються суворі типові налаштування захисту від SSRF,
  тому переспрямування на приватні або внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`, `freshness`, `date_after` і `date_before`.

`count` приймається для сумісності зі спільним інструментом `web_search`, але обґрунтування
Gemini усе одно повертає одну синтезовану відповідь із посиланнями на джерела, а не список
із N результатів.

`freshness` приймає значення `day`, `week`, `month`, `year` і спільні скорочення
`pd`, `pw`, `pm` та `py`. Значення `day`/`pd` додає до запиту Gemini вказівку щодо
актуальності замість жорсткого 24-годинного діапазону. Значення `week`, `month`, `year`
і явні діапазони `date_after`/`date_before` задають `timeRangeFilter` для обґрунтування
Google Search у Gemini. Параметри `country`, `language` і `domain_filter` не підтримуються.

## Вибір моделі

Типовою моделлю є `gemini-2.5-flash` (швидка й економічна). Через
`plugins.entries.google.config.webSearch.model` можна використовувати будь-яку модель
Gemini, що підтримує обґрунтування.

## Перевизначення базової URL-адреси

Задайте `plugins.entries.google.config.webSearch.baseUrl`, коли вебпошук Gemini
має спрямовуватися через проксі оператора або власну кінцеву точку, сумісну з Gemini. Якщо
цей параметр не задано, вебпошук Gemini повторно використовує `models.providers.google.baseUrl`.
Звичайне значення `https://generativelanguage.googleapis.com` нормалізується до
`https://generativelanguage.googleapis.com/v1beta`; шляхи власних проксі зберігаються
в наданому вигляді після видалення кінцевих скісних рисок.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) -- усі постачальники та автоматичне визначення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з фрагментами
- [Perplexity Search](/uk/tools/perplexity-search) -- структуровані результати та видобування вмісту
