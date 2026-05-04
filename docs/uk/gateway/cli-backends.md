---
read_when:
    - Вам потрібен надійний резервний варіант на випадок збоїв у постачальників API
    - Ви запускаєте Codex CLI або інші локальні CLI для ШІ й хочете повторно їх використовувати
    - Ви хочете зрозуміти петльовий міст MCP для доступу CLI до інструментів бекенду
summary: 'Бекенди CLI: локальний резервний CLI для ШІ з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-05-04T18:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли API-провайдери недоступні,
мають обмеження швидкості або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не впроваджуються напряму**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти gateway через loopback MCP-міст.
- **JSONL-потокове передавання** для CLI, які це підтримують.
- **Сесії підтримуються** (тому наступні звернення залишаються узгодженими).
- **Зображення можна передавати наскрізно**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не основний шлях. Використовуйте це, коли вам
потрібні текстові відповіді, які «завжди працюють», без залежності від зовнішніх API.

Якщо вам потрібне повноцінне середовище виконання harness з керуванням сесіями ACP, фоновими завданнями,
прив’язуванням потоків/розмов і сталими зовнішніми coding-сесіями, використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI-бекенди не є ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без будь-якої конфігурації** (вбудований OpenAI plugin
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

Ось і все. Не потрібні ключі чи додаткова конфігурація автентифікації, окрім самої CLI.

Якщо ви використовуєте вбудований CLI-бекенд як **основного провайдера повідомлень** на
gateway-хості, OpenClaw тепер автоматично завантажує власницький вбудований plugin, коли ваша конфігурація
явно посилається на цей бекенд у model ref або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте CLI-бекенд до свого списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі не спрацьовують:

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

- Якщо ви використовуєте `agents.defaults.models` (список дозволених), ви також маєте включити туди моделі свого CLI-бекенда.
- Якщо основний провайдер зазнає збою (автентифікація, обмеження швидкості, тайм-аути), OpenClaw
  далі спробує CLI-бекенд.

## Огляд конфігурації

Усі CLI-бекенди розміщуються в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ **ідентифікатора провайдера** (наприклад, `codex-cli`, `my-cli`).
Ідентифікатор провайдера стає лівою частиною вашого model ref:

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
2. **Створює системний prompt** з використанням того самого prompt OpenClaw і контексту робочої області.
3. **Виконує CLI** з ідентифікатором сесії (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує процес Claude stdio живим для кожної
   сесії OpenClaw і надсилає наступні звернення через stream-json stdin.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ідентифікатори сесій** для кожного бекенда, щоб наступні звернення повторно використовували ту саму CLI-сесію.

<Note>
Вбудований Anthropic-бекенд `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований OpenAI-бекенд `codex-cli` передає системний prompt OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає Claude-подібний
прапорець `--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Вбудований Anthropic-бекенд `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому системному prompt і
тимчасовий Claude Code plugin, переданий через `--plugin-dir`. Plugin містить
лише придатні Skills для цього агента/сесії, тому нативний розпізнавач Skills Claude Code
бачить той самий відфільтрований набір, який OpenClaw інакше оголосив би в
prompt. Перевизначення env/API-ключів Skills усе ще застосовуються OpenClaw до
середовища дочірнього процесу для запуску.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw відображає його
на наявну політику exec замість додавання конфігурації, специфічної для Claude: коли
ефективна запитана політика exec є YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`), OpenClaw додає `--permission-mode bypassPermissions`.
Налаштування `agents.list[].tools.exec` для окремого агента перевизначають глобальні `tools.exec` для
цього агента. Щоб примусово задати інший режим Claude, встановіть явні сирі аргументи бекенда,
такі як `--permission-mode default` або `--permission-mode acceptEdits`, у
`agents.defaults.cliBackends.claude-cli.args` і відповідні `resumeArgs`.

Вбудований Anthropic-бекенд `claude-cli` також відображає рівні OpenClaw `/think`
на нативний прапорець Claude Code `--effort` для рівнів, відмінних від off. `minimal` і
`low` відображаються на `low`, `adaptive` і `medium` відображаються на `medium`, а `high`,
`xhigh` і `max` відображаються напряму. Іншим CLI-бекендам потрібен їхній власницький plugin, щоб
оголосити еквівалентний argv-мапер, перш ніж `/think` зможе впливати на породжений CLI.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
має вже бути автентифікований на тому самому хості:

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
  в кілька прапорців.
- Якщо CLI використовує **підкоманду resume** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для не-JSON відновлень).
- `sessionMode`:
  - `always`: завжди надсилати ідентифікатор сесії (новий UUID, якщо нічого не збережено).
  - `existing`: надсилати ідентифікатор сесії лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати ідентифікатор сесії.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб наступні звернення повторно використовували живий процес Claude, поки
  він активний. Теплий stdio тепер є стандартним, зокрема для користувацьких конфігурацій,
  які не вказують транспортні поля. Якщо Gateway перезапускається або неактивний процес
  завершується, OpenClaw відновлюється зі збереженого ідентифікатора сесії Claude. Збережені
  ідентифікатори сесій перевіряються щодо наявного читабельного transcript проєкту перед
  відновленням, тому фантомні прив’язки очищаються з `reason=transcript-missing`
  замість тихого запуску нової сесії Claude CLI з `--resume`.
- Живі сесії Claude зберігають обмежені захисні ліміти JSONL-виводу. Стандартні значення дозволяють до
  8 MiB і 20,000 сирих JSONL-рядків на звернення. Звернення Claude з великою кількістю інструментів можуть підвищити
  їх для кожного бекенда через
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  і `maxTurnLines`; OpenClaw обмежує ці налаштування до 64 MiB і 100,000
  рядків.
- Збережені CLI-сесії є безперервністю, що належить провайдеру. Неявне щоденне скидання сесії
  їх не перериває; `/reset` і явні політики `session.reset` усе ще
  це роблять.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків у тому самому lane.
- Більшість CLI серіалізуються в одному lane провайдера.
- OpenClaw відкидає повторне використання збереженої CLI-сесії, коли змінюється вибрана auth-ідентичність,
  зокрема змінений auth profile id, статичний API key, статичний token або ідентичність
  облікового запису OAuth, якщо CLI її надає. Ротація access і refresh token OAuth
  не перериває збережену CLI-сесію. Якщо CLI не надає
  стабільний OAuth account id, OpenClaw дозволяє цій CLI самостійно застосовувати дозволи відновлення.

## Резервна преамбула із сесій claude-cli

Коли спроба `claude-cli` переходить на не-CLI кандидата в
[`agents.defaults.model.fallbacks`](/uk/concepts/model-failover), OpenClaw засіває
наступну спробу контекстною преамбулою, отриманою з локального
JSONL transcript Claude Code у `~/.claude/projects/`. Без цього seed резервний
провайдер стартував би з чистого стану, бо власний session transcript OpenClaw порожній
для запусків `claude-cli`.

- Преамбула віддає перевагу найновішому summary `/compact` або маркеру `compact_boundary`,
  а потім додає найсвіжіші звернення після boundary до бюджету символів.
  Звернення до boundary відкидаються, бо summary вже їх представляє.
- Блоки інструментів об’єднуються в компактні підказки `(tool call: name)` і
  `(tool result: …)`, щоб зберегти prompt budget реалістичним. Summary позначається
  `(truncated)`, якщо воно переповнюється.
- Резервні переходи same-provider `claude-cli` до `claude-cli` покладаються на власний
  `--resume` Claude і пропускають преамбулу.
- Seed повторно використовує наявну перевірку шляху до session-file Claude, тому
  довільні шляхи не можна прочитати.

## Зображення (наскрізне передавання)

Якщо ваша CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw запише base64-зображення у тимчасові файли. Якщо `imageArg` задано, ці
шляхи передаються як CLI-аргументи. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (ін’єкція шляху), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Вхідні дані / вивід

- `output: "json"` (стандартно) намагається розібрати JSON і витягнути текст + ідентифікатор сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response` і
  usage зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає JSONL-потоки (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента плюс
  ідентифікатори сесії, якщо вони наявні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (стандартно) передає prompt як останній CLI-аргумент.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і задано `maxPromptArgChars`, використовується stdin.

## Стандартні значення (належать plugin)

Вбудований OpenAI plugin також реєструє стандартне значення для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Google plugin також реєструє стандартне значення для `google-gemini-cli`:

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

- Текст відповіді зчитується з JSON-поля `response`.
- Використання повертається до `stats`, коли `usage` відсутнє або порожнє.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутнє, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (поширене: абсолютний шлях `command`).

## Типові значення, що належать Plugin

Типові значення бекенда CLI тепер є частиною поверхні plugin:

- Плагіни реєструють їх за допомогою `api.registerCliBackend(...)`.
- `id` бекенда стає префіксом провайдера в посиланнях на моделі.
- Користувацька конфігурація в `agents.defaults.cliBackends.<id>` і далі перевизначає типове значення plugin.
- Очищення конфігурації, специфічної для бекенда, залишається у власності plugin через необов’язковий
  хук `normalizeConfig`.

Плагіни, яким потрібні невеликі шими сумісності промптів/повідомлень, можуть оголошувати
двонапрямні текстові перетворення без заміни провайдера або бекенда CLI:

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
переписує потокові дельти асистента й розібраний фінальний текст до того, як OpenClaw обробить
власні керівні маркери та доставку в канал.

Для CLI, які виводять сумісний із Claude Code stream-json JSONL, встановіть
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенда.

## Оверлеї MCP для пакета

Бекенди CLI **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенерований оверлей конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований строгий файл конфігурації MCP
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`; згенерований
  loopback-сервер OpenClaw позначається режимом схвалення інструментів Codex для кожного сервера,
  щоб виклики MCP не зупинялися на локальних запитах схвалення
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли MCP для пакета увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який надає інструменти gateway процесу CLI
- автентифікує міст за допомогою токена для кожної сесії (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, обліковим записом і контекстом каналу
- завантажує увімкнені bundle-MCP сервери для поточного workspace
- об’єднує їх із будь-якою наявною формою MCP-конфігурації/налаштувань бекенда
- переписує конфігурацію запуску, використовуючи режим інтеграції, що належить бекенду з extension-власника

Якщо жоден MCP-сервер не увімкнено, OpenClaw усе одно ін’єктує строгу конфігурацію, коли
бекенд увімкнув MCP для пакета, щоб фонові запуски залишалися ізольованими.

Сеансово-обмежені вбудовані середовища виконання MCP кешуються для повторного використання в межах сесії, а потім
очищаються після `mcp.sessionIdleTtlMs` мілісекунд простою (типово 10
хвилин; встановіть `0`, щоб вимкнути). Одноразові вбудовані запуски, як-от перевірки автентифікації,
генерація slug і запити на пригадування active-memory, очищуються наприкінці запуску, щоб stdio
дочірні процеси та потоки Streamable HTTP/SSE не жили довше за сам запуск.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не ін’єктує виклики інструментів у
  протокол бекенда CLI. Бекенди бачать інструменти gateway лише тоді, коли вмикають
  `bundleMcp: true`.
- **Потокове передавання залежить від бекенда.** Деякі бекенди передають JSONL потоком; інші буферизують
  до завершення.
- **Структуровані виводи** залежать від JSON-формату CLI.
- **Сесії Codex CLI** відновлюються через текстовий вивід (без JSONL), який менш
  структурований, ніж початковий запуск із `--json`. Сесії OpenClaw усе одно працюють
  нормально.

## Усунення несправностей

- **CLI не знайдено**: встановіть для `command` повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає неперервності сесії**: переконайтеся, що `sessionArg` задано, а `sessionMode` не дорівнює
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: встановіть `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
