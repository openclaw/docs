---
read_when:
    - Quieres analizar PDF desde agentes
    - Necesitas los parámetros y límites exactos de la herramienta PDF
    - Estás depurando el modo PDF nativo frente a la alternativa de extracción
summary: Analizar uno o varios documentos PDF con compatibilidad nativa del proveedor y alternativa de extracción
title: Herramienta PDF
x-i18n:
    generated_at: "2026-04-24T05:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analiza uno o varios documentos PDF y devuelve texto.

Comportamiento rápido:

- Modo nativo del proveedor para proveedores de modelos Anthropic y Google.
- Modo alternativo de extracción para otros proveedores (primero extrae texto y luego imágenes de páginas cuando sea necesario).
- Admite una sola entrada (`pdf`) o varias (`pdfs`), máximo 10 PDF por llamada.

## Disponibilidad

La herramienta solo se registra cuando OpenClaw puede resolver una configuración de modelo con capacidad PDF para el agente:

1. `agents.defaults.pdfModel`
2. alternativa a `agents.defaults.imageModel`
3. alternativa al modelo resuelto de la sesión/predeterminado del agente
4. si los proveedores PDF nativos están respaldados por autenticación, se prefieren antes que candidatos genéricos de alternativa de imagen

Si no se puede resolver ningún modelo utilizable, la herramienta `pdf` no se expone.

Notas sobre disponibilidad:

- La cadena de alternativas tiene en cuenta la autenticación. Un `provider/model` configurado solo cuenta si OpenClaw puede autenticar realmente a ese proveedor para el agente.
- Los proveedores PDF nativos son actualmente **Anthropic** y **Google**.
- Si el proveedor resuelto de la sesión/predeterminado ya tiene configurado un modelo de visión/PDF, la herramienta PDF reutiliza ese modelo antes de recurrir a otros proveedores respaldados por autenticación.

## Referencia de entrada

<ParamField path="pdf" type="string">
Una ruta o URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Varias rutas o URL de PDF, hasta 10 en total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt de análisis.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas como `1-5` o `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Anulación opcional de modelo en formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Límite de tamaño por PDF en MB. Usa por defecto `agents.defaults.pdfMaxBytesMb` o `10`.
</ParamField>

Notas sobre la entrada:

- `pdf` y `pdfs` se combinan y desduplican antes de cargarse.
- Si no se proporciona ninguna entrada PDF, la herramienta devuelve un error.
- `pages` se analiza como números de página con base 1, se desduplica, se ordena y se limita al máximo de páginas configurado.
- `maxBytesMb` usa por defecto `agents.defaults.pdfMaxBytesMb` o `10`.

## Referencias PDF compatibles

- ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`

Notas sobre referencias:

- Otros esquemas URI (por ejemplo `ftp://`) se rechazan con `unsupported_pdf_reference`.
- En modo sandbox, las URL remotas `http(s)` se rechazan.
- Con la política de archivos solo del espacio de trabajo habilitada, las rutas de archivo locales fuera de las raíces permitidas se rechazan.

## Modos de ejecución

### Modo nativo del proveedor

El modo nativo se usa para los proveedores `anthropic` y `google`.
La herramienta envía bytes PDF sin procesar directamente a las API de los proveedores.

Límites del modo nativo:

- `pages` no es compatible. Si se establece, la herramienta devuelve un error.
- La entrada de varios PDF es compatible; cada PDF se envía como un bloque de documento nativo / parte PDF inline antes del prompt.

### Modo alternativo de extracción

El modo alternativo se usa para proveedores no nativos.

Flujo:

1. Extraer texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, valor predeterminado `20`).
2. Si la longitud del texto extraído es inferior a `200` caracteres, representar las páginas seleccionadas como imágenes PNG e incluirlas.
3. Enviar el contenido extraído más el prompt al modelo seleccionado.

Detalles de la alternativa de extracción:

- La extracción de imágenes de páginas usa un presupuesto de píxeles de `4,000,000`.
- Si el modelo de destino no admite entrada de imagen y no hay texto extraíble, la herramienta devuelve un error.
- Si la extracción de texto se realiza correctamente pero la extracción de imágenes requeriría visión en un modelo solo de texto, OpenClaw elimina las imágenes representadas y continúa con el texto extraído.
- La alternativa de extracción requiere `pdfjs-dist` (y `@napi-rs/canvas` para la representación de imágenes).

## Configuración

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Consulta [Referencia de configuración](/es/gateway/configuration-reference) para ver todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos comunes de `details`:

- `model`: referencia de modelo resuelta (`provider/model`)
- `native`: `true` para modo nativo del proveedor, `false` para modo alternativo
- `attempts`: intentos de alternativa que fallaron antes del éxito

Campos de ruta:

- entrada de un solo PDF: `details.pdf`
- entrada de varios PDF: `details.pdfs[]` con entradas `pdf`
- metadatos de reescritura de ruta de sandbox (cuando corresponda): `rewrittenFrom`

## Comportamiento de error

- Falta entrada PDF: lanza `pdf required: provide a path or URL to a PDF document`
- Demasiados PDF: devuelve error estructurado en `details.error = "too_many_pdfs"`
- Esquema de referencia no compatible: devuelve `details.error = "unsupported_pdf_reference"`
- Modo nativo con `pages`: lanza un error claro `pages is not supported with native PDF providers`

## Ejemplos

PDF único:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Varios PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modelo alternativo con filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de pdfMaxBytesMb y pdfMaxPages
