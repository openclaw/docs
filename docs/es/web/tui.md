---
read_when:
    - Quieres una guía para principiantes de la TUI
    - Necesitas la lista completa de funciones, comandos y atajos de la TUI
summary: 'Interfaz de terminal (TUI): conectarse al Gateway o ejecutarse localmente en modo embebido'
title: TUI
x-i18n:
    generated_at: "2026-04-24T05:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
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
# o
openclaw tui --local
```

Notas:

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- El modo local usa directamente el runtime embebido del agente. La mayoría de las herramientas locales funcionan, pero las funciones solo de Gateway no están disponibles.

## Qué ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro del chat: mensajes del usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (`connecting`, `running`, `streaming`, `idle`, `error`).
- Pie: estado de conexión + agente + sesión + modelo + think/fast/verbose/trace/reasoning + recuentos de tokens + deliver.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son slugs únicos (por ejemplo `main`, `research`). El Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si escribes `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si escribes `/session agent:other:main`, cambias explícitamente a esa sesión de agente.
- Ámbito de sesión:
  - `per-sender` (predeterminado): cada agente tiene muchas sesiones.
  - `global`: la TUI siempre usa la sesión `global` (el selector puede estar vacío).
- El agente actual + la sesión actual siempre son visibles en el pie.

## Envío + entrega

- Los mensajes se envían al Gateway; la entrega a proveedores está desactivada por defecto.
- Activa la entrega:
  - `/deliver on`
  - o el panel Settings
  - o inicia con `openclaw tui --deliver`

## Selectores + superposiciones

- Selector de modelo: enumera los modelos disponibles y establece la sobrescritura de sesión.
- Selector de agente: elige un agente diferente.
- Selector de sesión: muestra solo sesiones del agente actual.
- Settings: activa o desactiva deliver, la expansión de salida de herramientas y la visibilidad de thinking.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: abortar la ejecución activa
- Ctrl+C: borrar la entrada (púlsalo dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelo
- Ctrl+G: selector de agente
- Ctrl+P: selector de sesión
- Ctrl+O: alternar la expansión de salida de herramientas
- Ctrl+T: alternar la visibilidad de thinking (recarga el historial)

## Slash commands

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

Ciclo de vida de la sesión:

- `/new` o `/reset` (reinicia la sesión)
- `/abort` (aborta la ejecución activa)
- `/settings`
- `/exit`

Solo modo local:

- `/auth [provider]` abre el flujo de auth/login del proveedor dentro de la TUI.

Otros slash commands del Gateway (por ejemplo `/context`) se reenvían al Gateway y se muestran como salida del sistema. Consulta [Slash commands](/es/tools/slash-commands).

## Comandos de shell locales

- Antepone `!` a una línea para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita permiso una vez por sesión para permitir ejecución local; si lo rechazas, `!` sigue deshabilitado para la sesión.
- Los comandos se ejecutan en un shell nuevo y no interactivo en el directorio de trabajo de la TUI (sin `cd`/`env` persistentes).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` solo se envía como mensaje normal; los espacios iniciales no activan exec local.

## Reparar configuraciones desde la TUI local

Usa el modo local cuando la configuración actual ya valida y quieres que el
agente embebido la inspeccione en la misma máquina, la compare con la documentación
y ayude a reparar desviaciones sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, empieza primero con `openclaw configure`
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

4. Aplica cambios pequeños con `openclaw config set` o `openclaw configure`, luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Consejos:

- Prefiere `openclaw config set` u `openclaw configure` antes que editar a mano `openclaw.json`.
- `openclaw docs "<query>"` busca en el índice de documentación en vivo desde la misma máquina.
- `openclaw config validate --json` es útil cuando quieres errores estructurados de esquema y SecretRef/resolvability.

## Salida de herramientas

- Las llamadas de herramientas se muestran como tarjetas con args + resultados.
- Ctrl+O alterna entre vistas contraída/expandida.
- Mientras las herramientas se ejecutan, las actualizaciones parciales se transmiten en la misma tarjeta.

## Colores de terminal

- La TUI mantiene el texto del cuerpo del asistente en el color de primer plano predeterminado de tu terminal para que tanto las terminales oscuras como claras sigan siendo legibles.
- Si tu terminal usa un fondo claro y la autodetección falla, establece `OPENCLAW_THEME=light` antes de lanzar `openclaw tui`.
- Para forzar en su lugar la paleta oscura original, establece `OPENCLAW_THEME=dark`.

## Historial + streaming

- Al conectarse, la TUI carga el historial más reciente (200 mensajes por defecto).
- Las respuestas en streaming se actualizan en el sitio hasta finalizar.
- La TUI también escucha eventos de herramientas del agente para mostrar tarjetas de herramientas más completas.

## Detalles de conexión

- La TUI se registra en el Gateway como `mode: "tui"`.
- Las reconexiones muestran un mensaje del sistema; los huecos de eventos se reflejan en el registro.

## Opciones

- `--local`: ejecutar contra el runtime embebido local del agente
- `--url <url>`: URL WebSocket del Gateway (usa por defecto la config o `ws://127.0.0.1:<port>`)
- `--token <token>`: token del Gateway (si es necesario)
- `--password <password>`: contraseña del Gateway (si es necesaria)
- `--session <key>`: clave de sesión (predeterminado: `main`, o `global` cuando el ámbito es global)
- `--deliver`: entregar las respuestas del asistente al proveedor (desactivado por defecto)
- `--thinking <level>`: sobrescribir el nivel de thinking para los envíos
- `--message <text>`: enviar un mensaje inicial después de conectar
- `--timeout-ms <ms>`: tiempo de espera del agente en ms (usa por defecto `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entradas de historial que se cargarán (predeterminado `200`)

Nota: cuando estableces `--url`, la TUI no recurre a credenciales de configuración ni de entorno.
Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
En modo local, no pases `--url`, `--token` ni `--password`.

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que el Gateway está conectado y en `idle`/`busy`.
- Revisa los registros del Gateway: `openclaw logs --follow`.
- Confirma que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, habilita la entrega (`/deliver on` o `--deliver`).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que el Gateway esté en ejecución y de que `--url/--token/--password` sean correctos.
- No hay agentes en el selector: revisa `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesión vacío: puede que estés en ámbito global o que todavía no tengas sesiones.

## Relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Config](/es/cli/config) — inspeccionar, validar y editar `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [CLI Reference](/es/cli) — referencia completa de comandos CLI
