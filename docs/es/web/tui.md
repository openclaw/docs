---
read_when:
    - Quieres una guía paso a paso para principiantes sobre la TUI
    - Necesitas la lista completa de funciones, comandos y atajos de TUI
summary: 'Interfaz de terminal (TUI): conéctate al Gateway o ejecútala localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-06-27T13:16:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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

Usa `--password` si tu Gateway usa autenticación con contraseña.

### Modo local

Ejecuta la TUI sin un Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Notas:

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- El modo local usa directamente el runtime de agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas de Gateway no están disponibles.
- Después de que un archivo de configuración tenga ajustes definidos, `openclaw` y `openclaw crestodian` también usan este shell de TUI, con Crestodian como backend local de chat para configuración y reparación.

## Lo que ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro de chat: mensajes de usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (conectando, ejecutando, transmitiendo, inactivo, error).
- Pie: agente + sesión + modelo + estado del objetivo + think/fast/verbose/trace/reasoning + recuentos de tokens + entrega. Cuando `tui.footer.showRemoteHost` está habilitado, las conexiones remotas de Gateway también muestran el host de conexión.
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
- El agente + la sesión actuales siempre están visibles en el pie.
- Para mostrar el host de Gateway en conexiones respaldadas por URL que no sean locales, actívalo con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Las conexiones de loopback e integradas locales nunca muestran una etiqueta de host.

- Si la sesión tiene un [objetivo](/es/tools/goal), el pie muestra su estado compacto,
  como `Pursuing goal`, `Goal paused (/goal resume)` o
  `Goal achieved`.
- Cuando se inicia sin `--session`, la TUI en modo Gateway reanuda la última sesión seleccionada para el mismo Gateway, agente y alcance de sesión si esa sesión aún existe. Pasar `--session`, `/session`, `/new` o `/reset` sigue siendo explícito.

## Envío + entrega

- Los mensajes se envían al Gateway; la entrega a proveedores está desactivada de forma predeterminada.
- La TUI es una superficie de origen interna como WebChat, no un canal saliente genérico. Los bancos de pruebas que requieren `tools.message` para respuestas visibles pueden satisfacer el turno activo de la TUI con un `message.send` sin destino; la entrega explícita al proveedor sigue usando los canales configurados normales y nunca recurre a `lastChannel`.
- Activa la entrega:
  - `/deliver on`
  - o el panel Configuración
  - o inicia con `openclaw tui --deliver`

## Selectores + superposiciones

- Selector de modelo: lista los modelos disponibles y establece la anulación de sesión.
- Selector de agente: elige otro agente.
- Selector de sesión: muestra hasta 50 sesiones del agente actual actualizadas en los últimos 7 días. Usa `/session <key>` para saltar a una sesión conocida más antigua.
- Configuración: alterna la entrega, la expansión de salida de herramientas y la visibilidad del pensamiento.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: abortar la ejecución activa
- Ctrl+C: borrar entrada (pulsa dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelo
- Ctrl+G: selector de agente
- Ctrl+P: selector de sesión
- Ctrl+O: alternar expansión de salida de herramientas
- Ctrl+T: alternar visibilidad del pensamiento (recarga el historial)

## Comandos slash

Núcleo:

- `/help`
- `/status`
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controles de sesión:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` borra la anulación de sesión)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo de vida de sesión:

- `/new` o `/reset` (restablecer la sesión)
- `/abort` (abortar la ejecución activa)
- `/settings`
- `/exit`

Solo modo local:

- `/auth [provider]` abre el flujo de autenticación/inicio de sesión del proveedor dentro de la TUI.

Otros comandos slash de Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulta [Comandos slash](/es/tools/slash-commands).

## Comandos de shell locales

- Añade el prefijo `!` a una línea para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita una vez por sesión permitir la ejecución local; si se rechaza, `!` permanece deshabilitado para la sesión.
- Los comandos se ejecutan en un shell nuevo, no interactivo, en el directorio de trabajo de la TUI (sin `cd`/env persistente).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` aislado se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Reparar configuraciones desde la TUI local

Usa el modo local cuando la configuración actual ya se valida y quieres que el
agente integrado la inspeccione en la misma máquina, la compare con la documentación
y ayude a reparar desviaciones sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, empieza primero con `openclaw configure`
u `openclaw doctor --fix`. `openclaw chat` no evita la protección de configuración
inválida.

Bucle típico:

1. Inicia el modo local:

```bash
openclaw chat
```

2. Pide al agente lo que quieres comprobar, por ejemplo:

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

4. Aplica cambios acotados con `openclaw config set` u `openclaw configure`, luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Consejos:

- Prefiere `openclaw config set` u `openclaw configure` antes que editar manualmente `openclaw.json`.
- `openclaw docs "<query>"` busca en el índice de documentación activo desde la misma máquina.
- `openclaw config validate --json` resulta útil cuando quieres errores estructurados de esquema y SecretRef/resolubilidad.

## Salida de herramientas

- Las llamadas a herramientas se muestran como tarjetas con argumentos + resultados.
- Ctrl+O alterna entre vistas contraídas/expandidas.
- Mientras las herramientas se ejecutan, las actualizaciones parciales se transmiten en la misma tarjeta.

## Colores de terminal

- La TUI mantiene el texto del cuerpo del asistente en el primer plano predeterminado de tu terminal para que las terminales oscuras y claras sigan siendo legibles.
- Si tu terminal usa un fondo claro y la detección automática es incorrecta, establece `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar en su lugar la paleta oscura original, establece `OPENCLAW_THEME=dark`.

## Historial + streaming

- Al conectar, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas en streaming se actualizan en el lugar hasta finalizar.
- La TUI también escucha eventos de herramientas del agente para tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se registra con el Gateway como `mode: "tui"`.
- Las reconexiones muestran un mensaje del sistema; las brechas de eventos se muestran en el registro.

## Opciones

- `--local`: ejecutar contra el runtime de agente integrado local
- `--url <url>`: URL WebSocket de Gateway (usa de forma predeterminada la configuración o `ws://127.0.0.1:<port>`)
- `--token <token>`: token de Gateway (si se requiere)
- `--password <password>`: contraseña de Gateway (si se requiere)
- `--session <key>`: clave de sesión (predeterminado: `main`, o `global` cuando el alcance es global)
- `--deliver`: entregar las respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: anular el nivel de pensamiento para envíos
- `--message <text>`: enviar un mensaje inicial después de conectar
- `--timeout-ms <ms>`: tiempo de espera del agente en ms (usa de forma predeterminada `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entradas de historial que cargar (predeterminado `200`)

<Warning>
Cuando estableces `--url`, la TUI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error. En modo local, no pases `--url`, `--token` ni `--password`.
</Warning>

## Solución de problemas

Sin salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que el Gateway está conectado e inactivo/ocupado.
- Revisa los registros del Gateway: `openclaw logs --follow`.
- Confirma que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, habilita la entrega (`/deliver on` o `--deliver`).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que el Gateway esté ejecutándose y de que tus `--url/--token/--password` sean correctos.
- Sin agentes en el selector: revisa `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesión vacío: podrías estar en alcance global o aún no tener sesiones.

## Relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Configuración](/es/cli/config) — inspecciona, valida y edita `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de CLI](/es/cli) — referencia completa de comandos de CLI
