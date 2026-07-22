---
read_when:
    - Quieres comprobar la configuración de OpenClaw con un archivo policy.jsonc creado manualmente
    - Quieres que el lint de doctor detecte incumplimientos de políticas
    - Necesita un hash de certificación de políticas como evidencia de auditoría
summary: Referencia de la CLI para comprobaciones de conformidad de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-07-22T10:28:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63e4faeab8dd6535e3d517439d3f58cdc167b6b7fade808a6482742ec9b5acf1
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` lo proporciona el Plugin de políticas incluido. Es una capa de
conformidad empresarial sobre la configuración existente de OpenClaw, no un segundo
sistema de configuración. Los requisitos se definen en `policy.jsonc`; OpenClaw observa el
espacio de trabajo activo como evidencia; la política informa de las desviaciones mediante `doctor --lint`. La política
no aplica restricciones a las llamadas de herramientas ni reescribe el comportamiento en tiempo de ejecución al procesar solicitudes, y
no certifica almacenes de credenciales por agente como `auth-profiles.json`.

La política comprueba los canales configurados, los servidores MCP, los proveedores de modelos, la
postura de SSRF de la red, el acceso de entrada/canal, la exposición del Gateway y la postura de comandos de Node,
las pruebas de enrutamiento de mensajes definidas,
el acceso al espacio de trabajo de los agentes, la postura del entorno aislado, la postura de tratamiento de datos, la postura de los
proveedores de secretos/perfiles de autenticación y los metadatos de las herramientas gobernadas (`TOOLS.md`). Se utiliza
cuando un espacio de trabajo necesita una declaración duradera y verificable como «Telegram no debe
estar habilitado» o «las herramientas gobernadas deben declarar metadatos de riesgo y propietario». Si
solo se necesita comportamiento local sin certificación ni detección de desviaciones, la
configuración normal es suficiente.

## Inicio rápido

```bash
openclaw plugins enable policy
```

El Plugin permanece habilitado incluso cuando falta `policy.jsonc`, para que doctor pueda
informar de la ausencia del artefacto en lugar de omitir silenciosamente las comprobaciones.

`policy.jsonc` se debe crear manualmente; no se genera a partir de la configuración actual. Cada
sección de nivel superior es un espacio de nombres de reglas: una comprobación solo se ejecuta cuando hay una regla
concreta en ella (las secciones o claves no compatibles generan
`policy/policy-jsonc-invalid` en lugar de ignorarse silenciosamente). Ejemplo
mínimo que abarca todas las secciones compatibles:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram no está aprobado para este espacio de trabajo.",
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
  "routing": {
    "requireBindings": true,
    "requireConfiguredChannels": true,
    "probes": [
      {
        "id": "family-dm",
        "route": {
          "channel": "imessage",
          "peer": { "kind": "direct", "id": "+15555550123" },
        },
        "expect": {
          "agentId": "family",
          "matchedBy": ["binding.peer"],
        },
      },
    ],
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

Notas transversales que no resultan evidentes en las tablas de reglas siguientes:

- Omitir `gateway.bind` mientras se deniegan los enlaces que no son de bucle invertido significa que se acepta
  el valor predeterminado del entorno de ejecución; se debe establecer `gateway.bind: "loopback"` para una conformidad estricta.
- Para un agente de solo lectura, se debe establecer `mode` del entorno aislado en `all` o `non-main` en los
  valores predeterminados o el agente aplicables, y `workspaceAccess` en `none` o `ro`. Un modo de
  entorno aislado ausente o `off` no satisface una política de solo lectura.
- `agents.workspace.denyTools` acepta `exec`, `process`, `write`, `edit`,
  `apply_patch`. Los grupos de denegación de herramientas de configuración `group:fs` (modificación de archivos) y
  `group:runtime` (shell/proceso) satisfacen la postura equivalente.
- Las comprobaciones de aprobaciones de ejecución leen el artefacto `exec-approvals.json` activo solo cuando
  hay una regla `execApprovals`; un artefacto ausente o no válido es
  evidencia no observable, no una aprobación sintética.
- La evidencia de secretos y perfiles de autenticación registra la postura del proveedor/origen y
  solo los metadatos de SecretRef, nunca los valores sin procesar. La política no lee ni certifica
  almacenes de credenciales por agente como `auth-profiles.json`.
- La evidencia de tratamiento de datos representa únicamente la postura de configuración (modo de
  ocultación, opción de captura de telemetría, modo de mantenimiento de sesiones y ajuste de
  indexación de transcripciones). No inspecciona registros, exportaciones de telemetría, transcripciones ni
  archivos de memoria, y un resultado sin incidencias no demuestra que no contengan datos personales ni
  secretos.
- Las pruebas de enrutamiento reutilizan el resolutor de vinculaciones del entorno de ejecución de OpenClaw. La evidencia de enrutamiento
  registra únicamente el identificador de la prueba, el agente resuelto, el tipo de coincidencia y los metadatos
  ocultos de la vinculación. Nunca registra identificadores de interlocutores, cuentas, gremios, equipos ni roles.
  Añadir una sección de enrutamiento cambia intencionadamente los hashes de la política y la certificación;
  las políticas sin enrutamiento conservan la forma de evidencia existente.

### Referencia de reglas de políticas

Todas las reglas siguientes son opcionales; una comprobación solo se ejecuta cuando la regla está presente. El
estado observado corresponde a la configuración existente de OpenClaw o a los metadatos del espacio de trabajo.

#### Superposiciones con ámbito

Se utiliza `scopes.<scopeName>` cuando determinados agentes o canales necesitan una política más estricta
que la base de nivel superior. El nombre del ámbito es solo una etiqueta; la coincidencia utiliza el
selector dentro del ámbito. Las superposiciones son aditivas: la regla global sigue ejecutándose
y la regla con ámbito puede añadir su propio hallazgo sobre la misma evidencia.

| Selector     | Secciones compatibles                                                           | Se utiliza cuando                                    |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Uno o más agentes del entorno de ejecución necesitan reglas más estrictas. |
| `channelIds` | `ingress.channels`                                                             | Uno o más canales necesitan reglas de entrada más estrictas. |

Si una entrada `agentIds` no está presente en `agents.entries.*`, OpenClaw evalúa
la regla con ámbito respecto a la postura global/predeterminada heredada para ese identificador de
agente del entorno de ejecución en lugar de omitirla.

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

El mismo agente puede aparecer en varios ámbitos si cada uno rige un
campo diferente, como en el ejemplo anterior. Un campo con ámbito repetido para el mismo agente debe ser igual o
más restrictivo; se rechazan las declaraciones duplicadas más permisivas (las listas de permitidos son
subconjuntos, las listas de denegados son superconjuntos y los booleanos obligatorios son fijos).

Las reglas de postura de contenedores (`sandbox.containers.*`) se comprueban únicamente con
la evidencia que puede exponer el backend del entorno aislado del agente coincidente. Si un backend no puede
observar una regla habilitada para él, la política informa de
`policy/sandbox-container-posture-unobservable` en lugar de aprobarla; las reglas de
contenedores deben limitarse a los grupos de agentes que utilizan un backend capaz de exponerlas.

`ingress.session.requireDmScope` de nivel superior continúa siendo global; `session.dmScope`
no es evidencia atribuible a un canal, por lo que no se puede limitar mediante `channelIds`.

Todos los ámbitos presentes en `policy.jsonc` deben ser válidos y aplicables.

#### Canales

| Campo de política                     | Estado observado                       | Se utiliza cuando                                              |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Proveedor y estado habilitado de `channels.*` | Se deben denegar los canales configurados de un proveedor como `telegram`. |
| `channels.denyRules[].reason`        | Mensaje del hallazgo y contexto de la sugerencia de reparación | Se debe explicar por qué se deniega el proveedor.             |

#### Servidores MCP

| Campo de política   | Estado observado     | Se utiliza cuando                                            |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | Identificadores de `mcp.servers.*` | Se debe exigir que todos los servidores MCP configurados estén en una lista de permitidos. |
| `mcp.servers.deny`  | Identificadores de `mcp.servers.*` | Se deben denegar identificadores concretos de servidores MCP configurados. |

#### Proveedores de modelos

| Campo de política        | Estado observado                                  | Se utiliza cuando                                                                 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | Identificadores de `models.providers.*` y referencias de modelos seleccionados | Se debe exigir que los proveedores configurados y las referencias de modelos seleccionados utilicen proveedores aprobados. |
| `models.providers.deny`  | Identificadores de `models.providers.*` y referencias de modelos seleccionados | Se deben denegar los proveedores configurados y las referencias de modelos seleccionados por identificador de proveedor. |

#### Red

| Campo de política              | Estado observado                      | Usar cuando                                                                 |
| ------------------------------ | -------------------------------------- | --------------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Excepciones de escape de SSRF para redes privadas | Establecer en `false` para exigir que el acceso a redes privadas permanezca deshabilitado. |

#### Enrutamiento de mensajes

| Campo de política                   | Estado observado                                         | Usar cuando                                                                  |
| ----------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `routing.requireBindings`           | Vinculaciones de rutas de canales, excluidas las vinculaciones de ACP | Exigir al menos una vinculación de enrutamiento de mensajes.                  |
| `routing.requireConfiguredChannels` | Identificadores de canal de las vinculaciones e identificadores `channels.*` configurados | Detectar identificadores de canal obsoletos o mal escritos en las vinculaciones. |
| `routing.probes[].route`            | El solucionador público de rutas de OpenClaw             | Describir una ruta entrante representativa sin enviar un mensaje.             |
| `routing.probes[].expect.agentId`   | Identificador del agente resuelto                         | Exigir que la ruta llegue al agente revisado.                                 |
| `routing.probes[].expect.matchedBy` | Tipo de coincidencia del solucionador                     | Exigir la especificidad revisada de la vinculación de par, cuenta, canal u otro tipo. |

Los identificadores de las sondas deben ser únicos. Una ruta admite `channel`, `accountId` opcional,
`peer`, `parentPeer`, `guildId`, `teamId` y `memberRoleIds`. Los tipos de par son
`direct`, `group` y `channel`. `matchedBy` puede contener uno o más tipos de
coincidencia en tiempo de ejecución, incluidos `binding.peer`, `binding.account`, `binding.channel`
o `default`.

Las comprobaciones de enrutamiento son únicamente comprobaciones de conformidad. No modifican el inicio,
la entrega de mensajes, la precedencia de las vinculaciones ni el comportamiento de reserva. Los hallazgos requieren
la revisión del operador, ya que cambiar automáticamente una vinculación podría redirigir
mensajes privados.

#### Entrada y acceso a canales

| Campo de política                         | Estado observado                                                    | Usar cuando                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Exigir un ámbito revisado de aislamiento de mensajes directos.           |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` y campos heredados de políticas de MD del canal | Permitir únicamente políticas revisadas de mensajes directos del canal.  |
| `ingress.channels.denyOpenGroups`         | Política de entrada de canales, cuentas y grupos                    | Denegar la entrada abierta de grupos en los canales y cuentas configurados. |
| `ingress.channels.requireMentionInGroups` | Configuración de puertas de mención de canales, cuentas, grupos, servidores y elementos anidados | Exigir puertas de mención cuando la entrada de grupos esté abierta o condicionada a menciones. |

#### Gateway

| Campo de política                       | Estado observado                                      | Usar cuando                                                                                       |
| --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Establecer en `false` para exigir que el Gateway se vincule a la interfaz de bucle invertido. |
| `gateway.exposure.allowTailscaleFunnel` | Postura de serve/funnel del Gateway en Tailscale      | Establecer en `false` para denegar la exposición mediante Tailscale Funnel.            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Establecer en `true` para rechazar la autenticación deshabilitada del Gateway.        |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Establecer en `true` para exigir una configuración explícita del límite de frecuencia de autenticación. |
| `gateway.controlUi.allowInsecure`       | Opciones de autenticación, dispositivo u origen inseguros de la interfaz de control | Establecer en `false` para denegar las opciones de exposición insegura de la interfaz de control. |
| `gateway.remote.allow`                  | Modo/configuración remotos del Gateway                 | Establecer en `false` para denegar el modo remoto del Gateway.                          |
| `gateway.http.denyEndpoints`            | Endpoints de la API HTTP del Gateway                   | Denegar identificadores de endpoint como `chatCompletions` o `responses`.                 |
| `gateway.http.requireUrlAllowlists`     | Entradas de obtención de URL por HTTP del Gateway      | Establecer en `true` para exigir listas de URL permitidas en las entradas de obtención de URL. |
| `gateway.nodes.denyCommands`            | `gateway.nodes.commands.deny`                  | Exigir que los identificadores exactos de comandos de Node, como `system.run`, estén denegados en la configuración de OpenClaw. |

`gateway.nodes.denyCommands` es una regla exacta, sensible a mayúsculas y minúsculas, de superconjunto de denegación de políticas.
Se utiliza cuando la política debe demostrar que los comandos privilegiados de Node están explícitamente
denegados por la configuración de OpenClaw. Una implementación que permita intencionadamente un comando privilegiado
de Node debe actualizar `policy.jsonc` después de la revisión, en lugar de depender únicamente de
`gateway.nodes.commands.allow`.

#### Espacio de trabajo del agente

| Campo de política                | Estado observado                                                                           | Usar cuando                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` y `agents.entries.*.sandbox.workspaceAccess` | Permitir únicamente valores de acceso al espacio de trabajo del entorno aislado como `none` o `ro`. |
| `agents.workspace.denyTools`     | Configuración global y por agente de denegación de herramientas                             | Exigir que se denieguen las herramientas de modificación (`exec`, `process`, `write`, `edit`, `apply_patch`). |

#### Postura del entorno aislado

| Campo de política                                     | Estado observado                                             | Usar cuando                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` y modo por agente       | Permitir únicamente modos revisados del entorno aislado, como `all` o `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` y backend por agente | Permitir únicamente backends revisados del entorno aislado, como `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Modo de red del entorno aislado/navegador basado en contenedores | Denegar el modo de red del host.                                          |
| `sandbox.containers.denyContainerNamespaceJoin`       | Modo de red del entorno aislado/navegador basado en contenedores | Denegar la incorporación al espacio de nombres de red de otro contenedor. |
| `sandbox.containers.requireReadOnlyMounts`            | Modo de montaje del entorno aislado/navegador basado en contenedores | Exigir que los montajes sean de solo lectura.                             |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montaje del entorno aislado/navegador basado en contenedores | Denegar montajes de sockets del entorno de ejecución de contenedores.     |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura del perfil de seguridad del contenedor               | Denegar perfiles de seguridad de contenedores sin restricciones.         |
| `sandbox.browser.requireCdpSourceRange`               | Intervalo de origen de CDP del navegador del entorno aislado  | Exigir que la exposición de CDP del navegador declare un intervalo de origen. |

La política trata la ausencia de `sandbox.mode` como su valor predeterminado implícito `off`, por lo que
`sandbox.requireMode` informa de que un entorno aislado nuevo o sin configurar está fuera de una
lista de elementos permitidos como `["all"]`.

#### Tratamiento de datos

| Campo de política                                  | Estado observado                                                                                      | Usar cuando                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                                          | Establecer en `true` para rechazar `logging.redactSensitive: "off"`.                 |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                                  | Establecer en `true` para rechazar la captura de contenido de telemetría. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                                         | Establecer en `true` para exigir el modo efectivo de mantenimiento de sesiones `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled`, `memory.search.experimental.sessionMemory` y anulaciones por agente | Establecer en `true` para rechazar la indexación en memoria de las transcripciones de sesiones. |

#### Secretos

| Campo de política                 | Estado observado                                                | Usar cuando                                                                           |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs de configuración y declaraciones `secrets.providers.*` | Establecer en `true` para exigir que las SecretRefs apunten a proveedores declarados. |
| `secrets.denySources`             | Orígenes de proveedores de secretos y orígenes de SecretRef     | Denegar orígenes como `exec`, `file` u otro nombre de origen configurado. |
| `secrets.allowInsecureProviders`  | Indicadores de postura insegura de proveedores de secretos      | Establecer en `false` para rechazar proveedores que acepten una postura insegura. |

#### Aprobaciones de ejecución

Las comprobaciones de aprobaciones de ejecución leen el artefacto de tiempo de ejecución `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` de forma predeterminada, o
`$OPENCLAW_STATE_DIR/exec-approvals.json` cuando se establece `OPENCLAW_STATE_DIR`.
Las reglas de postura de `execApprovals.defaults.*` o `execApprovals.agents.*`
requieren evidencia legible del artefacto; un artefacto ausente o no válido se notifica como
evidencia no observable, en lugar de aprobarse según el mejor esfuerzo posible. Una vez que es legible, los campos
omitidos heredan los valores predeterminados del entorno de ejecución: la ausencia de `defaults.security` equivale a `full`, y
la ausencia de seguridad del agente hereda ese valor predeterminado. La evidencia incluye `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` opcional, la postura efectiva de
`autoAllowSkills` y el origen de la entrada; nunca la ruta o el token del socket,
`commandText`, `lastUsedCommand`, las rutas resueltas ni las marcas de tiempo.

| Campo de política                           | Estado observado                                                                        | Cuándo usarlo                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Ruta de `exec-approvals.json` del entorno de ejecución activo                            | Establézcalo en `true` para exigir que el artefacto de aprobaciones exista y se pueda analizar. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, con valor predeterminado `full`                                 | Permitir solo los modos de seguridad de aprobación predeterminados que estén aprobados.   |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, que hereda los valores predeterminados                             | Permitir solo los modos de seguridad de aprobación efectivos por agente que estén aprobados. |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` y `agents.*.autoAllowSkills`, que heredan los valores predeterminados del entorno de ejecución | Establézcalo en `false` para exigir listas de permitidos manuales estrictas sin aprobación implícita de la CLI de Skills. |
| `execApprovals.agents.allowlist.expected`   | Patrón `agents.*.allowlist[]` agregado y entradas argPattern opcionales                 | Exigir que la lista de permitidos de aprobaciones coincida con el conjunto de patrones revisado. |

Ejemplo: exigir el artefacto de aprobaciones, denegar valores predeterminados permisivos y permitir
solo la postura de aprobación de ejecución revisada para los agentes seleccionados.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Modos de seguridad: "deny", "allowlist" o "full".
      // Este valor predeterminado solo permite la postura de denegación restringida.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Los agentes seleccionados pueden usar la postura de lista de permitidos revisada, pero no "full".
          "allowSecurity": ["allowlist"],
          // false significa que las CLI de Skills deben aparecer en la lista de permitidos revisada en lugar de
          // recibir aprobación implícita mediante autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Entrada simple: patrón exacto del ejecutable revisado sin argPattern.
              "travel-hub",
              // Entrada restringida: patrón más expresión regular de argumentos revisada.
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

| Campo de política               | Estado observado                                | Cuándo usarlo                                                                              |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadatos de proveedor y modo de `auth.profiles.*` | Exigir claves de metadatos como `provider` y `mode` en los perfiles de autenticación de la configuración. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                          | Permitir solo modos compatibles de perfiles de autenticación como `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadatos de herramientas

| Campo de política       | Estado observado                         | Cuándo usarlo                                                                              |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Declaraciones de `TOOLS.md` reguladas | Exigir que las herramientas reguladas declaren claves de metadatos como `risk`, `sensitivity` o `owner`. |

#### Postura de herramientas

| Campo de política               | Estado observado                                                | Cuándo usarlo                                                                                             |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` y `agents.entries.*.tools.profile`              | Permitir solo identificadores de perfiles de herramientas como `minimal`, `messaging` o `coding`. |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` y anulaciones de `tools.fs` por agente | Establézcalo en `true` para exigir una postura de herramientas del sistema de archivos limitada al espacio de trabajo. |
| `tools.exec.allowSecurity`      | `tools.exec.security` y seguridad de ejecución por agente       | Permitir solo modos de seguridad de ejecución como `deny` o `allowlist`.                |
| `tools.exec.requireAsk`         | `tools.exec.ask` y modo de solicitud de ejecución por agente | Exigir una postura de aprobación como `always`.                                                   |
| `tools.exec.allowHosts`         | `tools.exec.host` y enrutamiento del host de ejecución por agente | Permitir solo modos de enrutamiento del host de ejecución como `sandbox`.                          |
| `tools.elevated.allow`          | `tools.elevated.enabled` y postura elevada por agente        | Establézcalo en `false` para exigir que el modo de herramientas elevadas permanezca deshabilitado. |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` y `tools.alsoAllow` por agente          | Exigir entradas `alsoAllow` exactas e informar de concesiones adicionales de herramientas faltantes o inesperadas. |
| `tools.denyTools`               | `tools.deny` y `agents.entries.*.tools.deny`             | Exigir que las listas de herramientas denegadas configuradas incluyan identificadores o grupos de herramientas como `group:runtime` y `group:fs`. |

## Ejecutar comprobaciones

Ejecute comprobaciones exclusivas de políticas durante la creación:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` ejecuta únicamente el conjunto de comprobaciones de políticas y emite pruebas, hallazgos
y hashes de atestación. Los mismos hallazgos también aparecen en
`openclaw doctor --lint` cuando el Plugin de políticas está habilitado.

Compare un archivo de políticas del operador con una línea base creada:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` comprueba la sintaxis de un archivo de políticas con respecto a la sintaxis de otro archivo de políticas; no
inspecciona el estado del entorno de ejecución, las pruebas, las credenciales ni los secretos. Utiliza los mismos
metadatos de reglas que rigen las superposiciones con ámbito: las listas de permitidos deben mantenerse iguales o
ser más restrictivas, las listas de denegados deben mantenerse iguales o ser más amplias, los booleanos obligatorios deben conservar
su valor, las cadenas ordenadas solo pueden desplazarse hacia el extremo más estricto del
orden configurado y las listas exactas deben coincidir. La línea base puede ser una
política creada por una organización; la política comprobada puede añadir valores más estrictos o
reglas adicionales. Una regla comprobada de nivel superior puede satisfacer una regla de línea base con ámbito cuando
es igual o más restrictiva. No es necesario que los nombres de los ámbitos coincidan entre
archivos; la comparación se indexa por selector (`agentIds`/`channelIds`) y campo.
Para las sondas de enrutamiento, cada identificador de sonda de la línea base debe conservar la misma ruta
y el mismo agente esperado. Una política comprobada puede añadir sondas o restringir `matchedBy`, pero
eliminar una sonda, cambiar su ruta o agente, o ampliar los tipos de coincidencia aceptados
es menos restrictivo.

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

## Configurar la política

La configuración de políticas se encuentra en `plugins.entries.policy.config`.

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

| Ajuste                    | Finalidad                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| `enabled`                 | Habilitar las comprobaciones de políticas incluso antes de que exista `policy.jsonc`. |
| `workspaceRepairs`        | Permitir que `doctor --fix` edite los ajustes del espacio de trabajo administrados por políticas. |
| `expectedHash`            | Bloqueo de hash opcional para el artefacto de política aprobado.        |
| `expectedAttestationHash` | Bloqueo de hash opcional para la última comprobación de política limpia aceptada. |
| `path`                    | Ubicación del artefacto de política relativa al espacio de trabajo.     |

Establezca `plugins.entries.policy.config.enabled` en `false` para deshabilitar las
comprobaciones de políticas de un espacio de trabajo sin desinstalar el Plugin.

## Aceptar el estado de la política

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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
registra el estado observado de OpenClaw utilizado por las comprobaciones, y
`workspace.hash` identifica esa carga de evidencia. `findingsHash` identifica
el conjunto exacto de hallazgos. `checkedAt` registra cuándo se ejecutó la comprobación.
`attestationHash` identifica la declaración estable (hash de la política, hash de la evidencia,
hash de los hallazgos y estado limpio o con cambios) y excluye deliberadamente `checkedAt`,
de modo que el mismo estado de la política siempre produzca el mismo hash de atestación. En conjunto,
estos cuatro valores forman la tupla de auditoría de una comprobación de política.

Si un Gateway o supervisor utiliza la política para bloquear, aprobar o anotar una
acción en tiempo de ejecución, debe registrar el hash de atestación de la última
comprobación limpia. `checkedAt` permanece en la salida JSON para los registros de auditoría, pero no forma parte del
hash estable.

Ciclo de vida para aceptar el estado de la política:

1. Cree o revise `policy.jsonc`.
2. Ejecute `openclaw policy check --json`.
3. Si está limpio, registre `attestation.policy.hash` como `expectedHash`.
4. Registre `attestation.attestationHash` como `expectedAttestationHash`.
5. Vuelva a ejecutar `openclaw doctor --lint` en la Pipeline de CI o en los controles de publicación.

Si las reglas de la política cambian intencionadamente, actualice ambos hashes aceptados a partir de una
comprobación limpia. Si solo cambia la configuración del espacio de trabajo (la política permanece igual),
normalmente solo cambia `expectedAttestationHash`.

Habilitar o actualizar las reglas de `agents.workspace` añade evidencia de `agentWorkspace`
al hash del espacio de trabajo y al hash de atestación; revise la nueva evidencia y
actualice los hashes de atestación aceptados después de habilitarlas. Habilitar o actualizar
las reglas de postura de las herramientas añade evidencia de `toolPosture` de la misma manera.

`openclaw policy watch` vuelve a ejecutar la comprobación e informa cuando la evidencia actual ya
no coincide con `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Utilice `--once` en la Pipeline de CI o en scripts que necesiten una única evaluación de desviaciones. Sin
`--once`, de forma predeterminada realiza una consulta cada dos segundos; utilice `--interval-ms` para cambiar
el intervalo.

## Hallazgos

| Id. de comprobación                                     | Hallazgo                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La política está habilitada, pero falta `policy.jsonc`.                           |
| `policy/policy-jsonc-invalid`                            | La política no se puede analizar o contiene entradas de reglas con formato incorrecto. |
| `policy/policy-hash-mismatch`                            | La política no coincide con el valor configurado de `expectedHash`.                |
| `policy/attestation-hash-mismatch`                       | La evidencia actual de la política ya no coincide con la atestación aceptada.     |
| `policy/policy-conformance-invalid`                      | Un archivo de política de referencia o comprobado tiene una sintaxis de comparación no válida. |
| `policy/policy-conformance-missing`                      | A un archivo de política comprobado le falta una regla requerida por el archivo de política de referencia. |
| `policy/policy-conformance-weaker`                       | Un archivo de política comprobado tiene un valor menos restrictivo que el archivo de política de referencia. |
| `policy/channels-denied-provider`                        | Un canal habilitado coincide con una regla de denegación de canales.              |
| `policy/mcp-denied-server`                               | La política deniega un servidor MCP configurado.                                  |
| `policy/mcp-unapproved-server`                           | Un servidor MCP configurado está fuera de la lista de permitidos.                 |
| `policy/models-denied-provider`                          | Un proveedor de modelos o una referencia de modelo configurados usan un proveedor denegado. |
| `policy/models-unapproved-provider`                      | Un proveedor de modelos o una referencia de modelo configurados están fuera de la lista de permitidos. |
| `policy/network-private-access-enabled`                  | Se ha habilitado una vía de escape de SSRF para redes privadas cuando la política la deniega. |
| `policy/routing-bindings-required`                       | La política requiere una vinculación de ruta de canal, pero no hay ninguna configurada. |
| `policy/routing-binding-channel-unconfigured`            | Una vinculación de ruta nombra un canal que no figura en `channels.*`.            |
| `policy/routing-agent-mismatch`                          | Una ruta definida se resuelve a un agente diferente.                              |
| `policy/routing-match-kind-mismatch`                     | Una ruta definida coincide con una especificidad de vinculación inesperada.       |
| `policy/ingress-dm-policy-unapproved`                    | Una política de mensajes directos de canal está fuera de la lista de permitidos de la política. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` no coincide con el ámbito de aislamiento de mensajes directos exigido por la política. |
| `policy/ingress-open-groups-denied`                      | Una política de grupos de canal es `open` mientras que la política deniega la entrada abierta de grupos. |
| `policy/ingress-group-mention-required`                  | Una entrada de canal o grupo deshabilita los controles de menciones cuando la política los exige. |
| `policy/gateway-non-loopback-bind`                       | La postura de vinculación del Gateway permite la exposición fuera de la interfaz de bucle invertido cuando la política la deniega. |
| `policy/gateway-auth-disabled`                           | La autenticación del Gateway está deshabilitada cuando la política la exige.      |
| `policy/gateway-rate-limit-missing`                      | La postura de limitación de frecuencia de autenticación del Gateway no es explícita cuando la política lo exige. |
| `policy/gateway-control-ui-insecure`                     | Los controles de exposición insegura de la interfaz de control del Gateway están habilitados. |
| `policy/gateway-tailscale-funnel`                        | La exposición mediante Tailscale Funnel del Gateway está habilitada cuando la política la deniega. |
| `policy/gateway-remote-enabled`                          | El modo remoto del Gateway está activo cuando la política lo deniega.             |
| `policy/gateway-http-endpoint-enabled`                   | Un punto de conexión de la API HTTP del Gateway está habilitado aunque la política lo deniega. |
| `policy/gateway-http-url-fetch-unrestricted`             | La entrada de obtención de URL por HTTP del Gateway carece de una lista de URL permitidas requerida. |
| `policy/gateway-node-command-denied`                     | Un comando de Node denegado por la política no está denegado por la configuración de OpenClaw. |
| `policy/agents-workspace-access-denied`                  | El modo de entorno aislado del agente o el acceso al espacio de trabajo están fuera de la lista de permitidos de la política. |
| `policy/agents-tool-not-denied`                          | La configuración de un agente o la predeterminada no deniega una herramienta que la política exige denegar. |
| `policy/tools-profile-unapproved`                        | Un perfil de herramientas global o por agente configurado está fuera de la lista de permitidos. |
| `policy/tools-fs-workspace-only-required`                | Las herramientas del sistema de archivos no están configuradas con una postura de rutas limitada al espacio de trabajo. |
| `policy/tools-exec-security-unapproved`                  | El modo de seguridad de ejecución está fuera de la lista de permitidos de la política. |
| `policy/tools-exec-ask-unapproved`                       | El modo de consulta de ejecución está fuera de la lista de permitidos de la política. |
| `policy/tools-exec-host-unapproved`                      | El enrutamiento del host de ejecución está fuera de la lista de permitidos de la política. |
| `policy/tools-elevated-enabled`                          | El modo de herramientas con privilegios elevados está habilitado cuando la política lo deniega. |
| `policy/tools-also-allow-missing`                        | A una lista `alsoAllow` configurada le falta una entrada requerida por la política. |
| `policy/tools-also-allow-unexpected`                     | Una lista `alsoAllow` configurada incluye una entrada no prevista por la política. |
| `policy/tools-required-deny-missing`                     | Una lista global o por agente de herramientas denegadas no incluye una herramienta cuya denegación es obligatoria. |
| `policy/sandbox-mode-unapproved`                         | El modo de entorno aislado está fuera de la lista de permitidos de la política.    |
| `policy/sandbox-backend-unapproved`                      | El backend del entorno aislado está fuera de la lista de permitidos de la política. |
| `policy/sandbox-container-posture-unobservable`          | Una regla de postura del contenedor está habilitada para un backend que no puede observarla. |
| `policy/sandbox-container-host-network-denied`           | Un entorno aislado o navegador basado en contenedores usa el modo de red del host. |
| `policy/sandbox-container-namespace-join-denied`         | Un entorno aislado o navegador basado en contenedores se une al espacio de nombres de otro contenedor. |
| `policy/sandbox-container-mount-mode-required`           | Un montaje de un entorno aislado o navegador basado en contenedores no es de solo lectura. |
| `policy/sandbox-container-runtime-socket-mount`          | Un montaje de un entorno aislado o navegador basado en contenedores expone el socket del entorno de ejecución de contenedores. |
| `policy/sandbox-container-unconfined-profile`            | El perfil del entorno aislado de contenedores no tiene restricciones cuando la política lo deniega. |
| `policy/sandbox-browser-cdp-source-range-missing`        | Falta el intervalo de origen de CDP del navegador del entorno aislado cuando la política lo exige. |
| `policy/data-handling-redaction-disabled`                | La ocultación de datos sensibles en los registros está deshabilitada cuando la política la exige. |
| `policy/data-handling-telemetry-content-capture`         | La captura de contenido de telemetría está habilitada cuando la política la deniega. |
| `policy/data-handling-session-retention-not-enforced`    | El mantenimiento de la retención de sesiones no se aplica cuando la política lo exige. |
| `policy/data-handling-session-transcript-memory-enabled` | La indexación en memoria de las transcripciones de sesiones está habilitada cuando la política la deniega. |
| `policy/secrets-unmanaged-provider`                      | Un SecretRef de configuración hace referencia a un proveedor no declarado en `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un proveedor de secretos de configuración o SecretRef usa una fuente denegada por la política. |
| `policy/secrets-insecure-provider`                       | Un proveedor de secretos adopta una postura insegura cuando la política la deniega. |
| `policy/auth-profile-invalid-metadata`                   | A un perfil de autenticación de configuración le faltan metadatos válidos de proveedor o modo. |
| `policy/auth-profile-unapproved-mode`                    | El modo de un perfil de autenticación de configuración está fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-missing`                          | La política requiere `exec-approvals.json`, pero falta el artefacto.              |
| `policy/exec-approvals-invalid`                          | No se puede analizar el artefacto configurado de aprobaciones de ejecución.       |
| `policy/exec-approvals-default-security-unapproved`      | Los valores predeterminados de aprobación de ejecución usan un modo de seguridad fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-agent-security-unapproved`        | Un modo de seguridad efectivo de aprobación de ejecución por agente está fuera de la lista de permitidos. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agente de aprobación de ejecución permite automáticamente de forma implícita las CLI de Skills cuando la política lo deniega. |
| `policy/exec-approvals-allowlist-missing`                | A la lista de permitidos de aprobaciones le falta un patrón requerido por la política. |
| `policy/exec-approvals-allowlist-unexpected`             | La lista de permitidos de aprobaciones incluye un patrón no previsto por la política. |
| `policy/tools-missing-risk-level`                        | A una declaración de herramienta gobernada le faltan metadatos de riesgo.         |
| `policy/tools-unknown-risk-level`                        | Una declaración de herramienta gobernada usa un valor de riesgo desconocido.      |
| `policy/tools-missing-sensitivity-token`                 | A una declaración de herramienta gobernada le faltan metadatos de sensibilidad.   |
| `policy/tools-missing-owner`                             | A una declaración de herramienta gobernada le faltan metadatos de propietario.    |
| `policy/tools-unknown-sensitivity-token`                 | Una declaración de herramienta gobernada usa un valor de sensibilidad desconocido. |

Un hallazgo puede incluir tanto `target` (el elemento observado del espacio de trabajo que
no cumple) como `requirement` (la regla definida que hizo que se considerara un hallazgo).
Actualmente, ambos son cadenas de direcciones `oc://`, pero los nombres de los campos describen la función en la política,
no el formato de la dirección.

Ejemplos de hallazgos:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "El canal 'telegram' usa el proveedor denegado 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram no está aprobado para este espacio de trabajo."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "La herramienta 'deploy' de TOOLS.md no tiene una clasificación de riesgo explícita.",
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
  "message": "El servidor MCP 'remote' no está en la lista de permitidos de la política.",
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
  "message": "La referencia de modelo 'anthropic/claude-sonnet-4.7' usa el proveedor no aprobado 'anthropic'.",
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
  "message": "La configuración de red 'browser-private-network' permite el acceso a redes privadas.",
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
  "message": "La configuración de enlace del Gateway 'gateway-bind' permite la exposición fuera de la interfaz de bucle invertido.",
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
  "message": "El comando de Node del Gateway 'system.run' está denegado por la política, pero no por la configuración de OpenClaw.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/commands/deny",
  "target": "oc://openclaw.config/gateway/nodes/commands/deny",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Añada 'system.run' a gateway.nodes.commands.deny o actualice la política después de revisarla."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "La política no permite el valor 'rw' de workspaceAccess del entorno aislado de agents.defaults.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparación

`doctor --lint` y `policy check` son de solo lectura.

`doctor --fix` solo edita la configuración del espacio de trabajo gestionada por políticas cuando
`workspaceRepairs` está habilitado explícitamente; de lo contrario, las comprobaciones indican lo que
repararían y dejan la configuración sin cambios.

En esta versión, la reparación puede deshabilitar los canales denegados por `channels.denyRules` y
aplicar las reparaciones de restricción automática que se indican a continuación. Habilite `workspaceRepairs`
solo después de revisar el archivo de políticas, porque una regla válida puede cambiar
la configuración del espacio de trabajo:

- establecer `tools.elevated.enabled=false` cuando una política global prohíba las herramientas con privilegios elevados
- añadir los identificadores de herramientas de denegación obligatoria que falten a `tools.deny` o
  `agents.entries.*.tools.deny` cuando la política exija denegar esas herramientas
- establecer en `false` las opciones inseguras de `gateway.controlUi.*`
- establecer `gateway.mode=local` cuando la política deniegue el modo de Gateway remoto
- establecer en `false` las rutas de `gateway.http.endpoints.*.enabled` notificadas cuando la política
  deniegue los endpoints de la API HTTP del Gateway
- establecer en `allowlist` las rutas de `groupPolicy` de entrada de canales notificadas cuando la política
  deniegue la entrada de grupos abiertos
- establecer en `true` las rutas de `requireMention` de entrada de canales notificadas cuando la política
  exija menciones en los grupos
- establecer `logging.redactSensitive=tools` cuando la política exija la ocultación
  de datos confidenciales en los registros
- establecer `diagnostics.otel.captureContent=false`, o
  `diagnostics.otel.captureContent.enabled=false` para la configuración de captura de telemetría
  en forma de objeto, cuando la política deniegue la captura de contenido de telemetría

Las reparaciones de herramientas con privilegios elevados y ámbito específico son solo de detección. Las reparaciones de tratamiento de datos con ámbito específico
también se omiten cuando el hallazgo informa de una configuración compartida de registro o telemetría,
porque cambiar la configuración compartida afectaría a elementos ajenos al objetivo de la política
con ámbito específico.

Las reparaciones de denegación obligatoria con ámbito específico se omiten cuando el hallazgo informa del valor raíz heredado
`tools.deny`, porque añadir la herramienta obligatoria a la configuración raíz afectaría
a elementos ajenos al objetivo de la política con ámbito específico. Las reparaciones de denegación obligatoria locales del agente pueden actualizar
la ruta de `agents.entries.*.tools.deny` indicada.

Las reparaciones de entrada de canales con ámbito específico se omiten cuando el hallazgo informa del valor heredado
`channels.defaults.*`, porque cambiar el valor predeterminado compartido del canal afectaría
a elementos ajenos al objetivo de la política con ámbito específico. Los hallazgos de la lista de permitidos para la obtención de URL mediante HTTP del Gateway
siguen requiriendo intervención manual porque la reparación automática no puede elegir los valores correctos
de la lista de URL permitidas para el endpoint.

Los hallazgos de enlace y comandos de Node del Gateway siguen requiriendo revisión. Cuando
`policy/gateway-non-loopback-bind` o `policy/gateway-node-command-denied`
pueden asignarse a una ruta de configuración, `doctor --fix` indica el cambio propuesto de
`gateway.bind` o `gateway.nodes.commands.deny` como orientación
de vista previa omitida. No aplica el cambio y el hallazgo no se considera
reparado hasta que un operador revise y actualice la configuración o la política.

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

| Comando          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | No hay hallazgos en el umbral.                          | Uno o más hallazgos alcanzaron el umbral.                             | Error de argumentos o de ejecución. |
| `policy compare` | El archivo de políticas es al menos tan estricto como la referencia. | El archivo de políticas no es válido, falta o es menos estricto que las reglas de referencia. | Error de argumentos o de ejecución. |
| `policy watch`   | No hay hallazgos y el hash aceptado está actualizado.              | Existen hallazgos o la declaración aceptada está obsoleta.                    | Error de argumentos o de ejecución. |

## Temas relacionados

- [Modo de lint de Doctor](/es/cli/doctor#lint-mode)
- [CLI de rutas](/es/cli/path)
