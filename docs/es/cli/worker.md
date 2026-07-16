---
read_when:
    - Operación o depuración de trabajadores en la nube iniciados por el Gateway
    - Verificación de la admisión de workers, la asignación de sesiones o el aislamiento de herramientas locales
summary: Referencia interna para operadores del entorno de ejecución restringido de trabajadores en la nube
title: Trabajador
x-i18n:
    generated_at: "2026-07-16T11:36:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` es el punto de entrada de entorno de ejecución restringido que un orquestador de trabajadores
en la nube inicia dentro de un entorno de trabajador preparado. No es un
comando de uso general para registrar trabajadores manualmente.

El Gateway instala el paquete de OpenClaw correspondiente y abre el túnel SSH
inverso con la clave del host fijada. El iniciador de trabajadores ejecuta este comando con una
asignación preparada. El comando se conecta a través del socket local reenviado por el túnel y
se admite con el rol dedicado `worker`.

## Contrato de inicio

El comando lee exactamente un sobre JSON de inicio acotado desde la entrada estándar.
El sobre contiene la ubicación del socket local, la credencial de trabajador emitida, la identidad
del paquete y del protocolo, la época del propietario y la única sesión y turno asignados.
La credencial nunca se acepta mediante argumentos de la línea de comandos, y esta página
no proporciona intencionadamente ningún ejemplo de credencial ni de sobre creado manualmente.

La admisión se cierra ante errores si el sobre no es válido, se rechaza la credencial,
las funciones del paquete o del protocolo no coinciden, o la sesión y la época del propietario
ya no están vigentes. Los operadores deben iniciar los trabajadores mediante el orquestador de trabajadores
en la nube en lugar de invocar directamente este punto de entrada.

## Límite del entorno de ejecución

El proceso ejecuta el bucle normal del agente integrado con un backend restringido:

- Las herramientas de programación `read`, `write`, `edit`, `apply_patch`, `exec` y `process`
  se ejecutan localmente en el espacio de trabajo del trabajador.
- Las llamadas al modelo utilizan el proxy de inferencia del Gateway. No se carga ningún perfil local
  de autenticación del modelo.
- Las escrituras de la transcripción utilizan la RPC de confirmación de transcripciones del Gateway.
- Las actualizaciones de transmisión y del ciclo de vida de las herramientas utilizan la RPC de eventos en vivo del Gateway.
- Solo se aceptan la sesión y el turno asignados.

El modo de trabajador no inicia canales, superficies HTTP del Gateway ni el inicio automático de plugins
más allá del conjunto de herramientas de la sesión asignada. Utiliza un directorio de estado desechable y no dispone
de credenciales persistentes de proveedores ni de forjas.

El envío de sesiones entre trabajadores no está disponible en este modo. La ubicación y
el envío siguen bajo control del Gateway: un operador puede enviar una sesión local existente
de un árbol de trabajo administrado a través del Gateway, mientras que un proceso de trabajador no puede
enviarse a sí mismo ni enviar a otro trabajador.

La asignación preparada contiene el contexto de la transcripción, la hoja base aceptada,
la secuencia de confirmaciones y el cursor de eventos en vivo. Al reconectarse el túnel, el proceso
vuelve a admitirse con la misma credencial y época del propietario, conserva la base
de la transcripción aceptada, reproduce la cola de eventos en vivo no confirmados y vuelve a asociarse a un
turno de inferencia en curso con la misma identidad. El mensaje de inferencia terminal
es la fuente autoritativa si se perdieron deltas transmitidos. Una época del propietario posterior
impone una barrera al proceso y provoca una salida limpia.

Un rechazo de transcripción `stale-base-leaf` detiene inmediatamente la ejecución actual. El modo de
trabajador no reintenta la secuencia rechazada en una hoja diferente, por lo que no
se produce ninguna confirmación duplicada; cualquier cola aún no confirmada que permanezca en memoria de esa
ejecución se pierde. El reinicio corresponde al propietario de ubicación del hito 3, que debe
crear una asignación nueva a partir de la transcripción autoritativa y
el registro de confirmaciones del Gateway. Del mismo modo, el reinicio de un proceso del Gateway finaliza un turno de
inferencia pendiente con un error del proveedor; solo la reconexión de un túnel o del WebSocket
del trabajador puede volver a asociarse a un flujo de inferencia activo del mismo proceso.

Consulte [Protocolo del Gateway](/es/gateway/protocol#worker-role-and-closed-protocol) para conocer la
superficie RPC cerrada del trabajador y [Plan de trabajadores en la nube](/es/plan/cloud-workers) para conocer el
modelo de arquitectura y seguridad.
