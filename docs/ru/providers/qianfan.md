---
read_when:
    - Вам нужен единый ключ API для множества LLM-моделей
    - Вам нужны инструкции по настройке Baidu Qianfan
summary: Используйте единый API Qianfan для доступа ко множеству моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-13T18:42:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan — это MaaS-платформа Baidu: унифицированный API, совместимый с OpenAI, который направляет запросы к множеству моделей через единую конечную точку и ключ API. OpenClaw поставляет её в виде официального внешнего плагина `@openclaw/qianfan-provider`.

| Свойство      | Значение                                    |
| ------------- | ---------------------------------------- |
| Провайдер      | `qianfan`                                |
| Аутентификация          | `QIANFAN_API_KEY`                        |
| API           | Совместимый с OpenAI (`openai-completions`) |
| Базовый URL      | `https://qianfan.baidubce.com/v2`        |
| Модель по умолчанию | `qianfan/deepseek-v3.2`                  |

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Создание учётной записи Baidu Cloud">
    Зарегистрируйтесь или войдите в [консоль Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) и убедитесь, что для вас включён доступ к API Qianfan.
  </Step>
  <Step title="Создание ключа API">
    Создайте новое приложение или выберите существующее, затем сгенерируйте ключ API. Ключи Baidu Cloud имеют формат `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Запуск первоначальной настройки">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    При неинтерактивном запуске ключ считывается из `--qianfan-api-key <key>` или
    `QIANFAN_API_KEY`. Первоначальная настройка записывает конфигурацию провайдера, добавляет
    псевдоним `QIANFAN` для модели по умолчанию и устанавливает `qianfan/deepseek-v3.2`
    в качестве модели по умолчанию, если модель не настроена.

  </Step>
  <Step title="Проверка доступности модели">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Встроенный каталог

| Ссылка на модель                            | Входные данные       | Контекст | Макс. объём вывода | Рассуждение | Примечания         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | текст        | 98,304  | 32,768     | Да       | Модель по умолчанию |
| `qianfan/ernie-5.0-thinking-preview` | текст, изображение | 119,000 | 64,000     | Да       | Мультимодальная    |

Каталог статический; динамическое обнаружение моделей не предусмотрено.

<Tip>
Переопределять `models.providers.qianfan` нужно только при использовании собственного базового URL или метаданных модели.
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

<Note>
В ссылках на модели используется префикс `qianfan/` (например, `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Транспорт и совместимость">
    Qianfan работает через транспортный механизм, совместимый с OpenAI, а не через нативное формирование запросов OpenAI. Стандартные возможности SDK OpenAI работают, но специфичные для провайдера параметры могут не передаваться.
  </Accordion>

  <Accordion title="Устранение неполадок">
    - Убедитесь, что ключ API начинается с `bce-v3/ALTAK-`, а доступ к API Qianfan включён в консоли Baidu Cloud.
    - Если модели не отображаются, убедитесь, что для вашей учётной записи активирована служба Qianfan.
    - Изменяйте базовый URL только при использовании собственной конечной точки или прокси-сервера.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации OpenClaw.
  </Card>
  <Card title="Настройка агента" href="/ru/concepts/agent" icon="robot">
    Настройка параметров агентов по умолчанию и назначение моделей.
  </Card>
  <Card title="Документация API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Официальная документация API Qianfan.
  </Card>
</CardGroup>
