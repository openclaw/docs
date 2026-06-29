---
read_when:
    - Создание или проверка планов `openclaw secrets apply`
    - Отладка ошибок `Invalid plan target path`
    - Понимание поведения типа цели и проверки пути
summary: 'Контракт для планов `secrets apply`: проверка целей, сопоставление путей и область действия цели `auth-profiles.json`'
title: Контракт плана применения секретов
x-i18n:
    generated_at: "2026-06-28T23:00:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Эта страница определяет строгий контракт, принудительно применяемый командой `openclaw secrets apply`.

Если цель не соответствует этим правилам, применение завершается ошибкой до изменения конфигурации.

## Форма файла плана

`openclaw secrets apply --from <plan.json>` ожидает массив `targets` с целями плана:

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

## Добавление и удаление провайдеров

Планы также могут включать два необязательных поля верхнего уровня, которые изменяют карту `secrets.providers` вместе с записями для отдельных целей:

- `providerUpserts` — объект, ключами которого являются псевдонимы провайдеров. Каждое значение является определением провайдера (той же формы, которая принимается в `secrets.providers.<alias>` в `openclaw.json`, например провайдер `exec` или `file`).
- `providerDeletes` — массив псевдонимов провайдеров для удаления.

`providerUpserts` выполняется перед `targets`, поэтому `target.ref.provider` может ссылаться на псевдоним провайдера, который тот же план вводит в `providerUpserts`. Без этого планы, ссылающиеся на псевдоним, еще не настроенный в `openclaw.json`, завершаются ошибкой `provider "<alias>" is not configured`.

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

Провайдеры exec, введенные через `providerUpserts`, по-прежнему подпадают под правила согласия для exec в разделе [Поведение согласия для провайдера exec](#exec-provider-consent-behavior): планы, содержащие провайдеры exec, требуют `--allow-exec` в режиме записи.

## Поддерживаемая область целей

Цели плана принимаются для поддерживаемых путей учетных данных в:

- [Поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface)

## Поведение типа цели

Общее правило:

- `target.type` должен быть распознан и должен соответствовать нормализованной форме `target.path`.

Для существующих планов продолжают приниматься псевдонимы совместимости:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Правила проверки пути

Каждая цель проверяется по всем следующим правилам:

- `type` должен быть распознанным типом цели.
- `path` должен быть непустым точечным путем.
- `pathSegments` можно опустить. Если он указан, он должен нормализоваться ровно в тот же путь, что и `path`.
- Запрещенные сегменты отклоняются: `__proto__`, `prototype`, `constructor`.
- Нормализованный путь должен соответствовать зарегистрированной форме пути для типа цели.
- Если задан `providerId` или `accountId`, он должен совпадать с идентификатором, закодированным в пути.
- Для целей `auth-profiles.json` требуется `agentId`.
- При создании нового сопоставления `auth-profiles.json` укажите `authProfileProvider`.

## Поведение при ошибке

Если цель не проходит проверку, применение завершается с ошибкой вида:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Для недопустимого плана записи не фиксируются.

## Поведение согласия для провайдера exec

- `--dry-run` по умолчанию пропускает проверки SecretRef для exec.
- Планы, содержащие SecretRef/провайдеры exec, отклоняются в режиме записи, если не задан `--allow-exec`.
- При проверке/применении планов, содержащих exec, передавайте `--allow-exec` как в командах dry-run, так и в командах записи.

## Примечания об области выполнения и аудита

- Записи `auth-profiles.json` только со ссылками (`keyRef`/`tokenRef`) включаются в разрешение во время выполнения и покрытие аудита.
- `secrets apply` записывает поддерживаемые цели `openclaw.json`, поддерживаемые цели `auth-profiles.json` и необязательные цели очистки.

## Проверки оператора

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Если применение завершается ошибкой с сообщением о недопустимом пути цели, повторно создайте план с помощью `openclaw secrets configure` или исправьте путь цели на поддерживаемую форму выше.

## Связанные документы

- [Управление секретами](/ru/gateway/secrets)
- [CLI `secrets`](/ru/cli/secrets)
- [Поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface)
- [Справочник конфигурации](/ru/gateway/configuration-reference)
