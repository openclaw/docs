---
read_when:
    - Quieres una guía amigable para principiantes de la TUI
    - Necesitas la lista completa de funciones, comandos y atajos de la TUI
summary: 'Interfaz de usuario de terminal (TUI): conectarse al Gateway o ejecutarse localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

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

Ejecuta la TUI sin Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Notas:

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no puede combinarse con `--url`, `--token` ni `--password`.
- El modo local usa directamente el entorno de ejecución integrado del agente. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.

## Qué ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro de chat: mensajes del usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (conectando, ejecutando, streaming, inactivo, error).
- Pie: estado de conexión + agente + sesión + modelo + think/fast/verbose/trace/reasoning + recuentos de tokens + deliver.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son slugs únicos (por ejemplo, `main`, `research`). El Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si escribes `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si escribes `/session agent:other:main`, cambias explícitamente a esa sesión del agente.
- Alcance de la sesión:
  - `per-sender` (predeterminado): cada agente tiene muchas sesiones.
  - `global`: la TUI siempre usa la sesión `global` (el selector puede estar vacío).
- El agente actual + la sesión actual siempre están visibles en el pie.

## Envío + entrega

- Los mensajes se envían al Gateway; la entrega a proveedores está desactivada de forma predeterminada.
- Activa la entrega:
  - `/deliver on`
  - o el panel Settings
  - o inicia con `openclaw tui --deliver`

## Selectores + superposiciones

- Selector de modelos: lista modelos disponibles y establece la anulación de sesión.
- Selector de agentes: elige un agente diferente.
- Selector de sesiones: muestra solo las sesiones del agente actual.
- Settings: alterna entrega, expansión de salida de herramientas y visibilidad del razonamiento.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: abortar la ejecución activa
- Ctrl+C: borrar entrada (pulsa dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelos
- Ctrl+G: selector de agentes
- Ctrl+P: selector de sesiones
- Ctrl+O: alternar expansión de salida de herramientas
- Ctrl+T: alternar visibilidad del razonamiento (recarga el historial)

## Comandos slash

Básicos:

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

Ciclo de vida de la sesión:

- `/new` o `/reset` (restablece la sesión)
- `/abort` (aborta la ejecución activa)
- `/settings`
- `/exit`

Solo modo local:

- `/auth [provider]` abre el flujo de autenticación/inicio de sesión del proveedor dentro de la TUI.

Otros comandos slash del Gateway (por ejemplo, `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulta [Slash commands](/es/tools/slash-commands).

## Comandos de shell locales

- Añade el prefijo `!` al inicio de una línea para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita una vez por sesión permiso para permitir la ejecución local; si lo rechazas, `!` permanece deshabilitado para la sesión.
- Los comandos se ejecutan en un shell nuevo y no interactivo en el directorio de trabajo de la TUI (sin `cd`/env persistente).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` solo se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Reparar configuraciones desde la TUI local

Usa el modo local cuando la configuración actual ya valida y quieres que el
agente integrado la inspeccione en la misma máquina, la compare con la documentación
y ayude a reparar la deriva sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya falla, empieza primero con `openclaw configure`
o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra
configuración no válida.

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

4. Aplica cambios limitados con `openclaw config set` o `openclaw configure`, y luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Consejos:

- Prefiere `openclaw config set` o `openclaw configure` antes que editar manualmente `openclaw.json`.
- `openclaw docs "<query>"` busca en el índice activo de documentación desde la misma máquina.
- `openclaw config validate --json` es útil cuando quieres errores estructurados de esquema y de SecretRef/resolubilidad.

## Salida de herramientas

- Las llamadas a herramientas se muestran como tarjetas con argumentos + resultados.
- Ctrl+O alterna entre vistas contraída/expandida.
- Mientras las herramientas se ejecutan, las actualizaciones parciales fluyen a la misma tarjeta.

## Colores del terminal

- La TUI mantiene el texto del cuerpo del asistente en el color de primer plano predeterminado de tu terminal para que tanto los terminales oscuros como los claros sigan siendo legibles.
- Si tu terminal usa un fondo claro y la autodetección es incorrecta, establece `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar en su lugar la paleta oscura original, establece `OPENCLAW_THEME=dark`.

## Historial + streaming

- Al conectarse, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas en streaming se actualizan en el mismo lugar hasta finalizar.
- La TUI también escucha eventos de herramientas del agente para tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se registra en el Gateway como `mode: "tui"`.
- Las reconexiones muestran un mensaje del sistema; los huecos de eventos se muestran en el registro.

## Opciones

- `--local`: Ejecutar contra el entorno de ejecución integrado local del agente
- `--url <url>`: URL WebSocket del Gateway (predeterminado: configuración o `ws://127.0.0.1:<port>`)
- `--token <token>`: Token del Gateway (si es necesario)
- `--password <password>`: Contraseña del Gateway (si es necesario)
- `--session <key>`: Clave de sesión (predeterminado: `main`, o `global` cuando el alcance es global)
- `--deliver`: Entregar respuestas del asistente al proveedor (predeterminado: desactivado)
- `--thinking <level>`: Anular el nivel de razonamiento para los envíos
- `--message <text>`: Enviar un mensaje inicial después de conectar
- `--timeout-ms <ms>`: Tiempo de espera del agente en ms (predeterminado: `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas de historial que se cargarán (predeterminado: `200`)

Nota: cuando estableces `--url`, la TUI no recurre a credenciales de configuración o de entorno.
Pasa explícitamente `--token` o `--password`. La ausencia de credenciales explícitas es un error.
En modo local, no pases `--url`, `--token` ni `--password`.

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que el Gateway está conectado e inactivo/ocupado.
- Comprueba los registros del Gateway: `openclaw logs --follow`.
- Confirma que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, habilita la entrega (`/deliver on` o `--deliver`).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que el Gateway se esté ejecutando y de que `--url/--token/--password` sean correctos.
- No hay agentes en el selector: comprueba `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesiones vacío: puede que estés en alcance global o que aún no tengas sesiones.

## Relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Config](/es/cli/config) — inspeccionar, validar y editar `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [CLI Reference](/es/cli) — referencia completa de comandos CLI
