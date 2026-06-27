---
read_when:
    - Ви хочете використовувати Grok для web_search
    - Ви хочете використовувати xAI OAuth або XAI_API_KEY для вебпошуку
summary: Вебпошук Grok через відповіді xAI, обґрунтовані вебданими
title: Пошук Grok
x-i18n:
    generated_at: "2026-06-27T18:25:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw підтримує Grok як постачальника `web_search`, використовуючи веб-обґрунтовані
відповіді xAI для створення синтезованих ШІ відповідей, підкріплених живими результатами пошуку
з цитуваннями.

Веб-пошук Grok надає перевагу вашому наявному входу через xAI OAuth, коли він доступний.
Якщо профілю OAuth немає, той самий API-ключ xAI також може забезпечувати роботу вбудованого
інструмента `x_search` для пошуку дописів X (раніше Twitter) та інструмента `code_execution`.
Якщо ви зберігаєте ключ у `plugins.entries.xai.config.webSearch.apiKey`,
OpenClaw також повторно використовує його як резервний варіант для вбудованого постачальника моделей xAI.

Для метрик рівня допису X, як-от репости, відповіді, закладки або перегляди, віддавайте перевагу
`x_search` з точною URL-адресою допису або ID статусу замість широкого пошукового
запиту.

## Вступне налаштування та конфігурація

Якщо ви виберете **Grok** під час:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw може використати наявний профіль xAI OAuth без запиту окремого
ключа для веб-пошуку. Якщо OAuth недоступний, він переходить до налаштування API-ключа xAI.
OpenClaw також може показати окремий наступний крок для ввімкнення `x_search` з тими самими
обліковими даними xAI. Цей наступний крок:

- з’являється лише після вибору Grok для `web_search`
- не є окремим вибором постачальника веб-пошуку верхнього рівня
- може за бажанням задати модель `x_search` під час того самого процесу

Якщо ви його пропустите, ви зможете ввімкнути або змінити `x_search` пізніше в конфігурації.

## Увійдіть або отримайте API-ключ

<Steps>
  <Step title="Use xAI OAuth">
    Якщо ви вже ввійшли через xAI під час вступного налаштування або автентифікації моделі, виберіть
    Grok як постачальника `web_search`. Окремий API-ключ не потрібен:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    Отримайте API-ключ від [xAI](https://console.x.ai/), коли OAuth недоступний
    або ви навмисно хочете конфігурацію веб-пошуку з ключем.
  </Step>
  <Step title="Store the key">
    Задайте `XAI_API_KEY` у середовищі Gateway або налаштуйте через:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Альтернативи облікових даних:** увійдіть за допомогою `openclaw models auth login
--provider xai --method oauth`, задайте `XAI_API_KEY` у середовищі Gateway
або збережіть `plugins.entries.xai.config.webSearch.apiKey`. Для встановлення gateway
помістіть змінні середовища в `~/.openclaw/.env`.

## Як це працює

Grok використовує веб-обґрунтовані відповіді xAI, щоб синтезувати відповіді з вбудованими
цитуваннями, подібно до підходу Gemini з обґрунтуванням через Google Search.

## Підтримувані параметри

Пошук Grok підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Grok усе одно
повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для постачальника, наразі не підтримуються.

Grok використовує специфічний для постачальника типовий тайм-аут 60 секунд, оскільки веб-обґрунтовані
пошуки xAI Responses можуть виконуватися довше, ніж спільний типовий тайм-аут `web_search`. Задайте
`tools.web.search.timeoutSeconds`, щоб перевизначити його.

## Перевизначення базової URL-адреси

Задайте `plugins.entries.xai.config.webSearch.baseUrl`, коли веб-пошук Grok має
маршрутизуватися через проксі оператора або сумісну з xAI кінцеву точку Responses. OpenClaw
надсилає запити до `<baseUrl>/responses` після обрізання кінцевих скісних рисок. `x_search`
використовує той самий резервний `webSearch.baseUrl`, якщо
`plugins.entries.xai.config.xSearch.baseUrl` не задано.

## Пов’язане

- [Огляд веб-пошуку](/uk/tools/web) -- усі постачальники та автоматичне виявлення
- [x_search у веб-пошуку](/uk/tools/web#x_search) -- повноцінний пошук X через xAI
- [Пошук Gemini](/uk/tools/gemini-search) -- синтезовані ШІ відповіді через обґрунтування Google
