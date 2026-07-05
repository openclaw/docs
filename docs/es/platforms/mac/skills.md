---
read_when:
    - Actualizando la interfaz de configuración de Skills de macOS
    - Cambiar el control de Skills o el comportamiento de instalación
summary: Interfaz de configuración de Skills en macOS y estado respaldado por Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-05T11:27:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

La aplicación de macOS expone las Skills de OpenClaw mediante el Gateway; no analiza las Skills localmente.

## Fuente de datos

- `skills.status` (Gateway) devuelve todas las Skills junto con la elegibilidad y los requisitos faltantes, incluidos los bloqueos de lista de permitidos para Skills incluidas.
- Los requisitos provienen de `metadata.openclaw.requires` en cada `SKILL.md`.

## Acciones de instalación

- `metadata.openclaw.install` define las opciones de instalación (brew/node/go/uv/download).
- La aplicación llama a `skills.install` para ejecutar instaladores en el host del Gateway.
- `security.installPolicy` (`enabled`, `targets`, `exec`), propiedad del operador, puede bloquear las instalaciones de Skills respaldadas por el Gateway antes de que se ejecute la metadata del instalador. El escaneo integrado de código peligroso (usado para instalaciones de Plugin) no está conectado al flujo de instalación de Skills.
- Si todas las opciones de instalación son `download`, el Gateway muestra todas las opciones de descarga.
- De lo contrario, el Gateway elige un instalador preferido usando las preferencias de instalación actuales (`skills.install.preferBrew`, `skills.install.nodeManager`) y los binarios del host: Homebrew primero cuando `preferBrew` está habilitado y `brew` está presente, luego `uv`, luego el gestor de Node configurado, luego Homebrew de nuevo si está disponible (incluso sin `preferBrew`), luego `go` y luego `download`.
- Las etiquetas de instalación de Node reflejan el gestor de Node configurado, incluido `yarn`.

## Claves de entorno/API

- La aplicación almacena las claves en `~/.openclaw/openclaw.json` bajo `skills.entries.<skillKey>`.
- `skills.update` aplica parches a `enabled`, `apiKey` y `env`.

## Modo remoto

- Las actualizaciones de instalación y configuración ocurren en el host del Gateway, no en el Mac local.

## Relacionado

- [Skills](/es/tools/skills)
- [Aplicación de macOS](/es/platforms/macos)
