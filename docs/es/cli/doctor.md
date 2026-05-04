---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-04T02:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
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
- `--yes`: acepta los valores predeterminados sin pedir confirmación
- `--repair`: aplica las reparaciones recomendadas que no son de servicio sin pedir confirmación; las instalaciones y reescrituras del servicio de Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras y reparaciones que no son de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: examina los servicios del sistema en busca de instalaciones adicionales de Gateway

Notas:

- Las solicitudes interactivas (como las correcciones de llavero/OAuth) solo se ejecutan cuando stdin es un TTY y `--non-interactive` **no** está configurado. Las ejecuciones sin interfaz (Cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando por completo los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway ausentes u obsoletas, pero no las instala ni reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio ausente, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también examina `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de tareas Cron y puede reescribirlas en el lugar antes de que el programador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el script heredado `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando Cron no tiene el entorno del bus de usuario de systemd.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables configurados ausentes cuando el registro puede resolverlos, y la pasada de doctor 2026.5.2 instala automáticamente los plugins descargables que una configuración anterior ya usa antes de marcar la configuración como modificada para esa versión. Si la descarga falla, doctor informa el error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara la configuración obsoleta de plugins eliminando los ids de plugins ausentes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante coincidente, destinos de Heartbeat y anulaciones de modelo de canal cuando el descubrimiento de plugins funciona correctamente.
- Doctor pone en cuarentena la configuración inválida de plugins desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga `config` inválida. El inicio de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor es dueño del ciclo de vida de Gateway. Doctor sigue informando el estado de Gateway/servicio y aplica reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap de servicio y limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd inactivas adicionales similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio systemd de Gateway en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, configura `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen recursos personales de Codex CLI en el inicio de Codex del operador. Los lanzamientos locales del servidor de aplicación de Codex usan inicios aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar los recursos que deberían promocionarse deliberadamente.
- Doctor advierte cuando Skills permitidos para el agente predeterminado no están disponibles en el entorno de ejecución actual porque faltan binarios, variables de entorno, configuración o requisitos del sistema operativo. `doctor --fix` puede desactivar esos Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener activo el Skill.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados del registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena los archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` están administrados por SecretRef y no están disponibles en la ruta del comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto sin formato.
- Si la inspección de SecretRef del canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- Después de migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen de la alternativa de variables de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La resolución automática de nombres de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta del comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si antes ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
