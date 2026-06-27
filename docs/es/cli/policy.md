---
read_when:
    - Quieres comprobar la configuración de OpenClaw con un policy.jsonc definido
    - Quieres hallazgos de políticas en el lint de doctor
    - Necesitas un hash de certificación de políticas como evidencia de auditoría
summary: Referencia de CLI para comprobaciones de conformidad de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-06-27T11:03:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` lo proporciona el Plugin Policy incluido. Policy es una
capa de conformidad empresarial sobre la configuración existente de OpenClaw. No añade un
segundo sistema de configuración. `policy.jsonc` define requisitos redactados,
OpenClaw observa el espacio de trabajo activo como evidencia, y las comprobaciones de estado de policy
informan desviaciones mediante `doctor --lint`. La señal final de conformidad es una ejecución limpia de
`doctor --lint`; policy aporta hallazgos a esa superficie de lint compartida
en lugar de crear una puerta de estado separada.

Policy actualmente gestiona canales configurados, servidores MCP, proveedores de modelos,
postura SSRF de red, postura de acceso de ingreso/canal, postura de exposición del Gateway, postura del espacio de trabajo del agente,
postura de manejo de datos, postura de proveedor de secretos/perfil de autenticación de la configuración de OpenClaw y declaraciones de herramientas
gobernadas. Por ejemplo, TI o un operador del espacio de trabajo puede registrar que Telegram
no es un proveedor de canal aprobado, restringir servidores MCP y referencias de modelos a
entradas aprobadas, exigir que el acceso de fetch/navegador a redes privadas permanezca
deshabilitado, exigir que el aislamiento de sesión de mensajes directos y la postura de ingreso de canales
se mantengan dentro de límites revisados, exigir que bind/auth/exposición HTTP del Gateway permanezcan dentro de límites revisados,
exigir que el acceso al espacio de trabajo del agente y las denegaciones de herramientas se mantengan en una postura revisada,
exigir que los SecretRefs de configuración de OpenClaw usen proveedores gestionados, exigir que
los perfiles de autenticación de configuración incluyan metadatos de proveedor/modo, exigir que las herramientas gobernadas
incluyan metadatos de riesgo y sensibilidad, exigir redacción de registros sensibles, denegar
la captura de contenido de telemetría, exigir mantenimiento de retención de sesiones, denegar la indexación en memoria de
transcripciones de sesión, y luego usar `doctor --lint` como la puerta de conformidad
compartida.

Use policy cuando un espacio de trabajo necesite una declaración duradera como "estos canales
no deben estar habilitados" o "las herramientas gobernadas deben declarar metadatos de aprobación" y una
forma repetible de probar que OpenClaw todavía cumple esa declaración. Use
solo la configuración normal y la documentación del espacio de trabajo cuando solo necesite comportamiento local y
no necesite hallazgos de policy ni salida de atestación.

## Inicio rápido

Habilite el Plugin Policy incluido antes del primer uso:

```bash
openclaw plugins enable policy
```

Cuando policy está habilitado, doctor puede cargar comprobaciones de estado de policy sin activar
plugins arbitrarios. El plugin permanece habilitado si falta `policy.jsonc`, para que
doctor pueda informar el artefacto ausente.

Policy se redacta; no se genera a partir de la configuración actual del usuario. Una policy mínima
para canales, servidores MCP, proveedores de modelos, postura de red, acceso de ingreso/canal, exposición del Gateway,
postura del espacio de trabajo del agente, postura del runtime de sandbox configurado, postura de
manejo de datos de OpenClaw, postura de proveedor de secretos/perfil de autenticación de configuración, postura de archivo de aprobación de exec
y metadatos de herramientas se ve así:

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
`mcp.servers.*`, `models.providers.*`, referencias seleccionadas de modelos de agente, configuración SSRF de red,
alcance de sesión de mensajes directos, policy de mensajes directos de canal, policy de grupos de canal,
puertas de mención de canal/grupo, postura de bind/auth/Control UI/Tailscale/remoto/HTTP del Gateway,
postura de acceso al espacio de trabajo de sandbox de agentes de configuración de OpenClaw y de denegación de herramientas,
postura de configuración de manejo de datos, proveedor de secretos de configuración
y procedencia de SecretRef, metadatos de perfiles de autenticación de configuración, postura de herramientas configurada
global/por agente y declaraciones de `TOOLS.md` como evidencia, luego
informa el estado observado que no cumple. Si una policy deniega binds de Gateway que no sean local loopback,
omita `gateway.bind` solo cuando
esté dispuesto a revisar el valor predeterminado del runtime; establezca `gateway.bind=loopback` para
conformidad estricta de configuración. Para postura de agente de solo lectura, configure el modo sandbox
en los valores predeterminados o el agente aplicables y establezca `workspaceAccess` en `none` o
`ro`; el modo sandbox omitido o `off` no satisface una policy de solo lectura/sin escritura.
`agents.workspace.denyTools` admite `exec`, `process`, `write`,
`edit` y `apply_patch`; la configuración de OpenClaw `group:fs` cubre herramientas de mutación de archivos
y `group:runtime` cubre herramientas de shell/proceso. La policy de postura de herramientas observa
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled` y las mismas anulaciones por agente
`agents.list[].tools.*`. La policy de aprobación de exec lee el artefacto de producto
`exec-approvals.json` nombrado solo cuando hay una regla `execApprovals`
presente; la evidencia registra valores predeterminados, postura por agente y patrones de allowlist
sin tokens de socket ni texto de comandos usados por última vez. Policy no aplica llamadas de herramientas
en runtime. La evidencia de secretos registra
postura de proveedor/fuente y metadatos de SecretRef, nunca valores secretos sin procesar. Policy
no lee ni atesta almacenes de credenciales por agente como `auth-profiles.json`;
esos almacenes siguen siendo propiedad de los flujos existentes de autenticación y credenciales.
La evidencia de manejo de datos es solo postura a nivel de configuración: comprueba
el modo de redacción configurado, los interruptores de captura de contenido de telemetría, el modo de mantenimiento de sesiones y
la configuración de indexación en memoria de transcripciones de sesión. No inspecciona registros sin procesar,
exportaciones de telemetría, contenidos de transcripciones, archivos de memoria, ni prueba que no existan datos personales
o secretos.

### Referencia de reglas de policy

Cada campo de policy a continuación es opcional. Una comprobación se ejecuta solo cuando la regla coincidente está
presente en `policy.jsonc`. El estado observado es la configuración existente de OpenClaw o
metadatos del espacio de trabajo; policy informa desviaciones pero no reescribe el comportamiento del runtime
salvo que una ruta de reparación esté disponible y habilitada explícitamente.
Los archivos de policy son estrictos: las secciones o claves de regla no admitidas se informan como
`policy/policy-jsonc-invalid` en lugar de ignorarse.

Las superposiciones de policy mantienen globales las reglas amplias de nivel superior y luego permiten que los bloques de alcance con nombre
añadan secciones normales de policy más estrictas para selectores explícitos. Un nombre de alcance es solo un
contenedor descriptivo; la coincidencia usa los valores del selector dentro del alcance.
La superposición es aditiva: las afirmaciones globales siguen ejecutándose, y una afirmación con alcance puede emitir
su propio hallazgo contra la misma configuración observada.

#### Superposiciones con alcance

Use `scopes.<scopeName>` cuando un conjunto de agentes o canales necesite una
policy más estricta que la línea base de nivel superior. Las secciones con alcance de agente usan `agentIds`, que
admite `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`
y `execApprovals.*`. El ingreso con alcance de canal
usa `channelIds`, que admite `ingress.channels.*`. Las secciones no admitidas
se rechazan en lugar de ignorarse. Si una entrada de `agentIds` no está
presente en `agents.list[]`, OpenClaw evalúa la regla con alcance contra la postura
global/predeterminada heredada para ese id de agente de runtime.

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

El mismo agente puede aparecer en varios alcances cuando cada alcance gobierna campos distintos,
como se muestra arriba. Un campo con alcance repetido para el mismo agente debe ser
igual o más restrictivo según los metadatos de policy; las afirmaciones duplicadas más débiles
se rechazan. Los metadatos de rigurosidad tratan las allow-lists como subconjuntos,
las listas de denegación como superconjuntos y los booleanos requeridos como requisitos fijos.

La policy de postura de contenedores se evalúa solo contra la evidencia que OpenClaw puede
observar para el agente coincidente. Si una regla `sandbox.containers.*` habilitada se aplica
a un agente cuyo backend de sandbox no puede exponer ese campo, policy informa
`policy/sandbox-container-posture-unobservable` en lugar de tratar la afirmación como
aprobada. Use alcances `agentIds` separados para grupos de agentes que usan diferentes
backends de sandbox, y deje sin definir o en falso las reglas de contenedor no admitidas para los
grupos donde esos campos no pueden observarse.

`ingress.session.requireDmScope` de nivel superior sigue siendo global porque
`session.dmScope` no es evidencia atribuible al canal.

| Selector     | Secciones compatibles                                                               | Usar cuando                                                  |
| ------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` y `execApprovals`      | Uno o más agentes en tiempo de ejecución necesitan reglas más estrictas. |
| `channelIds` | `ingress.channels`                                                                   | Uno o más canales necesitan reglas de ingreso más estrictas. |

Cada ámbito presente en `policy.jsonc` debe ser válido y aplicable.

#### Canales

| Campo de política                  | Estado observado                        | Usar cuando                                                  |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Proveedor `channels.*` y estado habilitado | Denegar canales configurados de un proveedor como `telegram`. |
| `channels.denyRules[].reason`      | Mensaje de hallazgo y contexto de sugerencia de reparación | Explicar por qué se deniega el proveedor.                    |

#### Servidores MCP

| Campo de política  | Estado observado   | Usar cuando                                                  |
| ------------------ | ------------------ | ------------------------------------------------------------ |
| `mcp.servers.allow` | IDs `mcp.servers.*` | Exigir que cada servidor MCP configurado esté en una lista de permitidos. |
| `mcp.servers.deny`  | IDs `mcp.servers.*` | Denegar IDs específicos de servidores MCP configurados.      |

#### Proveedores de modelos

| Campo de política       | Estado observado                                | Usar cuando                                                  |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `models.providers.allow` | IDs `models.providers.*` y refs de modelo seleccionadas | Exigir que los proveedores configurados y las refs de modelo seleccionadas usen proveedores aprobados. |
| `models.providers.deny`  | IDs `models.providers.*` y refs de modelo seleccionadas | Denegar proveedores configurados y refs de modelo seleccionadas por ID de proveedor. |

#### Red

| Campo de política              | Estado observado                         | Usar cuando                                                  |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| `network.privateNetwork.allow` | Vías de escape SSRF de red privada       | Establecer en `false` para exigir que el acceso a redes privadas permanezca deshabilitado. |

#### Ingreso y acceso a canales

| Campo de política                         | Estado observado                                                | Usar cuando                                                  |
| ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                               | Exigir un ámbito revisado de aislamiento de mensajes directos. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` y campos heredados de política de DM de canal | Permitir solo políticas revisadas de canal de mensajes directos. |
| `ingress.channels.denyOpenGroups`         | Política de ingreso de canal, cuenta y grupo                    | Denegar el ingreso de grupos abiertos para canales y cuentas configurados. |
| `ingress.channels.requireMentionInGroups` | Configuración de puerta de mención de canal, cuenta, grupo, guild y anidada | Exigir puertas de mención cuando el ingreso de grupo esté abierto o condicionado por mención. |

#### Gateway

| Campo de política                       | Estado observado                              | Usar cuando                                                  |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                | Establecer en `false` para exigir el enlace de Gateway por loopback. |
| `gateway.exposure.allowTailscaleFunnel` | Postura de Tailscale serve/funnel de Gateway  | Establecer en `false` para denegar la exposición de Tailscale Funnel. |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                           | Establecer en `true` para rechazar la autenticación deshabilitada de Gateway. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                      | Establecer en `true` para exigir configuración explícita de límite de tasa de autenticación. |
| `gateway.controlUi.allowInsecure`       | Conmutadores inseguros de autenticación/dispositivo/origen de Control UI | Establecer en `false` para denegar conmutadores inseguros de exposición de Control UI. |
| `gateway.remote.allow`                  | Modo/configuración de Gateway remoto          | Establecer en `false` para denegar el modo de Gateway remoto. |
| `gateway.http.denyEndpoints`            | Endpoints de API HTTP de Gateway              | Denegar IDs de endpoint como `chatCompletions` o `responses`. |
| `gateway.http.requireUrlAllowlists`     | Entradas de obtención de URL HTTP de Gateway  | Establecer en `true` para exigir listas de URL permitidas en entradas de obtención de URL. |

#### Espacio de trabajo del agente

| Campo de política                | Estado observado                                                                     | Usar cuando                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` y `agents.list[].sandbox.workspaceAccess` | Permitir solo valores de acceso al espacio de trabajo del sandbox como `none` o `ro`. |
| `agents.workspace.denyTools`     | Configuración global y por agente de denegación de herramientas                      | Exigir que se denieguen herramientas de mutación de espacio de trabajo/tiempo de ejecución como `exec`, `process`, `write`, `edit` o `apply_patch`. |

#### Postura del sandbox

| Campo de política                                     | Estado observado                                     | Usar cuando                                                  |
| ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` y modo por agente     | Permitir solo modos de sandbox revisados como `all` o `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` y backend por agente | Permitir solo backends de sandbox revisados como `docker`.   |
| `sandbox.containers.denyHostNetwork`                  | Modo de red de sandbox/navegador respaldado por contenedor | Denegar el modo de red del host.                             |
| `sandbox.containers.denyContainerNamespaceJoin`       | Modo de red de sandbox/navegador respaldado por contenedor | Denegar unirse al espacio de nombres de red de otro contenedor. |
| `sandbox.containers.requireReadOnlyMounts`            | Modo de montaje de sandbox/navegador respaldado por contenedor | Exigir que los montajes sean de solo lectura.                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montaje de sandbox/navegador respaldado por contenedor | Denegar montajes de sockets de runtime de contenedores.      |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura de perfil de seguridad de contenedor         | Denegar perfiles de seguridad de contenedor sin confinamiento. |
| `sandbox.browser.requireCdpSourceRange`               | Rango de origen CDP del navegador del sandbox        | Exigir que la exposición CDP del navegador declare un rango de origen. |

Policy trata la ausencia de `sandbox.mode` como el valor predeterminado implícito `off`, por lo que
`sandbox.requireMode` informa que un sandbox nuevo o sin configurar está fuera de una
lista de permitidos como `["all"]`.

#### Manejo de datos

| Campo de política                                   | Estado observado                                                                    | Usar cuando                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                           | Establecer en `true` para rechazar `logging.redactSensitive: "off"`. |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                   | Establecer en `true` para rechazar la captura de contenido de telemetría. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                          | Establecer en `true` para exigir el modo efectivo de mantenimiento de sesión `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` y `agents.*.memorySearch.experimental.sessionMemory` | Establecer en `true` para rechazar la indexación de transcripciones de sesión en la memoria. |

#### Secretos

| Campo de política             | Estado observado                                        | Usar cuando                                                  |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `secrets.requireManagedProviders` | SecretRefs de configuración y declaraciones `secrets.providers.*` | Establecer en `true` para exigir que los SecretRefs apunten a proveedores declarados. |
| `secrets.denySources`         | Orígenes de proveedor de secretos y orígenes de SecretRef | Denegar orígenes como `exec`, `file` u otro nombre de origen configurado. |
| `secrets.allowInsecureProviders` | Indicadores de postura insegura de proveedor de secretos | Establecer en `false` para rechazar proveedores que optan por una postura insegura. |

#### Aprobaciones de exec

La política de aprobaciones de exec observa el artefacto activo de runtime
`exec-approvals.json`. De forma predeterminada, es `~/.openclaw/exec-approvals.json`; cuando
`OPENCLAW_STATE_DIR` está establecido, Policy lee
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Las reglas de postura reales como
`execApprovals.defaults.*` o `execApprovals.agents.*` requieren evidencia de artefacto
legible; un artefacto ausente o no válido se informa como evidencia no observable
en lugar de convertirse en una aprobación de mejor esfuerzo contra valores predeterminados sintéticos de runtime. Una vez
que el artefacto es legible, los campos de aprobación omitidos heredan los valores predeterminados de runtime: la ausencia de
`defaults.security` es `full`, y la ausencia de seguridad del agente hereda ese
valor predeterminado. La evidencia incluye `defaults`, `agents.*` y
`agents.*.allowlist[].pattern`, además de `argPattern` opcional, la postura efectiva de
`autoAllowSkills` y el origen de la entrada. No incluye la ruta/token del socket,
`commandText`, `lastUsedCommand`, rutas resueltas ni marcas de tiempo.

| Campo de política                          | Estado observado                                                                       | Usar cuando                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                | Ruta activa de runtime `exec-approvals.json`                                           | Establece en `true` para exigir que el artefacto de aprobaciones exista y se analice.   |
| `execApprovals.defaults.allowSecurity`     | `defaults.security`, con valor predeterminado `full`                                   | Permitir solo modos de seguridad de aprobación predeterminados aprobados.               |
| `execApprovals.agents.allowSecurity`       | `agents.*.security`, que hereda los valores predeterminados                            | Permitir solo modos de seguridad de aprobación efectivos por agente aprobados.          |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` y `agents.*.autoAllowSkills`, que heredan los valores predeterminados del runtime | Establece en `false` para exigir listas de permitidos manuales estrictas sin aprobación implícita de CLI de Skills. |
| `execApprovals.agents.allowlist.expected`  | Patrón agregado de `agents.*.allowlist[]` y entradas opcionales de argPattern          | Exigir que la lista de permitidos de aprobaciones coincida con el conjunto de patrones revisado. |

Por ejemplo, exige el artefacto de aprobaciones, deniega valores predeterminados permisivos y
permite solo la postura de aprobación de exec revisada para agentes seleccionados:

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

| Campo de política              | Estado observado                             | Usar cuando                                                                               |
| ------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadatos de proveedor y modo de `auth.profiles.*` | Exigir claves de metadatos como `provider` y `mode` en perfiles de autenticación de configuración. |
| `auth.profiles.allowModes`     | `auth.profiles.*.mode`                       | Permitir solo modos de perfil de autenticación compatibles como `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadatos de herramientas

| Campo de política       | Estado observado                  | Usar cuando                                                                               |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Declaraciones gobernadas de `TOOLS.md` | Exigir que las herramientas gobernadas declaren claves de metadatos como `risk`, `sensitivity` u `owner`. |

#### Postura de herramientas

| Campo de política               | Estado observado                                             | Usar cuando                                                                                               |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` y `agents.list[].tools.profile`              | Permitir solo ids de perfil de herramienta como `minimal`, `messaging` o `coding`.                       |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` y anulaciones `tools.fs` por agente | Establece en `true` para exigir una postura de herramienta de sistema de archivos limitada al espacio de trabajo. |
| `tools.exec.allowSecurity`      | `tools.exec.security` y seguridad de exec por agente         | Permitir solo modos de seguridad de exec como `deny` o `allowlist`.                                      |
| `tools.exec.requireAsk`         | `tools.exec.ask` y modo de solicitud de exec por agente      | Exigir una postura de aprobación como `always`.                                                          |
| `tools.exec.allowHosts`         | `tools.exec.host` y enrutamiento de host de exec por agente  | Permitir solo modos de enrutamiento de host de exec como `sandbox`.                                      |
| `tools.elevated.allow`          | `tools.elevated.enabled` y postura elevada por agente        | Establece en `false` para exigir que el modo de herramienta elevada permanezca deshabilitado.            |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` y `tools.alsoAllow` por agente             | Exigir entradas exactas de `alsoAllow` e informar concesiones de herramientas aditivas faltantes o inesperadas. |
| `tools.denyTools`               | `tools.deny` y `agents.list[].tools.deny`                    | Exigir que las listas de denegación de herramientas configuradas incluyan ids o grupos de herramientas como `group:runtime` y `group:fs`. |

Ejecuta comprobaciones solo de política durante la autoría:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` ejecuta solo el conjunto de comprobaciones de política y emite evidencia, hallazgos y
hashes de atestación. Los mismos hallazgos también aparecen en `openclaw doctor --lint`
cuando el Plugin de política está habilitado.

Compara un archivo de política de operador con un archivo de política de referencia creado:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` compara la sintaxis de un archivo de política con la sintaxis de otro archivo de política. No
inspecciona el estado del runtime de OpenClaw, evidencia, credenciales ni secretos. El comando
usa los mismos metadatos de reglas de política que gobiernan las superposiciones con ámbito: las listas de permitidos deben
permanecer iguales o más restringidas, las listas de denegación deben permanecer iguales o más amplias, los booleanos requeridos
deben conservar su valor requerido, las cadenas ordenadas deben moverse solo hacia el extremo más
restrictivo del orden configurado, y las listas exactas deben coincidir.

El archivo de referencia puede ser una política creada por la organización. La política comprobada puede
usar valores más estrictos o agregar reglas de política adicionales. Una regla comprobada de nivel superior también puede
satisfacer una regla de referencia con ámbito cuando es igual o más restrictiva porque
la política de nivel superior se aplica ampliamente. Los nombres de ámbito no tienen que coincidir; la
comparación con ámbito se indexa por valor de selector, como `agentIds` o `channelIds`, y por
el campo de política que se comprueba.

Ejemplo de salida JSON limpia de comparación que informa solo el estado de comparación de archivos de política:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Ejemplo de salida limpia de `policy check --json` que incluye hashes estables que puede
registrar un operador o supervisor:

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

La configuración de política reside en `plugins.entries.policy.config`.

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

| Configuración             | Propósito                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| `enabled`                 | Habilitar comprobaciones de política incluso antes de que exista `policy.jsonc`. |
| `workspaceRepairs`        | Permitir que `doctor --fix` edite ajustes del espacio de trabajo gestionados por políticas. |
| `expectedHash`            | Bloqueo de hash opcional para el artefacto de política aprobado. |
| `expectedAttestationHash` | Bloqueo de hash opcional para la última comprobación de política limpia aceptada. |
| `path`                    | Ubicación relativa al espacio de trabajo del artefacto de política. |

Establece `plugins.entries.policy.config.enabled` en `false` para deshabilitar las comprobaciones de política
para un espacio de trabajo mientras dejas el plugin instalado.

Los requisitos de metadatos de herramientas se crean en `policy.jsonc` con
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

El hash de política identifica el artefacto de reglas creado. El bloque de evidencia
registra el estado observado de OpenClaw usado por las comprobaciones de política. El
valor `workspace.hash` identifica esa carga de evidencia para el alcance comprobado.
El hash de hallazgos identifica el conjunto exacto de hallazgos devuelto por la comprobación.
`checkedAt` registra cuándo se ejecutó la evaluación. El hash de atestación identifica
la afirmación estable: hash de política, hash de evidencia, hash de hallazgos y si el
resultado fue limpio. Intencionalmente no incluye `checkedAt`, por lo que el mismo
estado de política produce la misma atestación en comprobaciones repetidas. En conjunto,
estos forman la tupla de auditoría para esta comprobación de política.

Si un Gateway o supervisor posterior usa la política para bloquear, aprobar o anotar una
acción en tiempo de ejecución, debe registrar el hash de atestación de la última comprobación
de política limpia. `checkedAt` permanece en la salida JSON para los registros de auditoría,
pero no forma parte del hash de atestación estable.

Usa este ciclo de vida al aceptar el estado de política:

1. Crea o revisa `policy.jsonc`.
2. Ejecuta `openclaw policy check --json`.
3. Si el resultado es limpio, registra `attestation.policy.hash` como `expectedHash`.
4. Registra `attestation.attestationHash` como `expectedAttestationHash`.
5. Vuelve a ejecutar `openclaw doctor --lint` en CI o en las puertas de lanzamiento.

Si las reglas de política cambian intencionalmente, actualiza ambos hashes aceptados a partir de una
comprobación limpia. Si la configuración del espacio de trabajo cambia intencionalmente pero la política se mantiene igual,
normalmente solo cambia `expectedAttestationHash`.

Habilitar o actualizar las reglas de `agents.workspace` agrega evidencia de `agentWorkspace` al
hash del espacio de trabajo y al hash de atestación. Los operadores deben revisar la nueva
evidencia y actualizar los hashes de atestación aceptados después de habilitar estas reglas.
Habilitar o actualizar las reglas de postura de herramientas agrega evidencia de `toolPosture` de la
misma manera.

`openclaw policy watch` ejecuta la misma comprobación repetidamente e informa cuando la
evidencia actual ya no coincide con `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Usa `--once` en CI o scripts que solo necesiten una evaluación de deriva. Sin
`--once`, el comando sondea cada dos segundos de forma predeterminada; usa `--interval-ms` para
elegir un intervalo diferente.

## Hallazgos

Actualmente, la política verifica:

| Id de comprobación                                       | Hallazgo                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La política está habilitada, pero falta `policy.jsonc`.                                   |
| `policy/policy-jsonc-invalid`                            | La política no se puede analizar o contiene entradas de reglas mal formadas.              |
| `policy/policy-hash-mismatch`                            | La política no coincide con el `expectedHash` configurado.                                |
| `policy/attestation-hash-mismatch`                       | La evidencia de política actual ya no coincide con la atestación aceptada.                |
| `policy/policy-conformance-invalid`                      | Un archivo de política base o comprobado tiene sintaxis de comparación no válida.         |
| `policy/policy-conformance-missing`                      | A un archivo de política comprobado le falta una regla requerida por el archivo base.     |
| `policy/policy-conformance-weaker`                       | Un archivo de política comprobado tiene un valor más débil que el archivo de política base. |
| `policy/channels-denied-provider`                        | Un canal habilitado coincide con una regla de denegación de canales.                      |
| `policy/mcp-denied-server`                               | Un servidor MCP configurado está denegado por la política.                                |
| `policy/mcp-unapproved-server`                           | Un servidor MCP configurado está fuera de la lista de permitidos.                         |
| `policy/models-denied-provider`                          | Un proveedor de modelos configurado o una referencia de modelo usa un proveedor denegado. |
| `policy/models-unapproved-provider`                      | Un proveedor de modelos configurado o una referencia de modelo está fuera de la lista de permitidos. |
| `policy/network-private-access-enabled`                  | Un mecanismo de escape SSRF de red privada está habilitado cuando la política lo deniega. |
| `policy/ingress-dm-policy-unapproved`                    | Una política de DM de canal está fuera de la lista de permitidos de la política.          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` no coincide con el alcance de aislamiento de DM requerido por la política. |
| `policy/ingress-open-groups-denied`                      | Una política de grupo de canal es `open` mientras la política deniega la entrada de grupos abiertos. |
| `policy/ingress-group-mention-required`                  | Una entrada de canal o grupo deshabilita las puertas de mención mientras la política las requiere. |
| `policy/gateway-non-loopback-bind`                       | La postura de vinculación de Gateway permite exposición que no es loopback cuando la política la deniega. |
| `policy/gateway-auth-disabled`                           | La autenticación de Gateway está deshabilitada cuando la política requiere autenticación. |
| `policy/gateway-rate-limit-missing`                      | La postura de límite de tasa de autenticación de Gateway no es explícita cuando la política lo requiere. |
| `policy/gateway-control-ui-insecure`                     | Los conmutadores de exposición insegura de la interfaz de control de Gateway están habilitados. |
| `policy/gateway-tailscale-funnel`                        | La exposición de Gateway mediante Tailscale Funnel está habilitada cuando la política la deniega. |
| `policy/gateway-remote-enabled`                          | El modo remoto de Gateway está activo cuando la política lo deniega.                      |
| `policy/gateway-http-endpoint-enabled`                   | Un endpoint de API HTTP de Gateway está habilitado mientras la política lo deniega.       |
| `policy/gateway-http-url-fetch-unrestricted`             | La entrada de obtención de URL HTTP de Gateway carece de una lista de permitidos de URL requerida. |
| `policy/agents-workspace-access-denied`                  | El modo de sandbox del agente o el acceso al espacio de trabajo está fuera de la lista de permitidos de la política. |
| `policy/agents-tool-not-denied`                          | Un agente o configuración predeterminada no deniega una herramienta requerida por la política. |
| `policy/tools-profile-unapproved`                        | Un perfil de herramientas global o por agente configurado está fuera de la lista de permitidos. |
| `policy/tools-fs-workspace-only-required`                | Las herramientas de sistema de archivos no están configuradas con una postura de rutas solo de espacio de trabajo. |
| `policy/tools-exec-security-unapproved`                  | El modo de seguridad de exec está fuera de la lista de permitidos de la política.         |
| `policy/tools-exec-ask-unapproved`                       | El modo de solicitud de exec está fuera de la lista de permitidos de la política.         |
| `policy/tools-exec-host-unapproved`                      | El enrutamiento de host de exec está fuera de la lista de permitidos de la política.      |
| `policy/tools-elevated-enabled`                          | El modo de herramienta elevada está habilitado cuando la política lo deniega.             |
| `policy/tools-also-allow-missing`                        | A una lista `alsoAllow` configurada le falta una entrada requerida por la política.       |
| `policy/tools-also-allow-unexpected`                     | Una lista `alsoAllow` configurada incluye una entrada que la política no espera.          |
| `policy/tools-required-deny-missing`                     | Una lista de denegación de herramientas global o por agente no incluye una herramienta denegada requerida. |
| `policy/sandbox-mode-unapproved`                         | El modo de sandbox está fuera de la lista de permitidos de la política.                   |
| `policy/sandbox-backend-unapproved`                      | El backend de sandbox está fuera de la lista de permitidos de la política.                |
| `policy/sandbox-container-posture-unobservable`          | Una regla de postura de contenedor está habilitada para un backend que no puede observarla. |
| `policy/sandbox-container-host-network-denied`           | Un sandbox o navegador respaldado por contenedor usa el modo de red del host.             |
| `policy/sandbox-container-namespace-join-denied`         | Un sandbox o navegador respaldado por contenedor se une al espacio de nombres de otro contenedor. |
| `policy/sandbox-container-mount-mode-required`           | Un montaje de sandbox o navegador respaldado por contenedor no es de solo lectura.        |
| `policy/sandbox-container-runtime-socket-mount`          | Un montaje de sandbox o navegador respaldado por contenedor expone el socket del runtime del contenedor. |
| `policy/sandbox-container-unconfined-profile`            | El perfil de sandbox de contenedor no está confinado cuando la política lo deniega.       |
| `policy/sandbox-browser-cdp-source-range-missing`        | Falta el rango de origen CDP del navegador de sandbox cuando la política requiere uno.    |
| `policy/data-handling-redaction-disabled`                | La redacción de registros sensibles está deshabilitada cuando la política la requiere.    |
| `policy/data-handling-telemetry-content-capture`         | La captura de contenido de telemetría está habilitada cuando la política la deniega.      |
| `policy/data-handling-session-retention-not-enforced`    | El mantenimiento de retención de sesiones no se aplica cuando la política lo requiere.    |
| `policy/data-handling-session-transcript-memory-enabled` | La indexación en memoria de transcripciones de sesión está habilitada cuando la política la deniega. |
| `policy/secrets-unmanaged-provider`                      | Un SecretRef de configuración hace referencia a un proveedor no declarado en `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un proveedor de secretos de configuración o SecretRef usa un origen denegado por la política. |
| `policy/secrets-insecure-provider`                       | Un proveedor de secretos opta por una postura insegura cuando la política la deniega.     |
| `policy/auth-profile-invalid-metadata`                   | A un perfil de autenticación de configuración le faltan metadatos válidos de proveedor o modo. |
| `policy/auth-profile-unapproved-mode`                    | Un modo de perfil de autenticación de configuración está fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-missing`                          | La política requiere `exec-approvals.json`, pero falta el artefacto.                      |
| `policy/exec-approvals-invalid`                          | El artefacto de aprobaciones de exec configurado no se puede analizar.                    |
| `policy/exec-approvals-default-security-unapproved`      | Los valores predeterminados de aprobación de exec usan un modo de seguridad fuera de la lista de permitidos de la política. |
| `policy/exec-approvals-agent-security-unapproved`        | Un modo de seguridad efectivo de aprobación de exec por agente está fuera de la lista de permitidos. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agente de aprobación de exec permite implícitamente de forma automática las CLI de Skills cuando la política lo deniega. |
| `policy/exec-approvals-allowlist-missing`                | A la lista de permitidos de aprobaciones le falta un patrón requerido por la política.    |
| `policy/exec-approvals-allowlist-unexpected`             | La lista de permitidos de aprobaciones incluye un patrón que la política no espera.       |
| `policy/tools-missing-risk-level`                        | A una declaración de herramienta gobernada le faltan metadatos de riesgo.                 |
| `policy/tools-unknown-risk-level`                        | Una declaración de herramienta gobernada usa un valor de riesgo desconocido.              |
| `policy/tools-missing-sensitivity-token`                 | A una declaración de herramienta gobernada le faltan metadatos de sensibilidad.           |
| `policy/tools-missing-owner`                             | A una declaración de herramienta gobernada le faltan metadatos de propietario.            |
| `policy/tools-unknown-sensitivity-token`                 | Una declaración de herramienta gobernada usa un valor de sensibilidad desconocido.        |

Los hallazgos de política pueden incluir tanto `target` como `requirement`. `target` es el
elemento observado del espacio de trabajo que no cumple. `requirement` es la regla de
política escrita que hizo que fuera un hallazgo. Ambos valores son direcciones hoy,
normalmente rutas `oc://`, pero los nombres de los campos describen su rol en la política
en lugar del formato de dirección.

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

Ejemplo de hallazgo del espacio de trabajo del agente:

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

`doctor --fix` solo edita la configuración del espacio de trabajo administrada por políticas cuando
`workspaceRepairs` está habilitado explícitamente. Sin esa aceptación, las comprobaciones de políticas
informan qué repararían y dejan la configuración sin cambios.

En esta versión, la reparación puede deshabilitar canales que están habilitados en la configuración de OpenClaw
pero denegados por `channels.denyRules`. Habilita `workspaceRepairs` solo después de que
se haya revisado el archivo de políticas, porque una regla de denegación válida puede desactivar un
canal configurado:

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
| `policy check`   | No hay hallazgos en el umbral.                         | Uno o más hallazgos alcanzaron el umbral.                           | Fallo de argumento o de ejecución. |
| `policy compare` | El archivo de políticas es al menos tan estricto como la línea base. | El archivo de políticas no es válido, falta o es más débil que las reglas de la línea base. | Fallo de argumento o de ejecución. |
| `policy watch`   | No hay hallazgos y el hash aceptado está actualizado.  | Existen hallazgos o la atestación aceptada está obsoleta.           | Fallo de argumento o de ejecución. |

## Relacionado

- [Modo lint de Doctor](/es/cli/doctor#lint-mode)
- [CLI de Path](/es/cli/path)
