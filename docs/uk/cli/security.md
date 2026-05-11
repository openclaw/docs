---
read_when:
    - Ви хочете швидко провести аудит безпеки конфігурації/стану
    - Ви хочете застосувати безпечні пропозиції щодо "виправлення" (дозволи, посилення типових налаштувань)
summary: Довідник CLI для `openclaw security` (аудит і виправлення поширених небезпечних помилок у безпеці)
title: Безпека
x-i18n:
    generated_at: "2026-05-11T20:29:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Інструменти безпеки (аудит + необов’язкові виправлення).

Пов’язане:

- Посібник із безпеки: [Безпека](/uk/gateway/security)

## Аудит

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Звичайний `security audit` залишається на холодному шляху config/файлова система/лише читання. Він типово не виявляє runtime-колектори безпеки Plugin, тому регулярні аудити не завантажують runtime кожного встановленого Plugin. Використовуйте `--deep`, щоб включити best-effort живі перевірки Gateway і колектори аудиту безпеки, якими володіють Plugin; явні внутрішні виклики також можуть підключати ці колектори, якими володіють Plugin, коли вже мають відповідну runtime-область.

Аудит попереджає, коли кілька відправників DM спільно використовують головну сесію, і рекомендує **безпечний режим DM**: `session.dmScope="per-channel-peer"` (або `per-account-channel-peer` для багатоакаунтових каналів) для спільних inbox.
Це призначено для посилення захисту кооперативних/спільних inbox. Один Gateway, спільний для взаємно недовірених/ворожих операторів, не є рекомендованою конфігурацією; розділяйте межі довіри окремими Gateway (або окремими користувачами/хостами ОС).
Він також видає `security.trust_model.multi_user_heuristic`, коли config вказує на ймовірний вхід від спільних користувачів (наприклад, відкрита політика DM/груп, налаштовані групові цілі або wildcard-правила відправників), і нагадує, що OpenClaw типово використовує модель довіри персонального асистента.
Для навмисних конфігурацій зі спільними користувачами рекомендація аудиту така: запускати всі сесії в sandbox, обмежувати доступ до файлової системи workspace-областю та не розміщувати персональні/приватні ідентичності або облікові дані в цьому runtime.
Він також попереджає, коли малі моделі (`<=300B`) використовуються без sandboxing і з увімкненими веб-/браузерними інструментами.
Для входу через Webhook він попереджає, коли `hooks.token` повторно використовує токен Gateway, коли `hooks.token` короткий, коли `hooks.path="/"`, коли `hooks.defaultSessionKey` не задано, коли `hooks.allowedAgentIds` не обмежено, коли ввімкнено перевизначення request `sessionKey`, а також коли перевизначення ввімкнено без `hooks.allowedSessionKeyPrefixes`.
Він також попереджає, коли налаштування sandbox Docker сконфігуровано, але режим sandbox вимкнено; коли `gateway.nodes.denyCommands` використовує неефективні pattern-подібні/невідомі записи (лише точне зіставлення імен node-команд, не фільтрація shell-тексту); коли `gateway.nodes.allowCommands` явно вмикає небезпечні node-команди; коли глобальний `tools.profile="minimal"` перевизначається профілями інструментів агента; коли інструменти запису/редагування вимкнені, але `exec` усе ще доступний без обмежувальної межі sandbox-файлової системи; коли відкриті групи надають runtime/файлові інструменти без sandbox/workspace-захисту; і коли інструменти встановлених Plugin можуть бути доступні за permissive-політики інструментів.
Він також позначає `gateway.allowRealIpFallback=true` (ризик spoofing заголовків, якщо proxy неправильно налаштовані) і `discovery.mdns.mode="full"` (витік metadata через записи mDNS TXT).
Він також попереджає, коли sandbox-браузер використовує мережу Docker `bridge` без `sandbox.browser.cdpSourceRange`.
Він також позначає небезпечні режими мережі sandbox Docker (зокрема `host` і приєднання до namespace `container:*`).
Він також попереджає, коли наявні Docker-контейнери sandbox-браузера мають відсутні/застарілі hash-мітки (наприклад, контейнери до міграції без `openclaw.browserConfigEpoch`) і рекомендує `openclaw sandbox recreate --browser --all`.
Він також попереджає, коли записи встановлення Plugin/hook на основі npm не зафіксовані, не мають integrity metadata або відрізняються від поточно встановлених версій пакетів.
Він попереджає, коли allowlist каналів покладаються на змінювані імена/email/tags замість стабільних ID (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-області, де застосовно).
Він попереджає, коли `gateway.auth.mode="none"` залишає HTTP API Gateway доступними без спільного секрету (`/tools/invoke` плюс будь-який увімкнений endpoint `/v1/*`).
Налаштування з префіксом `dangerous`/`dangerously` є явними break-glass перевизначеннями оператора; увімкнення одного з них саме по собі не є звітом про вразливість безпеки.
Повний перелік небезпечних параметрів див. у розділі "Підсумок небезпечних або небезпечних для використання прапорців" у [Безпека](/uk/gateway/security).

Поведінка SecretRef:

- `security audit` розв’язує підтримувані SecretRef у режимі лише читання для своїх цільових шляхів.
- Якщо SecretRef недоступний у поточному шляху команди, аудит продовжується і повідомляє `secretDiagnostics` (замість аварійного завершення).
- `--token` і `--password` лише перевизначають auth для deep-probe в межах цього виклику команди; вони не переписують config або mappings SecretRef.

## JSON-вивід

Використовуйте `--json` для CI/policy-перевірок:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Якщо `--fix` і `--json` поєднано, вивід містить і дії виправлення, і фінальний звіт:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Що змінює `--fix`

`--fix` застосовує безпечні, детерміновані remediation:

- перемикає поширене `groupPolicy="open"` на `groupPolicy="allowlist"` (включно з варіантами для акаунтів у підтримуваних каналах)
- коли політика груп WhatsApp перемикається на `allowlist`, заповнює `groupAllowFrom` із
  збереженого файла `allowFrom`, якщо цей список існує і config ще не
  визначає `allowFrom`
- встановлює `logging.redactSensitive` з `"off"` на `"tools"`
- посилює permissions для state/config і поширених чутливих файлів
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- також посилює config include-файли, на які посилається `openclaw.json`
- використовує `chmod` на POSIX-хостах і resets `icacls` у Windows

`--fix` **не**:

- rotate tokens/passwords/API keys
- вимикає інструменти (`gateway`, `cron`, `exec` тощо)
- змінює вибір bind/auth/network exposure для Gateway
- видаляє або переписує plugins/skills

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Аудит безпеки](/uk/gateway/security)
