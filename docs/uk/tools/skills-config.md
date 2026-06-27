---
read_when:
    - Налаштування поведінки завантаження, встановлення або обмеження Skills
    - Налаштування видимості Skills для кожного агента
    - Налаштування лімітів Skill Workshop або політики схвалення
sidebarTitle: Skills config
summary: Повний довідник для схеми конфігурації skills.*, списків дозволених агентів, налаштувань workshop і обробки змінних середовища sandbox.
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-06-27T18:28:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість конфігурації навичок розташована в `skills` у
`~/.openclaw/openclaw.json`. Видимість для конкретного агента розташована в
`agents.defaults.skills` і `agents.list[].skills`.

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
  Для вбудованої генерації зображень використовуйте `agents.defaults.imageGenerationModel`
  разом із основним інструментом `image_generate` замість `skills.entries`. Записи
  навичок призначені лише для користувацьких або сторонніх робочих процесів навичок.
</Note>

## Завантаження (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Додаткові каталоги навичок для сканування з найнижчим пріоритетом (після
  bundled і Plugin навичок). Шляхи розгортаються з підтримкою `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Довірені реальні цільові каталоги, у які можуть розв’язуватися символьні
  посилання на папки навичок, навіть коли саме символьне посилання розташоване
  поза налаштованим коренем. Використовуйте це для навмисних макетів суміжних
  репозиторіїв, наприклад
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Тримайте цей список
  вузьким — не вказуйте широкі корені на кшталт `~` або `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Відстежувати папки навичок і оновлювати знімок навичок, коли файли `SKILL.md`
  змінюються. Охоплює вкладені файли під згрупованими коренями навичок.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Вікно усунення брязкоту для подій спостерігача навичок у мілісекундах.
</ParamField>

## Встановлення (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Надавати перевагу інсталяторам Homebrew, коли `brew` доступний.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Бажаний менеджер пакетів Node для встановлення навичок. Це впливає лише на
  встановлення навичок — середовище виконання Gateway все одно має
  використовувати Node (Bun не рекомендовано для WhatsApp/Telegram). Використовуйте
  `openclaw setup --node-manager` для npm, pnpm або bun; задайте `"yarn"`
  вручну для встановлення навичок на основі Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Дозволити довіреним клієнтам Gateway `operator.admin` встановлювати приватні
  zip-архіви, підготовлені через `skills.upload.*`. Звичайні встановлення
  ClawHub не потребують цього налаштування.
</ParamField>

## Політика встановлення оператора (`security.installPolicy`)

Використовуйте `security.installPolicy`, коли операторам потрібна довірена
локальна команда для схвалення або блокування встановлень навичок і Plugin
відповідно до політики конкретного хоста. Політика запускається після того, як
OpenClaw підготував вихідний матеріал, і до продовження встановлення або
оновлення. Вона застосовується до навичок ClawHub, завантажених навичок,
Git/локальних навичок, інсталяторів залежностей навичок і джерел
встановлення/оновлення Plugin.

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
  Вмикає політику встановлення, якою володіє оператор. Коли ввімкнено без
  дійсної команди `exec`, встановлення завершуються закритою відмовою.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необов’язковий фільтр цілей. Якщо його пропущено, політика застосовується до
  кожної підтримуваної цілі, щоб нові встановлення не переходили несподівано у
  відкритий режим відмови.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютний шлях до довіреного виконуваного файлу політики. OpenClaw запускає
  його без оболонки та перевіряє шлях перед використанням.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статичні аргументи, передані після `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальний фактичний час виконання для одного рішення політики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальний час без виводу stdout або stderr, після якого політика
  завершується закритою відмовою.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальна сумарна кількість байтів stdout і stderr, прийнята від процесу
  політики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Літеральні змінні середовища, надані процесу політики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Імена змінних середовища, скопійовані з процесу OpenClaw у процес політики.
  Передаються лише названі змінні.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необов’язковий allowlist каталогів, які можуть містити виконуваний файл політики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Обходить перевірки власника та дозволів шляху команди. Використовуйте лише
  тоді, коли шлях захищений іншим механізмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Дозволяє налаштованому шляху команди бути символьним посиланням. Розв’язана
  ціль усе одно має проходити інші перевірки шляху. Аргументи скриптів
  інтерпретатора мають бути прямими звичайними файлами, а не символьними
  посиланнями.
</ParamField>

Політика отримує один JSON-об’єкт на stdin із `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необов’язковим структурованим `source`, структурованими `origin` і `request`.
Вона має записати один JSON-об’єкт у stdout: `{ "protocolVersion": 1, "decision": "allow" }` або
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненульовий
код виходу, тайм-аут, неправильно сформований JSON, відсутні поля або
непідтримувані версії протоколу завершуються закритою відмовою.

OpenClaw не виконує політику встановлення під час звичайного запуску Gateway.
Встановлення та оновлення завершуються закритою відмовою, коли політику
ввімкнено, але вона недоступна. `openclaw doctor` виконує статичну перевірку, а
`openclaw doctor --deep` виконує синтетичний пробний запуск встановлення для
налаштованої команди.

Масові оновлення застосовують політику до кожної цілі: заблоковане оновлення
навички або Plugin завершує цю ціль невдачею без вимкнення політики або
пропуску наступних цілей у пакеті.

Приклад stdin:

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

Мінімальна команда політики:

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

## Allowlist bundled навичок

<ParamField path="skills.allowBundled" type="string[]">
  Необов’язковий allowlist лише для **bundled** навичок. Коли задано, придатними
  є лише bundled навички зі списку. Керовані, агентні та робочі навички не
  змінюються.
</ParamField>

## Записи окремих навичок (`skills.entries`)

Ключі в `entries` за замовчуванням відповідають `name` навички. Якщо навичка
визначає `metadata.openclaw.skillKey`, використовуйте натомість цей ключ. Беріть
імена з дефісами в лапки (JSON5 дозволяє ключі в лапках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` вимикає навичку, навіть коли вона bundled або встановлена. Bundled
  навичка `coding-agent` є opt-in — задайте їй `true` і переконайтеся, що один
  із `claude`, `codex`, `opencode` або інший підтримуваний CLI встановлено й
  автентифіковано.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Зручне поле для навичок, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує plaintext рядок або SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Змінні середовища, вставлені для запуску агента. Вставляються лише тоді, коли
  змінну ще не задано в процесі.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необов’язковий контейнер для користувацьких полів конфігурації окремої навички.
</ParamField>

## Allowlist агентів (`agents`)

Використовуйте конфігурацію агента, коли потрібні ті самі корені навичок
машини/робочого простору, але інший видимий набір навичок для кожного агента.

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
  Спільний базовий allowlist, який успадковують агенти, що пропускають
  `agents.list[].skills`. Повністю пропустіть, щоб навички за замовчуванням не
  були обмежені.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явний остаточний набір навичок для цього агента. Явні списки **замінюють**
  успадковані стандартні значення — вони не об’єднуються. Задайте `[]`, щоб не
  надавати жодних навичок цьому агенту.
</ParamField>

## Майстерня (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Коли `true`, агенти можуть створювати очікувані пропозиції з довговічних
  сигналів розмови після успішних ходів. Створення навичок за запитом
  користувача завжди проходить через Майстерню навичок незалежно від цього
  налаштування.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` вимагає схвалення оператора перед ініційованим агентом застосуванням,
  відхиленням або карантином. `auto` дозволяє ці дії без схвалення.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Дозволити застосуванню Майстерні навичок записувати через символьні посилання
  навичок робочого простору, реальна ціль яких уже довірена через
  `skills.load.allowSymlinkTargets`. Тримайте це вимкненим, якщо застосування
  згенерованої пропозиції не має змінювати цей спільний корінь навичок.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальна кількість пропозицій в очікуванні та в карантині, що зберігаються для кожного робочого простору.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальний розмір тіла пропозиції в байтах. Описи пропозицій жорстко обмежені
  160 байтами, оскільки вони з’являються в результатах виявлення та списках.
</ParamField>

## Кореневі каталоги Skills із символічними посиланнями

За замовчуванням кореневі каталоги Skills для робочого простору, агента проєкту,
додаткового каталогу та вбудованих Skills є межами ізоляції. Папка Skill із
символічним посиланням у `<workspace>/skills`, яка розв’язується поза коренем,
пропускається з повідомленням у журналі.

Щоб дозволити навмисну структуру із символічними посиланнями, оголосіть довірену ціль:

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

З цією конфігурацією `<workspace>/skills/manager -> ~/Projects/manager/skills`
приймається після розв’язання realpath. `extraDirs` сканує сусідній репозиторій
напряму; `allowSymlinkTargets` зберігає шлях із символічним посиланням для
наявних структур.

Застосування Skill Workshop за замовчуванням не записує через ці символічні
посилання. Щоб дозволити Workshop apply змінювати Skills під уже довіреними
цілями символічних посилань, увімкніть це окремо:

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

Керовані каталоги `~/.openclaw/skills` та особисті каталоги `~/.agents/skills`
уже приймають символічні посилання на каталоги Skills (ізоляція `SKILL.md` для
кожного Skill усе одно застосовується).

## Skills у пісочниці та змінні середовища

<Warning>
  `skills.entries.<skill>.env` і `apiKey` застосовуються лише до запусків на **host**.
  Усередині пісочниці вони не мають ефекту — Skill, який залежить від
  `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо змінну
  не передано в пісочницю окремо.
</Warning>

Передайте секрети в пісочницю Docker за допомогою:

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
  Користувачі з доступом до daemon Docker можуть переглядати значення
  `sandbox.docker.env` через метадані Docker. Використовуйте змонтований файл
  секрету, власний образ або інший шлях доставки, коли такий рівень розкриття
  неприйнятний.
</Note>

## Нагадування про порядок завантаження

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Зміни в Skills і конфігурації набувають чинності в наступному новому сеансі,
коли watcher увімкнено, або під час наступного ходу агента, коли watcher
виявить зміну.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Skills reference" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке Skills, порядок завантаження, gating і формат SKILL.md.
  </Card>
  <Card title="Creating skills" href="/uk/tools/creating-skills" icon="hammer">
    Створення власних Skills робочого простору.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для Skills, підготовлених агентом.
  </Card>
  <Card title="Slash commands" href="/uk/tools/slash-commands" icon="terminal">
    Нативний каталог slash-команд і директиви чату.
  </Card>
</CardGroup>
