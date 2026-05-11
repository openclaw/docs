---
read_when:
    - У вас проблеми з підключенням/автентифікацією, і ви хочете отримати покрокові виправлення
    - Ви оновили й хочете базову перевірку
summary: Довідник CLI для `openclaw doctor` (перевірки стану + керовані виправлення)
title: Діагностика
x-i18n:
    generated_at: "2026-05-11T20:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Перевірки працездатності + швидкі виправлення для Gateway і каналів.

Пов’язано:

- Усунення несправностей: [Усунення несправностей](/uk/gateway/troubleshooting)
- Аудит безпеки: [Безпека](/uk/gateway/security)

## Приклади

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Для дозволів, специфічних для каналу, використовуйте перевірки каналів замість `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Цільова перевірка можливостей Discord повідомляє про фактичні дозволи бота в каналі; перевірка стану аудіює налаштовані канали Discord і цілі автоматичного приєднання до голосу.

## Параметри

- `--no-workspace-suggestions`: вимкнути пропозиції пам’яті/пошуку робочого простору
- `--yes`: приймати типові значення без запиту
- `--repair`: застосувати рекомендовані виправлення, що не стосуються сервісів, без запиту; встановлення й переписування сервісу Gateway все ще потребують інтерактивного підтвердження або явних команд Gateway
- `--fix`: псевдонім для `--repair`
- `--force`: застосувати агресивні виправлення, зокрема перезапис власної конфігурації сервісу, коли це потрібно
- `--non-interactive`: запускати без запитів; лише безпечні міграції та виправлення, що не стосуються сервісів
- `--generate-gateway-token`: згенерувати й налаштувати токен Gateway
- `--deep`: сканувати системні сервіси на додаткові встановлення Gateway і повідомляти про нещодавні передавання перезапуску супервізора Gateway

Нотатки:

- У режимі Nix (`OPENCLAW_NIX_MODE=1`) перевірки doctor лише для читання все ще працюють, але `doctor --fix`, `doctor --repair`, `doctor --yes` і `doctor --generate-gateway-token` вимкнені, оскільки `openclaw.json` незмінний. Натомість відредагуйте джерело Nix для цього встановлення; для nix-openclaw використовуйте орієнтований на агента [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
- Інтерактивні запити (наприклад, виправлення keychain/OAuth) запускаються лише тоді, коли stdin є TTY і `--non-interactive` **не** встановлено. Запуски без інтерфейсу (cron, Telegram, без термінала) пропускатимуть запити.
- Продуктивність: неінтерактивні запуски `doctor` пропускають завчасне завантаження plugin, щоб безголові перевірки працездатності залишалися швидкими. Інтерактивні сеанси все ще повністю завантажують plugin, коли перевірці потрібен їхній внесок.
- `--fix` (псевдонім для `--repair`) записує резервну копію в `~/.openclaw/openclaw.json.bak` і вилучає невідомі ключі конфігурації, перелічуючи кожне вилучення.
- `doctor --fix --non-interactive` повідомляє про відсутні або застарілі визначення сервісу Gateway, але не встановлює й не переписує їх поза режимом виправлення оновлення. Запустіть `openclaw gateway install` для відсутнього сервісу або `openclaw gateway install --force`, коли навмисно хочете замінити launcher.
- Перевірки цілісності стану тепер виявляють осиротілі файли транскриптів у каталозі сеансів. Архівування їх як `.deleted.<timestamp>` потребує інтерактивного підтвердження; `--fix`, `--yes` і безголові запуски залишають їх на місці.
- Doctor також сканує `~/.openclaw/cron/jobs.json` (або `cron.store`) на застарілі форми завдань cron і може переписати їх на місці до того, як планувальнику доведеться автоматично нормалізувати їх під час виконання.
- У Linux doctor попереджає, коли crontab користувача все ще запускає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`; цей скрипт більше не підтримується й може реєструвати хибні збої Gateway WhatsApp, коли cron не має середовища systemd user-bus.
- Коли WhatsApp увімкнено, doctor перевіряє наявність деградованого циклу подій Gateway із локальними клієнтами `openclaw-tui`, що все ще працюють. `doctor --fix` зупиняє лише перевірені локальні клієнти TUI, щоб відповіді WhatsApp не ставали в чергу за застарілими циклами оновлення TUI.
- Doctor переписує застарілі refs моделей `openai-codex/*` на канонічні refs `openai/*` у primary models, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides і застарілих session route pins. `--fix` переносить намір Codex у provider/model-scoped entries `agentRuntime.id: "codex"`, зберігає session auth-profile pins, як-от `openai-codex:...`, вилучає застарілі whole-agent/session runtime pins і залишає виправлені refs агента OpenAI на маршрутизації автентифікації Codex замість прямої автентифікації OpenAI API-key.
- Doctor очищає застарілий стан staging залежностей plugin, створений старішими версіями OpenClaw. Він також виправляє відсутні завантажувані plugins, на які посилається конфігурація, як-от `plugins.entries`, налаштовані канали, налаштовані параметри provider/search або налаштовані agent runtimes. Під час оновлень пакета doctor пропускає виправлення plugin менеджера пакетів, доки заміна пакета не завершиться; після цього повторно запустіть `openclaw doctor --fix`, якщо налаштований plugin все ще потребує відновлення. Якщо завантаження не вдається, doctor повідомляє про помилку встановлення й зберігає налаштований запис plugin для наступної спроби виправлення.
- Doctor виправляє застарілу конфігурацію plugin, вилучаючи відсутні ids plugin із `plugins.allow`/`plugins.deny`/`plugins.entries`, а також відповідну висячу конфігурацію каналів, цілі Heartbeat і channel model overrides, коли виявлення plugin справне.
- Doctor карантинує недійсну конфігурацію plugin, вимикаючи відповідний запис `plugins.entries.<id>` і вилучаючи його недійсний payload `config`. Запуск Gateway уже пропускає лише цей несправний plugin, щоб інші plugins і канали могли продовжувати працювати.
- Установіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли інший супервізор керує життєвим циклом Gateway. Doctor все ще повідомляє про стан Gateway/сервісу й застосовує виправлення, що не стосуються сервісів, але пропускає service install/start/restart/bootstrap і очищення застарілих сервісів.
- У Linux doctor ігнорує неактивні додаткові systemd units, схожі на Gateway, і не переписує метадані command/entrypoint для запущеного systemd сервісу Gateway під час виправлення. Спочатку зупиніть сервіс або використайте `openclaw gateway install --force`, коли навмисно хочете замінити активний launcher.
- Doctor автоматично мігрує застарілу плоску конфігурацію Talk (`talk.voiceId`, `talk.modelId` тощо) у `talk.provider` + `talk.providers.<provider>`.
- Повторні запуски `doctor --fix` більше не повідомляють і не застосовують нормалізацію Talk, коли єдина відмінність полягає в порядку ключів об’єкта.
- Doctor містить перевірку готовності memory-search і може рекомендувати `openclaw configure --section model`, коли бракує embedding credentials.
- Doctor попереджає, коли не налаштовано власника команд. Власник команд — це обліковий запис оператора-людини, якому дозволено запускати команди лише для власника й затверджувати небезпечні дії. DM pairing лише дає змогу комусь говорити з ботом; якщо ви схвалили відправника до появи bootstrap першого власника, явно встановіть `commands.ownerAllowFrom`.
- Doctor попереджає, коли налаштовані агенти в режимі Codex і персональні assets Codex CLI існують у Codex home оператора. Локальні запуски Codex app-server використовують ізольовані домівки для кожного агента, тому використовуйте `openclaw migrate codex --dry-run`, щоб інвентаризувати assets, які слід свідомо просунути.
- Doctor вилучає застарілий `plugins.entries.codex.config.codexDynamicToolsProfile`; Codex app-server завжди залишає Codex-native workspace tools нативними.
- Doctor попереджає, коли skills, дозволені для типового агента, недоступні в поточному runtime environment, бо відсутні bins, env vars, config або вимоги ОС. `doctor --fix` може вимкнути ці недоступні skills через `skills.entries.<skill>.enabled=false`; натомість встановіть/налаштуйте відсутню вимогу, коли хочете залишити skill активним.
- Якщо режим sandbox увімкнено, але Docker недоступний, doctor повідомляє високосигнальне попередження з діями для виправлення (`install Docker` або `openclaw config set agents.defaults.sandbox.mode off`).
- Якщо наявні застарілі файли реєстру sandbox (`~/.openclaw/sandbox/containers.json` або `~/.openclaw/sandbox/browsers.json`), doctor повідомляє про них; `openclaw doctor --fix` мігрує дійсні записи в шардовані каталоги реєстру й карантинує недійсні застарілі файли.
- Якщо `gateway.auth.token`/`gateway.auth.password` керуються SecretRef і недоступні в поточному шляху команди, doctor повідомляє попередження лише для читання й не записує plaintext fallback credentials.
- Якщо перевірка SecretRef каналу не вдається в шляху виправлення, doctor продовжує й повідомляє попередження замість дострокового завершення.
- Після міграцій каталогу стану doctor попереджає, коли ввімкнені типові облікові записи Telegram або Discord залежать від env fallback і `TELEGRAM_BOT_TOKEN` або `DISCORD_BOT_TOKEN` недоступні процесу doctor.
- Автоматичне визначення username Telegram `allowFrom` (`doctor --fix`) потребує доступного для розв’язання токена Telegram у поточному шляху команди. Якщо перевірка токена недоступна, doctor повідомляє попередження й пропускає автоматичне визначення для цього проходу.

## macOS: перевизначення env `launchctl`

Якщо ви раніше запускали `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (або `...PASSWORD`), це значення перевизначає ваш файл конфігурації й може спричиняти постійні помилки "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Gateway doctor](/uk/gateway/doctor)
