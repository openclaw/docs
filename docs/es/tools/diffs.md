---
read_when:
    - Quieres que los agentes muestren las ediciones de código o Markdown como diffs
    - Quieres una URL de visor lista para el lienzo o un archivo de diff renderizado
    - Necesitas artefactos de diff temporales y controlados con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diff de solo lectura y renderizador de archivos para agentes (herramienta de plugin opcional)
title: Diferencias
x-i18n:
    generated_at: "2026-06-27T13:02:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` es una herramienta opcional de Plugin con una guía breve integrada del sistema y una Skill complementaria que convierte el contenido de cambios en un artefacto diff de solo lectura para agentes.

Acepta cualquiera de estos:

- texto `before` y `after`
- un `patch` unificado

Puede devolver:

- una URL del visor de Gateway para presentación en canvas
- una ruta de archivo renderizado (PNG o PDF) para entrega por mensaje
- ambas salidas en una sola llamada

Cuando está habilitado, el Plugin antepone una guía de uso concisa en el espacio del prompt del sistema y también expone una Skill detallada para casos en los que el agente necesita instrucciones más completas.

## Inicio rápido

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Flujos que priorizan canvas: los agentes llaman a `diffs` con `mode: "view"` y abren `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de archivos por chat: los agentes llaman a `diffs` con `mode: "file"` y envían `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinado: los agentes llaman a `diffs` con `mode: "both"` para obtener ambos artefactos en una sola llamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Deshabilitar la guía integrada del sistema

Si quieres mantener habilitada la herramienta `diffs` pero deshabilitar su guía integrada del prompt del sistema, establece `plugins.entries.diffs.hooks.allowPromptInjection` en `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Esto bloquea el hook `before_prompt_build` del Plugin diffs, mientras mantiene disponibles el Plugin, la herramienta y la Skill complementaria.

Si quieres deshabilitar tanto la guía como la herramienta, deshabilita el Plugin en su lugar.

## Flujo de trabajo típico del agente

<Steps>
  <Step title="Call diffs">
    El agente llama a la herramienta `diffs` con entrada.
  </Step>
  <Step title="Read details">
    El agente lee los campos `details` de la respuesta.
  </Step>
  <Step title="Present">
    El agente abre `details.viewerUrl` con `canvas present`, envía `details.filePath` con `message` usando `path` o `filePath`, o hace ambas cosas.
  </Step>
</Steps>

## Ejemplos de entrada

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Referencia de entrada de la herramienta

Todos los campos son opcionales salvo que se indique lo contrario.

<ParamField path="before" type="string">
  Texto original. Obligatorio con `after` cuando se omite `patch`.
</ParamField>
<ParamField path="after" type="string">
  Texto actualizado. Obligatorio con `before` cuando se omite `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Texto diff unificado. Mutuamente excluyente con `before` y `after`.
</ParamField>
<ParamField path="path" type="string">
  Nombre de archivo para mostrar en el modo antes y después.
</ParamField>
<ParamField path="lang" type="string">
  Indicación de sobrescritura de idioma para el modo antes y después. Los valores desconocidos y los idiomas fuera del conjunto predeterminado del visor recurren a texto sin formato, salvo que el
  Plugin Diff Viewer Language Pack esté instalado.
</ParamField>

<ParamField path="title" type="string">
  Sobrescritura del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. El valor predeterminado es el valor predeterminado del Plugin `defaults.mode`. Alias obsoleto: `"image"` se comporta como `"file"` y todavía se acepta por compatibilidad con versiones anteriores.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. El valor predeterminado es el valor predeterminado del Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diseño del diff. El valor predeterminado es el valor predeterminado del Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande las secciones sin cambios cuando el contexto completo está disponible. Opción solo por llamada (no es una clave predeterminada del Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del archivo renderizado. El valor predeterminado es el valor predeterminado del Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preajuste de calidad para renderizado PNG o PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Sobrescritura de escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Ancho máximo de renderizado en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para el visor y las salidas de archivo independientes. Máximo 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Sobrescritura del origen de la URL del visor. Sobrescribe `viewerBaseUrl` del Plugin. Debe ser `http` o `https`, sin consulta/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Todavía se aceptan por compatibilidad con versiones anteriores:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` y `after` tienen un máximo de 512 KiB cada uno.
    - `patch` tiene un máximo de 2 MiB.
    - `path` tiene un máximo de 2048 bytes.
    - `lang` tiene un máximo de 128 bytes.
    - `title` tiene un máximo de 1024 bytes.
    - Límite de complejidad de patch: máximo de 128 archivos y 120000 líneas en total.
    - `patch` y `before` o `after` juntos se rechazan.
    - Límites de seguridad de archivos renderizados (se aplican a PNG y PDF):
      - `fileQuality: "standard"`: máximo 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo 14 MP (14,000,000 píxeles renderizados).
      - `fileQuality: "print"`: máximo 24 MP (24,000,000 píxeles renderizados).
      - PDF también tiene un máximo de 50 páginas.

  </Accordion>
</AccordionGroup>

## Resaltado de sintaxis

OpenClaw incluye resaltado de sintaxis para lenguajes comunes de código fuente, configuración y documentación:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` y `toml`.

Los alias comunes como `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` y `ps1` se normalizan a esos lenguajes predeterminados.

Instala el plugin Diff Viewer Language Pack para resaltar otros lenguajes:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Con el paquete de lenguajes disponible, OpenClaw puede resaltar muchos más lenguajes. Si el paquete no está instalado, los archivos fuera de la lista predeterminada siguen mostrándose como texto sin formato legible. Algunos ejemplos incluyen Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI y archivos diff.

Consulta el [plugin Diffs Language Pack](/es/plugins/reference/diffs-language-pack) para obtener detalles y [lenguajes de Shiki](https://shiki.style/languages) para ver el catálogo upstream de lenguajes y alias de Shiki.

## Contrato de detalles de salida

La herramienta devuelve metadatos estructurados en `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Campos compartidos para los modos que crean un visor:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` cuando estén disponibles)

  </Accordion>
  <Accordion title="File fields">
    Campos de archivo cuando se renderiza PNG o PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (mismo valor que `filePath`, para compatibilidad con la herramienta de mensajes)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    También se devuelve para llamadores existentes:

    - `format` (mismo valor que `fileFormat`)
    - `imagePath` (mismo valor que `filePath`)
    - `imageBytes` (mismo valor que `fileBytes`)
    - `imageQuality` (mismo valor que `fileQuality`)
    - `imageScale` (mismo valor que `fileScale`)
    - `imageMaxWidth` (mismo valor que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Resumen del comportamiento de los modos:

| Modo     | Qué se devuelve                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo campos del visor.                                                                                                 |
| `"file"` | Solo campos de archivo, sin artefacto de visor.                                                                        |
| `"both"` | Campos del visor más campos de archivo. Si falla el renderizado del archivo, el visor se sigue devolviendo con el alias `fileError` e `imageError`. |

## Secciones sin cambios contraídas

- El visor puede mostrar filas como `N unmodified lines`.
- Los controles de expansión en esas filas son condicionales y no están garantizados para cada tipo de entrada.
- Los controles de expansión aparecen cuando el diff renderizado tiene datos de contexto expandibles, lo cual es habitual para entradas de antes y después.
- Para muchas entradas de parches unificados, los cuerpos de contexto omitidos no están disponibles en los hunks del parche analizado, por lo que la fila puede aparecer sin controles de expansión. Este es el comportamiento esperado.
- `expandUnchanged` se aplica solo cuando existe contexto expandible.

## Valores predeterminados del Plugin

Define valores predeterminados para todo el Plugin en `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Valores predeterminados admitidos:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

Los parámetros explícitos de la herramienta sobrescriben estos valores predeterminados.

### Configuración persistente de URL del visor

<ParamField path="viewerBaseUrl" type="string">
  Respaldo propiedad del Plugin para los enlaces de visor devueltos cuando una llamada de herramienta no pasa `baseUrl`. Debe ser `http` o `https`, sin consulta/hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Configuración de seguridad

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: se deniegan las solicitudes que no sean local loopback a las rutas del visor. `true`: se permiten visores remotos si la ruta tokenizada es válida.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Ciclo de vida y almacenamiento de artefactos

- Los artefactos se almacenan bajo la subcarpeta temporal: `$TMPDIR/openclaw-diffs`.
- Los metadatos del artefacto del visor contienen:
  - ID de artefacto aleatorio (20 caracteres hexadecimales)
  - token aleatorio (48 caracteres hexadecimales)
  - `createdAt` y `expiresAt`
  - ruta almacenada de `viewer.html`
- El TTL predeterminado del artefacto es de 30 minutos cuando no se especifica.
- El TTL máximo aceptado para el visor es de 6 horas.
- La limpieza se ejecuta de forma oportunista después de crear el artefacto.
- Los artefactos vencidos se eliminan.
- La limpieza de respaldo elimina carpetas obsoletas con más de 24 horas cuando faltan metadatos.

## URL del visor y comportamiento de red

Ruta del visor:

- `/plugins/diffs/view/{artifactId}/{token}`

Recursos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` cuando el diff usa un idioma del paquete de idiomas del visor de diffs

El documento del visor resuelve esos recursos en relación con la URL del visor, por lo que también se conserva un prefijo de ruta `baseUrl` opcional para ambas solicitudes de recursos.

Comportamiento de construcción de URL:

- Si se proporciona `baseUrl` en la llamada a herramienta, se usa después de una validación estricta.
- De lo contrario, si está configurado `viewerBaseUrl` del plugin, se usa.
- Sin ninguna de esas sobrescrituras, la URL del visor usa de forma predeterminada el loopback `127.0.0.1`.
- Si el modo de enlace del Gateway es `custom` y `gateway.customBindHost` está configurado, se usa ese host.

Reglas de `baseUrl`:

- Debe ser `http://` o `https://`.
- Se rechazan la consulta y el hash.
- Se permite el origen más una ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Endurecimiento del visor">
    - Solo loopback de forma predeterminada.
    - Rutas de visor con token y validación estricta de ID y token.
    - CSP de la respuesta del visor:
      - `default-src 'none'`
      - scripts y recursos solo desde el propio origen
      - sin `connect-src` saliente
    - Limitación de intentos fallidos remotos cuando el acceso remoto está habilitado:
      - 40 fallos cada 60 segundos
      - bloqueo de 60 segundos (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Endurecimiento de renderizado de archivos">
    - El enrutamiento de solicitudes del navegador de capturas de pantalla deniega de forma predeterminada.
    - Solo se permiten recursos locales del visor desde `http://127.0.0.1/plugins/diffs/assets/*`.
    - Las solicitudes de red externas están bloqueadas.

  </Accordion>
</AccordionGroup>

## Requisitos del navegador para el modo de archivo

`mode: "file"` y `mode: "both"` necesitan un navegador compatible con Chromium.

Orden de resolución:

<Steps>
  <Step title="Configuración">
    `browser.executablePath` en la configuración de OpenClaw.
  </Step>
  <Step title="Variables de entorno">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Respaldo de plataforma">
    Respaldo de descubrimiento de comando/ruta de la plataforma.
  </Step>
</Steps>

Texto de fallo común:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrígelo instalando Chrome, Chromium, Edge o Brave, o configurando una de las opciones de ruta de ejecutable anteriores.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores de validación de entrada">
    - `Provide patch or both before and after text.` — incluye tanto `before` como `after`, o proporciona `patch`.
    - `Provide either patch or before/after input, not both.` — no mezcles modos de entrada.
    - `Invalid baseUrl: ...` — usa origen `http(s)` con ruta opcional, sin consulta/hash.
    - `{field} exceeds maximum size (...)` — reduce el tamaño de la carga útil.
    - Rechazo de patch grande — reduce el número de archivos de patch o el total de líneas.

  </Accordion>
  <Accordion title="Accesibilidad del visor">
    - La URL del visor se resuelve a `127.0.0.1` de forma predeterminada.
    - Para escenarios de acceso remoto:
      - configura `viewerBaseUrl` del plugin, o
      - pasa `baseUrl` por llamada a herramienta, o
      - usa `gateway.bind=custom` y `gateway.customBindHost`
    - Si `gateway.trustedProxies` incluye loopback para un proxy en el mismo host (por ejemplo Tailscale Serve), las solicitudes sin procesar al visor por loopback sin encabezados de IP de cliente reenviados fallan cerradas por diseño.
    - Para esa topología de proxy:
      - prefiere `mode: "file"` o `mode: "both"` cuando solo necesitas un adjunto, o
      - habilita intencionalmente `security.allowRemoteViewer` y configura `viewerBaseUrl` del plugin o pasa un `baseUrl` de proxy/público cuando necesites una URL de visor compartible
    - Habilita `security.allowRemoteViewer` solo cuando tengas intención de dar acceso externo al visor.

  </Accordion>
  <Accordion title="La fila de líneas sin modificar no tiene botón de expansión">
    Esto puede ocurrir con la entrada de patch cuando el patch no contiene contexto expandible. Esto es esperado y no indica un fallo del visor.
  </Accordion>
  <Accordion title="Artefacto no encontrado">
    - El artefacto venció debido al TTL.
    - El token o la ruta cambiaron.
    - La limpieza eliminó datos obsoletos.

  </Accordion>
</AccordionGroup>

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en canvas.
- Prefiere `mode: "file"` para canales de chat salientes que necesitan un adjunto.
- Mantén `allowRemoteViewer` deshabilitado a menos que tu implementación requiera URL de visor remotas.
- Configura `ttlSeconds` cortos explícitos para diffs sensibles.
- Evita enviar secretos en la entrada de diff cuando no sea necesario.
- Si tu canal comprime imágenes de forma agresiva (por ejemplo Telegram o WhatsApp), prefiere la salida PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderizado de diffs impulsado por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Navegador](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Resumen de herramientas](/es/tools)
