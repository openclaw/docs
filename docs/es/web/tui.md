---
read_when:
    - Quieres una guía paso a paso para principiantes sobre la TUI
    - Necesita la lista completa de funciones, comandos y atajos de TUI
summary: 'Interfaz de terminal (TUI): conéctate al Gateway o ejecútala localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-04-30T06:08:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5caca4b3f4df02ce1226a8ed0d759023464e5b0752b9cd1b7922b20099d58df1
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
- El modo local usa directamente el runtime de agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- `openclaw` y `openclaw crestodian` también usan este shell de TUI, con Crestodian como backend de chat local para configuración y reparación.

## Qué ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro de chat: mensajes del usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (conectando, ejecutando, transmitiendo, inactivo, error).
- Pie: estado de conexión + agente + sesión + modelo + think/fast/verbose/trace/reasoning + conteos de tokens + entrega.
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
- El agente y la sesión actuales siempre están visibles en el pie.

## Envío + entrega

- Los mensajes se envían al Gateway; la entrega a proveedores está desactivada de forma predeterminada.
- Activa la entrega:
  - `/deliver on`
  - o el panel Configuración
  - o inicia con `openclaw tui --deliver`

## Selectores + superposiciones

- Selector de modelo: lista los modelos disponibles y establece la anulación de sesión.
- Selector de agente: elige un agente diferente.
- Selector de sesión: muestra solo las sesiones del agente actual.
- Configuración: alterna la entrega, la expansión de salida de herramientas y la visibilidad del pensamiento.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: abortar ejecución activa
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
- `/usage <off|tokens|full>`
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

Otros comandos slash del Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulta [Comandos slash](/es/tools/slash-commands).

## Comandos de shell locales

- Prefija una línea con `!` para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita una vez por sesión permitir la ejecución local; si se rechaza, `!` queda desactivado para la sesión.
- Los comandos se ejecutan en un shell nuevo, no interactivo, en el directorio de trabajo de la TUI (sin `cd`/env persistentes).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` solo se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Reparar configuraciones desde la TUI local

Usa el modo local cuando la configuración actual ya valide y quieras que el
agente integrado la inspeccione en la misma máquina, la compare con la documentación
y ayude a reparar desviaciones sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, empieza primero con `openclaw configure`
o `openclaw doctor --fix`. `openclaw chat` no omite la protección de configuración
inválida.

Bucle típico:

1. Inicia el modo local:

```bash
openclaw chat
```

2. Pídele al agente lo que quieres comprobar, por ejemplo:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Usa comandos de shell locales para obtener evidencia exacta y validar:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplica cambios acotados con `openclaw config set` u `openclaw configure`, luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Consejos:

- Prefiere `openclaw config set` u `openclaw configure` antes que editar `openclaw.json` a mano.
- `openclaw docs "<query>"` busca en el índice de documentación en vivo desde la misma máquina.
- `openclaw config validate --json` es útil cuando quieres errores estructurados de esquema y de SecretRef/resolubilidad.

## Salida de herramientas

- Las llamadas a herramientas se muestran como tarjetas con argumentos + resultados.
- Ctrl+O alterna entre vistas contraídas/expandidas.
- Mientras se ejecutan las herramientas, las actualizaciones parciales se transmiten en la misma tarjeta.

## Colores de terminal

- La TUI mantiene el texto del cuerpo del asistente en el primer plano predeterminado de tu terminal para que tanto los terminales oscuros como los claros sigan siendo legibles.
- Si tu terminal usa un fondo claro y la detección automática es incorrecta, establece `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar la paleta oscura original en su lugar, establece `OPENCLAW_THEME=dark`.

## Historial + streaming

- Al conectar, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas en streaming se actualizan en el lugar hasta finalizar.
- La TUI también escucha eventos de herramientas del agente para tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se registra en el Gateway como `mode: "tui"`.
- Las reconexiones muestran un mensaje del sistema; los vacíos de eventos se muestran en el registro.

## Opciones

- `--local`: Ejecutar contra el runtime de agente integrado local
- `--url <url>`: URL WebSocket del Gateway (usa la configuración o `ws://127.0.0.1:<port>` de forma predeterminada)
- `--token <token>`: token del Gateway (si es necesario)
- `--password <password>`: contraseña del Gateway (si es necesaria)
- `--session <key>`: clave de sesión (predeterminado: `main`, o `global` cuando el alcance es global)
- `--deliver`: entregar respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: anular el nivel de pensamiento para envíos
- `--message <text>`: enviar un mensaje inicial después de conectar
- `--timeout-ms <ms>`: tiempo de espera del agente en ms (usa `agents.defaults.timeoutSeconds` de forma predeterminada)
- `--history-limit <n>`: entradas de historial que cargar (predeterminado `200`)

<Warning>
Cuando estableces `--url`, la TUI no recurre a la configuración ni a credenciales de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error. En modo local, no pases `--url`, `--token` ni `--password`.
</Warning>

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que el Gateway esté conectado e inactivo/ocupado.
- Revisa los registros del Gateway: `openclaw logs --follow`.
- Confirma que el agente pueda ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, habilita la entrega (`/deliver on` o `--deliver`).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que el Gateway esté en ejecución y de que tus `--url/--token/--password` sean correctos.
- No hay agentes en el selector: revisa `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesión vacío: puede que estés en alcance global o que todavía no tengas sesiones.

## Relacionado

- [UI de control](/es/web/control-ui) — interfaz de control basada en web
- [Configuración](/es/cli/config) — inspecciona, valida y edita `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de la CLI](/es/cli) — referencia completa de comandos de la CLI
