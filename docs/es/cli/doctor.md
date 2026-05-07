---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-07T13:13:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

Para permisos específicos de canal, usa las sondas de canal en lugar de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonda dirigida de capacidades de Discord informa los permisos efectivos del bot en el canal; la sonda de estado audita los canales de Discord configurados y los destinos de unión automática por voz.

## Opciones

- `--no-workspace-suggestions`: desactiva las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin preguntar
- `--repair`: aplica las reparaciones recomendadas que no son de servicio sin preguntar; las instalaciones y reescrituras del servicio Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras y reparaciones que no son de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: analiza los servicios del sistema en busca de instalaciones adicionales de Gateway e informa traspasos recientes de reinicio del supervisor de Gateway

Notas:

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de doctor de solo lectura siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están desactivados porque `openclaw.json` es inmutable. Edita en su lugar el origen Nix de esta instalación; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente.
- Las solicitudes interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está configurado. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de salud sin interfaz sigan siendo rápidas. Las sesiones interactivas aún cargan completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta claves de configuración desconocidas, indicando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio Gateway faltantes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio faltante, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos Cron y puede reescribirlas en el lugar antes de que el planificador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el heredado `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando Cron no tiene el entorno de bus de usuario de systemd.
- Cuando WhatsApp está activado, doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Doctor reescribe referencias de modelo heredadas `openai-codex/*` a referencias canónicas `openai/*` en modelos principales, alternativas, anulaciones de Heartbeat/subagente/Compaction, hooks, anulaciones de modelo de canal y pines de ruta de sesión obsoletos. `--fix` selecciona `agentRuntime.id: "codex"` solo cuando el Plugin Codex está instalado, activado, aporta el arnés `codex` y tiene OAuth utilizable; de lo contrario selecciona `agentRuntime.id: "pi"` para que la ruta permanezca en el ejecutor predeterminado de OpenClaw.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables faltantes a los que hace referencia la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes de agente configurados. Durante las actualizaciones de paquetes, doctor omite la reparación de plugins del gestor de paquetes hasta que se complete el intercambio de paquetes; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, doctor informa el error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara la configuración obsoleta de plugins eliminando ids de plugin faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de Heartbeat y anulaciones de modelo de canal cuando el descubrimiento de plugins está sano.
- Doctor pone en cuarentena la configuración inválida de plugins desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga `config` inválida. El inicio de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor sea dueño del ciclo de vida del Gateway. Doctor aún informa la salud del Gateway/servicio y aplica reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio y limpieza heredada del servicio.
- En Linux, doctor ignora unidades systemd adicionales inactivas parecidas a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio Gateway de systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y relacionados) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay dueño de comandos configurado. El dueño de comandos es la cuenta del operador humano autorizada a ejecutar comandos solo para dueños y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el arranque del primer dueño, configura `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen recursos personales de Codex CLI en el inicio de Codex del operador. Los lanzamientos locales del servidor de aplicaciones de Codex usan inicios aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar los recursos que deberían promoverse deliberadamente.
- Doctor advierte cuando Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan binarios, variables de entorno, configuración o requisitos del sistema operativo. `doctor --fix` puede desactivar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener activa la Skill.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena los archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir anticipadamente.
- Después de las migraciones de directorio de estado, doctor advierte cuando las cuentas predeterminadas activadas de Telegram o Discord dependen de la alternativa de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso doctor.
- La resolución automática de nombres de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si antes ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de "no autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
