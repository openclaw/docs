---
read_when:
    - Вам потрібні керовані в хмарі пісочниці замість локального Docker
    - Ви налаштовуєте plugin OpenShell
    - Потрібно вибрати між режимами дзеркального та віддаленого робочого простору
summary: Використовуйте OpenShell як керований бекенд пісочниці для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:34:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell — це керований бекенд пісочниці для OpenClaw. Замість локального запуску Docker
контейнерів OpenClaw делегує життєвий цикл пісочниці CLI `openshell`,
який надає віддалені середовища з виконанням команд через SSH.

Plugin OpenShell повторно використовує той самий основний SSH-транспорт і міст
віддаленої файлової системи, що й загальний [SSH-бекенд](/uk/gateway/sandboxing#ssh-backend). Він додає
специфічний для OpenShell життєвий цикл (`sandbox create/get/delete`, `sandbox ssh-config`)
і необов’язковий режим робочого простору `mirror`.

## Передумови

- Plugin OpenShell встановлено (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` встановлено й доступний у `PATH` (або задано власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до пісочниці
- OpenClaw Gateway запущено на хості

## Швидкий старт

1. Установіть і ввімкніть Plugin, а потім задайте бекенд пісочниці:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. Перезапустіть Gateway. Під час наступного ходу агента OpenClaw створить пісочницю OpenShell
   і спрямує виконання інструментів через неї.

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

- Перед `exec` OpenClaw синхронізує локальний робочий простір із пісочницею OpenShell.
- Після `exec` OpenClaw синхронізує віддалений робочий простір назад у локальний робочий простір.
- Файлові інструменти й далі працюють через міст пісочниці, але локальний робочий простір
  залишається джерелом істини між ходами.

Найкраще підходить для:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично були видимі в
  пісочниці.
- Ви хочете, щоб пісочниця OpenShell поводилася максимально схоже на бекенд Docker.
- Ви хочете, щоб робочий простір хоста відображав записи пісочниці після кожного ходу exec.

Компроміс: додаткова вартість синхронізації до та після кожного exec.

### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб
**робочий простір OpenShell став канонічним**.

Поведінка:

- Коли пісочницю створюють уперше, OpenClaw один раз ініціалізує віддалений робочий простір із
  локального робочого простору.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють
  безпосередньо з віддаленим робочим простором OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір.
- Читання медіа під час формування промпта й далі працює, бо файлові та медіаінструменти читають через
  міст пісочниці.

Найкраще підходить для:

- Пісочниця має переважно жити на віддаленій стороні.
- Ви хочете зменшити накладні витрати синхронізації на кожен хід.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували віддалений стан пісочниці.

<Warning>
Якщо після початкової ініціалізації ви редагуєте файли на хості поза OpenClaw, віддалена пісочниця **не** бачить цих змін. Використайте `openclaw sandbox recreate`, щоб повторно ініціалізувати її.
</Warning>

### Вибір режиму

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Канонічний робочий простір** | Локальний хост             | Віддалений OpenShell      |
| **Напрямок синхронізації** | Двостороння (кожен exec)   | Одноразова ініціалізація  |
| **Накладні витрати на хід** | Вищі (завантаження + вивантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, під час наступного exec | Ні, доки не буде recreate |
| **Найкраще для**         | Робочі процеси розробки    | Довготривалі агенти, CI   |

## Довідник конфігурації

Уся конфігурація OpenShell міститься в `plugins.entries.openshell.config`:

| Ключ                      | Тип                      | Типове значення | Опис                                                  |
| ------------------------- | ------------------------ | --------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` або `"remote"` | `"mirror"`      | Режим синхронізації робочого простору                 |
| `command`                 | `string`                 | `"openshell"`   | Шлях або назва CLI `openshell`                        |
| `from`                    | `string`                 | `"openclaw"`    | Джерело пісочниці для першого створення               |
| `gateway`                 | `string`                 | —               | Назва Gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —               | URL кінцевої точки Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —               | ID політики OpenShell для створення пісочниці         |
| `providers`               | `string[]`               | `[]`            | Назви провайдерів, які потрібно підключити під час створення пісочниці |
| `gpu`                     | `boolean`                | `false`         | Запитати ресурси GPU                                  |
| `autoProviders`           | `boolean`                | `true`          | Передавати `--auto-providers` під час створення пісочниці |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`    | Основний доступний для запису робочий простір усередині пісочниці |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`      | Шлях монтування робочого простору агента (для доступу лише на читання) |
| `timeoutSeconds`          | `number`                 | `120`           | Тайм-аут для операцій CLI `openshell`                 |

Налаштування рівня пісочниці (`mode`, `scope`, `workspaceAccess`) конфігуруються в
`agents.defaults.sandbox`, як і для будь-якого бекенда. Див.
[Пісочниці](/uk/gateway/sandboxing), щоб переглянути повну матрицю.

## Приклади

### Мінімальне віддалене налаштування

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

### OpenShell для окремого агента з власним Gateway

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

Пісочниці OpenShell керуються через звичайний CLI пісочниці:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Для режиму `remote` **recreate особливо важливий**: він видаляє канонічний
віддалений робочий простір для цієї області. Наступне використання ініціалізує новий віддалений робочий простір із
локального робочого простору.

Для режиму `mirror` recreate переважно скидає віддалене середовище виконання, бо
локальний робочий простір залишається канонічним.

### Коли виконувати recreate

Виконуйте recreate після зміни будь-чого з цього:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Посилення безпеки

OpenShell закріплює fd кореня робочого простору й повторно перевіряє ідентичність пісочниці перед кожним
читанням, тому підміна symlink або перемонтований робочий простір не можуть перенаправити читання за межі
потрібного віддаленого робочого простору.

## Поточні обмеження

- Браузер пісочниці не підтримується на бекенді OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри виконання в `sandbox.docker.*` застосовуються лише до бекенда Docker.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (із прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` відповідно до конфігурації).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати деталі SSH-підключення
   для пісочниці.
3. Core записує SSH-конфігурацію в тимчасовий файл і відкриває SSH-сеанс, використовуючи той самий
   міст віддаленої файлової системи, що й загальний SSH-бекенд.
4. У режимі `mirror`: синхронізує локальний простір із віддаленим перед exec, виконує команду, синхронізує назад після exec.
5. У режимі `remote`: ініціалізує один раз під час створення, потім працює безпосередньо з віддаленим
   робочим простором.

## Пов’язане

- [Пісочниці](/uk/gateway/sandboxing) -- режими, області та порівняння бекендів
- [Пісочниця, політика інструментів і підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [CLI пісочниці](/uk/cli/sandbox) -- команди `openclaw sandbox`
