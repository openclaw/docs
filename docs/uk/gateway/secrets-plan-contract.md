---
read_when:
    - Створення або перевірка планів `openclaw secrets apply`
    - Налагодження помилок `Invalid plan target path`
    - Розуміння поведінки перевірки типу цілі та шляху
summary: 'Контракт для планів `secrets apply`: перевірка цілі, зіставлення шляхів і область цілі `auth-profiles.json`'
title: Контракт плану застосування секретів
x-i18n:
    generated_at: "2026-07-12T13:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Ця сторінка визначає суворий контракт, який забезпечує `openclaw secrets apply`. Якщо ціль не відповідає цим правилам, застосування завершується помилкою до зміни будь-якого файлу.

## Структура файлу плану

`openclaw secrets apply --from <plan.json>` очікує масив `targets` із цілями плану:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` генерує плани в такій структурі. Ви також можете написати або відредагувати план вручну.

## Додавання, оновлення та видалення провайдерів

Плани також можуть містити два необов’язкові поля верхнього рівня, які змінюють мапу `secrets.providers` разом із записами для окремих цілей:

- `providerUpserts` — об’єкт, ключами якого є псевдоніми провайдерів. Кожне значення є визначенням провайдера (тієї самої структури, яка приймається в `secrets.providers.<alias>` у `openclaw.json`, наприклад провайдер `exec` або `file`).
- `providerDeletes` — масив псевдонімів провайдерів, які потрібно видалити.

`providerUpserts` виконується перед `targets`, тому `target.ref.provider` може посилатися на псевдонім провайдера, який цей самий план додає в `providerUpserts`. Без такого порядку плани, що посилаються на ще не налаштований у `openclaw.json` псевдонім, завершуються помилкою `provider "<alias>" is not configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

На провайдери виконання, додані через `providerUpserts`, усе одно поширюються правила згоди на виконання з розділу [Поведінка згоди для провайдера виконання](#exec-provider-consent-behavior): плани, що містять провайдери виконання, у режимі запису потребують `--allow-exec`.

## Підтримувана область цілей

Цілі плану приймаються для підтримуваних шляхів облікових даних, наведених у розділі [Область облікових даних SecretRef](/uk/reference/secretref-credential-surface).

## Поведінка типів цілей

`target.type` має бути розпізнаним типом цілі, а нормалізований `target.path` має відповідати зареєстрованій для цього типу структурі шляху.

Деякі типи цілей для сумісності з наявними планами приймають у `target.type` псевдонім на додачу до канонічної назви типу:

| Канонічний тип                       | Допустимий псевдонім                           |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Правила перевірки шляхів

Кожна ціль перевіряється за всіма наведеними нижче правилами:

- `type` має бути розпізнаним типом цілі.
- `path` має бути непорожнім шляхом із компонентами, розділеними крапками.
- `pathSegments` можна не вказувати. Якщо його вказано, результат нормалізації має точно збігатися з `path`.
- Заборонені компоненти відхиляються: `__proto__`, `prototype`, `constructor`.
- Нормалізований шлях має відповідати зареєстрованій структурі шляху для типу цілі.
- Якщо задано `providerId` або `accountId`, значення має збігатися з ідентифікатором, закодованим у шляху.
- Цілі `auth-profiles.json` потребують `agentId`.
- Під час створення нового зіставлення `auth-profiles.json` укажіть `authProfileProvider`.

## Поведінка в разі помилки

Якщо ціль не проходить перевірку, застосування завершується з помилкою на кшталт:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Для недійсного плану жодні записи не фіксуються: визначення цілей і перевірка шляхів виконуються до зміни будь-якого файлу. Окремо, коли дійсний план починає запис, застосування спочатку створює знімок кожного змінюваного файлу та відновлює ці знімки, якщо подальший запис у межах того самого запуску завершується помилкою. Тому частковий запис ніколи не залишає конфігурацію, профілі автентифікації або стан змінних середовища неузгодженими.

## Поведінка згоди для провайдера виконання

- `--dry-run` типово пропускає перевірки SecretRef типу `exec`.
- Плани, що містять SecretRef або провайдери типу `exec`, відхиляються в режимі запису, якщо не задано `--allow-exec`.
- Під час перевірки або застосування планів, що містять `exec`, передавайте `--allow-exec` як у команді пробного запуску, так і в команді запису.

## Примітки щодо області виконання та аудиту

- Записи `auth-profiles.json`, що містять лише посилання (`keyRef`/`tokenRef`), включено до визначення облікових даних під час виконання та охоплення аудитом.
- `secrets apply` записує підтримувані цілі `openclaw.json`, підтримувані цілі `auth-profiles.json` і виконує три необов’язкові проходи очищення, кожен із яких типово ввімкнений: `scrubEnv` (видаляє перенесені відкриті значення з `.env`), `scrubAuthProfilesForProviderTargets` (очищає залишки відкритих значень і невикористаних посилань у `auth-profiles.json` для провайдерів, які щойно переніс план) та `scrubLegacyAuthJson` (видаляє перенесені записи `api_key` із застарілих сховищ `auth.json`). Щоб пропустити відповідний прохід, установіть у плані будь-який із параметрів `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` або `options.scrubLegacyAuthJson` у значення `false`.

## Перевірки оператора

```bash
# Перевірити план без запису
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Потім застосувати насправді
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Для планів, що містять exec, явно надайте згоду в обох режимах
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Якщо застосування завершується помилкою про недійсний шлях цілі, повторно згенеруйте план за допомогою `openclaw secrets configure` або виправте шлях цілі відповідно до підтримуваної вище структури.

## Пов’язана документація

- [Керування секретами](/uk/gateway/secrets)
- [CLI `secrets`](/uk/cli/secrets)
- [Область облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
