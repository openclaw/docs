---
read_when:
    - Ви хочете використовувати Grok для web_search
    - Для пошуку в інтернеті потрібен XAI_API_KEY
summary: Вебпошук Grok через відповіді xAI з опорою на вебдані
title: Пошук Grok
x-i18n:
    generated_at: "2026-05-11T21:00:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw підтримує Grok як постачальника `web_search`, використовуючи вебобґрунтовані
відповіді xAI для створення відповідей, синтезованих ШІ та підкріплених актуальними результатами пошуку
з цитуваннями.

Той самий API-ключ xAI також може забезпечувати роботу вбудованого інструмента `x_search` для пошуку дописів у X
(колишній Twitter) та інструмента `code_execution`. Якщо ви зберігаєте
ключ у `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw тепер повторно використовує його
як резервний варіант і для вбудованого постачальника моделей xAI.

Для метрик окремих дописів X, як-от репости, відповіді, закладки або перегляди, надавайте перевагу
`x_search` з точною URL-адресою допису або ID статусу замість широкого пошукового
запиту.

## Початкове налаштування та конфігурування

Якщо ви виберете **Grok** під час:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw може показати окремий наступний крок для ввімкнення `x_search` з тим самим
`XAI_API_KEY`. Цей наступний крок:

- з'являється лише після вибору Grok для `web_search`
- не є окремим варіантом постачальника вебпошуку верхнього рівня
- може додатково налаштувати модель `x_search` у межах того самого процесу

Якщо ви пропустите його, ви зможете ввімкнути або змінити `x_search` пізніше в конфігурації.

## Отримайте API-ключ

<Steps>
  <Step title="Створіть ключ">
    Отримайте API-ключ у [xAI](https://console.x.ai/).
  </Step>
  <Step title="Збережіть ключ">
    Установіть `XAI_API_KEY` у середовищі Gateway або налаштуйте через:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Альтернатива через середовище:** установіть `XAI_API_KEY` у середовищі Gateway.
Для встановлення gateway помістіть його в `~/.openclaw/.env`.

## Як це працює

Grok використовує вебобґрунтовані відповіді xAI, щоб синтезувати відповіді з вбудованими
цитуваннями, подібно до підходу Gemini з обґрунтуванням через Google Search.

## Підтримувані параметри

Пошук Grok підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Grok усе одно
повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для постачальника, наразі не підтримуються.

Grok використовує специфічний для постачальника стандартний тайм-аут 60 секунд, оскільки вебобґрунтовані пошуки xAI Responses
можуть виконуватися довше, ніж спільний стандартний тайм-аут `web_search`. Установіть
`tools.web.search.timeoutSeconds`, щоб перевизначити його.

## Перевизначення базової URL-адреси

Установіть `plugins.entries.xai.config.webSearch.baseUrl`, коли вебпошук Grok має
маршрутизуватися через операторський проксі або сумісну з xAI кінцеву точку Responses. OpenClaw
надсилає запити до `<baseUrl>/responses` після обрізання кінцевих скісних рисок. `x_search`
використовує той самий резервний `webSearch.baseUrl`, якщо
`plugins.entries.xai.config.xSearch.baseUrl` не встановлено.

## Пов'язане

- [Огляд Web Search](/uk/tools/web) -- усі постачальники та автоматичне виявлення
- [x_search у Web Search](/uk/tools/web#x_search) -- повноцінний пошук X через xAI
- [Gemini Search](/uk/tools/gemini-search) -- відповіді, синтезовані ШІ через обґрунтування Google
