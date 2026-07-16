---
read_when:
    - Configuración de SecretRefs para credenciales de proveedores y referencias `auth-profiles.json`
    - Gestionar de forma segura en producción la recarga, auditoría, configuración y aplicación de secretos
    - Comprender el fallo rápido durante el inicio, el filtrado de superficies inactivas y el comportamiento de la última configuración válida conocida
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato de SecretRef, comportamiento de las instantáneas en tiempo de ejecución y depuración unidireccional segura'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-07-16T11:36:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw admite SecretRefs aditivas para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

<Note>
El texto sin formato sigue funcionando. Las SecretRefs son opcionales para cada credencial.
</Note>

<Warning>
Las credenciales en texto sin formato siguen siendo legibles por el agente si se encuentran en archivos que este puede inspeccionar, incluidos `openclaw.json`, `auth-profiles.json`, `.env` o los archivos `agents/*/agent/models.json` generados. Las SecretRefs solo reducen ese radio de impacto local una vez que se han migrado todas las credenciales compatibles y `openclaw secrets audit --check` no informa de residuos de texto sin formato.
</Warning>

## Modelo de ejecución

- Los secretos se resuelven en una instantánea de ejecución en memoria, de forma anticipada durante la activación, no de forma diferida en las rutas de las solicitudes.
- El inicio falla de inmediato cuando no se puede resolver una SecretRef efectivamente activa.
- La recarga es un intercambio atómico: se completa correctamente en su totalidad o se conserva la última instantánea válida conocida.
- Las infracciones de políticas (por ejemplo, un perfil de autenticación en modo OAuth combinado con una entrada SecretRef) hacen que la activación falle antes del intercambio de la instantánea de ejecución.
- Las solicitudes en tiempo de ejecución solo leen la instantánea activa en memoria. Las credenciales SecretRef del proveedor de modelos pasan por el almacenamiento de autenticación y las opciones de transmisión como centinelas locales del proceso hasta la salida. Las rutas de entrega salientes (entrega de respuestas/hilos de Discord, envíos de acciones de Telegram) también leen esa instantánea y no vuelven a resolver las referencias en cada envío.

Esto mantiene las interrupciones del proveedor de secretos fuera de las rutas críticas de las solicitudes.

## Inyección en el momento de la salida (centinelas)

Para las credenciales de proveedores de modelos respaldadas por SecretRefs, OpenClaw genera un centinela opaco y local del proceso durante la resolución de la autenticación del modelo. Por lo tanto, el almacenamiento de autenticación, las opciones de transmisión, la configuración del SDK, los registros, los objetos de error y la mayoría de las introspecciones en tiempo de ejecución ven un valor como `oc-sent-v1-...`, no la credencial del proveedor. La obtención protegida del modelo y las sondas administradas de estado de proveedores locales sustituyen los centinelas conocidos en los valores de URL y encabezados inmediatamente antes de que cada solicitud salga del proceso.

Los valores desconocidos con formato de centinela producen un fallo seguro antes de cualquier actividad de red. OpenClaw se niega a enviar la solicitud en lugar de reenviar un centinela sin resolver a un proveedor. Los valores de secretos resueltos también se registran para ocultarlos de los registros mediante coincidencia exacta como medida de defensa en profundidad.

Los adaptadores de proveedores utilizan el punto de inyección más tardío que admite su SDK:

- Los SDK con una opción de obtención personalizada reciben la obtención protegida de OpenClaw, por lo que el SDK conserva el centinela.
- Los SDK sin una opción de obtención personalizada desenvuelven el centinela inmediatamente antes de construir el cliente. Las transmisiones de proveedores propiedad de plugins y los entornos de agentes lo desenvuelven en la transferencia final controlada por el núcleo porque esos transportes no comparten la obtención protegida de OpenClaw.

Los centinelas reducen la exposición del texto sin formato en toda la cadena de llamadas al modelo, pero no proporcionan aislamiento de procesos. El valor real sigue existiendo en la memoria del mismo proceso y aparece en el límite final del adaptador. Las credenciales simples de entorno que no se configuran mediante SecretRefs permanecen como texto sin formato y quedan fuera de este mecanismo.

Establezca `OPENCLAW_SECRET_SENTINELS=off` (también acepta `0` o `false`, sin distinguir entre mayúsculas y minúsculas) para desactivar la generación de centinelas durante la respuesta a incidentes o la resolución de problemas de compatibilidad. El interruptor de desactivación no inhabilita el registro para la ocultación mediante coincidencia exacta de valores.

## Límite de acceso del agente

Las SecretRefs evitan que las credenciales se conserven en la configuración y en los archivos de modelos generados, pero no constituyen un límite de aislamiento de procesos. Una credencial en texto sin formato que permanezca en el disco, en una ruta que el agente pueda leer, sigue siendo accesible mediante herramientas de archivos o del shell, lo que elude la ocultación en el nivel de la API.

Para implementaciones de producción en las que se incluyan archivos accesibles para el agente, considere que la migración está completa solo cuando se cumplan todas estas condiciones:

- Las credenciales compatibles utilizan SecretRefs en lugar de valores en texto sin formato.
- Los residuos heredados de texto sin formato se eliminan de `openclaw.json`, `auth-profiles.json`, `.env` y de los archivos `models.json` generados.
- `openclaw secrets audit --check` no detecta problemas después de la migración.
- Cualquier credencial restante no compatible o rotatoria está protegida mediante aislamiento del sistema operativo, aislamiento de contenedores o un proxy de credenciales externo.

Por este motivo, el flujo de auditoría/configuración/aplicación es una barrera de migración de seguridad, no solo una utilidad práctica.

<Warning>
Las SecretRefs no hacen que cualquier archivo legible sea seguro. Las copias de seguridad, las configuraciones copiadas, los catálogos antiguos de modelos generados y las clases de credenciales no compatibles siguen siendo secretos de producción hasta que se eliminen, se trasladen fuera del límite de confianza del agente o se aíslen por separado.
</Warning>

## Filtrado de superficies activas

Las SecretRefs solo se validan en superficies efectivamente activas:

- **Superficies habilitadas**: las referencias sin resolver bloquean el inicio o la recarga.
- **Superficies inactivas**: las referencias sin resolver no bloquean el inicio ni la recarga; emiten un diagnóstico no fatal `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Ejemplos de superficies inactivas">
- Entradas de canales o cuentas deshabilitadas.
- Credenciales de canal de nivel superior que ninguna cuenta habilitada hereda.
- Superficies de herramientas o funciones deshabilitadas.
- Claves específicas de proveedores de búsqueda web no seleccionadas por `tools.web.search.provider`. En el modo automático (proveedor sin establecer), las claves se consultan por orden de prioridad para la detección automática hasta que se resuelve una; después de la selección, las claves de proveedores no seleccionados quedan inactivas.
- El material de autenticación SSH del entorno aislado (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, además de las anulaciones por agente) solo está activo cuando el backend efectivo del entorno aislado es `ssh` y el modo del entorno aislado no es `off`, para el agente predeterminado o un agente habilitado.
- Las SecretRefs `gateway.remote.token` / `gateway.remote.password` están activas si se cumple cualquiera de estas condiciones:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` es `serve` o `funnel`
  - En modo local sin esas superficies remotas: `gateway.remote.token` está activa cuando la autenticación mediante token puede prevalecer y no se ha configurado ningún token de entorno/autenticación; `gateway.remote.password` solo está activa cuando la autenticación mediante contraseña puede prevalecer y no se ha configurado ninguna contraseña de entorno/autenticación.
- La SecretRef `gateway.auth.token` está inactiva para la resolución de autenticación durante el inicio cuando se establece `OPENCLAW_GATEWAY_TOKEN`, porque la entrada del token de entorno prevalece para esa ejecución.

</Accordion>

## Diagnósticos de la superficie de autenticación del Gateway

Cuando se establece una SecretRef en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el inicio o la recarga del Gateway registra el estado de la superficie con el código `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: la SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: prevalece otra superficie de autenticación o la autenticación remota está deshabilitada o inactiva.

La entrada del registro incluye el motivo utilizado por la política de superficies activas.

## Comprobación previa de referencias durante la incorporación

En la incorporación interactiva, al elegir el almacenamiento mediante SecretRef se ejecuta una validación previa antes de guardar:

- Referencias de entorno: valida el nombre de la variable de entorno y confirma que haya un valor no vacío visible durante la configuración.
- Referencias de proveedores (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Flujo de inicio rápido: cuando `gateway.auth.token` ya es una SecretRef, la incorporación la resuelve antes de la inicialización de la sonda o del panel (para las referencias `env`, `file` y `exec`) mediante la misma barrera de fallo inmediato.

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
    - Escapado de RFC 6901 en segmentos: `~` se convierte en `~0`, `/` se convierte en `~1`

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
- Los valores de entorno ausentes o vacíos hacen que la resolución falle.

</Accordion>

<Accordion title="Proveedor de archivos">
- Lee el archivo local en `path`.
- `mode: "json"` (valor predeterminado) espera una carga útil de objeto JSON y resuelve `id` como un puntero JSON.
- `mode: "singleValue"` espera el identificador de referencia `"value"` y devuelve el contenido sin procesar del archivo (se elimina el salto de línea final).
- La ruta debe superar las comprobaciones de propiedad y permisos; `timeoutMs` (valor predeterminado: 5000) y `maxBytes` (valor predeterminado: 1 MiB) limitan la lectura.
- Fallo seguro en Windows: si la verificación de ACL no está disponible para la ruta, la resolución falla. Solo para rutas de confianza, establezca `allowInsecurePath: true` en ese proveedor para omitir la comprobación.

</Accordion>

<Accordion title="Proveedor de ejecución">
- Ejecuta directamente la ruta absoluta del binario configurada, sin shell.
- De forma predeterminada, `command` debe ser un archivo normal, no un enlace simbólico. Establezca `allowSymlinkCommand: true` para permitir rutas de comandos mediante enlaces simbólicos (por ejemplo, adaptadores de Homebrew) y combínelo con `trustedDirs` (por ejemplo, `["/opt/homebrew"]`) para que solo sean válidas las rutas de gestores de paquetes.
- Admite `timeoutMs` (valor predeterminado: 5000), `noOutputTimeoutMs` (el valor predeterminado equivale a `timeoutMs`), `maxOutputBytes` (valor predeterminado: 1 MiB), la lista de permitidos `env`/`passEnv` y `trustedDirs`.
- El valor predeterminado de `jsonOnly` es `true`. Con `jsonOnly: false` y un único id solicitado, la salida estándar de texto sin formato que no sea JSON se acepta como valor de ese id.
- Cierre seguro en Windows: si no está disponible la verificación de ACL para la ruta del comando, la resolución falla. Solo para rutas de confianza, establezca `allowInsecurePath: true` en ese proveedor para omitir la comprobación.
- Los proveedores de ejecución gestionados por plugins pueden usar `pluginIntegration` en lugar de copiar `command`/`args`. OpenClaw resuelve los detalles actuales del comando a partir del manifiesto del plugin instalado durante el inicio o la recarga; si el plugin está deshabilitado, se elimina, deja de ser de confianza o ya no declara la integración, las SecretRefs activas de ese proveedor se cierran de forma segura.

Carga útil de la solicitud (entrada estándar):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Carga útil de la respuesta (salida estándar):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: secreto de la lista de permitidos
```

Errores opcionales por id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` es un diagnóstico opcional legible por máquina. OpenClaw muestra los códigos reconocidos
`NOT_FOUND` y `AMBIGUOUS_DUPLICATE_KEY` junto con el proveedor y el id de referencia. Se aceptan otros
códigos y campos de formato libre, como `message`, para mantener la compatibilidad con el protocolo v1,
pero no se muestran porque la salida del resolutor puede contener material de credenciales.

</Accordion>

## Claves de API respaldadas por archivos

No introduzca cadenas `file:...` en el bloque `env` de la configuración. Ese bloque es literal y no admite sustituciones, por lo que `file:...` nunca se resuelve allí.

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

Consulte [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) para conocer los campos que aceptan SecretRefs.

## Ejemplos de integración de ejecución

Para consultar una guía específica de 1Password que abarca cuentas de servicio, la Skill incluida del agente y la resolución de problemas, consulte [1Password](/es/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI de 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // necesario para binarios de Homebrew enlazados simbólicamente
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
    Use un contenedor resolutor para asignar los ids de SecretRef a las claves de elementos de Bitwarden Secrets Manager. El repositorio incluye `scripts/secrets/openclaw-bws-resolver.mjs`; instálelo o cópielo en una ruta absoluta de confianza del host que ejecuta el Gateway.

    Requisitos:

    - CLI de Bitwarden Secrets Manager (`bws`) instalada en el host del Gateway.
    - `BWS_ACCESS_TOKEN` disponible para el servicio del Gateway.
    - `PATH` transferido al resolutor, o `BWS_BIN` establecido en la ruta absoluta del binario `bws`.
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

    El resolutor agrupa los ids solicitados, ejecuta `bws secret list` y devuelve los valores de los campos `key` de secretos coincidentes. Use claves que satisfagan el contrato de ids de SecretRef de ejecución, como `openclaw/providers/openai/apiKey`; las claves con formato de variable de entorno y guiones bajos se rechazan antes de ejecutar el resolutor. Si más de un secreto visible de Bitwarden comparte la clave solicitada, el resolutor marca ese id como ambiguo y falla en lugar de hacer una suposición. Después de actualizar la configuración, verifique la ruta del resolutor:

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
            allowSymlinkCommand: true, // necesario para binarios de Homebrew enlazados simbólicamente
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
    Use un pequeño contenedor resolutor para asignar los ids de SecretRef directamente a las entradas `pass`. Guárdelo como ejecutable en una ruta absoluta que supere las comprobaciones de ruta del proveedor de ejecución, por ejemplo, `/usr/local/bin/openclaw-pass-resolver`. La línea shebang `#!/usr/bin/env node` resuelve `node` a partir del `PATH` del proceso resolutor, por lo que debe incluir `PATH` en `passEnv`. Si `pass` no está en ese `PATH`, establezca `PASS_BIN` en el entorno principal e inclúyalo también en `passEnv`:

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
          errors[id] = { message: (result.stderr || `pass terminó con el estado ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    A continuación, configure el proveedor de ejecución y haga que `apiKey` apunte a la ruta de la entrada `pass`:

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

    Mantenga el secreto en la primera línea de la entrada `pass` o personalice el contenedor para que devuelva en su lugar la salida completa de `pass show`. Después de actualizar la configuración, verifique tanto la auditoría estática como la ruta del resolutor de ejecución:

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
            allowSymlinkCommand: true, // necesario para binarios de Homebrew enlazados simbólicamente
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

Los valores de cadena de texto sin formato siguen funcionando. Las referencias de plantilla de entorno como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del Gateway, antes de que se inicie el proceso del servidor MCP. Al igual que en otras superficies de SecretRef, las referencias sin resolver solo bloquean la activación cuando el plugin `acpx` está efectivamente activo.

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

## Superficie de credenciales compatible

Las credenciales compatibles y no compatibles canónicas se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).

<Note>
Las credenciales generadas en tiempo de ejecución o rotatorias y el material de actualización de OAuth se excluyen intencionadamente de la resolución de SecretRef de solo lectura.
</Note>

## Comportamiento requerido y precedencia

- Campo sin referencia: sin cambios.
- Campo con referencia: obligatorio en las superficies activas durante la activación.
- Si están presentes tanto el texto sin formato como la referencia, la referencia tiene precedencia en las rutas de precedencia compatibles.
- El centinela de ocultación `__OPENCLAW_REDACTED__` está reservado para la ocultación y restauración internas de la configuración y se rechaza como dato literal de configuración enviado.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia en tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales `auth-profiles.json` tienen precedencia sobre las referencias `openclaw.json`)

Compatibilidad con Google Chat: `serviceAccountRef` tiene precedencia sobre `serviceAccount` en texto sin formato; el valor en texto sin formato se ignora una vez establecida la referencia hermana.

## Desencadenadores de activación

La activación de secretos se ejecuta durante:

- El inicio (comprobación previa y activación final)
- La ruta de aplicación en caliente de la recarga de configuración
- La ruta de comprobación de reinicio de la recarga de configuración
- La recarga manual mediante `secrets.reload`
- La comprobación previa del RPC de escritura de configuración del Gateway (`config.set` / `config.apply` / `config.patch`), que comprueba que las SecretRef de las superficies activas puedan resolverse dentro de la carga útil de configuración enviada antes de conservar las modificaciones

Contrato de activación:

- En caso de éxito, sustituye la instantánea de forma atómica.
- Un fallo durante el inicio interrumpe el inicio del Gateway.
- Un fallo durante la recarga en tiempo de ejecución conserva la última instantánea válida conocida.
- Un fallo en la comprobación previa del RPC de escritura rechaza la configuración enviada; tanto la configuración del disco como la instantánea activa en tiempo de ejecución permanecen sin cambios.
- Proporcionar un token de canal explícito por llamada a una llamada saliente de un asistente o una herramienta no desencadena la activación de SecretRef; los puntos de activación siguen siendo el inicio, la recarga y `secrets.reload` explícito.

## Señales de degradación y recuperación

Cuando la activación durante una recarga falla después de un estado correcto, OpenClaw entra en un estado de secretos degradado y emite eventos del sistema únicos y códigos de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: el entorno de ejecución conserva la última instantánea válida conocida.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos cuando el estado ya está degradado registran advertencias, pero no vuelven a emitir el evento.
- El fallo inmediato durante el inicio nunca emite un evento de degradación, porque el entorno de ejecución nunca llegó a estar activo.

## Resolución de rutas de comandos

Las rutas de comandos pueden habilitar la resolución compatible de SecretRef mediante un RPC de instantánea del Gateway. Se aplican dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comandos estrictas">
    Por ejemplo, las rutas de memoria remota `openclaw memory` y `openclaw qr --remote` cuando necesita referencias remotas de secretos compartidos. Leen desde la instantánea activa y fallan de inmediato cuando una SecretRef obligatoria no está disponible.
  </Tab>
  <Tab title="Rutas de comandos de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y los flujos de reparación de doctor o configuración de solo lectura. También prefieren la instantánea activa, pero pasan a un estado degradado en lugar de interrumpirse cuando una SecretRef específica no está disponible.

    Comportamiento de solo lectura:

    - Cuando el Gateway está en ejecución, estos comandos leen primero desde la instantánea activa.
    - Si la resolución del Gateway está incompleta o el Gateway no está disponible, intentan una alternativa local específica para esa superficie de comandos.
    - Si una SecretRef específica sigue sin estar disponible, el comando continúa con una salida degradada de solo lectura y un diagnóstico explícito que indica que la referencia está configurada, pero no está disponible en esta ruta de comandos.
    - Este comportamiento degradado solo se aplica localmente al comando; no debilita las rutas de inicio, recarga, envío ni autenticación del entorno de ejecución.

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

No se debe considerar completa la migración hasta que la nueva auditoría no presente problemas. Si la auditoría sigue informando de valores en texto sin formato almacenados, el riesgo de acceso por parte del agente permanece incluso cuando las API en tiempo de ejecución devuelven valores ocultos.

Si se guarda un plan en lugar de aplicarlo durante `configure`, se debe aplicar ese plan guardado con `openclaw secrets apply --from <plan-path>` antes de volver a realizar la auditoría.

<AccordionGroup>
  <Accordion title="secrets audit">
    Los hallazgos incluyen:

    - Valores en texto sin formato almacenados (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado).
    - Residuos de encabezados sensibles de proveedores en texto sin formato en las entradas `models.json` generadas.
    - Referencias sin resolver.
    - Ocultamiento por precedencia (`auth-profiles.json` tiene prioridad sobre las referencias `openclaw.json`).
    - Residuos heredados (`auth.json`, recordatorios de OAuth).

    Nota sobre la ejecución: de forma predeterminada, la auditoría omite las comprobaciones de resolución de SecretRef de ejecución para evitar efectos secundarios de los comandos. Se debe utilizar `openclaw secrets audit --allow-exec` para ejecutar proveedores de ejecución durante la auditoría.

    Nota sobre los residuos de encabezados: la detección de encabezados sensibles de proveedores se basa en heurísticas de nombres (nombres y fragmentos comunes de encabezados de autenticación o credenciales, como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Asistente interactivo que:

    - Configura primero `secrets.providers` (`env`/`file`/`exec`; añadir, editar o eliminar).
    - Permite seleccionar campos compatibles que contienen secretos en `openclaw.json`, además de `auth-profiles.json`, para el ámbito de un agente.
    - Puede crear una nueva asignación `auth-profiles.json` directamente en el selector de destino.
    - Captura los detalles de SecretRef (`source`, `provider`, `id`).
    - Ejecuta la resolución previa y puede aplicar los cambios inmediatamente.

    Nota sobre la ejecución: la comprobación previa omite las comprobaciones de SecretRef de ejecución, salvo que se establezca `--allow-exec`. Si se aplica directamente desde `configure --apply` y el plan incluye referencias o proveedores de ejecución, se debe mantener establecido `--allow-exec` también durante el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - Elimina de `auth-profiles.json` las credenciales estáticas coincidentes de los proveedores seleccionados.
    - Elimina las entradas estáticas heredadas `api_key` de `auth.json`.
    - Elimina de `<config-dir>/.env` las líneas de secretos conocidas coincidentes.

  </Accordion>
  <Accordion title="secrets apply">
    Aplicar un plan guardado:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota sobre la ejecución: la simulación omite las comprobaciones de ejecución, salvo que se establezca `--allow-exec`; el modo de escritura rechaza los planes que contienen SecretRefs o proveedores de ejecución, salvo que se establezca `--allow-exec`.

    Para obtener detalles sobre el contrato estricto de destinos y rutas, así como las reglas exactas de rechazo, se debe consultar [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw no escribe intencionadamente copias de seguridad de reversión que contengan valores históricos de secretos en texto sin formato.
</Warning>

Modelo de seguridad:

- La comprobación previa debe completarse correctamente antes del modo de escritura.
- La activación en tiempo de ejecución se valida antes de confirmar los cambios.
- La aplicación actualiza los archivos mediante sustitución atómica y realiza un intento de restauración en caso de fallo.

## Notas de compatibilidad con la autenticación heredada

Para las credenciales estáticas, el entorno de ejecución ya no depende del almacenamiento de autenticación heredado en texto sin formato.

- La fuente de credenciales en tiempo de ejecución es la instantánea resuelta en memoria.
- Las entradas estáticas heredadas `api_key` se eliminan cuando se detectan.
- El comportamiento de compatibilidad relacionado con OAuth permanece separado.

## Nota sobre la interfaz web

Algunas uniones de SecretInput son más fáciles de configurar en el modo de editor sin formato que en el modo de formulario.

## Contenido relacionado

- [Autenticación](/es/gateway/authentication) - configuración de la autenticación
- [CLI: secretos](/es/cli/secrets) - comandos de la CLI
- [SecretRefs de Vault](/es/plugins/vault) - configuración del proveedor HashiCorp Vault
- [Variables de entorno](/es/help/environment) - precedencia del entorno
- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) - superficie de credenciales
- [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract) - detalles del contrato del plan
- [Seguridad](/es/gateway/security) - estrategia de seguridad
