---
read_when:
    - Quieres analizar archivos PDF de agentes
    - Necesitas parámetros y límites exactos de la herramienta de PDF
    - Estás depurando el modo PDF nativo frente al fallback de extracción
summary: Analiza uno o más documentos PDF con soporte nativo del proveedor y respaldo de extracción
title: Herramienta PDF
x-i18n:
    generated_at: "2026-07-05T11:51:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analiza uno o más documentos PDF y devuelve texto. Usa entrada de documento nativa en modelos de Anthropic y Google, y recurre a la extracción de texto/imagen para todos los demás proveedores.

## Disponibilidad

La herramienta se registra solo cuando OpenClaw puede resolver un modelo compatible con PDF para el agente. Orden de resolución:

1. `agents.defaults.pdfModel` (principal/fallbacks explícitos)
2. `agents.defaults.imageModel` (principal/fallbacks explícitos)
3. El modelo resuelto de sesión/predeterminado del agente, si su proveedor admite entrada PDF nativa (Anthropic, Google) o ya tiene un modelo de visión configurado
4. Proveedores compatibles con imagen/visión detectados automáticamente con autenticación utilizable, dando preferencia primero a los proveedores con PDF nativo

Cada candidato de fallback se comprueba con autenticación antes de usarse, por lo que un `provider/model` configurado solo cuenta si OpenClaw puede autenticar ese proveedor para el agente. Si no se resuelve ningún modelo utilizable, la herramienta `pdf` no se expone.

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
Filtro de páginas como `1-5` o `1,3,7-9`. No se admite en modo de proveedor nativo.
</ParamField>

<ParamField path="password" type="string">
Contraseña para PDF cifrados. Se aplica a todos los PDF de la solicitud; solo se usa en el modo fallback de extracción.
</ParamField>

<ParamField path="model" type="string">
Anulación opcional de modelo en formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Límite de tamaño por PDF en MB. De forma predeterminada usa `agents.defaults.pdfMaxBytesMb`, o `10` si no está definido.
</ParamField>

Notas:

- `pdf` y `pdfs` se fusionan y deduplican antes de la carga; se requiere al menos uno.
- `pages` se interpreta como números de página basados en 1, se deduplica, se ordena y se limita a `agents.defaults.pdfMaxPages` (valor predeterminado `20`). Un intervalo que no coincida con ninguna página dentro de los límites produce un error antes de la llamada al modelo.

## Referencias PDF admitidas

- Ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`
- Referencias entrantes administradas por OpenClaw, como `media://inbound/<id>`

Otros esquemas de URI (por ejemplo, `ftp://`) devuelven `details.error = "unsupported_pdf_reference"`. Las URL remotas `http(s)` se rechazan cuando la herramienta se ejecuta en sandbox. Con la política de archivos solo de espacio de trabajo habilitada, las rutas locales fuera de las raíces permitidas se rechazan; las referencias entrantes administradas y las rutas reproducidas bajo el almacén de medios entrantes de OpenClaw siguen estando permitidas.

## Modos de ejecución

### Modo de proveedor nativo

Se usa para los proveedores `anthropic` y `google` (los únicos proveedores que actualmente declaran compatibilidad nativa con documentos PDF). Los bytes PDF sin procesar van directamente a la API del proveedor como una parte nativa de documento/PDF en línea por archivo.

Límites:

- `pages` no se admite; si se establece, la herramienta lanza `pages is not supported with native PDF providers`.
- `password` no se admite; si se establece, la herramienta lanza `password is not supported with native PDF providers`. Usa un modelo no nativo para PDF cifrados.

### Modo fallback de extracción

Se usa para todos los demás proveedores.

1. Extrae texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, valor predeterminado `20`) mediante el Plugin `document-extract` incluido, que usa el paquete `clawpdf` (PDFium WebAssembly) para extracción de texto e imágenes.
2. Si el texto extraído tiene menos de `200` caracteres, renderiza las mismas páginas como imágenes PNG. El presupuesto de renderizado es de `4,000,000` píxeles en total, compartido entre todas las páginas que necesiten imágenes (asignado proporcionalmente por página restante, no por página), por lo que las páginas de texto que ya tienen suficiente texto omiten por completo el renderizado.
3. Envía el texto extraído (y cualquier imagen renderizada) más el prompt al modelo seleccionado.

Detalles:

- Los PDF cifrados se abren con el parámetro de nivel superior `password`.
- Si el modelo no tiene entrada de imagen y no hay texto extraíble, la herramienta produce un error.
- Si falla el renderizado de imágenes, OpenClaw descarta las imágenes y continúa con el texto extraído.
- Si el modelo de destino es solo texto y la extracción produjo imágenes, OpenClaw descarta las imágenes y envía solo texto.

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

| Clave                           | Valor predeterminado | Significado                                                                                              |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | no definido          | Modelos PDF principal/fallback explícitos; recurre a `imageModel` y luego al modelo de sesión.           |
| `agents.defaults.pdfMaxBytesMb` | `10`                 | Límite de tamaño por PDF en MB.                                                                          |
| `agents.defaults.pdfMaxPages`   | `20`                 | Máximo de páginas procesadas por PDF.                                                                    |

Consulta la [Referencia de configuración](/es/gateway/config-agents#agent-defaults) para ver todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos comunes de `details`:

- `model`: referencia de modelo resuelta (`provider/model`)
- `native`: `true` para modo de proveedor nativo, `false` para fallback
- `attempts`: intentos de fallback que fallaron antes del éxito

Campos de ruta:

- Entrada de un solo PDF: `details.pdf`
- Entradas de varios PDF: `details.pdfs[]` con entradas `pdf`
- Metadatos de reescritura de ruta de sandbox (cuando corresponda): `rewrittenFrom`

## Comportamiento de errores

| Condición                         | Resultado                                                      |
| --------------------------------- | -------------------------------------------------------------- |
| Sin entrada PDF                   | Lanza `pdf required: provide a path or URL to a PDF document`  |
| Más de 10 PDF                     | `details.error = "too_many_pdfs"`                              |
| Esquema de referencia no admitido | `details.error = "unsupported_pdf_reference"`                  |
| `pages` con un proveedor nativo   | Lanza `pages is not supported with native PDF providers`       |
| `password` con un proveedor nativo | Lanza `password is not supported with native PDF providers`   |

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

Modelo fallback con filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF cifrado con fallback de extracción:

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
