---
read_when:
    - Quieres una guía paso a paso de la TUI para principiantes
    - Necesitas la lista completa de funciones, comandos y atajos de la TUI
summary: 'Interfaz de usuario de terminal (TUI): conectarse al Gateway o ejecutarla localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-07-16T12:02:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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

3. Escriba un mensaje y pulse Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` si el Gateway utiliza autenticación mediante contraseña.

### Modo local

Ejecute la TUI sin un Gateway:

```bash
openclaw chat
# o
openclaw tui --local
```

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- El modo local utiliza directamente el entorno de ejecución del agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- Al ejecutar únicamente `openclaw` (sin subcomando), se elige un destino automáticamente: una instalación sin configurar inicia la incorporación de inferencia; una configuración no válida abre la guía clásica de Doctor; un Gateway configurado y accesible abre este shell de TUI en modo Gateway; de lo contrario, un modelo local configurado lo abre en modo local.

## Lo que se muestra

- Encabezado: URL de conexión, agente actual y sesión actual.
- Registro del chat: mensajes del usuario, respuestas del asistente, avisos del sistema y tarjetas de herramientas.
- Línea de estado: estado de la conexión o ejecución (conectando, en ejecución, transmitiendo, inactivo o error).
- Pie: agente + sesión + modelo + estado del objetivo + pensar/rápido/detallado/traza/razonamiento + recuentos de tokens + entrega. Cuando `tui.footer.showRemoteHost` está habilitado, las conexiones con un Gateway remoto también muestran el host de conexión.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son identificadores únicos (por ejemplo, `main` y `research`). El Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si se escribe `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si se escribe `/session agent:other:main`, se cambia explícitamente a la sesión de ese agente.
- Ámbito de la sesión:
  - `per-sender` (predeterminado): cada agente tiene varias sesiones.
  - `global`: la TUI siempre utiliza la sesión `global` (el selector puede estar vacío).
- El agente y la sesión actuales siempre están visibles en el pie.
- Para mostrar el host del Gateway en conexiones no locales basadas en URL, habilítelo con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  El valor predeterminado es `false`. Las conexiones de bucle invertido y las conexiones locales integradas nunca muestran una etiqueta de host.

- Si la sesión tiene un [objetivo](/es/tools/goal), el pie muestra su estado compacto:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` o `Goal achieved`.
- Cuando se inicia sin `--session`, la TUI en modo Gateway reanuda la última sesión seleccionada para el mismo Gateway, agente y ámbito de sesión, si esa sesión aún existe. Pasar `--session`, `/session`, `/new` o `/reset` sigue siendo una selección explícita.

## Envío + entrega

- Los mensajes siempre se envían al Gateway (o al entorno de ejecución integrado en modo local); entregar después la respuesta del asistente a un proveedor de chat es un paso independiente y deshabilitado de forma predeterminada.
- La TUI es una superficie de origen interna como WebChat, no un canal de salida genérico. Los entornos que requieren `tools.message` para que las respuestas sean visibles pueden satisfacer el turno activo de la TUI con un `message.send` sin destino; la entrega explícita al proveedor sigue utilizando los canales configurados habituales y nunca recurre a `lastChannel`.
- La entrega queda fijada para toda la sesión de la TUI al iniciarla: iníciela con `openclaw tui --deliver` para activarla. No existe ningún comando de barra `/deliver` ni interruptor en Configuración para cambiarla durante la sesión; reinicie la TUI para modificarla.

## Selectores + superposiciones

- Selector de modelo: muestra los modelos disponibles y establece la anulación de la sesión.
- Selector de agente: permite elegir otro agente.
- Selector de sesión: muestra hasta 50 sesiones del agente actual actualizadas durante los últimos 7 días. Use `/session <key>` para ir a una sesión conocida más antigua.
- Configuración (`/settings`): permite alternar la expansión de la salida de las herramientas y la visibilidad del razonamiento. Este panel no controla la entrega.

## Atajos de teclado

- Enter: enviar el mensaje
- Esc: cancelar la ejecución activa
- Ctrl+C: borrar la entrada (púlselo dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelo
- Ctrl+G: selector de agente
- Ctrl+P: selector de sesión
- Ctrl+O: alternar la expansión de la salida de las herramientas
- Ctrl+T: alternar la visibilidad del razonamiento (vuelve a cargar el historial)

## Comandos de barra

Núcleo:

- `/help`
- `/status` (reenviado al Gateway; muestra un resumen de la sesión y el modelo)
- `/gateway-status` (alias `/gwstatus`; muestra directamente el estado de conexión del Gateway)
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controles de sesión:

- `/think <off|minimal|low|medium|high>` (los niveles superiores pueden añadir niveles como `xhigh`/`max`, según el modelo)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` elimina la anulación de la sesión)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo de vida de la sesión:

- `/new` (crea una sesión nueva y aislada con una clave nueva; no afecta a otros clientes de la TUI que utilicen la sesión anterior)
- `/reset` (restablece la clave de la sesión actual sin sustituirla)
- `/abort` (cancela la ejecución activa)
- `/settings`
- `/exit` (o `/quit`)

Solo en modo local:

- `/auth [provider]` abre el flujo de autenticación o inicio de sesión del proveedor dentro de la TUI.

OpenClaw:

- `/openclaw [request]` vuelve de la TUI normal del agente al chat de configuración o reparación [OpenClaw](#openclaw-setup-and-repair-helper), con la opción de reenviar una solicitud.

Los demás comandos de barra del Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulte [Comandos de barra](/es/tools/slash-commands).

## Comandos del shell local

- Anteponer `!` a una línea permite ejecutar un comando del shell local en el host de la TUI.
- La TUI solicita una vez por sesión permiso para la ejecución local; si se rechaza, `!` permanece deshabilitado durante la sesión.
- Los comandos se ejecutan en un shell nuevo y no interactivo, en el directorio de trabajo de la TUI (sin `cd`/entorno persistente).
- Los comandos del shell local reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` aislado se envía como un mensaje normal; los espacios iniciales no activan la ejecución local.

## Asistente de configuración y reparación de OpenClaw

OpenClaw es el asistente de configuración y reparación de nivel cero, expuesto como `openclaw setup` después de que el modelo predeterminado configurado supere una comprobación de inferencia en vivo. Si la inferencia no está disponible, una invocación interactiva vuelve a la incorporación de inferencia y la automatización falla con instrucciones de reparación. Se ejecuta dentro del mismo shell de TUI local que `openclaw tui --local`, respaldado por un agente de IA restringido a las operaciones tipadas y sujetas a aprobación de OpenClaw:

```bash
openclaw setup                       # iniciar de forma interactiva
openclaw setup -m "status"           # ejecutar una solicitud y salir
openclaw setup -m "set default model openai/gpt-5.2" --yes   # aplicar una escritura de configuración
```

- Las escrituras persistentes de configuración requieren aprobación: confírmelas de forma interactiva o pase `--yes`.
- `--json` imprime como JSON el resumen inicial en lugar de iniciar el chat.
- Desde OpenClaw, una solicitud `open-tui` (por ejemplo, pedir hablar con un agente normal) sale de OpenClaw y abre la TUI habitual del agente; use allí `/openclaw` para volver.

Use el modo local cuando la configuración actual ya sea válida y se quiera que el agente integrado la inspeccione en la misma máquina, la compare con la documentación y ayude a corregir las divergencias sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, comience primero con `openclaw configure` o `openclaw doctor --fix`; `openclaw chat` sigue necesitando una configuración que pueda cargarse para iniciarse.

Flujo habitual:

1. Inicie el modo local:

```bash
openclaw chat
```

2. Indique al agente qué se quiere comprobar, por ejemplo:

```text
Compara mi configuración de autenticación del Gateway con la documentación y sugiere la corrección más pequeña.
```

3. Use comandos del shell local para obtener pruebas exactas y realizar la validación:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique cambios específicos con `openclaw config set` o `openclaw configure` y, a continuación, vuelva a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísela y ejecute `!openclaw doctor --fix`.

Consejos:

- Es preferible utilizar `openclaw config set` o `openclaw configure` en lugar de editar manualmente `openclaw.json`.
- `openclaw docs "<query>"` busca en el índice de documentación en vivo desde la misma máquina.
- `openclaw config validate --json` resulta útil cuando se necesitan errores estructurados de esquema y de SecretRef/resolución.

## Salida de las herramientas

- Las llamadas a herramientas se muestran como tarjetas con argumentos y resultados.
- Ctrl+O alterna entre las vistas contraída y expandida.
- Mientras las herramientas se ejecutan, las actualizaciones parciales se transmiten a la misma tarjeta.

## Colores del terminal

- La TUI mantiene el texto del cuerpo del asistente en el color de primer plano predeterminado del terminal para que siga siendo legible tanto en terminales claros como oscuros.
- Si el terminal utiliza un fondo claro y la detección automática es incorrecta, establezca `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar en su lugar la paleta oscura original, establezca `OPENCLAW_THEME=dark`.

## Historial + transmisión

- Al conectarse, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas transmitidas se actualizan en el mismo lugar hasta que finalizan.
- La TUI también escucha los eventos de herramientas del agente para ofrecer tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se conecta con el identificador de cliente `openclaw-tui` en el modo de cliente general `ui` (el mismo modo que utilizan Control UI y WebChat para la política del Gateway).
- Las reconexiones muestran un mensaje del sistema; las interrupciones en los eventos aparecen en el registro.

## Opciones

- `--local`: Ejecutar con el entorno de ejecución del agente integrado local
- `--url <url>`: URL de WebSocket del Gateway (de forma predeterminada, `gateway.remote.url` de la configuración o `ws://127.0.0.1:<port>` en la interfaz de bucle invertido)
- `--token <token>`: Token del Gateway (si es necesario)
- `--password <password>`: Contraseña del Gateway (si es necesaria)
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS para un Gateway `wss://` anclado
- `--session <key>`: Clave de sesión (valor predeterminado: `main`, o `global` cuando el ámbito es global)
- `--deliver`: Entregar las respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: Sobrescribir el nivel de razonamiento de los envíos
- `--message <text>`: Enviar un mensaje inicial después de conectarse
- `--timeout-ms <ms>`: Tiempo de espera del agente en ms (valor predeterminado: `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas del historial que se cargarán (valor predeterminado: `200`)

<Warning>
Al establecer `--url`, la TUI no recurre a las credenciales de la configuración ni del entorno. Pase explícitamente `--token` o `--password`, además de `--tls-fingerprint` cuando el destino use un certificado anclado. La ausencia de credenciales explícitas es un error. En el modo local, no pase `--url`, `--token`, `--password` ni `--tls-fingerprint`.
</Warning>

## Solución de problemas

No se muestra ninguna salida después de enviar un mensaje:

- Ejecute `/status` en la TUI para confirmar que el Gateway esté conectado e inactivo u ocupado.
- Compruebe los registros del Gateway: `openclaw logs --follow`.
- Confirme que el agente pueda ejecutarse: `openclaw status` y `openclaw models status`.
- Si espera recibir mensajes en un canal de chat, confirme que la TUI se haya iniciado con `--deliver` (no puede activarse posteriormente sin reiniciar).

## Solución de problemas de conexión

- `disconnected`: asegúrese de que el Gateway esté en ejecución y de que sus `--url/--token/--password` sean correctos.
- No hay agentes en el selector: compruebe `openclaw agents list` y la configuración de enrutamiento.
- Selector de sesiones vacío: es posible que se encuentre en el ámbito global o que todavía no haya sesiones.

## Recursos relacionados

- [Interfaz de control](/es/web/control-ui) — interfaz de control basada en la web
- [Configuración](/es/cli/config) — inspeccionar, validar y editar `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de la CLI](/es/cli) — referencia completa de comandos de la CLI
