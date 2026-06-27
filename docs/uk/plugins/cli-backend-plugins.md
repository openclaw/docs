---
read_when:
    - Ви створюєте локальний Plugin бекенду CLI для ШІ
    - Ви хочете зареєструвати бекенд для посилань на моделі, як-от acme-cli/model
    - Потрібно зіставити сторонній CLI із текстовим резервним засобом запуску OpenClaw
sidebarTitle: CLI backend plugins
summary: Створіть plugin, який реєструє локальний бекенд AI CLI
title: Створення backend Plugin для CLI
x-i18n:
    generated_at: "2026-06-27T17:48:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Плагіни бекенду CLI дають OpenClaw змогу викликати локальний AI CLI як бекенд текстового виведення. Бекенд відображається як префікс провайдера в посиланнях на моделі:

```text
acme-cli/acme-large
```

Використовуйте бекенд CLI, коли вищестояща інтеграція вже доступна як локальна команда, коли CLI володіє локальним станом входу або коли CLI є корисним резервним варіантом, якщо API-провайдери недоступні.

<Info>
  Якщо вищестоящий сервіс надає звичайний HTTP API моделей, натомість напишіть
  [плагін провайдера](/uk/plugins/sdk-provider-plugins). Якщо вищестояще середовище виконання володіє повними сесіями агентів, подіями інструментів, compaction або станом фонових завдань, використовуйте [agent harness](/uk/plugins/sdk-agent-harness).
</Info>

## Чим володіє плагін

Плагін бекенду CLI має три контракти:

| Контракт             | Файл                   | Призначення                                                   |
| -------------------- | ---------------------- | ------------------------------------------------------------- |
| Точка входу пакета   | `package.json`         | Вказує OpenClaw на модуль середовища виконання плагіна        |
| Володіння маніфестом | `openclaw.plugin.json` | Оголошує ідентифікатор бекенду до завантаження runtime        |
| Реєстрація runtime   | `index.ts`             | Викликає `api.registerCliBackend(...)` з типовими командами   |

Маніфест — це метадані для виявлення. Він не виконує CLI і не реєструє поведінку runtime. Поведінка runtime починається, коли точка входу плагіна викликає `api.registerCliBackend(...)`.

## Мінімальний плагін бекенду

<Steps>
  <Step title="Create package metadata">
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

    Опубліковані пакети мають постачати зібрані JavaScript-файли runtime. Якщо ваша вихідна точка входу — `./src/index.ts`, додайте `openclaw.runtimeExtensions`, що вказує на відповідний зібраний JavaScript-файл. Див. [Точки входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
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

    `cliBackends` — це список володіння runtime. Він дає OpenClaw змогу автоматично завантажувати плагін, коли конфігурація або вибір моделі згадує `acme-cli/...`.

    `setup.cliBackends` — це поверхня налаштування, що спершу використовує дескриптор. Додайте її, коли виявлення моделей, onboarding або статус мають розпізнавати бекенд без завантаження runtime плагіна. Використовуйте `requiresRuntime: false` лише тоді, коли цих статичних дескрипторів достатньо для налаштування.

  </Step>

  <Step title="Register the backend">
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

    Ідентифікатор бекенду має збігатися із записом `cliBackends` у маніфесті. Зареєстрований `config` — лише типовий; користувацька конфігурація в `agents.defaults.cliBackends.acme-cli` об’єднується з ним у runtime.

  </Step>
</Steps>

## Форма конфігурації

`CliBackendConfig` описує, як OpenClaw має запускати й аналізувати CLI:

| Поле                                      | Використання                                                |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Назва бінарного файлу або абсолютний шлях до команди        |
| `args`                                    | Базовий argv для нових запусків                             |
| `resumeArgs`                              | Альтернативний argv для відновлених сесій; підтримує `{sessionId}` |
| `output` / `resumeOutput`                 | Парсер: `json`, `jsonl` або `text`                          |
| `input`                                   | Передавання промпта: `arg` або `stdin`                      |
| `modelArg`                                | Прапорець, що використовується перед ідентифікатором моделі |
| `modelAliases`                            | Зіставляє ідентифікатори моделей OpenClaw з нативними ідентифікаторами CLI |
| `sessionArg` / `sessionArgs`              | Як передати ідентифікатор сесії                             |
| `sessionMode`                             | `always`, `existing` або `none`                             |
| `sessionIdFields`                         | JSON-поля, які OpenClaw читає з виводу CLI                  |
| `systemPromptArg` / `systemPromptFileArg` | Передавання системного промпта                              |
| `systemPromptWhen`                        | `first`, `always` або `never`                               |
| `imageArg` / `imageMode`                  | Підтримка шляху до зображення                               |
| `serialize`                               | Зберігає порядок запусків того самого бекенду               |
| `reliability.watchdog`                    | Налаштування тайм-ауту без виводу                           |

Надавайте перевагу найменшій статичній конфігурації, що відповідає CLI. Додавайте callback-и плагіна лише для поведінки, яка справді належить бекенду.

## Розширені хуки бекенду

`CliBackendPlugin` також може визначати:

| Хук                                | Використання                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Переписує застарілу користувацьку конфігурацію після об’єднання           |
| `resolveExecutionArgs(ctx)`        | Додає прапорці в межах запиту, як-от thinking effort або ізоляцію побічного питання |
| `prepareExecution(ctx)`            | Створює тимчасові мости автентифікації або конфігурації перед запуском     |
| `transformSystemPrompt(ctx)`       | Застосовує фінальне перетворення системного промпта, специфічне для CLI    |
| `textTransforms`                   | Двонапрямні заміни промпта/виводу                                          |
| `defaultAuthProfileId`             | Надає перевагу конкретному профілю автентифікації OpenClaw                 |
| `authEpochMode`                    | Визначає, як зміни автентифікації інвалідовують збережені сесії CLI        |
| `nativeToolMode`                   | Оголошує, чи CLI має завжди ввімкнені нативні інструменти                  |
| `sideQuestionToolMode`             | Оголошує вимкнені нативні інструменти для побічних питань `/btw`           |
| `bundleMcp` / `bundleMcpMode`      | Вмикає міст OpenClaw для інструментів MCP через loopback                   |
| `ownsNativeCompaction`             | Бекенд володіє власним compaction — OpenClaw відкладає                     |

Залишайте ці хуки у володінні провайдера. Не додавайте специфічні для CLI гілки в core, коли хук бекенду може виразити поведінку.

`ctx.executionMode` має значення `"agent"` для звичайних ходів і `"side-question"` для ефемерних викликів `/btw`. Використовуйте його, коли CLI потребує різних одноразових прапорців, як-от вимкнення нативних інструментів, збереження сесії або поведінки відновлення для BTW. Якщо бекенд зазвичай має `nativeToolMode: "always-on"`, але його argv для побічних питань надійно вимикає ці інструменти, також задайте `sideQuestionToolMode: "disabled"`; інакше OpenClaw fail closed, коли BTW потребує запуску CLI без інструментів.

### `ownsNativeCompaction`: відмова від compaction OpenClaw

Якщо ваш бекенд запускає агента, який стискає **власний** transcript, задайте `ownsNativeCompaction: true`, щоб захисний summarizer OpenClaw ніколи не запускався для його сесій — життєвий цикл compaction CLI повертає no-op, і хід продовжується. `claude-cli` оголошує це, бо Claude Code стискає внутрішньо без endpoint harness. Сесії native-harness, як-от Codex, натомість продовжують маршрутизуватися до свого endpoint compaction harness.

**Оголошуйте це лише тоді, коли виконуються всі наведені нижче умови**, інакше відкладена сесія, що перевищує бюджет, може залишитися понад бюджетом або застаріти (OpenClaw більше не рятує її):

- бекенд надійно стискає або обмежує власний transcript, коли він наближається до свого вікна;
- він зберігає відновлювану сесію, щоб стиснений стан переживав ходи
  (наприклад, `--resume` / `--session-id`);
- це не сесія compaction native-harness — сесії з відповідним `agentHarnessId` натомість маршрутизуються до endpoint harness.

## Міст інструментів MCP

Бекенди CLI за замовчуванням не отримують інструменти OpenClaw. Якщо CLI може споживати конфігурацію MCP, увімкніть це явно:

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

| Режим                    | Використання                                                   |
| ------------------------ | -------------------------------------------------------------- |
| `claude-config-file`     | CLI, які приймають файл конфігурації MCP                       |
| `codex-config-overrides` | CLI, які приймають перевизначення конфігурації в argv          |
| `gemini-system-settings` | CLI, які читають налаштування MCP зі свого каталогу системних налаштувань |

Вмикайте міст лише тоді, коли CLI справді може його споживати. Якщо CLI має власний вбудований шар інструментів, який не можна вимкнути, задайте `nativeToolMode:
"always-on"`, щоб OpenClaw міг fail closed, коли викликач потребує відсутності нативних інструментів.

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

Задокументуйте мінімальне перевизначення, яке користувачам, імовірно, знадобиться. Зазвичай це лише `command`, коли бінарний файл розташований поза `PATH`.

## Перевірка

Для вбудованих плагінів додайте сфокусований тест для builder і реєстрації setup, а потім запустіть цільову тестову лінію плагіна:

```bash
pnpm test extensions/acme-cli
```

Для локальних або встановлених плагінів перевірте виявлення та один реальний запуск моделі:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Якщо бекенд підтримує зображення або MCP, додайте живий smoke-тест, який підтверджує ці шляхи з реальним CLI. Не покладайтеся на статичну інспекцію для поведінки prompt, зображень, MCP або відновлення сесії.

## Контрольний список

<Check>`package.json` має `openclaw.extensions` і зібрані runtime-записи для опублікованих пакетів</Check>
<Check>`openclaw.plugin.json` оголошує `cliBackends` і навмисний `activation.onStartup`</Check>
<Check>`setup.cliBackends` присутній, коли setup/виявлення моделі має бачити бекенд у холодному стані</Check>
<Check>`api.registerCliBackend(...)` використовує той самий id бекенда, що й маніфест</Check>
<Check>Перевизначення користувача в `agents.defaults.cliBackends.<id>` все ще мають пріоритет</Check>
<Check>Налаштування сесії, системного prompt, зображень і парсера виводу відповідають реальному контракту CLI</Check>
<Check>Цільові тести та принаймні один живий CLI smoke-тест підтверджують шлях бекенда</Check>

## Пов’язане

- [CLI-бекенди](/uk/gateway/cli-backends) - конфігурація користувача та поведінка runtime
- [Створення плагінів](/uk/plugins/building-plugins) - основи пакетів і маніфестів
- [Огляд Plugin SDK](/uk/plugins/sdk-overview) - довідник API реєстрації
- [Маніфест Plugin](/uk/plugins/manifest) - `cliBackends` і дескриптори setup
- [Середовище запуску агента](/uk/plugins/sdk-agent-harness) - повні runtime для зовнішніх агентів
