---
read_when:
    - Настройка загрузки, установки и условий доступности Skills
    - Настройка видимости Skills для каждого агента
    - Настройка ограничений Skill Workshop или политики утверждения
sidebarTitle: Skills config
summary: Полное справочное описание схемы конфигурации skills.*, списков разрешений агентов, настроек мастерской и обработки переменных среды песочницы.
title: Конфигурация Skills
x-i18n:
    generated_at: "2026-07-16T17:30:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

Большая часть конфигурации Skills находится в `skills` в
`~/.openclaw/openclaw.json`. Видимость для отдельных агентов задаётся в
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
      approvalPolicy: "auto",
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
  Дополнительные каталоги Skills для сканирования с самым низким приоритетом (ниже
  встроенных Skills и Skills плагинов). Пути разворачиваются с поддержкой `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Доверенные реальные целевые каталоги, в которые могут разрешаться каталоги Skills,
  являющиеся символическими ссылками, даже если символическая ссылка находится за пределами
  настроенного корня. Используйте это для намеренно организованных структур из соседних
  репозиториев, например `<workspace>/skills/manager -> ~/Projects/manager/skills`. Ограничьте этот
  список — не указывайте в нём широкие корневые каталоги, такие как `~` или `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Отслеживает каталоги Skills и обновляет снимок Skills при изменении файлов
  `SKILL.md`. Охватывает вложенные файлы в сгруппированных корнях Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Окно устранения дребезга для событий наблюдателя Skills в миллисекундах.
</ParamField>

## Установка (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Отдаёт предпочтение установщикам Homebrew, когда доступен `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Предпочтительный менеджер пакетов Node для установки Skills. Это влияет только на
  установку Skills — для среды выполнения OpenClaw CLI и Gateway требуется Node, поскольку
  каноническое хранилище состояния использует `node:sqlite`. `openclaw setup --node-manager` и
  `openclaw onboard --node-manager` принимают `npm`, `pnpm` или `bun`; для
  установки Skills через Yarn задайте `"yarn"` непосредственно в конфигурации.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Разрешает доверенным клиентам Gateway `operator.admin` устанавливать закрытые
  zip-архивы, подготовленные через `skills.upload.*`. Для обычной установки из ClawHub
  этот параметр не требуется.
</ParamField>

## Политика установки оператора (`security.installPolicy`)

Используйте `security.installPolicy`, когда операторам нужна доверенная локальная команда,
которая разрешает или блокирует установку Skills и плагинов согласно политике конкретного
хоста. Политика выполняется после того, как OpenClaw подготовит исходные материалы, и до
продолжения установки или обновления. Она применяется к Skills из ClawHub, загруженным
Skills, Skills из Git и локальных источников, установщикам зависимостей Skills, а также
источникам установки и обновления плагинов.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Не указывайте targets, чтобы охватить все поддерживаемые цели.
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
  Включает политику установки, управляемую оператором. Если она включена без допустимой
  команды `exec`, установка блокируется по принципу запрета по умолчанию.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необязательный фильтр целей. Если он не указан, политика применяется ко всем
  поддерживаемым целям, чтобы новые установки неожиданно не разрешались по умолчанию.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютный путь к доверенному исполняемому файлу политики. OpenClaw запускает его без
  оболочки и проверяет путь перед использованием.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статические аргументы, передаваемые после `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальное время выполнения одного решения политики по настенным часам.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальное время отсутствия вывода в stdout или stderr, после которого политика
  блокирует операцию по принципу запрета по умолчанию.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальное допустимое суммарное количество байтов stdout и stderr от процесса политики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Буквально заданные переменные окружения, предоставляемые процессу политики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Имена переменных окружения, копируемых из процесса OpenClaw в процесс политики.
  Передаются только явно указанные переменные.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необязательный список разрешённых каталогов, в которых может находиться исполняемый файл политики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Отключает проверки владельца и разрешений пути команды. Используйте только в том случае,
  если путь защищён другим механизмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Разрешает настроенному пути команды быть символической ссылкой. Разрешённая цель всё
  равно должна удовлетворять остальным проверкам пути. Аргументы скрипта интерпретатора
  должны быть непосредственно обычными файлами, а не символическими ссылками.
</ParamField>

Политика получает через stdin один объект JSON с `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необязательным структурированным `source`, структурированным `origin` и
`request`. Она должна вывести через stdout один объект JSON:
`{ "protocolVersion": 1, "decision": "allow" }` или `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненулевой код завершения,
тайм-аут, некорректный JSON, отсутствующие поля или неподдерживаемые версии
протокола приводят к блокировке по принципу запрета по умолчанию.

OpenClaw не выполняет политику установки при обычном запуске Gateway.
Если политика включена, но недоступна, установка и обновление блокируются
по принципу запрета по умолчанию. `openclaw doctor` выполняет статическую
проверку; `openclaw doctor --deep` выполняет синтетическую проверку установки
с помощью настроенной команды.

При массовом обновлении политика применяется к каждой цели отдельно: заблокированное
обновление Skill или плагина завершается ошибкой для этой цели, не отключая политику и
не пропуская последующие цели в пакете.

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
        reason: "локальные пути плагинов не разрешены на этом хосте",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Список разрешённых встроенных Skills

<ParamField path="skills.allowBundled" type="string[]">
  Необязательный список разрешений только для **встроенных** Skills. Если он задан,
  допускаются только встроенные Skills из этого списка. Управляемые Skills, Skills
  уровня агента и Skills рабочей области не затрагиваются.
</ParamField>

## Записи отдельных Skills (`skills.entries`)

Ключи в `entries` по умолчанию соответствуют `name` Skill. Если Skill
определяет `metadata.openclaw.skillKey`, используйте вместо этого данный ключ. Заключайте имена
с дефисами в кавычки (JSON5 допускает ключи в кавычках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` отключает Skill, даже если он встроен или установлен. Встроенный
  Skill `coding-agent` требует явного включения — задайте для него `true` и
  убедитесь, что `claude`, `codex`, `opencode` или другой
  поддерживаемый CLI установлен и аутентифицирован.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Вспомогательное поле для Skills, объявляющих `metadata.openclaw.primaryEnv`.
  Поддерживает строку с открытым текстом или SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Переменные окружения, внедряемые при запуске агента. Внедряются только в том случае,
  если переменная ещё не задана в процессе.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необязательный набор пользовательских полей конфигурации для отдельного Skill.
</ParamField>

## Списки разрешений агентов (`agents`)

Используйте конфигурацию агента, когда требуются одинаковые корни Skills машины и рабочей
области, но разный набор видимых Skills для каждого агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // общая базовая конфигурация
    },
    list: [
      { id: "writer" }, // наследует github, weather
      { id: "docs", skills: ["docs-search"] }, // полностью заменяет значения по умолчанию
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Общий базовый список разрешений, наследуемый агентами, у которых отсутствует
  `agents.list[].skills`. Не указывайте его вовсе, чтобы по умолчанию не ограничивать Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явный окончательный набор Skills для этого агента. Явно заданные списки **заменяют**
  унаследованные значения по умолчанию, а не объединяются с ними. Задайте
  `[]`, чтобы не предоставлять этому агенту доступ ни к одному Skill.
</ParamField>

<Warning>
  Списки разрешений Skills агента служат фильтром видимости и загрузки при обнаружении
  Skills в OpenClaw, формировании запросов, обнаружении команд с косой чертой,
  синхронизации песочницы и создании снимков Skills. Они не являются границей авторизации
  во время выполнения оболочки. Если агент может запускать на хосте `exec`,
  эта оболочка по-прежнему может запускать внешние клиенты или читать видимые пользователю
  выполнения файлы хоста, включая реестры клиентов MCP, такие как
  `~/.openclaw/skills/config/mcporter.json`. Для изоляции MCP по агентам сочетайте списки разрешений Skills
  с изоляцией песочницы или пользователя ОС, запрещайте выполнение команд на хосте
  либо задавайте для него строгий список разрешений и предпочитайте отдельные учётные
  данные для каждого агента на сервере MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Когда `true`, OpenClaw может создавать ожидающие рассмотрения предложения на основе устойчивых исправлений
  и анализировать успешно завершённую существенную работу после перехода системы
  в режим ожидания. Это может добавить фоновый запуск модели после подходящих ходов. Инициируемое пользователем
  создание навыков и `/learn` продолжают работать, когда параметр имеет значение `false`.
</ParamField>

Сведения о критериях применимости, конфиденциальности, стоимости,
разрешениях только на создание предложений и устранении неполадок см. в разделе [Самообучение](/ru/tools/self-learning).

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` позволяет агенту по собственной инициативе применять, отклонять или помещать в карантин без
  дополнительного запроса на утверждение. `pending` требует утверждения оператором.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Разрешает применению Skill Workshop выполнять запись через символические ссылки навыков рабочего пространства,
  фактическая цель которых уже считается доверенной согласно `skills.load.allowSymlinkTargets`. Не включайте
  этот параметр, если применение созданных предложений не должно изменять этот общий
  корневой каталог навыков.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальное число ожидающих рассмотрения и помещённых в карантин предложений, сохраняемых для каждого рабочего пространства (допустимый
  диапазон: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальный размер содержимого предложения в байтах (допустимый диапазон: 1024-200000). Для описаний
  предложений отдельно установлен жёсткий предел в 160 байт, поскольку они отображаются
  в результатах обнаружения и вывода списка.
</ParamField>

Сведения о жизненном цикле предложений, командах CLI,
параметрах инструментов агента и методах Gateway, которыми управляет эта конфигурация, см. в разделе [Skill Workshop](/ru/tools/skill-workshop).

## Корневые каталоги навыков с символическими ссылками

По умолчанию корневые каталоги навыков рабочего пространства, агента проекта, дополнительных каталогов и встроенных навыков
являются границами вложенности. Папка навыка с символической ссылкой в `<workspace>/skills`,
которая разрешается за пределами корневого каталога, пропускается с записью сообщения в журнал.

Чтобы разрешить намеренную структуру с символическими ссылками, объявите доверенную цель:

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

При такой конфигурации `<workspace>/skills/manager -> ~/Projects/manager/skills`
принимается после разрешения реального пути. `extraDirs` сканирует соседний репозиторий
напрямую; `allowSymlinkTargets` сохраняет путь с символической ссылкой для существующих
структур.

По умолчанию применение Skill Workshop не выполняет запись через эти символические ссылки. Чтобы
разрешить применению Workshop изменять навыки по уже доверенным целям символических ссылок,
включите это отдельно:

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
уже безусловно допускают символические ссылки на каталоги навыков (при этом по-прежнему применяется ограничение вложенности
`SKILL.md` для каждого навыка) — `allowSymlinkTargets` требуется только
для корневых каталогов рабочего пространства, дополнительных каталогов и агента проекта (`<workspace>/.agents/skills`).

## Навыки в песочнице и переменные среды

<Warning>
  `skills.entries.<skill>.env` и `apiKey` применяются только к запускам на **хосте**.
  Внутри песочницы они не действуют — навык, зависящий от
  `GEMINI_API_KEY`, завершится с ошибкой `apiKey not configured`, если переменная
  не будет отдельно передана в песочницу.
</Warning>

Передавайте секреты в песочницу Docker следующим образом:

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
  через метаданные Docker. Если такое раскрытие недопустимо, используйте подключённый файл секрета, собственный образ или
  другой способ передачи.
</Note>

## Напоминание о порядке загрузки

```text
workspace/skills      (наивысший приоритет)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
встроенные навыки
skills.load.extraDirs (наинизший приоритет)
```

Изменения навыков и конфигурации вступают в силу в следующем новом сеансе, если
наблюдатель включён, или на следующем ходу агента, когда наблюдатель обнаружит
изменение.

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Справочник по навыкам" href="/ru/tools/skills" icon="puzzle-piece">
    Что такое навыки, порядок загрузки, ограничения и формат SKILL.md.
  </Card>
  <Card title="Создание навыков" href="/ru/tools/creating-skills" icon="hammer">
    Создание собственных навыков рабочего пространства.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для навыков, подготовленных агентом.
  </Card>
  <Card title="Самообучение" href="/ru/tools/self-learning" icon="brain">
    Консервативные, явно включаемые предложения на основе завершённой работы.
  </Card>
  <Card title="Команды с косой чертой" href="/ru/tools/slash-commands" icon="terminal">
    Каталог встроенных команд с косой чертой и директивы чата.
  </Card>
</CardGroup>
