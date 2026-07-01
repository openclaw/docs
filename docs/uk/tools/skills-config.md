---
read_when:
    - Налаштування поведінки завантаження, встановлення або обмеження доступу для Skills
    - Налаштування видимості Skills для окремого агента
    - Налаштування лімітів Skill Workshop або політики схвалення
sidebarTitle: Skills config
summary: Повний довідник схеми конфігурації skills.*, списків дозволених агентів, налаштувань workshop та обробки змінних середовища sandbox.
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-07-01T08:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість конфігурації Skills розташована в `skills` у
`~/.openclaw/openclaw.json`. Видимість для окремих агентів розташована в
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
  разом із базовим інструментом `image_generate` замість `skills.entries`. Записи Skills
  призначені лише для власних або сторонніх робочих процесів Skills.
</Note>

## Завантаження (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Додаткові каталоги Skills для сканування з найнижчим пріоритетом (після
  вбудованих Skills і Skills Plugin). Шляхи розгортаються з підтримкою `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Довірені реальні цільові каталоги, у які можуть розв'язуватися симлінковані
  папки Skills, навіть якщо симлінк розташований поза налаштованим коренем.
  Використовуйте це для навмисних макетів сусідніх репозиторіїв, як-от
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Тримайте цей список
  вузьким — не вказуйте широкі корені на кшталт `~` або `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Відстежувати папки Skills і оновлювати знімок Skills, коли змінюються файли
  `SKILL.md`. Охоплює вкладені файли в згрупованих коренях Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Вікно debounce для подій спостерігача Skills у мілісекундах.
</ParamField>

## Встановлення (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Надавати перевагу інсталяторам Homebrew, коли доступний `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Перевага менеджера пакетів Node для встановлень Skills. Це впливає лише на
  встановлення Skills — середовище виконання Gateway усе одно має використовувати
  Node (Bun не рекомендовано для WhatsApp/Telegram). Використовуйте
  `openclaw setup --node-manager` для npm, pnpm або bun; задайте `"yarn"` вручну
  для встановлень Skills на базі Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Дозволити довіреним клієнтам Gateway `operator.admin` встановлювати приватні
  zip-архіви, підготовлені через `skills.upload.*`. Звичайні встановлення
  ClawHub не потребують цього параметра.
</ParamField>

## Політика встановлення оператора (`security.installPolicy`)

Використовуйте `security.installPolicy`, коли операторам потрібна довірена
локальна команда для схвалення або блокування встановлень Skills і Plugin
відповідно до політики конкретного хоста. Політика запускається після того, як
OpenClaw підготував вихідний матеріал, і до продовження встановлення або
оновлення. Вона застосовується до Skills ClawHub, завантажених Skills, Git/local
Skills, інсталяторів залежностей Skills, а також джерел встановлення/оновлення
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
  Увімкнення політики встановлення, якою володіє оператор. Якщо її ввімкнено без
  дійсної команди `exec`, встановлення завершуються закритою відмовою.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Необов'язковий фільтр цілей. Якщо його пропущено, політика застосовується до
  кожної підтримуваної цілі, щоб нові встановлення не завершувалися несподівано
  відкритим дозволом.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Абсолютний шлях до довіреного виконуваного файла політики. OpenClaw запускає
  його без оболонки й перевіряє шлях перед використанням.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Статичні аргументи, передані після `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Максимальний астрономічний час виконання для одного рішення політики.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Максимальний час без виводу stdout або stderr до закритої відмови політики.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Максимальна сукупна кількість байтів stdout і stderr, прийнята від процесу
  політики.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Літеральні змінні середовища, надані процесу політики.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Імена змінних середовища, скопійованих із процесу OpenClaw у процес політики.
  Передаються лише названі змінні.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Необов'язковий allowlist каталогів, які можуть містити виконуваний файл
  політики.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Обходить перевірки власника шляху команди та дозволів. Використовуйте лише
  тоді, коли шлях захищений іншим механізмом.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Дозволяє налаштованому шляху команди бути симлінком. Розв'язана ціль усе одно
  має задовольняти інші перевірки шляху. Аргументи скриптів інтерпретатора мають
  бути прямими звичайними файлами, а не симлінками.
</ParamField>

Політика отримує один JSON-об'єкт у stdin із `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
необов'язковими структурованими `source`, структурованими `origin` і `request`.
Вона має записати один JSON-об'єкт у stdout: `{ "protocolVersion": 1, "decision": "allow" }`
або `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Ненульовий
код виходу, тайм-аут, некоректний JSON, відсутні поля або непідтримувані версії
протоколу завершуються закритою відмовою.

OpenClaw не виконує політику встановлення під час звичайного запуску Gateway.
Встановлення й оновлення завершуються закритою відмовою, коли політику ввімкнено,
але вона недоступна. `openclaw doctor` виконує статичну перевірку, а
`openclaw doctor --deep` виконує синтетичну пробу встановлення з налаштованою
командою.

Масові оновлення застосовують політику до кожної цілі окремо: заблоковане
оновлення Skills або Plugin завершує відмовою цю ціль, не вимикаючи політику й
не пропускаючи наступні цілі в пакеті.

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

## Allowlist вбудованих Skills

<ParamField path="skills.allowBundled" type="string[]">
  Необов'язковий allowlist лише для **вбудованих** Skills. Коли задано, придатні
  лише вбудовані Skills зі списку. Керовані Skills, Skills рівня агента та
  Skills робочого простору не зачіпаються.
</ParamField>

## Записи окремих Skills (`skills.entries`)

Ключі в `entries` за замовчуванням відповідають `name` Skills. Якщо Skills
визначають `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
Беріть назви з дефісами в лапки (JSON5 дозволяє ключі в лапках).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` вимикає Skills, навіть коли вони вбудовані або встановлені. Вбудовані
  Skills `coding-agent` увімкнено за згодою — задайте `true` і переконайтеся, що
  один із `claude`, `codex`, `opencode` або інший підтримуваний CLI встановлено
  й автентифіковано.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Зручне поле для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує відкритий текстовий рядок або SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Змінні середовища, інжектовані для запуску агента. Інжектуються лише тоді,
  коли змінну ще не задано в процесі.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Необов'язковий контейнер для власних полів конфігурації окремих Skills.
</ParamField>

## Allowlist агентів (`agents`)

Використовуйте конфігурацію агента, коли потрібні ті самі корені Skills машини
або робочого простору, але інший видимий набір Skills для кожного агента.

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
  Спільний базовий allowlist, успадкований агентами, які пропускають
  `agents.list[].skills`. Пропустіть повністю, щоб за замовчуванням не
  обмежувати Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Явний остаточний набір Skills для цього агента. Явні списки **замінюють**
  успадковані значення за замовчуванням — вони не об'єднуються. Задайте `[]`,
  щоб не відкривати Skills для цього агента.
</ParamField>

<Warning>
  Allowlist Skills агента є фільтром видимості та завантаження для виявлення
  Skills OpenClaw, підказок, виявлення slash-команд, синхронізації sandbox і
  знімків Skills. Це не межа авторизації під час виконання shell. Якщо агент
  може запускати хостовий `exec`, ця оболонка все одно може запускати зовнішні
  клієнти або читати файли хоста, видимі користувачу виконання, включно з
  реєстрами клієнтів MCP, такими як `~/.openclaw/skills/config/mcporter.json`.
  Для ізоляції MCP за агентами поєднуйте allowlist Skills із sandbox/ізоляцією
  користувача ОС, забороняйте або жорстко обмежуйте allowlist хостового exec і
  віддавайте перевагу обліковим даним окремого агента на сервері MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Коли `true`, агенти можуть створювати очікувані пропозиції зі стійких сигналів
  розмови після успішних ходів. Створення Skills за запитом користувача завжди
  проходить через Skill Workshop незалежно від цього параметра.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` вимагає схвалення оператора перед ініційованими агентом діями apply,
  reject або quarantine. `auto` дозволяє ці дії без схвалення.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Дозволити Skill Workshop apply записувати через симлінки Skills робочої області,
  реальна ціль яких уже довірена через `skills.load.allowSymlinkTargets`.
  Тримайте це вимкненим, якщо застосування згенерованих пропозицій не має змінювати
  цей спільний корінь Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Максимальна кількість очікуваних і поміщених у quarantine пропозицій, що
  зберігаються для кожної робочої області.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Максимальний розмір тіла пропозиції в байтах. Описи пропозицій жорстко обмежені
  160 байтами, оскільки вони з’являються у виводі discovery та listing.
</ParamField>

## Корені Skills із симлінками

За замовчуванням корені Skills робочої області, агента проєкту, додаткового
каталогу та вбудовані корені Skills є межами containment. Папка Skills із
симлінком у `<workspace>/skills`, яка розв’язується за межі кореня, пропускається
з повідомленням у журналі.

Щоб дозволити навмисну структуру із симлінками, оголосіть довірену ціль:

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
безпосередньо; `allowSymlinkTargets` зберігає шлях із симлінком для наявних
структур.

Skill Workshop apply за замовчуванням не записує через ці симлінки. Щоб дозволити
Workshop apply змінювати Skills під уже довіреними цілями симлінків, увімкніть це
окремо:

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

Керовані каталоги `~/.openclaw/skills` і персональні каталоги `~/.agents/skills`
уже приймають симлінки каталогів Skills (containment для `SKILL.md` кожної
Skills усе одно застосовується).

## Skills у sandbox та змінні середовища

<Warning>
  `skills.entries.<skill>.env` і `apiKey` застосовуються лише до запусків на
  **host**. Усередині sandbox вони не мають ефекту — Skills, що залежить від
  `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо змінну
  не передано в sandbox окремо.
</Warning>

Передайте секрети в Docker sandbox за допомогою:

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
  `sandbox.docker.env` через метадані Docker. Використовуйте змонтований файл
  секрету, власний образ або інший шлях доставки, коли таке розкриття неприйнятне.
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

Зміни до Skills і конфігурації набувають чинності в наступній новій сесії, коли
watcher увімкнено, або на наступному ході агента, коли watcher виявить зміну.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Довідник Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке Skills, порядок завантаження, gating і формат SKILL.md.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створення власних Skills робочої області.
  </Card>
  <Card title="Skill Workshop" href="/uk/tools/skill-workshop" icon="flask">
    Черга пропозицій для Skills, підготовлених агентом.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="terminal">
    Нативний каталог slash-команд і директиви чату.
  </Card>
</CardGroup>
