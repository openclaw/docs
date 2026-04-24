---
read_when:
    - Вам потрібен провайдер вебпошуку, який не потребує API-ключа
    - Ви хочете використовувати DuckDuckGo для web_search
    - Вам потрібен резервний пошук без налаштування
summary: DuckDuckGo вебпошук -- резервний провайдер без ключа (експериментальний, на основі HTML)
title: Пошук DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T02:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw підтримує DuckDuckGo як **безключовий** провайдер `web_search`. API-ключ
або обліковий запис не потрібні.

<Warning>
  DuckDuckGo — це **експериментальна, неофіційна** інтеграція, яка отримує результати
  зі сторінок пошуку DuckDuckGo без JavaScript — а не з офіційного API. Можливі
  періодичні збої через сторінки bot-challenge або зміни HTML.
</Warning>

## Налаштування

API-ключ не потрібен — просто вкажіть DuckDuckGo як свого провайдера:

<Steps>
  <Step title="Налаштування">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Необов’язкові налаштування на рівні Plugin для регіону та SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Параметри інструмента

<ParamField path="query" type="string" required>
Пошуковий запит.
</ParamField>

<ParamField path="count" type="number" default="5">
Кількість результатів для повернення (1–10).
</ParamField>

<ParamField path="region" type="string">
Код регіону DuckDuckGo (наприклад, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Рівень SafeSearch.
</ParamField>

Регіон і SafeSearch також можна задати в конфігурації Plugin (див. вище) —
параметри інструмента мають пріоритет над значеннями конфігурації для кожного запиту.

## Примітки

- **Без API-ключа** — працює одразу, без жодного налаштування
- **Експериментально** — збирає результати зі сторінок пошуку DuckDuckGo у HTML без JavaScript,
  а не з офіційного API чи SDK
- **Ризик bot-challenge** — DuckDuckGo може показувати CAPTCHA або блокувати запити
  за інтенсивного чи автоматизованого використання
- **Парсинг HTML** — результати залежать від структури сторінки, яка може змінитися
  без попередження
- **Порядок автовизначення** — DuckDuckGo є першим резервним безключовим варіантом
  (порядок 100) в автовизначенні. Провайдери з API та налаштованими ключами виконуються
  першими, потім Ollama Web Search (порядок 110), а потім SearXNG (порядок 200)
- **SafeSearch типово встановлено на moderate**, якщо його не налаштовано

<Tip>
  Для використання у production розгляньте [Brave Search](/uk/tools/brave-search) (доступний
  безкоштовний рівень) або іншого провайдера з API.
</Tip>

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовизначення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з безкоштовним рівнем
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
