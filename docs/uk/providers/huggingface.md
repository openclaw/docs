---
read_when:
    - Ви хочете використовувати Hugging Face Inference з OpenClaw
    - Вам потрібна змінна середовища токена HF або вибір автентифікації через CLI
summary: Налаштування Hugging Face Inference (автентифікація + вибір моделі)
title: Hugging Face (інференс)
x-i18n:
    generated_at: "2026-07-12T13:41:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Постачальники інференсу Hugging Face](https://huggingface.co/docs/inference-providers) надають сумісний з OpenAI маршрутизатор завершень чату для багатьох розміщених моделей (DeepSeek, Llama та інших) з одним токеном. OpenClaw взаємодіє **лише з кінцевою точкою завершень чату**; для перетворення тексту на зображення, векторних представлень або мовлення використовуйте безпосередньо [клієнти інференсу HF](https://huggingface.co/docs/api-inference/quicktour).

| Властивість               | Значення                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Ідентифікатор постачальника | `huggingface`                                                                                                                       |
| Plugin                    | вбудований (увімкнений за замовчуванням, встановлення не потрібне)                                                                  |
| Змінна середовища автентифікації | `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN` (токен із детальними дозволами)                                                        |
| API                       | сумісний з OpenAI (`https://router.huggingface.co/v1`)                                                                               |
| Оплата                    | Єдиний токен HF; [ціни](https://huggingface.co/docs/inference-providers/pricing) відповідають тарифам постачальника й передбачають безкоштовний рівень |

## Початок роботи

<Steps>
  <Step title="Створіть токен із детальними дозволами">
    Перейдіть до [налаштувань токенів Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) і створіть новий токен із детальними дозволами.

    <Warning>
    Для токена має бути ввімкнено дозвіл **Make calls to Inference Providers**, інакше запити до API буде відхилено.
    </Warning>

  </Step>
  <Step title="Запустіть початкове налаштування">
    Виберіть **Hugging Face** у розкривному списку постачальників, а потім введіть ключ API, коли з’явиться відповідний запит:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Виберіть модель за замовчуванням">
    У розкривному списку **Default Hugging Face model** виберіть модель. Якщо токен дійсний, список завантажується з Inference API; інакше OpenClaw показує наведений нижче вбудований каталог. Ваш вибір зберігається в `agents.defaults.model.primary`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Установлює `huggingface/deepseek-ai/DeepSeek-R1` як модель за замовчуванням.

## Ідентифікатори моделей

Посилання на моделі мають формат `huggingface/<org>/<model>` (ідентифікатори у стилі Hub). Вбудований каталог OpenClaw:

| Модель                       | Посилання (із префіксом `huggingface/`)   |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
Якщо токен дійсний, OpenClaw також виявляє будь-які інші моделі за допомогою запиту **GET** до `https://router.huggingface.co/v1/models` під час початкового налаштування та запуску Gateway, тому ваш каталог може містити значно більше моделей, ніж чотири наведені вище. До ідентифікатора будь-якої моделі можна додати `:fastest` або `:cheapest`; маршрутизатор HF скерує запит до відповідного постачальника інференсу. Задайте порядок постачальників за замовчуванням у [налаштуваннях постачальників інференсу](https://hf.co/settings/inference-providers).
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Виявлення моделей і розкривний список початкового налаштування">
    OpenClaw виявляє моделі за допомогою:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # або $HF_TOKEN
    ```

    Відповідь має формат OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    За наявності налаштованого ключа (через початкове налаштування, `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`) розкривний список **Default Hugging Face model** під час інтерактивного налаштування заповнюється з цієї кінцевої точки. Під час запуску Gateway той самий виклик повторюється для оновлення каталогу. Виявлені моделі об’єднуються з наведеним вище вбудованим каталогом (який використовується для метаданих, як-от розмір контекстного вікна та вартість, якщо ідентифікатор збігається). Якщо запит завершується невдало, не повертає даних або ключ не задано, OpenClaw використовує лише вбудований каталог.

    Щоб вимкнути виявлення, не видаляючи постачальника:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Назви моделей, псевдоніми та суфікси політик">
    - **Назва з API:** виявлені моделі використовують значення `name`, `title` або `display_name` з API, якщо воно наявне; інакше OpenClaw формує назву з ідентифікатора моделі (наприклад, `deepseek-ai/DeepSeek-R1` перетворюється на «DeepSeek R1»).
    - **Перевизначення відображуваної назви:** задайте власну мітку для кожної моделі в конфігурації:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Суфікси політик:** `:fastest` і `:cheapest` — це домовленості маршрутизатора HF, а не значення, які переписує OpenClaw: суфікс надсилається без змін як частина ідентифікатора моделі, а маршрутизатор HF вибирає відповідного постачальника інференсу. Додайте кожен варіант як окремий запис у `models.providers.huggingface.models` (або в `model.primary`), якщо для кожного суфікса потрібен окремий псевдонім.
    - **Об’єднання конфігурації:** наявні записи в `models.providers.huggingface.models` (наприклад, у `models.json`) зберігаються під час об’єднання конфігурації, тому всі задані там власні значення `name`, `alias` або параметри моделі зберігаються після перезапусків.

  </Accordion>

  <Accordion title="Налаштування середовища та фонової служби">
    Якщо Gateway працює як фонова служба (launchd/systemd), переконайтеся, що `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN` доступна цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

    <Note>
    OpenClaw приймає як `HUGGINGFACE_HUB_TOKEN`, так і `HF_TOKEN`. Якщо задано обидві змінні, пріоритет має `HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація: DeepSeek R1 із резервною моделлю">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Конфігурація: DeepSeek із найдешевшим і найшвидшим варіантами">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Конфігурація: DeepSeek + Llama + GPT-OSS із псевдонімами">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки перемикання на резервні моделі.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Документація постачальників інференсу" href="https://huggingface.co/docs/inference-providers" icon="book">
    Офіційна документація постачальників інференсу Hugging Face.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
