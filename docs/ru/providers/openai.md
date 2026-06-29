---
read_when:
    - Вы хотите использовать модели OpenAI в OpenClaw
    - Вы хотите использовать аутентификацию подписки Codex вместо ключей API
    - Вам нужно более строгое поведение выполнения агента GPT-5
summary: Используйте OpenAI через API-ключи или подписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-28T23:38:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI предоставляет API для разработчиков для моделей GPT, а Codex также доступен как
агент для программирования в рамках плана ChatGPT через клиенты Codex от OpenAI. OpenClaw использует один
идентификатор провайдера, `openai`, для обеих форм аутентификации.

OpenClaw использует `openai/*` как канонический маршрут моделей OpenAI. Встроенные
ходы агента на моделях OpenAI по умолчанию выполняются через нативную среду выполнения Codex app-server;
прямая аутентификация по API-ключу OpenAI остается доступной для неагентских поверхностей OpenAI,
таких как изображения, эмбеддинги, речь и realtime.

- **Модели агентов** - модели `openai/*` через среду выполнения Codex; войдите с
  аутентификацией Codex для использования подписки ChatGPT/Codex или настройте Codex-совместимый
  резервный API-ключ OpenAI, когда вы намеренно хотите аутентификацию по API-ключу.
- **Неагентские API OpenAI** - прямой доступ к OpenAI Platform с оплатой
  по использованию через `OPENAI_API_KEY` или онбординг API-ключа OpenAI.
- **Устаревшая конфигурация** - устаревшие ссылки на модели Codex исправляются
  `openclaw doctor --fix` на `openai/*` плюс среду выполнения Codex.

OpenAI явно поддерживает использование OAuth подписки во внешних инструментах и рабочих процессах, таких как OpenClaw.

Провайдер, модель, среда выполнения и канал - отдельные уровни. Если эти метки
начинают смешиваться, прочитайте [Среды выполнения агентов](/ru/concepts/agent-runtimes) перед
изменением конфигурации.

## Быстрый выбор

| Цель                                                 | Использовать                                             | Примечания                                                            |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Подписка ChatGPT/Codex с нативной средой выполнения Codex | `openai/gpt-5.5`                                         | Настройка агента OpenAI по умолчанию. Войдите с аутентификацией Codex. |
| Прямая тарификация по API-ключу для моделей агентов  | `openai/gpt-5.5` плюс Codex-совместимый профиль API-ключа | Используйте `auth.order.openai`, чтобы разместить резерв после аутентификации подписки. |
| Прямая тарификация по API-ключу через явный OpenClaw | `openai/gpt-5.5` плюс среда выполнения провайдера/модели `openclaw` | Выберите обычный профиль API-ключа `openai`.                          |
| Последний API-псевдоним ChatGPT Instant              | `openai/chat-latest`                                     | Только прямой API-ключ. Перемещаемый псевдоним для экспериментов, не значение по умолчанию. |
| Аутентификация подписки ChatGPT/Codex через OpenClaw | `openai/gpt-5.5` плюс среда выполнения провайдера/модели `openclaw` | Выберите OAuth-профиль `openai` для маршрута совместимости.           |
| Генерация или редактирование изображений             | `openai/gpt-image-2`                                     | Работает либо с `OPENAI_API_KEY`, либо с OpenAI Codex OAuth.          |
| Изображения с прозрачным фоном                       | `openai/gpt-image-1.5`                                   | Используйте `outputFormat=png` или `webp` и `openai.background=transparent`. |

## Карта имен

Названия похожи, но не взаимозаменяемы:

| Видимое имя                              | Уровень           | Значение                                                                                          |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Префикс провайдера | Канонический маршрут моделей OpenAI; ходы агента используют среду выполнения Codex.               |
| устаревший префикс OpenAI Codex         | Устаревший префикс | Старое пространство имен моделей/профилей. `openclaw doctor --fix` мигрирует его на `openai`.     |
| `codex` Plugin                          | Plugin            | Встроенный Plugin OpenClaw, предоставляющий нативную среду выполнения Codex app-server и элементы управления чатом `/codex`. |
| provider/model `agentRuntime.id: codex` | Среда выполнения агента | Принудительно включает нативный harness Codex app-server для совпадающих встроенных ходов.        |
| `/codex ...`                            | Набор команд чата | Привязывать/управлять потоками Codex app-server из разговора.                                     |
| `runtime: "acp", agentId: "codex"`      | Маршрут сеанса ACP | Явный резервный путь, запускающий Codex через ACP/acpx.                                          |

Это означает, что конфигурация может намеренно содержать ссылки на модели `openai/*`, тогда как
профили аутентификации указывают либо на учетные данные API-ключа, либо на OAuth ChatGPT/Codex. Используйте
`auth.order.openai` для конфигурации; `openclaw doctor --fix` переписывает устаревшие
ссылки на модели Codex, устаревшие идентификаторы профилей аутентификации Codex и
устаревший порядок аутентификации Codex на канонический маршрут OpenAI.

<Note>
GPT-5.5 доступна как через прямой доступ по API-ключу OpenAI Platform, так и через
маршруты подписки/OAuth. Для подписки ChatGPT/Codex плюс нативного выполнения Codex
используйте `openai/gpt-5.5`; неустановленная конфигурация среды выполнения теперь выбирает harness Codex
для ходов агента OpenAI. Используйте профили API-ключа OpenAI только когда вам нужна
прямая аутентификация по API-ключу для модели агента OpenAI.
</Note>

<Note>
Ходы моделей агента OpenAI требуют встроенный Plugin Codex app-server. Явная
конфигурация среды выполнения OpenClaw остается доступной как опциональный маршрут совместимости. Когда OpenClaw
явно выбран с OAuth-профилем `openai`, OpenClaw сохраняет
публичную ссылку на модель как `openai/*` и внутри маршрутизирует через транспорт
аутентификации Codex. Запустите `openclaw doctor --fix`, чтобы исправить устаревшие
ссылки на модели Codex, `codex-cli/*` или старые привязки сеансов среды выполнения, которые не происходят из
явной конфигурации среды выполнения.
</Note>

## Покрытие возможностей OpenClaw

| Возможность OpenAI       | Поверхность OpenClaw                                                                          | Статус                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Чат / Responses           | провайдер моделей `openai/<model>`                                                            | Да                                                                     |
| Модели подписки Codex     | `openai/<model>` с OpenAI OAuth                                                               | Да                                                                     |
| Устаревшие ссылки на модели Codex | устаревшие ссылки на модели Codex или `codex-cli/<model>`                              | Исправляются doctor на `openai/<model>`                                |
| Harness Codex app-server  | `openai/<model>` с пропущенной средой выполнения или provider/model `agentRuntime.id: codex`  | Да                                                                     |
| Серверный веб-поиск       | Нативный инструмент OpenAI Responses                                                          | Да, когда веб-поиск включен и провайдер не закреплен                  |
| Изображения               | `image_generate`                                                                              | Да                                                                     |
| Видео                     | `video_generate`                                                                              | Да                                                                     |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                                                     | Да                                                                     |
| Пакетное speech-to-text   | `tools.media.audio` / понимание медиа                                                         | Да                                                                     |
| Потоковое speech-to-text  | Voice Call `streaming.provider: "openai"`                                                     | Да                                                                     |
| Realtime-голос            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Да (требуются кредиты OpenAI Platform, а не подписка Codex/ChatGPT)   |
| Эмбеддинги                | провайдер эмбеддингов памяти                                                                  | Да                                                                     |

<Note>
  Realtime-голос OpenAI (используется Voice Call с `realtime.provider: "openai"` и
  Control UI Talk с `talk.realtime.provider: "openai"`) проходит через
  публичный **OpenAI Platform Realtime API**, который тарифицируется за счет кредитов OpenAI
  Platform, а не квоты подписки Codex/ChatGPT. Учетной записи
  с исправным OpenAI OAuth, которая без проблем запускает чат-модели на базе Codex,
  все равно нужен профиль аутентификации API-ключа OpenAI или API-ключ Platform с пополненным
  биллингом Platform для Realtime-голоса.

Исправление: пополните кредиты Platform на
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
для организации, на которой основаны ваши учетные данные realtime. Realtime-голос принимает
профиль аутентификации API-ключа `openai`, созданный `openclaw onboard --auth-choice openai-api-key`,
Platform `OPENAI_API_KEY`, настроенный через `talk.realtime.providers.openai.apiKey`
для Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
для Voice Call, или переменную окружения `OPENAI_API_KEY`. OAuth-профили OpenAI
все еще могут запускать чат-модели `openai/*` на базе Codex в той же
установке OpenClaw, но они не настраивают Realtime-голос.
</Note>

## Эмбеддинги памяти

OpenClaw может использовать OpenAI или OpenAI-совместимую конечную точку эмбеддингов для
индексации `memory_search` и эмбеддингов запросов:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Для OpenAI-совместимых конечных точек, которым требуются асимметричные метки эмбеддингов, задайте
`queryInputType` и `documentInputType` в `memorySearch`. OpenClaw передает
их как специфичные для провайдера поля запроса `input_type`: эмбеддинги запросов используют
`queryInputType`; индексированные фрагменты памяти и пакетная индексация используют
`documentInputType`. Полный пример см. в [справочнике по конфигурации памяти](/ru/reference/memory-config#provider-specific-config).

## Начало работы

Выберите предпочтительный метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Лучше всего для:** прямого доступа к API и тарификации по использованию.

    <Steps>
      <Step title="Получите свой API-ключ">
        Создайте или скопируйте API-ключ из [панели OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустите онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Проверьте, что модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Сводка маршрутов

    | Ссылка на модель       | Конфигурация среды выполнения | Маршрут                     | Аутентификация  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitted / provider/model `agentRuntime.id: "codex"` | Harness Codex app-server | Codex-совместимый профиль OpenAI |
    | `openai/gpt-5.4-mini` | omitted / provider/model `agentRuntime.id: "codex"` | Harness Codex app-server | Codex-совместимый профиль OpenAI |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | Встроенная среда выполнения OpenClaw | Выбранный профиль `openai` |

    <Note>
    Модели агентов `openai/*` используют harness сервера приложения Codex. Чтобы использовать
    аутентификацию по API-ключу для модели агента, создайте совместимый с Codex профиль API-ключа и упорядочьте
    его через `auth.order.openai`; `OPENAI_API_KEY` остается прямым резервным вариантом для
    поверхностей OpenAI API, не относящихся к агентам. Запустите `openclaw doctor --fix`, чтобы перенести старые
    устаревшие записи порядка аутентификации Codex.
    </Note>

    ### Пример конфигурации

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Чтобы попробовать текущую модель Instant из ChatGPT через OpenAI API, задайте модель
    как `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` — плавающий псевдоним. OpenAI документирует его как последнюю модель Instant,
    используемую в ChatGPT, и рекомендует `gpt-5.5` для промышленного использования API, поэтому
    оставляйте `openai/gpt-5.5` стабильным значением по умолчанию, если только вам явно не нужно
    поведение этого псевдонима. Сейчас псевдоним принимает только `medium` для степени подробности текста, поэтому
    OpenClaw нормализует несовместимые переопределения степени подробности текста OpenAI для этой
    модели.

    <Warning>
    OpenClaw **не** предоставляет `gpt-5.3-codex-spark` в прямом маршруте OpenAI с API-ключом. Она доступна только через записи каталога подписки Codex, если ваш аккаунт, в который выполнен вход, ее предоставляет.
    </Warning>

  </Tab>

  <Tab title="Подписка Codex">
    **Лучше всего подходит для:** использования вашей подписки ChatGPT/Codex с нативным выполнением через сервер приложения Codex вместо отдельного API-ключа. Для облака Codex требуется вход в ChatGPT.

    <Steps>
      <Step title="Запустите OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Или запустите OAuth напрямую:

        ```bash
        openclaw models auth login --provider openai
        ```

        Для безголовых или несовместимых с callback настроек добавьте `--device-code`, чтобы войти через поток кода устройства ChatGPT вместо браузерного callback на localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Используйте канонический маршрут модели OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Для пути по умолчанию конфигурация runtime не требуется. Ходы агента OpenAI
        автоматически выбирают нативный runtime сервера приложения Codex, а OpenClaw
        устанавливает или восстанавливает встроенный Plugin Codex, когда выбран этот маршрут.
      </Step>
      <Step title="Проверьте доступность аутентификации Codex">
        ```bash
        openclaw models list --provider openai
        ```

        После запуска Gateway отправьте `/codex status` или `/codex models`
        в чат, чтобы проверить нативный runtime сервера приложения.
      </Step>
    </Steps>

    ### Сводка маршрутов

    | Ссылка на модель | Конфигурация runtime | Маршрут | Аутентификация |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | опущена / provider/model `agentRuntime.id: "codex"` | Нативный harness сервера приложения Codex | Вход Codex или упорядоченный профиль аутентификации `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Встроенный runtime OpenClaw с внутренним транспортом аутентификации Codex | Выбранный профиль OAuth `openai` |
    | устаревшая ссылка Codex GPT-5.5 | исправляется doctor | Устаревший маршрут переписывается в `openai/gpt-5.5` | Перенесенный профиль OAuth OpenAI |
    | `codex-cli/gpt-5.5` | исправляется doctor | Устаревший маршрут CLI переписывается в `openai/gpt-5.5` | Аутентификация сервера приложения Codex |

    <Warning>
    Предпочитайте `openai/gpt-5.5` для новой конфигурации агента на базе подписки. Старые
    устаревшие ссылки Codex GPT — это устаревшие маршруты OpenClaw, а не нативный путь runtime Codex;
    запустите `openclaw doctor --fix`, когда захотите перенести их на канонические
    ссылки `openai/*`. `gpt-5.3-codex-spark` остается доступной только аккаунтам, чей
    каталог подписки Codex объявляет эту модель; прямые ссылки OpenAI с API-ключом и
    Azure для нее по-прежнему скрыты.
    </Warning>

    <Note>
    Устаревший префикс модели Codex — это устаревшая конфигурация, исправляемая doctor. Для
    распространенной настройки подписки плюс нативного runtime войдите с аутентификацией Codex,
    но оставьте ссылку на модель как `openai/gpt-5.5`. В новой конфигурации порядок аутентификации
    агента OpenAI должен находиться в `auth.order.openai`; doctor переносит старые
    устаревшие записи порядка аутентификации Codex.
    </Note>

    ### Пример конфигурации

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    При резервном API-ключе оставьте модель на `openai/gpt-5.5` и поместите
    порядок аутентификации в `openai`. OpenClaw сначала попробует подписку, затем
    API-ключ, оставаясь на harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding больше не импортирует материалы OAuth из `~/.codex`. Войдите через браузерный OAuth (по умолчанию) или через поток кода устройства выше — OpenClaw управляет полученными учетными данными в собственном хранилище аутентификации агентов.
    </Note>

    ### Проверка и восстановление маршрутизации OAuth Codex

    Используйте эти команды, чтобы увидеть, какие модель, runtime и маршрут аутентификации использует ваш агент
    по умолчанию:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Для конкретного агента добавьте `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Если в старой конфигурации все еще есть устаревшие ссылки Codex GPT или устаревшее закрепление сессии runtime OpenAI
    без явной конфигурации runtime, исправьте это:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Если `models auth list --provider openai` не показывает пригодного профиля, войдите
    снова:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Используйте `--profile-id`, когда вам нужно несколько входов OAuth Codex в одном
    агенте и позже нужно управлять ими через порядок аутентификации или `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` — это маршрут модели для ходов агента OpenAI через Codex. Запустите
    `openclaw doctor --fix`, чтобы перенести старые устаревшие идентификаторы профилей с префиксом OpenAI Codex и
    записи порядка перед тем, как полагаться на упорядочивание профилей.

    ### Индикатор состояния

    Чат `/status` показывает, какой runtime модели активен для текущей сессии.
    Встроенный harness сервера приложения Codex отображается как `Runtime: OpenAI Codex` для
    ходов модели агента OpenAI. Устаревшие закрепления сессии runtime OpenAI исправляются на Codex, если только
    конфигурация явно не закрепляет OpenClaw.

    ### Предупреждение doctor

    Если устаревшие ссылки моделей Codex или устаревшие закрепления runtime OpenAI остаются в конфигурации или
    состоянии сессии, `openclaw doctor --fix` переписывает их в `openai/*` с
    runtime Codex, если OpenClaw не настроен явно.

    ### Лимит окна контекста

    OpenClaw рассматривает метаданные модели и лимит контекста runtime как отдельные значения.

    Для `openai/gpt-5.5` через каталог OAuth Codex:

    - Нативный `contextWindow`: `1000000`
    - Лимит runtime `contextTokens` по умолчанию: `272000`

    Меньший лимит по умолчанию на практике дает лучшую задержку и качество. Переопределите его с помощью `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Используйте `contextWindow`, чтобы объявить нативные метаданные модели. Используйте `contextTokens`, чтобы ограничить бюджет контекста runtime.
    </Note>

    ### Восстановление каталога

    OpenClaw использует upstream-метаданные каталога Codex для `gpt-5.5`, когда они
    присутствуют. Если live-обнаружение Codex пропускает строку `gpt-5.5`, пока
    аккаунт аутентифицирован, OpenClaw синтезирует эту строку модели OAuth, чтобы
    запуски cron, подагента и настроенной модели по умолчанию не завершались ошибкой
    `Unknown model`.

  </Tab>
</Tabs>

## Нативная аутентификация сервера приложения Codex

Нативный harness сервера приложения Codex использует ссылки моделей `openai/*` плюс опущенную
конфигурацию runtime или provider/model `agentRuntime.id: "codex"`, но его аутентификация
по-прежнему основана на аккаунте. OpenClaw выбирает аутентификацию в таком порядке:

1. Упорядоченные профили аутентификации OpenAI для агента, предпочтительно в
   `auth.order.openai`. Запустите `openclaw doctor --fix`, чтобы перенести старые
   устаревшие идентификаторы профилей аутентификации Codex и устаревший порядок аутентификации Codex.
2. Существующий аккаунт сервера приложения, например локальный вход ChatGPT в Codex CLI.
3. Только для локальных запусков stdio сервера приложения: `CODEX_API_KEY`, затем
   `OPENAI_API_KEY`, когда сервер приложения сообщает об отсутствии аккаунта и все еще требует
   аутентификацию OpenAI.

Это означает, что локальный вход с подпиской ChatGPT/Codex не заменяется только
потому, что у процесса Gateway также есть `OPENAI_API_KEY` для прямых моделей OpenAI
или эмбеддингов. Резервный env API-ключ используется только для локального пути stdio без аккаунта; он
не отправляется в WebSocket-соединения сервера приложения. Когда выбран профиль Codex
в стиле подписки, OpenClaw также не передает `CODEX_API_KEY` и `OPENAI_API_KEY`
в дочерний процесс stdio сервера приложения и отправляет выбранные учетные данные
через RPC входа сервера приложения. Когда этот профиль подписки заблокирован
лимитом использования Codex, OpenClaw может переключиться на следующий упорядоченный профиль API-ключа `openai:*`
без изменения выбранной модели или выхода из harness Codex. После времени сброса подписки профиль подписки снова
становится доступным.

## Генерация изображений

Встроенный Plugin `openai` регистрирует генерацию изображений через инструмент `image_generate`.
Он поддерживает как генерацию изображений по API-ключу OpenAI, так и генерацию изображений через OAuth Codex
через одну и ту же ссылку модели `openai/gpt-image-2`.

| Возможность                | API-ключ OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ссылка на модель                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Аутентификация                      | `OPENAI_API_KEY`                   | Вход OAuth OpenAI Codex           |
| Транспорт                 | OpenAI Images API                  | Backend Codex Responses              |
| Максимум изображений на запрос    | 4                                  | 4                                    |
| Режим редактирования                 | Включен (до 5 референсных изображений) | Включен (до 5 референсных изображений)   |
| Переопределения размера            | Поддерживаются, включая размеры 2K/4K   | Поддерживаются, включая размеры 2K/4K     |
| Соотношение сторон / разрешение | Не передается в OpenAI Images API | Сопоставляется с поддерживаемым размером, когда это безопасно |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
См. [Генерация изображений](/ru/tools/image-generation) для общих параметров инструмента, выбора провайдера и поведения failover.
</Note>

`gpt-image-2` используется по умолчанию как для генерации изображений по тексту OpenAI, так и для
редактирования изображений. `gpt-image-1.5`, `gpt-image-1` и `gpt-image-1-mini` остаются доступными как
явные переопределения модели. Используйте `openai/gpt-image-1.5` для вывода PNG/WebP с прозрачным фоном;
текущий API `gpt-image-2` отклоняет
`background: "transparent"`.

Для запроса с прозрачным фоном agents должны вызывать `image_generate` с
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` или `"webp"` и
`background: "transparent"`; более старый параметр провайдера `openai.background`
по-прежнему принимается. OpenClaw также защищает публичные маршруты OAuth OpenAI и
OpenAI Codex, переписывая прозрачные запросы по умолчанию `openai/gpt-image-2`
на `gpt-image-1.5`; Azure и пользовательские OpenAI-совместимые конечные точки
сохраняют настроенные имена развертываний/моделей.

Та же настройка доступна для headless-запусков CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Используйте те же флаги `--output-format` и `--background` с
`openclaw infer image edit`, когда начинаете с входного файла.
`--openai-background` остается доступным как OpenAI-специфичный псевдоним.
Используйте `--quality low|medium|high|auto`, когда нужно управлять качеством и
стоимостью OpenAI Images. Используйте `--openai-moderation low|auto`, чтобы
передать OpenAI специфичную для провайдера подсказку модерации из `image generate`
или `image edit`.

Для установок ChatGPT/Codex OAuth сохраняйте ту же ссылку `openai/gpt-image-2`. Когда настроен
OAuth-профиль `openai`, OpenClaw разрешает сохраненный OAuth-токен доступа и
отправляет запросы изображений через backend Codex Responses. Он не пытается
сначала использовать `OPENAI_API_KEY` и не выполняет тихий откат к API-ключу для
этого запроса. Настройте `models.providers.openai` явно с API-ключом,
пользовательским базовым URL или конечной точкой Azure, когда нужен прямой
маршрут OpenAI Images API.
Если эта пользовательская конечная точка изображений находится в доверенной LAN/частной адресации, также задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw оставляет
частные/внутренние OpenAI-совместимые конечные точки изображений заблокированными, если это явное согласие
не присутствует.

Сгенерировать:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Сгенерировать прозрачный PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Редактировать:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерация видео

Встроенный Plugin `openai` регистрирует генерацию видео через инструмент `video_generate`.

| Возможность          | Значение                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Модель по умолчанию  | `openai/sora-2`                                                                   |
| Режимы               | Текст-в-видео, изображение-в-видео, редактирование одного видео                   |
| Входные референсы    | 1 изображение или 1 видео                                                         |
| Переопределения размера | Поддерживаются для текста-в-видео и изображения-в-видео                        |
| Другие переопределения | `aspectRatio`, `resolution`, `audio`, `watermark` игнорируются с предупреждением инструмента |

Запросы OpenAI изображение-в-видео используют `POST /v1/videos` с изображением
`input_reference`. Редактирование одного видео использует `POST /v1/videos/edits` с
загруженным видео в поле `video`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
См. [Генерация видео](/ru/tools/video-generation) для общих параметров инструмента, выбора провайдера и поведения failover.
</Note>

## Вклад в промпт GPT-5

OpenClaw добавляет общий вклад в промпт GPT-5 для запусков семейства GPT-5 на поверхностях промптов, собранных OpenClaw. Он применяется по id модели, поэтому маршруты OpenClaw/провайдеров, такие как устаревшие ссылки до исправления (устаревшая ссылка Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` и другие совместимые ссылки GPT-5 получают тот же overlay. Более старые модели GPT-4.x не получают его.

Встроенный нативный harness Codex не получает этот GPT-5 overlay OpenClaw через developer instructions сервера приложения Codex. Нативный Codex сохраняет принадлежащее Codex поведение base, model и project-doc, а OpenClaw отключает встроенную personality Codex для нативных threads, чтобы файлы personality рабочей области agent оставались авторитетными. OpenClaw добавляет только runtime-контекст, такой как доставка канала, динамические инструменты OpenClaw, делегирование ACP, контекст рабочей области и OpenClaw Skills.

Вклад GPT-5 добавляет помеченный контракт поведения для сохранения persona, безопасности выполнения, дисциплины инструментов, формы вывода, проверок завершения и верификации на соответствующих промптах, собранных OpenClaw. Поведение ответов, специфичное для каналов, и silent-message остается в общем системном промпте OpenClaw и политике исходящей доставки. Дружественный слой стиля взаимодействия отделен и настраивается.

| Значение              | Эффект                                      |
| --------------------- | ------------------------------------------- |
| `"friendly"` (по умолчанию) | Включить дружественный слой стиля взаимодействия |
| `"on"`                | Псевдоним для `"friendly"`                  |
| `"off"`               | Отключить только дружественный слой стиля   |

<Tabs>
  <Tab title="Конфиг">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Значения не чувствительны к регистру во время выполнения, поэтому `"Off"` и `"off"` оба отключают дружественный слой стиля.
</Tip>

<Note>
Устаревший `plugins.entries.openai.config.personality` по-прежнему читается как fallback совместимости, когда общая настройка `agents.defaults.promptOverlays.gpt5.personality` не задана.
</Note>

## Голос и речь

<AccordionGroup>
  <Accordion title="Синтез речи (TTS)">
    Встроенный Plugin `openai` регистрирует синтез речи для поверхности `messages.tts`.

    | Настройка | Путь конфига | По умолчанию |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Скорость | `messages.tts.providers.openai.speed` | (не задано) |
    | Инструкции | `messages.tts.providers.openai.instructions` | (не задано, только `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосовых заметок, `mp3` для файлов |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Откатывается к `OPENAI_API_KEY` |
    | Базовый URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Дополнительное тело | `messages.tts.providers.openai.extraBody` / `extra_body` | (не задано) |

    Доступные модели: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступные голоса: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` объединяется с JSON запроса `/audio/speech` после сгенерированных OpenClaw полей, поэтому используйте его для OpenAI-совместимых конечных точек, которым требуются дополнительные ключи, такие как `lang`. Prototype-ключи игнорируются.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Задайте `OPENAI_TTS_BASE_URL`, чтобы переопределить базовый URL TTS без влияния на конечную точку chat API. OpenAI TTS и Realtime voice оба настраиваются через API-ключ OpenAI Platform; установки только с OAuth по-прежнему могут использовать chat-модели на базе Codex, но не OpenAI live talk-back.
    </Note>

  </Accordion>

  <Accordion title="Речь-в-текст">
    Встроенный Plugin `openai` регистрирует пакетное распознавание речь-в-текст через
    поверхность транскрипции media-understanding OpenClaw.

    - Модель по умолчанию: `gpt-4o-transcribe`
    - Конечная точка: OpenAI REST `/v1/audio/transcriptions`
    - Путь ввода: загрузка multipart-аудиофайла
    - Поддерживается OpenClaw везде, где входящая аудиотранскрипция использует
      `tools.media.audio`, включая сегменты голосовых каналов Discord и
      аудиовложения каналов

    Чтобы принудительно использовать OpenAI для входящей аудиотранскрипции:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Подсказки языка и промпта пересылаются в OpenAI, когда они предоставлены
    общей конфигурацией audio media или запросом транскрипции для конкретного вызова.

  </Accordion>

  <Accordion title="Realtime-транскрипция">
    Встроенный Plugin `openai` регистрирует realtime-транскрипцию для Plugin Voice Call.

    | Настройка | Путь конфига | По умолчанию |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Язык | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Длительность тишины | `...openai.silenceDurationMs` | `800` |
    | Порог VAD | `...openai.vadThreshold` | `0.5` |
    | Аутентификация | `...openai.apiKey`, `OPENAI_API_KEY` или OAuth `openai` | API-ключи подключаются напрямую; OAuth выпускает клиентский секрет Realtime-транскрипции |

    <Note>
    Использует WebSocket-соединение с `wss://api.openai.com/v1/realtime` с аудио G.711 u-law (`g711_ulaw` / `audio/pcmu`). Когда настроен только OAuth `openai`, Gateway выпускает эфемерный клиентский секрет Realtime-транскрипции перед открытием WebSocket. Этот streaming-провайдер предназначен для realtime-пути транскрипции Voice Call; голос Discord сейчас записывает короткие сегменты и вместо этого использует пакетный путь транскрипции `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Встроенный Plugin `openai` регистрирует realtime voice для Plugin Voice Call.

    | Настройка | Путь конфига | По умолчанию |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура (мост развертывания Azure) | `...openai.temperature` | `0.8` |
    | Порог VAD | `...openai.vadThreshold` | `0.5` |
    | Длительность тишины | `...openai.silenceDurationMs` | `500` |
    | Prefix padding | `...openai.prefixPaddingMs` | `300` |
    | Reasoning effort | `...openai.reasoningEffort` | (не задано) |
    | Аутентификация | API-key auth profile `openai`, `...openai.apiKey` или `OPENAI_API_KEY` | Требуется API-ключ OpenAI Platform; OpenAI OAuth не настраивает Realtime voice |

    Доступные встроенные Realtime-голоса для `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI рекомендует `marin` и `cedar` для лучшего качества Realtime. Это
    отдельный набор от голосов Text-to-speech выше; не предполагайте, что TTS-голос,
    такой как `fable`, `nova` или `onyx`, действителен для Realtime-сессий.

    <Note>
    Backend-мосты OpenAI realtime используют GA-форму WebSocket-сессии Realtime, которая не принимает `session.temperature`. Развертывания Azure OpenAI остаются доступными через `azureEndpoint` и `azureDeployment` и сохраняют совместимую с развертыванием форму сессии. Поддерживает двунаправленный вызов инструментов и аудио G.711 u-law.
    </Note>

    <Note>
    Realtime voice выбирается при создании сессии. OpenAI позволяет изменять большинство
    полей сессии позже, но голос нельзя изменить после того, как модель выдала аудио
    в этой сессии. OpenClaw сейчас раскрывает встроенные id Realtime voice как строки.
    </Note>

    <Note>
    Talk в Control UI использует браузерные сеансы OpenAI в реальном времени с
    выпущенным Gateway эфемерным клиентским секретом и прямым браузерным
    обменом WebRTC SDP с OpenAI Realtime API. Gateway выпускает этот клиентский
    секрет с выбранным профилем аутентификации API-ключа `openai` или
    настроенным API-ключом OpenAI Platform. Ретранслятор Gateway и realtime
    WebSocket-мосты бэкенда Voice Call используют тот же путь аутентификации
    только по API-ключу для нативных конечных точек OpenAI. Поддерживающая
    проверка вживую доступна с помощью
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ветки OpenAI проверяют и backend WebSocket bridge, и браузерный обмен
    WebRTC SDP без записи секретов в логи.
    </Note>

  </Accordion>
</AccordionGroup>

## Конечные точки Azure OpenAI

Встроенный провайдер `openai` может обращаться к ресурсу Azure OpenAI для
генерации изображений через переопределение базового URL. На пути генерации
изображений OpenClaw обнаруживает имена хостов Azure в
`models.providers.openai.baseUrl` и автоматически переключается на формат
запросов Azure.

<Note>
Голос в реальном времени использует отдельный путь конфигурации
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
и не зависит от `models.providers.openai.baseUrl`. Его настройки Azure см. в
аккордеоне **Голос в реальном времени** в разделе [Voice and speech](#voice-and-speech).
</Note>

Используйте Azure OpenAI, когда:

- У вас уже есть подписка, квота или корпоративное соглашение Azure OpenAI
- Вам нужны региональное размещение данных или средства контроля соответствия, которые предоставляет Azure
- Вы хотите удерживать трафик внутри существующего тенанта Azure

### Конфигурация

Для генерации изображений Azure через встроенный провайдер `openai` укажите
в `models.providers.openai.baseUrl` ваш ресурс Azure и задайте `apiKey` как
ключ Azure OpenAI (а не ключ OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw распознает эти суффиксы хостов Azure для маршрута генерации
изображений Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запросов генерации изображений на распознанном хосте Azure OpenClaw:

- Отправляет заголовок `api-key` вместо `Authorization: Bearer`
- Использует пути в области deployment (`/openai/deployments/{deployment}/...`)
- Добавляет `?api-version=...` к каждому запросу
- Использует стандартный тайм-аут запроса 600 с для вызовов генерации
  изображений Azure. Значения `timeoutMs` для отдельных вызовов по-прежнему
  переопределяют это значение по умолчанию.

Другие базовые URL (публичный OpenAI, OpenAI-совместимые прокси) сохраняют
стандартный формат запросов изображений OpenAI.

<Note>
Маршрутизация Azure для пути генерации изображений провайдера `openai`
требует OpenClaw 2026.4.22 или новее. Более ранние версии обрабатывают любой
пользовательский `openai.baseUrl` как публичную конечную точку OpenAI и
завершатся ошибкой при обращении к deployment изображений Azure.
</Note>

### Версия API

Задайте `AZURE_OPENAI_API_VERSION`, чтобы закрепить конкретную preview- или
GA-версию Azure для пути генерации изображений Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

По умолчанию используется `2024-12-01-preview`, если переменная не задана.

### Имена моделей — это имена deployment

Azure OpenAI привязывает модели к deployment. Для запросов генерации
изображений Azure, маршрутизируемых через встроенный провайдер `openai`, поле
`model` в OpenClaw должно быть **именем deployment Azure**, которое вы
настроили на портале Azure, а не публичным идентификатором модели OpenAI.

Если вы создаете deployment с именем `gpt-image-2-prod`, который обслуживает
`gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

То же правило имени deployment применяется к вызовам генерации изображений,
маршрутизируемым через встроенный провайдер `openai`.

### Региональная доступность

Генерация изображений Azure сейчас доступна только в части регионов
(например, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перед созданием deployment проверьте актуальный список регионов
Microsoft и подтвердите, что конкретная модель доступна в вашем регионе.

### Различия параметров

Azure OpenAI и публичный OpenAI не всегда принимают одинаковые параметры
изображений. Azure может отклонять параметры, которые разрешает публичный
OpenAI (например, некоторые значения `background` в `gpt-image-2`), или
предоставлять их только в конкретных версиях модели. Эти различия исходят от
Azure и базовой модели, а не от OpenClaw. Если запрос Azure завершается ошибкой
валидации, проверьте набор параметров, поддерживаемый вашим конкретным
deployment и версией API, на портале Azure.

<Note>
Azure OpenAI использует нативный транспорт и совместимое поведение, но не
получает скрытые заголовки атрибуции OpenClaw — см. аккордеон **Нативные и
OpenAI-совместимые маршруты** в разделе [Advanced configuration](#advanced-configuration).

Для трафика chat или Responses в Azure (за пределами генерации изображений)
используйте поток onboarding или выделенную конфигурацию провайдера Azure —
одного `openai.baseUrl` недостаточно, чтобы включить формат API/аутентификации
Azure. Существует отдельный провайдер `azure-openai-responses/*`; см.
аккордеон Server-side compaction ниже.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket и SSE)">
    OpenClaw для `openai/*` сначала использует WebSocket с резервным переходом на SSE (`"auto"`).

    В режиме `"auto"` OpenClaw:
    - Повторяет один ранний сбой WebSocket перед переходом на SSE
    - После сбоя помечает WebSocket как деградировавший примерно на 60 секунд и использует SSE во время охлаждения
    - Прикрепляет стабильные заголовки идентичности сеанса и хода для повторов и переподключений
    - Нормализует счетчики использования (`input_tokens` / `prompt_tokens`) между вариантами транспорта

    | Значение | Поведение |
    |-------|----------|
    | `"auto"` (по умолчанию) | Сначала WebSocket, резервный переход на SSE |
    | `"sse"` | Принудительно только SSE |
    | `"websocket"` | Принудительно только WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Связанная документация OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Быстрый режим">
    OpenClaw предоставляет общий переключатель быстрого режима для `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Конфигурация:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Когда он включен, OpenClaw сопоставляет быстрый режим с приоритетной обработкой OpenAI (`service_tier = "priority"`). Существующие значения `service_tier` сохраняются, а быстрый режим не переписывает `reasoning` или `text.verbosity`. `fastMode: "auto"` запускает новые вызовы модели в быстром режиме до автоматического порога, а последующие вызовы retry, fallback, tool-result или continuation запускает без быстрого режима. Порог по умолчанию — 60 секунд; чтобы изменить его, задайте `params.fastAutoOnSeconds` для активной модели.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Переопределения сеанса имеют приоритет над конфигурацией. Очистка переопределения сеанса в Sessions UI возвращает сеанс к настроенному значению по умолчанию.
    </Note>

  </Accordion>

  <Accordion title="Приоритетная обработка (service_tier)">
    API OpenAI предоставляет приоритетную обработку через `service_tier`. Задайте ее в OpenClaw для каждой модели:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Поддерживаемые значения: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передается только в нативные конечные точки OpenAI (`api.openai.com`) и нативные конечные точки Codex (`chatgpt.com/backend-api`). Если вы маршрутизируете любого из провайдеров через прокси, OpenClaw оставляет `service_tier` без изменений.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямых моделей OpenAI Responses (`openai/*` на `api.openai.com`) обертка потока OpenClaw в Plugin OpenAI автоматически включает серверную Compaction:

    - Принудительно задает `store: true` (если совместимость модели не задает `supportsStore: false`)
    - Внедряет `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Значение `compact_threshold` по умолчанию: 70% от `contextWindow` (или `80000`, если оно недоступно)

    Это применяется к встроенному runtime-пути OpenClaw и к хукам провайдера OpenAI, используемым встроенными запусками. Нативный app-server harness Codex управляет собственным контекстом через Codex и настраивается маршрутом агента OpenAI по умолчанию или runtime-политикой провайдера/модели.

    <Tabs>
      <Tab title="Включить явно">
        Полезно для совместимых конечных точек, таких как Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Пользовательский порог">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Отключить">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` управляет только внедрением `context_management`. Прямые модели OpenAI Responses по-прежнему принудительно используют `store: true`, если совместимость не задает `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Строгий агентный режим GPT">
    Для запусков семейства GPT-5 на `openai/*` OpenClaw может использовать более строгий встроенный контракт выполнения:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    С `strict-agentic` OpenClaw:
    - Автоматически включает `update_plan` для существенной работы
    - Повторяет структурно пустые или состоящие только из reasoning ходы с continuation видимого ответа
    - Использует явные события плана harness, когда выбранный harness их предоставляет

    OpenClaw не классифицирует прозу ассистента, чтобы решить, является ли ход планом, обновлением прогресса или финальным ответом.

    <Note>
    Ограничено только запусками семейства OpenAI и Codex GPT-5. Другие провайдеры и более старые семейства моделей сохраняют поведение по умолчанию.
    </Note>

  </Accordion>

  <Accordion title="Нативные и OpenAI-совместимые маршруты">
    OpenClaw обрабатывает прямые конечные точки OpenAI, Codex и Azure OpenAI иначе, чем универсальные OpenAI-совместимые прокси `/v1`:

    **Нативные маршруты** (`openai/*`, Azure OpenAI):
    - Сохраняют `reasoning: { effort: "none" }` только для моделей, которые поддерживают effort OpenAI `none`
    - Опускают отключенный reasoning для моделей или прокси, которые отклоняют `reasoning.effort: "none"`
    - По умолчанию переводят схемы инструментов в строгий режим
    - Прикрепляют скрытые заголовки атрибуции только на проверенных нативных хостах
    - Сохраняют форматирование запросов, специфичное для OpenAI (`service_tier`, `store`, reasoning-compat, подсказки prompt-cache)

    **Прокси-/совместимые маршруты:**
    - Используют менее строгое совместимое поведение
    - Удаляют `store` Completions из неродных payload `openai-completions`
    - Принимают сквозной JSON для расширенных `params.extra_body`/`params.extraBody` для OpenAI-совместимых прокси Completions
    - Принимают `params.chat_template_kwargs` для OpenAI-совместимых прокси Completions, таких как vLLM
    - Не требуют строгих схем инструментов или заголовков только для родного транспорта

    Azure OpenAI использует родной транспорт и совместимое поведение, но не получает скрытые заголовки атрибуции.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении при сбое.
  </Card>
  <Card title="Image generation" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента изображений и выбор провайдера.
  </Card>
  <Card title="Video generation" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента видео и выбор провайдера.
  </Card>
  <Card title="OAuth and auth" href="/ru/gateway/authentication" icon="key">
    Сведения об auth и правила повторного использования учетных данных.
  </Card>
</CardGroup>
