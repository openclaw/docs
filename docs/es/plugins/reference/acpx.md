---
read_when:
    - Está instalando, configurando o auditando el plugin acpx
summary: Backend de ejecución ACP de OpenClaw con gestión de sesiones y transporte a cargo del plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-14T13:58:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c0e4333157a0519474e2be77a6cc1f86c1626769bc58fe752ad53eab3c1808f5
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend de ejecución ACP de OpenClaw con gestión de sesiones y transporte a cargo del Plugin.

## Distribución

- Paquete: `@openclaw/acpx`
- Ruta de instalación: npm; ClawHub

## Superficie

Skills; catálogo de sesiones: pi

## Sesiones nativas de Pi

El entorno de ejecución incluido detecta automáticamente el almacén de sesiones de Pi en el Gateway y en los
nodos emparejados. Las sesiones almacenadas aparecen en el grupo **Pi** de la barra lateral de sesiones, con
exploración de transcripciones de solo lectura desde el formato de sesiones JSONL documentado de Pi. El
catálogo admite los directorios de sesiones `settings.json` globales y del proyecto, además de
`PI_CODING_AGENT_DIR` y `PI_CODING_AGENT_SESSION_DIR`. Las rutas relativas se resuelven
desde el directorio que contiene su archivo `settings.json`.

Desactive **Pi Session Catalog** en **Config > Plugins > ACPX Runtime** para
deshabilitar la detección. Está habilitada de forma predeterminada.

## Documentación relacionada

- [acpx](/es/tools/acp-agents-setup)
