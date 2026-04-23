---
read_when:
    - Ви хочете використовувати Ollama для `web_search`
    - Вам потрібен provider `web_search` без ключів
    - Вам потрібні вказівки з налаштування Ollama Web Search
summary: Ollama Web Search через ваш налаштований хост Ollama
title: Веб-пошук Ollama
x-i18n:
    generated_at: "2026-04-23T21:16:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw підтримує **Ollama Web Search** як bundled provider для `web_search`.
Він використовує експериментальний API веб-пошуку Ollama і повертає структуровані результати
з назвами, URL і snippet-ами.

На відміну від provider-а моделей Ollama, ця конфігурація типово не потребує API key.
Натомість вона потребує:

- хоста Ollama, доступного з OpenClaw
- `ollama signin`

## Налаштування

<Steps>
  <Step title="Запустіть Ollama">
    Переконайтеся, що Ollama встановлено і запущено.
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

    Потім виберіть **Ollama Web Search** як provider.

  </Step>
</Steps>

Якщо ви вже використовуєте Ollama для моделей, Ollama Web Search повторно використовує той самий
налаштований хост.

## Config

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

Якщо явний base URL Ollama не задано, OpenClaw використовує `http://127.0.0.1:11434`.

Якщо ваш хост Ollama очікує bearer auth, OpenClaw повторно використовує
`models.providers.ollama.apiKey` (або відповідну auth provider-а з backing env)
також і для запитів веб-пошуку.

## Примітки

- Для цього provider-а не потрібне окреме поле API key для веб-пошуку.
- Якщо хост Ollama захищений auth, OpenClaw повторно використовує звичайний
  API key provider-а Ollama, якщо він є.
- Під час setup OpenClaw показує warning, якщо Ollama недоступний або в ньому не виконано sign in, але
  не блокує вибір.
- Runtime auto-detect може переходити до Ollama Web Search, коли не налаштовано провайдера з вищим пріоритетом і обліковими даними.
- Provider використовує експериментальний endpoint Ollama `/api/experimental/web_search`.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі provider-и й автоматичне виявлення
- [Ollama](/uk/providers/ollama) -- налаштування моделей Ollama і cloud/local modes
