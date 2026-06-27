---
read_when:
    - Створення або перегляд `openclaw secrets apply` планів
    - Налагодження помилок `Invalid plan target path`
    - Розуміння типу цілі та поведінки перевірки шляху
summary: 'Контракт для планів `secrets apply`: перевірка цілі, зіставлення шляхів і область цілі `auth-profiles.json`'
title: Контракт плану застосування секретів
x-i18n:
    generated_at: "2026-06-27T17:36:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Ця сторінка визначає строгий контракт, який примусово застосовує `openclaw secrets apply`.

Якщо ціль не відповідає цим правилам, apply завершується помилкою до зміни конфігурації.

## Форма файлу плану

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

## Upsert-операції та видалення провайдерів

Плани також можуть містити два необов’язкові поля верхнього рівня, які змінюють мапу
`secrets.providers` разом із записами для окремих цілей:

- `providerUpserts` — об’єкт із ключами за псевдонімами провайдерів. Кожне значення є
  визначенням провайдера (та сама форма, яку приймає
  `secrets.providers.<alias>` в `openclaw.json`, наприклад провайдер `exec` або `file`).
- `providerDeletes` — масив псевдонімів провайдерів для видалення.

`providerUpserts` виконується перед `targets`, тому `target.ref.provider` може
посилатися на псевдонім провайдера, який той самий план вводить у
`providerUpserts`. Без цього плани, що посилаються на псевдонім, ще не
налаштований в `openclaw.json`, завершуються помилкою `provider "<alias>" is not
configured`.

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

Провайдери exec, введені через `providerUpserts`, усе ще підпадають під правила
згоди для exec у [Поведінка згоди для exec-провайдера](#exec-provider-consent-behavior):
плани, що містять exec-провайдери, потребують `--allow-exec` у режимі запису.

## Підтримувана область цілей

Цілі плану приймаються для підтримуваних шляхів облікових даних у:

- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)

## Поведінка типів цілей

Загальне правило:

- `target.type` має бути розпізнаним і має відповідати нормалізованій формі `target.path`.

Псевдоніми сумісності залишаються прийнятими для наявних планів:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Правила перевірки шляхів

Кожна ціль перевіряється за всіма наведеними нижче правилами:

- `type` має бути розпізнаним типом цілі.
- `path` має бути непорожнім dot-шляхом.
- `pathSegments` можна не вказувати. Якщо його надано, він має нормалізуватися точно до того самого шляху, що й `path`.
- Заборонені сегменти відхиляються: `__proto__`, `prototype`, `constructor`.
- Нормалізований шлях має відповідати зареєстрованій формі шляху для типу цілі.
- Якщо задано `providerId` або `accountId`, він має відповідати ідентифікатору, закодованому в шляху.
- Цілі `auth-profiles.json` потребують `agentId`.
- Під час створення нового зіставлення `auth-profiles.json` додайте `authProfileProvider`.

## Поведінка в разі помилки

Якщо ціль не проходить перевірку, apply завершується з помилкою на кшталт:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Для недійсного плану жодні записи не фіксуються.

## Поведінка згоди для exec-провайдера

- `--dry-run` типово пропускає перевірки exec SecretRef.
- Плани, що містять exec SecretRefs/провайдери, відхиляються в режимі запису, якщо не задано `--allow-exec`.
- Під час перевірки або застосування планів, що містять exec, передавайте `--allow-exec` і в dry-run, і в командах запису.

## Примітки щодо області runtime та аудиту

- Записи `auth-profiles.json` лише з посиланнями (`keyRef`/`tokenRef`) включені до runtime-визначення та аудиторського покриття.
- `secrets apply` записує підтримувані цілі `openclaw.json`, підтримувані цілі `auth-profiles.json` і необов’язкові цілі очищення.

## Перевірки оператора

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Якщо apply завершується помилкою з повідомленням про недійсний шлях цілі, повторно згенеруйте план за допомогою `openclaw secrets configure` або виправте шлях цілі до підтримуваної форми вище.

## Пов’язані документи

- [Керування секретами](/uk/gateway/secrets)
- [CLI `secrets`](/uk/cli/secrets)
- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
