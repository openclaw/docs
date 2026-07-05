---
read_when:
    - Estás creando una aplicación externa, un script, un panel, un trabajo de CI o una extensión de IDE que se comunica con OpenClaw
    - Está eligiendo entre Gateway RPC y el SDK de Plugin
    - Estás integrando con ejecuciones de agentes, sesiones, eventos, aprobaciones, modelos o herramientas de Gateway
sidebarTitle: External apps
summary: Ruta de integración actual para apps externas, scripts, paneles, trabajos de CI y extensiones de IDE
title: Integraciones de Gateway para aplicaciones externas
x-i18n:
    generated_at: "2026-07-05T11:18:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ff41c23b5312d4a9f91c8c512d205810b04481fc2e1ea80d0506141658f77f
    source_path: gateway/external-apps.md
    workflow: 16
---

Las aplicaciones externas se comunican con OpenClaw mediante el protocolo Gateway: transporte
WebSocket más métodos RPC. Úsalo cuando un script, panel, trabajo de CI, extensión
de IDE u otro proceso quiera iniciar ejecuciones de agentes, transmitir eventos, esperar
resultados, cancelar trabajo o inspeccionar recursos de Gateway.

<Warning>
  Todavía no hay un paquete cliente npm público. No agregues nombres de paquetes cliente de
  OpenClaw como dependencias de aplicación hasta que las notas de la versión anuncien un paquete
  publicado y esta página incluya instrucciones de instalación.
</Warning>

<Note>
  Esta página es para código fuera del proceso de OpenClaw. El código de Plugin que se ejecuta
  dentro de OpenClaw debe usar en su lugar las subrutas documentadas `openclaw/plugin-sdk/*`.
</Note>

## Qué está disponible hoy

| Superficie                              | Estado | Úsalo para                                                                                  |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| [Protocolo Gateway](/es/gateway/protocol)  | Listo  | Transporte WebSocket, negociación de conexión, ámbitos de autenticación, versionado del protocolo y eventos. |
| [Referencia RPC de Gateway](/es/reference/rpc) | Listo  | Métodos actuales de Gateway para agentes, sesiones, tareas, modelos, herramientas, artefactos y aprobaciones. |
| [`openclaw agent`](/es/cli/agent)          | Listo  | Integración puntual con scripts cuando invocar la CLI es suficiente.                        |
| [`openclaw message`](/es/cli/message)      | Listo  | Enviar mensajes o acciones de canal desde scripts.                                          |

Un futuro paquete de biblioteca cliente está en desarrollo internamente, pero todavía no es una
superficie de instalación pública. Trátalo como un detalle de implementación preliminar hasta que una
versión anuncie un paquete publicado y versionado.

## Ruta recomendada

1. Ejecuta o descubre un Gateway.
2. Conéctate mediante el [protocolo Gateway](/es/gateway/protocol).
3. Llama a métodos RPC documentados de la [referencia RPC de Gateway](/es/reference/rpc).
4. Fija la versión de OpenClaw contra la que haces pruebas.
5. Vuelve a consultar la referencia RPC al actualizar OpenClaw.

Para ejecuciones de agentes, empieza con el RPC `agent` y combínalo con `agent.wait` para obtener un
resultado terminal. Para estado de conversación duradero, usa los métodos `sessions.*`.
Para integraciones de IU, suscríbete a eventos de Gateway y renderiza solo las
familias de eventos que tu aplicación entienda.

## Código de aplicación frente a código de Plugin

Usa RPC de Gateway cuando el código viva fuera de OpenClaw:

- scripts de Node que inician u observan ejecuciones de agentes
- trabajos de CI que llaman a un Gateway
- paneles y paneles de administración
- extensiones de IDE
- puentes externos que no necesitan convertirse en plugins de canal
- pruebas de integración con transportes Gateway falsos o reales

Usa el SDK de Plugin cuando el código se ejecute dentro de OpenClaw:

- plugins de proveedor
- plugins de canal
- hooks de herramientas o de ciclo de vida
- plugins de arnés de agente
- helpers de runtime de confianza

Las aplicaciones externas no deben importar `openclaw/plugin-sdk/*`; esas subrutas son para
plugins cargados por OpenClaw.

## Relacionado

- [Protocolo Gateway](/es/gateway/protocol)
- [Referencia RPC de Gateway](/es/reference/rpc)
- [Comando CLI agent](/es/cli/agent)
- [Comando CLI message](/es/cli/message)
- [Bucle de agente](/es/concepts/agent-loop)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Sesiones](/es/concepts/session)
- [Tareas en segundo plano](/es/automation/tasks)
- [Agentes ACP](/es/tools/acp-agents)
- [Resumen del SDK de Plugin](/es/plugins/sdk-overview)
