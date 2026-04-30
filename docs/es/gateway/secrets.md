---
read_when:
    - Configuración de SecretRefs para credenciales de proveedor y referencias `auth-profiles.json`
    - Recargar, auditar, configurar y aplicar secretos de forma segura en producción
    - Comprender el fallo rápido durante el inicio, el filtrado de superficies inactivas y el comportamiento de último estado correcto conocido
sidebarTitle: Secrets management
summary: 'Gestión de secretos: contrato de SecretRef, comportamiento de instantánea en tiempo de ejecución y limpieza segura unidireccional'
title: Gestión de secretos
x-i18n:
    generated_at: "2026-04-30T05:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw admite SecretRefs aditivos para que las credenciales compatibles no tengan que almacenarse como texto sin formato en la configuración.

<Note>
El texto sin formato sigue funcionando. Los SecretRefs son opcionales por credencial.
</Note>

## Objetivos y modelo de runtime

Los secretos se resuelven en una instantánea de runtime en memoria.

- La resolución es anticipada durante la activación, no diferida en las rutas de solicitud.
- El inicio falla rápido cuando un SecretRef efectivamente activo no puede resolverse.
- La recarga usa intercambio atómico: éxito completo, o se conserva la última instantánea válida conocida.
- Las infracciones de política de SecretRef (por ejemplo, perfiles de autenticación en modo OAuth combinados con entrada SecretRef) hacen fallar la activación antes del intercambio de runtime.
- Las solicitudes de runtime leen solo desde la instantánea activa en memoria.
- Después de la primera activación/carga correcta de configuración, las rutas de código de runtime siguen leyendo esa instantánea activa en memoria hasta que una recarga correcta la intercambia.
- Las rutas de entrega saliente también leen desde esa instantánea activa (por ejemplo, entrega de respuestas/hilos de Discord y envíos de acciones de Telegram); no vuelven a resolver SecretRefs en cada envío.

Esto mantiene las interrupciones de proveedores de secretos fuera de las rutas críticas de solicitud.

## Filtrado de superficies activas

Los SecretRefs se validan solo en superficies efectivamente activas.

- Superficies habilitadas: las referencias no resueltas bloquean el inicio/la recarga.
- Superficies inactivas: las referencias no resueltas no bloquean el inicio/la recarga.
- Las referencias inactivas emiten diagnósticos no fatales con el código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Ejemplos de superficies inactivas">
    - Entradas de canal/cuenta deshabilitadas.
    - Credenciales de canal de nivel superior que ninguna cuenta habilitada hereda.
    - Superficies de herramientas/funciones deshabilitadas.
    - Claves específicas del proveedor de búsqueda web que no están seleccionadas por `tools.web.search.provider`. En modo automático (proveedor no definido), las claves se consultan por precedencia para la detección automática del proveedor hasta que una se resuelve. Después de la selección, las claves de proveedores no seleccionados se tratan como inactivas hasta que se seleccionan.
    - El material de autenticación SSH del sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, además de anulaciones por agente) está activo solo cuando el backend de sandbox efectivo es `ssh` para el agente predeterminado o un agente habilitado.
    - Los SecretRefs de `gateway.remote.token` / `gateway.remote.password` están activos si se cumple una de estas condiciones:
      - `gateway.mode=remote`
      - `gateway.remote.url` está configurado
      - `gateway.tailscale.mode` es `serve` o `funnel`
      - En modo local sin esas superficies remotas:
        - `gateway.remote.token` está activo cuando la autenticación por token puede ganar y no hay ningún token de env/autenticación configurado.
        - `gateway.remote.password` está activo solo cuando la autenticación por contraseña puede ganar y no hay ninguna contraseña de env/autenticación configurada.
    - El SecretRef de `gateway.auth.token` está inactivo para la resolución de autenticación de inicio cuando `OPENCLAW_GATEWAY_TOKEN` está definido, porque la entrada de token de env gana para ese runtime.

  </Accordion>
</AccordionGroup>

## Diagnósticos de superficie de autenticación del Gateway

Cuando se configura un SecretRef en `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, el inicio/la recarga del Gateway registra explícitamente el estado de la superficie:

- `active`: el SecretRef forma parte de la superficie de autenticación efectiva y debe resolverse.
- `inactive`: el SecretRef se ignora para este runtime porque otra superficie de autenticación gana, o porque la autenticación remota está deshabilitada/no activa.

Estas entradas se registran con `SECRETS_GATEWAY_AUTH_SURFACE` e incluyen el motivo usado por la política de superficies activas, para que puedas ver por qué una credencial se trató como activa o inactiva.

## Verificación previa de referencias durante la incorporación

Cuando la incorporación se ejecuta en modo interactivo y eliges almacenamiento SecretRef, OpenClaw ejecuta una validación previa antes de guardar:

- Referencias env: valida el nombre de la variable de entorno y confirma que un valor no vacío sea visible durante la configuración.
- Referencias de proveedor (`file` o `exec`): valida la selección del proveedor, resuelve `id` y comprueba el tipo del valor resuelto.
- Ruta de reutilización de inicio rápido: cuando `gateway.auth.token` ya es un SecretRef, la incorporación lo resuelve antes del arranque de prueba/panel (para referencias `env`, `file` y `exec`) usando la misma puerta de fallo rápido.

Si la validación falla, la incorporación muestra el error y te permite reintentar.

## Contrato SecretRef

Usa la misma forma de objeto en todas partes:

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
    - `id` no debe contener `.` ni `..` como segmentos de ruta delimitados por barras (por ejemplo, `a/../b` se rechaza)

  </Tab>
</Tabs>

## Configuración de proveedor

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
  <Accordion title="Proveedor de archivo">
    - Lee un archivo local desde `path`.
    - `mode: "json"` espera una carga útil de objeto JSON y resuelve `id` como puntero.
    - `mode: "singleValue"` espera el id de referencia `"value"` y devuelve el contenido del archivo.
    - La ruta debe superar las comprobaciones de propiedad/permisos.
    - Nota de fallo cerrado en Windows: si la verificación de ACL no está disponible para una ruta, la resolución falla. Solo para rutas de confianza, define `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de ruta.

  </Accordion>
  <Accordion title="Proveedor exec">
    - Ejecuta la ruta binaria absoluta configurada, sin shell.
    - De forma predeterminada, `command` debe apuntar a un archivo regular (no a un symlink).
    - Define `allowSymlinkCommand: true` para permitir rutas de comando symlink (por ejemplo, shims de Homebrew). OpenClaw valida la ruta de destino resuelta.
    - Combina `allowSymlinkCommand` con `trustedDirs` para rutas de gestores de paquetes (por ejemplo, `["/opt/homebrew"]`).
    - Admite timeout, timeout sin salida, límites de bytes de salida, lista de permitidos de env y directorios de confianza.
    - Nota de fallo cerrado en Windows: si la verificación de ACL no está disponible para la ruta del comando, la resolución falla. Solo para rutas de confianza, define `allowInsecurePath: true` en ese proveedor para omitir las comprobaciones de seguridad de ruta.

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

## Ejemplos de integración exec

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

## Variables de entorno del servidor MCP

Las variables env del servidor MCP configuradas mediante `plugins.entries.acpx.config.mcpServers` admiten SecretInput. Esto mantiene las claves de API y los tokens fuera de la configuración en texto sin formato:

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

Los valores de cadena en texto sin formato siguen funcionando. Las referencias de plantilla env como `${MCP_SERVER_API_KEY}` y los objetos SecretRef se resuelven durante la activación del gateway antes de que se genere el proceso del servidor MCP. Igual que con otras superficies SecretRef, las referencias no resueltas solo bloquean la activación cuando el plugin `acpx` está efectivamente activo.

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

Comportamiento de runtime:

- OpenClaw resuelve estas refs durante la activación del sandbox, no de forma diferida durante cada llamada SSH.
- Los valores resueltos se escriben en archivos temporales con permisos restrictivos y se usan en la configuración SSH generada.
- Si el backend de sandbox efectivo no es `ssh`, estas refs permanecen inactivas y no bloquean el inicio.

## Superficie de credenciales compatible

Las credenciales canónicas compatibles y no compatibles se enumeran en:

- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)

<Note>
Las credenciales emitidas en tiempo de ejecución o rotatorias y el material de actualización de OAuth se excluyen intencionalmente de la resolución SecretRef de solo lectura.
</Note>

## Comportamiento requerido y precedencia

- Campo sin una ref: sin cambios.
- Campo con una ref: obligatorio en superficies activas durante la activación.
- Si hay texto plano y ref, la ref tiene precedencia en las rutas de precedencia compatibles.
- El centinela de censura `__OPENCLAW_REDACTED__` está reservado para la censura/restauración interna de configuración y se rechaza como datos literales de configuración enviados.

Señales de advertencia y auditoría:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (advertencia en tiempo de ejecución)
- `REF_SHADOWED` (hallazgo de auditoría cuando las credenciales de `auth-profiles.json` tienen precedencia sobre las refs de `openclaw.json`)

Comportamiento de compatibilidad de Google Chat:

- `serviceAccountRef` tiene precedencia sobre `serviceAccount` en texto plano.
- El valor en texto plano se ignora cuando está configurada la ref hermana.

## Disparadores de activación

La activación de secretos se ejecuta en:

- Inicio (preflight más activación final)
- Ruta de aplicación en caliente de recarga de configuración
- Ruta de comprobación de reinicio de recarga de configuración
- Recarga manual mediante `secrets.reload`
- Preflight de RPC de escritura de configuración de Gateway (`config.set` / `config.apply` / `config.patch`) para la resolubilidad de SecretRef en superficies activas dentro de la carga útil de configuración enviada antes de persistir los cambios

Contrato de activación:

- El éxito intercambia la instantánea de forma atómica.
- Un fallo de inicio cancela el inicio del gateway.
- Un fallo de recarga en tiempo de ejecución conserva la última instantánea válida conocida.
- Un fallo de preflight de RPC de escritura rechaza la configuración enviada y mantiene sin cambios tanto la configuración en disco como la instantánea activa en tiempo de ejecución.
- Proporcionar un token de canal explícito por llamada a una llamada saliente de helper/herramienta no dispara la activación de SecretRef; los puntos de activación siguen siendo el inicio, la recarga y `secrets.reload` explícito.

## Señales degradadas y recuperadas

Cuando la activación en tiempo de recarga falla después de un estado saludable, OpenClaw entra en estado degradado de secretos.

Códigos de evento del sistema único y de registro:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamiento:

- Degradado: el tiempo de ejecución conserva la última instantánea válida conocida.
- Recuperado: se emite una vez después de la siguiente activación correcta.
- Los fallos repetidos mientras ya está degradado registran advertencias, pero no saturan los eventos.
- El fallo rápido de inicio no emite eventos degradados porque el tiempo de ejecución nunca llegó a estar activo.

## Resolución de rutas de comandos

Las rutas de comandos pueden optar por la resolución SecretRef compatible mediante RPC de instantánea de Gateway.

Hay dos comportamientos generales:

<Tabs>
  <Tab title="Rutas de comandos estrictas">
    Por ejemplo, las rutas de memoria remota de `openclaw memory` y `openclaw qr --remote` cuando necesita refs de secreto compartido remoto. Leen desde la instantánea activa y fallan rápido cuando una SecretRef requerida no está disponible.
  </Tab>
  <Tab title="Rutas de comandos de solo lectura">
    Por ejemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` y los flujos de reparación de doctor/configuración de solo lectura. También prefieren la instantánea activa, pero se degradan en lugar de abortar cuando una SecretRef objetivo no está disponible en esa ruta de comando.

    Comportamiento de solo lectura:

    - Cuando el Gateway se está ejecutando, estos comandos leen primero desde la instantánea activa.
    - Si la resolución de Gateway está incompleta o el Gateway no está disponible, intentan una alternativa local dirigida para la superficie específica del comando.
    - Si una SecretRef dirigida sigue sin estar disponible, el comando continúa con salida degradada de solo lectura y diagnósticos explícitos como "configurada pero no disponible en esta ruta de comando".
    - Este comportamiento degradado es solo local al comando. No debilita las rutas de inicio, recarga o envío/autenticación en tiempo de ejecución.

  </Tab>
</Tabs>

Otras notas:

- La actualización de la instantánea después de una rotación de secretos del backend se gestiona mediante `openclaw secrets reload`.
- Método RPC de Gateway usado por estas rutas de comandos: `secrets.resolve`.

## Flujo de auditoría y configuración

Flujo predeterminado del operador:

<Steps>
  <Step title="Auditar estado actual">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurar SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Volver a auditar">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Los hallazgos incluyen:

    - valores en texto plano en reposo (`openclaw.json`, `auth-profiles.json`, `.env` y `agents/*/agent/models.json` generado)
    - restos de cabeceras sensibles de proveedores en texto plano en entradas generadas de `models.json`
    - refs no resueltas
    - sombreado de precedencia (`auth-profiles.json` con prioridad sobre las refs de `openclaw.json`)
    - restos heredados (`auth.json`, recordatorios de OAuth)

    Nota de exec:

    - De forma predeterminada, la auditoría omite las comprobaciones de resolubilidad de SecretRef de exec para evitar efectos secundarios de comandos.
    - Usa `openclaw secrets audit --allow-exec` para ejecutar proveedores exec durante la auditoría.

    Nota sobre restos de cabeceras:

    - La detección de cabeceras sensibles de proveedores se basa en heurísticas de nombre (nombres y fragmentos comunes de cabeceras de autenticación/credenciales como `authorization`, `x-api-key`, `token`, `secret`, `password` y `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interactivo que:

    - configura primero `secrets.providers` (`env`/`file`/`exec`, agregar/editar/eliminar)
    - te permite seleccionar campos compatibles que contienen secretos en `openclaw.json` más `auth-profiles.json` para un alcance de agente
    - puede crear un nuevo mapeo de `auth-profiles.json` directamente en el selector de destino
    - captura detalles de SecretRef (`source`, `provider`, `id`)
    - ejecuta la resolución preflight
    - puede aplicar inmediatamente

    Nota de exec:

    - Preflight omite las comprobaciones de SecretRef de exec salvo que se establezca `--allow-exec`.
    - Si aplicas directamente desde `configure --apply` y el plan incluye refs/proveedores exec, mantén `--allow-exec` establecido también para el paso de aplicación.

    Modos útiles:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valores predeterminados de aplicación de `configure`:

    - limpiar credenciales estáticas coincidentes de `auth-profiles.json` para proveedores objetivo
    - limpiar entradas estáticas heredadas de `api_key` de `auth.json`
    - limpiar líneas de secretos conocidos coincidentes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Aplicar un plan guardado:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota de exec:

    - dry-run omite comprobaciones de exec salvo que `--allow-exec` esté establecido.
    - el modo de escritura rechaza planes que contengan SecretRefs/proveedores exec salvo que `--allow-exec` esté establecido.

    Para detalles del contrato estricto de destino/ruta y reglas exactas de rechazo, consulta [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de seguridad unidireccional

<Warning>
OpenClaw intencionalmente no escribe copias de seguridad de reversión que contengan valores históricos de secretos en texto plano.
</Warning>

Modelo de seguridad:

- preflight debe completarse correctamente antes del modo de escritura
- la activación en tiempo de ejecución se valida antes del commit
- la aplicación actualiza archivos mediante reemplazo atómico de archivos y restauración de mejor esfuerzo en caso de fallo

## Notas de compatibilidad de autenticación heredada

Para credenciales estáticas, el tiempo de ejecución ya no depende del almacenamiento heredado de autenticación en texto plano.

- La fuente de credenciales en tiempo de ejecución es la instantánea resuelta en memoria.
- Las entradas estáticas heredadas de `api_key` se limpian cuando se descubren.
- El comportamiento de compatibilidad relacionado con OAuth permanece separado.

## Nota de la interfaz web

Algunas uniones de SecretInput son más fáciles de configurar en modo editor sin procesar que en modo formulario.

## Relacionado

- [Autenticación](/es/gateway/authentication) — configuración de autenticación
- [CLI: secrets](/es/cli/secrets) — comandos de CLI
- [Variables de entorno](/es/help/environment) — precedencia del entorno
- [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) — superficie de credenciales
- [Contrato de plan de aplicación de secretos](/es/gateway/secrets-plan-contract) — detalles del contrato del plan
- [Seguridad](/es/gateway/security) — postura de seguridad
