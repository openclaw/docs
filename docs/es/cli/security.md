---
read_when:
    - Quieres ejecutar una auditoría de seguridad rápida en la configuración y el estado
    - Quieres aplicar sugerencias de "fix" seguras (permisos, ajustar valores predeterminados)
summary: Referencia de CLI para `openclaw security` (auditar y corregir errores comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-06-27T11:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Herramientas de seguridad (auditoría + correcciones opcionales).

Relacionado:

- Guía de seguridad: [Seguridad](/es/gateway/security)

## Auditoría

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

`security audit` sin opciones permanece en la ruta fría de configuración/sistema de archivos/solo lectura. No descubre recopiladores de seguridad del tiempo de ejecución de plugins de forma predeterminada, por lo que las auditorías rutinarias no cargan todos los tiempos de ejecución de plugins instalados. Usa `--deep` para incluir sondeos activos de Gateway de mejor esfuerzo y recopiladores de auditoría de seguridad propiedad de plugins; los llamadores internos explícitos también pueden optar por esos recopiladores propiedad de plugins cuando ya tienen un ámbito de tiempo de ejecución adecuado.

La auditoría advierte cuando varios remitentes de DM comparten la sesión principal y recomienda el **modo DM seguro**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales multicuenta) para bandejas de entrada compartidas.
Esto sirve para reforzar bandejas de entrada cooperativas/compartidas. No se recomienda una configuración en la que un único Gateway sea compartido por operadores mutuamente no confiables/adversarios; divide los límites de confianza con gateways separados (o usuarios/hosts de SO separados).
También emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere ingreso probable de usuarios compartidos (por ejemplo, política abierta de DM/grupo, destinos de grupo configurados o reglas de remitente comodín), y recuerda que OpenClaw usa de forma predeterminada un modelo de confianza de asistente personal.
Para configuraciones intencionales de usuarios compartidos, la guía de auditoría es aislar todas las sesiones en sandbox, mantener el acceso al sistema de archivos limitado al workspace y mantener identidades o credenciales personales/privadas fuera de ese tiempo de ejecución.
También advierte cuando se usan modelos pequeños (`<=300B`) sin sandboxing y con herramientas web/navegador habilitadas.
Para el ingreso por Webhook, el arranque registra una advertencia de seguridad no fatal y la auditoría marca la reutilización en `hooks.token` de valores activos de autenticación de secreto compartido de Gateway, incluidos `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` y `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. También advierte cuando:

- `hooks.token` es corto
- `hooks.path="/"`
- `hooks.defaultSessionKey` no está definido
- `hooks.allowedAgentIds` no tiene restricciones
- las sobrescrituras de `sessionKey` en solicitudes están habilitadas
- las sobrescrituras están habilitadas sin `hooks.allowedSessionKeyPrefixes`

Si la autenticación por contraseña de Gateway se proporciona solo en el arranque, pasa el mismo valor a `openclaw security audit --auth password --password <password>` para que la auditoría pueda compararlo con `hooks.token`.
Ejecuta `openclaw doctor --fix` para rotar un `hooks.token` persistido y reutilizado; después actualiza los remitentes externos de hooks para que usen el nuevo token de hook.

También advierte cuando la configuración de Docker del sandbox está configurada mientras el modo sandbox está desactivado, cuando `gateway.nodes.denyCommands` usa entradas ineficaces similares a patrones o desconocidas (solo coincidencia exacta de nombres de comando de nodo, no filtrado de texto de shell), cuando `gateway.nodes.allowCommands` habilita explícitamente comandos de nodo peligrosos, cuando `tools.profile="minimal"` global es sobrescrito por perfiles de herramientas de agente, cuando las herramientas de escritura/edición están deshabilitadas pero `exec` sigue disponible sin un límite restrictivo de sistema de archivos de sandbox, cuando DM o grupos abiertos exponen herramientas de tiempo de ejecución/sistema de archivos sin protecciones de sandbox/workspace, y cuando las herramientas de plugins instalados pueden estar accesibles con una política de herramientas permisiva.
También marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados) y `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
También advierte cuando el navegador del sandbox usa la red Docker `bridge` sin `sandbox.browser.cdpSourceRange`.
También marca modos de red peligrosos de Docker para sandbox (incluidos `host` y uniones de espacio de nombres `container:*`).
También advierte cuando contenedores Docker existentes del navegador del sandbox tienen etiquetas hash ausentes/obsoletas (por ejemplo, contenedores anteriores a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.
También advierte cuando los registros de instalación de plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o difieren de las versiones de paquetes instaladas actualmente.
Advierte cuando las listas de permitidos de canales dependen de nombres/correos electrónicos/etiquetas mutables en lugar de IDs estables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ámbitos IRC donde corresponda).
Advierte cuando `gateway.auth.mode="none"` deja las API HTTP de Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).
Las configuraciones con prefijo `dangerous`/`dangerously` son anulaciones explícitas de emergencia para operadores; habilitar una no constituye, por sí mismo, un reporte de vulnerabilidad de seguridad.
Para el inventario completo de parámetros peligrosos, consulta la sección "Resumen de flags inseguros o peligrosos" en [Seguridad](/es/gateway/security).

Los hallazgos permanentes intencionales se pueden aceptar con `security.audit.suppressions`.
Cada supresión coincide con un `checkId` exacto y se puede acotar con
subcadenas sin distinción de mayúsculas/minúsculas en `titleIncludes` y/o `detailIncludes`:

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

Los hallazgos suprimidos se eliminan del `summary` activo y de la lista `findings`.
La salida JSON los conserva en `suppressedFindings` para auditabilidad.
Cuando hay supresiones configuradas, la salida activa también conserva un hallazgo informativo
`security.audit.suppressions.active` no suprimible para que los lectores sepan que la auditoría
fue filtrada. Los flags de configuración peligrosos se emiten un flag por hallazgo, por lo que
aceptar un flag peligroso no oculta otros flags habilitados que comparten el mismo
`checkId` `config.insecure_or_dangerous_flags`.
Como las supresiones pueden ocultar riesgos permanentes, agregarlas o quitarlas mediante
comandos shell ejecutados por agentes requiere aprobación de exec, a menos que exec ya se esté ejecutando
con `security="full"` y `ask="off"` para automatización local confiable.

Comportamiento de SecretRef:

- `security audit` resuelve SecretRefs compatibles en modo de solo lectura para sus rutas objetivo.
- Si un SecretRef no está disponible en la ruta del comando actual, la auditoría continúa y reporta `secretDiagnostics` (en lugar de fallar).
- `--token` y `--password` solo sobrescriben la autenticación de sondeo profundo para esa invocación del comando; no reescriben la configuración ni las asignaciones de SecretRef.

## Salida JSON

Usa `--json` para comprobaciones de CI/política:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si `--fix` y `--json` se combinan, la salida incluye tanto las acciones de corrección como el informe final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Qué cambia `--fix`

`--fix` aplica remediaciones seguras y deterministas:

- cambia `groupPolicy="open"` común a `groupPolicy="allowlist"` (incluidas variantes de cuenta en canales compatibles)
- cuando la política de grupo de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` desde
  el archivo `allowFrom` almacenado cuando esa lista existe y la configuración aún no
  define `allowFrom`
- cambia `logging.redactSensitive` de `"off"` a `"tools"`
- endurece los permisos de archivos de estado/configuración y archivos sensibles comunes
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesión
  `*.jsonl`)
- también endurece los archivos de inclusión de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves de API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia las decisiones de enlace/autenticación/exposición de red del gateway
- elimina ni reescribe plugins/skills

## Relacionado

- [Referencia de CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
