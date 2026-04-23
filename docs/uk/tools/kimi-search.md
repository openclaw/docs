---
read_when:
    - Ви хочете використовувати Kimi для `web_search`
    - Вам потрібен `KIMI_API_KEY` або `MOONSHOT_API_KEY`
summary: Вебпошук Kimi через вебпошук Moonshot
title: Пошук Kimi
x-i18n:
    generated_at: "2026-04-23T21:15:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw підтримує Kimi як провайдера `web_search`, використовуючи вебпошук Moonshot
для створення AI-синтезованих відповідей із цитуванням.

## Отримайте API key

<Steps>
  <Step title="Створіть key">
    Отримайте API key у [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Збережіть key">
    Задайте `KIMI_API_KEY` або `MOONSHOT_API_KEY` у середовищі Gateway, або
    налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- типову модель вебпошуку Kimi (типово `kimi-k2.6`)

## Конфігурація

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // необов’язково, якщо задано KIMI_API_KEY або MOONSHOT_API_KEY
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

Якщо ви використовуєте host API China для chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw повторно використовує той самий host для Kimi
`web_search`, коли `tools.web.search.kimi.baseUrl` не задано, тож ключі з
[platform.moonshot.cn](https://platform.moonshot.cn/) помилково не потрапляють на
міжнародний endpoint (який часто повертає HTTP 401). Перевизначайте
через `tools.web.search.kimi.baseUrl`, коли вам потрібен інший base URL для пошуку.

**Альтернатива через середовище:** задайте `KIMI_API_KEY` або `MOONSHOT_API_KEY` у
середовищі Gateway. Для встановленого gateway помістіть його в `~/.openclaw/.env`.

Якщо ви не вкажете `baseUrl`, OpenClaw типово використовує `https://api.moonshot.ai/v1`.
Якщо ви не вкажете `model`, OpenClaw типово використовує `kimi-k2.6`.

## Як це працює

Kimi використовує вебпошук Moonshot для синтезу відповідей із вбудованими цитатами,
подібно до підходу обґрунтованих відповідей у Gemini та Grok.

## Підтримувані параметри

Пошук Kimi підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Kimi все одно
повертає одну синтезовану відповідь із цитатами, а не список із N результатів.

Специфічні для провайдера фільтри наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й автовизначення
- [Moonshot AI](/uk/providers/moonshot) -- документація провайдера моделей Moonshot + Kimi Coding
- [Gemini Search](/uk/tools/gemini-search) -- AI-синтезовані відповіді через Google grounding
- [Grok Search](/uk/tools/grok-search) -- AI-синтезовані відповіді через xAI grounding
