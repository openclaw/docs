---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керуйте середовищами виконання пісочниці та перевіряйте діючу політику пісочниці
title: CLI пісочниці
x-i18n:
    generated_at: "2026-05-03T12:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Керуйте середовищами виконання sandbox для ізольованого виконання агентів.

## Огляд

OpenClaw може запускати агентів в ізольованих середовищах виконання sandbox для безпеки. Команди `sandbox` допомагають перевіряти та перестворювати ці середовища після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- Контейнери Docker sandbox
- Середовища виконання SSH sandbox, коли `agents.defaults.sandbox.backend = "ssh"`
- Середовища виконання OpenShell sandbox, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і OpenShell `remote` перестворення важливіше, ніж для Docker:

- віддалений робочий простір є канонічним після початкового наповнення
- `openclaw sandbox recreate` видаляє цей канонічний віддалений робочий простір для вибраної області
- наступне використання знову наповнює його з поточного локального робочого простору

## Команди

### `openclaw sandbox explain`

Перевірте **ефективні** режим/область/доступ до робочого простору sandbox, політику інструментів sandbox і gates для підвищених прав (із шляхами ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Перелічує всі середовища виконання sandbox з їхнім станом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Вивід містить:**

- Назву середовища виконання та стан
- Backend (`docker`, `openshell` тощо)
- Мітку конфігурації та чи відповідає вона поточній конфігурації
- Вік (час від створення)
- Час простою (час від останнього використання)
- Пов’язану сесію/агента

### `openclaw sandbox recreate`

Видаліть середовища виконання sandbox, щоб примусово перестворити їх з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Параметри:**

- `--all`: перестворити всі контейнери sandbox
- `--session <key>`: перестворити контейнер для певної сесії
- `--agent <id>`: перестворити контейнери для певного агента
- `--browser`: перестворити лише браузерні контейнери
- `--force`: пропустити запит підтвердження

<Note>
Середовища виконання автоматично перестворюються під час наступного використання агента.
</Note>

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

### Після зміни цілі SSH або матеріалів автентифікації SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Для основного backend `ssh` перестворення видаляє корінь віддаленого робочого простору для кожної області на цілі SSH. Наступний запуск знову наповнює його з локального робочого простору.

### Після зміни джерела, політики або режиму OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Для режиму OpenShell `remote` перестворення видаляє канонічний віддалений робочий простір для цієї області. Наступний запуск знову наповнює його з локального робочого простору.

### Після зміни setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Лише для певного агента

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Навіщо це потрібно

Коли ви оновлюєте конфігурацію sandbox:

- Наявні середовища виконання продовжують працювати зі старими налаштуваннями.
- Середовища виконання очищаються лише після 24 годин неактивності.
- Агенти, які використовуються регулярно, утримують старі середовища виконання живими безстроково.

Використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі середовища виконання. Вони автоматично перестворюються з поточними налаштуваннями, коли знову знадобляться.

<Tip>
Надавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для backend. Він використовує реєстр середовищ виконання Gateway і уникає невідповідностей, коли змінюються ключі області або сесії.
</Tip>

## Міграція реєстру

OpenClaw зберігає метадані середовища виконання sandbox як один JSON-фрагмент на кожен запис контейнера/браузера в каталозі стану sandbox. Старі встановлення все ще можуть мати монолітні застарілі файли:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Звичайні читання середовища виконання sandbox не перезаписують ці файли. Запустіть `openclaw doctor --fix`, щоб перенести чинні застарілі записи до каталогів фрагментованого реєстру. Нечинні застарілі файли ізолюються, щоб один поганий старий реєстр не міг приховати поточні записи середовища виконання.

## Конфігурація

Налаштування sandbox містяться в `~/.openclaw/openclaw.json` під `agents.defaults.sandbox` (перевизначення для окремих агентів розміщуються в `agents.list[].sandbox`):

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
- [Sandboxing](/uk/gateway/sandboxing)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Doctor](/uk/gateway/doctor): перевіряє налаштування sandbox.
