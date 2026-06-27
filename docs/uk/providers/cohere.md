---
read_when:
    - Ви хочете використовувати Cohere з OpenClaw
    - Вам потрібна змінна середовища ключа API Cohere або вибір автентифікації CLI
summary: Налаштування Cohere (автентифікація + вибір моделі)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:09:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) надає OpenAI-сумісний інференс через свій Compatibility API. OpenClaw постачає провайдер Cohere під час переходу до екстерналізації, а також публікує його як офіційний зовнішній Plugin з каталогом моделей Command A.

| Властивість           | Значення                                           |
| --------------------- | -------------------------------------------------- |
| ID провайдера         | `cohere`                                           |
| Plugin                | вбудований під час переходу; офіційний зовнішній пакет |
| Змінна середовища автентифікації | `COHERE_API_KEY`                         |
| Прапорець онбордингу  | `--auth-choice cohere-api-key`                     |
| Прямий прапорець CLI  | `--cohere-api-key <key>`                           |
| API                   | OpenAI-сумісний (`openai-completions`)             |
| Базова URL-адреса     | `https://api.cohere.ai/compatibility/v1`           |
| Модель за замовчуванням | `cohere/command-a-03-2025`                       |

## Початок роботи

1. Cohere включено до поточних пакетів OpenClaw. Якщо він недоступний, установіть зовнішній пакет і перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Створіть API-ключ Cohere.
3. Запустіть онбординг:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Підтвердьте, що каталог доступний:

```bash
openclaw models list --provider cohere
```

Модель за замовчуванням установлюється лише тоді, коли основну модель ще не налаштовано.

## Налаштування лише через середовище

Зробіть `COHERE_API_KEY` доступною для процесу Gateway, а потім виберіть модель Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Якщо Gateway працює як демон або в Docker, налаштуйте `COHERE_API_KEY` для цієї служби. Експорт лише в інтерактивній оболонці не робить її доступною для Gateway, який уже працює.
</Note>

## Пов’язано

- [Провайдери моделей](/uk/concepts/model-providers)
- [CLI моделей](/uk/cli/models)
- [Каталог провайдерів](/uk/providers)
