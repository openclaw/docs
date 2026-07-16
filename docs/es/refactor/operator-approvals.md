---
read_when:
    - Cambio del ciclo de vida, el almacenamiento, el protocolo o la autorización de las aprobaciones de exec o de plugins
    - Añadir enlaces de aprobación o controles de aprobación nativos a un canal
    - Proyección de las aprobaciones de sesiones secundarias en las vistas principales o del orquestador
summary: Diseño de aprobaciones persistentes y accesibles mediante enlaces directos en la interfaz de control, las aplicaciones nativas, los canales y las sesiones principales
title: Aprobaciones del operador en múltiples superficies
x-i18n:
    generated_at: "2026-07-16T11:58:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Aprobaciones del operador en múltiples superficies

Este diseño hace seguimiento de [#103505](https://github.com/openclaw/openclaw/issues/103505). Sustituye la autoridad de aprobación local del proceso por un único ciclo de vida propiedad del Gateway y respaldado por SQLite. Cada aprobación de ejecución o de plugin/herramienta propiedad del Gateway obtiene un ID estable, una ruta autenticada de la interfaz de control, una resolución atómica en la que prevalece la primera respuesta y proyecciones exclusivas para operadores en los flujos de su sesión de origen y sus sesiones antecesoras.

Las acciones en línea y los enlaces profundos coexisten. No hay ningún selector de modo de aprobación.

## Objetivos

- Un objeto de aprobación duradero para las barreras de ejecución y de plugin/herramienta.
- Ruta estable `${controlUiBasePath}/approve/{approvalId}`.
- Resolución desde cualquier interfaz de control, aplicación nativa o superficie de canal autorizada.
- Comportamiento atómico en el que prevalece la primera respuesta entre superficies simultáneas.
- Los reintentos idénticos son idempotentes; las respuestas tardías que entren en conflicto no pueden sobrescribir la ganadora.
- Los tiempos de espera agotados, los veredictos de confianza mal formados, las rutas ausentes, la cancelación y el reinicio producen un cierre seguro.
- Los eventos de solicitud y terminales llegan a la sesión de origen y a todos los propietarios principales o de orquestación pertinentes.
- Los canales reciben acciones tipadas de aprobación y navegación; los datos de devolución de llamada del transporte permanecen privados del canal.
- Los métodos existentes del Gateway para ejecución y plugins conservan la compatibilidad mientras su implementación converge en un único servicio.

## No son objetivos

- Conservar o reanudar la propia ejecución bloqueada de la herramienta tras reiniciar el Gateway.
- Convertir un ID o una URL de aprobación en una credencial de portador.
- Añadir solicitudes de aprobación a transcripciones visibles para el modelo o reactivar agentes principales.
- Trasladar la política de aprobación, los comandos del producto o la autorización de revisores a los plugins de canal.
- Clonar el estado de aprobación por canal, dispositivo o antecesor.
- Rediseñar las listas de permitidos de ejecución, la composición de políticas de plugins o la persistencia de `allow-always`, salvo cuando sea necesario para que los resultados terminales sean inequívocos.
- Hacer que una TUI integrada sin Gateway sea accesible de forma remota en el primer incremento. Sigue siendo exclusivamente local y debe cerrarse de forma segura cuando no haya ningún revisor.

## Referencia previa al despliegue y mapa de evidencias

Esta tabla registra el estado de la implementación cuando se abrió #103505. Las secciones de despliegue posteriores describen el registro duradero, las acciones tipadas, la página de enlaces profundos y los incrementos de clientes nativos creados sobre esa referencia.

| Superficie        | Punto de entrada y propietario de referencia                                                                                                                    | Comportamiento y carencia de referencia                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ejecución del agente | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                        | El registro en dos fases `exec.approval.*` evita una condición de carrera temprana de `/approve`, pero el tiempo de espera agotado todavía puede convertirse en permiso mediante `askFallback`. |
| Barrera de herramienta del plugin | `src/agents/agent-tools.before-tool-call.ts`                                                                                                   | Solicita `plugin.approval.*`; `timeoutBehavior: "allow"` puede aprobar una barrera cuyo tiempo de espera se ha agotado. El modo integrado tiene una autoridad local del proceso independiente en `src/infra/embedded-plugin-approval-broker.ts`. |
| Barrera de nodo del plugin | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                         | Crea y transmite directamente mediante el gestor de plugins, duplicando parte del ciclo de vida de los métodos del servidor.                                                                 |
| Autoridad del Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                | Los gestores independientes de ejecución y plugins utilizan mapas locales del proceso. Las entradas terminales persisten durante 15 segundos. La primera respuesta solo prevalece dentro de un proceso. |
| Protocolo del Gateway | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts`                              | La ejecución tiene `get` solo para elementos pendientes; el plugin no tiene `get`; no existe una consulta terminal independiente del tipo para un enlace profundo. |
| Entrega           | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Admite enrutamiento de origen, mensajes directos a aprobadores, reproducción de elementos pendientes, controladores nativos y limpieza terminal dentro del proceso. Un seguimiento independiente añade la conciliación terminal duradera. |
| Acciones portátiles | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                | Los botones de aprobación son acciones de comando que contienen `/approve ...`; los destinos de URL y aplicación web son campos de botón sin tipado. |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                        | El representador analiza el texto del comando para reconocer la semántica de aprobación antes de generar datos privados de devolución de llamada. |
| Interfaz de control | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                | La interfaz de aprobación es un cuadro de diálogo modal global. `ui/src/app-route-paths.ts` y `ui/src/app-routes.ts` utilizan rutas exactas y redirigen las rutas desconocidas al chat. |
| Propiedad de la sesión | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                             | Existen la propiedad del controlador, del solicitante, del elemento principal explícito y de la creación heredada, pero los eventos de aprobación no se proyectan en esos flujos de sesión. |
| Estado compartido | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                        | Las transacciones inmediatas existentes y las actualizaciones condicionales de Kysely permiten la comparación e intercambio duradera en `state/openclaw.sqlite`. |

Entre las pruebas actuales representativas se incluyen `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` y `ui/src/e2e/approval-flow.e2e.test.ts`.

El SDK de plugins sigue siendo el único límite para canales y plugins. Los cambios en el entorno de ejecución y la presentación de las aprobaciones deben exportarse mediante las subrutas existentes `src/plugin-sdk/approval-*.ts` y `src/plugin-sdk/interactive-runtime.ts`; el código de producción de los plugins no debe importar componentes internos del Gateway.

## Trabajo previo

Omnigent aporta una experiencia de usuario y una semántica de fallos útiles:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) deja ASK en espera, aplica tiempos de espera por política y solo considera como aprobación una aceptación exacta.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contiene la barrera del entorno nativo del lado del servidor y la proyección de solicitudes y resoluciones de los antecesores.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) proporciona la página independiente de aprobación para dispositivos móviles.

No se debe copiar sin más su afirmación sobre el almacenamiento. El estado pendiente activo actual es local del proceso en [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), y [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) elimina la tabla de elementos pendientes sin utilizar. OpenClaw va deliberadamente más allá: SQLite es la autoridad y cada transición terminal es una comparación e intercambio en la base de datos.

## Arquitectura y propiedad

El Gateway es el propietario del ciclo de vida:

1. Un agente, un enlace de plugin o una política de nodo proporciona una solicitud específica del tipo y un vínculo de ejecución local del proceso.
2. El Gateway la valida y crea una proyección depurada para el revisor.
3. El servicio de aprobación calcula el público de origen y propietarios, inserta la fila canónica y después registra el elemento en espera dentro del proceso.
4. Después de la inserción duradera, el Gateway publica los eventos de aprobación existentes, las proyecciones de sesión, las notificaciones de canal y las notificaciones push nativas.
5. Todas las superficies resuelven mediante el mismo servicio.
6. El servicio confirma una transición terminal, reactiva el elemento en espera del entorno de ejecución y publica las proyecciones terminales.
7. Un fallo en la entrega de eventos nunca revierte la decisión confirmada; los clientes se recuperan mediante `approval.get` o la reproducción de la lista.

Límites de propiedad:

- `src/gateway/`: servicio de aprobación, autorización, adaptadores RPC, construcción de URL, ciclo de vida de elementos en espera y publicación de eventos.
- `src/state/`: esquema compartido y tipos de Kysely generados.
- `src/infra/`: modelos de vista de aprobación depurados y construcción de presentaciones portátiles.
- `src/agents/`: solicitar, esperar y aplicar el veredicto devuelto; sin persistencia.
- `src/channels/` y `extensions/*`: representar acciones tipadas, autorizar a los usuarios del canal, codificar devoluciones de llamada privadas y actualizar los controles entregados.
- `src/plugin-sdk/`: solo contratos públicos de aprobación y presentación.
- `ui/`: página independiente y clientes existentes de cola y cuadro de diálogo modal.

El elemento en espera dentro del proceso es un mecanismo de notificación, no una autoridad. El registro inserta la fila e instala el elemento en espera de forma síncrona antes de publicar la solicitud, por lo que ningún proceso de resolución puede intercalarse entre esos pasos. Cada proceso de resolución posterior confirma primero mediante SQLite antes de completar ese elemento en espera.

## Registro persistente

Añada una tabla `operator_approvals` a la base de datos de estado compartido.

| Columna                                            | Propósito                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID canónico único globalmente. Conserve los ID de ejecución existentes y los ID `plugin:` para mantener la compatibilidad del protocolo, pero nunca deduzca el tipo a partir del prefijo.      |
| `resolution_ref`                                   | Localizador base64url SHA-256 completo y único para devoluciones de llamada de transporte que no pueden contener el ID canónico. No es una autorización ni un ID de URL pública. |
| `kind`                                             | Discriminador `exec \| plugin` cerrado.                                                                                                        |
| `status`                                           | Estado `pending \| allowed \| denied \| expired \| cancelled` cerrado.                                                                          |
| `presentation_json`                                | Proyección del revisor validada y etiquetada por tipo. Las solicitudes sin procesar del entorno de ejecución, los enlaces de comandos y las cargas útiles de devolución de llamada permanecen locales al proceso.               |
| `source_agent_id`, `source_session_key`            | Identidad de origen y anclaje de proyección de la sesión. La clave de sesión es persistente; el UUID de sesión rotativo no lo es.                                          |
| `audience_session_keys_json`                       | Matriz JSON ordenada y sin duplicados producida por el recorrido de propiedad en anchura acotado. Los eventos solicitados y terminales utilizan esta misma instantánea. |
| `requested_by_device_id`, `requested_by_client_id` | Metadatos persistentes del solicitante y de auditoría. El ID de conexión permanece en memoria y no es una entidad principal entre superficies.                                         |
| `reviewer_device_ids_json`                         | Dispositivos revisores específicos opcionales proporcionados únicamente por el entorno de ejecución de aprobación de confianza.                                                  |
| `runtime_epoch`                                    | Época del proceso propietaria de la ejecución estacionada; se utiliza para cancelar filas huérfanas después de un reinicio.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Temporización autoritativa.                                                                                                                         |
| `decision`                                         | Decisión explícita del usuario cuando existe.                                                                                                       |
| `terminal_reason`                                  | Motivo cerrado como `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` o `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Identidad del ganador y de auditoría conservada en el servidor. Las proyecciones del revisor omiten los identificadores sin procesar del resolutor.                                           |
| `consumed_at_ms`, `consumed_by`                    | Protección de repetición independiente para `allow-once`; el consumo no debe borrar la decisión registrada.                                                       |

Índices requeridos:

| Índice                                     | Propósito                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `(resolution_ref)` único                  | Rechazar la ambigüedad entre columnas `approval_id`/`resolution_ref` durante la inserción. |
| `(status, expires_at_ms)`                  | Buscar aprobaciones pendientes y conciliar los plazos autoritativos.               |
| `(source_session_key, created_at_ms DESC)` | Reproducir aprobaciones recientes para una sesión de origen.                             |
| `(resolved_at_ms)`                         | Depurar las aprobaciones terminales conservadas conforme a la política fija de retención.  |

Las matrices de audiencia son pequeñas y acotadas. La reproducción filtrada por sesión selecciona primero las filas pendientes visibles mediante Kysely y después decodifica y filtra las matrices de audiencia acotadas en el código de la aplicación; no utiliza coincidencias de cadenas ni consultas JSON mediante SQL sin procesar.

Conserve las filas terminales durante 30 días, en consonancia con la retención de metadatos de auditoría en `src/audit/audit-event-store.ts`. La depuración es una política fija de mantenimiento, no una nueva superficie de configuración. La base de datos es un estado privado del plano de control local, pero las API de revisores nunca deben exponer la solicitud almacenada completa ni el enlace del entorno de ejecución.

## Máquina de estados y comparación e intercambio

Solo son válidas estas transiciones:

- `pending -> allowed`: `allow-once` o `allow-always` explícito.
- `pending -> denied`: denegación explícita, veredicto terminal mal formado de confianza o ausencia de ruta de entrega.
- `pending -> expired`: se alcanzó el plazo autoritativo.
- `pending -> cancelled`: interrupción de la ejecución, apagado ordenado o recuperación de elementos huérfanos tras el reinicio.

Todo estado terminal distinto del permitido tiene como veredicto efectivo la denegación.

La resolución utiliza una transacción SQLite inmediata y una actualización condicional de Kysely equivalente a:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Si la actualización no afecta a ninguna fila, la misma transacción lee el registro:

- Ausente o no autorizado: devolver no encontrado; no revelar su existencia.
- Aún pendiente, pero se alcanzó el plazo: aplicar comparación e intercambio para cambiarlo a `expired` y después devolver esa fila terminal.
- Misma decisión registrada: devolver un resultado idempotente correcto con el ganador registrado.
- Decisión diferente: la API unificada devuelve `applied: false` con el ganador registrado; los adaptadores heredados conservan `APPROVAL_ALREADY_RESOLVED` cuando lo exige su contrato publicado.
- Cualquier estado terminal: no modificarlo nunca.

`now == expires_at_ms` está vencido. La hora del Gateway es autoritativa.

La ejecución de `allow-once` utiliza un segundo CAS sobre `consumed_at_ms IS NULL`, vinculado al contexto exacto existente del comando o de la ejecución del sistema. La fila de aprobación permanece como registro de auditoría después del consumo.

Las entradas HTTP/RPC mal formadas que no se puedan autenticar o no identifiquen una aprobación se rechazan sin modificaciones y nunca pueden aprobar. Un veredicto terminal mal formado recibido de un arnés o proceso de espera de confianza para una aprobación conocida cambia a `denied`.

## API del Gateway

Añada métodos de revisor independientes del tipo:

| Método                                    | Contrato                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Devuelve una proyección terminal pendiente visible o conservada.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Acepta el ID canónico o una referencia de transporte de tamaño fijo y después ejecuta la autorización, la validación del tipo y de la decisión permitida, la conciliación del plazo y el CAS terminal. La respuesta siempre contiene el ID canónico. |

Después de un CAS correcto, devuelva inmediatamente la proyección confirmada. Los eventos heredados, los reenviadores de canales y los finalizadores push son acciones posteriores de mejor esfuerzo; una superficie lenta o con errores no debe retrasar ni revertir la respuesta ganadora.

La validación de solicitudes específica del tipo permanece en `exec.approval.request` y `plugin.approval.request`. Los elementos `exec.approval.get/list/waitDecision/resolve` y `plugin.approval.list/waitDecision/resolve` existentes se convierten en adaptadores del límite del protocolo para el servicio canónico porque forman parte de la API publicada del Gateway. Los invocadores internos migran al servicio en el mismo cambio.

Una proyección del revisor es una unión etiquetada:

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

La ruta estable se deriva, no se conserva. `approval.get` devuelve `urlPath`; las superficies que conozcan un origen público aprobado también pueden recibir un `url` absoluto. Las instantáneas del revisor omiten las claves de sesión del origen y de la audiencia. El Gateway conserva esas claves de enrutamiento en el servidor para la proyección independiente `session.approval`.

## Eventos y acciones portátiles

El PR 1 conserva los nombres de eventos publicados, las cargas útiles y los filtros de destinatarios existentes a nivel de registro:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Esos eventos heredados pueden contener la solicitud completa del entorno de ejecución, por lo que no deben difundirse a todos los clientes limitados al ámbito de aprobación. El PR 5 añade campos etiquetados del ciclo de vida (`status`, `sourceSessionKey`, `urlPath`, metadatos terminales y un `kind` a nivel de presentación) mediante la proyección saneada del ciclo de vida en lugar de ampliar la entrega de eventos heredados.

Añada un evento de proyección `session.approval` limitado al ámbito de aprobación. Publique una vez el evento canónico con las claves de audiencia conservadas; los suscriptores de la sesión exacta reciben el mismo evento por cada clave coincidente:

- `sessionKey`: flujo que recibe la proyección.
- `sourceSessionKey`: elemento secundario u origen que activó el control.
- `phase`: `pending \| terminal`, discriminado según el estado de aprobación.
- una proyección `OperatorApproval` segura.

Los clientes se suscriben mediante `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. La respuesta correcta añade un `approvalReplay` que contiene hasta 1,000 aprobaciones pendientes actuales para esa clave exacta de flujo que el cliente suscriptor también está autorizado a revisar a nivel de registro. `truncated: false` hace que la reproducción filtrada sea autoritativa y los clientes que se vuelvan a conectar sustituyen su conjunto local de elementos pendientes por ella; `truncated: true` es una señal de sobrecarga y los clientes deben conservar las entradas locales no vistas hasta que la búsqueda canónica o los eventos posteriores del ciclo de vida las resuelvan. Un tiempo de espera persistente posterior detectado durante la reproducción emite marcadores de eliminación terminales únicamente para las audiencias suscritas y autorizadas a nivel de registro antes de devolver la nueva instantánea. `operator.admin` puede suscribirse directamente; los clientes con un ámbito más restringido requieren tanto una identidad de dispositivo emparejado como `operator.approvals`. La suscripción a una sesión por sí sola nunca concede visibilidad sobre las aprobaciones.

Registre el evento en `operator.approvals` dentro de `src/gateway/server-broadcast.ts`. La proyección es observacional: nunca añade filas a la transcripción, emite `sessions.changed` ni activa un agente.

Amplíe `MessagePresentationAction` en `src/interactive/payload.ts`:

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

Core crea acciones de decisión tipadas y un enlace de revisión independiente cuando hay disponible un origen absoluto aprobado de la interfaz de control. Los canales codifican una acción de aprobación en su propio formato de devolución de llamada y envían la resolución al servicio canónico. Una devolución de llamada usa el ID canónico exacto cuando cabe; de lo contrario, usa el `resolution_ref` de resumen completo único de la fila. La referencia es solo una clave de búsqueda compacta: se siguen aplicando la autenticación normal del Gateway, la autorización del registro, el tipo explícito, la validación de decisiones permitidas, la conciliación de plazos y la operación CAS de primera respuesta. Los canales no deben truncar los ID, resolver prefijos de hash, analizar el texto `/approve` ni inferir el tipo a partir del prefijo de un ID.

Mantenga `button.url`, `button.webApp` y los controles de aprobación respaldados por comandos como entradas de compatibilidad obsoletas del SDK de plugins. Normalícelos en el límite del SDK; migre todos los llamadores internos incluidos en la misma PR. `/approve {id} {decision}` sigue siendo una alternativa textual y un comando de CLI/chat, no el contrato semántico del botón.

## Interfaz de control

La ruta es `${basePath}/approve/{approvalId}`. El ID es el único parámetro de ruta; la identidad de la sesión de origen procede del registro.

Como el enrutador actual tiene rutas estáticas exactas y reescribe las rutas desconocidas a Chat, detecte este enlace profundo en `ui/src/app/bootstrap.ts` antes de la normalización habitual de rutas. Reutilice la configuración normal de Gateway/autenticación, pero renderice una página de aprobación independiente fuera del contenedor de la barra lateral y del modal global.

El documento pertenece al Gateway que sirvió su URL. Su conexión inicial ignora la selección persistente de Gateway remoto de la aplicación completa sin cambiar ni copiar la configuración de dicha selección; solo la autenticación queda limitada a la sesión del Gateway servidor. La autenticación nativa de confianza o una anulación `gatewayUrl` confirmada por separado puede redirigirlo. El núcleo reserva el espacio de nombres de un segmento `/approve` antes de las rutas HTTP de plugins y de la detección de extensiones estáticas, incluidos los ID que terminan en `.json` o `.js`; cuando el servicio de la interfaz de control está deshabilitado, la ruta reservada se cierra de forma segura con `404`. Mantenga la página en el paquete principal de la interfaz de control para que un fragmento de carga diferida fallido no deje una decisión de seguridad atascada en un indicador de carga.

Estados de la página:

- cargando
- autenticación requerida
- pendiente
- resolviendo
- aprobado o denegado aquí
- resuelto en otro lugar
- vencido
- cancelado
- prohibido/no encontrado
- error de conexión con reintento

La página llama al RPC del Gateway, no a una segunda API REST sin autenticar. Al actualizar el navegador, se vuelve a leer el estado persistente. Nunca coloca las credenciales del Gateway en la URL, la consulta ni el fragmento.

## Autorización y privacidad

La URL es un localizador, no una autoridad. La resolución requiere:

1. conexión autenticada al Gateway;
2. `operator.approvals` o `operator.admin`;
3. autorización del revisor a nivel de registro.

Reglas a nivel de registro:

- `operator.admin` puede revisar.
- `reviewer_device_ids` tiene autoridad cuando está presente. Solo puede revisar un dispositivo
  `operator.approvals` emparejado que figure en la lista; el dispositivo solicitante no tiene acceso
  implícito a menos que también figure en ella.
- Sin una lista explícita de revisores, el dispositivo solicitante
  `operator.approvals` emparejado puede revisar su propio registro.
- Los registros realmente heredados sin vinculación de solicitante ni revisor conservan una visibilidad amplia
  para los dispositivos emparejados, de modo que las actualizaciones no dejen bloqueado el trabajo ya pendiente.
- Los entornos de ejecución internos sin dispositivo pueden resolver, pero no leer, mediante la conexión
  del entorno de ejecución de aprobación con ámbito limitado. Esa autoridad procede únicamente del token
  del entorno de ejecución autenticado por el servidor; los campos públicos `approval.resolve` no pueden
  generarla.
- La propiedad de la conexión activa del solicitante sigue siendo válida para los adaptadores heredados; nunca se
  infiere a partir de un nombre de cliente coincidente.
- La pertenencia a la audiencia solo cambia la presentación. Nunca amplía la autorización.

`approval.get` expone únicamente la proyección saneada para revisores y omite las claves internas de enrutamiento de origen/audiencia. El evento `session.approval` de la PR 5 lleva su único destino `sessionKey` más `sourceSessionKey` después de que el Gateway aplique en el servidor la instantánea de audiencia persistente. Los eventos existentes de ejecución/plugins conservan su carga útil histórica y sus destinatarios restringidos hasta que los consumidores migren. La solicitud ejecutable, la vinculación del comando y la continuación permanecen únicamente en el proceso local en espera. La fila persistente contiene la presentación segura, además de los metadatos de ciclo de vida, enrutamiento y auditoría; nunca almacena valores de entorno sin procesar, credenciales, encabezados de autenticación ni datos de devolución de llamada del canal.

## Proyección de audiencia

Calcule la audiencia una vez antes de la inserción y conserve la instantánea ordenada. La propiedad es un grafo, no siempre una única cadena de antecesores: un elemento secundario puede tener tanto un controlador actual como un solicitante original, y esos propietarios pueden conducir a raíces diferentes.

Use un recorrido determinista en anchura:

1. Inicialice la cola con la clave de sesión de origen.
2. Para cada clave extraída de la cola, lea la fila más reciente del registro de subagentes y añada a la cola ambas aristas de propiedad distintas en un orden fijo: `controllerSessionKey` y después `requesterSessionKey`.
3. Cuando exista una fila de registro utilizable, no siga también el linaje de la entrada de sesión, que podría estar obsoleto tras una redirección. De lo contrario, añada a la cola la única arista alternativa actual `parentSessionKey ?? spawnedBy`.
4. Normalice y elimine duplicados al añadir a la cola para que prevalezca la primera ruta, que es la más corta.
5. Deténgase al alcanzar 64 claves únicas; este límite de tamaño de audiencia también limita la profundidad del recorrido.

El origen del registro es `src/agents/subagent-registry-read.ts`; los campos de propiedad se definen en `src/agents/subagent-registry.types.ts`. Los campos alternativos de sesión se definen en `src/config/sessions/types.ts`.

Las proyecciones solicitadas y terminales usan la misma audiencia persistente aunque la propiedad del foco/controlador cambie mientras la aprobación está pendiente. Esto garantiza la limpieza terminal de cada flujo de sesión de la audiencia que haya recibido la proyección de solicitud. La resolución siempre apunta al ID de aprobación de origen; las sesiones de la audiencia nunca reciben un estado de aprobación clonado. La limpieza de mensajes de canal reenviados sigue siendo el paso posterior independiente de localización de entrega que se describe a continuación.

No escriba mensajes en la transcripción, inyecte instrucciones del sistema, inicie turnos de propietarios ni emita `sessions.changed` únicamente por una aprobación.

## Convergencia de superficies de entrega

Los controladores de aprobación nativos ya conservan sus entradas de mensajes entregados durante el tiempo suficiente para sustituir o retirar los controles activos. Actualmente, los mensajes de aprobación genéricos reenviados descartan el `MessageReceipt`, por lo que una decisión tomada en otra superficie puede dejar sus controles anteriores con apariencia de pendientes. Un paso posterior independiente cubre esta carencia con una tabla secundaria `operator_approval_deliveries` en la base de datos de estado compartida.

Cada fila almacena el ID de aprobación, un ID de entrega único, el canal/la cuenta/la ruta exacta, un localizador de mensajes privado del canal limitado y validado como JSON, las marcas de tiempo de entrega y el estado de finalización. Nunca almacena datos de devolución de llamada, tokens de decisión ni solicitudes de aprobación sin procesar. El canal controla la codificación del localizador y la modificación del mensaje; el núcleo controla el estado canónico, la selección de destino, la política de reintentos y el texto terminal alternativo.

El registro de la entrega y la resolución terminal gestionan de forma segura las condiciones de carrera:

1. Después de que un envío pendiente devuelva su recibo, inserte el localizador de entrega y lea el estado de la aprobación principal en una sola transacción.
2. Si la aprobación principal ya está en estado terminal, programe la finalización inmediata en lugar de dejar pendiente la entrega tardía.
3. Cada transición terminal confirmada programa por separado todas las filas de entrega sin finalizar; las difusiones descartables no son el desencadenante.
4. Un finalizador de canal informa de `replaced`, `retired` o `unsupported`. La sustitución suprime un mensaje terminal duplicado; la retirada envía el seguimiento terminal existente; la falta de compatibilidad o un fallo recurre a la alternativa sin revertir la operación CAS de aprobación.
5. El inicio reintenta las aprobaciones terminales con entregas sin terminar, lo que hace que la limpieza sea resistente a los reinicios del Gateway.

Este ciclo de vida del transporte es un enlace opcional del adaptador de entrega, no un renderizador ni una acción de mensaje orientada al modelo. Actualmente, los mensajes C2C/grupales de QQ no disponen de una API para editar, eliminar ni borrar el teclado; ese adaptador sigue sin ser compatible y solo puede mostrar la verdad canónica tras un clic posterior hasta que el transporte incorpore una API de modificación.

## Semántica de reinicio, tiempo de espera y ruta

La persistencia en SQLite no implica la reanudación de la ejecución. Las vinculaciones de comandos/herramientas permanecen en memoria porque pueden contener datos confidenciales de seguridad del entorno de ejecución y no constituyen un contrato de trabajo reanudable.

Al iniciar el Gateway:

- genere una nueva época del entorno de ejecución;
- cambie atómicamente las filas pendientes de épocas anteriores a `cancelled` con el motivo `gateway-restart`;
- conserve las filas para que sus URL expliquen lo ocurrido;
- nunca ejecute una aprobación posterior si falta la vinculación del entorno de ejecución.

Los temporizadores son optimizaciones de activación. La autoridad del plazo se almacena en `expires_at_ms`; las lecturas, esperas y resoluciones ejecutan todas la conciliación del vencimiento.

Comportamiento estricto final:

- tiempo de espera -> `expired`, denegar;
- sin ruta -> `denied`, denegar;
- interrupción de ejecución -> `cancelled`, denegar;
- veredicto de confianza con formato incorrecto -> `denied`, denegar;
- solo una decisión explícita de permitir que esté autorizada -> `allowed`.

El comportamiento de ejecución distribuido actualmente sigue entrando en conflicto con este contrato:

- `src/agents/bash-tools.exec-host-shared.ts` puede aplicar `askFallback`.
- `docs/tools/exec-approvals.md` y `docs/cli/approvals.md` documentan esa superficie.

Las aprobaciones de plugins ahora se cierran de forma segura al agotarse el tiempo de espera y ante veredictos con formato incorrecto; el campo heredado
`timeoutBehavior` sigue aceptándose, pero se ignora. El seguimiento de semántica estricta
de ejecución debe actualizar conjuntamente el código, los tipos, la documentación, las pruebas y el registro de cambios, con
una revisión explícita de los responsables y de seguridad. `askFallback` puede seguir describiendo
la selección de políticas anterior a la puerta durante la migración, pero no debe convertir en aprobación
el tiempo de espera agotado de un registro pendiente ya creado.

## Plan de compatibilidad

- Protocolo del Gateway aditivo; sin incremento de la versión del protocolo.
- Conserve los métodos y eventos existentes de ejecución/plugins en el límite externo.
- Mantenga los ID existentes, incluidos los prefijos `plugin:`, pero deje de usar los prefijos como información de tipo.
- Mantenga el comportamiento del comando de texto `/approve`.
- Mantenga los campos de URL/aplicación web de los botones heredados y las acciones de comandos como entradas de compatibilidad del SDK de plugins; la nueva salida del núcleo es tipada.
- Migre todos los canales incluidos y los llamadores internos en el mismo cambio de acciones tipadas.
- Añada una entrada al registro de cambios para la nueva URL/página y para el posterior cambio de comportamiento del tiempo de espera.
- No añada una configuración de modo de obtención.

## Despliegue

### PR 1: ciclo de vida persistente

- Esta nota de diseño.
- Esquema SQLite compartido, generación de Kysely, almacén y depuración a los 30 días.
- Servicio de aprobación del Gateway, puente de espera del entorno de ejecución y gestión de elementos huérfanos tras reinicios.
- `approval.get/resolve` unificado.
- Adaptadores de métodos de ejecución/plugins.
- Pruebas de prevalencia de la primera respuesta, idempotencia, vencimiento, autorización y consumo.
- Todavía no hay cambios en el comportamiento de la interfaz de usuario ni de los canales.

### PR 2: acciones tipadas y devoluciones de llamada de canales

- Acciones tipadas de aprobación, URL y aplicación web.
- Constructores de presentación del núcleo y exportaciones del SDK de plugins.
- Codificación de retrollamadas privada del transporte con tipo de propietario explícito.
- Referencias duraderas de tamaño fijo para retrollamadas de ID canónicos que superan los límites del transporte.
- Migración de los canales incluidos para abandonar la inferencia basada en texto de comandos e ID de aprobación.
- Estado canónico de la primera respuesta en la superficie pulsada y actualizaciones terminales nativas activas mediante el mejor esfuerzo; la terminalización duradera de mensajes de canal queda como trabajo posterior.
- Pruebas del SDK y de los canales incluidos.

### PR 3: Enlace profundo de la interfaz de control

- Página de aprobación autenticada independiente y enrutamiento de inicio compatible con la ruta base.
- Vinculación con el Gateway servidor sin modificar la selección remota guardada del operador.
- Espacio de nombres HTTP de aprobación propiedad del núcleo, incluidos los ID con apariencia de recurso.
- Carga útil de URL generada por el Gateway y sondeo del estado pendiente hasta que se incorporen los eventos de ciclo de vida.
- Pruebas de ancho móvil, reconexión, respuestas simultáneas, recarga y ruta montada.

### PR 4: clientes nativos

- Las superficies de revisión de iOS y Android usan `approval.get/resolve` con reconocimiento del tipo; watchOS retransmite solicitudes y decisiones seguras para el revisor mediante el iPhone enlazado.
- El Watch ofrece las decisiones de ejecución admitidas por su contrato compacto de retransmisión: permitir una vez y denegar.
- El estado terminal canónico de la primera respuesta sustituye al estado local del intento de decisión.
- Las confirmaciones de resolución perdidas o ambiguas bloquean los controles hasta la relectura canónica.
- Las instancias anteriores publicadas del Gateway v4 conservan la revisión de ejecución mediante un mecanismo alternativo limitado al método heredado; para conservar el estado terminal entre superficies se requieren los métodos unificados.
- Las advertencias para el revisor y el contexto del propietario permanecen visibles en iPhone, Watch y Android.
- Pruebas unitarias, de compilación y de plataforma nativas.

### PR 5: propagación del ciclo de vida a los ancestros

- Entrega pendiente/terminal de `session.approval` desde la instantánea de audiencia persistida en el PR 1.
- Suscripción a la sesión exacta, reproducción tras la reconexión y marcadores terminales de eliminación sin mutar la transcripción ni despertar al agente.
- Las retrollamadas del ciclo de vida se ejecutan después de la inserción/CAS duradera y nunca se convierten en autoridad de aprobación.
- Pruebas de subagentes anidados y reconexión.

### PR 6: comportamiento de cierre ante fallos

- Migrar `node-invoke-plugin-policy.ts` y el intermediario de plugins integrado para eliminar la autoridad duplicada.
- Semántica estricta de tiempo de espera, datos malformados, ausencia de ruta, vinculación y consumo de permitir una vez.
- Dejar obsoletos los ajustes permisivos de tiempo de espera publicados sin respetarlos después de que una solicitud quede pendiente.
- Pruebas de contención entre múltiples superficies e inyección de fallos.

### Seguimiento: limpieza duradera de mensajes remotos

- Persistir los localizadores de entrega reenviada y terminalizar todos los mensajes de canal entregados después de un reinicio.
- Mantener este ciclo de vida del transporte separado de la autoridad canónica de aprobación y de las acciones tipadas de presentación.

## Pruebas

Cobertura específica requerida:

- La reapertura de SQLite conserva las proyecciones pendientes y terminales.
- Dos resolutores simultáneos producen exactamente un ganador de CAS.
- El reintento de la misma decisión se completa de forma idempotente; un reintento conflictivo devuelve el ganador registrado.
- La resolución en la fecha límite o después de ella no puede aprobar.
- `allow-once` puede consumirse exactamente una vez sin borrar el estado terminal de auditoría.
- El inicio cancela las épocas anteriores del entorno de ejecución.
- La consulta y resolución no autorizadas no revelan la existencia del registro.
- Comportamiento de la lista explícita de revisores permitidos y del `operator.approvals` enlazado general.
- Los métodos heredados de ejecución y plugins comparten el mismo almacén.
- Esquemas de solicitud/listado/consulta/resolución del Gateway y cargas útiles aditivas de eventos.
- Normalización de acciones tipadas, representación alternativa, exportaciones del SDK y cambios de canales incluidos.
- La codificación de retrollamadas de Telegram contiene datos privados del transporte y no realiza inferencias basadas en cadenas de comandos.
- Hijo directo, propietarios de controlador/solicitante ramificados, propietarios anidados, reasignación, mecanismo alternativo del campo de sesión, ciclo y límite de tamaño de audiencia.
- Las matrices de audiencia solicitada y terminal son idénticas.
- Las proyecciones del propietario no provocan mutaciones de la transcripción ni despiertan al agente.
- La ruta de la interfaz de control funciona en `/` y en una ruta base configurada; la actualización muestra el estado pendiente o terminal.
- Las respuestas simultáneas de la interfaz de control y Telegram muestran un ganador y «resuelto en otro lugar» para el perdedor.
- Los identificadores de aprobación nativos y los identificadores de propietario del Gateway conservan exactamente los bytes UTF-8 durante el enrutamiento y la conciliación.
- La negociación de la familia RPC nativa fija una familia canónica o heredada por cada ruta admitida del Gateway y nunca retrocede silenciosamente después de usarla.
- Las confirmaciones de resolución nativas perdidas bloquean las acciones hasta la relectura canónica; una relectura fallida no puede inventar un ganador ni confirmar una actualización del Watch.
- La correlación de solicitudes de instantáneas del Watch solo se acepta para el propietario exacto del Gateway enlazado y tras completar una relectura canónica en el iPhone.
- Pruebas del recorrido del usuario mediante Testbox/Crabbox, incluida una página de aprobación con ancho móvil, la limpieza de acciones de Telegram y un recorrido completo de pendiente/resolución/perdedor tardío en Android, iPhone y Watch.

## Observabilidad

Emitir registros estructurados y sin contenido de las transiciones con el ID de aprobación, el tipo, la clave de sesión de origen, el estado, el motivo y la latencia. No registrar nunca la vista previa ni la vinculación sin procesar.

Supervisar:

- recuento de solicitudes por tipo;
- recuento terminal por tipo/estado/motivo;
- indicador de pendientes;
- latencia desde la solicitud hasta el estado terminal;
- resultados de las carreras de resolución: ganador, reintento idempotente, conflicto, caducado;
- recuento de rutas de entrega y denegaciones por ausencia de ruta;
- cancelaciones de elementos huérfanos al inicio;
- tamaño de la audiencia.

Una transición confirmada se considera correcta aunque falle la entrega posterior del evento. Los suscriptores del ciclo de vida se recuperan mediante la reproducción del PR 5 y la consulta canónica. La terminalización duradera de mensajes de canal sigue siendo el trabajo posterior independiente descrito anteriormente.

## Decisiones pendientes

1. **Origen de la interfaz de control accesible externamente.** Cada instantánea contiene el `urlPath` relativo estable. Solo se puede anunciar una URL absoluta desde una ubicación almacenada en caché de Tailscale Serve/Funnel después de que la exposición del Gateway se complete correctamente; `allowedOrigins`, los encabezados Host de las solicitudes, `gateway.remote.url` y los candidatos de bucle invertido/LAN destinados únicamente a visualización no son orígenes canónicos. Telegram puede usar su contenedor autenticado de Mini App para conservar la ruta de aprobación durante el arranque. Los proxies inversos arbitrarios deben seguir usando únicamente rutas relativas hasta que exista un contrato explícito de URL pública revisado por separado. No permitir nunca que un canal adivine el origen.
2. **Transición de compatibilidad al tiempo de espera estricto de ejecución.** Los tiempos de espera de aprobación de plugins ahora se cierran ante fallos y `timeoutBehavior` está obsoleto. El contrato publicado restante de `askFallback` requiere una revisión explícita de los propietarios y de seguridad, un registro de cambios, documentación y una decisión de migración u obsolescencia antes de dejar de autorizar la ejecución cuando vence el tiempo de espera de una solicitud pendiente.
3. **Modo integrado sin Gateway.** Recomendación: mantenerlo inicialmente solo en local y, después, convertirlo en cliente del servicio canónico cuando exista un Gateway. No anunciar un enlace profundo que ningún servidor pueda resolver.
