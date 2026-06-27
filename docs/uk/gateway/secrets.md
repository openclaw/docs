---
read_when:
    - Налаштування SecretRefs для облікових даних провайдера та `auth-profiles.json` посилань
    - Безпечне перезавантаження, аудит, налаштування й застосування операційних секретів у production
    - Розуміння швидкого збою під час запуску, фільтрації неактивних поверхонь і поведінки останньої відомої справної конфігурації
sidebarTitle: Secrets management
summary: 'Керування секретами: контракт SecretRef, поведінка знімка середовища виконання та безпечне одностороннє очищення'
title: Керування секретами
x-i18n:
    generated_at: "2026-06-27T17:36:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw підтримує адитивні SecretRefs, щоб підтримувані облікові дані не потрібно було зберігати як відкритий текст у конфігурації.

<Note>
Відкритий текст усе ще працює. SecretRefs вмикаються окремо для кожного облікового даного.
</Note>

<Warning>
Облікові дані у відкритому тексті залишаються доступними для читання агентом, якщо вони зберігаються у файлах, які
агент може перевіряти, зокрема `openclaw.json`, `auth-profiles.json`, `.env` або
згенерованих файлах `agents/*/agent/models.json`. SecretRefs зменшують цей локальний радіус ураження
лише після міграції кожного підтримуваного облікового даного та коли
`openclaw secrets audit --check` не повідомляє про залишки секретів у відкритому тексті.
</Warning>

## Цілі та модель виконання

Секрети розв’язуються в знімок виконання в пам’яті.

- Розв’язання виконується завчасно під час активації, а не ліниво на шляхах запитів.
- Запуск швидко завершується з помилкою, коли фактично активний SecretRef не може бути розв’язаний.
- Перезавантаження використовує атомарну заміну: повний успіх або збереження останнього відомого справного знімка.
- Порушення політики SecretRef (наприклад, профілі автентифікації в режимі OAuth у поєднанні з введенням SecretRef) зупиняють активацію до заміни середовища виконання.
- Запити виконання читають лише з активного знімка в пам’яті.
- Після першої успішної активації/завантаження конфігурації шляхи коду виконання продовжують читати цей активний знімок у пам’яті, доки успішне перезавантаження не замінить його.
- Шляхи вихідної доставки також читають із цього активного знімка (наприклад, доставка відповідей/тредів Discord і надсилання дій Telegram); вони не розв’язують SecretRefs повторно під час кожного надсилання.

Це прибирає збої постачальника секретів із гарячих шляхів запитів.

## Межа доступу агента

SecretRefs захищають облікові дані від збереження в підтримуваній конфігурації та
згенерованих поверхнях моделей, але вони не є межею ізоляції процесу. Якщо
облікові дані у відкритому тексті залишаються на диску в шляху, який агент може читати, агент може
обійти редагування на рівні API, використовуючи файлові або shell-інструменти для перевірки цього файла.

Для виробничих розгортань, де файли, доступні агенту, входять у сферу ризику, вважайте
міграцію SecretRef завершеною лише тоді, коли виконуються всі ці умови:

- підтримувані облікові дані використовують SecretRefs замість значень у відкритому тексті
- застарілі залишки відкритого тексту очищено з `openclaw.json`,
  `auth-profiles.json`, `.env` і згенерованих файлів `models.json`
- `openclaw secrets audit --check` після міграції не виявляє проблем
- усі решта непідтримуваних або ротаційних облікових даних захищені ізоляцією
  операційної системи, ізоляцією контейнера або зовнішнім проксі облікових даних

Саме тому робочий процес audit/configure/apply є шлюзом міграції безпеки, а не
просто зручним помічником.

<Warning>
SecretRefs не роблять довільні читабельні файли безпечними. Резервні копії, скопійовані конфігурації,
старі згенеровані каталоги моделей і непідтримувані класи облікових даних слід вважати
виробничими секретами, доки їх не буде видалено, переміщено за межі довірчої межі
агента або захищено окремим шаром ізоляції.
</Warning>

## Фільтрація активної поверхні

SecretRefs перевіряються лише на фактично активних поверхнях.

- Увімкнені поверхні: нерозв’язані посилання блокують запуск/перезавантаження.
- Неактивні поверхні: нерозв’язані посилання не блокують запуск/перезавантаження.
- Неактивні посилання видають нефатальні діагностичні повідомлення з кодом `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Приклади неактивних поверхонь">
    - Вимкнені записи каналів/облікових записів.
    - Облікові дані каналу верхнього рівня, які не успадковує жоден увімкнений обліковий запис.
    - Вимкнені поверхні інструментів/функцій.
    - Ключі, специфічні для постачальника вебпошуку, які не вибрані через `tools.web.search.provider`. В автоматичному режимі (коли постачальника не задано) ключі перевіряються за пріоритетом для автоматичного виявлення постачальника, доки один із них не розв’яжеться. Після вибору ключі невибраних постачальників вважаються неактивними, доки їх не вибрано.
    - Матеріал автентифікації SSH для пісочниці (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, а також перевизначення для окремих агентів) активний лише тоді, коли ефективний бекенд пісочниці є `ssh` для агента за замовчуванням або увімкненого агента.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` активні, якщо виконується одна з цих умов:
      - `gateway.mode=remote`
      - налаштовано `gateway.remote.url`
      - `gateway.tailscale.mode` має значення `serve` або `funnel`
      - У локальному режимі без цих віддалених поверхонь:
        - `gateway.remote.token` активний, коли автентифікація токеном може перемогти й не налаштовано env/auth token.
        - `gateway.remote.password` активний лише тоді, коли автентифікація паролем може перемогти й не налаштовано env/auth password.
    - SecretRef `gateway.auth.token` неактивний для розв’язання автентифікації під час запуску, коли задано `OPENCLAW_GATEWAY_TOKEN`, оскільки введення токена з env перемагає для цього середовища виконання.

  </Accordion>
</AccordionGroup>

## Діагностика поверхні автентифікації Gateway

Коли SecretRef налаштовано на `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` або `gateway.remote.password`, запуск/перезавантаження gateway явно журналює стан поверхні:

- `active`: SecretRef є частиною ефективної поверхні автентифікації та має розв’язатися.
- `inactive`: SecretRef ігнорується для цього середовища виконання, тому що перемагає інша поверхня автентифікації або тому що віддалену автентифікацію вимкнено/не активовано.

Ці записи журналюються з `SECRETS_GATEWAY_AUTH_SURFACE` і містять причину, використану політикою активної поверхні, тож ви можете побачити, чому облікові дані вважалися активними або неактивними.

## Попередня перевірка посилань під час онбордингу

Коли онбординг запускається в інтерактивному режимі й ви вибираєте зберігання SecretRef, OpenClaw виконує попередню перевірку перед збереженням:

- Env refs: перевіряє ім’я змінної env і підтверджує, що непорожнє значення видиме під час налаштування.
- Provider refs (`file` або `exec`): перевіряє вибір постачальника, розв’язує `id` і перевіряє тип розв’язаного значення.
- Шлях повторного використання Quickstart: коли `gateway.auth.token` уже є SecretRef, онбординг розв’язує його перед bootstrap probe/dashboard (для посилань `env`, `file` і `exec`) за допомогою того самого fail-fast шлюзу.

Якщо перевірка не вдається, онбординг показує помилку й дає змогу повторити спробу.

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

    Підтримувані поля SecretInput також приймають точні рядкові скорочення:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Перевірка:

    - `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
    - `id` має відповідати `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (підтримує селектори, як-от `secret#json_key`)
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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
    - `mode: "json"` очікує payload JSON-об’єкта й розв’язує `id` як pointer.
    - `mode: "singleValue"` очікує ref id `"value"` і повертає вміст файла.
    - Шлях має пройти перевірки власника/дозволів.
    - Примітка про fail-closed у Windows: якщо перевірка ACL недоступна для шляху, розв’язання завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього постачальника, щоб обійти перевірки безпеки шляху.

  </Accordion>
  <Accordion title="Постачальник exec">
    - Запускає налаштований абсолютний шлях до binary, без shell.
    - За замовчуванням `command` має вказувати на звичайний файл (не symlink).
    - Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи команд symlink (наприклад, Homebrew shims). OpenClaw перевіряє розв’язаний цільовий шлях.
    - Поєднуйте `allowSymlinkCommand` із `trustedDirs` для шляхів package-manager (наприклад, `["/opt/homebrew"]`).
    - Підтримує timeout, no-output timeout, обмеження байтів виводу, allowlist env і довірені каталоги.
    - Примітка про fail-closed у Windows: якщо перевірка ACL недоступна для шляху команди, розв’язання завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього постачальника, щоб обійти перевірки безпеки шляху.
    - Керовані Plugin постачальники exec можуть використовувати `pluginIntegration` замість
      скопійованих `command`/`args`. OpenClaw розв’язує поточні деталі команди
      з маніфесту встановленого Plugin під час запуску/перезавантаження. Якщо Plugin
      вимкнено, видалено, він не є довіреним або більше не оголошує інтеграцію,
      активні SecretRefs, які використовують цього постачальника, fail closed.

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

## API-ключі на основі файлів

Не розміщуйте рядки `file:...` у блоці `env` конфігурації. Блок `env` є
літеральним і не перевизначає значення, тому `file:...` не розв’язується.

Натомість використовуйте файловий SecretRef у підтримуваному полі облікових даних:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Для `mode: "singleValue"` SecretRef `id` дорівнює `"value"`. Для
`mode: "json"` використовуйте абсолютний JSON pointer, наприклад
`"/providers/xai/apiKey"`.

Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface) для
полів конфігурації, які приймають SecretRefs.

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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Використовуйте обгортку резолвера, коли потрібно зіставити ідентифікатори SecretRef із ключами елементів Bitwarden
    Secrets Manager. Репозиторій містить
    `scripts/secrets/openclaw-bws-resolver.mjs`; установіть або скопіюйте його в абсолютний
    довірений шлях на хості, де працює Gateway.

    Вимоги:

    - Bitwarden Secrets Manager CLI (`bws`) установлено на хості Gateway.
    - `BWS_ACCESS_TOKEN` доступний службі Gateway.
    - `PATH` передано до резолвера, або `BWS_BIN` задано як абсолютний шлях до бінарного файлу
      `bws`.
    - `BWS_SERVER_URL` має бути задано в середовищі під час використання самостійно розгорнутого
      екземпляра Bitwarden.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Резолвер групує запитані ідентифікатори, запускає `bws secret list` і повертає
    значення для відповідних полів секрету `key`. Використовуйте ключі, що відповідають контракту ідентифікатора exec
    SecretRef, як-от `openclaw/providers/openai/apiKey`; ключі у стилі env-var
    з підкресленнями відхиляються до запуску резолвера. Якщо більше
    ніж один видимий секрет Bitwarden має той самий запитаний ключ, резолвер
    позначає цей ідентифікатор як неоднозначний замість вибору одного. Після оновлення конфігурації
    перевірте шлях резолвера:

    ```bash
    openclaw secrets audit --allow-exec
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
  <Accordion title="password-store (`pass`)">
    Використовуйте невелику обгортку резолвера, коли потрібно безпосередньо зіставити ідентифікатори SecretRef із
    записами `pass`. Збережіть її як виконуваний файл за абсолютним шляхом, який проходить
    перевірки шляхів вашого exec-провайдера, наприклад
    `/usr/local/bin/openclaw-pass-resolver`. Шебанг `#!/usr/bin/env node`
    знаходить `node` з `PATH` процесу резолвера, тому включіть `PATH` до
    `passEnv`. Якщо `pass` відсутній у цьому `PATH`, задайте `PASS_BIN` у батьківському
    середовищі та також включіть його до `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Потім налаштуйте exec-провайдер і вкажіть для `apiKey` шлях до запису `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Тримайте секрет у першому рядку запису `pass` або налаштуйте
    обгортку, якщо хочете натомість повертати повний вивід `pass show`. Після
    оновлення конфігурації перевірте як статичний аудит, так і шлях exec-резолвера:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

## Змінні середовища MCP-сервера

Змінні середовища MCP-сервера, налаштовані через `plugins.entries.acpx.config.mcpServers`, підтримують SecretInput. Це не дає API-ключам і токенам потрапляти в конфігурацію відкритим текстом:

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

Рядкові значення відкритим текстом і далі працюють. Посилання env-шаблонів на кшталт `${MCP_SERVER_API_KEY}` і об’єкти SecretRef розв’язуються під час активації Gateway до запуску процесу MCP-сервера. Як і з іншими поверхнями SecretRef, нерозв’язані посилання блокують активацію лише тоді, коли Plugin `acpx` фактично активний.

## Матеріал SSH-автентифікації sandbox

Основний бекенд sandbox `ssh` також підтримує SecretRefs для матеріалу SSH-автентифікації:

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

- OpenClaw розв’язує ці посилання під час активації sandbox, а не ліниво під час кожного SSH-виклику.
- Розв’язані значення записуються до тимчасових файлів з обмежувальними дозволами й використовуються у згенерованій SSH-конфігурації.
- Якщо ефективний бекенд sandbox не `ssh`, ці посилання залишаються неактивними й не блокують запуск.

## Підтримувана поверхня облікових даних

Канонічні підтримувані й непідтримувані облікові дані перелічено тут:

- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)

<Note>
Облікові дані, створені під час виконання або ротаційні, а також матеріал OAuth refresh навмисно виключено з розв’язання SecretRef лише для читання.
</Note>

## Обов’язкова поведінка та пріоритет

- Поле без посилання: без змін.
- Поле з посиланням: обов’язкове на активних поверхнях під час активації.
- Якщо присутні і відкритий текст, і посилання, посилання має пріоритет на підтримуваних шляхах пріоритету.
- Сентинел редагування `__OPENCLAW_REDACTED__` зарезервований для внутрішнього редагування/відновлення конфігурації та відхиляється як буквальні надіслані дані конфігурації.

Сигнали попереджень і аудиту:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (попередження під час виконання)
- `REF_SHADOWED` (знахідка аудиту, коли облікові дані `auth-profiles.json` мають пріоритет над посиланнями `openclaw.json`)

Поведінка сумісності Google Chat:

- `serviceAccountRef` має пріоритет над `serviceAccount` відкритим текстом.
- Значення відкритим текстом ігнорується, коли встановлено сусіднє посилання.

## Тригери активації

Активація секретів виконується під час:

- Запуску (попередня перевірка плюс остаточна активація)
- Шляху гарячого застосування перезавантаження конфігурації
- Шляху перевірки перезапуску після перезавантаження конфігурації
- Ручного перезавантаження через `secrets.reload`
- Попередньої перевірки Gateway config write RPC (`config.set` / `config.apply` / `config.patch`) для розв’язності SecretRef активної поверхні в надісланому конфігураційному payload до збереження змін

Контракт активації:

- Успіх атомарно замінює знімок.
- Помилка запуску перериває запуск Gateway.
- Помилка перезавантаження під час виконання зберігає останній відомий справний знімок.
- Помилка попередньої перевірки write-RPC відхиляє надіслану конфігурацію та залишає як конфігурацію на диску, так і активний знімок виконання без змін.
- Надання явного токена каналу для окремого виклику outbound helper/tool не запускає активацію SecretRef; точками активації залишаються запуск, перезавантаження та явний `secrets.reload`.

## Сигнали деградації та відновлення

Коли активація під час перезавантаження завершується помилкою після справного стану, OpenClaw переходить у деградований стан секретів.

Одноразова системна подія та коди журналу:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Поведінка:

- Деградований стан: середовище виконання зберігає останній відомий справний знімок.
- Відновлений стан: надсилається один раз після наступної успішної активації.
- Повторні помилки, коли стан уже деградований, записують попередження, але не спамлять подіями.
- Швидка відмова під час запуску не надсилає подій деградації, оскільки середовище виконання так і не стало активним.

## Розв’язання шляхів команд

Шляхи команд можуть увімкнути підтримуване розв’язання SecretRef через snapshot RPC Gateway.

Є дві широкі моделі поведінки:

<Tabs>
  <Tab title="Суворі шляхи команд">
    Наприклад, шляхи віддаленої пам’яті `openclaw memory` і `openclaw qr --remote`, коли потрібні віддалені посилання на спільний секрет. Вони читають з активного знімка й швидко завершуються з помилкою, якщо потрібний SecretRef недоступний.
  </Tab>
  <Tab title="Шляхи команд лише для читання">
    Наприклад, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, а також потоки doctor/config для відновлення лише для читання. Вони також віддають перевагу активному знімку, але переходять у деградований режим замість переривання, коли цільовий SecretRef недоступний у цьому шляху команди.

    Поведінка лише для читання:

    - Коли Gateway запущено, ці команди спершу читають з активного знімка.
    - Якщо розв’язання Gateway неповне або Gateway недоступний, вони пробують цільовий локальний резервний шлях для конкретної поверхні команди.
    - Якщо цільовий SecretRef усе ще недоступний, команда продовжує роботу з деградованим виводом лише для читання та явною діагностикою, наприклад "налаштовано, але недоступно в цьому шляху команди".
    - Така деградована поведінка є локальною лише для команди. Вона не послаблює запуск середовища виконання, перезавантаження або шляхи надсилання/автентифікації.

  </Tab>
</Tabs>

Інші примітки:

- Оновлення знімка після ротації секретів на бекенді обробляється командою `openclaw secrets reload`.
- Метод Gateway RPC, який використовують ці шляхи команд: `secrets.resolve`.

## Робочий процес аудиту й налаштування

Типовий потік оператора:

<Steps>
  <Step title="Перевірте поточний стан">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Налаштуйте й застосуйте SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Повторіть аудит">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Не вважайте міграцію завершеною, доки повторний аудит не буде чистим. Якщо аудит
досі повідомляє про відкриті текстові значення в стані спокою, ризик доступу агента
ще присутній, навіть коли API середовища виконання повертають редаговані значення.

Якщо ви зберігаєте план замість застосування під час `configure`, застосуйте цей збережений план
за допомогою `openclaw secrets apply --from <plan-path>` перед повторним аудитом.

<AccordionGroup>
  <Accordion title="secrets audit">
    Знахідки включають:

    - відкриті текстові значення в стані спокою (`openclaw.json`, `auth-profiles.json`, `.env` і згенеровані `agents/*/agent/models.json`)
    - залишки відкритих текстових чутливих заголовків провайдера в згенерованих записах `models.json`
    - нерозв’язані посилання
    - перекриття пріоритетів (`auth-profiles.json` має вищий пріоритет за посилання `openclaw.json`)
    - застарілі залишки (`auth.json`, нагадування OAuth)

    Примітка щодо exec:

    - За замовчуванням аудит пропускає перевірки розв’язуваності exec SecretRef, щоб уникнути побічних ефектів команд.
    - Використовуйте `openclaw secrets audit --allow-exec`, щоб виконувати exec-провайдери під час аудиту.

    Примітка щодо залишків заголовків:

    - Виявлення чутливих заголовків провайдера базується на евристиці назв (поширені назви заголовків автентифікації/облікових даних і фрагменти, як-от `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Інтерактивний помічник, який:

    - спершу налаштовує `secrets.providers` (`env`/`file`/`exec`, додавання/редагування/видалення)
    - дає змогу вибрати підтримувані поля із секретами в `openclaw.json` плюс `auth-profiles.json` для однієї області агента
    - може створити нове зіставлення `auth-profiles.json` безпосередньо у виборі цілі
    - збирає деталі SecretRef (`source`, `provider`, `id`)
    - запускає попереднє розв’язання
    - може застосувати зміни негайно

    Примітка щодо exec:

    - Попередня перевірка пропускає перевірки exec SecretRef, якщо не встановлено `--allow-exec`.
    - Якщо ви застосовуєте безпосередньо з `configure --apply` і план містить exec-посилання/провайдери, залиште `--allow-exec` увімкненим і для кроку застосування.

    Корисні режими:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Типові дії застосування `configure`:

    - очищати відповідні статичні облікові дані з `auth-profiles.json` для цільових провайдерів
    - очищати застарілі статичні записи `api_key` з `auth.json`
    - очищати відповідні відомі рядки секретів з `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Застосуйте збережений план:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Примітка щодо exec:

    - dry-run пропускає перевірки exec, якщо не встановлено `--allow-exec`.
    - режим запису відхиляє плани, що містять exec SecretRefs/провайдери, якщо не встановлено `--allow-exec`.

    Докладні відомості про суворий контракт цілі/шляху та точні правила відхилення див. у [Контракті плану застосування секретів](/uk/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Одностороння політика безпеки

<Warning>
OpenClaw навмисно не записує резервні копії відкату, що містять історичні відкриті текстові значення секретів.
</Warning>

Модель безпеки:

- попередня перевірка має успішно завершитися перед режимом запису
- активація середовища виконання перевіряється перед комітом
- apply оновлює файли за допомогою атомарної заміни файлів і відновлення за найкращих зусиль у разі збою

## Примітки щодо сумісності застарілої автентифікації

Для статичних облікових даних середовище виконання більше не залежить від застарілого сховища автентифікації у відкритому тексті.

- Джерелом облікових даних середовища виконання є розв’язаний знімок у пам’яті.
- Застарілі статичні записи `api_key` очищаються, коли їх виявлено.
- Поведінка сумісності, пов’язана з OAuth, залишається окремою.

## Примітка щодо вебінтерфейсу

Деякі об’єднання SecretInput легше налаштовувати в режимі сирого редактора, ніж у режимі форми.

## Пов’язане

- [Автентифікація](/uk/gateway/authentication) — налаштування автентифікації
- [CLI: secrets](/uk/cli/secrets) — команди CLI
- [Змінні середовища](/uk/help/environment) — пріоритет середовища
- [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface) — поверхня облікових даних
- [Контракт плану застосування секретів](/uk/gateway/secrets-plan-contract) — деталі контракту плану
- [Безпека](/uk/gateway/security) — стан безпеки
