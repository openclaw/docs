---
read_when:
    - Quieres comprobar la configuración de OpenClaw con un archivo policy.jsonc definido manualmente
    - Quieres que el análisis de doctor detecte incumplimientos de políticas
    - Necesita un hash de certificación de políticas como evidencia de auditoría
summary: Referencia de la CLI para las comprobaciones de conformidad de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-07-12T14:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` se proporciona mediante el Plugin Policy incluido. Es una capa
de conformidad empresarial sobre la configuración existente de OpenClaw, no un
segundo sistema de configuración. Los requisitos se definen en `policy.jsonc`;
OpenClaw observa el espacio de trabajo activo como evidencia; la política
notifica desviaciones mediante `doctor --lint`. La política no impone llamadas
a herramientas ni reescribe el comportamiento en tiempo de ejecución durante
las solicitudes, y tampoco certifica almacenes de credenciales por agente como
`auth-profiles.json`.

La política comprueba los canales configurados, los servidores MCP, los
proveedores de modelos, la postura de SSRF de red, el acceso de entrada y de
canales, la exposición del Gateway y la postura de comandos de Node, el acceso
de los agentes al espacio de trabajo, la postura del entorno aislado, la postura
de tratamiento de datos, la postura de proveedores de secretos y perfiles de
autenticación, y los metadatos de herramientas sujetos a gobernanza
(`TOOLS.md`). Úsela cuando un espacio de trabajo necesite una declaración
duradera y verificable, como «Telegram no debe estar habilitado» o «las
herramientas sujetas a gobernanza deben declarar metadatos de riesgo y
propietario». Si solo necesita comportamiento local sin certificación ni
detección de desviaciones, basta con la configuración normal.

## Inicio rápido

```bash
openclaw plugins enable policy
```

El Plugin permanece habilitado incluso si falta `policy.jsonc`, por lo que
doctor puede informar de la ausencia del artefacto en lugar de omitir
silenciosamente las comprobaciones.

Cree `policy.jsonc` manualmente; no se genera a partir de la configuración
actual. Cada sección de nivel superior es un espacio de nombres de reglas: una
comprobación solo se ejecuta cuando contiene una regla concreta (las secciones
o claves no compatibles producen `policy/policy-jsonc-invalid` en lugar de
ignorarse silenciosamente). Ejemplo mínimo que abarca todas las secciones
compatibles:

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

Notas transversales que no resultan evidentes en las tablas de reglas que
aparecen a continuación:

- Omitir `gateway.bind` mientras se rechazan los enlaces que no sean de bucle
  invertido significa que se acepta el valor predeterminado del entorno de
  ejecución; establezca `gateway.bind: "loopback"` para una conformidad
  estricta.
- Para un agente de solo lectura, establezca el `mode` del entorno aislado en
  `all` o `non-main` en los valores predeterminados o el agente correspondientes,
  y `workspaceAccess` en `none` o `ro`. La ausencia del modo de entorno aislado
  o el valor `off` no satisfacen una política de solo lectura.
- `agents.workspace.denyTools` acepta `exec`, `process`, `write`, `edit` y
  `apply_patch`. Los grupos de denegación de herramientas de configuración
  `group:fs` (modificación de archivos) y `group:runtime` (shell/procesos)
  satisfacen la postura equivalente.
- Las comprobaciones de aprobación de ejecución leen el artefacto
  `exec-approvals.json` activo solo cuando existe una regla `execApprovals`; un
  artefacto ausente o no válido constituye evidencia no observable, no una
  aprobación sintética.
- La evidencia de secretos y perfiles de autenticación registra únicamente la
  postura del proveedor o la fuente y los metadatos de SecretRef, nunca los
  valores sin procesar. La política no lee ni certifica almacenes de
  credenciales por agente como `auth-profiles.json`.
- La evidencia de tratamiento de datos representa únicamente la postura a
  nivel de configuración (modo de ocultación, opción de captura de telemetría,
  modo de mantenimiento de sesiones y configuración de indexación de
  transcripciones). No inspecciona registros, exportaciones de telemetría,
  transcripciones ni archivos de memoria, y un resultado sin incidencias no
  demuestra que no contengan datos personales o secretos.

### Referencia de reglas de política

Todas las reglas siguientes son opcionales; una comprobación solo se ejecuta
cuando la regla está presente. El estado observado es la configuración
existente de OpenClaw o los metadatos del espacio de trabajo.

#### Superposiciones con ámbito

Use `scopes.<scopeName>` cuando agentes o canales específicos necesiten una
política más estricta que la base de nivel superior. El nombre del ámbito es
solo una etiqueta; la correspondencia utiliza el selector incluido en el
ámbito. Las superposiciones son aditivas: la regla global continúa
ejecutándose y la regla con ámbito puede añadir su propio hallazgo sobre la
misma evidencia.

| Selector     | Secciones compatibles                                                          | Cuándo usarlo                                                     |
| ------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Uno o varios agentes de ejecución necesitan reglas más estrictas. |
| `channelIds` | `ingress.channels`                                                             | Uno o varios canales necesitan reglas de entrada más estrictas.   |

Si una entrada de `agentIds` no está presente en `agents.list[]`, OpenClaw
evalúa la regla con ámbito respecto de la postura global o predeterminada
heredada para ese identificador de agente de ejecución, en lugar de omitirla.

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

El mismo agente puede aparecer en varios ámbitos si cada uno rige un campo
diferente, como en el ejemplo anterior. Un campo con ámbito repetido para el
mismo agente debe ser igual o más restrictivo; las declaraciones duplicadas
menos restrictivas se rechazan (las listas de permitidos son subconjuntos, las
listas de denegados son superconjuntos y los booleanos obligatorios son fijos).

Las reglas de postura de contenedores (`sandbox.containers.*`) se comprueban
únicamente respecto de la evidencia que puede exponer el backend de entorno
aislado del agente correspondiente. Si un backend no puede observar una regla
que se haya habilitado para él, la política informa de
`policy/sandbox-container-posture-unobservable` en lugar de aprobarla; limite
las reglas de contenedores a los grupos de agentes que utilicen un backend
capaz de exponerlas.

`ingress.session.requireDmScope` en el nivel superior sigue siendo global;
`session.dmScope` no es evidencia atribuible a un canal, por lo que no puede
limitarse mediante `channelIds`.

Todos los ámbitos presentes en `policy.jsonc` deben ser válidos y aplicables.

#### Canales

| Campo de política                      | Estado observado                                 | Cuándo usarlo                                                       |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| `channels.denyRules[].when.provider`   | Proveedor y estado habilitado de `channels.*`    | Rechazar canales configurados de un proveedor como `telegram`.      |
| `channels.denyRules[].reason`          | Mensaje del hallazgo y contexto de reparación    | Explicar por qué se rechaza el proveedor.                            |

#### Servidores MCP

| Campo de política   | Estado observado       | Cuándo usarlo                                                               |
| ------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `mcp.servers.allow` | Id. de `mcp.servers.*`  | Exigir que todos los servidores MCP configurados estén en una lista blanca. |
| `mcp.servers.deny`  | Id. de `mcp.servers.*`  | Rechazar identificadores específicos de servidores MCP configurados.        |

#### Proveedores de modelos

| Campo de política          | Estado observado                                      | Cuándo usarlo                                                                                             |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `models.providers.allow`   | Id. de `models.providers.*` y referencias de modelos seleccionados | Exigir que los proveedores configurados y las referencias de modelos seleccionados utilicen proveedores aprobados. |
| `models.providers.deny`    | Id. de `models.providers.*` y referencias de modelos seleccionados | Rechazar los proveedores configurados y las referencias de modelos seleccionados según el identificador del proveedor. |

#### Red

| Campo de política                 | Estado observado                           | Cuándo usarlo                                                                  |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| `network.privateNetwork.allow`    | Vías de escape de SSRF hacia redes privadas | Establecerlo en `false` para exigir que el acceso a redes privadas permanezca deshabilitado. |

#### Entrada y acceso a canales

| Campo de política                           | Estado observado                                               | Usar cuando                                                                 |
| ------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`            | `session.dmScope`                                               | Se requiera un ámbito revisado de aislamiento de mensajes directos.         |
| `ingress.channels.allowDmPolicies`          | `channels.*.dmPolicy` y campos heredados de política de MD del canal | Se permitan únicamente políticas revisadas de mensajes directos del canal. |
| `ingress.channels.denyOpenGroups`           | Política de entrada de canales, cuentas y grupos                | Se deniegue la entrada de grupos abiertos para los canales y cuentas configurados. |
| `ingress.channels.requireMentionInGroups`   | Configuración de restricción de menciones de canales, cuentas, grupos, servidores y elementos anidados | Se requieran restricciones de menciones cuando la entrada de grupos esté abierta o restringida por menciones. |

#### Gateway

| Campo de política                         | Estado observado                                      | Usar cuando                                                                                   |
| ----------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind`   | `gateway.bind`                                        | Se establezca en `false` para exigir que Gateway se vincule a la interfaz de bucle invertido. |
| `gateway.exposure.allowTailscaleFunnel`   | Postura de servicio/Funnel de Tailscale para Gateway  | Se establezca en `false` para denegar la exposición mediante Tailscale Funnel.                 |
| `gateway.auth.requireAuth`                | `gateway.auth.mode`                                   | Se establezca en `true` para rechazar la autenticación deshabilitada de Gateway.              |
| `gateway.auth.requireExplicitRateLimit`   | `gateway.auth.rateLimit`                              | Se establezca en `true` para exigir una configuración explícita del límite de solicitudes de autenticación. |
| `gateway.controlUi.allowInsecure`         | Controles de autenticación, dispositivo u origen inseguros de la interfaz de control | Se establezca en `false` para denegar los controles de exposición insegura de la interfaz de control. |
| `gateway.remote.allow`                    | Modo/configuración remotos de Gateway                 | Se establezca en `false` para denegar el modo remoto de Gateway.                              |
| `gateway.http.denyEndpoints`              | Endpoints de la API HTTP de Gateway                   | Se denieguen identificadores de endpoint como `chatCompletions` o `responses`.                |
| `gateway.http.requireUrlAllowlists`       | Entradas de obtención de URL mediante HTTP de Gateway | Se establezca en `true` para exigir listas de URL permitidas en las entradas de obtención de URL. |
| `gateway.nodes.denyCommands`              | `gateway.nodes.denyCommands`                          | Se exija que se denieguen en la configuración de OpenClaw identificadores exactos de comandos de Node, como `system.run`. |

`gateway.nodes.denyCommands` es una regla de superconjunto de denegación exacta
y sensible a mayúsculas y minúsculas. Se utiliza cuando la política debe
demostrar que la configuración de OpenClaw deniega explícitamente los comandos
privilegiados de Node. Una implementación que permita intencionadamente un
comando privilegiado de Node debe actualizar `policy.jsonc` después de su
revisión, en lugar de depender únicamente de `gateway.nodes.allowCommands`.

#### Espacio de trabajo del agente

| Campo de política                 | Estado observado                                                                        | Usar cuando                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` y `agents.list[].sandbox.workspaceAccess`      | Se permitan únicamente valores de acceso al espacio de trabajo del entorno aislado como `none` o `ro`. |
| `agents.workspace.denyTools`     | Configuración global y por agente de denegación de herramientas                          | Se exija denegar las herramientas de modificación (`exec`, `process`, `write`, `edit`, `apply_patch`). |

#### Postura del entorno aislado

| Campo de política                                     | Estado observado                                             | Usar cuando                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` y modo por agente             | Se permitan únicamente modos revisados del entorno aislado como `all` o `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` y backend por agente       | Se permitan únicamente backends revisados del entorno aislado como `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Modo de red del entorno aislado/navegador basado en contenedores | Se deniegue el modo de red del host.                                      |
| `sandbox.containers.denyContainerNamespaceJoin`       | Modo de red del entorno aislado/navegador basado en contenedores | Se deniegue la unión al espacio de nombres de red de otro contenedor.     |
| `sandbox.containers.requireReadOnlyMounts`            | Modo de montaje del entorno aislado/navegador basado en contenedores | Se exija que los montajes sean de solo lectura.                         |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinos de montaje del entorno aislado/navegador basado en contenedores | Se denieguen los montajes de sockets del entorno de ejecución de contenedores. |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura del perfil de seguridad de contenedores              | Se denieguen los perfiles de seguridad de contenedores sin confinamiento.    |
| `sandbox.browser.requireCdpSourceRange`               | Rango de origen CDP del navegador del entorno aislado        | Se exija que la exposición CDP del navegador declare un rango de origen.     |

La política trata la ausencia de `sandbox.mode` como su valor predeterminado
implícito `off`, por lo que `sandbox.requireMode` informa que un entorno aislado
nuevo o sin configurar está fuera de una lista de permitidos como `["all"]`.

#### Gestión de datos

| Campo de política                                   | Estado observado                                                                       | Usar cuando                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                              | Se establezca en `true` para rechazar `logging.redactSensitive: "off"`.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                      | Se establezca en `true` para rechazar la captura de contenido de telemetría.         |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                             | Se establezca en `true` para exigir el modo efectivo de mantenimiento de sesión `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` y `agents.*.memorySearch.experimental.sessionMemory`     | Se establezca en `true` para rechazar la indexación en memoria de transcripciones de sesiones. |

#### Secretos

| Campo de política                    | Estado observado                                               | Usar cuando                                                                      |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders`    | SecretRefs de configuración y declaraciones `secrets.providers.*` | Se establezca en `true` para exigir que las SecretRefs apunten a proveedores declarados. |
| `secrets.denySources`                | Orígenes de proveedores de secretos y de SecretRef             | Se denieguen orígenes como `exec`, `file` u otro nombre de origen configurado.   |
| `secrets.allowInsecureProviders`     | Indicadores de postura insegura de proveedores de secretos     | Se establezca en `false` para rechazar proveedores que opten por una postura insegura. |

#### Aprobaciones de ejecución

Las comprobaciones de aprobaciones de ejecución leen el artefacto de ejecución
`exec-approvals.json`: `~/.openclaw/exec-approvals.json` de forma predeterminada,
o `$OPENCLAW_STATE_DIR/exec-approvals.json` cuando se establece
`OPENCLAW_STATE_DIR`. Las reglas de postura bajo `execApprovals.defaults.*` o
`execApprovals.agents.*` exigen evidencia legible del artefacto; si este falta o
no es válido, se informa como evidencia no observable en lugar de aprobarlo
según el mejor esfuerzo. Una vez que el artefacto es legible, los campos
omitidos heredan los valores predeterminados de ejecución: la ausencia de
`defaults.security` equivale a `full`, y la ausencia de la seguridad del agente
hereda ese valor predeterminado. La evidencia incluye `defaults`, `agents.*`,
`agents.*.allowlist[].pattern`, el `argPattern` opcional, la postura efectiva de
`autoAllowSkills` y el origen de la entrada; nunca la ruta o el token del socket,
`commandText`, `lastUsedCommand`, las rutas resueltas ni las marcas de tiempo.

| Campo de política                              | Estado observado                                                                          | Usar cuando                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                    | Ruta activa de ejecución de `exec-approvals.json`                                         | Se establezca en `true` para exigir que el artefacto de aprobaciones exista y pueda analizarse.     |
| `execApprovals.defaults.allowSecurity`         | `defaults.security`, cuyo valor predeterminado es `full`                                  | Se permitan únicamente modos aprobados de seguridad predeterminada de las aprobaciones.             |
| `execApprovals.agents.allowSecurity`           | `agents.*.security`, que hereda los valores predeterminados                               | Se permitan únicamente modos aprobados de seguridad efectiva de las aprobaciones por agente.        |
| `execApprovals.agents.allowAutoAllowSkills`    | `defaults.autoAllowSkills` y `agents.*.autoAllowSkills`, que heredan los valores predeterminados de ejecución | Se establezca en `false` para exigir listas manuales estrictas de permitidos sin aprobación implícita de la CLI de Skills. |
| `execApprovals.agents.allowlist.expected`      | Patrones agregados de `agents.*.allowlist[]` y entradas opcionales de argPattern          | Se exija que la lista de permitidos de aprobaciones coincida con el conjunto de patrones revisado.  |

Ejemplo: exigir el artefacto de aprobaciones, denegar valores predeterminados
permisivos y permitir únicamente la postura revisada de aprobación de ejecución
para los agentes seleccionados.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Modos de seguridad: "deny", "allowlist" o "full".
      // Este valor predeterminado solo permite la postura restrictiva "deny".
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Los agentes seleccionados pueden usar la postura "allowlist" revisada, pero no "full".
          "allowSecurity": ["allowlist"],
          // false significa que las CLI de Skills deben aparecer en la lista de permitidos revisada en lugar de
          // aprobarse implícitamente mediante autoAllowSkills.
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

| Campo de política               | Estado observado                             | Cuándo usarlo                                                                                         |
| ------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadatos de proveedor y modo de `auth.profiles.*` | Exigir claves de metadatos como `provider` y `mode` en los perfiles de autenticación de la configuración. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Permitir solo modos compatibles de perfiles de autenticación como `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadatos de herramientas

| Campo de política       | Estado observado                    | Cuándo usarlo                                                                                          |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Declaraciones reguladas de `TOOLS.md` | Exigir que las herramientas reguladas declaren claves de metadatos como `risk`, `sensitivity` u `owner`. |

#### Postura de las herramientas

| Campo de política               | Estado observado                                             | Cuándo usarlo                                                                                                            |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `tools.profiles.allow`          | `tools.profile` y `agents.list[].tools.profile`              | Permitir solo identificadores de perfiles de herramientas como `minimal`, `messaging` o `coding`.                        |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` y anulaciones de `tools.fs` por agente | Establecerlo en `true` para exigir una postura de herramientas del sistema de archivos limitada al espacio de trabajo.    |
| `tools.exec.allowSecurity`      | `tools.exec.security` y seguridad de ejecución por agente    | Permitir solo modos de seguridad de ejecución como `deny` o `allowlist`.                                                 |
| `tools.exec.requireAsk`         | `tools.exec.ask` y modo de solicitud de ejecución por agente | Exigir una postura de aprobación como `always`.                                                                          |
| `tools.exec.allowHosts`         | `tools.exec.host` y enrutamiento del host de ejecución por agente | Permitir solo modos de enrutamiento del host de ejecución como `sandbox`.                                             |
| `tools.elevated.allow`          | `tools.elevated.enabled` y postura elevada por agente        | Establecerlo en `false` para exigir que el modo elevado de las herramientas permanezca desactivado.                       |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` y `tools.alsoAllow` por agente             | Exigir entradas exactas de `alsoAllow` e informar de concesiones adicionales de herramientas ausentes o inesperadas.     |
| `tools.denyTools`               | `tools.deny` y `agents.list[].tools.deny`                    | Exigir que las listas de denegación de herramientas configuradas incluyan identificadores o grupos como `group:runtime` y `group:fs`. |

## Ejecutar comprobaciones

Ejecute comprobaciones exclusivamente de políticas durante la creación:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` ejecuta únicamente el conjunto de comprobaciones de políticas y emite evidencias, hallazgos
y hashes de atestación. Los mismos hallazgos también aparecen en
`openclaw doctor --lint` cuando el Plugin Policy está habilitado.

Compare un archivo de políticas del operador con una referencia creada:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` compara la sintaxis de un archivo de políticas con la sintaxis de otro archivo de políticas; no
inspecciona el estado en tiempo de ejecución, las evidencias, las credenciales ni los secretos. Usa los mismos
metadatos de reglas que rigen las superposiciones con ámbito: las listas de permitidos deben permanecer iguales o
ser más restrictivas, las listas de denegación deben permanecer iguales o ser más amplias, los booleanos obligatorios deben conservar
su valor, las cadenas ordenadas solo pueden desplazarse hacia el extremo más estricto del
orden configurado y las listas exactas deben coincidir. La referencia puede ser una
política creada por la organización; la política comprobada puede añadir valores más estrictos o
reglas adicionales. Una regla de nivel superior de la política comprobada puede satisfacer una regla de referencia con ámbito cuando
sea igual o más restrictiva. No es necesario que los nombres de los ámbitos coincidan entre
los archivos; la comparación se indexa por selector (`agentIds`/`channelIds`) y campo.

Comparación sin hallazgos (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

La salida sin hallazgos de `policy check --json` incluye hashes estables que un operador o
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

La configuración de la política se encuentra en `plugins.entries.policy.config`.

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

| Ajuste                    | Propósito                                                                    |
| ------------------------- | ---------------------------------------------------------------------------- |
| `enabled`                 | Habilitar las comprobaciones de políticas incluso antes de que exista `policy.jsonc`. |
| `workspaceRepairs`        | Permitir que `doctor --fix` edite ajustes del espacio de trabajo gestionados por políticas. |
| `expectedHash`            | Bloqueo opcional mediante hash para el artefacto de política aprobado.        |
| `expectedAttestationHash` | Bloqueo opcional mediante hash para la última comprobación de política sin hallazgos aceptada. |
| `path`                    | Ubicación del artefacto de política relativa al espacio de trabajo.          |

Establezca `plugins.entries.policy.config.enabled` en `false` para deshabilitar las comprobaciones de
políticas en un espacio de trabajo sin desinstalar el Plugin.

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
`workspace.hash` identifica esa carga de evidencias. `findingsHash` identifica
el conjunto exacto de hallazgos. `checkedAt` registra cuándo se ejecutó la comprobación.
`attestationHash` identifica la declaración estable (hash de la política, hash de las evidencias,
hash de los hallazgos y estado sin/con hallazgos) y excluye deliberadamente `checkedAt`,
por lo que el mismo estado de política siempre produce el mismo hash de atestación. En conjunto,
estos cuatro valores forman la tupla de auditoría de una comprobación de política.

Si un Gateway o supervisor usa la política para bloquear, aprobar o anotar una
acción en tiempo de ejecución, debe registrar el hash de atestación de la última comprobación
sin hallazgos. `checkedAt` permanece en la salida JSON para los registros de auditoría, pero no forma parte del
hash estable.

Ciclo de vida para aceptar el estado de la política:

1. Cree o revise `policy.jsonc`.
2. Ejecute `openclaw policy check --json`.
3. Si no hay hallazgos, registre `attestation.policy.hash` como `expectedHash`.
4. Registre `attestation.attestationHash` como `expectedAttestationHash`.
5. Vuelva a ejecutar `openclaw doctor --lint` en las puertas de CI o de publicación.

Si las reglas de política cambian intencionadamente, actualice ambos hashes aceptados a partir de una
comprobación limpia. Si solo cambia la configuración del espacio de trabajo (la política permanece igual),
normalmente solo cambia `expectedAttestationHash`.

Habilitar o actualizar las reglas de `agents.workspace` añade evidencia de `agentWorkspace`
al hash del espacio de trabajo y al hash de atestación; revise la nueva evidencia y
actualice los hashes de atestación aceptados después de habilitarlas. Habilitar o actualizar
las reglas de postura de herramientas añade evidencia de `toolPosture` del mismo modo.

`openclaw policy watch` vuelve a ejecutar la comprobación e informa cuando la evidencia actual ya no
coincide con `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Use `--once` en CI o en scripts que necesiten una única evaluación de desviación. Sin
`--once`, consulta cada dos segundos de forma predeterminada; use `--interval-ms` para cambiar
el intervalo.

## Hallazgos

| Id. de comprobación                                      | Hallazgo                                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La política está habilitada, pero falta `policy.jsonc`.                                              |
| `policy/policy-jsonc-invalid`                            | La política no se puede analizar o contiene entradas de reglas con formato incorrecto.               |
| `policy/policy-hash-mismatch`                            | La política no coincide con el `expectedHash` configurado.                                           |
| `policy/attestation-hash-mismatch`                       | La evidencia de política actual ya no coincide con la atestación aceptada.                            |
| `policy/policy-conformance-invalid`                      | Un archivo de política de referencia o comprobado tiene una sintaxis de comparación no válida.       |
| `policy/policy-conformance-missing`                      | A un archivo de política comprobado le falta una regla requerida por el archivo de política base.     |
| `policy/policy-conformance-weaker`                       | Un archivo de política comprobado tiene un valor menos restrictivo que el archivo de política base.   |
| `policy/channels-denied-provider`                        | Un canal habilitado coincide con una regla de denegación de canales.                                  |
| `policy/mcp-denied-server`                               | La política deniega un servidor MCP configurado.                                                      |
| `policy/mcp-unapproved-server`                           | Un servidor MCP configurado no está en la lista de permitidos.                                       |
| `policy/models-denied-provider`                          | Un proveedor de modelos o una referencia de modelo configurados utilizan un proveedor denegado.       |
| `policy/models-unapproved-provider`                      | Un proveedor de modelos o una referencia de modelo configurados no están en la lista de permitidos.   |
| `policy/network-private-access-enabled`                  | Está habilitado un mecanismo de escape de SSRF para redes privadas cuando la política lo deniega.      |
| `policy/ingress-dm-policy-unapproved`                    | Una política de mensajes directos de un canal no está en la lista de permitidos de la política.        |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` no coincide con el ámbito de aislamiento de mensajes directos exigido por la política. |
| `policy/ingress-open-groups-denied`                      | Una política de grupos de un canal es `open` mientras la política deniega la entrada de grupos abiertos. |
| `policy/ingress-group-mention-required`                  | Una entrada de canal o grupo deshabilita los controles de menciones cuando la política los exige.     |
| `policy/gateway-non-loopback-bind`                       | La postura de enlace del Gateway permite la exposición fuera de loopback cuando la política la deniega. |
| `policy/gateway-auth-disabled`                           | La autenticación del Gateway está deshabilitada cuando la política exige autenticación.               |
| `policy/gateway-rate-limit-missing`                      | La postura de limitación de frecuencia de autenticación del Gateway no es explícita cuando la política lo exige. |
| `policy/gateway-control-ui-insecure`                     | Están habilitadas las opciones de exposición insegura de la interfaz de control del Gateway.          |
| `policy/gateway-tailscale-funnel`                        | La exposición mediante Tailscale Funnel del Gateway está habilitada cuando la política la deniega.    |
| `policy/gateway-remote-enabled`                          | El modo remoto del Gateway está activo cuando la política lo deniega.                                 |
| `policy/gateway-http-endpoint-enabled`                   | Un punto de conexión de la API HTTP del Gateway está habilitado aunque la política lo deniega.         |
| `policy/gateway-http-url-fetch-unrestricted`             | La entrada de obtención de URL mediante HTTP del Gateway carece de una lista de URL permitidas obligatoria. |
| `policy/gateway-node-command-denied`                     | Un comando de Node denegado por la política no está denegado por la configuración de OpenClaw.        |
| `policy/agents-workspace-access-denied`                  | El modo de entorno aislado del agente o el acceso al espacio de trabajo no están en la lista de permitidos de la política. |
| `policy/agents-tool-not-denied`                          | La configuración de un agente o la predeterminada no deniega una herramienta que la política exige denegar. |
| `policy/tools-profile-unapproved`                        | Un perfil de herramientas global o por agente configurado no está en la lista de permitidos.          |
| `policy/tools-fs-workspace-only-required`                | Las herramientas del sistema de archivos no están configuradas con una postura de rutas limitada al espacio de trabajo. |
| `policy/tools-exec-security-unapproved`                  | El modo de seguridad de ejecución no está en la lista de permitidos de la política.                    |
| `policy/tools-exec-ask-unapproved`                       | El modo de solicitud de ejecución no está en la lista de permitidos de la política.                    |
| `policy/tools-exec-host-unapproved`                      | El enrutamiento del host de ejecución no está en la lista de permitidos de la política.                |
| `policy/tools-elevated-enabled`                          | El modo de herramientas con privilegios elevados está habilitado cuando la política lo deniega.       |
| `policy/tools-also-allow-missing`                        | A una lista `alsoAllow` configurada le falta una entrada exigida por la política.                      |
| `policy/tools-also-allow-unexpected`                     | Una lista `alsoAllow` configurada incluye una entrada no prevista por la política.                     |
| `policy/tools-required-deny-missing`                     | Una lista de herramientas denegadas global o por agente no incluye una herramienta que debe denegarse. |
| `policy/sandbox-mode-unapproved`                         | El modo de entorno aislado no está en la lista de permitidos de la política.                           |
| `policy/sandbox-backend-unapproved`                      | El backend del entorno aislado no está en la lista de permitidos de la política.                       |
| `policy/sandbox-container-posture-unobservable`          | Hay una regla de postura de contenedor habilitada para un backend que no puede observarla.             |
| `policy/sandbox-container-host-network-denied`           | Un entorno aislado o navegador basado en contenedores utiliza el modo de red del host.                 |
| `policy/sandbox-container-namespace-join-denied`         | Un entorno aislado o navegador basado en contenedores se une al espacio de nombres de otro contenedor. |
| `policy/sandbox-container-mount-mode-required`           | Un montaje de un entorno aislado o navegador basado en contenedores no es de solo lectura.             |
| `policy/sandbox-container-runtime-socket-mount`          | Un montaje de un entorno aislado o navegador basado en contenedores expone el socket del runtime de contenedores. |
| `policy/sandbox-container-unconfined-profile`            | El perfil del entorno aislado de contenedores no está confinado cuando la política lo deniega.         |
| `policy/sandbox-browser-cdp-source-range-missing`        | Falta el intervalo de origen de CDP del navegador del entorno aislado cuando la política exige uno.    |
| `policy/data-handling-redaction-disabled`                | La ocultación de datos sensibles en los registros está deshabilitada cuando la política la exige.     |
| `policy/data-handling-telemetry-content-capture`         | La captura de contenido de telemetría está habilitada cuando la política la deniega.                   |
| `policy/data-handling-session-retention-not-enforced`    | El mantenimiento de retención de sesiones no se aplica cuando la política lo exige.                   |
| `policy/data-handling-session-transcript-memory-enabled` | La indexación en memoria de las transcripciones de sesión está habilitada cuando la política la deniega. |
| `policy/secrets-unmanaged-provider`                      | Un SecretRef de configuración hace referencia a un proveedor no declarado en `secrets.providers`.     |
| `policy/secrets-denied-provider-source`                  | Un proveedor de secretos de configuración o SecretRef utiliza un origen denegado por la política.     |
| `policy/secrets-insecure-provider`                       | Un proveedor de secretos habilita una postura insegura cuando la política la deniega.                  |
| `policy/auth-profile-invalid-metadata`                   | A un perfil de autenticación de configuración le faltan metadatos válidos del proveedor o del modo.    |
| `policy/auth-profile-unapproved-mode`                    | El modo de un perfil de autenticación de configuración no está en la lista de permitidos de la política. |
| `policy/exec-approvals-missing`                          | La política exige `exec-approvals.json`, pero falta el artefacto.                                     |
| `policy/exec-approvals-invalid`                          | El artefacto de aprobaciones de ejecución configurado no se puede analizar.                            |
| `policy/exec-approvals-default-security-unapproved`      | Los valores predeterminados de aprobación de ejecución utilizan un modo de seguridad que no está en la lista de permitidos de la política. |
| `policy/exec-approvals-agent-security-unapproved`        | El modo de seguridad efectivo de aprobación de ejecución por agente no está en la lista de permitidos. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agente de aprobación de ejecución permite automáticamente de forma implícita las CLI de Skills cuando la política lo deniega. |
| `policy/exec-approvals-allowlist-missing`                | A la lista de aprobaciones permitidas le falta un patrón exigido por la política.                      |
| `policy/exec-approvals-allowlist-unexpected`             | La lista de aprobaciones permitidas incluye un patrón no previsto por la política.                     |
| `policy/tools-missing-risk-level`                        | A una declaración de herramienta sujeta a gobernanza le faltan metadatos de riesgo.                   |
| `policy/tools-unknown-risk-level`                        | Una declaración de herramienta sujeta a gobernanza utiliza un valor de riesgo desconocido.            |
| `policy/tools-missing-sensitivity-token`                 | A una declaración de herramienta sujeta a gobernanza le faltan metadatos de sensibilidad.             |
| `policy/tools-missing-owner`                             | A una declaración de herramienta sujeta a gobernanza le faltan metadatos del propietario.             |
| `policy/tools-unknown-sensitivity-token`                 | Una declaración de herramienta sujeta a gobernanza utiliza un valor de sensibilidad desconocido.      |

Un hallazgo puede incluir tanto `target` (el elemento observado del espacio de trabajo que
no cumple) como `requirement` (la regla definida que hizo que se considerara un hallazgo).
Actualmente, ambos son cadenas de direcciones `oc://`, pero los nombres de los campos describen la
función en la política en lugar del formato de la dirección.

Ejemplos de hallazgos:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "El canal 'telegram' utiliza el proveedor denegado 'telegram'.",
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
  "message": "La configuración de red 'browser-private-network' permite el acceso a la red privada.",
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
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Añada 'system.run' a gateway.nodes.denyCommands o actualice la política después de revisarla."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "El workspaceAccess 'rw' del entorno aislado de agents.defaults no está permitido por la política.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparación

`doctor --lint` y `policy check` son de solo lectura.

`doctor --fix` solo edita la configuración del espacio de trabajo administrada por la política cuando
`workspaceRepairs` está habilitado explícitamente; de lo contrario, las comprobaciones informan de lo que
repararían y dejan la configuración sin cambios.

En esta versión, la reparación puede deshabilitar los canales denegados por `channels.denyRules` y
aplicar las reparaciones automáticas de restricción que se indican a continuación. Habilite `workspaceRepairs`
solo después de revisar el archivo de política, ya que una regla válida puede cambiar
la configuración del espacio de trabajo:

- establecer `tools.elevated.enabled=false` cuando una política global prohíba las herramientas con privilegios elevados
- añadir los id de herramientas cuya denegación es obligatoria y que falten a `tools.deny` o
  `agents.list[].tools.deny` cuando la política exija que esas herramientas se denieguen
- establecer los conmutadores inseguros de `gateway.controlUi.*` en `false`
- establecer `gateway.mode=local` cuando la política deniegue el modo remoto del Gateway
- establecer en `false` las rutas `gateway.http.endpoints.*.enabled` informadas cuando la política
  deniegue los puntos de conexión de la API HTTP del Gateway
- establecer en `allowlist` las rutas `groupPolicy` informadas para la entrada de canales cuando la política
  deniegue la entrada abierta de grupos
- establecer en `true` las rutas `requireMention` informadas para la entrada de canales cuando la política
  exija menciones en los grupos
- establecer `logging.redactSensitive=tools` cuando la política exija la ocultación de
  datos sensibles en los registros
- establecer `diagnostics.otel.captureContent=false`, o
  `diagnostics.otel.captureContent.enabled=false` para la configuración de captura de telemetría
  expresada como objeto, cuando la política deniegue la captura de contenido de telemetría

Las reparaciones de herramientas con privilegios elevados y alcance limitado son solo de detección. Las reparaciones de tratamiento de datos con alcance limitado
también se omiten cuando el hallazgo informa sobre una configuración compartida de registros o telemetría,
porque cambiar la configuración compartida afectaría a más elementos que el objetivo de la política con
alcance limitado.

Las reparaciones de denegación obligatoria con alcance limitado se omiten cuando el hallazgo informa sobre
`tools.deny` heredado de la raíz, porque añadir la herramienta obligatoria a la configuración raíz afectaría
a más elementos que el objetivo de la política con alcance limitado. Las reparaciones de denegación obligatoria locales del agente pueden actualizar
la ruta `agents.list[].tools.deny` informada.

Las reparaciones de entrada de canales con alcance limitado se omiten cuando el hallazgo informa sobre
`channels.defaults.*` heredado, porque cambiar el valor predeterminado compartido del canal afectaría
a más elementos que el objetivo de la política con alcance limitado. Los hallazgos de la lista de permitidos
para la obtención de URL mediante HTTP del Gateway siguen requiriendo intervención manual porque la reparación automática no puede elegir los valores correctos
de la lista de URL permitidas para el punto de conexión.

Los hallazgos relacionados con el enlace y los comandos de Node del Gateway siguen requiriendo revisión. Cuando
`policy/gateway-non-loopback-bind` o `policy/gateway-node-command-denied`
pueden asignarse a una ruta de configuración, `doctor --fix` informa del cambio propuesto en
`gateway.bind` o `gateway.nodes.denyCommands` como orientación de vista previa omitida.
No aplica el cambio, y el hallazgo no se considera reparado hasta que un operador
revise y actualice la configuración o la política.

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
| `policy check`   | No hay hallazgos en el umbral.                          | Uno o más hallazgos alcanzaron el umbral.                             | Fallo de argumentos o de ejecución. |
| `policy compare` | El archivo de política es al menos tan estricto como la referencia. | El archivo de política no es válido, falta o es menos estricto que las reglas de referencia. | Fallo de argumentos o de ejecución. |
| `policy watch`   | No hay hallazgos y el hash aceptado está actualizado.              | Existen hallazgos o la certificación aceptada está obsoleta.                    | Fallo de argumentos o de ejecución. |

## Contenido relacionado

- [Modo lint de Doctor](/es/cli/doctor#lint-mode)
- [CLI de rutas](/es/cli/path)
