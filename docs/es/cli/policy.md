---
read_when:
    - Quieres comprobar la configuración de OpenClaw con un policy.jsonc creado.
    - Quieres hallazgos de política en `doctor lint`
    - Necesita un hash de atestación de política para la evidencia de auditoría
summary: Referencia de CLI para las comprobaciones de conformidad de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-07-06T21:47:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c58284793e9bdda4fa855b34b873d9427d9f64886882b2ad1dc4dc19dededaa
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` lo proporciona el Plugin de Policy incluido. Es una capa de
conformidad empresarial sobre la configuración existente de OpenClaw, no un
segundo sistema de configuración. Defines requisitos en `policy.jsonc`;
OpenClaw observa el espacio de trabajo activo como evidencia; policy informa
desviaciones mediante `doctor --lint`. Policy no impone llamadas a herramientas
ni reescribe el comportamiento en tiempo de ejecución al momento de la solicitud,
y no certifica almacenes de credenciales por agente como `auth-profiles.json`.

Policy comprueba los canales configurados, servidores MCP, proveedores de
modelos, postura SSRF de red, acceso de entrada/canal, exposición del Gateway y
postura de comandos de nodo, acceso de agentes al espacio de trabajo, postura
del sandbox, postura de manejo de datos, postura de proveedor de secretos/perfil
de autenticación y metadatos de herramientas gobernadas (`TOOLS.md`). Úsalo
cuando un espacio de trabajo necesite una declaración duradera y comprobable
como "Telegram no debe estar habilitado" o "las herramientas gobernadas deben
declarar metadatos de riesgo y propietario". Si solo necesitas comportamiento
local sin certificación ni detección de desviaciones, la configuración normal es
suficiente.

## Inicio rápido

```bash
openclaw plugins enable policy
```

El Plugin permanece habilitado incluso cuando falta `policy.jsonc`, para que
doctor pueda informar el artefacto faltante en lugar de omitir comprobaciones
silenciosamente.

Crea `policy.jsonc` a mano; no se genera a partir de la configuración actual.
Cada sección de nivel superior es un espacio de nombres de reglas: una
comprobación solo se ejecuta cuando hay una regla concreta presente bajo ella
(las secciones o claves no admitidas fallan como `policy/policy-jsonc-invalid`
en lugar de ignorarse silenciosamente). Ejemplo mínimo que cubre todas las
secciones admitidas:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Notas transversales que no son obvias en las tablas de reglas siguientes:

- Omitir `gateway.bind` mientras se deniegan enlaces que no sean local loopback
  significa que aceptas el valor predeterminado en tiempo de ejecución; define
  `gateway.bind: "loopback"` para conformidad estricta.
- Para un agente de solo lectura, establece el `mode` del sandbox en `all` o
  `non-main` en los valores predeterminados/agente aplicables y
  `workspaceAccess` en `none` o `ro`. Un modo de sandbox ausente o `off` no
  satisface una policy de solo lectura.
- `agents.workspace.denyTools` acepta `exec`, `process`, `write`, `edit`,
  `apply_patch`. Los grupos de denegación de herramientas de configuración
  `group:fs` (mutación de archivos) y `group:runtime` (shell/proceso)
  satisfacen la postura equivalente.
- Las comprobaciones de aprobaciones de ejecución leen el artefacto
  `exec-approvals.json` en vivo solo cuando hay una regla `execApprovals`
  presente; un artefacto ausente o no válido es evidencia no observable, no un
  aprobado sintético.
- La evidencia de secretos y perfiles de autenticación registra solo la postura
  de proveedor/fuente y los metadatos de SecretRef, nunca valores sin procesar.
  Policy no lee ni certifica almacenes de credenciales por agente como
  `auth-profiles.json`.
- La evidencia de manejo de datos es solo postura a nivel de configuración
  (modo de redacción, alternador de captura de telemetría, modo de mantenimiento
  de sesiones, configuración de indexación de transcripciones). No inspecciona
  registros, exportaciones de telemetría, transcripciones ni archivos de
  memoria, y un resultado limpio no prueba que no existan datos personales o
  secretos en ellos.

### Referencia de reglas de policy

Todas las reglas siguientes son opcionales; una comprobación solo se ejecuta
cuando la regla está presente. El estado observado es la configuración existente
de OpenClaw o los metadatos del espacio de trabajo.

#### Superposiciones con ámbito

Usa `scopes.<scopeName>` cuando agentes o canales específicos necesiten una
policy más estricta que la línea base de nivel superior. El nombre del ámbito es
solo una etiqueta; la coincidencia usa el selector dentro del ámbito. Las
superposiciones son aditivas: la regla global sigue ejecutándose, y la regla con
ámbito puede añadir su propio hallazgo contra la misma evidencia.

| Selector     | Secciones admitidas                                                           | Úsalo cuando                                               |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Uno o más agentes en tiempo de ejecución necesitan reglas más estrictas. |
| `channelIds` | `ingress.channels`                                                             | Uno o más canales necesitan reglas de entrada más estrictas. |

Si una entrada `agentIds` no está presente en `agents.list[]`, OpenClaw evalúa
la regla con ámbito contra la postura global/predeterminada heredada para ese
id de agente en tiempo de ejecución en lugar de omitirla.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

El mismo agente puede aparecer en varios ámbitos si cada ámbito gobierna un
campo diferente, como arriba. Un campo con ámbito repetido para el mismo agente
debe ser igual o más restrictivo; una afirmación duplicada más débil se rechaza
(las listas de permitidos son subconjuntos, las listas de denegados son
superconjuntos, los booleanos requeridos son fijos).

Las reglas de postura de contenedor (`sandbox.containers.*`) se comprueban solo
contra la evidencia que puede exponer el backend de sandbox del agente
coincidente. Si un backend no puede observar una regla que habilitaste para él,
policy informa `policy/sandbox-container-posture-unobservable` en lugar de
aprobar; limita las reglas de contenedor con ámbito a los grupos de agentes que
usan un backend que puede exponerlas.

`ingress.session.requireDmScope` de nivel superior sigue siendo global;
`session.dmScope` no es evidencia atribuible a canal, por lo que no puede
delimitarse por `channelIds`.

Todo ámbito presente en `policy.jsonc` debe ser válido y aplicable.

#### Canales

| Campo de policy                      | Estado observado                        | Úsalo cuando                                                 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Proveedor `channels.*` y estado habilitado | Denegar canales configurados de un proveedor como `telegram`. |
| `channels.denyRules[].reason`        | Mensaje de hallazgo y contexto de sugerencia de reparación | Explicar por qué el proveedor está denegado.                  |

#### Servidores MCP

| Campo de policy     | Estado observado    | Úsalo cuando                                                |
| ------------------- | ------------------- | ----------------------------------------------------------- |
| `mcp.servers.allow` | ids `mcp.servers.*` | Requerir que todo servidor MCP configurado esté en una lista de permitidos. |
| `mcp.servers.deny`  | ids `mcp.servers.*` | Denegar ids específicos de servidores MCP configurados.     |

#### Proveedores de modelos

| Campo de policy          | Estado observado                                  | Úsalo cuando                                                                     |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `models.providers.allow` | ids `models.providers.*` y refs de modelo seleccionadas | Requerir que los proveedores configurados y refs de modelo seleccionadas usen proveedores aprobados. |
| `models.providers.deny`  | ids `models.providers.*` y refs de modelo seleccionadas | Denegar proveedores configurados y refs de modelo seleccionadas por id de proveedor. |

#### Red

| Campo de policy                | Estado observado                    | Úsalo cuando                                                        |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Vías de escape SSRF de red privada  | Establecer en `false` para requerir que el acceso a red privada permanezca deshabilitado. |

#### Entrada y acceso a canales

| Campo de política                         | Estado observado                                             | Usar cuando                                                        |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                            | Requerir un alcance revisado de aislamiento de mensajes directos.  |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` y campos heredados de política de DM de canal | Permitir solo políticas de canal de mensajes directos revisadas.   |
| `ingress.channels.denyOpenGroups`         | Política de entrada de canal, cuenta y grupo                 | Denegar la entrada de grupos abiertos para canales y cuentas configurados. |
| `ingress.channels.requireMentionInGroups` | Configuración de compuerta de mención de canal, cuenta, grupo, guild y anidada | Requerir compuertas de mención cuando la entrada de grupo esté abierta o limitada por mención. |

#### Gateway

| Campo de política                       | Estado observado                              | Usar cuando                                                                         |
| --------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                | Establecer en `false` para requerir la vinculación loopback del Gateway.            |
| `gateway.exposure.allowTailscaleFunnel` | Postura de servicio/funnel de Tailscale para Gateway | Establecer en `false` para denegar la exposición de Tailscale Funnel.               |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                           | Establecer en `true` para rechazar la autenticación deshabilitada del Gateway.      |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                      | Establecer en `true` para requerir configuración explícita de límite de tasa de autenticación. |
| `gateway.controlUi.allowInsecure`       | Alternadores inseguros de autenticación/dispositivo/origen de Control UI | Establecer en `false` para denegar alternadores de exposición insegura de Control UI. |
| `gateway.remote.allow`                  | Modo/configuración de Gateway remoto          | Establecer en `false` para denegar el modo Gateway remoto.                          |
| `gateway.http.denyEndpoints`            | Endpoints de la API HTTP del Gateway          | Denegar ids de endpoints como `chatCompletions` o `responses`.                      |
| `gateway.http.requireUrlAllowlists`     | Entradas de obtención de URL HTTP del Gateway | Establecer en `true` para requerir listas de permitidos de URL en entradas de obtención de URL. |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                  | Requerir que ids exactos de comandos de nodo como `system.run` se denieguen en la configuración de OpenClaw. |

`gateway.nodes.denyCommands` es una regla exacta de superconjunto de denegación que distingue mayúsculas y minúsculas.
Úsela cuando la política deba probar que los comandos de nodo privilegiados están explícitamente
denegados por la configuración de OpenClaw. Un despliegue que permite intencionadamente un comando
de nodo privilegiado debe actualizar `policy.jsonc` después de la revisión en lugar de depender solo de
`gateway.nodes.allowCommands`.

#### Área de trabajo del agente

| Campo de política                  | Estado observado                                                                     | Usar cuando                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess`   | `agents.defaults.sandbox.workspaceAccess` y `agents.list[].sandbox.workspaceAccess`  | Permitir solo valores de acceso al área de trabajo del sandbox como `none` o `ro`.       |
| `agents.workspace.denyTools`       | Configuración global y por agente de denegación de herramientas                      | Requerir que las herramientas de mutación (`exec`, `process`, `write`, `edit`, `apply_patch`) estén denegadas. |

#### Postura del sandbox

| Campo de política                                    | Estado observado                                      | Usar cuando                                                   |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` y modo por agente      | Permitir solo modos de sandbox revisados como `all` o `non-main`. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` y backend por agente | Permitir solo backends de sandbox revisados como `docker`.    |
| `sandbox.containers.denyHostNetwork`                 | Modo de red de sandbox/navegador respaldado por contenedor | Denegar el modo de red del host.                              |
| `sandbox.containers.denyContainerNamespaceJoin`      | Modo de red de sandbox/navegador respaldado por contenedor | Denegar unirse al espacio de nombres de red de otro contenedor. |
| `sandbox.containers.requireReadOnlyMounts`           | Modo de montaje de sandbox/navegador respaldado por contenedor | Requerir que los montajes sean de solo lectura.               |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montaje de sandbox/navegador respaldado por contenedor | Denegar montajes de sockets del runtime de contenedores.      |
| `sandbox.containers.denyUnconfinedProfiles`          | Postura del perfil de seguridad del contenedor        | Denegar perfiles de seguridad de contenedor sin confinamiento. |
| `sandbox.browser.requireCdpSourceRange`              | Rango de origen CDP del navegador del sandbox         | Requerir que la exposición CDP del navegador declare un rango de origen. |

La política trata la ausencia de `sandbox.mode` como su valor predeterminado implícito `off`, por lo que
`sandbox.requireMode` informa un sandbox nuevo o sin configurar como fuera de una
lista de permitidos como `["all"]`.

#### Manejo de datos

| Campo de política                                  | Estado observado                                                                    | Usar cuando                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`   | `logging.redactSensitive`                                                           | Establecer en `true` para rechazar `logging.redactSensitive: "off"`.   |
| `dataHandling.telemetry.denyContentCapture`        | `diagnostics.otel.captureContent`                                                   | Establecer en `true` para rechazar la captura de contenido de telemetría. |
| `dataHandling.retention.requireSessionMaintenance` | `session.maintenance.mode`                                                          | Establecer en `true` para requerir el modo efectivo de mantenimiento de sesión `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` y `agents.*.memorySearch.experimental.sessionMemory` | Establecer en `true` para rechazar la indexación de transcripciones de sesión en memoria. |

#### Secretos

| Campo de política                 | Estado observado                                           | Usar cuando                                                             |
| --------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs de configuración y declaraciones `secrets.providers.*` | Establecer en `true` para requerir que los SecretRefs apunten a proveedores declarados. |
| `secrets.denySources`             | Orígenes de proveedores de secretos y orígenes de SecretRef | Denegar orígenes como `exec`, `file` u otro nombre de origen configurado. |
| `secrets.allowInsecureProviders`  | Indicadores de postura insegura de proveedor de secretos   | Establecer en `false` para rechazar proveedores que opten por una postura insegura. |

#### Aprobaciones de exec

Las comprobaciones de aprobaciones de exec leen el artefacto runtime `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` de forma predeterminada, o
`$OPENCLAW_STATE_DIR/exec-approvals.json` cuando `OPENCLAW_STATE_DIR` está establecido.
Las reglas de postura bajo `execApprovals.defaults.*` o `execApprovals.agents.*`
requieren evidencia legible del artefacto; un artefacto ausente o no válido se informa como
evidencia no observable en lugar de una aprobación de mejor esfuerzo. Una vez legible, los
campos omitidos heredan los valores predeterminados del runtime: la ausencia de `defaults.security` es `full`, y
la seguridad de agente ausente hereda ese valor predeterminado. La evidencia incluye `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` opcional, la postura efectiva de
`autoAllowSkills` y el origen de la entrada; nunca la ruta/token del socket,
`commandText`, `lastUsedCommand`, rutas resueltas ni marcas de tiempo.

| Campo de política                          | Estado observado                                                                    | Usar cuando                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                | Ruta activa runtime de `exec-approvals.json`                                        | Establecer en `true` para requerir que el artefacto de aprobaciones exista y se analice. |
| `execApprovals.defaults.allowSecurity`     | `defaults.security`, con valor predeterminado `full`                                | Permitir solo modos de seguridad de aprobación predeterminados aprobados.               |
| `execApprovals.agents.allowSecurity`       | `agents.*.security`, que hereda los valores predeterminados                         | Permitir solo modos efectivos de seguridad de aprobación por agente aprobados.          |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` y `agents.*.autoAllowSkills`, que heredan los valores predeterminados del runtime | Establecer en `false` para requerir listas de permitidos manuales estrictas sin aprobación implícita de CLI de Skills. |
| `execApprovals.agents.allowlist.expected`  | Entradas agregadas de patrón `agents.*.allowlist[]` y `argPattern` opcional         | Requerir que la lista de permitidos de aprobaciones coincida con el conjunto de patrones revisado. |

Ejemplo: requerir el artefacto de aprobaciones, denegar valores predeterminados permisivos y permitir
solo la postura de aprobación de exec revisada para agentes seleccionados.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Perfiles de autenticación

| Campo de política              | Estado observado                            | Usar cuando                                                                               |
| ------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | metadatos de proveedor y modo de `auth.profiles.*` | Requiere claves de metadatos como `provider` y `mode` en los perfiles de autenticación de configuración. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                      | Permite solo modos de perfil de autenticación admitidos como `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadatos de herramientas

| Campo de política       | Estado observado                 | Usar cuando                                                                               |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | declaraciones gobernadas de `TOOLS.md` | Requiere que las herramientas gobernadas declaren claves de metadatos como `risk`, `sensitivity` u `owner`. |

#### Postura de herramientas

| Campo de política               | Estado observado                                            | Usar cuando                                                                                               |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` y `agents.list[].tools.profile`             | Permite solo ids de perfil de herramienta como `minimal`, `messaging` o `coding`.                         |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` y anulaciones `tools.fs` por agente | Se establece en `true` para requerir una postura de herramienta de sistema de archivos solo para el workspace. |
| `tools.exec.allowSecurity`      | `tools.exec.security` y seguridad exec por agente           | Permite solo modos de seguridad exec como `deny` o `allowlist`.                                          |
| `tools.exec.requireAsk`         | `tools.exec.ask` y modo de solicitud exec por agente        | Requiere una postura de aprobación como `always`.                                                        |
| `tools.exec.allowHosts`         | `tools.exec.host` y enrutamiento de host exec por agente    | Permite solo modos de enrutamiento de host exec como `sandbox`.                                          |
| `tools.elevated.allow`          | `tools.elevated.enabled` y postura elevada por agente       | Se establece en `false` para requerir que el modo de herramienta elevada permanezca deshabilitado.        |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` y `tools.alsoAllow` por agente            | Requiere entradas `alsoAllow` exactas e informa concesiones de herramientas aditivas faltantes o inesperadas. |
| `tools.denyTools`               | `tools.deny` y `agents.list[].tools.deny`                   | Requiere que las listas configuradas de denegación de herramientas incluyan ids o grupos de herramientas como `group:runtime` y `group:fs`. |

## Ejecutar comprobaciones

Ejecuta comprobaciones solo de política durante la autoría:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` ejecuta solo el conjunto de comprobaciones de política y emite evidencia, hallazgos
y hashes de atestación. Los mismos hallazgos también aparecen en
`openclaw doctor --lint` cuando el Plugin de política está habilitado.

Compara un archivo de política de operador con una línea base creada:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` comprueba la sintaxis del archivo de política contra la sintaxis del archivo de política; no
inspecciona estado de ejecución, evidencia, credenciales ni secretos. Usa los mismos
metadatos de reglas que gobiernan las superposiciones con alcance: las listas de permitidos deben permanecer iguales o
más estrechas, las listas de denegados deben permanecer iguales o más amplias, los booleanos requeridos deben conservar
su valor, las cadenas ordenadas solo pueden moverse hacia el extremo más estricto del
orden configurado, y las listas exactas deben coincidir. La línea base puede ser una
política creada por la organización; la política comprobada puede agregar valores más estrictos o
reglas adicionales. Una regla comprobada de nivel superior puede satisfacer una regla de línea base con alcance cuando
es igual o más restrictiva. Los nombres de alcance no tienen que coincidir entre
archivos; la comparación se indexa por selector (`agentIds`/`channelIds`) y campo.

Comparación limpia (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

La salida limpia de `policy check --json` incluye hashes estables que un operador o
supervisor puede registrar:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Configurar política

La configuración de política vive en `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Ajuste                    | Propósito                                                       |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Habilita las comprobaciones de política incluso antes de que exista `policy.jsonc`. |
| `workspaceRepairs`        | Permite que `doctor --fix` edite ajustes del workspace gestionados por política. |
| `expectedHash`            | Bloqueo de hash opcional para el artefacto de política aprobado. |
| `expectedAttestationHash` | Bloqueo de hash opcional para la última comprobación de política limpia aceptada. |
| `path`                    | Ubicación relativa al workspace del artefacto de política.      |

Establece `plugins.entries.policy.config.enabled` en `false` para deshabilitar las comprobaciones de política
en un workspace mientras el plugin permanece instalado.

## Aceptar estado de política

Ejemplo de salida JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` identifica el artefacto de reglas creado. `evidence`
registra el estado observado de OpenClaw usado por las comprobaciones, y
`workspace.hash` identifica esa carga de evidencia. `findingsHash` identifica
el conjunto exacto de hallazgos. `checkedAt` registra cuándo se ejecutó la comprobación.
`attestationHash` identifica la afirmación estable (hash de política, hash de evidencia,
hash de hallazgos y estado limpio/sucio) y excluye deliberadamente `checkedAt`,
por lo que el mismo estado de política siempre produce el mismo hash de atestación. Juntos,
estos cuatro valores forman la tupla de auditoría de una comprobación de política.

Si un Gateway o supervisor usa la política para bloquear, aprobar o anotar una
acción de ejecución, debe registrar el hash de atestación de la última comprobación
limpia. `checkedAt` permanece en la salida JSON para registros de auditoría, pero no forma parte del
hash estable.

Ciclo de vida para aceptar estado de política:

1. Crea o revisa `policy.jsonc`.
2. Ejecuta `openclaw policy check --json`.
3. Si está limpio, registra `attestation.policy.hash` como `expectedHash`.
4. Registra `attestation.attestationHash` como `expectedAttestationHash`.
5. Vuelve a ejecutar `openclaw doctor --lint` en CI o en puertas de lanzamiento.

Si las reglas de política cambian intencionalmente, actualiza ambos hashes aceptados desde una
comprobación limpia. Si solo cambian los ajustes del espacio de trabajo (la política permanece igual),
normalmente solo cambia `expectedAttestationHash`.

Habilitar o actualizar las reglas de `agents.workspace` agrega evidencia de `agentWorkspace`
al hash del espacio de trabajo y al hash de atestación; revisa la nueva evidencia y
actualiza los hashes de atestación aceptados después de habilitarla. Habilitar o actualizar
las reglas de postura de herramientas agrega evidencia de `toolPosture` de la misma manera.

`openclaw policy watch` vuelve a ejecutar la comprobación e informa cuando la evidencia actual ya no
coincide con `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Usa `--once` en CI o scripts que necesiten una sola evaluación de desviación. Sin
`--once`, sondea cada dos segundos de forma predeterminada; usa `--interval-ms` para cambiar
el intervalo.

## Hallazgos

| ID de comprobación                                        | Hallazgo                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                             | La política está habilitada, pero falta `policy.jsonc`.                           |
| `policy/policy-jsonc-invalid`                             | La política no se puede analizar o contiene entradas de reglas mal formadas.       |
| `policy/policy-hash-mismatch`                             | La política no coincide con el `expectedHash` configurado.                        |
| `policy/attestation-hash-mismatch`                        | La evidencia de política actual ya no coincide con la atestación aceptada.         |
| `policy/policy-conformance-invalid`                       | Un archivo de política base o comprobado tiene sintaxis de comparación no válida.  |
| `policy/policy-conformance-missing`                       | A un archivo de política comprobado le falta una regla requerida por el archivo de política base. |
| `policy/policy-conformance-weaker`                        | Un archivo de política comprobado tiene un valor más débil que el archivo de política base. |
| `policy/channels-denied-provider`                         | Un canal habilitado coincide con una regla de denegación de canal.                 |
| `policy/mcp-denied-server`                                | Un servidor MCP configurado está denegado por la política.                        |
| `policy/mcp-unapproved-server`                            | Un servidor MCP configurado está fuera de la lista de permitidos.                  |
| `policy/models-denied-provider`                           | Un proveedor de modelos configurado o una referencia de modelo usa un proveedor denegado. |
| `policy/models-unapproved-provider`                       | Un proveedor de modelos configurado o una referencia de modelo está fuera de la lista de permitidos. |
| `policy/network-private-access-enabled`                   | Una vía de escape SSRF de red privada está habilitada cuando la política la deniega. |
| `policy/ingress-dm-policy-unapproved`                     | Una política de DM de canal está fuera de la lista de permitidos de la política.   |
| `policy/ingress-dm-scope-unapproved`                      | `session.dmScope` no coincide con el ámbito de aislamiento de DM requerido por la política. |
| `policy/ingress-open-groups-denied`                       | Una política de grupo de canal es `open` mientras la política deniega la entrada de grupos abiertos. |
| `policy/ingress-group-mention-required`                   | Una entrada de canal o grupo deshabilita las puertas de mención mientras la política las requiere. |
| `policy/gateway-non-loopback-bind`                        | La postura de enlace del Gateway permite exposición no loopback cuando la política la deniega. |
| `policy/gateway-auth-disabled`                            | La autenticación del Gateway está deshabilitada cuando la política requiere autenticación. |
| `policy/gateway-rate-limit-missing`                       | La postura de límite de tasa de autenticación del Gateway no es explícita cuando la política la requiere. |
| `policy/gateway-control-ui-insecure`                      | Los conmutadores de exposición insegura de Control UI del Gateway están habilitados. |
| `policy/gateway-tailscale-funnel`                         | La exposición de Tailscale Funnel del Gateway está habilitada cuando la política la deniega. |
| `policy/gateway-remote-enabled`                           | El modo remoto del Gateway está activo cuando la política lo deniega.              |
| `policy/gateway-http-endpoint-enabled`                    | Un endpoint de API HTTP del Gateway está habilitado mientras la política lo deniega. |
| `policy/gateway-http-url-fetch-unrestricted`              | La entrada de obtención de URL HTTP del Gateway carece de una lista de URL permitidas requerida. |
| `policy/gateway-node-command-denied`                      | OpenClaw config no deniega un comando de nodo denegado por la política.            |
| `policy/agents-workspace-access-denied`                   | El modo sandbox del agente o el acceso al espacio de trabajo está fuera de la lista de permitidos de la política. |
| `policy/agents-tool-not-denied`                           | Un agente o configuración predeterminada no deniega una herramienta requerida por la política. |
| `policy/tools-profile-unapproved`                         | Un perfil de herramientas global o por agente configurado está fuera de la lista de permitidos. |
| `policy/tools-fs-workspace-only-required`                 | Las herramientas del sistema de archivos no están configuradas con postura de rutas solo del espacio de trabajo. |
| `policy/tools-exec-security-unapproved`                   | El modo de seguridad de ejecución está fuera de la lista de permitidos de la política. |
| `policy/tools-exec-ask-unapproved`                        | El modo de solicitud de ejecución está fuera de la lista de permitidos de la política. |
| `policy/tools-exec-host-unapproved`                       | El enrutamiento de host de ejecución está fuera de la lista de permitidos de la política. |
| `policy/tools-elevated-enabled`                           | El modo de herramienta elevada está habilitado cuando la política lo deniega.      |
| `policy/tools-also-allow-missing`                         | A una lista `alsoAllow` configurada le falta una entrada requerida por la política. |
| `policy/tools-also-allow-unexpected`                      | Una lista `alsoAllow` configurada incluye una entrada no esperada por la política. |
| `policy/tools-required-deny-missing`                      | Una lista de denegación de herramientas global o por agente no incluye una herramienta denegada requerida. |
| `policy/sandbox-mode-unapproved`                          | El modo sandbox está fuera de la lista de permitidos de la política.               |
| `policy/sandbox-backend-unapproved`                       | El backend del sandbox está fuera de la lista de permitidos de la política.        |
| `policy/sandbox-container-posture-unobservable`           | Una regla de postura de contenedor está habilitada para un backend que no puede observarla. |
| `policy/sandbox-container-host-network-denied`            | Un sandbox o navegador respaldado por contenedor usa modo de red del host.         |
| `policy/sandbox-container-namespace-join-denied`          | Un sandbox o navegador respaldado por contenedor se une al espacio de nombres de otro contenedor. |
| `policy/sandbox-container-mount-mode-required`            | Un montaje de sandbox o navegador respaldado por contenedor no es de solo lectura. |
| `policy/sandbox-container-runtime-socket-mount`           | Un montaje de sandbox o navegador respaldado por contenedor expone el socket del runtime del contenedor. |
| `policy/sandbox-container-unconfined-profile`             | El perfil del sandbox de contenedor no está confinado cuando la política lo deniega. |
| `policy/sandbox-browser-cdp-source-range-missing`         | Falta el rango de origen CDP del navegador sandbox cuando la política lo requiere. |
| `policy/data-handling-redaction-disabled`                 | La redacción de registros sensibles está deshabilitada cuando la política la requiere. |
| `policy/data-handling-telemetry-content-capture`          | La captura de contenido de telemetría está habilitada cuando la política la deniega. |
| `policy/data-handling-session-retention-not-enforced`     | El mantenimiento de retención de sesión no se aplica cuando la política lo requiere. |
| `policy/data-handling-session-transcript-memory-enabled`  | La indexación en memoria de transcripciones de sesión está habilitada cuando la política la deniega. |
| `policy/secrets-unmanaged-provider`                       | Una SecretRef de configuración referencia un proveedor no declarado en `secrets.providers`. |
| `policy/secrets-denied-provider-source`                   | Un proveedor de secretos de configuración o SecretRef usa una fuente denegada por la política. |
| `policy/secrets-insecure-provider`                        | Un proveedor de secretos opta por una postura insegura cuando la política la deniega. |
| `policy/auth-profile-invalid-metadata`                    | A un perfil de autenticación de configuración le faltan metadatos válidos de proveedor o modo. |
| `policy/auth-profile-unapproved-mode`                     | Un modo de perfil de autenticación de configuración está fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-missing`                           | La política requiere `exec-approvals.json`, pero falta el artefacto.               |
| `policy/exec-approvals-invalid`                           | El artefacto de aprobaciones de ejecución configurado no se puede analizar.        |
| `policy/exec-approvals-default-security-unapproved`       | Los valores predeterminados de aprobación de ejecución usan un modo de seguridad fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-agent-security-unapproved`         | Un modo de seguridad de aprobación de ejecución efectivo por agente está fuera de la lista de permitidos. |
| `policy/exec-approvals-auto-allow-skills-enabled`         | Un agente de aprobación de ejecución permite automáticamente de forma implícita CLI de Skills cuando la política lo deniega. |
| `policy/exec-approvals-allowlist-missing`                 | A la lista de permitidos de aprobaciones le falta un patrón requerido por la política. |
| `policy/exec-approvals-allowlist-unexpected`              | La lista de permitidos de aprobaciones incluye un patrón no esperado por la política. |
| `policy/tools-missing-risk-level`                         | A una declaración de herramienta gobernada le faltan metadatos de riesgo.          |
| `policy/tools-unknown-risk-level`                         | Una declaración de herramienta gobernada usa un valor de riesgo desconocido.       |
| `policy/tools-missing-sensitivity-token`                  | A una declaración de herramienta gobernada le faltan metadatos de sensibilidad.    |
| `policy/tools-missing-owner`                              | A una declaración de herramienta gobernada le faltan metadatos de propietario.     |
| `policy/tools-unknown-sensitivity-token`                  | Una declaración de herramienta gobernada usa un valor de sensibilidad desconocido. |

Un hallazgo puede incluir tanto `target` (el elemento observado del espacio de trabajo que no
cumple) como `requirement` (la regla redactada que lo convirtió en hallazgo).
Ambos son cadenas de dirección `oc://` hoy, pero los nombres de campo describen el rol de
política en lugar del formato de dirección.

Hallazgos de ejemplo:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparación

`doctor --lint` y `policy check` son de solo lectura.

`doctor --fix` solo edita los ajustes del espacio de trabajo gestionados por la política cuando
`workspaceRepairs` está habilitado explícitamente; de lo contrario, las comprobaciones informan qué
repararían y dejan los ajustes sin cambios.

En esta versión, la reparación puede deshabilitar canales denegados por `channels.denyRules` y
aplicar las reparaciones automáticas de restricción enumeradas a continuación. Habilita `workspaceRepairs`
solo después de que se haya revisado el archivo de política, porque una regla válida puede cambiar
la configuración del espacio de trabajo:

- establecer `tools.elevated.enabled=false` cuando una política global prohíbe herramientas elevadas
- agregar los ids de herramientas de denegación obligatoria faltantes a `tools.deny` o
  `agents.list[].tools.deny` cuando la política requiere que esas herramientas se denieguen
- establecer los conmutadores inseguros de `gateway.controlUi.*` en `false`
- establecer `gateway.mode=local` cuando la política deniega el modo Gateway remoto
- establecer `logging.redactSensitive=tools` cuando la política requiere la redacción del registro
  sensible
- establecer `diagnostics.otel.captureContent=false`, o
  `diagnostics.otel.captureContent.enabled=false` para ajustes de captura de telemetría en forma de objeto,
  cuando la política deniega la captura de contenido de telemetría

Las reparaciones de herramientas elevadas con alcance solo se detectan. Las reparaciones de manejo de datos con alcance
también se omiten cuando el hallazgo informa una configuración compartida de registro o telemetría,
porque cambiar el ajuste compartido afectaría a más que el destino de política con alcance.

Las reparaciones de denegación obligatoria con alcance se omiten cuando el hallazgo informa la herencia
raíz de `tools.deny`, porque agregar la herramienta requerida a la configuración raíz afectaría
a más que el destino de política con alcance. Las reparaciones de denegación obligatoria locales del agente pueden actualizar
la ruta `agents.list[].tools.deny` informada.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Códigos de salida

| Comando          | `0`                                                        | `1`                                                                          | `2`                                  |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| `policy check`   | No hay hallazgos en el umbral.                             | Uno o más hallazgos cumplieron el umbral.                                     | Fallo de argumento o de ejecución.   |
| `policy compare` | El archivo de política es al menos tan estricto como la línea base. | El archivo de política no es válido, falta o es más débil que las reglas de línea base. | Fallo de argumento o de ejecución.   |
| `policy watch`   | No hay hallazgos y el hash aceptado está actualizado.       | Existen hallazgos o la certificación aceptada está obsoleta.                  | Fallo de argumento o de ejecución.   |

## Relacionado

- [Modo lint de Doctor](/es/cli/doctor#lint-mode)
- [CLI de rutas](/es/cli/path)
