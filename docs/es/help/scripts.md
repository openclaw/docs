---
read_when:
    - Ejecutar scripts del repositorio
    - Añadir o cambiar scripts en `./scripts`
summary: 'Scripts del repositorio: propósito, alcance y notas de seguridad'
title: Scripts
x-i18n:
    generated_at: "2026-04-24T05:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

El directorio `scripts/` contiene scripts auxiliares para flujos de trabajo locales y tareas operativas.
Úsalos cuando una tarea esté claramente vinculada a un script; en caso contrario, prefiere la CLI.

## Convenciones

- Los scripts son **opcionales** a menos que se mencionen en la documentación o en listas de comprobación de versiones.
- Prefiere las superficies de CLI cuando existan (ejemplo: la supervisión de autenticación usa `openclaw models status --check`).
- Supón que los scripts son específicos del host; léelos antes de ejecutarlos en una máquina nueva.

## Scripts de supervisión de autenticación

La supervisión de autenticación se cubre en [Autenticación](/es/gateway/authentication). Los scripts de `scripts/` son complementos opcionales para flujos de systemd/Termux en teléfonos.

## Ayudante de lectura de GitHub

Usa `scripts/gh-read` cuando quieras que `gh` use un token de instalación de GitHub App para llamadas de lectura con alcance de repositorio, mientras mantienes el `gh` normal con tu inicio de sesión personal para acciones de escritura.

Variables de entorno requeridas:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variables de entorno opcionales:

- `OPENCLAW_GH_READ_INSTALLATION_ID` cuando quieras omitir la búsqueda de instalación basada en repositorio
- `OPENCLAW_GH_READ_PERMISSIONS` como anulación separada por comas para el subconjunto de permisos de lectura que se debe solicitar

Orden de resolución del repositorio:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Ejemplos:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Al añadir scripts

- Mantén los scripts centrados y documentados.
- Añade una entrada breve en la documentación correspondiente (o créala si falta).

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
