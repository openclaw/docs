---
read_when:
    - Использование и настройка команд чата
    - Отладка маршрутизации команд или разрешений
    - Понимание того, как регистрируются команды Skills
sidebarTitle: Slash commands
summary: Все доступные slash-команды, директивы и встроенные сокращения — конфигурация, маршрутизация и поведение для каждой поверхности.
title: Слэш-команды
x-i18n:
    generated_at: "2026-07-01T20:32:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway обрабатывает команды, отправленные как отдельные сообщения, начинающиеся с `/`.
Bash-команды только для хоста используют `! <cmd>` (с `/bash <cmd>` как псевдонимом).

Когда разговор привязан к сеансу ACP, обычный текст направляется в
обвязку ACP. Команды управления Gateway остаются локальными: `/acp ...` всегда
попадает в обработчик команд OpenClaw, а `/status` и `/unfocus` остаются
локальными всякий раз, когда обработка команд включена для поверхности.

## Три типа команд

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Отдельные сообщения `/...`, обрабатываемые Gateway. Должны отправляться как
    единственное содержимое сообщения.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — удаляются из сообщения до того, как его увидит
    модель. Сохраняют настройки сеанса, когда отправлены отдельно; действуют как
    встроенные подсказки, когда отправлены с другим текстом.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — выполняются немедленно и
    удаляются до того, как модель увидит оставшийся текст. Только авторизованные отправители.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Директивы удаляются из сообщения до того, как его увидит модель.
    - В сообщениях **только с директивами** (сообщение содержит только директивы) они
      сохраняются в сеансе и отвечают подтверждением.
    - В сообщениях **обычного чата** с другим текстом они действуют как встроенные подсказки и
      **не** сохраняют настройки сеанса.
    - Директивы применяются только для **авторизованных отправителей**. Если задан
      `commands.allowFrom`, используется только этот список разрешений; иначе авторизация берется из
      списков разрешений/сопряжения канала плюс `commands.useAccessGroups`. Для неавторизованных
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
  Регистрирует нативные команды. Авто: включено для Discord/Telegram; выключено для Slack;
  игнорируется для провайдеров без нативной поддержки. Переопределяйте для каждого канала через
  `channels.<provider>.commands.native`. В Discord `false` пропускает регистрацию slash-команд;
  ранее зарегистрированные команды могут оставаться видимыми, пока их не удалят.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Регистрирует команды Skills нативно, когда это поддерживается. Авто: включено для
  Discord/Telegram; выключено для Slack. Переопределяйте через
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Включает `! <cmd>` для выполнения shell-команд хоста (псевдоним `/bash <cmd>`). Требует
  списки разрешений `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Сколько bash ждет перед переключением в фоновый режим (`0` переводит в фон
  немедленно).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Включает `/config` (читает/записывает `openclaw.json`). Только для владельца.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Включает `/mcp` (читает/записывает управляемую OpenClaw конфигурацию MCP в `mcp.servers`). Только для владельца.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Включает `/plugins` (обнаружение/статус Plugin плюс установка и включение/отключение). Запись только для владельца.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Включает `/debug` (переопределения конфигурации только на время выполнения). Только для владельца.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Включает `/restart` и действия инструментов для перезапуска Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Явный список разрешений владельца для поверхностей команд только для владельца. Отдельно от
  `commands.allowFrom` и доступа через сопряжение DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Для каждого канала: требует идентичность владельца для команд только для владельца. Когда `true`,
  отправитель должен совпадать с `commands.ownerAllowFrom` или иметь внутреннюю область `operator.admin`.
  Подстановочная запись `allowFrom` **недостаточна**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Управляет тем, как идентификаторы владельцев отображаются в системном промпте.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Секрет HMAC, используемый при `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Список разрешений по провайдерам для авторизации команд. Когда он настроен, это
  **единственный** источник авторизации для команд и директив. Используйте `"*"` для
  глобального значения по умолчанию; ключи конкретных провайдеров переопределяют его.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Применяет списки разрешений/политики для команд, когда `commands.allowFrom` не задан.
</ParamField>

## Список команд

Команды поступают из трех источников:

- **Встроенные команды ядра:** `src/auto-reply/commands-registry.shared.ts`
- **Сгенерированные команды дока:** `src/auto-reply/commands-registry.data.ts`
- **Команды Plugin:** вызовы `registerCommand()` Plugin

Доступность зависит от флагов конфигурации, поверхности канала и установленных/включенных
Plugin.

### Команды ядра

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Команда | Описание |
    | --- | --- |
    | `/new [model]` | Архивировать текущий сеанс и начать новый |
    | `/reset [soft [message]]` | Сбросить текущий сеанс на месте. `soft` сохраняет транскрипт, удаляет повторно используемые идентификаторы сеанса CLI-бэкенда и повторно запускает старт |
    | `/name <title>` | Назвать или переименовать текущий сеанс. Опустите заголовок, чтобы увидеть текущее имя и предложение |
    | `/compact [instructions]` | Сжать контекст сеанса. См. [Compaction](/ru/concepts/compaction) |
    | `/stop` | Прервать текущий запуск |
    | `/session idle <duration\|off>` | Управлять истечением срока простоя привязки потока |
    | `/session max-age <duration\|off>` | Управлять истечением максимального срока привязки потока |
    | `/export-session [path]` | Экспортировать текущий сеанс в HTML. Псевдоним: `/export` |
    | `/export-trajectory [path]` | Экспортировать пакет траектории JSONL для текущего сеанса. Псевдоним: `/trajectory` |

    <Note>
      Control UI перехватывает введенный `/new`, чтобы создать новый
      сеанс панели и переключиться на него, кроме случаев, когда настроено
      `session.dmScope: "main"` и текущий родительский сеанс является основным сеансом агента — в этом случае `/new`
      сбрасывает основной сеанс на месте. Введенный `/reset` по-прежнему запускает
      сброс Gateway на месте. Используйте `/model default`, когда нужно очистить закрепленный
      выбор модели сеанса.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Команда | Описание |
    | --- | --- |
    | `/think <level\|default>` | Задать уровень размышления или очистить переопределение сеанса. Псевдонимы: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Переключить подробный вывод. Псевдоним: `/v` |
    | `/trace on\|off` | Переключить вывод трассировки Plugin для текущего сеанса |
    | `/fast [status\|auto\|on\|off\|default]` | Показать, задать или очистить быстрый режим |
    | `/reasoning [on\|off\|stream]` | Переключить видимость рассуждений. Псевдоним: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Переключить повышенный режим. Псевдоним: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Показать или задать значения exec по умолчанию |
    | `/login [codex\|openai\|openai-codex]` | Сопрячь вход Codex/OpenAI из приватного чата или сеанса Web UI. Только владелец/администратор |
    | `/model [name\|#\|status]` | Показать или задать модель |
    | `/models [provider] [page] [limit=<n>\|all]` | Список настроенных/доступных по авторизации провайдеров или моделей |
    | `/queue <mode>` | Управлять поведением очереди активных запусков. См. [Очередь](/ru/concepts/queue) и [Управление очередью](/ru/concepts/queue-steering) |
    | `/steer <message>` | Внедрить указания в активный запуск. Псевдоним: `/tell`. См. [Управление](/ru/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` предназначен для отладки — держите его **выключенным** при обычном использовании.
        - `/trace` раскрывает только строки трассировки/отладки, принадлежащие Plugin; обычный подробный шум остается выключенным.
        - `/fast auto|on|off` сохраняет переопределение сеанса; используйте опцию `inherit` в UI сеансов, чтобы очистить его.
        - `/fast` зависит от провайдера: OpenAI/Codex сопоставляют его с `service_tier=priority`; прямые запросы Anthropic сопоставляют его с `service_tier=auto` или `standard_only`.
        - `/reasoning`, `/verbose` и `/trace` рискованны в групповых настройках — они могут раскрыть внутренние рассуждения или диагностику Plugin. Держите их выключенными в групповых чатах.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` немедленно сохраняет новую модель в сеансе.
        - Если агент простаивает, следующий запуск сразу использует ее.
        - Если запуск активен, переключение помечается как ожидающее и применяется в следующей чистой точке повтора.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Команда | Описание |
    | --- | --- |
    | `/help` | Показать краткую справку |
    | `/commands` | Показать сгенерированный каталог команд |
    | `/tools [compact\|verbose]` | Показать, что текущий агент может использовать прямо сейчас |
    | `/status` | Показать статус выполнения/среды выполнения, время работы Gateway и системы, состояние Plugin, а также использование/квоту провайдера |
    | `/status plugins` | Показать подробное состояние Plugin: ошибки загрузки, карантины, сбои каналов, проблемы зависимостей, уведомления о совместимости |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Управлять устойчивой [целью](/ru/tools/goal) текущего сеанса |
    | `/diagnostics [note]` | Поток отчета поддержки только для владельца. Каждый раз запрашивает одобрение exec |
    | `/crestodian <request>` | Запустить помощник настройки и ремонта Crestodian из DM владельца |
    | `/tasks` | Список активных/недавних фоновых задач для текущего сеанса |
    | `/context [list\|detail\|map\|json]` | Объяснить, как собирается контекст |
    | `/whoami` | Показать ваш идентификатор отправителя. Псевдоним: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Управлять футером использования для каждого ответа (`reset`/`inherit`/`clear`/`default` очищает переопределение сеанса, чтобы снова наследовать настроенное значение по умолчанию) или вывести локальную сводку стоимости |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Команда | Описание |
    | --- | --- |
    | `/skill <name> [input]` | Запустить Skill по имени |
    | `/allowlist [list\|add\|remove] ...` | Управлять записями списка разрешений. Только текст |
    | `/approve <id> <decision>` | Разрешить запросы одобрения exec или Plugin |
    | `/btw <question>` | Задать побочный вопрос без изменения контекста сеанса. Псевдоним: `/side`. См. [BTW](/ru/tools/btw) |
  </Accordion>

  <Accordion title="Субагенты и ACP">
    | Команда | Описание |
    | --- | --- |
    | `/subagents list\|log\|info` | Просмотреть запуски субагентов для текущей сессии |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Управлять сессиями ACP и параметрами среды выполнения. Элементы управления средой выполнения требуют внешнего владельца или внутренней учетной записи администратора Gateway |
    | `/focus <target>` | Привязать текущую ветку Discord или тему Telegram к целевой сессии |
    | `/unfocus` | Удалить привязку текущей ветки |
    | `/agents` | Список агентов, привязанных к ветке, для текущей сессии |
  </Accordion>

  <Accordion title="Запись только для владельца и администрирование">
    | Команда | Требуется | Описание |
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
    | `/bash <command>` | Выполнить команду оболочки хоста. Псевдоним: `! <command>`. Требуется `commands.bash: true` |
    | `!poll [sessionId]` | Проверить фоновую задачу bash |
    | `!stop [sessionId]` | Остановить фоновую задачу bash |
  </Accordion>
</AccordionGroup>

### Команды Dock

Команды Dock переключают маршрут ответа активной сессии на другой связанный канал.
Настройку и устранение неполадок см. в [Channel docking](/ru/concepts/channel-docking).

Сгенерировано из Plugin каналов с поддержкой нативных команд:

- `/dock-discord` (псевдоним: `/dock_discord`)
- `/dock-mattermost` (псевдоним: `/dock_mattermost`)
- `/dock-slack` (псевдоним: `/dock_slack`)
- `/dock-telegram` (псевдоним: `/dock_telegram`)

Команды Dock требуют `session.identityLinks`. Исходный отправитель и целевой peer
должны находиться в одной группе идентичности.

### Команды встроенных Plugin

| Команда                                                                                      | Описание                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Включить или выключить Dreaming памяти (владелец или администратор Gateway). См. [Dreaming](/ru/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Управлять сопряжением устройств. См. [Сопряжение](/ru/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | Временно подготовить команды высокорискового телефонного узла                                       |
| `/voice status\|list\|set <voiceId>`                                                         | Управлять конфигурацией голоса Talk. Нативное имя в Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | Отправить пресеты rich card LINE. См. [LINE](/ru/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Управлять обвязкой app-server Codex. См. [обвязка Codex](/ru/plugins/codex-harness)   |

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
    По умолчанию команды Skills маршрутизируются к модели как обычный запрос.

    Skills могут объявлять `command-dispatch: tool`, чтобы маршрутизироваться напрямую к инструменту
    (детерминированно, без участия модели). Пример: `/prose` (Plugin OpenProse)
    — см. [OpenProse](/ru/prose).

  </Accordion>
  <Accordion title="Аргументы нативных команд">
    Discord использует автодополнение для динамических параметров и меню кнопок, когда обязательные
    аргументы пропущены. Telegram и Slack показывают меню кнопок для команд с
    вариантами выбора. Динамические варианты разрешаются относительно модели целевой сессии, поэтому
    параметры, зависящие от модели, например уровни `/think`, следуют переопределению `/model` сессии.
  </Accordion>
</AccordionGroup>

## `/tools` — что агент может использовать сейчас

`/tools` отвечает на вопрос среды выполнения: **что этот агент может использовать прямо сейчас в этом
разговоре** — а не предоставляет статический каталог конфигурации.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Результаты ограничены сессией. Смена агента, канала, ветки, отправителя,
авторизации или модели может изменить вывод. Для редактирования профиля и переопределений
используйте панель Tools в Control UI или поверхности конфигурации.

## `/model` — выбор модели

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

В Discord `/model` и `/models` открывают интерактивный выбор с выпадающими списками провайдера и
модели. Выбор учитывает `agents.defaults.models`, включая
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

`/mcp` сохраняет конфигурацию в конфигурации OpenClaw, а не во встроенных настройках проекта агента.

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

`/plugins enable|disable` обновляет конфигурацию Plugin и горячо перезагружает среду выполнения
Plugin Gateway для новых ходов агента. `/plugins install` автоматически перезапускает управляемые
Gateway, потому что изменились исходные модули Plugin.

## `/trace` — вывод трассировки Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` показывает строки трассировки/отладки Plugin, ограниченные сессией, без полного подробного
режима. Он не заменяет `/debug` (переопределения среды выполнения) или `/verbose` (обычный
вывод инструментов).

## `/btw` — побочные вопросы

`/btw` — это быстрый побочный вопрос о контексте текущей сессии. Псевдоним: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

В отличие от обычного сообщения:

- Использует текущую сессию как фоновый контекст.
- В сессиях обвязки Codex выполняется как эфемерная побочная ветка Codex.
- **Не** изменяет будущий контекст сессии.
- Не записывается в историю transcript.

Полное поведение см. в [побочные вопросы BTW](/ru/tools/btw).

## Примечания к поверхностям

<AccordionGroup>
  <Accordion title="Область действия сессии по поверхностям">
    - **Текстовые команды:** выполняются в обычной чат-сессии (личные сообщения используют общий `main`, у групп есть собственная сессия).
    - **Нативные команды Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Нативные команды Slack:** `agent:<agentId>:slack:slash:<userId>` (префикс настраивается через `channels.slack.slashCommand.sessionPrefix`)
    - **Нативные команды Telegram:** `telegram:slash:<userId>` (нацеливаются на чат-сессию через `CommandTargetSessionKey`)
    - **`/login codex`** отправляет коды сопряжения устройства только через приватный чат или пути ответа Web UI. Вызовы из групп/тем Telegram просят владельца написать боту в личные сообщения.
    - **`/stop`** нацеливается на активную чат-сессию, чтобы прервать текущий запуск.

  </Accordion>
  <Accordion title="Особенности Slack">
    `channels.slack.slashCommand` поддерживает одну команду в стиле `/openclaw`.
    При `commands.native: true` создайте одну slash-команду Slack для каждой встроенной
    команды. Зарегистрируйте `/agentstatus` (не `/status`), потому что Slack резервирует
    `/status`. Текстовая `/status` по-прежнему работает в сообщениях Slack.
  </Accordion>
  <Accordion title="Быстрый путь и встроенные сокращения">
    - Сообщения, состоящие только из команды, от отправителей из списка разрешенных обрабатываются немедленно (в обход очереди и модели).
    - Встроенные сокращения (`/help`, `/commands`, `/status`, `/whoami`) также работают внутри обычных сообщений и удаляются до того, как модель увидит оставшийся текст.
    - Неавторизованные сообщения, состоящие только из команды, молча игнорируются; встроенные токены `/...` обрабатываются как обычный текст.

  </Accordion>
  <Accordion title="Примечания к аргументам">
    - Команды принимают необязательный `:` между командой и аргументами (`/think: high`, `/send: on`).
    - `/new <model>` принимает псевдоним модели, `provider/model` или имя провайдера (нечеткое совпадение); если совпадения нет, текст обрабатывается как тело сообщения.
    - `/allowlist add|remove` требует `commands.config: true` и учитывает `configWrites` канала.

  </Accordion>
</AccordionGroup>

## Использование и статус провайдера

- **Использование/квота провайдера** (например, "Claude 80% left") отображается в `/status` для провайдера текущей модели, когда отслеживание использования включено.
- **Строки токенов/кэша** в `/status` могут откатываться к последней записи использования transcript, когда live-снимок сессии разрежен.
- **Выполнение и среда выполнения:** `/status` сообщает `Execution` для эффективного пути sandbox и `Runtime` для того, кто запускает сессию: `OpenClaw Default`, `OpenAI Codex`, backend CLI или backend ACP.
- **Токены/стоимость на ответ:** управляется `/usage off|tokens|full`.
- `/model status` относится к моделям/аутентификации/endpoint, а не к использованию.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Как регистрируются и ограничиваются slash-команды Skills.
  </Card>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Создайте Skill, который регистрирует собственную slash-команду.
  </Card>
  <Card title="BTW" href="/ru/tools/btw" icon="comments">
    Побочные вопросы без изменения контекста сессии.
  </Card>
  <Card title="Steer" href="/ru/tools/steer" icon="compass">
    Направляйте агента во время выполнения с помощью `/steer`.
  </Card>
</CardGroup>
