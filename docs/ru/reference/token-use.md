---
read_when:
    - Объяснение использования токенов, затрат или контекстных окон
    - Отладка роста контекста или поведения Compaction
summary: Как OpenClaw формирует контекст промпта и сообщает об использовании токенов и затратах
title: Использование токенов и расходы
x-i18n:
    generated_at: "2026-06-28T23:46:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw отслеживает **токены**, а не символы. Токены зависят от модели, но для большинства моделей в стиле OpenAI среднее значение для английского текста составляет примерно 4 символа на токен.

## Как строится системный prompt

OpenClaw собирает собственный системный prompt при каждом запуске. Он включает:

- Список инструментов + краткие описания
- Список Skills (только метаданные; инструкции загружаются по требованию через `read`).
  Нативные ходы Codex получают компактный блок skills как ограниченные текущим ходом
  collaboration developer instructions; другие harness получают его в обычной
  поверхности prompt. Он ограничен `skills.limits.maxSkillsPromptChars`, с
  необязательным переопределением для отдельного агента в `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Инструкции по самообновлению
- Workspace + bootstrap-файлы (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, когда новый, плюс `MEMORY.md`, когда присутствует). Нативные ходы Codex не вставляют сырой `MEMORY.md` из настроенного workspace агента, когда для этого workspace доступны инструменты памяти; они включают небольшой указатель на память в ограниченные текущим ходом collaboration developer instructions и используют инструменты памяти по требованию. Если инструменты отключены, поиск по памяти недоступен или активный workspace отличается от workspace памяти агента, `MEMORY.md` использует обычный ограниченный путь контекста хода. Корневой `memory.md` в нижнем регистре не внедряется; это legacy-вход для исправления через `openclaw doctor --fix` в паре с `MEMORY.md`. Большие внедряемые файлы усекаются через `agents.defaults.bootstrapMaxChars` (по умолчанию: 20000), а общий объем bootstrap-внедрения ограничен `agents.defaults.bootstrapTotalMaxChars` (по умолчанию: 60000). Ежедневные файлы `memory/*.md` не входят в обычный bootstrap prompt; они остаются доступными по требованию через инструменты памяти в обычных ходах, но model-запуски reset/startup могут предварять первый ход одноразовым блоком startup-контекста с недавней ежедневной памятью. Простые команды чата `/new` и `/reset` подтверждаются без вызова модели. Стартовая преамбула управляется `agents.defaults.startupContext`. Фрагменты AGENTS.md после Compaction отдельны и требуют явного opt-in через `agents.defaults.compaction.postCompactionSections`.
- Время (UTC + часовой пояс пользователя)
- Теги ответа + поведение Heartbeat
- Метаданные runtime (host/OS/model/thinking)

Полную разбивку см. в [System Prompt](/ru/concepts/system-prompt).

При документировании учетных данных или фрагментов auth используйте
[Соглашения о placeholder для секретов](/ru/reference/secret-placeholder-conventions), чтобы
избежать ложных срабатываний secret-scanner в изменениях только документации.

## Что учитывается в окне контекста

Все, что получает модель, учитывается в лимите контекста:

- Системный prompt (все разделы, перечисленные выше)
- История диалога (сообщения пользователя + ассистента)
- Вызовы инструментов и результаты инструментов
- Вложения/транскрипты (изображения, аудио, файлы)
- Сводки Compaction и артефакты pruning
- Обертки провайдеров или safety headers (не видны, но все равно учитываются)

У некоторых runtime-тяжелых поверхностей есть собственные явные лимиты:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Переопределения для отдельных агентов находятся в `agents.list[].contextLimits`. Эти настройки
предназначены для ограниченных runtime-фрагментов и внедряемых блоков, которыми владеет runtime. Они
отдельны от bootstrap-лимитов, лимитов startup-контекста и лимитов prompt для skills.

`toolResultMaxChars` — это продвинутый верхний предел (до `1000000` символов). Когда он не задан, OpenClaw выбирает
актуальный лимит результата инструмента из эффективного окна контекста модели: `16000` символов
ниже 100K токенов, `32000` символов при 100K+ токенах и `64000` символов при 200K+
токенах, при этом он все еще ограничен runtime-ограничителем доли контекста.

Для изображений OpenClaw уменьшает масштаб payload изображений transcript/tool перед вызовами провайдера.
Используйте `agents.defaults.imageMaxDimensionPx` (по умолчанию: `1200`), чтобы настроить это:

- Более низкие значения обычно уменьшают использование vision-токенов и размер payload.
- Более высокие значения сохраняют больше визуальных деталей для OCR/UI-тяжелых скриншотов.

Для практической разбивки (по внедренному файлу, инструментам, Skills и размеру системного prompt) используйте `/context list` или `/context detail`. См. [Контекст](/ru/concepts/context).

## Как посмотреть текущее использование токенов

Используйте это в чате:

- `/status` → **статусная карточка с эмодзи** с моделью сессии, использованием контекста,
  токенами ввода/вывода последнего ответа и **оценочной стоимостью**, когда локальные цены
  настроены для активной модели.
- `/usage off|tokens|full` → добавляет **footer использования для каждого ответа** к каждому ответу.
  - Сохраняется в рамках сессии (хранится как `responseUsage`).
  - `/usage reset` (aliases: `inherit`, `clear`, `default`) — очищает переопределение сессии,
    чтобы сессия снова наследовала настроенное значение по умолчанию.
  - `/usage full` показывает оценочную стоимость только когда у OpenClaw есть метаданные использования и
    локальные цены для активной модели. В противном случае показывает только токены.
- `/usage cost` → показывает локальную сводку стоимости из журналов сессии OpenClaw.

Другие поверхности:

- **TUI/Web TUI:** `/status` + `/usage` поддерживаются.
- **CLI:** `openclaw status --usage` и `openclaw channels list` показывают
  нормализованные окна квот провайдера (`X% left`, а не стоимости по каждому ответу).
  Текущие провайдеры usage-window: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi и z.ai.

Поверхности использования нормализуют распространенные provider-native aliases полей перед отображением.
Для трафика Responses семейства OpenAI это включает и `input_tokens` /
`output_tokens`, и `prompt_tokens` / `completion_tokens`, так что transport-specific
имена полей не меняют `/status`, `/usage` или сводки сессий.
Использование Gemini CLI тоже нормализуется: стандартный parser `stream-json` читает
assistant-события `message`, а `stats.cached` сопоставляется с `cacheRead`, при этом
`stats.input_tokens - stats.cached` используется, когда CLI не передает явное
поле `stats.input`. Legacy JSON-переопределения по-прежнему читают текст ответа из
`response`.
Для нативного трафика Responses семейства OpenAI aliases использования WebSocket/SSE
нормализуются тем же способом, а totals откатываются к нормализованным input + output, когда
`total_tokens` отсутствует или равен `0`.
Когда текущий snapshot сессии разрежен, `/status` и `session_status` также могут
восстановить счетчики token/cache и label активной runtime-модели из
самого свежего transcript usage log. Существующие ненулевые live-значения по-прежнему имеют
приоритет над transcript fallback-значениями, а более крупные prompt-oriented
transcript totals могут победить, когда сохраненные totals отсутствуют или меньше.
Auth для использования окон квот провайдера берется из provider-specific hooks, когда
они доступны; иначе OpenClaw откатывается к сопоставлению OAuth/API-key учетных данных
из auth profiles, env или config.
Записи transcript ассистента сохраняют ту же нормализованную форму использования, включая
`usage.cost`, когда для активной модели настроены цены и провайдер
возвращает метаданные использования. Это дает `/usage cost` и статусу сессии на основе transcript
стабильный источник даже после исчезновения live runtime state.

OpenClaw держит учет использования провайдера отдельно от текущего snapshot контекста.
Provider `usage.total` может включать cached input, output и несколько
model-вызовов tool-loop, поэтому он полезен для стоимости и телеметрии, но может завышать
live-окно контекста. Отображение контекста и диагностика используют последний snapshot prompt
(`promptTokens` или последний вызов модели, когда snapshot prompt
недоступен) для `context.used`.

## Оценка стоимости (когда показана)

Стоимость оценивается на основе вашей config цен моделей:

```
models.providers.<provider>.models[].cost
```

Это **USD за 1M токенов** для `input`, `output`, `cacheRead` и
`cacheWrite`. Если цены отсутствуют, OpenClaw показывает только токены. Отображение стоимости
не ограничено auth через API-key: провайдеры без API-key, такие как `aws-sdk`, могут показывать
оценочную стоимость, когда их настроенная запись модели включает локальные цены и
провайдер возвращает метаданные использования.

После того как sidecars и channels доходят до ready-пути Gateway, OpenClaw запускает
необязательный фоновый pricing bootstrap для настроенных model refs, у которых еще
нет локальных цен. Этот bootstrap получает удаленные каталоги цен OpenRouter и LiteLLM.
Установите `models.pricing.enabled: false`, чтобы пропустить эти запросы каталогов
в offline или restricted networks; явные
записи `models.providers.*.models[].cost` продолжают определять локальные оценки
стоимости.

## Влияние Cache TTL и pruning

Prompt caching провайдера применяется только в пределах окна Cache TTL. OpenClaw может
необязательно запускать **cache-ttl pruning**: он pruning сессию после истечения Cache TTL,
затем сбрасывает окно cache, чтобы последующие запросы могли повторно использовать
свежезакешированный контекст вместо повторного кеширования всей истории. Это снижает
затраты на cache write, когда сессия простаивает дольше TTL.

Настройте это в [конфигурации Gateway](/ru/gateway/configuration) и см. подробности
поведения в [pruning сессии](/ru/concepts/session-pruning).

Heartbeat может поддерживать cache **теплым** между периодами простоя. Если TTL cache вашей модели
составляет `1h`, установка интервала heartbeat чуть меньше этого значения (например, `55m`) может избежать
повторного кеширования полного prompt, снижая затраты на cache write.

В multi-agent setups можно держать один общий config модели и настраивать поведение cache
для каждого агента через `agents.list[].params.cacheRetention`.

Полное руководство по каждой настройке см. в [Prompt Caching](/ru/reference/prompt-caching).

Для цен Anthropic API cache reads значительно дешевле input
tokens, тогда как cache writes оплачиваются с более высоким multiplier. Актуальные ставки и TTL multipliers см. в ценах Anthropic
для prompt caching:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Пример: поддерживать 1h cache теплым с heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Пример: смешанный трафик со стратегией cache для каждого агента

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` объединяется поверх `params` выбранной модели, поэтому можно
переопределить только `cacheRetention` и унаследовать остальные значения модели по умолчанию без изменений.

### Anthropic 1M context

OpenClaw задает размер GA-capable моделей Claude 4.x, таких как Opus 4.8, Opus 4.7, Opus 4.6 и
Sonnet 4.6, с окном контекста Anthropic 1M. Вам не нужен
`params.context1m: true` для этих моделей.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Старые config могут сохранять `context1m: true`, но OpenClaw больше не отправляет
retired beta header Anthropic `context-1m-2025-08-07` для этой настройки и
не расширяет неподдерживаемые старые модели Claude до 1M.

Требование: credential должен иметь право на использование long-context. Если нет,
Anthropic отвечает provider-side ошибкой rate limit для этого запроса.

Если вы аутентифицируете Anthropic с помощью OAuth/subscription tokens (`sk-ant-oat-*`),
OpenClaw сохраняет требуемые OAuth Anthropic beta headers, удаляя при этом
retired beta `context-1m-*`, если он остается в старом config.

## Советы по снижению нагрузки токенов

- Используйте `/compact`, чтобы суммировать длинные сессии.
- Обрезайте большие выводы инструментов в своих workflows.
- Уменьшите `agents.defaults.imageMaxDimensionPx` для сессий с большим количеством скриншотов.
- Держите описания skills короткими (список skills внедряется в prompt).
- Предпочитайте меньшие модели для многословной исследовательской работы.

Точную формулу накладных расходов списка skills см. в [Skills](/ru/tools/skills).

## Связанное

- [Использование API и расходы](/ru/reference/api-usage-costs)
- [Кэширование промптов](/ru/reference/prompt-caching)
- [Отслеживание использования](/ru/concepts/usage-tracking)
