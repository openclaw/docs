---
read_when:
    - Ви хочете використовувати Hugging Face Inference з OpenClaw
    - Вам потрібна змінна середовища HF token або вибір автентифікації CLI
summary: Налаштування Hugging Face Inference (auth + вибір моделі)
title: Hugging Face (inference)
x-i18n:
    generated_at: "2026-04-23T21:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
---

[Провайдери Hugging Face Inference](https://huggingface.co/docs/inference-providers) надають OpenAI-compatible chat completions через єдиний router API. Ви отримуєте доступ до багатьох моделей (DeepSeek, Llama та інших) з одним токеном. OpenClaw використовує **OpenAI-compatible endpoint** (лише chat completions); для text-to-image, embeddings або speech використовуйте [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) напряму.

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN` (fine-grained token з дозволом **Make calls to Inference Providers**)
- API: OpenAI-compatible (`https://router.huggingface.co/v1`)
- Billing: один HF token; [pricing](https://huggingface.co/docs/inference-providers/pricing) відповідає тарифам провайдера з безкоштовним рівнем.

## Початок роботи

<Steps>
  <Step title="Створіть fine-grained token">
    Перейдіть до [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) і створіть новий fine-grained token.

    <Warning>
    У токена має бути ввімкнено дозвіл **Make calls to Inference Providers**, інакше API-запити буде відхилено.
    </Warning>

  </Step>
  <Step title="Запустіть onboarding">
    Виберіть **Hugging Face** у списку провайдерів, а потім введіть свій API key, коли буде запитано:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Виберіть типову модель">
    У списку **Default Hugging Face model** виберіть потрібну модель. Список завантажується з Inference API, коли у вас є валідний токен; інакше показується вбудований список. Ваш вибір зберігається як типова модель.

    Ви також можете задати або змінити типову модель пізніше в конфігурації:

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
  <Step title="Переконайтеся, що модель доступна">
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

Це встановить `huggingface/deepseek-ai/DeepSeek-R1` як типову модель.

## ID моделей

Model ref мають формат `huggingface/<org>/<model>` (ідентифікатори у стилі Hub). Список нижче отримано з **GET** `https://router.huggingface.co/v1/models`; у вашому каталозі може бути більше.

| Model                  | Ref (prefix with `huggingface/`)    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
Ви можете додати `:fastest` або `:cheapest` до будь-якого ID моделі. Задайте типовий порядок у [налаштуваннях Inference Provider](https://hf.co/settings/inference-providers); див. [Inference Providers](https://huggingface.co/docs/inference-providers) і **GET** `https://router.huggingface.co/v1/models` для повного списку.
</Tip>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Discovery моделей і список onboarding">
    OpenClaw виявляє моделі, викликаючи **Inference endpoint напряму**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Необов’язково: передайте `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` або `$HF_TOKEN`, щоб отримати повний список; деякі endpoint-и повертають лише підмножину без auth.) Відповідь має стиль OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Коли ви налаштовуєте API key Hugging Face (через onboarding, `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`), OpenClaw використовує цей GET для виявлення доступних моделей chat completion. Під час **інтерактивного setup**, після введення токена ви бачите список **Default Hugging Face model**, заповнений із цього списку (або з вбудованого каталогу, якщо запит завершується помилкою). Під час runtime (наприклад під час запуску Gateway), коли ключ наявний, OpenClaw знову викликає **GET** `https://router.huggingface.co/v1/models`, щоб оновити каталог. Список об’єднується з вбудованим каталогом (для metadata на кшталт context window і cost). Якщо запит завершується помилкою або ключ не задано, використовується лише вбудований каталог.

  </Accordion>

  <Accordion title="Назви моделей, alias-и та policy suffix-и">
    - **Name from API:** display name моделі **гідратується з GET /v1/models**, коли API повертає `name`, `title` або `display_name`; інакше він виводиться з ID моделі (наприклад `deepseek-ai/DeepSeek-R1` стає "DeepSeek R1").
    - **Override display name:** ви можете задати custom label для кожної моделі в конфігурації, щоб вона відображалася в CLI та UI так, як вам потрібно:

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

    - **Policy suffixes:** вбудована документація та helper-и Hugging Face в OpenClaw наразі трактують ці два suffix як вбудовані policy-варіанти:
      - **`:fastest`** — найвища пропускна здатність.
      - **`:cheapest`** — найнижча вартість за output token.

      Ви можете додавати їх як окремі записи в `models.providers.huggingface.models` або задавати `model.primary` із цим suffix. Ви також можете встановити типовий порядок провайдерів у [налаштуваннях Inference Provider](https://hf.co/settings/inference-providers) (без suffix = використовувати цей порядок).

    - **Config merge:** наявні записи в `models.providers.huggingface.models` (наприклад у `models.json`) зберігаються під час merge конфігурації. Тож будь-які custom `name`, `alias` або параметри моделі, які ви там задасте, буде збережено.

  </Accordion>

  <Accordion title="Середовище й налаштування демона">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN` доступний цьому процесу (наприклад у `~/.openclaw/.env` або через `env.shellEnv`).

    <Note>
    OpenClaw приймає і `HUGGINGFACE_HUB_TOKEN`, і `HF_TOKEN` як alias-и env var. Працює будь-який з них; якщо задано обидва, перевагу має `HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація: DeepSeek R1 з fallback до Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Конфігурація: Qwen з варіантами cheapest і fastest">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Конфігурація: DeepSeek + Llama + GPT-OSS з alias-ами">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Конфігурація: Кілька Qwen і DeepSeek із policy suffix-ами">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір провайдера моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, model ref і поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Документація Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Офіційна документація Hugging Face Inference Providers.
  </Card>
  <Card title="Налаштування" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
