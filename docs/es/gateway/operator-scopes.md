---
read_when:
    - Depuración de errores de ámbito de operador faltante
    - Revisión de aprobaciones de emparejamiento de dispositivos o nodos
    - Agregar o clasificar métodos RPC de Gateway
summary: Roles de operador, alcances y comprobaciones en el momento de la aprobación para clientes de Gateway
title: Ámbitos del operador
x-i18n:
    generated_at: "2026-05-03T05:27:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Los ámbitos de operador definen qué puede hacer un cliente de Gateway después de autenticarse.
Son una protección del plano de control dentro de un único dominio de operador de Gateway de confianza,
no aislamiento multiusuario hostil. Si necesitas una separación fuerte entre
personas, equipos o máquinas, ejecuta Gateways separados bajo usuarios del SO o
hosts separados.

Relacionado: [Seguridad](/es/gateway/security), [protocolo de Gateway](/es/gateway/protocol),
[emparejamiento de Gateway](/es/gateway/pairing), [CLI de dispositivos](/es/cli/devices).

## Roles

Los clientes WebSocket de Gateway se conectan con un rol:

- `operator`: clientes del plano de control, como CLI, Control UI, automatización y
  procesos auxiliares de confianza.
- `node`: hosts de capacidades, como macOS, iOS, Android o nodos sin interfaz que
  exponen comandos mediante `node.invoke`.

Los métodos RPC de operador requieren el rol `operator`. Los métodos originados en Node
requieren el rol `node`.

## Niveles de ámbito

| Ámbito                  | Significado                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Estado de solo lectura, listas, catálogo, registros, lecturas de sesiones y otras llamadas del plano de control que no mutan.                                                                 |
| `operator.write`        | Acciones normales de operador que mutan, como enviar mensajes, invocar herramientas, actualizar ajustes de conversación/voz y retransmitir comandos de nodo. También satisface `operator.read`. |
| `operator.admin`        | Acceso administrativo al plano de control. Satisface todos los ámbitos `operator.*`. Requerido para mutación de configuración, actualizaciones, hooks nativos, espacios de nombres reservados sensibles y aprobaciones de alto riesgo. |
| `operator.pairing`      | Gestión del emparejamiento de dispositivos y nodos, incluida la enumeración, aprobación, rechazo, eliminación, rotación y revocación de registros de emparejamiento o tokens de dispositivo. |
| `operator.approvals`    | API de aprobación de ejecución y Plugin.                                                                                                                                                      |
| `operator.talk.secrets` | Lectura de la configuración de Talk con secretos incluidos.                                                                                                                                   |

Los ámbitos futuros desconocidos `operator.*` requieren una coincidencia exacta, salvo que el llamador tenga
`operator.admin`.

## El ámbito del método es solo la primera barrera

Cada RPC de Gateway tiene un ámbito de método de privilegio mínimo. Ese ámbito de método decide
si la solicitud puede llegar al manejador. Luego, algunos manejadores aplican comprobaciones
más estrictas en el momento de la aprobación según el elemento concreto que se apruebe o mute.

Ejemplos:

- `device.pair.approve` es accesible con `operator.pairing`, pero aprobar un
  dispositivo de operador solo puede emitir o conservar ámbitos que el llamador ya tenga.
- `node.pair.approve` es accesible con `operator.pairing` y luego deriva ámbitos
  de aprobación adicionales de la lista de comandos de nodo pendientes.
- `chat.send` normalmente es un método con ámbito de escritura, pero `/config set`
  y `/config unset` persistentes requieren `operator.admin` a nivel de comando.

Esto permite que operadores con ámbitos más bajos realicen acciones de emparejamiento de bajo riesgo sin hacer
que toda aprobación de emparejamiento requiera administración.

## Aprobaciones de emparejamiento de dispositivos

Los registros de emparejamiento de dispositivos son la fuente duradera de roles y ámbitos aprobados.
Los dispositivos ya emparejados no obtienen acceso más amplio de forma silenciosa: las reconexiones que solicitan
un rol más amplio o ámbitos más amplios crean una nueva solicitud de actualización pendiente.

Al aprobar una solicitud de dispositivo:

- Una solicitud sin rol de operador no necesita aprobación de ámbito de token de operador.
- Una solicitud de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` u `operator.talk.secrets` requiere que el llamador tenga
  esos ámbitos, u `operator.admin`.
- Una solicitud de `operator.admin` requiere `operator.admin`.
- Una solicitud de reparación sin ámbitos explícitos puede heredar los ámbitos de token de operador
  existentes. Si ese token existente tiene ámbito de administración, la aprobación sigue requiriendo
  `operator.admin`.

Para las sesiones de token de dispositivos emparejados, la gestión se limita al propio dispositivo, salvo que el llamador
también tenga `operator.admin`: los llamadores que no sean administradores solo pueden rotar, revocar o eliminar
su propia entrada de dispositivo.

## Aprobaciones de emparejamiento de Node

El `node.pair.*` heredado usa un almacén de emparejamiento de nodos independiente propiedad de Gateway. Los nodos WS
usan emparejamiento de dispositivos con `role: node`, pero se aplica el mismo vocabulario
de nivel de aprobación.

`node.pair.approve` usa la lista de comandos de la solicitud pendiente para derivar ámbitos
requeridos adicionales:

- Solicitud sin comandos: `operator.pairing`
- Comandos de nodo que no sean de ejecución: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

El emparejamiento de Node establece identidad y confianza. No sustituye la política de aprobación
de ejecución `system.run` propia del nodo.

## Autenticación con secreto compartido

La autenticación con token/contraseña compartida de Gateway se trata como acceso de operador de confianza para
ese Gateway. Las superficies HTTP compatibles con OpenAI y `/tools/invoke` restauran el
conjunto normal completo de ámbitos predeterminados de operador para la autenticación de portador con secreto compartido, incluso si un
llamador envía ámbitos declarados más estrechos.

Los modos con identidad, como la autenticación por proxy de confianza o `none` de ingreso privado,
aún pueden respetar ámbitos declarados explícitos. Usa Gateways separados para una separación real de
límites de confianza.
