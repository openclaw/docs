---
read_when:
    - Quieres comprobar la configuración de OpenClaw con un policy.jsonc creado.
    - Quieres hallazgos de política en el lint de doctor
    - Necesitas un hash de certificación de política para evidencia de auditoría
summary: Referencia de la CLI para comprobaciones de conformidad de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-07-05T01:54:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25dbf0d9d1ed2f1f61a92300279d5fce3f9dc528479701d3b3de739f04685e9c
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` lo proporciona el Plugin Policy incluido. Policy es una
capa de conformidad empresarial sobre la configuración existente de OpenClaw. No añade un
segundo sistema de configuración. `policy.jsonc` define requisitos redactados,
OpenClaw observa el espacio de trabajo activo como evidencia, y las comprobaciones de estado de la política
informan desviaciones mediante `doctor --lint`. La señal final de conformidad es una ejecución limpia de
`doctor --lint`; la política aporta hallazgos a esa superficie de lint compartida
en lugar de crear una puerta de estado separada.

Actualmente, Policy gestiona canales configurados, servidores MCP, proveedores de modelos,
postura SSRF de red, postura de acceso de ingress/canal, exposición del Gateway y postura de comandos de nodo, postura del espacio de trabajo del agente,
postura de gestión de datos, postura de proveedor de secretos/perfil de autenticación de la configuración de OpenClaw, y declaraciones de herramientas gobernadas. Por ejemplo, TI o un operador de espacio de trabajo puede registrar que Telegram
no es un proveedor de canal aprobado, restringir servidores MCP y referencias de modelos a
entradas aprobadas, exigir que el acceso fetch/browser a redes privadas permanezca
deshabilitado, exigir que el aislamiento de sesiones de mensajes directos y la postura de ingress de canal
permanezcan dentro de límites revisados, exigir que la vinculación/autenticación/exposición HTTP del Gateway y los comandos de nodo privilegiados permanezcan dentro de límites revisados, exigir que el acceso al espacio de trabajo del agente y las denegaciones de herramientas permanezcan en una
postura revisada, exigir que las SecretRefs de configuración de OpenClaw usen proveedores gestionados, exigir que
los perfiles de autenticación de configuración incluyan metadatos de proveedor/modo, exigir que las herramientas gobernadas
incluyan metadatos de riesgo y sensibilidad, exigir la redacción de registros sensibles, denegar
la captura de contenido de telemetría, exigir mantenimiento de retención de sesiones, denegar la indexación en memoria de transcripciones de sesión, y luego usar `doctor --lint` como la puerta de
conformidad compartida.

Usa la política cuando un espacio de trabajo necesite una declaración durable como "estos canales
no deben estar habilitados" o "las herramientas gobernadas deben declarar metadatos de aprobación" y una
forma repetible de demostrar que OpenClaw sigue cumpliendo esa declaración. Usa
solo la configuración regular y la documentación del espacio de trabajo cuando solo necesites comportamiento local y
no necesites hallazgos de política ni salida de atestación.

## Inicio rápido

Habilita el Plugin Policy incluido antes del primer uso:

```bash
openclaw plugins enable policy
```

Cuando la política está habilitada, doctor puede cargar comprobaciones de estado de política sin activar
plugins arbitrarios. El Plugin permanece habilitado si falta `policy.jsonc`, para que
doctor pueda informar el artefacto faltante.

La política se redacta, no se genera a partir de la configuración actual del usuario. Una política mínima
para canales, servidores MCP, proveedores de modelos, postura de red, acceso ingress/canal, exposición del Gateway,
postura del espacio de trabajo del agente, postura del runtime de sandbox configurado, postura de
gestión de datos de OpenClaw, postura de proveedor de secretos/perfil de autenticación de configuración, postura de archivo de aprobaciones de exec, y metadatos de herramientas se ve así:

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

Las reglas son la autoridad. Un bloque de categoría es solo un espacio de nombres; las comprobaciones se ejecutan
cuando hay una regla concreta presente. OpenClaw lee la configuración actual de `channels.*`,
`mcp.servers.*`, `models.providers.*`, referencias de modelo de agentes seleccionadas, configuración SSRF de red,
alcance de sesión de mensajes directos, política de MD de canal, política de grupos de canal,
puertas de mención de canal/grupo, postura de vinculación/autenticación/interfaz de control/Tailscale/remoto/HTTP del Gateway,
postura de comandos de nodo del Gateway, acceso al espacio de trabajo de sandbox de agente de configuración de OpenClaw y postura de denegación de herramientas,
postura de configuración de gestión de datos, proveedor de secretos de configuración
y procedencia de SecretRef, metadatos de perfil de autenticación de configuración, postura de herramientas global/por agente configurada, y declaraciones de `TOOLS.md` como evidencia, y luego
informa el estado observado que no cumple. Si una política deniega vinculaciones no local loopback del Gateway, omite `gateway.bind` solo cuando
estés dispuesto a revisar el valor predeterminado del runtime; establece `gateway.bind=loopback` para
conformidad estricta de configuración. Para una postura de agente de solo lectura, configura el modo sandbox
en los valores predeterminados o el agente aplicables y establece `workspaceAccess` en `none` o
`ro`; el modo sandbox omitido o `off` no satisface una política de solo lectura/sin escritura.
`agents.workspace.denyTools` admite `exec`, `process`, `write`,
`edit` y `apply_patch`; la configuración de OpenClaw `group:fs` cubre herramientas de mutación de archivos
y `group:runtime` cubre herramientas de shell/proceso. La política de postura de herramientas observa
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled`, y las mismas anulaciones por agente
`agents.list[].tools.*`. La política de aprobaciones de exec lee el artefacto de producto
`exec-approvals.json` nombrado solo cuando hay una regla `execApprovals`
presente; la evidencia registra valores predeterminados, postura por agente y patrones de allowlist
sin tokens de socket ni texto del último comando usado. La política no aplica llamadas de herramientas
en runtime. La evidencia de secretos registra
postura de proveedor/origen y metadatos de SecretRef, nunca valores de secretos sin procesar. La política
no lee ni atestigua almacenes de credenciales por agente como `auth-profiles.json`;
esos almacenes siguen perteneciendo a los flujos existentes de autenticación y credenciales.
La evidencia de gestión de datos es solo postura a nivel de configuración: comprueba el
modo de redacción configurado, conmutadores de captura de contenido de telemetría, modo de mantenimiento de sesiones y
configuración de indexación en memoria de transcripciones de sesión. No inspecciona registros sin procesar,
exportaciones de telemetría, contenidos de transcripciones, archivos de memoria, ni demuestra que no existan
datos personales o secretos.

### Referencia de reglas de política

Cada campo de política siguiente es opcional. Una comprobación se ejecuta solo cuando la regla correspondiente está
presente en `policy.jsonc`. El estado observado es la configuración existente de OpenClaw o
metadatos del espacio de trabajo; la política informa desviaciones, pero no reescribe el comportamiento del runtime
a menos que una ruta de reparación esté explícitamente disponible y habilitada.
Los archivos de política son estrictos: las secciones o claves de regla no admitidas se informan como
`policy/policy-jsonc-invalid` en lugar de ignorarse.

Las superposiciones de política mantienen globales las reglas generales de nivel superior, y luego permiten que bloques de alcance con nombre
añadan secciones normales de política más estrictas para selectores explícitos. Un nombre de alcance es
solo un contenedor descriptivo; la coincidencia usa los valores de selector dentro del alcance.
La superposición es aditiva: las afirmaciones globales siguen ejecutándose, y una afirmación con alcance puede emitir
su propio hallazgo contra la misma configuración observada.

#### Superposiciones con alcance

Usa `scopes.<scopeName>` cuando un conjunto de agentes o canales necesite una
política más estricta que la línea base de nivel superior. Las secciones con alcance de agente usan `agentIds`, que
admite `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`,
y `execApprovals.*`. El ingress con alcance de canal usa `channelIds`, que admite `ingress.channels.*`. Las secciones no admitidas
se rechazan en lugar de ignorarse. Si una entrada `agentIds` no está
presente en `agents.list[]`, OpenClaw evalúa la regla con alcance contra la postura global/predeterminada heredada para ese id de agente de runtime.

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

El mismo agente puede aparecer en varios alcances cuando cada alcance gobierna campos
distintos, como se muestra arriba. Un campo con alcance repetido para el mismo agente debe ser
igual o más restrictivo según los metadatos de política; las afirmaciones duplicadas más débiles
se rechazan. Los metadatos de restricción tratan las listas de permitidos como subconjuntos,
las listas de denegación como superconjuntos, y los booleanos obligatorios como requisitos fijos.

La política de postura de contenedor se evalúa solo contra evidencia que OpenClaw puede
observar para el agente coincidente. Si una regla `sandbox.containers.*` habilitada se aplica
a un agente cuyo backend de sandbox no puede exponer ese campo, la política informa
`policy/sandbox-container-posture-unobservable` en lugar de tratar la afirmación como
aprobada. Usa alcances `agentIds` separados para grupos de agentes que usan distintos
backends de sandbox, y deja las reglas de contenedor no admitidas sin definir o en false para los
grupos donde esos campos no pueden observarse.

`ingress.session.requireDmScope` de nivel superior sigue siendo global porque
`session.dmScope` no es evidencia atribuible a un canal.

| Selector     | Secciones compatibles                                                             | Usar cuando                                                    |
| ------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | Uno o más agentes en tiempo de ejecución necesitan reglas más estrictas. |
| `channelIds` | `ingress.channels`                                                                 | Uno o más canales necesitan reglas de ingreso más estrictas.   |

Todo ámbito presente en `policy.jsonc` debe ser válido y aplicable.

#### Canales

| Campo de política                   | Estado observado                       | Usar cuando                                                  |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | proveedor `channels.*` y estado habilitado | Denegar canales configurados de un proveedor como `telegram`. |
| `channels.denyRules[].reason`        | Mensaje del hallazgo y contexto de sugerencia de reparación | Explicar por qué se deniega el proveedor.                    |

#### Servidores MCP

| Campo de política  | Estado observado    | Usar cuando                                                   |
| ------------------ | ------------------- | ------------------------------------------------------------- |
| `mcp.servers.allow` | ids de `mcp.servers.*` | Exigir que cada servidor MCP configurado esté en una lista de permitidos. |
| `mcp.servers.deny`  | ids de `mcp.servers.*` | Denegar ids específicos de servidores MCP configurados.       |

#### Proveedores de modelos

| Campo de política       | Estado observado                                      | Usar cuando                                                                        |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `models.providers.allow` | ids de `models.providers.*` y referencias de modelos seleccionadas | Exigir que los proveedores configurados y las referencias de modelos seleccionadas usen proveedores aprobados. |
| `models.providers.deny`  | ids de `models.providers.*` y referencias de modelos seleccionadas | Denegar proveedores configurados y referencias de modelos seleccionadas por id de proveedor. |

#### Red

| Campo de política             | Estado observado                         | Usar cuando                                                       |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `network.privateNetwork.allow` | Vías de escape SSRF de red privada       | Establecer en `false` para exigir que el acceso a la red privada permanezca deshabilitado. |

#### Ingreso y acceso a canales

| Campo de política                         | Estado observado                                               | Usar cuando                                                       |
| ----------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Exigir un ámbito de aislamiento de mensajes directos revisado.    |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` y campos heredados de política de DM del canal | Permitir solo políticas de canal de mensajes directos revisadas. |
| `ingress.channels.denyOpenGroups`         | Política de ingreso de canal, cuenta y grupo                   | Denegar el ingreso de grupos abiertos para canales y cuentas configurados. |
| `ingress.channels.requireMentionInGroups` | Configuración de puerta de menciones de canal, cuenta, grupo, guild y anidada | Exigir puertas de mención cuando el ingreso de grupo esté abierto o gated por menciones. |

#### Gateway

| Campo de política                      | Estado observado                                  | Usar cuando                                                                             |
| -------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                    | Establecer en `false` para exigir enlace de Gateway a loopback.                         |
| `gateway.exposure.allowTailscaleFunnel` | Postura de serve/funnel de Tailscale para Gateway | Establecer en `false` para denegar exposición mediante Tailscale Funnel.                |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                               | Establecer en `true` para rechazar auth deshabilitada de Gateway.                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                          | Establecer en `true` para exigir configuración explícita de límite de tasa de auth.     |
| `gateway.controlUi.allowInsecure`       | Alternancias inseguras de auth/dispositivo/origen de la interfaz de control | Establecer en `false` para denegar alternancias inseguras de exposición de la interfaz de control. |
| `gateway.remote.allow`                  | Modo/configuración remotos de Gateway             | Establecer en `false` para denegar el modo remoto de Gateway.                           |
| `gateway.http.denyEndpoints`            | Endpoints de la API HTTP de Gateway               | Denegar ids de endpoints como `chatCompletions` o `responses`.                          |
| `gateway.http.requireUrlAllowlists`     | Entradas de obtención de URL HTTP de Gateway      | Establecer en `true` para exigir listas de URL permitidas en entradas de obtención de URL. |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                      | Exigir que ids exactos de comandos de nodo, como `system.run`, se denieguen en la configuración de OpenClaw. |

`gateway.nodes.denyCommands` es una regla exacta, sensible a mayúsculas y minúsculas, de superconjunto de denegación.
Úsala cuando la política deba demostrar que los comandos de nodo privilegiados están explícitamente
denegados por la configuración de OpenClaw. Un despliegue que permita intencionalmente un comando de nodo
privilegiado debe actualizar `policy.jsonc` después de la revisión, en lugar de depender solo de
`gateway.nodes.allowCommands`.

#### Espacio de trabajo del agente

| Campo de política               | Estado observado                                                                    | Usar cuando                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` y `agents.list[].sandbox.workspaceAccess` | Permitir solo valores de acceso al espacio de trabajo del sandbox como `none` o `ro`.                                  |
| `agents.workspace.denyTools`     | Configuración global y por agente de denegación de herramientas                     | Exigir que las herramientas de mutación de espacio de trabajo/tiempo de ejecución, como `exec`, `process`, `write`, `edit` o `apply_patch`, estén denegadas. |

#### Postura de sandbox

| Campo de política                                   | Estado observado                                       | Usar cuando                                                   |
| --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `sandbox.requireMode`                               | `agents.defaults.sandbox.mode` y modo por agente       | Permitir solo modos de sandbox revisados como `all` o `non-main`. |
| `sandbox.allowBackends`                             | `agents.defaults.sandbox.backend` y backend por agente | Permitir solo backends de sandbox revisados como `docker`.    |
| `sandbox.containers.denyHostNetwork`                | Modo de red de sandbox/navegador respaldado por contenedor | Denegar el modo de red del host.                              |
| `sandbox.containers.denyContainerNamespaceJoin`     | Modo de red de sandbox/navegador respaldado por contenedor | Denegar unirse al espacio de nombres de red de otro contenedor. |
| `sandbox.containers.requireReadOnlyMounts`          | Modo de montaje de sandbox/navegador respaldado por contenedor | Exigir que los montajes sean de solo lectura.                  |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montaje de sandbox/navegador respaldado por contenedor | Denegar montajes de sockets del runtime de contenedores.      |
| `sandbox.containers.denyUnconfinedProfiles`         | Postura de perfil de seguridad del contenedor          | Denegar perfiles de seguridad de contenedor sin confinamiento. |
| `sandbox.browser.requireCdpSourceRange`             | Rango de origen CDP del navegador de sandbox           | Exigir que la exposición CDP del navegador declare un rango de origen. |

La política trata la ausencia de `sandbox.mode` como el valor predeterminado implícito `off`, por lo que
`sandbox.requireMode` informa que un sandbox nuevo o sin configurar está fuera de una
lista de permitidos como `["all"]`.

#### Manejo de datos

| Campo de política                                  | Estado observado                                                                    | Usar cuando                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`   | `logging.redactSensitive`                                                           | Establecer en `true` para rechazar `logging.redactSensitive: "off"`. |
| `dataHandling.telemetry.denyContentCapture`        | `diagnostics.otel.captureContent`                                                   | Establecer en `true` para rechazar la captura de contenido de telemetría. |
| `dataHandling.retention.requireSessionMaintenance` | `session.maintenance.mode`                                                          | Establecer en `true` para exigir el modo efectivo de mantenimiento de sesión `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` y `agents.*.memorySearch.experimental.sessionMemory` | Establecer en `true` para rechazar la indexación de transcripciones de sesión en memoria. |

#### Secretos

| Campo de política              | Estado observado                                      | Usar cuando                                                            |
| ------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs de configuración y declaraciones `secrets.providers.*` | Establecer en `true` para exigir que los SecretRefs apunten a proveedores declarados. |
| `secrets.denySources`            | Fuentes de proveedores de secretos y fuentes de SecretRef | Denegar fuentes como `exec`, `file` u otro nombre de fuente configurada. |
| `secrets.allowInsecureProviders` | Indicadores de postura insegura de proveedores de secretos | Establecer en `false` para rechazar proveedores que opten por una postura insegura. |

#### Aprobaciones de ejecución

La política de aprobaciones de exec observa el artefacto de runtime activo `exec-approvals.json`.
De forma predeterminada, es `~/.openclaw/exec-approvals.json`; cuando
`OPENCLAW_STATE_DIR` está definido, Policy lee
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Las reglas de postura reales, como
`execApprovals.defaults.*` o `execApprovals.agents.*`, requieren evidencia de
artefacto legible; un artefacto ausente o no válido se informa como evidencia no
observable en lugar de convertirse en una aprobación de mejor esfuerzo contra
valores predeterminados sintéticos del runtime. Una vez que el artefacto es
legible, los campos de aprobación omitidos heredan los valores predeterminados
del runtime: `defaults.security` ausente es `full`, y la seguridad de agente
ausente hereda ese valor predeterminado. La evidencia incluye `defaults`,
`agents.*` y `agents.*.allowlist[].pattern`, además de `argPattern` opcional,
la postura efectiva de `autoAllowSkills` y el origen de la entrada. No incluye
ruta/token de socket, `commandText`, `lastUsedCommand`, rutas resueltas ni marcas
de tiempo.

| Campo de política                         | Estado observado                                                                       | Usar cuando                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`               | Ruta activa de `exec-approvals.json` del runtime                                       | Definir como `true` para exigir que el artefacto de aprobaciones exista y se analice.   |
| `execApprovals.defaults.allowSecurity`    | `defaults.security`, con valor predeterminado `full`                                   | Permitir solo modos de seguridad de aprobación predeterminados aprobados.               |
| `execApprovals.agents.allowSecurity`      | `agents.*.security`, que hereda los valores predeterminados                            | Permitir solo modos de seguridad de aprobación efectivos por agente aprobados.          |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` y `agents.*.autoAllowSkills`, que heredan valores predeterminados del runtime | Definir como `false` para exigir allowlists manuales estrictas sin aprobación implícita de CLI de Skills. |
| `execApprovals.agents.allowlist.expected` | Entradas agregadas de patrón y `argPattern` opcional de `agents.*.allowlist[]`         | Exigir que la allowlist de aprobaciones coincida con el conjunto de patrones revisado.  |

Por ejemplo, exigir el artefacto de aprobaciones, denegar valores predeterminados
permisivos y permitir solo la postura revisada de aprobación de exec para agentes
seleccionados:

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

| Campo de política              | Estado observado                            | Usar cuando                                                                                |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Metadatos de proveedor y modo de `auth.profiles.*` | Exigir claves de metadatos como `provider` y `mode` en perfiles de autenticación de configuración. |
| `auth.profiles.allowModes`     | `auth.profiles.*.mode`                      | Permitir solo modos de perfil de autenticación admitidos, como `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadatos de herramientas

| Campo de política       | Estado observado                 | Usar cuando                                                                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Declaraciones gobernadas de `TOOLS.md` | Exigir que las herramientas gobernadas declaren claves de metadatos como `risk`, `sensitivity` u `owner`. |

#### Postura de herramientas

| Campo de política              | Estado observado                                            | Usar cuando                                                                                              |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`         | `tools.profile` y `agents.list[].tools.profile`             | Permitir solo ids de perfil de herramientas como `minimal`, `messaging` o `coding`.                      |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` y anulaciones por agente de `tools.fs` | Definir como `true` para exigir postura de herramienta de sistema de archivos limitada al workspace.     |
| `tools.exec.allowSecurity`     | `tools.exec.security` y seguridad de exec por agente        | Permitir solo modos de seguridad de exec como `deny` o `allowlist`.                                      |
| `tools.exec.requireAsk`        | `tools.exec.ask` y modo de solicitud de exec por agente     | Exigir postura de aprobación como `always`.                                                              |
| `tools.exec.allowHosts`        | `tools.exec.host` y enrutamiento de host de exec por agente | Permitir solo modos de enrutamiento de host de exec como `sandbox`.                                      |
| `tools.elevated.allow`         | `tools.elevated.enabled` y postura elevada por agente       | Definir como `false` para exigir que el modo de herramienta elevada permanezca deshabilitado.            |
| `tools.alsoAllow.expected`     | `tools.alsoAllow` y `tools.alsoAllow` por agente            | Exigir entradas exactas de `alsoAllow` e informar concesiones de herramientas aditivas ausentes o inesperadas. |
| `tools.denyTools`              | `tools.deny` y `agents.list[].tools.deny`                   | Exigir que las listas configuradas de denegación de herramientas incluyan ids o grupos de herramientas como `group:runtime` y `group:fs`. |

Ejecuta comprobaciones solo de política durante la autoría:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` ejecuta solo el conjunto de comprobaciones de política y emite
evidencia, hallazgos y hashes de atestación. Los mismos hallazgos también
aparecen en `openclaw doctor --lint` cuando el Plugin Policy está habilitado.

Compara un archivo de política de operador con un archivo de política base
autorado:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` compara sintaxis de archivo de política con sintaxis de archivo
de política. No inspecciona el estado del runtime de OpenClaw, evidencia,
credenciales ni secretos. El comando usa los mismos metadatos de reglas de
política que gobiernan las superposiciones con alcance: las allowlists deben
permanecer iguales o más estrechas, las denylists deben permanecer iguales o más
amplias, los booleanos requeridos deben conservar su valor requerido, las
cadenas ordenadas deben moverse solo hacia el extremo más restrictivo del orden
configurado y las listas exactas deben coincidir.

El archivo base puede ser una política autorada por una organización. La política
comprobada puede usar valores más estrictos o agregar reglas de política
adicionales. Una regla comprobada de nivel superior también puede satisfacer una
regla base con alcance cuando es igualmente o más restrictiva, porque la política
de nivel superior se aplica ampliamente. Los nombres de alcance no necesitan
coincidir; la comparación con alcance se indexa por valor de selector, como
`agentIds` o `channelIds`, y por el campo de política que se comprueba.

Ejemplo de salida JSON de comparación limpia que informa solo estado de
comparación de archivos de política:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Ejemplo de salida limpia de `policy check --json` que incluye hashes estables que
puede registrar un operador o supervisor:

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

La configuración de Policy vive en `plugins.entries.policy.config`.

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

| Ajuste                    | Propósito                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| `enabled`                 | Habilitar comprobaciones de política incluso antes de que exista `policy.jsonc`. |
| `workspaceRepairs`        | Permitir que `doctor --fix` edite ajustes del workspace gestionados por política. |
| `expectedHash`            | Bloqueo de hash opcional para el artefacto de política aprobado. |
| `expectedAttestationHash` | Bloqueo de hash opcional para la última comprobación limpia de política aceptada. |
| `path`                    | Ubicación relativa al workspace del artefacto de política.       |

Define `plugins.entries.policy.config.enabled` como `false` para deshabilitar las
comprobaciones de política para un workspace mientras el Plugin permanece
instalado.

Los requisitos de metadatos de herramientas se autoran en `policy.jsonc` con
`tools.requireMetadata`, por ejemplo `["risk", "sensitivity", "owner"]`.

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

El hash de la política identifica el artefacto de reglas creado. El bloque de evidencia
registra el estado observado de OpenClaw usado por las comprobaciones de política. El
valor `workspace.hash` identifica esa carga útil de evidencia para el alcance comprobado.
El hash de hallazgos identifica el conjunto exacto de hallazgos devuelto por la comprobación.
`checkedAt` registra cuándo se ejecutó la evaluación. El hash de certificación identifica
la declaración estable: hash de política, hash de evidencia, hash de hallazgos y si el
resultado estaba limpio. Intencionalmente no incluye `checkedAt`, por lo que el mismo
estado de política produce la misma certificación en comprobaciones repetidas. En conjunto,
forman la tupla de auditoría para esta comprobación de política.

Si un Gateway o supervisor posterior usa la política para bloquear, aprobar o anotar una
acción de tiempo de ejecución, debe registrar el hash de certificación de la última
comprobación de política limpia. `checkedAt` permanece en la salida JSON para los registros
de auditoría, pero no forma parte del hash de certificación estable.

Usa este ciclo de vida al aceptar el estado de la política:

1. Crea o revisa `policy.jsonc`.
2. Ejecuta `openclaw policy check --json`.
3. Si el resultado está limpio, registra `attestation.policy.hash` como `expectedHash`.
4. Registra `attestation.attestationHash` como `expectedAttestationHash`.
5. Vuelve a ejecutar `openclaw doctor --lint` en CI o en las puertas de publicación.

Si las reglas de política cambian intencionalmente, actualiza ambos hashes aceptados a partir de una
comprobación limpia. Si la configuración del workspace cambia intencionalmente pero la política sigue igual,
normalmente solo cambia `expectedAttestationHash`.

Habilitar o actualizar las reglas de `agents.workspace` agrega evidencia de `agentWorkspace` al
hash del workspace y al hash de certificación. Los operadores deben revisar la nueva
evidencia y actualizar los hashes de certificación aceptados después de habilitar estas reglas.
Habilitar o actualizar reglas de postura de herramientas agrega evidencia de `toolPosture` de la
misma forma.

`openclaw policy watch` ejecuta la misma comprobación repetidamente e informa cuando la
evidencia actual ya no coincide con `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Usa `--once` en CI o en scripts que solo necesitan una evaluación de desviación. Sin
`--once`, el comando consulta cada dos segundos de forma predeterminada; usa `--interval-ms` para
elegir un intervalo distinto.

## Hallazgos

Actualmente, la política verifica:

| Id. de comprobación                                      | Hallazgo                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La política está habilitada, pero falta `policy.jsonc`.                          |
| `policy/policy-jsonc-invalid`                            | La política no se puede analizar o contiene entradas de reglas mal formadas.     |
| `policy/policy-hash-mismatch`                            | La política no coincide con el `expectedHash` configurado.                       |
| `policy/attestation-hash-mismatch`                       | La evidencia actual de la política ya no coincide con la atestación aceptada.    |
| `policy/policy-conformance-invalid`                      | Un archivo de política base o comprobado tiene sintaxis de comparación no válida. |
| `policy/policy-conformance-missing`                      | A un archivo de política comprobado le falta una regla requerida por el archivo de política base. |
| `policy/policy-conformance-weaker`                       | Un archivo de política comprobado tiene un valor más débil que el archivo de política base. |
| `policy/channels-denied-provider`                        | Un canal habilitado coincide con una regla de denegación de canal.               |
| `policy/mcp-denied-server`                               | Un servidor MCP configurado está denegado por la política.                       |
| `policy/mcp-unapproved-server`                           | Un servidor MCP configurado está fuera de la lista de permitidos.                |
| `policy/models-denied-provider`                          | Un proveedor de modelos o una referencia de modelo configurados usa un proveedor denegado. |
| `policy/models-unapproved-provider`                      | Un proveedor de modelos o una referencia de modelo configurados está fuera de la lista de permitidos. |
| `policy/network-private-access-enabled`                  | Una vía de escape SSRF de red privada está habilitada cuando la política la deniega. |
| `policy/ingress-dm-policy-unapproved`                    | Una política de MD de canal está fuera de la lista de permitidos de la política. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` no coincide con el ámbito de aislamiento de MD requerido por la política. |
| `policy/ingress-open-groups-denied`                      | Una política de grupo de canal es `open` mientras la política deniega el ingreso de grupos abiertos. |
| `policy/ingress-group-mention-required`                  | Una entrada de canal o grupo deshabilita las puertas de menciones mientras la política las requiere. |
| `policy/gateway-non-loopback-bind`                       | La postura de enlace del Gateway permite exposición no loopback cuando la política la deniega. |
| `policy/gateway-auth-disabled`                           | La autenticación del Gateway está deshabilitada cuando la política requiere autenticación. |
| `policy/gateway-rate-limit-missing`                      | La postura de límite de tasa de autenticación del Gateway no es explícita cuando la política lo requiere. |
| `policy/gateway-control-ui-insecure`                     | Las opciones de exposición insegura de la interfaz de control del Gateway están habilitadas. |
| `policy/gateway-tailscale-funnel`                        | La exposición de Tailscale Funnel del Gateway está habilitada cuando la política la deniega. |
| `policy/gateway-remote-enabled`                          | El modo remoto del Gateway está activo cuando la política lo deniega.            |
| `policy/gateway-http-endpoint-enabled`                   | Un endpoint de API HTTP del Gateway está habilitado mientras la política lo deniega. |
| `policy/gateway-http-url-fetch-unrestricted`             | La entrada de obtención de URL HTTP del Gateway no tiene una lista de permitidos de URL requerida. |
| `policy/gateway-node-command-denied`                     | Un comando de nodo denegado por la política no está denegado por la configuración de OpenClaw. |
| `policy/agents-workspace-access-denied`                  | El modo sandbox del agente o el acceso al workspace está fuera de la lista de permitidos de la política. |
| `policy/agents-tool-not-denied`                          | Un agente o una configuración predeterminada no deniega una herramienta requerida por la política. |
| `policy/tools-profile-unapproved`                        | Un perfil de herramientas global o por agente configurado está fuera de la lista de permitidos. |
| `policy/tools-fs-workspace-only-required`                | Las herramientas de sistema de archivos no están configuradas con una postura de ruta solo para workspace. |
| `policy/tools-exec-security-unapproved`                  | El modo de seguridad exec está fuera de la lista de permitidos de la política.   |
| `policy/tools-exec-ask-unapproved`                       | El modo de solicitud exec está fuera de la lista de permitidos de la política.   |
| `policy/tools-exec-host-unapproved`                      | El enrutamiento de host exec está fuera de la lista de permitidos de la política. |
| `policy/tools-elevated-enabled`                          | El modo de herramienta elevada está habilitado cuando la política lo deniega.    |
| `policy/tools-also-allow-missing`                        | A una lista `alsoAllow` configurada le falta una entrada requerida por la política. |
| `policy/tools-also-allow-unexpected`                     | Una lista `alsoAllow` configurada incluye una entrada que la política no esperaba. |
| `policy/tools-required-deny-missing`                     | Una lista de denegación de herramientas global o por agente no incluye una herramienta denegada requerida. |
| `policy/sandbox-mode-unapproved`                         | El modo sandbox está fuera de la lista de permitidos de la política.             |
| `policy/sandbox-backend-unapproved`                      | El backend de sandbox está fuera de la lista de permitidos de la política.       |
| `policy/sandbox-container-posture-unobservable`          | Una regla de postura de contenedor está habilitada para un backend que no puede observarla. |
| `policy/sandbox-container-host-network-denied`           | Un sandbox o navegador respaldado por contenedor usa el modo de red del host.    |
| `policy/sandbox-container-namespace-join-denied`         | Un sandbox o navegador respaldado por contenedor se une al namespace de otro contenedor. |
| `policy/sandbox-container-mount-mode-required`           | Un montaje de sandbox o navegador respaldado por contenedor no es de solo lectura. |
| `policy/sandbox-container-runtime-socket-mount`          | Un montaje de sandbox o navegador respaldado por contenedor expone el socket del runtime de contenedores. |
| `policy/sandbox-container-unconfined-profile`            | El perfil de sandbox de contenedor está sin confinamiento cuando la política lo deniega. |
| `policy/sandbox-browser-cdp-source-range-missing`        | Falta el rango de origen CDP del navegador sandbox cuando la política requiere uno. |
| `policy/data-handling-redaction-disabled`                | La redacción de registros sensibles está deshabilitada cuando la política la requiere. |
| `policy/data-handling-telemetry-content-capture`         | La captura de contenido de telemetría está habilitada cuando la política la deniega. |
| `policy/data-handling-session-retention-not-enforced`    | El mantenimiento de retención de sesiones no se aplica cuando la política lo requiere. |
| `policy/data-handling-session-transcript-memory-enabled` | La indexación de memoria de transcripciones de sesión está habilitada cuando la política la deniega. |
| `policy/secrets-unmanaged-provider`                      | Un SecretRef de configuración referencia un proveedor no declarado en `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un proveedor de secretos de configuración o SecretRef usa una fuente denegada por la política. |
| `policy/secrets-insecure-provider`                       | Un proveedor de secretos opta por una postura insegura cuando la política la deniega. |
| `policy/auth-profile-invalid-metadata`                   | A un perfil de autenticación de configuración le faltan metadatos válidos de proveedor o modo. |
| `policy/auth-profile-unapproved-mode`                    | Un modo de perfil de autenticación de configuración está fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-missing`                          | La política requiere `exec-approvals.json`, pero falta el artefacto.             |
| `policy/exec-approvals-invalid`                          | El artefacto de aprobaciones exec configurado no se puede analizar.              |
| `policy/exec-approvals-default-security-unapproved`      | Los valores predeterminados de aprobación exec usan un modo de seguridad fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-agent-security-unapproved`        | Un modo de seguridad efectivo de aprobación exec por agente está fuera de la lista de permitidos. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agente de aprobación exec permite automáticamente de forma implícita las CLI de Skills cuando la política lo deniega. |
| `policy/exec-approvals-allowlist-missing`                | A la lista de permitidos de aprobaciones le falta un patrón requerido por la política. |
| `policy/exec-approvals-allowlist-unexpected`             | La lista de permitidos de aprobaciones incluye un patrón que la política no esperaba. |
| `policy/tools-missing-risk-level`                        | A una declaración de herramienta gobernada le faltan metadatos de riesgo.        |
| `policy/tools-unknown-risk-level`                        | Una declaración de herramienta gobernada usa un valor de riesgo desconocido.     |
| `policy/tools-missing-sensitivity-token`                 | A una declaración de herramienta gobernada le faltan metadatos de sensibilidad.  |
| `policy/tools-missing-owner`                             | A una declaración de herramienta gobernada le faltan metadatos de propietario.   |
| `policy/tools-unknown-sensitivity-token`                 | Una declaración de herramienta gobernada usa un valor de sensibilidad desconocido. |

Los hallazgos de política pueden incluir tanto `target` como `requirement`. `target` es el
elemento observado del workspace que no cumple. `requirement` es la regla de
política escrita que lo convirtió en un hallazgo. Ambos valores son direcciones hoy, normalmente
rutas `oc://`, pero los nombres de los campos describen su rol de política en lugar del
formato de dirección.

Ejemplo de hallazgo JSON:

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

Ejemplo de hallazgo de herramienta:

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

Ejemplo de hallazgo MCP:

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

Ejemplo de hallazgo de proveedor de modelos:

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

Ejemplo de hallazgo de red:

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

Ejemplo de hallazgo de exposición de Gateway:

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

Ejemplo de hallazgo de comando de nodo de Gateway:

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

Ejemplo de hallazgo de espacio de trabajo del agente:

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

`doctor --fix` solo edita la configuración del espacio de trabajo gestionada por políticas cuando `workspaceRepairs` está habilitado explícitamente. Sin esa aceptación, las comprobaciones de políticas informan qué repararían y dejan la configuración sin cambios.

En esta versión, la reparación puede deshabilitar canales que están habilitados en la configuración de OpenClaw pero denegados por `channels.denyRules`. Habilita `workspaceRepairs` solo después de que se haya revisado el archivo de políticas, porque una regla de denegación válida puede desactivar un canal configurado:

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

| Comando          | `0`                                                              | `1`                                                                                     | `2`                                |
| ---------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------- |
| `policy check`   | No hay hallazgos en el umbral.                                   | Uno o más hallazgos alcanzaron el umbral.                                                | Error de argumentos o de runtime.  |
| `policy compare` | El archivo de políticas es al menos tan estricto como la base.    | El archivo de políticas no es válido, falta o es más débil que las reglas de referencia. | Error de argumentos o de runtime.  |
| `policy watch`   | No hay hallazgos y el hash aceptado está actualizado.             | Existen hallazgos o la certificación aceptada está obsoleta.                             | Error de argumentos o de runtime.  |

## Relacionado

- [Modo lint de Doctor](/es/cli/doctor#lint-mode)
- [CLI de rutas](/es/cli/path)
