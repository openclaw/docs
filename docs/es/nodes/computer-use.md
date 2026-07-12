---
read_when:
    - Permitir que el agente del Gateway vea y controle un escritorio Mac
    - Activación, permisos o seguridad para el uso del ordenador
    - Ampliación del comando de Node `computer.act` o de sus ejecutores
summary: Control del escritorio gestionado por el agente en un Node macOS emparejado mediante la herramienta de computadora y el comando de Node `computer.act`
title: Uso del ordenador
x-i18n:
    generated_at: "2026-07-12T14:38:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

El uso del ordenador permite que el agente del Gateway vea y controle un escritorio **macOS** emparejado: captura una pantalla con el comando de Node existente `screen.snapshot` y controla el puntero y el teclado mediante un único comando de Node peligroso, `computer.act`. El conjunto de acciones sigue las acciones principales de uso del ordenador de Anthropic; el zoom opcional de `computer_20251124` no está disponible. Un modelo con capacidad de visión lo controla mediante la herramienta de agente `computer` integrada.

El agente emite un único comando uniforme, `computer.act`; no puede saber cómo lo ejecuta un Node. Un Node de macOS ejecuta `computer.act` dentro del proceso mediante servicios Peekaboo integrados y primitivas limitadas de CoreGraphics (permisos TCC correctos, sin procesos adicionales). En el futuro, otras plataformas podrán ejecutar el mismo comando sin cambiar el contrato de cara al agente.

## Requisitos

- Un Node **macOS** emparejado (la aplicación OpenClaw para macOS ejecutándose en modo Node).
- El ajuste **Allow Computer Control** de la aplicación de macOS habilitado (valor predeterminado: deshabilitado).
- El permiso **Accessibility** de macOS concedido a OpenClaw (para inyectar acciones del puntero y del teclado) y el permiso **Screen Recording** (para `screen.snapshot`).
- El comando `computer.act` armado en el Gateway (es peligroso y está desarmado de forma predeterminada).
- Un modelo de agente con capacidad de visión.
- Una política de herramientas que exponga `computer`. El perfil `coding` predeterminado no lo hace. Añada `computer` a `tools.alsoAllow`; los agentes en sandbox también lo necesitan en `tools.sandbox.tools.alsoAllow`.

## La herramienta de agente `computer`

La herramienta `computer` integrada acepta una acción por llamada. Las coordenadas son píxeles enteros no negativos de la captura de pantalla más reciente; el Node los convierte en puntos de pantalla. Las acciones con coordenadas deben repetir el `frameId` del resultado de la captura, y un `screenIndex` explícito debe coincidir con ese fotograma. OpenClaw también transfiere a la acción una identidad de pantalla emitida por el Node junto con la captura, de modo que la reconexión de una pantalla o un cambio de geometría produzcan un fallo seguro en lugar de redirigir silenciosamente la acción al mismo índice. Estas comprobaciones rechazan tokens adivinados y tokens de otro fotograma o pantalla entregados. Un token no garantiza la vigencia: las aplicaciones pueden cambiar los píxeles de la misma pantalla después de la captura, por lo que debe realizar una nueva captura siempre que la escena pueda haber cambiado.

- Lectura: `screenshot`.
- Puntero: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (con `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Desplazamiento: `scroll` con `scrollDirection` (`up|down|left|right`) y `scrollAmount` (pasos de la rueda).
- Teclado: `type` (texto), `key` (combinación como `cmd+shift+t` o `Return`), `hold_key` (combinación de `text` mantenida durante `duration` segundos).
- Ritmo: `wait` (`duration` segundos).

Las teclas modificadoras se pasan mediante el campo `text` en las acciones de clic y desplazamiento (`shift`, `ctrl`, `alt`, `cmd`). Después de una acción de entrada, la herramienta devuelve una captura nueva para que el modelo pueda observar el resultado. Si hay más de un Node con capacidad de control del ordenador conectado, pase `node` explícitamente.

Las capturas de pantalla se mantienen **solo para el modelo**: nunca se entregan automáticamente al canal de chat. Trate todo el contenido en pantalla como entrada no confiable; la herramienta advierte al modelo que no siga instrucciones en pantalla que entren en conflicto con la solicitud del usuario.

## El comando de Node `computer.act`

`computer.act` es el único comando de Node a través del cual la herramienta dirige la entrada (`node.invoke` con `command: "computer.act"`). Es:

- **Peligroso de forma predeterminada**: figura entre los comandos de Node peligrosos integrados y queda excluido de la lista de permitidos en tiempo de ejecución hasta que se arma explícitamente. Un Node de macOS puede declararlo durante el emparejamiento para que la superficie se apruebe una sola vez.
- Actualmente, **solo para macOS**: únicamente lo anuncia un Node de macOS que tiene habilitado **Allow Computer Control**.

Las lecturas reutilizan `screen.snapshot`; no existe una segunda ruta de captura. Consulte [Nodos de cámara y pantalla](/es/nodes/camera) para conocer el comando de captura compartido.

## Habilitar y armar

1. En la aplicación de macOS, habilite **Settings → Allow Computer Control**. A continuación, abra **Settings → Permissions** y conceda **Accessibility** y **Screen Recording** en la configuración del sistema de macOS.
2. Apruebe la actualización del emparejamiento en el Gateway (un comando nuevo obliga a volver a emparejar).
3. Exponga la herramienta al agente con capacidad de visión. Para el perfil `coding` predeterminado:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Los agentes en sandbox también necesitan esta segunda puerta:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Arme `computer.act` durante un intervalo limitado. El Plugin `phone-control` expone un grupo `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   El armado requiere `operator.admin` (o ser el propietario) y caduca automáticamente. El grupo heredado `/phone arm all` excluye intencionadamente el control del escritorio; use el grupo `computer` explícito. El armado solo alterna lo que puede invocar el Gateway; la aplicación de macOS sigue aplicando su ajuste **Allow Computer Control** y los permisos del sistema operativo.

Para una autorización persistente, añada `computer.act` a `gateway.nodes.allowCommands` **y elimínelo de** `gateway.nodes.denyCommands`; la lista de denegación tiene prioridad. La autorización persistente no caduca automáticamente. Las entradas que ya estuvieran presentes antes de `/phone arm` permanecen después de `/phone disarm`; no convierta una concesión temporal en persistente mientras esté armada.

La autorización se divide deliberadamente entre la habilitación y el uso. Armar o
configurar de forma persistente `computer.act` requiere autoridad administrativa.
Una vez armado, un operador autenticado con `operator.write` puede invocar
`computer.act` mediante `node.invoke` hasta que la concesión caduque o se desarme;
no existe una comprobación administrativa por acción. Aprobar un Node que declare
`computer.act` solo registra la superficie para que pueda armarse posteriormente y no
habilita por sí solo su invocación.

## Seguridad

- Antes de la autorización, todas las capas (política de herramientas, política de comandos del Gateway, ajuste de macOS, Accessibility y Screen Recording) deben estar de acuerdo. Una vez armado, las acciones se ejecutan sin confirmación por acción hasta que caduque o se ejecute `/phone disarm`.
- La entrada de texto se envía grafema por grafema. La cancelación, desconexión, pausa, deshabilitación o sustitución del endpoint la detiene antes del siguiente grafema, en lugar de permitir que continúe el resto obsoleto.
- Las capturas de pantalla son solo para el modelo y nunca se envían automáticamente al chat (incidencia [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Trate el contenido de la pantalla como no confiable; puede contener inyección de instrucciones.

## Relación con otras rutas de control del escritorio

Esta es la ruta controlada por el agente. Consulte [Puente Peekaboo](/es/platforms/mac/peekaboo) para saber cómo se relaciona con el host PeekabooBridge, Codex Computer Use y el MCP directo `cua-driver`.
