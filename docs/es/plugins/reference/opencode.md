---
read_when:
    - Está instalando, configurando o auditando el plugin opencode
summary: Añade compatibilidad con el proveedor de modelos OpenCode a OpenClaw.
title: Plugin de OpenCode
x-i18n:
    generated_at: "2026-07-16T11:49:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Añade compatibilidad con el proveedor de modelos OpenCode a OpenClaw.

## Distribución

- Paquete: `@openclaw/opencode-provider`
- Ruta de instalación: incluido en OpenClaw

## Superficie

proveedores: `opencode`; contratos: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Sesiones nativas

OpenClaw detecta automáticamente la CLI `opencode` en el Gateway y en los nodos emparejados. Las sesiones
almacenadas aparecen en el grupo **OpenCode** de la barra lateral de sesiones, con exploración
de transcripciones de solo lectura mediante los comandos oficiales `opencode --pure db ... --format json`
y `opencode --pure export`. El entorno restringido y el modo `--pure`
impiden que la exploración del catálogo cargue plugins del proyecto o herede credenciales
del Gateway no relacionadas.

Desactive **OpenCode Session Catalog** en **Config > Plugins > OpenCode** para
deshabilitar la detección. Está habilitada de forma predeterminada.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [OpenCode](/es/providers/opencode)
