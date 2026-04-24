---
read_when:
    - Вам потрібен надійний резервний варіант, коли API-провайдери зазнають збою
    - Ви використовуєте Codex CLI або інші локальні AI CLI й хочете використовувати їх повторно
    - Ви хочете зрозуміти міст MCP local loopback для доступу CLI-бекенда до інструментів
summary: 'Бекенди CLI: резервний локальний AI CLI з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-04-24T18:10:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81d5f41ebaf16d4171379cf446b4c70b167519cd1f647c0701cccda19f0b3419
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли API-провайдери недоступні,
обмежені за rate limit або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не інжектуються безпосередньо**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти gateway через міст MCP local loopback.
- **Потокове передавання JSONL** для CLI, які це підтримують.
- **Сесії підтримуються** (тому наступні ходи залишаються узгодженими).
- **Зображення можна передавати далі**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не як основний шлях. Використовуйте це, коли
вам потрібні текстові відповіді в стилі «завжди працює» без залежності від зовнішніх API.

Якщо вам потрібне повноцінне середовище harness із керуванням сесіями ACP, фоновими завданнями,
прив’язкою до thread/conversation і постійними зовнішніми сесіями кодування, використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI-бекенди — це не ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (вбудований Plugin OpenAI
реєструє бекенд за замовчуванням):

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

Ось і все. Жодних ключів, жодної додаткової конфігурації автентифікації не потрібно, окрім самої CLI.

Якщо ви використовуєте вбудований CLI-бекенд як **основний провайдер повідомлень** на
хості gateway, OpenClaw тепер автоматично завантажує відповідний вбудований Plugin, коли ваша конфігурація
явно посилається на цей бекенд у model ref або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанту

Додайте CLI-бекенд до списку резервних, щоб він запускався лише тоді, коли основні моделі недоступні:

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

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також маєте включити туди моделі CLI-бекенда.
- Якщо основний провайдер недоступний (автентифікація, rate limits, тайм-аути), OpenClaw
  спробує CLI-бекенд наступним.

## Огляд конфігурації

Усі CLI-бекенди розміщуються в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **provider id** (наприклад, `codex-cli`, `my-cli`).
Provider id стає лівою частиною вашого model ref:

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
          // CLI у стилі Codex можуть натомість вказувати на файл prompt:
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

1. **Вибирає бекенд** на основі префікса provider (`codex-cli/...`).
2. **Будує system prompt** з використанням того самого prompt OpenClaw і контексту workspace.
3. **Запускає CLI** з id сесії (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує процес Claude stdio живим для кожної
   сесії OpenClaw і надсилає наступні ходи через stdin stream-json.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає id сесій** для кожного бекенда, щоб наступні ходи повторно використовували ту саму CLI-сесію.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд OpenAI `codex-cli` передає system prompt OpenClaw через
override конфігурації `model_instructions_file` у Codex (`-c
model_instructions_file="..."`). Codex не надає прапорець у стилі Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у тимчасовий
файл для кожної нової сесії Codex CLI.

Вбудований бекенд Anthropic `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому system prompt і
тимчасовий Plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише дозволені Skills для цього агента/сесії, тому власний resolver Skills у Claude Code
бачить той самий відфільтрований набір, який OpenClaw інакше рекламував би в prompt.
Перевизначення env/API key для Skills і далі застосовуються OpenClaw до середовища дочірнього процесу під час виконання.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw зіставляє його
з наявною policy виконання замість додавання специфічної для Claude конфігурації: коли
ефективно запитана policy виконання — YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`), OpenClaw додає `--permission-mode bypassPermissions`.
Налаштування `agents.list[].tools.exec` для окремого агента мають пріоритет над глобальним `tools.exec` для
цього агента. Щоб примусово встановити інший режим Claude, задайте явні сирі аргументи бекенда,
наприклад `--permission-mode default` або `--permission-mode acceptEdits`, у
`agents.defaults.cliBackends.claude-cli.args` і відповідних `resumeArgs`.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
вже має бути авторизований на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли бінарний файл `claude`
ще не доступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **підкоманду resume** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і за потреби `resumeOutput`
  (для відновлень не у форматі JSON).
- `sessionMode`:
  - `always`: завжди надсилати id сесії (новий UUID, якщо нічого не збережено).
  - `existing`: надсилати id сесії лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати id сесії.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`
  і `input: "stdin"`, щоб наступні ходи повторно використовували живий процес Claude, поки
  він активний. Теплий stdio тепер є варіантом за замовчуванням, зокрема для користувацьких конфігурацій,
  у яких не вказані поля транспорту. Якщо Gateway перезапускається або неактивний процес завершується,
  OpenClaw відновлюється із збереженого id сесії Claude. Збережені id сесій
  перевіряються на наявність доступного для читання transcript проєкту перед
  відновленням, тому фантомні прив’язки очищаються з `reason=transcript-missing`,
  а не тихо запускають нову сесію Claude CLI під `--resume`.
- Збережені CLI-сесії — це безперервність, якою володіє provider. Неявне щоденне
  скидання сесії не розриває їх; це роблять `/reset` і явні policy `session.reset`.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків в одній lane.
- Більшість CLI серіалізуються в одній lane provider.
- OpenClaw скидає повторне використання збереженої CLI-сесії, коли змінюється вибрана ідентичність автентифікації,
  зокрема змінений id auth profile, статичний API key, статичний токен або ідентичність OAuth-облікового запису, якщо CLI її розкриває. Ротація токенів доступу й оновлення OAuth не
  розриває збережену CLI-сесію. Якщо CLI не розкриває стабільний id OAuth-облікового запису, OpenClaw дозволяє цій CLI самостійно застосовувати дозволи на resume.

## Зображення (передавання далі)

Якщо ваша CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення у тимчасові файли. Якщо задано `imageArg`, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (ін’єкція шляхів), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (за замовчуванням) намагається розібрати JSON і витягти текст + id сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response`, а
  використання — з `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає потоки JSONL (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента плюс ідентифікатори сесії, якщо вони присутні.
- `output: "text"` розглядає stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (за замовчуванням) передає prompt як останній аргумент CLI.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і задано `maxPromptArgChars`, використовується stdin.

## Значення за замовчуванням (керуються Plugin)

Вбудований Plugin OpenAI також реєструє значення за замовчуванням для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Plugin Google також реєструє значення за замовчуванням для `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Передумова: локальна Gemini CLI має бути встановлена й доступна як
`gemini` у `PATH` (`brew install gemini-cli` або
`npm install -g @google/gemini-cli`).

Примітки щодо JSON Gemini CLI:

- Текст відповіді читається з поля JSON `response`.
- Використання бере резервне значення з `stats`, коли `usage` відсутній або порожній.
- `stats.cached` нормалізується в `cacheRead` OpenClaw.
- Якщо `stats.input` відсутній, OpenClaw виводить кількість вхідних токенів із
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (типовий випадок: абсолютний шлях `command`).

## Значення за замовчуванням, керовані Plugin

Значення за замовчуванням для CLI-бекендів тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенда стає префіксом provider у model refs.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` усе ще перевизначає значення Plugin за замовчуванням.
- Очищення конфігурації, специфічне для бекенда, залишається під контролем Plugin через необов’язковий
  hook `normalizeConfig`.

Plugins, яким потрібні невеликі шими сумісності для prompt/повідомлень, можуть оголошувати
двонапрямні текстові перетворення без заміни provider або CLI-бекенда:

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

`input` переписує system prompt і prompt користувача, передані до CLI. `output`
переписує потокові дельти помічника й розібраний фінальний текст до того, як OpenClaw обробить
власні control markers і доставку каналом.

Для CLI, які виводять JSONL, сумісний зі stream-json Claude Code, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенда.

## Оверлеї MCP для bundle

CLI-бекенди **не** отримують виклики інструментів OpenClaw безпосередньо, але бекенд може
ввімкнути генерацію оверлею конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований суворий файл конфігурації MCP
- `codex-cli`: inline override конфігурації для `mcp_servers`; згенерований
  loopback-сервер OpenClaw позначається режимом схвалення інструментів для окремого сервера в Codex,
  щоб виклики MCP не зависали через локальні запити на схвалення
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який надає інструменти gateway процесу CLI
- автентифікує міст за допомогою токена для кожної сесії (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, обліковим записом і контекстом каналу
- завантажує увімкнені сервери bundle-MCP для поточного workspace
- об’єднує їх із будь-якою наявною формою конфігурації/налаштувань MCP бекенда
- переписує конфігурацію запуску, використовуючи режим інтеграції, що належить бекенду, із відповідного extension

Якщо жоден MCP-сервер не увімкнено, OpenClaw все одно інжектує сувору конфігурацію, коли
бекенд використовує bundle MCP, щоб фонові запуски залишалися ізольованими.

## Обмеження

- **Без прямих викликів інструментів OpenClaw.** OpenClaw не інжектує виклики інструментів у
  протокол CLI-бекенда. Бекенди бачать інструменти gateway лише тоді, коли використовують
  `bundleMcp: true`.
- **Streaming залежить від бекенда.** Деякі бекенди передають JSONL потоком; інші буферизують
  до завершення.
- **Структуровані виходи** залежать від JSON-формату CLI.
- **Сесії Codex CLI** відновлюються через текстовий вивід (без JSONL), що менш
  структуровано, ніж початковий запуск `--json`. Сесії OpenClaw і далі працюють
  нормально.

## Усунення несправностей

- **CLI не знайдено**: задайте `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сесії**: переконайтеся, що задано `sessionArg` і що `sessionMode` не є
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і переконайтеся, що CLI підтримує шляхи до файлів).

## Пов’язане

- [Gateway runbook](/uk/gateway)
- [Local models](/uk/gateway/local-models)
