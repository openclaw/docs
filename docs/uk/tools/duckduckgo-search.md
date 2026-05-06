---
read_when:
    - Вам потрібен провайдер вебпошуку, який не потребує API-ключа
    - Ви хочете використовувати DuckDuckGo для web_search
    - Потрібен резервний механізм пошуку без налаштування
summary: Вебпошук DuckDuckGo -- резервний провайдер без ключа (експериментальний, на основі HTML)
title: Пошук DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T01:53:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw підтримує DuckDuckGo як провайдера `web_search` **без ключа**. API
ключ або обліковий запис не потрібні.

<Warning>
  DuckDuckGo — це **експериментальна, неофіційна** інтеграція, яка отримує результати
  зі сторінок пошуку DuckDuckGo без JavaScript, а не з офіційного API. Очікуйте
  періодичні збої через сторінки з перевіркою ботів або зміни HTML.
</Warning>

## Налаштування

API ключ не потрібен — просто встановіть DuckDuckGo як свого провайдера:

<Steps>
  <Step title="Configure">
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

Додаткові налаштування рівня Plugin для регіону та SafeSearch:

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
Кількість результатів для повернення (1-10).
</ParamField>

<ParamField path="region" type="string">
Код регіону DuckDuckGo (наприклад, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Рівень SafeSearch.
</ParamField>

Регіон і SafeSearch також можна встановити в конфігурації Plugin (див. вище) — параметри
інструмента перевизначають значення конфігурації для кожного запиту.

## Примітки

- **Без API ключа** — працює одразу, без конфігурації
- **Експериментально** — збирає результати з HTML-сторінок пошуку DuckDuckGo
  без JavaScript, а не з офіційного API чи SDK
- **Ризик перевірки ботів** — DuckDuckGo може показувати CAPTCHA або блокувати запити
  за інтенсивного чи автоматизованого використання
- **HTML-парсинг** — результати залежать від структури сторінки, яка може змінитися без
  попередження
- **Порядок автовиявлення** — DuckDuckGo є першим резервним варіантом без ключа
  (порядок 100) в автовиявленні. Провайдери на основі API з налаштованими ключами запускаються
  першими, потім Ollama Web Search (порядок 110), потім SearXNG (порядок 200)
- **SafeSearch за замовчуванням має рівень moderate**, якщо його не налаштовано

<Tip>
  Для використання у продакшені розгляньте [Brave Search](/uk/tools/brave-search) (доступний безкоштовний рівень)
  або іншого провайдера на основі API.
</Tip>

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з безкоштовним рівнем
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
