---
read_when:
    - Налаштування SecretRefs для облікових даних провайдера та посилань `auth-profiles.json`
    - Безпечне перезавантаження, аудит, налаштування та застосування секретів у виробничому середовищі
    - Розуміння швидкого завершення з помилкою під час запуску, фільтрації неактивних поверхонь і поведінки останнього відомого справного стану
sidebarTitle: Secrets management
summary: 'Керування секретами: контракт SecretRef, поведінка знімка під час виконання та безпечне одностороннє очищення'
title: Керування секретами
x-i18n:
    generated_at: "2026-04-28T11:14:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw підтримує адитивні SecretRefs, тож підтримувані облікові дані не потрібно зберігати як відкритий текст у конфігурації.

<Note>
Відкритий текст усе ще працює. SecretRefs вмикаються окремо для кожних облікових даних.
</Note>

## Цілі та модель виконання

Секрети розв’язуються в runtime-знімок у пам’яті.

- Розв’язання виконується завчасно під час активації, а не ліниво на шляхах запитів.
- Запуск швидко завершується помилкою, коли фактично активний SecretRef неможливо розв’язати.
- Перезавантаження використовує атомарну заміну: повний успіх або збереження останнього відомого справного знімка.
- Порушення політики SecretRef (наприклад, профілі автентифікації в режимі OAuth у поєднанні з введенням SecretRef) зупиняють активацію до заміни runtime.
- Runtime-запити читають лише з активного знімка в пам’яті.
- Після першої успішної активації/завантаження конфігурації runtime-шляхи коду продовжують читати цей активний знімок у пам’яті, доки успішне перезавантаження не замінить його.
- Шляхи вихідної доставки також читають із цього активного знімка (наприклад, доставка відповідей/гілок Discord і надсилання дій Telegram); вони не розв’язують SecretRefs повторно під час кожного надсилання.

Це прибирає збої постачальників секретів із гарячих шляхів запитів.

## Фільтрація активної поверхні

SecretRefs перевіряються лише на фактично активних поверхнях.

- Увімкнені поверхні: нерозв’язані refs блокують запуск/перезавантаження.
- Неактивні поверхні: нерозв’язані refs не блокують запуск/перезавантаження.
- Неактивні refs створюють нефатальні діагностичні повідомлення з кодом `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - Вимкнені записи каналів/облікових записів.
    - Облікові дані каналу верхнього рівня, які не успадковує жоден увімкнений обліковий запис.
    - Вимкнені поверхні інструментів/функцій.
    - Ключі, специфічні для постачальника вебпошуку, які не вибрані через `tools.web.search.provider`. В автоматичному режимі (постачальник не заданий) ключі перевіряються за пріоритетом для автоматичного визначення постачальника, доки один не буде розв’язано. Після вибору ключі невибраних постачальників вважаються неактивними, доки їх не виберуть.
    - Матеріал автентифікації SSH для sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, а також перевизначення для окремих агентів) активний лише тоді, коли ефективний backend sandbox дорівнює `ssh` для стандартного агента або увімкненого агента.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` активні, якщо виконується одна з цих умов:
      - `gateway.mode=remote`
      - налаштовано `gateway.remote.url`
      - `gateway.tailscale.mode` дорівнює `serve` або `funnel`
      - У локальному режимі без цих віддалених поверхонь:
        - `gateway.remote.token` активний, коли автентифікація токеном може мати пріоритет і не налаштовано env/auth токен.
        - `gateway.remote.password` активний лише тоді, коли автентифікація паролем може мати пріоритет і не налаштовано env/auth пароль.
    - SecretRef `gateway.auth.token` неактивний для розв’язання автентифікації під час запуску, коли задано `OPENCLAW_GATEWAY_TOKEN`, бо введення токена з env має пріоритет для цього runtime.

  </Accordion>
</AccordionGroup>

## Діагностика поверхні автентифікації Gateway

Коли SecretRef налаштовано в `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` або `gateway.remote.password`, запуск/перезавантаження Gateway явно записує стан поверхні в журнал:

- `active`: SecretRef є частиною ефективної поверхні автентифікації та має бути розв’язаний.
- `inactive`: SecretRef ігнорується для цього runtime, бо інша поверхня автентифікації має пріоритет або віддалена автентифікація вимкнена/неактивна.

Ці записи журналюються з `SECRETS_GATEWAY_AUTH_SURFACE` і містять причину, використану політикою активної поверхні, тож можна побачити, чому облікові дані були визнані активними або неактивними.

## Попередня перевірка посилань під час онбордингу

Коли онбординг працює в інтерактивному режимі й ви вибираєте зберігання SecretRef, OpenClaw виконує попередню перевірку перед збереженням:

- Env refs: перевіряє назву env-змінної та підтверджує, що непорожнє значення видиме під час налаштування.
- Provider refs (`file` або `exec`): перевіряє вибір постачальника, розв’язує `id` і перевіряє тип розв’язаного значення.
- Шлях повторного використання quickstart: коли `gateway.auth.token` уже є SecretRef, онбординг розв’язує його перед bootstrap probe/dashboard (для refs `env`, `file` і `exec`) за допомогою того самого fail-fast gate.

Якщо перевірка не проходить, онбординг показує помилку й дозволяє повторити спробу.

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
    - Екранування RFC6901 у сегментах: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Перевірка:

    - `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
    - `id` має відповідати `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` не має містити `.` або `..` як сегменти шляху, розділені скісними рисками (наприклад, `a/../b` відхиляється)

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
        mode: "json", // or "singleValue"
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
  <Accordion title="Env provider">
    - Необов’язковий allowlist через `allowlist`.
    - Відсутні/порожні env-значення призводять до помилки розв’язання.

  </Accordion>
  <Accordion title="File provider">
    - Читає локальний файл із `path`.
    - `mode: "json"` очікує JSON-об’єкт як payload і розв’язує `id` як pointer.
    - `mode: "singleValue"` очікує ref id `"value"` і повертає вміст файлу.
    - Шлях має пройти перевірки власника/дозволів.
    - Примітка про fail-closed у Windows: якщо перевірка ACL недоступна для шляху, розв’язання завершується помилкою. Лише для довірених шляхів задайте `allowInsecurePath: true` для цього постачальника, щоб обійти перевірки безпеки шляху.

  </Accordion>
  <Accordion title="Exec provider">
    - Запускає налаштований абсолютний шлях до binary без shell.
    - За замовчуванням `command` має вказувати на звичайний файл (не symlink).
    - Задайте `allowSymlinkCommand: true`, щоб дозволити symlink-шляхи команд (наприклад, Homebrew shims). OpenClaw перевіряє розв’язаний цільовий шлях.
    - Поєднуйте `allowSymlinkCommand` із `trustedDirs` для шляхів package manager (наприклад, `["/opt/homebrew"]`).
    - Підтримує timeout, timeout без виводу, обмеження байтів виводу, env allowlist і довірені каталоги.
    - Примітка про fail-closed у Windows: якщо перевірка ACL недоступна для шляху команди, розв’язання завершується помилкою. Лише для довірених шляхів задайте `allowInsecurePath: true` для цього постачальника, щоб обійти перевірки безпеки шляху.

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

  </Accordion>
</AccordionGroup>

## Приклади інтеграції exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

## Змінні середовища MCP server

Env vars MCP server, налаштовані через `plugins.entries.acpx.config.mcpServers`, підтримують SecretInput. Це тримає API keys і токени поза конфігурацією у відкритому тексті:

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

Рядкові значення у відкритому тексті все ще працюють. Env-template refs на кшталт `${MCP_SERVER_API_KEY}` і об’єкти SecretRef розв’язуються під час активації Gateway перед запуском процесу MCP server. Як і з іншими поверхнями SecretRef, нерозв’язані refs блокують активацію лише тоді, коли plugin `acpx` фактично активний.

## Матеріал автентифікації SSH для sandbox

Core backend sandbox `ssh` також підтримує SecretRefs для матеріалу автентифікації SSH:

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

Поведінка runtime:

- OpenClaw розв’язує ці refs під час активації пісочниці, а не ліниво під час кожного SSH-виклику.
- Розв’язані значення записуються в тимчасові файли з обмежувальними дозволами та використовуються у згенерованій SSH-конфігурації.
- Якщо ефективний бекенд пісочниці не `ssh`, ці refs залишаються неактивними й не блокують запуск.

## Підтримувана поверхня облікових даних

Канонічні підтримувані й непідтримувані облікові дані наведено тут:

- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)

<Note>
Облікові дані, створені під час виконання або ротаційні, а також матеріал оновлення OAuth навмисно виключено з розв’язання SecretRef лише для читання.
</Note>

## Обов’язкова поведінка та пріоритет

- Поле без ref: без змін.
- Поле з ref: обов’язкове на активних поверхнях під час активації.
- Якщо наявні і відкритий текст, і ref, ref має пріоритет на підтримуваних шляхах пріоритету.
- Маркер редагування `__OPENCLAW_REDACTED__` зарезервовано для внутрішнього редагування/відновлення конфігурації, і його відхиляють як буквальні надіслані конфігураційні дані.

Сигнали попереджень і аудиту:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (попередження під час виконання)
- `REF_SHADOWED` (аудиторська знахідка, коли облікові дані `auth-profiles.json` мають пріоритет над refs з `openclaw.json`)

Поведінка сумісності Google Chat:

- `serviceAccountRef` має пріоритет над відкритотекстовим `serviceAccount`.
- Відкритотекстове значення ігнорується, коли встановлено сусідній ref.

## Тригери активації

Активація секретів запускається під час:

- Запуску (preflight плюс фінальна активація)
- Шляху гарячого застосування перезавантаження конфігурації
- Шляху перевірки перезапуску під час перезавантаження конфігурації
- Ручного перезавантаження через `secrets.reload`
- Preflight для RPC запису Gateway-конфігурації (`config.set` / `config.apply` / `config.patch`) щодо розв’язності SecretRef активної поверхні в надісланому конфігураційному payload перед збереженням змін

Контракт активації:

- Успіх атомарно замінює snapshot.
- Помилка запуску перериває запуск gateway.
- Помилка перезавантаження під час виконання зберігає останній відомий справний snapshot.
- Помилка preflight для write-RPC відхиляє надіслану конфігурацію та залишає як дискову конфігурацію, так і активний runtime snapshot без змін.
- Надання явного токена каналу для окремого виклику outbound helper/tool не запускає активацію SecretRef; точками активації залишаються запуск, перезавантаження та явний `secrets.reload`.

## Сигнали погіршення та відновлення

Коли активація під час перезавантаження завершується невдало після справного стану, OpenClaw переходить у погіршений стан секретів.

Одноразова системна подія та коди журналу:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Поведінка:

- Погіршений стан: runtime зберігає останній відомий справний snapshot.
- Відновлено: надсилається один раз після наступної успішної активації.
- Повторні помилки, коли система вже в погіршеному стані, журналюють попередження, але не засмічують події.
- Startup fail-fast не надсилає події погіршення, бо runtime ніколи не ставав активним.

## Розв’язання шляхів команд

Шляхи команд можуть увімкнути підтримуване розв’язання SecretRef через snapshot RPC Gateway.

Є дві широкі моделі поведінки:

<Tabs>
  <Tab title="Strict command paths">
    Наприклад, шляхи remote-memory `openclaw memory` і `openclaw qr --remote`, коли йому потрібні refs віддаленого спільного секрету. Вони читають з активного snapshot і швидко завершуються з помилкою, коли потрібний SecretRef недоступний.
  </Tab>
  <Tab title="Read-only command paths">
    Наприклад, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` і потоки doctor/config repair лише для читання. Вони також віддають перевагу активному snapshot, але деградують замість аварійного завершення, коли цільовий SecretRef недоступний у цьому шляху команди.

    Поведінка лише для читання:

    - Коли gateway працює, ці команди спочатку читають з активного snapshot.
    - Якщо gateway-розв’язання неповне або gateway недоступний, вони пробують цільовий локальний fallback для конкретної поверхні команди.
    - Якщо цільовий SecretRef усе ще недоступний, команда продовжує роботу з погіршеним виводом лише для читання та явною діагностикою, як-от "configured but unavailable in this command path".
    - Ця погіршена поведінка є локальною лише для команди. Вона не послаблює шляхи runtime startup, reload або send/auth.

  </Tab>
</Tabs>

Інші нотатки:

- Оновлення snapshot після ротації секрету бекенда обробляється через `openclaw secrets reload`.
- Метод Gateway RPC, який використовують ці шляхи команд: `secrets.resolve`.

## Робочий процес аудиту та налаштування

Типовий потік оператора:

<Steps>
  <Step title="Audit current state">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configure SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Re-audit">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Знахідки включають:

    - відкритотекстові значення у стані спокою (`openclaw.json`, `auth-profiles.json`, `.env` і згенеровані `agents/*/agent/models.json`)
    - залишки чутливих заголовків провайдера у відкритому тексті в згенерованих записах `models.json`
    - нерозв’язані refs
    - затінення пріоритету (`auth-profiles.json` має пріоритет над refs з `openclaw.json`)
    - застарілі залишки (`auth.json`, нагадування OAuth)

    Примітка щодо exec:

    - За замовчуванням audit пропускає перевірки розв’язності exec SecretRef, щоб уникнути побічних ефектів команд.
    - Використовуйте `openclaw secrets audit --allow-exec`, щоб виконувати exec-провайдери під час аудиту.

    Примітка щодо залишків заголовків:

    - Виявлення чутливих заголовків провайдера базується на евристиках назв (поширені назви й фрагменти auth/credential-заголовків, як-от `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Інтерактивний helper, який:

    - спочатку налаштовує `secrets.providers` (`env`/`file`/`exec`, додати/редагувати/видалити)
    - дає змогу вибрати підтримувані поля, що містять секрети, в `openclaw.json` плюс `auth-profiles.json` для однієї області agent
    - може створити нове зіставлення `auth-profiles.json` безпосередньо в target picker
    - збирає деталі SecretRef (`source`, `provider`, `id`)
    - запускає preflight-розв’язання
    - може застосувати зміни негайно

    Примітка щодо exec:

    - Preflight пропускає перевірки exec SecretRef, якщо не встановлено `--allow-exec`.
    - Якщо ви застосовуєте безпосередньо з `configure --apply` і план містить exec refs/providers, залиште `--allow-exec` встановленим і для кроку застосування.

    Корисні режими:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Типові параметри застосування `configure`:

    - очищати відповідні статичні облікові дані з `auth-profiles.json` для цільових провайдерів
    - очищати застарілі статичні записи `api_key` з `auth.json`
    - очищати відповідні відомі рядки секретів з `<config-dir>/.env`

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

    - dry-run пропускає exec-перевірки, якщо не встановлено `--allow-exec`.
    - режим запису відхиляє плани, що містять exec SecretRefs/providers, якщо не встановлено `--allow-exec`.

    Докладні відомості про строгий контракт target/path і точні правила відхилення див. у [Контракті плану застосування секретів](/uk/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Одностороння політика безпеки

<Warning>
OpenClaw навмисно не записує rollback-резервні копії, що містять історичні відкритотекстові значення секретів.
</Warning>

Модель безпеки:

- preflight має завершитися успішно перед режимом запису
- runtime-активація перевіряється перед commit
- apply оновлює файли за допомогою атомарної заміни файлів і best-effort restore у разі помилки

## Нотатки щодо сумісності застарілої автентифікації

Для статичних облікових даних runtime більше не залежить від застарілого відкритотекстового сховища auth.

- Джерелом runtime-облікових даних є розв’язаний in-memory snapshot.
- Застарілі статичні записи `api_key` очищаються, коли їх виявлено.
- Поведінка сумісності, пов’язана з OAuth, залишається окремою.

## Нотатка Web UI

Деякі об’єднання SecretInput легше налаштовувати в режимі raw editor, ніж у form mode.

## Пов’язане

- [Автентифікація](/uk/gateway/authentication) — налаштування auth
- [CLI: secrets](/uk/cli/secrets) — CLI-команди
- [Змінні середовища](/uk/help/environment) — пріоритет середовища
- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface) — поверхня облікових даних
- [Контракт плану застосування секретів](/uk/gateway/secrets-plan-contract) — подробиці контракту плану
- [Безпека](/uk/gateway/security) — позиція безпеки
