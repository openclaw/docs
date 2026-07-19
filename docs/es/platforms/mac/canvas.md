---
read_when:
    - Implementación del panel Canvas de macOS
    - Adición de controles del agente para el espacio de trabajo visual
    - Depuración de cargas de canvas en WKWebView
summary: Panel de Canvas controlado por el agente e integrado mediante WKWebView y un esquema de URL personalizado
title: Lienzo
x-i18n:
    generated_at: "2026-07-19T02:06:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 56532246bc06601aa753a59f85f33bfa8d6599deecade591a03972e8b9b16fc2
    source_path: platforms/mac/canvas.md
    workflow: 16
---

La aplicación para macOS integra un **panel Canvas** controlado por el agente mediante `WKWebView`, un
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

Si no existe ningún `index.html` en la raíz, la aplicación muestra una página de estructura inicial integrada.

## Comportamiento del panel

- Panel sin bordes y redimensionable, anclado cerca de la barra de menús (o del cursor del ratón).
- Mostrar Canvas no cambia de aplicación ni quita el foco del teclado.
- Recuerda el tamaño y la posición en cada sesión.
- Se recarga automáticamente cuando cambian los archivos locales de Canvas.
- Solo hay un panel Canvas visible a la vez (se cambia de sesión según sea necesario).

Canvas se puede desactivar desde Settings -> **Allow Canvas**. Cuando está desactivado,
los comandos del nodo de Canvas devuelven `CANVAS_DISABLED`.

## Superficie de la API del agente

Canvas se expone mediante el WebSocket del Gateway, por lo que el agente puede mostrar u ocultar el
panel, navegar hasta una ruta o URL, evaluar JavaScript y capturar una
imagen instantánea:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`eval` y `a2ui.*` actualizan el contenido sin abrir ni revelar el panel. Solo
`present`, `navigate` o una acción del usuario lo muestran; tras ocultarlo, las actualizaciones de contenido
siguen aplicándose al panel oculto. `snapshot` requiere un panel visible y,
de lo contrario, devuelve `CANVAS_HIDDEN`; primero se debe ejecutar `present`.

`canvas.navigate` acepta rutas locales de Canvas, URL `http(s)` y URL `file://`.
Al pasar `"/"`, se muestra la estructura inicial local o `index.html`.

Los destinos alojados en el Gateway bajo `/__openclaw__/canvas/` y
`/__openclaw__/a2ui/` se resuelven mediante la URL de Canvas con ámbito actual de la sesión
del nodo. La aplicación actualiza esa capacidad de corta duración antes de navegar;
no es necesario crear ni copiar manualmente una URL de capacidad.

## A2UI en Canvas

A2UI está alojado por el host de Canvas del Gateway y se renderiza dentro del panel
Canvas. Cuando el Gateway anuncia un host de Canvas, la aplicación para macOS navega
automáticamente a la página del host de A2UI al abrirse por primera vez.

La URL anunciada tiene un ámbito de capacidad; por ejemplo,
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Debe tratarse como credenciales efímeras, no como un enlace estable.

### Comandos de A2UI (v0.8)

Canvas acepta mensajes de servidor a cliente de A2UI v0.8: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9)
aún no es compatible.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Si puede leer esto, el envío de A2UI funciona."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Prueba rápida de funcionamiento:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hola desde A2UI"
```

## Activación de ejecuciones del agente desde Canvas

Canvas puede activar nuevas ejecuciones del agente mediante enlaces profundos `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parámetros de consulta compatibles:

| Parámetro                  | Significado                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Prompt del agente rellenado previamente.                               |
| `sessionKey`               | Identificador estable de la sesión.                            |
| `thinking`                 | Perfil de razonamiento opcional.                            |
| `deliver`, `to`, `channel` | Destino de entrega.                                      |
| `timeoutSeconds`           | Tiempo de espera opcional de la ejecución.                                 |
| `key`                      | Token de seguridad generado por la aplicación para emisores locales de confianza. |

La aplicación solicita confirmación a menos que se proporcione una clave válida. Los
enlaces sin clave muestran el mensaje y la URL antes de la aprobación e ignoran los campos
de enrutamiento de entrega; los enlaces con clave utilizan la ruta normal de ejecución del Gateway.

## Notas de seguridad

- El esquema de Canvas bloquea el recorrido de directorios; los archivos deben encontrarse bajo la raíz de la sesión.
- El contenido local de Canvas utiliza un esquema personalizado (no se requiere un servidor de bucle invertido).
- Las URL externas `http(s)` solo se permiten cuando se navega explícitamente hasta ellas.
- Las páginas web comunes son solo para renderización. Las acciones del agente solo se aceptan desde el
  esquema de Canvas propiedad de la aplicación o desde el documento A2UI exacto del Gateway con ámbito de capacidad
  seleccionado por la aplicación; los subfotogramas, las redirecciones, las capacidades obsoletas y las consultas
  modificadas no pueden enviar acciones.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [WebChat](/es/web/webchat)
