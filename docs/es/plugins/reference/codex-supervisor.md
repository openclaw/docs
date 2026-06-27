---
read_when:
    - Estás instalando, configurando o auditando el plugin codex-supervisor
summary: Supervisa las sesiones del servidor de aplicaciones de Codex desde OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T12:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin Codex Supervisor

Supervisa las sesiones del servidor de aplicaciones de Codex desde OpenClaw.

## Distribución

- Paquete: `@openclaw/codex-supervisor`
- Ruta de instalación: incluido en OpenClaw

## Superficie

contratos: herramientas

<!-- openclaw-plugin-reference:manual-start -->

## Listado de sesiones

`codex_sessions_list` se limita de forma predeterminada a las sesiones de Codex cargadas. Define `include_stored` para incluir el historial almacenado; el plugin usa la ruta de listado exclusiva de la base de datos de estado del servidor de aplicaciones de Codex y limita los resultados almacenados a 200 de forma predeterminada. Pasa `max_stored_sessions` para reducir o aumentar ese límite, hasta 1000.

<!-- openclaw-plugin-reference:manual-end -->
