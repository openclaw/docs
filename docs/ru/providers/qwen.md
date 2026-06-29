---
read_when:
    - Вы хотите использовать Qwen с OpenClaw
    - Ранее вы использовали Qwen OAuth
summary: Используйте Qwen Cloud через его OpenClaw Plugin
title: Qwen
x-i18n:
    generated_at: "2026-06-28T23:39:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw теперь рассматривает Qwen как полноправный Plugin провайдера с каноническим идентификатором
`qwen`. Plugin провайдера нацелен на конечные точки Qwen Cloud / Alibaba DashScope и
Coding Plan, сохраняет работоспособность устаревших идентификаторов `modelstudio` как совместимого
псевдонима, а также предоставляет поток токенов Qwen Portal как провайдер `qwen-oauth`.

- Провайдер: `qwen`
- Провайдер Portal: [`qwen-oauth`](/ru/providers/qwen-oauth)
- Предпочтительная переменная окружения: `QWEN_API_KEY`
- Также принимаются для совместимости: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: совместимый с OpenAI

<Tip>
Если вам нужен `qwen3.6-plus`, предпочитайте конечную точку **Standard (pay-as-you-go)**.
Поддержка Coding Plan может отставать от публичного каталога.
</Tip>

## Установите Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Начало работы

Выберите тип плана и выполните шаги настройки.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Лучше всего подходит для:** доступа по подписке через Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Создайте или скопируйте API-ключ на [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Для конечной точки **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для конечной точки **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Устаревшие идентификаторы auth-choice `modelstudio-*` и ссылки на модели `modelstudio/...` по-прежнему
    работают как совместимые псевдонимы, но новым потокам настройки следует предпочитать канонические
    идентификаторы auth-choice `qwen-*` и ссылки на модели `qwen/...`. Если вы определяете точную
    пользовательскую запись `models.providers.modelstudio` с другим значением `api`, этот
    пользовательский провайдер владеет ссылками `modelstudio/...` вместо совместимого
    псевдонима Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Лучше всего подходит для:** доступа с оплатой по мере использования через конечную точку Standard Model Studio, включая модели вроде `qwen3.6-plus`, которые могут быть недоступны в Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Создайте или скопируйте API-ключ на [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Для конечной точки **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для конечной точки **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Устаревшие идентификаторы auth-choice `modelstudio-*` и ссылки на модели `modelstudio/...` по-прежнему
    работают как совместимые псевдонимы, но новым потокам настройки следует предпочитать канонические
    идентификаторы auth-choice `qwen-*` и ссылки на модели `qwen/...`. Если вы определяете точную
    пользовательскую запись `models.providers.modelstudio` с другим значением `api`, этот
    пользовательский провайдер владеет ссылками `modelstudio/...` вместо совместимого
    псевдонима Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Лучше всего подходит для:** токена Qwen Portal для `https://portal.qwen.ai/v1`.

    См. [Qwen OAuth / Portal](/ru/providers/qwen-oauth) для отдельной страницы провайдера
    и заметок о миграции.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` использует то же имя переменной окружения `QWEN_API_KEY`, что и провайдер
    DashScope, но сохраняет аутентификацию под идентификатором провайдера `qwen-oauth` при настройке
    через onboarding OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Типы планов и конечные точки

| План                       | Регион | Вариант аутентификации                | Конечная точка                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | Китай  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | Китай  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Провайдер автоматически выбирает конечную точку на основе выбранного варианта аутентификации. Канонические
варианты используют семейство `qwen-*`; `modelstudio-*` остается только для совместимости.
Вы можете переопределить это пользовательским `baseUrl` в конфигурации.

<Tip>
**Управление ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документация:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Встроенный каталог

В настоящее время OpenClaw поставляется с этим статическим каталогом Qwen. Настроенный каталог
учитывает конечную точку: конфигурации Coding Plan исключают модели, о которых известно, что они
работают только на конечной точке Standard.

| Model ref                   | Ввод        | Контекст  | Примечания                                                  |
| --------------------------- | ----------- | --------- | ----------------------------------------------------------- |
| `qwen/qwen3.5-plus`         | текст, изображение | 1,000,000 | Модель по умолчанию                                         |
| `qwen/qwen3.6-plus`         | текст, изображение | 1,000,000 | Предпочитайте конечные точки Standard, когда нужна эта модель |
| `qwen/qwen3-max-2026-01-23` | текст       | 262,144   | Линейка Qwen Max                                            |
| `qwen/qwen3-coder-next`     | текст       | 262,144   | Кодирование                                                 |
| `qwen/qwen3-coder-plus`     | текст       | 1,000,000 | Кодирование                                                 |
| `qwen/MiniMax-M2.5`         | текст       | 1,000,000 | Рассуждение включено                                        |
| `qwen/glm-5`                | текст       | 202,752   | GLM                                                         |
| `qwen/glm-4.7`              | текст       | 202,752   | GLM                                                         |
| `qwen/kimi-k2.5`            | текст, изображение | 262,144   | Moonshot AI через Alibaba                                   |
| `qwen-oauth/qwen3.5-plus`   | текст, изображение | 1,000,000 | Значение по умолчанию для Qwen Portal                       |

<Note>
Доступность всё равно может различаться в зависимости от конечной точки и тарифного плана,
даже если модель присутствует в статическом каталоге.
</Note>

## Элементы управления мышлением

Для моделей Qwen Cloud с поддержкой рассуждения провайдер сопоставляет уровни
мышления OpenClaw с флагом запроса верхнего уровня DashScope `enable_thinking`. Отключённое
мышление отправляет `enable_thinking: false`; остальные уровни мышления отправляют
`enable_thinking: true`.

## Мультимодальные дополнения

Plugin `qwen` также предоставляет мультимодальные возможности на конечных точках DashScope
**Standard** (не на конечных точках Coding Plan):

- **Понимание видео** через `qwen-vl-max-latest`
- **Генерация видео Wan** через `wan2.6-t2v` (по умолчанию), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Чтобы использовать Qwen как видеопровайдера по умолчанию:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
См. [Генерация видео](/ru/tools/video-generation), чтобы узнать об общих параметрах инструмента, выборе провайдера и поведении при отказе.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Понимание изображений и видео">
    Plugin Qwen регистрирует понимание медиа для изображений и видео
    на конечных точках DashScope **Standard** (не на конечных точках Coding Plan).

    | Свойство      | Значение              |
    | ------------- | --------------------- |
    | Модель        | `qwen-vl-max-latest`  |
    | Поддерживаемый ввод | Изображения, видео |

    Понимание медиа автоматически определяется из настроенной авторизации Qwen — дополнительная
    конфигурация не нужна. Убедитесь, что вы используете конечную точку Standard (с оплатой по мере использования)
    для поддержки понимания медиа.

  </Accordion>

  <Accordion title="Доступность Qwen 3.6 Plus">
    `qwen3.6-plus` доступна на конечных точках Model Studio Standard (с оплатой по мере использования):

    - Китай: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Если конечные точки Coding Plan возвращают ошибку "unsupported model" для
    `qwen3.6-plus`, переключитесь на Standard (с оплатой по мере использования) вместо пары
    конечной точки/ключа Coding Plan.

    Статический каталог Qwen в OpenClaw не публикует `qwen3.6-plus` на конечных точках Coding
    Plan, но явно настроенные записи `qwen/qwen3.6-plus` в
    `models.providers.qwen.models` учитываются для baseUrls Coding Plan, поэтому
    вы можете подключить эту модель, если Aliyun включит её для вашей подписки. Вышестоящий
    API всё равно решает, будет ли вызов успешным.

  </Accordion>

  <Accordion title="План возможностей">
    Plugin `qwen` позиционируется как основное место поставщика для всей поверхности Qwen
    Cloud, а не только для моделей кодирования/текста.

    - **Текстовые/чат-модели:** доступны через Plugin
    - **Вызов инструментов, структурированный вывод, мышление:** наследуются от OpenAI-совместимого транспорта
    - **Генерация изображений:** запланирована на уровне provider-Plugin
    - **Понимание изображений/видео:** доступно через Plugin на конечной точке Standard
    - **Речь/аудио:** запланировано на уровне provider-Plugin
    - **Эмбеддинги памяти/переранжирование:** запланированы через поверхность адаптера эмбеддингов
    - **Генерация видео:** доступна через Plugin с помощью общей возможности генерации видео

  </Accordion>

  <Accordion title="Подробности генерации видео">
    Для генерации видео OpenClaw сопоставляет настроенный регион Qwen с соответствующим
    хостом DashScope AIGC перед отправкой задания:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - Китай: `https://dashscope.aliyuncs.com`

    Это означает, что обычный `models.providers.qwen.baseUrl`, указывающий либо на хосты
    Coding Plan, либо на хосты Standard Qwen, всё равно сохраняет генерацию видео на правильной
    региональной видеоконечной точке DashScope.

    Текущие ограничения генерации видео Qwen:

    - До **1** выходного видео на запрос
    - До **1** входного изображения
    - До **4** входных видео
    - Длительность до **10 секунд**
    - Поддерживает `size`, `aspectRatio`, `resolution`, `audio` и `watermark`
    - Режим эталонного изображения/видео в настоящее время требует **удалённые URL-адреса http(s)**. Локальные
      пути к файлам отклоняются заранее, потому что видеоконечная точка DashScope не
      принимает загруженные локальные буферы для таких эталонов.

  </Accordion>

  <Accordion title="Совместимость использования потоковой передачи">
    Нативные конечные точки Model Studio заявляют о совместимости использования потоковой передачи на
    общем транспорте `openai-completions`. Теперь OpenClaw определяет это по
    возможностям конечной точки, поэтому пользовательские идентификаторы провайдеров, совместимые с DashScope и нацеленные на
    те же нативные хосты, наследуют то же поведение использования потоковой передачи, вместо того чтобы
    требовать именно встроенный идентификатор провайдера `qwen`.

    Совместимость использования нативной потоковой передачи применяется как к хостам Coding Plan, так и
    к стандартным хостам, совместимым с DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регионы мультимодальных конечных точек">
    Мультимодальные поверхности (понимание видео и генерация видео Wan) используют
    **стандартные** конечные точки DashScope, а не конечные точки Coding Plan:

    - Глобальный/международный стандартный базовый URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Китайский стандартный базовый URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Настройка окружения и демона">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что `QWEN_API_KEY`
    доступен этому процессу (например, в `~/.openclaw/.env` или через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента видео и выбор провайдера.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ru/providers/alibaba" icon="cloud">
    Устаревший провайдер ModelStudio и примечания по миграции.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общее устранение неполадок и FAQ.
  </Card>
</CardGroup>
