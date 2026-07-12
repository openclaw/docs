---
read_when:
    - Вам потрібен постачальник вебпошуку, який не вимагає ключа API
    - Ви хочете використовувати DuckDuckGo для web_search
    - Ви хочете явно вибрати постачальника пошуку, який не потребує ключа
summary: Вебпошук DuckDuckGo — провайдер без ключа (експериментальний, на основі HTML)
title: Пошук DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T13:52:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw підтримує DuckDuckGo як **постачальника `web_search` без ключа**. Ключ API або обліковий запис не потрібні.

<Warning>
  DuckDuckGo — це **експериментальна, неофіційна** інтеграція, яка збирає дані з HTML-сторінок пошуку DuckDuckGo без JavaScript, а не використовує офіційний API. Можливі періодичні збої через сторінки перевірки на ботів або зміни HTML.
</Warning>

## Налаштування

DuckDuckGo ніколи не вибирається автоматично, оскільки автоматичне виявлення враховує лише постачальників із придатними обліковими даними. Укажіть його явно:

<Steps>
  <Step title="Налаштування">
    ```bash
    openclaw configure --section web
    # Виберіть "duckduckgo" як постачальника
    ```
  </Step>
</Steps>

## Конфігурація

Укажіть постачальника безпосередньо в конфігурації:

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

Необов’язкові налаштування регіону й SafeSearch на рівні Plugin:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Код регіону DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" або "off"
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

Параметри інструмента `region` і `safeSearch` перевизначають наведені вище значення конфігурації Plugin окремо для кожного запиту.

## Примітки

- **Без ключа API** — працює після вибору DuckDuckGo як постачальника `web_search`.
- **Експериментальна інтеграція** — збирає дані з HTML-сторінок пошуку DuckDuckGo без JavaScript і не використовує офіційний API або SDK. Результати залежать від структури сторінки, яка може змінитися без попередження.
- **Ризик перевірки на ботів** — DuckDuckGo може показувати CAPTCHA або блокувати запити за інтенсивного чи автоматизованого використання.
- **Лише явний вибір** — автоматичне виявлення OpenClaw враховує лише постачальників із придатними обліковими даними, тому постачальник без ключа, як-от DuckDuckGo, ніколи не вибирається автоматично; необхідно встановити `provider: "duckduckgo"`.
- **SafeSearch за замовчуванням має значення `moderate`**, якщо його не налаштовано.

<Tip>
  Для використання у виробничому середовищі розгляньте [Brave Search](/uk/tools/brave-search) (доступний безплатний рівень) або іншого постачальника на основі API.
</Tip>

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) — усі постачальники й автоматичне виявлення
- [Brave Search](/uk/tools/brave-search) — структуровані результати з безплатним рівнем
- [Exa Search](/uk/tools/exa-search) — нейронний пошук із видобуванням вмісту
