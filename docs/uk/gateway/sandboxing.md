---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Як працює пісочниця OpenClaw: режими, області дії, доступ до робочого простору та зображення'
title: Ізоляція в пісочниці
x-i18n:
    generated_at: "2026-05-01T11:40:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw може запускати **інструменти всередині бекендів пісочниці**, щоб зменшити радіус ураження. Це **необов’язково** й контролюється конфігурацією (`agents.defaults.sandbox` або `agents.list[].sandbox`). Якщо пісочницю вимкнено, інструменти запускаються на хості. Gateway залишається на хості; виконання інструментів відбувається в ізольованій пісочниці, коли це увімкнено.

<Note>
Це не ідеальна межа безпеки, але вона суттєво обмежує доступ до файлової системи та процесів, коли модель робить щось нерозумне.
</Note>

## Що ізолюється в пісочниці

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий браузер у пісочниці (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - За замовчуванням браузер у пісочниці запускається автоматично (гарантує доступність CDP), коли він потрібен браузерному інструменту. Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - За замовчуванням контейнери браузера в пісочниці використовують окрему мережу Docker (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`. Налаштовується через `agents.defaults.sandbox.browser.network`.
    - Необов’язковий параметр `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний CDP-доступ на межі контейнера за допомогою списку дозволених CIDR (наприклад, `172.21.0.1/32`).
    - Доступ спостерігача noVNC за замовчуванням захищено паролем; OpenClaw видає короткочасний URL із токеном, який подає локальну сторінку початкового завантаження та відкриває noVNC із паролем у фрагменті URL (не в query/header logs).
    - `agents.defaults.sandbox.browser.allowHostControl` дозволяє сеансам у пісочниці явно цілитися в браузер хоста.
    - Необов’язкові списки дозволеного обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Не ізолюється в пісочниці:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено запускатися поза пісочницею (наприклад, `tools.elevated`).
  - **Підвищений `exec` обходить пісочницю та використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль `exec` — `node`).**
  - Якщо пісочницю вимкнено, `tools.elevated` не змінює виконання (воно вже на хості). Див. [Підвищений режим](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` контролює, **коли** використовується пісочниця:

<Tabs>
  <Tab title="off">
    Без пісочниці.
  </Tab>
  <Tab title="non-main">
    Ізолювати в пісочниці лише **неосновні** сеанси (типово, якщо ви хочете, щоб звичайні чати були на хості).

    `"non-main"` базується на `session.mainKey` (типово `"main"`), а не на ідентифікаторі агента. Групові/канальні сеанси використовують власні ключі, тому вони вважаються неосновними та будуть ізольовані в пісочниці.

  </Tab>
  <Tab title="all">
    Кожен сеанс запускається в пісочниці.
  </Tab>
</Tabs>

## Область

`agents.defaults.sandbox.scope` контролює, **скільки контейнерів** створюється:

- `"agent"` (за замовчуванням): один контейнер на агента.
- `"session"`: один контейнер на сеанс.
- `"shared"`: один контейнер, спільний для всіх сеансів у пісочниці.

## Бекенд

`agents.defaults.sandbox.backend` контролює, **яке середовище виконання** надає пісочницю:

- `"docker"` (за замовчуванням, коли пісочницю увімкнено): локальне середовище виконання пісочниці на базі Docker.
- `"ssh"`: загальне віддалене середовище виконання пісочниці на базі SSH.
- `"openshell"`: середовище виконання пісочниці на базі OpenShell.

Конфігурація, специфічна для SSH, міститься в `agents.defaults.sandbox.ssh`. Конфігурація, специфічна для OpenShell, міститься в `plugins.entries.openshell.config`.

### Вибір бекенда

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Де запускається** | Локальний контейнер              | Будь-який хост із доступом SSH | Керована пісочниця OpenShell                        |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH-ключ + цільовий хост       | Увімкнений Plugin OpenShell                         |
| **Модель workspace** | Bind-mount або копіювання       | Віддалено-канонічна (одноразове засівання) | `mirror` або `remote`                    |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell                              |
| **Пісочниця браузера** | Підтримується                 | Не підтримується               | Ще не підтримується                                 |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Найкраще для**    | Локальної розробки, повної ізоляції | Вивантаження на віддалену машину | Керованих віддалених пісочниць із необов’язковою двосторонньою синхронізацією |

### Бекенд Docker

Пісочницю за замовчуванням вимкнено. Якщо ви вмикаєте пісочницю й не вибираєте бекенд, OpenClaw використовує бекенд Docker. Він виконує інструменти та браузери пісочниці локально через сокет демона Docker (`/var/run/docker.sock`). Ізоляція контейнера пісочниці визначається просторами імен Docker.

Щоб надати Docker-пісочницям доступ до GPU хоста, задайте `agents.defaults.sandbox.docker.gpus` або перевизначення для окремого агента `agents.list[].sandbox.docker.gpus`. Значення передається до прапорця Docker `--gpus` як окремий аргумент, наприклад `"all"` або `"device=GPU-uuid"`, і потребує сумісного середовища виконання на хості, такого як NVIDIA Container Toolkit.

<Warning>
**Обмеження Docker-out-of-Docker (DooD)**

Якщо ви розгортаєте сам OpenClaw Gateway як контейнер Docker, він оркеструє сусідні контейнери пісочниці через Docker-сокет хоста (DooD). Це створює конкретне обмеження зіставлення шляхів:

- **Конфігурація потребує шляхів хоста**: конфігурація `workspace` в `openclaw.json` МАЄ містити **абсолютний шлях хоста** (наприклад, `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить демон Docker створити пісочницю, демон оцінює шляхи відносно простору імен ОС хоста, а не простору імен Gateway.
- **Паритет FS-моста (ідентична карта томів)**: нативний процес OpenClaw Gateway також записує файли Heartbeat і мосту до каталогу `workspace`. Оскільки Gateway оцінює той самий рядок (шлях хоста) зі свого власного контейнеризованого середовища, розгортання Gateway МАЄ містити ідентичну карту томів, яка нативно зв’язує простір імен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).

Якщо ви зіставляєте шляхи внутрішньо без паритету з абсолютним шляхом хоста, OpenClaw нативно викидає помилку дозволів `EACCES` під час спроби записати свій Heartbeat у контейнерному середовищі, бо повністю кваліфікований рядок шляху нативно не існує.
</Warning>

### Бекенд SSH

Використовуйте `backend: "ssh"`, коли хочете, щоб OpenClaw ізолював `exec`, файлові інструменти та читання медіа на довільній машині з доступом SSH.

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
    - Під час першого використання після створення або повторного створення OpenClaw один раз засіває цей віддалений workspace з локального workspace.
    - Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання медіа з підказок і підготовка вхідних медіа виконуються безпосередньо у віддаленому workspace через SSH.
    - OpenClaw не синхронізує віддалені зміни назад до локального workspace автоматично.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли та передають їх через конфігурацію OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: використовують вбудовані рядки або SecretRefs. OpenClaw розв’язує їх через звичайний snapshot середовища виконання секретів, записує їх у тимчасові файли з `0600` і видаляє їх після завершення SSH-сеансу.
    - Якщо для того самого елемента задано і `*File`, і `*Data`, у цьому SSH-сеансі перемагає `*Data`.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Це **віддалено-канонічна** модель. Віддалений SSH workspace стає реальним станом пісочниці після початкового засівання.

    - Локальні зміни на хості, зроблені поза OpenClaw після кроку засівання, не видно віддалено, доки ви не створите пісочницю повторно.
    - `openclaw sandbox recreate` видаляє віддалений корінь для кожної області й знову засіває з локального workspace під час наступного використання.
    - Пісочниця браузера не підтримується на бекенді SSH.
    - Налаштування `sandbox.docker.*` не застосовуються до бекенда SSH.

  </Accordion>
</AccordionGroup>

### Бекенд OpenShell

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw ізолював інструменти у віддаленому середовищі, керованому OpenShell. Повний посібник із налаштування, довідник конфігурації та порівняння режимів workspace див. на спеціальній [сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий базовий SSH-транспорт і віддалений міст файлової системи, що й загальний бекенд SSH, і додає життєвий цикл, специфічний для OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`), а також необов’язковий режим workspace `mirror`.

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

- `mirror` (за замовчуванням): локальний workspace залишається канонічним. OpenClaw синхронізує локальні файли в OpenShell перед `exec` і синхронізує віддалений workspace назад після `exec`.
- `remote`: workspace OpenShell є канонічним після створення пісочниці. OpenClaw один раз засіває віддалений workspace з локального workspace, а потім файлові інструменти й `exec` виконуються безпосередньо у віддаленій пісочниці без синхронізації змін назад.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw запитує в OpenShell SSH-конфігурацію, специфічну для пісочниці, через `openshell sandbox ssh-config <name>`.
    - Core записує цю SSH-конфігурацію в тимчасовий файл, відкриває SSH-сеанс і повторно використовує той самий віддалений міст файлової системи, що використовується `backend: "ssh"`.
    - Лише в режимі `mirror` відрізняється життєвий цикл: синхронізація з локального до віддаленого перед `exec`, потім синхронізація назад після `exec`.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - пісочниця браузера ще не підтримується
    - `sandbox.docker.binds` не підтримується на бекенді OpenShell
    - специфічні для Docker перемикачі середовища виконання в `sandbox.docker.*` і далі застосовуються лише до бекенда Docker

  </Accordion>
</AccordionGroup>

#### Режими workspace

OpenShell має дві моделі workspace. Саме ця частина найважливіша на практиці.

<Tabs>
  <Tab title="mirror (local canonical)">
    Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальний workspace залишався канонічним**.

    Поведінка:

    - Перед `exec` OpenClaw синхронізує локальний workspace у пісочницю OpenShell.
    - Після `exec` OpenClaw синхронізує віддалений workspace назад у локальний workspace.
    - Файлові інструменти й далі працюють через міст пісочниці, але локальний workspace залишається джерелом істини між ходами.

    Використовуйте це, коли:

    - ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з'являлися в пісочниці
    - ви хочете, щоб пісочниця OpenShell поводилася якомога ближче до бекенда Docker
    - ви хочете, щоб робоча область хоста відображала записи пісочниці після кожного кроку exec

    Компроміс: додаткові витрати синхронізації до та після exec.

  </Tab>
  <Tab title="remote (канонічний OpenShell)">
    Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб **робоча область OpenShell стала канонічною**.

    Поведінка:

    - Коли пісочницю створюють уперше, OpenClaw один раз засіває віддалену робочу область із локальної робочої області.
    - Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленою робочою областю OpenShell.
    - OpenClaw **не** синхронізує віддалені зміни назад у локальну робочу область після exec.
    - Зчитування медіа під час підготовки запиту все одно працює, бо файлові та медіаінструменти читають через міст пісочниці, а не припускають локальний шлях хоста.
    - Транспорт — SSH до пісочниці OpenShell, яку повертає `openshell sandbox ssh-config`.

    Важливі наслідки:

    - Якщо після кроку засівання ви редагуєте файли на хості поза OpenClaw, віддалена пісочниця **не** побачить ці зміни автоматично.
    - Якщо пісочницю створено повторно, віддалена робоча область знову засівається з локальної робочої області.
    - З `scope: "agent"` або `scope: "shared"` ця віддалена робоча область спільно використовується в тій самій області.

    Використовуйте це, коли:

    - пісочниця має існувати переважно на віддаленому боці OpenShell
    - ви хочете менших накладних витрат синхронізації на кожен крок
    - ви не хочете, щоб локальні зміни на хості непомітно перезаписували стан віддаленої пісочниці

  </Tab>
</Tabs>

Виберіть `mirror`, якщо вважаєте пісочницю тимчасовим середовищем виконання. Виберіть `remote`, якщо вважаєте пісочницю справжньою робочою областю.

#### Життєвий цикл OpenShell

Пісочниці OpenShell усе ще керуються через звичайний життєвий цикл пісочниці:

- `openclaw sandbox list` показує середовища виконання OpenShell, а також середовища виконання Docker
- `openclaw sandbox recreate` видаляє поточне середовище виконання й дає OpenClaw створити його повторно під час наступного використання
- логіка очищення також враховує бекенд

Для режиму `remote` повторне створення особливо важливе:

- повторне створення видаляє канонічну віддалену робочу область для цієї області
- наступне використання засіває свіжу віддалену робочу область із локальної робочої області

Для режиму `mirror` повторне створення переважно скидає віддалене середовище виконання, бо локальна робоча область усе одно лишається канонічною.

## Доступ до робочої області

`agents.defaults.sandbox.workspaceAccess` визначає **що може бачити пісочниця**:

<Tabs>
  <Tab title="none (за замовчуванням)">
    Інструменти бачать робочу область пісочниці в `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Монтує робочу область агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Монтує робочу область агента для читання й запису в `/workspace`.
  </Tab>
</Tabs>

З бекендом OpenShell:

- режим `mirror` усе ще використовує локальну робочу область як канонічне джерело між кроками exec
- режим `remote` використовує віддалену робочу область OpenShell як канонічне джерело після початкового засівання
- `workspaceAccess: "ro"` і `"none"` усе ще обмежують поведінку запису так само

Вхідні медіа копіюються в активну робочу область пісочниці (`media/inbound/*`).

<Note>
**Примітка щодо Skills:** інструмент `read` прив'язаний до кореня пісочниці. З `workspaceAccess: "none"` OpenClaw віддзеркалює відповідні Skills у робочу область пісочниці (`.../skills`), щоб їх можна було читати. З `"rw"` Skills робочої області можна читати з `/workspace/skills`.
</Note>

## Користувацькі bind-монтування

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер. Формат: `host:container:mode` (наприклад, `"/home/user/source:/source:rw"`).

Глобальні bind-монтування й bind-монтування для окремого агента **об'єднуються** (а не замінюються). За `scope: "shared"` bind-монтування для окремого агента ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **браузера пісочниці**.

- Коли задано (зокрема `[]`), це замінює `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Коли пропущено, контейнер браузера використовує `agents.defaults.sandbox.docker.binds` як запасний варіант (зворотна сумісність).

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

- Bind-монтування оминають файлову систему пісочниці: вони відкривають шляхи хоста з тим режимом, який ви задаєте (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind-монтувань (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські монтування, які могли б їх відкрити).
- OpenClaw також блокує поширені корені облікових даних у домашньому каталозі, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Перевірка bind-монтувань — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, а потім знову розв'язує його через найглибший наявний предок перед повторною перевіркою заблокованих шляхів і дозволених коренів.
- Це означає, що виходи через батьківський symlink усе одно безпечно відхиляються, навіть коли кінцевий листок ще не існує. Приклад: `/workspace/run-link/new-file` усе одно розв'язується як `/var/run/...`, якщо `run-link` вказує туди.
- Дозволені корені джерел канонікалізуються так само, тому шлях, який лише виглядає як такий, що перебуває в списку дозволених до розв'язання symlink, усе одно відхиляється як `outside allowed roots`.
- Чутливі монтування (секрети, ключі SSH, облікові дані сервісів) мають бути `:ro`, якщо інше не є абсолютно необхідним.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ до робочої області для читання; режими bind-монтувань залишаються незалежними.
- Див. [Пісочниця, політика інструментів і підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб дізнатися, як bind-монтування взаємодіють із політикою інструментів і підвищеним exec.

</Warning>

## Образи та налаштування

Стандартний образ Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Робоча копія з вихідним кодом порівняно з npm install**

Допоміжні скрипти `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` і `scripts/sandbox-browser-setup.sh` доступні лише під час запуску з [робочої копії з вихідним кодом](https://github.com/openclaw/openclaw). Вони не включені до пакета npm.

Якщо ви встановили OpenClaw через `npm install -g openclaw`, використовуйте наведені нижче вбудовані команди `docker build`.
</Note>

<Steps>
  <Step title="Зберіть стандартний образ">
    З робочої копії з вихідним кодом:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Після встановлення через npm (робоча копія з вихідним кодом не потрібна):

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

    Стандартний образ **не** містить Node. Якщо для Skills потрібен Node (або інші середовища виконання), або створіть власний образ, або встановіть через `sandbox.docker.setupCommand` (потребує вихідного мережевого доступу + кореня з правом запису + користувача root).

    OpenClaw не підставляє мовчки звичайний `debian:bookworm-slim`, коли `openclaw-sandbox:bookworm-slim` відсутній. Запуски пісочниці, націлені на стандартний образ, швидко завершуються помилкою з інструкцією зі збирання, доки ви його не зберете, бо вбудований образ містить `python3` для помічників write/edit у пісочниці.

  </Step>
  <Step title="Необов'язково: зберіть загальний образ">
    Для функціональнішого образу пісочниці зі звичними інструментами (наприклад, `curl`, `jq`, `nodejs`, `python3`, `git`):

    З робочої копії з вихідним кодом:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Після встановлення через npm спочатку зберіть стандартний образ (див. вище), а потім зберіть загальний образ поверх нього, використовуючи [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) з репозиторію.

    Потім задайте `agents.defaults.sandbox.docker.image` значення `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Необов'язково: зберіть образ браузера пісочниці">
    З робочої копії з вихідним кодом:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Після встановлення через npm зберіть, використовуючи [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) з репозиторію.

  </Step>
</Steps>

За замовчуванням контейнери пісочниці Docker працюють **без мережі**. Перевизначте це через `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Стандартні налаштування Chromium для браузера пісочниці">
    Вбудований образ браузера пісочниці також застосовує консервативні стандартні параметри запуску Chromium для контейнеризованих навантажень. Поточні стандартні параметри контейнера містять:

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
    - Три прапорці посилення графічної безпеки (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) необов'язкові й корисні, коли контейнери не мають підтримки GPU. Задайте `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо вашому навантаженню потрібні WebGL або інші 3D/браузерні функції.
    - `--disable-extensions` увімкнено за замовчуванням, і це можна вимкнути через `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для сценаріїв, що залежать від розширень.
    - `--renderer-process-limit=2` керується через `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає стандартне значення Chromium.

    Якщо вам потрібен інший профіль виконання, використовуйте власний образ браузера й надайте власну точку входу. Для локальних (неконтейнерних) профілів Chromium використовуйте `browser.extraArgs`, щоб додати додаткові прапорці запуску.

  </Accordion>
  <Accordion title="Стандартні налаштування мережевої безпеки">
    - `network: "host"` заблоковано.
    - `network: "container:<id>"` заблоковано за замовчуванням (ризик обходу через приєднання до простору імен).
    - Аварійне перевизначення: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Встановлення Docker і контейнеризований Gateway описано тут: [Docker](/uk/install/docker)

Для розгортань Gateway у Docker `scripts/docker/setup.sh` може початково налаштувати конфігурацію пісочниці. Задайте `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей варіант. Ви можете перевизначити розташування сокета через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування та довідка щодо змінних середовища: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` виконується **один раз** після створення контейнера пісочниці (а не під час кожного запуску). Вона виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для окремого агента: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Поширені помилки">
    - Стандартне значення `docker.network` — `"none"` (немає вихідного мережевого доступу), тому встановлення пакетів завершуватиметься помилкою.
    - `docker.network: "container:<id>"` потребує `dangerouslyAllowContainerNamespaceJoin: true` і призначений лише для аварійного використання.
    - `readOnlyRoot: true` забороняє запис; задайте `readOnlyRoot: false` або створіть власний образ.
    - `user` має бути root для встановлення пакетів (пропустіть `user` або задайте `user: "0:0"`).
    - exec у пісочниці **не** успадковує `process.env` хоста. Використовуйте `agents.defaults.sandbox.docker.env` (або власний образ) для ключів API Skills.

  </Accordion>
</AccordionGroup>

## Політика інструментів і аварійні механізми обходу

Політики дозволу/заборони інструментів усе одно застосовуються перед правилами пісочниці. Якщо інструмент заборонено глобально або для окремого агента, пісочниця не поверне його.

`tools.elevated` — це явний аварійний механізм обходу, який запускає `exec` поза пісочницею (`gateway` за замовчуванням або `node`, коли ціллю exec є `node`). Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються протягом сеансу; щоб жорстко вимкнути `exec`, використовуйте заборону в політиці інструментів (див. [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб перевірити ефективний режим пісочниці, політику інструментів і ключі конфігурації для виправлення.
- Див. [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальної моделі "чому це заблоковано?".

Тримайте систему під суворими обмеженнями.

## Перевизначення для кількох агентів

Кожен агент може перевизначати пісочницю + інструменти: `agents.list[].sandbox` і `agents.list[].tools` (а також `agents.list[].tools.sandbox.tools` для політики інструментів пісочниці). Див. [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) щодо пріоритету.

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
- [OpenShell](/uk/gateway/openshell) — налаштування керованого бекенда пісочниці, режими робочого простору та довідник конфігурації
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження "чому це заблоковано?"
- [Безпека](/uk/gateway/security)
