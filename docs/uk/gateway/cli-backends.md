---
read_when:
    - Вам потрібен надійний резервний варіант, коли постачальники API дають збій
    - Ви запускаєте Codex CLI або інші локальні CLI зі ШІ та хочете повторно використовувати їх
    - Ви хочете зрозуміти loopback-міст MCP для доступу до інструментів бекенду CLI
summary: 'Бекенди CLI: локальний резервний варіант CLI для ШІ з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-05-02T08:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли API-провайдери недоступні,
обмежені за лімітом запитів або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не ін’єктуються напряму**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти gateway через loopback MCP-міст.
- **JSONL-стримінг** для CLI, які його підтримують.
- **Сесії підтримуються** (тому подальші ходи залишаються узгодженими).
- **Зображення можна передавати наскрізно**, якщо CLI приймає шляхи до зображень.

Це розроблено як **запобіжний механізм**, а не як основний шлях. Використовуйте його, коли вам
потрібні текстові відповіді, що «завжди працюють», без залежності від зовнішніх API.

Якщо вам потрібне повноцінне середовище виконання harness із керуванням сесіями ACP, фоновими завданнями,
прив’язкою потоків/розмов і постійними зовнішніми сесіями кодування, натомість використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI-бекенди не є ACP.

## Простий швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (вбудований OpenAI Plugin
реєструє стандартний бекенд):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Якщо ваш gateway працює під launchd/systemd і PATH мінімальний, додайте лише
шлях до команди:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Це все. Жодних ключів, жодної додаткової конфігурації автентифікації, окрім самого CLI, не потрібно.

Якщо ви використовуєте вбудований CLI-бекенд як **основного провайдера повідомлень** на
gateway-хості, OpenClaw тепер автоматично завантажує вбудований Plugin-власник, коли ваша конфігурація
явно посилається на цей бекенд у посиланні на модель або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте CLI-бекенд до списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі не спрацюють:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Примітки:

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також маєте включити туди моделі свого CLI-бекенда.
- Якщо основний провайдер не спрацює (автентифікація, ліміти запитів, тайм-аути), OpenClaw
  спробує CLI-бекенд наступним.

## Огляд конфігурації

Усі CLI-бекенди розташовані в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **ідентифікатора провайдера** (наприклад, `codex-cli`, `my-cli`).
Ідентифікатор провайдера стає лівою частиною вашого посилання на модель:

```
<provider>/<model>
```

### Приклад конфігурації

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Як це працює

1. **Вибирає бекенд** на основі префікса провайдера (`codex-cli/...`).
2. **Створює системний промпт** з використанням того самого промпта OpenClaw і контексту workspace.
3. **Виконує CLI** з ідентифікатором сесії (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує процес Claude stdio активним для кожної
   сесії OpenClaw і надсилає подальші ходи через stream-json stdin.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ідентифікатори сесій** для кожного бекенда, щоб подальші ходи повторно використовували ту саму CLI-сесію.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд OpenAI `codex-cli` передає системний промпт OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапор у стилі Claude
`--append-system-prompt`, тому OpenClaw записує зібраний промпт у
тимчасовий файл для кожної нової сесії Codex CLI.

Вбудований бекенд Anthropic `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому системному промпті та
тимчасовий Claude Code Plugin, переданий із `--plugin-dir`. Plugin містить
лише придатні Skills для цього агента/сесії, тому нативний резолвер Skills Claude Code
бачить той самий відфільтрований набір, який OpenClaw інакше оголосив би в
промпті. Перевизначення env/API-ключів Skills OpenClaw все одно застосовує до
середовища дочірнього процесу для запуску.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw відображає його
на наявну політику виконання замість додавання специфічної для Claude конфігурації: коли
ефективна запитана політика виконання є YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`), OpenClaw додає `--permission-mode bypassPermissions`.
Налаштування `agents.list[].tools.exec` для окремого агента перевизначають глобальні `tools.exec` для
цього агента. Щоб примусово задати інший режим Claude, встановіть явні сирі аргументи бекенда,
наприклад `--permission-mode default` або `--permission-mode acceptEdits` у
`agents.defaults.cliBackends.claude-cli.args` і відповідних `resumeArgs`.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
уже має бути авторизований на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли бінарний файл `claude`
ще не доступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ідентифікатор потрібно вставити
  в кілька прапорів.
- Якщо CLI використовує **підкоманду відновлення** з іншими прапорами, задайте
  `resumeArgs` (замінює `args` під час відновлення) і за потреби `resumeOutput`
  (для відновлень не у форматі JSON).
- `sessionMode`:
  - `always`: завжди надсилати ідентифікатор сесії (новий UUID, якщо збереженого немає).
  - `existing`: надсилати ідентифікатор сесії лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати ідентифікатор сесії.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб подальші ходи повторно використовували активний live-процес Claude.
  Теплий stdio тепер є стандартом, зокрема для користувацьких конфігурацій,
  які не вказують транспортні поля. Якщо Gateway перезапускається або idle-процес
  завершується, OpenClaw відновлюється зі збереженого ідентифікатора сесії Claude. Збережені
  ідентифікатори сесій перевіряються щодо наявного читабельного project transcript перед
  відновленням, тому фантомні прив’язки очищаються з `reason=transcript-missing`
  замість мовчазного старту нової сесії Claude CLI під `--resume`.
- Live-сесії Claude зберігають обмежені захисні ліміти JSONL-виводу. Стандартні значення дозволяють до
  8 MiB і 20 000 сирих JSONL-рядків на хід. Ходи Claude з великою кількістю інструментів можуть збільшити
  їх для кожного бекенда через
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  і `maxTurnLines`; OpenClaw обмежує ці налаштування до 64 MiB і 100 000
  рядків.
- Збережені CLI-сесії є безперервністю, якою володіє провайдер. Неявне щоденне скидання сесії
  їх не перериває; `/reset` і явні політики `session.reset` усе ще
  діють.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків у тому самому lane.
- Більшість CLI серіалізуються в одному lane провайдера.
- OpenClaw відкидає повторне використання збереженої CLI-сесії, коли змінюється вибрана автентифікаційна ідентичність,
  зокрема змінений ідентифікатор auth profile, статичний API-ключ, статичний токен або ідентичність OAuth-акаунта,
  якщо CLI її надає. Ротація OAuth access і refresh token не перериває збережену CLI-сесію. Якщо CLI не надає
  стабільний ідентифікатор OAuth-акаунта, OpenClaw дозволяє цьому CLI самостійно застосовувати дозволи відновлення.

## Резервний prelude із сесій claude-cli

Коли спроба `claude-cli` переходить на резервного кандидата, що не є CLI, у
[`agents.defaults.model.fallbacks`](/uk/concepts/model-failover), OpenClaw ініціалізує
наступну спробу контекстним prelude, отриманим із локального
JSONL-транскрипту Claude Code в `~/.claude/projects/`. Без цього seed резервний
провайдер стартував би з порожнього контексту, оскільки власний транскрипт сесії OpenClaw порожній
для запусків `claude-cli`.

- Prelude віддає перевагу найновішому резюме `/compact` або маркеру `compact_boundary`,
  а потім додає найостанніші ходи після boundary у межах бюджету символів.
  Ходи до boundary відкидаються, бо резюме вже їх представляє.
- Tool blocks згортаються до компактних підказок `(tool call: name)` і
  `(tool result: …)`, щоб чесно утримувати бюджет промпта. Резюме
  позначається як `(truncated)`, якщо воно переповнюється.
- Резервні переходи з `claude-cli` на `claude-cli` у межах того самого провайдера покладаються на власний
  `--resume` Claude і пропускають prelude.
- Seed повторно використовує наявну валідацію шляху до session-file Claude, тому
  довільні шляхи не можуть бути прочитані.

## Зображення (наскрізне передавання)

Якщо ваш CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення у тимчасові файли. Якщо `imageArg` задано, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у промпт (ін’єкція шляху), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (за замовчуванням) намагається розібрати JSON і витягти текст + ідентифікатор сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response` і
  usage зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає JSONL-потоки (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента разом з ідентифікаторами сесії,
  якщо вони наявні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (за замовчуванням) передає промпт як останній аргумент CLI.
- `input: "stdin"` надсилає промпт через stdin.
- Якщо промпт дуже довгий і `maxPromptArgChars` задано, використовується stdin.

## Стандартні значення (належать Plugin)

Вбудований OpenAI Plugin також реєструє стандартні значення для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Google Plugin також реєструє стандартні значення для `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Передумова: локальний Gemini CLI має бути встановлений і доступний як
`gemini` у `PATH` (`brew install gemini-cli` або
`npm install -g @google/gemini-cli`).

Примітки щодо JSON Gemini CLI:

- Текст відповіді читається з JSON-поля `response`.
- Usage використовує fallback до `stats`, коли `usage` відсутній або порожній.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить input tokens із
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (поширений випадок: абсолютний шлях `command`).

## Стандартні значення, що належать Plugin

Стандартні значення CLI-бекендів тепер є частиною поверхні Plugin:

- Plugins реєструють їх за допомогою `api.registerCliBackend(...)`.
- Backend `id` стає префіксом провайдера в посиланнях на моделі.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` досі перевизначає стандартне значення Plugin.
- Очищення конфігурації, специфічної для backend, залишається у власності Plugin через необов’язковий hook
  `normalizeConfig`.

Plugins, яким потрібні невеликі шими сумісності prompt/message, можуть оголошувати
двонапрямні текстові перетворення без заміни провайдера або CLI backend:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` переписує системний prompt і prompt користувача, передані до CLI. `output`
переписує потокові дельти помічника та розібраний фінальний текст до того, як OpenClaw обробить
власні керівні маркери й доставку в канал.

Для CLI, що виводять JSONL, сумісний із Claude Code stream-json, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього backend.

## Об’єднання MCP-накладень

CLI backends **не** отримують виклики інструментів OpenClaw напряму, але backend може
увімкнути згенероване накладення конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований файл суворої конфігурації MCP
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`; згенерований
  OpenClaw loopback server позначено режимом схвалення інструментів на рівні сервера Codex,
  щоб MCP-виклики не могли зупинитися на локальних запитах схвалення
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли об’єднання MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP server, який відкриває gateway tools для процесу CLI
- автентифікує міст за допомогою токена на сеанс (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточним сеансом, обліковим записом і контекстом каналу
- завантажує увімкнені bundle-MCP servers для поточного workspace
- об’єднує їх із будь-якою наявною формою backend MCP config/settings
- переписує конфігурацію запуску, використовуючи режим інтеграції, що належить backend, із власницького Plugin

Якщо MCP servers не ввімкнено, OpenClaw все одно впроваджує сувору конфігурацію, коли
backend вмикає bundle MCP, щоб фонові запуски залишалися ізольованими.

Сеансові вбудовані MCP runtimes кешуються для повторного використання в межах сеансу, а потім
очищаються після `mcp.sessionIdleTtlMs` мілісекунд простою (за замовчуванням 10
хвилин; задайте `0`, щоб вимкнути). Одноразові вбудовані запуски, як-от auth probes,
slug generation і active-memory recall request cleanup, завершуються наприкінці запуску, щоб stdio
children і Streamable HTTP/SSE streams не жили довше за сам запуск.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не впроваджує виклики інструментів у
  протокол CLI backend. Backends бачать gateway tools лише тоді, коли вмикають
  `bundleMcp: true`.
- **Streaming залежить від backend.** Деякі backends транслюють JSONL; інші буферизують
  до завершення.
- **Структуровані виводи** залежать від формату JSON у CLI.
- **Сеанси Codex CLI** поновлюються через текстовий вивід (без JSONL), який менш
  структурований, ніж початковий запуск `--json`. Сеанси OpenClaw все одно працюють
  нормально.

## Усунення несправностей

- **CLI не знайдено**: задайте `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сеансу**: переконайтеся, що `sessionArg` задано, а `sessionMode` не є
  `none` (Codex CLI наразі не може поновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов’язане

- [Gateway runbook](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
