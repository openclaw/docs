---
read_when:
    - Quieres analizar archivos PDF desde agentes
    - Necesitas parámetros y límites exactos de la herramienta pdf
    - Estás depurando el modo PDF nativo frente a la alternativa de extracción
summary: Analiza uno o más documentos PDF con soporte nativo del proveedor y respaldo de extracción
title: Herramienta de PDF
x-i18n:
    generated_at: "2026-06-27T13:07:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analiza uno o más documentos PDF y devuelve texto.

Comportamiento rápido:

- Modo de proveedor nativo para los proveedores de modelos Anthropic y Google.
- Modo de respaldo de extracción para otros proveedores (extrae primero el texto y luego imágenes de páginas cuando sea necesario).
- Admite entrada única (`pdf`) o múltiple (`pdfs`), con un máximo de 10 PDF por llamada.

## Disponibilidad

La herramienta solo se registra cuando OpenClaw puede resolver una configuración de modelo compatible con PDF para el agente:

1. `agents.defaults.pdfModel`
2. respaldo a `agents.defaults.imageModel`
3. respaldo al modelo predeterminado/de sesión resuelto del agente
4. si los proveedores de PDF nativo están respaldados por autenticación, preferirlos antes que los candidatos genéricos de respaldo con imágenes

Si no se puede resolver ningún modelo utilizable, la herramienta `pdf` no se expone.

Notas de disponibilidad:

- La cadena de respaldo tiene en cuenta la autenticación. Una configuración `provider/model` solo cuenta si
  OpenClaw puede autenticar realmente ese proveedor para el agente.
- Los proveedores de PDF nativo son actualmente **Anthropic** y **Google**.
- Si el proveedor predeterminado/de sesión resuelto ya tiene un modelo de visión/PDF
  configurado, la herramienta PDF lo reutiliza antes de recurrir a otros proveedores
  respaldados por autenticación.

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

<ParamField path="password" type="string">
Contraseña para PDF cifrados en modo de respaldo de extracción.
</ParamField>

<ParamField path="model" type="string">
Sobrescritura opcional del modelo en formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Límite de tamaño por PDF en MB. El valor predeterminado es `agents.defaults.pdfMaxBytesMb` o `10`.
</ParamField>

Notas de entrada:

- `pdf` y `pdfs` se fusionan y se deduplican antes de cargar.
- Si no se proporciona ninguna entrada de PDF, la herramienta devuelve un error.
- `pages` se analiza como números de página basados en 1, se deduplica, se ordena y se limita al máximo de páginas configurado.
- `password` se aplica a todos los PDF de la solicitud y solo lo usa el modo de respaldo de extracción.
- `maxBytesMb` usa como valor predeterminado `agents.defaults.pdfMaxBytesMb` o `10`.

## Referencias de PDF admitidas

- ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`
- referencias entrantes administradas por OpenClaw, como `media://inbound/<id>`

Notas de referencia:

- Otros esquemas de URI (por ejemplo `ftp://`) se rechazan con `unsupported_pdf_reference`.
- En modo sandbox, las URL remotas `http(s)` se rechazan.
- Con la política de archivos solo del espacio de trabajo habilitada, se rechazan las rutas de archivo locales fuera de las raíces permitidas.
- Las referencias entrantes administradas y las rutas reproducidas bajo el almacén de medios entrantes de OpenClaw se permiten con la política de archivos solo del espacio de trabajo.

## Modos de ejecución

### Modo de proveedor nativo

El modo nativo se usa para los proveedores `anthropic` y `google`.
La herramienta envía bytes PDF sin procesar directamente a las API de los proveedores.

Límites del modo nativo:

- `pages` no es compatible. Si se establece, la herramienta devuelve un error.
- `password` no es compatible. Usa un modelo no nativo para analizar PDF cifrados.
- Se admite entrada de varios PDF; cada PDF se envía como un bloque de documento nativo /
  parte PDF en línea antes del prompt.

### Modo de respaldo de extracción

El modo de respaldo se usa para proveedores no nativos.

Flujo:

1. Extraer texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, valor predeterminado `20`).
2. Si la longitud del texto extraído es inferior a `200` caracteres, renderizar las páginas seleccionadas como imágenes PNG e incluirlas.
3. Enviar el contenido extraído más el prompt al modelo seleccionado.

Detalles del respaldo:

- La extracción de imágenes de página usa un presupuesto de píxeles de `4,000,000`.
- Los PDF cifrados se pueden abrir con el parámetro de nivel superior `password`.
- Si el modelo de destino no admite entrada de imágenes y no hay texto extraíble, la herramienta devuelve un error.
- Si la extracción de texto se realiza correctamente pero la extracción de imágenes requeriría visión en un
  modelo solo de texto, OpenClaw descarta las imágenes renderizadas y continúa con el
  texto extraído.
- El respaldo de extracción usa el Plugin incluido `document-extract`. El Plugin posee
  `clawpdf`, que proporciona extracción de texto y renderizado de imágenes mediante PDFium
  WebAssembly.

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

Consulta la [Referencia de configuración](/es/gateway/configuration-reference) para ver todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos comunes de `details`:

- `model`: referencia del modelo resuelto (`provider/model`)
- `native`: `true` para el modo de proveedor nativo, `false` para el respaldo
- `attempts`: intentos de respaldo que fallaron antes del éxito

Campos de ruta:

- entrada de un solo PDF: `details.pdf`
- entradas de varios PDF: `details.pdfs[]` con entradas `pdf`
- metadatos de reescritura de ruta de sandbox (cuando corresponda): `rewrittenFrom`

## Comportamiento de errores

- Entrada de PDF faltante: lanza `pdf required: provide a path or URL to a PDF document`
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

Modelo de respaldo con filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF cifrado con respaldo de extracción:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de pdfMaxBytesMb y pdfMaxPages
