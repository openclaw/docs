---
read_when:
    - Quieres ejecutar una auditoría de seguridad rápida sobre configuración/estado
    - Deseas aplicar sugerencias seguras de "corrección" (permisos, hacer más estrictos los valores predeterminados)
summary: Referencia de CLI para `openclaw security` (audita y corrige errores comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-05-06T17:54:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
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

`security audit` simple permanece en la ruta fría de configuración/sistema de archivos/solo lectura. No descubre colectores de seguridad del runtime del Plugin de forma predeterminada, por lo que las auditorías rutinarias no cargan el runtime de todos los Plugins instalados. Usa `--deep` para incluir sondeos en vivo de Gateway de mejor esfuerzo y colectores de auditoría de seguridad propios del Plugin; los llamadores internos explícitos también pueden optar por esos colectores propios del Plugin cuando ya tengan un ámbito de runtime adecuado.

La auditoría advierte cuando varios remitentes de MD comparten la sesión principal y recomienda el **modo de MD seguro**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales multicuenta) para bandejas de entrada compartidas.
Esto sirve para endurecer bandejas de entrada cooperativas/compartidas. Un único Gateway compartido por operadores mutuamente no confiables/adversarios no es una configuración recomendada; separa los límites de confianza con gateways distintos (o usuarios/hosts de SO separados).
También emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere ingreso probable de usuarios compartidos (por ejemplo, política abierta de MD/grupo, destinos de grupo configurados o reglas de remitente comodín), y te recuerda que OpenClaw usa de forma predeterminada un modelo de confianza de asistente personal.
Para configuraciones intencionales de usuarios compartidos, la guía de auditoría es aislar todas las sesiones en sandbox, mantener el acceso al sistema de archivos limitado al espacio de trabajo y mantener identidades o credenciales personales/privadas fuera de ese runtime.
También advierte cuando se usan modelos pequeños (`<=300B`) sin sandbox y con herramientas web/navegador habilitadas.
Para el ingreso por Webhook, advierte cuando `hooks.token` reutiliza el token de Gateway, cuando `hooks.token` es corto, cuando `hooks.path="/"`, cuando `hooks.defaultSessionKey` no está definido, cuando `hooks.allowedAgentIds` no está restringido, cuando las anulaciones de `sessionKey` de la solicitud están habilitadas y cuando las anulaciones están habilitadas sin `hooks.allowedSessionKeyPrefixes`.
También advierte cuando la configuración de Docker de sandbox está configurada mientras el modo sandbox está desactivado, cuando `gateway.nodes.denyCommands` usa entradas ineficaces con aspecto de patrón/desconocidas (solo coincidencia exacta de nombres de comandos de Node, no filtrado de texto de shell), cuando `gateway.nodes.allowCommands` habilita explícitamente comandos de Node peligrosos, cuando `tools.profile="minimal"` global se anula mediante perfiles de herramientas de agentes, cuando los grupos abiertos exponen herramientas de runtime/sistema de archivos sin protecciones de sandbox/espacio de trabajo, y cuando las herramientas de Plugins instalados podrían ser accesibles bajo una política de herramientas permisiva.
También marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados) y `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
También advierte cuando el navegador sandbox usa la red Docker `bridge` sin `sandbox.browser.cdpSourceRange`.
También marca modos de red Docker de sandbox peligrosos (incluidos `host` y uniones de espacios de nombres `container:*`).
También advierte cuando los contenedores Docker de navegador sandbox existentes tienen etiquetas hash ausentes/obsoletas (por ejemplo, contenedores previos a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.
También advierte cuando los registros de instalación de Plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o difieren de las versiones de paquetes instaladas actualmente.
Advierte cuando las listas de permitidos de canales dependen de nombres/correos electrónicos/etiquetas mutables en lugar de ID estables (Discord, Slack, Google Chat, Microsoft Teams, ámbitos de Mattermost e IRC cuando corresponda).
Advierte cuando `gateway.auth.mode="none"` deja las API HTTP de Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).
Las configuraciones con prefijo `dangerous`/`dangerously` son anulaciones explícitas de emergencia del operador; habilitar una no constituye, por sí mismo, un informe de vulnerabilidad de seguridad.
Para ver el inventario completo de parámetros peligrosos, consulta la sección "Resumen de marcas inseguras o peligrosas" en [Seguridad](/es/gateway/security).

Comportamiento de SecretRef:

- `security audit` resuelve los SecretRefs admitidos en modo de solo lectura para sus rutas objetivo.
- Si un SecretRef no está disponible en la ruta del comando actual, la auditoría continúa e informa `secretDiagnostics` (en lugar de fallar).
- `--token` y `--password` solo anulan la autenticación de sondeo profundo para esa invocación de comando; no reescriben la configuración ni las asignaciones de SecretRef.

## Salida JSON

Usa `--json` para comprobaciones de CI/política:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si `--fix` y `--json` se combinan, la salida incluye tanto acciones de corrección como el informe final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Qué cambia `--fix`

`--fix` aplica remediaciones seguras y deterministas:

- cambia `groupPolicy="open"` común a `groupPolicy="allowlist"` (incluidas variantes de cuenta en canales admitidos)
- cuando la política de grupos de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` desde
  el archivo `allowFrom` almacenado cuando esa lista existe y la configuración todavía no
  define `allowFrom`
- establece `logging.redactSensitive` de `"off"` a `"tools"`
- ajusta los permisos para estado/configuración y archivos confidenciales comunes
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl`
  de sesión)
- también ajusta los archivos include de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves de API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia opciones de enlace/autenticación/exposición de red del gateway
- elimina ni reescribe plugins/Skills

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
