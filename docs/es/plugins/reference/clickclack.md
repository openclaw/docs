---
read_when:
    - Está instalando, configurando o auditando el plugin clickclack
summary: Añade la interfaz del canal Clickclack para enviar y recibir mensajes de OpenClaw.
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-21T09:02:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fcb39341009946dc38a12cc24496e65fd704ed3f2f9aff44bb2dd29fdedaef26
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

Añade la superficie del canal Clickclack para enviar y recibir mensajes de OpenClaw.

## Distribución

- Paquete: `@openclaw/clickclack`
- Método de instalación: npm; ClawHub: `clawhub:@openclaw/clickclack`

## Superficie

canales: `clickclack`; contratos: `tools`

<!-- openclaw-plugin-reference:manual-start -->

El plugin puede crear opcionalmente un canal ClickClack sincronizado con el ciclo de vida
para cada sesión de OpenClaw. Los canales de discusión gestionados usan una sesión
secundaria del mismo agente para la observación y la retransmisión, mientras que la sesión
principal adjunta recibe una herramienta `discussion` de solo extracción. Consulte
[Discusiones de sesión de ClickClack](/es/channels/clickclack#session-discussions)
para conocer los requisitos de configuración y visibilidad de las herramientas de sesión.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [clickclack](/es/channels/clickclack)
