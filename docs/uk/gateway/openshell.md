---
read_when:
    - Вам потрібні хмарні керовані пісочниці замість локального Docker
    - Ви налаштовуєте плагін OpenShell
    - Вам потрібно вибрати між режимами робочого простору mirror і remote
summary: Використовуйте OpenShell як керований бекенд пісочниці для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-27T06:25:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell — це керований бекенд пісочниці для OpenClaw. Замість локального запуску
контейнерів Docker, OpenClaw делегує життєвий цикл пісочниці CLI `openshell`,
який надає віддалені середовища з виконанням команд через SSH.

Плагін OpenShell повторно використовує той самий базовий SSH-транспорт і міст
віддаленої файлової системи, що й загальний [SSH backend](/uk/gateway/sandboxing#ssh-backend). Він додає
специфічний для OpenShell життєвий цикл (`sandbox create/get/delete`, `sandbox ssh-config`)
і необов’язковий режим робочого простору `mirror`.

## Передумови

- CLI `openshell` установлено й доступний у `PATH` (або задайте власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до пісочниць
- OpenClaw Gateway, що працює на хості

## Швидкий старт

1. Увімкніть плагін і задайте бекенд пісочниці:

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
   і маршрутизуватиме виконання інструментів через неї.

3. Перевірте:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Режими робочого простору

Це найважливіше рішення під час використання OpenShell.

### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, якщо хочете, щоб **локальний
робочий простір залишався канонічним**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний робочий простір у пісочницю OpenShell.
- Після `exec` OpenClaw синхронізує віддалений робочий простір назад у локальний робочий простір.
- Файлові інструменти, як і раніше, працюють через міст пісочниці, але локальний робочий простір
  лишається джерелом істини між ходами.

Найкраще підходить для:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично були видимі в
  пісочниці.
- Ви хочете, щоб пісочниця OpenShell поводилася максимально схоже на бекенд Docker.
- Ви хочете, щоб робочий простір хоста відображав записи пісочниці після кожного ходу exec.

Компроміс: додаткова вартість синхронізації перед і після кожного exec.

### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, якщо хочете, щоб
**робочий простір OpenShell став канонічним**.

Поведінка:

- Коли пісочниця створюється вперше, OpenClaw один раз ініціалізує віддалений робочий простір
  з локального робочого простору.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють
  безпосередньо з віддаленим робочим простором OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір.
- Зчитування медіа під час формування запиту все одно працює, тому що файлові та медіа-інструменти читають через
  міст пісочниці.

Найкраще підходить для:

- Пісочниця має переважно жити на віддаленому боці.
- Ви хочете менші накладні витрати на синхронізацію для кожного ходу.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленої пісочниці.

<Warning>
Якщо ви редагуєте файли на хості поза OpenClaw після початкової ініціалізації, віддалена пісочниця **не** побачить цих змін. Використайте `openclaw sandbox recreate`, щоб повторно ініціалізувати її.
</Warning>

### Вибір режиму

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Канонічний робочий простір**  | Локальний хост                 | Віддалений OpenShell          |
| **Напрям синхронізації**       | Двосторонній (кожен exec)  | Одноразова ініціалізація             |
| **Накладні витрати на хід**    | Вищі (вивантаження + завантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, під час наступного exec          | Ні, до recreate        |
| **Найкраще для**             | Робочі процеси розробки      | Довготривалі агенти, CI   |

## Довідник із конфігурації

Уся конфігурація OpenShell розміщується в `plugins.entries.openshell.config`:

| Ключ                       | Тип                     | За замовчуванням       | Опис                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` або `"remote"` | `"mirror"`    | Режим синхронізації робочого простору                                   |
| `command`                 | `string`                 | `"openshell"` | Шлях або ім’я CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`  | Джерело пісочниці для першого створення                  |
| `gateway`                 | `string`                 | —             | Ім’я Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL ендпойнта Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID політики OpenShell для створення пісочниці              |
| `providers`               | `string[]`               | `[]`          | Імена провайдерів, які слід підключити під час створення пісочниці      |
| `gpu`                     | `boolean`                | `false`       | Запитати ресурси GPU                                 |
| `autoProviders`           | `boolean`                | `true`        | Передавати `--auto-providers` під час створення пісочниці         |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Основний робочий простір із правом запису всередині пісочниці         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Шлях монтування робочого простору агента (для доступу лише на читання)     |
| `timeoutSeconds`          | `number`                 | `120`         | Тайм-аут для операцій CLI `openshell`                |

Налаштування на рівні пісочниці (`mode`, `scope`, `workspaceAccess`) задаються в
`agents.defaults.sandbox`, як і для будь-якого бекенда. Повну матрицю див. у
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
віддалений робочий простір для цієї області. Під час наступного використання буде ініціалізовано новий віддалений робочий простір
з локального робочого простору.

Для режиму `mirror` recreate переважно скидає віддалене середовище виконання, тому що
локальний робочий простір лишається канонічним.

### Коли виконувати recreate

Виконайте recreate після зміни будь-чого з наведеного:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Посилення безпеки

OpenShell фіксує кореневий файловий дескриптор робочого простору й повторно перевіряє identity пісочниці перед кожним
читанням, тому підміна symlink або повторне монтування робочого простору не можуть перенаправити читання за межі
передбаченого віддаленого робочого простору.

## Поточні обмеження

- Браузер пісочниці не підтримується бекендом OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри середовища виконання в `sandbox.docker.*` застосовуються лише до бекенда Docker.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (із прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` згідно з конфігурацією).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати SSH-параметри
   підключення до пісочниці.
3. Ядро записує конфігурацію SSH у тимчасовий файл і відкриває SSH-сеанс, використовуючи
   той самий міст віддаленої файлової системи, що й загальний SSH backend.
4. У режимі `mirror`: синхронізує локальний робочий простір із віддаленим перед exec, виконує команду, синхронізує назад після exec.
5. У режимі `remote`: ініціалізує один раз під час створення, а потім працює безпосередньо з віддаленим
   робочим простором.

## Пов’язане

- [Sandboxing](/uk/gateway/sandboxing) -- режими, області дії та порівняння бекендів
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [Sandbox CLI](/uk/cli/sandbox) -- команди `openclaw sandbox`
