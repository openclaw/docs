---
read_when:
    - Настройка загрузки, установки и условий доступности Skills
    - Настройка видимости Skills для отдельных агентов
    - Настройка ограничений или политики одобрения для Skill Workshop
sidebarTitle: Skills config
summary: Полное справочное описание схемы конфигурации skills.*, списков разрешённых агентов, настроек мастерской и обработки переменных среды песочницы.
title: Конфигурация Skills
x-i18n:
    generated_at: "2026-07-12T11:58:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Основная часть конфигурации Skills находится в разделе `skills` файла
`~/.openclaw/openclaw.json`. Видимость для отдельных агентов настраивается в
`agents.defaults.skills` и `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Для встроенной генерации изображений вместо `skills.entries` используйте
  `agents.defaults.imageGenerationModel` вместе с основным инструментом
  `image_generate`. Записи Skills предназначены только для пользовательских
  или сторонних рабочих процессов Skills.
</Note>

## Загрузка (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Дополнительные каталоги Skills для сканирования с самым низким приоритетом
  (ниже встроенных Skills и Skills из Plugin). В путях поддерживается раскрытие
  `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Доверенные реальные целевые каталоги, в которые могут разрешаться каталоги
  Skills, являющиеся символическими ссылками, даже если символическая ссылка
  находится вне настроенного корневого каталога. Используйте этот параметр для
  намеренно организованных структур соседних репозиториев, например
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Ограничивайте этот
  список — не указывайте в нём широкие корневые каталоги, такие как `~` или
  `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Отслеживает каталоги Skills и обновляет снимок Skills при изменении файлов
  `SKILL.md`. Охватывает вложенные файлы в сгруппированных корневых каталогах
  Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Интервал устранения дребезга для событий наблюдателя Skills в миллисекундах.
</ParamField>

## Установка (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Отдаёт предпочтение установщикам Homebrew, когда доступен `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Предпочитаемый менеджер пакетов Node для установки Skills. Этот параметр
  влияет только на установку Skills — среда выполнения Gateway по-прежнему
  должна использовать Node (Bun не рекомендуется для WhatsApp/Telegram).
  `openclaw setup --node-manager` и `openclaw onboard --node-manager` принимают
  `npm`, `pnpm` или `bun`; для установки Skills с помощью Yarn непосредственно
  задайте в конфигурации `"yarn"`.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Разрешает доверенным клиентам Gateway с ролью `operator.admin` устанавливать
  частные ZIP-архивы, подготовленные через `skills.upload.*`. Для обычной
  установки из ClawHub этот параметр не требуется.
</ParamField>

## Политика установки оператора (`security.installPolicy`)

Используйте `security.installPolicy`, когда операторам нужна доверенная
локальная команда для разрешения или блокировки установки Skills и Plugin
с учётом политики конкретного хоста. Политика выполняется после того, как
OpenClaw подготовил исходные материалы, и до продолжения установки или
обновления. Она применяется к Skills из ClawHub, загруженным Skills,
Skills из Git или локальных источников, установщикам зависимостей Skills,
а также к источникам установки и обновления Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Включает политику установки, управляемую оператором. Если она включена без
  допустимой команды `exec`, установка блокируется по умолчанию.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необязательный фильтр целей. Если он не указан, политика применяется ко всем
  поддерживаемым целям, чтобы новые установки неожиданно не разрешались по
  умолчанию.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютный путь к доверенному исполняемому файлу политики. OpenClaw запускает
  его без оболочки и проверяет путь перед использованием.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статические аргументы, передаваемые после `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальное фактическое время выполнения одного решения политики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальное время без вывода в stdout или stderr, после которого политика
  блокирует операцию по умолчанию.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальное суммарное количество байтов stdout и stderr, принимаемое от
  процесса политики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Буквально заданные переменные окружения, предоставляемые процессу политики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Имена переменных окружения, копируемых из процесса OpenClaw в процесс
  политики. Передаются только явно указанные переменные.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необязательный список разрешённых каталогов, в которых может находиться
  исполняемый файл политики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Отключает проверки владельца и разрешений пути команды. Используйте только
  тогда, когда путь защищён другим механизмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Разрешает настроенному пути команды быть символической ссылкой. Разрешённая
  цель всё равно должна проходить остальные проверки пути. Аргументы сценария
  интерпретатора должны быть непосредственно обычными файлами, а не
  символическими ссылками.
</ParamField>

Политика получает через stdin один объект JSON с полями `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необязательным структурированным полем `source`, а также структурированными
полями `origin` и `request`. Она должна записать в stdout один объект JSON:
`{ "protocolVersion": 1, "decision": "allow" }` или
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненулевой
код завершения, превышение времени ожидания, некорректный JSON, отсутствие
полей или неподдерживаемые версии протокола приводят к блокировке по
умолчанию.

OpenClaw не выполняет политику установки при обычном запуске Gateway.
Если политика включена, но недоступна, установка и обновление блокируются
по умолчанию. `openclaw doctor` выполняет статическую проверку;
`openclaw doctor --deep` выполняет синтетическую пробную установку с помощью
настроенной команды.

При массовом обновлении политика применяется к каждой цели отдельно:
заблокированное обновление Skill или Plugin завершается ошибкой для этой цели,
но не отключает политику и не пропускает последующие цели в пакете.

Пример stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Минимальная команда политики:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Список разрешённых встроенных Skills

<ParamField path="skills.allowBundled" type="string[]">
  Необязательный список разрешённых только для **встроенных** Skills. Если он
  задан, использовать можно только перечисленные встроенные Skills. На
  управляемые Skills, Skills уровня агента и рабочей области это не влияет.
</ParamField>

## Записи отдельных Skills (`skills.entries`)

По умолчанию ключи в `entries` соответствуют полю `name` Skill. Если Skill
определяет `metadata.openclaw.skillKey`, используйте вместо него этот ключ.
Имена с дефисами заключайте в кавычки (JSON5 допускает ключи в кавычках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  Значение `false` отключает Skill, даже если он встроен или установлен.
  Встроенный Skill `coding-agent` включается явно: задайте значение `true`
  и убедитесь, что `claude`, `codex`, `opencode` или другой поддерживаемый
  CLI установлен и аутентифицирован.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Вспомогательное поле для Skills, объявляющих
  `metadata.openclaw.primaryEnv`. Поддерживает строку открытого текста или
  SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Переменные окружения, внедряемые при запуске агента. Внедряются только в том
  случае, если переменная ещё не задана в процессе.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необязательный набор пользовательских полей конфигурации для отдельного
  Skill.
</ParamField>

## Списки разрешённых Skills для агентов (`agents`)

Используйте конфигурацию агентов, когда требуются одинаковые корневые каталоги
Skills на компьютере и в рабочей области, но разные наборы видимых Skills для
каждого агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Общий базовый список разрешённых Skills, наследуемый агентами, у которых
  отсутствует `agents.list[].skills`. Полностью опустите этот параметр, чтобы
  по умолчанию не ограничивать Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явный окончательный набор Skills для этого агента. Явные списки
  **заменяют** унаследованные значения по умолчанию, а не объединяются с ними.
  Укажите `[]`, чтобы не предоставлять этому агенту никакие Skills.
</ParamField>

<Warning>
  Списки разрешённых Skills агентов служат фильтром видимости и загрузки для
  обнаружения Skills в OpenClaw, подсказок, обнаружения команд с косой чертой,
  синхронизации песочницы и снимков Skills. Они не являются границей
  авторизации на уровне оболочки. Если агент может выполнять `exec` на хосте,
  эта оболочка по-прежнему может запускать внешние клиенты или читать файлы
  хоста, доступные пользователю выполнения, включая реестры клиентов MCP,
  например `~/.openclaw/skills/config/mcporter.json`. Для изоляции MCP по
  агентам сочетайте списки разрешённых Skills с изоляцией песочницы или
  пользователей ОС, запрещайте выполнение `exec` на хосте либо задавайте для
  него строгий список разрешённых команд и предпочитайте отдельные учётные
  данные для каждого агента на сервере MCP.
</Warning>

## Мастерская (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Если задано значение `true`, после успешных ходов агенты могут создавать
  ожидающие рассмотрения предложения на основе устойчивых сигналов из диалога.
  Создание Skills по запросу пользователя всегда выполняется через Skill Workshop
  независимо от этой настройки.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` требует одобрения оператора, прежде чем агент сможет применить,
  отклонить или поместить предложение в карантин. `auto` разрешает эти действия
  без одобрения.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Разрешает Skill Workshop при применении предложения выполнять запись через
  символические ссылки на Skills в рабочей области, фактическая целевая
  директория которых уже отмечена как доверенная в
  `skills.load.allowSymlinkTargets`. Не включайте эту настройку, если применение
  сгенерированных предложений не должно изменять общий корневой каталог Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальное количество ожидающих рассмотрения и помещённых в карантин
  предложений, сохраняемых для каждой рабочей области (допустимый диапазон:
  1–200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальный размер содержимого предложения в байтах (допустимый диапазон:
  1024–200000). Описания предложений отдельно жёстко ограничены 160 байтами,
  поскольку они отображаются в результатах обнаружения и списках.
</ParamField>

Сведения о жизненном цикле предложений, командах CLI, параметрах инструментов
агента и методах Gateway, которыми управляет эта конфигурация, см. в разделе
[Skill Workshop](/ru/tools/skill-workshop).

## Корневые каталоги Skills с символическими ссылками

По умолчанию корневые каталоги Skills рабочей области, агента проекта,
дополнительных директорий и встроенных Skills являются границами вложенности.
Папка Skills с символической ссылкой в `<workspace>/skills`, которая разрешается
за пределами корневого каталога, пропускается с записью сообщения в журнал.

Чтобы разрешить намеренную структуру символических ссылок, объявите доверенную
целевую директорию:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

При такой конфигурации
`<workspace>/skills/manager -> ~/Projects/manager/skills` принимается после
разрешения реального пути. `extraDirs` сканирует соседний репозиторий напрямую,
а `allowSymlinkTargets` сохраняет путь через символическую ссылку для
существующих структур.

По умолчанию Skill Workshop при применении предложения не выполняет запись
через такие символические ссылки. Чтобы разрешить Workshop изменять Skills в
уже доверенных целевых директориях символических ссылок, включите эту
возможность отдельно:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Управляемые директории `~/.openclaw/skills` и личные директории
`~/.agents/skills` уже безусловно допускают символические ссылки на директории
Skills (проверка вложенности `SKILL.md` для каждого Skills по-прежнему
применяется). Параметр `allowSymlinkTargets` требуется только для корневых
каталогов рабочей области, дополнительных директорий и агента проекта
(`<workspace>/.agents/skills`).

## Skills в изолированной среде и переменные окружения

<Warning>
  `skills.entries.<skill>.env` и `apiKey` применяются только при выполнении на
  **хосте**. В изолированной среде они не действуют: Skills, зависящий от
  `GEMINI_API_KEY`, завершится ошибкой `apiKey not configured`, если переменная
  не будет отдельно передана в изолированную среду.
</Warning>

Передавайте секреты в изолированную среду Docker следующим образом:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Пользователи с доступом к демону Docker могут просматривать значения
  `sandbox.docker.env` через метаданные Docker. Если такое раскрытие
  недопустимо, используйте подключённый файл с секретом, пользовательский образ
  или другой способ передачи.
</Note>

## Напоминание о порядке загрузки

```text
workspace/skills      (наивысший приоритет)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
встроенные Skills
skills.load.extraDirs (наименьший приоритет)
```

Если средство наблюдения включено, изменения в Skills и конфигурации вступают
в силу в следующем новом сеансе либо на следующем ходу агента, когда средство
наблюдения обнаружит изменение.

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Справочник по Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Что такое Skills, порядок загрузки, управление доступностью и формат
    SKILL.md.
  </Card>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Создание пользовательских Skills рабочей области.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений Skills, подготовленных агентами.
  </Card>
  <Card title="Команды с косой чертой" href="/ru/tools/slash-commands" icon="terminal">
    Каталог встроенных команд с косой чертой и директив чата.
  </Card>
</CardGroup>
