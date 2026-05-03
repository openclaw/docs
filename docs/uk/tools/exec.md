---
read_when:
    - Використання або змінення інструмента exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента Exec, режими stdin і підтримка TTY
title: Інструмент виконання
x-i18n:
    generated_at: "2026-05-03T17:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Запускайте команди оболонки в робочому просторі. Підтримує виконання на передньому плані + у фоновому режимі через `process`.
Якщо `process` заборонено, `exec` виконується синхронно та ігнорує `yieldMs`/`background`.
Фонові сесії мають область дії в межах агента; `process` бачить лише сесії того самого агента.

## Параметри

<ParamField path="command" type="string" required>
Команда оболонки для запуску.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Робочий каталог для команди.
</ParamField>

<ParamField path="env" type="object">
Перевизначення середовища у форматі ключ/значення, об’єднані поверх успадкованого середовища.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Автоматично перевести команду у фоновий режим після цієї затримки (мс).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Перевести команду у фоновий режим негайно замість очікування `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Перевизначити налаштований тайм-аут exec для цього виклику. Установлюйте `timeout: 0` лише тоді, коли команда має виконуватися без тайм-ауту процесу exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Запускати в псевдотерміналі, коли доступно. Використовуйте для CLI, що працюють лише з TTY, агентів кодування та термінальних UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Де виконувати. `auto` розпізнається як `sandbox`, коли активне середовище виконання sandbox, і як `gateway` в інших випадках.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Режим застосування для виконання через `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Поведінка запиту схвалення для виконання через `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Ідентифікатор/назва Node, коли `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Запросити підвищений режим — вийти з sandbox на налаштований шлях хоста. `security=full` примусово встановлюється лише тоді, коли elevated розпізнається як `full`.
</ParamField>

Примітки:

- `host` за замовчуванням має значення `auto`: sandbox, коли середовище виконання sandbox активне для сесії, інакше gateway.
- `host` приймає лише `auto`, `sandbox`, `gateway` або `node`. Це не селектор імені хоста; значення, схожі на імена хостів, відхиляються до запуску команди.
- `auto` — це стандартна стратегія маршрутизації, а не wildcard. `host=node` для окремого виклику дозволено з `auto`; `host=gateway` для окремого виклику дозволено лише тоді, коли немає активного середовища виконання sandbox.
- Без додаткової конфігурації `host=auto` все одно "просто працює": відсутність sandbox означає, що він розпізнається як `gateway`; активний sandbox означає, що він лишається в sandbox.
- `elevated` виходить із sandbox на налаштований шлях хоста: за замовчуванням `gateway`, або `node`, коли `tools.exec.host=node` (або стандарт сесії — `host=node`). Це доступно лише тоді, коли підвищений доступ увімкнено для поточної сесії/провайдера.
- Схвалення `gateway`/`node` контролюються через `~/.openclaw/exec-approvals.json`.
- `node` потребує спареного Node (супровідного застосунку або headless-хоста Node).
- Якщо доступно кілька Node, задайте `exec.node` або `tools.exec.node`, щоб вибрати один.
- `exec host=node` — єдиний шлях виконання shell-команд для Node; застарілий wrapper `nodes.run` вилучено.
- `timeout` застосовується до переднього плану, фону, `yieldMs`, gateway, sandbox і виконання `system.run` на Node. Якщо його не вказано, OpenClaw використовує `tools.exec.timeoutSec`; явне `timeout: 0` вимикає тайм-аут процесу exec для цього виклику.
- На хостах не Windows exec використовує `SHELL`, коли його задано; якщо `SHELL` — це `fish`, він віддає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникнути скриптів, несумісних із fish, а потім повертається до `SHELL`, якщо жодного з них немає.
- На хостах Windows exec віддає перевагу виявленню PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім повертається до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення завантажувача (`LD_*`/`DYLD_*`), щоб
  запобігти підміні бінарних файлів або ін’єкції коду.
- OpenClaw встановлює `OPENCLAW_SHELL=exec` у середовищі породженої команди (включно з PTY і виконанням у sandbox), щоб правила оболонки/профілю могли визначати контекст інструмента exec.
- `openclaw channels login` заблоковано з `exec`, оскільки це інтерактивний потік автентифікації каналу; запускайте його в терміналі на хості gateway або використовуйте нативний для каналу інструмент входу з чату, коли він існує.
- Важливо: sandboxing **вимкнено за замовчуванням**. Якщо sandboxing вимкнено, неявний `host=auto`
  розпізнається як `gateway`. Явний `host=sandbox` усе одно безпечно завершується помилкою замість тихого
  запуску на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` зі схваленнями.
- Попередні перевірки скриптів (для поширених помилок синтаксису оболонки Python/Node) перевіряють лише файли в межах
  ефективної області `workdir`. Якщо шлях скрипта розпізнається за межами `workdir`, попередню перевірку для
  цього файла пропускають.
- Для довготривалої роботи, що починається зараз, запустіть її один раз і покладайтеся на автоматичне
  пробудження після завершення, коли воно ввімкнене і команда виводить дані або завершується з помилкою.
  Використовуйте `process` для журналів, статусу, введення або втручання; не імітуйте
  планування циклами sleep, циклами timeout або повторним опитуванням.
- Для роботи, що має відбутися пізніше або за розкладом, використовуйте cron замість
  шаблонів sleep/delay з `exec`.

## Конфігурація

- `tools.exec.notifyOnExit` (за замовчуванням: true): коли true, фонові сесії exec додають системну подію в чергу та запитують Heartbeat після виходу.
- `tools.exec.approvalRunningNoticeMs` (за замовчуванням: 10000): видавати одне сповіщення “running”, коли exec, обмежений схваленням, виконується довше за це значення (0 вимикає).
- `tools.exec.timeoutSec` (за замовчуванням: 1800): стандартний тайм-аут exec для кожної команди в секундах. `timeout` для окремого виклику перевизначає його; `timeout: 0` для окремого виклику вимикає тайм-аут процесу exec.
- `tools.exec.host` (за замовчуванням: `auto`; розпізнається як `sandbox`, коли активне середовище виконання sandbox, інакше `gateway`)
- `tools.exec.security` (за замовчуванням: `deny` для sandbox, `full` для gateway + node, коли не задано)
- `tools.exec.ask` (за замовчуванням: `off`)
- Exec на хості без схвалення є стандартом для gateway + node. Якщо потрібна поведінка схвалень/allowlist, посиліть і `tools.exec.*`, і хостовий `~/.openclaw/exec-approvals.json`; див. [схвалення Exec](/uk/tools/exec-approvals#yolo-mode-no-approval).
- YOLO походить зі стандартів політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо потрібно примусово задати маршрутизацію через gateway або node, задайте `tools.exec.host` або використовуйте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` exec на хості безпосередньо дотримується налаштованої політики; немає додаткового евристичного префільтра обфускації команд або шару відхилення попередньої перевірки скриптів.
- `tools.exec.node` (за замовчуванням: не задано)
- `tools.exec.strictInlineEval` (за замовчуванням: false): коли true, форми inline eval інтерпретатора, як-от `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди потребують явного схвалення. `allow-always` усе ще може зберігати безпечні виклики інтерпретатора/скрипта, але форми inline-eval усе одно запитують підтвердження щоразу.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарні файли лише зі stdin, які можуть запускатися без явних записів allowlist. Докладну інформацію про поведінку див. у [безпечних bins](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів `safeBins`. Записи `PATH` ніколи не стають довіреними автоматично. Вбудовані стандартні значення — `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова користувацька політика argv для кожного safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Приклад:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Обробка PATH

- `host=gateway`: об’єднує `PATH` вашої login-shell із середовищем exec. Перевизначення `env.PATH`
  відхиляються для виконання на хості. Сам демон усе одно працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тому `/etc/profile` може скинути `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження профілю через внутрішню змінну середовища (без інтерполяції оболонки);
  `tools.exec.pathPrepend` також застосовується тут.
- `host=node`: до Node надсилаються лише незаблоковані перевизначення середовища, які ви передаєте. Перевизначення `env.PATH`
  відхиляються для виконання на хості та ігноруються хостами Node. Якщо потрібні додаткові записи PATH на Node,
  налаштуйте середовище служби хоста Node (systemd/launchd) або встановіть інструменти у стандартні розташування.

Прив’язка Node для кожного агента (використовуйте індекс списку агентів у конфігурації):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб задати **для сесії** стандартні значення `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` враховується лише для **авторизованих відправників** (allowlist каналів/парування плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує конфігурацію. Щоб повністю вимкнути exec, забороніть його через політику
інструментів (`tools.deny: ["exec"]` або для окремого агента). Схвалення хоста все одно застосовуються, якщо ви явно не встановили
`security=full` і `ask=off`.

## Схвалення Exec (супровідний застосунок / хост Node)

Агенти в sandbox можуть вимагати схвалення для кожного запиту перед запуском `exec` на gateway або хості Node.
Див. [схвалення Exec](/uk/tools/exec-approvals) щодо політики, allowlist і потоку UI.

Коли потрібні схвалення, інструмент exec одразу повертає
`status: "approval-pending"` та ідентифікатор схвалення. Після схвалення (або відмови / тайм-ауту)
Gateway видає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, видається одне сповіщення `Exec running`.
У каналах із нативними картками/кнопками схвалення агент має спочатку покладатися на цей
нативний UI і додавати ручну команду `/approve` лише тоді, коли результат інструмента
явно повідомляє, що схвалення в чаті недоступні або ручне схвалення є
єдиним шляхом.

## Allowlist + safe bins

Ручне застосування allowlist зіставляє globs розпізнаних шляхів бінарних файлів і globs простих
імен команд. Прості імена відповідають лише командам, викликаним через PATH, тому `rg` може відповідати
`/opt/homebrew/bin/rg`, коли команда — `rg`, але не `./rg` або `/tmp/rg`.
Коли `security=allowlist`, команди оболонки автоматично дозволяються лише якщо кожен сегмент
конвеєра є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення
відхиляються в режимі allowlist, якщо кожен сегмент верхнього рівня не відповідає
allowlist (включно з safe bins). Перенаправлення залишаються непідтримуваними.
Стійка довіра `allow-always` не обходить це правило: ланцюжкова команда все одно потребує відповідності кожного
сегмента верхнього рівня.

`autoAllowSkills` — це окремий зручний шлях у схваленнях exec. Це не те саме, що
ручні записи allowlist шляхів. Для суворої явної довіри залишайте `autoAllowSkills` вимкненим.

Використовуйте ці два елементи керування для різних завдань:

- `tools.exec.safeBins`: невеликі потокові фільтри лише зі stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe-bin.
- `tools.exec.safeBinProfiles`: явна політика argv для користувацьких safe bins.
- allowlist: явна довіра для шляхів виконуваних файлів.

Не розглядайте `safeBins` як загальний список дозволених і не додавайте двійкові файли інтерпретаторів/середовищ виконання (наприклад, `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи списку дозволених і залишайте запити на підтвердження увімкненими.
`openclaw security audit` попереджає, коли записи інтерпретаторів/середовищ виконання в `safeBins` не мають явних профілів, а `openclaw doctor --fix` може створити каркас відсутніх користувацьких записів `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно додаєте bins із широкою поведінкою, як-от `jq`, назад у `safeBins`.
Якщо ви явно додаєте інтерпретатори до списку дозволених, увімкніть `tools.exec.strictInlineEval`, щоб форми inline code-eval усе ще вимагали нового підтвердження.

Повні подробиці політики та приклади див. у [Підтвердженнях exec](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only) і [Безпечні bins проти списку дозволених](/uk/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Приклади

Передній план:

```json
{ "tool": "exec", "command": "ls -la" }
```

Фон + опитування:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Опитування призначене для статусу на вимогу, а не для циклів очікування. Якщо автоматичне пробудження після завершення
увімкнене, команда може пробудити сесію, коли вона виводить дані або завершується з помилкою.

Надсилання клавіш (у стилі tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Надсилання (лише CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Вставлення (за замовчуванням у bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це підінструмент `exec` для структурованих багатофайлових змін.
Він увімкнений за замовчуванням для моделей OpenAI та OpenAI Codex. Використовуйте конфігурацію лише тоді,
коли хочете вимкнути його або обмежити конкретними моделями:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Примітки:

- Доступний лише для моделей OpenAI/OpenAI Codex.
- Політика інструментів усе ще застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- `deny: ["write"]` не забороняє `apply_patch`; забороніть `apply_patch` явно або використовуйте `deny: ["group:fs"]`, коли записи патчів також мають бути заблоковані.
- Конфігурація розташована в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` за замовчуванням має значення `true`; установіть його в `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` за замовчуванням має значення `true` (обмежено робочою областю). Установлюйте його в `false` лише якщо ви навмисно хочете, щоб `apply_patch` записував/видаляв за межами каталогу робочої області.

## Пов’язане

- [Підтвердження Exec](/uk/tools/exec-approvals) — шлюзи підтвердження для команд оболонки
- [Пісочниця](/uk/gateway/sandboxing) — запуск команд у ізольованих середовищах
- [Фоновий процес](/uk/gateway/background-process) — довготривалий exec та інструмент процесів
- [Безпека](/uk/gateway/security) — політика інструментів і підвищений доступ
