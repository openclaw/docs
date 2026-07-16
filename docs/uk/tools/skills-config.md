---
read_when:
    - Налаштування завантаження, встановлення або умов доступності Skills
    - Налаштування видимості Skills для кожного агента окремо
    - Налаштування обмежень Майстерні Skills або політики схвалення
sidebarTitle: Skills config
summary: Повний довідник зі схеми конфігурації skills.*, списків дозволених агентів, налаштувань майстерні та обробки змінних середовища пісочниці.
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-07-16T18:39:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість конфігурації Skills міститься в `skills` у
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
  Для вбудованого генерування зображень використовуйте `agents.defaults.imageGenerationModel`
  разом з основним інструментом `image_generate` замість `skills.entries`. Записи Skills
  призначені лише для власних або сторонніх робочих процесів Skills.
</Note>

## Завантаження (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Додаткові каталоги Skills для сканування з найнижчим пріоритетом (після
  вбудованих і Plugin Skills). Шляхи розгортаються з підтримкою `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Довірені фактичні цільові каталоги, до яких можуть вести символічні
  посилання на каталоги Skills, навіть якщо символічне посилання розташоване
  поза налаштованим кореневим каталогом. Використовуйте це для навмисних
  структур із сусідніми репозиторіями, як-от
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Обмежуйте цей список —
  не вказуйте широкі кореневі каталоги на кшталт `~` або `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Відстежує каталоги Skills і оновлює знімок Skills, коли змінюються файли
  `SKILL.md`. Охоплює вкладені файли в згрупованих кореневих каталогах Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Вікно усунення брязкоту для подій спостерігача Skills у мілісекундах.
</ParamField>

## Встановлення (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Надає перевагу інсталяторам Homebrew, коли доступний `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Бажаний менеджер пакетів Node для встановлення Skills. Це впливає лише на
  встановлення Skills — для CLI OpenClaw і середовища виконання Gateway
  потрібен Node, оскільки канонічне сховище стану використовує
  `node:sqlite`. `openclaw setup --node-manager` і `openclaw onboard --node-manager` приймають
  `npm`, `pnpm` або `bun`; для встановлення Skills
  через Yarn задайте `"yarn"` безпосередньо в конфігурації.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Дозволяє довіреним клієнтам Gateway `operator.admin` установлювати
  приватні zip-архіви, підготовлені через `skills.upload.*`. Для звичайного
  встановлення з ClawHub цей параметр не потрібен.
</ParamField>

## Політика встановлення оператора (`security.installPolicy`)

Використовуйте `security.installPolicy`, коли операторам потрібна довірена локальна
команда, щоб дозволяти або блокувати встановлення Skills і plugins відповідно
до політики конкретного хоста. Політика виконується після того, як OpenClaw
підготував вихідні матеріали, і до продовження встановлення або оновлення.
Вона застосовується до Skills із ClawHub, завантажених Skills, Skills із Git
або локального джерела, інсталяторів залежностей Skills, а також джерел
встановлення й оновлення plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Пропустіть targets, щоб охопити всі підтримувані цілі.
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
  дійсної команди `exec`, встановлення блокуються за принципом
  безпечної відмови.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необов’язковий фільтр цілей. Якщо його не вказано, політика застосовується
  до кожної підтримуваної цілі, щоб нові встановлення несподівано не
  дозволялися в разі відмови.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютний шлях до довіреного виконуваного файла політики. OpenClaw запускає
  його без оболонки та перевіряє шлях перед використанням.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статичні аргументи, які передаються після `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальна тривалість виконання за реальним часом для одного рішення політики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальний час без виведення в stdout або stderr, після якого політика
  блокує дію за принципом безпечної відмови.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальна сумарна кількість байтів stdout і stderr, яку приймає процес політики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Літеральні змінні середовища, що надаються процесу політики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Імена змінних середовища, які копіюються з процесу OpenClaw до процесу
  політики. Передаються лише вказані змінні.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необов’язковий список дозволених каталогів, у яких може міститися
  виконуваний файл політики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Вимикає перевірки власника шляху команди та прав доступу. Використовуйте,
  лише якщо шлях захищений іншим механізмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Дозволяє налаштованому шляху команди бути символічним посиланням. Розв’язана
  ціль усе одно має відповідати іншим перевіркам шляху. Аргументи сценарію
  інтерпретатора мають бути безпосередніми звичайними файлами, а не
  символічними посиланнями.
</ParamField>

Політика отримує через stdin один об’єкт JSON із `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`,
`sourcePathKind`, необов’язковим структурованим `source`,
структурованим `origin` і `request`. Вона має записати
через stdout один об’єкт JSON: `{ "protocolVersion": 1, "decision": "allow" }` або
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненульовий код завершення, перевищення часу очікування,
неправильно сформований JSON, відсутні поля або непідтримувані версії
протоколу призводять до блокування за принципом безпечної відмови.

OpenClaw не виконує політику встановлення під час звичайного запуску Gateway.
Якщо політику ввімкнено, але вона недоступна, встановлення й оновлення
блокуються за принципом безпечної відмови. `openclaw doctor` виконує
статичну перевірку; `openclaw doctor --deep` виконує синтетичну перевірку
встановлення з налаштованою командою.

Масові оновлення застосовують політику окремо до кожної цілі: заблоковане
оновлення Skill або plugin завершується помилкою для цієї цілі, не вимикаючи
політику й не пропускаючи наступні цілі в пакеті.

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
        reason: "локальні шляхи plugins не схвалені на цьому хості",
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

Ключі в `entries` за замовчуванням відповідають `name`
Skill. Якщо Skill визначає `metadata.openclaw.skillKey`, використовуйте натомість цей
ключ. Беріть назви з дефісами в лапки (JSON5 дозволяє ключі в лапках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` вимикає Skill, навіть якщо він вбудований або
  встановлений. Вбудований Skill `coding-agent` потребує явного
  ввімкнення — установіть для нього `true` і переконайтеся, що
  `claude`, `codex`, `opencode` або інший
  підтримуваний CLI установлено й автентифіковано.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Допоміжне поле для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує звичайний текстовий рядок або SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Змінні середовища, що впроваджуються для запуску агента. Вони впроваджуються,
  лише якщо змінну ще не задано в процесі.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необов’язковий набір власних полів конфігурації для окремого Skill.
</ParamField>

## Списки дозволених Skills агентів (`agents`)

Використовуйте конфігурацію агента, коли потрібні ті самі кореневі каталоги
Skills машини або робочого простору, але різний набір видимих Skills для
кожного агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // спільна базова конфігурація
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // повністю замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Спільний базовий список дозволених, який успадковують агенти, що не
  вказують `agents.list[].skills`. Повністю пропустіть його, щоб за замовчуванням
  не обмежувати Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явний остаточний набір Skills для цього агента. Явні списки **замінюють**
  успадковані значення за замовчуванням — вони не об’єднуються. Установіть
  `[]`, щоб не надавати цьому агенту жодних Skills.
</ParamField>

<Warning>
  Списки дозволених Skills агентів — це фільтр видимості й завантаження для
  виявлення Skills OpenClaw, підказок, виявлення команд із похилою рискою,
  синхронізації пісочниці та знімків Skills. Вони не є межею авторизації під
  час виконання команд оболонки. Якщо агент може запускати на хості
  `exec`, ця оболонка все одно може запускати зовнішні клієнти або
  читати файли хоста, видимі користувачеві виконання, зокрема реєстри клієнтів
  MCP, як-от `~/.openclaw/skills/config/mcporter.json`. Для ізоляції MCP окремих агентів поєднуйте
  списки дозволених Skills з ізоляцією пісочниці або користувача ОС,
  забороняйте виконання команд на хості чи суворо обмежуйте його списком
  дозволеного, а також надавайте перевагу окремим обліковим даним для кожного
  агента на сервері MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Коли `true`, OpenClaw може створювати пропозиції зі статусом очікування на основі довготривалих виправлень
  і переглядати успішну, суттєву завершену роботу після переходу системи
  в режим простою. Це може додати фоновий запуск моделі після відповідних ходів. Ініційоване користувачем
  створення навичок і `/learn` продовжують працювати, коли параметр має значення `false`.
</ParamField>

Відомості про критерії відповідності, конфіденційність, вартість,
дозволи лише на створення пропозицій і усунення несправностей див. у розділі [Самонавчання](/tools/self-learning).

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` дозволяє агенту ініціювати застосування, відхилення або карантин без
  додаткового запиту на схвалення. `pending` вимагає схвалення оператора.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Дозволяє застосуванню Skill Workshop записувати через символічні посилання навичок робочого простору, фактична
  ціль яких уже є довіреною згідно з `skills.load.allowSymlinkTargets`. Не вмикайте
  цей параметр, якщо застосування згенерованих пропозицій не має змінювати цей спільний
  корінь навичок.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальна кількість пропозицій зі статусом очікування та в карантині, що зберігаються для кожного робочого простору (допустимий
  діапазон: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальний розмір вмісту пропозиції в байтах (допустимий діапазон: 1024-200000). Описи
  пропозицій окремо мають жорстке обмеження 160 байт, оскільки вони відображаються
  у результатах виявлення та списках.
</ParamField>

Відомості про життєвий цикл пропозицій, команди CLI,
параметри інструментів агента та методи Gateway, якими керує ця конфігурація, див. у розділі [Skill Workshop](/uk/tools/skill-workshop).

## Корені навичок із символічними посиланнями

За замовчуванням корені навичок робочого простору, агента проєкту, додаткових каталогів і вбудованих навичок є
межами вкладеності. Папка навички із символічним посиланням у `<workspace>/skills`,
що після визначення шляху розташована поза коренем, пропускається з повідомленням у журналі.

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
приймається після визначення фактичного шляху. `extraDirs` сканує сусідній репозиторій
безпосередньо; `allowSymlinkTargets` зберігає шлях із символічним посиланням для наявних
структур.

Застосування Skill Workshop за замовчуванням не записує через ці символічні посилання. Щоб
дозволити Workshop під час застосування змінювати навички за вже довіреними цілями символічних посилань, увімкніть
це окремо:

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

Керовані каталоги `~/.openclaw/skills` і особисті каталоги `~/.agents/skills`
уже безумовно приймають символічні посилання на каталоги навичок (обмеження вкладеності
`SKILL.md` для кожної навички все одно застосовується) — `allowSymlinkTargets` потрібен лише
для коренів робочого простору, додаткових каталогів і агента проєкту (`<workspace>/.agents/skills`).

## Ізольовані навички та змінні середовища

<Warning>
  `skills.entries.<skill>.env` і `apiKey` застосовуються лише до запусків на **хості**.
  Усередині ізольованого середовища вони не діють — навичка, що залежить від
  `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо змінну не буде
  окремо передано в ізольоване середовище.
</Warning>

Передайте секрети в ізольоване середовище Docker так:

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
  Користувачі з доступом до демона Docker можуть переглядати значення `sandbox.docker.env`
  через метадані Docker. Якщо таке розкриття неприйнятне, використовуйте змонтований файл секрету, власний образ або
  інший спосіб передавання.
</Note>

## Нагадування про порядок завантаження

```text
workspace/skills      (найвищий пріоритет)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
вбудовані навички
skills.load.extraDirs (найнижчий пріоритет)
```

Зміни навичок і конфігурації набувають чинності в наступному новому сеансі, якщо
спостерігач увімкнений, або під час наступного ходу агента, коли спостерігач виявить
зміну.

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Довідник навичок" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке навички, порядок завантаження, обмеження доступу та формат SKILL.md.
  </Card>
  <Card title="Створення навичок" href="/uk/tools/creating-skills" icon="hammer">
    Розроблення власних навичок робочого простору.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для навичок, підготовлених агентом.
  </Card>
  <Card title="Самонавчання" href="/tools/self-learning" icon="brain">
    Консервативні пропозиції на основі завершеної роботи, що вмикаються за бажанням.
  </Card>
  <Card title="Команди зі скісною рискою" href="/uk/tools/slash-commands" icon="terminal">
    Вбудований каталог команд зі скісною рискою та директиви чату.
  </Card>
</CardGroup>
