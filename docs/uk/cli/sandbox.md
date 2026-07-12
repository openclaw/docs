---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керуйте середовищами виконання пісочниці та перевіряйте чинну політику пісочниці
title: CLI пісочниці
x-i18n:
    generated_at: "2026-07-12T13:06:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Керуйте середовищами виконання пісочниці для ізольованого виконання агентів: контейнерами Docker, цільовими вузлами SSH або бекендами OpenShell.

## Команди

### `openclaw sandbox list`

Вивести список середовищ виконання пісочниці зі станом, бекендом, відповідністю конфігурації, віком, часом простою та пов’язаним сеансом або агентом.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # лише браузерні контейнери
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Видалити середовища виконання пісочниці, щоб примусово повторно створити їх із поточною конфігурацією. Середовища виконання автоматично створюються повторно під час наступного використання агента.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # включає підсеанси agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # лише браузерні контейнери
openclaw sandbox recreate --all --force        # пропустити підтвердження
```

Параметри:

- `--all`: повторно створити всі контейнери пісочниці
- `--session <key>`: повторно створити середовище виконання з цим точним ключем області дії (як показано командою `sandbox list`); без розгортання короткого імені
- `--agent <id>`: повторно створити середовища виконання для одного агента (відповідає `agent:<id>` і `agent:<id>:*`)
- `--browser`: впливати лише на браузерні контейнери
- `--force`: пропустити запит на підтвердження

Передайте рівно один із параметрів: `--all`, `--session` або `--agent`.

Для `ssh` і OpenShell `remote` повторне створення важливіше, ніж для Docker: після початкового заповнення віддалений робочий простір стає канонічним, команда `recreate` видаляє цей канонічний віддалений робочий простір для вибраної області дії, а наступний запуск повторно заповнює його з поточного локального робочого простору.

### `openclaw sandbox explain`

Переглянути ефективний режим і область дії пісочниці, доступ до робочого простору, політику інструментів пісочниці та обмеження для інструментів із підвищеними привілеями (зі шляхами до ключів конфігурації для виправлення).

У звіті `workspaceRoot` залишається налаштованим коренем пісочниці, а ефективний робочий простір хоста, робочий каталог середовища виконання бекенда й таблиця монтувань Docker відображаються окремо. Для `workspaceAccess: "rw"` ефективним робочим простором хоста є робочий простір агента, а не каталог усередині `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

На відміну від `recreate --session`, ця команда приймає короткі імена сеансів (наприклад, `main`) і розгортає їх відносно визначеного агента.

## Навіщо потрібне повторне створення

Оновлення конфігурації пісочниці не впливає на запущені контейнери: наявні середовища виконання зберігають старі налаштування, а неактивні середовища видаляються лише після завершення періоду `prune.idleHours` (типове значення — 24 години). Агенти, яких використовують регулярно, можуть необмежено довго підтримувати застарілі середовища виконання активними. Команда `openclaw sandbox recreate` видаляє старе середовище виконання, щоб під час наступного використання його було перебудовано відповідно до поточної конфігурації.

<Tip>
Віддавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для бекенда. Ця команда використовує реєстр середовищ виконання Gateway й уникає невідповідностей у разі зміни області дії або ключів сеансів.
</Tip>

## Поширені причини

| Зміна                                                                                                                                                          | Команда                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Оновлення образу Docker (`agents.defaults.sandbox.docker.image`)                                                                                               | `openclaw sandbox recreate --all`                                   |
| Конфігурація пісочниці (`agents.defaults.sandbox.*`)                                                                                                           | `openclaw sandbox recreate --all`                                   |
| Цільовий вузол або автентифікація SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Джерело, політика або режим OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                  | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (або `--agent <id>` для одного агента) |

<Note>
Середовища виконання автоматично створюються повторно під час наступного використання агента.
</Note>

## Міграція реєстру

Метадані середовищ виконання пісочниці зберігаються у спільній базі даних стану SQLite. У старіших інсталяціях можуть залишатися застарілі файли реєстру, які звичайне читання більше не перезаписує:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- один сегмент JSON на кожен контейнер або браузер у `~/.openclaw/sandbox/containers/` чи `~/.openclaw/sandbox/browsers/`

Запустіть `openclaw doctor --fix`, щоб перенести коректні застарілі записи до SQLite. Некоректні застарілі файли поміщаються в карантин, щоб пошкоджений старий реєстр не міг приховувати поточні записи середовищ виконання.

## Конфігурація

Налаштування пісочниці зберігаються в `~/.openclaw/openclaw.json` у розділі `agents.defaults.sandbox` (перевизначення для окремих агентів розміщуються в `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (надається Plugin)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... інші параметри Docker
        },
        "prune": {
          "idleHours": 24, // автоматичне видалення після 24 годин простою
          "maxAgeDays": 7, // автоматичне видалення через 7 днів
        },
      },
    },
  },
}
```

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Ізоляція в пісочниці](/uk/gateway/sandboxing)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Doctor](/uk/gateway/doctor): перевіряє налаштування пісочниці.
