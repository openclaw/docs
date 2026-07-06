---
read_when:
    - Quieres una guía paso a paso para principiantes de la TUI
    - Necesitas la lista completa de funciones, comandos y atajos de TUI
summary: 'Interfaz de terminal (TUI): conéctate al Gateway o ejecútala localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-07-06T10:53:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eec565ebdf91d705074798ef5bad433fd3d8e7c429e6bd0214a3eb3baa39c1f
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

3. Escribe un mensaje y pulsa Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usa `--password` si tu Gateway usa autenticación por contraseña.

### Modo local

Ejecuta la TUI sin un Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no puede combinarse con `--url`, `--token` ni `--password`.
- El modo local usa directamente el entorno de ejecución del agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- `openclaw` sin más (sin subcomando) elige un destino automáticamente: una instalación sin configurar ejecuta el onboarding; una configuración no válida abre [Crestodian](#crestodian-setup-and-repair-helper); una configuración válida abre esta shell TUI en modo Gateway si se puede acceder a un Gateway; de lo contrario, en modo local.

## Lo que ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro de chat: mensajes del usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (conectando, ejecutando, transmitiendo, inactivo, error).
- Pie: agente + sesión + modelo + estado de objetivo + think/fast/verbose/trace/reasoning + recuentos de tokens + entrega. Cuando `tui.footer.showRemoteHost` está habilitado, las conexiones remotas del Gateway también muestran el host de conexión.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son slugs únicos (por ejemplo, `main`, `research`). El Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si escribes `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si escribes `/session agent:other:main`, cambias explícitamente a esa sesión de agente.
- Alcance de sesión:
  - `per-sender` (predeterminado): cada agente tiene muchas sesiones.
  - `global`: la TUI siempre usa la sesión `global` (el selector puede estar vacío).
- El agente + sesión actuales siempre están visibles en el pie.
- Para mostrar el host del Gateway en conexiones no locales respaldadas por URL, habilítalo con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  El valor predeterminado es `false`. Las conexiones loopback y locales integradas nunca muestran una etiqueta de host.

- Si la sesión tiene un [objetivo](/es/tools/goal), el pie muestra su estado compacto:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` o `Goal achieved`.
- Cuando se inicia sin `--session`, la TUI en modo Gateway reanuda la última sesión seleccionada para el mismo gateway, agente y alcance de sesión si esa sesión aún existe. Pasar `--session`, `/session`, `/new` o `/reset` sigue siendo explícito.

## Envío + entrega

- Los mensajes siempre van al Gateway (o al entorno de ejecución integrado en modo local); entregar la respuesta del asistente de vuelta a un proveedor de chat es un paso separado y desactivado de forma predeterminada.
- La TUI es una superficie de origen interna como WebChat, no un canal saliente genérico. Los harnesses que requieren `tools.message` para respuestas visibles pueden satisfacer el turno activo de la TUI con un `message.send` sin destino; la entrega explícita del proveedor sigue usando canales configurados normales y nunca recurre a `lastChannel`.
- La entrega queda fijada para toda la sesión TUI al iniciar: empieza con `openclaw tui --deliver` para activarla. No hay comando slash `/deliver` ni interruptor de Settings para cambiarla a mitad de sesión; reinicia la TUI para cambiarla.

## Selectores + superposiciones

- Selector de modelo: lista los modelos disponibles y establece la anulación de sesión.
- Selector de agente: elige un agente diferente.
- Selector de sesión: muestra hasta 50 sesiones del agente actual actualizadas en los últimos 7 días. Usa `/session <key>` para saltar a una sesión conocida más antigua.
- Settings (`/settings`): alterna la expansión de salida de herramientas y la visibilidad del razonamiento. Este panel no controla la entrega.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: cancelar la ejecución activa
- Ctrl+C: borrar entrada (pulsa dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelo
- Ctrl+G: selector de agente
- Ctrl+P: selector de sesión
- Ctrl+O: alternar expansión de salida de herramientas
- Ctrl+T: alternar visibilidad del razonamiento (recarga el historial)

## Comandos slash

Núcleo:

- `/help`
- `/status` (reenviado por el Gateway; muestra resumen de sesión/modelo)
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
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo de vida de sesión:

- `/new` (crea una sesión nueva y aislada bajo una clave nueva; no afecta a otros clientes TUI en la sesión anterior)
- `/reset` (restablece la clave de sesión actual en el mismo lugar)
- `/abort` (cancela la ejecución activa)
- `/settings`
- `/exit` (o `/quit`)

Solo modo local:

- `/auth [provider]` abre el flujo de autenticación/inicio de sesión del proveedor dentro de la TUI.

Crestodian:

- `/crestodian [request]` vuelve de la TUI normal del agente al chat de configuración/reparación de [Crestodian](#crestodian-setup-and-repair-helper), reenviando opcionalmente una solicitud.

Otros comandos slash del Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulta [Comandos slash](/es/tools/slash-commands).

## Comandos de shell locales

- Antepon `!` a una línea para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita una vez por sesión permiso para permitir la ejecución local; si se rechaza, `!` queda deshabilitado para la sesión.
- Los comandos se ejecutan en una shell nueva y no interactiva en el directorio de trabajo de la TUI (sin `cd`/env persistente).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` solo se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Ayudante de configuración y reparación Crestodian

Crestodian es el asistente de configuración/reparación de anillo cero, expuesto como `openclaw crestodian` (o iniciado automáticamente cuando `openclaw` sin más encuentra una configuración no válida). Se ejecuta dentro de la misma shell TUI local que `openclaw tui --local`, respaldado por una capa dedicada de diálogo/operaciones en lugar de una sesión activa de modelo+herramientas:

```bash
openclaw crestodian                       # start interactively
openclaw crestodian -m "status"           # run one request and exit
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # apply a config write
```

- Las escrituras de configuración persistente necesitan aprobación: confirma de forma interactiva o pasa `--yes`.
- `--json` imprime la vista general de inicio como JSON en lugar de iniciar el chat.
- Desde dentro de Crestodian, una solicitud `open-tui` (por ejemplo, pedir hablar con un agente normal) sale de Crestodian y abre la TUI de agente normal; usa `/crestodian` allí para volver.

Usa el modo local cuando la configuración actual ya valida y quieres que el agente integrado la inspeccione en la misma máquina, la compare con la documentación y ayude a reparar desviaciones sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya falla, empieza primero con `openclaw configure` u `openclaw doctor --fix`; `openclaw chat` sigue necesitando una configuración cargable para iniciar.

Bucle típico:

1. Inicia el modo local:

```bash
openclaw chat
```

2. Pide al agente lo que quieres revisar, por ejemplo:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Usa comandos de shell locales para obtener evidencia y validación exactas:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplica cambios acotados con `openclaw config set` u `openclaw configure`, y luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Consejos:

- Prefiere `openclaw config set` u `openclaw configure` antes que editar `openclaw.json` a mano.
- `openclaw docs "<query>"` busca en el índice de documentación en vivo desde la misma máquina.
- `openclaw config validate --json` es útil cuando quieres errores estructurados de esquema y SecretRef/resolubilidad.

## Salida de herramientas

- Las llamadas de herramientas se muestran como tarjetas con argumentos + resultados.
- Ctrl+O alterna entre vistas contraídas/expandidas.
- Mientras las herramientas se ejecutan, las actualizaciones parciales se transmiten en la misma tarjeta.

## Colores de terminal

- La TUI mantiene el texto del cuerpo del asistente en el primer plano predeterminado de tu terminal para que tanto los terminales oscuros como claros sigan siendo legibles.
- Si tu terminal usa un fondo claro y la autodetección es incorrecta, establece `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar la paleta oscura original en su lugar, establece `OPENCLAW_THEME=dark`.

## Historial + transmisión

- Al conectar, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas en streaming se actualizan en el mismo lugar hasta finalizar.
- La TUI también escucha eventos de herramientas del agente para tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se conecta con el id de cliente `openclaw-tui` bajo el modo de cliente amplio `ui` (el mismo modo que usan Control UI y WebChat para la política del Gateway).
- Las reconexiones muestran un mensaje del sistema; las brechas de eventos se exponen en el registro.

## Opciones

- `--local`: Ejecutar contra el entorno de ejecución local del agente integrado
- `--url <url>`: URL WebSocket del Gateway (usa de forma predeterminada `gateway.remote.url` de la configuración, o `ws://127.0.0.1:<port>` en loopback)
- `--token <token>`: token del Gateway (si se requiere)
- `--password <password>`: contraseña del Gateway (si se requiere)
- `--session <key>`: clave de sesión (predeterminado: `main`, o `global` cuando el alcance es global)
- `--deliver`: entregar respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: anular el nivel de razonamiento para envíos
- `--message <text>`: enviar un mensaje inicial después de conectar
- `--timeout-ms <ms>`: tiempo de espera del agente en ms (usa de forma predeterminada `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entradas de historial que cargar (predeterminado `200`)

<Warning>
Cuando estableces `--url`, la TUI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error. En modo local, no pases `--url`, `--token` ni `--password`.
</Warning>

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que el Gateway está conectado e inactivo/ocupado.
- Revisa los registros del Gateway: `openclaw logs --follow`.
- Confirma que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, confirma que la TUI se inició con `--deliver` (esto no puede activarse más tarde sin reiniciar).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que el Gateway esté en ejecución y de que tus `--url/--token/--password` sean correctos.
- No hay agentes en el selector: revisa `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesión vacío: puede que estés en alcance global o que aún no tengas sesiones.

## Relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Config](/es/cli/config) — inspecciona, valida y edita `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de CLI](/es/cli) — referencia completa de comandos de CLI
