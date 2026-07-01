---
read_when:
    - Вы хотите использовать модели OpenAI в OpenClaw
    - Вам нужна аутентификация по подписке Codex вместо ключей API
    - Вам нужно более строгое поведение выполнения агента GPT-5
summary: Используйте OpenAI через ключи API или подписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:26:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI предоставляет API для разработчиков для моделей GPT, а Codex также доступен как агент для программирования в рамках плана ChatGPT через клиенты Codex от OpenAI. OpenClaw использует один идентификатор провайдера, `openai`, для обоих форматов аутентификации.

OpenClaw использует `openai/*` как канонический маршрут моделей OpenAI. Встроенные ходы агента на моделях OpenAI по умолчанию выполняются через нативную среду выполнения app-server Codex; прямая аутентификация по API-ключу OpenAI остается доступной для неагентских поверхностей OpenAI, таких как изображения, эмбеддинги, речь и realtime.

- **Модели агента** - модели `openai/*` через среду выполнения Codex; войдите с аутентификацией Codex для использования подписки ChatGPT/Codex или настройте совместимый с Codex резервный профиль API-ключа OpenAI, когда намеренно хотите использовать аутентификацию по API-ключу.
- **Неагентские API OpenAI** - прямой доступ к OpenAI Platform с оплатой по использованию через `OPENAI_API_KEY` или onboarding API-ключа OpenAI.
- **Устаревшая конфигурация** - устаревшие ссылки на модели Codex исправляются командой `openclaw doctor --fix` на `openai/*` плюс среду выполнения Codex.

OpenAI явно поддерживает использование OAuth подписки во внешних инструментах и рабочих процессах, таких как OpenClaw.

Провайдер, модель, среда выполнения и канал - это отдельные уровни. Если эти метки смешиваются, прочитайте [Среды выполнения агента](/ru/concepts/agent-runtimes), прежде чем менять конфигурацию.

## Быстрый выбор

| Цель                                                 | Используйте                                              | Примечания                                                            |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Подписка ChatGPT/Codex с нативной средой выполнения Codex | `openai/gpt-5.5`                                         | Настройка агента OpenAI по умолчанию. Войдите с аутентификацией Codex. |
| Ограниченное превью GPT-5.6                          | `openai/gpt-5.6-sol`, `-terra` или `-luna`               | Требуется одобренная OpenAI API-организация или рабочая область Codex. |
| Прямая оплата по API-ключу для моделей агента         | `openai/gpt-5.5` плюс совместимый с Codex профиль API-ключа | Используйте `auth.order.openai`, чтобы разместить резерв после аутентификации подписки. |
| Прямая оплата по API-ключу через явный OpenClaw       | `openai/gpt-5.5` плюс среда выполнения провайдера/модели `openclaw` | Выберите обычный профиль API-ключа `openai`.                          |
| Последний alias API ChatGPT Instant                  | `openai/chat-latest`                                     | Только прямой API-ключ. Движущийся alias для экспериментов, не значение по умолчанию. |
| Аутентификация подписки ChatGPT/Codex через OpenClaw  | `openai/gpt-5.5` плюс среда выполнения провайдера/модели `openclaw` | Выберите OAuth-профиль `openai` для маршрута совместимости.           |
| Генерация или редактирование изображений              | `openai/gpt-image-2`                                     | Работает либо с `OPENAI_API_KEY`, либо с OpenAI Codex OAuth.           |
| Изображения с прозрачным фоном                        | `openai/gpt-image-1.5`                                   | Используйте `outputFormat=png` или `webp` и `openai.background=transparent`. |

## Карта названий

Названия похожи, но не взаимозаменяемы:

| Название, которое вы видите            | Уровень           | Значение                                                                                          |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                               | Префикс провайдера | Канонический маршрут моделей OpenAI; ходы агента используют среду выполнения Codex.               |
| устаревший префикс OpenAI Codex        | Устаревший префикс | Старое пространство имен моделей/профилей. `openclaw doctor --fix` мигрирует его в `openai`.      |
| Plugin `codex`                         | Plugin            | Встроенный Plugin OpenClaw, который предоставляет нативную среду выполнения app-server Codex и элементы управления чатом `/codex`. |
| провайдер/модель `agentRuntime.id: codex` | Среда выполнения агента | Принудительно использует нативный app-server harness Codex для соответствующих встроенных ходов.   |
| `/codex ...`                           | Набор чат-команд  | Привязка/управление потоками app-server Codex из разговора.                                       |
| `runtime: "acp", agentId: "codex"`     | Маршрут сеанса ACP | Явный резервный путь, который запускает Codex через ACP/acpx.                                     |

Это означает, что конфигурация может намеренно содержать ссылки на модели `openai/*`, а профили аутентификации могут указывать либо на учетные данные API-ключа, либо на OAuth ChatGPT/Codex. Используйте `auth.order.openai` для конфигурации; `openclaw doctor --fix` переписывает устаревшие ссылки на модели Codex, устаревшие идентификаторы профилей аутентификации Codex и устаревший порядок аутентификации Codex в канонический маршрут OpenAI.

<Note>
GPT-5.5 доступна как через прямой доступ по API-ключу OpenAI Platform, так и через маршруты подписки/OAuth. Для подписки ChatGPT/Codex плюс нативного выполнения Codex используйте `openai/gpt-5.5`; не заданная конфигурация среды выполнения теперь выбирает harness Codex для ходов агента OpenAI. Используйте профили API-ключа OpenAI только когда вам нужна прямая аутентификация по API-ключу для модели агента OpenAI.
</Note>

## Ограниченное превью GPT-5.6

OpenClaw распознает три публичных идентификатора моделей GPT-5.6:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Все три предоставляют рассуждение `max` в текущем каталоге app-server Codex. В объявлении о запуске OpenAI описывает Sol как флагманский уровень, Terra как сбалансированный уровень, а Luna как быстрый уровень с более низкой стоимостью. См. [объявление о запуске GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) и [руководство по доступу к превью](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Доступ во время превью предоставляется по списку разрешений и может быть выдан отдельно для API и Codex. Один только платный план ChatGPT не предоставляет доступ. OpenClaw сохраняет `openai/gpt-5.5` как значение по умолчанию; выбор ссылки GPT-5.6 без доступа возвращает upstream-ошибку доступа вместо бесшумного отката.

<Note>
Ходы моделей агента OpenAI требуют встроенного Plugin app-server Codex. Явная конфигурация среды выполнения OpenClaw остается доступной как opt-in маршрут совместимости. Когда OpenClaw явно выбран с OAuth-профилем `openai`, OpenClaw сохраняет публичную ссылку модели как `openai/*` и внутренне маршрутизирует через транспорт аутентификации Codex. Запустите `openclaw doctor --fix`, чтобы исправить устаревшие ссылки на модели Codex, `codex-cli/*` или старые привязки сеансов среды выполнения, которые не происходят из явной конфигурации среды выполнения.
</Note>

## Покрытие возможностей OpenClaw

| Возможность OpenAI       | Поверхность OpenClaw                                                                          | Статус                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Чат / Responses           | провайдер моделей `openai/<model>`                                                            | Да                                                                     |
| Модели подписки Codex     | `openai/<model>` с OpenAI OAuth                                                               | Да                                                                     |
| Устаревшие ссылки на модели Codex | устаревшие ссылки на модели Codex или `codex-cli/<model>`                              | Исправляются doctor на `openai/<model>`                                |
| App-server harness Codex  | `openai/<model>` с опущенной средой выполнения или провайдер/модель `agentRuntime.id: codex`  | Да                                                                     |
| Серверный веб-поиск       | Нативный инструмент OpenAI Responses                                                          | Да, когда веб-поиск включен и провайдер не закреплен                  |
| Изображения               | `image_generate`                                                                              | Да                                                                     |
| Видео                     | `video_generate`                                                                              | Да                                                                     |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                                                     | Да                                                                     |
| Пакетное speech-to-text   | `tools.media.audio` / понимание медиа                                                         | Да                                                                     |
| Потоковое speech-to-text  | Voice Call `streaming.provider: "openai"`                                                     | Да                                                                     |
| Realtime-голос            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Да (требуются кредиты OpenAI Platform, а не подписка Codex/ChatGPT)    |
| Эмбеддинги                | провайдер эмбеддингов памяти                                                                  | Да                                                                     |

<Note>
  Realtime-голос OpenAI (используемый Voice Call с `realtime.provider: "openai"` и
  Control UI Talk с `talk.realtime.provider: "openai"`) проходит через
  публичный **OpenAI Platform Realtime API**, который тарифицируется по кредитам OpenAI
  Platform, а не по квоте подписки Codex/ChatGPT. Аккаунту
  с исправным OpenAI OAuth, который без проблем запускает чат-модели на базе Codex,
  все равно нужен профиль аутентификации API-ключа OpenAI или Platform API key с пополненным
  биллингом Platform для Realtime-голоса.

Исправление: пополните кредиты Platform на
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
для организации, поддерживающей ваши учетные данные realtime. Realtime-голос принимает
профиль аутентификации API-ключа `openai`, созданный командой `openclaw onboard --auth-choice openai-api-key`,
Platform `OPENAI_API_KEY`, настроенный через `talk.realtime.providers.openai.apiKey`
для Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
для Voice Call, или переменную окружения `OPENAI_API_KEY`. OAuth-профили OpenAI
по-прежнему могут запускать чат-модели `openai/*` на базе Codex в той же
установке OpenClaw, но они не настраивают Realtime-голос.
</Note>

## Эмбеддинги памяти

OpenClaw может использовать OpenAI или OpenAI-совместимый endpoint эмбеддингов для
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

Для OpenAI-совместимых endpoint, которым требуются асимметричные метки эмбеддингов, задайте
`queryInputType` и `documentInputType` в `memorySearch`. OpenClaw передает
их как специфичные для провайдера поля запроса `input_type`: эмбеддинги запросов используют
`queryInputType`; индексированные фрагменты памяти и пакетная индексация используют
`documentInputType`. Полный пример см. в [справочнике по конфигурации памяти](/ru/reference/memory-config#provider-specific-config).

## Начало работы

Выберите предпочитаемый метод аутентификации и выполните шаги настройки.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Лучше всего для:** прямого доступа к API и оплаты по использованию.

    <Steps>
      <Step title="Получите свой API-ключ">
        Создайте или скопируйте API-ключ из [панели OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустите onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Убедитесь, что модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Сводка маршрутов

    | Ссылка на модель       | Конфигурация runtime       | Маршрут                     | Аутентификация  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | опущено / provider/model `agentRuntime.id: "codex"` | Codex app-server harness | Codex-совместимый профиль OpenAI |
    | `openai/gpt-5.4-mini` | опущено / provider/model `agentRuntime.id: "codex"` | Codex app-server harness | Codex-совместимый профиль OpenAI |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | встроенный runtime OpenClaw      | выбранный профиль `openai` |

    <Note>
    Модели агентов `openai/*` используют Codex app-server harness. Чтобы использовать
    аутентификацию по API-ключу для модели агента, создайте Codex-совместимый профиль API-ключа и упорядочьте
    его с помощью `auth.order.openai`; `OPENAI_API_KEY` остается прямым fallback для
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

    `chat-latest` — это изменяемый алиас. OpenAI описывает его как последнюю модель Instant,
    используемую в ChatGPT, и рекомендует `gpt-5.5` для использования в производственном API, поэтому
    сохраняйте `openai/gpt-5.5` в качестве стабильного значения по умолчанию, если вам явно не нужно
    поведение этого алиаса. Сейчас алиас принимает только `medium` для подробности текста, поэтому
    OpenClaw нормализует несовместимые переопределения подробности текста OpenAI для этой
    модели.

    <Warning>
    OpenClaw **не** предоставляет `gpt-5.3-codex-spark` на прямом маршруте OpenAI с API-ключом. Она доступна только через записи каталога подписки Codex, когда ваш аккаунт, в который выполнен вход, предоставляет ее.
    </Warning>

  </Tab>

  <Tab title="Подписка Codex">
    **Лучше всего для:** использования вашей подписки ChatGPT/Codex с нативным выполнением Codex app-server вместо отдельного API-ключа. Codex cloud требует входа в ChatGPT.

    <Steps>
      <Step title="Запустите OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Или запустите OAuth напрямую:

        ```bash
        openclaw models auth login --provider openai
        ```

        Для headless-сред или настроек, где callback нежелателен, добавьте `--device-code`, чтобы войти с помощью потока device-code ChatGPT вместо browser callback через localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Используйте канонический маршрут модели OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Для пути по умолчанию конфигурация runtime не требуется. Ходы агента OpenAI
        автоматически выбирают нативный runtime Codex app-server, а OpenClaw
        устанавливает или восстанавливает встроенный plugin Codex, когда выбран этот маршрут.
      </Step>
      <Step title="Убедитесь, что аутентификация Codex доступна">
        ```bash
        openclaw models list --provider openai
        ```

        После запуска Gateway отправьте `/codex status` или `/codex models`
        в чат, чтобы проверить нативный runtime app-server.
      </Step>
    </Steps>

    ### Сводка маршрутов

    | Ссылка на модель | Конфигурация runtime | Маршрут | Аутентификация |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | опущено / provider/model `agentRuntime.id: "codex"` | нативный Codex app-server harness | вход Codex или упорядоченный профиль аутентификации `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | встроенный runtime OpenClaw с внутренним транспортом аутентификации Codex | выбранный профиль OAuth `openai` |
    | устаревшая ссылка Codex GPT-5.5 | исправляется doctor | устаревший маршрут, переписанный в `openai/gpt-5.5` | перенесенный профиль OAuth OpenAI |
    | `codex-cli/gpt-5.5` | исправляется doctor | устаревший маршрут CLI, переписанный в `openai/gpt-5.5` | аутентификация Codex app-server |

    <Warning>
    Предпочитайте `openai/gpt-5.5` для новой конфигурации агентов с поддержкой подписки. Старые
    устаревшие ссылки Codex GPT — это устаревшие маршруты OpenClaw, а не нативный путь runtime Codex;
    запускайте `openclaw doctor --fix`, когда хотите перенести их на канонические
    ссылки `openai/*`. `gpt-5.3-codex-spark` остается ограниченной аккаунтами, в которых
    каталог подписки Codex объявляет эту модель; прямые ссылки OpenAI с API-ключом и
    Azure для нее остаются скрытыми.
    </Warning>

    <Note>
    Устаревший префикс моделей Codex — это устаревшая конфигурация, исправляемая doctor. Для
    распространенной настройки подписки плюс нативного runtime войдите через аутентификацию Codex,
    но оставьте ссылку на модель как `openai/gpt-5.5`. Новая конфигурация должна помещать порядок
    аутентификации агентов OpenAI в `auth.order.openai`; doctor переносит старые
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

    С резервным API-ключом оставьте модель на `openai/gpt-5.5` и поместите
    порядок аутентификации в `openai`. OpenClaw сначала попробует подписку, затем
    API-ключ, оставаясь на Codex harness:

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
    Onboarding больше не импортирует материалы OAuth из `~/.codex`. Войдите через браузерный OAuth (по умолчанию) или поток device-code выше — OpenClaw управляет полученными учетными данными в собственном хранилище аутентификации агентов.
    </Note>

    ### Проверка и восстановление маршрутизации OAuth Codex

    Используйте эти команды, чтобы увидеть, какую модель, runtime и маршрут аутентификации использует ваш агент по умолчанию:

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

    Если в старой конфигурации все еще есть устаревшие ссылки Codex GPT или устаревшая привязка
    сеанса runtime OpenAI без явной конфигурации runtime, исправьте это:

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

    Используйте `--profile-id`, когда вам нужно несколько входов Codex OAuth в одном
    агенте и позднее вы хотите управлять ими через порядок аутентификации или `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` — это маршрут модели для шагов агента OpenAI через Codex. Запустите
    `openclaw doctor --fix`, чтобы перенести старые устаревшие идентификаторы профилей с префиксом OpenAI Codex и
    записи порядка, прежде чем полагаться на порядок профилей.

    ### Индикатор статуса

    Чат `/status` показывает, какой runtime модели активен для текущего сеанса.
    Встроенная обвязка Codex app-server отображается как `Runtime: OpenAI Codex` для
    шагов модели агента OpenAI. Устаревшие привязки сеанса runtime OpenAI исправляются на Codex, если
    конфигурация явно не закрепляет OpenClaw.

    ### Предупреждение doctor

    Если устаревшие ссылки моделей Codex или устаревшие привязки runtime OpenAI остаются в конфигурации или
    состоянии сеанса, `openclaw doctor --fix` переписывает их в `openai/*` с
    runtime Codex, если OpenClaw не настроен явно.

    ### Ограничение окна контекста

    OpenClaw рассматривает метаданные модели и ограничение контекста runtime как отдельные значения.

    Для `openai/gpt-5.5` через каталог Codex OAuth:

    - Нативное `contextWindow`: `1000000`
    - Ограничение по умолчанию для runtime `contextTokens`: `272000`

    Меньшее ограничение по умолчанию на практике дает лучшие характеристики задержки и качества. Переопределите его с помощью `contextTokens`:

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

    OpenClaw использует метаданные вышестоящего каталога Codex для `gpt-5.5`, когда они
    присутствуют. Если live-обнаружение Codex пропускает строку `gpt-5.5`, хотя
    учетная запись аутентифицирована, OpenClaw синтезирует эту строку модели OAuth, чтобы
    запуски cron, суб-агентов и настроенной модели по умолчанию не завершались ошибкой
    `Unknown model`.

  </Tab>
</Tabs>

## Аутентификация нативного Codex app-server

Нативная обвязка Codex app-server использует ссылки моделей `openai/*` плюс опущенную
конфигурацию runtime или `agentRuntime.id: "codex"` для провайдера/модели, но ее аутентификация
по-прежнему основана на учетной записи. OpenClaw выбирает аутентификацию в таком порядке:

1. Упорядоченные профили аутентификации OpenAI для агента, предпочтительно в
   `auth.order.openai`. Запустите `openclaw doctor --fix`, чтобы перенести старые
   устаревшие идентификаторы профилей аутентификации Codex и устаревший порядок аутентификации Codex.
2. Существующая учетная запись app-server, например локальный вход Codex CLI ChatGPT.
3. Только для локальных запусков stdio app-server: `CODEX_API_KEY`, затем
   `OPENAI_API_KEY`, когда app-server сообщает об отсутствии учетной записи и все еще требует
   аутентификацию OpenAI.

Это означает, что локальный вход по подписке ChatGPT/Codex не заменяется только потому,
что у процесса Gateway также есть `OPENAI_API_KEY` для прямых моделей OpenAI
или эмбеддингов. Резервное использование API-ключа из env применяется только к локальному пути stdio без учетной записи; он
не отправляется в WebSocket-соединения app-server. Когда выбран профиль Codex
подписочного типа, OpenClaw также не передает `CODEX_API_KEY` и `OPENAI_API_KEY`
в порожденный дочерний процесс stdio app-server и отправляет выбранные учетные данные
через RPC входа app-server. Когда этот подписочный профиль заблокирован
лимитом использования Codex, OpenClaw может переключиться на следующий упорядоченный профиль API-ключа `openai:*`
без изменения выбранной модели и без выхода из обвязки Codex.
После наступления времени сброса подписки подписочный профиль снова
становится доступным.

## Генерация изображений

Встроенный Plugin `openai` регистрирует генерацию изображений через инструмент `image_generate`.
Он поддерживает как генерацию изображений по API-ключу OpenAI, так и генерацию изображений через Codex OAuth
через одну и ту же ссылку модели `openai/gpt-image-2`.

| Возможность              | Ключ OpenAI API                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ссылка на модель          | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Аутентификация            | `OPENAI_API_KEY`                   | Вход через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | Бэкенд Codex Responses               |
| Макс. изображений на запрос | 4                                  | 4                                    |
| Режим редактирования      | Включен (до 5 референсных изображений) | Включен (до 5 референсных изображений) |
| Переопределения размера   | Поддерживаются, включая размеры 2K/4K | Поддерживаются, включая размеры 2K/4K |
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
См. [Генерация изображений](/ru/tools/image-generation) для общих параметров инструмента, выбора провайдера и поведения при отказе.
</Note>

`gpt-image-2` используется по умолчанию как для генерации изображений из текста через OpenAI, так и для
редактирования изображений. `gpt-image-1.5`, `gpt-image-1` и `gpt-image-1-mini` остаются доступными как
явные переопределения модели. Используйте `openai/gpt-image-1.5` для вывода PNG/WebP
с прозрачным фоном; текущий API `gpt-image-2` отклоняет
`background: "transparent"`.

Для запроса с прозрачным фоном агенты должны вызывать `image_generate` с
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` или `"webp"` и
`background: "transparent"`; более старая опция провайдера `openai.background`
по-прежнему принимается. OpenClaw также защищает публичные маршруты OpenAI и
OpenAI Codex OAuth, переписывая прозрачные запросы с моделью по умолчанию `openai/gpt-image-2`
на `gpt-image-1.5`; Azure и пользовательские OpenAI-совместимые конечные точки сохраняют
настроенные имена развертываний/моделей.

Та же настройка доступна для безголовых запусков CLI:

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
Используйте `--quality low|medium|high|auto`, когда нужно управлять качеством и стоимостью
OpenAI Images. Используйте `--openai-moderation low|auto`, чтобы передать
специфичную для провайдера подсказку модерации OpenAI из `image generate` или `image edit`.

Для установок ChatGPT/Codex OAuth оставьте ту же ссылку `openai/gpt-image-2`. Когда
настроен профиль OAuth `openai`, OpenClaw разрешает сохраненный токен доступа OAuth
и отправляет запросы изображений через бэкенд Codex Responses. Он
не пытается сначала использовать `OPENAI_API_KEY` и не откатывается молча к API-ключу для этого
запроса. Настройте `models.providers.openai` явно с API-ключом,
пользовательским базовым URL или конечной точкой Azure, когда нужен прямой маршрут OpenAI Images API.
Если эта пользовательская конечная точка изображений находится в доверенной LAN/частном адресе, также задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw оставляет
частные/внутренние OpenAI-совместимые конечные точки изображений заблокированными, пока этот явный opt-in
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

| Возможность       | Значение                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель по умолчанию | `openai/sora-2`                                                                   |
| Режимы            | Текст-в-видео, изображение-в-видео, редактирование одного видео                   |
| Референсные входы | 1 изображение или 1 видео                                                         |
| Переопределения размера | Поддерживаются для текста-в-видео и изображения-в-видео                           |
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
См. [Генерация видео](/ru/tools/video-generation) для общих параметров инструмента, выбора провайдера и поведения при отказе.
</Note>

## Вклад в промпт GPT-5

OpenClaw добавляет общий вклад в промпт GPT-5 для запусков семейства GPT-5 на поверхностях промпта, собранных OpenClaw. Он применяется по идентификатору модели, поэтому маршруты OpenClaw/провайдера, такие как устаревшие ссылки до исправления (устаревшая ссылка Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` и другие совместимые ссылки GPT-5, получают тот же слой. Более старые модели GPT-4.x его не получают.

Встроенный нативный harness Codex не получает этот слой OpenClaw GPT-5 через инструкции разработчика app-server Codex. Нативный Codex сохраняет базовое поведение, модель и поведение проектной документации, принадлежащие Codex, а OpenClaw отключает встроенную персональность Codex для нативных потоков, чтобы файлы персональности рабочего пространства агента оставались авторитетными. OpenClaw вносит только runtime-контекст, такой как доставка по каналам, динамические инструменты OpenClaw, делегирование ACP, контекст рабочего пространства и OpenClaw Skills.

Вклад GPT-5 добавляет размеченный контракт поведения для сохранения персоны, безопасности выполнения, дисциплины инструментов, формы вывода, проверок завершения и верификации на соответствующих промптах, собранных OpenClaw. Поведение ответов для конкретных каналов и тихих сообщений остается в общем системном промпте OpenClaw и политике исходящей доставки. Дружественный слой стиля взаимодействия отделен и настраивается.

| Значение               | Эффект                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (по умолчанию) | Включить дружественный слой стиля взаимодействия |
| `"on"`                 | Псевдоним для `"friendly"`                  |
| `"off"`                | Отключить только дружественный слой стиля   |

<Tabs>
  <Tab title="Конфигурация">
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
Устаревшее `plugins.entries.openai.config.personality` по-прежнему читается как совместимый резервный вариант, когда общая настройка `agents.defaults.promptOverlays.gpt5.personality` не задана.
</Note>

## Голос и речь

<AccordionGroup>
  <Accordion title="Синтез речи (TTS)">
    Встроенный Plugin `openai` регистрирует синтез речи для поверхности `messages.tts`.

    | Настройка | Путь конфигурации | По умолчанию |
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

    `extraBody` объединяется в JSON запроса `/audio/speech` после сгенерированных OpenClaw полей, поэтому используйте его для OpenAI-совместимых конечных точек, которым нужны дополнительные ключи, такие как `lang`. Ключи прототипа игнорируются.

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
    Задайте `OPENAI_TTS_BASE_URL`, чтобы переопределить базовый URL TTS, не влияя на конечную точку chat API. OpenAI TTS и голос Realtime оба настраиваются через API-ключ OpenAI Platform; установки только с OAuth могут по-прежнему использовать модели чата на базе Codex, но не живой голосовой ответ OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Речь-в-текст">
    Встроенный Plugin `openai` регистрирует пакетное преобразование речи в текст через
    поверхность транскрипции media-understanding OpenClaw.

    - Модель по умолчанию: `gpt-4o-transcribe`
    - Конечная точка: OpenAI REST `/v1/audio/transcriptions`
    - Входной путь: multipart-загрузка аудиофайла
    - Поддерживается OpenClaw везде, где входящая аудиотранскрипция использует
      `tools.media.audio`, включая сегменты голосовых каналов Discord и аудиовложения
      каналов

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

    Подсказки языка и промпта передаются в OpenAI, когда они предоставлены
    общей конфигурацией аудиомедиа или запросом транскрипции для отдельного вызова.

  </Accordion>

  <Accordion title="Транскрипция Realtime">
    Встроенный Plugin `openai` регистрирует транскрипцию Realtime для Plugin Voice Call.

    | Настройка | Путь конфигурации | По умолчанию |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Язык | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Длительность тишины | `...openai.silenceDurationMs` | `800` |
    | Порог VAD | `...openai.vadThreshold` | `0.5` |
    | Аутентификация | `...openai.apiKey`, `OPENAI_API_KEY` или `openai` OAuth | API-ключи подключаются напрямую; OAuth выпускает клиентский секрет транскрипции Realtime |

    <Note>
    Использует WebSocket-подключение к `wss://api.openai.com/v1/realtime` с аудио G.711 u-law (`g711_ulaw` / `audio/pcmu`). Когда настроен только `openai` OAuth, Gateway выпускает эфемерный клиентский секрет транскрипции Realtime перед открытием WebSocket. Этот потоковый провайдер предназначен для пути транскрипции Realtime в Voice Call; голос Discord сейчас записывает короткие сегменты и вместо этого использует пакетный путь транскрипции `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос Realtime">
    Встроенный Plugin `openai` регистрирует голос Realtime для Plugin Voice Call.

    | Настройка | Путь конфигурации | Значение по умолчанию |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура (мост развертывания Azure) | `...openai.temperature` | `0.8` |
    | Порог VAD | `...openai.vadThreshold` | `0.5` |
    | Длительность тишины | `...openai.silenceDurationMs` | `500` |
    | Префиксный отступ | `...openai.prefixPaddingMs` | `300` |
    | Усилие рассуждения | `...openai.reasoningEffort` | (не задано) |
    | Аутентификация | профиль аутентификации API-ключом `openai`, `...openai.apiKey` или `OPENAI_API_KEY` | Требуется API-ключ OpenAI Platform; OpenAI OAuth не настраивает Realtime-голос |

    Доступные встроенные Realtime-голоса для `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI рекомендует `marin` и `cedar` для лучшего качества Realtime. Это
    отдельный набор от голосов Text-to-speech выше; не предполагайте, что TTS-
    голос вроде `fable`, `nova` или `onyx` допустим для Realtime-сеансов.

    <Note>
    Бэкенд-мосты OpenAI realtime используют форму WebSocket-сеанса GA Realtime, которая не принимает `session.temperature`. Развертывания Azure OpenAI остаются доступны через `azureEndpoint` и `azureDeployment` и сохраняют совместимую с развертыванием форму сеанса. Поддерживаются двунаправленный вызов инструментов и звук G.711 u-law.
    </Note>

    <Note>
    Realtime-голос выбирается при создании сеанса. OpenAI позволяет позже
    менять большинство полей сеанса, но голос нельзя изменить после того, как
    модель сгенерировала звук в этом сеансе. OpenClaw сейчас предоставляет
    встроенные идентификаторы Realtime-голосов как строки.
    </Note>

    <Note>
    Control UI Talk использует браузерные realtime-сеансы OpenAI с выданным
    Gateway эфемерным клиентским секретом и прямым браузерным WebRTC SDP-обменом
    с OpenAI Realtime API. Gateway выдает этот клиентский секрет с выбранным
    профилем аутентификации API-ключом `openai` или настроенным API-ключом
    OpenAI Platform. Релей Gateway и бэкенд-мосты realtime WebSocket для
    голосовых вызовов используют тот же путь аутентификации только по API-ключу
    для нативных конечных точек OpenAI. Живая проверка сопровождающими доступна
    с
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ветви OpenAI проверяют и бэкенд-мост WebSocket, и браузерный WebRTC
    SDP-обмен без записи секретов в журналы.
    </Note>

  </Accordion>
</AccordionGroup>

## Конечные точки Azure OpenAI

Встроенный провайдер `openai` может обращаться к ресурсу Azure OpenAI для
генерации изображений путем переопределения базового URL. На пути генерации
изображений OpenClaw обнаруживает имена хостов Azure в
`models.providers.openai.baseUrl` и автоматически переключается на форму запроса
Azure.

<Note>
Realtime-голос использует отдельный путь конфигурации
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
и не зависит от `models.providers.openai.baseUrl`. Его настройки Azure см. в
аккордеоне **Realtime-голос** в разделе [Голос и речь](#voice-and-speech).
</Note>

Используйте Azure OpenAI, когда:

- У вас уже есть подписка Azure OpenAI, квота или корпоративное соглашение
- Вам нужны региональное хранение данных или средства комплаенса, предоставляемые Azure
- Вы хотите удерживать трафик внутри существующего тенанта Azure

### Конфигурация

Для генерации изображений Azure через встроенный провайдер `openai` укажите
`models.providers.openai.baseUrl` на ваш ресурс Azure и задайте `apiKey` равным
ключу Azure OpenAI (не ключу OpenAI Platform):

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

OpenClaw распознает эти суффиксы хостов Azure для маршрута генерации изображений
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запросов генерации изображений на распознанном хосте Azure OpenClaw:

- Отправляет заголовок `api-key` вместо `Authorization: Bearer`
- Использует пути, привязанные к развертыванию (`/openai/deployments/{deployment}/...`)
- Добавляет `?api-version=...` к каждому запросу
- Использует тайм-аут запроса по умолчанию 600 с для вызовов генерации
  изображений Azure. Значения `timeoutMs` для отдельных вызовов по-прежнему
  переопределяют это значение по умолчанию.

Другие базовые URL (публичный OpenAI, OpenAI-совместимые прокси) сохраняют
стандартную форму запроса изображений OpenAI.

<Note>
Маршрутизация Azure для пути генерации изображений провайдера `openai` требует
OpenClaw 2026.4.22 или более поздней версии. Более ранние версии обрабатывают
любой пользовательский `openai.baseUrl` как публичную конечную точку OpenAI и
будут завершаться ошибкой с развертываниями изображений Azure.
</Note>

### Версия API

Задайте `AZURE_OPENAI_API_VERSION`, чтобы закрепить конкретную preview- или
GA-версию Azure для пути генерации изображений Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Значение по умолчанию — `2024-12-01-preview`, когда переменная не задана.

### Имена моделей являются именами развертываний

Azure OpenAI привязывает модели к развертываниям. Для запросов генерации
изображений Azure, маршрутизируемых через встроенный провайдер `openai`, поле
`model` в OpenClaw должно быть **именем развертывания Azure**, которое вы
настроили на портале Azure, а не публичным идентификатором модели OpenAI.

Если вы создаете развертывание с именем `gpt-image-2-prod`, которое обслуживает `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

То же правило имени развертывания применяется к вызовам генерации изображений,
маршрутизируемым через встроенный провайдер `openai`.

### Региональная доступность

Генерация изображений Azure сейчас доступна только в части регионов
(например, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Проверьте текущий список регионов Microsoft перед созданием
развертывания и подтвердите, что конкретная модель предлагается в вашем регионе.

### Различия параметров

Azure OpenAI и публичный OpenAI не всегда принимают одинаковые параметры
изображений. Azure может отклонять параметры, которые публичный OpenAI допускает
(например, некоторые значения `background` для `gpt-image-2`), или предоставлять
их только для конкретных версий моделей. Эти различия исходят от Azure и
базовой модели, а не от OpenClaw. Если запрос Azure завершается ошибкой
валидации, проверьте набор параметров, поддерживаемый вашим конкретным
развертыванием и версией API, на портале Azure.

<Note>
Azure OpenAI использует нативный транспорт и compat-поведение, но не получает
скрытые заголовки атрибуции OpenClaw — см. аккордеон **Нативные маршруты и
OpenAI-совместимые маршруты** в разделе [Расширенная конфигурация](#advanced-configuration).

Для чат-трафика или трафика Responses в Azure (помимо генерации изображений)
используйте поток онбординга или выделенную конфигурацию провайдера Azure —
одного `openai.baseUrl` недостаточно, чтобы применить форму API/аутентификации
Azure. Существует отдельный провайдер `azure-openai-responses/*`; см.
аккордеон «Серверная Compaction» ниже.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket и SSE)">
    OpenClaw сначала использует WebSocket с резервным переходом на SSE (`"auto"`) для `openai/*`.

    В режиме `"auto"` OpenClaw:
    - Повторяет один ранний сбой WebSocket перед переходом на SSE
    - После сбоя помечает WebSocket как деградировавший примерно на 60 секунд и использует SSE во время периода охлаждения
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
    - [Realtime API с WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потоковые ответы API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Быстрый режим">
    OpenClaw предоставляет общий переключатель быстрого режима для `openai/*`:

    - **Чат/UI:** `/fast status|auto|on|off`
    - **Конфигурация:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Когда он включен, OpenClaw сопоставляет быстрый режим с приоритетной обработкой OpenAI (`service_tier = "priority"`). Существующие значения `service_tier` сохраняются, и быстрый режим не переписывает `reasoning` или `text.verbosity`. `fastMode: "auto"` запускает новые вызовы модели в быстром режиме до автоматического порога, а затем запускает последующие вызовы повтора, резервного перехода, результата инструмента или продолжения без быстрого режима. Порог по умолчанию составляет 60 секунд; задайте `params.fastAutoOnSeconds` для активной модели, чтобы изменить его.

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
    Переопределения сеанса имеют приоритет над конфигурацией. Очистка переопределения сеанса в UI сеансов возвращает сеанс к настроенному значению по умолчанию.
    </Note>

  </Accordion>

  <Accordion title="Приоритетная обработка (service_tier)">
    API OpenAI предоставляет приоритетную обработку через `service_tier`. Задайте ее для каждой модели в OpenClaw:

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

  <Accordion title="Серверная Compaction (Responses API)">
    Для прямых моделей OpenAI Responses (`openai/*` на `api.openai.com`) потоковая обертка OpenClaw Plugin OpenAI автоматически включает серверную Compaction:

    - Принудительно задает `store: true` (если compat модели не задает `supportsStore: false`)
    - Вставляет `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Значение `compact_threshold` по умолчанию: 70% от `contextWindow` (или `80000`, когда недоступно)

    Это применяется к встроенному пути runtime OpenClaw и к хукам провайдера OpenAI, используемым встроенными запусками. Нативный app-server harness Codex управляет собственным контекстом через Codex и настраивается маршрутом агента OpenAI по умолчанию или runtime-политикой провайдера/модели.

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
    `responsesServerCompaction` управляет только вставкой `context_management`. Прямые модели OpenAI Responses по-прежнему принудительно задают `store: true`, если compat не задает `supportsStore: false`.
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
    - Повторяет структурно пустые ходы или ходы только с рассуждениями с продолжением с видимым ответом
    - Использует явные события плана harness, когда выбранный harness их предоставляет

    OpenClaw не классифицирует прозу ассистента, чтобы решить, является ли ход планом, обновлением прогресса или финальным ответом.

    <Note>
    Применяется только к запускам семейства GPT-5 для OpenAI и Codex. Другие провайдеры и более старые семейства моделей сохраняют поведение по умолчанию.
    </Note>

  </Accordion>

  <Accordion title="Нативные и OpenAI-совместимые маршруты">
    OpenClaw обрабатывает прямые конечные точки OpenAI, Codex и Azure OpenAI иначе, чем универсальные OpenAI-совместимые прокси `/v1`:

    **Нативные маршруты** (`openai/*`, Azure OpenAI):
    - Сохраняют `reasoning: { effort: "none" }` только для моделей, поддерживающих усилие OpenAI `none`
    - Опускают отключенное рассуждение для моделей или прокси, которые отклоняют `reasoning.effort: "none"`
    - По умолчанию переводят схемы инструментов в строгий режим
    - Добавляют скрытые заголовки атрибуции только на проверенных нативных хостах
    - Сохраняют формирование запросов только для OpenAI (`service_tier`, `store`, reasoning-compat, подсказки prompt-cache)

    **Прокси/совместимые маршруты:**
    - Используют более свободное поведение совместимости
    - Удаляют Completions `store` из ненативных полезных нагрузок `openai-completions`
    - Принимают расширенный сквозной JSON `params.extra_body`/`params.extraBody` для OpenAI-совместимых прокси Completions
    - Принимают `params.chat_template_kwargs` для OpenAI-совместимых прокси Completions, таких как vLLM
    - Не принуждают строгие схемы инструментов или заголовки только для нативных маршрутов

    Azure OpenAI использует нативный транспорт и поведение совместимости, но не получает скрытые заголовки атрибуции.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Генерация изображений" href="/ru/tools/image-generation" icon="image">
    Общие параметры инструмента изображений и выбор провайдера.
  </Card>
  <Card title="Генерация видео" href="/ru/tools/video-generation" icon="video">
    Общие параметры инструмента видео и выбор провайдера.
  </Card>
  <Card title="OAuth и аутентификация" href="/ru/gateway/authentication" icon="key">
    Сведения об аутентификации и правила повторного использования учетных данных.
  </Card>
</CardGroup>
