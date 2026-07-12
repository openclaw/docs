---
read_when:
    - Cambio del ciclo de vida, el almacenamiento, el protocolo o la autorización de las aprobaciones de exec o de Plugin
    - Añadir enlaces de aprobación o controles de aprobación nativos a un canal
    - Proyección de las aprobaciones de sesiones secundarias en las vistas principales o del orquestador
summary: Diseño de aprobaciones persistentes y enlazables directamente en la interfaz de control, las aplicaciones nativas, los canales y las sesiones principales
title: Aprobaciones del operador en múltiples superficies
x-i18n:
    generated_at: "2026-07-12T14:48:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f3dfc5d503d46bfc7a5eb94960baf2a81216ac973ef1bb1e6a0ef63f0bec6d5
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Aprobaciones del operador en múltiples superficies

Este diseño hace seguimiento de [#103505](https://github.com/openclaw/openclaw/issues/103505). Sustituye la autoridad de aprobación local al proceso por un único ciclo de vida propiedad del Gateway y respaldado por SQLite. Cada aprobación de ejecución o de plugin/herramienta propiedad del Gateway recibe un ID estable, una ruta autenticada de la interfaz de control, una resolución atómica en la que prevalece la primera respuesta y proyecciones exclusivas para operadores hacia los flujos de su sesión de origen y de sus sesiones antecesoras.

Las acciones insertadas y los enlaces profundos coexisten. No hay ningún selector de modo de aprobación.

## Objetivos

- Un objeto de aprobación duradero para las barreras de ejecución y de plugin/herramienta.
- Ruta estable `${controlUiBasePath}/approve/{approvalId}`.
- Resolución desde cualquier interfaz de control, aplicación nativa o superficie de canal autorizada.
- Comportamiento atómico en el que prevalece la primera respuesta entre superficies concurrentes.
- Los reintentos idénticos son idempotentes; las respuestas tardías en conflicto no pueden sobrescribir la ganadora.
- Los tiempos de espera agotados, los veredictos de confianza mal formados, las rutas ausentes, las cancelaciones y los reinicios se cierran de forma segura.
- Los eventos de solicitud y terminales llegan a la sesión de origen y a todos los propietarios principales o de orquestación pertinentes.
- Los canales reciben acciones tipadas de aprobación y navegación; los datos de devolución de llamada del transporte permanecen privados del canal.
- Los métodos existentes del Gateway para ejecución y plugins siguen siendo compatibles mientras su implementación converge en un único servicio.

## No son objetivos

- Persistir o reanudar la propia ejecución bloqueada de la herramienta tras reiniciar el Gateway.
- Convertir un ID o una URL de aprobación en una credencial al portador.
- Añadir solicitudes de aprobación a las transcripciones visibles para el modelo o activar agentes principales.
- Trasladar la política de aprobación, los comandos del producto o la autorización de revisores a los plugins de canal.
- Clonar el estado de aprobación por canal, dispositivo o antecesor.
- Rediseñar las listas de permitidos de ejecución, la composición de políticas de plugins o la persistencia de `allow-always`, salvo cuando sea necesario para que los resultados terminales sean inequívocos.
- Hacer que una TUI integrada sin Gateway sea accesible de forma remota en el primer incremento. Sigue siendo exclusivamente local y debe cerrarse de forma segura cuando no exista ningún revisor.

## Base previa al despliegue y mapa de evidencias

Esta tabla registra el estado de la implementación cuando se abrió #103505. Las secciones de despliegue posteriores describen los incrementos del registro duradero, las acciones tipadas, la página de enlace profundo y el cliente nativo desarrollados sobre esa base.

| Superficie           | Punto de entrada y propietario de referencia                                                                                                                                  | Comportamiento de referencia y carencia                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ejecución del agente        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | El registro en dos fases de `exec.approval.*` evita una condición de carrera temprana de `/approve`, pero el agotamiento del tiempo de espera aún puede convertirse en permiso mediante `askFallback`.                                                        |
| Barrera de herramienta del plugin  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Solicita `plugin.approval.*`; `timeoutBehavior: "allow"` puede aprobar una barrera cuyo tiempo de espera se haya agotado. El modo integrado tiene una autoridad independiente local al proceso en `src/infra/embedded-plugin-approval-broker.ts`. |
| Barrera de Node del plugin  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Crea y difunde directamente mediante el gestor de plugins, lo que duplica parte del ciclo de vida del método del servidor.                                                                                 |
| Autoridad del Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Los gestores independientes de ejecución y plugins utilizan mapas locales al proceso. Las entradas terminales persisten durante 15 segundos. La regla de que prevalece la primera respuesta solo se mantiene dentro de un proceso.                                          |
| Protocolo del Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | La ejecución dispone de un `get` solo para elementos pendientes; los plugins no tienen `get`; no existe una consulta terminal independiente del tipo para un enlace profundo.                                                                                   |
| Entrega          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Admite enrutamiento de origen, mensajes directos a aprobadores, repetición de elementos pendientes, controladores nativos y limpieza terminal en proceso. Un seguimiento independiente añade la conciliación terminal duradera.                          |
| Acciones portables  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Los botones de aprobación son acciones de comando que contienen `/approve ...`; los destinos de URL y aplicaciones web son campos de botón sin tipado.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | El renderizador analiza el texto del comando para reconocer la semántica de aprobación antes de generar datos privados de devolución de llamada.                                                                                     |
| Interfaz de control        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | La interfaz de aprobación es un cuadro de diálogo modal global. `ui/src/app-route-paths.ts` y `ui/src/app-routes.ts` utilizan rutas exactas y redirigen las rutas desconocidas a Chat.                                                    |
| Propiedad de la sesión | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Existen la propiedad del controlador, del solicitante, del antecesor explícito y del proceso de creación heredado, pero los eventos de aprobación no se proyectan a esos flujos de sesión.                                                    |
| Estado compartido      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Las transacciones inmediatas y actualizaciones condicionales existentes de Kysely permiten una operación duradera de comparación e intercambio en `state/openclaw.sqlite`.                                                                   |

Entre las pruebas actuales representativas se incluyen `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` y `ui/src/e2e/approval-flow.e2e.test.ts`.

El SDK de plugins sigue siendo el único límite entre canales y plugins. Los cambios en el entorno de ejecución y la presentación de aprobaciones deben exportarse mediante las subrutas existentes `src/plugin-sdk/approval-*.ts` y `src/plugin-sdk/interactive-runtime.ts`; el código de producción de los plugins no debe importar componentes internos del Gateway.

## Trabajo previo

Omnigent ofrece una experiencia de usuario y una semántica de fallos útiles:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) deja ASK en espera, aplica tiempos de espera por política y solo considera como aprobación una aceptación exacta.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contiene la barrera del entorno nativo del lado del servidor y la proyección de solicitudes y resoluciones de antecesores.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) proporciona la página independiente de aprobación móvil.

No se debe copiar sin espíritu crítico su afirmación sobre el almacenamiento. El estado pendiente activo actual es local al proceso en [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), y la tabla de elementos pendientes sin usar se elimina mediante [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw va deliberadamente más allá: SQLite es la autoridad y cada transición terminal es una operación de comparación e intercambio en la base de datos.

## Arquitectura y propiedad

El Gateway es el propietario del ciclo de vida:

1. Un agente, un enlace de plugin o una política de Node proporciona una solicitud específica del tipo y una vinculación de ejecución local al proceso.
2. El Gateway la valida y crea una proyección saneada para el revisor.
3. El servicio de aprobación calcula una audiencia de origen y propietarios, inserta la fila canónica y, a continuación, registra el proceso en espera.
4. Tras la inserción duradera, el Gateway publica los eventos de aprobación existentes, las proyecciones de sesión, las notificaciones de canal y las notificaciones push nativas.
5. Todas las superficies resuelven mediante el mismo servicio.
6. El servicio confirma una transición terminal, activa el proceso en espera del entorno de ejecución y publica las proyecciones terminales.
7. Un fallo en la entrega de eventos nunca revierte la decisión confirmada; los clientes se recuperan mediante `approval.get` o la repetición de la lista.

Límites de propiedad:

- `src/gateway/`: servicio de aprobación, autorización, adaptadores RPC, construcción de URL, ciclo de vida de procesos en espera y publicación de eventos.
- `src/state/`: esquema compartido y tipos generados de Kysely.
- `src/infra/`: modelos de vista de aprobación saneados y construcción de presentaciones portables.
- `src/agents/`: solicitar, esperar y aplicar el veredicto devuelto; sin persistencia.
- `src/channels/` y `extensions/*`: renderizar acciones tipadas, autorizar usuarios del canal, codificar devoluciones de llamada privadas y actualizar los controles entregados.
- `src/plugin-sdk/`: únicamente contratos públicos de aprobación y presentación.
- `ui/`: página independiente y clientes existentes de cola y cuadro de diálogo modal.

El proceso en espera en memoria es un mecanismo de notificación, no una autoridad. El registro inserta la fila e instala el proceso en espera de forma síncrona antes de publicar la solicitud, de modo que ningún componente de resolución pueda intercalarse entre esos pasos. Cada resolución posterior se confirma mediante SQLite antes de completar ese proceso en espera.

## Registro persistente

Añadir una única tabla `operator_approvals` a la base de datos de estado compartido.

| Columna                                            | Propósito                                                                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID canónico único globalmente. Se conservan los ID de ejecución existentes y los ID `plugin:` por compatibilidad con el protocolo, pero nunca se infiere el tipo a partir del prefijo.                                                 |
| `resolution_ref`                                   | Localizador base64url SHA-256 completo y único para devoluciones de llamada de transporte que no pueden incluir el ID canónico. No constituye autorización ni es el ID de una URL pública.                                              |
| `kind`                                             | Discriminador cerrado `exec \| plugin`.                                                                                                                                                                                               |
| `status`                                           | Estado cerrado `pending \| allowed \| denied \| expired \| cancelled`.                                                                                                                                                                |
| `presentation_json`                                | Proyección para revisores validada y etiquetada por tipo. Las solicitudes sin procesar del entorno de ejecución, las vinculaciones de comandos y las cargas útiles de devolución de llamada permanecen locales al proceso.             |
| `source_agent_id`, `source_session_key`            | Identidad de origen y ancla de la proyección de sesión. La clave de sesión es duradera; el UUID de sesión rotatorio no lo es.                                                                                                           |
| `audience_session_keys_json`                       | Matriz JSON ordenada y sin duplicados producida por el recorrido de propiedad acotado en anchura. Los eventos solicitados y terminales usan esta misma instantánea.                                                                    |
| `requested_by_device_id`, `requested_by_client_id` | Metadatos duraderos del solicitante y de auditoría. El ID de conexión permanece en memoria y no es una entidad principal entre superficies.                                                                                           |
| `reviewer_device_ids_json`                         | Dispositivos revisores específicos opcionales proporcionados únicamente por el entorno de ejecución de aprobaciones de confianza.                                                                                                    |
| `runtime_epoch`                                    | Época del proceso propietario de la ejecución estacionada; se usa para cancelar filas huérfanas después de un reinicio.                                                                                                               |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Temporización autoritativa.                                                                                                                                                                                                           |
| `decision`                                         | Decisión explícita del usuario cuando existe.                                                                                                                                                                                         |
| `terminal_reason`                                  | Motivo cerrado, como `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` o `gateway-restart`.                                                                                                                            |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Ganador e identidad de auditoría conservados en el servidor. Las proyecciones para revisores omiten los identificadores sin procesar del responsable de la resolución.                                                                 |
| `consumed_at_ms`, `consumed_by`                    | Protección independiente contra reproducciones para `allow-once`; el consumo no debe borrar la decisión registrada.                                                                                                                   |

Índices requeridos:

- único `(resolution_ref)`; las inserciones también rechazan la ambigüedad entre columnas `approval_id`/`resolution_ref`
- `(status, expires_at_ms)`
- `(source_session_key, created_at_ms DESC)`
- `(resolved_at_ms)` para la depuración por retención

Las matrices de audiencias son pequeñas y están acotadas. La reproducción filtrada por sesión primero selecciona las filas pendientes visibles mediante Kysely y, después, decodifica y filtra las matrices de audiencias acotadas en el código de la aplicación; no usa coincidencia de cadenas ni consultas JSON con SQL sin procesar.

Se conservan las filas terminales durante 30 días, de acuerdo con la retención de los metadatos de auditoría en `src/audit/audit-event-store.ts`. La depuración es una política fija de mantenimiento, no una nueva superficie de configuración. La base de datos es un estado privado del plano de control local, pero las API para revisores nunca deben exponer la solicitud almacenada completa ni la vinculación del entorno de ejecución.

## Máquina de estados y comparación e intercambio

Solo son válidas estas transiciones:

- `pending -> allowed`: `allow-once` o `allow-always` explícito.
- `pending -> denied`: denegación explícita, veredicto terminal malformado de confianza o ausencia de ruta de entrega.
- `pending -> expired`: se alcanza la fecha límite autoritativa.
- `pending -> cancelled`: interrupción de la ejecución, apagado ordenado o recuperación de elementos huérfanos tras un reinicio.

Todo estado terminal que no sea permitido tiene como veredicto efectivo la denegación.

La resolución usa una transacción inmediata de SQLite y una actualización condicional de Kysely equivalente a:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Si la actualización no afecta a ninguna fila, la misma transacción lee el registro:

- Inexistente o no autorizado: se devuelve que no se encontró; no se revela su existencia.
- Sigue pendiente, pero se alcanzó la fecha límite: se cambia mediante comparación e intercambio a `expired` y, después, se devuelve esa fila terminal.
- Misma decisión registrada: se devuelve un resultado idempotente correcto con el ganador registrado.
- Decisión diferente: la API unificada devuelve `applied: false` con el ganador registrado; los adaptadores heredados conservan `APPROVAL_ALREADY_RESOLVED` cuando lo exige su contrato publicado.
- Cualquier estado terminal: nunca se modifica.

`now == expires_at_ms` se considera expirado. La hora del Gateway es autoritativa.

La ejecución de `allow-once` usa una segunda operación de comparación e intercambio sobre `consumed_at_ms IS NULL`, vinculada al contexto exacto existente de comando/ejecución del sistema. La fila de aprobación permanece como registro de auditoría después del consumo.

Las entradas HTTP/RPC malformadas que no puedan autenticarse o identificar una aprobación se rechazan sin modificación y nunca pueden aprobar. Un veredicto terminal malformado recibido de un arnés/proceso de espera de confianza para una aprobación conocida produce la transición a `denied`.

## API del Gateway

Se añaden métodos para revisores independientes del tipo:

| Método                                    | Contrato                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Devuelve una proyección visible pendiente o terminal conservada.                                                                                                                                                                                                                                                            |
| `approval.resolve { id, kind, decision }` | Acepta el ID canónico o la referencia de transporte de tamaño fijo y, después, ejecuta la autorización, la validación del tipo y de las decisiones permitidas, la conciliación de la fecha límite y la operación terminal de comparación e intercambio. La respuesta siempre incluye el ID canónico. |

Después de una operación de comparación e intercambio correcta, se devuelve inmediatamente la proyección confirmada. Los eventos heredados, los reenviadores de canales y los finalizadores de inserciones son acciones posteriores de mejor esfuerzo; una superficie lenta o fallida no debe retrasar ni revertir la respuesta ganadora.

La validación de solicitudes específica del tipo permanece en `exec.approval.request` y `plugin.approval.request`. Los métodos existentes `exec.approval.get/list/waitDecision/resolve` y `plugin.approval.list/waitDecision/resolve` se convierten en adaptadores en el límite del protocolo para el servicio canónico porque forman parte de la API publicada del Gateway. Los llamadores internos migran al servicio en el mismo cambio.

Una proyección para revisores es una unión etiquetada:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* vista previa segura de la ejecución */ }
    | { kind: "plugin"; title: string; description: string /* vista previa segura del plugin */ };
  // campos comunes del ciclo de vida
};
```

La ruta estable se deriva, no se conserva. `approval.get` devuelve `urlPath`; las superficies que conozcan un origen público aprobado también pueden recibir una `url` absoluta. Las instantáneas para revisores omiten las claves de sesión de origen y de audiencia. El Gateway conserva esas claves de enrutamiento en el servidor para la proyección independiente `session.approval`.

## Eventos y acciones portátiles

El PR 1 conserva los nombres de eventos, las cargas útiles y los filtros existentes de destinatarios a nivel de registro publicados:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Esos eventos heredados pueden contener la solicitud completa del entorno de ejecución, por lo que no deben difundirse a todos los clientes con ámbito de aprobación. El PR 5 añade campos etiquetados del ciclo de vida (`status`, `sourceSessionKey`, `urlPath`, metadatos terminales y un `kind` a nivel de presentación) mediante la proyección saneada del ciclo de vida, en lugar de ampliar la entrega de eventos heredados.

Se añade un evento de proyección `session.approval` con ámbito de aprobación. Se publica una vez el evento canónico con las claves de audiencia conservadas; los suscriptores de sesión exacta reciben el mismo evento por cada clave coincidente:

- `sessionKey`: flujo que recibe la proyección.
- `sourceSessionKey`: elemento secundario/origen que activó la barrera.
- `phase`: `pending \| terminal`, discriminada según el estado de aprobación.
- una proyección segura `OperatorApproval`.

Los clientes aceptan participar mediante `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. La respuesta correcta añade un `approvalReplay` que contiene hasta 1,000 aprobaciones pendientes actuales para esa clave de flujo exacta que el cliente suscriptor también está autorizado a revisar a nivel de registro. `truncated: false` hace que la reproducción filtrada sea autoritativa y los clientes que vuelvan a conectarse sustituyen por ella su conjunto local de elementos pendientes; `truncated: true` es una señal de sobrecarga y los clientes deben conservar las entradas locales no vistas hasta que la consulta canónica o eventos posteriores del ciclo de vida las resuelvan. Un tiempo de espera duradero posterior detectado durante la reproducción emite marcadores terminales únicamente para audiencias suscritas y autorizadas a nivel de registro antes de devolver la nueva instantánea. `operator.admin` puede aceptar participar directamente; los clientes con permisos más restringidos requieren tanto una identidad de dispositivo emparejado como `operator.approvals`. La suscripción a la sesión por sí sola nunca concede visibilidad de las aprobaciones.

Se registra el evento en `operator.approvals` dentro de `src/gateway/server-broadcast.ts`. La proyección es observacional: nunca añade filas a la transcripción, emite `sessions.changed` ni activa un agente.

Se amplía `MessagePresentationAction` en `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

El núcleo crea acciones de decisión tipadas y un enlace independiente de revisión cuando hay disponible un origen absoluto aprobado de la interfaz de control. Los canales codifican una acción de aprobación en su propio formato de devolución de llamada y envían la resolución al servicio canónico. Una devolución de llamada usa el ID canónico exacto cuando cabe; en caso contrario, usa el `resolution_ref` único de resumen completo de la fila. La referencia es solo una clave compacta de consulta: siguen aplicándose la autenticación normal del Gateway, la autorización a nivel de registro, el tipo explícito, la validación de decisiones permitidas, la conciliación de la fecha límite y la operación de comparación e intercambio de la primera respuesta. Los canales no deben truncar los ID, resolver prefijos hash, analizar texto `/approve` ni inferir el tipo a partir del prefijo de un ID.

Se conservan `button.url`, `button.webApp` y los controles de aprobación respaldados por comandos como entradas de compatibilidad obsoletas del SDK de plugins. Se normalizan en el límite del SDK; todos los llamadores internos incluidos migran en el mismo PR. `/approve {id} {decision}` permanece como alternativa de texto y comando de CLI/chat, no como contrato semántico de los botones.

## Interfaz de control

La ruta es `${basePath}/approve/{approvalId}`. El ID es el único parámetro de ruta; la identidad de la sesión de origen procede del registro.

Dado que el enrutador actual tiene rutas estáticas exactas y reescribe las rutas desconocidas a Chat, detecte este enlace profundo en `ui/src/app/bootstrap.ts` antes de la normalización habitual de rutas. Reutilice la configuración normal de Gateway/autenticación, pero renderice una página de aprobación independiente fuera del contenedor de la barra lateral y del modal global.

El documento pertenece al Gateway que proporcionó su URL. Su conexión inicial ignora la selección persistente de Gateway remoto de la aplicación completa sin cambiar ni copiar la configuración de dicha selección; solo la autenticación permanece limitada a la sesión del Gateway que lo proporciona. La autenticación nativa de confianza o una sustitución de `gatewayUrl` confirmada por separado pueden redirigirlo. El núcleo reserva el espacio de nombres de un segmento `/approve` antes que las rutas HTTP de los plugins y la detección de extensiones estáticas, incluidos los identificadores que terminan en `.json` o `.js`; cuando la entrega de Control UI está deshabilitada, la ruta reservada falla de forma segura con `404`. Mantenga la página en el paquete principal de Control UI para que un fragmento de carga diferida que falle no deje una decisión de seguridad bloqueada en un indicador de carga.

Estados de la página:

- cargando
- autenticación requerida
- pendiente
- resolviendo
- aprobado o denegado aquí
- resuelto en otro lugar
- caducado
- cancelado
- prohibido/no encontrado
- error de conexión con reintento

La página llama al RPC de Gateway, no a una segunda API REST sin autenticar. Al actualizar el navegador, se vuelve a leer el estado persistente. Nunca coloca las credenciales de Gateway en la URL, la consulta ni el fragmento.

## Autorización y privacidad

La URL es un localizador, no una autorización. La resolución requiere:

1. conexión autenticada con Gateway;
2. `operator.approvals` u `operator.admin`;
3. autorización del revisor a nivel de registro.

Reglas a nivel de registro:

- `operator.admin` puede revisar.
- `reviewer_device_ids` es la fuente autoritativa cuando está presente. Solo un dispositivo
  `operator.approvals` emparejado e incluido en la lista puede revisar; el dispositivo solicitante no tiene acceso
  implícito, salvo que también figure en la lista.
- Sin una lista explícita de revisores, el dispositivo solicitante
  `operator.approvals` emparejado puede revisar su propio registro.
- Los registros realmente heredados sin vinculación de solicitante ni revisor conservan una visibilidad
  amplia para los dispositivos emparejados, de modo que las actualizaciones no dejen bloqueado el trabajo que ya está pendiente.
- Los entornos de ejecución internos sin dispositivo pueden resolver, pero no leer, mediante la conexión
  del entorno de ejecución de aprobación con ámbito limitado. Esa autorización procede únicamente del token del entorno de ejecución
  autenticado por el servidor; los campos públicos de `approval.resolve` no pueden
  generarla.
- La propiedad de la conexión activa del solicitante sigue siendo válida para los adaptadores heredados; nunca se
  deduce a partir de un nombre de cliente coincidente.
- La pertenencia a la audiencia solo cambia la presentación. Nunca amplía la autorización.

`approval.get` expone únicamente la proyección saneada para el revisor y omite las claves internas de enrutamiento de origen/audiencia. El evento `session.approval` de PR 5 incluye su único `sessionKey` de destino más `sourceSessionKey` después de que el Gateway aplique en el servidor la instantánea persistente de la audiencia. Los eventos existentes de ejecución/plugins conservan su carga útil histórica y sus destinatarios restringidos hasta que los consumidores migren. La solicitud ejecutable, la vinculación del comando y la continuación permanecen únicamente en el proceso local en espera. La fila persistente contiene la presentación segura, además de los metadatos de ciclo de vida, enrutamiento y auditoría; nunca almacena valores de entorno sin procesar, credenciales, encabezados de autenticación ni datos de devolución de llamada del canal.

## Proyección de la audiencia

Calcula la audiencia una sola vez antes de la inserción y conserva la instantánea ordenada. La propiedad es un grafo, no siempre una única cadena de padres: un hijo puede tener tanto un controlador actual como un solicitante original, y esos propietarios pueden conducir a raíces diferentes.

Usa un recorrido determinista en anchura:

1. Inicializa la cola con la clave de sesión de origen.
2. Para cada clave extraída de la cola, lee la fila más reciente del registro de subagentes y añade a la cola ambas aristas de propiedad distintas en un orden fijo: `controllerSessionKey` y, después, `requesterSessionKey`.
3. Cuando exista una fila de registro utilizable, no sigas también el linaje de entradas de sesión, que podría haber quedado obsoleto tras la redirección. De lo contrario, añade a la cola la única arista de respaldo actual: `parentSessionKey ?? spawnedBy`.
4. Normaliza y elimina duplicados al añadir a la cola, de modo que prevalezca la primera ruta, que es la más corta.
5. Detente al alcanzar 64 claves únicas; este límite de tamaño de la audiencia también acota la profundidad del recorrido.

El origen del registro es `src/agents/subagent-registry-read.ts`; los campos de propiedad se definen en `src/agents/subagent-registry.types.ts`. Los campos de respaldo de sesión se definen en `src/config/sessions/types.ts`.

Las proyecciones de solicitud y terminales usan la misma audiencia conservada, incluso si la propiedad del foco o del controlador cambia mientras la aprobación está pendiente. Esto garantiza la limpieza terminal de cada flujo de sesión de la audiencia que recibió la proyección de la solicitud. La resolución siempre se dirige al ID de aprobación de origen; las sesiones de la audiencia nunca reciben un estado de aprobación clonado. La limpieza de mensajes de canal reenviados sigue siendo la tarea posterior independiente del localizador de entrega que se describe más adelante.

No escribas mensajes en la transcripción, no inyectes instrucciones del sistema, no inicies turnos de propietarios ni emitas `sessions.changed` únicamente para una aprobación.

## Convergencia de superficies de entrega

Los controladores de aprobación nativos ya conservan las entradas de los mensajes entregados durante el tiempo suficiente para reemplazar o retirar los controles activos. Actualmente, los mensajes genéricos de aprobación reenviados descartan el `MessageReceipt`, por lo que una decisión tomada en otra superficie puede dejar sus controles anteriores con apariencia de estar pendientes. Un seguimiento independiente subsana esa carencia mediante una tabla secundaria `operator_approval_deliveries` en la base de datos de estado compartida.

Cada fila almacena el ID de aprobación, un ID de entrega único, el canal, la cuenta y la ruta exacta, un localizador de mensaje privado del canal, acotado y validado mediante JSON, las marcas de tiempo de entrega y el estado de finalización. Nunca almacena datos de devolución de llamada, tokens de decisión ni solicitudes de aprobación sin procesar. El canal se encarga de codificar el localizador y modificar el mensaje; el núcleo se encarga del estado canónico, la selección del destino, la política de reintentos y el texto alternativo de finalización.

El registro de entrega y la resolución terminal evitan de forma segura las condiciones de carrera:

1. Después de que un envío pendiente devuelva su recibo, inserte el localizador de entrega y lea el estado de aprobación principal en una sola transacción.
2. Si el elemento principal ya está en estado terminal, programe la finalización inmediata en lugar de dejar pendiente la entrega tardía.
3. Cada transición terminal confirmada programa por separado todas las filas de entrega no finalizadas; las difusiones descartables no son el desencadenante.
4. Un finalizador de canal informa `replaced`, `retired` o `unsupported`. Reemplazado suprime un mensaje terminal duplicado; retirado envía el seguimiento terminal existente; un estado no compatible o un fallo recurre al mecanismo alternativo sin revertir la CAS de aprobación.
5. Al iniciar, se reintentan las aprobaciones terminales con entregas sin finalizar, lo que hace que la limpieza sea resiliente ante el reinicio del Gateway.

Este ciclo de vida del transporte es un hook opcional del adaptador de entrega, no un renderizador ni una acción de mensaje expuesta al modelo. Actualmente, los mensajes C2C/de grupo de QQ no disponen de una API para editar, eliminar ni borrar el teclado; ese adaptador sigue sin ser compatible y solo puede mostrar el estado canónico después de un clic posterior hasta que el transporte incorpore una API de mutación.

## Semántica de reinicio, tiempo de espera y ruta

La persistencia de SQLite no implica la reanudación de la ejecución. Las vinculaciones de comandos/herramientas permanecen en memoria porque pueden contener datos de ejecución sensibles para la seguridad y no constituyen un contrato de trabajo reanudable.

Al iniciar el Gateway:

- generar una nueva época de ejecución;
- cambiar atómicamente las filas pendientes de épocas anteriores a `cancelled` con el motivo `gateway-restart`;
- conservar las filas para que sus URL expliquen lo sucedido;
- nunca ejecutar una aprobación posterior contra una vinculación de ejecución inexistente.

Los temporizadores son optimizaciones de activación. La autoridad sobre el plazo se almacena en `expires_at_ms`; las lecturas, esperas y resoluciones ejecutan la conciliación de caducidad.

Comportamiento estricto final:

- tiempo de espera agotado -> `expired`, denegar;
- sin ruta -> `denied`, denegar;
- cancelación de ejecución -> `cancelled`, denegar;
- veredicto de confianza con formato incorrecto -> `denied`, denegar;
- solo una decisión explícita permitida de autorización -> `allowed`.

El comportamiento de exec distribuido actualmente aún entra en conflicto con este contrato:

- `src/agents/bash-tools.exec-host-shared.ts` puede aplicar `askFallback`.
- `docs/tools/exec-approvals.md` y `docs/cli/approvals.md` documentan esa superficie.

Las aprobaciones de Plugin ahora aplican un cierre seguro ante tiempos de espera agotados y veredictos con formato incorrecto; el campo heredado
`timeoutBehavior` sigue aceptándose, pero se ignora. El seguimiento de semántica
estricta de exec debe actualizar conjuntamente el código, los tipos, la documentación, las pruebas y el registro de cambios, con
una revisión explícita del responsable y de seguridad. `askFallback` puede seguir describiendo
la selección de políticas previa a la barrera durante la migración, pero no debe convertir
en aprobación el tiempo de espera agotado de un registro pendiente ya creado.

## Plan de compatibilidad

- Protocolo del Gateway aditivo; sin incremento de versión del protocolo.
- Conservar los métodos y eventos de exec/Plugin existentes en el límite externo.
- Mantener los identificadores existentes, incluidos los prefijos `plugin:`, pero dejar de utilizar los prefijos como información de tipo.
- Mantener el comportamiento del comando de texto `/approve`.
- Mantener los campos heredados de URL de botón/Web App y las acciones de comando como entrada de compatibilidad del SDK de Plugin; la nueva salida del núcleo es tipada.
- Migrar todos los canales incluidos y los llamadores internos en el mismo cambio de acciones tipadas.
- Añadir una entrada al registro de cambios para la nueva URL/página y para el cambio posterior del comportamiento de tiempo de espera.
- No añadir una configuración del modo de solicitud.

## Despliegue

### PR 1: ciclo de vida duradero

- Esta nota de diseño.
- Esquema de SQLite compartido, generación de Kysely, almacén y depuración tras 30 días.
- Servicio de aprobación del Gateway, puente de espera de ejecución y gestión de elementos huérfanos tras reinicios.
- `approval.get/resolve` unificado.
- Adaptadores de métodos de exec/Plugin.
- Pruebas de prevalencia de la primera respuesta, idempotencia, caducidad, autorización y consumo.
- Todavía sin cambios en el comportamiento de la interfaz de usuario ni de los canales.

### PR 2: acciones tipadas y devoluciones de llamada de canales

- Acciones tipadas de aprobación, URL y Web App.
- Constructores de presentación del núcleo y exportaciones del SDK de Plugin.
- Codificación de devoluciones de llamada privadas del transporte con tipo de propietario explícito.
- Referencias duraderas de tamaño fijo para devoluciones de llamada de identificadores canónicos que superen los límites del transporte.
- Migración de los canales incluidos para abandonar la inferencia a partir del texto de comandos y de identificadores de aprobación.
- Verdad canónica de la primera respuesta en la superficie donde se hizo clic y actualizaciones terminales nativas activas mediante el mejor esfuerzo; la finalización duradera de mensajes de canal queda como seguimiento.
- Pruebas del SDK y de los canales incluidos.

### PR 3: enlace profundo de la interfaz de control

- Página de aprobación autenticada independiente y enrutamiento de inicio compatible con la ruta base.
- Vinculación al Gateway servidor sin modificar la selección remota guardada del operador.
- Espacio de nombres HTTP de aprobaciones propiedad del núcleo, incluidos los identificadores con apariencia de recursos.
- Carga de URL generada por el Gateway y sondeo del estado pendiente hasta que se distribuyan los eventos del ciclo de vida.
- Pruebas de ancho móvil, reconexión, respuestas en conflicto, recarga y ruta montada.

### PR 4: clientes nativos

- Las superficies de revisión de iOS y Android utilizan `approval.get/resolve` con reconocimiento de tipo; watchOS retransmite solicitudes y decisiones seguras para el revisor mediante el iPhone enlazado.
- Watch ofrece las decisiones de exec admitidas por su contrato de retransmisión compacto: permitir una vez y denegar.
- La verdad terminal canónica de la primera respuesta sustituye el estado local de decisión intentada.
- Las confirmaciones de resolución perdidas o ambiguas bloquean los controles hasta la relectura canónica.
- Las instancias de Gateway v4 distribuidas anteriormente conservan la revisión de exec mediante una alternativa restringida de métodos heredados; el estado terminal conservado entre superficies requiere los métodos unificados.
- Las advertencias para el revisor y el contexto del propietario permanecen visibles en iPhone, Watch y Android.
- Pruebas unitarias nativas, de compilación y de plataforma.

### PR 5: propagación del ciclo de vida a los ancestros

- Entrega pendiente/terminal de `session.approval` a partir de la instantánea de audiencia persistida en el PR 1.
- Suscripción a la sesión exacta, reproducción tras la reconexión y marcadores de eliminación terminales sin mutar la transcripción ni activar al agente.
- Las devoluciones de llamada del ciclo de vida se ejecutan después de la inserción/CAS duradera y nunca se convierten en autoridad de aprobación.
- Pruebas de subagentes anidados y reconexión.

### PR 6: comportamiento de cierre seguro

- Migrar `node-invoke-plugin-policy.ts` y el intermediario de Plugin integrado para eliminar la autoridad duplicada.
- Semántica estricta de tiempo de espera, formato incorrecto, ausencia de ruta, vinculación y consumo de autorización única.
- Marcar como obsoletas las configuraciones permisivas de tiempo de espera distribuidas sin respetarlas después de que una solicitud quede pendiente.
- Pruebas de contención entre múltiples superficies e inyección de fallos.

### Seguimiento: limpieza duradera de mensajes remotos

- Conservar los localizadores de entrega reenviada y llevar a estado terminal cada mensaje de canal entregado después de reiniciar.
- Mantener este ciclo de vida del transporte separado de la autoridad canónica de aprobación y de las acciones de presentación tipadas.

## Pruebas

Cobertura específica obligatoria:

- La reapertura de SQLite conserva las proyecciones pendientes y terminales.
- Dos resolutores simultáneos producen exactamente un ganador de CAS.
- Reintentar la misma decisión funciona de forma idempotente; un reintento conflictivo devuelve el ganador registrado.
- Una resolución en la fecha límite o después de ella no puede aprobar.
- `allow-once` se puede consumir exactamente una vez sin borrar el estado de auditoría terminal.
- El inicio cancela las épocas de ejecución anteriores.
- La consulta y la resolución no autorizadas no revelan la existencia del registro.
- Comportamiento de la lista explícita de revisores permitidos y del emparejamiento general de `operator.approvals`.
- Los métodos heredados de ejecución y de Plugin comparten el mismo almacén.
- Esquemas de solicitud/listado/obtención/resolución del Gateway y cargas de eventos aditivas.
- Normalización de acciones tipadas, representación alternativa, exportaciones del SDK y conmutadores de canales incluidos.
- La codificación de devoluciones de llamada de Telegram contiene datos privados del transporte y no infiere cadenas de comandos.
- Hijo directo, propietarios de controlador/solicitante ramificados, propietarios anidados, reasignación, alternativa del campo de sesión, ciclo y límite de tamaño de audiencia.
- Las matrices de audiencia solicitada y terminal son idénticas.
- Las proyecciones de propietarios no provocan mutaciones de la transcripción ni activan al agente.
- La ruta de la interfaz de control funciona en `/` y en una ruta base configurada; al actualizar, muestra el estado pendiente o terminal verdadero.
- Las respuestas simultáneas de la interfaz de control y Telegram muestran un ganador y «resuelto en otro lugar» para el perdedor.
- Los identificadores nativos de aprobación y los identificadores de propietario del Gateway conservan exactamente los bytes UTF-8 durante el enrutamiento y la conciliación.
- La negociación de la familia de RPC nativa fija una familia canónica o heredada por cada ruta admitida del Gateway y nunca retrocede silenciosamente después de utilizarse.
- La pérdida de confirmaciones de resolución nativa inmoviliza las acciones hasta la relectura canónica; una relectura fallida no puede inventar un ganador ni confirmar una actualización de Watch.
- La correlación de solicitudes de instantáneas de Watch solo se acepta para el propietario emparejado exacto del Gateway y una relectura canónica completada del iPhone.
- Prueba de la ruta de usuario mediante Testbox/Crabbox, incluida una página de aprobación con ancho de dispositivo móvil, la limpieza de acciones de Telegram y un ciclo completo de pendiente/resolución/perdedor tardío en Android, iPhone y Watch.

## Observabilidad

Emitir registros estructurados de transiciones, sin contenido, con el ID de aprobación, el tipo, la clave de sesión de origen, el estado, el motivo y la latencia. No registrar nunca la vista previa ni la vinculación sin procesar.

Registrar:

- cantidad de solicitudes por tipo;
- cantidad de estados terminales por tipo/estado/motivo;
- indicador de pendientes;
- latencia desde la solicitud hasta el estado terminal;
- resultados de las carreras de resolución: ganador, reintento idempotente, conflicto, vencimiento;
- cantidad de rutas de entrega y denegaciones por ausencia de ruta;
- cancelaciones de elementos huérfanos durante el inicio;
- tamaño de la audiencia.

Una transición confirmada se considera correcta aunque falle la entrega posterior del evento. Los suscriptores del ciclo de vida se recuperan mediante la reproducción de PR 5 y la consulta canónica. La transición duradera a estado terminal de los mensajes de canal sigue siendo la tarea de seguimiento independiente indicada anteriormente.

## Decisiones pendientes

1. **Origen de la interfaz de control accesible externamente.** Cada instantánea incluye el `urlPath` relativo estable. Solo se puede anunciar una URL absoluta desde una ubicación almacenada en caché de Tailscale Serve/Funnel después de que la exposición del Gateway se complete correctamente; `allowedOrigins`, los encabezados Host de las solicitudes, `gateway.remote.url` y los candidatos de bucle invertido/LAN destinados únicamente a la visualización no son orígenes canónicos. Telegram puede usar su contenedor Mini App autenticado para conservar la ruta de aprobación durante la inicialización. Los proxies inversos arbitrarios deben seguir usando únicamente rutas relativas hasta que exista un contrato explícito de URL pública revisado por separado. No permitir nunca que un canal infiera el origen.
2. **Transición de compatibilidad del tiempo de espera estricto de ejecución.** Los tiempos de espera de aprobación de Plugin ahora fallan de forma cerrada y `timeoutBehavior` está obsoleto. El contrato distribuido restante de `askFallback` requiere una revisión explícita de los propietarios y de seguridad, una entrada en el registro de cambios, documentación y una decisión de migración u obsolescencia antes de que deje de autorizar la ejecución cuando vence el tiempo de espera de una solicitud pendiente.
3. **Modo integrado sin Gateway.** Recomendación: mantenerlo inicialmente solo en el entorno local y convertirlo después en cliente del servicio canónico cuando exista un Gateway. No anunciar un enlace profundo que ningún servidor pueda resolver.
