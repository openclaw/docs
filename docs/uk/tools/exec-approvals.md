---
read_when:
    - Налаштування exec approvals або allowlist-ів
    - "Реалізація UX для exec approval у macOS app\U0004E882analysis to=functions.read  鸿丰json  content={\"path\":\"docs/tools/exec-approvals.md\",\"offset\":1,\"limit\":360}"
    - Перевірка prompts для виходу із sandbox та їхніх наслідків
summary: Exec approvals, allowlist-и та prompts для виходу із sandbox
title: Exec approvals
x-i18n:
    generated_at: "2026-04-23T21:14:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: aed029a7aff5b4a9e67e5fc20a91ca80b1ddabb562cb5a1ce05c2a6222321698
    source_path: tools/exec-approvals.md
    workflow: 15
---

Exec approvals — це **запобіжник companion app / node host**, який дозволяє
sandboxed agent виконувати команди на реальному host (`gateway` або `node`). Це
захисне блокування: команди дозволяються лише тоді, коли одночасно збігаються policy + allowlist + (необов’язкове) user approval.
Exec approvals нашаровуються **поверх** tool policy та elevated gating (якщо тільки `elevated` не встановлено в `full`, що пропускає approvals).

<Note>
Ефективна policy — це **суворіша** з `tools.exec.*` і типових значень approvals;
якщо поле approvals пропущено, використовується значення `tools.exec`. Exec на host
також використовує локальний стан approvals на цій машині — host-local `ask: "always"` у `~/.openclaw/exec-approvals.json` продовжує показувати prompts, навіть якщо типові значення session або config запитують `ask: "on-miss"`.
</Note>

## Перегляд ефективної policy

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — показують запитану policy, джерела policy host-а та ефективний результат.
- `openclaw exec-policy show` — локальний об’єднаний перегляд для машини.
- `openclaw exec-policy set|preset` — синхронізують локальну запитану policy з локальним host approvals file за один крок.

Коли локальна область запитує `host=node`, `exec-policy show` під час runtime
показує цю область як керовану Node замість того, щоб удавати, що локальний approvals file є джерелом істини.

Якщо UI companion app **недоступний**, будь-який запит, який зазвичай вимагав би
prompt, розв’язується через **ask fallback** (типово: deny).

<Tip>
Native chat approval clients можуть підставляти affordances, специфічні для каналу,
у повідомлення про pending approval. Наприклад, Matrix підставляє shortcuts через реакції (`✅`
дозволити один раз, `❌` заборонити, `♾️` дозволити завжди), залишаючи при цьому команди `/approve ...`
у повідомленні як fallback.
</Tip>

## Де це застосовується

Exec approvals застосовуються локально на host виконання:

- **gateway host** → процес `openclaw` на машині gateway
- **node host** → node runner (macOS companion app або headless node host)

Примітка щодо моделі довіри:

- Виклики, автентифіковані в Gateway, вважаються довіреними операторами цього Gateway.
- Paired Node розширюють цю довірену операторську можливість на node host.
- Exec approvals зменшують ризик випадкового виконання, але не є межею auth для кожного користувача окремо.
- Схвалені node-host runs прив’язують канонічний контекст виконання: канонічний cwd, точний argv, env
  binding за наявності та зафіксований шлях до executable, коли це доречно.
- Для shell scripts і прямих викликів interpreter/runtime file OpenClaw також намагається прив’язати
  один конкретний локальний file operand. Якщо цей прив’язаний файл змінюється після approval, але до виконання,
  запуск забороняється замість виконання дрейфованого вмісту.
- Це прив’язування файлу навмисно є best-effort, а не повною семантичною моделлю кожного
  шляху завантажувача interpreter/runtime. Якщо режим approval не може визначити рівно один конкретний локальний
  файл для прив’язки, він відмовляється створювати run, що спирається на approval, замість удавання повного покриття.

Поділ macOS:

- **node host service** пересилає `system.run` до **macOS app** через локальний IPC.
- **macOS app** застосовує approvals + виконує команду в контексті UI.

## Налаштування та зберігання

Approvals живуть у локальному JSON file на host виконання:

`~/.openclaw/exec-approvals.json`

Приклад схеми:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Режим "YOLO" без approvals

Якщо ви хочете, щоб exec на host виконувався без prompts approvals, потрібно відкрити **обидва** шари policy:

- запитану exec policy в конфігурації OpenClaw (`tools.exec.*`)
- локальну policy approvals host-а в `~/.openclaw/exec-approvals.json`

Тепер це типова поведінка host-а, якщо ви явно її не посилите:

- `tools.exec.security`: `full` на `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Важливе розрізнення:

- `tools.exec.host=auto` вибирає, де виконується exec: у sandbox, якщо він доступний, інакше на gateway.
- YOLO визначає, як схвалюється exec на host: `security=full` плюс `ask=off`.
- У режимі YOLO OpenClaw не додає окремий евристичний approval gate для обфускації команд або шар відхилення preflight scripts поверх налаштованої policy host exec.
- `auto` не робить маршрутизацію через gateway безкоштовним перевизначенням із sandboxed session. Запит `host=node` для окремого виклику дозволений з `auto`, а `host=gateway` дозволений із `auto` лише тоді, коли немає активного runtime sandbox. Якщо вам потрібен стабільний типовий варіант не-`auto`, задайте `tools.exec.host` або використовуйте `/exec host=...` явно.

Якщо вам потрібне консервативніше налаштування, посильте будь-який із шарів назад до `allowlist` / `on-miss`
або `deny`.

Постійне налаштування gateway-host "ніколи не питати":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Потім задайте файл approvals host-а відповідно:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Локальний shortcut для тієї ж policy gateway-host на поточній машині:

```bash
openclaw exec-policy preset yolo
```

Цей локальний shortcut оновлює одночасно:

- локальні `tools.exec.host/security/ask`
- локальні типові значення в `~/.openclaw/exec-approvals.json`

Він навмисно діє лише локально. Якщо вам потрібно змінити approvals gateway-host або node-host
віддалено, продовжуйте використовувати `openclaw approvals set --gateway` або
`openclaw approvals set --node <id|name|ip>`.

Для node host застосуйте той самий approvals file безпосередньо на цьому node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Важливе локальне обмеження:

- `openclaw exec-policy` не синхронізує approvals Node
- `openclaw exec-policy set --host node` відхиляється
- exec approvals для Node отримуються з Node під час runtime, тому оновлення, націлені на Node, мають використовувати `openclaw approvals --node ...`

Shortcut лише для session:

- `/exec security=full ask=off` змінює лише поточну session.
- `/elevated full` — це break-glass shortcut, який також пропускає exec approvals для цієї session.

Якщо файл approvals host-а лишається суворішим за config, усе одно перемагає суворіша host policy.

## Регулятори policy

### Security (`exec.security`)

- **deny**: блокувати всі host exec requests.
- **allowlist**: дозволяти лише allowlisted commands.
- **full**: дозволяти все (еквівалентно elevated).

### Ask (`exec.ask`)

- **off**: ніколи не показувати prompt.
- **on-miss**: показувати prompt лише тоді, коли allowlist не збігається.
- **always**: показувати prompt для кожної команди.
- Довірене збереження `allow-always` не прибирає prompts, коли ефективний режим ask — `always`

### Ask fallback (`askFallback`)

Якщо потрібен prompt, але жоден UI недосяжний, fallback вирішує:

- **deny**: блокувати.
- **allowlist**: дозволяти лише якщо збігається allowlist.
- **full**: дозволяти.

### Захист inline interpreter eval (`tools.exec.strictInlineEval`)

Коли `tools.exec.strictInlineEval=true`, OpenClaw вважає форми inline code-eval такими, що потребують лише explicit approval, навіть якщо сам binary interpreter-а внесено в allowlist.

Приклади:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Це defense-in-depth для loader-ів interpreter-а, які не відображаються чисто на один стабільний file operand. У strict mode:

- такі команди однаково потребують explicit approval;
- `allow-always` не зберігає для них нові записи allowlist автоматично.

## Allowlist (для кожного агента)

Allowlist-и є **per agent**. Якщо існує кілька агентів, перемкніть, якого саме агента ви
редагуєте в macOS app. Patterns — це **case-insensitive glob matches**.
Patterns мають розв’язуватися до **шляхів binary** (записи лише з basename ігноруються).
Legacy-записи `agents.default` мігруються в `agents.main` під час завантаження.
Shell chains на кшталт `echo ok && pwd` усе одно вимагають, щоб кожен top-level segment задовольняв правила allowlist.

Приклади:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Кожен запис allowlist відстежує:

- **id** — стабільний UUID, який використовується для ідентичності в UI (необов’язковий)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Auto-allow для skill CLI

Коли ввімкнено **Auto-allow skill CLIs**, executable-ы, на які посилаються відомі Skills,
вважаються allowlisted на Node (macOS node або headless node host). Для цього використовується
`skills.bins` через Gateway RPC для отримання списку skill bin. Вимкніть це, якщо хочете суворі ручні allowlist-и.

Важливі примітки щодо довіри:

- Це **неявний convenience allowlist**, окремий від ручних записів path allowlist.
- Він призначений для середовищ довіреного оператора, де Gateway і Node перебувають в одній межі довіри.
- Якщо вам потрібна сувора явна довіра, залишайте `autoAllowSkills: false` і використовуйте лише ручні записи path allowlist.

## Safe bins (лише stdin)

`tools.exec.safeBins` визначає невеликий список **stdin-only** binary (наприклад
`cut`), які можуть працювати в режимі allowlist **без** явних записів
allowlist. Safe bins відхиляють positional file args і path-like tokens, тому
можуть працювати лише з вхідним потоком. Сприймайте це як вузький швидкий шлях для
фільтрів потоку, а не як загальний список довіри.

<Warning>
**Не** додавайте interpreter або runtime binaries (наприклад `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) до `safeBins`. Якщо команда за задумом може обчислювати код,
виконувати підкоманди або читати файли, віддавайте перевагу явним записам
allowlist і залишайте prompts approvals увімкненими. Custom safe bins мають визначати явний
profile у `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Типові safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` і `sort` не входять до типового списку. Якщо ви явно їх додаєте,
залишайте явні записи allowlist для їхніх сценаріїв не лише зі stdin. Для `grep` у режимі safe-bin
передавайте pattern через `-e`/`--regexp`; позиційна форма pattern відхиляється,
щоб file operands не можна було протягнути як неоднозначні positionals.

### Перевірка argv і заборонені прапорці

Перевірка є детермінованою лише за формою argv (без перевірок існування host filesystem),
що запобігає поведінці allow/deny у стилі oracle існування файлу. File-oriented options заборонені для типових safe bins; long options перевіряються fail-closed (невідомі прапорці та неоднозначні скорочення відхиляються).

Заборонені прапорці для safe-bin profiles:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins також примусово трактують tokens argv як **literal text** під час виконання
(без globbing і без розгортання `$VARS`) для stdin-only segments, тому шаблони
на кшталт `*` або `$HOME/...` не можна використовувати для прихованого читання файлів.

### Довірені каталоги binary

Safe bins мають розв’язуватися з довірених каталогів binary (system defaults плюс
необов’язковий `tools.exec.safeBinTrustedDirs`). Записи `PATH` ніколи автоматично не вважаються довіреними.
Типові довірені каталоги навмисно мінімальні: `/bin`, `/usr/bin`. Якщо
ваш executable safe-bin знаходиться в шляхах package-manager/user (наприклад
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), явно додайте їх
до `tools.exec.safeBinTrustedDirs`.

### Shell chaining, wrappers і multiplexers

Shell chaining (`&&`, `||`, `;`) дозволено, коли кожен top-level segment
задовольняє allowlist (включно з safe bins або skill auto-allow). Redirections
у режимі allowlist залишаються непідтримуваними. Command substitution (`$()` / backticks)
відхиляється під час розбору allowlist, включно всередині подвійних лапок; використовуйте одинарні
лапки, якщо вам потрібен literal text `$()`.

У approvals companion app на macOS сирий shell text, що містить shell control або
syntax expansion (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`),
вважається allowlist miss, якщо тільки сам binary shell не внесено до allowlist.

Для shell-wrapper-ів (`bash|sh|zsh ... -c/-lc`) request-scoped env overrides
зводяться до малого явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Для рішень `allow-always` у режимі allowlist відомі dispatch wrapper-и (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішній шлях executable замість
шляху wrapper-а. Shell multiplexers (`busybox`, `toybox`) так само розгортаються для
shell applet-ів (`sh`, `ash` тощо). Якщо wrapper або multiplexer
неможливо безпечно розгорнути, жоден запис allowlist автоматично не зберігається.

Якщо ви вносите до allowlist interpreter-и на кшталт `python3` або `node`, надавайте перевагу
`tools.exec.strictInlineEval=true`, щоб inline eval усе одно вимагав явного
approval. У strict mode `allow-always` усе ще може зберігати benign
виклики interpreter/script, але носії inline-eval не зберігаються
автоматично.

### Safe bins проти allowlist

| Тема             | `tools.exec.safeBins`                                 | Allowlist (`exec-approvals.json`)                         |
| ---------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Мета             | Автодозвіл для вузьких stdin-фільтрів                 | Явна довіра до конкретних executable                      |
| Тип відповідності | Ім’я executable + policy argv safe-bin               | Glob-pattern розв’язаного шляху executable                |
| Область аргументів | Обмежена profile safe-bin і правилами literal-token | Лише відповідність шляху; за аргументи в іншому відповідаєте ви |
| Типові приклади  | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, custom CLI             |
| Найкраще застосування | Низькоризикові текстові трансформації в pipelines | Будь-який tool із ширшою поведінкою або побічними ефектами |

Розташування конфігурації:

- `safeBins` надходить із config (`tools.exec.safeBins` або `agents.list[].tools.exec.safeBins` для окремого агента).
- `safeBinTrustedDirs` надходить із config (`tools.exec.safeBinTrustedDirs` або `agents.list[].tools.exec.safeBinTrustedDirs` для окремого агента).
- `safeBinProfiles` надходить із config (`tools.exec.safeBinProfiles` або `agents.list[].tools.exec.safeBinProfiles` для окремого агента). Ключі profile для окремого агента перевизначають глобальні ключі.
- Записи allowlist живуть у host-local `~/.openclaw/exec-approvals.json` у `agents.<id>.allowlist` (або через Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` попереджає через `tools.exec.safe_bins_interpreter_unprofiled`, коли interpreter/runtime bins з’являються в `safeBins` без явних profiles.
- `openclaw doctor --fix` може згенерувати відсутні custom-записи `safeBinProfiles.<bin>` як `{}` (після цього перегляньте й посильте їх). Interpreter/runtime bins не генеруються автоматично.

Приклад custom profile:
__OC_I18N_900005__
Якщо ви явно додаєте `jq` до `safeBins`, OpenClaw однаково відхиляє builtin `env` у режимі safe-bin,
щоб `jq -n env` не міг вивантажити середовище процесу host-а без явного шляху allowlist
або prompt approval.

## Редагування в Control UI

Використовуйте картку **Control UI → Nodes → Exec approvals**, щоб редагувати defaults, per-agent
override-и та allowlist-и. Виберіть область (Defaults або agent), змініть policy,
додайте/видаліть patterns allowlist, а потім натисніть **Save**. UI показує метадані **last used**
для кожного pattern, щоб список було легко підтримувати охайним.

Селектор цілі вибирає **Gateway** (локальні approvals) або **Node**. Nodes
повинні оголошувати `system.execApprovals.get/set` (macOS app або headless node host).
Якщо node ще не оголошує exec approvals, відредагуйте його локальний
`~/.openclaw/exec-approvals.json` напряму.

CLI: `openclaw approvals` підтримує редагування gateway або node (див. [Approvals CLI](/cli/approvals)).

## Потік approval

Коли потрібен prompt, gateway транслює `exec.approval.requested` клієнтам операторів.
Control UI і macOS app розв’язують це через `exec.approval.resolve`, а потім gateway пересилає
схвалений запит до node host.

Для `host=node` approval-запити містять канонічний payload `systemRunPlan`. Gateway використовує
цей plan як авторитетний контекст command/cwd/session під час пересилання схвалених `system.run`
requests.

Це важливо для латентності асинхронного approval:

- шлях exec node готує один канонічний plan наперед
- запис approval зберігає цей plan і його binding metadata
- після схвалення остаточний пересланий виклик `system.run` повторно використовує збережений plan
  замість довіри до пізніших змін від викликача
- якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або
  `sessionKey` після створення approval request, gateway відхиляє
  пересланий запуск як approval mismatch

## Команди interpreter/runtime

Запуски interpreter/runtime, що спираються на approval, навмисно консервативні:

- Точний контекст argv/cwd/env завжди прив’язується.
- Форми прямого shell script і прямого runtime file прив’язуються в best-effort до одного конкретного
  snapshot локального файлу.
- Поширені wrapper-форми package manager-а, які все ще розв’язуються до одного прямого локального файлу (наприклад
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), розгортаються до прив’язування.
- Якщо OpenClaw не може визначити рівно один конкретний локальний файл для interpreter/runtime command
  (наприклад, package scripts, форми eval, loader chains, специфічні для runtime, або неоднозначні multi-file
  forms), виконання на основі approval відхиляється замість заяви про семантичне покриття, якого воно не має.
- Для таких workflow надавайте перевагу sandboxing, окремій межі host-а або явному trusted
  workflow allowlist/full, де оператор приймає ширшу семантику runtime.

Коли потрібні approvals, tool exec одразу повертає approval id. Використовуйте цей id для
кореляції пізніших system events (`Exec finished` / `Exec denied`). Якщо до спливу
timeout не надходить рішення, запит вважається timeout approval і показується як причина відмови.

### Поведінка доставки followup

Після завершення схваленого async exec OpenClaw надсилає followup-хід `agent` у ту саму session.

- Якщо існує валідна зовнішня ціль доставки (канал доставки плюс ціль `to`), followup-доставка використовує цей канал.
- У потоках лише webchat або internal-session без зовнішньої цілі followup-доставка лишається лише в session (`deliver: false`).
- Якщо викликач явно запитує strict external delivery без розв’язуваного зовнішнього каналу, запит завершується помилкою `INVALID_REQUEST`.
- Якщо ввімкнено `bestEffortDeliver` і зовнішній канал не вдається розв’язати, доставка знижується до session-only замість помилки.

Діалог підтвердження містить:

- command + args
- cwd
- agent id
- розв’язаний шлях executable
- host + metadata policy

Дії:

- **Allow once** → виконати зараз
- **Always allow** → додати до allowlist + виконати
- **Deny** → заблокувати

## Пересилання approvals у chat channels

Ви можете пересилати prompts exec approval у будь-який chat channel (включно з plugin channels) і схвалювати
їх через `/approve`. Це використовує звичайний pipeline outbound delivery.

Конфігурація:
__OC_I18N_900006__
Відповідь у чаті:
__OC_I18N_900007__
Команда `/approve` обробляє і exec approvals, і plugin approvals. Якщо ID не відповідає pending exec approval, вона автоматично перевіряє plugin approvals натомість.

### Пересилання plugin approvals

Пересилання plugin approvals використовує той самий pipeline доставки, що й exec approvals, але має власну
незалежну конфігурацію в `approvals.plugin`. Увімкнення або вимкнення одного не впливає на інше.
__OC_I18N_900008__
Форма конфігурації ідентична `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` і `targets` працюють однаково.

Канали, які підтримують спільні інтерактивні відповіді, відображають ті самі approval buttons і для exec, і для
plugin approvals. Канали без спільного інтерактивного UI повертаються до plain text з інструкціями `/approve`.

### Approvals у тому самому чаті на будь-якому каналі

Коли запит exec або plugin approval походить із deliverable chat surface, той самий чат
тепер типово може схвалити його через `/approve`. Це застосовується до таких каналів, як Slack, Matrix і
Microsoft Teams, на додачу до вже наявних потоків Web UI і terminal UI.

Цей спільний шлях текстової команди використовує звичайну модель auth каналу для цієї розмови. Якщо
чат походження вже може надсилати команди та отримувати відповіді, approval requests більше не потребують
окремого native delivery adapter лише для того, щоб лишатися pending.

Discord і Telegram також підтримують `/approve` у тому самому чаті, але ці канали однаково використовують
свій розв’язаний список approver-ів для авторизації, навіть коли native approval delivery вимкнено.

Для Telegram та інших native approval clients, які викликають Gateway напряму,
цей fallback навмисно обмежений збоями типу "approval not found". Реальна
відмова/помилка exec approval не повторюється мовчки як plugin approval.

### Native approval delivery

Деякі канали також можуть виступати як native approval clients. Native clients додають DMs approver-ів, fanout у чат походження
і специфічний для каналу інтерактивний UX approvals поверх спільного потоку `/approve`
у тому самому чаті.

Коли доступні native approval cards/buttons, саме цей native UI є основним
агентським шляхом. Агент не повинен також дублювати plain chat-команду
`/approve`, якщо тільки результат tool не каже, що chat approvals недоступні або
ручне схвалення лишається єдиним шляхом.

Узагальнена модель:

- policy host exec однаково вирішує, чи потрібне exec approval
- `approvals.exec` керує пересиланням prompts approval в інші chat destinations
- `channels.<channel>.execApprovals` керує тим, чи діє цей канал як native approval client

Native approval clients автоматично вмикають DM-first delivery, коли всі ці умови істинні:

- канал підтримує native approval delivery
- approver-ів можна розв’язати з явних `execApprovals.approvers` або документованих fallback sources цього каналу
- `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`

Установіть `enabled: false`, щоб явно вимкнути native approval client. Установіть `enabled: true`, щоб примусово
ввімкнути його, коли approver-и розв’язуються. Публічна доставка в chat походження й далі явно керується через
`channels.<channel>.execApprovals.target`.

FAQ: [Чому існує дві конфігурації exec approval для chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Ці native approval clients додають DM-маршрутизацію й необов’язковий channel fanout поверх спільного
потоку `/approve` у тому самому чаті та спільних approval buttons.

Спільна поведінка:

- Slack, Matrix, Microsoft Teams та подібні deliverable chats використовують звичайну модель auth каналу
  для `/approve` у тому самому чаті
- коли native approval client auto-enable-иться, типовою ціллю native delivery є approver DMs
- для Discord і Telegram лише розв’язані approver-и можуть схвалювати або відхиляти
- approver-и Discord можуть бути явними (`execApprovals.approvers`) або виводитися з `commands.ownerAllowFrom`
- approver-и Telegram можуть бути явними (`execApprovals.approvers`) або виводитися з наявної owner config (`allowFrom`, плюс direct-message `defaultTo`, де це підтримується)
- approver-и Slack можуть бути явними (`execApprovals.approvers`) або виводитися з `commands.ownerAllowFrom`
- native buttons Slack зберігають kind approval id, тому id виду `plugin:` можуть розв’язувати plugin approvals
  без другого локального fallback-шару Slack
- native DM/channel routing і reaction shortcuts у Matrix обробляють і exec, і plugin approvals;
  авторизація plugin-ів і далі походить із `channels.matrix.dm.allowFrom`
- requester не зобов’язаний бути approver-ом
- чат походження може схвалювати напряму через `/approve`, коли цей чат уже підтримує команди й відповіді
- native approval buttons Discord маршрутизують за kind approval id: id виду `plugin:` ідуть
  одразу до plugin approvals, усе інше — до exec approvals
- native approval buttons Telegram дотримуються того самого обмеженого fallback exec-to-plugin, що й `/approve`
- коли native `target` вмикає доставку в chat походження, prompts approval містять текст команди
- pending exec approvals типово спливають через 30 хвилин
- якщо жоден operator UI або налаштований approval client не може прийняти запит, prompt повертається до `askFallback`

Telegram типово використовує approver DMs (`target: "dm"`). Ви можете переключити на `channel` або `both`, якщо
хочете, щоб prompts approval також з’являлися в chat/topic походження Telegram. Для topics форуму Telegram OpenClaw зберігає topic як для prompt approval, так і для follow-up після схвалення.

Див.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Потік IPC macOS
__OC_I18N_900009__
Примітки щодо безпеки:

- Режим Unix socket `0600`, token зберігається в `exec-approvals.json`.
- Перевірка peer-а з тим самим UID.
- Challenge/response (nonce + HMAC token + request hash) + короткий TTL.

## Системні події

Життєвий цикл exec відображається як system messages:

- `Exec running` (лише якщо команда перевищує поріг повідомлення про виконання)
- `Exec finished`
- `Exec denied`

Вони публікуються в session агента після того, як node повідомляє про подію.
Gateway-host exec approvals генерують ті самі події життєвого циклу, коли команда завершується (і, за потреби, коли виконується довше за поріг).
Exec-и, що керуються approval, повторно використовують approval id як `runId` у цих повідомленнях для зручної кореляції.

## Поведінка при denied approval

Коли async exec approval відхилено, OpenClaw не дозволяє агенту повторно використовувати
вивід із будь-якого попереднього запуску тієї самої команди в session. Причина відмови
передається з явною вказівкою, що жоден command output недоступний, що не дозволяє
агенту стверджувати, ніби існує новий output, або повторювати відхилену команду зі
застарілими результатами попереднього успішного запуску.

## Наслідки

- **full** — це потужний режим; за можливості надавайте перевагу allowlist-ам.
- **ask** утримує вас у циклі ухвалення рішень і водночас дозволяє швидкі approvals.
- Allowlist-и на рівні агента не дозволяють approvals одного агента просочуватися в інших.
- Approvals застосовуються лише до host exec requests від **авторизованих відправників**. Неавторизовані відправники не можуть видавати `/exec`.
- `/exec security=full` — це session-level convenience для авторизованих операторів, і він навмисно пропускає approvals. Щоб жорстко заблокувати host exec, установіть security approvals у `deny` або забороніть tool `exec` через tool policy.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Exec tool" href="/uk/tools/exec" icon="terminal">
    Tool виконання shell-команд.
  </Card>
  <Card title="Elevated mode" href="/uk/tools/elevated" icon="shield-exclamation">
    Break-glass шлях, який також пропускає approvals.
  </Card>
  <Card title="Sandboxing" href="/uk/gateway/sandboxing" icon="box">
    Режими sandbox і доступ до workspace.
  </Card>
  <Card title="Security" href="/uk/gateway/security" icon="lock">
    Модель безпеки та посилення захисту.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/uk/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Коли варто використовувати кожен із цих механізмів.
  </Card>
  <Card title="Skills" href="/uk/tools/skills" icon="sparkles">
    Поведінка auto-allow, прив’язана до Skills.
  </Card>
</CardGroup>
