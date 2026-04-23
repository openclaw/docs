---
read_when:
    - Ви хочете self-hosted провайдера вебпошуку
    - Ви хочете використовувати SearXNG для web_search
    - Вам потрібен орієнтований на приватність або air-gapped варіант пошуку
summary: Вебпошук SearXNG -- self-hosted meta-search provider без ключів
title: Пошук SearXNG
x-i18n:
    generated_at: "2026-04-23T21:16:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw підтримує [SearXNG](https://docs.searxng.org/) як **self-hosted,
key-free** provider `web_search`. SearXNG — це open-source meta-search engine,
який агрегує результати з Google, Bing, DuckDuckGo та інших джерел.

Переваги:

- **Безкоштовно й без обмежень** -- не потрібні API-ключ або комерційна підписка
- **Приватність / air-gap** -- запити ніколи не залишають вашу мережу
- **Працює будь-де** -- немає регіональних обмежень комерційних search API

## Налаштування

<Steps>
  <Step title="Запустіть екземпляр SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Або використовуйте будь-яке наявне розгортання SearXNG, до якого у вас є доступ. Налаштування production див. у
    [документації SearXNG](https://docs.searxng.org/).

  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Або задайте env var і дозвольте автовизначенню знайти її:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Налаштування екземпляра SearXNG на рівні Plugin:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Поле `baseUrl` також приймає об’єкти SecretRef.

Правила транспорту:

- `https://` працює для публічних або приватних хостів SearXNG
- `http://` приймається лише для довірених хостів приватної мережі або loopback
- публічні хости SearXNG мають використовувати `https://`

## Змінна середовища

Задайте `SEARXNG_BASE_URL` як альтернативу конфігурації:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Коли `SEARXNG_BASE_URL` задано і явний provider не налаштовано, автовизначення
автоматично вибирає SearXNG (з найнижчим пріоритетом -- будь-який provider на основі API з
ключем перемагає першим).

## Довідник конфігурації Plugin

| Поле         | Опис                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| `baseUrl`    | Base URL вашого екземпляра SearXNG (обов’язково)                           |
| `categories` | Категорії, розділені комами, наприклад `general`, `news` або `science`     |
| `language`   | Код мови результатів, наприклад `en`, `de` або `fr`                        |

## Примітки

- **JSON API** -- використовує нативний endpoint `format=json` у SearXNG, а не HTML scraping
- **Без API-ключа** -- працює з будь-яким екземпляром SearXNG одразу
- **Валідація base URL** -- `baseUrl` має бути валідним URL `http://` або `https://`;
  публічні хости мають використовувати `https://`
- **Порядок автовизначення** -- SearXNG перевіряється останнім (порядок 200) в
  автовизначенні. Спочатку запускаються providers на основі API з налаштованими ключами,
  потім DuckDuckGo (порядок 100), потім Ollama Web Search (порядок 110)
- **Self-hosted** -- ви контролюєте екземпляр, запити й upstream search engines
- Категорії типово мають значення `general`, якщо не налаштовані

<Tip>
  Щоб JSON API SearXNG працював, переконайтеся, що у вашому екземплярі SearXNG увімкнено формат `json`
  у `settings.yml` в розділі `search.formats`.
</Tip>

## Пов’язане

- [Web Search overview](/uk/tools/web) -- усі providers і автовизначення
- [DuckDuckGo Search](/uk/tools/duckduckgo-search) -- ще один key-free fallback
- [Brave Search](/uk/tools/brave-search) -- структуровані результати з безкоштовним рівнем
