---
read_when:
    - Вам потрібен надійний резервний варіант, коли постачальники API дають збій
    - Ви запускаєте Codex CLI або інші локальні CLI для ШІ та хочете повторно їх використовувати
    - Ви хочете зрозуміти loopback-міст MCP для доступу CLI бекенду до інструментів
summary: 'Бекенди CLI: резервний варіант локального CLI для ШІ з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-05-07T13:17:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw може запускати **локальні AI CLI** як **текстовий fallback** на випадок, коли API-провайдери недоступні,
обмежені за rate limit або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не інʼєктуються напряму**, але backends із `bundleMcp: true`
  можуть отримувати gateway-інструменти через loopback MCP-міст.
- **JSONL streaming** для CLI, які його підтримують.
- **Сесії підтримуються** (тому подальші ходи залишаються узгодженими).
- **Зображення можна передавати наскрізно**, якщо CLI приймає шляхи до зображень.

Це спроєктовано як **запобіжна сітка**, а не основний шлях. Використовуйте це, коли вам
потрібні текстові відповіді, що «завжди працюють», без залежності від зовнішніх API.

Якщо вам потрібен повноцінний harness runtime з елементами керування сесіями ACP, фоновими задачами,
привʼязкою thread/conversation і постійними зовнішніми coding-сесіями, натомість використовуйте
[ACP-агенти](/uk/tools/acp-agents). CLI backends не є ACP.

<Tip>
  Створюєте новий backend plugin? Використовуйте
  [CLI backend plugins](/plugins/cli-backend-plugins). Ця сторінка призначена для користувачів,
  які налаштовують і експлуатують уже зареєстрований backend.
</Tip>

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без будь-якої конфігурації** (вбудований OpenAI plugin
реєструє backend за замовчуванням):

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

Ось і все. Жодних ключів, жодної додаткової auth-конфігурації, окрім самого CLI.

Якщо ви використовуєте вбудований CLI backend як **основного message-провайдера** на
gateway-хості, OpenClaw тепер автоматично завантажує відповідний вбудований plugin, коли ваша конфігурація
явно посилається на цей backend у model ref або в
`agents.defaults.cliBackends`.

## Використання як fallback

Додайте CLI backend до свого списку fallback, щоб він запускався лише тоді, коли основні моделі не спрацьовують:

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

- Якщо ви використовуєте `agents.defaults.models` (allowlist), потрібно також включити туди моделі вашого CLI backend.
- Якщо основний провайдер не спрацює (auth, rate limits, timeouts), OpenClaw
  далі спробує CLI backend.

## Огляд конфігурації

Усі CLI backends розміщуються в:

```
agents.defaults.cliBackends
```

Ключем кожного запису є **provider id** (наприклад, `codex-cli`, `my-cli`).
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

1. **Вибирає backend** на основі provider-префікса (`codex-cli/...`).
2. **Створює system prompt** з використанням того самого prompt OpenClaw + workspace context.
3. **Виконує CLI** із session id (якщо підтримується), щоб історія залишалася послідовною.
   Вбудований backend `claude-cli` підтримує процес Claude stdio активним для кожної
   сесії OpenClaw і надсилає подальші ходи через stream-json stdin.
4. **Розбирає output** (JSON або plain text) і повертає фінальний текст.
5. **Зберігає session ids** для кожного backend, щоб подальші ходи повторно використовували ту саму CLI-сесію.

<Note>
Вбудований Anthropic backend `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, доки Anthropic не опублікує
нову політику.
</Note>

Вбудований OpenAI backend `codex-cli` передає system prompt OpenClaw через
config override Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапорець у стилі Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Вбудований Anthropic backend `claude-cli` отримує snapshot skills OpenClaw
двома способами: компактний каталог skills OpenClaw у доданому system prompt і
тимчасовий Claude Code plugin, переданий через `--plugin-dir`. Plugin містить
лише допустимі skills для цього agent/session, тому нативний skill resolver Claude Code
бачить той самий відфільтрований набір, який OpenClaw інакше рекламував би в
prompt. Перевизначення env/API key для skill усе ще застосовуються OpenClaw до
environment дочірнього процесу для запуску.

Claude CLI також має власний noninteractive permission mode. OpenClaw відображає його
на наявну exec policy замість додавання Claude-специфічної конфігурації: коли
ефективна запитана exec policy є YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`), OpenClaw додає `--permission-mode bypassPermissions`.
Налаштування `agents.list[].tools.exec` для окремого agent перевизначають глобальні `tools.exec` для
цього agent. Щоб примусово задати інший режим Claude, встановіть явні raw backend args,
такі як `--permission-mode default` або `--permission-mode acceptEdits`, у
`agents.defaults.cliBackends.claude-cli.args` і відповідні `resumeArgs`.

Вбудований Anthropic backend `claude-cli` також відображає рівні OpenClaw `/think`
на нативний прапорець Claude Code `--effort` для рівнів, відмінних від off. `minimal` і
`low` відображаються на `low`, `adaptive` і `medium` відображаються на `medium`, а `high`,
`xhigh` і `max` відображаються напряму. Інші CLI backends потребують, щоб їхній owning plugin
оголосив еквівалентний argv mapper, перш ніж `/think` зможе впливати на запущений CLI.

Перш ніж OpenClaw зможе використовувати вбудований backend `claude-cli`, сам Claude Code
має вже бути залогінений на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли binary `claude`
ще не доступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, встановіть `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **resume subcommand** з іншими прапорцями, встановіть
  `resumeArgs` (замінює `args` під час resume) і за потреби `resumeOutput`
  (для non-JSON resume).
- `sessionMode`:
  - `always`: завжди надсилати session id (новий UUID, якщо збереженого немає).
  - `existing`: надсилати session id лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати session id.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб подальші ходи повторно використовували живий процес Claude, доки
  він активний. Warm stdio тепер є типовим, зокрема для custom configs,
  які не задають transport fields. Якщо Gateway перезапускається або idle process
  завершується, OpenClaw відновлює роботу зі збереженого Claude session id. Збережені session
  ids перевіряються на наявність читабельного project transcript перед
  resume, тому фантомні привʼязки очищуються з `reason=transcript-missing`
  замість тихого запуску нової сесії Claude CLI під `--resume`.
- Живі сесії Claude зберігають обмежені JSONL output guards. За замовчуванням дозволено до
  8 MiB і 20 000 raw JSONL lines на turn. Tool-heavy ходи Claude можуть підвищити
  їх для кожного backend через
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  і `maxTurnLines`; OpenClaw обмежує ці налаштування до 64 MiB і 100 000
  рядків.
- Збережені CLI-сесії є provider-owned continuity. Неявний щоденний session
  reset їх не перериває; `/reset` і явні політики `session.reset` усе ще
  діють.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків у тій самій lane.
- Більшість CLI серіалізуються в одній provider lane.
- OpenClaw припиняє повторне використання збереженої CLI-сесії, коли змінюється вибрана auth identity,
  зокрема змінюється auth profile id, static API key, static token або OAuth
  account identity, якщо CLI її надає. Ротація OAuth access і refresh token
  не перериває збережену CLI-сесію. Якщо CLI не надає
  stable OAuth account id, OpenClaw дозволяє цьому CLI самостійно застосовувати resume permissions.

## Fallback-прелюдія із сесій claude-cli

Коли спроба `claude-cli` перемикається на non-CLI candidate у
[`agents.defaults.model.fallbacks`](/uk/concepts/model-failover), OpenClaw засіває
наступну спробу context prelude, зібраною з локального JSONL transcript Claude Code
у `~/.claude/projects/`. Без цього seed fallback-провайдер стартував би холодним,
бо власний session transcript OpenClaw порожній для запусків `claude-cli`.

- Prelude надає перевагу найсвіжішому summary `/compact` або маркеру `compact_boundary`,
  а потім додає найновіші post-boundary turns до char
  budget. Pre-boundary turns відкидаються, бо summary вже їх представляє.
- Tool blocks обʼєднуються в компактні підказки `(tool call: name)` і
  `(tool result: …)`, щоб prompt budget залишався чесним. Summary позначається
  як `(truncated)`, якщо перевищує ліміт.
- Same-provider fallback з `claude-cli` на `claude-cli` покладається на власний
  `--resume` Claude і пропускає prelude.
- Seed повторно використовує наявну валідацію Claude session-file path, тому
  довільні шляхи не можуть бути прочитані.

## Зображення (наскрізна передача)

Якщо ваш CLI приймає шляхи до зображень, встановіть `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw запише base64-зображення у тимчасові файли. Якщо `imageArg` встановлено, ці
шляхи передаються як CLI args. Якщо `imageArg` відсутній, OpenClaw додає
file paths до prompt (path injection), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Inputs / outputs

- `output: "json"` (default) намагається розібрати JSON і витягти текст + session id.
- Для JSON output Gemini CLI OpenClaw читає reply text з `response` і
  usage зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає JSONL streams (наприклад, Codex CLI `--json`) і витягує фінальне agent message плюс session
  identifiers, якщо вони присутні.
- `output: "text"` трактує stdout як фінальну відповідь.

Input modes:

- `input: "arg"` (default) передає prompt як останній CLI arg.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і `maxPromptArgChars` встановлено, використовується stdin.

## Defaults (plugin-owned)

Вбудований OpenAI plugin також реєструє default для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Google plugin також реєструє default для `google-gemini-cli`:

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

Примітки щодо JSON у Gemini CLI:

- Текст відповіді читається з поля JSON `response`.
- Використання повертається до `stats`, коли `usage` відсутнє або порожнє.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутнє, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (поширений випадок: абсолютний шлях `command`).

## Типові значення, що належать Plugin

Типові значення бекенду CLI тепер є частиною поверхні Plugin:

- Plugins реєструють їх за допомогою `api.registerCliBackend(...)`.
- `id` бекенду стає префіксом провайдера в посиланнях на моделі.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` усе ще перевизначає типове значення Plugin.
- Очищення конфігурації, специфічної для бекенду, залишається у власності Plugin через необов'язковий
  хук `normalizeConfig`.

Plugins, яким потрібні невеликі прокладки сумісності промптів/повідомлень, можуть оголосити
двонапрямні текстові трансформації без заміни провайдера або бекенду CLI:

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

`input` переписує системний промпт і промпт користувача, передані до CLI. `output`
переписує потокові дельти асистента та розібраний фінальний текст до того, як OpenClaw обробить
власні керівні маркери й доставку каналом.

Для CLI, які видають сумісний із Claude Code stream-json JSONL, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенду.

## Накладання Bundle MCP

Бекенди CLI **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенероване накладання конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований строгий файл конфігурації MCP
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`; згенерований
  loopback-сервер OpenClaw позначено режимом схвалення інструментів Codex для кожного сервера,
  тож виклики MCP не можуть зупинитися на локальних запитах схвалення
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли Bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який відкриває інструменти Gateway для процесу CLI
- автентифікує міст за допомогою токена для кожного сеансу (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточним сеансом, обліковим записом і контекстом каналу
- завантажує ввімкнені сервери Bundle MCP для поточного робочого простору
- об'єднує їх із будь-якою наявною формою конфігурації/налаштувань MCP бекенду
- переписує конфігурацію запуску, використовуючи режим інтеграції, що належить бекенду, з відповідного розширення

Якщо сервери MCP не ввімкнено, OpenClaw усе одно вставляє строгу конфігурацію, коли
бекенд увімкнув Bundle MCP, щоб фонові запуски залишалися ізольованими.

Сеансово обмежені вбудовані MCP-середовища виконання кешуються для повторного використання в межах сеансу, а потім
видаляються після `mcp.sessionIdleTtlMs` мілісекунд простою (типово 10
хвилин; задайте `0`, щоб вимкнути). Одноразові вбудовані запуски, як-от перевірки автентифікації,
генерація slug і запити Active Memory на recall, виконують очищення наприкінці запуску, щоб дочірні процеси stdio
та потоки Streamable HTTP/SSE не переживали запуск.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не вставляє виклики інструментів у
  протокол бекенду CLI. Бекенди бачать інструменти Gateway лише тоді, коли вмикають
  `bundleMcp: true`.
- **Потокова передача залежить від бекенду.** Деякі бекенди передають JSONL потоком; інші буферизують
  до завершення.
- **Структуровані виводи** залежать від формату JSON CLI.
- **Сеанси Codex CLI** відновлюються через текстовий вивід (без JSONL), який є менш
  структурованим, ніж початковий запуск `--json`. Сеанси OpenClaw все одно працюють
  нормально.

## Усунення несправностей

- **CLI не знайдено**: задайте для `command` повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сеансу**: переконайтеся, що `sessionArg` задано, а `sessionMode` не є
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов'язане

- [Runbook Gateway](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
