---
read_when:
    - Вы хотите использовать Qwen с OpenClaw
    - У вас есть подписка на тарифный план Alibaba Cloud Token Plan
    - Ранее вы использовали Qwen OAuth
summary: Используйте Qwen Cloud через его Plugin для OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T11:48:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud — официальный внешний Plugin провайдера OpenClaw с каноническим идентификатором `qwen`. Он предназначен для конечных точек Qwen Cloud / Alibaba DashScope Standard и Coding Plan, предоставляет Token Plan как `qwen-token-plan`, сохраняет `modelstudio` как псевдоним для совместимости, независимо владеет документированным Alibaba идентификатором пользовательского провайдера `bailian-token-plan` и предоставляет поток токена Qwen Portal как [`qwen-oauth`](/ru/providers/qwen-oauth).

| Свойство                         | Значение                                   |
| -------------------------------- | ------------------------------------------ |
| Провайдер                        | `qwen`                                     |
| Провайдер Token Plan             | `qwen-token-plan`                          |
| Провайдер Portal                 | [`qwen-oauth`](/ru/providers/qwen-oauth)      |
| Предпочтительная переменная среды | `QWEN_API_KEY`                             |
| Переменная среды Token Plan      | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Также принимаются (совместимость) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Стиль API                        | Совместимый с OpenAI                       |

<Tip>
`qwen3.7-plus` и `qwen3.6-plus` работают с конечными точками Coding Plan и Standard.
Для `qwen3.7-max` или `qwen3.6-flash` используйте конечную точку **Standard (с оплатой по мере использования)**.
</Tip>

## Установка Plugin

`qwen` поставляется как официальный внешний Plugin и не входит в состав ядра. Установите его и перезапустите Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Начало работы

Выберите тип плана и выполните шаги настройки.

<Tabs>
  <Tab title="Coding Plan (подписка)">
    **Лучше всего подходит для:** доступа по подписке через Qwen Coding Plan.

    <Steps>
      <Step title="Получите ключ API">
        Создайте или скопируйте ключ API на странице [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустите первоначальную настройку">
        Для **глобальной** конечной точки:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для конечной точки в **Китае**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Задайте модель по умолчанию">
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
      <Step title="Убедитесь, что модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Устаревшие идентификаторы выбора аутентификации `modelstudio-*` и ссылки на модели `modelstudio/...`
    по-прежнему работают как псевдонимы для совместимости, но в новых процессах настройки следует
    предпочитать канонические идентификаторы выбора аутентификации `qwen-*` и ссылки на модели
    `qwen/...`. Если вы определите точную пользовательскую запись
    `models.providers.modelstudio` с другим значением `api`, этот пользовательский
    провайдер будет владеть ссылками `modelstudio/...` вместо псевдонима Qwen для совместимости.
    </Note>

  </Tab>

  <Tab title="Standard (с оплатой по мере использования)">
    **Лучше всего подходит для:** доступа с оплатой по мере использования через стандартную конечную точку Model Studio, включая `qwen3.7-max` и `qwen3.6-flash`, которые недоступны в Coding Plan.

    <Steps>
      <Step title="Получите ключ API">
        Создайте или скопируйте ключ API на странице [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустите первоначальную настройку">
        Для **глобальной** конечной точки:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для конечной точки в **Китае**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Задайте модель по умолчанию">
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
      <Step title="Убедитесь, что модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Устаревшие идентификаторы выбора аутентификации `modelstudio-*` и ссылки на модели `modelstudio/...`
    по-прежнему работают как псевдонимы для совместимости, но в новых процессах настройки следует
    предпочитать канонические идентификаторы выбора аутентификации `qwen-*` и ссылки на модели
    `qwen/...`. Если вы определите точную пользовательскую запись
    `models.providers.modelstudio` с другим значением `api`, этот пользовательский
    провайдер будет владеть ссылками `modelstudio/...` вместо псевдонима Qwen для совместимости.
    </Note>

  </Tab>

  <Tab title="Token Plan (командная редакция)">
    **Лучше всего подходит для:** доступа команды по подписке на основе кредитов к Qwen и поддерживаемым сторонним моделям через Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Получите выделенный ключ">
        Назначьте место Token Plan и создайте для него выделенный ключ `sk-sp-...`. Ключи Token Plan, Coding Plan и планы с оплатой по мере использования не взаимозаменяемы. См. [обзор глобального Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) или [обзор Token Plan для Китая](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Запустите первоначальную настройку">
        Для **глобальной / международной** конечной точки в Сингапуре:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Для конечной точки в **Китае**, расположенной в Пекине:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Проверьте провайдера">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    В руководстве Alibaba по OpenClaw для пользовательского провайдера с ручной настройкой
    используется `bailian-token-plan`. Plugin регистрирует этот идентификатор как владельца
    для совместимости, но в новых конфигурациях следует использовать `qwen-token-plan`.
    Точная пользовательская запись `models.providers.bailian-token-plan` сохраняет
    владение настроенным транспортом и каталогом; она никогда не объединяется с
    каноническим каталогом OpenAI.
    </Note>

    <Warning>
    Используйте Token Plan только для интерактивных сеансов OpenClaw. Не выбирайте его для
    заданий cron, автоматических сценариев или серверной части приложений. Alibaba указывает,
    что неинтерактивное использование может привести к приостановке подписки или отзыву ключа API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Лучше всего подходит для:** токена Qwen Portal для `https://portal.qwen.ai/v1`.

    Специальная страница провайдера и примечания по миграции приведены в разделе
    [Qwen OAuth / Portal](/ru/providers/qwen-oauth).

    <Steps>
      <Step title="Укажите токен Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Задайте модель по умолчанию">
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
      <Step title="Убедитесь, что модель доступна">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` использует то же имя переменной среды `QWEN_API_KEY`, что и провайдер
    Qwen Cloud, но при настройке через первоначальную настройку OpenClaw сохраняет
    данные аутентификации с идентификатором провайдера `qwen-oauth`.
    </Note>

  </Tab>
</Tabs>

## Типы планов и конечные точки

| План                                     | Регион    | Выбор аутентификации       | Конечная точка                                                   |
| ---------------------------------------- | --------- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (подписка)                   | Китай     | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (подписка)                   | Глобальный | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                              | Глобальный | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (с оплатой по мере использования) | Китай     | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (с оплатой по мере использования) | Глобальный | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (командная редакция)          | Китай     | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (командная редакция)          | Глобальный | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Провайдер автоматически выбирает конечную точку на основе выбранного варианта аутентификации.
Канонические варианты относятся к семейству `qwen-*`; `modelstudio-*` сохраняется только
для совместимости. Переопределить адрес можно с помощью пользовательского `baseUrl` в конфигурации.

<Tip>
**Управление ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документация:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Встроенный каталог

OpenClaw поставляется с этим статическим каталогом Qwen. Каталог учитывает конечную
точку: из конфигураций Coding Plan исключаются модели, работающие только со стандартной конечной точкой.

| Ссылка на модель             | Входные данные     | Контекст  | Примечания                               |
| ---------------------------- | ------------------ | --------- | ---------------------------------------- |
| `qwen/qwen3.5-plus`          | текст, изображение | 1,000,000 | Модель по умолчанию                      |
| `qwen/qwen3.6-flash`         | текст, изображение | 1,000,000 | Только стандартные конечные точки        |
| `qwen/qwen3.6-plus`          | текст, изображение | 1,000,000 | Coding Plan + Standard                   |
| `qwen/qwen3.7-max`           | текст              | 1,000,000 | Только стандартные конечные точки        |
| `qwen/qwen3.7-plus`          | текст, изображение | 1,000,000 | Coding Plan + Standard                   |
| `qwen/qwen3-max-2026-01-23`  | текст              | 262,144   | Линейка Qwen Max                         |
| `qwen/qwen3-coder-next`      | текст              | 262,144   | Программирование                         |
| `qwen/qwen3-coder-plus`      | текст              | 1,000,000 | Программирование                         |
| `qwen/MiniMax-M2.5`          | текст              | 1,000,000 | Рассуждения включены                     |
| `qwen/glm-5`                 | текст              | 202,752   | GLM                                      |
| `qwen/glm-4.7`               | текст              | 202,752   | GLM                                      |
| `qwen/kimi-k2.5`             | текст, изображение | 262,144   | Moonshot AI через Alibaba                |
| `qwen-oauth/qwen3.5-plus`    | текст, изображение | 1,000,000 | Модель Qwen Portal по умолчанию          |

<Note>
Доступность может различаться в зависимости от конечной точки и тарифного плана,
даже если модель присутствует в статическом каталоге.
</Note>

### Каталог Token Plan

Token Plan использует отдельный список разрешённых точных строк. Модели плана,
предназначенные только для генерации изображений, здесь не представлены, поскольку
они используют другие API.

| Ссылка на модель                    | Входные данные     | Контекст  |
| ----------------------------------- | ------------------ | --------- |
| `qwen-token-plan/qwen3.7-max`       | текст              | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | текст, изображение | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | текст, изображение | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | текст, изображение | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | текст              | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | текст              | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | текст              | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | текст, изображение | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | текст, изображение | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | текст, изображение | 262,144   |
| `qwen-token-plan/glm-5.2`           | текст              | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | текст              | 202,752   |
| `qwen-token-plan/glm-5`             | текст              | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | текст              | 196,608   |

## Управление рассуждениями

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` и `qwen3.6-plus`
поддерживают рассуждения во встроенном каталоге. Для моделей с рассуждениями
семейства `qwen` провайдер сопоставляет уровни рассуждений OpenClaw с флагом
верхнего уровня `enable_thinking` в запросах DashScope: при отключённых
рассуждениях отправляется `enable_thinking: false`, а при любом другом уровне —
`enable_thinking: true`. Для пользовательских моделей можно включить
альтернативную полезную нагрузку рассуждений на основе шаблона чата, задав
`compat.thinkingFormat: "qwen-chat-template"` в записи модели.

Модели Token Plan также отмечены как поддерживающие рассуждения.
`kimi-k2.7-code` и `MiniMax-M2.5` работают только с рассуждениями, поэтому
OpenClaw сохраняет рассуждения включёнными, даже если в сеансе запрошено
`/think off`. Для DeepSeek V4 уровни от `minimal` до `high` сопоставляются с
уровнем усилий `high` сервиса, а `xhigh` и `max` — с `max`. GLM 5.2 принимает
весь диапазон от `minimal` до `max`; GLM 5.1 и GLM 5 принимают уровни до
`xhigh`, а уровнем по умолчанию для всех трёх является `high`. Остальные
гибридные модели следуют запрошенному состоянию включения или отключения.

## Дополнения для мультимодальных возможностей

Plugin `qwen` предоставляет мультимодальные возможности только через конечные
точки DashScope **Standard**, но не через конечные точки Coding Plan:

- **Распознавание изображений и видео** с помощью `qwen-vl-max-latest`
- **Генерация видео Wan** с помощью `wan2.6-t2v` (по умолчанию), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Возможности распознавания мультимедиа автоматически определяются на основе
настроенной аутентификации Qwen; дополнительная настройка не требуется. Для
работы распознавания мультимедиа убедитесь, что используется конечная точка
Standard с оплатой по мере использования.

Чтобы сделать Qwen провайдером видео по умолчанию:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Ограничения генерации видео: одно выходное видео на запрос, до одного входного
изображения для преобразования изображения в видео, до четырёх входных видео
для преобразования видео в видео, максимальная длительность — 10 секунд.
Поддерживаются `size`, `aspectRatio`, `resolution`, `audio` и `watermark`.
Для входных эталонных изображений и видео требуются удалённые URL-адреса
http(s); локальные пути к файлам отклоняются до отправки запроса, поскольку
конечная точка видео DashScope не принимает загруженные локальные буферы для
таких материалов.

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация видео](/ru/tools/video-generation).
</Note>

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Qwen 3.6 and 3.7 availability">
    `qwen3.7-plus` и `qwen3.6-plus` доступны на конечных точках Coding Plan и Standard. `qwen3.7-max` и `qwen3.6-flash` доступны только на Standard. Конечные точки Standard с оплатой по мере использования:

    - Китай: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Другие регионы: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw не включает `qwen3.7-max` и `qwen3.6-flash` в каталоги Coding Plan.
    Если конечная точка Coding Plan возвращает ошибку "unsupported model" для одной из этих моделей,
    перейдите на соответствующую конечную точку Standard и используйте соответствующий ключ.

  </Accordion>

  <Accordion title="Video generation region routing">
    Перед отправкой задания генерации видео OpenClaw сопоставляет настроенный
    регион Qwen с соответствующим хостом DashScope AIGC:

    - Другие регионы: `https://dashscope-intl.aliyuncs.com`
    - Китай: `https://dashscope.aliyuncs.com`

    Обычный параметр `models.providers.qwen.baseUrl`, указывающий на хост Qwen
    для Coding Plan или Standard, по-прежнему направляет генерацию видео на
    соответствующую региональную конечную точку видео DashScope.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Нативные конечные точки Qwen заявляют о совместимости с передачей данных об
    использовании в потоковом режиме через общий транспорт `openai-completions`,
    поэтому идентификаторы пользовательских провайдеров, совместимых с
    DashScope и нацеленных на те же нативные хосты, наследуют это поведение без
    обязательного использования встроенного идентификатора провайдера `qwen`.
    Это относится к конечным точкам Coding Plan, Standard и Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Capability plan">
    Plugin `qwen` позиционируется как основная интеграция поставщика для всех
    возможностей Qwen Cloud, а не только для моделей программирования и текста.

    - **Текстовые и чат-модели:** доступны через Plugin
    - **Вызов инструментов, структурированный вывод и рассуждения:** наследуются от транспорта, совместимого с OpenAI
    - **Генерация изображений:** запланирована на уровне Plugin провайдера
    - **Распознавание изображений и видео:** доступно через Plugin на конечной точке Standard
    - **Речь и аудио:** запланированы на уровне Plugin провайдера
    - **Векторные представления и переранжирование памяти:** запланированы через интерфейс адаптера векторных представлений
    - **Генерация видео:** доступна через Plugin посредством общей возможности генерации видео

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что
    `QWEN_API_KEY` или `QWEN_TOKEN_PLAN_API_KEY` доступен этому процессу
    (например, через `~/.openclaw/.env` или `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Video generation" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента генерации видео и выбор провайдера.
  </Card>
  <Card title="Alibaba Model Studio" href="/ru/providers/alibaba" icon="cloud">
    Встроенный провайдер генерации видео Wan на той же платформе DashScope.
  </Card>
  <Card title="Troubleshooting" href="/ru/help/troubleshooting" icon="wrench">
    Общие рекомендации по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
