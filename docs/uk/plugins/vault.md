---
read_when:
    - Ви хочете, щоб OpenClaw зчитував ключі API з HashiCorp Vault
    - Ви налаштовуєте SecretRefs на локальному комп’ютері або сервері
    - Потрібно налаштувати облікові дані постачальника моделей, що зберігаються у Vault
summary: Використовуйте вбудований Plugin Vault, щоб отримувати значення SecretRefs із HashiCorp Vault
title: SecretRef-и сховища секретів
x-i18n:
    generated_at: "2026-07-12T13:33:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRef у Vault

Вбудований Plugin Vault дає змогу OpenClaw розв’язувати SecretRef типу `exec` із HashiCorp Vault під час запуску та перезавантаження Gateway. OpenClaw зберігає посилання на Vault у конфігурації, утримує розв’язані значення у знімку секретів у пам’яті та не записує розв’язані ключі API назад до `openclaw.json`.

Використовуйте це рішення, якщо ви вже використовуєте Vault або хочете зберігати ключі постачальників моделей поза файлами конфігурації OpenClaw. Опис моделі виконання SecretRef див. у розділі [Керування секретами](/uk/gateway/secrets).

## Перед початком

Вам потрібні:

- OpenClaw із доступним вбудованим плагіном `vault`
- доступний сервер Vault
- автентифікація Vault, яка може надати клієнтський токен із доступом на читання шляхів секретів, які має розв’язувати OpenClaw
- середовище, що запускає Gateway, повинно містити `VAULT_ADDR` і один із таких варіантів: `VAULT_TOKEN`, `OPENCLAW_VAULT_AUTH_METHOD=token_file` разом із `VAULT_TOKEN_FILE` або налаштований вхід через JWT/Kubernetes

Засіб розв’язання взаємодіє з Vault через HTTP із Node. Для розв’язання SecretRef у Gateway не потрібен CLI Vault.

Увімкніть вбудований плагін перед виконанням команд `openclaw vault`:

```bash
openclaw plugins enable vault
```

## Збереження ключа постачальника у Vault

За замовчуванням OpenClaw використовує KV v2, змонтований у `secret`, відповідно до прикладів сервера розробки Vault. Для робочого середовища Vault установіть `OPENCLAW_VAULT_KV_MOUNT` відповідно до фактичного шляху монтування KV перед створенням ідентифікаторів SecretRef. За стандартних налаштувань OpenClaw цей ідентифікатор SecretRef:

```text
providers/openrouter/apiKey
```

читає це поле Vault:

```text
secret/data/providers/openrouter -> apiKey
```

Один зі способів створити його за допомогою CLI Vault:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Використовуйте для OpenClaw клієнтський токен з обмеженою областю дії, а не кореневий токен. Для стандартної структури KV v2 мінімальна політика для ключів постачальників моделей має такий вигляд:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Надання Gateway доступу до Vault

Для локального Gateway без контейнеризації експортуйте налаштування Vault у тій самій оболонці, у якій запускається OpenClaw. Стандартний метод автентифікації зчитує клієнтський токен Vault із `VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Якщо Vault Agent записує токен у вихідний файл, використовуйте автентифікацію через файл токена:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

Якщо сервер Vault підписано приватним центром сертифікації, установіть цей сертифікат у сховище довіри хоста й увімкніть використання системного сховища довіри в Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

Або безпосередньо вкажіть набір сертифікатів PEM:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Ці змінні мають бути наявні під час запуску OpenClaw. Plugin Vault передає їх своєму процесу розв’язання.

Для неінтерактивної автентифікації JWT використовуйте файл JWT робочого навантаження та роль Vault типу `jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

Файл JWT має містити проєктований токен робочого навантаження, наприклад токен облікового запису служби Kubernetes з аудиторією, яку приймає роль Vault.
Інтерактивний вхід OIDC через браузер корисний для людей, але середовищу виконання Gateway потрібен неінтерактивний вхід JWT або файл токена.

Для методу автентифікації Kubernetes у Vault використовуйте `kubernetes`. Він призначений для Gateway, що працюють як поди; стандартна точка монтування — `kubernetes`, а стандартний файл JWT — це типовий шлях токена облікового запису служби:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Установлюйте `OPENCLAW_VAULT_AUTH_MOUNT`, лише якщо автентифікацію Kubernetes у Vault змонтовано не в `auth/kubernetes`. Установлюйте `OPENCLAW_VAULT_JWT_FILE`, лише якщо токен облікового запису служби проєктується за нестандартним шляхом.

Необов’язкові налаштування:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Перевірте, що доступно поточній оболонці:

```bash
openclaw vault status
```

Якщо налаштовано кілька постачальників секретів на основі Vault, виберіть одного за псевдонімом:

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` ніколи не виводить `VAULT_TOKEN`; команда повідомляє лише про те, чи задано токен, файл токена та файл JWT.

<Warning>
Якщо Gateway працює як служба, LaunchAgent, модуль systemd, заплановане завдання або контейнер, це середовище виконання повинно отримати ті самі змінні Vault. Установлення змінних в інтерактивній оболонці підтверджує їхню наявність лише в цій оболонці, а не у вже запущеному Gateway.
</Warning>

## Створення та застосування плану SecretRef

Створіть план, який зіставляє ключ API постачальника моделей OpenRouter із Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Застосуйте та перевірте план:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Використовуйте `--allow-exec`, оскільки Plugin Vault виконує розв’язання через керованого OpenClaw постачальника SecretRef типу `exec`.

Якщо Gateway ще не запущено, після застосування плану запустіть його звичайним способом замість виконання `openclaw secrets reload`.

## Налаштування додаткових ключів постачальників

Вбудовані скорочення:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Кілька ключів постачальників в одному плані:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

Для вбудованих постачальників без скорочень або вже налаштованих сумісних з OpenAI та спеціалізованих постачальників моделей використовуйте `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Кожен параметр `--provider-key <provider=id>` записує SecretRef до `models.providers.<provider>.apiKey`. Для спеціалізованих постачальників він не створює налаштування `baseUrl`, `api` або `models`; спочатку налаштуйте їх.

Використовуйте `--target <path=id>` для будь-якого відомого цільового шляху SecretRef:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Цільові шляхи без префікса застосовуються до `openclaw.json`. Для наявних цільових шляхів у `auth-profiles.json` використовуйте `auth-profiles:<agentId>:<path>`.
Цільовий шлях має бути зареєстрованим у OpenClaw цільовим шляхом SecretRef. Команда налаштування не створює довільні іменовані секрети в OpenClaw; Vault залишається сховищем секретів, а OpenClaw зберігає SecretRef лише в підтримуваних полях конфігурації.

## Формат ідентифікатора SecretRef

Ідентифікатори SecretRef у Vault використовують таку угоду:

```text
<vault-secret-path>/<field>
```

Приклади:

| Ідентифікатор SecretRef        | Стандартне читання Vault KV v2    | Повернуте поле |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

Поле, повернуте Vault, має бути рядком.

Для KV v1 установіть:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

Тоді `providers/openrouter/apiKey` читає:

```text
secret/providers/openrouter -> apiKey
```

## Що зберігає OpenClaw

Застосування плану налаштування Vault зберігає керованого плагіном постачальника:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Поля облікових даних посилаються на цього постачальника:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

Розв’язане значення міститься лише в активному знімку секретів середовища виконання.

## Контейнери та керовані розгортання

Контейнеризовані Gateway використовують той самий Plugin і ту саму конфігурацію SecretRef. Контейнер повинен отримати:

- `VAULT_ADDR`
- одне джерело автентифікації:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` разом із `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` разом із `OPENCLAW_VAULT_AUTH_MOUNT`, `OPENCLAW_VAULT_AUTH_ROLE` і `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` разом із `OPENCLAW_VAULT_AUTH_ROLE`; за потреби можна перевизначити `OPENCLAW_VAULT_AUTH_MOUNT` або `OPENCLAW_VAULT_JWT_FILE`
- необов’язкові `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` і `OPENCLAW_VAULT_KV_VERSION`

Під час використання Kubernetes віддавайте перевагу `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`, якщо у Vault для кластера налаштовано автентифікацію Kubernetes. Використовуйте `OPENCLAW_VAULT_AUTH_METHOD=jwt`, лише якщо Vault налаштовано розглядати кластер як універсального видавця JWT/OIDC. Обидва варіанти кращі за довготривалий токен Vault у секреті Kubernetes. Розгортання із допоміжним контейнером або інжектором Vault Agent натомість можуть використовувати `token_file`.

Для багатокористувацьких конфігурацій Vault зберігайте маршрутизацію орендарів у політиках Vault і конфігурації розгортання. OpenClaw не вимагає фіксованої точки монтування, ролі чи шляху: кожне середовище Gateway може задавати власні `OPENCLAW_VAULT_KV_MOUNT`, `OPENCLAW_VAULT_AUTH_ROLE` та ідентифікатори SecretRef. Якщо один спільний Gateway має одночасно розв’язувати секрети різних користувачів Vault, використовуйте налаштованих вручну постачальників `exec`, які обгортають окремі середовища автентифікації, або розділіть орендарів між середовищами Gateway з окремими змінними середовища Vault.

## Пов’язані матеріали

- [Керування секретами](/uk/gateway/secrets)
- [`openclaw secrets`](/uk/cli/secrets)
- [Перелік плагінів](/uk/plugins/plugin-inventory)
