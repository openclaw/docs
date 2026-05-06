---
read_when:
    - Quieres analizar archivos PDF desde agentes
    - Necesitas los parámetros y límites exactos de la herramienta PDF
    - Estás depurando el modo PDF nativo frente a la alternativa de extracción
summary: Analiza uno o más documentos PDF con soporte nativo del proveedor y mecanismo de reserva para la extracción
title: Herramienta de PDF
x-i18n:
    generated_at: "2026-05-06T05:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analiza uno o más documentos PDF y devuelve texto.

Comportamiento resumido:

- Modo de proveedor nativo para proveedores de modelos Anthropic y Google.
- Modo de reserva de extracción para otros proveedores (extrae texto primero y, después, imágenes de página cuando es necesario).
- Admite entrada única (`pdf`) o múltiple (`pdfs`), máximo 10 PDF por llamada.

## Disponibilidad

La herramienta solo se registra cuando OpenClaw puede resolver una configuración de modelo compatible con PDF para el agente:

1. `agents.defaults.pdfModel`
2. reserva en `agents.defaults.imageModel`
3. reserva en el modelo resuelto de sesión/predeterminado del agente
4. si los proveedores de PDF nativos están respaldados por autenticación, se prefieren antes que los candidatos de reserva genéricos de imagen

Si no se puede resolver ningún modelo utilizable, la herramienta `pdf` no se expone.

Notas de disponibilidad:

- La cadena de reserva tiene en cuenta la autenticación. Un `provider/model` configurado solo cuenta si
  OpenClaw realmente puede autenticar ese proveedor para el agente.
- Los proveedores de PDF nativos son actualmente **Anthropic** y **Google**.
- Si el proveedor de sesión/predeterminado resuelto ya tiene configurado un modelo
  de visión/PDF, la herramienta PDF lo reutiliza antes de recurrir a otros
  proveedores respaldados por autenticación.

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
Límite de tamaño por PDF en MB. El valor predeterminado es `agents.defaults.pdfMaxBytesMb` o `10`.
</ParamField>

Notas de entrada:

- `pdf` y `pdfs` se fusionan y deduplican antes de la carga.
- Si no se proporciona ninguna entrada de PDF, la herramienta devuelve un error.
- `pages` se interpreta como números de página basados en 1, se deduplica, se ordena y se limita al máximo de páginas configurado.
- `maxBytesMb` usa como valor predeterminado `agents.defaults.pdfMaxBytesMb` o `10`.

## Referencias PDF compatibles

- ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`
- referencias entrantes gestionadas por OpenClaw, como `media://inbound/<id>`

Notas de referencia:

- Otros esquemas URI (por ejemplo, `ftp://`) se rechazan con `unsupported_pdf_reference`.
- En modo sandbox, las URL remotas `http(s)` se rechazan.
- Con la política de archivos solo de espacio de trabajo habilitada, las rutas de archivos locales fuera de las raíces permitidas se rechazan.
- Las referencias entrantes gestionadas y las rutas reproducidas bajo el almacén de medios entrantes de OpenClaw se permiten con la política de archivos solo de espacio de trabajo.

## Modos de ejecución

### Modo de proveedor nativo

El modo nativo se usa para los proveedores `anthropic` y `google`.
La herramienta envía bytes PDF sin procesar directamente a las API del proveedor.

Límites del modo nativo:

- `pages` no es compatible. Si se establece, la herramienta devuelve un error.
- La entrada de varios PDF es compatible; cada PDF se envía como un bloque de documento nativo /
  parte PDF en línea antes del prompt.

### Modo de reserva de extracción

El modo de reserva se usa para proveedores no nativos.

Flujo:

1. Extrae texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, valor predeterminado `20`).
2. Si la longitud del texto extraído es inferior a `200` caracteres, renderiza las páginas seleccionadas como imágenes PNG y las incluye.
3. Envía el contenido extraído más el prompt al modelo seleccionado.

Detalles de reserva:

- La extracción de imágenes de página usa un presupuesto de píxeles de `4,000,000`.
- Si el modelo de destino no admite entrada de imagen y no hay texto extraíble, la herramienta devuelve un error.
- Si la extracción de texto se realiza correctamente pero la extracción de imágenes requeriría visión en un
  modelo de solo texto, OpenClaw descarta las imágenes renderizadas y continúa con el
  texto extraído.
- La reserva de extracción usa el Plugin `document-extract` incluido. El Plugin es propietario de
  `pdfjs-dist`; `@napi-rs/canvas` se usa solo cuando la reserva de renderizado de imágenes está
  disponible.

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

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) para obtener todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos comunes de `details`:

- `model`: referencia de modelo resuelta (`provider/model`)
- `native`: `true` para modo de proveedor nativo, `false` para reserva
- `attempts`: intentos de reserva que fallaron antes del éxito

Campos de ruta:

- entrada de un solo PDF: `details.pdf`
- entradas de varios PDF: `details.pdfs[]` con entradas `pdf`
- metadatos de reescritura de ruta de sandbox (cuando corresponda): `rewrittenFrom`

## Comportamiento de errores

- Entrada PDF faltante: lanza `pdf required: provide a path or URL to a PDF document`
- Demasiados PDF: devuelve un error estructurado en `details.error = "too_many_pdfs"`
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

Modelo de reserva con filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de pdfMaxBytesMb y pdfMaxPages
