---
read_when:
    - Ви хочете використовувати розміщені моделі Ollama без локального сервера Ollama
    - Вам потрібен id, ключ або endpoint провайдера ollama-cloud
summary: Використовуйте Ollama Cloud безпосередньо з OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:12:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud — це розміщений API моделей від Ollama. Він дає OpenClaw змогу викликати моделі, розміщені в Ollama, напряму, без встановлення локального сервера Ollama або входу локального застосунку Ollama у хмарний режим. Використовуйте ідентифікатор постачальника `ollama-cloud` і посилання на моделі на кшталт `ollama-cloud/kimi-k2.6`.

Ця сторінка призначена для прямої маршрутизації лише через хмару. Постачальник використовує рідний стиль Ollama `/api/chat`, а не OpenAI-сумісний маршрут `/v1`. OpenClaw реєструє його як окремий ідентифікатор постачальника, щоб облікові дані лише для хмари, виявлення живого каталогу та вибір моделі не змішувалися з локальним хостом `ollama`.

Використовуйте цю сторінку, коли потрібна маршрутизація лише через хмару. Для локального Ollama, гібридної маршрутизації хмара-плюс-локально, embeddings і деталей власного хоста див. [Ollama](/uk/providers/ollama).

## Налаштування

Створіть API-ключ Ollama Cloud на [ollama.com/settings/keys](https://ollama.com/settings/keys), а потім виконайте:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Або задайте:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Типові значення

- Постачальник: `ollama-cloud`
- Базова URL-адреса: `https://ollama.com`
- Змінна середовища: `OLLAMA_API_KEY`
- Стиль API: рідний Ollama `/api/chat`
- Приклад моделі: `ollama-cloud/kimi-k2.6`

## Коли обирати Ollama Cloud

- Вам потрібні розміщені моделі Ollama без локального запуску `ollama serve`.
- Вам потрібна та сама рідна форма API чату Ollama, яку OpenClaw використовує для локального Ollama, але спрямована на `https://ollama.com`.
- Вам потрібен простий хмарний шлях для моделей, які вже є в розміщеному каталозі Ollama.
- Вам не потрібні локальні завантаження моделей, локальне керування GPU або інференс лише через LAN.

Натомість використовуйте [Ollama](/uk/providers/ollama), коли потрібна маршрутизація лише локально або хмара-плюс-локально через хост Ollama з виконаним входом. Використовуйте OpenAI-сумісного постачальника, коли потрібна семантика `/v1/chat/completions` або специфічні для постачальника OpenAI-стильові можливості.

## Моделі

OpenClaw виявляє моделі Ollama Cloud із живого розміщеного каталогу. Поширені доступні розміщені ідентифікатори включають:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Використовуйте ідентифікатор моделі з вашого поточного розміщеного каталогу:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Ідентифікатори моделей — це ідентифікатори хмарного каталогу, а не назви локального pull. Якщо назва моделі працює на локальному хості Ollama, але відсутня в розміщеному каталозі, натомість використовуйте постачальника `ollama` з цим локальним хостом.

## Живий тест

Для smoke-тестів Ollama Cloud з API-ключем спрямуйте живий тест Ollama на розміщену кінцеву точку та виберіть модель із вашого поточного каталогу:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Хмарний smoke-тест виконує текст, рідний stream і вебпошук. Він типово пропускає embeddings для `https://ollama.com`, тому що API-ключі Ollama Cloud можуть не авторизувати `/api/embed`.

## Усунення несправностей

- Помилки `Set OLLAMA_API_KEY`: надайте справжній хмарний API-ключ. Локальний маркер `ollama-local` призначений лише для локальних або приватних хостів Ollama.
- Помилки невідомої моделі: виконайте `openclaw models list --provider ollama-cloud` і точно скопіюйте ідентифікатор розміщеної моделі.
- Проблеми з викликами інструментів або сирим JSON на власних хостах Ollama: перевірте, чи випадково не використовується OpenAI-сумісна URL-адреса `/v1`. Маршрути Ollama мають використовувати рідну базову URL-адресу без суфікса `/v1`.

## Пов’язане

- [Ollama](/uk/providers/ollama)
- [Постачальники моделей](/uk/concepts/model-providers)
- [Усі постачальники](/uk/providers/index)
