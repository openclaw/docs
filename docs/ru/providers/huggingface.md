---
read_when:
    - Вы хотите использовать Hugging Face Inference с OpenClaw
    - Вам нужна переменная окружения с токеном HF или вариант аутентификации через CLI
summary: Настройка Hugging Face Inference (аутентификация и выбор модели)
title: Hugging Face (инференс)
x-i18n:
    generated_at: "2026-07-13T20:12:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Провайдеры инференса Hugging Face](https://huggingface.co/docs/inference-providers) предоставляют совместимый с OpenAI маршрутизатор завершений чата для множества размещённых моделей (DeepSeek, Llama и других), доступных по одному токену. OpenClaw взаимодействует **только с конечной точкой завершений чата**; для преобразования текста в изображение, создания эмбеддингов или синтеза речи используйте напрямую [клиенты инференса HF](https://huggingface.co/docs/api-inference/quicktour).

| Свойство                    | Значение                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Идентификатор провайдера    | `huggingface`                                                                                                                 |
| Плагин                      | встроенный (включён по умолчанию, установка не требуется)                                                                          |
| Переменная среды авторизации | `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN` (токен с детализированными разрешениями)                                                  |
| API                         | совместимый с OpenAI (`https://router.huggingface.co/v1`)                                                                                          |
| Оплата                      | единый токен HF; [цены](https://huggingface.co/docs/inference-providers/pricing) соответствуют тарифам провайдера и включают бесплатный уровень |

## Начало работы

<Steps>
  <Step title="Создайте токен с детализированными разрешениями">
    Перейдите в [настройки токенов Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) и создайте новый токен с детализированными разрешениями.

    <Warning>
    Для токена необходимо включить разрешение **Make calls to Inference Providers**, иначе запросы к API будут отклонены.
    </Warning>

  </Step>
  <Step title="Запустите первоначальную настройку">
    Выберите **Hugging Face** в раскрывающемся списке провайдеров, затем по запросу введите ключ API:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Выберите модель по умолчанию">
    В раскрывающемся списке **Модель Hugging Face по умолчанию** выберите модель. Если токен действителен, список загружается из Inference API; в противном случае OpenClaw отображает приведённый ниже встроенный каталог. Ваш выбор сохраняется как `agents.defaults.model.primary`:

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
  <Step title="Убедитесь, что модель доступна">
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

| Модель                       | Ссылка (с префиксом `huggingface/`) |
| ---------------------------- | ---------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                       |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                       |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                       |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`                       |

<Tip>
Если токен действителен, OpenClaw также обнаруживает любые другие модели с помощью запроса **GET** к `https://router.huggingface.co/v1/models` во время первоначальной настройки и запуска Gateway, поэтому каталог может содержать гораздо больше четырёх указанных выше моделей. К идентификатору любой модели можно добавить `:fastest` или `:cheapest`; маршрутизатор HF направит запрос соответствующему провайдеру инференса. Задайте порядок провайдеров по умолчанию в [настройках провайдеров инференса](https://hf.co/settings/inference-providers).
</Tip>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Обнаружение моделей и раскрывающийся список первоначальной настройки">
    OpenClaw обнаруживает модели с помощью следующего запроса:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # или $HF_TOKEN
    ```

    Ответ имеет формат OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Если ключ настроен (через первоначальную настройку, `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN`), раскрывающийся список **Модель Hugging Face по умолчанию** при интерактивной настройке заполняется данными из этой конечной точки. При запуске Gateway тот же запрос выполняется повторно для обновления каталога. Обнаруженные модели объединяются с приведённым выше встроенным каталогом, который используется для метаданных, например размера контекстного окна и стоимости, если идентификаторы совпадают. Если запрос завершается ошибкой, не возвращает данных или ключ не задан, OpenClaw использует только встроенный каталог.

    Чтобы отключить обнаружение, не удаляя провайдера:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Названия моделей, псевдонимы и суффиксы политик">
    - **Название из API:** для обнаруженных моделей используются значения `name`, `title` или `display_name` из API, если они присутствуют; в противном случае OpenClaw формирует название из идентификатора модели (например, `deepseek-ai/DeepSeek-R1` преобразуется в «DeepSeek R1»).
    - **Переопределение отображаемого названия:** задайте пользовательскую метку для каждой модели в конфигурации:

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

    - **Суффиксы политик:** `:fastest` и `:cheapest` — это соглашения маршрутизатора HF, которые OpenClaw не изменяет: суффикс передаётся дословно как часть идентификатора модели, а маршрутизатор HF выбирает соответствующего провайдера инференса. Если для каждого суффикса требуется отдельный псевдоним, добавьте каждый вариант как отдельную запись в `models.providers.huggingface.models` (или в `model.primary`).
    - **Объединение конфигурации:** существующие записи в `models.providers.huggingface.models` (например, в `models.json`) сохраняются при объединении конфигурации, поэтому заданные там пользовательские значения `name`, `alias` и параметры моделей сохраняются после перезапусков.

  </Accordion>

  <Accordion title="Настройка среды и фоновой службы">
    Если Gateway работает как фоновая служба (launchd/systemd), убедитесь, что `HUGGINGFACE_HUB_TOKEN` или `HF_TOKEN` доступны этому процессу (например, через `~/.openclaw/.env` или `env.shellEnv`).

    <Note>
    OpenClaw принимает как `HUGGINGFACE_HUB_TOKEN`, так и `HF_TOKEN`. Если заданы обе переменные, приоритет имеет `HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="Конфигурация: DeepSeek R1 с резервной моделью">
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

  <Accordion title="Конфигурация: DeepSeek с самым дешёвым и самым быстрым вариантами">
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

  <Accordion title="Конфигурация: DeepSeek + Llama + GPT-OSS с псевдонимами">
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

## См. также

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении на резервные модели.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/models" icon="brain">
    Выбор и настройка моделей.
  </Card>
  <Card title="Документация по провайдерам инференса" href="https://huggingface.co/docs/inference-providers" icon="book">
    Официальная документация по провайдерам инференса Hugging Face.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
</CardGroup>
