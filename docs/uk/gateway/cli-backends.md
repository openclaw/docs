---
read_when:
    - Вам потрібен надійний резервний варіант, коли постачальники API дають збій
    - Ви запускаєте локальні AI CLI й хочете повторно використовувати їх
    - Ви хочете зрозуміти міст MCP loopback для доступу інструментів бекенду CLI
summary: 'Бекенди CLI: резервний локальний AI CLI з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-07-01T08:29:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли постачальники API недоступні,
обмежують частоту запитів або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не впроваджуються напряму**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти Gateway через міст MCP із local loopback.
- **JSONL-стримінг** для CLI, які його підтримують.
- **Сесії підтримуються** (тому наступні звернення залишаються узгодженими).
- **Зображення можна передавати наскрізно**, якщо CLI приймає шляхи до зображень.

Це задумано як **захисна сітка**, а не основний шлях. Використовуйте це, коли вам
потрібні текстові відповіді, що «завжди працюють», без залежності від зовнішніх API.

Якщо вам потрібне повноцінне середовище виконання harness з керуванням сесіями ACP, фоновими завданнями,
прив’язуванням до гілки/розмови та постійними зовнішніми сесіями кодування, натомість використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI-бекенди не є ACP.

<Tip>
  Створюєте новий бекенд-Plugin? Використовуйте
  [CLI-бекенд-Plugin](/uk/plugins/cli-backend-plugins). Ця сторінка призначена для користувачів,
  які налаштовують і експлуатують уже зареєстрований бекенд.
</Tip>

## Зручний для початківців швидкий старт

Ви можете використовувати Claude Code CLI **без жодної конфігурації** (вбудований Anthropic Plugin
реєструє стандартний бекенд):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` — це стандартний ідентифікатор агента, коли явний список агентів не налаштовано. Якщо
ви використовуєте кількох агентів, замініть його на ідентифікатор агента, який хочете запустити.

Якщо ваш Gateway працює під launchd/systemd і PATH мінімальний, додайте лише
шлях до команди:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Ось і все. Жодних ключів, жодної додаткової конфігурації автентифікації, окрім самого CLI, не потрібно.

Якщо ви використовуєте вбудований CLI-бекенд як **основного постачальника повідомлень** на
хості Gateway, OpenClaw тепер автоматично завантажує відповідний вбудований Plugin, коли ваша конфігурація
явно посилається на цей бекенд у посиланні на модель або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте CLI-бекенд до списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі дають збій:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Примітки:

- Якщо ви використовуєте `agents.defaults.models` (allowlist), там також потрібно включити моделі вашого CLI-бекенда.
- Якщо основний постачальник дає збій (автентифікація, обмеження частоти, тайм-аути), OpenClaw
  спробує CLI-бекенд наступним.

## Огляд конфігурації

Усі CLI-бекенди розміщуються в:

```
agents.defaults.cliBackends
```

Кожен запис індексується за **ідентифікатором постачальника** (наприклад, `claude-cli`, `my-cli`).
Ідентифікатор постачальника стає лівою частиною вашого посилання на модель:

```
<provider>/<model>
```

### Приклад конфігурації

```json5
{
  agents: {
    defaults: {
      cliBackends: {
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Як це працює

1. **Вибирає бекенд** на основі префікса постачальника (`claude-cli/...`).
2. **Створює системний prompt** з використанням того самого prompt OpenClaw і контексту робочого простору.
3. **Виконує CLI** з ідентифікатором сесії (якщо підтримується), щоб історія залишалася послідовною.
   Вбудований бекенд `claude-cli` підтримує процес Claude stdio активним для кожної
   сесії OpenClaw і надсилає наступні звернення через stdin stream-json.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ідентифікатори сесій** для кожного бекенда, щоб наступні звернення повторно використовували ту саму сесію CLI.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw розглядає
використання `claude -p` як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд Anthropic `claude-cli` надає перевагу нативному резолверу навичок Claude Code
для навичок OpenClaw. Коли поточний знімок навичок містить принаймні
одну вибрану навичку з матеріалізованим шляхом, OpenClaw передає тимчасовий Plugin Claude
Code з `--plugin-dir` і не додає дубльований каталог навичок OpenClaw
до доданого системного prompt. Якщо знімок не має матеріалізованого Plugin
навички, OpenClaw залишає каталог prompt як резервний варіант. Перевизначення env/API key
для навичок усе ще застосовуються OpenClaw до середовища дочірнього процесу для
запуску.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw зіставляє його
з наявною політикою exec замість додавання специфічної для Claude конфігурації політик.
Для керованих OpenClaw live-сесій Claude ефективна політика exec OpenClaw є
авторитетною: YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`) запускає Claude з
`--permission-mode bypassPermissions`, тоді як обмежувальна ефективна політика exec
запускає Claude з `--permission-mode default`. Налаштування для окремого агента
`agents.list[].tools.exec` перевизначають глобальні `tools.exec` для цього
агента. Сирі аргументи бекенда Claude все ще можуть містити `--permission-mode`, але live
запуски Claude нормалізують цей прапорець, щоб він відповідав ефективній політиці exec OpenClaw.

Вбудований бекенд Anthropic `claude-cli` також зіставляє рівні OpenClaw `/think`
із нативним прапорцем Claude Code `--effort` для рівнів, відмінних від off. `minimal` і
`low` зіставляються з `low`, `adaptive` і `medium` — з `medium`, а `high`,
`xhigh` і `max` зіставляються напряму. Інші CLI-бекенди потребують, щоб їхній власний Plugin
оголосив еквівалентний mapper argv, перш ніж `/think` зможе впливати на породжений CLI.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
має вже бути залогінений на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker-інсталяції потребують, щоб Claude Code був встановлений і мав активний вхід усередині збереженого
домашнього каталогу контейнера, а не лише на хості. Див.
[Бекенд Claude CLI у Docker](/uk/install/docker#claude-cli-backend-in-docker).

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли бінарний файл `claude`
ще не доступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **підкоманду відновлення** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для відновлень не у JSON).
- `sessionMode`:
  - `always`: завжди надсилати ідентифікатор сесії (новий UUID, якщо жодного не збережено).
  - `existing`: надсилати ідентифікатор сесії лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати ідентифікатор сесії.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб наступні звернення повторно використовували live-процес Claude, поки
  він активний. Тепер warm stdio є стандартним режимом, зокрема для користувацьких конфігурацій,
  які не вказують поля транспорту. Якщо Gateway перезапускається або процес у простої
  завершується, OpenClaw відновлює роботу зі збереженого ідентифікатора сесії Claude. Збережені
  ідентифікатори сесій перевіряються щодо наявної придатної для читання стенограми проєкту перед
  відновленням, тому фантомні прив’язки очищуються з `reason=transcript-missing`
  замість тихого запуску нової сесії Claude CLI з `--resume`.
- Live-сесії Claude зберігають обмежені захисні межі виводу JSONL. Стандартні значення дозволяють до
  8 MiB і 20 000 сирих рядків JSONL на звернення. Насичені інструментами звернення Claude можуть підвищити
  їх для кожного бекенда за допомогою
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  і `maxTurnLines`; OpenClaw обмежує ці налаштування до 64 MiB і 100 000
  рядків.
- Збережені CLI-сесії — це безперервність, що належить постачальнику. Неявне щоденне
  скидання сесії їх не обриває; `/reset` і явні політики `session.reset` все ще
  це роблять.
- Нові CLI-сесії зазвичай повторно засіваються лише зі зведення Compaction OpenClaw
  плюс хвоста після Compaction. Щоб відновлювати короткі сесії, які стають недійсними
  до Compaction, бекенд може явно ввімкнути
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw усе одно тримає повторне засівання сирої
  стенограми обмеженим і обмежує його безпечними інвалідаціями, такими як відсутні
  стенограми CLI, зміни системного prompt/MCP або повторна спроба через session-expired; зміни
  auth-профілю або credential-epoch ніколи не засівають історію сирої стенограми повторно.

Примітки щодо серіалізації:

- `serialize: true` зберігає порядок запусків у тій самій смузі.
- Більшість CLI серіалізуються в одній смузі постачальника.
- OpenClaw відкидає повторне використання збереженої CLI-сесії, коли вибрана ідентичність автентифікації змінюється,
  включно зі зміненим ідентифікатором auth-профілю, статичним API key, статичним токеном або ідентичністю облікового запису OAuth,
  коли CLI її надає. Ротація access і refresh токенів OAuth не обриває збережену CLI-сесію. Якщо CLI не надає
  стабільний ідентифікатор облікового запису OAuth, OpenClaw дозволяє цьому CLI самостійно застосовувати дозволи відновлення.

## Резервна преамбула із сесій claude-cli

Коли спроба `claude-cli` перемикається на не-CLI кандидат у
[`agents.defaults.model.fallbacks`](/uk/concepts/model-failover), OpenClaw засіває
наступну спробу контекстною преамбулою, зібраною з локальної
JSONL-стенограми Claude Code у `~/.claude/projects/`. Без цього засівання резервний
постачальник стартував би холодно, бо власна стенограма сесії OpenClaw порожня
для запусків `claude-cli`.

- Преамбула надає перевагу найновішому зведенню `/compact` або маркеру `compact_boundary`,
  потім додає найсвіжіші звернення після межі до бюджету
  символів. Звернення до межі відкидаються, бо зведення вже представляє
  їх.
- Блоки інструментів об’єднуються в компактні підказки `(tool call: name)` і
  `(tool result: …)`, щоб чесно тримати бюджет prompt. Зведення
  позначається `(truncated)`, якщо воно переповнюється.
- Резервні переходи з `claude-cli` на `claude-cli` у межах того самого постачальника покладаються на власний
  `--resume` Claude і пропускають преамбулу.
- Засівання повторно використовує наявну перевірку шляху до файлу сесії Claude, тому
  довільні шляхи не можна прочитати.

## Зображення (наскрізне передавання)

Якщо ваш CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення у тимчасові файли. Якщо `imageArg` задано, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (ін’єкція шляхів), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (стандартно) намагається розібрати JSON і витягти текст + ідентифікатор сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response` і використання
  зі `stats`, коли `usage` відсутній або порожній. Вбудоване стандартне значення Gemini CLI
  використовує `stream-json`, але старі перевизначення `--output-format json` все ще використовують
  JSON-парсер.
- `output: "jsonl"` розбирає потоки JSONL і витягує фінальне повідомлення агента плюс
  ідентифікатори сесій, коли вони наявні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (типово) передає промпт як останній аргумент CLI.
- `input: "stdin"` надсилає промпт через stdin.
- Якщо промпт дуже довгий і задано `maxPromptArgChars`, використовується stdin.

## Типові значення (належать plugin)

Типові значення bundled CLI-бекенда розміщені в їхньому власному plugin. Наприклад,
Anthropic володіє `claude-cli`, а Google володіє `google-gemini-cli`. Запуски агента OpenAI Codex
використовують harness app-server Codex через `openai/*`; OpenClaw більше
не реєструє bundled бекенд `codex-cli`.

Bundled plugin Anthropic реєструє типове значення для `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Bundled plugin Google також реєструє типове значення для `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Передумова: локальний Gemini CLI має бути встановлений і доступний як
`gemini` у `PATH` (`brew install gemini-cli` або
`npm install -g @google/gemini-cli`).

Примітки щодо виводу Gemini CLI:

- Типовий парсер `stream-json` читає події `message` асистента, події інструментів,
  фінальне використання `result` і фатальні події помилок Gemini.
- Якщо ви перевизначите аргументи Gemini на `--output-format json`, OpenClaw нормалізує цей
  бекенд назад до `output: "json"` і читає текст відповіді з поля JSON `response`.
- Використання повертається до `stats`, коли `usage` відсутній або порожній.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (типово: абсолютний шлях `command`).

## Типові значення, що належать plugin

Типові значення CLI-бекенда тепер є частиною поверхні plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенда стає префіксом провайдера в посиланнях на моделі.
- Користувацька конфігурація в `agents.defaults.cliBackends.<id>` досі перевизначає типове значення plugin.
- Очищення конфігурації, специфічне для бекенда, залишається власністю plugin через необов'язковий
  hook `normalizeConfig`.

Plugins, яким потрібні невеликі compatibility shims для промптів/повідомлень, можуть оголосити
двонапрямні текстові перетворення без заміни провайдера або CLI-бекенда:

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

`input` переписує системний промпт і користувацький промпт, передані до CLI. `output`
переписує потоковий текст асистента та розібраний фінальний текст до того, як OpenClaw обробить
власні контрольні маркери й доставку в канал. Для викликів моделей, підтриманих провайдером,
`output` також відновлює рядкові значення всередині структурованих аргументів викликів інструментів після
відновлення потоку й перед виконанням інструменту. Сирі JSON-фрагменти провайдера залишаються
незмінними; споживачам слід використовувати структуроване partial-, end- або result-навантаження.

Для CLI, які емітують специфічні для провайдера події JSONL, задайте `jsonlDialect` у конфігурації
цього бекенда. Підтримувані діалекти: `claude-stream-json` для потоків, сумісних із Claude
Code, і `gemini-stream-json` для подій Gemini CLI `stream-json`.

## Власність native compaction

Деякі CLI-бекенди запускають агента, який ущільнює **власний** transcript, тому OpenClaw не повинен
запускати для них свій запобіжний summarizer - це конфліктує з власною
Compaction бекенда й може жорстко зірвати turn.

`claude-cli` не має harness endpoint - Claude Code ущільнює внутрішньо, - тому він оголошує
`ownsNativeCompaction: true`, а OpenClaw повертає no-op зі шляху compaction.
Натомість native-harness сесії, як-от Codex, і далі маршрутизуються до endpoint compaction свого harness.

Оскільки бекенд володіє compaction, старий тимчасовий обхідний шлях із налаштуванням
`contextTokens: 1_000_000` лише для того, щоб запобіжник OpenClaw не спрацював на
сесії claude-cli, **більше не потрібен** - opt-out замінює його.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Оголошуйте `ownsNativeCompaction` лише для бекенда, який справді володіє своєю compaction: він
має надійно обмежувати власний transcript, коли наближається до свого context window, і зберігати
відновлювану сесію (наприклад, `--resume` / `--session-id`); інакше відкладена сесія може
залишатися понад бюджет. Сесії з відповідним `agentHarnessId` усе ще маршрутизуються до harness endpoint.

## Оверлеї bundle MCP

CLI-бекенди **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенерований оверлей конфігурації MCP через `bundleMcp: true`.

Поточна bundled поведінка:

- `claude-cli`: згенерований строгий файл конфігурації MCP
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- породжує HTTP MCP-сервер loopback, який надає gateway tools процесу CLI
- автентифікує bridge за допомогою токена на сесію (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів контекстом поточної сесії, облікового запису й каналу
- завантажує ввімкнені bundle-MCP сервери для поточного workspace
- об'єднує їх із будь-якою наявною формою конфігурації/налаштувань MCP бекенда
- переписує конфігурацію запуску з використанням режиму інтеграції, що належить бекенду, з owning extension

Якщо MCP-сервери не ввімкнені, OpenClaw усе одно інжектить строгу конфігурацію, коли
бекенд вмикає bundle MCP, щоб фонові запуски залишалися ізольованими.

Сесійні bundled MCP runtimes кешуються для повторного використання в межах сесії, а потім
прибираються після `mcp.sessionIdleTtlMs` мілісекунд простою (типово 10
хвилин; задайте `0`, щоб вимкнути). Одноразові embedded runs, як-от auth probes,
генерація slug і active-memory recall, запитують очищення наприкінці запуску, щоб stdio
children і потоки Streamable HTTP/SSE не переживали запуск.

## Обмеження історії reseed

Коли свіжа CLI-сесія засівається з попереднього transcript OpenClaw (наприклад
після повторної спроби `session_expired`), відрендерений блок
`<conversation_history>` обмежується, щоб reseed-промпти не
розросталися надмірно. Типове значення: `12288` символів (приблизно 3000 токенів).

Бекенди Claude CLI автоматично використовують більший ліміт, виведений із визначеного
рівня контексту Claude. Стандартні запуски Claude з 200K токенів зберігають більший фрагмент
transcript, а запуски Claude з 1M токенів зберігають ще більший фрагмент, тоді як інші CLI
бекенди зберігають консервативне типове значення.

- Ліміт керує лише блоком попередньої історії в reseed-промпті. Ліміти виводу
  live-сесії налаштовуються окремо в `reliability.outputLimits`
  (див. [Сесії](#sessions)).

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не інжектить виклики інструментів у
  протокол CLI-бекенда. Бекенди бачать gateway tools лише тоді, коли вмикають
  `bundleMcp: true`.
- **Потокова передача специфічна для бекенда.** Деякі бекенди передають JSONL потоково; інші буферизують
  до завершення.
- **Структуровані виводи** залежать від JSON-формату CLI.

## Усунення несправностей

- **CLI не знайдено**: задайте `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сесії**: переконайтеся, що `sessionArg` задано, а `sessionMode` не є
  `none`.
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов'язане

- [Runbook Gateway](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
