---
read_when:
    - Diseñar la supervisión de flotas de Codex
    - Crear herramientas de OpenClaw que lean, guíen o inicien sesiones de Codex
    - Elegir entre implementación local, en Cloudflare y en VPS para Codex supervisado
summary: Plan de supervisión de flota para sesiones del servidor de aplicaciones de Codex controladas por OpenClaw.
title: Supervisor de Claw
x-i18n:
    generated_at: "2026-06-27T12:57:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Supervisor Claw

## Objetivo

Supervisor Claw permite que una instancia de OpenClaw siempre activa supervise y dirija una flota de sesiones de Codex sin cambiar la experiencia normal de usuario de Codex. Un usuario puede entrar por SSH a un host, iniciar Codex, trabajar en la TUI y aun así permitir que el supervisor lea la sesión, la oriente, la interrumpa, genere sesiones relacionadas y acepte traspasos. Las sesiones de Codex también pueden llamar de vuelta a OpenClaw mediante MCP.

## Modelo de producto

Codex sigue siendo la superficie de trabajo principal. OpenClaw supervisa Codex en lugar de ocultar Codex dentro de un subagente opaco de OpenClaw.

El Plugin de OpenClaw se llama `codex-supervisor`. `crabfleet` sigue siendo el perfil de despliegue
y flota de hosts para máquinas CRAB, no el nombre del Plugin reutilizable.

El modelo tiene tres roles:

- Codex adjunto a humano: una TUI interactiva normal de Codex iniciada mediante un servidor de aplicación compartido.
- Codex autónomo: un hilo de servidor de aplicación de Codex generado por el supervisor al que un humano puede adjuntarse más tarde.
- Claw supervisor: un agente de OpenClaw siempre activo con herramientas para estado de flota, lecturas de transcripciones, orientación, interrupción, generación y traspaso.

OpenClaw puede usar internamente su maquinaria existente de subagentes, pero el contrato externo es una sesión adjuntable de Codex con un id de hilo de Codex.

## Arquitectura

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Cada host compatible con Codex ejecuta:

- Demonio de servidor de aplicación de Codex.
- Un lanzador que siempre inicia Codex interactivo con `--remote`.
- Un conector que registra endpoints del servidor de aplicación e hilos activos con el supervisor.

El supervisor ejecuta:

- Registro de endpoints.
- Registro de sesiones.
- Pool de clientes JSON-RPC del servidor de aplicación de Codex.
- Servidor MCP para llamadas de Codex a Claw.
- Herramientas de OpenClaw para control de Claw a Codex.
- Motor de políticas para acciones autónomas, aprobaciones y prevención de bucles.

## Contrato del servidor de aplicación de Codex

Usa las API del servidor de aplicación de Codex como plano de control canónico:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Codex interactivo debe iniciarse con `codex --remote <endpoint>` para que la TUI y el supervisor se conecten al mismo servidor de aplicación. `codex exec` independiente no es hoy una sesión compartida en vivo; usa las API del servidor de aplicación para trabajo autónomo hasta que Codex admita `exec --remote`.

## Registro de sesiones

El supervisor almacena un registro por cada hilo de Codex observado:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

La implementación local puede derivar la mayoría de los campos de los metadatos del hilo de Codex. El despliegue de flota debe enriquecer los registros con identidad del host, estado de adjunción del usuario, estado de git y salud del sidecar.

## Superficie MCP para Codex

Cada Codex supervisado obtiene un servidor MCP llamado `openclaw-codex-supervisor`.

Herramientas:

- `codex_sessions_list`: lista las sesiones de Codex visibles.
- `codex_session_read`: lee una transcripción.
- `codex_session_send`: envía un mensaje a un hilo inactivo u orienta un hilo activo.
- `codex_session_interrupt`: interrumpe el turno activo.
- `codex_endpoint_probe`: verifica la conectividad del endpoint.
- `claw_report_progress`: publica el estado actual de la tarea al supervisor.
- `claw_ask`: pide ayuda o delegación al supervisor.
- `codex_spawn`: crea una nueva sesión autónoma de Codex.
- `codex_handoff`: solicita toma de control humana o de un par.

Recursos:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Superficie de control de Claw

El Claw siempre activo obtiene las mismas primitivas que las herramientas internas:

- listar sesiones y endpoints
- leer transcripciones
- enviar/orientar texto
- interrumpir trabajo activo
- generar sesiones nuevas
- resumir y asignar sesiones
- difundir instrucciones a un grupo filtrado
- marcar sesiones como bloqueadas, finalizadas o abandonadas

Comportamiento de herramientas:

- Si un hilo de destino está inactivo, `codex_session_send` se asigna a `turn/start`.
- Si un hilo de destino está activo y hay visible un id de turno en curso, se asigna a `turn/steer`.
- Si no se puede identificar el turno activo, la herramienta falla de forma cerrada en lugar de crear un turno no relacionado.
- Los controles de escritura MCP expuestos por Codex permanecen deshabilitados salvo que una política confiable solo para supervisor los habilite.
- Las lecturas de transcripciones sin procesar permanecen deshabilitadas salvo que una política confiable solo para supervisor las habilite.
- Los valores predeterminados de aprobación autónoma deniegan aprobaciones de herramientas/archivos salvo que una política explícita indique lo contrario.

## Flujo de inicio

Inicio de sesión interactivo en host:

1. El usuario entra por SSH a un host CRAB.
2. El servicio SSH inicia o verifica `codex app-server daemon start`.
3. El envoltorio de inicio de sesión lanza `codex --remote unix:// --cd <workspace>`.
4. El conector del host registra el endpoint y el hilo cargado.
5. El supervisor emite un evento de flota de alta prioridad: nueva sesión de Codex, workspace, estado adjunto a humano, vista previa de la tarea actual.
6. El Claw supervisor puede leer y orientar de inmediato.

Generación autónoma:

1. El supervisor selecciona host y workspace.
2. El conector del host abre o reanuda un hilo del servidor de aplicación de Codex.
3. El supervisor inicia el primer turno con el texto de la tarea y la configuración MCP.
4. El registro de sesiones lo marca como autónomo y adjuntable.
5. Un humano puede adjuntarse más tarde con `codex --remote <endpoint> resume <threadId>` cuando Codex admita esa UX exacta, o mediante el flujo de reanudación actual en el mismo servidor de aplicación.

## Despliegue

Plano de control preferido:

- Los conectores de host mantienen conexiones WebSocket salientes hacia el supervisor.
- El estado del supervisor vive en el almacenamiento de OpenClaw Gateway.
- El servidor de aplicación de Codex sigue siendo local para cada host; nunca expongas un servidor de aplicación sin autenticación sin procesar a internet público.

Viabilidad de Cloudflare:

- Bueno para registro, objetos duraderos, agregación de WebSocket, enrutamiento ligero de eventos y endpoints MCP/Gateway públicos.
- No basta por sí solo para control directo de hosts privados porque Workers no puede marcar sockets Unix privados arbitrarios ni servidores de aplicación en local loopback.
- Usa Cloudflare cuando cada conector de host llame a casa mediante WebSocket saliente.

Alternativa de VPS:

- Usa un servicio de Hetzner cuando se necesite control de procesos de larga duración, túneles SSH, enrutamiento de red privada o acceso al sistema de archivos local.
- Mantén el mismo protocolo: conectores de host salientes, registro de supervisor central, servidor de aplicación de Codex local.

## Seguridad

- El enlace predeterminado es un socket Unix local.
- El servidor de aplicación remoto usa token o autenticación bearer firmada.
- El conector de host se autentica ante el supervisor con un token de host acotado.
- Las herramientas del supervisor aplican política por sesión: lectura, orientación, interrupción, generación, aprobación.
- Los mensajes entre agentes incluyen `originSessionId`; el eco propio se descarta.
- La difusión requiere un filtro explícito y un conteo de destinos acotado.
- Las lecturas de transcripciones redactan secretos en el límite de OpenClaw.
- Las solicitudes de aprobación se deniegan de forma predeterminada para turnos originados por el supervisor salvo que la política las permita.

## Plan de implementación

Fase 1: MVP de supervisor local

- Agregar cliente JSON-RPC del servidor de aplicación de Codex para proxy stdio y endpoints WebSocket.
- Agregar registro de endpoints/sesiones del supervisor.
- Agregar herramientas MCP: listar, leer, enviar, interrumpir, probar.
- Agregar configuración env local para endpoints.
- Agregar pruebas con servidor de aplicación falso y una smoke en vivo de servidor de aplicación local.

Fase 2: Integración con OpenClaw

- Registrar herramientas del supervisor en el Plugin `codex-supervisor`.
- Inyectar MCP del supervisor en la configuración del hilo de Codex.
- Agregar resúmenes de sesión al contexto del agente.
- Agregar notificaciones de eventos cuando aparezcan nuevos hilos de Codex.
- Agregar configuración de política para envío/interrupción/generación autónomos.

Fase 3: Conector de flota

- El sidecar de host registra endpoint del servidor de aplicación, metadatos del host, metadatos de git/workspace y estado de adjunción humana.
- Agregar conector WebSocket saliente para plano de control de Cloudflare o VPS.
- Agregar reconexión, Heartbeat y limpieza de sesiones obsoletas.
- Agregar envoltorio de lanzador SSH para CRAB.

Fase 4: Operación autónoma

- Agregar flujos de generación/reanudación/toma de control.
- Agregar difusión y delegación.
- Agregar informes de progreso y resúmenes de estado de tareas.
- Agregar prevención de bucles y límites de tasa.
- Agregar vistas de panel.

Fase 5: Multi-Claw

- Fragmentar sesiones por grupo.
- Agregar liderazgo/arrendamiento para cada sesión.
- Agregar registro de auditoría y repetición.
- Agregar escalamiento entre grupos de Claw.

## Pruebas de aceptación

- Un humano lanza la TUI de Codex mediante un servidor de aplicación compartido.
- El supervisor lista el hilo activo mediante `thread/loaded/list`.
- El supervisor lee la transcripción mediante `thread/read`.
- El supervisor envía texto a un hilo inactivo mediante `turn/start`.
- El supervisor orienta un hilo activo mediante `turn/steer`.
- La interrupción del supervisor detiene un turno activo mediante `turn/interrupt`.
- Codex llama al MCP del supervisor y lista sesiones pares.
- Se genera un Codex autónomo y más tarde se adjunta a un humano.
- La pérdida del conector de host marca sesiones como obsoletas sin eliminar el historial.

## Preguntas abiertas

- UX exacta de adjunción de la TUI de Codex para un hilo de servidor de aplicación generado sin una TUI.
- Si Codex debería agregar `exec --remote` para ejecuciones sin interfaz compartidas en vivo.
- Propietario del estado duradero: BD de OpenClaw Gateway, Cloudflare Durable Object o base de datos VPS.
- Granularidad de política de aprobación para turnos originados por el supervisor.
- Cuánto resumen de transcripción debe inyectarse en el contexto del Claw siempre activo frente a mantenerse como herramienta/recurso.
