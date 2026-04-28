---
read_when:
    - Configurar SecretRefs para credenciales de proveedores y referencias de `auth-profiles.json`
    - Operar recarga, auditoría, configuración y aplicación de secretos de forma segura en producción
    - Entender el fallo rápido al inicio, el filtrado de superficies inactivas y el comportamiento del último estado válido conocido
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato de SecretRef, comportamiento de instantáneas en runtime y depuración unidireccional segura'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-04-26T11:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw admite SecretRefs aditivos para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

<Note>
El texto sin formato sigue funcionando. Los SecretRefs son opcionales por credencial.
</Note>

## Objetivos y modelo de runtime

Los secretos se resuelven en una instantánea de runtime en memoria.

- La resolución es anticipada durante la activación, no diferida en las rutas de solicitud.
- El inicio falla rápidamente cuando un SecretRef efectivamente activo no puede resolverse.
- La recarga usa intercambio atómico: éxito total, o se conserva la última instantánea válida conocida.
- Las infracciones de la política de SecretRef (por ejemplo, perfiles de autenticación en modo OAuth combinados con entrada SecretRef) hacen fallar la activación antes del intercambio de runtime.
- Las solicitudes de runtime leen solo de la instantánea activa en memoria.
- Después de la primera activación/carga correcta de la configuración, las rutas de código de runtime siguen leyendo esa instantánea activa en memoria hasta que una recarga correcta la intercambia.
- Las rutas de entrega saliente también leen de esa instantánea activa (por ejemplo, entrega de respuestas/hilos en Discord y envíos de acciones de Telegram); no vuelven a resolver SecretRefs en cada envío.

Esto mantiene las caídas del proveedor de secretos fuera de las rutas de solicitud activas.

## Filtrado de superficies activas

Los SecretRefs se validan solo en superficies efectivamente activas.

- Superficies habilitadas: las referencias no resueltas bloquean el inicio/la recarga.
- Superficies inactivas: las referencias no resueltas no bloquean el inicio/la recarga.
- Las referencias inactivas emiten diagnósticos no fatales con el código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Ejemplos de superficies inactivas">
    - Entradas de canal/cuenta deshabilitadas.
    - Credenciales de canal de nivel superior que ninguna cuenta habilitada hereda.
    - Superficies de herramienta/función deshabilitadas.
    - Claves específicas del proveedor de búsqueda web que no están seleccionadas por `tools.web.search.provider`. En modo automático (proveedor no establecido), las claves se consultan por precedencia para la detección automática del proveedor hasta que una se resuelva. Tras la selección, las claves de proveedores no seleccionados se tratan como inactivas hasta que se seleccionen.
    - El material de autenticación SSH del sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, más las sustituciones por agente) está activo solo cuando el backend efectivo del sandbox es `ssh` para el agente predeterminado o un agente habilitado.
    - Los SecretRefs `gateway.remote.token` / `gateway.remote.password` están activos si se cumple una de estas condiciones:
      - `gateway.mode=remote`
      - `gateway.remote.url` está configurado
      - `gateway.tailscale.mode` es `serve` o `funnel`
      - En modo local sin esas superficies remotas:
        - `gateway.remote.token` está activo cuando la autenticación por token puede ganar y no hay ningún token de env/auth configurado.
        - `gateway.remote.password` está activo solo cuando la autenticación por contraseña puede ganar y no hay ninguna contraseña de env/auth configurada.
    - El SecretRef `gateway.auth.token` está inactivo para la resolución de autenticación al inicio cuando `OPENCLAW_GATEWAY_TOKEN` está establecido, porque la entrada del token de entorno gana para ese runtime.

  </Accordion>
</AccordionGroup>

## Diagnósticos de la superficie de autenticación del Gateway

Cuando un SecretRef se configura en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el inicio/la recarga del gateway registra explícitamente el estado de la superficie:

- `active`: el SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: el SecretRef se ignora para este runtime porque otra superficie de autenticación gana, o porque la autenticación remota está deshabilitada/no activa.

Estas entradas se registran con `SECRETS_GATEWAY_AUTH_SURFACE` e incluyen el motivo usado por la política de superficie activa, para que puedas ver por qué una credencial se trató como activa o inactiva.

## Comprobación previa de referencias en onboarding

Cuando el onboarding se ejecuta en modo interactivo y eliges almacenamiento SecretRef, OpenClaw ejecuta validación previa antes de guardar:

- Referencias env: valida el nombre de la variable de entorno y confirma que un valor no vacío sea visible durante la configuración.
- Referencias de proveedor (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Ruta de reutilización de inicio rápido: cuando `gateway.auth.token` ya es un SecretRef, el onboarding lo resuelve antes del arranque de probe/dashboard (para referencias `env`, `file` y `exec`) usando la misma compuerta de fallo rápido.

Si la validación falla, el onboarding muestra el error y te permite reintentar.

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
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validación:

    - `provider` debe coincidir con `^[a-z][a-z0-9_-]{0,63}$`
    - `id` debe coincidir con `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` no debe contener `.` ni `..` como segmentos de ruta delimitados por `/` (por ejemplo, `a/../b` se rechaza)

  </Tab>
</Tabs>

## Configuración del proveedor

Define los proveedores en `secrets.providers`:

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
    - Allowlist opcional mediante `allowlist`.
    - Los valores env ausentes o vacíos hacen fallar la resolución.

  </Accordion>
  <Accordion title="Proveedor file">
    - Lee el archivo local desde `path`.
    - `mode: "json"` espera una carga útil de objeto JSON y resuelve `id` como puntero.
    - `mode: "singleValue"` espera el id de referencia `"value"` y devuelve el contenido del archivo.
    - La ruta debe pasar comprobaciones de propiedad/permisos.
    - Nota de fallo cerrado en Windows: si la verificación ACL no está disponible para una ruta, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de ruta.

  </Accordion>
  <Accordion title="Proveedor exec">
    - Ejecuta la ruta binaria absoluta configurada, sin shell.
    - De forma predeterminada, `command` debe apuntar a un archivo normal (no a un symlink).
    - Establece `allowSymlinkCommand: true` para permitir rutas de comando con symlink (por ejemplo, shims de Homebrew). OpenClaw valida la ruta del destino resuelto.
    - Combina `allowSymlinkCommand` con `trustedDirs` para rutas del gestor de paquetes (por ejemplo `["/opt/homebrew"]`).
    - Admite tiempo de espera, tiempo de espera sin salida, límites de bytes de salida, allowlist de entorno y directorios de confianza.
    - Nota de fallo cerrado en Windows: si la verificación ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, establece `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de ruta.

    Carga útil de la solicitud (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Carga útil de la respuesta (stdout):

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
            allowSymlinkCommand: true, // obligatorio para binarios con symlink de Homebrew
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
  <Accordion title="CLI de HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // obligatorio para binarios con symlink de Homebrew
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
            allowSymlinkCommand: true, // obligatorio para binarios con symlink de Homebrew
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

Las variables env del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` admiten SecretInput. Esto mantiene las claves de API y tokens fuera de la configuración en texto sin formato:

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

Los valores de cadena en texto sin formato siguen funcionando. Las referencias de plantilla env como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del gateway antes de que se inicie el proceso del servidor MCP. Al igual que otras superficies de SecretRef, las referencias no resueltas solo bloquean la activación cuando el Plugin `acpx` está efectivamente activo.

## Material de autenticación SSH del sandbox

El backend principal del sandbox `ssh` también admite SecretRefs para material de autenticación SSH:

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

Comportamiento de runtime:

- OpenClaw resuelve estas referencias durante la activación del sandbox, no de forma diferida durante cada llamada SSH.
- Los valores resueltos se escriben en archivos temporales con permisos restrictivos y se usan en la configuración SSH generada.
- Si el backend efectivo del sandbox no es `ssh`, estas referencias permanecen inactivas y no bloquean el inicio.

## Superficie de credenciales admitida

Las credenciales canónicas admitidas y no admitidas se enumeran en:

- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface)

<Note>
Las credenciales generadas en runtime o rotatorias y el material de renovación OAuth se excluyen intencionadamente de la resolución SecretRef de solo lectura.
</Note>

## Comportamiento y precedencia requeridos

- Campo sin referencia: sin cambios.
- Campo con referencia: obligatorio en superficies activas durante la activación.
- Si hay tanto texto sin formato como referencia, la referencia tiene prioridad en las rutas de precedencia compatibles.
- El centinela de redacción `__OPENCLAW_REDACTED__` está reservado para la redacción/restauración interna de configuración y se rechaza como dato de configuración enviado literalmente.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia de runtime)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales de `auth-profiles.json` tienen prioridad sobre las referencias de `openclaw.json`)

Comportamiento de compatibilidad de Google Chat:

- `serviceAccountRef` tiene prioridad sobre `serviceAccount` en texto sin formato.
- El valor en texto sin formato se ignora cuando se establece una referencia hermana.

## Disparadores de activación

La activación de secretos se ejecuta en:

- Inicio (preflight más activación final)
- Ruta de aplicación en caliente de recarga de configuración
- Ruta de comprobación de reinicio de recarga de configuración
- Recarga manual mediante `secrets.reload`
- Preflight de RPC de escritura de configuración del Gateway (`config.set` / `config.apply` / `config.patch`) para la capacidad de resolución de SecretRef de superficie activa dentro de la carga de configuración enviada antes de persistir las ediciones

Contrato de activación:

- El éxito intercambia la instantánea de forma atómica.
- El fallo en el inicio aborta el arranque del Gateway.
- El fallo en la recarga de runtime conserva la última instantánea válida conocida.
- El fallo del preflight de RPC de escritura rechaza la configuración enviada y mantiene sin cambios tanto la configuración en disco como la instantánea activa de runtime.
- Proporcionar un token explícito por llamada y por canal a una llamada de helper/herramienta saliente no dispara la activación de SecretRef; los puntos de activación siguen siendo inicio, recarga y `secrets.reload` explícito.

## Señales de degradación y recuperación

Cuando la activación en recarga falla después de un estado saludable, OpenClaw entra en estado degradado de secretos.

Códigos de evento del sistema y log de una sola vez:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: el runtime conserva la última instantánea válida conocida.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos mientras ya está degradado registran advertencias pero no saturan de eventos.
- El fallo rápido al inicio no emite eventos de degradación porque el runtime nunca llegó a activarse.

## Resolución en rutas de comando

Las rutas de comando pueden optar por la resolución compatible de SecretRef mediante RPC de instantánea del Gateway.

Hay dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comando estrictas">
    Por ejemplo, rutas de memoria remota de `openclaw memory` y `openclaw qr --remote` cuando necesita referencias remotas de secreto compartido. Leen de la instantánea activa y fallan rápidamente cuando un SecretRef requerido no está disponible.
  </Tab>
  <Tab title="Rutas de comando de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y flujos de reparación de doctor/configuración de solo lectura. También prefieren la instantánea activa, pero degradan en lugar de abortar cuando un SecretRef objetivo no está disponible en esa ruta de comando.

    Comportamiento de solo lectura:

    - Cuando el Gateway está en ejecución, estos comandos leen primero de la instantánea activa.
    - Si la resolución del Gateway es incompleta o el Gateway no está disponible, intentan una alternativa local específica para la superficie concreta del comando.
    - Si un SecretRef objetivo sigue sin estar disponible, el comando continúa con salida degradada de solo lectura y diagnósticos explícitos como "configured but unavailable in this command path".
    - Este comportamiento degradado es solo local del comando. No debilita las rutas de inicio, recarga ni envío/autenticación del runtime.

  </Tab>
</Tabs>

Otras notas:

- La actualización de la instantánea tras una rotación de secretos del backend se gestiona con `openclaw secrets reload`.
- Método RPC del Gateway usado por estas rutas de comando: `secrets.resolve`.

## Flujo de trabajo de auditoría y configuración

Flujo predeterminado del operador:

<Steps>
  <Step title="Audita el estado actual">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configura SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Vuelve a auditar">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Los hallazgos incluyen:

    - valores en texto sin formato en reposo (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado)
    - residuos de cabeceras sensibles de proveedor en texto sin formato en entradas generadas de `models.json`
    - referencias no resueltas
    - sombreado por precedencia (`auth-profiles.json` tiene prioridad sobre referencias de `openclaw.json`)
    - residuos heredados (`auth.json`, recordatorios de OAuth)

    Nota sobre exec:

    - De forma predeterminada, la auditoría omite las comprobaciones de capacidad de resolución de SecretRef exec para evitar efectos secundarios del comando.
    - Usa `openclaw secrets audit --allow-exec` para ejecutar proveedores exec durante la auditoría.

    Nota sobre residuos de cabeceras:

    - La detección de cabeceras sensibles del proveedor se basa en heurísticas de nombres (nombres/fragmentos habituales de cabeceras de autenticación/credenciales como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Ayudante interactivo que:

    - configura primero `secrets.providers` (`env`/`file`/`exec`, añadir/editar/eliminar)
    - te permite seleccionar campos compatibles con secretos en `openclaw.json` además de `auth-profiles.json` para un alcance de agente
    - puede crear una nueva asignación `auth-profiles.json` directamente en el selector de destino
    - captura detalles del SecretRef (`source`, `provider`, `id`)
    - ejecuta resolución preflight
    - puede aplicar inmediatamente

    Nota sobre exec:

    - El preflight omite las comprobaciones de SecretRef exec a menos que se establezca `--allow-exec`.
    - Si aplicas directamente desde `configure --apply` y el plan incluye referencias/proveedores exec, mantén también `--allow-exec` para el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - depurar credenciales estáticas coincidentes de `auth-profiles.json` para proveedores objetivo
    - depurar entradas heredadas estáticas `api_key` de `auth.json`
    - depurar líneas coincidentes de secretos conocidos de `<config-dir>/.env`

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

    - `dry-run` omite las comprobaciones exec a menos que se establezca `--allow-exec`.
    - El modo de escritura rechaza planes que contienen SecretRefs/proveedores exec a menos que se establezca `--allow-exec`.

    Para ver los detalles estrictos del contrato de destino/ruta y las reglas exactas de rechazo, consulta [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw no escribe intencionadamente copias de seguridad de reversión que contengan valores históricos de secretos en texto sin formato.
</Warning>

Modelo de seguridad:

- el preflight debe completarse correctamente antes del modo de escritura
- la activación de runtime se valida antes del commit
- apply actualiza archivos mediante sustitución atómica de archivos y restauración con el mejor esfuerzo en caso de fallo

## Notas de compatibilidad con autenticación heredada

Para credenciales estáticas, el runtime ya no depende del almacenamiento heredado de autenticación en texto sin formato.

- La fuente de credenciales del runtime es la instantánea resuelta en memoria.
- Las entradas heredadas estáticas `api_key` se depuran cuando se detectan.
- El comportamiento de compatibilidad relacionado con OAuth sigue separado.

## Nota sobre la Web UI

Algunas uniones de SecretInput son más fáciles de configurar en modo editor sin procesar que en modo formulario.

## Relacionado

- [Autenticación](/es/gateway/authentication) — configuración de autenticación
- [CLI: secrets](/es/cli/secrets) — comandos de CLI
- [Variables de entorno](/es/help/environment) — precedencia del entorno
- [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface) — superficie de credenciales
- [Contrato del plan de aplicación de secretos](/es/gateway/secrets-plan-contract) — detalles del contrato del plan
- [Seguridad](/es/gateway/security) — postura de seguridad
