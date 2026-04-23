---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керування runtime пісочниці та перевірка ефективної політики пісочниці
title: CLI пісочниці
x-i18n:
    generated_at: "2026-04-23T20:48:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 896a0ca9a72517925f2072426a7bbd4e5011987406d4958cec23a87f686f3ab8
    source_path: cli/sandbox.md
    workflow: 15
---

Керуйте runtime пісочниці для ізольованого виконання агента.

## Огляд

OpenClaw може запускати агентів в ізольованих runtime пісочниці для безпеки. Команди `sandbox` допомагають перевіряти та перевідтворювати ці runtime після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- контейнери пісочниці Docker
- runtime пісочниці SSH, коли `agents.defaults.sandbox.backend = "ssh"`
- runtime пісочниці OpenShell, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і OpenShell `remote` перевідтворення важливіше, ніж для Docker:

- віддалений workspace є канонічним після початкового seed
- `openclaw sandbox recreate` видаляє цей канонічний віддалений workspace для вибраної області
- під час наступного використання він знову seed-иться з поточного локального workspace

## Команди

### `openclaw sandbox explain`

Перевірити **ефективний** режим/область/доступ до workspace пісочниці, політику інструментів пісочниці та підвищені шлюзи (із шляхами до ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Перелічити всі runtime пісочниці з їхнім станом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Перелічити лише контейнери браузера
openclaw sandbox list --json     # Вивід JSON
```

**Вивід містить:**

- Назву runtime і стан
- Backend (`docker`, `openshell` тощо)
- Мітку конфігурації та те, чи збігається вона з поточною конфігурацією
- Вік (час від створення)
- Час простою (час від останнього використання)
- Пов’язану session/агента

### `openclaw sandbox recreate`

Видалити runtime пісочниці, щоб примусово перевідтворити їх з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Перевідтворити всі контейнери
openclaw sandbox recreate --session main       # Конкретна session
openclaw sandbox recreate --agent mybot        # Конкретний агент
openclaw sandbox recreate --browser            # Лише контейнери браузера
openclaw sandbox recreate --all --force        # Пропустити підтвердження
```

**Параметри:**

- `--all`: Перевідтворити всі контейнери пісочниці
- `--session <key>`: Перевідтворити контейнер для конкретної session
- `--agent <id>`: Перевідтворити контейнери для конкретного агента
- `--browser`: Перевідтворити лише контейнери браузера
- `--force`: Пропустити запит підтвердження

**Важливо:** Runtime автоматично перевідтворюються під час наступного використання агента.

## Випадки використання

### Після оновлення Docker image

```bash
# Отримати новий image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Оновити конфігурацію для використання нового image
# Відредагуйте конфігурацію: agents.defaults.sandbox.docker.image (або agents.list[].sandbox.docker.image)

# Перевідтворити контейнери
openclaw sandbox recreate --all
```

### Після зміни конфігурації пісочниці

```bash
# Відредагуйте конфігурацію: agents.defaults.sandbox.* (або agents.list[].sandbox.*)

# Перевідтворіть, щоб застосувати нову конфігурацію
openclaw sandbox recreate --all
```

### Після зміни SSH target або матеріалів SSH auth

```bash
# Відредагуйте конфігурацію:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Для базового backend `ssh` перевідтворення видаляє віддалений корінь workspace для кожної області
на SSH target. Наступний запуск знову seed-ить його з локального workspace.

### Після зміни джерела, політики або режиму OpenShell

```bash
# Відредагуйте конфігурацію:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Для режиму OpenShell `remote` перевідтворення видаляє канонічний віддалений workspace
для цієї області. Наступний запуск знову seed-ить його з локального workspace.

### Після зміни setupCommand

```bash
openclaw sandbox recreate --all
# або лише для одного агента:
openclaw sandbox recreate --agent family
```

### Лише для конкретного агента

```bash
# Оновити контейнери лише одного агента
openclaw sandbox recreate --agent alfred
```

## Навіщо це потрібно?

**Проблема:** коли ви оновлюєте конфігурацію пісочниці:

- наявні runtime продовжують працювати зі старими налаштуваннями
- runtime очищаються лише після 24h бездіяльності
- агенти, які регулярно використовуються, нескінченно підтримують життя старих runtime

**Рішення:** використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі runtime. Вони автоматично перевідтворяться з поточними налаштуваннями, коли знову знадобляться.

Порада: надавайте перевагу `openclaw sandbox recreate` над ручним очищенням, специфічним для backend.
Це використовує реєстр runtime Gateway і уникає невідповідностей, коли змінюються ключі scope/session.

## Конфігурація

Налаштування пісочниці зберігаються в `~/.openclaw/openclaw.json` у `agents.defaults.sandbox` (перевизначення для окремих агентів — у `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... більше параметрів Docker
        },
        "prune": {
          "idleHours": 24, // Автоочищення після 24h простою
          "maxAgeDays": 7, // Автоочищення через 7 днів
        },
      },
    },
  },
}
```

## Див. також

- [Документація пісочниці](/uk/gateway/sandboxing)
- [Конфігурація агента](/uk/concepts/agent-workspace)
- [Команда Doctor](/uk/gateway/doctor) - Перевірити налаштування пісочниці
