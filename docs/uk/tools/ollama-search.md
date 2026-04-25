---
read_when:
    - Ви хочете використовувати Ollama для `web_search`
    - Ви хочете провайдера `web_search` без ключа
    - Вам потрібні вказівки з налаштування вебпошуку Ollama
summary: Вебпошук Ollama через ваш налаштований хост Ollama
title: вебпошук Ollama
x-i18n:
    generated_at: "2026-04-25T21:40:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`. Він
використовує API вебпошуку Ollama і повертає структуровані результати із заголовками, URL-адресами
та фрагментами.

На відміну від провайдера моделей Ollama, це налаштування типово не потребує API-ключа.
Однак воно потребує:

- хоста Ollama, доступного з OpenClaw
- `ollama signin`

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
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Якщо явний базовий URL Ollama не задано, OpenClaw використовує `http://127.0.0.1:11434`.

Якщо ваш хост Ollama очікує bearer-автентифікацію, OpenClaw повторно використовує
`models.providers.ollama.apiKey` (або відповідну автентифікацію провайдера з env)
також і для запитів вебпошуку.

## Примітки

- Для цього провайдера не потрібне окреме поле API-ключа для вебпошуку.
- Якщо хост Ollama захищено автентифікацією, OpenClaw повторно використовує звичайний
  API-ключ провайдера Ollama, якщо він наявний.
- Під час налаштування OpenClaw попереджає, якщо Ollama недоступний або вхід не виконано, але
  це не блокує вибір.
- Автовизначення під час виконання може перейти до Ollama Web Search, якщо не налаштовано
  жодного провайдера з вищим пріоритетом і обліковими даними.
- Провайдер використовує ендпоінт Ollama `/api/web_search`.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі провайдери та автовизначення
- [Ollama](/uk/providers/ollama) -- налаштування моделі Ollama та хмарний/локальний режими
