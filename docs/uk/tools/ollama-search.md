---
read_when:
    - Ви хочете використовувати Ollama для web_search
    - Вам потрібен провайдер web_search без ключа
    - Ви хочете використовувати хмарний вебпошук Ollama з OLLAMA_API_KEY
    - Вам потрібні вказівки з налаштування вебпошуку Ollama
summary: Вебпошук Ollama через локальний хост Ollama або розміщений API Ollama
title: Вебпошук Ollama
x-i18n:
    generated_at: "2026-07-12T13:52:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`,
що повертає заголовки, URL-адреси та фрагменти з API вебпошуку Ollama.

Для локального Ollama або Ollama із самостійним хостингом за замовчуванням ключ API не потрібен; необхідні доступний
хост Ollama та виконання `ollama signin`. Для прямого пошуку через хмарний сервіс (без локального Ollama) потрібні
`baseUrl: "https://ollama.com"` і справжній `OLLAMA_API_KEY`.

## Налаштування

<Steps>
  <Step title="Запустіть Ollama">
    Переконайтеся, що Ollama встановлено й запущено.
  </Step>
  <Step title="Увійдіть">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Виберіть Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Виберіть **Ollama Web Search** як провайдера.

  </Step>
</Steps>

Якщо ви вже використовуєте Ollama для моделей, Ollama Web Search повторно використовує той самий
налаштований хост.

<Note>
  OpenClaw ніколи автоматично не вибирає Ollama Web Search замість провайдера
  з обліковими даними, який має вищий пріоритет; його потрібно вибрати явно за допомогою
  `tools.web.search.provider: "ollama"`.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Необов’язкове перевизначення хоста, що застосовується лише до вебпошуку:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Або повторно використайте хост, уже налаштований для провайдера моделей Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` — канонічний ключ; провайдер вебпошуку
також приймає там `baseURL` для сумісності з прикладами конфігурації
у стилі OpenAI SDK. Якщо нічого не задано, OpenClaw за замовчуванням використовує
`http://127.0.0.1:11434`.

Прямий пошук Ollama Web Search через хмарний сервіс (без локального Ollama):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Автентифікація та маршрутизація запитів

- Окремого поля ключа API для вебпошуку немає; провайдер повторно використовує
  `models.providers.ollama.apiKey` (або відповідну автентифікацію провайдера на основі змінних середовища),
  коли налаштований хост захищено автентифікацією.
- Порядок визначення хоста: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (або `baseURL`) → `http://127.0.0.1:11434`.
- Якщо визначений хост — `https://ollama.com`, OpenClaw безпосередньо викликає
  `https://ollama.com/api/web_search`, використовуючи ключ API для автентифікації
  за схемою Bearer.
- В іншому разі OpenClaw спочатку викликає кінцеву точку локального проксі
  `/api/experimental/web_search` (яка підписує та пересилає запит до Ollama
  Cloud), а потім у разі невдачі використовує `/api/web_search` на тому самому хості. Якщо обидва виклики завершуються
  невдало й задано `OLLAMA_API_KEY`, OpenClaw один раз повторює запит до
  `https://ollama.com/api/web_search` із цим ключем, не надсилаючи його
  локальному хосту.
- OpenClaw попереджає під час налаштування, якщо Ollama недоступний або вхід
  не виконано, але не блокує вибір провайдера.

## Пов’язані матеріали

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери та автоматичне виявлення
- [Ollama](/uk/providers/ollama) -- налаштування моделей Ollama та хмарний/локальний режими
