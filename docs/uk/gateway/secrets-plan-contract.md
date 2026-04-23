---
read_when:
    - Генерація або перевірка планів `openclaw secrets apply`
    - Налагодження помилок `Invalid plan target path`
    - Розуміння поведінки перевірки типу цілі та шляху
summary: 'Контракт для планів `secrets apply`: перевірка цілі, зіставлення шляхів і область цілі `auth-profiles.json`'
title: Контракт плану застосування секретів
x-i18n:
    generated_at: "2026-04-23T20:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Ця сторінка визначає суворий контракт, який застосовує `openclaw secrets apply`.

Якщо ціль не відповідає цим правилам, застосування завершується помилкою до внесення змін у конфігурацію.

## Форма файла плану

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

## Підтримувана область цілей

Цілі плану приймаються для підтримуваних шляхів credentials у:

- [Поверхня credentials SecretRef](/uk/reference/secretref-credential-surface)

## Поведінка типу цілі

Загальне правило:

- `target.type` має бути розпізнаним і має відповідати нормалізованій формі `target.path`.

Псевдоніми сумісності для наявних планів і далі приймаються:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Правила перевірки шляху

Кожна ціль перевіряється за всіма наведеними нижче правилами:

- `type` має бути розпізнаним типом цілі.
- `path` має бути непорожнім dot-шляхом.
- `pathSegments` можна не вказувати. Якщо його вказано, він має нормалізуватися точно до того самого шляху, що й `path`.
- Заборонені сегменти відхиляються: `__proto__`, `prototype`, `constructor`.
- Нормалізований шлях має відповідати зареєстрованій формі шляху для типу цілі.
- Якщо задано `providerId` або `accountId`, вони мають відповідати id, закодованому в шляху.
- Цілі `auth-profiles.json` потребують `agentId`.
- Під час створення нового зіставлення `auth-profiles.json` включайте `authProfileProvider`.

## Поведінка при помилці

Якщо ціль не проходить перевірку, застосування завершується з помилкою на кшталт:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Для невалідного плану жодні записи не фіксуються.

## Поведінка згоди для exec provider

- `--dry-run` за замовчуванням пропускає перевірки exec SecretRef.
- Плани, що містять exec SecretRef/provider, відхиляються в режимі запису, якщо не задано `--allow-exec`.
- Під час перевірки/застосування планів, що містять exec, передавайте `--allow-exec` і для dry-run, і для режиму запису.

## Примітки щодо runtime та області аудиту

- Записи `auth-profiles.json` лише з ref (`keyRef`/`tokenRef`) включаються до розв’язання під час виконання та покриття аудиту.
- `secrets apply` записує підтримувані цілі `openclaw.json`, підтримувані цілі `auth-profiles.json` і необов’язкові scrub-цілі.

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

Якщо застосування завершується помилкою з повідомленням про невалідний шлях цілі, заново згенеруйте план за допомогою `openclaw secrets configure` або виправте шлях цілі на одну з підтримуваних форм вище.

## Пов’язана документація

- [Керування секретами](/uk/gateway/secrets)
- [CLI `secrets`](/uk/cli/secrets)
- [Поверхня credentials SecretRef](/uk/reference/secretref-credential-surface)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
