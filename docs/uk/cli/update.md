---
read_when:
    - Ви хочете безпечно оновити вихідний checkout
    - Ви налагоджуєте вивід або параметри `openclaw update`
    - Потрібно розуміти поведінку скороченого запису `--update`
summary: Довідник CLI для `openclaw update` (відносно безпечне оновлення джерела + автоматичний перезапуск Gateway)
title: Оновити
x-i18n:
    generated_at: "2026-06-27T17:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Безпечно оновлюйте OpenClaw і перемикайтеся між каналами stable/beta/dev.

Якщо ви встановили через **npm/pnpm/bun** (глобальне встановлення, без метаданих git),
оновлення відбуваються через потік менеджера пакетів у [Оновлення](/uk/install/updating).

## Використання

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Параметри

- `--no-restart`: пропустити перезапуск служби Gateway після успішного оновлення. Оновлення через менеджер пакетів, які перезапускають Gateway, перевіряють, що перезапущена служба повідомляє очікувану оновлену версію, перш ніж команда завершиться успішно.
- `--channel <stable|beta|dev>`: установити канал оновлень (git + npm; зберігається в конфігурації).
- `--tag <dist-tag|version|spec>`: перевизначити ціль пакета лише для цього оновлення. Для встановлень пакета `main` зіставляється з `github:openclaw/openclaw#main`; специфікації джерел GitHub/git пакуються в тимчасовий tarball перед поетапним глобальним встановленням npm.
- `--dry-run`: попередньо переглянути заплановані дії оновлення (потік channel/tag/target/restart) без запису конфігурації, встановлення, синхронізації plugins або перезапуску.
- `--json`: вивести машиночитний JSON `UpdateRunResult`, зокрема
  `postUpdate.plugins.warnings`, коли пошкоджені або незавантажувані керовані plugins потребують
  відновлення після успішного оновлення ядра, деталі fallback для plugins beta-каналу,
  коли plugin не має beta-випуску, і `postUpdate.plugins.integrityDrifts`,
  коли під час синхронізації plugins після оновлення виявлено drift артефактів npm plugin.
- `--timeout <seconds>`: тайм-аут для кожного кроку (за замовчуванням 1800 с).
- `--yes`: пропустити запити підтвердження (наприклад, підтвердження downgrade).
- `--acknowledge-clawhub-risk`: після перегляду попереджень довіри до спільноти ClawHub
  дозволити синхронізації plugins після оновлення продовжитися без інтерактивного
  запиту. Без цього ризиковані випуски plugins спільноти ClawHub пропускаються і
  лишаються без змін, коли OpenClaw не може показати запит. Офіційні пакети ClawHub і
  bundled джерела OpenClaw plugin обходять цей запит довіри до випуску.

`openclaw update` не має прапорця `--verbose`. Використовуйте `--dry-run`, щоб попередньо переглянути
заплановані дії channel/tag/install/restart, `--json` для машиночитних
результатів і `openclaw update status --json`, коли вам потрібні лише канал і
відомості про доступність. Якщо ви налагоджуєте журнали Gateway навколо оновлення,
детальність консолі й рівень файлового журналу розділені: Gateway `--verbose` впливає на
вивід термінала/WebSocket, а для файлових журналів потрібен `logging.level: "debug"` або
`"trace"` у конфігурації. Див. [журналювання Gateway](/uk/gateway/logging).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаційні запуски `openclaw update` вимкнені. Натомість оновіть джерело Nix або flake input для цього встановлення; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` і `openclaw update --dry-run` залишаються лише для читання.
</Note>

<Warning>
Downgrade потребує підтвердження, бо старіші версії можуть зламати конфігурацію.
</Warning>

## `update status`

Показати активний канал оновлень + git tag/branch/SHA (для source checkouts), а також доступність оновлень.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Параметри:

- `--json`: вивести машиночитний JSON стану.
- `--timeout <seconds>`: тайм-аут для перевірок (за замовчуванням 3 с).

## `update repair`

Повторно запустити фіналізацію оновлення після того, як основний пакет уже змінився, але подальша
робота з відновлення не завершилася чисто. Це підтримуваний шлях відновлення, коли
`openclaw update` встановив новий основний пакет, але post-core синхронізація plugins,
метадані керованих npm plugins, оновлення registry або doctor repair ще мають
зійтися.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Параметри:

- `--channel <stable|beta|dev>`: зберегти канал оновлень перед repair і
  виконати зближення plugins для цього каналу.
- `--json`: вивести машиночитний JSON фіналізації.
- `--timeout <seconds>`: тайм-аут для кроків repair (за замовчуванням `1800`).
- `--yes`: пропустити запити підтвердження.
- `--acknowledge-clawhub-risk`: після перегляду попереджень довіри до спільноти ClawHub
  дозволити зближенню plugins під час repair продовжитися без
  інтерактивного запиту. Офіційні пакети ClawHub і bundled джерела OpenClaw plugin
  обходять цей запит довіри до випуску.
- `--no-restart`: приймається для паритету з командою update; repair ніколи не перезапускає
  Gateway.

`openclaw update repair` запускає `openclaw doctor --fix`, перезавантажує відновлені
конфігурацію й записи встановлення, синхронізує відстежувані plugins для активного каналу оновлень,
оновлює встановлення керованих npm plugins, відновлює відсутні налаштовані payloads plugins,
оновлює registry plugins і записує зближені метадані install-record.
Він не встановлює новий основний пакет і не перезапускає Gateway.

## `update wizard`

Інтерактивний потік для вибору каналу оновлень і підтвердження, чи перезапускати Gateway
після оновлення (за замовчуванням перезапускати). Якщо вибрати `dev` без git checkout, він
запропонує створити його.

Параметри:

- `--timeout <seconds>`: тайм-аут для кожного кроку оновлення (за замовчуванням `1800`)

## Що це робить

Коли ви явно перемикаєте канали (`--channel ...`), OpenClaw також підтримує
відповідність методу встановлення:

- `dev` → забезпечує git checkout (за замовчуванням: `~/openclaw`, або `$OPENCLAW_HOME/openclaw`, коли
  `OPENCLAW_HOME` задано; перевизначте через `OPENCLAW_GIT_DIR`),
  оновлює його та встановлює глобальний CLI з цього checkout.
- `stable` → встановлює з npm за допомогою `latest`.
- `beta` → надає перевагу npm dist-tag `beta`, але fallback до `latest`, коли beta
  відсутня або старіша за поточний stable-випуск.

Core auto-updater Gateway (коли ввімкнений через конфігурацію) запускає шлях оновлення CLI
поза живим обробником запитів Gateway. Control-plane `update.run`
оновлення через менеджер пакетів і supervised git-checkout оновлення також використовують
handoff керованої служби замість заміни дерева пакета або перебудови
`dist/` всередині живого процесу Gateway. Gateway запускає від'єднаний helper,
завершується, а helper виконує звичайний шлях CLI `openclaw update --yes --json`
поза деревом процесів Gateway. Якщо цей handoff недоступний,
`update.run` повертає структуровану відповідь із безпечною shell-командою для ручного запуску.

Для встановлень через менеджер пакетів `openclaw update` визначає цільову версію пакета
перед викликом менеджера пакетів. Глобальні встановлення npm використовують staged
install: OpenClaw встановлює новий пакет у тимчасовий npm prefix, перевіряє
там упакований inventory `dist`, а потім міняє це чисте дерево пакета на
справжній глобальний prefix. Якщо перевірка не проходить, post-update doctor, синхронізація plugins і
робота перезапуску не виконуються з підозрілого дерева. Навіть коли встановлена версія
вже збігається з ціллю, команда оновлює глобальне встановлення пакета,
потім запускає синхронізацію plugins, оновлення завершень core-command і роботу перезапуску. Це
утримує packaged sidecars і записи plugins, якими володіє канал, узгодженими з
встановленою збіркою OpenClaw, залишаючи повні перебудови завершень plugin-command для
явних запусків `openclaw completion --write-state`.

Коли встановлена локальна керована служба Gateway і перезапуск увімкнений,
оновлення через менеджер пакетів і git-checkout зупиняють запущену службу перед
заміною дерева пакета або зміною checkout/build output. Потім updater
оновлює метадані служби з оновленого встановлення, перезапускає
службу та перевіряє перезапущений Gateway перед повідомленням
`Gateway: restarted and verified.`. Оновлення через менеджер пакетів додатково перевіряють,
що перезапущений Gateway повідомляє очікувану версію пакета; git-checkout оновлення
перевіряють health Gateway і готовність служби після rebuild. На macOS
post-update перевірка також перевіряє, що LaunchAgent завантажений/запущений для активного
профілю і налаштований порт loopback здоровий. Якщо plist встановлений,
але launchd його не супервізує, OpenClaw автоматично re-bootstraps LaunchAgent,
а потім повторно запускає перевірки health/version/channel readiness. Свіжий
bootstrap завантажує job RunAtLoad напряму, тому recovery оновлення не
виконує негайно `kickstart -k` для щойно запущеного Gateway. Якщо Gateway все ще не
стає healthy, команда завершується з ненульовим кодом і друкує шлях до журналу перезапуску
разом із явними інструкціями щодо перезапуску, перевстановлення і package rollback. Якщо перезапуск
не може виконатися, команда друкує `Gateway: restart skipped (...)` або
`Gateway: restart failed: ...` із підказкою ручного `openclaw gateway restart`.
З `--no-restart` заміна пакета або git rebuild усе одно виконується, але
керована служба не зупиняється і не перезапускається, тому запущений Gateway може зберігати старий
код, доки ви не перезапустите його вручну.

### Форма відповіді control-plane

Коли `update.run` викликається через control plane Gateway на
встановленні через менеджер пакетів або supervised git checkout, handler повідомляє про
ініціацію handoff окремо від оновлення CLI, яке продовжується після виходу
Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` і
  `handoff.status: "started"` означають, що Gateway створив handoff керованої служби
  і запланував власний перезапуск, щоб від'єднаний helper міг виконати
  `openclaw update --yes --json` поза живим процесом служби.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` і
  `handoff.status: "unavailable"` означають, що OpenClaw не зміг знайти boundary супервізованої
  служби і durable service identity для безпечного handoff. Наприклад,
  handoff systemd потребує identity unit OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), а не лише ambient markers процесу systemd. Відповідь
  містить `handoff.command`, shell-команду для запуску поза
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` означає, що
  Gateway спробував створити handoff, але не зміг породити від'єднаний helper.

Payload `sentinel` усе ще записується перед виходом Gateway, а CLI
handoff оновлює той самий restart sentinel після завершення health checks
перезапуску керованої служби. Під час handoff sentinel може містити
`stats.reason: "restart-health-pending"` без success continuation; перезапущений
Gateway продовжує опитувати його і запускає continuation лише після того, як CLI
перевірив health служби і переписав sentinel з фінальним результатом `ok`.
`openclaw status` і `openclaw status --all` показують рядок `Update restart`,
поки цей sentinel очікує або failed, а `update.status` оновлює і
повертає останній sentinel.

## Потік Git checkout

### Вибір каналу

- `stable`: checkout останнього non-beta tag, потім build і doctor.
- `beta`: надавати перевагу останньому tag `-beta`, але fallback до останнього stable tag, коли beta відсутня або старіша.
- `dev`: checkout `main`, потім fetch і rebase.

### Кроки оновлення

<Steps>
  <Step title="Перевірте чистий робочий каталог">
    Потребує відсутності незафіксованих змін.
  </Step>
  <Step title="Перемкніть канал">
    Перемикає на вибраний канал (тег або гілку).
  </Step>
  <Step title="Отримайте upstream">
    Лише для dev.
  </Step>
  <Step title="Передпольотна збірка (лише dev)">
    Запускає збірку TypeScript у тимчасовому робочому каталозі. Якщо tip не проходить, повертається назад до 10 комітів, щоб знайти найновіший коміт, який збирається. Установіть `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, щоб також запустити lint під час цієї передпольотної перевірки; lint запускається в обмеженому послідовному режимі, бо хости оновлення користувачів часто менші за CI runners.
  </Step>
  <Step title="Виконайте rebase">
    Виконує rebase на вибраний коміт (лише dev).
  </Step>
  <Step title="Установіть залежності">
    Використовує пакетний менеджер репозиторію. Для checkout-ів pnpm засіб оновлення ініціалізує `pnpm` за потреби (спочатку через `corepack`, потім через тимчасовий fallback `npm install pnpm@11`) замість запуску `npm run build` всередині workspace pnpm.
  </Step>
  <Step title="Зберіть Control UI">
    Збирає gateway і Control UI.
  </Step>
  <Step title="Запустіть doctor">
    `openclaw doctor` запускається як фінальна перевірка безпечного оновлення.
  </Step>
  <Step title="Синхронізуйте Plugin-и">
    Синхронізує Plugin-и з активним каналом. Dev використовує bundled Plugin-и; stable і beta використовують npm. Оновлює відстежувані встановлення Plugin-ів.
  </Step>
</Steps>

На каналі оновлень beta відстежувані встановлення npm і ClawHub Plugin-ів, які дотримуються
лінії default/latest, спочатку пробують реліз Plugin-а `@beta`. Якщо Plugin не має
beta-релізу, OpenClaw повертається до записаної специфікації default/latest і повідомляє
про це як попередження. Для npm Plugin-ів OpenClaw також повертається до fallback, коли beta
package існує, але не проходить перевірку встановлення. Ці попередження fallback для Plugin-ів
не спричиняють збій основного оновлення. Точні версії та явні теги не
переписуються.

<Warning>
Якщо точно закріплене оновлення npm Plugin-а resolve-иться в artifact, integrity якого відрізняється від збереженого запису встановлення, `openclaw update` перериває оновлення artifact цього Plugin-а замість його встановлення. Повторно встановлюйте або оновлюйте Plugin явно лише після перевірки, що ви довіряєте новому artifact.
</Warning>

<Note>
Збої синхронізації Plugin-ів після оновлення, які обмежені керованим Plugin-ом і які шлях синхронізації може обійти (наприклад, недоступний npm registry для неважливого Plugin-а), повідомляються як попередження після успішного основного оновлення. JSON-результат зберігає верхньорівневий `status: "ok"` оновлення і повідомляє `postUpdate.plugins.status: "warning"` з рекомендаціями `openclaw update repair` і `openclaw plugins inspect <id> --runtime --json`. Неочікувані винятки засобу оновлення або синхронізації все одно спричиняють збій результату оновлення. Виправте помилку встановлення або оновлення Plugin-а, потім повторно запустіть `openclaw update repair`.

Після кроку синхронізації для кожного Plugin-а `openclaw update` запускає обов’язковий прохід **post-core convergence** перед перезапуском gateway: він відновлює відсутні налаштовані payload-и Plugin-ів, перевіряє кожен _активний_ відстежуваний запис встановлення на диску та статично перевіряє, що його `package.json` можна розібрати (і що будь-який явно оголошений `main` існує). Збої цього проходу — і недійсний snapshot конфігурації OpenClaw — повертають `postUpdate.plugins.status: "error"` і перемикають верхньорівневий `status` оновлення на `"error"`, тому `openclaw update` завершується з ненульовим кодом, а gateway _не_ перезапускається з неперевіреним набором Plugin-ів. Помилка містить структуровані рядки `postUpdate.plugins.warnings[].guidance`, які вказують на `openclaw update repair` і `openclaw plugins inspect <id> --runtime --json` для подальших дій. Вимкнені записи Plugin-ів і записи, які не є офіційними цілями синхронізації, пов’язаними з trusted-source, тут пропускаються, віддзеркалюючи політику `skipDisabledPlugins`, яку використовує перевірка відсутніх payload-ів, тому застарілий вимкнений запис Plugin-а не може заблокувати інакше дійсне оновлення.

Коли оновлений Gateway запускається, завантаження Plugin-ів працює лише в режимі перевірки: запуск не
виконує пакетні менеджери й не змінює дерева залежностей. Перезапуски package-manager `update.run`
передаються в шлях керованого сервісу CLI, тому заміна package відбувається
поза старим процесом Gateway, а перевірки справності сервісу вирішують, чи можна
повідомити оновлення як завершене.

Якщо bootstrap pnpm усе ще завершується збоєм, засіб оновлення зупиняється рано з помилкою, специфічною для пакетного менеджера, замість спроби виконати `npm run build` всередині checkout-а.
</Note>

## Скорочення `--update`

`openclaw --update` переписується на `openclaw update` (корисно для shell-ів і launcher scripts).

## Пов’язане

- `openclaw doctor` (пропонує спочатку запустити оновлення в git checkout-ах)
- [Канали розробки](/uk/install/development-channels)
- [Оновлення](/uk/install/updating)
- [Довідник CLI](/uk/cli)
