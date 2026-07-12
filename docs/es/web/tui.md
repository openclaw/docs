---
read_when:
    - Quieres una guía paso a paso de la TUI apta para principiantes
    - Necesitas la lista completa de funciones, comandos y atajos de la TUI
summary: 'Interfaz de usuario de terminal (TUI): conéctese al Gateway o ejecútela localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-07-11T23:37:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
---

## Inicio rápido

### Modo Gateway

1. Inicie el Gateway.

```bash
openclaw gateway
```

2. Abra la TUI.

```bash
openclaw tui
```

3. Escriba un mensaje y pulse Intro.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` si su Gateway utiliza autenticación mediante contraseña.

### Modo local

Ejecute la TUI sin un Gateway:

```bash
openclaw chat
# o
openclaw tui --local
```

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- El modo local utiliza directamente el entorno de ejecución integrado del agente. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- `openclaw` sin argumentos (sin subcomando) elige un destino automáticamente: una instalación sin configurar ejecuta la incorporación para inferencia; una configuración no válida abre las indicaciones clásicas de Doctor; un Gateway configurado y accesible abre este shell de la TUI en modo Gateway; de lo contrario, un modelo local configurado lo abre en modo local.

## Qué se muestra

- Encabezado: URL de conexión, agente actual y sesión actual.
- Registro del chat: mensajes del usuario, respuestas del asistente, avisos del sistema y tarjetas de herramientas.
- Línea de estado: estado de la conexión o ejecución (conectando, ejecutándose, transmitiendo, inactivo, error).
- Pie: agente + sesión + modelo + estado del objetivo + reflexión/rápido/detallado/seguimiento/razonamiento + recuentos de tokens + entrega. Cuando `tui.footer.showRemoteHost` está activado, las conexiones remotas al Gateway también muestran el host de conexión.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son identificadores únicos (por ejemplo, `main` y `research`). El Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si escribe `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si escribe `/session agent:other:main`, cambia explícitamente a la sesión de ese agente.
- Ámbito de la sesión:
  - `per-sender` (predeterminado): cada agente tiene muchas sesiones.
  - `global`: la TUI siempre utiliza la sesión `global` (el selector puede estar vacío).
- El agente y la sesión actuales siempre están visibles en el pie.
- Para mostrar el host del Gateway en conexiones no locales basadas en URL, habilítelo con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  El valor predeterminado es `false`. Las conexiones de local loopback y locales integradas nunca muestran una etiqueta de host.

- Si la sesión tiene un [objetivo](/es/tools/goal), el pie muestra su estado resumido:
  `Persiguiendo el objetivo`, `Objetivo en pausa (/goal resume)`, `Objetivo bloqueado (/goal resume)` u `Objetivo alcanzado`.
- Cuando se inicia sin `--session`, la TUI en modo Gateway reanuda la última sesión seleccionada para el mismo Gateway, agente y ámbito de sesión si esa sesión aún existe. Pasar `--session`, `/session`, `/new` o `/reset` sigue siendo una acción explícita.

## Envío + entrega

- Los mensajes siempre se envían al Gateway (o al entorno de ejecución integrado en modo local); entregar la respuesta del asistente a un proveedor de chat es un paso independiente, desactivado de forma predeterminada.
- La TUI es una superficie de origen interna, como WebChat, no un canal de salida genérico. Los entornos que requieren `tools.message` para las respuestas visibles pueden satisfacer el turno activo de la TUI con un `message.send` sin destino; la entrega explícita mediante un proveedor sigue utilizando los canales configurados habituales y nunca recurre a `lastChannel`.
- La entrega queda fijada para toda la sesión de la TUI al iniciarla: iníciela con `openclaw tui --deliver` para activarla. No hay ningún comando de barra `/deliver` ni opción en Configuración que permita cambiarla durante la sesión; reinicie la TUI para modificarla.

## Selectores + superposiciones

- Selector de modelos: muestra los modelos disponibles y establece la anulación para la sesión.
- Selector de agentes: permite elegir otro agente.
- Selector de sesiones: muestra hasta 50 sesiones del agente actual actualizadas durante los últimos 7 días. Use `/session <key>` para ir a una sesión conocida más antigua.
- Configuración (`/settings`): permite alternar la expansión de la salida de las herramientas y la visibilidad de la reflexión. Este panel no controla la entrega.

## Atajos de teclado

- Intro: enviar mensaje
- Esc: cancelar la ejecución activa
- Ctrl+C: borrar la entrada (púlselo dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelos
- Ctrl+G: selector de agentes
- Ctrl+P: selector de sesiones
- Ctrl+O: alternar la expansión de la salida de las herramientas
- Ctrl+T: alternar la visibilidad de la reflexión (vuelve a cargar el historial)

## Comandos de barra

Principales:

- `/help`
- `/status` (reenviado al Gateway; muestra el resumen de sesión/modelo)
- `/gateway-status` (alias `/gwstatus`; muestra directamente el estado de conexión del Gateway)
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controles de la sesión:

- `/think <off|minimal|low|medium|high>` (los niveles superiores pueden añadir niveles como `xhigh`/`max`, según el modelo)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` borra la anulación de la sesión)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo de vida de la sesión:

- `/new` (crea una sesión nueva y aislada con una clave nueva; no afecta a otros clientes de la TUI en la sesión anterior)
- `/reset` (restablece en el mismo lugar la clave de la sesión actual)
- `/abort` (cancela la ejecución activa)
- `/settings`
- `/exit` (o `/quit`)

Solo en modo local:

- `/auth [provider]` abre el flujo de autenticación/inicio de sesión del proveedor dentro de la TUI.

Crestodian:

- `/crestodian [request]` vuelve de la TUI normal del agente al chat de [Crestodian](#crestodian-setup-and-repair-helper) para configuración/reparación y, opcionalmente, reenvía una solicitud.

Otros comandos de barra del Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulte [Comandos de barra](/es/tools/slash-commands).

## Comandos del shell local

- Añada `!` al principio de una línea para ejecutar un comando del shell local en el host de la TUI.
- La TUI solicita una vez por sesión permiso para la ejecución local; si lo rechaza, `!` permanece desactivado durante la sesión.
- Los comandos se ejecutan en un shell nuevo y no interactivo en el directorio de trabajo de la TUI (sin `cd` ni variables de entorno persistentes).
- Los comandos del shell local reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` aislado se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Asistente Crestodian de configuración y reparación

Crestodian es el asistente de nivel cero para configuración y reparación, disponible como `openclaw crestodian` después de que el modelo predeterminado configurado supere una comprobación de inferencia en vivo. Si la inferencia no está disponible, una invocación interactiva vuelve a la incorporación para inferencia y la automatización falla mostrando indicaciones para la reparación. Se ejecuta dentro del mismo shell local de la TUI que `openclaw tui --local`, respaldado por un agente de IA restringido a las operaciones tipadas de Crestodian y sujetas a aprobación:

```bash
openclaw crestodian                       # iniciar de forma interactiva
openclaw crestodian -m "status"           # ejecutar una solicitud y salir
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # aplicar una escritura de configuración
```

- Las escrituras persistentes de configuración necesitan aprobación: confírmelas de forma interactiva o pase `--yes`.
- `--json` imprime el resumen de inicio como JSON en lugar de iniciar el chat.
- Desde Crestodian, una solicitud `open-tui` (por ejemplo, pedir hablar con un agente normal) cierra Crestodian y abre la TUI habitual del agente; use `/crestodian` allí para volver.

Use el modo local cuando la configuración actual ya sea válida y quiera que el agente integrado la inspeccione en la misma máquina, la compare con la documentación y ayude a corregir las divergencias sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, empiece primero con `openclaw configure` u `openclaw doctor --fix`; `openclaw chat` sigue necesitando una configuración que pueda cargarse para iniciarse.

Ciclo habitual:

1. Inicie el modo local:

```bash
openclaw chat
```

2. Pida al agente que compruebe lo que quiera, por ejemplo:

```text
Compara la configuración de autenticación de mi Gateway con la documentación y sugiere la corrección más pequeña.
```

3. Use comandos del shell local para obtener pruebas exactas y realizar la validación:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique cambios específicos con `openclaw config set` u `openclaw configure` y, después, vuelva a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísela y ejecute `!openclaw doctor --fix`.

Consejos:

- Prefiera `openclaw config set` u `openclaw configure` antes que editar manualmente `openclaw.json`.
- `openclaw docs "<query>"` busca en el índice de documentación en vivo desde la misma máquina.
- `openclaw config validate --json` resulta útil cuando se necesitan errores estructurados de esquema y de resolución de SecretRef.

## Salida de las herramientas

- Las llamadas a herramientas se muestran como tarjetas con argumentos y resultados.
- Ctrl+O alterna entre las vistas contraída y expandida.
- Mientras se ejecutan las herramientas, las actualizaciones parciales se transmiten a la misma tarjeta.

## Colores del terminal

- La TUI mantiene el texto del cuerpo del asistente con el color de primer plano predeterminado del terminal para que siga siendo legible tanto en terminales claros como oscuros.
- Si el terminal utiliza un fondo claro y la detección automática es incorrecta, establezca `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar en su lugar la paleta oscura original, establezca `OPENCLAW_THEME=dark`.

## Historial + transmisión

- Al conectarse, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas transmitidas se actualizan en el mismo lugar hasta que finalizan.
- La TUI también escucha los eventos de herramientas del agente para mostrar tarjetas de herramientas más completas.

## Detalles de la conexión

- La TUI se conecta con el identificador de cliente `openclaw-tui` bajo el modo general de cliente `ui` (el mismo modo que utilizan Control UI y WebChat para la política del Gateway).
- Las reconexiones muestran un mensaje del sistema; las interrupciones de eventos se indican en el registro.

## Opciones

- `--local`: Ejecutar con el entorno de ejecución integrado del agente local
- `--url <url>`: URL WebSocket del Gateway (el valor predeterminado es `gateway.remote.url` de la configuración, o `ws://127.0.0.1:<port>` en local loopback)
- `--token <token>`: Token del Gateway (si es necesario)
- `--password <password>`: Contraseña del Gateway (si es necesaria)
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS para un Gateway `wss://` fijado
- `--session <key>`: Clave de sesión (valor predeterminado: `main`, o `global` cuando el ámbito es global)
- `--deliver`: Entregar las respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: Anular el nivel de reflexión para los envíos
- `--message <text>`: Enviar un mensaje inicial después de conectarse
- `--timeout-ms <ms>`: Tiempo de espera del agente en ms (el valor predeterminado es `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas del historial que se cargarán (valor predeterminado: `200`)

<Warning>
Cuando establece `--url`, la TUI no recurre a las credenciales de la configuración ni del entorno. Pase `--token` o `--password` explícitamente, además de `--tls-fingerprint` cuando el destino utilice un certificado fijado. La ausencia de credenciales explícitas es un error. En modo local, no pase `--url`, `--token`, `--password` ni `--tls-fingerprint`.
</Warning>

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecute `/status` en la TUI para confirmar que el Gateway está conectado e inactivo/ocupado.
- Compruebe los registros del Gateway: `openclaw logs --follow`.
- Confirme que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si espera mensajes en un canal de chat, confirme que la TUI se inició con `--deliver` (no se puede activar posteriormente sin reiniciarla).

## Solución de problemas de conexión

- `disconnected`: asegúrese de que el Gateway esté en ejecución y de que `--url/--token/--password` sean correctos.
- No aparecen agentes en el selector: compruebe `openclaw agents list` y la configuración de enrutamiento.
- Selector de sesiones vacío: puede que esté en el ámbito global o que aún no tenga sesiones.

## Contenido relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Configuración](/es/cli/config) — inspeccionar, validar y editar `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de la CLI](/es/cli) — referencia completa de comandos de la CLI
