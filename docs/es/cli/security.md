---
read_when:
    - Quieres realizar una auditoría de seguridad rápida de la configuración y el estado
    - Quiere aplicar sugerencias de «corrección» seguras (permisos, reforzar los valores predeterminados)
summary: Referencia de la CLI para `openclaw security` (auditar y corregir errores comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-07-22T10:29:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b5f9ea5cb746bfd29ff4d096062e81595abe99a883fc3b1113b45a3527d42d9
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Herramientas de seguridad: auditoría y correcciones seguras opcionales. Relacionado: [Seguridad](/es/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Modos de auditoría

La ejecución normal de `security audit` permanece en la ruta en frío de configuración/sistema de archivos/solo lectura: no detecta los recopiladores de seguridad del entorno de ejecución de los plugins, por lo que las auditorías rutinarias no cargan el entorno de ejecución de todos los plugins instalados. `--deep` añade sondeos en vivo del Gateway mediante el mejor esfuerzo y recopiladores de auditoría de seguridad propiedad de los plugins (los llamadores internos explícitos también pueden optar por esos recopiladores cuando ya disponen de un ámbito de entorno de ejecución adecuado).

Si la autenticación por contraseña del Gateway solo se proporciona durante el inicio, pase el mismo valor mediante `--auth password --password <password>` para que la auditoría pueda comprobarlo con respecto a `hooks.token`.

## Qué comprueba

**Modelo de mensajes directos/confianza**

- Advierte cuando varios remitentes de mensajes directos comparten la sesión principal y recomienda el modo seguro de mensajes directos: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales con varias cuentas) en bandejas de entrada compartidas. Esto refuerza la seguridad para la cooperación y las bandejas de entrada compartidas, pero no proporciona aislamiento entre operadores que no confían mutuamente; separe los límites de confianza mediante gateways independientes (o usuarios del sistema operativo o hosts distintos).
- Emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere un acceso probable de varios usuarios (por ejemplo, una política abierta de mensajes directos/grupos, destinos de grupo configurados o reglas de remitentes con comodines): el modelo de confianza predeterminado de OpenClaw es el de un asistente personal (un operador), no el aislamiento multiinquilino en entornos hostiles. Para configuraciones compartidas intencionalmente entre varios usuarios: aísle todas las sesiones en entornos sandbox, mantenga el acceso al sistema de archivos limitado al espacio de trabajo y no incluya identidades ni credenciales personales o privadas en ese entorno de ejecución.
- Advierte cuando se utilizan modelos pequeños (parámetros `<=300B`) sin aislamiento en un entorno sandbox y con las herramientas web/navegador habilitadas.

**Webhook/hooks**

El inicio registra una advertencia de seguridad no fatal y la auditoría señala la reutilización de `hooks.token` en valores activos de autenticación mediante secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). También advierte cuando:

- `hooks.token` es corto
- `hooks.path="/"`
- `hooks.defaultSessionKey` no está definido
- `hooks.allowedAgentIds` no está restringido
- están habilitadas las sobrescrituras de `sessionKey` de las solicitudes
- están habilitadas las sobrescrituras sin `hooks.allowedSessionKeyPrefixes`

Ejecute `openclaw doctor --fix` para rotar un `hooks.token` reutilizado y persistido; después, actualice los remitentes de hooks externos para que utilicen el nuevo token.

**Entorno sandbox/herramientas**

- Advierte cuando se configuran ajustes de Docker para el entorno sandbox mientras el modo sandbox está desactivado.
- Advierte cuando `gateway.nodes.commands.deny` utiliza entradas desconocidas o con apariencia de patrón que no tienen efecto (la coincidencia se realiza únicamente con el nombre exacto del comando del Node, no mediante el filtrado del texto del shell).
- Advierte cuando `gateway.nodes.commands.allow` habilita explícitamente comandos peligrosos del Node.
- Advierte cuando los perfiles de herramientas de los agentes sobrescriben el valor global de `tools.profile="minimal"`.
- Advierte cuando las herramientas de escritura/edición están deshabilitadas, pero `exec` sigue disponible sin un límite restrictivo del sistema de archivos del entorno sandbox.
- Advierte cuando los mensajes directos o grupos abiertos exponen herramientas del entorno de ejecución/sistema de archivos sin protecciones de entorno sandbox/espacio de trabajo.
- Advierte cuando las herramientas de los plugins instalados pueden estar accesibles debido a una política de herramientas permisiva.

**Navegador del entorno sandbox**

- Advierte cuando el navegador del entorno sandbox utiliza la red `bridge` de Docker sin `sandbox.browser.cdpSourceRange`.
- Señala modos de red peligrosos de Docker para el entorno sandbox, incluidas las uniones de espacios de nombres `host` y `container:*`.
- Advierte cuando los contenedores Docker existentes del navegador del entorno sandbox tienen etiquetas hash ausentes u obsoletas (por ejemplo, contenedores anteriores a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.

**Red/detección**

- Señala `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados).
- Señala `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
- Advierte cuando `gateway.auth.mode="none"` deja accesibles las API HTTP del Gateway sin un secreto compartido (`/tools/invoke` y cualquier endpoint `/v1/*` habilitado).

**Plugins/canales**

- Advierte cuando los registros de instalación de plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o no coinciden con las versiones de los paquetes instalados actualmente.
- Advierte cuando las listas de permitidos de los canales dependen de nombres/correos electrónicos/etiquetas mutables en lugar de identificadores estables (ámbitos de Discord, Slack, Google Chat, Microsoft Teams, Mattermost e IRC cuando corresponda).

Los ajustes con el prefijo `dangerous`/`dangerously` son sobrescrituras explícitas de emergencia para el operador; habilitar una de ellas no constituye por sí solo un informe de vulnerabilidad de seguridad. Para consultar el inventario completo de parámetros peligrosos, consulte «Resumen de indicadores inseguros o peligrosos» en [Seguridad](/es/gateway/security).

## Comportamiento de SecretRef

`security audit` resuelve los SecretRefs compatibles en modo de solo lectura para sus rutas de destino. Si un SecretRef no está disponible en la ruta del comando actual, la auditoría continúa e informa de `secretDiagnostics` en lugar de bloquearse. `--token` y `--password` solo sobrescriben la autenticación del sondeo exhaustivo para esa invocación del comando; no reescriben la configuración ni las asignaciones de SecretRef.

## Supresiones

Acepte los hallazgos persistentes intencionales mediante `security.audit.suppressions`. Cada supresión coincide con un `checkId` exacto y puede limitarse mediante las subcadenas `titleIncludes` o `detailIncludes`, o ambas, sin distinguir entre mayúsculas y minúsculas:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Los hallazgos suprimidos se eliminan de la lista activa de `summary` y `findings`. La salida JSON los conserva en `suppressedFindings` para facilitar la auditoría. Cuando se configuran supresiones, la salida activa también conserva un hallazgo informativo no suprimible de `security.audit.suppressions.active` para que los lectores puedan saber que la auditoría se filtró. Los indicadores de configuración peligrosos se emiten como un hallazgo por indicador, por lo que aceptar un indicador peligroso no oculta otros indicadores habilitados que compartan el mismo checkId `config.insecure_or_dangerous_flags`.

Como las supresiones pueden ocultar riesgos persistentes, añadirlas o eliminarlas mediante comandos de shell ejecutados por el agente requiere la aprobación de ejecución, salvo que la ejecución ya esté activa con `security="full"` y `ask="off"` para una automatización local de confianza.

## Salida JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Con `--fix --json`, la salida incluye tanto las acciones de corrección como el informe final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Qué cambia `--fix`

Aplica correcciones seguras y deterministas:

- cambia los valores comunes de `groupPolicy="open"` a `groupPolicy="allowlist"` (incluidas las variantes de cuenta en los canales compatibles)
- cuando la política de grupos de WhatsApp cambia a `allowlist`, rellena `groupAllowFrom` a partir del archivo almacenado `allowFrom` cuando existe esa lista y la configuración aún no define `allowFrom`
- cambia `logging.redactSensitive` de `"off"` a `"tools"`
- restringe los permisos de los archivos de estado/configuración y los archivos confidenciales comunes (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` y los artefactos de sesión heredados)
- también restringe los permisos de los archivos de inclusión de configuración a los que hace referencia `openclaw.json`
- utiliza `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves de API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia las opciones de enlace/autenticación/exposición de red del Gateway
- elimina ni reescribe plugins/Skills

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
