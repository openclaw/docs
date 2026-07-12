---
read_when:
    - Actualización de la interfaz de configuración de Skills en macOS
    - Cambiar la restricción de Skills o el comportamiento de instalación
summary: Interfaz de configuración de Skills en macOS y estado respaldado por el Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-11T23:15:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

La aplicación para macOS expone las Skills de OpenClaw mediante el Gateway; no analiza las Skills localmente.

## Fuente de datos

- `skills.status` (Gateway) devuelve todas las Skills, junto con su elegibilidad y los requisitos que faltan, incluidos los bloqueos de la lista de permitidos para las Skills incluidas.
- Los requisitos proceden de `metadata.openclaw.requires` en cada `SKILL.md`.

## Acciones de instalación

- `metadata.openclaw.install` define las opciones de instalación (brew/node/go/uv/download).
- La aplicación llama a `skills.install` para ejecutar los instaladores en el host del Gateway.
- La política `security.installPolicy` administrada por el operador (`enabled`, `targets`, `exec`) puede bloquear las instalaciones de Skills respaldadas por el Gateway antes de que se procese la metadata del instalador. El análisis integrado de código peligroso (utilizado para las instalaciones de Plugins) no está conectado al flujo de instalación de Skills.
- Si todas las opciones de instalación son `download`, el Gateway muestra todas las opciones de descarga.
- De lo contrario, el Gateway elige un instalador preferido según las preferencias de instalación actuales (`skills.install.preferBrew`, `skills.install.nodeManager`) y los binarios del host: primero Homebrew cuando `preferBrew` está habilitado y `brew` está presente; después `uv`; luego, el gestor de Node configurado; a continuación, Homebrew de nuevo si está disponible (incluso sin `preferBrew`); después `go`; y, por último, `download`.
- Las etiquetas de instalación de Node reflejan el gestor de Node configurado, incluido `yarn`.

## Claves de entorno/API

- La aplicación almacena las claves en `~/.openclaw/openclaw.json`, bajo `skills.entries.<skillKey>`.
- `skills.update` actualiza parcialmente `enabled`, `apiKey` y `env`.

## Modo remoto

- Las actualizaciones de instalación y configuración se realizan en el host del Gateway, no en el Mac local.

## Contenido relacionado

- [Skills](/es/tools/skills)
- [Aplicación para macOS](/es/platforms/macos)
