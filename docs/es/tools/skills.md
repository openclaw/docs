---
read_when:
    - Añadir o modificar Skills
    - Cambiar el control de acceso de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: 'Skills: gestionadas frente a de espacio de trabajo, reglas de control, listas de permitidos de agentes y conexión de configuración'
title: Skills
x-i18n:
    generated_at: "2026-05-11T20:57:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa carpetas de habilidades **compatibles con [AgentSkills](https://agentskills.io)** para enseñar al agente cómo usar herramientas. Cada habilidad es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga las habilidades incluidas junto con sobrescrituras locales opcionales, y las filtra en el momento de la carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga habilidades desde estas fuentes, **con la mayor precedencia primero**:

| #   | Origen                | Ruta                             |
| --- | --------------------- | -------------------------------- |
| 1   | Habilidades del espacio de trabajo | `<workspace>/skills`             |
| 2   | Habilidades de agente del proyecto | `<workspace>/.agents/skills`     |
| 3   | Habilidades de agente personales | `~/.agents/skills`               |
| 4   | Habilidades gestionadas/locales | `~/.openclaw/skills`             |
| 5   | Habilidades incluidas | enviadas con la instalación      |
| 6   | Carpetas de habilidades adicionales | `skills.load.extraDirs` (configuración) |

Si el nombre de una habilidad entra en conflicto, gana la fuente más alta.

El directorio nativo `$CODEX_HOME/skills` de Codex CLI no es una de estas raíces de habilidades de OpenClaw. En el modo de arnés de Codex, los lanzamientos locales del servidor de aplicación usan directorios de inicio de Codex aislados por agente, por lo que las habilidades personales de Codex CLI no se cargan implícitamente. Usa `openclaw migrate codex --dry-run` para inventariarlas y `openclaw migrate codex` para elegir directorios de habilidades con una solicitud interactiva de casillas antes de copiarlos al espacio de trabajo actual del agente de OpenClaw. Para ejecuciones no interactivas, repite `--skill <name>` para las habilidades exactas que quieres copiar.

## Habilidades por agente frente a compartidas

En configuraciones **multiagente**, cada agente tiene su propio espacio de trabajo:

| Ámbito                | Ruta                                        | Visible para                 |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente            | `<workspace>/skills`                        | Solo ese agente             |
| Agente del proyecto   | `<workspace>/.agents/skills`                | Solo el agente de ese espacio de trabajo |
| Agente personal       | `~/.agents/skills`                          | Todos los agentes de esa máquina |
| Gestionadas/locales compartidas | `~/.openclaw/skills`                        | Todos los agentes de esa máquina |
| Directorios adicionales compartidos | `skills.load.extraDirs` (menor precedencia) | Todos los agentes de esa máquina |

Mismo nombre en varios lugares → gana la fuente más alta. El espacio de trabajo supera al agente del proyecto, que supera al agente personal, que supera a gestionadas/locales, que supera a incluidas, que supera a directorios adicionales.

## Listas de permitidos de habilidades de agente

La **ubicación** de una habilidad y la **visibilidad** de una habilidad son controles separados. La ubicación/precedencia decide qué copia de una habilidad con el mismo nombre gana; las listas de permitidos de agentes deciden qué habilidades puede usar realmente un agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de listas de permitidos">
    - Omite `agents.defaults.skills` para permitir habilidades sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Define `agents.list[].skills: []` para no permitir habilidades.
    - Una lista no vacía `agents.list[].skills` es el conjunto **final** para ese agente; no se combina con los valores predeterminados.
    - La lista de permitidos efectiva se aplica a la construcción de prompts, el descubrimiento de comandos slash de habilidades, la sincronización de sandbox y las instantáneas de habilidades.
  </Accordion>
</AccordionGroup>

## Plugins y habilidades

Los plugins pueden incluir sus propias habilidades enumerando directorios `skills` en `openclaw.plugin.json` (rutas relativas a la raíz del plugin). Las habilidades de plugin se cargan cuando el plugin está habilitado. Este es el lugar adecuado para guías operativas específicas de herramientas que son demasiado largas para la descripción de la herramienta, pero que deberían estar disponibles siempre que el plugin esté instalado; por ejemplo, el plugin de navegador incluye una habilidad `browser-automation` para el control de navegador de varios pasos.

Los directorios de habilidades de plugin se fusionan en la misma ruta de baja precedencia que `skills.load.extraDirs`, por lo que una habilidad incluida, gestionada, de agente o de espacio de trabajo con el mismo nombre los sobrescribe. Puedes condicionarlos mediante `metadata.openclaw.requires.config` en la entrada de configuración del plugin.

Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Herramientas](/es/tools) para la superficie de herramientas que enseñan esas habilidades.

## Skill Workshop

El plugin opcional y experimental **Skill Workshop** puede crear o actualizar habilidades del espacio de trabajo a partir de procedimientos reutilizables observados durante el trabajo del agente. Está deshabilitado de forma predeterminada y debe habilitarse explícitamente mediante `plugins.entries.skill-workshop`.

Skill Workshop escribe solo en `<workspace>/skills`, escanea el contenido generado, admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena propuestas no seguras y actualiza la instantánea de habilidades después de escrituras correctas para que las nuevas habilidades estén disponibles sin reiniciar el Gateway.

Úsalo para correcciones como _"la próxima vez, verifica la atribución de GIF"_ o flujos de trabajo aprendidos con esfuerzo, como listas de comprobación de QA de medios. Empieza con aprobación pendiente; usa escrituras automáticas solo en espacios de trabajo de confianza después de revisar sus propuestas. Guía completa: [plugin Skill Workshop](/es/plugins/skill-workshop).

## ClawHub (instalación y sincronización)

[ClawHub](https://clawhub.ai) es el registro público de habilidades para OpenClaw. Usa los comandos nativos `openclaw skills` para descubrir/instalar/actualizar, o la CLI independiente `clawhub` para flujos de trabajo de publicación/sincronización. Guía completa: [ClawHub](/es/clawhub).

| Acción                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar una habilidad en el espacio de trabajo | `openclaw skills install <skill-slug>` |
| Actualizar todas las habilidades instaladas | `openclaw skills update --all`         |
| Sincronizar (escanear + publicar actualizaciones) | `clawhub sync --all`                   |

`openclaw skills install` nativo instala en el directorio `skills/` del espacio de trabajo activo. La CLI independiente `clawhub` también instala en `./skills` dentro de tu directorio de trabajo actual (o recurre al espacio de trabajo de OpenClaw configurado). OpenClaw lo recoge como `<workspace>/skills` en la siguiente sesión. Las raíces de habilidades configuradas también admiten un nivel de agrupación, como `skills/<group>/<skill>/SKILL.md`, para que las habilidades de terceros relacionadas puedan mantenerse bajo una carpeta compartida sin un escaneo recursivo amplio.

Los clientes de Gateway que necesitan entrega privada ajena a ClawHub pueden preparar un archivo zip de habilidad con `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`, y luego instalar la carga confirmada con `skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. Esta es una ruta explícita de carga de administrador para clientes de confianza, no el flujo normal de `openclaw skills install <slug>` ni de instalación de ClawHub. Está desactivada de forma predeterminada y solo funciona cuando `skills.install.allowUploadedArchives: true` está definido en `openclaw.json`. El modo de carga sigue instalando en el directorio predeterminado del espacio de trabajo del agente `skills/<slug>`; el nombre de la carpeta interna del archivo se ignora para el destino final de instalación.

Las páginas de habilidades de ClawHub exponen el estado más reciente del escaneo de seguridad antes de la instalación, con páginas de detalle del escáner para VirusTotal, ClawScan y análisis estático. `openclaw skills install <slug>` sigue siendo solo la ruta de instalación; los publicadores recuperan falsos positivos mediante el panel de ClawHub o `clawhub skill rescan <slug>`.

## Seguridad

<Warning>
Trata las habilidades de terceros como **código no confiable**. Léelas antes de habilitarlas. Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta [Sandboxing](/es/gateway/sandboxing) para los controles del lado del agente.
</Warning>

- El descubrimiento de habilidades de espacio de trabajo y directorios adicionales solo acepta raíces de habilidades y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de archivos privados de Gateway están desactivadas de forma predeterminada. Cuando se habilitan explícitamente, requieren una carga zip confirmada que contenga `SKILL.md` y reutilizan las mismas protecciones de extracción de archivos, recorrido de rutas, enlaces simbólicos, forzado y reversión que las instalaciones de habilidades de ClawHub. Están protegidas por `skills.install.allowUploadedArchives`; las instalaciones normales de ClawHub no requieren esa configuración.
- Las instalaciones de dependencias de habilidades respaldadas por Gateway (`skills.install`, incorporación y la interfaz de configuración de Skills) ejecutan el escáner integrado de código peligroso antes de ejecutar metadatos de instalador. Los hallazgos `critical` bloquean de forma predeterminada salvo que el llamador defina explícitamente la sobrescritura peligrosa; los hallazgos sospechosos siguen solo advirtiendo.
- `openclaw skills install <slug>` es diferente: descarga una carpeta de habilidad de ClawHub en el espacio de trabajo y no usa la ruta de metadatos de instalador anterior.
- `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el proceso **host** para ese turno del agente (no en el sandbox). Mantén los secretos fuera de prompts y registros.

Para un modelo de amenazas y listas de comprobación más amplios, consulta [Seguridad](/es/gateway/security).

## Formato de SKILL.md

`SKILL.md` debe incluir al menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw sigue la especificación de AgentSkills para diseño/intención. El parser usado por el agente integrado solo admite claves de frontmatter de **una sola línea**; `metadata` debe ser un **objeto JSON de una sola línea**. Usa `{baseDir}` en las instrucciones para hacer referencia a la ruta de la carpeta de la habilidad.

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la interfaz de Skills de macOS. También compatible mediante `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la habilidad se expone como un comando slash de usuario.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la habilidad fuera del prompt normal del agente. La habilidad sigue instalada y aún puede ejecutarse explícitamente como comando slash cuando `user-invocable` también es `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Cuando se define como `tool`, el comando slash omite el modelo y se despacha directamente a una herramienta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invocará cuando `command-dispatch: tool` esté definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho a herramienta, reenvía la cadena de argumentos sin procesar a la herramienta (sin análisis del core). La herramienta se invoca con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Condicionamiento (filtros en tiempo de carga)

OpenClaw filtra habilidades en el momento de la carga usando `metadata` (JSON de una sola línea):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campos bajo `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Cuando es `true`, incluye siempre la skill (omite las demás puertas).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado por la interfaz de Skills de macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional que se muestra como "Sitio web" en la interfaz de Skills de macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Si se establece, la skill solo es apta en esos SO.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Cada uno debe existir en `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Al menos uno debe existir en `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variable de entorno debe existir o proporcionarse en la configuración.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista de rutas de `openclaw.json` que deben ser verdaderas.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nombre de variable de entorno asociado con `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificaciones opcionales de instalador usadas por la interfaz de Skills de macOS (brew/node/go/uv/download).
</ParamField>

Si no está presente `metadata.openclaw`, la skill siempre es apta (a menos que
esté deshabilitada en la configuración o bloqueada por `skills.allowBundled` para skills incluidas).

<Note>
Los bloques heredados `metadata.clawdbot` se siguen aceptando cuando
`metadata.openclaw` está ausente, por lo que las skills instaladas antiguas conservan sus
puertas de dependencia y sugerencias de instalador. Las skills nuevas y actualizadas deben usar
`metadata.openclaw`.
</Note>

### Notas de sandboxing

- `requires.bins` se comprueba en el **host** al cargar la skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**. Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada). `setupCommand` se ejecuta una vez después de crear el contenedor. Las instalaciones de paquetes también requieren salida de red, un FS raíz escribible y un usuario root en el sandbox.
- Ejemplo: la skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize` en el contenedor de sandbox para ejecutarse allí.

### Especificaciones de instalador

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Reglas de selección de instalador">
    - Si se enumeran varios instaladores, el gateway elige una única opción preferida (brew cuando está disponible; de lo contrario, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas ver los artefactos disponibles.
    - Las especificaciones de instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun). Esto solo afecta a las instalaciones de skills; el runtime del Gateway debe seguir siendo Node: Bun no se recomienda para WhatsApp/Telegram.
    - La selección de instalador respaldada por Gateway se basa en preferencias: cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando `skills.install.preferBrew` está habilitado y existe `brew`, luego `uv`, luego el gestor de node configurado y después otros recursos alternativos como `go` o `download`.
    - Si todas las especificaciones de instalación son `download`, OpenClaw muestra todas las opciones de descarga en lugar de reducirlas a un instalador preferido.

  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Instalaciones de Go:** si falta `go` y `brew` está disponible, el gateway instala primero Go mediante Homebrew y establece `GOBIN` en el `bin` de Homebrew cuando es posible.
    - **Instalaciones de descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta un archivo), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Sobrescrituras de configuración

Las skills incluidas y gestionadas pueden activarse o desactivarse y recibir valores de entorno
bajo `skills.entries` en `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` deshabilita la skill incluso si está incluida o instalada.
  La skill incluida `coding-agent` es optativa: establece
  `skills.entries.coding-agent.enabled: true` antes de exponerla a agentes,
  y luego asegúrate de que uno de `claude`, `codex`, `opencode` o `pi` esté instalado y
  autenticado para su propia CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Comodidad para skills que declaran `metadata.openclaw.primaryEnv`. Admite texto plano o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Se inyecta solo si la variable aún no está establecida en el proceso.
</ParamField>
<ParamField path="config" type="object">
  Bolsa opcional para campos personalizados por skill. Las claves personalizadas deben vivir aquí.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para skills **incluidas**. Si se establece, solo las skills incluidas en la lista son aptas (las skills gestionadas/de workspace no se ven afectadas).
</ParamField>

Si el nombre de la skill contiene guiones, pon la clave entre comillas (JSON5 permite claves
entre comillas). Las claves de configuración coinciden con el **nombre de la skill** de forma predeterminada; si una skill
define `metadata.openclaw.skillKey`, usa esa clave bajo `skills.entries`.

<Note>
Para generación/edición de imágenes de stock dentro de OpenClaw, usa la herramienta central
`image_generate` con `agents.defaults.imageGenerationModel` en lugar
de una skill incluida. Los ejemplos de skills aquí son para flujos de trabajo personalizados o de terceros. Para análisis nativo de imágenes, usa la herramienta `image` con
`agents.defaults.imageModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, añade también la clave
de auth/API de ese proveedor.
</Note>

## Inyección de entorno

Cuando se inicia una ejecución de agente, OpenClaw:

1. Lee los metadatos de skills.
2. Aplica `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` a `process.env`.
3. Construye el prompt del sistema con skills **aptas**.
4. Restaura el entorno original después de que finaliza la ejecución.

La inyección de entorno está **acotada a la ejecución del agente**, no a un entorno
global de shell.

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea apta como un Plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede entonces usar su resolver nativo de skills mientras
OpenClaw sigue controlando la precedencia, las listas de permitidos por agente, las puertas y
la inyección de entorno/clave API de `skills.entries.*`. Otros backends de CLI usan solo el
catálogo del prompt.

## Instantáneas y actualización

OpenClaw toma una instantánea de las skills aptas **cuando se inicia una sesión** y
reutiliza esa lista para turnos posteriores en la misma sesión. Los cambios en
skills o configuración tienen efecto en la siguiente sesión nueva.

Las Skills pueden actualizarse a mitad de sesión en dos casos:

- El observador de skills está habilitado.
- Aparece un nuevo nodo remoto apto.

Piensa en esto como una **recarga en caliente**: la lista actualizada se toma en el
siguiente turno del agente. Si la lista efectiva de skills permitidas del agente cambia para esa
sesión, OpenClaw actualiza la instantánea para que las skills visibles se mantengan alineadas
con el agente actual.

### Observador de Skills

De forma predeterminada, OpenClaw observa las carpetas de skills y aumenta la instantánea de skills
cuando cambian archivos `SKILL.md`. Configúralo bajo `skills.load`:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

Usa `allowSymlinkTargets` para diseños intencionales de repositorios hermanos donde una raíz de skill
integrada contiene un symlink, por ejemplo
`~/.agents/skills/manager -> ~/Projects/manager/skills`. La lista de destinos se
compara después de la resolución de realpath y debe mantenerse estrecha.

### Nodos macOS remotos (gateway Linux)

Si el Gateway se ejecuta en Linux pero hay un **nodo macOS** conectado con
`system.run` permitido (seguridad de aprobaciones de Exec no establecida en `deny`),
OpenClaw puede tratar skills solo para macOS como aptas cuando los binarios
requeridos están presentes en ese nodo. El agente debe ejecutar esas skills
mediante la herramienta `exec` con `host=node`.

Esto depende de que el nodo informe su soporte de comandos y de una comprobación de binarios
mediante `system.which` o `system.run`. Los nodos sin conexión **no** hacen
visibles las skills solo remotas. Si un nodo conectado deja de responder a comprobaciones de binarios,
OpenClaw borra sus coincidencias de binarios en caché para que los agentes ya no vean
skills que actualmente no pueden ejecutarse allí.

## Impacto en tokens

Cuando las skills son aptas, OpenClaw inyecta una lista XML compacta de skills
disponibles en el prompt del sistema (mediante `formatSkillsForPrompt` en
`pi-coding-agent`). El coste es determinista:

- **Sobrecarga base** (solo cuando hay ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + la longitud de los valores XML escapados `<name>`, `<description>` y `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

El escape XML expande `& < > " '` en entidades (`&amp;`, `&lt;`, etc.),
aumentando la longitud. Los recuentos de tokens varían según el tokenizador del modelo. Una estimación
aproximada al estilo de OpenAI es ~4 caracteres/token, por lo que **97 caracteres ≈ 24 tokens** por
skill más las longitudes reales de tus campos.

## Ciclo de vida de skills gestionadas

OpenClaw incluye un conjunto base de skills como **skills incluidas** con la
instalación (paquete npm u OpenClaw.app). `~/.openclaw/skills` existe para
sobrescrituras locales; por ejemplo, fijar o parchear una skill sin
cambiar la copia incluida. Las skills de workspace son propiedad del usuario y sobrescriben
ambas en conflictos de nombre.

## ¿Buscas más skills?

Explora [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuración:
[Configuración de Skills](/es/tools/skills-config).

## Relacionado

- [ClawHub](/es/clawhub) - registro público de skills
- [Crear skills](/es/tools/creating-skills) - creación de skills personalizadas
- [Plugins](/es/tools/plugin) - resumen del sistema de plugins
- [Plugin Skill Workshop](/es/plugins/skill-workshop) - generar skills a partir del trabajo del agente
- [Configuración de Skills](/es/tools/skills-config) - referencia de configuración de skills
- [Comandos de barra](/es/tools/slash-commands) - todos los comandos de barra disponibles
