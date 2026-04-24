---
read_when:
    - Quieres ejecutar una auditoría rápida de seguridad sobre la configuración/el estado
    - Quieres aplicar sugerencias seguras de “fix” (permisos, endurecer valores predeterminados)
summary: Referencia de CLI para `openclaw security` (auditar y corregir errores comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-04-24T05:24:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
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

La auditoría advierte cuando varios remitentes de DM comparten la sesión principal y recomienda el **modo DM seguro**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales con varias cuentas) para bandejas compartidas.
Esto es para reforzar bandejas cooperativas/compartidas. Un único Gateway compartido por operadores mutuamente no confiables/adversarios no es una configuración recomendada; divide los límites de confianza con gateways separados (o usuarios/hosts del sistema operativo separados).
También emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere probable ingreso de usuarios compartidos (por ejemplo, política abierta de DM/grupo, destinos de grupo configurados o reglas comodín de remitentes), y recuerda que OpenClaw es de forma predeterminada un modelo de confianza de asistente personal.
Para configuraciones intencionales de usuario compartido, la guía de auditoría es poner todas las sesiones en sandbox, mantener el acceso al sistema de archivos limitado al espacio de trabajo y mantener identidades o credenciales personales/privadas fuera de ese tiempo de ejecución.
También advierte cuando se usan modelos pequeños (`<=300B`) sin sandboxing y con herramientas web/navegador habilitadas.
Para el ingreso por Webhook, advierte cuando `hooks.token` reutiliza el token de Gateway, cuando `hooks.token` es corto, cuando `hooks.path="/"`, cuando `hooks.defaultSessionKey` no está configurado, cuando `hooks.allowedAgentIds` no está restringido, cuando están habilitadas las anulaciones de `sessionKey` de solicitud y cuando las anulaciones están habilitadas sin `hooks.allowedSessionKeyPrefixes`.
También advierte cuando la configuración Docker de sandbox está configurada mientras el modo sandbox está desactivado, cuando `gateway.nodes.denyCommands` usa entradas ineficaces tipo patrón/desconocidas (solo coincidencia exacta por nombre de comando del Node, no filtrado de texto shell), cuando `gateway.nodes.allowCommands` habilita explícitamente comandos peligrosos del Node, cuando `tools.profile="minimal"` global es anulado por perfiles de herramientas de agente, cuando grupos abiertos exponen herramientas de tiempo de ejecución/sistema de archivos sin protecciones de sandbox/espacio de trabajo y cuando las herramientas de Plugins instalados pueden ser accesibles bajo una política de herramientas permisiva.
También marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados) y `discovery.mdns.mode="full"` (fuga de metadatos mediante registros TXT de mDNS).
También advierte cuando el navegador del sandbox usa la red Docker `bridge` sin `sandbox.browser.cdpSourceRange`.
También marca modos de red Docker peligrosos para sandbox (incluidos `host` y uniones de namespace `container:*`).
También advierte cuando los contenedores Docker existentes del navegador de sandbox tienen etiquetas hash ausentes/obsoletas (por ejemplo, contenedores previos a migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.
También advierte cuando los registros de instalación de Plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o divergen de las versiones de paquetes actualmente instaladas.
Advierte cuando las listas permitidas de canales dependen de nombres/emails/tags mutables en lugar de IDs estables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ámbitos IRC cuando corresponda).
Advierte cuando `gateway.auth.mode="none"` deja las APIs HTTP de Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).
Los ajustes con prefijo `dangerous`/`dangerously` son anulaciones explícitas de operador tipo break-glass; habilitar uno no constituye, por sí solo, un informe de vulnerabilidad de seguridad.
Para el inventario completo de parámetros peligrosos, consulta la sección "Insecure or dangerous flags summary" en [Seguridad](/es/gateway/security).

Comportamiento de SecretRef:

- `security audit` resuelve SecretRefs compatibles en modo de solo lectura para sus rutas específicas.
- Si un SecretRef no está disponible en la ruta actual del comando, la auditoría continúa e informa `secretDiagnostics` (en lugar de fallar).
- `--token` y `--password` solo anulan la autenticación de sondeo profundo para esa invocación del comando; no reescriben la configuración ni los mapeos de SecretRef.

## Salida JSON

Usa `--json` para comprobaciones de CI/política:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si se combinan `--fix` y `--json`, la salida incluye tanto las acciones de corrección como el informe final:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Qué cambia `--fix`

`--fix` aplica correcciones seguras y deterministas:

- cambia `groupPolicy="open"` común a `groupPolicy="allowlist"` (incluidas variantes por cuenta en canales compatibles)
- cuando la política de grupo de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` a partir del
  archivo almacenado `allowFrom` cuando esa lista existe y la configuración no
  define ya `allowFrom`
- establece `logging.redactSensitive` de `"off"` a `"tools"`
- endurece permisos para archivos de estado/configuración y archivos sensibles comunes
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesión
  `*.jsonl`)
- también endurece archivos include de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia opciones de bind/autenticación/exposición de red de gateway
- elimina ni reescribe plugins/Skills

## Relacionado

- [Referencia de CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
