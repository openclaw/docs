---
read_when:
    - Quiere analizar archivos PDF de agentes
    - Necesita los parámetros y límites exactos de la herramienta de PDF
    - Está depurando el modo PDF nativo frente al modo alternativo de extracción
summary: Analiza uno o más documentos PDF con compatibilidad nativa del proveedor y extracción alternativa
title: Herramienta de PDF
x-i18n:
    generated_at: "2026-07-22T10:51:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e0e5b897e1e122af4b2f6f9a3eaeb73f6e93af1051d306ad82539b258de90c49
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analiza uno o más documentos PDF y devuelve texto. Usa la entrada nativa de documentos en los modelos de Anthropic y Google, y recurre a la extracción de texto e imágenes para todos los demás proveedores.

## Disponibilidad

La herramienta se registra solo cuando OpenClaw puede resolver un modelo compatible con PDF para el agente. Orden de resolución:

1. `agents.defaults.pdfModel` (modelo principal y alternativas explícitos)
2. `agents.defaults.imageModel` (modelo principal y alternativas explícitos)
3. El modelo predeterminado o resuelto para la sesión del agente, si su proveedor admite la entrada nativa de PDF (Anthropic, Google) o ya tiene configurado un modelo de visión
4. Proveedores compatibles con imágenes o visión detectados automáticamente y con autenticación utilizable, dando prioridad a los proveedores con PDF nativo

Se comprueba la autenticación de cada modelo alternativo candidato antes de usarlo, por lo que un `provider/model` configurado solo cuenta si OpenClaw puede autenticar ese proveedor para el agente. Si no se resuelve ningún modelo utilizable, la herramienta `pdf` no se expone.

## Referencia de entrada

<ParamField path="pdf" type="string">
Una ruta o URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Varias rutas o URL de PDF, hasta un total de 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Instrucción de análisis.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas como `1-5` o `1,3,7-9`. No se admite en el modo de proveedor nativo.
</ParamField>

<ParamField path="password" type="string">
Contraseña para archivos PDF cifrados. Se aplica a todos los PDF de la solicitud; solo se usa en el modo alternativo de extracción.
</ParamField>

<ParamField path="model" type="string">
Sustitución opcional del modelo con el formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Límite de tamaño por PDF en MB. El valor predeterminado es `agents.defaults.pdfMaxMb`, o `10` si no se establece.
</ParamField>

Notas:

- `pdf` y `pdfs` se combinan y se eliminan los duplicados antes de la carga; se requiere al menos uno.
- `pages` se interpreta como números de página basados en 1, se eliminan los duplicados, se ordenan y se limitan a `agents.defaults.pdfMaxPages` (valor predeterminado: `20`). Un intervalo que no coincida con ninguna página dentro de los límites genera un error antes de llamar al modelo.

## Referencias de PDF compatibles

- Ruta de archivo local (incluida la expansión de `~`)
- URL `file://`
- URL `http://` y `https://`
- Referencias entrantes administradas por OpenClaw, como `media://inbound/<id>`

Otros esquemas de URI (por ejemplo, `ftp://`) devuelven `details.error = "unsupported_pdf_reference"`. Las URL remotas `http(s)` se rechazan cuando la herramienta se ejecuta en un entorno aislado. Cuando está habilitada la política de archivos exclusiva del espacio de trabajo, se rechazan las rutas locales fuera de las raíces permitidas; las referencias entrantes administradas y las rutas reproducidas dentro del almacén de medios entrantes de OpenClaw siguen estando permitidas.

## Modos de ejecución

### Modo de proveedor nativo

Se utiliza para los proveedores `anthropic` y `google` (los únicos proveedores que actualmente declaran compatibilidad nativa con documentos PDF). Los bytes sin procesar de cada PDF se envían directamente a la API del proveedor como una parte de documento nativo o PDF insertado por archivo.

Límites:

- `pages` no se admite; si se establece, la herramienta genera `pages is not supported with native PDF providers`.
- `password` no se admite; si se establece, la herramienta genera `password is not supported with native PDF providers`. Use un modelo no nativo para archivos PDF cifrados.

### Modo alternativo de extracción

Se utiliza para todos los demás proveedores.

1. Extrae el texto de las páginas seleccionadas (hasta `agents.defaults.pdfMaxPages`, con un valor predeterminado de `20`) mediante el Plugin `document-extract` incluido, que usa el paquete `clawpdf` (PDFium WebAssembly) para extraer texto e imágenes.
2. Si el texto extraído tiene menos de `200` caracteres, representa las mismas páginas como imágenes PNG. El presupuesto de representación es de `4,000,000` píxeles en total, compartido entre todas las páginas que necesitan imágenes (asignado proporcionalmente por cada página restante, no por página), por lo que las páginas de texto que ya contienen suficiente texto omiten por completo la representación.
3. Envía el texto extraído (y cualquier imagen representada), junto con la instrucción, al modelo seleccionado.

Detalles:

- Los archivos PDF cifrados se abren con el parámetro de nivel superior `password`.
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

| Clave                         | Valor predeterminado | Significado                                                                                                      |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`            | sin establecer       | Modelos PDF principal y alternativos explícitos; recurre a `imageModel` y después al modelo de la sesión. |
| `agents.defaults.pdfMaxMb`            | `10`   | Límite de tamaño por PDF en MB.                                                                                  |
| `agents.defaults.pdfMaxPages`            | `20`   | Número máximo de páginas procesadas por PDF.                                                                     |

Consulte la [Referencia de configuración](/es/gateway/config-agents#agent-defaults) para obtener todos los detalles de los campos.

## Detalles de salida

La herramienta devuelve texto en `content[0].text` y metadatos estructurados en `details`.

Campos habituales de `details`:

- `model`: referencia del modelo resuelto (`provider/model`)
- `native`: `true` para el modo de proveedor nativo, `false` para el modo alternativo
- `attempts`: intentos alternativos que fallaron antes de obtener un resultado satisfactorio

Campos de ruta:

- Entrada de un solo PDF: `details.pdf`
- Entradas de varios PDF: `details.pdfs[]` con entradas `pdf`
- Metadatos de reescritura de rutas del entorno aislado (cuando corresponda): `rewrittenFrom`

## Comportamiento ante errores

| Condición                              | Resultado                                                    |
| -------------------------------------- | ------------------------------------------------------------ |
| No se proporciona ningún PDF           | Genera `pdf required: provide a path or URL to a PDF document`                                    |
| Más de 10 archivos PDF                 | `details.error = "too_many_pdfs"`                                           |
| Esquema de referencia no compatible    | `details.error = "unsupported_pdf_reference"`                                           |
| `pages` con un proveedor nativo | Genera `pages is not supported with native PDF providers`                                |
| `password` con un proveedor nativo | Genera `password is not supported with native PDF providers`                                |

## Ejemplos

Un solo PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Resume este informe en 5 viñetas"
}
```

Varios PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compara los riesgos y los cambios en el cronograma entre ambos documentos"
}
```

Modelo alternativo con filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extrae únicamente los incidentes que afecten a los clientes"
}
```

PDF cifrado con extracción alternativa:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Resume este contrato"
}
```

## Contenido relacionado

- [Descripción general de las herramientas](/es/tools) - todas las herramientas disponibles para agentes
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de pdfMaxBytesMb y pdfMaxPages
