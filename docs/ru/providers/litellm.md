---
read_when:
    - Вы хотите направлять OpenClaw через прокси LiteLLM
    - Вам нужны отслеживание затрат, журналирование или маршрутизация моделей через LiteLLM
summary: Запускайте OpenClaw через LiteLLM Proxy для унифицированного доступа к моделям и отслеживания затрат
title: LiteLLM
x-i18n:
    generated_at: "2026-06-28T23:37:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) — это open-source LLM-шлюз, который предоставляет единый API для более чем 100 провайдеров моделей. Направляйте OpenClaw через LiteLLM, чтобы получить централизованное отслеживание расходов, журналирование и гибкость переключения бэкендов без изменения конфигурации OpenClaw.

<Tip>
**Зачем использовать LiteLLM с OpenClaw?**

- **Отслеживание расходов** — Видите, сколько именно OpenClaw тратит на всех моделях
- **Маршрутизация моделей** — Переключайтесь между Claude, GPT-4, Gemini, Bedrock без изменений конфигурации
- **Виртуальные ключи** — Создавайте ключи с лимитами расходов для OpenClaw
- **Журналирование** — Полные журналы запросов/ответов для отладки
- **Резервные варианты** — Автоматическое переключение при недоступности основного провайдера

</Tip>

## Быстрый старт

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Лучше всего подходит для:** самого быстрого пути к рабочей настройке LiteLLM.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Для неинтерактивной настройки с удаленным прокси явно передайте URL прокси:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **Лучше всего подходит для:** полного контроля над установкой и конфигурацией.

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Готово. Теперь OpenClaw направляет запросы через LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Конфигурация

### Переменные окружения

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Файл конфигурации

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

## Расширенная конфигурация

### Генерация изображений

LiteLLM также может обеспечивать работу инструмента `image_generate` через OpenAI-совместимые
маршруты `/images/generations` и `/images/edits`. Настройте модель изображений LiteLLM
в `agents.defaults.imageGenerationModel`:

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

Loopback-URL LiteLLM, такие как `http://localhost:4000`, работают без глобального
переопределения частной сети. Для прокси, размещенного в LAN, задайте
`models.providers.litellm.request.allowPrivateNetwork: true`, потому что API-ключ
будет отправлен на настроенный хост прокси.

<AccordionGroup>
  <Accordion title="Virtual keys">
    Создайте выделенный ключ для OpenClaw с лимитами расходов:

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

    Используйте сгенерированный ключ как `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Model routing">
    LiteLLM может направлять запросы моделей к разным бэкендам. Настройте это в LiteLLM `config.yaml`:

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

    OpenClaw продолжает запрашивать `claude-opus-4-6` — LiteLLM обрабатывает маршрутизацию.

  </Accordion>

  <Accordion title="Viewing usage">
    Проверьте панель управления или API LiteLLM:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - По умолчанию LiteLLM работает на `http://localhost:4000`
    - OpenClaw подключается через прокси-стиль OpenAI-совместимой конечной точки LiteLLM `/v1`
    - Формирование запросов, предназначенное только для нативного OpenAI, не применяется через LiteLLM:
      нет `service_tier`, нет Responses `store`, нет подсказок для prompt cache и нет
      формирования payload для совместимости с reasoning OpenAI
    - Скрытые заголовки атрибуции OpenClaw (`originator`, `version`, `User-Agent`)
      не внедряются для пользовательских базовых URL LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Общую конфигурацию провайдеров и поведение failover см. в [Провайдерах моделей](/ru/concepts/model-providers).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Официальная документация LiteLLM и справочник API.
  </Card>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации.
  </Card>
  <Card title="Model selection" href="/ru/concepts/models" icon="brain">
    Как выбирать и настраивать модели.
  </Card>
</CardGroup>
