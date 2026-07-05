---
read_when:
    - Ejecutar scripts desde el repositorio
    - Agregar o cambiar scripts en ./scripts
summary: 'Scripts del repositorio: propósito, alcance y notas de seguridad'
title: Scripts
x-i18n:
    generated_at: "2026-07-05T11:22:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` contiene scripts auxiliares para flujos de trabajo locales y tareas de operaciones. Úsalos cuando una tarea esté claramente vinculada a un script; de lo contrario, prefiere la CLI.

## Convenciones

- Los scripts son **opcionales** salvo que se mencionen en la documentación o en listas de comprobación de lanzamiento.
- Prefiere las superficies de CLI cuando existan (ejemplo: `openclaw models status --check`).
- Asume que los scripts son específicos del host; léelos antes de ejecutarlos en una máquina nueva.

## Scripts de monitoreo de autenticación

La autenticación general de modelos se trata en [Autenticación](/es/gateway/authentication). Los scripts siguientes son un sistema separado y opcional para monitorear un **token de suscripción de Claude Code CLI** en un host remoto/sin interfaz y volver a autenticarse desde un teléfono:

- `scripts/setup-auth-system.sh` - configuración única: comprueba la autenticación actual, ayuda a generar un `claude setup-token` de larga duración e imprime los pasos de instalación de systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - comprueba el estado de autenticación de Claude Code + OpenClaw.
- `scripts/auth-monitor.sh` - sondea el estado y envía una notificación (mediante OpenClaw send y/o ntfy.sh) cuando el token se acerca a su vencimiento. Env: `WARN_HOURS` (predeterminado `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Ejecútalo según una programación mediante los `scripts/systemd/openclaw-auth-monitor.{service,timer}` incluidos (cada 30 minutos).
- `scripts/mobile-reauth.sh` - vuelve a ejecutar `claude setup-token` e imprime las URL para abrir en un teléfono, para usar por SSH desde Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - scripts de Termux:Widget que se conectan por SSH al host, muestran un aviso de estado y abren la consola/instrucciones de reautenticación cuando la autenticación ha expirado.

## Ayudante de lectura de GitHub

Usa `scripts/gh-read` cuando quieras que `gh` use un token de instalación de GitHub App para llamadas de lectura con alcance de repo, mientras dejas el `gh` normal con tu inicio de sesión personal para acciones de escritura.

Env requeridas:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env opcionales:

- `OPENCLAW_GH_READ_INSTALLATION_ID` cuando quieras omitir la búsqueda de instalación basada en el repo
- `OPENCLAW_GH_READ_PERMISSIONS` como anulación separada por comas para el subconjunto de permisos de lectura que se solicitará

Orden de resolución del repo:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Ejemplos:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Al agregar scripts

- Mantén los scripts enfocados y documentados.
- Agrega una entrada breve en la documentación relevante (o crea una si falta).

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
