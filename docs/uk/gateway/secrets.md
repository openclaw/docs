---
read_when:
    - Налаштування SecretRef для облікових даних provider-а і ref `auth-profiles.json`
    - Безпечна робота з reload, audit, configure та apply секретів у production
    - Розуміння fail-fast під час запуску, фільтрації неактивної поверхні та поведінки last-known-good
summary: 'Керування секретами: контракт SecretRef, поведінка runtime snapshot і безпечне одностороннє очищення'
title: Керування секретами
x-i18n:
    generated_at: "2026-04-23T20:54:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw підтримує адитивні SecretRef, тому підтримувані облікові дані не потрібно зберігати у відкритому тексті в конфігурації.

Відкритий текст усе ще працює. SecretRef — це добровільне ввімкнення для кожного облікового запису окремо.

## Цілі та runtime model

Секрети розв’язуються в runtime snapshot у пам’яті.

- Розв’язання відбувається eagerly під час активації, а не ліниво в шляхах запиту.
- Під час запуску спрацьовує fail-fast, якщо effectively active SecretRef неможливо розв’язати.
- Reload використовує atomic swap: або повний успіх, або зберігається last-known-good snapshot.
- Порушення політики SecretRef (наприклад, auth profiles у режимі OAuth, поєднані з введенням SecretRef) зупиняють активацію до заміни runtime snapshot.
- Runtime-запити читають лише з активного snapshot у пам’яті.
- Після першої успішної активації/завантаження конфігурації runtime paths продовжують читати цей активний snapshot у пам’яті, доки успішний reload не замінить його.
- Шляхи вихідної доставки також читають із цього активного snapshot (наприклад, доставка відповідей/тредів Discord і надсилання дій Telegram); вони не розв’язують SecretRef повторно при кожному надсиланні.

Це прибирає збої secret-provider-ів із гарячих шляхів запитів.

## Фільтрація активної поверхні

SecretRef перевіряються лише на effectively active surfaces.

- Увімкнені поверхні: нерозв’язані refs блокують startup/reload.
- Неактивні поверхні: нерозв’язані refs не блокують startup/reload.
- Неактивні refs генерують нефатальні діагностики з кодом `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Приклади неактивних поверхонь:

- Вимкнені записи channel/account.
- Верхньорівневі облікові дані каналу, які не успадковує жоден увімкнений обліковий запис.
- Вимкнені поверхні tool/feature.
- Ключі, специфічні для provider-а web search, які не вибрано в `tools.web.search.provider`.
  У режимі auto (provider не задано) ключі враховуються за precedence для автовизначення provider-а, доки один не розв’яжеться.
  Після вибору ключі невибраних provider-ів вважаються неактивними, доки їх не буде вибрано.
- Матеріали sandbox SSH auth (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, а також перевизначення для окремих агентів) активні лише
  коли ефективний backend sandbox — `ssh` для типового агента або увімкненого агента.
- SecretRef `gateway.remote.token` / `gateway.remote.password` активні, якщо істинна одна з цих умов:
  - `gateway.mode=remote`
  - налаштовано `gateway.remote.url`
  - `gateway.tailscale.mode` має значення `serve` або `funnel`
  - У локальному режимі без цих віддалених поверхонь:
    - `gateway.remote.token` активний, коли може перемогти token auth і не налаштовано env/auth token.
    - `gateway.remote.password` активний лише коли може перемогти password auth і не налаштовано env/auth password.
- SecretRef `gateway.auth.token` неактивний для startup auth resolution, коли встановлено `OPENCLAW_GATEWAY_TOKEN`, оскільки env token input має пріоритет для цього runtime.

## Діагностика поверхні auth Gateway

Коли SecretRef налаштовано на `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` або `gateway.remote.password`, startup/reload gateway явно логує
стан поверхні:

- `active`: SecretRef є частиною ефективної auth surface і має розв’язуватися.
- `inactive`: SecretRef ігнорується для цього runtime, оскільки перемагає інша auth surface або
  тому, що remote auth вимкнено/неактивний.

Ці записи логуються як `SECRETS_GATEWAY_AUTH_SURFACE` і містять причину, використану
політикою active-surface, тож ви можете побачити, чому credential вважався активним або неактивним.

## Попередня перевірка reference під час онбордингу

Коли онбординг працює в інтерактивному режимі й ви обираєте зберігання через SecretRef, OpenClaw перед збереженням запускає preflight validation:

- Env refs: перевіряє ім’я env var і підтверджує, що під час налаштування видно непорожнє значення.
- Provider refs (`file` або `exec`): перевіряє вибір provider-а, розв’язує `id` і перевіряє тип розв’язаного значення.
- Шлях повторного використання quickstart: коли `gateway.auth.token` уже є SecretRef, онбординг розв’язує його перед bootstrap probe/dashboard (для refs `env`, `file` і `exec`) з використанням того самого fail-fast фільтра.

Якщо перевірка не проходить, онбординг показує помилку й дає змогу повторити спробу.

## Контракт SecretRef

Використовуйте одну форму об’єкта всюди:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Валідація:

- `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
- `id` має відповідати `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Валідація:

- `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
- `id` має бути абсолютним JSON pointer (`/...`)
- Екранування RFC6901 у сегментах: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Валідація:

- `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
- `id` має відповідати `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` не повинен містити `.` або `..` як slash-delimited сегменти шляху (наприклад, `a/../b` відхиляється)

## Конфігурація provider-а

Визначайте providers у `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // або "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- Необов’язковий allowlist через `allowlist`.
- Відсутні/порожні env-значення призводять до збою розв’язання.

### File provider

- Читає локальний файл із `path`.
- `mode: "json"` очікує payload у вигляді JSON-об’єкта й розв’язує `id` як pointer.
- `mode: "singleValue"` очікує ref id `"value"` і повертає вміст файлу.
- Шлях має проходити перевірки власника/дозволів.
- Примітка fail-closed для Windows: якщо перевірка ACL недоступна для шляху, розв’язання завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього provider-а, щоб обійти перевірки безпеки шляху.

### Exec provider

- Запускає налаштований абсолютний шлях до binary, без shell.
- Типово `command` має вказувати на звичайний файл (не symlink).
- Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи команд через symlink (наприклад, шими Homebrew). OpenClaw перевіряє розв’язаний цільовий шлях.
- Поєднуйте `allowSymlinkCommand` із `trustedDirs` для шляхів package manager-а (наприклад `["/opt/homebrew"]`).
- Підтримує timeout, timeout за відсутності виводу, ліміти байтів виводу, allowlist env і trusted dirs.
- Примітка fail-closed для Windows: якщо перевірка ACL недоступна для шляху команди, розв’язання завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього provider-а, щоб обійти перевірки безпеки шляху.

Payload запиту (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload відповіді (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Необов’язкові помилки для окремих id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Приклади інтеграції exec

### CLI 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // потрібно для бінарних файлів Homebrew через symlink
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### CLI HashiCorp Vault

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // потрібно для бінарних файлів Homebrew через symlink
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // потрібно для бінарних файлів Homebrew через symlink
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Змінні середовища сервера MCP

Env vars сервера MCP, налаштовані через `plugins.entries.acpx.config.mcpServers`, підтримують SecretInput. Це дозволяє не тримати ключі API й токени у відкритому тексті конфігурації:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Рядкові значення відкритим текстом усе ще працюють. Env-template refs на кшталт `${MCP_SERVER_API_KEY}` і об’єкти SecretRef розв’язуються під час активації gateway до запуску процесу MCP server. Як і для інших поверхонь SecretRef, нерозв’язані refs блокують активацію лише тоді, коли Plugin `acpx` є effectively active.

## Матеріали SSH auth для sandbox

Основний backend sandbox `ssh` також підтримує SecretRef для матеріалів SSH auth:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Поведінка під час виконання:

- OpenClaw розв’язує ці refs під час активації sandbox, а не ліниво під час кожного SSH-виклику.
- Розв’язані значення записуються у тимчасові файли з суворими дозволами й використовуються в згенерованій SSH config.
- Якщо ефективний backend sandbox не `ssh`, ці refs лишаються неактивними й не блокують startup.

## Підтримувана поверхня облікових даних

Канонічний список підтримуваних і непідтримуваних облікових даних наведено в:

- [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)

Облікові дані, створені під час виконання або такі, що ротуються, і матеріали OAuth refresh навмисно виключено з розв’язання SecretRef лише для читання.

## Обов’язкова поведінка та precedence

- Поле без ref: без змін.
- Поле з ref: обов’язкове на активних поверхнях під час активації.
- Якщо присутні і відкритий текст, і ref, на підтримуваних шляхах precedence пріоритет має ref.
- Sentinel редагування `__OPENCLAW_REDACTED__` зарезервовано для внутрішнього редагування/відновлення конфігурації і відхиляється як буквальні дані конфігурації, надіслані користувачем.

Сигнали попереджень і аудиту:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtime warning)
- `REF_SHADOWED` (результат аудиту, коли облікові дані в `auth-profiles.json` мають пріоритет над refs у `openclaw.json`)

Поведінка сумісності Google Chat:

- `serviceAccountRef` має пріоритет над відкритим текстом `serviceAccount`.
- Значення відкритого тексту ігнорується, коли задано сусідній ref.

## Тригери активації

Активація секретів виконується під час:

- Startup (preflight плюс фінальна активація)
- Шляху гарячого застосування reload конфігурації
- Шляху restart-check при reload конфігурації
- Ручного reload через `secrets.reload`
- RPC preflight запису конфігурації Gateway (`config.set` / `config.apply` / `config.patch`) для можливості розв’язання SecretRef на активній поверхні в поданому payload конфігурації до збереження змін

Контракт активації:

- Успіх атомарно замінює snapshot.
- Збій під час startup перериває запуск gateway.
- Збій runtime reload зберігає last-known-good snapshot.
- Збій write-RPC preflight відхиляє подану конфігурацію і залишає без змін як конфігурацію на диску, так і активний runtime snapshot.
- Передавання явного token каналу для одного виклику helper/tool outbound не запускає активацію SecretRef; точками активації залишаються startup, reload і явний `secrets.reload`.

## Сигнали деградації й відновлення

Коли активація під час reload не вдається після здорового стану, OpenClaw переходить у degraded secrets state.

Одноразові системні події та коди логів:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Поведінка:

- Degraded: runtime зберігає last-known-good snapshot.
- Recovered: генерується один раз після наступної успішної активації.
- Повторні збої, коли стан уже degraded, логують попередження, але не засмічують подіями.
- Fail-fast під час startup не генерує degraded events, оскільки runtime так і не став активним.

## Розв’язання в шляху команд

Шляхи команд можуть явно ввімкнути підтримуване розв’язання SecretRef через RPC snapshot gateway.

Є дві широкі моделі поведінки:

- Суворі шляхи команд (наприклад, віддалені шляхи `openclaw memory` і `openclaw qr --remote`, коли йому потрібні віддалені refs shared-secret) читають з активного snapshot і одразу завершуються з помилкою, якщо потрібний SecretRef недоступний.
- Шляхи команд лише для читання (наприклад, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` і потоки відновлення doctor/config лише для читання) також надають перевагу активному snapshot, але деградують замість переривання, коли цільовий SecretRef недоступний у цьому шляху команди.

Поведінка лише для читання:

- Коли gateway запущено, ці команди спочатку читають з активного snapshot.
- Якщо розв’язання gateway неповне або gateway недоступний, вони намагаються виконати цільовий локальний fallback для конкретної поверхні команди.
- Якщо цільовий SecretRef усе ще недоступний, команда продовжується з деградованим виводом лише для читання й явною діагностикою на кшталт “configured but unavailable in this command path”.
- Ця деградована поведінка локальна для конкретної команди. Вона не послаблює runtime startup, reload або шляхи send/auth.

Інші примітки:

- Оновлення snapshot після ротації секрету в backend обробляється через `openclaw secrets reload`.
- RPC-метод gateway, який використовують ці шляхи команд: `secrets.resolve`.

## Процес audit і configure

Типовий процес для оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Результати включають:

- значення відкритого тексту в стані спокою (`openclaw.json`, `auth-profiles.json`, `.env` і згенерований `agents/*/agent/models.json`)
- залишки чутливих заголовків provider-а у відкритому тексті в згенерованих записах `models.json`
- нерозв’язані refs
- затінення precedence (`auth-profiles.json` має пріоритет над refs у `openclaw.json`)
- застарілі залишки (`auth.json`, нагадування OAuth)

Примітка щодо exec:

- Типово audit пропускає перевірки можливості розв’язання `exec` SecretRef, щоб уникнути побічних ефектів команд.
- Використовуйте `openclaw secrets audit --allow-exec`, щоб виконувати exec providers під час аудиту.

Примітка щодо залишків у заголовках:

- Виявлення чутливих заголовків provider-а базується на евристиці назв (поширені назви/фрагменти auth або credential header, такі як `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

### `secrets configure`

Інтерактивний helper, який:

- спочатку налаштовує `secrets.providers` (`env`/`file`/`exec`, add/edit/remove)
- дає змогу вибирати підтримувані поля з секретами в `openclaw.json` і `auth-profiles.json` для однієї області агента
- може безпосередньо в picker цілей створити нове зіставлення `auth-profiles.json`
- збирає деталі SecretRef (`source`, `provider`, `id`)
- запускає preflight-розв’язання
- може застосувати зміни одразу

Примітка щодо exec:

- Preflight пропускає перевірки `exec` SecretRef, якщо не задано `--allow-exec`.
- Якщо ви застосовуєте безпосередньо з `configure --apply` і план містить refs/providers `exec`, залишайте `--allow-exec` увімкненим і для кроку apply.

Корисні режими:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Типові дії apply для `configure`:

- очищати відповідні статичні облікові дані з `auth-profiles.json` для цільових provider-ів
- очищати застарілі статичні записи `api_key` з `auth.json`
- очищати відповідні відомі рядки секретів із `<config-dir>/.env`

### `secrets apply`

Застосувати збережений план:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Примітка щодо exec:

- `dry-run` пропускає перевірки exec, якщо не задано `--allow-exec`.
- Режим запису відхиляє плани з `exec` SecretRef/providers, якщо не задано `--allow-exec`.

Деталі суворого контракту цілей/шляхів і точні правила відхилення див. в:

- [Secrets Apply Plan Contract](/uk/gateway/secrets-plan-contract)

## Одностороння політика безпеки

OpenClaw навмисно не записує резервні копії для відкату, які містять історичні секретні значення у відкритому тексті.

Модель безпеки:

- preflight має завершитися успішно до режиму запису
- активація runtime перевіряється до commit
- apply оновлює файли через атомарну заміну файлу й best-effort відновлення в разі збою

## Примітки щодо сумісності з legacy auth

Для статичних облікових даних runtime більше не залежить від legacy auth storage у відкритому тексті.

- Джерелом облікових даних runtime є розв’язаний snapshot у пам’яті.
- Застарілі статичні записи `api_key` очищаються, щойно їх виявлено.
- Поведінка сумісності, пов’язана з OAuth, лишається окремою.

## Примітка щодо Web UI

Деякі union-и SecretInput простіше налаштовувати в режимі raw editor, ніж у form mode.

## Пов’язана документація

- Команди CLI: [secrets](/uk/cli/secrets)
- Деталі контракту плану: [Secrets Apply Plan Contract](/uk/gateway/secrets-plan-contract)
- Поверхня облікових даних: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- Налаштування auth: [Authentication](/uk/gateway/authentication)
- Позиція безпеки: [Security](/uk/gateway/security)
- Precedence змінних середовища: [Environment Variables](/uk/help/environment)
