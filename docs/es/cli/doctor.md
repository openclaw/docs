---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una comprobación rápida de estado
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T05:22:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
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
- `--repair`: aplica las reparaciones recomendadas sin preguntar
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de configuración de servicio personalizada cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras
- `--generate-gateway-token`: genera y configura un token de gateway
- `--deep`: analiza servicios del sistema para detectar instalaciones adicionales de gateway

Notas:

- Las solicitudes interactivas (como correcciones de keychain/OAuth) solo se ejecutan cuando stdin es un TTY y **no** está establecido `--non-interactive`. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de Plugin para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los Plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina las claves de configuración desconocidas, enumerando cada eliminación.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones y pueden archivarlos como `.deleted.<timestamp>` para recuperar espacio de forma segura.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de trabajos cron y puede reescribirlos en el lugar antes de que el programador tenga que normalizarlos automáticamente en tiempo de ejecución.
- Doctor repara dependencias faltantes de tiempo de ejecución de Plugins incluidos sin requerir acceso de escritura al paquete OpenClaw instalado. Para instalaciones npm propiedad de root o unidades systemd reforzadas, establece `OPENCLAW_PLUGIN_STAGE_DIR` en un directorio con permisos de escritura como `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican la normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor informa una advertencia de alta señal con corrección (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta actual del comando, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto sin formato.
- Si falla la inspección de SecretRef de canal en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- La autorresolución de nombre de usuario de Telegram `allowFrom` (`doctor --fix`) requiere un token de Telegram resoluble en la ruta actual del comando. Si la inspección del token no está disponible, doctor informa una advertencia y omite la autorresolución en esa ejecución.

## macOS: sobrescrituras de entorno de `launchctl`

Si ejecutaste anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor sobrescribe tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
