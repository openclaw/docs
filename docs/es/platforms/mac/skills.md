---
read_when:
    - Actualizando la interfaz de configuración de Skills en macOS
    - Cambiar el control de acceso de Skills o el comportamiento de instalación
summary: IU de configuración de Skills de macOS y estado respaldado por Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T12:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

La app de macOS muestra Skills de OpenClaw a través del Gateway; no analiza Skills localmente.

## Fuente de datos

- `skills.status` (Gateway) devuelve todos los Skills junto con la elegibilidad y los requisitos faltantes
  (incluidos los bloqueos de la lista de permitidos para Skills incluidos).
- Los requisitos se derivan de `metadata.openclaw.requires` en cada `SKILL.md`.

## Acciones de instalación

- `metadata.openclaw.install` define las opciones de instalación (brew/node/go/uv).
- La app llama a `skills.install` para ejecutar instaladores en el host del Gateway.
- `security.installPolicy`, propiedad del operador, puede bloquear instalaciones de Skills
  respaldadas por el Gateway antes de que se ejecute la metadata del instalador. El bloqueo integrado de código peligroso
  durante la instalación no forma parte del flujo de instalación de Skills.
- Si todas las opciones de instalación son `download`, el Gateway muestra todas las
  opciones de descarga.
- De lo contrario, el Gateway elige un instalador preferido usando las preferencias de instalación
  actuales y los binarios del host: Homebrew primero cuando
  `skills.install.preferBrew` está habilitado y `brew` existe, luego `uv`, luego el
  gestor de node configurado desde `skills.install.nodeManager`, y después
  alternativas como `go` o `download`.
- Las etiquetas de instalación de Node reflejan el gestor de node configurado, incluido `yarn`.

## Claves de entorno/API

- La app almacena claves en `~/.openclaw/openclaw.json` bajo `skills.entries.<skillKey>`.
- `skills.update` parchea `enabled`, `apiKey` y `env`.

## Modo remoto

- La instalación y las actualizaciones de configuración ocurren en el host del Gateway (no en la Mac local).

## Relacionado

- [Skills](/es/tools/skills)
- [app de macOS](/es/platforms/macos)
