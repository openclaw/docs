---
read_when:
    - Вы хотите направить OpenClaw через прокси-сервер LiteLLM
    - Вам нужны отслеживание затрат, журналирование или маршрутизация моделей через LiteLLM
summary: Запускайте OpenClaw через LiteLLM Proxy для унифицированного доступа к моделям и отслеживания затрат
title: LiteLLM
x-i18n:
    generated_at: "2026-07-13T18:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) — это LLM-шлюз с открытым исходным кодом и единым API для более чем 100
провайдеров моделей. Направляйте OpenClaw через LiteLLM для централизованного учёта затрат, журналирования, использования виртуальных ключей с
лимитами расходов и переключения на резервные серверные системы без изменения конфигурации OpenClaw.

## Быстрый старт

<Tabs>
  <Tab title="Первоначальная настройка (рекомендуется)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Для неинтерактивной настройки с удалённым прокси-сервером явно укажите URL прокси-сервера:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Ручная настройка">
    <Steps>
      <Step title="Запустите прокси-сервер LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Подключите OpenClaw к LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Конфигурация

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

При первоначальной настройке по умолчанию записывается модель `litellm/claude-opus-4-6`.

## Генерация изображений

LiteLLM может обеспечивать работу инструмента `image_generate` через совместимые с OpenAI маршруты `/images/generations` и
`/images/edits`. Модель изображений по умолчанию — `gpt-image-2`; другую модель можно настроить в
`agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Локальные URL LiteLLM (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) работают
без глобального разрешения доступа к частной сети. Для прокси-сервера в локальной сети задайте
`models.providers.litellm.request.allowPrivateNetwork: true`, поскольку ключ API отправляется на этот хост.

## Расширенные возможности

<AccordionGroup>
  <Accordion title="Виртуальные ключи">
    Создайте отдельный ключ для OpenClaw с лимитами расходов:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Используйте созданный ключ как `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Маршрутизация моделей">
    LiteLLM может направлять запросы к моделям в разные серверные системы. Настройте маршрутизацию в файле `config.yaml` LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw продолжает запрашивать `claude-opus-4-6`, а LiteLLM выполняет маршрутизацию.

  </Accordion>

  <Accordion title="Просмотр использования">
    ```bash
    # Информация о ключе
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Журналы расходов
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Примечания о поведении прокси-сервера">
    - По умолчанию LiteLLM работает на `http://localhost:4000`.
    - OpenClaw подключается через совместимую с OpenAI конечную точку `/v1` прокси-сервера LiteLLM.
    - Формирование запросов, предназначенное только для нативного OpenAI, не применяется при использовании настроенного базового URL LiteLLM:
      без `service_tier`, без Responses `store`, без подсказок для кэша промптов и без формирования
      полезной нагрузки для уровня усилий рассуждения OpenAI.
    - Скрытые заголовки атрибуции OpenClaw (`originator`, `version`, `User-Agent`) отправляются только
      проверенным нативным конечным точкам OpenAI, поэтому они не добавляются при использовании пользовательского базового URL LiteLLM.
  </Accordion>
</AccordionGroup>

<Note>
Общие сведения о настройке провайдеров и переключении на резервные системы см. в разделе [Провайдеры моделей](/ru/concepts/model-providers).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Документация LiteLLM" href="https://docs.litellm.ai" icon="book">
    Официальная документация LiteLLM и справочник по API.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении на резервные системы.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
  <Card title="Модели" href="/ru/concepts/models" icon="brain">
    Выбор и настройка моделей.
  </Card>
</CardGroup>
