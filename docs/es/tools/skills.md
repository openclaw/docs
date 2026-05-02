---
read_when:
    - Agregar o modificar Skills
    - Cambiar el control de activación de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: 'Skills: administradas frente a las del espacio de trabajo, reglas de control, listas de agentes permitidos e integración de configuración'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:07:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa carpetas de Skills **compatibles con [AgentSkills](https://agentskills.io)** para enseñar al agente cómo usar herramientas. Cada Skill es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga Skills incluidas más sobrescrituras locales opcionales, y las filtra en tiempo de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga Skills desde estas fuentes, **de mayor a menor precedencia**:

| #   | Fuente                         | Ruta                             |
| --- | ------------------------------ | -------------------------------- |
| 1   | Skills del espacio de trabajo  | `<workspace>/skills`             |
| 2   | Skills del agente del proyecto | `<workspace>/.agents/skills`     |
| 3   | Skills personales del agente   | `~/.agents/skills`               |
| 4   | Skills gestionadas/locales     | `~/.openclaw/skills`             |
| 5   | Skills incluidas               | incluidas con la instalación     |
| 6   | Carpetas de Skills adicionales | `skills.load.extraDirs` (config) |

Si un nombre de Skill entra en conflicto, gana la fuente de mayor precedencia.

El directorio nativo `$CODEX_HOME/skills` de Codex CLI no es una de estas raíces de Skills de OpenClaw. En modo arnés de Codex, los lanzamientos locales del servidor de la aplicación usan hogares de Codex aislados por agente, por lo que las Skills personales de Codex CLI no se cargan de forma implícita. Usa `openclaw migrate codex --dry-run` para inventariarlas y `openclaw migrate codex` para elegir directorios de Skills con una indicación interactiva de casillas antes de copiarlos en el espacio de trabajo actual del agente de OpenClaw. Para ejecuciones no interactivas, repite `--skill <name>` para las Skills exactas que se deben copiar.

## Skills por agente frente a compartidas

En configuraciones **multiagente**, cada agente tiene su propio espacio de trabajo:

| Ámbito                      | Ruta                                        | Visible para                           |
| --------------------------- | ------------------------------------------- | -------------------------------------- |
| Por agente                  | `<workspace>/skills`                        | Solo ese agente                        |
| Agente del proyecto         | `<workspace>/.agents/skills`                | Solo el agente de ese espacio de trabajo |
| Agente personal             | `~/.agents/skills`                          | Todos los agentes de esa máquina       |
| Gestionadas/locales compartidas | `~/.openclaw/skills`                    | Todos los agentes de esa máquina       |
| Directorios extra compartidos | `skills.load.extraDirs` (menor precedencia) | Todos los agentes de esa máquina       |

Mismo nombre en varios lugares → gana la fuente de mayor precedencia. El espacio de trabajo supera al agente del proyecto, que supera al agente personal, que supera a gestionadas/locales, que supera a las incluidas, que supera a los directorios extra.

## Listas de permitidos de Skills por agente

La **ubicación** de la Skill y la **visibilidad** de la Skill son controles separados. La ubicación/precedencia decide qué copia de una Skill con el mismo nombre gana; las listas de permitidos del agente deciden qué Skills puede usar realmente un agente.

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
  <Accordion title="Reglas de lista de permitidos">
    - Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Define `agents.list[].skills: []` para no permitir ninguna Skill.
    - Una lista no vacía `agents.list[].skills` es el conjunto **final** para ese agente; no se fusiona con los valores predeterminados.
    - La lista de permitidos efectiva se aplica a la construcción de prompts, el descubrimiento de comandos de barra de Skills, la sincronización del sandbox y las instantáneas de Skills.
  </Accordion>
</AccordionGroup>

## Plugins y Skills

Los Plugins pueden incluir sus propias Skills listando directorios `skills` en `openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las Skills de Plugin se cargan cuando el Plugin está habilitado. Este es el lugar adecuado para guías operativas específicas de herramientas que son demasiado largas para la descripción de la herramienta, pero que deberían estar disponibles siempre que el Plugin esté instalado; por ejemplo, el Plugin del navegador incluye una Skill `browser-automation` para el control del navegador en varios pasos.

Los directorios de Skills de Plugin se fusionan en la misma ruta de baja precedencia que `skills.load.extraDirs`, por lo que una Skill incluida, gestionada, de agente o de espacio de trabajo con el mismo nombre los sobrescribe. Puedes condicionarlas mediante `metadata.openclaw.requires.config` en la entrada de configuración del Plugin.

Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Herramientas](/es/tools) para la superficie de herramientas que enseñan esas Skills.

## Taller de Skills

El Plugin opcional y experimental **Taller de Skills** puede crear o actualizar Skills del espacio de trabajo a partir de procedimientos reutilizables observados durante el trabajo del agente. Está deshabilitado de forma predeterminada y debe habilitarse explícitamente mediante `plugins.entries.skill-workshop`.

Taller de Skills escribe solo en `<workspace>/skills`, analiza el contenido generado, admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena propuestas inseguras y actualiza la instantánea de Skills después de escrituras correctas para que las nuevas Skills estén disponibles sin reiniciar el Gateway.

Úsalo para correcciones como _"la próxima vez, verifica la atribución de GIF"_ o flujos de trabajo aprendidos con esfuerzo, como listas de comprobación de QA de medios. Empieza con aprobación pendiente; usa escrituras automáticas solo en espacios de trabajo de confianza después de revisar sus propuestas. Guía completa: [Plugin Taller de Skills](/es/plugins/skill-workshop).

## ClawHub (instalación y sincronización)

[ClawHub](https://clawhub.ai) es el registro público de Skills para OpenClaw. Usa comandos nativos `openclaw skills` para descubrir/instalar/actualizar, o la CLI separada `clawhub` para flujos de publicación/sincronización. Guía completa: [ClawHub](/es/tools/clawhub).

| Acción                                      | Comando                                |
| ------------------------------------------- | -------------------------------------- |
| Instalar una Skill en el espacio de trabajo | `openclaw skills install <skill-slug>` |
| Actualizar todas las Skills instaladas      | `openclaw skills update --all`         |
| Sincronizar (analizar + publicar actualizaciones) | `clawhub sync --all`              |

`openclaw skills install` nativo instala en el directorio `skills/` del espacio de trabajo activo. La CLI separada `clawhub` también instala en `./skills` bajo tu directorio de trabajo actual (o recurre al espacio de trabajo de OpenClaw configurado). OpenClaw lo detecta como `<workspace>/skills` en la siguiente sesión. Las raíces de Skills configuradas también admiten un nivel de agrupación, como `skills/<group>/<skill>/SKILL.md`, para que las Skills de terceros relacionadas puedan mantenerse bajo una carpeta compartida sin análisis recursivo amplio.

Las páginas de Skills de ClawHub exponen el estado del análisis de seguridad más reciente antes de la instalación, con páginas de detalle del analizador para VirusTotal, ClawScan y análisis estático. `openclaw skills install <slug>` sigue siendo solo la ruta de instalación; los publicadores recuperan falsos positivos mediante el panel de ClawHub o `clawhub skill rescan <slug>`.

## Seguridad

<Warning>
Trata las Skills de terceros como **código no confiable**. Léelas antes de habilitarlas. Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta [Sandboxing](/es/gateway/sandboxing) para los controles del lado del agente.
</Warning>

- El descubrimiento de Skills del espacio de trabajo y de directorios extra solo acepta raíces de Skills y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de Skills respaldadas por Gateway (`skills.install`, incorporación y la interfaz de configuración de Skills) ejecutan el analizador integrado de código peligroso antes de ejecutar metadatos del instalador. Los hallazgos `critical` bloquean de forma predeterminada salvo que el llamador establezca explícitamente la anulación de peligro; los hallazgos sospechosos siguen mostrando solo una advertencia.
- `openclaw skills install <slug>` es diferente: descarga una carpeta de Skill de ClawHub en el espacio de trabajo y no usa la ruta de metadatos del instalador anterior.
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

OpenClaw sigue la especificación AgentSkills para diseño/intención. El analizador usado por el agente integrado admite únicamente claves de frontmatter de **una sola línea**; `metadata` debe ser un **objeto JSON de una sola línea**. Usa `{baseDir}` en las instrucciones para hacer referencia a la ruta de la carpeta de la Skill.

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la interfaz de Skills de macOS. También se admite mediante `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la Skill se expone como comando de barra de usuario.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la Skill fuera del prompt normal del agente. La Skill sigue instalada y todavía puede ejecutarse explícitamente como comando de barra cuando `user-invocable` también es `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando de barra omite el modelo y se despacha directamente a una herramienta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se debe invocar cuando `command-dispatch: tool` está establecido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el despacho de herramientas, reenvía la cadena de argumentos sin procesar a la herramienta (sin análisis del núcleo). La herramienta se invoca con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Condicionamiento (filtros en tiempo de carga)

OpenClaw filtra Skills en tiempo de carga usando `metadata` (JSON de una sola línea):

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
  Cuando es `true`, incluye siempre la Skill (omite otras condiciones).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado por la interfaz de Skills de macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Sitio web" en la interfaz de Skills de macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Si se establece, la Skill solo es elegible en esos sistemas operativos.
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

Si no está presente `metadata.openclaw`, la Skill siempre es elegible (salvo que esté deshabilitada en la configuración o bloqueada por `skills.allowBundled` para Skills incluidas).

<Note>
Los bloques heredados `metadata.clawdbot` todavía se aceptan cuando `metadata.openclaw` está ausente, por lo que las Skills instaladas antiguas conservan sus condiciones de dependencias y sugerencias de instalador. Las Skills nuevas y actualizadas deben usar `metadata.openclaw`.
</Note>

### Notas de sandboxing

- `requires.bins` se comprueba en el **host** en tiempo de carga de la Skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**. Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada). `setupCommand` se ejecuta una vez después de crear el contenedor. Las instalaciones de paquetes también requieren salida de red, un sistema de archivos raíz escribible y un usuario root en el sandbox.
- Ejemplo: la Skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize` en el contenedor del sandbox para ejecutarse allí.

### Especificaciones del instalador

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
  <Accordion title="Reglas de selección del instalador">
    - Si se listan varios instaladores, el Gateway elige una sola opción preferida (brew cuando esté disponible; de lo contrario, Node).
    - Si todos los instaladores son `download`, OpenClaw lista cada entrada para que puedas ver los artefactos disponibles.
    - Las especificaciones del instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json` (valor predeterminado: npm; opciones: npm/pnpm/yarn/bun). Esto solo afecta a las instalaciones de Skills; el runtime del Gateway debe seguir siendo Node: no se recomienda Bun para WhatsApp/Telegram.
    - La selección de instalador respaldada por el Gateway se basa en preferencias: cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando `skills.install.preferBrew` está habilitado y `brew` existe, luego `uv`, luego el administrador de Node configurado y después otros respaldos como `go` o `download`.
    - Si todas las especificaciones de instalación son `download`, OpenClaw muestra todas las opciones de descarga en lugar de reducirlas a un solo instalador preferido.

  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Instalaciones de Go:** si falta `go` y `brew` está disponible, el Gateway instala Go primero mediante Homebrew y establece `GOBIN` en el `bin` de Homebrew cuando es posible.
    - **Instalaciones por descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta un archivo), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Anulaciones de configuración

Las Skills incluidas y administradas se pueden activar o desactivar y se les pueden proporcionar valores de entorno
en `skills.entries` dentro de `~/.openclaw/openclaw.json`:

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
  `false` deshabilita la Skill incluso si está incluida o instalada.
  La Skill incluida `coding-agent` requiere activación explícita: establece
  `skills.entries.coding-agent.enabled: true` antes de exponerla a agentes,
  y luego asegúrate de que una de `claude`, `codex`, `opencode` o `pi` esté instalada y
  autenticada para su propia CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo práctico para Skills que declaran `metadata.openclaw.primaryEnv`. Admite texto sin formato o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Se inyecta solo si la variable aún no está establecida en el proceso.
</ParamField>
<ParamField path="config" type="object">
  Contenedor opcional para campos personalizados por Skill. Las claves personalizadas deben estar aquí.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **incluidas**. Si se establece, solo las Skills incluidas en la lista son elegibles (las Skills administradas/de espacio de trabajo no se ven afectadas).
</ParamField>

Si el nombre de la Skill contiene guiones, pon la clave entre comillas (JSON5 permite
claves entre comillas). Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada; si una Skill
define `metadata.openclaw.skillKey`, usa esa clave en `skills.entries`.

<Note>
Para la generación/edición de imágenes estándar dentro de OpenClaw, usa la herramienta central
`image_generate` con `agents.defaults.imageGenerationModel` en lugar
de una Skill incluida. Los ejemplos de Skills aquí son para flujos de trabajo personalizados o de terceros.
Para el análisis nativo de imágenes, usa la herramienta `image` con
`agents.defaults.imageModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de un proveedor, añade también la clave de
autenticación/API de ese proveedor.
</Note>

## Inyección de entorno

Cuando comienza una ejecución de agente, OpenClaw:

1. Lee los metadatos de Skills.
2. Aplica `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` a `process.env`.
3. Construye el mensaje del sistema con Skills **elegibles**.
4. Restaura el entorno original cuando termina la ejecución.

La inyección de entorno está **limitada al ámbito de la ejecución del agente**, no a un entorno
global del shell.

Para la implementación incluida `claude-cli`, OpenClaw también materializa la misma
instantánea elegible como un Plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede usar entonces su resolutor nativo de Skills mientras
OpenClaw sigue controlando la precedencia, las listas de permitidos por agente, los controles de habilitación y
la inyección de entorno/clave API de `skills.entries.*`. Otras implementaciones de CLI usan solo el
catálogo de mensajes.

## Instantáneas y actualización

OpenClaw captura una instantánea de las Skills **elegibles** cuando comienza una sesión y
reutiliza esa lista para turnos posteriores en la misma sesión. Los cambios en
Skills o en la configuración surten efecto en la siguiente sesión nueva.

Las Skills pueden actualizarse a mitad de sesión en dos casos:

- El observador de Skills está habilitado.
- Aparece un nuevo Node remoto elegible.

Piensa en esto como una **recarga en caliente**: la lista actualizada se usa en el
siguiente turno del agente. Si la lista de permitidos efectiva de Skills del agente cambia para esa
sesión, OpenClaw actualiza la instantánea para que las Skills visibles permanezcan alineadas
con el agente actual.

### Observador de Skills

De forma predeterminada, OpenClaw observa las carpetas de Skills y actualiza la instantánea de Skills
cuando cambian los archivos `SKILL.md`. Configura esto en `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Nodes macOS remotos (Gateway Linux)

Si el Gateway se ejecuta en Linux pero hay un **Node macOS** conectado con
`system.run` permitido (la seguridad de aprobaciones de ejecución no está establecida en `deny`),
OpenClaw puede tratar las Skills solo para macOS como elegibles cuando los
binarios requeridos están presentes en ese Node. El agente debe ejecutar esas Skills
mediante la herramienta `exec` con `host=node`.

Esto depende de que el Node informe su compatibilidad con comandos y de un sondeo de binarios
mediante `system.which` o `system.run`. Los Nodes sin conexión **no** hacen
visibles las Skills solo remotas. Si un Node conectado deja de responder a los sondeos de
binarios, OpenClaw borra sus coincidencias de binarios en caché para que los agentes ya no vean
Skills que no pueden ejecutarse allí en este momento.

## Impacto en tokens

Cuando hay Skills elegibles, OpenClaw inyecta una lista XML compacta de Skills disponibles
en el mensaje del sistema (mediante `formatSkillsForPrompt` en
`pi-coding-agent`). El costo es determinista:

- **Sobrecarga base** (solo cuando hay ≥1 Skill): 195 caracteres.
- **Por Skill:** 97 caracteres + la longitud de los valores XML escapados de `<name>`, `<description>` y `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

El escape XML expande `& < > " '` a entidades (`&amp;`, `&lt;`, etc.),
lo que aumenta la longitud. Los recuentos de tokens varían según el tokenizador del modelo. Una estimación aproximada
al estilo OpenAI es de ~4 caracteres/token, así que **97 caracteres ≈ 24 tokens** por
Skill más las longitudes reales de tus campos.

## Ciclo de vida de Skills administradas

OpenClaw incluye un conjunto base de Skills como **Skills incluidas** con la
instalación (paquete npm u OpenClaw.app). `~/.openclaw/skills` existe para
anulaciones locales; por ejemplo, fijar o parchear una Skill sin
cambiar la copia incluida. Las Skills del espacio de trabajo pertenecen al usuario y tienen prioridad
sobre ambas en caso de conflictos de nombre.

## ¿Buscas más Skills?

Explora [https://clawhub.ai](https://clawhub.ai). Esquema de configuración
completo: [Configuración de Skills](/es/tools/skills-config).

## Relacionado

- [ClawHub](/es/tools/clawhub) — registro público de Skills
- [Crear Skills](/es/tools/creating-skills) — crear Skills personalizadas
- [Plugins](/es/tools/plugin) — descripción general del sistema de Plugins
- [Plugin Skill Workshop](/es/plugins/skill-workshop) — generar Skills a partir del trabajo del agente
- [Configuración de Skills](/es/tools/skills-config) — referencia de configuración de Skills
- [Comandos de barra diagonal](/es/tools/slash-commands) — todos los comandos de barra diagonal disponibles
