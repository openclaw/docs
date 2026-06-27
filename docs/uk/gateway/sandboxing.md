---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Як працює пісочниця OpenClaw: режими, області доступу, доступ до робочої області та зображення'
title: Пісочниця
x-i18n:
    generated_at: "2026-06-27T17:35:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw може запускати **інструменти всередині sandbox-бекендів**, щоб зменшити радіус ураження. Це **необов’язково** й керується конфігурацією (`agents.defaults.sandbox` або `agents.list[].sandbox`). Якщо sandboxing вимкнено, інструменти запускаються на хості. Gateway залишається на хості; виконання інструментів відбувається в ізольованому sandbox, коли це ввімкнено.

<Note>
Це не ідеальна межа безпеки, але вона суттєво обмежує доступ до файлової системи й процесів, коли модель робить щось помилкове.
</Note>

## Що потрапляє в sandbox

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий sandbox-браузер (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - За замовчуванням sandbox-браузер автоматично запускається (гарантує доступність CDP), коли він потрібен браузерному інструменту. Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - За замовчуванням контейнери sandbox-браузера використовують окрему Docker-мережу (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`. Налаштовується через `agents.defaults.sandbox.browser.network`.
    - Необов’язковий параметр `agents.defaults.sandbox.browser.cdpSourceRange` обмежує CDP-вхід на межі контейнера за допомогою списку дозволених CIDR (наприклад, `172.21.0.1/32`).
    - Доступ спостерігача noVNC за замовчуванням захищений паролем; OpenClaw видає короткочасну URL-адресу з токеном, яка віддає локальну сторінку початкового завантаження й відкриває noVNC із паролем у фрагменті URL (не в query/header-логах).
    - `agents.defaults.sandbox.browser.allowHostControl` дає sandbox-сесіям змогу явно спрямовуватися на браузер хоста.
    - Необов’язкові списки дозволеного обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Не потрапляє в sandbox:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено запускатися поза sandbox (наприклад, `tools.elevated`).
  - **Підвищений exec обходить sandboxing і використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).**
  - Якщо sandboxing вимкнено, `tools.elevated` не змінює виконання (воно вже на хості). Див. [Підвищений режим](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` керує тим, **коли** використовується sandboxing:

<Tabs>
  <Tab title="off">
    Без sandboxing.
  </Tab>
  <Tab title="non-main">
    Лише **non-main** сесії потрапляють у sandbox (типово, якщо ви хочете, щоб звичайні чати були на хості).

    `"non-main"` базується на `session.mainKey` (типово `"main"`), а не на ідентифікаторі агента. Групові/канальні сесії використовують власні ключі, тому вважаються non-main і потраплятимуть у sandbox.

  </Tab>
  <Tab title="all">
    Кожна сесія запускається в sandbox.
  </Tab>
</Tabs>

## Область

`agents.defaults.sandbox.scope` керує тим, **скільки контейнерів** створюється:

- `"agent"` (типово): один контейнер на агента.
- `"session"`: один контейнер на сесію.
- `"shared"`: один контейнер, спільний для всіх sandbox-сесій.

## Бекенд

`agents.defaults.sandbox.backend` керує тим, **яке середовище виконання** надає sandbox:

- `"docker"` (типово, коли sandboxing увімкнено): локальне sandbox-середовище виконання на базі Docker.
- `"ssh"`: універсальне віддалене sandbox-середовище виконання на базі SSH.
- `"openshell"`: sandbox-середовище виконання на базі OpenShell.

SSH-специфічна конфігурація міститься в `agents.defaults.sandbox.ssh`. OpenShell-специфічна конфігурація міститься в `plugins.entries.openshell.config`.

### Вибір бекенда

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Де запускається** | Локальний контейнер              | Будь-який SSH-доступний хост   | Керований OpenShell sandbox                         |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH-ключ + цільовий хост       | Увімкнений OpenShell Plugin                         |
| **Модель робочої області** | Bind-mount або копіювання | Віддалено-канонічна (початкове заповнення один раз) | `mirror` або `remote` |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell |
| **Браузерний sandbox** | Підтримується                 | Не підтримується               | Поки не підтримується                               |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Найкраще для**    | Локальної розробки, повної ізоляції | Перенесення навантаження на віддалену машину | Керованих віддалених sandbox із необов’язковою двосторонньою синхронізацією |

### Docker-бекенд

Sandboxing вимкнено за замовчуванням. Якщо ви ввімкнете sandboxing і не виберете бекенд, OpenClaw використає Docker-бекенд. Він виконує інструменти й sandbox-браузери локально через сокет демона Docker (`/var/run/docker.sock`). Ізоляція sandbox-контейнера визначається просторами імен Docker.

Щоб відкрити GPU хоста для Docker-sandbox, задайте `agents.defaults.sandbox.docker.gpus` або перевизначення для окремого агента `agents.list[].sandbox.docker.gpus`. Значення передається до прапорця Docker `--gpus` як окремий аргумент, наприклад `"all"` або `"device=GPU-uuid"`, і потребує сумісного середовища виконання на хості, такого як NVIDIA Container Toolkit.

<Warning>
**Обмеження Docker-out-of-Docker (DooD)**

Якщо ви розгортаєте сам OpenClaw Gateway як Docker-контейнер, він оркеструє sibling sandbox-контейнери через Docker-сокет хоста (DooD). Це створює конкретне обмеження зіставлення шляхів:

- **Конфігурація потребує шляхів хоста**: конфігурація `workspace` в `openclaw.json` МАЄ містити **абсолютний шлях хоста** (наприклад, `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить демон Docker створити sandbox, демон оцінює шляхи відносно простору імен ОС хоста, а не простору імен Gateway.
- **Паритет FS bridge (ідентична мапа volume)**: нативний процес OpenClaw Gateway також записує Heartbeat і bridge-файли в каталог `workspace`. Оскільки Gateway оцінює той самий рядок (шлях хоста) зі свого контейнеризованого середовища, розгортання Gateway МАЄ містити ідентичну мапу volume, що нативно зв’язує простір імен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Codex code mode**: коли активний OpenClaw sandbox, OpenClaw вимикає нативний Code Mode app-server Codex, користувацькі MCP-сервери та виконання Plugin на базі app для цього ходу, бо ці нативні поверхні працюють із процесу app-server хоста Gateway, а не з OpenClaw sandbox-бекенда. Shell-доступ відкривається через інструменти OpenClaw на базі sandbox, як-от `sandbox_exec` і `sandbox_process`, коли доступні звичайні інструменти exec/process. Не монтуйте Docker-сокет хоста в agent sandbox-контейнери або користувацькі Codex sandbox.

На хостах Ubuntu/AppArmor Codex `workspace-write` може завершитися помилкою до запуску shell,
коли ви навмисно запускаєте нативний Codex `workspace-write` без активного
OpenClaw sandboxing, а службовому користувачу не дозволено створювати непривілейовані
простори імен користувача. Коли вихід Docker sandbox вимкнено (`network: "none"`, типово),
Codex також потребує непривілейованого мережевого простору імен. Типові симптоми:
`bwrap: setting up uid map: Permission denied` і
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Запустіть
`openclaw doctor`; якщо він повідомить про збій перевірки простору імен Codex bwrap, надайте перевагу
профілю AppArmor, який надає потрібні простори імен процесу служби OpenClaw.
`kernel.apparmor_restrict_unprivileged_userns=0` — це загальнохостовий
fallback із компромісами безпеки; використовуйте його лише тоді, коли така позиція хоста
прийнятна.

Якщо ви зіставляєте шляхи внутрішньо без абсолютного паритету з хостом, OpenClaw нативно викидає помилку дозволів `EACCES` під час спроби записати свій Heartbeat усередині контейнерного середовища, бо повністю кваліфікований рядок шляху нативно не існує.
</Warning>

### SSH-бекенд

Використовуйте `backend: "ssh"`, коли хочете, щоб OpenClaw запускав `exec`, файлові інструменти й читання медіа в sandbox на довільній машині, доступній через SSH.

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

<AccordionGroup>
  <Accordion title="How it works">
    - OpenClaw створює віддалений root для кожної області під `sandbox.ssh.workspaceRoot`.
    - Під час першого використання після створення або повторного створення OpenClaw один раз заповнює цю віддалену робочу область із локальної робочої області.
    - Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання prompt-медіа й staging вхідних медіа виконуються безпосередньо з віддаленою робочою областю через SSH.
    - OpenClaw не синхронізує віддалені зміни назад у локальну робочу область автоматично.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли й передають їх через конфігурацію OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: використовують inline-рядки або SecretRefs. OpenClaw розв’язує їх через звичайний snapshot середовища виконання секретів, записує їх у тимчасові файли з `0600` і видаляє після завершення SSH-сесії.
    - Якщо для того самого елемента задано і `*File`, і `*Data`, `*Data` має пріоритет для цієї SSH-сесії.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Це **віддалено-канонічна** модель. Віддалена SSH-робоча область стає справжнім станом sandbox після початкового заповнення.

    - Локальні для хоста зміни, зроблені поза OpenClaw після кроку заповнення, не видимі віддалено, доки ви не створите sandbox повторно.
    - `openclaw sandbox recreate` видаляє віддалений root для відповідної області й знову заповнює його з локального під час наступного використання.
    - Браузерний sandbox не підтримується в SSH-бекенді.
    - Налаштування `sandbox.docker.*` не застосовуються до SSH-бекенда.

  </Accordion>
</AccordionGroup>

### OpenShell-бекенд

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw запускав інструменти в sandbox у віддаленому середовищі, керованому OpenShell. Повний посібник із налаштування, довідку з конфігурації та порівняння режимів робочої області див. на окремій [сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий базовий SSH-транспорт і віддалений міст файлової системи, що й універсальний SSH-бекенд, і додає специфічний для OpenShell життєвий цикл (`sandbox create/get/delete`, `sandbox ssh-config`) плюс необов’язковий режим робочої області `mirror`.

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

- `mirror` (типово): локальна робоча область залишається канонічною. OpenClaw синхронізує локальні файли в OpenShell перед exec і синхронізує віддалену робочу область назад після exec.
- `remote`: робоча область OpenShell є канонічною після створення sandbox. OpenClaw один раз заповнює віддалену робочу область із локальної, а потім файлові інструменти й exec працюють безпосередньо з віддаленим sandbox без синхронізації змін назад.

<AccordionGroup>
  <Accordion title="Подробиці віддаленого транспорту">
    - OpenClaw запитує в OpenShell SSH-конфігурацію для конкретної пісочниці через `openshell sandbox ssh-config <name>`.
    - Ядро записує цю SSH-конфігурацію в тимчасовий файл, відкриває SSH-сеанс і повторно використовує той самий віддалений міст файлової системи, що й `backend: "ssh"`.
    - У режимі `mirror` відрізняється лише життєвий цикл: синхронізація локального середовища з віддаленим перед exec, потім зворотна синхронізація після exec.

  </Accordion>
  <Accordion title="Поточні обмеження OpenShell">
    - браузер пісочниці поки не підтримується
    - `sandbox.docker.binds` не підтримується в бекенді OpenShell
    - специфічні для Docker параметри виконання в `sandbox.docker.*` досі застосовуються лише до бекенду Docker

  </Accordion>
</AccordionGroup>

#### Режими робочого простору

OpenShell має дві моделі робочого простору. На практиці це найважливіша частина.

<Tabs>
  <Tab title="mirror (локальний канонічний)">
    Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальний робочий простір залишався канонічним**.

    Поведінка:

    - Перед `exec` OpenClaw синхронізує локальний робочий простір із пісочницею OpenShell.
    - Після `exec` OpenClaw синхронізує віддалений робочий простір назад у локальний робочий простір.
    - Файлові інструменти й надалі працюють через міст пісочниці, але локальний робочий простір залишається джерелом істини між ходами.

    Використовуйте це, коли:

    - ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з'являлися в пісочниці
    - ви хочете, щоб пісочниця OpenShell поводилася якомога подібніше до бекенду Docker
    - ви хочете, щоб робочий простір хоста відображав записи пісочниці після кожного ходу exec

    Компроміс: додаткові витрати на синхронізацію до й після exec.

  </Tab>
  <Tab title="remote (OpenShell канонічний)">
    Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб **робочий простір OpenShell став канонічним**.

    Поведінка:

    - Коли пісочницю створено вперше, OpenClaw один раз ініціалізує віддалений робочий простір із локального робочого простору.
    - Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленим робочим простором OpenShell.
    - OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір після exec.
    - Читання медіа під час формування промпта й надалі працює, бо файлові й медіаінструменти читають через міст пісочниці, а не припускають локальний шлях хоста.
    - Транспортом є SSH у пісочницю OpenShell, повернуту `openshell sandbox ssh-config`.

    Важливі наслідки:

    - Якщо після етапу ініціалізації ви редагуєте файли на хості поза OpenClaw, віддалена пісочниця **не** побачить ці зміни автоматично.
    - Якщо пісочницю створено заново, віддалений робочий простір знову ініціалізується з локального робочого простору.
    - З `scope: "agent"` або `scope: "shared"` цей віддалений робочий простір спільно використовується на тому самому рівні області.

    Використовуйте це, коли:

    - пісочниця має переважно жити на віддаленому боці OpenShell
    - ви хочете зменшити витрати на синхронізацію для кожного ходу
    - ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленої пісочниці

  </Tab>
</Tabs>

Виберіть `mirror`, якщо сприймаєте пісочницю як тимчасове середовище виконання. Виберіть `remote`, якщо сприймаєте пісочницю як справжній робочий простір.

#### Життєвий цикл OpenShell

Пісочниці OpenShell і надалі керуються через звичайний життєвий цикл пісочниці:

- `openclaw sandbox list` показує середовища виконання OpenShell, а також середовища Docker
- `openclaw sandbox recreate` видаляє поточне середовище виконання й дає OpenClaw змогу створити його заново під час наступного використання
- логіка prune також враховує бекенд

Для режиму `remote` повторне створення особливо важливе:

- повторне створення видаляє канонічний віддалений робочий простір для цієї області
- наступне використання ініціалізує свіжий віддалений робочий простір із локального робочого простору

Для режиму `mirror` повторне створення переважно скидає віддалене середовище виконання, бо локальний робочий простір усе одно залишається канонічним.

## Доступ до робочого простору

`agents.defaults.sandbox.workspaceAccess` керує тим, **що може бачити пісочниця**:

<Tabs>
  <Tab title="none (за замовчуванням)">
    Інструменти бачать робочий простір пісочниці в `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Монтує робочий простір агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Монтує робочий простір агента для читання/запису в `/workspace`.
  </Tab>
</Tabs>

З бекендом OpenShell:

- режим `mirror` і надалі використовує локальний робочий простір як канонічне джерело між ходами exec
- режим `remote` використовує віддалений робочий простір OpenShell як канонічне джерело після початкової ініціалізації
- `workspaceAccess: "ro"` і `"none"` і надалі обмежують поведінку запису так само

Вхідні медіа копіюються в активний робочий простір пісочниці (`media/inbound/*`).

<Note>
**Примітка щодо Skills:** інструмент `read` прив'язаний до кореня пісочниці. З `workspaceAccess: "none"` OpenClaw віддзеркалює придатні skills у робочий простір пісочниці (`.../skills`), щоб їх можна було читати. З `"rw"` skills робочого простору доступні для читання з `/workspace/skills`, а придатні керовані, вбудовані або plugin skills матеріалізуються у згенерований шлях лише для читання `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Користувацькі bind-монтування

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер. Формат: `host:container:mode` (наприклад, `"/home/user/source:/source:rw"`).

Глобальні й агентні binds **об'єднуються** (не замінюються). За `scope: "shared"` агентні binds ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **браузера пісочниці**.

- Коли задано (зокрема `[]`), це замінює `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Коли пропущено, контейнер браузера повертається до `agents.defaults.sandbox.docker.binds` (зворотно сумісно).

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

<Warning>
**Безпека bind-монтувань**

- Binds обходять файлову систему пісочниці: вони відкривають шляхи хоста з тим режимом, який ви встановили (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські монтування, які могли б їх відкрити).
- OpenClaw також блокує типові корені облікових даних у домашньому каталозі, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Перевірка bind — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, потім знову розв'язує його через найглибшого наявного предка, перш ніж повторно перевірити заблоковані шляхи й дозволені корені.
- Це означає, що виходи через батьківські symlink і надалі блокуються, навіть якщо кінцевий листок ще не існує. Приклад: `/workspace/run-link/new-file` усе одно розв'язується як `/var/run/...`, якщо `run-link` указує туди.
- Дозволені корені джерел канонізуються так само, тому шлях, який виглядає як такий, що перебуває в allowlist лише до розв'язання symlink, усе одно відхиляється як `outside allowed roots`.
- Чутливі монтування (секрети, SSH-ключі, облікові дані сервісів) мають бути `:ro`, якщо інше не є абсолютно необхідним.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ до робочого простору для читання; режими bind залишаються незалежними.
- Див. [Пісочниця vs політика інструментів vs підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб дізнатися, як binds взаємодіють із політикою інструментів і підвищеним exec.

</Warning>

## Образи й налаштування

Стандартний образ Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Вихідний checkout vs встановлення npm**

Допоміжні скрипти `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` і `scripts/sandbox-browser-setup.sh` доступні лише під час запуску з [вихідного checkout](https://github.com/openclaw/openclaw). Вони не входять до пакета npm.

Якщо ви встановили OpenClaw через `npm install -g openclaw`, використовуйте наведені нижче inline-команди `docker build`.
</Note>

<Steps>
  <Step title="Зберіть стандартний образ">
    З вихідного checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    З npm-встановлення (вихідний checkout не потрібен):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Стандартний образ **не** містить Node. Якщо skill потребує Node (або інших середовищ виконання), або вбудуйте власний образ, або встановіть через `sandbox.docker.setupCommand` (потрібні вихід у мережу + записуваний root + користувач root).

    OpenClaw не підміняє непомітно відсутній `openclaw-sandbox:bookworm-slim` простим `debian:bookworm-slim`. Запуски пісочниці, націлені на стандартний образ, швидко завершуються помилкою з інструкцією зі збирання, доки ви його не зберете, бо вбудований образ містить `python3` для допоміжних засобів запису/редагування в пісочниці.

  </Step>
  <Step title="Необов'язково: зберіть common-образ">
    Для функціональнішого образу пісочниці з поширеними інструментами (наприклад, `curl`, `jq`, Node 24, pnpm, `python3` і `git`):

    З вихідного checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    З npm-встановлення спершу зберіть стандартний образ (див. вище), а потім зберіть common-образ поверх нього, використовуючи [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) з репозиторію.

    Потім установіть `agents.defaults.sandbox.docker.image` у `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Необов'язково: зберіть образ браузера пісочниці">
    З вихідного checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    З npm-встановлення зберіть за допомогою [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) з репозиторію.

  </Step>
</Steps>

За замовчуванням контейнери пісочниці Docker запускаються **без мережі**. Перевизначте це через `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Стандартні налаштування Chromium для браузера пісочниці">
    Вбудований образ браузера пісочниці також застосовує консервативні стартові налаштування Chromium для контейнеризованих навантажень. Поточні стандартні налаштування контейнера включають:

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
    - `--no-sandbox`, коли ввімкнено `noSandbox`.
    - Три прапорці посилення графіки (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) необов'язкові й корисні, коли контейнери не мають підтримки GPU. Установіть `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо ваше навантаження потребує WebGL або інших 3D/браузерних функцій.
    - `--disable-extensions` увімкнено за замовчуванням; його можна вимкнути через `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для потоків, що залежать від розширень.
    - `--renderer-process-limit=2` керується через `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає стандартне значення Chromium.

    Якщо вам потрібен інший профіль виконання, використайте власний образ браузера й надайте власний entrypoint. Для локальних (неконтейнерних) профілів Chromium використовуйте `browser.extraArgs`, щоб додати додаткові стартові прапорці.

  </Accordion>
  <Accordion title="Стандартні налаштування мережевої безпеки">
    - `network: "host"` заблоковано.
    - `network: "container:<id>"` заблоковано за замовчуванням (ризик обходу через приєднання до простору імен).
    - Аварійний виняток: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Інсталяції Docker і контейнеризований Gateway описано тут: [Docker](/uk/install/docker)

Для розгортань Docker Gateway `scripts/docker/setup.sh` може ініціалізувати конфігурацію пісочниці. Установіть `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Розташування сокета можна перевизначити за допомогою `OPENCLAW_DOCKER_SOCKET`. Повне налаштування й довідник змінних середовища: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` запускається **один раз** після створення контейнера пісочниці (не під час кожного запуску). Виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для окремого агента: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Поширені помилки">
    - Стандартне значення `docker.network` — `"none"` (без вихідного доступу), тому встановлення пакетів завершуватиметься помилкою.
    - `docker.network: "container:<id>"` потребує `dangerouslyAllowContainerNamespaceJoin: true` і призначене лише для аварійного винятку.
    - `readOnlyRoot: true` забороняє записи; установіть `readOnlyRoot: false` або підготуйте власний образ.
    - Для встановлення пакетів `user` має бути root (пропустіть `user` або встановіть `user: "0:0"`).
    - Виконання в пісочниці **не** успадковує `process.env` хоста. Використовуйте `agents.defaults.sandbox.docker.env` (або власний образ) для API-ключів Skills.
    - Значення в `agents.defaults.sandbox.docker.env` передаються як явні змінні середовища контейнера Docker. Будь-хто з доступом до демона Docker може переглянути їх командами метаданих Docker, як-от `docker inspect`. Використовуйте власний образ, змонтований файл із секретами або інший шлях доставлення секретів, якщо таке розкриття метаданих неприйнятне.

  </Accordion>
</AccordionGroup>

## Політика інструментів і аварійні виходи

Політики дозволу/заборони інструментів усе ще застосовуються перед правилами пісочниці. Якщо інструмент заборонено глобально або для окремого агента, пісочниця не повертає його назад.

`tools.elevated` — це явний аварійний вихід, який запускає `exec` поза пісочницею (`gateway` за замовчуванням або `node`, коли ціль виконання — `node`). Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються в межах сеансу; щоб жорстко вимкнути `exec`, використовуйте заборону в політиці інструментів (див. [Пісочниця, політика інструментів і Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб перевірити фактичний режим пісочниці, політику інструментів і ключі конфігурації для виправлення.
- Див. [Пісочниця, політика інструментів і Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб зрозуміти модель мислення для питання «чому це заблоковано?».

Тримайте все заблокованим.

## Перевизначення для кількох агентів

Кожен агент може перевизначати пісочницю та інструменти: `agents.list[].sandbox` і `agents.list[].tools` (а також `agents.list[].tools.sandbox.tools` для політики інструментів пісочниці). Див. [Пісочниця й інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools), щоб дізнатися про пріоритет.

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

## Пов’язане

- [Пісочниця й інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) — перевизначення для окремих агентів і пріоритет
- [OpenShell](/uk/gateway/openshell) — налаштування керованого бекенда пісочниці, режими робочої області та довідник конфігурації
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця, політика інструментів і Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження «чому це заблоковано?»
- [Безпека](/uk/gateway/security)
