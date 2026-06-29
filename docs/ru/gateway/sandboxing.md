---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Как работает песочница OpenClaw: режимы, области, доступ к рабочей области и образы'
title: Песочница
x-i18n:
    generated_at: "2026-06-28T22:59:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw может запускать **инструменты внутри бэкендов песочницы**, чтобы уменьшить область потенциального ущерба. Это **необязательно** и управляется конфигурацией (`agents.defaults.sandbox` или `agents.list[].sandbox`). Если песочница отключена, инструменты запускаются на хосте. Gateway остается на хосте; выполнение инструментов при включении запускается в изолированной песочнице.

<Note>
Это не идеальная граница безопасности, но она существенно ограничивает доступ к файловой системе и процессам, когда модель делает что-то неудачное.
</Note>

## Что помещается в песочницу

- Выполнение инструментов (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` и т. д.).
- Необязательный браузер в песочнице (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - По умолчанию браузер в песочнице запускается автоматически (гарантирует доступность CDP), когда он нужен инструменту браузера. Настраивается через `agents.defaults.sandbox.browser.autoStart` и `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - По умолчанию контейнеры браузера в песочнице используют выделенную сеть Docker (`openclaw-sandbox-browser`) вместо глобальной сети `bridge`. Настраивается через `agents.defaults.sandbox.browser.network`.
    - Необязательный параметр `agents.defaults.sandbox.browser.cdpSourceRange` ограничивает входящий CDP-доступ на границе контейнера с помощью CIDR-allowlist (например, `172.21.0.1/32`).
    - Доступ наблюдателя noVNC по умолчанию защищен паролем; OpenClaw выдает короткоживущий URL с токеном, который отдает локальную страницу начальной загрузки и открывает noVNC с паролем во фрагменте URL (не в query/header logs).
    - `agents.defaults.sandbox.browser.allowHostControl` позволяет сессиям в песочнице явно обращаться к браузеру хоста.
    - Необязательные allowlist ограничивают `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Не помещается в песочницу:

- Сам процесс Gateway.
- Любой инструмент, которому явно разрешено запускаться вне песочницы (например, `tools.elevated`).
  - **Elevated exec обходит песочницу и использует настроенный путь выхода (`gateway` по умолчанию или `node`, когда цель exec — `node`).**
  - Если песочница отключена, `tools.elevated` не меняет выполнение (оно уже на хосте). См. [Elevated Mode](/ru/tools/elevated).

## Режимы

`agents.defaults.sandbox.mode` управляет тем, **когда** используется песочница:

<Tabs>
  <Tab title="off">
    Без песочницы.
  </Tab>
  <Tab title="non-main">
    Помещать в песочницу только **неосновные** сессии (по умолчанию, если вы хотите, чтобы обычные чаты выполнялись на хосте).

    `"non-main"` основан на `session.mainKey` (по умолчанию `"main"`), а не на id агента. Групповые/канальные сессии используют собственные ключи, поэтому считаются неосновными и будут помещены в песочницу.

  </Tab>
  <Tab title="all">
    Каждая сессия запускается в песочнице.
  </Tab>
</Tabs>

## Область действия

`agents.defaults.sandbox.scope` управляет тем, **сколько контейнеров** создается:

- `"agent"` (по умолчанию): один контейнер на агента.
- `"session"`: один контейнер на сессию.
- `"shared"`: один контейнер, общий для всех сессий в песочнице.

## Бэкенд

`agents.defaults.sandbox.backend` управляет тем, **какая среда выполнения** предоставляет песочницу:

- `"docker"` (по умолчанию, когда песочница включена): локальная среда выполнения песочницы на базе Docker.
- `"ssh"`: универсальная удаленная среда выполнения песочницы на базе SSH.
- `"openshell"`: среда выполнения песочницы на базе OpenShell.

Конфигурация, специфичная для SSH, находится в `agents.defaults.sandbox.ssh`. Конфигурация, специфичная для OpenShell, находится в `plugins.entries.openshell.config`.

### Выбор бэкенда

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Где запускается** | Локальный контейнер              | Любой хост с доступом по SSH   | Управляемая песочница OpenShell                     |
| **Настройка**       | `scripts/sandbox-setup.sh`       | SSH-ключ + целевой хост        | Plugin OpenShell включен                            |
| **Модель workspace** | Bind-mount или копирование      | Удаленно-каноническая (однократное заполнение) | `mirror` или `remote`                 |
| **Контроль сети**   | `docker.network` (по умолчанию: none) | Зависит от удаленного хоста | Зависит от OpenShell                                |
| **Песочница браузера** | Поддерживается                | Не поддерживается              | Пока не поддерживается                              |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Лучше всего для** | Локальной разработки, полной изоляции | Переноса нагрузки на удаленную машину | Управляемых удаленных песочниц с необязательной двусторонней синхронизацией |

### Бэкенд Docker

Песочница по умолчанию отключена. Если вы включаете песочницу и не выбираете бэкенд, OpenClaw использует бэкенд Docker. Он выполняет инструменты и браузеры в песочнице локально через сокет демона Docker (`/var/run/docker.sock`). Изоляция контейнера песочницы определяется пространствами имен Docker.

Чтобы предоставить GPU хоста песочницам Docker, задайте `agents.defaults.sandbox.docker.gpus` или переопределение на уровне агента `agents.list[].sandbox.docker.gpus`. Значение передается флагу Docker `--gpus` как отдельный аргумент, например `"all"` или `"device=GPU-uuid"`, и требует совместимой среды выполнения хоста, такой как NVIDIA Container Toolkit.

<Warning>
**Ограничения Docker-out-of-Docker (DooD)**

Если вы разворачиваете сам OpenClaw Gateway как контейнер Docker, он управляет соседними контейнерами песочницы с помощью Docker-сокета хоста (DooD). Это вводит особое ограничение сопоставления путей:

- **Конфигурация требует пути хоста**: конфигурация `workspace` в `openclaw.json` ДОЛЖНА содержать **абсолютный путь хоста** (например, `/home/user/.openclaw/workspaces`), а не внутренний путь контейнера Gateway. Когда OpenClaw просит демон Docker создать песочницу, демон оценивает пути относительно пространства имен ОС хоста, а не пространства имен Gateway.
- **Паритет FS bridge (идентичная карта томов)**: нативный процесс OpenClaw Gateway также записывает heartbeat- и bridge-файлы в каталог `workspace`. Поскольку Gateway оценивает точно ту же строку (путь хоста) из собственной контейнеризованной среды, развертывание Gateway ДОЛЖНО включать идентичную карту томов, нативно связывающую пространство имен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Codex code mode**: когда активна песочница OpenClaw, OpenClaw отключает нативный Code Mode app-server Codex, пользовательские MCP-серверы и выполнение Plugin на базе приложения для этого хода, потому что эти нативные поверхности запускаются из процесса app-server на хосте Gateway, а не из бэкенда песочницы OpenClaw. Доступ к shell предоставляется через инструменты OpenClaw на базе песочницы, такие как `sandbox_exec` и `sandbox_process`, когда доступны обычные инструменты exec/process. Не монтируйте Docker-сокет хоста в контейнеры песочницы агента или пользовательские песочницы Codex.

На хостах Ubuntu/AppArmor Codex `workspace-write` может завершиться с ошибкой до запуска shell,
когда вы намеренно запускаете нативный Codex `workspace-write` без активной
песочницы OpenClaw и сервисному пользователю не разрешено создавать непривилегированные
пространства имен пользователя. Когда исходящий трафик песочницы Docker отключен (`network: "none"`,
по умолчанию), Codex также требуется непривилегированное сетевое пространство имен. Типичные симптомы:
`bwrap: setting up uid map: Permission denied` и
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Запустите
`openclaw doctor`; если он сообщает о сбое проверки пространства имен Codex bwrap, предпочтите
профиль AppArmor, который предоставляет требуемые пространства имен сервисному
процессу OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` — это общесистемный
fallback для хоста с компромиссами безопасности; используйте его только тогда, когда такая позиция хоста
приемлема.

Если вы сопоставляете пути внутри без абсолютного паритета с хостом, OpenClaw нативно выбрасывает ошибку разрешений `EACCES` при попытке записать свой heartbeat внутри среды контейнера, потому что полностью определенная строка пути нативно не существует.
</Warning>

### Бэкенд SSH

Используйте `backend: "ssh"`, когда хотите, чтобы OpenClaw помещал `exec`, файловые инструменты и чтение медиа в песочницу на произвольной машине с доступом по SSH.

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
    - OpenClaw создает удаленный корень для каждой области действия в `sandbox.ssh.workspaceRoot`.
    - При первом использовании после создания или пересоздания OpenClaw один раз заполняет этот удаленный workspace из локального workspace.
    - После этого `exec`, `read`, `write`, `edit`, `apply_patch`, чтение медиа из prompt и подготовка входящих медиа выполняются напрямую с удаленным workspace через SSH.
    - OpenClaw не синхронизирует удаленные изменения обратно в локальный workspace автоматически.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: используют существующие локальные файлы и передают их через конфигурацию OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: используют встроенные строки или SecretRefs. OpenClaw разрешает их через обычный snapshot среды выполнения секретов, записывает во временные файлы с `0600` и удаляет их по завершении SSH-сессии.
    - Если для одного и того же элемента заданы и `*File`, и `*Data`, для этой SSH-сессии побеждает `*Data`.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Это **удаленно-каноническая** модель. Удаленный SSH workspace становится реальным состоянием песочницы после начального заполнения.

    - Локальные изменения на хосте, сделанные вне OpenClaw после шага заполнения, не видны удаленно до пересоздания песочницы.
    - `openclaw sandbox recreate` удаляет удаленный корень для каждой области действия и при следующем использовании снова заполняет его из локального workspace.
    - Песочница браузера не поддерживается на бэкенде SSH.
    - Настройки `sandbox.docker.*` не применяются к бэкенду SSH.

  </Accordion>
</AccordionGroup>

### Бэкенд OpenShell

Используйте `backend: "openshell"`, когда хотите, чтобы OpenClaw помещал инструменты в песочницу в удаленной среде, управляемой OpenShell. Полное руководство по настройке, справочник конфигурации и сравнение режимов workspace см. на отдельной [странице OpenShell](/ru/gateway/openshell).

OpenShell повторно использует тот же основной SSH-транспорт и мост удаленной файловой системы, что и универсальный бэкенд SSH, и добавляет специфичный для OpenShell жизненный цикл (`sandbox create/get/delete`, `sandbox ssh-config`) плюс необязательный режим workspace `mirror`.

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

Режимы OpenShell:

- `mirror` (по умолчанию): локальный workspace остается каноническим. OpenClaw синхронизирует локальные файлы в OpenShell перед exec и синхронизирует удаленный workspace обратно после exec.
- `remote`: workspace OpenShell становится каноническим после создания песочницы. OpenClaw один раз заполняет удаленный workspace из локального workspace, затем файловые инструменты и exec выполняются напрямую с удаленной песочницей без синхронизации изменений обратно.

<AccordionGroup>
  <Accordion title="Сведения об удаленном транспорте">
    - OpenClaw запрашивает у OpenShell SSH-конфигурацию для конкретной песочницы через `openshell sandbox ssh-config <name>`.
    - Ядро записывает эту SSH-конфигурацию во временный файл, открывает SSH-сеанс и повторно использует тот же удаленный мост файловой системы, который используется `backend: "ssh"`.
    - В режиме `mirror` отличается только жизненный цикл: синхронизация локального состояния с удаленным перед exec, затем обратная синхронизация после exec.

  </Accordion>
  <Accordion title="Текущие ограничения OpenShell">
    - браузер песочницы пока не поддерживается
    - `sandbox.docker.binds` не поддерживается в бэкенде OpenShell
    - параметры времени выполнения, специфичные для Docker, в `sandbox.docker.*` по-прежнему применяются только к бэкенду Docker

  </Accordion>
</AccordionGroup>

#### Режимы рабочей области

У OpenShell есть две модели рабочей области. На практике это самая важная часть.

<Tabs>
  <Tab title="mirror (локальная каноническая)">
    Используйте `plugins.entries.openshell.config.mode: "mirror"`, если хотите, чтобы **локальная рабочая область оставалась канонической**.

    Поведение:

    - Перед `exec` OpenClaw синхронизирует локальную рабочую область с песочницей OpenShell.
    - После `exec` OpenClaw синхронизирует удаленную рабочую область обратно с локальной рабочей областью.
    - Файловые инструменты по-прежнему работают через мост песочницы, но локальная рабочая область остается источником истины между ходами.

    Используйте это, когда:

    - вы редактируете файлы локально вне OpenClaw и хотите, чтобы эти изменения автоматически появлялись в песочнице
    - вы хотите, чтобы песочница OpenShell вела себя как можно ближе к бэкенду Docker
    - вы хотите, чтобы рабочая область хоста отражала записи песочницы после каждого хода exec

    Компромисс: дополнительные затраты на синхронизацию до и после exec.

  </Tab>
  <Tab title="remote (каноническая OpenShell)">
    Используйте `plugins.entries.openshell.config.mode: "remote"`, если хотите, чтобы **рабочая область OpenShell стала канонической**.

    Поведение:

    - При первом создании песочницы OpenClaw один раз заполняет удаленную рабочую область из локальной рабочей области.
    - После этого `exec`, `read`, `write`, `edit` и `apply_patch` работают напрямую с удаленной рабочей областью OpenShell.
    - OpenClaw **не** синхронизирует удаленные изменения обратно в локальную рабочую область после exec.
    - Чтение медиа во время формирования промпта по-прежнему работает, потому что файловые и медиа-инструменты читают через мост песочницы, а не предполагают локальный путь хоста.
    - Транспортом служит SSH в песочницу OpenShell, возвращенную `openshell sandbox ssh-config`.

    Важные последствия:

    - Если после шага начального заполнения вы редактируете файлы на хосте вне OpenClaw, удаленная песочница **не** увидит эти изменения автоматически.
    - Если песочница создается заново, удаленная рабочая область снова заполняется из локальной рабочей области.
    - С `scope: "agent"` или `scope: "shared"` эта удаленная рабочая область совместно используется в той же области действия.

    Используйте это, когда:

    - песочница должна в основном жить на удаленной стороне OpenShell
    - вы хотите снизить накладные расходы на синхронизацию для каждого хода
    - вы не хотите, чтобы локальные правки хоста незаметно перезаписывали состояние удаленной песочницы

  </Tab>
</Tabs>

Выберите `mirror`, если считаете песочницу временной средой выполнения. Выберите `remote`, если считаете песочницу настоящей рабочей областью.

#### Жизненный цикл OpenShell

Песочницы OpenShell по-прежнему управляются через обычный жизненный цикл песочницы:

- `openclaw sandbox list` показывает как среды выполнения OpenShell, так и среды выполнения Docker
- `openclaw sandbox recreate` удаляет текущую среду выполнения и позволяет OpenClaw создать ее заново при следующем использовании
- логика очистки также учитывает бэкенд

Для режима `remote` повторное создание особенно важно:

- повторное создание удаляет каноническую удаленную рабочую область для этой области действия
- следующее использование заполняет свежую удаленную рабочую область из локальной рабочей области

Для режима `mirror` повторное создание в основном сбрасывает удаленную среду выполнения, потому что локальная рабочая область все равно остается канонической.

## Доступ к рабочей области

`agents.defaults.sandbox.workspaceAccess` управляет тем, **что песочница может видеть**:

<Tabs>
  <Tab title="none (по умолчанию)">
    Инструменты видят рабочую область песочницы в `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Монтирует рабочую область агента только для чтения в `/agent` (отключает `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Монтирует рабочую область агента для чтения и записи в `/workspace`.
  </Tab>
</Tabs>

С бэкендом OpenShell:

- режим `mirror` по-прежнему использует локальную рабочую область как канонический источник между ходами exec
- режим `remote` использует удаленную рабочую область OpenShell как канонический источник после начального заполнения
- `workspaceAccess: "ro"` и `"none"` по-прежнему ограничивают поведение записи тем же образом

Входящие медиа копируются в активную рабочую область песочницы (`media/inbound/*`).

<Note>
**Примечание о Skills:** инструмент `read` привязан к корню песочницы. С `workspaceAccess: "none"` OpenClaw зеркалирует подходящие skills в рабочую область песочницы (`.../skills`), чтобы их можно было читать. С `"rw"` skills рабочей области доступны для чтения из `/workspace/skills`, а подходящие управляемые, встроенные или plugin skills материализуются в сгенерированный путь только для чтения `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Пользовательские bind-монтирования

`agents.defaults.sandbox.docker.binds` монтирует дополнительные каталоги хоста в контейнер. Формат: `host:container:mode` (например, `"/home/user/source:/source:rw"`).

Глобальные и агентные bind-монтирования **объединяются** (а не заменяются). При `scope: "shared"` агентные bind-монтирования игнорируются.

`agents.defaults.sandbox.browser.binds` монтирует дополнительные каталоги хоста только в контейнер **браузера песочницы**.

- Если задано (включая `[]`), это заменяет `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Если не указано, контейнер браузера откатывается к `agents.defaults.sandbox.docker.binds` (обратно совместимо).

Пример (источник только для чтения + дополнительный каталог данных):

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
**Безопасность bind-монтирований**

- Bind-монтирования обходят файловую систему песочницы: они открывают пути хоста с тем режимом, который вы задаете (`:ro` или `:rw`).
- OpenClaw блокирует опасные источники bind-монтирований (например: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` и родительские монтирования, которые могли бы их открыть).
- OpenClaw также блокирует распространенные корневые каталоги учетных данных в домашнем каталоге, такие как `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` и `~/.ssh`.
- Проверка bind-монтирований не сводится к сопоставлению строк. OpenClaw нормализует исходный путь, затем снова разрешает его через самый глубокий существующий предок перед повторной проверкой заблокированных путей и разрешенных корней.
- Это означает, что выходы через родительские символические ссылки по-прежнему закрываются отказом, даже если конечный лист еще не существует. Пример: `/workspace/run-link/new-file` по-прежнему разрешается как `/var/run/...`, если `run-link` указывает туда.
- Разрешенные исходные корни канонизируются тем же способом, поэтому путь, который выглядит находящимся внутри списка разрешений только до разрешения символических ссылок, все равно отклоняется как `outside allowed roots`.
- Чувствительные монтирования (секреты, SSH-ключи, учетные данные сервисов) должны быть `:ro`, если иное не является строго необходимым.
- Сочетайте с `workspaceAccess: "ro"`, если вам нужен только доступ на чтение к рабочей области; режимы bind-монтирований остаются независимыми.
- См. [Песочница, политика инструментов и повышенные права](/ru/gateway/sandbox-vs-tool-policy-vs-elevated), чтобы узнать, как bind-монтирования взаимодействуют с политикой инструментов и elevated exec.

</Warning>

## Образы и настройка

Образ Docker по умолчанию: `openclaw-sandbox:bookworm-slim`

<Note>
**Исходный checkout и установка npm**

Вспомогательные скрипты `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` и `scripts/sandbox-browser-setup.sh` доступны только при запуске из [исходного checkout](https://github.com/openclaw/openclaw). Они не включены в пакет npm.

Если вы установили OpenClaw через `npm install -g openclaw`, используйте приведенные ниже встроенные команды `docker build`.
</Note>

<Steps>
  <Step title="Соберите образ по умолчанию">
    Из исходного checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Из установки npm (исходный checkout не нужен):

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

    Образ по умолчанию **не** включает Node. Если Skill требуется Node (или другие среды выполнения), либо встроите собственный образ, либо установите через `sandbox.docker.setupCommand` (требуется исходящий сетевой доступ + записываемый корень + пользователь root).

    OpenClaw не подставляет незаметно обычный `debian:bookworm-slim`, когда `openclaw-sandbox:bookworm-slim` отсутствует. Запуски песочницы, нацеленные на образ по умолчанию, быстро завершаются ошибкой с инструкцией по сборке, пока вы его не соберете, потому что встроенный образ содержит `python3` для вспомогательных средств записи/редактирования в песочнице.

  </Step>
  <Step title="Необязательно: соберите общий образ">
    Для более функционального образа песочницы с распространенными инструментами (например, `curl`, `jq`, Node 24, pnpm, `python3` и `git`):

    Из исходного checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Из установки npm сначала соберите образ по умолчанию (см. выше), затем соберите общий образ поверх него, используя [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) из репозитория.

    Затем задайте `agents.defaults.sandbox.docker.image` значение `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Необязательно: соберите образ браузера песочницы">
    Из исходного checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Из установки npm соберите образ с использованием [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) из репозитория.

  </Step>
</Steps>

По умолчанию контейнеры песочницы Docker запускаются **без сети**. Переопределите это с помощью `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Значения Chromium по умолчанию для браузера песочницы">
    Встроенный образ браузера песочницы также применяет консервативные стартовые параметры Chromium для контейнеризированных рабочих нагрузок. Текущие значения контейнера по умолчанию включают:

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
    - `--no-sandbox`, когда включен `noSandbox`.
    - Три флага усиления графической безопасности (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) необязательны и полезны, когда контейнеры не имеют поддержки GPU. Задайте `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, если вашей рабочей нагрузке требуется WebGL или другие возможности 3D/браузера.
    - `--disable-extensions` включен по умолчанию и может быть отключен с помощью `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для потоков, зависящих от расширений.
    - `--renderer-process-limit=2` управляется через `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, где `0` сохраняет значение Chromium по умолчанию.

    Если вам нужен другой профиль времени выполнения, используйте пользовательский образ браузера и предоставьте собственную точку входа. Для локальных (неконтейнерных) профилей Chromium используйте `browser.extraArgs`, чтобы добавить дополнительные стартовые флаги.

  </Accordion>
  <Accordion title="Сетевые настройки безопасности по умолчанию">
    - `network: "host"` заблокирован.
    - `network: "container:<id>"` заблокирован по умолчанию (риск обхода через присоединение к пространству имен).
    - Аварийное переопределение: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Инструкции по установке Docker и контейнеризованный Gateway находятся здесь: [Docker](/ru/install/docker)

Для развертываний Docker Gateway `scripts/docker/setup.sh` может подготовить конфигурацию песочницы. Задайте `OPENCLAW_SANDBOX=1` (или `true`/`yes`/`on`), чтобы включить этот путь. Расположение сокета можно переопределить через `OPENCLAW_DOCKER_SOCKET`. Полная настройка и справочник переменных окружения: [Docker](/ru/install/docker#agent-sandbox).

## setupCommand (однократная настройка контейнера)

`setupCommand` запускается **один раз** после создания контейнера песочницы (не при каждом запуске). Он выполняется внутри контейнера через `sh -lc`.

Пути:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для отдельного агента: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Распространенные ошибки">
    - Значение `docker.network` по умолчанию — `"none"` (без исходящего доступа), поэтому установка пакетов завершится ошибкой.
    - `docker.network: "container:<id>"` требует `dangerouslyAllowContainerNamespaceJoin: true` и предназначен только для аварийных случаев.
    - `readOnlyRoot: true` запрещает запись; задайте `readOnlyRoot: false` или соберите собственный образ.
    - Для установки пакетов `user` должен быть root (не указывайте `user` или задайте `user: "0:0"`).
    - Выполнение в песочнице **не** наследует `process.env` хоста. Используйте `agents.defaults.sandbox.docker.env` (или собственный образ) для API-ключей Skills.
    - Значения в `agents.defaults.sandbox.docker.env` передаются как явные переменные окружения контейнера Docker. Любой, у кого есть доступ к демону Docker, может просмотреть их с помощью команд метаданных Docker, таких как `docker inspect`. Используйте собственный образ, смонтированный файл секрета или другой путь доставки секретов, если такое раскрытие метаданных неприемлемо.

  </Accordion>
</AccordionGroup>

## Политика инструментов и аварийные обходы

Политики разрешения/запрета инструментов по-прежнему применяются до правил песочницы. Если инструмент запрещен глобально или для отдельного агента, песочница не вернет его обратно.

`tools.elevated` — явный аварийный обход, который запускает `exec` вне песочницы (`gateway` по умолчанию или `node`, когда цель exec — `node`). Директивы `/exec` применяются только для авторизованных отправителей и сохраняются на уровне сессии; чтобы жестко отключить `exec`, используйте запрет в политике инструментов (см. [Песочница, политика инструментов и Elevated](/ru/gateway/sandbox-vs-tool-policy-vs-elevated)).

Отладка:

- Используйте `openclaw sandbox explain`, чтобы проверить эффективный режим песочницы, политику инструментов и ключи конфигурации для исправления.
- См. [Песочница, политика инструментов и Elevated](/ru/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальной модели «почему это заблокировано?».

Держите это строго ограниченным.

## Переопределения для нескольких агентов

Каждый агент может переопределять песочницу и инструменты: `agents.list[].sandbox` и `agents.list[].tools` (плюс `agents.list[].tools.sandbox.tools` для политики инструментов песочницы). См. [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools), чтобы узнать порядок приоритета.

## Минимальный пример включения

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

## Связанные материалы

- [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools) — переопределения для отдельных агентов и порядок приоритета
- [OpenShell](/ru/gateway/openshell) — настройка управляемого бэкенда песочницы, режимы рабочей области и справочник конфигурации
- [Конфигурация песочницы](/ru/gateway/config-agents#agentsdefaultssandbox)
- [Песочница, политика инструментов и Elevated](/ru/gateway/sandbox-vs-tool-policy-vs-elevated) — отладка «почему это заблокировано?»
- [Безопасность](/ru/gateway/security)
