---
read_when:
    - Quieres que los agentes muestren las ediciones de código o Markdown como diffs
    - Quieres una URL de visor lista para el lienzo o un archivo de diferencias renderizado
    - Necesitas artefactos de diff controlados y temporales con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diff de solo lectura y renderizador de archivos para agentes (herramienta opcional de Plugin)
title: Diferencias
x-i18n:
    generated_at: "2026-05-02T05:37:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` es una herramienta de plugin opcional con una guía breve integrada del sistema y una skill complementaria que convierte el contenido de cambios en un artefacto diff de solo lectura para agentes.

Acepta cualquiera de estos:

- texto `before` y `after`
- un `patch` unificado

Puede devolver:

- una URL del visor del gateway para presentación en canvas
- una ruta de archivo renderizado (PNG o PDF) para entrega por mensaje
- ambas salidas en una sola llamada

Cuando está habilitado, el plugin antepone una guía concisa de uso en el espacio del prompt del sistema y también expone una skill detallada para casos en los que el agente necesita instrucciones más completas.

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

Esto bloquea el hook `before_prompt_build` del plugin diffs mientras mantiene disponibles el plugin, la herramienta y la skill complementaria.

Si quieres deshabilitar tanto la guía como la herramienta, deshabilita el plugin en su lugar.

## Flujo de trabajo típico del agente

<Steps>
  <Step title="Call diffs">
    El agente llama a la herramienta `diffs` con la entrada.
  </Step>
  <Step title="Read details">
    El agente lee los campos de `details` de la respuesta.
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
  Texto original. Requerido con `after` cuando se omite `patch`.
</ParamField>
<ParamField path="after" type="string">
  Texto actualizado. Requerido con `before` cuando se omite `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Texto diff unificado. Mutuamente excluyente con `before` y `after`.
</ParamField>
<ParamField path="path" type="string">
  Nombre de archivo de visualización para el modo before y after.
</ParamField>
<ParamField path="lang" type="string">
  Sugerencia de anulación de idioma para el modo before y after. Los valores desconocidos usan texto sin formato.
</ParamField>
<ParamField path="title" type="string">
  Anulación del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. De forma predeterminada usa el valor predeterminado del plugin `defaults.mode`. Alias obsoleto: `"image"` se comporta como `"file"` y todavía se acepta por compatibilidad con versiones anteriores.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. De forma predeterminada usa el valor predeterminado del plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diseño del diff. De forma predeterminada usa el valor predeterminado del plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande las secciones sin cambios cuando el contexto completo está disponible. Opción solo por llamada (no es una clave predeterminada del plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del archivo renderizado. De forma predeterminada usa el valor predeterminado del plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preajuste de calidad para la renderización de PNG o PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Anulación de escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Ancho máximo de renderización en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para las salidas del visor y de archivo independiente. Máximo 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Anulación del origen de la URL del visor. Anula `viewerBaseUrl` del plugin. Debe ser `http` o `https`, sin consulta/hash.
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
    - Límite de complejidad del patch: máximo 128 archivos y 120000 líneas totales.
    - `patch` junto con `before` o `after` se rechaza.
    - Límites de seguridad del archivo renderizado (se aplican a PNG y PDF):
      - `fileQuality: "standard"`: máximo 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo 14 MP (14,000,000 píxeles renderizados).
      - `fileQuality: "print"`: máximo 24 MP (24,000,000 píxeles renderizados).
      - PDF también tiene un máximo de 50 páginas.

  </Accordion>
</AccordionGroup>

## Contrato de detalles de salida

La herramienta devuelve metadatos estructurados bajo `details`.

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
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` cuando están disponibles)

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
    También se devuelven para llamadores existentes:

    - `format` (mismo valor que `fileFormat`)
    - `imagePath` (mismo valor que `filePath`)
    - `imageBytes` (mismo valor que `fileBytes`)
    - `imageQuality` (mismo valor que `fileQuality`)
    - `imageScale` (mismo valor que `fileScale`)
    - `imageMaxWidth` (mismo valor que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Resumen del comportamiento por modo:

| Modo     | Qué se devuelve                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo campos del visor.                                                                                                    |
| `"file"` | Solo campos de archivo, sin artefacto de visor.                                                                                  |
| `"both"` | Campos del visor más campos de archivo. Si falla la renderización del archivo, el visor todavía se devuelve con `fileError` y el alias `imageError`. |

## Secciones sin cambios contraídas

- El visor puede mostrar filas como `N unmodified lines`.
- Los controles de expansión en esas filas son condicionales y no están garantizados para todos los tipos de entrada.
- Los controles de expansión aparecen cuando el diff renderizado tiene datos de contexto expandibles, lo que es habitual para entradas before y after.
- Para muchas entradas de patch unificado, los cuerpos de contexto omitidos no están disponibles en los hunks del patch analizados, por lo que la fila puede aparecer sin controles de expansión. Este es el comportamiento esperado.
- `expandUnchanged` se aplica solo cuando existe contexto expandible.

## Valores predeterminados del plugin

Establece valores predeterminados para todo el plugin en `~/.openclaw/openclaw.json`:

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

Los parámetros explícitos de la herramienta anulan estos valores predeterminados.

### Configuración persistente de URL del visor

<ParamField path="viewerBaseUrl" type="string">
  Respaldo propiedad del plugin para enlaces de visor devueltos cuando una llamada de herramienta no pasa `baseUrl`. Debe ser `http` o `https`, sin consulta/hash.
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
  `false`: se deniegan las solicitudes que no son loopback a las rutas del visor. `true`: se permiten visores remotos si la ruta tokenizada es válida.
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
- Los metadatos del artefacto de visor contienen:
  - ID de artefacto aleatorio (20 caracteres hexadecimales)
  - token aleatorio (48 caracteres hexadecimales)
  - `createdAt` y `expiresAt`
  - ruta `viewer.html` almacenada
- El TTL predeterminado del artefacto es de 30 minutos cuando no se especifica.
- El TTL máximo aceptado del visor es de 6 horas.
- La limpieza se ejecuta de forma oportunista después de la creación del artefacto.
- Los artefactos caducados se eliminan.
- La limpieza de respaldo elimina carpetas obsoletas de más de 24 horas cuando faltan metadatos.

## URL del visor y comportamiento de red

Ruta del visor:

- `/plugins/diffs/view/{artifactId}/{token}`

Recursos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

El documento del visor resuelve esos recursos de forma relativa a la URL del visor, por lo que también se conserva un prefijo de ruta opcional de `baseUrl` para ambas solicitudes de recursos.

Comportamiento de construcción de URL:

- Si se proporciona `baseUrl` en la llamada de herramienta, se usa después de una validación estricta.
- De lo contrario, si está configurado `viewerBaseUrl` del plugin, se usa.
- Sin ninguna de las dos anulaciones, la URL del visor usa de forma predeterminada loopback `127.0.0.1`.
- Si el modo de vinculación del gateway es `custom` y `gateway.customBindHost` está configurado, se usa ese host.

Reglas de `baseUrl`:

- Debe ser `http://` o `https://`.
- Se rechazan consulta y hash.
- Se permite origen más ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Endurecimiento del visor">
    - Solo loopback de forma predeterminada.
    - Rutas del visor tokenizadas con validación estricta de ID y token.
    - CSP de respuesta del visor:
      - `default-src 'none'`
      - scripts y recursos solo desde el propio origen
      - sin `connect-src` saliente
    - Limitación de errores remotos cuando el acceso remoto está habilitado:
      - 40 fallos por cada 60 segundos
      - bloqueo de 60 segundos (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Endurecimiento de la renderización de archivos">
    - El enrutamiento de solicitudes del navegador para capturas de pantalla deniega de forma predeterminada.
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
  <Step title="Alternativa de plataforma">
    Alternativa de detección de comando/ruta de la plataforma.
  </Step>
</Steps>

Texto común de error:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Soluciónalo instalando Chrome, Chromium, Edge o Brave, o configurando una de las opciones de ruta de ejecutable anteriores.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores de validación de entrada">
    - `Provide patch or both before and after text.` — incluye tanto `before` como `after`, o proporciona `patch`.
    - `Provide either patch or before/after input, not both.` — no mezcles modos de entrada.
    - `Invalid baseUrl: ...` — usa un origen `http(s)` con una ruta opcional, sin consulta/hash.
    - `{field} exceeds maximum size (...)` — reduce el tamaño de la carga.
    - Rechazo de parche grande — reduce el número de archivos del parche o el total de líneas.

  </Accordion>
  <Accordion title="Accesibilidad del visor">
    - La URL del visor se resuelve a `127.0.0.1` de forma predeterminada.
    - Para escenarios de acceso remoto:
      - configura `viewerBaseUrl` del plugin, o
      - pasa `baseUrl` por cada llamada a la herramienta, o
      - usa `gateway.bind=custom` y `gateway.customBindHost`
    - Si `gateway.trustedProxies` incluye loopback para un proxy en el mismo host (por ejemplo, Tailscale Serve), las solicitudes directas al visor por loopback sin encabezados de IP de cliente reenviados fallan de forma cerrada por diseño.
    - Para esa topología de proxy:
      - prefiere `mode: "file"` o `mode: "both"` cuando solo necesitas un adjunto, o
      - habilita intencionalmente `security.allowRemoteViewer` y configura `viewerBaseUrl` del plugin o pasa un `baseUrl` de proxy/público cuando necesites una URL de visor compartible
    - Habilita `security.allowRemoteViewer` solo cuando quieras acceso externo al visor.

  </Accordion>
  <Accordion title="La fila de líneas sin modificar no tiene botón de expansión">
    Esto puede ocurrir con entrada de parche cuando el parche no contiene contexto expandible. Es lo esperado y no indica un fallo del visor.
  </Accordion>
  <Accordion title="Artefacto no encontrado">
    - El artefacto expiró por el TTL.
    - El token o la ruta cambiaron.
    - La limpieza eliminó datos obsoletos.

  </Accordion>
</AccordionGroup>

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en el lienzo.
- Prefiere `mode: "file"` para canales de chat salientes que necesitan un adjunto.
- Mantén `allowRemoteViewer` deshabilitado salvo que tu implementación requiera URL de visor remotas.
- Configura valores explícitos y cortos de `ttlSeconds` para diffs sensibles.
- Evita enviar secretos en la entrada del diff cuando no sea necesario.
- Si tu canal comprime imágenes agresivamente (por ejemplo, Telegram o WhatsApp), prefiere la salida PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderización de diffs impulsado por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Navegador](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Resumen de herramientas](/es/tools)
