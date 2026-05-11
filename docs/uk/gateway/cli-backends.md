---
read_when:
    - Вам потрібен надійний резервний варіант, коли постачальники API дають збій
    - Ви запускаєте Codex CLI або інші локальні CLI для ШІ та хочете повторно їх використовувати
    - Ви хочете зрозуміти міст зворотної петлі MCP для доступу CLI до інструментів серверної частини
summary: 'CLI-бекенди: резервний локальний AI CLI з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-05-11T20:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли API-провайдери недоступні,
обмежені лімітами або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не інʼєктуються напряму**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти Gateway через міст local loopback MCP.
- **Потокове передавання JSONL** для CLI, які його підтримують.
- **Сесії підтримуються** (тому наступні звернення залишаються звʼязними).
- **Зображення можна передавати далі**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не основний шлях. Використовуйте це, коли
потрібні текстові відповіді, що "завжди працюють", без залежності від зовнішніх API.

Якщо вам потрібне повне середовище виконання harness з керуванням сесіями ACP, фоновими завданнями,
привʼязкою потоків/розмов і постійними зовнішніми сесіями кодування, натомість використовуйте
[агентів ACP](/uk/tools/acp-agents). Бекенди CLI не є ACP.

<Tip>
  Створюєте новий backend plugin? Використовуйте
  [CLI backend plugins](/uk/plugins/cli-backend-plugins). Ця сторінка призначена для користувачів,
  які налаштовують і експлуатують уже зареєстрований бекенд.
</Tip>

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без будь-якої конфігурації** (вбудований plugin OpenAI
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

На цьому все. Не потрібні ключі чи додаткова конфігурація автентифікації, окрім самого CLI.

Якщо ви використовуєте вбудований бекенд CLI як **основного провайдера повідомлень** на
хості gateway, OpenClaw тепер автоматично завантажує вбудований plugin-власник, коли ваша конфігурація
явно посилається на цей бекенд у посиланні на модель або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте бекенд CLI до списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі дають збій:

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

- Якщо ви використовуєте `agents.defaults.models` (список дозволених), вам також потрібно включити туди моделі бекенда CLI.
- Якщо основний провайдер дає збій (автентифікація, ліміти запитів, тайм-аути), OpenClaw
  далі спробує бекенд CLI.

## Огляд конфігурації

Усі бекенди CLI розміщуються в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ **ідентифікатор провайдера** (наприклад, `codex-cli`, `my-cli`).
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

1. **Вибирає бекенд** на основі префікса провайдера (`codex-cli/...`).
2. **Створює системний prompt** з використанням того самого prompt OpenClaw і контексту робочої області.
3. **Виконує CLI** з ідентифікатором сесії (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує процес Claude stdio активним для кожної
   сесії OpenClaw і надсилає наступні звернення через stream-json stdin.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ідентифікатори сесій** для кожного бекенда, щоб наступні звернення повторно використовували ту саму сесію CLI.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд OpenAI `codex-cli` передає системний prompt OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапорець у стилі Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Вбудований бекенд Anthropic `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому системному prompt і
тимчасовий plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише придатні Skills для цього агента/сесії, тому нативний резолвер Skills
Claude Code бачить той самий відфільтрований набір, який OpenClaw інакше рекламував би в
prompt. Перевизначення env/API key для Skills усе ще застосовуються OpenClaw до
середовища дочірнього процесу для запуску.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw зіставляє його
з наявною політикою exec замість додавання специфічної для Claude конфігурації: коли
ефективно запитана політика exec є YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`), OpenClaw додає `--permission-mode bypassPermissions`.
Налаштування `agents.list[].tools.exec` для конкретного агента перевизначають глобальні `tools.exec` для
цього агента. Щоб примусово встановити інший режим Claude, задайте явні необроблені аргументи бекенда,
такі як `--permission-mode default` або `--permission-mode acceptEdits`, у
`agents.defaults.cliBackends.claude-cli.args` і відповідні `resumeArgs`.

Вбудований бекенд Anthropic `claude-cli` також зіставляє рівні OpenClaw `/think`
із нативним прапорцем Claude Code `--effort` для рівнів, відмінних від off. `minimal` і
`low` зіставляються з `low`, `adaptive` і `medium` зіставляються з `medium`, а `high`,
`xhigh` і `max` зіставляються напряму. Інші бекенди CLI потребують, щоб їхній plugin-власник
оголосив еквівалентний argv-мапер, перш ніж `/think` зможе впливати на породжений CLI.

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
  `sessionArgs` (заповнювач `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **підкоманду resume** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і за потреби `resumeOutput`
  (для не-JSON відновлень).
- `sessionMode`:
  - `always`: завжди надсилати ідентифікатор сесії (новий UUID, якщо жоден не збережено).
  - `existing`: надсилати ідентифікатор сесії лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати ідентифікатор сесії.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб наступні звернення повторно використовували живий процес Claude, доки
  він активний. Тепер warm stdio є типовим, зокрема для користувацьких конфігурацій,
  які не задають транспортні поля. Якщо Gateway перезапускається або неактивний процес
  завершується, OpenClaw відновлюється зі збереженого ідентифікатора сесії Claude. Збережені
  ідентифікатори сесій перевіряються на наявність читабельного transcript проєкту перед
  відновленням, тому фантомні привʼязки очищаються з `reason=transcript-missing`
  замість тихого запуску нової сесії Claude CLI через `--resume`.
- Живі сесії Claude зберігають обмежені запобіжники виводу JSONL. Типові значення дозволяють до
  8 MiB і 20,000 необроблених рядків JSONL за одне звернення. Звернення Claude з великою кількістю інструментів можуть підвищити
  їх для кожного бекенда за допомогою
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  і `maxTurnLines`; OpenClaw обмежує ці налаштування до 64 MiB і 100,000
  рядків.
- Збережені сесії CLI є безперервністю, якою володіє провайдер. Неявне щоденне скидання сесії
  їх не перериває; `/reset` і явні політики `session.reset` усе ще переривають.
- Нові сесії CLI зазвичай повторно засіваються лише з підсумку Compaction OpenClaw
  плюс хвоста після Compaction. Щоб відновлювати короткі сесії, які стають недійсними
  до Compaction, бекенд може явно ввімкнути
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw усе одно утримує повторне засівання з необробленого
  transcript обмеженим і обмежує його безпечними інвалідаціями, як-от відсутні
  CLI transcript, зміни системного prompt/MCP або повторна спроба після session-expired; зміни
  профілю автентифікації чи епохи облікових даних ніколи не засівають повторно історію необробленого transcript.

Примітки щодо серіалізації:

- `serialize: true` зберігає порядок запусків в одній смузі.
- Більшість CLI серіалізуються в одній смузі провайдера.
- OpenClaw відкидає повторне використання збереженої сесії CLI, коли вибрана ідентичність автентифікації змінюється,
  включно зі зміненим ідентифікатором профілю автентифікації, статичним API key, статичним token або ідентичністю
  облікового запису OAuth, коли CLI її надає. Ротація access і refresh token OAuth
  не перериває збережену сесію CLI. Якщо CLI не надає
  стабільний ідентифікатор облікового запису OAuth, OpenClaw дозволяє цьому CLI самостійно забезпечувати дозволи resume.

## Прелюдія резервного варіанта із сесій claude-cli

Коли спроба `claude-cli` переходить на не-CLI кандидата в
[`agents.defaults.model.fallbacks`](/uk/concepts/model-failover), OpenClaw засіває
наступну спробу контекстною прелюдією, отриманою з локального
JSONL transcript Claude Code у `~/.claude/projects/`. Без цього засівання резервний
провайдер стартував би з нуля, оскільки власний transcript сесії OpenClaw порожній
для запусків `claude-cli`.

- Прелюдія надає перевагу найновішому підсумку `/compact` або маркеру `compact_boundary`,
  а потім додає найновіші звернення після межі в межах бюджету символів.
  Звернення до межі відкидаються, оскільки підсумок уже їх представляє.
- Блоки інструментів зводяться до компактних підказок `(tool call: name)` і
  `(tool result: …)`, щоб чесно дотримуватися бюджету prompt. Підсумок
  позначається `(truncated)`, якщо він переповнюється.
- Резервні переходи з `claude-cli` на `claude-cli` у межах того самого провайдера покладаються на власний
  `--resume` Claude і пропускають прелюдію.
- Засівання повторно використовує наявну перевірку шляху до файлу сесії Claude, тому
  довільні шляхи не можуть бути прочитані.

## Зображення (наскрізне передавання)

Якщо ваш CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення у тимчасові файли. Якщо `imageArg` задано, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (інʼєкція шляху), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (типово) намагається розібрати JSON і витягти текст + ідентифікатор сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response` і
  використання зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає потоки JSONL (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента плюс ідентифікатори
  сесії, коли вони присутні.
- `output: "text"` розглядає stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (типово) передає prompt як останній аргумент CLI.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і `maxPromptArgChars` задано, використовується stdin.

## Значення за замовчуванням (належать plugin)

Вбудований plugin OpenAI також реєструє стандартне значення для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Google Plugin також реєструє типові значення для `google-gemini-cli`:

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

- Текст відповіді зчитується з поля JSON `response`.
- Якщо `usage` відсутнє або порожнє, використовується запасний варіант `stats`.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутнє, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (поширений випадок: абсолютний шлях `command`).

## Типові значення, якими володіє Plugin

Типові значення бекендів CLI тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенда стає префіксом провайдера в посиланнях на моделі.
- Користувацька конфігурація в `agents.defaults.cliBackends.<id>` і далі перевизначає типове значення Plugin.
- Очищення конфігурації, специфічне для бекенда, залишається у власності Plugin через необов'язковий
  хук `normalizeConfig`.

Plugins, яким потрібні невеликі шими сумісності промптів/повідомлень, можуть оголошувати
двонапрямні текстові перетворення без заміни провайдера чи бекенда CLI:

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
переписує потокові дельти асистента та розібраний фінальний текст, перш ніж OpenClaw обробить
власні керівні маркери й доставку в канал.

Для CLI, які виводять JSONL, сумісний із Claude Code stream-json, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенда.

## Накладення пакетного MCP

Бекенди CLI **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенероване накладення конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований суворий файл конфігурації MCP
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`; згенерований
  сервер loopback OpenClaw позначається режимом схвалення інструментів для кожного сервера Codex,
  щоб виклики MCP не могли зупинятися на локальних запитах схвалення
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли пакетний MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який надає інструменти Gateway процесу CLI
- автентифікує міст токеном для кожного сеансу (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів контекстом поточного сеансу, облікового запису та каналу
- завантажує ввімкнені сервери пакетного MCP для поточного робочого простору
- об'єднує їх з будь-якою наявною формою конфігурації/налаштувань MCP бекенда
- переписує конфігурацію запуску, використовуючи режим інтеграції, яким володіє бекенд, із власницького розширення

Якщо сервери MCP не ввімкнено, OpenClaw все одно вставляє сувору конфігурацію, коли
бекенд вмикає пакетний MCP, щоб фонові запуски залишалися ізольованими.

Середовища виконання пакетного MCP з областю дії сеансу кешуються для повторного використання в межах сеансу, а потім
видаляються після `mcp.sessionIdleTtlMs` мілісекунд простою (типово 10
хвилин; встановіть `0`, щоб вимкнути). Одноразові вбудовані запуски, як-от перевірки автентифікації,
генерування slug і запити Active Memory на відкликання, очищаються наприкінці запуску, щоб дочірні процеси stdio
та потоки Streamable HTTP/SSE не жили довше за запуск.

## Обмеження

- **Без прямих викликів інструментів OpenClaw.** OpenClaw не вставляє виклики інструментів у
  протокол бекенда CLI. Бекенди бачать інструменти Gateway лише тоді, коли вмикають
  `bundleMcp: true`.
- **Потокове передавання залежить від бекенда.** Деякі бекенди потоково передають JSONL; інші буферизують
  до завершення.
- **Структуровані виводи** залежать від формату JSON CLI.
- **Сеанси Codex CLI** відновлюються через текстовий вивід (без JSONL), який менш
  структурований, ніж початковий запуск із `--json`. Сеанси OpenClaw все одно працюють
  звичайно.

## Усунення несправностей

- **CLI не знайдено**: задайте для `command` повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сеансу**: переконайтеся, що `sessionArg` задано, а `sessionMode` не є
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов'язане

- [Посібник з експлуатації Gateway](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
