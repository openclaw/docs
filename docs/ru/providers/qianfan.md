---
read_when:
    - Вам нужен единый API-ключ для множества LLMs
    - Вам нужны инструкции по настройке Baidu Qianfan
summary: Используйте единый API Qianfan для доступа ко многим моделям в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-28T23:39:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan — это MaaS-платформа Baidu, предоставляющая **унифицированный API**, который направляет запросы к множеству моделей за одной
конечной точкой и ключом API. Она совместима с OpenAI, поэтому большинство SDK OpenAI работают после смены базового URL.

| Свойство | Значение                          |
| -------- | --------------------------------- |
| Провайдер | `qianfan`                        |
| Аутентификация | `QIANFAN_API_KEY`          |
| API      | Совместим с OpenAI                |
| Базовый URL | `https://qianfan.baidubce.com/v2` |

## Установка plugin

Установите официальный plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Create a Baidu Cloud account">
    Зарегистрируйтесь или войдите в [консоль Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) и убедитесь, что доступ к API Qianfan включен.
  </Step>
  <Step title="Generate an API key">
    Создайте новое приложение или выберите существующее, затем сгенерируйте ключ API. Формат ключа: `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Встроенный каталог

| Ссылка на модель                     | Ввод        | Контекст | Макс. вывод | Рассуждение | Примечания        |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | текст       | 98,304  | 32,768     | Да        | Модель по умолчанию |
| `qianfan/ernie-5.0-thinking-preview` | текст, изображение | 119,000 | 64,000     | Да        | Мультимодальная |

<Tip>
Ссылка на модель по умолчанию — `qianfan/deepseek-v3.2`. Переопределять `models.providers.qianfan` нужно только тогда, когда требуется пользовательский базовый URL или метаданные модели.
</Tip>

## Пример конфигурации

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan работает через транспортный путь, совместимый с OpenAI, а не через нативное формирование запросов OpenAI. Это означает, что стандартные возможности SDK OpenAI работают, но параметры, специфичные для провайдера, могут не передаваться.
  </Accordion>

  <Accordion title="Catalog and overrides">
    Статический каталог сейчас включает `deepseek-v3.2` и `ernie-5.0-thinking-preview`. Добавляйте или переопределяйте `models.providers.qianfan` только тогда, когда требуется пользовательский базовый URL или метаданные модели.

    <Note>
    Ссылки на модели используют префикс `qianfan/` (например, `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Убедитесь, что ваш ключ API начинается с `bce-v3/ALTAK-` и что доступ к API Qianfan включен в консоли Baidu Cloud.
    - Если модели не отображаются в списке, подтвердите, что в вашей учетной записи активирован сервис Qianfan.
    - Базовый URL по умолчанию: `https://qianfan.baidubce.com/v2`. Меняйте его только при использовании пользовательской конечной точки или прокси.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник конфигурации OpenClaw.
  </Card>
  <Card title="Agent setup" href="/ru/concepts/agent" icon="robot">
    Настройка значений по умолчанию для агентов и назначений моделей.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Официальная документация API Qianfan.
  </Card>
</CardGroup>
