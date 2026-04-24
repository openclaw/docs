---
read_when:
    - Quieres que los agentes muestren ediciones de código o Markdown como diferencias
    - Quieres una URL lista para Canvas o un archivo de diferencias renderizado
    - Necesitas artefactos temporales de diferencias controlados con valores predeterminados seguros
summary: Visor de diferencias de solo lectura y renderizador de archivos para agentes (herramienta opcional de Plugin)
title: Diferencias
x-i18n:
    generated_at: "2026-04-24T05:53:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` es una herramienta opcional de Plugin con una breve guía integrada en el sistema y una Skill complementaria que convierte el contenido de cambios en un artefacto de diferencias de solo lectura para agentes.

Acepta cualquiera de estas opciones:

- texto `before` y `after`
- un `patch` unificado

Puede devolver:

- una URL de visor de gateway para presentación en Canvas
- una ruta de archivo renderizado (PNG o PDF) para entrega por mensaje
- ambas salidas en una sola llamada

Cuando está habilitado, el Plugin antepone una guía de uso concisa en el espacio del prompt del sistema y también expone una Skill detallada para los casos en que el agente necesita instrucciones más completas.

## Inicio rápido

1. Habilita el Plugin.
2. Llama a `diffs` con `mode: "view"` para flujos centrados primero en Canvas.
3. Llama a `diffs` con `mode: "file"` para flujos de entrega de archivos por chat.
4. Llama a `diffs` con `mode: "both"` cuando necesites ambos artefactos.

## Habilitar el Plugin

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

## Desactivar la guía integrada del sistema

Si quieres mantener la herramienta `diffs` habilitada pero desactivar su guía integrada en el prompt del sistema, establece `plugins.entries.diffs.hooks.allowPromptInjection` en `false`:

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

Esto bloquea el hook `before_prompt_build` del Plugin diffs mientras mantiene disponibles el Plugin, la herramienta y la Skill complementaria.

Si quieres desactivar tanto la guía como la herramienta, desactiva el Plugin.

## Flujo de trabajo típico del agente

1. El agente llama a `diffs`.
2. El agente lee los campos de `details`.
3. El agente:
   - abre `details.viewerUrl` con `canvas present`
   - envía `details.filePath` con `message` usando `path` o `filePath`
   - o hace ambas cosas

## Ejemplos de entrada

Antes y después:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referencia de entrada de la herramienta

Todos los campos son opcionales salvo que se indique lo contrario:

- `before` (`string`): texto original. Obligatorio junto con `after` cuando se omite `patch`.
- `after` (`string`): texto actualizado. Obligatorio junto con `before` cuando se omite `patch`.
- `patch` (`string`): texto de diff unificado. Mutuamente excluyente con `before` y `after`.
- `path` (`string`): nombre de archivo mostrado para el modo antes y después.
- `lang` (`string`): pista de anulación de lenguaje para el modo antes y después. Los valores desconocidos vuelven a texto plano.
- `title` (`string`): anulación del título del visor.
- `mode` (`"view" | "file" | "both"`): modo de salida. Usa por defecto el valor predeterminado del Plugin `defaults.mode`.
  Alias obsoleto: `"image"` se comporta como `"file"` y sigue aceptándose por compatibilidad hacia atrás.
- `theme` (`"light" | "dark"`): tema del visor. Usa por defecto el valor predeterminado del Plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): diseño de diferencias. Usa por defecto el valor predeterminado del Plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): expande las secciones sin cambios cuando hay contexto completo disponible. Opción solo por llamada (no es una clave predeterminada del Plugin).
- `fileFormat` (`"png" | "pdf"`): formato de archivo renderizado. Usa por defecto el valor predeterminado del Plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): ajuste de calidad para renderizado PNG o PDF.
- `fileScale` (`number`): anulación de escala del dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): anchura máxima de renderizado en píxeles CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL del artefacto en segundos para el visor y las salidas de archivo independientes. Predeterminado 1800, máximo 21600.
- `baseUrl` (`string`): anulación del origen de la URL del visor. Anula el `viewerBaseUrl` del Plugin. Debe ser `http` o `https`, sin query/hash.

Los alias heredados de entrada siguen aceptándose por compatibilidad hacia atrás:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validación y límites:

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

## Contrato de detalles de salida

La herramienta devuelve metadatos estructurados bajo `details`.

Campos compartidos para modos que crean un visor:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` cuando está disponible)

Campos de archivo cuando se renderiza PNG o PDF:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (mismo valor que `filePath`, para compatibilidad con la herramienta message)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

También se devuelven alias de compatibilidad para llamadas existentes:

- `format` (mismo valor que `fileFormat`)
- `imagePath` (mismo valor que `filePath`)
- `imageBytes` (mismo valor que `fileBytes`)
- `imageQuality` (mismo valor que `fileQuality`)
- `imageScale` (mismo valor que `fileScale`)
- `imageMaxWidth` (mismo valor que `fileMaxWidth`)

Resumen del comportamiento por modo:

- `mode: "view"`: solo campos de visor.
- `mode: "file"`: solo campos de archivo, sin artefacto de visor.
- `mode: "both"`: campos de visor más campos de archivo. Si falla el renderizado del archivo, el visor sigue devolviéndose con `fileError` y el alias de compatibilidad `imageError`.

## Secciones sin cambios contraídas

- El visor puede mostrar filas como `N unmodified lines`.
- Los controles de expansión en esas filas son condicionales y no están garantizados para todos los tipos de entrada.
- Los controles de expansión aparecen cuando la diferencia renderizada tiene datos de contexto expandibles, lo cual es típico en entradas de antes y después.
- En muchos inputs de patch unificado, los cuerpos de contexto omitidos no están disponibles en los hunks analizados del patch, por lo que la fila puede aparecer sin controles de expansión. Este es el comportamiento esperado.
- `expandUnchanged` solo se aplica cuando existe contexto expandible.

## Valores predeterminados del Plugin

Establece valores predeterminados globales del Plugin en `~/.openclaw/openclaw.json`:

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

Los parámetros explícitos de la herramienta anulan estos valores predeterminados.

Configuración persistente de URL del visor:

- `viewerBaseUrl` (`string`, opcional)
  - Respaldo propiedad del Plugin para los enlaces del visor devueltos cuando una llamada de herramienta no pasa `baseUrl`.
  - Debe ser `http` o `https`, sin query/hash.

Ejemplo:

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

- `security.allowRemoteViewer` (`boolean`, predeterminado `false`)
  - `false`: se deniegan las solicitudes que no sean de loopback a las rutas del visor.
  - `true`: se permiten visores remotos si la ruta tokenizada es válida.

Ejemplo:

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
  - ID aleatorio de artefacto (20 caracteres hexadecimales)
  - token aleatorio (48 caracteres hexadecimales)
  - `createdAt` y `expiresAt`
  - ruta almacenada de `viewer.html`
- El TTL predeterminado del artefacto es de 30 minutos cuando no se especifica.
- El TTL máximo aceptado para el visor es de 6 horas.
- La limpieza se ejecuta de forma oportunista después de la creación del artefacto.
- Los artefactos caducados se eliminan.
- La limpieza de respaldo elimina carpetas obsoletas de más de 24 horas cuando faltan los metadatos.

## URL del visor y comportamiento de red

Ruta del visor:

- `/plugins/diffs/view/{artifactId}/{token}`

Activos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

El documento del visor resuelve esos activos relativos a la URL del visor, por lo que un prefijo de ruta opcional de `baseUrl` también se conserva para esas solicitudes de activos.

Comportamiento de construcción de URL:

- Si se proporciona `baseUrl` en la llamada de herramienta, se usa tras una validación estricta.
- En caso contrario, si está configurado `viewerBaseUrl` del Plugin, se usa ese.
- Sin ninguna de estas anulaciones, la URL del visor usa por defecto loopback `127.0.0.1`.
- Si el modo de bind de gateway es `custom` y `gateway.customBindHost` está establecido, se usa ese host.

Reglas de `baseUrl`:

- Debe ser `http://` o `https://`.
- Query y hash se rechazan.
- Se permite el origen más una ruta base opcional.

## Modelo de seguridad

Endurecimiento del visor:

- Solo loopback de forma predeterminada.
- Rutas de visor tokenizadas con validación estricta de ID y token.
- CSP de respuesta del visor:
  - `default-src 'none'`
  - scripts y activos solo desde self
  - sin `connect-src` saliente
- Limitación de fallos remotos cuando el acceso remoto está habilitado:
  - 40 fallos por 60 segundos
  - bloqueo de 60 segundos (`429 Too Many Requests`)

Endurecimiento del renderizado de archivos:

- El enrutamiento de solicitudes del navegador para capturas de pantalla usa denegación por defecto.
- Solo se permiten activos locales del visor desde `http://127.0.0.1/plugins/diffs/assets/*`.
- Las solicitudes de red externas están bloqueadas.

## Requisitos del navegador para el modo archivo

`mode: "file"` y `mode: "both"` necesitan un navegador compatible con Chromium.

Orden de resolución:

1. `browser.executablePath` en la configuración de OpenClaw.
2. Variables de entorno:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Respaldo de descubrimiento de comando/ruta de la plataforma.

Texto de fallo habitual:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrígelo instalando Chrome, Chromium, Edge o Brave, o estableciendo una de las opciones de ruta al ejecutable anteriores.

## Solución de problemas

Errores de validación de entrada:

- `Provide patch or both before and after text.`
  - Incluye tanto `before` como `after`, o proporciona `patch`.
- `Provide either patch or before/after input, not both.`
  - No mezcles modos de entrada.
- `Invalid baseUrl: ...`
  - Usa un origen `http(s)` con ruta opcional, sin query/hash.
- `{field} exceeds maximum size (...)`
  - Reduce el tamaño de la carga útil.
- Rechazo de patch grande
  - Reduce el número de archivos del patch o el total de líneas.

Problemas de accesibilidad del visor:

- La URL del visor se resuelve a `127.0.0.1` de forma predeterminada.
- Para escenarios de acceso remoto:
  - establece `viewerBaseUrl` del Plugin, o
  - pasa `baseUrl` por llamada de herramienta, o
  - usa `gateway.bind=custom` y `gateway.customBindHost`
- Si `gateway.trustedProxies` incluye loopback para un proxy del mismo host (por ejemplo Tailscale Serve), las solicitudes sin procesar al visor por loopback sin encabezados reenviados de IP del cliente fallan en modo cerrado por diseño.
- Para esa topología de proxy:
  - prefiere `mode: "file"` o `mode: "both"` cuando solo necesites un adjunto, o
  - habilita intencionalmente `security.allowRemoteViewer` y establece `viewerBaseUrl` del Plugin o pasa un `baseUrl` de proxy/público cuando necesites una URL de visor compartible
- Habilita `security.allowRemoteViewer` solo cuando pretendas acceso externo al visor.

La fila de líneas sin modificar no tiene botón de expansión:

- Esto puede ocurrir con entrada de patch cuando el patch no incluye contexto expandible.
- Este es el comportamiento esperado y no indica un fallo del visor.

Artefacto no encontrado:

- El artefacto caducó por TTL.
- El token o la ruta cambiaron.
- La limpieza eliminó datos obsoletos.

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en Canvas.
- Prefiere `mode: "file"` para canales de chat salientes que necesitan un adjunto.
- Mantén `allowRemoteViewer` deshabilitado a menos que tu despliegue requiera URL remotas del visor.
- Establece `ttlSeconds` cortos y explícitos para diferencias sensibles.
- Evita enviar secretos en la entrada de diferencias cuando no sea necesario.
- Si tu canal comprime imágenes de forma agresiva (por ejemplo Telegram o WhatsApp), prefiere salida PDF (`fileFormat: "pdf"`).

Motor de renderizado de diferencias:

- Impulsado por [Diffs](https://diffs.com).

## Documentación relacionada

- [Resumen de herramientas](/es/tools)
- [Plugins](/es/tools/plugin)
- [Navegador](/es/tools/browser)
