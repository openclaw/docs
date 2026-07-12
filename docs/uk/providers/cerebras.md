---
read_when:
    - Ви хочете використовувати Cerebras з OpenClaw
    - Вам потрібна змінна середовища з API-ключем Cerebras або вибір автентифікації через CLI
summary: Налаштування Cerebras (автентифікація + вибір моделі)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T13:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) забезпечує високошвидкісний, сумісний з OpenAI інференс на спеціалізованому обладнанні для інференсу. Plugin постачається зі статичним каталогом із чотирьох моделей (без динамічного виявлення).

| Властивість                   | Значення                                                  |
| ----------------------------- | --------------------------------------------------------- |
| Ідентифікатор постачальника   | `cerebras`                                                |
| Plugin                        | офіційний зовнішній пакет (`@openclaw/cerebras-provider`) |
| Змінна середовища авторизації | `CEREBRAS_API_KEY`                                        |
| Прапорець початкового налаштування | `--auth-choice cerebras-api-key`                     |
| Прямий прапорець CLI          | `--cerebras-api-key <key>`                                |
| API                           | сумісний з OpenAI (`openai-completions`)                  |
| Базова URL-адреса             | `https://api.cerebras.ai/v1`                              |
| Модель за замовчуванням       | `cerebras/zai-glm-4.7`                                    |

## Установлення Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API в [консолі Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Запустіть початкове налаштування">
    <CodeGroup>

```bash Початкове налаштування
openclaw onboard --auth-choice cerebras-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Лише змінна середовища
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Перевірте доступність моделей">
    ```bash
    openclaw models list --provider cerebras
    ```

    Виводить усі чотири статичні моделі. Якщо значення `CEREBRAS_API_KEY` не вдається визначити, `openclaw models status --json` повідомляє про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Вбудований каталог

Усі чотири моделі мають контекстне вікно на 128 тис. токенів і максимальний обсяг виводу 8 192 токени.

| Посилання на модель                       | Назва                | Міркування | Примітки                                      |
| ----------------------------------------- | -------------------- | ---------- | --------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | так        | Модель за замовчуванням; попередня модель міркування |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | так        | Продукційна модель міркування                  |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ні         | Попередня модель без міркування                |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | ні         | Продукційна модель, оптимізована для швидкості |

<Warning>
Cerebras позначає `zai-glm-4.7` і `qwen-3-235b-a22b-instruct-2507` як попередні моделі, а припинення підтримки `llama3.1-8b` і `qwen-3-235b-a22b-instruct-2507` задокументовано на 27 травня 2026 року. Перш ніж покладатися на них у продукційних робочих навантаженнях, перевірте [сторінку підтримуваних моделей](https://inference-docs.cerebras.ai/models/overview) Cerebras.
</Warning>

## Налаштування вручну

Для більшості конфігурацій потрібен лише ключ API. Використовуйте явну конфігурацію `models.providers.cerebras`, щоб перевизначити метадані моделей або працювати в режимі `mode: "merge"` зі статичним каталогом:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Якщо Gateway працює як фоновий процес (launchd, systemd, Docker), переконайтеся, що `CEREBRAS_API_KEY` доступна цьому процесу — наприклад, у `~/.openclaw/.env` або через `env.shellEnv`. Ключ, експортований лише в інтерактивній оболонці, не допоможе керованій службі, якщо середовище не імпортовано окремо.
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання в разі відмови.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні інтенсивності міркування для двох моделей Cerebras із підтримкою міркування.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Значення агентів за замовчуванням і конфігурація моделей.
  </Card>
  <Card title="Поширені запитання про моделі" href="/uk/help/faq-models" icon="circle-question">
    Профілі авторизації, перемикання моделей і усунення помилок «no profile».
  </Card>
</CardGroup>
