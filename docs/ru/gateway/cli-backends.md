---
read_when:
    - Вам нужен надежный резервный вариант на случай сбоев у провайдеров API
    - Вы запускаете локальные AI CLI и хотите использовать их повторно
    - Вы хотите понять loopback-мост MCP для доступа к инструментам бэкенда CLI
summary: 'Бэкенды CLI: локальный резервный ИИ-CLI с необязательным мостом инструментов MCP'
title: Бэкенды CLI
x-i18n:
    generated_at: "2026-07-01T08:22:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw может запускать **локальные AI CLI** как **текстовый резервный вариант**, когда API-провайдеры недоступны,
ограничены по лимитам или временно работают некорректно. Это намеренно консервативный подход:

- **Инструменты OpenClaw не внедряются напрямую**, но бэкенды с `bundleMcp: true`
  могут получать инструменты gateway через loopback-мост MCP.
- **Стриминг JSONL** для CLI, которые его поддерживают.
- **Сессии поддерживаются** (поэтому последующие ходы остаются связными).
- **Изображения можно передавать сквозным образом**, если CLI принимает пути к изображениям.

Это задумано как **страховочная сеть**, а не основной путь. Используйте это, когда вам
нужны текстовые ответы, которые «всегда работают», без зависимости от внешних API.

Если вам нужна полноценная среда выполнения harness с управлением сессиями ACP, фоновыми задачами,
привязкой тредов/разговоров и постоянными внешними сессиями кодирования, используйте
[агентов ACP](/ru/tools/acp-agents). CLI-бэкенды не являются ACP.

<Tip>
  Создаете новый backend plugin? Используйте
  [Plugin CLI-бэкендов](/ru/plugins/cli-backend-plugins). Эта страница предназначена для пользователей,
  которые настраивают и эксплуатируют уже зарегистрированный бэкенд.
</Tip>

## Быстрый старт для начинающих

Вы можете использовать Claude Code CLI **без какой-либо конфигурации** (встроенный Anthropic plugin
регистрирует бэкенд по умолчанию):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` — это id агента по умолчанию, когда явный список агентов не настроен. Если
вы используете несколько агентов, замените его на id агента, который хотите запустить.

Если ваш gateway работает под launchd/systemd и PATH минимален, добавьте только
путь к команде:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Готово. Никаких ключей и дополнительной auth-конфигурации не требуется, кроме самой CLI.

Если вы используете встроенный CLI-бэкенд как **основной провайдер сообщений** на
хосте gateway, OpenClaw теперь автоматически загружает владеющий встроенный plugin, когда ваша конфигурация
явно ссылается на этот бэкенд в model ref или в
`agents.defaults.cliBackends`.

## Использование как резервного варианта

Добавьте CLI-бэкенд в список fallback, чтобы он запускался только при сбое основных моделей:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Примечания:

- Если вы используете `agents.defaults.models` (allowlist), вы также должны включить туда модели вашего CLI-бэкенда.
- Если основной провайдер дает сбой (auth, лимиты запросов, тайм-ауты), OpenClaw
  попробует CLI-бэкенд следующим.

## Обзор конфигурации

Все CLI-бэкенды находятся в:

```
agents.defaults.cliBackends
```

Каждая запись индексируется по **id провайдера** (например, `claude-cli`, `my-cli`).
Id провайдера становится левой частью вашего model ref:

```
<provider>/<model>
```

### Пример конфигурации

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Как это работает

1. **Выбирает бэкенд** на основе префикса провайдера (`claude-cli/...`).
2. **Создает системный prompt** с использованием того же prompt OpenClaw и контекста workspace.
3. **Запускает CLI** с id сессии (если поддерживается), чтобы история оставалась согласованной.
   Встроенный бэкенд `claude-cli` поддерживает процесс Claude stdio активным для каждой
   сессии OpenClaw и отправляет последующие ходы через stream-json stdin.
4. **Разбирает вывод** (JSON или обычный текст) и возвращает итоговый текст.
5. **Сохраняет id сессий** для каждого бэкенда, чтобы последующие ходы повторно использовали ту же CLI-сессию.

<Note>
Встроенный Anthropic-бэкенд `claude-cli` снова поддерживается. Сотрудники Anthropic
сообщили нам, что использование Claude CLI в стиле OpenClaw снова разрешено, поэтому OpenClaw считает
использование `claude -p` санкционированным для этой интеграции, если Anthropic не опубликует
новую политику.
</Note>

Встроенный Anthropic-бэкенд `claude-cli` предпочитает нативный resolver Skills в Claude Code
для Skills OpenClaw. Когда текущий снимок Skills включает хотя бы
один выбранный skill с материализованным путем, OpenClaw передает временный Claude
Code plugin с `--plugin-dir` и опускает дублирующий каталог Skills OpenClaw
из добавленного системного prompt. Если в снимке нет материализованного plugin
skill, OpenClaw сохраняет каталог prompt как fallback. Переопределения env/API key
для skill по-прежнему применяются OpenClaw к окружению дочернего процесса для
запуска.

Claude CLI также имеет собственный неинтерактивный режим разрешений. OpenClaw сопоставляет его
с существующей политикой exec вместо добавления Claude-специфичной конфигурации политики.
Для управляемых OpenClaw живых сессий Claude эффективная политика exec OpenClaw является
авторитетной: YOLO (`tools.exec.security: "full"` и
`tools.exec.ask: "off"`) запускает Claude с
`--permission-mode bypassPermissions`, а ограничительная эффективная политика exec
запускает Claude с `--permission-mode default`. Настройки конкретного агента
`agents.list[].tools.exec` переопределяют глобальные `tools.exec` для этого
агента. Необработанные args бэкенда Claude все еще могут включать `--permission-mode`, но живые
запуски Claude нормализуют этот флаг так, чтобы он соответствовал эффективной политике exec OpenClaw.

Встроенный Anthropic-бэкенд `claude-cli` также сопоставляет уровни OpenClaw `/think`
с нативным флагом Claude Code `--effort` для уровней, отличных от off. `minimal` и
`low` сопоставляются с `low`, `adaptive` и `medium` сопоставляются с `medium`, а `high`,
`xhigh` и `max` сопоставляются напрямую. Другим CLI-бэкендам нужен их владеющий plugin,
который объявит эквивалентный argv mapper, прежде чем `/think` сможет влиять на порожденный CLI.

Прежде чем OpenClaw сможет использовать встроенный бэкенд `claude-cli`, сам Claude Code
уже должен быть авторизован на том же хосте:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Для установок Docker Claude Code должен быть установлен и авторизован внутри сохраняемого
home контейнера, а не только на хосте. См.
[Claude CLI backend в Docker](/ru/install/docker#claude-cli-backend-in-docker).

Используйте `agents.defaults.cliBackends.claude-cli.command` только когда бинарный файл `claude`
еще не находится в `PATH`.

## Сессии

- Если CLI поддерживает сессии, задайте `sessionArg` (например, `--session-id`) или
  `sessionArgs` (placeholder `{sessionId}`), когда ID нужно вставить
  в несколько флагов.
- Если CLI использует **подкоманду resume** с другими флагами, задайте
  `resumeArgs` (заменяет `args` при возобновлении) и, при необходимости, `resumeOutput`
  (для non-JSON resume).
- `sessionMode`:
  - `always`: всегда отправлять id сессии (новый UUID, если сохраненного нет).
  - `existing`: отправлять id сессии только если он был сохранен ранее.
  - `none`: никогда не отправлять id сессии.
- `claude-cli` по умолчанию использует `liveSession: "claude-stdio"`, `output: "jsonl"`,
  и `input: "stdin"`, чтобы последующие ходы повторно использовали живой процесс Claude, пока
  он активен. Теплый stdio теперь используется по умолчанию, включая пользовательские конфигурации,
  которые опускают transport-поля. Если Gateway перезапускается или idle-процесс
  завершается, OpenClaw возобновляет работу из сохраненного id сессии Claude. Сохраненные id сессий
  проверяются по существующей читаемой transcript проекта перед
  возобновлением, поэтому фантомные привязки очищаются с `reason=transcript-missing`
  вместо тихого запуска свежей сессии Claude CLI под `--resume`.
- Живые сессии Claude сохраняют ограниченные guards вывода JSONL. Значения по умолчанию допускают до
  8 MiB и 20 000 необработанных строк JSONL за ход. Ходы Claude с большим количеством tool могут повышать
  их для каждого бэкенда через
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  и `maxTurnLines`; OpenClaw ограничивает эти настройки 64 MiB и 100 000
  строк.
- Сохраненные CLI-сессии — это continuity, принадлежащая провайдеру. Неявный ежедневный сброс сессии
  их не обрывает; `/reset` и явные политики `session.reset` по-прежнему
  обрывают.
- Свежие CLI-сессии обычно повторно инициализируются только из summary Compaction OpenClaw
  плюс хвост после Compaction. Чтобы восстановить короткие сессии, которые инвалидируются
  до Compaction, бэкенд может явно включить это через
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw все равно ограничивает reseed из raw
  transcript и допускает его только для безопасных invalidations, таких как отсутствующие
  CLI transcripts, изменения system-prompt/MCP или retry из-за истекшей сессии; изменения
  auth profile или credential-epoch никогда не reseed raw transcript history.

Примечания по сериализации:

- `serialize: true` сохраняет порядок запусков в одной lane.
- Большинство CLI сериализуются в одной provider lane.
- OpenClaw отбрасывает повторное использование сохраненной CLI-сессии при изменении выбранной auth identity,
  включая измененный auth profile id, статический API key, статический token или identity учетной записи OAuth,
  когда CLI ее раскрывает. Ротация OAuth access и refresh token
  не обрывает сохраненную CLI-сессию. Если CLI не раскрывает
  стабильный OAuth account id, OpenClaw позволяет этой CLI самостоятельно обеспечивать permissions для resume.

## Прелюдия fallback из сессий claude-cli

Когда попытка `claude-cli` переключается на non-CLI кандидата в
[`agents.defaults.model.fallbacks`](/ru/concepts/model-failover), OpenClaw наполняет
следующую попытку context prelude, извлеченной из локальной
JSONL transcript Claude Code в `~/.claude/projects/`. Без этого seed fallback
provider стартовал бы cold, потому что собственная session transcript OpenClaw пуста
для запусков `claude-cli`.

- Prelude предпочитает последний summary `/compact` или маркер `compact_boundary`,
  затем добавляет самые последние ходы после boundary до лимита
  символов. Ходы до boundary отбрасываются, потому что summary уже представляет
  их.
- Tool blocks объединяются в компактные подсказки `(tool call: name)` и
  `(tool result: …)`, чтобы честно расходовать prompt budget. Summary
  помечается `(truncated)`, если он переполняется.
- Fallback с тем же провайдером `claude-cli` на `claude-cli` полагается на собственный
  `--resume` Claude и пропускает prelude.
- Seed повторно использует существующую проверку пути к session-file Claude, поэтому
  произвольные пути не могут быть прочитаны.

## Изображения (сквозная передача)

Если ваша CLI принимает пути к изображениям, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw запишет base64-изображения во временные файлы. Если `imageArg` задан, эти
пути передаются как CLI args. Если `imageArg` отсутствует, OpenClaw добавляет
пути к файлам в prompt (path injection), чего достаточно для CLI, которые автоматически
загружают локальные файлы из обычных путей.

## Входы / выходы

- `output: "json"` (по умолчанию) пытается разобрать JSON и извлечь текст + id сессии.
- Для JSON-вывода Gemini CLI OpenClaw читает текст ответа из `response`, а usage
  из `stats`, когда `usage` отсутствует или пуст. Встроенное значение по умолчанию Gemini CLI
  использует `stream-json`, но старые переопределения `--output-format json` все еще используют
  JSON parser.
- `output: "jsonl"` разбирает JSONL streams и извлекает итоговое сообщение агента плюс session
  identifiers, когда они присутствуют.
- `output: "text"` считает stdout итоговым ответом.

Режимы ввода:

- `input: "arg"` (по умолчанию) передает промпт как последний аргумент CLI.
- `input: "stdin"` отправляет промпт через stdin.
- Если промпт очень длинный и задан `maxPromptArgChars`, используется stdin.

## Значения по умолчанию (принадлежат Plugin)

Значения по умолчанию для встроенных CLI-бэкендов находятся в их владельческом Plugin. Например,
Anthropic владеет `claude-cli`, а Google владеет `google-gemini-cli`. Запуски агента OpenAI Codex
используют app-server harness Codex через `openai/*`; OpenClaw больше не
регистрирует встроенный бэкенд `codex-cli`.

Встроенный Plugin Anthropic регистрирует значение по умолчанию для `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Встроенный Plugin Google также регистрирует значение по умолчанию для `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Предварительное условие: локальный Gemini CLI должен быть установлен и доступен как
`gemini` в `PATH` (`brew install gemini-cli` или
`npm install -g @google/gemini-cli`).

Примечания по выводу Gemini CLI:

- Парсер `stream-json` по умолчанию читает события `message` ассистента, события инструментов,
  итоговое использование `result` и фатальные события ошибок Gemini.
- Если вы переопределите аргументы Gemini на `--output-format json`, OpenClaw нормализует этот
  бэкенд обратно в `output: "json"` и читает текст ответа из поля JSON `response`.
- Использование откатывается к `stats`, когда `usage` отсутствует или пусто.
- `stats.cached` нормализуется в OpenClaw `cacheRead`.
- Если `stats.input` отсутствует, OpenClaw выводит входные токены из
  `stats.input_tokens - stats.cached`.

Переопределяйте только при необходимости (часто: абсолютный путь `command`).

## Значения по умолчанию, принадлежащие Plugin

Значения по умолчанию для CLI-бэкендов теперь являются частью поверхности Plugin:

- Plugins регистрируют их через `api.registerCliBackend(...)`.
- `id` бэкенда становится префиксом провайдера в ссылках на модели.
- Пользовательская конфигурация в `agents.defaults.cliBackends.<id>` по-прежнему переопределяет значение Plugin по умолчанию.
- Очистка конфигурации, специфичной для бэкенда, остается во владении Plugin через необязательный
  хук `normalizeConfig`.

Plugins, которым нужны небольшие прокладки совместимости промптов/сообщений, могут объявлять
двунаправленные текстовые преобразования без замены провайдера или CLI-бэкенда:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` переписывает системный промпт и пользовательский промпт, передаваемые в CLI. `output`
переписывает потоковый текст ассистента и разобранный итоговый текст до того, как OpenClaw обработает
собственные управляющие маркеры и доставку в канал. Для вызовов моделей через провайдера
`output` также восстанавливает строковые значения внутри структурированных аргументов вызовов инструментов после
восстановления потока и до выполнения инструмента. Сырые JSON-фрагменты провайдера остаются
неизменными; потребителям следует использовать структурированную частичную, конечную или результирующую полезную нагрузку.

Для CLI, которые выдают специфичные для провайдера события JSONL, задайте `jsonlDialect` в конфигурации
этого бэкенда. Поддерживаемые диалекты: `claude-stream-json` для потоков, совместимых с Claude
Code, и `gemini-stream-json` для событий `stream-json` Gemini CLI.

## Владение нативной Compaction

Некоторые CLI-бэкенды запускают агента, который уплотняет **собственную** расшифровку, поэтому OpenClaw не должен
запускать против них свой защитный суммаризатор - это конфликтует с собственной
Compaction бэкенда и может жестко прервать ход.

У `claude-cli` нет harness-эндпоинта - Claude Code уплотняет внутренне, - поэтому он объявляет
`ownsNativeCompaction: true`, а OpenClaw возвращает no-op из пути Compaction.
Сессии с нативным harness, такие как Codex, вместо этого продолжают маршрутизироваться в свой harness-эндпоинт Compaction.

Поскольку бэкенд владеет Compaction, старый временный обходной путь с установкой
`contextTokens: 1_000_000` только для того, чтобы защитный механизм OpenClaw не срабатывал на
сессии claude-cli, **больше не нужен** - его заменяет отказ от участия.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Объявляйте `ownsNativeCompaction` только для бэкенда, который действительно владеет своей Compaction: он
должен надежно ограничивать собственную расшифровку по мере приближения к окну контекста и сохранять
возобновляемую сессию (например, `--resume` / `--session-id`); иначе отложенная сессия может
остаться сверх бюджета. Сессии с соответствующим `agentHarnessId` по-прежнему маршрутизируются в harness-эндпоинт.

## Оверлеи Bundle MCP

CLI-бэкенды **не** получают вызовы инструментов OpenClaw напрямую, но бэкенд может
включить сгенерированный оверлей конфигурации MCP через `bundleMcp: true`.

Текущее встроенное поведение:

- `claude-cli`: сгенерированный строгий файл конфигурации MCP
- `google-gemini-cli`: сгенерированный файл системных настроек Gemini

Когда bundle MCP включен, OpenClaw:

- запускает loopback HTTP MCP-сервер, который предоставляет инструменты Gateway процессу CLI
- аутентифицирует мост токеном на сессию (`OPENCLAW_MCP_TOKEN`)
- ограничивает доступ к инструментам текущей сессией, учетной записью и контекстом канала
- загружает включенные bundle-MCP-серверы для текущего workspace
- объединяет их с любой существующей формой MCP-конфигурации/настроек бэкенда
- переписывает конфигурацию запуска с использованием режима интеграции, принадлежащего бэкенду, из владельческого расширения

Если MCP-серверы не включены, OpenClaw все равно внедряет строгую конфигурацию, когда
бэкенд включает bundle MCP, чтобы фоновые запуски оставались изолированными.

Сессионные встроенные MCP-рантаймы кэшируются для повторного использования в рамках сессии, затем
удаляются после `mcp.sessionIdleTtlMs` миллисекунд простоя (по умолчанию 10
минут; установите `0`, чтобы отключить). Одноразовые встроенные запуски, такие как auth probes,
генерация slug и запросы recall Active Memory, выполняют очистку в конце запуска, чтобы stdio
дочерние процессы и потоки Streamable HTTP/SSE не переживали запуск.

## Лимит истории для повторного заполнения

Когда новая CLI-сессия заполняется из предыдущей расшифровки OpenClaw (например,
после повтора из-за `session_expired`), отображаемый блок
`<conversation_history>` ограничивается, чтобы промпты повторного заполнения не
разрастались. Значение по умолчанию — `12288` символов (около 3000 токенов).

Бэкенды Claude CLI автоматически используют больший лимит, выведенный из разрешенного
уровня контекста Claude. Стандартные запуски Claude на 200K токенов сохраняют больший фрагмент
расшифровки, а запуски Claude на 1M токенов сохраняют еще больший фрагмент, тогда как другие CLI
бэкенды сохраняют консервативное значение по умолчанию.

- Лимит управляет только блоком предыдущей истории в промпте повторного заполнения. Лимиты
  вывода живой сессии настраиваются отдельно в `reliability.outputLimits`
  (см. [Сессии](#sessions)).

## Ограничения

- **Нет прямых вызовов инструментов OpenClaw.** OpenClaw не внедряет вызовы инструментов в
  протокол CLI-бэкенда. Бэкенды видят инструменты Gateway только при включении
  `bundleMcp: true`.
- **Потоковая передача зависит от бэкенда.** Некоторые бэкенды передают JSONL потоком; другие буферизуют
  до выхода.
- **Структурированные выводы** зависят от JSON-формата CLI.

## Устранение неполадок

- **CLI не найден**: задайте `command` полным путем.
- **Неверное имя модели**: используйте `modelAliases`, чтобы сопоставить `provider/model` → модель CLI.
- **Нет непрерывности сессии**: убедитесь, что задан `sessionArg` и `sessionMode` не равно
  `none`.
- **Изображения игнорируются**: задайте `imageArg` (и проверьте, что CLI поддерживает пути к файлам).

## Связанные материалы

- [Runbook Gateway](/ru/gateway)
- [Локальные модели](/ru/gateway/local-models)
