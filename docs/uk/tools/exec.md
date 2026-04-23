---
read_when:
    - Використання або змінення інструмента exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента exec, режими stdin і підтримка TTY
title: Інструмент exec
x-i18n:
    generated_at: "2026-04-23T23:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Запускає shell-команди в робочому просторі. Підтримує виконання на передньому плані й у фоновому режимі через `process`.
Якщо `process` недоступний, `exec` запускається синхронно та ігнорує `yieldMs`/`background`.
Фонові сесії обмежені межами агента; `process` бачить лише сесії того самого агента.

## Параметри

<ParamField path="command" type="string" required>
Shell-команда для запуску.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Робочий каталог для команди.
</ParamField>

<ParamField path="env" type="object">
Перевизначення змінних середовища у форматі ключ/значення, які об’єднуються поверх успадкованого середовища.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Автоматично переводить команду у фоновий режим після цієї затримки (мс).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Негайно переводить команду у фоновий режим замість очікування `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Завершує команду після такої кількості секунд.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Запускає в псевдотерміналі, коли це можливо. Використовуйте для CLI, що потребують TTY, агентів кодування та термінальних UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Де виконувати. `auto` визначається як `sandbox`, коли для середовища виконання активний sandbox, інакше як `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Режим примусового застосування для виконання `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Поведінка запиту на схвалення для виконання `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Ідентифікатор або назва Node, коли `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Запитує підвищений режим — вихід із sandbox на налаштований шлях хоста. `security=full` примусово встановлюється лише тоді, коли elevated визначається як `full`.
</ParamField>

Примітки:

- `host` типово має значення `auto`: sandbox, коли для сесії активне середовище виконання sandbox, інакше gateway.
- `auto` — це типова стратегія маршрутизації, а не шаблон. Виклик із `host=node` на рівні окремого запиту дозволений із `auto`; виклик із `host=gateway` на рівні окремого запиту дозволений лише тоді, коли середовище виконання sandbox не активне.
- Без додаткової конфігурації `host=auto` усе одно «просто працює»: без sandbox він визначається як `gateway`; з активним sandbox лишається в sandbox.
- `elevated` виводить із sandbox на налаштований шлях хоста: типово `gateway`, або `node`, коли `tools.exec.host=node` (або типовим для сесії є `host=node`). Доступний лише тоді, коли для поточної сесії/провайдера ввімкнено підвищений доступ.
- Схвалення для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- Для `node` потрібен спарений Node (додаток-компаньйон або безголовий вузол-хост).
- Якщо доступно кілька Node, установіть `exec.node` або `tools.exec.node`, щоб вибрати один.
- `exec host=node` — єдиний шлях виконання shell-команд для Node; застарілу обгортку `nodes.run` вилучено.
- На хостах, відмінних від Windows, exec використовує `SHELL`, якщо його задано; якщо `SHELL` має значення `fish`, він віддає перевагу `bash` (або `sh`)
  із `PATH`, щоб уникнути скриптів, несумісних із fish, а потім повертається до `SHELL`, якщо жоден із них не існує.
- На хостах Windows exec віддає перевагу пошуку PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім повертається до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє перевизначення `env.PATH` і завантажувача (`LD_*`/`DYLD_*`), щоб
  запобігти підміні бінарних файлів або ін’єкції коду.
- OpenClaw установлює `OPENCLAW_SHELL=exec` у середовищі запущеної команди (зокрема для PTY і виконання в sandbox), щоб правила shell/профілю могли виявити контекст інструмента exec.
- Важливо: sandboxing **типово вимкнений**. Якщо sandboxing вимкнено, неявний `host=auto`
  визначається як `gateway`. Явний `host=sandbox` у такому разі все одно завершується закритою відмовою, а не тихо
  запускається на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` зі схваленнями.
- Перевірки preflight для скриптів (для поширених помилок синтаксису shell у Python/Node) перевіряють лише файли в межах
  фактичної межі `workdir`. Якщо шлях до скрипта визначається поза `workdir`, preflight для
  цього файлу пропускається.
- Для довготривалої роботи, яка починається зараз, запускайте її один раз і покладайтеся на автоматичне
  пробудження після завершення, якщо воно ввімкнене і команда виводить результат або завершується з помилкою.
  Використовуйте `process` для журналів, стану, введення або втручання; не імітуйте
  планування за допомогою циклів sleep, циклів timeout або повторного опитування.
- Для роботи, яка має відбутися пізніше або за розкладом, використовуйте Cron замість
  шаблонів sleep/delay з `exec`.

## Конфігурація

- `tools.exec.notifyOnExit` (типово: true): якщо true, фонові сесії exec ставлять системну подію в чергу та запитують Heartbeat після завершення.
- `tools.exec.approvalRunningNoticeMs` (типово: 10000): надсилає одне сповіщення «виконується», коли exec, що потребує схвалення, працює довше за цей час (0 вимикає).
- `tools.exec.host` (типово: `auto`; визначається як `sandbox`, коли активне середовище виконання sandbox, інакше як `gateway`)
- `tools.exec.security` (типово: `deny` для sandbox, `full` для gateway і node, якщо не задано)
- `tools.exec.ask` (типово: `off`)
- Виконання на хості без схвалення є типовим для gateway і node. Якщо потрібна поведінка зі схваленнями/allowlist, посильте як `tools.exec.*`, так і політику хоста в `~/.openclaw/exec-approvals.json`; див. [Схвалення exec](/uk/tools/exec-approvals#no-approval-yolo-mode).
- Режим YOLO походить із типових значень політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо потрібно примусово використовувати gateway або node, установіть `tools.exec.host` або використайте `/exec host=...`.
- У режимі `security=full` разом із `ask=off` виконання на хості напряму дотримується налаштованої політики; немає додаткового евристичного префільтра затемнення команд або шару відхилення script-preflight.
- `tools.exec.node` (типово: не задано)
- `tools.exec.strictInlineEval` (типово: false): якщо true, вбудовані форми eval в інтерпретаторах, як-от `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди вимагають явного схвалення. `allow-always` усе ще може зберігати довіру до безпечних викликів інтерпретаторів/скриптів, але форми inline-eval все одно щоразу запитують схвалення.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway і sandbox).
- `tools.exec.safeBins`: безпечні бінарні файли лише для stdin, які можуть запускатися без явних записів у allowlist. Подробиці поведінки див. у [Safe bins](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів виконуваних файлів у `safeBins`. Записи `PATH` ніколи не вважаються довіреними автоматично. Вбудовані типові значення — `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова спеціальна політика argv для кожного safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: об’єднує `PATH` вашої login-shell у середовище exec. Перевизначення `env.PATH`
  відхиляються для виконання на хості. Сам демон і далі працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тому `/etc/profile` може скидати `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження профілю через внутрішню змінну середовища (без інтерполяції shell);
  `tools.exec.pathPrepend` теж застосовується тут.
- `host=node`: лише передані вами перевизначення середовища, які не заблоковано, надсилаються до Node. Перевизначення `env.PATH`
  відхиляються для виконання на хості та ігноруються хостами Node. Якщо вам потрібні додаткові записи PATH на Node,
  налаштуйте середовище служби хоста Node (systemd/launchd) або встановіть інструменти в стандартні розташування.

Прив’язка Node на рівні агента (використовуйте індекс у списку агентів у конфігурації):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Керувальний UI: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб установити **типові значення для поточної сесії** для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` враховується лише для **авторизованих відправників** (allowlist каналів/спарювання плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує конфігурацію. Щоб повністю вимкнути exec, забороніть його через
політику інструментів (`tools.deny: ["exec"]` або на рівні агента). Схвалення на хості все одно застосовуються, якщо ви явно не встановите
`security=full` і `ask=off`.

## Схвалення exec (додаток-компаньйон / хост node)

Агенти в sandbox можуть вимагати схвалення для кожного запиту перед тим, як `exec` буде запущено на хості gateway або node.
Опис політики, allowlist і потоку UI див. у [Схвалення exec](/uk/tools/exec-approvals).

Коли потрібні схвалення, інструмент exec негайно повертає
`status: "approval-pending"` та ідентифікатор схвалення. Після схвалення (або відхилення / завершення за часом очікування)
Gateway надсилає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, надсилається одне сповіщення `Exec running`.
У каналах із нативними картками/кнопками схвалення агент повинен насамперед покладатися на цей
нативний UI і включати ручну команду `/approve` лише тоді, коли в результаті інструмента
явно зазначено, що схвалення через чат недоступні, або ручне схвалення —
єдиний шлях.

## Allowlist + safe bins

Ручне застосування allowlist зіставляє **лише визначені шляхи до бінарних файлів** (без зіставлення за самими базовими назвами). Коли
`security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент конвеєра
є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення відхиляються в
режимі allowlist, якщо кожен сегмент верхнього рівня не задовольняє allowlist (зокрема safe bins).
Перенаправлення, як і раніше, не підтримуються.
Тривала довіра `allow-always` не обходить це правило: ланцюгова команда все одно вимагає, щоб кожен
сегмент верхнього рівня збігався.

`autoAllowSkills` — це окремий зручний шлях у схваленнях exec. Це не те саме, що
ручні записи шляху в allowlist. Для суворої явної довіри тримайте
`autoAllowSkills` вимкненим.

Використовуйте два елементи керування для різних завдань:

- `tools.exec.safeBins`: невеликі потокові фільтри лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна політика argv для користувацьких safe bin.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не розглядайте `safeBins` як загальний allowlist і не додавайте туди бінарні файли інтерпретаторів/середовищ виконання (наприклад, `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи allowlist і залишайте запити на схвалення ввімкненими.
`openclaw security audit` попереджає, коли для записів інтерпретаторів/середовищ виконання в `safeBins` бракує явних профілів, а `openclaw doctor --fix` може згенерувати відсутні користувацькі записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно додаєте назад у `safeBins` бінарні файли з широкою поведінкою, як-от `jq`.
Якщо ви явно додаєте інтерпретатори в allowlist, увімкніть `tools.exec.strictInlineEval`, щоб форми inline code-eval усе одно щоразу вимагали нового схвалення.

Повні відомості про політику та приклади див. у [Схвалення exec](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Приклади

Передній план:

```json
{ "tool": "exec", "command": "ls -la" }
```

Фоновий режим + опитування:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Опитування призначене для перевірки стану на вимогу, а не для циклів очікування. Якщо автоматичне пробудження
після завершення ввімкнено, команда може пробудити сесію, коли виведе результат або завершиться з помилкою.

Надсилання натискань клавіш (у стилі tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Надсилання (лише CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Вставлення (типово в дужках):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це підінструмент `exec` для структурованих багатофайлових редагувань.
Він типово ввімкнений для моделей OpenAI і OpenAI Codex. Використовуйте конфігурацію лише
тоді, коли хочете вимкнути його або обмежити конкретними моделями:

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
- Політика інструментів усе одно застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Конфігурація розташована в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` типово має значення `true`; установіть `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` типово має значення `true` (обмежено межами робочого простору). Установлюйте `false` лише тоді, коли свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.

## Пов’язане

- [Схвалення exec](/uk/tools/exec-approvals) — шлюзи схвалення для shell-команд
- [Sandboxing](/uk/gateway/sandboxing) — запуск команд у середовищах sandbox
- [Фоновий процес](/uk/gateway/background-process) — довготривалий exec та інструмент process
- [Безпека](/uk/gateway/security) — політика інструментів і підвищений доступ
