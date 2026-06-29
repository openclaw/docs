---
read_when:
    - Настройка SecretRefs для учетных данных провайдера и ссылок `auth-profiles.json`
    - Безопасная перезагрузка, аудит, настройка и применение секретов в рабочей среде
    - Понимание быстрого отказа при запуске, фильтрации неактивных поверхностей и поведения последнего известного рабочего состояния
sidebarTitle: Secrets management
summary: 'Управление секретами: контракт SecretRef, поведение снимков runtime и безопасная однонаправленная очистка'
title: Управление секретами
x-i18n:
    generated_at: "2026-06-28T23:00:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw поддерживает аддитивные SecretRefs, поэтому поддерживаемые учетные данные не нужно хранить в конфигурации в виде открытого текста.

<Note>
Открытый текст по-прежнему работает. SecretRefs включаются отдельно для каждых учетных данных.
</Note>

<Warning>
Учетные данные в открытом тексте остаются доступными агенту для чтения, если они хранятся в файлах, которые
агент может просматривать, включая `openclaw.json`, `auth-profiles.json`, `.env` или
сгенерированные файлы `agents/*/agent/models.json`. SecretRefs уменьшают этот локальный радиус
поражения только после миграции всех поддерживаемых учетных данных и когда
`openclaw secrets audit --check` не сообщает об остатках секретов в открытом тексте.
</Warning>

## Цели и модель runtime

Секреты разрешаются в снимок runtime в памяти.

- Разрешение выполняется заранее во время активации, а не лениво на путях запросов.
- Запуск быстро завершается с ошибкой, когда фактически активный SecretRef не может быть разрешен.
- Перезагрузка использует атомарную замену: полный успех или сохранение последнего заведомо исправного снимка.
- Нарушения политики SecretRef (например, профили авторизации в режиме OAuth в сочетании с входными данными SecretRef) приводят к ошибке активации до замены runtime.
- Runtime-запросы читают только из активного снимка в памяти.
- После первой успешной активации/загрузки конфигурации пути кода runtime продолжают читать этот активный снимок в памяти, пока успешная перезагрузка не заменит его.
- Пути исходящей доставки также читают из этого активного снимка (например, доставка ответов/тредов Discord и отправка действий Telegram); они не разрешают SecretRefs заново при каждой отправке.

Это не допускает сбоев поставщика секретов на горячие пути запросов.

## Граница доступа агента

SecretRefs защищают учетные данные от сохранения в поддерживаемой конфигурации и
сгенерированных модельных поверхностях, но они не являются границей изоляции процесса. Если
учетные данные в открытом тексте остаются на диске в пути, который агент может читать, агент может
обойти редактирование на уровне API, используя файловые или shell-инструменты для просмотра этого файла.

Для production-развертываний, где файлы, доступные агенту, входят в область риска, считайте
миграцию SecretRef завершенной только когда выполнены все условия:

- поддерживаемые учетные данные используют SecretRefs вместо значений в открытом тексте
- устаревшие остатки открытого текста удалены из `openclaw.json`,
  `auth-profiles.json`, `.env` и сгенерированных файлов `models.json`
- `openclaw secrets audit --check` проходит без замечаний после миграции
- все оставшиеся неподдерживаемые или ротируемые учетные данные защищены изоляцией
  операционной системы, изоляцией контейнера или внешним прокси учетных данных

Поэтому рабочий процесс audit/configure/apply является контрольной точкой миграции безопасности, а не
просто удобным помощником.

<Warning>
SecretRefs не делают произвольные читаемые файлы безопасными. Резервные копии, скопированные конфигурации,
старые сгенерированные каталоги моделей и неподдерживаемые классы учетных данных должны рассматриваться
как production-секреты, пока они не будут удалены, перемещены за пределы доверенной границы агента
или защищены отдельным слоем изоляции.
</Warning>

## Фильтрация активных поверхностей

SecretRefs проверяются только на фактически активных поверхностях.

- Включенные поверхности: неразрешенные ссылки блокируют запуск/перезагрузку.
- Неактивные поверхности: неразрешенные ссылки не блокируют запуск/перезагрузку.
- Неактивные ссылки выдают нефатальные диагностические сообщения с кодом `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Примеры неактивных поверхностей">
    - Отключенные записи каналов/аккаунтов.
    - Учетные данные канала верхнего уровня, которые не наследует ни один включенный аккаунт.
    - Отключенные поверхности инструментов/функций.
    - Ключи, специфичные для поставщика веб-поиска, который не выбран в `tools.web.search.provider`. В автоматическом режиме (поставщик не задан) ключи проверяются по приоритету для автоопределения поставщика, пока один из них не разрешится. После выбора ключи невыбранных поставщиков считаются неактивными, пока не будут выбраны.
    - Материал SSH-авторизации sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, плюс переопределения на уровне агента) активен только когда эффективный backend sandbox равен `ssh` для агента по умолчанию или включенного агента.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` активны, если верно одно из следующих условий:
      - `gateway.mode=remote`
      - настроен `gateway.remote.url`
      - `gateway.tailscale.mode` равен `serve` или `funnel`
      - В локальном режиме без этих удаленных поверхностей:
        - `gateway.remote.token` активен, когда token auth может победить и env/auth-токен не настроен.
        - `gateway.remote.password` активен только когда password auth может победить и env/auth-пароль не настроен.
    - SecretRef `gateway.auth.token` неактивен для разрешения авторизации при запуске, когда задан `OPENCLAW_GATEWAY_TOKEN`, потому что входной env-токен побеждает для этого runtime.

  </Accordion>
</AccordionGroup>

## Диагностика поверхности авторизации Gateway

Когда SecretRef настроен в `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` или `gateway.remote.password`, запуск/перезагрузка Gateway явно логирует состояние поверхности:

- `active`: SecretRef является частью эффективной поверхности авторизации и должен разрешаться.
- `inactive`: SecretRef игнорируется для этого runtime, потому что побеждает другая поверхность авторизации или потому что удаленная авторизация отключена/неактивна.

Эти записи логируются с `SECRETS_GATEWAY_AUTH_SURFACE` и включают причину, использованную политикой активных поверхностей, чтобы вы могли видеть, почему учетные данные были признаны активными или неактивными.

## Предварительная проверка ссылок при onboarding

Когда onboarding выполняется в интерактивном режиме и вы выбираете хранилище SecretRef, OpenClaw выполняет предварительную проверку перед сохранением:

- Env-ссылки: проверяет имя env var и подтверждает, что непустое значение видно во время настройки.
- Ссылки поставщиков (`file` или `exec`): проверяет выбор поставщика, разрешает `id` и проверяет тип разрешенного значения.
- Путь повторного использования quickstart: когда `gateway.auth.token` уже является SecretRef, onboarding разрешает его перед probe/bootstrap dashboard (для ссылок `env`, `file` и `exec`), используя тот же fail-fast gate.

Если проверка не проходит, onboarding показывает ошибку и позволяет повторить попытку.

## Контракт SecretRef

Используйте одну форму объекта везде:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Поддерживаемые поля SecretInput также принимают точные строковые сокращения:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Проверка:

    - `provider` должен соответствовать `^[a-z][a-z0-9_-]{0,63}$`
    - `id` должен соответствовать `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Проверка:

    - `provider` должен соответствовать `^[a-z][a-z0-9_-]{0,63}$`
    - `id` должен быть абсолютным JSON pointer (`/...`)
    - Экранирование RFC6901 в сегментах: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Проверка:

    - `provider` должен соответствовать `^[a-z][a-z0-9_-]{0,63}$`
    - `id` должен соответствовать `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (поддерживает селекторы, такие как `secret#json_key`)
    - `id` не должен содержать `.` или `..` как сегменты пути, разделенные косой чертой (например, `a/../b` отклоняется)

  </Tab>
</Tabs>

## Конфигурация поставщика

Определяйте поставщиков в `secrets.providers`:

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
  <Accordion title="Env-поставщик">
    - Необязательный allowlist через `allowlist`.
    - Отсутствующие/пустые env-значения приводят к ошибке разрешения.

  </Accordion>
  <Accordion title="File-поставщик">
    - Читает локальный файл из `path`.
    - `mode: "json"` ожидает payload JSON-объекта и разрешает `id` как pointer.
    - `mode: "singleValue"` ожидает ref id `"value"` и возвращает содержимое файла.
    - Путь должен пройти проверки владельца/разрешений.
    - Примечание о fail-closed в Windows: если проверка ACL недоступна для пути, разрешение завершается ошибкой. Только для доверенных путей задайте `allowInsecurePath: true` у этого поставщика, чтобы обойти проверки безопасности пути.

  </Accordion>
  <Accordion title="Exec-поставщик">
    - Запускает настроенный абсолютный путь к бинарному файлу, без shell.
    - По умолчанию `command` должен указывать на обычный файл (не symlink).
    - Задайте `allowSymlinkCommand: true`, чтобы разрешить symlink-пути команд (например, shims Homebrew). OpenClaw проверяет разрешенный целевой путь.
    - Сочетайте `allowSymlinkCommand` с `trustedDirs` для путей package-manager (например, `["/opt/homebrew"]`).
    - Поддерживает timeout, no-output timeout, ограничения байтов вывода, env allowlist и trusted dirs.
    - Примечание о fail-closed в Windows: если проверка ACL недоступна для пути команды, разрешение завершается ошибкой. Только для доверенных путей задайте `allowInsecurePath: true` у этого поставщика, чтобы обойти проверки безопасности пути.
    - Exec-поставщики, управляемые Plugin, могут использовать `pluginIntegration` вместо
      скопированных `command`/`args`. OpenClaw разрешает текущие сведения о команде
      из манифеста установленного Plugin во время запуска/перезагрузки. Если Plugin
      отключен, удален, недоверенный или больше не объявляет интеграцию,
      активные SecretRefs, использующие этого поставщика, завершаются fail-closed.

    Payload запроса (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload ответа (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Необязательные ошибки на уровне id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## API-ключи на базе файлов

Не помещайте строки `file:...` в блок конфигурации `env`. Блок `env`
литеральный и не переопределяющий, поэтому `file:...` не разрешается.

Вместо этого используйте файловый SecretRef в поддерживаемом поле учетных данных:

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

Для `mode: "singleValue"` SecretRef `id` равен `"value"`. Для
`mode: "json"` используйте абсолютный JSON pointer, например
`"/providers/xai/apiKey"`.

См. [поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface), чтобы узнать,
какие поля конфигурации принимают SecretRefs.

## Примеры exec-интеграции

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
    Используйте оболочку-резолвер, если хотите, чтобы идентификаторы SecretRef сопоставлялись с ключами элементов Bitwarden
    Secrets Manager. Репозиторий включает
    `scripts/secrets/openclaw-bws-resolver.mjs`; установите или скопируйте его в абсолютный
    доверенный путь на хосте, где работает Gateway.

    Требования:

    - CLI Bitwarden Secrets Manager (`bws`) установлен на хосте Gateway.
    - `BWS_ACCESS_TOKEN` доступен сервису Gateway.
    - `PATH` передан в резолвер или `BWS_BIN` задан как абсолютный путь к бинарному файлу `bws`.
    - `BWS_SERVER_URL` должен быть задан в среде при использовании самостоятельно размещенного
      экземпляра Bitwarden.

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

    Резолвер объединяет запрошенные идентификаторы в пакет, выполняет `bws secret list` и возвращает
    значения для совпадающих полей секрета `key`. Используйте ключи, которые удовлетворяют контракту идентификатора
    SecretRef для exec, например `openclaw/providers/openai/apiKey`; ключи
    в стиле переменных среды с подчеркиваниями отклоняются до запуска резолвера. Если более
    одного видимого секрета Bitwarden имеет один и тот же запрошенный ключ, резолвер
    помечает этот идентификатор как неоднозначный вместо выбора одного. После обновления конфигурации
    проверьте путь резолвера:

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
    Используйте небольшую оболочку-резолвер, если хотите, чтобы идентификаторы SecretRef напрямую сопоставлялись с
    записями `pass`. Сохраните ее как исполняемый файл по абсолютному пути, который проходит
    проверки путей вашего exec-провайдера, например
    `/usr/local/bin/openclaw-pass-resolver`. Шебанг `#!/usr/bin/env node`
    находит `node` из `PATH` процесса резолвера, поэтому включите `PATH` в
    `passEnv`. Если `pass` отсутствует в этом `PATH`, задайте `PASS_BIN` в родительской
    среде и также включите его в `passEnv`:

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

    Затем настройте exec-провайдер и укажите для `apiKey` путь к записи `pass`:

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

    Храните секрет в первой строке записи `pass` или настройте
    оболочку, если хотите вместо этого возвращать полный вывод `pass show`. После
    обновления конфигурации проверьте и статический аудит, и путь exec-резолвера:

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

## Переменные среды MCP-сервера

Переменные среды MCP-сервера, настроенные через `plugins.entries.acpx.config.mcpServers`, поддерживают SecretInput. Это не позволяет API-ключам и токенам попадать в конфигурацию в открытом виде:

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

Строковые значения в открытом виде по-прежнему работают. Ссылки-шаблоны среды, такие как `${MCP_SERVER_API_KEY}`, и объекты SecretRef разрешаются во время активации Gateway до запуска процесса MCP-сервера. Как и на других поверхностях SecretRef, неразрешенные ссылки блокируют активацию только тогда, когда Plugin `acpx` фактически активен.

## Материалы SSH-аутентификации песочницы

Базовый бэкенд песочницы `ssh` также поддерживает SecretRef для материалов SSH-аутентификации:

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

Поведение во время выполнения:

- OpenClaw разрешает эти ссылки при активации песочницы, а не отложенно при каждом SSH-вызове.
- Разрешенные значения записываются во временные файлы с ограничительными правами и используются в сгенерированной SSH-конфигурации.
- Если эффективный бэкенд песочницы не `ssh`, эти ссылки остаются неактивными и не блокируют запуск.

## Поддерживаемая поверхность учетных данных

Канонические поддерживаемые и неподдерживаемые учетные данные перечислены здесь:

- [Поверхность учетных данных SecretRef](/ru/reference/secretref-credential-surface)

<Note>
Учетные данные, создаваемые во время выполнения или ротируемые, а также материалы обновления OAuth намеренно исключены из разрешения SecretRef только для чтения.
</Note>

## Обязательное поведение и приоритет

- Поле без ссылки: без изменений.
- Поле со ссылкой: обязательно на активных поверхностях во время активации.
- Если присутствуют и значение в открытом виде, и ссылка, ссылка имеет приоритет на поддерживаемых путях приоритета.
- Маркер редактирования `__OPENCLAW_REDACTED__` зарезервирован для внутреннего редактирования/восстановления конфигурации и отклоняется как буквальные отправленные данные конфигурации.

Сигналы предупреждений и аудита:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (предупреждение времени выполнения)
- `REF_SHADOWED` (результат аудита, когда учетные данные `auth-profiles.json` имеют приоритет над ссылками `openclaw.json`)

Поведение совместимости Google Chat:

- `serviceAccountRef` имеет приоритет над `serviceAccount` в открытом виде.
- Значение в открытом виде игнорируется, когда соседняя ссылка задана.

## Триггеры активации

Активация секретов запускается при:

- Запуске (предварительная проверка плюс финальная активация)
- Горячем применении перезагрузки конфигурации
- Проверке перезапуска при перезагрузке конфигурации
- Ручной перезагрузке через `secrets.reload`
- Предварительной проверке Gateway config write RPC (`config.set` / `config.apply` / `config.patch`) на разрешимость SecretRef активной поверхности в отправленной конфигурационной нагрузке до сохранения изменений

Контракт активации:

- Успех атомарно заменяет снимок.
- Ошибка запуска прерывает запуск Gateway.
- Ошибка перезагрузки во время выполнения сохраняет последний заведомо исправный снимок.
- Ошибка предварительной проверки write-RPC отклоняет отправленную конфигурацию и оставляет как конфигурацию на диске, так и активный снимок времени выполнения без изменений.
- Передача явного токена канала для отдельного вызова outbound helper/tool не запускает активацию SecretRef; точками активации остаются запуск, перезагрузка и явный `secrets.reload`.

## Сигналы ухудшения и восстановления

Когда активация во время перезагрузки завершается неудачей после исправного состояния, OpenClaw входит в ухудшенное состояние секретов.

Однократное системное событие и коды журналов:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Поведение:

- Ухудшенное состояние: среда выполнения сохраняет последний заведомо исправный снимок.
- Восстановлено: отправляется один раз после следующей успешной активации.
- Повторные ошибки, когда система уже в ухудшенном состоянии, записывают предупреждения, но не создают поток событий.
- Быстрое завершение при ошибке запуска не отправляет события ухудшенного состояния, потому что среда выполнения так и не стала активной.

## Разрешение путей команд

Пути команд могут включить поддерживаемое разрешение SecretRef через RPC снимка Gateway.

Существует два общих варианта поведения:

<Tabs>
  <Tab title="Строгие пути команд">
    Например, пути удаленной памяти `openclaw memory` и `openclaw qr --remote`, когда им нужны удаленные ссылки на общий секрет. Они читают из активного снимка и быстро завершаются ошибкой, если требуемый SecretRef недоступен.
  </Tab>
  <Tab title="Пути команд только для чтения">
    Например, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` и потоки исправления doctor/config только для чтения. Они также предпочитают активный снимок, но деградируют вместо аварийного завершения, когда целевой SecretRef недоступен в этом пути команды.

    Поведение только для чтения:

    - Когда Gateway запущен, эти команды сначала читают из активного снимка.
    - Если разрешение Gateway неполное или Gateway недоступен, они пытаются выполнить целевой локальный откат для конкретной поверхности команды.
    - Если целевой SecretRef все еще недоступен, команда продолжает работу с деградированным выводом только для чтения и явной диагностикой, например "configured but unavailable in this command path".
    - Это деградированное поведение действует только локально для команды. Оно не ослабляет пути запуска runtime, перезагрузки или отправки/auth.

  </Tab>
</Tabs>

Другие примечания:

- Обновление снимка после ротации секрета в backend выполняется командой `openclaw secrets reload`.
- Метод Gateway RPC, используемый этими путями команд: `secrets.resolve`.

## Рабочий процесс аудита и настройки

Стандартный поток оператора:

<Steps>
  <Step title="Проверить текущее состояние">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Настроить и применить SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Повторно выполнить аудит">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Не считайте миграцию завершенной, пока повторный аудит не пройдет без замечаний. Если аудит
все еще сообщает о значениях в открытом виде в состоянии покоя, риск доступа агента сохраняется,
даже когда runtime API возвращают отредактированные значения.

Если вы сохраняете план вместо применения во время `configure`, примените этот сохраненный план
с помощью `openclaw secrets apply --from <plan-path>` перед повторным аудитом.

<AccordionGroup>
  <Accordion title="secrets audit">
    Находки включают:

    - значения в открытом виде в состоянии покоя (`openclaw.json`, `auth-profiles.json`, `.env` и сгенерированные `agents/*/agent/models.json`)
    - остатки чувствительных provider-заголовков в открытом виде в сгенерированных записях `models.json`
    - неразрешенные refs
    - затенение приоритета (`auth-profiles.json` получает приоритет над refs из `openclaw.json`)
    - устаревшие остатки (`auth.json`, напоминания OAuth)

    Примечание об exec:

    - По умолчанию аудит пропускает проверки разрешимости exec SecretRef, чтобы избежать побочных эффектов команд.
    - Используйте `openclaw secrets audit --allow-exec`, чтобы выполнять exec providers во время аудита.

    Примечание об остатках заголовков:

    - Обнаружение чувствительных provider-заголовков основано на эвристике имен (распространенные имена и фрагменты заголовков auth/учетных данных, такие как `authorization`, `x-api-key`, `token`, `secret`, `password` и `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Интерактивный помощник, который:

    - сначала настраивает `secrets.providers` (`env`/`file`/`exec`, добавить/изменить/удалить)
    - позволяет выбрать поддерживаемые поля с секретами в `openclaw.json` плюс `auth-profiles.json` для одной области агента
    - может создать новое сопоставление `auth-profiles.json` прямо в выборе цели
    - собирает данные SecretRef (`source`, `provider`, `id`)
    - запускает предварительное разрешение
    - может применить изменения сразу

    Примечание об exec:

    - Предварительная проверка пропускает проверки exec SecretRef, если не задан `--allow-exec`.
    - Если вы применяете напрямую из `configure --apply` и план содержит exec refs/providers, оставьте `--allow-exec` заданным и для шага применения.

    Полезные режимы:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Значения применения `configure` по умолчанию:

    - очищать совпадающие статические учетные данные из `auth-profiles.json` для целевых providers
    - очищать устаревшие статические записи `api_key` из `auth.json`
    - очищать совпадающие известные строки секретов из `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Применить сохраненный план:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Примечание об exec:

    - dry-run пропускает exec-проверки, если не задан `--allow-exec`.
    - режим записи отклоняет планы, содержащие exec SecretRefs/providers, если не задан `--allow-exec`.

    Подробности строгого контракта цели/пути и точные правила отклонения см. в [Контракте плана Secrets Apply](/ru/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Односторонняя политика безопасности

<Warning>
OpenClaw намеренно не записывает резервные копии отката, содержащие исторические значения секретов в открытом виде.
</Warning>

Модель безопасности:

- предварительная проверка должна пройти успешно до режима записи
- активация runtime проверяется перед commit
- apply обновляет файлы с помощью атомарной замены файлов и best-effort восстановления при сбое

## Примечания о совместимости устаревшей auth

Для статических учетных данных runtime больше не зависит от устаревшего хранилища auth в открытом виде.

- Источник учетных данных runtime — разрешенный снимок в памяти.
- Устаревшие статические записи `api_key` очищаются при обнаружении.
- Поведение совместимости, связанное с OAuth, остается отдельным.

## Примечание о Web UI

Некоторые объединения SecretInput проще настраивать в режиме raw editor, чем в режиме формы.

## Связанные материалы

- [Authentication](/ru/gateway/authentication) — настройка auth
- [CLI: secrets](/ru/cli/secrets) — команды CLI
- [Environment Variables](/ru/help/environment) — приоритет environment
- [SecretRef Credential Surface](/ru/reference/secretref-credential-surface) — поверхность учетных данных
- [Secrets Apply Plan Contract](/ru/gateway/secrets-plan-contract) — подробности контракта плана
- [Security](/ru/gateway/security) — состояние безопасности
