---
read_when:
    - Depuración de errores por falta del ámbito de operador
    - Revisión de las aprobaciones de emparejamiento de dispositivos o nodos
    - Añadir o clasificar métodos RPC del Gateway
summary: Roles de operador, ámbitos y comprobaciones en el momento de la aprobación para clientes del Gateway
title: Ámbitos del operador
x-i18n:
    generated_at: "2026-07-11T23:06:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Los ámbitos de operador limitan lo que un cliente del Gateway puede hacer después de autenticarse.
Son una medida de protección del plano de control dentro de un único dominio de operadores de confianza del Gateway,
no un aislamiento frente a múltiples inquilinos hostiles. Para lograr una separación sólida entre personas,
equipos o máquinas, ejecute Gateways independientes con distintos usuarios del sistema operativo o en hosts separados.

Relacionado: [Seguridad](/es/gateway/security), [Protocolo del Gateway](/es/gateway/protocol),
[Emparejamiento del Gateway](/es/gateway/pairing), [CLI de dispositivos](/es/cli/devices).

## Roles

Cada cliente WebSocket del Gateway se conecta con un rol:

- `operator`: clientes del plano de control, como la CLI, la interfaz de control, la automatización y
  los procesos auxiliares de confianza.
- `node`: hosts de capacidades (macOS, iOS, Android, sin interfaz gráfica) que exponen
  comandos mediante `node.invoke`.

Los métodos RPC del operador requieren el rol `operator`; los métodos originados
en nodos requieren el rol `node`.

## Niveles de ámbito

| Ámbito                  | Significado                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Estado, listas, catálogo, registros, lecturas de sesiones y otras llamadas que no realizan cambios, todo ello en modo de solo lectura.                                                                        |
| `operator.write`        | Acciones de operador que realizan cambios: enviar mensajes, invocar herramientas, actualizar la configuración de conversación/voz y retransmitir comandos de nodos. También satisface `operator.read`.         |
| `operator.admin`        | Acceso administrativo. Satisface todos los ámbitos `operator.*`. Es obligatorio para modificar la configuración, realizar actualizaciones, usar hooks nativos, acceder a espacios de nombres reservados y conceder aprobaciones de alto riesgo. |
| `operator.pairing`      | Gestión del emparejamiento de dispositivos y nodos: enumerar, aprobar, rechazar, eliminar, rotar y revocar.                                                                                                   |
| `operator.approvals`    | API de aprobación de ejecución y plugins.                                                                                                                                                                    |
| `operator.talk.secrets` | Lectura de la configuración de conversación con los secretos incluidos.                                                                                                                                      |

Los ámbitos `operator.*` futuros y desconocidos requieren una coincidencia exacta, salvo que el autor de la llamada
ya disponga de `operator.admin`.

## El ámbito del método es solo la primera barrera

Cada RPC del Gateway tiene un ámbito de método con privilegios mínimos que determina si una
solicitud llega a su manejador. Algunos manejadores aplican después comprobaciones más estrictas según
el elemento concreto que se apruebe o modifique:

- Se puede acceder a `device.pair.approve` con `operator.pairing`, pero al aprobar un
  dispositivo de operador solo se pueden emitir o conservar ámbitos que ya posea el autor de la llamada.
- Se puede acceder a `node.pair.approve` con `operator.pairing`, tras lo cual se derivan ámbitos
  de aprobación adicionales a partir de la lista de comandos declarada por el nodo pendiente.
- `chat.send` es un método con ámbito de escritura, pero los comandos de chat `/config set` y
  `/config unset` requieren además `operator.admin`,
  independientemente del ámbito del autor de la llamada para enviar mensajes de chat.

Esto permite que los operadores con ámbitos inferiores realicen acciones de emparejamiento de bajo riesgo sin
hacer que todas las aprobaciones de emparejamiento sean exclusivas de administradores.

## Aprobaciones de emparejamiento de dispositivos

Los registros de emparejamiento de dispositivos son la fuente persistente de los roles y ámbitos aprobados.
Un dispositivo ya emparejado no obtiene silenciosamente un acceso más amplio: una reconexión
que solicite un rol o ámbitos más amplios crea una nueva solicitud de ampliación pendiente.

Al aprobar una solicitud de dispositivo:

- Una solicitud sin rol de operador no necesita aprobación del ámbito de operador.
- Una solicitud para un rol de dispositivo distinto de operador (por ejemplo, `node`) requiere
  `operator.admin`, aunque `device.pair.approve` solo necesite
  `operator.pairing`.
- Una solicitud de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` requiere que el autor de la llamada ya
  disponga de ese ámbito o de `operator.admin`.
- Una solicitud de `operator.admin` requiere `operator.admin`.
- Una solicitud de reparación sin ámbitos explícitos puede heredar los ámbitos del token
  de operador existente; si ese token tiene ámbito administrativo, la aprobación sigue requiriendo
  `operator.admin`.

Las sesiones no administrativas con secreto compartido y proxy de confianza solo pueden aprobar
solicitudes de dispositivos de operador dentro de sus propios ámbitos de operador declarados; la aprobación
de roles distintos de operador es exclusiva de administradores, incluso cuando esas sesiones puedan utilizar
`operator.pairing` para otras operaciones.

En las sesiones con token de dispositivo emparejado, la gestión se limita al propio dispositivo, salvo que el autor de la llamada
disponga de `operator.admin`: un autor de llamada no administrador solo ve sus propias entradas de emparejamiento y
solo puede aprobar, rechazar, rotar, revocar o eliminar la entrada de su propio dispositivo.

## Aprobaciones de emparejamiento de nodos

Los métodos heredados `node.pair.*` utilizan un almacén independiente de emparejamiento de nodos propiedad del Gateway.
Los nodos WS utilizan en su lugar el emparejamiento de dispositivos (`role: node`), pero se aplica el mismo vocabulario
de aprobación. Consulte [Emparejamiento del Gateway](/es/gateway/pairing) para conocer la relación entre ambos
almacenes.

`node.pair.approve` deriva ámbitos obligatorios adicionales a partir de la lista de comandos
de la solicitud pendiente:

| Comandos declarados                                    | Ámbitos obligatorios                    |
| ------------------------------------------------------ | --------------------------------------- |
| ninguno                                                | `operator.pairing`                      |
| comandos de nodo que no sean de ejecución              | `operator.pairing` + `operator.write`   |
| `system.run`, `system.run.prepare` o `system.which`    | `operator.pairing` + `operator.admin`   |

La aprobación de una declaración de nodo no habilita los comandos que tienen una lista de permitidos
independiente durante la ejecución. Por ejemplo, aprobar un nodo que declara
`computer.act` requiere el ámbito de emparejamiento y el de escritura, pero solo registra la superficie.
Un administrador o propietario aún debe habilitar `computer.act`. Mientras permanezca
habilitado, invocarlo mediante el método `node.invoke`, que tiene ámbito de escritura, no
requiere ámbito administrativo para cada acción.

El emparejamiento de nodos establece la identidad y la confianza; no sustituye la propia
política de aprobación de ejecución de `system.run` del nodo.

## Autenticación mediante secreto compartido

La autenticación mediante token o contraseña compartidos del Gateway se considera acceso de operador de confianza para
ese Gateway. Las superficies HTTP compatibles con OpenAI, `/tools/invoke` y los endpoints HTTP
del historial de sesiones restauran el conjunto completo predeterminado de ámbitos de operador para la autenticación de portador
mediante secreto compartido, incluso si el autor de la llamada envía ámbitos declarados más restringidos.

Los modos que incorporan identidad, como la autenticación mediante proxy de confianza o `none` para el acceso privado,
pueden seguir respetando los ámbitos declarados explícitamente. Utilice Gateways independientes para separar
verdaderos límites de confianza.
