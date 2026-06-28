---
read_when:
    - Повторне визначення посилань на секрети під час виконання
    - Аудит залишків відкритого тексту та невизначених посилань
    - Налаштування SecretRefs і застосування незворотних змін очищення
summary: Довідник CLI для `openclaw secrets` (перезавантажити, аудит, налаштувати, застосувати)
title: Секрети
x-i18n:
    generated_at: "2026-04-24T04:13:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw secrets`

Використовуйте `openclaw secrets` для керування SecretRefs і підтримання активного runtime snapshot у справному стані.

Ролі команд:

- `reload`: gateway RPC (`secrets.reload`), який повторно визначає refs і замінює runtime snapshot лише за повного успіху (без запису в конфігурацію).
- `audit`: режим лише читання для сканування configuration/auth/generated-model stores і legacy residues на plaintext, unresolved refs і precedence drift (exec refs пропускаються, якщо не встановлено `--allow-exec`).
- `configure`: інтерактивний planner для налаштування provider, target mapping і preflight (потрібен TTY).
- `apply`: виконує збережений plan (`--dry-run` лише для валідації; dry-run типово пропускає exec checks, а режим запису відхиляє плани, що містять exec, якщо не встановлено `--allow-exec`), а потім очищає цільові plaintext residues.

Рекомендований цикл для оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Якщо ваш plan містить `exec` SecretRefs/providers, передавайте `--allow-exec` і для dry-run, і для команд `apply` у режимі запису.

Примітка про коди виходу для CI/gates:

- `audit --check` повертає `1` за наявності findings.
- unresolved refs повертають `2`.

Пов’язане:

- Посібник із секретів: [Керування секретами](/uk/gateway/secrets)
- Поверхня облікових даних SecretRef: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- Посібник із безпеки: [Безпека](/uk/gateway/security)

## Перезавантаження runtime snapshot

Повторно визначте посилання на секрети й атомарно замініть runtime snapshot.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Примітки:

- Використовує метод gateway RPC `secrets.reload`.
- Якщо визначення не вдається, gateway зберігає останній відомий справний snapshot і повертає помилку (без часткової активації).
- Відповідь JSON містить `warningCount`.

Параметри:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Аудит

Сканує стан OpenClaw на наявність:

- зберігання секретів у plaintext
- unresolved refs
- precedence drift (облікові дані в `auth-profiles.json`, які затіняють refs у `openclaw.json`)
- residues у згенерованому `agents/*/agent/models.json` (значення `apiKey` provider і чутливі заголовки provider)
- legacy residues (записи legacy auth store, нагадування OAuth)

Примітка щодо residues у заголовках:

- Виявлення чутливих заголовків provider базується на евристиці за назвами (поширені назви й фрагменти заголовків авторизації/облікових даних, такі як `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Поведінка кодів виходу:

- `--check` завершується з ненульовим кодом за наявності findings.
- unresolved refs завершуються з ненульовим кодом вищого пріоритету.

Основні елементи структури звіту:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- коди findings:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (інтерактивний помічник)

Інтерактивно створіть зміни provider і SecretRef, виконайте preflight і, за потреби, застосуйте їх:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Хід роботи:

- Спочатку налаштування provider (`add/edit/remove` для псевдонімів `secrets.providers`).
- Потім mapping облікових даних (вибір полів і призначення refs `{source, provider, id}`).
- Наприкінці preflight і необов’язкове apply.

Прапорці:

- `--providers-only`: налаштовує лише `secrets.providers`, пропускає mapping облікових даних.
- `--skip-provider-setup`: пропускає налаштування provider і виконує mapping облікових даних до наявних providers.
- `--agent <id>`: обмежує виявлення target і записи в `auth-profiles.json` одним store агента.
- `--allow-exec`: дозволяє перевірки exec SecretRef під час preflight/apply (може виконувати команди provider).

Примітки:

- Потрібен інтерактивний TTY.
- Не можна поєднувати `--providers-only` з `--skip-provider-setup`.
- `configure` націлюється на поля, що містять секрети, у `openclaw.json`, а також на `auth-profiles.json` для вибраного обсягу агента.
- `configure` підтримує створення нових mappings у `auth-profiles.json` безпосередньо в picker flow.
- Канонічна підтримувана поверхня: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
- Перед apply виконується preflight resolution.
- Якщо preflight/apply містить exec refs, зберігайте `--allow-exec` увімкненим для обох кроків.
- Згенеровані плани типово вмикають параметри очищення (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`).
- Шлях apply є незворотним для очищених значень plaintext.
- Без `--apply` CLI все одно запитує `Apply this plan now?` після preflight.
- З `--apply` (і без `--yes`) CLI додатково запитує незворотне підтвердження.
- `--json` виводить plan + звіт preflight, але команда все одно потребує інтерактивний TTY.

Примітка про безпеку exec provider:

- Інсталяції Homebrew часто надають symlinked binaries у `/opt/homebrew/bin/*`.
- Встановлюйте `allowSymlinkCommand: true` лише за потреби для довірених шляхів package manager і поєднуйте це з `trustedDirs` (наприклад, `["/opt/homebrew"]`).
- У Windows, якщо перевірка ACL недоступна для шляху provider, OpenClaw блокує виконання за принципом fail closed. Лише для довірених шляхів встановлюйте `allowInsecurePath: true` для цього provider, щоб обійти перевірки безпеки шляху.

## Застосування збереженого plan

Застосуйте або виконайте preflight для plan, згенерованого раніше:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Поведінка exec:

- `--dry-run` перевіряє preflight без запису файлів.
- Перевірки exec SecretRef типово пропускаються в dry-run.
- Режим запису відхиляє плани, які містять exec SecretRefs/providers, якщо не встановлено `--allow-exec`.
- Використовуйте `--allow-exec`, щоб явно дозволити перевірки/виконання exec provider в будь-якому режимі.

Деталі контракту plan (дозволені шляхи target, правила валідації та семантика помилок):

- [Контракт plan для Secrets Apply](/uk/gateway/secrets-plan-contract)

Що може оновити `apply`:

- `openclaw.json` (target-и SecretRef + upsert/delete providers)
- `auth-profiles.json` (очищення provider-target)
- legacy residues в `auth.json`
- відомі ключі секретів у `~/.openclaw/.env`, чиї значення було мігровано

## Чому немає rollback backups

`secrets apply` навмисно не записує rollback backups, що містять старі значення plaintext.

Безпека забезпечується суворим preflight + майже атомарним apply з відновленням у пам’яті за принципом best-effort у разі помилки.

## Приклад

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Якщо `audit --check` усе ще повідомляє про findings plaintext, оновіть решту вказаних шляхів target і повторно запустіть аудит.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Керування секретами](/uk/gateway/secrets)
