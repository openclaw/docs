---
read_when:
    - Implementación del panel Canvas de macOS
    - Agregar controles de agente para el espacio de trabajo visual
    - Depurar cargas de canvas de WKWebView
summary: Panel Canvas controlado por agente incrustado mediante WKWebView + esquema de URL personalizado
title: Canvas
x-i18n:
    generated_at: "2026-07-05T11:31:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a28ebad43f6135e199f1aa03e45aa92ad309d11348d5a47121b1418442b6fe17
    source_path: platforms/mac/canvas.md
    workflow: 16
---

La app de macOS incrusta un **panel Canvas** controlado por agente mediante `WKWebView`, un
espacio de trabajo visual ligero para HTML/CSS/JS, A2UI y pequeñas superficies
de interfaz de usuario interactivas.

## Dónde se encuentra Canvas

El estado de Canvas se almacena en Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

El panel Canvas sirve esos archivos mediante un esquema de URL personalizado,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Si no existe ningún `index.html` en la raíz, la app muestra una página de andamiaje integrada.

## Comportamiento del panel

- Panel sin bordes y redimensionable anclado cerca de la barra de menús (o del cursor del mouse).
- Recuerda el tamaño y la posición por sesión.
- Se recarga automáticamente cuando cambian los archivos locales de Canvas.
- Solo un panel Canvas es visible a la vez (la sesión cambia según sea necesario).

Canvas se puede desactivar desde Settings -> **Allow Canvas**. Cuando está desactivado,
los comandos de nodo de canvas devuelven `CANVAS_DISABLED`.

## Superficie de API del agente

Canvas se expone mediante el WebSocket del Gateway, de modo que el agente puede mostrar/ocultar el
panel, navegar a una ruta o URL, evaluar JavaScript y capturar una
imagen instantánea:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` acepta rutas locales de canvas, URL `http(s)` y URL `file://`.
Pasar `"/"` muestra el andamiaje local o `index.html`.

## A2UI en Canvas

A2UI está alojado por el host de canvas del Gateway y se renderiza dentro del panel
Canvas. Cuando el Gateway anuncia un host de Canvas, la app de macOS navega automáticamente
a la página host de A2UI en la primera apertura.

URL predeterminada del host de A2UI: `http://<gateway-host>:18789/__openclaw__/a2ui/`

### Comandos de A2UI (v0.8)

Canvas acepta mensajes servidor-a-cliente de A2UI v0.8: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) aún
no es compatible.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Prueba rápida de humo:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Activar ejecuciones de agente desde Canvas

Canvas puede activar nuevas ejecuciones de agente mediante enlaces profundos `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parámetros de consulta compatibles:

| Parámetro                  | Significado                                           |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Prompt del agente rellenado previamente.              |
| `sessionKey`               | Identificador de sesión estable.                      |
| `thinking`                 | Perfil de pensamiento opcional.                       |
| `deliver`, `to`, `channel` | Destino de entrega.                                   |
| `timeoutSeconds`           | Tiempo de espera de ejecución opcional.               |
| `key`                      | Token de seguridad generado por la app para llamadores locales de confianza. |

La app solicita confirmación salvo que se proporcione una clave válida. Los enlaces
sin clave muestran el mensaje y la URL antes de la aprobación, e ignoran los campos
de enrutamiento de entrega; los enlaces con clave usan la ruta de ejecución normal del Gateway.

## Notas de seguridad

- El esquema de Canvas bloquea el recorrido de directorios; los archivos deben residir bajo la raíz de la sesión.
- El contenido local de Canvas usa un esquema personalizado (no se requiere servidor loopback).
- Las URL externas `http(s)` solo se permiten cuando se navega explícitamente a ellas.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [WebChat](/es/web/webchat)
