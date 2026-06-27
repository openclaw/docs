---
read_when:
    - Estás creando una aplicación externa, un script, un panel, un trabajo de CI o una extensión de IDE que se comunica con OpenClaw
    - Estás eligiendo entre Gateway RPC y el Plugin SDK
    - Estás integrándote con ejecuciones de agentes de Gateway, sesiones, eventos, aprobaciones, modelos o herramientas
sidebarTitle: External apps
summary: Ruta de integración actual para apps externas, scripts, paneles, trabajos de CI y extensiones de IDE
title: Integraciones de Gateway para aplicaciones externas
x-i18n:
    generated_at: "2026-06-27T11:28:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Las aplicaciones externas deberían comunicarse con OpenClaw a través del protocolo Gateway hoy. Usa
los métodos WebSocket y RPC de Gateway cuando un script, panel, trabajo de CI, extensión de IDE
u otro proceso quiera iniciar ejecuciones de agentes, transmitir eventos, esperar
resultados, cancelar trabajo o inspeccionar recursos de Gateway.

<Warning>
  Aún no hay ningún paquete cliente público de npm. No agregues nombres de paquetes cliente de OpenClaw
  como dependencias de la aplicación hasta que las notas de la versión anuncien un paquete
  publicado y esta página incluya instrucciones de instalación.
</Warning>

<Note>
  Esta página es para código fuera del proceso de OpenClaw. El código de Plugin que se ejecuta
  dentro de OpenClaw debería usar en su lugar las subrutas documentadas `openclaw/plugin-sdk/*`.
</Note>

## Qué está disponible hoy

| Superficie                              | Estado | Úsalo para                                                                                              |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| [Protocolo Gateway](/es/gateway/protocol)  | Listo  | Transporte WebSocket, saludo de conexión, ámbitos de autenticación, versionado del protocolo y eventos. |
| [Referencia RPC de Gateway](/es/reference/rpc) | Listo  | Métodos actuales de Gateway para agentes, sesiones, tareas, modelos, herramientas, artefactos y aprobaciones. |
| [`openclaw agent`](/es/cli/agent)          | Listo  | Integración de scripts de una sola ejecución cuando invocar la CLI desde el shell es suficiente.        |
| [`openclaw message`](/es/cli/message)      | Listo  | Enviar mensajes o acciones de canal desde scripts.                                                      |

El árbol de código fuente contiene trabajo interno de paquetes para una futura biblioteca cliente, pero
esa no es una superficie de instalación pública. Trátalo como un detalle de implementación preliminar
hasta que los paquetes se publiquen y tengan versiones.

## Ruta recomendada

1. Ejecuta o descubre un Gateway.
2. Conéctate mediante el [protocolo Gateway](/es/gateway/protocol).
3. Llama a métodos RPC documentados desde la [referencia RPC de Gateway](/es/reference/rpc).
4. Fija la versión de OpenClaw contra la que haces pruebas.
5. Vuelve a revisar la referencia RPC al actualizar OpenClaw.

Para ejecuciones de agentes, empieza con el RPC `agent` y combínalo con `agent.wait` cuando
necesites un resultado terminal. Para estado de conversación duradero, usa los métodos `sessions.*`.
Para integraciones de interfaz de usuario, suscríbete a eventos de Gateway y renderiza solo las
familias de eventos que tu aplicación entienda.

## Código de aplicación vs. código de Plugin

Usa RPC de Gateway cuando el código viva fuera de OpenClaw:

- scripts de Node que inician u observan ejecuciones de agentes
- trabajos de CI que llaman a un Gateway
- paneles y paneles de administración
- extensiones de IDE
- puentes externos que no necesitan convertirse en plugins de canal
- pruebas de integración con transportes de Gateway falsos o reales

Usa el SDK de Plugin cuando el código se ejecute dentro de OpenClaw:

- plugins de proveedor
- plugins de canal
- hooks de herramientas o ciclo de vida
- plugins de arnés de agente
- helpers de runtime de confianza

Las aplicaciones externas no deberían importar `openclaw/plugin-sdk/*`; esas subrutas son para
plugins cargados por OpenClaw.

## Relacionado

- [Protocolo Gateway](/es/gateway/protocol)
- [Referencia RPC de Gateway](/es/reference/rpc)
- [Comando agent de la CLI](/es/cli/agent)
- [Comando message de la CLI](/es/cli/message)
- [Bucle de agente](/es/concepts/agent-loop)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Sesiones](/es/concepts/session)
- [Tareas en segundo plano](/es/automation/tasks)
- [Agentes ACP](/es/tools/acp-agents)
- [Resumen del SDK de Plugin](/es/plugins/sdk-overview)
