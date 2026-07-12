---
read_when:
    - Quieres analizar archivos PDF de agentes
    - Necesitas parámetros y límites exactos de la herramienta de PDF
    - Estás depurando el modo PDF nativo frente al mecanismo alternativo de extracción
summary: Analiza uno o más documentos PDF con compatibilidad nativa del proveedor y extracción alternativa
title: Herramienta de PDF
x-i18n:
    generated_at: "2026-07-11T23:35:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analiza uno o más documentos PDF y devuelve texto. Usa la entrada nativa de documentos en los modelos de Anthropic y Google, y recurre a la extracción de texto e imágenes con todos los demás proveedores.

## Disponibilidad

La herramienta solo se registra cuando OpenClaw puede resolver un modelo compatible con PDF para el agente. Orden de resolución:

1. `agents.defaults.pdfModel` (modelo principal y alternativas explícitos)
2. `agents.defaults.imageModel` (modelo principal y alternativas explícitos)
3. El modelo predeterminado o resuelto para la sesión del agente, si su proveedor admite la entrada nativa de PDF (Anthropic, Google) o ya tiene configurado un modelo de visión
4. Proveedores compatibles con imágenes o visión detectados automáticamente y con autenticación utilizable, dando prioridad a los proveedores con PDF nativo

La autenticación de cada candidato alternativo se comprueba antes de usarlo, por lo que un `provider/model` configurado solo cuenta si OpenClaw puede autenticar ese proveedor para el agente. Si no se resuelve ningún modelo utilizable, la herramienta `pdf` no se expone.

## Referencia de entrada

<ParamField path="pdf" type="string">
Una ruta o URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Varias rutas o URL de PDF, hasta un total de 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Indicación para el análisis.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas como `1-5` o `1,3,7-9`. No se admite en el modo nativo del proveedor.
</ParamField>

<ParamField path="password" type="string">
Contraseña para PDF cifrados. Se aplica a todos los PDF de la solicitud; solo se usa en el modo alternativo de extracción.
</ParamField>

<ParamField path="model" type="string">
Reemplazo opcional del modelo con el formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Límite de tamaño por PDF en MB. El valor predeterminado es `agents.defaults.pdfMaxBytesMb`, o `10` si no está configurado.
</ParamField>

Notas:

- `pdf` y `pdfs` se combinan y deduplican antes de la carga; se requiere al menos uno.
- `pages` se interpreta como números de página con base 1, se deduplica, se ordena y se limita a `agents.defaults.pdfMaxPages` (valor predeterminado: `20`). Un intervalo que no coincida con ninguna página dentro de los límites genera un error antes de la llamada al modelo.

## Referencias de PDF admitidas

- Ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`
- Referencias de entrada administradas por OpenClaw, como `media://inbound/<id>`

Otros esquemas de URI (por ejemplo, `ftp://`) devuelven `details.error = "unsupported_pdf_reference"`. Las URL remotas `http(s)` se rechazan cuando la herramienta se ejecuta en un entorno aislado. Con la política de archivos restringida al espacio de trabajo activada, se rechazan las rutas locales situadas fuera de las raíces permitidas; las referencias de entrada administradas y las rutas reproducidas dentro del almacén de contenido multimedia entrante de OpenClaw siguen estando permitidas.

## Modos de ejecución

### Modo nativo del proveedor

Se usa con los proveedores `anthropic` y `google` (los únicos proveedores que actualmente declaran compatibilidad nativa con documentos PDF). Los bytes sin procesar de cada PDF se envían directamente a la API del proveedor como una parte de documento nativo o PDF en línea.

Limitaciones:

- `pages` no se admite; si se establece, la herramienta genera `pages is not supported with native PDF providers`.
- `password` no se admite; si se establece, la herramienta genera `password is not supported with native PDF providers`. Usa un modelo no nativo para los PDF cifrados.

### Modo alternativo de extracción

Se usa con todos los demás proveedores.

1. Extrae el texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, con un valor predeterminado de `20`) mediante el Plugin `document-extract` incluido, que usa el paquete `clawpdf` (PDFium WebAssembly) para extraer texto e imágenes.
2. Si el texto extraído tiene menos de `200` caracteres, representa las mismas páginas como imágenes PNG. El presupuesto de representación es de `4,000,000` píxeles en total, compartido entre todas las páginas que necesitan imágenes (asignado proporcionalmente por cada página restante, no por página), por lo que las páginas que ya contienen suficiente texto omiten por completo la representación.
3. Envía al modelo seleccionado el texto extraído (y las imágenes representadas, si las hay) junto con la indicación.

Detalles:

- Los PDF cifrados se abren con el parámetro de nivel superior `password`.
- Si el modelo no admite entrada de imágenes y no hay texto extraíble, la herramienta genera un error.
- Si falla la representación de imágenes, OpenClaw descarta las imágenes y continúa con el texto extraído.
- Si el modelo de destino solo admite texto y la extracción produjo imágenes, OpenClaw descarta las imágenes y envía únicamente el texto.

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

| Clave                           | Valor predeterminado | Significado                                                                                                                   |
| ------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | sin configurar       | Modelos PDF principal y alternativos explícitos; recurre a `imageModel` y después al modelo de la sesión.                     |
| `agents.defaults.pdfMaxBytesMb` | `10`                 | Límite de tamaño por PDF en MB.                                                                                               |
| `agents.defaults.pdfMaxPages`   | `20`                 | Número máximo de páginas procesadas por PDF.                                                                                  |

Consulta la [Referencia de configuración](/es/gateway/config-agents#agent-defaults) para obtener todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos habituales de `details`:

- `model`: referencia del modelo resuelto (`provider/model`)
- `native`: `true` para el modo nativo del proveedor, `false` para el modo alternativo
- `attempts`: intentos alternativos que fallaron antes de completarse correctamente

Campos de ruta:

- Entrada de un solo PDF: `details.pdf`
- Entradas de varios PDF: `details.pdfs[]` con elementos `pdf`
- Metadatos de reescritura de rutas del entorno aislado (cuando corresponda): `rewrittenFrom`

## Comportamiento ante errores

| Condición                           | Resultado                                                      |
| ----------------------------------- | -------------------------------------------------------------- |
| No se proporciona ningún PDF        | Genera `pdf required: provide a path or URL to a PDF document` |
| Más de 10 PDF                       | `details.error = "too_many_pdfs"`                              |
| Esquema de referencia no admitido   | `details.error = "unsupported_pdf_reference"`                  |
| `pages` con un proveedor nativo     | Genera `pages is not supported with native PDF providers`      |
| `password` con un proveedor nativo  | Genera `password is not supported with native PDF providers`   |

## Ejemplos

Un solo PDF:

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

PDF cifrado con extracción alternativa:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Temas relacionados

- [Descripción general de las herramientas](/es/tools) - todas las herramientas disponibles para agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de pdfMaxBytesMb y pdfMaxPages
