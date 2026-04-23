---
read_when:
    - Ви хочете використовувати Grok для `web_search`
    - Вам потрібен `XAI_API_KEY` для web search
summary: Grok web search через веб-обґрунтовані відповіді xAI
title: Пошук Grok
x-i18n:
    generated_at: "2026-04-23T21:14:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw підтримує Grok як провайдера `web_search`, використовуючи веб-обґрунтовані
відповіді xAI для створення AI-синтезованих відповідей, підкріплених живими результатами пошуку
з цитуваннями.

Той самий `XAI_API_KEY` також може живити вбудований інструмент `x_search` для пошуку дописів у X
(колишній Twitter). Якщо ви зберігаєте ключ у
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw тепер повторно використовує його як
запасний варіант і для вбудованого провайдера моделі xAI.

Для метрик окремих дописів у X, таких як reposts, replies, bookmarks або views, надавайте перевагу
`x_search` з точною URL-адресою допису або status ID замість широкого пошукового
запиту.

## Onboarding і configure

Якщо ви виберете **Grok** під час:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw може показати окремий додатковий крок для ввімкнення `x_search` з тим самим
`XAI_API_KEY`. Цей додатковий крок:

- з’являється лише після того, як ви обрали Grok для `web_search`
- не є окремим вибором web-search провайдера верхнього рівня
- може за бажанням встановити модель `x_search` під час того самого потоку

Якщо ви пропустите це, ви зможете ввімкнути або змінити `x_search` пізніше в конфігурації.

## Отримання API key

<Steps>
  <Step title="Створіть ключ">
    Отримайте API key від [xAI](https://console.x.ai/).
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

Grok використовує веб-обґрунтовані відповіді xAI для синтезу відповідей з inline-цитуваннями,
подібно до підходу Google Search grounding у Gemini.

## Підтримувані параметри

Пошук Grok підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Grok усе одно
повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовиявлення
- [x_search у Web Search](/uk/tools/web#x_search) -- first-class пошук у X через xAI
- [Пошук Gemini](/uk/tools/gemini-search) -- AI-синтезовані відповіді через Google grounding
