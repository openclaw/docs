---
read_when:
    - Estás cambiando el formato de Markdown o la segmentación para los canales salientes
    - Estás añadiendo un nuevo formateador de canal o una asignación de estilos
    - Estás depurando regresiones de formato en distintos canales
summary: Canal de procesamiento de formato Markdown para canales salientes
title: Formato Markdown
x-i18n:
    generated_at: "2026-07-11T23:03:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw convierte el Markdown saliente en una representación intermedia
(IR) compartida antes de renderizar la salida específica de cada canal. La IR conserva texto sin formato junto con
intervalos de estilo y enlaces, de modo que un único paso de análisis sirve para todos los canales y la fragmentación nunca
divide el formato en medio de un intervalo.

## Canalización

1. **Analizar Markdown y convertirlo en IR** (`markdownToIR`): texto sin formato junto con intervalos de estilo
   (negrita, cursiva, tachado, código, bloque de código, contenido oculto, cita en bloque,
   encabezados del 1 al 6) e intervalos de enlaces. Los desplazamientos son unidades de código UTF-16 para que los intervalos de estilo de
   Signal se alineen directamente con su API. Las tablas solo se analizan cuando el canal
   habilita un modo de tabla.
2. **Fragmentar la IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   : la división se realiza sobre el texto de la IR antes del renderizado, de modo que los estilos en línea y
     los enlaces se dividen por fragmento en lugar de romperse al cruzar un límite.
3. **Renderizar por canal** (`renderMarkdownWithMarkers`): un mapa de marcadores de estilo
   convierte los intervalos en el marcado nativo del canal.

| Canal                                                           | Renderizador                                                                          | Notas                                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Slack                                                           | tokens mrkdwn (`*bold*`, `_italic_`, `` `code` ``, bloques de código delimitados)     | Los enlaces se convierten en `<url\|label>`; el enlace automático se deshabilita durante el análisis para evitar enlaces duplicados |
| Telegram                                                        | etiquetas HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | También admite tablas y encabezados de mensajes enriquecidos (`<h1>`-`<h6>`) cuando `richMessages` está activado |
| Signal                                                          | texto sin formato + intervalos `text-style`                                           | Los enlaces se renderizan como `label (url)` cuando la etiqueta difiere de la URL                     |
| Discord, WhatsApp, iMessage, Microsoft Teams y otros canales    | texto sin formato                                                                     | Sin estilos basados en IR; la conversión de tablas Markdown sigue ejecutándose mediante `convertMarkdownTables` |

## Ejemplo de IR

Markdown de entrada:
__OC_I18N_900000__
IR (esquemática):
__OC_I18N_900001__
## Gestión de tablas

`markdown.tables` controla cómo convierte un canal las tablas Markdown, por
canal y, opcionalmente, por cuenta:

| Modo      | Comportamiento                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `code`    | Renderiza como una tabla ASCII alineada dentro de un bloque de código (valor predeterminado de reserva) |
| `bullets` | Convierte cada fila en viñetas con el formato `label: value`                                        |
| `block`   | Conserva las tablas nativas cuando el transporte las admite; de lo contrario, recurre a `code`      |
| `off`     | Deshabilita el análisis de tablas; el texto sin procesar de la tabla se conserva sin cambios         |

Valores predeterminados de los plugins por canal: Signal, WhatsApp y Matrix usan
`bullets` de forma predeterminada; Mattermost usa `off`; Telegram usa `block` (que
se resuelve como `code` salvo que la cuenta tenga `richMessages` habilitado). Cualquier
canal sin un valor predeterminado explícito del plugin recurre a `code`.
__OC_I18N_900002__
## Reglas de fragmentación

- Los límites de los fragmentos proceden de los adaptadores o la configuración del canal y se aplican al texto de la IR, no
  a la salida renderizada.
- Los bloques de código delimitados se conservan como un solo bloque con un salto de línea final para que
  los canales rendericen correctamente el delimitador de cierre.
- Los prefijos de listas y citas en bloque forman parte del texto de la IR, por lo que la fragmentación nunca
  divide un prefijo.
- Los estilos en línea nunca se dividen entre fragmentos; el renderizador vuelve a abrir un
  estilo abierto al comienzo del siguiente fragmento.

Consulta [Transmisión y fragmentación](/concepts/streaming) para conocer los límites de los fragmentos y
el comportamiento de entrega entre canales.

## Política de enlaces

- **Slack:** `[label](url)` -> `<url|label>`; las URL sin formato permanecen sin formato.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análisis HTML).
- **Signal:** `[label](url)` -> `label (url)`, salvo que la etiqueta ya
  coincida con la URL.

## Contenido oculto

Los marcadores de contenido oculto (`||spoiler||`) se analizan para Signal (asignados a intervalos de estilo
`SPOILER`) y Telegram (asignados a `<tg-spoiler>`). Los demás canales tratan
`||...||` como texto sin formato.

## Añadir o actualizar el formateador de un canal

1. **Analizar una vez** con `markdownToIR(...)`, pasando las opciones apropiadas para el canal
   (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Renderizar** con `renderMarkdownWithMarkers(...)` y un mapa de marcadores de estilo (o
   lógica personalizada de intervalos de estilo para transportes como Signal).
3. **Fragmentar** con `chunkMarkdownIR(...)` o
   `renderMarkdownIRChunksWithinLimit(...)` antes de renderizar cada fragmento.
4. **Conectar el adaptador** para que invoque el nuevo fragmentador y renderizador desde la
   ruta de envío saliente.
5. **Probar** con pruebas de formato y una prueba de entrega saliente si el canal
   fragmenta los mensajes.

## Errores habituales

- Los tokens entre corchetes angulares de Slack (`<@U123>`, `<#C123>`, `<https://...>`) deben
  sobrevivir al escape; el HTML sin procesar aún debe escaparse de forma segura.
- El HTML de Telegram requiere escapar el texto situado fuera de las etiquetas para evitar un marcado no válido.
- Los intervalos de estilo de Signal usan desplazamientos UTF-16, no desplazamientos por punto de código.
- Conserva los saltos de línea finales en los bloques de código delimitados para que el marcador de cierre
  quede en su propia línea.

## Relacionado

<CardGroup cols={2}>
  <Card title="Transmisión y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de la transmisión saliente, límites de fragmentos y entrega específica de cada canal.
  </Card>
  <Card title="Prompt del sistema" href="/es/concepts/system-prompt" icon="message-lines">
    Lo que ve el modelo antes de la conversación, incluidos los archivos inyectados del espacio de trabajo.
  </Card>
</CardGroup>
