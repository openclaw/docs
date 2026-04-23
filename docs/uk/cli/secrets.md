---
read_when:
    - Повторне розв’язання посилань SecretRef під час виконання
    - Аудит залишків plaintext і нерозв’язаних ref
    - Налаштування SecretRef і застосування односпрямованих змін очищення
summary: Довідка CLI для `openclaw secrets` (перезавантаження, аудит, налаштування, застосування)
title: секрети
x-i18n:
    generated_at: "2026-04-23T06:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Використовуйте `openclaw secrets` для керування SecretRef і підтримання активного знімка runtime у здоровому стані.

Ролі команд:

- `reload`: gateway RPC (`secrets.reload`), який повторно розв’язує ref і замінює знімок runtime лише за повного успіху (без запису конфігурації).
- `audit`: сканування лише для читання конфігурації/auth/згенерованих сховищ моделей і застарілих залишків на наявність plaintext, нерозв’язаних ref та дрейфу пріоритетів (exec ref пропускаються, якщо не встановлено `--allow-exec`).
- `configure`: інтерактивний планувальник для налаштування provider, зіставлення цілей і preflight (потрібен TTY).
- `apply`: виконати збережений план (`--dry-run` лише для валідації; сухий запуск типово пропускає перевірки exec, а режим запису відхиляє плани з exec, якщо не встановлено `--allow-exec`), а потім очистити цільові залишки plaintext.

Рекомендований цикл оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Якщо ваш план містить `exec` SecretRef/provider, передавайте `--allow-exec` і в командах dry-run, і в командах apply із записом.

Примітка про коди виходу для CI/перевірок:

- `audit --check` повертає `1`, якщо є знахідки.
- нерозв’язані ref повертають `2`.

Пов’язане:

- Посібник із секретів: [Керування секретами](/uk/gateway/secrets)
- Поверхня облікових даних: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- Посібник із безпеки: [Безпека](/uk/gateway/security)

## Перезавантажити знімок runtime

Повторно розв’язати посилання secret ref і атомарно замінити знімок runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Примітки:

- Використовує gateway RPC-метод `secrets.reload`.
- Якщо розв’язання завершується помилкою, gateway зберігає знімок останнього відомого коректного стану та повертає помилку (без часткової активації).
- Відповідь JSON містить `warningCount`.

Параметри:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Аудит

Сканувати стан OpenClaw на наявність:

- зберігання секретів у plaintext
- нерозв’язаних ref
- дрейфу пріоритетів (облікові дані в `auth-profiles.json`, що затіняють ref у `openclaw.json`)
- залишків у згенерованому `agents/*/agent/models.json` (значення provider `apiKey` і чутливі заголовки provider)
- застарілих залишків (записи в застарілому сховищі auth, нагадування OAuth)

Примітка про залишки в заголовках:

- Виявлення чутливих заголовків provider базується на евристиці назв (поширені назви та фрагменти заголовків auth/облікових даних, як-от `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Поведінка виходу:

- `--check` завершується з ненульовим кодом, якщо є знахідки.
- нерозв’язані ref завершуються ненульовим кодом із вищим пріоритетом.

Ключові елементи форми звіту:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- коди знахідок:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (інтерактивний помічник)

Інтерактивно створити зміни provider і SecretRef, виконати preflight і, за бажання, застосувати:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Потік:

- Спочатку налаштування provider (`add/edit/remove` для псевдонімів `secrets.providers`).
- Далі зіставлення облікових даних (вибір полів і призначення ref `{source, provider, id}`).
- Наприкінці preflight і, за бажання, apply.

Прапорці:

- `--providers-only`: налаштувати лише `secrets.providers`, пропустити зіставлення облікових даних.
- `--skip-provider-setup`: пропустити налаштування provider і зіставити облікові дані з наявними provider.
- `--agent <id>`: обмежити виявлення цілей і записи в `auth-profiles.json` одним сховищем агента.
- `--allow-exec`: дозволити перевірки exec SecretRef під час preflight/apply (може виконувати команди provider).

Примітки:

- Потрібен інтерактивний TTY.
- Не можна поєднувати `--providers-only` із `--skip-provider-setup`.
- `configure` націлюється на поля, що містять секрети, у `openclaw.json`, а також на `auth-profiles.json` для вибраної області агента.
- `configure` підтримує створення нових зіставлень `auth-profiles.json` безпосередньо в потоці вибору.
- Канонічна підтримувана поверхня: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
- Перед apply виконується preflight-розв’язання.
- Якщо preflight/apply містить exec ref, залишайте `--allow-exec` увімкненим для обох кроків.
- Згенеровані плани типово вмикають параметри очищення (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` усі ввімкнені).
- Шлях apply є односпрямованим для очищених значень plaintext.
- Без `--apply` CLI все одно ставить запитання `Apply this plan now?` після preflight.
- Із `--apply` (і без `--yes`) CLI запитує додаткове незворотне підтвердження.
- `--json` виводить план + звіт preflight, але команда все одно потребує інтерактивного TTY.

Примітка про безпеку exec provider:

- Установлення через Homebrew часто відкривають доступ до символьних посилань на бінарні файли в `/opt/homebrew/bin/*`.
- Встановлюйте `allowSymlinkCommand: true` лише за потреби для довірених шляхів менеджера пакетів і поєднуйте це з `trustedDirs` (наприклад `["/opt/homebrew"]`).
- У Windows, якщо перевірка ACL недоступна для шляху provider, OpenClaw завершується за принципом fail closed. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього provider, щоб обійти перевірки безпеки шляху.

## Застосувати збережений план

Застосувати або виконати preflight для раніше згенерованого плану:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Поведінка exec:

- `--dry-run` валідує preflight без запису файлів.
- Перевірки exec SecretRef типово пропускаються під час dry-run.
- Режим запису відхиляє плани, що містять exec SecretRef/provider, якщо не встановлено `--allow-exec`.
- Використовуйте `--allow-exec`, щоб увімкнути перевірки/виконання exec provider у будь-якому режимі.

Деталі контракту плану (дозволені цільові шляхи, правила валідації та семантика збоїв):

- [Контракт плану застосування Secrets](/uk/gateway/secrets-plan-contract)

Що може оновити `apply`:

- `openclaw.json` (цілі SecretRef + upsert/delete provider)
- `auth-profiles.json` (очищення цілей provider)
- залишки застарілого `auth.json`
- відомі секретні ключі в `~/.openclaw/.env`, значення яких було мігровано

## Чому немає резервних копій для відкату

`secrets apply` навмисно не записує резервні копії для відкату, що містять старі значення plaintext.

Безпека забезпечується суворим preflight + майже атомарним apply із best-effort відновленням у пам’яті в разі збою.

## Приклад

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Якщо `audit --check` і далі повідомляє про знахідки plaintext, оновіть решту вказаних цільових шляхів і повторно запустіть аудит.
