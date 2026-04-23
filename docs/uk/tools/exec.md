---
read_when:
    - Використання або зміна tool `exec`
    - Налагодження поведінки stdin або TTY
summary: Використання tool `exec`, режими stdin і підтримка TTY
title: Tool exec
x-i18n:
    generated_at: "2026-04-23T21:14:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6bd2c66cd9b05fce703c5a59e6134f8ae9a20965edb0b7df585b81e72d08d2
    source_path: tools/exec.md
    workflow: 15
---

Запускайте shell-команди у workspace. Підтримуються foreground + background-виконання через `process`.
Якщо `process` заборонено, `exec` виконується синхронно й ігнорує `yieldMs`/`background`.
Background-сесії обмежені в межах агента; `process` бачить лише сесії того самого агента.

## Параметри

- `command` (обов’язково)
- `workdir` (за замовчуванням cwd)
- `env` (перевизначення key/value)
- `yieldMs` (за замовчуванням 10000): автоматичний перехід у background після затримки
- `background` (bool): одразу запустити у background
- `timeout` (секунди, за замовчуванням 1800): завершити після спливання часу
- `pty` (bool): запускати в pseudo-terminal, коли це доступно (CLI лише для TTY, coding agents, terminal UI)
- `host` (`auto | sandbox | gateway | node`): де виконувати
- `security` (`deny | allowlist | full`): режим застосування для `gateway`/`node`
- `ask` (`off | on-miss | always`): approval prompt-и для `gateway`/`node`
- `node` (string): id/ім’я node для `host=node`
- `elevated` (bool): запитати elevated mode (вийти із sandbox на налаштований шлях host); `security=full` примусово застосовується лише тоді, коли elevated розв’язується у `full`

Примітки:

- За замовчуванням `host` має значення `auto`: `sandbox`, коли для сесії активний sandbox runtime, інакше `gateway`.
- `auto` — це типова стратегія маршрутизації, а не wildcard. Для одного виклику дозволено `host=node` із `auto`; для одного виклику `host=gateway` дозволяється лише тоді, коли sandbox runtime не активний.
- Без додаткового config `host=auto` усе одно «просто працює»: без sandbox він розв’язується в `gateway`; з активним sandbox — залишається в sandbox.
- `elevated` виходить із sandbox на налаштований шлях host: за замовчуванням `gateway`, або `node`, коли `tools.exec.host=node` (або типове значення сесії — `host=node`). Він доступний лише тоді, коли elevated access увімкнено для поточної сесії/provider-а.
- approvals для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- `node` потребує paired node (супутній застосунок або headless host node).
- Якщо доступно кілька node, задайте `exec.node` або `tools.exec.node`, щоб вибрати один із них.
- `exec host=node` — єдиний шлях виконання shell на node; застарілий wrapper `nodes.run` було видалено.
- На не-Windows host-ах exec використовує `SHELL`, якщо він заданий; якщо `SHELL` дорівнює `fish`, він надає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникнути скриптів, несумісних із fish, а потім використовує fallback до `SHELL`, якщо жодного з них немає.
- На Windows host-ах exec надає перевагу виявленню PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім використовує fallback до Windows PowerShell 5.1.
- Host execution (`gateway`/`node`) відхиляє `env.PATH` і перевизначення loader-а (`LD_*`/`DYLD_*`),
  щоб запобігти hijacking бінарних файлів або ін’єкції коду.
- OpenClaw задає `OPENCLAW_SHELL=exec` у середовищі spawned-команди (зокрема PTY і виконання в sandbox), щоб правила shell/profile могли виявляти контекст exec-tool.
- Важливо: sandboxing за замовчуванням **вимкнений**. Якщо sandboxing вимкнено, неявний `host=auto`
  розв’язується в `gateway`. Явний `host=sandbox` усе одно завершується fail-closed замість тихого
  запуску на host gateway. Увімкніть sandboxing або використовуйте `host=gateway` з approvals.
- Script preflight checks (для поширених помилок shell-синтаксису Python/Node) перевіряють лише файли всередині
  ефективної межі `workdir`. Якщо шлях скрипту розв’язується поза `workdir`, preflight для
  цього файла пропускається.
- Для довготривалої роботи, яка починається зараз, запускайте її один раз і покладайтеся на автоматичне
  completion wake, коли він увімкнений і команда видає output або завершується помилкою.
  Використовуйте `process` для журналів, статусу, вводу чи втручання; не імітуйте
  планування через sleep loop-и, timeout loop-и або повторне polling.
- Для роботи, яка має відбутися пізніше або за розкладом, використовуйте cron замість
  шаблонів sleep/delay через `exec`.

## Config

- `tools.exec.notifyOnExit` (за замовчуванням: true): коли true, backgrounded exec-сесії ставлять системну подію в чергу й запитують heartbeat після завершення.
- `tools.exec.approvalRunningNoticeMs` (за замовчуванням: 10000): генерує одне повідомлення “running”, коли approval-gated exec виконується довше цього часу (0 вимикає).
- `tools.exec.host` (за замовчуванням: `auto`; розв’язується в `sandbox`, коли активний sandbox runtime, і в `gateway` інакше)
- `tools.exec.security` (за замовчуванням: `deny` для sandbox, `full` для gateway + node, якщо не задано)
- `tools.exec.ask` (за замовчуванням: `off`)
- Host exec без approvals є типовим режимом для gateway + node. Якщо вам потрібні approvals/поведінка allowlist, одночасно посиліть і `tools.exec.*`, і host `~/.openclaw/exec-approvals.json`; див. [Exec approvals](/uk/tools/exec-approvals#no-approval-yolo-mode).
- YOLO походить із типових значень host policy (`security=full`, `ask=off`), а не з `host=auto`. Якщо хочете примусово вибрати gateway або node, задайте `tools.exec.host` або використовуйте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` host exec слідує налаштованій policy напряму; немає додаткового евристичного prefilter-а для обфускації команд чи шару preflight-відхилення скриптів.
- `tools.exec.node` (за замовчуванням: не задано)
- `tools.exec.strictInlineEval` (за замовчуванням: false): коли true, форми inline interpreter eval, такі як `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди потребують явного approval. `allow-always` усе ще може зберігати довіру до безпечних викликів interpreter/script, але форми inline-eval усе одно щоразу вимагають prompt.
- `tools.exec.pathPrepend`: список каталогів, які додаються на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: stdin-only безпечні бінарні файли, які можуть запускатися без явних записів allowlist. Подробиці поведінки див. у [Safe bins](/uk/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів виконуваних файлів `safeBins`. Записи `PATH` ніколи автоматично не вважаються довіреними. Вбудовані типові значення: `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова власна policy argv для окремого safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: об’єднує `PATH` вашого login shell із середовищем exec. Перевизначення `env.PATH`
  відхиляються для host execution. Сам daemon усе одно працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тому `/etc/profile` може скидати `PATH`.
  OpenClaw додає `env.PATH` після завантаження profile через внутрішню env var (без shell interpolation);
  `tools.exec.pathPrepend` також застосовується тут.
- `host=node`: до node надсилаються лише неблоковані перевизначення env, які ви передали. Перевизначення `env.PATH`
  відхиляються для host execution і ігноруються host-ами node. Якщо вам потрібні додаткові записи PATH на node,
  налаштуйте середовище сервісу host-а node (systemd/launchd) або встановіть tools у стандартні розташування.

Прив’язка node для конкретного агента (використовуйте індекс списку агентів у config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення для сесії (`/exec`)

Використовуйте `/exec`, щоб задати **типові значення для конкретної сесії** для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб побачити поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` обробляється лише для **авторизованих відправників** (allowlist-и/pairing каналу плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує config. Щоб жорстко вимкнути exec, забороніть його через tool
policy (`tools.deny: ["exec"]` або per-agent). Host approvals усе ще застосовуються, якщо ви явно не задасте
`security=full` і `ask=off`.

## Exec approvals (супутній застосунок / host node)

Sandboxed-агенти можуть вимагати approval для кожного запиту, перш ніж `exec` запуститься на gateway або host-і node.
Див. [Exec approvals](/uk/tools/exec-approvals) щодо policy, allowlist і потоку UI.

Коли approvals потрібні, tool exec повертається одразу зі
`status: "approval-pending"` та ID approval. Після схвалення (або відхилення / тайм-ауту)
Gateway генерує системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, генерується одне повідомлення `Exec running`.
У каналах із native-картками/кнопками approvals агент має спочатку покладатися саме на
цей native UI й додавати ручну команду `/approve` лише тоді, коли результат
tool-а явно каже, що approvals через chat недоступні або manual approval —
єдиний шлях.

## Allowlist + safe bins

Ручне застосування allowlist зіставляється **лише з розв’язаними шляхами бінарних файлів** (без зіставлення за basename). Коли
`security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент pipeline
є allowlisted або safe bin. Chaining (`;`, `&&`, `||`) і redirections відхиляються в
режимі allowlist, якщо тільки кожен top-level сегмент не відповідає allowlist (зокрема safe bins).
Redirections усе ще не підтримуються.
Довірений режим `allow-always` не обходить це правило: chained-команда все одно вимагає, щоб кожен
top-level сегмент відповідав умові.

`autoAllowSkills` — це окремий зручний шлях у exec approvals. Це не те саме, що
ручні записи allowlist для шляхів. Для суворої явної довіри тримайте `autoAllowSkills` вимкненим.

Використовуйте ці два засоби керування для різних задач:

- `tools.exec.safeBins`: невеликі stdin-only stream filters.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe-bin.
- `tools.exec.safeBinProfiles`: явна policy argv для власних safe bin-ів.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не використовуйте `safeBins` як загальний allowlist і не додавайте туди бінарні файли interpreter/runtime (наприклад `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи allowlist і залишайте approval prompt-и увімкненими.
`openclaw security audit` попереджає, коли для записів `safeBins` interpreter/runtime відсутні явні профілі, а `openclaw doctor --fix` може згенерувати відсутні записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно знову додаєте broad-behavior bin-и на кшталт `jq` до `safeBins`.
Якщо ви явно allowlist-ите interpreter-и, увімкніть `tools.exec.strictInlineEval`, щоб inline-форми eval коду все одно вимагали нового approval.

Повні подробиці policy та приклади див. у [Exec approvals](/uk/tools/exec-approvals#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals#safe-bins-versus-allowlist).

## Приклади

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling призначений для статусу на вимогу, а не для циклів очікування. Якщо автоматичний completion wake
увімкнений, команда може пробудити сесію, коли видасть output або завершиться помилкою.

Надсилання клавіш (у стилі tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Надсилання submit (лише CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Вставлення (за замовчуванням із bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це subtool tool-а `exec` для структурованих багатофайлових редагувань.
За замовчуванням він увімкнений для моделей OpenAI і OpenAI Codex. Використовуйте config лише
тоді, коли хочете вимкнути його або обмежити певними моделями:

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
- Tool policy усе ще застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Config знаходиться в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` за замовчуванням має значення `true`; установіть `false`, щоб вимкнути tool для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` за замовчуванням має значення `true` (обмежено workspace). Установлюйте `false` лише тоді, коли свідомо хочете, щоб `apply_patch` виконував запис/видалення поза каталогом workspace.

## Пов’язане

- [Exec Approvals](/uk/tools/exec-approvals) — approval gate-и для shell-команд
- [Sandboxing](/uk/gateway/sandboxing) — виконання команд у sandboxed-середовищах
- [Background Process](/uk/gateway/background-process) — довготривалий exec і tool process
- [Безпека](/uk/gateway/security) — tool policy та elevated access
