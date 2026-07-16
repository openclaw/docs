---
read_when:
    - Está instalando, configurando o auditando el plugin acpx
summary: Backend de ejecución ACP de OpenClaw con gestión de sesiones y transporte a cargo del plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T11:50:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend del entorno de ejecución ACP de OpenClaw con gestión de sesiones y transporte a cargo del Plugin.

## Distribución

- Paquete: `@openclaw/acpx`
- Vía de instalación: npm; ClawHub

## Superficie

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Sesiones nativas de Pi

El entorno de ejecución incluido detecta automáticamente el almacén de sesiones de Pi en el Gateway y los nodos
emparejados. Las sesiones almacenadas aparecen en el grupo **Pi** de la barra lateral de sesiones, con
exploración de transcripciones de solo lectura a partir del formato de sesiones JSONL documentado de Pi. El
catálogo admite los directorios de sesiones `settings.json` del proyecto y globales, además de
`PI_CODING_AGENT_DIR` y `PI_CODING_AGENT_SESSION_DIR`. Las rutas relativas se resuelven
desde el directorio que contiene su archivo `settings.json`.

Desactive **Pi Session Catalog** en **Config > Plugins > ACPX Runtime** para
deshabilitar la detección. Está habilitada de forma predeterminada.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [acpx](/es/tools/acp-agents-setup)
