---
read_when:
    - Вы хотите использовать модели Anthropic в OpenClaw
summary: Используйте Anthropic Claude через ключи API или Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:28:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic создает семейство моделей **Claude**. OpenClaw поддерживает два маршрута аутентификации:

- **API key** — прямой доступ к Anthropic API с оплатой по использованию (модели `anthropic/*`)
- **Claude CLI** — повторное использование существующего входа Claude Code на том же хосте

<Warning>
Бэкенд Claude CLI в OpenClaw запускает установленный Claude Code CLI в
неинтерактивном режиме печати. В текущей документации Anthropic для Claude Code
`claude -p` описывается как использование Agent SDK/программный режим. Обновление
поддержки Anthropic от 15 июня 2026 года приостановило объявленное изменение
биллинга Agent SDK. Сейчас Anthropic сообщает, что использование Claude Agent SDK,
`claude -p` и сторонних приложений по-прежнему расходует лимиты использования
подписки. Ранее объявленный ежемесячный кредит Agent SDK недоступен, пока
Anthropic пересматривает этот план.

Интерактивный Claude Code по-прежнему расходует лимиты плана Claude, под которым
выполнен вход. Аутентификация по API key остается прямым API-биллингом с оплатой
по факту использования. Для долгоживущих хостов Gateway, общей автоматизации и
предсказуемых производственных расходов используйте Anthropic API key.

Перед тем как полагаться на поведение биллинга по подписке, проверьте текущие
статьи поддержки Anthropic:

- [Справочник Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Использование Claude Agent SDK с вашим планом Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Использование Claude Code с вашим планом Pro или Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Использование Claude Code с вашим планом Team или Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Управление затратами Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Начало работы

<Tabs>
  <Tab title="API key">
    **Лучше всего подходит для:** стандартного доступа к API и биллинга по использованию.

    <Steps>
      <Step title="Получите свой API key">
        Создайте API key в [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустите онбординг">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Или передайте ключ напрямую:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Проверьте, что модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Пример конфигурации

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Лучше всего подходит для:** повторного использования существующего входа Claude CLI без отдельного API key.

    <Steps>
      <Step title="Убедитесь, что Claude CLI установлен и вход выполнен">
        Проверьте с помощью:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустите онбординг">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw обнаружит и повторно использует существующие учетные данные Claude CLI.
      </Step>
      <Step title="Проверьте, что модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Подробности настройки и выполнения для бэкенда Claude CLI находятся в [CLI-бэкендах](/ru/gateway/cli-backends).
    </Note>

    <Warning>
    Повторное использование Claude CLI предполагает, что процесс OpenClaw работает на том же хосте, где
    выполнен вход Claude CLI. Установки Docker могут сохранять домашний каталог контейнера и выполнять вход в
    Claude Code там; см.
    [бэкенд Claude CLI в Docker](/ru/install/docker#claude-cli-backend-in-docker).
    Другие контейнерные установки, такие как [Podman](/ru/install/podman), не монтируют хостовый
    `~/.claude` в настройку или среду выполнения; используйте там Anthropic API key или выберите
    провайдера с OAuth, управляемым OpenClaw, например
    [OpenAI Codex](/ru/providers/openai).
    </Warning>

    ### Пример конфигурации

    Предпочитайте каноническую ссылку модели Anthropic плюс переопределение среды выполнения CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Устаревшие ссылки моделей `claude-cli/claude-opus-4-7` по-прежнему работают для
    совместимости, но новая конфигурация должна сохранять выбор провайдера/модели как
    `anthropic/*` и размещать бэкенд выполнения в политике среды выполнения провайдера/модели.

    ### Биллинг и `claude -p`

    OpenClaw использует неинтерактивный путь `claude -p` из Claude Code для запусков Claude CLI.
    Сейчас Anthropic трактует этот путь как использование Agent SDK/программный режим:

    - Обновление поддержки Anthropic от 15 июня 2026 года приостановило ранее объявленный
      отдельный план кредитов Agent SDK.
    - Сейчас использование Claude Agent SDK, `claude -p` и сторонних приложений
      по плану подписки по-прежнему расходует лимиты использования подписки, под которой выполнен вход.
    - Ранее объявленный ежемесячный кредит Agent SDK недоступен, пока
      Anthropic пересматривает этот план.
    - Входы Console/API key используют API-биллинг с оплатой по факту использования и не получают
      кредит Agent SDK по подписке.

    См. [статью о плане Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    Anthropic с уведомлением о паузе, а также статьи о планах Claude Code для поведения подписок
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    и
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic может изменить биллинг Claude Code и поведение лимитов частоты без
    релиза OpenClaw. Проверяйте `claude auth status`, `/status` и
    связанные документы Anthropic, когда важна предсказуемость биллинга.

    <Tip>
    Для общей производственной автоматизации используйте Anthropic API key вместо
    Claude CLI. OpenClaw также поддерживает варианты в стиле подписки от
    [OpenAI Codex](/ru/providers/openai), [Qwen Cloud](/ru/providers/qwen),
    [MiniMax](/ru/providers/minimax) и [Z.AI / GLM](/ru/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Параметры мышления по умолчанию (Claude Fable 5, 4.8 и 4.6)

`anthropic/claude-fable-5` всегда использует адаптивное мышление и по умолчанию задает усилие `high`.
Поскольку Anthropic не разрешает отключать мышление для этой модели,
`/think off` и `/think minimal` используют усилие `low`. OpenClaw также не отправляет пользовательские
значения температуры для запросов Fable 5.

Claude Opus 4.8 по умолчанию оставляет мышление отключенным в OpenClaw. Когда вы явно включаете адаптивное мышление с `/think high|xhigh|max`, OpenClaw отправляет значения усилия Anthropic для Opus 4.8; модели Claude 4.6 по умолчанию используют `adaptive`.

Переопределяйте для отдельного сообщения с `/think:<level>` или в параметрах модели:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Связанные документы Anthropic:
- [Адаптивное мышление](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Расширенное мышление](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Резервный вариант при отказе по безопасности (Claude Fable 5)

<Warning>
Использование Claude Fable 5 также означает использование Claude Opus 4.8. Fable 5 поставляется с
классификаторами безопасности, которые могут отклонить запрос, а санкционированное Anthropic
восстановление состоит в том, чтобы этот ход обслужил `claude-opus-4-8`. OpenClaw включает это
автоматически для прямых запросов с API key, поэтому некоторые ходы Fable получают ответы
и тарифицируются как Claude Opus 4.8. Если ваша политика или бюджет не допускают
ходы, обслуженные Opus, не выбирайте `anthropic/claude-fable-5`.
</Warning>

### Зачем это нужно

Классификаторы Fable 5 возвращают `stop_reason: "refusal"` для запросов в ограниченных
областях, а также дают ложные срабатывания на смежно-допустимых задачах (инструменты
безопасности, науки о жизни или даже просьба к модели воспроизвести ее сырое
рассуждение). Без резервного варианта ход завершается ошибкой, хотя
другая модель Claude охотно его обслужила бы — собственное сообщение Anthropic об отказе
говорит интеграторам API настроить резервную модель.

### Как это работает

1. Для каждого прямого запроса с API key к `anthropic/claude-fable-5` OpenClaw
   отправляет включение серверного резервного варианта Anthropic: beta-заголовок
   `server-side-fallback-2026-06-01` плюс
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 — единственная
   резервная цель, которую Anthropic разрешает для Fable 5.
2. Резервный вариант запускается только при отказе классификатора безопасности. Лимиты частоты,
   перегрузки и серверные ошибки ведут себя точно как раньше и проходят через
   обычное [переключение модели при сбое](/ru/concepts/model-failover) OpenClaw.
3. Спасение происходит внутри того же вызова. Отказ до какого-либо вывода
   невидим, кроме задержки; весь ответ приходит от Opus 4.8. При
   отказе в середине потока частичный текст сохраняется как префикс, с которого продолжает
   резервная модель, тогда как рассуждения и вызовы инструментов отклоненной модели
   отбрасываются согласно правилам воспроизведения Anthropic (их нельзя возвращать в ответ или
   выполнять).
4. Если Claude Opus 4.8 тоже отказывает, ход показывает отказ как
   ошибку, ровно как до этой функции.

Резервный вариант происходит на уровне Anthropic API, поэтому `claude-opus-4-8` не
обязан быть в вашем настроенном списке моделей или цепочке резервирования — API key с поддержкой Fable
всегда может обслужить Opus.

### Наблюдаемость и биллинг

- Ход, обслуженный резервной моделью, записывает диагностику `provider_fallback` в
  сообщение ассистента с именами `fromModel` и `toModel`, а поле сообщения
  `responseModel` сообщает `claude-opus-4-8`.
- Anthropic тарифицирует по попыткам: отказ до вывода бесплатен, а спасение
  тарифицируется по ставкам Claude Opus 4.8 (сейчас это половина ставок Fable 5). Оценка
  стоимости OpenClaw за ход оценивает ходы, обслуженные резервной моделью, по ставкам Opus, чтобы совпадать.
- Отказ в середине потока дополнительно тарифицирует уже переданный потоковый фрагмент Fable
  на стороне Anthropic; эта часть отражается в использовании по попыткам в API,
  но не включается в оценку OpenClaw за ход.

### Область действия

Применяется к `anthropic/claude-fable-5` с аутентификацией по API key против
`api.anthropic.com`. OAuth (повторное использование подписки Claude CLI), базовые URL прокси,
Bedrock, Vertex и запросы Foundry не меняются и там по-прежнему показывают
отказы как ошибки.

Проверено вживую: безобидный промпт с просьбой к Fable 5 воспроизвести сырую цепочку
мысли отклоняется с `category: "reasoning_extraction"` при отправке без
резервных вариантов, а тот же промпт через OpenClaw возвращает нормальный ответ,
обслуженный Opus, с прикрепленной диагностикой `provider_fallback`.

См. [руководство Anthropic по отказам и резервному варианту](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
для базового поведения.

## Кэширование промптов

OpenClaw поддерживает функцию кэширования промптов Anthropic для аутентификации по API key.

| Значение            | Длительность кэша | Описание                                  |
| ------------------- | ----------------- | ----------------------------------------- |
| `"short"` (по умолчанию) | 5 минут      | Применяется автоматически для аутентификации по API key |
| `"long"`            | 1 час             | Расширенный кэш                           |
| `"none"`            | Без кэширования   | Отключить кэширование промптов            |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Переопределения кэша для отдельных агентов">
    Используйте параметры уровня модели как базовую настройку, затем переопределяйте конкретных агентов через `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Порядок слияния конфигурации:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (соответствующий `id`, переопределяет по ключу)

    Это позволяет одному агенту сохранять долгоживущий кэш, а другому агенту на той же модели отключить кэширование для всплескового трафика с низким повторным использованием.

  </Accordion>

  <Accordion title="Примечания по Bedrock Claude">
    - Модели Anthropic Claude в Bedrock (`amazon-bedrock/*anthropic.claude*`) принимают сквозной параметр `cacheRetention`, когда он настроен.
    - Модели Bedrock, не относящиеся к Anthropic, принудительно получают `cacheRetention: "none"` во время выполнения.
    - Умные значения по умолчанию для API-ключей также задают `cacheRetention: "short"` для ссылок Claude-on-Bedrock, когда явное значение не установлено.

  </Accordion>
</AccordionGroup>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Быстрый режим">
    Общий переключатель OpenClaw `/fast` поддерживает прямой трафик Anthropic (API-ключ и OAuth к `api.anthropic.com`).

    | Команда | Соответствует |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Внедряется только для прямых запросов `api.anthropic.com`. Прокси-маршруты оставляют `service_tier` без изменений.
    - Явные параметры `serviceTier` или `service_tier` переопределяют `/fast`, когда заданы оба.
    - В учетных записях без емкости Priority Tier `service_tier: "auto"` может разрешиться в `standard`.

    </Note>

  </Accordion>

  <Accordion title="Понимание медиа (изображения и PDF)">
    Встроенный Plugin Anthropic регистрирует понимание изображений и PDF. OpenClaw
    автоматически определяет возможности медиа из настроенной аутентификации Anthropic — дополнительная
    конфигурация не требуется.

    | Свойство        | Значение              |
    | --------------- | --------------------- |
    | Модель по умолчанию | `claude-opus-4-8`     |
    | Поддерживаемый ввод | Изображения, PDF-документы |

    Когда к разговору прикреплено изображение или PDF, OpenClaw автоматически
    маршрутизирует его через провайдера понимания медиа Anthropic.

  </Accordion>

  <Accordion title="Контекстное окно 1M">
    Контекстное окно Anthropic 1M доступно в моделях Claude 4.x с поддержкой GA,
    таких как Opus 4.8, Opus 4.7, Opus 4.6 и Sonnet 4.6. OpenClaw автоматически задает для этих моделей
    размер 1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Старые конфигурации могут сохранять `params.context1m: true`, но OpenClaw больше не отправляет
    устаревший бета-заголовок `context-1m-2025-08-07`. Старые записи конфигурации `anthropicBeta`
    с этим значением игнорируются при разрешении заголовков запроса, а
    неподдерживаемые старые модели Claude остаются на своем обычном контекстном окне.

    `params.context1m: true` также применяется к бэкенду Claude CLI
    (`claude-cli/*`) для подходящих моделей Opus и Sonnet с поддержкой GA, сохраняя
    контекстное окно времени выполнения для этих сеансов CLI в соответствии с поведением
    прямого API.

    <Warning>
    Требуется доступ к длинному контексту в ваших учетных данных Anthropic. Аутентификация через OAuth/токен подписки сохраняет необходимые бета-заголовки Anthropic, но OpenClaw удаляет устаревший бета-заголовок 1M, если он остается в старой конфигурации.
    </Warning>

  </Accordion>

  <Accordion title="Контекст Claude Opus 4.8 1M">
    `anthropic/claude-opus-4-8` и его вариант `claude-cli` имеют контекстное
    окно 1M по умолчанию — `params.context1m: true` не требуется.
  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Ошибки 401 / токен внезапно стал недействительным">
    Аутентификация токеном Anthropic истекает и может быть отозвана. Для новых настроек используйте вместо нее API-ключ Anthropic.
  </Accordion>

  <Accordion title='API-ключ для провайдера "anthropic" не найден'>
    Аутентификация Anthropic выполняется **для каждого агента** — новые агенты не наследуют ключи основного агента. Повторно запустите первоначальную настройку для этого агента (или настройте API-ключ на хосте Gateway), затем проверьте с помощью `openclaw models status`.
  </Accordion>

  <Accordion title='Учетные данные для профиля "anthropic:default" не найдены'>
    Запустите `openclaw models status`, чтобы увидеть, какой профиль аутентификации активен. Повторно запустите первоначальную настройку или настройте API-ключ для этого пути профиля.
  </Accordion>

  <Accordion title="Нет доступного профиля аутентификации (все в периоде восстановления)">
    Проверьте `auth.unusableProfiles` в `openclaw models status --json`. Периоды восстановления из-за ограничения скорости Anthropic могут быть привязаны к модели, поэтому родственная модель Anthropic все еще может быть доступна. Добавьте другой профиль Anthropic или дождитесь окончания периода восстановления.
  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Бэкенды CLI" href="/ru/gateway/cli-backends" icon="terminal">
    Настройка бэкенда Claude CLI и сведения о времени выполнения.
  </Card>
  <Card title="Кэширование промптов" href="/ru/reference/prompt-caching" icon="database">
    Как кэширование промптов работает у разных провайдеров.
  </Card>
  <Card title="OAuth и аутентификация" href="/ru/gateway/authentication" icon="key">
    Сведения об аутентификации и правила повторного использования учетных данных.
  </Card>
</CardGroup>
