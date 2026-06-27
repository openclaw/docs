---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керуйте середовищами виконання пісочниці та переглядайте чинну політику пісочниці
title: CLI пісочниці
x-i18n:
    generated_at: "2026-06-27T17:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Керуйте середовищами виконання пісочниці для ізольованого виконання агентів.

## Огляд

OpenClaw може запускати агентів в ізольованих середовищах виконання пісочниці для безпеки. Команди `sandbox` допомагають перевіряти та перестворювати ці середовища виконання після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- Docker-контейнери пісочниці
- SSH-середовища виконання пісочниці, коли `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-середовища виконання пісочниці, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і OpenShell `remote` перестворення важливіше, ніж для Docker:

- віддалений робочий простір є канонічним після початкового заповнення
- `openclaw sandbox recreate` видаляє цей канонічний віддалений робочий простір для вибраної області
- наступне використання знову заповнює його з поточного локального робочого простору

## Команди

### `openclaw sandbox explain`

Перевірте **ефективний** режим/область/доступ до робочого простору пісочниці, політику інструментів пісочниці та підвищені шлюзи (зі шляхами ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Виведіть список усіх середовищ виконання пісочниці з їхнім станом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Вивід містить:**

- Назву та стан середовища виконання
- Бекенд (`docker`, `openshell` тощо)
- Мітку конфігурації та чи відповідає вона поточній конфігурації
- Вік (час від створення)
- Час простою (час від останнього використання)
- Пов’язаний сеанс/агент

### `openclaw sandbox recreate`

Видаліть середовища виконання пісочниці, щоб примусово перестворити їх з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Параметри:**

- `--all`: перестворити всі контейнери пісочниці
- `--session <key>`: перестворити контейнер для конкретного сеансу
- `--agent <id>`: перестворити контейнери для конкретного агента
- `--browser`: перестворити лише браузерні контейнери
- `--force`: пропустити запит підтвердження

<Note>
Середовища виконання автоматично перестворюються під час наступного використання агента.
</Note>

## Приклади використання

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

### Після зміни конфігурації пісочниці

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Після зміни цілі SSH або матеріалу автентифікації SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Для основного бекенда `ssh` перестворення видаляє корінь віддаленого робочого простору для кожної області
на цілі SSH. Наступний запуск знову заповнює його з локального робочого простору.

### Після зміни джерела, політики або режиму OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Для режиму OpenShell `remote` перестворення видаляє канонічний віддалений робочий простір
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

## Навіщо це потрібно

Коли ви оновлюєте конфігурацію пісочниці:

- Наявні середовища виконання продовжують працювати зі старими налаштуваннями.
- Середовища виконання видаляються лише після 24 годин неактивності.
- Агенти, які використовуються регулярно, зберігають старі середовища виконання активними безстроково.

Використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі середовища виконання. Вони автоматично перестворюються з поточними налаштуваннями, коли знадобляться наступного разу.

<Tip>
Надавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для бекенда. Вона використовує реєстр середовищ виконання Gateway і запобігає невідповідностям, коли змінюються ключі області або сеансу.
</Tip>

## Міграція реєстру

OpenClaw зберігає метадані середовищ виконання пісочниці у спільній базі даних стану SQLite. У старіших інсталяціях досі можуть бути застарілі файли реєстру пісочниці:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Деякі оновлення також можуть мати по одному JSON-фрагменту на контейнер/браузер у `~/.openclaw/sandbox/containers/` або `~/.openclaw/sandbox/browsers/`. Звичайні читання середовищ виконання пісочниці не перезаписують ці застарілі джерела. Запустіть `openclaw doctor --fix`, щоб мігрувати дійсні застарілі записи до SQLite. Недійсні застарілі файли ізолюються, щоб один пошкоджений старий реєстр не міг приховати поточні записи середовищ виконання.

## Конфігурація

Налаштування пісочниці містяться в `~/.openclaw/openclaw.json` у `agents.defaults.sandbox` (перевизначення для окремих агентів розміщуються в `agents.list[].sandbox`):

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

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Пісочниця](/uk/gateway/sandboxing)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Doctor](/uk/gateway/doctor): перевіряє налаштування пісочниці.
