---
read_when:
    - Вы хотите использовать Arcee AI с OpenClaw
    - Вам нужна переменная окружения с API-ключом или выбор аутентификации CLI
summary: Настройка Arcee AI (аутентификация + выбор модели)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-28T23:34:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) предоставляет доступ к семейству моделей Trinity на основе mixture-of-experts через OpenAI-совместимый API. Все модели Trinity лицензированы по Apache 2.0.

К моделям Arcee AI можно обращаться напрямую через платформу Arcee или через [OpenRouter](/ru/providers/openrouter).

| Свойство | Значение                                                                              |
| -------- | ------------------------------------------------------------------------------------- |
| Поставщик | `arcee`                                                                               |
| Аутентификация | `ARCEEAI_API_KEY` (напрямую) или `OPENROUTER_API_KEY` (через OpenRouter)       |
| API      | OpenAI-совместимый                                                                    |
| Базовый URL | `https://api.arcee.ai/api/v1` (напрямую) или `https://openrouter.ai/api/v1` (OpenRouter) |

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Начало работы

<Tabs>
  <Tab title="Напрямую (платформа Arcee)">
    <Steps>
      <Step title="Получите ключ API">
        Создайте ключ API в [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Запустите онбординг">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Задайте модель по умолчанию">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Через OpenRouter">
    <Steps>
      <Step title="Получите ключ API">
        Создайте ключ API в [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустите онбординг">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Задайте модель по умолчанию">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Те же ссылки на модели работают как для прямой настройки, так и для настройки через OpenRouter (например, `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Неинтерактивная настройка

<Tabs>
  <Tab title="Напрямую (платформа Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Через OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Встроенный каталог

В настоящее время OpenClaw поставляется со следующим статическим каталогом Arcee:

| Ссылка на модель               | Название               | Ввод  | Контекст | Стоимость (ввод/вывод за 1 млн) | Примечания                                |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Модель по умолчанию; reasoning включен    |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Универсальная; 400B параметров, 13B активных |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Быстрая и экономичная; вызов функций      |

<Tip>
Предустановка онбординга задает `arcee/trinity-large-thinking` как модель по умолчанию.
</Tip>

## Поддерживаемые возможности

| Возможность                                  | Поддерживается                              |
| --------------------------------------------- | -------------------------------------------- |
| Потоковая передача                            | Да                                           |
| Использование инструментов / вызов функций    | Да (Trinity Mini, Trinity Large Preview)     |
| Структурированный вывод (режим JSON и схема JSON) | Да                                      |
| Расширенное мышление                          | Да (Trinity Large Thinking; инструменты отключены) |

<AccordionGroup>
  <Accordion title="Примечание об окружении">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что `ARCEEAI_API_KEY`
    (или `OPENROUTER_API_KEY`) доступен этому процессу (например, в
    `~/.openclaw/.env` или через `env.shellEnv`).
  </Accordion>

  <Accordion title="Маршрутизация OpenRouter">
    При использовании моделей Arcee через OpenRouter применяются те же ссылки на модели `arcee/*`.
    OpenClaw прозрачно обрабатывает маршрутизацию на основе выбранного способа аутентификации. Подробнее о настройке,
    специфичной для OpenRouter, см. в
    [документации поставщика OpenRouter](/ru/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ru/providers/openrouter" icon="shuffle">
    Доступ к моделям Arcee и многим другим через один ключ API.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при отказе.
  </Card>
</CardGroup>
