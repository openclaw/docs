---
read_when:
    - Налаштування завантаження, встановлення або обмеження доступу до Skills
    - Налаштування видимості Skills для окремих агентів
    - Налаштування обмежень Skill Workshop або політики затвердження
sidebarTitle: Skills config
summary: Повний довідник зі схеми конфігурації skills.*, списків дозволених агентів, налаштувань майстерні та обробки змінних середовища пісочниці.
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-07-12T13:54:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість налаштувань Skills міститься в розділі `skills` у
`~/.openclaw/openclaw.json`. Видимість для окремих агентів налаштовується в
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
  Для вбудованого генерування зображень використовуйте
  `agents.defaults.imageGenerationModel` разом з основним інструментом
  `image_generate` замість `skills.entries`. Записи Skills призначені лише
  для власних або сторонніх робочих процесів Skills.
</Note>

## Завантаження (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Додаткові каталоги Skills для сканування з найнижчим пріоритетом (після
  вбудованих Skills і Skills плагінів). Шляхи розгортаються з підтримкою `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Довірені реальні цільові каталоги, у які можуть вести символічні посилання
  папок Skills, навіть якщо символічне посилання розташоване поза налаштованим
  кореневим каталогом. Використовуйте це для навмисних схем із сусідніми
  репозиторіями, як-от
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Тримайте цей
  список вузьким — не вказуйте широкі кореневі каталоги на кшталт `~` або
  `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Відстежує папки Skills і оновлює знімок Skills у разі зміни файлів
  `SKILL.md`. Охоплює вкладені файли в згрупованих кореневих каталогах Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Інтервал усунення брязкоту для подій спостерігача Skills у мілісекундах.
</ParamField>

## Встановлення (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Надає перевагу інсталяторам Homebrew, коли доступний `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Бажаний менеджер пакетів Node для встановлення Skills. Це впливає лише на
  встановлення Skills — середовище виконання Gateway має й надалі
  використовувати Node (Bun не рекомендовано для WhatsApp/Telegram).
  `openclaw setup --node-manager` і `openclaw onboard --node-manager`
  приймають `npm`, `pnpm` або `bun`; для встановлення Skills за допомогою
  Yarn безпосередньо вкажіть `"yarn"` у конфігурації.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Дозволяє довіреним клієнтам Gateway із роллю `operator.admin`
  встановлювати приватні ZIP-архіви, підготовлені через `skills.upload.*`.
  Звичайні встановлення з ClawHub не потребують цього налаштування.
</ParamField>

## Політика встановлення оператора (`security.installPolicy`)

Використовуйте `security.installPolicy`, коли операторам потрібна довірена
локальна команда для схвалення або блокування встановлення Skills і плагінів
відповідно до політики конкретного хоста. Політика виконується після того, як
OpenClaw підготував вихідні матеріали, і до продовження встановлення чи
оновлення. Вона застосовується до Skills із ClawHub, завантажених Skills,
Skills із Git або локальних джерел, інсталяторів залежностей Skills, а також
джерел встановлення й оновлення плагінів.

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
  Вмикає політику встановлення, якою керує оператор. Якщо її ввімкнено без
  дійсної команди `exec`, встановлення блокуються.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необов’язковий фільтр цілей. Якщо його не вказано, політика застосовується
  до кожної підтримуваної цілі, щоб нові встановлення несподівано не
  дозволялися без перевірки.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютний шлях до довіреного виконуваного файла політики. OpenClaw запускає
  його без оболонки й перевіряє шлях перед використанням.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статичні аргументи, що передаються після `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальна тривалість виконання за реальним часом для одного рішення
  політики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальний час без виведення в stdout або stderr, після якого політика
  блокує операцію.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальна сумарна кількість байтів stdout і stderr, що приймається від
  процесу політики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Літеральні змінні середовища, що надаються процесу політики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Імена змінних середовища, що копіюються з процесу OpenClaw до процесу
  політики. Передаються лише явно зазначені змінні.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необов’язковий список дозволених каталогів, у яких може міститися
  виконуваний файл політики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Оминає перевірки власника та дозволів шляху до команди. Використовуйте лише
  тоді, коли шлях захищено іншим механізмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Дозволяє налаштованому шляху до команди бути символічним посиланням.
  Розв’язана ціль усе одно має задовольняти інші перевірки шляху. Аргументи
  сценаріїв інтерпретатора мають бути безпосередніми звичайними файлами, а не
  символічними посиланнями.
</ParamField>

Політика отримує зі stdin один об’єкт JSON із `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необов’язковим структурованим `source`, структурованим `origin` і `request`.
Вона має записати в stdout один об’єкт JSON:
`{ "protocolVersion": 1, "decision": "allow" }` або
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненульовий
код завершення, перевищення часу очікування, некоректний JSON, відсутні поля
або непідтримувані версії протоколу призводять до блокування операції.

OpenClaw не виконує політику встановлення під час звичайного запуску Gateway.
Встановлення та оновлення блокуються, якщо політику ввімкнено, але вона
недоступна. `openclaw doctor` виконує статичну перевірку;
`openclaw doctor --deep` виконує синтетичну перевірку встановлення за допомогою
налаштованої команди.

Для масових оновлень політика застосовується окремо до кожної цілі:
заблоковане оновлення Skill або плагіна завершується помилкою для цієї цілі,
не вимикаючи політику й не пропускаючи наступні цілі в пакеті.

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

## Список дозволених вбудованих Skills

<ParamField path="skills.allowBundled" type="string[]">
  Необов’язковий список дозволених лише для **вбудованих** Skills. Якщо його
  задано, придатними є лише вбудовані Skills зі списку. Це не впливає на
  керовані Skills, Skills рівня агента та Skills робочого простору.
</ParamField>

## Записи окремих Skills (`skills.entries`)

Ключі в `entries` типово відповідають `name` Skill. Якщо Skill визначає
`metadata.openclaw.skillKey`, натомість використовуйте цей ключ. Беріть назви
з дефісами в лапки (JSON5 дозволяє ключі в лапках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` вимикає Skill, навіть якщо він вбудований або встановлений.
  Вбудований Skill `coding-agent` потребує явного ввімкнення — установіть
  значення `true` і переконайтеся, що `claude`, `codex`, `opencode` або інший
  підтримуваний CLI встановлено й автентифіковано.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Допоміжне поле для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує рядок відкритого тексту або SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Змінні середовища, що впроваджуються для запуску агента. Вони впроваджуються
  лише тоді, коли змінну ще не задано в процесі.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необов’язковий набір полів власної конфігурації для окремого Skill.
</ParamField>

## Списки дозволених Skills для агентів (`agents`)

Використовуйте конфігурацію агента, коли потрібні ті самі кореневі каталоги
Skills машини чи робочого простору, але різний набір видимих Skills для
кожного агента.

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
  Спільний базовий список дозволених, який успадковують агенти без
  `agents.list[].skills`. Не вказуйте його взагалі, щоб типово не обмежувати
  Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явний остаточний набір Skills для цього агента. Явні списки **замінюють**
  успадковані типові значення — вони не об’єднуються. Укажіть `[]`, щоб не
  надавати цьому агенту жодних Skills.
</ParamField>

<Warning>
  Списки дозволених Skills агентів є фільтром видимості та завантаження для
  виявлення Skills у OpenClaw, підказок, виявлення команд із косою рискою,
  синхронізації пісочниці та знімків Skills. Вони не є межею авторизації під
  час виконання команд оболонки. Якщо агент може виконувати хостовий `exec`,
  ця оболонка все одно може запускати зовнішні клієнти або читати файли хоста,
  видимі користувачу виконання, зокрема реєстри клієнтів MCP, як-от
  `~/.openclaw/skills/config/mcporter.json`. Для ізоляції MCP окремих агентів
  поєднуйте списки дозволених Skills з ізоляцією пісочниці або користувачів
  ОС, забороняйте хостовий exec або суворо обмежуйте його списком дозволених
  команд і надавайте перевагу окремим обліковим даним кожного агента на
  сервері MCP.
</Warning>

## Майстерня (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Якщо `true`, агенти можуть створювати пропозиції зі статусом очікування на
  основі сталих сигналів із розмови після успішних ходів. Ініційоване
  користувачем створення Skills завжди відбувається через Skill Workshop
  незалежно від цього налаштування.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` вимагає схвалення оператора, перш ніж агент зможе ініціювати
  застосування, відхилення або переміщення до карантину. `auto` дозволяє ці
  дії без схвалення.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Дозволяє Skill Workshop під час застосування записувати через символічні
  посилання на Skills у робочому просторі, фактична ціль яких уже є довіреною
  згідно з `skills.load.allowSymlinkTargets`. Не вмикайте це, якщо застосування
  згенерованих пропозицій не має змінювати цей спільний кореневий каталог
  Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальна кількість пропозицій зі статусом очікування та пропозицій у
  карантині, що зберігаються для кожного робочого простору (дозволений
  діапазон: 1–200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальний розмір тіла пропозиції в байтах (дозволений діапазон:
  1024–200000). Описи пропозицій окремо жорстко обмежено 160 байтами, оскільки
  вони відображаються в результатах виявлення та списках.
</ParamField>

Див. [Skill Workshop](/uk/tools/skill-workshop), щоб дізнатися про життєвий цикл
пропозицій, команди CLI, параметри інструментів агента та методи Gateway, якими
керує ця конфігурація.

## Кореневі каталоги Skills із символічними посиланнями

За замовчуванням кореневі каталоги Skills робочого простору, агента проєкту,
додаткових каталогів і вбудованих Skills є межами вкладеності. Каталог Skills
із символічним посиланням у `<workspace>/skills`, що вказує за межі кореневого
каталогу, пропускається з повідомленням у журналі.

Щоб дозволити навмисну структуру із символічними посиланнями, оголосіть
довірену ціль:

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
приймається після визначення фактичного шляху. `extraDirs` безпосередньо сканує
сусідній репозиторій; `allowSymlinkTargets` зберігає шлях із символічним
посиланням для наявних структур.

За замовчуванням застосування через Skill Workshop не виконує запис через ці
символічні посилання. Щоб дозволити Workshop під час застосування змінювати
Skills у вже довірених цілях символічних посилань, увімкніть це окремо:

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

Керований каталог `~/.openclaw/skills` і особистий каталог `~/.agents/skills`
уже безумовно приймають символічні посилання на каталоги Skills (обмеження
вкладеності `SKILL.md` для кожного Skill усе одно застосовується) —
`allowSymlinkTargets` потрібен лише для кореневих каталогів робочого простору,
додаткових каталогів і агента проєкту (`<workspace>/.agents/skills`).

## Skills у пісочниці та змінні середовища

<Warning>
  `skills.entries.<skill>.env` і `apiKey` застосовуються лише до запусків на
  **хості**. Усередині пісочниці вони не діють — Skill, що залежить від
  `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо змінну
  не буде окремо передано до пісочниці.
</Warning>

Передавайте секрети до пісочниці Docker так:

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
  Користувачі з доступом до демона Docker можуть переглядати значення
  `sandbox.docker.env` через метадані Docker. Якщо таке розкриття неприйнятне,
  використовуйте змонтований файл секрету, власний образ або інший спосіб
  передавання.
</Note>

## Нагадування про порядок завантаження

```text
workspace/skills      (найвищий пріоритет)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
вбудовані Skills
skills.load.extraDirs (найнижчий пріоритет)
```

Зміни у Skills і конфігурації набувають чинності в наступному новому сеансі,
якщо спостерігач увімкнений, або під час наступного ходу агента, коли
спостерігач виявить зміну.

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Довідник Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке Skills, порядок завантаження, умови доступності та формат SKILL.md.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створення власних Skills робочого простору.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для Skills, підготовлених агентом.
  </Card>
  <Card title="Команди з косою рискою" href="/uk/tools/slash-commands" icon="terminal">
    Каталог нативних команд із косою рискою та директиви чату.
  </Card>
</CardGroup>
