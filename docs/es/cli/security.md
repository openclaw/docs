---
read_when:
    - Quiere realizar una auditoría rápida de seguridad de la configuración y el estado
    - Se desea aplicar sugerencias de «corrección» seguras (permisos, valores predeterminados más estrictos)
summary: Referencia de la CLI para `openclaw security` (auditar y corregir errores comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-07-12T14:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Herramientas de seguridad: auditoría más correcciones seguras opcionales. Relacionado: [Seguridad](/es/gateway/security).

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

`security audit` sin opciones permanece en la ruta de configuración/sistema de archivos de inicio en frío y solo lectura: no detecta recopiladores de seguridad del entorno de ejecución de los plugins, por lo que las auditorías rutinarias no cargan el entorno de ejecución de cada plugin instalado. `--deep` añade sondeos en vivo del Gateway con el máximo esfuerzo posible y recopiladores de auditoría de seguridad gestionados por los plugins (los llamadores internos explícitos también pueden optar por usar esos recopiladores cuando ya disponen de un ámbito de entorno de ejecución adecuado).

Si la autenticación por contraseña del Gateway se proporciona solo al inicio, pase el mismo valor mediante `--auth password --password <password>` para que la auditoría pueda compararlo con `hooks.token`.

## Qué comprueba

**Modelo de mensajes directos/confianza**

- Advierte cuando varios remitentes de mensajes directos comparten la sesión principal y recomienda el modo seguro de mensajes directos: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales con varias cuentas) en bandejas de entrada compartidas. Esto refuerza la seguridad de entornos cooperativos o con bandejas de entrada compartidas; no proporciona aislamiento entre operadores que no confían entre sí. Para ello, separe los límites de confianza mediante gateways independientes (o usuarios/sistemas operativos o hosts independientes).
- Emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere una probable entrada de usuarios compartidos (por ejemplo, una política abierta de mensajes directos/grupos, destinos de grupo configurados o reglas de remitentes con comodines): el modelo de confianza predeterminado de OpenClaw es el de un asistente personal (un operador), no el aislamiento multiinquilino frente a actores hostiles. En configuraciones intencionadas con usuarios compartidos: ejecute todas las sesiones en un entorno aislado, limite el acceso al sistema de archivos al espacio de trabajo y no incluya identidades ni credenciales personales o privadas en ese entorno de ejecución.
- Advierte cuando se utilizan modelos pequeños (parámetros `<=300B`) sin aislamiento y con las herramientas web/navegador habilitadas.

**Webhook/hooks**

Al iniciarse, registra una advertencia de seguridad no fatal, y la auditoría marca la reutilización en `hooks.token` de valores activos de autenticación mediante secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). También advierte cuando:

- `hooks.token` es corto
- `hooks.path="/"`
- `hooks.defaultSessionKey` no está definido
- `hooks.allowedAgentIds` no tiene restricciones
- están habilitadas las sustituciones de `sessionKey` de las solicitudes
- las sustituciones están habilitadas sin `hooks.allowedSessionKeyPrefixes`

Ejecute `openclaw doctor --fix` para rotar un `hooks.token` persistido y reutilizado; después, actualice los remitentes de hooks externos para que utilicen el nuevo token.

**Entorno aislado/herramientas**

- Advierte cuando se configuran ajustes de Docker del entorno aislado mientras el modo de entorno aislado está desactivado.
- Advierte cuando `gateway.nodes.denyCommands` utiliza entradas desconocidas o similares a patrones que no tienen efecto (la coincidencia se realiza únicamente con el nombre exacto del comando del nodo, no mediante el filtrado de texto del shell).
- Advierte cuando `gateway.nodes.allowCommands` habilita explícitamente comandos de nodo peligrosos.
- Advierte cuando los perfiles de herramientas de los agentes sustituyen el valor global `tools.profile="minimal"`.
- Advierte cuando las herramientas de escritura/edición están deshabilitadas, pero `exec` sigue disponible sin un límite restrictivo del sistema de archivos del entorno aislado.
- Advierte cuando los mensajes directos o grupos abiertos exponen herramientas del entorno de ejecución/sistema de archivos sin protecciones de entorno aislado/espacio de trabajo.
- Advierte cuando las herramientas de plugins instalados pueden ser accesibles con una política de herramientas permisiva.

**Navegador del entorno aislado**

- Advierte cuando el navegador del entorno aislado utiliza la red `bridge` de Docker sin `sandbox.browser.cdpSourceRange`.
- Marca los modos peligrosos de red de Docker del entorno aislado, incluidas las uniones a espacios de nombres `host` y `container:*`.
- Advierte cuando los contenedores Docker existentes del navegador del entorno aislado tienen etiquetas hash ausentes u obsoletas (por ejemplo, contenedores anteriores a la migración que no tienen `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.

**Red/detección**

- Marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de cabeceras si los proxies están mal configurados).
- Marca `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
- Advierte cuando `gateway.auth.mode="none"` deja accesibles las API HTTP del Gateway sin un secreto compartido (`/tools/invoke` y cualquier endpoint `/v1/*` habilitado).

**Plugins/canales**

- Advierte cuando los registros de instalación de plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o difieren de las versiones de los paquetes instalados actualmente.
- Advierte cuando las listas de permitidos de los canales dependen de nombres/correos electrónicos/etiquetas modificables en lugar de identificadores estables (Discord, Slack, Google Chat, Microsoft Teams, ámbitos de Mattermost e IRC cuando corresponda).

Los ajustes con el prefijo `dangerous`/`dangerously` son anulaciones explícitas de emergencia para el operador; habilitar uno no constituye, por sí solo, un informe de vulnerabilidad de seguridad. Para consultar el inventario completo de parámetros peligrosos, véase «Resumen de indicadores inseguros o peligrosos» en [Seguridad](/es/gateway/security).

## Comportamiento de SecretRef

`security audit` resuelve las SecretRefs compatibles en modo de solo lectura para las rutas objetivo. Si una SecretRef no está disponible en la ruta del comando actual, la auditoría continúa e informa de `secretDiagnostics` en lugar de bloquearse. `--token` y `--password` solo anulan la autenticación del sondeo profundo para esa invocación del comando; no reescriben la configuración ni las asignaciones de SecretRef.

## Supresiones

Acepte los hallazgos persistentes intencionales con `security.audit.suppressions`. Cada supresión coincide con un `checkId` exacto y puede restringirse mediante las subcadenas `titleIncludes` y/o `detailIncludes`, sin distinción entre mayúsculas y minúsculas:

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

Los hallazgos suprimidos se eliminan del `summary` activo y de la lista `findings`. La salida JSON los conserva en `suppressedFindings` para facilitar la auditoría. Cuando se configuran supresiones, la salida activa también conserva un hallazgo informativo no suprimible `security.audit.suppressions.active` para que los lectores puedan saber que la auditoría se filtró. Las marcas de configuración peligrosas se emiten individualmente, una por hallazgo, por lo que aceptar una marca peligrosa no oculta otras marcas habilitadas que comparten el mismo checkId `config.insecure_or_dangerous_flags`.

Dado que las supresiones pueden ocultar riesgos persistentes, añadirlas o eliminarlas mediante comandos de shell ejecutados por el agente requiere aprobación de ejecución, salvo que la ejecución ya se realice con `security="full"` y `ask="off"` para automatización local de confianza.

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

- cambia los valores habituales de `groupPolicy="open"` a `groupPolicy="allowlist"` (incluidas las variantes de cuenta en los canales compatibles)
- cuando la política de grupo de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` a partir del archivo `allowFrom` almacenado si esa lista existe y la configuración aún no define `allowFrom`
- cambia `logging.redactSensitive` de `"off"` a `"tools"`
- restringe los permisos del estado, la configuración y los archivos confidenciales habituales (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` y los artefactos de sesión heredados)
- también restringe los archivos de inclusión de configuración referenciados desde `openclaw.json`
- utiliza `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no**:

- rota tokens, contraseñas ni claves de API
- desactiva herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia las opciones de vinculación, autenticación ni exposición de red del Gateway
- elimina ni reescribe plugins ni Skills

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
