---
read_when:
    - Вы хотите, чтобы OpenClaw считывал ключи API из HashiCorp Vault
    - Вы настраиваете SecretRefs на локальном компьютере или сервере
    - Необходимо настроить учетные данные поставщика моделей с хранением в Vault
summary: Используйте встроенный плагин Vault для разрешения SecretRef из HashiCorp Vault
title: SecretRefs хранилища секретов
x-i18n:
    generated_at: "2026-07-13T18:27:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRef для Vault

Встроенный плагин Vault позволяет OpenClaw разрешать `exec` SecretRef из
HashiCorp Vault при запуске и перезагрузке Gateway. OpenClaw хранит ссылки Vault
в конфигурации, сохраняет разрешённые значения в снимке секретов в памяти
и не записывает разрешённые API-ключи обратно в `openclaw.json`.

Используйте этот вариант, если вы уже используете Vault или хотите хранить ключи поставщиков
моделей вне файлов конфигурации OpenClaw. О модели выполнения SecretRef см.
[Управление секретами](/ru/gateway/secrets).

## Перед началом

Вам потребуется:

- OpenClaw с доступным встроенным плагином `vault`
- доступный сервер Vault
- аутентификация Vault, позволяющая получить клиентский токен с доступом на чтение путей
  секретов, которые должен разрешать OpenClaw
- среда, запускающая Gateway, должна содержать `VAULT_ADDR` и либо
  `VAULT_TOKEN`, либо `OPENCLAW_VAULT_AUTH_METHOD=token_file` вместе с `VAULT_TOKEN_FILE`,
  либо настроенный вход через JWT/Kubernetes

Средство разрешения взаимодействует с Vault по HTTP из Node. Для разрешения SecretRef
Gateway не требуется CLI Vault.

Включите встроенный плагин перед выполнением команд `openclaw vault`:

```bash
openclaw plugins enable vault
```

## Сохранение ключа поставщика в Vault

По умолчанию OpenClaw использует KV v2, смонтированный в `secret`, как в примерах
с сервером разработки Vault. Для рабочего сервера Vault перед созданием идентификаторов SecretRef
задайте для `OPENCLAW_VAULT_KV_MOUNT` фактический путь монтирования KV. При стандартных настройках
OpenClaw этот идентификатор SecretRef:

```text
providers/openrouter/apiKey
```

считывает следующее поле Vault:

```text
secret/data/providers/openrouter -> apiKey
```

Один из способов создать его с помощью CLI Vault:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Используйте для OpenClaw клиентский токен с ограниченной областью действия, а не корневой токен.
Для стандартной структуры KV v2 минимальная политика для ключей поставщиков моделей выглядит так:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Предоставление Gateway доступа к Vault

Для локального Gateway, работающего без контейнера, экспортируйте настройки Vault в той же оболочке,
из которой запускается OpenClaw. Стандартный метод аутентификации считывает клиентский токен Vault
из `VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Если Vault Agent записывает токен в целевой файл, используйте аутентификацию через файл токена:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

Если сервер Vault подписан частным центром сертификации, установите этот сертификат ЦС
в хранилище доверенных сертификатов узла и включите использование системного хранилища в Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

Либо укажите пакет сертификатов PEM напрямую:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Эти переменные должны присутствовать при запуске OpenClaw. Плагин Vault передаёт
их своему процессу разрешения.

Для неинтерактивной аутентификации JWT используйте файл JWT рабочей нагрузки и роль Vault типа
`jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

Файл JWT должен содержать проецируемый токен рабочей нагрузки, например токен сервисной учётной записи
Kubernetes с аудиторией, принимаемой ролью Vault.
Интерактивный вход через OIDC в браузере удобен для людей, но среде выполнения Gateway необходим
неинтерактивный вход через JWT или файл токена.

Для метода аутентификации Kubernetes в Vault используйте `kubernetes`. Он предназначен для
Gateway, работающих как Pod; стандартная точка монтирования — `kubernetes`, а стандартный файл JWT
находится по обычному пути токена сервисной учётной записи:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Задавайте `OPENCLAW_VAULT_AUTH_MOUNT`, только если аутентификация Kubernetes смонтирована в Vault
не в `auth/kubernetes`. Задавайте `OPENCLAW_VAULT_JWT_FILE`, только если токен сервисной
учётной записи проецируется по нестандартному пути.

Необязательные настройки:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Проверьте, что доступно текущей оболочке:

```bash
openclaw vault status
```

Если настроено несколько поставщиков секретов на основе Vault, выберите нужный
по псевдониму:

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` никогда не выводит `VAULT_TOKEN`; команда сообщает только,
заданы ли токен, файл токена и файл JWT.

<Warning>
Если Gateway работает как служба, LaunchAgent, модуль systemd, запланированная задача или
контейнер, эта среда выполнения должна получить те же переменные Vault.
Установка переменных в интерактивной оболочке подтверждает их наличие только в этой оболочке,
но не в уже запущенном Gateway.
</Warning>

## Создание и применение плана SecretRef

Создайте план, сопоставляющий API-ключ поставщика моделей OpenRouter с Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Примените и проверьте план:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Используйте `--allow-exec`, поскольку плагин Vault выполняет разрешение через управляемого OpenClaw
поставщика SecretRef типа exec.

Если Gateway ещё не запущен, после применения плана запустите его обычным способом
вместо выполнения `openclaw secrets reload`.

## Настройка дополнительных ключей поставщиков

Встроенные сокращения:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Несколько ключей поставщиков в одном плане:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

Для встроенных поставщиков без сокращений, а также уже настроенных OpenAI-совместимых
и пользовательских поставщиков моделей используйте `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Каждый `--provider-key <provider=id>` записывает SecretRef в
`models.providers.<provider>.apiKey`. Для пользовательских поставщиков команда не создаёт
настройки поставщика `baseUrl`, `api` или `models`; сначала настройте их.

Используйте `--target <path=id>` для любого известного целевого пути SecretRef:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Целевые пути без префикса применяются к `openclaw.json`. Используйте
`auth-profiles:<agentId>:<path>` для существующих целей `auth-profiles.json`.
Целевой путь должен быть зарегистрированной целью SecretRef в OpenClaw. Команда настройки
не создаёт произвольные именованные секреты в OpenClaw: хранилищем секретов остаётся Vault,
а OpenClaw сохраняет SecretRef только в поддерживаемых полях конфигурации.

## Формат идентификатора SecretRef

Идентификаторы Vault SecretRef используют следующее соглашение:

```text
<vault-secret-path>/<field>
```

Примеры:

| Идентификатор SecretRef       | Стандартное чтение Vault KV v2     | Возвращаемое поле |
| ----------------------------- | ---------------------------------- | ----------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

Возвращаемое поле Vault должно быть строкой.

Для KV v1 задайте:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

Тогда `providers/openrouter/apiKey` считывает:

```text
secret/providers/openrouter -> apiKey
```

## Что хранит OpenClaw

При применении плана настройки Vault сохраняется управляемый плагином поставщик:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Поля учётных данных ссылаются на этого поставщика:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

Разрешённое значение существует только в активном снимке секретов среды выполнения.

## Контейнеры и управляемые развёртывания

Gateway в контейнерах используют те же плагин и конфигурацию SecretRef. В контейнер
необходимо передать:

- `VAULT_ADDR`
- один источник аутентификации:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` вместе с `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` вместе с `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE` и `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` вместе с `OPENCLAW_VAULT_AUTH_ROLE`; при необходимости
    переопределите `OPENCLAW_VAULT_AUTH_MOUNT` или `OPENCLAW_VAULT_JWT_FILE`
- необязательные `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` и
  `OPENCLAW_VAULT_KV_VERSION`

При использовании Kubernetes отдавайте предпочтение `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`,
если в Vault настроена аутентификация Kubernetes для кластера. Используйте
`OPENCLAW_VAULT_AUTH_METHOD=jwt`, только если Vault настроен так, чтобы считать кластер
обычным издателем JWT/OIDC. Оба варианта лучше, чем долгоживущий токен Vault
в секрете Kubernetes. Развёртывания с дополнительным контейнером Vault Agent или инжектором
могут вместо этого использовать `token_file`.

В мультитенантных конфигурациях Vault задавайте маршрутизацию арендаторов в политике Vault
и конфигурации развёртывания. OpenClaw не требует фиксированных точки монтирования, роли или пути:
каждая среда Gateway может задавать собственные `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE` и идентификаторы SecretRef. Если один общий Gateway должен одновременно разрешать
данные разных пользователей Vault, используйте вручную настроенных поставщиков exec, оборачивающих
разные среды аутентификации, либо разделите арендаторов между средами Gateway
с отдельными переменными окружения Vault.

## Связанные материалы

- [Управление секретами](/ru/gateway/secrets)
- [`openclaw secrets`](/ru/cli/secrets)
- [Перечень плагинов](/ru/plugins/plugin-inventory)
