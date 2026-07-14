---
read_when:
    - Depuración de errores de falta de ámbito de operador
    - Revisión de las aprobaciones de vinculación de dispositivos o nodos
    - Adición o clasificación de métodos RPC del Gateway
summary: Roles de operador, ámbitos y comprobaciones en el momento de la aprobación para clientes del Gateway
title: Ámbitos del operador
x-i18n:
    generated_at: "2026-07-14T13:41:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Los ámbitos de operador determinan lo que un cliente del Gateway puede hacer después de autenticarse.
Son una medida de protección del plano de control dentro de un único dominio de operadores de confianza del Gateway,
no un aislamiento multiinquilino frente a actores hostiles. Para establecer una separación sólida entre personas,
equipos o máquinas, ejecute Gateways independientes con usuarios del sistema operativo o hosts distintos.

Relacionado: [Seguridad](/es/gateway/security), [Protocolo del Gateway](/es/gateway/protocol),
[Emparejamiento del Gateway](/es/gateway/pairing), [CLI de dispositivos](/es/cli/devices).

## Roles

Cada cliente WebSocket del Gateway se conecta con un rol:

- `operator`: clientes del plano de control, como la CLI, la interfaz de control, la automatización y
  los procesos auxiliares de confianza.
- `node`: hosts de capacidades (macOS, iOS, Android, sin interfaz gráfica) que exponen
  comandos mediante `node.invoke`.

Los métodos RPC de operador requieren el rol `operator`; los métodos originados por nodos
requieren el rol `node`.

## Niveles de ámbito

| Ámbito                   | Significado                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Estado, listas, catálogo, registros, lecturas de sesiones y otras llamadas que no realizan cambios.                                                               |
| `operator.write`        | Acciones de operador que realizan cambios: enviar mensajes, invocar herramientas, actualizar la configuración de conversación/voz y retransmitir comandos de nodos. También satisface `operator.read`. |
| `operator.admin`        | Acceso administrativo. Satisface todos los ámbitos `operator.*`. Es obligatorio para modificar la configuración, realizar actualizaciones, usar hooks nativos, acceder a espacios de nombres reservados y conceder aprobaciones de alto riesgo. |
| `operator.pairing`      | Gestión del emparejamiento de dispositivos y nodos: enumerar, aprobar, rechazar, eliminar, rotar y revocar.                                                       |
| `operator.approvals`    | API de aprobación de ejecución y plugins.                                                                                                                         |
| `operator.talk.secrets` | Lectura de la configuración de conversación con los secretos incluidos.                                                                                           |

Los ámbitos `operator.*` futuros y desconocidos requieren una coincidencia exacta, salvo que el autor de la llamada
ya disponga de `operator.admin`.

## El ámbito del método es solo la primera barrera

Cada RPC del Gateway tiene un ámbito de método de privilegios mínimos que determina si una
solicitud llega a su controlador. Algunos controladores aplican después comprobaciones más estrictas según
el elemento concreto que se apruebe o modifique:

- `device.pair.approve` es accesible con `operator.pairing`, pero la aprobación de un
  dispositivo de operador solo puede emitir o conservar ámbitos que el autor de la llamada ya posea.
- `node.pair.approve` es accesible con `operator.pairing` y después deriva ámbitos de
  aprobación adicionales de la lista de comandos declarada por el nodo pendiente.
- `chat.send` es un método con ámbito de escritura, pero los comandos de chat
  `/config set` y `/config unset` requieren además `operator.admin`,
  independientemente del ámbito de envío de chat del autor de la llamada.

Esto permite que los operadores con ámbitos inferiores realicen acciones de emparejamiento de bajo riesgo sin
exigir acceso administrativo para todas las aprobaciones de emparejamiento.

## Aprobaciones de emparejamiento de dispositivos

Los registros de emparejamiento de dispositivos son la fuente persistente de los roles y ámbitos aprobados.
Un dispositivo ya emparejado no obtiene silenciosamente un acceso más amplio: una reconexión
que solicite un rol o ámbitos más amplios crea una nueva solicitud de ampliación
pendiente.

Al aprobar una solicitud de dispositivo:

- Una solicitud sin rol de operador no necesita aprobación de ámbitos de operador.
- Una solicitud para un rol de dispositivo que no sea de operador (por ejemplo, `node`) requiere
  `operator.admin`, aunque `device.pair.approve` solo necesite
  `operator.pairing`.
- Una solicitud de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` requiere que el autor de la llamada ya
  disponga de ese ámbito o de `operator.admin`.
- Una solicitud de `operator.admin` requiere `operator.admin`.
- Una solicitud de reparación sin ámbitos explícitos puede heredar los ámbitos del token
  de operador existente; si ese token tiene ámbito administrativo, la aprobación sigue requiriendo
  `operator.admin`.

Las sesiones no administrativas con secreto compartido o proxy de confianza solo pueden aprobar
solicitudes de dispositivos de operador dentro de sus propios ámbitos de operador declarados; la aprobación
de roles que no sean de operador requiere acceso administrativo, aunque esas sesiones puedan utilizar
`operator.pairing` de otro modo.

En las sesiones con token de dispositivo emparejado, la gestión se limita al propio dispositivo, salvo que el autor de la llamada
disponga de `operator.admin`: un autor de llamadas no administrativo solo ve sus propias entradas de emparejamiento y
solo puede aprobar, rechazar, rotar, revocar o eliminar la entrada de su propio dispositivo.

## Aprobaciones de emparejamiento de nodos

Los métodos heredados `node.pair.*` utilizan un almacén independiente de emparejamiento de nodos gestionado por el Gateway.
Los nodos WS utilizan en su lugar el emparejamiento de dispositivos (`role: node`), pero se aplica el mismo vocabulario
de aprobación. Consulte [Emparejamiento del Gateway](/es/gateway/pairing) para conocer la relación entre ambos
almacenes.

`node.pair.approve` deriva ámbitos obligatorios adicionales de la lista de comandos
de la solicitud pendiente:

| Comandos declarados                                                                                                    | Ámbitos obligatorios                     |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| ninguno                                                                                                                | `operator.pairing`                       |
| comandos de nodo ordinarios                                                                                            | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` o `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Aprobar una declaración de nodo no habilita los comandos que tienen una barrera independiente
de lista de permitidos en tiempo de ejecución. Por ejemplo, aprobar un nodo que declara
`computer.act` requiere emparejamiento y ámbito de escritura, pero solo registra la superficie.
Un administrador o propietario aún debe habilitar `computer.act`. Mientras permanezca
habilitado, invocarlo mediante el método con ámbito de escritura `node.invoke` no
requiere ámbito administrativo para cada acción.

El emparejamiento de nodos establece la identidad y la confianza; no sustituye la propia
política de aprobación de ejecución `system.run` de un nodo.

## Autenticación con secreto compartido

La autenticación mediante token o contraseña compartidos del Gateway se considera acceso de operador de confianza para
ese Gateway. Las superficies HTTP compatibles con OpenAI, `/tools/invoke` y los endpoints HTTP
del historial de sesiones restauran el conjunto completo de ámbitos de operador predeterminado para
la autenticación de portador con secreto compartido, aunque el autor de la llamada envíe ámbitos declarados más restringidos.

Los modos que incorporan identidad, como la autenticación mediante proxy de confianza o `none` de entrada privada,
pueden seguir respetando los ámbitos declarados explícitamente. Utilice Gateways independientes para separar
verdaderos límites de confianza.
