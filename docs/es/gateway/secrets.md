---
read_when:
    - Configuración de SecretRefs para credenciales de proveedores y referencias de `auth-profiles.json`
    - Operar la recarga, auditoría, configuración y aplicación de secretos de forma segura en producción
    - Comprender el fallo rápido al inicio, el filtrado de superficies inactivas y el comportamiento de última versión válida conocida
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato SecretRef, comportamiento de instantáneas en tiempo de ejecución y depuración unidireccional segura'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-06-27T11:36:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw admite SecretRefs aditivos para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

<Note>
El texto sin formato sigue funcionando. Los SecretRefs se habilitan por credencial.
</Note>

<Warning>
Las credenciales en texto sin formato siguen siendo legibles por el agente si se almacenan en archivos que el
agente puede inspeccionar, incluidos `openclaw.json`, `auth-profiles.json`, `.env` o
archivos `agents/*/agent/models.json` generados. Los SecretRefs reducen ese radio de impacto local
solo después de que todas las credenciales compatibles se hayan migrado y
`openclaw secrets audit --check` informe que no queda residuo de secretos en texto sin formato.
</Warning>

## Objetivos y modelo de runtime

Los secretos se resuelven en una instantánea de runtime en memoria.

- La resolución es ansiosa durante la activación, no diferida en las rutas de solicitud.
- El arranque falla rápido cuando un SecretRef efectivamente activo no puede resolverse.
- La recarga usa intercambio atómico: éxito completo, o se conserva la última instantánea válida conocida.
- Las infracciones de la política de SecretRef (por ejemplo, perfiles de autenticación en modo OAuth combinados con entrada SecretRef) hacen fallar la activación antes del intercambio de runtime.
- Las solicitudes de runtime leen únicamente desde la instantánea activa en memoria.
- Después de la primera activación/carga correcta de la configuración, las rutas de código de runtime siguen leyendo esa instantánea activa en memoria hasta que una recarga correcta la intercambia.
- Las rutas de entrega saliente también leen desde esa instantánea activa (por ejemplo, la entrega de respuestas/hilos de Discord y los envíos de acciones de Telegram); no vuelven a resolver SecretRefs en cada envío.

Esto mantiene las interrupciones del proveedor de secretos fuera de las rutas críticas de solicitud.

## Límite de acceso del agente

Los SecretRefs protegen las credenciales para que no se persistan en la configuración compatible y
en las superficies de modelos generadas, pero no son un límite de aislamiento de procesos. Si una
credencial en texto sin formato permanece en disco en una ruta que el agente puede leer, el agente puede
eludir la redacción a nivel de API usando herramientas de archivo o de shell para inspeccionar ese archivo.

Para despliegues de producción donde los archivos accesibles por el agente están dentro del alcance, considera
la migración de SecretRef completa solo cuando todo esto sea cierto:

- las credenciales compatibles usan SecretRefs en lugar de valores en texto sin formato
- el residuo heredado en texto sin formato se ha eliminado de `openclaw.json`,
  `auth-profiles.json`, `.env` y los archivos `models.json` generados
- `openclaw secrets audit --check` queda limpio después de la migración
- cualquier credencial restante no compatible o rotativa está protegida por aislamiento del
  sistema operativo, aislamiento de contenedores o un proxy de credenciales externo

Por eso el flujo de auditoría/configuración/aplicación es una puerta de migración de seguridad, no
solo un asistente de conveniencia.

<Warning>
Los SecretRefs no hacen seguros los archivos arbitrarios legibles. Las copias de seguridad, las configuraciones copiadas,
los catálogos de modelos generados antiguos y las clases de credenciales no compatibles deben tratarse
como secretos de producción hasta que se eliminen, se muevan fuera del límite de confianza del agente
o se protejan mediante una capa de aislamiento separada.
</Warning>

## Filtrado de superficies activas

Los SecretRefs se validan solo en superficies efectivamente activas.

- Superficies habilitadas: las referencias sin resolver bloquean el arranque/la recarga.
- Superficies inactivas: las referencias sin resolver no bloquean el arranque/la recarga.
- Las referencias inactivas emiten diagnósticos no fatales con el código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Ejemplos de superficies inactivas">
    - Entradas de canal/cuenta deshabilitadas.
    - Credenciales de canal de nivel superior que ninguna cuenta habilitada hereda.
    - Superficies de herramienta/función deshabilitadas.
    - Claves específicas de proveedor de búsqueda web que no están seleccionadas por `tools.web.search.provider`. En modo automático (proveedor sin establecer), las claves se consultan por precedencia para la detección automática del proveedor hasta que una se resuelve. Después de la selección, las claves de proveedores no seleccionados se tratan como inactivas hasta que se seleccionan.
    - El material de autenticación SSH del sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, más sobrescrituras por agente) está activo solo cuando el backend efectivo del sandbox es `ssh` para el agente predeterminado o un agente habilitado.
    - Los SecretRefs de `gateway.remote.token` / `gateway.remote.password` están activos si se cumple una de estas condiciones:
      - `gateway.mode=remote`
      - `gateway.remote.url` está configurado
      - `gateway.tailscale.mode` es `serve` o `funnel`
      - En modo local sin esas superficies remotas:
        - `gateway.remote.token` está activo cuando la autenticación por token puede ganar y no hay un token de env/auth configurado.
        - `gateway.remote.password` está activo solo cuando la autenticación por contraseña puede ganar y no hay una contraseña de env/auth configurada.
    - El SecretRef de `gateway.auth.token` está inactivo para la resolución de autenticación de arranque cuando `OPENCLAW_GATEWAY_TOKEN` está establecido, porque la entrada de token de env gana para ese runtime.

  </Accordion>
</AccordionGroup>

## Diagnósticos de superficie de autenticación del Gateway

Cuando se configura un SecretRef en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el arranque/la recarga del gateway registra explícitamente el estado de la superficie:

- `active`: el SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: el SecretRef se ignora para este runtime porque otra superficie de autenticación gana, o porque la autenticación remota está deshabilitada/no activa.

Estas entradas se registran con `SECRETS_GATEWAY_AUTH_SURFACE` e incluyen el motivo usado por la política de superficie activa, para que puedas ver por qué una credencial se trató como activa o inactiva.

## Preflight de referencia durante la incorporación

Cuando la incorporación se ejecuta en modo interactivo y eliges almacenamiento SecretRef, OpenClaw ejecuta una validación preflight antes de guardar:

- Referencias env: valida el nombre de la variable de entorno y confirma que un valor no vacío sea visible durante la configuración.
- Referencias de proveedor (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Ruta de reutilización de quickstart: cuando `gateway.auth.token` ya es un SecretRef, la incorporación lo resuelve antes del arranque de la prueba/dashboard (para refs `env`, `file` y `exec`) usando la misma puerta de fallo rápido.

Si la validación falla, la incorporación muestra el error y te permite reintentarlo.

## Contrato de SecretRef

Usa una forma de objeto en todas partes:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Los campos SecretInput compatibles también aceptan abreviaturas de cadena exactas:

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
    - `id` debe ser un puntero JSON absoluto (`/...`)
    - Escape RFC6901 en segmentos: `~` => `~0`, `/` => `~1`

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

<AccordionGroup>
  <Accordion title="Proveedor env">
    - Lista de permitidos opcional mediante `allowlist`.
    - Los valores env ausentes/vacíos hacen fallar la resolución.

  </Accordion>
  <Accordion title="Proveedor file">
    - Lee un archivo local desde `path`.
    - `mode: "json"` espera una carga útil de objeto JSON y resuelve `id` como puntero.
    - `mode: "singleValue"` espera el id de ref `"value"` y devuelve el contenido del archivo.
    - La ruta debe pasar comprobaciones de propiedad/permisos.
    - Nota de fallo cerrado en Windows: si la verificación de ACL no está disponible para una ruta, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de ruta.

  </Accordion>
  <Accordion title="Proveedor exec">
    - Ejecuta la ruta absoluta del binario configurado, sin shell.
    - De forma predeterminada, `command` debe apuntar a un archivo regular (no a un enlace simbólico).
    - Establece `allowSymlinkCommand: true` para permitir rutas de comando con enlace simbólico (por ejemplo, shims de Homebrew). OpenClaw valida la ruta de destino resuelta.
    - Combina `allowSymlinkCommand` con `trustedDirs` para rutas de gestores de paquetes (por ejemplo, `["/opt/homebrew"]`).
    - Admite timeout, timeout sin salida, límites de bytes de salida, lista de permitidos de env y directorios de confianza.
    - Nota de fallo cerrado en Windows: si la verificación de ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de ruta.
    - Los proveedores exec administrados por Plugin pueden usar `pluginIntegration` en lugar de
      `command`/`args` copiados. OpenClaw resuelve los detalles actuales del comando
      desde el manifiesto del Plugin instalado durante el arranque/la recarga. Si el Plugin está
      deshabilitado, eliminado, no es de confianza o ya no declara la integración,
      los SecretRefs activos que usan ese proveedor fallan de forma cerrada.

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
</AccordionGroup>

## Claves de API respaldadas por archivos

No coloques cadenas `file:...` en el bloque `env` de la configuración. El bloque `env` es
literal y no sobrescribe, así que `file:...` no se resuelve.

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

Para `mode: "singleValue"`, el `id` de SecretRef es `"value"`. Para
`mode: "json"`, usa un puntero JSON absoluto como
`"/providers/xai/apiKey"`.

Consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para ver
los campos de configuración que aceptan SecretRefs.

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
    Usa un contenedor de resolución cuando quieras que los ids de SecretRef se asignen a claves de elementos de Bitwarden
    Secrets Manager. El repositorio incluye
    `scripts/secrets/openclaw-bws-resolver.mjs`; instálalo o cópialo en una ruta absoluta
    de confianza en el host que ejecuta el Gateway.

    Requisitos:

    - CLI de Bitwarden Secrets Manager (`bws`) instalada en el host del Gateway.
    - `BWS_ACCESS_TOKEN` disponible para el servicio Gateway.
    - `PATH` pasado al resolvedor, o `BWS_BIN` establecido en la ruta absoluta del binario
      `bws`.
    - `BWS_SERVER_URL` debe estar establecido en el entorno al usar una instancia de Bitwarden
      autoalojada.

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

    El resolvedor agrupa los ids solicitados, ejecuta `bws secret list` y devuelve
    valores para los campos `key` de secretos coincidentes. Usa claves que satisfagan el contrato de id de SecretRef
    exec, como `openclaw/providers/openai/apiKey`; las claves de estilo variable de entorno
    con guiones bajos se rechazan antes de que se ejecute el resolvedor. Si más
    de un secreto visible de Bitwarden tiene la misma clave solicitada, el resolvedor
    marca ese id como ambiguo en lugar de elegir uno. Después de actualizar la configuración,
    verifica la ruta del resolvedor:

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
    Usa un pequeño contenedor de resolución cuando quieras que los ids de SecretRef se asignen directamente a
    entradas de `pass`. Guárdalo como ejecutable en una ruta absoluta que supere
    tus comprobaciones de ruta del proveedor exec, por ejemplo
    `/usr/local/bin/openclaw-pass-resolver`. La línea shebang `#!/usr/bin/env node`
    resuelve `node` desde el `PATH` del proceso del resolvedor, así que incluye `PATH` en
    `passEnv`. Si `pass` no está en ese `PATH`, establece `PASS_BIN` en el entorno
    padre e inclúyelo también en `passEnv`:

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

    Mantén el secreto en la primera línea de la entrada de `pass`, o personaliza el
    contenedor si quieres devolver en su lugar la salida completa de `pass show`. Después de
    actualizar la configuración, verifica tanto la auditoría estática como la ruta del resolvedor exec:

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

Las variables de entorno del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` admiten SecretInput. Esto mantiene las claves de API y los tokens fuera de la configuración en texto plano:

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

Los valores de cadena en texto plano siguen funcionando. Las referencias de plantilla de entorno como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del gateway antes de que se genere el proceso del servidor MCP. Igual que con otras superficies SecretRef, las referencias sin resolver solo bloquean la activación cuando el plugin `acpx` está efectivamente activo.

## Material de autenticación SSH del sandbox

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

- OpenClaw resuelve estas referencias durante la activación del sandbox, no de forma diferida durante cada llamada SSH.
- Los valores resueltos se escriben en archivos temporales con permisos restrictivos y se usan en la configuración SSH generada.
- Si el backend efectivo del sandbox no es `ssh`, estas referencias permanecen inactivas y no bloquean el inicio.

## Superficie de credenciales admitida

Las credenciales canónicas admitidas y no admitidas se enumeran en:

- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)

<Note>
Las credenciales acuñadas en tiempo de ejecución o rotativas y el material de actualización de OAuth se excluyen intencionalmente de la resolución SecretRef de solo lectura.
</Note>

## Comportamiento requerido y precedencia

- Campo sin una referencia: sin cambios.
- Campo con una referencia: obligatorio en superficies activas durante la activación.
- Si están presentes tanto texto plano como una referencia, la referencia tiene prioridad en las rutas de precedencia admitidas.
- El centinela de redacción `__OPENCLAW_REDACTED__` está reservado para la redacción/restauración interna de configuración y se rechaza como datos literales de configuración enviada.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia de tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales de `auth-profiles.json` tienen prioridad sobre las referencias de `openclaw.json`)

Comportamiento de compatibilidad de Google Chat:

- `serviceAccountRef` tiene prioridad sobre `serviceAccount` en texto plano.
- El valor en texto plano se ignora cuando se establece la referencia hermana.

## Activadores de activación

La activación de secretos se ejecuta en:

- Inicio (preflight más activación final)
- Ruta de aplicación en caliente de recarga de configuración
- Ruta de comprobación de reinicio de recarga de configuración
- Recarga manual mediante `secrets.reload`
- Preflight de RPC de escritura de configuración del Gateway (`config.set` / `config.apply` / `config.patch`) para la resolubilidad de SecretRef de superficies activas dentro de la carga útil de configuración enviada antes de persistir las ediciones

Contrato de activación:

- El éxito intercambia la instantánea de forma atómica.
- Un fallo de inicio aborta el inicio del gateway.
- Un fallo de recarga en tiempo de ejecución conserva la última instantánea buena conocida.
- Un fallo de preflight de RPC de escritura rechaza la configuración enviada y mantiene sin cambios tanto la configuración en disco como la instantánea de tiempo de ejecución activa.
- Proporcionar un token de canal explícito por llamada a una llamada de herramienta/ayudante saliente no activa SecretRef; los puntos de activación siguen siendo inicio, recarga y `secrets.reload` explícito.

## Señales degradadas y recuperadas

Cuando la activación en tiempo de recarga falla después de un estado saludable, OpenClaw entra en estado de secretos degradado.

Códigos de evento del sistema de una sola vez y de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: el tiempo de ejecución conserva la última instantánea buena conocida.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos mientras ya está degradado registran advertencias, pero no saturan los eventos.
- El fallo rápido al inicio no emite eventos degradados porque el tiempo de ejecución nunca llegó a estar activo.

## Resolución de rutas de comandos

Las rutas de comandos pueden optar por la resolución SecretRef admitida mediante RPC de instantánea del Gateway.

Hay dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comandos estrictas">
    Por ejemplo, las rutas de memoria remota de `openclaw memory` y `openclaw qr --remote` cuando necesita referencias remotas de secreto compartido. Leen desde la instantánea activa y fallan rápidamente cuando una SecretRef requerida no está disponible.
  </Tab>
  <Tab title="Rutas de comandos de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y los flujos de reparación de solo lectura de doctor/config. También prefieren la instantánea activa, pero degradan en lugar de abortar cuando una SecretRef de destino no está disponible en esa ruta de comando.

    Comportamiento de solo lectura:

    - Cuando el Gateway está en ejecución, estos comandos leen primero desde la instantánea activa.
    - Si la resolución del Gateway está incompleta o el Gateway no está disponible, intentan una alternativa local dirigida para la superficie específica del comando.
    - Si una SecretRef de destino sigue sin estar disponible, el comando continúa con salida degradada de solo lectura y diagnósticos explícitos como "configurada pero no disponible en esta ruta de comando".
    - Este comportamiento degradado es solo local al comando. No debilita el inicio, la recarga ni las rutas de envío/autenticación del runtime.

  </Tab>
</Tabs>

Otras notas:

- La actualización de la instantánea después de la rotación de secretos del backend se gestiona con `openclaw secrets reload`.
- Método RPC del Gateway usado por estas rutas de comando: `secrets.resolve`.

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

No trates la migración como completa hasta que la nueva auditoría esté limpia. Si la auditoría
todavía informa valores en texto sin formato en reposo, el riesgo de acceso del agente sigue presente
incluso cuando las API del runtime devuelven valores redactados.

Si guardas un plan en lugar de aplicarlo durante `configure`, aplica ese plan guardado
con `openclaw secrets apply --from <plan-path>` antes de volver a auditar.

<AccordionGroup>
  <Accordion title="secrets audit">
    Los hallazgos incluyen:

    - valores en texto sin formato en reposo (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generados)
    - restos de encabezados sensibles de proveedor en texto sin formato en entradas `models.json` generadas
    - referencias sin resolver
    - sombreado de precedencia (`auth-profiles.json` con prioridad sobre las referencias de `openclaw.json`)
    - restos heredados (`auth.json`, recordatorios de OAuth)

    Nota sobre exec:

    - De forma predeterminada, la auditoría omite las comprobaciones de resolubilidad de SecretRef exec para evitar efectos secundarios de comandos.
    - Usa `openclaw secrets audit --allow-exec` para ejecutar proveedores exec durante la auditoría.

    Nota sobre restos de encabezados:

    - La detección de encabezados sensibles de proveedor se basa en heurísticas de nombres (nombres comunes de encabezados de autenticación/credenciales y fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Ayudante interactivo que:

    - configura primero `secrets.providers` (`env`/`file`/`exec`, añadir/editar/eliminar)
    - te permite seleccionar campos compatibles que contienen secretos en `openclaw.json` más `auth-profiles.json` para un alcance de agente
    - puede crear una nueva asignación de `auth-profiles.json` directamente en el selector de destino
    - captura detalles de SecretRef (`source`, `provider`, `id`)
    - ejecuta resolución previa
    - puede aplicar inmediatamente

    Nota sobre exec:

    - La comprobación previa omite las comprobaciones de SecretRef exec a menos que `--allow-exec` esté establecido.
    - Si aplicas directamente desde `configure --apply` y el plan incluye referencias/proveedores exec, mantén `--allow-exec` establecido también para el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - eliminar credenciales estáticas coincidentes de `auth-profiles.json` para proveedores de destino
    - eliminar entradas `api_key` estáticas heredadas de `auth.json`
    - eliminar líneas de secretos conocidas coincidentes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Aplica un plan guardado:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota sobre exec:

    - dry-run omite las comprobaciones exec a menos que `--allow-exec` esté establecido.
    - el modo de escritura rechaza planes que contienen SecretRefs/proveedores exec a menos que `--allow-exec` esté establecido.

    Para detalles estrictos del contrato de destino/ruta y reglas exactas de rechazo, consulta [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw no escribe intencionadamente copias de seguridad de reversión que contengan valores históricos de secretos en texto sin formato.
</Warning>

Modelo de seguridad:

- la comprobación previa debe completarse correctamente antes del modo de escritura
- la activación del runtime se valida antes de confirmar
- apply actualiza archivos mediante reemplazo atómico de archivos y restauración de mejor esfuerzo en caso de fallo

## Notas de compatibilidad de autenticación heredada

Para credenciales estáticas, el runtime ya no depende del almacenamiento de autenticación heredado en texto sin formato.

- La fuente de credenciales del runtime es la instantánea resuelta en memoria.
- Las entradas `api_key` estáticas heredadas se eliminan cuando se descubren.
- El comportamiento de compatibilidad relacionado con OAuth permanece separado.

## Nota sobre la interfaz web

Algunas uniones SecretInput son más fáciles de configurar en modo de editor sin procesar que en modo de formulario.

## Relacionado

- [Autenticación](/es/gateway/authentication) — configuración de autenticación
- [CLI: secretos](/es/cli/secrets) — comandos de CLI
- [Variables de entorno](/es/help/environment) — precedencia del entorno
- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) — superficie de credenciales
- [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract) — detalles del contrato del plan
- [Seguridad](/es/gateway/security) — postura de seguridad
