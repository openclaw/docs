---
read_when:
    - Вы хотите использовать Qwen с OpenClaw
    - У вас есть подписка на тарифный план токенов Alibaba Cloud
    - Ранее вы использовали Qwen OAuth
summary: Используйте Qwen Cloud через плагин OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-13T18:31:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud — официальный внешний плагин провайдера OpenClaw с каноническим идентификатором `qwen`. Он предназначен для конечных точек Qwen Cloud / Alibaba DashScope Standard и Coding Plan, предоставляет Token Plan как `qwen-token-plan`, сохраняет `modelstudio` как псевдоним для совместимости, независимо владеет описанным в документации Alibaba идентификатором пользовательского провайдера `bailian-token-plan` и предоставляет поток токенов Qwen Portal как [`qwen-oauth`](/ru/providers/qwen-oauth).

| Свойство                        | Значение                                   |
| ------------------------------- | ------------------------------------------ |
| Провайдер                       | `qwen`                         |
| Провайдер Token Plan            | `qwen-token-plan`                         |
| Провайдер портала               | [`qwen-oauth`](/ru/providers/qwen-oauth) |
| Предпочтительная переменная среды | `QWEN_API_KEY`                       |
| Переменная среды Token Plan     | `QWEN_TOKEN_PLAN_API_KEY`                         |
| Также принимаются (совместимость) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`  |
| Стиль API                       | Совместимый с OpenAI                       |

<Tip>
`qwen3.7-plus` и `qwen3.6-plus` работают с конечными точками Coding Plan и Standard.
Для `qwen3.7-max` или `qwen3.6-flash` используйте конечную точку **Standard (с оплатой по мере использования)**.
</Tip>

## Установка плагина

`qwen` поставляется как официальный внешний плагин и не входит в состав ядра. Установите его и перезапустите Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Начало работы

Выберите тип плана и выполните инструкции по настройке.

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
    Устаревшие идентификаторы выбора способа аутентификации `modelstudio-*` и ссылки на модели `modelstudio/...` по-прежнему
    работают как псевдонимы для совместимости, но в новых процессах настройки следует использовать канонические
    идентификаторы выбора способа аутентификации `qwen-*` и ссылки на модели `qwen/...`. Если вы определите точную
    пользовательскую запись `models.providers.modelstudio` с другим значением `api`, этот
    пользовательский провайдер будет владеть ссылками `modelstudio/...` вместо псевдонима
    Qwen для совместимости.
    </Note>

  </Tab>

  <Tab title="Standard (с оплатой по мере использования)">
    **Лучше всего подходит для:** доступа с оплатой по мере использования через конечную точку Standard Model Studio, включая `qwen3.7-max` и `qwen3.6-flash`, которые недоступны в Coding Plan.

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
    Устаревшие идентификаторы выбора способа аутентификации `modelstudio-*` и ссылки на модели `modelstudio/...` по-прежнему
    работают как псевдонимы для совместимости, но в новых процессах настройки следует использовать канонические
    идентификаторы выбора способа аутентификации `qwen-*` и ссылки на модели `qwen/...`. Если вы определите точную
    пользовательскую запись `models.providers.modelstudio` с другим значением `api`, этот
    пользовательский провайдер будет владеть ссылками `modelstudio/...` вместо псевдонима
    Qwen для совместимости.
    </Note>

  </Tab>

  <Tab title="Token Plan (командная редакция)">
    **Лучше всего подходит для:** командного доступа по подписке на основе кредитов к Qwen и поддерживаемым сторонним моделям через Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Получите выделенный ключ">
        Назначьте место в Token Plan и создайте для него выделенный ключ `sk-sp-...`. Ключи Token Plan, Coding Plan и планов с оплатой по мере использования не взаимозаменяемы. См. [обзор глобального Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) или [обзор Token Plan для Китая](https://help.aliyun.com/zh/model-studio/token-plan-overview).
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
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Ответьте: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    В руководстве Alibaba по OpenClaw для пользовательского
    провайдера, настраиваемого вручную, используется `bailian-token-plan`. Плагин регистрирует этот идентификатор как владелец для совместимости, но в новых
    конфигурациях следует использовать `qwen-token-plan`. Точная пользовательская
    запись `models.providers.bailian-token-plan` сохраняет владение настроенными для неё
    транспортом и каталогом; она никогда не объединяется с каноническим каталогом OpenAI.
    </Note>

    <Warning>
    Используйте Token Plan только для интерактивных сеансов OpenClaw. Не выбирайте его для
    заданий Cron, автоматических скриптов или серверной части приложений. Alibaba указывает, что
    неинтерактивное использование может привести к приостановке подписки или отзыву её ключа API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Лучше всего подходит для:** использования токена Qwen Portal с `https://portal.qwen.ai/v1`.

    Информацию о специализированном провайдере и примечания по миграции см. на странице
    [Qwen OAuth / Portal](/ru/providers/qwen-oauth).

    <Steps>
      <Step title="Укажите токен портала">
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
    Qwen Cloud, но при настройке через первоначальную настройку OpenClaw сохраняет данные аутентификации
    под идентификатором провайдера `qwen-oauth`.
    </Note>

  </Tab>
</Tabs>

## Типы планов и конечные точки

| План                                  | Регион    | Выбор способа аутентификации | Конечная точка                                                    |
| ------------------------------------- | --------- | ---------------------------- | ----------------------------------------------------------------- |
| Coding Plan (подписка)                | Китай     | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`                                                |
| Coding Plan (подписка)                | Глобальный | `qwen-api-key`          | `coding-intl.dashscope.aliyuncs.com/v1`                                                |
| Qwen Portal                           | Глобальный | `qwen-oauth`          | `portal.qwen.ai/v1`                                                |
| Standard (с оплатой по мере использования) | Китай | `qwen-standard-api-key-cn`        | `dashscope.aliyuncs.com/compatible-mode/v1`                                                |
| Standard (с оплатой по мере использования) | Глобальный | `qwen-standard-api-key`   | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                                                |
| Token Plan (командная редакция)       | Китай     | `qwen-token-plan-cn`           | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`                                                |
| Token Plan (командная редакция)       | Глобальный | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`                                                |

Провайдер автоматически выбирает конечную точку в зависимости от выбранного способа аутентификации. Канонические
варианты относятся к семейству `qwen-*`; `modelstudio-*` сохраняется только для совместимости.
Переопределить выбор можно с помощью пользовательского значения `baseUrl` в конфигурации.

<Tip>
**Управление ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документация:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Встроенный каталог

OpenClaw поставляется с этим статическим каталогом Qwen. Каталог учитывает конечную точку: в конфигурациях Coding
Plan отсутствуют модели, которые работают только с конечной точкой Standard.

| Ссылка на модель              | Входные данные | Контекст  | Примечания                     |
| ----------------------------- | -------------- | --------- | ------------------------------ |
| `qwen/qwen3.5-plus`            | текст, изображение | 1,000,000 | Модель по умолчанию         |
| `qwen/qwen3.6-flash`            | текст, изображение | 1,000,000 | Только конечные точки Standard |
| `qwen/qwen3.6-plus`            | текст, изображение | 1,000,000 | Coding Plan + Standard      |
| `qwen/qwen3.7-max`            | текст          | 1,000,000 | Только конечные точки Standard |
| `qwen/qwen3.7-plus`            | текст, изображение | 1,000,000 | Coding Plan + Standard      |
| `qwen/qwen3-max-2026-01-23`            | текст          | 262,144   | Линейка Qwen Max                |
| `qwen/qwen3-coder-next`            | текст          | 262,144   | Программирование                |
| `qwen/qwen3-coder-plus`            | текст          | 1,000,000 | Программирование                |
| `qwen/MiniMax-M2.5`            | текст          | 1,000,000 | Рассуждение включено            |
| `qwen/glm-5`            | текст          | 202,752   | GLM                             |
| `qwen/glm-4.7`            | текст          | 202,752   | GLM                             |
| `qwen/kimi-k2.5`            | текст, изображение | 262,144 | Moonshot AI через Alibaba    |
| `qwen-oauth/qwen3.5-plus`            | текст, изображение | 1,000,000 | Модель Qwen Portal по умолчанию |

<Note>
Доступность может различаться в зависимости от конечной точки и тарифного плана, даже если модель
присутствует в статическом каталоге.
</Note>

### Каталог Token Plan

Token Plan использует отдельный список разрешённых точных строк. Модели плана, предназначенные только
для создания изображений, здесь не включены, поскольку они используют другие API.

| Ссылка на модель              | Входные данные | Контекст  |
| ----------------------------- | -------------- | --------- |
| `qwen-token-plan/qwen3.7-max`            | текст          | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`            | текст, изображение | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`            | текст, изображение | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`            | текст, изображение | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`            | текст          | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash`            | текст          | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`            | текст          | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`            | текст, изображение | 262,144 |
| `qwen-token-plan/kimi-k2.6`            | текст, изображение | 262,144 |
| `qwen-token-plan/kimi-k2.5`            | текст, изображение | 262,144 |
| `qwen-token-plan/glm-5.2`            | текст          | 1,000,000 |
| `qwen-token-plan/glm-5.1`            | текст          | 202,752   |
| `qwen-token-plan/glm-5`            | текст          | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`            | текст          | 196,608   |

## Управление рассуждением

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` и `qwen3.6-plus`
поддерживают рассуждение во встроенном каталоге. Для моделей с рассуждением семейства `qwen`
провайдер сопоставляет уровни мышления OpenClaw с флагом запроса верхнего уровня
`enable_thinking` в DashScope: при отключённом мышлении отправляется `enable_thinking: false`,
при любом другом уровне — `enable_thinking: true`. Для пользовательских моделей можно включить
альтернативную полезную нагрузку мышления шаблона чата, задав
`compat.thinkingFormat: "qwen-chat-template"` в записи модели.

Модели Token Plan также помечены как поддерживающие рассуждение. `kimi-k2.7-code` и
`MiniMax-M2.5` работают только с мышлением, поэтому OpenClaw сохраняет мышление включённым, даже когда
сеанс запрашивает `/think off`. DeepSeek V4 сопоставляет уровни от `minimal` до `high` с
интенсивностью `high` сервиса, а `xhigh` или `max` — с `max`. GLM 5.2 принимает
полный диапазон от `minimal` до `max`; GLM 5.1 и GLM 5 принимают значения до
`xhigh`, а для всех трёх по умолчанию используется `high`. Другие гибридные модели следуют
запрошенному состоянию включения или отключения.

## Мультимодальные дополнения

Плагин `qwen` предоставляет мультимодальные возможности только через **стандартные** конечные точки
DashScope, но не через конечные точки Coding Plan:

- **Анализ изображений и видео** через `qwen-vl-max-latest`
- **Генерация видео Wan** через `wan2.6-t2v` (по умолчанию), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Аутентификация для анализа медиаданных автоматически определяется из настроенной аутентификации Qwen;
дополнительная настройка не требуется. Чтобы анализ медиаданных работал,
используйте стандартную конечную точку с оплатой по мере использования.

Чтобы сделать Qwen видеопровайдером по умолчанию:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Ограничения генерации видео: 1 выходное видео на запрос, не более 1 входного изображения
(изображение в видео), не более 4 входных видео (видео в видео), максимальная длительность —
10 секунд. Поддерживаются `size`, `aspectRatio`, `resolution`, `audio` и
`watermark`. Для входных референсных изображений и видео требуются удалённые URL-адреса http(s); локальные
пути к файлам отклоняются заранее, поскольку конечная точка видео DashScope не принимает
загруженные локальные буферы для таких референсов.

<Note>
Общие параметры инструмента, выбор провайдера и поведение при переключении после сбоя описаны в разделе [Генерация видео](/ru/tools/video-generation).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Доступность Qwen 3.6 и 3.7">
    `qwen3.7-plus` и `qwen3.6-plus` доступны через конечные точки Coding Plan и Standard. `qwen3.7-max` и `qwen3.6-flash` доступны только через Standard. Конечные точки Standard с оплатой по мере использования:

    - Китай: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Глобальная: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw исключает `qwen3.7-max` и `qwen3.6-flash` из каталогов Coding Plan.
    Если конечная точка Coding Plan возвращает ошибку «модель не поддерживается» для одной из них,
    переключитесь на соответствующую конечную точку Standard и ключ.

  </Accordion>

  <Accordion title="Региональная маршрутизация генерации видео">
    Перед отправкой задания генерации видео OpenClaw сопоставляет настроенный регион Qwen
    с соответствующим хостом DashScope AIGC:

    - Глобальный/международный: `https://dashscope-intl.aliyuncs.com`
    - Китай: `https://dashscope.aliyuncs.com`

    Обычный `models.providers.qwen.baseUrl`, указывающий на хосты Qwen
    Coding Plan или Standard, по-прежнему направляет генерацию видео
    на соответствующую региональную конечную точку видео DashScope.

  </Accordion>

  <Accordion title="Совместимость использования в потоковом режиме">
    Собственные конечные точки Qwen заявляют о совместимости сведений об использовании в потоковом режиме для общего
    транспорта `openai-completions`, поэтому идентификаторы пользовательских провайдеров, совместимых с DashScope
    и нацеленных на те же собственные хосты, наследуют такое же поведение без обязательного использования
    встроенного идентификатора провайдера `qwen`. Это относится к конечным точкам Coding Plan,
    Standard и Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="План возможностей">
    Плагин `qwen` позиционируется как основная точка поставщика для всей поверхности Qwen
    Cloud, а не только для моделей программирования и текста.

    - **Текстовые модели и модели чата:** доступны через плагин
    - **Вызов инструментов, структурированный вывод, мышление:** наследуются от транспорта, совместимого с OpenAI
    - **Генерация изображений:** запланирована на уровне плагина провайдера
    - **Анализ изображений и видео:** доступен через плагин на конечной точке Standard
    - **Речь и аудио:** запланированы на уровне плагина провайдера
    - **Эмбеддинги и переранжирование памяти:** запланированы через интерфейс адаптера эмбеддингов
    - **Генерация видео:** доступна через плагин посредством общей возможности генерации видео

  </Accordion>

  <Accordion title="Настройка окружения и демона">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что `QWEN_API_KEY`
    или `QWEN_TOKEN_PLAN_API_KEY` доступен этому процессу (например, в
    `~/.openclaw/.env` или через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры видеоинструмента и выбор провайдера.
  </Card>
  <Card title="Alibaba Model Studio" href="/ru/providers/alibaba" icon="cloud">
    Встроенный провайдер генерации видео Wan на той же платформе DashScope.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие рекомендации по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
