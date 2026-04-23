---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Як працює sandboxing в OpenClaw: режими, області, доступ до робочого простору та образи'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-23T20:54:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d580b6d6a16053f350b3ab13fca9c1a563736b49c7ed15d4ba0af2a7ad479237
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw може запускати **інструменти всередині sandbox-backend-ів**, щоб зменшити радіус ураження.
Це **необов’язково** і керується конфігурацією (`agents.defaults.sandbox` або
`agents.list[].sandbox`). Якщо sandboxing вимкнено, інструменти працюють на хості.
Gateway залишається на хості; виконання інструментів відбувається в ізольованому sandbox,
коли його ввімкнено.

Це не ідеальна межа безпеки, але вона відчутно обмежує доступ до файлової системи
і процесів, коли модель робить щось дурне.

## Що потрапляє в sandbox

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий sandboxed browser (`agents.defaults.sandbox.browser`).
  - Типово sandbox browser запускається автоматично (щоб забезпечити доступність CDP), коли цього потребує browser tool.
    Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Типово контейнери sandbox browser використовують виділену мережу Docker (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`.
    Налаштовується через `agents.defaults.sandbox.browser.network`.
  - Необов’язковий `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний CDP на краю контейнера через allowlist CIDR (наприклад `172.21.0.1/32`).
  - Доступ спостерігача через noVNC типово захищений паролем; OpenClaw генерує короткоживучий URL з токеном, який віддає локальну bootstrap-сторінку й відкриває noVNC з паролем у фрагменті URL (а не в логах query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` дозволяє sandboxed-сесіям явно націлюватися на browser хоста.
  - Необов’язкові allowlist-и обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Не sandbox-ується:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено працювати поза sandbox (наприклад `tools.elevated`).
  - **Elevated exec обходить sandboxing і використовує налаштований шлях виходу (`gateway` типово або `node`, коли ціллю exec є `node`).**
  - Якщо sandboxing вимкнено, `tools.elevated` не змінює виконання (воно вже на хості). Див. [Elevated Mode](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` визначає, **коли** використовується sandboxing:

- `"off"`: без sandboxing.
- `"non-main"`: sandbox лише для **не-main** сесій (типово, якщо ви хочете звичайні чати на хості).
- `"all"`: кожна сесія працює в sandbox.
  Примітка: `"non-main"` базується на `session.mainKey` (типово `"main"`), а не на id агента.
  Сесії груп/каналів використовують власні ключі, тому вважаються не-main і будуть sandboxed.

## Область

`agents.defaults.sandbox.scope` визначає, **скільки контейнерів** буде створено:

- `"agent"` (типово): один контейнер на агента.
- `"session"`: один контейнер на сесію.
- `"shared"`: один спільний контейнер для всіх sandboxed-сесій.

## Backend

`agents.defaults.sandbox.backend` визначає, **який runtime** надає sandbox:

- `"docker"` (типово, коли sandboxing увімкнено): локальний sandbox runtime на базі Docker.
- `"ssh"`: універсальний віддалений sandbox runtime на базі SSH.
- `"openshell"`: sandbox runtime на базі OpenShell.

SSH-специфічна конфігурація розміщується в `agents.defaults.sandbox.ssh`.
Конфігурація, специфічна для OpenShell, розміщується в `plugins.entries.openshell.config`.

### Вибір backend-а

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Де виконується**  | Локальний контейнер              | Будь-який хост, доступний через SSH | Sandbox під керуванням OpenShell               |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH-ключ + цільовий хост       | Увімкнений Plugin OpenShell                         |
| **Модель workspace** | Bind-mount або копія            | Remote-canonical (одноразове seed) | `mirror` або `remote`                           |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell                              |
| **Browser sandbox** | Підтримується                    | Не підтримується               | Ще не підтримується                                 |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Найкраще для**    | Локальна розробка, повна ізоляція | Винос на віддалену машину     | Керовані віддалені sandbox-и з необов’язковою двосторонньою синхронізацією |

### Backend Docker

Sandboxing типово вимкнено. Якщо ви вмикаєте sandboxing і не вибираєте
backend, OpenClaw використовує backend Docker. Він виконує інструменти й sandbox browser
локально через сокет Docker daemon (`/var/run/docker.sock`). Ізоляція контейнера sandbox
визначається namespace-ами Docker.

**Обмеження Docker-out-of-Docker (DooD)**:
Якщо ви розгортаєте сам Gateway OpenClaw як Docker-контейнер, він оркеструє сусідні sandbox-контейнери через сокет Docker хоста (DooD). Це вводить конкретне обмеження на мапінг шляхів:

- **Конфігурація потребує шляхів хоста**: конфігурація `workspace` у `openclaw.json` МАЄ містити **абсолютний шлях хоста** (наприклад `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить Docker daemon створити sandbox, daemon оцінює шляхи відносно namespace ОС хоста, а не namespace Gateway.
- **FS Bridge Parity (ідентичне відображення томів)**: нативний процес Gateway OpenClaw також записує heartbeat і bridge-файли в каталог `workspace`. Оскільки Gateway оцінює той самий рядок (шлях хоста) у власному контейнеризованому середовищі, розгортання Gateway МАЄ включати ідентичне відображення томів, яке нативно пов’язує namespace хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).

Якщо ви відображаєте шляхи лише внутрішньо без повної відповідності абсолютним шляхам хоста, OpenClaw нативно викине помилку доступу `EACCES` під час спроби записати свій heartbeat усередині контейнерного середовища, тому що повний рядок шляху не існує нативно.

### Backend SSH

Використовуйте `backend: "ssh"`, коли хочете, щоб OpenClaw запускав `exec`, файлові інструменти й читання media у sandbox
на довільній машині, доступній через SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Як це працює:

- OpenClaw створює віддалений корінь для кожної області в `sandbox.ssh.workspaceRoot`.
- Під час першого використання після створення або перевідтворення OpenClaw один раз виконує seed цього віддаленого workspace з локального workspace.
- Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання media для prompt і staging вхідних media працюють безпосередньо з віддаленим workspace через SSH.
- OpenClaw не синхронізує автоматично віддалені зміни назад у локальний workspace.

Матеріали автентифікації:

- `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли й передають їх через конфігурацію OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: використовують вбудовані рядки або SecretRef. OpenClaw розв’язує їх через звичайний runtime snapshot секретів, записує у тимчасові файли з правами `0600` і видаляє їх, коли SSH-сесія завершується.
- Якщо для одного й того самого елемента задано і `*File`, і `*Data`, для цієї SSH-сесії перевагу має `*Data`.

Це модель **remote-canonical**. Віддалений SSH-workspace стає реальним станом sandbox після початкового seed.

Важливі наслідки:

- Локальні редагування на хості, зроблені поза OpenClaw після кроку seed, не видно віддалено, доки ви не перевідтворите sandbox.
- `openclaw sandbox recreate` видаляє віддалений корінь для відповідної області й виконує повторний seed з локального workspace під час наступного використання.
- Browser sandboxing не підтримується для backend SSH.
- Налаштування `sandbox.docker.*` не застосовуються до backend SSH.

### Backend OpenShell

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw запускав інструменти в sandbox
у віддаленому середовищі під керуванням OpenShell. Повний посібник із налаштування, довідник
конфігурації та порівняння режимів workspace дивіться на окремій
[сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий базовий транспорт SSH і віддалений bridge файлової системи, що й
загальний backend SSH, і додає життєвий цикл, специфічний для OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`), а також необов’язковий режим workspace `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Режими OpenShell:

- `mirror` (типово): локальний workspace залишається canonical. OpenClaw синхронізує локальні файли в OpenShell перед exec і синхронізує віддалений workspace назад після exec.
- `remote`: workspace OpenShell стає canonical після створення sandbox. OpenClaw один раз виконує seed віддаленого workspace з локального workspace, після чого файлові інструменти й exec працюють безпосередньо з віддаленим sandbox без синхронізації змін назад.

Деталі віддаленого транспорту:

- OpenClaw запитує в OpenShell конфігурацію SSH для конкретного sandbox через `openshell sandbox ssh-config <name>`.
- Core записує цю конфігурацію SSH у тимчасовий файл, відкриває SSH-сесію і повторно використовує той самий віддалений bridge файлової системи, що й для `backend: "ssh"`.
- Лише в режимі `mirror` відрізняється життєвий цикл: синхронізація локального стану на віддалений перед exec, а потім синхронізація назад після exec.

Поточні обмеження OpenShell:

- sandbox browser ще не підтримується
- `sandbox.docker.binds` не підтримується в backend OpenShell
- runtime-параметри, специфічні для Docker, у `sandbox.docker.*` і далі застосовуються лише до backend Docker

#### Режими workspace

OpenShell має дві моделі workspace. Саме ця частина найважливіша на практиці.

##### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальний workspace залишався canonical**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний workspace в sandbox OpenShell.
- Після `exec` OpenClaw синхронізує віддалений workspace назад у локальний workspace.
- Файлові інструменти все одно працюють через sandbox bridge, але локальний workspace залишається джерелом істини між ходами.

Використовуйте це, коли:

- ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з’являлися в sandbox
- ви хочете, щоб sandbox OpenShell поводився максимально схоже на backend Docker
- ви хочете, щоб workspace хоста відображав записи sandbox після кожного ходу exec

Компроміс:

- додаткові витрати на синхронізацію до і після exec

##### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб **workspace OpenShell став canonical**.

Поведінка:

- Коли sandbox створюється вперше, OpenClaw один раз виконує seed віддаленого workspace з локального workspace.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленим workspace OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний workspace після exec.
- Читання media під час prompt усе одно працює, тому що файлові інструменти та інструменти media читають через sandbox bridge, а не припускають наявність локального шляху хоста.
- Транспортом є SSH у sandbox OpenShell, який повертає `openshell sandbox ssh-config`.

Важливі наслідки:

- Якщо ви редагуєте файли на хості поза OpenClaw після кроку seed, віддалений sandbox **не** побачить ці зміни автоматично.
- Якщо sandbox перевідтворюється, віддалений workspace знову отримує seed з локального workspace.
- За `scope: "agent"` або `scope: "shared"` цей віддалений workspace буде спільним у межах тієї самої області.

Використовуйте це, коли:

- sandbox має жити переважно на віддаленому боці OpenShell
- ви хочете менші накладні витрати на синхронізацію на кожному ході
- ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox

Оберіть `mirror`, якщо ви сприймаєте sandbox як тимчасове середовище виконання.
Оберіть `remote`, якщо ви сприймаєте sandbox як справжній workspace.

#### Життєвий цикл OpenShell

Sandbox-и OpenShell і далі керуються через звичайний життєвий цикл sandbox:

- `openclaw sandbox list` показує runtime-и OpenShell так само, як і runtime-и Docker
- `openclaw sandbox recreate` видаляє поточний runtime і дозволяє OpenClaw створити його знову під час наступного використання
- логіка prune також враховує backend

Для режиму `remote` recreate особливо важливий:

- recreate видаляє canonical-віддалений workspace для цієї області
- наступне використання виконує seed нового віддаленого workspace з локального workspace

Для режиму `mirror` recreate головним чином скидає віддалене середовище виконання,
оскільки локальний workspace і так залишається canonical.

## Доступ до workspace

`agents.defaults.sandbox.workspaceAccess` визначає, **що саме може бачити sandbox**:

- `"none"` (типово): інструменти бачать sandbox-workspace в `~/.openclaw/sandboxes`.
- `"ro"`: монтує workspace агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
- `"rw"`: монтує workspace агента для читання і запису в `/workspace`.

Для backend OpenShell:

- режим `mirror` і далі використовує локальний workspace як canonical-джерело між ходами exec
- режим `remote` використовує віддалений workspace OpenShell як canonical-джерело після початкового seed
- `workspaceAccess: "ro"` і `"none"` і далі так само обмежують поведінку запису

Вхідні media копіюються в активний sandbox-workspace (`media/inbound/*`).
Примітка щодо Skills: інструмент `read` прив’язаний до кореня sandbox. За `workspaceAccess: "none"`
OpenClaw дзеркалить придатні Skills у sandbox-workspace (`.../skills`), щоб
їх можна було читати. За `"rw"` Skills робочого простору доступні для читання з
`/workspace/skills`.

## Користувацькі bind mount

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер.
Формат: `host:container:mode` (наприклад `"/home/user/source:/source:rw"`).

Глобальні bind-и та bind-и для окремого агента **об’єднуються** (а не замінюються). За `scope: "shared"` bind-и для окремого агента ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **sandbox browser**.

- Якщо задано (зокрема `[]`), воно замінює `agents.defaults.sandbox.docker.binds` для контейнера browser.
- Якщо не задано, контейнер browser використовує fallback до `agents.defaults.sandbox.docker.binds` (зворотна сумісність).

Приклад (джерело лише для читання + додатковий каталог даних):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Примітки щодо безпеки:

- Bind-и обходять файлову систему sandbox: вони відкривають шляхи хоста з тим режимом, який ви задали (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські mount-и, які б їх відкривали).
- OpenClaw також блокує типові корені облікових даних у домашньому каталозі, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Валідація bind — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, а потім знову розв’язує його через найглибший наявний предок перед повторною перевіркою заблокованих шляхів і дозволених коренів.
- Це означає, що виходи за межі через батьківські symlink теж безпечно блокуються, навіть коли кінцевий leaf ще не існує. Приклад: `/workspace/run-link/new-file` усе одно розв’язується як `/var/run/...`, якщо `run-link` вказує туди.
- Дозволені корені джерел канонікалізуються так само, тож шлях, який лише виглядає як такий, що лежить у allowlist до розв’язання symlink, усе одно буде відхилено як `outside allowed roots`.
- Чутливі mount-и (секрети, SSH-ключі, облікові дані сервісів) мають бути `:ro`, якщо тільки це не абсолютно необхідно.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ для читання до workspace; режими bind залишаються незалежними.
- Див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб зрозуміти, як bind-и взаємодіють із політикою інструментів і elevated exec.

## Образи + налаштування

Типовий образ Docker: `openclaw-sandbox:bookworm-slim`

Зберіть його один раз:

```bash
scripts/sandbox-setup.sh
```

Примітка: типовий образ **не** містить Node. Якщо Skill потребує Node (або
інших runtime), або зберіть власний образ, або встановіть залежності через
`sandbox.docker.setupCommand` (потрібні мережевий egress + корінь, доступний для запису +
користувач root).

Якщо ви хочете більш функціональний образ sandbox із поширеними інструментами (наприклад
`curl`, `jq`, `nodejs`, `python3`, `git`), зберіть:

```bash
scripts/sandbox-common-setup.sh
```

Потім задайте `agents.defaults.sandbox.docker.image` як
`openclaw-sandbox-common:bookworm-slim`.

Образ sandboxed browser:

```bash
scripts/sandbox-browser-setup.sh
```

Типово контейнери Docker sandbox запускаються **без мережі**.
Це можна перевизначити через `agents.defaults.sandbox.docker.network`.

Вбудований образ sandbox browser також застосовує консервативні типові параметри запуску Chromium
для контейнеризованих робочих навантажень. Поточні типові значення контейнера включають:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` і `--disable-setuid-sandbox`, коли увімкнено `noSandbox`.
- Три прапорці посилення графіки (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) є необов’язковими й корисними,
  коли контейнери не мають підтримки GPU. Задайте `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  якщо вашому навантаженню потрібні WebGL або інші 3D/browser-можливості.
- `--disable-extensions` увімкнено типово; його можна вимкнути через
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для потоків, що залежать від extensions.
- `--renderer-process-limit=2` керується через
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` залишає типову поведінку Chromium.

Якщо вам потрібен інший профіль runtime, використовуйте власний образ browser і надайте
власний entrypoint. Для локальних (не контейнерних) профілів Chromium використовуйте
`browser.extraArgs`, щоб додати додаткові прапорці запуску.

Типові значення безпеки:

- `network: "host"` заблоковано.
- `network: "container:<id>"` типово заблоковано (ризик обходу через приєднання до namespace).
- Аварійне перевизначення: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Установлення Docker і контейнеризований Gateway описані тут:
[Docker](/uk/install/docker)

Для розгортань Gateway через Docker `scripts/docker/setup.sh` може автоматично підготувати конфігурацію sandbox.
Задайте `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Ви можете
перевизначити розташування сокета через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування й довідник
змінних середовища: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` запускається **один раз** після створення контейнера sandbox (а не під час кожного запуску).
Він виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для окремого агента: `agents.list[].sandbox.docker.setupCommand`

Поширені пастки:

- Типове значення `docker.network` — `"none"` (без egress), тому встановлення пакетів завершуватиметься помилкою.
- `docker.network: "container:<id>"` потребує `dangerouslyAllowContainerNamespaceJoin: true` і має використовуватися лише як аварійний виняток.
- `readOnlyRoot: true` забороняє запис; задайте `readOnlyRoot: false` або зберіть власний образ.
- Для встановлення пакетів `user` має бути root (не вказуйте `user` або задайте `user: "0:0"`).
- Sandbox exec **не** успадковує `process.env` хоста. Використовуйте
  `agents.defaults.sandbox.docker.env` (або власний образ) для API-ключів Skill.

## Політика інструментів + аварійні винятки

Політики allow/deny для інструментів і далі застосовуються до правил sandbox. Якщо інструмент заборонено
глобально або для окремого агента, sandboxing не поверне його назад.

`tools.elevated` — це явний аварійний виняток, який запускає `exec` поза sandbox (`gateway` типово або `node`, коли ціллю exec є `node`).
Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються для кожної сесії; щоб жорстко вимкнути
`exec`, використовуйте deny у політиці інструментів (див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб переглянути ефективний режим sandbox, політику інструментів і ключі конфігурації для виправлення.
- Див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальної моделі “чому це заблоковано?”.
  Тримайте все максимально заблокованим.

## Перевизначення для кількох агентів

Кожен агент може перевизначати sandbox + tools:
`agents.list[].sandbox` і `agents.list[].tools` (а також `agents.list[].tools.sandbox.tools` для політики sandbox-інструментів).
Див. [Sandbox & Tools для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися про пріоритети.

## Мінімальний приклад увімкнення

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Пов’язана документація

- [OpenShell](/uk/gateway/openshell) -- налаштування керованого backend sandbox, режими workspace і довідник конфігурації
- [Конфігурація sandbox](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження “чому це заблоковано?”
- [Sandbox & Tools для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів і пріоритети
- [Безпека](/uk/gateway/security)
