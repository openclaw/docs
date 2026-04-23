---
read_when:
    - Ви хочете хмарно керовані пісочниці замість локального Docker
    - Ви налаштовуєте Plugin OpenShell
    - Вам потрібно вибрати між режимами робочого простору mirror і remote
summary: Використовуйте OpenShell як керований бекенд пісочниці для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T07:25:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell — це керований бекенд пісочниці для OpenClaw. Замість локального запуску
контейнерів Docker, OpenClaw делегує життєвий цикл пісочниці CLI `openshell`,
який розгортає віддалені середовища з виконанням команд через SSH.

Plugin OpenShell повторно використовує той самий базовий SSH-транспорт і міст
до віддаленої файлової системи, що й загальний [SSH backend](/uk/gateway/sandboxing#ssh-backend). Він додає специфічне для OpenShell керування життєвим циклом (`sandbox create/get/delete`, `sandbox ssh-config`)
і необов’язковий режим робочого простору `mirror`.

## Передумови

- Встановлений CLI `openshell`, доступний у `PATH` (або вкажіть власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до пісочниць
- OpenClaw Gateway, запущений на хості

## Швидкий старт

1. Увімкніть Plugin і задайте бекенд пісочниці:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. Перезапустіть Gateway. На наступному ході агента OpenClaw створить пісочницю OpenShell
   і направить через неї виконання інструментів.

3. Перевірте:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Режими робочого простору

Це найважливіше рішення під час використання OpenShell.

### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальний
робочий простір залишався канонічним**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний робочий простір у пісочницю OpenShell.
- Після `exec` OpenClaw синхронізує віддалений робочий простір назад у локальний робочий простір.
- Інструменти для роботи з файлами, як і раніше, працюють через міст пісочниці, але локальний робочий простір
  залишається джерелом істини між ходами.

Найкраще підходить для:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни були видимі в
  пісочниці автоматично.
- Ви хочете, щоб пісочниця OpenShell поводилася максимально схоже на бекенд Docker.
- Ви хочете, щоб робочий простір хоста відображав записи пісочниці після кожного ходу exec.

Компроміс: додаткові витрати на синхронізацію до і після кожного exec.

### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб
**робочий простір OpenShell став канонічним**.

Поведінка:

- Коли пісочниця створюється вперше, OpenClaw одноразово ініціалізує віддалений робочий простір
  з локального робочого простору.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють
  безпосередньо з віддаленим робочим простором OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір.
- Читання медіа під час формування запиту, як і раніше, працює, оскільки інструменти для файлів і медіа читають через
  міст пісочниці.

Найкраще підходить для:

- Пісочниця має існувати переважно на віддаленому боці.
- Ви хочете менші накладні витрати на синхронізацію на кожному ході.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленої пісочниці.

Важливо: якщо ви редагуєте файли на хості поза OpenClaw після початкового ініціалізування,
віддалена пісочниця **не** побачить цих змін. Використайте
`openclaw sandbox recreate`, щоб виконати повторне ініціалізування.

### Вибір режиму

|                          | `mirror`                   | `remote`                   |
| ------------------------ | -------------------------- | -------------------------- |
| **Канонічний робочий простір** | Локальний хост             | Віддалений OpenShell       |
| **Напрям синхронізації** | Двосторонній (кожен exec)  | Одноразове ініціалізування |
| **Накладні витрати на хід** | Вищі (вивантаження + завантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, на наступному exec    | Ні, до recreate            |
| **Найкраще для**         | Робочих процесів розробки  | Довготривалих агентів, CI  |

## Довідник конфігурації

Уся конфігурація OpenShell розміщується в `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | Опис                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | Режим синхронізації робочого простору                 |
| `command`                 | `string`                 | `"openshell"` | Шлях або назва CLI `openshell`                        |
| `from`                    | `string`                 | `"openclaw"`  | Джерело пісочниці для першого створення               |
| `gateway`                 | `string`                 | —             | Назва Gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID політики OpenShell для створення пісочниці         |
| `providers`               | `string[]`               | `[]`          | Назви providers, які слід приєднати під час створення пісочниці |
| `gpu`                     | `boolean`                | `false`       | Запитати ресурси GPU                                  |
| `autoProviders`           | `boolean`                | `true`        | Передавати `--auto-providers` під час створення пісочниці |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Основний доступний для запису робочий простір усередині пісочниці |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Шлях монтування робочого простору агента (для доступу лише на читання) |
| `timeoutSeconds`          | `number`                 | `120`         | Тайм-аут для операцій CLI `openshell`                 |

Налаштування на рівні пісочниці (`mode`, `scope`, `workspaceAccess`) задаються в
`agents.defaults.sandbox`, як і для будь-якого іншого бекенду. Повну матрицю див. у
[Sandboxing](/uk/gateway/sandboxing).

## Приклади

### Мінімальне налаштування remote

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Режим mirror із GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell для окремого агента з користувацьким Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Керування життєвим циклом

Пісочниці OpenShell керуються через звичайний CLI пісочниць:

```bash
# Перелічити всі середовища виконання пісочниць (Docker + OpenShell)
openclaw sandbox list

# Переглянути ефективну політику
openclaw sandbox explain

# Пересоздати (видаляє віддалений робочий простір, повторно ініціалізує при наступному використанні)
openclaw sandbox recreate --all
```

Для режиму `remote` **recreate є особливо важливим**: він видаляє канонічний
віддалений робочий простір для цього scope. Наступне використання ініціалізує новий віддалений робочий простір з
локального робочого простору.

Для режиму `mirror` recreate переважно скидає віддалене середовище виконання, оскільки
локальний робочий простір залишається канонічним.

### Коли виконувати recreate

Виконуйте recreate після зміни будь-чого з наведеного:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Посилення безпеки

OpenClaw фіксує root fd робочого простору й повторно перевіряє ідентичність пісочниці перед кожним
читанням, тому підміна symlink або повторне монтування робочого простору не можуть перенаправити читання за межі
очікуваного віддаленого робочого простору.

## Поточні обмеження

- Браузер пісочниці не підтримується в бекенді OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри середовища виконання в `sandbox.docker.*` застосовуються лише до бекенду Docker.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (з прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` відповідно до конфігурації).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати дані SSH-з’єднання
   для пісочниці.
3. Ядро записує конфігурацію SSH у тимчасовий файл і відкриває SSH-сеанс, використовуючи
   той самий міст до віддаленої файлової системи, що й загальний SSH backend.
4. У режимі `mirror`: синхронізує локальне з віддаленим перед exec, виконує, синхронізує назад після exec.
5. У режимі `remote`: одноразово ініціалізує під час створення, а потім працює безпосередньо з віддаленим
   робочим простором.

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- режими, scope і порівняння бекендів
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [Sandbox CLI](/uk/cli/sandbox) -- команди `openclaw sandbox`
