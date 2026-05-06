---
read_when:
    - Ejecutar scripts desde el repositorio
    - Añadir o cambiar scripts en ./scripts
summary: 'Scripts del repositorio: propósito, alcance y notas de seguridad'
title: Secuencias de comandos
x-i18n:
    generated_at: "2026-05-06T05:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

El directorio `scripts/` contiene scripts auxiliares para flujos de trabajo locales y tareas de operaciones.
Úsalos cuando una tarea esté claramente vinculada a un script; de lo contrario, prefiere la CLI.

## Convenciones

- Los scripts son **opcionales** salvo que se mencionen en la documentación o en listas de verificación de lanzamientos.
- Prefiere las superficies de CLI cuando existan (ejemplo: el monitoreo de autenticación usa `openclaw models status --check`).
- Asume que los scripts son específicos del host; léelos antes de ejecutarlos en una máquina nueva.

## Scripts de monitoreo de autenticación

El monitoreo de autenticación se cubre en [Autenticación](/es/gateway/authentication). Los scripts en `scripts/` son extras opcionales para flujos de trabajo de teléfonos con systemd/Termux.

## Ayudante de lectura de GitHub

Usa `scripts/gh-read` cuando quieras que `gh` use un token de instalación de una GitHub App para llamadas de lectura con alcance de repositorio, dejando el `gh` normal en tu inicio de sesión personal para acciones de escritura.

Variables de entorno obligatorias:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variables de entorno opcionales:

- `OPENCLAW_GH_READ_INSTALLATION_ID` cuando quieras omitir la búsqueda de instalación basada en el repositorio
- `OPENCLAW_GH_READ_PERMISSIONS` como anulación separada por comas para el subconjunto de permisos de lectura que se solicitará

Orden de resolución del repositorio:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Ejemplos:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Al añadir scripts

- Mantén los scripts enfocados y documentados.
- Añade una entrada breve en el documento relevante (o crea una si falta).

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
