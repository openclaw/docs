---
read_when:
    - Ви хочете використовувати MiniMax для web_search
    - Вам потрібен ключ MiniMax Coding Plan
    - Вам потрібні вказівки щодо хостів пошуку MiniMax CN/global
summary: MiniMax Search через API пошуку Coding Plan
title: Пошук MiniMax
x-i18n:
    generated_at: "2026-04-23T21:16:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw підтримує MiniMax як провайдера `web_search` через API пошуку MiniMax
Coding Plan. Він повертає структуровані результати пошуку із заголовками, URL,
snippets і related queries.

## Отримайте ключ Coding Plan

<Steps>
  <Step title="Створіть ключ">
    Створіть або скопіюйте ключ MiniMax Coding Plan з
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Збережіть ключ">
    Задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw також приймає `MINIMAX_CODING_API_KEY` як alias env. `MINIMAX_API_KEY`
і далі читається як compatibility fallback, коли він уже вказує на токен coding-plan.

## Конфігурація

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Альтернатива через середовище:** задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway.
Для встановленого gateway помістіть його в `~/.openclaw/.env`.

## Вибір регіону

MiniMax Search використовує такі endpoint-и:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Якщо `plugins.entries.minimax.config.webSearch.region` не задано, OpenClaw розв’язує
регіон у такому порядку:

1. `tools.web.search.minimax.region` / `webSearch.region`, яким володіє plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Це означає, що onboarding CN або `MINIMAX_API_HOST=https://api.minimaxi.com/...`
автоматично утримує MiniMax Search також на хості CN.

Навіть якщо ви автентифікували MiniMax через шлях OAuth `minimax-portal`,
web search усе одно реєструється як provider id `minimax`; base URL OAuth-провайдера
використовується лише як підказка регіону для вибору хоста CN/global.

## Підтримувані параметри

MiniMax Search підтримує:

- `query`
- `count` (OpenClaw обрізає повернений список результатів до запитаного count)

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери й auto-detection
- [MiniMax](/uk/providers/minimax) -- налаштування моделей, image, speech і auth
