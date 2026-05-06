---
read_when:
    - Implementación del panel Canvas de macOS
    - Agregar controles de agente para el espacio de trabajo visual
    - Depuración de cargas de canvas en WKWebView
summary: Panel de Canvas controlado por el agente e incrustado mediante WKWebView + esquema de URL personalizado
title: Lienzo
x-i18n:
    generated_at: "2026-05-06T05:41:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

La app de macOS integra un **panel de Canvas** controlado por agente mediante `WKWebView`. Es un espacio de trabajo visual ligero para HTML/CSS/JS, A2UI y pequeñas superficies de UI interactivas.

## Dónde vive Canvas

El estado de Canvas se almacena en Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

El panel de Canvas sirve esos archivos mediante un **esquema de URL personalizado**:

- `openclaw-canvas://<session>/<path>`

Ejemplos:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Si no existe ningún `index.html` en la raíz, la app muestra una **página de andamiaje integrada**.

## Comportamiento del panel

- Panel sin bordes, redimensionable, anclado cerca de la barra de menús (o del cursor del mouse).
- Recuerda el tamaño y la posición por sesión.
- Se recarga automáticamente cuando cambian los archivos locales de Canvas.
- Solo un panel de Canvas es visible a la vez (la sesión se cambia según sea necesario).

Canvas se puede desactivar desde Ajustes → **Permitir Canvas**. Cuando está desactivado, los comandos Node de canvas devuelven `CANVAS_DISABLED`.

## Superficie de API del agente

Canvas se expone mediante el **Gateway WebSocket**, por lo que el agente puede:

- mostrar/ocultar el panel
- navegar a una ruta o URL
- evaluar JavaScript
- capturar una imagen instantánea

Ejemplos de CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Notas:

- `canvas.navigate` acepta **rutas locales de Canvas**, URL `http(s)` y URL `file://`.
- Si pasas `"/"`, Canvas muestra el andamiaje local o `index.html`.

## A2UI en Canvas

A2UI está alojado por el host de canvas del Gateway y se renderiza dentro del panel de Canvas. Cuando el Gateway anuncia un host de Canvas, la app de macOS navega automáticamente a la página del host de A2UI al abrir por primera vez.

URL predeterminada del host de A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandos de A2UI (v0.8)

Actualmente, Canvas acepta mensajes servidor→cliente de **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) no es compatible.

Ejemplo de CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Smoke rápido:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Activar ejecuciones de agente desde Canvas

Canvas puede activar nuevas ejecuciones de agente mediante enlaces profundos:

- `openclaw://agent?...`

Ejemplo (en JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

La app solicita confirmación salvo que se proporcione una clave válida.

## Notas de seguridad

- El esquema de Canvas bloquea el recorrido de directorios; los archivos deben vivir bajo la raíz de la sesión.
- El contenido local de Canvas usa un esquema personalizado (no se requiere servidor local loopback).
- Las URL externas `http(s)` solo se permiten cuando se navega a ellas explícitamente.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [WebChat](/es/web/webchat)
