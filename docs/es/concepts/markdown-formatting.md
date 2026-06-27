---
read_when:
    - Estás cambiando el formato Markdown o la segmentación para los canales salientes
    - Está agregando un nuevo formateador de canal o una asignación de estilo
    - Estás depurando regresiones de formato en todos los canales
summary: Canalización de formato Markdown para canales salientes
title: Formato Markdown
x-i18n:
    generated_at: "2026-05-12T12:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw formatea el Markdown saliente convirtiéndolo en una representación
intermedia (IR) compartida antes de renderizar la salida específica del canal. La IR mantiene el
texto fuente intacto mientras transporta rangos de estilo/enlace para que la fragmentación y el renderizado puedan
mantenerse coherentes entre canales.

## Objetivos

- **Coherencia:** un paso de análisis, múltiples renderizadores.
- **Fragmentación segura:** dividir el texto antes de renderizar para que el formato en línea nunca
  se rompa entre fragmentos.
- **Ajuste al canal:** mapear la misma IR a mrkdwn de Slack, HTML de Telegram y
  rangos de estilo de Signal sin volver a analizar Markdown.

## Pipeline

1. **Analizar Markdown -> IR**
   - La IR es texto sin formato más rangos de estilo (negrita/cursiva/tachado/código/spoiler) y rangos de enlace.
   - Los desplazamientos son unidades de código UTF-16 para que los rangos de estilo de Signal se alineen con su API.
   - Las tablas se analizan solo cuando un canal opta por la conversión de tablas.
2. **Fragmentar IR (primero el formato)**
   - La fragmentación ocurre en el texto de la IR antes de renderizar.
   - El formato en línea no se divide entre fragmentos; los rangos se recortan por fragmento.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (negrita/cursiva/tachado/código), enlaces como `<url|label>`.
   - **Telegram:** etiquetas HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto sin formato + rangos `text-style`; los enlaces se convierten en `label (url)` cuando la etiqueta difiere.

## Ejemplo de IR

Markdown de entrada:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (esquemática):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Dónde se usa

- Los adaptadores salientes de Slack, Telegram y Signal renderizan desde la IR.
- Otros canales (WhatsApp, iMessage, Microsoft Teams, Discord) siguen usando texto sin formato o
  sus propias reglas de formato, con la conversión de tablas Markdown aplicada antes de la
  fragmentación cuando está habilitada.

## Manejo de tablas

Las tablas Markdown no se admiten de forma coherente en todos los clientes de chat. Usa
`markdown.tables` para controlar la conversión por canal (y por cuenta).

- `code`: renderiza tablas como bloques de código (predeterminado para la mayoría de los canales).
- `bullets`: convierte cada fila en viñetas (predeterminado para Matrix, Signal y WhatsApp).
- `off`: desactiva el análisis y la conversión de tablas; el texto de tabla sin procesar pasa sin cambios.

Claves de configuración:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Reglas de fragmentación

- Los límites de fragmentos provienen de los adaptadores/configuración de canal y se aplican al texto de la IR.
- Las vallas de código se conservan como un único bloque con una nueva línea final para que los canales
  las rendericen correctamente.
- Los prefijos de lista y los prefijos de cita en bloque forman parte del texto de la IR, por lo que la fragmentación
  no divide a mitad de prefijo.
- Los estilos en línea (negrita/cursiva/tachado/código-en-línea/spoiler) nunca se dividen entre
  fragmentos; el renderizador reabre los estilos dentro de cada fragmento.

Si necesitas más información sobre el comportamiento de la fragmentación entre canales, consulta
[Streaming + fragmentación](/es/concepts/streaming).

## Política de enlaces

- **Slack:** `[label](url)` -> `<url|label>`; las URL desnudas permanecen desnudas. Autolink
  se desactiva durante el análisis para evitar enlaces duplicados.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análisis HTML).
- **Signal:** `[label](url)` -> `label (url)` salvo que la etiqueta coincida con la URL.

## Spoilers

Los marcadores de spoiler (`||spoiler||`) se analizan solo para Signal, donde se asignan a
rangos de estilo SPOILER. Otros canales los tratan como texto sin formato.

## Cómo agregar o actualizar un formateador de canal

1. **Analizar una vez:** usa el helper compartido `markdownToIR(...)` con opciones apropiadas para el canal
   (autolink, estilo de encabezado, prefijo de cita en bloque).
2. **Renderizar:** implementa un renderizador con `renderMarkdownWithMarkers(...)` y un
   mapa de marcadores de estilo (o rangos de estilo de Signal).
3. **Fragmentar:** llama a `chunkMarkdownIR(...)` antes de renderizar; renderiza cada fragmento.
4. **Conectar el adaptador:** actualiza el adaptador saliente del canal para usar el nuevo fragmentador
   y renderizador.
5. **Probar:** agrega o actualiza pruebas de formato y una prueba de entrega saliente si el
   canal usa fragmentación.

## Errores comunes

- Los tokens entre corchetes angulares de Slack (`<@U123>`, `<#C123>`, `<https://...>`) deben
  conservarse; escapa el HTML sin procesar de forma segura.
- El HTML de Telegram requiere escapar el texto fuera de las etiquetas para evitar marcado roto.
- Los rangos de estilo de Signal dependen de desplazamientos UTF-16; no uses desplazamientos de puntos de código.
- Conserva las nuevas líneas finales para los bloques de código vallados para que los marcadores de cierre queden en
  su propia línea.

## Relacionado

<CardGroup cols={2}>
  <Card title="Streaming y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de streaming saliente, límites de fragmentos y entrega específica del canal.
  </Card>
  <Card title="Prompt del sistema" href="/es/concepts/system-prompt" icon="message-lines">
    Lo que ve el modelo antes de la conversación, incluidos los archivos de espacio de trabajo inyectados.
  </Card>
</CardGroup>
