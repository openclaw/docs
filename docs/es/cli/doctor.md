---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Actualizaste y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-05-02T05:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
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
- `--repair`: aplica reparaciones recomendadas que no sean de servicio sin preguntar; las instalaciones y reescrituras del servicio del Gateway aún requieren confirmación interactiva o comandos explícitos del Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: se ejecuta sin avisos; solo migraciones seguras y reparaciones que no sean de servicio
- `--generate-gateway-token`: genera y configura un token del Gateway
- `--deep`: escanea los servicios del sistema en busca de instalaciones adicionales del Gateway

Notas:

- Los avisos interactivos (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es un TTY y `--non-interactive` **no** está definido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán los avisos.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga temprana de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas aún cargan completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones del servicio del Gateway faltantes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` si falta un servicio, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también escanea `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos cron y puede reescribirlas en el sitio antes de que el programador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado; ese script ya no se mantiene y puede registrar falsas caídas del Gateway de WhatsApp cuando cron carece del entorno de bus de usuario de systemd.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables configurados que faltan cuando el registro puede resolverlos.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugins faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante coincidente, destinos de Heartbeat y anulaciones de modelo de canal cuando el descubrimiento de plugins funciona correctamente.
- Doctor pone en cuarentena la configuración inválida de plugins desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` inválida. El inicio del Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Define `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor es propietario del ciclo de vida del Gateway. Doctor sigue informando del estado del Gateway/servicio y aplica reparaciones que no sean de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora las unidades systemd inactivas adicionales similares al Gateway y no reescribe metadatos de comando/punto de entrada para un servicio systemd del Gateway en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, define `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen activos personales de Codex CLI en el home de Codex del operador. Los lanzamientos locales del servidor de aplicación de Codex usan homes aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar los activos que deberían promocionarse deliberadamente.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` están administrados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales de respaldo en texto claro.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- Después de las migraciones de directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen del respaldo por env y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La autorresolución de nombre de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la autorresolución en esa pasada.

## macOS: anulaciones de env de `launchctl`

Si ejecutaste anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [doctor de Gateway](/es/gateway/doctor)
