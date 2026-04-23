---
read_when:
    - Ви хочете хмарні керовані sandbox замість локального Docker
    - Ви налаштовуєте Plugin OpenShell
    - Вам потрібно вибрати між режимами робочого простору mirror і remote
summary: Використовуйте OpenShell як керований sandbox-backend для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T20:54:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47989083fa97a6645799fde88e840eec747ebfcf06e0bbddf535f5d78ed7e87d
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell — це керований sandbox-backend для OpenClaw. Замість локального запуску Docker
контейнерів OpenClaw делегує життєвий цикл sandbox CLI `openshell`,
який надає віддалені середовища з виконанням команд через SSH.

Plugin OpenShell повторно використовує той самий core SSH transport і міст
віддаленої файлової системи, що й загальний [SSH backend](/uk/gateway/sandboxing#ssh-backend). Він додає
життєвий цикл, специфічний для OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
і необов’язковий режим робочого простору `mirror`.

## Передумови

- CLI `openshell` встановлено й доступний у `PATH` (або задано власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до sandbox
- OpenClaw Gateway запущено на хості

## Швидкий старт

1. Увімкніть Plugin і задайте sandbox-backend:

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

2. Перезапустіть Gateway. На наступному ході агента OpenClaw створить OpenShell
   sandbox і спрямує через нього виконання інструментів.

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

- Перед `exec` OpenClaw синхронізує локальний робочий простір до sandbox OpenShell.
- Після `exec` OpenClaw синхронізує віддалений робочий простір назад до локального.
- Файлові інструменти все одно працюють через sandbox bridge, але локальний робочий простір
  залишається джерелом істини між ходами.

Найкраще підходить для:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично ставали видимими в
  sandbox.
- Ви хочете, щоб sandbox OpenShell поводився якомога більше як Docker backend.
- Ви хочете, щоб робочий простір хоста відображав записи sandbox після кожного ходу exec.

Компроміс: додаткові витрати на синхронізацію до і після кожного exec.

### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб
**робочий простір OpenShell став канонічним**.

Поведінка:

- Коли sandbox створюється вперше, OpenClaw одноразово ініціалізує віддалений робочий простір
  на основі локального робочого простору.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють
  безпосередньо з віддаленим робочим простором OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір.
- Читання медіа під час prompt усе одно працює, тому що file і media tools читають через sandbox bridge.

Найкраще підходить для:

- Sandbox має жити переважно на віддаленому боці.
- Ви хочете менші витрати на синхронізацію на кожному ході.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox.

Важливо: якщо ви редагуєте файли на хості поза OpenClaw після початкового ініціалізування,
віддалений sandbox **не** побачить цих змін. Використовуйте
`openclaw sandbox recreate`, щоб виконати повторне ініціалізування.

### Вибір режиму

|                          | `mirror`                    | `remote`                  |
| ------------------------ | --------------------------- | ------------------------- |
| **Канонічний робочий простір** | Локальний хост              | Віддалений OpenShell      |
| **Напрям синхронізації** | Двобічний (на кожному exec) | Одноразове ініціалізування |
| **Витрати на кожному ході** | Вищі (вивантаження + завантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, на наступному exec      | Ні, до recreate           |
| **Найкраще для**         | Розробницьких процесів      | Довготривалих агентів, CI |

## Довідник із конфігурації

Уся конфігурація OpenShell міститься в `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | Description                                            |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------ |
| `mode`                    | `"mirror"` або `"remote"` | `"mirror"`    | Режим синхронізації робочого простору                  |
| `command`                 | `string`                 | `"openshell"` | Шлях або назва CLI `openshell`                         |
| `from`                    | `string`                 | `"openclaw"`  | Джерело sandbox для першого створення                  |
| `gateway`                 | `string`                 | —             | Назва Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`)  |
| `policy`                  | `string`                 | —             | ID policy OpenShell для створення sandbox              |
| `providers`               | `string[]`               | `[]`          | Назви провайдерів, які підключаються під час створення sandbox |
| `gpu`                     | `boolean`                | `false`       | Запросити GPU-ресурси                                  |
| `autoProviders`           | `boolean`                | `true`        | Передавати `--auto-providers` під час створення sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Основний каталог для запису в межах sandbox            |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Шлях монтування робочого простору агента (для доступу лише на читання) |
| `timeoutSeconds`          | `number`                 | `120`         | Тайм-аут для операцій CLI `openshell`                  |

Параметри рівня sandbox (`mode`, `scope`, `workspaceAccess`) налаштовуються в
`agents.defaults.sandbox`, як і для будь-якого backend. Див.
[Sandboxing](/uk/gateway/sandboxing) для повної матриці.

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

### Режим mirror з GPU

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

Sandbox OpenShell керуються через звичайний sandbox CLI:

```bash
# Показати всі runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Переглянути ефективну policy
openclaw sandbox explain

# Відтворити заново (видаляє віддалений робочий простір, повторно ініціалізує при наступному використанні)
openclaw sandbox recreate --all
```

Для режиму `remote` **recreate особливо важливий**: він видаляє канонічний
віддалений робочий простір для цієї області дії. Наступне використання ініціалізує новий віддалений робочий простір
із локального.

Для режиму `mirror` recreate головним чином скидає віддалене середовище виконання, оскільки
локальний робочий простір залишається канонічним.

### Коли виконувати recreate

Виконуйте recreate після зміни будь-якого з цих параметрів:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Посилення безпеки

OpenShell фіксує кореневий fd робочого простору й повторно перевіряє ідентичність sandbox перед кожним
читанням, тому підміна symlink або повторне монтування робочого простору не можуть перенаправити читання за межі
очікуваного віддаленого робочого простору.

## Поточні обмеження

- Sandbox browser не підтримується в backend OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри runtime в `sandbox.docker.*` застосовуються лише до Docker
  backend.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (з прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` згідно з конфігурацією).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати SSH-параметри
   підключення до sandbox.
3. Core записує SSH-конфіг у тимчасовий файл і відкриває SSH-сесію, використовуючи
   той самий міст віддаленої файлової системи, що й загальний SSH backend.
4. У режимі `mirror`: синхронізація локального до віддаленого перед exec, запуск, синхронізація назад після exec.
5. У режимі `remote`: одноразове ініціалізування під час створення, а далі пряма робота з віддаленим
   робочим простором.

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- режими, області дії та порівняння backend
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [Sandbox CLI](/uk/cli/sandbox) -- команди `openclaw sandbox`
