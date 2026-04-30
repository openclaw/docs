---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-04-30T20:05:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de salud y correcciones rápidas para el Gateway y los canales.

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
- `--yes`: acepta los valores predeterminados sin solicitar confirmación
- `--repair`: aplica las reparaciones recomendadas sin solicitar confirmación
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: analiza los servicios del sistema para detectar instalaciones adicionales del Gateway

Notas:

- Las solicitudes interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está establecido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de Plugin para que las comprobaciones de salud sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando por completo los Plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta las claves de configuración desconocidas, enumerando cada eliminación.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos Cron y puede reescribirlas en su lugar antes de que el planificador tenga que normalizarlas automáticamente en tiempo de ejecución.
- Doctor repara las dependencias de runtime faltantes de los Plugins incluidos sin escribir en instalaciones globales empaquetadas. Para instalaciones npm propiedad de root o unidades systemd reforzadas, establece `OPENCLAW_PLUGIN_STAGE_DIR` en un directorio escribible como `/var/lib/openclaw/plugin-runtime-deps`; también puede ser una lista de rutas como `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, donde las raíces anteriores son capas de búsqueda de solo lectura y la raíz final es el destino de reparación.
- Doctor repara la configuración obsoleta de Plugins eliminando los ids de Plugin faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, los destinos de Heartbeat y las anulaciones de modelo de canal cuando la detección de Plugins está sana.
- Doctor pone en cuarentena la configuración inválida de Plugins desactivando la entrada `plugins.entries.<id>` afectada y eliminando su payload `config` inválido. El arranque del Gateway ya omite solo ese Plugin defectuoso para que otros Plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor sea propietario del ciclo de vida del Gateway. Doctor sigue informando sobre la salud del Gateway/servicio y aplica reparaciones no relacionadas con el servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora las unidades systemd adicionales inactivas similares al Gateway y no reescribe los metadatos de comando/entrypoint de un servicio Gateway systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración Talk plana heredada (`talk.voiceId`, `talk.modelId` y relacionadas) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican la normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embedding.
- Doctor advierte cuando no hay un propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, establece `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen assets personales de la CLI de Codex en el home de Codex del operador. Los lanzamientos locales del app-server de Codex usan homes aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar los assets que deberían promocionarse deliberadamente.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con una corrección (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta del comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- La resolución automática de nombre de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta del comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
