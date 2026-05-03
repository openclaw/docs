---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-05-03T21:28:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado + correcciones rápidas para el gateway y los canales.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Ejemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opciones

- `--no-workspace-suggestions`: desactiva las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin preguntar
- `--repair`: aplica las reparaciones recomendadas que no son de servicio sin preguntar; las instalaciones y reescrituras del servicio de gateway aún requieren confirmación interactiva o comandos de gateway explícitos
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración de servicio personalizada cuando sea necesario
- `--non-interactive`: se ejecuta sin avisos; solo migraciones seguras y reparaciones que no son de servicio
- `--generate-gateway-token`: genera y configura un token de gateway
- `--deep`: analiza los servicios del sistema en busca de instalaciones adicionales de gateway

Notas:

- Los avisos interactivos (como las correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está configurado. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán los avisos.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz se mantengan rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta las claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de gateway faltantes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio faltante, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el iniciador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos Cron y puede reescribirlas en el lugar antes de que el programador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el heredado `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsas interrupciones del gateway de WhatsApp cuando cron carece del entorno de bus de usuario de systemd.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables configurados que faltan cuando el registro puede resolverlos, y la pasada de doctor 2026.5.2 instala automáticamente plugins descargables que una configuración anterior ya usa antes de marcar la configuración como tocada para esa versión.
- Doctor repara la configuración obsoleta de plugins eliminando ids de plugins faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de Heartbeat y anulaciones de modelo de canal cuando el descubrimiento de plugins está en buen estado.
- Doctor pone en cuarentena la configuración inválida de plugins desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` inválida. El arranque del gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir funcionando.
- Configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor es propietario del ciclo de vida del gateway. Doctor sigue informando el estado del gateway/servicio y aplica reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd adicionales inactivas similares a gateway y no reescribe metadatos de comando/punto de entrada para un servicio systemd de gateway en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el iniciador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y relacionadas) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican la normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay un propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, configura `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando agentes en modo Codex están configurados y existen recursos personales de Codex CLI en el directorio principal de Codex del operador. Los lanzamientos locales del servidor de app de Codex usan directorios principales aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar recursos que deberían promoverse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de ejecución actual porque faltan binarios, variables de entorno, configuración o requisitos de SO. `doctor --fix` puede desactivar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener la skill activa.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena los archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta del comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales de respaldo en texto sin formato.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- Después de las migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas activadas de Telegram o Discord dependen del respaldo de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso de doctor.
- La resolución automática de nombres de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta del comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de env de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor del Gateway](/es/gateway/doctor)
