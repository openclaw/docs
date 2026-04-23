---
read_when:
    - Quieres ejecutar una auditoría rápida de seguridad sobre la configuración/el estado
    - Quieres aplicar sugerencias seguras de “fix” (permisos, endurecer valores predeterminados)
summary: Referencia de CLI para `openclaw security` (auditar y corregir errores comunes de seguridad)
title: security
x-i18n:
    generated_at: "2026-04-23T14:01:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Herramientas de seguridad (auditoría + fixes opcionales).

Relacionado:

- Guía de seguridad: [Security](/es/gateway/security)

## Auditoría

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

La auditoría advierte cuando varios remitentes de mensajes directos comparten la sesión principal y recomienda el **modo seguro de mensajes directos**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales con varias cuentas) para bandejas de entrada compartidas.
Esto es para el endurecimiento de bandejas de entrada cooperativas/compartidas. Un único Gateway compartido por operadores mutuamente no confiables/adversarios no es una configuración recomendada; separa los límites de confianza con gateways independientes (o usuarios/hosts de sistema operativo separados).
También emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere un ingreso probable de usuarios compartidos (por ejemplo, política abierta de mensajes directos/grupos, destinos de grupo configurados o reglas comodín de remitentes) y te recuerda que OpenClaw usa de forma predeterminada un modelo de confianza de asistente personal.
Para configuraciones intencionales de usuarios compartidos, la guía de auditoría es aislar en entorno aislado todas las sesiones, mantener el acceso al sistema de archivos limitado al espacio de trabajo y mantener identidades o credenciales personales/privadas fuera de ese entorno de ejecución.
También advierte cuando se usan modelos pequeños (`<=300B`) sin entorno aislado y con herramientas web/navegador habilitadas.
Para ingreso por Webhook, advierte cuando `hooks.token` reutiliza el token del Gateway, cuando `hooks.token` es corto, cuando `hooks.path="/"`, cuando `hooks.defaultSessionKey` no está establecido, cuando `hooks.allowedAgentIds` no está restringido, cuando están habilitadas las anulaciones de `sessionKey` de la solicitud y cuando las anulaciones están habilitadas sin `hooks.allowedSessionKeyPrefixes`.
También advierte cuando la configuración de Docker de entorno aislado está configurada mientras el modo de entorno aislado está desactivado, cuando `gateway.nodes.denyCommands` usa entradas ineficaces de tipo patrón/desconocidas (solo coincidencia exacta de nombre de comando de Node, no filtrado de texto de shell), cuando `gateway.nodes.allowCommands` habilita explícitamente comandos peligrosos de Node, cuando `tools.profile="minimal"` global se anula mediante perfiles de herramientas del agente, cuando grupos abiertos exponen herramientas de tiempo de ejecución/sistema de archivos sin protecciones de entorno aislado/espacio de trabajo y cuando las herramientas de Plugin instaladas pueden ser accesibles bajo una política de herramientas permisiva.
También marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados) y `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
También advierte cuando el navegador del entorno aislado usa la red Docker `bridge` sin `sandbox.browser.cdpSourceRange`.
También marca modos peligrosos de red Docker del entorno aislado (incluidos `host` y uniones de espacio de nombres `container:*`).
También advierte cuando los contenedores Docker existentes del navegador del entorno aislado tienen etiquetas hash ausentes/obsoletas (por ejemplo, contenedores anteriores a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.
También advierte cuando los registros de instalación de Plugin/hook basados en npm no están fijados, carecen de metadatos de integridad o divergen de las versiones de paquetes instaladas actualmente.
Advierte cuando las listas de permitidos de canales dependen de nombres/correos electrónicos/etiquetas mutables en lugar de ID estables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ámbitos de IRC cuando corresponda).
Advierte cuando `gateway.auth.mode="none"` deja las API HTTP del Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).
La configuración con prefijo `dangerous`/`dangerously` son anulaciones explícitas de operador para casos extremos; habilitar una no constituye, por sí mismo, un informe de vulnerabilidad de seguridad.
Para el inventario completo de parámetros peligrosos, consulta la sección "Insecure or dangerous flags summary" en [Security](/es/gateway/security).

Comportamiento de SecretRef:

- `security audit` resuelve los SecretRef compatibles en modo de solo lectura para sus rutas dirigidas.
- Si un SecretRef no está disponible en la ruta actual del comando, la auditoría continúa e informa `secretDiagnostics` (en lugar de fallar).
- `--token` y `--password` solo anulan la autenticación de sondeo profundo para esa invocación del comando; no reescriben la configuración ni las asignaciones de SecretRef.

## Salida JSON

Usa `--json` para comprobaciones de CI/políticas:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si se combinan `--fix` y `--json`, la salida incluye tanto las acciones de fix como el informe final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Qué cambia `--fix`

`--fix` aplica correcciones seguras y deterministas:

- cambia `groupPolicy="open"` común a `groupPolicy="allowlist"` (incluidas variantes por cuenta en los canales compatibles)
- cuando la política de grupo de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` a partir
  del archivo almacenado `allowFrom` cuando esa lista existe y la configuración no
  define ya `allowFrom`
- establece `logging.redactSensitive` de `"off"` a `"tools"`
- endurece permisos para el estado/configuración y archivos sensibles comunes
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesión
  `*.jsonl`)
- también endurece los archivos incluidos de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no** hace lo siguiente:

- rota tokens/contraseñas/claves API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia opciones de enlace/autenticación/exposición de red del gateway
- elimina ni reescribe plugins/Skills
