---
read_when:
    - Desea ejecutar una auditoría de seguridad rápida en la configuración/estado
    - Quieres aplicar sugerencias seguras de “corrección” (permisos, restringir valores predeterminados)
summary: Referencia de CLI para `openclaw security` (auditar y corregir errores comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-05-02T05:23:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

`security audit` sin opciones permanece en la ruta fría de configuración/sistema de archivos/solo lectura. No descubre de forma predeterminada los recopiladores de seguridad del runtime de plugins, por lo que las auditorías rutinarias no cargan todos los runtime de plugins instalados. Usa `--deep` para incluir sondeos activos de Gateway de mejor esfuerzo y recopiladores de auditoría de seguridad propiedad del plugin; los llamadores internos explícitos también pueden optar por esos recopiladores propiedad del plugin cuando ya tengan un ámbito de runtime adecuado.

La auditoría advierte cuando varios remitentes de DM comparten la sesión principal y recomienda el **modo DM seguro**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales con varias cuentas) para bandejas de entrada compartidas.
Esto sirve para reforzar bandejas de entrada cooperativas/compartidas. Un único Gateway compartido por operadores mutuamente no confiables/adversariales no es una configuración recomendada; separa los límites de confianza con gateways independientes (o usuarios/hosts del sistema operativo independientes).
También emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere una entrada probablemente compartida por varios usuarios (por ejemplo, política abierta de DM/grupo, destinos de grupo configurados o reglas de remitente con comodines), y recuerda que OpenClaw usa de forma predeterminada un modelo de confianza de asistente personal.
Para configuraciones multiusuario intencionales, la guía de auditoría recomienda aislar todas las sesiones en sandbox, mantener el acceso al sistema de archivos limitado al espacio de trabajo y mantener las identidades o credenciales personales/privadas fuera de ese runtime.
También advierte cuando se usan modelos pequeños (`<=300B`) sin sandboxing y con herramientas web/navegador habilitadas.
Para la entrada por Webhook, advierte cuando `hooks.token` reutiliza el token del Gateway, cuando `hooks.token` es corto, cuando `hooks.path="/"`, cuando `hooks.defaultSessionKey` no está definido, cuando `hooks.allowedAgentIds` no tiene restricciones, cuando las anulaciones de `sessionKey` en solicitudes están habilitadas y cuando las anulaciones están habilitadas sin `hooks.allowedSessionKeyPrefixes`.
También advierte cuando la configuración de Docker de sandbox está configurada mientras el modo sandbox está desactivado, cuando `gateway.nodes.denyCommands` usa entradas ineficaces con aspecto de patrón o desconocidas (solo coincidencia exacta del nombre de comando de Node, no filtrado de texto de shell), cuando `gateway.nodes.allowCommands` habilita explícitamente comandos de Node peligrosos, cuando el `tools.profile="minimal"` global es anulado por perfiles de herramientas del agente, cuando los grupos abiertos exponen herramientas de runtime/sistema de archivos sin protecciones de sandbox/espacio de trabajo, y cuando las herramientas de plugins instalados pueden ser alcanzables con una política de herramientas permisiva.
También marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de encabezados si los proxies están mal configurados) y `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
También advierte cuando el navegador de sandbox usa la red `bridge` de Docker sin `sandbox.browser.cdpSourceRange`.
También marca modos de red peligrosos de Docker de sandbox (incluidos `host` y uniones de espacios de nombres `container:*`).
También advierte cuando contenedores Docker existentes del navegador de sandbox tienen etiquetas hash faltantes/obsoletas (por ejemplo, contenedores previos a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.
También advierte cuando los registros de instalación de plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o difieren de las versiones de paquetes instaladas actualmente.
Advierte cuando las listas de permitidos de canales dependen de nombres/correos/etiquetas mutables en lugar de IDs estables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ámbitos IRC cuando corresponda).
Advierte cuando `gateway.auth.mode="none"` deja las API HTTP del Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).
Los ajustes con prefijo `dangerous`/`dangerously` son anulaciones explícitas de emergencia del operador; habilitar uno no constituye, por sí mismo, un informe de vulnerabilidad de seguridad.
Para el inventario completo de parámetros peligrosos, consulta la sección "Resumen de indicadores inseguros o peligrosos" en [Seguridad](/es/gateway/security).

Comportamiento de SecretRef:

- `security audit` resuelve las SecretRefs compatibles en modo de solo lectura para sus rutas objetivo.
- Si una SecretRef no está disponible en la ruta del comando actual, la auditoría continúa e informa `secretDiagnostics` (en lugar de fallar).
- `--token` y `--password` solo anulan la autenticación de sondeo profundo para esa invocación del comando; no reescriben la configuración ni las asignaciones de SecretRef.

## Salida JSON

Usa `--json` para comprobaciones de CI/políticas:

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
- cuando la política de grupos de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` desde
  el archivo `allowFrom` almacenado cuando esa lista existe y la configuración aún no
  define `allowFrom`
- establece `logging.redactSensitive` de `"off"` a `"tools"`
- endurece los permisos para archivos de estado/configuración y archivos sensibles comunes
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl` de
  sesión)
- también endurece los archivos de inclusión de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos con `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves de API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia las decisiones de enlace/autenticación/exposición de red del gateway
- elimina ni reescribe plugins/Skills

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
