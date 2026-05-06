---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Actualizaste y quieres una verificación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-06T17:53:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de salud + correcciones rápidas para el Gateway y los canales.

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
- `--repair`: aplica las reparaciones recomendadas que no sean de servicio sin preguntar; las instalaciones y reescrituras del servicio de Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: se ejecuta sin avisos; solo migraciones seguras y reparaciones que no sean de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: analiza los servicios del sistema para detectar instalaciones adicionales de Gateway e informa traspasos recientes de reinicio del supervisor de Gateway

Notas:

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de doctor de solo lectura siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están desactivados porque `openclaw.json` es inmutable. Edita en su lugar el origen Nix de esta instalación; para nix-openclaw, usa el [inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente.
- Los avisos interactivos (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es un TTY y `--non-interactive` **no** está establecido. Las ejecuciones sin entorno interactivo (cron, Telegram, sin terminal) omitirán los avisos.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de salud sin entorno interactivo sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway ausentes o desactualizadas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio ausente, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin entorno interactivo los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos cron y puede reescribirlas en el lugar antes de que el planificador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el heredado `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando cron no tiene el entorno del bus de usuario de systemd.
- Cuando WhatsApp está activado, doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Doctor reescribe referencias de modelo heredadas `openai-codex/*` a referencias canónicas `openai/*` en modelos principales, alternativas, anulaciones de Heartbeat/subagente/Compaction, hooks, anulaciones de modelo por canal y pines obsoletos de ruta de sesión. `--fix` selecciona `agentRuntime.id: "codex"` solo cuando el plugin Codex está instalado, activado, aporta el arnés `codex` y tiene OAuth utilizable; de lo contrario selecciona `agentRuntime.id: "pi"` para que la ruta permanezca en el ejecutor predeterminado de OpenClaw.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables ausentes que están referenciados por la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes de agente configurados. Durante las actualizaciones de paquete, doctor omite la reparación de plugins del gestor de paquetes hasta que el intercambio de paquetes se complete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, doctor informa el error de instalación y conserva la entrada de plugin configurada para el siguiente intento de reparación.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugins ausentes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de Heartbeat y anulaciones de modelo por canal cuando el descubrimiento de plugins está saludable.
- Doctor pone en cuarentena configuración de plugins no válida desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga `config` no válida. El arranque de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor posee el ciclo de vida del Gateway. Doctor sigue informando la salud de Gateway/servicio y aplica reparaciones que no sean de servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio y limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd inactivas adicionales similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio Gateway systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda de memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay propietario de comandos configurado. El propietario de comandos es la cuenta de operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, establece `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen recursos personales de Codex CLI en el inicio de Codex del operador. Los lanzamientos locales del servidor de aplicaciones de Codex usan inicios aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar recursos que deban promocionarse deliberadamente.
- Doctor advierte cuando Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan bins, variables de entorno, configuración o requisitos del SO. `doctor --fix` puede desactivar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura en su lugar el requisito ausente cuando quieras mantener la skill activa.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir anticipadamente.
- Después de migraciones del directorio de estado, doctor advierte cuando cuentas predeterminadas activadas de Telegram o Discord dependen de alternativa por entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso de doctor.
- La resolución automática de nombres de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de "no autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [doctor de Gateway](/es/gateway/doctor)
