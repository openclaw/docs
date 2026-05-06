---
read_when:
    - Налаштування схвалень виконання команд або списків дозволеного
    - Впровадження UX схвалення exec у застосунку macOS
    - Огляд промптів для втечі з пісочниці та їхніх наслідків
sidebarTitle: Exec approvals
summary: 'Схвалення виконання на хості: параметри політики, списки дозволів і робочий процес YOLO/суворий'
title: Схвалення виконання
x-i18n:
    generated_at: "2026-05-06T00:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30733fe6580e7c10e3e61c5d050a60939512e67a6dc8b279adf703b30ec344ea
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals — це **запобіжник companion app / node host**, який дозволяє
sandboxed agent запускати команди на реальному хості (`gateway` або `node`). Це
захисне блокування: команди дозволені лише тоді, коли policy + allowlist +
(необов’язкове) підтвердження користувача всі узгоджені. Exec approvals накладаються **поверх**
tool policy та elevated gating (крім випадку, коли elevated встановлено в `full`, що
пропускає approvals).

<Note>
Ефективна policy є **суворішою** з `tools.exec.*` і стандартних значень approvals;
якщо поле approvals пропущено, використовується значення `tools.exec`.
Host exec також використовує локальний стан approvals на цій машині — локальне для хоста
`ask: "always"` у `~/.openclaw/exec-approvals.json` продовжує
запитувати підтвердження, навіть якщо стандартні значення сесії або конфігурації вимагають `ask: "on-miss"`.
</Note>

## Перевірка ефективної policy

| Команда                                                          | Що вона показує                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Запитана policy, джерела host policy та ефективний результат.                         |
| `openclaw exec-policy show`                                      | Об’єднаний вигляд локальної машини.                                                    |
| `openclaw exec-policy set` / `preset`                            | Синхронізує локальну запитану policy з локальним файлом host approvals за один крок.  |

Коли локальна область запитує `host=node`, `exec-policy show` повідомляє цю
область як керовану вузлом під час виконання, замість удавати, що локальний
файл approvals є джерелом істини.

Якщо UI companion app **недоступний**, будь-який запит, який зазвичай
потребував би підтвердження, розв’язується через **ask fallback** (стандартно: `deny`).

<Tip>
Нативні клієнти підтвердження в чаті можуть додавати зручні дії, специфічні для каналу,
до повідомлення з очікуваним підтвердженням. Наприклад, Matrix додає швидкі реакції
(`✅` дозволити один раз, `❌` відхилити, `♾️` дозволити завжди), водночас залишаючи
команди `/approve ...` у повідомленні як запасний варіант.
</Tip>

## Де це застосовується

Exec approvals застосовуються локально на хості виконання:

- **Gateway host** → процес `openclaw` на машині Gateway.
- **Node host** → node runner (macOS companion app або headless node host).

### Модель довіри

- Виклики, автентифіковані Gateway, є довіреними операторами для цього Gateway.
- Спарені вузли розширюють цю можливість довіреного оператора на node host.
- Exec approvals зменшують ризик випадкового виконання, але **не** є межею автентифікації для окремого користувача.
- Схвалені запуски на node host прив’язують канонічний контекст виконання: канонічний cwd, точний argv, прив’язку env, коли вона присутня, і закріплений шлях виконуваного файла, коли це застосовно.
- Для shell scripts і прямих викликів файлів інтерпретатора/runtime OpenClaw також намагається прив’язати один конкретний локальний файловий операнд. Якщо цей прив’язаний файл змінюється після підтвердження, але до виконання, запуск відхиляється замість виконання зміненого вмісту.
- Прив’язка файла навмисно best-effort, **не** повна семантична модель кожного шляху завантаження інтерпретатора/runtime. Якщо режим підтвердження не може точно визначити один конкретний локальний файл для прив’язки, він відмовляється створювати запуск на основі підтвердження замість удавати повне покриття.

### Розділення в macOS

- **node host service** пересилає `system.run` до **macOS app** через локальний IPC.
- **macOS app** застосовує approvals і виконує команду в контексті UI.

## Налаштування та зберігання

Approvals зберігаються в локальному JSON-файлі на хості виконання:

```text
~/.openclaw/exec-approvals.json
```

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
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Регулятори policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — блокувати всі host exec requests.
  - `allowlist` — дозволяти лише allowlisted commands.
  - `full` — дозволяти все (еквівалентно elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — ніколи не запитувати підтвердження.
  - `on-miss` — запитувати лише тоді, коли allowlist не збігається.
  - `always` — запитувати для кожної команди. Тривала довіра `allow-always` **не** пригнічує запити, коли ефективний режим ask — `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Розв’язання, коли потрібен запит, але UI недосяжний.

- `deny` — блокувати.
- `allowlist` — дозволяти лише якщо allowlist збігається.
- `full` — дозволяти.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Коли `true`, OpenClaw трактує форми inline code-eval як такі, що потребують лише підтвердження,
  навіть якщо сам бінарний файл інтерпретатора є в allowlist. Defense-in-depth
  для завантажувачів інтерпретаторів, які не відображаються чисто на один стабільний файловий
  операнд.
</ParamField>

Приклади, які виявляє суворий режим:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

У суворому режимі ці команди все одно потребують явного підтвердження, а
`allow-always` не зберігає для них нові allowlist entries
автоматично.

## Режим YOLO (без підтверджень)

Якщо ви хочете, щоб host exec запускався без запитів підтвердження, потрібно відкрити
**обидва** шари policy — запитану exec policy у конфігурації OpenClaw
(`tools.exec.*`) **і** локальну для хоста approvals policy у
`~/.openclaw/exec-approvals.json`.

YOLO є стандартною поведінкою хоста, якщо ви явно не посилите її:

| Шар                   | Налаштування YOLO         |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` на `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Важливі відмінності:**

- `tools.exec.host=auto` вибирає, **де** виконується exec: у sandbox, коли він доступний, інакше на gateway.
- YOLO вибирає, **як** підтверджується host exec: `security=full` плюс `ask=off`.
- У режимі YOLO OpenClaw **не** додає окремий евристичний approval gate для приховування команд або шар попереднього відхилення скриптів поверх налаштованої host exec policy.
- `auto` не робить маршрутизацію gateway вільним override із sandboxed session. Запит `host=node` для окремого виклику дозволено з `auto`; `host=gateway` дозволено з `auto` лише коли не активний sandbox runtime. Для стабільного не-auto стандартного значення задайте `tools.exec.host` або явно використайте `/exec host=...`.

</Warning>

CLI-backed providers, які надають власний неінтерактивний режим дозволів,
можуть дотримуватися цієї policy. Claude CLI додає
`--permission-mode bypassPermissions`, коли запитана OpenClaw exec
policy — YOLO. Перевизначте цю поведінку backend явними аргументами Claude
у `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
наприклад `--permission-mode default`, `acceptEdits` або
`bypassPermissions`.

Якщо ви хочете консервативніше налаштування, посильте будь-який шар назад до
`allowlist` / `on-miss` або `deny`.

### Постійне налаштування gateway-host "ніколи не запитувати"

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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
  </Step>
</Steps>

### Локальний скорочений шлях

```bash
openclaw exec-policy preset yolo
```

Цей локальний скорочений шлях оновлює обидва:

- Локальні `tools.exec.host/security/ask`.
- Стандартні значення локального `~/.openclaw/exec-approvals.json`.

Він навмисно лише локальний. Щоб змінити approvals gateway-host або node-host
віддалено, використовуйте `openclaw approvals set --gateway` або
`openclaw approvals set --node <id|name|ip>`.

### Node host

Для node host застосуйте той самий файл approvals на цьому вузлі:

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

<Note>
**Обмеження лише для локального режиму:**

- `openclaw exec-policy` не синхронізує node approvals.
- `openclaw exec-policy set --host node` відхиляється.
- Node exec approvals отримуються з вузла під час виконання, тому оновлення, націлені на вузол, мають використовувати `openclaw approvals --node ...`.

</Note>

### Скорочений шлях лише для сесії

- `/exec security=full ask=off` змінює лише поточну сесію.
- `/elevated full` — break-glass скорочений шлях, який також пропускає exec approvals для цієї сесії.

Якщо файл host approvals залишається суворішим за конфігурацію, суворіша host
policy все одно перемагає.

## Allowlist (для кожного агента)

Allowlists є **окремими для кожного агента**. Якщо існує кілька агентів, перемкніть в macOS app, якого агента
ви редагуєте. Patterns — це glob matches.

Patterns можуть бути resolved binary path globs або bare command-name globs.
Bare names збігаються лише з командами, викликаними через `PATH`, тому `rg` може збігатися з
`/opt/homebrew/bin/rg`, коли команда — `rg`, але **не** з `./rg` або
`/tmp/rg`. Використовуйте path glob, коли хочете довіряти одному конкретному
розташуванню бінарного файла.

Застарілі записи `agents.default` мігруються в `agents.main` під час завантаження.
Shell chains, як-от `echo ok && pwd`, все одно потребують, щоб кожен верхньорівневий сегмент
задовольняв правила allowlist.

Приклади:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Обмеження аргументів за допомогою argPattern

Додайте `argPattern`, коли allowlist entry має збігатися з бінарним файлом і
конкретною формою аргументів. OpenClaw оцінює регулярний вираз
за розібраними аргументами команди, виключаючи токен виконуваного файла
(`argv[0]`). Для записів, створених вручну, аргументи об’єднуються
одним пробілом, тому використовуйте anchors у pattern, коли потрібен точний збіг.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Цей запис дозволяє `python3 safe.py`; `python3 other.py` є allowlist
miss. Якщо path-only entry для того самого бінарного файла також присутній, аргументи без збігу
все ще можуть fallback до цього path-only entry. Пропустіть path-only
entry, коли мета — обмежити бінарний файл оголошеними аргументами.

Entries, збережені потоками підтвердження, можуть використовувати внутрішній формат розділювача для
точного зіставлення argv. Надавайте перевагу UI або approval flow для повторного створення цих
entries замість ручного редагування закодованого значення. Якщо OpenClaw не може
розібрати argv для сегмента команди, entries з `argPattern` не збігаються.

Кожен allowlist entry підтримує:

| Поле              | Значення                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Визначений glob шляху до бінарного файла або glob простої назви команди           |
| `argPattern`       | Необов’язковий regex argv; пропущені записи стосуються лише шляху            |
| `id`               | Стабільний UUID, що використовується для ідентичності в UI                              |
| `source`           | Джерело запису, наприклад `allow-always`                          |
| `commandText`      | Текст команди, зафіксований, коли потік схвалення створив запис |
| `lastUsedAt`       | Позначка часу останнього використання                                           |
| `lastUsedCommand`  | Остання команда, що збіглася                                     |
| `lastResolvedPath` | Останній визначений шлях до бінарного файла                                     |

## Автоматично дозволені CLI Skills

Коли **Автоматично дозволені CLI Skills** увімкнено, виконувані файли, на які посилаються
відомі skills, вважаються внесеними до allowlist на вузлах (macOS-вузол або headless
хост вузла). Для цього використовується `skills.bins` через Gateway RPC, щоб отримати
список бінарних файлів skill. Вимкніть це, якщо вам потрібні суворі ручні allowlist.

<Warning>
- Це **неявний зручний allowlist**, окремий від ручних записів allowlist шляхів.
- Він призначений для довірених операторських середовищ, де Gateway і вузол перебувають в одній межі довіри.
- Якщо вам потрібна сувора явна довіра, залиште `autoAllowSkills: false` і використовуйте лише ручні записи allowlist шляхів.

</Warning>

## Безпечні бінарні файли та пересилання схвалень

Про безпечні бінарні файли (швидкий шлях лише через stdin), деталі прив’язки інтерпретатора та
те, як пересилати запити на схвалення до Slack/Discord/Telegram (або запускати їх як
нативні клієнти схвалення), див.
[Схвалення exec — розширено](/uk/tools/exec-approvals-advanced).

## Редагування в Control UI

Використовуйте картку **Control UI → Nodes → Exec approvals**, щоб редагувати типові значення,
перевизначення для окремих агентів і allowlist. Виберіть область (типові значення або агент),
змініть політику, додайте/видаліть шаблони allowlist, а потім натисніть **Зберегти**. UI
показує метадані останнього використання для кожного шаблону, щоб список залишався впорядкованим.

Селектор цілі вибирає **Gateway** (локальні схвалення) або **Вузол**.
Вузли мають рекламувати `system.execApprovals.get/set` (застосунок macOS або
headless хост вузла). Якщо вузол ще не рекламує схвалення exec,
редагуйте його локальний `~/.openclaw/exec-approvals.json` напряму.

CLI: `openclaw approvals` підтримує редагування gateway або вузла — див.
[CLI схвалень](/uk/cli/approvals).

## Потік схвалення

Коли потрібен запит, gateway транслює
`exec.approval.requested` клієнтам операторів. Control UI і застосунок macOS
вирішують його через `exec.approval.resolve`, після чого gateway пересилає
схвалений запит до хоста вузла.

Для `host=node` запити на схвалення містять канонічне корисне навантаження
`systemRunPlan`. Gateway використовує цей план як авторитетний
контекст command/cwd/session під час пересилання схвалених запитів `system.run`.

Це важливо для затримки асинхронного схвалення:

- Шлях exec вузла заздалегідь готує один канонічний план.
- Запис схвалення зберігає цей план і його метадані прив’язки.
- Після схвалення фінальний пересланий виклик `system.run` повторно використовує збережений план замість того, щоб довіряти пізнішим правкам викликача.
- Якщо викликач змінює `command`, `rawCommand`, `cwd`, `agentId` або `sessionKey` після створення запиту на схвалення, gateway відхиляє пересланий запуск як невідповідність схвалення.

## Системні події

Життєвий цикл exec відображається як системні повідомлення:

- `Exec running` (лише якщо команда перевищує поріг сповіщення про виконання).
- `Exec finished`.
- `Exec denied`.

Вони публікуються в сесії агента після того, як вузол повідомляє про подію.
Схвалення exec на хості Gateway генерують ті самі події життєвого циклу, коли
команда завершується (і, за потреби, коли виконується довше за поріг).
Exec, обмежені схваленням, повторно використовують id схвалення як `runId` у цих
повідомленнях для зручної кореляції.

## Поведінка відхиленого схвалення

Коли асинхронне схвалення exec відхилено, OpenClaw не дає агенту
повторно використовувати вивід із будь-якого попереднього запуску тієї самої команди в сесії.
Причина відхилення передається з явною вказівкою, що вивід команди
недоступний, що не дозволяє агенту стверджувати, ніби є новий вивід, або
повторювати відхилену команду зі застарілими результатами попереднього успішного
запуску.

## Наслідки

- **`full`** є потужним; за можливості віддавайте перевагу allowlist.
- **`ask`** тримає вас у циклі, водночас дозволяючи швидкі схвалення.
- Allowlist для окремих агентів запобігають витоку схвалень одного агента до інших.
- Схвалення застосовуються лише до host-запитів exec від **авторизованих відправників**. Неавторизовані відправники не можуть виконувати `/exec`.
- `/exec security=full` — це зручність на рівні сесії для авторизованих операторів, яка навмисно пропускає схвалення. Щоб жорстко заблокувати host exec, встановіть безпеку схвалень на `deny` або забороніть інструмент `exec` через політику інструментів.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Схвалення exec — розширено" href="/uk/tools/exec-approvals-advanced" icon="gear">
    Безпечні бінарні файли, прив’язка інтерпретатора та пересилання схвалень у чат.
  </Card>
  <Card title="Інструмент exec" href="/uk/tools/exec" icon="terminal">
    Інструмент виконання команд оболонки.
  </Card>
  <Card title="Режим із підвищеними привілеями" href="/uk/tools/elevated" icon="shield-exclamation">
    Аварійний шлях, який також пропускає схвалення.
  </Card>
  <Card title="Ізоляція" href="/uk/gateway/sandboxing" icon="box">
    Режими ізоляції та доступ до робочого простору.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security" icon="lock">
    Модель безпеки та посилення захисту.
  </Card>
  <Card title="Ізоляція проти політики інструментів проти підвищеного режиму" href="/uk/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Коли використовувати кожен елемент керування.
  </Card>
  <Card title="Skills" href="/uk/tools/skills" icon="sparkles">
    Поведінка автоматичного дозволу на основі skills.
  </Card>
</CardGroup>
