---
read_when:
    - Quieres que los agentes muestren las ediciones de código o Markdown como diferencias
    - Quieres una URL de visor lista para el lienzo o un archivo de diferencias renderizado
    - Necesitas artefactos diff controlados y temporales con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diff y renderizador de archivos de solo lectura para agentes (herramienta de Plugin opcional)
title: Diferencias
x-i18n:
    generated_at: "2026-07-06T10:55:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d1f6c02d1b6c0d34f65c9ec195692b992dee69fcce932ee67e408331f275317
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` es una herramienta opcional de plugin incluido que convierte texto de antes/después o un parche unificado en un artefacto de diff de solo lectura. También antepone una breve guía para agentes al prompt del sistema e incluye una skill complementaria para instrucciones más completas.

Entrada: texto `before` + `after`, o un `patch` unificado (mutuamente excluyentes).

Salida: una URL del visor del Gateway para presentación en canvas, una ruta de archivo PNG/PDF renderizado para entrega por mensaje, o ambas.

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
        Flujos con canvas primero: los agentes llaman a `diffs` con `mode: "view"` y abren `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de archivos por chat: los agentes llaman a `diffs` con `mode: "file"` y envían `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinado (predeterminado): los agentes llaman a `diffs` con `mode: "both"` para obtener ambos artefactos en una sola llamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Desactivar la guía integrada del sistema

Para conservar la herramienta pero quitar la guía antepuesta del prompt del sistema, define `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

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

Esto bloquea el hook `before_prompt_build` del plugin y mantiene disponibles la herramienta y la skill. Para desactivar tanto la guía como la herramienta, desactiva el plugin en su lugar.

## Referencia de entrada de la herramienta

Todos los campos son opcionales salvo que se indique lo contrario.

<ParamField path="before" type="string">
  Texto original. Obligatorio con `after` cuando se omite `patch`.
</ParamField>
<ParamField path="after" type="string">
  Texto actualizado. Obligatorio con `before` cuando se omite `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diff unificado. Mutuamente excluyente con `before` y `after`.
</ParamField>
<ParamField path="path" type="string">
  Nombre de archivo mostrado para el modo antes/después.
</ParamField>
<ParamField path="lang" type="string">
  Sugerencia de anulación de idioma para el modo antes/después. Los valores desconocidos y los idiomas fuera del conjunto predeterminado del visor usan texto sin formato como alternativa, salvo que el plugin Diff Viewer Language Pack esté instalado.
</ParamField>
<ParamField path="title" type="string">
  Anulación del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. Usa de forma predeterminada el valor predeterminado del plugin `defaults.mode` (`both`). Alias obsoleto: `"image"` se comporta de forma idéntica a `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. Usa de forma predeterminada el valor predeterminado del plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diseño del diff. Usa de forma predeterminada el valor predeterminado del plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande las secciones sin cambios cuando el contexto completo está disponible. Opción solo por llamada (no es una clave predeterminada del plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del archivo renderizado. Usa de forma predeterminada el valor predeterminado del plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preajuste de calidad para el renderizado PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Anulación de escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Ancho máximo de renderizado en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para las salidas del visor y de archivo independiente. Máximo `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Anulación del origen de la URL del visor. Anula `viewerBaseUrl` del plugin. Debe ser `http` o `https`, sin consulta ni hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Se siguen aceptando por compatibilidad hacia atrás:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before`/`after`: máximo 512 KiB cada uno.
    - `patch`: máximo 2 MiB.
    - `path`: máximo 2048 bytes.
    - `lang`: máximo 128 bytes.
    - `title`: máximo 1024 bytes.
    - Límite de complejidad del parche: máximo 128 archivos y 120000 líneas totales.
    - Se rechaza `patch` junto con `before`/`after`.
    - Límites de seguridad de archivos renderizados (PNG y PDF):
      - `fileQuality: "standard"`: máximo 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo 14 MP.
      - `fileQuality: "print"`: máximo 24 MP.
      - PDF también limita a 50 páginas.

  </Accordion>
</AccordionGroup>

## Resaltado de sintaxis

Idiomas integrados:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` y `toml`.

Los alias comunes (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, etc.) se normalizan a esos idiomas.

Instala el plugin Diff Viewer Language Pack para más idiomas (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff y más):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Sin el paquete, los idiomas no compatibles siguen renderizándose como texto sin formato legible. Consulta el [plugin Diffs Language Pack](/es/plugins/reference/diffs-language-pack) y los [idiomas de Shiki](https://shiki.style/languages) para ver el catálogo upstream.

## Contrato de detalles de salida

Todos los resultados correctos incluyen `changed`: una entrada antes/después idéntica devuelve `false` sin crear un artefacto; los resultados renderizados devuelven `true`.

<AccordionGroup>
  <Accordion title="Viewer fields (view and both modes)">
    - `changed`
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
  <Accordion title="File fields (file and both modes)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (mismo valor que `filePath`, por compatibilidad con la herramienta de mensajes)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases (always returned)">
    - `format` (= `fileFormat`)
    - `imagePath` (= `filePath`)
    - `imageBytes` (= `fileBytes`)
    - `imageQuality` (= `fileQuality`)
    - `imageScale` (= `fileScale`)
    - `imageMaxWidth` (= `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

| Modo     | Devuelve                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | Solo campos del visor.                                                                                          |
| `"file"` | Solo campos de archivo, sin artefacto del visor.                                                                        |
| `"both"` | Campos del visor más campos de archivo. Si la renderización del archivo falla, el visor aun así devuelve con `fileError`/`imageError`. |

### Secciones contraídas sin cambios

El visor muestra filas como `N unmodified lines`. Los controles de expansión solo aparecen cuando el diff renderizado tiene datos de contexto expandibles (típico en entradas de antes/después). Muchos parches unificados omiten los cuerpos de contexto en sus hunks, por lo que la fila puede aparecer sin un control de expansión: es lo esperado, no un error. `expandUnchanged` solo se aplica cuando existe contexto expandible.

## Valores predeterminados del Plugin

Define valores predeterminados para todo el plugin en `~/.openclaw/openclaw.json`:

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

Claves `defaults` admitidas: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Los parámetros explícitos de llamada a la herramienta anulan estos valores.

### Configuración de URL persistente del visor

<ParamField path="viewerBaseUrl" type="string">
  Respaldo propiedad del Plugin para los enlaces del visor devueltos cuando una llamada de herramienta no pasa `baseUrl`. Debe ser `http` o `https`, sin consulta/hash.
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
  `false`: se deniegan las solicitudes que no son loopback a las rutas del visor. `true`: se permiten visores remotos si la ruta con token es válida.
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

- Los artefactos viven bajo `$TMPDIR/openclaw-diffs`.
- Los metadatos del visor almacenan un ID de artefacto aleatorio de 20 caracteres hexadecimales, un token aleatorio de 48 caracteres hexadecimales, `createdAt`/`expiresAt` y la ruta almacenada de `viewer.html`.
- TTL predeterminado de artefactos: 30 minutos. TTL máximo aceptado: 6 horas.
- La limpieza se ejecuta de forma oportunista después de cada llamada de creación de artefacto; los artefactos vencidos se eliminan.
- El barrido de respaldo elimina carpetas obsoletas con más de 24 horas cuando faltan los metadatos.

## URL del visor y comportamiento de red

Ruta del visor: `/plugins/diffs/view/{artifactId}/{token}`

Recursos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (solo cuando el diff usa un idioma de paquete de idioma)

El documento del visor resuelve estos recursos en relación con la URL del visor, por lo que un prefijo de ruta `baseUrl` opcional también se traslada a las solicitudes de recursos.

Orden de resolución de URL: `baseUrl` de llamada de herramienta (después de una validación estricta) -> `viewerBaseUrl` del plugin -> valor predeterminado loopback `127.0.0.1`. Si el modo de enlace del Gateway es `custom` y `gateway.customBindHost` está definido, se usa ese host en lugar de loopback.

Reglas de `baseUrl`: debe ser `http://` o `https://`; se rechazan la consulta y el hash; se permite el origen más una ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Viewer hardening">
    - Solo loopback de forma predeterminada.
    - Rutas de visor con token y validación estricta de patrones de ID y token.
    - CSP de respuesta del visor: `default-src 'none'`; scripts/recursos solo desde self; sin `connect-src` saliente.
    - Limitación de fallos remotos cuando el acceso remoto está habilitado: 40 fallos por 60 segundos activan un bloqueo de 60 segundos (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="File rendering hardening">
    - El enrutamiento de solicitudes del navegador de capturas de pantalla deniega de forma predeterminada.
    - Solo se permiten recursos locales del visor desde `http://127.0.0.1/plugins/diffs/assets/*`.
    - Las solicitudes de red externas están bloqueadas.

  </Accordion>
</AccordionGroup>

## Requisitos del navegador para el modo de archivo

`mode: "file"` y `mode: "both"` necesitan un navegador compatible con Chromium.

Orden de resolución:

<Steps>
  <Step title="Config">
    `browser.executablePath` en la configuración de OpenClaw.
  </Step>
  <Step title="Environment variables">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform fallback">
    Rutas de instalación comunes y búsquedas en `PATH` para Chrome, Chromium, Edge y Brave.
  </Step>
</Steps>

Texto común de error: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Corrígelo instalando Chrome, Chromium, Edge o Brave, o configurando una de las opciones de ruta del ejecutable anteriores.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Input validation errors">
    - `Provide patch or both before and after text.` -- incluye tanto `before` como `after`, o proporciona `patch`.
    - `Provide either patch or before/after input, not both.` -- no mezcles modos de entrada.
    - `Invalid baseUrl: ...` -- usa un origen `http(s)` con una ruta opcional, sin consulta/hash.
    - `{field} exceeds maximum size (...)` -- reduce el tamaño de la carga útil.
    - Rechazo de parches grandes -- reduce la cantidad de archivos del parche o el total de líneas.

  </Accordion>
  <Accordion title="Viewer accessibility">
    - La URL del visor se resuelve como `127.0.0.1` de forma predeterminada.
    - Para acceso remoto, configura `viewerBaseUrl` del Plugin, pasa `baseUrl` en cada llamada o usa `gateway.bind=custom` con `gateway.customBindHost`.
    - Si `gateway.trustedProxies` incluye loopback para un proxy en el mismo host (por ejemplo Tailscale Serve), las solicitudes sin procesar al visor por loopback sin encabezados de IP de cliente reenviados fallan de forma cerrada por diseño.
    - Para esa topología de proxy, prefiere `mode: "file"`/`"both"` para un adjunto, o habilita intencionalmente `security.allowRemoteViewer` junto con `viewerBaseUrl` del Plugin/un `baseUrl` de proxy para un enlace de visor compartible.
    - Habilita `security.allowRemoteViewer` solo cuando se pretenda acceso externo al visor.

  </Accordion>
  <Accordion title="Unmodified-lines row has no expand button">
    Es esperado para entradas de parche que no tienen contexto expandible; no es un fallo del visor.
  </Accordion>
  <Accordion title="Artifact not found">
    - El artefacto caducó por TTL.
    - El token o la ruta cambiaron.
    - La limpieza eliminó datos obsoletos.

  </Accordion>
</AccordionGroup>

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en canvas.
- Prefiere `mode: "file"` para canales de chat salientes que necesitan un adjunto.
- Mantén `allowRemoteViewer` deshabilitado salvo que tu despliegue requiera URLs remotas del visor.
- Configura un `ttlSeconds` corto explícito para diffs sensibles.
- Evita enviar secretos en la entrada de diff cuando no sea necesario.
- Si tu canal comprime imágenes de forma agresiva (por ejemplo Telegram o WhatsApp), prefiere la salida PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderizado de diffs impulsado por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Navegador](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Resumen de herramientas](/es/tools)
