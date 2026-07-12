---
read_when:
    - Повторне розв’язання посилань на секрети під час виконання
    - Аудит залишків відкритого тексту та нерозв’язаних посилань
    - Налаштування SecretRefs і застосування односторонніх змін очищення конфіденційних даних
summary: Довідник CLI для `openclaw secrets` (перезавантаження, аудит, налаштування, застосування)
title: Секрети
x-i18n:
    generated_at: "2026-07-12T13:06:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Керуйте SecretRef і підтримуйте активний знімок середовища виконання в справному стані.

| Команда     | Роль                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC Gateway (`secrets.reload`): повторно вирішує посилання й замінює знімок середовища виконання лише в разі повного успіху (без запису конфігурації)                                                |
| `audit`     | Сканування лише для читання сховищ конфігурації, автентифікації та згенерованих моделей, а також застарілих залишків на відкритий текст, невирішені посилання й розбіжності пріоритетів (посилання `exec` пропускаються без `--allow-exec`) |
| `configure` | Інтерактивний планувальник налаштування провайдерів, зіставлення цілей і попередньої перевірки (потребує TTY)                                                                                          |
| `apply`     | Виконує збережений план (`--dry-run` лише перевіряє та типово пропускає перевірки `exec`; режим запису відхиляє плани з `exec` без `--allow-exec`), а потім видаляє цільові залишки відкритого тексту   |

Рекомендований цикл оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Якщо ваш план містить SecretRef або провайдери `exec`, передайте `--allow-exec` обом командам `apply`: і для пробного запуску, і для запису.

Коди завершення для CI/контрольних перевірок:

- `audit --check` повертає `1`, якщо виявлено проблеми.
- Невирішені посилання повертають `2` (незалежно від `--check`).

Пов’язані матеріали: [Керування секретами](/uk/gateway/secrets) · [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface) · [Безпека](/uk/gateway/security)

## Перезавантаження знімка середовища виконання

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Використовує RPC-метод Gateway `secrets.reload`. Якщо вирішити посилання не вдається, Gateway зберігає останній відомий справний знімок і повертає помилку (без часткової активації). Відповідь JSON містить `warningCount`.

Параметри: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Аудит

Сканує стан OpenClaw на наявність:

- зберігання секретів у відкритому вигляді
- невирішених посилань
- розбіжностей пріоритетів (облікові дані `auth-profiles.json`, що перекривають посилання `openclaw.json`)
- залишків у згенерованих `agents/*/agent/models.json` (значень `apiKey` провайдера та конфіденційних заголовків провайдера)
- застарілих залишків (записів у застарілому сховищі автентифікації, нагадувань OAuth)

Виявлення конфіденційних заголовків провайдера ґрунтується на евристиці назв: позначаються заголовки, назви яких відповідають поширеним фрагментам автентифікації або облікових даних (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Структура звіту:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- коди виявлених проблем: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Налаштування (інтерактивний помічник)

Інтерактивно сформуйте зміни провайдерів і SecretRef, виконайте попередню перевірку та, за бажанням, застосуйте їх:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Послідовність: спочатку налаштування провайдерів (додавання, редагування або видалення псевдонімів `secrets.providers`), потім зіставлення облікових даних (вибір полів і призначення посилань `{source, provider, id}`), далі попередня перевірка та необов’язкове застосування.

Прапорці:

- `--providers-only`: налаштувати лише `secrets.providers`, пропустивши зіставлення облікових даних
- `--skip-provider-setup`: пропустити налаштування провайдерів і зіставити облікові дані з наявними провайдерами
- `--agent <id>`: обмежити пошук цілей і запис у `auth-profiles.json` сховищем одного агента
- `--allow-exec`: дозволити перевірки SecretRef `exec` під час попередньої перевірки або застосування (може виконувати команди провайдера)

`--providers-only` і `--skip-provider-setup` не можна використовувати разом.

Примітки:

- Потребує інтерактивного TTY.
- Охоплює поля із секретами в `openclaw.json`, а також `auth-profiles.json` для вибраної області агента; канонічна підтримувана поверхня: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
- Підтримує створення нових зіставлень `auth-profiles.json` безпосередньо в процесі вибору.
- Перед застосуванням виконує попереднє вирішення посилань.
- У згенерованих планах параметри очищення типово ввімкнені (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Застосування незворотно видаляє очищені значення у відкритому вигляді.
- Без `--apply` CLI все одно запитує `Apply this plan now?` після попередньої перевірки.
- З `--apply` (і без `--yes`) CLI запитує додаткове підтвердження незворотної міграції.
- `--json` виводить план і звіт попередньої перевірки, але все одно потребує інтерактивного TTY.

### Безпека провайдера Exec

Інсталяції Homebrew часто надають символічні посилання на виконувані файли в `/opt/homebrew/bin/*`. Установлюйте `allowSymlinkCommand: true` лише за потреби для довірених шляхів менеджера пакетів і разом із `trustedDirs` (наприклад, `["/opt/homebrew"]`). У Windows, якщо для шляху провайдера неможливо перевірити ACL, OpenClaw забороняє операцію; лише для довірених шляхів установіть для цього провайдера `allowInsecurePath: true`, щоб оминути перевірку безпеки шляху.

## Застосування збереженого плану

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` виконує попередню перевірку без запису файлів; під час пробного запуску перевірки SecretRef `exec` типово пропускаються. Режим запису відхиляє плани, що містять SecretRef або провайдери `exec`, якщо не вказано `--allow-exec`. Використовуйте `--allow-exec`, щоб явно дозволити перевірки або виконання провайдерів `exec` у будь-якому режимі.

Що може оновити `apply`:

- `openclaw.json` (цілі SecretRef, а також додавання, оновлення й видалення провайдерів)
- `auth-profiles.json` (очищення цілей провайдера)
- застарілі залишки `auth.json`
- відомі ключі секретів у `~/.openclaw/.env`, значення яких було перенесено

Докладний контракт плану (дозволені цільові шляхи, правила перевірки, семантика помилок): [Контракт плану застосування секретів](/uk/gateway/secrets-plan-contract).

### Чому немає резервних копій для відкочування

`secrets apply` навмисно не створює резервних копій для відкочування, які містили б старі значення у відкритому вигляді. Безпеку забезпечують сувора попередня перевірка та майже атомарне застосування зі спробою відновлення в пам’яті в разі помилки.

## Приклад

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Якщо `audit --check` усе ще повідомляє про значення у відкритому вигляді, оновіть решту зазначених цільових шляхів і повторно виконайте аудит.

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Керування секретами](/uk/gateway/secrets)
- [SecretRef у Vault](/plugins/vault)
