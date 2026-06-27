---
read_when:
    - Ви хочете використовувати Ollama для web_search
    - Вам потрібен провайдер web_search без ключа
    - Ви хочете використовувати розміщений Ollama Web Search з OLLAMA_API_KEY
    - Вам потрібні вказівки з налаштування Ollama Web Search
summary: Ollama Web Search через локальний хост Ollama або розміщений Ollama API
title: Вебпошук Ollama
x-i18n:
    generated_at: "2026-06-27T18:27:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`. Він
використовує API вебпошуку Ollama та повертає структуровані результати із заголовками, URL-адресами
та фрагментами.

Для локального або самостійно розгорнутого Ollama це налаштування за замовчуванням не потребує API-ключа.
Воно потребує:

- хост Ollama, доступний з OpenClaw
- `ollama signin`

Для прямого хостованого пошуку задайте базову URL-адресу провайдера Ollama як `https://ollama.com`
і надайте справжній `OLLAMA_API_KEY`.

## Налаштування

<Steps>
  <Step title="Запустіть Ollama">
    Переконайтеся, що Ollama встановлено й запущено.
  </Step>
  <Step title="Увійдіть">
    Виконайте:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Виберіть Ollama Web Search">
    Виконайте:

    ```bash
    openclaw configure --section web
    ```

    Потім виберіть **Ollama Web Search** як провайдера.

  </Step>
</Steps>

Якщо ви вже використовуєте Ollama для моделей, Ollama Web Search повторно використовує той самий
налаштований хост.

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

Необов’язкове перевизначення хоста Ollama:

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

Якщо ви вже налаштовуєте Ollama як провайдер моделей, провайдер вебпошуку може
натомість повторно використати цей хост:

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

Провайдер моделей Ollama використовує `baseUrl` як канонічний ключ. Провайдер вебпошуку також підтримує `baseURL` у `models.providers.ollama` для сумісності з прикладами конфігурації в стилі OpenAI SDK.

Якщо явну базову URL-адресу Ollama не задано, OpenClaw використовує `http://127.0.0.1:11434`.

Якщо ваш хост Ollama очікує bearer-автентифікацію, OpenClaw повторно використовує
`models.providers.ollama.apiKey` (або відповідну автентифікацію провайдера на основі змінних середовища)
для запитів до цього налаштованого хоста.

Безпосередній розміщений вебпошук Ollama:

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

## Примітки

- Для цього провайдера не потрібне окреме поле ключа API для вебпошуку.
- Якщо хост Ollama захищено автентифікацією, OpenClaw повторно використовує звичайний
  ключ API провайдера Ollama, коли він наявний.
- Якщо `baseUrl` дорівнює `https://ollama.com`, OpenClaw безпосередньо викликає
  `https://ollama.com/api/web_search` і надсилає налаштований ключ API Ollama
  як bearer-автентифікацію.
- Якщо налаштований хост не надає вебпошук і `OLLAMA_API_KEY` задано,
  OpenClaw може виконати резервний перехід до `https://ollama.com/api/web_search`, не надсилаючи
  цей ключ зі змінної середовища на локальний хост.
- OpenClaw попереджає під час налаштування, якщо Ollama недоступна або вхід не виконано, але
  не блокує вибір.
- OpenClaw не вибирає Ollama Web Search автоматично, коли не налаштовано
  провайдера з обліковими даними з вищим пріоритетом; виберіть його явно за допомогою
  `tools.web.search.provider: "ollama"`.
- Локальні хости демона Ollama використовують локальну кінцеву точку проксі
  `/api/experimental/web_search`, яка підписує запити та пересилає їх до Ollama Cloud.
- Хости `https://ollama.com` безпосередньо використовують публічну розміщену кінцеву точку
  `/api/web_search` з bearer-автентифікацією ключем API.

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі провайдери та автовиявлення
- [Ollama](/uk/providers/ollama) -- налаштування моделей Ollama та хмарний/локальний режими
