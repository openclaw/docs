---
read_when:
    - Ви хочете використовувати Grok для web_search
    - Для вебпошуку потрібен XAI_API_KEY
summary: Вебпошук Grok через відповіді xAI з опорою на веб
title: Пошук Grok
x-i18n:
    generated_at: "2026-05-02T02:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw підтримує Grok як провайдера `web_search`, використовуючи відповіді xAI,
обґрунтовані веб-пошуком, для створення синтезованих ШІ відповідей, підкріплених
актуальними результатами пошуку з цитуваннями.

Той самий `XAI_API_KEY` також може забезпечувати роботу вбудованого інструмента
`x_search` для пошуку дописів X (раніше Twitter). Якщо ви зберігаєте ключ у
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw тепер також повторно
використовує його як резервний варіант для вбудованого провайдера моделей xAI.

Для метрик X на рівні допису, як-от репости, відповіді, закладки або перегляди,
надавайте перевагу `x_search` з точною URL-адресою допису або ID статусу замість
широкого пошукового запиту.

## Онбординг і налаштування

Якщо ви виберете **Grok** під час:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw може показати окремий наступний крок, щоб увімкнути `x_search` з тим
самим `XAI_API_KEY`. Цей наступний крок:

- з’являється лише після вибору Grok для `web_search`
- не є окремим вибором провайдера веб-пошуку верхнього рівня
- може додатково задати модель `x_search` під час того самого процесу

Якщо ви його пропустите, ви зможете ввімкнути або змінити `x_search` пізніше в конфігурації.

## Отримання API-ключа

<Steps>
  <Step title="Створіть ключ">
    Отримайте API-ключ від [xAI](https://console.x.ai/).
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
Для встановлення gateway додайте його в `~/.openclaw/.env`.

## Як це працює

Grok використовує відповіді xAI, обґрунтовані веб-пошуком, щоб синтезувати відповіді
з вбудованими цитуваннями, подібно до підходу Gemini з обґрунтуванням через Google Search.

## Підтримувані параметри

Пошук Grok підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Grok усе одно
повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для провайдера, наразі не підтримуються.

Grok використовує специфічний для провайдера стандартний тайм-аут 60 секунд, тому що
веб-пошуки xAI Responses з обґрунтуванням можуть тривати довше, ніж стандартне
значення спільного `web_search`. Установіть `tools.web.search.timeoutSeconds`, щоб перевизначити його.

## Перевизначення базової URL-адреси

Установіть `plugins.entries.xai.config.webSearch.baseUrl`, коли веб-пошук Grok має
маршрутизуватися через операторський проксі або xAI-сумісну кінцеву точку Responses.
OpenClaw надсилає POST-запити до `<baseUrl>/responses` після обрізання кінцевих скісних рисок. `x_search`
використовує той самий резервний варіант `webSearch.baseUrl`, якщо
`plugins.entries.xai.config.xSearch.baseUrl` не задано.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автовиявлення
- [`x_search` у Web Search](/uk/tools/web#x_search) -- повноцінний пошук X через xAI
- [Пошук Gemini](/uk/tools/gemini-search) -- синтезовані ШІ відповіді через обґрунтування Google
