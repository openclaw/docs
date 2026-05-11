---
read_when:
    - Quieres que los agentes muestren las ediciones de código o Markdown como diferencias
    - Quieres una URL de visor lista para el lienzo o un archivo diff renderizado
    - Necesita artefactos de diff temporales y controlados con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diferencias de solo lectura y renderizador de archivos para agentes (herramienta opcional de Plugin)
title: Diferencias
x-i18n:
    generated_at: "2026-05-11T20:55:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` es una herramienta opcional de plugin con una guía de sistema integrada breve y una Skill complementaria que convierte el contenido de cambios en un artefacto diff de solo lectura para agentes.

Acepta cualquiera de estos elementos:

- texto `before` y `after`
- un `patch` unificado

Puede devolver:

- una URL de visor del Gateway para presentación en canvas
- una ruta de archivo renderizado (PNG o PDF) para entrega por mensaje
- ambas salidas en una sola llamada

Cuando está habilitado, el plugin antepone una guía de uso concisa en el espacio del prompt de sistema y también expone una Skill detallada para casos en los que el agente necesita instrucciones más completas.

## Inicio rápido

<Steps>
  <Step title="Instalar el plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Habilitar el plugin">
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
  <Step title="Elegir un modo">
    <Tabs>
      <Tab title="view">
        Flujos centrados en canvas: los agentes llaman a `diffs` con `mode: "view"` y abren `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de archivos en chat: los agentes llaman a `diffs` con `mode: "file"` y envían `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinado: los agentes llaman a `diffs` con `mode: "both"` para obtener ambos artefactos en una sola llamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Deshabilitar la guía de sistema integrada

Si quieres mantener habilitada la herramienta `diffs` pero deshabilitar su guía integrada de prompt de sistema, establece `plugins.entries.diffs.hooks.allowPromptInjection` en `false`:

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

Esto bloquea el hook `before_prompt_build` del plugin diffs y mantiene disponibles el plugin, la herramienta y la Skill complementaria.

Si quieres deshabilitar tanto la guía como la herramienta, deshabilita el plugin.

## Flujo de trabajo típico del agente

<Steps>
  <Step title="Llamar a diffs">
    El agente llama a la herramienta `diffs` con la entrada.
  </Step>
  <Step title="Leer details">
    El agente lee los campos de `details` de la respuesta.
  </Step>
  <Step title="Presentar">
    El agente abre `details.viewerUrl` con `canvas present`, envía `details.filePath` con `message` usando `path` o `filePath`, o hace ambas cosas.
  </Step>
</Steps>

## Ejemplos de entrada

<Tabs>
  <Tab title="Antes y después">
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
  Nombre de archivo mostrado para el modo antes y después.
</ParamField>
<ParamField path="lang" type="string">
  Indicación de sobrescritura de idioma para el modo antes y después. Los valores desconocidos vuelven a texto sin formato.
</ParamField>
<ParamField path="title" type="string">
  Sobrescritura del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. El valor predeterminado es el valor predeterminado del plugin `defaults.mode`. Alias obsoleto: `"image"` se comporta como `"file"` y todavía se acepta por compatibilidad con versiones anteriores.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. El valor predeterminado es el valor predeterminado del plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diseño del diff. El valor predeterminado es el valor predeterminado del plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande secciones sin cambios cuando está disponible el contexto completo. Opción solo por llamada (no es una clave predeterminada del plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato de archivo renderizado. El valor predeterminado es el valor predeterminado del plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preajuste de calidad para renderizado PNG o PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Sobrescritura de escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Anchura máxima de renderizado en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para salidas de visor y de archivo independiente. Máximo 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Sobrescritura del origen de la URL del visor. Sobrescribe `viewerBaseUrl` del plugin. Debe ser `http` o `https`, sin consulta/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias de entrada heredados">
    Todavía se aceptan por compatibilidad con versiones anteriores:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validación y límites">
    - `before` y `after` tienen un máximo de 512 KiB cada uno.
    - `patch` tiene un máximo de 2 MiB.
    - `path` tiene un máximo de 2048 bytes.
    - `lang` tiene un máximo de 128 bytes.
    - `title` tiene un máximo de 1024 bytes.
    - Límite de complejidad de patch: máximo 128 archivos y 120000 líneas totales.
    - `patch` junto con `before` o `after` se rechaza.
    - Límites de seguridad de archivos renderizados (se aplican a PNG y PDF):
      - `fileQuality: "standard"`: máximo 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo 14 MP (14,000,000 píxeles renderizados).
      - `fileQuality: "print"`: máximo 24 MP (24,000,000 píxeles renderizados).
      - PDF también tiene un máximo de 50 páginas.

  </Accordion>
</AccordionGroup>

## Contrato de detalles de salida

La herramienta devuelve metadatos estructurados en `details`.

<AccordionGroup>
  <Accordion title="Campos del visor">
    Campos compartidos para modos que crean un visor:

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
  <Accordion title="Campos de archivo">
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
  <Accordion title="Alias de compatibilidad">
    También se devuelven para llamadores existentes:

    - `format` (mismo valor que `fileFormat`)
    - `imagePath` (mismo valor que `filePath`)
    - `imageBytes` (mismo valor que `fileBytes`)
    - `imageQuality` (mismo valor que `fileQuality`)
    - `imageScale` (mismo valor que `fileScale`)
    - `imageMaxWidth` (mismo valor que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Resumen del comportamiento de los modos:

| Modo     | Qué se devuelve                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo campos del visor.                                                                                                    |
| `"file"` | Solo campos de archivo, sin artefacto de visor.                                                                                  |
| `"both"` | Campos del visor más campos de archivo. Si falla el renderizado del archivo, el visor todavía se devuelve con el alias `fileError` e `imageError`. |

## Secciones sin cambios contraídas

- El visor puede mostrar filas como `N unmodified lines`.
- Los controles de expansión en esas filas son condicionales y no están garantizados para cada tipo de entrada.
- Los controles de expansión aparecen cuando el diff renderizado tiene datos de contexto expandibles, lo cual es típico para entradas de antes y después.
- Para muchas entradas de patch unificado, los cuerpos de contexto omitidos no están disponibles en los hunks del patch analizado, por lo que la fila puede aparecer sin controles de expansión. Este es el comportamiento esperado.
- `expandUnchanged` solo se aplica cuando existe contexto expandible.

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
  Alternativa de respaldo propia del plugin para enlaces de visor devueltos cuando una llamada de herramienta no pasa `baseUrl`. Debe ser `http` o `https`, sin consulta/hash.
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
  `false`: se deniegan las solicitudes que no son loopback a rutas del visor. `true`: se permiten visores remotos si la ruta tokenizada es válida.
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

- Los artefactos se almacenan en la subcarpeta temporal: `$TMPDIR/openclaw-diffs`.
- Los metadatos de artefacto del visor contienen:
  - ID de artefacto aleatorio (20 caracteres hexadecimales)
  - token aleatorio (48 caracteres hexadecimales)
  - `createdAt` y `expiresAt`
  - ruta `viewer.html` almacenada
- El TTL predeterminado del artefacto es de 30 minutos cuando no se especifica.
- El TTL máximo aceptado del visor es de 6 horas.
- La limpieza se ejecuta de forma oportunista después de la creación del artefacto.
- Los artefactos vencidos se eliminan.
- La limpieza de respaldo elimina carpetas obsoletas de más de 24 horas cuando faltan metadatos.

## URL del visor y comportamiento de red

Ruta del visor:

- `/plugins/diffs/view/{artifactId}/{token}`

Recursos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

El documento del visor resuelve esos recursos en relación con la URL del visor, por lo que también se conserva un prefijo de ruta `baseUrl` opcional para ambas solicitudes de recursos.

Comportamiento de construcción de URL:

- Si se proporciona `baseUrl` en la llamada de herramienta, se usa después de una validación estricta.
- De lo contrario, si `viewerBaseUrl` del plugin está configurado, se usa.
- Sin ninguna de las dos sobrescrituras, la URL del visor usa de forma predeterminada el loopback `127.0.0.1`.
- Si el modo de enlace del Gateway es `custom` y `gateway.customBindHost` está establecido, se usa ese host.

Reglas de `baseUrl`:

- Debe ser `http://` o `https://`.
- Se rechazan consulta y hash.
- Se permite el origen más una ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Refuerzo del visor">
    - Solo loopback de forma predeterminada.
    - Rutas del visor con tokens y validación estricta de ID y token.
    - CSP de respuesta del visor:
      - `default-src 'none'`
      - scripts y recursos solo desde self
      - sin `connect-src` saliente
    - Limitación de fallos remotos cuando el acceso remoto está habilitado:
      - 40 fallos por cada 60 segundos
      - bloqueo de 60 segundos (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Refuerzo de renderizado de archivos">
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

Texto común de error:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrígelo instalando Chrome, Chromium, Edge o Brave, o configurando una de las opciones de ruta del ejecutable anteriores.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores de validación de entrada">
    - `Provide patch or both before and after text.` — incluye tanto `before` como `after`, o proporciona `patch`.
    - `Provide either patch or before/after input, not both.` — no mezcles modos de entrada.
    - `Invalid baseUrl: ...` — usa un origen `http(s)` con ruta opcional, sin consulta/hash.
    - `{field} exceeds maximum size (...)` — reduce el tamaño de la carga útil.
    - Rechazo de parche grande — reduce la cantidad de archivos del parche o el total de líneas.

  </Accordion>
  <Accordion title="Accesibilidad del visor">
    - La URL del visor se resuelve a `127.0.0.1` de forma predeterminada.
    - Para escenarios de acceso remoto, puedes:
      - establecer `viewerBaseUrl` del Plugin, o
      - pasar `baseUrl` por llamada de herramienta, o
      - usar `gateway.bind=custom` y `gateway.customBindHost`
    - Si `gateway.trustedProxies` incluye loopback para un proxy en el mismo host (por ejemplo Tailscale Serve), las solicitudes sin procesar al visor por loopback sin encabezados de IP de cliente reenviados fallan cerradas por diseño.
    - Para esa topología de proxy:
      - prefiere `mode: "file"` o `mode: "both"` cuando solo necesitas un adjunto, o
      - habilita intencionalmente `security.allowRemoteViewer` y establece `viewerBaseUrl` del Plugin o pasa un `baseUrl` de proxy/público cuando necesites una URL de visor compartible
    - Habilita `security.allowRemoteViewer` solo cuando tengas intención de permitir acceso externo al visor.

  </Accordion>
  <Accordion title="La fila de líneas sin modificar no tiene botón de expansión">
    Esto puede ocurrir con la entrada de parche cuando el parche no contiene contexto expandible. Es esperado y no indica un fallo del visor.
  </Accordion>
  <Accordion title="Artefacto no encontrado">
    - El artefacto expiró debido al TTL.
    - El token o la ruta cambió.
    - La limpieza eliminó datos obsoletos.

  </Accordion>
</AccordionGroup>

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en canvas.
- Prefiere `mode: "file"` para canales de chat salientes que necesitan un adjunto.
- Mantén `allowRemoteViewer` deshabilitado salvo que tu despliegue requiera URL de visor remoto.
- Establece `ttlSeconds` cortos explícitos para diffs sensibles.
- Evita enviar secretos en la entrada de diff cuando no sea necesario.
- Si tu canal comprime imágenes de forma agresiva (por ejemplo Telegram o WhatsApp), prefiere la salida PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderizado de diff impulsado por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Navegador](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Resumen de herramientas](/es/tools)
