---
read_when:
    - Implementar el panel Canvas de macOS
    - Agregar controles del agente para el espacio de trabajo visual
    - Depurar cargas de Canvas en WKWebView
summary: Panel Canvas controlado por el agente incrustado mediante WKWebView + esquema de URL personalizado
title: Canvas
x-i18n:
    generated_at: "2026-04-24T05:38:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

La app de macOS incrusta un **panel Canvas** controlado por el agente mediante `WKWebView`. Es
un espacio de trabajo visual ligero para HTML/CSS/JS, A2UI y pequeñas superficies de UI interactivas.

## Dónde vive Canvas

El estado de Canvas se almacena en Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

El panel Canvas sirve esos archivos mediante un **esquema de URL personalizado**:

- `openclaw-canvas://<session>/<path>`

Ejemplos:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Si no existe `index.html` en la raíz, la app muestra una **página scaffold integrada**.

## Comportamiento del panel

- Panel sin bordes, redimensionable, anclado cerca de la barra de menús (o del cursor del ratón).
- Recuerda el tamaño/la posición por sesión.
- Se recarga automáticamente cuando cambian los archivos locales de Canvas.
- Solo un panel Canvas es visible a la vez (la sesión se cambia según sea necesario).

Canvas puede desactivarse en Configuración → **Allow Canvas**. Cuando está desactivado, los comandos de nodo de canvas devuelven `CANVAS_DISABLED`.

## Superficie de API del agente

Canvas se expone mediante el **WebSocket de Gateway**, por lo que el agente puede:

- mostrar/ocultar el panel
- navegar a una ruta o URL
- evaluar JavaScript
- capturar una imagen de instantánea

Ejemplos de CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Notas:

- `canvas.navigate` acepta **rutas locales de canvas**, URLs `http(s)` y URLs `file://`.
- Si pasas `"/"`, Canvas muestra el scaffold local o `index.html`.

## A2UI en Canvas

A2UI está alojado por el host Canvas de Gateway y se renderiza dentro del panel Canvas.
Cuando Gateway anuncia un host Canvas, la app de macOS navega automáticamente a la
página del host A2UI en la primera apertura.

URL predeterminada del host A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandos A2UI (v0.8)

Canvas acepta actualmente mensajes servidor→cliente de **A2UI v0.8**:

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

Prueba rápida:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Activar ejecuciones del agente desde Canvas

Canvas puede activar nuevas ejecuciones del agente mediante deep links:

- `openclaw://agent?...`

Ejemplo (en JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

La app solicita confirmación a menos que se proporcione una clave válida.

## Notas de seguridad

- El esquema Canvas bloquea el recorrido de directorios; los archivos deben vivir bajo la raíz de la sesión.
- El contenido local de Canvas usa un esquema personalizado (no se requiere servidor loopback).
- Las URLs externas `http(s)` solo se permiten cuando se navega a ellas explícitamente.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [WebChat](/es/web/webchat)
