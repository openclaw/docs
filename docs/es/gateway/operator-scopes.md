---
read_when:
    - Depuración de errores por falta de ámbito del operador
    - Revisión de las aprobaciones de vinculación de dispositivos o nodos
    - Adición o clasificación de métodos RPC del Gateway
summary: Roles de operador, ámbitos y comprobaciones durante la aprobación para clientes del Gateway
title: Ámbitos del operador
x-i18n:
    generated_at: "2026-07-12T14:32:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Los ámbitos de operador controlan lo que un cliente del Gateway puede hacer después de autenticarse.
Son una barrera de protección del plano de control dentro de un único dominio de operadores de Gateway de confianza,
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

Los métodos RPC del operador requieren el rol `operator`; los métodos originados en nodos
requieren el rol `node`.

## Niveles de ámbito

| Ámbito                  | Significado                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Estado, listas, catálogo, registros, lecturas de sesiones y otras llamadas que no realizan modificaciones, todo ello en modo de solo lectura.                                                                         |
| `operator.write`        | Acciones de operador que realizan modificaciones: enviar mensajes, invocar herramientas, actualizar la configuración de conversación/voz y retransmitir comandos de nodos. También satisface `operator.read`.          |
| `operator.admin`        | Acceso administrativo. Satisface todos los ámbitos `operator.*`. Se requiere para modificar la configuración, realizar actualizaciones, usar hooks nativos, acceder a espacios de nombres reservados y aprobar acciones de alto riesgo. |
| `operator.pairing`      | Gestión del emparejamiento de dispositivos y nodos: enumerar, aprobar, rechazar, eliminar, rotar y revocar.                                                                                                           |
| `operator.approvals`    | API de aprobación de ejecución y plugins.                                                                                                                                                                             |
| `operator.talk.secrets` | Lectura de la configuración de conversación con los secretos incluidos.                                                                                                                                               |

Los ámbitos `operator.*` futuros y desconocidos requieren una coincidencia exacta, salvo que el llamador
ya disponga de `operator.admin`.

## El ámbito del método es solo la primera barrera

Cada RPC del Gateway tiene un ámbito de método con privilegios mínimos que determina si una
solicitud llega a su controlador. Algunos controladores aplican después comprobaciones más estrictas en función de
la entidad concreta que se aprueba o modifica:

- Se puede acceder a `device.pair.approve` con `operator.pairing`, pero la aprobación de un
  dispositivo de operador solo puede emitir o conservar ámbitos que el llamador ya tenga.
- Se puede acceder a `node.pair.approve` con `operator.pairing`; después, deriva ámbitos de
  aprobación adicionales a partir de la lista de comandos declarada por el nodo pendiente.
- `chat.send` es un método con ámbito de escritura, pero los comandos de chat `/config set` y
  `/config unset` requieren además `operator.admin`,
  independientemente del ámbito del llamador para enviar mensajes de chat.

Esto permite que los operadores con ámbitos inferiores realicen acciones de emparejamiento de bajo riesgo sin
hacer que todas las aprobaciones de emparejamiento sean exclusivas de administradores.

## Aprobaciones de emparejamiento de dispositivos

Los registros de emparejamiento de dispositivos son la fuente persistente de los roles y ámbitos aprobados.
Un dispositivo ya emparejado no obtiene un acceso más amplio de forma silenciosa: una reconexión
que solicite un rol o ámbitos más amplios crea una nueva solicitud de actualización pendiente.

Al aprobar una solicitud de dispositivo:

- Una solicitud sin rol de operador no necesita aprobación de un ámbito de operador.
- Una solicitud para un rol de dispositivo que no sea de operador (por ejemplo, `node`) requiere
  `operator.admin`, aunque `device.pair.approve` solo necesite
  `operator.pairing`.
- Una solicitud de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` requiere que el llamador ya
  disponga de ese ámbito o de `operator.admin`.
- Una solicitud de `operator.admin` requiere `operator.admin`.
- Una solicitud de reparación sin ámbitos explícitos puede heredar los ámbitos del token
  de operador existente; si ese token tiene ámbito de administrador, la aprobación sigue requiriendo
  `operator.admin`.

Las sesiones no administrativas con secreto compartido y proxy de confianza solo pueden aprobar
solicitudes de dispositivos de operador dentro de sus propios ámbitos de operador declarados; la aprobación
de roles que no sean de operador es exclusiva de administradores, aunque esas sesiones puedan usar
`operator.pairing` para otras operaciones.

En las sesiones con token de dispositivo emparejado, la gestión se limita al propio dispositivo, salvo que el llamador
tenga `operator.admin`: un llamador no administrador solo ve sus propias entradas de emparejamiento y
solo puede aprobar, rechazar, rotar, revocar o eliminar la entrada de su propio dispositivo.

## Aprobaciones de emparejamiento de nodos

Los métodos heredados `node.pair.*` utilizan un almacén independiente de emparejamiento de nodos propiedad del Gateway.
En cambio, los nodos WS utilizan el emparejamiento de dispositivos (`role: node`), pero se aplica el mismo
vocabulario de aprobación. Consulte [Emparejamiento del Gateway](/es/gateway/pairing) para saber cómo se relacionan
ambos almacenes.

`node.pair.approve` deriva ámbitos adicionales obligatorios a partir de la lista de comandos
de la solicitud pendiente:

| Comandos declarados                                    | Ámbitos obligatorios                  |
| ------------------------------------------------------ | ------------------------------------- |
| ninguno                                                | `operator.pairing`                    |
| comandos de nodo que no sean de ejecución              | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare` o `system.which`    | `operator.pairing` + `operator.admin` |

Aprobar una declaración de nodo no habilita los comandos que tengan una barrera independiente
de lista de permitidos en tiempo de ejecución. Por ejemplo, aprobar un nodo que declare
`computer.act` requiere el ámbito de emparejamiento y el de escritura, pero solo registra la superficie.
Un administrador o propietario debe habilitar también `computer.act`. Mientras permanezca
habilitado, invocarlo mediante el método `node.invoke` con ámbito de escritura no
requiere el ámbito de administrador para cada acción.

El emparejamiento de nodos establece la identidad y la confianza; no sustituye la propia
política de aprobación de ejecución de `system.run` de un nodo.

## Autenticación con secreto compartido

La autenticación mediante token o contraseña compartidos del Gateway se trata como acceso de operador de confianza para
ese Gateway. Las superficies HTTP compatibles con OpenAI, `/tools/invoke` y los
endpoints HTTP del historial de sesiones restauran el conjunto completo de ámbitos de operador predeterminados para
la autenticación de portador con secreto compartido, aunque un llamador envíe ámbitos declarados más restringidos.

Los modos vinculados a una identidad, como la autenticación mediante proxy de confianza o `none` para el acceso privado,
pueden seguir respetando los ámbitos declarados explícitamente. Use Gateways independientes para separar límites de
confianza reales.
