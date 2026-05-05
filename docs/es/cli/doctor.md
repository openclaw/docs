---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-05-05T01:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de salud + correcciones rápidas para el Gateway y los canales.

Relacionado:

- Resolución de problemas: [Resolución de problemas](/es/gateway/troubleshooting)
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
- `--repair`: aplica las reparaciones recomendadas que no son de servicio sin preguntar; las instalaciones y reescrituras del servicio de Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración de servicio personalizada cuando sea necesario
- `--non-interactive`: se ejecuta sin avisos; solo migraciones seguras y reparaciones que no son de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: analiza los servicios del sistema en busca de instalaciones adicionales de Gateway

Notas:

- Los avisos interactivos (como las correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está establecido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán los avisos.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de salud sin interfaz sigan siendo rápidas. Las sesiones interactivas aún cargan completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta las claves de configuración desconocidas, listando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway faltantes o obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio faltante, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos cron y puede reescribirlas en su lugar antes de que el programador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el script heredado `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando cron carece del entorno user-bus de systemd.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables faltantes a los que hace referencia la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes configurados de agentes. Durante las actualizaciones de paquete, doctor omite la reparación de plugins del gestor de paquetes hasta que el intercambio de paquete se complete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, doctor informa el error de instalación y conserva la entrada de plugin configurada para el siguiente intento de reparación.
- Doctor repara la configuración obsoleta de plugins eliminando los ids de plugins faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de Heartbeat y anulaciones de modelo de canal cuando el descubrimiento de plugins está sano.
- Doctor pone en cuarentena la configuración de plugin no válida desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` no válida. El arranque del Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor controla el ciclo de vida del Gateway. Doctor sigue informando la salud del Gateway/servicio y aplica reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd adicionales inactivas similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio systemd de Gateway en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y relacionados) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda de memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay un propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos solo para propietarios y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, establece `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen activos personales de Codex CLI en el home de Codex del operador. Los lanzamientos locales del servidor de apps de Codex usan homes aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar los activos que deberían promoverse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan bins, variables de entorno, configuración o requisitos del SO. `doctor --fix` puede desactivar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener activa la skill.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si existen archivos heredados de registro sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena los archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta del comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir temprano.
- Después de las migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen del fallback de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La resolución automática de nombres de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta del comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si ejecutaste previamente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
