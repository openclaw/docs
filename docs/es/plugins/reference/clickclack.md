---
read_when:
    - Está instalando, configurando o auditando el plugin clickclack
summary: Añade la interfaz del canal Clickclack para enviar y recibir mensajes de OpenClaw.
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-20T00:52:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e59a11826dfc14a7c6945930547804b10e9cb5144d9cdb75657be9f8f4e9129f
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

Añade la superficie del canal Clickclack para enviar y recibir mensajes de OpenClaw.

## Distribución

- Paquete: `@openclaw/clickclack`
- Ruta de instalación: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Superficie

canales: `clickclack`

El plugin puede crear opcionalmente un canal ClickClack sincronizado con el ciclo de vida
para cada sesión de OpenClaw. Los canales de discusión gestionados usan una sesión
secundaria del mismo agente para la observación y la retransmisión, mientras que la sesión
principal asociada recibe una herramienta de solo extracción `discussion`. Consulte
[Discusiones de sesión de ClickClack](/es/channels/clickclack#session-discussions)
para conocer los requisitos de configuración y visibilidad de las herramientas de sesión.

## Documentación relacionada

- [clickclack](/es/channels/clickclack)
