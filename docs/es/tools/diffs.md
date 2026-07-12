---
read_when:
    - Quieres que los agentes muestren las modificaciones de código o Markdown como diffs
    - Quieres una URL de visor lista para Canvas o un archivo de diferencias renderizado
    - Necesita artefactos de diferencias controlados y temporales con valores predeterminados seguros
sidebarTitle: Diffs
summary: Visor de diferencias de solo lectura y renderizador de archivos para agentes (herramienta opcional del plugin)
title: Diferencias
x-i18n:
    generated_at: "2026-07-12T14:53:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` es una herramienta opcional de Plugin incluido que convierte texto anterior/posterior o un parche unificado en un artefacto diff de solo lectura. También antepone una breve guía para el agente al prompt del sistema e incluye una skill complementaria con instrucciones más completas.

Entrada: texto `before` + `after`, o un `patch` unificado (mutuamente excluyentes).

Salida: una URL del visor del Gateway para presentarla en el lienzo, una ruta de archivo PNG/PDF renderizado para entregarlo mediante mensajes, o ambas.

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
        Flujos centrados en el lienzo: los agentes llaman a `diffs` con `mode: "view"` y abren `details.viewerUrl` con `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de archivos por chat: los agentes llaman a `diffs` con `mode: "file"` y envían `details.filePath` con `message` mediante `path` o `filePath`.
      </Tab>
      <Tab title="both">
        Combinado (predeterminado): los agentes llaman a `diffs` con `mode: "both"` para obtener ambos artefactos en una sola llamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Deshabilitar la guía integrada del sistema

Para conservar la herramienta, pero eliminar la guía antepuesta al prompt del sistema, establezca `plugins.entries.diffs.hooks.allowPromptInjection` en `false`:

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

Esto bloquea el hook `before_prompt_build` del Plugin, pero mantiene disponibles la herramienta y la skill. Para deshabilitar tanto la guía como la herramienta, deshabilite el Plugin.

## Referencia de entrada de la herramienta

Todos los campos son opcionales, salvo que se indique lo contrario.

<ParamField path="before" type="string">
  Texto original. Obligatorio junto con `after` cuando se omite `patch`.
</ParamField>
<ParamField path="after" type="string">
  Texto actualizado. Obligatorio junto con `before` cuando se omite `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diff unificado. Mutuamente excluyente con `before` y `after`.
</ParamField>
<ParamField path="path" type="string">
  Nombre de archivo mostrado para el modo anterior/posterior.
</ParamField>
<ParamField path="lang" type="string">
  Sugerencia para sustituir el lenguaje del modo anterior/posterior. Los valores desconocidos y los lenguajes que no pertenecen al conjunto predeterminado del visor usan texto sin formato, salvo que esté instalado el Plugin Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Sustitución del título del visor.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de salida. El valor predeterminado es el del Plugin, `defaults.mode` (`both`). Alias obsoleto: `"image"` se comporta de manera idéntica a `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema del visor. El valor predeterminado es el del Plugin, `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diseño del diff. El valor predeterminado es el del Plugin, `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande las secciones sin cambios cuando está disponible el contexto completo. Opción exclusiva de cada llamada (no es una clave predeterminada del Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato del archivo renderizado. El valor predeterminado es el del Plugin, `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preajuste de calidad para renderizar PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Sustitución de la escala del dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Anchura máxima de renderizado en píxeles CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL del artefacto en segundos para el visor y los archivos de salida independientes. Máximo: `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Sustitución del origen de la URL del visor. Sustituye el valor `viewerBaseUrl` del Plugin. Debe ser `http` o `https`, sin consulta ni hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Validación y límites">
    - `before`/`after`: máximo de 512 KiB cada uno.
    - `patch`: máximo de 2 MiB.
    - `path`: máximo de 2048 bytes.
    - `lang`: máximo de 128 bytes.
    - `title`: máximo de 1024 bytes.
    - Límite de complejidad del parche: máximo de 128 archivos y 120000 líneas en total.
    - Se rechaza `patch` junto con `before`/`after`.
    - Límites de seguridad del archivo renderizado (PNG y PDF):
      - `fileQuality: "standard"`: máximo de 8 MP (8,000,000 píxeles renderizados).
      - `fileQuality: "hq"`: máximo de 14 MP.
      - `fileQuality: "print"`: máximo de 24 MP.
      - El PDF también tiene un límite de 50 páginas.

  </Accordion>
</AccordionGroup>

## Resaltado de sintaxis

Lenguajes integrados:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` y `toml`.

Los alias habituales (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, etc.) se normalizan a esos lenguajes.

Instale el Plugin Diff Viewer Language Pack para disponer de más lenguajes (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff y más):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Sin el paquete, los lenguajes no compatibles se siguen renderizando como texto sin formato legible. Consulte el [Plugin Diffs Language Pack](/es/plugins/reference/diffs-language-pack) y los [lenguajes de Shiki](https://shiki.style/languages) para ver el catálogo del proyecto de origen.

## Contrato de detalles de salida

Todos los resultados correctos incluyen `changed`: una entrada anterior/posterior idéntica devuelve `false` sin crear ningún artefacto; los resultados renderizados devuelven `true`.

<AccordionGroup>
  <Accordion title="Campos del visor (modos view y both)">
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
  <Accordion title="Campos del archivo (modos file y both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (el mismo valor que `filePath`, para garantizar la compatibilidad con la herramienta de mensajes)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Modo     | Devuelve                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `"view"` | Solo los campos del visor.                                                                                     |
| `"file"` | Solo los campos del archivo, sin artefacto del visor.                                                          |
| `"both"` | Los campos del visor y los del archivo. Si falla el renderizado del archivo, el visor se devuelve con `fileError`. |

### Secciones sin cambios contraídas

El visor muestra filas como `N unmodified lines`. Los controles para expandir solo aparecen cuando la diferencia renderizada contiene datos de contexto expandibles (habitual en entradas de antes/después). Muchos parches unificados omiten los cuerpos de contexto en sus bloques, por lo que la fila puede aparecer sin un control para expandir; es el comportamiento esperado, no un error. `expandUnchanged` solo se aplica cuando existe contexto expandible.

### Navegación entre varios archivos

Los parches que afectan a más de un archivo comienzan con una tarjeta de resumen de archivos modificados: recuentos totales de `+N` / `-N`, recuentos por archivo, insignias de archivo añadido/eliminado/renombrado y enlaces de anclaje que llevan a cada archivo. Los archivos PNG/PDF renderizados conservan los recuentos del encabezado de cada archivo, pero omiten los controles interactivos de cambio de vista, ya que no funcionan en un archivo estático.

## Valores predeterminados del Plugin

Configure los valores predeterminados para todo el Plugin en `~/.openclaw/openclaw.json`:

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

Claves de `defaults` compatibles: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Los parámetros explícitos de la llamada a la herramienta prevalecen sobre estos valores.

### Configuración de URL persistente del visor

<ParamField path="viewerBaseUrl" type="string">
  Alternativa propiedad del Plugin para los enlaces del visor devueltos cuando una llamada a una herramienta no proporciona `baseUrl`. Debe ser `http` o `https`, sin consulta ni hash.
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
  `false`: se deniegan las solicitudes que no provengan de la interfaz de bucle invertido a las rutas del visor. `true`: se permiten visores remotos si la ruta con token es válida.
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

- Los artefactos se almacenan en `$TMPDIR/openclaw-diffs`.
- Los metadatos del visor almacenan un ID de artefacto aleatorio de 20 caracteres hexadecimales, un token aleatorio de 48 caracteres hexadecimales, `createdAt`/`expiresAt` y la ruta almacenada de `viewer.html`.
- TTL predeterminado de los artefactos: 30 minutos. TTL máximo aceptado: 6 horas.
- La limpieza se ejecuta de forma oportunista después de cada llamada de creación de artefactos; los artefactos caducados se eliminan.
- El barrido de respaldo elimina las carpetas obsoletas con más de 24 horas de antigüedad cuando faltan los metadatos.

## URL del visor y comportamiento de red

Ruta del visor: `/plugins/diffs/view/{artifactId}/{token}`

Recursos del visor:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (solo cuando el diff usa un idioma de un paquete de idiomas)

El documento del visor resuelve estos recursos en relación con la URL del visor, por lo que un prefijo de ruta `baseUrl` opcional también se aplica a las solicitudes de recursos.

Orden de resolución de la URL: `baseUrl` de la llamada a la herramienta (tras una validación estricta) -> `viewerBaseUrl` del plugin -> valor predeterminado de bucle invertido `127.0.0.1`. Si el modo de enlace del Gateway es `custom` y se establece `gateway.customBindHost`, se usa ese host en lugar del bucle invertido.

Reglas de `baseUrl`: debe ser `http://` o `https://`; se rechazan la consulta y el fragmento; se permite el origen con una ruta base opcional.

## Modelo de seguridad

<AccordionGroup>
  <Accordion title="Refuerzo del visor">
    - Solo bucle invertido de forma predeterminada.
    - Rutas del visor con tokens y validación estricta de los patrones del ID y del token.
    - CSP de la respuesta del visor: `default-src 'none'`; scripts y recursos solo desde el mismo origen; sin `connect-src` saliente.
    - Limitación de intentos fallidos remotos cuando el acceso remoto está habilitado: 40 fallos en 60 segundos activan un bloqueo de 60 segundos (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Refuerzo de la renderización de archivos">
    - El enrutamiento de solicitudes del navegador para capturas de pantalla se deniega de forma predeterminada.
    - Solo se permiten recursos locales del visor de `http://127.0.0.1/plugins/diffs/assets/*`.
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
    Rutas de instalación habituales y búsquedas en `PATH` para Chrome, Chromium, Edge y Brave.
  </Step>
</Steps>

Texto de error habitual: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Para solucionarlo, instale Chrome, Chromium, Edge o Brave, o configure una de las opciones de ruta del ejecutable indicadas anteriormente.

  ## Solución de problemas

  <AccordionGroup>
  <Accordion title="Errores de validación de entrada">
    - `Provide patch or both before and after text.` -- incluya tanto `before` como `after`, o proporcione `patch`.
    - `Provide either patch or before/after input, not both.` -- no mezcle modos de entrada.
    - `Invalid baseUrl: ...` -- use un origen `http(s)` con una ruta opcional, sin consulta ni hash.
    - `{field} exceeds maximum size (...)` -- reduzca el tamaño de la carga útil.
    - Rechazo de parches grandes -- reduzca la cantidad de archivos del parche o el total de líneas.

  </Accordion>
  <Accordion title="Accesibilidad del visor">
    - La URL del visor se resuelve como `127.0.0.1` de forma predeterminada.
    - Para el acceso remoto, establezca `viewerBaseUrl` en el plugin, pase `baseUrl` en cada llamada o use `gateway.bind=custom` con `gateway.customBindHost`.
    - Si `gateway.trustedProxies` incluye la dirección de bucle invertido para un proxy del mismo host (por ejemplo, Tailscale Serve), las solicitudes sin procesar del visor mediante bucle invertido que no tengan encabezados reenviados con la IP del cliente se rechazan de forma segura por diseño.
    - Para esa topología de proxy, prefiera `mode: "file"`/`"both"` para un archivo adjunto, o habilite deliberadamente `security.allowRemoteViewer` junto con `viewerBaseUrl` en el plugin o un `baseUrl` del proxy para obtener un enlace compartible al visor.
    - Habilite `security.allowRemoteViewer` solo cuando se pretenda permitir el acceso externo al visor.

  </Accordion>
  <Accordion title="La fila de líneas sin modificar no tiene botón para expandir">
    Esto es lo esperado para una entrada de parche que carece de contexto expandible; no es un fallo del visor.
  </Accordion>
  <Accordion title="Artefacto no encontrado">
    - El artefacto caducó debido al TTL.
    - El token o la ruta cambiaron.
    - La limpieza eliminó los datos obsoletos.

  </Accordion>
</AccordionGroup>

## Guía operativa

- Se recomienda `mode: "view"` para revisiones interactivas locales en el lienzo.
- Se recomienda `mode: "file"` para canales de chat salientes que necesitan un archivo adjunto.
- Mantenga `allowRemoteViewer` deshabilitado, salvo que el despliegue requiera URL de visor remoto.
- Establezca un valor corto explícito de `ttlSeconds` para diffs confidenciales.
- Evite enviar secretos en la entrada del diff cuando no sea necesario.
- Si el canal comprime las imágenes de forma agresiva (por ejemplo, Telegram o WhatsApp), se recomienda generar un PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderizado de diffs desarrollado por [Diffs](https://diffs.com).
</Note>

## Contenido relacionado

- [Navegador](/es/tools/browser)
- [Plugins](/es/tools/plugin)
- [Descripción general de las herramientas](/es/tools)
