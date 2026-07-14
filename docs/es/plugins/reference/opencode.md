---
read_when:
    - Está instalando, configurando o auditando el plugin opencode
summary: Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode y con el catálogo nativo de sesiones.
title: Plugin de OpenCode
x-i18n:
    generated_at: "2026-07-14T13:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0a9a0b180b42ba26be21a95967a96d0012e7529076f38206c1442f77acb96647
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin de OpenCode

Añade compatibilidad con el proveedor de modelos OpenCode y el catálogo de sesiones nativo a OpenClaw.

## Distribución

- Paquete: `@openclaw/opencode-provider`
- Método de instalación: incluido en OpenClaw

## Superficie

proveedores: opencode; contratos: mediaUnderstandingProviders; catálogo de sesiones: opencode

## Sesiones nativas

OpenClaw detecta automáticamente la CLI `opencode` en el Gateway y los nodos emparejados. Las sesiones
almacenadas aparecen entonces en el grupo de la barra lateral de sesiones **OpenCode**, con exploración de
transcripciones en modo de solo lectura mediante los comandos oficiales `opencode --pure db ... --format json`
y `opencode --pure export`. El entorno restringido y el modo `--pure`
impiden que la exploración del catálogo cargue plugins del proyecto o herede credenciales
no relacionadas del Gateway.

Desactive **Catálogo de sesiones de OpenCode** en **Configuración > Plugins > OpenCode** para
deshabilitar la detección. Está habilitada de forma predeterminada.

## Documentación relacionada

- [opencode](/es/providers/opencode)
