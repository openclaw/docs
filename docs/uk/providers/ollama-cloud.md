---
read_when:
    - Ви хочете використовувати розміщені в хмарі моделі Ollama без локального сервера Ollama
    - Вам потрібен ідентифікатор, ключ або кінцева точка провайдера ollama-cloud
summary: Використовуйте Ollama Cloud безпосередньо з OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T13:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud — це розміщений у хмарі API моделей від Ollama. Провайдер `ollama-cloud` звертається до нього
безпосередньо за адресою `https://ollama.com` через нативний API Ollama `/api/chat`, без
локального сервера Ollama та без локального застосунку Ollama, у якому виконано вхід у хмарний режим. Використовуйте посилання
на моделі на кшталт `ollama-cloud/kimi-k2.6`.

OpenClaw реєструє `ollama-cloud` як окремий ідентифікатор провайдера, щоб облікові дані,
призначені лише для хмари, динамічне виявлення каталогу та вибір моделей не змішувалися
з локальним хостом `ollama`. Відомості про локальний Ollama, гібридну маршрутизацію між хмарою
та локальним середовищем, вбудовування й налаштування власного хоста див. у розділі [Ollama](/uk/providers/ollama).

## Налаштування

Створіть ключ API Ollama Cloud на сторінці [ollama.com/settings/keys](https://ollama.com/settings/keys), а потім виконайте:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Або задайте:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

У неінтерактивному початковому налаштуванні ключ можна передати безпосередньо:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

Початкове налаштування встановлює моделлю за замовчуванням `ollama-cloud/kimi-k2.5:cloud`.

## Значення за замовчуванням

- Провайдер: `ollama-cloud`
- Базова URL-адреса: `https://ollama.com`
- Змінна середовища: `OLLAMA_API_KEY`
- Стиль API: нативний API Ollama `/api/chat`
- Модель за замовчуванням під час початкового налаштування: `ollama-cloud/kimi-k2.5:cloud`

## Коли варто вибрати Ollama Cloud

- Вам потрібні розміщені в хмарі моделі Ollama без локального запуску `ollama serve`.
- Вам потрібна та сама нативна структура API чату Ollama, яку OpenClaw використовує для локального
  Ollama, але з адресою `https://ollama.com`.
- Вам потрібен простий хмарний доступ до моделей, які вже є в розміщеному
  каталозі Ollama.
- Вам не потрібні локальне завантаження моделей, локальне керування GPU або виконання інференсу лише в локальній мережі.

Натомість використовуйте [Ollama](/uk/providers/ollama), якщо вам потрібна суто локальна
або хмарно-локальна маршрутизація через хост Ollama, у якому виконано вхід. Використовуйте
OpenAI-сумісного провайдера, якщо вам потрібна семантика `/v1/chat/completions`
або специфічні для провайдера можливості в стилі OpenAI.

## Моделі

Провайдер потребує ключа API; без нього він залишається неактивним. За наявності ключа
OpenClaw динамічно виявляє моделі Ollama Cloud у розміщеному каталозі:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Розміщені ідентифікатори в актуальному каталозі включають `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` і `minimax-m2.7`. Якщо динамічне виявлення не повертає
нічого, OpenClaw використовує резервні вбудовані записи `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` і `glm-5.2:cloud`.

Ідентифікатори моделей — це ідентифікатори хмарного каталогу, а не назви для локального завантаження. Якщо назва моделі працює
на локальному хості Ollama, але відсутня в розміщеному каталозі, натомість використовуйте провайдер `ollama`
із цим локальним хостом.

## Перевірка в реальному середовищі

Для базових перевірок Ollama Cloud із ключем API спрямуйте перевірку Ollama в реальному середовищі на розміщену
кінцеву точку та виберіть модель зі свого поточного каталогу:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Хмарна базова перевірка тестує текст, нативне потокове передавання та вебпошук; задайте
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`, щоб пропустити вебпошук. За замовчуванням вона пропускає вбудовування
для `https://ollama.com`, оскільки ключі API Ollama Cloud можуть не надавати
доступ до `/api/embed`; примусово ввімкніть їх за допомогою `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Усунення несправностей

- Помилки `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: надайте
  справжній ключ хмарного API. Маркер `ollama-local` призначений лише для локальних або
  приватних хостів Ollama.
- Помилки невідомої моделі: виконайте `openclaw models list --provider ollama-cloud` і
  точно скопіюйте ідентифікатор розміщеної моделі.
- Проблеми з викликами інструментів або необробленим JSON на власних хостах Ollama: перевірте, чи ви
  випадково не використовуєте OpenAI-сумісну URL-адресу `/v1`. Маршрути Ollama мають використовувати
  нативну базову URL-адресу без суфікса `/v1`.

## Пов’язані матеріали

- [Ollama](/uk/providers/ollama)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Усі провайдери](/uk/providers/index)
