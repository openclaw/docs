---
read_when:
    - Использование или настройка команд чата
    - Отладка маршрутизации команд или разрешений
    - Понимание того, как регистрируются команды Skills
sidebarTitle: Slash commands
summary: Все доступные слэш-команды, директивы и встроенные сокращения — настройка, маршрутизация и поведение для каждой поверхности.
title: Слеш-команды
x-i18n:
    generated_at: "2026-06-30T14:16:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway обрабатывает команды, отправленные как отдельные сообщения, начинающиеся с `/`.
Bash-команды только для хоста используют `! <cmd>` (с `/bash <cmd>` в качестве псевдонима).

Когда разговор привязан к сеансу ACP, обычный текст направляется в ACP
harness. Команды управления Gateway остаются локальными: `/acp ...` всегда попадает
в обработчик команд OpenClaw, а `/status` и `/unfocus` остаются локальными всякий раз,
когда обработка команд включена для этой поверхности.

## Три типа команд

<CardGroup cols={3}>
  <Card title="Команды" icon="terminal">
    Отдельные сообщения `/...`, обрабатываемые Gateway. Должны быть отправлены как
    единственное содержимое сообщения.
  </Card>
  <Card title="Директивы" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — удаляются из сообщения до того, как модель
    его увидит. Сохраняют настройки сеанса, когда отправлены отдельно; работают
    как встроенные подсказки, когда отправлены с другим текстом.
  </Card>
  <Card title="Встроенные сокращения" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — выполняются немедленно и
    удаляются до того, как модель увидит оставшийся текст. Только для авторизованных отправителей.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Подробности поведения директив">
    - Директивы удаляются из сообщения до того, как модель его увидит.
    - В сообщениях, состоящих **только из директив** (сообщение содержит только директивы), они
      сохраняются в сеансе и отвечают подтверждением.
    - В сообщениях **обычного чата** с другим текстом они работают как встроенные подсказки и
      **не** сохраняют настройки сеанса.
    - Директивы применяются только для **авторизованных отправителей**. Если задано `commands.allowFrom`,
      используется только этот список разрешений; иначе авторизация берется из
      списков разрешений/сопряжения каналов плюс `commands.useAccessGroups`. Для неавторизованных
      отправителей директивы обрабатываются как обычный текст.
  </Accordion>
</AccordionGroup>

## Конфигурация

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Включает разбор `/...` в сообщениях чата. На поверхностях без нативных команд
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) текстовые
  команды работают даже при значении `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Регистрирует нативные команды. Auto: включено для Discord/Telegram; отключено для Slack;
  игнорируется для провайдеров без нативной поддержки. Переопределяется для каждого канала через
  `channels.<provider>.commands.native`. В Discord значение `false` пропускает регистрацию slash-команд;
  ранее зарегистрированные команды могут оставаться видимыми, пока их не удалят.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Регистрирует команды Skills нативно, когда это поддерживается. Auto: включено для
  Discord/Telegram; отключено для Slack. Переопределяется через
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Включает `! <cmd>` для запуска shell-команд хоста (псевдоним `/bash <cmd>`). Требует
  списки разрешений `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Как долго bash ждет перед переключением в фоновый режим (`0` переводит в фон
  немедленно).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Включает `/config` (читает/записывает `openclaw.json`). Только для владельца.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Включает `/mcp` (читает/записывает управляемую OpenClaw конфигурацию MCP в `mcp.servers`). Только для владельца.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Включает `/plugins` (обнаружение/статус plugin, а также установка + включение/отключение). Запись только для владельца.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Включает `/debug` (переопределения конфигурации только во время выполнения). Только для владельца.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Включает `/restart` и действия инструмента перезапуска Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Явный список разрешений владельца для командных поверхностей только для владельца. Отдельно от
  `commands.allowFrom` и доступа через сопряжение DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для каждого канала: требует идентичность владельца для команд только для владельца. Когда `true`,
  отправитель должен совпадать с `commands.ownerAllowFrom` или иметь внутреннюю область `operator.admin`.
  Запись wildcard `allowFrom` **недостаточна**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Управляет тем, как идентификаторы владельцев отображаются в системном prompt.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Секрет HMAC, используемый при `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Список разрешений по провайдерам для авторизации команд. Когда настроен, он является
  **единственным** источником авторизации для команд и директив. Используйте `"*"` для
  глобального значения по умолчанию; ключи конкретных провайдеров переопределяют его.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Применяет списки разрешений/политики для команд, когда `commands.allowFrom` не задан.
</ParamField>

## Список команд

Команды поступают из трех источников:

- **Встроенные команды ядра:** `src/auto-reply/commands-registry.shared.ts`
- **Сгенерированные dock-команды:** `src/auto-reply/commands-registry.data.ts`
- **Команды Plugin:** вызовы plugin `registerCommand()`

Доступность зависит от флагов конфигурации, поверхности канала и установленных/включенных
plugins.

### Команды ядра

<AccordionGroup>
  <Accordion title="Сеансы и запуски">
    | Команда | Описание |
    | --- | --- |
    | `/new [model]` | Архивировать текущий сеанс и начать новый |
    | `/reset [soft [message]]` | Сбросить текущий сеанс на месте. `soft` сохраняет transcript, удаляет повторно используемые идентификаторы сеанса CLI-бэкенда и повторно запускает startup |
    | `/name <title>` | Назвать или переименовать текущий сеанс. Опустите заголовок, чтобы увидеть текущее имя и предложение |
    | `/compact [instructions]` | Сжать контекст сеанса. См. [Compaction](/ru/concepts/compaction) |
    | `/stop` | Прервать текущий запуск |
    | `/session idle <duration\|off>` | Управлять истечением привязки thread по бездействию |
    | `/session max-age <duration\|off>` | Управлять истечением максимального возраста привязки thread |
    | `/export-session [path]` | Экспортировать текущий сеанс в HTML. Псевдоним: `/export` |
    | `/export-trajectory [path]` | Экспортировать пакет trajectory JSONL для текущего сеанса. Псевдоним: `/trajectory` |

    <Note>
      Control UI перехватывает введенную `/new`, чтобы создать и переключиться на новый
      сеанс dashboard, кроме случаев, когда настроено `session.dmScope: "main"`
      и текущий родительский сеанс является основным сеансом агента — в этом случае `/new`
      сбрасывает основной сеанс на месте. Введенная `/reset` по-прежнему выполняет
      сброс на месте через Gateway. Используйте `/model default`, когда нужно очистить закрепленный
      выбор модели сеанса.
    </Note>

  </Accordion>

  <Accordion title="Модель и элементы управления запуском">
    | Команда | Описание |
    | --- | --- |
    | `/think <level\|default>` | Задать уровень мышления или очистить переопределение сеанса. Псевдонимы: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Переключить подробный вывод. Псевдоним: `/v` |
    | `/trace on\|off` | Переключить вывод trace plugin для текущего сеанса |
    | `/fast [status\|auto\|on\|off\|default]` | Показать, задать или очистить быстрый режим |
    | `/reasoning [on\|off\|stream]` | Переключить видимость reasoning. Псевдоним: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Переключить elevated-режим. Псевдоним: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Показать или задать значения exec по умолчанию |
    | `/model [name\|#\|status]` | Показать или задать модель |
    | `/models [provider] [page] [limit=<n>\|all]` | Перечислить настроенных/доступных по auth провайдеров или модели |
    | `/queue <mode>` | Управлять поведением очереди активных запусков. См. [Очередь](/ru/concepts/queue) и [Управление очередью](/ru/concepts/queue-steering) |
    | `/steer <message>` | Внедрить указания в активный запуск. Псевдоним: `/tell`. См. [Steer](/ru/tools/steer) |

    <AccordionGroup>
      <Accordion title="безопасность verbose / trace / fast / reasoning">
        - `/verbose` предназначен для отладки — держите его **выключенным** при обычном использовании.
        - `/trace` показывает только принадлежащие plugin строки trace/debug; обычная подробная болтовня остается выключенной.
        - `/fast auto|on|off` сохраняет переопределение сеанса; используйте опцию `inherit` в Sessions UI, чтобы очистить его.
        - `/fast` зависит от провайдера: OpenAI/Codex сопоставляют его с `service_tier=priority`; прямые запросы Anthropic сопоставляют его с `service_tier=auto` или `standard_only`.
        - `/reasoning`, `/verbose` и `/trace` рискованны в групповых настройках — они могут раскрыть внутреннее reasoning или диагностику plugin. Держите их выключенными в групповых чатах.

      </Accordion>
      <Accordion title="Подробности переключения модели">
        - `/model` немедленно сохраняет новую модель в сеансе.
        - Если агент простаивает, следующий запуск сразу использует ее.
        - Если запуск активен, переключение помечается как ожидающее и применяется в следующей чистой точке повтора.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Обнаружение и статус">
    | Команда | Описание |
    | --- | --- |
    | `/help` | Показать краткую справку |
    | `/commands` | Показать сгенерированный каталог команд |
    | `/tools [compact\|verbose]` | Показать, что текущий агент может использовать прямо сейчас |
    | `/status` | Показать статус выполнения/среды выполнения, время работы Gateway и системы, состояние plugin, а также использование/квоту провайдера |
    | `/status plugins` | Показать подробное состояние plugin: ошибки загрузки, карантины, сбои каналов, проблемы зависимостей, уведомления о совместимости |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Управлять durable [целью](/ru/tools/goal) текущего сеанса |
    | `/diagnostics [note]` | Поток отчета поддержки только для владельца. Каждый раз запрашивает подтверждение exec |
    | `/crestodian <request>` | Запустить помощник настройки и ремонта Crestodian из DM владельца |
    | `/tasks` | Перечислить активные/недавние фоновые задачи для текущего сеанса |
    | `/context [list\|detail\|map\|json]` | Объяснить, как собирается контекст |
    | `/whoami` | Показать ваш идентификатор отправителя. Псевдоним: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Управлять footer использования для каждого ответа (`reset`/`inherit`/`clear`/`default` очищает переопределение сеанса, чтобы снова наследовать настроенное значение по умолчанию) или вывести локальную сводку стоимости |
  </Accordion>

  <Accordion title="Skills, списки разрешений, подтверждения">
    | Команда | Описание |
    | --- | --- |
    | `/skill <name> [input]` | Запустить skill по имени |
    | `/allowlist [list\|add\|remove] ...` | Управлять записями списка разрешений. Только текст |
    | `/approve <id> <decision>` | Разрешить prompts подтверждения exec или plugin |
    | `/btw <question>` | Задать побочный вопрос без изменения контекста сеанса. Псевдоним: `/side`. См. [BTW](/ru/tools/btw) |
  </Accordion>

  <Accordion title="Субагенты и ACP">
    | Команда | Описание |
    | --- | --- |
    | `/subagents list\|log\|info` | Просмотреть запуски субагентов для текущего сеанса |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Управлять сеансами ACP и параметрами среды выполнения. Для элементов управления среды выполнения требуется внешний владелец или внутренняя идентичность администратора Gateway |
    | `/focus <target>` | Привязать текущую ветку Discord или тему Telegram к целевому сеансу |
    | `/unfocus` | Удалить привязку текущей ветки |
    | `/agents` | Показать агентов, привязанных к ветке для текущего сеанса |
  </Accordion>

  <Accordion title="Запись только владельцем и администрирование">
    | Команда | Требует | Описание |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Читать или записывать `openclaw.json`. Только для владельца |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Читать или записывать конфигурацию MCP-сервера, управляемую OpenClaw. Только для владельца |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Просматривать или изменять состояние Plugin. Запись только для владельца. Псевдоним: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Переопределения конфигурации только для среды выполнения. Только для владельца |
    | `/restart` | `commands.restart: true` (по умолчанию) | Перезапустить OpenClaw |
    | `/send on\|off\|inherit` | владелец | Задать политику отправки |
  </Accordion>

  <Accordion title="Голос, TTS, управление каналом">
    | Команда | Описание |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Управлять TTS. См. [TTS](/ru/tools/tts) |
    | `/activation mention\|always` | Задать режим активации группы |
    | `/bash <command>` | Запустить команду оболочки хоста. Псевдоним: `! <command>`. Требует `commands.bash: true` |
    | `!poll [sessionId]` | Проверить фоновую задачу bash |
    | `!stop [sessionId]` | Остановить фоновую задачу bash |
  </Accordion>
</AccordionGroup>

### Команды Dock

Команды Dock переключают маршрут ответа активного сеанса на другой связанный канал.
См. [стыковку каналов](/ru/concepts/channel-docking) для настройки и устранения неполадок.

Сгенерировано из Plugin каналов с поддержкой нативных команд:

- `/dock-discord` (псевдоним: `/dock_discord`)
- `/dock-mattermost` (псевдоним: `/dock_mattermost`)
- `/dock-slack` (псевдоним: `/dock_slack`)
- `/dock-telegram` (псевдоним: `/dock_telegram`)

Команды Dock требуют `session.identityLinks`. Исходный отправитель и целевой собеседник
должны находиться в одной группе идентичности.

### Команды встроенных Plugin

| Команда                                                                                      | Описание                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Включить или выключить Dreaming памяти (владелец или администратор Gateway). См. [Dreaming](/ru/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Управлять сопряжением устройств. См. [сопряжение](/ru/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | Временно включить команды телефонного узла высокого риска                                       |
| `/voice status\|list\|set <voiceId>`                                                         | Управлять конфигурацией голоса Talk. Нативное имя Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | Отправить предустановки rich card LINE. См. [LINE](/ru/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Управлять обвязкой сервера приложения Codex. См. [обвязку Codex](/ru/plugins/codex-harness)   |

Только для QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Команды Skills

Skills, вызываемые пользователем, доступны как slash-команды:

- `/skill <name> [input]` всегда работает как универсальная точка входа.
- Skills могут регистрироваться как прямые команды (например, `/prose` для OpenProse).
- Регистрация нативных команд Skills управляется `commands.nativeSkills` и
  `channels.<provider>.commands.nativeSkills`.
- Имена нормализуются до `a-z0-9_` (максимум 32 символа); при конфликтах добавляются числовые суффиксы.

<AccordionGroup>
  <Accordion title="Диспетчеризация команд Skills">
    По умолчанию команды Skills маршрутизируются в модель как обычный запрос.

    Skills могут объявить `command-dispatch: tool` для маршрутизации напрямую в инструмент
    (детерминированно, без участия модели). Пример: `/prose` (Plugin OpenProse)
    — см. [OpenProse](/ru/prose).

  </Accordion>
  <Accordion title="Аргументы нативных команд">
    Discord использует автодополнение для динамических параметров и кнопочные меню, когда обязательные
    аргументы опущены. Telegram и Slack показывают кнопочное меню для команд с
    вариантами выбора. Динамические варианты разрешаются относительно модели целевого сеанса, поэтому параметры,
    специфичные для модели, такие как уровни `/think`, следуют переопределению `/model` сеанса.
  </Accordion>
</AccordionGroup>

## `/tools` — что агент может использовать сейчас

`/tools` отвечает на вопрос среды выполнения: **что этот агент может использовать прямо сейчас в этом
разговоре**, а не предоставляет статический каталог конфигурации.

```text
/tools         # компактный вид
/tools verbose # с краткими описаниями
```

Результаты ограничены сеансом. Смена агента, канала, ветки, авторизации отправителя
или модели может изменить вывод. Для редактирования профиля и переопределений
используйте панель Tools в Control UI или поверхности конфигурации.

## `/model` — выбор модели

```text
/model             # показать средство выбора модели
/model list        # то же самое
/model 3           # выбрать по номеру из списка выбора
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # очистить выбор модели сеанса
/model status      # подробный вид с конечной точкой и режимом API
```

В Discord `/model` и `/models` открывают интерактивное средство выбора с выпадающими списками провайдера и
модели. Средство выбора учитывает `agents.defaults.models`, включая
записи `provider/*`.

## `/config` — запись конфигурации на диск

<Note>
  Только для владельца. Отключено по умолчанию — включите с помощью `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Конфигурация проверяется перед записью. Недопустимые изменения отклоняются. Обновления `/config`
сохраняются после перезапусков.

## `/mcp` — конфигурация MCP-сервера

<Note>
  Только для владельца. Отключено по умолчанию — включите с помощью `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` хранит конфигурацию в конфигурации OpenClaw, а не во встроенных настройках проекта агента.

## `/debug` — переопределения только для среды выполнения

<Note>
  Только для владельца. Отключено по умолчанию — включите с помощью `commands.debug: true`.
  Переопределения немедленно применяются к новым чтениям конфигурации, но **не** записываются на диск.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — управление Plugin

<Note>
  Запись только для владельца. Отключено по умолчанию — включите с помощью `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` обновляет конфигурацию Plugin и горячо перезагружает среду выполнения Plugin
Gateway для новых ходов агента. `/plugins install` автоматически перезапускает управляемые
Gateway, потому что исходные модули Plugin изменились.

## `/trace` — вывод трассировки Plugin

```text
/trace          # показать текущее состояние трассировки
/trace on
/trace off
```

`/trace` показывает строки трассировки/отладки Plugin, ограниченные сеансом, без полного подробного
режима. Он не заменяет `/debug` (переопределения среды выполнения) или `/verbose` (обычный
вывод инструментов).

## `/btw` — побочные вопросы

`/btw` — это быстрый побочный вопрос о контексте текущего сеанса. Псевдоним: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

В отличие от обычного сообщения:

- Использует текущий сеанс как фоновый контекст.
- В сеансах обвязки Codex запускается как эфемерная побочная ветка Codex.
- **Не** изменяет будущий контекст сеанса.
- Не записывается в историю транскрипта.

См. [побочные вопросы BTW](/ru/tools/btw) для полного описания поведения.

## Примечания к поверхностям

<AccordionGroup>
  <Accordion title="Область действия сеанса по поверхностям">
    - **Текстовые команды:** выполняются в обычном чат-сеансе (личные сообщения используют общий `main`, группы имеют собственный сеанс).
    - **Нативные команды Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Нативные команды Slack:** `agent:<agentId>:slack:slash:<userId>` (префикс настраивается через `channels.slack.slashCommand.sessionPrefix`)
    - **Нативные команды Telegram:** `telegram:slash:<userId>` (нацеливаются на чат-сеанс через `CommandTargetSessionKey`)
    - **`/stop`** нацеливается на активный чат-сеанс, чтобы прервать текущий запуск.

  </Accordion>
  <Accordion title="Особенности Slack">
    `channels.slack.slashCommand` поддерживает одну команду в стиле `/openclaw`.
    При `commands.native: true` создайте одну slash-команду Slack для каждой встроенной
    команды. Зарегистрируйте `/agentstatus` (не `/status`), потому что Slack резервирует
    `/status`. Текстовая команда `/status` по-прежнему работает в сообщениях Slack.
  </Accordion>
  <Accordion title="Быстрый путь и встроенные сокращения">
    - Сообщения, состоящие только из команд, от отправителей из allowlist обрабатываются немедленно (в обход очереди и модели).
    - Встроенные сокращения (`/help`, `/commands`, `/status`, `/whoami`) также работают внутри обычных сообщений и удаляются до того, как модель увидит оставшийся текст.
    - Неавторизованные сообщения, состоящие только из команд, молча игнорируются; встроенные токены `/...` считаются обычным текстом.

  </Accordion>
  <Accordion title="Примечания к аргументам">
    - Команды принимают необязательный `:` между командой и аргументами (`/think: high`, `/send: on`).
    - `/new <model>` принимает псевдоним модели, `provider/model` или имя провайдера (нечеткое совпадение); если совпадений нет, текст считается телом сообщения.
    - `/allowlist add|remove` требует `commands.config: true` и учитывает `configWrites` канала.

  </Accordion>
</AccordionGroup>

## Использование и статус провайдера

- **Использование/квота провайдера** (например, «Claude 80% осталось») отображается в `/status` для текущего провайдера модели, когда включено отслеживание использования.
- **Строки токенов/кэша** в `/status` могут использовать последнюю запись использования из транскрипта, если текущий снимок сеанса разрежен.
- **Выполнение и среда выполнения:** `/status` сообщает `Execution` для эффективного пути песочницы и `Runtime` для того, кто запускает сеанс: `OpenClaw Default`, `OpenAI Codex`, backend CLI или backend ACP.
- **Токены/стоимость на ответ:** управляется `/usage off|tokens|full`.
- `/model status` относится к моделям/аутентификации/конечным точкам, а не к использованию.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Как slash-команды Skills регистрируются и ограничиваются.
  </Card>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Создайте Skill, который регистрирует собственную slash-команду.
  </Card>
  <Card title="BTW" href="/ru/tools/btw" icon="comments">
    Побочные вопросы без изменения контекста сеанса.
  </Card>
  <Card title="Steer" href="/ru/tools/steer" icon="compass">
    Направляйте агента во время выполнения с помощью `/steer`.
  </Card>
</CardGroup>
