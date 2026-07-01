---
read_when:
    - Настройка загрузки, установки или ограничения Skills
    - Настройка видимости Skills для каждого агента
    - Настройка ограничений Skill Workshop или политики утверждения
sidebarTitle: Skills config
summary: Полный справочник по схеме конфигурации skills.*, спискам разрешенных агентов, настройкам workshop и обработке переменных среды sandbox.
title: Конфигурация Skills
x-i18n:
    generated_at: "2026-07-01T08:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

Большая часть конфигурации Skills находится в разделе `skills` в
`~/.openclaw/openclaw.json`. Видимость для конкретных агентов находится в
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
  Для встроенной генерации изображений используйте `agents.defaults.imageGenerationModel`
  вместе с основным инструментом `image_generate` вместо `skills.entries`. Записи
  Skills предназначены только для пользовательских или сторонних рабочих процессов Skills.
</Note>

## Загрузка (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Дополнительные каталоги Skills для сканирования с самым низким приоритетом
  (после встроенных Skills и Skills из Plugin). Пути разворачиваются с поддержкой `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Доверенные реальные целевые каталоги, в которые могут разрешаться символические
  ссылки на папки Skills, даже если символическая ссылка находится вне
  настроенного корня. Используйте это для намеренных структур с соседними
  репозиториями, например
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Держите этот список
  узким — не указывайте широкие корни вроде `~` или `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Отслеживать папки Skills и обновлять снимок Skills при изменении файлов
  `SKILL.md`. Охватывает вложенные файлы в сгруппированных корнях Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Окно debounce для событий наблюдателя Skills в миллисекундах.
</ParamField>

## Установка (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Предпочитать установщики Homebrew, когда доступен `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Предпочитаемый менеджер пакетов Node для установки Skills. Это влияет только
  на установку Skills — среда выполнения Gateway по-прежнему должна использовать
  Node (Bun не рекомендуется для WhatsApp/Telegram). Используйте
  `openclaw setup --node-manager` для npm, pnpm или bun; задайте `"yarn"`
  вручную для установок Skills, основанных на Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Разрешить доверенным клиентам Gateway с `operator.admin` устанавливать
  приватные zip-архивы, подготовленные через `skills.upload.*`. Обычным
  установкам ClawHub этот параметр не нужен.
</ParamField>

## Политика установки оператора (`security.installPolicy`)

Используйте `security.installPolicy`, когда операторам нужна доверенная локальная
команда для разрешения или блокировки установки Skills и Plugin с учетом
политики конкретного хоста. Политика запускается после того, как OpenClaw
подготовил исходный материал, и до продолжения установки или обновления. Она
применяется к Skills из ClawHub, загруженным Skills, Skills из Git/локального
пути, установщикам зависимостей Skills, а также источникам установки/обновления
Plugin.

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
  Включает политику установки, принадлежащую оператору. Если она включена без
  действительной команды `exec`, установки завершаются закрытым отказом.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необязательный фильтр целей. Если он не указан, политика применяется ко всем
  поддерживаемым целям, чтобы новые установки неожиданно не проходили без
  проверки.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютный путь к доверенному исполняемому файлу политики. OpenClaw запускает
  его без оболочки и проверяет путь перед использованием.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статические аргументы, передаваемые после `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальное астрономическое время выполнения для одного решения политики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальное время без вывода в stdout или stderr, после которого политика
  завершается закрытым отказом.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальное суммарное число байтов stdout и stderr, принимаемое от процесса
  политики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Литеральные переменные окружения, передаваемые процессу политики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Имена переменных окружения, копируемых из процесса OpenClaw в процесс
  политики. Передаются только названные переменные.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необязательный список разрешенных каталогов, которые могут содержать
  исполняемый файл политики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Обходит проверки владельца и разрешений пути команды. Используйте только
  тогда, когда путь защищен другим механизмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Разрешает настроенному пути команды быть символической ссылкой. Разрешенная
  цель все равно должна проходить остальные проверки пути. Аргументы скриптов
  интерпретатора должны быть прямыми обычными файлами, а не символическими
  ссылками.
</ParamField>

Политика получает один JSON-объект в stdin с `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необязательным структурированным `source`, структурированными `origin` и
`request`. Она должна записать один JSON-объект в stdout:
`{ "protocolVersion": 1, "decision": "allow" }` или
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненулевой
код выхода, тайм-аут, некорректный JSON, отсутствующие поля или неподдерживаемые
версии протокола приводят к закрытому отказу.

OpenClaw не выполняет политику установки во время обычного запуска Gateway.
Установки и обновления завершаются закрытым отказом, когда политика включена,
но недоступна. `openclaw doctor` выполняет статическую проверку, а
`openclaw doctor --deep` выполняет синтетическую пробную установку для
настроенной команды.

Массовые обновления применяют политику к каждой цели: заблокированное обновление
Skills или Plugin завершается ошибкой для этой цели, не отключая политику и не
пропуская последующие цели в пакете.

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

## Список разрешенных встроенных Skills

<ParamField path="skills.allowBundled" type="string[]">
  Необязательный список разрешений только для **встроенных** Skills. Когда он
  задан, доступны только встроенные Skills из списка. Управляемые Skills, Skills
  уровня агента и рабочей области не затрагиваются.
</ParamField>

## Записи отдельных Skills (`skills.entries`)

Ключи в `entries` по умолчанию соответствуют `name` Skills. Если Skill задает
`metadata.openclaw.skillKey`, используйте этот ключ вместо него. Имена с дефисом
берутся в кавычки (JSON5 разрешает ключи в кавычках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` отключает Skill, даже если он встроен или установлен. Встроенный Skill
  `coding-agent` включается явно — задайте для него `true` и убедитесь, что
  один из `claude`, `codex`, `opencode` или другой поддерживаемый CLI установлен
  и аутентифицирован.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Удобное поле для Skills, которые объявляют `metadata.openclaw.primaryEnv`.
  Поддерживает строку открытым текстом или SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Переменные окружения, внедряемые для запуска агента. Внедряются только тогда,
  когда переменная еще не задана в процессе.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необязательный контейнер для пользовательских полей конфигурации отдельного
  Skills.
</ParamField>

## Списки разрешений агентов (`agents`)

Используйте конфигурацию агента, когда вам нужны одни и те же корни Skills для
машины/рабочей области, но разный видимый набор Skills для каждого агента.

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
  Общий базовый список разрешений, наследуемый агентами, у которых отсутствует
  `agents.list[].skills`. Полностью опустите, чтобы Skills по умолчанию не были
  ограничены.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явный итоговый набор Skills для этого агента. Явные списки **заменяют**
  унаследованные значения по умолчанию — они не объединяются. Задайте `[]`,
  чтобы не открывать этому агенту никаких Skills.
</ParamField>

<Warning>
  Списки разрешений Skills для агентов являются фильтром видимости и загрузки
  для обнаружения OpenClaw Skills, подсказок, обнаружения slash-команд,
  синхронизации песочницы и снимков Skills. Они не являются границей авторизации
  на уровне оболочки во время выполнения. Если агент может выполнять хостовый
  `exec`, эта оболочка все равно может запускать внешние клиенты или читать
  файлы хоста, видимые пользователю выполнения, включая реестры клиентов MCP,
  такие как `~/.openclaw/skills/config/mcporter.json`. Для изоляции MCP на
  уровне агента сочетайте списки разрешений Skills с изоляцией песочницы/пользователя
  ОС, запретите или жестко ограничьте хостовый exec списком разрешений и
  предпочитайте учетные данные на уровне агента на сервере MCP.
</Warning>

## Мастерская (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Когда установлено `true`, агенты могут создавать ожидающие предложения из
  устойчивых сигналов разговора после успешных ходов. Создание Skills по запросу
  пользователя всегда проходит через Skill Workshop независимо от этого
  параметра.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` требует одобрения оператора перед инициированными агентом применением, отклонением или
  помещением в карантин. `auto` разрешает эти действия без одобрения.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Разрешить применению Skill Workshop запись через символьные ссылки на Skills в рабочей области, чей
  реальный целевой путь уже доверен через `skills.load.allowSymlinkTargets`. Оставьте этот параметр
  отключенным, если применение сгенерированных предложений не должно изменять этот общий корневой
  каталог Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальное количество ожидающих и помещенных в карантин предложений, сохраняемых для каждой рабочей области.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальный размер тела предложения в байтах. Описания предложений жестко ограничены
  160 байтами, потому что они появляются в выводе обнаружения и списка.
</ParamField>

## Корневые каталоги Skills с символьными ссылками

По умолчанию корневые каталоги Skills рабочей области, проектного агента, дополнительных каталогов и встроенных Skills являются
границами изоляции. Папка Skills с символьной ссылкой в `<workspace>/skills`,
которая разрешается за пределами корневого каталога, пропускается с сообщением в журнале.

Чтобы разрешить намеренную структуру с символьными ссылками, объявите доверенный целевой путь:

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

С этой конфигурацией `<workspace>/skills/manager -> ~/Projects/manager/skills`
принимается после разрешения реального пути. `extraDirs` сканирует соседний репозиторий напрямую;
`allowSymlinkTargets` сохраняет путь с символьной ссылкой для существующих структур.

По умолчанию применение Skill Workshop не выполняет запись через эти символьные ссылки. Чтобы разрешить
применению Workshop изменять Skills в уже доверенных целевых путях символьных ссылок, включите это
отдельно:

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

Управляемые каталоги `~/.openclaw/skills` и личные каталоги `~/.agents/skills`
уже принимают символьные ссылки на каталоги Skills (изоляция `SKILL.md` для каждого Skill по-прежнему
применяется).

## Изолированные Skills и переменные среды

<Warning>
  `skills.entries.<skill>.env` и `apiKey` применяются только к запускам на **хосте**. Внутри
  песочницы они не действуют — Skill, зависящий от `GEMINI_API_KEY`, завершится
  ошибкой `apiKey not configured`, если переменная не будет отдельно передана
  в песочницу.
</Warning>

Передайте секреты в песочницу Docker с помощью:

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
  Пользователи с доступом к демону Docker могут просматривать значения `sandbox.docker.env`
  через метаданные Docker. Используйте смонтированный файл секрета, пользовательский образ или
  другой способ доставки, если такое раскрытие неприемлемо.
</Note>

## Напоминание о порядке загрузки

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Изменения Skills и конфигурации вступают в силу в следующем новом сеансе, когда
наблюдатель включен, или на следующем ходе агента, когда наблюдатель обнаружит изменение.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Справочник Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Что такое Skills, порядок загрузки, ограничения доступа и формат SKILL.md.
  </Card>
  <Card title="Создание Skills" href="/ru/tools/creating-skills" icon="hammer">
    Создание пользовательских Skills рабочей области.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для Skills, подготовленных агентом.
  </Card>
  <Card title="Слэш-команды" href="/ru/tools/slash-commands" icon="terminal">
    Встроенный каталог слэш-команд и директивы чата.
  </Card>
</CardGroup>
