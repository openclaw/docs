---
read_when:
    - Quieres que los agentes muestren ediciones de código o Markdown como diferencias
    - Quieres una URL de visor lista para canvas o un archivo de diferencias renderizado
    - Necesitas artefactos de diferencias temporales y controlados con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diferencias y renderizador de archivos de solo lectura para agentes (herramienta de Plugin opcional)
title: Diferencias
x-i18n:
    generated_at: "2026-04-26T11:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` es una herramienta de Plugin opcional con una guía del sistema integrada y breve, y una skill complementaria que convierte contenido de cambios en un artefacto de diferencias de solo lectura para agentes.

Acepta cualquiera de estas opciones:

- texto `before` y `after`
- un `patch` unificado

Puede devolver:

- una URL del visor del gateway para presentación en canvas
- una ruta de archivo renderizado (PNG o PDF) para entrega por mensaje
- ambas salidas en una sola llamada

Cuando está habilitado, el Plugin antepone una guía de uso concisa al espacio del prompt del sistema y también expone una skill detallada para los casos en que el agente necesita instrucciones más completas.

## Inicio rápido

<Steps>
  <Step title="Habilitar el Plugin">
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
        Flujos orientados a canvas: los agentes llaman a `diffs` con `mode: "view"` y abren `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de archivos en el chat: los agentes llaman a `diffs` con `mode: "file"` y envían `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinado: los agentes llaman a `diffs` con `mode: "both"` para obtener ambos artefactos en una sola llamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Deshabilitar la guía integrada del sistema

Si quieres mantener habilitada la herramienta `diffs` pero deshabilitar su guía integrada en el prompt del sistema, establece `plugins.entries.diffs.hooks.allowPromptInjection` en `false`:

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

Esto bloquea el hook `before_prompt_build` del Plugin diffs mientras mantiene disponibles el Plugin, la herramienta y la skill complementaria.

Si quieres deshabilitar tanto la guía como la herramienta, deshabilita el Plugin en su lugar.

## Flujo de trabajo típico del agente

<Steps>
  <Step title="Llamar a diffs">
    El agente llama a la herramienta `diffs` con la entrada.
  </Step>
  <Step title="Leer details">
    El agente lee los campos `details` de la respuesta.
  </Step>
  <Step title="Presentar">
    El agente abre `details.viewerUrl` con `canvas present`, envía `details.filePath` con `message` usando `path` o `filePath`, o hace ambas cosas.
  </Step>
</Steps>

## Ejemplos de entrada

<Tabs>
  <Tab title="Before y after">
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
  Texto original. Obligatorio junto con `after` cuando se omite `patch`.
</ParamField>
<ParamField path="after" type="string">
  Texto actualizado. Obligatorio junto con `before` cuando se omite `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diferencias unificadas. Es mutuamente excluyente con `before` y `after`.
</ParamField>
<ParamField path="path" type="string">
  Nombre de archivo de visualización para el modo before y after.
</ParamField>
<ParamField path="lang" type="string">
  Sugerencia de anulación de idioma para el modo before y after. Los valores desconocidos vuelven a texto sin formato.
</ParamField>
<ParamField path="title" type="string">
  Anulación del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. El valor predeterminado es el predeterminado del Plugin `defaults.mode`. Alias obsoleto: `"image"` se comporta como `"file"` y todavía se acepta por compatibilidad con versiones anteriores.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. El valor predeterminado es el predeterminado del Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diseño de diferencias. El valor predeterminado es el predeterminado del Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande las secciones sin cambios cuando hay contexto completo disponible. Opción solo por llamada (no es una clave predeterminada del Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del archivo renderizado. El valor predeterminado es el predeterminado del Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Ajuste preestablecido de calidad para renderizado PNG o PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Anulación de escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Ancho máximo de renderizado en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para el visor y para las salidas de archivo independientes. Máximo 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Anulación del origen de la URL del visor. Sustituye `viewerBaseUrl` del Plugin. Debe ser `http` o `https`, sin query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias heredados de entrada">
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
    - Límite de complejidad del patch: máximo 128 archivos y 120000 líneas en total.
    - Se rechaza usar `patch` junto con `before` o `after`.
    - Límites de seguridad del archivo renderizado (se aplican a PNG y PDF):
      - `fileQuality: "standard"`: máximo 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo 14 MP (14,000,000 píxeles renderizados).
      - `fileQuality: "print"`: máximo 24 MP (24,000,000 píxeles renderizados).
      - El PDF también tiene un máximo de 50 páginas.
  </Accordion>
</AccordionGroup>

## Contrato de detalles de salida

La herramienta devuelve metadatos estructurados en `details`.

<AccordionGroup>
  <Accordion title="Campos del visor">
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
  <Accordion title="Campos del archivo">
    Campos del archivo cuando se renderiza PNG o PDF:

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
    También se devuelven para los llamadores existentes:

    - `format` (mismo valor que `fileFormat`)
    - `imagePath` (mismo valor que `filePath`)
    - `imageBytes` (mismo valor que `fileBytes`)
    - `imageQuality` (mismo valor que `fileQuality`)
    - `imageScale` (mismo valor que `fileScale`)
    - `imageMaxWidth` (mismo valor que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Resumen del comportamiento por modo:

| Modo     | Qué se devuelve                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo campos del visor.                                                                                                 |
| `"file"` | Solo campos del archivo, sin artefacto de visor.                                                                       |
| `"both"` | Campos del visor más campos del archivo. Si falla el renderizado del archivo, el visor igualmente se devuelve con `fileError` y el alias `imageError`. |

## Secciones sin cambios contraídas

- El visor puede mostrar filas como `N unmodified lines`.
- Los controles de expansión en esas filas son condicionales y no están garantizados para todos los tipos de entrada.
- Los controles de expansión aparecen cuando la diferencia renderizada tiene datos de contexto expandibles, lo que es habitual para entradas before y after.
- Para muchas entradas de patch unificado, los cuerpos de contexto omitidos no están disponibles en los hunks del patch analizado, por lo que la fila puede aparecer sin controles de expansión. Este comportamiento es esperado.
- `expandUnchanged` solo se aplica cuando existe contexto expandible.

## Valores predeterminados del Plugin

Establece valores predeterminados para todo el Plugin en `~/.openclaw/openclaw.json`:

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

Valores predeterminados compatibles:

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

Los parámetros explícitos de la herramienta sustituyen estos valores predeterminados.

### Configuración persistente de URL del visor

<ParamField path="viewerBaseUrl" type="string">
  Respaldo propiedad del Plugin para los enlaces del visor devueltos cuando una llamada de herramienta no pasa `baseUrl`. Debe ser `http` o `https`, sin query/hash.
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
  `false`: se deniegan las solicitudes no loopback a rutas del visor. `true`: se permiten visores remotos si la ruta con token es válida.
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
- Los metadatos del artefacto del visor contienen:
  - ID aleatorio del artefacto (20 caracteres hexadecimales)
  - token aleatorio (48 caracteres hexadecimales)
  - `createdAt` y `expiresAt`
  - ruta almacenada de `viewer.html`
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

El documento del visor resuelve esos recursos de forma relativa a la URL del visor, por lo que también se conserva un prefijo de ruta opcional de `baseUrl` para ambas solicitudes de recursos.

Comportamiento de construcción de URL:

- Si se proporciona `baseUrl` en la llamada de la herramienta, se usa después de una validación estricta.
- En caso contrario, si el Plugin `viewerBaseUrl` está configurado, se usa.
- Sin ninguna de las dos anulaciones, la URL del visor usa por defecto loopback `127.0.0.1`.
- Si el modo de enlace del gateway es `custom` y `gateway.customBindHost` está configurado, se usa ese host.

Reglas de `baseUrl`:

- Debe ser `http://` o `https://`.
- Query y hash se rechazan.
- Se permite origen más una ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Protección reforzada del visor">
    - Solo loopback de forma predeterminada.
    - Rutas del visor con token y validación estricta de ID y token.
    - CSP de la respuesta del visor:
      - `default-src 'none'`
      - scripts y recursos solo desde self
      - sin `connect-src` saliente
    - Limitación de errores remotos cuando el acceso remoto está habilitado:
      - 40 fallos por 60 segundos
      - bloqueo de 60 segundos (`429 Too Many Requests`)
  </Accordion>
  <Accordion title="Protección reforzada del renderizado de archivos">
    - El enrutamiento de solicitudes del navegador de capturas de pantalla se deniega de forma predeterminada.
    - Solo se permiten recursos locales del visor desde `http://127.0.0.1/plugins/diffs/assets/*`.
    - Las solicitudes de red externas se bloquean.
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
    Respaldo de detección de comando/ruta de la plataforma.
  </Step>
</Steps>

Texto de error habitual:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Solución: instala Chrome, Chromium, Edge o Brave, o configura una de las opciones de ruta del ejecutable anteriores.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores de validación de entrada">
    - `Provide patch or both before and after text.` — incluye `before` y `after`, o proporciona `patch`.
    - `Provide either patch or before/after input, not both.` — no mezcles modos de entrada.
    - `Invalid baseUrl: ...` — usa un origen `http(s)` con ruta opcional, sin query/hash.
    - `{field} exceeds maximum size (...)` — reduce el tamaño de la carga.
    - Rechazo por patch grande — reduce la cantidad de archivos del patch o el total de líneas.
  </Accordion>
  <Accordion title="Accesibilidad del visor">
    - La URL del visor se resuelve a `127.0.0.1` de forma predeterminada.
    - Para escenarios de acceso remoto, haz una de estas cosas:
      - configura `viewerBaseUrl` del Plugin, o
      - pasa `baseUrl` en cada llamada de herramienta, o
      - usa `gateway.bind=custom` y `gateway.customBindHost`
    - Si `gateway.trustedProxies` incluye loopback para un proxy del mismo host (por ejemplo Tailscale Serve), las solicitudes sin procesar al visor por loopback sin encabezados de IP de cliente reenviada fallan de forma cerrada por diseño.
    - Para esa topología de proxy:
      - prefiere `mode: "file"` o `mode: "both"` cuando solo necesites un archivo adjunto, o
      - habilita intencionalmente `security.allowRemoteViewer` y configura `viewerBaseUrl` del Plugin o pasa un `baseUrl` de proxy/público cuando necesites una URL de visor compartible
    - Habilita `security.allowRemoteViewer` solo cuando quieras acceso externo al visor.
  </Accordion>
  <Accordion title="La fila de líneas sin modificar no tiene botón para expandir">
    Esto puede ocurrir con entrada de patch cuando el patch no contiene contexto expandible. Esto es un comportamiento esperado y no indica un fallo del visor.
  </Accordion>
  <Accordion title="Artefacto no encontrado">
    - El artefacto venció por TTL.
    - El token o la ruta cambiaron.
    - La limpieza eliminó datos obsoletos.
  </Accordion>
</AccordionGroup>

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en canvas.
- Prefiere `mode: "file"` para canales de chat salientes que necesiten un archivo adjunto.
- Mantén `allowRemoteViewer` deshabilitado a menos que tu implementación requiera URL remotas del visor.
- Configura un `ttlSeconds` corto y explícito para diferencias sensibles.
- Evita enviar secretos en la entrada de diferencias cuando no sea necesario.
- Si tu canal comprime imágenes de forma agresiva (por ejemplo Telegram o WhatsApp), prefiere salida PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderizado de diferencias impulsado por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Browser](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Resumen de herramientas](/es/tools)
