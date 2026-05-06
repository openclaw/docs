---
read_when:
    - Tiene problemas de conectividad/autenticación y quiere soluciones guiadas
    - Has actualizado y quieres una verificación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-06T05:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado + correcciones rápidas para el Gateway y los canales.

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
- `--repair`: aplica las reparaciones recomendadas que no sean de servicio sin preguntar; las instalaciones y reescrituras del servicio de Gateway siguen requiriendo confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras y reparaciones que no sean de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: examina los servicios del sistema en busca de instalaciones adicionales de Gateway e informa transferencias recientes de reinicio del supervisor de Gateway

Notas:

- Las solicitudes interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está establecido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway faltantes u obsoletas, pero no las instala ni reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio faltante, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también examina `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de trabajos cron y puede reescribirlos in situ antes de que el planificador tenga que normalizarlos automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el heredado `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsos cortes del Gateway de WhatsApp cuando cron no tiene el entorno de bus de usuario de systemd.
- Cuando WhatsApp está habilitado, doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización de TUI obsoletos.
- Doctor reescribe referencias de modelo heredadas `openai-codex/*` a referencias canónicas `openai/*` en modelos principales, alternativas, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo de canal y pins de ruta de sesión obsoletos. `--fix` selecciona `agentRuntime.id: "codex"` solo cuando el plugin Codex está instalado, habilitado, aporta el arnés `codex` y tiene OAuth utilizable; de lo contrario, selecciona `agentRuntime.id: "pi"` para que la ruta permanezca en el ejecutor predeterminado de OpenClaw.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables faltantes que están referenciados por la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o tiempos de ejecución de agente configurados. Durante las actualizaciones de paquete, doctor omite la reparación de plugins del gestor de paquetes hasta que se complete el intercambio de paquete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado todavía necesita recuperación. Si la descarga falla, doctor informa el error de instalación y conserva la entrada de plugin configurada para el siguiente intento de reparación.
- Doctor repara configuración de plugins obsoleta eliminando ids de plugins faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de Heartbeat y anulaciones de modelo de canal cuando la detección de plugins funciona correctamente.
- Doctor pone en cuarentena la configuración de plugin no válida deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` no válida. El inicio de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor controla el ciclo de vida del Gateway. Doctor sigue informando el estado de Gateway/servicio y aplica reparaciones que no sean de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd adicionales inactivas similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio de Gateway systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves de objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay un propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada a ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, establece `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen activos personales de Codex CLI en el directorio de inicio de Codex del operador. Los lanzamientos locales del servidor de aplicación de Codex usan directorios de inicio aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar los activos que deberían promocionarse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de ejecución actual porque faltan bins, variables de entorno, configuración o requisitos del sistema operativo. `doctor --fix` puede deshabilitar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener activa la Skill.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales de respaldo en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- Después de migraciones del directorio de estado, doctor advierte cuando cuentas predeterminadas habilitadas de Telegram o Discord dependen de la reserva de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso de doctor.
- La resolución automática de nombre de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática para esa pasada.

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
- [Doctor de Gateway](/es/gateway/doctor)
