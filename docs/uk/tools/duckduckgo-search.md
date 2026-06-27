---
read_when:
    - Вам потрібен провайдер вебпошуку, який не потребує API-ключа
    - Ви хочете використовувати DuckDuckGo для web_search
    - Вам потрібен явно вибраний постачальник пошуку без ключа
summary: Пошук в інтернеті DuckDuckGo -- провайдер без ключа (експериментальний, на основі HTML)
title: Пошук DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:24:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw підтримує DuckDuckGo як **безключового** провайдера `web_search`. API
ключ або обліковий запис не потрібні.

<Warning>
  DuckDuckGo — це **експериментальна, неофіційна** інтеграція, яка отримує результати
  зі сторінок пошуку DuckDuckGo без JavaScript, а не з офіційного API. Очікуйте
  періодичних збоїв через сторінки перевірки ботів або зміни HTML.
</Warning>

## Налаштування

API ключ не потрібен - просто встановіть DuckDuckGo як свого провайдера:

<Steps>
  <Step title="Налаштуйте">
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

Необов’язкові налаштування рівня plugin для регіону й SafeSearch:

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

Регіон і SafeSearch також можна задати в конфігурації plugin (див. вище) -
параметри інструмента перевизначають значення конфігурації для кожного запиту.

## Примітки

- **Без API ключа** - працює після вибору DuckDuckGo як вашого провайдера
  `web_search`
- **Експериментально** - збирає результати з HTML-сторінок пошуку DuckDuckGo
  без JavaScript, а не з офіційного API або SDK
- **Ризик перевірки ботів** - DuckDuckGo може показувати CAPTCHA або блокувати запити
  за інтенсивного чи автоматизованого використання
- **Парсинг HTML** - результати залежать від структури сторінки, яка може змінитися без
  попередження
- **Явний вибір** - OpenClaw не вибирає DuckDuckGo автоматично,
  коли не налаштовано провайдера з API
- **SafeSearch за замовчуванням має значення moderate**, якщо його не налаштовано

<Tip>
  Для використання у продакшені розгляньте [Brave Search](/uk/tools/brave-search) (доступний
  безплатний рівень) або іншого провайдера з API.
</Tip>

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з безплатним рівнем
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
