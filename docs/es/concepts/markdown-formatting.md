---
read_when:
    - Estás cambiando el formato Markdown o la fragmentación para canales salientes
    - Estás añadiendo un nuevo formateador de canal o una asignación de estilos
    - Estás depurando regresiones de formato entre canales
summary: Canalización de formato Markdown para canales salientes
title: Formato Markdown
x-i18n:
    generated_at: "2026-04-24T05:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw formatea Markdown saliente convirtiéndolo en una representación
intermedia compartida (IR) antes de renderizar la salida específica de cada canal. La IR mantiene el
texto de origen intacto mientras transporta intervalos de estilo/enlace para que la fragmentación y el renderizado puedan
mantenerse consistentes entre canales.

## Objetivos

- **Consistencia:** un paso de análisis, múltiples renderizadores.
- **Fragmentación segura:** dividir el texto antes del renderizado para que el formato en línea nunca
  se rompa entre fragmentos.
- **Ajuste al canal:** asignar la misma IR a Slack mrkdwn, Telegram HTML y Signal
  intervalos de estilo sin volver a analizar Markdown.

## Canalización

1. **Analizar Markdown -> IR**
   - La IR es texto sin formato más intervalos de estilo (negrita/cursiva/tachado/código/spoiler) e intervalos de enlace.
   - Los desplazamientos son unidades de código UTF-16 para que los intervalos de estilo de Signal se alineen con su API.
   - Las tablas se analizan solo cuando un canal activa la conversión de tablas.
2. **Fragmentar IR (primero formato)**
   - La fragmentación ocurre sobre el texto de la IR antes del renderizado.
   - El formato en línea no se divide entre fragmentos; los intervalos se recortan por fragmento.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (negrita/cursiva/tachado/código), enlaces como `<url|label>`.
   - **Telegram:** etiquetas HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto sin formato + intervalos `text-style`; los enlaces pasan a ser `label (url)` cuando la etiqueta difiere.

## Ejemplo de IR

Markdown de entrada:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (esquemática):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Dónde se usa

- Los adaptadores salientes de Slack, Telegram y Signal renderizan a partir de la IR.
- Otros canales (WhatsApp, iMessage, Microsoft Teams, Discord) siguen usando texto sin formato o
  sus propias reglas de formato, con conversión de tablas Markdown aplicada antes de la
  fragmentación cuando está habilitada.

## Gestión de tablas

Las tablas Markdown no se admiten de forma consistente en los clientes de chat. Usa
`markdown.tables` para controlar la conversión por canal (y por cuenta).

- `code`: renderizar tablas como bloques de código (predeterminado para la mayoría de canales).
- `bullets`: convertir cada fila en viñetas (predeterminado para Signal + WhatsApp).
- `off`: desactivar el análisis y la conversión de tablas; el texto de tabla sin procesar se transmite tal cual.

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

- Los límites de fragmentación provienen de los adaptadores/configuración del canal y se aplican al texto de la IR.
- Los bloques de código con cercas se conservan como un único bloque con una nueva línea final para que los canales
  los rendericen correctamente.
- Los prefijos de lista y los prefijos de cita en bloque forman parte del texto de la IR, por lo que la fragmentación
  no divide a mitad de prefijo.
- Los estilos en línea (negrita/cursiva/tachado/código en línea/spoiler) nunca se dividen entre
  fragmentos; el renderizador vuelve a abrir los estilos dentro de cada fragmento.

Si necesitas más información sobre el comportamiento de fragmentación entre canales, consulta
[Streaming + fragmentación](/es/concepts/streaming).

## Política de enlaces

- **Slack:** `[label](url)` -> `<url|label>`; las URL sin formato permanecen sin formato. El enlace automático
  se desactiva durante el análisis para evitar enlazado doble.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análisis HTML).
- **Signal:** `[label](url)` -> `label (url)` a menos que la etiqueta coincida con la URL.

## Spoilers

Los marcadores de spoiler (`||spoiler||`) se analizan solo para Signal, donde se asignan a
intervalos de estilo SPOILER. Otros canales los tratan como texto sin formato.

## Cómo añadir o actualizar un formateador de canal

1. **Analizar una vez:** usa el auxiliar compartido `markdownToIR(...)` con opciones
   adecuadas para el canal (autolink, estilo de encabezado, prefijo de cita en bloque).
2. **Renderizar:** implementa un renderizador con `renderMarkdownWithMarkers(...)` y un
   mapa de marcadores de estilo (o intervalos de estilo de Signal).
3. **Fragmentar:** llama a `chunkMarkdownIR(...)` antes del renderizado; renderiza cada fragmento.
4. **Conectar adaptador:** actualiza el adaptador saliente del canal para usar el nuevo fragmentador
   y renderizador.
5. **Probar:** añade o actualiza pruebas de formato y una prueba de entrega saliente si el
   canal usa fragmentación.

## Errores comunes

- Los tokens de corchetes angulares de Slack (`<@U123>`, `<#C123>`, `<https://...>`) deben
  conservarse; escapa el HTML sin procesar de forma segura.
- El HTML de Telegram requiere escapar el texto fuera de las etiquetas para evitar marcado roto.
- Los intervalos de estilo de Signal dependen de desplazamientos UTF-16; no uses desplazamientos de puntos de código.
- Conserva las nuevas líneas finales para bloques de código con cercas para que los marcadores de cierre queden en
  su propia línea.

## Relacionado

- [Streaming y fragmentación](/es/concepts/streaming)
- [System prompt](/es/concepts/system-prompt)
