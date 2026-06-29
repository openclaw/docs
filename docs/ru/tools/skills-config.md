---
read_when:
    - Настройка загрузки, установки или поведения gating для Skills
    - Настройка видимости навыков для каждого агента
    - Настройка лимитов Skill Workshop или политики одобрения
sidebarTitle: Skills config
summary: Полный справочник по схеме конфигурации skills.*, спискам разрешенных агентов, настройкам мастерской и обработке переменных окружения песочницы.
title: Конфигурация Skills
x-i18n:
    generated_at: "2026-06-28T23:55:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Большая часть конфигурации Skills находится в разделе `skills` в
`~/.openclaw/openclaw.json`. Видимость для конкретного агента находится в
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
  (после встроенных и Plugin Skills). Пути раскрываются с поддержкой `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Доверенные реальные целевые каталоги, в которые могут указывать символьные
  ссылки папок Skills, даже если символьная ссылка находится вне настроенного
  корня. Используйте это для намеренных схем с соседними репозиториями, например
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Держите этот список
  узким — не указывайте широкие корни вроде `~` или `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Отслеживать папки Skills и обновлять снимок Skills при изменении файлов
  `SKILL.md`. Покрывает вложенные файлы под сгруппированными корнями Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Окно debounce для событий наблюдателя Skills в миллисекундах.
</ParamField>

## Установка (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Предпочитать установщики Homebrew, когда доступен `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Предпочитаемый менеджер пакетов Node для установок Skills. Это влияет только
  на установки Skills — среда выполнения Gateway всё равно должна использовать
  Node (Bun не рекомендуется для WhatsApp/Telegram). Используйте
  `openclaw setup --node-manager` для npm, pnpm или bun; задайте `"yarn"`
  вручную для установок Skills на базе Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Разрешить доверенным клиентам Gateway `operator.admin` устанавливать приватные
  zip-архивы, подготовленные через `skills.upload.*`. Обычным установкам ClawHub
  этот параметр не нужен.
</ParamField>

## Политика установки оператора (`security.installPolicy`)

Используйте `security.installPolicy`, когда операторам нужна доверенная локальная
команда для разрешения или блокировки установок Skills и plugins с политикой,
специфичной для хоста. Политика выполняется после того, как OpenClaw подготовил
исходные материалы, и до продолжения установки или обновления. Она применяется
к ClawHub Skills, загруженным Skills, Git/локальным Skills, установщикам
зависимостей Skills и источникам установки/обновления plugins.

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
  допустимой команды `exec`, установки завершаются закрытым отказом.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необязательный фильтр целей. Если он опущен, политика применяется ко всем
  поддерживаемым целям, чтобы новые установки неожиданно не становились
  открытыми при сбое.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютный путь к доверенному исполняемому файлу политики. OpenClaw запускает
  его без shell и проверяет путь перед использованием.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статические аргументы, передаваемые после `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальное реальное время выполнения для одного решения политики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальное время без вывода stdout или stderr, после которого политика
  завершается закрытым отказом.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальное суммарное число байтов stdout и stderr, принимаемых от процесса политики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Буквальные переменные окружения, предоставляемые процессу политики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Имена переменных окружения, копируемых из процесса OpenClaw в процесс политики.
  Передаются только именованные переменные.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необязательный allowlist каталогов, которые могут содержать исполняемый файл политики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Обходит проверки владельца и разрешений пути команды. Используйте только когда
  путь защищён другим механизмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Разрешает настроенному пути команды быть символьной ссылкой. Разрешённая цель
  всё равно должна проходить остальные проверки пути. Аргументы скрипта
  интерпретатора должны быть прямыми обычными файлами, а не символьными ссылками.
</ParamField>

Политика получает один JSON-объект на stdin с `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необязательным структурированным `source`, структурированными `origin` и
`request`. Она должна записать один JSON-объект в stdout:
`{ "protocolVersion": 1, "decision": "allow" }` или
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненулевой
код выхода, timeout, некорректный JSON, отсутствующие поля или неподдерживаемые
версии протокола завершаются закрытым отказом.

OpenClaw не выполняет политику установки во время обычного запуска Gateway.
Установки и обновления завершаются закрытым отказом, когда политика включена,
но недоступна. `openclaw doctor` выполняет статическую проверку, а
`openclaw doctor --deep` запускает синтетическую проверку установки для
настроенной команды.

Массовые обновления применяют политику к каждой цели: заблокированное
обновление Skills или plugin завершает эту цель с ошибкой, не отключая политику
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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Allowlist встроенных Skills

<ParamField path="skills.allowBundled" type="string[]">
  Необязательный allowlist только для **встроенных** Skills. Если задан, доступны
  только встроенные Skills из списка. Управляемые Skills, Skills уровня агента и
  рабочей области не затрагиваются.
</ParamField>

## Записи отдельных Skills (`skills.entries`)

Ключи в `entries` по умолчанию соответствуют `name` Skills. Если Skills задаёт
`metadata.openclaw.skillKey`, используйте этот ключ вместо него. Имена с дефисами
берутся в кавычки (JSON5 допускает ключи в кавычках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` отключает Skills, даже если он встроен или установлен. Встроенный
  Skills `coding-agent` является opt-in — задайте для него `true` и убедитесь,
  что один из `claude`, `codex`, `opencode` или другой поддерживаемый CLI
  установлен и аутентифицирован.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Удобное поле для Skills, которые объявляют `metadata.openclaw.primaryEnv`.
  Поддерживает строку в открытом виде или SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Переменные окружения, внедряемые для запуска агента. Внедряются только если
  переменная ещё не задана в процессе.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необязательный набор пользовательских полей конфигурации для отдельных Skills.
</ParamField>

## Agent allowlists (`agents`)

Используйте конфигурацию агента, когда нужны одни и те же корни Skills для
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
  Общий базовый allowlist, наследуемый агентами, у которых отсутствует
  `agents.list[].skills`. Полностью опустите, чтобы Skills по умолчанию
  оставались неограниченными.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явный итоговый набор Skills для этого агента. Явные списки **заменяют**
  наследуемые значения по умолчанию — они не объединяются. Задайте `[]`, чтобы
  не показывать Skills этому агенту.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Когда `true`, агенты могут создавать ожидающие предложения из долговечных
  сигналов беседы после успешных ходов. Создание Skills по запросу пользователя
  всегда проходит через Skill Workshop независимо от этого параметра.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` требует одобрения оператора перед инициированными агентом apply,
  reject или quarantine. `auto` разрешает эти действия без одобрения.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Разрешить Skill Workshop apply выполнять запись через символьные ссылки Skills
  рабочей области, реальная цель которых уже доверена через
  `skills.load.allowSymlinkTargets`. Оставляйте это отключённым, если применение
  сгенерированного предложения не должно изменять этот общий корень Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальное число ожидающих и помещенных в карантин предложений, сохраняемых для каждой рабочей области.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальный размер тела предложения в байтах. Описания предложений жестко ограничены
  160 байтами, потому что они отображаются в выводе обнаружения и списка.
</ParamField>

## Корни навыков с символьными ссылками

По умолчанию корни навыков рабочей области, проектного агента, дополнительных каталогов и встроенных навыков являются
границами изоляции. Папка навыка с символьной ссылкой внутри `<workspace>/skills`,
которая разрешается за пределы корня, пропускается с сообщением в журнале.

Чтобы разрешить намеренную схему с символьными ссылками, объявите доверенную цель:

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
принимается после разрешения realpath. `extraDirs` сканирует соседний репозиторий напрямую;
`allowSymlinkTargets` сохраняет путь с символьной ссылкой для существующих схем.

Применение Skill Workshop по умолчанию не записывает через эти символьные ссылки. Чтобы разрешить
Workshop apply изменять навыки в уже доверенных целях символьных ссылок, включите это
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
уже принимают символьные ссылки на каталоги навыков (изоляция per-skill `SKILL.md` по-прежнему
применяется).

## Навыки в песочнице и переменные окружения

<Warning>
  `skills.entries.<skill>.env` и `apiKey` применяются только к запускам на **хосте**. Внутри
  песочницы они не действуют — навык, зависящий от `GEMINI_API_KEY`, завершится
  ошибкой `apiKey not configured`, если переменная не будет передана в песочницу
  отдельно.
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

Изменения навыков и конфигурации вступают в силу в следующем новом сеансе, если
наблюдатель включен, или на следующем ходе агента, когда наблюдатель обнаружит изменение.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ru/tools/skills" icon="puzzle-piece">
    Что такое навыки, порядок загрузки, ограничения доступа и формат SKILL.md.
  </Card>
  <Card title="Creating skills" href="/ru/tools/creating-skills" icon="hammer">
    Создание пользовательских навыков рабочей области.
  </Card>
  <Card title="Skill Workshop" href="/ru/tools/skill-workshop" icon="flask">
    Очередь предложений для навыков, подготовленных агентом.
  </Card>
  <Card title="Slash commands" href="/ru/tools/slash-commands" icon="terminal">
    Нативный каталог слеш-команд и директивы чата.
  </Card>
</CardGroup>
