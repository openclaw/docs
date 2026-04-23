---
read_when:
    - Ви хочете провайдера вебпошуку, який не потребує API key
    - Ви хочете використовувати DuckDuckGo для `web_search`
    - |-
      Вам потрібен пошуковий fallback без конфігурації】【：】【“】【analysis to=functions.read 】【、】【commentary  微信里的天天中彩票  天天中彩票提现 ＿欧美json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n","offset":1,"limit":20}
summary: Вебпошук DuckDuckGo — fallback-провайдер без ключа (експериментальний, на основі HTML)
title: Пошук DuckDuckGo
x-i18n:
    generated_at: "2026-04-23T21:14:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2897231bcd21ebd80afb5182e9f5427b66d3d6a1cc956bb373484b4d9e0b83a
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw підтримує DuckDuckGo як провайдера `web_search` **без ключа**. Жоден API
key або обліковий запис не потрібні.

<Warning>
  DuckDuckGo — це **експериментальна, неофіційна** інтеграція, яка отримує результати
  зі сторінок пошуку DuckDuckGo без JavaScript, а не з офіційного API. Очікуйте
  періодичних збоїв через сторінки bot-challenge або зміни HTML.
</Warning>

## Налаштування

API key не потрібен — просто задайте DuckDuckGo як провайдера:

<Steps>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    # Виберіть "duckduckgo" як провайдера
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

Необов’язкові налаштування на рівні Plugin для регіону і SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // код регіону DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" або "off"
          },
        },
      },
    },
  },
}
```

## Параметри інструмента

| Parameter    | Description                                                      |
| ------------ | ---------------------------------------------------------------- |
| `query`      | Пошуковий запит (обов’язково)                                    |
| `count`      | Кількість результатів для повернення (1-10, типово: 5)           |
| `region`     | Код регіону DuckDuckGo (наприклад, `us-en`, `uk-en`, `de-de`)    |
| `safeSearch` | Рівень SafeSearch: `strict`, `moderate` (типово) або `off`       |

Регіон і SafeSearch також можна задати в config Plugin (див. вище) — параметри
інструмента перевизначають значення config для кожного запиту.

## Примітки

- **Без API key** — працює одразу, без жодної конфігурації
- **Експериментально** — збирає результати зі сторінок пошуку DuckDuckGo без JavaScript у форматі HTML,
  а не з офіційного API чи SDK
- **Ризик bot-challenge** — DuckDuckGo може показувати CAPTCHA або блокувати запити
  за інтенсивного чи автоматизованого використання
- **Розбір HTML** — результати залежать від структури сторінки, яка може змінюватися без
  попередження
- **Порядок автовизначення** — DuckDuckGo є першим fallback без ключа
  (порядок 100) в автовизначенні. Провайдери з API і налаштованими ключами виконуються
  першими, потім Ollama Web Search (порядок 110), потім SearXNG (порядок 200)
- **SafeSearch типово має значення moderate**, якщо не налаштовано

<Tip>
  Для використання в production розгляньте [Brave Search](/uk/tools/brave-search) (доступний
  безкоштовний рівень) або іншого провайдера з API.
</Tip>

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автовизначення
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з безкоштовним рівнем
- [Exa Search](/uk/tools/exa-search) -- нейронний пошук із витягуванням вмісту
