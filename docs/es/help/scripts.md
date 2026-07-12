---
read_when:
    - Ejecución de scripts desde el repositorio
    - Añadir o modificar scripts en ./scripts
summary: 'Scripts del repositorio: propósito, alcance y notas de seguridad'
title: Scripts
x-i18n:
    generated_at: "2026-07-11T23:09:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` contiene scripts auxiliares para flujos de trabajo locales y tareas operativas. Úselos cuando una tarea esté claramente vinculada a un script; de lo contrario, prefiera la CLI.

## Convenciones

- Los scripts son **opcionales**, salvo que se mencionen en la documentación o en las listas de verificación de versiones.
- Prefiera las interfaces de la CLI cuando existan (ejemplo: `openclaw models status --check`).
- Suponga que los scripts son específicos del host; léalos antes de ejecutarlos en una máquina nueva.

## Scripts de supervisión de autenticación

La autenticación general de modelos se trata en [Autenticación](/es/gateway/authentication). Los scripts siguientes constituyen un sistema independiente y opcional para supervisar un **token de suscripción de Claude Code CLI** en un host remoto o sin interfaz gráfica y volver a autenticarse desde un teléfono:

- `scripts/setup-auth-system.sh` - configuración inicial: comprueba la autenticación actual, ayuda a generar un `claude setup-token` de larga duración y muestra los pasos de instalación para systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - comprueba el estado de autenticación de Claude Code y OpenClaw.
- `scripts/auth-monitor.sh` - consulta periódicamente el estado y envía una notificación (mediante el envío de OpenClaw o ntfy.sh, o ambos) cuando el token está próximo a caducar. Variables de entorno: `WARN_HOURS` (valor predeterminado: `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Ejecútelo de forma programada mediante `scripts/systemd/openclaw-auth-monitor.{service,timer}`, incluido con el proyecto (cada 30 minutos).
- `scripts/mobile-reauth.sh` - vuelve a ejecutar `claude setup-token` y muestra las URL que deben abrirse en un teléfono, para utilizarlo por SSH desde Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - scripts de Termux:Widget que se conectan al host mediante SSH, muestran una notificación breve de estado y abren la consola o las instrucciones de reautenticación cuando la autenticación ha caducado.

## Auxiliar de lectura de GitHub

Use `scripts/gh-read` cuando quiera que `gh` utilice un token de instalación de una aplicación de GitHub para realizar llamadas de lectura limitadas al repositorio, mientras mantiene la sesión personal normal de `gh` para las acciones de escritura.

Variables de entorno obligatorias:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variables de entorno opcionales:

- `OPENCLAW_GH_READ_INSTALLATION_ID` cuando quiera omitir la búsqueda de la instalación basada en el repositorio
- `OPENCLAW_GH_READ_PERMISSIONS` como anulación, separada por comas, del subconjunto de permisos de lectura que se solicitará

Orden de resolución del repositorio:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Ejemplos:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Al añadir scripts

- Mantenga los scripts bien delimitados y documentados.
- Añada una entrada breve en el documento correspondiente (o créelo si no existe).

## Contenido relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
