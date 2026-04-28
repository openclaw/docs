---
read_when:
    - Налаштування SecretRef для облікових даних провайдера та посилань `auth-profiles.json`
    - Безпечне використання в продакшні перезавантаження, аудиту, налаштування та застосування секретів
    - Розуміння fail-fast під час запуску, фільтрації неактивних поверхонь і поведінки останньої відомої коректної конфігурації
sidebarTitle: Secrets management
summary: 'Керування секретами: контракт SecretRef, поведінка знімка середовища виконання та безпечне одностороннє очищення'
title: Керування секретами
x-i18n:
    generated_at: "2026-04-26T07:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw підтримує адитивні SecretRef, щоб підтримувані облікові дані не потрібно було зберігати у відкритому вигляді в конфігурації.

<Note>
Відкритий текст усе ще працює. SecretRef вмикаються окремо для кожного облікового запису.
</Note>

## Цілі та модель середовища виконання

Секрети перетворюються на знімок середовища виконання в пам’яті.

- Розв’язання відбувається eagerly під час активації, а не ліниво в шляхах запитів.
- Запуск завершується fail-fast, якщо ефективно активний SecretRef не вдається розв’язати.
- Перезавантаження використовує атомарну заміну: або повний успіх, або зберігається останній відомий коректний знімок.
- Порушення політики SecretRef (наприклад, профілі автентифікації в режимі OAuth у поєднанні з введенням SecretRef) завершують активацію помилкою до заміни середовища виконання.
- Запити середовища виконання читають лише з активного знімка в пам’яті.
- Після першої успішної активації/завантаження конфігурації шляхи коду середовища виконання продовжують читати цей активний знімок у пам’яті, доки успішне перезавантаження не замінить його.
- Шляхи вихідної доставки також читають із цього активного знімка (наприклад, доставка відповідей/тредів Discord і надсилання дій Telegram); вони не виконують повторне розв’язання SecretRef для кожного надсилання.

Це прибирає збої постачальника секретів із гарячих шляхів запитів.

## Фільтрація активних поверхонь

SecretRef перевіряються лише на ефективно активних поверхнях.

- Увімкнені поверхні: нерозв’язані посилання блокують запуск/перезавантаження.
- Неактивні поверхні: нерозв’язані посилання не блокують запуск/перезавантаження.
- Неактивні посилання генерують нефатальні діагностичні повідомлення з кодом `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Приклади неактивних поверхонь">
    - Вимкнені записи каналів/облікових записів.
    - Облікові дані каналу верхнього рівня, які не успадковує жодний увімкнений обліковий запис.
    - Вимкнені поверхні інструментів/можливостей.
    - Ключі, специфічні для постачальника вебпошуку, які не вибрані через `tools.web.search.provider`. У режимі auto (постачальник не заданий) ключі перевіряються за пріоритетом для автовизначення постачальника, доки один не буде розв’язано. Після вибору ключі невибраних постачальників вважаються неактивними, доки не будуть вибрані.
    - Матеріали SSH-автентифікації sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, а також перевизначення для окремих агентів) активні лише тоді, коли ефективний backend sandbox — `ssh` для типового агента або увімкненого агента.
    - SecretRef `gateway.remote.token` / `gateway.remote.password` активні, якщо виконується одна з умов:
      - `gateway.mode=remote`
      - налаштовано `gateway.remote.url`
      - `gateway.tailscale.mode` має значення `serve` або `funnel`
      - У локальному режимі без цих віддалених поверхонь:
        - `gateway.remote.token` активний, коли може перемогти автентифікація токеном і не налаштовано env/auth токен.
        - `gateway.remote.password` активний лише тоді, коли може перемогти автентифікація паролем і не налаштовано env/auth пароль.
    - SecretRef `gateway.auth.token` неактивний для розв’язання автентифікації під час запуску, коли задано `OPENCLAW_GATEWAY_TOKEN`, оскільки для цього середовища виконання перевагу має вхід із env-токена.

  </Accordion>
</AccordionGroup>

## Діагностика поверхні автентифікації Gateway

Коли SecretRef налаштовано для `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` або `gateway.remote.password`, запуск/перезавантаження Gateway явно журналює стан поверхні:

- `active`: SecretRef є частиною ефективної поверхні автентифікації та має бути розв’язаний.
- `inactive`: SecretRef ігнорується для цього середовища виконання, оскільки перемагає інша поверхня автентифікації або тому, що віддалену автентифікацію вимкнено/вона неактивна.

Ці записи журналюються з `SECRETS_GATEWAY_AUTH_SURFACE` і містять причину, яку використала політика активної поверхні, щоб ви могли бачити, чому облікові дані було розцінено як активні або неактивні.

## Попередня перевірка посилань під час onboarding

Коли onboarding працює в інтерактивному режимі й ви вибираєте зберігання SecretRef, OpenClaw виконує попередню перевірку перед збереженням:

- Посилання env: перевіряє ім’я змінної env і підтверджує, що під час налаштування видно непорожнє значення.
- Посилання постачальника (`file` або `exec`): перевіряє вибір постачальника, розв’язує `id` і перевіряє тип розв’язаного значення.
- Шлях повторного використання quickstart: коли `gateway.auth.token` уже є SecretRef, onboarding розв’язує його перед ініціалізацією probe/dashboard (для посилань `env`, `file` і `exec`) з використанням того самого fail-fast бар’єра.

Якщо перевірка не вдається, onboarding показує помилку й дає змогу повторити спробу.

## Контракт SecretRef

Використовуйте одну форму об’єкта всюди:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Перевірка:

    - `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
    - `id` має відповідати `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Перевірка:

    - `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
    - `id` має бути абсолютним JSON pointer (`/...`)
    - екранування RFC6901 у сегментах: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Перевірка:

    - `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
    - `id` має відповідати `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` не має містити `.` або `..` як сегменти шляху, розділені `/` (наприклад, `a/../b` відхиляється)

  </Tab>
</Tabs>

## Конфігурація постачальника

Визначайте постачальників у `secrets.providers`:

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

<AccordionGroup>
  <Accordion title="Постачальник env">
    - Необов’язковий allowlist через `allowlist`.
    - Відсутні/порожні значення env призводять до помилки розв’язання.

  </Accordion>
  <Accordion title="Постачальник file">
    - Читає локальний файл із `path`.
    - `mode: "json"` очікує корисне навантаження JSON-об’єкта та розв’язує `id` як pointer.
    - `mode: "singleValue"` очікує id посилання `"value"` і повертає вміст файлу.
    - Шлях має проходити перевірки власника/дозволів.
    - Примітка про fail-closed у Windows: якщо перевірка ACL недоступна для шляху, розв’язання завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` у цього постачальника, щоб обійти перевірки безпеки шляху.

  </Accordion>
  <Accordion title="Постачальник exec">
    - Запускає налаштований абсолютний шлях до бінарного файла, без shell.
    - За замовчуванням `command` має вказувати на звичайний файл (не symlink).
    - Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи команд через symlink (наприклад, шими Homebrew). OpenClaw перевіряє розв’язаний цільовий шлях.
    - Поєднуйте `allowSymlinkCommand` із `trustedDirs` для шляхів менеджера пакетів (наприклад, `["/opt/homebrew"]`).
    - Підтримує timeout, timeout без виводу, обмеження байтів виводу, allowlist env і trusted dirs.
    - Примітка про fail-closed у Windows: якщо перевірка ACL недоступна для шляху команди, розв’язання завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` у цього постачальника, щоб обійти перевірки безпеки шляху.

    Корисне навантаження запиту (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Корисне навантаження відповіді (stdout):

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

  </Accordion>
</AccordionGroup>

## Приклади інтеграції exec

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // обов’язково для бінарних файлів Homebrew через symlink
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
  </Accordion>
  <Accordion title="CLI HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // обов’язково для бінарних файлів Homebrew через symlink
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
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // обов’язково для бінарних файлів Homebrew через symlink
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
  </Accordion>
</AccordionGroup>

## Змінні середовища MCP-сервера

Змінні env MCP-сервера, налаштовані через `plugins.entries.acpx.config.mcpServers`, підтримують SecretInput. Це дозволяє не зберігати API-ключі та токени у відкритому вигляді в конфігурації:

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

Рядкові значення у відкритому вигляді все ще працюють. Посилання env-template на кшталт `${MCP_SERVER_API_KEY}` і об’єкти SecretRef розв’язуються під час активації Gateway до породження процесу MCP-сервера. Як і з іншими поверхнями SecretRef, нерозв’язані посилання блокують активацію лише тоді, коли Plugin `acpx` є ефективно активним.

## Матеріали SSH-автентифікації sandbox

Базовий backend sandbox `ssh` також підтримує SecretRef для матеріалів SSH-автентифікації:

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

Поведінка середовища виконання:

- OpenClaw розв’язує ці посилання під час активації sandbox, а не ліниво під час кожного SSH-виклику.
- Розв’язані значення записуються в тимчасові файли з обмежувальними дозволами й використовуються в згенерованій конфігурації SSH.
- Якщо ефективний backend sandbox не `ssh`, ці посилання залишаються неактивними й не блокують запуск.

## Підтримувана поверхня облікових даних

Канонічний список підтримуваних і непідтримуваних облікових даних наведено тут:

- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)

<Note>
Облікові дані, що створюються під час виконання або обертаються, а також матеріали OAuth refresh навмисно виключені з read-only розв’язання SecretRef.
</Note>

## Обов’язкова поведінка та пріоритет

- Поле без посилання: без змін.
- Поле з посиланням: обов’язкове на активних поверхнях під час активації.
- Якщо присутні і відкритий текст, і посилання, на підтримуваних шляхах пріоритету перевагу має посилання.
- Сентинел редагування `__OPENCLAW_REDACTED__` зарезервований для внутрішнього редагування/відновлення конфігурації й відхиляється як буквально подані дані конфігурації.

Попередження та сигнали аудиту:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (попередження середовища виконання)
- `REF_SHADOWED` (знахідка аудиту, коли облікові дані `auth-profiles.json` мають пріоритет над посиланнями `openclaw.json`)

Поведінка сумісності Google Chat:

- `serviceAccountRef` має пріоритет над відкритим текстом `serviceAccount`.
- Значення відкритого тексту ігнорується, коли задано сусіднє посилання.

## Тригери активації

Активація секретів виконується під час:

- Запуску (preflight плюс фінальна активація)
- Шляху hot-apply перезавантаження конфігурації
- Шляху restart-check перезавантаження конфігурації
- Ручного перезавантаження через `secrets.reload`
- preflight RPC запису конфігурації Gateway (`config.set` / `config.apply` / `config.patch`) для можливості розв’язання SecretRef на активних поверхнях у межах поданого корисного навантаження конфігурації до збереження змін

Контракт активації:

- Успіх атомарно замінює знімок.
- Помилка запуску перериває запуск gateway.
- Помилка перезавантаження під час виконання зберігає останній відомий коректний знімок.
- Помилка preflight Write-RPC відхиляє подану конфігурацію й залишає без змін як конфігурацію на диску, так і активний знімок середовища виконання.
- Надання явного токена каналу для окремого виклику допоміжного засобу/інструмента вихідної взаємодії не запускає активацію SecretRef; точками активації залишаються запуск, перезавантаження та явний `secrets.reload`.

## Сигнали деградації та відновлення

Коли активація під час перезавантаження завершується помилкою після коректного стану, OpenClaw переходить у деградований стан секретів.

Коди одноразових системних подій і журналів:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Поведінка:

- Деградований стан: середовище виконання зберігає останній відомий коректний знімок.
- Відновлений стан: генерується один раз після наступної успішної активації.
- Повторні збої, коли система вже деградована, журналюють попередження, але не засипають подіями.
- fail-fast під час запуску не генерує подій деградації, оскільки середовище виконання так і не стало активним.

## Розв’язання в шляхах команд

Шляхи команд можуть увімкнути підтримуване розв’язання SecretRef через snapshot RPC gateway.

Є дві широкі моделі поведінки:

<Tabs>
  <Tab title="Строгі шляхи команд">
    Наприклад, шляхи віддаленої пам’яті `openclaw memory` і `openclaw qr --remote`, коли їм потрібні посилання на віддалені спільні секрети. Вони читають з активного знімка й завершуються fail-fast, коли потрібний SecretRef недоступний.
  </Tab>
  <Tab title="Read-only шляхи команд">
    Наприклад, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` і read-only потоки doctor/config repair. Вони також надають перевагу активному знімку, але деградують замість переривання, коли цільовий SecretRef недоступний у цьому шляху команди.

    Поведінка read-only:

    - Коли gateway запущений, ці команди спочатку читають з активного знімка.
    - Якщо розв’язання gateway неповне або gateway недоступний, вони намагаються виконати цільовий локальний fallback для конкретної поверхні команди.
    - Якщо цільовий SecretRef усе ще недоступний, команда продовжується з деградованим read-only виведенням і явною діагностикою, наприклад «налаштовано, але недоступно в цьому шляху команди».
    - Ця деградована поведінка є лише локальною для команди. Вона не послаблює шляхи запуску, перезавантаження чи надсилання/автентифікації середовища виконання.

  </Tab>
</Tabs>

Інші примітки:

- Оновлення знімка після ротації секрету в backend виконується через `openclaw secrets reload`.
- Метод Gateway RPC, який використовують ці шляхи команд: `secrets.resolve`.

## Робочий процес аудиту й налаштування

Типовий операторський потік:

<Steps>
  <Step title="Аудит поточного стану">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Налаштування SecretRef">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Повторний аудит">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Знахідки включають:

    - значення відкритого тексту at rest (`openclaw.json`, `auth-profiles.json`, `.env` і згенерований `agents/*/agent/models.json`)
    - залишки чутливих заголовків постачальників у відкритому вигляді в згенерованих записах `models.json`
    - нерозв’язані посилання
    - затінення пріоритету (`auth-profiles.json` має пріоритет над посиланнями `openclaw.json`)
    - застарілі залишки (`auth.json`, нагадування OAuth)

    Примітка щодо exec:

    - За замовчуванням аудит пропускає перевірки можливості розв’язання exec SecretRef, щоб уникати побічних ефектів команди.
    - Використовуйте `openclaw secrets audit --allow-exec`, щоб виконувати постачальників exec під час аудиту.

    Примітка щодо залишків заголовків:

    - Виявлення чутливих заголовків постачальників базується на евристиці назв (поширені назви й фрагменти заголовків автентифікації/облікових даних, як-от `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Інтерактивний помічник, який:

    - спочатку налаштовує `secrets.providers` (`env`/`file`/`exec`, додавання/редагування/видалення)
    - дозволяє вибирати підтримувані поля, що містять секрети, у `openclaw.json` плюс `auth-profiles.json` для однієї області агента
    - може створити нове зіставлення `auth-profiles.json` безпосередньо в засобі вибору цілі
    - збирає деталі SecretRef (`source`, `provider`, `id`)
    - виконує preflight-розв’язання
    - може застосувати зміни негайно

    Примітка щодо exec:

    - Preflight пропускає перевірки exec SecretRef, якщо не задано `--allow-exec`.
    - Якщо ви застосовуєте зміни безпосередньо з `configure --apply`, і план містить exec-посилання/постачальників, залиште `--allow-exec` також увімкненим для етапу застосування.

    Корисні режими:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Типові параметри apply у `configure`:

    - очищує відповідні статичні облікові дані з `auth-profiles.json` для цільових постачальників
    - очищує застарілі статичні записи `api_key` з `auth.json`
    - очищує відповідні відомі рядки секретів із `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Застосувати збережений план:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Примітка щодо exec:

    - dry-run пропускає перевірки exec, якщо не задано `--allow-exec`.
    - режим запису відхиляє плани, що містять exec SecretRef/постачальників, якщо не задано `--allow-exec`.

    Докладні відомості про строгий контракт цілі/шляху й точні правила відхилення див. у [Контракт плану застосування секретів](/uk/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Політика односторонньої безпеки

<Warning>
OpenClaw навмисно не записує резервні копії для відкату, які містять історичні значення секретів у відкритому вигляді.
</Warning>

Модель безпеки:

- preflight має завершитися успішно перед режимом запису
- активація середовища виконання перевіряється до коміту
- apply оновлює файли за допомогою атомарної заміни файлів і відновлення best-effort у разі збою

## Примітки щодо сумісності зі застарілою автентифікацією

Для статичних облікових даних середовище виконання більше не залежить від застарілого зберігання автентифікації у відкритому вигляді.

- Джерело облікових даних середовища виконання — розв’язаний знімок у пам’яті.
- Застарілі статичні записи `api_key` очищуються при виявленні.
- Поведінка сумісності, пов’язана з OAuth, залишається окремою.

## Примітка щодо вебінтерфейсу

Деякі об’єднання SecretInput простіше налаштовувати в режимі raw editor, ніж у режимі форми.

## Пов’язане

- [Автентифікація](/uk/gateway/authentication) — налаштування автентифікації
- [CLI: secrets](/uk/cli/secrets) — команди CLI
- [Змінні середовища](/uk/help/environment) — пріоритет змінних середовища
- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface) — поверхня облікових даних
- [Контракт плану застосування секретів](/uk/gateway/secrets-plan-contract) — подробиці контракту плану
- [Безпека](/uk/gateway/security) — модель безпеки
