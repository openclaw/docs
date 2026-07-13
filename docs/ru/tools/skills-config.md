---
read_when:
    - Настройка загрузки, установки или условий доступности Skills
    - Настройка видимости Skills для каждого агента
    - Настройка ограничений или политики подтверждения Skill Workshop
sidebarTitle: Skills config
summary: Полный справочник по схеме конфигурации `skills.*`, спискам разрешённых агентов, настройкам мастерской и обработке переменных среды песочницы.
title: Конфигурация Skills
x-i18n:
    generated_at: "2026-07-13T18:51:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ed6163baf4d5715764be9bc85aa228b3a288ea2c3291326f4ea54ec41b1815bd
    source_path: tools/skills-config.md
    workflow: 16
---

Большая часть конфигурации навыков находится в разделе `skills` файла
`~/.openclaw/openclaw.json`. Видимость для отдельных агентов настраивается в разделах
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
  навыков предназначены только для пользовательских или сторонних рабочих процессов навыков.
</Note>

## Загрузка (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Дополнительные каталоги навыков для сканирования с самым низким приоритетом (ниже
  встроенных навыков и навыков плагинов). Пути раскрываются с поддержкой `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Доверенные реальные целевые каталоги, в которые могут разрешаться символические ссылки
  на папки навыков, даже если символическая ссылка находится за пределами настроенного корня.
  Используйте это для намеренной компоновки соседних репозиториев, например
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Ограничивайте этот список —
  не указывайте широкие корни, такие как `~` или `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Отслеживает папки навыков и обновляет снимок навыков при изменении файлов
  `SKILL.md`. Охватывает вложенные файлы в сгруппированных корнях навыков.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Окно устранения дребезга для событий наблюдателя навыков в миллисекундах.
</ParamField>

## Установка (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Предпочитает установщики Homebrew, когда доступен `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Предпочтительный менеджер пакетов Node для установки навыков. Этот параметр влияет только
  на установку навыков — среда выполнения CLI и Gateway OpenClaw требует Node, поскольку
  каноническое хранилище состояния использует `node:sqlite`. `openclaw setup --node-manager` и
  `openclaw onboard --node-manager` принимают `npm`, `pnpm` или `bun`;
  задайте `"yarn"` непосредственно в конфигурации для установки навыков через Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Разрешает доверенным клиентам Gateway `operator.admin` устанавливать закрытые
  ZIP-архивы, подготовленные через `skills.upload.*`. Для обычной установки из ClawHub
  этот параметр не нужен.
</ParamField>

## Политика установки оператора (`security.installPolicy`)

Используйте `security.installPolicy`, когда операторам нужна доверенная локальная команда для
разрешения или блокировки установки навыков и плагинов с учётом политики конкретного хоста.
Политика запускается после того, как OpenClaw подготовил исходные материалы, но до продолжения
установки или обновления. Она применяется к навыкам ClawHub, загруженным навыкам, навыкам
из Git или локальных источников, установщикам зависимостей навыков, а также источникам
установки и обновления плагинов.

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
  Максимальное общее время выполнения одного решения политики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальное время без вывода в stdout или stderr, после которого политика
  блокирует операцию по принципу запрета по умолчанию.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальный совокупный объём данных stdout и stderr в байтах, принимаемый от процесса политики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Литеральные переменные окружения, передаваемые процессу политики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Имена переменных окружения, копируемых из процесса OpenClaw в процесс политики.
  Передаются только явно указанные переменные.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необязательный список разрешённых каталогов, в которых может находиться исполняемый файл политики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Отключает проверки владельца пути команды и разрешений. Используйте только тогда, когда
  путь защищён другим механизмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Разрешает использовать символическую ссылку в качестве настроенного пути команды.
  Разрешённая цель по-прежнему должна проходить остальные проверки пути. Аргументы,
  указывающие на сценарии интерпретатора, должны быть непосредственными обычными файлами,
  а не символическими ссылками.
</ParamField>

Политика получает через stdin один объект JSON с полями `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необязательным структурированным полем `source`, структурированным полем
`origin` и полем `request`. Она должна записать в stdout один объект JSON:
`{ "protocolVersion": 1, "decision": "allow" }` или `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`.
Ненулевой код завершения, тайм-аут, некорректный JSON, отсутствующие поля или
неподдерживаемые версии протокола приводят к блокировке по принципу запрета по умолчанию.

OpenClaw не выполняет политику установки при обычном запуске Gateway.
Если политика включена, но недоступна, установка и обновление блокируются по принципу
запрета по умолчанию. `openclaw doctor` выполняет статическую проверку;
`openclaw doctor --deep` выполняет синтетическую пробную установку с помощью настроенной команды.

При массовых обновлениях политика применяется отдельно к каждой цели: заблокированное
обновление навыка или плагина завершается ошибкой для этой цели, не отключая политику
и не пропуская последующие цели в пакете.

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

## Список разрешённых встроенных навыков

<ParamField path="skills.allowBundled" type="string[]">
  Необязательный список разрешений только для **встроенных** навыков. Если он задан,
  допускаются только перечисленные встроенные навыки. Управляемые навыки, навыки уровня
  агента и рабочей области остаются без изменений.
</ParamField>

## Записи отдельных навыков (`skills.entries`)

По умолчанию ключи в `entries` соответствуют `name` навыка. Если навык
определяет `metadata.openclaw.skillKey`, используйте вместо него этот ключ. Имена с дефисами
заключайте в кавычки (JSON5 допускает ключи в кавычках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` отключает навык, даже если он встроен или установлен.
  Встроенный навык `coding-agent` необходимо включать явно — задайте для него
  `true` и убедитесь, что `claude`, `codex`,
  `opencode` или другой поддерживаемый CLI установлен и прошёл аутентификацию.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Вспомогательное поле для навыков, объявляющих `metadata.openclaw.primaryEnv`.
  Поддерживает строку открытого текста или SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Переменные окружения, внедряемые при запуске агента. Внедряются только в том случае,
  если переменная ещё не задана в процессе.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необязательный набор пользовательских полей конфигурации для отдельного навыка.
</ParamField>

## Списки разрешений агентов (`agents`)

Используйте конфигурацию агента, если требуется использовать одинаковые корни навыков
машины и рабочей области, но разные наборы видимых навыков для каждого агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // общий базовый набор
    },
    list: [
      { id: "writer" }, // наследует github, weather
      { id: "docs", skills: ["docs-search"] }, // полностью заменяет значения по умолчанию
      { id: "locked-down", skills: [] }, // без навыков
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Общий базовый список разрешений, наследуемый агентами, у которых отсутствует
  `agents.list[].skills`. Полностью опустите его, чтобы по умолчанию не ограничивать навыки.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явный окончательный набор навыков для этого агента. Явные списки **заменяют**
  унаследованные значения по умолчанию — они не объединяются. Задайте
  `[]`, чтобы не предоставлять этому агенту никаких навыков.
</ParamField>

<Warning>
  Списки разрешений навыков агента служат фильтром видимости и загрузки для обнаружения
  навыков OpenClaw, запросов, обнаружения команд с косой чертой, синхронизации песочницы
  и снимков навыков. Они не являются границей авторизации во время выполнения команд
  оболочки. Если агент может выполнять на хосте `exec`, эта оболочка всё равно
  может запускать внешние клиенты или читать файлы хоста, видимые пользователю выполнения,
  включая реестры клиентов MCP, такие как `~/.openclaw/skills/config/mcporter.json`. Для изоляции MCP между
  агентами сочетайте списки разрешений навыков с изоляцией песочницы или пользователя ОС,
  запретите выполнение команд на хосте либо задайте для него строгий список разрешений
  и предпочитайте отдельные учётные данные каждого агента на сервере MCP.
</Warning>

## Мастерская (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Когда `true`, OpenClaw может создавать ожидающие предложения на основе устойчивых исправлений
  и анализировать успешно завершённую существенную работу после перехода системы
  в состояние простоя. Это может добавить фоновый запуск модели после подходящих ходов. Инициированное пользователем
  создание навыков и `/learn` продолжают работать, когда параметр имеет значение `false`.
</ParamField>

Условия соответствия, сведения о конфиденциальности и стоимости, разрешения только на создание предложений
и рекомендации по устранению неполадок см. в разделе [Самообучение](/ru/tools/self-learning).

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` требует одобрения оператора, прежде чем агент сможет самостоятельно применить, отклонить
  или поместить предложение в карантин. `auto` разрешает эти действия без одобрения.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Разрешает Skill Workshop при применении записывать данные через символические ссылки навыков рабочей области,
  фактическая цель которых уже считается доверенной согласно `skills.load.allowSymlinkTargets`. Оставьте
  этот параметр отключённым, если применение сгенерированных предложений не должно изменять общий
  корневой каталог навыков.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальное количество ожидающих и помещённых в карантин предложений, сохраняемых для каждой рабочей области (допустимый
  диапазон: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальный размер содержимого предложения в байтах (допустимый диапазон: 1024-200000). Для описаний
  предложений отдельно установлен жёсткий предел в 160 байт, поскольку они отображаются
  в результатах обнаружения и вывода списков.
</ParamField>

Жизненный цикл предложений, команды CLI, параметры инструментов агента и методы Gateway,
которыми управляет эта конфигурация, см. в разделе [Skill Workshop](/ru/tools/skill-workshop).

## Корневые каталоги навыков с символическими ссылками

По умолчанию корневые каталоги навыков рабочей области, агента проекта, дополнительных каталогов и встроенных навыков
являются границами вложенности. Папка навыка с символической ссылкой в `<workspace>/skills`,
которая разрешается за пределами корневого каталога, пропускается с записью сообщения в журнал.

Чтобы разрешить намеренную структуру с символическими ссылками, укажите доверенную цель:

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
принимается после разрешения фактического пути. `extraDirs` сканирует соседний репозиторий
напрямую; `allowSymlinkTargets` сохраняет путь с символической ссылкой для существующих
структур.

По умолчанию Skill Workshop при применении не записывает данные через эти символические ссылки. Чтобы
разрешить Workshop при применении изменять навыки в уже доверенных целях символических ссылок, включите
это отдельно:

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
уже безусловно принимают символические ссылки на каталоги навыков (ограничение вложенности
`SKILL.md` для каждого навыка всё равно применяется) — `allowSymlinkTargets` требуется только
для корневых каталогов рабочей области, дополнительных каталогов и агента проекта (`<workspace>/.agents/skills`).

## Навыки в песочнице и переменные окружения

<Warning>
  `skills.entries.<skill>.env` и `apiKey` применяются только к запускам на **основной системе**.
  В песочнице они не действуют — навык, зависящий от
  `GEMINI_API_KEY`, завершится с ошибкой `apiKey not configured`, если переменная
  не будет отдельно передана в песочницу.
</Warning>

Передайте секреты в песочницу Docker следующим образом:

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
  через метаданные Docker. Если такое раскрытие недопустимо, используйте подключённый файл секрета, пользовательский образ
  или другой способ передачи.
</Note>

## Напоминание о порядке загрузки

```text
workspace/skills      (наивысший приоритет)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
встроенные навыки
skills.load.extraDirs (наименьший приоритет)
```

Изменения навыков и конфигурации вступают в силу в следующем новом сеансе, если
наблюдатель включён, либо при следующем ходе агента, когда наблюдатель обнаружит
изменение.

## Связанные разделы

<CardGroup cols={2}>
  <Card title="Справочник по навыкам" href="/ru/tools/skills" icon="puzzle-piece">
    Назначение навыков, порядок загрузки, ограничение доступа и формат SKILL.md.
  </Card>
  <Card title="Создание навыков" href="/ru/tools/creating-skills" icon="hammer">
    Создание пользовательских навыков рабочей области.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для навыков, подготовленных агентом.
  </Card>
  <Card title="Самообучение" href="/ru/tools/self-learning" icon="brain">
    Консервативные, явно включаемые предложения на основе завершённой работы.
  </Card>
  <Card title="Команды с косой чертой" href="/ru/tools/slash-commands" icon="terminal">
    Встроенный каталог команд с косой чертой и директивы чата.
  </Card>
</CardGroup>
