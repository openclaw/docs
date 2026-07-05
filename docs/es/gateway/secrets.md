---
read_when:
    - Configuración de SecretRefs para credenciales de proveedor y referencias `auth-profiles.json`
    - Operar la recarga, auditoría, configuración y aplicación de secretos de forma segura en producción
    - Comprender el fallo rápido al inicio, el filtrado de superficies inactivas y el comportamiento del último estado válido conocido
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato SecretRef, comportamiento de instantánea en tiempo de ejecución y depuración unidireccional segura'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-07-05T11:21:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe9349dd27755288ca7fd389c17e640fd55ff98587cbed783683be35b43eba7d
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw admite SecretRefs aditivos para que las credenciales compatibles no tengan que residir como texto plano en la configuración.

<Note>
El texto plano sigue funcionando. Los SecretRefs son optativos por credencial.
</Note>

<Warning>
Las credenciales en texto plano siguen siendo legibles por el agente si están en archivos que el agente puede inspeccionar, incluidos `openclaw.json`, `auth-profiles.json`, `.env` o archivos `agents/*/agent/models.json` generados. Los SecretRefs solo reducen ese radio de impacto local una vez que cada credencial compatible se haya migrado y `openclaw secrets audit --check` informe que no quedan residuos en texto plano.
</Warning>

## Modelo de runtime

- Los secretos se resuelven en una instantánea de runtime en memoria, de forma anticipada durante la activación, no de forma diferida en las rutas de solicitud.
- El inicio falla rápido cuando un SecretRef efectivamente activo no se puede resolver.
- La recarga es un intercambio atómico: éxito completo, o se conserva la última instantánea válida conocida.
- Las infracciones de política (por ejemplo, un perfil de autenticación en modo OAuth combinado con entrada SecretRef) hacen fallar la activación antes del intercambio de runtime.
- Las solicitudes de runtime solo leen la instantánea activa en memoria. Las rutas de entrega saliente (entrega de respuesta/hilo de Discord, envíos de acciones de Telegram) también leen esa instantánea y no vuelven a resolver referencias por cada envío.

Esto mantiene las interrupciones del proveedor de secretos fuera de las rutas calientes de solicitud.

## Límite de acceso del agente

Los SecretRefs evitan que las credenciales se persistan en archivos de configuración y de modelos generados, pero no son un límite de aislamiento de procesos. Una credencial en texto plano que quede en disco en una ruta que el agente pueda leer sigue siendo legible mediante herramientas de archivo o shell, eludiendo la redacción a nivel de API.

Para despliegues de producción donde los archivos accesibles para el agente estén dentro del alcance, considera la migración completa solo cuando se cumpla todo lo siguiente:

- Las credenciales compatibles usan SecretRefs en lugar de valores en texto plano.
- Los residuos heredados en texto plano se eliminan de `openclaw.json`, `auth-profiles.json`, `.env` y los archivos `models.json` generados.
- `openclaw secrets audit --check` no informa problemas después de la migración.
- Cualquier credencial restante no compatible o rotativa está protegida por aislamiento del sistema operativo, aislamiento de contenedor o un proxy de credenciales externo.

Por eso el flujo de auditoría/configuración/aplicación es una puerta de migración de seguridad, no solo un auxiliar de conveniencia.

<Warning>
Los SecretRefs no hacen seguros los archivos arbitrarios legibles. Las copias de seguridad, las configuraciones copiadas, los catálogos de modelos generados antiguos y las clases de credenciales no compatibles siguen siendo secretos de producción hasta que se eliminen, se muevan fuera del límite de confianza del agente o se aíslen por separado.
</Warning>

## Filtrado de superficies activas

Los SecretRefs se validan solo en superficies efectivamente activas:

- **Superficies habilitadas**: las referencias sin resolver bloquean el inicio o la recarga.
- **Superficies inactivas**: las referencias sin resolver no bloquean el inicio ni la recarga; emiten un diagnóstico no fatal `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Ejemplos de superficies inactivas">
- Entradas de canal/cuenta deshabilitadas.
- Credenciales de canal de nivel superior que ninguna cuenta habilitada hereda.
- Superficies de herramienta/funcionalidad deshabilitadas.
- Claves específicas del proveedor de búsqueda web no seleccionadas por `tools.web.search.provider`. En modo automático (proveedor sin definir), las claves se consultan por precedencia para la detección automática hasta que una se resuelva; después de la selección, las claves de proveedores no seleccionados quedan inactivas.
- El material de autenticación SSH de sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, más las sobrescrituras por agente) está activo solo cuando el backend de sandbox efectivo es `ssh` y el modo de sandbox no es `off`, para el agente predeterminado o un agente habilitado.
- Los SecretRefs `gateway.remote.token` / `gateway.remote.password` están activos si se cumple cualquiera de estas condiciones:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` es `serve` o `funnel`
  - En modo local sin esas superficies remotas: `gateway.remote.token` está activo cuando la autenticación con token puede ganar y no hay ningún token de entorno/autenticación configurado; `gateway.remote.password` está activo solo cuando la autenticación con contraseña puede ganar y no hay ninguna contraseña de entorno/autenticación configurada.
- El SecretRef `gateway.auth.token` está inactivo para la resolución de autenticación de inicio cuando `OPENCLAW_GATEWAY_TOKEN` está establecido, porque la entrada de token de entorno gana para ese runtime.

</Accordion>

## Diagnósticos de superficie de autenticación de Gateway

Cuando se establece un SecretRef en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el inicio o la recarga de Gateway registra el estado de la superficie con el código `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: el SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: otra superficie de autenticación gana, o la autenticación remota está deshabilitada/no activa.

La entrada de registro incluye el motivo que usó la política de superficie activa.

## Prevalidación de referencias en onboarding

En el onboarding interactivo, elegir almacenamiento SecretRef ejecuta una validación previa antes de guardar:

- Referencias de entorno: valida el nombre de la variable de entorno y confirma que un valor no vacío sea visible durante la configuración.
- Referencias de proveedor (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo de valor resuelto.
- Flujo de inicio rápido: cuando `gateway.auth.token` ya es un SecretRef, el onboarding lo resuelve antes del arranque de sonda/dashboard (para referencias `env`, `file` y `exec`) usando la misma puerta de fallo rápido.

Un fallo de validación muestra el error y te permite reintentar.

## Contrato de SecretRef

Una forma de objeto en todas partes:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    También se aceptan cadenas abreviadas en campos SecretInput:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Validación:

    - `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
    - `id` debe coincidir con `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validación:

    - `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
    - `id` debe ser un puntero JSON absoluto (`/...`), o el literal `value` para proveedores `singleValue`
    - Escapado RFC 6901 en segmentos: `~` se convierte en `~0`, `/` se convierte en `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validación:

    - `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
    - `id` debe coincidir con `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores como `secret#json_key`)
    - `id` no debe contener `.` ni `..` como segmentos de ruta delimitados por barras (por ejemplo, `a/../b` se rechaza)

  </Tab>
</Tabs>

## Configuración del proveedor

Define proveedores bajo `secrets.providers`:

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

<Accordion title="Proveedor Env">
- Lista de permitidos opcional por nombre exacto mediante `allowlist`.
- Los valores de entorno ausentes o vacíos hacen fallar la resolución.

</Accordion>

<Accordion title="Proveedor File">
- Lee el archivo local en `path`.
- `mode: "json"` (predeterminado) espera una carga útil de objeto JSON y resuelve `id` como un puntero JSON.
- `mode: "singleValue"` espera el id de referencia `"value"` y devuelve el contenido sin procesar del archivo (sin el salto de línea final).
- La ruta debe superar las comprobaciones de propiedad/permisos; `timeoutMs` (predeterminado 5000) y `maxBytes` (predeterminado 1 MiB) limitan la lectura.
- Fallo cerrado en Windows: si la verificación de ACL no está disponible para la ruta, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir la comprobación.

</Accordion>

<Accordion title="Proveedor Exec">
- Ejecuta directamente la ruta absoluta del binario configurado, sin shell.
- De forma predeterminada, `command` debe ser un archivo regular, no un enlace simbólico. Establece `allowSymlinkCommand: true` para permitir rutas de comando con enlace simbólico (por ejemplo, shims de Homebrew) y combínalo con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`) para que solo califiquen rutas del gestor de paquetes.
- Admite `timeoutMs` (predeterminado 5000), `noOutputTimeoutMs` (predeterminado igual a `timeoutMs`), `maxOutputBytes` (predeterminado 1 MiB), lista de permitidos `env`/`passEnv` y `trustedDirs`.
- `jsonOnly` toma `true` de forma predeterminada. Con `jsonOnly: false` y un único id solicitado, stdout sin JSON simple se acepta como el valor de ese id.
- Fallo cerrado en Windows: si la verificación de ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir la comprobación.
- Los proveedores exec gestionados por Plugin pueden usar `pluginIntegration` en lugar de un `command`/`args` copiado. OpenClaw resuelve los detalles actuales del comando desde el manifiesto del Plugin instalado durante el inicio o la recarga; si el Plugin está deshabilitado, eliminado, no es de confianza o ya no declara la integración, los SecretRefs activos en ese proveedor fallan de forma cerrada.

Carga útil de solicitud (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Carga útil de respuesta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Errores opcionales por id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

</Accordion>

## Claves de API respaldadas por archivos

No pongas cadenas `file:...` en el bloque `env` de configuración. Ese bloque es literal y no sobrescribe, por lo que `file:...` nunca se resuelve allí.

Usa un SecretRef de archivo en un campo de credencial compatible en su lugar:

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

Para `mode: "singleValue"`, el `id` de SecretRef es `"value"`. Para `mode: "json"`, usa un puntero JSON absoluto como `"/providers/xai/apiKey"`.

Consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para ver los campos que aceptan SecretRefs.

## Ejemplos de integración exec

<AccordionGroup>
  <Accordion title="CLI de 1Password">
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
    Usa un envoltorio de resolución para asignar ids de SecretRef a claves de elementos de Bitwarden Secrets Manager. El repositorio incluye `scripts/secrets/openclaw-bws-resolver.mjs`; instálalo o cópialo en una ruta absoluta de confianza en el host que ejecuta el Gateway.

    Requisitos:

    - CLI de Bitwarden Secrets Manager (`bws`) instalada en el host del Gateway.
    - `BWS_ACCESS_TOKEN` disponible para el servicio del Gateway.
    - `PATH` pasado al resolver, o `BWS_BIN` establecido en la ruta absoluta del binario `bws`.
    - `BWS_SERVER_URL` establecido en el entorno cuando se usa una instancia de Bitwarden autoalojada.

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

    El resolver agrupa los identificadores solicitados, ejecuta `bws secret list` y devuelve valores para los campos `key` de secretos coincidentes. Usa claves que cumplan el contrato de id de SecretRef exec, como `openclaw/providers/openai/apiKey`; las claves de estilo variable de entorno con guiones bajos se rechazan antes de que se ejecute el resolver. Si más de un secreto visible de Bitwarden comparte la clave solicitada, el resolver marca ese id como ambiguo en lugar de adivinar. Después de actualizar la configuración, verifica la ruta del resolver:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="CLI de HashiCorp Vault">
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
    Usa un pequeño contenedor de resolución para asignar ids de SecretRef directamente a entradas de `pass`. Guárdalo como ejecutable en una ruta absoluta que supere tus comprobaciones de ruta de proveedor exec, por ejemplo `/usr/local/bin/openclaw-pass-resolver`. El shebang `#!/usr/bin/env node` resuelve `node` desde el `PATH` del proceso del resolver, así que incluye `PATH` en `passEnv`. Si `pass` no está en ese `PATH`, establece `PASS_BIN` en el entorno padre e inclúyelo también en `passEnv`:

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

    Luego configura el proveedor exec y apunta `apiKey` a la ruta de entrada de `pass`:

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

    Mantén el secreto en la primera línea de la entrada de `pass`, o personaliza el contenedor para devolver en su lugar la salida completa de `pass show`. Después de actualizar la configuración, verifica tanto la auditoría estática como la ruta del resolver exec:

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

## Variables de entorno del servidor MCP

Las variables de entorno del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` aceptan SecretInput, lo que mantiene las claves de API y los tokens fuera de la configuración en texto plano:

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

Los valores de cadena en texto plano siguen funcionando. Las referencias de plantilla de entorno como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del Gateway, antes de que se genere el proceso del servidor MCP. Como con otras superficies de SecretRef, las referencias sin resolver solo bloquean la activación cuando el Plugin `acpx` está efectivamente activo.

## Material de autenticación SSH de sandbox

El backend de sandbox `ssh` del núcleo también admite SecretRefs para material de autenticación SSH:

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

Comportamiento en tiempo de ejecución:

- OpenClaw resuelve estas referencias durante la activación del sandbox, no de forma diferida en cada llamada SSH.
- Los valores resueltos se escriben en un directorio temporal con permisos de archivo restrictivos (`0o600`) y se usan en la configuración SSH generada.
- Si el backend de sandbox efectivo no es `ssh` (o el modo sandbox es `off`), estas referencias permanecen inactivas y no bloquean el inicio.

## Superficie de credenciales admitida

Las credenciales canónicas admitidas y no admitidas se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).

<Note>
Las credenciales emitidas en tiempo de ejecución o rotatorias y el material de actualización OAuth se excluyen intencionalmente de la resolución SecretRef de solo lectura.
</Note>

## Comportamiento requerido y precedencia

- Campo sin una referencia: sin cambios.
- Campo con una referencia: obligatorio en superficies activas durante la activación.
- Si hay tanto texto plano como referencia, la referencia tiene precedencia en las rutas de precedencia admitidas.
- El centinela de redacción `__OPENCLAW_REDACTED__` está reservado para la redacción/restauración interna de configuración y se rechaza como datos literales de configuración enviados.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia en tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales de `auth-profiles.json` tienen precedencia sobre las referencias de `openclaw.json`)

Compatibilidad con Google Chat: `serviceAccountRef` tiene precedencia sobre `serviceAccount` en texto plano; el valor en texto plano se ignora una vez configurada la referencia hermana.

## Activadores de activación

La activación de secretos se ejecuta en:

- Inicio (comprobación previa más activación final)
- Ruta de aplicación en caliente de recarga de configuración
- Ruta de comprobación de reinicio de recarga de configuración
- Recarga manual mediante `secrets.reload`
- Comprobación previa de RPC de escritura de configuración del Gateway (`config.set` / `config.apply` / `config.patch`), que comprueba la resolubilidad de SecretRef de superficie activa dentro de la carga útil de configuración enviada antes de persistir las ediciones

Contrato de activación:

- El éxito intercambia la instantánea de forma atómica.
- Un fallo de inicio aborta el inicio del gateway.
- Un fallo de recarga en tiempo de ejecución conserva la última instantánea conocida como buena.
- Un fallo de comprobación previa de RPC de escritura rechaza la configuración enviada; tanto la configuración en disco como la instantánea activa en tiempo de ejecución permanecen sin cambios.
- Proporcionar un token de canal explícito por llamada a una llamada saliente de helper/herramienta no activa SecretRef; los puntos de activación siguen siendo el inicio, la recarga y `secrets.reload` explícito.

## Señales degradadas y recuperadas

Cuando la activación en tiempo de recarga falla después de un estado saludable, OpenClaw entra en estado de secretos degradado, emitiendo eventos de sistema de una sola vez y códigos de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: el tiempo de ejecución conserva la última instantánea conocida como buena.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos mientras ya está degradado registran advertencias, pero no vuelven a emitir el evento.
- El fallo rápido de inicio nunca emite un evento degradado, porque el tiempo de ejecución nunca llegó a estar activo.

## Resolución de rutas de comandos

Las rutas de comandos pueden optar por la resolución SecretRef admitida mediante una RPC de instantánea del Gateway. Se aplican dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comandos estrictas">
    Por ejemplo, las rutas de memoria remota de `openclaw memory` y `openclaw qr --remote` cuando necesita referencias de secreto compartido remoto. Leen desde la instantánea activa y fallan rápido cuando un SecretRef obligatorio no está disponible.
  </Tab>
  <Tab title="Rutas de comandos de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y flujos de doctor/reparación de configuración de solo lectura. También prefieren la instantánea activa, pero se degradan en lugar de abortar cuando un SecretRef dirigido no está disponible.

    Comportamiento de solo lectura:

    - Cuando el gateway está en ejecución, estos comandos leen primero desde la instantánea activa.
    - Si la resolución del gateway está incompleta o el gateway no está disponible, intentan una reserva local dirigida para esa superficie de comando.
    - Si un SecretRef dirigido sigue sin estar disponible, el comando continúa con salida de solo lectura degradada y un diagnóstico explícito de que la referencia está configurada pero no disponible en esta ruta de comando.
    - Este comportamiento degradado es solo local del comando; no debilita el inicio, la recarga ni las rutas de envío/autenticación en tiempo de ejecución.

  </Tab>
</Tabs>

Otras notas:

- La actualización de instantánea después de la rotación de secretos del backend se gestiona mediante `openclaw secrets reload`.
- Método RPC del Gateway usado por estas rutas de comandos: `secrets.resolve`.

## Flujo de trabajo de auditoría y configuración

Flujo predeterminado del operador:

<Steps>
  <Step title="Auditar el estado actual">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurar y aplicar SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Volver a auditar">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

No trates la migración como completa hasta que la nueva auditoría esté limpia. Si la auditoría todavía informa valores en texto sin formato en reposo, el riesgo de acceso por parte del agente permanece incluso cuando las API de runtime devuelven valores redactados.

Si guardas un plan en lugar de aplicarlo durante `configure`, aplica ese plan guardado con `openclaw secrets apply --from <plan-path>` antes de la nueva auditoría.

<AccordionGroup>
  <Accordion title="secrets audit">
    Los hallazgos incluyen:

    - Valores en texto sin formato en reposo (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado).
    - Residuos de encabezados de proveedor sensibles en texto sin formato en entradas `models.json` generadas.
    - Referencias sin resolver.
    - Sombreado de precedencia (`auth-profiles.json` tiene prioridad sobre las referencias de `openclaw.json`).
    - Residuos heredados (`auth.json`, recordatorios de OAuth).

    Nota de exec: de forma predeterminada, la auditoría omite las comprobaciones de resolubilidad de SecretRef de exec para evitar efectos secundarios de comandos. Usa `openclaw secrets audit --allow-exec` para ejecutar proveedores exec durante la auditoría.

    Nota sobre residuos de encabezados: la detección de encabezados de proveedor sensibles se basa en heurísticas de nombres (nombres comunes de encabezados de autenticación/credenciales y fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Asistente interactivo que:

    - Configura primero `secrets.providers` (`env`/`file`/`exec`, agregar/editar/eliminar).
    - Te permite seleccionar campos compatibles que contienen secretos en `openclaw.json` además de `auth-profiles.json` para un ámbito de agente.
    - Puede crear una nueva asignación `auth-profiles.json` directamente en el selector de destino.
    - Captura detalles de SecretRef (`source`, `provider`, `id`).
    - Ejecuta la resolución previa y puede aplicar inmediatamente.

    Nota de exec: la comprobación previa omite las comprobaciones de SecretRef de exec salvo que se establezca `--allow-exec`. Si aplicas directamente desde `configure --apply` y el plan incluye referencias/proveedores exec, mantén `--allow-exec` establecido también para el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - Elimina credenciales estáticas coincidentes de `auth-profiles.json` para los proveedores seleccionados.
    - Elimina entradas estáticas heredadas `api_key` de `auth.json`.
    - Elimina líneas de secretos conocidos coincidentes de `<config-dir>/.env`.

  </Accordion>
  <Accordion title="secrets apply">
    Aplica un plan guardado:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota de exec: dry-run omite las comprobaciones de exec salvo que se establezca `--allow-exec`; el modo de escritura rechaza planes que contengan SecretRefs/proveedores exec salvo que se establezca `--allow-exec`.

    Para detalles estrictos del contrato de destino/ruta y reglas exactas de rechazo, consulta [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw no escribe intencionalmente copias de seguridad de reversión que contengan valores secretos históricos en texto sin formato.
</Warning>

Modelo de seguridad:

- La comprobación previa debe completarse correctamente antes del modo de escritura.
- La activación del runtime se valida antes de la confirmación.
- La aplicación actualiza archivos mediante reemplazo atómico de archivos y restauración de máximo esfuerzo en caso de error.

## Notas de compatibilidad de autenticación heredada

Para credenciales estáticas, el runtime ya no depende del almacenamiento de autenticación heredado en texto sin formato.

- La fuente de credenciales del runtime es la instantánea resuelta en memoria.
- Las entradas estáticas heredadas `api_key` se eliminan al descubrirse.
- El comportamiento de compatibilidad relacionado con OAuth permanece separado.

## Nota sobre la interfaz web

Algunas uniones SecretInput son más fáciles de configurar en modo editor sin formato que en modo formulario.

## Relacionado

- [Autenticación](/es/gateway/authentication) - configuración de autenticación
- [CLI: secretos](/es/cli/secrets) - comandos de CLI
- [Variables de entorno](/es/help/environment) - precedencia del entorno
- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) - superficie de credenciales
- [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract) - detalles del contrato del plan
- [Seguridad](/es/gateway/security) - postura de seguridad
