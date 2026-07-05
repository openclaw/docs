---
read_when:
    - Estás cambiando el formato de Markdown o la segmentación para los canales salientes
    - Estás agregando un nuevo formateador de canal o mapeo de estilos
    - Estás depurando regresiones de formato entre canales
summary: Canalización de formato Markdown para canales salientes
title: Formato Markdown
x-i18n:
    generated_at: "2026-07-05T11:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw convierte Markdown saliente en una representación intermedia compartida
(IR) antes de renderizar la salida específica de cada canal. La IR conserva texto
sin formato más intervalos de estilo/enlace, de modo que un único paso de análisis
alimenta todos los canales y la fragmentación nunca divide el formato en medio de
un intervalo.

## Canalización

1. **Analizar Markdown en IR** (`markdownToIR`) - texto sin formato más intervalos
   de estilo (negrita, cursiva, tachado, código, bloque de código, spoiler, cita
   en bloque, encabezado 1-6) e intervalos de enlace. Los desplazamientos son
   unidades de código UTF-16, por lo que los rangos de estilo de Signal se alinean
   directamente con su API. Las tablas se analizan solo cuando el canal opta por
   un modo de tabla.
2. **Fragmentar la IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - la división ocurre sobre el texto de la IR antes del renderizado, por lo que
     los estilos en línea y los enlaces se recortan por fragmento en lugar de
     romperse al cruzar un límite.
3. **Renderizar por canal** (`renderMarkdownWithMarkers`) - un mapa de marcadores
   de estilo convierte los intervalos al marcado nativo del canal.

| Canal                                                            | Renderizador                                                                         | Notas                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Slack                                                            | tokens mrkdwn (`*bold*`, `_italic_`, `` `code` ``, cercas de código)                 | Los enlaces se convierten en `<url\|label>`; el autoenlace se desactiva durante el análisis para evitar enlaces duplicados |
| Telegram                                                         | etiquetas HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | También admite tablas y encabezados de mensajes enriquecidos (`<h1>`-`<h6>`) cuando `richMessages` está activado |
| Signal                                                           | texto sin formato + rangos `text-style`                                               | Los enlaces se renderizan como `label (url)` cuando la etiqueta difiere de la URL            |
| Discord, WhatsApp, iMessage, Microsoft Teams y otros canales     | texto sin formato                                                                     | Sin estilos basados en IR; la conversión de tablas Markdown aún se ejecuta mediante `convertMarkdownTables` |

## Ejemplo de IR

Markdown de entrada:
__OC_I18N_900000__
IR (esquemática):
__OC_I18N_900001__
## Manejo de tablas

`markdown.tables` controla cómo un canal convierte tablas Markdown, por canal
y opcionalmente por cuenta:

| Modo      | Comportamiento                                                                        |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | Renderiza como una tabla ASCII alineada dentro de un bloque de código (valor predeterminado de reserva) |
| `bullets` | Convierte cada fila en viñetas `label: value`                                        |
| `block`   | Conserva tablas nativas donde el transporte las admite; de lo contrario, recurre a `code` |
| `off`     | Desactiva el análisis de tablas; el texto de tabla sin procesar pasa sin cambios     |

Valores predeterminados de Plugin por canal: Signal, WhatsApp y Matrix usan
`bullets` de forma predeterminada; Mattermost usa `off`; Telegram usa `block`
(lo que se resuelve como `code` salvo que la cuenta tenga `richMessages`
habilitado). Cualquier canal sin un valor predeterminado explícito de Plugin
recurre a `code`.
__OC_I18N_900002__
## Reglas de fragmentación

- Los límites de fragmento provienen de adaptadores/configuración de canal y se
  aplican al texto de la IR, no a la salida renderizada.
- Los bloques de código cercados se mantienen como un único bloque con un salto
  de línea final para que los canales rendericen correctamente la cerca de cierre.
- Los prefijos de lista y cita en bloque forman parte del texto de la IR, por lo
  que la fragmentación nunca divide en medio de un prefijo.
- Los estilos en línea nunca se dividen entre fragmentos; el renderizador reabre
  un estilo abierto al inicio del siguiente fragmento.

Consulta [Streaming y fragmentación](/concepts/streaming) para ver el
comportamiento de límites de fragmento y entrega entre canales.

## Política de enlaces

- **Slack:** `[label](url)` -> `<url|label>`; las URL desnudas permanecen desnudas.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análisis HTML).
- **Signal:** `[label](url)` -> `label (url)` salvo que la etiqueta ya coincida
  con la URL.

## Spoilers

Los marcadores de spoiler (`||spoiler||`) se analizan para Signal (asignados a
rangos de estilo `SPOILER`) y Telegram (asignados a `<tg-spoiler>`). Otros
canales tratan `||...||` como texto sin formato.

## Agregar o actualizar un formateador de canal

1. **Analiza una vez** con `markdownToIR(...)`, pasando opciones apropiadas para
   el canal (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Renderiza** con `renderMarkdownWithMarkers(...)` y un mapa de marcadores de
   estilo (o lógica personalizada de rangos de estilo para transportes como Signal).
3. **Fragmenta** con `chunkMarkdownIR(...)` o
   `renderMarkdownIRChunksWithinLimit(...)` antes de renderizar cada fragmento.
4. **Conecta el adaptador** para llamar al nuevo fragmentador y renderizador desde
   la ruta de envío saliente.
5. **Prueba** con pruebas de formato más una prueba de entrega saliente si el
   canal fragmenta.

## Problemas comunes

- Los tokens entre corchetes angulares de Slack (`<@U123>`, `<#C123>`, `<https://...>`) deben
  sobrevivir al escape; el HTML sin procesar aún debe escaparse de forma segura.
- El HTML de Telegram requiere escapar el texto fuera de las etiquetas para evitar
  marcado roto.
- Los rangos de estilo de Signal usan desplazamientos UTF-16, no desplazamientos
  de puntos de código.
- Conserva los saltos de línea finales en bloques de código cercados para que el
  marcador de cierre quede en su propia línea.

## Relacionado

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de Streaming saliente, límites de fragmento y entrega específica del canal.
  </Card>
  <Card title="System prompt" href="/es/concepts/system-prompt" icon="message-lines">
    Lo que ve el modelo antes de la conversación, incluidos los archivos de espacio de trabajo inyectados.
  </Card>
</CardGroup>
