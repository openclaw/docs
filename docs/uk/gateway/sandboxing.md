---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Як працює ізоляція OpenClaw: режими, області, доступ до робочого простору та зображення'
title: Ізоляція в пісочниці
x-i18n:
    generated_at: "2026-05-03T11:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw може запускати **інструменти всередині бекендів пісочниці**, щоб зменшити радіус ураження. Це **необов’язково** й керується конфігурацією (`agents.defaults.sandbox` або `agents.list[].sandbox`). Якщо пісочницю вимкнено, інструменти запускаються на хості. Gateway залишається на хості; виконання інструментів запускається в ізольованій пісочниці, коли її ввімкнено.

<Note>
Це не ідеальна межа безпеки, але вона суттєво обмежує доступ до файлової системи та процесів, коли модель робить щось нерозумне.
</Note>

## Що потрапляє до пісочниці

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий браузер у пісочниці (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - За замовчуванням браузер у пісочниці запускається автоматично (забезпечує доступність CDP), коли він потрібен браузерному інструменту. Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - За замовчуванням контейнери браузера в пісочниці використовують виділену мережу Docker (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`. Налаштовується через `agents.defaults.sandbox.browser.network`.
    - Необов’язковий параметр `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний CDP-доступ на межі контейнера за допомогою CIDR-списку дозволених адрес (наприклад, `172.21.0.1/32`).
    - Доступ спостерігача noVNC за замовчуванням захищено паролем; OpenClaw видає короткочасну URL-адресу з токеном, яка відкриває локальну сторінку початкового завантаження та запускає noVNC із паролем у фрагменті URL (не в журналах запиту чи заголовків).
    - `agents.defaults.sandbox.browser.allowHostControl` дає змогу сеансам у пісочниці явно спрямовуватися на браузер хоста.
    - Необов’язкові списки дозволів обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Не потрапляє до пісочниці:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено запускатися поза пісочницею (наприклад, `tools.elevated`).
  - **Підвищений exec обходить пісочницю та використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).**
  - Якщо пісочницю вимкнено, `tools.elevated` не змінює виконання (воно вже відбувається на хості). Див. [Підвищений режим](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` керує тим, **коли** використовується пісочниця:

<Tabs>
  <Tab title="off">
    Без пісочниці.
  </Tab>
  <Tab title="non-main">
    Поміщати в пісочницю лише **неосновні** сеанси (стандартно, якщо ви хочете, щоб звичайні чати були на хості).

    `"non-main"` базується на `session.mainKey` (за замовчуванням `"main"`), а не на ідентифікаторі агента. Сеанси груп і каналів використовують власні ключі, тому вважаються неосновними й будуть поміщені в пісочницю.

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

- `"docker"` (за замовчуванням, коли пісочницю ввімкнено): локальне середовище пісочниці на основі Docker.
- `"ssh"`: універсальне віддалене середовище пісочниці на основі SSH.
- `"openshell"`: середовище пісочниці на основі OpenShell.

Конфігурація, специфічна для SSH, розташована в `agents.defaults.sandbox.ssh`. Конфігурація, специфічна для OpenShell, розташована в `plugins.entries.openshell.config`.

### Вибір бекенда

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Де запускається** | Локальний контейнер              | Будь-який хост із доступом SSH | Керована пісочниця OpenShell                        |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH-ключ + цільовий хост       | Увімкнений Plugin OpenShell                         |
| **Модель робочої області** | Bind-mount або копіювання | Віддалена канонічна (початкове заповнення один раз) | `mirror` або `remote`                   |
| **Керування мережею** | `docker.network` (за замовчуванням: немає) | Залежить від віддаленого хоста | Залежить від OpenShell                    |
| **Браузерна пісочниця** | Підтримується              | Не підтримується               | Поки не підтримується                               |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Найкраще для**    | Локальної розробки, повної ізоляції | Перенесення навантаження на віддалену машину | Керованих віддалених пісочниць із необов’язковою двосторонньою синхронізацією |

### Бекенд Docker

Пісочницю вимкнено за замовчуванням. Якщо ви вмикаєте пісочницю й не вибираєте бекенд, OpenClaw використовує бекенд Docker. Він виконує інструменти та браузери пісочниці локально через сокет демона Docker (`/var/run/docker.sock`). Ізоляція контейнера пісочниці визначається просторами імен Docker.

Щоб надати пісочницям Docker доступ до GPU хоста, задайте `agents.defaults.sandbox.docker.gpus` або перевизначення для окремого агента `agents.list[].sandbox.docker.gpus`. Значення передається прапорцю Docker `--gpus` як окремий аргумент, наприклад `"all"` або `"device=GPU-uuid"`, і потребує сумісного середовища виконання хоста, такого як NVIDIA Container Toolkit.

<Warning>
**Обмеження Docker-out-of-Docker (DooD)**

Якщо ви розгортаєте сам OpenClaw Gateway як контейнер Docker, він оркеструє сусідні контейнери пісочниці за допомогою Docker-сокета хоста (DooD). Це вводить конкретне обмеження зіставлення шляхів:

- **Конфігурація потребує шляхів хоста**: конфігурація `workspace` у `openclaw.json` ПОВИННА містити **абсолютний шлях хоста** (наприклад, `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить демон Docker створити пісочницю, демон оцінює шляхи відносно простору імен ОС хоста, а не простору імен Gateway.
- **Паритет FS-моста (ідентична мапа томів)**: нативний процес OpenClaw Gateway також записує файли Heartbeat і мосту до каталогу `workspace`. Оскільки Gateway оцінює той самий рядок (шлях хоста) зі свого власного контейнеризованого середовища, розгортання Gateway ПОВИННО містити ідентичну мапу томів, яка нативно пов’язує простір імен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).

Якщо ви зіставляєте шляхи внутрішньо без абсолютного паритету з хостом, OpenClaw нативно видає помилку дозволів `EACCES` під час спроби записати свій Heartbeat у контейнерному середовищі, бо повністю кваліфікований рядок шляху не існує нативно.
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
  <Accordion title="How it works">
    - OpenClaw створює віддалений корінь для кожної області в `sandbox.ssh.workspaceRoot`.
    - Під час першого використання після створення або повторного створення OpenClaw один раз заповнює цю віддалену робочу область із локальної робочої області.
    - Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання медіа для промптів і підготовка вхідних медіа виконуються безпосередньо з віддаленою робочою областю через SSH.
    - OpenClaw не синхронізує віддалені зміни назад до локальної робочої області автоматично.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: використовуйте наявні локальні файли й передавайте їх через конфігурацію OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: використовуйте вбудовані рядки або SecretRefs. OpenClaw розв’язує їх через звичайний знімок середовища виконання секретів, записує до тимчасових файлів із `0600` і видаляє, коли SSH-сеанс завершується.
    - Якщо для одного й того самого елемента задано і `*File`, і `*Data`, `*Data` має пріоритет для цього SSH-сеансу.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Це **віддалено-канонічна** модель. Після початкового заповнення віддалена робоча область SSH стає реальним станом пісочниці.

    - Локальні зміни на хості, зроблені поза OpenClaw після етапу заповнення, не видно віддалено, доки ви не створите пісочницю повторно.
    - `openclaw sandbox recreate` видаляє віддалений корінь для відповідної області й під час наступного використання знову заповнює його з локального стану.
    - Браузерна пісочниця не підтримується в бекенді SSH.
    - Налаштування `sandbox.docker.*` не застосовуються до бекенда SSH.

  </Accordion>
</AccordionGroup>

### Бекенд OpenShell

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw запускав інструменти в пісочниці у віддаленому середовищі, керованому OpenShell. Повний посібник із налаштування, довідник конфігурації та порівняння режимів робочої області дивіться на спеціальній [сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий базовий SSH-транспорт і віддалений міст файлової системи, що й універсальний бекенд SSH, і додає специфічний для OpenShell життєвий цикл (`sandbox create/get/delete`, `sandbox ssh-config`) плюс необов’язковий режим робочої області `mirror`.

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
- `remote`: робоча область OpenShell є канонічною після створення пісочниці. OpenClaw один раз заповнює віддалену робочу область із локальної робочої області, після чого файлові інструменти та exec виконуються безпосередньо з віддаленою пісочницею без синхронізації змін назад.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw запитує в OpenShell специфічну для пісочниці SSH-конфігурацію через `openshell sandbox ssh-config <name>`.
    - Core записує цю SSH-конфігурацію до тимчасового файла, відкриває SSH-сеанс і повторно використовує той самий віддалений міст файлової системи, що й `backend: "ssh"`.
    - У режимі `mirror` відрізняється лише життєвий цикл: синхронізація з локального середовища до віддаленого перед exec, а потім синхронізація назад після exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - браузерна пісочниця поки не підтримується
    - `sandbox.docker.binds` не підтримується в бекенді OpenShell
    - специфічні для Docker параметри середовища виконання в `sandbox.docker.*` усе ще застосовуються лише до бекенда Docker

  </Accordion>
</AccordionGroup>

#### Режими робочої області

OpenShell має дві моделі робочої області. Це найважливіша на практиці частина.

<Tabs>
  <Tab title="mirror (local canonical)">
    Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальна робоча область залишалася канонічною**.

    Поведінка:

    - Перед `exec` OpenClaw синхронізує локальну робочу область у пісочницю OpenShell.
    - Після `exec` OpenClaw синхронізує віддалену робочу область назад до локальної робочої області.
    - Файлові інструменти все одно працюють через міст пісочниці, але локальна робоча область залишається джерелом істини між ходами.

    Використовуйте це, коли:

    - ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з’являлися в sandbox
    - ви хочете, щоб sandbox OpenShell поводився максимально подібно до бекенда Docker
    - ви хочете, щоб робочий простір хоста відображав записи sandbox після кожного exec-кроку

    Компроміс: додаткові витрати на синхронізацію до й після exec.

  </Tab>
  <Tab title="віддалений (OpenShell канонічний)">
    Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете зробити **робочий простір OpenShell канонічним**.

    Поведінка:

    - Коли sandbox створюється вперше, OpenClaw один раз заповнює віддалений робочий простір із локального робочого простору.
    - Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленим робочим простором OpenShell.
    - OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір після exec.
    - Читання медіа під час формування prompt усе ще працює, бо файлові й медійні інструменти читають через міст sandbox, а не припускають локальний шлях хоста.
    - Transport — це SSH у sandbox OpenShell, повернений `openshell sandbox ssh-config`.

    Важливі наслідки:

    - Якщо після кроку початкового заповнення ви редагуєте файли на хості поза OpenClaw, віддалений sandbox **не** побачить ці зміни автоматично.
    - Якщо sandbox буде створено заново, віддалений робочий простір знову заповнюється з локального робочого простору.
    - З `scope: "agent"` або `scope: "shared"` цей віддалений робочий простір спільно використовується в тій самій області.

    Використовуйте це, коли:

    - sandbox має існувати переважно на віддаленому боці OpenShell
    - ви хочете зменшити витрати на синхронізацію для кожного кроку
    - ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox

  </Tab>
</Tabs>

Виберіть `mirror`, якщо сприймаєте sandbox як тимчасове середовище виконання. Виберіть `remote`, якщо сприймаєте sandbox як справжній робочий простір.

#### Життєвий цикл OpenShell

Sandbox OpenShell усе ще керуються через звичайний життєвий цикл sandbox:

- `openclaw sandbox list` показує runtime OpenShell, а також runtime Docker
- `openclaw sandbox recreate` видаляє поточний runtime і дає OpenClaw створити його заново під час наступного використання
- логіка prune також враховує бекенд

Для режиму `remote` повторне створення особливо важливе:

- recreate видаляє канонічний віддалений робочий простір для цієї області
- наступне використання заповнює свіжий віддалений робочий простір із локального робочого простору

Для режиму `mirror` повторне створення переважно скидає віддалене середовище виконання, бо локальний робочий простір однаково лишається канонічним.

## Доступ до робочого простору

`agents.defaults.sandbox.workspaceAccess` керує тим, **що sandbox може бачити**:

<Tabs>
  <Tab title="немає (типово)">
    Інструменти бачать робочий простір sandbox у `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Монтує робочий простір агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Монтує робочий простір агента для читання/запису в `/workspace`.
  </Tab>
</Tabs>

З бекендом OpenShell:

- режим `mirror` усе ще використовує локальний робочий простір як канонічне джерело між exec-кроками
- режим `remote` використовує віддалений робочий простір OpenShell як канонічне джерело після початкового заповнення
- `workspaceAccess: "ro"` і `"none"` усе ще обмежують поведінку запису так само

Вхідні медіа копіюються в активний робочий простір sandbox (`media/inbound/*`).

<Note>
**Примітка щодо Skills:** інструмент `read` прив’язаний до кореня sandbox. З `workspaceAccess: "none"` OpenClaw дзеркалить придатні skills у робочий простір sandbox (`.../skills`), щоб їх можна було прочитати. З `"rw"` skills робочого простору доступні для читання з `/workspace/skills`.
</Note>

## Власні bind-монтування

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер. Формат: `host:container:mode` (наприклад, `"/home/user/source:/source:rw"`).

Глобальні й агентні binds **об’єднуються** (а не замінюються). За `scope: "shared"` агентні binds ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **браузера sandbox**.

- Коли задано (включно з `[]`), це замінює `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Коли пропущено, контейнер браузера повертається до `agents.defaults.sandbox.docker.binds` (зворотна сумісність).

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

- Binds обходять файлову систему sandbox: вони відкривають шляхи хоста з режимом, який ви задаєте (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind-монтувань (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські монтування, які відкрили б до них доступ).
- OpenClaw також блокує поширені корені облікових даних у домашньому каталозі, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Перевірка bind-монтувань — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, а потім знову розв’язує його через найглибшого наявного предка, перш ніж повторно перевірити заблоковані шляхи й дозволені корені.
- Це означає, що виходи через батьківський symlink усе одно закриваються з відмовою, навіть коли кінцевий листок ще не існує. Приклад: `/workspace/run-link/new-file` усе ще розв’язується як `/var/run/...`, якщо `run-link` вказує туди.
- Дозволені корені джерел канонікалізуються так само, тому шлях, який виглядає всередині allowlist лише до розв’язання symlink, усе одно відхиляється як `outside allowed roots`.
- Чутливі монтування (секрети, SSH-ключі, облікові дані сервісів) мають бути `:ro`, якщо інше не є абсолютно необхідним.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ для читання до робочого простору; режими bind лишаються незалежними.
- Див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб дізнатися, як binds взаємодіють із політикою інструментів і elevated exec.

</Warning>

## Образи й налаштування

Типовий образ Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout порівняно з npm install**

Допоміжні скрипти `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` і `scripts/sandbox-browser-setup.sh` доступні лише під час запуску з [source checkout](https://github.com/openclaw/openclaw). Вони не входять до пакета npm.

Якщо ви встановили OpenClaw через `npm install -g openclaw`, використовуйте наведені нижче inline-команди `docker build`.
</Note>

<Steps>
  <Step title="Зберіть типовий образ">
    Із source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    З npm install (source checkout не потрібен):

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

    Типовий образ **не** містить Node. Якщо skill потребує Node (або інших runtime), або вбудуйте власний образ, або встановіть через `sandbox.docker.setupCommand` (потрібні вихід у мережу + записуваний root + root-користувач).

    OpenClaw не підставляє непомітно звичайний `debian:bookworm-slim`, коли `openclaw-sandbox:bookworm-slim` відсутній. Запуски sandbox, які націлені на типовий образ, швидко завершуються з інструкцією зі збирання, доки ви його не зберете, бо вбудований образ містить `python3` для допоміжних засобів запису/редагування sandbox.

  </Step>
  <Step title="Необов’язково: зберіть common-образ">
    Для функціональнішого образу sandbox із поширеними інструментами (наприклад `curl`, `jq`, `nodejs`, `python3`, `git`):

    Із source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    З npm install спершу зберіть типовий образ (див. вище), а потім зберіть common-образ поверх нього, використовуючи [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) з репозиторію.

    Потім задайте `agents.defaults.sandbox.docker.image` як `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Необов’язково: зберіть образ браузера sandbox">
    Із source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    З npm install зберіть за допомогою [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) з репозиторію.

  </Step>
</Steps>

За замовчуванням контейнери Docker sandbox працюють **без мережі**. Перевизначте це через `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Типові налаштування Chromium для браузера sandbox">
    Вбудований образ браузера sandbox також застосовує консервативні стартові налаштування Chromium для контейнеризованих навантажень. Поточні типові налаштування контейнера включають:

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
    - Три прапорці посилення графічної безпеки (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) необов’язкові й корисні, коли контейнери не мають підтримки GPU. Задайте `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо ваше навантаження потребує WebGL або інших 3D/браузерних можливостей.
    - `--disable-extensions` увімкнено за замовчуванням, і це можна вимкнути через `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для потоків, які залежать від розширень.
    - `--renderer-process-limit=2` керується `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає типове значення Chromium.

    Якщо вам потрібен інший профіль runtime, використайте власний образ браузера й надайте власний entrypoint. Для локальних (неконтейнерних) профілів Chromium використовуйте `browser.extraArgs`, щоб додати додаткові стартові прапорці.

  </Accordion>
  <Accordion title="Типові налаштування безпеки мережі">
    - `network: "host"` заблоковано.
    - `network: "container:<id>"` заблоковано за замовчуванням (ризик обходу через приєднання namespace).
    - Аварійне перевизначення: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Встановлення Docker і контейнеризований Gateway описані тут: [Docker](/uk/install/docker)

Для розгортань Docker gateway `scripts/docker/setup.sh` може початково налаштувати конфігурацію sandbox. Задайте `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Ви можете перевизначити розташування socket через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування й довідка щодо env: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` виконується **один раз** після створення контейнера sandbox (не під час кожного запуску). Він виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для агента: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Типові пастки">
    - Стандартне значення `docker.network` — `"none"` (без вихідного доступу), тому встановлення пакетів не вдасться.
    - `docker.network: "container:<id>"` потребує `dangerouslyAllowContainerNamespaceJoin: true` і призначений лише для аварійних випадків.
    - `readOnlyRoot: true` забороняє записи; установіть `readOnlyRoot: false` або зберіть власний образ.
    - Для встановлення пакетів `user` має бути root (пропустіть `user` або встановіть `user: "0:0"`).
    - Sandbox exec **не** успадковує `process.env` хоста. Використовуйте `agents.defaults.sandbox.docker.env` (або власний образ) для API-ключів Skills.

  </Accordion>
</AccordionGroup>

## Політика інструментів і аварійні обходи

Політики дозволу/заборони інструментів усе ще застосовуються перед правилами пісочниці. Якщо інструмент заборонено глобально або для окремого агента, пісочниця не повертає його.

`tools.elevated` — це явний аварійний обхід, який запускає `exec` поза пісочницею (`gateway` за замовчуванням або `node`, коли ціль exec — `node`). Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються в межах сеансу; щоб жорстко вимкнути `exec`, використовуйте заборону в політиці інструментів (див. [Пісочниця vs Політика інструментів vs Підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб перевірити ефективний режим пісочниці, політику інструментів і ключі конфігурації для виправлення.
- Див. [Пісочниця vs Політика інструментів vs Підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальної моделі "чому це заблоковано?".

Тримайте це максимально обмеженим.

## Перевизначення для кількох агентів

Кожен агент може перевизначати пісочницю та інструменти: `agents.list[].sandbox` і `agents.list[].tools` (плюс `agents.list[].tools.sandbox.tools` для політики інструментів пісочниці). Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) щодо пріоритету.

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

- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) — перевизначення для окремих агентів і пріоритет
- [OpenShell](/uk/gateway/openshell) — налаштування керованого бекенду пісочниці, режими робочого простору та довідник конфігурації
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця vs Політика інструментів vs Підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження "чому це заблоковано?"
- [Безпека](/uk/gateway/security)
