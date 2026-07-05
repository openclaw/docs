---
read_when:
    - Depuración de errores por falta de alcance de operador
    - Revisión de aprobaciones de emparejamiento de dispositivos o nodos
    - Agregar o clasificar métodos RPC de Gateway
summary: Roles de operador, alcances y comprobaciones en el momento de la aprobación para clientes Gateway
title: Ámbitos de operador
x-i18n:
    generated_at: "2026-07-05T11:20:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfbaf4dc1d8e8cc07bfb10c4e9abf53df34868185f51546f74c12bd785fa380
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Los alcances de operador delimitan lo que un cliente de Gateway puede hacer después de autenticarse.
Son una barrera de protección del plano de control dentro de un único dominio de operador de Gateway de confianza,
no aislamiento multiinquilino hostil. Para una separación sólida entre personas,
equipos o máquinas, ejecuta Gateways separados bajo usuarios del SO o hosts separados.

Relacionado: [Seguridad](/es/gateway/security), [protocolo de Gateway](/es/gateway/protocol),
[emparejamiento de Gateway](/es/gateway/pairing), [CLI de dispositivos](/es/cli/devices).

## Roles

Cada cliente WebSocket de Gateway se conecta con un rol:

- `operator`: clientes del plano de control como CLI, Control UI, automatización y
  procesos auxiliares de confianza.
- `node`: hosts de capacidades (macOS, iOS, Android, sin interfaz) que exponen
  comandos mediante `node.invoke`.

Los métodos RPC de operador requieren el rol `operator`; los métodos originados en node
requieren el rol `node`.

## Niveles de alcance

| Alcance                 | Significado                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Estado de solo lectura, listas, catálogo, registros, lecturas de sesión y otras llamadas no mutantes.                                                        |
| `operator.write`        | Acciones de operador mutantes: enviar mensajes, invocar herramientas, actualizar ajustes de habla/voz, retransmisión de comandos de node. También satisface `operator.read`. |
| `operator.admin`        | Acceso administrativo. Satisface todos los alcances `operator.*`. Requerido para mutación de configuración, actualizaciones, hooks nativos, espacios de nombres reservados y aprobaciones de alto riesgo. |
| `operator.pairing`      | Gestión de emparejamiento de dispositivos y nodes: listar, aprobar, rechazar, eliminar, rotar, revocar.                                                     |
| `operator.approvals`    | APIs de aprobación de exec y plugins.                                                                                                                        |
| `operator.talk.secrets` | Leer la configuración de Talk con secretos incluidos.                                                                                                        |

Los alcances `operator.*` futuros desconocidos requieren una coincidencia exacta salvo que el llamador
ya tenga `operator.admin`.

## El alcance del método es solo la primera barrera

Cada RPC de Gateway tiene un alcance de método de privilegio mínimo que decide si una
solicitud llega a su manejador. Algunos manejadores aplican después comprobaciones más estrictas según
el elemento concreto que se aprueba o muta:

- `device.pair.approve` es accesible con `operator.pairing`, pero aprobar un
  dispositivo de operador solo puede emitir o preservar alcances que el llamador ya tiene.
- `node.pair.approve` es accesible con `operator.pairing`, y luego deriva alcances
  de aprobación adicionales de la lista de comandos declarada del node pendiente.
- `chat.send` es un método con alcance de escritura, pero los comandos de chat
  `/config set` y `/config unset` requieren `operator.admin` además de eso,
  independientemente del alcance de envío de chat del llamador.

Esto permite que operadores con alcances inferiores realicen acciones de emparejamiento de bajo riesgo sin
hacer que toda aprobación de emparejamiento sea exclusiva de administradores.

## Aprobaciones de emparejamiento de dispositivos

Los registros de emparejamiento de dispositivos son la fuente duradera de roles y alcances aprobados.
Un dispositivo ya emparejado no obtiene acceso más amplio de forma silenciosa: una reconexión
que pide un rol más amplio o alcances más amplios crea una nueva solicitud de actualización pendiente.

Aprobar una solicitud de dispositivo:

- Una solicitud sin rol de operador no necesita aprobación de alcance de operador.
- Una solicitud para un rol de dispositivo que no sea operador (por ejemplo `node`) requiere
  `operator.admin`, aunque `device.pair.approve` en sí solo necesita
  `operator.pairing`.
- Una solicitud para `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` u `operator.talk.secrets` requiere que el llamador ya
  tenga ese alcance, o `operator.admin`.
- Una solicitud para `operator.admin` requiere `operator.admin`.
- Una solicitud de reparación sin alcances explícitos puede heredar los alcances del token
  de operador existente; si ese token tiene alcance de administrador, la aprobación sigue requiriendo
  `operator.admin`.

Las sesiones no administradoras de secreto compartido y proxy de confianza solo pueden aprobar
solicitudes de dispositivos de operador dentro de sus propios alcances de operador declarados; aprobar
roles que no sean de operador es exclusivo de administradores aunque esas sesiones puedan usar
`operator.pairing` de otro modo.

Para sesiones de token de dispositivo emparejado, la gestión queda limitada al propio dispositivo salvo que el llamador
tenga `operator.admin`: un llamador no administrador solo ve sus propias entradas de emparejamiento, y
solo puede aprobar, rechazar, rotar, revocar o eliminar la entrada de su propio dispositivo.

## Aprobaciones de emparejamiento de Node

Los métodos heredados `node.pair.*` usan un almacén de emparejamiento de nodes separado, propiedad de Gateway.
Los nodes WS usan emparejamiento de dispositivos (`role: node`) en su lugar, pero se aplica el mismo
vocabulario de aprobación. Consulta [emparejamiento de Gateway](/es/gateway/pairing) para ver cómo se relacionan los dos
almacenes.

`node.pair.approve` deriva alcances requeridos adicionales de la lista de comandos de la
solicitud pendiente:

| Comandos declarados                                  | Alcances requeridos                   |
| ---------------------------------------------------- | ------------------------------------- |
| ninguno                                              | `operator.pairing`                    |
| comandos de node que no sean exec                    | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare` o `system.which`  | `operator.pairing` + `operator.admin` |

El emparejamiento de Node establece identidad y confianza; no reemplaza la propia política de aprobación
de exec `system.run` de un node.

## Autenticación de secreto compartido

La autenticación con token/contraseña compartidos de gateway se trata como acceso de operador de confianza para
ese Gateway. Las superficies HTTP compatibles con OpenAI, `/tools/invoke` y los endpoints HTTP
de historial de sesión restauran el conjunto completo predeterminado de alcances de operador para la
autenticación bearer de secreto compartido, incluso si un llamador envía alcances declarados más estrechos.

Los modos con identidad, como la autenticación de proxy de confianza o `none` de ingreso privado,
aún pueden respetar alcances declarados explícitos. Usa Gateways separados para una separación real de
límites de confianza.
