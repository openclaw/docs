---
read_when:
    - Permitir que el agente del Gateway vea y controle un equipo de escritorio emparejado
    - Activación, permisos o seguridad para el uso del ordenador
    - Ampliación del comando de nodo computer.act o de sus ejecutores
summary: Control del escritorio basado en capacidades mediante la herramienta computer y el comando de nodo computer.act
title: Uso del ordenador
x-i18n:
    generated_at: "2026-07-22T10:37:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df8ce87e607ce1b22d91e4ed8702d500bccd4d4f59dab7b0eafac565e730d48a
    source_path: nodes/computer-use.md
    workflow: 16
---

El uso del ordenador permite que el agente del Gateway vea y controle un escritorio vinculado con las capacidades necesarias. La elegibilidad se basa en capacidades: el nodo conectado debe anunciar tanto `computer.act` como `screen.snapshot`, cuyo resultado debe incluir un `displayFrameId`. La herramienta captura una pantalla como marco de referencia y, a continuación, controla el puntero y el teclado mediante el comando peligroso `computer.act`. El conjunto de acciones sigue las acciones principales de uso del ordenador de Anthropic; el zoom opcional `computer_20251124` no está disponible. Un modelo con capacidad de visión lo controla mediante la herramienta de agente integrada `computer`.

El agente emite un único comando uniforme, `computer.act`; no puede saber cómo lo ejecuta un nodo. La aplicación de macOS incluida gestiona el comando dentro del proceso con servicios Peekaboo integrados y primitivas específicas de CoreGraphics (permisos TCC correctos, sin procesos adicionales). Windows y Linux pueden usar el Plugin opcional y experimental `cua-computer` con un binario `cua-driver` instalado por separado. Ambos ejecutores utilizan la misma política de vinculación y habilitación.

## Requisitos

- Un nodo vinculado y conectado que anuncie tanto `computer.act` como `screen.snapshot`, con `screen.snapshot` devolviendo `displayFrameId`.
- **Ejecutor de macOS:** ajuste de la aplicación **Allow Computer Control** habilitado (valor predeterminado: desactivado).
- **Ejecutor de macOS:** permiso **Accessibility** concedido a OpenClaw (para la inyección de acciones del puntero y el teclado) y permiso **Screen Recording** (para `screen.snapshot`).
- **Ejecutor de Windows/Linux:** Plugin `cua-computer` incluido habilitado y un ejecutable `cua-driver` 0.10.x compatible instalado.
- El comando `computer.act` habilitado en el Gateway (es peligroso y está deshabilitado de forma predeterminada).
- Un modelo de agente con capacidad de visión.
- Una política de herramientas que exponga `computer`. El perfil predeterminado `coding` no lo hace. Añada `computer` a `tools.alsoAllow`; los agentes aislados también lo necesitan en `tools.sandbox.tools.alsoAllow`.

## La herramienta de agente `computer`

La herramienta integrada `computer` admite una acción por llamada. Las coordenadas son píxeles enteros no negativos de la captura de pantalla más reciente; el nodo los asigna a puntos de la pantalla. Las acciones con coordenadas deben repetir el `frameId` del resultado de la captura de pantalla, y un `screenIndex` explícito debe coincidir con ese marco. OpenClaw también transfiere a la acción una identidad de pantalla emitida por el nodo a partir de la captura, de modo que una reconexión de la pantalla o un cambio de geometría provocan un cierre seguro en lugar de redirigir silenciosamente la acción al mismo índice. Estas comprobaciones rechazan los tokens adivinados y los tokens de otro marco o pantalla entregados. Un token no garantiza la vigencia: las aplicaciones pueden cambiar los píxeles de la misma pantalla después de la captura, por lo que debe realizarse una nueva captura siempre que la escena pueda haber cambiado.

- Lectura: `screenshot`.
- Puntero: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (con `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Desplazamiento: `scroll` con `scrollDirection` (`up|down|left|right`) y `scrollAmount` (pasos de la rueda).
- Teclado: `type` (texto), `key` (combinación como `cmd+shift+t` o `Return`), `hold_key` (combinación `text` mantenida durante `duration` segundos).
- Ritmo: `wait` (`duration` segundos).

Las teclas modificadoras se transmiten mediante el campo `text` en las acciones de clic y desplazamiento (`shift`, `ctrl`, `alt`, `cmd`). Después de una acción de entrada, la herramienta devuelve una captura de pantalla nueva para que el modelo pueda observar el resultado. Si hay más de un nodo con capacidad de uso del ordenador conectado, pase `node` explícitamente.

Las capturas de pantalla se conservan **solo para el modelo**: nunca se envían automáticamente al canal de chat. Trate todo el contenido en pantalla como entrada no fiable; la herramienta advierte al modelo que no siga instrucciones en pantalla que entren en conflicto con la solicitud del usuario.

## Windows y Linux (experimental, mediante cua-driver)

El Plugin `cua-computer` incluido proporciona un ejecutor experimental para hosts de nodos Windows y Linux. Está deshabilitado de forma predeterminada y requiere el contrato del controlador de versión preliminar 0.10.x:

1. Instale un binario `cua-driver` 0.10.x desde las [versiones publicadas del proyecto original](https://github.com/trycua/cua/releases) y asegúrese de que esté disponible en `PATH`. Para usar otra ubicación del ejecutable, configure `plugins.entries.cua-computer.config.driverPath`.
2. Habilite el Plugin:

   ```bash
   openclaw plugins enable cua-computer
   ```

3. Inicie `openclaw node run` desde la sesión de escritorio interactiva. El Plugin inicia el daemon local del controlador de forma diferida cuando llega la primera captura o acción.

Este ejecutor controla actualmente solo la pantalla principal. X11/XWayland es la opción principal en Linux. Wayland nativo sigue siendo una opción habilitada expresamente en el proyecto original: configure `CUA_DRIVER_RS_ENABLE_WAYLAND` por su cuenta antes de iniciar el nodo; OpenClaw nunca lo configura automáticamente. KDE/KWin no es compatible con la ruta de entrada de Wayland nativo del proyecto original. `hold_key`, `left_mouse_down` y `left_mouse_up` no están disponibles porque cua-driver 0.10.x no dispone de un contrato multiplataforma para mantener entradas en el ámbito del escritorio. El desplazamiento y el arrastre con modificadores mantenidos no están disponibles en ninguna de las plataformas, y los clics con modificadores mantenidos no están disponibles en Linux. La acción `key` acepta nombres de teclas, letras y combinaciones con modificadores (por ejemplo, `cmd+c` o `Return`); se rechazan las teclas de dígitos y puntuación porque el controlador descarta su estado de mayúsculas dependiente de la distribución, por lo que ese texto debe enviarse mediante la acción `type`. La escritura de texto no puede cancelarse durante una llamada del controlador `type_text`.

Como cua-driver no informa de una identidad estable de la pantalla, la autorización del marco se vincula a la conexión del controlador y a la geometría activa de la pantalla principal. Una reconexión del daemon o de la sesión invalida los marcos pendientes, pero no puede detectarse la sustitución de la pantalla principal por otra con la misma geometría si la conexión permanece abierta; para este ejecutor, es preferible utilizar una sesión estable con una sola pantalla.

OpenClaw deshabilita la telemetría y las comprobaciones de actualizaciones de cua-driver para los procesos `mcp` y `serve` que gestiona. No descarga ni actualiza el binario del controlador.

### Solución de problemas

El ejecutor `cua-computer` muestra códigos de error tipados en el resultado de la herramienta y en los registros del nodo. Estos son algunos de los más habituales:

| Código                                                 | Causa                                                                                                                                                           | Solución                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `COMPUTER_DRIVER_UNAVAILABLE`                        | El binario `cua-driver` no está en `PATH` (o `driverPath` es incorrecto), el daemon no estuvo listo a tiempo o el nodo no es Windows/Linux.                 | Instale `cua-driver` 0.10.x en `PATH` o configure `driverPath`. Ejecute `openclaw node run` dentro de la sesión de escritorio interactiva; en Linux, asegúrese de que exista un `DISPLAY` de X11 (o un `WAYLAND_DISPLAY` con `CUA_DRIVER_RS_ENABLE_WAYLAND`). |
| `COMPUTER_DRIVER_UNSUPPORTED`                        | El controlador conectado no es `cua-driver` 0.10.x o su versión de capacidades/esquema es diferente.                                                                      | Instale una compilación 0.10.x compatible. El Plugin vuelve a realizar la detección unos 30 segundos después de corregirlo, por lo que no es necesario reiniciar el nodo.                                                                                                          |
| `COMPUTER_REFUSED_<code>`                            | El controlador rechazó la acción con un código estructurado como `background_unavailable`, `background_occluded` o `foreground_unavailable` (Wayland de KDE/KWin).   | Traiga la ventana de destino al frente, cambie a X11 o utilice un compositor compatible. Consulte las notas de compatibilidad anteriores.                                                                                                                    |
| `COMPUTER_STALE_FRAME`                               | Las coordenadas hacían referencia a una captura de pantalla que ya no está vigente (Compaction del contexto, un cambio en la geometría de la pantalla o un cambio del ancho de referencia).                 | Realice una nueva `screenshot` antes de la acción con coordenadas.                                                                                                                                                                              |
| `COMPUTER_UNSUPPORTED_ACTION`                        | Una acción que este ejecutor no puede realizar fielmente: `hold_key`, `left_mouse_down`, `left_mouse_up`, arrastrar/desplazar con un modificador mantenido o hacer clic con un modificador mantenido en Linux. | Utilice una acción compatible. cua-driver 0.10.x no dispone de un contrato de entrada mantenida en el ámbito del escritorio.                                                                                                                                                  |
| `COMPUTER_UNSUPPORTED_DISPLAY`                       | Un `screenIndex` que no es el principal, una discrepancia entre las geometrías de captura y pantalla o un cursor fuera de la pantalla principal.                                                       | Controle únicamente la pantalla principal.                                                                                                                                                                                                      |
| `COMPUTER_UNSUPPORTED_KEY`                           | Un valor `key` que el controlador no puede reproducir de forma fiable: una tecla de dígito o puntuación cuyo estado de mayúsculas depende de la distribución, o una tecla desconocida.                        | Envíe ese texto mediante la acción `type`.                                                                                                                                                                                    |
| `COMPUTER_DRIVER_ERROR` / `COMPUTER_INVALID_REQUEST` | El controlador falló sin un código estructurado o los argumentos de la acción tenían un formato incorrecto.                                                                            | Compruebe el estado del controlador y vuelva a realizar una captura de pantalla; corrija los argumentos de la acción.                                                                                                                                                        |

## El comando de nodo `computer.act`

`computer.act` es el único comando de nodo mediante el que la herramienta enruta la entrada (`node.invoke` con `command: "computer.act"`). Es:

- **Peligroso de forma predeterminada**: figura entre los comandos de nodo peligrosos integrados y queda excluido de la lista de permitidos en tiempo de ejecución hasta que se habilita explícitamente. Los nodos de escritorio de macOS, Windows y Linux pueden declararlo durante la vinculación para que la superficie se apruebe una sola vez.
- **Basado en capacidades**: la herramienta requiere que un nodo conectado anuncie tanto `computer.act` como `screen.snapshot`. La aplicación de macOS incluida y el Plugin experimental `cua-computer`, que requiere habilitación expresa, ejecutan el mismo par de comandos.

Las lecturas reutilizan `screen.snapshot`; no existe una segunda ruta de captura. Consulte [Nodos de cámara y pantalla](/es/nodes/camera) para obtener información sobre el comando de captura compartido.

## Habilitar y activar

1. Habilite el ejecutor de la plataforma: en macOS, habilite **Settings → Allow Computer Control** y, a continuación, conceda **Accessibility** y **Screen Recording** en **Settings → Permissions**; en Windows/Linux, siga la configuración experimental de `cua-computer` indicada anteriormente.
2. Apruebe la actualización del emparejamiento en el Gateway (un comando nuevo fuerza un nuevo emparejamiento).
3. Exponga la herramienta al agente con capacidad de visión. Para el perfil predeterminado de `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Los agentes aislados también necesitan esta segunda barrera:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Active `computer.act` durante un periodo limitado. El Plugin `phone-control` expone un grupo `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   La activación requiere `operator.admin` (o el propietario) y caduca automáticamente. El grupo heredado `/phone arm all` excluye intencionadamente el control del escritorio; utilice el grupo explícito `computer`. La activación solo alterna lo que el Gateway puede invocar; la aplicación del Node sigue aplicando su configuración específica de la plataforma y los permisos del sistema operativo, incluidos **Allow Computer Control**, Accessibility y Screen Recording en macOS.

Para una autorización persistente, añada `computer.act` a `gateway.nodes.commands.allow` **y elimínelo de** `gateway.nodes.commands.deny`; la lista de denegación tiene prioridad. La autorización persistente no caduca automáticamente. Las entradas que ya existían antes de `/phone arm` permanecen después de `/phone disarm`; no convierta una concesión temporal en persistente mientras esté activa.

La autorización se divide deliberadamente entre habilitación y uso. Activar o
configurar de forma persistente `computer.act` requiere autoridad administrativa.
Una vez activado, un operador autenticado con `operator.write` puede invocar
`computer.act` mediante `node.invoke` hasta que la concesión caduque o se desactive;
no se realiza una comprobación administrativa por cada acción. Aprobar un Node que declara
`computer.act` solo registra la superficie para que pueda activarse posteriormente y no
habilita la invocación por sí mismo.

## Seguridad

- Antes de la autorización, todas las capas (la política de herramientas, la política de comandos del Gateway, la configuración de la aplicación del Node y los permisos de la plataforma) deben coincidir. En el ejecutor actual de macOS, esto incluye **Allow Computer Control**, Accessibility y Screen Recording. Una vez activado, las acciones se ejecutan sin confirmación individual hasta que caduque o se ejecute `/phone disarm`.
- El ejecutor de macOS introduce el texto grafema por grafema, por lo que una cancelación, desconexión, pausa, deshabilitación o sustitución del endpoint lo detiene antes del siguiente grafema. El ejecutor experimental cua-driver no puede cancelar una llamada a `type_text` mientras está escribiendo.
- Las capturas de pantalla son solo para el modelo y nunca se envían automáticamente al chat (incidencia [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Trate el contenido de la pantalla como no confiable; puede contener una inyección de instrucciones.

## Relación con otras vías de control del escritorio

Esta es la vía controlada por el agente. Consulte [puente Peekaboo](/es/platforms/mac/peekaboo) para conocer su relación con el host PeekabooBridge, Codex Computer Use y el MCP directo `cua-driver`.
