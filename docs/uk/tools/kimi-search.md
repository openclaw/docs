---
read_when:
    - Ви хочете використовувати Kimi для web_search
    - Потрібен KIMI_API_KEY або MOONSHOT_API_KEY
summary: Вебпошук Kimi через вебпошук Moonshot
title: Пошук Kimi
x-i18n:
    generated_at: "2026-05-02T06:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw підтримує Kimi як постачальника `web_search`, використовуючи вебпошук Moonshot
для створення AI-синтезованих відповідей із цитуваннями.

## Отримайте API-ключ

<Steps>
  <Step title="Create a key">
    Отримайте API-ключ у [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Store the key">
    Задайте `KIMI_API_KEY` або `MOONSHOT_API_KEY` в середовищі Gateway, або
    налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон Moonshot API:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- стандартну модель вебпошуку Kimi (типово `kimi-k2.6`)

## Конфігурація

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Якщо ви використовуєте китайський API-хост для чату (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw повторно використовує той самий хост для Kimi
`web_search`, коли `tools.web.search.kimi.baseUrl` пропущено, тож ключі з
[platform.moonshot.cn](https://platform.moonshot.cn/) помилково не потрапляють на
міжнародний endpoint (який часто повертає HTTP 401). Перевизначте
за допомогою `tools.web.search.kimi.baseUrl`, коли вам потрібен інший базовий URL пошуку.

**Альтернатива через середовище:** задайте `KIMI_API_KEY` або `MOONSHOT_API_KEY` в
середовищі Gateway. Для встановлення gateway помістіть його в `~/.openclaw/.env`.

Якщо пропустити `baseUrl`, OpenClaw типово використовує `https://api.moonshot.ai/v1`.
Якщо пропустити `model`, OpenClaw типово використовує `kimi-k2.6`.

## Як це працює

Kimi використовує вебпошук Moonshot для синтезу відповідей із вбудованими цитуваннями,
подібно до підходу заземлених відповідей Gemini та Grok.

OpenClaw вважає Kimi `web_search` успішним лише після того, як Moonshot повертає
нативні докази заземлення вебпошуку, як-от придатне для повторного відтворення
корисне навантаження інструмента `$web_search`, `search_results` або URL цитувань. Якщо Kimi одразу зупиняється зі
звичайною відповіддю чату на кшталт "I cannot browse the internet" і без доказів заземлення,
OpenClaw повертає структуровану помилку `kimi_web_search_ungrounded` замість того, щоб
обгортати цей текст як результат пошуку. Повторіть запит, перемкніться на структурованого
постачальника, як-от Brave, або використайте `web_fetch` / інструмент браузера, коли ви вже
маєте цільовий URL.

## Підтримувані параметри

Пошук Kimi підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Kimi все одно
повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для постачальника, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі постачальники та автовизначення
- [Moonshot AI](/uk/providers/moonshot) -- документація для моделі Moonshot і постачальника Kimi Coding
- [Gemini Search](/uk/tools/gemini-search) -- AI-синтезовані відповіді через заземлення Google
- [Grok Search](/uk/tools/grok-search) -- AI-синтезовані відповіді через заземлення xAI
