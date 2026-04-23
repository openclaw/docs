---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керуйте середовищами виконання sandbox і переглядайте ефективну політику sandbox
title: CLI sandbox
x-i18n:
    generated_at: "2026-04-23T06:19:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI sandbox

Керуйте середовищами виконання sandbox для ізольованого виконання агентів.

## Огляд

OpenClaw може запускати агентів в ізольованих середовищах виконання sandbox для безпеки. Команди `sandbox` допомагають переглядати та перевідтворювати ці середовища після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- Docker-контейнери sandbox
- середовища виконання SSH sandbox, коли `agents.defaults.sandbox.backend = "ssh"`
- середовища виконання OpenShell sandbox, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і `remote` OpenShell перевідтворення важливіше, ніж для Docker:

- віддалений робочий простір є канонічним після початкового заповнення
- `openclaw sandbox recreate` видаляє цей канонічний віддалений робочий простір для вибраної області
- наступне використання знову заповнює його з поточного локального робочого простору

## Команди

### `openclaw sandbox explain`

Перегляньте **ефективний** режим/область/доступ до робочого простору sandbox, політику інструментів sandbox і підвищені шлюзи доступу (із шляхами до ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Перелічіть усі середовища виконання sandbox з їхнім станом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Перелічити лише контейнері браузера
openclaw sandbox list --json     # Вивід JSON
```

**Вивід містить:**

- Назву й стан середовища виконання
- Backend (`docker`, `openshell` тощо)
- Мітку конфігурації та чи відповідає вона поточній конфігурації
- Вік (час від створення)
- Час простою (час від останнього використання)
- Пов’язану сесію/агента

### `openclaw sandbox recreate`

Видаліть середовища виконання sandbox, щоб примусово перевідтворити їх з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Перевідтворити всі контейнери
openclaw sandbox recreate --session main       # Конкретна сесія
openclaw sandbox recreate --agent mybot        # Конкретний агент
openclaw sandbox recreate --browser            # Лише контейнері браузера
openclaw sandbox recreate --all --force        # Пропустити підтвердження
```

**Параметри:**

- `--all`: перевідтворити всі контейнери sandbox
- `--session <key>`: перевідтворити контейнер для конкретної сесії
- `--agent <id>`: перевідтворити контейнери для конкретного агента
- `--browser`: перевідтворити лише контейнері браузера
- `--force`: пропустити запит підтвердження

**Важливо:** середовища виконання автоматично перевідтворюються під час наступного використання агента.

## Варіанти використання

### Після оновлення образу Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Після зміни конфігурації sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Після зміни SSH-цілі або матеріалів автентифікації SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Для базового backend `ssh` команда recreate видаляє корінь віддаленого робочого простору для кожної області
на SSH-цілі. Наступний запуск знову заповнює його з локального робочого простору.

### Після зміни джерела, політики або режиму OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Для режиму OpenShell `remote` команда recreate видаляє канонічний віддалений робочий простір
для цієї області. Наступний запуск знову заповнює його з локального робочого простору.

### Після зміни setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Лише для конкретного агента

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Чому це потрібно?

**Проблема:** коли ви оновлюєте конфігурацію sandbox:

- наявні середовища виконання продовжують працювати зі старими налаштуваннями
- середовища виконання очищаються лише після 24 годин неактивності
- агенти, які регулярно використовуються, можуть нескінченно довго зберігати старі середовища виконання

**Рішення:** використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі середовища виконання. Вони будуть автоматично перевідтворені з поточними налаштуваннями, коли знову знадобляться.

Порада: віддавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для backend.
Вона використовує реєстр середовищ виконання Gateway і допомагає уникнути невідповідностей, коли змінюються ключі області/сесії.

## Конфігурація

Налаштування sandbox розташовані в `~/.openclaw/openclaw.json` у розділі `agents.defaults.sandbox` (перевизначення для окремих агентів — у `agents.list[].sandbox`):

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
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Див. також

- [Документація sandbox](/uk/gateway/sandboxing)
- [Конфігурація агента](/uk/concepts/agent-workspace)
- [Команда doctor](/uk/gateway/doctor) - перевірка налаштування sandbox
