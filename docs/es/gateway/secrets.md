---
read_when:
    - Configuración de SecretRefs para credenciales de proveedores y referencias `auth-profiles.json`
    - Gestionar de forma segura en producción la recarga, auditoría, configuración y aplicación de secretos
    - Comprender el fallo rápido durante el inicio, el filtrado de superficies inactivas y el comportamiento de la última configuración válida conocida
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato SecretRef, comportamiento de las instantáneas en tiempo de ejecución y depuración unidireccional segura'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-07-22T10:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d10989ebbce367c68d28768244d4e3649028af5ab63c9523974352c270a3c55e
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw admite SecretRefs aditivas para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

<Note>
El texto sin formato sigue funcionando. Las SecretRefs son opcionales para cada credencial.
</Note>

<Warning>
Las credenciales en texto sin formato siguen siendo legibles por el agente si se encuentran en archivos que este puede inspeccionar, incluidos `openclaw.json`, `auth-profiles.json`, `.env` o los archivos `agents/*/agent/models.json` generados. Las SecretRefs solo reducen ese radio de impacto local una vez que se hayan migrado todas las credenciales compatibles y `openclaw secrets audit --check` no indique residuos de texto sin formato.
</Warning>

## Modelo de ejecución

- Los secretos se resuelven en una instantánea de ejecución en memoria, de forma anticipada durante la activación, no de forma diferida en las rutas de solicitud.
- El inicio en frío del Gateway aísla un fallo reintentable de SecretRef en un propietario conocido ajeno al Gateway cuando dicho propietario admite el aislamiento. Las clases de propietarios asignadas incluyen proveedores de modelos y Skills, proveedores de contenido multimedia/TTS/cron, perfiles de autenticación aptos, memoria por agente, SSH del entorno aislado, cuentas de canales y rutas de plugins declaradas en el manifiesto. El Gateway se inicia, registra al propietario como configurado pero no disponible y emite una advertencia de degradación con la información confidencial censurada. La autenticación de entrada del Gateway, las referencias o los valores resueltos que sean estructuralmente inválidos, los propietarios con cierre ante fallos y las referencias cuyo propietario en tiempo de ejecución no esté asignado siguen impidiendo el inicio.
- La recarga valida cada propietario asignado de manera independiente y, a continuación, publica una única instantánea atómica. Los propietarios en buen estado se actualizan. Un propietario apto que presente un fallo conserva su último valor válido conocido y solo pasa a estar obsoleto cuando sus identidades de referencia, definiciones de proveedor y contrato completo no secreto del propietario permanecen sin cambios; un propietario nuevo o modificado que presente un fallo pasa a estar frío. Un fallo estricto rechaza la recarga y conserva la instantánea activa.
- Las infracciones de políticas (por ejemplo, un perfil de autenticación en modo OAuth combinado con una entrada SecretRef) impiden la activación antes de sustituir la instantánea de ejecución.
- Las solicitudes en tiempo de ejecución solo leen la instantánea activa en memoria. Las credenciales SecretRef de proveedores de modelos atraviesan el almacenamiento de autenticación y las opciones de transmisión como centinelas locales al proceso hasta la salida. Las rutas de entrega saliente (entrega de respuestas/hilos de Discord y envíos de acciones de Telegram) también leen esa instantánea y no vuelven a resolver las referencias en cada envío.

Esto evita que las interrupciones de los proveedores de secretos afecten a las rutas críticas de solicitud.

La protección de entrada del Gateway, la configuración o los valores resueltos estructuralmente inválidos, las infracciones de políticas y la propiedad desconocida siguen provocando un cierre ante fallos. Los propietarios aislados nunca recurren a una fuente de credenciales de menor precedencia.

## Inyección en el momento de la salida (centinelas)

Para las credenciales de proveedores de modelos respaldadas por SecretRefs, OpenClaw genera un centinela opaco y local al proceso durante la resolución de la autenticación del modelo. Por lo tanto, el almacenamiento de autenticación, las opciones de transmisión, la configuración del SDK, los registros, los objetos de error y la mayor parte de la introspección en tiempo de ejecución ven un valor como `oc-sent-v1-...`, no la credencial del proveedor. La obtención protegida del modelo y las sondas de estado administradas de proveedores locales sustituyen los centinelas conocidos en los valores de URL y encabezados inmediatamente antes de que cada solicitud salga del proceso.

Los valores desconocidos con forma de centinela provocan un cierre ante fallos antes de cualquier actividad de red. OpenClaw se niega a enviar la solicitud en lugar de reenviar un centinela sin resolver a un proveedor. Los valores secretos resueltos también se registran para su censura exacta en los registros como medida de defensa en profundidad.

Los adaptadores de proveedores utilizan el punto de inyección más tardío que admite su SDK:

- Los SDK con una opción de obtención personalizada reciben la función de obtención protegida de OpenClaw, por lo que el SDK conserva el centinela.
- Los SDK sin una opción de obtención personalizada desempaquetan el centinela inmediatamente antes de construir el cliente. Las transmisiones de proveedores propiedad de plugins y los entornos de agentes lo desempaquetan en la última transferencia controlada por el núcleo, porque esos transportes no comparten la función de obtención protegida de OpenClaw.

Los centinelas reducen la exposición del texto sin formato en toda la cadena de llamadas al modelo, pero no proporcionan aislamiento de procesos. El valor real sigue existiendo en la memoria del mismo proceso y aparece en el límite final del adaptador. Las credenciales de entorno en texto sin formato que no estén configuradas mediante SecretRefs permanecen como texto sin formato y quedan fuera de este mecanismo.

Establezca `OPENCLAW_SECRET_SENTINELS=off` (también acepta `0` o `false`, sin distinguir entre mayúsculas y minúsculas) para deshabilitar la generación de centinelas durante la respuesta a incidentes o la resolución de problemas de compatibilidad. El interruptor de emergencia no deshabilita el registro de censura por valor exacto.

## Límite de acceso del agente

Las SecretRefs impiden que las credenciales se conserven en la configuración y en los archivos de modelos generados, pero no constituyen un límite de aislamiento de procesos. Una credencial en texto sin formato que permanezca en el disco, en una ruta que el agente pueda leer, seguirá siendo accesible mediante herramientas de archivos o del shell, lo que elude la censura a nivel de API.

En las implementaciones de producción donde los archivos accesibles por el agente formen parte del ámbito, considere que la migración está completa solo cuando se cumplan todas estas condiciones:

- Las credenciales compatibles utilizan SecretRefs en lugar de valores en texto sin formato.
- Los residuos heredados de texto sin formato se han eliminado de `openclaw.json`, `auth-profiles.json`, `.env` y los archivos `models.json` generados.
- `openclaw secrets audit --check` no muestra problemas después de la migración.
- Todas las credenciales restantes no compatibles o sujetas a rotación están protegidas mediante aislamiento del sistema operativo, aislamiento de contenedores o un proxy externo de credenciales.

Por eso, el flujo de auditoría/configuración/aplicación es una puerta de seguridad para la migración, no solo una herramienta auxiliar de comodidad.

<Warning>
Las SecretRefs no hacen que cualquier archivo legible sea seguro. Las copias de seguridad, las configuraciones copiadas, los catálogos antiguos de modelos generados y las clases de credenciales no compatibles siguen siendo secretos de producción hasta que se eliminen, se trasladen fuera del límite de confianza del agente o se aíslen por separado.
</Warning>

## Filtrado de superficies activas

Las SecretRefs solo se validan en superficies efectivamente activas:

- **Superficies habilitadas**: los fallos reintentables de propietarios asignados y aislables entran en degradación fría u obsoleta. Los fallos estrictos, con cierre ante fallos, requeridos por el Gateway o sin asignar bloquean el inicio o la recarga.
- **Superficies inactivas**: las referencias sin resolver no bloquean el inicio ni la recarga; emiten un diagnóstico `SECRETS_REF_IGNORED_INACTIVE_SURFACE` no fatal.

<Accordion title="Ejemplos de superficies inactivas">
- Entradas de canales/cuentas deshabilitadas.
- Credenciales de canal de nivel superior que no hereda ninguna cuenta habilitada.
- Superficies de herramientas/funciones deshabilitadas.
- Claves específicas de proveedores de búsqueda web no seleccionadas por `tools.web.search.provider`. En modo automático (sin proveedor configurado), las claves se consultan por orden de precedencia para la detección automática hasta que una se resuelve; tras la selección, las claves de proveedores no seleccionados quedan inactivas.
- El material de autenticación SSH del entorno aislado (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, además de las anulaciones por agente) solo está activo cuando el backend efectivo del entorno aislado es `ssh` y el modo del entorno aislado no es `off`, para el agente predeterminado o un agente habilitado.
- Las SecretRefs `gateway.remote.token` / `gateway.remote.password` están activas si se cumple cualquiera de estas condiciones:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` es `serve` o `funnel`
  - En modo local sin esas superficies remotas: `gateway.remote.token` está activo cuando puede prevalecer la autenticación mediante token y no hay ningún token de entorno/autenticación configurado; `gateway.remote.password` solo está activo cuando puede prevalecer la autenticación mediante contraseña y no hay ninguna contraseña de entorno/autenticación configurada.
- La SecretRef `gateway.auth.token` está inactiva para la resolución de autenticación al inicio cuando se establece `OPENCLAW_GATEWAY_TOKEN`, porque la entrada del token de entorno prevalece para ese entorno de ejecución.

</Accordion>

## Diagnósticos de la superficie de autenticación del Gateway

Cuando se establece una SecretRef en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el inicio o la recarga del Gateway registra el estado de la superficie con el código `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: la SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: prevalece otra superficie de autenticación, o la autenticación remota está deshabilitada o inactiva.

La entrada del registro incluye el motivo empleado por la política de superficies activas.

## Comprobación previa de referencias durante la incorporación

En la incorporación interactiva, al elegir el almacenamiento mediante SecretRef se ejecuta una validación previa antes de guardar:

- Referencias de entorno: valida el nombre de la variable de entorno y confirma que durante la configuración sea visible un valor no vacío.
- Referencias de proveedor (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Flujo de inicio rápido: cuando `gateway.auth.token` ya es una SecretRef, la incorporación la resuelve antes de la inicialización de la sonda o del panel (para las referencias `env`, `file` y `exec`) mediante la misma puerta de fallo rápido.

Un fallo de validación muestra el error y permite volver a intentarlo.

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
    - Escape de RFC 6901 en los segmentos: `~` se convierte en `~0`, `/` se convierte en `~1`

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
  },
}
```

<Accordion title="Proveedor de entorno">
- Lista de permitidos opcional de nombres exactos mediante `allowlist`.
- Los valores de entorno ausentes o vacíos hacen que la resolución falle.

</Accordion>

<Accordion title="Proveedor de archivos">
- Lee el archivo local en `path`.
- `mode: "json"` (valor predeterminado) espera una carga útil de objeto JSON y resuelve `id` como puntero JSON.
- `mode: "singleValue"` espera el identificador de referencia `"value"` y devuelve el contenido sin procesar del archivo (sin el salto de línea final).
- La ruta debe superar las comprobaciones de propiedad y permisos; `timeoutMs` (valor predeterminado: 5000) y `maxBytes` (valor predeterminado: 1 MiB) limitan la lectura.
- Cierre ante fallos en Windows: si la verificación de ACL no está disponible para la ruta, la resolución falla. Solo para rutas de confianza, establezca `allowInsecurePath: true` en ese proveedor para omitir la comprobación.

</Accordion>

<Accordion title="Proveedor de ejecución">
- Ejecuta directamente la ruta absoluta configurada del binario, sin shell.
- De forma predeterminada, `command` debe ser un archivo normal, no un enlace simbólico. Establezca `allowSymlinkCommand: true` para permitir rutas de comandos con enlaces simbólicos (por ejemplo, adaptadores de Homebrew) y combínelo con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`) para que solo se admitan rutas de gestores de paquetes.
- Admite `timeoutMs` (valor predeterminado: 5000), `noOutputTimeoutMs` (el valor predeterminado es igual a `timeoutMs`), `maxOutputBytes` (valor predeterminado: 1 MiB), la lista de permitidos `env`/`passEnv` y `trustedDirs`.
- El valor predeterminado de `jsonOnly` es `true`. Con `jsonOnly: false` y un único id solicitado, se acepta la salida stdout sin formato JSON como valor de ese id.
- Cierre seguro en Windows: si la verificación de ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, establezca `allowInsecurePath: true` en ese proveedor para omitir la comprobación.
- Los proveedores de ejecución gestionados por plugins pueden usar `pluginIntegration` en lugar de copiar `command`/`args`. OpenClaw resuelve los detalles actuales del comando desde el manifiesto del plugin instalado durante el inicio o la recarga; si el plugin está deshabilitado, se ha eliminado, no es de confianza o ya no declara la integración, las SecretRefs activas de ese proveedor producen un cierre seguro.

Carga útil de la solicitud (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Carga útil de la respuesta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: permitir secreto en la lista
```

Errores opcionales por id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` es un diagnóstico opcional legible por máquina. OpenClaw muestra los códigos
reconocidos `NOT_FOUND` y `AMBIGUOUS_DUPLICATE_KEY` con el proveedor y el id de referencia. Se aceptan otros
códigos y campos de formato libre como `message` para mantener la compatibilidad con la versión 1 del protocolo,
pero no se muestran porque la salida del sistema de resolución puede contener material de credenciales.

</Accordion>

## Claves de API respaldadas por archivos

No coloque cadenas `file:...` en el bloque `env` de la configuración. Ese bloque es literal y no admite sobrescritura, por lo que `file:...` nunca se resuelve allí.

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

Para `mode: "singleValue"`, la SecretRef `id` es `"value"`. Para `mode: "json"`, use un puntero JSON absoluto como `"/providers/xai/apiKey"`.

Consulte [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para conocer los campos que aceptan SecretRefs.

## Ejemplos de integración de ejecución

Para consultar una guía específica de 1Password que abarca las cuentas de servicio, la skill del agente incluida y la solución de problemas, consulte [1Password](/es/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI de 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // obligatorio para binarios de Homebrew enlazados simbólicamente
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
    Use un contenedor del sistema de resolución para asignar los ids de SecretRef a claves de elementos de Bitwarden Secrets Manager. El repositorio incluye `scripts/secrets/openclaw-bws-resolver.mjs`; instálelo o cópielo en una ruta absoluta de confianza del host que ejecuta el Gateway.

    Requisitos:

    - CLI de Bitwarden Secrets Manager (`bws`) instalada en el host del Gateway.
    - `BWS_ACCESS_TOKEN` disponible para el servicio del Gateway.
    - `PATH` pasado al sistema de resolución, o `BWS_BIN` establecido en la ruta absoluta del binario `bws`.
    - `BWS_SERVER_URL` establecido en el entorno al usar una instancia de Bitwarden autoalojada.

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

    El sistema de resolución agrupa los ids solicitados, ejecuta `bws secret list` y devuelve los valores de los campos `key` de secretos coincidentes. Use claves que cumplan el contrato de ids de SecretRef de ejecución, como `openclaw/providers/openai/apiKey`; las claves con estilo de variables de entorno y guiones bajos se rechazan antes de ejecutar el sistema de resolución. Si más de un secreto visible de Bitwarden comparte la clave solicitada, el sistema de resolución marca ese id como ambiguo en lugar de intentar adivinar. Después de actualizar la configuración, verifique la ruta del sistema de resolución:

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
            allowSymlinkCommand: true, // obligatorio para binarios de Homebrew enlazados simbólicamente
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
    Use un pequeño contenedor del sistema de resolución para asignar directamente los ids de SecretRef a entradas de `pass`. Guárdelo como ejecutable en una ruta absoluta que supere las comprobaciones de ruta del proveedor de ejecución, por ejemplo, `/usr/local/bin/openclaw-pass-resolver`. La línea shebang de `#!/usr/bin/env node` resuelve `node` desde el `PATH` del proceso del sistema de resolución, así que incluya `PATH` en `passEnv`. Si `pass` no se encuentra en ese `PATH`, establezca `PASS_BIN` en el entorno principal e inclúyalo también en `passEnv`:

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

    Mantenga el secreto en la primera línea de la entrada `pass` o personalice el contenedor para que devuelva en su lugar la salida completa de `pass show`. Después de actualizar la configuración, verifique tanto la auditoría estática como la ruta del sistema de resolución de ejecución:

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
            allowSymlinkCommand: true, // obligatorio para binarios de Homebrew enlazados simbólicamente
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

Las variables de entorno del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` aceptan SecretInput, lo que evita que las claves de API y los tokens aparezcan en la configuración como texto sin formato:

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

Los valores de cadena en texto sin formato siguen funcionando. Las referencias de plantillas de entorno como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del Gateway, antes de que se genere el proceso del servidor MCP. Al igual que con otras superficies de SecretRef, las referencias sin resolver solo bloquean la activación cuando el plugin `acpx` está efectivamente activo.

## Material de autenticación SSH del entorno aislado

El backend principal del entorno aislado `ssh` también admite SecretRefs para el material de autenticación SSH:

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

Las credenciales canónicas admitidas y no admitidas se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).

<Note>
Las credenciales generadas en tiempo de ejecución o rotatorias y el material de actualización de OAuth se excluyen intencionadamente de la resolución de solo lectura de SecretRef.
</Note>

## Comportamiento requerido y precedencia

- Campo sin referencia: sin cambios.
- Campo con referencia: obligatorio en las superficies activas durante la activación.
- Si están presentes tanto el texto sin formato como la referencia, la referencia tiene precedencia en las rutas de precedencia admitidas.
- El centinela de ocultación `__OPENCLAW_REDACTED__` está reservado para la ocultación/restauración interna de la configuración y se rechaza como dato literal de configuración enviado.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia en tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales `auth-profiles.json` tienen precedencia sobre las referencias `openclaw.json`)

Google Chat `serviceAccount` acepta JSON en línea o una SecretRef. Doctor mueve el elemento hermano retirado `serviceAccountRef` a este campo canónico cuando no está definido.

## Desencadenantes de activación

La activación de secretos se ejecuta durante:

- El inicio (comprobación previa y activación final)
- La ruta de aplicación en caliente de la recarga de configuración
- La ruta de comprobación de reinicio de la recarga de configuración
- La recarga manual mediante `secrets.reload`
- La comprobación previa del RPC de escritura de configuración del Gateway (`config.set` / `config.apply` / `config.patch`), que valida las SecretRefs de superficies activas dentro de la carga útil de configuración enviada antes de conservar las modificaciones

Contrato de activación:

- Si tiene éxito, sustituye la instantánea de forma atómica.
- Un fallo estricto durante el inicio interrumpe el inicio del Gateway.
- Durante un inicio en frío, un fallo de resolución reintentable para un propietario asignado, aislable y ajeno al Gateway puede publicar la instantánea con ese propietario exacto configurado como no disponible. Las solicitudes para el propietario fallan con `SECRET_SURFACE_UNAVAILABLE`; los propietarios de proveedores de modelos no recurren a credenciales del entorno ni del perfil de autenticación después de que falle una referencia explícita.
- La recarga y la comprobación de reinicio aíslan a los propietarios asignados aptos. Las identidades de referencia sin cambios, con definiciones de proveedor sin cambios y un contrato completo no secreto del propietario sin cambios, conservan sus valores exactos válidos más recientes como obsoletos; las referencias modificadas o recién configuradas que no se resuelvan se publican en frío solo para ese propietario. Un fallo estricto durante la recarga conserva la instantánea activa anterior.
- `config.set`, `config.apply` y `config.patch` aceptan referencias sin resolver sintácticamente válidas para propietarios aislables y devuelven un informe `degradedSecretOwners` ocultado. La autenticación de entrada del Gateway, la configuración o los valores resueltos estructuralmente no válidos, las infracciones de políticas y los propietarios desconocidos se siguen rechazando antes de modificar el disco.
- Los propietarios hermanos en buen estado se resuelven y publican normalmente incluso cuando otro propietario está en frío u obsoleto.
- Proporcionar un token de canal explícito por llamada a una llamada de herramienta o auxiliar de salida no desencadena la activación de SecretRef; los puntos de activación siguen siendo el inicio, la recarga y `secrets.reload` explícito.

## Señales de degradación y recuperación

Cuando la activación durante la recarga falla después de un estado correcto, OpenClaw entra en un estado de secretos degradado y emite eventos del sistema de una sola vez y códigos de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: los propietarios en buen estado se actualizan, los propietarios obsoletos conservan el último valor válido conocido y los propietarios en frío permanecen no disponibles.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos mientras el estado ya está degradado registran advertencias, pero no vuelven a emitir el evento.
- Un fallo estricto durante el inicio nunca emite un evento de degradación, porque el tiempo de ejecución nunca llegó a estar activo. Un inicio correcto con propietarios en frío registra la degradación del propietario, pero no emite un evento del recargador.
- Los fallos de inicio y recarga limitados a una referencia emiten una advertencia estructurada `SECRETS_DEGRADED` para cada propietario afectado. Las interrupciones limitadas a un proveedor emiten una advertencia `SECRETS_PROVIDER_DEGRADED` con el proveedor y la lista completa de propietarios afectados, en lugar de repetir el fallo del proveedor para cada propietario. Las advertencias incluyen un motivo ocultado, el estado del propietario `cold` o `stale` y la indicación de reintento `openclaw secrets reload`. Nunca incluyen valores resueltos ni identificadores de SecretRef.
- `openclaw doctor` enumera los propietarios en frío y obsoletos con sus rutas de configuración afectadas, el motivo ocultado y las instrucciones para reintentar.

## Resolución de rutas de comandos

Las rutas de comandos pueden optar por la resolución admitida de SecretRef mediante un RPC de instantánea del Gateway. Se aplican dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comandos estrictas">
    Por ejemplo, las rutas de memoria remota `openclaw memory` y `openclaw qr --remote` cuando necesita referencias remotas de secretos compartidos. Leen desde la instantánea activa y fallan inmediatamente cuando una SecretRef obligatoria no está disponible.
  </Tab>
  <Tab title="Rutas de comandos de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y los flujos de reparación de configuración/Doctor de solo lectura. También prefieren la instantánea activa, pero se degradan en lugar de interrumpirse cuando una SecretRef específica no está disponible.

    Comportamiento de solo lectura:

    - Cuando el Gateway está en ejecución, estos comandos leen primero desde la instantánea activa.
    - Si la resolución del Gateway está incompleta o el Gateway no está disponible, intentan una alternativa local específica para esa superficie de comandos.
    - Si una SecretRef específica sigue sin estar disponible, el comando continúa con una salida degradada de solo lectura y un diagnóstico explícito que indica que la referencia está configurada, pero no disponible en esta ruta de comandos.
    - Este comportamiento degradado solo se aplica localmente al comando; no debilita las rutas de inicio, recarga, envío ni autenticación del tiempo de ejecución.

  </Tab>
</Tabs>

Otras notas:

- La actualización de la instantánea después de la rotación de secretos del backend se gestiona mediante `openclaw secrets reload`.
- Método RPC del Gateway utilizado por estas rutas de comandos: `secrets.resolve`.

## Flujo de trabajo de auditoría y configuración

Flujo predeterminado para operadores:

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

No se debe considerar que la migración está completa hasta que la nueva auditoría no presente problemas. Si la auditoría aún informa de valores en texto sin formato almacenados, el riesgo de acceso por parte del agente permanece incluso cuando las API en tiempo de ejecución devuelven valores ocultados.

Si se guarda un plan en lugar de aplicarlo durante `configure`, se debe aplicar ese plan guardado con `openclaw secrets apply --from <plan-path>` antes de volver a realizar la auditoría.

<AccordionGroup>
  <Accordion title="auditoría de secretos">
    Los hallazgos incluyen:

    - Valores en texto sin formato almacenados (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado).
    - Residuos en texto sin formato de encabezados sensibles del proveedor en las entradas `models.json` generadas.
    - Referencias sin resolver.
    - Ocultación por precedencia (`auth-profiles.json` tiene prioridad sobre las referencias `openclaw.json`).
    - Residuos heredados (`auth.json`, recordatorios de OAuth).

    Nota sobre la ejecución: de forma predeterminada, la auditoría omite las comprobaciones de resolubilidad de las SecretRefs de ejecución para evitar efectos secundarios de los comandos. Se debe utilizar `openclaw secrets audit --allow-exec` para ejecutar los proveedores de ejecución durante la auditoría.

    Nota sobre residuos de encabezados: la detección de encabezados sensibles del proveedor se basa en heurísticas de nombres (nombres comunes de encabezados de autenticación/credenciales y fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="configuración de secretos">
    Asistente interactivo que:

    - Configura primero `secrets.providers` (`env`/`file`/`exec`, añadir/editar/eliminar).
    - Permite seleccionar campos admitidos que contienen secretos en `openclaw.json`, además de `auth-profiles.json`, para el ámbito de un agente.
    - Puede crear una nueva asignación `auth-profiles.json` directamente en el selector de destino.
    - Captura los detalles de SecretRef (`source`, `provider`, `id`).
    - Ejecuta la resolución previa y puede aplicar los cambios inmediatamente.

    Nota sobre la ejecución: la comprobación previa omite las comprobaciones de SecretRef de ejecución a menos que se establezca `--allow-exec`. Si se aplica directamente desde `configure --apply` y el plan incluye referencias/proveedores de ejecución, también se debe mantener establecido `--allow-exec` durante el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - Eliminar las credenciales estáticas coincidentes de `auth-profiles.json` para los proveedores seleccionados.
    - Eliminar las entradas estáticas heredadas `api_key` de `auth.json`.
    - Eliminar las líneas coincidentes de secretos conocidos de los archivos `.env` del estado efectivo y de la configuración activa (se eliminan los duplicados cuando ambas rutas coinciden).

  </Accordion>
  <Accordion title="aplicación de secretos">
    Aplicar un plan guardado:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota sobre la ejecución: la simulación omite las comprobaciones de ejecución a menos que se establezca `--allow-exec`; el modo de escritura rechaza los planes que contengan SecretRefs/proveedores de ejecución a menos que se establezca `--allow-exec`.

    Para obtener detalles sobre el contrato estricto de destino/ruta y las reglas exactas de rechazo, consulte [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw no escribe intencionadamente copias de seguridad de reversión que contengan valores históricos de secretos en texto sin formato.
</Warning>

Modelo de seguridad:

- La comprobación previa debe finalizar correctamente antes del modo de escritura.
- La activación en tiempo de ejecución se valida antes de confirmar.
- La aplicación actualiza los archivos mediante sustitución atómica y realiza una restauración de mejor esfuerzo en caso de fallo.

## Notas sobre compatibilidad con la autenticación heredada

Para las credenciales estáticas, el tiempo de ejecución ya no depende del almacenamiento de autenticación heredado en texto sin formato.

- La fuente de credenciales en tiempo de ejecución es la instantánea resuelta en memoria.
- Las entradas estáticas heredadas `api_key` se eliminan cuando se detectan.
- El comportamiento de compatibilidad relacionado con OAuth se mantiene por separado.

## Nota sobre la interfaz web

Algunas uniones SecretInput son más fáciles de configurar en el modo de editor sin formato que en el modo de formulario.

## Temas relacionados

- [Autenticación](/es/gateway/authentication) - configuración de autenticación
- [CLI: secretos](/es/cli/secrets) - comandos de la CLI
- [SecretRefs de Vault](/es/plugins/vault) - configuración del proveedor HashiCorp Vault
- [Variables de entorno](/es/help/environment) - precedencia del entorno
- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) - superficie de credenciales
- [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract) - detalles del contrato del plan
- [Seguridad](/es/gateway/security) - postura de seguridad
