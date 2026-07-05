---
read_when:
    - Quieres ejecutar una auditoría de seguridad rápida en la configuración/estado
    - Quieres aplicar sugerencias de «corrección» seguras (permisos, endurecer valores predeterminados)
summary: Referencia de CLI para `openclaw security` (auditar y corregir problemas comunes de seguridad)
title: Seguridad
x-i18n:
    generated_at: "2026-07-05T11:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49b80cc444995556a657798e62f4547acd2360e5feb5fe15e547933bbef98c4e
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

`security audit` simple se mantiene en la ruta fría de configuración/sistema de archivos/solo lectura: no descubre recopiladores de seguridad del runtime de plugins, por lo que las auditorías rutinarias no cargan todos los runtimes de plugins instalados. `--deep` añade sondeos del Gateway en vivo de mejor esfuerzo y recopiladores de auditoría de seguridad propios de plugins (los llamadores internos explícitos también pueden optar por esos recopiladores cuando ya tienen un ámbito de runtime adecuado).

Si la autenticación por contraseña del Gateway se proporciona solo al inicio, pasa el mismo valor con `--auth password --password <password>` para que la auditoría pueda comprobarlo contra `hooks.token`.

## Qué comprueba

**Modelo de DM/confianza**

- Advierte cuando varios remitentes de DM comparten la sesión principal y recomienda el modo de DM seguro: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` para canales multicuenta) para bandejas de entrada compartidas. Esto es endurecimiento cooperativo/de bandeja compartida, no aislamiento para operadores mutuamente no confiables; separa los límites de confianza con gateways separados (o usuarios/hosts de SO separados) para eso.
- Emite `security.trust_model.multi_user_heuristic` cuando la configuración sugiere una entrada probablemente de usuarios compartidos (por ejemplo, política abierta de DM/grupo, destinos de grupo configurados o reglas comodín de remitente): el modelo de confianza predeterminado de OpenClaw es de asistente personal (un operador), no aislamiento multiinquilino hostil. Para configuraciones intencionales de usuarios compartidos: aísla todas las sesiones, mantén el acceso al sistema de archivos limitado al espacio de trabajo y mantén las identidades o credenciales personales/privadas fuera de ese runtime.
- Advierte cuando se usan modelos pequeños (parámetros `<=300B`) sin aislamiento y con herramientas web/navegador habilitadas.

**Webhook/hooks**

El inicio registra una advertencia de seguridad no fatal, y la auditoría marca la reutilización de `hooks.token` de valores activos de autenticación por secreto compartido del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). También advierte cuando:

- `hooks.token` es corto
- `hooks.path="/"`
- `hooks.defaultSessionKey` no está definido
- `hooks.allowedAgentIds` no tiene restricciones
- las sobrescrituras de `sessionKey` de solicitudes están habilitadas
- las sobrescrituras están habilitadas sin `hooks.allowedSessionKeyPrefixes`

Ejecuta `openclaw doctor --fix` para rotar un `hooks.token` persistido reutilizado y luego actualiza los emisores externos de hooks para que usen el nuevo token.

**Aislamiento/herramientas**

- Advierte cuando la configuración de Docker del aislamiento está configurada mientras el modo de aislamiento está desactivado.
- Advierte cuando `gateway.nodes.denyCommands` usa entradas ineficaces con aspecto de patrón/desconocidas (la coincidencia es solo con el nombre exacto del comando de nodo, no filtrado de texto de shell).
- Advierte cuando `gateway.nodes.allowCommands` habilita explícitamente comandos de nodo peligrosos.
- Advierte cuando el `tools.profile="minimal"` global es sobrescrito por perfiles de herramientas de agentes.
- Advierte cuando las herramientas de escritura/edición están deshabilitadas pero `exec` sigue disponible sin un límite restrictivo de sistema de archivos aislado.
- Advierte cuando DM o grupos abiertos exponen herramientas de runtime/sistema de archivos sin protecciones de aislamiento/espacio de trabajo.
- Advierte cuando las herramientas de plugins instalados pueden ser accesibles bajo una política de herramientas permisiva.

**Navegador aislado**

- Advierte cuando el navegador aislado usa la red Docker `bridge` sin `sandbox.browser.cdpSourceRange`.
- Marca modos peligrosos de red Docker del aislamiento, incluidos `host` y uniones de espacios de nombres `container:*`.
- Advierte cuando los contenedores Docker existentes del navegador aislado tienen etiquetas hash faltantes/obsoletas (por ejemplo, contenedores previos a la migración sin `openclaw.browserConfigEpoch`) y recomienda `openclaw sandbox recreate --browser --all`.

**Red/descubrimiento**

- Marca `gateway.allowRealIpFallback=true` (riesgo de suplantación de cabeceras si los proxies están mal configurados).
- Marca `discovery.mdns.mode="full"` (filtración de metadatos mediante registros TXT de mDNS).
- Advierte cuando `gateway.auth.mode="none"` deja las API HTTP del Gateway accesibles sin un secreto compartido (`/tools/invoke` más cualquier endpoint `/v1/*` habilitado).

**Plugins/canales**

- Advierte cuando los registros de instalación de plugins/hooks basados en npm no están fijados, carecen de metadatos de integridad o difieren de las versiones de paquetes instaladas actualmente.
- Advierte cuando las listas de permitidos de canales dependen de nombres/correos/etiquetas mutables en lugar de ID estables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ámbitos IRC cuando corresponda).

Las opciones prefijadas con `dangerous`/`dangerously` son sobrescrituras explícitas de emergencia del operador; habilitar una no es, por sí mismo, un informe de vulnerabilidad de seguridad. Para ver el inventario completo de parámetros peligrosos, consulta "Resumen de indicadores inseguros o peligrosos" en [Seguridad](/es/gateway/security).

## Comportamiento de SecretRef

`security audit` resuelve SecretRefs admitidos en modo de solo lectura para sus rutas objetivo. Si un SecretRef no está disponible en la ruta de comando actual, la auditoría continúa e informa `secretDiagnostics` en lugar de fallar. `--token` y `--password` solo sobrescriben la autenticación de sondeo profundo para esa invocación del comando; no reescriben la configuración ni los mapeos de SecretRef.

## Supresiones

Acepta hallazgos permanentes intencionales con `security.audit.suppressions`. Cada supresión coincide con un `checkId` exacto y puede acotarse con subcadenas `titleIncludes` y/o `detailIncludes` sin distinción entre mayúsculas y minúsculas:

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

Los hallazgos suprimidos se eliminan del `summary` activo y de la lista `findings`. La salida JSON los mantiene bajo `suppressedFindings` para auditabilidad. Cuando las supresiones están configuradas, la salida activa también mantiene un hallazgo informativo no suprimible `security.audit.suppressions.active` para que los lectores puedan saber que la auditoría fue filtrada. Las marcas de configuración peligrosas se emiten una marca por hallazgo, por lo que aceptar una marca peligrosa no oculta otras marcas habilitadas que comparten el mismo `config.insecure_or_dangerous_flags` `checkId`.

Como las supresiones pueden ocultar riesgos permanentes, añadirlas o eliminarlas mediante comandos de shell ejecutados por agentes requiere aprobación de exec, a menos que exec ya se esté ejecutando con `security="full"` y `ask="off"` para automatización local confiable.

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

Aplica remediaciones seguras y deterministas:

- cambia el `groupPolicy="open"` común a `groupPolicy="allowlist"` (incluidas variantes de cuenta en canales compatibles)
- cuando la política de grupos de WhatsApp cambia a `allowlist`, inicializa `groupAllowFrom` desde el archivo `allowFrom` almacenado cuando esa lista existe y la configuración aún no define `allowFrom`
- cambia `logging.redactSensitive` de `"off"` a `"tools"`
- endurece los permisos de estado/configuración y archivos sensibles comunes (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl` de sesión)
- también endurece los archivos de inclusión de configuración referenciados desde `openclaw.json`
- usa `chmod` en hosts POSIX y restablecimientos de `icacls` en Windows

`--fix` **no**:

- rota tokens/contraseñas/claves de API
- deshabilita herramientas (`gateway`, `cron`, `exec`, etc.)
- cambia las opciones de bind/autenticación/exposición de red del gateway
- elimina ni reescribe plugins/skills

## Relacionado

- [Referencia de CLI](/es/cli)
- [Auditoría de seguridad](/es/gateway/security)
