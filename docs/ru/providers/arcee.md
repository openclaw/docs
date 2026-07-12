---
read_when:
    - Вы хотите использовать Arcee AI с OpenClaw
    - Вам потребуется переменная окружения с API-ключом или способ аутентификации через CLI
summary: Настройка Arcee AI (аутентификация + выбор модели)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T11:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) предоставляет семейство моделей Trinity на основе смеси экспертов через API, совместимый с OpenAI. Все модели Trinity распространяются по лицензии Apache 2.0. Arcee — официальный плагин OpenClaw, не входящий в состав ядра, поэтому перед первоначальной настройкой его необходимо установить.

Доступ к моделям Arcee можно получить напрямую через платформу Arcee или через [OpenRouter](/ru/providers/openrouter).

| Свойство   | Значение                                                                              |
| ----------- | ------------------------------------------------------------------------------------- |
| Провайдер   | `arcee`                                                                               |
| Авторизация | `ARCEEAI_API_KEY` (напрямую) или `OPENROUTER_API_KEY` (через OpenRouter)              |
| API         | Совместимый с OpenAI                                                                  |
| Базовый URL | `https://api.arcee.ai/api/v1` (напрямую) или `https://openrouter.ai/api/v1` (OpenRouter) |

## Установка плагина

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
      <Step title="Запустите первоначальную настройку">
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
      <Step title="Запустите первоначальную настройку">
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

        Одни и те же ссылки на модели работают как при прямом подключении, так и при настройке через OpenRouter.
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

| Ссылка на модель               | Название               | Ввод  | Контекст | Макс. объём вывода | Стоимость (ввод/вывод за 1 млн) | Инструменты | Примечания                                      |
| ------------------------------ | ---------------------- | ----- | -------- | ------------------ | -------------------------------- | ----------- | ----------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | текст | 256K     | 80K                | $0.25 / $0.90                    | Нет         | Модель по умолчанию; расширенное рассуждение    |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | текст | 128K     | 16K                | $0.25 / $1.00                    | Да          | Универсальная; 400 млрд параметров, 13 млрд активных |
| `arcee/trinity-mini`           | Trinity Mini 26B       | текст | 128K     | 80K                | $0.045 / $0.15                   | Да          | Быстрая и экономичная; вызов функций            |

<Tip>
Предустановка первоначальной настройки задаёт `arcee/trinity-large-thinking` как модель по умолчанию.
</Tip>

## Поддерживаемые возможности

| Возможность                                      | Поддержка                                     |
| ------------------------------------------------ | --------------------------------------------- |
| Потоковая передача                               | Да                                            |
| Использование инструментов / вызов функций       | Да (Trinity Mini, Trinity Large Preview)      |
| Структурированный вывод (режим JSON и схема JSON) | Да                                            |
| Расширенное рассуждение                          | Да (Trinity Large Thinking; инструменты отключены) |

<AccordionGroup>
  <Accordion title="Примечание об окружении">
    Если Gateway работает как фоновая служба (launchd/systemd), убедитесь, что `ARCEEAI_API_KEY`
    (или `OPENROUTER_API_KEY`) доступен этому процессу, например через
    `~/.openclaw/.env` или `env.shellEnv`.
  </Accordion>

  <Accordion title="Маршрутизация OpenRouter">
    При использовании моделей Arcee через OpenRouter применяются те же ссылки на модели `arcee/*`.
    OpenClaw прозрачно выполняет маршрутизацию в зависимости от выбранного способа авторизации. Подробности
    настройки OpenRouter см. в [документации провайдера OpenRouter](/ru/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ru/providers/openrouter" icon="shuffle">
    Получайте доступ к моделям Arcee и многим другим моделям с помощью одного ключа API.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
</CardGroup>
