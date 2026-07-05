---
read_when:
    - Quieres una guía paso a paso para principiantes sobre la TUI
    - Necesitas la lista completa de funciones, comandos y atajos de TUI
summary: 'Interfaz de terminal (TUI): conéctate al Gateway o ejecútala localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-07-05T11:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8950c282ec9cab35c6ca35b35184f75a54902cd16d1b48140e1753cd79eb06a3
    source_path: web/tui.md
    workflow: 16
---

## Inicio rápido

### Modo Gateway

1. Inicia el Gateway.

```bash
openclaw gateway
```

2. Abre la TUI.

```bash
openclaw tui
```

3. Escribe un mensaje y presiona Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usa `--password` si tu Gateway usa autenticación con contraseña.

### Modo local

Ejecuta la TUI sin un Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- El modo local usa directamente el runtime de agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- `openclaw` sin argumentos (sin subcomando) elige un destino automáticamente: una instalación sin configurar ejecuta la incorporación; una configuración no válida abre [Crestodian](#crestodian-setup-and-repair-helper); una configuración válida abre esta shell TUI en modo gateway si se puede alcanzar un Gateway, o en modo local en caso contrario.

## Qué ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro de chat: mensajes del usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (conectando, ejecutando, transmitiendo, inactivo, error).
- Pie: agente + sesión + modelo + estado del objetivo + think/fast/verbose/trace/reasoning + recuentos de tokens + entrega. Cuando `tui.footer.showRemoteHost` está habilitado, las conexiones remotas del Gateway también muestran el host de conexión.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son slugs únicos (por ejemplo, `main`, `research`). El Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si escribes `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si escribes `/session agent:other:main`, cambias explícitamente a esa sesión de agente.
- Alcance de la sesión:
  - `per-sender` (predeterminado): cada agente tiene muchas sesiones.
  - `global`: la TUI siempre usa la sesión `global` (el selector puede estar vacío).
- El agente + la sesión actuales siempre están visibles en el pie.
- Para mostrar el host del Gateway en conexiones no locales respaldadas por URL, actívalo con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  El valor predeterminado es `false`. Las conexiones loopback e integradas locales nunca muestran una etiqueta de host.

- Si la sesión tiene un [objetivo](/es/tools/goal), el pie muestra su estado compacto:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` o `Goal achieved`.
- Cuando se inicia sin `--session`, la TUI en modo gateway reanuda la última sesión seleccionada para el mismo gateway, agente y alcance de sesión si esa sesión todavía existe. Pasar `--session`, `/session`, `/new` o `/reset` sigue siendo explícito.

## Envío + entrega

- Los mensajes siempre van al Gateway (o al runtime integrado en modo local); entregar la respuesta del asistente de vuelta a un proveedor de chat es un paso separado, desactivado de forma predeterminada.
- La TUI es una superficie de origen interna como WebChat, no un canal saliente genérico. Los harnesses que requieren `tools.message` para respuestas visibles pueden satisfacer el turno activo de la TUI con un `message.send` sin destino; la entrega explícita al proveedor sigue usando los canales configurados normales y nunca recurre a `lastChannel`.
- La entrega queda fijada para toda la sesión TUI al iniciarse: empieza con `openclaw tui --deliver` para activarla. No hay ningún comando slash `/deliver` ni interruptor de Configuración para cambiarla a mitad de sesión; reinicia la TUI para cambiarla.

## Selectores + superposiciones

- Selector de modelo: lista los modelos disponibles y establece la anulación de sesión.
- Selector de agente: elige un agente diferente.
- Selector de sesión: muestra hasta 50 sesiones del agente actual actualizadas en los últimos 7 días. Usa `/session <key>` para saltar a una sesión conocida más antigua.
- Configuración (`/settings`): alterna la expansión de salida de herramientas y la visibilidad del razonamiento. Este panel no controla la entrega.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: abortar la ejecución activa
- Ctrl+C: borrar entrada (presiona dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelo
- Ctrl+G: selector de agente
- Ctrl+P: selector de sesión
- Ctrl+O: alternar expansión de salida de herramientas
- Ctrl+T: alternar visibilidad del razonamiento (recarga el historial)

## Comandos slash

Núcleo:

- `/help`
- `/status` (reenviado al Gateway; muestra el resumen de sesión/modelo)
- `/gateway-status` (alias `/gwstatus`; muestra directamente el estado de conexión del Gateway)
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controles de sesión:

- `/think <off|minimal|low|medium|high>` (los niveles superiores pueden añadir niveles como `xhigh`/`max` según el modelo)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` borra la anulación de sesión)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo de vida de la sesión:

- `/new` (crea una sesión nueva, aislada, bajo una clave nueva; no afecta a otros clientes TUI en la sesión anterior)
- `/reset` (restablece la clave de sesión actual en el lugar)
- `/abort` (aborta la ejecución activa)
- `/settings`
- `/exit` (o `/quit`)

Solo modo local:

- `/auth [provider]` abre el flujo de autenticación/inicio de sesión del proveedor dentro de la TUI.

Crestodian:

- `/crestodian [request]` vuelve desde la TUI de agente normal al chat de configuración/reparación de [Crestodian](#crestodian-setup-and-repair-helper), opcionalmente reenviando una solicitud.

Otros comandos slash del Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulta [Comandos slash](/es/tools/slash-commands).

## Comandos de shell locales

- Antepon una línea con `!` para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita permiso una vez por sesión para permitir la ejecución local; si lo rechazas, `!` queda deshabilitado durante la sesión.
- Los comandos se ejecutan en una shell nueva y no interactiva en el directorio de trabajo de la TUI (sin `cd`/env persistentes).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` solo se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Asistente de configuración y reparación Crestodian

Crestodian es el asistente de configuración/reparación de nivel cero, expuesto como `openclaw crestodian` (o iniciado automáticamente cuando `openclaw` sin argumentos encuentra una configuración no válida). Se ejecuta dentro de la misma shell TUI local que `openclaw tui --local`, respaldado por una capa dedicada de diálogo/operaciones en lugar de una sesión en vivo de modelo+herramientas:

```bash
openclaw crestodian                       # start interactively
openclaw crestodian -m "status"           # run one request and exit
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # apply a config write
```

- Las escrituras de configuración persistentes necesitan aprobación: confirma de forma interactiva o pasa `--yes`.
- `--json` imprime el resumen de inicio como JSON en lugar de iniciar el chat.
- Desde dentro de Crestodian, una solicitud `open-tui` (por ejemplo, pedir hablar con un agente normal) sale de Crestodian y abre la TUI de agente normal; usa `/crestodian` allí para volver.

Usa el modo local cuando la configuración actual ya valida y quieres que el agente integrado la inspeccione en la misma máquina, la compare con la documentación y ayude a reparar desviaciones sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, empieza primero con `openclaw configure` o `openclaw doctor --fix`; `openclaw chat` todavía necesita una configuración cargable para iniciarse.

Bucle típico:

1. Inicia el modo local:

```bash
openclaw chat
```

2. Pregunta al agente qué quieres revisar, por ejemplo:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Usa comandos de shell locales para obtener evidencia exacta y validación:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplica cambios limitados con `openclaw config set` u `openclaw configure`, y luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Consejos:

- Prefiere `openclaw config set` u `openclaw configure` antes que editar `openclaw.json` manualmente.
- `openclaw docs "<query>"` busca en el índice de documentación en vivo desde la misma máquina.
- `openclaw config validate --json` es útil cuando quieres errores estructurados de esquema y SecretRef/resolubilidad.

## Salida de herramientas

- Las llamadas a herramientas se muestran como tarjetas con argumentos + resultados.
- Ctrl+O alterna entre vistas contraídas/expandidas.
- Mientras las herramientas se ejecutan, las actualizaciones parciales se transmiten en la misma tarjeta.

## Colores de terminal

- La TUI mantiene el texto del cuerpo del asistente en el primer plano predeterminado de tu terminal para que tanto los terminales oscuros como los claros sigan siendo legibles.
- Si tu terminal usa un fondo claro y la detección automática falla, define `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar la paleta oscura original en su lugar, define `OPENCLAW_THEME=dark`.

## Historial + transmisión

- Al conectarse, la TUI carga el historial más reciente (predeterminado: 200 mensajes).
- Las respuestas en streaming se actualizan en el lugar hasta finalizar.
- La TUI también escucha eventos de herramientas del agente para mostrar tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se conecta con el id de cliente `openclaw-tui` bajo el modo de cliente amplio `ui` (el mismo modo que Control UI y WebChat usan para la política del Gateway).
- Las reconexiones muestran un mensaje del sistema; las brechas de eventos se muestran en el registro.

## Opciones

- `--local`: Ejecutar contra el runtime de agente integrado local
- `--url <url>`: URL WebSocket del Gateway (predeterminada a `gateway.remote.url` de la configuración, o `ws://127.0.0.1:<port>` en loopback)
- `--token <token>`: Token del Gateway (si se requiere)
- `--password <password>`: Contraseña del Gateway (si se requiere)
- `--session <key>`: Clave de sesión (predeterminado: `main`, o `global` cuando el alcance es global)
- `--deliver`: Entregar respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: Anular el nivel de pensamiento para los envíos
- `--message <text>`: Enviar un mensaje inicial después de conectar
- `--timeout-ms <ms>`: Tiempo de espera del agente en ms (predeterminado a `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas de historial que se cargarán (predeterminado `200`)

<Warning>
Cuando defines `--url`, la TUI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error. En modo local, no pases `--url`, `--token` ni `--password`.
</Warning>

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que el Gateway está conectado e inactivo/ocupado.
- Revisa los registros del Gateway: `openclaw logs --follow`.
- Confirma que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, confirma que la TUI se inició con `--deliver` (esto no se puede activar más tarde sin reiniciar).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que el Gateway esté en ejecución y de que tus `--url/--token/--password` sean correctos.
- No hay agentes en el selector: revisa `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesión vacío: puede que estés en alcance global o que aún no tengas sesiones.

## Relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Config](/es/cli/config) — inspecciona, valida y edita `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de la CLI](/es/cli) — referencia completa de comandos de la CLI
