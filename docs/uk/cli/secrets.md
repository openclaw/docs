---
read_when:
    - Повторне розв’язання ref секретів під час виконання
    - Аудит залишків відкритого тексту та нерозв’язаних ref-ів
    - Налаштування SecretRef і застосування односторонніх змін очищення
summary: Довідка CLI для `openclaw secrets` (перезавантаження, аудит, налаштування, застосування)
title: Секрети
x-i18n:
    generated_at: "2026-04-23T20:48:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70f5041af67e8a5efe8f45bcc94fb617fba9a79395c5fc600896c4f7e050013b
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Використовуйте `openclaw secrets` для керування SecretRef і підтримання здорового стану активного runtime snapshot.

Ролі команд:

- `reload`: RPC gateway (`secrets.reload`), який повторно розв’язує refs і замінює runtime snapshot лише в разі повного успіху (без запису конфігурації).
- `audit`: scan лише для читання конфігурації/auth/generated-model stores і застарілих залишків на предмет відкритого тексту, нерозв’язаних refs і precedence drift (refs `exec` пропускаються, якщо не задано `--allow-exec`).
- `configure`: інтерактивний planner для налаштування provider-а, зіставлення цілей і preflight (потрібен TTY).
- `apply`: виконати збережений план (`--dry-run` лише для валідації; dry-run типово пропускає перевірки exec, а режим запису відхиляє плани з exec, якщо не задано `--allow-exec`), а потім очистити цільові залишки відкритого тексту.

Рекомендований цикл для оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Якщо ваш план містить `exec` SecretRef/providers, передавайте `--allow-exec` і для dry-run, і для команди apply у режимі запису.

Примітка щодо кодів виходу для CI/gates:

- `audit --check` повертає `1`, якщо є findings.
- нерозв’язані refs повертають `2`.

Пов’язане:

- Посібник із секретів: [Secrets Management](/uk/gateway/secrets)
- Поверхня облікових даних: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- Посібник із безпеки: [Security](/uk/gateway/security)

## Перезавантаження runtime snapshot

Повторно розв’язати refs секретів і атомарно замінити runtime snapshot.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Примітки:

- Використовує RPC-метод gateway `secrets.reload`.
- Якщо розв’язання не вдається, gateway зберігає останній відомий справний snapshot і повертає помилку (без часткової активації).
- Відповідь JSON містить `warningCount`.

Параметри:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Аудит

Сканувати стан OpenClaw на предмет:

- зберігання секретів у відкритому тексті
- нерозв’язаних refs
- precedence drift (облікові дані `auth-profiles.json`, що затіняють refs у `openclaw.json`)
- залишків у згенерованому `agents/*/agent/models.json` (значення provider `apiKey` і чутливі заголовки provider-а)
- застарілих залишків (записи legacy auth store, нагадування OAuth)

Примітка щодо залишків у заголовках:

- Виявлення чутливих заголовків provider-а базується на евристиці назв (поширені назви/фрагменти auth або credential header, такі як `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Поведінка кодів виходу:

- `--check` завершується з ненульовим кодом, якщо є findings.
- нерозв’язані refs завершуються з ненульовим кодом вищого пріоритету.

Ключові моменти форми звіту:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- коди findings:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (інтерактивний помічник)

Інтерактивно побудувати зміни provider-а і SecretRef, виконати preflight і, за потреби, застосувати:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Процес:

- Спочатку налаштування provider-а (`add/edit/remove` для псевдонімів `secrets.providers`).
- Потім зіставлення облікових даних (вибір полів і призначення refs `{source, provider, id}`).
- Наприкінці preflight і, за потреби, apply.

Прапорці:

- `--providers-only`: налаштувати лише `secrets.providers`, пропустити зіставлення облікових даних.
- `--skip-provider-setup`: пропустити налаштування provider-а і зіставити облікові дані з наявними providers.
- `--agent <id>`: обмежити виявлення цілей і записи `auth-profiles.json` одним сховищем агента.
- `--allow-exec`: дозволити перевірки `exec` SecretRef під час preflight/apply (може виконувати команди provider-а).

Примітки:

- Потрібен інтерактивний TTY.
- Не можна поєднувати `--providers-only` з `--skip-provider-setup`.
- `configure` націлюється на поля з секретами в `openclaw.json` і `auth-profiles.json` для вибраної області агента.
- `configure` підтримує створення нових зіставлень `auth-profiles.json` безпосередньо в потоці вибору.
- Канонічна підтримувана поверхня: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface).
- Перед apply виконується preflight-розв’язання.
- Якщо preflight/apply включає refs `exec`, залишайте `--allow-exec` увімкненим для обох кроків.
- Згенеровані плани типово мають параметри очищення (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` — усі ввімкнені).
- Шлях apply є одностороннім для значень відкритого тексту, які очищаються.
- Без `--apply` CLI все одно запитує `Apply this plan now?` після preflight.
- З `--apply` (і без `--yes`) CLI просить додаткове незворотне підтвердження.
- `--json` друкує план + звіт preflight, але команда все одно потребує інтерактивний TTY.

Примітка щодо безпеки provider-а exec:

- Встановлення Homebrew часто надають бінарні файли через symlink у `/opt/homebrew/bin/*`.
- Установлюйте `allowSymlinkCommand: true` лише за потреби для довірених шляхів менеджера пакетів і поєднуйте це з `trustedDirs` (наприклад `["/opt/homebrew"]`).
- У Windows, якщо перевірка ACL недоступна для шляху provider-а, OpenClaw завершується в закритий спосіб. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього provider-а, щоб обійти перевірки безпеки шляху.

## Застосування збереженого плану

Застосувати або виконати preflight для раніше згенерованого плану:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Поведінка exec:

- `--dry-run` перевіряє preflight без запису файлів.
- Перевірки `exec` SecretRef у dry-run типово пропускаються.
- Режим запису відхиляє плани, що містять `exec` SecretRef/providers, якщо не задано `--allow-exec`.
- Використовуйте `--allow-exec`, щоб явно дозволити перевірки/виконання provider-а exec в будь-якому режимі.

Деталі контракту плану (дозволені шляхи цілей, правила валідації й семантика помилок):

- [Secrets Apply Plan Contract](/uk/gateway/secrets-plan-contract)

Що може оновлювати `apply`:

- `openclaw.json` (цілі SecretRef + upsert/delete provider-а)
- `auth-profiles.json` (очищення цілей provider-а)
- залишки legacy `auth.json`
- відомі ключі секретів у `~/.openclaw/.env`, значення яких було перенесено

## Чому немає резервних копій для відкату

`secrets apply` навмисно не записує резервні копії для відкату, що містять старі значення відкритого тексту.

Безпека забезпечується суворим preflight + майже атомарним apply з best-effort відновленням у пам’яті в разі збою.

## Приклад

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Якщо `audit --check` усе ще повідомляє про findings відкритого тексту, оновіть решту вказаних цільових шляхів і повторно запустіть аудит.
