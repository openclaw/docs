---
read_when:
    - Ви хочете виконати швидкий аудит безпеки конфігурації/стану
    - Ви хочете застосувати безпечні рекомендації з «fix» (дозволи, жорсткіші типові налаштування)
summary: Довідник CLI для `openclaw security` (аудит і виправлення поширених помилок конфігурації безпеки)
title: Безпека
x-i18n:
    generated_at: "2026-04-23T20:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb15ae5e3996aa0e2314572128713b5a44ab4094ee3f76a218e8f053868d16b3
    source_path: cli/security.md
    workflow: 15
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

Аудит попереджає, коли кілька DM-відправників спільно використовують основну сесію, і рекомендує **безпечний режим DM**: `session.dmScope="per-channel-peer"` (або `per-account-channel-peer` для каналів із кількома обліковими записами) для спільних inbox.
Це призначено для захисту спільних inbox і кооперативних сценаріїв. Один Gateway, спільний між взаємно недовіреними/ворожими операторами, не є рекомендованим налаштуванням; розділяйте межі довіри за допомогою окремих gateway (або окремих користувачів ОС/хостів).
Він також видає `security.trust_model.multi_user_heuristic`, коли конфігурація вказує на ймовірний спільний вхід багатьох користувачів (наприклад, відкриті DM/group policy, налаштовані group targets або wildcard-правила для відправників), і нагадує, що за замовчуванням OpenClaw має модель довіри персонального помічника.
Для навмисних сценаріїв із кількома користувачами рекомендація аудиту — ізолювати всі сесії, тримати доступ до файлової системи в межах workspace і не розміщувати особисті/приватні ідентичності або облікові дані в цьому runtime.
Він також попереджає, коли малі моделі (`<=300B`) використовуються без sandboxing і з увімкненими інструментами web/browser.
Для вхідних Webhook він попереджає, коли `hooks.token` повторно використовує token Gateway, коли `hooks.token` закороткий, коли `hooks.path="/"`, коли `hooks.defaultSessionKey` не задано, коли `hooks.allowedAgentIds` не обмежено, коли ввімкнено перевизначення `sessionKey` у запиті, і коли перевизначення ввімкнено без `hooks.allowedSessionKeyPrefixes`.
Він також попереджає, коли налаштовано параметри sandbox Docker, але режим sandbox вимкнено, коли `gateway.nodes.denyCommands` використовує неефективні шаблоноподібні/невідомі записи (лише точне зіставлення назв команд node, а не фільтрація тексту shell), коли `gateway.nodes.allowCommands` явно вмикає небезпечні команди node, коли глобальний `tools.profile="minimal"` перевизначається профілями інструментів агента, коли відкриті групи відкривають інструменти runtime/filesystem без захисту sandbox/workspace, і коли встановлені інструменти plugin-ів можуть бути доступні за надто поблажливої tool policy.
Він також позначає `gateway.allowRealIpFallback=true` (ризик підміни заголовків, якщо proxy налаштовано неправильно) і `discovery.mdns.mode="full"` (витік metadata через записи mDNS TXT).
Він також попереджає, коли браузер sandbox використовує мережу Docker `bridge` без `sandbox.browser.cdpSourceRange`.
Він також позначає небезпечні мережеві режими sandbox Docker (зокрема `host` і приєднання до просторів імен `container:*`).
Він також попереджає, коли наявні Docker-контейнери браузера sandbox мають відсутні/застарілі hash label-и (наприклад, контейнери до міграції без `openclaw.browserConfigEpoch`) і рекомендує `openclaw sandbox recreate --browser --all`.
Він також попереджає, коли записи встановлення plugin/hook на основі npm не закріплені, не мають metadata цілісності або розходяться з версіями пакетів, установленими зараз.
Він попереджає, коли allowlist-и каналів покладаються на змінні names/emails/tags замість стабільних ID (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC scopes, де це застосовно).
Він попереджає, коли `gateway.auth.mode="none"` залишає HTTP API Gateway доступними без спільного секрету (`/tools/invoke` плюс будь-яка ввімкнена кінцева точка `/v1/*`).
Параметри з префіксами `dangerous`/`dangerously` — це явні операторські перевизначення «break-glass»; їх увімкнення саме по собі не є звітом про вразливість безпеки.
Повний перелік небезпечних параметрів див. в розділі "Insecure or dangerous flags summary" у [Безпека](/uk/gateway/security).

Поведінка SecretRef:

- `security audit` розв’язує підтримувані SecretRef у режимі лише читання для своїх цільових шляхів.
- Якщо SecretRef недоступний у поточному шляху команди, аудит продовжується і повідомляє `secretDiagnostics` (замість аварійного завершення).
- `--token` і `--password` перевизначають лише автентифікацію deep-probe для цього виклику команди; вони не переписують config або зіставлення SecretRef.

## Вивід JSON

Використовуйте `--json` для перевірок CI/policy:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Якщо поєднати `--fix` і `--json`, вивід включає і дії виправлення, і фінальний звіт:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Що змінює `--fix`

`--fix` застосовує безпечні, детерміновані виправлення:

- перемикає типові `groupPolicy="open"` на `groupPolicy="allowlist"` (зокрема варіанти для облікових записів у підтримуваних каналах)
- коли group policy WhatsApp перемикається на `allowlist`, заповнює `groupAllowFrom` із
  збереженого файлу `allowFrom`, якщо цей список існує і config ще не
  визначає `allowFrom`
- установлює `logging.redactSensitive` з `"off"` на `"tools"`
- посилює дозволи для state/config і типових чутливих файлів
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- також посилює файли include конфігурації, на які посилається `openclaw.json`
- використовує `chmod` на POSIX-хостах і скидання `icacls` на Windows

`--fix` **не**:

- виконує ротацію token-ів/паролів/API key
- вимикає інструменти (`gateway`, `cron`, `exec` тощо)
- змінює параметри bind/auth/network exposure gateway
- видаляє або переписує plugins/Skills
