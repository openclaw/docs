---
read_when:
    - Estás cambiando el formato Markdown o la segmentación para los canales salientes
    - Está agregando un nuevo formateador de canal o una asignación de estilo
    - Estás depurando regresiones de formato en todos los canales
summary: Canalización de formato Markdown para canales de salida
title: Formato de Markdown
x-i18n:
    generated_at: "2026-05-06T05:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw da formato al Markdown saliente convirtiéndolo en una representación
intermedia (IR) compartida antes de renderizar la salida específica del canal. La IR mantiene el
texto de origen intacto mientras transporta intervalos de estilo/enlace para que la fragmentación y el renderizado puedan
mantenerse coherentes entre canales.

## Objetivos

- **Coherencia:** un paso de análisis, varios renderizadores.
- **Fragmentación segura:** dividir el texto antes del renderizado para que el formato en línea nunca
  se rompa entre fragmentos.
- **Ajuste al canal:** asignar la misma IR a mrkdwn de Slack, HTML de Telegram y rangos de estilo de
  Signal sin volver a analizar Markdown.

## Canalización

1. **Analizar Markdown -> IR**
   - La IR es texto plano más intervalos de estilo (negrita/cursiva/tachado/código/spoiler) e intervalos de enlace.
   - Los desplazamientos son unidades de código UTF-16 para que los rangos de estilo de Signal se alineen con su API.
   - Las tablas se analizan solo cuando un canal opta por la conversión de tablas.
2. **Fragmentar IR (formato primero)**
   - La fragmentación ocurre sobre el texto de la IR antes del renderizado.
   - El formato en línea no se divide entre fragmentos; los intervalos se recortan por fragmento.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (negrita/cursiva/tachado/código), enlaces como `<url|label>`.
   - **Telegram:** etiquetas HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto plano + rangos `text-style`; los enlaces se convierten en `label (url)` cuando la etiqueta difiere.

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
- Otros canales (WhatsApp, iMessage, Microsoft Teams, Discord) todavía usan texto plano o
  sus propias reglas de formato, con conversión de tablas Markdown aplicada antes de la
  fragmentación cuando está habilitada.

## Manejo de tablas

Las tablas Markdown no se admiten de forma coherente en todos los clientes de chat. Usa
`markdown.tables` para controlar la conversión por canal (y por cuenta).

- `code`: renderiza las tablas como bloques de código (valor predeterminado para la mayoría de los canales).
- `bullets`: convierte cada fila en viñetas (valor predeterminado para Signal + WhatsApp).
- `off`: desactiva el análisis y la conversión de tablas; el texto sin procesar de la tabla pasa tal cual.

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

- Los límites de fragmento provienen de los adaptadores/configuración de canal y se aplican al texto de la IR.
- Los bloques de código delimitados se conservan como un único bloque con un salto de línea final para que los canales
  los rendericen correctamente.
- Los prefijos de listas y de citas en bloque forman parte del texto de la IR, por lo que la fragmentación
  no divide en medio de un prefijo.
- Los estilos en línea (negrita/cursiva/tachado/código en línea/spoiler) nunca se dividen entre
  fragmentos; el renderizador vuelve a abrir los estilos dentro de cada fragmento.

Si necesitas más información sobre el comportamiento de fragmentación entre canales, consulta
[Streaming + fragmentación](/es/concepts/streaming).

## Política de enlaces

- **Slack:** `[label](url)` -> `<url|label>`; las URL simples permanecen simples. El enlace automático
  se desactiva durante el análisis para evitar enlaces duplicados.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análisis HTML).
- **Signal:** `[label](url)` -> `label (url)` salvo que la etiqueta coincida con la URL.

## Spoilers

Los marcadores de spoiler (`||spoiler||`) se analizan solo para Signal, donde se asignan a
rangos de estilo SPOILER. Otros canales los tratan como texto plano.

## Cómo añadir o actualizar un formateador de canal

1. **Analizar una vez:** usa el helper compartido `markdownToIR(...)` con opciones adecuadas para el canal
   (enlace automático, estilo de encabezado, prefijo de cita en bloque).
2. **Renderizar:** implementa un renderizador con `renderMarkdownWithMarkers(...)` y un
   mapa de marcadores de estilo (o rangos de estilo de Signal).
3. **Fragmentar:** llama a `chunkMarkdownIR(...)` antes del renderizado; renderiza cada fragmento.
4. **Conectar el adaptador:** actualiza el adaptador saliente del canal para usar el nuevo fragmentador
   y renderizador.
5. **Probar:** añade o actualiza pruebas de formato y una prueba de entrega saliente si el
   canal usa fragmentación.

## Errores comunes

- Los tokens entre corchetes angulares de Slack (`<@U123>`, `<#C123>`, `<https://...>`) deben
  conservarse; escapa el HTML sin procesar de forma segura.
- El HTML de Telegram requiere escapar el texto fuera de las etiquetas para evitar marcado roto.
- Los rangos de estilo de Signal dependen de desplazamientos UTF-16; no uses desplazamientos de puntos de código.
- Conserva los saltos de línea finales en los bloques de código delimitados para que los marcadores de cierre queden en
  su propia línea.

## Relacionado

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de streaming saliente, límites de fragmentos y entrega específica por canal.
  </Card>
  <Card title="System prompt" href="/es/concepts/system-prompt" icon="message-lines">
    Lo que ve el modelo antes de la conversación, incluidos los archivos inyectados del espacio de trabajo.
  </Card>
</CardGroup>
