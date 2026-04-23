---
read_when:
    - Ви хочете надійний fallback, коли API-провайдери виходять з ладу
    - Ви запускаєте Codex CLI або інші локальні AI CLI і хочете використовувати їх повторно
    - Ви хочете зрозуміти міст MCP loopback для доступу інструментів backend CLI
summary: 'CLI backends: локальний fallback AI CLI з необов’язковим мостом інструментів MCP'
title: CLI backends
x-i18n:
    generated_at: "2026-04-23T20:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 86594b886c259df68591223e106c7507ab802321aaedebc9b243793c4f453388
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI backends (fallback runtime)

OpenClaw може запускати **локальні AI CLI** як **text-only fallback**, коли API-провайдери недоступні,
обмежені за rate limit або тимчасово працюють некоректно. Це навмисно консервативний режим:

- **Інструменти OpenClaw не впроваджуються напряму**, але backends із `bundleMcp: true`
  можуть отримувати інструменти gateway через loopback MCP bridge.
- **JSONL Streaming** для CLI, які це підтримують.
- **Підтримуються сесії** (щоб подальші ходи залишалися узгодженими).
- **Зображення можна передавати наскрізно**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не основний шлях. Використовуйте це, коли вам
потрібні відповіді у форматі «працює завжди» без залежності від зовнішніх API.

Якщо вам потрібен повноцінний runtime harness із керуванням сесіями ACP, фоновими завданнями,
прив’язкою до thread/conversation і постійними зовнішніми coding sessions, використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI backends — це не ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (bundled OpenAI Plugin
реєструє типовий backend):

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

І все. Не потрібні ні ключі, ні додаткова конфігурація auth, окрім тієї, що вже є в самому CLI.

Якщо ви використовуєте bundled CLI backend як **основного провайдера повідомлень** на
хості gateway, OpenClaw тепер автоматично завантажує Plugin-власник, коли ваша конфігурація
явно посилається на цей backend у model ref або в
`agents.defaults.cliBackends`.

## Використання як fallback

Додайте CLI backend до списку fallback, щоб він запускався лише тоді, коли основні моделі дають збій:

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

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також маєте включити туди моделі вашого CLI backend.
- Якщо основний провайдер виходить з ладу (auth, rate limits, timeouts), OpenClaw
  спробує наступним саме CLI backend.

## Огляд конфігурації

Усі CLI backends розміщуються в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **provider id** (наприклад, `codex-cli`, `my-cli`).
provider id стає лівою частиною вашого model ref:

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
          // CLI у стилі Codex можуть замість цього вказувати на файл prompt:
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

1. **Вибирає backend** на основі префікса провайдера (`codex-cli/...`).
2. **Будує системний prompt** з використанням того самого prompt OpenClaw + контексту робочого простору.
3. **Виконує CLI** з ID сесії (якщо це підтримується), щоб історія залишалася узгодженою.
   Bundled backend `claude-cli` підтримує процес Claude stdio активним для кожної
   сесії OpenClaw і надсилає подальші ходи через stdin stream-json.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ID сесій** для кожного backend, тож подальші ходи повторно використовують ту саму CLI-сесію.

<Note>
Bundled backend Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож OpenClaw розглядає
використання `claude -p` як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Bundled backend OpenAI `codex-cli` передає системний prompt OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапорця
`--append-system-prompt` у стилі Claude, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Bundled backend Anthropic `claude-cli` отримує snapshot Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому системному prompt і
тимчасовий Plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише придатні Skills для цього агента/сесії, тож вбудований засіб визначення Skills у Claude Code бачить той самий відфільтрований набір, який OpenClaw інакше показав би в prompt. Перевизначення env/API key для Skills усе одно застосовуються OpenClaw до середовища дочірнього процесу для цього запуску.

Перш ніж OpenClaw зможе використовувати bundled backend `claude-cli`, сам Claude Code
має вже бути авторизований на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли бінарний файл `claude`
ще не доступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (заповнювач `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **resume subcommand** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для відновлень не у форматі JSON).
- `sessionMode`:
  - `always`: завжди надсилати ID сесії (новий UUID, якщо нічого не збережено).
  - `existing`: надсилати ID сесії лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати ID сесії.
- `claude-cli` типово використовує `liveSession: "claude-stdio"`, `output: "jsonl"`
  і `input: "stdin"`, щоб подальші ходи повторно використовували активний процес Claude, поки
  він працює. Тепле stdio тепер є типовим, включно з користувацькими конфігураціями,
  які не вказують полів транспорту. Якщо Gateway перезапускається або процес у стані idle
  завершується, OpenClaw відновлюється зі збереженого ID сесії Claude. Збережені ID сесій
  перевіряються на наявність доступного для читання transcript проєкту перед
  відновленням, тож фантомні прив’язки очищуються з `reason=transcript-missing`
  замість тихого запуску нової сесії Claude CLI через `--resume`.
- Збережені CLI-сесії — це безперервність, якою володіє провайдер. Неявне щоденне
  скидання сесії не розриває їх; `/reset` і явні політики `session.reset` усе ж розривають.

Примітки щодо серіалізації:

- `serialize: true` зберігає порядок запусків у тій самій доріжці.
- Більшість CLI серіалізуються в межах однієї доріжки провайдера.
- OpenClaw відмовляється від повторного використання збереженої CLI-сесії, коли змінюється вибрана auth-ідентичність,
  зокрема при зміні ID auth profile, статичного API key, статичного token або OAuth-ідентичності
  облікового запису, якщо CLI її надає. Ротація OAuth access і refresh token
  не розриває збережену CLI-сесію. Якщо CLI не надає стабільного ID облікового запису OAuth,
  OpenClaw дозволяє цьому CLI самому застосовувати дозволи на відновлення.

## Зображення (наскрізна передача)

Якщо ваш CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення в тимчасові файли. Якщо задано `imageArg`, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (впровадження шляху), чого достатньо для CLI, які автоматично
завантажують локальні файли за звичайними шляхами.

## Входи / виходи

- `output: "json"` (типово) намагається розібрати JSON і витягти текст + ID сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response`, а
  usage — зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає потоки JSONL (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента плюс ідентифікатори сесії, коли вони присутні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими входу:

- `input: "arg"` (типово) передає prompt як останній аргумент CLI.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і задано `maxPromptArgChars`, використовується stdin.

## Типові значення (належать Plugin)

Bundled OpenAI Plugin також реєструє типове значення для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Bundled Google Plugin також реєструє типове значення для `google-gemini-cli`:

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

- Текст відповіді читається з поля JSON `response`.
- Usage повертається до `stats`, коли `usage` відсутній або порожній.
- `stats.cached` нормалізується в `cacheRead` OpenClaw.
- Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (поширений випадок: абсолютний шлях `command`).

## Типові значення, що належать Plugin

Типові значення CLI backend тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` backend стає префіксом провайдера в model refs.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` усе ще перевизначає типове значення Plugin.
- Очищення конфігурації, специфічної для backend, і далі належить Plugin через необов’язковий
  hook `normalizeConfig`.

Plugins, яким потрібні невеликі сумісні shim-перетворення prompt/повідомлень, можуть оголошувати
двобічні текстові перетворення без заміни провайдера чи CLI backend:

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

`input` переписує системний prompt і prompt користувача, що передаються до CLI. `output`
переписує потокові assistant deltas і розібраний фінальний текст до того, як OpenClaw обробить
власні control markers і доставку в канали.

Для CLI, які надсилають JSONL, сумісний зі stream-json Claude Code, встановіть
`jsonlDialect: "claude-stream-json"` у конфігурації цього backend.

## Bundle MCP overlays

CLI backends **не** отримують виклики інструментів OpenClaw напряму, але backend може
добровільно ввімкнути згенерований накладний MCP-конфіг через `bundleMcp: true`.

Поточна bundled-поведінка:

- `claude-cli`: згенерований строгий MCP config file
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP server, який надає gateway tools процесу CLI
- автентифікує bridge токеном для конкретної сесії (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, обліковим записом і контекстом каналу
- завантажує увімкнені bundle-MCP server для поточного робочого простору
- об’єднує їх з будь-якою наявною MCP config/settings-структурою backend
- переписує конфігурацію запуску, використовуючи режим інтеграції, що належить backend, із розширення-власника

Якщо жоден MCP server не ввімкнено, OpenClaw усе одно впроваджує сувору конфігурацію, коли
backend добровільно використовує bundle MCP, щоб фонові запуски залишалися ізольованими.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не впроваджує виклики інструментів у
  протокол CLI backend. Backends бачать інструменти gateway лише тоді, коли добровільно ввімкнули
  `bundleMcp: true`.
- **Streaming залежить від backend.** Деякі backends передають JSONL потоком; інші буферизують
  усе до завершення.
- **Структуровані виходи** залежать від формату JSON конкретного CLI.
- **Сесії Codex CLI** відновлюються через текстовий вивід (без JSONL), що менш
  структуровано, ніж початковий запуск із `--json`. Сесії OpenClaw при цьому все одно працюють
  нормально.

## Усунення несправностей

- **CLI не знайдено**: задайте `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases` для зіставлення `provider/model` → моделі CLI.
- **Немає безперервності сесії**: переконайтеся, що задано `sessionArg`, а `sessionMode` не має значення
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).
