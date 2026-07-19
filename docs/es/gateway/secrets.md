---
read_when:
    - Configuración de SecretRefs para credenciales de proveedores y referencias `auth-profiles.json`
    - Operación segura en producción de la recarga, auditoría, configuración y aplicación de secretos
    - Comprender el fallo rápido durante el inicio, el filtrado de superficies inactivas y el comportamiento basado en la última configuración válida conocida
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato SecretRef, comportamiento de las instantáneas en tiempo de ejecución y depuración unidireccional segura'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-07-19T01:59:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17076666f1b26c379436792704575a171e183343a62a9a6b4e2ece17ec8d10d0
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw admite SecretRefs aditivas para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

<Note>
El texto sin formato sigue funcionando. Las SecretRefs son opcionales para cada credencial.
</Note>

<Warning>
Las credenciales en texto sin formato siguen siendo legibles por el agente si se encuentran en archivos que este puede inspeccionar, incluidos `openclaw.json`, `auth-profiles.json`, `.env` o los archivos `agents/*/agent/models.json` generados. Las SecretRefs solo reducen ese radio de impacto local una vez que se hayan migrado todas las credenciales compatibles y `openclaw secrets audit --check` no informe de residuos de texto sin formato.
</Warning>

## Modelo de ejecución

- Los secretos se resuelven en una instantánea de ejecución en memoria, de forma anticipada durante la activación, no de forma diferida en las rutas de las solicitudes.
- El inicio en frío del Gateway aísla un fallo reintentable de SecretRef en un propietario conocido ajeno al Gateway cuando dicho propietario admite el aislamiento. Las clases de propietarios asignadas incluyen proveedores de modelos y Skills, proveedores de contenido multimedia/TTS/cron, perfiles de autenticación aptos, memoria por agente, SSH del entorno aislado, cuentas de canales y rutas de plugins declaradas en el manifiesto. El Gateway se inicia, registra al propietario como configurado pero no disponible y emite una advertencia de degradación censurada. La autenticación de entrada del Gateway, las referencias o los valores resueltos estructuralmente no válidos, los propietarios con cierre ante fallos y las referencias cuyo propietario de ejecución no esté asignado siguen provocando un fallo de inicio.
- La recarga valida cada propietario asignado de forma independiente y luego publica una única instantánea atómica. Los propietarios en buen estado se actualizan. Un propietario apto que haya fallado conserva su último valor válido conocido y pasa a estar obsoleto solo cuando no cambian las identidades de sus referencias, las definiciones de los proveedores ni el contrato completo no secreto del propietario; un propietario nuevo o modificado que falle pasa a estar en frío. Un fallo estricto rechaza la recarga y conserva la instantánea activa.
- Las infracciones de las políticas (por ejemplo, un perfil de autenticación en modo OAuth combinado con una entrada SecretRef) impiden la activación antes de sustituir el entorno de ejecución.
- Las solicitudes de ejecución solo leen la instantánea activa en memoria. Las credenciales SecretRef de proveedores de modelos pasan por el almacenamiento de autenticación y las opciones de transmisión como centinelas locales del proceso hasta la salida. Las rutas de entrega saliente (entrega de respuestas/hilos de Discord y envíos de acciones de Telegram) también leen esa instantánea y no vuelven a resolver las referencias en cada envío.

Esto evita que las interrupciones de los proveedores de secretos afecten a las rutas críticas de las solicitudes.

La protección de entrada del Gateway, las configuraciones o los valores resueltos estructuralmente no válidos, las infracciones de las políticas y la propiedad desconocida siguen provocando un cierre ante fallos. Los propietarios aislados nunca recurren a una fuente de credenciales de menor precedencia.

## Inserción en el momento de la salida (centinelas)

Para las credenciales de proveedores de modelos respaldadas por SecretRefs, OpenClaw genera un centinela opaco y local del proceso durante la resolución de la autenticación del modelo. Por tanto, el almacenamiento de autenticación, las opciones de transmisión, la configuración del SDK, los registros, los objetos de error y la mayor parte de la introspección del entorno de ejecución ven un valor como `oc-sent-v1-...`, no la credencial del proveedor. La solicitud fetch protegida del modelo y las sondas de estado administradas de los proveedores locales sustituyen los centinelas conocidos en los valores de URL y cabeceras inmediatamente antes de que cada solicitud abandone el proceso.

Los valores desconocidos con forma de centinela provocan un cierre ante fallos antes de que se produzca actividad de red. OpenClaw se niega a enviar la solicitud en lugar de reenviar a un proveedor un centinela sin resolver. Los valores de secretos resueltos también se registran para censurarlos de los registros mediante coincidencia exacta de valores como medida de defensa en profundidad.

Los adaptadores de proveedores utilizan el último punto de inserción que admite su SDK:

- Los SDK con una opción de fetch personalizada reciben la solicitud fetch protegida de OpenClaw, por lo que el SDK conserva el centinela.
- Los SDK sin una opción de fetch personalizada extraen el centinela inmediatamente antes de construir el cliente. Las transmisiones de proveedores propiedad de plugins y los entornos de agentes lo extraen en la transferencia final propiedad del núcleo, porque esos transportes no comparten la solicitud fetch protegida de OpenClaw.

Los centinelas reducen la exposición del texto sin formato en toda la cadena de llamadas al modelo, pero no proporcionan aislamiento de procesos. El valor real sigue existiendo en la memoria del mismo proceso y aparece en el límite del adaptador final. Las credenciales de entorno en texto sin formato que no se configuran mediante SecretRefs permanecen como texto sin formato y quedan fuera de este mecanismo.

Establezca `OPENCLAW_SECRET_SENTINELS=off` (también acepta `0` o `false`, sin distinción entre mayúsculas y minúsculas) para desactivar la generación de centinelas durante la respuesta a incidentes o la resolución de problemas de compatibilidad. El interruptor de emergencia no desactiva el registro de la censura por coincidencia exacta de valores.

## Límite de acceso del agente

Las SecretRefs impiden que las credenciales persistan en la configuración y en los archivos de modelos generados, pero no constituyen un límite de aislamiento de procesos. Una credencial en texto sin formato que permanezca en el disco en una ruta que el agente pueda leer seguirá siendo accesible mediante herramientas de archivos o del shell, omitiendo la censura en el nivel de la API.

En implementaciones de producción donde los archivos accesibles por el agente estén dentro del ámbito, la migración solo debe considerarse completa cuando se cumplan todas estas condiciones:

- Las credenciales compatibles utilizan SecretRefs en lugar de valores en texto sin formato.
- Los residuos heredados de texto sin formato se eliminan de `openclaw.json`, `auth-profiles.json`, `.env` y de los archivos `models.json` generados.
- `openclaw secrets audit --check` queda limpio después de la migración.
- Las credenciales restantes no compatibles o rotativas están protegidas mediante aislamiento del sistema operativo, aislamiento de contenedores o un proxy de credenciales externo.

Por este motivo, el flujo de auditoría/configuración/aplicación es una puerta de seguridad para la migración, no solo una herramienta práctica.

<Warning>
Las SecretRefs no hacen que los archivos legibles arbitrarios sean seguros. Las copias de seguridad, las configuraciones copiadas, los catálogos de modelos generados antiguos y las clases de credenciales no compatibles siguen siendo secretos de producción hasta que se eliminen, se trasladen fuera del límite de confianza del agente o se aíslen por separado.
</Warning>

## Filtrado de superficies activas

Las SecretRefs solo se validan en las superficies efectivamente activas:

- **Superficies habilitadas**: los fallos reintentables de propietarios asignados y aislables entran en degradación en frío u obsoleta. Los fallos estrictos, con cierre ante fallos, requeridos por el Gateway o no asignados bloquean el inicio o la recarga.
- **Superficies inactivas**: las referencias sin resolver no bloquean el inicio ni la recarga; emiten un diagnóstico no fatal `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Ejemplos de superficies inactivas">
- Entradas de canales o cuentas deshabilitadas.
- Credenciales de canal de nivel superior que no hereda ninguna cuenta habilitada.
- Superficies de herramientas o funciones deshabilitadas.
- Claves específicas de proveedores de búsqueda web no seleccionadas por `tools.web.search.provider`. En modo automático (proveedor sin establecer), las claves se consultan por precedencia para la detección automática hasta que una se resuelva; tras la selección, las claves de los proveedores no seleccionados quedan inactivas.
- El material de autenticación SSH del entorno aislado (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, además de las anulaciones por agente) solo está activo cuando el backend efectivo del entorno aislado es `ssh` y el modo del entorno aislado no es `off`, para el agente predeterminado o un agente habilitado.
- Las SecretRefs `gateway.remote.token` / `gateway.remote.password` están activas si se cumple cualquiera de estas condiciones:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` es `serve` o `funnel`
  - En modo local sin esas superficies remotas: `gateway.remote.token` está activo cuando puede prevalecer la autenticación mediante token y no hay configurado ningún token de entorno/autenticación; `gateway.remote.password` solo está activo cuando puede prevalecer la autenticación mediante contraseña y no hay configurada ninguna contraseña de entorno/autenticación.
- La SecretRef `gateway.auth.token` está inactiva para la resolución de autenticación al inicio cuando se establece `OPENCLAW_GATEWAY_TOKEN`, porque la entrada del token de entorno prevalece en ese entorno de ejecución.

</Accordion>

## Diagnósticos de la superficie de autenticación del Gateway

Cuando se establece una SecretRef en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el inicio o la recarga del Gateway registra el estado de la superficie con el código `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: la SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: prevalece otra superficie de autenticación o la autenticación remota está deshabilitada o inactiva.

La entrada de registro incluye el motivo utilizado por la política de superficies activas.

## Comprobación previa de referencias durante la incorporación

En la incorporación interactiva, al elegir el almacenamiento mediante SecretRef se ejecuta una validación previa antes de guardar:

- Referencias de entorno: valida el nombre de la variable de entorno y confirma que haya un valor no vacío visible durante la configuración.
- Referencias de proveedores (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Flujo de inicio rápido: cuando `gateway.auth.token` ya es una SecretRef, la incorporación la resuelve antes de la sonda y del arranque del panel (para las referencias `env`, `file` y `exec`) mediante la misma puerta de fallo inmediato.

Si la validación falla, se muestra el error y se permite volver a intentarlo.

## Contrato de SecretRef

Una única estructura de objeto en todas partes:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    También se aceptan cadenas abreviadas en los campos SecretInput:

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
    - `id` debe ser un puntero JSON absoluto (`/...`) o el literal `value` para los proveedores `singleValue`
    - Escape de RFC 6901 en segmentos: `~` se convierte en `~0`, `/` se convierte en `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validación:

    - `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
    - `id` debe coincidir con `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (admite selectores como `secret#json_key`)
    - `id` no debe contener `.` ni `..` como segmentos de ruta delimitados por barras (por ejemplo, se rechaza `a/../b`)

  </Tab>
</Tabs>

## Configuración de proveedores

Defina los proveedores en `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // o "singleValue"
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

<Accordion title="Proveedor de entorno">
- Lista opcional de nombres exactos permitidos mediante `allowlist`.
- Los valores de entorno ausentes o vacíos provocan un fallo de resolución.

</Accordion>

<Accordion title="Proveedor de archivos">
- Lee el archivo local en `path`.
- `mode: "json"` (valor predeterminado) espera una carga útil de objeto JSON y resuelve `id` como un puntero JSON.
- `mode: "singleValue"` espera el identificador de referencia `"value"` y devuelve el contenido sin procesar del archivo (sin el salto de línea final).
- La ruta debe superar las comprobaciones de propiedad y permisos; `timeoutMs` (valor predeterminado: 5000) y `maxBytes` (valor predeterminado: 1 MiB) limitan la lectura.
- Cierre seguro en Windows: si la verificación de ACL no está disponible para la ruta, la resolución falla. Solo para rutas de confianza, establezca `allowInsecurePath: true` en ese proveedor para omitir la comprobación.

</Accordion>

<Accordion title="Proveedor de ejecución">
- Ejecuta directamente la ruta absoluta configurada del binario, sin shell.
- De forma predeterminada, `command` debe ser un archivo normal, no un enlace simbólico. Establezca `allowSymlinkCommand: true` para permitir rutas de comandos con enlaces simbólicos (por ejemplo, enlaces de Homebrew) y combínelo con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`) para que solo sean válidas las rutas del gestor de paquetes.
- Admite `timeoutMs` (valor predeterminado: 5000), `noOutputTimeoutMs` (el valor predeterminado es igual a `timeoutMs`), `maxOutputBytes` (valor predeterminado: 1 MiB), la lista de permitidos `env`/`passEnv` y `trustedDirs`.
- El valor predeterminado de `jsonOnly` es `true`. Con `jsonOnly: false` y un único identificador solicitado, la salida estándar de texto sin formato que no sea JSON se acepta como valor de ese identificador.
- Cierre seguro en Windows: si la verificación de ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, establezca `allowInsecurePath: true` en ese proveedor para omitir la comprobación.
- Los proveedores de ejecución administrados por plugins pueden usar `pluginIntegration` en lugar de copiar `command`/`args`. OpenClaw resuelve los detalles actuales del comando a partir del manifiesto del plugin instalado durante el inicio o la recarga; si el plugin está deshabilitado, se elimina, deja de ser de confianza o ya no declara la integración, las SecretRefs activas de ese proveedor se cierran de forma segura.

Carga útil de la solicitud (entrada estándar):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Carga útil de la respuesta (salida estándar):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: permitir secreto en lista de permitidos
```

Errores opcionales por identificador:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` es un diagnóstico opcional legible por máquina. OpenClaw muestra los códigos
reconocidos `NOT_FOUND` y `AMBIGUOUS_DUPLICATE_KEY` junto con el proveedor y el identificador de referencia. Se aceptan otros
códigos y campos de formato libre, como `message`, para mantener la compatibilidad con la versión 1 del protocolo,
pero no se muestran porque la salida del resolutor puede contener material de credenciales.

</Accordion>

## Claves de API respaldadas por archivos

No coloque cadenas `file:...` en el bloque `env` de la configuración. Ese bloque es literal y no permite sobrescritura, por lo que `file:...` nunca se resuelve allí.

En su lugar, use una SecretRef de archivo en un campo de credenciales compatible:

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

Para `mode: "singleValue"`, la `id` de SecretRef es `"value"`. Para `mode: "json"`, use un puntero JSON absoluto, como `"/providers/xai/apiKey"`.

Consulte [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) para conocer los campos que aceptan SecretRefs.

## Ejemplos de integración de ejecución

Para consultar una guía específica de 1Password que abarca las cuentas de servicio, la skill de agente incluida y la solución de problemas, consulte [1Password](/es/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI de 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // necesario para binarios de Homebrew con enlaces simbólicos
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
    Use un contenedor de resolución para asignar los identificadores de SecretRef a las claves de elementos de Bitwarden Secrets Manager. El repositorio incluye `scripts/secrets/openclaw-bws-resolver.mjs`; instálelo o cópielo en una ruta absoluta de confianza del host que ejecuta el Gateway.

    Requisitos:

    - CLI de Bitwarden Secrets Manager (`bws`) instalada en el host del Gateway.
    - `BWS_ACCESS_TOKEN` disponible para el servicio del Gateway.
    - `PATH` pasado al resolutor, o `BWS_BIN` establecido en la ruta absoluta del binario `bws`.
    - `BWS_SERVER_URL` establecido en el entorno cuando se usa una instancia de Bitwarden con alojamiento propio.

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

    El resolutor agrupa los identificadores solicitados, ejecuta `bws secret list` y devuelve los valores de los campos `key` secretos coincidentes. Use claves que cumplan el contrato de identificadores de SecretRef de ejecución, como `openclaw/providers/openai/apiKey`; las claves con formato de variable de entorno y guiones bajos se rechazan antes de ejecutar el resolutor. Si más de un secreto visible de Bitwarden comparte la clave solicitada, el resolutor marca ese identificador como ambiguo en lugar de hacer una suposición. Después de actualizar la configuración, verifique la ruta del resolutor:

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
            allowSymlinkCommand: true, // necesario para binarios de Homebrew con enlaces simbólicos
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
    Use un pequeño contenedor de resolución para asignar directamente los identificadores de SecretRef a las entradas de `pass`. Guárdelo como ejecutable en una ruta absoluta que supere las comprobaciones de ruta del proveedor de ejecución, por ejemplo, `/usr/local/bin/openclaw-pass-resolver`. La línea shebang `#!/usr/bin/env node` resuelve `node` desde el `PATH` del proceso del resolutor, por lo que debe incluir `PATH` en `passEnv`. Si `pass` no se encuentra en ese `PATH`, establezca `PASS_BIN` en el entorno principal e inclúyalo también en `passEnv`:

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
        process.stderr.write(`No se pudo analizar la solicitud: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass finalizó con ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    A continuación, configure el proveedor de ejecución y dirija `apiKey` a la ruta de entrada de `pass`:

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

    Mantenga el secreto en la primera línea de la entrada de `pass`, o personalice el contenedor para que devuelva en su lugar la salida completa de `pass show`. Después de actualizar la configuración, verifique tanto la auditoría estática como la ruta del resolutor de ejecución:

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
            allowSymlinkCommand: true, // necesario para binarios de Homebrew con enlaces simbólicos
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

Las variables de entorno del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` aceptan SecretInput, lo que mantiene las claves de API y los tokens fuera de la configuración en texto sin formato:

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

Los valores de cadena de texto sin formato siguen funcionando. Las referencias de plantillas de entorno como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del Gateway, antes de que se inicie el proceso del servidor MCP. Al igual que en otras superficies de SecretRef, las referencias sin resolver solo bloquean la activación cuando el plugin `acpx` está efectivamente activo.

## Material de autenticación SSH del entorno aislado

El backend principal de entorno aislado `ssh` también admite SecretRefs para el material de autenticación SSH:

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

- OpenClaw resuelve estas referencias durante la activación del entorno aislado, no de forma diferida en cada llamada SSH.
- Los valores resueltos se escriben en un directorio temporal con permisos de archivo restrictivos (`0o600`) y se utilizan en la configuración SSH generada.
- Si el backend efectivo del entorno aislado no es `ssh` (o el modo del entorno aislado es `off`), estas referencias permanecen inactivas y no bloquean el inicio.

## Superficie de credenciales admitida

Las credenciales admitidas y no admitidas canónicas se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).

<Note>
Las credenciales generadas en tiempo de ejecución o rotatorias y el material de actualización de OAuth se excluyen intencionadamente de la resolución de solo lectura de SecretRef.
</Note>

## Comportamiento requerido y precedencia

- Campo sin referencia: sin cambios.
- Campo con referencia: obligatorio en las superficies activas durante la activación.
- Si están presentes tanto el texto sin formato como la referencia, esta última tiene precedencia en las rutas de precedencia admitidas.
- El centinela de ocultación `__OPENCLAW_REDACTED__` está reservado para la ocultación/restauración interna de la configuración y se rechaza como dato literal de configuración enviado.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia en tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales `auth-profiles.json` tienen precedencia sobre las referencias `openclaw.json`)

Compatibilidad con Google Chat: `serviceAccountRef` tiene precedencia sobre `serviceAccount` en texto sin formato; el valor en texto sin formato se ignora una vez que se establece la referencia relacionada.

## Desencadenadores de activación

La activación de secretos se ejecuta durante:

- El inicio (comprobación previa más activación final)
- La ruta de aplicación en caliente de la recarga de configuración
- La ruta de comprobación de reinicio de la recarga de configuración
- La recarga manual mediante `secrets.reload`
- La comprobación previa de RPC de escritura de configuración del Gateway (`config.set` / `config.apply` / `config.patch`), que valida las SecretRefs de las superficies activas dentro de la carga útil de configuración enviada antes de guardar las modificaciones

Contrato de activación:

- Si se realiza correctamente, reemplaza la instantánea de forma atómica.
- Un fallo estricto durante el inicio interrumpe el inicio del Gateway.
- Durante un inicio en frío, un fallo de resolución reintentable de un propietario asignado, aislable y ajeno al Gateway puede publicar la instantánea con ese propietario exacto configurado como no disponible. Las solicitudes para el propietario fallan con `SECRET_SURFACE_UNAVAILABLE`; los propietarios de proveedores de modelos no recurren a credenciales del entorno o del perfil de autenticación después de que falle una referencia explícita.
- La recarga y la comprobación de reinicio aíslan a los propietarios asignados aptos. Las identidades de referencia sin cambios, con definiciones de proveedor sin cambios y un contrato de propietario completo y no secreto sin cambios, conservan sus valores válidos más recientes exactos como obsoletos; las referencias sin resolver modificadas o recién configuradas se publican en frío solo para ese propietario. Un fallo estricto de recarga conserva la instantánea activa anterior.
- `config.set`, `config.apply` y `config.patch` aceptan referencias sin resolver sintácticamente válidas para propietarios aislables y devuelven un informe `degradedSecretOwners` ocultado. La autenticación de entrada del Gateway, una configuración o unos valores resueltos estructuralmente no válidos, las infracciones de políticas y los propietarios desconocidos se siguen rechazando antes de modificar el disco.
- Los propietarios relacionados en buen estado se resuelven y publican normalmente incluso cuando otro propietario está en frío u obsoleto.
- Proporcionar un token de canal explícito por llamada a una llamada saliente de una función auxiliar o herramienta no desencadena la activación de SecretRef; los puntos de activación siguen siendo el inicio, la recarga y el `secrets.reload` explícito.

## Señales de degradación y recuperación

Cuando la activación durante la recarga falla después de un estado correcto, OpenClaw entra en un estado degradado de secretos y emite eventos del sistema de una sola vez y códigos de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: los propietarios en buen estado se actualizan, los propietarios obsoletos conservan el último valor válido conocido y los propietarios en frío siguen sin estar disponibles.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos cuando el estado ya está degradado registran advertencias, pero no vuelven a emitir el evento.
- Un fallo estricto durante el inicio nunca emite un evento de degradación, ya que el tiempo de ejecución nunca llegó a estar activo. Un inicio correcto con propietarios en frío registra la degradación de los propietarios, pero no emite un evento del recargador.
- Los fallos de inicio y recarga circunscritos a referencias emiten una advertencia estructurada `SECRETS_DEGRADED` para cada propietario afectado. Las interrupciones circunscritas a un proveedor emiten una advertencia `SECRETS_PROVIDER_DEGRADED` con el proveedor y la lista completa de propietarios afectados, en lugar de repetir el fallo del proveedor por cada propietario. Las advertencias incluyen un motivo ocultado, el estado del propietario `cold` o `stale` y la indicación de reintento `openclaw secrets reload`. Nunca incluyen valores resueltos ni identificadores de SecretRef.
- `openclaw doctor` enumera los propietarios en frío y obsoletos con sus rutas de configuración afectadas, el motivo ocultado y las instrucciones de reintento.

## Resolución en rutas de comandos

Las rutas de comandos pueden optar por la resolución admitida de SecretRef mediante una RPC de instantánea del Gateway. Se aplican dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comandos estrictas">
    Por ejemplo, las rutas de memoria remota `openclaw memory` y `openclaw qr --remote` cuando necesita referencias remotas de secretos compartidos. Leen de la instantánea activa y fallan de inmediato cuando una SecretRef obligatoria no está disponible.
  </Tab>
  <Tab title="Rutas de comandos de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y los flujos de reparación de doctor/configuración de solo lectura. También prefieren la instantánea activa, pero se degradan en lugar de interrumpirse cuando una SecretRef específica no está disponible.

    Comportamiento de solo lectura:

    - Cuando el Gateway está en ejecución, estos comandos leen primero de la instantánea activa.
    - Si la resolución del Gateway está incompleta o el Gateway no está disponible, intentan una alternativa local específica para esa superficie de comandos.
    - Si una SecretRef específica sigue sin estar disponible, el comando continúa con una salida degradada de solo lectura y un diagnóstico explícito que indica que la referencia está configurada, pero no disponible en esta ruta de comandos.
    - Este comportamiento degradado solo se aplica localmente al comando; no debilita las rutas de inicio, recarga, envío o autenticación del tiempo de ejecución.

  </Tab>
</Tabs>

Otras notas:

- La actualización de la instantánea después de la rotación de secretos del backend se gestiona mediante `openclaw secrets reload`.
- Método RPC del Gateway utilizado por estas rutas de comandos: `secrets.resolve`.

## Flujo de auditoría y configuración

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

No se debe considerar completada la migración hasta que la nueva auditoría no presente problemas. Si la auditoría sigue informando de valores en texto sin formato almacenados, el riesgo de acceso por parte del agente permanece incluso cuando las API del tiempo de ejecución devuelven valores ocultados.

Si se guarda un plan en lugar de aplicarlo durante `configure`, se debe aplicar ese plan guardado con `openclaw secrets apply --from <plan-path>` antes de volver a auditar.

<AccordionGroup>
  <Accordion title="secrets audit">
    Los hallazgos incluyen:

    - Valores en texto sin formato almacenados (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado).
    - Residuos de encabezados sensibles del proveedor en texto sin formato en las entradas `models.json` generadas.
    - Referencias sin resolver.
    - Ocultación por precedencia (`auth-profiles.json` tiene prioridad sobre las referencias `openclaw.json`).
    - Residuos heredados (`auth.json`, recordatorios de OAuth).

    Nota sobre exec: de forma predeterminada, la auditoría omite las comprobaciones de resolubilidad de SecretRef de exec para evitar efectos secundarios de los comandos. Se debe usar `openclaw secrets audit --allow-exec` para ejecutar proveedores exec durante la auditoría.

    Nota sobre residuos de encabezados: la detección de encabezados sensibles del proveedor se basa en heurísticas de nombres (nombres comunes de encabezados de autenticación/credenciales y fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Función auxiliar interactiva que:

    - Configura primero `secrets.providers` (`env`/`file`/`exec`, añadir/editar/eliminar).
    - Permite seleccionar campos admitidos que contienen secretos en `openclaw.json`, además de `auth-profiles.json`, para el ámbito de un agente.
    - Puede crear una nueva asignación `auth-profiles.json` directamente en el selector de destino.
    - Recopila los detalles de SecretRef (`source`, `provider`, `id`).
    - Ejecuta la resolución previa y puede aplicarla inmediatamente.

    Nota sobre exec: la comprobación previa omite las comprobaciones de SecretRef de exec salvo que se establezca `--allow-exec`. Si se aplica directamente desde `configure --apply` y el plan incluye referencias o proveedores exec, se debe mantener también establecido `--allow-exec` durante el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - Elimina las credenciales estáticas coincidentes de `auth-profiles.json` para los proveedores seleccionados.
    - Elimina las entradas estáticas heredadas `api_key` de `auth.json`.
    - Elimina las líneas de secretos conocidas coincidentes de los archivos `.env` del estado efectivo y de la configuración activa (se eliminan los duplicados cuando ambas rutas coinciden).

  </Accordion>
  <Accordion title="secrets apply">
    Aplicar un plan guardado:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota sobre exec: la ejecución de prueba omite las comprobaciones de exec salvo que se establezca `--allow-exec`; el modo de escritura rechaza los planes que contengan SecretRefs o proveedores exec salvo que se establezca `--allow-exec`.

    Para conocer los detalles estrictos del contrato de destino/ruta y las reglas exactas de rechazo, se debe consultar [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw no escribe intencionadamente copias de seguridad para reversión que contengan valores secretos históricos en texto sin formato.
</Warning>

Modelo de seguridad:

- La comprobación previa debe realizarse correctamente antes del modo de escritura.
- La activación del tiempo de ejecución se valida antes de confirmar los cambios.
- La aplicación actualiza los archivos mediante su reemplazo atómico y realiza una restauración de mejor esfuerzo en caso de fallo.

## Notas sobre compatibilidad con la autenticación heredada

Para las credenciales estáticas, el tiempo de ejecución ya no depende del almacenamiento de autenticación heredado en texto sin formato.

- La fuente de credenciales en tiempo de ejecución es la instantánea resuelta en memoria.
- Las entradas estáticas heredadas de `api_key` se eliminan al detectarse.
- El comportamiento de compatibilidad relacionado con OAuth permanece separado.

## Nota sobre la interfaz web

Algunas uniones SecretInput son más fáciles de configurar en el modo de editor sin formato que en el modo de formulario.

## Temas relacionados

- [Autenticación](/es/gateway/authentication) - configuración de autenticación
- [CLI: secretos](/es/cli/secrets) - comandos de la CLI
- [SecretRefs de Vault](/es/plugins/vault) - configuración del proveedor HashiCorp Vault
- [Variables de entorno](/es/help/environment) - precedencia de las variables de entorno
- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) - superficie de credenciales
- [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract) - detalles del contrato del plan
- [Seguridad](/es/gateway/security) - postura de seguridad
