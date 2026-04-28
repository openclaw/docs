---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Як працює ізоляція OpenClaw: режими, області дії, доступ до робочого простору та зображення'
title: Ізоляція в пісочниці
x-i18n:
    generated_at: "2026-04-28T11:13:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw може запускати **інструменти всередині бекендів пісочниці**, щоб зменшити зону ураження. Це **необов’язково** й керується конфігурацією (`agents.defaults.sandbox` або `agents.list[].sandbox`). Якщо пісочницю вимкнено, інструменти запускаються на хості. Gateway залишається на хості; виконання інструментів відбувається в ізольованій пісочниці, коли її ввімкнено.

<Note>
Це не ідеальна межа безпеки, але вона суттєво обмежує доступ до файлової системи й процесів, коли модель робить щось нерозумне.
</Note>

## Що запускається в пісочниці

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий браузер у пісочниці (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Подробиці браузера в пісочниці">
    - За замовчуванням браузер у пісочниці запускається автоматично (гарантує доступність CDP), коли він потрібен інструменту браузера. Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - За замовчуванням контейнери браузера в пісочниці використовують окрему мережу Docker (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`. Налаштовується через `agents.defaults.sandbox.browser.network`.
    - Необов’язковий параметр `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний CDP-доступ на межі контейнера за допомогою CIDR-списку дозволених адрес (наприклад, `172.21.0.1/32`).
    - Доступ спостерігача noVNC за замовчуванням захищений паролем; OpenClaw видає короткочасну URL-адресу з токеном, яка віддає локальну сторінку початкового завантаження та відкриває noVNC із паролем у фрагменті URL (не в журналах query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` дозволяє сеансам у пісочниці явно націлюватися на браузер хоста.
    - Необов’язкові списки дозволів обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Не запускається в пісочниці:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено запускатися поза пісочницею (наприклад, `tools.elevated`).
  - **Підвищений exec обходить пісочницю й використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).**
  - Якщо пісочницю вимкнено, `tools.elevated` не змінює виконання (воно вже на хості). Див. [Підвищений режим](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` керує тим, **коли** використовується пісочниця:

<Tabs>
  <Tab title="off">
    Без пісочниці.
  </Tab>
  <Tab title="non-main">
    Запускати в пісочниці лише **неосновні** сеанси (типово, якщо ви хочете, щоб звичайні чати були на хості).

    `"non-main"` базується на `session.mainKey` (за замовчуванням `"main"`), а не на id агента. Сеанси груп/каналів використовують власні ключі, тому вони вважаються неосновними й запускатимуться в пісочниці.

  </Tab>
  <Tab title="all">
    Кожен сеанс запускається в пісочниці.
  </Tab>
</Tabs>

## Область

`agents.defaults.sandbox.scope` керує тим, **скільки контейнерів** створюється:

- `"agent"` (за замовчуванням): один контейнер на агента.
- `"session"`: один контейнер на сеанс.
- `"shared"`: один контейнер, спільний для всіх сеансів у пісочниці.

## Бекенд

`agents.defaults.sandbox.backend` керує тим, **яке середовище виконання** надає пісочницю:

- `"docker"` (за замовчуванням, коли пісочницю ввімкнено): локальне середовище пісочниці на базі Docker.
- `"ssh"`: універсальне віддалене середовище пісочниці на базі SSH.
- `"openshell"`: середовище пісочниці на базі OpenShell.

Конфігурація, специфічна для SSH, розміщується в `agents.defaults.sandbox.ssh`. Конфігурація, специфічна для OpenShell, розміщується в `plugins.entries.openshell.config`.

### Вибір бекенду

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Де запускається** | Локальний контейнер              | Будь-який хост із доступом SSH | Пісочниця, керована OpenShell                       |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH-ключ + цільовий хост       | Увімкнений Plugin OpenShell                         |
| **Модель робочої області** | Bind-mount або копіювання        | Віддалена канонічна (одноразове засівання) | `mirror` або `remote`                              |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell                              |
| **Пісочниця браузера** | Підтримується                 | Не підтримується               | Ще не підтримується                                 |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Найкраще для**    | Локальної розробки, повної ізоляції | Перенесення навантаження на віддалену машину | Керованих віддалених пісочниць із необов’язковою двобічною синхронізацією |

### Бекенд Docker

Пісочницю за замовчуванням вимкнено. Якщо ви вмикаєте пісочницю й не вибираєте бекенд, OpenClaw використовує бекенд Docker. Він виконує інструменти та браузери в пісочниці локально через сокет демона Docker (`/var/run/docker.sock`). Ізоляція контейнера пісочниці визначається просторами імен Docker.

Щоб надати GPU хоста пісочницям Docker, задайте `agents.defaults.sandbox.docker.gpus` або перевизначення для агента `agents.list[].sandbox.docker.gpus`. Значення передається до прапорця Docker `--gpus` як окремий аргумент, наприклад `"all"` або `"device=GPU-uuid"`, і потребує сумісного середовища виконання на хості, як-от NVIDIA Container Toolkit.

<Warning>
**Обмеження Docker-out-of-Docker (DooD)**

Якщо ви розгортаєте сам OpenClaw Gateway як контейнер Docker, він оркеструє сусідні контейнери пісочниці через Docker-сокет хоста (DooD). Це створює конкретне обмеження зіставлення шляхів:

- **Конфігурація потребує шляхів хоста**: Конфігурація `workspace` в `openclaw.json` ПОВИННА містити **абсолютний шлях хоста** (наприклад, `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить демон Docker створити пісочницю, демон обчислює шляхи відносно простору імен ОС хоста, а не простору імен Gateway.
- **Паритет FS bridge (ідентична мапа томів)**: Нативний процес OpenClaw Gateway також записує файли Heartbeat і bridge до каталогу `workspace`. Оскільки Gateway обчислює той самий рядок (шлях хоста) зі свого власного контейнеризованого середовища, розгортання Gateway ПОВИННЕ містити ідентичну мапу томів, що нативно пов’язує простір імен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).

Якщо ви зіставляєте шляхи внутрішньо без паритету з абсолютним шляхом хоста, OpenClaw нативно видає помилку дозволів `EACCES` під час спроби записати свій Heartbeat усередині контейнерного середовища, тому що повністю кваліфікований рядок шляху нативно не існує.
</Warning>

### Бекенд SSH

Використовуйте `backend: "ssh"`, коли хочете, щоб OpenClaw запускав `exec`, файлові інструменти та читання медіа в пісочниці на довільній машині з доступом SSH.

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
  <Accordion title="Як це працює">
    - OpenClaw створює віддалений корінь для кожної області в `sandbox.ssh.workspaceRoot`.
    - Під час першого використання після створення або повторного створення OpenClaw один раз засіває цю віддалену робочу область із локальної робочої області.
    - Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання медіа для промптів і підготовка вхідних медіа працюють безпосередньо з віддаленою робочою областю через SSH.
    - OpenClaw не синхронізує віддалені зміни назад до локальної робочої області автоматично.

  </Accordion>
  <Accordion title="Матеріали автентифікації">
    - `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли й передають їх через конфігурацію OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: використовують inline-рядки або SecretRefs. OpenClaw розв’язує їх через звичайний знімок середовища виконання секретів, записує їх у тимчасові файли з `0600` і видаляє після завершення SSH-сеансу.
    - Якщо для одного й того самого елемента задано і `*File`, і `*Data`, `*Data` має перевагу для цього SSH-сеансу.

  </Accordion>
  <Accordion title="Наслідки віддаленої канонічності">
    Це **віддалено-канонічна** модель. Віддалена SSH-робоча область стає справжнім станом пісочниці після початкового засівання.

    - Локальні зміни на хості, зроблені поза OpenClaw після етапу засівання, не видимі віддалено, доки ви не створите пісочницю повторно.
    - `openclaw sandbox recreate` видаляє віддалений корінь для кожної області й знову засіває його з локальної робочої області під час наступного використання.
    - Пісочниця браузера не підтримується на бекенді SSH.
    - Налаштування `sandbox.docker.*` не застосовуються до бекенду SSH.

  </Accordion>
</AccordionGroup>

### Бекенд OpenShell

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw запускав інструменти в пісочниці у віддаленому середовищі, керованому OpenShell. Повний посібник із налаштування, довідку конфігурації та порівняння режимів робочої області див. на окремій [сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий основний SSH-транспорт і віддалений міст файлової системи, що й універсальний бекенд SSH, і додає специфічний для OpenShell життєвий цикл (`sandbox create/get/delete`, `sandbox ssh-config`) плюс необов’язковий режим робочої області `mirror`.

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

- `mirror` (за замовчуванням): локальна робоча область залишається канонічною. OpenClaw синхронізує локальні файли в OpenShell перед exec і синхронізує віддалену робочу область назад після exec.
- `remote`: робоча область OpenShell є канонічною після створення пісочниці. OpenClaw один раз засіває віддалену робочу область із локальної робочої області, потім файлові інструменти й exec працюють безпосередньо з віддаленою пісочницею без синхронізації змін назад.

<AccordionGroup>
  <Accordion title="Подробиці віддаленого транспорту">
    - OpenClaw запитує в OpenShell SSH-конфігурацію для конкретної пісочниці через `openshell sandbox ssh-config <name>`.
    - Core записує цю SSH-конфігурацію до тимчасового файла, відкриває SSH-сеанс і повторно використовує той самий віддалений міст файлової системи, що й `backend: "ssh"`.
    - У режимі `mirror` відрізняється лише життєвий цикл: синхронізація з локального в віддалене перед exec, потім синхронізація назад після exec.

  </Accordion>
  <Accordion title="Поточні обмеження OpenShell">
    - пісочниця браузера ще не підтримується
    - `sandbox.docker.binds` не підтримується на бекенді OpenShell
    - специфічні для Docker параметри середовища виконання в `sandbox.docker.*` і далі застосовуються лише до бекенду Docker

  </Accordion>
</AccordionGroup>

#### Режими робочої області

OpenShell має дві моделі робочої області. Це частина, яка на практиці має найбільше значення.

<Tabs>
  <Tab title="mirror (локальна канонічна)">
    Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальна робоча область залишалася канонічною**.

    Поведінка:

    - Перед `exec` OpenClaw синхронізує локальну робочу область у пісочницю OpenShell.
    - Після `exec` OpenClaw синхронізує віддалену робочу область назад до локальної робочої області.
    - Файлові інструменти й надалі працюють через міст пісочниці, але локальна робоча область залишається джерелом істини між ходами.

    Використовуйте це, коли:

    - ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з'являлися в sandbox
    - ви хочете, щоб sandbox OpenShell поводився максимально подібно до бекенда Docker
    - ви хочете, щоб робоча область хоста відображала записи sandbox після кожного ходу exec

    Компроміс: додаткові витрати на синхронізацію до й після exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб **робоча область OpenShell стала канонічною**.

    Поведінка:

    - Коли sandbox створюється вперше, OpenClaw один раз наповнює віддалену робочу область із локальної робочої області.
    - Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленою робочою областю OpenShell.
    - OpenClaw **не** синхронізує віддалені зміни назад у локальну робочу область після exec.
    - Читання медіа під час формування prompt усе ще працює, бо інструменти файлів і медіа читають через міст sandbox, а не припускають локальний шлях хоста.
    - Транспортом є SSH у sandbox OpenShell, повернений `openshell sandbox ssh-config`.

    Важливі наслідки:

    - Якщо після кроку початкового наповнення ви редагуєте файли на хості поза OpenClaw, віддалений sandbox **не** побачить ці зміни автоматично.
    - Якщо sandbox створюється повторно, віддалена робоча область знову наповнюється з локальної робочої області.
    - З `scope: "agent"` або `scope: "shared"` ця віддалена робоча область спільно використовується в межах тієї самої області.

    Використовуйте це, коли:

    - sandbox має жити переважно на віддаленому боці OpenShell
    - вам потрібні менші накладні витрати синхронізації на кожен хід
    - ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox

  </Tab>
</Tabs>

Виберіть `mirror`, якщо сприймаєте sandbox як тимчасове середовище виконання. Виберіть `remote`, якщо сприймаєте sandbox як справжню робочу область.

#### Життєвий цикл OpenShell

Sandbox OpenShell усе ще керуються через звичайний життєвий цикл sandbox:

- `openclaw sandbox list` показує середовища виконання OpenShell, а також середовища виконання Docker
- `openclaw sandbox recreate` видаляє поточне середовище виконання й дозволяє OpenClaw повторно створити його під час наступного використання
- логіка очищення також враховує бекенд

Для режиму `remote` повторне створення особливо важливе:

- повторне створення видаляє канонічну віддалену робочу область для цієї області
- наступне використання наповнює свіжу віддалену робочу область із локальної робочої області

Для режиму `mirror` повторне створення переважно скидає віддалене середовище виконання, бо локальна робоча область усе одно лишається канонічною.

## Доступ до робочої області

`agents.defaults.sandbox.workspaceAccess` керує тим, **що може бачити sandbox**:

<Tabs>
  <Tab title="none (default)">
    Інструменти бачать робочу область sandbox у `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Монтує робочу область агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Монтує робочу область агента для читання й запису в `/workspace`.
  </Tab>
</Tabs>

З бекендом OpenShell:

- режим `mirror` усе ще використовує локальну робочу область як канонічне джерело між ходами exec
- режим `remote` використовує віддалену робочу область OpenShell як канонічне джерело після початкового наповнення
- `workspaceAccess: "ro"` і `"none"` усе ще обмежують поведінку запису так само

Вхідні медіа копіюються в активну робочу область sandbox (`media/inbound/*`).

<Note>
**Примітка щодо Skills:** інструмент `read` прив'язаний до кореня sandbox. З `workspaceAccess: "none"` OpenClaw дзеркалить придатні Skills у робочу область sandbox (`.../skills`), щоб їх можна було читати. З `"rw"` Skills робочої області доступні для читання з `/workspace/skills`.
</Note>

## Користувацькі bind-монтування

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер. Формат: `host:container:mode` (наприклад, `"/home/user/source:/source:rw"`).

Глобальні й агентні bind-монтування **об'єднуються** (не замінюються). За `scope: "shared"` агентні bind-монтування ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **браузера sandbox**.

- Коли задано (зокрема `[]`), це замінює `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Коли не задано, контейнер браузера повертається до `agents.defaults.sandbox.docker.binds` (зворотна сумісність).

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

- Bind-монтування обходять файлову систему sandbox: вони відкривають шляхи хоста з режимом, який ви задаєте (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind-монтувань (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські монтування, які могли б їх відкрити).
- OpenClaw також блокує поширені корені облікових даних у домашньому каталозі, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Перевірка bind-монтувань — це не лише зіставлення рядків. OpenClaw нормалізує шлях джерела, а потім знову розв'язує його через найглибшого наявного предка перед повторною перевіркою заблокованих шляхів і дозволених коренів.
- Це означає, що виходи через батьківські symlink усе одно закриваються з відмовою, навіть коли кінцевого листка ще не існує. Приклад: `/workspace/run-link/new-file` усе ще розв'язується як `/var/run/...`, якщо `run-link` указує туди.
- Дозволені корені джерел канонізуються так само, тому шлях, який лише виглядає як такий, що перебуває в allowlist до розв'язання symlink, усе одно відхиляється як `outside allowed roots`.
- Чутливі монтування (секрети, SSH-ключі, облікові дані сервісів) мають бути `:ro`, якщо інше не є абсолютно необхідним.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ на читання до робочої області; режими bind-монтувань лишаються незалежними.
- Див. [Sandbox проти політики інструментів проти підвищеного доступу](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб дізнатися, як bind-монтування взаємодіють із політикою інструментів і підвищеним exec.

</Warning>

## Образи й налаштування

Типовий образ Docker: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    Типовий образ **не** містить Node. Якщо Skills потребує Node (або інших середовищ виконання), або вбудуйте користувацький образ, або встановіть через `sandbox.docker.setupCommand` (потрібні вихід у мережу + записуваний корінь + користувач root).

    OpenClaw не підміняє відсутній `openclaw-sandbox:bookworm-slim` звичайним `debian:bookworm-slim` непомітно. Запуски sandbox, націлені на типовий образ, швидко завершуються з інструкцією зі збирання, доки ви не виконаєте `scripts/sandbox-setup.sh`, бо вбудований образ містить `python3` для помічників запису/редагування sandbox.

  </Step>
  <Step title="Optional: build the common image">
    Для функціональнішого образу sandbox із поширеними інструментами (наприклад `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Потім встановіть `agents.defaults.sandbox.docker.image` на `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

За замовчуванням контейнери sandbox Docker запускаються **без мережі**. Перевизначте це через `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Вбудований образ браузера sandbox також застосовує консервативні типові параметри запуску Chromium для контейнеризованих навантажень. Поточні типові параметри контейнера містять:

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
    - Три прапорці посилення графіки (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) є необов'язковими й корисні, коли контейнери не мають підтримки GPU. Установіть `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо вашому навантаженню потрібні WebGL або інші 3D/браузерні можливості.
    - `--disable-extensions` увімкнено за замовчуванням, і це можна вимкнути за допомогою `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для потоків, що залежать від розширень.
    - `--renderer-process-limit=2` керується `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає типовий параметр Chromium.

    Якщо вам потрібен інший профіль середовища виконання, використовуйте користувацький образ браузера й надайте власний entrypoint. Для локальних (неконтейнерних) профілів Chromium використовуйте `browser.extraArgs`, щоб додати додаткові прапорці запуску.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` заблоковано.
    - `network: "container:<id>"` заблоковано за замовчуванням (ризик обходу через приєднання до namespace).
    - Аварійне перевизначення: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Інсталяції Docker і контейнеризований Gateway описано тут: [Docker](/uk/install/docker)

Для розгортань Gateway у Docker `scripts/docker/setup.sh` може ініціалізувати конфігурацію sandbox. Установіть `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Ви можете перевизначити розташування сокета через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування й довідка щодо env: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` запускається **один раз** після створення контейнера sandbox (не під час кожного запуску). Він виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для агента: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Типове значення `docker.network` — `"none"` (без вихідного доступу), тому встановлення пакетів не вдасться.
    - `docker.network: "container:<id>"` потребує `dangerouslyAllowContainerNamespaceJoin: true` і призначене лише для аварійного випадку.
    - `readOnlyRoot: true` забороняє записи; установіть `readOnlyRoot: false` або вбудуйте користувацький образ.
    - `user` має бути root для встановлення пакетів (пропустіть `user` або встановіть `user: "0:0"`).
    - Exec у sandbox **не** успадковує `process.env` хоста. Використовуйте `agents.defaults.sandbox.docker.env` (або користувацький образ) для API-ключів Skills.

  </Accordion>
</AccordionGroup>

## Політика інструментів і аварійні виходи

Політики дозволу/заборони інструментів усе ще застосовуються до правил sandbox. Якщо інструмент заборонено глобально або для агента, sandbox не повертає його.

`tools.elevated` — це явний аварійний вихід, який запускає `exec` поза sandbox (`gateway` за замовчуванням або `node`, коли ціллю exec є `node`). Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються для сесії; щоб жорстко вимкнути `exec`, використовуйте заборону в політиці інструментів (див. [Sandbox проти політики інструментів проти підвищеного доступу](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб переглянути ефективний режим sandbox, політику інструментів і ключі конфігурації для виправлення.
- Див. [Sandbox проти політики інструментів проти підвищеного доступу](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб зрозуміти модель мислення "чому це заблоковано?".

Тримайте це заблокованим.

## Перевизначення для кількох агентів

Кожен агент може перевизначати sandbox + інструменти: `agents.list[].sandbox` і `agents.list[].tools` (а також `agents.list[].tools.sandbox.tools` для політики інструментів sandbox). Див. [Sandbox та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) щодо пріоритетності.

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

## Пов'язане

- [Мультиагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools) — перевизначення на рівні агента та пріоритетність
- [OpenShell](/uk/gateway/openshell) — налаштування керованого бекенда пісочниці, режими робочого простору та довідник конфігурації
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця проти політики інструментів проти підвищеного режиму](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження «чому це заблоковано?»
- [Безпека](/uk/gateway/security)
