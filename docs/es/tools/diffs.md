---
read_when:
    - Quieres que los agentes muestren las ediciones de código o Markdown como diffs
    - Quieres una URL de visor lista para Canvas o un archivo de diff renderizado
    - Necesitas artefactos diff temporales y controlados con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diferencias de solo lectura y renderizador de archivos para agentes (herramienta Plugin opcional)
title: Diferencias
x-i18n:
    generated_at: "2026-07-05T11:46:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a141f52de686717e7e67a50c2ce7cc83a16a17a9ff9faf7aaedaca1c433987a9
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` es una herramienta opcional de Plugin incluido que convierte texto antes/después o un parche unificado en un artefacto diff de solo lectura. También antepone una breve guía para agentes al prompt del sistema e incluye una Skill complementaria para instrucciones más completas.

Entrada: texto `before` + `after`, o un `patch` unificado (mutuamente excluyentes).

Salida: una URL del visor de Gateway para presentación en lienzo, una ruta de archivo PNG/PDF renderizado para entrega por mensaje, o ambas.

## Inicio rápido

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        Flujos centrados en lienzo: los agentes llaman a `diffs` con `mode: "view"` y abren `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de archivo por chat: los agentes llaman a `diffs` con `mode: "file"` y envían `details.filePath` con `message` usando `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinado (predeterminado): los agentes llaman a `diffs` con `mode: "both"` para obtener ambos artefactos en una sola llamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Deshabilitar la guía integrada del sistema

Para conservar la herramienta pero quitar la guía antepuesta al prompt del sistema, define `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

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

Esto bloquea el hook `before_prompt_build` del Plugin mientras mantiene disponibles la herramienta y la Skill. Para deshabilitar tanto la guía como la herramienta, deshabilita el Plugin en su lugar.

## Referencia de entrada de la herramienta

Todos los campos son opcionales salvo que se indique lo contrario.

<ParamField path="before" type="string">
  Texto original. Requerido con `after` cuando se omite `patch`.
</ParamField>
<ParamField path="after" type="string">
  Texto actualizado. Requerido con `before` cuando se omite `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diff unificado. Mutuamente excluyente con `before` y `after`.
</ParamField>
<ParamField path="path" type="string">
  Nombre de archivo para mostrar en modo antes/después.
</ParamField>
<ParamField path="lang" type="string">
  Indicación de anulación de idioma para el modo antes/después. Los valores desconocidos y los idiomas fuera del conjunto predeterminado del visor vuelven a texto sin formato salvo que esté instalado el Plugin Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Anulación del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. Usa como valor predeterminado el valor predeterminado del Plugin `defaults.mode` (`both`). Alias obsoleto: `"image"` se comporta de forma idéntica a `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. Usa como valor predeterminado el valor predeterminado del Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Disposición del diff. Usa como valor predeterminado el valor predeterminado del Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expandir secciones sin cambios cuando el contexto completo esté disponible. Opción solo por llamada (no es una clave predeterminada del Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato de archivo renderizado. Usa como valor predeterminado el valor predeterminado del Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preajuste de calidad para renderizado PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Anulación de escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Ancho máximo de renderizado en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para salidas de visor y archivo independiente. Máximo `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Anulación del origen de URL del visor. Anula `viewerBaseUrl` del Plugin. Debe ser `http` o `https`, sin consulta/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias de entrada heredados">
    Todavía se aceptan por compatibilidad hacia atrás:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validación y límites">
    - `before`/`after`: máximo 512 KiB cada uno.
    - `patch`: máximo 2 MiB.
    - `path`: máximo 2048 bytes.
    - `lang`: máximo 128 bytes.
    - `title`: máximo 1024 bytes.
    - Límite de complejidad de parche: máximo 128 archivos y 120000 líneas en total.
    - `patch` junto con `before`/`after` se rechaza.
    - Límites de seguridad de archivos renderizados (PNG y PDF):
      - `fileQuality: "standard"`: máximo 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo 14 MP.
      - `fileQuality: "print"`: máximo 24 MP.
      - PDF también tiene un límite de 50 páginas.

  </Accordion>
</AccordionGroup>

## Resaltado de sintaxis

Idiomas integrados:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` y `toml`.

Los alias comunes (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, etc.) se normalizan a esos idiomas.

Instala el Plugin Diff Viewer Language Pack para más idiomas (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff y más):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Sin el paquete, los idiomas no compatibles aún se renderizan como texto sin formato legible. Consulta [Plugin Diffs Language Pack](/es/plugins/reference/diffs-language-pack) y [idiomas de Shiki](https://shiki.style/languages) para ver el catálogo upstream.

## Contrato de detalles de salida

<AccordionGroup>
  <Accordion title="Campos del visor (modos view y both)">
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
  <Accordion title="Campos de archivo (modos file y both)">
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
  <Accordion title="Alias de compatibilidad (siempre devueltos)">
    - `format` (= `fileFormat`)
    - `imagePath` (= `filePath`)
    - `imageBytes` (= `fileBytes`)
    - `imageQuality` (= `fileQuality`)
    - `imageScale` (= `fileScale`)
    - `imageMaxWidth` (= `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

| Modo     | Devuelve                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | Solo campos del visor.                                                                                       |
| `"file"` | Solo campos de archivo, sin artefacto de visor.                                                              |
| `"both"` | Campos del visor más campos de archivo. Si falla la renderización del archivo, el visor se devuelve igualmente con `fileError`/`imageError`. |

### Secciones sin cambios contraídas

El visor muestra filas como `N unmodified lines`. Los controles para expandir solo aparecen cuando el diff renderizado tiene datos de contexto expandibles (típico en entradas de antes/después). Muchos parches unificados omiten cuerpos de contexto en sus hunks, por lo que la fila puede aparecer sin un control de expansión: es lo esperado, no un error. `expandUnchanged` solo se aplica cuando existe contexto expandible.

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

Claves `defaults` admitidas: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Los parámetros explícitos de llamada a herramienta tienen prioridad sobre estos.

### Configuración de URL persistente del visor

<ParamField path="viewerBaseUrl" type="string">
  Alternativa propiedad del Plugin para enlaces de visor devueltos cuando una llamada a herramienta no pasa `baseUrl`. Debe ser `http` o `https`, sin consulta ni hash.
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
  `false`: se deniegan las solicitudes que no sean local loopback a rutas del visor. `true`: se permiten visores remotos si la ruta con token es válida.
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

- Los artefactos se ubican en `$TMPDIR/openclaw-diffs`.
- Los metadatos del visor almacenan un ID de artefacto aleatorio de 20 caracteres hexadecimales, un token aleatorio de 48 caracteres hexadecimales, `createdAt`/`expiresAt` y la ruta almacenada de `viewer.html`.
- TTL predeterminado de artefactos: 30 minutos. TTL máximo aceptado: 6 horas.
- La limpieza se ejecuta de forma oportunista después de cada llamada de creación de artefacto; los artefactos caducados se eliminan.
- El barrido de respaldo elimina carpetas obsoletas con más de 24 horas cuando faltan metadatos.

## URL del visor y comportamiento de red

Ruta del visor: `/plugins/diffs/view/{artifactId}/{token}`

Recursos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (solo cuando el diff usa un idioma de paquete de idioma)

El documento del visor resuelve estos recursos en relación con la URL del visor, por lo que un prefijo de ruta `baseUrl` opcional también se propaga a las solicitudes de recursos.

Orden de resolución de URL: `baseUrl` de llamada a herramienta (tras validación estricta) -> `viewerBaseUrl` del Plugin -> valor predeterminado de local loopback `127.0.0.1`. Si el modo de vinculación del Gateway es `custom` y `gateway.customBindHost` está definido, se usa ese host en lugar de local loopback.

Reglas de `baseUrl`: debe ser `http://` o `https://`; se rechazan la consulta y el hash; se permite el origen más una ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Endurecimiento del visor">
    - Solo local loopback de forma predeterminada.
    - Rutas de visor con token y validación estricta de patrones de ID y token.
    - CSP de respuesta del visor: `default-src 'none'`; scripts/recursos solo del mismo origen; sin `connect-src` saliente.
    - Limitación de fallos remotos cuando el acceso remoto está habilitado: 40 fallos por 60 segundos activan un bloqueo de 60 segundos (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Endurecimiento de la renderización de archivos">
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
  <Step title="Recurso alternativo de plataforma">
    Rutas de instalación comunes y búsquedas en `PATH` para Chrome, Chromium, Edge y Brave.
  </Step>
</Steps>

Texto de error común: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Corrígelo instalando Chrome, Chromium, Edge o Brave, o configurando una de las opciones de ruta de ejecutable anteriores.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores de validación de entrada">
    - `Provide patch or both before and after text.` -- incluye tanto `before` como `after`, o proporciona `patch`.
    - `Provide either patch or before/after input, not both.` -- no mezcles modos de entrada.
    - `Invalid baseUrl: ...` -- usa un origen `http(s)` con una ruta opcional, sin consulta ni hash.
    - `{field} exceeds maximum size (...)` -- reduce el tamaño de la carga útil.
    - Rechazo de parches grandes -- reduce la cantidad de archivos de parche o el total de líneas.

  </Accordion>
  <Accordion title="Accesibilidad del visor">
    - La URL del visor se resuelve a `127.0.0.1` de forma predeterminada.
    - Para acceso remoto, configura `viewerBaseUrl` del plugin, pasa `baseUrl` por llamada o usa `gateway.bind=custom` con `gateway.customBindHost`.
    - Si `gateway.trustedProxies` incluye loopback para un proxy del mismo host (por ejemplo, Tailscale Serve), las solicitudes sin procesar al visor por loopback sin encabezados de IP de cliente reenviados fallan en modo cerrado por diseño.
    - Para esa topología de proxy, prefiere `mode: "file"`/`"both"` para un adjunto, o habilita intencionalmente `security.allowRemoteViewer` más `viewerBaseUrl` del plugin/una `baseUrl` de proxy para un enlace de visor compartible.
    - Habilita `security.allowRemoteViewer` solo cuando se pretenda el acceso externo al visor.

  </Accordion>
  <Accordion title="La fila de líneas sin modificar no tiene botón de expansión">
    Es lo esperado para una entrada de parche que carece de contexto expandible; no es un fallo del visor.
  </Accordion>
  <Accordion title="Artefacto no encontrado">
    - El artefacto expiró debido al TTL.
    - El token o la ruta cambiaron.
    - La limpieza eliminó datos obsoletos.

  </Accordion>
</AccordionGroup>

## Guía operativa

- Prefiere `mode: "view"` para revisiones interactivas locales en el lienzo.
- Prefiere `mode: "file"` para canales de chat salientes que necesitan un adjunto.
- Mantén `allowRemoteViewer` deshabilitado a menos que tu despliegue requiera URL de visor remoto.
- Configura un `ttlSeconds` corto explícito para diffs sensibles.
- Evita enviar secretos en la entrada del diff cuando no sea necesario.
- Si tu canal comprime imágenes de forma agresiva (por ejemplo, Telegram o WhatsApp), prefiere la salida PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderizado de diff impulsado por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Navegador](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Resumen de herramientas](/es/tools)
