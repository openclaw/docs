---
read_when:
    - Создание или проверка планов `openclaw secrets apply`
    - Отладка ошибок `Invalid plan target path`
    - Принципы проверки типа цели и пути
summary: 'Контракт для планов `secrets apply`: проверка целей, сопоставление путей и область целей `auth-profiles.json`'
title: Контракт плана применения секретов
x-i18n:
    generated_at: "2026-07-13T18:10:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

На этой странице определяется строгий контракт, соблюдение которого обеспечивает `openclaw secrets apply`. Если целевой объект не соответствует этим правилам, применение завершается ошибкой до изменения какого-либо файла.

## Структура файла плана

`openclaw secrets apply --from <plan.json>` ожидает массив `targets` целевых объектов плана:

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

`openclaw secrets configure` создаёт планы в такой структуре. План также можно написать или отредактировать вручную.

## Добавление, обновление и удаление провайдеров

Планы также могут содержать два необязательных поля верхнего уровня, которые изменяют отображение `secrets.providers` наряду с записью отдельных целевых объектов:

- `providerUpserts` — объект, ключами которого служат псевдонимы провайдеров. Каждое значение представляет собой определение провайдера (той же структуры, которая принимается в `secrets.providers.<alias>` файла `openclaw.json`, например провайдер `exec` или `file`).
- `providerDeletes` — массив псевдонимов провайдеров, которые нужно удалить.

`providerUpserts` выполняется перед `targets`, поэтому `target.ref.provider` может ссылаться на псевдоним провайдера, добавляемый тем же планом в `providerUpserts`. Без такого порядка планы, ссылающиеся на ещё не настроенный в `openclaw.json` псевдоним, завершаются ошибкой `provider "<alias>" is not configured`.

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

На exec-провайдеры, добавленные через `providerUpserts`, по-прежнему распространяются правила согласия на выполнение из раздела [Поведение согласия для exec-провайдеров](#exec-provider-consent-behavior): для планов, содержащих exec-провайдеры, в режиме записи требуется `--allow-exec`.

## Поддерживаемая область целевых объектов

Целевые объекты плана принимаются для поддерживаемых путей учётных данных, перечисленных в разделе [Поверхность учётных данных SecretRef](/ru/reference/secretref-credential-surface).

## Поведение типов целевых объектов

`target.type` должен быть распознаваемым типом целевого объекта, а нормализованный `target.path` должен соответствовать зарегистрированной для этого типа структуре пути.

Для совместимости с существующими планами некоторые типы целевых объектов принимают в качестве `target.type` также псевдоним наряду с каноническим именем типа:

| Канонический тип                      | Принимаемый псевдоним                          |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Правила проверки путей

Каждый целевой объект проверяется по всем следующим правилам:

- `type` должен быть распознаваемым типом целевого объекта.
- `path` должен быть непустым путём с разделителями-точками.
- `pathSegments` можно не указывать. Если он указан, после нормализации он должен в точности совпадать с путём `path`.
- Запрещённые сегменты отклоняются: `__proto__`, `prototype`, `constructor`.
- Нормализованный путь должен соответствовать зарегистрированной структуре пути для данного типа целевого объекта.
- Если задан `providerId` или `accountId`, он должен совпадать с идентификатором, закодированным в пути.
- Для целевых объектов `auth-profiles.json` требуется `agentId`.
- При создании нового отображения `auth-profiles.json` укажите `authProfileProvider`.

## Поведение при ошибке

Если целевой объект не проходит проверку, применение завершается с ошибкой следующего вида:

```text
Недопустимый путь целевого объекта плана для models.providers.apiKey: models.providers.openai.baseUrl
```

Для недопустимого плана изменения не фиксируются: разрешение целевых объектов и проверка путей выполняются до изменения какого-либо файла. Кроме того, после начала записи допустимого плана применение сначала создаёт снимки всех затрагиваемых файлов и восстанавливает их, если последующая запись в рамках того же запуска завершается ошибкой. Поэтому частичная запись никогда не приводит к рассинхронизации конфигурации, профилей аутентификации или состояния переменных окружения.

## Поведение согласия для exec-провайдеров

- `--dry-run` по умолчанию пропускает проверки exec SecretRef.
- Планы, содержащие exec SecretRef или exec-провайдеры, отклоняются в режиме записи, если не задан `--allow-exec`.
- При проверке и применении планов, содержащих exec, передавайте `--allow-exec` как в командах пробного запуска, так и в командах записи.

## Примечания об области выполнения и аудита

- Записи `auth-profiles.json`, содержащие только ссылки (`keyRef`/`tokenRef`), включаются в разрешение учётных данных во время выполнения и в область аудита.
- `secrets apply` записывает поддерживаемые целевые объекты `openclaw.json`, поддерживаемые целевые объекты `auth-profiles.json` и выполняет три необязательных прохода очистки, каждый из которых включён по умолчанию: `scrubEnv` (удаляет перенесённые значения в виде открытого текста из `.env`), `scrubAuthProfilesForProviderTargets` (удаляет остаточные значения в виде открытого текста и неиспользуемые ссылки из `auth-profiles.json` для провайдеров, только что перенесённых планом) и `scrubLegacyAuthJson` (удаляет перенесённые записи `api_key` из устаревших хранилищ `auth.json`). Чтобы пропустить соответствующий проход, задайте в плане для любого из `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` значение `false`.

## Проверки оператора

```bash
# Проверить план без записи
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Затем применить изменения
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Для планов, содержащих exec, явно разрешить его в обоих режимах
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Если применение завершается сообщением о недопустимом пути целевого объекта, повторно создайте план с помощью `openclaw secrets configure` или исправьте путь целевого объекта так, чтобы он соответствовал одной из поддерживаемых выше структур.

## Связанная документация

- [Управление секретами](/ru/gateway/secrets)
- [CLI `secrets`](/ru/cli/secrets)
- [Поверхность учётных данных SecretRef](/ru/reference/secretref-credential-surface)
- [Справочник по конфигурации](/ru/gateway/configuration-reference)
