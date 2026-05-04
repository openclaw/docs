---
read_when:
    - Depuración de errores de ámbito de operador ausente
    - Revisar las aprobaciones de emparejamiento de dispositivos o Node
    - Agregar o clasificar métodos RPC de Gateway
summary: Roles de operador, ámbitos y comprobaciones en el momento de la aprobación para clientes de Gateway
title: Ámbitos del operador
x-i18n:
    generated_at: "2026-05-04T02:24:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Los ámbitos de operador definen qué puede hacer un cliente de Gateway después de autenticarse.
Son una barrera de plano de control dentro de un único dominio de operador de Gateway de confianza,
no un aislamiento multiinquilino hostil. Si necesitas una separación fuerte entre
personas, equipos o máquinas, ejecuta Gateways separados bajo usuarios del sistema operativo o
hosts separados.

Relacionado: [Seguridad](/es/gateway/security), [Protocolo de Gateway](/es/gateway/protocol),
[Emparejamiento de Gateway](/es/gateway/pairing), [CLI de dispositivos](/es/cli/devices).

## Roles

Los clientes WebSocket de Gateway se conectan con un rol:

- `operator`: clientes de plano de control como CLI, Control UI, automatización y
  procesos auxiliares de confianza.
- `node`: hosts de capacidades como macOS, iOS, Android o nodos sin interfaz que
  exponen comandos mediante `node.invoke`.

Los métodos RPC de operador requieren el rol `operator`. Los métodos originados en Node
requieren el rol `node`.

## Niveles de ámbito

| Ámbito                  | Significado                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Estado de solo lectura, listas, catálogo, registros, lecturas de sesión y otras llamadas de plano de control que no mutan.                                                            |
| `operator.write`        | Acciones normales de operador con mutación, como enviar mensajes, invocar herramientas, actualizar ajustes de conversación/voz y retransmisión de comandos de nodo. También satisface `operator.read`. |
| `operator.admin`        | Acceso administrativo al plano de control. Satisface todos los ámbitos `operator.*`. Requerido para mutación de configuración, actualizaciones, hooks nativos, espacios de nombres reservados sensibles y aprobaciones de alto riesgo. |
| `operator.pairing`      | Gestión de emparejamiento de dispositivos y nodos, incluida la enumeración, aprobación, rechazo, eliminación, rotación y revocación de registros de emparejamiento o tokens de dispositivo. |
| `operator.approvals`    | API de aprobación de exec y Plugin.                                                                                                                                                   |
| `operator.talk.secrets` | Lectura de la configuración de Talk con secretos incluidos.                                                                                                                           |

Los ámbitos `operator.*` futuros desconocidos requieren una coincidencia exacta salvo que el llamador tenga
`operator.admin`.

## El ámbito del método es solo la primera barrera

Cada RPC de Gateway tiene un ámbito de método de mínimo privilegio. Ese ámbito de método decide
si la solicitud puede llegar al manejador. Después, algunos manejadores aplican comprobaciones más estrictas
en el momento de la aprobación según el elemento concreto que se esté aprobando o mutando.

Ejemplos:

- `device.pair.approve` es accesible con `operator.pairing`, pero aprobar un
  dispositivo operador solo puede acuñar o conservar ámbitos que el llamador ya tiene.
- `node.pair.approve` es accesible con `operator.pairing` y después deriva ámbitos
  de aprobación adicionales de la lista pendiente de comandos de nodo.
- `chat.send` normalmente es un método con ámbito de escritura, pero `/config set`
  y `/config unset` persistentes requieren `operator.admin` a nivel de comando.

Esto permite que operadores con menor ámbito realicen acciones de emparejamiento de bajo riesgo sin convertir
todas las aprobaciones de emparejamiento en exclusivas de administrador.

## Aprobaciones de emparejamiento de dispositivos

Los registros de emparejamiento de dispositivos son la fuente duradera de roles y ámbitos aprobados.
Los dispositivos ya emparejados no obtienen acceso más amplio silenciosamente: las reconexiones que piden
un rol más amplio o ámbitos más amplios crean una nueva solicitud pendiente de ampliación.

Al aprobar una solicitud de dispositivo:

- Una solicitud sin rol de operador no necesita aprobación de ámbito de token de operador.
- Una solicitud para `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` requiere que el llamador tenga
  esos ámbitos, o `operator.admin`.
- Una solicitud para `operator.admin` requiere `operator.admin`.
- Una solicitud de reparación sin ámbitos explícitos puede heredar los ámbitos de token de operador
  existentes. Si ese token existente tiene ámbito de administrador, la aprobación sigue requiriendo
  `operator.admin`.

Para sesiones de token de dispositivo emparejado, la gestión se limita al propio ámbito salvo que el llamador
también tenga `operator.admin`: los llamadores que no son administradores solo ven sus propias entradas de emparejamiento,
solo pueden aprobar o rechazar su propia solicitud pendiente y solo pueden rotar, revocar o
eliminar su propia entrada de dispositivo.

## Aprobaciones de emparejamiento de Node

El `node.pair.*` heredado usa un almacén de emparejamiento de nodos independiente propiedad de Gateway. Los nodos WS
usan emparejamiento de dispositivos con `role: node`, pero se aplica el mismo vocabulario de nivel de aprobación.

`node.pair.approve` usa la lista de comandos de la solicitud pendiente para derivar ámbitos
requeridos adicionales:

- Solicitud sin comandos: `operator.pairing`
- Comandos de nodo que no son exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

El emparejamiento de nodos establece identidad y confianza. No reemplaza la política de aprobación de exec
`system.run` propia del nodo.

## Autenticación con secreto compartido

La autenticación con token/contraseña compartidos de Gateway se trata como acceso de operador de confianza para
ese Gateway. Las superficies HTTP compatibles con OpenAI y `/tools/invoke` restauran el
conjunto normal completo de ámbitos predeterminados de operador para la autenticación de portador con secreto compartido, incluso si un
llamador envía ámbitos declarados más estrechos.

Los modos con identidad, como la autenticación mediante proxy de confianza o `none` de ingreso privado,
aún pueden respetar ámbitos declarados explícitos. Usa Gateways separados para una separación real de
límites de confianza.
