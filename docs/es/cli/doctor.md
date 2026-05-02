---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de la CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-02T20:43:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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

- `--no-workspace-suggestions`: desactiva las sugerencias de búsqueda/memoria del área de trabajo
- `--yes`: acepta los valores predeterminados sin preguntar
- `--repair`: aplica las reparaciones recomendadas que no son de servicio sin preguntar; las instalaciones y reescrituras del servicio del Gateway siguen requiriendo confirmación interactiva o comandos explícitos del Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración de servicio personalizada cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras y reparaciones que no sean de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: escanea los servicios del sistema en busca de instalaciones adicionales del Gateway

Notas:

- Las solicitudes interactivas (como las correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está definido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de salud sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando por completo los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio del Gateway ausentes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` si falta un servicio, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también escanea `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos antiguos de trabajos cron y puede reescribirlos en el lugar antes de que el planificador tenga que normalizarlos automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el antiguo `~/.openclaw/bin/ensure-whatsapp.sh`; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando cron carece del entorno de bus de usuario de systemd.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables configurados que faltan cuando el registro puede resolverlos, y la pasada de doctor de 2026.5.2 instala automáticamente los plugins descargables que una configuración antigua ya usa antes de marcar la configuración como tocada para esa versión.
- Doctor repara la configuración obsoleta de plugins eliminando ids de plugins ausentes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de heartbeat y sobrescrituras de modelo de canal cuando el descubrimiento de plugins está saludable.
- Doctor pone en cuarentena la configuración inválida de plugins desactivando la entrada afectada `plugins.entries.<id>` y eliminando su carga útil `config` inválida. El arranque del Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Define `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor posee el ciclo de vida del Gateway. Doctor sigue informando la salud del Gateway/servicio y aplica reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd inactivas adicionales similares al Gateway y no reescribe los metadatos de comando/punto de entrada de un servicio systemd del Gateway en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay ningún propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos solo de propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, define `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen recursos personales de la CLI de Codex en el inicio de Codex del operador. Los lanzamientos locales del servidor de app de Codex usan inicios aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar recursos que deberían promoverse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de ejecución actual porque faltan bins, variables de entorno, configuración o requisitos del sistema operativo. `doctor --fix` puede desactivar esas skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener activa la skill.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir de forma anticipada.
- Después de las migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen de la alternativa de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso de doctor.
- La resolución automática de nombres de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática para esa pasada.

## macOS: sobrescrituras de entorno de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor sobrescribe tu archivo de configuración y puede causar errores persistentes de “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
