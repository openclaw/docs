---
read_when:
    - Quieres ejecutar una auditoría de seguridad rápida en la configuración/estado
    - Quiere aplicar sugerencias de "corrección" seguras (permisos, hacer más estrictos los valores predeterminados)
summary: Referencia de la CLI para `openclaw security` (auditar y corregir problemas comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-05-11T20:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
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

`security audit` simple permanece en la ruta fría de configuración/sistema de archivos/solo lectura. No descubre los recopiladores de seguridad del runtime de plugins de forma predeterminada, por lo que las auditorías rutinarias no cargan el runtime de todos los plugins instalados. Usa `--deep` para incluir sondeos en vivo de Gateway de mejor esfuerzo y recopiladores de auditoría de seguridad propiedad de los plugins; los llamadores internos explícitos también pueden optar por esos recopiladores propiedad de los plugins cuando ya tienen un ámbito de runtime adecuado.

La auditoría advierte cuando varios remitentes de DM comparten la sesión principal y recomienda el **modo DM seguro**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales multicuenta) para bandejas de entrada compartidas.
Esto sirve para reforzar bandejas de entrada cooperativas/compartidas. Un único Gateway compartido por operadores mutuamente no confiables/adversarios no es una configuración recomendada; separa los límites de confianza con gateways separados (o usuarios/hosts del sistema operativo separados).
También emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere una entrada probable de usuarios compartidos (por ejemplo, política abierta de DM/grupos, destinos de grupo configurados o reglas de remitente con comodín), y te recuerda que OpenClaw usa de forma predeterminada un modelo de confianza de asistente personal.
Para configuraciones intencionales de usuarios compartidos, la guía de auditoría indica aislar todas las sesiones en sandbox, mantener el acceso al sistema de archivos limitado al workspace y mantener identidades o credenciales personales/privadas fuera de ese runtime.
También advierte cuando se usan modelos pequeños (`<=300B`) sin sandboxing y con herramientas web/navegador habilitadas.
Para la entrada por webhook, advierte cuando `hooks.token` reutiliza el token de Gateway, cuando `hooks.token` es corto, cuando `hooks.path="/"`, cuando `hooks.defaultSessionKey` no está definido, cuando `hooks.allowedAgentIds` no tiene restricciones, cuando las sobrescrituras de `sessionKey` de solicitud están habilitadas y cuando las sobrescrituras están habilitadas sin `hooks.allowedSessionKeyPrefixes`.
También advierte cuando la configuración Docker de sandbox está configurada mientras el modo sandbox está desactivado, cuando `gateway.nodes.denyCommands` usa entradas ineficaces con aspecto de patrón o desconocidas (solo coincidencia exacta de nombres de comando de nodo, no filtrado de texto de shell), cuando `gateway.nodes.allowCommands` habilita explícitamente comandos de nodo peligrosos, cuando `tools.profile="minimal"` global es sobrescrito por perfiles de herramientas de agentes, cuando las herramientas de escritura/edición están deshabilitadas pero `exec` sigue disponible sin un límite restrictivo de sistema de archivos de sandbox, cuando grupos abiertos exponen herramientas de runtime/sistema de archivos sin protecciones de sandbox/workspace, y cuando las herramientas de plugins instalados pueden ser accesibles bajo una política permisiva de herramientas.
También marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados) y `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
También advierte cuando el navegador de sandbox usa la red Docker `bridge` sin `sandbox.browser.cdpSourceRange`.
También marca modos de red Docker de sandbox peligrosos (incluidos `host` y uniones de espacio de nombres `container:*`).
También advierte cuando los contenedores Docker existentes del navegador de sandbox tienen etiquetas hash faltantes/obsoletas (por ejemplo, contenedores previos a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.
También advierte cuando los registros de instalación de plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o difieren de las versiones de paquetes instaladas actualmente.
Advierte cuando las allowlists de canal dependen de nombres/correos electrónicos/etiquetas mutables en lugar de IDs estables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ámbitos IRC donde corresponda).
Advierte cuando `gateway.auth.mode="none"` deja las API HTTP de Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).
Los ajustes con prefijo `dangerous`/`dangerously` son sobrescrituras explícitas de emergencia del operador; habilitar uno no es, por sí mismo, un reporte de vulnerabilidad de seguridad.
Para el inventario completo de parámetros peligrosos, consulta la sección "Resumen de flags inseguros o peligrosos" en [Seguridad](/es/gateway/security).

Comportamiento de SecretRef:

- `security audit` resuelve SecretRefs compatibles en modo de solo lectura para sus rutas objetivo.
- Si un SecretRef no está disponible en la ruta del comando actual, la auditoría continúa y reporta `secretDiagnostics` (en lugar de fallar).
- `--token` y `--password` solo sobrescriben la autenticación de sondeo profundo para esa invocación del comando; no reescriben la configuración ni los mapeos de SecretRef.

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
- cuando la política de grupos de WhatsApp cambia a `allowlist`, rellena `groupAllowFrom` desde
  el archivo `allowFrom` almacenado cuando esa lista existe y la configuración aún no
  define `allowFrom`
- establece `logging.redactSensitive` de `"off"` a `"tools"`
- refuerza los permisos de estado/configuración y archivos sensibles comunes
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl`
  de sesión)
- también refuerza los archivos de inclusión de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves de API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia las decisiones de bind/autenticación/exposición de red de gateway
- elimina ni reescribe plugins/Skills

## Relacionado

- [Referencia de CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
