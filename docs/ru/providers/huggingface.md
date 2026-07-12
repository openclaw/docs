---
read_when:
    - Вы хотите использовать Hugging Face Inference с OpenClaw
    - Вам нужна переменная окружения с токеном HF или выбор аутентификации через CLI
summary: Настройка Hugging Face Inference (аутентификация и выбор модели)
title: Hugging Face (инференс)
x-i18n:
    generated_at: "2026-07-12T11:47:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Провайдеры инференса Hugging Face](https://huggingface.co/docs/inference-providers) предоставляют совместимый с OpenAI маршрутизатор завершений чата для множества размещённых моделей (DeepSeek, Llama и других), доступных по одному токену. OpenClaw взаимодействует **только с конечной точкой завершений чата**; для преобразования текста в изображения, создания эмбеддингов или работы с речью используйте напрямую [клиенты инференса HF](https://huggingface.co/docs/api-inference/quicktour).

| Свойство                      | Значение                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Идентификатор провайдера      | `huggingface`                                                                                                                          |
| Plugin                        | встроенный (включён по умолчанию, установка не требуется)                                                                              |
| Переменная окружения для аутентификации | `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN` (токен с детализированными разрешениями)                                                |
| API                           | совместимый с OpenAI (`https://router.huggingface.co/v1`)                                                                               |
| Оплата                        | единый токен HF; [цены](https://huggingface.co/docs/inference-providers/pricing) соответствуют тарифам провайдера и включают бесплатный уровень |

## Начало работы

<Steps>
  <Step title="Create a fine-grained token">
    Перейдите на страницу [токенов в настройках Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) и создайте новый токен с детализированными разрешениями.

    <Warning>
    Для токена должно быть включено разрешение **Make calls to Inference Providers**, иначе запросы к API будут отклонены.
    </Warning>

  </Step>
  <Step title="Run onboarding">
    Выберите **Hugging Face** в раскрывающемся списке провайдеров, затем при появлении запроса введите ключ API:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    В раскрывающемся списке **Модель Hugging Face по умолчанию** выберите модель. Если токен действителен, список загружается из Inference API; в противном случае OpenClaw отображает приведённый ниже встроенный каталог. Ваш выбор сохраняется в `agents.defaults.model.primary`:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Неинтерактивная настройка

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Устанавливает `huggingface/deepseek-ai/DeepSeek-R1` в качестве модели по умолчанию.

## Идентификаторы моделей

Ссылки на модели имеют формат `huggingface/<org>/<model>` (идентификаторы в стиле Hub). Встроенный каталог OpenClaw:

| Модель                        | Ссылка (с префиксом `huggingface/`)     |
| ----------------------------- | --------------------------------------- |
| DeepSeek R1                   | `deepseek-ai/DeepSeek-R1`               |
| DeepSeek V3.1                 | `deepseek-ai/DeepSeek-V3.1`             |
| GPT-OSS 120B                  | `openai/gpt-oss-120b`                   |
| Llama 3.3 70B Instruct Turbo  | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
Если токен действителен, OpenClaw также обнаруживает все другие модели через запрос **GET** к `https://router.huggingface.co/v1/models` во время первоначальной настройки и запуска Gateway, поэтому каталог может содержать значительно больше четырёх перечисленных выше моделей. К идентификатору любой модели можно добавить `:fastest` или `:cheapest`; маршрутизатор HF направит запрос соответствующему провайдеру инференса. Задайте порядок провайдеров по умолчанию в [Inference Provider settings](https://hf.co/settings/inference-providers).
</Tip>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw обнаруживает модели с помощью следующего запроса:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # или $HF_TOKEN
    ```

    Ответ имеет формат OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Если ключ настроен во время первоначальной настройки либо через `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN`, раскрывающийся список **Модель Hugging Face по умолчанию** при интерактивной настройке заполняется данными из этой конечной точки. При запуске Gateway тот же запрос выполняется повторно для обновления каталога. Обнаруженные модели объединяются с приведённым выше встроенным каталогом, который используется для метаданных, таких как размер контекстного окна и стоимость, если идентификатор совпадает. Если запрос завершается ошибкой, не возвращает данных или ключ не задан, OpenClaw использует только встроенный каталог.

    Чтобы отключить обнаружение, не удаляя провайдера:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **Название из API:** для обнаруженных моделей используется значение `name`, `title` или `display_name` из API, если оно присутствует; в противном случае OpenClaw формирует название из идентификатора модели (например, `deepseek-ai/DeepSeek-R1` преобразуется в «DeepSeek R1»).
    - **Переопределение отображаемого названия:** задайте собственную метку для каждой модели в конфигурации:

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

    - **Суффиксы политик:** `:fastest` и `:cheapest` — это соглашения маршрутизатора HF, а не преобразования OpenClaw: суффикс отправляется без изменений как часть идентификатора модели, после чего маршрутизатор HF выбирает соответствующего провайдера инференса. Если для каждого суффикса нужен отдельный псевдоним, добавьте каждый вариант как отдельную запись в `models.providers.huggingface.models` (или в `model.primary`).
    - **Объединение конфигурации:** существующие записи в `models.providers.huggingface.models` (например, в `models.json`) сохраняются при объединении конфигурации, поэтому заданные там пользовательские значения `name`, `alias` и параметры модели сохраняются после перезапусков.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN` доступна этому процессу (например, через `~/.openclaw/.env` или `env.shellEnv`).

    <Note>
    OpenClaw принимает как `HUGGINGFACE_HUB_TOKEN`, так и `HF_TOKEN`. Если заданы обе переменные, приоритет имеет `HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
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

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
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

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
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

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Model selection" href="/ru/concepts/models" icon="brain">
    Выбор и настройка моделей.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Официальная документация по провайдерам инференса Hugging Face.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
</CardGroup>
