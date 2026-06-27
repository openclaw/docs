---
read_when:
    - Вам потрібен надійний резервний варіант, коли постачальники API дають збій
    - Ви запускаєте локальні CLI для ШІ й хочете повторно їх використовувати
    - Ви хочете зрозуміти міст MCP local loopback для доступу до інструментів бекенда CLI
summary: 'Бекенди CLI: резервний локальний AI CLI з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-06-27T17:30:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли API-провайдери недоступні,
обмежені за частотою запитів або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не інʼєктуються безпосередньо**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти Gateway через loopback MCP-міст.
- **Потокове передавання JSONL** для CLI, які це підтримують.
- **Сеанси підтримуються** (тому наступні ходи залишаються узгодженими).
- **Зображення можна передавати наскрізно**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не основний шлях. Використовуйте це, коли вам
потрібні текстові відповіді, що "завжди працюють", без залежності від зовнішніх API.

Якщо вам потрібен повний runtime harness із керуванням сеансами ACP, фоновими завданнями,
привʼязкою гілки/розмови та постійними зовнішніми сеансами кодування, натомість використовуйте
[Агенти ACP](/uk/tools/acp-agents). Бекенди CLI не є ACP.

<Tip>
  Створюєте новий backend Plugin? Використовуйте
  [Plugin-и бекенду CLI](/uk/plugins/cli-backend-plugins). Ця сторінка призначена для користувачів,
  які налаштовують і експлуатують уже зареєстрований бекенд.
</Tip>

## Швидкий старт для початківців

Ви можете використовувати Claude Code CLI **без будь-якої конфігурації** (вбудований Plugin Anthropic
реєструє стандартний бекенд):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` — це стандартний ідентифікатор агента, коли явний список агентів не налаштовано. Якщо
ви використовуєте кілька агентів, замініть його на ідентифікатор агента, який хочете запустити.

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

Це все. Жодних ключів, жодної додаткової конфігурації автентифікації поза самим CLI не потрібно.

Якщо ви використовуєте вбудований бекенд CLI як **основного провайдера повідомлень** на
хості Gateway, OpenClaw тепер автоматично завантажує власницький вбудований Plugin, коли ваша конфігурація
явно посилається на цей бекенд у model ref або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте бекенд CLI до свого списку резервних варіантів, щоб він запускався лише коли основні моделі дають збій:

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

- Якщо ви використовуєте `agents.defaults.models` (список дозволених), ви також маєте включити туди свої моделі бекенду CLI.
- Якщо основний провайдер дає збій (автентифікація, обмеження частоти, тайм-аути), OpenClaw
  спробує бекенд CLI наступним.

## Огляд конфігурації

Усі бекенди CLI розташовані в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **ідентифікатора провайдера** (наприклад, `claude-cli`, `my-cli`).
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

1. **Вибирає бекенд** на основі префікса провайдера (`claude-cli/...`).
2. **Створює системний prompt** з використанням того самого prompt OpenClaw + контексту робочого простору.
3. **Виконує CLI** з ідентифікатором сеансу (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує stdio-процес Claude живим для кожного
   сеансу OpenClaw і надсилає наступні ходи через stream-json stdin.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ідентифікатори сеансів** для кожного бекенду, щоб наступні ходи повторно використовували той самий сеанс CLI.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw розглядає
використання `claude -p` як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд Anthropic `claude-cli` надає перевагу рідному резолверу навичок Claude Code
для Skills OpenClaw. Коли поточний знімок Skills містить принаймні
одну вибрану навичку з матеріалізованим шляхом, OpenClaw передає тимчасовий Plugin Claude
Code з `--plugin-dir` і пропускає дубльований каталог Skills OpenClaw
з доданого системного prompt. Якщо знімок не має матеріалізованої навички Plugin,
OpenClaw зберігає каталог prompt як резервний варіант. Перевизначення env/API key
для навичок усе ще застосовуються OpenClaw до середовища дочірнього процесу для
запуску.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw зіставляє його
з наявною політикою exec замість додавання специфічної для Claude конфігурації політики.
Для керованих OpenClaw live-сеансів Claude ефективна політика exec OpenClaw є
авторитетною: YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`) запускає Claude з
`--permission-mode bypassPermissions`, тоді як обмежувальна ефективна політика exec
запускає Claude з `--permission-mode default`. Налаштування для кожного агента
`agents.list[].tools.exec` перевизначають глобальне `tools.exec` для цього
агента. Необроблені аргументи бекенду Claude все ще можуть містити `--permission-mode`, але live-запуски
Claude нормалізують цей прапор, щоб він відповідав ефективній політиці exec OpenClaw.

Вбудований бекенд Anthropic `claude-cli` також зіставляє рівні OpenClaw `/think`
з рідним прапором Claude Code `--effort` для рівнів, відмінних від off. `minimal` і
`low` зіставляються з `low`, `adaptive` і `medium` — з `medium`, а `high`,
`xhigh` і `max` зіставляються напряму. Інші бекенди CLI потребують, щоб їхній власницький Plugin
оголосив еквівалентний argv-мапер, перш ніж `/think` зможе впливати на породжений CLI.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
має вже бути залогінений на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Для Docker-інсталяцій Claude Code має бути встановлений і залогінений усередині збереженого
home контейнера, а не лише на хості. Див.
[Бекенд Claude CLI у Docker](/uk/install/docker#claude-cli-backend-in-docker).

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли бінарний файл `claude`
ще не доступний у `PATH`.

## Сеанси

- Якщо CLI підтримує сеанси, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ID потрібно вставити
  в кілька прапорів.
- Якщо CLI використовує **підкоманду resume** з іншими прапорами, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за бажанням, `resumeOutput`
  (для відновлень не в JSON).
- `sessionMode`:
  - `always`: завжди надсилати ідентифікатор сеансу (новий UUID, якщо жоден не збережено).
  - `existing`: надсилати ідентифікатор сеансу лише якщо його було збережено раніше.
  - `none`: ніколи не надсилати ідентифікатор сеансу.
- `claude-cli` за замовчуванням використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб наступні ходи повторно використовували live-процес Claude, поки
  він активний. Теплий stdio тепер є стандартом, зокрема для користувацьких конфігурацій,
  які не вказують transport-поля. Якщо Gateway перезапускається або idle-процес
  завершується, OpenClaw відновлюється зі збереженого ідентифікатора сеансу Claude. Збережені ідентифікатори сеансів
  перевіряються за наявним читабельним transcript проєкту перед
  відновленням, тому фантомні привʼязки очищуються з `reason=transcript-missing`
  замість тихого запуску нового сеансу Claude CLI під `--resume`.
- Live-сеанси Claude зберігають обмежені запобіжники виводу JSONL. Стандартні значення дозволяють до
  8 MiB і 20 000 необроблених рядків JSONL на хід. Ходи Claude з великою кількістю інструментів можуть підвищити
  їх для кожного бекенду через
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  і `maxTurnLines`; OpenClaw обмежує ці налаштування до 64 MiB і 100 000
  рядків.
- Збережені сеанси CLI — це керована провайдером безперервність. Неявне щоденне скидання сеансу
  їх не перериває; `/reset` і явні політики `session.reset` все ще
  переривають.
- Нові сеанси CLI зазвичай повторно засіваються лише із summary Compaction OpenClaw
  плюс tail після Compaction. Щоб відновлювати короткі сеанси, які інвалідовані
  до Compaction, бекенд може увімкнути це через
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw усе одно тримає raw
  transcript reseed обмеженим і дозволяє його лише для безпечних інвалідизацій, як-от відсутні
  transcript-и CLI, зміни system-prompt/MCP або повторна спроба через session-expired; зміни
  auth profile або credential-epoch ніколи не засівають raw transcript history повторно.

Примітки щодо серіалізації:

- `serialize: true` зберігає порядок запусків у тій самій lane.
- Більшість CLI серіалізуються в одній provider lane.
- OpenClaw відкидає повторне використання збереженого сеансу CLI, коли вибрана auth identity змінюється,
  зокрема змінений auth profile id, статичний API key, статичний token або ідентичність OAuth
  account, коли CLI її expose-ить. Ротація access і refresh token OAuth
  не перериває збережений сеанс CLI. Якщо CLI не expose-ить
  стабільний OAuth account id, OpenClaw дозволяє цьому CLI забезпечувати дозволи resume.

## Резервний prelude із сеансів claude-cli

Коли спроба `claude-cli` переходить на non-CLI candidate у
[`agents.defaults.model.fallbacks`](/uk/concepts/model-failover), OpenClaw засіває
наступну спробу контекстним prelude, отриманим із локального JSONL transcript Claude Code
у `~/.claude/projects/`. Без цього seed резервний
провайдер стартував би холодним, бо власний transcript сеансу OpenClaw порожній
для запусків `claude-cli`.

- Prelude надає перевагу найновішому summary `/compact` або маркеру `compact_boundary`,
  потім додає найостанніші ходи після межі в межах char
  budget. Ходи до межі відкидаються, бо summary вже їх представляє.
- Блоки інструментів обʼєднуються в компактні підказки `(tool call: name)` і
  `(tool result: …)`, щоб зберігати чесний prompt budget. Summary позначається
  `(truncated)`, якщо переповнюється.
- Резервні переходи `claude-cli` на `claude-cli` у того самого провайдера покладаються на власний
  `--resume` Claude і пропускають prelude.
- Seed повторно використовує наявну валідацію шляху session-file Claude, тому
  довільні шляхи не можуть бути прочитані.

## Зображення (наскрізне передавання)

Якщо ваш CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення в тимчасові файли. Якщо `imageArg` задано, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (інʼєкція шляху), чого достатньо для CLI, які auto-
load локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (за замовчуванням) намагається розібрати JSON і витягти текст + ідентифікатор сеансу.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response` і usage
  зі `stats`, коли `usage` відсутній або порожній. Вбудований стандарт Gemini CLI
  використовує `stream-json`, але старі перевизначення `--output-format json` усе ще використовують
  JSON-парсер.
- `output: "jsonl"` розбирає потоки JSONL і витягує фінальне повідомлення агента плюс ідентифікатори
  сеансів, коли вони присутні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими вводу:

- `input: "arg"` (за замовчуванням) передає запит як останній аргумент CLI.
- `input: "stdin"` надсилає запит через stdin.
- Якщо запит дуже довгий і встановлено `maxPromptArgChars`, використовується stdin.

## Стандартні значення (належать Plugin)

Стандартні значення бекенду вбудованого CLI зберігаються в Plugin, який ними володіє. Наприклад,
Anthropic володіє `claude-cli`, а Google володіє `google-gemini-cli`. Запуски агента OpenAI Codex
використовують harness сервера застосунку Codex через `openai/*`; OpenClaw більше
не реєструє вбудований бекенд `codex-cli`.

Вбудований Plugin Anthropic реєструє стандартне значення для `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Вбудований Plugin Google також реєструє стандартне значення для `google-gemini-cli`:

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

- Стандартний парсер `stream-json` читає події `message` асистента, події інструментів,
  підсумкове використання `result` і фатальні події помилок Gemini.
- Якщо ви перевизначите аргументи Gemini на `--output-format json`, OpenClaw нормалізує цей
  бекенд назад до `output: "json"` і читає текст відповіді з поля JSON `response`.
- Якщо `usage` відсутній або порожній, використання береться з `stats`.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (типово: абсолютний шлях `command`).

## Стандартні значення, що належать Plugin

Стандартні значення бекенду CLI тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенду стає префіксом постачальника в посиланнях на моделі.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` усе ще перевизначає стандартне значення Plugin.
- Очищення конфігурації, специфічної для бекенду, залишається у власності Plugin через необов’язковий
  hook `normalizeConfig`.

Plugins, яким потрібні невеликі compatibility shim для запиту/повідомлення, можуть оголосити
двонапрямні текстові перетворення без заміни постачальника або бекенду CLI:

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

`input` переписує системний запит і запит користувача, передані в CLI. `output`
переписує потокові дельти асистента та розібраний фінальний текст до того, як OpenClaw обробить
власні контрольні маркери й доставку каналом.

Для CLI, які випускають специфічні для постачальника події JSONL, задайте `jsonlDialect` у
конфігурації цього бекенду. Підтримувані діалекти: `claude-stream-json` для потоків, сумісних із Claude
Code, і `gemini-stream-json` для подій Gemini CLI `stream-json`.

## Володіння нативною Compaction

Деякі бекенди CLI запускають агента, який стискає **власну** розшифровку, тому OpenClaw не повинен
запускати для них свій запобіжний узагальнювач: це конфліктує з власною Compaction бекенду
і може призвести до жорсткого збою ходу.

`claude-cli` не має endpoint harness: Claude Code стискає внутрішньо, тому він оголошує
`ownsNativeCompaction: true`, а OpenClaw повертає no-op зі шляху Compaction.
Натомість сесії з нативним harness, як-от Codex, і далі маршрутизуються до endpoint Compaction свого harness.

Оскільки бекенд володіє Compaction, старий тимчасовий спосіб встановлювати
`contextTokens: 1_000_000` лише для того, щоб запобіжник OpenClaw не спрацьовував у
сесії claude-cli, **більше не потрібен**: його замінює відмова.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Оголошуйте `ownsNativeCompaction` лише для бекенду, який справді володіє своєю Compaction: він
має надійно обмежувати власну розшифровку, коли наближається до свого контекстного вікна, і зберігати
сесію, яку можна відновити (наприклад, `--resume` / `--session-id`); інакше відкладена сесія може
залишатися понад бюджет. Сесії з відповідним `agentHarnessId` усе ще маршрутизуються до endpoint harness.

## Накладення bundle MCP

Бекенди CLI **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенероване накладення конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований строгий файл конфігурації MCP
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає HTTP MCP сервер local loopback, який відкриває інструменти Gateway для процесу CLI
- автентифікує міст за допомогою токена для окремої сесії (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, обліковим записом і контекстом каналу
- завантажує увімкнені сервери bundle-MCP для поточного робочого простору
- об’єднує їх із будь-якою наявною формою конфігурації/налаштувань MCP бекенду
- переписує конфігурацію запуску, використовуючи режим інтеграції, яким володіє бекенд, з відповідного розширення

Якщо MCP сервери не ввімкнені, OpenClaw усе одно вставляє строгу конфігурацію, коли
бекенд вмикає bundle MCP, щоб фонові запуски залишалися ізольованими.

Сесійні вбудовані середовища виконання MCP кешуються для повторного використання в межах сесії, а потім
прибираються після `mcp.sessionIdleTtlMs` мілісекунд простою (за замовчуванням 10
хвилин; встановіть `0`, щоб вимкнути). Одноразові вбудовані запуски, як-от перевірки автентифікації,
генерація slug і запит відкликання active-memory очищаються наприкінці запуску, щоб stdio
дочірні процеси та потоки Streamable HTTP/SSE не жили довше за запуск.

## Ліміт історії для повторного засівання

Коли нова сесія CLI засівається з попередньої розшифровки OpenClaw (наприклад,
після повторної спроби `session_expired`), відрендерений блок
`<conversation_history>` обмежується, щоб запити повторного засівання не
розросталися. Стандартне значення — `12288` символів (приблизно 3000 токенів).

Бекенди Claude CLI автоматично використовують більший ліміт, отриманий із визначеного
рівня контексту Claude. Стандартні запуски Claude на 200K токенів зберігають більший зріз
розшифровки, а запуски Claude на 1M токенів зберігають ще більший зріз, тоді як інші бекенди CLI
зберігають консервативне стандартне значення.

- Ліміт керує лише блоком попередньої історії в запиті повторного засівання. Обмеження
  виводу живої сесії налаштовуються окремо в `reliability.outputLimits`
  (див. [Сесії](#sessions)).

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не вставляє виклики інструментів у
  протокол бекенду CLI. Бекенди бачать інструменти Gateway лише тоді, коли вмикають
  `bundleMcp: true`.
- **Потокова передача залежить від бекенду.** Деякі бекенди передають JSONL потоково; інші буферизують
  до завершення.
- **Структуровані виводи** залежать від формату JSON CLI.

## Усунення несправностей

- **CLI не знайдено**: встановіть `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає неперервності сесії**: переконайтеся, що `sessionArg` встановлено, а `sessionMode` не дорівнює
  `none`.
- **Зображення ігноруються**: встановіть `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
