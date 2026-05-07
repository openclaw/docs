---
read_when:
    - Ви створюєте локальний Plugin бекенду CLI для ШІ
    - Ви хочете зареєструвати бекенд для посилань на моделі, як-от acme-cli/model
    - Потрібно зіставити сторонній CLI із текстовим резервним виконавцем OpenClaw.
sidebarTitle: CLI backend plugins
summary: Створіть Plugin, який реєструє локальний бекенд CLI для ШІ
title: Створення бекенд-Plugin для CLI
x-i18n:
    generated_at: "2026-05-07T15:09:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Плагіни бекенду CLI дають OpenClaw змогу викликати локальний AI CLI як бекенд
текстового виведення. Бекенд відображається як префікс провайдера в посиланнях на моделі:

```text
acme-cli/acme-large
```

Використовуйте бекенд CLI, коли upstream-інтеграція вже доступна як локальна
команда, коли CLI володіє локальним станом входу, або коли CLI є корисним
резервним варіантом, якщо API-провайдери недоступні.

<Info>
  Якщо upstream-сервіс надає звичайний HTTP API моделей, натомість створіть
  [provider plugin](/uk/plugins/sdk-provider-plugins). Якщо upstream-середовище
  виконання володіє повними сесіями агентів, подіями інструментів, compaction або станом
  фонових завдань, використовуйте [agent harness](/uk/plugins/sdk-agent-harness).
</Info>

## За що відповідає плагін

Плагін бекенду CLI має три контракти:

| Контракт             | Файл                   | Призначення                                               |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Точка входу пакета   | `package.json`         | Вказує OpenClaw на модуль середовища виконання плагіна    |
| Володіння маніфестом | `openclaw.plugin.json` | Оголошує ідентифікатор бекенду до завантаження runtime    |
| Реєстрація runtime   | `index.ts`             | Викликає `api.registerCliBackend(...)` з типовими командами |

Маніфест — це метадані виявлення. Він не виконує CLI і не
реєструє поведінку runtime. Поведінка runtime починається, коли точка входу плагіна викликає
`api.registerCliBackend(...)`.

## Мінімальний плагін бекенду

<Steps>
  <Step title="Створіть метадані пакета">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Опубліковані пакети мають постачати зібрані файли JavaScript runtime. Якщо ваша вихідна
    точка входу — `./src/index.ts`, додайте `openclaw.runtimeExtensions`, що вказує на
    відповідний зібраний JavaScript-файл. Див. [Точки входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Оголосіть володіння бекендом">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` — це список володіння runtime. Він дає OpenClaw змогу автоматично завантажувати
    плагін, коли конфігурація або вибір моделі згадує `acme-cli/...`.

    `setup.cliBackends` — це поверхня налаштування за принципом descriptor-first. Додайте її, коли
    виявлення моделей, onboarding або статус мають розпізнавати бекенд без
    завантаження runtime плагіна. Використовуйте `requiresRuntime: false` лише тоді, коли цих статичних
    дескрипторів достатньо для налаштування.

  </Step>

  <Step title="Зареєструйте бекенд">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    Ідентифікатор бекенду має збігатися із записом `cliBackends` у маніфесті. Зареєстрована
    `config` є лише типовою; користувацька конфігурація в
    `agents.defaults.cliBackends.acme-cli` об’єднується з нею під час виконання.

  </Step>
</Steps>

## Форма конфігурації

`CliBackendConfig` описує, як OpenClaw має запускати й розбирати CLI:

| Поле                                      | Використання                                               |
| ----------------------------------------- | ---------------------------------------------------------- |
| `command`                                 | Ім’я бінарного файла або абсолютний шлях до команди        |
| `args`                                    | Базовий argv для нових запусків                            |
| `resumeArgs`                              | Альтернативний argv для відновлених сесій; підтримує `{sessionId}` |
| `output` / `resumeOutput`                 | Парсер: `json`, `jsonl` або `text`                         |
| `input`                                   | Транспорт підказки: `arg` або `stdin`                      |
| `modelArg`                                | Прапорець, що використовується перед ідентифікатором моделі |
| `modelAliases`                            | Зіставляє ідентифікатори моделей OpenClaw з нативними ідентифікаторами CLI |
| `sessionArg` / `sessionArgs`              | Як передавати ідентифікатор сесії                          |
| `sessionMode`                             | `always`, `existing` або `none`                            |
| `sessionIdFields`                         | JSON-поля, які OpenClaw читає з виводу CLI                 |
| `systemPromptArg` / `systemPromptFileArg` | Транспорт системної підказки                               |
| `systemPromptWhen`                        | `first`, `always` або `never`                              |
| `imageArg` / `imageMode`                  | Підтримка шляхів до зображень                              |
| `serialize`                               | Зберігати порядок запусків того самого бекенду             |
| `reliability.watchdog`                    | Налаштування тайм-ауту без виводу                          |

Надавайте перевагу найменшій статичній конфігурації, що відповідає CLI. Додавайте callback-и плагіна
лише для поведінки, яка справді належить бекенду.

## Розширені хуки бекенду

`CliBackendPlugin` також може визначати:

| Хук                                | Використання                                               |
| ---------------------------------- | ---------------------------------------------------------- |
| `normalizeConfig(config, context)` | Переписати застарілу користувацьку конфігурацію після об’єднання |
| `resolveExecutionArgs(ctx)`        | Додати прапорці в межах запиту, наприклад thinking effort  |
| `prepareExecution(ctx)`            | Створити тимчасові мости auth або конфігурації перед запуском |
| `transformSystemPrompt(ctx)`       | Застосувати фінальне CLI-специфічне перетворення системної підказки |
| `textTransforms`                   | Двонапрямні заміни підказок/виводу                         |
| `defaultAuthProfileId`             | Надавати перевагу конкретному профілю auth OpenClaw        |
| `authEpochMode`                    | Вирішувати, як зміни auth інвалідовують збережені сесії CLI |
| `nativeToolMode`                   | Оголосити, чи CLI має завжди ввімкнені нативні інструменти |
| `bundleMcp` / `bundleMcpMode`      | Увімкнути міст інструментів loopback MCP OpenClaw          |

Зберігайте ці хуки у власності провайдера. Не додавайте CLI-специфічні гілки до core, коли
хук бекенду може виразити поведінку.

## Міст інструментів MCP

Бекенди CLI типово не отримують інструменти OpenClaw. Якщо CLI може споживати
конфігурацію MCP, увімкніть це явно:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Підтримувані режими мосту:

| Режим                    | Використання                                                 |
| ------------------------ | ------------------------------------------------------------- |
| `claude-config-file`     | CLI, що приймають файл конфігурації MCP                       |
| `codex-config-overrides` | CLI, що приймають перевизначення конфігурації в argv          |
| `gemini-system-settings` | CLI, що читають налаштування MCP зі свого каталогу системних налаштувань |

Увімкніть міст лише тоді, коли CLI справді може його споживати. Якщо CLI має
власний вбудований шар інструментів, який не можна вимкнути, встановіть `nativeToolMode:
"always-on"`, щоб OpenClaw міг відмовляти закрито, коли викликач вимагає відсутності нативних інструментів.

## Користувацька конфігурація

Користувачі можуть перевизначити будь-яке типове значення бекенду:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Документуйте мінімальне перевизначення, яке, ймовірно, знадобиться користувачам. Зазвичай це лише
`command`, коли бінарний файл розташований поза `PATH`.

## Перевірка

Для вбудованих плагінів додайте сфокусований тест для builder і реєстрації
налаштування, а потім запустіть цільову тестову лінію плагіна:

```bash
pnpm test extensions/acme-cli
```

Для локальних або встановлених плагінів перевірте виявлення й один реальний запуск моделі:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Якщо бекенд підтримує зображення або MCP, додайте live smoke, що доводить ці шляхи
з реальним CLI. Не покладайтеся на статичну інспекцію для поведінки підказок, зображень, MCP або
відновлення сесій.

## Контрольний список

<Check>`package.json` має `openclaw.extensions` і зібрані runtime-точки входу для опублікованих пакетів</Check>
<Check>`openclaw.plugin.json` оголошує `cliBackends` і навмисне `activation.onStartup`</Check>
<Check>`setup.cliBackends` присутній, коли налаштування/виявлення моделей має бачити бекенд холодним</Check>
<Check>`api.registerCliBackend(...)` використовує той самий ідентифікатор бекенду, що й маніфест</Check>
<Check>Користувацькі перевизначення в `agents.defaults.cliBackends.<id>` усе ще мають пріоритет</Check>
<Check>Налаштування сесій, системної підказки, зображень і парсера виводу відповідають реальному контракту CLI</Check>
<Check>Цільові тести й принаймні один live smoke CLI доводять шлях бекенду</Check>

## Пов’язане

- [Бекенди CLI](/uk/gateway/cli-backends) - користувацька конфігурація та поведінка runtime
- [Створення плагінів](/uk/plugins/building-plugins) - основи пакетів і маніфестів
- [Огляд Plugin SDK](/uk/plugins/sdk-overview) - довідка API реєстрації
- [Маніфест плагіна](/uk/plugins/manifest) - `cliBackends` і дескриптори налаштування
- [Agent harness](/uk/plugins/sdk-agent-harness) - повні зовнішні runtime агентів
