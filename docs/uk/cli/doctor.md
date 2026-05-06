---
read_when:
    - У вас проблеми з підключенням або автентифікацією, і вам потрібні покрокові виправлення
    - Ви внесли оновлення й хочете швидку перевірку
summary: Довідник CLI для `openclaw doctor` (перевірки стану + керовані виправлення)
title: Діагностика
x-i18n:
    generated_at: "2026-05-06T16:00:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Перевірки справності + швидкі виправлення для gateway і каналів.

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

## Опції

- `--no-workspace-suggestions`: вимкнути пропозиції пам’яті/пошуку робочої області
- `--yes`: приймати типові значення без запитів
- `--repair`: застосувати рекомендовані виправлення не для сервісів без запитів; встановлення й перезапис сервісу gateway все одно потребують інтерактивного підтвердження або явних команд gateway
- `--fix`: псевдонім для `--repair`
- `--force`: застосувати агресивні виправлення, зокрема перезапис користувацької конфігурації сервісу за потреби
- `--non-interactive`: запускати без запитів; лише безпечні міграції та виправлення не для сервісів
- `--generate-gateway-token`: згенерувати й налаштувати токен gateway
- `--deep`: просканувати системні сервіси на додаткові встановлення gateway і повідомити про нещодавні передавання перезапуску супервізора Gateway

Примітки:

- У режимі Nix (`OPENCLAW_NIX_MODE=1`) перевірки doctor лише для читання все одно працюють, але `doctor --fix`, `doctor --repair`, `doctor --yes` і `doctor --generate-gateway-token` вимкнені, бо `openclaw.json` незмінний. Натомість редагуйте джерело Nix для цього встановлення; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
- Інтерактивні запити (наприклад виправлення keychain/OAuth) запускаються лише коли stdin є TTY і **не** встановлено `--non-interactive`. Запуски без інтерфейсу (cron, Telegram, без термінала) пропускатимуть запити.
- Продуктивність: неінтерактивні запуски `doctor` пропускають завчасне завантаження plugin, щоб перевірки справності без інтерфейсу залишалися швидкими. Інтерактивні сеанси все одно повністю завантажують plugins, коли перевірці потрібен їхній внесок.
- `--fix` (псевдонім для `--repair`) записує резервну копію в `~/.openclaw/openclaw.json.bak` і видаляє невідомі ключі конфігурації, перелічуючи кожне видалення.
- `doctor --fix --non-interactive` повідомляє про відсутні або застарілі визначення сервісу gateway, але не встановлює й не перезаписує їх поза режимом виправлення оновлення. Запустіть `openclaw gateway install` для відсутнього сервісу або `openclaw gateway install --force`, коли ви навмисно хочете замінити launcher.
- Перевірки цілісності стану тепер виявляють осиротілі файли transcript у каталозі сеансів. Архівування їх як `.deleted.<timestamp>` потребує інтерактивного підтвердження; `--fix`, `--yes` і запуски без інтерфейсу залишають їх на місці.
- Doctor також сканує `~/.openclaw/cron/jobs.json` (або `cron.store`) на застарілі форми завдань cron і може переписати їх на місці до того, як scheduler муситиме автоматично нормалізувати їх під час виконання.
- У Linux doctor попереджає, коли crontab користувача все ще запускає застарілий `~/.openclaw/bin/ensure-whatsapp.sh`; цей скрипт більше не підтримується й може реєструвати хибні збої WhatsApp gateway, коли cron не має середовища user-bus systemd.
- Коли WhatsApp увімкнено, doctor перевіряє на деградований цикл подій Gateway із локальними клієнтами `openclaw-tui`, які ще працюють. `doctor --fix` зупиняє лише перевірені локальні TUI-клієнти, щоб відповіді WhatsApp не ставали в чергу за застарілими циклами оновлення TUI.
- Doctor переписує застарілі посилання моделей `openai-codex/*` на канонічні посилання `openai/*` у основних моделях, fallbacks, перевизначеннях heartbeat/subagent/compaction, hooks, перевизначеннях моделей каналів і застарілих route pins сеансів. `--fix` вибирає `agentRuntime.id: "codex"` лише коли plugin Codex встановлений, увімкнений, надає harness `codex` і має придатний OAuth; інакше вибирає `agentRuntime.id: "pi"`, щоб route залишався на типовому runner OpenClaw.
- Doctor очищає застарілий стан staging залежностей plugin, створений старішими версіями OpenClaw. Він також виправляє відсутні завантажувані plugins, на які посилається конфігурація, як-от `plugins.entries`, налаштовані канали, налаштовані параметри provider/search або налаштовані agent runtimes. Під час оновлень пакетів doctor пропускає виправлення plugin менеджером пакетів, доки заміна пакета не завершиться; повторно запустіть `openclaw doctor --fix` після цього, якщо налаштований plugin досі потребує відновлення. Якщо завантаження не вдається, doctor повідомляє про помилку встановлення й зберігає налаштований запис plugin для наступної спроби виправлення.
- Doctor виправляє застарілу конфігурацію plugin, видаляючи відсутні ідентифікатори plugin з `plugins.allow`/`plugins.entries`, а також відповідні висячі конфігурації каналів, targets heartbeat і перевизначення моделей каналів, коли виявлення plugin справне.
- Doctor ізолює недійсну конфігурацію plugin, вимикаючи відповідний запис `plugins.entries.<id>` і видаляючи його недійсний payload `config`. Запуск Gateway уже пропускає лише цей несправний plugin, тому інші plugins і канали можуть продовжувати працювати.
- Встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, коли життєвим циклом gateway керує інший supervisor. Doctor усе одно повідомляє про справність gateway/сервісу й застосовує виправлення не для сервісів, але пропускає встановлення/запуск/перезапуск/bootstrap сервісу та очищення застарілих сервісів.
- У Linux doctor ігнорує неактивні додаткові systemd units, схожі на gateway, і не переписує metadata команди/entrypoint для запущеного systemd-сервісу gateway під час виправлення. Спочатку зупиніть сервіс або використайте `openclaw gateway install --force`, коли ви навмисно хочете замінити активний launcher.
- Doctor автоматично мігрує застарілу плоску конфігурацію Talk (`talk.voiceId`, `talk.modelId` та пов’язані ключі) у `talk.provider` + `talk.providers.<provider>`.
- Повторні запуски `doctor --fix` більше не повідомляють/застосовують нормалізацію Talk, коли єдина відмінність - порядок ключів об’єкта.
- Doctor містить перевірку готовності memory-search і може рекомендувати `openclaw configure --section model`, коли відсутні облікові дані embeddings.
- Doctor попереджає, коли не налаштовано власника команд. Власник команд - це обліковий запис людини-оператора, якому дозволено запускати команди лише для власника й схвалювати небезпечні дії. DM pairing лише дає змогу комусь говорити з ботом; якщо ви схвалили відправника до появи bootstrap першого власника, явно встановіть `commands.ownerAllowFrom`.
- Doctor попереджає, коли налаштовані агенти в режимі Codex і в Codex home оператора існують особисті ресурси Codex CLI. Локальні запуски app-server Codex використовують ізольовані home для кожного агента, тож використовуйте `openclaw migrate codex --dry-run`, щоб інвентаризувати ресурси, які слід просувати навмисно.
- Doctor попереджає, коли skills, дозволені для типового агента, недоступні в поточному runtime-середовищі, бо відсутні bins, env vars, config або вимоги OS. `doctor --fix` може вимкнути ці недоступні skills за допомогою `skills.entries.<skill>.enabled=false`; натомість встановіть/налаштуйте відсутню вимогу, коли хочете залишити skill активним.
- Якщо режим sandbox увімкнено, але Docker недоступний, doctor повідомляє змістовне попередження з виправленням (`install Docker` або `openclaw config set agents.defaults.sandbox.mode off`).
- Якщо наявні застарілі файли реєстру sandbox (`~/.openclaw/sandbox/containers.json` або `~/.openclaw/sandbox/browsers.json`), doctor повідомляє про них; `openclaw doctor --fix` мігрує чинні записи в shard-каталоги реєстру й ізолює недійсні застарілі файли.
- Якщо `gateway.auth.token`/`gateway.auth.password` керуються SecretRef і недоступні в поточному шляху команди, doctor повідомляє попередження лише для читання й не записує plaintext fallback credentials.
- Якщо перевірка SecretRef каналу не вдається у шляху виправлення, doctor продовжує роботу й повідомляє попередження замість дострокового виходу.
- Після міграцій каталогу стану doctor попереджає, коли увімкнені типові облікові записи Telegram або Discord залежать від env fallback, а `TELEGRAM_BOT_TOKEN` або `DISCORD_BOT_TOKEN` недоступні процесу doctor.
- Автоматичне визначення username в Telegram `allowFrom` (`doctor --fix`) потребує доступного для розв’язання токена Telegram у поточному шляху команди. Якщо перевірка токена недоступна, doctor повідомляє попередження й пропускає автоматичне визначення для цього проходу.

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
