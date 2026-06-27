---
read_when:
    - У вас проблеми з підключенням або автентифікацією, і ви хочете отримати покрокові виправлення
    - Ви оновили й хочете перевірити, чи все гаразд
summary: Довідник CLI для `openclaw doctor` (перевірки справності + керовані виправлення)
title: Лікар
x-i18n:
    generated_at: "2026-06-27T17:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Перевірки стану + швидкі виправлення для Gateway і каналів.

Пов’язано:

- Усунення несправностей: [Усунення несправностей](/uk/gateway/troubleshooting)
- Аудит безпеки: [Безпека](/uk/gateway/security)

## Навіщо Це Використовувати

`openclaw doctor` — це поверхня перевірки стану OpenClaw. Використовуйте її, коли Gateway,
канали, плагіни, Skills, маршрутизація моделей, локальний стан або міграції конфігурації
працюють не так, як очікується, і вам потрібна одна команда, яка може пояснити, що
не так.

Doctor має три режими:

| Режим   | Команда                  | Поведінка                                                                       |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| Огляд   | `openclaw doctor`        | Перевірки, орієнтовані на людину, і керовані підказки.                          |
| Ремонт  | `openclaw doctor --fix`  | Застосовує підтримувані виправлення, використовуючи підказки, якщо безпечний неінтерактивний ремонт неможливий. |
| Lint    | `openclaw doctor --lint` | Структуровані знахідки лише для читання для CI, попередніх перевірок і review gates. |

Надавайте перевагу `--lint`, коли автоматизації потрібен стабільний результат. Надавайте перевагу `--fix`, коли
оператор-людина свідомо хоче, щоб doctor редагував конфігурацію або стан.

## Приклади

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Для дозволів, специфічних для каналів, використовуйте probes каналів замість `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Цільовий Discord capabilities probe повідомляє про фактичні дозволи бота в каналі; status probe аудіює налаштовані канали Discord і цілі автоматичного приєднання до голосу.

## Опції

- `--no-workspace-suggestions`: вимкнути пропозиції пам’яті/пошуку робочого простору
- `--yes`: приймати значення за замовчуванням без запитів
- `--repair`: застосувати рекомендовані ремонти, не пов’язані із сервісами, без запитів; встановлення та перезаписи сервісу Gateway все ще потребують інтерактивного підтвердження або явних команд Gateway
- `--fix`: псевдонім для `--repair`
- `--force`: застосувати агресивні ремонти, включно з перезаписом користувацької конфігурації сервісу за потреби
- `--non-interactive`: запуск без запитів; лише безпечні міграції та ремонти, не пов’язані із сервісами
- `--generate-gateway-token`: згенерувати й налаштувати токен Gateway
- `--allow-exec`: дозволити doctor виконувати налаштовані exec SecretRefs під час перевірки секретів
- `--deep`: сканувати системні сервіси на наявність додаткових встановлень Gateway і повідомляти про нещодавні передачі перезапуску супервізора Gateway
- `--lint`: запускати модернізовані перевірки стану в режимі лише для читання та виводити діагностичні знахідки
- `--post-upgrade`: запускати post-upgrade probes сумісності плагінів; виводить знахідки до stdout; завершується з кодом 1, якщо є будь-які знахідки рівня error
- `--json`: з `--lint` виводити JSON-знахідки замість виводу для людини; з `--post-upgrade` виводити машинозчитувану JSON-обгортку (`{ probesRun, findings }`)
- `--severity-min <level>`: з `--lint` відкидати знахідки нижче `info`, `warning` або `error`
- `--all`: з `--lint` запускати всі зареєстровані перевірки, включно з opt-in перевірками, виключеними з типового набору автоматизації
- `--skip <id>`: з `--lint` пропустити id перевірки; повторіть, щоб пропустити більше ніж одну
- `--only <id>`: з `--lint` запустити лише id перевірки; повторіть, щоб запустити невеликий вибраний набір

## Режим Lint

`openclaw doctor --lint` — це режим автоматизації лише для читання для перевірок doctor.
Він використовує структурований шлях health-check, не показує підказок і не ремонтує
та не переписує конфігурацію/стан. Використовуйте його в CI, скриптах попередньої перевірки та workflow review,
коли вам потрібні машинозчитувані знахідки замість керованих підказок ремонту.
Опції lint-виводу, як-от `--json`, `--severity-min`, `--all`, `--only` і `--skip`,
приймаються лише з `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Вивід для людини компактний:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON-вивід є поверхнею скриптування для lint-запусків:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Поведінка виходу:

- `0`: немає знахідок на вибраному порозі серйозності або вище
- `1`: принаймні одна знахідка відповідає вибраному порогу
- `2`: збій команди/середовища виконання до того, як можна створити lint-знахідки

`--severity-min` керує як видимими знахідками, так і порогом виходу. Наприклад,
`openclaw doctor --lint --severity-min error` може не надрукувати жодних знахідок і
вийти з `0`, навіть коли існують знахідки нижчої серйозності `info` або `warning`.

`--all` керує тим, які перевірки вибираються до фільтрації за серйозністю. Типовий
lint-запуск є стабільним gate автоматизації та виключає перевірки, які
навмисно є opt-in, бо вони глибокі, історичні або з більшою ймовірністю
виявляють ремонтопридатні legacy-залишки. Використовуйте `--all`, коли вам потрібен повний lint
інвентар без перелічення кожного id перевірки. `--only <id>` залишається найточнішим
селектором і може запускати будь-яку зареєстровану перевірку за id.

## Структуровані Перевірки Стану

Сучасні перевірки doctor використовують невеликий структурований контракт:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` живить `doctor --lint`. `repair()` є необов’язковим і розглядається лише
`doctor --fix` / `doctor --repair`. Перевірки, які ще не мігрували до цієї
форми, продовжують використовувати legacy потік внеску doctor.

Цей поділ навмисний: `detect()` відповідає за діагностику, тоді як `repair()` відповідає за
звітування про те, що він змінив або змінив би. Контексти ремонту можуть нести
запити `dryRun`/`diff`, а результати ремонту можуть повертати структуровані `diffs` для
редагувань конфігурації/файлів плюс `effects` для сервісу, процесу, пакета, стану або інших
побічних ефектів. Це дає змогу конвертованим перевіркам розвиватися в напрямку `doctor --fix --dry-run`
і звітування diff без перенесення планування мутацій у `detect()`.

`repair()` повідомляє, чи він спробував запитаний ремонт, через `status:
"repaired" | "skipped" | "failed"`. Пропущений статус означає `repaired`, тому простим
перевіркам ремонту потрібно повертати лише зміни. Коли repair повертає `skipped` або
`failed`, doctor повідомляє причину й не запускає валідацію для цієї перевірки.

Після успішного структурованого ремонту doctor повторно запускає `detect()` зі
виправленими знахідками як scope. Перевірки можуть використовувати вибрані знахідки, шляхи або значення `ocPath`
для сфокусованої валідації. Якщо знахідка все ще присутня, doctor повідомляє
попередження ремонту замість того, щоб мовчки вважати зміну завершеною.

Знахідка містить:

| Поле             | Призначення                                           |
| ----------------- | ---------------------------------------------------- |
| `checkId`         | Стабільний id для фільтрів skip/only і allowlists CI. |
| `severity`        | `info`, `warning` або `error`.                       |
| `message`         | Людинозчитуване формулювання проблеми.               |
| `path`            | Конфігураційний, файловий або логічний шлях, коли доступний. |
| `line` / `column` | Розташування в джерелі, коли доступне.               |
| `ocPath`          | Точна адреса `oc://`, коли перевірка може вказати на неї. |
| `fixHint`         | Запропонована дія оператора або підсумок ремонту.     |

Модернізовані core перевірки doctor залишаються приєднаними до впорядкованого внеску doctor,
який володіє їхньою поведінкою для людини в `doctor` / `doctor --fix`. Спільний структурований
health registry є точкою розширення: bundled і plugin-backed перевірки запускаються
після core перевірок doctor, щойно їхній пакет-власник реєструє їх в активному
шляху команди. Підшлях `openclaw/plugin-sdk/health` надає той самий
контракт для цих споживачів розширень.

## Вибір Перевірок

Використовуйте `--only` і `--skip`, коли workflow потрібен сфокусований gate:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` і `--skip` приймають повні id перевірок і можуть повторюватися. Якщо id `--only`
не зареєстрований, для цього id не запускається жодна перевірка; використовуйте поля команди `checksRun`
і `checksSkipped`, щоб перевірити, що сфокусований gate вибирає ті перевірки, які ви
очікуєте.

## Режим Post-upgrade

`openclaw doctor --post-upgrade` запускає probes сумісності плагінів, призначені для
ланцюжкового запуску після збірки або оновлення. Знахідки виводяться до stdout; команда
завершується з кодом 1, якщо будь-яка знахідка має `level: "error"`. Додайте `--json`, щоб отримати
машинозчитувану обгортку (`{ probesRun, findings }`), придатну для CI,
спільнотного skill `fork-upgrade` та інших post-upgrade smoke інструментів. Якщо
індекс встановлених плагінів відсутній або має неправильний формат, режим JSON усе одно виводить цю
обгортку зі знахідкою помилки `plugin.index_unavailable`.

Примітки:

- У режимі Nix (`OPENCLAW_NIX_MODE=1`) перевірки doctor лише для читання все ще працюють, але `doctor --fix`, `doctor --repair`, `doctor --yes` і `doctor --generate-gateway-token` вимкнені, бо `openclaw.json` є незмінним. Натомість відредагуйте джерело Nix для цього встановлення; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
- Інтерактивні запити (наприклад, виправлення keychain/OAuth) запускаються лише тоді, коли stdin є TTY і **не** задано `--non-interactive`. Запуски без інтерфейсу (cron, Telegram, без термінала) пропускатимуть запити.
- Продуктивність: неінтерактивні запуски `doctor` пропускають завчасне завантаження plugin, щоб перевірки стану без інтерфейсу залишалися швидкими. Інтерактивні сесії doctor все ще завантажують поверхні plugin, потрібні для застарілого потоку перевірки стану й ремонту.
- `--lint` суворіший за `--non-interactive`: він завжди лише для читання, ніколи не показує запитів і ніколи не застосовує безпечні міграції. Запускайте `doctor --fix` або `doctor --repair`, коли хочете, щоб doctor вносив зміни.
- За замовчуванням doctor не виконує `exec` SecretRefs під час перевірки секретів. Використовуйте `openclaw doctor --allow-exec` або `openclaw doctor --lint --allow-exec` лише тоді, коли ви навмисно хочете, щоб doctor запускав ці налаштовані резолвери секретів.
- `--fix` (псевдонім для `--repair`) записує резервну копію в `~/.openclaw/openclaw.json.bak` і відкидає невідомі ключі конфігурації, перелічуючи кожне видалення.
- Модернізовані перевірки стану можуть надавати шлях `repair()` для `doctor --fix`; перевірки, які його не надають, продовжують виконуватися через наявний потік ремонту doctor.
- `doctor --fix --non-interactive` повідомляє про відсутні або застарілі визначення служби gateway, але не встановлює й не перезаписує їх поза режимом ремонту оновлення. Запустіть `openclaw gateway install` для відсутньої служби або `openclaw gateway install --force`, коли навмисно хочете замінити launcher.
- Перевірки цілісності стану тепер виявляють осиротілі файли transcript у каталозі sessions. Їх архівування як `.deleted.<timestamp>` потребує інтерактивного підтвердження; `--fix`, `--yes` і запуски без інтерфейсу залишають їх на місці.
- Doctor також сканує `~/.openclaw/cron/jobs.json` (або `cron.store`) на наявність застарілих форм завдань cron і переписує їх перед імпортом канонічних рядків у SQLite.
- Doctor повідомляє про завдання cron з явними перевизначеннями `payload.model`, включно з підрахунками просторів імен provider і невідповідностями щодо `agents.defaults.model`, щоб заплановані завдання, які не успадковують модель за замовчуванням, були видимими під час розслідувань auth або billing.
- У Linux doctor попереджає, коли crontab користувача все ще запускає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`; цей скрипт більше не підтримується й може журналювати хибні збої WhatsApp gateway, коли cron не має середовища systemd user-bus.
- Коли WhatsApp увімкнено, doctor перевіряє деградований цикл подій Gateway із локальними клієнтами `openclaw-tui`, які все ще працюють. `doctor --fix` зупиняє лише перевірені локальні клієнти TUI, щоб відповіді WhatsApp не ставали в чергу за застарілими циклами оновлення TUI.
- Doctor переписує застарілі посилання моделей `openai-codex/*` на канонічні посилання `openai/*` у primary models, fallbacks, моделях генерації зображень/відео, перевизначеннях heartbeat/subagent/compaction, hooks, перевизначеннях моделей каналів і застарілих session route pins. `--fix` також мігрує застарілі auth-профілі `openai-codex:*` і записи `auth.order.openai-codex` до `openai:*`, переносить намір Codex у записи `agentRuntime.id: "codex"` з областю provider/model, видаляє застарілі whole-agent/session runtime pins і залишає виправлені посилання агентів OpenAI на маршрутизації Codex auth замість прямої auth через OpenAI API-key.
- Doctor очищає застарілий проміжний стан залежностей plugin, створений старішими версіями OpenClaw, і повторно зв’язує пакет хоста `openclaw` для керованих npm plugins, які оголошують його peer dependency. Він також ремонтує відсутні завантажувані plugins, на які посилається конфігурація, як-от `plugins.entries`, налаштовані канали, налаштовані provider/search settings або налаштовані agent runtimes. Під час оновлень пакетів doctor пропускає ремонт plugins через package-manager, доки заміна пакета не завершиться; після цього повторно запустіть `openclaw doctor --fix`, якщо налаштований plugin усе ще потребує відновлення. Якщо завантаження не вдається, doctor повідомляє про помилку встановлення й зберігає налаштований запис plugin для наступної спроби ремонту.
- Doctor ремонтує застарілу конфігурацію plugin, видаляючи відсутні plugin ids з `plugins.allow`/`plugins.deny`/`plugins.entries`, а також відповідну висячу конфігурацію каналів, heartbeat targets і перевизначення моделей каналів, коли виявлення plugin працює справно.
- Doctor ізолює недійсну конфігурацію plugin, вимикаючи відповідний запис `plugins.entries.<id>` і видаляючи його недійсне навантаження `config`. Запуск Gateway уже пропускає лише цей несправний plugin, щоб інші plugins і канали могли продовжувати роботу.
- Установіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли інший супервізор керує життєвим циклом gateway. Doctor і далі повідомляє про стан gateway/service і застосовує ремонти, не пов’язані зі службами, але пропускає service install/start/restart/bootstrap і очищення застарілих служб.
- У Linux doctor ігнорує неактивні додаткові systemd units, схожі на gateway, і не переписує метадані command/entrypoint для запущеної systemd gateway service під час ремонту. Спершу зупиніть службу або використайте `openclaw gateway install --force`, коли навмисно хочете замінити активний launcher.
- Doctor автоматично мігрує застарілу пласку конфігурацію Talk (`talk.voiceId`, `talk.modelId` та подібні) у `talk.provider` + `talk.providers.<provider>`.
- Повторні запуски `doctor --fix` більше не повідомляють і не застосовують нормалізацію Talk, коли єдина різниця полягає в порядку ключів об’єкта.
- Doctor включає перевірку готовності memory-search і може рекомендувати `openclaw configure --section model`, коли бракує облікових даних embedding.
- Doctor попереджає, коли не налаштовано власника команд. Власник команд — це обліковий запис людини-оператора, якому дозволено запускати команди лише для власника й затверджувати небезпечні дії. З’єднання через DM лише дозволяє комусь спілкуватися з ботом; якщо ви схвалили відправника до появи bootstrap першого власника, явно задайте `commands.ownerAllowFrom`.
- Doctor повідомляє інформаційну примітку, коли налаштовано агентів у режимі Codex і в Codex home оператора є особисті ресурси Codex CLI. Локальні запуски Codex app-server використовують ізольовані home для кожного агента, тому за потреби спершу встановіть Codex plugin, а потім використайте `openclaw migrate plan codex`, щоб інвентаризувати ресурси, які слід просувати навмисно.
- Doctor видаляє вилучений `plugins.entries.codex.config.codexDynamicToolsProfile`; Codex app-server завжди залишає нативні інструменти workspace Codex нативними.
- Doctor попереджає, коли skills, дозволені для агента за замовчуванням, недоступні в поточному runtime-середовищі через відсутні bins, env vars, config або вимоги ОС. `doctor --fix` може вимкнути ці недоступні skills за допомогою `skills.entries.<skill>.enabled=false`; натомість установіть або налаштуйте відсутню вимогу, якщо хочете залишити skill активним.
- Якщо режим sandbox увімкнено, але Docker недоступний, doctor повідомляє високосигнальне попередження з діями для виправлення (`install Docker` або `openclaw config set agents.defaults.sandbox.mode off`).
- Якщо наявні застарілі файли реєстру sandbox або каталоги shards (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` або `~/.openclaw/sandbox/browsers/`), doctor повідомляє про них; `openclaw doctor --fix` мігрує дійсні записи в SQLite і ізолює недійсні застарілі файли.
- Якщо `gateway.auth.token`/`gateway.auth.password` керуються SecretRef і недоступні в поточному шляху команди, doctor повідомляє попередження лише для читання й не записує plaintext fallback credentials. Для SecretRefs на основі exec doctor пропускає виконання, якщо немає `--allow-exec`.
- Якщо інспекція SecretRef каналу не вдається у шляху виправлення, doctor продовжує роботу й повідомляє попередження замість дострокового виходу.
- Після міграцій каталогу стану doctor попереджає, коли ввімкнені облікові записи Telegram або Discord за замовчуванням залежать від env fallback, а `TELEGRAM_BOT_TOKEN` або `DISCORD_BOT_TOKEN` недоступні процесу doctor.
- Автоматичне розв’язання імен користувачів Telegram `allowFrom` (`doctor --fix`) потребує розв’язуваного токена Telegram у поточному шляху команди. Якщо інспекція токена недоступна, doctor повідомляє попередження й пропускає автоматичне розв’язання для цього проходу.

## macOS: перевизначення env `launchctl`

Якщо ви раніше запускали `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (або `...PASSWORD`), це значення перевизначає ваш конфігураційний файл і може спричиняти постійні помилки "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Gateway doctor](/uk/gateway/doctor)
