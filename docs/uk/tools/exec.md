---
read_when:
    - Використання або змінення інструмента exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента exec, режими stdin і підтримка TTY
title: Інструмент exec
x-i18n:
    generated_at: "2026-04-27T11:04:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6b67f169d1cd7e529523d6c1c57a0f931dcb2e6c7ed93226b2feb38cad28756
    source_path: tools/exec.md
    workflow: 15
---

Виконуйте команди оболонки в робочому просторі. Підтримується виконання на передньому плані й у тлі через `process`.
Якщо `process` заборонено, `exec` виконується синхронно й ігнорує `yieldMs`/`background`.
Фонові сесії мають область дії в межах агента; `process` бачить лише сесії того самого агента.

## Параметри

<ParamField path="command" type="string" required>
Команда оболонки для виконання.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Робочий каталог для команди.
</ParamField>

<ParamField path="env" type="object">
Перевизначення змінних середовища у форматі ключ/значення, які об’єднуються з успадкованим середовищем.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Автоматично перевести команду у фон після цієї затримки (мс).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Негайно перевести команду у фон замість очікування `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Перевизначити налаштований тайм-аут exec для цього виклику. Установлюйте `timeout: 0` лише тоді, коли команда має виконуватися без тайм-ауту процесу exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Запускати в псевдотерміналі, якщо він доступний. Використовуйте для CLI, які потребують TTY, агентів для кодування та термінальних UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Де виконувати. `auto` визначається як `sandbox`, коли активний sandbox runtime, і як `gateway` в іншому разі.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Режим примусового застосування для виконання `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Поведінка запиту підтвердження для виконання `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/назва Node, коли `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Запросити підвищений режим — вийти із sandbox на налаштований шлях хоста. `security=full` примусово встановлюється лише тоді, коли elevated визначається як `full`.
</ParamField>

Примітки:

- Значення `host` за замовчуванням — `auto`: sandbox, коли для сесії активний sandbox runtime, інакше gateway.
- `auto` — це стратегія маршрутизації за замовчуванням, а не шаблон. Виклик `host=node` дозволено в межах `auto`; виклик `host=gateway` дозволено лише тоді, коли sandbox runtime не активний.
- Без додаткової конфігурації `host=auto` все одно «просто працює»: без sandbox він визначається як `gateway`; з активним sandbox він лишається в sandbox.
- `elevated` виходить із sandbox на налаштований шлях хоста: за замовчуванням це `gateway`, або `node`, коли `tools.exec.host=node` (або для сесії за замовчуванням установлено `host=node`). Воно доступне лише тоді, коли для поточної сесії/провайдера ввімкнено elevated access.
- Підтвердження для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- Для `node` потрібен спарений Node (companion app або headless Node host).
- Якщо доступно кілька Node, установіть `exec.node` або `tools.exec.node`, щоб вибрати один із них.
- `exec host=node` — це єдиний шлях виконання оболонки для Node; застарілу обгортку `nodes.run` вилучено.
- `timeout` застосовується до виконання на передньому плані, у тлі, з `yieldMs`, а також до виконання `system.run` на gateway, sandbox і Node. Якщо його не вказано, OpenClaw використовує `tools.exec.timeoutSec`; явне `timeout: 0` вимикає тайм-аут процесу exec для цього виклику.
- На хостах не з Windows exec використовує `SHELL`, якщо його встановлено; якщо `SHELL` — це `fish`, він надає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникнути скриптів, несумісних із fish, а потім повертається до `SHELL`, якщо жодного з них немає.
- На хостах Windows exec надає перевагу PowerShell 7 (`pwsh`) через виявлення (Program Files, ProgramW6432, потім PATH),
  а потім переходить до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення loader (`LD_*`/`DYLD_*`), щоб
  запобігти підміні бінарників або ін’єкції коду.
- OpenClaw установлює `OPENCLAW_SHELL=exec` у середовищі запущеної команди (включно з PTY і виконанням у sandbox), щоб правила оболонки/профілю могли визначати контекст інструмента exec.
- Важливо: sandboxing **вимкнено за замовчуванням**. Якщо sandboxing вимкнено, неявний `host=auto`
  визначається як `gateway`. Явний `host=sandbox` усе одно завершується за принципом fail closed, а не тихо
  виконується на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` з підтвердженнями.
- Перевірки preflight для скриптів (на поширені помилки синтаксису оболонки Python/Node) перевіряють лише файли в межах
  фактичної межі `workdir`. Якщо шлях до скрипту визначається поза `workdir`, preflight для
  цього файла пропускається.
- Для довготривалих завдань, які потрібно почати зараз, запускайте їх один раз і покладайтеся на автоматичне
  пробудження після завершення, коли воно ввімкнене і команда виводить результат або завершується помилкою.
  Використовуйте `process` для журналів, стану, вводу або втручання; не імітуйте
  планування за допомогою циклів sleep, циклів timeout або повторного опитування.
- Для завдань, які мають відбутися пізніше або за розкладом, використовуйте Cron замість
  шаблонів sleep/delay в `exec`.

## Конфігурація

- `tools.exec.notifyOnExit` (за замовчуванням: true): коли true, фонові сесії exec ставлять у чергу системну подію й запитують Heartbeat під час завершення.
- `tools.exec.approvalRunningNoticeMs` (за замовчуванням: 10000): видає одне сповіщення «running», коли exec із підтвердженням виконується довше за це значення (0 вимикає).
- `tools.exec.timeoutSec` (за замовчуванням: 1800): стандартний тайм-аут exec на команду в секундах. Значення `timeout` для конкретного виклику перевизначає його; `timeout: 0` для конкретного виклику вимикає тайм-аут процесу exec.
- `tools.exec.host` (за замовчуванням: `auto`; визначається як `sandbox`, коли активний sandbox runtime, і як `gateway` в іншому разі)
- `tools.exec.security` (за замовчуванням: `deny` для sandbox, `full` для gateway + node, якщо не встановлено)
- `tools.exec.ask` (за замовчуванням: `off`)
- Виконання на хості без підтвердження є режимом за замовчуванням для gateway + node. Якщо вам потрібна поведінка з підтвердженням/allowlist, зробіть жорсткішими і `tools.exec.*`, і політику хоста в `~/.openclaw/exec-approvals.json`; див. [Exec approvals](/uk/tools/exec-approvals#no-approval-yolo-mode).
- YOLO походить із параметрів політики хоста за замовчуванням (`security=full`, `ask=off`), а не з `host=auto`. Якщо ви хочете примусово використовувати gateway або node, установіть `tools.exec.host` або використовуйте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` host exec дотримується налаштованої політики безпосередньо; немає додаткового евристичного шару попередньої фільтрації обфускації команд або відхилення script-preflight.
- `tools.exec.node` (за замовчуванням: не встановлено)
- `tools.exec.strictInlineEval` (за замовчуванням: false): коли true, форми inline eval інтерпретатора, як-от `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди потребують явного підтвердження. `allow-always` усе ще може зберігати дозволи для безпечних викликів інтерпретаторів/скриптів, але форми inline-eval все одно запитують підтвердження щоразу.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарники лише для stdin, які можуть виконуватися без явних записів allowlist. Докладніше див. у [Safe bins](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів виконуваних файлів `safeBins`. Записи `PATH` ніколи не вважаються довіреними автоматично. Вбудовані значення за замовчуванням: `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова власна політика argv для кожного safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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
- `host=sandbox`: виконує `sh -lc` (login shell) усередині контейнера, тому `/etc/profile` може скидати `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження профілю через внутрішню env var (без інтерполяції оболонки);
  `tools.exec.pathPrepend` також застосовується тут.
- `host=node`: до Node надсилаються лише передані вами перевизначення середовища, які не заблоковано. Перевизначення `env.PATH`
  відхиляються для виконання на хості та ігноруються хостами Node. Якщо вам потрібні додаткові записи PATH на Node,
  налаштуйте середовище служби хоста Node (systemd/launchd) або встановіть інструменти у стандартні розташування.

Прив’язка Node для окремого агента (використовуйте індекс зі списку агентів у конфігурації):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI керування: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб установити **для поточної сесії** значення за замовчуванням для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` обробляється лише для **авторизованих відправників** (allowlist/pairing каналу плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує конфігурацію. Щоб повністю вимкнути exec, забороніть його через політику
інструментів (`tools.deny: ["exec"]` або для конкретного агента). Підтвердження хоста все одно застосовуються, якщо ви явно не встановите
`security=full` і `ask=off`.

## Exec approvals (companion app / Node host)

Агенти в sandbox можуть вимагати підтвердження для кожного запиту перед тим, як `exec` запуститься на хості gateway або Node.
Див. [Exec approvals](/uk/tools/exec-approvals), щоб дізнатися про політику, allowlist і потік UI.

Коли підтвердження обов’язкові, інструмент exec повертає результат негайно зі
`status: "approval-pending"` та id підтвердження. Після підтвердження (або відхилення / тайм-ауту)
Gateway надсилає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, надсилається одне сповіщення `Exec running`.
На каналах із нативними картками/кнопками підтвердження агент має спочатку покладатися саме на цей
нативний UI і включати ручну команду `/approve` лише тоді, коли результат
інструмента явно повідомляє, що підтвердження через чат недоступні або ручне підтвердження — це
єдиний шлях.

## Allowlist + safe bins

Ручне застосування allowlist зіставляє glob-шаблони визначеного шляху до бінарника та glob-шаблони простих назв команд. Прості назви зіставляються лише з командами, викликаними через PATH, тому `rg` може збігатися з
`/opt/homebrew/bin/rg`, коли команда — `rg`, але не з `./rg` або `/tmp/rg`.
Коли `security=allowlist`, команди оболонки автоматично дозволяються лише тоді, коли кожен сегмент конвеєра
є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення
відхиляються в режимі allowlist, якщо не кожен сегмент верхнього рівня задовольняє
allowlist (включно з safe bins). Перенаправлення все ще не підтримуються.
Стійка довіра `allow-always` не обходить це правило: команда-ланцюжок усе одно вимагає, щоб кожен
сегмент верхнього рівня збігався.

`autoAllowSkills` — це окремий зручний шлях в exec approvals. Це не те саме, що
ручні записи allowlist для шляхів. Для суворої явної довіри залишайте `autoAllowSkills` вимкненим.

Використовуйте ці два елементи керування для різних завдань:

- `tools.exec.safeBins`: невеликі фільтри потоків лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна політика argv для користувацьких safe bin.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не розглядайте `safeBins` як універсальний allowlist і не додавайте бінарники інтерпретаторів/середовищ виконання (наприклад `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи allowlist і залишайте підказки підтвердження ввімкненими.
`openclaw security audit` попереджає, коли для записів `safeBins` інтерпретаторів/середовищ виконання бракує явних профілів, а `openclaw doctor --fix` може створити відсутні записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно додаєте назад до `safeBins` бінарники з широкою поведінкою, такі як `jq`.
Якщо ви явно додаєте інтерпретатори в allowlist, увімкніть `tools.exec.strictInlineEval`, щоб форми inline code-eval усе одно вимагали нового підтвердження.

Повні правила політики та приклади див. у [Exec approvals](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Опитування призначене для перевірки стану на вимогу, а не для циклів очікування. Якщо автоматичне пробудження після завершення
увімкнене, команда може пробудити сесію, коли виведе результат або завершиться помилкою.

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

Вставлення (типово в дужках):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це підінструмент `exec` для структурованих багатофайлових змін.
Він увімкнений за замовчуванням для моделей OpenAI та OpenAI Codex. Використовуйте конфігурацію лише
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
- Конфігурація розміщується в `tools.exec.applyPatch`.
- Значення `tools.exec.applyPatch.enabled` за замовчуванням — `true`; установіть `false`, щоб вимкнути інструмент для моделей OpenAI.
- Значення `tools.exec.applyPatch.workspaceOnly` за замовчуванням — `true` (у межах робочого простору). Установлюйте `false` лише тоді, коли ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.

## Пов’язане

- [Exec Approvals](/uk/tools/exec-approvals) — бар’єри підтвердження для команд оболонки
- [Sandboxing](/uk/gateway/sandboxing) — запуск команд у sandbox-середовищах
- [Background Process](/uk/gateway/background-process) — довготривалий exec і інструмент process
- [Безпека](/uk/gateway/security) — політика інструментів і elevated access
