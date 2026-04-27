---
read_when:
    - Ви хочете використовувати Ollama для `web_search`
    - Вам потрібен постачальник `web_search` без ключа
    - Ви хочете використовувати розміщений вебпошук Ollama з `OLLAMA_API_KEY`
    - Вам потрібні вказівки з налаштування вебпошуку Ollama
summary: Вебпошук Ollama через локальний хост Ollama або розміщений API Ollama
title: вебпошук Ollama
x-i18n:
    generated_at: "2026-04-27T01:11:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c20b2405dab06f091ed636a8cc1f5e85a2f9e7ac62489db28c8f9ec9fee8357
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw підтримує **вебпошук Ollama** як вбудованого постачальника `web_search`. Він
використовує API вебпошуку Ollama і повертає структуровані результати із заголовками, URL-адресами
та фрагментами.

Для локального або самостійно розгорнутого Ollama це налаштування
типово не потребує API-ключа. Проте потрібні:

- хост Ollama, до якого OpenClaw має доступ
- `ollama signin`

Для прямого розміщеного пошуку встановіть базову URL-адресу постачальника Ollama на `https://ollama.com`
і вкажіть справжній `OLLAMA_API_KEY`.

## Налаштування

<Steps>
  <Step title="Запустіть Ollama">
    Переконайтеся, що Ollama встановлено та запущено.
  </Step>
  <Step title="Увійдіть">
    Виконайте:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Виберіть вебпошук Ollama">
    Виконайте:

    ```bash
    openclaw configure --section web
    ```

    Потім виберіть **вебпошук Ollama** як постачальника.

  </Step>
</Steps>

Якщо ви вже використовуєте Ollama для моделей, вебпошук Ollama повторно
використовує той самий налаштований хост.

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

Якщо ви вже налаштували Ollama як постачальника моделей, постачальник вебпошуку
може повторно використовувати цей хост:

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

Якщо явну базову URL-адресу Ollama не встановлено, OpenClaw використовує `http://127.0.0.1:11434`.

Якщо ваш хост Ollama очікує bearer-автентифікацію, OpenClaw повторно використовує
`models.providers.ollama.apiKey` (або відповідну автентифікацію постачальника, під’єднану через env)
для запитів до цього налаштованого хоста.

Прямий розміщений вебпошук Ollama:

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

- Для цього постачальника не потрібне окреме поле API-ключа саме для вебпошуку.
- Якщо хост Ollama захищений автентифікацією, OpenClaw повторно використовує звичайний
  API-ключ постачальника Ollama, якщо він наявний.
- Якщо `baseUrl` має значення `https://ollama.com`, OpenClaw викликає
  `https://ollama.com/api/web_search` безпосередньо та надсилає налаштований API-ключ Ollama
  як bearer-автентифікацію.
- Якщо налаштований хост не надає вебпошук і встановлено `OLLAMA_API_KEY`,
  OpenClaw може повернутися до `https://ollama.com/api/web_search`, не надсилаючи
  цей env-ключ на локальний хост.
- OpenClaw попереджає під час налаштування, якщо Ollama недоступний або в нього не виконано вхід,
  але це не блокує вибір.
- Автовиявлення під час виконання може переключитися на вебпошук Ollama, якщо не налаштовано
  жодного постачальника з вищим пріоритетом і обліковими даними.
- Локальні хости демона Ollama використовують локальну проксі-кінцеву точку
  `/api/experimental/web_search`, яка підписує та пересилає запити до Ollama Cloud.
- Хости `https://ollama.com` використовують публічну розміщену кінцеву точку
  `/api/web_search` безпосередньо з bearer-автентифікацією через API-ключ.

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі постачальники та автовиявлення
- [Ollama](/uk/providers/ollama) -- налаштування моделей Ollama та хмарний/локальний режими
