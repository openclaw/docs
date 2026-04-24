---
read_when:
    - Configurando SecretRef para credenciales de proveedor y referencias de `auth-profiles.json`
    - Operando de forma segura la recarga, auditoría, configuración y aplicación de secretos en producción
    - Comprendiendo el fallo rápido al inicio, el filtrado de superficies inactivas y el comportamiento del último estado válido conocido
summary: 'Gestión de secretos: contrato de SecretRef, comportamiento de instantánea en tiempo de ejecución y depuración segura unidireccional'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-04-24T05:30:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw admite SecretRef aditivos para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

El texto sin formato sigue funcionando. Los SecretRef son opcionales por credencial.

## Objetivos y modelo de tiempo de ejecución

Los secretos se resuelven en una instantánea en memoria del entorno de ejecución.

- La resolución es anticipada durante la activación, no diferida en rutas de solicitud.
- El inicio falla rápidamente cuando no se puede resolver un SecretRef efectivamente activo.
- La recarga usa intercambio atómico: éxito completo o se mantiene la instantánea válida más reciente.
- Las infracciones de la política de SecretRef (por ejemplo, perfiles de autenticación en modo OAuth combinados con entrada SecretRef) hacen fallar la activación antes del intercambio del entorno de ejecución.
- Las solicitudes en tiempo de ejecución leen solo desde la instantánea activa en memoria.
- Después de la primera activación/carga correcta de configuración, las rutas de código de tiempo de ejecución siguen leyendo esa instantánea activa en memoria hasta que una recarga correcta la sustituye.
- Las rutas de entrega saliente también leen desde esa instantánea activa (por ejemplo, entrega de respuestas/hilos de Discord y envíos de acciones de Telegram); no vuelven a resolver SecretRef en cada envío.

Esto mantiene las interrupciones de proveedores de secretos fuera de las rutas de solicitud críticas.

## Filtrado de superficies activas

Los SecretRef se validan solo en superficies efectivamente activas.

- Superficies habilitadas: las referencias no resueltas bloquean el inicio/la recarga.
- Superficies inactivas: las referencias no resueltas no bloquean el inicio/la recarga.
- Las referencias inactivas emiten diagnósticos no fatales con el código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Ejemplos de superficies inactivas:

- Entradas de canal/cuenta deshabilitadas.
- Credenciales de canal de nivel superior que no hereda ninguna cuenta habilitada.
- Superficies de herramientas/funciones deshabilitadas.
- Claves específicas de proveedor de búsqueda web que no están seleccionadas por `tools.web.search.provider`.
  En modo automático (proveedor no establecido), las claves se consultan por precedencia para la detección automática del proveedor hasta que una se resuelve.
  Tras la selección, las claves de proveedores no seleccionados se tratan como inactivas hasta ser seleccionadas.
- Material de autenticación SSH de sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, más anulaciones por agente) está activo solo
  cuando el backend efectivo de sandbox es `ssh` para el agente predeterminado o un agente habilitado.
- Los SecretRef de `gateway.remote.token` / `gateway.remote.password` están activos si se cumple una de estas condiciones:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` es `serve` o `funnel`
  - En modo local sin esas superficies remotas:
    - `gateway.remote.token` está activo cuando la autenticación por token puede prevalecer y no hay ningún token de entorno/autenticación configurado.
    - `gateway.remote.password` está activo solo cuando la autenticación por contraseña puede prevalecer y no hay ninguna contraseña de entorno/autenticación configurada.
- El SecretRef de `gateway.auth.token` está inactivo para la resolución de autenticación al inicio cuando `OPENCLAW_GATEWAY_TOKEN` está configurado, porque la entrada de token de entorno prevalece para ese entorno de ejecución.

## Diagnósticos de superficie de autenticación de Gateway

Cuando se configura un SecretRef en `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` o `gateway.remote.password`, el inicio/la recarga de Gateway registra explícitamente el
estado de la superficie:

- `active`: el SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: el SecretRef se ignora para este entorno de ejecución porque prevalece otra superficie de autenticación, o
  porque la autenticación remota está deshabilitada/no activa.

Estas entradas se registran con `SECRETS_GATEWAY_AUTH_SURFACE` e incluyen el motivo usado por la
política de superficies activas, para que puedas ver por qué una credencial se trató como activa o inactiva.

## Validación previa de referencias en incorporación

Cuando la incorporación se ejecuta en modo interactivo y eliges almacenamiento SecretRef, OpenClaw realiza validación previa antes de guardar:

- Referencias de entorno: valida el nombre de la variable de entorno y confirma que durante la configuración se ve un valor no vacío.
- Referencias de proveedor (`file` o `exec`): valida la selección de proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Ruta de reutilización rápida: cuando `gateway.auth.token` ya es un SecretRef, la incorporación lo resuelve antes del arranque de sondeo/panel (para referencias `env`, `file` y `exec`) usando la misma barrera de fallo rápido.

Si la validación falla, la incorporación muestra el error y te permite reintentar.

## Contrato de SecretRef

Usa una única forma de objeto en todas partes:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validación:

- `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
- `id` debe coincidir con `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validación:

- `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
- `id` debe ser un puntero JSON absoluto (`/...`)
- Escape RFC6901 en segmentos: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validación:

- `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
- `id` debe coincidir con `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` no debe contener `.` ni `..` como segmentos de ruta delimitados por barras (por ejemplo, `a/../b` se rechaza)

## Configuración del proveedor

Define proveedores en `secrets.providers`:

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

### Proveedor env

- Lista de permitidos opcional mediante `allowlist`.
- Los valores de entorno ausentes o vacíos hacen fallar la resolución.

### Proveedor file

- Lee un archivo local desde `path`.
- `mode: "json"` espera una carga útil de objeto JSON y resuelve `id` como puntero.
- `mode: "singleValue"` espera el id de referencia `"value"` y devuelve el contenido del archivo.
- La ruta debe superar comprobaciones de propiedad/permisos.
- Nota de fallo cerrado en Windows: si la verificación de ACL no está disponible para una ruta, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de la ruta.

### Proveedor exec

- Ejecuta la ruta binaria absoluta configurada, sin shell.
- De forma predeterminada, `command` debe apuntar a un archivo normal (no un symlink).
- Establece `allowSymlinkCommand: true` para permitir rutas de comando con symlink (por ejemplo, shims de Homebrew). OpenClaw valida la ruta de destino resuelta.
- Combina `allowSymlinkCommand` con `trustedDirs` para rutas de gestores de paquetes (por ejemplo `["/opt/homebrew"]`).
- Admite tiempo de espera, tiempo de espera sin salida, límites de bytes de salida, lista de permitidos de entorno y directorios de confianza.
- Nota de fallo cerrado en Windows: si la verificación de ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de la ruta.

Carga útil de solicitud (`stdin`):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Carga útil de respuesta (`stdout`):

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

## Ejemplos de integración exec

### CLI de 1Password

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

### CLI de HashiCorp Vault

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

### `sops`

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

## Variables de entorno del servidor MCP

Las variables de entorno del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` admiten SecretInput. Esto mantiene las claves de API y los tokens fuera de la configuración en texto sin formato:

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

Los valores de cadena en texto sin formato siguen funcionando. Las referencias de plantilla de entorno como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del gateway antes de que se genere el proceso del servidor MCP. Como con otras superficies SecretRef, las referencias no resueltas solo bloquean la activación cuando el Plugin `acpx` está efectivamente activo.

## Material de autenticación SSH de sandbox

El backend core de sandbox `ssh` también admite SecretRef para material de autenticación SSH:

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
- Si el backend efectivo de sandbox no es `ssh`, estas referencias permanecen inactivas y no bloquean el inicio.

## Superficie de credenciales compatible

Las credenciales canónicas compatibles y no compatibles se enumeran en:

- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)

Las credenciales generadas en tiempo de ejecución o rotativas y el material de actualización OAuth quedan excluidos intencionadamente de la resolución SecretRef de solo lectura.

## Comportamiento y precedencia requeridos

- Campo sin referencia: sin cambios.
- Campo con referencia: obligatorio en superficies activas durante la activación.
- Si están presentes tanto texto sin formato como referencia, la referencia tiene prioridad en las rutas de precedencia compatibles.
- El centinela de redacción `__OPENCLAW_REDACTED__` está reservado para redacción/restauración interna de configuración y se rechaza como dato literal enviado en configuración.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia en tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales de `auth-profiles.json` tienen prioridad sobre las referencias de `openclaw.json`)

Comportamiento de compatibilidad de Google Chat:

- `serviceAccountRef` tiene prioridad sobre `serviceAccount` en texto sin formato.
- El valor en texto sin formato se ignora cuando se establece una referencia hermana.

## Activadores de activación

La activación de secretos se ejecuta en:

- Inicio (validación previa más activación final)
- Ruta de aplicación en caliente de recarga de configuración
- Ruta de comprobación de reinicio de recarga de configuración
- Recarga manual mediante `secrets.reload`
- Validación previa de RPC de escritura de configuración de Gateway (`config.set` / `config.apply` / `config.patch`) para la capacidad de resolución de SecretRef de superficie activa dentro de la carga útil de configuración enviada antes de persistir las ediciones

Contrato de activación:

- El éxito intercambia la instantánea de forma atómica.
- Un fallo al inicio aborta el inicio del gateway.
- Un fallo de recarga en tiempo de ejecución mantiene la instantánea válida más reciente.
- Un fallo de validación previa de RPC de escritura rechaza la configuración enviada y mantiene sin cambios tanto la configuración en disco como la instantánea activa del entorno de ejecución.
- Proporcionar un token de canal explícito por llamada a un helper/herramienta saliente no activa la activación de SecretRef; los puntos de activación siguen siendo el inicio, la recarga y `secrets.reload` explícito.

## Señales de degradación y recuperación

Cuando la activación en tiempo de recarga falla después de un estado saludable, OpenClaw entra en un estado degradado de secretos.

Evento único del sistema y códigos de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: el entorno de ejecución mantiene la instantánea válida más reciente.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos mientras ya está degradado registran advertencias, pero no saturan los eventos.
- El fallo rápido al inicio no emite eventos de degradación porque el entorno de ejecución nunca llegó a activarse.

## Resolución en rutas de comandos

Las rutas de comandos pueden optar por la resolución de SecretRef compatible mediante RPC de instantánea del gateway.

Hay dos comportamientos generales:

- Las rutas de comandos estrictas (por ejemplo, rutas de memoria remota de `openclaw memory` y `openclaw qr --remote` cuando necesita referencias de secreto compartido remoto) leen desde la instantánea activa y fallan rápidamente cuando un SecretRef requerido no está disponible.
- Las rutas de comandos de solo lectura (por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y flujos de reparación de doctor/configuración de solo lectura) también prefieren la instantánea activa, pero se degradan en lugar de abortar cuando un SecretRef dirigido no está disponible en esa ruta de comando.

Comportamiento de solo lectura:

- Cuando el gateway está en ejecución, estos comandos leen primero desde la instantánea activa.
- Si la resolución del gateway está incompleta o el gateway no está disponible, intentan una alternativa local dirigida para la superficie específica del comando.
- Si un SecretRef dirigido sigue sin estar disponible, el comando continúa con salida degradada de solo lectura y diagnósticos explícitos como “configurado pero no disponible en esta ruta de comando”.
- Este comportamiento degradado es solo local al comando. No debilita las rutas de inicio, recarga o envío/autenticación del entorno de ejecución.

Otras notas:

- La actualización de la instantánea después de la rotación de secretos del backend se gestiona con `openclaw secrets reload`.
- Método RPC de Gateway usado por estas rutas de comando: `secrets.resolve`.

## Flujo de trabajo de auditoría y configuración

Flujo predeterminado del operador:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Los hallazgos incluyen:

- valores en texto sin formato en reposo (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado)
- residuos en texto sin formato de encabezados sensibles de proveedores en entradas generadas de `models.json`
- referencias no resueltas
- sombreado por precedencia (`auth-profiles.json` tiene prioridad sobre referencias de `openclaw.json`)
- residuos heredados (`auth.json`, recordatorios de OAuth)

Nota sobre exec:

- De forma predeterminada, la auditoría omite las comprobaciones de capacidad de resolución de SecretRef exec para evitar efectos secundarios de comandos.
- Usa `openclaw secrets audit --allow-exec` para ejecutar proveedores exec durante la auditoría.

Nota sobre residuos de encabezados:

- La detección de encabezados sensibles de proveedores se basa en heurísticas de nombres (nombres y fragmentos comunes de encabezados de autenticación/credenciales como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

### `secrets configure`

Helper interactivo que:

- configura primero `secrets.providers` (`env`/`file`/`exec`, añadir/editar/eliminar)
- te permite seleccionar campos compatibles que contienen secretos en `openclaw.json` más `auth-profiles.json` para un alcance de agente
- puede crear directamente una nueva asignación de `auth-profiles.json` en el selector de destino
- captura detalles de SecretRef (`source`, `provider`, `id`)
- ejecuta resolución de validación previa
- puede aplicar inmediatamente

Nota sobre exec:

- La validación previa omite las comprobaciones de SecretRef exec a menos que se establezca `--allow-exec`.
- Si aplicas directamente desde `configure --apply` y el plan incluye referencias/proveedores exec, mantén también `--allow-exec` activado para el paso de aplicación.

Modos útiles:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Valores predeterminados de aplicación de `configure`:

- depura credenciales estáticas coincidentes de `auth-profiles.json` para los proveedores dirigidos
- depura entradas heredadas estáticas `api_key` de `auth.json`
- depura líneas de secretos conocidas coincidentes de `<config-dir>/.env`

### `secrets apply`

Aplica un plan guardado:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Nota sobre exec:

- `dry-run` omite las comprobaciones exec a menos que se establezca `--allow-exec`.
- El modo de escritura rechaza planes que contengan SecretRef/proveedores exec a menos que se establezca `--allow-exec`.

Para ver detalles estrictos del contrato de destino/ruta y reglas exactas de rechazo, consulta:

- [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract)

## Política de seguridad unidireccional

OpenClaw intencionadamente no escribe copias de seguridad de reversión que contengan valores históricos de secretos en texto sin formato.

Modelo de seguridad:

- la validación previa debe tener éxito antes del modo de escritura
- la activación del entorno de ejecución se valida antes de confirmar
- apply actualiza archivos usando sustitución atómica de archivos y restauración de mejor esfuerzo en caso de fallo

## Notas de compatibilidad de autenticación heredada

Para credenciales estáticas, el entorno de ejecución ya no depende del almacenamiento heredado de autenticación en texto sin formato.

- La fuente de credenciales en tiempo de ejecución es la instantánea resuelta en memoria.
- Las entradas heredadas estáticas `api_key` se depuran cuando se detectan.
- El comportamiento de compatibilidad relacionado con OAuth sigue siendo independiente.

## Nota de la Web UI

Algunas uniones de SecretInput son más fáciles de configurar en modo editor sin formato que en modo formulario.

## Documentación relacionada

- Comandos CLI: [secrets](/es/cli/secrets)
- Detalles del contrato del plan: [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract)
- Superficie de credenciales: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- Configuración de autenticación: [Autenticación](/es/gateway/authentication)
- Postura de seguridad: [Seguridad](/es/gateway/security)
- Precedencia del entorno: [Variables de entorno](/es/help/environment)
